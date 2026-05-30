'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  FileText,
  FileSpreadsheet,
  LayoutGrid,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Rocket,
  Target,
  Pentagon,
  TrendingUp,
  Presentation,
  Stamp,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface PdfExportItem {
  id: string
  label: string
  description: string
  endpoint: string
  fileName: string
  icon: typeof FileText
  color: string
  bgColor: string
  format: 'pdf' | 'pptx' | 'html'
  method?: string
  hasData: boolean
}

// ────────────────────────────────────────────
// Export items configuration
// ────────────────────────────────────────────

const EXPORT_ITEMS: PdfExportItem[] = [
  {
    id: 'suivi-parcours',
    label: 'Suivi de Parcours Complet',
    description: 'Bilan global de votre parcours créateur avec Kiviat, RIASEC, modules, Tremplin et recommandations.',
    endpoint: '/api/export/suivi-parcours',
    fileName: 'suivi-parcours',
    icon: FileText,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    format: 'pdf',
    hasData: true,
  },
  {
    id: 'suivi-kiviat',
    label: 'Suivi — Compétences Kiviat',
    description: 'Analyse radar détaillée de vos 8 dimensions de compétences entrepreneuriales avec recommandations.',
    endpoint: '/api/export/suivi-kiviat',
    fileName: 'suivi-kiviat',
    icon: Pentagon,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    format: 'pdf',
    hasData: true,
  },
  {
    id: 'suivi-creasim',
    label: 'Suivi — Simulation Financière',
    description: 'Rapport CreaSim complet : mensuel, 3 ans, seuil de rentabilité, détail des charges et analyse IA.',
    endpoint: '/api/export/suivi-creasim',
    fileName: 'suivi-creasim',
    icon: TrendingUp,
    color: 'text-coral-500',
    bgColor: 'bg-coral-50 dark:bg-coral-900/20',
    format: 'pdf',
    hasData: true,
  },
  {
    id: 'suivi-tremplin',
    label: 'Suivi — Évaluation Tremplin',
    description: 'Bilan Tremplin avec décision GO/NO_GO, score, détail des étapes et recommandations.',
    endpoint: '/api/export/suivi-tremplin',
    fileName: 'suivi-tremplin',
    icon: Rocket,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    format: 'pdf',
    hasData: true,
  },
  {
    id: 'bmc',
    label: 'Business Model Canvas',
    description: 'Canvas BMC au format paysage avec les 9 blocs pré-remplis, prêt à imprimer.',
    endpoint: '/api/export/bmc',
    fileName: 'business-model-canvas',
    icon: LayoutGrid,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    format: 'html',
    method: 'print',
    hasData: true,
  },
  {
    id: 'pitch-deck',
    label: 'Pitch Deck',
    description: 'Présentation PowerPoint de 9 slides (Problème, Solution, Marché, Business Model, etc.).',
    endpoint: '/api/export/pitch-deck',
    fileName: 'pitch-deck',
    icon: Presentation,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    format: 'pptx',
    hasData: true,
  },
  {
    id: 'passeport',
    label: 'Passeport Entrepreneurial',
    description: 'Certification de votre parcours avec attestations par module, compétences acquises et progression.',
    endpoint: '/api/export/passeport',
    fileName: 'passeport-entrepreneurial',
    icon: Stamp,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    format: 'pdf',
    method: 'print',
    hasData: true,
  },
  {
    id: 'business-plan',
    label: 'Business Plan',
    description: 'Document complet du business plan avec étude de marché, SWOT, plan financier et calendrier.',
    endpoint: '/api/export/business-plan',
    fileName: 'business-plan',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    format: 'pdf',
    method: 'print',
    hasData: true,
  },
]

