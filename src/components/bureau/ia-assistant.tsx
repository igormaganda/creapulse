'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBureauStore } from './bureau-store'
import { MODULE_REGISTRY, getModuleDef } from '@/lib/module-registry'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  Zap,
  FileSearch,
  ListChecks,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

/* ─── Types ─── */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/* ─── localStorage key for module data ─── */

const MODULE_STORAGE_KEYS: Record<string, string> = {
  'mon-projet': 'creapulse-mon-projet',
  'vision': 'creapulse-vision',
  'bmc': 'creapulse-bmc',
  'swot': 'creapulse-swot',
  'creasim': 'creapulse-creasim',
  'gestion-temps': 'creapulse-gestion-temps',
  'marche': 'creapulse-marche',
  'juridique': 'creapulse-juridique',
  'financier': 'creapulse-financier-sim',
  'pitch-deck': 'creapulse-pitch-deck',
  'kiviat': 'creapulse-kiviat',
  'bilan-ia': 'creapulse-bilan-ia',
  'pepites': 'creapulse-pepites',
  'riasec': 'creapulse-riasec-progress',
  'tremplin': 'creapulse-tremplin',
  'objectifs-smart': 'creapulse-objectifs-smart',
  'cloture-rebond': 'creapulse-cloture-rebond',
  'marketing-commerciale': 'creapulse-marketing-commerciale',
  'mind-map': 'creapulse-mindmap',
  'gestion-crise': 'creapulse-gestion-crise',
  'e-learning': 'creapulse-e-learning',
  'crm': 'creapulse-crm',
  'tresorerie': 'creapulse-tresorerie',
  'gamification': 'creapulse-gamification',
  'profil-createur': 'creapulse-profil',
  'business-plan': 'creapulse-bp',
}

/* ─── Contextual Greetings (all 35 modules) ─── */

const greetings: Record<string, string> = {
  // ═══ PARCOURS ═══
  'profil-createur': "Je peux vous aider à configurer votre profil créateur pour un accompagnement sur mesure. Que souhaitez-vous savoir ?",
  'mon-projet': "Je peux vous aider à structurer votre projet. Comment puis-je vous aider ?",
  'vision': "Je peux vous aider à clarifier votre vision et vos objectifs stratégiques. Posez-moi vos questions !",
  'pepites': "Je peux vous aider à interpréter vos résultats Pépites Game et votre profil Kiviat. Que souhaitez-vous savoir ?",
  'riasec': "Je peux vous aider à interpréter vos résultats RIASEC. Que souhaitez-vous savoir ?",
  'kiviat': "Je peux vous aider à analyser votre radar de compétences Kiviat. Comment puis-je vous aider ?",
  'bilan-ia': "Je peux vous aider à comprendre votre bilan IA et à prioriser vos prochaines actions. Que souhaitez-vous explorer ?",
  'creascope': "Je peux vous accompagner dans votre session CréaScope. Posez-moi vos questions sur le pipeline diagnostique !",
  // ═══ STRATÉGIE ═══
  'marche': "Je peux vous aider à analyser votre marché et votre positionnement concurrentiel. Que souhaitez-vous approfondir ?",
  'juridique': "Je peux vous guider dans le choix du statut juridique adapté à votre projet. Posez-moi vos questions !",
  'financier': "Je peux vous aider à structurer votre plan financier prévisionnel. Que souhaitez-vous estimer ?",
  'creasim': "Je peux vous aider à optimiser votre simulation financière. Posez-moi vos questions !",
  'bmc': "Je peux vous aider à construire votre Business Model Canvas. Que souhaitez-vous travailler ?",
  'business-plan': "Je peux vous assister dans la rédaction de votre business plan.",
  'pitch-deck': "Je peux vous aider à créer un pitch deck convaincant. Que souhaitez-vous préparer ?",
  'swot': "Je peux vous aider à réaliser une analyse SWOT complète et actionnable. Comment puis-je vous aider ?",
  'gestion-temps': "Je peux vous aider à optimiser votre organisation avec la matrice d'Eisenhower. Que souhaitez-vous améliorer ?",
  'gestion-crise': "Je peux vous aider à identifier les risques et préparer un plan de résilience. Que souhaitez-vous sécuriser ?",
  'marketing-commerciale': "Je peux vous aider à planifier votre stratégie marketing et commerciale. Que souhaitez-vous définir ?",
  'mind-map': "Je peux vous aider à organiser vos idées et structurer votre carte mentale. Comment puis-je vous aider ?",
  // ═══ ÉCOSYSTÈME ═══
  'annuaire': "Je peux vous aider à trouver les bons partenaires pour votre projet.",
  'forum': "Je peux vous aider à formuler vos questions ou répondre à d'autres créateurs.",
  'messages': "Je peux vous aider à préparer vos échanges avec votre conseiller. Que souhaitez-vous aborder ?",
  'mentorat': "Je peux vous aider à tirer le meilleur parti du mentorat. Que souhaitez-vous savoir ?",
  // ═══ PILOTAGE ═══
  'tremplin': "Je peux vous aider à identifier les aides et financements disponibles pour votre projet. Que recherchez-vous ?",
  'passeport': "Je peux vous aider à valoriser votre passeport entrepreneurial. Que souhaitez-vous savoir ?",
  'certifications': "Je peux vous aider à comprendre vos certifications et leur valeur. Que souhaitez-vous explorer ?",
  'telechargements': "Je peux vous aider à identifier les documents dont vous avez besoin pour vos démarches. Que recherchez-vous ?",
  'vie-privee': "Je peux vous aider à gérer vos données personnelles et vos droits RGPD. Que souhaitez-vous faire ?",
  'objectifs-smart': "Je peux vous aider à formuler des objectifs SMART pertinents. Que souhaitez-vous atteindre ?",
  'cloture-rebond': "Je peux vous aider dans vos démarches de clôture ou de rebond. Que souhaitez-vous savoir ?",
  'satisfaction-feedback': "Je peux vous aider à donner un retour constructif sur votre parcours. Que souhaitez-vous partager ?",
  'gamification': "Je peux vous aider à comprendre votre progression et à débloquer de nouveaux défis. Que souhaitez-vous savoir ?",
  // ═══ PIPELINE / SPECIAL ═══
  'pipeline-v3-overview': "Je peux vous accompagner dans votre parcours Pipeline V3. Posez-moi vos questions !",
  'parcours-paa': "Je peux vous aider à suivre votre parcours PAA et à préparer vos prochaines étapes. Que souhaitez-vous savoir ?",
}

const defaultGreeting = "Bonjour ! Je suis l'assistant IA CreaPulse. Comment puis-je vous aider dans votre parcours entrepreneurial ?"

/* ─── Contextual Suggestion Chips (all 35 modules) ─── */

