import type { SampleRecord } from './types'

export function keepBestInFingerprintGroups(samples: SampleRecord[]): SampleRecord[] {
  const byGroup = new Map<string, SampleRecord[]>()

  for (const sample of samples) {
    if (!sample.fingerprintGroupId) continue
    const list = byGroup.get(sample.fingerprintGroupId) ?? []
    list.push(sample)
    byGroup.set(sample.fingerprintGroupId, list)
  }

  const removeIds = new Set<string>()

  for (const [, group] of byGroup) {
    if (group.length < 2) continue
    const sorted = [...group].sort((a, b) => {
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
      return a.fileName.length - b.fileName.length
    })
    for (let i = 1; i < sorted.length; i++) {
      removeIds.add(sorted[i].id)
    }
  }

  return samples.filter((s) => !removeIds.has(s.id))
}

export function countFingerprintDupes(samples: SampleRecord[]): number {
  const byGroup = new Map<string, number>()
  for (const s of samples) {
    if (!s.fingerprintGroupId) continue
    byGroup.set(s.fingerprintGroupId, (byGroup.get(s.fingerprintGroupId) ?? 0) + 1)
  }
  let extra = 0
  for (const count of byGroup.values()) {
    if (count > 1) extra += count - 1
  }
  return extra
}
