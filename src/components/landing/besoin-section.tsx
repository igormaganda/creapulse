'use client'

import Link from 'next/link'
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
  Lightbulb,
  Rocket,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react'
import { fadeInUp, staggerContainer, scaleIn } from './landing-shared'

const besoinCards = [
  {
    icon: Lightbulb,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-500',
    title: 'Je découvre une idée',
    href: '/besoin/decouvrir-idee',
    description:
      'Vous avez un projet en tête ? Explorez votre idée, testez sa viabilité et validez votre marché avec nos outils de diagnostic.',
    borderColor: 'hover:border-amber-400',
  },
  {
    icon: Rocket,
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-primary',
    title: 'Je crée mon entreprise',
    href: '/besoin/creer-entreprise',
    description:
      'De la structuration juridique au business plan, suivez chaque étape pour immatriculer votre société en toute sérénité.',
    borderColor: 'hover:border-primary',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-coral-50 dark:bg-coral-900/20',
    iconColor: 'text-coral-500',
    title: 'Je développe mon activité',
    href: '/besoin/developper-activite',
    description:
      'Votre entreprise est lancée ? Accompagnez votre croissance avec nos outils marketing, financier et de réseau.',
    borderColor: 'hover:border-coral-400',
  },
]

export function BesoinSection() {
  return (
    <section id="besoin" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Target className="mr-1 h-3 w-3" />
            Par où commencer ?
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Quel est <span className="text-gradient-teal">votre besoin</span> ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            CreaPulse s&apos;adapte à chaque étape de votre parcours entrepreneurial
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {besoinCards.map((card) => (
            <motion.div key={card.title} variants={scaleIn}>
              <Link href={card.href}>
                <Card
                  className={`group cursor-pointer border-2 border-transparent bg-card transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${card.borderColor}`}
                >
                  <CardHeader className="pb-3">
                    <div
                      className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg}`}
                    >
                      <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                    </div>
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {card.description}
                    </CardDescription>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Commencer
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
