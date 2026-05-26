'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { fadeInUp, staggerContainer, scaleIn } from './landing-shared'

const gidefCards = [
  {
    name: 'GIDEF Paris',
    address: '15 rue de la Paix, 75002 Paris',
    hours: '09:00 - 18:00',
    phone: '01 42 86 12 30',
  },
  {
    name: 'GIDEF Creteil',
    address: '8 avenue de Paris, 94000 Creteil',
    hours: '09:00 - 17:30',
    phone: '01 43 96 78 45',
  },
  {
    name: 'GIDEF Nanterre',
    address: '24 rue Victor Hugo, 92000 Nanterre',
    hours: '09:00 - 18:00',
    phone: '01 47 32 51 89',
  },
]

export function ReseauGIDEFSection() {
  const [searchCode, setSearchCode] = useState('')

  return (
    <section id="reseau" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <MapPin className="mr-1 h-3 w-3" />
            Réseau GIDEF
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Trouvez votre agence GIDEF{' '}
            <span className="text-gradient-teal">la plus proche</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            60 agences en Île-de-France pour un accompagnement de proximité
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          className="mx-auto mt-10 flex max-w-md gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Code postal..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Rechercher
          </Button>
        </motion.div>

        {/* GIDEF cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {gidefCards.map((gidef) => (
            <motion.div key={gidef.name} variants={scaleIn}>
              <Card className="h-full transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{gidef.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {gidef.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0 text-primary" />
                    {gidef.hours}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    {gidef.phone}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full gap-2" onClick={() => toast.info('Formulaire de contact bientôt disponible')}>
                    <MessageCircle className="h-4 w-4" />
                    Contacter
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
