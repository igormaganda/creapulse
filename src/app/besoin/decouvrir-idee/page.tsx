'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Lightbulb,
  Brain,
  Users,
  ArrowRight,
  UserCircle,
  Target,
  Eye,
  Puzzle,
  Calculator,
  BarChart3,
  Sparkles,
  Quote,
  Rocket,
  Search,
  CheckCircle2,
  ArrowDown,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const features = [
  {
    icon: Brain,
    title: 'Diagnostic entrepreneurial IA',
    description:
      'Notre IA analyse ton profil avec les modèles RIASEC, Kiviat et Bilan IA pour dresser un portrait complet de ta personnalité entrepreneuriale. Découvre tes forces, tes axes d\'amélioration et les secteurs qui te correspondent le mieux.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Target,
    title: 'Guidance pas-à-pas',
    description:
      'Un parcours structuré avec des étapes claires et des jalons concrets. De la découverte de ton profil à la validation de ton idée, chaque étape te guide avec des exercices pratiques et des recommandations personnalisées.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Users,
    title: 'Communauté d\'entrepreneurs',
    description:
      'Rejoins un réseau dynamique porté par GIDEF Île-de-France et Echo Entreprendre. Accède au forum communautaire, bénéficie d\'un mentorat personnalisé et connects-toi avec des entrepreneurs qui partagent tes ambitions.',
    color: 'bg-coral-100 text-coral-500',
  },
]

const steps = [
  {
    number: 1,
    icon: UserCircle,
    title: 'Profil Créateur',
    description:
      'Définis ta personnalité entrepreneuriale à travers un questionnaire approfondi. L\'IA analyse tes motivations, tes compétences et ton rapport au risque pour te proposer un profil personnalisé.',
  },
  {
    number: 2,
    icon: Lightbulb,
    title: 'Mon Projet',
    description:
      'Structure ton idée en un projet concret. Définis ton offre, ton public cible, ta proposition de valeur et commence à construire ton canevas de business model.',
  },
  {
    number: 3,
    icon: Eye,
    title: 'Vision',
    description:
      'Définis ta vision à 3-5 ans pour ton projet. Fixe des objectifs stratégiques, identifie les ressources nécessaires et trace la route vers ton ambition entrepreneuriale.',
  },
  {
    number: 4,
    icon: Puzzle,
    title: 'Test RIASEC',
    description:
      'Découvre ton profil psychologique avec le test RIASEC (Réaliste, Investigateur, Artistique, Social, Entreprenant, Conventionnel). Comprends tes tendances naturelles et comment les exploiter dans ton parcours.',
  },
]

const tools = [
  {
    icon: Calculator,
    title: 'Simulateur CreaSim',
    description:
      'Teste la viabilité financière de ton idée en quelques clics. Simule tes revenus, tes charges, ton seuil de rentabilité et visualise tes projections sur 3 ans avec des graphiques clairs.',
    badge: 'Simulation',
  },
  {
    icon: BarChart3,
    title: 'Analyse de marché IA',
    description:
      'Comprends ton marché cible grâce à une analyse intelligente. Identifie tes concurrents, ton segment de clientèle idéal et les tendances de ton secteur pour positionner ton offre efficacement.',
    badge: 'Analyse IA',
  },
  {
    icon: Sparkles,
    title: 'Bilan IA',
    description:
      'Fais le point sur tes compétences et motivations grâce à notre intelligence artificielle. Le Bilan IA croise tes réponses avec des données de milliers de parcours entrepreneuriaux pour te donner des insights uniques.',
    badge: 'Diagnostic',
  },
]

const testimonials = [
  {
    initials: 'SA',
    name: 'Sophie Ait-Mansour',
    quote:
      'J\'avais une idée de plateforme de cours en ligne mais je ne savais pas par où commencer. Le diagnostic IA de CreaPulse m\'a permis de valider mon marché et de structurer mon projet étape par étape.',
    before: 'Une idée vague et beaucoup de doutes sur la faisabilité de mon projet.',
    after: 'Un business model clair, une étude de marché solide et la confiance pour me lancer.',
  },
  {
    initials: 'KD',
    name: 'Karim Diallo',
    quote:
      'Le test RIASEC m\'a ouvert les yeux. Je me découvrais un profil Entreprenant que je n\'exploitais pas dans mon emploi. Aujourd\'hui, j\'ai lancé mon activité de consulting grâce à CreaPulse.',
    before: 'En poste depuis 8 ans sans perspective d\'évolution, je me sentais bloqué.',
    after: 'Mon cabinet de consulting digital est en croissance, 3 clients en 2 mois.',
  },
]

