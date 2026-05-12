import type { CreateMeteorScoreCommand } from './types'
import { apiFetch } from './client'
import type { MeteorScore } from './types'

export function listMeteorScores(top = 25): Promise<MeteorScore[]> {
  return apiFetch<MeteorScore[]>(`/api/game/meteor-scores?top=${encodeURIComponent(String(top))}`)
}

export function createMeteorScore(body: CreateMeteorScoreCommand): Promise<MeteorScore> {
  return apiFetch<MeteorScore>('/api/game/meteor-scores', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
