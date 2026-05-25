'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  Award,
  Users,
  Eye,
  Rocket,
  GraduationCap,
  Contact,
  MessageSquare,
  MessagesSquare,
  UserCheck,
  DollarSign,
  Percent,
  UserPlus,
  Target,
  ArrowRight,
  ArrowDown,
  Zap,
  Play,
  BarChart3,
  Settings,
  RotateCcw,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const growthLevers = [
  {
    icon: BarChart3,
    title: 'Pilotage stratégique',
    description:
      'Définis tes KPIs, fixe des objectifs clairs et suis ta progression grâce à des tableaux de bord interactifs. Prends des décisions basées sur les données, pas l\'intuition.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Award,
    title: 'Certifications & compétences',
    description:
      'Obtiens ton Passeport Compétences et valorise tes acquis. Accède à des formations ciblées pour combler tes lacunes et te différencier sur ton marché.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Users,
    title: 'Réseautage & partenariats',
    description:
      'Utilise l\'annuaire du réseau GIDEF pour trouver des partenaires stratégiques, des mentors et des investisseurs. Participe au forum communautaire pour échanger avec tes pairs.',
    color: 'bg-coral-100 text-coral-500',
  },
  {
    icon: Eye,
    title: 'Veille & innovation',
    description:
      'Reste informé des tendances de ton secteur grâce à notre veille IA automatique. Anticipe les évolutions du marché et identifie de nouvelles opportunités de croissance.',
    color: 'bg-teal-100 text-teal-700',
  },
]

const devTools = [
  {
    icon: Rocket,
    title: 'Tremplin',
    description:
      'Programme d\'accélération structuré avec des milestones clairs. Fixe tes objectifs, construis ton plan d\'action, exécute, mesure tes résultats et ajuste ta stratégie.',
    badge: 'Accélération',
  },
  {
    icon: GraduationCap,
    title: 'Passeport Compétences',
    description:
      'Certifie tes compétences entrepreneuriales acquises par l\'expérience et la formation. Un document officiel pour valoriser ton profil auprès de tes partenaires.',
    badge: 'Certification',
  },
  {
    icon: Contact,
    title: 'Annuaire réseau',
    description:
      'Trouve des partenaires, mentors et investisseurs dans l\'écosystème GIDEF Île-de-France. Filtre par secteur, expertise et localisation pour des connexions pertinentes.',
    badge: 'Réseau',
  },
  {
    icon: MessageSquare,
    title: 'Forum communautaire',
    description:
      'Échange avec d\'autres entrepreneurs, pose tes questions, partage tes expériences et trouve des réponses concrètes. Un espace bienveillant pour progresser ensemble.',
    badge: 'Communauté',
  },
  {
    icon: MessagesSquare,
    title: 'Messages',
    description:
      'Messagerie intégrée pour communiquer directement avec tes conseillers, mentors et partenaires. Centralise tes échanges professionnels dans un seul endroit.',
    badge: 'Communication',
  },
  {
    icon: UserCheck,
    title: 'Mentorat',
    description:
      'Bénéficie d\'un accompagnement personnalisé par un mentor expérimenté. Des séances régulières pour faire le point, lever tes blocages et accélérer ta croissance.',
    badge: 'Accompagnement',
  },
]

const kpiStats = [
  {
    icon: DollarSign,
    title: 'CA mensuel',
    description: 'Suivi de ton chiffre d\'affaires mois par mois',
    value: '+12%',
    trend: 'vs mois dernier',
    color: 'text-emerald-600',
  },
  {
    icon: Percent,
    title: 'Marge nette',
    description: 'Rentabilité de ton activité',
    value: '34%',
    trend: 'objectif: 40%',
    color: 'text-primary',
  },
  {
    icon: UserPlus,
    title: 'Nombre de clients',
    description: 'Croissance de ta base client',
    value: '+8',
    trend: 'nouveaux ce mois',
    color: 'text-amber-600',
  },
  {
    icon: Target,
    title: 'Objectifs',
    description: 'Progression vers tes buts',
    value: '78%',
    trend: 'atteint ce trimestre',
    color: 'text-coral-500',
  },
]

const tremplinSteps = [
  { icon: Target, label: 'Définir tes objectifs' },
  { icon: Settings, label: 'Construire ton plan d\'action' },
  { icon: Play, label: 'Exécuter' },
  { icon: BarChart3, label: 'Mesurer les résultats' },
  { icon: RotateCcw, label: 'Ajuster & itérer' },
]

export default function DevelopperActivitePage() {
  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-coral-500 via-orange-400 to-amber-500 py-20 md:py-28">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-20 top-24 h-20 w-20 rounded-2xl bg-white/5 rotate-12" />
        <div className="absolute left-20 bottom-16 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div
              variants={fadeInUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
            >
              <TrendingUp className="h-5 w-5" />
              Je développe mon activité
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl"
            >
              Fais grandir ton activité avec les bons outils.
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-10 max-w-2xl text-lg text-white/90 md:text-xl"
            >
              Ton entreprise est lancée, maintenant il faut accélérer. CreaPulse te donne accès
              aux outils de pilotage, au réseau et aux formations pour passer à l&apos;échelle supérieure.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                className="gap-2 bg-white text-coral-600 hover:bg-white/90"
                onClick={() =>
                  document.getElementById('outils')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Accéder aux outils de développement
                <ArrowDown className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/metiers/formation">
                  <BookOpen className="h-5 w-5" />
                  Voir les formations
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── LES LEVIERS DE CROISSANCE ─── */}
      <motion.section
        className="py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Les leviers de croissance</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              4 piliers stratégiques pour développer ton activité de manière durable
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2"
          >
            {growthLevers.map((lever) => (
              <motion.div key={lever.title} variants={fadeInUp}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${lever.color}`}>
                      <lever.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{lever.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {lever.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── OUTILS DE DÉVELOPPEMENT ─── */}
      <motion.section
        id="outils"
        className="scroll-mt-20 bg-muted/30 py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Outils de développement</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              6 outils conçus pour t&apos;accompagner dans chaque dimension de ta croissance
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {devTools.map((tool) => (
              <motion.div key={tool.title} variants={fadeInUp}>
                <Card className="group h-full transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <tool.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {tool.badge}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── KPIs À SURVEILLER ─── */}
      <motion.section
        className="py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">KPIs à surveiller</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Les indicateurs clés pour piloter ton activité au quotidien
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {kpiStats.map((kpi) => (
              <motion.div key={kpi.title} variants={fadeInUp}>
                <Card className="h-full text-center transition-shadow hover:shadow-lg">
                  <CardContent className="flex flex-col items-center p-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <kpi.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <p className={`mb-1 text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <h3 className="mb-1 text-sm font-semibold">{kpi.title}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">{kpi.description}</p>
                    <Badge variant="outline" className="text-xs">{kpi.trend}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── PROGRAMME TREMPLIN ─── */}
      <motion.section
        className="bg-muted/30 py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Card className="overflow-hidden border-2 border-coral-200 bg-gradient-to-br from-coral-50 via-white to-amber-50">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
                  {/* Left content */}
                  <div className="flex-1">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-coral-100 px-3 py-1 text-xs font-medium text-coral-600">
                      <Zap className="h-3.5 w-3.5" />
                      Programme d&apos;accélération
                    </div>
                    <h2 className="mb-4 text-3xl font-bold">Programme Tremplin</h2>
                    <p className="mb-6 leading-relaxed text-muted-foreground">
                      Le programme Tremplin est conçu pour les entrepreneurs qui veulent passer
                      à la vitesse supérieure. Structuré en cycles itératifs, il te permet de
                      définir des objectifs ambitieux, de construire un plan d&apos;action réaliste,
                      d&apos;exécuter avec méthode et de mesurer tes résultats pour ajuster en continu.
                    </p>
                    <p className="mb-8 text-sm text-muted-foreground">
                      Chaque cycle dure 4 semaines et te guide à travers 5 phases clés
                      pour une progression mesurable et durable.
                    </p>
                    <Button className="gap-2 bg-gradient-to-r from-coral-500 to-amber-500 text-white hover:from-coral-600 hover:to-amber-600">
                      <Rocket className="h-4 w-4" />
                      Découvrir le programme Tremplin
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Right - Steps */}
                  <div className="w-full lg:w-72 shrink-0">
                    <p className="mb-4 text-sm font-semibold text-muted-foreground">
                      Les 5 phases du cycle
                    </p>
                    <div className="space-y-3">
                      {tremplinSteps.map((step, index) => (
                        <div key={step.label} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <step.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{step.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── FINAL CTA ─── */}
      <motion.section
        className="bg-gradient-to-br from-coral-500/10 via-transparent to-amber-500/5 py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-amber-500 shadow-lg">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold md:text-4xl">
              Passe à la vitesse supérieure
            </motion.h2>
            <motion.p variants={fadeInUp} className="mb-8 text-lg text-muted-foreground">
              Rejoins CreaPulse et accède à tous les outils de développement de ton activité.
              Pilotage, réseau, formations et accompagnement : tout est réuni pour ta réussite.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-coral-500 to-amber-500 text-white hover:from-coral-600 hover:to-amber-600" asChild>
                <Link href="/">
                  <Rocket className="h-5 w-5" />
                  Rejoindre CreaPulse
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/metiers/formation">
                  <BookOpen className="h-5 w-5" />
                  Découvrir les formations
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
