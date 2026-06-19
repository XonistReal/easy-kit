import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { parseFlp, listSamples } from 'ts-flp'
import type { ScanOptions, ScanProgress, ScanResult } from '../../../src/shared/types'
import { classifySample } from './classify'
import { readAudioTags } from './audio-metadata'
import { hashFile, pickCanonicalPath } from './dedupe'
import { shouldExcludeSample, trackExclusion, topExclusionReasons } from './exclusions'

const AUDIO_EXTS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aiff', '.aif'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'Backup', 'backup', '__MACOSX'])
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_DURATION_MS = 8000

export interface ScanController {
  cancel: () => void
  isCancelled: () => boolean
}

export function createScanController(): ScanController {
  let cancelled = false
  return {
    cancel: () => {
      cancelled = true
    },
    isCancelled: () => cancelled,
  }
}

interface Discovered {
  flpFiles: string[]
  audioFiles: string[]
}

interface PathHit {
  flpSources: Set<string>
  folderSources: Set<string>
}

async function walkDir(
  root: string,
  discovered: Discovered,
  isCancelled: () => boolean,
): Promise<void> {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (isCancelled()) return

    const fullPath = path.join(root, entry.name)

    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue
      await walkDir(fullPath, discovered, isCancelled)
      continue
    }

    if (!entry.isFile()) continue

    const ext = path.extname(entry.name).toLowerCase()
    if (ext === '.flp') discovered.flpFiles.push(fullPath)
    else if (AUDIO_EXTS.has(ext)) discovered.audioFiles.push(fullPath)
  }
}

function resolveSamplePath(samplePath: string, flpPath: string): string {
  const normalized = samplePath.replace(/\\/g, '/')
  if (path.isAbsolute(normalized)) return path.normalize(normalized)
  return path.normalize(path.join(path.dirname(flpPath), normalized))
}

function projectLabelFromFlp(flpPath: string): string {
  return path.basename(flpPath, '.flp')
}

