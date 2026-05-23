'use client'
import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'

// Keyboard shortcut handler
export function useKeyboardShortcut(key: string, callback: () => void, modifiers: string[] = []) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const modMatch = modifiers.every(m =>
        m === 'ctrl' && e.ctrlKey ||
        m === 'meta' && e.metaKey ||
        m === 'shift' && e.shiftKey ||
        m === 'alt' && e.altKey
      )
      if (modMatch && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, modifiers])
}

// Screen reader announcement
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', priority)
  el.setAttribute('aria-atomic', 'true')
  el.className = 'sr-only'
  document.body.appendChild(el)
  el.textContent = message
  setTimeout(() => document.body.removeChild(el), 1000)
}

// Focus trap for modals
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const first = focusable[0] as HTMLElement
    const last = focusable[focusable.length - 1] as HTMLElement

    function handler(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    container.addEventListener('keydown', handler)
    return () => container.removeEventListener('keydown', handler)
  }, [containerRef])
}

// Reduced motion preference
export function useReducedMotion() {
  const subscribe = useCallback((callback: () => void) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', callback)
    return () => mq.removeEventListener('change', callback)
  }, [])

  const getSnapshot = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const getServerSnapshot = useCallback(() => {
    return false
  }, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// Skip to content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
    >
      Aller au contenu principal
    </a>
  )
}

// Reading line hook
export function useReadingLine(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const line = document.createElement('div')
    line.id = 'reading-line'
    line.setAttribute('aria-hidden', 'true')
    Object.assign(line.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      height: '3px',
      backgroundColor: 'rgba(0, 131, 143, 0.5)',
      zIndex: '9998',
      pointerEvents: 'none',
      transition: 'top 0.1s ease',
    })
    document.body.appendChild(line)

    function onMouseMove(e: MouseEvent) {
      line.style.top = `${e.clientY}px`
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      line.remove()
    }
  }, [enabled])
}

// Dyslexic font hook
export function useDyslexicFont(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      document.documentElement.style.setProperty('--dyslexic-letter-spacing', '0.05em')
      document.documentElement.style.setProperty('--dyslexic-word-spacing', '0.1em')
      document.documentElement.style.setProperty('--dyslexic-line-height', '1.8')
      document.documentElement.classList.add('dyslexic-font')
    } else {
      document.documentElement.style.removeProperty('--dyslexic-letter-spacing')
      document.documentElement.style.removeProperty('--dyslexic-word-spacing')
      document.documentElement.style.removeProperty('--dyslexic-line-height')
      document.documentElement.classList.remove('dyslexic-font')
    }
  }, [enabled])
}

// High contrast hook
export function useHighContrast(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [enabled])
}

// Text size hook
export function useTextSize(size: number) {
  useEffect(() => {
    document.documentElement.style.fontSize = `${size}%`
    return () => {
      document.documentElement.style.removeProperty('font-size')
    }
  }, [size])
}
