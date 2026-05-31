'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
}

interface DeletionRequest {
  id: string
  status: string
  reason: string | null
  requestedAt: string
  reviewedAt: string | null
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
  processed: { variant: 'default', label: 'Traité' },
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
        setSuccess('Export de données généré avec succès.')
        if (json.data?.exportData) {
          // Auto-download the JSON
          const blob = new Blob([JSON.stringify(json.data.exportData, null, 2)], { type: 'application/json' })
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
        setError('Impossible de générer l\'export.')
      }
    } catch {
      setError('Erreur lors de la demande d\'export.')
    } finally {
      setExporting(false)
      setTimeout(() => setSuccess(null), 3000)
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
        body: JSON.stringify({}),
      })
      if (res.ok) {
        setSuccess('Demande de suppression envoyée.')
        fetchData()
      } else {
        setError('Impossible de créer la demande de suppression.')
      }
    } catch {
      setError('Erreur lors de la demande de suppression.')
    } finally {
      setDeleting(false)
      setTimeout(() => setSuccess(null), 3000)
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
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200"
        >
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
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
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Génération...' : 'Exporter mes données'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Fichier JSON contenant l&apos;ensemble de vos données personnelles.
            </p>
          </div>

          {exports.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Historique des exports</p>
                <div className="space-y-2">
                  {exports.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {new Date(exp.requestedAt).toLocaleDateString('fr-FR')}
                        </span>
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
            Demandez la suppression de vos données (droit à l&apos;oubli).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Action irréversible</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La suppression de vos données est définitive. Votre compte et tous vos parcours,
                  résultats et documents seront supprimés. Cette action sera revue par un conseiller
                  avant d&apos;être exécutée.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={handleDeleteRequest}
            disabled={deleting}
            className="gap-2"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting ? 'Envoi...' : 'Demander la suppression de mes données'}
          </Button>

          {deletions.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Historique des demandes</p>
                <div className="space-y-2">
                  {deletions.map((del) => (
                    <div
                      key={del.id}
                      className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {new Date(del.requestedAt).toLocaleDateString('fr-FR')}
                        </span>
                        {del.notes && (
                          <span className="text-xs text-muted-foreground">— {del.notes}</span>
                        )}
                      </div>
                      {getStatusBadge(del.status)}
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
            { title: 'Droit d\'accès', desc: 'Accéder à vos données personnelles.' },
            { title: 'Droit de rectification', desc: 'Corriger vos données inexactes.' },
            { title: 'Droit à la portabilité', desc: 'Exporter vos données au format structuré.' },
            { title: 'Droit à l\'oubli', desc: 'Demander la suppression de vos données.' },
            { title: 'Droit d\'opposition', desc: 'Retirer vos consentements.' },
            { title: 'Droit à la limitation', desc: 'Restreindre le traitement de vos données.' },
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
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez de droits
          sur vos données personnelles. Pour toute demande, contactez votre conseiller ou le Délégué à la
          Protection des Données (DPO) du GIDEF Île-de-France.
        </p>
      </div>
    </motion.div>
  )
}
