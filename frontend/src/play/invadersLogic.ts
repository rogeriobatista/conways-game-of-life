/** Space-invaders style: boolean grid of aliens + multi-cell ship + bullets moving up. */
import { trimShape } from './fallingLogic'

export const INVADERS_ROWS = 14
export const INVADERS_COLS = 11
export const SHIP_ROW = INVADERS_ROWS - 1

export type InvadersStatus = 'playing' | 'won' | 'lost'

export type Bullet = { r: number; c: number }

export type ShipOffset = { dr: number; dc: number }

export type InvadersConfig = {
  /** When set and non-empty, replaces the default formation (clamped to grid size). */
  aliens?: boolean[][]
  /** Small bitmap; last row is the deck at `SHIP_ROW`. Trimmed; at least one live cell on the deck row. */
  shipMask?: boolean[][]
}

export type InvadersState = {
  aliens: boolean[][]
  /** Left column of the ship bounding box in world coordinates. */
  shipCol: number
  shipOffsets: ShipOffset[]
  bullets: Bullet[]
  /** Horizontal step for the alien formation (+1 right, -1 left). */
  alienDir: 1 | -1
  /** Counts down; when hits 0, formation moves. */
  alienMoveTimer: number
  score: number
  status: InvadersStatus
}

const ALIEN_MOVE_INTERVAL = 16
const MAX_BULLETS = 2
const POINTS_PER_ALIEN = 100

export function emptyAlienGrid(): boolean[][] {
  return Array.from({ length: INVADERS_ROWS }, () => Array(INVADERS_COLS).fill(false))
}

/** Initial staggered formation in the top rows. */
export function initialAliens(): boolean[][] {
  const g = emptyAlienGrid()
  for (let r = 0; r <= 2; r++) {
    for (let c = 1; c < INVADERS_COLS - 1; c += 2) {
      g[r][c] = true
    }
  }
  return g
}

export function alienGridHasLive(custom: boolean[][] | undefined): boolean {
  if (!custom?.length) return false
  for (let r = 0; r < Math.min(custom.length, INVADERS_ROWS); r++) {
    const row = custom[r]
    if (!row) continue
    for (let c = 0; c < Math.min(row.length, INVADERS_COLS); c++) {
      if (row[c]) return true
    }
  }
  return false
}

/** Copy custom mask into the arena, or use the classic staggered wave. */
export function buildAlienFormation(custom: boolean[][] | undefined): boolean[][] {
  if (!alienGridHasLive(custom)) return initialAliens()
  const g = emptyAlienGrid()
  for (let r = 0; r < INVADERS_ROWS; r++) {
    for (let c = 0; c < INVADERS_COLS; c++) {
      g[r][c] = Boolean(custom![r]?.[c])
    }
  }
  return g
}

function defaultShipOffsets(): ShipOffset[] {
  return [{ dr: 0, dc: 0 }]
}

/**
 * Bottom row of the trimmed mask (last index) must contain at least one live cell (the deck).
 * `dc` is relative to the left edge of the bounding box.
 */
export function shipOffsetsFromMask(mask: boolean[][] | undefined): ShipOffset[] | null {
  if (!mask?.length) return null
  const t = trimShape(mask)
  if (!t?.length) return null
  const h = t.length
  const bottom = t[h - 1]
  if (!bottom?.some(Boolean)) return null

  let minC = INVADERS_COLS
  let maxC = -1
  for (const row of t) {
    for (let c = 0; c < row.length; c++) {
      if (!row[c]) continue
      minC = Math.min(minC, c)
      maxC = Math.max(maxC, c)
    }
  }
  if (maxC < 0) return null

  const offsets: ShipOffset[] = []
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < t[r].length; c++) {
      if (!t[r][c]) continue
      offsets.push({ dr: r - (h - 1), dc: c - minC })
    }
  }
  return offsets
}

