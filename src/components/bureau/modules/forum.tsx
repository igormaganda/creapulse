'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  MessageSquare,
  Heart,
  Pin,
  ArrowLeft,
  Clock,
  Send,
  Reply,
  Tag,
  ChevronDown,
  ChevronUp,
  Filter,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { DemoBadge, SkeletonPulse } from '@/lib/hooks/use-api-data'
import { authFetch } from '@/lib/auth-fetch'

// ─── Types ───────────────────────────────────

type CategorySlug =
  | 'creation'
  | 'financement'
  | 'juridique'
  | 'marketing'
  | 'reseau'
  | 'emploi'
  | 'vie-entrepreneur'

interface Category {
  slug: string
  name: string
  color: string
  bgColor: string
  borderColor: string
}

interface Author {
  id: string
  name: string
  initials: string
  color: string
}

interface ReplyData {
  id: string
  author: Author
  content: string
  likesCount: number
  isLiked: boolean
  createdAt: Date
  parentId: string | null
  children: ReplyData[]
}

interface Discussion {
  id: string
  title: string
  content: string
  author: Author
  category: Category
  preview: string
  replyCount: number
  likesCount: number
  isLiked: boolean
  isPinned: boolean
  tags: string[]
  createdAt: Date
  replies: ReplyData[]
}

// ─── Categories ──────────────────────────────

