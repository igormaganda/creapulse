'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import {
  Lightbulb,
  Target,
  Calculator,
  Rocket,
  ChevronRight,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from './landing-shared'

const parcoursSteps = [
  {
    icon: Lightbulb,
    step: '01',
    title: 'Idée & Vision',
    subtitle: 'Définissez votre projet',
    tools: '6 outils',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  {
    icon: Target,
    step: '02',
    title: 'Structurer',
    subtitle: 'Modélisez votre activité',
    tools: '10 outils',
    color: 'bg-teal-100 text-primary dark:bg-teal-900/40 dark:text-teal-300',
    ring: 'ring-teal-200 dark:ring-teal-800',
  },
  {
    icon: Calculator,
    step: '03',
    title: 'Financer',
    subtitle: 'Sécurisez votre plan',
    tools: '8 outils',
    color: 'bg-coral-50 text-coral-500 dark:bg-coral-900/20 dark:text-coral-400',
    ring: 'ring-coral-200 dark:ring-coral-800',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Lancer',
    subtitle: 'Immatriculez et développez',
    tools: '6 outils',
    color: 'bg-teal-100 text-primary dark:bg-teal-900/40 dark:text-teal-300',
    ring: 'ring-teal-200 dark:ring-teal-800',
  },
]

export function ParcoursSection() {
  return (
    <section id="parcours" className="bg-muted/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Rocket className="mr-1 h-3 w-3" />
            Guide étape par étape
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Votre parcours <span className="text-gradient-teal">entrepreneurial</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Un chemin structuré en 4 phases pour passer de l&apos;idée à l&apos;entreprise
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="relative mt-12"
        >
          {/* Desktop: horizontal connected steps */}
          <div className="hidden lg:flex lg:items-start lg:justify-between">
            {parcoursSteps.map((step, i) => (
              <motion.div key={step.step} variants={fadeInUp} className="relative flex flex-1 items-start">
                {/* Step card */}
                <div className="flex w-full max-w-[260px] flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full ${step.color} ring-4 ${step.ring} transition-transform hover:scale-110`}
                  >
                    <step.icon className="h-9 w-9" />
                  </div>
                  <span className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Étape {step.step}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
                  <Badge variant="secondary" className="mt-3">
                    {step.tools}
                  </Badge>
                </div>
                {/* Connector line (not on last item) */}
                {i < parcoursSteps.length - 1 && (
                  <div className="absolute top-10 right-0 left-0 z-0 translate-x-1/2">
                    <div className="h-0.5 w-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
                    <ChevronRight className="absolute -top-2.5 right-0 h-5 w-5 text-primary/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Mobile: vertical connected steps */}
          <div className="flex flex-col gap-6 lg:hidden">
            {parcoursSteps.map((step, i) => (
              <motion.div key={step.step} variants={fadeInUp}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${step.color} ring-4 ${step.ring}`}
                    >
                      <step.icon className="h-6 w-6" />
                    </div>
                    {i < parcoursSteps.length - 1 && (
                      <div className="h-12 w-0.5 bg-gradient-to-b from-primary/40 to-primary/10" />
                    )}
                  </div>
                  <div className="pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Étape {step.step}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                    <Badge variant="secondary" className="mt-2">
                      {step.tools}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
