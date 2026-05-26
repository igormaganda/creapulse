'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calculator,
  FileText,
  Award,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { fadeInUp, staggerContainer, scaleIn } from './landing-shared'

const outilsCards = [
  {
    icon: Calculator,
    title: 'CreaSim',
    description: 'Simulateur financier interactif',
    details: 'Estimez vos charges, revenus et rentabilité en quelques clics.',
    gradient: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/10',
    iconColor: 'text-primary',
  },
  {
    icon: FileText,
    title: 'Business Plan IA',
    description: 'Éditeur intelligent 22 sections',
    details: 'Générez un business plan professionnel avec l\'aide de l\'IA.',
    gradient: 'from-coral-50 to-amber-50 dark:from-coral-900/10 dark:to-amber-900/10',
    iconColor: 'text-coral-500',
  },
  {
    icon: Award,
    title: 'Passeport Entrepreneurial',
    description: 'Certifiez votre parcours',
    details: 'Obtenez une certification reconnue par les partenaires financiers.',
    gradient: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Sparkles,
    title: 'IA Marketing',
    description: 'Stratégie communication auto',
    details: 'Planifiez et optimisez votre stratégie marketing grâce à l\'IA.',
    gradient: 'from-teal-50 to-coral-50 dark:from-teal-900/10 dark:to-coral-900/10',
    iconColor: 'text-primary',
  },
]

export function OutilsSection() {
  return (
    <section id="outils" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Zap className="mr-1 h-3 w-3" />
            Outils puissants
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Vos outils de{' '}
            <span className="text-gradient-teal">création d&apos;entreprise</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Des outils conçus pour vous accompagner à chaque étape
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {outilsCards.map((outil) => (
            <motion.div key={outil.title} variants={scaleIn}>
              <Card className="group h-full overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className={`h-2 bg-gradient-to-r ${outil.gradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <outil.icon className={`h-6 w-6 ${outil.iconColor}`} />
                  </div>
                  <CardTitle className="mt-2 text-lg">{outil.title}</CardTitle>
                  <CardDescription className="text-sm font-medium">
                    {outil.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{outil.details}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Essayer
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
