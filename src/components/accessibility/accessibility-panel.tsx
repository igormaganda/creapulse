'use client'

import { useState, useEffect } from 'react'
import { Accessibility, X, Type, Contrast, Eye, BookOpen, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAccessibilityStore } from './accessibility-store'
import {
  useReadingLine,
  useDyslexicFont,
  useHighContrast,
  useTextSize,
} from '@/lib/accessibility'
import { cn } from '@/lib/utils'

// Effects component — applies all accessibility settings as side effects
export function AccessibilityEffects() {
  const { textSize, highContrast, readingLine, dyslexicFont, pauseAnimations } = useAccessibilityStore()

  useTextSize(textSize)
  useHighContrast(highContrast)
  useReadingLine(readingLine)
  useDyslexicFont(dyslexicFont)

  // Pause animations via class on <html>
  useEffect(() => {
    if (pauseAnimations) {
      document.documentElement.classList.add('pause-animations')
    } else {
      document.documentElement.classList.remove('pause-animations')
    }
    return () => {
      document.documentElement.classList.remove('pause-animations')
    }
  }, [pauseAnimations])

  return null
}

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false)
  const store = useAccessibilityStore()

  const textSizeOptions = [
    { value: 100, label: 'Normal' },
    { value: 120, label: 'Moyen' },
    { value: 140, label: 'Grand' },
  ]

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-[9000] h-10 w-10 rounded-full shadow-lg bg-background border-border hover:bg-muted"
        onClick={() => setOpen(!open)}
        aria-label="Paramètres d'accessibilité"
        aria-expanded={open}
        aria-controls="a11y-panel"
      >
        <Accessibility className="h-4 w-4" />
      </Button>

      {/* Panel */}
      <div
        id="a11y-panel"
        role="dialog"
        aria-label="Paramètres d'accessibilité"
        aria-hidden={!open}
        className={cn(
          'fixed bottom-20 right-6 z-[9000] w-80 rounded-xl border bg-background p-5 shadow-xl transition-all duration-200',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Accessibilité</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setOpen(false)}
            aria-label="Fermer le panneau d'accessibilité"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Text size */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Type className="h-3.5 w-3.5" />
            Taille du texte
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Taille du texte">
            {textSizeOptions.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={store.textSize === opt.value}
                onClick={() => store.setTextSize(opt.value)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  store.textSize === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                {opt.label}
                <span className="block text-[10px] opacity-70">{opt.value}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle options */}
        <div className="space-y-3">
          <ToggleRow
            icon={<Contrast className="h-3.5 w-3.5" />}
            label="Contraste élevé"
            checked={store.highContrast}
            onCheckedChange={store.setHighContrast}
          />
          <ToggleRow
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Ligne de lecture"
            checked={store.readingLine}
            onCheckedChange={store.setReadingLine}
          />
          <ToggleRow
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label="Police dyslexique"
            checked={store.dyslexicFont}
            onCheckedChange={store.setDyslexicFont}
          />
          <ToggleRow
            icon={<Pause className="h-3.5 w-3.5" />}
            label="Pause des animations"
            checked={store.pauseAnimations}
            onCheckedChange={store.setPauseAnimations}
          />
        </div>
      </div>
    </>
  )
}

function ToggleRow({
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  )
}
