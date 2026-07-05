// ============================================
// CreaPulse V2 — Forum Demo Data
// Realistic French entrepreneurship forum data
// Served when the DB has no discussions
// ============================================

const h = (n: number) => new Date(Date.now() - n * 3600000).toISOString()
const d = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export interface DemoAuthor {
  id: string
  name: string
  initials: string
}

export interface DemoReply {
  id: string
  author: DemoAuthor
  content: string
  likesCount: number
  isLiked: boolean
  isEdited: boolean
  createdAt: string
  parentId: string | null
  children: DemoReply[]
}

export interface DemoDiscussion {
  id: string
  title: string
  content: string
  author: DemoAuthor
  category: { id: string; name: string; slug: string; color: string | null }
  replyCount: number
  likesCount: number
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  tags: string[]
  createdAt: string
  replies: DemoReply[]
}

export const DEMO_AUTHORS: DemoAuthor[] = [
  { id: 'a1', name: 'Sophie Martin', initials: 'SM' },
  { id: 'a2', name: 'Jean Dupont', initials: 'JD' },
  { id: 'a3', name: 'Amina Benali', initials: 'AB' },
  { id: 'a4', name: 'Lucas Petit', initials: 'LP' },
  { id: 'a5', name: 'Marie Leroy', initials: 'ML' },
  { id: 'a6', name: 'Thomas Bernard', initials: 'TB' },
  { id: 'a7', name: 'Fatima Diallo', initials: 'FD' },
  { id: 'a8', name: 'Pierre Moreau', initials: 'PM' },
]

export const DEMO_CATEGORIES: Record<string, { id: string; name: string; slug: string; color: string | null }> = {
  creation: { id: 'cat-creation', name: 'Création', slug: 'creation', color: 'teal' },
  financement: { id: 'cat-financement', name: 'Financement', slug: 'financement', color: 'amber' },
  juridique: { id: 'cat-juridique', name: 'Juridique', slug: 'juridique', color: 'purple' },
  marketing: { id: 'cat-marketing', name: 'Marketing', slug: 'marketing', color: 'rose' },
  reseau: { id: 'cat-reseau', name: 'Réseau', slug: 'reseau', color: 'sky' },
  emploi: { id: 'cat-emploi', name: 'Emploi', slug: 'emploi', color: 'emerald' },
  'vie-entrepreneur': { id: 'cat-vie-entrepreneur', name: 'Vie d\'entrepreneur', slug: 'vie-entrepreneur', color: 'orange' },
}

