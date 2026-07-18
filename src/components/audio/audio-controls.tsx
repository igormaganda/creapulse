'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Mic, MicOff, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { useAudioHelper, type MatchOptions } from '@/lib/hooks/useAudioHelper'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AudioControlsProps {
  /** Text to read aloud when the read button is clicked */
  readText?: string
  /** Called when a voice transcript is finalized */
  onVoiceResult?: (transcript: string) => void
  /** Whether auto-advance is externally controlled */
  autoAdvance?: boolean
  onAutoAdvanceChange?: (enabled: boolean) => void
  /** Compact mode — smaller buttons, no transcript display */
  compact?: boolean
  /** Additional CSS class */
  className?: string
  /**
   * Optional match options for voice answer matching.
   * When provided, the component will call `matchVoiceAnswer` internally
   * on each final transcript and fire `onVoiceResult` with the matched value
   * when auto-advance is active.
   */
  matchOptions?: MatchOptions
}

// ---------------------------------------------------------------------------
// Transcript fade duration (ms)
// ---------------------------------------------------------------------------

const TRANSCRIPT_FADE_MS = 3000

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AudioControls({
  readText,
  onVoiceResult,
  autoAdvance: externalAutoAdvance,
  onAutoAdvanceChange,
  compact = false,
  className,
  matchOptions,
}: AudioControlsProps) {
  const {
    speak,
    stop,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    lastTranscript,
    matchVoiceAnswer,
    autoAdvanceOnVoice: internalAutoAdvance,
    setAutoAdvanceOnVoice,
    speechRecognitionSupported,
    speechSynthesisSupported,
  } = useAudioHelper()

  // -----------------------------------------------------------------------
  // Auto-advance state (internal or external)
  // -----------------------------------------------------------------------

  const isAutoAdvance =
    externalAutoAdvance !== undefined ? externalAutoAdvance : internalAutoAdvance

  const handleAutoAdvanceToggle = useCallback(() => {
    if (externalAutoAdvance !== undefined && onAutoAdvanceChange) {
      onAutoAdvanceChange(!externalAutoAdvance)
    } else {
      setAutoAdvanceOnVoice(!internalAutoAdvance)
    }
  }, [externalAutoAdvance, internalAutoAdvance, onAutoAdvanceChange, setAutoAdvanceOnVoice])

  // -----------------------------------------------------------------------
  // Interim transcript (shown live while listening)
  // -----------------------------------------------------------------------

  const [interimText, setInterimText] = useState('')
  const [displayedTranscript, setDisplayedTranscript] = useState('')
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // -----------------------------------------------------------------------
  // Auto-speak when readText changes and auto-advance is on
  // -----------------------------------------------------------------------

  const prevReadTextRef = useRef(readText ?? '')

  useEffect(() => {
    if (!speechSynthesisSupported || !readText) return
    // Only auto-speak when the text actually changes
    if (readText === prevReadTextRef.current) return
    prevReadTextRef.current = readText

    if (isAutoAdvance) {
      // Small delay to avoid cutting off any previous speech
      const timer = setTimeout(() => {
        speak(readText, { rate: 1, lang: 'fr-FR' })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [readText, isAutoAdvance, speechSynthesisSupported, speak])

  // -----------------------------------------------------------------------
  // TTS: read / stop
  // -----------------------------------------------------------------------

  const handleReadToggle = useCallback(() => {
    if (isSpeaking) {
      stop()
    } else if (readText) {
      speak(readText, { rate: 1, lang: 'fr-FR' })
    }
  }, [isSpeaking, stop, readText, speak])

  // -----------------------------------------------------------------------
  // ASR: listen / stop
  // -----------------------------------------------------------------------

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening()
      setInterimText('')
    } else {
      setInterimText('')
      startListening({
        lang: 'fr-FR',
        onResult: (transcript, isFinal) => {
          if (isFinal) {
            // Clear interim, show final
            setInterimText('')

            // If matchOptions are provided, attempt voice matching
            if (matchOptions) {
              const result = matchVoiceAnswer(transcript, matchOptions)
              if (result.matched) {
                onVoiceResult?.(String(result.value))
              } else {
                onVoiceResult?.(transcript)
              }
            } else {
              onVoiceResult?.(transcript)
            }
          } else {
            // Show interim transcript
            setInterimText(transcript)
          }
        },
      })
    }
  }, [isListening, stopListening, startListening, matchOptions, matchVoiceAnswer, onVoiceResult])

  // -----------------------------------------------------------------------
  // Transcript display with auto-fade
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!lastTranscript || compact) return

    setDisplayedTranscript(lastTranscript)

    // Clear any existing timer
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)

    // Auto-fade after 3 seconds
    fadeTimerRef.current = setTimeout(() => {
      setDisplayedTranscript('')
    }, TRANSCRIPT_FADE_MS)

    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [lastTranscript, compact])

  // -----------------------------------------------------------------------
  // Cleanup on unmount
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [])

  // -----------------------------------------------------------------------
  // Determine which buttons to show
  // -----------------------------------------------------------------------

  const showReadButton = speechSynthesisSupported
  const showMicButton = speechRecognitionSupported

  // If nothing is supported, render nothing
  if (!showReadButton && !showMicButton) return null

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const sizeClass = compact ? 'size-7' : 'size-9'

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center gap-1',
        className,
      )}
    >
      {/* Floating pill bar */}
      <div
        className={cn(
          'inline-flex items-center gap-1',
          'bg-background/80 backdrop-blur-sm',
          'rounded-full border shadow-sm',
          'px-1.5 py-1',
          compact ? 'py-0.5 px-1' : undefined,
        )}
      >
        {/* ── Read-aloud button ──────────────────────────────────── */}
        {showReadButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    sizeClass,
                    'rounded-full',
                    isSpeaking
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={handleReadToggle}
                  aria-label={isSpeaking ? 'Arrêter la lecture' : 'Écouter la question'}
                >
                  {isSpeaking ? (
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="inline-flex"
                    >
                      <Volume2 className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                {/* Pulse ring when speaking */}
                <AnimatePresence>
                  {isSpeaking && (
                    <motion.span
                      className={cn(
                        'absolute inset-0 rounded-full',
                        'ring-2 ring-primary/40',
                      )}
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'easeOut',
                      }}
                      aria-hidden
                    />
                  )}
                </AnimatePresence>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {isSpeaking ? 'Arrêter la lecture' : 'Écouter la question'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* ── Microphone button ──────────────────────────────────── */}
        {showMicButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    sizeClass,
                    'rounded-full',
                    isListening
                      ? 'text-destructive'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={handleMicToggle}
                  aria-label={
                    isListening
                      ? 'Arrêter l\'enregistrement'
                      : 'Démarrer l\'enregistrement'
                  }
                >
                  {isListening ? (
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="inline-flex"
                    >
                      <MicOff className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>

                {/* Red pulse ring when listening */}
                <AnimatePresence>
                  {isListening && (
                    <motion.span
                      className={cn(
                        'absolute inset-0 rounded-full',
                        'ring-2 ring-destructive/50',
                      )}
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'easeOut',
                      }}
                      aria-hidden
                    />
                  )}
                </AnimatePresence>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {isListening
                ? 'Arrêter l\'enregistrement'
                : 'Répondre à la voix'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* ── Auto-advance toggle ────────────────────────────────── */}
        {showMicButton && !compact && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  sizeClass,
                  'rounded-full',
                  isAutoAdvance
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={handleAutoAdvanceToggle}
                aria-label="Avance automatique vocale"
                aria-pressed={isAutoAdvance}
              >
                <Zap className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Avance automatique vocale
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ── Transcript display ──────────────────────────────────── */}
      {!compact && (
        <AnimatePresence mode="wait">
          {(interimText || displayedTranscript) && (
            <motion.p
              key={interimText || displayedTranscript}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'max-w-[200px] truncate text-center text-[11px] leading-tight',
                interimText
                  ? 'text-muted-foreground italic'
                  : 'text-foreground/70',
              )}
            >
              {interimText || displayedTranscript}
            </motion.p>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

export default AudioControls