const suggestions: Record<string, string[]> = {
  // ═══ PARCOURS ═══
  'profil-createur': [
    'Quelles informations dois-je renseigner ?',
    'Comment mon profil influence mon accompagnement ?',
    'Comment valoriser mes compétences ?',
  ],
  'mon-projet': [
    'Comment valider mon idée ?',
    'Quels sont les erreurs courantes ?',
    'Comment trouver mon client cible ?',
  ],
  'vision': [
    'Comment définir une vision claire ?',
    'Quels objectifs stratégiques fixer ?',
    'Comment aligner vision et business model ?',
  ],
  'pepites': [
    'Comment améliorer mes scores Kiviat ?',
    'Que signifient mes résultats Pépites ?',
    'Quelles compétences développer ?',
  ],
  'riasec': [
    'Que signifie mon profil ?',
    'Quels métiers me correspondent ?',
    'Comment utiliser mes forces ?',
  ],
  'kiviat': [
    'Comment interpréter mon radar ?',
    'Quelles sont mes forces principales ?',
    'Comment améliorer mes axes faibles ?',
  ],
  'bilan-ia': [
    'Que dit mon bilan IA ?',
    'Quelles sont mes priorités d\'action ?',
    'Comment améliorer mon score ?',
  ],
  'creascope': [
    'Comment préparer ma session ?',
    'Que se passe-t-il pendant le pipeline ?',
    'Comment utiliser le plan d\'action ?',
  ],
  // ═══ STRATÉGIE ═══
  'marche': [
    'Comment réaliser une étude de marché ?',
    'Quels outils analyser mes concurrents ?',
    'Comment identifier ma niche ?',
  ],
  'juridique': [
    'Quel statut choisir pour mon projet ?',
    'Auto-entrepreneur ou SAS ?',
    'Quelles obligations légales de départ ?',
  ],
  'financier': [
    'Comment estimer mon BFR ?',
    'Quels postes de charges prévoir ?',
    'Comment bâtir un prévisionnel réaliste ?',
  ],
  'creasim': [
    'Comment améliorer ma rentabilité ?',
    'Quel seuil de rentabilité viser ?',
    'Comment réduire mes charges ?',
  ],
  'bmc': [
    'Comment remplir "Proposition de valeur" ?',
    'Quels canaux de distribution choisir ?',
    'Comment identifier mes segments clients ?',
  ],
  'business-plan': [
    'Comment structurer mon BP ?',
    'Quelles sections sont essentielles ?',
    'Comment convaincre un banquier ?',
  ],
  'pitch-deck': [
    'Combien de slides pour un bon pitch ?',
    'Comment captiver dès la 1ère slide ?',
    'Quels chiffres clés inclure ?',
  ],
  'swot': [
    'Comment différencier forces et opportunités ?',
    'Quelles menaces examiner en priorité ?',
    'Comment transformer faiblesses en opportunités ?',
  ],
  'gestion-temps': [
    'Comment prioriser avec Eisenhower ?',
    'Quelles tâches déléguer en priorité ?',
    'Comment éviter la procrastination ?',
  ],
  'gestion-crise': [
    'Quels risques courants pour une startup ?',
    'Comment bâtir un plan de continuité ?',
    'Quelle trésorerie de secours prévoir ?',
  ],
  'marketing-commerciale': [
    'Comment définir mes personas clients ?',
    'Quels canaux pour un petit budget ?',
    'Comment mesurer mes actions marketing ?',
  ],
  'mind-map': [
    'Comment structurer ma carte mentale ?',
    'Quelles branches principales prévoir ?',
    'Comment passer à un plan d\'action ?',
  ],
  // ═══ ÉCOSYSTÈME ═══
  'annuaire': [
    'Quel partenaire contacter en premier ?',
    'Comment préparer mon rendez-vous ?',
    'Quels organismes pour le financement ?',
  ],
  'forum': [
    'Comment poser une question efficace ?',
    'Quels sujets abordent les créateurs ?',
    'Comment trouver un partenaire ?',
  ],
  'messages': [
    'Comment préparer ma session conseil ?',
    'Quels documents avoir sous la main ?',
    'Comment suivre mon dossier ?',
  ],
  'mentorat': [
    'Comment trouver le bon mentor ?',
    'Quels bénéfices du mentorat ?',
    'Comment préparer la 1ère rencontre ?',
  ],
  // ═══ PILOTAGE ═══
  'tremplin': [
    'Quelles aides suis-je éligible ?',
    'Comment obtenir ARE + ACCRE ?',
    'Quels financements BPI France ?',
  ],
  'passeport': [
    'Comment valoriser mon passeport ?',
    'Quelles certifications obtenir ?',
    'Reconnu par les banques ?',
  ],
  'certifications': [
    'Quelle certification la plus valorisante ?',
    'Comment préparer une certification ?',
    'Utile pour un financement ?',
  ],
  'telechargements': [
    'Quels documents pour un prêt bancaire ?',
    'Comment générer un résumé PDF ?',
    'Quels documents pour le CFE ?',
  ],
  'vie-privee': [
    'Comment exporter mes données ?',
    'Quels sont mes droits RGPD ?',
    'Comment supprimer mon compte ?',
  ],
  'objectifs-smart': [
    'Comment formuler un objectif SMART ?',
    'Quels objectifs pour 3 mois ?',
    'Comment suivre mes objectifs ?',
  ],
  'cloture-rebond': [
    'Quelles formalités de fermeture ?',
    'Comment rebondir après un échec ?',
    'Quels dispositifs de rebond existent ?',
  ],
  'satisfaction-feedback': [
    'Comment donner un retour constructif ?',
    'Mon avis influence-t-il le PAA ?',
    'Comment voir les résultats ?',
  ],
  'gamification': [
    'Comment gagner plus de points ?',
    'Quels défis sont disponibles ?',
    'Comment monter dans le classement ?',
  ],
  // ═══ SPECIAL ═══
  'pipeline-v3-overview': [
    'Comment avance mon pipeline ?',
    'Quelle est la prochaine étape ?',
    'Comment utiliser les livrables ?',
  ],
  'parcours-paa': [
    'Où en suis-je dans mon parcours ?',
    'Quelle prochaine atelier PAA ?',
    'Comment préparer ma prochaine session ?',
  ],
  default: [
    'Comment créer mon entreprise ?',
    'Quelles aides sont disponibles ?',
    'Comment trouver un conseiller ?',
  ],
}

