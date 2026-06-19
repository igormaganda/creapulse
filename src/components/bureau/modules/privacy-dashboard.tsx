'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Download,
  Trash2,
  Check,
  X,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Database,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

/* ─── Types ─── */
interface ConsentRecord {
  id: string
  consentType: string
  status: string
  grantedAt: string
  withdrawnAt: string | null
  version: string
}

interface ExportRequest {
  id: string
  status: string
  format: string
  requestedAt: string
  completedAt: string | null
  expiresAt: string | null
  error: string | null
}

interface DeletionRequest {
  id: string
  status: string
  reason: string | null
  requestedAt: string
  reviewedAt: string | null
  processedAt: string | null
  notes: string | null
}

/* ─── Labels ─── */
const CONSENT_LABELS: Record<string, { label: string; description: string }> = {
  COOKIES: { label: 'Cookies', description: 'Consentement pour l\'utilisation des cookies.' },
  CGU: { label: 'CGU', description: 'Conditions Générales d\'Utilisation.' },
  DONNEES_PERSONNELLES: { label: 'Données Personnelles', description: 'Collecte et traitement de vos données personnelles.' },
  MARKETING: { label: 'Marketing', description: 'Communications commerciales et personnalisées.' },
  CREASCOPE: { label: 'CréaScope', description: 'Utilisation de vos données pour les sessions CréaScope.' },
  FRANCE_TRAVAIL: { label: 'France Travail', description: 'Échange de données avec les APIs France Travail.' },
}

const STATUS_VARIANTS: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  GRANTED: { variant: 'default', label: 'Accepté' },
  DENIED: { variant: 'destructive', label: 'Refusé' },
  WITHDRAWN: { variant: 'outline', label: 'Retiré' },
  pending: { variant: 'secondary', label: 'En attente' },
  processing: { variant: 'default', label: 'En cours' },
  ready: { variant: 'default', label: 'Prêt' },
  approved: { variant: 'default', label: 'Approuvé' },
  rejected: { variant: 'destructive', label: 'Rejeté' },
  processed: { variant: 'default', label: 'Données supprimées' },
  expired: { variant: 'outline', label: 'Expiré' },
}

