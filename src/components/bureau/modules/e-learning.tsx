'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'
import {
  BookOpen, Clock, Star, Trophy, Search, Filter, Sparkles,
  Loader2, CheckCircle2, Lock, Play, Award, Zap, ChevronRight,
  Target, GraduationCap, Flame, Rocket, ArrowRight, X,
} from 'lucide-react'

// ─── Types ──────────────────────────────────

type Difficulty = 'debutant' | 'intermediaire' | 'avance'
type Category = 'strategie' | 'finance' | 'marketing' | 'juridique' | 'gestion' | 'network'

interface Lesson {
  id: string
  title: string
  content: string
  duration: string
  completed: boolean
}

interface Formation {
  id: string
  code: string
  title: string
  description: string
  duration: string
  difficulty: Difficulty
  category: Category
  icon: string
  lessons: Lesson[]
  started: boolean
  completedAt: string | null
}

interface BadgeItem {
  id: string
  name: string
  emoji: string
  description: string
  howToUnlock: string
  unlocked: boolean
  unlockedAt: string | null
}

interface ELearningData {
  formations: Record<string, { lessonsCompleted: string[]; started: boolean; completedAt: string | null }>
  badges: Record<string, { unlocked: boolean; unlockedAt: string | null }>
  xp: number
  streak: number
  lastStudyDate: string | null
}

// ─── Formation Catalog ──────────────────────

