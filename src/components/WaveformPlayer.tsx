import { useEffect, useRef, useState } from 'react'
import type { WaveformPeaks } from '../shared/types'

interface WaveformPlayerProps {
  filePath: string
  audioSrc: string
  onEnded: () => void
}

export function WaveformPlayer({ filePath, audioSrc, onEnded }: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [peaks, setPeaks] = useState<WaveformPeaks | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    window.kitMaker.getWaveformPeaks(filePath).then((data: WaveformPeaks) => {
      if (!cancelled) setPeaks(data)
    })
    return () => {
      cancelled = true
    }
  }, [filePath])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }

    audio.addEventListener('timeupdate', onTime)
    void audio.play()
    return () => audio.removeEventListener('timeupdate', onTime)
  }, [audioSrc])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !peaks) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)
    const barW = width / peaks.peaks.length

    peaks.peaks.forEach((peak, i) => {
      const barH = Math.max(2, peak * (height - 8))
      const x = i * barW
      const y = (height - barH) / 2
      const played = i / peaks.peaks.length <= progress
      ctx.fillStyle = played ? 'rgba(139, 92, 246, 0.9)' : 'rgba(255, 255, 255, 0.25)'
      ctx.fillRect(x, y, Math.max(1, barW - 1), barH)
    })
  }, [peaks, progress])

  function seek(e: React.MouseEvent<HTMLCanvasElement>) {
    const audio = audioRef.current
    const canvas = canvasRef.current
    if (!audio || !canvas || !audio.duration) return
    const rect = canvas.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration
  }

  return (
    <div className="waveform-player">
      <canvas ref={canvasRef} className="waveform-canvas" onClick={seek} />
      <audio ref={audioRef} src={audioSrc} onEnded={onEnded} />
    </div>
  )
}
