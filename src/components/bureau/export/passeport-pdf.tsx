'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Printer, X, CheckCircle2, Circle, Clock, Award, Medal, Crown, Gem } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────

interface PasseportExportData {
  entrepreneur: {
    fullName: string
    firstName: string | null
    lastName: string | null
    email: string
    registeredAt: string | null
  }
  journey: {
    projectTitle: string
    currentPhase: string
    progressPercent: number
    startedAt: string | null
  }
  modules: {
    code: string
    label: string
    category: string
    status: 'completed' | 'in_progress' | 'not_started'
    score: number
    maxScore: number
    completedAt: string | null
  }[]
  totalModules: number
  completedCount: number
  progressPercent: number
  certificationLevel: string
  skillsAcquired: string[]
  timeline: {
    module: string
    code: string
    date: string
    score: number
  }[]
  attestations: {
    moduleCode: string
    moduleLabel: string
    completedAt: string | null
    score: number
    referenceId: string
  }[]
  riasecProfile: {
    dominant: string[]
    scores: { profileType: string; score: number; isDominant: boolean }[]
  }
  kiviatProfile: {
    scores: { category: string; score: number; maxScore: number }[]
  }
  passportReference: string
  generatedAt: string
}

// ─── Helpers ────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const RIASEC_LABELS: Record<string, string> = {
  R: 'Réaliste',
  I: 'Investigateur',
  A: 'Artistique',
  S: 'Social',
  E: 'Entreprenant',
  C: 'Conventionnel',
}

