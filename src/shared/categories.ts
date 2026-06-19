import { CATEGORY_DEFAULT_COLORS } from './fl-icons'
import type { CustomCategory, KitCustomization, SampleCategory, SampleRecord } from './types'
import { CATEGORY_LABELS, SAMPLE_CATEGORIES } from './types'

const KNOWN_CATEGORY_SET = new Set<string>(SAMPLE_CATEGORIES)

export function isKnownCategory(id: string): id is SampleCategory {
  return KNOWN_CATEGORY_SET.has(id)
}

export function getCategoryLabel(id: string, customCategories: CustomCategory[] = []): string {
  if (isKnownCategory(id)) return CATEGORY_LABELS[id]
  return customCategories.find((c) => c.id === id)?.label ?? formatCustomLabel(id)
}

export function getCategoryColor(id: string): string {
  if (isKnownCategory(id)) return CATEGORY_DEFAULT_COLORS[id]
  return hashColor(id)
}

function formatCustomLabel(id: string): string {
  return id
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function hashColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 58%)`
}

export function slugifyCategory(label: string, existingIds: Set<string> = KNOWN_CATEGORY_SET): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')

  const slug = base || 'custom_folder'
  if (!existingIds.has(slug)) return slug

  let counter = 2
  while (existingIds.has(`${slug}_${counter}`)) counter++
  return `${slug}_${counter}`
}

export function getDisplayedCategoryIds(
  samples: SampleRecord[],
  customCategories: CustomCategory[] = [],
): string[] {
  const ids = new Set<string>()
  for (const sample of samples) ids.add(sample.category)
  for (const custom of customCategories) ids.add(custom.id)

  const known = SAMPLE_CATEGORIES.filter((id) => ids.has(id))
  const custom = customCategories
    .map((c) => c.id)
    .filter((id) => ids.has(id) && !isKnownCategory(id))
  const orphanCustom = [...ids].filter((id) => !isKnownCategory(id) && !custom.includes(id))

  return [...known, ...custom, ...orphanCustom]
}

export function getSelectableCategoryIds(customCategories: CustomCategory[] = []): string[] {
  return [...SAMPLE_CATEGORIES, ...customCategories.map((c) => c.id)]
}

export function normalizeKitCustomization(customization: KitCustomization): KitCustomization {
  return {
    ...customization,
    categories: customization.categories ?? {},
    customCategories: customization.customCategories ?? [],
  }
}
