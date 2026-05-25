'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { getCategoryBySlug } from '@/lib/metiers-data'
import { QuizEngine } from '@/components/metiers/quiz-engine'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  GraduationCap,
  Heart,
  Code,
  TrendingUp,
  Palette,
  Brain,
  ArrowRight,
  Quote,
  Sparkles,
  Target,
  Compass,
  Briefcase,
  BookOpen,
  Award,
  Wallet,
  MapPin,
  Zap,
  Users,
  Handshake,
  Rocket,
  Globe,
  Phone,
  User,
  Building2,
  ShoppingCart,
  Home,
  Truck,
  Paintbrush,
  Wrench,
  Leaf,
  Camera,
  Film,
  Megaphone,
  Blocks,
  Monitor,
  Smile,
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Home, Truck, Paintbrush, Wrench, Leaf, Users, Heart, Smile,
  GraduationCap, Handshake, BookOpen, Megaphone, Blocks, Monitor,
  Camera, Brain, Film, Rocket, Briefcase, User, Building2, ShoppingCart,
  Award, Globe, Palette, Code, TrendingUp, Wallet, MapPin,
}

export default function FormationPage() {
  const data = getCategoryBySlug('formation')
  if (!data) return null

  const demandColor = (demand: string) => {
    switch (demand) {
      case 'très élevée': return 'bg-red-500 text-white'
      case 'élevée': return 'bg-orange-500 text-white'
      case 'croissante': return 'bg-emerald-500 text-white'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const parcoursIcon = (icon: string) => iconMap[icon] || Briefcase

  const financementOptions = [
    {
      icon: Wallet,
      title: 'CPF',
      subtitle: 'Compte Personnel de Formation',
      description: 'Jusqu\'à 5 000€ de droits acquis pour te former tout au long de ta vie professionnelle. Disponible sur moncompteformation.gouv.fr.',
      color: 'bg-emerald-100 text-emerald-700',
      badge: 'Jusqu\'à 5 000€',
    },
    {
      icon: Briefcase,
      title: 'Pôle Emploi',
      subtitle: 'France Travail',
      description: 'Formations financées pour les demandeurs d\'emploi. Accompagnement personnalisé par un conseiller tout au long de ton parcours.',
      color: 'bg-teal-100 text-teal-700',
      badge: '100% financé',
    },
    {
      icon: MapPin,
      title: 'Région IDF',
      subtitle: 'Aides régionales',
      description: 'La Région Île-de-France finance des formations prioritaires dans les secteurs en tension. Vérifie ton éligibilité.',
      color: 'bg-amber-100 text-amber-700',
      badge: 'Aides variables',
    },
    {
      icon: BookOpen,
      title: 'Alternance',
      subtitle: 'Formation rémunérée',
      description: 'Contrat d\'apprentissage ou de professionnalisation : tu te formes tout en percevant un salaire de l\'entreprise.',
      color: 'bg-cyan-100 text-cyan-700',
      badge: 'Rémunéré',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 py-20 md:py-28">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-20 top-16 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <GraduationCap className="h-5 w-5" />
              Formation & Reconversion
            </motion.div>
            <motion.h1 variants={fadeInUp} className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              {data.heroTitle}
            </motion.h1>
            <motion.p variants={fadeInUp} className="mx-auto mb-10 max-w-2xl text-lg text-white/90 md:text-xl">
              {data.heroSubtitle}
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2 bg-white text-emerald-700 hover:bg-white/90"
                onClick={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {data.heroCta}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
                <WalletIcon className="h-5 w-5" />
                Voir les financements
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 p-6 md:grid-cols-4 md:p-8">
          {data.stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-emerald-600 md:text-4xl">
                {stat.value}<span className="text-lg">{stat.suffix}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. METIERS EN TENSION */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              Les métiers qui recrutent
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              Des formations qualifiantes qui mènent directement à l&apos;emploi
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.metiers.map((metier) => {
              const MetierIcon = iconMap[metier.icon] || Briefcase
              return (
                <motion.div key={metier.title} variants={fadeInUp}>
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                          <MetierIcon className="h-6 w-6 text-emerald-700" />
                        </div>
                        <Badge className={demandColor(metier.demand)}>
                          {metier.demand}
                        </Badge>
                      </div>
                      <CardTitle className="mt-3 text-lg">{metier.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Salaire</span>
                        <span className="font-semibold">{metier.salary}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Formation</span>
                        <span className="font-medium">{metier.training}</span>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-2 text-sm">
                        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-muted-foreground">{metier.evolution}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* 4. QUIZ SECTION */}
      <section id="quiz" className="scroll-mt-20 bg-muted/30 py-16">
        <div className="mx-auto max-w-2xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <QuizEngine category={data} />
          </motion.div>
        </div>
      </section>

      {/* 5. TEMOIGNAGES */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              Ils ont trouvé leur voie
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              Des reconversions réussies grâce à la bonne formation
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {data.temoignages.map((tem) => (
              <motion.div key={tem.name} variants={fadeInUp}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <Quote className="mb-4 h-8 w-8 text-emerald-300" />
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
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
                    <Badge variant="secondary">{tem.metier}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6. FINANCEMENT SECTION */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.div variants={fadeInUp} className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              <Wallet className="h-4 w-4" />
              Financement
            </motion.div>
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              Comment financer ta formation ?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              Plusieurs dispositifs existent pour financer ta reconversion professionnelle
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2"
          >
            {financementOptions.map((option) => (
              <motion.div key={option.title} variants={fadeInUp}>
                <Card className="h-full border-2 border-transparent transition-all hover:border-emerald-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${option.color}`}>
                        <option.icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{option.title}</h3>
                          <Badge className="bg-emerald-600 text-white">{option.badge}</Badge>
                        </div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">{option.subtitle}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 7. IA SECTION */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              L&apos;IA analyse ton potentiel
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              Notre algorithme identifie la formation et le métier les plus adaptés à ton profil
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
              { icon: Brain, title: 'Analyse comportementale', desc: 'L\'IA évalue tes motivations, ta capacité d\'apprentissage et ta détermination à changer de voie.' },
              { icon: Sparkles, title: 'Soft skills mapping', desc: 'Cartographie de tes compétences : adaptabilité, persévérance, esprit pratique, projet professionnel.' },
              { icon: Target, title: 'Matching métier', desc: 'Algorithme de compatibilité qui croise ton profil avec les formations les plus adaptées.' },
              { icon: Compass, title: 'Orientation intelligente', desc: 'Recommandations personnalisées basées sur ta situation, tes envies et les financements disponibles.' },
            ].map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full text-center">
                  <CardContent className="flex flex-col items-center p-6">
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

      {/* 8. PARCOURS POSSIBLES */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mb-10 text-center">
            <motion.h2 variants={fadeInUp} className="mb-3 text-3xl font-bold">
              Parcours possibles
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              Des voies variées selon ta situation et tes objectifs professionnels
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {data.parcours.map((p) => {
              const PIcon = parcoursIcon(p.icon)
              return (
                <motion.div key={p.title} variants={fadeInUp}>
                  <Card className="h-full">
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                        <PIcon className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-semibold">{p.title}</h3>
                          <Badge variant="outline" className="text-xs">{p.duration}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="bg-gradient-to-br from-primary/10 via-transparent to-primary/5 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold">
              Prêt à découvrir ton futur métier ?
            </motion.h2>
            <motion.p variants={fadeInUp} className="mb-8 text-lg text-muted-foreground">
              Fais le test IA et découvre quelle formation correspond le mieux à ton profil. C&apos;est gratuit et ça prend moins de 5 minutes.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Sparkles className="h-5 w-5" />
                Faire le test IA
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Phone className="h-5 w-5" />
                Être recontacté
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
          <Link href="/metiers/test-ia" className="hover:text-foreground">Tous les tests métiers</Link>
          <p className="mt-2">© 2025 GIDEF — Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  )
}
