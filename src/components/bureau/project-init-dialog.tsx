'use client'

// ============================================
// CreaPulse V2 — Project Init Dialog
// Shown when user selects a dispositif/enrollment with no project data yet.
// Options: start fresh (new) or import/clone from another enrollment.
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Rocket,
  Copy,
  FolderPlus,
  Briefcase,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useDispositifStore,
  type AvailableProject,
  type DispositifInfo,
} from '@/lib/stores/dispositif-store'

// ─── Types ───────────────────────────────────

type InitMode = 'new' | 'import' | null

interface ProjectInitDialogProps {
  /** Optional enrollment info for display. Falls back to store data. */
  enrollment?: DispositifInfo
}

// ─── Icon renderer (same pattern as selector, no component variables) ───

function renderDispositifIcon(name: string, color: string, className: string) {
  switch (name) {
    case 'Search': return <Search className={className} style={{ color }} />
    case 'Rocket': return <Rocket className={className} style={{ color }} />
    default:      return <Briefcase className={className} style={{ color }} />
  }
}

// ─── Component ────────────────────────────────

export function ProjectInitDialog({ enrollment: enrollmentProp }: ProjectInitDialogProps) {
  const {
    initDialogOpen,
    initDialogEnrollmentId,
    enrollments,
    setInitDialogOpen,
    initProject,
  } = useDispositifStore()

  const activeEnrollment = enrollmentProp
    ?? enrollments.find((e) => e.id === initDialogEnrollmentId)

  // Local state
  const [selectedMode, setSelectedMode] = useState<InitMode>(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const enrollmentId = initDialogEnrollmentId ?? activeEnrollment?.id

  // Fetch available projects for import when dialog opens
  const fetchAvailableProjects = useCallback(async () => {
    if (!enrollmentId) return
    setIsLoadingProjects(true)
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/init-project`, {
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.availableProjects) {
          setAvailableProjects(json.data.availableProjects)
        }
      }
    } catch {
      // Silently fail — import option just won't show
    } finally {
      setIsLoadingProjects(false)
    }
  }, [enrollmentId])

  useEffect(() => {
    if (initDialogOpen && enrollmentId) {
      fetchAvailableProjects()
    } else {
      // Reset state on close
      setSelectedMode(null)
      setProjectTitle('')
      setSelectedSourceId(null)
      setAvailableProjects([])
    }
  }, [initDialogOpen, enrollmentId, fetchAvailableProjects])

  // ─── Submit handler ───

  const handleSubmit = async () => {
    if (!selectedMode || !enrollmentId) return

    setIsSubmitting(true)
    let mode: 'new' | 'import' | 'legacy' = selectedMode

    // If source is the legacy (null enrollmentId) project, use 'legacy' mode
    if (selectedMode === 'import' && selectedSourceId === '__legacy__') {
      mode = 'legacy'
    }

    const result = await initProject(
      enrollmentId,
      mode,
      selectedSourceId === '__legacy__' ? null : selectedSourceId,
      projectTitle || undefined,
    )

    setIsSubmitting(false)

    if (result.success) {
      toast.success(result.message || 'Projet initialisé avec succès')
    } else {
      toast.error(result.message || 'Erreur lors de l\'initialisation')
    }
  }

  // ─── Determine if submit is disabled ───
  const canSubmit =
    selectedMode === 'new' ||
    (selectedMode === 'import' && selectedSourceId !== null)

  const hasAvailableProjects = availableProjects.length > 0

  return (
    <Dialog
      open={initDialogOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          setInitDialogOpen(false)
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[520px] p-0 overflow-hidden"
        showCloseButton={!isSubmitting}
      >
        {/* Header with teal gradient accent */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Initialiser votre projet
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1.5">
              {activeEnrollment
                ? `Commencez votre parcours « ${activeEnrollment.name} » en créant ou important un projet.`
                : 'Commencez votre parcours en créant ou important un projet.'}
            </DialogDescription>
          </DialogHeader>

          {/* Dispositif badge */}
          {activeEnrollment && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: activeEnrollment.color }}
              />
              <span style={{ color: activeEnrollment.color }}>
                {activeEnrollment.name}
              </span>
              {activeEnrollment.projectTitle && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {activeEnrollment.projectTitle}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mode selection */}
        <AnimatePresence mode="wait">
          {selectedMode === null ? (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6 space-y-3"
            >
              {/* Option 1: New project */}
              <Card
                className="cursor-pointer border-dashed border-2 hover:border-teal-500/50 hover:bg-teal-500/[0.03] transition-all duration-200 group py-4"
                onClick={() => setSelectedMode('new')}
              >
                <CardContent className="flex items-center gap-4 p-0 px-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                    <Rocket className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Nouveau projet
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Commencer à zéro avec un projet vide
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </CardContent>
              </Card>

              {/* Option 2: Import project */}
              <Card
                className={cn(
                  'cursor-pointer border-dashed border-2 transition-all duration-200 group py-4',
                  isLoadingProjects
                    ? 'opacity-60 pointer-events-none'
                    : !hasAvailableProjects && !isLoadingProjects
                      ? 'opacity-40 pointer-events-none'
                      : 'hover:border-teal-500/50 hover:bg-teal-500/[0.03]',
                )}
                onClick={() => {
                  if (hasAvailableProjects) setSelectedMode('import')
                }}
              >
                <CardContent className="flex items-center gap-4 p-0 px-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                    <Copy className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Importer un projet existant
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isLoadingProjects
                        ? 'Chargement des projets disponibles…'
                        : hasAvailableProjects
                          ? `${availableProjects.length} projet(s) disponible(s) pour import`
                          : 'Aucun projet existant à importer'}
                    </p>
                  </div>
                  {isLoadingProjects ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  ) : hasAvailableProjects ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="mode-detail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-6 pb-6"
            >
              {/* Back button */}
              <button
                type="button"
                className="mb-4 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setSelectedMode(null)
                  setSelectedSourceId(null)
                }}
              >
                ← Retour aux options
              </button>

              {/* ── New Project Form ── */}
              {selectedMode === 'new' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                      <Rocket className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Nouveau projet</p>
                      <p className="text-xs text-muted-foreground">
                        Un projet vide sera créé pour ce dispositif
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="project-title"
                      className="text-sm font-medium text-foreground"
                    >
                      Nom du projet <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <Input
                      id="project-title"
                      placeholder="Mon projet entrepreneurial…"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      maxLength={200}
                      disabled={isSubmitting}
                      className="border-border/60 focus:border-teal-500/50"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Vous pourrez le modifier plus tard
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FolderPlus className="h-4 w-4" />
                      )}
                      {isSubmitting ? 'Création…' : 'Créer le projet'}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Import Project Form ── */}
              {selectedMode === 'import' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                      <Copy className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Importer un projet</p>
                      <p className="text-xs text-muted-foreground">
                        Sélectionnez un projet existant à cloner
                      </p>
                    </div>
                  </div>

                  {/* Optional project title for import */}
                  <div className="space-y-2">
                    <label
                      htmlFor="import-project-title"
                      className="text-sm font-medium text-foreground"
                    >
                      Nom du projet <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <Input
                      id="import-project-title"
                      placeholder="Mon projet entrepreneurial…"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      maxLength={200}
                      disabled={isSubmitting}
                      className="border-border/60 focus:border-teal-500/50"
                    />
                  </div>

                  {/* Available projects list */}
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {availableProjects.map((project) => {
                      const isLegacy = project.enrollmentId === null
                      const isSelected = isLegacy
                        ? selectedSourceId === '__legacy__'
                        : selectedSourceId === project.enrollmentId

                      return (
                        <Card
                          key={isLegacy ? '__legacy__' : project.enrollmentId}
                          className={cn(
                            'cursor-pointer transition-all duration-150 py-3',
                            isSelected
                              ? 'border-teal-500 bg-teal-500/[0.06]'
                              : 'border-border/60 hover:border-teal-500/30 hover:bg-muted/50',
                          )}
                          onClick={() =>
                            setSelectedSourceId(
                              isLegacy ? '__legacy__' : project.enrollmentId,
                            )
                          }
                        >
                          <CardContent className="flex items-center gap-3 p-0 px-4">
                            {/* Icon */}
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: project.dispositifColor + '18' }}
                            >
                              {renderDispositifIcon(
                                project.dispositifIcon,
                                project.dispositifColor,
                                'h-4 w-4',
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {project.dispositifName}
                                </p>
                                {isLegacy && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 h-4 font-normal"
                                  >
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {project.projectTitle || 'Sans titre'}
                              </p>
                            </div>

                            {/* Check indicator */}
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}

                    {isLoadingProjects && (
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit || isSubmitting}
                      className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {isSubmitting ? 'Import en cours…' : 'Importer le projet'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}