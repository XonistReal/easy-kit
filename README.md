# Easy Kit Maker

Build organized FL Studio drum kits from your most-used samples — scan projects, review sounds, customize browser folders, and export with `.nfo` styling.

**Repository:** [github.com/XonistReal/easy-kit](https://github.com/XonistReal/easy-kit)

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
git clone https://github.com/XonistReal/easy-kit.git
cd easy-kit
npm ci
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite + Electron in development |
| `npm run typecheck` | Run TypeScript without emitting |
| `npm run build:dir` | Build unpacked macOS app in `release/` |
| `npm run build` | Build macOS DMG + ZIP |
| `npm run install:mac` | Copy built app to `/Applications` |

## Project layout

```text
electron/main/     Main process (scan, export, IPC)
electron/preload/  Preload bridge
src/components/    React UI
src/shared/        Shared types and helpers
build/             App icons for electron-builder
public/            Static assets (favicon)
```

## License

MIT © Joel Rhoads
