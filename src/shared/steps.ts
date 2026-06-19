export type AppStep = 'scan' | 'review' | 'customize' | 'export'

export interface StepConfig {
  id: AppStep
  label: string
  title: string
  description: string
}

export const STEPS: StepConfig[] = [
  {
    id: 'scan',
    label: 'Scan',
    title: 'Scan Projects',
    description: 'Find samples across your FL Studio projects',
  },
  {
    id: 'review',
    label: 'Review',
    title: 'Review Samples',
    description: 'Filter, preview, and curate your kit',
  },
  {
    id: 'customize',
    label: 'Customize',
    title: 'Customize Kit',
    description: 'FL Studio browser icons and colors',
  },
  {
    id: 'export',
    label: 'Export',
    title: 'Export Kit',
    description: 'Save your organized sound kit',
  },
]

export function getStepConfig(step: AppStep): StepConfig {
  return STEPS.find((s) => s.id === step) ?? STEPS[0]
}

export function getStepIndex(step: AppStep): number {
  const idx = STEPS.findIndex((s) => s.id === step)
  return idx === -1 ? 0 : idx
}

export function isStepEnabled(step: AppStep, hasSamples: boolean): boolean {
  if (step === 'scan') return true
  return hasSamples
}

export function isStepCompleted(step: AppStep, activeStep: AppStep, hasSamples: boolean): boolean {
  if (!hasSamples) return false
  return getStepIndex(step) < getStepIndex(activeStep)
}
