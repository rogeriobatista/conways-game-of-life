import { createContext, useContext, type ReactNode } from 'react'
import { useAppShell, type AppShellValue } from '../hooks/useAppShell'

const AppShellContext = createContext<AppShellValue | null>(null)

export function AppShellProvider({ children }: { children: ReactNode }) {
  const shell = useAppShell()
  return <AppShellContext.Provider value={shell}>{children}</AppShellContext.Provider>
}

export function useAppShellContext(): AppShellValue {
  const ctx = useContext(AppShellContext)
  if (ctx == null) {
    throw new Error('useAppShellContext must be used within AppShellProvider')
  }
  return ctx
}