const FORMATIONS_CATALOG: Formation[] = [
  {
    id: 'business-model', code: 'BM', title: 'Mettre en place son business model', description: 'Apprenez à structurer votre modèle économique avec la méthode BMC.',
    duration: '45 min', difficulty: 'debutant', category: 'strategie', icon: '🏗️',
    lessons: [
      { id: 'bm-1', title: 'Qu\'est-ce qu\'un business model ?', content: 'Un business model décrit comment votre entreprise crée, délivre et capture de la valeur. Il répond à la question : comment votre projet va-t-il gagner de l\'argent ?\n\nLes 9 blocs du Business Model Canvas couvrent : les segments de clientèle, la proposition de valeur, les canaux de distribution, les relations clients, les sources de revenus, les ressources clés, les activités clés, les partenaires clés et la structure de coûts.\n\nPrenez le temps de remplir chaque bloc en pensant spécifiquement à VOTRE projet. Ne restez pas théorique.', duration: '8 min', completed: false },
      { id: 'bm-2', title: 'Définir sa proposition de valeur', content: 'La proposition de valeur est le cœur de votre business model. Elle doit répondre à un problème ou un besoin non satisfait de votre client cible.\n\nUtilisez le framework "Jobs To Be Done" : quels "travaux" vos clients essaient-ils d\'accomplir ? Quelles frustrations rencontrent-ils ? Quels gains espèrent-ils ?\n\nFormulez votre proposition de valeur en une phrase claire : "Nous aidons [segment cible] à [bénéfice clé] grâce à [solution unique]."', duration: '10 min', completed: false },
      { id: 'bm-3', title: 'Les modèles de revenus', content: 'Il existe de nombreux modèles de revenus : vente directe, abonnement, freemium, marketplace, licence, franchise, publicité...\n\nChoisissez votre modèle en fonction de votre marché et de votre capacité à générer des revenus récurrents. Les investisseurs valorisent particulièrement les modèles récurrents (SaaS, abonnements) car ils assurent une visibilité sur les flux de trésorerie.\n\nCalculez votre "Average Revenue Per User" (ARPU) et votre taux de rétention pour valider la viabilité.', duration: '12 min', completed: false },
      { id: 'bm-4', title: 'Valider son business model', content: 'Un business model n\'est qu\'une hypothèse tant qu\'il n\'est pas testé sur le terrain. Voici comment le valider :\n\n1. Entretiens clients : parlez à au moins 20 prospects potentiels\n2. MVP (Minimum Viable Product) : créez une version simplifiée\n3. Pré-ventes : testez la volonté de payer réellement\n4. Itérez : ajustez en fonction des retours\n\nN\'hésitez pas à pivoter si les retours du marché vous le suggèrent.', duration: '15 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'marche', code: 'MA', title: 'Comprendre son marché', description: 'Maîtrisez l\'analyse de marché pour positionner votre offre.',
    duration: '50 min', difficulty: 'debutant', category: 'strategie', icon: '📊',
    lessons: [
      { id: 'ma-1', title: 'Segmenter son marché', content: 'La segmentation de marché consiste à diviser votre marché global en sous-groupes homogènes. Les critères courants sont : démographiques, géographiques, psychographiques et comportementaux.\n\nPour un créateur d\'entreprise, commencez par identifier votre "persona" client idéal : âge, revenus, habitudes, frustrations, aspirations. Plus votre persona est précis, plus votre stratégie sera efficace.', duration: '12 min', completed: false },
      { id: 'ma-2', title: 'Analyser la concurrence', content: 'Identifiez vos 3-5 concurrents principaux (directs et indirects). Pour chacun, analysez : leur positionnement, leurs forces, leurs faiblesses, leur part de marché estimée, et leur stratégie de prix.\n\nCréez une matrice de positionnement pour visualiser où se situe votre offre par rapport à la concurrence. Cherchez les "espaces vides" sur le marché.', duration: '15 min', completed: false },
      { id: 'ma-3', title: 'Évaluer la taille du marché', content: 'Calculez la taille de votre marché à 3 niveaux :\n- TAM (Total Addressable Market) : marché total si vous captiez 100%\n- SAM (Serviceable Addressable Market) : partie accessible\n- SOM (Serviceable Obtainable Market) : part réaliste à conquérir\n\nUtilisez les données publiques (INSEE, France Travail, fédérations professionnelles) et les études de marché disponibles gratuitement.', duration: '12 min', completed: false },
      { id: 'ma-4', title: 'Tester la demande', content: 'Avant de lancer, validez la demande réelle :\n1. Landing page avec formulaire d\'inscription\n2. Campagne publicitaire test (petit budget)\n3. Sondages et entretiens qualitatifs\n4. Pré-ventes ou réservations\n\nUn taux de conversion landing page > 5% est généralement un bon signal. Un taux de clic publicitaire > 2% indique un intérêt réel.', duration: '11 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'tresorerie', code: 'TR', title: 'Gérer sa trésorerie', description: 'Maîtrisez les fondamentaux de la gestion de trésorerie.',
    duration: '40 min', difficulty: 'intermediaire', category: 'finance', icon: '💰',
    lessons: [
      { id: 'tr-1', title: 'Comprendre la trésorerie', content: 'La trésorerie est différente du résultat comptable. Vous pouvez être bénéficiaire et faire face à une crise de trésorerie si vos clients paient en retard.\n\nLa règle d\'or : encaissez vite, décaissez tard. Négociez des acomptes avec vos clients et des délais de paiement longs avec vos fournisseurs.', duration: '10 min', completed: false },
      { id: 'tr-2', title: 'Construire un plan de trésorerie', content: 'Le plan de trésorerie prévisionnel sur 12 mois vous permet d\'anticiper les périodes de tension. Liste mois par mois : encaissements (ventes, subventions), décaissements (charges, investissements), et solde cumulé.\n\nMaintenez toujours un fonds de roulement suffisant pour couvrir 2 à 3 mois de charges fixes. C\'est votre filet de sécurité.', duration: '15 min', completed: false },
      { id: 'tr-3', title: 'Financer son besoin en fonds de roulement', content: 'Si votre BFR est positif (vous payez vos fournisseurs avant d\'encaisser vos clients), vous devez le financer. Solutions :\n- Fonds propres (apport personnel)\n- Dotation d\'équipement (ACRE, ARE)\n- Prêt d\'honneur (Initiative France, BPI)\n- Affacturage pour les créances clients', duration: '15 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'marketing-digital', code: 'MD', title: 'Maîtriser le marketing digital', description: 'Développez votre présence en ligne et attirez vos premiers clients.',
    duration: '55 min', difficulty: 'intermediaire', category: 'marketing', icon: '📣',
    lessons: [
      { id: 'md-1', title: 'Choisir ses canaux digitaux', content: 'Ne soyez pas partout. Choisissez 2-3 canaux pertinents pour votre cible :\n- Instagram/TikTok : visuel, B2C, 18-35 ans\n- LinkedIn : B2B, networking professionnel\n- Google My Business : présence locale\n- Site web + SEO : visibilité long terme\n\nConcentrez vos efforts là où votre client passe du temps.', duration: '12 min', completed: false },
      { id: 'md-2', title: 'Créer du contenu qui convertit', content: 'Le contenu est votre meilleur vendeur 24/7. Appliquez la règle 80/20 : 80% de contenu à valeur ajoutée, 20% de contenu promotionnel.\n\nFormats efficaces : tutoriels, études de cas, témoignages, avant/après. Utilisez les stories pour l\'urgence et les posts pour le référencement.', duration: '15 min', completed: false },
      { id: 'md-3', title: 'Mettre en place un tunnel de vente', content: 'Un tunnel de vente guide votre prospect de la découverte à l\'achat :\n1. Accroche (pub, post, réseau)\n2. Page de destination avec offre irrésistible\n3. Série d\'emails de nurturing (5-7 emails)\n4. Appel découverte ou démo\n5. Proposition commerciale\n\nAutomatisez le maximum pour scaler sans effort.', duration: '13 min', completed: false },
      { id: 'md-4', title: 'Mesurer et optimiser', content: 'Les KPIs essentiels du marketing digital :\n- Taux de conversion : visiteurs → leads → clients\n- Coût par acquisition (CPA) : budget / nouveaux clients\n- Retour sur investissement (ROI) : (revenus - coûts) / coûts\n- Taux d\'engagement : likes + commentaires / portée\n\nRévisez vos campagnes toutes les 2 semaines et doublez ce qui fonctionne.', duration: '15 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'juridique', code: 'JU', title: 'Choisir son statut juridique', description: 'Les clés pour choisir le statut adapté à votre projet.',
    duration: '35 min', difficulty: 'debutant', category: 'juridique', icon: '⚖️',
    lessons: [
      { id: 'ju-1', title: 'Les statuts individuels', content: 'Micro-entreprise : le plus simple. CA plafonné (77 700€ services, 188 700€ ventes). Pas de comptabilité complexe. Idéal pour tester.\n\nEIRL : protection du patrimoine personnel tout en restant indépendant. Choix de l\'impôt (IR ou IS).\n\nEURL : SASU à l\'IR. Un seul associé, statut plus prestigieux. Comptabilité plus lourde.', duration: '18 min', completed: false },
      { id: 'ju-2', title: 'Les sociétés', content: 'SARL : 2 associés minimum, statut classique, protection forte. Gestion souple.\n\nSAS : très flexible, statut prisé pour les startups. Rémunération via分红 aux conditions attractives.\n\nSASU : version mono-associé de la SAS. Parfait pour les projets solo ambitieux.\n\nChoisissez en fonction de : votre besoin de protection, le nombre d\'associés, votre ambition de croissance, et les charges sociales visées.', duration: '17 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'pitch', code: 'PI', title: 'Préparer son pitch', description: 'Convaincre en 3 minutes avec un pitch percutant.',
    duration: '30 min', difficulty: 'intermediaire', category: 'network', icon: '🎤',
    lessons: [
      { id: 'pi-1', title: 'La structure du pitch parfait', content: 'Un pitch efficace suit la structure : Problème → Solution → Marché → Business Model → Équipe → Demande.\n\nOuvrez par un "hook" : une question, une statistique choc ou une anecdote personnelle. Les 30 premières secondes déterminent l\'attention de votre auditoire.\n\nFermez par un "ask" clair : combien cherchez-vous ? Quel partenaire recherchez-vous ?', duration: '15 min', completed: false },
      { id: 'pi-2', title: 'S\'entraîner et maîtriser', content: 'Le pitch parfait est celui que vous pouvez répéter sans notes. Entraînez-vous :\n1. Devant un miroir (gestes, posture)\n2. En vidéo (auto-évaluation)\n3. Devant des proches (retours honnêtes)\n4. En conditions réelles (réseaux, événements)\n\nPréparez toujours 3 versions : 30 secondes (elevator pitch), 3 minutes (standard), 10 minutes (détaillé).', duration: '15 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'reseautage', code: 'RE', title: 'Réseauter efficacement', description: 'Construisez un réseau professionnel qui vous aide à grandir.',
    duration: '25 min', difficulty: 'debutant', category: 'network', icon: '🤝',
    lessons: [
      { id: 're-1', title: 'Les bases du réseautage', content: 'Le réseautage n\'est pas du "collecte de cartes de visite". C\'est créer des relations mutuellement bénéfiques.\n\nRègle du give-first : apportez de la valeur avant de demander. Partagez un contact, une information, un conseil. Les retours viendront naturellement.\n\nPréparez votre "elevator pitch" de 30 secondes pour toute rencontre imprévue.', duration: '12 min', completed: false },
      { id: 're-2', title: 'Réseautage en ligne et hors ligne', content: 'En ligne : optimisez votre profil LinkedIn, commentez les publications de vos cibles, participez aux groupes professionnels.\n\nHors ligne : participez aux événements de votre secteur, aux salons professionnels, aux meetups. Préparez 2-3 questions intelligentes à poser aux intervenants.\n\nEntretenez votre réseau : relancez un contact tous les 2-3 mois avec un article ou une information pertinente.', duration: '13 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'temps', code: 'TE', title: 'Gérer son temps', description: 'Optimisez votre temps pour être plus productif en tant qu\'entrepreneur.',
    duration: '20 min', difficulty: 'debutant', category: 'gestion', icon: '⏰',
    lessons: [
      { id: 'te-1', title: 'La matrice d\'Eisenhower', content: 'Classez vos tâches en 4 quadrants :\n1. Urgent + Important = FAIRE (livraisons, crises)\n2. Non-urgent + Important = PLANIFIER (stratégie, formation)\n3. Urgent + Non-important = DÉLÉGUER (emails, administratif)\n4. Non-urgent + Non-important = ÉLIMINER (scrolling, tâches inutiles)\n\nL\'erreur #1 des créateurs : passer 80% du temps dans le quadrant 3 au lieu du 2.', duration: '10 min', completed: false },
      { id: 'te-2', title: 'Techniques de productivité', content: 'Pomodoro (25/5) : travaillez en sprints concentrés de 25 min avec 5 min de pause.\n\nTime blocking : allouez des créneaux fixes dans votre agenda pour chaque type d\'activité.\n\nEat the frog : commencez votre journée par la tâche la plus difficile.\n\n2-minute rule : si une tâche prend moins de 2 min, faites-la immédiatement.', duration: '10 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'crise', code: 'CR', title: 'Gérer une crise', description: 'Préparez-vous aux difficultés et apprenez à rebondir.',
    duration: '30 min', difficulty: 'avance', category: 'gestion', icon: '🛡️',
    lessons: [
      { id: 'cr-1', title: 'Anticiper les risques', content: 'Identifiez les 5 risques majeurs pour votre activité : client unique, trésorerie tendue, dépendance fournisseur, problème juridique, santé du dirigeant.\n\nPour chaque risque, évaluez la probabilité (faible/moyenne/haute) et l\'impact (mineur/modéré/majeur). Priorisez les risques "haute probabilité + majeur impact".\n\nPréparez un plan d\'action pour chaque risque prioritaire.', duration: '15 min', completed: false },
      { id: 'cr-2', title: 'Rebondir après un échec', content: 'L\'échec fait partie du parcours entrepreneurial. Les statistiques montrent que les entrepreneurs qui ont déjà échoué ont plus de chances de réussir au deuxième essai.\n\nProcessus de rebond :\n1. Accepter la situation (pas de déni)\n2. Analyser objectivement les causes\n3. Capitaliser sur les compétences acquises\n4. Définir un nouveau plan d\'action\n5. S\'entourer d\'un réseau de soutien\n\nN\'oubliez pas : la clôture d\'une entreprise n\'est pas la fin de votre parcours entrepreneurial.', duration: '15 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'recrutement', code: 'RH', title: 'Recruter ses premiers talents', description: 'Les étapes clés pour bien recruter quand on est une petite structure.',
    duration: '35 min', difficulty: 'avance', category: 'gestion', icon: '👥',
    lessons: [
      { id: 'rh-1', title: 'Quand et qui recruter ?', content: 'Recrutez quand vous atteignez un point de saturation : vous refusez des missions, la qualité baisse, ou vous passez trop de temps sur des tâches non-stratégiques.\n\nPremier profil à recruter en général : un assistant polyvalent ou un profil commercial. Évitez de recruter un profil identique au vôtre (complémentarité > similarité).\n\nAlternatives au CDI : freelances, alternants, prestataires, mise en réseau de compétences.', duration: '18 min', completed: false },
      { id: 'rh-2', title: 'Le processus de recrutement', content: '1. Définir le besoin (fiche de poste détaillée)\n2. Sourcer (LinkedIn, Pôle Emploi, réseau, écoles)\n3. Sélectionner (CV + lettre de motivation)\n4. Entretien structuré (même questions pour tous)\n5. Mise en situation ou test pratique\n6. Vérification des références\n7. Proposition et intégration\n\nL\'intégration est cruciale : un bon onboarding réduit le turnover de 25%.', duration: '17 min', completed: false },
    ],
    started: false, completedAt: null,
  },
  {
    id: 'ventes', code: 'VE', title: 'Développer son chiffre d\'affaires', description: 'Stratégies concrètes pour augmenter vos revenus.',
    duration: '40 min', difficulty: 'intermediaire', category: 'marketing', icon: '📈',
    lessons: [
      { id: 've-1', title: 'Les 4 leviers de croissance', content: 'Pour doubler votre CA, améliorez chaque levier de 19% :\n1. Augmenter le nombre de prospects\n2. Augmenter le taux de conversion\n3. Augmenter la valeur moyenne du panier\n4. Augmenter la fréquence d\'achat\n\nIdentifiez votre levier le plus faible et concentrez vos efforts dessus. Souvent, c\'est la conversion qui a le plus gros potentiel d\'amélioration.', duration: '15 min', completed: false },
      { id: 've-2', title: 'Techniques de vente pour créateurs', content: 'La vente B2B : écoutez avant de parler. Posez des questions ouvertes pour comprendre le besoin réel. Ne vendez pas un produit, vendez une solution à un problème.\n\nLa méthode SPIN : Situation, Problème, Implication, Need-payoff. Guidez votre prospect pour qu\'il découvre lui-même la valeur de votre solution.\n\nSuivez vos prospects dans un CRM et relancez systématiquement. 80% des ventes se font après le 5ème contact.', duration: '13 min', completed: false },
      { id: 've-3', title: 'Pricing et marges', content: 'Ne vendez pas trop cher (vous perdez des clients) ni trop pas cher (vous dévalorisez votre offre et ne survivez pas).\n\nPricing basé sur la valeur : que gagne votre client grâce à votre produit ? Facturez 10-20% de cette valeur.\n\nTestez vos prix : augmentez de 10% et observez l\'impact. Souvent, la demande est beaucoup moins élastique que prévu.', duration: '12 min', completed: false },
    ],
    started: false, completedAt: null,
  },
]

const BADGES_CATALOG: BadgeItem[] = [
  { id: 'explorateur', name: 'Explorateur', emoji: '🎯', description: 'Premiers pas dans l\'apprentissage', howToUnlock: 'Complétez votre première formation', unlocked: false, unlockedAt: null },
  { id: 'stratege', name: 'Stratège', emoji: '📊', description: 'Expert en stratégie d\'entreprise', howToUnlock: 'Complétez 3 formations Stratégie', unlocked: false, unlockedAt: null },
  { id: 'financier', name: 'Financier', emoji: '💰', description: 'Maître de la gestion financière', howToUnlock: 'Complétez toutes les formations Finance', unlocked: false, unlockedAt: null },
  { id: 'marketeur', name: 'Marketeur', emoji: '📣', description: 'Expert en marketing digital', howToUnlock: 'Complétez toutes les formations Marketing', unlocked: false, unlockedAt: null },
  { id: 'champion', name: 'Champion', emoji: '🏆', description: 'Apprentissage assidu', howToUnlock: 'Complétez 8 formations ou plus', unlocked: false, unlockedAt: null },
  { id: 'serieux', name: 'Sérieux', emoji: '🔥', description: 'Apprentissage régulier', howToUnlock: 'Connectez-vous et étudiez 7 jours consécutifs', unlocked: false, unlockedAt: null },
  { id: 'rapide', name: 'Rapide', emoji: '⚡', description: 'Apprentissage en profondeur', howToUnlock: 'Complétez une formation en une seule session', unlocked: false, unlockedAt: null },
  { id: 'expert', name: 'Expert', emoji: '🌟', description: 'Maîtrise complète du programme', howToUnlock: 'Complétez les 12 formations du catalogue', unlocked: false, unlockedAt: null },
]

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  debutant: { label: 'Débutant', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  intermediaire: { label: 'Intermédiaire', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  avance: { label: 'Avancé', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
}

const CATEGORY_LABELS: Record<Category, string> = {
  strategie: 'Stratégie', finance: 'Finance', marketing: 'Marketing',
  juridique: 'Juridique', gestion: 'Gestion', network: 'Réseau',
}

const STORAGE_KEY = 'creapulse-e-learning'

const DEFAULT_DATA: ELearningData = { formations: {}, badges: {}, xp: 0, streak: 0, lastStudyDate: null }

// ─── Main Component ─────────────────────────

export function ELearningModule() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ELearningData>(DEFAULT_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [diffFilter, setDiffFilter] = useState<string>('all')
  const [activeFormation, setActiveFormation] = useState<Formation | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setData({ ...DEFAULT_DATA, ...JSON.parse(saved) })
    } catch { /* ignore */ }
    setIsLoading(false)
  }, [])

  useEffect(() => { if (!isLoading) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }, [isLoading, data])

  // ─── Helpers ───────────────────────────────
  const getFormationProgress = useCallback((f: Formation) => {
    const fd = data.formations[f.id]
    if (!fd) return { percent: 0, completed: 0, total: f.lessons.length }
    const completed = fd.lessonsCompleted.length
    return { percent: Math.round((completed / f.lessons.length) * 100), completed, total: f.lessons.length }
  }, [data.formations])

  const isLessonCompleted = useCallback((formationId: string, lessonId: string) => {
    return data.formations[formationId]?.lessonsCompleted?.includes(lessonId) || false
  }, [data.formations])

  const toggleLesson = useCallback((formationId: string, lessonId: string) => {
    setData(prev => {
      const fd = prev.formations[formationId] || { lessonsCompleted: [], started: false, completedAt: null }
      const completed = fd.lessonsCompleted.includes(lessonId)
        ? fd.lessonsCompleted.filter(id => id !== lessonId)
        : [...fd.lessonsCompleted, lessonId]
      const formation = FORMATIONS_CATALOG.find(f => f.id === formationId)
      const allDone = formation && completed.length === formation.lessons.length
      return {
        ...prev,
        formations: {
          ...prev.formations,
          [formationId]: {
            ...fd,
            lessonsCompleted: completed,
            started: true,
            completedAt: allDone ? new Date().toISOString() : null,
          },
        },
        xp: prev.xp + (completed.includes(lessonId) ? 0 : 25),
        lastStudyDate: new Date().toISOString().split('T')[0],
      }
    })
  }, [])

  // ─── Badges logic ─────────────────────────
  const earnedBadges = useMemo(() => {
    const completedFormations = FORMATIONS_CATALOG.filter(f => {
      const fd = data.formations[f.id]
      return fd && fd.completedAt
    })
    const strategyCompleted = completedFormations.filter(f => f.category === 'strategie').length
    const financeCompleted = completedFormations.filter(f => f.category === 'finance').length
    const marketingCompleted = completedFormations.filter(f => f.category === 'marketing').length

    const updates: Record<string, { unlocked: boolean; unlockedAt: string | null }> = {}
    const check = (id: string, condition: boolean) => {
      const current = data.badges[id]
      if (condition && !current?.unlocked) updates[id] = { unlocked: true, unlockedAt: new Date().toISOString() }
      else if (!condition) updates[id] = { unlocked: false, unlockedAt: null }
    }
    check('explorateur', completedFormations.length >= 1)
    check('stratege', strategyCompleted >= 3)
    check('financier', financeCompleted >= 1)
    check('marketeur', marketingCompleted >= 2)
    check('champion', completedFormations.length >= 8)
    check('expert', completedFormations.length >= 12)

    const badges = { ...data.badges, ...updates }
    if (Object.keys(updates).length > 0 && JSON.stringify(badges) !== JSON.stringify(data.badges)) {
      setData(prev => ({ ...prev, badges }))
    }
    return BADGES_CATALOG.map(b => ({ ...b, ...(badges[b.id] || { unlocked: false, unlockedAt: null }) }))
  }, [data])

  const unlockedCount = earnedBadges.filter(b => b.unlocked).length

  // ─── Filtered formations ──────────────────
  const filteredFormations = useMemo(() => {
    let result = FORMATIONS_CATALOG
    if (catFilter !== 'all') result = result.filter(f => f.category === catFilter)
    if (diffFilter !== 'all') result = result.filter(f => f.difficulty === diffFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
    }
    return result
  }, [searchQuery, catFilter, diffFilter])

  const totalCompleted = FORMATIONS_CATALOG.filter(f => data.formations[f.id]?.completedAt).length

  // ─── Loading skeleton ─────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />)}</div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:px-6 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Formation & E-Learning</h2>
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px] px-1.5">Nouveau</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{totalCompleted}/{FORMATIONS_CATALOG.length} formations · {data.xp} XP · {unlockedCount}/{BADGES_CATALOG.length} badges</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="catalogue" className="flex-1">
        <div className="border-b px-4 md:px-6">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="catalogue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Catalogue</TabsTrigger>
            <TabsTrigger value="parcours" className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Mon Parcours</TabsTrigger>
            <TabsTrigger value="badges" className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-0">Badges</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab: Catalogue ── */}
        <TabsContent value="catalogue" className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher une formation..." className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={diffFilter} onValueChange={setDiffFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Niveau" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFormations.map(f => {
              const prog = getFormationProgress(f)
              const dc = DIFFICULTY_CONFIG[f.difficulty]
              return (
                <motion.div key={f.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Card className="h-full cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveFormation(f)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{f.icon}</span>
                        <Badge variant="outline" className={cn('text-[10px] shrink-0', dc.color)}>{dc.label}</Badge>
                      </div>
                      <CardTitle className="text-sm leading-tight mt-2">{f.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{f.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{f.duration}</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{f.lessons.length} leçons</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{prog.completed}/{prog.total}</span>
                          <span className={cn(prog.percent === 100 && 'text-emerald-600 font-medium')}>{prog.percent}%</span>
                        </div>
                        <Progress value={prog.percent} className="h-2" />
                      </div>
                      {prog.percent === 100 ? (
                        <Button size="sm" variant="outline" className="w-full gap-1 text-emerald-600 border-emerald-300" disabled>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Terminée
                        </Button>
                      ) : prog.completed > 0 ? (
                        <Button size="sm" className="w-full gap-1 bg-violet-600 hover:bg-violet-700 text-white">
                          <Play className="h-3.5 w-3.5" /> Continuer
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full gap-1">
                          <Play className="h-3.5 w-3.5" /> Commencer
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* ── Tab: Mon Parcours ── */}
        <TabsContent value="parcours" className="p-4 md:p-6 space-y-4">
          {activeFormation ? (
            <div>
              <Button variant="ghost" size="sm" className="gap-1 mb-4" onClick={() => setActiveFormation(null)}>
                <ArrowRight className="h-4 w-4 rotate-180" /> Retour au catalogue
              </Button>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activeFormation.icon}</span>
                    <div>
                      <CardTitle>{activeFormation.title}</CardTitle>
                      <CardDescription>{activeFormation.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className={cn(DIFFICULTY_CONFIG[activeFormation.difficulty].color)}>{DIFFICULTY_CONFIG[activeFormation.difficulty].label}</Badge>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{activeFormation.duration}</span>
                    <span>{getFormationProgress(activeFormation).percent}% complété</span>
                  </div>
                  <Progress value={getFormationProgress(activeFormation).percent} className="h-2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeFormation.lessons.map((lesson, idx) => {
                    const done = isLessonCompleted(activeFormation.id, lesson.id)
                    return (
                      <motion.div key={lesson.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                        <Card className={cn('transition-colors', done && 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20')}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox checked={done} onCheckedChange={() => toggleLesson(activeFormation.id, lesson.id)} className="mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className={cn('text-sm font-semibold', done && 'line-through text-muted-foreground')}>{lesson.title}</p>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.duration}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{lesson.content}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-violet-600">{totalCompleted}</p><p className="text-xs text-muted-foreground">Formations terminées</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-violet-600">{data.xp}</p><p className="text-xs text-muted-foreground">Points XP</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-violet-600">{unlockedCount}</p><p className="text-xs text-muted-foreground">Badges débloqués</p></CardContent></Card>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Sélectionnez une formation dans le catalogue pour commencer votre apprentissage.</p>
              {FORMATIONS_CATALOG.filter(f => data.formations[f.id]?.started).map(f => (
                <Card key={f.id} className="mb-3 cursor-pointer hover:shadow-sm" onClick={() => setActiveFormation(f)}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="text-2xl">{f.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{f.title}</p>
                      <Progress value={getFormationProgress(f).percent} className="h-1.5 mt-2" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-violet-600">{getFormationProgress(f).percent}%</p>
                      {data.formations[f.id]?.completedAt && <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mt-1" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {FORMATIONS_CATALOG.filter(f => data.formations[f.id]?.started).length === 0 && (
                <Card className="p-8 text-center">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Aucune formation commencée</p>
                  <p className="text-xs text-muted-foreground mt-1">Explorez le catalogue pour commencer.</p>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Tab: Badges ── */}
        <TabsContent value="badges" className="p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <Trophy className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unlockedCount}/{BADGES_CATALOG.length}</p>
              <p className="text-xs text-muted-foreground">Badges débloqués</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedBadges.map(badge => (
              <motion.div key={badge.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Card className={cn('cursor-pointer hover:shadow-md transition-all h-full', badge.unlocked ? 'border-violet-300 dark:border-violet-800' : 'opacity-60')} onClick={() => setSelectedBadge(badge)}>
                  <CardContent className="flex flex-col items-center text-center p-4">
                    <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl text-3xl mb-3', badge.unlocked ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-muted')}>
                      {badge.unlocked ? badge.emoji : <Lock className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <p className="text-sm font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                    {badge.unlocked && badge.unlockedAt && (
                      <p className="text-[10px] text-violet-500 mt-2">{new Date(badge.unlockedAt).toLocaleDateString('fr-FR')}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Badge Detail Dialog */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl text-5xl mb-3 bg-violet-100 dark:bg-violet-900/30">
                {selectedBadge?.unlocked ? selectedBadge.emoji : <Lock className="h-8 w-8 text-muted-foreground" />}
              </div>
              <DialogTitle className="text-center">{selectedBadge?.name}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{selectedBadge?.description}</p>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Comment le débloquer</p>
              <p className="text-sm mt-1">{selectedBadge?.howToUnlock}</p>
            </div>
            {selectedBadge?.unlocked && selectedBadge?.unlockedAt && (
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <Award className="h-3 w-3 mr-1" />Débloqué le {new Date(selectedBadge.unlockedAt).toLocaleDateString('fr-FR')}
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}