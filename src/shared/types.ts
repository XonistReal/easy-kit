export type SampleCategory =
  | 'kicks'
  | 'snares'
  | 'claps'
  | '808s'
  | 'hihats'
  | 'open_hats'
  | 'percs'
  | 'cymbals'
  | 'fx'
  | 'bass'
  | 'vocals'
  | 'uncategorized'

export const SAMPLE_CATEGORIES: SampleCategory[] = [
  'kicks',
  'snares',
  'claps',
  '808s',
  'hihats',
  'open_hats',
  'percs',
  'cymbals',
  'fx',
  'bass',
  'vocals',
  'uncategorized',
]

export const CATEGORY_LABELS: Record<SampleCategory, string> = {
  kicks: 'Kicks',
  snares: 'Snares',
  claps: 'Claps',
  '808s': '808s',
  hihats: 'Hi-Hats',
  open_hats: 'Open Hats',
  percs: 'Percs',
  cymbals: 'Cymbals',
  fx: 'FX',
  bass: 'Bass',
  vocals: 'Vocals',
  uncategorized: 'Uncategorized',
}

export interface SampleRecord {
  id: string
  resolvedPath: string
  fileName: string
  /** Known SampleCategory id or a user-defined custom folder slug */
  category: string
  usageCount: number
  sources: string[]
  sizeBytes: number
  durationMs?: number
  /** Override filename used on export (includes extension) */
  exportFileName?: string
  bpm?: number
  key?: string
  trimStartMs?: number
  trimEndMs?: number
  /** Groups near-duplicate samples (same chromaprint cluster) */
  fingerprintGroupId?: string
}

export interface CustomCategory {
  id: string
  label: string
}

export interface ScanOptions {
  minUsageCount: number
  maxPerCategory: number
  includeUncategorized: boolean
  includeSingles: boolean
  excludeRecordings: boolean
  includeVocals: boolean
  customExcludePaths: string[]
}

export interface ScanProgress {
  phase: 'discovering' | 'parsing' | 'hashing' | 'done'
  current: number
  total: number
  message: string
}

export interface ScanResult {
  samples: SampleRecord[]
  warnings: string[]
  stats: {
    flpFiles: number
    audioFiles: number
    uniqueSamples: number
    duplicatesRemoved: number
    excludedCount: number
    topExclusionReasons: string[]
  }
}

export interface FolderNfoConfig {
  iconIndex?: number
  color?: string
  tip?: string
  sortGroup?: number
  colIndex?: number
  heightOfs?: number
  visible?: boolean
  /** Absolute path to a source image (png/jpg/webp) for FL Browser folder banners */
  bannerImagePath?: string
}

export interface KitCustomization {
  kitRoot: FolderNfoConfig
  categories: Record<string, FolderNfoConfig>
  customCategories: CustomCategory[]
}

export interface ExportResult {
  outputPath: string
  zipPath?: string
  filesCopied: number
  categories: number
  nfoFilesWritten: number
  bannerImagesCopied: number
  installedToFl?: string
}

export interface RecentKitEntry {
  kitName: string
  folderPath: string
  zipPath?: string
  exportedAt: string
  sampleCount: number
}

export interface ExportOptions {
  exportAsZip?: boolean
  normalizeOnExport?: boolean
  normalizeTarget?: 'peak' | '-14lufs'
  installToFl?: boolean
}

export interface LoadManifestResult {
  samples: SampleRecord[]
  customization: KitCustomization | null
  kitName: string
}

export interface KitTheme {
  id: string
  name: string
  kitRoot: FolderNfoConfig
  categories: Record<string, FolderNfoConfig>
  customCategoryDefaults?: FolderNfoConfig
}

export interface WaveformPeaks {
  peaks: number[]
  durationMs: number
}

export interface FingerprintGroup {
  groupId: string
  sampleIds: string[]
}

export interface ImportKitResult {
  samples: SampleRecord[]
  kitName: string
  warnings: string[]
  stats: {
    filesFound: number
    imported: number
    duplicatesSkipped: number
  }
}

export interface AppSettings {
  lastFolders: string[]
  defaultFlProjectsPath: string
  minUsageCount: number
  maxPerCategory: number
  includeUncategorized: boolean
  includeSingles: boolean
  excludeRecordings: boolean
  includeVocals: boolean
  customExcludePaths: string[]
  lastKitName: string
  lastOutputDir: string
  lastKitCustomization: KitCustomization | null
  flPacksPath: string
  recentKits: RecentKitEntry[]
  savedThemes: KitTheme[]
  normalizeOnExport: boolean
  exportAsZip: boolean
  installToFl: boolean
}

/** Resolved at runtime in the Electron main process (see fl-paths.ts). */
export const DEFAULT_FL_PROJECTS_PATH = ''

/** Resolved at runtime in the Electron main process (see fl-paths.ts). */
export const DEFAULT_FL_PACKS_PATH = ''

export const DEFAULT_SETTINGS: AppSettings = {
  lastFolders: [],
  defaultFlProjectsPath: DEFAULT_FL_PROJECTS_PATH,
  minUsageCount: 2,
  maxPerCategory: 20,
  includeUncategorized: true,
  includeSingles: false,
  excludeRecordings: true,
  includeVocals: false,
  customExcludePaths: [],
  lastKitName: 'MyKit',
  lastOutputDir: '',
  lastKitCustomization: null,
  flPacksPath: DEFAULT_FL_PACKS_PATH,
  recentKits: [],
  savedThemes: [],
  normalizeOnExport: false,
  exportAsZip: false,
  installToFl: false,
}
