import Store from 'electron-store'
import { DEFAULT_SETTINGS, type AppSettings } from '../../../src/shared/types'

const store = new Store<AppSettings>({
  name: 'easy-kit-maker',
  defaults: DEFAULT_SETTINGS,
})

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...store.store }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const next = { ...current, ...settings }
  store.set(next)
  return next
}
