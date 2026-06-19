import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { FL_PACKS_PATH_CANDIDATES } from './fl-path-defaults'
import { getSettings } from './settings'

export { getDefaultFlPaths, getDefaultFlPacksPath, getDefaultFlProjectsPath } from './fl-path-defaults'

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
  for (const candidate of FL_PACKS_PATH_CANDIDATES) {
    const full = path.join(home, candidate)
    try {
      await access(full)
      return full
    } catch {
      // try next
    }
  }

  return path.join(home, FL_PACKS_PATH_CANDIDATES[0])
}