function folderLabelFromAudio(audioPath: string): string {
  return path.basename(path.dirname(audioPath))
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

function addFlpHit(hits: Map<string, PathHit>, resolvedPath: string, flpPath: string) {
  const existing = hits.get(resolvedPath) ?? { flpSources: new Set<string>(), folderSources: new Set<string>() }
  existing.flpSources.add(flpPath)
  hits.set(resolvedPath, existing)
}

function addFolderHit(hits: Map<string, PathHit>, resolvedPath: string, folderLabel: string) {
  const existing = hits.get(resolvedPath) ?? { flpSources: new Set<string>(), folderSources: new Set<string>() }
  existing.folderSources.add(folderLabel)
  hits.set(resolvedPath, existing)
}

function hitSources(hit: PathHit): string[] {
  const labels = [
    ...[...hit.flpSources].map(projectLabelFromFlp),
    ...hit.folderSources,
  ]
  return [...new Set(labels)].sort()
}

function hitUsageCount(hit: PathHit): number {
  return hit.flpSources.size + hit.folderSources.size
}

export function filterSamplesForExport(
  samples: import('../../../src/shared/types').SampleRecord[],
  options: ScanOptions,
): import('../../../src/shared/types').SampleRecord[] {
  let filtered = samples

  if (!options.includeSingles) {
    filtered = filtered.filter((s) => s.usageCount >= options.minUsageCount)
  }

  if (!options.includeUncategorized) {
    filtered = filtered.filter((s) => s.category !== 'uncategorized')
  }

  if (options.excludeRecordings && !options.includeVocals) {
    filtered = filtered.filter((s) => s.category !== 'vocals')
  }

  const byCategory = new Map<string, typeof filtered>()
  for (const sample of filtered) {
    const list = byCategory.get(sample.category) ?? []
    list.push(sample)
    byCategory.set(sample.category, list)
  }

  const result: typeof filtered = []
  for (const [, list] of byCategory) {
    const sorted = [...list].sort((a, b) => b.usageCount - a.usageCount)
    result.push(...sorted.slice(0, options.maxPerCategory))
  }

  return result.sort((a, b) => b.usageCount - a.usageCount)
}

export async function runScan(
  roots: string[],
  options: ScanOptions,
  onProgress: (progress: ScanProgress) => void,
  isCancelled: () => boolean,
): Promise<ScanResult> {
  const warnings: string[] = []
  const discovered: Discovered = { flpFiles: [], audioFiles: [] }
  const exclusionReasons = new Map<string, number>()
  let excludedCount = 0

  const exclusionOpts = {
    enabled: options.excludeRecordings,
    customPatterns: options.customExcludePaths,
  }

  onProgress({ phase: 'discovering', current: 0, total: roots.length, message: 'Scanning folders...' })

  for (let i = 0; i < roots.length; i++) {
    if (isCancelled()) break
    await walkDir(roots[i], discovered, isCancelled)
    onProgress({
      phase: 'discovering',
      current: i + 1,
      total: roots.length,
      message: `Scanned ${roots[i]}`,
    })
  }

  const pathHits = new Map<string, PathHit>()
  const flpReferencedPaths = new Set<string>()

  onProgress({
    phase: 'parsing',
    current: 0,
    total: discovered.flpFiles.length,
    message: 'Parsing FL Studio projects...',
  })

  for (let i = 0; i < discovered.flpFiles.length; i++) {
    if (isCancelled()) break

    const flpPath = discovered.flpFiles[i]

    try {
      const buffer = await readFile(flpPath)
      const parsed = parseFlp(buffer)
      const samples = listSamples(parsed)

      for (const sample of samples) {
        const resolved = resolveSamplePath(sample.path, flpPath)
        const exclusion = shouldExcludeSample(resolved, exclusionOpts)
        if (exclusion.excluded) {
          excludedCount++
          if (exclusion.reason) trackExclusion(exclusionReasons, exclusion.reason)
          continue
        }
        try {
          await stat(resolved)
          addFlpHit(pathHits, resolved, flpPath)
          flpReferencedPaths.add(resolved)
        } catch {
          warnings.push(`Missing sample in ${projectLabelFromFlp(flpPath)}: ${sample.path}`)
        }
      }
    } catch (err) {
      warnings.push(`Failed to parse ${projectLabelFromFlp(flpPath)}: ${err instanceof Error ? err.message : String(err)}`)
    }

    onProgress({
      phase: 'parsing',
      current: i + 1,
      total: discovered.flpFiles.length,
      message: `Parsed ${projectLabelFromFlp(flpPath)}`,
    })
  }

  for (const audioPath of discovered.audioFiles) {
    if (isCancelled()) break
    if (flpReferencedPaths.has(audioPath)) continue

    const exclusion = shouldExcludeSample(audioPath, exclusionOpts)
    if (exclusion.excluded) {
      excludedCount++
      if (exclusion.reason) trackExclusion(exclusionReasons, exclusion.reason)
      continue
    }

    const worthy = await isKitWorthy(audioPath)
    if (!worthy.ok) continue

    addFolderHit(pathHits, audioPath, folderLabelFromAudio(audioPath))
  }

  const uniquePaths = [...pathHits.keys()]
  const hashGroups = new Map<
    string,
    { paths: string[]; flpSources: Set<string>; folderSources: Set<string>; sizeBytes: number; durationMs?: number; bpm?: number; key?: string }
  >()

  onProgress({
    phase: 'hashing',
    current: 0,
    total: uniquePaths.length,
    message: 'Hashing and deduplicating samples...',
  })

  for (let i = 0; i < uniquePaths.length; i++) {
    if (isCancelled()) break

    const resolvedPath = uniquePaths[i]
    const hit = pathHits.get(resolvedPath)!
    const worthy = await isKitWorthy(resolvedPath)
    if (!worthy.ok) continue

    let hash: string
    try {
      hash = await hashFile(resolvedPath)
    } catch {
      warnings.push(`Could not hash: ${resolvedPath}`)
      continue
    }

    const group = hashGroups.get(hash) ?? {
      paths: [],
      flpSources: new Set<string>(),
      folderSources: new Set<string>(),
      sizeBytes: worthy.sizeBytes,
      durationMs: worthy.durationMs,
      bpm: worthy.bpm,
      key: worthy.key,
    }

    group.paths.push(resolvedPath)
    for (const source of hit.flpSources) group.flpSources.add(source)
    for (const source of hit.folderSources) group.folderSources.add(source)
    hashGroups.set(hash, group)

    onProgress({
      phase: 'hashing',
      current: i + 1,
      total: uniquePaths.length,
      message: `Hashed ${path.basename(resolvedPath)}`,
    })
  }

  const samples = [...hashGroups.entries()].map(([id, group]) => {
    const canonicalPath = pickCanonicalPath(group.paths)
    const fileName = path.basename(canonicalPath)
    const hit: PathHit = { flpSources: group.flpSources, folderSources: group.folderSources }
    return {
      id,
      resolvedPath: canonicalPath,
      fileName,
      category: classifySample(fileName),
      usageCount: hitUsageCount(hit),
      sources: hitSources(hit),
      sizeBytes: group.sizeBytes,
      durationMs: group.durationMs,
      bpm: group.bpm,
      key: group.key,
    }
  })

  const duplicatesRemoved = uniquePaths.length - hashGroups.size
  const filtered = filterSamplesForExport(samples, options)

  onProgress({
    phase: 'done',
    current: filtered.length,
    total: filtered.length,
    message: `Found ${filtered.length} samples`,
  })

  return {
    samples: filtered,
    warnings,
    stats: {
      flpFiles: discovered.flpFiles.length,
      audioFiles: discovered.audioFiles.length,
      uniqueSamples: hashGroups.size,
      duplicatesRemoved,
      excludedCount,
      topExclusionReasons: topExclusionReasons(exclusionReasons),
    },
  }
}
