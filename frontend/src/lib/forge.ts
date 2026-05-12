export function emptyGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false))
}

export const FORGE_PRESETS = {
  block: (): boolean[][] => [
    [true, true],
    [true, true],
  ],
  blinker: (): boolean[][] => [
    [false, false, false],
    [true, true, true],
    [false, false, false],
  ],
  glider: (): boolean[][] => [
    [false, true, false, false, false],
    [false, false, true, false, false],
    [true, true, true, false, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ],
} as const

export type ForgePresetKey = keyof typeof FORGE_PRESETS
