import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export async function zipKitFolder(kitRoot: string): Promise<string> {
  const parent = path.dirname(kitRoot)
  const baseName = path.basename(kitRoot)
  const zipPath = path.join(parent, `${baseName}.zip`)

  await execFileAsync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', kitRoot, zipPath])
  return zipPath
}
