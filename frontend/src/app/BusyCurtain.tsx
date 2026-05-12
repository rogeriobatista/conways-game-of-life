import { useAppShellContext } from './AppShellContext'

export function BusyCurtain() {
  const { busy } = useAppShellContext()
  if (!busy) return null
  return (
    <div className="busy-curtain" aria-busy="true">
      <div className="busy-curtain__inner">Channeling…</div>
    </div>
  )
}
