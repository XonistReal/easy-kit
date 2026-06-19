import { stat } from 'node:fs/promises'
import path from 'node:path'
import type { ImportKitResult, SampleRecord } from '../../../src/shared/types'
import { readAudioTags } from './audio-metadata'
import { classifySample } from './classify'
import { hashFile } from './dedupe'

const AUDIO_EXTS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aiff', '.aif'])
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_DURATION_MS = 8000

export async function importAudioFiles(filePaths: string[]): Promise<ImportKitResult> {
  const warnings: string[] = []
  const sourceLabel = 'Imported: dropped files'
  const hashGroups = new Map<
    string,
    { resolvedPath: string; fileName: string; sizeBytes: number; durationMs?: number; bpm?: number; key?: string }
  >()
  let duplicatesSkipped = 0
  let filesFound = 0

  for (const filePath of filePaths) {
    const ext = path.extname(filePath).toLowerCase()
    if (!AUDIO_EXTS.has(ext)) continue
    filesFound++

    let sizeBytes = 0
    try {
      sizeBytes = (await stat(filePath)).size
    } catch {
      continue
    }

    if (sizeBytes > MAX_FILE_BYTES) continue

    const tags = await readAudioTags(filePath)
    if (tags.durationMs && tags.durationMs > MAX_DURATION_MS) continue

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
      sizeBytes,
      durationMs: tags.durationMs,
      bpm: tags.bpm,
      key: tags.key,
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
    kitName: 'Dropped Files',
    warnings,
    stats: { filesFound, imported: samples.length, duplicatesSkipped },
  }
}
