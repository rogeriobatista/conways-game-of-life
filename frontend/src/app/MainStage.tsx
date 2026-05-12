import { FallingBlocksPlayground } from '../components/FallingBlocksPlayground'
import { InvadersPlayground } from '../components/InvadersPlayground'
import { InvadersSetupBuilder } from '../components/InvadersSetupBuilder'
import { MeteorBlockBuilder } from '../components/MeteorBlockBuilder'
import { GamesHub } from '../features/arcade/GamesHub'
import { InvadersArcadeMenu } from '../features/arcade/InvadersArcadeMenu'
import { MeteorArcadeMenu } from '../features/arcade/MeteorArcadeMenu'
import { ForgeWorkspace } from '../features/life/ForgeWorkspace'
import { LifeBoardStage } from '../features/life/LifeBoardStage'
import { useAppShellContext } from './AppShellContext'

export function MainStage() {
  const {
    board,
    createMode,
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
  } = useAppShellContext()

  if (board) {
    return <LifeBoardStage />
  }

  if (createMode) {
    return <ForgeWorkspace />
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
    return <MeteorArcadeMenu />
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
    return <InvadersArcadeMenu />
  }

  return <GamesHub />
}
