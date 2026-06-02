'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Radar,
  TrendingUp,
  BarChart3,
  LayoutGrid,
  Download,
  FileDown,
  BookOpen,
} from 'lucide-react'
import { fadeInUp, staggerContainer, scaleIn } from './landing-shared'

/* ─── Types ─── */
type LucideIcon = typeof FileText

interface DemoPDF {
  type: string
  title: string
  description: string
  icon: LucideIcon
  format: 'PDF' | 'HTML'
  featured?: boolean
}

/* ─── Data ─── */
const DEMO_PDFS: DemoPDF[] = [
  {
    type: 'suivi-parcours',
    title: 'Suivi de Parcours Complet',
    description:
      "Bilan global du parcours créateur : profil, Kiviat, RIASEC, modules, Tremplin, et recommandations.",
    icon: FileText,
    format: 'PDF',
  },
  {
    type: 'suivi-kiviat',
    title: 'Compétences Kiviat',
    description:
      "Analyse radar des 8 dimensions entrepreneuriales avec scores, points forts et axes d'amélioration.",
    icon: Radar,
    format: 'PDF',
  },
  {
    type: 'suivi-tremplin',
    title: 'Évaluation Tremplin',
    description:
      'Bilan de préparation au lancement avec décision GO/NO_GO, étapes détaillées et recommandations.',
    icon: TrendingUp,
    format: 'PDF',
  },
  {
    type: 'suivi-creasim',
    title: 'Simulation Financière',
    description:
      'Prévisionnel financier CreaSim : CA, charges, marges, projection 3 ans et seuil de rentabilité.',
    icon: BarChart3,
    format: 'PDF',
  },
  {
    type: 'bmc',
    title: 'Business Model Canvas',
    description:
      'Canvas stratégique 9 blocs avec partenaires, activités, proposition de valeur et revenus.',
    icon: LayoutGrid,
    format: 'HTML',
  },
  {
    type: 'business-plan',
    title: 'Business Plan Complet',
    description:
      'Document complet de 22 parties : résumé, équipe, étude de marché, stratégie, finances, SWOT, rétroplanning.',
    icon: BookOpen,
    format: 'PDF',
    featured: true,
  },
]

/* ─── Component ─── */
export function PDFShowcaseSection() {
  return (
    <section id="documents" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <FileDown className="mr-1 h-3 w-3" />
            Export &amp; Documents
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Documents de Suivi —{' '}
            <span className="text-gradient-teal">Aperçu</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Découvrez les documents structurés générés par CreaPulse pour suivre
            le parcours entrepreneurial.
          </p>
        </motion.div>

        {/* ── Cards Grid ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* ── Featured: Business Plan Complet ── */}
          <motion.div variants={scaleIn} className="sm:col-span-2">
            <Card className="group flex h-full flex-col overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-[10px] uppercase tracking-wider">PDF</Badge>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 text-[10px] uppercase tracking-wider">22 parties</Badge>
                  </div>
                </div>
                <CardTitle className="mt-3 text-xl">Business Plan Complet</CardTitle>
                <CardDescription className="leading-relaxed">
                  Document intégral de 22 parties : résumé opérationnel, équipe fondatrice, étude de marché,
                  segmentation clientèle, concurrence, stratégie marketing, plan commercial, politique de prix,
                  plan de financement, compte de résultat prévisionnel, trésorerie, seuil de rentabilité,
                  investissements, analyse SWOT, statut juridique, organisation, communication et rétroplanning.
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-0">
                <Button asChild size="sm" className="w-full gap-2">
                  <a href="/api/export/demo/business-plan" target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Télécharger le Business Plan Complet
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* ── Other demo PDFs ── */}
          {DEMO_PDFS.map((pdf) => (
            <motion.div key={pdf.type} variants={scaleIn}>
              <Card className="group flex h-full flex-col overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* ── Card Header ── */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <pdf.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge
                      variant={pdf.format === 'HTML' ? 'outline' : 'default'}
                      className="text-[10px] uppercase tracking-wider"
                    >
                      {pdf.format}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-lg">{pdf.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {pdf.description}
                  </CardDescription>
                </CardHeader>

                {/* ── Card Footer with Download Button ── */}
                <CardFooter className="mt-auto pt-0">
                  <Button asChild size="sm" className="w-full gap-2">
                    <a href={`/api/export/demo/${pdf.type}`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Télécharger {pdf.format}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
