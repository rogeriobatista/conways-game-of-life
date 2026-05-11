export type BoardSummary = {
  id: string
  rows: number
  columns: number
  updatedAtUtc: string
}

export type BoardState = {
  id: string
  rows: number
  columns: number
  cells: boolean[][]
}

export type BoardCreated = { id: string }

export type ApiErrorBody = { code: string; message: string }
