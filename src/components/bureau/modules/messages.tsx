'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Paperclip,
  Smile,
  Mic,
  Plus,
  Clock,
  MessageSquareOff,
  MessagesSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ───────────────────────────────────

interface Participant {
  id: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: string
}

interface Conversation {
  id: string
  otherParticipant: Participant
  lastMessage: string | null
  lastMessageAt: string
  unreadCount: number
  createdAt: string
  isTyping?: boolean
}

interface Message {
  id: string
  content: string
  senderId: string
  sender: Participant
  isRead: boolean
  readAt: string | null
  createdAt: string
  isOwn: boolean
}

type DateGroup = 'Aujourd\'hui' | 'Hier' | 'Plus ancien'

// ─── Constants ──────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  COUNSELOR: 'Conseiller',
  BENEFICIARY: 'Beneficiaire',
}

const AVATAR_COLORS = [
  'bg-teal-500',
  'bg-amber-500',
  'bg-coral-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-indigo-500',
]

const EMOJI_LIST = [
  '😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨',
  '🙏', '💪', '👋', '🤝', '💡', '⭐', '🎯', '🚀',
  '😍', '🥰', '😎', '🤩', '💬', '📌', '✅', '❌',
]

const MAX_CHARS = 1000

// ─── Helpers ─────────────────────────────────

