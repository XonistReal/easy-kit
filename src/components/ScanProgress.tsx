import type { ScanProgress as ScanProgressType } from '../shared/types'
import { CloseIcon, WaveIcon } from './icons'

interface ScanProgressProps {
  progress: ScanProgressType | null
  onCancel: () => void
  scanning: boolean
}

export function ScanProgress({ progress, onCancel, scanning }: ScanProgressProps) {
  if (!scanning || !progress) return null

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <section className="panel scan-progress">
      <div className="progress-header">
        <div>
          <h3>
            <WaveIcon size={18} /> Scanning projects
          </h3>
          <span className="progress-phase">{progress.phase}</span>
        </div>
        <button type="button" className="ghost" onClick={onCancel}>
          <CloseIcon size={15} /> Cancel
        </button>
      </div>
      <div className="progress-bar segmented">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-footer">
        <p className="progress-message">{progress.message}</p>
        <span className="progress-count">{progress.current} / {progress.total}</span>
      </div>
    </section>
  )
}
