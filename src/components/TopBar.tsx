import { getStepConfig, type AppStep } from '../shared/steps'
import type { ScanResult } from '../shared/types'
import { SparkleIcon } from './icons'

interface TopBarProps {
  activeStep: AppStep
  scanResult: ScanResult | null
  kitName: string
}

export function TopBar({ activeStep, scanResult, kitName }: TopBarProps) {
  const step = getStepConfig(activeStep)

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{step.title}</h1>
        <p className="topbar-subtitle">{step.description}</p>
      </div>

      <div className="topbar-right">
        {scanResult && (
          <div className="topbar-stats">
            <span className="stat-pill">
              <strong>{scanResult.stats.flpFiles}</strong> projects
            </span>
            <span className="stat-pill">
              <strong>{scanResult.stats.uniqueSamples}</strong> sounds
            </span>
            <span className="stat-pill">
              <strong>{scanResult.stats.duplicatesRemoved}</strong> dupes
            </span>
            {scanResult.stats.excludedCount > 0 && (
              <span className="stat-pill success">
                <strong>{scanResult.stats.excludedCount.toLocaleString()}</strong> skipped
              </span>
            )}
          </div>
        )}
        {kitName && (
          <span className="kit-chip">
            <SparkleIcon size={14} />
            {kitName}
          </span>
        )}
      </div>
    </header>
  )
}
