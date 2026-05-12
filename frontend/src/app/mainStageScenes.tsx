import type { ReactElement } from 'react'
import { FallingBlocksPlayground } from '../components/FallingBlocksPlayground'
import { InvadersPlayground } from '../components/InvadersPlayground'
import { InvadersSetupBuilder } from '../components/InvadersSetupBuilder'
import { MeteorBlockBuilder } from '../components/MeteorBlockBuilder'
import { GamesHub } from '../features/arcade/GamesHub'
import { InvadersArcadeMenu } from '../features/arcade/InvadersArcadeMenu'
import { MeteorArcadeMenu } from '../features/arcade/MeteorArcadeMenu'
import { ForgeWorkspace } from '../features/life/ForgeWorkspace'
import { LifeBoardStage } from '../features/life/LifeBoardStage'
import type { AppShellValue } from '../hooks/useAppShell'

export type MainStageScene =
  | 'life-board'
  | 'forge'
  | 'games-hub'
  | 'meteor-menu'
  | 'meteor-play'
  | 'meteor-builder'
  | 'invaders-menu'
  | 'invaders-play'
  | 'invaders-builder'

type SceneShell = Pick<AppShellValue, 'board' | 'createMode' | 'arcadeRoute'>

function assertNeverRoute(route: never): never {
  throw new Error(`Unknown arcade route: ${JSON.stringify(route)}`)
}

export function resolveMainStageScene({ board, createMode, arcadeRoute }: SceneShell): MainStageScene {
  if (board) return 'life-board'
  if (createMode) return 'forge'

  if (arcadeRoute.kind === 'hub') return 'games-hub'
  if (arcadeRoute.kind === 'meteor') {
    if (arcadeRoute.screen === 'menu') return 'meteor-menu'
    if (arcadeRoute.screen === 'play') return 'meteor-play'
    return 'meteor-builder'
  }
  if (arcadeRoute.kind === 'invaders') {
    if (arcadeRoute.screen === 'menu') return 'invaders-menu'
    if (arcadeRoute.screen === 'play') return 'invaders-play'
    return 'invaders-builder'
  }
  return assertNeverRoute(arcadeRoute)
}

type SceneRenderer = (ctx: AppShellValue) => ReactElement

export const MAIN_STAGE_SCENES: Record<MainStageScene, SceneRenderer> = {
  'life-board': () => <LifeBoardStage />,

  'forge': () => <ForgeWorkspace />,

  'games-hub': () => <GamesHub />,

  'meteor-menu': () => <MeteorArcadeMenu />,

  'meteor-play': (ctx) => (
    <div className="stage__arena">
      <FallingBlocksPlayground
        key={ctx.meteorCustomKey}
        busy={ctx.busy}
        customShapes={ctx.meteorCustomBlocks}
        onUploadToApi={ctx.uploadPlaygroundToApi}
        onExitToMain={() => ctx.setArcadeRoute({ kind: 'meteor', screen: 'menu' })}
      />
    </div>
  ),

  'meteor-builder': (ctx) => (
    <div className="stage__arena">
      <MeteorBlockBuilder
        onBack={() => ctx.setArcadeRoute({ kind: 'meteor', screen: 'menu' })}
        onSaved={() => ctx.setMeteorCustomKey((k) => k + 1)}
      />
    </div>
  ),

  'invaders-menu': () => <InvadersArcadeMenu />,

  'invaders-play': (ctx) => (
    <div className="stage__arena">
      <InvadersPlayground
        key={ctx.invadersSetupKey}
        busy={ctx.busy}
        invadersSetup={ctx.invadersSetup}
        onExitToMain={() => ctx.setArcadeRoute({ kind: 'invaders', screen: 'menu' })}
      />
    </div>
  ),

  'invaders-builder': (ctx) => (
    <div className="stage__arena">
      <InvadersSetupBuilder
        onBack={() => ctx.setArcadeRoute({ kind: 'invaders', screen: 'menu' })}
        onSaved={() => ctx.setInvadersSetupKey((k) => k + 1)}
      />
    </div>
  ),
}
