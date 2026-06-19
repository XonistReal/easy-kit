import type { ReactElement, ReactNode, SVGProps } from 'react'
import type { SampleCategory } from '../shared/types'
import { isKnownCategory } from '../shared/categories'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 20, strokeWidth = 1.75, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ─── Workflow / UI icons ─── */

export const SearchIcon = (p: IconProps) =>
  base({ ...p, children: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></> })

export const WaveIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M2 12h2.5l2-6 3 16 3-13 2.5 8 2-5H22" />
      </>
    ),
  })

export const SlidersIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <line x1="5" y1="21" x2="5" y2="14" />
        <line x1="5" y1="10" x2="5" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="19" y1="21" x2="19" y2="16" />
        <line x1="19" y1="12" x2="19" y2="3" />
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="10" r="2" />
        <circle cx="19" cy="14" r="2" />
      </>
    ),
  })

export const DownloadIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M21 15v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-3" />
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
      </>
    ),
  })

export const FolderIcon = (p: IconProps) =>
  base({
    ...p,
    children: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  })

export const FolderPlusIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <line x1="9.5" y1="13.5" x2="14.5" y2="13.5" />
      </>
    ),
  })

export const PlusIcon = (p: IconProps) =>
  base({ ...p, children: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></> })

export const TrashIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
  })

export const PlayIcon = (p: IconProps) =>
  base({ ...p, children: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /> })

export const StopIcon = (p: IconProps) =>
  base({ ...p, children: <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" /> })

export const CheckIcon = (p: IconProps) => base({ ...p, children: <path d="m5 12.5 4.5 4.5L19 7" /> })

export const ChevronDownIcon = (p: IconProps) => base({ ...p, children: <path d="m6 9 6 6 6-6" /> })

export const ChevronRightIcon = (p: IconProps) => base({ ...p, children: <path d="m9 6 6 6-6 6" /> })

export const ImageIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="m4 17 4.5-4.5 3 3L16 10l4 5" />
      </>
    ),
  })

export const CloseIcon = (p: IconProps) =>
  base({ ...p, children: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></> })

export const ResetIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
  })

export const AlertIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M10.3 4.3 2.4 18a1.5 1.5 0 0 0 1.3 2.3h16.6a1.5 1.5 0 0 0 1.3-2.3L13.7 4.3a1.5 1.5 0 0 0-2.6 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12" y2="17" />
      </>
    ),
  })

export const SparkleIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <path d="M12 8.5 13.2 11l2.5 1-2.5 1L12 15.5 10.8 13l-2.5-1 2.5-1z" fill="currentColor" stroke="none" />
      </>
    ),
  })

/* ─── Sample category icons ─── */

const KickIcon = (p: IconProps) =>
  base({ ...p, children: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.5" /></> })

const SnareIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <ellipse cx="12" cy="8" rx="8" ry="3" />
        <path d="M4 8v6c0 1.7 3.6 3 8 3s8-1.3 8-3V8" />
        <path d="M4 11h16" />
      </>
    ),
  })

const ClapIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M11 13 6.5 8.5a1.7 1.7 0 0 1 2.4-2.4L13 10" />
        <path d="M13.5 11 9.7 7.2a1.7 1.7 0 0 1 2.4-2.4l4.4 4.4a5 5 0 0 1-7 7L6 13" />
        <path d="M4 4.5 5 6M8 3l.4 1.6M3.5 8.5 5 9" />
      </>
    ),
  })

const EightOhEightIcon = (p: IconProps) =>
  base({
    ...p,
    strokeWidth: 2,
    children: <path d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6" />,
  })

const HiHatIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <ellipse cx="12" cy="9" rx="9" ry="2" />
        <ellipse cx="12" cy="12.5" rx="9" ry="2" />
        <line x1="12" y1="14" x2="12" y2="20" />
      </>
    ),
  })

const OpenHatIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <ellipse cx="12" cy="7" rx="9" ry="2" />
        <ellipse cx="12" cy="14" rx="9" ry="2" />
        <line x1="12" y1="16" x2="12" y2="21" />
      </>
    ),
  })

const PercIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M7 4h4l-1 12a3 3 0 0 1-6 0z" />
        <path d="M13 7h4l1 9a2.5 2.5 0 0 1-5 .4z" />
      </>
    ),
  })

const CymbalIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M2 9c5-2 15-2 20 0-5 2-15 2-20 0z" />
        <line x1="12" y1="9" x2="12" y2="20" />
        <path d="M9 20h6" />
      </>
    ),
  })

const BassIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <circle cx="12" cy="14" r="4" />
        <circle cx="12" cy="6.5" r="1" />
      </>
    ),
  })

const VocalIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8.5" y1="22" x2="15.5" y2="22" />
      </>
    ),
  })

const QuestionFolderIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M10.5 11.5a1.5 1.5 0 1 1 2 1.4c-.6.3-.9.6-.9 1.3" />
        <line x1="11.6" y1="16" x2="11.6" y2="16" />
      </>
    ),
  })

export const CATEGORY_ICONS: Record<SampleCategory, (p: IconProps) => ReactElement> = {
  kicks: KickIcon,
  snares: SnareIcon,
  claps: ClapIcon,
  '808s': EightOhEightIcon,
  hihats: HiHatIcon,
  open_hats: OpenHatIcon,
  percs: PercIcon,
  cymbals: CymbalIcon,
  fx: SparkleIcon,
  bass: BassIcon,
  vocals: VocalIcon,
  uncategorized: QuestionFolderIcon,
}

export function CategoryIcon({ category, ...p }: IconProps & { category: string }) {
  const Cmp = isKnownCategory(category) ? CATEGORY_ICONS[category] : FolderIcon
  return <Cmp {...p} />
}

/* ─── FL icon-index → SVG mapping (for the customizer icon picker & preview) ─── */

const CrownIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M3 7l3.5 4L12 5l5.5 6L21 7l-1.5 11h-15z" />
        <line x1="5" y1="18" x2="19" y2="18" />
      </>
    ),
  })

const DiamondIcon = (p: IconProps) =>
  base({ ...p, children: <path d="M5.5 4h13l3 5-9.5 11L2.5 9z M2.5 9h19 M9 4l-2 5 5 11 M15 4l2 5-5 11" /> })

const FireIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.7C9 9.5 9.5 7 12 3z M12 21a4 4 0 0 1-4-4c0-2 1.5-3 2-4 .3 1.5 1.2 2 2 2.5.8-.5 1.2-1.5 1.2-2.3 1 1 2.8 2 2.8 3.8a4 4 0 0 1-4 4z" />
    ),
  })

const StarIcon = (p: IconProps) =>
  base({ ...p, children: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" /> })

const MusicIcon = (p: IconProps) =>
  base({
    ...p,
    children: (
      <>
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </>
    ),
  })

export type IconKey =
  | SampleCategory
  | 'drum'
  | 'crown'
  | 'diamond'
  | 'fire'
  | 'star'
  | 'music'
  | 'folder'
  | 'fx'
  | 'wave'

/** Maps the FL Studio IconIndex values used in fl-icons.ts to a custom SVG. */
export function iconForIndex(iconIndex: number, props: IconProps = {}) {
  switch (iconIndex) {
    case 894:
      return <KickIcon {...props} />
    case 893:
      return <EightOhEightIcon {...props} />
    case 895:
      return <SnareIcon {...props} />
    case 896:
      return <HiHatIcon {...props} />
    case 897:
      return <PercIcon {...props} />
    case 40:
      return <ClapIcon {...props} />
    case 24:
      return <SparkleIcon {...props} />
    case 31:
      return <BassIcon {...props} />
    case 32:
      return <VocalIcon {...props} />
    case 1:
      return <StarIcon {...props} />
    case 2:
      return <MusicIcon {...props} />
    case 3:
      return <WaveIcon {...props} />
    case 4:
      return <FireIcon {...props} />
    case 5:
      return <DiamondIcon {...props} />
    case 8:
      return <CrownIcon {...props} />
    case 14:
      return <SparkleIcon {...props} />
    default:
      return <FolderIcon {...props} />
  }
}

export { CrownIcon, DiamondIcon, FireIcon, StarIcon, MusicIcon }
