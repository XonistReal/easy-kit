import { execFile } from 'node:child_process'
import { copyFile, mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

function getFfmpeg(): string {
  if (ffmpegPath) return ffmpegPath
  return 'ffmpeg'
}

export async function processAudioForExport(
  sourcePath: string,
  destPath: string,
  options: {
    normalize?: boolean
    normalizeTarget?: 'peak' | '-14lufs'
    trimStartMs?: number
    trimEndMs?: number
  },
): Promise<void> {
  const hasTrim = options.trimStartMs !== undefined || options.trimEndMs !== undefined
  const hasNormalize = options.normalize

  if (!hasTrim && !hasNormalize) {
    await copyFile(sourcePath, destPath)
    return
  }

  await mkdir(path.dirname(destPath), { recursive: true })

  const args = ['-y']
  if (options.trimStartMs !== undefined) {
    args.push('-ss', String(options.trimStartMs / 1000))
  }
  args.push('-i', sourcePath)

  if (options.trimEndMs !== undefined && options.trimStartMs !== undefined) {
    const duration = (options.trimEndMs - options.trimStartMs) / 1000
    args.push('-t', String(Math.max(0.01, duration)))
  } else if (options.trimEndMs !== undefined) {
    args.push('-to', String(options.trimEndMs / 1000))
  }

  const filters: string[] = []
  if (hasNormalize) {
    if (options.normalizeTarget === '-14lufs') {
      filters.push('loudnorm=I=-14:TP=-1.5:LRA=11')
    } else {
      filters.push('dynaudnorm')
    }
  }

  if (filters.length > 0) {
    args.push('-af', filters.join(','))
  }

  const ext = path.extname(destPath).toLowerCase()
  if (ext === '.mp3') {
    args.push('-c:a', 'libmp3lame', '-q:a', '2')
  } else {
    args.push('-c:a', 'pcm_s16le')
  }
  args.push(destPath)

  try {
    await execFileAsync(getFfmpeg(), args)
  } catch {
    await copyFile(sourcePath, destPath)
  }
}
