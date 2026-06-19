import { useEffect, useMemo, useState } from 'react'
import { getCategoryColor, getCategoryLabel } from '../shared/categories'
import { FL_ICON_PRESETS } from '../shared/fl-icons'
import { buildDefaultKitCustomization, defaultCategoryNfo } from '../shared/kit-defaults'
import type { FolderNfoConfig, KitCustomization, KitTheme, SampleRecord } from '../shared/types'
import { CategoryIcon, ImageIcon, ResetIcon, iconForIndex } from './icons'

interface KitCustomizerProps {
  samples: SampleRecord[]
  kitName: string
  customization: KitCustomization
  onChange: (customization: KitCustomization) => void
}

function IconPicker({
  value,
  onChange,
}: {
  value?: number
  onChange: (iconIndex: number) => void
}) {
  return (
    <div className="icon-picker">
      {FL_ICON_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`icon-option ${value === preset.iconIndex ? 'selected' : ''}`}
          title={`${preset.label} (${preset.iconIndex})`}
          onClick={() => onChange(preset.iconIndex)}
        >
          {iconForIndex(preset.iconIndex, { size: 20 })}
          <span className="icon-label">{preset.label}</span>
        </button>
      ))}
    </div>
  )
}

function BannerPicker({
  value,
  onChange,
}: {
  value?: string
  onChange: (bannerImagePath: string | undefined) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }

    let cancelled = false
    window.kitMaker.previewImage(value).then((dataUrl: string) => {
      if (!cancelled) setPreview(dataUrl)
    })

    return () => {
      cancelled = true
    }
  }, [value])

  async function handleChoose() {
    const filePath = await window.kitMaker.selectImageFile()
    if (filePath) onChange(filePath)
  }

  return (
    <div className="banner-picker">
      <div className="banner-preview">
        {preview ? (
          <img src={preview} alt="Folder banner preview" />
        ) : (
          <span className="banner-placeholder">
            <ImageIcon size={22} />
            No banner image
          </span>
        )}
      </div>
      <div className="banner-actions">
        <button type="button" className="small" onClick={handleChoose}>
          <ImageIcon size={15} /> Choose image
        </button>
        {value && (
          <button type="button" className="ghost small" onClick={() => onChange(undefined)}>
            Remove
          </button>
        )}
      </div>
      <p className="hint banner-hint">PNG or JPG shown as the folder banner in FL Studio&apos;s browser.</p>
    </div>
  )
}

function NfoFields({
  config,
  onChange,
  showSortGroup = true,
}: {
  config: FolderNfoConfig
  onChange: (config: FolderNfoConfig) => void
  showSortGroup?: boolean
}) {
  return (
    <div className="nfo-fields">
      <label>
        Color
        <input
          type="color"
          value={config.color ?? '#888888'}
          onChange={(e) => onChange({ ...config, color: e.target.value })}
        />
      </label>
      <label>
        Tooltip
        <input
          type="text"
          value={config.tip ?? ''}
          onChange={(e) => onChange({ ...config, tip: e.target.value })}
          placeholder="Hover text in FL Browser"
        />
      </label>
      {showSortGroup && (
        <label>
          Sort order
          <input
            type="number"
            value={config.sortGroup ?? 0}
            onChange={(e) => onChange({ ...config, sortGroup: Number(e.target.value) })}
          />
        </label>
      )}
      {config.bannerImagePath && (
        <label>
          Banner height
          <input
            type="number"
            min={1}
            max={40}
            value={config.heightOfs ?? 12}
            onChange={(e) => onChange({ ...config, heightOfs: Number(e.target.value) })}
          />
        </label>
      )}
    </div>
  )
}

