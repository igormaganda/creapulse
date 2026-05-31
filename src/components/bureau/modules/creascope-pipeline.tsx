'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/zustand/store'
import { SessionList } from './creascope/session-list'
import { SessionOrchestrator } from './creascope/session-orchestrator'
import type { Session } from './creascope/shared'

// ─── Main Component ──────────────────────────────

export function CreascopePipeline() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((s) => s.token)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creascope/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSessions(data.data || [])
        // Auto-refresh selected session
        if (selectedSession) {
          const updated = (data.data || []).find((s: Session) => s.id === selectedSession.id)
          if (updated) setSelectedSession(updated)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [token, selectedSession])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

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