// ────────────────────────────────────────────
// Animation variants
// ────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function Telechargements() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  const handleExport = useCallback(async (item: PdfExportItem) => {
    setLoadingId(item.id)
    setErrorId(null)
    setSuccessId(null)

    try {
      if (item.method === 'print') {
        // HTML-based exports: open in new tab for print
        const res = await fetch(item.endpoint, { credentials: 'include' })

        if (!res.ok) {
          const errData = res.headers.get('content-type')?.includes('json')
            ? await res.json().catch(() => null)
            : null
          const msg = errData?.error?.message || `Erreur ${res.status}`
          throw new Error(msg)
        }

        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          // JSON response — needs client-side rendering
          const html = await res.text()
          const blob = new Blob([html], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
          toast.success(`${item.label} ouvert dans un nouvel onglet. Utilisez Ctrl+P pour imprimer.`)
        } else {
          // HTML response
          const html = await res.text()
          const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
          toast.success(`${item.label} ouvert. Imprimez ou enregistrez en PDF via le navigateur.`)
        }
      } else {
        // Binary exports (PDF/PPTX)
        const res = await fetch(item.endpoint, { credentials: 'include' })

        if (!res.ok) {
          const errData = res.headers.get('content-type')?.includes('json')
            ? await res.json().catch(() => null)
            : null
          const msg = errData?.error?.message || `Erreur ${res.status}`
          throw new Error(msg)
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)

        // Download
        const a = document.createElement('a')
        a.href = url
        const ext = item.format === 'pptx' ? 'pptx' : 'pdf'
        a.download = `${item.fileName}-${new Date().toISOString().slice(0, 10)}.${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success(`${item.label} téléchargé avec succès !`)
      }

      setSuccessId(item.id)
      setTimeout(() => setSuccessId(null), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du téléchargement'
      setErrorId(item.id)
      toast.error(message)
      setTimeout(() => setErrorId(null), 5000)
    } finally {
      setLoadingId(item.id)
      // Small delay to show loading state properly
      setTimeout(() => setLoadingId(null), 500)
    }
  }, [])

  const handleDownloadAll = useCallback(async () => {
    const binaryExports = EXPORT_ITEMS.filter((item) => item.method !== 'print')

    for (const item of binaryExports) {
      try {
        const res = await fetch(item.endpoint, { credentials: 'include' })
        if (!res.ok) continue
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const ext = item.format === 'pptx' ? 'pptx' : 'pdf'
        a.download = `${item.fileName}-${new Date().toISOString().slice(0, 10)}.${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        // Stagger downloads by 500ms
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch {
        // Continue with next
      }
    }
    toast.success(`${binaryExports.length} documents téléchargés !`)
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 lg:p-8 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Centre de Téléchargements</h2>
              <p className="text-sm text-muted-foreground">
                Exportez et téléchargez vos documents de suivi en un clic
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadAll}
            variant="outline"
            className="gap-2"
            disabled={loadingId !== null}
          >
            <RefreshCw className={cn('h-4 w-4', loadingId !== null && 'animate-spin')} />
            Télécharger tout (PDF)
          </Button>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div variants={itemVariants}>
        <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10">
          <CardContent className="p-4 flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-teal-800 dark:text-teal-300">
                Documents de suivi structurés
              </p>
              <p className="text-teal-700/70 dark:text-teal-400/70 mt-0.5">
                Chaque PDF est généré à partir de vos données réelles. Les documents sont confidentiels et destinés à vous et votre conseiller GIDEF.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORT_ITEMS.map((item) => {
          const Icon = item.icon
          const isLoading = loadingId === item.id
          const isSuccess = successId === item.id
          const isError = errorId === item.id

          return (
            <motion.div key={item.id} variants={itemVariants}>
              <Card
                className={cn(
                  'transition-all duration-200 hover:shadow-md hover:border-primary/30',
                  isSuccess && 'border-green-300 dark:border-green-700',
                  isError && 'border-red-300 dark:border-red-700',
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', item.bgColor)}>
                        <Icon className={cn('h-5 w-5', item.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{item.label}</CardTitle>
                        <CardDescription className="text-xs">
                          {item.description.slice(0, 80)}{item.description.length > 80 ? '...' : ''}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] uppercase font-semibold',
                        item.format === 'pdf' && 'border-teal-300 text-teal-600 dark:border-teal-700 dark:text-teal-400',
                        item.format === 'pptx' && 'border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400',
                        item.format === 'html' && 'border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400',
                      )}
                    >
                      {item.format.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSuccess && (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Téléchargé
                        </span>
                      )}
                      {isError && (
                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Erreur
                        </span>
                      )}
                      {!isSuccess && !isError && (
                        <span className="text-xs text-muted-foreground">
                          {item.method === 'print' ? 'Ouvre dans un nouvel onglet' : 'Téléchargement direct'}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className={cn(
                        'gap-1.5 text-xs',
                        item.method === 'print'
                          ? 'bg-white dark:bg-neutral-800 text-foreground border border-border hover:bg-muted'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground',
                      )}
                      disabled={isLoading}
                      onClick={() => handleExport(item)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Génération...
                        </>
                      ) : item.method === 'print' ? (
                        <>
                          <Target className="h-3.5 w-3.5" />
                          Ouvrir & Imprimer
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Télécharger
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Footer Info */}
      <motion.div variants={itemVariants}>
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Les documents sont générés dynamiquement à partir de vos données de parcours.
          </p>
          <p className="text-xs text-muted-foreground">
            Pour tout problème, contactez votre conseiller GIDEF ou vérifiez que les modules correspondants sont complétés.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
