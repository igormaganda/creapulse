'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Building2,
  Users,
  Sliders,
  Puzzle,
  Database,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Save,
  Download,
  Trash,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
  ImageIcon,
  Shield,
  HardDrive,
  BarChart3,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Types ─── */
type TeamMember = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Conseiller' | 'LECTURE'
  status: 'Actif' | 'Inactif'
  avatar: string
}

type BureauModule = {
  id: string
  name: string
  description: string
  active: boolean
  section: 'Parcours' | 'Stratégie' | 'Écosystème' | 'Pilotage'
}

type CenterInfo = {
  name: string
  siret: string
  address: string
  city: string
  postalCode: string
  region: string
  phone: string
  email: string
  website: string
}

type Preferences = {
  language: string
  timezone: string
  dateFormat: string
  currency: string
  notifications: boolean
  emailNotifications: boolean
  autoBackup: string
  theme: string
}

/* ─── Mock Data ─── */
const initialCenterInfo: CenterInfo = {
  name: 'GIDEF Créteil',
  siret: '123 456 789 00012',
  address: '12 Rue de la République',
  city: 'Créteil',
  postalCode: '94000',
  region: 'Île-de-France',
  phone: '01 43 77 50 00',
  email: 'contact@lidef-creteil.fr',
  website: 'www.lidef-creteil.fr',
}

const initialTeam: TeamMember[] = [
  { id: '1', name: 'Marie Dupont', email: 'marie.dupont@lidef.fr', role: 'Admin', status: 'Actif', avatar: 'MD' },
  { id: '2', name: 'Jean-Pierre Martin', email: 'jp.martin@lidef.fr', role: 'Conseiller', status: 'Actif', avatar: 'JM' },
  { id: '3', name: 'Sophie Lefèvre', email: 'sophie.lefevre@lidef.fr', role: 'Conseiller', status: 'Actif', avatar: 'SL' },
  { id: '4', name: 'Philippe Petit', email: 'philippe.petit@lidef.fr', role: 'Conseiller', status: 'Actif', avatar: 'PP' },
  { id: '5', name: 'Amina Roux', email: 'amina.roux@lidef.fr', role: 'LECTURE', status: 'Actif', avatar: 'AR' },
  { id: '6', name: 'Luc Bernard', email: 'luc.bernard@lidef.fr', role: 'Conseiller', status: 'Inactif', avatar: 'LB' },
]

const initialModules: BureauModule[] = [
  // Parcours
  { id: 'mon-projet', name: 'Mon Projet', description: 'Fiche projet structurée avec auto-évaluation', active: true, section: 'Parcours' },
  { id: 'riasec', name: 'Test RIASEC', description: 'Test de personnalité entrepreneurial', active: true, section: 'Parcours' },
  { id: 'parcours-steps', name: 'Parcours Guidé', description: 'Étapes du parcours créateur', active: true, section: 'Parcours' },
  { id: 'tremplin', name: 'Tremplin', description: 'Validation de l&apos;éligibilité au dispositif', active: true, section: 'Parcours' },
  // Stratégie
  { id: 'creasim', name: 'CreaSim', description: 'Simulateur financier prévisionnel', active: true, section: 'Stratégie' },
  { id: 'business-plan', name: 'Business Plan', description: 'Rédaction assistée par IA', active: true, section: 'Stratégie' },
  { id: 'marche', name: 'Étude de Marché', description: 'Analyse concurrentielle et marché', active: false, section: 'Stratégie' },
  { id: 'juridique', name: 'Juridique', description: 'Choix du statut et formalités', active: true, section: 'Stratégie' },
  { id: 'financement', name: 'Financement', description: 'Recherche de financements', active: false, section: 'Stratégie' },
  { id: 'pitch-deck', name: 'Pitch Deck', description: 'Création de présentation investisseur', active: false, section: 'Stratégie' },
  // Écosystème
  { id: 'annuaire', name: 'Annuaire', description: 'Répertoire des acteurs de l&apos;écosystème', active: true, section: 'Écosystème' },
  { id: 'forum', name: 'Forum', description: 'Communauté et discussions entre créateurs', active: true, section: 'Écosystème' },
  { id: 'mentorat', name: 'Mentorat', description: 'Mise en relation avec des mentors', active: true, section: 'Écosystème' },
  // Pilotage
  { id: 'dashboard', name: 'Tableau de bord', description: 'Vue d&apos;ensemble et KPI', active: true, section: 'Pilotage' },
  { id: 'planning', name: 'Planning', description: 'Gestion des rendez-vous', active: true, section: 'Pilotage' },
  { id: 'livrables', name: 'Livrables', description: 'Suivi et validation des livrables', active: true, section: 'Pilotage' },
]