const CATEGORIES: Category[] = [
  { slug: 'creation', name: 'Création', color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', borderColor: 'border-teal-200 dark:border-teal-800' },
  { slug: 'financement', name: 'Financement', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', borderColor: 'border-amber-200 dark:border-amber-800' },
  { slug: 'juridique', name: 'Juridique', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', borderColor: 'border-purple-200 dark:border-purple-800' },
  { slug: 'marketing', name: 'Marketing', color: 'text-rose-700 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-900/30', borderColor: 'border-rose-200 dark:border-rose-800' },
  { slug: 'reseau', name: 'Réseau', color: 'text-sky-700 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-900/30', borderColor: 'border-sky-200 dark:border-sky-800' },
  { slug: 'emploi', name: 'Emploi', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', borderColor: 'border-emerald-200 dark:border-emerald-800' },
  { slug: 'vie-entrepreneur', name: 'Vie d\'entrepreneur', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', borderColor: 'border-orange-200 dark:border-orange-800' },
]

const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(CATEGORIES.map(c => [c.slug, c]))

// ─── Mock Authors ────────────────────────────

const MOCK_AUTHORS: Author[] = [
  { id: 'a1', name: 'Sophie Martin', initials: 'SM', color: 'bg-teal-600' },
  { id: 'a2', name: 'Jean Dupont', initials: 'JD', color: 'bg-amber-600' },
  { id: 'a3', name: 'Amina Benali', initials: 'AB', color: 'bg-rose-600' },
  { id: 'a4', name: 'Lucas Petit', initials: 'LP', color: 'bg-purple-600' },
  { id: 'a5', name: 'Marie Leroy', initials: 'ML', color: 'bg-sky-600' },
  { id: 'a6', name: 'Thomas Bernard', initials: 'TB', color: 'bg-emerald-600' },
  { id: 'a7', name: 'Fatima Diallo', initials: 'FD', color: 'bg-orange-600' },
  { id: 'a8', name: 'Pierre Moreau', initials: 'PM', color: 'bg-indigo-600' },
]

// ─── Mock Discussions ────────────────────────

const NOW = new Date()
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600000)
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000)

const MOCK_DISCUSSIONS: Discussion[] = [
  {
    id: 'd1',
    title: 'Comment choisir entre SAS et SARL pour une startup tech ?',
    content: `Bonjour à tous !\n\nJe suis en train de créer une startup dans la tech et j'hésite entre le statut SAS et SARL. J'ai lu beaucoup d'articles mais je reste indécis.\n\n**SAS :**\n- Plus flexible pour la répartition des dividendes\n- Peut attirer des investisseurs plus facilement\n- Charges sociales plus élevées pour le dirigeant\n\n**SARL :**\n- Charges sociales moins importantes\n- Plus simple à gérer au début\n- Moins flexible pour les futurs associés\n\nMon projet prévoit de lever des fonds dans 2-3 ans. Quel serait le meilleur choix selon vous ?\n\nMerci d'avance pour vos retours !`,
    author: MOCK_AUTHORS[0],
    category: CATEGORY_MAP['juridique'],
    preview: 'Bonjour à tous ! Je suis en train de créer une startup dans la tech et j\'hésite entre le statut SAS et SARL...',
    replyCount: 7,
    likesCount: 24,
    isLiked: false,
    isPinned: true,
    tags: ['statut juridique', 'SAS', 'SARL', 'startup'],
    createdAt: daysAgo(1),
    replies: [
      {
        id: 'r1', author: MOCK_AUTHORS[3], content: 'Pour une startup avec ambition de levée de fonds, la SAS est clairement le choix recommandé. La souplesse statutaire et la possibilité d\'émettre des actions de préférence sont des atouts majeurs.', likesCount: 12, isLiked: false, createdAt: hoursAgo(22), parentId: null, children: [
          { id: 'r1-1', author: MOCK_AUTHORS[0], content: 'Merci pour ce conseil ! Et au niveau des coûts de création, c\'est vraiment plus cher ?', likesCount: 3, isLiked: false, createdAt: hoursAgo(20), parentId: 'r1', children: [] },
          { id: 'r1-2', author: MOCK_AUTHORS[3], content: 'Les frais de création sont similaires (~200-300€). C\'est surtout les charges sociales du dirigeant qui sont plus élevées en SAS (~80% vs ~45% en SARL).', likesCount: 8, isLiked: false, createdAt: hoursAgo(18), parentId: 'r1', children: [] },
        ],
      },
      {
        id: 'r2', author: MOCK_AUTHORS[5], content: 'Je confirme, SAS pour la tech. N\'hésitez pas à consulter un avocat spécialisé pour les statuts, ça vaut l\'investissement.', likesCount: 6, isLiked: false, createdAt: hoursAgo(15), parentId: null, children: [],
      },
      {
        id: 'r3', author: MOCK_AUTHORS[6], content: 'Attention aussi à l\'option SASU si vous êtes seul au début. Vous pourrez toujours la transformer en SAS plus tard.', likesCount: 9, isLiked: true, createdAt: hoursAgo(10), parentId: null, children: [
          { id: 'r3-1', author: MOCK_AUTHORS[1], content: 'Bonne remarque ! La transformation de SASU en SAS est en effet très simple.', likesCount: 2, isLiked: false, createdAt: hoursAgo(8), parentId: 'r3', children: [] },
        ],
      },
    ],
  },
  {
    id: 'd2',
    title: 'Obtenir un prêt d\'honneur : mon expérience avec BPI France',
    content: `Je voulais partager mon expérience positive avec le prêt d'honneur BPI France.\n\nJ'ai créé ma SARL il y a 6 mois dans le secteur de la restauration. J'ai postulé au prêt d'honneur "Création d'entreprise" et j'ai obtenu 30 000€.\n\n**Le processus :**\n1. Préparation du business plan (2 semaines)\n2. Rencontre avec un conseiller BPI (1h)\n3. Passage devant le comité d'engagement (30 min)\n4. Réponse favorable sous 15 jours\n\n**Mes conseils :**\n- Ayez un BP solide avec des prévisions réalistes\n- Montrez que vous avez déjà injecté de l'apport personnel\n- Préparez bien votre pitch oral\n\nN'hésitez pas si vous avez des questions !`,
    author: MOCK_AUTHORS[1],
    category: CATEGORY_MAP['financement'],
    preview: 'Je voulais partager mon expérience positive avec le prêt d\'honneur BPI France. J\'ai créé ma SARL il y a 6 mois...',
    replyCount: 12,
    likesCount: 45,
    isLiked: true,
    isPinned: true,
    tags: ['BPI France', 'prêt d\'honneur', 'financement'],
    createdAt: daysAgo(3),
    replies: [
      {
        id: 'r4', author: MOCK_AUTHORS[4], content: 'Super retour ! Combien d\'apport personnel aviez-vous investi pour obtenir ce prêt ?', likesCount: 5, isLiked: false, createdAt: daysAgo(2), parentId: null, children: [
          { id: 'r4-1', author: MOCK_AUTHORS[1], content: 'J\'avais apporté 15 000€ de mes économies, soit 1/3 du besoin total de 45 000€.', likesCount: 7, isLiked: true, createdAt: daysAgo(2), parentId: 'r4', children: [] },
        ],
      },
      { id: 'r5', author: MOCK_AUTHORS[2], content: 'Merci pour ce partage ! Est-ce que le prêt d\'honneur est cumulable avec d\'autres aides ?', likesCount: 3, isLiked: false, createdAt: hoursAgo(40), parentId: null, children: [] },
    ],
  },
  {
    id: 'd3',
    title: 'Stratégie de marketing digital pour un e-commerce de produits artisanaux',
    content: `Bonjour,\n\nJe lance un e-commerce de produits artisanaux (bougies, savons, céramiques) et je cherche des conseils en marketing digital avec un petit budget.\n\nJ'ai déjà :\n- Créé mon site Shopify\n- Ouvert un compte Instagram (320 abonnés)\n- Commencé le SEO de base\n\nMon budget mensuel est d'environ 300€. Par où commencer selon vous ? Ads Facebook ? TikTok ? Influencer marketing ?\n\nMerci pour vos retours !`,
    author: MOCK_AUTHORS[2],
    category: CATEGORY_MAP['marketing'],
    preview: 'Je lance un e-commerce de produits artisanaux et je cherche des conseils en marketing digital avec un petit budget...',
    replyCount: 5,
    likesCount: 18,
    isLiked: false,
    isPinned: false,
    tags: ['e-commerce', 'marketing digital', 'Instagram', 'budget'],
    createdAt: daysAgo(2),
    replies: [
      { id: 'r6', author: MOCK_AUTHORS[7], content: 'Pour des produits artisanaux visuels, concentrez-vous sur Instagram et TikTok. Avec 300€/mois, privilégiez la création de contenu organique et les partenariats avec des micro-influenceurs (échange de produits).', likesCount: 15, isLiked: false, createdAt: daysAgo(1), parentId: null, children: [] },
      { id: 'r7', author: MOCK_AUTHORS[4], content: 'Les vidéos courtes sur TikTok et Reels Instagram sont très performants pour ce type de produits. Filmez le processus de fabrication, c\'est ce qui intéresse les clients !', likesCount: 8, isLiked: false, createdAt: hoursAgo(30), parentId: null, children: [] },
    ],
  },
  {
    id: 'd4',
    title: 'Réseautage efficace : comment trouver des partenaires de confiance ?',
    content: `Je cherche à développer mon réseau professionnel dans le secteur de la transition écologique. J'assiste à des événements mais j'ai du mal à créer des relations durables.\n\nQuelles sont vos stratégies de réseautage efficace ? Comment transformez-vous une rencontre en véritable partenariat ?`,
    author: MOCK_AUTHORS[4],
    category: CATEGORY_MAP['reseau'],
    preview: 'Je cherche à développer mon réseau professionnel dans le secteur de la transition écologique...',
    replyCount: 4,
    likesCount: 11,
    isLiked: false,
    isPinned: false,
    tags: ['réseautage', 'partenariats', 'événements'],
    createdAt: hoursAgo(18),
    replies: [
      { id: 'r8', author: MOCK_AUTHORS[0], content: 'Mon astuce : toujours faire un suivi dans les 48h après un événement. Un simple email personnalisé avec référence à votre conversation fait toute la différence.', likesCount: 9, isLiked: true, createdAt: hoursAgo(12), parentId: null, children: [] },
    ],
  },
  {
    id: 'd5',
    title: 'Le marché de la livraison à domicile en 2025 : opportunités ou saturation ?',
    content: `Après avoir travaillé 5 ans dans la logistique, je réfléchis à lancer mon propre service de livraison locale.\n\nLe marché semble saturé par les grands acteurs, mais je pense qu'il y a une place pour un service premium et hyper-local.\n\nQuelqu'un a-t-il une analyse du marché actuel ? Quels sont les segments les plus prometteurs ?`,
    author: MOCK_AUTHORS[3],
    category: CATEGORY_MAP['creation'],
    preview: 'Après avoir travaillé 5 ans dans la logistique, je réfléchis à lancer mon propre service de livraison locale...',
    replyCount: 3,
    likesCount: 7,
    isLiked: false,
    isPinned: false,
    tags: ['livraison', 'marché', 'logistique', 'opportunité'],
    createdAt: daysAgo(4),
    replies: [],
  },
  {
    id: 'd6',
    title: 'Recruter son premier salarié : démarches et pièges à éviter',
    content: `Mon auto-entreprise décolle et j'envisage d'embaucher mon premier salarié. Je suis un peu perdu face aux démarches administratives.\n\nQuestions :\n- CDI ou CDD pour commencer ?\n- Quelles aides à l'embauche existent ?\n- Comment gérer la paie ? (logiciel ? expert-comptable ?)\n- Quelles sont les erreurs courantes à éviter ?\n\nMerci d'avance pour vos conseils !`,
    author: MOCK_AUTHORS[5],
    category: CATEGORY_MAP['emploi'],
    preview: 'Mon auto-entreprise décolle et j\'envisage d\'embaucher mon premier salarié. Je suis un peu perdu...',
    replyCount: 6,
    likesCount: 20,
    isLiked: false,
    isPinned: false,
    tags: ['recrutement', 'premier salarié', 'démarches'],
    createdAt: daysAgo(5),
    replies: [
      { id: 'r9', author: MOCK_AUTHORS[6], content: 'Pour le premier salarié, un CDD de 6 mois est une bonne option pour tester. Pensez à l\'aide TPE pour l\'embauche (4000€). Pour la paie, un logiciel comme PayFit ou un expert-comptable sont des options fiables.', likesCount: 14, isLiked: false, createdAt: daysAgo(4), parentId: null, children: [] },
    ],
  },
  {
    id: 'd7',
    title: 'Gérer le stress et l\'isolement quand on est entrepreneur solo',
    content: `Ça fait 8 mois que j'ai lancé mon activité de consulting et je dois avouer que l'isolement commence à peser.\n\nCertains jours, je ne parle à personne de la journée. Le doute s'installe et la motivation fluctue.\n\nComment gérez-vous le côté psychologique de l'entrepreneuriat ? Avez-vous des routines pour rester motivé(e) ?\n\nJe sais que je ne suis pas seul(e) à vivre ça, partagez vos expériences !`,
    author: MOCK_AUTHORS[6],
    category: CATEGORY_MAP['vie-entrepreneur'],
    preview: 'Ça fait 8 mois que j\'ai lancé mon activité de consulting et l\'isolement commence à peser...',
    replyCount: 15,
    likesCount: 52,
    isLiked: true,
    isPinned: false,
    tags: ['bien-être', 'isolement', 'motivation', 'santé mentale'],
    createdAt: daysAgo(6),
    replies: [
      { id: 'r10', author: MOCK_AUTHORS[0], content: 'Merci d\'en parler ! Les espaces de coworking ont sauvé ma santé mentale. Le simple fait d\'être entouré de gens qui travaillent change tout. Et n\'hésitez pas à consulter un coach si besoin.', likesCount: 22, isLiked: true, createdAt: daysAgo(5), parentId: null, children: [] },
      { id: 'r11', author: MOCK_AUTHORS[2], content: 'Les groupes d\'entrepreneurs locaux sont aussi très efficaces. On se rend compte qu\'on est pas seul à traverser ces moments difficiles.', likesCount: 10, isLiked: false, createdAt: daysAgo(4), parentId: null, children: [] },
    ],
  },
  {
    id: 'd8',
    title: 'Nouvelle-aquitaine : aides spécifiques pour les créateurs d\'entreprise',
    content: `Je me lance dans la création d'une entreprise de services en Nouvelle-Aquitaine. Je cherche à recenser toutes les aides disponibles au niveau régional.\n\nPour l'instant j'ai identifié :\n- Aide à la création (Région)\n- ARCE si je prends mes indemnités\n- ACCRE pour les cotisations\n\nEst-ce que je manque quelque chose ? Y a-t-il des dispositifs spécifiques à la région ?`,
    author: MOCK_AUTHORS[7],
    category: CATEGORY_MAP['financement'],
    preview: 'Je me lance dans la création d\'une entreprise de services en Nouvelle-Aquitaine. Je cherche à recenser...',
    replyCount: 2,
    likesCount: 5,
    isLiked: false,
    isPinned: false,
    tags: ['aides', 'Nouvelle-Aquitaine', 'région', 'subventions'],
    createdAt: daysAgo(7),
    replies: [],
  },
  {
    id: 'd9',
    title: 'Comment protéger sa marque : dépôt INPI ou via un avocat ?',
    content: `Mon logo et mon nom de marque sont prêts. Je dois maintenant les protéger. Faut-il passer par l'INPI directement ou vaut mieux prendre un avocat en PI ?\n\nL'INPI me semble moins cher mais je crains de mal faire les choses. Quelqu'un a comparé les deux options ?`,
    author: MOCK_AUTHORS[3],
    category: CATEGORY_MAP['juridique'],
    preview: 'Mon logo et mon nom de marque sont prêts. Je dois maintenant les protéger...',
    replyCount: 4,
    likesCount: 13,
    isLiked: false,
    isPinned: false,
    tags: ['marque', 'INPI', 'propriété intellectuelle', 'protection'],
    createdAt: hoursAgo(8),
    replies: [
      { id: 'r12', author: MOCK_AUTHORS[5], content: 'Le dépôt INPI en ligne est tout à fait faisable seul si votre marque est simple. Comptez ~250€. Par contre, si vous avez des doutes sur la disponibilité ou la classification, un avocat PI (~500-1500€) peut vous éviter des problèmes coûteux.', likesCount: 11, isLiked: false, createdAt: hoursAgo(5), parentId: null, children: [] },
    ],
  },
  {
    id: 'd10',
    title: 'De la idée au MVP : plan d\'action pour un SaaS B2B',
    content: `J'ai une idée de SaaS pour les TPE/PME qui automatiserait leur gestion administrative. Je suis développeur de métier mais je n'ai jamais lancé de produit.\n\nJ'aimerais établir un plan d'action clair :\n1. Validation de l'idée (comment ?)\n2. Construction du MVP\n3. Premiers tests clients\n4. Go/No Go\n\nDes retours d'expérience sur ce type de projet ?`,
    author: MOCK_AUTHORS[1],
    category: CATEGORY_MAP['creation'],
    preview: 'J\'ai une idée de SaaS pour les TPE/PME qui automatiserait leur gestion administrative...',
    replyCount: 8,
    likesCount: 31,
    isLiked: false,
    isPinned: false,
    tags: ['SaaS', 'MVP', 'B2B', 'validation'],
    createdAt: daysAgo(2),
    replies: [
      { id: 'r13', author: MOCK_AUTHORS[7], content: 'Étape cruciale : avant de coder, vendez votre produit à 5-10 clients potentiels (landing page + préventes). Si personne n\'achète une promesse, personne n\'achètera le produit fini.', likesCount: 18, isLiked: true, createdAt: daysAgo(1), parentId: null, children: [
          { id: 'r13-1', author: MOCK_AUTHORS[1], content: 'Excellent conseil ! Tu recommandes quel outil pour la landing page de validation ?', likesCount: 4, isLiked: false, createdAt: hoursAgo(20), parentId: 'r13', children: [] },
          { id: 'r13-2', author: MOCK_AUTHORS[7], content: 'Carrd (gratuit et rapide), No-code avec Framer ou Webflow si tu veux plus de contrôle.', likesCount: 6, isLiked: false, createdAt: hoursAgo(16), parentId: 'r13', children: [] },
        ],
      },
    ],
  },
]

// ─── Reduced Fallback (5 items max) ─────────

const FALLBACK_DISCUSSIONS: Discussion[] = MOCK_DISCUSSIONS.slice(0, 5)

// ─── API data mapping helpers ───────────────

const AVATAR_COLORS_LIST = ['bg-teal-600', 'bg-amber-600', 'bg-rose-600', 'bg-purple-600', 'bg-sky-600', 'bg-emerald-600', 'bg-orange-600', 'bg-indigo-600']

function getAuthorColor(id: string): string {
  return AVATAR_COLORS_LIST[Math.abs(id.charCodeAt(0)) % AVATAR_COLORS_LIST.length]
}

function mapApiDiscussion(apiDisc: Record<string, unknown>): Discussion {
  const author = apiDisc.author as Record<string, unknown> | undefined
  const category = apiDisc.category as Record<string, unknown> | undefined
  const categorySlug = (category?.slug as string) || 'creation'
  const frontendCategory = CATEGORY_MAP[categorySlug] || CATEGORY_MAP['creation']
  return {
    id: apiDisc.id as string,
    title: (apiDisc.title as string) || '',
    content: (apiDisc.content as string) || '',
    author: {
      id: (author?.id as string) || '',
      name: (author?.name as string) || 'Anonyme',
      initials: (author?.initials as string) || '?',
      color: getAuthorColor((author?.id as string) || ''),
    },
    category: frontendCategory,
    preview: (apiDisc.preview as string) || ((apiDisc.content as string) || '').substring(0, 150),
    replyCount: (apiDisc.replyCount as number) || 0,
    likesCount: (apiDisc.likesCount as number) || 0,
    isLiked: (apiDisc.isLiked as boolean) || false,
    isPinned: (apiDisc.isPinned as boolean) || false,
    tags: (apiDisc.tags as string[]) || [],
    createdAt: apiDisc.createdAt ? new Date(apiDisc.createdAt as string) : new Date(),
    replies: [],
  }
}

function mapApiReply(apiReply: Record<string, unknown>): ReplyData {
  const author = apiReply.author as Record<string, unknown> | undefined
  return {
    id: apiReply.id as string,
    author: {
      id: (author?.id as string) || '',
      name: (author?.name as string) || 'Anonyme',
      initials: (author?.initials as string) || '?',
      color: getAuthorColor((author?.id as string) || ''),
    },
    content: (apiReply.content as string) || '',
    likesCount: (apiReply.likesCount as number) || 0,
    isLiked: (apiReply.isLiked as boolean) || false,
    createdAt: apiReply.createdAt ? new Date(apiReply.createdAt as string) : new Date(),
    parentId: (apiReply.parentId as string) || null,
    children: ((apiReply.children as Record<string, unknown>[]) || []).map(mapApiReply),
  }
}

// ─── Helper functions ────────────────────────

function timeSince(date: Date): string {
  const seconds = Math.floor((NOW.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'il y a quelques secondes'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`
  if (days < 365) return `il y a ${Math.floor(days / 30)}mo`
  return `il y a ${Math.floor(days / 365)}an`
}

function getCategoryFromSlug(slug: string): Category | undefined {
  return CATEGORY_MAP[slug]
}

// ─── Category Badge Component ────────────────

function CategoryBadge({ category }: { category: Category }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium px-2 py-0.5 border',
        category.color,
        category.bgColor,
        category.borderColor,
      )}
    >
      {category.name}
    </Badge>
  )
}

// ─── Avatar Component ────────────────────────

function AuthorAvatar({ author, size = 'sm' }: { author: Author; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }
  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback className={cn('text-white font-medium', author.color)}>
        {author.initials}
      </AvatarFallback>
    </Avatar>
  )
}

// ─── Reply Component ─────────────────────────

function ReplyItem({
  reply,
  onLike,
  onReply,
  depth = 0,
}: {
  reply: ReplyData
  onLike: (id: string) => void
  onReply: (id: string, authorName: string) => void
  depth?: number
}) {
  const [showChildren, setShowChildren] = useState(true)

  return (
    <div className={cn(depth > 0 && 'ml-6 pl-4 border-l-2 border-border/60')}>
      <div className="flex gap-3 py-3">
        <AuthorAvatar author={reply.author} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{reply.author.name}</span>
            <span className="text-xs text-muted-foreground">{timeSince(reply.createdAt)}</span>
            {reply.isEdited && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">modifié</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground/90 whitespace-pre-line">{reply.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onLike(reply.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
            >
              <Heart className={cn('h-3.5 w-3.5', reply.isLiked && 'fill-rose-500 text-rose-500')} />
              <span>{reply.likesCount > 0 ? reply.likesCount : ''}</span>
            </button>
            <button
              onClick={() => onReply(reply.id, reply.author.name)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              <span>Répondre</span>
            </button>
          </div>
          {/* Nested replies */}
          {reply.children.length > 0 && (
            <button
              onClick={() => setShowChildren(!showChildren)}
              className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showChildren ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span>{reply.children.length} réponse{reply.children.length > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {reply.children.map(child => (
              <ReplyItem
                key={child.id}
                reply={child}
                onLike={onLike}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Discussion List Card ────────────────────

function DiscussionCard({
  discussion,
  onClick,
}: {
  discussion: Discussion
  onClick: () => void
}) {
  return (
    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
      <Card
        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 group"
        onClick={onClick}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <AuthorAvatar author={discussion.author} />
            <div className="flex-1 min-w-0">
              {/* Top row: badges */}
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <CategoryBadge category={discussion.category} />
                {discussion.isPinned && (
                  <Badge variant="secondary" className="text-xs gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                    <Pin className="h-3 w-3" />
                    Épinglé
                  </Badge>
                )}
              </div>
              {/* Title */}
              <h3 className="text-sm md:text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {discussion.title}
              </h3>
              {/* Preview */}
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {discussion.preview}
              </p>
              {/* Bottom row: meta */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="text-xs text-muted-foreground">{discussion.author.name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeSince(discussion.createdAt)}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {discussion.replyCount}
                </span>
                <span className={cn(
                  'text-xs flex items-center gap-1',
                  discussion.isLiked ? 'text-rose-500' : 'text-muted-foreground'
                )}>
                  <Heart className={cn('h-3 w-3', discussion.isLiked && 'fill-rose-500')} />
                  {discussion.likesCount}
                </span>
              </div>
              {/* Tags */}
              {discussion.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {discussion.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                  {discussion.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{discussion.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Discussion Detail View ──────────────────

function DiscussionDetail({
  discussion,
  onBack,
  onLikeDiscussion,
  onLikeReply,
  onAddReply,
}: {
  discussion: Discussion
  onBack: () => void
  onLikeDiscussion: () => void
  onLikeReply: (replyId: string) => void
  onAddReply: (content: string, parentId: string | null) => void
}) {
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReply = useCallback(async () => {
    if (!replyText.trim()) return
    setIsSubmitting(true)
    let apiSuccess = false
    try {
      const res = await authFetch(`/api/forum/${discussion.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText, parentId: replyingTo?.id || null }),
      })
      if (res.ok) apiSuccess = true
    } catch {
      // Fallback to local-only
    }
    onAddReply(replyText, replyingTo?.id || null)
    setReplyText('')
    setReplyingTo(null)
    setIsSubmitting(false)
    toast.success(apiSuccess ? 'Réponse publiée avec succès' : 'Réponse ajoutée localement')
  }, [replyText, replyingTo, onAddReply, discussion.id])

  const handleReplyTo = useCallback((replyId: string, authorName: string) => {
    setReplyingTo({ id: replyId, name: authorName })
    setReplyText(`@${authorName} `)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Retour aux discussions
      </Button>

      {/* Main post */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AuthorAvatar author={discussion.author} size="lg" />
              <div>
                <p className="font-semibold text-foreground">{discussion.author.name}</p>
                <p className="text-xs text-muted-foreground">{timeSince(discussion.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CategoryBadge category={discussion.category} />
              {discussion.isPinned && (
                <Badge variant="secondary" className="text-xs gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                  <Pin className="h-3 w-3" />
                  Épinglé
                </Badge>
              )}
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mt-3 leading-tight">
            {discussion.title}
          </h2>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
            {discussion.content}
          </div>
          {/* Tags */}
          {discussion.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4 flex-wrap">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {discussion.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <Separator className="my-4" />
          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={onLikeDiscussion}
              className="flex items-center gap-2 text-sm transition-colors hover:text-rose-500"
            >
              <Heart className={cn('h-5 w-5', discussion.isLiked && 'fill-rose-500 text-rose-500')} />
              <span className={discussion.isLiked ? 'text-rose-500' : 'text-muted-foreground'}>
                {discussion.likesCount}
              </span>
            </button>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
              {discussion.replyCount} réponse{discussion.replyCount !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-base font-semibold text-foreground">
            Réponses ({discussion.replies.length})
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          {discussion.replies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune réponse pour le moment.</p>
              <p className="text-sm">Soyez le premier à répondre !</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div>
                {discussion.replies.map(reply => (
                  <ReplyItem
                    key={reply.id}
                    reply={reply}
                    onLike={onLikeReply}
                    onReply={handleReplyTo}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Reply input */}
      <Card>
        <CardContent className="p-4">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-muted rounded-lg">
              <Reply className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                En réponse à <span className="font-medium text-foreground">{replyingTo.name}</span>
              </span>
              <button
                onClick={() => { setReplyingTo(null); setReplyText('') }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrivez votre réponse..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleReply()
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              ⌘+Entrée pour envoyer
            </span>
            <Button
              size="sm"
              onClick={handleReply}
              disabled={!replyText.trim() || isSubmitting}
              className="gap-1.5"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── New Discussion Dialog ───────────────────

function NewDiscussionDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; categoryId: string; content: string; tags: string[] }) => void
}) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Le titre est requis'
    else if (title.trim().length < 10) newErrors.title = 'Le titre doit contenir au moins 10 caractères'
    if (!categoryId) newErrors.category = 'Veuillez sélectionner une catégorie'
    if (!content.trim()) newErrors.content = 'Le contenu est requis'
    else if (content.trim().length < 20) newErrors.content = 'Le contenu doit contenir au moins 20 caractères'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0)
    let apiSuccess = false
    try {
      const res = await authFetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), categoryId, content: content.trim(), tags }),
      })
      if (res.ok) apiSuccess = true
    } catch {
      // Fallback to local-only
    }
    onSubmit({ title: title.trim(), categoryId, content: content.trim(), tags })
    setTitle('')
    setCategoryId('')
    setContent('')
    setTagsInput('')
    setErrors({})
    setIsSubmitting(false)
    onOpenChange(false)
    toast.success(apiSuccess ? 'Discussion créée avec succès !' : 'Discussion créée en mode hors ligne')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Nouvelle discussion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Titre *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Comment choisir son statut juridique ?"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Catégorie *</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>
          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Contenu *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Décrivez votre question ou partagez votre expérience... (Markdown supporté)"
              className="min-h-[150px] resize-y"
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
            <p className="text-xs text-muted-foreground">Markdown supporté : **gras**, *italique*, #titres, -listes</p>
          </div>
          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tags</label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: financement, BPI France, startup (séparés par des virgules)"
            />
            <p className="text-xs text-muted-foreground">Séparez les tags par des virgules</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Publication...' : 'Publier la discussion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Forum Stats Banner ─────────────────────

function ForumStats({ discussions }: { discussions: Discussion[] }) {
  const totalReplies = discussions.reduce((sum, d) => sum + d.replyCount, 0)
  const totalLikes = discussions.reduce((sum, d) => sum + d.likesCount, 0)

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <MessageSquare className="h-4 w-4 text-primary" />
        <div>
          <p className="text-lg font-bold text-primary">{discussions.length}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground">Discussions</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <Users className="h-4 w-4 text-amber-600" />
        <div>
          <p className="text-lg font-bold text-amber-600">{totalReplies}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground">Réponses</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
        <Heart className="h-4 w-4 text-rose-500" />
        <div>
          <p className="text-lg font-bold text-rose-500">{totalLikes}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground">J'aime</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Forum Module ──────────────────────

export function ForumModule() {
  const [discussions, setDiscussions] = useState<Discussion[]>(FALLBACK_DISCUSSIONS)
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'comments'>('recent')
  const [loading, setLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)
  const [isFetchingDetail, setIsFetchingDetail] = useState(false)

  // Fetch discussions from API on mount
  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const params = new URLSearchParams({ sort: 'recent', limit: '20' })
        const res = await authFetch(`/api/forum?${params.toString()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (json.success && json.data?.discussions?.length > 0) {
          const apiDiscussions = (json.data.discussions as Record<string, unknown>[]).map(mapApiDiscussion)
          setDiscussions(apiDiscussions)
          setIsFallback(false)
        } else {
          setDiscussions(FALLBACK_DISCUSSIONS)
          setIsFallback(true)
        }
      } catch {
        setDiscussions(FALLBACK_DISCUSSIONS)
        setIsFallback(true)
      } finally {
        setLoading(false)
      }
    }
    fetchDiscussions()
  }, [])

  // Fetch discussion detail with replies when selecting
  const fetchDiscussionDetail = useCallback(async (discussion: Discussion) => {
    setSelectedDiscussion(discussion)
    // For mock data, replies are already included
    if (discussion.replies.length > 0) return
    // For API data, fetch full detail
    setIsFetchingDetail(true)
    try {
      const res = await authFetch(`/api/forum/${discussion.id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          const apiDisc = json.data as Record<string, unknown>
          const detail = mapApiDiscussion(apiDisc)
          detail.replies = ((apiDisc.replies as Record<string, unknown>[]) || []).map(mapApiReply)
          detail.replyCount = detail.replies.length
          setSelectedDiscussion(detail)
          // Also update the discussion in the list
          setDiscussions(prev => prev.map(d => d.id === detail.id ? { ...d, replies: detail.replies, replyCount: detail.replyCount } : d))
        }
      }
    } catch {
      // Keep list version without replies
    } finally {
      setIsFetchingDetail(false)
    }
  }, [])

  // Filtered and sorted discussions
  const filteredDiscussions = useMemo(() => {
    let result = [...discussions]

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(d => d.category.slug === activeCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(d =>
        d.title.toLowerCase().includes(query) ||
        d.preview.toLowerCase().includes(query) ||
        d.tags.some(t => t.toLowerCase().includes(query)) ||
        d.author.name.toLowerCase().includes(query)
      )
    }

    // Sort: pinned first, then by sort criteria
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      switch (sortBy) {
        case 'popular':
          return b.likesCount - a.likesCount
        case 'comments':
          return b.replyCount - a.replyCount
        case 'recent':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })

    return result
  }, [discussions, activeCategory, searchQuery, sortBy])

  // Like a discussion
  const handleLikeDiscussion = useCallback((discussionId: string) => {
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d
      const wasLiked = d.isLiked
      return {
        ...d,
        isLiked: !wasLiked,
        likesCount: wasLiked ? d.likesCount - 1 : d.likesCount + 1,
      }
    }))
    if (selectedDiscussion?.id === discussionId) {
      setSelectedDiscussion(prev => {
        if (!prev) return null
        const wasLiked = prev.isLiked
        return {
          ...prev,
          isLiked: !wasLiked,
          likesCount: wasLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        }
      })
    }
  }, [selectedDiscussion])

  // Like a reply
  const handleLikeReply = useCallback((replyId: string) => {
    const toggleReplyLikes = (replies: ReplyData[]): ReplyData[] =>
      replies.map(r => {
        if (r.id === replyId) {
          return { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1 }
        }
        if (r.children.length > 0) {
          return { ...r, children: toggleReplyLikes(r.children) }
        }
        return r
      })

    setDiscussions(prev => prev.map(d => ({
      ...d,
      replies: toggleReplyLikes(d.replies),
    })))

    if (selectedDiscussion) {
      setSelectedDiscussion(prev => {
        if (!prev) return null
        return { ...prev, replies: toggleReplyLikes(prev.replies) }
      })
    }
  }, [selectedDiscussion])

  // Add a new reply
  const handleAddReply = useCallback((content: string, parentId: string | null) => {
    const newReply: ReplyData = {
      id: `r-new-${Date.now()}`,
      author: MOCK_AUTHORS[Math.floor(Math.random() * MOCK_AUTHORS.length)],
      content,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date(),
      parentId,
      children: [],
    }

    const addReplyToList = (replies: ReplyData[]): ReplyData[] => {
      if (!parentId) return [...replies, newReply]
      return replies.map(r => {
        if (r.id === parentId) {
          return { ...r, children: [...r.children, newReply] }
        }
        if (r.children.length > 0) {
          return { ...r, children: addReplyToList(r.children) }
        }
        return r
      })
    }

    setDiscussions(prev => prev.map(d => {
      if (d.id !== selectedDiscussion?.id) return d
      return { ...d, replies: addReplyToList(d.replies), replyCount: d.replyCount + 1 }
    }))

    setSelectedDiscussion(prev => {
      if (!prev) return null
      return { ...prev, replies: addReplyToList(prev.replies), replyCount: prev.replyCount + 1 }
    })
  }, [selectedDiscussion])

  // Create a new discussion
  const handleCreateDiscussion = useCallback((data: {
    title: string
    categoryId: string
    content: string
    tags: string[]
  }) => {
    const newDiscussion: Discussion = {
      id: `d-new-${Date.now()}`,
      title: data.title,
      content: data.content,
      author: MOCK_AUTHORS[Math.floor(Math.random() * MOCK_AUTHORS.length)],
      category: CATEGORY_MAP[data.categoryId] || CATEGORY_MAP['creation'],
      preview: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
      replyCount: 0,
      likesCount: 0,
      isLiked: false,
      isPinned: false,
      tags: data.tags,
      createdAt: new Date(),
      replies: [],
    }
    setDiscussions(prev => [newDiscussion, ...prev])
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <SkeletonPulse className="h-10 w-64 rounded-lg" />
        <SkeletonPulse className="h-24 rounded-xl" />
        <SkeletonPulse className="h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <AnimatePresence mode="wait">
        {!selectedDiscussion ? (
          /* ─── Discussion List View ─── */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Forum</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Échangez avec la communauté des entrepreneurs
                  </p>
                </div>
                {isFallback && <DemoBadge />}
              </div>
              <Dialog open={newDiscussionOpen} onOpenChange={setNewDiscussionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 shrink-0">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouvelle discussion</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                </DialogTrigger>
                <NewDiscussionDialog
                  open={newDiscussionOpen}
                  onOpenChange={setNewDiscussionOpen}
                  onSubmit={handleCreateDiscussion}
                />
              </Dialog>
            </div>

            {/* Stats */}
            <ForumStats discussions={discussions} />

            {/* Search & Sort */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une discussion, un tag, un auteur..."
                  className="pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Récent
                    </span>
                  </SelectItem>
                  <SelectItem value="popular">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> Populaire
                    </span>
                  </SelectItem>
                  <SelectItem value="comments">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" /> Commentés
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category filters */}
            <ScrollArea className="w-full">
              <div className="flex items-center gap-2 pb-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0',
                    activeCategory === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <Filter className="h-3 w-3" />
                  Tous
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 border',
                      activeCategory === cat.slug
                        ? cn(cat.color, cat.bgColor, cat.borderColor, 'border')
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Discussion list */}
            {filteredDiscussions.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">Aucune discussion trouvée</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Essayez un autre terme de recherche ou catégorie
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDiscussions.map((discussion, i) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.15) }}
                  >
                    <DiscussionCard
                      discussion={discussion}
                      onClick={() => {
                        handleLikeDiscussion(discussion.id)
                        fetchDiscussionDetail(discussion)
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* ─── Discussion Detail View ─── */
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DiscussionDetail
              discussion={selectedDiscussion}
              onBack={() => setSelectedDiscussion(null)}
              onLikeDiscussion={() => handleLikeDiscussion(selectedDiscussion.id)}
              onLikeReply={handleLikeReply}
              onAddReply={handleAddReply}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
