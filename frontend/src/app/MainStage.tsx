import { FallingBlocksPlayground } from '../components/FallingBlocksPlayground'
import { InvadersPlayground } from '../components/InvadersPlayground'
import { InvadersSetupBuilder } from '../components/InvadersSetupBuilder'
import { MeteorBlockBuilder } from '../components/MeteorBlockBuilder'
import { GamesHub } from '../features/arcade/GamesHub'
import { InvadersArcadeMenu } from '../features/arcade/InvadersArcadeMenu'
import { MeteorArcadeMenu } from '../features/arcade/MeteorArcadeMenu'
import { ForgeWorkspace } from '../features/life/ForgeWorkspace'
import { LifeBoardStage } from '../features/life/LifeBoardStage'
import type { AppShellSnapshot } from '../hooks/useAppShell'

export function MainStage({ shell }: { shell: AppShellSnapshot }) {
  const {
    board,
    createMode,
    displayCells,
    draftRows,
    draftCols,
    setDraftRows,
    setDraftCols,
    applyDraftSize,
    setCreateMode,
    anchorDraft,
    toggleDraft,
    busy,
    arcadeRoute,
    setArcadeRoute,
    meteorCustomKey,
    meteorCustomBlocks,
    invadersSetupKey,
    invadersSetup,
    uploadPlaygroundToApi,
    setMeteorCustomKey,
    setInvadersSetupKey,
    setDrawerOpen,
    openForge,
  } = shell

  if (board) {
    return <LifeBoardStage displayCells={displayCells} />
  }

  if (createMode) {
    return (
      <ForgeWorkspace
        busy={busy}
        draftRows={draftRows}
        draftCols={draftCols}
        displayCells={displayCells}
        onDraftRowsChange={setDraftRows}
        onDraftColsChange={setDraftCols}
        onApplyDraftSize={applyDraftSize}
        onCancel={() => setCreateMode(false)}
        onAnchor={anchorDraft}
        onToggleCell={toggleDraft}
      />
    )
  }

  if (arcadeRoute.kind === 'meteor' && arcadeRoute.screen === 'play') {
    return (
      <div className="stage__arena">
        <FallingBlocksPlayground
          key={meteorCustomKey}
          busy={busy}
          customShapes={meteorCustomBlocks}
          onUploadToApi={uploadPlaygroundToApi}
          onExitToMain={() => setArcadeRoute({ kind: 'meteor', screen: 'menu' })}
        />
      </div>
    )
  }

  if (arcadeRoute.kind === 'meteor' && arcadeRoute.screen === 'builder') {
    return (
      <div className="stage__arena">
        <MeteorBlockBuilder
          onBack={() => setArcadeRoute({ kind: 'meteor', screen: 'menu' })}
          onSaved={() => setMeteorCustomKey((k) => k + 1)}
        />
      </div>
    )
  }

  if (arcadeRoute.kind === 'meteor' && arcadeRoute.screen === 'menu') {
    return (
      <MeteorArcadeMenu
        busy={busy}
        onBackToHub={() => setArcadeRoute({ kind: 'hub' })}
        onStartPlay={() => setArcadeRoute({ kind: 'meteor', screen: 'play' })}
        onOpenBuilder={() => setArcadeRoute({ kind: 'meteor', screen: 'builder' })}
      />
    )
  }

  if (arcadeRoute.kind === 'invaders' && arcadeRoute.screen === 'play') {
    return (
      <div className="stage__arena">
        <InvadersPlayground
          key={invadersSetupKey}
          busy={busy}
          invadersSetup={invadersSetup}
          onExitToMain={() => setArcadeRoute({ kind: 'invaders', screen: 'menu' })}
        />
      </div>
    )
  }

  if (arcadeRoute.kind === 'invaders' && arcadeRoute.screen === 'builder') {
    return (
      <div className="stage__arena">
        <InvadersSetupBuilder
          onBack={() => setArcadeRoute({ kind: 'invaders', screen: 'menu' })}
          onSaved={() => setInvadersSetupKey((k) => k + 1)}
        />
      </div>
    )
  }

  if (arcadeRoute.kind === 'invaders' && arcadeRoute.screen === 'menu') {
    return (
      <InvadersArcadeMenu
        busy={busy}
        onBackToHub={() => setArcadeRoute({ kind: 'hub' })}
        onStartPlay={() => setArcadeRoute({ kind: 'invaders', screen: 'play' })}
        onOpenBuilder={() => setArcadeRoute({ kind: 'invaders', screen: 'builder' })}
      />
    )
  }

  return (
    <GamesHub
      busy={busy}
      onChooseMeteor={() => setArcadeRoute({ kind: 'meteor', screen: 'menu' })}
      onChooseInvaders={() => setArcadeRoute({ kind: 'invaders', screen: 'menu' })}
      onOpenDrawer={() => setDrawerOpen(true)}
      onOpenForge={openForge}
    />
  )
}
