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

const SHAPES: boolean[][][] = [
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

export function randomShape(): boolean[][] {
  const pick = SHAPES[Math.floor(Math.random() * SHAPES.length)]!
  return pick.map((row) => [...row])
}

/** Try spawn at top; nudge horizontally; reset field if impossible */
export function spawnPiece(
  landed: boolean[][],
  rows: number,
  cols: number,
): { landed: boolean[][]; piece: { cells: boolean[][]; row: number; col: number } } {
  const cells = randomShape()
  const w = shapeWidth(cells)
  const center = Math.max(0, Math.floor((cols - w) / 2))

  for (let attempt = 0; attempt < 40; attempt++) {
    const jitter = Math.floor(Math.random() * 7) - 3
    const col = Math.min(Math.max(0, cols - w), Math.max(0, center + jitter))
    const row = 0
    if (canPlace(landed, cells, row, col)) {
      return { landed, piece: { cells, row, col } }
    }
  }

  const cleared = emptyGrid(rows, cols)
  const col0 = Math.max(0, Math.floor((cols - w) / 2))
  if (canPlace(cleared, cells, 0, col0)) {
    return {
      landed: cleared,
      piece: { cells, row: 0, col: col0 },
    }
  }

  const tiny: boolean[][] = [[true]]
  return {
    landed: cleared,
    piece: { cells: tiny, row: 0, col: Math.floor(cols / 2) },
  }
}