/* ─── Quick Actions ─── */

interface QuickAction {
  label: string
  icon: React.ReactNode
  prompt: string
}

function getQuickActions(moduleCode: string): QuickAction[] {
  // Strategy modules
  const strategyModules = ['marche', 'juridique', 'financier', 'creasim', 'bmc', 'business-plan', 'pitch-deck', 'swot', 'marketing-commerciale', 'mind-map']
  // Diagnostic modules
  const diagnosticModules = ['pepites', 'riasec', 'kiviat', 'bilan-ia', 'creascope', 'profil-createur']
  // Pilotage modules
  const pilotageModules = ['tremplin', 'passeport', 'certifications', 'objectifs-smart', 'cloture-rebond', 'satisfaction-feedback', 'gamification', 'pipeline-v3-overview', 'parcours-paa']

  const actions: QuickAction[] = []

  if (strategyModules.includes(moduleCode)) {
    actions.push({
      label: 'Analyser mon projet',
      icon: <Zap className="h-3.5 w-3.5" />,
      prompt: 'Analyse mon projet en cours et donne-moi 3 recommandations stratégiques prioritaires.',
    })
  }

  if (diagnosticModules.includes(moduleCode)) {
    actions.push({
      label: 'Résumer mes données',
      icon: <FileSearch className="h-3.5 w-3.5" />,
      prompt: 'Fais un résumé synthétique de mes données dans ce module et identifie les points d\'attention.',
    })
  }

  if (pilotageModules.includes(moduleCode)) {
    actions.push({
      label: 'Plan d\'action',
      icon: <ListChecks className="h-3.5 w-3.5" />,
      prompt: 'Propose-moi un plan d\'action concret avec 5 étapes à réaliser dans les 30 prochains jours.',
    })
  }

  // Add a generic action if none matched
  if (actions.length === 0 && moduleCode) {
    actions.push({
      label: 'Conseils personnalisés',
      icon: <Sparkles className="h-3.5 w-3.5" />,
      prompt: 'Donne-moi 3 conseils personnalisés basés sur mes données dans ce module.',
    })
  }

  return actions
}

/* ─── Module data reader (try/catch safe) ─── */

