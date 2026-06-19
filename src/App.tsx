import { useCallback, useEffect, useState, type DragEvent } from 'react'
import { AppShell } from './components/AppShell'
import { ExportPanel } from './components/ExportPanel'
import { FolderPicker } from './components/FolderPicker'
import { KitCustomizer } from './components/KitCustomizer'
import { SampleTable } from './components/SampleTable'
import { ScanProgress } from './components/ScanProgress'
import { AlertIcon, ChevronDownIcon, ChevronRightIcon } from './components/icons'
import { normalizeKitCustomization } from './shared/categories'
import { buildDefaultKitCustomization, mergeCustomization } from './shared/kit-defaults'
import type { AppStep } from './shared/steps'
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type ImportKitResult,
  type KitCustomization,
  type RecentKitEntry,
  type SampleRecord,
  type ScanProgress as ScanProgressType,
  type ScanResult,
} from './shared/types'

const AUDIO_EXTS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.aiff', '.aif'])

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [folders, setFolders] = useState<string[]>([])
  const [samples, setSamples] = useState<SampleRecord[]>([])
  const [kitCustomization, setKitCustomization] = useState<KitCustomization | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<ScanProgressType | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [warningsOpen, setWarningsOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dropActive, setDropActive] = useState(false)
  const [activeStep, setActiveStep] = useState<AppStep>('scan')
  const kitMaker = window.kitMaker

  useEffect(() => {
    if (!kitMaker) return

    kitMaker.getSettings().then((loaded: AppSettings) => {
      setSettings({ ...DEFAULT_SETTINGS, ...loaded })
      if (loaded.lastFolders.length > 0) {
        setFolders(loaded.lastFolders)
      } else if (loaded.defaultFlProjectsPath) {
        setFolders([loaded.defaultFlProjectsPath])
      }
      if (loaded.lastKitCustomization) {
        setKitCustomization(normalizeKitCustomization(loaded.lastKitCustomization))
      }
    })
  }, [kitMaker])

  useEffect(() => {
    if (!kitMaker) return
    const unsubscribe = kitMaker.onScanProgress(setProgress)
    return unsubscribe
  }, [kitMaker])

  useEffect(() => {
    if (samples.length > 0 && !kitCustomization) {
      const customization = buildDefaultKitCustomization(samples, settings.lastKitName)
      setKitCustomization(customization)
    }
  }, [samples, kitCustomization, settings.lastKitName])

  if (!kitMaker) {
    return (
      <div className="app-fallback">
        <h1>Easy Kit Maker</h1>
        <p>Launch with <code>npm run dev</code> to run the desktop app.</p>
      </div>
    )
  }

  function updateSettings(partial: Partial<AppSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      void kitMaker.saveSettings(partial)
      return next
    })
  }

  function handleCustomizationChange(customization: KitCustomization) {
    setKitCustomization(customization)
    void kitMaker.saveSettings({ lastKitCustomization: customization })
  }

  function mergeSamples(existing: SampleRecord[], imported: SampleRecord[]): SampleRecord[] {
    const byId = new Map(existing.map((sample) => [sample.id, sample]))

    for (const sample of imported) {
      const match = byId.get(sample.id)
      if (match) {
        byId.set(sample.id, {
          ...match,
          usageCount: match.usageCount + sample.usageCount,
          sources: [...new Set([...match.sources, ...sample.sources])],
        })
      } else {
        byId.set(sample.id, sample)
      }
    }

    return [...byId.values()].sort((a, b) => b.usageCount - a.usageCount)
  }

  function finishImport(result: ImportKitResult) {
    if (result.samples.length === 0) {
      setWarnings(['No audio samples found.'])
      setWarningsOpen(true)
      return
    }

    const mergedSamples = mergeSamples(samples, result.samples)
    const customization = mergeCustomization(kitCustomization, mergedSamples, settings.lastKitName)

    setSamples(mergedSamples)
    setKitCustomization(customization)
    void kitMaker.saveSettings({ lastKitCustomization: customization })

    const importWarnings = [
      ...result.warnings.slice(0, 10),
      `Imported ${result.stats.imported} sample${result.stats.imported === 1 ? '' : 's'} from ${result.kitName}.`,
    ]
    if (result.stats.duplicatesSkipped > 0) {
      importWarnings.push(`Skipped ${result.stats.duplicatesSkipped} duplicate file(s).`)
    }
    setWarnings(importWarnings)
    setWarningsOpen(importWarnings.length > 0)
    setActiveStep('review')
  }

  async function handleScan() {
    setScanning(true)
    setProgress(null)
    setScanResult(null)
    setWarnings([])
    setSamples([])
    setKitCustomization(null)

    try {
      const result = await kitMaker.startScan(folders, {
        minUsageCount: settings.minUsageCount,
        maxPerCategory: settings.maxPerCategory,
        includeUncategorized: settings.includeUncategorized,
        includeSingles: settings.includeSingles,
        excludeRecordings: settings.excludeRecordings,
        includeVocals: settings.includeVocals,
        customExcludePaths: settings.customExcludePaths,
      })
      setSamples(result.samples)
      setScanResult(result)
      setWarnings(result.warnings.slice(0, 20))
      setWarningsOpen(result.warnings.length > 0)
      const customization = buildDefaultKitCustomization(result.samples, settings.lastKitName)
      setKitCustomization(customization)
      void kitMaker.saveSettings({ lastKitCustomization: customization })
      if (result.samples.length > 0) {
        setActiveStep('review')
      }
    } catch (err) {
      setWarnings([err instanceof Error ? err.message : 'Scan failed'])
      setWarningsOpen(true)
    } finally {
      setScanning(false)
      setProgress(null)
    }
  }

  async function handleImportKit() {
    const srcPath = await kitMaker.selectKitImport()
    if (!srcPath) return

    setImporting(true)
    setWarnings([])

    try {
      const result = await kitMaker.importKit(srcPath)
      finishImport(result)
    } catch (err) {
      setWarnings([err instanceof Error ? err.message : 'Kit import failed'])
      setWarningsOpen(true)
    } finally {
      setImporting(false)
    }
  }

  async function handleLoadRecentKit(entry: RecentKitEntry) {
    try {
      const result = await kitMaker.loadManifest(entry.folderPath)
      if (result.samples.length === 0) {
        setWarnings(['Could not load samples from kit — files may have moved.'])
        setWarningsOpen(true)
        return
      }
      setSamples(result.samples)
      setKitCustomization(
        result.customization ?? buildDefaultKitCustomization(result.samples, result.kitName),
      )
      updateSettings({ lastKitName: result.kitName })
      setActiveStep('review')
    } catch (err) {
      setWarnings([err instanceof Error ? err.message : 'Failed to load kit'])
      setWarningsOpen(true)
    }
  }

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropActive(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) setDropActive(false)
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDropActive(false)

      const files = [...e.dataTransfer.files]
      if (files.length === 0) return

      setImporting(true)
      setWarnings([])

      try {
        const paths: string[] = []
        const audioPaths: string[] = []

        for (const file of files) {
          const filePath = kitMaker.getPathForFile(file)
          const info = await kitMaker.statPath(filePath)
          if (!info) continue

          if (info.isDirectory || filePath.toLowerCase().endsWith('.zip')) {
            const result = await kitMaker.importKit(filePath)
            finishImport(result)
            return
          }

          if (info.isFile) {
            const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
            if (AUDIO_EXTS.has(ext)) audioPaths.push(filePath)
            else paths.push(filePath)
          }
        }

        if (audioPaths.length > 0) {
          const result = await kitMaker.importAudioFiles(audioPaths)
          finishImport(result)
          return
        }

        if (paths.length === 1) {
          const result = await kitMaker.importKit(paths[0])
          finishImport(result)
        }
      } catch (err) {
        setWarnings([err instanceof Error ? err.message : 'Drop import failed'])
        setWarningsOpen(true)
      } finally {
        setImporting(false)
      }
    },
    [kitMaker, samples, kitCustomization, settings.lastKitName],
  )

  async function handleCancelScan() {
    await kitMaker.cancelScan()
    setScanning(false)
    setProgress(null)
  }

  const hasSamples = samples.length > 0

  return (
    <AppShell
      activeStep={activeStep}
      hasSamples={hasSamples}
      scanResult={scanResult}
      kitName={settings.lastKitName}
      onNavigate={setActiveStep}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      dropActive={dropActive}
    >
      {activeStep === 'scan' && (
        <>
          <FolderPicker
            folders={folders}
            settings={settings}
            onChange={(next) => {
              setFolders(next)
              void kitMaker.saveSettings({ lastFolders: next })
            }}
            onSettingsChange={updateSettings}
            onScan={handleScan}
            onImportKit={handleImportKit}
            scanning={scanning}
            importing={importing}
          />
          <ScanProgress progress={progress} onCancel={handleCancelScan} scanning={scanning} />
          {warnings.length > 0 && (
            <section className="panel warnings collapsible">
              <button
                type="button"
                className="warnings-toggle"
                onClick={() => setWarningsOpen(!warningsOpen)}
              >
                <h3>
                  <AlertIcon size={16} /> Warnings ({warnings.length})
                </h3>
                {warningsOpen ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
              </button>
              {warningsOpen && (
                <ul>
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              {scanResult && scanResult.stats.topExclusionReasons.length > 0 && warningsOpen && (
                <div className="exclusion-summary">
                  <strong>Top exclusion reasons:</strong>
                  <ul>
                    {scanResult.stats.topExclusionReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {activeStep === 'review' && hasSamples && kitCustomization && (
        <SampleTable
          samples={samples}
          customization={kitCustomization}
          onSamplesChange={setSamples}
          onCustomizationChange={handleCustomizationChange}
        />
      )}

      {activeStep === 'customize' && hasSamples && kitCustomization && (
        <KitCustomizer
          samples={samples}
          kitName={settings.lastKitName}
          customization={kitCustomization}
          onChange={handleCustomizationChange}
        />
      )}

      {activeStep === 'export' && hasSamples && kitCustomization && (
        <ExportPanel
          samples={samples}
          kitName={settings.lastKitName}
          outputDir={settings.lastOutputDir}
          customization={kitCustomization}
          settings={settings}
          onKitNameChange={(name) => updateSettings({ lastKitName: name })}
          onOutputDirChange={(dir) => updateSettings({ lastOutputDir: dir })}
          onSettingsChange={updateSettings}
          onLoadKit={handleLoadRecentKit}
        />
      )}
    </AppShell>
  )
}
