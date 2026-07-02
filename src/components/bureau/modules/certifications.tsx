'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  BadgeCheck,
  Award,
  FileText,
  BarChart3,
  Calculator,
  Trophy,
  Lock,
  CheckCircle2,
  Share2,
  Download,
  Loader2,
  Star,
  Calendar,
  Copy,
  Sparkles,
  TrendingUp,
  Shield,
} from 'lucide-react'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface CertRequirement {
  moduleCode: string
  moduleLabel: string
  completed: boolean
}

interface Certification {
  id: string
  name: string
  description: string
  icon: string
  requirements: CertRequirement[]
  progress: number
  isEarned: boolean
  credentialId: string | null
  earnedDate: string | null
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
}

interface CertificationsData {
  certifications: Certification[]
  totalCertifications: number
  earnedCount: number
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const LEVEL_CONFIG = {
  basic: { label: 'Basique', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800' },
  intermediate: { label: 'Intermédiaire', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  advanced: { label: 'Avancé', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800' },
  expert: { label: 'Expert', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20', border: 'border-amber-300 dark:border-amber-700' },
}

const ICON_MAP: Record<string, typeof Award> = {
  Award,
  FileText,
  BarChart3,
  Calculator,
  Trophy,
}

const MOCK_CERTIFICATIONS: CertificationsData = {
  certifications: [
    {
      id: 'createur-certifie',
      name: 'Créateur Certifié',
      description: 'Attestation de complétude de tous les modules du parcours entrepreneur',
      icon: 'Award',
      requirements: [
        { moduleCode: 'profil', moduleLabel: 'Profil Créateur', completed: true },
        { moduleCode: 'riasec', moduleLabel: 'Test RIASEC', completed: true },
        { moduleCode: 'kiviat', moduleLabel: 'Test Kiviat', completed: true },
        { moduleCode: 'mon-projet', moduleLabel: 'Mon Projet', completed: true },
      ],
      progress: 100,
      isEarned: true,
      credentialId: 'GIDEF-CREATEUR-CERTIFIE-A1B2C3D4',
      earnedDate: '2025-02-01T11:00:00Z',
      level: 'basic',
    },
    {
      id: 'business-planner',
      name: 'Business Planner',
      description: 'Certification pour la maîtrise complète de la rédaction du Business Plan',
      icon: 'FileText',
      requirements: [
        { moduleCode: 'business-plan', moduleLabel: 'Business Plan (complet)', completed: false },
      ],
      progress: 0,
      isEarned: false,
      credentialId: null,
      earnedDate: null,
      level: 'intermediate',
    },
    {
      id: 'analyste-marche',
      name: 'Analyste de Marché',
      description: 'Certification en analyse de marché et positionnement concurrentiel',
      icon: 'BarChart3',
      requirements: [
        { moduleCode: 'marche', moduleLabel: 'Analyse de Marché', completed: true },
      ],
      progress: 100,
      isEarned: true,
      credentialId: 'GIDEF-ANALYSTE-MARCHE-A1B2C3D4',
      earnedDate: '2025-02-10T16:00:00Z',
      level: 'intermediate',
    },
    {
      id: 'expert-financier',
      name: 'Expert Financier',
      description: 'Certification avancée en planification et simulation financière',
      icon: 'Calculator',
      requirements: [
        { moduleCode: 'financier', moduleLabel: 'Plan Financier', completed: false },
        { moduleCode: 'creasim', moduleLabel: 'CreaSim (simulateur)', completed: false },
      ],
      progress: 0,
      isEarned: false,
      credentialId: null,
      earnedDate: null,
      level: 'advanced',
    },
    {
      id: 'entrepreneur-gidef',
      name: 'Entrepreneur GIDEF',
      description: 'Certification complète du parcours entrepreneurial GIDEF Ile-de-France',
      icon: 'Trophy',
      requirements: [
        { moduleCode: 'tremplin', moduleLabel: 'Tremplin (évaluation GO)', completed: false },
        { moduleCode: 'mon-projet', moduleLabel: 'Mon Projet', completed: true },
        { moduleCode: 'business-plan', moduleLabel: 'Business Plan', completed: false },
      ],
      progress: 33,
      isEarned: false,
      credentialId: null,
      earnedDate: null,
      level: 'expert',
    },
  ],
  totalCertifications: 5,
  earnedCount: 2,
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function Certifications() {
  const [data, setData] = useState<CertificationsData>(MOCK_CERTIFICATIONS)
  const [loading, setLoading] = useState(true)
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }

        const res = await fetch('/api/certifications', { headers, credentials: 'include' })
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

  const earnedCerts = data.certifications.filter((c) => c.isEarned)
  const inProgressCerts = data.certifications.filter((c) => !c.isEarned && c.progress > 0)
  const lockedCerts = data.certifications.filter((c) => !c.isEarned && c.progress === 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
          <BadgeCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Certifications</h2>
          <p className="text-sm text-muted-foreground">Validez vos compétences et obtenez des certifications GIDEF</p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-none shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/60 h-1.5" />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-foreground">
                {data.earnedCount} certification{data.earnedCount !== 1 ? 's' : ''} obtenue{data.earnedCount !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                sur {data.totalCertifications} certifications disponibles
              </p>
              <div className="mt-3 max-w-md">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progression globale</span>
                  <span>{Math.round(data.certifications.reduce((s, c) => s + c.progress, 0) / data.totalCertifications)}%</span>
                </div>
                <Progress
                  value={Math.round(data.certifications.reduce((s, c) => s + c.progress, 0) / data.totalCertifications)}
                  className="h-2.5"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earned Certificates */}
      {earnedCerts.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            Certifications obtenues
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedCerts.map((cert, idx) => {
              const Icon = ICON_MAP[cert.icon] || Award
              const levelConf = LEVEL_CONFIG[cert.level]
              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Card className={cn('border-2 transition-all hover:shadow-md', levelConf.border, levelConf.bg)}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm')}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{cert.name}</h4>
                          <Badge variant="secondary" className="text-[10px] mt-0.5 gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">
                            <Sparkles className="h-3 w-3" />
                            {levelConf.label}
                          </Badge>
                        </div>
                      </div>

                      {cert.earnedDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Obtenu le {new Date(cert.earnedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}

                      {cert.credentialId && (
                        <div className="bg-background/60 rounded-lg p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Identifiant du certificat</p>
                          <p className="text-xs font-mono font-medium text-foreground break-all">{cert.credentialId}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs h-8"
                          onClick={() => {
                            navigator.clipboard.writeText(cert.credentialId || '')
                            toast.success('Identifiant copié !')
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copier l&apos;ID
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs h-8"
                          onClick={() => toast.success('Certificat partagé !')}
                        >
                          <Share2 className="h-3 w-3" />
                          Partager
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>
      )}

      {/* In Progress Certifications */}
      {inProgressCerts.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            En cours de validation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCerts.map((cert, idx) => (
              <CertCard key={cert.id} cert={cert} index={idx} onClick={() => setSelectedCert(cert)} />
            ))}
          </div>
        </section>
      )}

      {/* Locked Certifications */}
      {lockedCerts.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Certifications verrouillées
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedCerts.map((cert, idx) => (
              <CertCard key={cert.id} cert={cert} index={idx} onClick={() => setSelectedCert(cert)} />
            ))}
          </div>
        </section>
      )}

      {/* All certifications empty state */}
      {data.certifications.length === 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Aucune certification disponible</p>
            <p className="text-sm text-muted-foreground mt-1">Commencez par compléter des modules pour débloquer des certifications.</p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              {selectedCert?.name}
            </DialogTitle>
            <DialogDescription>{selectedCert?.description}</DialogDescription>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4 mt-2">
              {/* Level */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{LEVEL_CONFIG[selectedCert.level].label}</Badge>
                {selectedCert.isEarned ? (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Obtenue
                  </Badge>
                ) : (
                  <Badge variant="secondary">{selectedCert.progress}% complété</Badge>
                )}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{selectedCert.progress}%</span>
                </div>
                <Progress value={selectedCert.progress} className="h-2.5" />
              </div>

              <Separator />

              {/* Requirements */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Prérequis</h4>
                <div className="space-y-2">
                  {selectedCert.requirements.map((req) => (
                    <div key={req.moduleCode} className="flex items-center gap-3">
                      {req.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <span className={cn('text-sm', req.completed ? 'text-foreground' : 'text-muted-foreground')}>
                        {req.moduleLabel}
                      </span>
                      {req.completed && (
                        <Badge variant="secondary" className="text-[10px] ml-auto shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0">
                          Validé
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedCert.isEarned && selectedCert.credentialId && (
                <>
                  <Separator />
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Identifiant du certificat</p>
                    <p className="text-sm font-mono font-semibold text-foreground">{selectedCert.credentialId}</p>
                    {selectedCert.earnedDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedCert.earnedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => toast.success('Téléchargement bientôt disponible')}>
                        <Download className="h-3 w-3" />
                        Télécharger
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => toast.success('Certificat partagé !')}>
                        <Share2 className="h-3 w-3" />
                        Partager
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ────────────────────────────────────────────
// Certification Card
// ────────────────────────────────────────────

function CertCard({
  cert,
  index,
  onClick,
}: {
  cert: Certification
  index: number
  onClick: () => void
}) {
  const Icon = ICON_MAP[cert.icon] || Award
  const levelConf = LEVEL_CONFIG[cert.level]
  const isLocked = cert.progress === 0 && !cert.isEarned
  const isInProgress = !cert.isEarned && cert.progress > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card
        className={cn(
          'group cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
          isLocked && 'opacity-70'
        )}
        onClick={onClick}
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
              cert.isEarned
                ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                : isInProgress
                ? levelConf.bg
                : 'bg-muted'
            )}>
              {isLocked ? (
                <Lock className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Icon className={cn('h-5 w-5', cert.isEarned ? 'text-white' : levelConf.color)} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">{cert.name}</h4>
              <Badge variant="outline" className="text-[10px] mt-0.5">{levelConf.label}</Badge>
            </div>
            {cert.isEarned && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{cert.description}</p>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>
                {cert.requirements.filter((r) => r.completed).length}/{cert.requirements.length} prérequis
              </span>
              <span>{cert.progress}%</span>
            </div>
            <Progress value={cert.progress} className="h-1.5" />
          </div>

          {/* Requirements preview */}
          <div className="flex flex-wrap gap-1">
            {cert.requirements.map((req) => (
              <span
                key={req.moduleCode}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]',
                  req.completed
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {req.completed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                {req.moduleLabel}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
