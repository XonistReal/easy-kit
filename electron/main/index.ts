import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  AppSettings,
  ExportOptions,
  KitCustomization,
  SampleRecord,
  ScanOptions,
} from '../../src/shared/types'
import { buildRecentKitEntry, capRecentKits, exportKit } from './services/export'
import { assignFingerprintGroups } from './services/fingerprint'
import { resolveFlPacksPath } from './services/fl-paths'
import { importAudioFiles } from './services/import-audio-files'
import { importKit } from './services/import-kit'
import { applyTheme, deleteTheme, listThemes, saveTheme } from './services/kit-themes'
import { loadKitManifest } from './services/load-manifest'
import { createScanController, runScan } from './services/scan'
import { getSettings, saveSettings } from './services/settings'
import { getWaveformPeaks } from './services/waveform-peaks'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
let activeScanController: ReturnType<typeof createScanController> | null = null

const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Easy Kit Maker',
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(indexHtml)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

function getMainWindow(): BrowserWindow {
  if (!win) throw new Error('No main window')
  return win
}

ipcMain.handle('kit:select-folders', async () => {
  const settings = getSettings()
  const result = await dialog.showOpenDialog(getMainWindow(), {
    properties: ['openDirectory', 'multiSelections'],
    defaultPath: settings.defaultFlProjectsPath || settings.lastFolders[0],
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('kit:select-image-file', async () => {
  const result = await dialog.showOpenDialog(getMainWindow(), {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] },
    ],
  })
  return result.canceled ? '' : result.filePaths[0]
})

ipcMain.handle('kit:select-output-folder', async () => {
  const settings = getSettings()
  const result = await dialog.showOpenDialog(getMainWindow(), {
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: settings.lastOutputDir || app.getPath('music'),
  })
  return result.canceled ? '' : result.filePaths[0]
})

ipcMain.handle('kit:select-fl-packs-folder', async () => {
  const settings = getSettings()
  const defaultPath = settings.flPacksPath || (await resolveFlPacksPath())
  const result = await dialog.showOpenDialog(getMainWindow(), {
    properties: ['openDirectory'],
    defaultPath,
  })
  return result.canceled ? '' : result.filePaths[0]
})

ipcMain.handle('kit:get-settings', () => getSettings())

ipcMain.handle('kit:save-settings', (_, settings: Partial<AppSettings>) => saveSettings(settings))

ipcMain.handle('kit:cancel-scan', () => {
  activeScanController?.cancel()
})

ipcMain.handle('kit:start-scan', async (_, roots: string[], options: ScanOptions) => {
  activeScanController = createScanController()

  try {
    const result = await runScan(
      roots,
      options,
      (progress) => {
        getMainWindow().webContents.send('scan:progress', progress)
      },
      () => activeScanController?.isCancelled() ?? false,
    )

    const { samples: fpSamples } = await assignFingerprintGroups(result.samples)
    saveSettings({ lastFolders: roots, ...options })
    return { ...result, samples: fpSamples }
  } finally {
    activeScanController = null
  }
})

ipcMain.handle(
  'kit:export',
  async (
    _,
    samples: SampleRecord[],
    outputDir: string,
    kitName: string,
    customization?: KitCustomization,
    options?: ExportOptions,
  ) => {
    const result = await exportKit(samples, outputDir, kitName, customization, options)
    const entry = buildRecentKitEntry(result, kitName, samples.length)
    const settings = getSettings()
    const recentKits = capRecentKits([entry, ...(settings.recentKits ?? [])])
    saveSettings({
      lastOutputDir: outputDir,
      lastKitName: kitName,
      lastKitCustomization: customization ?? null,
      recentKits,
    })
    await shell.openPath(result.zipPath ?? result.outputPath)
    return result
  },
)

ipcMain.handle('kit:select-kit-import', async () => {
  const result = await dialog.showOpenDialog(getMainWindow(), {
    properties: ['openFile', 'openDirectory'],
    filters: [{ name: 'Drum kits', extensions: ['zip'] }],
  })
  return result.canceled ? '' : result.filePaths[0]
})

ipcMain.handle('kit:import-kit', async (_, srcPath: string) => {
  const result = await importKit(srcPath)
  const { samples } = await assignFingerprintGroups(result.samples)
  return { ...result, samples }
})

ipcMain.handle('kit:import-audio-files', async (_, filePaths: string[]) => {
  const result = await importAudioFiles(filePaths)
  const { samples } = await assignFingerprintGroups(result.samples)
  return { ...result, samples }
})

ipcMain.handle('kit:load-manifest', async (_, kitPath: string) => {
  return loadKitManifest(kitPath)
})

ipcMain.handle('kit:get-waveform-peaks', async (_, filePath: string) => {
  return getWaveformPeaks(filePath)
})

ipcMain.handle('kit:detect-fingerprints', async (_, samples: SampleRecord[]) => {
  return assignFingerprintGroups(samples)
})

ipcMain.handle('kit:list-themes', () => listThemes())

ipcMain.handle('kit:save-theme', (_, name: string, customization: KitCustomization) => {
  return saveTheme(name, customization)
})

ipcMain.handle('kit:delete-theme', (_, themeId: string) => {
  deleteTheme(themeId)
})

ipcMain.handle('kit:apply-theme', (_, themeId: string, customization: KitCustomization, categoryIds: string[]) => {
  const theme = listThemes().find((t) => t.id === themeId)
  if (!theme) return customization
  return applyTheme(theme, customization, categoryIds)
})

ipcMain.handle('kit:preview-image', async (_, filePath: string) => {
  const data = await readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
  }
  const mime = mimeTypes[ext] ?? 'image/png'
  return `data:${mime};base64,${data.toString('base64')}`
})

ipcMain.handle('kit:preview-audio', async (_, filePath: string) => {
  const data = await readFile(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.aiff': 'audio/aiff',
    '.aif': 'audio/aiff',
  }
  const mime = mimeTypes[ext] ?? 'audio/wav'
  return `data:${mime};base64,${data.toString('base64')}`
})

ipcMain.handle('kit:reveal-in-finder', async (_, filePath: string) => {
  shell.showItemInFolder(filePath)
})

ipcMain.handle('kit:stat-path', async (_, filePath: string) => {
  try {
    const info = await stat(filePath)
    return { isDirectory: info.isDirectory(), isFile: info.isFile() }
  } catch {
    return null
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
  else win?.focus()
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})
