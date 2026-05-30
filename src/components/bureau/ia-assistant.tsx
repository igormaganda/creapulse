'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBureauStore } from './bureau-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sparkles,
  X,
  Send,
  Loader2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

/* ─── Types ─── */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/* ─── Contextual Greetings ─── */

const greetings: Record<string, string> = {
  creasim: "Je peux vous aider à optimiser votre simulation financière. Posez-moi vos questions !",
  riasec: "Je peux vous aider à interpréter vos résultats RIASEC. Que souhaitez-vous savoir ?",
  'mon-projet': "Je peux vous aider à structurer votre projet. Comment puis-je vous aider ?",
  'business-plan': "Je peux vous assister dans la rédaction de votre business plan.",
  annuaire: "Je peux vous aider à trouver les bons partenaires pour votre projet.",
  forum: "Je peux vous aider à formuler vos questions ou répondre à d'autres créateurs.",
  pepites: "Je peux vous aider à interpréter vos résultats Pépites Game et votre profil Kiviat. Que souhaitez-vous savoir ?",
  creascope: "Je peux vous accompagner dans votre session CréaScope. Posez-moi vos questions sur le pipeline diagnostique !",
}

const defaultGreeting = "Bonjour ! Je suis l'assistant IA CreaPulse. Comment puis-je vous aider dans votre parcours entrepreneurial ?"

/* ─── Contextual Suggestion Chips ─── */

const suggestions: Record<string, string[]> = {
  creasim: [
    "Comment améliorer ma rentabilité ?",
    "Quel seuil de rentabilité viser ?",
    "Comment réduire mes charges ?",
  ],
  riasec: [
    "Que signifie mon profil ?",
    "Quels métiers me correspondent ?",
    "Comment utiliser mes forces ?",
  ],
  'mon-projet': [
    "Comment valider mon idée ?",
    "Quels sont les erreurs courantes ?",
    "Comment trouver mon client cible ?",
  ],
  'business-plan': [
    "Comment structurer mon BP ?",
    "Quelles sections sont essentielles ?",
    "Comment convaincre un banquier ?",
  ],
  pepites: [
    "Comment améliorer mes scores Kiviat ?",
    "Que signifient mes résultats Pépites ?",
    "Quelles compétences dois-je développer ?",
  ],
  creascope: [
    "Comment préparer ma session CréaScope ?",
    "Que se passe-t-il pendant le pipeline ?",
    "Comment utiliser le plan d'action CréaScope ?",
  ],
  default: [
    "Comment créer mon entreprise ?",
    "Quelles aides sont disponibles ?",
    "Comment trouver un conseiller ?",
  ],
}

/* ─── Module display names for badge ─── */

const moduleNames: Record<string, string> = {
  creasim: 'CreaSim',
  riasec: 'RIASEC',
  'mon-projet': 'Mon Projet',
  'business-plan': 'Business Plan',
  annuaire: 'Annuaire',
  forum: 'Forum',
  pepites: 'Pépites Game',
  creascope: 'CréaScope',
}

/* ─── Typing Indicator ─── */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <Avatar className="h-7 w-7 shrink-0 border border-primary/20">
        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-[10px] font-bold">
          IA
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── IA Assistant Component ─── */

