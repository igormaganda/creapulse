'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/scroll-area'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  Heart,
  Send,
  TrendingUp,
  Clock,
  UserPlus,
  UserCheck,
  Star,
  Globe,
  Briefcase,
  Leaf,
  ShoppingBag,
  Wrench,
  GraduationCap,
  Shield,
  ChevronRight,
  Sparkles,
  Loader2,
  ThumbsUp,
  Reply,
  Hash,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ───────────────────────────────────

interface Member {
  id: string
  name: string
  role: 'Créateur' | 'Mentor' | 'Conseiller'
  specialty: string
  online: boolean
  joinedGroups: string[]
}

interface Group {
  id: string
  name: string
  description: string
  category: string
  members: number
  icon: typeof Users
  iconBg: string
  isJoined: boolean
}

interface Post {
  id: string
  author: string
  authorRole: string
  group: string
  groupId: string
  title: string
  content: string
  likes: number
  liked: boolean
  replies: Reply[]
  timestamp: string
  trending: boolean
}

interface Reply {
  id: string
  author: string
  authorRole: string
  content: string
  timestamp: string
  likes: number
}

interface ConnectionRequest {
  id: string
  from: string
  role: string
  specialty: string
  timestamp: string
}

interface CommunauteData {
  groups: Group[]
  posts: Post[]
  members: Member[]
  connections: ConnectionRequest[]
  myGroups: string[]
}

// ─── Seed Data ───────────────────────────────

