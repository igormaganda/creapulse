'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Minus, Users, GraduationCap, BarChart3,
  MessageSquare, Heart, ArrowUpRight, Zap, Globe, ShoppingBag,
  Leaf, Franchise, Lock, ChevronRight, Trophy, Star,
} from 'lucide-react'

// ─── Mock Data ─────────────────────────────

const MOCK_USER_METRICS = {
  modulesCompletes: 8,
  completionBP: 72,
  sessionsCreascope: 2,
  scorePepites: 78,
  joursActivite: 42,
  objectifsAtteints: 4,
}

const MOCK_AVERAGES = {
  modulesCompletes: { value: 12.3, label: 'Modules complétés' },
  completionBP: { value: 45, label: 'Completion Business Plan' },
  sessionsCreascope: { value: 1.8, label: 'Sessions CréaScope' },
  scorePepites: { value: 72, label: 'Score Pépites' },
  joursActivite: { value: 34, label: 'Jours d\'activité' },
  objectifsAtteints: { value: 3.2, label: 'Objectifs SMART atteints' },
}

const TRENDS = [
  { label: 'Marketing digital', description: 'Réseaux sociaux, SEO, publicité en ligne', icon: BarChart3, change: 23, direction: 'up' as const },
  { label: 'Intelligence artificielle', description: 'Automatisation, chatbots, outils IA', icon: Zap, change: 45, direction: 'up' as const },
  { label: 'Économie circulaire', description: 'Recyclage, upcycling, réparation', icon: Leaf, change: 12, direction: 'up' as const },
  { label: 'E-commerce', description: 'Vente en ligne, marketplaces', icon: ShoppingBag, change: 5, direction: 'stable' as const },
  { label: 'Transition écologique', description: 'Bilan carbone, éco-conception', icon: Globe, change: 18, direction: 'up' as const },
  { label: 'Franchise', description: 'Réseaux de franchise, franchise indépendante', icon: Franchise, change: 8, direction: 'down' as const },
]

const TOP_FORMATIONS = [
  { name: 'Gérer sa trésorerie', inscriptions: 234, icon: '💰', change: '+15%' },
  { name: 'Maîtriser le marketing digital', inscriptions: 189, icon: '📣', change: '+32%' },
  { name: 'Choisir son statut juridique', inscriptions: 156, icon: '⚖️', change: '+8%' },
]

const POPULAR_QUESTIONS = [
  { title: 'Comment trouver ses premiers clients ?', replies: 23, likes: 87, category: 'Commercial' },
  { title: 'Micro-entreprise ou SASU pour commencer ?', replies: 41, likes: 124, category: 'Juridique' },
  { title: 'Quels outils gratuits pour son site web ?', replies: 35, likes: 96, category: 'Digital' },
]

const SIMILAR_PROFILES = [
  { id: '2847', sector: 'Commerce alimentaire', stage: 'Lancement', interests: ['Marketing local', 'Trésorerie', 'Réseautage'] },
  { id: '1532', sector: 'Services B2B', stage: 'Idée', interests: ['Business Model', 'Juridique', 'Finance'] },
  { id: '3911', sector: 'Artisanat d\'art', stage: 'Croissance', interests: ['E-commerce', 'Marketing digital', 'Pitch'] },
  { id: '0754', sector: 'Conseil & Formation', stage: 'Lancement', interests: ['Réseautage', 'Vision', 'Gestion du temps'] },
  { id: '6129', sector: 'Tech & SaaS', stage: 'Idée', interests: ['Business Model', 'Finance', 'Recrutement'] },
  { id: '4487', sector: 'Restauration', stage: 'Lancement', interests: ['Marketing local', 'Juridique', 'Trésorerie'] },
]

