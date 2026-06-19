import type { KitMakerApi } from '../../electron/preload/index'
import type {
  AppSettings,
  ExportOptions,
  ExportResult,
  ImportKitResult,
  KitCustomization,
  KitTheme,
  LoadManifestResult,
  RecentKitEntry,
  SampleRecord,
  ScanOptions,
  ScanProgress,
  ScanResult,
  WaveformPeaks,
  FingerprintGroup,
} from './shared/types'

declare global {
  interface Window {
    kitMaker: KitMakerApi
  }
}

export type {
  AppSettings,
  ExportOptions,
  ExportResult,
  ImportKitResult,
  KitMakerApi,
  KitTheme,
  LoadManifestResult,
  RecentKitEntry,
  SampleRecord,
  ScanOptions,
  ScanProgress,
  ScanResult,
  WaveformPeaks,
  FingerprintGroup,
}
