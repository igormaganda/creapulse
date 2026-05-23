'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Printer, X } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────

interface BpExportData {
  entrepreneur: {
    fullName: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  project: {
    title: string
    description: string
    sector: string
    stage: string
    targetAudience: string
    motivation: string
    valueProposition: string
  }
  sections: Record<string, unknown>
  bpScore: number
  bpStatus: string
  moduleResults: { moduleCode: string; score: number; maxScore: number; completedAt: string | null }[]
  riasecResults: { profileType: string; score: number; isDominant: boolean }[]
  financialForecast: {
    year1Revenue: number | null
    year1Expenses: number | null
    year2Revenue: number | null
    year2Expenses: number | null
    year3Revenue: number | null
    year3Expenses: number | null
    breakevenMonth: number | null
    initialInvestment: number | null
    grossMarginRate: number | null
    netMarginRate: number | null
  } | null
  generatedAt: string
}

interface SwotData {
  strengths: string
  weaknesses: string
  opportunities: string
  threats: string
}

interface FinancingRow {
  id: string
  source: string
  montant: number
}

interface ResultYear {
  ca: number
  charges: number
  resultat: number
}

interface Milestone {
  id: string
  title: string
  date: string
  completed: boolean
}

// ─── Helpers ────────────────────────────────

function fmt(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getText(val: unknown): string {
  if (typeof val === 'string') return val
  return ''
}

function hasContent(val: unknown): boolean {
  if (!val) return false
  if (typeof val === 'string') return val.trim().length > 0
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'object') return Object.values(val as Record<string, unknown>).some((v) => v !== null && v !== undefined && v !== '' && v !== 0)
  return false
}

const STATUT_OPTIONS: Record<string, string> = {
  'auto-entrepreneur': 'Auto-entrepreneur (Micro-entreprise)',
  'eurl': 'EURL',
  'sas': 'SAS',
  'sasu': 'SASU',
  'sarl': 'SARL',
  'sa': 'SA',
  'association': 'Association loi 1901',
}

const SECTIONS_CONFIG = [
  { id: 'resume', title: '1. Résumé opérationnel', type: 'text' as const },
  { id: 'equipe', title: '2. Présentation de l\'équipe', type: 'text' as const },
  { id: 'etude-marche', title: '3. Étude de marché', type: 'text' as const },
  { id: 'segmentation', title: '4. Segmentation clientèle', type: 'text' as const },
  { id: 'concurrence', title: '5. Concurrence', type: 'text' as const },
  { id: 'strategie-marketing', title: '6a. Stratégie marketing', type: 'text' as const },
  { id: 'plan-commercial', title: '6b. Plan commercial', type: 'text' as const },
  { id: 'financement', title: '7a. Plan de financement', type: 'table' as const },
  { id: 'compte-resultat', title: '7b. Compte de résultat prévisionnel', type: 'result' as const },
  { id: 'tresorerie', title: '7c. Trésorerie mensuelle', type: 'treasury' as const },
  { id: 'seuil-rentabilite', title: '7d. Seuil de rentabilité', type: 'text' as const },
  { id: 'investissements', title: '7e. Investissements', type: 'list' as const },
  { id: 'swot', title: '8. Analyse SWOT', type: 'swot' as const },
  { id: 'statut-juridique', title: '9. Statut juridique', type: 'statut' as const },
  { id: 'calendrier', title: '10. Calendrier de réalisation', type: 'timeline' as const },
]

// ─── Component ──────────────────────────────

export function BusinessPlanPdf({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<BpExportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch('/api/export/business-plan')
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
        <p className="text-sm text-muted-foreground">Chargement du business plan...</p>
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

  const s = data.sections
  const filledSections = SECTIONS_CONFIG.filter((sec) => hasContent(s[sec.id]))

  return (
    <div>
      {/* No-print toolbar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-lg">
        <h3 className="text-sm font-semibold text-foreground">Aperçu du Business Plan</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 bg-[#00838F] hover:bg-[#00838F]/90 text-white" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Imprimer / Sauvegarder en PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Print area */}
      <div className="print-area bg-white text-black">
        {/* ═══ COVER PAGE ═══ */}
        <div className="min-h-[100vh] flex flex-col items-center justify-center px-8 py-16 border-b-4 border-[#00838F]">
          <div className="text-center max-w-2xl">
            <div className="mb-8">
              <div className="inline-block px-6 py-2 bg-[#00838F] text-white rounded-full text-sm font-semibold tracking-wide mb-6">
                GIDEF Île-de-France
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#00838F] mb-4 leading-tight">
              Business Plan
            </h1>
            <p className="text-xl text-gray-600 mb-2">Document de présentation du projet</p>
            {data.project.title && (
              <p className="text-2xl font-semibold text-gray-800 mt-6 mb-2">&laquo; {data.project.title} &raquo;</p>
            )}
            {data.project.sector && (
              <p className="text-gray-500">Secteur : {data.project.sector}</p>
            )}
          </div>

          <div className="mt-16 text-center space-y-1 text-sm text-gray-500">
            <p className="text-base font-medium text-gray-700">{data.entrepreneur.fullName}</p>
            {data.entrepreneur.email && <p>{data.entrepreneur.email}</p>}
            <p className="mt-4">{fmtDate(data.generatedAt)}</p>
            <p className="text-xs text-gray-400 mt-2">Complétion : {data.bpScore}% — {data.bpStatus === 'DRAFT' ? 'Brouillon' : data.bpStatus === 'IN_PROGRESS' ? 'En cours' : 'Non commencé'}</p>
          </div>

          <div className="absolute bottom-8 text-center text-xs text-gray-400">
            <p>Document confidentiel — CreaPulse V2 — GIDEF Île-de-France</p>
          </div>
        </div>

        {/* ═══ TABLE OF CONTENTS ═══ */}
        <div className="px-8 py-10 page-break">
          <h2 className="text-2xl font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-6">
            Table des matières
          </h2>
          <div className="space-y-2">
            {SECTIONS_CONFIG.filter((sec) => hasContent(s[sec.id])).map((sec) => (
              <div key={sec.id} className="flex items-center gap-3 py-1.5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">{sec.title}</span>
                {hasContent(s[sec.id]) && (
                  <span className="ml-auto text-xs text-green-600 font-medium">✓ Renseigné</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTIONS ═══ */}
        {SECTIONS_CONFIG.map((sec, idx) => {
          if (!hasContent(s[sec.id])) return null
          return (
            <div key={sec.id} className={idx > 0 ? 'page-break' : ''}>
              <SectionRenderer section={sec} data={s} />
            </div>
          )
        })}

        {/* ═══ FOOTER ON EVERY PAGE (via CSS) ═══ */}
      </div>
    </div>
  )
}

// ─── Section Renderer ───────────────────────

function SectionRenderer({ section, data }: { section: typeof SECTIONS_CONFIG[number]; data: Record<string, unknown> }) {
  const val = data[section.id]

  return (
    <div className="px-8 py-10">
      <h2 className="text-xl font-bold text-[#00838F] border-b-2 border-[#00838F]/20 pb-2 mb-6">
        {section.title}
      </h2>

      {section.type === 'text' && (
        <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
          {getText(val)}
        </div>
      )}

      {section.type === 'swot' && (
        <SwotView data={val as SwotData | undefined} />
      )}

      {section.type === 'table' && (
        <FinancingTable data={val as FinancingRow[] | undefined} />
      )}

      {section.type === 'result' && (
        <ResultTableView data={val as Record<string, ResultYear> | undefined} />
      )}

      {section.type === 'treasury' && (
        <TreasuryView data={val as Array<{ month: string; encaissements: number; decaissements: number; solde: number }> | undefined} />
      )}

      {section.type === 'list' && (
        <InvestmentsList data={val as Array<{ id: string; name: string; amount: number }> | undefined} />
      )}

      {section.type === 'statut' && (
        <StatutView val={getText(val)} />
      )}

      {section.type === 'timeline' && (
        <TimelineView data={val as Milestone[] | undefined} />
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────

function SwotView({ data }: { data?: SwotData }) {
  const d = data || { strengths: '', weaknesses: '', opportunities: '', threats: '' }
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        { key: 'strengths' as const, label: 'Forces', bg: 'bg-green-50 border-green-200' },
        { key: 'weaknesses' as const, label: 'Faiblesses', bg: 'bg-red-50 border-red-200' },
        { key: 'opportunities' as const, label: 'Opportunités', bg: 'bg-blue-50 border-blue-200' },
        { key: 'threats' as const, label: 'Menaces', bg: 'bg-amber-50 border-amber-200' },
      ].map((q) => (
        <div key={q.key} className={`rounded-lg border p-4 ${q.bg}`}>
          <h4 className="font-bold text-sm mb-2">{q.label}</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{d[q.key] || 'Non renseigné'}</p>
        </div>
      ))}
    </div>
  )
}

function FinancingTable({ data }: { data?: FinancingRow[] }) {
  const rows = data || []
  const total = rows.reduce((s, r) => s + r.montant, 0)
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-[#00838F] text-white">
          <th className="text-left py-2 px-3 font-medium">Source de financement</th>
          <th className="text-right py-2 px-3 font-medium">Montant</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-gray-200">
            <td className="py-2 px-3">{row.source}</td>
            <td className="py-2 px-3 text-right font-medium">{fmt(row.montant)}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-[#00838F] font-bold">
          <td className="py-2 px-3">Total</td>
          <td className="py-2 px-3 text-right">{fmt(total)}</td>
        </tr>
      </tbody>
    </table>
  )
}

function ResultTableView({ data }: { data?: Record<string, ResultYear> }) {
  if (!data) return <p className="text-sm text-gray-400">Non renseigné</p>
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-[#00838F] text-white">
          <th className="text-left py-2 px-3 font-medium">Poste</th>
          <th className="text-right py-2 px-3 font-medium">Année 1</th>
          <th className="text-right py-2 px-3 font-medium">Année 2</th>
          <th className="text-right py-2 px-3 font-medium">Année 3</th>
        </tr>
      </thead>
      <tbody>
        {(['year1', 'year2', 'year3'] as const).map((y) => {
          const label = y === 'year1' ? 'Année 1' : y === 'year2' ? 'Année 2' : 'Année 3'
          const d = data[y]
          if (!d) return null
          return (
            <tr key={y} className="border-b border-gray-200">
              <td className="py-2 px-3 font-medium">{label}</td>
              <td className="py-2 px-3 text-right">{fmt(d.ca)}</td>
              <td className="py-2 px-3 text-right">{fmt(d.charges)}</td>
              <td className="py-2 px-3 text-right">{fmt(d.resultat)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function TreasuryView({ data }: { data?: Array<{ month: string; encaissements: number; decaissements: number; solde: number }> }) {
  const rows = data || []
  if (rows.length === 0) return <p className="text-sm text-gray-400">Non renseigné</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#00838F] text-white">
            <th className="text-left py-1.5 px-2 font-medium">Mois</th>
            <th className="text-right py-1.5 px-2 font-medium">Encaissements</th>
            <th className="text-right py-1.5 px-2 font-medium">Décaissements</th>
            <th className="text-right py-1.5 px-2 font-medium">Solde cumulé</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month} className={`border-b border-gray-100 ${r.solde < 0 ? 'bg-red-50' : ''}`}>
              <td className="py-1 px-2 font-medium">{r.month}</td>
              <td className="py-1 px-2 text-right">{fmt(r.encaissements)}</td>
              <td className="py-1 px-2 text-right">{fmt(r.decaissements)}</td>
              <td className={`py-1 px-2 text-right font-medium ${r.solde < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(r.solde)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InvestmentsList({ data }: { data?: Array<{ id: string; name: string; amount: number }> }) {
  const rows = data || []
  if (rows.length === 0) return <p className="text-sm text-gray-400">Non renseigné</p>
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-[#00838F] text-white">
          <th className="text-left py-2 px-3 font-medium">Investissement</th>
          <th className="text-right py-2 px-3 font-medium">Montant</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-gray-200">
            <td className="py-2 px-3">{r.name}</td>
            <td className="py-2 px-3 text-right font-medium">{fmt(r.amount)}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-[#00838F] font-bold">
          <td className="py-2 px-3">Total</td>
          <td className="py-2 px-3 text-right">{fmt(total)}</td>
        </tr>
      </tbody>
    </table>
  )
}

function StatutView({ val }: { val: string }) {
  const label = STATUT_OPTIONS[val] || val || 'Non défini'
  return (
    <div className="bg-gray-50 rounded-lg p-4 inline-block">
      <p className="text-sm text-gray-500">Statut juridique choisi :</p>
      <p className="text-base font-semibold text-gray-800 mt-1">{label}</p>
    </div>
  )
}

function TimelineView({ data }: { data?: Milestone[] }) {
  const milestones = data || []
  if (milestones.length === 0) return <p className="text-sm text-gray-400">Non renseigné</p>
  return (
    <div className="space-y-3">
      {milestones.map((m, idx) => (
        <div key={m.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center mt-1">
            <div className={`h-3 w-3 rounded-full ${m.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
            {idx < milestones.length - 1 && <div className="w-px h-8 bg-gray-200" />}
          </div>
          <div className="flex-1 pb-2">
            <p className="text-sm font-medium text-gray-800">{m.title}</p>
            {m.date && <p className="text-xs text-gray-500">{m.date}</p>}
          </div>
          {m.completed && <span className="text-xs text-green-600 font-medium">✓</span>}
        </div>
      ))}
    </div>
  )
}
