/** Space-invaders style: boolean grid of aliens + ship column + bullets moving up. */

export const INVADERS_ROWS = 14
export const INVADERS_COLS = 11
export const SHIP_ROW = INVADERS_ROWS - 1

export type InvadersStatus = 'playing' | 'won' | 'lost'

export type Bullet = { r: number; c: number }

export type InvadersState = {
  aliens: boolean[][]
  shipCol: number
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

export function initialInvadersState(): InvadersState {
  return {
    aliens: initialAliens(),
    shipCol: Math.floor(INVADERS_COLS / 2),
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

  let { aliens, shipCol, bullets, alienDir, alienMoveTimer, score } = prev

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
    return { aliens, shipCol, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'playing' }
  }

  const b2 = alienBounds(aliens)
  if (!b2 || countAliens(aliens) === 0) {
    return { aliens, shipCol, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'won' }
  }
  if (b2.maxR >= SHIP_ROW) {
    return { aliens, shipCol, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'lost' }
  }

  return { aliens, shipCol, bullets, alienDir, alienMoveTimer: nextTimer, score, status: 'playing' }
}

export function moveShip(prev: InvadersState, dir: -1 | 1): InvadersState {
  if (prev.status !== 'playing') return prev
  const nc = prev.shipCol + dir
  if (nc < 0 || nc >= INVADERS_COLS) return prev
  return { ...prev, shipCol: nc }
}

export function tryFire(prev: InvadersState): InvadersState {
  if (prev.status !== 'playing') return prev
  if (prev.bullets.length >= MAX_BULLETS) return prev
  const spawnR = SHIP_ROW - 1
  const spawnC = prev.shipCol
  const bullets = [...prev.bullets, { r: spawnR, c: spawnC }]
  return { ...prev, bullets }
}