function getStatusBadge(status: string) {
  const info = STATUS_VARIANTS[status] || { variant: 'outline' as const, label: status }
  return (
    <Badge variant={info.variant} className="text-xs">
      {info.label}
    </Badge>
  )
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ─── Main Component ─── */
export function PrivacyDashboard() {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [exports, setExports] = useState<ExportRequest[]>([])
  const [deletions, setDeletions] = useState<DeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deletionReason, setDeletionReason] = useState('')

  // Check if there's a pending deletion request
  const hasPendingDeletion = deletions.some((d) => d.status === 'pending')
  // Check if data has already been processed (deleted)
  const hasProcessedDeletion = deletions.some((d) => d.status === 'processed')

  const token = typeof window !== 'undefined'
    ? (document.cookie.match(/session=([^;]+)/)?.[1] || localStorage.getItem('cp_token') || '')
    : ''

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    credentials: 'include',
  }), [token])

  /* ─── Fetch all data ─── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [consentRes, exportRes, deletionRes] = await Promise.allSettled([
        fetch('/api/rgpd/consent', { headers: authHeaders(), credentials: 'include' as RequestCredentials }),
        fetch('/api/rgpd/export', { headers: authHeaders(), credentials: 'include' as RequestCredentials }),
        fetch('/api/rgpd/delete-request', { headers: authHeaders(), credentials: 'include' as RequestCredentials }),
      ])

      if (consentRes.status === 'fulfilled' && consentRes.value.ok) {
        const json = await consentRes.value.json()
        setConsents(json.data?.consents || json.data || [])
      }
      if (exportRes.status === 'fulfilled' && exportRes.value.ok) {
        const json = await exportRes.value.json()
        setExports(json.data?.requests || json.data || [])
      }
      if (deletionRes.status === 'fulfilled' && deletionRes.value.ok) {
        const json = await deletionRes.value.json()
        setDeletions(json.data?.requests || json.data || [])
      }
    } catch {
      setError('Erreur lors du chargement des données RGPD.')
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ─── Withdraw consent ─── */
  const handleWithdrawConsent = async (consentType: string) => {
    try {
      const res = await fetch('/api/rgpd/consent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ consentType }),
      })
      if (res.ok) {
        setSuccess(`Consentement ${consentType} retiré avec succès.`)
        fetchData()
      } else {
        const json = await res.json().catch(() => null)
        setError(json?.error?.message || 'Impossible de retirer le consentement.')
      }
    } catch {
      setError('Impossible de retirer le consentement.')
    }
    setTimeout(() => setSuccess(null), 3000)
  }

  /* ─── Request data export ─── */
  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const res = await fetch('/api/rgpd/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        setSuccess('Export de données généré avec succès. Téléchargement en cours...')
        if (json.data?.data) {
          // Auto-download the JSON export
          const blob = new Blob([JSON.stringify(json.data.data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `creapulse-export-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
        fetchData()
      } else {
        const json = await res.json().catch(() => null)
        setError(json?.error?.message || 'Impossible de générer l\'export.')
      }
    } catch {
      setError('Erreur lors de la demande d\'export.')
    } finally {
      setExporting(false)
      setTimeout(() => setSuccess(null), 5000)
    }
  }

  /* ─── Request data deletion ─── */
  const handleDeleteRequest = async () => {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/rgpd/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ reason: deletionReason || undefined }),
      })
      if (res.ok) {
        setSuccess('Demande de suppression envoyée. Un conseiller examinera votre demande.')
        setDeletionReason('')
        fetchData()
      } else {
        const json = await res.json().catch(() => null)
        setError(json?.error?.message || 'Impossible de créer la demande de suppression.')
      }
    } catch {
      setError('Erreur lors de la demande de suppression.')
    } finally {
      setDeleting(false)
      setTimeout(() => setSuccess(null), 5000)
    }
  }

  /* ─── Render ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vie Privée & Données</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez vos consentements, exportez vos données ou demandez leur suppression.
          </p>
        </div>
      </div>

      {/* Success/Error messages */}
      <AnimatePresence mode="wait">
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200"
          >
            <Check className="h-4 w-4 shrink-0" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Already Deleted Banner */}
      {hasProcessedDeletion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4"
        >
          <Database className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Données supprimées</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Vos données personnelles ont été supprimées conformément à votre demande. Votre compte a été anonymisé.
              Certaines fonctionnalités peuvent ne plus être disponibles.
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── Consent Management ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Consentements
              </CardTitle>
              <CardDescription className="mt-1">
                Vos autorisations de traitement de données.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={fetchData}
            >
              <RefreshCw className="h-3 w-3" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun consentement enregistré. Les consentements sont enregistrés lors de votre première connexion.
            </p>
          ) : (
            <div className="space-y-3">
              {consents.map((consent) => {
                const info = CONSENT_LABELS[consent.consentType] || {
                  label: consent.consentType,
                  description: '',
                }
                const isGranted = consent.status === 'GRANTED'

                return (
                  <div
                    key={consent.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 transition-colors',
                      isGranted
                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                        : 'border-muted bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        isGranted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                      )}>
                        {isGranted ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{info.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {getStatusBadge(consent.status)}
                      {isGranted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => handleWithdrawConsent(consent.consentType)}
                        >
                          Retirer
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Data Export ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export de Données
          </CardTitle>
          <CardDescription className="mt-1">
            Téléchargez toutes vos données au format JSON (droit à la portabilité).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExport}
              disabled={exporting || hasProcessedDeletion}
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Génération en cours...' : 'Exporter mes données'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Fichier JSON contenant l&apos;ensemble de vos données personnelles, parcours, diagnostics et documents.
            </p>
          </div>

          {/* Export info box */}
          <div className="rounded-lg border border-muted bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>L&apos;export inclut : profil, parcours créateur, diagnostics Kiviat/RIASEC, analyses financières,
                  juridiques et de marché, documents BMC/BP/zéro-brouillon, feedbacks, consentements, messages et notifications.</p>
                <p>Disponible au téléchargement pendant 30 jours après la demande.</p>
              </div>
            </div>
          </div>

          {exports.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Historique des exports</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {exports.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatDate(exp.requestedAt)}
                        </span>
                        {exp.error && (
                          <span className="text-xs text-destructive">(erreur)</span>
                        )}
                      </div>
                      {getStatusBadge(exp.status)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Data Deletion ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Suppression de Données
          </CardTitle>
          <CardDescription className="mt-1">
            Demandez la suppression de vos données (droit à l&apos;oubli — Article 17 RGPD).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Action irréversible</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La suppression de vos données est définitive. Votre compte et tous vos parcours,
                  résultats, documents, messages et notifications seront supprimés. Votre compte sera
                  anonymisé et désactivé. Cette action sera revue par un conseiller avant d&apos;être exécutée.
                </p>
              </div>
            </div>
          </div>

          {/* Deletion request button with confirmation dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleting || hasPendingDeletion || hasProcessedDeletion}
                className="gap-2"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting
                  ? 'Envoi en cours...'
                  : hasPendingDeletion
                    ? 'Demande en attente de traitement'
                    : hasProcessedDeletion
                      ? 'Données déjà supprimées'
                      : 'Demander la suppression de mes données'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmer la demande de suppression
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3 pt-2">
                  <p>
                    Vous êtes sur le point de demander la suppression définitive de toutes vos données personnelles.
                    Cette action est <strong>irréversible</strong> une fois approuvée par un conseiller.
                  </p>
                  <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
                    <p className="font-medium text-foreground">Les données suivantes seront supprimées :</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      <li>Profil, parcours créateur et diagnostic</li>
                      <li>Résultats Kiviat, RIASEC et modules</li>
                      <li>Analyses financières, juridiques et de marché</li>
                      <li>Documents (BMC, BP, zéro-brouillon)</li>
                      <li>Messages et conversations</li>
                      <li>Notifications et consentements</li>
                      <li>Fichiers et documents uploadés</li>
                      <li>Programme d&apos;accompagnement à l&apos;amorçage (PAA)</li>
                    </ul>
                  </div>
                  <p className="text-muted-foreground">
                    Un conseiller examinera votre demande. Vous pouvez optionnellement indiquer une raison.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="px-6 pb-2">
                <Textarea
                  placeholder="Raison de la demande (optionnel)..."
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletionReason('')}>
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteRequest}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    'Confirmer la demande'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Deletion history */}
          {deletions.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Historique des demandes</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {deletions.map((del) => (
                    <div
                      key={del.id}
                      className={cn(
                        'rounded-lg border p-3 text-sm',
                        del.status === 'processed'
                          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                          : 'border-border',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {del.status === 'processed' ? (
                            <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {formatDate(del.requestedAt)}
                          </span>
                        </div>
                        {getStatusBadge(del.status)}
                      </div>
                      {del.notes && (
                        <p className="text-xs text-muted-foreground mt-2 ml-6">{del.notes}</p>
                      )}
                      {del.processedAt && del.status === 'processed' && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 ml-6">
                          Données effectivement supprimées le {formatDate(del.processedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* RGPD Info */}
      <div className="rounded-lg border bg-muted/30 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Vos droits RGPD</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Droit d\'accès', desc: 'Accéder à vos données personnelles via l\'export.' },
            { title: 'Droit de rectification', desc: 'Corriger vos données inexactes depuis votre profil.' },
            { title: 'Droit à la portabilité', desc: 'Exporter vos données au format structuré JSON.' },
            { title: 'Droit à l\';oubli', desc: 'Demander la suppression définitive de vos données.' },
            { title: 'Droit d\'opposition', desc: 'Retirer vos consentements à tout moment.' },
            { title: 'Droit à la limitation', desc: 'Demander la restriction du traitement de vos données.' },
          ].map((right) => (
            <div key={right.title} className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">{right.title}</p>
                <p className="text-xs text-muted-foreground">{right.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679),
          vous disposez de droits sur vos données personnelles. Pour toute demande, contactez votre conseiller
          ou le Délégué à la Protection des Données (DPO) du GIDEF Île-de-France.
        </p>
      </div>
    </motion.div>
  )
}
