'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import metiersCategories from '@/lib/metiers-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  HardHat,
  Heart,
  Monitor,
  GraduationCap,
  Rocket,
  ArrowRight,
  Quote,
  Brain,
  Sparkles,
  Target,
  Compass,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  Users,
  Phone,
} from 'lucide-react'
import React from 'react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  btp: HardHat,
  social: Heart,
  numerique: Monitor,
  formation: GraduationCap,
  entrepreneuriat: Rocket,
}

const categoryGradients: Record<string, string> = {
  btp: 'from-amber-500 via-orange-500 to-amber-600',
  social: 'from-rose-500 via-pink-500 to-rose-600',
  numerique: 'from-cyan-500 via-teal-500 to-cyan-600',
  formation: 'from-emerald-500 via-teal-500 to-emerald-600',
  entrepreneuriat: 'from-orange-500 via-amber-500 to-orange-600',
}

const categoryColors: Record<string, string> = {
  btp: 'text-amber-600 bg-amber-100',
  social: 'text-rose-600 bg-rose-100',
  numerique: 'text-cyan-600 bg-cyan-100',
  formation: 'text-emerald-600 bg-emerald-100',
  entrepreneuriat: 'text-orange-600 bg-orange-100',
}

// Cross-category testimonials for the hub page
const hubTestimonials = [
  {
    name: 'Youssef K.',
    age: 20,
    before: 'Je passais mes journées sur TikTok sans but. Mes parents disaient que je perdais mon temps.',
    after: 'J\'ai fait une formation CM de 4 mois. Aujourd\'hui je gère les réseaux de 3 clients et je travaille en freelance.',
    metier: 'Community Manager',
    initials: 'YK',
    category: 'Numérique',
  },
  {
    name: 'Mamadou D.',
    age: 22,
    before: 'Sans diplôme, je galérais à trouver un premier emploi. Personne ne me donnait ma chance.',
    after: 'En 8 mois de formation électricité, j\'ai décroché mon premier CDI à 2 100€. Aujourd\'hui je gère mes propres chantiers.',
    metier: 'Électricien',
    initials: 'MD',
    category: 'BTP',
  },
  {
    name: 'Aïcha M.',
    age: 24,
    before: 'Je travaillais dans la vente mais je ressentais un manque de sens. Je voulais aider les gens.',
    after: 'La formation d\'AESH a été une révélation. Aujourd\'hui j\'accompagne un enfant autiste et chaque journée compte.',
    metier: 'AESH',
    initials: 'AM',
    category: 'Social',
  },
]

