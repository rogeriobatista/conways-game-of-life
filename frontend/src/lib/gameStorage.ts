import { INVADERS_COLS, INVADERS_ROWS } from '../play/invadersLogic'

export const METEOR_CUSTOM_BLOCKS_KEY = 'conway-gol.meteor.customBlocks.v1'
export const INVADERS_SETUP_KEY = 'conway-gol.invaders.setup.v1'
export const INVADERS_SCORES_KEY = 'conway-gol.invaders.scores.v1'

export type InvadersStoredSetup = {
  aliens?: boolean[][]
  shipMask?: boolean[][]
}

export type InvadersScoreEntry = {
  id: string
  score: number
  status: 'won' | 'lost'
  savedAt: number
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadMeteorCustomBlocks(): boolean[][][] {
  const data = readJson<{ shapes?: boolean[][][] }>(METEOR_CUSTOM_BLOCKS_KEY)
  if (!data?.shapes?.length) return []
  return data.shapes.filter((s) => Array.isArray(s) && s.length > 0)
}

export function saveMeteorCustomBlocks(shapes: boolean[][][]): void {
  localStorage.setItem(METEOR_CUSTOM_BLOCKS_KEY, JSON.stringify({ shapes }))
}

export function loadInvadersSetup(): InvadersStoredSetup {
  const data = readJson<InvadersStoredSetup>(INVADERS_SETUP_KEY)
  if (!data) return {}
  return {
    aliens: normalizeAliens(data.aliens),
    shipMask: data.shipMask,
  }
}

function normalizeAliens(raw: boolean[][] | undefined): boolean[][] | undefined {
  if (!raw?.length) return undefined
  const out: boolean[][] = []
  for (let r = 0; r < INVADERS_ROWS; r++) {
    const row: boolean[] = []
    for (let c = 0; c < INVADERS_COLS; c++) {
      row.push(Boolean(raw[r]?.[c]))
    }
    out.push(row)
  }
  return out
}

export function saveInvadersSetup(setup: InvadersStoredSetup): void {
  const payload: InvadersStoredSetup = {
    aliens: setup.aliens ? normalizeAliens(setup.aliens) : undefined,
    shipMask: setup.shipMask,
  }
  localStorage.setItem(INVADERS_SETUP_KEY, JSON.stringify(payload))
}

const MAX_INVADERS_SCORES = 30

export function loadInvadersScores(): InvadersScoreEntry[] {
  const data = readJson<{ entries?: InvadersScoreEntry[] }>(INVADERS_SCORES_KEY)
  if (!data?.entries?.length) return []
  return [...data.entries].sort((a, b) => b.score - a.score).slice(0, MAX_INVADERS_SCORES)
}

export function appendInvadersScore(entry: Omit<InvadersScoreEntry, 'id' | 'savedAt'> & { id?: string }): void {
  const prev = loadInvadersScores()
  const row: InvadersScoreEntry = {
    id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    score: entry.score,
    status: entry.status,
    savedAt: Date.now(),
  }
  const merged = [...prev, row].sort((a, b) => b.score - a.score).slice(0, MAX_INVADERS_SCORES)
  localStorage.setItem(INVADERS_SCORES_KEY, JSON.stringify({ entries: merged }))
  window.dispatchEvent(new CustomEvent('invaders-scores-changed'))
}
