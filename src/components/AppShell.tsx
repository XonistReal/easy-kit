import type { DragEvent, ReactNode } from 'react'
import type { AppStep } from '../shared/steps'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { DropOverlay } from './DropOverlay'
import type { ScanResult } from '../shared/types'

interface AppShellProps {
  activeStep: AppStep
  hasSamples: boolean
  scanResult: ScanResult | null
  kitName: string
  onNavigate: (step: AppStep) => void
  onDrop: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  dropActive: boolean
  children: ReactNode
}

export function AppShell({
  activeStep,
  hasSamples,
  scanResult,
  kitName,
  onNavigate,
  onDrop,
  onDragOver,
  onDragLeave,
  dropActive,
  children,
}: AppShellProps) {
  return (
    <div
      className="app-shell"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <DropOverlay visible={dropActive} />
      <Sidebar activeStep={activeStep} hasSamples={hasSamples} onNavigate={onNavigate} />
      <div className="main-column">
        <TopBar activeStep={activeStep} scanResult={scanResult} kitName={kitName} />
        <main className={`main-content${activeStep === 'review' ? ' main-content-review' : ''}`}>{children}</main>
      </div>
    </div>
  )
}
