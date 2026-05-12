import { useAppShellContext } from './AppShellContext'
import { MAIN_STAGE_SCENES, resolveMainStageScene } from './mainStageScenes'

export function MainStage() {
  const shell = useAppShellContext()
  const scene = resolveMainStageScene(shell)
  return MAIN_STAGE_SCENES[scene](shell)
}
