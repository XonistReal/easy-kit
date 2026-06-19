import { homedir } from 'node:os'
import path from 'node:path'

const FL_PROJECTS_REL = path.join('Documents', 'Image-Line', 'FL Studio', 'Projects')

const FL_PACKS_CANDIDATES = [
  path.join('Documents', 'Image-Line', 'FL Studio', 'Audio', 'Packs'),
  path.join('Documents', 'Image-Line', 'FL Studio', 'Packs'),
]

export function getDefaultFlProjectsPath(): string {
  return path.join(homedir(), FL_PROJECTS_REL)
}

export function getDefaultFlPacksPath(): string {
  return path.join(homedir(), FL_PACKS_CANDIDATES[0])
}

export function getDefaultFlPaths(): { projectsPath: string; packsPath: string } {
  return {
    projectsPath: getDefaultFlProjectsPath(),
    packsPath: getDefaultFlPacksPath(),
  }
}

export const FL_PACKS_PATH_CANDIDATES = FL_PACKS_CANDIDATES
