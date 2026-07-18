// ---------------------------------------------------------------------------
// Web Speech API — SpeechRecognition (not yet in TS DOM lib as of 5.x)
// ---------------------------------------------------------------------------

declare class SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

declare class SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

declare class SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

declare class SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

declare abstract class SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onstart: ((event: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare const SpeechRecognition: {
  new (): SpeechRecognition
  prototype: SpeechRecognition
}

declare const webkitSpeechRecognition: {
  new (): SpeechRecognition
  prototype: SpeechRecognition
}

// ---------------------------------------------------------------------------
// Type declarations for optional runtime dependencies
// ---------------------------------------------------------------------------

declare module 'resend' {
  export class Resend {
    constructor(apiKey: string)
    emails: {
      send(params: { from: string; to: string; subject: string; html: string }): Promise<{ id: string }>
    }
  }
}