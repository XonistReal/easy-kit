import { copyFile, cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  ExportOptions,
  ExportResult,
  KitCustomization,
  RecentKitEntry,
  SampleRecord,
} from '../../../src/shared/types'
import { processAudioForExport } from './audio-process'
import { stageKitBanners } from './banners'
import { resolveFlPacksPath } from './fl-paths'
import { generateKitNfos } from './nfo'
import { zipKitFolder } from './zip-export'

function sanitizeFilename(name: string): string {
  const ext = path.extname(name)
  const base = path.basename(name, ext)
  const cleaned = base
    .replace(/[()[\]{}]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .replace(/[^\w.\- ]/g, '')
    .trim() || 'sample'
  return `${cleaned}${ext.toLowerCase()}`
}

function resolveExportName(sample: SampleRecord): string {
  const raw = sample.exportFileName ?? sample.fileName
  return sanitizeFilename(raw)
}

export async function exportKit(
  samples: SampleRecord[],
  outputDir: string,
  kitName: string,
  customization?: KitCustomization,
  options: ExportOptions = {},
): Promise<ExportResult> {
  const date = new Date().toISOString().split('T')[0]
  const kitFolderName = `${kitName}_${date}`
  const kitRoot = path.join(outputDir, kitFolderName)
  await mkdir(kitRoot, { recursive: true })

  const usedNames = new Map<string, Set<string>>()
  let filesCopied = 0
  const categoriesUsed = new Set<string>()
  const manifest: {
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
  } = {
    kitName,
    exportedAt: new Date().toISOString(),
    customization,
    samples: [],
  }

  const categoryDirs = new Set<string>()
  const needsProcessing = (sample: SampleRecord) =>
    options.normalizeOnExport ||
    sample.trimStartMs !== undefined ||
    sample.trimEndMs !== undefined

  for (const sample of samples) {
    const categoryDir = path.join(kitRoot, sample.category)
    await mkdir(categoryDir, { recursive: true })
    categoryDirs.add(sample.category)
    categoriesUsed.add(sample.category)

    const categoryKey = sample.category
    const namesInCategory = usedNames.get(categoryKey) ?? new Set<string>()
    let fileName = resolveExportName(sample)
    let destName = fileName
    let counter = 1

    while (namesInCategory.has(destName)) {
      const ext = path.extname(fileName)
      const base = path.basename(fileName, ext)
      destName = `${base}_${String(counter).padStart(2, '0')}${ext}`
      counter++
    }

    namesInCategory.add(destName)
    usedNames.set(categoryKey, namesInCategory)

    const destPath = path.join(categoryDir, destName)

    if (needsProcessing(sample)) {
      await processAudioForExport(sample.resolvedPath, destPath, {
        normalize: options.normalizeOnExport,
        normalizeTarget: options.normalizeTarget ?? 'peak',
        trimStartMs: sample.trimStartMs,
        trimEndMs: sample.trimEndMs,
      })
    } else {
      await copyFile(sample.resolvedPath, destPath)
    }

    filesCopied++

    manifest.samples.push({
      fileName: destName,
      category: sample.category,
      sourcePath: sample.resolvedPath,
      usageCount: sample.usageCount,
      sources: sample.sources,
      hash: sample.id,
      exportFileName: sample.exportFileName,
      bpm: sample.bpm,
      key: sample.key,
    })
  }

  for (const category of categoryDirs) {
    const categoryDir = path.join(kitRoot, category)
    try {
      const { readdir, rmdir } = await import('node:fs/promises')
      const files = await readdir(categoryDir)
      if (files.length === 0) {
        await rmdir(categoryDir)
        categoriesUsed.delete(category)
      }
    } catch {
      // category folder not created
    }
  }

  manifest.samples.sort((a, b) => {
    const catCompare = a.category.localeCompare(b.category)
    if (catCompare !== 0) return catCompare
    return b.usageCount - a.usageCount
  })

  let nfoFilesWritten = 0
  let bannerImagesCopied = 0
  if (customization) {
    const stagedBanners = await stageKitBanners(
      kitRoot,
      kitFolderName,
      customization,
      [...categoriesUsed],
    )
    bannerImagesCopied = stagedBanners.imagesCopied
    nfoFilesWritten = await generateKitNfos(
      outputDir,
      kitRoot,
      kitFolderName,
      customization,
      [...categoriesUsed],
      stagedBanners.categoryBitmaps,
      stagedBanners.rootBitmap,
    )
  }

  await writeFile(path.join(kitRoot, 'kit_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

  let zipPath: string | undefined
  if (options.exportAsZip) {
    zipPath = await zipKitFolder(kitRoot)
  }

  let installedToFl: string | undefined
  if (options.installToFl) {
    const flPacks = await resolveFlPacksPath()
    const flDest = path.join(flPacks, kitFolderName)
    await cp(kitRoot, flDest, { recursive: true })
    installedToFl = flDest
  }

  return {
    outputPath: kitRoot,
    zipPath,
    filesCopied,
    categories: categoriesUsed.size,
    nfoFilesWritten,
    bannerImagesCopied,
    installedToFl,
  }
}

export function buildRecentKitEntry(
  result: ExportResult,
  kitName: string,
  sampleCount: number,
): RecentKitEntry {
  return {
    kitName,
    folderPath: result.outputPath,
    zipPath: result.zipPath,
    exportedAt: new Date().toISOString(),
    sampleCount,
  }
}

export function capRecentKits(entries: RecentKitEntry[], max = 20): RecentKitEntry[] {
  return entries.slice(0, max)
}
