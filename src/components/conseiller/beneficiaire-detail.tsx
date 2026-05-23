'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useConseillerStore } from './conseiller-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Plus,
  Building2,
  BookOpen,
  Lightbulb,
  Target,
  Calculator,
  Rocket,
} from 'lucide-react'

/* ─── Mock data per beneficiary ─── */
const beneficiaryDetails: Record<string, {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  sector: string
  projectTitle: string
  projectDescription: string
  journeyPhase: string
  progress: number
  status: 'actif' | 'en_attente' | 'inactif'
  conseiller: string
  dateInscription: string
  riasec?: { profile: string; scores: { dimension: string; score: number }[] }
  kiviat?: { scores: { competence: string; score: number }[] }
  entretiens: { date: string; type: string; notes: string }[]
  documents: { name: string; type: string; date: string; status: string }[]
  notes: { date: string; content: string }[]
}> = {
  b1: {
    firstName: 'Amadou',
    lastName: 'Diallo',
    email: 'amadou.diallo@email.com',
    phone: '06 12 34 56 78',
    city: 'Paris 18e',
    sector: 'Agroalimentaire',
    projectTitle: 'Plateforme de livraison locale bio',
    projectDescription: 'Application mobile et web connectant les producteurs locaux bio aux consommateurs parisiens, avec livraison a velo en moins de 2 heures. Focus sur les circuits courts et la transparence des prix.',
    journeyPhase: 'Structurer',
    progress: 45,
    status: 'actif',
    conseiller: 'Sophie Martin',
    dateInscription: '15 Novembre 2024',
    riasec: {
      profile: 'Entrepreneur - Investigateur',
      scores: [
        { dimension: 'Realiste', score: 65 },
        { dimension: 'Investigateur', score: 82 },
        { dimension: 'Artistique', score: 45 },
        { dimension: 'Social', score: 70 },
        { dimension: 'Entrepreneur', score: 90 },
        { dimension: 'Conventionnel', score: 35 },
      ],
    },
    kiviat: {
      scores: [
        { competence: 'Gestion financiere', score: 60 },
        { competence: 'Marketing', score: 55 },
        { competence: 'Leadership', score: 75 },
        { competence: 'Technique', score: 85 },
        { competence: 'Negociation', score: 70 },
        { competence: 'Resilience', score: 80 },
      ],
    },
    entretiens: [
      { date: '27 Jan 2025 - 10:00', type: 'Suivi', notes: 'Avancement du business plan. Points de vigilance sur la logistique de livraison.' },
      { date: '13 Jan 2025 - 14:00', type: 'Bilan', notes: 'Bilan trimestriel positif. Progression sur le modele economique.' },
      { date: '20 Dec 2024 - 10:00', type: 'Suivi', notes: 'Premier contact. Presentation du projet et objectifs.' },
    ],
    documents: [
      { name: 'Business Plan v2', type: 'bp', date: '15 Jan 2025', status: 'en_cours' },
      { name: 'Resultats RIASEC', type: 'diagnostic', date: '22 Dec 2024', status: 'termine' },
      { name: 'Pre-visualisation financiere', type: 'financier', date: '10 Jan 2025', status: 'termine' },
    ],
    notes: [
      { date: '27 Jan 2025', content: 'Amadou montre une bonne comprehension des enjeux logistiques. A oriente vers les solutions de livraison collaborative.' },
      { date: '13 Jan 2025', content: 'Bon rythme de progression. Le modele economique est solide mais reste a valider les couts de livraison.' },
    ],
  },
  b2: {
    firstName: 'Lea',
    lastName: 'Fontaine',
    email: 'lea.fontaine@email.com',
    phone: '06 98 76 54 32',
    city: 'Creteil',
    sector: 'Bien-etre',
    projectTitle: 'Studio de yoga et bien-etre',
    projectDescription: 'Studio de yoga proposant des cours collectifs et individuels, des ateliers de meditation et un espace detente. Cible : actifs du quartier Creteil, horaires adaptes (7h-21h).',
    journeyPhase: 'Financer',
    progress: 72,
    status: 'actif',
    conseiller: 'Sophie Martin',
    dateInscription: '3 Octobre 2024',
    riasec: {
      profile: 'Social - Artistique',
      scores: [
        { dimension: 'Realiste', score: 40 },
        { dimension: 'Investigateur', score: 55 },
        { dimension: 'Artistique', score: 85 },
        { dimension: 'Social', score: 92 },
        { dimension: 'Entrepreneur', score: 60 },
        { dimension: 'Conventionnel', score: 50 },
      ],
    },
    kiviat: {
      scores: [
        { competence: 'Gestion financiere', score: 45 },
        { competence: 'Marketing', score: 70 },
        { competence: 'Leadership', score: 80 },
        { competence: 'Technique', score: 50 },
        { competence: 'Negociation', score: 65 },
        { competence: 'Resilience', score: 85 },
      ],
    },
    entretiens: [
      { date: '27 Jan 2025 - 14:00', type: 'Bilan BP', notes: 'Revision du business plan. Points a ameliorer : previsions de CA et strategie de lancement.' },
      { date: '6 Jan 2025 - 11:00', type: 'Suivi', notes: 'Avancement positif. Le BP est bien structure, il reste a finaliser les annexes financieres.' },
    ],
    documents: [
      { name: 'Business Plan v3 (final)', type: 'bp', date: '20 Jan 2025', status: 'en_attente' },
      { name: 'Resultats RIASEC', type: 'diagnostic', date: '10 Oct 2024', status: 'termine' },
      { name: 'Etude de marche', type: 'marche', date: '5 Dec 2024', status: 'termine' },
      { name: 'Plan financier 3 ans', type: 'financier', date: '18 Jan 2025', status: 'termine' },
    ],
    notes: [
      { date: '27 Jan 2025', content: 'Lea est motivee et rigoureuse. Le BP est quasi finalise. Reste a consolider les hypotheses de croissance.' },
    ],
  },
}

