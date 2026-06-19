import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  AppSettings,
  ExportOptions,
  ExportResult,
  FingerprintGroup,
  ImportKitResult,
  KitCustomization,
  KitTheme,
  LoadManifestResult,
  SampleRecord,
  ScanOptions,
  ScanProgress,
  ScanResult,
  WaveformPeaks,
} from '../../src/shared/types'

export interface KitMakerApi {
  selectFolders: () => Promise<string[]>
  selectOutputFolder: () => Promise<string>
  selectFlPacksFolder: () => Promise<string>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  startScan: (roots: string[], options: ScanOptions) => Promise<ScanResult>
  cancelScan: () => Promise<void>
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void
  exportKit: (
    samples: SampleRecord[],
    outputDir: string,
    kitName: string,
    customization?: KitCustomization,
    options?: ExportOptions,
  ) => Promise<ExportResult>
  selectImageFile: () => Promise<string>
  previewImage: (filePath: string) => Promise<string>
  previewAudio: (filePath: string) => Promise<string>
  revealInFinder: (filePath: string) => Promise<void>
  selectKitImport: () => Promise<string>
  importKit: (srcPath: string) => Promise<ImportKitResult>
  importAudioFiles: (filePaths: string[]) => Promise<ImportKitResult>
  loadManifest: (kitPath: string) => Promise<LoadManifestResult>
  getWaveformPeaks: (filePath: string) => Promise<WaveformPeaks>
  detectFingerprints: (samples: SampleRecord[]) => Promise<{ samples: SampleRecord[]; groups: FingerprintGroup[] }>
  listThemes: () => Promise<KitTheme[]>
  saveTheme: (name: string, customization: KitCustomization) => Promise<KitTheme>
  deleteTheme: (themeId: string) => Promise<void>
  applyTheme: (themeId: string, customization: KitCustomization, categoryIds: string[]) => Promise<KitCustomization>
  getPathForFile: (file: File) => string
  statPath: (filePath: string) => Promise<{ isDirectory: boolean; isFile: boolean } | null>
}

const kitMaker: KitMakerApi = {
  selectFolders: () => ipcRenderer.invoke('kit:select-folders'),
  selectOutputFolder: () => ipcRenderer.invoke('kit:select-output-folder'),
  selectFlPacksFolder: () => ipcRenderer.invoke('kit:select-fl-packs-folder'),
  getSettings: () => ipcRenderer.invoke('kit:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('kit:save-settings', settings),
  startScan: (roots, options) => ipcRenderer.invoke('kit:start-scan', roots, options),
  cancelScan: () => ipcRenderer.invoke('kit:cancel-scan'),
  onScanProgress: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress) => callback(progress)
    ipcRenderer.on('scan:progress', listener)
    return () => ipcRenderer.off('scan:progress', listener)
  },
  exportKit: (samples, outputDir, kitName, customization, options) =>
    ipcRenderer.invoke('kit:export', samples, outputDir, kitName, customization, options),
  selectImageFile: () => ipcRenderer.invoke('kit:select-image-file'),
  previewImage: (filePath) => ipcRenderer.invoke('kit:preview-image', filePath),
  previewAudio: (filePath) => ipcRenderer.invoke('kit:preview-audio', filePath),
  revealInFinder: (filePath) => ipcRenderer.invoke('kit:reveal-in-finder', filePath),
  selectKitImport: () => ipcRenderer.invoke('kit:select-kit-import'),
  importKit: (srcPath) => ipcRenderer.invoke('kit:import-kit', srcPath),
  importAudioFiles: (filePaths) => ipcRenderer.invoke('kit:import-audio-files', filePaths),
  loadManifest: (kitPath) => ipcRenderer.invoke('kit:load-manifest', kitPath),
  getWaveformPeaks: (filePath) => ipcRenderer.invoke('kit:get-waveform-peaks', filePath),
  detectFingerprints: (samples) => ipcRenderer.invoke('kit:detect-fingerprints', samples),
  listThemes: () => ipcRenderer.invoke('kit:list-themes'),
  saveTheme: (name, customization) => ipcRenderer.invoke('kit:save-theme', name, customization),
  deleteTheme: (themeId) => ipcRenderer.invoke('kit:delete-theme', themeId),
  applyTheme: (themeId, customization, categoryIds) =>
    ipcRenderer.invoke('kit:apply-theme', themeId, customization, categoryIds),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  statPath: (filePath) => ipcRenderer.invoke('kit:stat-path', filePath),
}

contextBridge.exposeInMainWorld('kitMaker', kitMaker)
