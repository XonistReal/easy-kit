import { useState } from 'react'
import type { AppSettings } from '../shared/types'
import { DownloadIcon, FolderIcon, FolderPlusIcon, PlusIcon, SlidersIcon, TrashIcon } from './icons'

interface FolderPickerProps {
  folders: string[]
  settings: AppSettings
  onChange: (folders: string[]) => void
  onSettingsChange: (settings: Partial<AppSettings>) => void
  onScan: () => void
  onImportKit: () => void
  scanning: boolean
  importing: boolean
}

export function FolderPicker({
  folders,
  settings,
  onChange,
  onSettingsChange,
  onScan,
  onImportKit,
  scanning,
  importing,
}: FolderPickerProps) {
  const [newFolder, setNewFolder] = useState('')

  async function handleBrowse() {
    const selected = await window.kitMaker.selectFolders()
    if (selected.length > 0) {
      const merged = [...new Set([...folders, ...selected])]
      onChange(merged)
    }
  }

  function addManualFolder() {
    const trimmed = newFolder.trim()
    if (!trimmed || folders.includes(trimmed)) return
    onChange([...folders, trimmed])
    setNewFolder('')
  }

  const busy = scanning || importing

  function useDefaultPath() {
    if (!settings.defaultFlProjectsPath) return
    if (!folders.includes(settings.defaultFlProjectsPath)) {
      onChange([...folders, settings.defaultFlProjectsPath])
    }
  }

  const optionsSummary = [
    settings.excludeRecordings ? 'No vocals' : 'All audio',
    settings.includeSingles ? 'Singles on' : `Min ${settings.minUsageCount} uses`,
    `Top ${settings.maxPerCategory}/category`,
  ].join(' · ')

  return (
    <div className="scan-view">
      <div className="stat-cards">
        <div className="stat-card">
          <FolderIcon className="stat-card-icon" size={22} />
          <span className="stat-card-label">Folders</span>
          <span className="stat-card-value">{folders.length}</span>
          <span className="stat-card-hint">project directories</span>
        </div>
        <div className="stat-card">
          <SlidersIcon className="stat-card-icon" size={22} />
          <span className="stat-card-label">Scan options</span>
          <span className="stat-card-value-sm">{optionsSummary}</span>
        </div>
        <div className="stat-card stat-card-cta">
          <div>
            <span className="stat-card-label">Ready to go</span>
            <span className="stat-card-hint">
              {folders.length === 0 ? 'Add a folder to begin' : `Scan ${folders.length} folder${folders.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <div className="cta-actions">
            <button
              type="button"
              className="primary lg"
              onClick={onScan}
              disabled={busy || folders.length === 0}
            >
              {scanning ? 'Scanning…' : 'Start scan'}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={onImportKit}
              disabled={busy}
            >
              <DownloadIcon size={16} />
              {importing ? 'Importing…' : 'Import kit'}
            </button>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <div className="how-step">
          <span className="how-num">1</span>
          <span>Add your FL Studio project folders</span>
        </div>
        <div className="how-step">
          <span className="how-num">2</span>
          <span>We parse .flp files and find your most-used sounds</span>
        </div>
        <div className="how-step">
          <span className="how-num">3</span>
          <span>Review, customize, and export an organized kit</span>
        </div>
      </div>

      <section className="panel setup-panel">
        <h3 className="section-label">
          <FolderIcon size={15} /> Source folders
        </h3>
        <div className="folder-actions">
          <button type="button" onClick={handleBrowse} disabled={busy}>
            <FolderPlusIcon size={16} /> Browse folders
          </button>
          <button type="button" onClick={useDefaultPath} disabled={busy}>
            <FolderIcon size={16} /> Use FL Projects folder
          </button>
          <button type="button" onClick={onImportKit} disabled={busy}>
            <DownloadIcon size={16} /> Import existing kit
          </button>
        </div>

        <div className="manual-folder">
          <input
            type="text"
            placeholder="Or paste a folder path…"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManualFolder()}
            disabled={busy}
          />
          <button type="button" onClick={addManualFolder} disabled={scanning || !newFolder.trim()}>
            <PlusIcon size={16} /> Add
          </button>
        </div>

        <ul className="folder-list">
          {folders.length === 0 && <li className="empty">No folders selected yet.</li>}
          {folders.map((folder) => (
            <li key={folder}>
              <span className="folder-path" title={folder}>
                <FolderIcon size={16} />
                <span>{folder}</span>
              </span>
              <button
                type="button"
                className="icon-button ghost"
                onClick={() => onChange(folders.filter((f) => f !== folder))}
                disabled={busy}
                aria-label={`Remove ${folder}`}
                title="Remove"
              >
                <TrashIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel settings-panel">
        <h3 className="section-label">
          <SlidersIcon size={15} /> Scan settings
        </h3>
        <div className="options-grid options-numbers">
          <label>
            Min usage count
            <input
              type="number"
              min={1}
              max={50}
              value={settings.minUsageCount}
              onChange={(e) => onSettingsChange({ minUsageCount: Number(e.target.value) })}
              disabled={scanning || settings.includeSingles}
            />
          </label>
          <label>
            Max per category
            <input
              type="number"
              min={5}
              max={50}
              value={settings.maxPerCategory}
              onChange={(e) => onSettingsChange({ maxPerCategory: Number(e.target.value) })}
              disabled={busy}
            />
          </label>
        </div>

        <div className="checkbox-grid">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.includeSingles}
              onChange={(e) => onSettingsChange({ includeSingles: e.target.checked })}
              disabled={busy}
            />
            Include samples used only once
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.includeUncategorized}
              onChange={(e) => onSettingsChange({ includeUncategorized: e.target.checked })}
              disabled={busy}
            />
            Include uncategorized samples
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.excludeRecordings}
              onChange={(e) => onSettingsChange({ excludeRecordings: e.target.checked })}
              disabled={busy}
            />
            Exclude vocal recordings and takes
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.includeVocals}
              onChange={(e) => onSettingsChange({ includeVocals: e.target.checked })}
              disabled={scanning || !settings.excludeRecordings}
            />
            Include vocals in results
          </label>
        </div>

        <details className="exclude-patterns">
          <summary>Custom exclude patterns</summary>
          <label>
            Folder or filename patterns (one per line)
            <textarea
              rows={3}
              value={settings.customExcludePaths.join('\n')}
              onChange={(e) =>
                onSettingsChange({
                  customExcludePaths: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                })
              }
              placeholder="my vocals&#10;dry vocal"
              disabled={busy}
            />
          </label>
        </details>
      </section>
    </div>
  )
}
