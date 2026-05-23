'use client'

// ============================================
// CreaPulse V2 — Client Providers Wrapper
// Wraps the app with QueryClient and ThemeProvider
// ============================================

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

// ─── QueryClient Configuration ──────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 1 minute
        staleTime: 60 * 1000,
        // Cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests once
        retry: 1,
        // Don't refetch on window focus (reduces unnecessary requests)
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Don't retry mutations by default
        retry: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: reuse existing client if available
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

// ─── Provider Component ─────────────────────

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
