// ============================================
// CreaPulse V2 — Extended Seed Script
// Adds CréaScope, SwipeGame, Notifications,
// Forum Discussions, and Consent Logs
// Run: npx tsx prisma/seed-extended.ts
// ============================================

import { config } from 'dotenv'
config({ path: '.env.local', override: true })
config({ override: true })

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Helpers ──────────────────────────────────

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

async function seedIfMissing<T>(
  model: { findFirst: (args: any) => Promise<T | null>; create: (args: any) => Promise<T> },
  where: any,
  data: any,
): Promise<T> {
  const existing = await model.findFirst({ where })
  if (existing) return existing
  return model.create({ data })
}

// ─── Main Seed ────────────────────────────────

async function main() {
  console.log('🌱 CreaPulse V2 — Seeding extended data...')

  // ── Look up existing entities ──
  const beneficiaryUser = await db.user.findUnique({ where: { id: 'beneficiaire-demo-001' } })
  const counselorUser = await db.user.findUnique({ where: { id: 'conseiller-gidef-001' } })
  const adminUser = await db.user.findUnique({ where: { id: 'admin-echo-001' } })

  if (!beneficiaryUser || !counselorUser || !adminUser) {
    console.error('❌ Required users not found. Run seed.ts first.')
    process.exit(1)
  }

  const beneficiary = await db.beneficiary.findUnique({ where: { userId: beneficiaryUser.id } })
  const counselor = await db.counselor.findUnique({ where: { userId: counselorUser.id } })

  if (!beneficiary || !counselor) {
    console.error('❌ Beneficiary or Counselor profile not found. Run seed.ts first.')
    process.exit(1)
  }

  console.log(`  ✓ Found beneficiary: ${beneficiaryUser.firstName} ${beneficiaryUser.lastName} (${beneficiaryUser.id})`)
  console.log(`  ✓ Found counselor: ${counselorUser.firstName} ${counselorUser.lastName} (${counselorUser.id})`)

  // ─────────────────────────────────────────────
  // 1. SWIPE CARDS (must exist before SwipeGameResult)
  // ─────────────────────────────────────────────

  const swipeCardsData = [
    // Leadership
    { code: 'ldr-01', title: 'Prise de décision', description: 'Capacité à prendre des décisions rapides et éclairées, même en situation d\'incertitude.', icon: 'Crown', category: 'leadership', difficulty: 2, weight: 1.2, sortOrder: 1 },
    { code: 'ldr-02', title: 'Délégation efficace', description: 'Savoir confier des tâches et responsabiliser son équipe.', icon: 'Users', category: 'leadership', difficulty: 2, weight: 1.0, sortOrder: 2 },
    { code: 'ldr-03', title: 'Vision stratégique', description: 'Capacité à définir une direction claire et à inspirer son équipe.', icon: 'Telescope', category: 'leadership', difficulty: 3, weight: 1.5, sortOrder: 3 },
    { code: 'ldr-04', title: 'Gestion de conflits', description: 'Résoudre les tensions au sein d\'une équipe de manière constructive.', icon: 'Shield', category: 'leadership', difficulty: 2, weight: 1.0, sortOrder: 4 },
    { code: 'ldr-05', title: 'Responsabilisation', description: 'Assumer les conséquences de ses décisions et de celles de son équipe.', icon: 'Award', category: 'leadership', difficulty: 1, weight: 0.8, sortOrder: 5 },

    // Communication
    { code: 'com-01', title: 'Présentation orale', description: 'S\'exprimer clairement devant un public et captiver l\'audience.', icon: 'Mic', category: 'communication', difficulty: 2, weight: 1.2, sortOrder: 6 },
    { code: 'com-02', title: 'Écoute active', description: 'Comprendre et reformuler les besoins de son interlocuteur.', icon: 'Ear', category: 'communication', difficulty: 1, weight: 1.0, sortOrder: 7 },
    { code: 'com-03', title: 'Négociation', description: 'Trouver des accords gagnant-gagnant dans les discussions commerciales.', icon: 'Handshake', category: 'communication', difficulty: 3, weight: 1.3, sortOrder: 8 },
    { code: 'com-04', title: 'Communication écrite', description: 'Rédiger des messages clairs, professionnels et convaincants.', icon: 'PenTool', category: 'communication', difficulty: 1, weight: 0.9, sortOrder: 9 },
    { code: 'com-05', title: 'Persuasion', description: 'Convaincre et influencer positivement ses interlocuteurs.', icon: 'Zap', category: 'communication', difficulty: 2, weight: 1.1, sortOrder: 10 },

    // Gestion du stress
    { code: 'str-01', title: 'Résilience', description: 'Rebondir après un échec et maintenir sa motivation.', icon: 'Heart', category: 'stress', difficulty: 2, weight: 1.3, sortOrder: 11 },
    { code: 'str-02', title: 'Gestion de la pression', description: 'Maintenir ses performances sous pression temporelle ou financière.', icon: 'Gauge', category: 'stress', difficulty: 2, weight: 1.2, sortOrder: 12 },
    { code: 'str-03', title: 'Équilibre pro/perso', description: 'Préserver son bien-être tout en menant un projet ambitieux.', icon: 'Scale', category: 'stress', difficulty: 1, weight: 1.0, sortOrder: 13 },
    { code: 'str-04', title: 'Sérendipité', description: 'Transformer les imprévus en opportunités.', icon: 'Sparkles', category: 'stress', difficulty: 3, weight: 1.1, sortOrder: 14 },
    { code: 'str-05', title: 'Gestion émotionnelle', description: 'Canaliser ses émotions pour rester lucide dans les moments difficiles.', icon: 'Brain', category: 'stress', difficulty: 2, weight: 1.0, sortOrder: 15 },

    // Résolution de problèmes
    { code: 'res-01', title: 'Analyse critique', description: 'Décomposer un problème complexe en parties traitables.', icon: 'Search', category: 'resolution', difficulty: 2, weight: 1.2, sortOrder: 16 },
    { code: 'res-02', title: 'Pensée latérale', description: 'Trouver des solutions originales en sortant des sentiers battus.', icon: 'Lightbulb', category: 'resolution', difficulty: 3, weight: 1.3, sortOrder: 17 },
    { code: 'res-03', title: 'Prise de décision data-driven', description: 'Baser ses décisions sur des données concrètes et mesurables.', icon: 'BarChart3', category: 'resolution', difficulty: 2, weight: 1.1, sortOrder: 18 },
    { code: 'res-04', title: 'Planification d\'urgence', description: 'Élaborer des plans B et C en cas de pépin.', icon: 'Map', category: 'resolution', difficulty: 2, weight: 1.0, sortOrder: 19 },
    { code: 'res-05', title: 'Anticipation des risques', description: 'Identifier et prévenir les risques avant qu\'ils ne surviennent.', icon: 'AlertTriangle', category: 'resolution', difficulty: 3, weight: 1.2, sortOrder: 20 },

    // Créativité
    { code: 'cre-01', title: 'Idéation', description: 'Générer un grand nombre d\'idées sans filtre initial.', icon: 'Palette', category: 'creativity', difficulty: 1, weight: 1.1, sortOrder: 21 },
    { code: 'cre-02', title: 'Innovation produit', description: 'Concevoir des offres qui se démarquent de la concurrence.', icon: 'Package', category: 'creativity', difficulty: 3, weight: 1.3, sortOrder: 22 },
    { code: 'cre-03', title: 'Storytelling', description: 'Raconter une histoire captivante autour de son projet.', icon: 'BookOpen', category: 'creativity', difficulty: 2, weight: 1.0, sortOrder: 23 },
    { code: 'cre-04', title: 'Design thinking', description: 'Placer l\'utilisateur au centre de sa démarche créative.', icon: 'Fingerprint', category: 'creativity', difficulty: 2, weight: 1.2, sortOrder: 24 },
    { code: 'cre-05', title: 'Expérimentation', description: 'Tester et itérer rapidement sur de nouvelles idées.', icon: 'FlaskConical', category: 'creativity', difficulty: 1, weight: 1.0, sortOrder: 25 },

    // Adaptabilité
    { code: 'ada-01', title: 'Agilité', description: 'S\'adapter rapidement aux changements de marché ou de contexte.', icon: 'Windy', category: 'adaptability', difficulty: 2, weight: 1.2, sortOrder: 26 },
    { code: 'ada-02', title: 'Apprentissage continu', description: 'Acquérir de nouvelles compétences en permanence.', icon: 'GraduationCap', category: 'adaptability', difficulty: 1, weight: 1.0, sortOrder: 27 },
    { code: 'ada-03', title: 'Pivot stratégique', description: 'Changer de direction quand le marché l\'exige sans perdre de vue sa vision.', icon: 'RefreshCw', category: 'adaptability', difficulty: 3, weight: 1.4, sortOrder: 28 },
    { code: 'ada-04', title: 'Veille technologique', description: 'Rester informé des évolutions technologiques de son secteur.', icon: 'Radio', category: 'adaptability', difficulty: 2, weight: 0.9, sortOrder: 29 },
    { code: 'ada-05', title: 'Multitâche', description: 'Gérer efficacement plusieurs projets ou tâches en parallèle.', icon: 'Layers', category: 'adaptability', difficulty: 1, weight: 0.8, sortOrder: 30 },
  ]

  const createdCards: Record<string, any> = {}
  for (const card of swipeCardsData) {
    const created = await seedIfMissing(db.swipeCard, { code: card.code }, card)
    createdCards[card.code] = created
  }
  console.log(`  ✓ ${swipeCardsData.length} SwipeCards`)

  // ─────────────────────────────────────────────
  // 2. SWIPE QUESTIONS (must exist before SwipeAnswer)
  // ─────────────────────────────────────────────

  const swipeQuestionsData = [
    { code: 'ldr-q01', question: 'Lors d\'un désaccord avec votre équipe, comment réagissez-vous ?', category: 'leadership', type: 'scenario', options: ['Je impose ma décision', 'Je cherche un compromis', 'Je laisse l\'équipe décider', 'Je reporte la décision'], helpText: 'Évaluez votre style de leadership face aux conflits.', scoring: { a: 4, b: 5, c: 3, d: 1 }, difficulty: 2, sortOrder: 1 },
    { code: 'ldr-q02', question: 'Avez-vous déjà dirigé une équipe ou un projet de A à Z ?', category: 'leadership', type: 'scale', helpText: 'Échelle de 1 (jamais) à 5 (plusieurs fois)', scoring: { min: 1, max: 5 }, difficulty: 1, sortOrder: 2 },
    { code: 'com-q01', question: 'Comment préparez-vous une présentation importante ?', category: 'communication', type: 'choice', options: ['Je improvise', 'Je note quelques idées', 'Je prépare un plan détaillé', 'Je répète plusieurs fois avec support visuel'], helpText: 'Évaluez votre méthode de préparation.', scoring: { a: 1, b: 3, c: 4, d: 5 }, difficulty: 2, sortOrder: 3 },
    { code: 'com-q02', question: 'Quelle est votre plus grande force en communication ?', category: 'communication', type: 'open', helpText: 'Décrivez brièvement votre principal atout.', scoring: { keywordBonus: ['clarté', 'conviction', 'écoute', 'persuasion', 'négociation'] }, difficulty: 1, sortOrder: 4 },
    { code: 'str-q01', question: 'Comment gérez-vous un imprévu majeur (ex: fournisseur défaillant) ?', category: 'stress', type: 'scenario', options: ['Panique et cherche de l\'aide immédiatement', 'Analyse la situation et cherche des alternatives', 'Mise en pause et revient plus tard', 'Contourne le problème sans en informer l\'équipe'], helpText: 'Évaluez votre résilience face à l\'imprévu.', scoring: { a: 2, b: 5, c: 3, d: 1 }, difficulty: 2, sortOrder: 5 },
    { code: 'str-q02', question: 'Quels sont vos moyens pour gérer le stress au quotidien ?', category: 'stress', type: 'choice', options: ['Sport ou activité physique', 'Méditation ou relaxation', 'Discussion avec proches', 'Je ne gère pas vraiment'], helpText: 'Identifiez vos stratégies d\'adaptation.', scoring: { a: 5, b: 5, c: 4, d: 1 }, difficulty: 1, sortOrder: 6 },
    { code: 'res-q01', question: 'Face à un problème financier imprévu, votre première réaction est de...', category: 'resolution', type: 'scenario', options: ['Couper dans les dépenses immédiatement', 'Analyser les chiffres et identifier les leviers', 'Demander conseil à un expert', 'Ignorer en espérant que ça s\'arrange'], helpText: 'Votre approche face aux défis financiers.', scoring: { a: 3, b: 5, c: 4, d: 1 }, difficulty: 2, sortOrder: 7 },
    { code: 'res-q02', question: 'Comment approchez-vous un problème que vous n\'avez jamais rencontré ?', category: 'resolution', type: 'ranking', options: ['Recherche documentaire', 'Entretiens avec des experts', 'Prototypage rapide', 'Analyse des données disponibles', 'Brainstorming avec l\'équipe'], helpText: 'Classez ces approches par ordre de préférence.', scoring: { weights: [4, 4, 5, 4, 3] }, difficulty: 3, sortOrder: 8 },
    { code: 'cre-q01', question: 'Comment nourrissez-vous votre créativité ?', category: 'creativity', type: 'open', helpText: 'Partagez vos sources d\'inspiration.', scoring: { keywordBonus: ['lecture', 'voyage', 'observation', 'réseau', 'art', 'nature', 'expérimentation'] }, difficulty: 1, sortOrder: 9 },
    { code: 'cre-q02', question: 'Si vous deviez innover dans votre secteur avec un budget de 0€, que feriez-vous ?', category: 'creativity', type: 'open', helpText: 'Décrivez votre idée la plus créative.', scoring: { keywordBonus: ['partenariat', 'réseau', 'digital', 'communauté', 'recyclage', 'collaboration'] }, difficulty: 3, sortOrder: 10 },
    { code: 'ada-q01', question: 'Comment réagissez-vous quand une technologie nouvelle bouleverse votre secteur ?', category: 'adaptability', type: 'scale', helpText: 'De 1 (résistance) à 5 (enthousiasme immédiat)', scoring: { min: 1, max: 5 }, difficulty: 2, sortOrder: 11 },
    { code: 'ada-q02', question: 'Avez-vous déjà changé radicalement de projet ou de direction professionnelle ?', category: 'adaptability', type: 'scale', helpText: 'De 1 (jamais) à 5 (plusieurs fois avec succès)', scoring: { min: 1, max: 5 }, difficulty: 1, sortOrder: 12 },
    { code: 'ldr-q03', question: 'Comment motivez-vous vos collaborateurs en période difficile ?', category: 'leadership', type: 'choice', options: ['Je fixes des objectifs clairs et ambitieux', 'Je suis à l\'écoute et je rassure', 'J\'augmente les incitations financières', 'Je délègue et je fais confiance'], helpText: 'Votre style de motivation.', scoring: { a: 4, b: 5, c: 3, d: 3 }, difficulty: 2, sortOrder: 13 },
    { code: 'com-q03', question: 'Quel est votre plus grand défi en communication interpersonnelle ?', category: 'communication', type: 'open', helpText: 'Soyez honnête sur vos axes d\'amélioration.', scoring: { keywordBonus: ['assertivité', 'diplomatie', 'patience', 'confiance'] }, difficulty: 2, sortOrder: 14 },
    { code: 'res-q03', question: 'Combien de plans de secours avez-vous généralement pour un projet important ?', category: 'resolution', type: 'scale', helpText: 'De 1 (aucun) à 5 (toujours plan A, B, C, D, E)', scoring: { min: 1, max: 5 }, difficulty: 1, sortOrder: 15 },
    { code: 'ada-q03', question: 'Êtes-vous à l\'aise avec l\'incertitude et le changement de plan ?', category: 'adaptability', type: 'scenario', options: ['Pas du tout, j\'ai besoin de stabilité', 'Un peu, je m\'adapte lentement', 'Oui, je sais rebondir', 'Je prospère dans l\'incertitude'], helpText: 'Votre confort face au changement.', scoring: { a: 1, b: 2, c: 4, d: 5 }, difficulty: 2, sortOrder: 16 },
    { code: 'cre-q03', question: 'Comment testez-vous vos idées avant de les lancer ?', category: 'creativity', type: 'ranking', options: ['Prototype/MVP', 'Sondage clients', 'Analyse marché', 'Avis de proches', 'Test en conditions réelles'], helpText: 'Classez par ordre d\'utilisation.', scoring: { weights: [5, 4, 3, 2, 4] }, difficulty: 2, sortOrder: 17 },
    { code: 'str-q03', question: 'Quelle est votre plus grande peur en tant que futur entrepreneur ?', category: 'stress', type: 'choice', options: ['L\'échec financier', 'Le jugement des autres', 'Le manque de temps libre', 'L\'incertitude du futur'], helpText: 'Identifiez vos anxiétés principales.', scoring: { a: 3, b: 2, c: 3, d: 4 }, difficulty: 1, sortOrder: 18 },
    { code: 'ldr-q04', question: 'Quelle est votre expérience en gestion de budget d\'équipe ou de projet ?', category: 'leadership', type: 'scale', helpText: 'De 1 (aucune) à 5 (expérience significative)', scoring: { min: 1, max: 5 }, difficulty: 2, sortOrder: 19 },
    { code: 'res-q04', question: 'Comment hiérarchisez-vous les problèmes à résoudre ?', category: 'resolution', type: 'choice', options: ['Par urgence', 'Par impact', 'Par facilité', 'Par ordre d\'apparition'], helpText: 'Votre méthode de priorisation.', scoring: { a: 3, b: 5, c: 2, d: 1 }, difficulty: 2, sortOrder: 20 },
  ]

  const createdQuestions: Record<string, any> = {}
  for (const q of swipeQuestionsData) {
    const created = await seedIfMissing(db.swipeQuestion, { code: q.code }, q)
    createdQuestions[q.code] = created
  }
  console.log(`  ✓ ${swipeQuestionsData.length} SwipeQuestions`)

  // ─────────────────────────────────────────────
  // 3. SWIPE GAME RESULTS (30-40 results for beneficiary)
  // ─────────────────────────────────────────────

  const swipeResultsData = [
    // Leadership cards
    { cardCode: 'ldr-01', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'ldr-02', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'ldr-03', kept: true, superPepite: true, confidence: 5 },
    { cardCode: 'ldr-04', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'ldr-05', kept: true, superPepite: false, confidence: 4 },

    // Communication cards
    { cardCode: 'com-01', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'com-02', kept: true, superPepite: true, confidence: 5 },
    { cardCode: 'com-03', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'com-04', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'com-05', kept: true, superPepite: false, confidence: 3 },

    // Stress cards
    { cardCode: 'str-01', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'str-02', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'str-03', kept: false, superPepite: false, confidence: 2 },
    { cardCode: 'str-04', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'str-05', kept: true, superPepite: false, confidence: 3 },

    // Resolution cards
    { cardCode: 'res-01', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'res-02', kept: true, superPepite: true, confidence: 5 },
    { cardCode: 'res-03', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'res-04', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'res-05', kept: true, superPepite: false, confidence: 4 },

    // Creativity cards
    { cardCode: 'cre-01', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'cre-02', kept: true, superPepite: true, confidence: 5 },
    { cardCode: 'cre-03', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'cre-04', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'cre-05', kept: true, superPepite: false, confidence: 3 },

    // Adaptability cards
    { cardCode: 'ada-01', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'ada-02', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'ada-03', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'ada-04', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'ada-05', kept: false, superPepite: false, confidence: 2 },

    // Extra cards for variety (6 more)
    { cardCode: 'ldr-02', kept: true, superPepite: false, confidence: 4 },  // duplicate → catch will skip
    { cardCode: 'com-04', kept: true, superPepite: false, confidence: 5 },
    { cardCode: 'res-02', kept: true, superPepite: false, confidence: 4 },
    { cardCode: 'cre-05', kept: true, superPepite: false, confidence: 3 },
    { cardCode: 'ada-01', kept: true, superPepite: false, confidence: 5 },
    { cardCode: 'str-02', kept: true, superPepite: false, confidence: 4 },
  ]

  let swipeResultCount = 0
  for (const sr of swipeResultsData) {
    const card = createdCards[sr.cardCode]
    if (!card) continue
    await db.swipeGameResult.create({
      data: {
        userId: beneficiaryUser.id,
        cardId: card.id,
        cardCode: sr.cardCode,
        cardTitle: card.title,
        kept: sr.kept,
        superPepite: sr.superPepite,
        confidence: sr.confidence,
        swipedAt: daysAgo(30 + Math.floor(Math.random() * 5)),
      },
    }).catch(() => {})
    swipeResultCount++
  }
  console.log(`  ✓ ${swipeResultCount} SwipeGameResults`)

  // ─────────────────────────────────────────────
  // 4. SWIPE ANSWERS (15-20 answers for beneficiary)
  // ─────────────────────────────────────────────

  const swipeAnswersData = [
    { questionCode: 'ldr-q01', value: 'b', confidence: 4, score: 80 },
    { questionCode: 'ldr-q02', value: '3', confidence: 3, score: 60 },
    { questionCode: 'ldr-q03', value: 'b', confidence: 4, score: 85 },
    { questionCode: 'ldr-q04', value: '3', confidence: 3, score: 60 },
    { questionCode: 'com-q01', value: 'c', confidence: 4, score: 75 },
    { questionCode: 'com-q02', value: 'Ma clarté d\'expression et ma capacité à écouter activement les besoins des autres. Je suis convaincante quand je crois en mon projet.', confidence: 4, score: 78 },
    { questionCode: 'com-q03', value: 'Parfois je manque de diplomatie quand je suis passionnée par un sujet. Je travaille à être plus mesurée.', confidence: 3, score: 55 },
    { questionCode: 'str-q01', value: 'b', confidence: 4, score: 82 },
    { questionCode: 'str-q02', value: 'a', confidence: 5, score: 90 },
    { questionCode: 'str-q03', value: 'a', confidence: 4, score: 65 },
    { questionCode: 'res-q01', value: 'b', confidence: 5, score: 88 },
    { questionCode: 'res-q02', value: '[0, 1, 2, 3, 4]', confidence: 4, score: 76 },
    { questionCode: 'res-q03', value: '3', confidence: 4, score: 65 },
    { questionCode: 'res-q04', value: 'b', confidence: 4, score: 80 },
    { questionCode: 'cre-q01', value: 'L\'observation des tendances culinaires, les voyages en Italie et les échanges avec des producteurs artisanaux. La nature et les saisons inspirent mes créations.', confidence: 4, score: 82 },
    { questionCode: 'cre-q02', value: 'Je proposerais des ateliers de dégustation gratuits dans les marchés locaux pour créer le bouche-à-oreille, en partenariat avec les producteurs qui fournissent les échantillons.', confidence: 5, score: 88 },
    { questionCode: 'cre-q03', value: '[0, 1, 2, 3, 4]', confidence: 3, score: 72 },
    { questionCode: 'ada-q01', value: '4', confidence: 4, score: 75 },
    { questionCode: 'ada-q02', value: '3', confidence: 3, score: 60 },
    { questionCode: 'ada-q03', value: 'c', confidence: 4, score: 80 },
  ]

  let swipeAnswerCount = 0
  for (const sa of swipeAnswersData) {
    const question = createdQuestions[sa.questionCode]
    if (!question) continue
    await db.swipeAnswer.create({
      data: {
        userId: beneficiaryUser.id,
        questionId: question.id,
        value: sa.value,
        confidence: sa.confidence,
        score: sa.score,
        answeredAt: daysAgo(28 + Math.floor(Math.random() * 5)),
      },
    }).catch(() => {})
    swipeAnswerCount++
  }
  console.log(`  ✓ ${swipeAnswerCount} SwipeAnswers`)

  // ─────────────────────────────────────────────
  // 5. CRÉASCOPE SESSIONS (2 sessions)
  // ─────────────────────────────────────────────

  // Session 1: Completed with all 8 steps, globalScore 78
  const creascopeSession1 = await seedIfMissing(db.creascopeSession, { id: 'creascope-session-001' }, {
    id: 'creascope-session-001',
    beneficiaryId: beneficiary.id,
    counselorId: counselor.id,
    status: 'TERMINEE',
    currentStep: 'TERMINEE',
    scheduledAt: daysAgo(25),
    startedAt: daysAgo(25),
    completedAt: daysAgo(25),
    estimatedMinutes: 210,
    stepProgress: {
      ACCUEIL: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 15,
        notes: 'Accueil chaleureux, présentation du déroulé de la session. Marie est motivée et prête.',
        aiInsights: 'Profil positif : motivation forte, projet mur depuis 2 ans. Attention au stress lié à l\'incertitude financière.',
      },
      FLASH_SWIPE: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 35,
        notes: '35 cartes swipées. Super-pépites identifiées : leadership, créativité, résolution de problèmes.',
        aiInsights: 'Dimensions fortes : créativité (8.5/10), communication (8.2/10), résolution (7.8/10). Axes de travail : gestion du stress (6.0/10), gestion financière (5.5/10).',
      },
      ANALYSE_INTERMEDIAIRE: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 20,
        notes: 'Bilan intermédiaire fait. Marie reconnaît ses points faibles et est ouverte au coaching.',
        aiInsights: 'Profil entrepreneurial confirmé. Recommandation : renforcer la gestion du stress et la planification financière avant le lancement.',
      },
      QUESTIONNAIRE: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 40,
        notes: '20 questions répondues. Réponses cohérentes avec les résultats du swipe.',
        aiInsights: 'Score moyen questionnaire : 76/100. Convergence avec le swipe sur les dimensions créativité et communication. Décalage léger sur l\'adaptabilité (auto-évaluation plus élevée que le swipe).',
      },
      CHALLENGE_SCENARIO: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 30,
        notes: 'Scénario "fournisseur défaillant le jour du lancement" traité avec sang-froid.',
        aiInsights: 'Bonne réactivité face au scénario de crise. Solution proposée : réseau de backup fournisseurs + communication transparente. Score scenario : 82/100.',
      },
      BILAN_IA: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 25,
        notes: 'Bilan IA présenté et discuté. Marie valide les axes d\'amélioration.',
        aiInsights: 'CréaScope Score : 78/100. Profil entrepreneurial solide avec 3 axes de développement : 1) Gestion du stress, 2) Planification financière, 3) Anticipation des risques. Potentiel de réussite : élevé.',
      },
      PLAN_ACTION: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 30,
        notes: 'Plan d\'action co-construit avec le conseiller.',
        aiInsights: 'Plan d\'action : 5 actions prioritaires sur 30 jours, 3 objectifs à 90 jours, 1 milestone à 6 mois.',
      },
      TERMINEE: {
        startedAt: daysAgo(25).toISOString(),
        completedAt: daysAgo(25).toISOString(),
        durationMinutes: 15,
        notes: 'Session clôturée. Prochain rendez-vous dans 2 semaines pour suivi.',
        aiInsights: null,
      },
    },
    counselorNotes: 'Excellente session. Marie est engagée et proactive. Points à suivre : stress et gestion financière.',
    aiInsights: {
      globalScore: 78,
      strengths: ['Créativité', 'Communication', 'Résolution de problèmes'],
      improvements: ['Gestion du stress', 'Gestion financière', 'Planification'],
      recommendation: 'Projet viable. Accompagner sur les aspects financiers et la gestion du stress avant le lancement.',
      profile: 'Entrepreneuriale créative',
      estimatedReadiness: 72,
    },
    actionPlan: {
      immediate: [
        'Prendre RDV avec un expert-comptable pour valider le plan financier',
        'Mettre en place une routine de gestion du stress (sport 3x/semaine)',
        'Identifier 5 fournisseurs de backup',
      ],
      shortTerm: [
        'Finaliser le Business Plan section financière',
        'Suivre une formation "Gestion de trésorerie"',
        'Préparer le pitch Tremplin',
      ],
      mediumTerm: [
        'Lancer le projet avec un filet de sécurité de 6 mois',
        'Objectif : rentabilité au 18e mois',
      ],
    },
    globalScore: 78,
  })
  console.log(`  ✓ CréaScope Session 1 (completed): globalScore ${creascopeSession1.globalScore}`)

  // Session 2: In-progress at step 4 (QUESTIONNAIRE), globalScore 45
  const creascopeSession2 = await seedIfMissing(db.creascopeSession, { id: 'creascope-session-002' }, {
    id: 'creascope-session-002',
    beneficiaryId: beneficiary.id,
    counselorId: counselor.id,
    status: 'EN_COURS',
    currentStep: 'QUESTIONNAIRE',
    scheduledAt: daysAgo(2),
    startedAt: daysAgo(2),
    completedAt: null,
    estimatedMinutes: 240,
    stepProgress: {
      ACCUEIL: {
        startedAt: daysAgo(2).toISOString(),
        completedAt: daysAgo(2).toISOString(),
        durationMinutes: 20,
        notes: 'Deuxième session CréaScope. Objectif : évaluer les progrès depuis la première session.',
        aiInsights: 'Rappel des scores de la session précédente. Focus sur les axes d\'amélioration identifiés.',
      },
      FLASH_SWIPE: {
        startedAt: daysAgo(2).toISOString(),
        completedAt: daysAgo(2).toISOString(),
        durationMinutes: 30,
        notes: '30 cartes swipées. Progression notable sur la dimension stress (+0.8 points).',
        aiInsights: 'Évolution positive sur 4 dimensions. Légère baisse sur la créativité (-0.3). Score intermédiaire : 52/100.',
      },
      ANALYSE_INTERMEDIAIRE: {
        startedAt: daysAgo(2).toISOString(),
        completedAt: daysAgo(2).toISOString(),
        durationMinutes: 15,
        notes: 'Marie constate ses progrès sur la gestion du stress grâce au sport régulier.',
        aiInsights: 'Progrès confirmés. Le sport 3x/semaine a un impact mesurable sur le score de résilience.',
      },
    },
    counselorNotes: 'Session en cours. Progrès encourageants sur le stress. Continuer le questionnaire.',
    aiInsights: {
      partialScore: 45,
      completedSteps: 3,
      totalSteps: 8,
      progressPercent: 37,
      strengths: ['Créativité', 'Communication'],
      improvements: ['Gestion financière', 'Planification'],
      note: 'Session en cours — score partiel. Les résultats définitifs seront disponibles à la fin de la session.',
    },
    globalScore: 45,
  })
  console.log(`  ✓ CréaScope Session 2 (in-progress): globalScore ${creascopeSession2.globalScore}`)

  // ─────────────────────────────────────────────
  // 6. NOTIFICATIONS (10 notifications)
  // ─────────────────────────────────────────────

  const notificationsData = [
    {
      userId: beneficiaryUser.id,
      title: 'CréaScope terminé',
      content: 'Votre session CréaScope a été complétée avec un score de 78/100. Consultez le bilan détaillé.',
      type: 'SUCCESS' as const,
      link: '/creascope/creascope-session-001',
      isRead: true,
      createdAt: daysAgo(25),
    },
    {
      userId: beneficiaryUser.id,
      title: 'Nouvelle session CréaScope planifiée',
      content: 'Une nouvelle session CréaScope est planifiée pour évaluer vos progrès. Date : il y a 2 jours.',
      type: 'INFO' as const,
      link: '/creascope/creascope-session-002',
      isRead: true,
      createdAt: daysAgo(3),
    },
    {
      userId: beneficiaryUser.id,
      title: 'Action requise : Plan financier',
      content: 'Votre plan d\'action CréaScope indique un RDV avec un expert-comptable à planifier. Prenez rendez-vous dès maintenant.',
      type: 'ACTION_REQUIRED' as const,
      link: '/pipeline',
      isRead: false,
      createdAt: daysAgo(24),
    },
    {
      userId: beneficiaryUser.id,
      title: 'Tremplin : plan d\'action en attente',
      content: 'Votre Tremplin est presque complet. Finalisez le pitch (étape 6) pour soumettre votre projet.',
      type: 'WARNING' as const,
      link: '/tremplin',
      isRead: false,
      createdAt: daysAgo(20),
    },
    {
      userId: beneficiaryUser.id,
      title: 'Module complété : Business Plan',
      content: 'Félicitations ! Votre module Business Plan est complété avec un score de 72/100.',
      type: 'SUCCESS' as const,
      link: '/modules/business-plan',
      isRead: true,
      createdAt: daysAgo(15),
    },
    {
      userId: beneficiaryUser.id,
      title: 'Nouveau message du forum',
      content: 'Jean Dupont a répondu à la discussion "Comment trouver son premier client ?".',
      type: 'INFO' as const,
      link: '/forum/discussion-client-premier',
      isRead: false,
      createdAt: daysAgo(10),
    },
    {
      userId: beneficiaryUser.id,
      title: 'Jalon atteint : 65% du parcours',
      content: 'Vous avez atteint 65% de progression dans votre parcours créateur. Continuez sur cette lancée !',
      type: 'MILESTONE' as const,
      link: '/dashboard',
      isRead: true,
      createdAt: daysAgo(12),
    },
    {
      userId: counselorUser.id,
      title: 'Nouveau bénéficiaire assigné',
      content: 'Marie Laurent a été assignée à votre portefeuille. Prenez rendez-vous pour le premier bilan.',
      type: 'INFO' as const,
      link: '/counselor/beneficiaries',
      isRead: true,
      createdAt: daysAgo(90),
    },
    {
      userId: counselorUser.id,
      title: 'CréaScope à suivre',
      content: 'La session CréaScope de Marie Laurent (score : 78/100) nécessite un suivi dans 2 semaines.',
      type: 'ACTION_REQUIRED' as const,
      link: '/counselor/creascope',
      isRead: false,
      createdAt: daysAgo(25),
    },
    {
      userId: adminUser.id,
      title: 'Rapport hebdomadaire disponible',
      content: 'Le rapport d\'activité de la semaine est prêt. 12 bénéficiaires actifs, 3 sessions CréaScope complétées.',
      type: 'INFO' as const,
      link: '/admin/reports',
      isRead: false,
      createdAt: daysAgo(1),
    },
  ]

  for (const n of notificationsData) {
    await db.notification.create({ data: n }).catch(() => {})
  }
  console.log(`  ✓ ${notificationsData.length} Notifications`)

  // ─────────────────────────────────────────────
  // 7. FORUM DISCUSSIONS (3 categories, 4 discussions, 6 replies)
  // ─────────────────────────────────────────────

  // Discussion Categories
  const catEntrepreneuriat = await seedIfMissing(db.discussionCategory, { slug: 'entrepreneuriat' }, {
    name: 'Entrepreneuriat',
    slug: 'entrepreneuriat',
    description: 'Questions et discussions sur la création d\'entreprise, le business plan et les stratégies de lancement.',
    icon: 'Rocket',
    color: '#00838F',
    sortOrder: 1,
  })

  const catFinancement = await seedIfMissing(db.discussionCategory, { slug: 'financement' }, {
    name: 'Financement & Aides',
    slug: 'financement',
    description: 'Aides à la création, subventions, prêts d\'honneur et financements bancaires.',
    icon: 'Coins',
    color: '#2E7D32',
    sortOrder: 2,
  })

  const catJuridique = await seedIfMissing(db.discussionCategory, { slug: 'juridique' }, {
    name: 'Juridique & Administratif',
    slug: 'juridique',
    description: 'Statuts juridiques, formalités de création, obligations comptables et fiscales.',
    icon: 'FileText',
    color: '#F57F17',
    sortOrder: 3,
  })
  console.log(`  ✓ 3 DiscussionCategories`)

  // Create a second beneficiary user for forum diversity
  const secondBeneficiaryUser = await seedIfMissing(db.user, { id: 'beneficiaire-demo-002' }, {
    id: 'beneficiaire-demo-002',
    tenantId: beneficiaryUser.tenantId,
    email: 'thomas.moreau@example.fr',
    passwordHash: '$2a$12$dummyHashForSeed123456789012345678901234',
    firstName: 'Thomas',
    lastName: 'Moreau',
    role: 'BENEFICIARY',
    isActive: true,
    emailVerified: true,
    lastLoginAt: daysAgo(5),
  })

  await seedIfMissing(db.beneficiary, { userId: secondBeneficiaryUser.id }, {
    userId: secondBeneficiaryUser.id,
    organizationId: beneficiary.organizationId,
    employmentStatus: 'UNEMPLOYED',
    educationLevel: 'Bac+5',
    lastDiploma: 'Master Management',
    skills: ['Finance', 'Data analysis', 'Project management'],
    progressScore: 40,
  })

  // Discussion 1: Comment trouver son premier client ?
  const discussion1 = await seedIfMissing(db.discussion, { id: 'discussion-client-premier' }, {
    id: 'discussion-client-premier',
    authorId: beneficiaryUser.id,
    categoryId: catEntrepreneuriat.id,
    title: 'Comment trouver son premier client ?',
    content: 'Bonjour à tous !\n\nJe suis en train de préparer le lancement de mon épicerie fine "Saveurs d\'Ici" dans le 11e arrondissement de Paris. Mon concept est bien défini, mes fournisseurs sont identifiés, mais je bloque sur une question cruciale : comment trouver mes premiers clients ?\n\nJ\'ai pensé à :\n- Distribuer des flyers dans le quartier\n- Créer une page Instagram\n- Organiser une journée portes ouvertes\n\nAvez-vous des retours d\'expérience ou des conseils concrets pour les premières ventes ?\n\nMerci d\'avance pour vos retours !',
    tags: ['prospection', 'lancement', 'clients', 'marketing'],
    isPinned: true,
    isLocked: false,
    viewCount: 127,
    likesCount: 14,
    replyCount: 3,
    createdAt: daysAgo(15),
  })

  // Discussion 2: Aides à la création en IDF
  const discussion2 = await seedIfMissing(db.discussion, { id: 'discussion-aides-idf' }, {
    id: 'discussion-aides-idf',
    authorId: secondBeneficiaryUser.id,
    categoryId: catFinancement.id,
    title: 'Aides à la création en Île-de-France : le guide complet',
    content: 'Après des semaines de recherches, voici un récapitulatif des aides disponibles pour les créateurs en Île-de-France :\n\n**Aides régionales :**\n- ARCE (Allocation chômeurs créateurs) : jusqu\'à 45% du reliquat des allocations\n- ACRE : exonération partielle de charges sociales (1 an)\n- Prêt d\'honneur Initiative IDF : jusqu\'à 5 000€\n\n**Aides locales :**\n- Bourses BGE Paris : jusqu\'à 3 000€\n- Subvention mairie de Paris pour les commerces de proximité\n\n**Aides nationales :**\n- ARE maintien (si éligible Pôle Emploi)\n- NACRE : accompagnement + prêt à taux zéro\n\nN\'hésitez pas à compléter cette liste avec vos découvertes !',
    tags: ['aides', 'subventions', 'idf', 'arce', 'acre', 'financement'],
    isPinned: false,
    isLocked: false,
    viewCount: 256,
    likesCount: 32,
    replyCount: 2,
    createdAt: daysAgo(20),
  })

  // Discussion 3: SARL vs SAS
  const discussion3 = await seedIfMissing(db.discussion, { id: 'discussion-sarl-sas' }, {
    id: 'discussion-sarl-sas',
    authorId: secondBeneficiaryUser.id,
    categoryId: catJuridique.id,
    title: 'Partage d\'expérience : SARL vs SAS — mon retour après 6 mois',
    content: 'Bonjour !\n\nJ\'ai créé mon entreprise de conseil il y a 6 mois sous forme de SAS. Voici mon retour d\'expérience pour ceux qui hésitent :\n\n**Pourquoi la SAS :**\n- Flexibilité des statuts (liberté dans les clauses)\n- Possibilité d\'attirer des investisseurs facilement\n- Image plus "professionnelle" pour les grands comptes\n\n**Les inconvénients que je n\'avais pas anticipés :**\n- Charges sociales du dirigeant (~45% du brut, assimilé-salarié)\n- Comptabilité plus complexe (obligation de passage au bilan)\n- Coût de création plus élevé (400-600€ vs 150-200€ en SARL)\n\n**En résumé :**\nSi vous visez la croissance et l\'investissement → SAS\nSi vous êtes seul et voulez minimiser les charges → SARL/EURL\n\nEt vous, quel statut avez-vous choisi et pourquoi ?',
    tags: ['sarl', 'sas', 'statut', 'juridique', 'création'],
    isPinned: false,
    isLocked: false,
    viewCount: 189,
    likesCount: 27,
    replyCount: 3,
    createdAt: daysAgo(30),
  })

  // Discussion 4: Conseils pour le Tremplin
  const discussion4 = await seedIfMissing(db.discussion, { id: 'discussion-conseils-tremplin' }, {
    id: 'discussion-conseils-tremplin',
    authorId: beneficiaryUser.id,
    categoryId: catEntrepreneuriat.id,
    title: 'Conseils pour réussir le Tremplin (GO assuré ?)',
    content: 'Je prépare mon Tremplin pour le mois prochain et j\'aimerais avoir vos conseils. Mon score actuel est de 68/100 avec un GO_CONDITIONAL.\n\nLes recommandations sont :\n- Finaliser le plan de financement\n- Préparer le pitch (5-7 min)\n- Consolider le dossier ACRE/ARCE\n\nPour ceux qui ont déjà passé le Tremplin avec succès, quelles sont les clés pour obtenir un GO ?\n\nMon conseiller Jean Dupont m\'a dit que le pitch est déterminant. Comment le préparer au mieux ?',
    tags: ['tremplin', 'pitch', 'go', 'accompagnement'],
    isPinned: false,
    isLocked: false,
    viewCount: 89,
    likesCount: 8,
    replyCount: 0,
    createdAt: daysAgo(5),
  })
  console.log(`  ✓ 4 Discussions`)

  // Replies
  const repliesData = [
    // Discussion 1 replies
    {
      id: 'reply-d1-r1',
      discussionId: discussion1.id,
      authorId: counselorUser.id,
      content: 'Bonne question Marie ! Voici mes conseils concrets :\n\n1. **Ne sous-estimez pas le bouche-à-oreille** : vos 12 producteurs partenaires ont déjà leurs propres clients. Demandez-leur de mentionner votre boutique.\n\n2. **Journée portes ouvertes** : c\'est la meilleure idée. Invitez les producteurs à présenter leurs produits en personne. Les clients adorent rencontrer les artisans.\n\n3. **Réseaux sociaux** : commencez par Instagram avec des photos de produits, des recettes et des coulisses. 2-3 posts par semaine minimum.\n\n4. **Partenariats locaux** : contactez les offices de tourisme et les guides gastronomiques parisiens.\n\nBon courage pour le lancement ! 🚀',
      isEdited: false,
      likesCount: 9,
      createdAt: daysAgo(14),
    },
    {
      id: 'reply-d1-r2',
      discussionId: discussion1.id,
      authorId: secondBeneficiaryUser.id,
      content: 'Merci pour cette discussion ! De mon côté (conseil en management), j\'ai trouvé mes 3 premiers clients via LinkedIn. Pour un commerce physique, je pense que la stratégie "porte ouverte" est la plus efficace.\n\nUn conseil supplémentaire : offrez des échantillons dans la rue devant la boutique pendant la première semaine. Ça attire du monde et crée la curiosité.',
      isEdited: false,
      likesCount: 5,
      createdAt: daysAgo(13),
    },
    {
      id: 'reply-d1-r3',
      discussionId: discussion1.id,
      authorId: beneficiaryUser.id,
      content: 'Super, merci Jean et Thomas pour ces retours ! Je vais mettre en place la journée portes ouvertes et contacter les offices de tourisme cette semaine.\n\nPour les échantillons, c\'est une excellente idée. Je vais demander à mes producteurs de me fournir des lots pour ça.\n\nJe vous tiens au courant de l\'évolution !',
      isEdited: true,
      likesCount: 3,
      createdAt: daysAgo(12),
    },

    // Discussion 2 replies
    {
      id: 'reply-d2-r1',
      discussionId: discussion2.id,
      authorId: counselorUser.id,
      content: 'Excellent récapitulatif Thomas ! Je complète avec 2 aides que vous avez oublié :\n\n- **Prêt d\'honneur Bpifrance** : jusqu\'à 50 000€ pour les créateurs, sans garantie. Très utile pour le fonds de roulement initial.\n- **Aide à la reprise/création d\'entreprise (ARCE)** : si vous êtes inscrit à France Travail, pensez à demander l\'ARCE plutôt que le maintien des ARE si votre projet nécessite du capital de départ.\n\nN\'hésitez pas à consulter votre conseiller GIDEF pour un point personnalisé sur votre éligibilité !',
      isEdited: false,
      likesCount: 12,
      createdAt: daysAgo(19),
    },
    {
      id: 'reply-d2-r2',
      discussionId: discussion2.id,
      authorId: beneficiaryUser.id,
      content: 'Merci Thomas pour ce partage très utile ! Pour mon projet d\'épicerie fine, je vise l\'ACRE et le prêt d\'honneur Initiative IDF. Mon conseiller m\'a aussi parlé des subventions mairie de Paris pour les commerces de proximité — je vais creuser ce dossier.',
      isEdited: false,
      likesCount: 4,
      createdAt: daysAgo(18),
    },

    // Discussion 3 replies
    {
      id: 'reply-d3-r1',
      discussionId: discussion3.id,
      authorId: counselorUser.id,
      content: 'Très bon retour d\'expérience ! Je complète avec mes observations en tant que conseiller :\n\n- **EURL** (SARL à associé unique) : meilleure option pour commencer seul avec un statut de travailleur non-salarié (TNS), donc ~25% de charges sociales vs ~45% en SAS.\n\n- **SAS** : à privilégier dès que vous prévoyez des associés ou des levées de fonds.\n\n- **Micro-entreprise** : ne l\'oubliez pas pour tester un concept avant de créer une société.\n\nLe choix dépend vraiment du projet et de la vision à 3-5 ans. En cas de doute, prenez RDV avec votre conseiller pour simuler les deux options.',
      isEdited: false,
      likesCount: 15,
      createdAt: daysAgo(28),
    },
    {
      id: 'reply-d3-r2',
      discussionId: discussion3.id,
      authorId: beneficiaryUser.id,
      content: 'Merci Thomas ! Mon conseiller m\'a recommandé la SARL pour mon projet d\'épicerie fine, et au vu de ton retour, je pense que c\'est le bon choix pour moi. Je serai seule au début et je préfère minimiser les charges.\n\nPar contre, si le projet fonctionne bien et que j\'embauche, est-ce facile de passer de SARL à SAS ?',
      isEdited: false,
      likesCount: 6,
      createdAt: daysAgo(26),
    },
    {
      id: 'reply-d3-r3',
      discussionId: discussion3.id,
      authorId: secondBeneficiaryUser.id,
      content: 'Bonne question Marie ! Oui il est possible de transformer une SARL en SAS, mais c\'est une procédure juridique complexe qui coûte environ 500-800€ (augmentation de capital + modification des statuts). Autant bien choisir dès le départ si possible.\n\nPour ton projet d\'épicerie, la SARL me semble parfaite. Tu pourras toujours évoluer vers une SAS-U quand tu voudras ouvrir un deuxième point de vente.',
      isEdited: true,
      likesCount: 8,
      createdAt: daysAgo(25),
    },
  ]

  for (const r of repliesData) {
    await db.reply.create({ data: r }).catch(() => {})
  }
  console.log(`  ✓ ${repliesData.length} Replies`)

  // ─────────────────────────────────────────────
  // 8. CONSENT LOGS (4 consent records for RGPD)
  // ─────────────────────────────────────────────

  const consentLogsData = [
    {
      userId: beneficiaryUser.id,
      consentType: 'COOKIES' as const,
      status: 'GRANTED' as const,
      ipAddress: '192.168.1.42',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      source: 'web',
      version: '1.0',
      grantedAt: daysAgo(90),
      withdrawnAt: null,
    },
    {
      userId: beneficiaryUser.id,
      consentType: 'CGU' as const,
      status: 'GRANTED' as const,
      ipAddress: '192.168.1.42',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      source: 'web',
      version: '1.2',
      grantedAt: daysAgo(90),
      withdrawnAt: null,
    },
    {
      userId: beneficiaryUser.id,
      consentType: 'DONNEES_PERSONNELLES' as const,
      status: 'GRANTED' as const,
      ipAddress: '192.168.1.42',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      source: 'web',
      version: '1.0',
      grantedAt: daysAgo(90),
      withdrawnAt: null,
    },
    {
      userId: beneficiaryUser.id,
      consentType: 'CREASCOPE' as const,
      status: 'GRANTED' as const,
      ipAddress: '192.168.1.42',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      source: 'web',
      version: '1.0',
      grantedAt: daysAgo(25),
      withdrawnAt: null,
    },
  ]

  for (const c of consentLogsData) {
    await db.consentLog.create({ data: c }).catch(() => {})
  }
  console.log(`  ✓ ${consentLogsData.length} ConsentLogs`)

  // ── Summary ──
  console.log('\n✅ Extended seed completed successfully!')
  console.log('─────────────────────────────────')
  console.log('📊 Data created:')
  console.log(`   SwipeCards:      ${swipeCardsData.length}`)
  console.log(`   SwipeQuestions:  ${swipeQuestionsData.length}`)
  console.log(`   SwipeGameResults:${swipeResultsData.length}`)
  console.log(`   SwipeAnswers:    ${swipeAnswerCount}`)
  console.log(`   CréaScope:       2 sessions (1 completed, 1 in-progress)`)
  console.log(`   Notifications:    ${notificationsData.length}`)
  console.log(`   Forum:           3 categories, 4 discussions, ${repliesData.length} replies`)
  console.log(`   ConsentLogs:      ${consentLogsData.length}`)
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Extended seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
