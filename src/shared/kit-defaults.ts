import {
  CATEGORY_DEFAULT_COLORS,
  CATEGORY_DEFAULT_ICONS,
  CATEGORY_DEFAULT_SORT,
} from './fl-icons'
import { getCategoryLabel, isKnownCategory } from './categories'
import type { FolderNfoConfig, KitCustomization, SampleRecord } from './types'

const GENERIC_CATEGORY_ICON = 0
const GENERIC_CATEGORY_COLOR = '#888888'
const GENERIC_CATEGORY_SORT = 5

export function defaultCategoryNfo(category: string, customLabel?: string): FolderNfoConfig {
  if (isKnownCategory(category)) {
    return {
      iconIndex: CATEGORY_DEFAULT_ICONS[category],
      color: CATEGORY_DEFAULT_COLORS[category],
      tip: `${getCategoryLabel(category)} from your projects`,
      sortGroup: CATEGORY_DEFAULT_SORT[category],
    }
  }

  const label = customLabel ?? getCategoryLabel(category)
  return {
    iconIndex: GENERIC_CATEGORY_ICON,
    color: GENERIC_CATEGORY_COLOR,
    tip: `${label} folder`,
    sortGroup: GENERIC_CATEGORY_SORT,
  }
}

export function buildDefaultKitCustomization(
  samples: SampleRecord[],
  kitName: string,
): KitCustomization {
  const categories = new Set(samples.map((s) => s.category))
  const categoryConfigs: Record<string, FolderNfoConfig> = {}

  for (const category of categories) {
    categoryConfigs[category] = defaultCategoryNfo(category)
  }

  return {
    kitRoot: {
      iconIndex: 894,
      color: '#8B5CF6',
      tip: `${kitName} — built with Easy Kit Maker`,
      sortGroup: 200,
    },
    categories: categoryConfigs,
    customCategories: [],
  }
}

export function mergeCustomization(
  existing: KitCustomization | null,
  samples: SampleRecord[],
  kitName: string,
): KitCustomization {
  const base = existing ?? buildDefaultKitCustomization(samples, kitName)
  const categoriesPresent = new Set(samples.map((s) => s.category))
  const categories: Record<string, FolderNfoConfig> = { ...base.categories }

  for (const category of categoriesPresent) {
    if (!categories[category]) {
      const custom = base.customCategories.find((c) => c.id === category)
      categories[category] = defaultCategoryNfo(category, custom?.label)
    }
  }

  for (const key of Object.keys(categories)) {
    if (!categoriesPresent.has(key) && !base.customCategories.some((c) => c.id === key)) {
      delete categories[key]
    }
  }

  return {
    kitRoot: base.kitRoot.tip
      ? base.kitRoot
      : {
          ...base.kitRoot,
          tip: `${kitName} — built with Easy Kit Maker`,
        },
    categories,
    customCategories: [...base.customCategories],
  }
}
