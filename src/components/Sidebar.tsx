import type { AppStep } from '../shared/steps'
import { STEPS, isStepCompleted, isStepEnabled } from '../shared/steps'
import { CheckIcon, DownloadIcon, SearchIcon, SlidersIcon, WaveIcon } from './icons'

interface SidebarProps {
  activeStep: AppStep
  hasSamples: boolean
  onNavigate: (step: AppStep) => void
}

function StepIcon({ step }: { step: AppStep }) {
  switch (step) {
    case 'scan':
      return <SearchIcon size={17} />
    case 'review':
      return <WaveIcon size={17} />
    case 'customize':
      return <SlidersIcon size={17} />
    case 'export':
      return <DownloadIcon size={17} />
  }
}

export function Sidebar({ activeStep, hasSamples, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/favicon.ico" alt="" className="sidebar-logo" />
        <div>
          <span className="sidebar-name">Easy Kit Maker</span>
          <span className="sidebar-name-sub">Studio</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {STEPS.map((step, i) => {
          const enabled = isStepEnabled(step.id, hasSamples)
          const active = activeStep === step.id
          const completed = isStepCompleted(step.id, activeStep, hasSamples)
          return (
            <button
              key={step.id}
              type="button"
              className={`nav-item ${active ? 'active' : ''} ${completed ? 'completed' : ''} ${
                !enabled ? 'disabled' : ''
              }`}
              onClick={() => enabled && onNavigate(step.id)}
              disabled={!enabled}
              title={!enabled ? 'Run a scan first' : step.description}
            >
              <span className="nav-node">{completed ? <CheckIcon size={16} /> : <StepIcon step={step.id} />}</span>
              <span className="nav-label">
                <span className="nav-step-tag">Step {i + 1}</span>
                {step.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="dot" />
        <span>v1.0.0 · Ready</span>
      </div>
    </aside>
  )
}