function readModuleData(moduleCode: string): Record<string, string> {
  const key = MODULE_STORAGE_KEYS[moduleCode]
  if (!key) return {}

  try {
    if (typeof window === 'undefined') return {}
    const raw = localStorage.getItem(key)
    if (!raw) return {}

    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return {}

    // Flatten the data for the AI context (max 6 entries, truncate long values)
    const flat: Record<string, string> = {}
    let count = 0
    for (const [k, v] of Object.entries(data)) {
      if (count >= 6) break
      if (v === null || v === undefined) continue
      const strVal = typeof v === 'string' ? v : JSON.stringify(v)
      flat[k] = strVal.length > 300 ? strVal.slice(0, 300) + '...' : strVal
      count++
    }
    return flat
  } catch {
    return {}
  }
}

/* ─── History persistence helpers ─── */

function loadHistory(moduleId: string): ChatMessage[] {
  try {
    if (typeof window === 'undefined') return []
    const key = `creapulse-ia-history-${moduleId}`
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<{ id: string; role: string; content: string; timestamp: string }>
    return parsed.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      role: m.role as 'user' | 'assistant',
    }))
  } catch {
    return []
  }
}

function saveHistory(moduleId: string, messages: ChatMessage[]) {
  try {
    if (typeof window === 'undefined') return
    const key = `creapulse-ia-history-${moduleId}`
    // Keep max 50 messages
    const toSave = messages.slice(-50).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    }))
    localStorage.setItem(key, JSON.stringify(toSave))
  } catch {
    // Silently fail
  }
}

function clearHistory(moduleId: string) {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem(`creapulse-ia-history-${moduleId}`)
  } catch {
    // Silently fail
  }
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

