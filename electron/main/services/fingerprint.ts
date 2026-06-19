import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { FingerprintGroup, SampleRecord } from '../../../src/shared/types'

const execFileAsync = promisify(execFile)

const HAMMING_THRESHOLD = 8

async function computeFingerprint(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('fpcalc', ['-json', filePath])
    const parsed = JSON.parse(stdout) as { fingerprint?: string }
    return parsed.fingerprint ?? null
  } catch {
    return null
  }
}

function hammingDistance(a: string, b: string): number {
  const len = Math.min(a.length, b.length)
  let dist = Math.abs(a.length - b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) dist++
  }
  return dist
}

export async function assignFingerprintGroups(samples: SampleRecord[]): Promise<{
  samples: SampleRecord[]
  groups: FingerprintGroup[]
}> {
  const fingerprints = new Map<string, string>()

  for (const sample of samples) {
    const fp = await computeFingerprint(sample.resolvedPath)
    if (fp) fingerprints.set(sample.id, fp)
  }

  const groupIds = new Map<string, string>()
  const groups: FingerprintGroup[] = []
  let groupCounter = 0

  const ids = [...fingerprints.keys()]

  for (const id of ids) {
    if (groupIds.has(id)) continue
    const fp = fingerprints.get(id)!
    const groupId = `fp_${groupCounter++}`
    const members = [id]

    for (const otherId of ids) {
      if (otherId === id || groupIds.has(otherId)) continue
      const otherFp = fingerprints.get(otherId)!
      if (hammingDistance(fp, otherFp) <= HAMMING_THRESHOLD) {
        members.push(otherId)
        groupIds.set(otherId, groupId)
      }
    }

    groupIds.set(id, groupId)
    if (members.length > 1) {
      groups.push({ groupId, sampleIds: members })
    }
  }

  const updated = samples.map((sample) => {
    const gid = groupIds.get(sample.id)
    if (!gid) return sample
    const group = groups.find((g) => g.groupId === gid)
    if (!group || group.sampleIds.length < 2) return sample
    return { ...sample, fingerprintGroupId: gid }
  })

  return { samples: updated, groups }
}

import { keepBestInFingerprintGroups } from '../../../src/shared/fingerprint-utils'