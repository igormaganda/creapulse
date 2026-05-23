'use client'

// ============================================
// CreaPulse V2 — React Error Boundary
// Catches runtime errors and displays fallback UI
// ============================================

import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-coral-500 mb-4" />
          <h3 className="text-lg font-semibold">Une erreur est survenue</h3>
          <p className="text-muted-foreground mt-2">
            Veuillez rafraîchir la page ou réessayer.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
          >
            Réessayer
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
