import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { FolderNfoConfig, KitCustomization } from '../../../src/shared/types'

export function rgbToBgrHex(rgb: string): string {
  const hex = rgb.replace('#', '')
  if (hex.length !== 6) return '$FFFFFF'
  const r = hex.slice(0, 2)
  const g = hex.slice(2, 4)
  const b = hex.slice(4, 6)
  return `$${b}${g}${r}`.toUpperCase()
}

export const DEFAULT_BANNER_HEIGHT_OFS = 12

function buildNfoContent(config: FolderNfoConfig, bitmapPath?: string): string {
  const lines: string[] = []

  if (config.tip) lines.push(`Tip=${config.tip}`)
  if (bitmapPath) lines.push(`Bitmap=${bitmapPath}`)
  if (config.iconIndex !== undefined) lines.push(`IconIndex=${config.iconIndex}`)
  if (config.color) lines.push(`Color=${rgbToBgrHex(config.color)}`)
  if (config.colIndex !== undefined) lines.push(`ColIndex=${config.colIndex}`)
  if (config.sortGroup !== undefined) lines.push(`SortGroup=${config.sortGroup}`)
  if (config.heightOfs !== undefined) {
    lines.push(`HeightOfs=${config.heightOfs}`)
  } else if (bitmapPath) {
    lines.push(`HeightOfs=${DEFAULT_BANNER_HEIGHT_OFS}`)
  }
  if (config.visible !== undefined) lines.push(`Visible=${config.visible ? 'True' : 'False'}`)

  return lines.join('\n') + (lines.length > 0 ? '\n' : '')
}

function hasNfoContent(config: FolderNfoConfig, bitmapPath?: string): boolean {
  return (
    Boolean(bitmapPath) ||
    config.tip !== undefined ||
    config.iconIndex !== undefined ||
    config.color !== undefined ||
    config.colIndex !== undefined ||
    config.sortGroup !== undefined ||
    config.heightOfs !== undefined ||
    config.visible !== undefined
  )
}

export async function writeNfoFile(
  parentDir: string,
  folderName: string,
  config: FolderNfoConfig,
  bitmapPath?: string,
): Promise<void> {
  if (!hasNfoContent(config, bitmapPath)) return
  const content = buildNfoContent(config, bitmapPath)
  const nfoPath = path.join(parentDir, `${folderName}.nfo`)
  await writeFile(nfoPath, content, 'utf8')
}

export async function generateKitNfos(
  outputDir: string,
  kitRoot: string,
  kitFolderName: string,
  customization: KitCustomization,
  categoriesPresent: string[],
  categoryBitmaps: Record<string, string> = {},
  rootBitmap?: string,
): Promise<number> {
  let written = 0

  if (hasNfoContent(customization.kitRoot, rootBitmap)) {
    await writeNfoFile(outputDir, kitFolderName, customization.kitRoot, rootBitmap)
    written++
  }

  for (const category of categoriesPresent) {
    const config = customization.categories[category]
    if (!config) continue
    const bitmapPath = categoryBitmaps[category]
    if (!hasNfoContent(config, bitmapPath)) continue
    await writeNfoFile(kitRoot, category, config, bitmapPath)
    written++
  }

  return written
}
