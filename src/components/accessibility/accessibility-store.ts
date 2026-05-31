import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AccessibilitySettings {
  textSize: number // 100, 120, 140
  highContrast: boolean
  readingLine: boolean
  dyslexicFont: boolean
  pauseAnimations: boolean
  focusVisible: boolean
  reducedMotion: boolean
  setTextSize: (size: number) => void
  setHighContrast: (v: boolean) => void
  setReadingLine: (v: boolean) => void
  setDyslexicFont: (v: boolean) => void
  setPauseAnimations: (v: boolean) => void
  setFocusVisible: (v: boolean) => void
  setReducedMotion: (v: boolean) => void
}

export const useAccessibilityStore = create<AccessibilitySettings>()(
  persist(
    (set) => ({
      textSize: 100,
      highContrast: false,
      readingLine: false,
      dyslexicFont: false,
      pauseAnimations: false,
      focusVisible: true,
      reducedMotion: false,
      setTextSize: (s) => set({ textSize: s }),
      setHighContrast: (v) => set({ highContrast: v }),
      setReadingLine: (v) => set({ readingLine: v }),
      setDyslexicFont: (v) => set({ dyslexicFont: v }),
      setPauseAnimations: (v) => set({ pauseAnimations: v }),
      setFocusVisible: (v) => set({ focusVisible: v }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
    }),
    { name: 'creapulse-a11y' }
  )
)
