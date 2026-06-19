'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Star,
  Send,
  Loader2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Frown,
  Smile,
  History,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ──────────────────────────────────

interface FeedbackEntry {
  id: string
  type: string
  rating: number
  nps: number | null
  comment: string
  createdAt: string
}

interface CategoryRating {
  key: string
  label: string
  rating: number
}

const SATISFACTION_CATEGORIES: CategoryRating[] = [
  { key: 'formation', label: 'Formation', rating: 0 },
  { key: 'accompagnement', label: 'Accompagnement', rating: 0 },
  { key: 'outils', label: 'Outils', rating: 0 },
  { key: 'plateau', label: 'Plateau', rating: 0 },
]

const NPS_FACES: { value: number; emoji: string; label: string; color: string }[] = [
  { value: 0, emoji: '😠', label: '0', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
  { value: 1, emoji: '😞', label: '1', color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
  { value: 2, emoji: '😟', label: '2', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' },
  { value: 3, emoji: '😕', label: '3', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' },
  { value: 4, emoji: '😐', label: '4', color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' },
  { value: 5, emoji: '😑', label: '5', color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' },
  { value: 6, emoji: '🤔', label: '6', color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' },
  { value: 7, emoji: '🙂', label: '7', color: 'bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700' },
  { value: 8, emoji: '😊', label: '8', color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700' },
  { value: 9, emoji: '😄', label: '9', color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700' },
  { value: 10, emoji: '🤩', label: '10', color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700' },
]

function getNpsCategory(score: number): { label: string; color: string } {
  if (score >= 9) return { label: 'Promoteur', color: 'text-emerald-600 dark:text-emerald-400' }
  if (score >= 7) return { label: 'Passif', color: 'text-amber-600 dark:text-amber-400' }
  return { label: 'Détracteur', color: 'text-red-600 dark:text-red-400' }
}

function getRatingColor(rating: number): string {
  if (rating >= 4) return 'bg-emerald-500'
  if (rating >= 3) return 'bg-amber-500'
  if (rating >= 2) return 'bg-orange-500'
  return 'bg-red-500'
}

function getRatingTextColor(rating: number): string {
  if (rating >= 4) return 'text-emerald-600 dark:text-emerald-400'
  if (rating >= 3) return 'text-amber-600 dark:text-amber-400'
  if (rating >= 2) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

// ─── Main Component ─────────────────────────

export function SatisfactionFeedbackModule() {
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [categories, setCategories] = useState<CategoryRating[]>(SATISFACTION_CATEGORIES.map(c => ({ ...c })))
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [avgNps, setAvgNps] = useState<number | null>(null)

  // ─── Load past feedback ──────────────────
  const loadFeedbacks = useCallback(async () => {
    try {
      const res = await authFetch('/api/paa/satisfaction')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setFeedbacks(json.data.feedbacks || [])
          setAvgRating(json.data.avgRating ?? null)
          setAvgNps(json.data.avgNps ?? null)
        }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadFeedbacks()
      setLoading(false)
    }
    init()
  }, [loadFeedbacks])

  // ─── NPS selection ───────────────────────
  const handleNpsSelect = useCallback((value: number) => {
    setNpsScore(value)
  }, [])

  // ─── Star rating for category ────────────
  const handleCategoryRating = useCallback((key: string, rating: number) => {
    setCategories(prev => prev.map(c => c.key === key ? { ...c, rating } : c))
  }, [])

  // ─── Submit feedback ─────────────────────
  const handleSubmit = useCallback(async () => {
    const avgCategoryRating = categories.reduce((sum, c) => sum + c.rating, 0) / Math.max(categories.filter(c => c.rating > 0).length, 1)
    const roundedRating = Math.round(avgCategoryRating) || 3

    setSubmitting(true)
    try {
      const res = await authFetch('/api/paa/satisfaction', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PROGRAM_GLOBAL',
          rating: roundedRating,
          nps: npsScore,
          comment: comment.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Merci pour votre retour !')
        setNpsScore(null)
        setComment('')
        setCategories(SATISFACTION_CATEGORIES.map(c => ({ ...c })))
        await loadFeedbacks()
      } else {
        toast.error(json.error?.message || 'Erreur lors de l\'envoi')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setSubmitting(false)
    }
  }, [categories, npsScore, comment, loadFeedbacks])

  // ─── Computed ────────────────────────────
  const avgCategory = categories.filter(c => c.rating > 0).length > 0
    ? Math.round((categories.reduce((s, c) => s + c.rating, 0) / categories.filter(c => c.rating > 0).length) * 10) / 10
    : 0

  const canSubmit = npsScore !== null || categories.some(c => c.rating > 0) || comment.trim().length > 0

  // ─── Loading ─────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // ─── Main Render ─────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Star className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Satisfaction & Feedback</h2>
            <p className="text-xs text-muted-foreground">
              {feedbacks.length} retour(s) — {avgRating !== null ? `Moy. ${avgRating}/5` : 'Aucune note'} — NPS: {avgNps !== null ? avgNps : '—'}
            </p>
          </div>
        </div>
        {avgNps !== null && (
          <Badge
            variant="outline"
            className={cn('text-sm px-3 py-1', avgNps >= 7 ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : avgNps >= 4 ? 'border-amber-300 text-amber-700 dark:text-amber-300' : 'border-red-300 text-red-700 dark:text-red-300')}
          >
            NPS: {avgNps}
          </Badge>
        )}
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-3">
            <Star className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Note moyenne</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{avgRating ?? '—'}/5</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-3">
            <MessageSquare className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">Retours</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{feedbacks.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-3">
            <Smile className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="text-[11px] text-muted-foreground">NPS moyen</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{avgNps ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* ── NPS Survey ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-rose-500" />
              Net Promoter Score (NPS)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Sur une échelle de 0 à 10, dans quelle mesure recommanderiez-vous ce programme d&apos;accompagnement ?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {NPS_FACES.map((face) => (
                <button
                  key={face.value}
                  type="button"
                  onClick={() => handleNpsSelect(face.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border-2 p-2 sm:p-3 min-w-[44px] transition-all',
                    face.color,
                    npsScore === face.value
                      ? 'ring-2 ring-rose-500 ring-offset-2 scale-110 shadow-lg'
                      : 'opacity-60 hover:opacity-100 hover:scale-105'
                  )}
                >
                  <span className="text-xl sm:text-2xl">{face.emoji}</span>
                  <span className="text-[10px] sm:text-xs font-bold">{face.label}</span>
                </button>
              ))}
            </div>
            {npsScore !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <span className="text-sm text-muted-foreground">Votre score :</span>
                <Badge className={cn('text-sm px-3', getNpsCategory(npsScore).color)}>
                  {npsScore}/10 — {getNpsCategory(npsScore).label}
                </Badge>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* ── Category Ratings ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-rose-500" />
              Satisfaction par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Évaluez chaque aspect du programme de 1 à 5 étoiles.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between rounded-lg border border-rose-100 dark:border-rose-900 p-3">
                  <span className="text-sm font-medium">{cat.label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCategoryRating(cat.key, star)}
                        className="transition-transform hover:scale-125"
                      >
                        <Star
                          className={cn(
                            'h-5 w-5 transition-colors',
                            star <= cat.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {avgCategory > 0 && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Moyenne :</span>
                <span className={cn('text-lg font-bold', getRatingTextColor(avgCategory))}>
                  {avgCategory}/5
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Open Feedback ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-rose-500" />
              Commentaire libre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez vos impressions, suggestions ou points d'amélioration..."
              className="min-h-[100px] resize-none"
              maxLength={5000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{comment.length}/5000</span>
              <Button
                size="sm"
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Envoyer mon retour
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Satisfaction Trend ── */}
        {feedbacks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-rose-500" />
                Historique des retours ({feedbacks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Visual trend bars */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Tendance des notes</p>
                <div className="flex items-end gap-1 h-24 overflow-x-auto pb-2">
                  {feedbacks.slice(0, 20).map((fb, i) => (
                    <div key={fb.id} className="flex flex-col items-center gap-1 shrink-0">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(fb.rating / 5) * 100}%` }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                        className={cn('w-6 sm:w-8 rounded-t-md', getRatingColor(fb.rating))}
                      />
                      <span className="text-[9px] text-muted-foreground">{fb.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Feedback list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {feedbacks.map((fb) => (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-rose-100 dark:border-rose-900 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{fb.type}</Badge>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                'h-3 w-3',
                                s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {fb.nps !== null && (
                          <Badge variant="outline" className="text-[10px]">
                            NPS: {fb.nps}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(fb.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{fb.comment}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  )
}