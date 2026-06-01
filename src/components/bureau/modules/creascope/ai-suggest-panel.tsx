'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/zustand/store'
import { Sparkles, Target, MessageSquare, Loader2 } from 'lucide-react'
import type { AISuggestion } from './shared'

// ─── AI Suggestion Panel ─────────────────────────

export function AISuggestionPanel({ sessionId, step }: { sessionId: string; step: string }) {
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSuggestion = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/creascope/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().token}` },
        body: JSON.stringify({ sessionId, step }),
      })
      const data = await res.json()
      if (data.success && data.data?.suggestions) {
        setSuggestion(data.data.suggestions)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [sessionId, step])

  useEffect(() => {
    if (sessionId && step) fetchSuggestion()
  }, [sessionId, step, fetchSuggestion])

  return (
    <Card className="bg-white/5 border-white/10 rounded-2xl h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-400" />
            Suggestion IA
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchSuggestion} disabled={loading} className="text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Rafraîchir'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && !suggestion ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        ) : suggestion ? (
          <>
            <div>
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1.5">Focus</p>
              <ul className="space-y-1">
                {suggestion.focus.map((f, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                    <Target className="h-3 w-3 mt-0.5 text-teal-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Separator className="bg-white/10" />
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">Questions</p>
              <ul className="space-y-1">
                {suggestion.questions.map((q, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                    <MessageSquare className="h-3 w-3 mt-0.5 text-amber-400 shrink-0" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
            <Separator className="bg-white/10" />
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1.5">Observations</p>
              <p className="text-xs text-white/60 leading-relaxed">{suggestion.observations}</p>
            </div>
            <Separator className="bg-white/10" />
            <div>
              <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1.5">Approche</p>
              <p className="text-xs text-white/60 leading-relaxed">{suggestion.approach}</p>
            </div>
          </>
        ) : (
          <p className="text-xs text-white/40 text-center py-4">Aucune suggestion disponible</p>
        )}
      </CardContent>
    </Card>
  )
}
