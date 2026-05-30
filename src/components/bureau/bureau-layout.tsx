'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useBureauStore } from './bureau-store'
import { Sidebar, MobileSidebar } from './sidebar'
import { TopBar } from './topbar'
import { Dashboard } from './dashboard'
import { Welcome } from './welcome'
import { ErrorBoundary } from './error-boundary'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/* ─── Dynamic imports for heavy modules (code splitting) ─── */
function ModuleLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="space-y-4 w-full max-w-md">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        <div className="h-32 bg-muted animate-pulse rounded mt-6" />
      </div>
    </div>
  )
}

const RiasecModule = dynamic(() => import('./modules/riasec').then(m => ({ default: m.RiasecModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const MonProjet = dynamic(() => import('./modules/mon-projet').then(m => ({ default: m.MonProjet })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const CreaSim = dynamic(() => import('./modules/creasim').then(m => ({ default: m.CreaSim })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const BusinessPlanModule = dynamic(() => import('./modules/business-plan').then(m => ({ default: m.BusinessPlanModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const AnnuaireModule = dynamic(() => import('./modules/annuaire').then(m => ({ default: m.AnnuaireModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const ForumModule = dynamic(() => import('./modules/forum').then(m => ({ default: m.ForumModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const MarcheModule = dynamic(() => import('./modules/marche').then(m => ({ default: m.MarcheModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const JuridiqueModule = dynamic(() => import('./modules/juridique').then(m => ({ default: m.JuridiqueModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const FinancierModule = dynamic(() => import('./modules/financier').then(m => ({ default: m.FinancierModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const PitchDeckModule = dynamic(() => import('./modules/pitch-deck').then(m => ({ default: m.PitchDeckModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const ProfilCreateur = dynamic(() => import('./modules/profil-createur').then(m => ({ default: m.ProfilCreateur })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const KiviatModule = dynamic(() => import('./modules/kiviat').then(m => ({ default: m.KiviatModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const VisionModule = dynamic(() => import('./modules/vision').then(m => ({ default: m.VisionModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const Tremplin = dynamic(() => import('./modules/tremplin').then(m => ({ default: m.Tremplin })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const Passeport = dynamic(() => import('./modules/passeport').then(m => ({ default: m.Passeport })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const Mentorat = dynamic(() => import('./modules/mentorat').then(m => ({ default: m.Mentorat })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const Certifications = dynamic(() => import('./modules/certifications').then(m => ({ default: m.Certifications })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const Telechargements = dynamic(() => import('./modules/telechargements').then(m => ({ default: m.Telechargements })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const BilanIA = dynamic(() => import('./modules/bilan-ia').then(m => ({ default: m.BilanIA })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const MessagesModule = dynamic(() => import('./modules/messages').then(m => ({ default: m.MessagesModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const BmcModule = dynamic(() => import('./modules/bmc').then(m => ({ default: m.BusinessModelCanvasModule })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const PepitesGame = dynamic(() => import('./modules/pepites-game').then(m => ({ default: m.PepitesGame })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  Lightbulb,
  Eye,
  FlaskConical,
  Pentagon,
  Brain,
  Target,
  Scale,
  Calculator,
  TrendingUp,
  FileText,
  Presentation,
  Globe,
  MessageSquare,
  MessageCircle,
  GraduationCap,
  Rocket,
  Stamp,
  BadgeCheck,
  ArrowRight,
  Construction,
  LayoutGrid,
  Download,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ─── Module placeholder content map ─── */
const moduleContent: Record<string, { title: string; description: string; icon: LucideIcon; color: string }> = {
  'profil-createur': { title: 'Profil Créateur', description: 'Définissez votre profil entrepreneurial pour un accompagnement personnalisé.', icon: User, color: 'text-primary bg-primary/10' },
  'mon-projet': { title: 'Mon Projet', description: 'Décrivez votre projet de création d\'entreprise étape par étape.', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  'vision': { title: 'Vision', description: 'Structurez votre vision à long terme et vos objectifs stratégiques.', icon: Eye, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' },
  'riasec': { title: 'Test RIASEC', description: 'Découvrez votre profil entrepreneurial grâce au test RIASEC.', icon: FlaskConical, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' },
  'kiviat': { title: 'Test Kiviat', description: 'Évaluez vos compétences clés avec le radar Kiviat.', icon: Pentagon, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' },
  'bilan-ia': { title: 'Bilan IA', description: 'Synthèse intelligente de votre parcours entrepreneurial grâce à l\'IA.', icon: Brain, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' },
  'pepites': { title: 'Pépites Game', description: 'Identifiez vos compétences entrepreneuriales à travers 4 modes de jeu interactifs.', icon: Zap, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
  'bmc': { title: 'Business Model Canvas', description: 'Construisez votre modèle d\'affaires avec le canevas BMC interactif.', icon: LayoutGrid, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' },
  'marche': { title: 'Analyse de Marché', description: 'Étudiez votre marché cible, concurrents et positionnement.', icon: Globe, color: 'text-primary bg-primary/10' },
  'juridique': { title: 'Analyse Juridique', description: 'Choisissez le statut juridique adapté à votre projet.', icon: Scale, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  'financier': { title: 'Plan Financier', description: 'Structurez votre plan financier prévisionnel.', icon: Calculator, color: 'text-coral-500 bg-coral-50 dark:bg-coral-900/20' },
  'creasim': { title: 'CreaSim', description: 'Simulateur financier interactif pour estimer votre rentabilité.', icon: TrendingUp, color: 'text-primary bg-primary/10' },
  'business-plan': { title: 'Business Plan', description: 'Rédigez votre business plan avec l\'assistance de l\'IA.', icon: FileText, color: 'text-coral-500 bg-coral-50 dark:bg-coral-900/20' },
  'pitch-deck': { title: 'Pitch Deck', description: 'Créez votre présentation pour convaincre investisseurs et partenaires.', icon: Presentation, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30' },
  'annuaire': { title: 'Annuaire', description: 'Explorez le réseau GIDEF et les acteurs de l\'écosystème entrepreneurial.', icon: Globe, color: 'text-primary bg-primary/10' },
  'forum': { title: 'Forum', description: 'Échangez avec d\'autres créateurs d\'entreprise.', icon: MessageSquare, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  'mentorat': { title: 'Mentorat', description: 'Trouvez un mentor pour vous accompagner dans votre parcours.', icon: GraduationCap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  'tremplin': { title: 'Tremplin', description: 'Accédez aux dispositifs d\'aide pour lancer votre activité.', icon: Rocket, color: 'text-primary bg-primary/10' },
  'passeport': { title: 'Passeport Entrepreneurial', description: 'Certifiez votre parcours et valorisez vos compétences.', icon: Stamp, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  'certifications': { title: 'Certifications', description: 'Consultez et gérez vos certifications obtenues.', icon: BadgeCheck, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  'telechargements': { title: 'Téléchargements', description: 'Téléchargez tous vos documents de suivi et PDF structurés.', icon: Download, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' },
  'messages': { title: 'Messages', description: 'Communiquez avec votre conseiller et les autres créateurs.', icon: MessageCircle, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
}

/* ─── Section placeholder content ─── */
const sectionContent: Record<string, { title: string; description: string }> = {
  parcours: { title: 'Parcours', description: 'Explorez les étapes de votre parcours entrepreneurial.' },
  strategie: { title: 'Stratégie', description: 'Construisez votre stratégie de création d\'entreprise.' },
  ecosysteme: { title: 'Écosystème', description: 'Découvrez le réseau et les ressources disponibles.' },
  pilotage: { title: 'Pilotage', description: 'Suivez vos progrès et certifiez votre parcours.' },
}

/* ─── Placeholder module view ─── */
function ModulePlaceholder({ moduleId }: { moduleId: string }) {
  const content = moduleContent[moduleId]
  if (!content) return null
  const Icon = content.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
    >
      <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl', content.color)}>
        <Icon className="h-10 w-10" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-foreground">{content.title}</h2>
      <p className="mt-2 max-w-md text-center text-muted-foreground">{content.description}</p>
      <div className="mt-8 flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
        <Construction className="h-4 w-4" />
        Module en cours de développement
      </div>
    </motion.div>
  )
}

/* ─── Section overview (when no module selected) ─── */
function SectionOverview({ sectionId }: { sectionId: string }) {
  const { setSection, setModule } = useBureauStore()
  const content = sectionContent[sectionId]
  if (!content) return null

  // Get modules for this section
  const modules = Object.entries(moduleContent).filter(([, v]) => {
    const sectionMap: Record<string, string[]> = {
      parcours: ['profil-createur', 'mon-projet', 'vision', 'pepites', 'riasec', 'kiviat', 'bilan-ia'],
      strategie: ['marche', 'juridique', 'financier', 'creasim', 'bmc', 'business-plan', 'pitch-deck'],
      ecosysteme: ['annuaire', 'forum', 'messages', 'mentorat'],
      pilotage: ['tremplin', 'passeport', 'certifications', 'telechargements'],
    }
    return sectionMap[sectionId]?.includes(Object.keys(moduleContent).find(k => moduleContent[k] === v) || '')
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">{content.title}</h2>
        <p className="mt-1 text-muted-foreground">{content.description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(([moduleId, mod]) => {
          const Icon = mod.icon
          return (
            <motion.div
              key={moduleId}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                onClick={() => setModule(moduleId)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', mod.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{mod.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ─── Main content router ─── */
function BureauContent() {
  const { currentSection, currentModule } = useBureauStore()
  const contentKey = `${currentSection}-${currentModule || ''}`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contentKey}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.2 }}
      >
        {currentSection === 'dashboard' && <Dashboard />}
        {currentModule === 'riasec' && <RiasecModule />}
        {currentModule === 'mon-projet' && <MonProjet />}
        {currentModule === 'creasim' && <CreaSim />}
        {currentModule === 'business-plan' && <BusinessPlanModule />}
        {currentModule === 'annuaire' && <AnnuaireModule />}
        {currentModule === 'forum' && <ForumModule />}
        {currentModule === 'marche' && <MarcheModule />}
        {currentModule === 'juridique' && <JuridiqueModule />}
        {currentModule === 'financier' && <FinancierModule />}
        {currentModule === 'pitch-deck' && <PitchDeckModule />}
        {currentModule === 'profil-createur' && <ProfilCreateur />}
        {currentModule === 'kiviat' && <KiviatModule />}
        {currentModule === 'bilan-ia' && <BilanIA />}
        {currentModule === 'bmc' && <BmcModule />}
        {currentModule === 'pepites' && <PepitesGame />}
        {currentModule === 'vision' && <VisionModule />}
        {currentModule === 'tremplin' && <Tremplin />}
        {currentModule === 'passeport' && <Passeport />}
        {currentModule === 'mentorat' && <Mentorat />}
        {currentModule === 'certifications' && <Certifications />}
        {currentModule === 'telechargements' && <Telechargements />}
        {currentModule === 'messages' && <MessagesModule />}
        {currentSection !== 'dashboard' && currentModule && currentModule !== 'riasec' && currentModule !== 'mon-projet' && currentModule !== 'creasim' && currentModule !== 'business-plan' && currentModule !== 'annuaire' && currentModule !== 'forum' && currentModule !== 'marche' && currentModule !== 'juridique' && currentModule !== 'financier' && currentModule !== 'pitch-deck' && currentModule !== 'profil-createur' && currentModule !== 'kiviat' && currentModule !== 'vision' && currentModule !== 'tremplin' && currentModule !== 'passeport' && currentModule !== 'mentorat' && currentModule !== 'certifications' && currentModule !== 'messages' && currentModule !== 'bilan-ia' && currentModule !== 'bmc' && currentModule !== 'telechargements' && currentModule !== 'pepites' && <ModulePlaceholder moduleId={currentModule} />}
        {currentSection !== 'dashboard' && !currentModule && <SectionOverview sectionId={currentSection} />}
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Bureau Layout ─── */
export function BureauLayout() {
  const { isBureauOpen, hasCompletedOnboarding, setSidebarOpen } = useBureauStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /* Lock body scroll when bureau is open */
  useEffect(() => {
    if (isBureauOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isBureauOpen])

  return (
    <AnimatePresence>
      {isBureauOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex"
        >
          {/* Background backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={useBureauStore.getState().closeBureau}
          />

          {/* Bureau container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-screen w-screen flex-col overflow-hidden rounded-none md:my-3 md:mr-3 md:rounded-2xl border border-border bg-background shadow-2xl"
          >
            {/* Onboarding check */}
            {!hasCompletedOnboarding ? (
              <Welcome />
            ) : (
              <>
                {/* Top Bar */}
                <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

                {/* Body: Sidebar + Content */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Desktop Sidebar */}
                  <Sidebar />

                  {/* Main content */}
                  <main className="flex-1 overflow-y-auto scrollbar-thin bg-muted/30">
                    <ErrorBoundary>
                      <BureauContent />
                    </ErrorBoundary>
                  </main>
                </div>
              </>
            )}
          </motion.div>

          {/* Mobile Sidebar */}
          <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
