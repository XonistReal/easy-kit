# Easy Kit Maker

Build organized FL Studio drum kits from your most-used samples — scan projects, review sounds, customize browser folders, and export with `.nfo` styling.

## Features

- Scan FL Studio project folders and rank samples by usage
- Import existing kits (ZIP or folder) and merge with scan results
- Drag-and-drop import for kits and audio files
- Smart rename (`Kick_01`, `Snare_02`, …) with optional BPM/key in filenames
- Custom kit folders with FL Browser icons, colors, and banner images
- Export to folder or ZIP, install to FL Packs, recent kit history
- Kit themes, waveform preview, peak normalization, near-duplicate detection

## Requirements

- macOS (primary target)
- Node.js 20+
- Optional: `fpcalc` for near-duplicate detection (`brew install chromaprint`)

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build:dir
npm run install:mac   # copies app to /Applications
```

## License

Private — Joel Rhoads
