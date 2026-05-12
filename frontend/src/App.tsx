import { BusyCurtain } from './app/BusyCurtain'
import { MainStage } from './app/MainStage'
import { WorldsDrawer } from './features/archive/WorldsDrawer'
import { GameHeader } from './features/layout/GameHeader'
import { LifeSimulatorDock } from './features/life/LifeSimulatorDock'
import './App.css'

export default function App() {
  return (
    <div className="game">
      <GameHeader />
      <WorldsDrawer />
      <main className="stage">
        <MainStage />
      </main>
      <LifeSimulatorDock />
      <BusyCurtain />
    </div>
  )
}
