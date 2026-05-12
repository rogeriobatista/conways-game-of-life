import type { BoardState } from '../../api/types'

export type LifeSimulatorDockProps = {
  board: BoardState | null
  busy: boolean
  advanceSteps: number
  finalAttempts: number
  onAdvanceStepsChange: (n: number) => void
  onFinalAttemptsChange: (n: number) => void
  onStep: () => void
  onSprint: () => void
  onStillness: () => void
  onClearBoard: () => void
  onDestroyBoard: () => void
  onAnchorDraft: () => void
}

export function LifeSimulatorDock({
  board,
  busy,
  advanceSteps,
  finalAttempts,
  onAdvanceStepsChange,
  onFinalAttemptsChange,
  onStep,
  onSprint,
  onStillness,
  onClearBoard,
  onDestroyBoard,
  onAnchorDraft,
}: LifeSimulatorDockProps) {
  return (
    <footer className="dock">
      {board ? (
        <>
          <div className="dock__group">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={onStep}>
              Step
            </button>
            <div className="dock__sep" />
            <label>
              Burst
              <input type="number" min={1} max={10000} value={advanceSteps} onChange={(e) => onAdvanceStepsChange(Number(e.target.value))} />
            </label>
            <button type="button" className="btn" disabled={busy} onClick={onSprint}>
              Sprint
            </button>
            <div className="dock__sep" />
            <label>
              Patience
              <input type="number" min={1} max={100000} value={finalAttempts} onChange={(e) => onFinalAttemptsChange(Number(e.target.value))} />
            </label>
            <button type="button" className="btn" disabled={busy} onClick={onStillness}>
              Seek stillness
            </button>
          </div>
          <div className="dock__sep" />
          <div className="dock__group">
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={onClearBoard}>
              Erase canvas
            </button>
            <button type="button" className="btn btn--danger" disabled={busy} onClick={onDestroyBoard}>
              Destroy realm
            </button>
          </div>
        </>
      ) : (
        <div className="dock__group">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void onAnchorDraft()}>
            Anchor world
          </button>
        </div>
      )}
    </footer>
  )
}