const COMMUNITIES = [
  { name: 'Créateurs Occitanie', members: 45, icon: '🌍', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { name: 'E-commerce & Digital', members: 128, icon: '🛒', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  { name: 'Restauration & Alimentation', members: 67, icon: '🍽️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { name: 'Services B2B', members: 93, icon: '🤝', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
]

const STAGE_COLORS = {
  Idée: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  Lancement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Croissance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

// ─── Main Component ─────────────────────────

export function IntelligenceCollectiveModule() {
  const [isLoading] = useState(false)

  // ─── Benchmarking comparison ──────────────
  const benchmarkData = useMemo(() => {
    const entries: { key: string; label: string; user: number; average: number; max: number }[] = [
      { key: 'modulesCompletes', label: MOCK_AVERAGES.modulesCompletes.label, user: MOCK_USER_METRICS.modulesCompletes, average: MOCK_AVERAGES.modulesCompletes.value, max: 37 },
      { key: 'completionBP', label: MOCK_AVERAGES.completionBP.label, user: MOCK_USER_METRICS.completionBP, average: MOCK_AVERAGES.completionBP.value, max: 100 },
      { key: 'sessionsCreascope', label: MOCK_AVERAGES.sessionsCreascope.label, user: MOCK_USER_METRICS.sessionsCreascope, average: MOCK_AVERAGES.sessionsCreascope.value, max: 10 },
      { key: 'scorePepites', label: MOCK_AVERAGES.scorePepites.label, user: MOCK_USER_METRICS.scorePepites, average: MOCK_AVERAGES.scorePepites.value, max: 100 },
      { key: 'joursActivite', label: MOCK_AVERAGES.joursActivite.label, user: MOCK_USER_METRICS.joursActivite, average: MOCK_AVERAGES.joursActivite.value, max: 90 },
      { key: 'objectifsAtteints', label: MOCK_AVERAGES.objectifsAtteints.label, user: MOCK_USER_METRICS.objectifsAtteints, average: MOCK_AVERAGES.objectifsAtteints.value, max: 15 },
    ]
    return entries.map(e => ({ ...e, userPercent: Math.min((e.user / e.max) * 100, 100), avgPercent: Math.min((e.average / e.max) * 100, 100) }))
  }, [])

  const globalPercentile = 72

  if (isLoading) {
    return (<div className="p-4 md:p-6 lg:p-8 space-y-6"><div className="h-8 w-64 bg-muted animate-pulse rounded" /><div className="h-4 w-96 bg-muted animate-pulse rounded" /><div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div></div>)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Intelligence Collective</h2>
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-[10px] px-1.5">Nouveau</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Benchmarking anonymisé et tendances du réseau</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="benchmarking" className="flex-1">
        <div className="border-b px-4 md:px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="benchmarking" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Benchmarking</TabsTrigger>
            <TabsTrigger value="tendances" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Tendances</TabsTrigger>
            <TabsTrigger value="reseau" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Réseau</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab: Benchmarking ── */}
        <TabsContent value="benchmarking" className="p-4 md:p-6 space-y-6">
          {/* Global percentile */}
          <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20">
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-orange-500"
                    style={{ strokeDasharray: 2 * Math.PI * 50, strokeDashoffset: 2 * Math.PI * 50 * (1 - globalPercentile / 100), transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-orange-600">{globalPercentile}</span>
                  <span className="text-[10px] text-muted-foreground">percentile</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">Vous êtes dans le top {100 - globalPercentile}% !</h3>
                <p className="text-sm text-muted-foreground mt-1">Votre progression est supérieure à {globalPercentile}% des entrepreneurs du réseau CreaPulse.</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Lock className="h-3 w-3" /> Données anonymisées et agrégées</p>
              </div>
            </CardContent>
          </Card>

          {/* Metric comparisons */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Comparaison détaillée</CardTitle><CardDescription>Vos métriques vs la moyenne du réseau</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {benchmarkData.map(m => (
                <div key={m.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{m.label}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-orange-600 font-semibold">{m.user}</span>
                      <span className="text-muted-foreground">vs moy. {m.average}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1"><span>Vous</span><span>{Math.round(m.userPercent)}%</span></div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500 transition-all duration-700" style={{ width: `${m.userPercent}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1"><span>Moyenne</span><span>{Math.round(m.avgPercent)}%</span></div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-muted-foreground/30 transition-all duration-700" style={{ width: `${m.avgPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Tendances ── */}
        <TabsContent value="tendances" className="p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-orange-600" />Sujets tendance ce mois</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TRENDS.map(t => {
                  const Icon = t.icon
                  return (
                    <motion.div key={t.label} whileHover={{ y: -2 }}>
                      <Card className="h-full hover:shadow-sm transition-shadow">
                        <CardContent className="flex items-start gap-3 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/20">
                            <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{t.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                            <Badge variant="outline" className={cn('mt-2 text-[10px]', t.direction === 'up' ? 'text-emerald-600 border-emerald-300' : t.direction === 'down' ? 'text-rose-600 border-rose-300' : 'text-muted-foreground')}>
                              {t.direction === 'up' && <><ArrowUpRight className="h-3 w-3 mr-0.5" />+{t.change}%</>}
                              {t.direction === 'down' && <><TrendingDown className="h-3 w-3 mr-0.5" />-{t.change}%</>}
                              {t.direction === 'stable' && <><Minus className="h-3 w-3 mr-0.5" />+{t.change}%</>}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-orange-600" />Formations populaires ce mois</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {TOP_FORMATIONS.map((f, i) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20 text-lg">{f.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.inscriptions} inscriptions</p>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">{f.change}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-orange-600" />Questions populaires du forum</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {POPULAR_QUESTIONS.map((q, i) => (
                  <Card key={i} className="p-3 hover:shadow-sm cursor-pointer transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                        <span className="text-sm font-bold text-orange-600">#{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{q.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
                          <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{q.replies}</span>
                          <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{q.likes}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab: Réseau ── */}
        <TabsContent value="reseau" className="p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-orange-600" />Profils similaires</CardTitle><CardDescription>Entrepreneurs avec des parcours proches du vôtre</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SIMILAR_PROFILES.map(p => (
                  <motion.div key={p.id} whileHover={{ y: -2 }}>
                    <Card className="h-full hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-sm font-bold text-orange-600">
                            #{p.id}
                          </div>
                          <div>
                            <Badge variant="outline" className="text-[10px]">{p.sector}</Badge>
                            <div className="mt-1">
                              <Badge className={cn('text-[10px]', STAGE_COLORS[p.stage as keyof typeof STAGE_COLORS])}>{p.stage}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.interests.map(interest => (
                            <Badge key={interest} variant="outline" className="text-[10px]">{interest}</Badge>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="w-full gap-1 text-orange-600 border-orange-300 hover:bg-orange-50 mt-1" disabled>
                          <Lock className="h-3 w-3" />Envoyer un message
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-orange-600" />Communautés recommandées</CardTitle><CardDescription>Rejoignez des groupes d'entrepreneurs autour de vos centres d'intérêt</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMUNITIES.map(c => (
                  <Card key={c.name} className="hover:shadow-sm transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl bg-muted/50">{c.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.members} membres</p>
                      </div>
                      <Button size="sm" className="gap-1 bg-orange-600 hover:bg-orange-700 text-white shrink-0">
                        Rejoindre
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}