import path from 'node:path'

const PATH_EXCLUDE: RegExp[] = [
  /recordings?/i,
  /vocals?/i,
  /\bvox\b/i,
  /takes?/i,
  /punch/i,
  /edison/i,
  /audio\s*tracks?/i,
  /mic(?:s)?/i,
  /scratch/i,
  /adlibs?/i,
  /hooks?/i,
  /verses?/i,
  /chorus/i,
  /stems?/i,
  /acapella/i,
  /dry\s*vocal/i,
]

const NAME_EXCLUDE: RegExp[] = [
  /^take[\s_-]?\d+/i,
  /^rec[\s_-]?\d+/i,
  /vocal/i,
  /\bvox\b/i,
  /acapella/i,
  /adlib/i,
  /verse/i,
  /chorus/i,
  /bridge/i,
  /hook/i,
  /punch[\s_-]?in/i,
  /scratch/i,
  /comp[\s_-]?\d+/i,
]

export interface ExclusionResult {
  excluded: boolean
  reason?: string
}

export interface ExclusionOptions {
  enabled: boolean
  customPatterns: string[]
}

function compileCustomPatterns(patterns: string[]): RegExp[] {
  return patterns
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      try {
        return new RegExp(p, 'i')
      } catch {
        return new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      }
    })
}

export function shouldExcludeSample(
  filePath: string,
  options: ExclusionOptions,
): ExclusionResult {
  if (!options.enabled) return { excluded: false }

  const segments = filePath.split(path.sep)
  const baseName = path.basename(filePath, path.extname(filePath))

  for (const segment of segments) {
    for (const pattern of PATH_EXCLUDE) {
      if (pattern.test(segment)) {
        return { excluded: true, reason: `Path: ${segment}` }
      }
    }
  }

  for (const pattern of NAME_EXCLUDE) {
    if (pattern.test(baseName)) {
      return { excluded: true, reason: `Filename: ${baseName}` }
    }
  }

  const customPatterns = compileCustomPatterns(options.customPatterns)
  for (const segment of segments) {
    for (const pattern of customPatterns) {
      if (pattern.test(segment)) {
        return { excluded: true, reason: `Custom: ${segment}` }
      }
    }
  }

  for (const pattern of customPatterns) {
    if (pattern.test(baseName)) {
      return { excluded: true, reason: `Custom: ${baseName}` }
    }
  }

  return { excluded: false }
}

export function trackExclusion(
  reasons: Map<string, number>,
  reason: string,
): void {
  reasons.set(reason, (reasons.get(reason) ?? 0) + 1)
}

export function topExclusionReasons(reasons: Map<string, number>, limit = 5): string[] {
  return [...reasons.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([reason, count]) => `${reason} (${count})`)
}
