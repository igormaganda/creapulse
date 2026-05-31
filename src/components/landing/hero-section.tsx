'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  ArrowRight,
  Search,
  Calculator,
  Award,
  FileText,
  Rocket,
  Star,
  Briefcase,
} from 'lucide-react'
import { useCountUp, fadeInUp, staggerContainer } from './landing-shared'

export function HeroSection({ onRegisterOpen }: { onRegisterOpen: () => void }) {
  const stat1 = useCountUp(50000, 2200)
  const stat2 = useCountUp(60, 1800)
  const stat3 = useCountUp(150, 2000)
  const stat4 = useCountUp(1900, 2400)

  return (
    <section className="gradient-hero overflow-hidden pt-[120px] pb-12 md:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-teal-100 text-primary hover:bg-teal-100 dark:bg-teal-900/40">
                <Sparkles className="mr-1 h-3 w-3" />
                Nouveau : IA intégrée à tous vos outils
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Accompagnement de l&apos;<span className="text-gradient-teal">idée</span> jusqu&apos;à{' '}
              <span className="text-gradient-accent">l&apos;entreprise</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-lg text-muted-foreground sm:text-xl"
            >
              Le bureau virtuel qui accompagne 50 000 créateurs par an.
              Structurez, financez et lancez votre projet avec confiance.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
            >
              <Button size="lg" className="gap-2 text-base font-semibold" onClick={onRegisterOpen} aria-label="Commencer mon parcours entrepreneurial">
                Commencer mon parcours
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-base" onClick={() => document.getElementById('outils')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Découvrir les outils du bureau virtuel">
                Découvrir les outils
                <Search className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — illustration placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto aspect-square max-w-md rounded-3xl gradient-teal p-1">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-card p-8">
                {/* Floating cards composition */}
                <div className="relative h-full w-full">
                  {/* Card 1 — top-left */}
                  <div className="animate-float absolute -top-2 left-0 rounded-2xl border border-teal-100 bg-white p-4 shadow-lg dark:bg-slate-800/80 dark:border-teal-900/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                        <Calculator className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">CreaSim</p>
                        <p className="text-xs text-muted-foreground">+23% rentabilité</p>
                      </div>
                    </div>
                  </div>
                  {/* Card 2 — top-right */}
                  <div
                    className="animate-float absolute -top-2 right-0 rounded-2xl border border-amber-100 bg-white p-4 shadow-lg dark:bg-slate-800/80 dark:border-amber-900/30"
                    style={{ animationDelay: '0.5s' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                        <Award className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Passeport</p>
                        <p className="text-xs text-muted-foreground">Certifié</p>
                      </div>
                    </div>
                  </div>
                  {/* Card 3 — bottom-left */}
                  <div
                    className="animate-float absolute bottom-16 left-4 rounded-2xl border border-coral-100 bg-white p-4 shadow-lg dark:bg-slate-800/80 dark:border-coral-900/30"
                    style={{ animationDelay: '1s' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 dark:bg-coral-900/20">
                        <FileText className="h-5 w-5 text-coral-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Business Plan</p>
                        <p className="text-xs text-muted-foreground">IA Générée</p>
                      </div>
                    </div>
                  </div>
                  {/* Card 4 — center bottom */}
                  <div
                    className="animate-float absolute bottom-0 right-4 rounded-2xl border border-teal-100 bg-white p-5 shadow-lg dark:bg-slate-800/80 dark:border-teal-900/30"
                    style={{ animationDelay: '1.5s' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                        <Rocket className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Entreprise créée !</p>
                        <div className="mt-1 flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Central pulse circle */}
                  <div className="animate-pulse-glow absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8"
        >
          {[
            { ref: stat1.ref, count: stat1.count, suffix: '', label: 'accompagnés' },
            { ref: stat2.ref, count: stat2.count, suffix: '', label: 'agences GIDEF' },
            { ref: stat3.ref, count: stat3.count, suffix: '', label: 'conseillers' },
            { ref: stat4.ref, count: stat4.count, suffix: '', label: 'entreprises créées' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              ref={stat.ref}
              variants={fadeInUp}
              className="text-center"
            >
              <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                {stat.count.toLocaleString('fr-FR')}
                {stat.suffix}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
