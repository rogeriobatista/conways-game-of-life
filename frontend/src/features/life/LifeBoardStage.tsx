import { BoardGrid } from '../../components/BoardGrid'

export type LifeBoardStageProps = {
  displayCells: boolean[][]
}

export function LifeBoardStage({ displayCells }: LifeBoardStageProps) {
  return (
    <div className="stage__arena">
      <div className="grid-shell">
        <BoardGrid cells={displayCells} cellSize={18} />
      </div>
    </div>
  )
}
