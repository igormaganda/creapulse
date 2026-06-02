'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/zustand/store'
import { authFetch } from '@/lib/auth-fetch'
import { SessionList } from './creascope/session-list'
import { SessionOrchestrator } from './creascope/session-orchestrator'
import type { Session } from './creascope/shared'

// ─── Main Component ──────────────────────────────

export function CreascopePipeline() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const userRole = useAuthStore((s) => s.user?.role)
  // Use a ref to avoid infinite loop from selectedSession dependency
  const selectedSessionRef = useRef<Session | null>(null)

  const fetchSessions = useCallback(async () => {
    // Only fetch for COUNSELOR or ADMIN roles — BENEFICIARY users don't manage sessions
    if (userRole && userRole !== 'COUNSELOR' && userRole !== 'ADMIN') {
      setLoading(false)
      return
    }
    // Don't gate on Zustand token — the httpOnly session cookie handles auth.
    // The authFetch wrapper adds the Authorization header if token is available.
    setLoading(true)
    try {
      const res = await authFetch('/api/creascope/sessions')
      const data = await res.json()
      if (data.success) {
        setSessions(data.data || [])
        // Auto-refresh selected session using ref to avoid dependency loop
        if (selectedSessionRef.current) {
          const updated = (data.data || []).find((s: Session) => s.id === selectedSessionRef.current!.id)
          if (updated) setSelectedSession(updated)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userRole])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Keep ref in sync
  useEffect(() => {
    selectedSessionRef.current = selectedSession
  }, [selectedSession])

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session)
  }

  const handleBackToList = () => {
    setSelectedSession(null)
    fetchSessions()
  }

  // Session detail view
  if (selectedSession) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 md:p-6"
      >
        <SessionOrchestrator session={selectedSession} onBack={handleBackToList} onRefresh={fetchSessions} />
      </motion.div>
    )
  }

  // Session list view
  return (
    <SessionList
      sessions={sessions}
      onSelectSession={handleSelectSession}
      isLoading={loading}
    />
  )
}
