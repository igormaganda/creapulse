'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Radar,
  TrendingUp,
  Calculator,
  Target,
  ClipboardList,
  Download,
  Loader2,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { fadeInUp, staggerContainer, scaleIn } from './landing-shared'
import { AuthUser } from './landing-shared'

interface PdfItem {
  icon: typeof FileText
  title: string
  description: string
  details: string
  endpoint: string
  filename: string
  color: string
  gradient: string
}

const pdfItems: PdfItem[] = [
  {
    icon: ClipboardList,
    title: 'Bilan Diagnostic Complet',
    description: 'Rapport multi-sections',
    details: 'Vue d\'ensemble complète : Kiviat, RIASEC, Tremplin, financiers, motivation, plan d\'action.',
    endpoint: '/api/export/bilan-pdf',
    filename: 'bilan-diagnostic.pdf',
    color: 'text-primary',
    gradient: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/10',
  },
  {
    icon: Radar,
    title: 'Radar de Compétences',
    description: 'Profil Kiviat 8 dimensions',
    details: 'Graphique radar avec scores détaillés, interprétation et recommandations personnalisées.',
    endpoint: '/api/export/kiviat-pdf',
    filename: 'radar-kiviat.pdf',
    color: 'text-coral-500',
    gradient: 'from-coral-50 to-amber-50 dark:from-coral-900/10 dark:to-amber-900/10',
  },
  {
    icon: Target,
    title: 'Analyse Tremplin',
    description: 'Décision GO / NO GO',
    details: 'Étude en 6 étapes : motivation, finances, marché, préparation personnelle, offre.',
    endpoint: '/api/export/tremplin-pdf',
    filename: 'analyse-tremplin.pdf',
    color: 'text-green-600',
    gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10',
  },
  {
    icon: FileText,
    title: 'Rapport CréaScope',
    description: 'Session 5 phases',
    details: 'Compte-rendu de session d\'accompagnement : phases, notes, synthèses IA, plan d\'action.',
    endpoint: '/api/export/creascope-pdf',
    filename: 'rapport-creascope.pdf',
    color: 'text-violet-600',
    gradient: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10',
  },
  {
    icon: Calculator,
    title: 'Simulation CreaSim',
    description: 'Rentabilité 3 ans',
    details: 'Charges, marges, seuil de rentabilité, projections et analyse IA.',
    endpoint: '/api/export/creasim-pdf',
    filename: 'simulation-creasim.pdf',
    color: 'text-amber-600',
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10',
  },
  {
    icon: TrendingUp,
    title: 'Prévisions Financières',
    description: 'Plan financier 3 ans',
    details: 'Tableau CA/Charges/Résultat, analyse sectorielle, recommandations de financement.',
    endpoint: '/api/export/financial-pdf',
    filename: 'previsions-financieres.pdf',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/10',
  },
]

export function PdfExportsSection({ authUser }: { authUser: AuthUser }) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState<string[]>([])

  const handleDownload = async (item: PdfItem) => {
    if (!authUser) return
    setDownloading(item.endpoint)

    try {
      const res = await fetch(`${item.endpoint}?t=${Date.now()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        console.error('PDF generation failed:', res.status)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloaded((prev) => [...prev, item.endpoint])
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <section id="documents" className="py-12 md:py-16 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <FileText className="mr-1 h-3 w-3" />
            Documents & Rapports
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Générez vos{' '}
            <span className="text-gradient-teal">rapports PDF</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Exportez des documents professionnels illustrant chaque étape de votre diagnostic entrepreneurial
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {pdfItems.map((item) => {
            const isLoading = downloading === item.endpoint
            const isDone = downloaded.includes(item.endpoint)
            return (
              <motion.div key={item.endpoint} variants={scaleIn}>
                <Card className="group h-full overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        PDF
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.details}</p>
                    <Button
                      size="sm"
                      className="mt-4 w-full gap-2"
                      disabled={!authUser || isLoading}
                      onClick={() => handleDownload(item)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Génération...
                        </>
                      ) : isDone ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Télécharger à nouveau
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          {authUser ? 'Générer le PDF' : 'Connectez-vous'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {!authUser && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-8 rounded-xl border bg-background p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              <Zap className="mr-1 inline h-4 w-4 text-primary" />
              Connectez-vous pour générer et télécharger vos rapports personnalisés.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