export const DEMO_DISCUSSIONS: DemoDiscussion[] = [
  {
    id: 'demo-d1',
    title: 'Comment choisir entre SAS et SARL pour une startup tech ?',
    content: `Bonjour à tous !\n\nJe suis en train de créer une startup dans la tech et j'hésite entre le statut SAS et SARL. J'ai lu beaucoup d'articles mais je reste indécis.\n\n**SAS :**\n- Plus flexible pour la répartition des dividendes\n- Peut attirer des investisseurs plus facilement\n- Charges sociales plus élevées pour le dirigeant\n\n**SARL :**\n- Charges sociales moins importantes\n- Plus simple à gérer au début\n- Moins flexible pour les futurs associés\n\nMon projet prévoit de lever des fonds dans 2-3 ans. Quel serait le meilleur choix selon vous ?\n\nMerci d'avance pour vos retours !`,
    author: DEMO_AUTHORS[0],
    category: DEMO_CATEGORIES['juridique'],
    replyCount: 3,
    likesCount: 24,
    isPinned: true,
    isLocked: false,
    viewCount: 289,
    tags: ['statut juridique', 'SAS', 'SARL', 'startup'],
    createdAt: d(1),
    replies: [
      {
        id: 'demo-r1', author: DEMO_AUTHORS[3], content: 'Pour une startup avec ambition de levée de fonds, la SAS est clairement le choix recommandé. La souplesse statutaire et la possibilité d\'émettre des actions de préférence sont des atouts majeurs.', likesCount: 12, isLiked: false, isEdited: false, createdAt: h(22), parentId: null, children: [
          { id: 'demo-r1-1', author: DEMO_AUTHORS[0], content: 'Merci pour ce conseil ! Et au niveau des coûts de création, c\'est vraiment plus cher ?', likesCount: 3, isLiked: false, isEdited: false, createdAt: h(20), parentId: 'demo-r1', children: [] },
          { id: 'demo-r1-2', author: DEMO_AUTHORS[3], content: 'Les frais de création sont similaires (~200-300€). C\'est surtout les charges sociales du dirigeant qui sont plus élevées en SAS (~80% vs ~45% en SARL).', likesCount: 8, isLiked: false, isEdited: false, createdAt: h(18), parentId: 'demo-r1', children: [] },
        ],
      },
      {
        id: 'demo-r2', author: DEMO_AUTHORS[5], content: 'Je confirme, SAS pour la tech. N\'hésitez pas à consulter un avocat spécialisé pour les statuts, ça vaut l\'investissement.', likesCount: 6, isLiked: false, isEdited: false, createdAt: h(15), parentId: null, children: [],
      },
      {
        id: 'demo-r3', author: DEMO_AUTHORS[6], content: 'Attention aussi à l\'option SASU si vous êtes seul au début. Vous pourrez toujours la transformer en SAS plus tard.', likesCount: 9, isLiked: true, isEdited: false, createdAt: h(10), parentId: null, children: [
          { id: 'demo-r3-1', author: DEMO_AUTHORS[1], content: 'Bonne remarque ! La transformation de SASU en SAS est en effet très simple.', likesCount: 2, isLiked: false, isEdited: false, createdAt: h(8), parentId: 'demo-r3', children: [] },
        ],
      },
    ],
  },
  {
    id: 'demo-d2',
    title: 'Obtenir un prêt d\'honneur : mon expérience avec BPI France',
    content: `Je voulais partager mon expérience positive avec le prêt d'honneur BPI France.\n\nJ'ai créé ma SARL il y a 6 mois dans le secteur de la restauration. J'ai postulé au prêt d'honneur "Création d'entreprise" et j'ai obtenu 30 000€.\n\n**Le processus :**\n1. Préparation du business plan (2 semaines)\n2. Rencontre avec un conseiller BPI (1h)\n3. Passage devant le comité d'engagement (30 min)\n4. Réponse favorable sous 15 jours\n\n**Mes conseils :**\n- Ayez un BP solide avec des prévisions réalistes\n- Montrez que vous avez déjà injecté de l'apport personnel\n- Préparez bien votre pitch oral\n\nN'hésitez pas si vous avez des questions !`,
    author: DEMO_AUTHORS[1],
    category: DEMO_CATEGORIES['financement'],
    replyCount: 2,
    likesCount: 45,
    isPinned: true,
    isLocked: false,
    viewCount: 412,
    tags: ['BPI France', 'prêt d\'honneur', 'financement'],
    createdAt: d(3),
    replies: [
      {
        id: 'demo-r4', author: DEMO_AUTHORS[4], content: 'Super retour ! Combien d\'apport personnel aviez-vous investi pour obtenir ce prêt ?', likesCount: 5, isLiked: false, isEdited: false, createdAt: d(2), parentId: null, children: [
          { id: 'demo-r4-1', author: DEMO_AUTHORS[1], content: 'J\'avais apporté 15 000€ de mes économies, soit 1/3 du besoin total de 45 000€.', likesCount: 7, isLiked: true, isEdited: false, createdAt: d(2), parentId: 'demo-r4', children: [] },
        ],
      },
      { id: 'demo-r5', author: DEMO_AUTHORS[2], content: 'Merci pour ce partage ! Est-ce que le prêt d\'honneur est cumulable avec d\'autres aides ?', likesCount: 3, isLiked: false, isEdited: false, createdAt: h(40), parentId: null, children: [] },
    ],
  },
  {
    id: 'demo-d3',
    title: 'Stratégie de marketing digital pour un e-commerce de produits artisanaux',
    content: `Bonjour,\n\nJe lance un e-commerce de produits artisanaux (bougies, savons, céramiques) et je cherche des conseils en marketing digital avec un petit budget.\n\nJ'ai déjà :\n- Créé mon site Shopify\n- Ouvert un compte Instagram (320 abonnés)\n- Commencé le SEO de base\n\nMon budget mensuel est d'environ 300€. Par où commencer selon vous ? Ads Facebook ? TikTok ? Influencer marketing ?\n\nMerci pour vos retours !`,
    author: DEMO_AUTHORS[2],
    category: DEMO_CATEGORIES['marketing'],
    replyCount: 2,
    likesCount: 18,
    isPinned: false,
    isLocked: false,
    viewCount: 156,
    tags: ['e-commerce', 'marketing digital', 'Instagram', 'budget'],
    createdAt: d(2),
    replies: [
      { id: 'demo-r6', author: DEMO_AUTHORS[7], content: 'Pour des produits artisanaux visuels, concentrez-vous sur Instagram et TikTok. Avec 300€/mois, privilégiez la création de contenu organique et les partenariats avec des micro-influenceurs (échange de produits).', likesCount: 15, isLiked: false, isEdited: false, createdAt: d(1), parentId: null, children: [] },
      { id: 'demo-r7', author: DEMO_AUTHORS[4], content: 'Les vidéos courtes sur TikTok et Reels Instagram sont très performants pour ce type de produits. Filmez le processus de fabrication, c\'est ce qui intéresse les clients !', likesCount: 8, isLiked: false, isEdited: false, createdAt: h(30), parentId: null, children: [] },
    ],
  },
  {
    id: 'demo-d4',
    title: 'Réseautage efficace : comment trouver des partenaires de confiance ?',
    content: `Je cherche à développer mon réseau professionnel dans le secteur de la transition écologique. J'assiste à des événements mais j'ai du mal à créer des relations durables.\n\nQuelles sont vos stratégies de réseautage efficace ? Comment transformez-vous une rencontre en véritable partenariat ?`,
    author: DEMO_AUTHORS[4],
    category: DEMO_CATEGORIES['reseau'],
    replyCount: 1,
    likesCount: 11,
    isPinned: false,
    isLocked: false,
    viewCount: 87,
    tags: ['réseautage', 'partenariats', 'événements'],
    createdAt: h(18),
    replies: [
      { id: 'demo-r8', author: DEMO_AUTHORS[0], content: 'Mon astuce : toujours faire un suivi dans les 48h après un événement. Un simple email personnalisé avec référence à votre conversation fait toute la différence.', likesCount: 9, isLiked: true, isEdited: false, createdAt: h(12), parentId: null, children: [] },
    ],
  },
  {
    id: 'demo-d5',
    title: 'Le marché de la livraison à domicile en 2025 : opportunités ou saturation ?',
    content: `Après avoir travaillé 5 ans dans la logistique, je réfléchis à lancer mon propre service de livraison locale.\n\nLe marché semble saturé par les grands acteurs, mais je pense qu'il y a une place pour un service premium et hyper-local.\n\nQuelqu'un a-t-il une analyse du marché actuel ? Quels sont les segments les plus prometteurs ?`,
    author: DEMO_AUTHORS[3],
    category: DEMO_CATEGORIES['creation'],
    replyCount: 0,
    likesCount: 7,
    isPinned: false,
    isLocked: false,
    viewCount: 63,
    tags: ['livraison', 'marché', 'logistique', 'opportunité'],
    createdAt: d(4),
    replies: [],
  },
  {
    id: 'demo-d6',
    title: 'Recruter son premier salarié : démarches et pièges à éviter',
    content: `Mon auto-entreprise décolle et j'envisage d'embaucher mon premier salarié. Je suis un peu perdu face aux démarches administratives.\n\nQuestions :\n- CDI ou CDD pour commencer ?\n- Quelles aides à l'embauche existent ?\n- Comment gérer la paie ? (logiciel ? expert-comptable ?)\n- Quelles sont les erreurs courantes à éviter ?\n\nMerci d'avance pour vos conseils !`,
    author: DEMO_AUTHORS[5],
    category: DEMO_CATEGORIES['emploi'],
    replyCount: 1,
    likesCount: 20,
    isPinned: false,
    isLocked: false,
    viewCount: 198,
    tags: ['recrutement', 'premier salarié', 'démarches'],
    createdAt: d(5),
    replies: [
      { id: 'demo-r9', author: DEMO_AUTHORS[6], content: 'Pour le premier salarié, un CDD de 6 mois est une bonne option pour tester. Pensez à l\'aide TPE pour l\'embauche (4000€). Pour la paie, un logiciel comme PayFit ou un expert-comptable sont des options fiables.', likesCount: 14, isLiked: false, isEdited: false, createdAt: d(4), parentId: null, children: [] },
    ],
  },
  {
    id: 'demo-d7',
    title: 'Gérer le stress et l\'isolement quand on est entrepreneur solo',
    content: `Ça fait 8 mois que j'ai lancé mon activité de consulting et je dois avouer que l'isolement commence à peser.\n\nCertains jours, je ne parle à personne de la journée. Le doute s'installe et la motivation fluctue.\n\nComment gérez-vous le côté psychologique de l'entrepreneuriat ? Avez-vous des routines pour rester motivé(e) ?\n\nJe sais que je ne suis pas seul(e) à vivre ça, partagez vos expériences !`,
    author: DEMO_AUTHORS[6],
    category: DEMO_CATEGORIES['vie-entrepreneur'],
    replyCount: 2,
    likesCount: 52,
    isPinned: false,
    isLocked: false,
    viewCount: 534,
    tags: ['bien-être', 'isolement', 'motivation', 'santé mentale'],
    createdAt: d(6),
    replies: [
      { id: 'demo-r10', author: DEMO_AUTHORS[0], content: 'Merci d\'en parler ! Les espaces de coworking ont sauvé ma santé mentale. Le simple fait d\'être entouré de gens qui travaillent change tout. Et n\'hésitez pas à consulter un coach si besoin.', likesCount: 22, isLiked: true, isEdited: false, createdAt: d(5), parentId: null, children: [] },
      { id: 'demo-r11', author: DEMO_AUTHORS[2], content: 'Les groupes d\'entrepreneurs locaux sont aussi très efficaces. On se rend compte qu\'on est pas seul à traverser ces moments difficiles.', likesCount: 10, isLiked: false, isEdited: false, createdAt: d(4), parentId: null, children: [] },
    ],
  },
  {
    id: 'demo-d8',
    title: 'Nouvelle-aquitaine : aides spécifiques pour les créateurs d\'entreprise',
    content: `Je me lance dans la création d'une entreprise de services en Nouvelle-Aquitaine. Je cherche à recenser toutes les aides disponibles au niveau régional.\n\nPour l'instant j'ai identifié :\n- Aide à la création (Région)\n- ARCE si je prends mes indemnités\n- ACCRE pour les cotisations\n\nEst-ce que je manque quelque chose ? Y a-t-il des dispositifs spécifiques à la région ?`,
    author: DEMO_AUTHORS[7],
    category: DEMO_CATEGORIES['financement'],
    replyCount: 0,
    likesCount: 5,
    isPinned: false,
    isLocked: false,
    viewCount: 42,
    tags: ['aides', 'Nouvelle-Aquitaine', 'région', 'subventions'],
    createdAt: d(7),
    replies: [],
  },
  {
    id: 'demo-d9',
    title: 'Comment protéger sa marque : dépôt INPI ou via un avocat ?',
    content: `Mon logo et mon nom de marque sont prêts. Je dois maintenant les protéger. Faut-il passer par l'INPI directement ou vaut mieux prendre un avocat en PI ?\n\nL'INPI me semble moins cher mais je crains de mal faire les choses. Quelqu'un a comparé les deux options ?`,
    author: DEMO_AUTHORS[3],
    category: DEMO_CATEGORIES['juridique'],
    replyCount: 1,
    likesCount: 13,
    isPinned: false,
    isLocked: false,
    viewCount: 134,
    tags: ['marque', 'INPI', 'propriété intellectuelle', 'protection'],
    createdAt: h(8),
    replies: [
      { id: 'demo-r12', author: DEMO_AUTHORS[5], content: 'Le dépôt INPI en ligne est tout à fait faisable seul si votre marque est simple. Comptez ~250€. Par contre, si vous avez des doutes sur la disponibilité ou la classification, un avocat PI (~500-1500€) peut vous éviter des problèmes coûteux.', likesCount: 11, isLiked: false, isEdited: false, createdAt: h(5), parentId: null, children: [] },
    ],
  },
  {
    id: "demo-d10",
    title: "De l'idée au MVP : plan d'action pour un SaaS B2B",
    content: "J'ai une idée de SaaS pour les TPE/PME qui automatiserait leur gestion administrative. Je suis développeur de métier mais je n'ai jamais lancé de produit.\n\nJ'aimerais établir un plan d'action clair :\n1. Validation de l'idée (comment ?)\n2. Construction du MVP\n3. Premiers tests clients\n4. Go/No Go\n\nDes retours d'expérience sur ce type de projet ?",
    author: DEMO_AUTHORS[1],
    category: DEMO_CATEGORIES["creation"],
    replyCount: 1,
    likesCount: 31,
    isPinned: false,
    isLocked: false,
    viewCount: 267,
    tags: ["SaaS", "MVP", "B2B", "validation"],
    createdAt: d(2),
    replies: [
      {
        id: "demo-r13",
        author: DEMO_AUTHORS[7],
        content: "Étape cruciale : avant de coder, vendez votre produit à 5-10 clients potentiels (landing page + préventes). Si personne n'achète une promesse, personne n'achètera le produit fini.",
        likesCount: 18,
        isLiked: true,
        isEdited: false,
        createdAt: d(1),
        parentId: null,
        children: [
          { id: "demo-r13-1", author: DEMO_AUTHORS[1], content: "Excellent conseil ! Tu recommandes quel outil pour la landing page de validation ?", likesCount: 4, isLiked: false, isEdited: false, createdAt: h(20), parentId: "demo-r13", children: [] },
          { id: "demo-r13-2", author: DEMO_AUTHORS[7], content: "Carrd (gratuit et rapide), No-code avec Framer ou Webflow si tu veux plus de contrôle.", likesCount: 6, isLiked: false, isEdited: false, createdAt: h(16), parentId: "demo-r13", children: [] },
        ],
      },
    ],
  },
]

/** Find a demo discussion by id (for detail view) */
export function findDemoDiscussion(id: string): DemoDiscussion | undefined {
  return DEMO_DISCUSSIONS.find(d => d.id === id)
}

/** Format a demo discussion for list API response (no replies) */
export function formatDemoDiscussionList(d: DemoDiscussion) {
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    preview: d.content.substring(0, 150) + (d.content.length > 150 ? '...' : ''),
    author: d.author,
    category: d.category,
    replyCount: d.replyCount,
    likesCount: d.likesCount,
    isPinned: d.isPinned,
    isLocked: d.isLocked,
    viewCount: d.viewCount,
    tags: d.tags,
    createdAt: d.createdAt,
  }
}