const initialPreferences: Preferences = {
  language: 'Français',
  timezone: 'Europe/Paris',
  dateFormat: 'JJ/MM/AAAA',
  currency: 'EUR (€)',
  notifications: true,
  emailNotifications: true,
  autoBackup: 'Quotidien',
  theme: 'Système',
}

const regions = [
  'Île-de-France', 'Auvergne-Rhône-Alpes', 'Bretagne', 'Bourgogne-Franche-Comté',
  'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
  'Normandie', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur", 'DOM-TOM',
]

const dbStats = {
  totalRecords: 4256,
  storageUsed: '247 Mo',
  beneficiaires: 130,
  conseillers: 7,
  entretiens: 48,
  documents: 342,
}

/* ─── Section 1: Informations du Centre ─── */
function CenterInfoSection() {
  const [info, setInfo] = useState<CenterInfo>(initialCenterInfo)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Informations du centre mises à jour')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#FF6B35]" />
            Informations du Centre
          </CardTitle>
          <CardDescription>Informations générales et coordonnées du centre GIDEF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo upload */}
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#FF6B35]/10 border-2 border-dashed border-[#FF6B35]/30">
              <Zap className="h-8 w-8 text-[#FF6B35]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Logo du centre</p>
              <p className="text-xs text-muted-foreground mt-1">PNG ou SVG, max 2 Mo</p>
              <Button variant="outline" size="sm" className="mt-2 gap-2">
                <Upload className="h-3.5 w-3.5" />
                Telecharger un logo
              </Button>
            </div>
          </div>

          <Separator />

          {/* Form grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="center-name">Nom du centre</Label>
              <Input
                id="center-name"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                value={info.siret}
                onChange={(e) => setInfo({ ...info, siret: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={info.region} onValueChange={(v) => setInfo({ ...info, region: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selectionner une region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={info.address}
                onChange={(e) => setInfo({ ...info, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={info.city}
                onChange={(e) => setInfo({ ...info, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal-code">Code postal</Label>
              <Input
                id="postal-code"
                value={info.postalCode}
                onChange={(e) => setInfo({ ...info, postalCode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Téléphone
              </Label>
              <Input
                id="phone"
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Site web
              </Label>
              <Input
                id="website"
                value={info.website}
                onChange={(e) => setInfo({ ...info, website: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Section 2: Equipe & Accès ─── */
function TeamSection() {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'Conseiller' as TeamMember['role'] })

  const roleColors: Record<string, string> = {
    Admin: 'bg-[#FF6B35] text-white',
    Conseiller: 'bg-primary/10 text-primary',
    LECTURE: 'bg-muted text-muted-foreground',
  }

  const openAddDialog = () => {
    setEditingMember(null)
    setForm({ name: '', email: '', role: 'Conseiller' })
    setDialogOpen(true)
  }

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member)
    setForm({ name: member.name, email: member.email, role: member.role })
    setDialogOpen(true)
  }

  const handleSaveMember = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (editingMember) {
      setTeam(team.map(m => m.id === editingMember.id ? { ...m, ...form, avatar: form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) } : m))
      toast.success('Membre mis à jour')
    } else {
      const newMember: TeamMember = {
        id: String(Date.now()),
        name: form.name,
        email: form.email,
        role: form.role,
        status: 'Actif',
        avatar: form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      }
      setTeam([...team, newMember])
      toast.success('Membre ajouté')
    }
    setDialogOpen(false)
  }

  const handleDeleteMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id))
    toast.success('Membre supprimé')
  }

  const toggleStatus = (id: string) => {
    setTeam(team.map(m => m.id === id ? { ...m, status: m.status === 'Actif' ? 'Inactif' as const : 'Actif' as const } : m))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-[#FF6B35]" />
                Equipe & Accès
              </CardTitle>
              <CardDescription>Gestion des membres et de leurs droits d&apos;acces</CardDescription>
            </div>
            <Button onClick={openAddDialog} size="sm" className="gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white w-fit">
              <Plus className="h-4 w-4" />
              Ajouter un membre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Membre</th>
                  <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="pb-3 font-medium text-muted-foreground">Role</th>
                  <th className="pb-3 font-medium text-muted-foreground">Statut</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {team.map((member) => (
                  <tr key={member.id} className="group">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold shrink-0">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">{member.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={roleColors[member.role]}>
                        <Shield className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => toggleStatus(member.id)}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        {member.status === 'Actif' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-xs font-medium ${member.status === 'Actif' ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {member.status}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(member)}>
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteMember(member.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Modifier le membre' : 'Ajouter un membre'}
            </DialogTitle>
            <DialogDescription>
              {editingMember ? 'Modifiez les informations du membre' : 'Ajoutez un nouveau membre a l\'equipe'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="member-name">Nom complet</Label>
              <Input
                id="member-name"
                placeholder="Ex: Marie Dupont"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="marie.dupont@lidef.fr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as TeamMember['role'] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin — Acces complet</SelectItem>
                  <SelectItem value="Conseiller">Conseiller — Gestion des bénéficiaires</SelectItem>
                  <SelectItem value="LECTURE">Lecture seule — Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveMember} className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white">
              {editingMember ? 'Mettre a jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

/* ─── Section 3: Préférences ─── */
function PreferencesSection() {
  const [prefs, setPrefs] = useState<Preferences>(initialPreferences)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    toast.success('Préférences mises à jour')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#FF6B35]" />
            Préférences
          </CardTitle>
          <CardDescription>Paramètres d&apos;affichage, langue et notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Langue par defaut</Label>
              <Select value={prefs.language} onValueChange={(v) => setPrefs({ ...prefs, language: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Français">Français</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Español">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fuseau horaire</Label>
              <Select value={prefs.timezone} onValueChange={(v) => setPrefs({ ...prefs, timezone: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (UTC+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format de date</Label>
              <Select value={prefs.dateFormat} onValueChange={(v) => setPrefs({ ...prefs, dateFormat: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JJ/MM/AAAA">JJ/MM/AAAA</SelectItem>
                  <SelectItem value="MM/JJ/AAAA">MM/JJ/AAAA</SelectItem>
                  <SelectItem value="AAAA-MM-JJ">AAAA-MM-JJ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={prefs.currency} onValueChange={(v) => setPrefs({ ...prefs, currency: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                  <SelectItem value="USD ($)">USD ($)</SelectItem>
                  <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequence de sauvegarde automatique</Label>
              <Select value={prefs.autoBackup} onValueChange={(v) => setPrefs({ ...prefs, autoBackup: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quotidien">Quotidien</SelectItem>
                  <SelectItem value="Hebdomadaire">Hebdomadaire</SelectItem>
                  <SelectItem value="Mensuel">Mensuel</SelectItem>
                  <SelectItem value="Jamais">Jamais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={prefs.theme} onValueChange={(v) => setPrefs({ ...prefs, theme: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Système">Système (automatique)</SelectItem>
                  <SelectItem value="Clair">Clair</SelectItem>
                  <SelectItem value="Sombre">Sombre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notifications in-app</Label>
                <p className="text-xs text-muted-foreground">Recevoir les notifications dans l&apos;application</p>
              </div>
              <Switch checked={prefs.notifications} onCheckedChange={(v) => setPrefs({ ...prefs, notifications: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Notifications par email</Label>
                <p className="text-xs text-muted-foreground">Recevoir les alertes par email</p>
              </div>
              <Switch checked={prefs.emailNotifications} onCheckedChange={(v) => setPrefs({ ...prefs, emailNotifications: v })} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Section 4: Modules Actifs ─── */
function ModulesSection() {
  const [modules, setModules] = useState<BureauModule[]>(initialModules)

  const sections = ['Parcours', 'Stratégie', 'Écosystème', 'Pilotage'] as const
  const sectionColors: Record<string, string> = {
    'Parcours': 'text-primary',
    'Stratégie': 'text-amber-500',
    'Écosystème': 'text-green-500',
    'Pilotage': 'text-purple-500',
  }
  const sectionIcons: Record<string, React.ReactNode> = {
    'Parcours': <MapPin className="h-4 w-4" />,
    'Stratégie': <BarChart3 className="h-4 w-4" />,
    'Écosystème': <Globe className="h-4 w-4" />,
    'Pilotage': <HardDrive className="h-4 w-4" />,
  }

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, active: !m.active } : m))
  }

  const enableAll = () => {
    setModules(modules.map(m => ({ ...m, active: true })))
    toast.success('Tous les modules ont été activés')
  }

  const disableAll = () => {
    setModules(modules.map(m => ({ ...m, active: false })))
    toast.success('Tous les modules ont été désactivés')
  }

  const activeCount = modules.filter(m => m.active).length

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-[#FF6B35]" />
                Modules Actifs
              </CardTitle>
              <CardDescription>
                {activeCount} / {modules.length} modules activés
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={enableAll} className="gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tout activer
              </Button>
              <Button variant="outline" size="sm" onClick={disableAll} className="gap-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5" />
                Tout désactiver
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((section) => (
            <div key={section}>
              <div className="flex items-center gap-2 mb-3">
                <span className={sectionColors[section]}>{sectionIcons[section]}</span>
                <h3 className={`text-sm font-semibold ${sectionColors[section]}`}>{section}</h3>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {modules.filter(m => m.section === section && m.active).length}/{modules.filter(m => m.section === section).length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modules.filter(m => m.section === section).map((mod) => (
                  <div
                    key={mod.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                      mod.active ? 'bg-[#FF6B35]/5 border-[#FF6B35]/20' : 'bg-muted/30 border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${mod.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {mod.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{mod.description}</p>
                    </div>
                    <Switch
                      checked={mod.active}
                      onCheckedChange={() => toggleModule(mod.id)}
                    />
                  </div>
                ))}
              </div>
              {section !== 'Pilotage' && <Separator className="mt-5" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Section 5: Données & Export ─── */
function DataSection() {
  const [exporting, setExporting] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    await new Promise(r => setTimeout(r, 1500))
    setExporting(false)
    toast.success('Export complet ! Fichier téléchargé.')
  }

  const handleClearCache = async () => {
    setClearing(true)
    await new Promise(r => setTimeout(r, 1000))
    setClearing(false)
    toast.success('Cache effacé avec succès')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-[#FF6B35]" />
            Données & Export
          </CardTitle>
          <CardDescription>Export, conservation des données et statistiques de la base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="gap-2 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white h-auto py-4 flex-col items-center justify-center"
            >
              {exporting ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
              <span className="text-sm font-medium mt-1">
                {exporting ? 'Export en cours...' : 'Exporter toutes les données'}
              </span>
              <span className="text-xs opacity-70">CSV / JSON</span>
            </Button>

            <div className="space-y-2">
              <Label>Durée de conservation</Label>
              <Select defaultValue="3-annees">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-annee">1 an</SelectItem>
                  <SelectItem value="2-annees">2 ans</SelectItem>
                  <SelectItem value="3-annees">3 ans</SelectItem>
                  <SelectItem value="5-annees">5 ans</SelectItem>
                  <SelectItem value="illimitee">Illimitée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={handleClearCache}
              disabled={clearing}
              className="gap-2 h-auto py-4 flex-col items-center justify-center"
            >
              {clearing ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Trash className="h-6 w-6" />}
              <span className="text-sm font-medium mt-1">
                {clearing ? 'Effacement...' : 'Effacer le cache'}
              </span>
              <span className="text-xs text-muted-foreground">Données temporaires</span>
            </Button>
          </div>

          <Separator />

          {/* Stats */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Statistiques de la base
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total enregistrements', value: dbStats.totalRecords.toLocaleString('fr-FR'), icon: Database, color: 'text-[#FF6B35]' },
                { label: 'Espace utilisé', value: dbStats.storageUsed, icon: HardDrive, color: 'text-primary' },
                { label: 'Bénéficiaires', value: String(dbStats.beneficiaires), icon: Users, color: 'text-green-500' },
                { label: 'Entretiens', value: String(dbStats.entretiens), icon: Mail, color: 'text-amber-500' },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-lg bg-muted/50 border">
                  <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Main ParametresView ─── */
export function ParametresView() {
  const [activeTab, setActiveTab] = useState('informations')

  const tabs = [
    { id: 'informations', label: 'Informations', icon: Building2 },
    { id: 'equipe', label: 'Equipe', icon: Users },
    { id: 'preferences', label: 'Préférences', icon: Sliders },
    { id: 'modules', label: 'Modules', icon: Puzzle },
    { id: 'donnees', label: 'Données', icon: Database },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Parametres</h2>
        <p className="text-sm text-muted-foreground">Configuration et gestion du centre GIDEF</p>
      </div>

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="gap-1.5 data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white text-sm px-3 py-1.5"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="informations">
          <CenterInfoSection />
        </TabsContent>

        <TabsContent value="equipe">
          <TeamSection />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSection />
        </TabsContent>

        <TabsContent value="modules">
          <ModulesSection />
        </TabsContent>

        <TabsContent value="donnees">
          <DataSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
