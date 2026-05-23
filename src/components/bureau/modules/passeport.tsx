'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PasseportPdf } from '@/components/bureau/export/passeport-pdf'
import {
  Stamp,
  CheckCircle2,
  Circle,
  Clock,
  Award,
  Download,
  Share2,
  Sparkles,
  Loader2,
  Flame,
  Medal,
  Crown,
  Gem,
  GraduationCap,
  Target,
  Pentagon,
  Lightbulb,
  Globe,
  Scale,
  Calculator,
  FileText,
  Rocket,
  TrendingUp,
  Calendar,
  User,
} from 'lucide-react'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface ModuleStatus {
  code: string
  label: string
  category: string
  status: 'completed' | 'in_progress' | 'not_started'
  score: number
  maxScore: number
  completedAt: string | null
}

interface PasseportData {
  modules: ModuleStatus[]
  totalModules: number
  completedCount: number
  progressPercent: number
  certificationLevel: 'none' | 'bronze' | 'argent' | 'or' | 'platine'
  skillsAcquired: string[]
  timeline: { module: string; code: string; date: string; score: number }[]
  passportGeneratedAt: string | null
  attestationIds: string[]
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const MODULE_ICONS: Record<string, typeof Stamp> = {
  'profil': User,
  'riasec': GraduationCap,
  'kiviat': Pentagon,
  'mon-projet': Lightbulb,
  'marche': Globe,
  'juridique': Scale,
  'financier': Calculator,
  'business-plan': FileText,
  'tremplin': Rocket,
}

const CERTIFICATION_CONFIG = {
  none: { label: 'Non certifié', icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-muted' },
  bronze: { label: 'Bronze', icon: Medal, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700' },
  argent: { label: 'Argent', icon: Award, color: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600' },
  or: { label: 'Or', icon: Crown, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700' },
  platine: { label: 'Platine', icon: Gem, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-300 dark:border-violet-700' },
}

const MOCK_DATA: PasseportData = {
  modules: [
    { code: 'profil', label: 'Profil Créateur', category: 'Parcours', status: 'completed', score: 85, maxScore: 100, completedAt: '2025-01-15T10:00:00Z' },
    { code: 'riasec', label: 'Test RIASEC', category: 'Parcours', status: 'completed', score: 72, maxScore: 100, completedAt: '2025-01-18T14:30:00Z' },
    { code: 'kiviat', label: 'Test Kiviat', category: 'Parcours', status: 'completed', score: 68, maxScore: 100, completedAt: '2025-01-20T09:15:00Z' },
    { code: 'mon-projet', label: 'Mon Projet', category: 'Parcours', status: 'completed', score: 90, maxScore: 100, completedAt: '2025-02-01T11:00:00Z' },
    { code: 'marche', label: 'Analyse de Marché', category: 'Stratégie', status: 'completed', score: 78, maxScore: 100, completedAt: '2025-02-10T16:00:00Z' },
    { code: 'juridique', label: 'Analyse Juridique', category: 'Stratégie', status: 'in_progress', score: 0, maxScore: 100, completedAt: null },
    { code: 'financier', label: 'Plan Financier', category: 'Stratégie', status: 'not_started', score: 0, maxScore: 100, completedAt: null },
    { code: 'business-plan', label: 'Business Plan', category: 'Stratégie', status: 'not_started', score: 0, maxScore: 100, completedAt: null },
    { code: 'tremplin', label: 'Tremplin', category: 'Pilotage', status: 'not_started', score: 0, maxScore: 100, completedAt: null },
  ],
  totalModules: 9,
  completedCount: 5,
  progressPercent: 56,
  certificationLevel: 'argent',
  skillsAcquired: [
    'Connaissance de soi', 'Identité entrepreneuriale', 'Profil RIASEC',
    'Compréhension des dimensions entrepreneuriales', 'Auto-évaluation des compétences',
    'Analyse radar', 'Formulation de projet', 'Market fit',
    'Analyse de marché', 'Étude concurrentielle', 'Segmentation',
  ],
  timeline: [
    { module: 'Profil Créateur', code: 'profil', date: '2025-01-15T10:00:00Z', score: 85 },
    { module: 'Test RIASEC', code: 'riasec', date: '2025-01-18T14:30:00Z', score: 72 },
    { module: 'Test Kiviat', code: 'kiviat', date: '2025-01-20T09:15:00Z', score: 68 },
    { module: 'Mon Projet', code: 'mon-projet', date: '2025-02-01T11:00:00Z', score: 90 },
    { module: 'Analyse de Marché', code: 'marche', date: '2025-02-10T16:00:00Z', score: 78 },
  ],
  passportGeneratedAt: null,
  attestationIds: [],
}

// ────────────────────────────────────────────
// Animation variants
// ────────────────────────────────────────────

const fadeVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function Passeport() {
  const [data, setData] = useState<PasseportData>(MOCK_DATA)
  const [loading, setLoading] = useState(true)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showPdfDialog, setShowPdfDialog] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('creapulse-token')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/passeport', { headers })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setData(json.data)
          }
        }
      } catch {
        // Use mock data
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGeneratePassport = () => {
    setShowExportDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const certConfig = CERTIFICATION_CONFIG[data.certificationLevel]
  const CertIcon = certConfig.icon

  // Circular progress calculation
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (data.progressPercent / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
            <Stamp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Passeport Entrepreneurial</h2>
            <p className="text-sm text-muted-foreground">Certifiez votre parcours et valorisez vos compétences</p>
          </div>
        </div>
        <Button onClick={handleGeneratePassport} className="gap-2 rounded-full">
          <Download className="h-4 w-4" />
          Générer mon passeport
        </Button>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Progress Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <motion.circle
                  cx="70" cy="70" r={radius} fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{data.progressPercent}%</span>
                <span className="text-xs text-muted-foreground">complété</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.completedCount}/{data.totalModules}</p>
              <p className="text-sm text-muted-foreground">modules terminés</p>
              <p className="text-xs text-muted-foreground mt-2">{data.skillsAcquired.length} compétences acquises</p>
            </div>
          </CardContent>
        </Card>

        {/* Certification Level Card */}
        <Card className={cn('border-2', certConfig.border, certConfig.bg)}>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl mb-3', certConfig.bg)}>
              <CertIcon className={cn('h-8 w-8', certConfig.color)} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Niveau {certConfig.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {data.certificationLevel === 'none' ? 'Complétez des modules pour obtenir votre certification' :
               data.certificationLevel === 'bronze' ? '30% de complétude' :
               data.certificationLevel === 'argent' ? '50% de complétude' :
               data.certificationLevel === 'or' ? '75% de complétude' :
               'Parcours complet terminé !'}
            </p>
            {data.certificationLevel !== 'platine' && (
              <div className="mt-3 w-full max-w-[200px]">
                <Progress value={data.progressPercent} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Goal Card */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Flame className="h-8 w-8 text-coral-500 mb-3" />
            <h3 className="text-base font-semibold text-foreground">Prochain objectif</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {data.certificationLevel === 'none'
                ? `Complétez ${Math.ceil(data.totalModules * 0.3)} modules pour le Bronze`
                : data.certificationLevel === 'bronze'
                ? `Complétez ${Math.ceil(data.totalModules * 0.5)} modules pour l'Argent`
                : data.certificationLevel === 'argent'
                ? `Complétez ${Math.ceil(data.totalModules * 0.75)} modules pour l'Or`
                : data.certificationLevel === 'or'
                ? `Complétez tous les modules pour le Platine`
                : 'Vous avez atteint le niveau maximum !'}
            </p>
            <Badge variant="outline" className="mt-3 gap-1.5 text-xs">
              <TrendingUp className="h-3 w-3" />
              +{data.certificationLevel === 'none' ? 30 : data.certificationLevel === 'bronze' ? 20 : data.certificationLevel === 'argent' ? 25 : data.certificationLevel === 'or' ? 100 - data.progressPercent : 0}% restant
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Modules Attestation Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Attestations par Module</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.modules.map((mod, idx) => {
            const Icon = MODULE_ICONS[mod.code] || Circle
            const isCompleted = mod.status === 'completed'
            const isInProgress = mod.status === 'in_progress'
            return (
              <motion.div
                key={mod.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn(
                  'transition-all',
                  isCompleted ? 'border-emerald-200 dark:border-emerald-800' : isInProgress ? 'border-amber-200 dark:border-amber-800' : ''
                )}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20' : isInProgress ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-muted'
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : isInProgress ? (
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{mod.label}</p>
                      <p className="text-xs text-muted-foreground">{mod.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {isCompleted ? (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0">
                          {mod.score}%
                        </Badge>
                      ) : isInProgress ? (
                        <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-0">
                          En cours
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Non commencé
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Skills & Timeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Acquired */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Compétences Acquises
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.skillsAcquired.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.skillsAcquired.map((skill, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Badge variant="secondary" className="text-xs">{skill}</Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Complétez des modules pour acquérir des compétences.</p>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Chronologie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.timeline.length > 0 ? (
              <div className="relative space-y-0">
                {data.timeline.map((event, idx) => {
                  const Icon = MODULE_ICONS[event.code] || Circle
                  return (
                    <div key={idx} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        {idx < data.timeline.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{event.module}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{event.score}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité terminée pour le moment.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-amber-500" />
              Passeport Entrepreneurial GIDEF
            </DialogTitle>
            <DialogDescription>
              Récapitulatif de votre parcours entrepreneurial certifié
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="text-center">
              <div className={cn('inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-2', certConfig.bg)}>
                <CertIcon className={cn('h-5 w-5', certConfig.color)} />
                <span className={cn('font-semibold', certConfig.color)}>Certification {certConfig.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.completedCount} modules complétés sur {data.totalModules} — {data.progressPercent}% de progression
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Modules complétés :</h4>
              {data.modules.filter(m => m.status === 'completed').map(m => (
                <div key={m.code} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {m.label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{m.score}%</Badge>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button className="flex-1 gap-2" onClick={() => {
                setShowExportDialog(false)
                setShowPdfDialog(true)
              }}>
                <Download className="h-4 w-4" />
                Télécharger PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => {
                toast.success('Lien de partage copié !')
                setShowExportDialog(false)
              }}>
                <Share2 className="h-4 w-4" />
                Partager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Export Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <PasseportPdf onClose={() => setShowPdfDialog(false)} />
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