export default function TestIaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 py-20 md:py-28">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-24 w-24 rounded-2xl bg-white/5 rotate-12" />
        <div className="absolute right-1/4 bottom-1/3 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
              Test IA — Horizon Emplois
            </motion.div>
            <motion.h1 variants={fadeInUp} className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Découvre le métier fait pour toi grâce à l&apos;IA
            </motion.h1>
            <motion.p variants={fadeInUp} className="mx-auto mb-10 max-w-2xl text-lg text-white/90 md:text-xl">
              Réponds à un quiz intelligent et laisse notre algorithme analyser tes compétences pour te proposer le métier qui te correspond vraiment. BTP, Social, Numérique, Formation ou Entrepreneuriat — trouve ta voie.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/80">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />100% gratuit</span>
              <span className="flex items-center gap-1"><Target className="h-4 w-4" />Résultats instantanés</span>
              <span className="flex items-center gap-1"><Brain className="h-4 w-4" />Analyse IA</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />5 domaines</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. QUIZ CARDS GRID */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              Choisis ton domaine
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              Sélectionne le secteur qui t&apos;intéresse et passe le test IA personnalisé
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {metiersCategories.map((cat) => {
              const CategoryIcon = categoryIcons[cat.slug] || Brain
              const gradient = categoryGradients[cat.slug] || 'from-teal-500 to-teal-600'
              const colors = categoryColors[cat.slug] || 'text-teal-600 bg-teal-100'

              return (
                <motion.div key={cat.slug} variants={fadeInUp}>
                  <Link href={`/metiers/${cat.slug}`}>
                    <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                      {/* Gradient top bar */}
                      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                      <CardContent className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors}`}>
                            <CategoryIcon className="h-7 w-7" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {cat.quizQuestions.length} questions
                          </Badge>
                        </div>
                        <h3 className="mb-1 text-xl font-bold">{cat.title}</h3>
                        <p className="mb-4 text-sm text-muted-foreground">{cat.subtitle}</p>

                        <div className="mb-4 rounded-lg bg-muted/50 p-3">
                          <p className="text-sm font-medium">{cat.quizTitle}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-wrap gap-1.5">
                            {cat.competencies.slice(0, 3).map((comp) => (
                              <Badge key={comp} variant="outline" className="text-xs font-normal">
                                {comp}
                              </Badge>
                            ))}
                            {cat.competencies.length > 3 && (
                              <Badge variant="outline" className="text-xs font-normal">
                                +{cat.competencies.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Commencer le test
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}

            {/* Info card - what the IA analyzes */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full border-dashed bg-gradient-to-br from-primary/5 to-amber-500/5">
                <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">Analyse IA complète</h3>
                  <p className="text-sm text-muted-foreground">
                    Chaque test évalue tes compétences, ta personnalité et tes motivations pour te proposer un matching personnalisé.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Soft skills', 'Personnalité', 'Motivations', 'Matching'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. IA ANALYSIS SECTION */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.div variants={fadeInUp} className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Brain className="h-4 w-4" />
              Comment ça marche ?
            </motion.div>
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              L&apos;IA qui comprend qui tu es
            </motion.h2>
            <motion.p variants={fadeInUp} className="mx-auto max-w-2xl text-muted-foreground">
              Notre algorithme de matching utilise l&apos;intelligence artificielle pour analyser tes réponses et identifier les métiers qui correspondent le mieux à ton profil unique.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: Target,
                title: 'Quiz personnalisé',
                desc: '7 questions ciblées par domaine qui évaluent tes aptitudes, tes envies et ta personnalité.',
                step: '01',
              },
              {
                icon: BarChart3,
                title: 'Analyse multidimensionnelle',
                desc: 'Chaque réponse est pondérée et croisée avec les compétences clés de chaque métier.',
                step: '02',
              },
              {
                icon: Lightbulb,
                title: 'Matching intelligent',
                desc: 'L\'IA compare ton profil aux exigences de chaque métier et calcule un score de compatibilité.',
                step: '03',
              },
              {
                icon: Compass,
                title: 'Orientation sur mesure',
                desc: 'Tu reçois un classement personnalisé avec tes top 3 métiers et des conseils concrets.',
                step: '04',
              },
            ].map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full relative overflow-hidden">
                  <CardContent className="p-6">
                    <span className="absolute right-4 top-4 text-5xl font-black text-muted-foreground/10">
                      {feature.step}
                    </span>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. TEMOIGNAGES */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              Ils ont trouvé leur voie grâce à l&apos;IA
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              Des témoignages de personnes qui ont découvert leur métier idéal
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {hubTestimonials.map((tem) => (
              <motion.div key={tem.name} variants={fadeInUp}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <Quote className="mb-4 h-8 w-8 text-primary/30" />
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {tem.initials}
                      </div>
                      <div>
                        <p className="font-semibold">{tem.name}</p>
                        <p className="text-sm text-muted-foreground">{tem.age} ans</p>
                      </div>
                    </div>
                    <div className="mb-4 rounded-lg bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-700">Avant</p>
                      <p className="mt-1 text-sm text-red-600/80">{tem.before}</p>
                    </div>
                    <div className="mb-4 rounded-lg bg-emerald-50 p-3">
                      <p className="text-sm font-medium text-emerald-700">Après</p>
                      <p className="mt-1 text-sm text-emerald-600/80">{tem.after}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{tem.metier}</Badge>
                      <Badge variant="outline" className="text-xs">{tem.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. STATS */}
      <section className="border-y bg-card py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {[
            { value: '287 000', suffix: '+', label: 'Postes vacants en IDF' },
            { value: '5', suffix: '', label: 'Domaines métiers' },
            { value: '35', suffix: '', label: 'Tests de compatibilité' },
            { value: '89', suffix: '%', label: 'Taux de satisfaction' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-primary md:text-4xl">
                {stat.value}<span className="text-lg">{stat.suffix}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="bg-gradient-to-br from-primary/10 via-transparent to-amber-500/5 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold">
              Prêt à découvrir ton avenir professionnel ?
            </motion.h2>
            <motion.p variants={fadeInUp} className="mb-8 text-lg text-muted-foreground">
              Il n&apos;est jamais trop tard pour trouver sa voie. Chois un domaine ci-dessus, passe le test IA en 5 minutes et reçois tes résultats personnalisés. C&apos;est gratuit.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-teal-500 text-white"
                asChild
              >
                <Link href="#quiz-cards">
                  <Sparkles className="h-5 w-5" />
                  Commencer un test
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Phone className="h-5 w-5" />
                Être recontacté par un conseiller
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">CreaPulse</Link>
          <span className="mx-2">·</span>
          <span className="text-foreground/70">Horizon Emplois</span>
          <p className="mt-2">© 2025 GIDEF — Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}
