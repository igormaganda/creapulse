'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// ─── Types ──────────────────────────────────

export interface TradEmploiContextData {
  module: string
  section?: string
  projectData?: Record<string, unknown>
}

interface TradEmploiContextValue {
  voiceContext: TradEmploiContextData
  setContext: (ctx: Partial<TradEmploiContextData>) => void
  clearContext: () => void
}

const DEFAULT_CONTEXT: TradEmploiContextData = {
  module: '',
  section: undefined,
  projectData: undefined,
}

const TradEmploiContext = createContext<TradEmploiContextValue | null>(null)

// ─── Provider ───────────────────────────────

export function TradEmploiProvider({ children }: { children: ReactNode }) {
  const [voiceContext, setVoiceContextState] = useState<TradEmploiContextData>(DEFAULT_CONTEXT)

  const setContext = useCallback((ctx: Partial<TradEmploiContextData>) => {
    setVoiceContextState((prev) => ({
      ...prev,
      ...ctx,
      // If module changes, clear section unless explicitly provided
      ...(ctx.module && ctx.module !== prev.module && ctx.section === undefined
        ? { section: undefined, projectData: undefined }
        : {}),
    }))
  }, [])

  const clearContext = useCallback(() => {
    setVoiceContextState(DEFAULT_CONTEXT)
  }, [])

  return (
    <TradEmploiContext.Provider value={{ voiceContext, setContext, clearContext }}>
      {children}
    </TradEmploiContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────

export function useTradEmploi(): TradEmploiContextValue {
  const ctx = useContext(TradEmploiContext)
  if (!ctx) {
    throw new Error('useTradEmploi must be used within a <TradEmploiProvider>')
  }
  return ctx
}