function getInitials(participant: Participant): string {
  const f = participant.firstName?.charAt(0)?.toUpperCase() || ''
  const l = participant.lastName?.charAt(0)?.toUpperCase() || ''
  return f + l || '?'
}

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "A l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH}h`
  if (diffD < 7) return `Il y a ${diffD}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatExactTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (msgDate.getTime() === today.getTime()) return "Aujourd'hui"
  if (msgDate.getTime() === yesterday.getTime()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function getConvoDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (msgDate.getTime() === today.getTime()) return "Aujourd'hui"
  if (msgDate.getTime() === yesterday.getTime()) return 'Hier'
  return 'Plus ancien'
}

function getOnlineStatus(lastActivityAt: string): { label: string; isOnline: boolean } {
  const date = new Date(lastActivityAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 5) {
    return { label: 'En ligne', isOnline: true }
  }
  if (diffMin < 60) {
    return { label: `Vu il y a ${diffMin} min`, isOnline: false }
  }
  const diffH = Math.floor(diffMs / 3600000)
  if (diffH < 24) {
    return { label: `Vu il y a ${diffH}h`, isOnline: false }
  }
  return { label: 'Hors ligne', isOnline: false }
}

function truncateSmart(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

// ─── Typing Indicator Component ─────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1">
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full bg-coral-400"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full bg-coral-400"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full bg-coral-400"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  )
}

// ─── Emoji Picker Component ─────────────────

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full right-0 mb-2 rounded-2xl border border-border bg-background p-3 shadow-xl dark:bg-card"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Emoji
      </p>
      <div className="grid grid-cols-6 gap-1">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-muted transition-colors active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────

export function MessagesModule() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isLoadingConvos, setIsLoadingConvos] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [mobileShowMessages, setMobileShowMessages] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedConv = conversations.find((c) => c.id === selectedConvId)

  // ─── Filter conversations by search ───────
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    const name = `${conv.otherParticipant.firstName || ''} ${conv.otherParticipant.lastName || ''}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // ─── Group conversations by date ──────────
  const groupedConversations = useMemo(() => {
    const groups: { label: DateGroup; conversations: Conversation[] }[] = []
    const order: DateGroup[] = ["Aujourd'hui", 'Hier', 'Plus ancien']

    filteredConversations.forEach((conv) => {
      const group = getConvoDateGroup(conv.lastMessageAt)
      const existing = groups.find((g) => g.label === group)
      if (existing) {
        existing.conversations.push(conv)
      } else {
        groups.push({ label: group, conversations: [conv] })
      }
    })

    return order
      .map((label) => groups.find((g) => g.label === label))
      .filter(Boolean) as { label: DateGroup; conversations: Conversation[] }[]
  }, [filteredConversations])

  // ─── Fetch conversations ─────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConvos(true)
      const res = await authFetch('/api/messages')
      if (!res.ok) throw new Error('Erreur de chargement')
      const json = await res.json()
      if (json.success) {
        setConversations(json.data.conversations)
      }
    } catch {
      toast.error('Erreur de chargement des conversations')
    } finally {
      setIsLoadingConvos(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // ─── Fetch messages ───────────────────────
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true)
      const res = await authFetch(`/api/messages/${conversationId}?limit=50`)
      if (!res.ok) throw new Error('Erreur de chargement')
      const json = await res.json()
      if (json.success) {
        setMessages(json.data.messages)
      }
    } catch {
      toast.error('Erreur de chargement des messages')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId)
      setMobileShowMessages(true)
    }
  }, [selectedConvId, fetchMessages])

  // ─── Auto-scroll ──────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send message ──────────────────────────
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConvId || isSending) return

    try {
      setIsSending(true)
      const res = await authFetch(`/api/messages/${selectedConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      })

      if (!res.ok) throw new Error("Erreur d'envoi")
      const json = await res.json()

      if (json.success) {
        setMessages((prev) => [...prev, json.data.message])
        setMessageInput('')
        setShowEmojiPicker(false)
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? { ...c, lastMessage: messageInput.trim().slice(0, 200), lastMessageAt: new Date().toISOString() }
              : c
          )
        )
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    } catch {
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setIsSending(false)
    }
  }

  // ─── Handle textarea ──────────────────────
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.length > MAX_CHARS) return
    setMessageInput(val)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const newVal = messageInput + emoji
    if (newVal.length > MAX_CHARS) return
    setMessageInput(newVal)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  // ─── Select conversation ──────────────────
  const selectConversation = (convId: string) => {
    setSelectedConvId(convId)
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    )
  }

  // ─── Group messages by date ────────────────
  const groupedMessages: { label: string; messages: Message[] }[] = []
  messages.forEach((msg) => {
    const label = formatDateGroup(msg.createdAt)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.label === label) {
      last.messages.push(msg)
    } else {
      groupedMessages.push({ label, messages: [msg] })
    }
  })

  // ─── Compute consecutive sender groups ─────
  // For each group, determine if each msg is first/last in a consecutive run from the same sender
  function getConsecutiveFlags(msgs: Message[]): { isFirstInGroup: boolean; isLastInGroup: boolean }[] {
    return msgs.map((msg, i) => {
      const prev = msgs[i - 1]
      const next = msgs[i + 1]
      const isFirstInGroup = !prev || prev.senderId !== msg.senderId || prev.isOwn !== msg.isOwn
      const isLastInGroup = !next || next.senderId !== msg.senderId || next.isOwn !== msg.isOwn
      return { isFirstInGroup, isLastInGroup }
    })
  }

  const onlineStatus = selectedConv ? getOnlineStatus(selectedConv.lastMessageAt) : null

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-border bg-background shadow-sm dark:border-border/50">
      {/* ═══ Left Panel: Conversations List ═══ */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex w-full flex-col border-r border-border bg-background',
          'md:w-80 lg:w-96',
          mobileShowMessages && selectedConvId ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/20">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Messages</h2>
              <p className="text-[11px] text-muted-foreground">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.info('Creation de conversation — bientot disponible')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground transition-all hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 active:scale-95 dark:hover:bg-teal-900/20 dark:hover:text-teal-400 dark:hover:border-teal-800/40"
            aria-label="Nouvelle conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="border-b border-border px-3 py-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/40 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-teal-400 focus:bg-background focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:bg-muted/20 dark:focus:border-teal-500/50"
            />
          </div>
        </div>

        {/* ── Conversations list ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoadingConvos ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              <p className="text-xs text-muted-foreground">Chargement...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            /* ── Empty state: No conversations ── */
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mb-5"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/10">
                  <MessagesSquare className="h-8 w-8 text-teal-500" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-coral-500 shadow-md"
                >
                  <MessageCircle className="h-3 w-3 text-white" />
                </motion.div>
              </motion.div>
              <p className="text-sm font-semibold text-foreground">
                {searchQuery ? 'Aucun resultat' : 'Aucune conversation'}
              </p>
              <p className="mt-1.5 max-w-[200px] text-center text-xs leading-relaxed text-muted-foreground">
                {searchQuery
                  ? 'Essayez un autre terme de recherche'
                  : 'Commencez une nouvelle conversation pour echanger avec votre equipe'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {groupedConversations.map((group) => (
                <div key={group.label}>
                  {/* Date section label */}
                  <div className="px-4 pt-3 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                      {group.label}
                    </span>
                  </div>
                  {group.conversations.map((conv, idx) => {
                    const isActive = conv.id === selectedConvId
                    const initials = getInitials(conv.otherParticipant)
                    const color = getAvatarColor(conv.otherParticipant.id)
                    const fullName = `${conv.otherParticipant.firstName || ''} ${conv.otherParticipant.lastName || ''}`.trim() || 'Utilisateur'
                    const hasUnread = conv.unreadCount > 0

                    return (
                      <motion.button
                        key={conv.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        onClick={() => selectConversation(conv.id)}
                        className={cn(
                          'group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-all duration-200',
                          isActive
                            ? 'bg-teal-50/80 dark:bg-teal-900/15'
                            : 'hover:bg-muted/50 dark:hover:bg-muted/20'
                        )}
                      >
                        {/* Left accent bar for unread */}
                        {hasUnread && (
                          <motion.div
                            layoutId={`accent-${conv.id}`}
                            className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-coral-500"
                          />
                        )}

                        {/* Active indicator bar */}
                        {isActive && !hasUnread && (
                          <div className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-500" />
                        )}

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm transition-transform group-hover:scale-105',
                              color
                            )}
                          >
                            {initials}
                          </div>
                          {/* Online dot */}
                          {getOnlineStatus(conv.lastMessageAt).isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 dark:border-background" />
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={cn(
                                  'truncate text-sm',
                                  hasUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground/90'
                                )}
                              >
                                {fullName}
                              </span>
                              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground dark:bg-muted/60">
                                {ROLE_LABELS[conv.otherParticipant.role] || conv.otherParticipant.role}
                              </span>
                            </div>
                            <span className={cn(
                              'shrink-0 text-[10px]',
                              hasUnread ? 'font-semibold text-coral-500' : 'text-muted-foreground'
                            )}>
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          </div>

                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            {conv.isTyping ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-coral-500">Ecrit...</span>
                                <TypingIndicator />
                              </div>
                            ) : (
                              <p className={cn(
                                'flex-1 truncate text-xs leading-relaxed',
                                hasUnread ? 'font-medium text-foreground/80' : 'text-muted-foreground'
                              )}>
                                {truncateSmart(conv.lastMessage || 'Aucun message', 42)}
                              </p>
                            )}
                            {hasUnread && (
                              <motion.span
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white shadow-sm"
                              >
                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ Right Panel: Message View ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex flex-1 flex-col bg-muted/20 dark:bg-muted/5',
          !mobileShowMessages && selectedConvId ? 'hidden md:flex' : 'flex'
        )}
      >
        {selectedConv ? (
          <>
            {/* ── Chat header ── */}
            <div className="glass-card flex items-center gap-3 border-b border-border px-4 py-3">
              {/* Mobile back button */}
              <button
                onClick={() => {
                  setMobileShowMessages(false)
                  setSelectedConvId(null)
                }}
                className="mr-1 flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted md:hidden"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4 text-foreground" />
              </button>

              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm',
                    getAvatarColor(selectedConv.otherParticipant.id)
                  )}
                >
                  {getInitials(selectedConv.otherParticipant)}
                </div>
                {/* Online dot with ping */}
                {onlineStatus?.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 dark:border-background" />
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {`${selectedConv.otherParticipant.firstName || ''} ${selectedConv.otherParticipant.lastName || ''}`.trim() || 'Utilisateur'}
                </p>
                <div className="flex items-center gap-1.5">
                  {onlineStatus?.isOnline ? (
                    <>
                      <span className="flex h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        En ligne
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground">
                        {onlineStatus?.label || 'Hors ligne'}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {ROLE_LABELS[selectedConv.otherParticipant.role] || selectedConv.otherParticipant.role}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Messages area ── */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Chargement des messages...</p>
                </div>
              ) : messages.length === 0 ? (
                /* ── Empty state: No messages ── */
                <div className="flex flex-col items-center justify-center py-16">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-5"
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10"
                    >
                      <MessageCircle className="h-10 w-10 text-teal-500" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                      className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </motion.div>
                  </motion.div>
                  <h3 className="text-sm font-bold text-foreground">Debut de la conversation</h3>
                  <p className="mt-1 max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground">
                    Envoyez le premier message pour demarrer l&apos;echangement
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedMessages.map((group) => {
                    const flags = getConsecutiveFlags(group.messages)
                    return (
                      <div key={group.label}>
                        {/* ── Date separator: pill with border lines ── */}
                        <div className="flex items-center gap-3 py-2">
                          <div className="h-px flex-1 bg-border/60 dark:bg-border/30" />
                          <span className="shrink-0 rounded-full border border-border/60 bg-muted/60 px-4 py-1 text-[11px] font-semibold text-muted-foreground dark:border-border/30 dark:bg-muted/20">
                            {group.label}
                          </span>
                          <div className="h-px flex-1 bg-border/60 dark:bg-border/30" />
                        </div>

                        {/* ── Messages in this group ── */}
                        <div className="space-y-1">
                          {group.messages.map((msg, msgIdx) => {
                            const isOwn = msg.isOwn
                            const { isFirstInGroup, isLastInGroup } = flags[msgIdx]
                            const isHovered = hoveredMessageId === msg.id

                            return (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                onMouseEnter={() => setHoveredMessageId(msg.id)}
                                onMouseLeave={() => setHoveredMessageId(null)}
                                className={cn(
                                  'flex gap-2',
                                  isOwn ? 'flex-row-reverse' : 'flex-row',
                                  isFirstInGroup && !isLastInGroup ? 'mt-3' : '',
                                  isLastInGroup && !isFirstInGroup ? 'mb-1' : ''
                                )}
                              >
                                {/* Avatar for received: show only for first in group */}
                                {!isOwn && (
                                  <div className="w-8 shrink-0">
                                    {isFirstInGroup ? (
                                      <div
                                        className={cn(
                                          'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white',
                                          getAvatarColor(msg.senderId)
                                        )}
                                      >
                                        {getInitials(msg.sender)}
                                      </div>
                                    ) : (
                                      <div className="w-8" />
                                    )}
                                  </div>
                                )}

                                {/* Bubble wrapper */}
                                <div className={cn('max-w-[75%] md:max-w-[60%]')}>
                                  {/* Sender name: show only for first in group (received) */}
                                  {!isOwn && isFirstInGroup && (
                                    <p className="mb-1 px-1 text-[11px] font-semibold text-muted-foreground">
                                      {msg.sender.firstName} {msg.sender.lastName}
                                    </p>
                                  )}

                                  {/* Message bubble */}
                                  <div
                                    className={cn(
                                      'relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow',
                                      isOwn
                                        ? cn(
                                            'bg-gradient-to-br from-teal-500 to-teal-600 text-white',
                                            isFirstInGroup ? 'rounded-br-lg' : 'rounded-br-lg',
                                            isLastInGroup ? 'rounded-tr-lg' : 'rounded-tr-lg',
                                            'hover:shadow-md hover:shadow-teal-500/10'
                                          )
                                        : cn(
                                            'border border-border bg-white text-foreground dark:border-border/50 dark:bg-card dark:text-foreground',
                                            isFirstInGroup ? 'rounded-bl-lg' : 'rounded-bl-lg',
                                            isLastInGroup ? 'rounded-tl-lg' : 'rounded-tl-lg',
                                            'hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20'
                                          )
                                    )}
                                  >
                                    {/* Hover time tooltip for own messages */}
                                    {isOwn && isHovered && (
                                      <div className="absolute -left-1 top-1/2 -translate-x-full -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] text-background shadow-md">
                                        {formatExactTime(msg.createdAt)}
                                        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
                                      </div>
                                    )}
                                    {/* Hover time tooltip for received messages */}
                                    {!isOwn && isHovered && (
                                      <div className="absolute -right-1 top-1/2 -translate-x-full -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[10px] text-background shadow-md">
                                        {formatExactTime(msg.createdAt)}
                                        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground" />
                                      </div>
                                    )}
                                    {msg.content}
                                  </div>

                                  {/* Time + read receipt */}
                                  <div
                                    className={cn(
                                      'mt-0.5 flex items-center gap-1 px-1',
                                      isOwn ? 'justify-end' : 'justify-start'
                                    )}
                                  >
                                    <AnimatePresence>
                                      {(isLastInGroup || isHovered) && (
                                        <motion.span
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="text-[10px] text-muted-foreground/60"
                                        >
                                          {formatMessageTime(msg.createdAt)}
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                    {isOwn && (
                                      msg.isRead ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-teal-500" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 text-muted-foreground/40" />
                                      )
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div className="border-t border-border bg-background px-3 pb-3 pt-2 dark:bg-card/50">
              <div className="relative flex items-end gap-2">
                {/* Emoji picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </AnimatePresence>

                {/* Attachment button */}
                <button
                  onClick={() => toast.info('Piece jointe — bientot disponible')}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                  aria-label="Joindre un fichier"
                >
                  <Paperclip className="h-4.5 w-4.5" />
                </button>

                {/* Text input */}
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ecrire un message..."
                    rows={1}
                    className="w-full resize-none rounded-2xl border border-border bg-muted/40 px-4 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground transition-all focus:border-teal-400 focus:bg-background focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:bg-muted/20 dark:focus:border-teal-500/50"
                    style={{ maxHeight: '120px' }}
                  />
                </div>

                {/* Emoji button */}
                <button
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={cn(
                    'mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95',
                    showEmojiPicker
                      ? 'bg-coral-50 text-coral-500 dark:bg-coral-900/20 dark:text-coral-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  aria-label="Emoji"
                >
                  <Smile className="h-4.5 w-4.5" />
                </button>

                {/* Voice message button */}
                <button
                  onClick={() => toast.info('Message vocal — bientot disponible')}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                  aria-label="Message vocal"
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className={cn(
                    'mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                    messageInput.trim() && !isSending
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 active:scale-95 hover:scale-105'
                      : 'cursor-not-allowed bg-muted text-muted-foreground/40'
                  )}
                  aria-label="Envoyer"
                >
                  {isSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Character counter + hint */}
              <div className="mt-1.5 flex items-center justify-between px-1">
                <p className="text-[10px] text-muted-foreground/50">
                  ⌘+Entrée pour envoyer
                </p>
                <p className={cn(
                  'text-[10px] tabular-nums transition-colors',
                  messageInput.length > MAX_CHARS * 0.9
                    ? 'font-semibold text-coral-500'
                    : 'text-muted-foreground/40'
                )}>
                  {messageInput.length}/{MAX_CHARS}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* ═══ Empty state: No conversation selected ═══ */
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                {/* Animated empty state icon */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mb-6"
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10">
                    <MessageCircle className="h-12 w-12 text-teal-500" />
                  </div>

                  {/* Floating badge */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-coral-500 to-coral-600 shadow-lg shadow-coral-500/30"
                  >
                    <MessageSquareOff className="h-4 w-4 text-white" />
                  </motion.div>

                  {/* Floating send icon */}
                  <motion.div
                    animate={{ y: [0, -4, 0], x: [0, 2, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30"
                  >
                    <Send className="h-3.5 w-3.5 text-white" />
                  </motion.div>
                </motion.div>

                <h3 className="text-lg font-bold text-foreground">
                  Selectionnez une conversation
                </h3>
                <p className="mt-2 max-w-[280px] text-center text-sm leading-relaxed text-muted-foreground">
                  Choisissez une conversation dans la liste pour commencer a echanger avec vos collaborateurs
                </p>

                {/* Decorative dots */}
                <div className="mt-8 flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    className="h-1.5 w-1.5 rounded-full bg-teal-400"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    className="h-1.5 w-1.5 rounded-full bg-teal-400"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    className="h-1.5 w-1.5 rounded-full bg-teal-400"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