export function shipBboxWidth(offsets: ShipOffset[]): number {
  if (offsets.length === 0) return 1
  let maxDc = 0
  for (const o of offsets) maxDc = Math.max(maxDc, o.dc)
  return maxDc + 1
}

function initialShipCol(offsets: ShipOffset[]): number {
  const w = shipBboxWidth(offsets)
  return Math.max(0, Math.floor((INVADERS_COLS - w) / 2))
}

export function shipWorldCells(shipCol: number, offsets: ShipOffset[]): { r: number; c: number }[] {
  return offsets.map(({ dr, dc }) => ({ r: SHIP_ROW + dr, c: shipCol + dc }))
}

function shipInBounds(shipCol: number, offsets: ShipOffset[]): boolean {
  for (const { r, c } of shipWorldCells(shipCol, offsets)) {
    if (c < 0 || c >= INVADERS_COLS || r < 0 || r >= INVADERS_ROWS) return false
  }
  return true
}

/** Topmost grid row occupied by the ship (smallest row index). */
export function minShipWorldRow(offsets: ShipOffset[]): number {
  if (offsets.length === 0) return SHIP_ROW
  return Math.min(...offsets.map((o) => SHIP_ROW + o.dr))
}

function aliensOverlapShip(aliens: boolean[][], shipCol: number, offsets: ShipOffset[]): boolean {
  for (const { r, c } of shipWorldCells(shipCol, offsets)) {
    if (r >= 0 && r < INVADERS_ROWS && c >= 0 && c < INVADERS_COLS && aliens[r][c]) return true
  }
  return false
}

export function initialInvadersState(config?: InvadersConfig | null): InvadersState {
  const aliens = buildAlienFormation(config?.aliens)
  const fromMask = shipOffsetsFromMask(config?.shipMask)
  const shipOffsets = fromMask ?? defaultShipOffsets()
  const shipCol = initialShipCol(shipOffsets)
  return {
    aliens,
    shipCol: shipInBounds(shipCol, shipOffsets) ? shipCol : Math.max(0, Math.min(INVADERS_COLS - shipBboxWidth(shipOffsets), shipCol)),
    shipOffsets,
    bullets: [],
    alienDir: 1,
    alienMoveTimer: ALIEN_MOVE_INTERVAL,
    score: 0,
    status: 'playing',
  }
}

export function alienBounds(aliens: boolean[][]): { minR: number; maxR: number; minC: number; maxC: number } | null {
  let minR = INVADERS_ROWS
  let maxR = -1
  let minC = INVADERS_COLS
  let maxC = -1
  for (let r = 0; r < INVADERS_ROWS; r++) {
    for (let c = 0; c < INVADERS_COLS; c++) {
      if (!aliens[r][c]) continue
      minR = Math.min(minR, r)
      maxR = Math.max(maxR, r)
      minC = Math.min(minC, c)
      maxC = Math.max(maxC, c)
    }
  }
  if (maxR < 0) return null
  return { minR, maxR, minC, maxC }
}

export function countAliens(aliens: boolean[][]): number {
  let n = 0
  for (const row of aliens) {
    for (const cell of row) {
      if (cell) n++
    }
  }
  return n
}

function shiftAliensHoriz(aliens: boolean[][], dir: 1 | -1): boolean[][] {
  const next = emptyAlienGrid()
  for (let r = 0; r < INVADERS_ROWS; r++) {
    for (let c = 0; c < INVADERS_COLS; c++) {
      if (!aliens[r][c]) continue
      const nc = c + dir
      if (nc >= 0 && nc < INVADERS_COLS) next[r][nc] = true
    }
  }
  return next
}

function shiftAliensDown(aliens: boolean[][]): boolean[][] {
  const next = emptyAlienGrid()
  for (let r = 0; r < INVADERS_ROWS; r++) {
    for (let c = 0; c < INVADERS_COLS; c++) {
      if (!aliens[r][c]) continue
      if (r + 1 < INVADERS_ROWS) next[r + 1][c] = true
    }
  }
  return next
}

