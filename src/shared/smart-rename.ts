import { getCategoryLabel } from './categories'
import type { CustomCategory, SampleRecord } from './types'

export interface SmartRenameOptions {
  includeBpmKey?: boolean
  padDigits?: number
}

function slugLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Sample'
}

function extOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '.wav'
}

export function buildSmartRenameMap(
  samples: SampleRecord[],
  customCategories: CustomCategory[] = [],
  options: SmartRenameOptions = {},
): Map<string, string> {
  const pad = options.padDigits ?? 2
  const result = new Map<string, string>()
  const byCategory = new Map<string, SampleRecord[]>()

  for (const sample of samples) {
    const list = byCategory.get(sample.category) ?? []
    list.push(sample)
    byCategory.set(sample.category, list)
  }

  for (const [category, list] of byCategory) {
    const sorted = [...list].sort((a, b) => b.usageCount - a.usageCount)
    const label = slugLabel(getCategoryLabel(category, customCategories))

    sorted.forEach((sample, index) => {
      const num = String(index + 1).padStart(pad, '0')
      const ext = extOf(sample.fileName)
      let base = `${label}_${num}`

      if (options.includeBpmKey) {
        const parts: string[] = []
        if (sample.bpm) parts.push(String(Math.round(sample.bpm)))
        if (sample.key) parts.push(sample.key.replace(/\s+/g, ''))
        if (parts.length > 0) base = `${base}_${parts.join('')}`
      }

      result.set(sample.id, `${base}${ext}`)
    })
  }

  return result
}

export function applySmartRename(
  samples: SampleRecord[],
  customCategories: CustomCategory[] = [],
  options?: SmartRenameOptions,
): SampleRecord[] {
  const map = buildSmartRenameMap(samples, customCategories, options)
  return samples.map((s) => ({
    ...s,
    exportFileName: map.get(s.id) ?? s.exportFileName,
  }))
}