/* ─── Journey timeline steps ─── */
const journeySteps = [
  { label: 'Inscription', icon: CheckCircle2 },
  { label: 'Test RIASEC', icon: CheckCircle2 },
  { label: 'Mon Projet', icon: CheckCircle2 },
  { label: 'Test Kiviat', icon: CheckCircle2 },
  { label: 'Analyse de marche', icon: CheckCircle2 },
  { label: 'Plan financier', icon: Circle },
  { label: 'Business Plan', icon: Circle },
  { label: 'Statut juridique', icon: Circle },
  { label: 'Lancement', icon: Circle },
]

const phaseConfig: Record<string, { color: string }> = {
  Idee: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  Structurer: { color: 'bg-teal-100 text-primary dark:bg-teal-900/40 dark:text-teal-300' },
  Financer: { color: 'bg-coral-50 text-coral-500 dark:bg-coral-900/20 dark:text-coral-400' },
  Lancer: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

const docStatusConfig: Record<string, { label: string; color: string }> = {
  termine: { label: 'Termine', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  en_attente: { label: 'En attente', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
}

const docTypeIcons: Record<string, string> = {
  bp: 'Business Plan',
  diagnostic: 'Diagnostic',
  financier: 'Financier',
  marche: 'Marche',
}

/* ─── Component ─── */
export function BeneficiaireDetail({ beneficiaryId }: { beneficiaryId: string }) {
  const { selectBeneficiary, setTab } = useConseillerStore()
  const [activeTab, setActiveTab] = useState('parcours')

  const beneficiary = beneficiaryDetails[beneficiaryId]

  if (!beneficiary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Beneficiaire non trouve</p>
        <Button variant="outline" className="mt-4" onClick={() => selectBeneficiary(null)}>
          Retour a la liste
        </Button>
      </div>
    )
  }

  const initials = `${beneficiary.firstName[0]}${beneficiary.lastName[0]}`.toUpperCase()
  const phase = phaseConfig[beneficiary.journeyPhase] || phaseConfig.Idee
  const completedSteps = beneficiary.progress >= 88 ? 9 : beneficiary.progress >= 60 ? 7 : beneficiary.progress >= 40 ? 5 : 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {beneficiary.firstName} {beneficiary.lastName}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">{beneficiary.projectTitle}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className={`text-xs ${phase.color}`}>
                    {beneficiary.journeyPhase}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-muted">
                    {beneficiary.sector}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-muted">
                    Inscrit le {beneficiary.dateInscription}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setTab('entretiens')}>
                <Plus className="mr-1.5 h-4 w-4" />
                Planifier un entretien
              </Button>
            </div>
          </div>

          {/* Contact info row */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {beneficiary.email}
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {beneficiary.phone}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {beneficiary.city}
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Conseiller : {beneficiary.conseiller}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-semibold text-foreground">{beneficiary.progress}%</span>
            </div>
            <Progress value={beneficiary.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="parcours" className="text-sm">Parcours</TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-sm">Diagnostics</TabsTrigger>
          <TabsTrigger value="documents" className="text-sm">Documents</TabsTrigger>
          <TabsTrigger value="entretiens" className="text-sm">Entretiens</TabsTrigger>
          <TabsTrigger value="notes" className="text-sm">Notes</TabsTrigger>
        </TabsList>

        {/* ─── Parcours tab ─── */}
        <TabsContent value="parcours" className="mt-4 space-y-4">
          {/* Project description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Description du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {beneficiary.projectDescription}
              </p>
            </CardContent>
          </Card>

          {/* Journey timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parcours entrepreneurial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {journeySteps.map((step, i) => {
                  const isCompleted = i < completedSteps
                  const Icon = isCompleted ? CheckCircle2 : Circle
                  return (
                    <div key={step.label}>
                      <div className="flex items-center gap-3 py-2.5">
                        <Icon className={`h-5 w-5 shrink-0 ${isCompleted ? 'text-emerald-600' : 'text-muted-foreground/40'}`} />
                        <span className={`text-sm ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                        {isCompleted && i === completedSteps - 1 && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                            En cours
                          </Badge>
                        )}
                        {isCompleted && i < completedSteps - 1 && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600">
                            Termine
                          </Badge>
                        )}
                      </div>
                      {i < journeySteps.length - 1 && (
                        <div className="ml-[10px] h-4 border-l-2 border-dashed" style={{
                          borderColor: i < completedSteps ? 'rgb(16 185 129 / 0.3)' : 'rgb(115 115 115 / 0.2)',
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Diagnostics tab ─── */}
        <TabsContent value="diagnostics" className="mt-4 space-y-4">
          {/* RIASEC */}
          {beneficiary.riasec && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">Test RIASEC</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <span className="text-muted-foreground">Profil dominant : </span>
                  <span className="font-semibold text-foreground">{beneficiary.riasec.profile}</span>
                </p>
                <div className="space-y-2">
                  {beneficiary.riasec.scores.map((s) => (
                    <div key={s.dimension} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0">{s.dimension}</span>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${s.score}%`,
                              backgroundColor: s.score >= 80 ? 'rgb(0 131 143)' : s.score >= 60 ? 'rgb(255 183 77)' : 'rgb(115 115 115)',
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-foreground w-8 text-right">{s.score}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kiviat */}
          {beneficiary.kiviat && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Radar Kiviat</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {beneficiary.kiviat.scores.map((s) => (
                  <div key={s.competence} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 shrink-0">{s.competence}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-foreground w-8 text-right">{s.score}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Documents tab ─── */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents et livrables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {beneficiary.documents.map((doc, i) => {
                  const statusCfg = docStatusConfig[doc.status] || docStatusConfig.en_cours
                  return (
                    <div key={doc.name}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {docTypeIcons[doc.type] || doc.type} — {doc.date}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      {i < beneficiary.documents.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Entretiens tab ─── */}
        <TabsContent value="entretiens" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historique des entretiens</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setTab('entretiens')}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Nouvel entretien
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {beneficiary.entretiens.map((ent, i) => (
                  <div key={ent.date}>
                    <div className="flex items-start gap-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{ent.type}</p>
                          <Badge variant="secondary" className="text-[10px]">{ent.date}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{ent.notes}</p>
                      </div>
                    </div>
                    {i < beneficiary.entretiens.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Notes tab ─── */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              {beneficiary.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune note pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {beneficiary.notes.map((note) => (
                    <div key={note.date} className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{note.date}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
