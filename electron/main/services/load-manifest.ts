import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { KitCustomization, LoadManifestResult, SampleRecord } from '../../../src/shared/types'
import { normalizeKitCustomization } from '../../../src/shared/categories'

interface KitManifest {
  kitName: string
  exportedAt: string
  customization?: KitCustomization
  samples: Array<{
    fileName: string
    category: string
    sourcePath: string
    usageCount: number
    sources: string[]
    hash: string
    exportFileName?: string
    bpm?: number
    key?: string
  }>
}

export async function loadKitManifest(kitPath: string): Promise<LoadManifestResult> {
  let manifestPath = kitPath
  if (!manifestPath.endsWith('kit_manifest.json')) {
    manifestPath = path.join(kitPath, 'kit_manifest.json')
  }

  const raw = await readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(raw) as KitManifest
  const kitRoot = path.dirname(manifestPath)
  const samples: SampleRecord[] = []

  for (const entry of manifest.samples) {
    const categoryDir = path.join(kitRoot, entry.category)
    const exportedPath = path.join(categoryDir, entry.fileName)
    let resolvedPath = entry.sourcePath

    try {
      await access(resolvedPath)
    } catch {
      try {
        await access(exportedPath)
        resolvedPath = exportedPath
      } catch {
        continue
      }
    }

    let sizeBytes = 0
    try {
      const { stat } = await import('node:fs/promises')
      sizeBytes = (await stat(resolvedPath)).size
    } catch {
      // keep 0
    }

    samples.push({
      id: entry.hash,
      resolvedPath,
      fileName: path.basename(resolvedPath),
      category: entry.category,
      usageCount: entry.usageCount,
      sources: entry.sources,
      sizeBytes,
      exportFileName: entry.exportFileName ?? entry.fileName,
      bpm: entry.bpm,
      key: entry.key,
    })
  }

  const customization = manifest.customization
    ? normalizeKitCustomization(manifest.customization)
    : null

  return {
    samples,
    customization,
    kitName: manifest.kitName,
  }
}
