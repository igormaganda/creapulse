'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Trophy,
  Star,
  Lock,
  CheckCircle2,
  Flame,
  Target,
  Clock,
  Medal,
  Crown,
  Zap,
  Users,
  MapPin,
  Globe,
  ChevronUp,
  Sparkles,
  Calendar,
  Timer,
  Play,
  PartyPopper,
  Award,
  Loader2,
} from 'lucide-react'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface Achievement {
  id: string
  emoji: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
}

interface Challenge {
  id: string
  title: string
  description: string
  target: number
  current: number
  xpReward: number
  status: 'available' | 'accepted' | 'completed' | 'expired'
  acceptedAt: string | null
  completedAt: string | null
  deadline: string
}

interface LeaderboardEntry {
  rank: number
  name: string
  avatar: string
  level: string
  xp: number
  isCurrentUser: boolean
}

interface GamificationData {
  xp: number
  level: string
  achievements: Achievement[]
  challenges: Challenge[]
  stats: {
    modulesCompleted: number
    ateliersPaa: number
    activeDays: number
    globalScore: number
  }
  streak: number
  lastActiveDate: string | null
}

type LevelDef = { name: string; minXP: number; maxXP: number; color: string }

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const LEVELS: LevelDef[] = [
  { name: 'Débutant', minXP: 0, maxXP: 99, color: 'text-gray-500' },
  { name: 'Confirmé', minXP: 100, maxXP: 299, color: 'text-amber-500' },
  { name: 'Avancé', minXP: 300, maxXP: 599, color: 'text-orange-500' },
  { name: 'Expert', minXP: 600, maxXP: 999, color: 'text-red-500' },
  { name: 'Maître', minXP: 1000, maxXP: 1999, color: 'text-purple-500' },
  { name: 'Légende', minXP: 2000, maxXP: Infinity, color: 'text-amber-400' },
]

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', emoji: '🚀', name: 'Premier Pas', description: 'Compléter le profil créateur', unlocked: false, unlockedAt: null },
  { id: 'strategist', emoji: '📋', name: 'Stratège', description: 'Compléter le Business Plan', unlocked: false, unlockedAt: null },
  { id: 'visionary', emoji: '🎯', name: 'Visionnaire', description: 'Définir sa vision', unlocked: false, unlockedAt: null },
  { id: 'innovator', emoji: '💡', name: 'Innovateur', description: 'Utiliser 5 modules IA', unlocked: false, unlockedAt: null },
  { id: 'jurist', emoji: '🏛️', name: 'Juriste', description: 'Choisir son statut juridique', unlocked: false, unlockedAt: null },
  { id: 'analyst', emoji: '📊', name: 'Analyste', description: "Compléter l'étude de marché", unlocked: false, unlockedAt: null },
  { id: 'pitcher', emoji: '🗣️', name: 'Pitcher', description: 'Créer un Pitch Deck', unlocked: false, unlockedAt: null },
  { id: 'networker', emoji: '🤝', name: 'Réseauteur', description: 'Envoyer 10 messages', unlocked: false, unlockedAt: null },
  { id: 'gamer', emoji: '🎮', name: 'Gamer', description: 'Jouer aux Pépites', unlocked: false, unlockedAt: null },
  { id: 'organized', emoji: '📝', name: 'Organisé', description: 'Définir 5 objectifs SMART', unlocked: false, unlockedAt: null },
  { id: 'regular', emoji: '🔥', name: 'Régulier', description: 'Connexion 7 jours consécutifs', unlocked: false, unlockedAt: null },
  { id: 'complete', emoji: '⭐', name: 'Complet', description: 'Compléter 10 modules', unlocked: false, unlockedAt: null },
]

const STORAGE_KEY = 'creapulse-gamification'

