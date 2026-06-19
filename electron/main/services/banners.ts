import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { KitCustomization } from '../../../src/shared/types'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'])

export function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

export function nfoBitmapPath(relativePath: string): string {
  return relativePath.split(path.sep).join('/')
}

export interface StagedBanners {
  rootBitmap?: string
  categoryBitmaps: Record<string, string>
  imagesCopied: number
}

export async function stageKitBanners(
  kitRoot: string,
  kitFolderName: string,
  customization: KitCustomization,
  categoriesPresent: string[],
): Promise<StagedBanners> {
  const imagesDir = path.join(kitRoot, 'images')
  const categoryBitmaps: Record<string, string> = {}
  let imagesCopied = 0

  async function copyBanner(sourcePath: string, destBaseName: string): Promise<string> {
    const ext = path.extname(sourcePath).toLowerCase() || '.png'
    const destName = `${destBaseName}${ext}`
    await mkdir(imagesDir, { recursive: true })
    await copyFile(sourcePath, path.join(imagesDir, destName))
    imagesCopied++
    return nfoBitmapPath(path.join('images', destName))
  }

  let rootBitmap: string | undefined
  if (customization.kitRoot.bannerImagePath && isImageFile(customization.kitRoot.bannerImagePath)) {
    const relative = await copyBanner(customization.kitRoot.bannerImagePath, 'kit-cover')
    rootBitmap = nfoBitmapPath(path.join(kitFolderName, relative))
  }

  for (const category of categoriesPresent) {
    const bannerPath = customization.categories[category]?.bannerImagePath
    if (!bannerPath || !isImageFile(bannerPath)) continue
    categoryBitmaps[category] = await copyBanner(bannerPath, category)
  }

  return { rootBitmap, categoryBitmaps, imagesCopied }
}
