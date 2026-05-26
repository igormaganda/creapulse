'use client'

import { motion } from 'framer-motion'
import { Handshake } from 'lucide-react'
import { fadeInUp } from './landing-shared'

const partenaires = [
  'BPI France',
  'France Travail',
  'Région Île-de-France',
  'CCI Île-de-France',
  'Banque Populaire',
]

export function PartenairesSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Nos partenaires de confiance
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {partenaires.map((nom) => (
              <div
                key={nom}
                className="flex h-14 items-center rounded-xl border border-border bg-card px-6 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary"
              >
                <Handshake className="mr-2 h-4 w-4" />
                {nom}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
