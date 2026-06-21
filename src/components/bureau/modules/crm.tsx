'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'
import {
  Users, Search, Plus, X, Save, Loader2, Phone, Mail, Building2,
  Sparkles, ArrowRight, MessageSquare, Calendar, TrendingUp,
  ChevronDown, GripVertical, Clock, Euro, UserPlus, Star, Filter,
} from 'lucide-react'

// ─── Types ──────────────────────────────────

type ContactRole = 'prospect' | 'fournisseur' | 'partenaire' | 'conseiller'
type PipelineStage = 'prospect' | 'qualifie' | 'proposition' | 'client'

interface Contact {
  id: string
  nom: string
  email: string
  telephone: string
  entreprise: string
  role: ContactRole
  notes: string
  createdAt: string
}

interface Deal {
  id: string
  contactId: string
  contactName: string
  entreprise: string
  valeur: number
  stage: PipelineStage
  date: string
  notes: string
}

interface Interaction {
  id: string
  contactId: string
  contactName: string
  type: 'appel' | 'email' | 'rdv' | 'note'
  description: string
  date: string
}

interface CrmData {
  contacts: Contact[]
  deals: Deal[]
  interactions: Interaction[]
}

const ROLE_LABELS: Record<ContactRole, string> = {
  prospect: 'Prospect',
  fournisseur: 'Fournisseur',
  partenaire: 'Partenaire',
  conseiller: 'Conseiller',
}

