import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import type { SampleCategory, SampleRecord } from '../../../src/shared/types'
import { classifySample } from './classify'

export interface RawSampleHit {
  resolvedPath: string
  fileName: string
  sources: string[]
  sizeBytes: number
  durationMs?: number
}

function filenameScore(name: string): number {
  const base = path.basename(name, path.extname(name))
  let score = 0
  if (!/[()[\]{}]/.test(base)) score += 10
  if (!/\s{2,}/.test(base)) score += 5
  if (!/\(\d+\)/.test(base)) score += 5
  score -= base.length * 0.1
  return score
}

export function pickCanonicalPath(paths: string[]): string {
  return [...paths].sort((a, b) => filenameScore(b) - filenameScore(a))[0]
}

export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

export async function buildSampleRecords(
  hits: Map<string, { paths: Set<string>; sources: Set<string> }>,
  onProgress?: (current: number, total: number) => void,
  isCancelled?: () => boolean,
): Promise<{ samples: SampleRecord[]; duplicatesRemoved: number }> {
  const entries = [...hits.entries()]
  const samples: SampleRecord[] = []
  let duplicatesRemoved = 0

  for (let i = 0; i < entries.length; i++) {
    if (isCancelled?.()) break

    const [, data] = entries[i]
    const paths = [...data.paths]
    const canonicalPath = pickCanonicalPath(paths)
    duplicatesRemoved += paths.length - 1

    let sizeBytes = 0
    try {
      sizeBytes = (await stat(canonicalPath)).size
    } catch {
      continue
    }

    const fileName = path.basename(canonicalPath)
    const id = await hashFile(canonicalPath)
    if (isCancelled?.()) break

    const category: SampleCategory = classifySample(fileName)
    const sources = [...data.sources].sort()

    samples.push({
      id,
      resolvedPath: canonicalPath,
      fileName,
      category,
      usageCount: sources.length,
      sources,
      sizeBytes,
    })

    onProgress?.(i + 1, entries.length)
  }

  return { samples, duplicatesRemoved }
}

export function mergeHitsByHash(
  pathHits: Map<string, { paths: Set<string>; sources: Set<string> }>,
  hashToCanonical: Map<string, string>,
  pathToHash: Map<string, string>,
): Map<string, { paths: Set<string>; sources: Set<string> }> {
  const merged = new Map<string, { paths: Set<string>; sources: Set<string> }>()

  for (const [resolvedPath, data] of pathHits) {
    const hash = pathToHash.get(resolvedPath)
    if (!hash) continue

    const canonical = hashToCanonical.get(hash) ?? resolvedPath
    const existing = merged.get(hash) ?? { paths: new Set<string>(), sources: new Set<string>() }

    existing.paths.add(resolvedPath)
    if (canonical === resolvedPath || !existing.paths.has(canonical)) {
      existing.paths.add(canonical)
    }
    for (const source of data.sources) existing.sources.add(source)

    merged.set(hash, existing)
  }

  return merged
}
