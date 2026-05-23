'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBureauStore } from './bureau-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Lightbulb,
  Rocket,
  Target,
  Calculator,
  FileText,
  GraduationCap,
  Globe,
  Sparkles,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ─── Step configurations ─── */
const steps = [
  {
    id: 1,
    title: 'Votre profil',
    subtitle: 'Apprenons à vous connaître',
  },
  {
    id: 2,
    title: 'Votre parcours',
    subtitle: 'Choisissez votre étape actuelle',
  },
  {
    id: 3,
    title: 'Vos outils',
    subtitle: 'Sélectionnez vos priorités',
  },
]

/* ─── Parcours options ─── */
const parcoursOptions = [
  {
    id: 'idee',
    icon: Lightbulb,
    title: 'Je découvre une idée',
    description: 'J\'ai un projet en tête, je veux explorer sa viabilité',
    color: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
    selectedColor: 'border-amber-500 ring-amber-500/30 bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: 'structurer',
    icon: Target,
    title: 'Je structure mon projet',
    description: 'Mon idée est validée, je veux la transformer en business',
    color: 'border-teal-400 bg-teal-50 dark:bg-teal-900/20',
    selectedColor: 'border-primary ring-primary/30 bg-teal-100 dark:bg-teal-900/30',
  },
  {
    id: 'financer',
    icon: Calculator,
    title: 'Je cherche des financements',
    description: 'Mon business plan est prêt, je sécurise ma trésorerie',
    color: 'border-coral-400 bg-coral-50 dark:bg-coral-900/20',
    selectedColor: 'border-coral-500 ring-coral-500/30 bg-coral-100 dark:bg-coral-900/30',
  },
  {
    id: 'lancer',
    icon: Rocket,
    title: 'Je lance mon entreprise',
    description: 'Je suis prêt à immatriculer et démarrer mon activité',
    color: 'border-green-400 bg-green-50 dark:bg-green-900/20',
    selectedColor: 'border-green-500 ring-green-500/30 bg-green-100 dark:bg-green-900/30',
  },
]

/* ─── Tool options ─── */
const toolOptions = [
  { id: 'riasec', icon: User, label: 'Diagnostic RIASEC' },
  { id: 'creasim', icon: Calculator, label: 'CreaSim' },
  { id: 'business-plan', icon: FileText, label: 'Business Plan IA' },
  { id: 'marche', icon: Globe, label: 'Étude de marché' },
  { id: 'mentorat', icon: GraduationCap, label: 'Mentorat' },
  { id: 'passeport', icon: Sparkles, label: 'Passeport' },
]

/* ─── Animation ─── */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

/* ─── Welcome / Onboarding Component ─── */
export function Welcome() {
  const { completeOnboarding, setUserName } = useBureauStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    parcours: '',
    tools: [] as string[],
  })

  const totalSteps = steps.length
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }

  const handleComplete = () => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim()
    if (fullName) setUserName(fullName)
    completeOnboarding()
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.firstName.trim().length > 0
      case 1: return formData.parcours !== ''
      case 2: return formData.tools.length > 0
      default: return true
    }
  }

  const toggleTool = (toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }))
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Étape {currentStep + 1} sur {totalSteps}
            </span>
            <button
              onClick={handleComplete}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              Passer l'introduction
            </button>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Step title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            {steps[currentStep].title}
          </h2>
          <p className="mt-1 text-muted-foreground">{steps[currentStep].subtitle}</p>
        </div>

        {/* Step content with animation */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm min-h-[320px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="p-6 md:p-8"
            >
              {/* Step 1: Profile */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        placeholder="Votre prénom"
                        value={formData.firstName}
                        onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        placeholder="Votre nom"
                        value={formData.lastName}
                        onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Ces informations nous permettent de personnaliser votre expérience.
                  </p>
                </div>
              )}

              {/* Step 2: Parcours */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {parcoursOptions.map((option) => {
                      const isSelected = formData.parcours === option.id
                      return (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData((p) => ({ ...p, parcours: option.id }))}
                          className={cn(
                            'flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200 cursor-pointer',
                            isSelected ? option.selectedColor + ' ring-4' : option.color
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <option.icon className={cn(
                              'h-5 w-5',
                              isSelected ? 'text-foreground' : 'text-muted-foreground'
                            )} />
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm font-semibold">{option.title}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Tools */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Sélectionnez les outils que vous souhaitez utiliser en priorité.
                    Vous pourrez modifier ce choix à tout moment.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {toolOptions.map((tool) => {
                      const isSelected = formData.tools.includes(tool.id)
                      return (
                        <motion.button
                          key={tool.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleTool(tool.id)}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer',
                            isSelected
                              ? 'border-primary bg-primary/5 ring-4 ring-primary/20'
                              : 'border-border hover:border-primary/40 hover:bg-muted/50'
                          )}
                        >
                          <tool.icon className={cn(
                            'h-6 w-6',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          <span className={cn(
                            'text-xs font-medium text-center',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )}>
                            {tool.label}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
                )}
              />
            ))}
          </div>

          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Commencer
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
