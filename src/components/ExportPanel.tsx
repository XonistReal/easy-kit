import { useEffect, useState } from 'react'
import type { AppSettings, ExportOptions, KitCustomization, RecentKitEntry, SampleRecord } from '../shared/types'
import { AlertIcon, CheckIcon, DownloadIcon, FolderIcon } from './icons'

interface ExportPanelProps {
  samples: SampleRecord[]
  kitName: string
  outputDir: string
  customization: KitCustomization
  settings: AppSettings
  onKitNameChange: (name: string) => void
  onOutputDirChange: (dir: string) => void
  onSettingsChange: (partial: Partial<AppSettings>) => void
  onLoadKit: (entry: RecentKitEntry) => void
}

export function ExportPanel({
  samples,
  kitName,
  outputDir,
  customization,
  settings,
  onKitNameChange,
  onOutputDirChange,
  onSettingsChange,
  onLoadKit,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(null)
  const [lastZip, setLastZip] = useState<string | null>(null)
  const [installedPath, setInstalledPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentKits, setRecentKits] = useState<RecentKitEntry[]>(settings.recentKits ?? [])

  useEffect(() => {
    setRecentKits(settings.recentKits ?? [])
  }, [settings.recentKits])

  const categoryCount = new Set(samples.map((s) => s.category)).size
  const nfoCount = 1 + Object.keys(customization.categories).length
  const bannerCount =
    (customization.kitRoot.bannerImagePath ? 1 : 0) +
    Object.values(customization.categories).filter((config) => config?.bannerImagePath).length

  async function handleBrowseOutput() {
    const dir = await window.kitMaker.selectOutputFolder()
    if (dir) onOutputDirChange(dir)
  }

  async function handleBrowseFlPacks() {
    const dir = await window.kitMaker.selectFlPacksFolder()
    if (dir) onSettingsChange({ flPacksPath: dir })
  }

  async function handleExport() {
    if (!outputDir || !kitName.trim() || samples.length === 0) return

    setExporting(true)
    setError(null)
    setInstalledPath(null)
    setLastZip(null)

    const options: ExportOptions = {
      exportAsZip: settings.exportAsZip,
      normalizeOnExport: settings.normalizeOnExport,
      normalizeTarget: 'peak',
      installToFl: settings.installToFl,
    }

    try {
      const result = await window.kitMaker.exportKit(
        samples,
        outputDir,
        kitName.trim(),
        customization,
        options,
      )
      setLastExport(result.outputPath)
      if (result.zipPath) setLastZip(result.zipPath)
      if (result.installedToFl) setInstalledPath(result.installedToFl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="panel export-panel">
      <div className="export-summary">
        <div className="export-stat">
          <div className="num">{samples.length}</div>
          <div className="lbl">Samples</div>
        </div>
        <div className="export-stat">
          <div className="num">{categoryCount}</div>
          <div className="lbl">Categories</div>
        </div>
        <div className="export-stat">
          <div className="num">{nfoCount}</div>
          <div className="lbl">.nfo files</div>
        </div>
        <div className="export-stat">
          <div className="num">{bannerCount}</div>
          <div className="lbl">Banners</div>
        </div>
      </div>

      <div className="export-form">
        <label>
          Kit name
          <input
            type="text"
            value={kitName}
            onChange={(e) => onKitNameChange(e.target.value)}
            placeholder="MyKit"
            disabled={exporting}
          />
        </label>

        <label>
          Output folder
          <div className="output-row">
            <input
              type="text"
              value={outputDir}
              onChange={(e) => onOutputDirChange(e.target.value)}
              placeholder="Choose where to save the kit…"
              disabled={exporting}
            />
            <button type="button" onClick={handleBrowseOutput} disabled={exporting}>
              <FolderIcon size={16} /> Browse
            </button>
          </div>
        </label>

        <label>
          FL Studio Packs folder
          <div className="output-row">
            <input
              type="text"
              value={settings.flPacksPath}
              onChange={(e) => onSettingsChange({ flPacksPath: e.target.value })}
              placeholder="Path to FL Browser Packs folder…"
              disabled={exporting}
            />
            <button type="button" onClick={handleBrowseFlPacks} disabled={exporting}>
              <FolderIcon size={16} /> Browse
            </button>
          </div>
        </label>

        <div className="checkbox-grid export-options">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.exportAsZip}
              onChange={(e) => onSettingsChange({ exportAsZip: e.target.checked })}
              disabled={exporting}
            />
            Also export as ZIP
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.normalizeOnExport}
              onChange={(e) => onSettingsChange({ normalizeOnExport: e.target.checked })}
              disabled={exporting}
            />
            Peak-normalize audio on export
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.installToFl}
              onChange={(e) => onSettingsChange({ installToFl: e.target.checked })}
              disabled={exporting}
            />
            Install to FL Browser (Packs folder)
          </label>
        </div>
      </div>

      <div className="export-actions">
        <button
          type="button"
          className="accent lg"
          onClick={handleExport}
          disabled={exporting || !outputDir || !kitName.trim() || samples.length === 0}
        >
          <DownloadIcon size={17} />
          {exporting ? 'Exporting…' : 'Export Kit'}
        </button>
      </div>

      {lastExport && (
        <p className="success">
          <CheckIcon size={16} />
          <span>
            Kit exported to <code>{lastExport}</code>
            {lastZip && <> — ZIP at <code>{lastZip}</code></>}
            {installedPath && <> — installed to FL at <code>{installedPath}</code></>}
          </span>
        </p>
      )}
      {error && (
        <p className="error">
          <AlertIcon size={16} />
          <span>{error}</span>
        </p>
      )}

      {recentKits.length > 0 && (
        <div className="recent-kits">
          <h3>Recent kits</h3>
          <ul>
            {recentKits.map((entry) => (
              <li key={`${entry.folderPath}-${entry.exportedAt}`}>
                <div className="recent-kit-info">
                  <strong>{entry.kitName}</strong>
                  <span className="hint">
                    {entry.sampleCount} samples · {new Date(entry.exportedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="recent-kit-actions">
                  <button type="button" className="ghost small" onClick={() => onLoadKit(entry)}>
                    Load into Review
                  </button>
                  <button
                    type="button"
                    className="ghost small"
                    onClick={() => window.kitMaker.revealInFinder(entry.zipPath ?? entry.folderPath)}
                  >
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
