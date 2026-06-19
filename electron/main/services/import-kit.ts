import { randomBytes } from 'node:crypto'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'
import { readAudioTags } from './audio-metadata'
import type { ImportKitResult, SampleRecord } from '../../../src/shared/types'
import { classifySample } from './classify'
import { hashFile } from './dedupe'
import { extractZipArchive } from './zip-utils'

const AUDIO_EXTS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aiff', '.aif'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'Backup', 'backup', '__MACOSX'])
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_DURATION_MS = 8000

async function walkAudioFiles(root: string, out: string[]): Promise<void> {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)

    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue
      await walkAudioFiles(fullPath, out)
      continue
    }

    if (!entry.isFile()) continue

    const ext = path.extname(entry.name).toLowerCase()
    if (AUDIO_EXTS.has(ext)) out.push(fullPath)
  }
}

async function isKitWorthy(
  filePath: string,
): Promise<{ ok: boolean; durationMs?: number; sizeBytes: number; bpm?: number; key?: string }> {
  let sizeBytes = 0
  try {
    sizeBytes = (await stat(filePath)).size
  } catch {
    return { ok: false, sizeBytes: 0 }
  }

  if (sizeBytes > MAX_FILE_BYTES) return { ok: false, sizeBytes }

  const tags = await readAudioTags(filePath)
  if (tags.durationMs && tags.durationMs > MAX_DURATION_MS) {
    return { ok: false, sizeBytes, durationMs: tags.durationMs, bpm: tags.bpm, key: tags.key }
  }
  return { ok: true, sizeBytes, durationMs: tags.durationMs, bpm: tags.bpm, key: tags.key }
}

async function extractZip(zipPath: string): Promise<string> {
  const destDir = path.join(
    app.getPath('temp'),
    `easy-kit-maker-import-${randomBytes(6).toString('hex')}`,
  )
  await extractZipArchive(zipPath, destDir)
  return destDir
}

function kitNameFromPath(srcPath: string): string {
  const base = path.basename(srcPath)
  if (base.toLowerCase().endsWith('.zip')) {
    return path.basename(base, path.extname(base))
  }
  return base
}

export async function importKit(srcPath: string): Promise<ImportKitResult> {
  const warnings: string[] = []
  const kitName = kitNameFromPath(srcPath)
  const sourceLabel = `Imported: ${kitName}`

  let rootDir = srcPath
  const isZip = path.extname(srcPath).toLowerCase() === '.zip'

  if (isZip) {
    try {
      rootDir = await extractZip(srcPath)
    } catch (err) {
      throw new Error(
        `Failed to extract ZIP: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  } else {
    const info = await stat(srcPath)
    if (!info.isDirectory()) {
      throw new Error('Import path must be a folder or .zip file')
    }
  }

  const audioFiles: string[] = []
  await walkAudioFiles(rootDir, audioFiles)

  const hashGroups = new Map<
    string,
    { resolvedPath: string; fileName: string; sizeBytes: number; durationMs?: number; bpm?: number; key?: string }
  >()
  let duplicatesSkipped = 0

  for (const filePath of audioFiles) {
    const worthy = await isKitWorthy(filePath)
    if (!worthy.ok) continue

    let hash: string
    try {
      hash = await hashFile(filePath)
    } catch {
      warnings.push(`Could not hash: ${filePath}`)
      continue
    }

    if (hashGroups.has(hash)) {
      duplicatesSkipped++
      continue
    }

    hashGroups.set(hash, {
      resolvedPath: filePath,
      fileName: path.basename(filePath),
      sizeBytes: worthy.sizeBytes,
      durationMs: worthy.durationMs,
      bpm: worthy.bpm,
      key: worthy.key,
    })
  }

  const samples: SampleRecord[] = [...hashGroups.entries()].map(([id, group]) => ({
    id,
    resolvedPath: group.resolvedPath,
    fileName: group.fileName,
    category: classifySample(group.fileName),
    usageCount: 1,
    sources: [sourceLabel],
    sizeBytes: group.sizeBytes,
    durationMs: group.durationMs,
    bpm: group.bpm,
    key: group.key,
  }))

  return {
    samples,
    kitName,
    warnings,
    stats: {
      filesFound: audioFiles.length,
      imported: samples.length,
      duplicatesSkipped,
    },
  }
}
