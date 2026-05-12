/** Rotate square matrix 90° clockwise */
export function rotateCw(matrix: boolean[][]): boolean[][] {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => matrix[rows - 1 - r][c]),
  )
}

export function emptyGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false))
}

export function shapeWidth(shape: boolean[][]): number {
  return shape[0]?.length ?? 0
}

/** True if every live cell of `shape` at (originRow, originCol) is in-bounds and not on a live `landed` cell */
export function canPlace(
  landed: boolean[][],
  shape: boolean[][],
  originRow: number,
  originCol: number,
): boolean {
  const rows = landed.length
  const cols = landed[0]?.length ?? 0
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const gr = originRow + r
      const gc = originCol + c
      if (gr < 0 || gr >= rows || gc < 0 || gc >= cols) return false
      if (landed[gr][gc]) return false
    }
  }
  return true
}

/** Lowest row index where `piece` can rest without overlapping landed cells. */
export function computeHardDropRow(
  landed: boolean[][],
  piece: { cells: boolean[][]; row: number; col: number },
): number {
  let row = piece.row
  while (canPlace(landed, piece.cells, row + 1, piece.col)) row += 1
  return row
}

export function mergePiece(
  landed: boolean[][],
  shape: boolean[][],
  originRow: number,
  originCol: number,
): boolean[][] {
  const next = landed.map((row) => [...row])
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) next[originRow + r][originCol + c] = true
    }
  }
  return next
}

/** Count live (true) cells in a shape matrix. */
export function countLiveCells(shape: boolean[][]): number {
  let n = 0
  for (const row of shape) {
    for (const cell of row) {
      if (cell) n++
    }
  }
  return n
}

/** How many fully-filled rows would be removed (before padding). */
export function countFullRows(landed: boolean[][]): number {
  return landed.filter((row) => row.every((cell) => cell)).length
}

/** Remove every fully-live horizontal row; pad empty rows at the top so height is unchanged (Tetris-style). */
export function clearFullRows(landed: boolean[][]): boolean[][] {
  const rows = landed.length
  const cols = landed[0]?.length ?? 0
  if (rows === 0 || cols === 0) return landed

  const incomplete = landed.filter((row) => !row.every((cell) => cell))
  const removed = rows - incomplete.length
  const pad = Array.from({ length: removed }, () => Array<boolean>(cols).fill(false))
  return [...pad, ...incomplete]
}

/** Built-in meteor pieces (also used when no custom blocks exist). */
export const DEFAULT_METEOR_SHAPES: boolean[][][] = [
  [
    [true, true],
    [true, true],
  ],
  [[true, true, true]],
  [
    [true, false],
    [true, false],
    [true, true],
  ],
  [
    [false, true, false],
    [false, false, true],
    [true, true, true],
  ],
  [
    [true, true, false],
    [false, true, true],
  ],
]

/** Tight bounding box around live cells (at least one live required). */
export function trimShape(shape: boolean[][]): boolean[][] | null {
  let minR = shape.length
  let maxR = -1
  let minC = shape[0]?.length ?? 0
  let maxC = -1
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < (shape[r]?.length ?? 0); c++) {
      if (!shape[r][c]) continue
      minR = Math.min(minR, r)
      maxR = Math.max(maxR, r)
      minC = Math.min(minC, c)
      maxC = Math.max(maxC, c)
    }
  }
  if (maxR < 0) return null
  return shape.slice(minR, maxR + 1).map((row) => row.slice(minC, maxC + 1))
}

/** Default shapes plus any non-empty trimmed custom blocks. */
export function buildMeteorShapePool(custom: boolean[][][] | undefined): boolean[][][] {
  const base = DEFAULT_METEOR_SHAPES.map((s) => s.map((row) => [...row]))
  if (!custom?.length) return base
  const extra: boolean[][][] = []
  for (const raw of custom) {
    const t = trimShape(raw)
    if (t && countLiveCells(t) > 0) extra.push(t.map((row) => [...row]))
  }
  return extra.length ? [...base, ...extra] : base
}

export function randomShapeFromPool(pool: boolean[][][]): boolean[][] {
  const pick = pool[Math.floor(Math.random() * pool.length)]!
  return pick.map((row) => [...row])
}

export function randomShape(): boolean[][] {
  return randomShapeFromPool(DEFAULT_METEOR_SHAPES)
}

export type SpawnedPiece = { cells: boolean[][]; row: number; col: number }

/**
 * Spawns a new random piece at the top if any column fits.
 * Returns `null` when the well is full (game over) — does not clear the board.
 */
export function trySpawnPiece(
  landed: boolean[][],
  _rows: number,
  cols: number,
): { landed: boolean[][]; piece: SpawnedPiece } | null {
  return trySpawnPieceFromPool(landed, _rows, cols, DEFAULT_METEOR_SHAPES)
}

export function trySpawnPieceFromPool(
  landed: boolean[][],
  _rows: number,
  cols: number,
  pool: boolean[][][],
): { landed: boolean[][]; piece: SpawnedPiece } | null {
  if (pool.length === 0) return null
  const cells = randomShapeFromPool(pool)
  const w = shapeWidth(cells)
  if (w > cols) return null

  const center = Math.max(0, Math.floor((cols - w) / 2))
  for (let attempt = 0; attempt < 48; attempt++) {
    const jitter = Math.floor(Math.random() * 9) - 4
    const col = Math.min(Math.max(0, cols - w), Math.max(0, center + jitter))
    if (canPlace(landed, cells, 0, col)) {
      return { landed, piece: { cells, row: 0, col } }
    }
  }

  for (let col = 0; col <= cols - w; col++) {
    if (canPlace(landed, cells, 0, col)) {
      return { landed, piece: { cells, row: 0, col } }
    }
  }

  return null
}
