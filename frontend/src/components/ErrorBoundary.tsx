import { Component, type ErrorInfo, type ReactNode } from 'react'
import { log } from '../lib/logger'

type Props = {
  children: ReactNode
  /** Optional custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

type State = {
  error: Error | null
}

/**
 * Catches React render/lifecycle errors anywhere in the component tree below it.
 * Logs the error + component stack at the ERROR level and renders a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { children, fallback } = this.props

    if (error) {
      if (fallback) return fallback(error, this.reset)

      return (
        <div className="error-boundary" role="alert">
          <h2>Something went wrong</h2>
          <p className="error-boundary__message">{error.message}</p>
          <button type="button" className="btn btn--primary" onClick={this.reset}>
            Try again
          </button>
        </div>
      )
    }

    return children
  }
}
