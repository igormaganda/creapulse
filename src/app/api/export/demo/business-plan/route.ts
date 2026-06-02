// ============================================
// CreaPulse V2 — Demo Business Plan PDF Export
// GET /api/export/demo/business-plan
// No authentication required — public demo
// Generates a comprehensive 22-section Business Plan
// for the fictional "EcoVerre Île-de-France" project
// ============================================

import { NextResponse } from 'next/server'
import {
  generatePdfBuffer,
  drawCoverPage,
  addSectionHeader,
  addSubSectionHeader,
  addTable,
  addKeyValueBlock,
  addBullet,
  addParagraph,
  addSpacing,
  checkNewPage,
  finalizeWithFooters,
  formatCurrency,
  formatPercent,
  formatDate,
  type TableColumn,
  type TableRow,
  COLORS,
} from '@/lib/pdf-utils'

// ─── Demo Constants ──────────────────────────

const DEMO_USER_ID = 'beneficiaire-demo-001'

const BUSINESS = {
  name: 'EcoVerre Île-de-France',
  tagline: 'Recyclage et upcycling de verre',
  sector: 'Économie circulaire / Recyclage',
  legalForm: 'SAS (Société par Actions Simplifiée)',
  capital: 10_000,
  siret: '123 456 789 00012',
  creationDate: '2025-01-15',
  address: '12 Rue de l\'Industrie, 93100 Montreuil',
  region: 'Île-de-France',
  phone: '01 23 45 67 89',
  email: 'contact@ecoverre-idf.fr',
  website: 'www.ecoverre-idf.fr',
}

const FOUNDER = {
  name: 'Marie Dupont',
  role: 'Gérante et fondatrice',
  background: 'Ingénieure en science des matériaux — 12 ans d\'expérience dans l\'industrie verrière',
  skills: ['Gestion de projet', 'Procédés industriels', 'R&D matériaux', 'Management d\'équipe'],
  email: 'marie.dupont@ecoverre-idf.fr',
}

const TEAM = [
  {
    name: 'Marie Dupont',
    role: 'Gérante / Directrice Générale',
    experience: '12 ans dans l\'industrie verrière, ex-ingénieure chez Saint-Gobain',
  },
  {
    name: 'Thomas Laurent',
    role: 'Directeur Commercial',
    experience: '8 ans dans la vente B2B, spécialiste du recyclage industriel',
  },
  {
    name: 'Fatima Benali',
    role: 'Responsable R&D',
    experience: 'Doctorat en chimie des matériaux, 5 ans de recherche en upcycling du verre',
  },
  {
    name: 'Lucas Moreau',
    role: 'Responsable Production',
    experience: '10 ans en gestion d\'atelier, certification Lean Manufacturing',
  },
]

// ─── Table of Contents (sections 3–22) ─────────

const TOC_SECTIONS = [
  '1.  Page de couverture',
  '2.  Table des matières',
  '3.  Résumé opérationnel',
  '4.  Présentation de l\'équipe fondatrice',
  '5.  Présentation du projet / Description',
  '6.  Étude de marché',
  '7.  Analyse de la demande',
  '8.  Segmentation clientèle',
  '9.  Analyse de la concurrence',
  '10. Stratégie marketing',
  '11. Plan commercial',
  '12. Politique de prix',
  '13. Plan de communication',
  '14. Organisation et management',
  '15. Statut juridique et fiscal',
  '16. Plan de financement',
  '17. Compte de résultat prévisionnel (3 ans)',
  '18. Plan de trésorerie',
  '19. Seuil de rentabilité',
  '20. Investissements',
  '21. Analyse SWOT',
  '22. Calendrier de réalisation / Rétroplanning',
]

// ─── Financial Data ────────────────────────────

const FINANCING_PLAN = [
  { label: 'Apport personnel fondateur', amount: 30_000 },
  { label: 'Prêt d\'honneur Initiative France', amount: 15_000 },
  { label: 'Subvention Région Île-de-France (ADEME)', amount: 25_000 },
  { label: 'Prêt bancaire Bpifrance', amount: 80_000 },
  { label: 'Love money (proches)', amount: 10_000 },
]

const INVESTMENTS = [
  { label: 'Location et aménagement atelier (6 mois)', amount: 18_000 },
  { label: 'Équipement de tri et concassage du verre', amount: 35_000 },
  { label: 'Four de fusion et moules', amount: 42_000 },
  { label: 'Outillage et petit matériel', amount: 8_000 },
  { label: 'Véhicule utilitaire (occasion)', amount: 15_000 },
  { label: 'Développement site web et branding', amount: 6_000 },
  { label: 'Frais de constitution et juridiques', amount: 3_000 },
  { label: 'Trésorerie de départ (3 mois)', amount: 23_000 },
]

const INCOME_STATEMENT = {
  year1: {
    revenue: 180_000,
    purchases: 54_000,
    externalCharges: 22_000,
    salaries: 78_000,
    socialCharges: 25_000,
    depreciation: 12_000,
    financialCharges: 4_800,
    taxRate: 15,
  },
  year2: {
    revenue: 310_000,
    purchases: 86_000,
    externalCharges: 32_000,
    salaries: 104_000,
    socialCharges: 34_000,
    depreciation: 12_000,
    financialCharges: 4_200,
    taxRate: 15,
  },
  year3: {
    revenue: 450_000,
    purchases: 117_000,
    externalCharges: 40_000,
    salaries: 130_000,
    socialCharges: 42_000,
    depreciation: 12_000,
    financialCharges: 3_000,
    taxRate: 15,
  },
}

const TREASURY_MONTHS: { month: string; inflow: number; outflow: number; balance: number }[] = [
  { month: 'Janvier', inflow: 0, outflow: 85000, balance: 50000 },
  { month: 'Février', inflow: 5000, outflow: 15000, balance: 40000 },
  { month: 'Mars', inflow: 8000, outflow: 14000, balance: 34000 },
  { month: 'Avril', inflow: 10000, outflow: 13500, balance: 30500 },
  { month: 'Mai', inflow: 12000, outflow: 13200, balance: 29300 },
  { month: 'Juin', inflow: 14000, outflow: 13000, balance: 30300 },
  { month: 'Juillet', inflow: 15000, outflow: 14500, balance: 30800 },
  { month: 'Août', inflow: 10000, outflow: 12800, balance: 28000 },
  { month: 'Septembre', inflow: 16000, outflow: 13500, balance: 30500 },
  { month: 'Octobre', inflow: 17000, outflow: 14000, balance: 33500 },
  { month: 'Novembre', inflow: 18000, outflow: 14200, balance: 37300 },
  { month: 'Décembre', inflow: 20000, outflow: 15000, balance: 42300 },
]

// ─── Competitors ──────────────────────────────

