'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { fadeInUp, staggerContainer } from './landing-shared'

export function CtaFinalSection({ onRegisterOpen }: { onRegisterOpen: () => void }) {
  return (
    <section id="cta" className="relative overflow-hidden py-12 md:py-16">
      {/* Background */}
      <div className="gradient-teal absolute inset-0" />
      {/* Decorative circles */}
      <div aria-hidden="true" className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-white/5" />
      <div aria-hidden="true" className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-white/5" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Prêt à créer votre entreprise ?
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mt-4 text-lg text-white/80"
        >
          Rejoignez les 50 000 entrepreneurs qui nous font confiance. Commencez gratuitement.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Button
            size="lg"
            className="gap-2 bg-white text-primary font-semibold hover:bg-white/90"
            onClick={onRegisterOpen}
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
            onClick={() => toast.info('Demande de démo envoyée ! Nous vous recontacterons sous 24h.')}
          >
            Demander une démo
            <MessageCircle className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}
