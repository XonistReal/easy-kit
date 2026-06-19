import { useMemo, useState } from 'react'
import {
  getCategoryColor,
  getCategoryLabel,
  getDisplayedCategoryIds,
  getSelectableCategoryIds,
  slugifyCategory,
} from '../shared/categories'
import { defaultCategoryNfo } from '../shared/kit-defaults'
import { applySmartRename } from '../shared/smart-rename'
import { countFingerprintDupes, keepBestInFingerprintGroups } from '../shared/fingerprint-utils'
import {
  type KitCustomization,
  SAMPLE_CATEGORIES,
  type SampleRecord,
} from '../shared/types'
import { CategoryIcon, FolderPlusIcon, PlayIcon, SearchIcon, StopIcon, TrashIcon, WaveIcon } from './icons'
import { SmartRenameModal } from './SmartRenameModal'
import { WaveformPlayer } from './WaveformPlayer'

interface SampleTableProps {
  samples: SampleRecord[]
  customization: KitCustomization
  onSamplesChange: (samples: SampleRecord[]) => void
  onCustomizationChange: (customization: KitCustomization) => void
}

type SortKey = 'fileName' | 'category' | 'usageCount' | 'sizeBytes'

export function SampleTable({
  samples,
  customization,
  onSamplesChange,
  onCustomizationChange,
}: SampleTableProps) {
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('usageCount')
  const [sortAsc, setSortAsc] = useState(false)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newFolderName, setNewFolderName] = useState('')
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showSmartRename, setShowSmartRename] = useState(false)
  const [smartRenameBpmKey, setSmartRenameBpmKey] = useState(false)
  const [detectingDupes, setDetectingDupes] = useState(false)

  const dupeCount = useMemo(() => countFingerprintDupes(samples), [samples])

  const selectableCategoryIds = useMemo(
    () => getSelectableCategoryIds(customization.customCategories),
    [customization.customCategories],
  )

  const displayedCategoryIds = useMemo(
    () => getDisplayedCategoryIds(samples, customization.customCategories),
    [samples, customization.customCategories],
  )

  const filtered = useMemo(() => {
    let list = samples

    if (filterCategory !== 'all') {
      list = list.filter((s) => s.category === filterCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.fileName.toLowerCase().includes(q) ||
          s.sources.some((src) => src.toLowerCase().includes(q)),
      )
    }

    return [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av)
    })
  }, [samples, filterCategory, search, sortKey, sortAsc])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const sample of samples) {
      counts.set(sample.category, (counts.get(sample.category) ?? 0) + 1)
    }
    return counts
  }, [samples])

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id))

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function updateCategory(id: string, category: string) {
    onSamplesChange(samples.map((s) => (s.id === id ? { ...s, category } : s)))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const s of filtered) next.delete(s.id)
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const s of filtered) next.add(s.id)
        return next
      })
    }
  }

  function updateExportFileName(id: string, exportFileName: string) {
    const trimmed = exportFileName.trim()
    onSamplesChange(
      samples.map((s) =>
        s.id === id ? { ...s, exportFileName: trimmed || undefined } : s,
      ),
    )
    setEditingId(null)
  }

  function startEditName(sample: SampleRecord) {
    setEditingId(sample.id)
    setEditName(sample.exportFileName ?? sample.fileName)
  }

  function applySmartRenameConfirm() {
    onSamplesChange(applySmartRename(samples, customization.customCategories, { includeBpmKey: smartRenameBpmKey }))
    setShowSmartRename(false)
  }

  async function handleDetectDupes() {
    setDetectingDupes(true)
    try {
      const result = await window.kitMaker.detectFingerprints(samples)
      onSamplesChange(result.samples)
    } finally {
      setDetectingDupes(false)
    }
  }

  function handleKeepBestDupes() {
    onSamplesChange(keepBestInFingerprintGroups(samples))
  }

  function removeSelected() {
    if (selected.size === 0) return
    onSamplesChange(samples.filter((s) => !selected.has(s.id)))
    setSelected(new Set())
  }

  function addCustomFolder() {
    const label = newFolderName.trim()
    if (!label) return

    const existingIds = new Set([
      ...SAMPLE_CATEGORIES,
      ...customization.customCategories.map((c) => c.id),
    ])
    const id = slugifyCategory(label, existingIds)
    if (customization.customCategories.some((c) => c.id === id)) return

    onCustomizationChange({
      ...customization,
      customCategories: [...customization.customCategories, { id, label }],
      categories: {
        ...customization.categories,
        [id]: defaultCategoryNfo(id, label),
      },
    })
    setNewFolderName('')
    setShowAddFolder(false)
  }

  function removeCustomFolder(id: string) {
    onCustomizationChange({
      ...customization,
      customCategories: customization.customCategories.filter((c) => c.id !== id),
      categories: Object.fromEntries(
        Object.entries(customization.categories).filter(([key]) => key !== id),
      ),
    })
    onSamplesChange(
      samples.map((s) => (s.category === id ? { ...s, category: 'uncategorized' } : s)),
    )
    if (filterCategory === id) setFilterCategory('all')
  }

  async function playSample(sample: SampleRecord) {
    if (previewing === sample.id) {
      setPreviewing(null)
      setAudioSrc(null)
      return
    }

    try {
      const src = await window.kitMaker.previewAudio(sample.resolvedPath)
      setAudioSrc(src)
      setPreviewing(sample.id)
    } catch {
      setPreviewing(null)
      setAudioSrc(null)
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <section className="panel review-panel full-height">
      <div className="review-toolbar">
        <div className="review-search">
          <SearchIcon size={16} />
          <input
            type="search"
            placeholder="Search by name or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selected.size > 0 && (
          <button type="button" className="ghost danger" onClick={removeSelected}>
            <TrashIcon size={15} /> Remove {selected.size}
          </button>
        )}
        <button type="button" className="ghost" onClick={() => setShowSmartRename(true)}>
          Smart rename
        </button>
        {dupeCount > 0 && (
          <button type="button" className="ghost" onClick={handleKeepBestDupes}>
            Keep best dupes ({dupeCount})
          </button>
        )}
        <button type="button" className="ghost" onClick={handleDetectDupes} disabled={detectingDupes}>
          {detectingDupes ? 'Scanning…' : 'Find near-dupes'}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => setShowAddFolder((open) => !open)}
        >
          <FolderPlusIcon size={15} /> Add folder
        </button>
        <span className="count-badge">{filtered.length} shown</span>
      </div>

      {showAddFolder && (
        <div className="manual-folder add-folder-row">
          <input
            type="text"
            placeholder="New folder name (e.g. Loops, Vocal Chops)…"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomFolder()}
          />
          <button type="button" onClick={addCustomFolder} disabled={!newFolderName.trim()}>
            Create
          </button>
          <button type="button" className="ghost" onClick={() => setShowAddFolder(false)}>
            Cancel
          </button>
        </div>
      )}

      <div className="category-tabs">
        <button
          type="button"
          className={filterCategory === 'all' ? 'active' : ''}
          onClick={() => setFilterCategory('all')}
        >
          <WaveIcon size={15} /> All <span className="tab-count">{samples.length}</span>
        </button>
        {displayedCategoryIds.map((cat) => {
          const count = categoryCounts.get(cat) ?? 0
          if (count === 0) return null
          const activeCat = filterCategory === cat
          const color = getCategoryColor(cat)
          const isCustom = customization.customCategories.some((c) => c.id === cat)
          return (
            <button
              key={cat}
              type="button"
              className={activeCat ? 'active' : ''}
              onClick={() => setFilterCategory(cat)}
              style={activeCat ? { color } : undefined}
            >
              <CategoryIcon category={cat} size={15} />
              {getCategoryLabel(cat, customization.customCategories)}{' '}
              <span className="tab-count">{count}</span>
              {isCustom && (
                <span
                  className="tab-remove"
                  role="button"
                  tabIndex={0}
                  title={`Remove ${getCategoryLabel(cat, customization.customCategories)} folder`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCustomFolder(cat)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      removeCustomFolder(cat)
                    }
                  }}
                >
                  ×
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th>
                <button type="button" className="sort-btn" onClick={() => toggleSort('fileName')}>
                  File {sortKey === 'fileName' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type="button" className="sort-btn" onClick={() => toggleSort('category')}>
                  Category {sortKey === 'category' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>
                <button type="button" className="sort-btn" onClick={() => toggleSort('usageCount')}>
                  Used {sortKey === 'usageCount' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>Projects</th>
              <th>BPM</th>
              <th>Key</th>
              <th>
                <button type="button" className="sort-btn" onClick={() => toggleSort('sizeBytes')}>
                  Size {sortKey === 'sizeBytes' ? (sortAsc ? '↑' : '↓') : ''}
                </button>
              </th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-row">
                  No samples match your filters.
                </td>
              </tr>
            )}
            {filtered.map((sample) => {
              const color = getCategoryColor(sample.category)
              const displayName = sample.exportFileName ?? sample.fileName
              return (
                <tr key={sample.id} className={selected.has(sample.id) ? 'selected-row' : ''}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selected.has(sample.id)}
                      onChange={() => toggleSelect(sample.id)}
                      aria-label={`Select ${sample.fileName}`}
                    />
                  </td>
                  <td className="file-cell" title={sample.resolvedPath}>
                    {editingId === sample.id ? (
                      <input
                        className="inline-edit"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => updateExportFileName(sample.id, editName)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateExportFileName(sample.id, editName)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                      />
                    ) : (
                      <button type="button" className="file-name-btn" onClick={() => startEditName(sample)}>
                        {displayName}
                        {sample.exportFileName && sample.exportFileName !== sample.fileName && (
                          <span className="rename-hint" title={`Original: ${sample.fileName}`}> ✎</span>
                        )}
                        {sample.fingerprintGroupId && (
                          <span className="dupe-badge" title="Near-duplicate group"> dupe</span>
                        )}
                      </button>
                    )}
                  </td>
                  <td>
                    <span
                      className="category-pill"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      <CategoryIcon category={sample.category} size={15} />
                      <select
                        className="category-select"
                        value={sample.category}
                        onChange={(e) => updateCategory(sample.id, e.target.value)}
                      >
                        {selectableCategoryIds.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat, customization.customCategories)}
                          </option>
                        ))}
                      </select>
                    </span>
                  </td>
                  <td className="usage-cell">{sample.usageCount}×</td>
                  <td className="sources-cell" title={sample.sources.join(', ')}>
                    {sample.sources.slice(0, 2).join(', ')}
                    {sample.sources.length > 2 ? ` +${sample.sources.length - 2}` : ''}
                  </td>
                  <td className="meta-cell">{sample.bpm ? Math.round(sample.bpm) : '—'}</td>
                  <td className="meta-cell">{sample.key ?? '—'}</td>
                  <td>{formatSize(sample.sizeBytes)}</td>
                  <td>
                    <button
                      type="button"
                      className={`play-btn ${previewing === sample.id ? 'playing' : ''}`}
                      onClick={() => playSample(sample)}
                      aria-label={previewing === sample.id ? 'Stop preview' : 'Play preview'}
                      title={previewing === sample.id ? 'Stop' : 'Play'}
                    >
                      {previewing === sample.id ? <StopIcon size={15} /> : <PlayIcon size={15} />}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {audioSrc && previewing && (
        <WaveformPlayer
          filePath={samples.find((s) => s.id === previewing)?.resolvedPath ?? ''}
          audioSrc={audioSrc}
          onEnded={() => {
            setPreviewing(null)
            setAudioSrc(null)
          }}
        />
      )}

      {showSmartRename && (
        <SmartRenameModal
          samples={samples}
          customCategories={customization.customCategories}
          includeBpmKey={smartRenameBpmKey}
          onIncludeBpmKeyChange={setSmartRenameBpmKey}
          onConfirm={applySmartRenameConfirm}
          onCancel={() => setShowSmartRename(false)}
        />
      )}
    </section>
  )
}