const COMPETITORS = [
  {
    name: 'Verre & recyclage SAS',
    location: 'Val-de-Marne (94)',
    strength: 'Réseau de collecte bien établi, volume important',
    weakness: 'Pas d\'upcycling, uniquement broyage pour remblais',
    marketShare: '~35%',
  },
  {
    name: 'Vitrocycle Île-de-France',
    location: 'Seine-Saint-Denis (93)',
    strength: 'Certification ISO 14001, grande capacité',
    weakness: 'Prix élevés, délais longs, service impersonnel',
    marketShare: '~25%',
  },
  {
    name: 'RecyGlass Collecte',
    location: 'Yvelines (78)',
    strength: 'Partenariats avec les municipalités',
    weakness: 'Rayon d\'action limité, pas de valeur ajoutée',
    marketShare: '~20%',
  },
]

// ─── SWOT ─────────────────────────────────────

const SWOT = {
  strengths: [
    'Expertise technique de la fondatrice en science des matériaux verriers',
    'Processus d\'upcycling innovant : transformation en produits design à haute valeur ajoutée',
    'Proximité géographique avec les hubs industriels d\'Île-de-France',
    'Approche écoresponsable répondant à la demande croissante des consommateurs',
    'Coûts de matières premières très faibles (déchets de verre collectés gratuitement)',
  ],
  weaknesses: [
    'Structure récente sans historique financier ni notoriété de marque',
    'Capital initial limité, dépendance aux aides et prêts',
    'Équipe restreinte (4 personnes) multipliant les fonctions',
    'Capacité de production limitée en phase de démarrage',
    'Absence de certifications environnementales (en cours d\'obtention)',
  ],
  opportunities: [
    'Réglementation européenne renforcée sur le recyclage (directive PPWD)',
    'Marché de l\'économie circulaire en croissance de +12% par an en France',
    'Demande croissante des collectivités locales pour des filières de revalorisation',
    'Partenariats possibles avec les grands groupes de la restauration et de l\'hôtellerie',
    'Éligibilité à de nombreuses subventions vertes (ADEME, Bpifrance, Région)',
  ],
  threats: [
    'Fluctuation du prix de la tonne de verre recyclé sur les marchés internationaux',
    'Arrivée potentielle de grands groupes industriels sur le segment upcycling',
    'Risque de retard dans l\'obtention des autorisations d\'exploitation',
    'Concurrence sur les prix de la part des filières de recyclage traditionnel',
    'Dépendance à la disponibilité des déchets de verre (approvisionnement)',
  ],
}

// ─── Retroplanning ───────────────────────────

const RETROPLANNING = [
  { phase: 'Phase 1 : Lancement', start: 'Jan 2025', end: 'Mars 2025', tasks: [
    'Constitution de la SAS et ouverture du compte bancaire professionnel',
    'Signature du bail commercial et aménagement de l\'atelier',
    'Commande et installation des équipements de production',
    'Recrutement du responsable commercial et de l\'équipe production',
  ]},
  { phase: 'Phase 2 : Mise en route', start: 'Avr 2025', end: 'Juin 2025', tasks: [
    'Tests de production et validation des procédés d\'upcycling',
    'Création du site web et des supports de communication',
    'Premiers contrats de collecte avec les partenaires industriels',
    'Lancement des ventes sur les marchés et en ligne',
  ]},
  { phase: 'Phase 3 : Développement', start: 'Juil 2025', end: 'Déc 2025', tasks: [
    'Élargissement du réseau de collecte (objectif : 20 partenaires)',
    'Développement d\'une nouvelle gamme de produits (vaisselle design)',
    'Obtention de la certification ISO 14001',
    'Premier bilan financier et ajustements opérationnels',
  ]},
  { phase: 'Phase 4 : Consolidation', start: 'Jan 2026', end: 'Déc 2026', tasks: [
    'Augmentation de la capacité de production (+50%)',
    'Embauche de 2 collaborateurs supplémentaires',
    'Développement du marché B2C (boutique en ligne, marchés de Noël)',
    'Objectif : 310 K€ de chiffre d\'affaires',
  ]},
]

// ─── PDF Builder ──────────────────────────────

