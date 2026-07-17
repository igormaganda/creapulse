/**
 * CreaScope Demo Seed Script
 * ===========================
 * Populates a complete test dataset for "Transports et livraison :
 * Porté par le régime de la micro-entreprise (livraisons du dernier kilomètre)"
 *
 * Idempotent: if tenant "gidef-idf" exists, deletes all related data first.
 *
 * Run:
 *   DATABASE_URL='postgresql://echo_entrep_user:echo_entrep_pass2026@213.199.38.41:5432/echo_entrep' \
 *     npx tsx prisma/seed-creascope-demo.ts
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Date helpers ──────────────────────────────────────────────
const now = new Date();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
};
const weeksAgo = (n: number) => daysAgo(n * 7);
const hoursAgo = (n: number) => {
  const d = new Date(now);
  d.setHours(d.getHours() - n);
  return d;
};

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🌱 CreaScope Demo Seed — Start');
  console.log('━'.repeat(60));

  // ─── 0. Idempotent cleanup ───────────────────────────────────
  console.log('\n📦 Step 0: Checking for existing demo data...');
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: 'gidef-idf' },
  });

  if (existingTenant) {
    console.log('   ⚠️  Tenant "gidef-idf" already exists — deleting all related data...');
    await prisma.$transaction(async (tx) => {
      // Find users belonging to this tenant
      const users = await tx.user.findMany({
        where: { tenantId: existingTenant.id },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      // Delete in order of dependencies
      await tx.dataDeletionRequest.deleteMany({ where: { userId: { in: userIds } } });
      await tx.dataExportRequest.deleteMany({ where: { userId: { in: userIds } } });
      await tx.consentLog.deleteMany({ where: { userId: { in: userIds } } });
      await tx.satisfactionFeedback.deleteMany({ where: { userId: { in: userIds } } });
      await tx.smartObjective.deleteMany({
        where: { program: { userId: { in: userIds } } },
      });
      await tx.paaAtelierSession.deleteMany({
        where: { program: { userId: { in: userIds } } },
      });
      await tx.paaMilestone.deleteMany({
        where: { program: { userId: { in: userIds } } },
      });
      await tx.paaProgram.deleteMany({ where: { userId: { in: userIds } } });
      await tx.mindMap.deleteMany({ where: { userId: { in: userIds } } });
      await tx.livrable.deleteMany({
        where: {
          OR: [{ userId: { in: userIds } }, { counselorId: { in: userIds } }],
        },
      });
      await tx.interviewNote.deleteMany({
        where: { interview: { beneficiaryId: { in: userIds } } },
      });
      await tx.interviewNote.deleteMany({
        where: { interview: { counselorId: { in: userIds } } },
      });
      await tx.interviewSession.deleteMany({
        where: {
          OR: [{ beneficiaryId: { in: userIds } }, { counselorId: { in: userIds } }],
        },
      });
      await tx.appointment.deleteMany({
        where: {
          OR: [{ beneficiaryId: { in: userIds } }, { counselorId: { in: userIds } }],
        },
      });
      await tx.personalizedPath.deleteMany({ where: { userId: { in: userIds } } });
      await tx.registration.deleteMany({ where: { userId: { in: userIds } } });
      await tx.network.deleteMany({ where: { userId: { in: userIds } } });
      await tx.accessibilitySetting.deleteMany({ where: { userId: { in: userIds } } });
      await tx.cvUpload.deleteMany({ where: { userId: { in: userIds } } });
      await tx.userFile.deleteMany({ where: { userId: { in: userIds } } });
      await tx.auditLog.deleteMany({
        where: { OR: [{ userId: { in: userIds } }, { tenantId: existingTenant.id }] },
      });
      await tx.swipeAnswer.deleteMany({ where: { userId: { in: userIds } } });
      await tx.swipeGameResult.deleteMany({ where: { userId: { in: userIds } } });
      await tx.savedNews.deleteMany({ where: { userId: { in: userIds } } });
      await tx.reply.deleteMany({ where: { authorId: { in: userIds } } });
      await tx.discussion.deleteMany({ where: { authorId: { in: userIds } } });
      await tx.mentorship.deleteMany({
        where: { OR: [{ mentorId: { in: userIds } }, { menteeId: { in: userIds } }] },
      });
      await tx.mentorshipRequest.deleteMany({ where: { menteeId: { in: userIds } } });
      await tx.mentor.deleteMany({ where: { userId: { in: userIds } } });
      await tx.message.deleteMany({
        where: {
          conversation: {
            tenantId: existingTenant.id,
          },
        },
      });
      await tx.conversation.deleteMany({ where: { tenantId: existingTenant.id } });
      await tx.favorite.deleteMany({ where: { userId: { in: userIds } } });
      await tx.moduleResult.deleteMany({ where: { userId: { in: userIds } } });
      await tx.kiviatResult.deleteMany({ where: { userId: { in: userIds } } });
      await tx.riasecResult.deleteMany({ where: { userId: { in: userIds } } });
      await tx.motivationAssessment.deleteMany({ where: { userId: { in: userIds } } });
      await tx.financialForecast.deleteMany({ where: { userId: { in: userIds } } });
      await tx.creaSimSimulation.deleteMany({ where: { userId: { in: userIds } } });
      await tx.juridiqueAnalysis.deleteMany({ where: { userId: { in: userIds } } });
      await tx.marketAnalysis.deleteMany({ where: { userId: { in: userIds } } });
      await tx.tremplin.deleteMany({ where: { userId: { in: userIds } } });
      await tx.businessModelCanvas.deleteMany({ where: { userId: { in: userIds } } });
      await tx.zeroDraft.deleteMany({ where: { userId: { in: userIds } } });
      await tx.creascopeSession.deleteMany({
        where: {
          OR: [{ beneficiaryId: { in: userIds } }, { counselorId: { in: userIds } }],
        },
      });
      await tx.userEnrollment.deleteMany({ where: { userId: { in: userIds } } });
      await tx.counselorAssignment.deleteMany({
        where: {
          OR: [{ counselorId: { in: userIds } }, { beneficiaryId: { in: userIds } }],
        },
      });
      await tx.beneficiary.deleteMany({ where: { userId: { in: userIds } } });
      await tx.counselor.deleteMany({ where: { userId: { in: userIds } } });
      await tx.bpSnapshot.deleteMany({ where: { userId: { in: userIds } } });
      await tx.creatorJourney.deleteMany({ where: { userId: { in: userIds } } });
      await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
      await tx.account.deleteMany({ where: { userId: { in: userIds } } });
      await tx.session.deleteMany({ where: { userId: { in: userIds } } });
      await tx.user.deleteMany({ where: { tenantId: existingTenant.id } });

      // Delete dispositifs for this tenant
      await tx.dispositif.deleteMany({ where: { tenantId: existingTenant.id } });
      await tx.appModule.deleteMany({ where: { tenantId: existingTenant.id } });
      await tx.actor.deleteMany({ where: { tenantId: existingTenant.id } });

      // Delete organizations
      await tx.organization.deleteMany({ where: { tenantId: existingTenant.id } });

      // Finally delete tenant
      await tx.tenant.delete({ where: { id: existingTenant.id } });
    });
    console.log('   ✅ Old data cleaned up');
  }

  // ─── 1. Tenant ───────────────────────────────────────────────
  console.log('\n📦 Step 1: Creating Tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'GIDEF Île-de-France',
      slug: 'gidef-idf',
      plan: 'PROFESSIONAL',
      primaryColor: '#00838F',
      settings: {
        region: 'Île-de-France',
        contactEmail: 'contact@gidef-idf.fr',
        features: { creascope: true, paa: true },
      },
    },
  });
  console.log(`   ✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Organization ─────────────────────────────────────────
  console.log('\n📦 Step 2: Creating Organization...');
  const org = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: 'GIDEF 93 — Montreuil',
      type: 'GIDEF_AGENCY',
      address: '12 Rue de la République',
      city: 'Montreuil',
      postalCode: '93100',
      region: 'Île-de-France',
      phone: '01 48 58 00 00',
      email: 'gidef93@demo-creapulse.fr',
      website: 'https://gidef93.demo-creapulse.fr',
    },
  });
  console.log(`   ✅ Organization: ${org.name} (${org.id})`);

  // ─── 3. Password hash ────────────────────────────────────────
  console.log('\n📦 Step 3: Hashing passwords...');
  const passwordHash = await hash('Demo2026!', 12);
  console.log('   ✅ Password hashed (bcryptjs, 12 rounds)');

  // ─── 4. Dispositifs ──────────────────────────────────────────
  console.log('\n📦 Step 4: Creating Dispositifs...');
  const dispositifCreascope = await prisma.dispositif.create({
    data: {
      tenantId: tenant.id,
      code: 'creascope',
      name: 'Parcours CréaScope',
      type: 'DIAGNOSTIC',
      description:
        'Pipeline diagnostic CréaScope — 3-4h avec conseiller',
      color: '#00838F',
      icon: 'Search',
      durationDays: 30,
      moduleConfig: {
        include: [
          'phase-decouverte',
          'diagnostic-competences',
          'analyse-marche',
          'bmc',
          'simulation-financiere',
          'juridique',
          'tremplin',
          'zero-draft',
          'pitch-deck',
          'mind-map',
        ],
        exclude: [],
      },
    },
  });

  const dispositifCreapulse = await prisma.dispositif.create({
    data: {
      tenantId: tenant.id,
      code: 'creapulse',
      name: 'Parcours Créateur',
      type: 'BASE',
      description: 'Parcours complet de création d\'entreprise CréaPulse',
      color: '#E65100',
      icon: 'Briefcase',
      moduleConfig: { include: null, exclude: [] },
    },
  });
  console.log(`   ✅ Dispositif CréaScope: ${dispositifCreascope.id}`);
  console.log(`   ✅ Dispositif CréaPulse: ${dispositifCreapulse.id}`);

  // ─── 5. Counselor User (Sophie) ──────────────────────────────
  console.log('\n📦 Step 5: Creating Counselor (Sophie Martin-Dupont)...');
  const counselorUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'sophie.martin@demo-creapulse.fr',
      passwordHash,
      firstName: 'Sophie',
      lastName: 'Martin-Dupont',
      role: 'COUNSELOR',
      isActive: true,
      emailVerified: true,
      lastLoginAt: daysAgo(1),
    },
  });

  const counselor = await prisma.counselor.create({
    data: {
      userId: counselorUser.id,
      organizationId: org.id,
      name: 'Sophie Martin-Dupont',
      specialities: [
        'Création d\'entreprise',
        'Micro-entreprise',
        'Transport-logistique',
      ],
      certifications: ['Certifié BGE', 'Consultant France Active'],
      maxBeneficiaries: 30,
      isAvailable: true,
    },
  });
  console.log(`   ✅ Counselor: ${counselor.name} (${counselorUser.id})`);

  // ─── 6. Beneficiary User (Karim) ─────────────────────────────
  console.log('\n📦 Step 6: Creating Beneficiary (Karim Benali)...');
  const beneficiaryUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'karim.benali@demo-creapulse.fr',
      passwordHash,
      firstName: 'Karim',
      lastName: 'Benali',
      role: 'BENEFICIARY',
      isActive: true,
      emailVerified: true,
      lastLoginAt: hoursAgo(2),
    },
  });

  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId: beneficiaryUser.id,
      organizationId: org.id,
      employmentStatus: 'UNEMPLOYED',
      educationLevel: 'BAC+2 BTS Transport',
      lastDiploma: 'BTS Transport et Prestations Logistiques',
      skills: [
        'Permis B',
        'Permis C',
        'Logistique urbaine',
        'Gestion des tournées',
        'Livraison B2B/B2C',
        'Application mobile',
        'Conduite ecologique',
        'Service client',
      ],
      hasDisability: false,
      progressScore: 45,
    },
  });
  console.log(`   ✅ Beneficiary: Karim Benali (${beneficiaryUser.id})`);

  // ─── 7. CounselorAssignment ──────────────────────────────────
  console.log('\n📦 Step 7: Creating CounselorAssignment...');
  const assignment = await prisma.counselorAssignment.create({
    data: {
      counselorId: counselor.id,
      beneficiaryId: beneficiary.id,
      role: 'PRIMARY',
      status: 'ACTIVE',
      assignedAt: weeksAgo(3),
      notes: 'Suivi création micro-entreprise livraison dernier kilomètre',
    },
  });
  console.log(`   ✅ Assignment: ${assignment.role} (${assignment.id})`);

  // ─── 8. UserEnrollment ───────────────────────────────────────
  console.log('\n📦 Step 8: Creating UserEnrollment (CréaScope)...');
  const enrollment = await prisma.userEnrollment.create({
    data: {
      userId: beneficiaryUser.id,
      tenantId: tenant.id,
      dispositifId: dispositifCreascope.id,
      status: 'ACTIF',
      progress: 45,
      startedAt: weeksAgo(2),
      projectTitle:
        'Transports et livraison — Livraisons du dernier kilomètre',
      settings: { language: 'fr', notifications: true },
    },
  });
  console.log(`   ✅ Enrollment: ${enrollment.projectTitle} (${enrollment.id})`);

  // ─── 9. CreatorJourney ───────────────────────────────────────
  console.log('\n📦 Step 9: Creating CreatorJourney...');
  const journey = await prisma.creatorJourney.create({
    data: {
      userId: beneficiaryUser.id,
      currentPhase: 'MODELING',
      progressPercent: 45,
      projectTitle:
        'Transports et livraison — Livraisons du dernier kilomètre',
      projectDescription:
        'Service de livraison du dernier kilomètre en milieu urbain (Île-de-France), sous le régime de la micro-entreprise. Utilisation d\'un vélo cargo électrique pour des livraisons de colis, repas et courses pour les particuliers et petits commerces locaux. Zone de chalandise : Montreuil, Bagnolet, Vincennes.',
      projectSector: 'Transports et logistique',
      projectStage: 'Idéation avancée',
      creationMotivation:
        'Après 5 ans comme chauffeur-livreur salarié, je souhaite devenir mon propre patron en capitalisant sur mon expérience de la logistique urbaine et ma connaissance du terrain en Seine-Saint-Denis.',
      targetAudience:
        'Particuliers (courses, colis e-commerce), petits commerces locaux (épicerie, boulangerie, pharmacie), restaurants (livraison de repas), startups e-commerce locales',
      valueProposition:
        'Livraison rapide et éco-responsable du dernier kilomètre en vélo cargo électrique. Fiabilité, ponctualité et service personnalisé avec un vrai contact humain, contrairement aux grands groupes de livraison.',
      estimatedRevenue: '25 000 € à 35 000 € la première année',
      estimatedInvestment:
        '3 500 € à 5 000 € (vélo cargo électrique d\'occasion, matériel, assurance RC Pro)',
      visionAnswers: {
        'pourquoi-creer': 'Devenir indépendant et capitaliser sur 5 ans d\'expérience en livraison urbaine. Je connais parfaitement le terrain en Seine-Saint-Denis et je veux proposer un service plus humain et éco-responsable.',
        'quelle-valeur': 'Une alternative locale et éco-responsable aux grands groupes de livraison. Un vrai contact humain, de la ponctualité et de la flexibilité.',
        'quel-impact': 'Réduire l\'empreinte carbone des livraisons urbaines, créer de l\'emploi local, redynamiser le commerce de proximité en Seine-Saint-Denis.',
        'quelles-competences':
          'Logistique urbaine, gestion des tournées, relation client, connaissance du terrain IDF, conduite écologique, utilisation d\'applications mobiles.',
        'quels-moyens':
          'Vélo cargo électrique (occasion), smartphone, sacoche isotherme, assurance RC Pro, réseau de commerçants locaux.',
        'quels-risques':
          'Concurrence des plateformes, risques d\'accident, dépendance météorologique, pression sur les prix, saisonnalité.',
        'quelle-vision-3ans':
          'En 3 ans, je vise un CA de 50 000 € avec 2-3 livreurs en sous-traitance, une clientèle fidèle de 20+ commerçants et une présence reconnue à Montreuil.',
        'quel-régime': 'Micro-entreprise — Micro-BIC, avec ACRE la première année.',
      },
      bpStatus: 'IN_PROGRESS',
      tremplinStatus: 'IN_PROGRESS',
      status: 'ACTIVE',
      startedAt: weeksAgo(2),
    },
  });
  console.log(`   ✅ CreatorJourney: ${journey.projectTitle} (${journey.id})`);

  // ─── 10. BusinessModelCanvas ─────────────────────────────────
  console.log('\n📦 Step 10: Creating BusinessModelCanvas...');
  const bmc = await prisma.businessModelCanvas.create({
    data: {
      userId: beneficiaryUser.id,
      partenairesCles:
        'Fournisseurs vélos cargo, assureurs RC Pro, plateformes de mise en relation (Stuart, Deliveroo), commerçants locaux, SCDL (Société Coopérative de Livraison), chargeurs vélo publics',
      activitesCles:
        'Tournées de livraison, gestion des commandes via application, entretien vélo cargo, prospection commerciale, relation client, comptabilité micro-entreprise',
      ressourcesCles:
        'Vélo cargo électrique, smartphone, sacoche isotherme, équipement de sécurité, permis B, connaissance du terrain IDF, réseau commerçants',
      propositionValeur:
        'Livraison éco-responsable et humaine du dernier kilomètre. Rapidité, fiabilité, flexibilité. Alternative locale aux géants de la livraison.',
      relationsClients:
        'Relation directe et personnalisée, fidélisation par la qualité, application mobile avec suivi en temps réel, programme de fidélité commerçants',
      canaux:
        'Application mobile, bouche-à-oreille, réseaux sociaux (Instagram, Facebook), partenariats commerçants, site web vitrine, flyers quartiers',
      segmentsClients:
        'Particuliers (courses/colis), PME locales (livraison B2B), restaurants (meal delivery), e-commerçants locaux',
      structureCouts:
        'Amortissement vélo cargo, assurance RC Pro, abonnement téléphonique, entretien, charges sociales micro-entreprise (~21,2%), carburant (électricité)',
      sourcesRevenus:
        'Tarification à la course/tournée, forfaits mensuels commerçants, commissions partenariats, suppléments urgences/heures pointes',
      status: 'REFINED',
      generatedFromBp: true,
      generatedAt: weeksAgo(2),
    },
  });
  console.log(`   ✅ BMC: 9 blocks filled, REFINED (${bmc.id})`);

  // ─── 11. FinancialForecast ───────────────────────────────────
  console.log('\n📦 Step 11: Creating FinancialForecast...');
  const forecast = await prisma.financialForecast.create({
    data: {
      userId: beneficiaryUser.id,
      sector: 'Transports et logistique',
      year1Revenue: 28000,
      year2Revenue: 38000,
      year3Revenue: 50000,
      year1Expenses: 8500,
      year2Expenses: 11000,
      year3Expenses: 14000,
      breakevenMonth: 5,
      initialInvestment: 4200,
      aiSynthesis:
        'Le projet de livraison du dernier kilomètre présente une viabilité financière correcte pour une micro-entreprise. Le seuil de rentabilité est atteint dès le 5ème mois, ce qui est encourageant. Le CA prévisionnel de 28 000 € en année 1 est réaliste compte tenu de la zone de chalandise (Montreuil, Bagnolet, Vincennes) et de l\'investissement initial modéré de 4 200 €. La marge nette estimée à 85% (après charges sociales de 21,2%) permet une rentabilité individuelle satisfaisante. Les charges fixes restent maîtrisées (assurance, téléphone, entretien). La croissance vers 50 000 € en année 3 suppose une diversification de la clientèle et potentiellement l\'embauche de sous-traitants. Points de vigilance : constituer une trésorerie de sécurité de 3 mois avant le démarrage, et sécuriser des contrats réguliers avec 3-5 commerçants pour lisser laactivité.',
    },
  });
  console.log(`   ✅ FinancialForecast: 28K/38K/50K€ (${forecast.id})`);

  // ─── 12. CreaSimSimulation ──────────────────────────────────
  console.log('\n📦 Step 12: Creating CreaSimSimulation...');
  // Calculate outputs
  const monthlyRevenue = 2500;
  const fixedCharges = [
    { name: 'Assurance RC Pro', amount: 45 },
    { name: 'Abonnement téléphonique', amount: 25 },
    { name: 'Entretien vélo cargo', amount: 60 },
    { name: 'Comptabilité/URSSAF', amount: 0 },
  ];
  const fixedChargesTotal = fixedCharges.reduce((s, c) => s + c.amount, 0); // 130
  const variableChargesRate = 12;
  const variableChargesAmount = (monthlyRevenue * variableChargesRate) / 100; // 300
  const totalCharges = fixedChargesTotal + variableChargesAmount; // 430
  const grossMarginAmount = monthlyRevenue - variableChargesAmount; // 2200
  const grossMarginRate = (grossMarginAmount / monthlyRevenue) * 100; // 88
  const netMarginAmount = monthlyRevenue - totalCharges; // 2070
  const netMarginRate = (netMarginAmount / monthlyRevenue) * 100; // 82.8
  const monthlyBreakeven = fixedChargesTotal / (1 - variableChargesRate / 100); // ~147.73
  const breakevenMonths = 4200 / netMarginAmount; // ~2.03
  const averageSellingPrice = 15;
  const unitCost = 3.5;
  const targetMarginRate = 30;

  const creasim = await prisma.creaSimSimulation.create({
    data: {
      userId: beneficiaryUser.id,
      monthlyRevenue,
      fixedCharges,
      variableChargesRate,
      averageSellingPrice,
      unitCost,
      targetMarginRate,
      initialInvestment: 4200,
      fixedChargesTotal,
      variableChargesAmount,
      totalCharges,
      grossMarginAmount,
      grossMarginRate,
      netMarginAmount,
      netMarginRate,
      monthlyBreakeven,
      breakevenMonths,
      profitability1Y: 28000 - 8500,
      profitability2Y: 38000 - 11000,
      profitability3Y: 50000 - 14000,
      year1Revenue: 28000,
      year1Expenses: 8500,
      year2Revenue: 38000,
      year2Expenses: 11000,
      year3Revenue: 50000,
      year3Expenses: 14000,
      aiAnalysis:
        'La simulation financière montre un modèle économique sain avec une marge nette de 82,8% sur le CA mensuel. L\'investissement initial de 4 200 € est récupérable en environ 2 mois d\'activité à rythme croisière. Le seuil de rentabilité mensuel est très bas (~148 €), ce qui réduit considérablement le risque financier. La tarification à 15 €/course avec un coût unitaire de 3,50 € offre une bonne marge de manœuvre. Attention : cette simulation ne tient pas compte des charges sociales (21,2% du CA) qui seront prélevées mensuellement, réduisant la marge nette réelle à environ 61,6%.',
    },
  });
  console.log(`   ✅ CreaSimSimulation: margin ${netMarginRate.toFixed(1)}% (${creasim.id})`);

  // ─── 13. JuridiqueAnalysis ──────────────────────────────────
  console.log('\n📦 Step 13: Creating JuridiqueAnalysis...');
  const juridique = await prisma.juridiqueAnalysis.create({
    data: {
      userId: beneficiaryUser.id,
      recommendedStatus: 'Micro-entrepreneur',
      fiscalRegime: 'Micro-BIC',
      legalStructure:
        'Entreprise Individuelle — Micro-entreprise',
      socialCharges: {
        cotisations_sociales: '21,2% du CA',
        CFE: '220€/an (Montreuil)',
        TVA: 'Franchise de TVA (CA < 85 800€)',
        ACRE:
          'Exonération partielle 1 an (50% de réduction)',
        formation:
          'Pas de diplôme requis pour l\'activité de livraison',
      },
    },
  });
  console.log(`   ✅ JuridiqueAnalysis: Micro-BIC (${juridique.id})`);

  // ─── 14. MarketAnalysis ─────────────────────────────────────
  console.log('\n📦 Step 14: Creating MarketAnalysis...');
  const market = await prisma.marketAnalysis.create({
    data: {
      userId: beneficiaryUser.id,
      sector:
        'Transports et logistique — Livraison du dernier kilomètre',
      marketSize:
        'Le marché de la livraison du dernier kilomètre en France est estimé à 12 milliards d\'euros (2024), avec une croissance annuelle de 8-10%. L\'Île-de-France représente 35% de ce marché.',
      targetAudience:
        'Particuliers, commerces de proximité, restaurateurs, e-commerçants locaux en Seine-Saint-Denis et Est parisien',
      trends: [
        { trend: 'Croissance du e-commerce local', impact: 'fort' },
        {
          trend: 'Transition écologique et ZFE',
          impact: 'fort',
        },
        {
          trend: 'Demande de livraison rapide (<1h)',
          impact: 'moyen',
        },
        {
          trend: 'Développement des dark kitchens',
          impact: 'moyen',
        },
        {
          trend: 'Sensibilisation au circuit court',
          impact: 'faible',
        },
      ],
      competitors: [
        {
          name: 'Stuart',
          force: 'Grande envergure, application',
          faiblesse: 'Peu de personnalisation, coûts élevés',
        },
        {
          name: 'Deliveroo',
          force: 'Notoriété, réseau restaurant',
          faiblesse: 'Commission élevée, concurrence interne',
        },
        {
          name: 'Livraisonurs indépendants locaux',
          force: 'Prix compétitif, flexibilité',
          faiblesse: 'Fiabilité variable, pas de structure',
        },
      ],
      opportunities:
        'ZFE Grand Paris favorise les véhicules électriques, croissance du commerce de proximité post-Covid, demande croissante de livraison verte, subventions vélo cargo (IDF Mobilités), marchés publics de livraison urbaine',
      threats:
        'Concurrence des plateformes (Stuart, Deliveroo), réglementation ZFE contraignante, risques d\'accident et vol, dépendance météorologique, pression sur les prix',
      aiSynthesis:
        'Le marché de la livraison du dernier kilomètre en Île-de-France est porteur avec une croissance de 8-10% par an. La ZFE Grand Paris constitue un avantage compétitif majeur pour le vélo cargo électrique, éliminant de facto la concurrence des véhicules thermiques en centre-ville. Le positionnement « local, humain et éco-responsable » différencie clairement le projet des plateformes nationales. La cible prioritaire doit être les commerçants de proximité (B2B) pour assurer un flux régulier de commandes, complété par les particuliers (B2C) pour optimiser les tournées. La menace principale est la pression tarifaire des plateformes, mais la niche du service personnalisé et de proximité reste sous-exploitée.',
    },
  });
  console.log(`   ✅ MarketAnalysis: 12 Md€ market (${market.id})`);

  // ─── 15. Tremplin ───────────────────────────────────────────
  console.log('\n📦 Step 15: Creating Tremplin...');
  const tremplin = await prisma.tremplin.create({
    data: {
      userId: beneficiaryUser.id,
      currentStep: 5,
      responses: {
        step1: {
          title: 'Motivation et projet',
          question:
            'Pourquoi souhaitez-vous créer cette activité ?',
          answer:
            'Après 5 ans comme chauffeur-livreur salarié pour un grand groupe, j\'ai acquis une solide expérience de la logistique urbaine et une connaissance fine du terrain en Seine-Saint-Denis. Je souhaite devenir mon propre patron pour avoir plus de liberté, choisir mes clients et proposer un service plus humain et respectueux de l\'environnement.',
          score: 8,
        },
        step2: {
          title: 'Compétences et expérience',
          question:
            'Quelles compétences possédez-vous pour ce projet ?',
          answer:
            'Permis B et C, 5 ans d\'expérience en livraison urbaine, maîtrise des outils de navigation et gestion de tournées, bonne connaissance de Montreuil et ses environs, compétences en service client, capacité à gérer les imprévus et le stress de la route.',
          score: 7,
        },
        step3: {
          title: 'Analyse de marché',
          question:
            'Comment analysez-vous votre marché cible ?',
          answer:
            'Le marché est en forte croissance porté par le e-commerce et la ZFE. Ma zone de chalandise (Montreuil, Bagnolet, Vincennes) compte de nombreux commerces de proximité et une population dense. Les concurrents principaux sont Stuart et Deliveroo, mais ils ciblent surtout la restauration. Il y a une vraie place pour un service de proximité plus personnalisé.',
          score: 7,
        },
        step4: {
          title: 'Prévisionnel financier',
          question: 'Quels sont vos prévisions financières ?',
          answer:
            'Investissement initial de 4 200 € (vélo cargo d\'occasion, équipement, assurance). CA prévisionnel de 28 000 € en année 1 avec un seuil de rentabilité au 5ème mois. Charges fixes mensuelles de 130 € + 12% de charges variables. L\'ACRE me permettra de réduire les cotisations sociales de 50% la première année.',
          score: 7,
        },
        step5: {
          title: 'Risques et mitigation',
          question:
            'Quels sont les principaux risques identifiés ?',
          answer:
            'Les risques principaux sont : (1) concurrence des plateformes, mitigée par le positionnement local et personnalisé ; (2) aléas météorologiques, atténués par l\'équipement adapté et la diversification des services ; (3) trésorerie de démarrage, couverte par une épargne de 3 mois ; (4) risque d\'accident, couvert par l\'assurance RC Pro et l\'équipement de sécurité.',
          score: 6,
        },
      },
      isCompleted: false,
      score: 72,
      decision: 'PENDING',
      summary:
        'Karim présente un profil solide avec une expérience terrain significative en livraison urbaine. Le projet est réaliste et bien ciblé sur un marché en croissance. Points de vigilance : diversification clientèle et gestion de la trésorerie de démarrage.',
      recommendations: [
        'Diversifier la clientèle dès le démarrage',
        'Négocier des contrats avec 3-5 commerçants avant le lancement',
        'Prévoir une trésorerie de 3 mois minimum',
        "S'inscrire sur les plateformes de mise en relation comme complément",
        "Profiter de l'ACRE pour la 1ère année",
      ],
    },
  });
  console.log(`   ✅ Tremplin: score 72, step 5/8 (${tremplin.id})`);

  // ─── 16. ZeroDraft ───────────────────────────────────────────
  console.log('\n📦 Step 16: Creating ZeroDraft...');
  const zeroDraftContent = `PROJET DE CRÉATION D'ENTREPRISE — TRANSPORTS ET LIVRAISON DU DERNIER KILOMÈTRE

Présentation du projet
Je souhaite créer une micro-entreprise de livraison du dernier kilomètre en milieu urbain, basée à Montreuil (Seine-Saint-Denis). L'activité consistera à effectuer des livraisons de colis, repas et courses pour le compte de particuliers et de petits commerces locaux, en utilisant un vélo cargo électrique.

Contexte et motivation
Après cinq années d'expérience comme chauffeur-livreur salarié dans le secteur de la logistique urbaine en Île-de-France, j'ai acquis une connaissance approfondie du terrain, des optimisations de tournées et des attentes des clients en matière de livraison. Cette expérience me donne une solide base pour me lancer à mon compte avec un avantage compétitif réel.

Le marché de la livraison du dernier kilomètre est en pleine expansion, porté par la croissance du e-commerce et les contraintes environnementales (ZFE Grand Paris). Le vélo cargo électrique répond parfaitement à ces enjeux : il est non polluant, silencieux, et permet de circuler dans les zones à faibles émissions.

Zone de chalandise et clientèle cible
Mon zone d'intervention couvrira Montreuil, Bagnolet et Vincennes — des communes denses en population et en commerces de proximité. Ma clientèle cible comprend les particuliers pour des courses et livraisons de colis, les petits commerces (épiceries, boulangeries, pharmacies) pour des livraisons à domicile, et les restaurants pour la livraison de repas.

Modèle économique
Le statut juridique retenu est la micro-entreprise sous régime Micro-BIC, avec bénéfice de l'ACRE pour la première année. L'investissement initial est estimé à 4 200 €, couvrant l'acquisition d'un vélo cargo électrique d'occasion, le matériel de livraison et l'assurance RC Pro. Le chiffre d'affaires prévisionnel de la première année est estimé entre 25 000 € et 35 000 €, avec un seuil de rentabilité atteint dès le 5ème mois d'activité.`;

  const zeroDraft = await prisma.zeroDraft.create({
    data: {
      userId: beneficiaryUser.id,
      projectTitle:
        'Transports et livraison — Livraisons du dernier kilomètre',
      content: zeroDraftContent,
      wordCount: zeroDraftContent.split(/\s+/).length,
      status: 'DRAFT',
    },
  });
  console.log(
    `   ✅ ZeroDraft: ${zeroDraft.wordCount} words, DRAFT (${zeroDraft.id})`,
  );

  // ─── 17. KiviatResults ──────────────────────────────────────
  console.log('\n📦 Step 17: Creating KiviatResults...');
  const kiviatData = [
    { category: 'leadership', score: 7.5 },
    { category: 'stress', score: 8.0 },
    { category: 'communication', score: 7.0 },
    { category: 'resolution', score: 8.5 },
    { category: 'creativity', score: 6.5 },
    { category: 'adaptability', score: 8.0 },
  ];

  for (const k of kiviatData) {
    await prisma.kiviatResult.create({
      data: {
        userId: beneficiaryUser.id,
        category: k.category,
        score: k.score,
        maxScore: 10,
      },
    });
  }
  console.log(`   ✅ KiviatResults: ${kiviatData.length} dimensions`);

  // ─── 18. RiasecResults ──────────────────────────────────────
  console.log('\n📦 Step 18: Creating RiasecResults...');
  const riasecData = [
    { profileType: 'R', score: 7.5, isDominant: false },
    { profileType: 'I', score: 3.0, isDominant: false },
    { profileType: 'A', score: 4.0, isDominant: false },
    { profileType: 'S', score: 7.0, isDominant: false },
    { profileType: 'E', score: 8.5, isDominant: true },
    { profileType: 'C', score: 5.5, isDominant: false },
  ];

  for (const r of riasecData) {
    await prisma.riasecResult.create({
      data: {
        userId: beneficiaryUser.id,
        profileType: r.profileType,
        score: r.score,
        isDominant: r.isDominant,
      },
    });
  }
  console.log(
    `   ✅ RiasecResults: E (Entreprenant) dominant at 8.5`,
  );

  // ─── 19. MotivationAssessment ───────────────────────────────
  console.log('\n📦 Step 19: Creating MotivationAssessment...');
  const motivation = await prisma.motivationAssessment.create({
    data: {
      userId: beneficiaryUser.id,
      scores: {
        autonomie: 9,
        revenus: 7,
        impact_social: 6,
        reconnaissance: 5,
        defi_personnel: 8,
        creation_valeur: 7,
        flexibilite: 9,
        heritage: 4,
      },
      summary:
        'Karim montre une forte motivation orientée vers l\'autonomie (9/10) et la flexibilité (9/10), ce qui correspond bien au statut de micro-entrepreneur. Le défi personnel (8/10) et la volonté de créer de la valeur (7/10) sont également des moteurs importants. La motivation financière est présente (7/10) mais n\'est pas le facteur principal. Le score plus faible en héritage (4/10) indique un projet résolument tourné vers l\'innovation et le présent plutôt que la tradition. Ce profil est cohérent avec un projet de création d\'entreprise dans un secteur en évolution.',
    },
  });
  console.log(`   ✅ MotivationAssessment: autonomy 9/10 (${motivation.id})`);

  // ─── 20. ModuleResults ──────────────────────────────────────
  console.log('\n📦 Step 20: Creating ModuleResults...');
  const moduleResultsData = [
    {
      moduleCode: 'phase-decouverte',
      score: 82,
      maxScore: 100,
      feedback:
        'Excellent travail d\'exploration. La vision du projet est claire et cohérente avec le profil de Karim.',
      completedAt: weeksAgo(2),
    },
    {
      moduleCode: 'diagnostic-competences',
      score: 76,
      maxScore: 100,
      feedback:
        'Profil compétent avec des points forts en logistique urbaine et gestion de tournées. Points à développer : gestion comptable et prospection commerciale.',
      completedAt: weeksAgo(1),
    },
    {
      moduleCode: 'analyse-marche',
      score: 78,
      maxScore: 100,
      feedback:
        'Analyse de marché solide avec une bonne compréhension des tendances du secteur et des avantages compétitifs liés à la ZFE.',
      completedAt: daysAgo(5),
    },
  ];

  for (const mr of moduleResultsData) {
    await prisma.moduleResult.create({
      data: {
        userId: beneficiaryUser.id,
        moduleCode: mr.moduleCode,
        score: mr.score,
        maxScore: mr.maxScore,
        answers: { completed: true },
        feedback: mr.feedback,
        completedAt: mr.completedAt,
      },
    });
  }
  console.log(`   ✅ ModuleResults: ${moduleResultsData.length} modules`);

  // ─── 21. CreascopeSession ───────────────────────────────────
  console.log('\n📦 Step 21: Creating CreascopeSession...');
  const threeDaysAgo = daysAgo(3);
  const creascopeSession = await prisma.creascopeSession.create({
    data: {
      beneficiaryId: beneficiary.id,
      counselorId: counselor.id,
      status: 'TERMINEE',
      currentStep: 'BILAN_IA',
      scheduledAt: threeDaysAgo,
      startedAt: threeDaysAgo,
      completedAt: threeDaysAgo,
      estimatedMinutes: 210,
      stepProgress: {
        ACCUEIL: {
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          durationMinutes: 15,
          notes: 'Présentation du parcours, vérification du projet',
        },
        FLASH_SWIPE: {
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          durationMinutes: 35,
          notes: '60 cartes swipées, bonne réactivité',
        },
        ANALYSE_INTERMEDIAIRE: {
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          durationMinutes: 20,
          notes: 'Premier retour sur les compétences fortes',
        },
        QUESTIONNAIRE: {
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          durationMinutes: 45,
          notes: 'Questionnaire RIASEC + motivation complété',
        },
        CHALLENGE_SCENARIO: {
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          durationMinutes: 40,
          notes: 'Scénario de gestion de crise traité avec brio',
        },
        BILAN_IA: {
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          durationMinutes: 25,
          notes: 'Bilan IA généré et commenté avec le conseiller',
        },
        PLAN_ACTION: {
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          durationMinutes: 30,
          notes: 'Plan d\'action défini sur 6 semaines',
        },
      },
      counselorNotes:
        'Karim est très motivé et son profil est cohérent avec le projet. Son expérience terrain en livraison est un atout majeur. Le bilan CréaScope confirme un potentiel entrepreneurial réel avec des compétences fortes en résolution de problèmes et adaptabilité. Prochaine étape : finaliser l\'analyse de marché et commencer le BMC.',
      aiInsights: {
        profile_summary:
          'Profil entrepreneurial affirmé avec un score global de 74/100. Karim combine une solide expérience opérationnelle en logistique urbaine avec de réelles capacités d\'adaptation et de résolution de problèmes.',
        strong_points: [
          'Expérience terrain significative (5 ans livraison urbaine)',
          'Connaissance approfondie de la zone de chalandise',
          'Bonnes capacités de gestion du stress et de l\'imprévu',
          'Motivation intrinsèque forte (autonomie, flexibilité)',
          'Sensibilisation à l\'impact environnemental',
        ],
        points_vigilance: [
          'Formation en gestion comptable à renforcer',
          'Stratégie de prospection commerciale à structurer',
          'Diversification clientèle à anticiper',
          'Gestion de la trésorerie de démarrage',
        ],
        recommended_modules: [
          'analyse-marche',
          'bmc',
          'simulation-financiere',
          'juridique',
        ],
        score_detail: {
          global: 74,
          competences: 76,
          motivation: 82,
          faisabilite: 72,
          coherence: 75,
        },
      },
      actionPlan: {
        semaine1: {
          title: 'Structuration du projet',
          tasks: [
            'Valider le business model canvas avec le conseiller',
            'Contacter 5 commerçants locaux pour des retours terrain',
            'Demander des devis assurance RC Pro (2-3 assureurs)',
          ],
        },
        semaine2: {
          title: 'Étude de marché approfondie',
          tasks: [
            'Réaliser une enquête de terrain (10-15 commerçants)',
            'Analyser la tarification des concurrents locaux',
            'Identifier les subventions disponibles (IDF Mobilités)',
          ],
        },
        semaine3: {
          title: 'Prévisionnel financier',
          tasks: [
            'Finaliser le prévisionnel avec la simulation CreaSim',
            'Estimer les charges sociales avec le simulateur URSSAF',
            'Préparer le plan de trésorerie sur 12 mois',
          ],
        },
        semaine4: {
          title: 'Démarches juridiques',
          tasks: [
            'Valider le choix du statut micro-entreprise',
            'Préparer le dossier d\'immatriculation',
            'Prendre rendez-vous avec un comptable pour un avis',
          ],
        },
        semaine5_6: {
          title: 'Lancement',
          tasks: [
            'Immatriculer la micro-entreprise',
            'Acquérir le vélo cargo électrique',
            'Lancer la prospection commerciale active',
            'Créer les profils sur les réseaux sociaux',
          ],
        },
      },
      globalScore: 74,
    },
  });
  console.log(
    `   ✅ CreascopeSession: score 74, TERMINEE (${creascopeSession.id})`,
  );

  // ─── 22. ConsentLogs ────────────────────────────────────────
  console.log('\n📦 Step 22: Creating ConsentLogs...');
  const consentsData: Array<{
    consentType: 'COOKIES' | 'CGU' | 'DONNEES_PERSONNELLES' | 'CREASCOPE';
  }> = [
    { consentType: 'COOKIES' },
    { consentType: 'CGU' },
    { consentType: 'DONNEES_PERSONNELLES' },
    { consentType: 'CREASCOPE' },
  ];

  for (const c of consentsData) {
    await prisma.consentLog.create({
      data: {
        userId: beneficiaryUser.id,
        consentType: c.consentType,
        status: 'GRANTED',
        source: 'web',
        version: '1.0',
        grantedAt: weeksAgo(2),
      },
    });
  }
  console.log(`   ✅ ConsentLogs: ${consentsData.length} granted`);

  // ─── 23. Notifications ──────────────────────────────────────
  console.log('\n📦 Step 23: Creating Notifications...');
  const notificationsData = [
    {
      title: 'Parcours CréaScope terminé !',
      content:
        'Félicitations ! Votre bilan CréaScope est terminé avec un score de 74/100. Consultez vos résultats détaillés et votre plan d\'action personnalisé.',
      type: 'MILESTONE' as const,
      isRead: true,
      createdAt: daysAgo(3),
    },
    {
      title: 'Module Analyse de marché complété',
      content:
        'Vous avez complété le module d\'analyse de marché avec un score de 78/100. Passez maintenant au Business Model Canvas.',
      type: 'SUCCESS' as const,
      isRead: true,
      createdAt: daysAgo(5),
    },
    {
      title: 'Rappel : Finaliser votre BMC',
      content:
        'Votre Business Model Canvas est en cours de finalisation. N\'oubliez pas de valider les 9 blocs avec votre conseiller Sophie Martin-Dupont.',
      type: 'ACTION_REQUIRED' as const,
      isRead: false,
      createdAt: daysAgo(1),
    },
    {
      title: 'Nouveau : Simulation financière disponible',
      content:
        'La simulation CreaSim est maintenant disponible pour votre projet. Testez différents scénarios de revenus et charges.',
      type: 'INFO' as const,
      isRead: false,
      createdAt: hoursAgo(6),
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({
      data: {
        userId: beneficiaryUser.id,
        title: n.title,
        content: n.content,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      },
    });
  }
  console.log(
    `   ✅ Notifications: ${notificationsData.length} created`,
  );

  // ─── 24. NewsArticles ───────────────────────────────────────
  console.log('\n📦 Step 24: Creating NewsArticles...');
  const newsData = [
    {
      slug: 'micro-entreprise-2025-nouveautes',
      title: 'Micro-entreprise 2025 : ce qui change pour les auto-entrepreneurs',
      excerpt:
        'Tour d\'horizon des évolutions réglementaires et fiscales qui impactent les micro-entrepreneurs en 2025.',
      content:
        'En 2025, plusieurs évolutions impactent les micro-entrepreneurs. Le plafond de chiffre d\'affaires pour la franchise de TVA est revalorisé. Les cotisations sociales restent à 21,2% du CA pour les activités de prestations de services. L\'ACRE continue d\'offrir une exonération partielle de 50% des cotisations sociales pendant la première année. De nouvelles aides régionales, notamment en Île-de-France, soutiennent les créateurs dans les secteurs de la livraison écologique.',
      category: 'Réglementation',
      imageGradient: 'from-teal-500 to-emerald-600',
      isPublished: true,
      isFeatured: true,
      readTime: 4,
      publishedAt: daysAgo(7),
    },
    {
      slug: 'livraison-dernier-kilometre-velo-cargo',
      title:
        'Livraison du dernier kilomètre : pourquoi le vélo cargo s\'impose en ville',
      excerpt:
        'Face à la ZFE et à la demande de livraison verte, le vélo cargo devient l\'outil incontournable des livreurs urbains indépendants.',
      content:
        'Dans les grandes villes françaises, la livraison du dernier kilomètre est en pleine mutation. Les Zones à Faibles Émissions (ZFE) restreignent progressivement l\'accès des véhicules thermiques en centre-ville. Le vélo cargo électrique s\'impose comme la solution idéale : il est silencieux, non polluant, et peut circuler dans toutes les zones. Pour les auto-entrepreneurs, l\'investissement initial est modéré (2 000 à 5 000 € pour un modèle d\'occasion) et les aides régionales comme IDF Mobilités proposent des subventions pouvant atteindre 1 000 €.',
      category: 'Inspiration',
      imageGradient: 'from-amber-500 to-orange-600',
      isPublished: true,
      isFeatured: true,
      readTime: 6,
      publishedAt: daysAgo(14),
    },
    {
      slug: 'zfe-grand-paris-impact-livreurs',
      title:
        'ZFE Grand Paris : quel impact pour les livreurs indépendants ?',
      excerpt:
        'La ZFE Grand Paris change la donne pour les livreurs. Décryptage des contraintes et opportunités.',
      content:
        'La ZFE Grand Paris, pleinement opérationnelle depuis 2024, interdit progressivement les véhicules les plus polluants dans Paris et les communes limitrophes. Pour les livreurs indépendants, cela représente à la fois une contrainte et une opportunité. La contrainte : obligation d\'utiliser un véhicule propre (électrique, hybride rechargeable, vélo cargo). L\'opportunité : les livreurs en vélo cargo bénéficient d\'un avantage compétitif face aux livreurs en fourgon qui doivent investir dans des véhicules électriques beaucoup plus coûteux.',
      category: 'Tendances',
      imageGradient: 'from-sky-500 to-cyan-600',
      isPublished: true,
      isFeatured: false,
      readTime: 5,
      publishedAt: daysAgo(21),
    },
    {
      slug: 'subventions-velo-cargo-idf-2025',
      title:
        'Subventions vélo cargo en Île-de-France : guide complet 2025',
      excerpt:
        'Découvrez toutes les aides disponibles pour financer votre vélo cargo en Île-de-France.',
      content:
        'Plusieurs dispositifs d\'aide existent en Île-de-France pour l\'acquisition d\'un vélo cargo. IDF Mobilités propose une aide de 500 à 1 000 € selon le type de vélo. La mairie de Paris offre une prime vélo cargo de 900 € pour les professionnels. Montreuil propose également une aide de 300 à 500 € pour ses habitants. Il est possible de cumuler plusieurs aides sous certaines conditions. Les conditions d\'éligibilité varient selon les dispositifs.',
      category: 'Financement',
      imageGradient: 'from-lime-500 to-green-600',
      isPublished: true,
      isFeatured: false,
      readTime: 7,
      publishedAt: daysAgo(10),
    },
  ];

  for (const n of newsData) {
    await prisma.newsArticle.create({ data: n });
  }
  console.log(`   ✅ NewsArticles: ${newsData.length} articles`);

  // ─── 25. Networks ───────────────────────────────────────────
  console.log('\n📦 Step 25: Creating Network contacts...');
  const networksData = [
    {
      name: 'CCI Paris Île-de-France — Antenne 93',
      type: 'Institutionnel',
      contact: 'Mme Durand',
      email: 'contact@cci-paris-idf.fr',
      phone: '01 49 52 42 00',
      notes:
        'Information sur les formalités de création et le marché local. Ateliers gratuits pour créateurs.',
    },
    {
      name: 'BGE Montreuil',
      type: 'Accompagnement',
      contact: 'M. Lemaire',
      email: 'bge.montreuil@bge.asso.fr',
      phone: '01 48 58 12 34',
      notes:
        'Accompagnement à la création, ateliers pré-création, suivi post-création. Partenaire du GIDEF.',
    },
    {
      name: 'France Active Île-de-France',
      type: 'Financement',
      contact: 'Service création',
      email: 'idf@franceactive.org',
      phone: '01 53 36 35 00',
      notes:
        'Microcrédit, prêts d\'honneur. Peut compléter l\'apport personnel pour l\'achat du vélo cargo.',
    },
    {
      name: 'IDF Mobilités — Aide vélo cargo',
      type: 'Subvention',
      contact: 'En ligne',
      email: 'aide-velo@iledefrance-mobilites.fr',
      phone: '',
      notes:
        'Aide financière de 500 à 1 000 € pour l\'acquisition d\'un vélo cargo électrique. Dossier en ligne.',
    },
  ];

  for (const n of networksData) {
    await prisma.network.create({
      data: {
        userId: beneficiaryUser.id,
        ...n,
      },
    });
  }
  console.log(`   ✅ Networks: ${networksData.length} contacts`);

  // ─── 26. Registration ───────────────────────────────────────
  console.log('\n📦 Step 26: Creating Registration...');
  const registration = await prisma.registration.create({
    data: {
      userId: beneficiaryUser.id,
      projectType: 'Micro-entreprise — Transport et livraison',
      projectDescription:
        'Service de livraison du dernier kilomètre en milieu urbain (Île-de-France), sous le régime de la micro-entreprise. Utilisation d\'un vélo cargo électrique pour des livraisons de colis, repas et courses pour les particuliers et petits commerces locaux. Zone de chalandise : Montreuil, Bagnolet, Vincennes.',
      projectStage: 'Idéation avancée',
      motivations:
        'Devenir indépendant après 5 ans de salariat, capitaliser sur mon expérience en logistique urbaine, proposer une alternative éco-responsable aux grands groupes de livraison.',
      needs: [
        'Accompagnement création',
        'Aide au business plan',
        'Financement',
      ],
      supportType: 'Accompagnement création',
    },
  });
  console.log(`   ✅ Registration: ${registration.projectType}`);

  // ─── Summary ────────────────────────────────────────────────
  console.log('\n' + '━'.repeat(60));
  console.log('✅ CreaScope Demo Seed — Complete!');
  console.log('━'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Tenant:          ${tenant.name} (${tenant.slug})`);
  console.log(`   Organization:    ${org.name}`);
  console.log(`   Dispositifs:     ${dispositifCreascope.name}, ${dispositifCreapulse.name}`);
  console.log(`   Beneficiary:     ${beneficiaryUser.firstName} ${beneficiaryUser.lastName}`);
  console.log(`                    → ${beneficiaryUser.email}`);
  console.log(`   Counselor:       ${counselor.name}`);
  console.log(`                    → ${counselorUser.email}`);
  console.log(`   Enrollment:      ${enrollment.projectTitle} (${enrollment.progress}%)`);
  console.log(`   Journey:         Phase ${journey.currentPhase} — ${journey.progressPercent}%`);
  console.log(`   BMC:             ${bmc.status} (9 blocks)`);
  console.log(`   Financial:       Y1=28K€, Y2=38K€, Y3=50K€`);
  console.log(`   CreaSim:         Margin ${netMarginRate.toFixed(1)}%, BE ${breakevenMonths.toFixed(1)} months`);
  console.log(`   Juridique:       ${juridique.legalStructure}`);
  console.log(`   Market:          ${market.sector}`);
  console.log(`   Tremplin:        Score ${tremplin.score}/100, Step ${tremplin.currentStep}/8`);
  console.log(`   ZeroDraft:       ${zeroDraft.wordCount} words, ${zeroDraft.status}`);
  console.log(`   Kiviat:          ${kiviatData.length} dimensions`);
  console.log(`   RIASEC:          E dominant (${riasecData.find((r) => r.isDominant)?.score}/10)`);
  console.log(`   Modules:         ${moduleResultsData.length} completed`);
  console.log(`   Session CréaScope: Score ${creascopeSession.globalScore}/100, ${creascopeSession.status}`);
  console.log(`   Consents:        ${consentsData.length} granted`);
  console.log(`   Notifications:   ${notificationsData.length}`);
  console.log(`   NewsArticles:    ${newsData.length}`);
  console.log(`   Networks:        ${networksData.length} contacts`);
  console.log(`   Registration:    ${registration.projectType}`);
  console.log('\n🔑 Login credentials: Demo2026!');
  console.log('━'.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });