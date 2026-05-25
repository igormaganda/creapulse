'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Rocket,
  FileText,
  LayoutGrid,
  Calculator,
  Presentation,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Scale,
  Wallet,
  Users,
  ClipboardList,
  Banknote,
  Shield,
  Megaphone,
  ArrowDown,
  Building2,
  Briefcase,
  UserCheck,
  Handshake,
  BarChart3,
  Target,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const bureauFeatures = [
  {
    icon: FileText,
    title: 'Business Plan IA',
    description:
      'Rédige ton business plan avec l\'assistance de notre IA. Auto-généré depuis ton parcours entrepreneurial, il intègre ton étude de marché, tes prévisionnels financiers et ta stratégie pour convaincre banques et investisseurs.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: LayoutGrid,
    title: 'Business Model Canvas',
    description:
      'Visualise ton modèle économique en 9 blocs interactifs. Définis ta proposition de valeur, tes segments de clientèle, tes canaux de distribution et tes flux de revenus de manière visuelle et collaborative.',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    icon: Calculator,
    title: 'Simulateurs financiers',
    description:
      'Utilise CreaSim et notre simulateur financier pour projeter tes revenus, charges et trésorerie sur 3 ans. Visualise ton seuil de rentabilité et prends des décisions éclairées pour ton lancement.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Presentation,
    title: 'Pitch Deck',
    description:
      'Crée ton pitch deck avec l\'IA en quelques clics. Structure ta présentation, génère du contenu percutant et exporte en PPTX pour tes réunions avec des investisseurs ou des partenaires.',
    color: 'bg-coral-100 text-coral-500',
  },
]

const creationSteps = [
  { number: 1, label: 'Idée validée', icon: Lightbulb, done: true },
  { number: 2, label: 'Business Plan rédigé', icon: FileText, done: false },
  { number: 3, label: 'Statut juridique choisi', icon: Building2, done: false },
  { number: 4, label: 'Financement obtenu', icon: Wallet, done: false },
  { number: 5, label: 'Immatriculation', icon: ClipboardList, done: false },
  { number: 6, label: 'Lancement !', icon: Rocket, done: false },
]

const strategyModules = [
  {
    icon: BarChart3,
    title: 'Analyse de marché',
    description:
      'Étude IA de ton secteur, analyse de la concurrence, segmentation de clientèle et tendances du marché pour positionner ton offre de manière optimale.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Scale,
    title: 'Droit & juridique',
    description:
      'Choix du statut juridique (auto-entrepreneur, SARL, SAS...), obligations légales, démarches d\'immatriculation et accompagnement dans les formalités.',
    color: 'bg-coral-100 text-coral-500',
  },
  {
    icon: Wallet,
    title: 'Finance',
    description:
      'Comptes prévisionnels, calcul du seuil de rentabilité, plan de trésorerie et recherche de financements : subventions, prêts d\'honneur, crowdfunding.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Users,
    title: 'Réseau',
    description:
      'Annuaire GIDEF, mise en relation avec des mentors, partenaires et conseillers. Accède à un écosystème entrepreneurial solidaire en Île-de-France.',
    color: 'bg-teal-100 text-teal-700',
  },
]

const checklists = [
  {
    title: 'Avant la création',
    icon: ClipboardList,
    items: [
      'Rédiger ton business plan complet',
      'Réaliser ton étude de marché',
      'Choisir ton statut juridique',
      'Établir ton prévisionnel financier',
    ],
    color: 'border-l-4 border-l-amber-400',
  },
  {
    title: 'Pendant la création',
    icon: Briefcase,
    items: [
      'Immatriculer ton entreprise',
      'Ouvrir un compte bancaire professionnel',
      'Souscrire tes assurances professionnelles',
      'Mettre en place ta comptabilité',
    ],
    color: 'border-l-4 border-l-primary',
  },
  {
    title: 'Après la création',
    icon: Megaphone,
    items: [
      'Démarcher ton premier client',
      'Configurer tes tableaux de bord',
      'Développer ton réseau professionnel',
      'Planifier ta croissance',
    ],
    color: 'border-l-4 border-l-emerald-400',
  },
]

export default function CreerEntreprisePage() {
  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 py-20 md:py-28">
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
              <Rocket className="h-5 w-5" />
              Je crée mon entreprise
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl"
            >
              Lance ton entreprise avec un accompagnement sur mesure.
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-10 max-w-2xl text-lg text-white/90 md:text-xl"
            >
              CreaPulse est ton co-pilot entrepreneurial. Du business plan à l&apos;immatriculation,
              chaque outil est conçu pour te faire gagner du temps et te donner les moyens de réussir ton lancement.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                className="gap-2 bg-white text-teal-700 hover:bg-white/90"
                asChild
              >
                <Link href="/">
                  Accéder à mon bureau virtuel
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/besoin/decouvrir-idee">
                  <Lightbulb className="h-5 w-5" />
                  J&apos;en suis à l&apos;idée
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── BUREAU VIRTUEL ─── */}
      <motion.section
        className="py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Ton bureau virtuel entrepreneurial</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Tous les outils dont tu as besoin pour créer ton entreprise, réunis dans un seul espace
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2"
          >
            {bureauFeatures.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="group h-full transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── ÉTAPES DE CRÉATION ─── */}
      <motion.section
        className="bg-muted/30 py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Les étapes de création</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Un chemin structuré pour passer de l&apos;idée à l&apos;immatriculation
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {creationSteps.map((step) => (
              <motion.div key={step.number} variants={fadeInUp}>
                <Card
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    step.done ? 'border-2 border-primary/50' : ''
                  }`}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                        step.done
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <step.icon className={`h-5 w-5 ${step.done ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-medium ${step.done ? 'text-primary' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── LA STRATÉGIE COMPLÈTE ─── */}
      <motion.section
        className="py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">La stratégie complète</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              4 modules stratégiques pour aborder chaque dimension de ton projet
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2"
          >
            {strategyModules.map((module) => (
              <motion.div key={module.title} variants={fadeInUp}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${module.color}`}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── RESSOURCES POUR CHAQUE ÉTAPE ─── */}
      <motion.section
        className="bg-muted/30 py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Des ressources pour chaque étape</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Checklist, outils et conseils pour avancer sereinement dans ton projet
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {checklists.map((list) => (
              <motion.div key={list.title} variants={fadeInUp}>
                <Card className={`h-full ${list.color}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <list.icon className="h-6 w-6 text-foreground" />
                      <CardTitle className="text-lg">{list.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {list.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── FINAL CTA ─── */}
      <motion.section
        className="bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/5 py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                <Rocket className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold md:text-4xl">
              Commence maintenant
            </motion.h2>
            <motion.p variants={fadeInUp} className="mb-8 text-lg text-muted-foreground">
              Rejoins des centaines d&apos;entrepreneurs qui ont lancé leur activité grâce à CreaPulse.
              L&apos;inscription est gratuite et tu accèdes immédiatement à tous les outils.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600" asChild>
                <Link href="/">
                  <Rocket className="h-5 w-5" />
                  S&apos;inscrire gratuitement
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/besoin/decouvrir-idee">
                  <Lightbulb className="h-5 w-5" />
                  Explorer le parcours créateur
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
