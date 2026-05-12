import { BoardGrid } from '../../components/BoardGrid'
import { useAppShellContext } from '../../app/AppShellContext'

export function LifeBoardStage() {
  const { displayCells } = useAppShellContext()
  return (
    <div className="stage__arena">
      <div className="grid-shell">
        <BoardGrid cells={displayCells} cellSize={18} />
      </div>
    </div>
  )
}
