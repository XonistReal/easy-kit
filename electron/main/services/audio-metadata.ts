import { parseFile } from 'music-metadata'

export interface AudioTags {
  durationMs?: number
  bpm?: number
  key?: string
}

export async function readAudioTags(filePath: string): Promise<AudioTags> {
  try {
    const metadata = await parseFile(filePath, { duration: true })
    const durationMs = metadata.format.duration ? metadata.format.duration * 1000 : undefined
    const bpm = metadata.common.bpm ? Number(metadata.common.bpm) : undefined
    const keyRaw = metadata.common.key ?? metadata.common.initialKey
    const key = typeof keyRaw === 'string' ? keyRaw : keyRaw?.toString()
    return { durationMs, bpm, key }
  } catch {
    return {}
  }
}
