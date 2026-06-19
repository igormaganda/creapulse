'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useBureauStore } from './bureau-store'
import { useModuleConfigStore } from '@/lib/stores/module-config-store'
import { MODULE_REGISTRY, SECTION_META, SECTION_LABELS, MODULE_LABELS, getModulesBySection } from '@/lib/module-registry'
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
const CreascopePipeline = dynamic(() => import('./modules/creascope-pipeline').then(m => ({ default: m.CreascopePipeline })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const PrivacyDashboard = dynamic(() => import('./modules/privacy-dashboard').then(m => ({ default: m.PrivacyDashboard })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })
const PipelineV3Overview = dynamic(() => import('./modules/pipeline-v3-overview').then(m => ({ default: m.PipelineV3Overview })), { loading: () => <ModuleLoadingSkeleton />, ssr: false })

/* ─── UI imports (used by SectionOverview and ModulePlaceholder) ─── */
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Construction } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ─── Module placeholder content map (derived from MODULE_REGISTRY) ─── */
const moduleContent: Record<string, { title: string; description: string; icon: LucideIcon; color: string }> = Object.fromEntries(
  MODULE_REGISTRY.map((m) => [
    m.code,
    { title: m.label, description: m.description, icon: m.icon, color: m.color },
  ])
)

/* ─── Section placeholder content (derived from SECTION_META) ─── */
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

/* ─── Section overview (when no module selected, filtered by active modules) ─── */
function SectionOverview({ sectionId }: { sectionId: string }) {
  const { setSection, setModule } = useBureauStore()
  const { isModuleActive } = useModuleConfigStore()
  const content = sectionContent[sectionId]
  if (!content) return null

  // Get active modules for this section from registry
  const modules = getModulesBySection(sectionId).filter((code) => isModuleActive(code))

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
        {modules.map((code) => {
          const def = MODULE_REGISTRY.find((m) => m.code === code)
          if (!def) return null
          const Icon = def.icon
          return (
            <motion.div
              key={code}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30"
                onClick={() => setModule(code)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', def.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{def.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{def.description}</p>
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

/* ─── Module/Section label maps are now imported from module-registry ─── */
// Use MODULE_LABELS and SECTION_LABELS from @/lib/module-registry

/* ─── Main content router ─── */
function BureauContent() {
  const { currentSection, currentModule } = useBureauStore()
  const contentKey = `${currentSection}-${currentModule || ''}`

  const { isModuleActive, fetchActiveModules, loaded: modulesLoaded } = useModuleConfigStore()

  // Fetch active modules on mount
  useEffect(() => {
    fetchActiveModules()
  }, [fetchActiveModules])

  /* Announce module changes to screen readers via aria-live region */
  useEffect(() => {
    const liveRegion = document.getElementById('status-live-region')
    if (liveRegion) {
      if (currentModule) {
        const label = MODULE_LABELS[currentModule] || currentModule
        liveRegion.textContent = `Module "${label}" chargé.`
      } else if (currentSection !== 'dashboard') {
        const label = SECTION_LABELS[currentSection] || currentSection
        liveRegion.textContent = `Section "${label}" affichée.`
      }
    }
  }, [currentSection, currentModule])

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
        {/* Module rendering — filtered by active module config */}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'riasec' && <RiasecModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'mon-projet' && <MonProjet />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'creasim' && <CreaSim />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'business-plan' && <BusinessPlanModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'annuaire' && <AnnuaireModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'forum' && <ForumModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'marche' && <MarcheModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'juridique' && <JuridiqueModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'financier' && <FinancierModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'pitch-deck' && <PitchDeckModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'profil-createur' && <ProfilCreateur />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'kiviat' && <KiviatModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'bilan-ia' && <BilanIA />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'bmc' && <BmcModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'pepites' && <PepitesGame />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'creascope' && <CreascopePipeline />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'vision' && <VisionModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'tremplin' && <Tremplin />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'passeport' && <Passeport />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'mentorat' && <Mentorat />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'certifications' && <Certifications />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'telechargements' && <Telechargements />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'messages' && <MessagesModule />}
        {modulesLoaded && currentModule && isModuleActive(currentModule) && currentModule === 'vie-privee' && <PrivacyDashboard />}
        {/* Module is disabled — show placeholder */}
        {modulesLoaded && currentModule && !isModuleActive(currentModule) && <ModulePlaceholder moduleId={currentModule} />}
        {currentSection === 'strategie' && !currentModule && <PipelineV3Overview />}
        {currentSection !== 'dashboard' && currentSection !== 'strategie' && !currentModule && <SectionOverview sectionId={currentSection} />}
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
                  <main id="bureau-main-content" tabIndex={-1} className="flex-1 overflow-y-auto scrollbar-thin bg-muted/30" aria-label="Contenu du module">
                    <div id="status-live-region" className="sr-only" aria-live="polite" aria-atomic="true" />
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

          {/* IA Assistant FAB + Chat Panel — rendered at page.tsx root, not here */}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
