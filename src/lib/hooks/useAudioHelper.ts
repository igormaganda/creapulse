import { useState, useCallback, useRef, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpeakOptions {
  rate?: number
  lang?: string
  onStart?: () => void
  onEnd?: () => void
}

export interface ListenOptions {
  lang?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onEnd?: () => void
}

export interface MatchOptions {
  choices: { label: string; value: string | number }[]
  /** Optional keyword→value map for fuzzy matching (e.g. { "réaliser": "R" }) */
  keywords?: Record<string, string | number>
}

export interface MatchResult {
  matched: boolean
  value: string | number | null
  confidence: 'high' | 'low'
}

export interface UseAudioHelperReturn {
  // TTS
  speak: (text: string, options?: SpeakOptions) => void
  stop: () => void
  isSpeaking: boolean

  // ASR
  startListening: (options?: ListenOptions) => void
  stopListening: () => void
  isListening: boolean
  lastTranscript: string

  // Voice matching
  matchVoiceAnswer: (transcript: string, options: MatchOptions) => MatchResult

  // Settings
  autoAdvanceOnVoice: boolean
  setAutoAdvanceOnVoice: (v: boolean) => void
  audioEnabled: boolean
  setAudioEnabled: (v: boolean) => void

  // Browser support
  speechRecognitionSupported: boolean
  speechSynthesisSupported: boolean

  /** Set a callback to be invoked on high-confidence voice matches when autoAdvanceOnVoice is true. */
  setOnVoiceAnswer: (fn: ((value: string | number) => void) | undefined) => void
}

// ---------------------------------------------------------------------------
// French number-word map
// ---------------------------------------------------------------------------

const FRENCH_NUMBER_WORDS: Record<string, string | number | boolean> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  premier: 1,
  première: 1,
  deuxième: 2,
  troisieme: 3,
  troisième: 3,
  quatrieme: 4,
  quatrième: 4,
  cinquieme: 5,
  cinquième: 5,
  sixieme: 6,
  sixième: 6,
  dernier: 'last',
  dernière: 'last',
  suivant: 'next',
  oui: true,
  non: false,
  'pas du tout': 1,
  peu: 2,
  moyen: 3,
  assez: 4,
  'tout à fait': 5,
  très: 5,
}

// ---------------------------------------------------------------------------
// Helpers (module-level, no React dependency)
// ---------------------------------------------------------------------------

function isSSR(): boolean {
  return typeof window === 'undefined'
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (isSSR()) return null
  return window.speechSynthesis ?? null
}

function getFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Prefer exact fr-FR, then any fr-* locale
  const exact = voices.find((v) => v.lang === 'fr-FR')
  if (exact) return exact
  return voices.find((v) => v.lang.startsWith('fr')) ?? null
}

function pickSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (isSSR()) return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => SpeechRecognition)
    | null
}