async function buildBusinessPlanPdf(fullName: string): Promise<Buffer> {
  return generatePdfBuffer((doc) => {
    // ═══════════════════════════════════════════
    // 1. PAGE DE COUVERTURE
    // ═══════════════════════════════════════════
    drawCoverPage(
      doc,
      'Business Plan Complet',
      'Document de présentation du projet entrepreneurial',
      fullName,
    )

    // ── Extra branding under cover info ──
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.primary)
      .text(BUSINESS.name, 0, doc.y + 2, {
        width: 595.28,
        align: 'center',
      })

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.gray)
      .text(BUSINESS.tagline, 0, doc.y + 2, {
        width: 595.28,
        align: 'center',
      })

    // ═══════════════════════════════════════════
    // 2. TABLE DES MATIÈRES
    // ═══════════════════════════════════════════
    let y = addSectionHeader(doc, 'Table des matières')
    addSpacing(doc, 6)

    for (const section of TOC_SECTIONS) {
      checkNewPage(doc, 20)
      y = addParagraph(doc, section, y, { fontSize: 10, color: COLORS.dark, indent: 0 })
    }

    addSpacing(doc, 20)

    // ═══════════════════════════════════════════
    // 3. RÉSUMÉ OPÉRATIONNEL
    // ═══════════════════════════════════════════
    checkNewPage(doc, 200)
    y = addSectionHeader(doc, '3. Résumé opérationnel')

    y = addParagraph(doc,
      `${BUSINESS.name} est une entreprise innovante spécialisée dans le recyclage et l'upcycling de verre en Île-de-France. Fondée par ${FOUNDER.name}, ingénieure en science des matériaux avec 12 ans d'expérience dans l'industrie verrière, l'entreprise transforme les déchets de verre collectés auprès des industriels, restaurants et collectivités en produits de décoration, vaisselle et mobilier urbain à haute valeur ajoutée.`,
      y,
    )

    y = addParagraph(doc,
      `Le projet répond à un double enjeu : environnemental (réduction des déchets envoyés en décharge, préservation des ressources naturelles) et économique (création d'emplois locaux, développement d'une filière d'économie circulaire). Le marché du recyclage du verre en France représente 3,5 millions de tonnes par an, dont seule une infime partie fait l'objet d'upcycling.`,
      y,
    )

    y = addParagraph(doc,
      `L'entreprise sera constituée en SAS avec un capital social de ${formatCurrency(BUSINESS.capital)}. Le plan de financement prévoit un investissement total de ${formatCurrency(150_000)}, financé par un apport personnel de ${formatCurrency(30_000)}, des subventions (${formatCurrency(40_000)}), un prêt d'honneur (${formatCurrency(15_000)}), et un prêt bancaire (${formatCurrency(80_000)}). Le seuil de rentabilité est atteint au 8e mois d'exploitation avec un CA annuel prévisionnel de ${formatCurrency(INCOME_STATEMENT.year1.revenue)} en année 1.`,
      y,
    )

    addSpacing(doc, 10)

    y = addKeyValueBlock(doc, [
      { key: 'Forme juridique :', value: BUSINESS.legalForm },
      { key: 'Capital social :', value: formatCurrency(BUSINESS.capital) },
      { key: 'Date de création :', value: formatDate(BUSINESS.creationDate) },
      { key: 'Secteur :', value: BUSINESS.sector },
      { key: 'Localisation :', value: BUSINESS.address },
      { key: 'Investissement total :', value: formatCurrency(150_000) },
      { key: 'Rentabilité prévue :', value: 'Mois 8' },
    ], y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 4. PRÉSENTATION DE L'ÉQUIPE FONDATRICE
    // ═══════════════════════════════════════════
    checkNewPage(doc, 300)
    y = addSectionHeader(doc, '4. Présentation de l\'équipe fondatrice')

    y = addSubSectionHeader(doc, 'Fondatrice', y)
    y = addKeyValueBlock(doc, [
      { key: 'Nom :', value: FOUNDER.name },
      { key: 'Rôle :', value: FOUNDER.role },
      { key: 'Formation :', value: FOUNDER.background },
    ], y)
    addSpacing(doc, 4)

    y = addSubSectionHeader(doc, 'Compétences clés', y)
    for (const skill of FOUNDER.skills) {
      y = addBullet(doc, skill, y)
    }
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Équipe complète', y)

    const teamColumns: TableColumn[] = [
      { header: 'Nom', width: 120, align: 'left' },
      { header: 'Fonction', width: 165, align: 'left' },
      { header: 'Expérience', width: 180, align: 'left' },
    ]

    const teamRows: TableRow[] = TEAM.map((m) => ({
      cells: [m.name, m.role, m.experience],
    }))

    y = addTable(doc, teamColumns, teamRows, y)
    addSpacing(doc, 10)

    y = addParagraph(doc,
      'L\'équipe réunit des compétences complémentaires couvrant la production, la R&D, la commercialisation et la gestion. Chaque membre apporte une expérience sectorielle solide et une motivation commune pour l\'économie circulaire. En année 2, l\'effectif devrait passer à 6 personnes avec l\'embauche d\'un technicien de production et d\'un chargé de logistique.',
      y,
    )

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 5. PRÉSENTATION DU PROJET / DESCRIPTION
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '5. Présentation du projet / Description')

    y = addParagraph(doc,
      `${BUSINESS.name} a pour mission de donner une seconde vie au verre en le transformant en objets de décoration, vaisselle, luminaires et mobilier urbain. L'entreprise collecte le verre usagé auprès de divers partenaires (industriels, restaurants, hôtels, collectivités locales) puis le trie, le concasse et le fond dans son atelier de Montreuil pour créer des produits uniques.`,
      y,
    )

    y = addSubSectionHeader(doc, 'Activités principales', y)
    y = addBullet(doc, 'Collecte et tri de déchets de verre auprès de partenaires industriels et commerciaux', y)
    y = addBullet(doc, 'Transformation en produits d\'upcycling design (vaisselle, vases, luminaires, dalles décoratives)', y)
    y = addBullet(doc, 'Vente en B2B aux professionnels de l\'hôtellerie, de la restauration et de la décoration', y)
    y = addBullet(doc, 'Vente en B2C via le site web e-commerce et les marchés locaux', y)
    y = addBullet(doc, 'Prestations de sensibilisation et ateliers de découverte du recyclage créatif', y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Valeur ajoutée', y)
    y = addParagraph(doc,
      'La valeur ajoutée d\'EcoVerre réside dans sa capacité à transformer un déchet à faible coût en produit fini à forte marge. Contrairement au recyclage classique (broyage pour remblais), l\'upcycling conserve la qualité esthétique du verre et la sublime. Chaque pièce est unique, fabriquée artisanalement en France, et contribue activement à la réduction de l\'empreinte carbone.',
      y,
    )
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Localisation', y)
    y = addKeyValueBlock(doc, [
      { key: 'Adresse :', value: BUSINESS.address },
      { key: 'Surface atelier :', value: '250 m²' },
      { key: 'Zone de chalandise :', value: 'Île-de-France (rayon de 50 km)' },
      { key: 'Accessibilité :', value: 'RER A — station Mairie de Montreuil (5 min à pied)' },
    ], y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 6. ÉTUDE DE MARCHÉ
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '6. Étude de marché')

    y = addParagraph(doc,
      'Le marché du recyclage du verre en France est en pleine transformation. Avec 3,5 millions de tonnes de verre collectées chaque année, la France dispose d\'un gisement considérable. Cependant, la majorité du verre recyclé est broyé et utilisé en remblais routiers ou en conteneurs, avec très peu de valorisation sous forme d\'upcycling créatif.',
      y,
    )

    y = addSubSectionHeader(doc, 'Données clés du marché', y)
    y = addBullet(doc, 'Taille du marché français du recyclage du verre : 3,5 Mdt/an (2023)', y)
    y = addBullet(doc, 'Taux de collecte du verre en France : 85% (un des plus élevés d\'Europe)', y)
    y = addBullet(doc, 'Marché de l\'économie circulaire en France : +12% de croissance annuelle', y)
    y = addBullet(doc, 'Segment upcycling / design : marché émergent estimé à 45 M€ en France', y)
    y = addBullet(doc, 'Cible Île-de-France : 12 millions d\'habitants, 850 000 entreprises', y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Tendances et évolutions', y)
    y = addParagraph(doc,
      'Plusieurs tendances favorisent le développement d\'EcoVerre : la directive européenne PPWD (Packaging and Packaging Waste Directive) impose des objectifs de recyclage ambitieux (75% d\'ici 2030), les consommateurs sont de plus en plus sensibles à l\'origine et à la durabilité des produits, et les collectivités locales cherchent activement des filières de revalorisation locales pour réduire leur bilan carbone.',
      y,
    )

    y = addParagraph(doc,
      'Le marché de la décoration éco-responsable est en forte croissance, porté par une clientèle jeune (25-45 ans) et aisée, prête à payer un prix premium pour des produits locaux, durables et uniques. Les professionnels de l\'hôtellerie-restauration (HR) intègrent également des démarches de développement durable dans leur offre, créant une demande B2B croissante.',
      y,
    )

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 7. ANALYSE DE LA DEMANDE
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '7. Analyse de la demande')

    y = addParagraph(doc,
      'La demande pour les produits issus de l\'upcycling du verre est stimulée par plusieurs facteurs convergents : la prise de conscience environnementale des consommateurs, les obligations réglementaires des entreprises en matière de RSE, et l\'engouement pour les produits artisanaux et locaux.',
      y,
    )

    y = addSubSectionHeader(doc, 'Motivations d\'achat des clients', y)
    y = addBullet(doc, 'Engagement écologique : les clients recherchent des produits ayant un impact environnemental positif', y)
    y = addBullet(doc, 'Unicité et esthétique : chaque pièce upcyclée est unique par sa couleur, sa texture et sa forme', y)
    y = addBullet(doc, 'Made in France : l\'attrait pour la fabrication locale et artisanale est en hausse constante', y)
    y = addBullet(doc, 'Conformité RSE : les entreprises doivent intégrer des pratiques durables dans leur chaîne d\'approvisionnement', y)
    y = addBullet(doc, 'Storytelling : le récit de transformation du déchet en objet de valeur crée un attachement émotionnel', y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Volume de demande estimé', y)
    y = addKeyValueBlock(doc, [
      { key: 'Déchets de verre disponibles en IDF :', value: '~500 000 tonnes/an' },
      { key: 'Potentiel d\'upcycling (estimation) :', value: '2 000 tonnes/an' },
      { key: 'Besoins de production Année 1 :', value: '120 tonnes/an' },
      { key: 'Taux de pénétration visé Année 3 :', value: '0,24% du gisement' },
    ], y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 8. SEGMENTATION CLIENTÈLE
    // ═══════════════════════════════════════════
    checkNewPage(doc, 300)
    y = addSectionHeader(doc, '8. Segmentation clientèle')

    y = addParagraph(doc,
      'La clientèle d\'EcoVerre Île-de-France se divise en deux grands segments : le B2B (professionnels) et le B2C (particuliers). Chaque segment dispose de caractéristiques, besoins et canaux de distribution distincts.',
      y,
    )
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Segment B2B — Professionnels (60% du CA)', y)

    const segB2BCols: TableColumn[] = [
      { header: 'Sous-segment', width: 130, align: 'left' },
      { header: 'Besoin principal', width: 200, align: 'left' },
      { header: 'Part du CA', width: 80, align: 'right' },
      { header: 'Potentiel', width: 75, align: 'center' },
    ]

    const segB2BRows: TableRow[] = [
      { cells: ['Hôtellerie-restauration', 'Vaisselle, verrerie, décorations', '25%', '★★★★'], fillColor: '#E8F5E9' },
      { cells: ['Bureaux & entreprises', 'Luminaires, aménagements, cadeaux', '15%', '★★★☆'], fillColor: '#E8F5E9' },
      { cells: ['Collectivités locales', 'Mobilier urbain, signalétique', '12%', '★★★★'], fillColor: '#E8F5E9' },
      { cells: ['Architectes & décorateurs', 'Dalles, cloisons, sur-mesure', '8%', '★★★☆'], fillColor: '#E8F5E9' },
    ]

    y = addTable(doc, segB2BCols, segB2BRows, y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Segment B2C — Particuliers (40% du CA)', y)

    const segB2CCols: TableColumn[] = [
      { header: 'Profil', width: 140, align: 'left' },
      { header: 'Produits recherchés', width: 170, align: 'left' },
      { header: 'Part du CA', width: 80, align: 'right' },
      { header: 'Canal', width: 95, align: 'left' },
    ]

    const segB2CRows: TableRow[] = [
      { cells: ['Éco-consommateurs (25-45 ans)', 'Vases, luminaires, objets déco', '20%', 'E-commerce, marchés'] },
      { cells: ['Cadeaux & mariage', 'Coffrets, verres personnalisés', '10%', 'E-commerce, pop-up'] },
      { cells: ['Touristes & curieux', 'Souvenirs locaux, ateliers', '10%', 'Atelier, marchés'] },
    ]

    y = addTable(doc, segB2CCols, segB2CRows, y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 9. ANALYSE DE LA CONCURRENCE
    // ═══════════════════════════════════════════
    checkNewPage(doc, 300)
    y = addSectionHeader(doc, '9. Analyse de la concurrence')

    y = addParagraph(doc,
      'Le paysage concurrentiel du recyclage du verre en Île-de-France est dominé par quelques acteurs historiques spécialisés dans le broyage et le recyclage classique. Cependant, aucun d\'entre eux ne propose d\'offre d\'upcycling créatif positionnée sur le segment design et décoration. Cette absence constitue un avantage concurrentiel majeur pour EcoVerre.',
      y,
    )
    addSpacing(doc, 8)

    const compColumns: TableColumn[] = [
      { header: 'Concurrent', width: 120, align: 'left' },
      { header: 'Localisation', width: 90, align: 'left' },
      { header: 'Force', width: 145, align: 'left' },
      { header: 'Faiblesse', width: 145, align: 'left' },
    ]

    const compRows: TableRow[] = COMPETITORS.map((c) => ({
      cells: [c.name, c.location, c.strength, c.weakness],
    }))

    y = addTable(doc, compColumns, compRows, y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Avantages concurrentiels d\'EcoVerre', y)
    y = addBullet(doc, 'Positionnement unique : seul acteur upcycling design sur le marché Île-de-France', y)
    y = addBullet(doc, 'Marge élevée : transformation d\'un déchet (coût quasi nul) en produit premium (marge 65-75%)', y)
    y = addBullet(doc, 'Proximité clients : atelier en petite couronne parisienne, livraison rapide', y)
    y = addBullet(doc, 'Innovation R&D : développement continu de nouveaux produits et procédés', y)
    y = addBullet(doc, 'Storytelling puissant : chaque produit porte l\'histoire de sa transformation', y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 10. STRATÉGIE MARKETING
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '10. Stratégie marketing')

    y = addParagraph(doc,
      'La stratégie marketing d\'EcoVerre repose sur un positionnement haut de gamme axé sur la durabilité, le design et l\'artisanat français. L\'entreprise vise à devenir la référence de l\'upcycling verrier en Île-de-France en combinant une présence digitale forte et un ancrage local solide.',
      y,
    )

    y = addSubSectionHeader(doc, 'Positionnement', y)
    y = addKeyValueBlock(doc, [
      { key: 'Promesse :', value: 'Transformer le verre en beauté, localement et durablement' },
      { key: 'Cible principale :', value: 'Professionnels éco-responsables et consommateurs engagés' },
      { key: 'Position prix :', value: 'Milieu-haut de gamme (produits artisanaux, fabrication française)' },
      { key: 'Différenciateur :', value: 'Upcycling créatif (vs. recyclage broyage des concurrents)' },
    ], y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Piliers de la stratégie', y)
    y = addBullet(doc, 'Storytelling : communiquer l\'histoire de chaque produit, du déchet à l\'objet d\'art', y)
    y = addBullet(doc, 'Transparence : publier le bilan environnemental (kg CO₂ évités, tonnes recyclées)', y)
    y = addBullet(doc, 'Partenariats : collaborer avec des architectes, décorateurs et influenceurs éco-responsables', y)
    y = addBullet(doc, 'Expérience client : proposer des visites d\'atelier et des ateliers créatifs', y)
    y = addBullet(doc, 'Certifications : obtenir la mention Entreprise à Mission et l\'ISO 14001 dès que possible', y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 11. PLAN COMMERCIAL
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '11. Plan commercial')

    y = addParagraph(doc,
      'Le plan commercial s\'articule autour de deux axes complémentaires : le développement des ventes B2B via une approche terrain et le développement des ventes B2C via le canal digital.',
      y,
    )

    y = addSubSectionHeader(doc, 'Objectifs commerciaux', y)
    y = addKeyValueBlock(doc, [
      { key: 'Année 1 :', value: 'CA ' + formatCurrency(180_000) + ' — 25 clients B2B, 500 clients B2C' },
      { key: 'Année 2 :', value: 'CA ' + formatCurrency(310_000) + ' — 50 clients B2B, 1 200 clients B2C' },
      { key: 'Année 3 :', value: 'CA ' + formatCurrency(450_000) + ' — 80 clients B2B, 2 500 clients B2C' },
    ], y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Actions commerciales B2B', y)
    y = addBullet(doc, 'Prospection ciblée : 100 entreprises HR contactées par trimestre via LinkedIn et téléphone', y)
    y = addBullet(doc, 'Démonstrations produits : envoi d\'échantillons personnalisés aux décideurs', y)
    y = addBullet(doc, 'Présence salons : participer à Equip\u2019Hôtel, Paris Design Week, et salons RSE', y)
    y = addBullet(doc, 'Partenariats distributeurs : collaborer avec des concept-stores éco-responsables', y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Actions commerciales B2C', y)
    y = addBullet(doc, 'Site e-commerce : catalogue en ligne avec personnalisation (gravure, couleur)', y)
    y = addBullet(doc, 'Réseaux sociaux : Instagram et TikTok (tuto upcycling, before/after, coulisses)', y)
    y = addBullet(doc, 'Marchés locaux : présence hebdomadaire sur 3 marchés en petite couronne', y)
    y = addBullet(doc, 'Ateliers découverte : 2 ateliers par mois dans l\'atelier de Montreuil (15 pers./session)', y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 12. POLITIQUE DE PRIX
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '12. Politique de prix')

    y = addParagraph(doc,
      'La politique de prix d\'EcoVerre repose sur une stratégie de différenciation par la valeur. Les produits upcyclés sont positionnés en gamme moyenne-haute, reflétant leur caractère artisanal, unique et éco-responsable. Les coûts de matières premières étant très faibles (déchets gratuits), la marge brute est élevée, ce qui permet d\'absorber les charges de production et de développer la rentabilité.',
      y,
    )
    addSpacing(doc, 8)

    const priceColumns: TableColumn[] = [
      { header: 'Produit', width: 180, align: 'left' },
      { header: 'Prix unitaire HT', width: 110, align: 'right' },
      { header: 'Coût de production', width: 110, align: 'right' },
      { header: 'Marge brute', width: 85, align: 'center' },
    ]

    const priceRows: TableRow[] = [
      { cells: ['Set de 6 verres upcyclés', '45 €', '12 €', '73%'], fillColor: '#E8F5E9' },
      { cells: ['Vase artisanal moyen', '65 €', '15 €', '77%'], fillColor: '#E8F5E9' },
      { cells: ['Luminaire suspension', '120 €', '28 €', '77%'], fillColor: '#E8F5E9' },
      { cells: ['Dalle décorative (30×30)', '55 €', '10 €', '82%'], fillColor: '#E8F5E9' },
      { cells: ['Coffret cadeau personnalisé', '35 €', '8 €', '77%'], fillColor: '#E8F5E9' },
      { cells: ['Mobilier urbain (sur devis)', 'Sur devis', '~200 €', '65%'], fillColor: '#E8F5E9' },
      { cells: ['Atelier découverte (pers.)', '25 €', '5 €', '80%'], fillColor: '#E8F5E9' },
    ]

    y = addTable(doc, priceColumns, priceRows, y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Stratégie de prix', y)
    y = addBullet(doc, 'Prix premium justifié par l\'artisanat, l\'unicité et l\'engagement éco-responsable', y)
    y = addBullet(doc, 'Remises quantité B2B : -10% dès 20 unités, -20% dès 50 unités', y)
    y = addBullet(doc, 'Tarifs dégressifs pour les contrats de collecte annuels avec les industriels', y)
    y = addBullet(doc, 'Prix d\'appel lors du lancement : -15% sur la première commande B2B', y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 13. PLAN DE COMMUNICATION
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '13. Plan de communication')

    y = addParagraph(doc,
      'Le plan de communication vise à construire la notoriété d\'EcoVerre en ligne et hors ligne, en valorisant l\'histoire de la marque, les coulisses de la production et l\'impact environnemental mesurable de chaque produit.',
      y,
    )
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Axes de communication', y)
    y = addBullet(doc, 'Identité visuelle : logo, charte graphique et packaging éco-conçus (carton recyclé, encre végétale)', y)
    y = addBullet(doc, 'Site web : vitrine e-commerce avec blog (tutoriels, interviews, bilan environnemental)', y)
    y = addBullet(doc, 'Réseaux sociaux : Instagram (3 publications/semaine), TikTok (2 vidéos/semaine), LinkedIn (B2B)', y)
    y = addBullet(doc, 'Relations presse : communiqués de lancement, partenariats avec médias éco-responsables', y)
    y = addBullet(doc, 'Événements : participation à 6 salons/marchés par an, organisation de portes ouvertes trimestrielles', y)
    y = addBullet(doc, 'Newsletters : mensuelle pour les clients B2C, trimestrielle pour les prospects B2B', y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Budget communication Année 1', y)
    y = addKeyValueBlock(doc, [
      { key: 'Site web + e-commerce :', value: formatCurrency(6_000) },
      { key: 'Réseaux sociaux (contenu) :', value: formatCurrency(3_000) },
      { key: 'Salons et événements :', value: formatCurrency(4_000) },
      { key: 'Print et goodies éco-conçus :', value: formatCurrency(2_000) },
      { key: 'Total :', value: formatCurrency(15_000) },
    ], y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 14. ORGANISATION ET MANAGEMENT
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '14. Organisation et management')

    y = addParagraph(doc,
      'L\'organisation d\'EcoVerre est structurée pour garantir l\'efficacité opérationnelle tout en conservant la flexibilité d\'une startup. L\'équipe fondatrice assure les fonctions clés en phase de lancement, avec un plan de recrutement progressif en fonction de la croissance du chiffre d\'affaires.',
      y,
    )
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Organigramme', y)
    y = addBullet(doc, 'Direction Générale : ' + FOUNDER.name + ' — stratégie, R&D, relations partenaires', y)
    y = addBullet(doc, 'Direction Commerciale : Thomas Laurent — prospection B2B/B2C, suivi clients, salons', y)
    y = addBullet(doc, 'R&D : Fatima Benali — développement produits, tests qualité, innovation procédés', y)
    y = addBullet(doc, 'Production : Lucas Moreau — gestion atelier, approvisionnement, maintenance équipements', y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Plan de recrutement', y)
    y = addKeyValueBlock(doc, [
      { key: 'Année 1 :', value: '4 personnes (équipe fondatrice)' },
      { key: 'Année 2 :', value: '6 personnes (+1 technicien production, +1 logistique)' },
      { key: 'Année 3 :', value: '8 personnes (+1 commercial, +1 community manager)' },
    ], y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Outils et méthodes', y)
    y = addBullet(doc, 'ERP : Odoo (gestion stock, commandes, comptabilité, CRM)', y)
    y = addBullet(doc, 'Communication interne : Slack + visio hebdomadaire d\'équipe', y)
    y = addBullet(doc, 'Gestion de projet : Notion (kanban, suivi des tâches, documentation)', y)
    y = addBullet(doc, 'Méthode de production : Lean Manufacturing (réduction des gaspillages, amélioration continue)', y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 15. STATUT JURIDIQUE ET FISCAL
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '15. Statut juridique et fiscal')

    y = addParagraph(doc,
      'Le choix de la SAS (Société par Actions Simplifiée) a été motivé par sa flexibilité statutaire, la protection du patrimoine personnel de la fondatrice, et la possibilité d\'intégrer facilement de nouveaux associés ou investisseurs. L\'entreprise bénéficiera du régime fiscal des PME et d\'allègements en tant que jeune entreprise innovante.',
      y,
    )
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Détails juridiques', y)
    y = addKeyValueBlock(doc, [
      { key: 'Forme :', value: 'SAS (Société par Actions Simplifiée)' },
      { key: 'Capital social :', value: formatCurrency(BUSINESS.capital) },
      { key: 'Associé unique :', value: FOUNDER.name + ' (100% des parts)' },
      { key: 'Gérance :', value: 'Présidente-directrice générale (PDG)' },
      { key: 'SIRET :', value: BUSINESS.siret },
      { key: 'Code NAF :', value: '3832Z — Récupération de déchets triés' },
    ], y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Régime fiscal et social', y)
    y = addBullet(doc, 'Impôt sur les sociétés (IS) : taux réduit à 15% jusqu\'à 42 500 € de bénéfice', y)
    y = addBullet(doc, 'TVA : taux normal 20% sur les ventes de produits finis', y)
    y = addBullet(doc, 'CVAE/CFE : exonération partielle en zone franche urbaine (Montreuil ZFU)', y)
    y = addBullet(doc, 'Régime social du dirigeant : assimilé-salarié (protection sociale complète)', y)
    y = addBullet(doc, 'Aides à l\'embauche : réductions Fillon, aide unique TPE/PME pour les 2 premiers salariés', y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Assurances', y)
    y = addBullet(doc, 'Responsabilité civile professionnelle : couverture des dommages causés aux tiers', y)
    y = addBullet(doc, 'Assurance multirisque atelier : incendie, dégât des eaux, vol d\'équipements', y)
    y = addBullet(doc, 'Assurance véhicule professionnel : pour les tournées de collecte', y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 16. PLAN DE FINANCEMENT
    // ═══════════════════════════════════════════
    checkNewPage(doc, 280)
    y = addSectionHeader(doc, '16. Plan de financement')

    y = addParagraph(doc,
      'Le plan de financement prévoit un investissement total de ' + formatCurrency(150_000) + ' pour lancer l\'activité. Les besoins de financement couvrent l\'aménagement de l\'atelier, l\'acquisition des équipements de production, le développement du site web, les frais de constitution et une trésorerie de sécurité de 3 mois.',
      y,
    )
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Tableau de financement — Ressources', y)

    const finResCols: TableColumn[] = [
      { header: 'Source de financement', width: 280, align: 'left' },
      { header: 'Montant', width: 145, align: 'right' },
      { header: 'Part', width: 60, align: 'center' },
    ]

    const totalResources = FINANCING_PLAN.reduce((s, f) => s + f.amount, 0)
    const finResRows: TableRow[] = FINANCING_PLAN.map((f) => ({
      cells: [f.label, formatCurrency(f.amount), formatPercent((f.amount / totalResources) * 100)],
    }))
    finResRows.push({
      cells: ['TOTAL RESSOURCES', formatCurrency(totalResources), '100%'],
      fillColor: COLORS.primary,
      textColor: COLORS.white,
    })

    y = addTable(doc, finResCols, finResRows, y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Tableau de financement — Besoins', y)

    const finNeedCols: TableColumn[] = [
      { header: 'Poste d\'investissement', width: 280, align: 'left' },
      { header: 'Montant', width: 145, align: 'right' },
      { header: 'Part', width: 60, align: 'center' },
    ]

    const totalNeeds = INVESTMENTS.reduce((s, i) => s + i.amount, 0)
    const finNeedRows: TableRow[] = INVESTMENTS.map((i) => ({
      cells: [i.label, formatCurrency(i.amount), formatPercent((i.amount / totalNeeds) * 100)],
    }))
    finNeedRows.push({
      cells: ['TOTAL BESOINS', formatCurrency(totalNeeds), '100%'],
      fillColor: COLORS.primary,
      textColor: COLORS.white,
    })

    y = addTable(doc, finNeedCols, finNeedRows, y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 17. COMPTE DE RÉSULTAT PRÉVISIONNEL (3 ans)
    // ═══════════════════════════════════════════
    checkNewPage(doc, 300)
    y = addSectionHeader(doc, '17. Compte de résultat prévisionnel (3 ans)')

    y = addParagraph(doc,
      'Le compte de résultat prévisionnel sur 3 ans montre une trajectoire de croissance rapide, avec un passage à la rentabilité dès le second semestre de l\'année 1. Le chiffre d\'affaires passe de 180 000 € en année 1 à 450 000 € en année 3, soit une croissance annuelle composée de +58%.',
      y,
    )
    addSpacing(doc, 8)

    const crCols: TableColumn[] = [
      { header: 'Rubrique', width: 200, align: 'left' },
      { header: 'Année 1', width: 90, align: 'right' },
      { header: 'Année 2', width: 90, align: 'right' },
      { header: 'Année 3', width: 95, align: 'right' },
    ]

    function calcIncomeRow(label: string, y1: number, y2: number, y3: number, opts?: { isBold?: boolean; isTotal?: boolean; color?: string }): TableRow {
      return {
        cells: [label, formatCurrency(y1), formatCurrency(y2), formatCurrency(y3)],
        fillColor: opts?.isTotal ? (y3 >= 0 ? '#E8F5E9' : '#FFEBEE') : undefined,
        textColor: opts?.color ?? COLORS.dark,
      }
    }

    const yr1 = INCOME_STATEMENT.year1
    const yr2 = INCOME_STATEMENT.year2
    const yr3 = INCOME_STATEMENT.year3

    const crRows: TableRow[] = [
      calcIncomeRow('Chiffre d\'affaires', yr1.revenue, yr2.revenue, yr3.revenue),
      calcIncomeRow('Coût des achats (matières)', -yr1.purchases, -yr2.purchases, -yr3.purchases, { color: COLORS.gray }),
      calcIncomeRow('Charges externes', -yr1.externalCharges, -yr2.externalCharges, -yr3.externalCharges, { color: COLORS.gray }),
      calcIncomeRow('Valeur ajoutée',
        yr1.revenue - yr1.purchases - yr1.externalCharges,
        yr2.revenue - yr2.purchases - yr2.externalCharges,
        yr3.revenue - yr3.purchases - yr3.externalCharges,
      ),
      calcIncomeRow('Salaires et charges sociales', -(yr1.salaries + yr1.socialCharges), -(yr2.salaries + yr2.socialCharges), -(yr3.salaries + yr3.socialCharges), { color: COLORS.gray }),
      calcIncomeRow('EBE (Excédent brut d\'exploitation)',
        yr1.revenue - yr1.purchases - yr1.externalCharges - yr1.salaries - yr1.socialCharges,
        yr2.revenue - yr2.purchases - yr2.externalCharges - yr2.salaries - yr2.socialCharges,
        yr3.revenue - yr3.purchases - yr3.externalCharges - yr3.salaries - yr3.socialCharges,
      ),
      calcIncomeRow('Dotation aux amortissements', -yr1.depreciation, -yr2.depreciation, -yr3.depreciation, { color: COLORS.gray }),
      calcIncomeRow('Charges financières', -yr1.financialCharges, -yr2.financialCharges, -yr3.financialCharges, { color: COLORS.gray }),
    ]

    const ebitY1 = yr1.revenue - yr1.purchases - yr1.externalCharges - yr1.salaries - yr1.socialCharges - yr1.depreciation - yr1.financialCharges
    const ebitY2 = yr2.revenue - yr2.purchases - yr2.externalCharges - yr2.salaries - yr2.socialCharges - yr2.depreciation - yr2.financialCharges
    const ebitY3 = yr3.revenue - yr3.purchases - yr3.externalCharges - yr3.salaries - yr3.socialCharges - yr3.depreciation - yr3.financialCharges

    crRows.push(calcIncomeRow('Résultat avant impôt (EBIT)', ebitY1, ebitY2, ebitY3, { isBold: true }))

    const taxY1 = ebitY1 > 0 ? Math.round(ebitY1 * yr1.taxRate / 100) : 0
    const taxY2 = ebitY2 > 0 ? Math.round(ebitY2 * yr2.taxRate / 100) : 0
    const taxY3 = ebitY3 > 0 ? Math.round(ebitY3 * yr3.taxRate / 100) : 0

    crRows.push(calcIncomeRow('Impôt sur les sociétés', -taxY1, -taxY2, -taxY3, { color: COLORS.gray }))
    crRows.push(calcIncomeRow('RÉSULTAT NET', ebitY1 - taxY1, ebitY2 - taxY2, ebitY3 - taxY3, { isBold: true, isTotal: true, color: (ebitY3 - taxY3) >= 0 ? COLORS.success : COLORS.danger }))

    y = addTable(doc, crCols, crRows, y)
    addSpacing(doc, 8)

    // Ratios
    y = addSubSectionHeader(doc, 'Ratios clés', y)
    const marginY1 = ebitY1 - taxY1
    const marginY2 = ebitY2 - taxY2
    const marginY3 = ebitY3 - taxY3
    y = addKeyValueBlock(doc, [
      { key: 'Marge nette Année 1 :', value: formatPercent((marginY1 / yr1.revenue) * 100) },
      { key: 'Marge nette Année 2 :', value: formatPercent((marginY2 / yr2.revenue) * 100) },
      { key: 'Marge nette Année 3 :', value: formatPercent((marginY3 / yr3.revenue) * 100) },
    ], y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 18. PLAN DE TRÉSORERIE
    // ═══════════════════════════════════════════
    checkNewPage(doc, 300)
    y = addSectionHeader(doc, '18. Plan de trésorerie')

    y = addParagraph(doc,
      'Le plan de trésorerie ci-dessous présente les flux mensuels prévisionnels de la première année d\'exploitation. La trésorerie de départ de 50 000 € correspond aux fonds levés diminués des investissements immédiats. Le mois de janvier concentre les sorties les plus importantes (aménagement atelier, équipements). La trésorerie reste positive tout au long de l\'année.',
      y,
    )
    addSpacing(doc, 8)

    const tresCols: TableColumn[] = [
      { header: 'Mois', width: 90, align: 'left' },
      { header: 'Encaissements', width: 105, align: 'right' },
      { header: 'Décaissements', width: 105, align: 'right' },
      { header: 'Solde cumulé', width: 125, align: 'right' },
    ]

    const tresRows: TableRow[] = TREASURY_MONTHS.map((m) => ({
      cells: [
        m.month,
        formatCurrency(m.inflow),
        formatCurrency(m.outflow),
        formatCurrency(m.balance),
      ],
      textColor: m.balance >= 25000 ? COLORS.success : m.balance >= 15000 ? COLORS.warning : COLORS.danger,
    }))

    y = addTable(doc, tresCols, tresRows, y)
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Points de vigilance', y)
    y = addBullet(doc, 'Janvier : concentration des investissements (85 000 € de sorties) — nécessite une trésorerie de départ suffisante', y)
    y = addBullet(doc, 'Août : baisse saisonnière des ventes B2B (congés) — compenser par les ventes B2C en ligne', y)
    y = addBullet(doc, 'Toujours maintenir un minimum de 3 mois de charges en trésorerie de sécurité', y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 19. SEUIL DE RENTABILITÉ
    // ═══════════════════════════════════════════
    checkNewPage(doc, 260)
    y = addSectionHeader(doc, '19. Seuil de rentabilité')

    y = addParagraph(doc,
      'Le seuil de rentabilité représente le niveau de chiffre d\'affaires à partir duquel l\'entreprise couvre l\'ensemble de ses charges (fixes et variables) et commence à générer du bénéfice.',
      y,
    )
    addSpacing(doc, 8)

    y = addSubSectionHeader(doc, 'Hypothèses de calcul', y)
    y = addKeyValueBlock(doc, [
      { key: 'Charges fixes mensuelles :', value: formatCurrency(11_500) + ' (loyer, salaires, amortissements, assurances)' },
      { key: 'Taux de charges variables :', value: '50% du CA (matières, transport, emballages)' },
      { key: 'Taux de marge sur coûts variables :', value: '50%' },
    ], y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Résultats', y)
    y = addKeyValueBlock(doc, [
      { key: 'Seuil de rentabilité (CA mensuel) :', value: formatCurrency(23_000) },
      { key: 'Seuil de rentabilité (CA annuel) :', value: formatCurrency(276_000) },
      { key: 'Date d\'atteinte :', value: 'Mois 8 (août 2025)' },
      { key: 'CA prévisionnel Année 1 :', value: formatCurrency(180_000) + ' (équivalent 7,8 mois de charges)' },
      { key: 'Marge de sécurité :', value: 'Le seuil annuel est atteint dès Année 2 (CA prévu : 310 000 €)' },
    ], y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Interprétation', y)
    y = addParagraph(doc,
      'Le seuil de rentabilité mensuel est atteint dès le 8e mois d\'exploitation, ce qui est un excellent signal pour une startup en création. En année 2, avec un CA prévisionnel de 310 000 € dépassant largement le seuil de 276 000 €, l\'entreprise dégage un résultat net significatif. La priorité est d\'accélérer la montée en production les 7 premiers mois pour limiter les pertes initiales.',
      y,
      { color: COLORS.success },
    )

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 20. INVESTISSEMENTS
    // ═══════════════════════════════════════════
    checkNewPage(doc, 280)
    y = addSectionHeader(doc, '20. Investissements')

    y = addParagraph(doc,
      'Le plan d\'investissement couvre l\'ensemble des dépenses nécessaires au démarrage de l\'activité : aménagement de l\'atelier, équipements de production, véhicule, développement digital et trésorerie de sécurité. L\'investissement total s\'élève à ' + formatCurrency(totalNeeds) + '.',
      y,
    )
    addSpacing(doc, 8)

    const invCols: TableColumn[] = [
      { header: 'Poste d\'investissement', width: 300, align: 'left' },
      { header: 'Montant HT', width: 125, align: 'right' },
    ]

    const invRows: TableRow[] = INVESTMENTS.map((i) => ({
      cells: [i.label, formatCurrency(i.amount)],
    }))
    invRows.push({
      cells: ['TOTAL INVESTISSEMENTS', formatCurrency(totalNeeds)],
      fillColor: COLORS.primary,
      textColor: COLORS.white,
    })

    y = addTable(doc, invCols, invRows, y)
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Plan d\'amortissement', y)
    y = addKeyValueBlock(doc, [
      { key: 'Équipements de production :', value: 'Amortissement linéaire sur 5 ans (' + formatCurrency(Math.round((35_000 + 42_000) / 5)) + '/an)' },
      { key: 'Véhicule utilitaire :', value: 'Amortissement linéaire sur 5 ans (' + formatCurrency(Math.round(15_000 / 5)) + '/an)' },
      { key: 'Total dotations annuelles :', value: formatCurrency(yr1.depreciation) },
    ], y)

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 21. ANALYSE SWOT
    // ═══════════════════════════════════════════
    checkNewPage(doc, 360)
    y = addSectionHeader(doc, '21. Analyse SWOT')

    y = addParagraph(doc,
      'L\'analyse SWOT ci-dessous synthétise les forces, faiblesses, opportunités et menaces identifiées pour le projet EcoVerre Île-de-France. Elle constitue un outil d\'aide à la décision et à la stratégie.',
      y,
    )
    addSpacing(doc, 8)

    // Strengths
    y = addSubSectionHeader(doc, 'Forces (Strengths)', y)
    for (const s of SWOT.strengths) {
      checkNewPage(doc, 20)
      y = addBullet(doc, s, y)
    }
    addSpacing(doc, 10)

    // Weaknesses
    checkNewPage(doc, 120)
    y = addSubSectionHeader(doc, 'Faiblesses (Weaknesses)', y)
    for (const w of SWOT.weaknesses) {
      checkNewPage(doc, 20)
      y = addBullet(doc, w, y)
    }
    addSpacing(doc, 10)

    // Opportunities
    checkNewPage(doc, 120)
    y = addSubSectionHeader(doc, 'Opportunités (Opportunities)', y)
    for (const o of SWOT.opportunities) {
      checkNewPage(doc, 20)
      y = addBullet(doc, o, y)
    }
    addSpacing(doc, 10)

    // Threats
    checkNewPage(doc, 120)
    y = addSubSectionHeader(doc, 'Menaces (Threats)', y)
    for (const t of SWOT.threats) {
      checkNewPage(doc, 20)
      y = addBullet(doc, t, y)
    }
    addSpacing(doc, 10)

    y = addSubSectionHeader(doc, 'Synthèse stratégique', y)
    y = addParagraph(doc,
      'Les forces (expertise technique, coût des matières premières) et les opportunités (cadre réglementaire favorable, marché en croissance) dominent largement les faiblesses et menaces. Le positionnement unique d\'EcoVerre sur l\'upcycling créatif constitue un moat protecteur face aux concurrents traditionnels. La clé du succès réside dans l\'exécution rapide du plan de lancement et la constitution d\'un réseau de collecte solide dès les premiers mois.',
      y,
    )

    addSpacing(doc, 16)

    // ═══════════════════════════════════════════
    // 22. CALENDRIER DE RÉALISATION / RÉTROPLANNING
    // ═══════════════════════════════════════════
    checkNewPage(doc, 360)
    y = addSectionHeader(doc, '22. Calendrier de réalisation / Rétroplanning')

    y = addParagraph(doc,
      'Le rétroplanning ci-dessous détaille les grandes phases du projet sur 24 mois, avec les tâches clés et les échéances associées. Ce calendrier est indicatif et sera ajusté en fonction des réalités du terrain et des aléas de démarrage.',
      y,
    )
    addSpacing(doc, 8)

    for (const phase of RETROPLANNING) {
      checkNewPage(doc, 120)
      y = addSubSectionHeader(doc, `${phase.phase} (${phase.start} — ${phase.end})`, y)
      for (const task of phase.tasks) {
        checkNewPage(doc, 20)
        y = addBullet(doc, task, y)
      }
      addSpacing(doc, 10)
    }

    addSpacing(doc, 12)

    // ── Closing notice ──
    checkNewPage(doc, 80)
    y = addSectionHeader(doc, 'À propos de ce document')

    y = addParagraph(doc,
      'Ce business plan a été généré automatiquement par la plateforme CreaPulse V2 dans le cadre de la démonstration. Les données présentées sont fictives et destinées exclusivement à illustrer le format et le contenu d\'un business plan complet. Pour tout projet réel, veuillez valider les hypothèses avec votre conseiller GIDEF Île-de-France.',
      y,
      { fontSize: 8, color: COLORS.gray },
    )

    addSpacing(doc, 8)

    y = addParagraph(doc,
      '© CreaPulse V2 — GIDEF Île-de-France — Document de démonstration',
      y,
      { fontSize: 8, color: COLORS.gray },
    )

    // ═══════════════════════════════════════════
    // FINALIZE — Add footers to all content pages
    // ═══════════════════════════════════════════
    finalizeWithFooters(doc)
  })
}

// ─── Route Handler ────────────────────────────

export async function GET() {
  console.error('[DemoBusinessPlan] Request received')

  try {
    // Try to fetch the demo user's real name from DB
    let fullName = 'Marie Dupont' // fallback name

    try {
      // Dynamic import to avoid issues if DB module is unavailable
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({
        where: { id: DEMO_USER_ID },
        select: { firstName: true, lastName: true },
      })
      if (user) {
        fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Marie Dupont'
      }
      console.error(`[DemoBusinessPlan] Demo user found: ${fullName}`)
    } catch (dbErr) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      console.error(`[DemoBusinessPlan] DB unavailable, using fallback name: ${errMsg}`)
      // Continue with fallback data — generate the PDF anyway
    }

    // Generate the PDF
    const pdfBuffer = await buildBusinessPlanPdf(fullName)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="business-plan-complet-ecoverre.pdf"',
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[DemoBusinessPlan] Generation failed: ${message}`)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PDF_GENERATION_ERROR',
          message: `Impossible de générer le business plan PDF : ${message}`,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
