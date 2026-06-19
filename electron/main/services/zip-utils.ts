import { createWriteStream } from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import extract from 'extract-zip'

export async function zipKitFolder(kitRoot: string): Promise<string> {
  const parent = path.dirname(kitRoot)
  const baseName = path.basename(kitRoot)
  const zipPath = path.join(parent, `${baseName}.zip`)

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    output.on('error', reject)
    archive.on('error', reject)

    archive.pipe(output)
    archive.directory(kitRoot, baseName)
    void archive.finalize()
  })

  return zipPath
}

export async function extractZipArchive(zipPath: string, destDir: string): Promise<void> {
  await extract(zipPath, { dir: destDir })
}
