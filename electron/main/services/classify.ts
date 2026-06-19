import type { SampleCategory } from '../../../src/shared/types'

/**
 * Normalize a filename stem into a delimited token string so we can match
 * parts like "hat", "808", or "snr" even when glued to underscores, dashes,
 * dots, or numbers (e.g. trap_hat_01, 808bass, my-snare-2).
 */
function normalizeForTokens(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return `_${base.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_`
}

/** Compact alphanumeric-only form for glued names (openhat, trap808, 808bass). */
function compactAlphanumeric(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '')
  return base.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function tokens(norm: string): string[] {
  return norm.split('_').filter(Boolean)
}

function hasToken(norm: string, ...tokenNames: string[]): boolean {
  const parts = tokens(norm)
  return tokenNames.some((name) => parts.includes(name))
}

function hasTokenPrefix(norm: string, prefix: string): boolean {
  return tokens(norm).some((part) => part === prefix || part.startsWith(`${prefix}`) && /^\d+$/.test(part.slice(prefix.length)))
}

function includesAny(compact: string, ...parts: string[]): boolean {
  return parts.some((part) => compact.includes(part))
}

function hasHatReference(norm: string, compact: string): boolean {
  if (
    hasToken(norm, 'hat', 'hihat', 'hh', 'hi_hat') ||
    hasTokenPrefix(norm, 'hat') ||
    hasTokenPrefix(norm, 'hh')
  ) {
    return true
  }
  if (includesAny(compact, 'hihat', 'closedhat')) return true
  // Glued forms: traphat, hat02 — but not "that" or "chat"
  return /(?:^|[a-z0-9])hat(?:[a-z0-9]|$)/.test(compact) && !/(?:that|chat|what|wheat)/.test(compact)
}

function hasOpenReference(norm: string, compact: string): boolean {
  return (
    hasToken(norm, 'open', 'oh') ||
    includesAny(compact, 'openhat', 'openhihat', 'openhi') ||
    /(?:^|[a-z0-9])open(?:[a-z0-9]|$)/.test(compact)
  )
}

type ClassifyRule = {
  category: SampleCategory
  match: (norm: string, compact: string) => boolean
}

const CLASSIFY_RULES: ClassifyRule[] = [
  {
    category: 'open_hats',
    match: (norm, compact) => {
      if (hasToken(norm, 'oh', 'openhat', 'open_hi', 'openhh', 'openhihat')) return true
      if (includesAny(compact, 'openhat', 'openhihat', 'openhi')) return true
      return hasOpenReference(norm, compact) && hasHatReference(norm, compact)
    },
  },
  {
    category: '808s',
    match: (norm, compact) => {
      if (hasToken(norm, '808', 'sub', 'subbass', 'sub808')) return true
      if (hasTokenPrefix(norm, '808')) return true
      return includesAny(compact, '808', 'trap808', 'subbass', 'sub808')
    },
  },
  {
    category: 'kicks',
    match: (norm, compact) =>
      hasToken(norm, 'kick', 'bd', 'kik', 'bassdrum', 'kickdrum', 'kck') ||
      hasTokenPrefix(norm, 'kick') ||
      includesAny(compact, 'kick', 'bassdrum', 'kickdrum'),
  },
  {
    category: 'snares',
    match: (norm, compact) =>
      hasToken(norm, 'snare', 'snr', 'sd', 'rim', 'rimshot', 'snap', 'snaer', 'snrare') ||
      hasTokenPrefix(norm, 'snr') ||
      hasTokenPrefix(norm, 'snare') ||
      includesAny(compact, 'snare', 'rimshot'),
  },
  {
    category: 'claps',
    match: (norm, compact) =>
      hasToken(norm, 'clap', 'clp', 'claq') ||
      hasTokenPrefix(norm, 'clap') ||
      includesAny(compact, 'clap'),
  },
  {
    category: 'hihats',
    match: (norm, compact) => {
      if (
        hasToken(norm, 'hat', 'hihat', 'hh', 'closedhat', 'closed_hat', 'closed_hi', 'ch', 'hi_hat') ||
        hasTokenPrefix(norm, 'hat') ||
        hasTokenPrefix(norm, 'hh')
      ) {
        return true
      }
      if (includesAny(compact, 'hihat', 'closedhat')) return true
      return hasHatReference(norm, compact)
    },
  },
  {
    category: 'percs',
    match: (norm, compact) =>
      hasToken(
        norm,
        'perc',
        'percu',
        'tom',
        'conga',
        'shaker',
        'cowbell',
        'tambourine',
        'tamb',
        'bongo',
        'timbale',
        'clave',
        'woodblock',
        'triangle',
      ) ||
      includesAny(compact, 'perc', 'conga', 'shaker', 'cowbell', 'tambourine', 'woodblock'),
  },
  {
    category: 'cymbals',
    match: (norm, compact) =>
      hasToken(norm, 'cymbal', 'cym', 'crash', 'ride', 'splash', 'china') ||
      includesAny(compact, 'cymbal', 'crash', 'ride'),
  },
  {
    category: 'fx',
    match: (norm, compact) =>
      hasToken(
        norm,
        'fx',
        'sfx',
        'impact',
        'riser',
        'sweep',
        'whoosh',
        'reverse',
        'build',
        'downlifter',
        'uplifter',
        'noise',
        'transition',
      ) || includesAny(compact, 'riser', 'whoosh', 'downlifter'),
  },
  {
    category: 'vocals',
    match: (norm, compact) =>
      hasToken(norm, 'vox', 'vocal', 'vocals', 'tag', 'adlib', 'chant', 'choir') ||
      includesAny(compact, 'vocal', 'vox'),
  },
  {
    category: 'bass',
    match: (norm, compact) =>
      hasToken(norm, 'bass', 'bas', 'lowend') || includesAny(compact, 'bass'),
  },
]

export function classifySample(fileName: string): SampleCategory {
  const norm = normalizeForTokens(fileName)
  const compact = compactAlphanumeric(fileName)

  for (const rule of CLASSIFY_RULES) {
    if (rule.match(norm, compact)) {
      return rule.category
    }
  }

  return 'uncategorized'
}