const CERT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  none: { label: 'Non certifié', color: 'text-gray-500', bg: 'bg-gray-100' },
  bronze: { label: 'Bronze', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' },
  argent: { label: 'Argent', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-400' },
  or: { label: 'Or', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
  platine: { label: 'Platine', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-300' },
}

// ─── Component ──────────────────────────────

export function PasseportPdf({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<PasseportExportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch('/api/export/passeport')
        if (res.ok) {
          const json = await res.json()
          if (json.success) setData(json.data)
        }
      } catch {
        toast.error('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#00838F]" />
        <p className="text-sm text-muted-foreground">Chargement du passeport...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    )
  }

  const cert = CERT_CONFIG[data.certificationLevel] || CERT_CONFIG.none

  return (
    <div>
      {/* No-print toolbar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-lg">
        <h3 className="text-sm font-semibold text-foreground">Passeport Entrepreneurial</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Télécharger PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Print area */}
      <div className="print-area bg-white text-black">
        {/* ═══ COVER / HEADER ═══ */}
        <div className="px-8 py-10 border-b-4 border-[#00838F]">
          {/* Top branding */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#00838F] flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#00838F]">GIDEF Île-de-France</p>
                <p className="text-xs text-gray-500">CreaPulse V2</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Réf : {data.passportReference}</p>
              <p>{fmtDate(data.generatedAt)}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-6">
            <h1 className="text-3xl md:text-4xl font-bold text-[#00838F] mb-2">
              Passeport Entrepreneurial
            </h1>
            <p className="text-gray-500">Certification des compétences acquises</p>
          </div>

          {/* Certification badge */}
          <div className={cn('flex justify-center mb-6')}>
            <div className={cn('inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3', cert.bg)}>
              {data.certificationLevel === 'or' && <Crown className={cn('h-6 w-6', cert.color)} />}
              {data.certificationLevel === 'platine' && <Gem className={cn('h-6 w-6', cert.color)} />}
              {data.certificationLevel === 'argent' && <Award className={cn('h-6 w-6', cert.color)} />}
              {data.certificationLevel === 'bronze' && <Medal className={cn('h-6 w-6', cert.color)} />}
              <span className={cn('text-lg font-bold', cert.color)}>Niveau {cert.label}</span>
            </div>
          </div>
        </div>

        {/* ═══ ENTREPRENEUR PROFILE ═══ */}
        <div className="px-8 py-8 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-6">
            Profil de l'entrepreneur
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Nom complet</p>
              <p className="font-semibold text-gray-800">{data.entrepreneur.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Email</p>
              <p className="font-medium text-gray-800">{data.entrepreneur.email}</p>
            </div>
            {data.journey.projectTitle && (
              <div>
                <p className="text-gray-500 text-xs">Projet</p>
                <p className="font-medium text-gray-800">{data.journey.projectTitle}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">Phase du parcours</p>
              <p className="font-medium text-gray-800">{data.journey.currentPhase}</p>
            </div>
            {data.entrepreneur.registeredAt && (
              <div>
                <p className="text-gray-500 text-xs">Inscrit le</p>
                <p className="font-medium text-gray-800">{fmtDate(data.entrepreneur.registeredAt)}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">Progression globale</p>
              <p className="font-semibold text-[#00838F]">{data.journey.progressPercent}%</p>
            </div>
          </div>
        </div>

        {/* ═══ COMPLETED MODULES ═══ */}
        <div className="px-8 py-8 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-6">
            Modules complétés ({data.completedCount}/{data.totalModules})
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#00838F] text-white">
                <th className="text-left py-2 px-3 font-medium">Module</th>
                <th className="text-left py-2 px-3 font-medium">Catégorie</th>
                <th className="text-center py-2 px-3 font-medium">Statut</th>
                <th className="text-center py-2 px-3 font-medium">Score</th>
                <th className="text-right py-2 px-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.modules.map((m) => (
                <tr key={m.code} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-medium text-gray-800">{m.label}</td>
                  <td className="py-2 px-3 text-gray-500">{m.category}</td>
                  <td className="py-2 px-3 text-center">
                    {m.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                    ) : m.status === 'in_progress' ? (
                      <Clock className="h-4 w-4 text-amber-500 inline" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300 inline" />
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {m.status === 'completed' ? (
                      <span className="inline-block bg-green-50 text-green-700 rounded px-2 py-0.5 text-xs font-semibold">{m.score}%</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-500 text-xs">
                    {m.completedAt ? fmtDate(m.completedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ═══ RIASEC & KIVIAT ROW ═══ */}
        <div className="px-8 py-8 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* RIASEC */}
            <div>
              <h2 className="text-lg font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-4">
                Profil RIASEC
              </h2>
              {data.riasecProfile.dominant.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Profil(s) dominant(s) : <span className="font-bold text-gray-800">
                      {data.riasecProfile.dominant.map((d) => RIASEC_LABELS[d] || d).join(', ')}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {data.riasecProfile.scores.map((r) => {
                      const pct = Math.round(r.score * 10) // Scale to 0-100
                      return (
                        <div key={r.profileType} className="flex items-center gap-3">
                          <span className="text-xs font-medium w-28 text-gray-700">
                            {RIASEC_LABELS[r.profileType] || r.profileType}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', r.isDominant ? 'bg-[#00838F]' : 'bg-gray-300')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-bold w-8 text-right', r.isDominant ? 'text-[#00838F]' : 'text-gray-400')}>
                            {pct}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Test RIASEC non complété</p>
              )}
            </div>

            {/* KIVIAT */}
            <div>
              <h2 className="text-lg font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-4">
                Compétences (Kiviat)
              </h2>
              {data.kiviatProfile.scores.length > 0 ? (
                <div className="space-y-2">
                  {data.kiviatProfile.scores.map((k) => {
                    const pct = Math.round((k.score / k.maxScore) * 100)
                    return (
                      <div key={k.category} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-32 text-gray-700 truncate">{k.category}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#FF6B35]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-8 text-right text-gray-600">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Test Kiviat non complété</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SKILLS ACQUIRED ═══ */}
        <div className="px-8 py-8 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-6">
            Compétences acquises ({data.skillsAcquired.length})
          </h2>
          {data.skillsAcquired.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.skillsAcquired.map((skill, idx) => (
                <span key={idx} className="inline-block bg-[#00838F]/10 text-[#00838F] rounded-full px-3 py-1 text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune compétence encore acquise</p>
          )}
        </div>

        {/* ═══ ATTESTATIONS GRID ═══ */}
        {data.attestations.length > 0 && (
          <div className="px-8 py-8 border-b border-gray-200 page-break">
            <h2 className="text-xl font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-6">
              Attestations ({data.attestations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.attestations.map((att) => (
                <div key={att.referenceId} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{att.moduleLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Score : {att.score}%</p>
                    {att.completedAt && (
                      <p className="text-xs text-gray-400">{fmtDate(att.completedAt)}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 font-mono">{att.referenceId}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ OVERALL SCORE & SIGNATURE ═══ */}
        <div className="px-8 py-8 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Progression */}
            <div>
              <h2 className="text-lg font-bold text-[#00838F] mb-4">Progression globale</h2>
              <div className="flex items-center gap-6">
                {/* Circular progress */}
                <div className="relative">
                  <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#E0E0E0" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="#00838F" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - data.progressPercent / 100)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-800">{data.progressPercent}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-gray-800">{data.completedCount}</span> modules sur{' '}
                    <span className="font-bold text-gray-800">{data.totalModules}</span> complétés
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {data.completedCount < data.totalModules
                      ? `Encore ${data.totalModules - data.completedCount} module(s) pour compléter le parcours`
                      : 'Parcours complet !'}
                  </p>
                </div>
              </div>
            </div>

            {/* Signature area */}
            <div>
              <h2 className="text-lg font-bold text-[#00838F] mb-4">Validation</h2>
              <div className="space-y-4">
                <div className="border-b-2 border-dashed border-gray-300 pb-8 pt-2">
                  <p className="text-xs text-gray-400">Signature du conseiller</p>
                </div>
                <div className="border-b-2 border-dashed border-gray-300 pb-8 pt-2">
                  <p className="text-xs text-gray-400">Cachet de GIDEF</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-8 py-6 bg-gray-50 text-center">
          <p className="text-xs text-gray-400">
            Document généré le {fmtDate(data.generatedAt)} — Référence : {data.passportReference}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            GIDEF Île-de-France — CreaPulse V2 — Document confidentiel
          </p>
          {/* QR Code placeholder */}
          <div className="mt-3 inline-block border border-gray-200 rounded-lg p-3 bg-white">
            <div className="h-16 w-16 bg-gray-100 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 text-center">QR Code</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
