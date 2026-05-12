/**
 * Application logger (loglevel).
 *
 * Level hierarchy: TRACE < DEBUG < INFO < WARN < ERROR < SILENT
 *
 * - In development (`import.meta.env.DEV`) all levels down to DEBUG are active
 *   and messages include a timestamp prefix for easy scanning in DevTools.
 * - In production builds the level is set to WARN so only warnings and errors
 *   appear in the browser console.
 *
 * Usage:
 *   import { log } from '@/lib/logger'
 *   log.info('Board created', { id, rows, columns })
 *   log.warn('Query retry', { attempt })
 *   log.error('Unexpected mutation failure', error)
 */

import loglevel from 'loglevel'

const isDev = import.meta.env.DEV

// ── original method factory so we can wrap with a timestamp prefix ──────────
const originalFactory = loglevel.methodFactory

loglevel.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName)
  return (...messages: unknown[]) => {
    const ts = new Date().toISOString().slice(11, 23) // HH:mm:ss.mmm
    rawMethod(`[${ts}] [${String(loggerName ?? 'app')}]`, ...messages)
  }
}

loglevel.setDefaultLevel(isDev ? loglevel.levels.DEBUG : loglevel.levels.WARN)
// Rebuild methods with the custom factory applied.
loglevel.setLevel(loglevel.getLevel())

export const log = loglevel

/**
 * Creates a named child logger that includes a bracketed prefix.
 * Useful for isolating logs per feature (e.g. 'boards', 'arcade').
 */
export function createLogger(name: string): loglevel.Logger {
  const child = loglevel.getLogger(name)
  child.setDefaultLevel(isDev ? loglevel.levels.DEBUG : loglevel.levels.WARN)
  child.setLevel(child.getLevel())
  return child
}
