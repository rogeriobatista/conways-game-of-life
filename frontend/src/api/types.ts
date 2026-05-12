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

export type CreateMeteorScoreCommand = {
  score: number
  locks: number
  placedCellTotal: number
}

export type MeteorScore = {
  id: string
  score: number
  locks: number
  placedCellTotal: number
  createdAtUtc: string
}

export type ApiErrorBody = { code: string; message: string }
