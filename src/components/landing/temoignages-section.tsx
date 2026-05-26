'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Heart, Star, MapPin, Play, Pause } from 'lucide-react'
import { fadeInUp } from './landing-shared'

const temoignages = [
  {
    initials: 'MD',
    name: 'Marie D.',
    city: 'Créteil',
    quote:
      "CreaPulse m'a permis de structurer mon projet de boulangerie en 3 mois. Le simulateur financier m'a donné confiance pour me lancer.",
    rating: 5,
  },
  {
    initials: 'TL',
    name: 'Thomas L.',
    city: 'Nanterre',
    quote:
      "Le Business Plan IA est incroyable. En quelques heures, j'avais un document professionnel que ma banque a validé.",
    rating: 5,
  },
  {
    initials: 'SM',
    name: 'Sophie M.',
    city: 'Paris',
    quote:
      "L'accompagnement personnalisé et les outils de diagnostic m'ont aidé à trouver mon réseau GIDEF local.",
    rating: 5,
  },
]

export function TemoignagesSection() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!api) return
    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }
    api.on('select', handleSelect)
    return () => {
      api.off('select', handleSelect)
    }
  }, [api])

  // Auto-play with pause control
  useEffect(() => {
    if (!api || isPaused) return
    const interval = setInterval(() => {
      api.scrollNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [api, isPaused])

  return (
    <section className="bg-muted/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="text-center"
        >
          <Badge variant="secondary" className="mb-3">
            <Heart className="mr-1 h-3 w-3" />
            Témoignages
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ils ont créé leur entreprise avec{' '}
            <span className="text-gradient-teal">CreaPulse</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="mx-auto mt-12 max-w-3xl"
        >
          <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {temoignages.map((temoignage, i) => (
                <CarouselItem key={i}>
                  <Card className="border-0 bg-card shadow-lg">
                    <CardContent className="p-6 sm:p-8">
                      {/* Stars */}
                      <div className="mb-4 flex gap-1">
                        {[...Array(temoignage.rating)].map((_, j) => (
                          <Star
                            key={j}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      {/* Quote */}
                      <blockquote className="text-base leading-relaxed text-foreground sm:text-lg">
                        &ldquo;{temoignage.quote}&rdquo;
                      </blockquote>
                      {/* Author */}
                      <div className="mt-6 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {temoignage.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{temoignage.name}</p>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {temoignage.city}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 sm:-left-12" />
            <CarouselNext className="right-0 top-1/2 -translate-y-1/2 translate-x-1/2 sm:-right-12" />
          </Carousel>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {temoignages.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-primary' : 'w-2 bg-primary/30'
                }`}
                aria-label={`Aller au temoignage ${i + 1}`}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label={isPaused ? 'Reprendre le défilement' : 'Mettre en pause'}
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {isPaused ? 'Reprendre' : 'Pause'}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
