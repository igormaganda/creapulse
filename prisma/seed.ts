// ============================================
// CreaPulse V2 — Seed Script
// Generates realistic demo data for PDF exports
// Run: npx tsx prisma/seed.ts
// ============================================

import { config } from 'dotenv'
config({ path: '.env.local', override: true })
config({ override: true })

import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'

const db = new PrismaClient()

// ─── Helpers ──────────────────────────────────

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
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
  console.log('🌱 CreaPulse V2 — Seeding database...')

  // ── Tenant ──
  const tenant = await seedIfMissing(db.tenant, { slug: 'echo-entreprendre' }, {
    name: 'Echo Entreprendre',
    slug: 'echo-entreprendre',
    primaryColor: '#00838F',
    plan: 'PROFESSIONAL',
    isActive: true,
  })
  console.log(`  ✓ Tenant: ${tenant.name}`)

  // ── Organization ──
  const org = await seedIfMissing(db.organization, { tenantId: tenant.id, siret: '00000000000000' }, {
    tenantId: tenant.id,
    name: 'GIDEF Île-de-France',
    siret: '00000000000000',
    type: 'GIDEF_AGENCY',
    city: 'Paris',
    postalCode: '75001',
    region: 'Île-de-France',
    email: 'contact@gidef-idf.fr',
    phone: '01 23 45 67 89',
    website: 'https://gidef-idf.fr',
  })
  console.log(`  ✓ Organization: ${org.name}`)

  // ── Admin User ──
  const adminUser = await seedIfMissing(db.user, { id: 'admin-echo-001' }, {
    id: 'admin-echo-001',
    tenantId: tenant.id,
    email: 'admin@echo-entreprendre.fr',
    passwordHash: hashSync('Admin2026!', 12),
    firstName: 'Sophie',
    lastName: 'Martin',
    role: 'ADMIN',
    isActive: true,
    emailVerified: true,
  })
  console.log(`  ✓ Admin: ${adminUser.firstName} ${adminUser.lastName}`)

  // ── Counselor User ──
  const counselorUser = await seedIfMissing(db.user, { id: 'conseiller-gidef-001' }, {
    id: 'conseiller-gidef-001',
    tenantId: tenant.id,
    email: 'dupont.jean@gidef-idf.fr',
    passwordHash: hashSync('Conseiller2026!', 12),
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'COUNSELOR',
    isActive: true,
    emailVerified: true,
  })

  const counselor = await seedIfMissing(db.counselor, { userId: counselorUser.id }, {
    userId: counselorUser.id,
    organizationId: org.id,
    name: 'Jean Dupont',
    specialities: ['Création d\'entreprise', 'Business Plan', 'Financement'],
    certifications: ['Certifié BGE', 'Coach entrepreneurial'],
    maxBeneficiaries: 30,
    isAvailable: true,
  })
  console.log(`  ✓ Counselor: ${counselorUser.firstName} ${counselorUser.lastName}`)

  // ── Beneficiary User (Main Demo) ──
  const beneficiaryUser = await seedIfMissing(db.user, { id: 'beneficiaire-demo-001' }, {
    id: 'beneficiaire-demo-001',
    tenantId: tenant.id,
    email: 'marie.curie@example.fr',
    passwordHash: hashSync('Beneficiaire2026!', 12),
    firstName: 'Marie',
    lastName: 'Laurent',
    role: 'BENEFICIARY',
    isActive: true,
    emailVerified: true,
    lastLoginAt: daysAgo(1),
  })

  const beneficiary = await seedIfMissing(db.beneficiary, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    organizationId: org.id,
    employmentStatus: 'EMPLOYED',
    educationLevel: 'Bac+3',
    lastDiploma: 'BTS Commerce',
    skills: ['Gestion', 'Vente', 'Service client', 'Marketing digital'],
    progressScore: 65,
  })
  console.log(`  ✓ Beneficiary: ${beneficiaryUser.firstName} ${beneficiaryUser.lastName}`)

  // ── Counselor Assignment ──
  await seedIfMissing(db.counselorAssignment, { counselorId: counselor.id, beneficiaryId: beneficiary.id }, {
    counselorId: counselor.id,
    beneficiaryId: beneficiary.id,
    role: 'PRIMARY',
    status: 'ACTIVE',
  })

  // ── Creator Journey ──
  const journey = await seedIfMissing(db.creatorJourney, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    currentPhase: 'STRATEGY',
    progressPercent: 65,
    projectTitle: 'Saveurs d\'Ici — Épicerie fine et produits locaux',
    projectDescription: 'Concept d\'épicerie fine spécialisée dans les produits locaux et artisanaux de la région Île-de-France, avec un espace dégustation et ateliers culinaires.',
    projectSector: 'Commerce alimentaire',
    projectStage: 'Création',
    creationMotivation: 'Passion pour la gastronomie locale et envie de valoriser les producteurs régionaux',
    targetAudience: 'Cadres parisiens 25-55 ans, sensibles à l\'origine et la qualité des produits, revenus moyens à élevés',
    valueProposition: 'Un lieu unique alliant épicerie fine, dégustation et ateliers culinaires avec des produits 100% locaux et traçables',
    estimatedRevenue: '180 000 € / an',
    estimatedInvestment: '85 000 €',
    bpStatus: 'IN_PROGRESS',
    bpScore: 72,
    bpGeneratedAt: daysAgo(15),
    tremplinStatus: 'IN_PROGRESS',
    tremplinScore: 68,
    status: 'ACTIVE',
    startedAt: daysAgo(90),
    bpSections: {
      resume: 'Saveurs d\'Ici est un concept d\'épicerie fine spécialisée dans les produits locaux et artisanaux de la région Île-de-France. Fondée par Marie Laurent, bénéficiaire GIDEF, cette entreprise vise à combler un vide dans l\'offre de produits locaux traçables en zone urbaine parisienne. Le concept repose sur trois piliers : une sélection rigoureuse de produits auprès de producteurs locaux, un espace dégustation pour découvrir les saveurs, et des ateliers culinaires pour apprendre à cuisiner ces produits.',
      'equipe': 'Marie Laurent, fondatrice — 10 ans d\'expérience en commerce et gestion de points de vente. Formation BTS Commerce, spécialisation en négociation commerciale. Parcours chez Carrefour et Monoprix. Compétences clés : gestion de stocks, merchandising, service client, animation d\'ateliers. Recrutement prévu : un responsable ateliers culinaires (profil chef ou passionné de cuisine).',
      'etude-marche': 'Le marché des produits bio et locaux en France est estimé à 13,5 milliards d\'euros, avec une croissance annuelle de +8%. En Île-de-France, le marché représente 2,1 milliards d\'euros. 67% des Français déclarent vouloir consommer plus local. La cible principale est constituée de cadres urbains 25-55 ans, sensibles à la qualité et à l\'origine des produits, avec des revenus moyens à élevés.',
      segmentation: 'Segment principal : Cadres parisiens 25-55 ans, couples et familles, sensibles à l\'alimentation saine et locale. Revenus annuels > 40 000 €. Fréquentent les marchés bio, adhérents à des AMAP. Segment secondaire : Entreprises (cadeaux d\'entreprise, événements). Segment émergent : Touristes gastronomes visiting Paris.',
      concurrence: 'Principaux concurrents : Biocoop (leader bio, large gamme mais peu local), La Ruche qui dit Oui (circuit court en ligne mais pas d\'expérience physique), Picard (surgelé premium). Différenciation : Saveurs d\'Ici combine épicerie fine, dégustation et ateliers — une expérience unique que les concurrents n\'offrent pas.',
      'strategie-marketing': 'Stratégie marketing basée sur 3 leviers : 1) Réseaux sociaux (Instagram, Facebook) pour communiquer sur l\'origine des produits et les ateliers. 2) Partenariats avec offices de tourisme et guides gastronomiques. 3) Fidélisation via programme de points et newsletter recettes saisonnières. Budget marketing : 800€/mois.',
      'plan-commercial': 'Plan commercial structuré en 3 phases : Phase 1 (mois 1-6) — Lancement avec 15 producteurs et ouverture du point de vente. Phase 2 (mois 7-12) — Développement des ateliers et partenariats B2B. Phase 3 (mois 13-24) — Expansion de la gamme et événements privés. Objectif CA : 120k€ (A1), 180k€ (A2), 220k€ (A3).',
      financement: [
        { id: 'f1', source: 'Apport personnel', montant: 25000 },
        { id: 'f2', source: 'Emprunt bancaire', montant: 40000 },
        { id: 'f3', source: 'ACRE + Aides', montant: 20000 },
      ],
      'compte-resultat': {
        year1: { ca: 120000, charges: 155000, resultat: -35000 },
        year2: { ca: 180000, charges: 165000, resultat: 15000 },
        year3: { ca: 220000, charges: 180000, resultat: 40000 },
      },
      seuil_rentabilite: 'Le seuil de rentabilité mensuel est estimé à 18 500 €. Avec un CA mensuel visé de 15 000€ en année 1, le projet atteint la rentabilité mensuelle en milieu d\'année 2. Le point mort cumulé est atteint au 18e mois.',
      investissements: [
        { id: 'i1', name: 'Aménagement local', amount: 25000 },
        { id: 'i2', name: 'Matériel et équipement', amount: 20000 },
        { id: 'i3', name: 'Stock initial', amount: 15000 },
        { id: 'i4', name: 'Communication lancement', amount: 5000 },
        { id: 'i5', name: 'Fonds de roulement', amount: 20000 },
      ],
      swot: {
        strengths: 'Concept unique et différenciant, Expérience commerciale solide, Réseau producteurs en constitution, Localisation stratégique',
        weaknesses: 'Pas d\'expérience en restauration, Besoin en fonds de roulement important, Trésorerie tende les 18 premiers mois',
        opportunities: 'Marché en croissance +8%/an, Demande forte de local, Subventions et aides à la création disponibles',
        threats: 'Concurrence des grandes surfaces bio, Pression sur les marges, Risque d\'approvisionnement avec producteurs locaux',
      },
      'statut-juridique': 'sarl',
      calendrier: [
        { id: 'c1', title: 'Recherche local', date: 'Mois 1-2', completed: true },
        { id: 'c2', title: 'Bail et aménagement', date: 'Mois 3-4', completed: true },
        { id: 'c3', title: 'Sélection producteurs', date: 'Mois 3-5', completed: true },
        { id: 'c4', title: 'Lancement', date: 'Mois 5', completed: false },
        { id: 'c5', title: 'Développement ateliers', date: 'Mois 7-12', completed: false },
        { id: 'c6', title: 'Rentabilité', date: 'Mois 18', completed: false },
      ],
    },
  })
  console.log(`  ✓ CreatorJourney: ${journey.projectTitle}`)

  // ── Module Results ──
  const moduleResultsData = [
    { moduleCode: 'profil-createur', score: 85, maxScore: 100, completedAt: daysAgo(85), feedback: 'Excellente auto-évaluation' },
    { moduleCode: 'riasec', score: 78, maxScore: 100, completedAt: daysAgo(80), feedback: 'Profil Social-Entrepreneur' },
    { moduleCode: 'kiviat', score: 72, maxScore: 100, completedAt: daysAgo(75), feedback: 'Compétences commerciales fortes' },
    { moduleCode: 'mon-projet', score: 90, maxScore: 100, completedAt: daysAgo(70), feedback: 'Projet bien structuré' },
    { moduleCode: 'vision', score: 82, maxScore: 100, completedAt: daysAgo(65), feedback: 'Vision claire et réaliste' },
    { moduleCode: 'marche', score: 75, maxScore: 100, completedAt: daysAgo(55), feedback: 'Segmentation client pertinente' },
    { moduleCode: 'juridique', score: 68, maxScore: 100, completedAt: daysAgo(45), feedback: 'SARL recommandée' },
    { moduleCode: 'creasim', score: 70, maxScore: 100, completedAt: daysAgo(35), feedback: 'Rentabilité attendue à 18 mois' },
    { moduleCode: 'bmc', score: 65, maxScore: 100, completedAt: daysAgo(30), feedback: 'BMC complet' },
    { moduleCode: 'business-plan', score: 72, maxScore: 100, completedAt: daysAgo(15), feedback: 'BP solide, sections financières à approfondir' },
    { moduleCode: 'bilan-ia', score: 78, maxScore: 100, completedAt: daysAgo(12), feedback: 'Bilan positif, 3 axes d\'amélioration identifiés' },
  ]

  for (const mr of moduleResultsData) {
    await seedIfMissing(db.moduleResult, { userId: beneficiaryUser.id, moduleCode: mr.moduleCode }, {
      userId: beneficiaryUser.id,
      moduleCode: mr.moduleCode,
      score: mr.score,
      maxScore: mr.maxScore,
      completedAt: mr.completedAt,
      feedback: mr.feedback,
      answers: { completed: true },
    })
  }
  console.log(`  ✓ ${moduleResultsData.length} ModuleResults`)

  // ── Kiviat Results (8 dimensions) ──
  const kiviatData = [
    { category: 'Leadership', score: 7.5 },
    { category: 'Communication', score: 8.2 },
    { category: 'Gestion du stress', score: 6.0 },
    { category: 'Résolution de problèmes', score: 7.8 },
    { category: 'Créativité', score: 8.5 },
    { category: 'Adaptabilité', score: 7.0 },
    { category: 'Gestion financière', score: 5.5 },
    { category: 'Planification', score: 6.8 },
  ]

  for (const k of kiviatData) {
    await seedIfMissing(db.kiviatResult, { userId: beneficiaryUser.id, category: k.category }, {
      userId: beneficiaryUser.id,
      category: k.category,
      score: k.score,
      maxScore: 10,
    })
  }
  console.log(`  ✓ ${kiviatData.length} KiviatResults`)

  // ── RIASEC Results ──
  const riasecData = [
    { profileType: 'S', score: 8.5, isDominant: true },
    { profileType: 'E', score: 7.8, isDominant: true },
    { profileType: 'A', score: 7.2, isDominant: false },
    { profileType: 'I', score: 6.5, isDominant: false },
    { profileType: 'R', score: 5.0, isDominant: false },
    { profileType: 'C', score: 4.8, isDominant: false },
  ]

  for (const r of riasecData) {
    await seedIfMissing(db.riasecResult, { userId: beneficiaryUser.id, profileType: r.profileType }, {
      userId: beneficiaryUser.id,
      profileType: r.profileType,
      score: r.score,
      isDominant: r.isDominant,
    })
  }
  console.log(`  ✓ ${riasecData.length} RiasecResults`)

  // ── Motivation Assessment ──
  await seedIfMissing(db.motivationAssessment, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    scores: { independance: 9, reussite: 8, passion: 9, impact: 7, securite: 6 },
    summary: 'Profil entrepreneurial fortement motivé par l\'indépendance et la passion.',
  })
  console.log('  ✓ MotivationAssessment')

  // ── CreaSim Simulation ──
  await seedIfMissing(db.creaSimSimulation, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    monthlyRevenue: 15000,
    fixedCharges: [
      { name: 'Loyer local', amount: 3500 },
      { name: 'Salaires', amount: 4200 },
      { name: 'Assurances', amount: 450 },
      { name: 'Énergie', amount: 350 },
      { name: 'Comptabilité', amount: 600 },
      { name: 'Marketing', amount: 800 },
      { name: 'Frais bancaires', amount: 150 },
      { name: 'Licences', amount: 100 },
    ],
    variableChargesRate: 45,
    averageSellingPrice: 28,
    unitCost: 12.5,
    targetMarginRate: 55,
    initialInvestment: 85000,
    fixedChargesTotal: 10150,
    variableChargesAmount: 6750,
    totalCharges: 16900,
    grossMarginAmount: 8250,
    grossMarginRate: 55,
    netMarginAmount: -1900,
    netMarginRate: -12.7,
    monthlyBreakeven: 18500,
    breakevenMonths: 18,
    year1Revenue: 120000,
    year1Expenses: 155000,
    year2Revenue: 180000,
    year2Expenses: 165000,
    year3Revenue: 220000,
    year3Expenses: 180000,
    profitability1Y: -35,
    profitability2Y: 9.1,
    profitability3Y: 22.2,
    aiAnalysis: 'La simulation montre un besoin en fonds de roulement initial important. La rentabilité est attendue à partir du 18e mois. Recommandation : prévoir 6 mois de trésorerie de sécurité.',
  })
  console.log('  ✓ CreaSimSimulation')

  // ── Financial Forecast ──
  await seedIfMissing(db.financialForecast, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    sector: 'Commerce alimentaire',
    year1Revenue: 120000,
    year2Revenue: 180000,
    year3Revenue: 220000,
    year1Expenses: 155000,
    year2Expenses: 165000,
    year3Expenses: 180000,
    breakevenMonth: 18,
    initialInvestment: 85000,
    aiSynthesis: 'Passage à la rentabilité dès la 2ème année. Seuil de rentabilité mensuel : 18 500 €.',
  })
  console.log('  ✓ FinancialForecast')

  // ── Juridique Analysis ──
  await seedIfMissing(db.juridiqueAnalysis, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    recommendedStatus: 'SARL',
    fiscalRegime: 'Réel simplifié (IS)',
    legalStructure: 'SARL au capital de 8 000 €',
    socialCharges: { gérant: 'Assimilé-salarié', charges: '~45% du brut' },
  })
  console.log('  ✓ JuridiqueAnalysis')

  // ── Market Analysis ──
  await seedIfMissing(db.marketAnalysis, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    sector: 'Commerce alimentaire - Épicerie fine',
    marketSize: '13,5 Mds € (croissance +8%/an)',
    targetAudience: '25-55 ans, CSP+, urbains',
    trends: [{ label: 'Local', description: '+15%/an' }, { label: 'Circuit court', description: 'En hausse' }],
    competitors: [{ name: 'Biocoop', position: 'Leader bio' }, { name: 'La Ruche', position: 'Circuit court' }],
    opportunities: 'Zone parisienne non couverte',
    threats: 'Concurrence grandes surfaces bio',
    aiSynthesis: 'Marché porteur. Positionnement différenciant.',
  })
  console.log('  ✓ MarketAnalysis')

  // ── Tremplin ──
  await seedIfMissing(db.tremplin, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    currentStep: 6,
    responses: {
      step0: { completed: true, notes: 'Motivation forte, projet mur depuis 2 ans' },
      step1: { completed: true, notes: 'Adéquation marché confirmée' },
      step2: { completed: true, notes: 'Rentabilité attendue à 18 mois' },
      step3: { completed: true, notes: 'Compétences en vente et gestion' },
      step4: { completed: true, notes: 'Réseau producteurs en constitution' },
      step5: { completed: true, notes: 'Plan d\'action détaillé sur 12 mois' },
      step6: { completed: false, notes: 'Pitch en préparation' },
    },
    isCompleted: false,
    score: 68,
    decision: 'GO_CONDITIONAL',
    summary: 'Projet viable avec conditions : finaliser le financement et le pitch.',
    recommendations: [
      'Finaliser le plan de financement',
      'Préparer le pitch (5-7 min)',
      'Consolider le dossier ACRE/ARCE',
      'Finaliser accords producteurs',
    ],
  })
  console.log('  ✓ Tremplin')

  // ── Business Model Canvas ──
  await seedIfMissing(db.businessModelCanvas, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    partenairesCles: '- Producteurs locaux\n- Artisans boulangers\n- Réseau GIDEF',
    activitesCles: '- Sélection produits\n- Gestion stocks\n- Ateliers culinaires\n- Marketing',
    ressourcesCles: '- Local 80m² 11e arrondissement\n- 25+ producteurs\n- Système caisse',
    propositionValeur: 'Produits 100% locaux et traçables, dans un lieu avec ateliers culinaires.',
    relationsClients: '- Conseil personnalisé\n- Fidélité\n- Ateliers\n- Newsletter',
    canaux: '- Boutique physique\n- Réseaux sociaux\n- Site web\n- Partenariats',
    segmentsClients: '- Cadres urbains 25-55\n- Familles\n- Entreprises',
    structureCouts: '- Loyer 42k€/an\n- Personnel 50k€/an\n- Approvisionnement 40% CA',
    sourcesRevenus: '- Vente détail (70%)\n- Ateliers (15%)\n- B2B (10%)\n- Événements (5%)',
    status: 'GENERATED',
    generatedFromBp: true,
    generatedAt: daysAgo(30),
  })
  console.log('  ✓ BusinessModelCanvas')

  // ── ZeroDraft (for Pitch Deck) ──
  await seedIfMissing(db.zeroDraft, { userId: beneficiaryUser.id }, {
    userId: beneficiaryUser.id,
    projectTitle: 'Saveurs d\'Ici — Épicerie fine et produits locaux',
    content: JSON.stringify({
      slides: [
        { id: 'probleme', content: 'Les consommateurs veulent du local et traçable. Difficulté à trouver un point de vente unique. Circuits courts fragmentés.' },
        { id: 'solution', content: 'Épicerie fine produits locaux + espace dégustation + ateliers culinaires. Traçabilité garantie.' },
        { id: 'marche', content: 'Marché bio et local : 13,5 Mds € (+8%/an). 67% des Français veulent consommer local.' },
        { id: 'businessModel', content: 'Revenus : Vente 70%, Ateliers 15%, B2B 10%, Événements 5%. CA visé 180k€ A2. Marge brute 55%.' },
        { id: 'traction', content: '25 producteurs contactés, 12 accords signés, 500+ abonnés Instagram, emplacement identifié.' },
        { id: 'equipe', content: 'Marie Laurent : Fondatrice, 10 ans commerce. Jean Dupont : Conseiller GIDEF.' },
        { id: 'financier', content: 'Investissement 85k€. Apport 25k€ + Emprunt 40k€ + Aides 20k€. Rentabilité 18 mois.' },
        { id: 'ask', content: '85k€ financement + 10 producteurs supplémentaires + 12 mois accompagnement GIDEF.' },
      ],
    }),
    wordCount: 420,
    status: 'READY',
  })
  console.log('  ✓ ZeroDraft')

  // ── Interview Sessions ──
  const interview1 = await seedIfMissing(db.interviewSession, { id: 'interview-001' }, {
    id: 'interview-001',
    counselorId: counselor.id,
    beneficiaryId: beneficiary.id,
    type: 'bilan',
    phase: 'ACCUEIL',
    scheduledAt: daysAgo(80),
    startedAt: daysAgo(80),
    completedAt: daysAgo(80),
    status: 'completed',
    synthesis: 'Premier bilan positif. Projet mûr, expérience solide.',
    recommendations: ['Compléter RIASEC et Kiviat', 'Rédiger Mon Projet', 'Prendre RDV expert-comptable'],
  })

  const interview2 = await seedIfMissing(db.interviewSession, { id: 'interview-002' }, {
    id: 'interview-002',
    counselorId: counselor.id,
    beneficiaryId: beneficiary.id,
    type: 'suivi',
    phase: 'APPROFONDISSEMENT',
    scheduledAt: daysAgo(40),
    startedAt: daysAgo(40),
    completedAt: daysAgo(40),
    status: 'completed',
    synthesis: 'Projet structuré. BMC complet, CreaSim rentabilité 18 mois. BP et Tremplin à finaliser.',
    recommendations: ['Finaliser BP financier', 'Lancer démarches financement', 'Préparer Tremplin'],
  })
  console.log('  ✓ 2 InterviewSessions')

  // ── Interview Notes ──
  const interviewNotes = [
    { interviewId: interview1.id, phase: 'ACCUEIL', category: 'observation', content: 'Motivation forte et projet mur depuis 2 ans.', isKeyPoint: true },
    { interviewId: interview1.id, phase: 'ACCUEIL', category: 'observation', content: 'Bonne connaissance du secteur local.', isKeyPoint: true },
    { interviewId: interview1.id, phase: 'ACCUEIL', category: 'recommandation', content: 'Compléter les tests profil (RIASEC, Kiviat).', isKeyPoint: true },
    { interviewId: interview2.id, phase: 'SUIVI', category: 'observation', content: 'CreaSim bien paramétré, hypothèses réalistes.', isKeyPoint: true },
    { interviewId: interview2.id, phase: 'SUIVI', category: 'observation', content: 'BMC complet et cohérent, 9/9 blocs.', isKeyPoint: true },
    { interviewId: interview2.id, phase: 'SUIVI', category: 'recommandation', content: 'Finaliser le dossier de financement.', isKeyPoint: true },
    { interviewId: interview2.id, phase: 'SUIVI', category: 'recommandation', content: 'Préparer le pitch Tremplin.', isKeyPoint: true },
    { interviewId: interview2.id, phase: 'SUIVI', category: 'observation', content: 'Engagement et régularité dans le parcours.', isKeyPoint: true },
  ]

  for (const note of interviewNotes) {
    await db.interviewNote.create({ data: note }).catch(() => {})
  }
  console.log(`  ✓ ${interviewNotes.length} InterviewNotes`)

  // ── App Modules ──
  const appModules = [
    { code: 'profil-createur', name: 'Profil Créateur', category: 'DIAGNOSTIC', phase: 'DISCOVERY', sortOrder: 1 },
    { code: 'riasec', name: 'Test RIASEC', category: 'DIAGNOSTIC', phase: 'DISCOVERY', sortOrder: 2 },
    { code: 'kiviat', name: 'Test Kiviat', category: 'DIAGNOSTIC', phase: 'PROFILING', sortOrder: 3 },
    { code: 'mon-projet', name: 'Mon Projet', category: 'MODELING', phase: 'PROFILING', sortOrder: 4 },
    { code: 'vision', name: 'Vision', category: 'MODELING', phase: 'STRATEGY', sortOrder: 5 },
    { code: 'marche', name: 'Analyse de Marché', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 6 },
    { code: 'juridique', name: 'Analyse Juridique', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 7 },
    { code: 'creasim', name: 'CreaSim', category: 'STRATEGY', phase: 'STRATEGY', sortOrder: 8 },
    { code: 'bmc', name: 'Business Model Canvas', category: 'MODELING', phase: 'STRATEGY', sortOrder: 9 },
    { code: 'business-plan', name: 'Business Plan', category: 'STRATEGY', phase: 'ECOSYSTEM', sortOrder: 10 },
    { code: 'bilan-ia', name: 'Bilan IA', category: 'DIAGNOSTIC', phase: 'DISCOVERY', sortOrder: 11 },
    { code: 'tremplin', name: 'Tremplin', category: 'PILOTAGE', phase: 'LAUNCH', sortOrder: 12 },
    { code: 'passeport', name: 'Passeport', category: 'PILOTAGE', phase: 'LAUNCH', sortOrder: 13 },
  ]

  for (const mod of appModules) {
    await seedIfMissing(db.appModule, { tenantId: tenant.id, code: mod.code }, {
      tenantId: tenant.id,
      code: mod.code,
      name: mod.name,
      category: mod.category as any,
      phase: mod.phase as any,
      isActive: true,
      sortOrder: mod.sortOrder,
    })
  }
  console.log(`  ✓ ${appModules.length} AppModules`)

  // ── Actors ──
  const actors = [
    { id: 'actor-cci-paris', name: 'CCI Paris Île-de-France', type: 'CCI', city: 'Paris', phone: '01 49 52 42 00', website: 'https://www.cci-paris-idf.fr' },
    { id: 'actor-bge-paris', name: 'BGE Paris', type: 'GIDEF', city: 'Paris', phone: '01 42 46 01 10', website: 'https://www.bge.fr' },
    { id: 'actor-reseau-entreprendre', name: 'Réseau Entreprendre IDF', type: 'INCUBATOR', city: 'Paris', phone: '01 53 67 68 00', website: 'https://www.reseau-entreprendre.org' },
    { id: 'actor-initiative-paris', name: 'Initiative Paris', type: 'GIDEF', city: 'Paris', phone: '01 42 33 02 00', website: 'https://www.initiative-paris.fr' },
    { id: 'actor-bnp-paribis', name: 'BNP Paribas Création', type: 'BANK', city: 'Paris', phone: '01 42 66 00 00', website: 'https://entrepreneurs.bnpparibas.fr' },
  ]

  for (const actor of actors) {
    await seedIfMissing(db.actor, { id: actor.id }, {
      id: actor.id,
      tenantId: tenant.id,
      name: actor.name,
      type: actor.type as any,
      city: actor.city,
      phone: actor.phone,
      website: actor.website,
      featured: true,
      successRate: actor.type === 'GIDEF' ? 85 : 72,
    })
  }
  console.log(`  ✓ ${actors.length} Actors`)

  // ── Summary ──
  console.log('\n✅ Seed completed successfully!')
  console.log('─────────────────────────────────')
  console.log('🔐 Demo accounts:')
  console.log('   Admin:        admin@echo-entreprendre.fr / Admin2026!')
  console.log('   Conseiller:   dupont.jean@gidef-idf.fr / Conseiller2026!')
  console.log('   Bénéficiaire: marie.curie@example.fr / Beneficiaire2026!')
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
