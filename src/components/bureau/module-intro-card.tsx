'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface IntroBenefit {
  icon: LucideIcon
  text: string
}

interface ModuleIntroCardProps {
  /** Module name displayed in the title */
  title: string
  /** Short description of the module's purpose */
  description: string
  /** Estimated time to complete */
  duration?: string
  /** Phase badge text (e.g. "Parcours", "Stratégie") */
  phase?: string
  /** Icon for the module */
  icon: LucideIcon
  /** Color classes for the icon container */
  iconColor?: string
  /** List of benefits / what the user will gain */
  benefits: IntroBenefit[]
  /** Label for the CTA button */
  ctaLabel?: string
  /** Optional secondary action (e.g. "Importer des données") */
  secondaryLabel?: string
  /** Called when user clicks the main CTA */
  onStart: () => void
  /** Called when user clicks the secondary action */
  onSecondary?: () => void
  /** Whether the user has already started (hides this card) */
  hasStarted: boolean
}

export function ModuleIntroCard({
  title,
  description,
  duration,
  phase,
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
  benefits,
  ctaLabel = 'Commencer',
  secondaryLabel,
  onStart,
  onSecondary,
  hasStarted,
}: ModuleIntroCardProps) {
  // Don't render if user has already started
  if (hasStarted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start justify-center min-h-[50vh] p-4 md:p-8"
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className={cn('inline-flex h-16 w-16 items-center justify-center rounded-2xl', iconColor)}>
            <Icon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {phase && (
                <Badge variant="outline" className="text-xs">
                  {phase}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">{description}</p>
            {duration && (
              <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5" />
                Durée estimée : {duration}
              </p>
            )}
          </div>
        </div>

        {/* Benefits */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Ce que vous allez accomplir</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit, i) => {
                const BIcon = benefit.icon
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <BIcon className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{benefit.text}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={onStart}>
            {ctaLabel}
          </Button>
          {secondaryLabel && onSecondary && (
            <Button size="lg" variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* Small clock icon to avoid importing a new icon */
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}