/** One simulation step: bullets fly, optional alien march, collisions, win/lose. */
export function tickInvaders(prev: InvadersState): InvadersState {
  if (prev.status !== 'playing') return prev

  let { aliens, shipCol, shipOffsets, bullets, alienDir, alienMoveTimer, score } = prev

  // Bullets up
  bullets = bullets
    .map((b) => ({ r: b.r - 1, c: b.c }))
    .filter((b) => b.r >= 0)

  // Collisions: each bullet vs alien cell
  const alienGrid = aliens.map((row) => [...row])
  let killed = 0
  const keptBullets: Bullet[] = []
  for (const b of bullets) {
    if (b.r >= 0 && b.r < INVADERS_ROWS && b.c >= 0 && b.c < INVADERS_COLS && alienGrid[b.r][b.c]) {
      alienGrid[b.r][b.c] = false
      killed++
    } else {
      keptBullets.push(b)
    }
  }
  bullets = keptBullets
  score += killed * POINTS_PER_ALIEN
  aliens = alienGrid

  if (countAliens(aliens) === 0) {
    return { ...prev, aliens, bullets, score, status: 'won' }
  }

  if (aliensOverlapShip(aliens, shipCol, shipOffsets)) {
    return { ...prev, aliens, bullets, score, status: 'lost' }
  }

  const topDeck = minShipWorldRow(shipOffsets)
  const b0 = alienBounds(aliens)
  if (b0 && b0.maxR >= topDeck) {
    return { ...prev, aliens, bullets, score, status: 'lost' }
  }

  // Alien march
  let nextTimer = alienMoveTimer - 1
  if (nextTimer <= 0) {
    nextTimer = ALIEN_MOVE_INTERVAL
    const b = alienBounds(aliens)
    if (!b) {
      return { ...prev, aliens, bullets, score, status: 'won' }
    }
    const nextLeft = b.minC + alienDir
    const nextRight = b.maxC + alienDir
    const hitWall = nextLeft < 0 || nextRight >= INVADERS_COLS
    if (hitWall) {
      aliens = shiftAliensDown(aliens)
      alienDir = (alienDir === 1 ? -1 : 1) as 1 | -1
    } else {
      aliens = shiftAliensHoriz(aliens, alienDir)
    }
  } else {
    return { aliens, shipCol, shipOffsets, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'playing' }
  }

  const b2 = alienBounds(aliens)
  if (!b2 || countAliens(aliens) === 0) {
    return { aliens, shipCol, shipOffsets, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'won' }
  }

  const topDeck2 = minShipWorldRow(shipOffsets)
  if (aliensOverlapShip(aliens, shipCol, shipOffsets) || b2.maxR >= topDeck2) {
    return { aliens, shipCol, shipOffsets, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'lost' }
  }

  return { aliens, shipCol, shipOffsets, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'playing' }
}

export function moveShip(prev: InvadersState, dir: -1 | 1): InvadersState {
  if (prev.status !== 'playing') return prev
  const nc = prev.shipCol + dir
  if (!shipInBounds(nc, prev.shipOffsets)) return prev
  return { ...prev, shipCol: nc }
}

export function tryFire(prev: InvadersState): InvadersState {
  if (prev.status !== 'playing') return prev
  if (prev.bullets.length >= MAX_BULLETS) return prev
  const { shipCol, shipOffsets } = prev
  const topDr = Math.min(...shipOffsets.map((o) => o.dr))
  const tops = shipOffsets.filter((o) => o.dr === topDr)
  const pick = tops[Math.floor((tops.length - 1) / 2)]!
  const spawnR = SHIP_ROW + topDr - 1
  const spawnC = shipCol + pick.dc
  const bullets = [...prev.bullets, { r: spawnR, c: spawnC }]
  return { ...prev, bullets }
}
