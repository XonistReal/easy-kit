import type { SampleCategory } from './types'

export interface FlIconPreset {
  id: string
  label: string
  iconIndex: number
}

export const FL_ICON_PRESETS: FlIconPreset[] = [
  { id: 'drum', label: 'Drum Kit', iconIndex: 894 },
  { id: 'kick', label: '808 / Kick', iconIndex: 893 },
  { id: 'snare', label: 'Snare', iconIndex: 895 },
  { id: 'hat', label: 'Hi-Hat', iconIndex: 896 },
  { id: 'perc', label: 'Percussion', iconIndex: 897 },
  { id: 'clap', label: 'Clap', iconIndex: 40 },
  { id: 'fx', label: 'FX', iconIndex: 24 },
  { id: 'bass', label: 'Bass', iconIndex: 31 },
  { id: 'vocal', label: 'Vocal', iconIndex: 32 },
  { id: 'star', label: 'Star', iconIndex: 1 },
  { id: 'music', label: 'Music', iconIndex: 2 },
  { id: 'wave', label: 'Wave', iconIndex: 3 },
  { id: 'fire', label: 'Fire', iconIndex: 4 },
  { id: 'diamond', label: 'Diamond', iconIndex: 5 },
  { id: 'crown', label: 'Crown', iconIndex: 8 },
  { id: 'folder', label: 'Folder', iconIndex: 0 },
]

export const CATEGORY_DEFAULT_COLORS: Record<SampleCategory, string> = {
  kicks: '#FF6633',
  snares: '#FF3333',
  claps: '#FFCC00',
  '808s': '#9933FF',
  hihats: '#33CCFF',
  open_hats: '#33DDDD',
  percs: '#33CC66',
  cymbals: '#FFAA33',
  fx: '#3366FF',
  bass: '#6633FF',
  vocals: '#FF33AA',
  uncategorized: '#888888',
}

export const CATEGORY_DEFAULT_ICONS: Record<SampleCategory, number> = {
  kicks: 894,
  snares: 895,
  claps: 40,
  '808s': 893,
  hihats: 896,
  open_hats: 896,
  percs: 897,
  cymbals: 897,
  fx: 24,
  bass: 31,
  vocals: 32,
  uncategorized: 0,
}

export const CATEGORY_DEFAULT_SORT: Record<SampleCategory, number> = {
  kicks: 100,
  snares: 90,
  claps: 80,
  '808s': 70,
  hihats: 60,
  open_hats: 55,
  percs: 50,
  cymbals: 45,
  fx: 40,
  bass: 35,
  vocals: 30,
  uncategorized: 10,
}
