'use client'

// ============================================
// CreaPulse V2 — Project Init Dialog
// Shown when a user switches to an enrollment
// that has no project data yet.
// Offers: New project / Import from legacy / Import from another enrollment
// ============================================

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import {
  Sparkles, Copy, FolderPlus, Check, AlertCircle,
  Briefcase, Search, Rocket, Loader2, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDispositifStore, type DispositifInfo } from '@/lib/stores/dispositif-store'
import { useAuthStore } from '@/lib/zustand/store'

// ─── Types ───────────────────────────────────

interface AvailableProject {
  enrollmentId: string | null
  dispositifCode: string
  dispositifName: string
  dispositifColor: string
  dispositifIcon: string
  projectTitle: string | null
  hasData: boolean
}

interface ProjectInitDialogProps {
  enrollmentId: string | null
  dispositifInfo: DispositifInfo | null
}

// ─── Icon helper ─────────────────────────────

function renderIcon(name: string, color: string, className: string) {
  switch (name) {
    case 'Search': return <Search className={className} style={{ color }} />
    case 'Rocket': return <Rocket className={className} style={{ color }} />
    default:      return <Briefcase className={className} style={{ color }} />
  }
}

// ─── Component ───────────────────────────────

export function ProjectInitDialog({ enrollmentId, dispositifInfo }: ProjectInitDialogProps) {
  const { markProjectInitialized, clearInitPending, enrollments } = useDispositifStore()
  const token = useAuthStore((s) => s.token)

  const [mode, setMode] = useState<'new' | 'import' | 'legacy'>('new')
  const [projectTitle, setProjectTitle] = useState('')
  const [sourceEnrollmentId, setSourceEnrollmentId] = useState<string>('')
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOpen = !!enrollmentId
  const dispositifName = dispositifInfo?.name ?? 'ce dispositif'

  // Fetch available projects when dialog opens in import mode
  const fetchAvailableProjects = useCallback(async () => {
    if (!enrollmentId || !token) return

    setIsLoadingProjects(true)
    try {
      const res = await fetch(
        `/api/enrollments/${enrollmentId}/init-project`,
        {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      )
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.availableProjects) {
          setAvailableProjects(json.data.availableProjects)
          // Auto-select first source if importing
          if (json.data.availableProjects.length > 0) {
            const first = json.data.availableProjects[0]
            setSourceEnrollmentId(first.enrollmentId ?? 'legacy')
          }
        }
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoadingProjects(false)
    }
  }, [enrollmentId, token])

  useEffect(() => {
    if (isOpen && enrollmentId) {
      setMode('new')
      setProjectTitle(dispositifInfo?.name ?? '')
      setSourceEnrollmentId('')
      fetchAvailableProjects()
    }
  }, [isOpen, enrollmentId, dispositifInfo?.name, fetchAvailableProjects])

  // Handle submission
  const handleSubmit = async () => {
    if (!enrollmentId || !token) return

    setIsSubmitting(true)
    try {
      const body: Record<string, string> = { mode }
      if (mode === 'new') {
        if (!projectTitle.trim()) {
          toast.error('Veuillez saisir un nom de projet.')
          setIsSubmitting(false)
          return
        }
        body.projectTitle = projectTitle.trim()
      } else if (mode === 'import') {
        if (!sourceEnrollmentId) {
          toast.error('Veuillez sélectionner un projet source.')
          setIsSubmitting(false)
          return
        }
        body.sourceEnrollmentId = sourceEnrollmentId
      }
      // mode === 'legacy' needs no extra params

      const res = await fetch(
        `/api/enrollments/${enrollmentId}/init-project`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        },
      )

      const json = await res.json()

      if (res.ok && json.success) {
        const cloned = json.data?.cloned ?? 0
        if (mode === 'new') {
          toast.success('Nouveau projet créé !', {
            description: `"${projectTitle}" est prêt pour ${dispositifName}.`,
          })
        } else {
          toast.success('Projet importé !', {
            description: `${cloned} élément(s) importé(s) dans ${dispositifName}.`,
          })
        }
        markProjectInitialized(enrollmentId, true)
      } else {
        toast.error(json.message || 'Erreur lors de l\'initialisation.')
      }
    } catch {
      toast.error('Erreur réseau. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel — go back to previous dispositif
  const handleCancel = () => {
    clearInitPending()
    // Don't close dialog via state — parent controls visibility
  }

  // Don't render if no enrollment specified
  if (!isOpen || !enrollmentId) return null

  const hasLegacyData = availableProjects.some((p) => p.enrollmentId === null)
  const otherEnrollments = availableProjects.filter((p) => p.enrollmentId !== null)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: (dispositifInfo?.color ?? '#6366f1') + '20' }}
              >
                {renderIcon(dispositifInfo?.icon ?? 'Briefcase', dispositifInfo?.color ?? '#6366f1', 'h-5 w-5')}
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Initialiser le projet
                </DialogTitle>
                <DialogDescription className="text-sm">
                  pour {dispositifName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mt-3">
            Ce dispositif n'a pas encore de données de projet. Comment souhaitez-vous procéder ?
          </p>
        </div>

        <Separator />

        {/* Mode selection */}
        <div className="px-6 py-4">
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as typeof mode)}
            className="space-y-3"
          >
            {/* Option 1: New project */}
            <label
              htmlFor="mode-new"
              className={cn(
                'flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all',
                mode === 'new' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50',
              )}
            >
              <RadioGroupItem value="new" id="mode-new" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold">Nouveau projet</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Commencer avec un projet vierge. Vous pourrez le remplir progressivement.
                </p>
                {mode === 'new' && (
                  <div className="mt-3 ml-6">
                    <Label htmlFor="project-title" className="text-xs text-muted-foreground">
                      Nom du projet
                    </Label>
                    <Input
                      id="project-title"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="Mon projet de création..."
                      className="mt-1 h-9 text-sm"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </label>

            {/* Option 2: Import from legacy (null enrollmentId) */}
            {hasLegacyData && (
              <label
                htmlFor="mode-legacy"
                className={cn(
                  'flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all',
                  mode === 'legacy' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50',
                )}
              >
                <RadioGroupItem value="legacy" id="mode-legacy" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FolderPlus className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-semibold">Importer mon projet principal</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Récupérer les données de votre projet existant (BMC, prévisionnel, analyse de marché...).
                  </p>
                </div>
              </label>
            )}

            {/* Option 3: Import from another enrollment */}
            {otherEnrollments.length > 0 && (
              <label
                htmlFor="mode-import"
                className={cn(
                  'flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all',
                  mode === 'import' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50',
                )}
              >
                <RadioGroupItem value="import" id="mode-import" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold">Cloner depuis un autre dispositif</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copier les données d'un projet déjà initié dans un autre parcours.
                  </p>
                  {mode === 'import' && (
                    <ScrollArea className="mt-3 ml-6 max-h-40">
                      <div className="space-y-2 pr-2">
                        {isLoadingProjects ? (
                          <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                        ) : (
                          otherEnrollments.map((project) => (
                            <button
                              key={project.enrollmentId}
                              type="button"
                              className={cn(
                                'flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-all',
                                sourceEnrollmentId === project.enrollmentId
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/30',
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSourceEnrollmentId(project.enrollmentId!)
                              }}
                            >
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: project.dispositifColor + '18' }}
                              >
                                {renderIcon(project.dispositifIcon, project.dispositifColor, 'h-4 w-4')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {project.projectTitle || project.dispositifName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {project.dispositifName}
                                </p>
                              </div>
                              {sourceEnrollmentId === project.enrollmentId && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </label>
            )}
          </RadioGroup>
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="px-6 py-4 flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initialisation...
              </>
            ) : (
              <>
                {mode === 'new' ? (
                  <><Sparkles className="h-4 w-4 mr-2" /> Créer</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Importer</>
                )}
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}