export function KitCustomizer({ samples, kitName, customization, onChange }: KitCustomizerProps) {
  const [themes, setThemes] = useState<KitTheme[]>([])
  const [themeName, setThemeName] = useState('')
  const [selectedThemeId, setSelectedThemeId] = useState('')

  const categoriesPresent = useMemo(() => {
    const cats = new Set(samples.map((s) => s.category))
    return [...cats].sort(
      (a, b) =>
        (customization.categories[b]?.sortGroup ?? 0) - (customization.categories[a]?.sortGroup ?? 0),
    )
  }, [samples, customization.categories])

  useEffect(() => {
    window.kitMaker.listThemes().then(setThemes)
  }, [])

  async function handleSaveTheme() {
    const name = themeName.trim() || `Theme ${themes.length + 1}`
    const theme = await window.kitMaker.saveTheme(name, customization)
    setThemes((prev) => [...prev, theme])
    setThemeName('')
  }

  async function handleApplyTheme() {
    if (!selectedThemeId) return
    const catIds = [...new Set(samples.map((s) => s.category))]
    const next = await window.kitMaker.applyTheme(selectedThemeId, customization, catIds)
    onChange(next)
  }

  async function handleDeleteTheme(themeId: string) {
    await window.kitMaker.deleteTheme(themeId)
    setThemes((prev) => prev.filter((t) => t.id !== themeId))
    if (selectedThemeId === themeId) setSelectedThemeId('')
  }

  function updateRoot(config: FolderNfoConfig) {
    onChange({ ...customization, kitRoot: config })
  }

  function updateCategory(category: string, config: FolderNfoConfig) {
    onChange({
      ...customization,
      categories: { ...customization.categories, [category]: config },
    })
  }

  function resetAll() {
    onChange(buildDefaultKitCustomization(samples, kitName))
  }

  function resetCategory(category: string) {
    const custom = customization.customCategories.find((c) => c.id === category)
    updateCategory(category, defaultCategoryNfo(category, custom?.label))
  }

  return (
    <section className="panel kit-customizer">
      <div className="section-header">
        <p className="hint no-margin">
          Configure how folders appear in the FL Studio browser. Pick icons, colors, and custom banner images per folder.
        </p>
        <button type="button" className="ghost" onClick={resetAll}>
          <ResetIcon size={15} /> Reset all defaults
        </button>
      </div>

      <div className="theme-bar panel inset">
        <h3 className="section-label">Kit themes</h3>
        <div className="theme-controls">
          <select value={selectedThemeId} onChange={(e) => setSelectedThemeId(e.target.value)}>
            <option value="">Select a saved theme…</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button type="button" className="small" onClick={handleApplyTheme} disabled={!selectedThemeId}>
            Apply
          </button>
          <button type="button" className="ghost small" onClick={() => selectedThemeId && handleDeleteTheme(selectedThemeId)} disabled={!selectedThemeId}>
            Delete
          </button>
        </div>
        <div className="theme-save-row">
          <input
            type="text"
            placeholder="Theme name…"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
          />
          <button type="button" className="small" onClick={handleSaveTheme}>
            Save current as theme
          </button>
        </div>
      </div>

      <div className="customizer-layout">
        <div className="customizer-form">
          <div className="nfo-card root-card">
            <h3>
              <span className="cat-badge" style={{ background: customization.kitRoot.color ?? '#8B5CF6', color: '#fff' }}>
                {iconForIndex(customization.kitRoot.iconIndex ?? 894, { size: 17 })}
              </span>
              Kit root — {kitName}
            </h3>
            <IconPicker
              value={customization.kitRoot.iconIndex}
              onChange={(iconIndex) => updateRoot({ ...customization.kitRoot, iconIndex })}
            />
            <NfoFields config={customization.kitRoot} onChange={updateRoot} showSortGroup={false} />
            <BannerPicker
              value={customization.kitRoot.bannerImagePath}
              onChange={(bannerImagePath) => updateRoot({ ...customization.kitRoot, bannerImagePath })}
            />
          </div>

          {categoriesPresent.map((category) => {
            const custom = customization.customCategories.find((c) => c.id === category)
            const config = customization.categories[category] ?? defaultCategoryNfo(category, custom?.label)
            const color = config.color ?? getCategoryColor(category)
            const label = getCategoryLabel(category, customization.customCategories)
            return (
              <div key={category} className="nfo-card">
                <div className="nfo-card-header">
                  <h3>
                    <span
                      className="cat-badge"
                      style={{ background: `${color}22`, color }}
                    >
                      <CategoryIcon category={category} size={16} />
                    </span>
                    {label}
                  </h3>
                  <button type="button" className="ghost small" onClick={() => resetCategory(category)}>
                    <ResetIcon size={14} /> Reset
                  </button>
                </div>
                <IconPicker
                  value={config.iconIndex}
                  onChange={(iconIndex) => updateCategory(category, { ...config, iconIndex })}
                />
                <NfoFields config={config} onChange={(c) => updateCategory(category, c)} />
                <BannerPicker
                  value={config.bannerImagePath}
                  onChange={(bannerImagePath) => updateCategory(category, { ...config, bannerImagePath })}
                />
              </div>
            )
          })}
        </div>

        <div className="customizer-preview">
          <h3>Browser preview</h3>
          <div className="preview-tree">
            <div
              className="preview-folder root"
              style={{ color: customization.kitRoot.color ?? '#8B5CF6' }}
            >
              {customization.kitRoot.bannerImagePath ? (
                <span className="preview-banner-dot" title="Banner image set" />
              ) : (
                iconForIndex(customization.kitRoot.iconIndex ?? 894, { size: 16 })
              )}
              <span>{kitName}</span>
            </div>
            {categoriesPresent.map((category) => {
              const config = customization.categories[category] ?? defaultCategoryNfo(category)
              const count = samples.filter((s) => s.category === category).length
              const color = config.color ?? getCategoryColor(category)
              const label = getCategoryLabel(category, customization.customCategories)
              return (
                <div
                  key={category}
                  className="preview-folder"
                  style={{ color }}
                  title={config.tip}
                >
                  {config.bannerImagePath ? (
                    <span className="preview-banner-dot" title="Banner image set" />
                  ) : (
                    iconForIndex(config.iconIndex ?? 0, { size: 15 })
                  )}
                  <span>{label}</span>
                  <span className="preview-count">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