const INITIAL_GROUPS: Group[] = [
  { id: 'g1', name: 'E-commerce', description: 'Vente en ligne, marketplaces, dropshipping et logistique e-commerce.', category: 'Commerce', members: 234, icon: ShoppingBag, iconBg: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', isJoined: false },
  { id: 'g2', name: 'Tech Startup', description: 'Innovation tech, SaaS, apps mobiles et levée de fonds.', category: 'Tech', members: 189, icon: Globe, iconBg: 'bg-sky-100 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400', isJoined: false },
  { id: 'g3', name: 'Restauration', description: 'Ouverture de restaurant, food truck, traiteur et normes hygiène.', category: 'Alimentaire', members: 156, icon: Briefcase, iconBg: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400', isJoined: false },
  { id: 'g4', name: 'Artisanat', description: 'Métiers artisanaux, création, artisanat d\'art et transmission de savoir-faire.', category: 'Artisanat', members: 143, icon: Wrench, iconBg: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', isJoined: false },
  { id: 'g5', name: 'Services B2B', description: 'Conseil, consulting, prestation de services aux entreprises.', category: 'Services', members: 198, icon: Briefcase, iconBg: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', isJoined: false },
  { id: 'g6', name: 'Transition écologique', description: 'Économie circulaire, éco-conception, bilan carbone et développement durable.', category: 'Écologie', members: 167, icon: Leaf, iconBg: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400', isJoined: false },
  { id: 'g7', name: 'Franchise', description: 'Réseaux de franchise, franchise indépendante et droits de redevance.', category: 'Commerce', members: 89, icon: Star, iconBg: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', isJoined: false },
  { id: 'g8', name: 'Social & Solidaire', description: 'Entreprise sociale, association, ESUS et impact social.', category: 'Social', members: 112, icon: Shield, iconBg: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400', isJoined: false },
]

const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Sophie Martin', role: 'Créateur', specialty: 'E-commerce', online: true, joinedGroups: ['g1'] },
  { id: 'm2', name: 'Thomas Dupont', role: 'Mentor', specialty: 'Tech & Innovation', online: true, joinedGroups: ['g2'] },
  { id: 'm3', name: 'Marie Leclerc', role: 'Conseiller', specialty: 'Finance & Trésorerie', online: false, joinedGroups: ['g5'] },
  { id: 'm4', name: 'Lucas Bernard', role: 'Créateur', specialty: 'Restauration', online: true, joinedGroups: ['g3'] },
  { id: 'm5', name: 'Emma Petit', role: 'Créateur', specialty: 'Artisanat d\'art', online: false, joinedGroups: ['g4'] },
  { id: 'm6', name: 'Pierre Moreau', role: 'Mentor', specialty: 'Marketing digital', online: true, joinedGroups: ['g1', 'g2'] },
  { id: 'm7', name: 'Camille Roux', role: 'Créateur', specialty: 'Transition écologique', online: false, joinedGroups: ['g6'] },
  { id: 'm8', name: 'Antoine Girard', role: 'Conseiller', specialty: 'Juridique', online: true, joinedGroups: ['g7', 'g8'] },
]

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1', author: 'Sophie Martin', authorRole: 'Créateur', group: 'E-commerce', groupId: 'g1',
    title: 'Conseils pour lancer sa boutique Shopify en 2024',
    content: 'Bonjour à tous ! Je prépare le lancement de ma boutique en ligne de produits artisanaux. Quelles sont vos meilleures pratiques pour le SEO et la publicité Facebook ?',
    likes: 12, liked: false,
    replies: [
      { id: 'r1', author: 'Pierre Moreau', authorRole: 'Mentor', content: 'Concentre-toi sur le SEO local et les longues traînes. Utilise aussi Google Shopping pour les produits physiques.', timestamp: 'Il y a 2h', likes: 5 },
      { id: 'r2', author: 'Emma Petit', authorRole: 'Créateur', content: 'J\'ai utilisé Shopify pour mon atelier en ligne, n\'hésite pas à me contacter pour mes retours d\'expérience !', timestamp: 'Il y a 1h', likes: 3 },
    ],
    timestamp: 'Il y a 3h', trending: true,
  },
  {
    id: 'p2', author: 'Lucas Bernard', authorRole: 'Créateur', group: 'Restauration', groupId: 'g3',
    title: 'Food truck ou restaurant traditionnel ?',
    content: 'Je hésite entre un food truck (investissement moindre) et un petit restaurant en centre-ville. Vos retours d\'expérience ?',
    likes: 8, liked: false,
    replies: [
      { id: 'r3', author: 'Marie Leclerc', authorRole: 'Conseiller', content: 'Le food truck permet de tester votre concept avec moins de risque. Vous pouvez toujours évoluer vers un restaurant une fois le modèle validé.', timestamp: 'Il y a 5h', likes: 7 },
    ],
    timestamp: 'Il y a 6h', trending: false,
  },
  {
    id: 'p3', author: 'Camille Roux', authorRole: 'Créateur', group: 'Transition écologique', groupId: 'g6',
    title: 'Comment obtenir le label B Corp en France ?',
    content: 'Je suis en train de monter une entreprise de produits ménagers écologiques. Le label B Corp est-il pertinent pour une TPE ? Quelles sont les étapes ?',
    likes: 15, liked: false,
    replies: [],
    timestamp: 'Il y a 1j', trending: true,
  },
  {
    id: 'p4', author: 'Thomas Dupont', authorRole: 'Mentor', group: 'Tech Startup', groupId: 'g2',
    title: 'Les erreurs à éviter lors de sa première levée de fonds',
    content: 'Après avoir accompagné 15+ startups dans leur première levée, voici les 5 erreurs que je vois le plus souvent. 1) Ne pas avoir validé son PMF, 2) Viser trop haut trop tôt...',
    likes: 24, liked: false,
    replies: [
      { id: 'r4', author: 'Sophie Martin', authorRole: 'Créateur', content: 'Excellent article ! Le point sur le PMF est crucial. J\'aurais dû lire ça avant de me lancer.', timestamp: 'Il y a 2j', likes: 4 },
    ],
    timestamp: 'Il y a 3j', trending: true,
  },
]

const STORAGE_KEY = 'creapulse-communaute'

function createId() { return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getRoleColor(role: string) {
  switch (role) {
    case 'Mentor': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
    case 'Conseiller': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  }
}

// ─── Main Component ──────────────────────────

export function CommunauteModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<CommunauteData>({
    groups: INITIAL_GROUPS,
    posts: INITIAL_POSTS,
    members: INITIAL_MEMBERS,
    connections: [],
    myGroups: [],
  })

  // Filters
  const [searchGroups, setSearchGroups] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchPosts, setSearchPosts] = useState('')
  const [sortPosts, setSortPosts] = useState<'recent' | 'trending'>('recent')
  const [searchMembers, setSearchMembers] = useState('')

  // New post
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostGroup, setNewPostGroup] = useState('')

  // Reply
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // Expanded post
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  // AI loading
  const [aiLoading, setAiLoading] = useState(false)

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.groups) setData(prev => ({ ...prev, groups: parsed.groups }))
        if (parsed.posts) setData(prev => ({ ...prev, posts: parsed.posts }))
        if (parsed.myGroups) setData(prev => ({ ...prev, myGroups: parsed.myGroups, groups: prev.groups.map(g => ({ ...g, isJoined: parsed.myGroups.includes(g.id) })) }))
        if (parsed.connections) setData(prev => ({ ...prev, connections: parsed.connections }))
      } catch { /* ignore */ }
    }
    setIsLoading(false)
  }, [])

  // Save data
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        groups: data.groups,
        posts: data.posts,
        myGroups: data.myGroups,
        connections: data.connections,
      }))
    }
  }, [isLoading, data])

  // ─── Actions ─────────────────────────────
  const toggleJoinGroup = useCallback((groupId: string) => {
    setData(prev => {
      const isJoined = prev.myGroups.includes(groupId)
      return {
        ...prev,
        myGroups: isJoined ? prev.myGroups.filter(id => id !== groupId) : [...prev.myGroups, groupId],
        groups: prev.groups.map(g => g.id === groupId ? { ...g, isJoined: !isJoined, members: isJoined ? g.members - 1 : g.members + 1 } : g),
      }
    })
    const group = data.groups.find(g => g.id === groupId)
    const isJoined = data.myGroups.includes(groupId)
    toast.success(isJoined ? `Vous avez quitté "${group?.name}"` : `Vous avez rejoint "${group?.name}"`)
  }, [data.groups, data.myGroups])

  const handleCreatePost = useCallback(() => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !newPostGroup) {
      toast.error('Remplissez tous les champs')
      return
    }
    const group = data.groups.find(g => g.id === newPostGroup)
    const newPost: Post = {
      id: createId(),
      author: 'Vous',
      authorRole: 'Créateur',
      group: group?.name || '',
      groupId: newPostGroup,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      likes: 0,
      liked: false,
      replies: [],
      timestamp: 'À l\'instant',
      trending: false,
    }
    setData(prev => ({ ...prev, posts: [newPost, ...prev.posts] }))
    setNewPostTitle('')
    setNewPostContent('')
    setNewPostGroup('')
    setShowNewPost(false)
    toast.success('Publication créée !')
  }, [newPostTitle, newPostContent, newPostGroup, data.groups])

  const toggleLike = useCallback((postId: string) => {
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p),
    }))
  }, [])

  const handleReply = useCallback((postId: string) => {
    if (!replyContent.trim()) return
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? {
        ...p,
        replies: [...p.replies, { id: createId(), author: 'Vous', authorRole: 'Créateur', content: replyContent.trim(), timestamp: 'À l\'instant', likes: 0 }],
      } : p),
    }))
    setReplyContent('')
    setReplyingTo(null)
    toast.success('Réponse publiée !')
  }, [replyContent])

  const toggleLikeReply = useCallback((postId: string, replyId: string) => {
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? {
        ...p,
        replies: p.replies.map(r => r.id === replyId ? { ...r, likes: r.likes + 1 } : r),
      } : p),
    }))
  }, [])

  const sendConnection = useCallback((memberId: string) => {
    const member = data.members.find(m => m.id === memberId)
    if (!member) return
    setData(prev => ({
      ...prev,
      connections: [...prev.connections, { id: createId(), from: member.name, role: member.role, specialty: member.specialty, timestamp: 'À l\'instant' }],
    }))
    toast.success(`Demande envoyée à ${member.name}`)
  }, [data.members])

  const handleAiSuggest = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await authFetch('/api/communaute', {
        method: 'POST',
        body: JSON.stringify({ action: 'ai-suggest', myGroups: data.myGroups }),
      })
      const json = await res.json()
      if (json.success && json.data?.suggestion) {
        toast.success(json.data.suggestion)
      } else {
        toast.error('Erreur lors de la suggestion IA')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setAiLoading(false)
    }
  }, [data.myGroups])

  // ─── Computed ────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set(data.groups.map(g => g.category))
    return ['all', ...Array.from(cats)]
  }, [data.groups])

  const filteredGroups = useMemo(() => {
    return data.groups.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(searchGroups.toLowerCase()) || g.description.toLowerCase().includes(searchGroups.toLowerCase())
      const matchCategory = filterCategory === 'all' || g.category === filterCategory
      return matchSearch && matchCategory
    })
  }, [data.groups, searchGroups, filterCategory])

  const filteredPosts = useMemo(() => {
    return data.posts
      .filter(p => {
        const matchSearch = p.title.toLowerCase().includes(searchPosts.toLowerCase()) || p.content.toLowerCase().includes(searchPosts.toLowerCase())
        const matchGroup = data.myGroups.length === 0 || data.myGroups.includes(p.groupId)
        return matchSearch && matchGroup
      })
      .sort((a, b) => {
        if (sortPosts === 'trending') return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.likes - a.likes
        return 0 // recent order (already sorted by insertion)
      })
  }, [data.posts, searchPosts, sortPosts, data.myGroups])

  const filteredMembers = useMemo(() => {
    return data.members.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchMembers.toLowerCase()) || m.specialty.toLowerCase().includes(searchMembers.toLowerCase())
      return matchSearch
    })
  }, [data.members, searchMembers])

  const joinedCount = data.myGroups.length
  const totalPosts = data.posts.length
  const onlineMembers = data.members.filter(m => m.online).length

  // ─── Loading ─────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  // ─── Render ──────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
            <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Communauté</h2>
            <p className="text-xs text-muted-foreground">Groupes thématiques, discussions et réseau entrepreneurial</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-orange-400/40 text-orange-500 hover:bg-orange-400/10"
            onClick={handleAiSuggest}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Suggestion IA
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 p-4 md:px-6 bg-muted/30 border-b">
        <div className="text-center">
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{joinedCount}</p>
          <p className="text-[11px] text-muted-foreground">Groupes rejoints</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{totalPosts}</p>
          <p className="text-[11px] text-muted-foreground">Discussions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{onlineMembers}</p>
          <p className="text-[11px] text-muted-foreground">En ligne</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groupes" className="p-4 md:p-6">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="groupes" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />Groupes
          </TabsTrigger>
          <TabsTrigger value="discussions" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5" />Discussions
          </TabsTrigger>
          <TabsTrigger value="reseau" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" />Réseau
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Groupes ═══ */}
        <TabsContent value="groupes" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un groupe..."
                value={searchGroups}
                onChange={e => setSearchGroups(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  size="sm"
                  variant={filterCategory === cat ? 'default' : 'outline'}
                  className={cn('text-xs', filterCategory === cat && 'bg-orange-600 hover:bg-orange-700 text-white')}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat === 'all' ? 'Tous' : cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Groups grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => {
              const Icon = group.icon
              return (
                <motion.div key={group.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Card className={cn('h-full transition-all hover:shadow-md', group.isJoined && 'border-orange-300 dark:border-orange-700')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', group.iconBg)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{group.name}</CardTitle>
                            <Badge variant="outline" className="text-[10px] mt-1">{group.category}</Badge>
                          </div>
                        </div>
                        {group.isJoined && (
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-[10px]">
                            <UserCheck className="h-3 w-3 mr-1" />Rejoint
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {group.members} membres
                        </div>
                        <Button
                          size="sm"
                          variant={group.isJoined ? 'outline' : 'default'}
                          className={cn('text-xs', !group.isJoined && 'bg-orange-600 hover:bg-orange-700 text-white')}
                          onClick={() => toggleJoinGroup(group.id)}
                        >
                          {group.isJoined ? 'Quitter' : 'Rejoindre'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
          {filteredGroups.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun groupe trouvé</p>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB 2: Discussions ═══ */}
        <TabsContent value="discussions" className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une discussion..."
                value={searchPosts}
                onChange={e => setSearchPosts(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortPosts === 'recent' ? 'default' : 'outline'}
                className={cn('text-xs', sortPosts === 'recent' && 'bg-orange-600 hover:bg-orange-700 text-white')}
                onClick={() => setSortPosts('recent')}
              >
                <Clock className="h-3.5 w-3.5 mr-1" />Récentes
              </Button>
              <Button
                size="sm"
                variant={sortPosts === 'trending' ? 'default' : 'outline'}
                className={cn('text-xs', sortPosts === 'trending' && 'bg-orange-600 hover:bg-orange-700 text-white')}
                onClick={() => setSortPosts('trending')}
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1" />Tendances
              </Button>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1" onClick={() => setShowNewPost(true)}>
                <Plus className="h-3.5 w-3.5" />Nouveau
              </Button>
            </div>
          </div>

          {/* New post form */}
          <AnimatePresence>
            {showNewPost && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Card className="border-orange-200 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Nouvelle discussion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3">
                      <select
                        value={newPostGroup}
                        onChange={e => setNewPostGroup(e.target.value)}
                        className="text-xs rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      >
                        <option value="">Choisir un groupe...</option>
                        {data.groups.filter(g => g.isJoined).map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                        {data.myGroups.length === 0 && data.groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      placeholder="Titre de la discussion"
                      value={newPostTitle}
                      onChange={e => setNewPostTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Votre message..."
                      value={newPostContent}
                      onChange={e => setNewPostContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowNewPost(false)}>Annuler</Button>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleCreatePost}>Publier</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts list */}
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <Card key={post.id} className="transition-all hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-xs dark:bg-orange-900/30 dark:text-orange-300">
                        {getInitials(post.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{post.author}</span>
                        <Badge className={cn('text-[10px] px-1.5', getRoleColor(post.authorRole))}>{post.authorRole}</Badge>
                        <Badge variant="outline" className="text-[10px]">{post.group}</Badge>
                        {post.trending && <TrendingUp className="h-3 w-3 text-orange-500" />}
                        <span className="text-[11px] text-muted-foreground ml-auto">{post.timestamp}</span>
                      </div>
                      <h4 className="text-sm font-semibold mt-1.5 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>
                        {post.title}
                      </h4>
                      <p className={cn('text-xs text-muted-foreground mt-1', expandedPost !== post.id && 'line-clamp-2')}>{post.content}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-3">
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-orange-500 transition-colors" onClick={() => toggleLike(post.id)}>
                          <Heart className={cn('h-3.5 w-3.5', post.liked && 'fill-orange-500 text-orange-500')} />
                          {post.likes}
                        </button>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-orange-500 transition-colors" onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}>
                          <Reply className="h-3.5 w-3.5" />
                          {post.replies.length} réponse{post.replies.length > 1 ? 's' : ''}
                        </button>
                      </div>

                      {/* Replies */}
                      <AnimatePresence>
                        {(expandedPost === post.id || post.replies.length > 0) && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2 pl-2 border-l-2 border-orange-200 dark:border-orange-800">
                            {post.replies.map(reply => (
                              <div key={reply.id} className="flex items-start gap-2 py-1.5">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarFallback className="bg-muted text-[10px]">{getInitials(reply.author)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold">{reply.author}</span>
                                    <Badge className={cn('text-[9px] px-1', getRoleColor(reply.authorRole))}>{reply.authorRole}</Badge>
                                    <span className="text-[10px] text-muted-foreground">{reply.timestamp}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{reply.content}</p>
                                  <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-orange-500 mt-0.5" onClick={() => toggleLikeReply(post.id, reply.id)}>
                                    <ThumbsUp className="h-3 w-3" />{reply.likes}
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Reply input */}
                            {replyingTo === post.id && (
                              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mt-2">
                                <Input
                                  placeholder="Écrire une réponse..."
                                  value={replyContent}
                                  onChange={e => setReplyContent(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleReply(post.id)}
                                  className="text-xs h-8"
                                />
                                <Button size="sm" className="h-8 px-3 bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleReply(post.id)}>
                                  <Send className="h-3 w-3" />
                                </Button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredPosts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucune discussion trouvée</p>
              <p className="text-xs mt-1">Rejoignez des groupes pour voir les discussions</p>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB 3: Réseau ═══ */}
        <TabsContent value="reseau" className="space-y-6">
          {/* Connection requests */}
          {data.connections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-orange-500" />
                Demandes envoyées ({data.connections.length})
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {data.connections.map(c => (
                  <Card key={c.id} className="shrink-0 w-48">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs dark:bg-orange-900/30 dark:text-orange-300">
                          {getInitials(c.from)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{c.from}</p>
                        <p className="text-[10px] text-muted-foreground">{c.specialty}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Search members */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchMembers}
              onChange={e => setSearchMembers(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Members grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMembers.map(member => (
              <Card key={member.id} className="transition-all hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-sm dark:bg-orange-900/30 dark:text-orange-300">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background', member.online ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{member.name}</span>
                        <Badge className={cn('text-[10px] px-1.5 shrink-0', getRoleColor(member.role))}>{member.role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{member.specialty}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {member.online ? <span className="text-emerald-500">● En ligne</span> : <span>Hors ligne</span>}
                        {' · '}{member.joinedGroups.length} groupe{member.joinedGroups.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/10 dark:text-orange-400"
                      onClick={() => sendConnection(member.id)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />Connecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun membre trouvé</p>
            </div>
          )}

          {/* Activity feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { user: 'Sophie Martin', action: 'a publié dans', target: 'E-commerce', time: 'Il y a 3h' },
                { user: 'Thomas Dupont', action: 'a rejoint', target: 'Tech Startup', time: 'Il y a 5h' },
                { user: 'Camille Roux', action: 'a aimé une discussion dans', target: 'Transition écologique', time: 'Il y a 8h' },
                { user: 'Lucas Bernard', action: 'a répondu dans', target: 'Restauration', time: 'Il y a 1j' },
                { user: 'Emma Petit', action: 'a rejoint', target: 'Artisanat', time: 'Il y a 2j' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-muted text-[10px]">{getInitials(activity.user)}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground flex-1">
                    <span className="font-semibold text-foreground">{activity.user}</span>{' '}
                    {activity.action}{' '}
                    <span className="font-medium text-orange-600 dark:text-orange-400">{activity.target}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}