function getDefaultChallenges(): Challenge[] {
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
  weekEnd.setHours(23, 59, 59, 999)

  return [
    {
      id: 'weekly-3-modules',
      title: 'Complétez 3 modules cette semaine',
      description: 'Terminez au moins 3 modules de votre parcours cette semaine pour gagner des XP.',
      target: 3,
      current: 0,
      xpReward: 150,
      status: 'available',
      acceptedAt: null,
      completedAt: null,
      deadline: weekEnd.toISOString(),
    },
    {
      id: 'weekly-5-badges',
      title: 'Obtenez 5 badges',
      description: 'Débloquez 5 badges de réussite pour montrer votre progression.',
      target: 5,
      current: 0,
      xpReward: 200,
      status: 'available',
      acceptedAt: null,
      completedAt: null,
      deadline: weekEnd.toISOString(),
    },
    {
      id: 'weekly-2-smart',
      title: 'Définissez 2 objectifs SMART',
      description: 'Créez et validez 2 objectifs SMART dans le module dédié.',
      target: 2,
      current: 0,
      xpReward: 100,
      status: 'available',
      acceptedAt: null,
      completedAt: null,
      deadline: weekEnd.toISOString(),
    },
    {
      id: 'weekly-3-forum',
      title: 'Participez au forum 3 fois',
      description: 'Publiez ou répondez à 3 discussions sur le forum communautaire.',
      target: 3,
      current: 0,
      xpReward: 120,
      status: 'available',
      acceptedAt: null,
      completedAt: null,
      deadline: weekEnd.toISOString(),
    },
  ]
}

function getDefaultData(): GamificationData {
  return {
    xp: 0,
    level: 'Débutant',
    achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
    challenges: getDefaultChallenges(),
    stats: {
      modulesCompleted: 0,
      ateliersPaa: 0,
      activeDays: 0,
      globalScore: 0,
    },
    streak: 0,
    lastActiveDate: null,
  }
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Sophie Martin', avatar: 'SM', level: 'Maître', xp: 1850, isCurrentUser: false },
  { rank: 2, name: 'Lucas Bernard', avatar: 'LB', level: 'Expert', xp: 1420, isCurrentUser: false },
  { rank: 3, name: 'Camille Dubois', avatar: 'CD', level: 'Expert', xp: 1280, isCurrentUser: false },
  { rank: 4, name: 'Thomas Petit', avatar: 'TP', level: 'Avancé', xp: 980, isCurrentUser: false },
  { rank: 5, name: 'Emma Leroy', avatar: 'EL', level: 'Avancé', xp: 870, isCurrentUser: false },
  { rank: 6, name: 'Hugo Moreau', avatar: 'HM', level: 'Avancé', xp: 756, isCurrentUser: false },
  { rank: 7, name: 'Léa Laurent', avatar: 'LL', level: 'Confirmé', xp: 620, isCurrentUser: false },
  { rank: 8, name: 'Nathan Simon', avatar: 'NS', level: 'Confirmé', xp: 540, isCurrentUser: false },
  { rank: 9, name: 'Chloé Michel', avatar: 'CM', level: 'Confirmé', xp: 475, isCurrentUser: false },
  { rank: 10, name: 'Maxime Garcia', avatar: 'MG', level: 'Confirmé', xp: 410, isCurrentUser: false },
  { rank: 11, name: 'Jade Thomas', avatar: 'JT', level: 'Confirmé', xp: 350, isCurrentUser: false },
  { rank: 12, name: 'Louis Roux', avatar: 'LR', level: 'Débutant', xp: 280, isCurrentUser: false },
  { rank: 13, name: 'Inès Robert', avatar: 'IR', level: 'Débutant', xp: 195, isCurrentUser: false },
  { rank: 14, name: 'Raphaël Richard', avatar: 'RR', level: 'Débutant', xp: 120, isCurrentUser: false },
  { rank: 15, name: 'Alice Durand', avatar: 'AD', level: 'Débutant', xp: 85, isCurrentUser: false },
  { rank: 16, name: 'Vous', avatar: 'VO', level: 'Débutant', xp: 0, isCurrentUser: true },
  { rank: 17, name: 'Gabriel Fournier', avatar: 'GF', level: 'Débutant', xp: 45, isCurrentUser: false },
  { rank: 18, name: 'Manon Girard', avatar: 'MG', level: 'Débutant', xp: 30, isCurrentUser: false },
]

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function getLevelForXP(xp: number): { level: LevelDef; nextLevel: LevelDef | null; progress: number } {
  let current: LevelDef = LEVELS[0]
  let next: LevelDef | null = LEVELS[1]

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXP && xp <= LEVELS[i].maxXP) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? null
      break
    }
  }

  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100

  return { level: current, nextLevel: next, progress: Math.min(progress, 100) }
}

function formatCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Terminé'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}j ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

function loadStoredData(): GamificationData {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GamificationData>
      const defaults = getDefaultData()
      return {
        xp: parsed.xp ?? defaults.xp,
        level: parsed.level ?? defaults.level,
        achievements: parsed.achievements ?? defaults.achievements,
        challenges: parsed.challenges ?? defaults.challenges,
        stats: { ...defaults.stats, ...parsed.stats },
        streak: parsed.streak ?? defaults.streak,
        lastActiveDate: parsed.lastActiveDate ?? defaults.lastActiveDate,
      }
    }
  } catch {
    // Keep defaults on parse error
  }
  return getDefaultData()
}

export function GamificationModule() {
  const [data, setData] = useState<GamificationData>(loadStoredData)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [acceptingChallenge, setAcceptingChallenge] = useState<string | null>(null)
  const [confettiChallenge, setConfettiChallenge] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update streak on mount
  const updateStreak = useCallback(() => {
    const today = new Date().toDateString()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as GamificationData
    if (parsed.lastActiveDate && parsed.lastActiveDate !== today) {
      const lastDate = new Date(parsed.lastActiveDate)
      const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
      if (diffDays === 1) {
        parsed.streak = parsed.streak + 1
        parsed.lastActiveDate = today
      } else if (diffDays > 1) {
        parsed.streak = 1
        parsed.lastActiveDate = today
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    } else if (!parsed.lastActiveDate) {
      parsed.streak = 1
      parsed.lastActiveDate = today
      parsed.stats.activeDays = parsed.stats.activeDays + 1
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }
  }, [])

  useEffect(() => {
    updateStreak()
  }, [updateStreak])

  // Countdown timer for challenges
  useEffect(() => {
    timerRef.current = setInterval(() => {
      // Force re-render for countdown
      setData(prev => ({ ...prev }))
    }, 60000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const saveData = useCallback((newData: GamificationData) => {
    setData(newData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
  }, [])

  const recalculateLevel = useCallback((xp: number): string => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXP) return LEVELS[i].name
    }
    return 'Débutant'
  }, [])

  const handleAcceptChallenge = useCallback((challengeId: string) => {
    setAcceptingChallenge(challengeId)
    setTimeout(() => {
      const newData = { ...data }
      const challenge = newData.challenges.find(c => c.id === challengeId)
      if (challenge && challenge.status === 'available') {
        challenge.status = 'accepted'
        challenge.acceptedAt = new Date().toISOString()
        saveData(newData)
        setConfettiChallenge(challengeId)
        toast.success('Défi accepté !', { description: 'Bonne chance pour ce défi !' })
        setTimeout(() => setConfettiChallenge(null), 2000)
      }
      setAcceptingChallenge(null)
    }, 600)
  }, [data, saveData])

  // Computed
  const { level: currentLevel, nextLevel, progress: levelProgress } = getLevelForXP(data.xp)
  const unlockedCount = data.achievements.filter(a => a.unlocked).length
  const activeChallenges = data.challenges.filter(c => c.status === 'available' || c.status === 'accepted')
  const pastChallenges = data.challenges.filter(c => c.status === 'completed' || c.status === 'expired')

  // Merge leaderboard with user position
  const leaderboardWithUser = data.xp > 0
    ? [...MOCK_LEADERBOARD.map(e => e.isCurrentUser ? { ...e, xp: data.xp, level: data.level } : e)]
    : MOCK_LEADERBOARD

  // ── SVG Ring Progress ──
  const ringRadius = 56
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (levelProgress / 100) * ringCircumference

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Gamification</h1>
            <p className="text-xs text-muted-foreground">Progression & récompenses</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 w-fit">
          Nouveau
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="profil" className="h-full">
          <div className="border-b px-4 md:px-6 bg-background">
            <TabsList className="bg-muted/60 h-10 p-0.5">
              <TabsTrigger value="profil" className="text-sm h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="classement" className="text-sm h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <Medal className="h-3.5 w-3.5" />
                Classement
              </TabsTrigger>
              <TabsTrigger value="defis" className="text-sm h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Défis
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══ TAB 1: MON PROFIL GAMER ═══ */}
          <TabsContent value="profil" className="p-4 md:p-6 space-y-6 mt-0">
            {/* Level ring + XP bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-amber-200 dark:border-amber-900/40 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* SVG Ring */}
                    <div className="relative shrink-0">
                      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                        <circle
                          cx="70" cy="70" r={ringRadius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-amber-100 dark:text-amber-900/30"
                        />
                        <motion.circle
                          cx="70" cy="70" r={ringRadius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          initial={{ strokeDashoffset: ringCircumference }}
                          animate={{ strokeDashoffset: ringOffset }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          className="text-amber-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Trophy className={cn('h-6 w-6 mb-0.5', currentLevel.color)} />
                        <span className="text-xs font-bold text-foreground">{currentLevel.name}</span>
                        <span className="text-[10px] text-muted-foreground">Niveau</span>
                      </div>
                    </div>

                    {/* XP info */}
                    <div className="flex-1 text-center sm:text-left space-y-3 w-full">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Mon Profil Gamer</h2>
                        <p className="text-sm text-muted-foreground">
                          {data.xp} XP cumulés
                          {data.streak > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                              <Flame className="h-3.5 w-3.5" />
                              {data.streak} jour{data.streak > 1 ? 's' : ''} de suite
                            </span>
                          )}
                        </p>
                      </div>

                      {/* XP Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-muted-foreground">{currentLevel.name}</span>
                          {nextLevel ? (
                            <span className="text-muted-foreground">
                              {nextLevel.minXP} XP pour {nextLevel.name}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">Niveau max !</span>
                          )}
                        </div>
                        <div className="relative h-3 w-full rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
                          <motion.div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${levelProgress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {data.xp} / {nextLevel ? `${nextLevel.minXP}` : `${currentLevel.minXP}+`} XP
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { icon: CheckCircle2, label: 'Modules complétés', value: data.stats.modulesCompleted, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                { icon: Zap, label: 'Ateliers PAA', value: data.stats.ateliersPaa, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
                { icon: Calendar, label: "Jours d'activité", value: data.stats.activeDays, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
                { icon: Trophy, label: 'Score Global', value: data.stats.globalScore, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
              ].map((stat, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-semibold text-foreground">Succès</h3>
                  <Badge variant="secondary" className="text-xs">
                    {unlockedCount}/{data.achievements.length}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {data.achievements.map((achievement, i) => (
                  <motion.button
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.03 * i }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAchievement(achievement)}
                    className={cn(
                      'group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center',
                      achievement.unlocked
                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-900/10 cursor-pointer hover:border-amber-400 hover:shadow-sm'
                        : 'border-muted bg-muted/30 cursor-default opacity-60'
                    )}
                  >
                    <div className={cn(
                      'text-3xl transition-transform',
                      achievement.unlocked && 'group-hover:scale-110'
                    )}>
                      {achievement.unlocked ? achievement.emoji : '🔒'}
                    </div>
                    <span className={cn(
                      'text-xs font-medium leading-tight',
                      achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {achievement.name}
                    </span>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(achievement.unlockedAt)}
                      </span>
                    )}
                    {!achievement.unlocked && (
                      <Lock className="h-3 w-3 text-muted-foreground/50 absolute top-2 right-2" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* ═══ TAB 2: CLASSEMENT ═══ */}
          <TabsContent value="classement" className="p-4 md:p-6 space-y-6 mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Podium: Top 3 */}
              <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
                {/* 2nd place */}
                <div className="flex flex-col items-center pt-6">
                  <div className="relative">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-lg font-bold text-foreground border-2 border-gray-300 dark:border-gray-500">
                      {leaderboardWithUser[1]?.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      2
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground text-center truncate w-full">{leaderboardWithUser[1]?.name}</p>
                  <p className="text-xs text-muted-foreground">{leaderboardWithUser[1]?.level}</p>
                  <p className="text-xs font-medium text-gray-500">{leaderboardWithUser[1]?.xp} XP</p>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center">
                  <Crown className="h-6 w-6 text-amber-400 mb-1" />
                  <div className="relative">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-500 dark:to-amber-700 flex items-center justify-center text-xl font-bold text-amber-900 dark:text-amber-100 border-2 border-amber-400 shadow-md shadow-amber-200/50">
                      {leaderboardWithUser[0]?.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      1
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground text-center truncate w-full">{leaderboardWithUser[0]?.name}</p>
                  <p className="text-xs text-amber-600 font-medium">{leaderboardWithUser[0]?.level}</p>
                  <p className="text-xs font-bold text-amber-500">{leaderboardWithUser[0]?.xp} XP</p>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center pt-8">
                  <div className="relative">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-700 dark:to-orange-800 flex items-center justify-center text-lg font-bold text-foreground border-2 border-orange-300 dark:border-orange-600">
                      {leaderboardWithUser[2]?.avatar}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      3
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground text-center truncate w-full">{leaderboardWithUser[2]?.name}</p>
                  <p className="text-xs text-muted-foreground">{leaderboardWithUser[2]?.level}</p>
                  <p className="text-xs font-medium text-orange-500">{leaderboardWithUser[2]?.xp} XP</p>
                </div>
              </div>

              {/* Leaderboard scope tabs */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-500" />
                      Classement
                    </CardTitle>
                    <Tabs defaultValue="centre" className="w-auto">
                      <TabsList className="h-8 p-0.5">
                        <TabsTrigger value="centre" className="text-xs h-7 px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1">
                          <MapPin className="h-3 w-3" />
                          Mon Centre
                        </TabsTrigger>
                        <TabsTrigger value="region" className="text-xs h-7 px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1">
                          <Globe className="h-3 w-3" />
                          Région
                        </TabsTrigger>
                        <TabsTrigger value="global" className="text-xs h-7 px-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1">
                          <Globe className="h-3 w-3" />
                          Global
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-x-auto overflow-y-auto">
                    <table className="w-full" aria-label="Classement des participants">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th scope="col" className="text-left text-xs font-medium text-muted-foreground py-2.5 px-4 w-14">#</th>
                          <th scope="col" className="text-left text-xs font-medium text-muted-foreground py-2.5 px-2">Participant</th>
                          <th scope="col" className="text-left text-xs font-medium text-muted-foreground py-2.5 px-2 hidden sm:table-cell">Niveau</th>
                          <th scope="col" className="text-right text-xs font-medium text-muted-foreground py-2.5 px-4">XP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardWithUser.map((entry) => (
                          <tr
                            key={entry.rank}
                            className={cn(
                              'border-b last:border-0 transition-colors',
                              entry.isCurrentUser
                                ? 'bg-amber-50 dark:bg-amber-900/20'
                                : 'hover:bg-muted/30'
                            )}
                          >
                            <td className="py-2.5 px-4">
                              {entry.rank <= 3 ? (
                                <Medal className={cn(
                                  'h-4 w-4',
                                  entry.rank === 1 && 'text-amber-500',
                                  entry.rank === 2 && 'text-gray-400',
                                  entry.rank === 3 && 'text-orange-500'
                                )} />
                              ) : (
                                <span className="text-sm text-muted-foreground">{entry.rank}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2.5">
                                <div className={cn(
                                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border',
                                  entry.isCurrentUser
                                    ? 'border-amber-400 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                    : 'border-muted-foreground/20 bg-muted text-muted-foreground'
                                )}>
                                  {entry.avatar}
                                </div>
                                <span className={cn(
                                  'text-sm font-medium truncate',
                                  entry.isCurrentUser ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'
                                )}>
                                  {entry.name}
                                  {entry.isCurrentUser && (
                                    <span className="ml-1.5 text-[10px] font-normal text-amber-500">(vous)</span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 hidden sm:table-cell">
                              <Badge variant="secondary" className="text-xs font-normal">
                                {entry.level}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={cn(
                                'text-sm font-semibold',
                                entry.isCurrentUser ? 'text-amber-600' : 'text-foreground'
                              )}>
                                {entry.xp.toLocaleString('fr-FR')}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-1">XP</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ═══ TAB 3: DÉFIS ═══ */}
          <TabsContent value="defis" className="p-4 md:p-6 space-y-6 mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Active challenges */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-semibold text-foreground">Défis de la semaine</h3>
                </div>

                {activeChallenges.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">Tous les défis sont terminés !</p>
                      <p className="text-xs text-muted-foreground mt-1">Revenez la semaine prochaine pour de nouveaux défis.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeChallenges.map((challenge, i) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * i }}
                      >
                        <Card className={cn(
                          'relative overflow-hidden transition-all',
                          challenge.status === 'accepted' && 'border-amber-300 dark:border-amber-700',
                          challenge.status === 'available' && 'hover:border-amber-200'
                        )}>
                          {/* Confetti animation overlay */}
                          <AnimatePresence>
                            {confettiChallenge === challenge.id && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 z-10 flex items-center justify-center bg-amber-500/10 backdrop-blur-[2px]"
                              >
                                <motion.div
                                  initial={{ scale: 0, rotate: -10 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 10 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                  className="flex items-center gap-2 bg-background rounded-full px-5 py-2.5 shadow-lg border border-amber-200"
                                >
                                  <PartyPopper className="h-5 w-5 text-amber-500" />
                                  <span className="font-bold text-amber-600">Défi accepté !</span>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-foreground">{challenge.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{challenge.description}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-xs font-bold text-amber-600">+{challenge.xpReward}</span>
                              </div>
                            </div>

                            {/* Progress */}
                            {challenge.status === 'accepted' && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Progression</span>
                                  <span className="font-medium text-foreground">{challenge.current}/{challenge.target}</span>
                                </div>
                                <Progress value={(challenge.current / challenge.target) * 100} className="h-2" />
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Timer className="h-3 w-3" />
                                {formatCountdown(challenge.deadline)}
                              </div>

                              {challenge.status === 'available' ? (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1"
                                  onClick={() => handleAcceptChallenge(challenge.id)}
                                  disabled={acceptingChallenge === challenge.id}
                                >
                                  {acceptingChallenge === challenge.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Play className="h-3 w-3" />
                                  )}
                                  Accepter
                                </Button>
                              ) : challenge.status === 'accepted' ? (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  En cours
                                </Badge>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past challenges */}
              {pastChallenges.length > 0 && (
                <div>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-base font-semibold text-foreground">Défis passés</h3>
                  </div>
                  <div className="space-y-3">
                    {pastChallenges.map((challenge) => (
                      <Card key={challenge.id} className="opacity-75">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            challenge.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-900/20'
                              : 'bg-muted'
                          )}>
                            {challenge.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{challenge.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {challenge.status === 'completed'
                                ? `Terminé le ${challenge.completedAt ? formatDate(challenge.completedAt) : ''}`
                                : 'Expiré'
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span className={cn(
                              'font-medium',
                              challenge.status === 'completed' ? 'text-emerald-600' : 'text-muted-foreground'
                            )}>
                              {challenge.status === 'completed' ? `+${challenge.xpReward}` : '0'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Achievement detail dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">{selectedAchievement?.emoji}</span>
              <span>{selectedAchievement?.name}</span>
            </DialogTitle>
            <DialogDescription>{selectedAchievement?.description}</DialogDescription>
          </DialogHeader>
          {selectedAchievement && (
            <div className="flex items-center justify-between pt-2">
              {selectedAchievement.unlocked ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Débloqué le {selectedAchievement.unlockedAt ? formatDate(selectedAchievement.unlockedAt) : ''}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Pas encore débloqué
                </div>
              )}
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                Succès
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}