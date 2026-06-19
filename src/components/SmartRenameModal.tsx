import { useMemo } from 'react'
import { buildSmartRenameMap } from '../shared/smart-rename'
import type { CustomCategory, SampleRecord } from '../shared/types'

interface SmartRenameModalProps {
  samples: SampleRecord[]
  customCategories: CustomCategory[]
  includeBpmKey: boolean
  onIncludeBpmKeyChange: (value: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}

export function SmartRenameModal({
  samples,
  customCategories,
  includeBpmKey,
  onIncludeBpmKeyChange,
  onConfirm,
  onCancel,
}: SmartRenameModalProps) {
  const preview = useMemo(() => {
    const map = buildSmartRenameMap(samples, customCategories, { includeBpmKey })
    return samples.slice(0, 12).map((s) => ({
      id: s.id,
      from: s.exportFileName ?? s.fileName,
      to: map.get(s.id) ?? s.fileName,
    }))
  }, [samples, customCategories, includeBpmKey])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Smart rename</h3>
        <p className="hint">
          Renames samples per category as <code>Kick_01.wav</code>, <code>Snare_02.wav</code>, etc. (sorted by usage).
        </p>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeBpmKey}
            onChange={(e) => onIncludeBpmKeyChange(e.target.checked)}
          />
          Include BPM and key in names when available
        </label>
        <div className="rename-preview">
          <table>
            <thead>
              <tr>
                <th>Current</th>
                <th>New name</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.id}>
                  <td className="file-cell">{row.from}</td>
                  <td>{row.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {samples.length > 12 && (
            <p className="hint">…and {samples.length - 12} more</p>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={onConfirm}>
            Apply rename
          </button>
        </div>
      </div>
    </div>
  )
}
