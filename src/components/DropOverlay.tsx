import { DownloadIcon } from './icons'

interface DropOverlayProps {
  visible: boolean
}

export function DropOverlay({ visible }: DropOverlayProps) {
  if (!visible) return null

  return (
    <div className="drop-overlay">
      <div className="drop-overlay-inner">
        <DownloadIcon size={32} />
        <p>Drop a kit ZIP, folder, or audio files to import</p>
      </div>
    </div>
  )
}
