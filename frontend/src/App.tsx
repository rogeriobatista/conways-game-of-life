import { MainStage } from './app/MainStage'
import { WorldsDrawer } from './features/archive/WorldsDrawer'
import { GameHeader } from './features/layout/GameHeader'
import { LifeSimulatorDock } from './features/life/LifeSimulatorDock'
import { useAppShell } from './hooks/useAppShell'
import './App.css'

export default function App() {
  const shell = useAppShell()

  return (
    <div className="game">
      <GameHeader
        arcadeRoute={shell.arcadeRoute}
        board={shell.board}
        createMode={shell.createMode}
        lifeTicks={shell.lifeTicks}
        drawerOpen={shell.drawerOpen}
        onToggleDrawer={() => shell.setDrawerOpen((o) => !o)}
        onArcadeHome={() => shell.setArcadeRoute({ kind: 'hub' })}
      />

      {shell.drawerOpen ? (
        <WorldsDrawer
          summaries={shell.summaries}
          selectedId={shell.selectedId}
          busy={shell.busy}
          arcadeRoute={shell.arcadeRoute}
          onClose={() => shell.setDrawerOpen(false)}
          onRefreshSummaries={shell.refetchSummaries}
          onLoadBoard={shell.loadBoard}
          onApplyPreset={shell.setPreset}
          onOpenForge={shell.openForge}
          onOpenMeteorMenu={() => {
            shell.setArcadeRoute({ kind: 'meteor', screen: 'menu' })
            shell.setDrawerOpen(false)
          }}
          onOpenInvadersMenu={() => {
            shell.setArcadeRoute({ kind: 'invaders', screen: 'menu' })
            shell.setDrawerOpen(false)
          }}
        />
      ) : null}

      <main className="stage">
        <MainStage shell={shell} />
      </main>

      {!shell.arcadePlayOpen && (shell.board || shell.createMode) ? (
        <LifeSimulatorDock
          board={shell.board}
          busy={shell.busy}
          advanceSteps={shell.advanceSteps}
          finalAttempts={shell.finalAttempts}
          onAdvanceStepsChange={shell.setAdvanceSteps}
          onFinalAttemptsChange={shell.setFinalAttempts}
          onStep={shell.handleStep}
          onSprint={shell.handleSprint}
          onStillness={shell.handleStillness}
          onClearBoard={shell.clearBoard}
          onDestroyBoard={shell.deleteBoardHandler}
          onAnchorDraft={shell.anchorDraft}
        />
      ) : null}

      {shell.busy ? (
        <div className="busy-curtain" aria-busy="true">
          <div className="busy-curtain__inner">Channeling…</div>
        </div>
      ) : null}
    </div>
  )
}
