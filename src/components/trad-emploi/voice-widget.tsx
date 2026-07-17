'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTradEmploi } from './voice-context'
import { useBureauStore } from '@/components/bureau/bureau-store'
import { MODULE_LABELS } from '@/lib/module-registry'
import { cn } from '@/lib/utils'
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Send,
  Loader2,
  MessageCircle,
  Keyboard,
} from 'lucide-react'

// ─── Web Speech API Types ──────────────────

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

// ─── Constants ─────────────────────────────

const STORAGE_KEY = 'trad-emploi-widget-open'
const FRENCH_VOICE_LANGS = ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr']

// ─── Component ─────────────────────────────

export function VoiceWidget() {
  const { voiceContext } = useTradEmploi()
  const { currentModule, currentSection, isBureauOpen } = useBureauStore()

  // Panel state
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  // Speech recognition state
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')

  // Text input fallback
  const [textInput, setTextInput] = useState('')
  const [useTextInput, setUseTextInput] = useState(false)

  // AI response state
  const [aiResponse, setAiResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Refs
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null)
  const responseScrollRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // ─── Detect Speech API support ──────────
  const [speechSupported, setSpeechSupported] = useState(false)
  const [synthSupported, setSynthSupported] = useState(false)

  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition))
    setSynthSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    synthRef.current = typeof window !== 'undefined' ? window.speechSynthesis : null
  }, [])

  // ─── Persist panel state ────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(isOpen))
    }
  }, [isOpen])

  // ─── Auto-scroll AI response ────────────
  useEffect(() => {
    if (responseScrollRef.current) {
      responseScrollRef.current.scrollTop = responseScrollRef.current.scrollHeight
    }
  }, [aiResponse])

  // ─── Speech Recognition ─────────────────

  function createRecognition() {
    const SpeechRecognitionClass = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    if (!SpeechRecognitionClass) return null

    const recognition = new (SpeechRecognitionClass as new () => SpeechRecognition)()
    recognition.lang = 'fr-FR'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    return recognition
  }

  const startListening = useCallback(() => {
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setAiResponse('')

    const recognition = createRecognition()
    if (!recognition) {
      setError('Reconnaissance vocale non disponible dans ce navigateur. Utilisez le champ texte.')
      setUseTextInput(true)
      return
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (finalTranscript) setTranscript((prev) => prev + finalTranscript)
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Microphone non autorisé. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.')
      } else if (event.error === 'no-speech') {
        setError('Aucune parole détectée. Réessayez.')
      } else if (event.error !== 'aborted') {
        setError(`Erreur vocale : ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      // Auto-send if we got a transcript
      setTranscript((current) => {
        if (current.trim()) {
          // Use a timeout to let state settle, then send
          setTimeout(() => sendMessage(current.trim()), 100)
        }
        return current
      })
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
    } catch {
      setError('Impossible de démarrer la reconnaissance vocale.')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    setIsListening(false)
  }, [])

  // ─── Send message to API ────────────────

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setAiResponse('')
    setInterimTranscript('')

    // Build context from voice context + current module
    const contextModule = voiceContext.module || currentModule || ''
    const contextSection = voiceContext.section || undefined

    try {
      const res = await fetch('/api/trad-emploi/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: message.trim(),
          context: {
            module: contextModule,
            section: contextSection,
            projectData: voiceContext.projectData,
          },
        }),
      })

      const json = await res.json()

      if (json.success && json.data?.response) {
        // Stream-like effect: reveal characters progressively
        const fullResponse = json.data.response
        let charIndex = 0
        const chunkSize = 3
        const interval = setInterval(() => {
          charIndex += chunkSize
          setAiResponse(fullResponse.slice(0, Math.min(charIndex, fullResponse.length)))
          if (charIndex >= fullResponse.length) {
            clearInterval(interval)
          }
        }, 15)
      } else {
        setError(json.error?.message || 'Erreur lors de la réponse IA.')
      }
    } catch {
      setError('Erreur de connexion au serveur.')
    } finally {
      setIsLoading(false)
    }
  }, [voiceContext, currentModule, isLoading])

  // ─── TTS: Read aloud AI response ────────

  const speakResponse = useCallback(() => {
    if (!aiResponse || isSpeaking) return

    // Cancel any ongoing speech
    if (synthRef.current) {
      synthRef.current.cancel()
    }

    if (!synthSupported) {
      // Fallback to server-side TTS
      handleServerTTS()
      return
    }

    const synth = synthRef.current!
    const utterance = new SpeechSynthesisUtterance(aiResponse)
    utterance.lang = 'fr-FR'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Try to find a French voice
    const voices = synth.getVoices()
    const frenchVoice = voices.find((v) => FRENCH_VOICE_LANGS.some((lang) => v.lang.startsWith(lang)))
    if (frenchVoice) {
      utterance.voice = frenchVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synth.speak(utterance)
  }, [aiResponse, isSpeaking, synthSupported])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // ─── Server-side TTS fallback ───────────

  const handleServerTTS = async () => {
    if (!aiResponse) return
    setIsSpeaking(true)
    try {
      // Split text into chunks if needed (max 1024 chars)
      const text = aiResponse.slice(0, 1024)
      const res = await fetch('/api/trad-emploi/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(url)
        }
        audio.onerror = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(url)
        }
        audio.play()
      } else {
        setIsSpeaking(false)
        setError('Synthèse vocale indisponible.')
      }
    } catch {
      setIsSpeaking(false)
      setError('Erreur de synthèse vocale.')
    }
  }

  // ─── Context label ─────────────────────

  const contextModuleLabel = voiceContext.module
    ? MODULE_LABELS[voiceContext.module] || voiceContext.module
    : currentModule
      ? MODULE_LABELS[currentModule] || currentModule
      : null

  const contextLabel = contextModuleLabel
    ? voiceContext.section
      ? `${contextModuleLabel} — ${voiceContext.section}`
      : contextModuleLabel
    : 'Accueil'

  // ─── Text input submit ─────────────────

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return
    setTranscript(textInput.trim())
    sendMessage(textInput.trim())
    setTextInput('')
  }, [textInput, sendMessage])

  // ─── Don't render if bureau is not open ─
  if (!isBureauOpen) return null

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[150] flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition-colors"
            aria-label="Ouvrir l'assistant vocal TradEmploi"
          >
            <Mic className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-[150] flex flex-col w-[380px] max-w-[calc(100vw-3rem)] max-h-[70vh] rounded-2xl border border-teal-500/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-teal-900/10 overflow-hidden"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-teal-500/20 bg-teal-500/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/20">
                  <MessageCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">TradEmploi</p>
                  <p className="text-[10px] text-muted-foreground truncate">Assistant vocal</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Context indicator */}
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 max-w-[140px] truncate bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20">
                  {contextLabel}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer l'assistant vocal"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 px-4 py-3">
                <div ref={responseScrollRef} className="space-y-3">
                  {/* Transcription area */}
                  {transcript && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vous avez dit</p>
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-sm text-foreground">{transcript}</p>
                      </div>
                    </div>
                  )}

                  {/* Interim transcript (while speaking) */}
                  {interimTranscript && (
                    <p className="text-sm text-muted-foreground italic">{interimTranscript}</p>
                  )}

                  {/* AI Response area */}
                  {aiResponse && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Réponse</p>
                      <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2.5">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                      </div>
                    </div>
                  )}

                  {/* Loading state */}
                  {isLoading && !aiResponse && (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                      <span className="text-sm text-muted-foreground">Analyse en cours...</span>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                      <p className="text-xs text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Empty state */}
                  {!transcript && !aiResponse && !isLoading && !error && (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
                        <Mic className="h-5 w-5 text-teal-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cliquez sur le microphone ou tapez votre question
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Controls */}
              <div className="border-t border-teal-500/20 bg-teal-500/5 px-4 py-3 space-y-2">
                {/* TTS button */}
                {aiResponse && !isLoading && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'flex-1 gap-2 text-xs border-teal-500/30',
                        isSpeaking
                          ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
                          : 'text-teal-700 dark:text-teal-300 hover:bg-teal-500/10'
                      )}
                      onClick={isSpeaking ? stopSpeaking : speakResponse}
                      disabled={!aiResponse}
                    >
                      {isSpeaking ? (
                        <>
                          <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                          Lecture en cours...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />
                          Lire la réponse
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Mic button + text fallback toggle */}
                <div className="flex items-center gap-2">
                  {!useTextInput ? (
                    <>
                      {/* Big microphone button */}
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          'h-10 w-10 shrink-0 rounded-full border-2 transition-all',
                          isListening
                            ? 'border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                            : 'border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 hover:border-teal-500/50'
                        )}
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading}
                        aria-label={isListening ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
                      >
                        {isListening ? (
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <MicOff className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                      {/* Pulse ring animation when listening */}
                      {isListening && (
                        <motion.div
                          className="absolute h-10 w-10 rounded-full border-2 border-teal-500/40"
                          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          style={{ pointerEvents: 'none' }}
                        />
                      )}
                    </>
                  ) : null}

                  {/* Text input field */}
                  {useTextInput && (
                    <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                      <Input
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Tapez votre question..."
                        className="text-sm h-10 border-teal-500/30 focus-visible:ring-teal-500/30"
                        disabled={isLoading}
                        autoFocus
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 shrink-0 bg-teal-600 hover:bg-teal-500 text-white"
                        disabled={!textInput.trim() || isLoading}
                        aria-label="Envoyer"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  )}

                  {/* Text input toggle */}
                  {!useTextInput && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setUseTextInput(true)}
                      aria-label="Saisir du texte"
                      title="Saisir du texte à la place du microphone"
                    >
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Mic toggle (if in text mode) */}
                  {useTextInput && speechSupported && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setUseTextInput(false)}
                      aria-label="Utiliser le microphone"
                      title="Repasser en mode microphone"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Clear button */}
                  {(transcript || aiResponse) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground ml-auto"
                      onClick={() => {
                        setTranscript('')
                        setInterimTranscript('')
                        setAiResponse('')
                        setError(null)
                        stopSpeaking()
                      }}
                      aria-label="Effacer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}