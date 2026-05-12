import { useAppShellContext } from '../../app/AppShellContext'

export function LifeSimulatorDock() {
  const {
    arcadePlayOpen,
    board,
    busy,
    advanceSteps,
    finalAttempts,
    setAdvanceSteps,
    setFinalAttempts,
    handleStep,
    handleSprint,
    handleStillness,
    clearBoard,
    deleteBoardHandler,
    anchorDraft,
    createMode,
  } = useAppShellContext()

  if (arcadePlayOpen || (!board && !createMode)) return null

  return (
    <footer className="dock">
      {board ? (
        <>
          <div className="dock__group">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={handleStep}>
              Step
            </button>
            <div className="dock__sep" />
            <label>
              Burst
              <input type="number" min={1} max={10000} value={advanceSteps} onChange={(e) => setAdvanceSteps(Number(e.target.value))} />
            </label>
            <button type="button" className="btn" disabled={busy} onClick={handleSprint}>
              Sprint
            </button>
            <div className="dock__sep" />
            <label>
              Patience
              <input type="number" min={1} max={100000} value={finalAttempts} onChange={(e) => setFinalAttempts(Number(e.target.value))} />
            </label>
            <button type="button" className="btn" disabled={busy} onClick={handleStillness}>
              Seek stillness
            </button>
          </div>
          <div className="dock__sep" />
          <div className="dock__group">
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={clearBoard}>
              Erase canvas
            </button>
            <button type="button" className="btn btn--danger" disabled={busy} onClick={deleteBoardHandler}>
              Destroy realm
            </button>
          </div>
        </>
      ) : (
        <div className="dock__group">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void anchorDraft()}>
            Anchor world
          </button>
        </div>
      )}
    </footer>
  )
}
