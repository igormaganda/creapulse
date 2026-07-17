// ============================================
// CreaPulse — Seed Transport/Livraison (CreaScope Stagiaire)
// Karim Benali — LastMile Express
// Run: bunx tsx prisma/seed-transport.ts
// ============================================

import Database from 'better-sqlite3'
import path from 'path'
import { hashSync } from 'bcryptjs'

const DB_PATH = path.resolve(__dirname, '../db/creapulse.db')
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Helpers ──────────────────────────────────

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString()
}

function futureDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString()
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function insertRow(table: string, data: Record<string, any>): void {
  const cols = Object.keys(data).join(', ')
  const placeholders = Object.keys(data).map(() => '?').join(', ')
  const vals = Object.values(data)
  try {
    db.prepare(`INSERT OR IGNORE INTO "${table}" (${cols}) VALUES (${placeholders})`).run(...vals)
  } catch (e: any) {
    console.error(`  ⚠️ Error inserting ${table}: ${e.message}`)
  }
}

// ─── Main Seed ────────────────────────────────

function main() {
  console.log('🌱 CreaPulse — Seeding transport/livraison CreaScope data...\n')

  // ══════════════════════════════════════════
  // 1. TENANT
  // ══════════════════════════════════════════
  const TENANT_ID = 'tenant-echo-001'
  insertRow('Tenant', {
    id: TENANT_ID, name: 'Echo Entreprendre', slug: 'echo-entreprendre',
    primaryColor: '#00838F', plan: 'PROFESSIONAL', isActive: 1,
    settings: '{}', createdAt: daysAgo(365), updatedAt: daysAgo(0),
  })
  console.log('  ✓ Tenant: Echo Entreprendre')

  // ══════════════════════════════════════════
  // 2. ORGANIZATION
  // ══════════════════════════════════════════
  const ORG_ID = 'org-gidef-idf-001'
  insertRow('Organization', {
    id: ORG_ID, tenantId: TENANT_ID, name: 'GIDEF Île-de-France',
    siret: '00000000000000', type: 'GIDEF_AGENCY',
    address: '15 Rue de la Bûcherie', city: 'Paris', postalCode: '75005',
    region: 'Île-de-France', phone: '01 23 45 67 89',
    email: 'contact@gidef-idf.fr', website: 'https://gidef-idf.fr',
    isActive: 1, createdAt: daysAgo(365), updatedAt: daysAgo(0),
  })
  console.log('  ✓ Organization: GIDEF Île-de-France')

  // ══════════════════════════════════════════
  // 3. ADMIN USER
  // ══════════════════════════════════════════
  insertRow('User', {
    id: 'admin-echo-001', tenantId: TENANT_ID,
    email: 'admin@echo-entreprendre.fr',
    passwordHash: hashSync('Admin2026!', 12),
    firstName: 'Sophie', lastName: 'Martin', role: 'ADMIN',
    isActive: 1, emailVerified: 1, lastLoginAt: daysAgo(1),
    createdAt: daysAgo(365), updatedAt: daysAgo(0),
  })
  console.log('  ✓ Admin: Sophie Martin')

  // ══════════════════════════════════════════
  // 4. COUNSELOR — Jean Dupont
  // ══════════════════════════════════════════
  const COUNSELOR_USER_ID = 'conseiller-gidef-001'
  const COUNSELOR_ID = 'counselor-jean-dupont-001'

  insertRow('User', {
    id: COUNSELOR_USER_ID, tenantId: TENANT_ID,
    email: 'dupont.jean@gidef-idf.fr',
    passwordHash: hashSync('Conseiller2026!', 12),
    firstName: 'Jean', lastName: 'Dupont', role: 'COUNSELOR',
    isActive: 1, emailVerified: 1, lastLoginAt: daysAgo(0),
    createdAt: daysAgo(365), updatedAt: daysAgo(0),
  })

  insertRow('Counselor', {
    id: COUNSELOR_ID, userId: COUNSELOR_USER_ID, organizationId: ORG_ID,
    name: 'Jean Dupont',
    specialities: JSON.stringify(["Création d'entreprise", "Business Plan", "Financement", "Transports et logistique"]),
    certifications: JSON.stringify(["Certifié BGE", "Coach entrepreneurial", "Expert logistique urbaine"]),
    maxBeneficiaries: 30, isAvailable: 1,
    createdAt: daysAgo(365), updatedAt: daysAgo(0),
  })
  console.log('  ✓ Counselor: Jean Dupont')

  // ══════════════════════════════════════════
  // 5. STAGIAIRE — Karim Benali
  // ══════════════════════════════════════════
  const USER_ID = 'stagiaire-creascope-001'
  const BENEFICIARY_ID = 'beneficiary-karim-benali-001'

  insertRow('User', {
    id: USER_ID, tenantId: TENANT_ID,
    email: 'karim.benali@example.fr',
    passwordHash: hashSync('CreaScope2026!', 12),
    firstName: 'Karim', lastName: 'Benali', role: 'BENEFICIARY',
    isActive: 1, emailVerified: 1, lastLoginAt: daysAgo(0),
    createdAt: daysAgo(60), updatedAt: daysAgo(0),
  })

  insertRow('Beneficiary', {
    id: BENEFICIARY_ID, userId: USER_ID, organizationId: ORG_ID,
    employmentStatus: 'UNEMPLOYED', educationLevel: 'Bac+2',
    lastDiploma: 'BTS Transport et Logistique',
    skills: JSON.stringify(['Permis B', 'Permis C (en cours)', 'Logistique urbaine', 'Gestion de tournées', 'Service client', 'Conduite professionnelle', 'Anglais technique']),
    hasDisability: 0, progressScore: 72,
    createdAt: daysAgo(60), updatedAt: daysAgo(0),
  })
  console.log('  ✓ Stagiaire: Karim Benali')

  // ══════════════════════════════════════════
  // 6. COUNSELOR ASSIGNMENT
  // ══════════════════════════════════════════
  insertRow('CounselorAssignment', {
    id: uid('ca'), counselorId: COUNSELOR_ID, beneficiaryId: BENEFICIARY_ID,
    role: 'PRIMARY', status: 'ACTIVE', assignedAt: daysAgo(60),
  })
  console.log('  ✓ CounselorAssignment')

  // ══════════════════════════════════════════
  // 7. CREATOR JOURNEY
  // ══════════════════════════════════════════
  const bpSections = {
    resume: `LastMile Express est un service de livraison du dernier kilomètre éco-responsable, créé par Karim Benali, porté par le GIDEF Île-de-France. L'entreprise propose des livraisons rapides (moins de 2h) et fiables pour les commerces de proximité en petite couronne parisienne Est, grâce à une flotte de vélos cargos électriques. Le positionnement premium se démarque des plateformes algorithmiques par un service client humain et un suivi en temps réel. Le projet est structuré en micro-entreprise avec un investissement initial de 8 500 €, visant 48 000 € de CA en année 1 et la rentabilité dès le 2e mois d'activité.`,
    equipe: `Karim Benali, fondateur et livreur — 5 ans d'expérience en logistique urbaine (3 ans UPS, 2 ans Uber Eats/Stuart). BTS Transport et Logistique. Permis B + C en cours. Compétences clés : optimisation de tournées, relation client commerçants, conduite professionnelle, connaissance terrain de la petite couronne Est. Profil pragmatique et autonome, habitué aux contraintes de la livraison urbaine. Recrutement envisagé en année 2 : 1 livreur supplémentaire.`,
    'etude-marche': `Le marché de la livraison du dernier kilomètre en France est estimé à 8,2 milliards d'euros en 2024, avec une croissance annuelle de +12% tirée par l'explosion du e-commerce local et des circuits courts. La petite couronne parisienne représente un marché captif de plus de 150 000 commerces de proximité. 78% des Français privilégient désormais les commerces de quartier depuis la crise du COVID. La mise en place des Zones à Faibles Émissions (ZFE) accélère la transition vers les véhicules électriques, créant un avantage compétitif pour les flottes éco-responsables. Le marché cible (commerces alimentaires, pharmacies, restaurants) en zone Pavillons-sous-Bois, Montreuil, Vincennes, Fontenay-sous-Bois représente environ 2 000 commerces potentiels avec un besoin régulier de livraison.`,
    segmentation: `Segment principal : Commerces de proximité alimentaire (boulangeries, épiceries fines, bouchers, fromagers) — 40% du portefeuille cible. Besoins : livraisons quotidiennes, fiabilité horaire, relation de confiance. Segment secondaire : Pharmacies et parapharmacies — 25% du portefeuille. Besoins : conformité réglementaire, température contrôlée, rapidité. Segment tertiaire : Restaurants et traiteurs — 20% du portefeuille. Besoins : livraisons repas, flexibilité horaire. Segment émergent : PME e-commerce local — 15% du portefeuille. Besoins : solution de livraison last mile clé en main, tracking.`,
    concurrence: `Principaux concurrents : 1) Stuart (racheté, repositionnement incertain) — historiquement le leader de la livraison pour commerces, mais dépendant des algorithmes et peu de personnalisation. 2) Deliveroo — dominant sur la restauration, mais pas positionné sur la livraison commerce de proximité. 3) Chronopost/DPD — trop cher pour les petites livraisons C2C, oriented B2C national. 4) Livreurs indépendants (Leboncoin, réseaux informels) — peu fiables, pas de suivi, pas d'assurance. Différenciation LastMile Express : éco-responsabilité, relation humaine avec le commerçant, tarifs transparents, zone de couverture ciblée et expertise locale.`,
    'strategie-marketing': `Stratégie marketing basée sur 4 leviers : 1) Prospection terrain systématique : visite de chaque commerce de la zone cible avec offre découverte (1ère livraison offerte). 2) Bouche-à-oreille et recommandations : programme de parrainage (10% de remise pour le parrain et le filleul). 3) Présence digitale locale : Instagram (photos de livraisons, coulisses), Google My Business optimisé, flyers QR code chez les commerçants partenaires. 4) Partenariats stratégiques : mairies (conventions stationnement vélos cargos), offices de commerce, GIDEF. Budget marketing : 100€/mois en année 1, 200€/mois en année 2.`,
    'plan-commercial': `Plan commercial en 3 phases. Phase 1 (mois 1-3) — Lancement et conquête : prospection terrain intensive, objectif 15 commerces clients réguliers, 4 livraisons/jour en moyenne. Prix : 12€/course standard, 8€/course récurrente (forfait). Phase 2 (mois 4-8) — Consolidation : objectif 30 commerces, 8 livraisons/jour, mise en place des forfaits mensuels. Introduction d'un service premium (livraison express <1h à 18€). Phase 3 (mois 9-24) — Croissance : objectif 50 commerces, 12+ livraisons/jour, embauche d'un livreur. Extension zone vers Rosny-sous-Bois et Nogent-sur-Marne. Objectifs CA : 48k€ (A1), 72k€ (A2), 96k€ (A3).`,
    financement: JSON.stringify([
      { id: 'f1', source: 'Apport personnel (épargne)', montant: 5000 },
      { id: 'f2', source: 'ACRE (exonération partielle charges)', montant: 1500 },
      { id: 'f3', source: 'Aide France Travail (ARCE ou ARE maintien)', montant: 2000 },
    ]),
    'compte-resultat': JSON.stringify({
      year1: { ca: 48000, charges: 38400, resultat: 9600 },
      year2: { ca: 72000, charges: 50400, resultat: 21600 },
      year3: { ca: 96000, charges: 62400, resultat: 33600 },
    }),
    seuil_rentabilite: `Le seuil de rentabilité mensuel est estimé à 1 375 € (charges fixes mensuelles : assurance 67€ + entretien 100€ + téléphone 35€ + marketing 100€ + charges sociales 22% = environ 1 375€/mois à couvrir). Avec un prix moyen de 12€/course et un objectif de 4 courses/jour (soit ~80 courses/mois ouvré), le CA mensuel atteint environ 4 000€ dès le mois 1. Le seuil de rentabilité est donc atteint dès le 2e mois d'activité. Le point mort cumulé incluant l'investissement initial (8 500€) est atteint vers le mois 3-4.`,
    investissements: JSON.stringify([
      { id: 'i1', name: '2 vélos cargos électriques d\'occasion', amount: 4000 },
      { id: 'i2', name: 'Équipement (caisses isothermes, sacs étanches, GPS)', amount: 1500 },
      { id: 'i3', name: 'Assurance RC Pro + flotte', amount: 800 },
      { id: 'i4', name: 'Communication (flyers, cartes, site vitrine)', amount: 1200 },
      { id: 'i5', name: 'Trésorerie de démarrage', amount: 1000 },
    ]),
    swot: JSON.stringify({
      strengths: '5 ans d\'expérience terrain, Connaissance fine de la zone, Positionnement éco-responsable en phase avec les ZFE, Investissement initial faible, Relation client humaine vs algorithmes',
      weaknesses: 'Structure individuelle — capacité limitée, Pas de notoriété de marque, Dépendance à un seul vélo cargo en cas de panne, Budget marketing réduit',
      opportunities: 'ZFE obligent la transition électrique, Croissance du e-commerce local (+12%/an), Volonté des commerçants de sortir des plateformes, Aides à la création (ACRE, ARCE), Zone géographique peu concurrentielle',
      threats: 'Guerre des prix des plateformes, Conditions météorologiques, Réglementation croissante des VAE, Risque d\'accident ou vol, Dépendance aux commandes (saisonnalité)',
    }),
    'statut-juridique': `micro-entreprise`,
    calendrier: JSON.stringify([
      { id: 'c1', title: 'Inscription micro-entreprise + ACRE', date: 'Mois 1', completed: true },
      { id: 'c2', title: 'Achat vélos cargos et équipement', date: 'Mois 1', completed: true },
      { id: 'c3', title: 'Prospection terrain zone cible', date: 'Mois 1-2', completed: true },
      { id: 'c4', title: 'Lancement (premières livraisons)', date: 'Mois 2', completed: false },
      { id: 'c5', title: 'Objectif 15 commerces réguliers', date: 'Mois 3', completed: false },
      { id: 'c6', title: 'Mise en place forfaits mensuels', date: 'Mois 4', completed: false },
    ]),
  }

  insertRow('CreatorJourney', {
    id: uid('cj'), userId: USER_ID,
    currentPhase: 'STRATEGY', progressPercent: 72,
    projectTitle: 'LastMile Express — Livraisons du dernier kilomètre en micro-entreprise',
    projectDescription: 'Service de livraison du dernier kilomètre pour les commerces de proximité en petite couronne parisienne. Flotte de vélos cargos électriques et triporteurs pour des livraisons éco-responsables, rapides et fiables. Positionnement premium sur la qualité de service et le respect des délais.',
    projectSector: 'Transports et logistique', projectStage: 'Création',
    creationMotivation: 'Après 5 ans en tant que salarié livreur, je souhaite devenir mon propre patron. Le marché du dernier kilomètre explose avec le e-commerce local et les circuits courts. La micro-entreprise me permet de tester mon modèle avec un risque financier minimal.',
    targetAudience: 'Commerces de proximité (boulangeries, pharmacies, épiceries fines, fleuristes, restaurants) en zone Pavillons-sous-Bois, Montreuil, Vincennes, Fontenay-sous-Bois. PME e-commerce local.',
    valueProposition: 'Livraison fiable en moins de 2h, éco-responsable (vélos cargos électriques), avec un suivi temps réel et un service client humain — contrairement aux algorithmes des plateformes.',
    estimatedRevenue: '48 000 € (A1), 72 000 € (A2), 96 000 € (A3)',
    estimatedInvestment: '8 500 €',
    visionAnswers: JSON.stringify({
      pourquoiEntreprendre: "Je veux être mon propre patron, décider de mes horaires et construire quelque chose de mien. Après 5 ans de livraison pour d'autres, je connais parfaitement les attentes des commerçants et les failles des plateformes existantes.",
      dejaEntrepreneur: false,
      experienceRelevante: "5 ans de livraison : 3 ans chez UPS, 2 ans en indépendant (Uber Eats, Stuart). Je maîtrise la logistique urbaine, les tournées optimisées et la relation client commerçants.",
      freinsPrincipaux: "Le financement de l'investissement initial et la gestion administrative de la micro-entreprise.",
      objectifs3Ans: "Atteindre 8 000€/mois de CA en année 3, employer 1 à 2 livreurs supplémentaires, étendre la zone de couverture à toute la petite couronne Est parisien.",
      contraintes: "Célibataire avec 1 enfant (garde alternée), besoin de revenus réguliers. Inscription France Travail depuis 6 mois, je bénéficie de l'ACRE.",
    }),
    bpStatus: 'IN_PROGRESS', bpSections: JSON.stringify(bpSections),
    bpScore: 74, bpGeneratedAt: daysAgo(15), tremplinStatus: 'IN_PROGRESS',
    tremplinScore: 70, status: 'ACTIVE', startedAt: daysAgo(60),
    createdAt: daysAgo(60), updatedAt: daysAgo(0),
  })
  console.log('  ✓ CreatorJourney: LastMile Express')

  // ══════════════════════════════════════════
  // 8. BMC — Business Model Canvas (COMPLET)
  // ══════════════════════════════════════════
  insertRow('BusinessModelCanvas', {
    id: uid('bmc'), userId: USER_ID,
    partenairesCles: '- Fabricants et revendeurs de vélos cargos électriques (Urban Arrow, Douze, Rad Power)\n- Compagnies d\'assurance spécialisées flotte et RC Pro\n- Commerces de proximité partenaires (boulangeries, pharmacies, restaurants, épiceries fines, fleuristes)\n- Mairies de Pavillons-sous-Bois, Montreuil, Vincennes (conventions stationnement vélos, accès pistes cyclables)\n- Fournisseurs de matériel logistique (caisses isothermes, sacs étanches)',
    activitesCles: '- Planification et optimisation quotidienne des tournées de livraison\n- Livraison du dernier kilomètre (pick-up & delivery)\n- Suivi des colis en temps réel (application mobile, notifications)\n- Gestion de la relation commerçants (prise de commandes, feedback, fidélisation)\n- Marketing local : prospection terrain, réseaux sociaux, partenariats\n- Entretien régulier de la flotte de vélos cargos',
    ressourcesCles: '- 2 vélos cargos électriques d\'occasion (Urban Arrow ou équivalent)\n- 2 smartphones avec application de tracking et navigation\n- Application de suivi en temps réel (solution SaaS légère)\n- Connaissance approfondie de la logistique urbaine et des tournées optimisées\n- Réseau terrain de commerçants en petite couronne Est parisien\n- Caisses isothermes et sacs étanches pour produits sensibles',
    propositionValeur: 'Livraison éco-responsable en moins de 2 heures grâce à des vélos cargos électriques. Suivi en temps réel et service client humain — pas d\'algorithme opaque. Tarifs transparents et prévisibles (12€/course, forfaits mensuels). Fiabilité et ponctualité garanties par une connaissance terrain locale.',
    relationsClients: '- Contact direct et personnel avec chaque commerçant (pas de call center)\n- Tableau de bord en ligne pour suivre les livraisons en temps réel\n- Programme de fidélisation : remise 10% après 50 courses, parrainage\n- Flexibilité : pas d\'engagement minimum, annulation gratuite 24h avant\n- Visite hebdomadaire des commerçants réguliers pour recueillir le feedback',
    canaux: '- Prospection terrain systématique (porte-à-porte commerces)\n- Bouche-à-oreille et recommandations entre commerçants\n- Instagram (@lastmile.express) : photos de livraisons, coulisses, témoignages\n- Google My Business (optimisé SEO local)\n- Flyers et cartes de visite avec QR code chez les commerçants partenaires\n- Partenariats avec offices de commerce et mairies',
    segmentsClients: '- Commerces alimentaires de proximité (boulangeries, bouchers, fromagers, épiceries fines) — 40%\n- Pharmacies et parapharmacies — 25%\n- Restaurants, traiteurs et caterers — 20%\n- PME e-commerce local (produits artisanaux, cosmétiques) — 15%',
    structureCouts: '- Amortissement vélos cargos : ~2 000€/an\n- Entretien et réparation flotte : 1 200€/an\n- Assurance RC Pro + flotte : 800€/an\n- Communication et marketing : 1 200€/an (A1), 2 400€/an (A2+)\n- Téléphone et données mobiles : 420€/an\n- Charges sociales micro-entreprise (~22% du CA)\n- Frais bancaires : ~200€/an',
    sourcesRevenus: '- Livraison à la course (ponctuelle) : 12€/course standard, 18€/express — 60% du CA\n- Forfaits mensuels : 199€/mois (20 courses), 349€/mois (40 courses) — 30% du CA\n- Services premium : livraison express <1h, livraison température contrôlée — 10% du CA',
    status: 'GENERATED', generatedFromBp: 1, generatedAt: daysAgo(20),
    createdAt: daysAgo(20), updatedAt: daysAgo(0),
  })
  console.log('  ✓ BusinessModelCanvas (9/9 blocs)')

  // ══════════════════════════════════════════
  // 9. FINANCIAL FORECAST
  // ══════════════════════════════════════════
  insertRow('FinancialForecast', {
    id: uid('ff'), userId: USER_ID,
    sector: 'Transports et logistique — Livraison dernier kilomètre',
    year1Revenue: 48000, year2Revenue: 72000, year3Revenue: 96000,
    year1Expenses: 38400, year2Expenses: 50400, year3Expenses: 62400,
    breakevenMonth: 8, initialInvestment: 8500,
    aiSynthesis: `Projet de micro-entreprise en livraison dernier kilomètre avec un investissement initial modéré de 8 500 €. La structure de coûts est avantageuse grâce au statut de micro-entreprise (charges sociales à ~22% du CA). Le seuil de rentabilité mensuel est bas (~1 375€) et atteignable dès le 2e mois. Le bénéfice net progresse de 9 600€ en A1 à 33 600€ en A3 avec une marge nette croissante (20% → 35%). Points de vigilance : la saisonnalité (baisse estivale), la dépendance à une zone géographique limitée, et la nécessité d'embaucher en A2 pour absorber la croissance. Recommandation : provisionner 2 mois de charges fixes en trésorerie de sécurité dès le mois 4.`,
    createdAt: daysAgo(30), updatedAt: daysAgo(0),
  })
  console.log('  ✓ FinancialForecast')

  // ══════════════════════════════════════════
  // 10. CREASIM SIMULATION
  // ══════════════════════════════════════════
  insertRow('CreaSimSimulation', {
    id: uid('cs'), userId: USER_ID,
    monthlyRevenue: 4000,
    fixedCharges: JSON.stringify([
      { name: 'Assurance RC Pro + flotte', amount: 67 },
      { name: 'Entretien et réparation vélos', amount: 100 },
      { name: 'Téléphone et données mobiles', amount: 35 },
      { name: 'Marketing et communication', amount: 100 },
    ]),
    variableChargesRate: 22,
    averageSellingPrice: 12,
    unitCost: 2.64,
    targetMarginRate: 78,
    initialInvestment: 8500,
    fixedChargesTotal: 302,
    variableChargesAmount: 880,
    totalCharges: 1182,
    grossMarginAmount: 2818,
    grossMarginRate: 78,
    netMarginAmount: 2516,
    netMarginRate: 70.5,
    monthlyBreakeven: 1375,
    breakevenMonths: 0.5,
    profitability1Y: 11576,
    profitability2Y: 25920,
    profitability3Y: 40320,
    year1Revenue: 48000, year1Expenses: 38400,
    year2Revenue: 72000, year2Expenses: 50400,
    year3Revenue: 96000, year3Expenses: 62400,
    aiAnalysis: `Simulation très favorable pour un projet de micro-entreprise en livraison dernier kilomètre. La structure de coûts est légère avec seulement 302€ de charges fixes mensuelles. La marge brute cible de 78% est excellente et supérieure à la moyenne du secteur. Le seuil de rentabilité mensuel (1 375€) est atteint avec seulement ~115 courses/mois, soit environ 5-6 courses/jour ouvré. Le modèle est résilient : même avec 50% de l'objectif de CA, l'activité reste bénéficiaire. Le passage en année 2 avec embauche d'un livreur dégrade légèrement la marge mais permet de multiplier le volume. Recommandation : surveiller le ratio charges sociales/CA qui pourrait évoluer avec les réformes de la micro-entreprise.`,
    createdAt: daysAgo(25), updatedAt: daysAgo(0),
  })
  console.log('  ✓ CreaSimSimulation')

  // ══════════════════════════════════════════
  // 11. MARKET ANALYSIS
  // ══════════════════════════════════════════
  insertRow('MarketAnalysis', {
    id: uid('ma'), userId: USER_ID,
    sector: 'Livraison du dernier kilomètre',
    marketSize: '8,2 Mds€ en France (2024), croissance +12%/an. Petite couronne parisienne : ~2 000 commerces de proximité ciblables.',
    targetAudience: 'Commerces de proximité en petite couronne Est parisienne (Pavillons-sous-Bois, Montreuil, Vincennes, Fontenay-sous-Bois) : boulangeries, pharmacies, épiceries fines, fleuristes, restaurants. PME e-commerce local.',
    trends: JSON.stringify([
      { label: 'E-commerce local en explosion', description: '+25%/an, accéléré par le COVID et les habitudes de consommation' },
      { label: 'Éco-responsabilité', description: '78% des consommateurs sensibles au transport vert' },
      { label: 'ZFE (Zones à Faibles Émissions)', description: 'Obligation progressive du véhicule propre en zone urbaine, avantage vélo cargo' },
      { label: 'Circuits courts', description: 'Renouveau des commerces de quartier, 67% veulent consommer local' },
      { label: 'Micro-logistique urbaine', description: 'Développement des dark stores et hubs urbains' },
    ]),
    competitors: JSON.stringify([
      { name: 'Stuart', position: 'Livraison commerce, racheté par DPD, repositionnement incertain', force: 'Réseau existant, technologie', faiblesse: 'Prix élevés, peu de personnalisation, avenir incertain' },
      { name: 'Deliveroo', position: 'Leader restauration', force: 'Notoriété, application', faiblesse: 'Uniquement restauration, pas de livraison commerce de proximité' },
      { name: 'Chronopost / DPD', position: 'Express B2C/B2B national', force: 'Fiabilité, couverture nationale', faiblesse: 'Trop cher pour petites livraisons locales, pas adapté au commerce de quartier' },
      { name: 'Livreurs indépendants (Leboncoin)', position: 'Low cost informel', force: 'Prix bas', faiblesse: 'Pas de fiabilité, pas d\'assurance, pas de suivi, pas de professionnalisme' },
    ]),
    opportunities: 'ZFE imposent l\'électrique — les vélos cargos deviennent un avantage compétitif majeur. Les commerçants veulent sortir des plateformes qui les dépossèdent de la relation client. Le e-commerce local est en croissance forte (+25%/an). La petite couronne Est est moins couverte que le centre de Paris. Les mairies cherchent des solutions de mobilité durable.',
    threats: 'Guerre des prix menée par les plateformes financées par le capital-risque. Réglementation croissante sur les VAE (vitesse max, équipements). Risque d\'accident ou de vol du matériel. Conditions météorologiques défavorables. Dépendance aux commandes des commerçants avec une saisonnalité (baisse estivale). Concurrence potentielle de La Poste qui se repositionne sur le dernier kilomètre.',
    aiSynthesis: `Le marché du dernier kilomètre est porteur (+12%/an) et le positionnement éco-responsable de LastMile Express répond à une demande croissante. La zone géographique ciblée (petite couronne Est) est stratégiquement pertinente car moins saturée que le centre de Paris. Les ZFE créent un effet d'aubaine pour les flottes électriques. La principale menace vient de la guerre des prix des plateformes, mais la différenciation par le service client humain et la relation de proximité avec les commerçants constitue un avantage défendable. Taille du marché addressable estimée à ~2 000 commerces dans la zone, avec un potentiel de 50 à 100 clients réguliers à maturité.`,
    createdAt: daysAgo(35), updatedAt: daysAgo(0),
  })
  console.log('  ✓ MarketAnalysis')

  // ══════════════════════════════════════════
  // 12. JURIDIQUE ANALYSIS
  // ══════════════════════════════════════════
  insertRow('JuridiqueAnalysis', {
    id: uid('ja'), userId: USER_ID,
    recommendedStatus: 'Micro-entreprise (auto-entrepreneur)',
    fiscalRegime: 'Micro-BIC',
    legalStructure: 'Micro-entreprise, pas de création de structure juridique. Inscription simple et rapide sur autoentrepreneur.urssaf.fr. Déclaration d\'activité SIRET automatique.',
    socialCharges: JSON.stringify({
      regime: 'Micro-entreprise',
      chargesSociales: '~22% du CA (cotisations forfaitaires)',
      impot: 'Micro-BIC (abattement 50% pour CA < 188 700€) ou option versement libératoire IS (1,7% sur CA livraison)',
      acre: 'ACRE : exonération partielle de charges sociales pendant 1 an (taux réduit à ~11,3% sur les 50 000 premiers euros de CA)',
      cfe: 'Exonération CFE la première année',
      tva: 'Franchise de TVA (CA < 91 900€ pour prestations de services), dispense de facturation TVA',
      assurance: 'RC Pro obligatoire, assurance flotte recommandée',
    }),
    createdAt: daysAgo(40), updatedAt: daysAgo(0),
  })
  console.log('  ✓ JuridiqueAnalysis')

  // ══════════════════════════════════════════
  // 13. TREMPLIN (5/7 étapes)
  // ══════════════════════════════════════════
  insertRow('Tremplin', {
    id: uid('tr'), userId: USER_ID,
    currentStep: 5,
    responses: JSON.stringify({
      step0: { completed: true, notes: 'Motivation forte, 5 ans d\'expérience en livraison, projet mur et réaliste', score: 9 },
      step1: { completed: true, notes: 'Adéquation marché confirmée : 8,2 Mds€, +12%/an, ZFE favorable', score: 8 },
      step2: { completed: true, notes: 'Rentabilité rapide : seuil atteint mois 2, bénéfice dès le mois 1', score: 7 },
      step3: { completed: true, notes: 'Compétences solides : logistique urbaine, gestion tournées, service client, terrain', score: 8 },
      step4: { completed: true, notes: 'Réseau en constitution : 8 commerçants intéressés, convention mairie en cours', score: 6 },
      step5: { completed: false, notes: 'Plan d\'action en cours de finalisation, prospection terrain lancée', score: 5 },
      step6: { completed: false, notes: 'Pitch non encore préparé', score: 0 },
    }),
    isCompleted: 0, score: 70, decision: 'GO_CONDITIONAL',
    summary: 'Projet viable avec conditions. Profil expérimenté et terrain solide, marché porteur, rentabilité rapide. Conditions : finaliser le plan d\'action et préparer le pitch de validation.',
    recommendations: JSON.stringify([
      'Finaliser le plan d\'action détaillé sur 3 mois avec jalons hebdomadaires',
      'Préparer le pitch de 5-7 minutes pour le Tremplin (problème, solution, marché, modèle, équipe, demande)',
      'Consolider les accords avec 5 commerçants pilotes avant le lancement',
      'Vérifier la couverture assurance et les conditions de circulation VAE dans les communes ciblées',
      'Inscrire la micro-entreprise et activer l\'ACRE avant la fin du mois',
    ]),
    createdAt: daysAgo(20), updatedAt: daysAgo(0),
  })
  console.log('  ✓ Tremplin (5/7 étapes, score 70)')

  // ══════════════════════════════════════════
  // 14. MODULE RESULTS (12 modules)
  // ══════════════════════════════════════════
  const moduleResults = [
    { code: 'profil-createur', score: 88, max: 100, days: 58, fb: 'Profil très complet. Expérience terrain solide en logistique urbaine.' },
    { code: 'riasec', score: 82, max: 100, days: 55, fb: 'Profil Réaliste-Entrepreneur (R-E). Adapté au secteur logistique.' },
    { code: 'kiviat', score: 76, max: 100, days: 50, fb: 'Compétences logistiques et opérationnelles fortes. Communication à renforcer.' },
    { code: 'mon-projet', score: 90, max: 100, days: 45, fb: 'Projet très bien structuré, idées claires, réalisme financier.' },
    { code: 'vision', score: 85, max: 100, days: 42, fb: 'Vision claire et réaliste, objectifs 3 ans bien définis.' },
    { code: 'marche', score: 78, max: 100, days: 35, fb: 'Analyse de marché solide, concurrents bien identifiés.' },
    { code: 'juridique', score: 72, max: 100, days: 30, fb: 'Micro-entreprise bien adaptée. Points de vigilance sur la TVA.' },
    { code: 'creasim', score: 85, max: 100, days: 25, fb: 'Simulation très favorable. Seuil de rentabilité atteint mois 2.' },
    { code: 'bmc', score: 80, max: 100, days: 20, fb: 'BMC complet et cohérent. 9/9 blocs remplis avec contenu réaliste.' },
    { code: 'business-plan', score: 74, max: 100, days: 15, fb: 'BP solide avec sections financières réalistes. À finaliser : prévisionnel trésorerie mensuel.' },
    { code: 'bilan-ia', score: 80, max: 100, days: 12, fb: 'Bilan positif. Profil logistique confirmé, 3 axes d\'amélioration identifiés.' },
    { code: 'tremplin', score: 70, max: 100, days: 10, fb: 'Tremplin en cours (5/7 étapes). Projet viable avec conditions.' },
  ]

  for (const m of moduleResults) {
    insertRow('ModuleResult', {
      id: uid('mr'), userId: USER_ID, moduleCode: m.code,
      score: m.score, maxScore: m.max,
      answers: JSON.stringify({ completed: true }),
      feedback: m.fb, completedAt: daysAgo(m.days),
      createdAt: daysAgo(m.days),
    })
  }
  console.log(`  ✓ ${moduleResults.length} ModuleResults`)

  // ══════════════════════════════════════════
  // 15. KIVIAT RESULTS (8 dimensions)
  // ══════════════════════════════════════════
  const kiviatData = [
    { category: 'Leadership', score: 6.5 },
    { category: 'Communication', score: 6.0 },
    { category: 'Gestion du stress', score: 7.8 },
    { category: 'Résolution de problèmes', score: 8.0 },
    { category: 'Créativité', score: 5.5 },
    { category: 'Adaptabilité', score: 8.5 },
    { category: 'Gestion financière', score: 6.0 },
    { category: 'Planification', score: 8.2 },
  ]
  for (const k of kiviatData) {
    insertRow('KiviatResult', {
      id: uid('kr'), userId: USER_ID, category: k.category,
      score: k.score, maxScore: 10, createdAt: daysAgo(50),
    })
  }
  console.log(`  ✓ ${kiviatData.length} KiviatResults`)

  // ══════════════════════════════════════════
  // 16. RIASEC RESULTS
  // ══════════════════════════════════════════
  const riasecData = [
    { type: 'R', score: 9.0, dominant: true },
    { type: 'E', score: 8.5, dominant: true },
    { type: 'I', score: 5.0, dominant: false },
    { type: 'A', score: 4.5, dominant: false },
    { type: 'S', score: 6.0, dominant: false },
    { type: 'C', score: 5.5, dominant: false },
  ]
  for (const r of riasecData) {
    insertRow('RiasecResult', {
      id: uid('rr'), userId: USER_ID, profileType: r.type,
      score: r.score, isDominant: r.dominant ? 1 : 0, createdAt: daysAgo(55),
    })
  }
  console.log(`  ✓ ${riasecData.length} RiasecResults (R-E dominant)`)

  // ══════════════════════════════════════════
  // 17. MOTIVATION ASSESSMENT
  // ══════════════════════════════════════════
  insertRow('MotivationAssessment', {
    id: uid('mot'), userId: USER_ID,
    scores: JSON.stringify({
      independance: 10,
      reussite: 9,
      passion: 7,
      impact: 6,
      securite: 5,
    }),
    summary: 'Profil fortement motivé par l\'indépendance (10/10) et la réussite (9/10). Karim souhaite avant tout être son propre patron après 5 ans de salariat. La sécurité financière est moins motivante car il a confiance dans son expertise métier. Profil typique d\'un auto-entrepreneur qui a mûri son projet par l\'expérience terrain.',
    createdAt: daysAgo(52), updatedAt: daysAgo(0),
  })
  console.log('  ✓ MotivationAssessment')

  // ══════════════════════════════════════════
  // 18. ZERO DRAFT (Pitch Deck — 8 slides)
  // ══════════════════════════════════════════
  const zeroDraftContent = JSON.stringify({
    slides: [
      { id: 'probleme', title: 'Le Problème', content: 'Les commerces de proximité en petite couronne parisienne n\'ont pas de solution de livraison fiable et abordable. Les plateformes (Stuart, Deliveroo) sont chères, opaques et sans service client humain. Les livreurs indépendants manquent de professionnalisme. Résultat : 40% des commerçants renoncent à proposer la livraison.' },
      { id: 'solution', title: 'Notre Solution', content: 'LastMile Express : livraison du dernier kilomètre éco-responsable en vélo cargo électrique. Livraison en moins de 2h, suivi en temps réel, service client humain. Tarifs transparents : 12€/course, forfaits mensuels dès 199€.' },
      { id: 'marche', title: 'Marché', content: '8,2 Mds€ en France (+12%/an). Cible : 2 000 commerces en petite couronne Est. 78% des Français veulent consommer local. ZFE obligent l\'électrique — avantage vélos cargos.' },
      { id: 'businessModel', title: 'Business Model', content: 'Revenus : courses ponctuelles 60% (12€/course), forfaits mensuels 30% (199-349€/mois), premium 10%. Marge brute 78%. Charges sociales micro-entreprise ~22% CA. Rentabilité mois 2.' },
      { id: 'traction', title: 'Traction', content: '5 ans d\'expérience terrain. 8 commerçants intéressés. 2 vélos cargos identifiés d\'occasion. Convention stationnement en discussion avec mairie. Inscription France Travail, ACRE éligible.' },
      { id: 'equipe', title: 'Équipe', content: 'Karim Benali, fondateur : 5 ans livraison urbaine (UPS, Uber Eats, Stuart). BTS Transport et Logistique. Expert en tournées optimisées et logistique urbaine. Accompagné par Jean Dupont, conseiller GIDEF Île-de-France.' },
      { id: 'financier', title: 'Financier', content: 'Investissement : 8 500€ (2 vélos cargos, équipement, assurance, communication, trésorerie). CA : 48k€ A1, 72k€ A2, 96k€ A3. Bénéfice net : 9,6k€ A1, 21,6k€ A2, 33,6k€ A3.' },
      { id: 'ask', title: 'Demande', content: '8 500€ d\'investissement (apport personnel + ACRE + aides France Travail). 12 mois d\'accompagnement GIDEF. Mise en relation avec 5 commerçants pilotes.' },
    ],
  })

  insertRow('ZeroDraft', {
    id: uid('zd'), userId: USER_ID,
    projectTitle: 'LastMile Express — Livraisons du dernier kilomètre',
    content: zeroDraftContent, wordCount: 520, status: 'READY',
    createdAt: daysAgo(10), updatedAt: daysAgo(0),
  })
  console.log('  ✓ ZeroDraft (8 slides)')

  // ══════════════════════════════════════════
  // 19. CREASCOPE SESSION
  // ══════════════════════════════════════════
  insertRow('CreascopeSession', {
    id: uid('css'), beneficiaryId: BENEFICIARY_ID, counselorId: COUNSELOR_ID,
    status: 'TERMINEE', currentStep: 'TERMINEE',
    scheduledAt: daysAgo(55), startedAt: daysAgo(55), completedAt: daysAgo(55),
    estimatedMinutes: 240,
    stepProgress: JSON.stringify({
      ACCUEIL: { startedAt: daysAgo(55), completedAt: daysAgo(54.5), durationMinutes: 30, notes: 'Présentation du parcours CreaScope. Karim est motivé et a déjà une idée précise de projet.', aiInsights: 'Profil expérimenté en logistique, motivation forte pour l\'indépendance.' },
      FLASH_SWIPE: { startedAt: daysAgo(54.5), completedAt: daysAgo(53), durationMinutes: 45, notes: 'Jeux de cartes bien engagé. Karim a identifié rapidement ses compétences fortes.', aiInsights: 'Compétences opérationnelles et logistiques prédominantes. Profil Réaliste confirmé.' },
      ANALYSE_INTERMEDIAIRE: { startedAt: daysAgo(53), completedAt: daysAgo(52), durationMinutes: 15, notes: 'Premiers résultats cohérents avec le profil attendu.', aiInsights: 'Kiviat : adaptabilité et planification fortes. RIASEC : R-E dominant.' },
      QUESTIONNAIRE: { startedAt: daysAgo(52), completedAt: daysAgo(50), durationMinutes: 60, notes: 'Questionnaire approfondi complété. Réponses détaillées et réfléchies.', aiInsights: 'Vision claire du projet, connaissances marché solides, freins identifiés.' },
      CHALLENGE_SCENARIO: { startedAt: daysAgo(50), completedAt: daysAgo(48), durationMinutes: 45, notes: 'Scénarios de crise bien gérés. Karim a proposé des solutions réalistes.', aiInsights: 'Bonne capacité de résolution de problèmes. Gestion du stress confirmée.' },
      BILAN_IA: { startedAt: daysAgo(48), completedAt: daysAgo(46), durationMinutes: 30, notes: 'Bilan IA présenté et discuté. Synthèse positive.', aiInsights: 'Profil entrepreneurial validé. Recommandation : poursuivre le parcours stratégie.' },
      PLAN_ACTION: { startedAt: daysAgo(46), completedAt: daysAgo(45), durationMinutes: 30, notes: 'Plan d\'action défini sur 3 mois avec jalons hebdomadaires.', aiInsights: 'Plan réaliste et ambitieux. 3 priorités : inscription micro-entreprise, prospection terrain, achat vélos cargos.' },
    }),
    counselorNotes: 'Excellente session CreaScope. Karim a un profil atypique mais très complémentaire pour un projet de livraison : 5 ans d\'expérience terrain, connaissance fine de la zone, et une vraie volonté d\'indépendance. Le projet LastMile Express est crédible et bien structuré. Je recommande un accompagnement prioritaire sur les modules stratégie (BP, BMC, CreaSim) et un suivi rapproché pour le lancement.',
    aiInsights: JSON.stringify({
      profilGlobal: 'Entrepreneur pragmatique avec forte expérience terrain',
      pointsForts: ['Logistique urbaine', 'Gestion du stress', 'Adaptabilité', 'Planification'],
      axesAmelioration: ['Communication', 'Créativité', 'Gestion financière avancée'],
      recommandationParcours: 'CreaScope → Modules Stratégie → Tremplin → Lancement',
    }),
    actionPlan: JSON.stringify({
      semaine1: ['Inscription micro-entreprise', 'Demande ACRE', 'Ouvrir compte bancaire pro'],
      semaine2: ['Rechercher et acheter 2 vélos cargos d\'occasion', 'Souscrire assurance RC Pro'],
      semaine3: ['Prospection terrain zone Pavillons-sous-Bois', 'Créer profil Instagram'],
      semaine4: ['Prospection Montreuil/Vincennes', 'Créer Google My Business'],
      mois2: ['Objectif 15 commerces signés', 'Premières livraisons', 'Ajuster les tournées'],
      mois3: ['Bilan premier mois', 'Ajustement tarifs', 'Mise en place forfaits'],
    }),
    globalScore: 78,
    createdAt: daysAgo(55), updatedAt: daysAgo(0),
  })
  console.log('  ✓ CreascopeSession (complétée, score 78)')

  // ══════════════════════════════════════════
  // 20. INTERVIEW SESSIONS (2)
  // ══════════════════════════════════════════
  const interview1Id = 'interview-transport-001'
  const interview2Id = 'interview-transport-002'

  insertRow('InterviewSession', {
    id: interview1Id, counselorId: COUNSELOR_ID, beneficiaryId: BENEFICIARY_ID,
    type: 'bilan', phase: 'ACCUEIL',
    scheduledAt: daysAgo(58), startedAt: daysAgo(58), completedAt: daysAgo(58),
    status: 'completed',
    synthesis: `Premier bilan très positif. Karim Benali, 32 ans, a 5 ans d'expérience en livraison urbaine (UPS puis indépendant). Projet mur de création d'un service de livraison du dernier kilomètre en micro-entreprise (LastMile Express). Motivation forte pour l'indépendance. Profil Réaliste-Entrepreneur (RIASEC). Connaissance fine de la zone géographique ciblée (petite couronne Est parisienne). Situation personnelle stable (célibataire, 1 enfant, garde alternée). Inscrit France Travail depuis 6 mois, éligible ACRE.`,
    recommendations: JSON.stringify([
      'Lancer le parcours CreaScope pour valider le profil entrepreneurial',
      'Compléter les tests RIASEC et Kiviat pour confirmer les compétences',
      'Rédiger la fiche "Mon Projet" de manière détaillée',
      'Pré-recherche de vélos cargos électriques d\'occasion',
    ]),
    createdAt: daysAgo(58), updatedAt: daysAgo(0),
  })

  insertRow('InterviewSession', {
    id: interview2Id, counselorId: COUNSELOR_ID, beneficiaryId: BENEFICIARY_ID,
    type: 'suivi', phase: 'STRATEGIE',
    scheduledAt: daysAgo(20), startedAt: daysAgo(20), completedAt: daysAgo(20),
    status: 'completed',
    synthesis: `Deuxième entretien de suivi. Karim a bien avancé : CreaScope complété avec un score de 78/100. Tous les modules diagnostic sont terminés. Le BMC est complet (9/9 blocs). CreaSim montre une rentabilité rapide (mois 2). Le BP est en cours de rédaction (score 74/100, 13 sections sur 13). Le Tremplin est en cours (5/7 étapes, score 70). Projet solide et réaliste. Reste à finaliser le plan d'action et préparer le pitch Tremplin. Je recommande un passage en Tremplin sous 2 semaines.`,
    recommendations: JSON.stringify([
      'Finaliser le BP (section prévisionnel trésorerie mensuel)',
      'Préparer le pitch Tremplin (5-7 min, 8 slides)',
      'Inscrire la micro-entreprise et activer l\'ACRE',
      'Consolider 5 accords commerçants pilotes',
      'Passer le Tremplin sous 2 semaines',
    ]),
    createdAt: daysAgo(20), updatedAt: daysAgo(0),
  })
  console.log('  ✓ 2 InterviewSessions')

  // ══════════════════════════════════════════
  // 21. INTERVIEW NOTES
  // ══════════════════════════════════════════
  const interviewNotes = [
    { iid: interview1Id, phase: 'ACCUEIL', cat: 'observation', content: 'Expérience solide de 5 ans en livraison urbaine : 3 ans UPS (organisation rigoureuse), 2 ans Uber Eats/Stuart (connaissance des plateformes et de leurs failles).', key: 1, action: 0 },
    { iid: interview1Id, phase: 'ACCUEIL', cat: 'observation', content: 'Connaissance très fine de la zone géographique : Pavillons-sous-Bois, Montreuil, Vincennes, Fontenay-sous-Bois. Connaît les rues, les horaires de pointe, les difficultés de stationnement.', key: 1, action: 0 },
    { iid: interview1Id, phase: 'ACCUEIL', cat: 'observation', content: 'Motivation forte pour l\'indépendance. En a assez de travailler pour des plateformes qui le dépossèdent de la relation client. Veut reconstruire une relation de confiance avec les commerçants.', key: 1, action: 0 },
    { iid: interview1Id, phase: 'ACCUEIL', cat: 'observation', content: 'Situation personnelle stable : célibataire, 1 enfant (garde alternée), inscrit France Travail depuis 6 mois. Éligible ACRE et ARCE.', key: 0, action: 0 },
    { iid: interview1Id, phase: 'ACCUEIL', cat: 'recommandation', content: 'Lancer le parcours CreaScope pour valider le profil et structurer le projet.', key: 1, action: 1 },
    { iid: interview1Id, phase: 'ACCUEIL', cat: 'recommandation', content: 'Compléter les tests RIASEC et Kiviat pour confirmer les compétences entrepreneuriales.', key: 1, action: 1 },
    { iid: interview2Id, phase: 'STRATEGIE', cat: 'observation', content: 'CreaScope complété avec score 78/100. Profil Réaliste-Entrepreneur confirmé. Très bon score sur l\'adaptabilité (8.5/10) et la planification (8.2/10).', key: 1, action: 0 },
    { iid: interview2Id, phase: 'STRATEGIE', cat: 'observation', content: 'BMC complet et cohérent (9/9 blocs). Modèle économique clair : 60% courses ponctuelles, 30% forfaits, 10% premium. Marge brute 78%.', key: 1, action: 0 },
    { iid: interview2Id, phase: 'STRATEGIE', cat: 'observation', content: 'CreaSim très favorable : seuil de rentabilité atteint mois 2, bénéfice net 70.5% en routine. Hypothèses réalistes basées sur l\'expérience terrain.', key: 1, action: 0 },
    { iid: interview2Id, phase: 'STRATEGIE', cat: 'observation', content: 'BP bien avancé : 13/13 sections rédigées, score 74/100. Sections financières réalistes. À améliorer : prévisionnel de trésorerie mensuel.', key: 1, action: 0 },
    { iid: interview2Id, phase: 'STRATEGIE', cat: 'recommandation', content: 'Inscrire la micro-entreprise rapidement et activer l\'ACRE (exonération 1 an).', key: 1, action: 1 },
    { iid: interview2Id, phase: 'STRATEGIE', cat: 'recommandation', content: 'Préparer le pitch Tremplin (5-7 minutes, 8 slides) pour passage sous 2 semaines.', key: 1, action: 1 },
    { iid: interview2Id, phase: 'STRATEGIE', cat: 'recommandation', content: 'Consolider 5 accords écrits avec des commerçants pilotes avant le lancement.', key: 1, action: 1 },
  ]
  for (const n of interviewNotes) {
    insertRow('InterviewNote', {
      id: uid('in'), interviewId: n.iid, phase: n.phase,
      category: n.cat, content: n.content,
      isKeyPoint: n.key ? 1 : 0, isActionItem: n.action ? 1 : 0,
      createdAt: daysAgo(20),
    })
  }
  console.log(`  ✓ ${interviewNotes.length} InterviewNotes`)

  // ══════════════════════════════════════════
  // 22. APP MODULES (13 modules CreaScope)
  // ══════════════════════════════════════════
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
  for (const m of appModules) {
    insertRow('AppModule', {
      id: uid('am'), tenantId: TENANT_ID, code: m.code, name: m.name,
      category: m.category, phase: m.phase, isActive: 1, sortOrder: m.sortOrder,
      createdAt: daysAgo(365), updatedAt: daysAgo(0),
    })
  }
  console.log(`  ✓ ${appModules.length} AppModules`)

  // ══════════════════════════════════════════
  // 23. DISPOSITIF — CreaScope
  // ══════════════════════════════════════════
  const DISPOSITIF_ID = 'dispositif-creascope-001'
  insertRow('Dispositif', {
    id: DISPOSITIF_ID, tenantId: TENANT_ID,
    code: 'creascope', name: 'CréaScope',
    description: 'Parcours diagnostic entrepreneurial en 3-4h avec un conseiller. Flash Swipe, Questionnaire, Challenge Scénario, Bilan IA et Plan d\'Action.',
    type: 'DIAGNOSTIC', color: '#00838F', icon: 'Search',
    durationDays: 90, isActive: 1, sortOrder: 1,
    moduleConfig: JSON.stringify({ include: ['profil-createur', 'riasec', 'kiviat', 'mon-projet', 'vision', 'marche', 'juridique', 'creasim', 'bmc', 'business-plan', 'bilan-ia', 'tremplin', 'passeport'], exclude: null }),
    createdAt: daysAgo(365), updatedAt: daysAgo(0),
  })
  console.log('  ✓ Dispositif: CreaScope')

  // ══════════════════════════════════════════
  // 24. USER ENROLLMENT
  // ══════════════════════════════════════════
  insertRow('UserEnrollment', {
    id: uid('ue'), userId: USER_ID, tenantId: TENANT_ID,
    dispositifId: DISPOSITIF_ID, status: 'ACTIF',
    enrolledAt: daysAgo(60), startedAt: daysAgo(55), progress: 72,
    projectTitle: 'LastMile Express — Livraisons du dernier kilomètre',
    settings: JSON.stringify({}),
    createdAt: daysAgo(60), updatedAt: daysAgo(0),
  })
  console.log('  ✓ UserEnrollment: CreaScope (72%)')

  // ══════════════════════════════════════════
  // 25. SESSION & ACCOUNT (auth)
  // ══════════════════════════════════════════
  insertRow('Session', {
    id: uid('sess'), userId: USER_ID,
    token: 'session-karim-creascope-token',
    ipAddress: '78.200.xxx.xxx', userAgent: 'Mozilla/5.0 (iPhone)',
    expiresAt: futureDays(7), createdAt: daysAgo(0),
  })
  insertRow('Account', {
    id: uid('acc'), userId: USER_ID,
    provider: 'credentials', createdAt: daysAgo(60),
  })
  console.log('  ✓ Session + Account')

  // ══════════════════════════════════════════
  // 26. APPOINTMENTS (2)
  // ══════════════════════════════════════════
  insertRow('Appointment', {
    id: uid('ap1'), counselorId: COUNSELOR_ID, beneficiaryId: BENEFICIARY_ID,
    title: 'Suivi BP et préparation Tremplin',
    description: 'Revue du business plan, préparation du pitch Tremplin, point sur la prospection terrain.',
    type: 'FOLLOW_UP', mode: 'PHYSICAL',
    scheduledAt: futureDays(3), durationMinutes: 60,
    status: 'SCHEDULED', location: 'GIDEF Île-de-France, 15 Rue de la Bûcherie, Paris 5e',
    createdAt: daysAgo(2), updatedAt: daysAgo(0),
  })

  insertRow('Appointment', {
    id: uid('ap2'), counselorId: COUNSELOR_ID, beneficiaryId: BENEFICIARY_ID,
    title: 'Passage Tremplin',
    description: 'Présentation du projet LastMile Express devant le comité Tremplin. Pitch de 5-7 minutes + questions.',
    type: 'BILAN', mode: 'PHYSICAL',
    scheduledAt: futureDays(14), durationMinutes: 90,
    status: 'SCHEDULED', location: 'GIDEF Île-de-France, Salle Tremplin',
    createdAt: daysAgo(1), updatedAt: daysAgo(0),
  })
  console.log('  ✓ 2 Appointments')

  // ══════════════════════════════════════════
  // 27. ACTORS (écosystème)
  // ══════════════════════════════════════════
  const actors = [
    { id: 'actor-cci-paris', name: 'CCI Paris Île-de-France', type: 'CCI', city: 'Paris', phone: '01 49 52 42 00', website: 'https://www.cci-paris-idf.fr', desc: 'Aide à la création, formalités, réseau d\'entreprises' },
    { id: 'actor-bge-paris', name: 'BGE Paris', type: 'GIDEF', city: 'Paris', phone: '01 42 46 01 10', website: 'https://www.bge.fr', desc: 'Accompagnement création d\'entreprise, prêts d\'honneur' },
    { id: 'actor-reseau-entreprendre', name: 'Réseau Entreprendre IDF', type: 'INCUBATOR', city: 'Paris', phone: '01 53 67 68 00', website: 'https://www.reseau-entreprendre.org', desc: 'Parrainage par entrepreneurs expérimentés' },
    { id: 'actor-initiative-paris', name: 'Initiative Paris', type: 'GIDEF', city: 'Paris', phone: '01 42 33 02 00', website: 'https://www.initiative-paris.fr', desc: 'Micro-crédits pour la création d\'entreprise' },
    { id: 'actor-bnp-paribas', name: 'BNP Paribas Création', type: 'BANK', city: 'Paris', phone: '01 42 66 00 00', website: 'https://entrepreneurs.bnpparibas.fr', desc: 'Financement création, offre micro-entreprise' },
    { id: 'actor-urban-arrow', name: 'Urban Arrow France', type: 'OTHER', city: 'Bordeaux', phone: '05 56 xx xx xx', website: 'https://www.urbanarrow.com', desc: 'Fabricant néerlandais de vélos cargos électriques. Distributeur France basé à Bordeaux.' },
    { id: 'actor-mairie-montreuil', name: 'Mairie de Montreuil', type: 'OTHER', city: 'Montreuil', phone: '01 48 18 30 00', website: 'https://www.montreuil.fr', desc: 'Conventions stationnement vélos cargos, pistes cyclables, aide mobilité durable' },
    { id: 'actor-france-travail-93', name: 'France Travail Seine-Saint-Denis', type: 'FORMATION', city: 'Bobigny', phone: '01 48 31 10 10', website: 'https://www.francetravail.fr', desc: 'ACRE, ARCE, ARE maintien. Aides à la création pour les inscrits.' },
  ]
  for (const a of actors) {
    insertRow('Actor', {
      id: a.id, tenantId: TENANT_ID, name: a.name, type: a.type,
      city: a.city, phone: a.phone, website: a.website,
      description: a.desc, featured: 1,
      successRate: (a.type === 'GIDEF' || a.type === 'INCUBATOR') ? 85 : 70,
      createdAt: daysAgo(365), updatedAt: daysAgo(0),
    })
  }
  console.log(`  ✓ ${actors.length} Actors`)

  // ══════════════════════════════════════════
  // 28. NOTIFICATIONS (6)
  // ══════════════════════════════════════════
  const notifications = [
    { title: 'Rappel : RDV Suivi BP dans 3 jours', content: 'Votre rendez-vous de suivi Business Plan avec Jean Dupont est prévu dans 3 jours. Préparez les sections financières à approfondir.', type: 'ACTION_REQUIRED', isRead: 0, days: 1, link: '/bureau/business-plan' },
    { title: 'Tremplin : étapes 5 et 6 en cours', content: 'Vous avez complété 5 des 7 étapes du Tremplin. Finalisez le plan d\'action et préparez votre pitch pour passer la validation.', type: 'WARNING', isRead: 0, days: 3, link: '/bureau/tremplin' },
    { title: 'Félicitations ! Session CreaScope terminée', content: 'Votre session CreaScope est terminée avec un score de 78/100. Le plan d\'action est disponible dans votre parcours.', type: 'SUCCESS', isRead: 1, days: 5, link: '/bureau/creascope' },
    { title: 'BMC validé par le conseiller', content: 'Jean Dupont a validé votre Business Model Canvas. Tous les blocs sont complets et cohérents. Vous pouvez maintenant travailler le Business Plan.', type: 'MILESTONE', isRead: 1, days: 15, link: '/bureau/bmc' },
    { title: 'Nouveau module disponible : Passeport', content: 'Le module Passeport est maintenant disponible dans votre parcours. Il vous permet d\'exporter votre dossier complet de création d\'entreprise.', type: 'INFO', isRead: 1, days: 20, link: '/bureau/passeport' },
    { title: 'RDV Tremplin programmé dans 14 jours', content: 'Votre passage Tremplin est programmé le ' + new Date(Date.now() + 14 * 86400000).toLocaleDateString('fr-FR') + '. Préparez un pitch de 5-7 minutes.', type: 'ACTION_REQUIRED', isRead: 0, days: 1, link: '/bureau/tremplin' },
  ]
  for (const n of notifications) {
    insertRow('Notification', {
      id: uid('ntf'), userId: USER_ID,
      title: n.title, content: n.content, type: n.type,
      link: n.link, isRead: n.isRead, createdAt: daysAgo(n.days),
    })
  }
  console.log(`  ✓ ${notifications.length} Notifications`)

  // ══════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════
  console.log('\n✅ Seed transport completed successfully!')
  console.log('─────────────────────────────────')
  console.log('🔐 Comptes de démonstration :')
  console.log('   Admin:       admin@echo-entreprendre.fr / Admin2026!')
  console.log('   Conseiller:  dupont.jean@gidef-idf.fr / Conseiller2026!')
  console.log('   Stagiaire:   karim.benali@example.fr / CreaScope2026!')
  console.log('─────────────────────────────────')
  console.log('🚀 Karim Benali — LastMile Express')
  console.log('   Parcours: CreaScope | Progression: 72%')
  console.log('   Phase: STRATEGY | BP Score: 74 | Tremplin: 70')
  console.log('   CréaScope: complété (78/100)')
  console.log('─────────────────────────────────')

  db.close()
}

main()