/* ─── Copy icon component ─── */

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [content])

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={cn(
              'p-1 rounded-md transition-all duration-200 cursor-pointer',
              'text-muted-foreground/0 group-hover/message:text-muted-foreground/70',
              'hover:text-foreground hover:bg-muted/80',
              copied && 'text-emerald-500',
            )}
            aria-label="Copier le message"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {copied ? 'Copié !' : 'Copier'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastUserMessageRef = useRef<string>('')

  // Ensure portal target is available (client-only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine context
  const activeModule = currentModule || ''
  const moduleDef = activeModule ? getModuleDef(activeModule) : undefined
  const moduleName = moduleDef?.label || activeModule || ''
  const moduleDescription = moduleDef?.description || ''
  const greeting = greetings[activeModule] || defaultGreeting
  const moduleSuggestions = suggestions[activeModule] || suggestions.default
  const quickActions = activeModule ? getQuickActions(activeModule) : []

  // Load history when module changes or panel opens
  useEffect(() => {
    if (isOpen && activeModule) {
      const saved = loadHistory(activeModule)
      if (saved.length > 0) {
        setMessages(saved)
        setGreetingShown(true)
      }
    }
  }, [isOpen, activeModule])

  // Show greeting when panel opens (if no history)
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

  // Persist history on messages change (debounced via effect)
  useEffect(() => {
    if (isOpen && activeModule && messages.length > 0 && greetingShown) {
      saveHistory(activeModule, messages)
    }
  }, [messages, activeModule, isOpen, greetingShown])

  // Reset conversation when module changes (and panel is open)
  useEffect(() => {
    if (isOpen) {
      setGreetingShown(false)
      setMessages([])
    }
  }, [activeModule])

  // Read module data for context
  const getModuleData = useCallback((): Record<string, string> | undefined => {
    if (!activeModule) return undefined
    const data = readModuleData(activeModule)
    if (Object.keys(data).length === 0) return undefined
    return data
  }, [activeModule])

  // Send message handler
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    lastUserMessageRef.current = text.trim()

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const history = [...messages, userMessage]
        .filter((m) => m.id !== 'greeting')
        .map((m) => ({ role: m.role, content: m.content }))

      const moduleData = getModuleData()

      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: {
            module: activeModule || undefined,
            moduleDescription: moduleDescription || undefined,
            moduleData: moduleData || undefined,
          },
          history,
          action: 'chat',
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
  }, [isTyping, messages, activeModule, moduleDescription, getModuleData])

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Handle suggestion click
  const handleSuggestionClick = (text: string) => {
    sendMessage(text)
  }

  // Handle quick action click
  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  // Handle new conversation
  const handleNewConversation = () => {
    if (activeModule) {
      clearHistory(activeModule)
    }
    setGreetingShown(false)
    setMessages([])
    setTimeout(() => {
      setGreetingShown(true)
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ])
    }, 50)
  }

  // Handle regenerate last assistant message
  const handleRegenerate = useCallback(async () => {
    if (isTyping || !lastUserMessageRef.current) return

    // Remove last assistant message
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant') {
        return prev.slice(0, -1)
      }
      return prev
    })

    setIsTyping(true)

    try {
      const history = messages
        .filter((m) => m.id !== 'greeting' && m.role !== 'assistant' || m !== messages[messages.length - 1])
        .filter((m) => m.role === 'user')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const moduleData = getModuleData()

      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMessageRef.current,
          context: {
            module: activeModule || undefined,
            moduleDescription: moduleDescription || undefined,
            moduleData: moduleData || undefined,
          },
          history: history.length > 0 ? history.slice(0, -1) : undefined,
          action: 'chat',
        }),
      })

      const data = await response.json()

      if (data.success && data.data?.reply) {
        const aiMessage: ChatMessage = {
          id: `ai-regen-${Date.now()}`,
          role: 'assistant',
          content: data.data.reply,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch {
      // Silently fail
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, messages, activeModule, moduleDescription, getModuleData])

  // Check if the last message is from the assistant
  const lastMessageIsAssistant = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'

  if (!mounted) return null

  // Portal container
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
            <span className="absolute inset-0 rounded-full bg-teal-400/40 animate-ping" style={{ animationDuration: '2s' }} />
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
              'sm:h-[540px] sm:w-[400px] sm:max-h-[80vh]',
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

              <div className="flex items-center gap-1.5">
                {/* New conversation button */}
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={handleNewConversation}
                        aria-label="Nouvelle conversation"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Nouvelle conversation
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
                    'group/message flex items-end gap-2.5',
                    msg.role === 'user' && 'flex-row-reverse',
                  )}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
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
                  <div className="relative max-w-[78%]">
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
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

                    {/* Message actions — only on assistant messages */}
                    {msg.role === 'assistant' && msg.id !== 'greeting' && hoveredMsgId === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-6 left-2 flex items-center gap-0.5"
                      >
                        <CopyButton content={msg.content} />
                        {lastMessageIsAssistant && msg.id === messages[messages.length - 1]?.id && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={handleRegenerate}
                                  disabled={isTyping}
                                  className={cn(
                                    'p-1 rounded-md transition-all duration-200 cursor-pointer',
                                    'text-muted-foreground/70 hover:text-foreground hover:bg-muted/80',
                                    'disabled:opacity-40 disabled:cursor-not-allowed',
                                  )}
                                  aria-label="Régénérer la réponse"
                                >
                                  <RefreshCw className={cn('h-3.5 w-3.5', isTyping && 'animate-spin')} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Régénérer
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </motion.div>
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

            {/* ─── Quick Actions Bar (show only if few messages and not typing) ─── */}
            {messages.length <= 3 && !isTyping && quickActions.length > 0 && (
              <div className="px-4 pb-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleQuickAction(action.prompt)}
                      className={cn(
                        'flex items-center gap-1.5 text-[11px] leading-tight',
                        'px-2.5 py-1.5 rounded-full',
                        'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20',
                        'text-teal-700 dark:text-teal-300',
                        'border border-teal-200/50 dark:border-teal-700/30',
                        'hover:border-teal-300 dark:hover:border-teal-600/50',
                        'transition-colors cursor-pointer',
                      )}
                    >
                      {action.icon}
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

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

