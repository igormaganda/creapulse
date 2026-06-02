// ============================================
// CreaPulse V2 — Diagnostic Seed Script
// Generates complete demo data for all diagnostic tools
// Run: npx tsx prisma/seed-diagnostic.ts
// ============================================

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('\ud83c\udf31 Seeding complete diagnostic data for CreaPulse V2...\n')

  const now = new Date()
  const pastDate = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const hash = (pw: string) => bcrypt.hashSync(pw, 12)

  try {
    // ────────────────────────────────────────────
    // 1. FIND EXISTING TENANT & USERS
    // ────────────────────────────────────────────
    console.log('ud83d\udd0d Finding existing data...')

    let tenant = await db.tenant.findFirst({ where: { slug: 'gidef-idf' } })
    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: 'GIDEF \u00cele-de-France',
          slug: 'gidef-idf',
          plan: 'ENTERPRISE',
          primaryColor: '#00838F',
          settings: { language: 'fr', theme: 'light' },
        },
      })
    }
    console.log(`   \u2705 Tenant: ${tenant.name}`)

    let org = await db.organization.findFirst()
    if (!org) {
      org = await db.organization.create({
        data: {
          tenantId: tenant.id,
          name: 'GIDEF Paris Centre',
          type: 'GIDEF_AGENCY',
          city: 'Paris',
          postalCode: '75002',
          region: '\u00cele-de-France',
        },
      })
    }

    // Ensure admin exists
    let admin = await db.user.findFirst({ where: { tenantId: tenant.id, role: 'ADMIN' } })
    if (!admin) {
      admin = await db.user.create({
        data: {
          tenantId: tenant.id,
          email: 'admin@gidef.fr',
          passwordHash: hash('Admin123!'),
          firstName: 'Admin',
          lastName: 'GIDEF',
          role: 'ADMIN',
          emailVerified: true,
        },
      })
    }

    // Ensure counselors exist
    const counselorData = [
      { email: 'marie.dupont@gidef.fr', firstName: 'Marie', lastName: 'Dupont', pw: 'Conseiller1!', specs: ["Cr\u00e9ation d'entreprise", 'Business Plan', 'Financement'] },
      { email: 'jean.martin@gidef.fr', firstName: 'Jean', lastName: 'Martin', pw: 'Conseiller2!', specs: ['Marketing digital', 'R\u00e9seaux sociaux', 'E-commerce'] },
    ]

    const counselors: Record<string, any> = {}
    for (const cd of counselorData) {
      let user = await db.user.findFirst({ where: { tenantId: tenant.id, email: cd.email } })
      if (!user) {
        user = await db.user.create({
          data: {
            tenantId: tenant.id,
            email: cd.email,
            passwordHash: hash(cd.pw),
            firstName: cd.firstName,
            lastName: cd.lastName,
            role: 'COUNSELOR',
            emailVerified: true,
          },
        })
      }
      let counselor = await db.counselor.findUnique({ where: { userId: user.id } })
      if (!counselor) {
        counselor = await db.counselor.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            name: `${cd.firstName} ${cd.lastName}`,
            specialities: cd.specs,
            certifications: ['Certification BGE'],
          },
        })
      }
      counselors[cd.email] = counselor
      console.log(`   \u2705 Counselor: ${cd.firstName} ${cd.lastName}`)
    }

    // ────────────────────────────────────────────
    // 2. CREATE 3 BENEFICIARIES WITH FULL PROFILES
    // ────────────────────────────────────────────
    console.log('\ud83c\udfae Creating 3 beneficiaries with complete profiles...')

    const beneficiariesData = [
      {
        email: 'sophie.bernard@email.fr', firstName: 'Sophie', lastName: 'Bernard', pw: 'Beneficiaire1!',
        projectTitle: 'Studio Bloom \u2014 Agence de Design Cr\u00e9atif',
        projectDesc: "Agence sp\u00e9cialis\u00e9e en identit\u00e9 visuelle, branding et design digital pour startups et PME en \u00cele-de-France.",
        sector: 'Services cr\u00e9atifs', stage: 'Id\u00e9ation valid\u00e9e', motivation: "Passion pour le design et envie d'entreprendre apr\u00e8s 5 ans en salari\u00e9",
        target: 'Startups, PME, ind\u00e9pendants en \u00cele-de-France', value: 'Un design accessible et impactant pour faire d\u00e9coller votre marque',
        revenue: '45 000\u20ac la premi\u00e8re ann\u00e9e', investment: '8 000\u20ac',
        employment: 'UNEMPLOYED', education: 'Bac+3', diploma: 'Licence en Communication',
        skills: [{ name: 'Design graphique', level: 4 }, { name: 'R\u00e9daction web', level: 3 }, { name: 'Photographie', level: 3 }, { name: 'Community management', level: 2 }],
        phase: 'STRATEGY', progress: 68,
      },
      {
        email: 'thomas.petit@email.fr', firstName: 'Thomas', lastName: 'Petit', pw: 'Beneficiaire2!',
        projectTitle: 'TaskFlow \u2014 Application SaaS de Gestion de Projets',
        projectDesc: 'Application web simplifi\u00e9e de gestion de t\u00e2ches et projets pour les TPE/PME.',
        sector: 'Tech / SaaS', stage: 'Prototype en cours', motivation: "D\u00e9tecter un manque d'outils simples et abordables pour les petites structures",
        target: 'TPE, PME, freelances', value: 'La gestion de projet simplifi\u00e9e \u00e0 un prix abordable',
        revenue: '80 000\u20ac la premi\u00e8re ann\u00e9e', investment: '25 000\u20ac',
        employment: 'EMPLOYED', education: 'Bac+5', diploma: 'Master en Informatique',
        skills: [{ name: 'D\u00e9veloppement web', level: 5 }, { name: 'Gestion de projet', level: 4 }, { name: 'Data analyse', level: 3 }, { name: 'UX Design', level: 2 }],
        phase: 'ECOSYSTEM', progress: 82,
      },
      {
        email: 'amina.diallo@email.fr', firstName: 'Amina', lastName: 'Diallo', pw: 'Beneficiaire3!',
        projectTitle: 'Saveurs d\u2019Ici \u2014 \u00c9picerie Fine & Produits Locaux',
        projectDesc: "\u00c9picerie fine proposant des produits artisanaux et locaux d'\u00cele-de-France, avec un espace d\u00e9gustation et ateliers culinaires.",
        sector: 'Commerce / Alimentation', stage: 'Recherche de local', motivation: 'Valoriser le terroir francilien et cr\u00e9er un lieu de rencontres autour de la gastronomie locale',
        target: 'Gastronomes, \u00e9picurieux, habitants du quartier', value: 'Des produits locaux, des saveurs authentiques, un lieu de partage',
        revenue: '120 000\u20ac la premi\u00e8re ann\u00e9e', investment: '35 000\u20ac',
        employment: 'SELF_EMPLOYED', education: 'Bac+2', diploma: 'BTS Commerce',
        skills: [{ name: 'Gestion commerciale', level: 4 }, { name: 'N\u00e9gociation', level: 4 }, { name: 'Marketing', level: 3 }, { name: 'Comptabilit\u00e9', level: 2 }],
        phase: 'LAUNCH', progress: 90,
      },
    ]

    const users: Record<string, any> = {}
    const beneficiaries: Record<string, any> = {}

    for (const bd of beneficiariesData) {
      let user = await db.user.findFirst({ where: { tenantId: tenant.id, email: bd.email } })
      if (!user) {
        user = await db.user.create({
          data: {
            tenantId: tenant.id,
            email: bd.email,
            passwordHash: hash(bd.pw),
            firstName: bd.firstName,
            lastName: bd.lastName,
            role: 'BENEFICIARY',
            emailVerified: true,
            lastLoginAt: pastDate(Math.floor(Math.random() * 3) + 1),
          },
        })
      }

      let beneficiary = await db.beneficiary.findUnique({ where: { userId: user.id } })
      if (!beneficiary) {
        beneficiary = await db.beneficiary.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            employmentStatus: bd.employment,
            educationLevel: bd.education,
            lastDiploma: bd.diploma,
            skills: JSON.stringify(bd.skills),
            progressScore: bd.progress,
          },
        })
      }

      // Creator Journey
      let journey = await db.creatorJourney.findUnique({ where: { userId: user.id } })
      if (!journey) {
        journey = await db.creatorJourney.create({
          data: {
            userId: user.id,
            currentPhase: bd.phase,
            progressPercent: bd.progress,
            projectTitle: bd.projectTitle,
            projectDescription: bd.projectDesc,
            projectSector: bd.sector,
            projectStage: bd.stage,
            creationMotivation: bd.motivation,
            targetAudience: bd.target,
            valueProposition: bd.value,
            estimatedRevenue: bd.revenue,
            estimatedInvestment: bd.investment,
            bpStatus: bd.progress > 50 ? 'IN_PROGRESS' : 'NOT_STARTED',
            bpSections: JSON.stringify(getBpSections(bd.sector)),
            status: 'ACTIVE',
          },
        })
      }

      // Counselor assignment
      const primaryCounselor = Object.values(counselors)[0] as any
      const existing = await db.counselorAssignment.findFirst({
        where: { counselorId: primaryCounselor.id, beneficiaryId: beneficiary.id },
      })
      if (!existing) {
        await db.counselorAssignment.create({
          data: { counselorId: primaryCounselor.id, beneficiaryId: beneficiary.id, role: 'PRIMARY', status: 'ACTIVE' },
        })
      }

      users[bd.email] = user
      beneficiaries[bd.email] = { user, beneficiary, journey }
      console.log(`   \u2705 ${bd.firstName} ${bd.lastName} \u2014 ${bd.projectTitle}`)
    }

    // ────────────────────────────────────────────
    // 3. KIVIAT RESULTS (8 dimensions x 3 beneficiaries)
    // ────────────────────────────────────────────
    console.log('\ud83d\udcca Creating Kiviat results (8 dimensions)...')

    const kiviatDimensions = ['leadership', 'creativite', 'communication', 'organisation', 'gestion_risque', 'adaptabilite', 'motivation', 'stress']

    const kiviatData = {
      'sophie.bernard@email.fr': [8.2, 9.5, 7.8, 6.5, 5.8, 8.0, 9.0, 4.2],
      'thomas.petit@email.fr': [7.0, 6.5, 6.0, 9.2, 7.5, 7.8, 8.5, 5.5],
      'amina.diallo@email.fr': [8.8, 7.0, 9.2, 8.5, 7.0, 8.5, 9.5, 6.8],
    }

    for (const [email, scores] of Object.entries(kiviatData)) {
      const user = users[email]
      for (let i = 0; i < kiviatDimensions.length; i++) {
        await db.kiviatResult.upsert({
          where: { userId_category: { userId: user.id, category: kiviatDimensions[i] } },
          update: { score: scores[i] },
          create: { userId: user.id, category: kiviatDimensions[i], score: scores[i], maxScore: 10 },
        })
      }
      console.log(`   \u2705 Kiviat: ${email.split('@')[0]} (${scores.map(s => s.toFixed(1)).join('/')})`)
    }

    // ────────────────────────────────────────────
    // 4. RIASEC RESULTS (6 types x 3 beneficiaries)
    // ────────────────────────────────────────────
    console.log('\ud83c\udf9c Creating RIASEC results...')

    const riasecData = {
      'sophie.bernard@email.fr': [
        { type: 'R', score: 5.2, dominant: false },
        { type: 'I', score: 7.8, dominant: true },
        { type: 'A', score: 9.1, dominant: true },
        { type: 'S', score: 6.5, dominant: false },
        { type: 'E', score: 4.3, dominant: false },
        { type: 'C', score: 3.8, dominant: false },
      ],
      'thomas.petit@email.fr': [
        { type: 'R', score: 6.0, dominant: false },
        { type: 'I', score: 8.5, dominant: true },
        { type: 'A', score: 5.0, dominant: false },
        { type: 'S', score: 4.5, dominant: false },
        { type: 'E', score: 7.8, dominant: true },
        { type: 'C', score: 8.2, dominant: true },
      ],
      'amina.diallo@email.fr': [
        { type: 'R', score: 7.5, dominant: true },
        { type: 'I', score: 5.8, dominant: false },
        { type: 'A', score: 6.2, dominant: false },
        { type: 'S', score: 9.0, dominant: true },
        { type: 'E', score: 8.5, dominant: true },
        { type: 'C', score: 7.0, dominant: false },
      ],
    }

    for (const [email, results] of Object.entries(riasecData)) {
      const user = users[email]
      for (const r of results) {
        await db.riasecResult.upsert({
          where: { userId_profileType: { userId: user.id, profileType: r.type } },
          update: { score: r.score, isDominant: r.dominant },
          create: { userId: user.id, profileType: r.type, score: r.score, isDominant: r.dominant },
        })
      }
      console.log(`   \u2705 RIASEC: ${email.split('@')[0]} (dominants: ${results.filter(r => r.dominant).map(r => r.type).join(', ')})`)
    }

    // ────────────────────────────────────────────
    // 5. TREMPLIN RESULTS (6 steps, 23 questions)
    // ────────────────────────────────────────────
    console.log('\ud83c\udfaf Creating Tremplin results...')

    const tremplinData = {
      'sophie.bernard@email.fr': {
        step: 6, completed: true, score: 78, decision: 'GO',
        responses: {
          step1: { q1: "J'ai toujours \u00e9t\u00e9 passionn\u00e9e par le design cr\u00e9atif. Apr\u00e8s 5 ans en agence, je veux ma propre vision.", q2: "Cr\u00e9er une agence accessible aux petites structures qui n'ont pas le budget des grandes agences.", q3: "Mon r\u00e9seau professionnel de 5 ans, mes comp\u00e9tences en design et ma connaissance du march\u00e9." },
          step2: { q4: "Micro-entreprise au d\u00e9part, puis SASU si le CA d\u00e9passe 70k\u20ac.", q5: "8 000\u20ac (ordinateur, licence Adobe, site web, fonds de roulement 3 mois).", q6: "Non, je n'ai pas de dettes ni d'engagements financiers." },
          step3: { q7: "48 clients/an \u00e0 800\u20ac en moyenne + 3 abonnements mensuels \u00e0 200\u20ac.", q8: " charges fixes mensuelles : loyer coworking 300\u20ac, assurances 80\u20ac, t\u00e9l\u00e9com 40\u20ac, charges variables 15% du CA.", q9: "Le seuil de rentabilit\u00e9 est atteint au 8\u00e8me mois avec 5 clients r\u00e9guliers.", q10: "Mon \u00e9poux a un CDI, nous avons 6 mois d'\u00e9pargne." },
          step4: { q11: "Oui, 3 prospects confirm\u00e9s et 5 contacts LinkedIn int\u00e9ress\u00e9s.", q12: "Oui, j'ai \u00e9tudi\u00e9 5 agences concurrentes et identifi\u00e9 mon positionnement prix/qualit\u00e9.", q13: "J'ai un portfolio de 25 projets r\u00e9alis\u00e9s en agence." },
          step5: { q14: "Oui, je suis pr\u00eate \u00e0 me consacrer \u00e0 100% au projet.", q15: "Mon conjoint me soutient, mes parents sont confiants.", q16: "Oui, je me sens pr\u00eate psychologiquement et financi\u00e8rement." },
          step6: { q17: "Design identit\u00e9 visuelle, branding, design digital, packaging.", q18: "Startups en early-stage, PME en rebranding, ind\u00e9pendants.", q19: "Cr\u00e9er un design qui transforme l'image de marque en business." },
        },
        summary: "Projet coh\u00e9rent port\u00e9 par une entrepreneure exp\u00e9riment\u00e9e avec un r\u00e9seau d\u00e9j\u00e0 actif. Le march\u00e9 est r\u00e9el, le mod\u00e8le \u00e9conomique viable. Recommandation : GO.",
        recommendations: ["Commencer en micro-entreprise", "D\u00e9velopper le r\u00e9seau LinkedIn", "Pr\u00e9voir un compte de r\u00e9sultat \u00e0 3 ans"],
      },
      'thomas.petit@email.fr': {
        step: 6, completed: true, score: 72, decision: 'GO_CONDITIONAL',
        responses: {
          step1: { q1: "J'ai d\u00e9tect\u00e9 un manque dans les outils de gestion pour TPE/PME pendant mon poste de chef de projet.", q2: "D\u00e9velopper un SaaS simple et abordable pour la gestion de t\u00e2ches.", q3: "5 ans d'exp\u00e9rience en dev, 2 ans en gestion de projet, ma\u00eetrise de React et Node.js." },
          step2: { q4: "SAS ou SASU avec option BSPCE pour futurs employ\u00e9s.", q5: "25 000\u20ac (d\u00e9veloppement, serveurs, marketing lancement, 6 mois de frais).", q6: "Non, mais je conserve mon CDI actuel en parall\u00e8le." },
          step3: { q7: "200 abonnements \u00e0 29\u20ac/mois + 10 entreprises \u00e0 99\u20ac/mois en ann\u00e9e 1.", q8: " charges : h\u00e9bergement 200\u20ac/mois, support part-time 1 500\u20ac/mois, marketing 500\u20ac/mois.", q9: "Le seuil de rentabilit\u00e9 est atteint au 14\u00e8me mois.", q10: "Mon CDI actuel me permet de couvrir mes charges personnelles." },
          step4: { q11: "15 entreprises int\u00e9ress\u00e9es lors d'une \u00e9tude de march\u00e9.", q12: "Asana, Trello, Monday sont des concurrents directs mais ciblent un segment diff\u00e9rent.", q13: "J'ai un prototype fonctionnel et 3 b\u00eata-testeurs." },
          step5: { q14: "Oui, je vais quitter mon CDI dans 2 mois.", q15: "Mon \u00e9pouse me soutient. Inqui\u00e9tude sur la r\u00e9duction de revenus.", q16: "Confiant mais conscient des risques. Je pars avec 12 mois d'\u00e9pargne." },
          step6: { q17: "Gestion de t\u00e2ches simplifi\u00e9e, tableau Kanban, rapports automatiques.", q18: "TPE de 2-20 employ\u00e9s, freelances, associations.", q19: "La gestion de projet enfin simple et abordable pour tous." },
        },
        summary: "Projet innovant port\u00e9 par un d\u00e9veloppeur comp\u00e9tent. Le march\u00e9 existe mais la concurrence est forte. Recommandation : GO CONDITIONNEL sous r\u00e9serve d\u2019un plan de sortie progressif du CDI et d\u2019un marketing agressif.",
        recommendations: ["Valider le product-market fit avant de quitter le CDI", "Lancer une version freemium pour acqu\u00e9rir des utilisateurs rapidement", "S\u00e9curiser 12 mois de tr\u00e9sorerie personnelle"],
      },
      'amina.diallo@email.fr': {
        step: 6, completed: true, score: 85, decision: 'GO',
        responses: {
          step1: { q1: "Apr\u00e8s 10 ans dans le commerce alimentaire, je veux cr\u00e9er mon propre concept autour du local.", q2: "Ouvrir une \u00e9picerie fine avec espace d\u00e9gustation et ateliers culinaires.", q3: "10 ans dans le commerce, r\u00e9seau de 50+ producteurs locaux, connaissance des produits." },
          step2: { q4: "SARL pour prot\u00e9ger mon patrimoine et faciliter l'association future.", q5: "35 000\u20ac (am\u00e9nagement, stock initial, mat\u00e9riel, fonds de commerce, communication).", q6: "J'ai un pr\u00eat personnel de 10 000\u20ac, le reste sera financ\u00e9 par \u00e9pargne et aides." },
          step3: { q7: "CA annuel 120k\u20ac (60% produits, 25% ateliers, 15% d\u00e9gustations).", q8: " charges : loyer 1 500\u20ac, personnel 2 000\u20ac (mi-temps), \u00e9lectricit\u00e9 300\u20ac, achats 60% du CA produits.", q9: "Rentabilit\u00e9 au 10\u00e8me mois avec 50 clients hebdomadaires.", q10: "Mon conjoint a un revenu stable. \u00c9pargne de 15 000\u20ac disponible." },
          step4: { q11: "3 producteurs engag\u00e9s, 20 pr\u00e9-inscriptions newsletter, le quartier est en gentrification.", q12: "1 \u00e9picerie concurrente \u00e0 800m mais positionnement diff\u00e9rent (prix discount).", q13: "Exp\u00e9rience 10 ans, formation HACCP, permis de vendre." },
          step5: { q14: "Oui, je d\u00e9missionne fin du mois.", q15: "Famille tr\u00e8s soutenante, conjoint aidant.", q16: "Pr\u00eate \u00e0 100%. J'ai r\u00e9fl\u00e9chi pendant 2 ans." },
          step6: { q17: "Produits \u00e9picerie fine, ateliers culinaires, d\u00e9gustations, commandes entreprise.", q18: "Habitants du quartier, gastronomes, entreprises pour cadeaux.", q19: "Le terroir \u00cele-de-France dans votre assiette, avec amour et authenticit\u00e9." },
        },
        summary: "Projet mature port\u00e9 par une professionnelle exp\u00e9riment\u00e9e. R\u00e9seau producteurs solide, local identifi\u00e9, march\u00e9 en expansion. Recommandation : GO.",
        recommendations: ["Constituer la SARL rapidement", "N\u00e9gocier les contrats producteurs avant ouverture", "Planifier une campagne de communication locale 1 mois avant ouverture"],
      },
    }

    for (const [email, data] of Object.entries(tremplinData)) {
      const user = users[email]
      const journey = beneficiaries[email].journey
      await db.tremplin.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          currentStep: data.step,
          responses: JSON.stringify(data.responses),
          isCompleted: data.completed,
          completedAt: pastDate(2),
          score: data.score,
          decision: data.decision as any,
          summary: data.summary,
          recommendations: JSON.stringify(data.recommendations),
        },
      })
      // Update journey
      await db.creatorJourney.update({
        where: { userId: user.id },
        data: { tremplinStatus: data.completed ? 'GO' as any : 'IN_PROGRESS' as any, tremplinScore: data.score },
      })
      console.log(`   \u2705 Tremplin: ${email.split('@')[0]} \u2192 ${data.decision} (${data.score}/100)`)
    }

    // ────────────────────────────────────────────
    // 6. CREASIM SIMULATIONS
    // ────────────────────────────────────────────
    console.log('\ud83d\udcb0 Creating CreaSim simulations...')

    const creasimData = {
      'sophie.bernard@email.fr': {
        monthlyRevenue: 3750, fixedCharges: [{ name: 'Loyer coworking', amount: 300 }, { name: 'Assurances', amount: 80 }, { name: 'T\u00e9l\u00e9com/Internet', amount: 40 }, { name: 'Logiciels (Adobe, etc.)', amount: 150 }],
        variableChargesRate: 15, avgPrice: 800, unitCost: 100, targetMargin: 60, initialInvestment: 8000,
        fixedTotal: 570, variableAmount: 562.5, totalCharges: 1132.5, grossMargin: 2617.5, grossMarginRate: 69.8,
        netMargin: 1967.5, netMarginRate: 52.5, breakevenMonthly: 1634, breakevenMonths: 2.1,
        prof1Y: 23610, prof2Y: 31080, prof3Y: 39240,
        year1Rev: 45000, year1Exp: 21390, year2Rev: 54000, year2Exp: 22920, year3Rev: 64800, year3Exp: 25560,
        aiAnalysis: "Analyse CreaSim: Le mod\u00e8le \u00e9conomique de Studio Bloom est viable d\u00e8s le 3\u00e8me mois. La marge nette de 52,5% est excellente pour le secteur. Le point mort est bas (1 634\u20ac/mois) gr\u00e2ce \u00e0 des charges fixes minimales. Recommandation : Maintenir les charges fixes au minimum et investir dans le marketing digital pour acc\u00e9l\u00e9rer l'acquisition.",
      },
      'thomas.petit@email.fr': {
        monthlyRevenue: 6900, fixedCharges: [{ name: 'H\u00e9bergement serveurs', amount: 200 }, { name: 'Support part-time', amount: 1500 }, { name: 'Marketing digital', amount: 500 }, { name: 'Outils (Stripe, etc.)', amount: 100 }],
        variableChargesRate: 20, avgPrice: 39, unitCost: 8, targetMargin: 55, initialInvestment: 25000,
        fixedTotal: 2300, variableAmount: 1380, totalCharges: 3680, grossMargin: 3220, grossMarginRate: 46.7,
        netMargin: 920, netMarginRate: 13.3, breakevenMonthly: 5119, breakevenMonths: 4.4,
        prof1Y: 11040, prof2Y: 26400, prof3Y: 48000,
        year1Rev: 82800, year1Exp: 71760, year2Rev: 165600, year2Exp: 139200, year3Rev: 290000, year3Exp: 242000,
        aiAnalysis: "Analyse CreaSim: TaskFlow pr\u00e9sente un profil classique de SaaS avec une premi\u00e8re ann\u00e9e d'investissement. La marge brute de 46,7% est correcte. Le point mort mensuel est de 5 119\u20ac, atteignable avec 175 abonnements. Recommandation : Acc\u00e9l\u00e9rer l'acquisition initiale, r\u00e9duire les charges de support par l'automatisation.",
      },
      'amina.diallo@email.fr': {
        monthlyRevenue: 10000, fixedCharges: [{ name: 'Loyer', amount: 1500 }, { name: 'Personnel mi-temps', amount: 2000 }, { name: '\u00c9lectricit\u00e9', amount: 300 }, { name: 'Assurances', amount: 200 }],
        variableChargesRate: 55, avgPrice: 25, unitCost: 14, targetMargin: 40, initialInvestment: 35000,
        fixedTotal: 4000, variableAmount: 5500, totalCharges: 9500, grossMargin: 4500, grossMarginRate: 45,
        netMargin: 500, netMarginRate: 5, breakevenMonthly: 9091, breakevenMonths: 0.9,
        prof1Y: 6000, prof2Y: 24000, prof3Y: 48000,
        year1Rev: 120000, year1Exp: 114000, year2Rev: 144000, year2Exp: 120000, year3Rev: 168000, year3Exp: 120000,
        aiAnalysis: "Analyse CreaSim: Saveurs d'Ici a un mod\u00e8le avec des marges brutes honorables (45%) mais une marge nette serr\u00e9e (5%) en ann\u00e9e 1. Le point mort est \u00e9lev\u00e9 (9 091\u20ac/mois) en raison des charges fixes et du co\u00fbt des marchandises. Recommandation : D\u00e9velopper les ateliers (marge 70%) pour am\u00e9liorer le mix et n\u00e9gocier de meilleures conditions avec les producteurs.",
      },
    }

    for (const [email, data] of Object.entries(creasimData)) {
      const user = users[email]
      await db.creaSimSimulation.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          monthlyRevenue: data.monthlyRevenue,
          fixedCharges: JSON.stringify(data.fixedCharges),
          variableChargesRate: data.variableChargesRate,
          averageSellingPrice: data.avgPrice,
          unitCost: data.unitCost,
          targetMarginRate: data.targetMargin,
          initialInvestment: data.initialInvestment,
          fixedChargesTotal: data.fixedTotal,
          variableChargesAmount: data.variableAmount,
          totalCharges: data.totalCharges,
          grossMarginAmount: data.grossMargin,
          grossMarginRate: data.grossMarginRate,
          netMarginAmount: data.netMargin,
          netMarginRate: data.netMarginRate,
          monthlyBreakeven: data.breakevenMonthly,
          breakevenMonths: data.breakevenMonths,
          profitability1Y: data.prof1Y,
          profitability2Y: data.prof2Y,
          profitability3Y: data.prof3Y,
          year1Revenue: data.year1Rev,
          year1Expenses: data.year1Exp,
          year2Revenue: data.year2Rev,
          year2Expenses: data.year2Exp,
          year3Revenue: data.year3Rev,
          year3Expenses: data.year3Exp,
          aiAnalysis: data.aiAnalysis,
        },
      })
      console.log(`   \u2705 CreaSim: ${email.split('@')[0]} \u2192 Marge nette ${data.netMarginRate}%`)
    }

    // ────────────────────────────────────────────
    // 7. FINANCIAL FORECASTS
    // ────────────────────────────────────────────
    console.log('\ud83d\udcb3 Creating financial forecasts...')

    const forecastData = {
      'sophie.bernard@email.fr': {
        sector: 'Services cr\u00e9atifs', y1r: 45000, y2r: 54000, y3r: 64800, y1e: 21390, y2e: 22920, y3e: 25560,
        breakeven: 8, investment: 8000,
        synthesis: "Le projet Studio Bloom pr\u00e9sente un profil de rentabilit\u00e9 rapide. Le seuil de rentabilit\u00e9 est atteint au 8\u00e8me mois. La croissance est organique et contr\u00f4l\u00e9e. Pas de besoin de financement externe au d\u00e9marrage.",
      },
      'thomas.petit@email.fr': {
        sector: 'Tech / SaaS', y1r: 82800, y2r: 165600, y3r: 290000, y1e: 71760, y2e: 139200, y3e: 242000,
        breakeven: 14, investment: 25000,
        synthesis: "TaskFlow est un projet SaaS avec un potentiel de scaling important. Le seuil de rentabilit\u00e9 est atteint au 14\u00e8me mois. Un financement d'amor\u00e7age (Bpifrance, Bourse French Tech) est recommand\u00e9 pour acc\u00e9l\u00e9rer la croissance.",
      },
      'amina.diallo@email.fr': {
        sector: 'Commerce / Alimentation', y1r: 120000, y2r: 144000, y3r: 168000, y1e: 114000, y2e: 120000, y3e: 120000,
        breakeven: 10, investment: 35000,
        synthesis: "Saveurs d'Ici est un projet de commerce avec un CA imm\u00e9diat. Le seuil de rentabilit\u00e9 est atteint au 10\u00e8me mois. L'investissement initial est plus important mais les aides r\u00e9gionales et le pr\u00eat d'honneur peuvent couvrir une partie significative.",
      },
    }

    for (const [email, data] of Object.entries(forecastData)) {
      const user = users[email]
      await db.financialForecast.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id, sector: data.sector,
          year1Revenue: data.y1r, year2Revenue: data.y2r, year3Revenue: data.y3r,
          year1Expenses: data.y1e, year2Expenses: data.y2e, year3Expenses: data.y3e,
          breakevenMonth: data.breakeven, initialInvestment: data.investment,
          aiSynthesis: data.synthesis,
        },
      })
      console.log(`   \u2705 Financial: ${email.split('@')[0]} \u2192 Seuil ${data.breakeven} mois`)
    }

    // ────────────────────────────────────────────
    // 8. JURIDIQUE ANALYSES
    // ────────────────────────────────────────────
    console.log('\u2696\ufe0f Creating juridique analyses...')

    const juridiqueData = {
      'sophie.bernard@email.fr': {
        status: 'Micro-entreprise (auto-entrepreneur)', fiscal: 'Imp\u00f4t sur le revenu - BNC',
        structure: "R\u00e9gime micro-BNC avec option versement lib\u00e9ratoire. Pas de TVA en dessous de 36 800\u20ac de CA (premi\u00e8re ann\u00e9e). CFE r\u00e9duite la premi\u00e8re ann\u00e9e.",
        charges: { urssaf: '21.1% du CA', cfe: 'Premi\u00e8re ann\u00e9e exon\u00e9r\u00e9e', formation: '0.1% (CPF)', tva: 'Non applicable < 36 800\u20ac' },
      },
      'thomas.petit@email.fr': {
        status: 'SAS (Soci\u00e9t\u00e9 par Actions Simplifi\u00e9e)', fiscal: 'IS \u00e0 15% jusqu\'\u00e0 42 500\u20ac',
        structure: "SAS avec associ\u00e9 unique. Possibilit\u00e9 de BSPCE pour futurs collaborateurs. IS \u00e0 15% jusqu'\u00e0 42 500\u20ac de b\u00e9n\u00e9fice, 25% au-del\u00e0.",
        charges: { is: '15% puis 25%', cotisations: '~45% du brut', cfe: '~500\u20ac/an', tva: '20% (obligatoire d\u00e8s la cr\u00e9ation)' },
      },
      'amina.diallo@email.fr': {
        status: 'SARL (Soci\u00e9t\u00e9 \u00e0 Responsabilit\u00e9 Limit\u00e9e)', fiscal: 'IS \u00e0 15% jusqu\'\u00e0 42 500\u20ac',
        structure: "SARL pour prot\u00e9ger le patrimoine personnel et faciliter l'association future. Capital social 1 000\u20ac minimum. G\u00e9rance unique.",
        charges: { is: '15% puis 25%', cotisations: '~40% du brut', cfe: '~500\u20ac/an', tva: '20% (obligatoire)' },
      },
    }

    for (const [email, data] of Object.entries(juridiqueData)) {
      const user = users[email]
      await db.juridiqueAnalysis.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id, recommendedStatus: data.status, fiscalRegime: data.fiscal,
          legalStructure: data.structure, socialCharges: JSON.stringify(data.charges),
        },
      })
      console.log(`   \u2705 Juridique: ${email.split('@')[0]} \u2192 ${data.status}`)
    }

    // ────────────────────────────────────────────
    // 9. MARKET ANALYSES
    // ────────────────────────────────────────────
    console.log('\ud83d\udcca Creating market analyses...')

    const marketData = {
      'sophie.bernard@email.fr': {
        sector: 'Design & Communication', marketSize: '1,2 Mds\u20ac en IDF (2024)', target: 'PME et startups < 50 employ\u00e9s',
        trends: ['+15% demande design digital post-Covid', 'Croissance du branding pour DNVB', 'IA compl\u00e9te mais ne remplace pas le design humain'],
        competitors: [{ name: 'Agence Pixel', size: '10-20 pers', positioning: 'Premium', pricing: '1 500-3 000\u20ac/projet' }, { name: 'DesignChezVous', size: '2-5 pers', positioning: 'Budget', pricing: '300-600\u20ac/projet' }, { name: 'Freelances (Malt)', size: 'Ind\u00e9pendants', positioning: 'Variable', pricing: '400-800\u20ac/jour' }],
        opportunities: "Niche des PME qui n'ont pas le budget des grandes agences mais veulent un design professionnel. Positionnement interm\u00e9diaire id\u00e9al.",
        threats: 'Plateformes de design automatis\u00e9 (Canva, Looka), concurrence des freelances sur prix.',
        aiSynthesis: "Le march\u00e9 du design en IDF est en forte croissance (+8%/an). La niche des PME est peu desservie entre les agences premium et les freelances. Positionnement prix/qualit\u00e9 id\u00e9al pour Studio Bloom.",
      },
      'thomas.petit@email.fr': {
        sector: 'SaaS Gestion de Projets', marketSize: '8,5 Mds\u20ac mondial (2024)', target: 'TPE/PME de 2-50 employ\u00e9s',
        trends: ['Transition SaaS acc\u00e9l\u00e9r\u00e9e', 'IA int\u00e9gr\u00e9e dans les outils', 'Demande de simplicit\u00e9 vs complexit\u00e9 des outils existants'],
        competitors: [{ name: 'Asana', size: '1 000+ pers', positioning: 'Milieu de gamme', pricing: '10-30\u20ac/user/mois' }, { name: 'Trello', size: 'Atlassian', positioning: 'Grand public', pricing: '5-18\u20ac/user/mois' }, { name: 'Monday.com', size: '1 000+ pers', positioning: 'Premium', pricing: '8-16\u20ac/user/mois' }],
        opportunities: "Segment sous-desservi des TPE de 2-10 employ\u00e9s qui trouvent Asana/Monday trop complexes et chers.",
        threats: 'Les g\u00e9ants peuvent r\u00e9pondre en cr\u00e9ant des offres simplifi\u00e9es. Microsoft Planner gratuit.',
        aiSynthesis: "Le march\u00e9 du SaaS de gestion de projet est mature mais le segment TPE reste sous-desservi. TaskFlow a un positionnement clair : simplicit\u00e9 + prix abordable. Le risque principal est la r\u00e9ponse des g\u00e9ants du march\u00e9.",
      },
      'amina.diallo@email.fr': {
        sector: '\u00c9picerie Fine / Produits Locaux', marketSize: '6,8 Mds\u20ac France (2024, +4%/an)', target: 'Habitants quartiers gentrifi\u00e9s IDF',
        trends: ['+12% consommation produits locaux', 'Boom des circuits courts', 'Ateliers culinaires en forte demande'],
        competitors: [{ name: '\u00c9picerie du Coin', size: '1-3 pers', positioning: 'Discount local', pricing: 'Entr\u00e9e de gamme' }, { name: 'Bio c\'Bon', size: '5-20 pers', positioning: 'Bio discount', pricing: 'Moyen' }, { name: 'La R\u00e9colte', size: '2-5 pers', positioning: 'Premium local', pricing: 'Premium' }],
        opportunities: "Le concept \u00e9picerie + ateliers est unique dans le quartier. La demande de produits locaux est en forte croissance.",
        threats: 'Inflation pouvant r\u00e9duire le pouvoir d\u2019achat, concurrence des supermarch\u00e9s qui se mettent au local.',
        aiSynthesis: "Le march\u00e9 des produits locaux en IDF est en expansion soutenue. Le concept diff\u00e9renciant (\u00e9picerie + d\u00e9gustation + ateliers) cr\u00e9e un avantage concurrentiel fort. Positionnement prix moyen-haut justifi\u00e9 par la qualit\u00e9 et l'exp\u00e9rience.",
      },
    }

    for (const [email, data] of Object.entries(marketData)) {
      const user = users[email]
      await db.marketAnalysis.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id, sector: data.sector, marketSize: data.marketSize, targetAudience: data.target,
          trends: JSON.stringify(data.trends), competitors: JSON.stringify(data.competitors),
          opportunities: data.opportunities, threats: data.threats, aiSynthesis: data.aiSynthesis,
        },
      })
      console.log(`   \u2705 Market: ${email.split('@')[0]} \u2192 ${data.sector}`)
    }

    // ────────────────────────────────────────────
    // 10. BUSINESS MODEL CANVAS
    // ────────────────────────────────────────────
    console.log('\ud83d\udfe2 Creating Business Model Canvas...')

    const bmcData = {
      'sophie.bernard@email.fr': {
        partenaires: 'Imprimeurs locaux, freelances r\u00e9dacteurs, photographes, Fiverr pour les surcharges',
        activites: 'Design identit\u00e9 visuelle, Cr\u00e9ation branding, Design digital, Gestion de projets client',
        ressources: 'Comp\u00e9tences design, Suite Adobe, Portfolio, R\u00e9seau professionnel, Site web',
        proposition: 'Design professionnel accessible aux PME et startups. D\u00e9lais rapides, accompagnement personnalis\u00e9.',
        relations: 'Accompagnement personnalis\u00e9, Suivi post-livraison, Newsletter design tips',
        canaux: 'LinkedIn, Instagram, Site web, Bouche-\u00e0-oreille, R\u00e9seau professionnel',
        segments: 'Startups en early-stage, PME en rebranding, Ind\u00e9pendants, Associations',
        couts: 'Loyer coworking, Licences Adobe, Assurances, Marketing digital, Charges sociales',
        revenus: 'Prestations design (70%), Abonnements maintenance (20%), Ateliers formation (10%)',
      },
      'thomas.petit@email.fr': {
        partenaires: 'AWS/GCP h\u00e9bergement, Stripe paiement, Intercom support, Blogueurs tech',
        activites: 'D\u00e9veloppement produit, Support client, Marketing acquisition, Veille concurrentielle',
        ressources: 'Code source, Serveurs cloud, Base utilisateurs, \u00c9quipe dev, Marque TaskFlow',
        proposition: 'La gestion de projet enfin simple et abordable pour les TPE. Interface intuitive, prix transparent.',
        relations: 'Self-service + support chat, Communaut\u00e9 utilisateurs, Webinaires, Onboarding guid\u00e9',
        canaux: 'SEO, Content marketing, Product Hunt, LinkedIn, Partenariats B2B',
        segments: 'TPE 2-50 employ\u00e9s, Freelances, Associations, Startups en growth',
        couts: 'H\u00e9bergement cloud, Support, Marketing, D\u00e9veloppement, Charges sociales',
        revenus: 'Abonnements mensuels (80%), Plans annuels (15%), Services premium (5%)',
      },
      'amina.diallo@email.fr': {
        partenaires: '50 producteurs locaux IDF, Fournisseurs packaging \u00e9co, M\u00e9dia locaux, Influenceurs food',
        activites: 'S\u00e9lection produits, Vente au d\u00e9tail, Ateliers culinaires, D\u00e9gustations, Commandes entreprise',
        ressources: 'Local commercial, R\u00e9seau producteurs, Comp\u00e9tences commerce, Mat\u00e9riel d\u00e9gustation',
        proposition: 'Des produits locaux d\u2019\u00cele-de-France, s\u00e9lectionn\u00e9s avec amour. Exp\u00e9rience unique : d\u00e9gustation + ateliers.',
        relations: 'Boutique physique chaleureuse, Newsletter recettes, Programme fid\u00e9lit\u00e9, \u00c9v\u00e9nements',
        canaux: 'Boutique physique, Instagram, Site web click&collect, March\u00e9s locaux, Partenariats entreprises',
        segments: 'Gastronomes du quartier, Familles, Entreprises cadeaux, Touristes curieux',
        couts: 'Loyer commercial, Achats marchandises, Personnel, \u00c9lectricit\u00e9, Marketing local',
        revenus: 'Vente produits (60%), Ateliers (25%), D\u00e9gustations (10%), Commandes entreprise (5%)',
      },
    }

    for (const [email, data] of Object.entries(bmcData)) {
      const user = users[email]
      await db.businessModelCanvas.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          partenairesCles: data.partenaires, activitesCles: data.activites, ressourcesCles: data.ressources,
          propositionValeur: data.proposition, relationsClients: data.relations, canaux: data.canaux,
          segmentsClients: data.segments, structureCouts: data.couts, sourcesRevenus: data.revenus,
          status: 'GENERATED', generatedFromBp: true, generatedAt: pastDate(5),
        },
      })
      console.log(`   \u2705 BMC: ${email.split('@')[0]}`)
    }

    // ────────────────────────────────────────────
    // 11. CREASCOPE SESSIONS
    // ────────────────────────────────────────────
    console.log('\ud83c\udf1f Creating CreaScope sessions...')

    const marieCounselor = Object.values(counselors)[0] as any

    // Sophie: COMPLETED session
    await db.creaScopeSession.upsert({
      where: { id: 'cs-sophie-01' },
      update: {},
      create: {
        id: 'cs-sophie-01',
        counselorId: marieCounselor.id,
        beneficiaryId: beneficiaries['sophie.bernard@email.fr'].beneficiary.id,
        tenantId: tenant.id,
        scheduledAt: pastDate(5),
        startedAt: pastDate(5),
        completedAt: pastDate(5),
        status: 'COMPLETED',
        currentPhase: 'PLAN_ACTION',
        phaseDurations: JSON.stringify({ ACCUEIL: 18, DECOUVERTE: 47, APPROFONDISSEMENT: 65, SYNTHESE: 48, PLAN_ACTION: 27 }),
        kiviatScores: JSON.stringify({ leadership: 8.2, creativite: 9.5, communication: 7.8, organisation: 6.5, gestion_risque: 5.8, adaptabilite: 8.0, motivation: 9.0, stress: 4.2 }),
        tremplinDecision: 'GO',
        bilanAiSynthesis: "Sophie pr\u00e9sente un profil entrepreneurial tr\u00e8s coh\u00e9rent. Ses comp\u00e9tences en design sont un atout majeur. Son profil RIASEC (Artiste-Investigateur) correspond parfaitement au secteur cr\u00e9atif. Forte motivation et r\u00e9seau professionnel d\u00e9j\u00e0 actif.",
        counselorSynthesis: "Entretien tr\u00e8s positif. Sophie montre une maturit\u00e9 entrepreneuriale remarquable. Son exp\u00e9rience de 5 ans en agence lui confiere une l\u00e9gitimit\u00e9 professionnelle. Points d'attention : gestion du stress (4.2/10) et organisation (6.5/10). Plan d'action mis en place pour structurer son activit\u00e9.",
        actionPlan: JSON.stringify([
          { action: "S'inscrire en micro-entreprise avant le 15 du mois", deadline: '2025-02-15', responsible: 'Sophie', status: 'done' },
          { action: 'Cr\u00e9er le portfolio en ligne sur Behance', deadline: '2025-02-20', responsible: 'Sophie', status: 'done' },
          { action: 'Contacter les 5 prospects identifi\u00e9s', deadline: '2025-02-28', responsible: 'Sophie', status: 'in_progress' },
          { action: 'D\u00e9finir la charte graphique de Studio Bloom', deadline: '2025-03-05', responsible: 'Sophie', status: 'pending' },
          { action: 'Pr\u00e9parer le premier devis type', deadline: '2025-03-10', responsible: 'Sophie', status: 'pending' },
        ]),
        phaseNotes: JSON.stringify({
          ACCUEIL: 'Accueil chaleureux. Sophie est enthousiaste et pr\u00eate. Cadre de l\u2019entretien pos\u00e9 clairement.',
          DECOUVERTE: 'Parcours professionnel riche. Motivation profonde et personnelle. Vision claire du projet.',
          APPROFONDISSEMENT: 'Analyse approfondie du march\u00e9 et des comp\u00e9tences. R\u00e9seau actif de 30+ contacts. Projets concrets en t\u00eate.',
          SYNTHESE: 'Profil tr\u00e8s favorable. Score global 78/100. Recommandation unanime : GO.',
          PLAN_ACTION: '5 actions prioritaires d\u00e9finies sur 4 semaines. Prochaine r\u00e9union dans 1 mois.',
        }),
        feedbackScore: 5,
        notes: ['Excellente session', 'Sophie tr\u00e8s motiv\u00e9e', 'Projet r\u00e9aliste et viable'],
      },
    })

    // Thomas: IN_PROGRESS session
    await db.creaScopeSession.upsert({
      where: { id: 'cs-thomas-01' },
      update: {},
      create: {
        id: 'cs-thomas-01',
        counselorId: marieCounselor.id,
        beneficiaryId: beneficiaries['thomas.petit@email.fr'].beneficiary.id,
        tenantId: tenant.id,
        scheduledAt: pastDate(1),
        startedAt: pastDate(1),
        status: 'IN_PROGRESS',
        currentPhase: 'SYNTHESE',
        phaseDurations: JSON.stringify({ ACCUEIL: 22, DECOUVERTE: 52, APPROFONDISSEMENT: 70 }),
        kiviatScores: JSON.stringify({ leadership: 7.0, creativite: 6.5, communication: 6.0, organisation: 9.2, gestion_risque: 7.5, adaptabilite: 7.8, motivation: 8.5, stress: 5.5 }),
        tremplinDecision: 'GO_CONDITIONNEL',
        bilanAiSynthesis: "Thomas a un profil technique tr\u00e8s solide. Son profil RIASEC (Conventionnel-Entrepreneur) est adapt\u00e9 au SaaS. La gestion du stress (5.5/10) est \u00e0 surveiller. Le march\u00e9 est porteur mais la concurrence est forte.",
        counselorSynthesis: null,
        actionPlan: JSON.stringify([]),
        phaseNotes: JSON.stringify({
          ACCUEIL: 'Thomas est venu directement apr\u00e8s son travail. Un peu fatigu\u00e9 mais motiv\u00e9.',
          DECOUVERTE: 'Projet tech bien structur\u00e9. Comp\u00e9tences techniques ind\u00e9niables. N\u00e9cessite plus de clart\u00e9 sur le marketing.',
          APPROFONDISSEMENT: 'Prototype convaincant. 15 entreprises int\u00e9ress\u00e9es. Plan de sortie du CDI \u00e0 pr\u00e9ciser.',
        }),
        feedbackScore: null,
        notes: ['Session en cours', 'Phase synth\u00e8se \u00e0 terminer'],
      },
    })

    // Amina: SCHEDULED session
    await db.creaScopeSession.upsert({
      where: { id: 'cs-amina-01' },
      update: {},
      create: {
        id: 'cs-amina-01',
        counselorId: marieCounselor.id,
        beneficiaryId: beneficiaries['amina.diallo@email.fr'].beneficiary.id,
        tenantId: tenant.id,
        scheduledAt: futureDate(2),
        status: 'SCHEDULED',
        phaseDurations: null,
        kiviatScores: null,
        tremplinDecision: null,
        bilanAiSynthesis: null,
        counselorSynthesis: null,
        actionPlan: null,
        phaseNotes: null,
        feedbackScore: null,
        notes: ['Session planifi\u00e9e'],
      },
    })
    console.log('   \u2705 3 CreaScope sessions created')

    // ────────────────────────────────────────────
    // 12. INTERVIEW SESSIONS WITH NOTES
    // ────────────────────────────────────────────
    console.log('\ud83d\udcdd Creating interview sessions...')

    // Sophie interview
    const interviewSophie = await db.interviewSession.create({
      data: {
        counselorId: marieCounselor.id,
        beneficiaryId: beneficiaries['sophie.bernard@email.fr'].beneficiary.id,
        type: 'bilan_initial',
        phase: 'DISCOVERY',
        scheduledAt: pastDate(10),
        startedAt: pastDate(10),
        completedAt: pastDate(10),
        status: 'completed',
        synthesis: 'Premier bilan tr\u00e8s positif. Sophie a un profil entrepreneurial solide avec des comp\u00e9tences techniques pointues en design. La motivation est forte et le projet est r\u00e9aliste.',
        recommendations: ['Passer les modules Kiviat et Tremplin', 'Commencer le r\u00e9seau LinkedIn', 'Pr\u00e9parer le BP'],
      },
    })

    await db.interviewNote.createMany({
      data: [
        { interviewId: interviewSophie.id, phase: 'accueil', category: 'observation', content: 'Sophie arrive \u00e0 l\u2019heure, v\u00eatue professionnellement, souriante et dynamique.', isKeyPoint: false, isActionItem: false },
        { interviewId: interviewSophie.id, phase: 'parcours', category: 'competence', content: '5 ans d\u2019exp\u00e9rience en agence de design. Ma\u00eetrise compl\u00e8te de la suite Adobe. Portfolio de 25+ projets.', isKeyPoint: true, isActionItem: false },
        { interviewId: interviewSophie.id, phase: 'motivation', category: 'observation', content: 'Motivation intrins\u00e8que forte. D\u00e9sir d\u2019ind\u00e9pendance et de cr\u00e9ativit\u00e9. A r\u00e9fl\u00e9chi au projet pendant 1 an.', isKeyPoint: true, isActionItem: false },
        { interviewId: interviewSophie.id, phase: 'projet', category: 'analyse', content: 'Positionnement clair entre agences premium et freelances budget. 3 prospects d\u00e9j\u00e0 identifi\u00e9s.', isKeyPoint: true, isActionItem: false },
        { interviewId: interviewSophie.id, phase: 'risques', category: 'alerte', content: 'Score de gestion du stress faible (4.2/10). Avoir un plan de gestion de la charge de travail.', isKeyPoint: true, isActionItem: true },
        { interviewId: interviewSophie.id, phase: 'plan_action', category: 'action', content: 'Inscription micro-entreprise, cr\u00e9ation portfolio Behance, contact prospects.', isKeyPoint: false, isActionItem: true },
      ],
    })

    // Thomas interview
    const interviewThomas = await db.interviewSession.create({
      data: {
        counselorId: marieCounselor.id,
        beneficiaryId: beneficiaries['thomas.petit@email.fr'].beneficiary.id,
        type: 'bilan_initial',
        phase: 'PROFILING',
        scheduledAt: pastDate(8),
        startedAt: pastDate(8),
        completedAt: pastDate(8),
        status: 'completed',
        synthesis: "Profil tech fort avec des comp\u00e9tences de d\u00e9veloppement avanc\u00e9es. Le projet SaaS est bien pens\u00e9 mais n\u00e9cessite une validation march\u00e9 plus pouss\u00e9e. Attention \u00e0 la gestion du stress.",
        recommendations: ['Valider le product-market fit avec 20 b\u00eata-testeurs', 'D\u00e9finir une strat\u00e9gie marketing claire', 'Planifier la sortie du CDI'],
      },
    })

    await db.interviewNote.createMany({
      data: [
        { interviewId: interviewThomas.id, phase: 'accueil', category: 'observation', content: 'Thomas est pr\u00e9cis et structur\u00e9. Arrive avec son prototype fonctionnel.', isKeyPoint: false, isActionItem: false },
        { interviewId: interviewThomas.id, phase: 'parcours', category: 'competence', content: 'Master en informatique, 5 ans en dev full-stack. Ma\u00eetrise React, Node.js, PostgreSQL.', isKeyPoint: true, isActionItem: false },
        { interviewId: interviewThomas.id, phase: 'projet', category: 'analyse', content: 'Prototype TaskFlow fonctionnel. 15 entreprises int\u00e9ress\u00e9es. Mod\u00e8le freemium bien pens\u00e9.', isKeyPoint: true, isActionItem: false },
        { interviewId: interviewThomas.id, phase: 'risques', category: 'alerte', content: 'Concurrence forte (Asana, Trello, Monday). N\u00e9cessite un avantage concurrentiel clair.', isKeyPoint: true, isActionItem: true },
        { interviewId: interviewThomas.id, phase: 'plan_action', category: 'action', content: 'Augmenter les b\u00eata-testeurs \u00e0 20, d\u00e9finir le Go-to-Market, s\u00e9curiser 12 mois de tr\u00e9sorerie.', isKeyPoint: false, isActionItem: true },
      ],
    })
    console.log('   \u2705 2 interview sessions with notes created')

    // ────────────────────────────────────────────
    // 13. MOTIVATION ASSESSMENTS
    // ────────────────────────────────────────────
    console.log('\ud83c\udf1f Creating motivation assessments...')

    const motivationData = {
      'sophie.bernard@email.fr': {
        scores: { autonomie: 9.2, reussite: 8.8, creation: 9.5, independance: 9.0, impact: 7.5 },
        summary: 'Profil entrepreneurial fortement intrins\u00e8que. Motivation domin\u00e9e par le besoin de cr\u00e9ation (9.5) et d\u2019autonomie (9.2). Tr\u00e8s bonne ad\u00e9quation avec le projet de design cr\u00e9atif.',
      },
      'thomas.petit@email.fr': {
        scores: { autonomie: 7.5, reussite: 8.5, creation: 7.0, independance: 7.8, impact: 8.2 },
        summary: 'Profil entrepreneur orient\u00e9 r\u00e9ussite et impact. Motivation \u00e9quilibr\u00e9e entre innovation et pragmatisme. Bonne ad\u00e9quation avec le projet tech.',
      },
      'amina.diallo@email.fr': {
        scores: { autonomie: 9.0, reussite: 8.0, creation: 8.5, independance: 8.8, impact: 9.0 },
        summary: 'Profil entrepreneur passionn\u00e9. Forte motivation pour l\u2019impact social et la cr\u00e9ation de valeur locale. Parfaitement align\u00e9 avec le projet d\u2019\u00e9picerie fine.',
      },
    }

    for (const [email, data] of Object.entries(motivationData)) {
      const user = users[email]
      await db.motivationAssessment.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, scores: JSON.stringify(data.scores), summary: data.summary },
      })
    }
    console.log('   \u2705 3 motivation assessments created')

    // ────────────────────────────────────────────
    // 14. MODULE RESULTS (complete set for all 3)
    // ────────────────────────────────────────────
    console.log('\ud83d\udcca Creating complete module results...')

    const allModules = [
      { code: 'DIAG_VISION', name: 'Vision entrepreneuriale', sophieScore: 88, thomasScore: 82, aminaScore: 92 },
      { code: 'DIAG_MOTIVATION', name: 'Motivations', sophieScore: 91, thomasScore: 78, aminaScore: 95 },
      { code: 'DIAG_COMPETENCES', name: 'Comp\u00e9tences cl\u00e9s', sophieScore: 85, thomasScore: 90, aminaScore: 80 },
      { code: 'DIAG_KIVIAT', name: 'Radar Kiviat', sophieScore: 77, thomasScore: 73, aminaScore: 81 },
      { code: 'DIAG_RIASEC', name: 'Profil RIASEC', sophieScore: 86, thomasScore: 80, aminaScore: 88 },
      { code: 'DIAG_BUDGET', name: 'Sensibilit\u00e9 financi\u00e8re', sophieScore: 72, thomasScore: 88, aminaScore: 75 },
      { code: 'TREMPLIN_GO_NOGO', name: 'Tremplin GO/NO GO', sophieScore: 78, thomasScore: 72, aminaScore: 85 },
      { code: 'CREASIM', name: 'Simulateur CreaSim', sophieScore: 82, thomasScore: 76, aminaScore: 70 },
      { code: 'BMC', name: 'Business Model Canvas', sophieScore: 80, thomasScore: 85, aminaScore: 83 },
      { code: 'MARCHE', name: '\u00c9tude de march\u00e9', sophieScore: 75, thomasScore: 82, aminaScore: 88 },
      { code: 'JURIDIQUE', name: 'Analyse juridique', sophieScore: 70, thomasScore: 78, aminaScore: 72 },
      { code: 'FINANCIER', name: 'Pr\u00e9visions financi\u00e8res', sophieScore: 68, thomasScore: 85, aminaScore: 74 },
    ]

    const userMap: Record<string, string> = {
      'sophie.bernard@email.fr': 'sophie',
      'thomas.petit@email.fr': 'thomas',
      'amina.diallo@email.fr': 'amina',
    }

    for (const mod of allModules) {
      const emails = ['sophie.bernard@email.fr', 'thomas.petit@email.fr', 'amina.diallo@email.fr']
      for (const email of emails) {
        const score = email === 'sophie.bernard@email.fr' ? mod.sophieScore : email === 'thomas.petit@email.fr' ? mod.thomasScore : mod.aminaScore
        await db.moduleResult.upsert({
          where: { userId_moduleCode: { userId: users[email].id, moduleCode: mod.code } },
          update: { score, feedback: `Module ${mod.name} compl\u00e9t\u00e9 avec succ\u00e8s.` },
          create: {
            userId: users[email].id, moduleCode: mod.code, score, maxScore: 100,
            answers: JSON.stringify({ completed: true }),
            feedback: `Module ${mod.name} compl\u00e9t\u00e9 avec succ\u00e8s.`,
            completedAt: pastDate(Math.floor(Math.random() * 20) + 1),
          },
        })
      }
    }
    console.log(`   \u2705 ${allModules.length} modules x 3 beneficiaries = ${allModules.length * 3} results created`)

    // ────────────────────────────────────────────
    // 15. LIVRABLES (Reports & Certificates)
    // ────────────────────────────────────────────
    console.log('\ud83d\udcc4 Creating livrables...')

    await db.livrable.createMany({
      data: [
        {
          userId: users['sophie.bernard@email.fr'].id,
          counselorId: marieCounselor.id,
          type: 'REPORT', title: 'Bilan Diagnostic Initial \u2014 Sophie Bernard',
          content: JSON.stringify({ generated: true, type: 'bilan', beneficiaryId: users['sophie.bernard@email.fr'].id }),
          status: 'READY', generatedBy: 'system', generatedAt: pastDate(3),
        },
        {
          userId: users['sophie.bernard@email.fr'].id,
          counselorId: marieCounselor.id,
          type: 'CERTIFICATE', title: 'Attestation Parcours Cr\u00e9ateur \u2014 Module Diagnostic',
          content: JSON.stringify({ generated: true, type: 'certificate', modules: ['DIAG_VISION', 'DIAG_KIVIAT', 'DIAG_RIASEC'] }),
          status: 'READY', generatedBy: 'system', generatedAt: pastDate(1),
        },
        {
          userId: users['thomas.petit@email.fr'].id,
          counselorId: marieCounselor.id,
          type: 'REPORT', title: 'Bilan Diagnostic Initial \u2014 Thomas Petit',
          content: JSON.stringify({ generated: true, type: 'bilan', beneficiaryId: users['thomas.petit@email.fr'].id }),
          status: 'READY', generatedBy: 'system', generatedAt: pastDate(5),
        },
        {
          userId: users['amina.diallo@email.fr'].id,
          counselorId: marieCounselor.id,
          type: 'REPORT', title: 'Bilan Diagnostic Initial \u2014 Amina Diallo',
          content: JSON.stringify({ generated: true, type: 'bilan', beneficiaryId: users['amina.diallo@email.fr'].id }),
          status: 'READY', generatedBy: 'system', generatedAt: pastDate(1),
        },
        {
          userId: users['sophie.bernard@email.fr'].id,
          counselorId: marieCounselor.id,
          type: 'BUSINESS_PLAN', title: 'Business Plan \u2014 Studio Bloom',
          content: JSON.stringify({ generated: true, type: 'bp', status: 'draft' }),
          status: 'DRAFT', generatedBy: 'system', generatedAt: pastDate(1),
        },
        {
          userId: users['thomas.petit@email.fr'].id,
          counselorId: marieCounselor.id,
          type: 'FINANCIAL_FORECAST', title: 'Pr\u00e9visions Financi\u00e8res \u2014 TaskFlow',
          content: JSON.stringify({ generated: true, type: 'financial' }),
          status: 'READY', generatedBy: 'system', generatedAt: pastDate(2),
        },
        {
          userId: users['amina.diallo@email.fr'].id,
          counselorId: marieCounselor.id,
          type: 'FINANCIAL_FORECAST', title: 'Pr\u00e9visions Financi\u00e8res \u2014 Saveurs d\u2019Ici',
          content: JSON.stringify({ generated: true, type: 'financial' }),
          status: 'READY', generatedBy: 'system', generatedAt: pastDate(1),
        },
      ],
    })
    console.log('   \u2705 7 livrables created')

    // ────────────────────────────────────────────
    // 16. PERSONALIZED PATHS
    // ────────────────────────────────────────────
    console.log('\ud83d\udcaf Creating personalized paths...')

    await db.personalizedPath.createMany({
      data: [
        {
          userId: users['sophie.bernard@email.fr'].id,
          title: 'Parcours Design Cr\u00e9atif',
          steps: JSON.stringify([
            { step: 1, title: 'Diagnostic initial', status: 'completed' },
            { step: 2, title: 'Kiviat + RIASEC', status: 'completed' },
            { step: 3, title: 'Tremplin GO/NO GO', status: 'completed' },
            { step: 4, title: 'Business Model Canvas', status: 'completed' },
            { step: 5, title: 'Business Plan', status: 'in_progress' },
            { step: 6, title: 'Pr\u00e9visions financi\u00e8res', status: 'pending' },
            { step: 7, title: 'Strat\u00e9gie de lancement', status: 'pending' },
          ]),
          status: 'active',
        },
        {
          userId: users['thomas.petit@email.fr'].id,
          title: 'Parcours Tech Entrepreneur',
          steps: JSON.stringify([
            { step: 1, title: 'Diagnostic initial', status: 'completed' },
            { step: 2, title: 'Kiviat + RIASEC', status: 'completed' },
            { step: 3, title: 'Tremplin GO/NO GO', status: 'completed' },
            { step: 4, title: 'Business Model Canvas', status: 'completed' },
            { step: 5, title: 'Cr\u00e9asim Simulation', status: 'completed' },
            { step: 6, title: '\u00c9tude de march\u00e9', status: 'completed' },
            { step: 7, title: 'Business Plan', status: 'in_progress' },
            { step: 8, title: 'Pr\u00e9visions financi\u00e8res', status: 'in_progress' },
            { step: 9, title: 'Lev\u00e9e de fonds', status: 'pending' },
          ]),
          status: 'active',
        },
        {
          userId: users['amina.diallo@email.fr'].id,
          title: 'Parcours Commerce',
          steps: JSON.stringify([
            { step: 1, title: 'Diagnostic initial', status: 'completed' },
            { step: 2, title: 'Kiviat + RIASEC', status: 'completed' },
            { step: 3, title: 'Tremplin GO/NO GO', status: 'completed' },
            { step: 4, title: 'Business Model Canvas', status: 'completed' },
            { step: 5, title: 'Juridique', status: 'completed' },
            { step: 6, title: 'Pr\u00e9visions financi\u00e8res', status: 'completed' },
            { step: 7, title: 'Recherche de local', status: 'in_progress' },
            { step: 8, title: 'Dossier financement', status: 'pending' },
            { step: 9, title: 'Lancement', status: 'pending' },
          ]),
          status: 'active',
        },
      ],
    })
    console.log('   \u2705 3 personalized paths created')

    // ────────────────────────────────────────────
    // DONE
    // ────────────────────────────────────────────
    console.log('\n\u2705 Diagnostic seed completed successfully!')
    console.log('\u2500'.repeat(60))
    console.log('  Beneficiaries: 3 (Sophie, Thomas, Amina)')
    console.log('  Kiviat:        8 dimensions x 3 = 24 results')
    console.log('  RIASEC:        6 types x 3 = 18 results')
    console.log('  Tremplin:       3 complete (GO, GO_CONDITIONNEL, GO)')
    console.log('  CreaSim:       3 simulations')
    console.log('  Financial:     3 forecasts')
    console.log('  Juridique:     3 analyses')
    console.log('  Market:        3 analyses')
    console.log('  BMC:           3 canvases')
    console.log('  CreaScope:     3 sessions (1 completed, 1 in_progress, 1 scheduled)')
    console.log('  Interviews:    2 with notes')
    console.log('  Motivations:   3 assessments')
    console.log('  Modules:       12 x 3 = 36 results')
    console.log('  Livrables:     7 documents')
    console.log('  Paths:         3 personalized paths')
    console.log('\u2500'.repeat(60))

  } catch (err) {
    console.error('\u274c Seed failed:', err)
    throw err
  } finally {
    await db.$disconnect()
  }
}

function getBpSections(sector: string): Record<string, any> {
  return {
    resume: { title: 'R\u00e9sum\u00e9 op\u00e9rationnel', completed: true },
    presentation: { title: 'Pr\u00e9sentation du porteur', completed: true },
    projet: { title: 'Description du projet', completed: true },
    marche: { title: '\u00c9tude de march\u00e9', completed: sector === 'Commerce / Alimentation' },
    strategie: { title: 'Strat\u00e9gie commerciale', completed: true },
    equipe: { title: '\u00c9quipe et organisation', completed: false },
    financier: { title: 'Plan financier', completed: sector === 'Tech / SaaS' },
    juridique: { title: 'Structure juridique', completed: true },
    risques: { title: 'Analyse des risques', completed: false },
    previsionnel: { title: 'Pr\u00e9visionnel 3 ans', completed: false },
    annexes: { title: 'Annexes', completed: false },
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