/** Lowercase, trim, and strip diacritics for loose string comparison. */
function normalise(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Extract an Arabic digit or French number-word from a transcript. */
function extractNumber(transcript: string): number | null {
  const lower = transcript.toLowerCase()

  // 1. Arabic digits first
  const digitMatch = lower.match(/\d+/)
  if (digitMatch) {
    return parseInt(digitMatch[0], 10)
  }

  // 2. French number words (sort longest-first so "tout à fait" is tried before "tout")
  const sorted = Object.keys(FRENCH_NUMBER_WORDS).sort(
    (a, b) => b.length - a.length,
  )
  for (const word of sorted) {
    if (lower.includes(word)) {
      const val = FRENCH_NUMBER_WORDS[word]
      if (typeof val === 'number') return val
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAudioHelper(): UseAudioHelperReturn {
  // ---- TTS state ----
  const [isSpeaking, setIsSpeaking] = useState(false)
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const voicesLoadedRef = useRef(false)

  // ---- ASR state ----
  const [isListening, setIsListening] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  /** Mutable mirror of `isListening` — safe to read from non-React callbacks. */
  const isListeningRef = useRef(false)

  // ---- Settings (state + refs for stable callback access) ----
  const [autoAdvanceOnVoice, setAutoAdvanceOnVoiceState] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const autoAdvanceOnVoiceRef = useRef(false)
  const audioEnabledRef = useRef(true)

  // Keep refs in sync with state
  useEffect(() => {
    autoAdvanceOnVoiceRef.current = autoAdvanceOnVoice
  }, [autoAdvanceOnVoice])
  useEffect(() => {
    audioEnabledRef.current = audioEnabled
  }, [audioEnabled])

  /** State-setter that also updates the ref. */
  const setAutoAdvanceOnVoice = useCallback((v: boolean) => {
    autoAdvanceOnVoiceRef.current = v
    setAutoAdvanceOnVoiceState(v)
  }, [])

  // ---- Callback refs ----
  const onVoiceAnswerRef = useRef<((value: string | number) => void) | undefined>(
    undefined,
  )

  const setOnVoiceAnswer = useCallback(
    (fn: ((value: string | number) => void) | undefined) => {
      onVoiceAnswerRef.current = fn
    },
    [],
  )

  // ---- Browser support (computed once) ----
  const speechSynthesisSupported =
    !isSSR() && typeof window.speechSynthesis !== 'undefined'
  const speechRecognitionSupported = pickSpeechRecognitionCtor() !== null

  // -----------------------------------------------------------------------
  // Load voices (async in Chrome / some browsers)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!speechSynthesisSupported) return

    const synth = getSpeechSynthesis()!

    function loadVoices() {
      const v = synth.getVoices()
      if (v.length > 0) {
        voicesRef.current = v
        voicesLoadedRef.current = true
      }
    }

    loadVoices()
    synth.addEventListener('voiceschanged', loadVoices)
    return () => synth.removeEventListener('voiceschanged', loadVoices)
  }, [speechSynthesisSupported])

  // -----------------------------------------------------------------------
  // TTS — speak
  // -----------------------------------------------------------------------
  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!audioEnabledRef.current) return

      const synth = getSpeechSynthesis()
      if (!synth) return

      // Stop any in-progress speech first
      synth.cancel()
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause()
        ttsAudioRef.current = null
      }

      const { rate = 1, lang = 'fr-FR', onStart, onEnd } = options ?? {}

      // --- Strategy 1: Browser SpeechSynthesis (zero-latency) ---
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.lang = lang

      // Attach a French voice when available
      if (voicesLoadedRef.current && voicesRef.current.length > 0) {
        const frVoice = getFrenchVoice(voicesRef.current)
        if (frVoice) utterance.voice = frVoice
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        onStart?.()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        ttsUtteranceRef.current = null
        onEnd?.()
      }

      utterance.onerror = (event) => {
        // "canceled" is expected when synth.cancel() is called — no warning needed
        if (event.error !== 'canceled') {
          console.warn('[useAudioHelper] SpeechSynthesis error:', event.error)
        }
        setIsSpeaking(false)
        ttsUtteranceRef.current = null
        onEnd?.()
      }

      ttsUtteranceRef.current = utterance
      synth.speak(utterance)

      // --- Strategy 2 (fallback): /api/audio/tts ---
      // The primary browser TTS is used directly above. If consumers need
      // higher-quality server-generated audio they can call the API route
      // themselves; the hook focuses on the zero-latency browser path.
      // A future iteration could add automatic fallback here.
    },
    [], // stable — reads from refs
  )

  // -----------------------------------------------------------------------
  // TTS — stop
  // -----------------------------------------------------------------------
  const stop = useCallback(() => {
    const synth = getSpeechSynthesis()
    if (synth) synth.cancel()
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause()
      ttsAudioRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  // -----------------------------------------------------------------------
  // ASR — startListening
  // -----------------------------------------------------------------------
  const startListening = useCallback(
    (options?: ListenOptions) => {
      if (!audioEnabledRef.current) return

      const SpeechRecognitionCtor = pickSpeechRecognitionCtor()
      if (!SpeechRecognitionCtor) {
        console.warn('[useAudioHelper] SpeechRecognition not supported in this browser')
        return
      }

      // Tear down any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          /* already stopped */
        }
        recognitionRef.current = null
      }

      const { lang = 'fr-FR', onResult, onEnd } = options ?? {}

      const recognition = new SpeechRecognitionCtor()
      recognition.lang = lang
      recognition.continuous = false // single-utterance mode
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }

        if (finalTranscript) {
          const trimmed = finalTranscript.trim()
          setLastTranscript(trimmed)
          onResult?.(trimmed, true)
        } else if (interimTranscript) {
          onResult?.(interimTranscript.trim(), false)
        }
      }

      recognition.onend = () => {
        // Some browsers (Chrome) fire onend after a silence timeout.
        // If the consumer hasn't explicitly stopped, auto-restart.
        if (isListeningRef.current) {
          try {
            recognition.start()
          } catch {
            // Failed to restart (e.g. not-allowed) — clean up
            setIsListening(false)
            isListeningRef.current = false
            onEnd?.()
          }
        } else {
          setIsListening(false)
          onEnd?.()
        }
      }

      recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.warn('[useAudioHelper] SpeechRecognition error:', event.error)
        }
        if (!isListeningRef.current) {
          setIsListening(false)
          onEnd?.()
        }
      }

      recognitionRef.current = recognition
      isListeningRef.current = true
      setIsListening(true)

      try {
        recognition.start()
      } catch (err) {
        console.warn('[useAudioHelper] Failed to start recognition:', err)
        setIsListening(false)
        isListeningRef.current = false
      }
    },
    [], // stable — reads from refs
  )

  // -----------------------------------------------------------------------
  // ASR — stopListening
  // -----------------------------------------------------------------------
  const stopListening = useCallback(() => {
    isListeningRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // -----------------------------------------------------------------------
  // Cleanup on unmount
  // -----------------------------------------------------------------------
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          /* ignore */
        }
        recognitionRef.current = null
      }
      const synth = getSpeechSynthesis()
      if (synth) synth.cancel()
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause()
        ttsAudioRef.current = null
      }
    }
  }, [])

  // -----------------------------------------------------------------------
  // Voice answer matching (with auto-advance integration)
  // -----------------------------------------------------------------------
  const matchVoiceAnswer = useCallback(
    (transcript: string, options: MatchOptions): MatchResult => {
      const { choices, keywords } = options
      const norm = normalise(transcript)

      // 1. Exact match against choice labels (case-insensitive, trimmed, diacritic-stripped)
      for (const choice of choices) {
        if (normalise(choice.label) === norm) {
          const result: MatchResult = {
            matched: true,
            value: choice.value,
            confidence: 'high',
          }
          // Auto-advance: high-confidence match
          if (autoAdvanceOnVoiceRef.current && onVoiceAnswerRef.current) {
            onVoiceAnswerRef.current(choice.value)
          }
          return result
        }
      }

      // 2. Keyword matching (longest keyword first to avoid partial hits)
      if (keywords) {
        const sortedKeywords = Object.keys(keywords).sort(
          (a, b) => b.length - a.length,
        )
        for (const kw of sortedKeywords) {
          if (norm.includes(normalise(kw))) {
            const value = keywords[kw]
            const result: MatchResult = {
              matched: true,
              value,
              confidence: 'high',
            }
            // Auto-advance: high-confidence keyword match
            if (autoAdvanceOnVoiceRef.current && onVoiceAnswerRef.current) {
              onVoiceAnswerRef.current(value)
            }
            return result
          }
        }
      }

      // 3. Number extraction (lower confidence — "un" could mean many things)
      const extractedNum = extractNumber(transcript)
      if (extractedNum !== null) {
        // Map 1-based number to choice index (e.g. "deux" → choices[1])
        const index = extractedNum - 1
        if (index >= 0 && index < choices.length) {
          return { matched: true, value: choices[index].value, confidence: 'low' }
        }
        // Also try matching by numeric value directly
        const numericChoice = choices.find(
          (c) =>
            c.value === extractedNum ||
            String(c.value) === String(extractedNum),
        )
        if (numericChoice) {
          return { matched: true, value: numericChoice.value, confidence: 'low' }
        }
      }

      return { matched: false, value: null, confidence: 'low' }
    },
    [], // stable — reads from refs
  )

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------
  return {
    // TTS
    speak,
    stop,
    isSpeaking,

    // ASR
    startListening,
    stopListening,
    isListening,
    lastTranscript,

    // Voice matching
    matchVoiceAnswer,

    // Settings
    autoAdvanceOnVoice,
    setAutoAdvanceOnVoice,
    audioEnabled,
    setAudioEnabled,

    // Browser support
    speechRecognitionSupported,
    speechSynthesisSupported,

    // Callback setter
    setOnVoiceAnswer,
  }
}

export default useAudioHelper