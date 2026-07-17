// ============================================
// CreaPulse — CreaScope Demo Seed
// Scénario : "Transports et livraison du dernier kilomètre — Micro-entreprise"
// Bénéficiaire : Karim Benali
// Conseiller : Sophie Martin
// Run:
//   DATABASE_URL="postgresql://z@127.0.0.1:5432/creapulse" npx tsx prisma/seed-creascope-demo.ts
// ============================================

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Force-read DATABASE_URL from .env (ignore shell cache) ─────────
const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
const envLine = envContent
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="));
const DATABASE_URL =
  envLine?.replace(/^DATABASE_URL=/, "").trim() ??
  "postgresql://z@127.0.0.1:5432/creapulse";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

// ─── Helpers ─────────────────────────────────────────────────────────
function d(dateStr: string): Date {
  return new Date(dateStr);
}

// ─── MAIN ────────────────────────────────────────────────────────────
(async () => {
  console.log("🌱 CreaScope Demo Seed — Starting...\n");
  console.log("📦 DATABASE_URL:", DATABASE_URL.replace(/\/\/.*@/, "//***@"));

  // ══════════════════════════════════════════════════════════════════
  // 1. TENANT
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[1/24] Creating Tenant...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "GIDEF Île-de-France",
      slug: "gidef-idf",
      plan: "ENTERPRISE",
      primaryColor: "#00838F",
      isActive: true,
      settings: { theme: "gidef", features: ["creascope", "paa"] },
    },
  });
  console.log("   ✅ Tenant:", tenant.id, tenant.name);

  // ══════════════════════════════════════════════════════════════════
  // 2. ORGANIZATION
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[2/24] Creating Organization...");
  const org = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: "GIDEF Île-de-France — Agence de Pantin",
      type: "GIDEF_AGENCY",
      city: "Pantin",
      postalCode: "93500",
      region: "Île-de-France",
      siret: "12345678900012",
      phone: "01 48 46 50 00",
      email: "contact@gidef-idf.fr",
      website: "https://www.gidef-idf.fr",
      isActive: true,
    },
  });
  console.log("   ✅ Organization:", org.id, org.name);

  // ══════════════════════════════════════════════════════════════════
  // 3. DISPOSITIF
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[3/24] Creating Dispositif (CreaScope)...");
  const dispositif = await prisma.dispositif.create({
    data: {
      tenantId: tenant.id,
      code: "creascope",
      name: "CréaScope",
      description:
        "Parcours diagnostic créateur — Pipeline 3-4h avec conseiller",
      type: "DIAGNOSTIC",
      color: "#E65100",
      icon: "Search",
      durationDays: 90,
      moduleConfig: JSON.stringify({
        include: [
          "vision",
          "bmc",
          "marche",
          "juridique",
          "financier",
          "tremplin",
          "zero-draft",
          "creascope",
        ],
        exclude: [],
      }),
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log("   ✅ Dispositif:", dispositif.id, dispositif.code);

  // ══════════════════════════════════════════════════════════════════
  // 4. USER — STUDENT (Karim Benali)
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[4/24] Creating Student User (Karim Benali)...");
  const student = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "karim.benali@demo-creapulse.fr",
      passwordHash: "$2b$10$placeholder_hash_for_demo",
      firstName: "Karim",
      lastName: "Benali",
      role: "BENEFICIARY",
      isActive: true,
      emailVerified: true,
      lastLoginAt: d("2025-07-12T09:30:00Z"),
    },
  });
  console.log("   ✅ Student:", student.id, student.firstName, student.lastName);

  // ══════════════════════════════════════════════════════════════════
  // 5. BENEFICIARY PROFILE
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[5/24] Creating Beneficiary Profile...");
  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId: student.id,
      organizationId: org.id,
      employmentStatus: "UNEMPLOYED",
      educationLevel: "Bac+2",
      lastDiploma: "BTS Transport et Logistique",
      skills: JSON.stringify([
        "Permis B",
        "Conduite de véhicules légers",
        "Gestion des tournées de livraison",
        "Logistique urbaine",
        "Relation client",
        "Utilisation GPS et applications de navigation",
        "Anglais professionnel (base)",
        "Bases de la comptabilité",
      ]),
      progressScore: 65,
    },
  });
  console.log("   ✅ Beneficiary:", beneficiary.id);

  // ══════════════════════════════════════════════════════════════════
  // 6. USER — COUNSELOR (Sophie Martin)
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[6/24] Creating Counselor User (Sophie Martin)...");
  const counselor = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "sophie.martin@gidef-idf.fr",
      passwordHash: "$2b$10$placeholder_hash_for_demo",
      firstName: "Sophie",
      lastName: "Martin",
      role: "COUNSELOR",
      isActive: true,
      emailVerified: true,
      lastLoginAt: d("2025-07-12T08:15:00Z"),
    },
  });
  console.log("   ✅ Counselor:", counselor.id, counselor.firstName, counselor.lastName);

  // ══════════════════════════════════════════════════════════════════
  // 7. COUNSELOR PROFILE
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[7/24] Creating Counselor Profile...");
  const counselorProfile = await prisma.counselor.create({
    data: {
      userId: counselor.id,
      organizationId: org.id,
      name: "Sophie Martin",
      specialities: JSON.stringify([
        "création d'entreprise",
        "logistique",
        "micro-entreprise",
      ]),
      certifications: JSON.stringify([
        "Certification BGE Conseiller en création d'entreprise",
        "Formation CCI – Diagnostic de création",
      ]),
      maxBeneficiaries: 30,
      isAvailable: true,
    },
  });
  console.log("   ✅ CounselorProfile:", counselorProfile.id);

  // ══════════════════════════════════════════════════════════════════
  // 8. COUNSELOR ASSIGNMENT
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[8/24] Creating CounselorAssignment...");
  const assignment = await prisma.counselorAssignment.create({
    data: {
      counselorId: counselorProfile.id,
      beneficiaryId: beneficiary.id,
      role: "PRIMARY",
      status: "ACTIVE",
      assignedAt: d("2025-06-01T10:00:00Z"),
      notes:
        "Premier entretien réalisé. Projet de livraison du dernier kilomètre en micro-entreprise. Motivation forte, profil cohérent avec le secteur.",
    },
  });
  console.log("   ✅ CounselorAssignment:", assignment.id);

  // ══════════════════════════════════════════════════════════════════
  // 9. USER ENROLLMENT
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[9/24] Creating UserEnrollment...");
  const enrollment = await prisma.userEnrollment.create({
    data: {
      userId: student.id,
      tenantId: tenant.id,
      dispositifId: dispositif.id,
      status: "ACTIF",
      startedAt: d("2025-06-01T10:00:00Z"),
      progress: 65,
      projectTitle: "Transports et livraison — Dernier kilomètre",
    },
  });
  console.log("   ✅ UserEnrollment:", enrollment.id, "progress:", enrollment.progress, "%");

  // ══════════════════════════════════════════════════════════════════
  // 10. CREATOR JOURNEY
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[10/24] Creating CreatorJourney...");
  const journey = await prisma.creatorJourney.create({
    data: {
      userId: student.id,
      currentPhase: "STRATEGY",
      progressPercent: 65,
      projectTitle:
        "Livraisons du Dernier Kilomètre — Service de coursier en micro-entreprise",
      projectDescription:
        "Création d'un service de livraison du dernier kilomètre en Seine-Saint-Denis (93) et Paris intra-muros, sous le régime de la micro-entreprise. L'activité consiste à assurer des livraisons rapides et fiables pour les e-commerçants locaux, les restaurateurs, les pharmacies et les PME/TPE du territoire. Le service se démarque par son approche humaine, sa flexibilité et son engagement éco-responsable (vélo-cargo et véhicules électriques). Le créateur souhaite capitaliser sur sa connaissance fine du terrain et du réseau local acquis lors de ses précédentes expériences en logistique urbaine.",
      projectSector: "Transports et logistique",
      projectStage: "Modélisation",
      creationMotivation:
        "Karim souhaite devenir indépendant après plusieurs années en tant que chauffeur-livreur salarié. Il a identifié une faille dans l'offre locale de livraison du dernier kilomètre dans le 93 : les grandes plateformes imposent des conditions difficiles aux commerçants (commissions élevées, pas de suivi personnalisé). Il veut créer un service de proximité, réactif et transparent, qui valorise la relation humaine. Sa passion pour la logistique, combinée à sa connaissance du terrain et du tissu économique local, le motive à se lancer.",
      targetAudience:
        "E-commerçants locaux, restaurateurs, pharmacies, bureaux d'études — PME et TPE du 93 et Paris intra-muros",
      valueProposition:
        "Livraison rapide, flexible et humaine du dernier kilomètre. Service personnalisé avec suivi en temps réel, tarifs transparents, et engagement éco-responsable (vélo-cargo et véhicules électriques).",
      estimatedRevenue:
        "2 500 €/mois à terme (année 1), 4 000 €/mois (année 2)",
      estimatedInvestment:
        "3 500 € (vélo-cargo d'occasion, assurance RC Pro, matériel mobile, communication)",
      visionAnswers: JSON.stringify({
        pourquoi_ce_projet:
          "Je veux offrir une alternative locale et humaine aux grandes plateformes de livraison. Le 93 est un territoire dynamique où les commerçants ont besoin d'un service fiable et de proximité.",
        quelle_valeur_ajoutee:
          "Un interlocuteur unique, des tarifs transparents, une connaissance du terrain, et un engagement fort pour la mobilité durable.",
        quels_clients:
          "Les restaurateurs et traiteurs (60%), les e-commerçants locaux (20%), les pharmacies (10%), et les autres PME (10%).",
        quels_concurrents:
          "Stuart, Deliveroo, Uber Eats pour la restauration ; Les coursiers traditionnels pour les PME. Mon avantage : la proximité et la flexibilité.",
        quels_risques:
          "La concurrence des plateformes, la dépendance à la météo pour le vélo-cargo, le risque de surcharge de travail en période de forte demande.",
        quelle_equipe:
          "Je commence seul en micro-entreprise. Si l'activité décolle, j'envisage d'embaucher un ou deux coursiers partenaires en sous-traitance à partir de la deuxième année.",
      }),
      bpStatus: "IN_PROGRESS",
      bpSections: JSON.stringify({
        presentation: {
          title: "Présentation du projet",
          content:
            "Dernier Kilomètre Express est un service de livraison urbaine créé par Karim Benali, destiné aux commerçants et PME de Seine-Saint-Denis et Paris. L'activité s'exerce sous le régime de la micro-entreprise et se distingue par son approche éco-responsable (vélo-cargo électrique) et sa relation client de proximité. Le créateur capitalise sur 4 ans d'expérience en logistique urbaine et une connaissance approfondie du tissu économique local.",
          status: "completed",
        },
        marche: {
          title: "Étude de marché",
          content:
            "Le marché français de la livraison du dernier kilomètre est estimé à 12 Md€ en 2025, en croissance de +15% par an. La Seine-Saint-Denis représente un bassin de demande particulièrement dynamique avec plus de 15 000 commerces et 40 000 PME. La demande croissante de livraison rapide, couplée à la montée des préoccupations environnementales (ZFE), crée un contexte favorable pour les solutions de mobilité douce.",
          status: "completed",
        },
        offre: {
          title: "Offre commerciale",
          content:
            "Tarification à la course de 8 à 15€ selon la distance. Forfaits mensuels pour les clients réguliers (250 à 600€/mois). Option livraison express avec supplément de 5€. Suivi en temps réel via application mobile. Engagement de livraison sous 2h pour le périmètre de 5 km.",
          status: "completed",
        },
        economie: { title: "Prévisions financières", content: "", status: "draft" },
        juridique: { title: "Forme juridique", content: "", status: "draft" },
        action: { title: "Plan d'action", content: "", status: "draft" },
      }),
      tremplinStatus: "COMPLETED",
      tremplinScore: 78,
      status: "ACTIVE",
      startedAt: d("2025-06-01T10:00:00Z"),
    },
  });
  console.log("   ✅ CreatorJourney:", journey.id, "phase:", journey.currentPhase);

  // ══════════════════════════════════════════════════════════════════
  // 11. BUSINESS MODEL CANVAS
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[11/24] Creating BusinessModelCanvas...");
  const bmc = await prisma.businessModelCanvas.create({
    data: {
      userId: student.id,
      partenairesCles:
        "Plateformes de commande (Uber Eats, Deliveroo), commerçants locaux, CCI, auto-entrepreneurs partenaires, fournisseurs de vélos-cargos, assureurs RC Pro",
      activitesCles:
        "Livraison du dernier kilomètre, gestion des tournées, relation client, prospection commerciale, maintenance du matériel, suivi des colis",
      ressourcesCles:
        "Vélo-cargo électrique, smartphone avec applis de navigation, permis de livrer, réseau de commerçants, assurance, force physique et connaissance du terrain",
      propositionValeur:
        "Service de livraison du dernier kilomètre fiable, rapide et éco-responsable. Un interlocuteur unique, humain et réactif. Tarifs dégressifs et transparence totale sur les délais.",
      relationsClients:
        "Relation de proximité et confiance. Suivi personnalisé via application. Fidélisation par carte de fidélité virtuelle. Réactivité et disponibilité (7j/7).",
      canaux:
        "Prospection directe (porte-à-porte commerçants), réseaux sociaux (Instagram, Facebook), bouche-à-oreille, partenariats avec les mairies, site web et application mobile",
      segmentsClients:
        "1) Restaurateurs et traiteurs (60%) 2) E-commerçants locaux (20%) 3) Pharmacies et parapharmacies (10%) 4) Autres PME/Bureaux (10%)",
      structureCouts:
        "Charges fixes : assurance RC Pro (45€/mois), amortissement vélo-cargo (80€/mois), forfait téléphonique (15€/mois), comptable (80€/mois), abonnement applis (30€/mois) = ~250€/mois. Charges variables : entretien vélo, accessoires, carburant (électricité). Charges sociales : ~21,2% du CA.",
      sourcesRevenus:
        "Tarification à la course (8-15€ selon distance), forfaits mensuels pour clients réguliers (250-600€/mois), livraison express avec supplément (+5€), commissions sur volumes élevés",
      status: "REFINED",
      generatedAt: d("2025-07-10T14:30:00Z"),
      generatedFromBp: false,
    },
  });
  console.log("   ✅ BMC:", bmc.id, "status:", bmc.status);

  // ══════════════════════════════════════════════════════════════════
  // 12. FINANCIAL FORECAST
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[12/24] Creating FinancialForecast...");
  const forecast = await prisma.financialForecast.create({
    data: {
      userId: student.id,
      sector: "Transports et livraison",
      year1Revenue: 30000.0,
      year2Revenue: 48000.0,
      year3Revenue: 60000.0,
      year1Expenses: 24360.0,
      year2Expenses: 33600.0,
      year3Expenses: 39000.0,
      breakevenMonth: 8,
      initialInvestment: 3500.0,
      aiSynthesis:
        "Le projet présente une viabilité financière satisfaisante en régime micro-entreprise. Le seuil de rentabilité est atteint dès le 8e mois grâce à des charges fixes contenues (~250€/mois). La marge nette progresse de 18,8% en année 1 à 35% en année 3 grâce à l'effet de levier sur les charges fixes. Le ratio charges sociales/CA (21,2% en prestations) reste compatible avec la rentabilité. L'investissement initial de 3 500€ est modeste et autofinançable. Points de vigilance : la dépendance aux conditions météorologiques pour le vélo-cargo, et la nécessité de lisser la saisonnalité de l'activité.",
    },
  });
  console.log("   ✅ FinancialForecast:", forecast.id);

  // ══════════════════════════════════════════════════════════════════
  // 13. CREASIM SIMULATION
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[13/24] Creating CreaSimSimulation...");
  const creasim = await prisma.creaSimSimulation.create({
    data: {
      userId: student.id,
      monthlyRevenue: 2500.0,
      fixedCharges: JSON.stringify([
        { name: "Assurance RC Pro", amount: 45 },
        { name: "Amortissement vélo-cargo", amount: 80 },
        { name: "Forfait téléphonique", amount: 15 },
        { name: "Comptable", amount: 80 },
        { name: "Abonnement applis", amount: 30 },
      ]),
      variableChargesRate: 8.0,
      averageSellingPrice: 12.0,
      unitCost: 3.5,
      targetMarginRate: 40.0,
      initialInvestment: 3500.0,
      fixedChargesTotal: 250.0,
      variableChargesAmount: 200.0,
      totalCharges: 450.0,
      grossMarginAmount: 2050.0,
      grossMarginRate: 82.0,
      netMarginAmount: 1600.0,
      netMarginRate: 64.0,
      monthlyBreakeven: 625.0,
      breakevenMonths: 1.4,
      profitability1Y: 8.2,
      profitability2Y: 14.4,
      profitability3Y: 18.0,
      year1Revenue: 30000.0,
      year1Expenses: 24360.0,
      year2Revenue: 48000.0,
      year2Expenses: 33600.0,
      year3Revenue: 60000.0,
      year3Expenses: 39000.0,
      aiAnalysis:
        "Simulation très encourageante pour une activité de livraison en micro-entreprise. La marge brute de 82% est excellente, reflétant la nature de service pur avec peu de coûts variables. Le seuil de rentabilité mensuel est très bas (625€), ce qui réduit considérablement le risque financier. En année 1, avec un CA mensuel moyen de 2 500€, la rentabilité nette atteint 64%, un ratio exceptionnel pour ce secteur. Le retour sur investissement est quasi-immédiat (< 2 mois). La principale recommandation est de constituer une épargne de précaution de 2 mois de charges fixes (500€) avant le démarrage.",
    },
  });
  console.log("   ✅ CreaSimSimulation:", creasim.id);

  // ══════════════════════════════════════════════════════════════════
  // 14. JURIDIQUE ANALYSIS
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[14/24] Creating JuridiqueAnalysis...");
  const juridique = await prisma.juridiqueAnalysis.create({
    data: {
      userId: student.id,
      recommendedStatus: "Micro-entrepreneur",
      fiscalRegime: "Régime micro-BIC",
      legalStructure: "Entreprise individuelle — Micro-entreprise",
      socialCharges: JSON.stringify({
        regime: "Micro-entreprise (auto-entrepreneur)",
        fiscalite: "Régime micro-BIC — Prélèvement libératoire forfaitaire possible (si revenu fiscal de référence < 27 478€ par part en N-2)",
        cotisations_prestations: "21,1% du chiffre d'affaires (prestations de services BIC/BNC)",
        cotisations_ventes: "12,3% du chiffre d'affaires (ventes de marchandises BIC)",
        taux_applique: "21,1% (activité de prestation de services de livraison)",
        acre: "Réduction ACRE de 50% sur les cotisations sociales pendant la 1ère année (taux effectif : ~10,55% en année 1)",
        cfe: "Cotisation foncière des entreprises : exonération possible en année 1 selon la commune",
        tva: "Franchise de TVA en dessous de 85 800€ de CA (ventes) ou 34 400€ (prestations). Seuil majoré : 97 800€ / 39 100€.",
        plafonds_ca: "188 700€ pour les prestations de services BIC (plafond 2025)",
        comptabilite: "Comptabilité simplifiée — Déclaration URSSAF mensuelle ou trimestrielle",
        assurance_obligatoire: "Assurance RC Pro obligatoire pour activité de transport",
      }),
    },
  });
  console.log("   ✅ JuridiqueAnalysis:", juridique.id);

  // ══════════════════════════════════════════════════════════════════
  // 15. MARKET ANALYSIS
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[15/24] Creating MarketAnalysis...");
  const market = await prisma.marketAnalysis.create({
    data: {
      userId: student.id,
      sector: "Transports et livraison du dernier kilomètre",
      marketSize:
        "Le marché français de la livraison du dernier kilomètre est estimé à 12 Md€ en 2025, en croissance de +15% par an porté par le e-commerce et la livraison de repas. La Seine-Saint-Denis, avec ses 1,6 million d'habitants et sa forte densité de commerces, représente un micro-marché estimé à 200 M€ localement.",
      targetAudience:
        "Segment principal (60%) : Restaurateurs, traiteurs et_food trucks du 93 et arrondissements parisiens limitrophes. Segment secondaire (20%) : E-commerçants locaux (boutiques en ligne, artisans vendant en ligne). Segment complémentaire (10%) : Pharmacies et parapharmacies nécessitant des livraisons rapides. Segment divers (10%) : Bureaux d'études, cabinets, PME avec besoins ponctuels de livraison de documents ou petits colis.",
      trends: JSON.stringify([
        {
          label: "Croissance du e-commerce local",
          detail:
            "Le e-commerce de proximité progresse de +25% par an depuis 2020, amplifié par les habitudes post-COVID.",
        },
        {
          label: "ZFE et contraintes environnementales",
          detail:
            "L'instauration des Zones à Faibles Émissions (ZFE) dans Paris et les métropoles favorise les modes de transport doux (vélo-cargo, véhicules électriques).",
        },
        {
          label: "Recherche de sens et de proximité",
          detail:
            "Les consommateurs et commerçants valorisent de plus en plus les circuits courts et les acteurs locaux de confiance.",
        },
        {
          label: "Désintermédiation des plateformes",
          detail:
            "De nombreux restaurateurs cherchent à réduire leur dépendance aux plateformes de livraison (commissions de 25-30%) et se tournent vers des solutions directes.",
        },
        {
          label: "Boom de la livraison express",
          detail:
            "La livraison en moins de 2h devient un standard attendu par les consommateurs urbains, créant une demande pour des services ultra-réactifs.",
        },
      ]),
      competitors: JSON.stringify([
        {
          name: "Stuart (DPD Group)",
          type: "Plateforme de livraison B2B",
          strengths: "Réseau établi, application performante, marque connue",
          weaknesses:
            "Tarifs élevés pour les petits volumes, pas de relation client personnalisée",
        },
        {
          name: "Deliveroo / Uber Eats",
          type: "Plateforme de livraison de repas",
          strengths: "Notoriété massive, base clients importante",
          weaknesses:
            "Commissions de 25-30%, pas adapté aux livraisons non-alimentaires, pas de personnalisation",
        },
        {
          name: "Coursiers indépendants locaux",
          type: "Indépendants",
          strengths: "Tarifs compétitifs, flexibilité",
          weaknesses:
            "Fiabilité variable, pas de structure, difficulté à gérer les pics de demande",
        },
        {
          name: "Colissimo / Chronopost",
          type: "Opérateurs postaux classiques",
          strengths: "Couverture nationale, fiabilité",
          weaknesses:
            "Pas de livraison express urbaine (< 2h), coûts élevés pour les petits colis, pas de suivi personnalisé",
        },
        {
          name: "Frichti (groupe Carrefour)",
          type: "Service de livraison de repas premium",
          strengths: "Qualité de service, logistique optimisée",
          weaknesses:
            "Segment premium uniquement, géographie limitée, modèle captif",
        },
      ]),
      opportunities:
        "1) La demande croissante de livraison éco-responsable en ZFE ouvre un créneau pour les vélos-cargos. 2) Le mécontentement des commerçants face aux commissions élevées des plateformes crée une opportunité de différenciation. 3) Le développement du e-commerce de proximité en Seine-Saint-Denis est un levier de croissance majeur. 4) Les aides à la création d'entreprise (ACRE, ARE, ARCE) réduisent le risque financier initial. 5) Les partenariats avec les mairies locales pour les livraisons de premiers besoins (pharmacies, alimentation) sont encouragés.",
      threats:
        "1) Les grandes plateformes (Uber, Deliveroo, Stuart) disposent de moyens financiers bien supérieurs et peuvent baissent leurs tarifs pour éliminer la concurrence. 2) La dépendance aux conditions météorologiques pour le vélo-cargo peut impacter la régularité du service. 3) La réglementation sur le statut des travailleurs des plateformes (loi européenne) pourrait modifier le paysage concurrentiel. 4) Le risque d'usure physique lié à l'activité de coursier à vélo. 5) La hausse potentielle des charges sociales pour les auto-entrepreneurs.",
      aiSynthesis:
        "L'analyse de marché confirme la pertinence du positionnement de Karim. Le marché du dernier kilomètre est en forte croissance (+15%/an) et la Seine-Saint-Denis offre un terrain propice avec une forte densité de commerces et de PME. La différenciation par l'approche éco-responsable et la relation de proximité constitue un avantage concurrentiel solide face aux plateformes généralistes. Les menaces principales sont la pression concurrentielle des grands acteurs et les aléas météorologiques. Recommandation : développer rapidement un portefeuille de clients réguliers (forfaits mensuels) pour sécuriser les revenus et lisser l'activité.",
    },
  });
  console.log("   ✅ MarketAnalysis:", market.id);

  // ══════════════════════════════════════════════════════════════════
  // 16. TREMPLIN
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[16/24] Creating Tremplin...");
  const tremplin = await prisma.tremplin.create({
    data: {
      userId: student.id,
      currentStep: 8,
      responses: JSON.stringify({
        step1_projet_clair: {
          question: "Avez-vous une idée claire de votre projet ?",
          answer: "Oui, je veux créer un service de livraison du dernier kilomètre en vélo-cargo, ciblant les commerçants et PME du 93.",
          score: 9,
        },
        step2_motivation: {
          question: "Quelle est votre motivation principale ?",
          answer: "L'indépendance et le fait d'offrir un service que je connais bien, avec une dimension éco-responsable.",
          score: 8,
        },
        step3_competences: {
          question: "Quelles compétences possédez-vous pour ce projet ?",
          answer: "4 ans d'expérience en logistique urbaine, BTS Transport, connaissance du terrain et du tissu économique local.",
          score: 8,
        },
        step4_marche: {
          question: "Connaissez-vous votre marché cible ?",
          answer: "Oui, j'ai identifié les segments principaux (restaurateurs 60%, e-commerçants 20%, pharmacies 10%, PME 10%) et mes principaux concurrents.",
          score: 7,
        },
        step5_financier: {
          question: "Avez-vous estimé vos besoins financiers ?",
          answer: "Oui, investissement initial de 3 500€, charges fixes de 250€/mois, seuil de rentabilité au 8e mois.",
          score: 8,
        },
        step6_risques: {
          question: "Quels sont les principaux risques identifiés ?",
          answer: "Concurrence des plateformes, météo, usure physique. Je prévois de diversifier mes clients pour réduire la dépendance.",
          score: 7,
        },
        step7_reseau: {
          question: "Avez-vous un réseau de soutien ?",
          answer: "Je suis en contact avec la CCI, des commerçants du quartier, et mon conseiller GIDEF m'accompagne.",
          score: 7,
        },
        step8_engagement: {
          question: "Êtes-vous prêt à vous engager à 100% dans ce projet ?",
          answer: "Oui, j'ai démissionné de mon emploi pour me consacrer à cette création. Je bénéficie de l'ARE pour sécuriser mes premiers mois.",
          score: 9,
        },
      }),
      isCompleted: true,
      completedAt: d("2025-07-08T16:00:00Z"),
      score: 78,
      decision: "GO_CONDITIONAL",
      summary:
        "Le projet de Karim Benali est jugé viable et cohérent. Ses compétences en logistique urbaine, sa connaissance du terrain et la clarté de son positionnement (éco-responsabilité + proximité) constituent des atouts solides. Le marché cible est bien identifié et en croissance. Les prévisions financières sont réalistes. Le GO_CONDITIONAL est motivé par la nécessité de sécuriser un portefeuille minimum de 8 clients réguliers avant le démarrage effectif, et de valider la disponibilité d'un vélo-cargo d'occasion dans les conditions annoncées.",
      recommendations: JSON.stringify([
        {
          priority: 1,
          title: "Sécuriser 8 clients réguliers avant le lancement",
          detail:
            "Pré-signer des contrats ou lettres d'intention avec des commerçants locaux pour garantir un CA minimum de 1 800€/mois dès le démarrage.",
        },
        {
          priority: 2,
          title: "Constituer une épargne de précaution",
          detail:
            "Mettre de côté l'équivalent de 2 mois de charges fixes (500€) pour absorber un éventuel démarrage lent.",
        },
        {
          priority: 3,
          title: "Tester le service en condition réelle",
          detail:
            "Réaliser 2 à 3 livraisons tests gratuites pour des commerçants ciblés afin d'affiner le parcours client et d'obtenir des premiers témoignages.",
        },
        {
          priority: 4,
          title: "Prévoir un plan B météorologique",
          detail:
            "Identifier un véhicule électrique en location courte durée pour les jours de pluie intense, ou prévoir un partenariat avec un autre coursier pour la couverture.",
        },
      ]),
    },
  });
  console.log("   ✅ Tremplin:", tremplin.id, "score:", tremplin.score, "decision:", tremplin.decision);

  // ══════════════════════════════════════════════════════════════════
  // 17. ZERO DRAFT
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[17/24] Creating ZeroDraft...");
  const zeroDraftContent = `# Projet de création : Livraisons du Dernier Kilomètre

## 1. Présentation du projet

Dernier Kilomètre Express est un service de livraison urbaine créé par Karim Benali, destiné aux commerçants et PME de Seine-Saint-Denis et de Paris intra-muros. L'activité consiste en la livraison du dernier kilomètre de colis, repas et documents, réalisée principalement en vélo-cargo électrique. Le projet s'inscrit dans le régime de la micro-entreprise et se démarque par son approche éco-responsable, sa flexibilité et la qualité de la relation client.

## 2. Le créateur

Karim Benali, 28 ans, titulaire d'un BTS Transport et Logistique, dispose de 4 ans d'expérience en tant que chauffeur-livreur pour une entreprise de messagerie urbaine en Île-de-France. Il maîtrise la gestion des tournées, la logistique du dernier kilomètre, et possède une excellente connaissance du tissu économique et des infrastructures de la Seine-Saint-Denis. Il est actuellement inscrit à France Travail et bénéficie de l'ARE.

## 3. Analyse du marché

Le marché français de la livraison du dernier kilomètre est estimé à 12 milliards d'euros en 2025, avec une croissance annuelle de 15%. Cette dynamique est portée par l'essor du e-commerce, le développement de la livraison de repas, et les nouvelles exigences des consommateurs en matière de rapidité et de traçabilité. La Seine-Saint-Denis, densément peuplée et riche en commerces, constitue un terrain particulièrement propice. Les tendances clés incluent la montée des ZFE favorisant les véhicules électriques, la recherche de sens et de proximité par les consommateurs, et la volonté des commerçants de se désintermédier des grandes plateformes.

## 4. Proposition de valeur

Dernier Kilomètre Express propose un service de livraison rapide, fiable et humain. Contrairement aux grandes plateformes, le créateur offre un interlocuteur unique, des tarifs transparents et dégressifs, un suivi en temps réel, et un engagement fort pour la mobilité durable. L'objectif est de devenir le partenaire de livraison de référence pour les commerçants et PME du territoire qui recherchent un service personnalisé et éco-responsable.

## 5. Modèle économique

Le modèle repose sur trois sources de revenus : la tarification à la course (8 à 15€ selon la distance), les forfaits mensuels pour clients réguliers (250 à 600€/mois), et la livraison express avec supplément. Les charges fixes sont contenues à environ 250€/mois (assurance, amortissement, téléphone, comptable, abonnements). Les charges sociales en micro-entreprise s'élèvent à 21,1% du CA, avec un taux réduit à 10,55% la première année grâce à l'ACRE. Le seuil de rentabilité est atteint au 8e mois avec un investissement initial modeste de 3 500€.

## 6. Prévisions financières

Année 1 : CA prévisionnel de 30 000€ (2 500€/mois), charges de 24 360€, résultat net de 5 640€.
Année 2 : CA prévisionnel de 48 000€ (4 000€/mois), charges de 33 600€, résultat net de 14 400€.
Année 3 : CA prévisionnel de 60 000€ (5 000€/mois), charges de 39 000€, résultat net de 21 000€.
La rentabilité progresse grâce à l'effet de levier sur les charges fixes, avec une marge nette atteignant 35% en année 3.

## 7. Plan d'action

Phase 1 (Mois 1-2) : Finaliser le business plan, commander le vélo-cargo, souscrire l'assurance RC Pro, effectuer les formalités de création de micro-entreprise.
Phase 2 (Mois 2-3) : Prospection commerciale intensive, réaliser des livraisons tests, signer les premiers contrats.
Phase 3 (Mois 3-6) : Lancement effectif de l'activité, constitution du portefeuille clients, ajustement de l'offre.
Phase 4 (Mois 6-12) : Consolidation, développement des forfaits mensuels, début de communication numérique (réseaux sociaux, site web).`;

  const zeroDraft = await prisma.zeroDraft.create({
    data: {
      userId: student.id,
      projectTitle: "Projet de création : Livraisons du Dernier Kilomètre",
      content: zeroDraftContent,
      wordCount: zeroDraftContent.split(/\s+/).length,
      status: "REFINED",
    },
  });
  console.log("   ✅ ZeroDraft:", zeroDraft.id, "words:", zeroDraft.wordCount);

  // ══════════════════════════════════════════════════════════════════
  // 18. KIVIAT RESULTS (6 dimensions)
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[18/24] Creating KiviatResults (6 dimensions)...");
  const kiviatData = [
    { category: "leadership", score: 7.5, label: "Leadership" },
    { category: "gestion_stress", score: 8.0, label: "Gestion du stress" },
    { category: "communication", score: 8.5, label: "Communication" },
    { category: "resolution_problemes", score: 8.0, label: "Résolution de problèmes" },
    { category: "creativite", score: 6.5, label: "Créativité" },
    { category: "adaptabilite", score: 9.0, label: "Adaptabilité" },
  ];
  const kiviatResults = [];
  for (const k of kiviatData) {
    const r = await prisma.kiviatResult.create({
      data: {
        userId: student.id,
        category: k.category,
        score: k.score,
        maxScore: 10,
      },
    });
    kiviatResults.push(r);
  }
  console.log("   ✅ KiviatResults:", kiviatResults.length, "dimensions");

  // ══════════════════════════════════════════════════════════════════
  // 19. RIASEC RESULTS
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[19/24] Creating RiasecResults...");
  const riasecData = [
    { profileType: "R", score: 8.5, isDominant: true, label: "Réaliste" },
    { profileType: "E", score: 6.0, isDominant: false, label: "Entrepreneur" },
    { profileType: "S", score: 5.5, isDominant: false, label: "Social" },
  ];
  const riasecResults = [];
  for (const r of riasecData) {
    const res = await prisma.riasecResult.create({
      data: {
        userId: student.id,
        profileType: r.profileType,
        score: r.score,
        isDominant: r.isDominant,
      },
    });
    riasecResults.push(res);
  }
  console.log("   ✅ RiasecResults:", riasecResults.length, "profiles (dominant: R)");

  // ══════════════════════════════════════════════════════════════════
  // 20. MOTIVATION ASSESSMENT
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[20/24] Creating MotivationAssessment...");
  const motivation = await prisma.motivationAssessment.create({
    data: {
      userId: student.id,
      scores: JSON.stringify({
        autonomie: { score: 92, label: "Autonomie et indépendance" },
        realisation: { score: 78, label: "Réalisation personnelle" },
        securite: { score: 65, label: "Sécurité financière" },
        reconnaissance: { score: 55, label: "Reconnaissance sociale" },
        impact: { score: 70, label: "Impact positif sur la société" },
      }),
      summary:
        "Le profil motivationnel de Karim est marqué par une forte aspiration à l'autonomie (92/100), ce qui est cohérent avec son choix du statut de micro-entrepreneur. La réalisation personnelle est également très présente (78/100), traduisant un désir de construire quelque chose de propre. L'impact positif (70/100) — notamment l'engagement éco-responsable — apporte une dimension de sens au projet. La sécurité financière (65/100) est prise en compte de manière réaliste grâce au maintien de l'ARE. La reconnaissance sociale est le moteur le plus faible (55/100), ce qui indique un profil pragmatique davantage tourné vers l'action que vers la valorisation extérieure.",
    },
  });
  console.log("   ✅ MotivationAssessment:", motivation.id);

  // ══════════════════════════════════════════════════════════════════
  // 21. MODULE RESULTS (7 modules)
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[21/24] Creating ModuleResults (7 modules)...");
  const moduleData = [
    { code: "vision", score: 82, feedback: "Vision du projet claire et structurée. Les réponses témoignent d'une bonne compréhension des enjeux du secteur." },
    { code: "bmc", score: 78, feedback: "Business Model Canvas complet et cohérent. Les 9 blocs sont bien articulés. Points d'amélioration sur la définition précise des coûts variables." },
    { code: "marche", score: 75, feedback: "Analyse de marché solide avec des données chiffrées pertinentes. L'analyse concurrentielle pourrait être approfondie avec des entretiens terrain." },
    { code: "juridique", score: 85, feedback: "Excellente compréhension du régime de la micro-entreprise. Les taux de cotisations et plafonds sont correctement identifiés." },
    { code: "financier", score: 72, feedback: "Prévisions réalistes mais un peu optimistes pour l'année 2. Recommandation : prévoir un scénario pessimiste." },
    { code: "tremplin", score: 78, feedback: "Score global bon (78/100). Le projet est viable avec conditions. Engagement fort du créateur." },
    { code: "creascope", score: 80, feedback: "Parcours CreaScope complété avec succès. Profil cohérent, compétences adaptées au projet de livraison." },
  ];
  const moduleResults = [];
  for (const m of moduleData) {
    const r = await prisma.moduleResult.create({
      data: {
        userId: student.id,
        moduleCode: m.code,
        score: m.score,
        maxScore: 100,
        feedback: m.feedback,
        completedAt: d("2025-07-10T14:30:00Z"),
      },
    });
    moduleResults.push(r);
  }
  console.log("   ✅ ModuleResults:", moduleResults.length, "modules");

  // ══════════════════════════════════════════════════════════════════
  // 22. CONSENT LOGS (3 consents)
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[22/24] Creating ConsentLogs (3)...");
  const consentData = [
    { type: "CGU" as const, version: "1.0" },
    { type: "DONNEES_PERSONNELLES" as const, version: "1.0" },
    { type: "CREASCOPE" as const, version: "1.0" },
  ];
  const consents = [];
  for (const c of consentData) {
    const r = await prisma.consentLog.create({
      data: {
        userId: student.id,
        consentType: c.type,
        status: "GRANTED",
        source: "web",
        version: c.version,
        grantedAt: d("2025-06-01T10:05:00Z"),
      },
    });
    consents.push(r);
  }
  console.log("   ✅ ConsentLogs:", consents.length);

  // ══════════════════════════════════════════════════════════════════
  // 23. SWIPE CARDS + SWIPE GAME RESULTS
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[23/24] Creating SwipeCards and SwipeGameResults...");

  // Create swipe cards first (needed as FK for results)
  const swipeCardsData = [
    { code: "ldr-01", title: "Persévérance", icon: "Flame", category: "leadership", description: "Capacité à maintenir son effort malgré les difficultés et les obstacles rencontrés.", difficulty: 1, weight: 1.5, sortOrder: 1 },
    { code: "ldr-02", title: "Prise de décision", icon: "Crosshair", category: "leadership", description: "Aptitude à faire des choix rapides et éclairés, même dans des situations incertaines.", difficulty: 2, weight: 1.0, sortOrder: 2 },
    { code: "str-01", title: "Gestion du stress", icon: "Brain", category: "gestion_stress", description: "Capacité à rester calme et efficace sous pression, en particulier lors des pics d'activité.", difficulty: 1, weight: 1.5, sortOrder: 3 },
    { code: "str-02", title: "Résilience", icon: "Shield", category: "gestion_stress", description: "Aptitude à rebondir après un échec ou un imprévu et à en tirer des leçons.", difficulty: 2, weight: 1.0, sortOrder: 4 },
    { code: "com-01", title: "Communication claire", icon: "MessageCircle", category: "communication", description: "Capacité à transmettre des informations de manière compréhensible et professionnelle.", difficulty: 1, weight: 1.5, sortOrder: 5 },
    { code: "com-02", title: "Écoute active", icon: "Ear", category: "communication", description: "Savoir écouter et comprendre les besoins de ses clients et partenaires.", difficulty: 1, weight: 1.0, sortOrder: 6 },
    { code: "rso-01", title: "Sens de l'organisation", icon: "ListChecks", category: "resolution_problemes", description: "Capacité à planifier, prioriser et gérer plusieurs tâches simultanément.", difficulty: 1, weight: 1.5, sortOrder: 7 },
    { code: "rso-02", title: "Résolution de problèmes", icon: "Puzzle", category: "resolution_problemes", description: "Aptitude à identifier et résoudre rapidement les problèmes rencontrés sur le terrain.", difficulty: 2, weight: 1.0, sortOrder: 8 },
    { code: "cre-01", title: "Créativité", icon: "Lightbulb", category: "creativite", description: "Capacité à trouver des solutions innovantes face à des situations inédites.", difficulty: 2, weight: 1.0, sortOrder: 9 },
    { code: "cre-02", title: "Adaptabilité", icon: "RefreshCw", category: "adaptabilite", description: "Capacité à s'adapter rapidement aux changements de contexte et aux imprévus.", difficulty: 1, weight: 1.5, sortOrder: 10 },
    { code: "com-03", title: "Relation client", icon: "Users", category: "communication", description: "Aptitude à instaurer une relation de confiance et de fidélisation avec les clients.", difficulty: 1, weight: 1.5, sortOrder: 11 },
    { code: "ldr-03", title: "Gestion du temps", icon: "Clock", category: "leadership", description: "Capacité à optimiser ses tournées et à respecter les délais de livraison.", difficulty: 1, weight: 1.5, sortOrder: 12 },
    { code: "rso-03", title: "Sens de la responsabilité", icon: "Award", category: "resolution_problemes", description: "Engagement à assumer pleinement ses actions et leurs conséquences.", difficulty: 1, weight: 1.0, sortOrder: 13 },
    { code: "str-03", title: "Patience", icon: "Hourglass", category: "gestion_stress", description: "Capacité à maintenir son calme lors de situations lentes ou frustrantes.", difficulty: 1, weight: 1.0, sortOrder: 14 },
    { code: "cre-03", title: "Curiosité", icon: "Search", category: "creativite", description: "Ouverture d'esprit et envie d'apprendre de nouvelles choses.", difficulty: 1, weight: 0.5, sortOrder: 15 },
  ];

  const createdCards = [];
  for (const c of swipeCardsData) {
    const card = await prisma.swipeCard.create({
      data: {
        code: c.code,
        title: c.title,
        icon: c.icon,
        category: c.category,
        description: c.description,
        difficulty: c.difficulty,
        weight: c.weight,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
    createdCards.push(card);
  }

  // Now create swipe results (kept cards)
  const keptCards = [
    "ldr-01", // Persévérance
    "rso-01", // Sens de l'organisation
    "com-01", // Communication claire
    "cre-02", // Adaptabilité
    "com-03", // Relation client
    "ldr-03", // Gestion du temps
    "str-01", // Gestion du stress
    "rso-02", // Résolution de problèmes
    "rso-03", // Sens de la responsabilité
    "str-02", // Résilience
    "str-03", // Patience
    "com-02", // Écoute active
  ];

  const superPepites = ["ldr-01", "rso-01", "com-03"]; // super-pépite cards

  const swipeResults = [];
  for (const card of createdCards) {
    const kept = keptCards.includes(card.code);
    const r = await prisma.swipeGameResult.create({
      data: {
        userId: student.id,
        cardId: card.id,
        cardCode: card.code,
        cardTitle: card.title,
        kept,
        superPepite: superPepites.includes(card.code),
        confidence: kept ? 4 : null,
        swipedAt: d("2025-06-15T11:30:00Z"),
      },
    });
    swipeResults.push(r);
  }
  console.log(
    "   ✅ SwipeCards:", createdCards.length, "| SwipeGameResults:", swipeResults.length,
    "(", keptCards.length, "kept)"
  );

  // ══════════════════════════════════════════════════════════════════
  // 24. NETWORK (3-4 contacts)
  // ══════════════════════════════════════════════════════════════════
  console.log("\n[24/24] Creating Network contacts...");
  const networkData = [
    {
      name: "CCI Paris Île-de-France — Antenne de Montreuil",
      type: "Institutionnel",
      contact: "Service Création d'Entreprise",
      email: "creation.93@cci-paris-idf.fr",
      phone: "01 49 88 65 00",
      notes:
        "Point d'information sur les formalités de création et les aides disponibles en Seine-Saint-Denis. Rendez-vous pris le 15/06.",
    },
    {
      name: "Mehdi Kaci",
      type: "Entrepreneur",
      contact: "Fondateur — SpeedLiv 93",
      email: "mehdi@speedliv93.fr",
      phone: "06 12 34 56 78",
      notes:
        "Ancien livreur indépendant devenu micro-entrepreneur. A accepté de partager son retour d'expérience sur le démarrage d'activité en livraison.",
    },
    {
      name: "Boulangerie Les Saveurs d'Alice",
      type: "Client potentiel",
      contact: "Alice Durand, gérante",
      email: "alice@saveursalice.fr",
      phone: "01 48 45 67 89",
      notes:
        "Intéressée par un forfait de livraison de 3 courses/semaine pour ses clients du quartier. Première rencontre prévue.",
    },
    {
      name: "Mairie de Pantin — Service Commerce",
      type: "Institutionnel",
      contact: "Pôle Développement Économique",
      email: "commerce@mairie-pantin.fr",
      notes:
        "La mairie propose un dispositif d'aide aux créateurs locaux (aide au démarrage, mise en relation avec les commerçants).",
    },
  ];
  const networks = [];
  for (const n of networkData) {
    const r = await prisma.network.create({
      data: { userId: student.id, ...n },
    });
    networks.push(r);
  }
  console.log("   ✅ Network contacts:", networks.length);

  // ══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("  ✅ CreaScope Demo Seed — COMPLETE");
  console.log("═".repeat(60));
  console.log(`
  Tenant:         ${tenant.name} (${tenant.id})
  Organization:   ${org.name}
  Dispositif:     ${dispositif.name} (${dispositif.code})
  ────────────────────────────────────────
  Bénéficiaire:   ${student.firstName} ${student.lastName} <${student.email}>
  Conseiller:     ${counselor.firstName} ${counselor.lastName} <${counselor.email}>
  Enrollment:     ${enrollment.status} — ${enrollment.progress}% progress
  ────────────────────────────────────────
  CreatorJourney: phase ${journey.currentPhase} — ${journey.progressPercent}%
  BMC:            ${bmc.status} (${bmc.generatedAt?.toISOString().slice(0, 10)})
  Financial:      breakeven M${forecast.breakevenMonth}, invest ${forecast.initialInvestment}€
  CreaSim:        net margin ${creasim.netMarginRate}%
  Juridique:      ${juridique.recommendedStatus} — ${juridique.fiscalRegime}
  MarketAnalysis: sector "${market.sector}"
  Tremplin:       score ${tremplin.score} — ${tremplin.decision}
  ZeroDraft:      ${zeroDraft.wordCount} words — ${zeroDraft.status}
  ────────────────────────────────────────
  KiviatResults:  ${kiviatResults.length} dimensions
  RiasecResults:  ${riasecResults.length} profiles (R dominant)
  Motivation:     assessed
  ModuleResults:  ${moduleResults.length} modules
  ConsentLogs:    ${consents.length}
  SwipeCards:     ${createdCards.length} cards, ${swipeResults.length} results
  Networks:       ${networks.length} contacts
`);

  await prisma.$disconnect();
  console.log("🌱 Seed completed successfully.\n");
})().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});