export function IAAssistant() {
  const { currentModule } = useBureauStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [greetingShown, setGreetingShown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ensure portal target is available (client-only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine context
  const activeModule = currentModule || ''
  const moduleName = moduleNames[activeModule] || ''
  const greeting = greetings[activeModule] || defaultGreeting
  const moduleSuggestions = suggestions[activeModule] || suggestions.default

  // Show greeting when panel opens
  useEffect(() => {
    if (isOpen && !greetingShown) {
      setGreetingShown(true)
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ])
    }
  }, [isOpen, greetingShown, greeting])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400)
    }
  }, [isOpen])

  // Send message handler
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const history = [...messages, userMessage]
        .filter((m) => m.id !== 'greeting')
        .map((m) => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: {
            module: activeModule || undefined,
          },
          history,
        }),
      })

      const data = await response.json()

      if (data.success && data.data?.reply) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.data.reply,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Désolé, une erreur est survenue. Veuillez réessayer dans quelques instants.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Je suis temporairement indisponible. Veuillez vérifier votre connexion et réessayer.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, messages, activeModule])

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Handle suggestion click
  const handleSuggestionClick = (text: string) => {
    sendMessage(text)
  }

  // Reset conversation when module changes
  useEffect(() => {
    if (isOpen) {
      setGreetingShown(false)
      setMessages([])
    }
  }, [activeModule])

  if (!mounted) return null

  // Portal container to render at document body level — prevents fixed positioning
  // issues caused by parent transform/stacking-context (e.g. framer-motion on BureauLayout)
  const portalContainer = typeof document !== 'undefined' ? document.body : null

  return portalContainer ? createPortal(
    <>
      {/* ─── FAB Button ─── */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="fixed bottom-6 right-6 z-[9999] md:bottom-8 md:right-8"
        >
          <Button
            onClick={() => setIsOpen(true)}
            className={cn(
              'relative h-14 w-14 rounded-full shadow-lg shadow-teal-600/25',
              'bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800',
              'text-white border-0 transition-all duration-300',
              'hover:shadow-xl hover:shadow-teal-600/30 hover:scale-105',
              'active:scale-95',
            )}
            aria-label="Ouvrir l'assistant IA"
          >
            <Sparkles className="h-6 w-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-teal-400/40 animate-ping" style={{ animationDuration: '2s' }} />
            {/* Subtle glow */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-teal-400/20 to-teal-600/20 blur-md" />
          </Button>
        </motion.div>
      )}

      {/* ─── Chat Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={cn(
              'fixed z-[9999] flex flex-col overflow-hidden',
              'bottom-0 right-0 w-full h-full sm:bottom-4 sm:right-4',
              'sm:h-[500px] sm:w-[400px] sm:max-h-[80vh]',
              'rounded-none sm:rounded-2xl',
              'border border-border/50',
              'shadow-2xl shadow-black/20',
              'bg-white/95 dark:bg-[#1A1D28]/95',
              'backdrop-blur-xl',
            )}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 bg-white/80 dark:bg-[#1A1D28]/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    Assistant IA CreaPulse
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">En ligne</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {moduleName && (
                  <Badge
                    variant="secondary"
                    className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                  >
                    {moduleName}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer l'assistant"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ─── Messages Area ─── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
              style={{ scrollbarWidth: 'thin' }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    'flex items-end gap-2.5',
                    msg.role === 'user' && 'flex-row-reverse',
                  )}
                >
                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <Avatar className="h-7 w-7 shrink-0 border border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-[10px] font-bold">
                        IA
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message bubble */}
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md',
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-h3:text-sm prose-strong:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <Avatar className="h-7 w-7 shrink-0 border border-border">
                      <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                        {useBureauStore.getState().userInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </div>

            {/* ─── Suggestions (show only if few messages and not typing) ─── */}
            {messages.length <= 2 && !isTyping && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {moduleSuggestions.map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-[11px] leading-tight px-2.5 py-1.5 rounded-full bg-primary/8 text-primary hover:bg-primary/15 border border-primary/15 transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Input Area ─── */}
            <div className="border-t border-border/50 bg-white/80 dark:bg-[#1A1D28]/80 backdrop-blur-md px-4 py-3">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  disabled={isTyping}
                  className="flex-1 h-9 text-sm bg-muted/60 border-transparent focus:bg-background focus:border-border rounded-full px-4"
                  aria-label="Message de l'assistant IA"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    'h-9 w-9 rounded-full shrink-0 transition-all duration-200',
                    'bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
                    'text-white shadow-sm',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
                  )}
                  aria-label="Envoyer le message"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
                IA CreaPulse — Réponses générées automatiquement
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    portalContainer
  ) : null
}
