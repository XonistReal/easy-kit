import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { getSettings } from './settings'

const FL_PACKS_CANDIDATES = [
  'Documents/Image-Line/FL Studio/Audio/Packs',
  'Documents/Image-Line/FL Studio/Packs',
]

export async function resolveFlPacksPath(): Promise<string> {
  const settings = getSettings()
  if (settings.flPacksPath) {
    try {
      await access(settings.flPacksPath)
      return settings.flPacksPath
    } catch {
      // fall through to defaults
    }
  }

  const home = homedir()
  for (const candidate of FL_PACKS_CANDIDATES) {
    const full = path.join(home, candidate)
    try {
      await access(full)
      return full
    } catch {
      // try next
    }
  }

  return path.join(home, FL_PACKS_CANDIDATES[0])
}
