'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/zustand/store'
import {
  Play,
  CheckCircle2,
  Plus,
  AlertCircle,
  BarChart3,
  Brain,
  Rocket,
  Loader2,
} from 'lucide-react'
import { STEPS, STATUS_COLORS, STATUS_LABELS, formatDate, getStepIndex } from './shared'
import type { Session } from './shared'

// ─── Session Card ────────────────────────────────

function SessionCard({ session, onClick }: { session: Session; onClick: () => void }) {
  const stepIdx = getStepIndex(session.currentStep)
  const progress = Math.round((stepIdx / STEPS.length) * 100)

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card
        onClick={onClick}
        className={cn(
          'cursor-pointer transition-all duration-200 rounded-2xl',
          'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20',
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold">
                {(session.beneficiary.user.firstName || '?')[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {session.beneficiary.user.firstName} {session.beneficiary.user.lastName}
                </p>
                <p className="text-xs text-white/50">{formatDate(session.scheduledAt)}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[session.status] || '')}>
              {STATUS_LABELS[session.status] || session.status}
            </Badge>
          </div>

          {session.status === 'EN_COURS' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">{STEPS[stepIdx]?.label || session.currentStep}</span>
                <span className="text-teal-400 font-medium">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Create Session Form ─────────────────────────

function CreateSessionForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [beneficiaries, setBeneficiaries] = useState<{ id: string; name: string }[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    async function fetchBeneficiaries() {
      try {
        const res = await fetch('/api/assignments?role=counselor', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setBeneficiaries(data.data.map((a: { beneficiaryId: string; beneficiary: { user: { firstName: string | null; lastName: string | null } } }) => ({
            id: a.beneficiaryId,
            name: `${a.beneficiary.user.firstName || ''} ${a.beneficiary.user.lastName || ''}`.trim(),
          })))
        }
      } catch {
        // silent
      }
    }
    fetchBeneficiaries()
  }, [token])

  const handleCreate = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/creascope/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ beneficiaryId: selected }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Session CréaScope créée !')
        onSuccess()
      } else {
        toast.error(data.error?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white/5 border-white/10 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-white text-base">Nouvelle session CréaScope</CardTitle>
        <CardDescription className="text-white/50">Sélectionnez un bénéficiaire pour démarrer une session de diagnostic complet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {beneficiaries.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl text-sm transition-all',
                  selected === b.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10',
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-[10px] font-bold">
                    {b.name[0] || '?'}
                  </div>
                  {b.name || b.id}
                </div>
              </button>
            ))}
            {beneficiaries.length === 0 && (
              <p className="text-xs text-white/40 text-center py-4">Aucun bénéficiaire assigné trouvé</p>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate} disabled={!selected || loading} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Créer la session
          </Button>
          <Button variant="outline" onClick={onCancel} className="border-white/20 text-white/70 hover:bg-white/10">
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── SessionList ─────────────────────────────────

export function SessionList({
  sessions,
  onSelectSession,
  isLoading,
}: {
  sessions: Session[]
  onSelectSession: (session: Session) => void
  isLoading: boolean
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState('en_cours')

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'en_cours') return s.status === 'EN_COURS' || s.status === 'PAUSEE'
    if (activeTab === 'planifiees') return s.status === 'PLANIFIEE'
    if (activeTab === 'terminees') return s.status === 'TERMINEE' || s.status === 'ANNULEE'
    return true
  })

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="space-y-4 w-full max-w-md">
          <div className="h-8 bg-white/10 animate-pulse rounded w-1/3" />
          <div className="h-4 bg-white/10 animate-pulse rounded w-2/3" />
          <div className="h-32 bg-white/5 animate-pulse rounded mt-6" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xl">
            <Rocket />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CréaScope</h1>
            <p className="text-sm text-white/50">Pipeline de session diagnostic 3-4h</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" /> Nouvelle session
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CreateSessionForm
              onSuccess={() => { setShowCreate(false) }}
              onCancel={() => setShowCreate(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 rounded-xl">
          <TabsTrigger value="en_cours" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 rounded-lg text-white/60">
            En cours ({sessions.filter((s) => s.status === 'EN_COURS' || s.status === 'PAUSEE').length})
          </TabsTrigger>
          <TabsTrigger value="planifiees" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 rounded-lg text-white/60">
            Planifiées ({sessions.filter((s) => s.status === 'PLANIFIEE').length})
          </TabsTrigger>
          <TabsTrigger value="terminees" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 rounded-lg text-white/60">
            Terminées ({sessions.filter((s) => s.status === 'TERMINEE' || s.status === 'ANNULEE').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredSessions.length === 0 ? (
            <Card className="bg-white/5 border-white/10 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-10 w-10 text-white/20 mb-3" />
                <p className="text-sm text-white/40">Aucune session {activeTab === 'en_cours' ? 'en cours' : activeTab === 'planifiees' ? 'planifiée' : 'terminée'}</p>
                <Button variant="ghost" onClick={() => setShowCreate(true)} className="text-teal-400 text-xs mt-3">
                  <Plus className="h-3 w-3 mr-1" /> Créer une session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => onSelectSession(session)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total sessions', value: sessions.length, icon: BarChart3, color: 'text-teal-400' },
          { label: 'En cours', value: sessions.filter((s) => s.status === 'EN_COURS').length, icon: Play, color: 'text-amber-400' },
          { label: 'Terminées', value: sessions.filter((s) => s.status === 'TERMINEE').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Score moyen', value: sessions.filter((s) => s.globalScore !== null).length > 0
            ? Math.round(sessions.filter((s) => s.globalScore !== null).reduce((acc, s) => acc + (s.globalScore || 0), 0) / sessions.filter((s) => s.globalScore !== null).length)
            : '—',
            icon: Brain, color: 'text-purple-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white/5 border-white/10 rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={cn('h-5 w-5', stat.color)} />
              <div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