const ROLE_COLORS: Record<ContactRole, string> = {
  prospect: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  fournisseur: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  partenaire: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  conseiller: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string; border: string }> = {
  prospect: { label: 'Prospect', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-800' },
  qualifie: { label: 'Qualifié', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800' },
  proposition: { label: 'Proposition', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-800' },
  client: { label: 'Client', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
}

const STAGE_ORDER: PipelineStage[] = ['prospect', 'qualifie', 'proposition', 'client']

const DEFAULT_DATA: CrmData = { contacts: [], deals: [], interactions: [] }

const STORAGE_KEY = 'creapulse-crm'

// ─── Helpers ────────────────────────────────

function loadCrmData(): CrmData {
  if (typeof window === 'undefined') return DEFAULT_DATA
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_DATA, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return DEFAULT_DATA
}

function saveCrmData(data: CrmData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500',
  'bg-violet-500', 'bg-sky-500', 'bg-orange-500', 'bg-lime-600',
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Contact Form Dialog ────────────────────

function ContactFormDialog({
  open, onOpenChange, onSave, initial, title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<Contact, 'id' | 'createdAt'> & { id?: string }) => void
  initial?: Contact
  title: string
}) {
  const [form, setForm] = useState({
    nom: initial?.nom || '', email: initial?.email || '', telephone: initial?.telephone || '',
    entreprise: initial?.entreprise || '', role: (initial?.role || 'prospect') as ContactRole, notes: initial?.notes || '',
  })

  useEffect(() => {
    if (open) setForm({
      nom: initial?.nom || '', email: initial?.email || '', telephone: initial?.telephone || '',
      entreprise: initial?.entreprise || '', role: (initial?.role || 'prospect') as ContactRole, notes: initial?.notes || '',
    })
  }, [open, initial])

  const handleSubmit = () => {
    if (!form.nom.trim()) { toast.error('Le nom est requis'); return }
    if (initial?.id) onSave({ ...form, id: initial.id })
    else onSave(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{initial?.id ? 'Modifiez les informations du contact.' : 'Ajoutez un nouveau contact à votre CRM.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Nom complet *</p>
            <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Jean Dupont" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jean@email.com" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Téléphone</p>
              <Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} placeholder="06 12 34 56 78" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Entreprise</p>
              <Input value={form.entreprise} onChange={e => setForm(p => ({ ...p, entreprise: e.target.value }))} placeholder="Ma Startup" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Rôle</p>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v as ContactRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Notes</p>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes sur ce contact..." className="min-h-[80px] resize-none" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>
            {initial?.id ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Deal Form Dialog ───────────────────────

function DealFormDialog({
  open, onOpenChange, onSave, contacts,
}: {
  open: boolean; onOpenChange: (open: boolean) => void
  onSave: (data: Omit<Deal, 'id'>) => void; contacts: Contact[]
}) {
  const [form, setForm] = useState({ contactId: '', valeur: '', notes: '', stage: 'prospect' as PipelineStage })

  useEffect(() => {
    if (open) setForm({ contactId: '', valeur: '', notes: '', stage: 'prospect' })
  }, [open])

  const handleSubmit = () => {
    if (!form.contactId) { toast.error('Sélectionnez un contact'); return }
    if (!form.valeur || isNaN(Number(form.valeur)) || Number(form.valeur) <= 0) { toast.error('Entrez un montant valide'); return }
    onSave({
      contactId: form.contactId,
      contactName: contacts.find(c => c.id === form.contactId)?.nom || '',
      entreprise: contacts.find(c => c.id === form.contactId)?.entreprise || '',
      valeur: Number(form.valeur),
      stage: form.stage,
      date: new Date().toISOString(),
      notes: form.notes,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle opportunité</DialogTitle>
          <DialogDescription>Créez une nouvelle opportunité commerciale.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Contact *</p>
            <Select value={form.contactId} onValueChange={v => setForm(p => ({ ...p, contactId: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}{c.entreprise ? ` (${c.entreprise})` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Montant (€) *</p>
              <Input type="number" value={form.valeur} onChange={e => setForm(p => ({ ...p, valeur: e.target.value }))} placeholder="5000" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Étape</p>
              <Select value={form.stage} onValueChange={v => setForm(p => ({ ...p, stage: v as PipelineStage }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map(s => <SelectItem key={s} value={s}>{STAGE_CONFIG[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Notes</p>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Détails de l'opportunité..." className="min-h-[60px] resize-none" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmit}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ─────────────────────────

export function CrmModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [data, setData] = useState<CrmData>(DEFAULT_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [dealDialogOpen, setDealDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | undefined>()
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)

  useEffect(() => {
    setData(loadCrmData())
    setIsLoading(false)
  }, [])

  useEffect(() => { if (!isLoading) saveCrmData(data) }, [isLoading, data])

  // ─── Contact CRUD ────────────────────────
  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = { ...contact, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setData(p => ({ ...p, contacts: [newContact, ...p.contacts] }))
    toast.success('Contact ajouté')
  }, [])

  const updateContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt'> & { id: string }) => {
    setData(p => ({ ...p, contacts: p.contacts.map(c => c.id === contact.id ? { ...c, ...contact } : c) }))
    toast.success('Contact modifié')
  }, [])

  const deleteContact = useCallback((id: string) => {
    setData(p => ({
      ...p,
      contacts: p.contacts.filter(c => c.id !== id),
      deals: p.deals.filter(d => d.contactId !== id),
      interactions: p.interactions.filter(i => i.contactId !== id),
    }))
    toast.success('Contact supprimé')
  }, [])

  // ─── Deal CRUD ───────────────────────────
  const addDeal = useCallback((deal: Omit<Deal, 'id'>) => {
    setData(p => ({ ...p, deals: [...p.deals, { ...deal, id: crypto.randomUUID() }] }))
    toast.success('Opportunité créée')
  }, [])

  const moveDeal = useCallback((dealId: string, newStage: PipelineStage) => {
    setData(p => ({
      ...p,
      deals: p.deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d),
      interactions: [...p.interactions, {
        id: crypto.randomUUID(),
        contactId: p.deals.find(d => d.id === dealId)?.contactId || '',
        contactName: p.deals.find(d => d.id === dealId)?.contactName || '',
        type: 'note' as const,
        description: `Déplacé vers "${STAGE_CONFIG[newStage].label}"`,
        date: new Date().toISOString(),
      }],
    }))
  }, [])

  const deleteDeal = useCallback((id: string) => {
    setData(p => ({ ...p, deals: p.deals.filter(d => d.id !== id) }))
    toast.success('Opportunité supprimée')
  }, [])

  // ─── Drag & Drop ─────────────────────────
  const handleDragStart = useCallback((dealId: string) => { setDraggedDeal(dealId) }, [])
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault() }, [])
  const handleDrop = useCallback((stage: PipelineStage) => {
    if (draggedDeal) { moveDeal(draggedDeal, stage); setDraggedDeal(null) }
  }, [draggedDeal, moveDeal])

  // ─── Filtered contacts ───────────────────
  const filteredContacts = useMemo(() => {
    let result = data.contacts
    if (roleFilter !== 'all') result = result.filter(c => c.role === roleFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => c.nom.toLowerCase().includes(q) || c.entreprise.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    }
    return result
  }, [data.contacts, roleFilter, searchQuery])

  // ─── Stats ───────────────────────────────
  const stats = useMemo(() => {
    const totalContacts = data.contacts.length
    const pipelineValue = data.deals.reduce((s, d) => s + d.valeur, 0)
    const clients = data.deals.filter(d => d.stage === 'client').length
    const totalDeals = data.deals.length
    const tauxConversion = totalDeals > 0 ? Math.round((clients / totalDeals) * 100) : 0
    const dealsThisMonth = data.deals.filter(d => {
      const dDate = new Date(d.date)
      const now = new Date()
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()
    }).length
    return { totalContacts, pipelineValue, tauxConversion, dealsThisMonth, clients }
  }, [data])

  // ─── AI Analysis ─────────────────────────
  const handleAiAnalysis = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await authFetch('/api/crm', { method: 'POST', body: JSON.stringify({ action: 'ai-analyze', contacts: data.contacts, deals: data.deals }) })
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.suggestion) {
          const interaction: Interaction = {
            id: crypto.randomUUID(), contactId: 'ai', contactName: 'Assistant IA',
            type: 'note', description: json.data.suggestion, date: new Date().toISOString(),
          }
          setData(p => ({ ...p, interactions: [interaction, ...p.interactions] }))
          toast.success('Recommandations IA générées !')
        }
      }
    } catch { toast.error('Erreur serveur') }
    finally { setAiLoading(false) }
  }, [data.contacts, data.deals])

  // ─── Save to API ─────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await authFetch('/api/crm', { method: 'PUT', body: JSON.stringify(data) })
      toast.success('CRM sauvegardé')
    } catch { toast.error('Erreur de sauvegarde') }
    finally { setIsSaving(false) }
  }, [data])

  // ─── Loading ─────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">CRM & Relations</h2>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] px-1.5">Nouveau</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{stats.totalContacts} contacts · {stats.clients} clients · {stats.pipelineValue.toLocaleString('fr-FR')} € pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 border-amber-400/40 text-amber-500 hover:bg-amber-400/10" onClick={handleAiAnalysis} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Aide IA
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Enregistrer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="flex-1">
        <div className="border-b px-4 md:px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="contacts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Contacts</TabsTrigger>
            <TabsTrigger value="pipeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Pipeline</TabsTrigger>
            <TabsTrigger value="suivi" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Suivi</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab: Contacts ── */}
        <TabsContent value="contacts" className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un contact..." className="pl-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Filtrer par rôle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditingContact(undefined); setContactDialogOpen(true) }}>
              <UserPlus className="h-4 w-4" /> Ajouter
            </Button>
          </div>

          {filteredContacts.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Aucun contact</p>
              <p className="text-xs text-muted-foreground mt-1">Ajoutez votre premier contact pour commencer.</p>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredContacts.map(contact => (
                <motion.div key={contact.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} layout>
                  <Card className="p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold', getAvatarColor(contact.id))}>
                        {getInitials(contact.nom)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{contact.nom}</p>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 shrink-0', ROLE_COLORS[contact.role])}>{ROLE_LABELS[contact.role]}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          {contact.entreprise && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{contact.entreprise}</span>}
                          {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                          {contact.telephone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.telephone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingContact(contact); setContactDialogOpen(true) }}>
                          <Filter className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500" onClick={() => deleteContact(contact.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Pipeline ── */}
        <TabsContent value="pipeline" className="p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Glissez les cartes entre les colonnes pour faire avancer vos opportunités.</p>
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setDealDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Nouvelle opportunité
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STAGE_ORDER.map(stage => {
              const config = STAGE_CONFIG[stage]
              const stageDeals = data.deals.filter(d => d.stage === stage)
              const stageTotal = stageDeals.reduce((s, d) => s + d.valeur, 0)
              return (
                <div key={stage} className={cn('rounded-xl border-2 p-3 min-h-[300px] transition-colors', config.bg, config.border, draggedDeal && 'ring-2 ring-emerald-400/50')}
                  onDragOver={handleDragOver} onDrop={() => handleDrop(stage)}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={cn('text-sm font-bold', config.color)}>{config.label}</p>
                      <p className="text-xs text-muted-foreground">{stageDeals.length} deals · {stageTotal.toLocaleString('fr-FR')} €</p>
                    </div>
                    <ChevronDown className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="space-y-2">
                    {stageDeals.map(deal => (
                      <div key={deal.id} draggable onDragStart={() => handleDragStart(deal.id)}
                        className={cn('rounded-lg border border-border bg-background p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow', draggedDeal === deal.id && 'opacity-50')}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{deal.contactName}</p>
                            {deal.entreprise && <p className="text-xs text-muted-foreground truncate">{deal.entreprise}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                              <Euro className="h-3 w-3 mr-0.5" />{deal.valeur.toLocaleString('fr-FR')}
                            </Badge>
                            <button className="text-muted-foreground hover:text-red-500" onClick={() => deleteDeal(deal.id)}><X className="h-3 w-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {stageDeals.length === 0 && (
                      <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        Glissez ici
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* ── Tab: Suivi ── */}
        <TabsContent value="suivi" className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Contacts</span></div><p className="text-2xl font-bold">{stats.totalContacts}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Euro className="h-4 w-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Pipeline</span></div><p className="text-2xl font-bold">{stats.pipelineValue.toLocaleString('fr-FR')} €</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Taux conversion</span></div><p className="text-2xl font-bold">{stats.tauxConversion}%</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Deals ce mois</span></div><p className="text-2xl font-bold">{stats.dealsThisMonth}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-500" />Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              {data.interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune interaction enregistrée. Déplacez des deals dans le pipeline pour créer un historique.</p>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {data.interactions.slice(0, 20).map(interaction => {
                    const IconMap = { appel: Phone, email: Mail, rdv: Calendar, note: MessageSquare }
                    const Ic = IconMap[interaction.type] || MessageSquare
                    return (
                      <div key={interaction.id} className="flex items-start gap-3 text-sm">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
                          <Ic className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{interaction.contactName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{interaction.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(interaction.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ContactFormDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} onSave={editingContact ? updateContact : addContact} initial={editingContact} title={editingContact ? 'Modifier le contact' : 'Nouveau contact'} />
      <DealFormDialog open={dealDialogOpen} onOpenChange={setDealDialogOpen} onSave={addDeal} contacts={data.contacts} />
    </motion.div>
  )
}