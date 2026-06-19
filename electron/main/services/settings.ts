import Store from 'electron-store'
import { DEFAULT_SETTINGS, type AppSettings } from '../../../src/shared/types'
import { getDefaultFlPaths } from './fl-path-defaults'

const store = new Store<AppSettings>({
  name: 'easy-kit-maker',
  defaults: DEFAULT_SETTINGS,
})

function withPlatformDefaults(settings: AppSettings): AppSettings {
  const defaults = getDefaultFlPaths()
  return {
    ...settings,
    defaultFlProjectsPath: settings.defaultFlProjectsPath || defaults.projectsPath,
    flPacksPath: settings.flPacksPath || defaults.packsPath,
  }
}

export function getSettings(): AppSettings {
  return withPlatformDefaults({ ...DEFAULT_SETTINGS, ...store.store })
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const next = { ...current, ...settings }
  store.set(next)
  return next
}
