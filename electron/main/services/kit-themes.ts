import { randomBytes } from 'node:crypto'
import type { KitCustomization, KitTheme } from '../../../src/shared/types'
import { getSettings, saveSettings } from './settings'

export function listThemes(): KitTheme[] {
  return getSettings().savedThemes ?? []
}

export function saveTheme(name: string, customization: KitCustomization): KitTheme {
  const theme: KitTheme = {
    id: randomBytes(8).toString('hex'),
    name,
    kitRoot: { ...customization.kitRoot },
    categories: { ...customization.categories },
    customCategoryDefaults: {
      iconIndex: 0,
      color: '#888888',
      sortGroup: 5,
    },
  }

  const settings = getSettings()
  const savedThemes = [...(settings.savedThemes ?? []), theme]
  saveSettings({ savedThemes })
  return theme
}

export function deleteTheme(themeId: string): void {
  const settings = getSettings()
  saveSettings({
    savedThemes: (settings.savedThemes ?? []).filter((t) => t.id !== themeId),
  })
}

export function applyTheme(
  theme: KitTheme,
  current: KitCustomization,
  categoryIds: string[],
): KitCustomization {
  const categories: Record<string, import('../../../src/shared/types').FolderNfoConfig> = {
    ...current.categories,
  }

  for (const catId of categoryIds) {
    if (theme.categories[catId]) {
      categories[catId] = { ...theme.categories[catId] }
    } else if (theme.customCategoryDefaults && !theme.categories[catId]) {
      const isCustom = current.customCategories.some((c) => c.id === catId)
      if (isCustom) {
        categories[catId] = { ...theme.customCategoryDefaults }
      }
    }
  }

  return {
    kitRoot: { ...theme.kitRoot },
    categories,
    customCategories: [...current.customCategories],
  }
}
