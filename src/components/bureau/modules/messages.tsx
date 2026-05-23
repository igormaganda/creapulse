'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'

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

// ─── Helpers ─────────────────────────────────

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

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedConv = conversations.find((c) => c.id === selectedConvId)

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    const name = `${conv.otherParticipant.firstName || ''} ${conv.otherParticipant.lastName || ''}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // ─── Fetch conversations ───────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConvos(true)
      const res = await fetch('/api/messages')
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

  // ─── Fetch messages ────────────────────────
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true)
      const res = await fetch(`/api/messages/${conversationId}?limit=50`)
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

  // ─── Auto-scroll ───────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send message ──────────────────────────
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConvId || isSending) return

    try {
      setIsSending(true)
      const res = await fetch(`/api/messages/${selectedConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      })

      if (!res.ok) throw new Error('Erreur d\'envoi')
      const json = await res.json()

      if (json.success) {
        setMessages((prev) => [...prev, json.data.message])
        setMessageInput('')
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvId
              ? { ...c, lastMessage: messageInput.trim().slice(0, 200), lastMessageAt: new Date().toISOString() }
              : c
          )
        )
        // Adjust textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    } catch {
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setIsSending(false)
    }
  }

  // ─── Handle textarea ───────────────────────
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value)
    // Auto-expand
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

  // ─── Select conversation ───────────────────
  const selectConversation = (convId: string) => {
    setSelectedConvId(convId)
    // Clear unread count locally
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

  return (
    <div className="flex h-full">
      {/* ─── Left Panel: Conversations List ─── */}
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
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
            <p className="text-xs text-muted-foreground">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoadingConvos ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <MessageCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {searchQuery ? 'Aucun resultat' : 'Aucune conversation'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {searchQuery ? 'Essayez un autre terme' : 'Vos conversations apparaitront ici'}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filteredConversations.map((conv, idx) => {
                const isActive = conv.id === selectedConvId
                const initials = getInitials(conv.otherParticipant)
                const color = getAvatarColor(conv.otherParticipant.id)
                const fullName = `${conv.otherParticipant.firstName || ''} ${conv.otherParticipant.lastName || ''}`.trim() || 'Utilisateur'

                return (
                  <motion.button
                    key={conv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                      isActive && 'bg-muted/80 border-l-2 border-l-teal-500'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                      color
                    )}>
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            'text-sm font-semibold truncate',
                            isActive ? 'text-foreground' : 'text-foreground'
                          )}>
                            {fullName}
                          </span>
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {ROLE_LABELS[conv.otherParticipant.role] || conv.otherParticipant.role}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="flex-1 truncate text-xs text-muted-foreground line-clamp-1">
                          {conv.lastMessage || 'Aucun message'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold text-white">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Right Panel: Message View ──────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex flex-1 flex-col bg-muted/20',
          !mobileShowMessages && selectedConvId ? 'hidden md:flex' : 'flex'
        )}
      >
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
              {/* Mobile back button */}
              <button
                onClick={() => {
                  setMobileShowMessages(false)
                  setSelectedConvId(null)
                }}
                className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted md:hidden"
              >
                <ArrowLeft className="h-4 w-4 text-foreground" />
              </button>

              {/* Avatar */}
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                getAvatarColor(selectedConv.otherParticipant.id)
              )}>
                {getInitials(selectedConv.otherParticipant)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {`${selectedConv.otherParticipant.firstName || ''} ${selectedConv.otherParticipant.lastName || ''}`.trim() || 'Utilisateur'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-green-500">
                    <span className="absolute h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    En ligne
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">•</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {ROLE_LABELS[selectedConv.otherParticipant.role] || selectedConv.otherParticipant.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <MessageCircle className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Debut de la conversation
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Envoyez le premier message
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedMessages.map((group) => (
                    <div key={group.label}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center py-2">
                        <span className="rounded-full bg-muted/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                          {group.label}
                        </span>
                      </div>

                      {/* Messages in this group */}
                      <div className="space-y-2">
                        {group.messages.map((msg) => {
                          const isOwn = msg.isOwn
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                'flex gap-2',
                                isOwn ? 'flex-row-reverse' : 'flex-row'
                              )}
                            >
                              {/* Avatar for received */}
                              {!isOwn && (
                                <div className={cn(
                                  'mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                                  getAvatarColor(msg.senderId)
                                )}>
                                  {getInitials(msg.sender)}
                                </div>
                              )}

                              {/* Bubble */}
                              <div className={cn(
                                'max-w-[75%] md:max-w-[60%]',
                                isOwn ? 'items-end' : 'items-start'
                              )}>
                                {/* Sender name (for clarity) */}
                                {!isOwn && (
                                  <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                                    {msg.sender.firstName} {msg.sender.lastName}
                                  </p>
                                )}

                                <div className={cn(
                                  'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                                  isOwn
                                    ? 'rounded-br-md bg-gradient-to-br from-teal-500 to-teal-600 text-white'
                                    : 'rounded-bl-md bg-white border border-border text-foreground dark:bg-card dark:border-border'
                                )}>
                                  {msg.content}
                                </div>

                                {/* Time + read receipt */}
                                <div className={cn(
                                  'mt-1 flex items-center gap-1',
                                  isOwn ? 'justify-end' : 'justify-start'
                                )}>
                                  <span className="text-[10px] text-muted-foreground/70">
                                    {formatMessageTime(msg.createdAt)}
                                  </span>
                                  {isOwn && (
                                    msg.isRead ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-teal-500" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-muted-foreground/50" />
                                    )
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-border bg-background p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ecrire un message..."
                    rows={1}
                    className="w-full resize-none rounded-xl border border-border bg-muted/50 py-2.5 pl-3.5 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                    messageInput.trim() && !isSending
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 active:scale-95'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {isSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
                Appuyez sur ⌘+Entrée pour envoyer
              </p>
            </div>
          </>
        ) : (
          /* ─── Empty state: No conversation selected ─── */
          <div className="flex flex-1 flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500/10 to-teal-500/5">
                    <MessageCircle className="h-10 w-10 text-teal-500" />
                  </div>
                  <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600">
                    <Send className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">
                  Selectionnez une conversation
                </h3>
                <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
                  Choisissez une conversation dans la liste pour commencer a echanger
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