export default function DecouvrirIdeePage() {
  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-400 to-amber-600 py-20 md:py-28">
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
              <Lightbulb className="h-5 w-5" />
              Je découvre une idée
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl"
            >
              Tu as une idée ? On t&apos;aide à la transformer en projet.
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-10 max-w-2xl text-lg text-white/90 md:text-xl"
            >
              Que ton idée soit floue ou déjà précise, CreaPulse t&apos;accompagne pour l&apos;explorer,
              la structurer et valider son potentiel grâce à des outils IA puissants et une communauté d&apos;entrepreneurs.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                className="gap-2 bg-white text-amber-700 hover:bg-white/90"
                onClick={() =>
                  document.getElementById('parcours')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Démarrer mon diagnostic gratuit
                <ArrowDown className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/metiers/test-ia">
                  <Search className="h-5 w-5" />
                  Explorer les métiers
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── POURQUOI CREAPULSE ? ─── */}
      <motion.section
        className="py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Pourquoi CreaPulse ?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Un accompagnement complet pour explorer ton idée avec méthode et confiance
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full transition-shadow hover:shadow-lg">
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

      {/* ─── LE PARCOURS DÉCOUVERTE ─── */}
      <motion.section
        id="parcours"
        className="scroll-mt-20 bg-muted/30 py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Le parcours découverte</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              4 étapes pour passer d&apos;une idée vague à un projet structuré et viable
            </p>
          </div>

          <div className="relative space-y-8">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-0 hidden h-full w-0.5 bg-border md:left-1/2 md:block" />

            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className={`relative flex flex-col gap-4 md:flex-row md:items-center ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <motion.div
                  variants={fadeInUp}
                  className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}
                >
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                        <step.icon className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            Étape {step.number}
                          </Badge>
                        </div>
                        <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Center dot (desktop) */}
                <div className="absolute left-6 top-6 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-amber-400 bg-white md:left-1/2 md:block" />

                {/* Spacer */}
                <div className="hidden flex-1 md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ─── OUTILS D'EXPLORATION ─── */}
      <motion.section
        className="py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Des outils d&apos;exploration</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Explore ta idée avec des outils puissants et accessibles à tous les stades de réflexion
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {tools.map((tool) => (
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
                    <CardTitle className="mt-4 text-xl">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {tool.description}
                    </p>
                    <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary/80">
                      Découvrir
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── TÉMOIGNAGES ─── */}
      <motion.section
        className="bg-muted/30 py-16 md:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Témoignages</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ils avaient une idée, CreaPulse les a aidés à passer à l&apos;action
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2"
          >
            {testimonials.map((tem) => (
              <motion.div key={tem.name} variants={fadeInUp}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <Quote className="mb-4 h-8 w-8 text-amber-300" />
                    <p className="mb-6 text-sm leading-relaxed italic text-muted-foreground">
                      &ldquo;{tem.quote}&rdquo;
                    </p>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                        {tem.initials}
                      </div>
                      <p className="font-semibold">{tem.name}</p>
                    </div>
                    <div className="mb-3 rounded-lg bg-red-50 p-3">
                      <p className="text-xs font-medium text-red-700">Avant</p>
                      <p className="mt-1 text-sm text-red-600/80">{tem.before}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="text-xs font-medium text-emerald-700">Après</p>
                      <p className="mt-1 text-sm text-emerald-600/80">{tem.after}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── FINAL CTA ─── */}
      <motion.section
        className="bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Rocket className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold md:text-4xl">
              Prêt à explorer ton idée ?
            </motion.h2>
            <motion.p variants={fadeInUp} className="mb-8 text-lg text-muted-foreground">
              Crée ton compte gratuitement et commence ton parcours découverte. Notre IA t&apos;accompagne
              à chaque étape pour transformer ton idée en projet concret.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600" asChild>
                <Link href="/">
                  <Rocket className="h-5 w-5" />
                  Crée ton compte gratuit
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/metiers/test-ia">
                  <Search className="h-5 w-5" />
                  Découvrir les métiers qui recrutent
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}
