// ============================================
// CreaPulse V2 — Database Seed Script
// Populates demo data for development
// Run: npx tsx prisma/seed.ts
// ============================================

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding CreaPulse V2 database...\n')

  const now = new Date()
  const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const pastDate = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  // Hash passwords
  const hash = (pw: string) => bcrypt.hashSync(pw, 12)

  try {
    // ────────────────────────────────────────────
    // 1. TENANT
    // ────────────────────────────────────────────
    console.log('📦 Creating tenant...')
    const tenant = await db.tenant.upsert({
      where: { slug: 'gidef-idf' },
      update: {},
      create: {
        name: 'GIDEF Île-de-France',
        slug: 'gidef-idf',
        plan: 'ENTERPRISE',
        primaryColor: '#00838F',
        settings: { language: 'fr', theme: 'light' },
      },
    })
    console.log(`   ✅ Tenant: ${tenant.name} (${tenant.id})`)

    // ────────────────────────────────────────────
    // 2. ORGANIZATION
    // ────────────────────────────────────────────
    console.log('🏢 Creating organization...')
    const organization = await db.organization.create({
      data: {
        tenantId: tenant.id,
        name: 'GIDEF Paris Centre',
        type: 'GIDEF_AGENCY',
        address: '15 Rue de la Paix',
        city: 'Paris',
        postalCode: '75002',
        region: 'Île-de-France',
        phone: '+33 1 42 60 00 00',
        email: 'contact@gidef-paris.fr',
        website: 'https://gidef-paris.fr',
      },
    })
    console.log(`   ✅ Organization: ${organization.name} (${organization.id})`)

    // ────────────────────────────────────────────
    // 3. USERS (5)
    // ────────────────────────────────────────────
    console.log('👤 Creating users...')

    const userData = [
      {
        email: 'admin@gidef.fr',
        passwordHash: hash('Admin123!'),
        firstName: 'Admin',
        lastName: 'GIDEF',
        role: 'ADMIN' as const,
        emailVerified: true,
      },
      {
        email: 'marie.dupont@gidef.fr',
        passwordHash: hash('Conseiller1!'),
        firstName: 'Marie',
        lastName: 'Dupont',
        role: 'COUNSELOR' as const,
        emailVerified: true,
      },
      {
        email: 'jean.martin@gidef.fr',
        passwordHash: hash('Conseiller2!'),
        firstName: 'Jean',
        lastName: 'Martin',
        role: 'COUNSELOR' as const,
        emailVerified: true,
      },
      {
        email: 'sophie.bernard@email.fr',
        passwordHash: hash('Beneficiaire1!'),
        firstName: 'Sophie',
        lastName: 'Bernard',
        role: 'BENEFICIARY' as const,
        emailVerified: true,
      },
      {
        email: 'thomas.petit@email.fr',
        passwordHash: hash('Beneficiaire2!'),
        firstName: 'Thomas',
        lastName: 'Petit',
        role: 'BENEFICIARY' as const,
        emailVerified: true,
      },
    ]

    const users: Record<string, { id: string; email: string }> = {}
    for (const u of userData) {
      const user = await db.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
        update: { firstName: u.firstName, lastName: u.lastName, role: u.role, passwordHash: u.passwordHash },
        create: {
          tenantId: tenant.id,
          email: u.email,
          passwordHash: u.passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          emailVerified: u.emailVerified,
          lastLoginAt: pastDate(Math.floor(Math.random() * 7) + 1),
        },
      })
      users[u.email] = user
      console.log(`   ✅ User: ${u.email} (${user.role})`)
    }

    // ────────────────────────────────────────────
    // 4. COUNSELOR PROFILES (2)
    // ────────────────────────────────────────────
    console.log('🧑‍💼 Creating counselor profiles...')

    const marie = users['marie.dupont@gidef.fr']
    const jean = users['jean.martin@gidef.fr']

    const counselorMarie = await db.counselor.upsert({
      where: { userId: marie.id },
      update: {},
      create: {
        userId: marie.id,
        organizationId: organization.id,
        name: 'Marie Dupont',
        specialities: ['Création d\'entreprise', 'Business Plan', 'Financement'],
        certifications: ['Certification BGE', 'Méthodologie GIDEF Niveau 2'],
        maxBeneficiaries: 25,
        isAvailable: true,
      },
    })

    const counselorJean = await db.counselor.upsert({
      where: { userId: jean.id },
      update: {},
      create: {
        userId: jean.id,
        organizationId: organization.id,
        name: 'Jean Martin',
        specialities: ['Marketing digital', 'Réseaux sociaux', 'E-commerce'],
        certifications: ['Certification BGE', 'Google Digital Active'],
        maxBeneficiaries: 20,
        isAvailable: true,
      },
    })

    console.log(`   ✅ Counselors: ${counselorMarie.name}, ${counselorJean.name}`)

    // ────────────────────────────────────────────
    // 5. BENEFICIARY PROFILES (2)
    // ────────────────────────────────────────────
    console.log('🎯 Creating beneficiary profiles...')

    const sophie = users['sophie.bernard@email.fr']
    const thomas = users['thomas.petit@email.fr']

    const beneficiarySophie = await db.beneficiary.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        organizationId: organization.id,
        employmentStatus: 'UNEMPLOYED',
        educationLevel: 'Bac+3',
        lastDiploma: 'Licence en Communication',
        skills: JSON.stringify([
          { name: 'Design graphique', level: 4 },
          { name: 'Rédaction web', level: 3 },
          { name: 'Photographie', level: 3 },
          { name: 'Community management', level: 2 },
        ]),
        progressScore: 45,
      },
    })

    const beneficiaryThomas = await db.beneficiary.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        organizationId: organization.id,
        employmentStatus: 'EMPLOYED',
        educationLevel: 'Bac+5',
        lastDiploma: 'Master en Informatique',
        skills: JSON.stringify([
          { name: 'Développement web', level: 5 },
          { name: 'Gestion de projet', level: 4 },
          { name: 'Data analyse', level: 3 },
          { name: 'UX Design', level: 2 },
        ]),
        progressScore: 30,
      },
    })

    console.log(`   ✅ Beneficiaries: ${sophie.firstName} ${sophie.lastName}, ${thomas.firstName} ${thomas.lastName}`)

    // ────────────────────────────────────────────
    // 6. COUNSELOR ASSIGNMENTS (4)
    // ────────────────────────────────────────────
    console.log('🔗 Creating counselor assignments...')

    const assignmentPairs = [
      { counselorId: counselorMarie.id, beneficiaryId: beneficiarySophie.id, role: 'PRIMARY' as const, notes: 'Suivi principal - projet de création de studio de design' },
      { counselorId: counselorMarie.id, beneficiaryId: beneficiaryThomas.id, role: 'SECONDARY' as const, notes: 'Avis sur le business plan tech' },
      { counselorId: counselorJean.id, beneficiaryId: beneficiarySophie.id, role: 'SECONDARY' as const, notes: 'Accompagnement marketing digital' },
      { counselorId: counselorJean.id, beneficiaryId: beneficiaryThomas.id, role: 'PRIMARY' as const, notes: 'Suivi principal - projet SaaS' },
    ]

    for (const a of assignmentPairs) {
      await db.counselorAssignment.upsert({
        where: { counselorId_beneficiaryId: { counselorId: a.counselorId, beneficiaryId: a.beneficiaryId } },
        update: { role: a.role, notes: a.notes },
        create: {
          counselorId: a.counselorId,
          beneficiaryId: a.beneficiaryId,
          role: a.role,
          status: 'ACTIVE',
          notes: a.notes,
        },
      })
    }
    console.log('   ✅ 4 counselor assignments created')

    // ────────────────────────────────────────────
    // 7. CREATOR JOURNEYS (2)
    // ────────────────────────────────────────────
    console.log('🚀 Creating creator journeys...')

    const journeySophie = await db.creatorJourney.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        currentPhase: 'STRATEGY',
        progressPercent: 45,
        projectTitle: 'Studio Bloom — Agence de Design Créatif',
        projectDescription: 'Agence spécialisée en identité visuelle, branding et design digital pour startups et PME.',
        projectSector: 'Services créatifs',
        projectStage: 'Idéation validée',
        creationMotivation: 'Passion pour le design et envie d\'entreprendre après 5 ans en salarié',
        targetAudience: 'Startups, PME, indépendants en Île-de-France',
        valueProposition: 'Un design accessible et impactant pour faire décoller votre marque',
        estimatedRevenue: '45 000€ la première année',
        estimatedInvestment: '8 000€',
        bpStatus: 'IN_PROGRESS',
        status: 'ACTIVE',
      },
    })

    const journeyThomas = await db.creatorJourney.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        currentPhase: 'MODELING',
        progressPercent: 30,
        projectTitle: 'TaskFlow — Application SaaS de Gestion de Projets',
        projectDescription: 'Application web simplifiée de gestion de tâches et projets pour les TPE/PME.',
        projectSector: 'Tech / SaaS',
        projectStage: 'Prototype en cours',
        creationMotivation: 'Détecter un manque d\'outils simples et abordables pour les petites structures',
        targetAudience: 'TPE, PME, freelances',
        valueProposition: 'La gestion de projet simplifiée à un prix abordable',
        estimatedRevenue: '80 000€ la première année',
        estimatedInvestment: '25 000€',
        bpStatus: 'NOT_STARTED',
        status: 'ACTIVE',
      },
    })

    console.log(`   ✅ Journeys: ${journeySophie.projectTitle}, ${journeyThomas.projectTitle}`)

    // ────────────────────────────────────────────
    // 8. DISCUSSION CATEGORIES (5)
    // ────────────────────────────────────────────
    console.log('💬 Creating discussion categories...')

    const categoriesData = [
      { name: 'Création', slug: 'creation', description: 'Tout sur la création d\'entreprise', icon: 'Lightbulb', color: '#F59E0B', sortOrder: 1 },
      { name: 'Financement', slug: 'financement', description: 'Subventions, prêts, investisseurs', icon: 'Euro', color: '#10B981', sortOrder: 2 },
      { name: 'Juridique', slug: 'juridique', description: 'Statuts, formalités, réglementation', icon: 'Scale', color: '#6366F1', sortOrder: 3 },
      { name: 'Marketing', slug: 'marketing', description: 'Stratégie, communication, réseaux sociaux', icon: 'Megaphone', color: '#EF4444', sortOrder: 4 },
      { name: 'Réseau', slug: 'reseau', description: 'Incubateurs, événements, réseautage', icon: 'Users', color: '#0EA5E9', sortOrder: 5 },
    ]

    const categories: Record<string, string> = {}
    for (const cat of categoriesData) {
      const created = await db.discussionCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
      categories[cat.slug] = created.id
      console.log(`   ✅ Category: ${cat.name}`)
    }

    // ────────────────────────────────────────────
    // 9. DISCUSSIONS (3) + REPLIES (6)
    // ────────────────────────────────────────────
    console.log('📝 Creating discussions and replies...')

    const discussionsData = [
      {
        authorId: sophie.id,
        categoryId: categories['creation'],
        title: 'Comment choisir le bon statut juridique pour une agence créative ?',
        content: 'Bonjour à tous ! Je suis en train de monter une agence de design et j\'hésite entre micro-entreprise et SASU. Quels sont les avantages et inconvénients de chaque option pour notre secteur d\'activité ? Merci d\'avance pour vos retours !',
        tags: ['statut', 'agence', 'design'],
      },
      {
        authorId: thomas.id,
        categoryId: categories['financement'],
        title: 'Les meilleures aides pour un projet SaaS en Île-de-France',
        content: 'Je développe une application SaaS et je cherche des financements adaptés. J\'ai entendu parler de Bpifrance, de la Bourse French Tech et des aides de la Région. Qui a des retours d\'expérience sur ces dispositifs ?',
        tags: ['SaaS', 'Bpifrance', 'aides', 'IDF'],
      },
      {
        authorId: sophie.id,
        categoryId: categories['marketing'],
        title: 'Comment se lancer sur les réseaux sociaux en tant que freelance ?',
        content: 'Je prépare le lancement de mon activité de freelance en design. Quels réseaux sociaux privilégier ? Instagram, LinkedIn, Behance ? Comment bâtir une stratégie de contenu efficace quand on débute ?',
        tags: ['réseaux sociaux', 'freelance', 'stratégie'],
      },
    ]

    const repliesData: { discussionIndex: number; authorId: string; content: string }[] = [
      {
        discussionIndex: 0,
        authorId: marie.id,
        content: 'Pour une agence créative, la SASU offre une image plus sérieuse auprès des clients B2B, mais la micro-entreprise est plus simple au démarrage. Je recommande de commencer en micro-entreprise et d\'évoluer vers une SAS si le CA le justifie.',
      },
      {
        discussionIndex: 0,
        authorId: jean.id,
        content: 'N\'oubliez pas l\'option EIRL qui permet de protéger votre patrimoine personnel tout en restant simple. C\'est un bon compromis quand on veut tester son activité.',
      },
      {
        discussionIndex: 1,
        authorId: marie.id,
        content: 'La Bourse French Tech est excellente pour les projets innovants. Pour Bpifrance, regardez le prêt d\'amorçage. La Région IDF propose aussi l\'aide "Protéger et Développer votre Innovation". N\'hésitez pas à consulter le GIDEF pour un accompagnement personnalisé !',
      },
      {
        discussionIndex: 1,
        authorId: sophie.id,
        content: 'Merci pour ces pistes ! Est-ce que quelqu\'un connaît les délais de traitement de la Bourse French Tech ? J\'ai postulé il y a 3 semaines.',
      },
      {
        discussionIndex: 2,
        authorId: jean.id,
        content: 'LinkedIn est incontournable pour le B2B. Commencez par LinkedIn + Behance pour votre portfolio. Instagram peut venir ensuite. L\'important est de publier régulièrement du contenu de qualité qui montre votre expertise.',
      },
      {
        discussionIndex: 2,
        authorId: marie.id,
        content: 'Conseil : ne cherchez pas à être partout. Concentrez-vous sur 2 plateformes max, créez du contenu 2-3 fois par semaine, et engagez-vous avec votre communauté. La constance prime sur la quantité.',
      },
    ]

    const discussions = []
    for (const d of discussionsData) {
      const discussion = await db.discussion.create({
        data: {
          ...d,
          viewCount: Math.floor(Math.random() * 150) + 20,
          likesCount: Math.floor(Math.random() * 10),
          createdAt: pastDate(Math.floor(Math.random() * 14) + 1),
        },
      })
      discussions.push(discussion)
      console.log(`   ✅ Discussion: ${d.title.substring(0, 50)}...`)
    }

    for (const r of repliesData) {
      await db.reply.create({
        data: {
          discussionId: discussions[r.discussionIndex].id,
          authorId: r.authorId,
          content: r.content,
          likesCount: Math.floor(Math.random() * 5),
          createdAt: pastDate(Math.floor(Math.random() * 7)),
        },
      })
    }
    console.log('   ✅ 6 replies created')

    // Update discussion reply counts
    for (const d of discussions) {
      const count = await db.reply.count({ where: { discussionId: d.id } })
      await db.discussion.update({ where: { id: d.id }, data: { replyCount: count } })
    }

    // ────────────────────────────────────────────
    // 10. ACTORS — ANNUAIRE (5)
    // ────────────────────────────────────────────
    console.log('🌐 Creating actors (annuaire)...')

    await db.actor.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: 'GIDEF Île-de-France',
          type: 'GIDEF',
          category: 'Accompagnement création',
          city: 'Paris',
          region: 'Île-de-France',
          address: '15 Rue de la Paix, 75002 Paris',
          phone: '+33 1 42 60 00 00',
          email: 'contact@gidef-idf.fr',
          website: 'https://gidef-idf.fr',
          description: 'Réseau d\'accompagnement à la création d\'entreprise en Île-de-France. Bilans, ateliers et suivi personnalisé.',
          services: ['Bilan de créativité', 'Ateliers thématiques', 'Accompagnement individualisé'],
          featured: true,
          successRate: 72.5,
        },
        {
          tenantId: tenant.id,
          name: 'Incubateur Paris Innovation',
          type: 'INCUBATOR',
          category: 'Incubateur',
          city: 'Paris',
          region: 'Île-de-France',
          address: '42 Boulevard de Sébastopol, 75001 Paris',
          phone: '+33 1 53 45 67 89',
          email: 'info@paris-innovation.fr',
          website: 'https://paris-innovation.fr',
          description: 'Incubateur dédié aux projets innovants en Île-de-France. Hébergement, mentorat et mise en réseau.',
          services: ['Hébergement', 'Mentorat', 'Mise en réseau', 'Ateliers'],
          featured: true,
          successRate: 65.0,
        },
        {
          tenantId: tenant.id,
          name: 'CCI Paris Île-de-France',
          type: 'CCI',
          category: 'Institution',
          city: 'Paris',
          region: 'Île-de-France',
          address: '2 Place de la Bourse, 75002 Paris',
          phone: '+33 1 49 52 42 42',
          email: 'accueil@paris.cci.fr',
          website: 'https://paris.cci.fr',
          description: 'La CCI de Paris Île-de-France accompagne les créateurs et entrepreneurs à chaque étape de leur projet.',
          services: ['Formalités de création', 'Formations', 'Réseau', 'Conseil'],
          featured: false,
          successRate: 58.3,
        },
        {
          tenantId: tenant.id,
          name: 'Bpifrance Île-de-France',
          type: 'BANK',
          category: 'Financement',
          city: 'Paris',
          region: 'Île-de-France',
          address: '27-31 Avenue du Général Leclerc, 94710 Maisons-Alfort',
          phone: '+33 1 49 01 49 01',
          email: 'idf@bpifrance.fr',
          website: 'https://bpifrance.fr',
          description: 'Bpifrance finance et accompagne les entreprises de l\'amorçage jusqu\'à la cotation en bourse.',
          services: ['Prêts d\'amorçage', 'Subventions', 'Garanties', 'Investissement'],
          featured: true,
          successRate: 70.0,
        },
        {
          tenantId: tenant.id,
          name: 'Station F',
          type: 'INCUBATOR',
          category: 'Incubateur / Campus',
          city: 'Paris',
          region: 'Île-de-France',
          address: '55 Boulevard Vincent Auriol, 75013 Paris',
          phone: '+33 1 76 77 30 00',
          email: 'hello@stationf.co',
          website: 'https://stationf.co',
          description: 'Le plus grand campus de startups au monde, situé à Paris. Accueille des entrepreneurs du monde entier.',
          services: ['Espaces de travail', 'Programmes d\'accélération', 'Événements', 'Mentorat'],
          featured: true,
          successRate: 68.0,
        },
      ],
    })
    console.log('   ✅ 5 actors created')

    // ────────────────────────────────────────────
    // 11. APPOINTMENTS (3)
    // ────────────────────────────────────────────
    console.log('📅 Creating appointments...')

    await db.appointment.createMany({
      data: [
        {
          counselorId: counselorMarie.id,
          beneficiaryId: beneficiarySophie.id,
          title: 'Bilan de progression — Studio Bloom',
          description: 'Point d\'avancement sur le business plan et la stratégie de lancement.',
          type: 'BILAN',
          mode: 'PHYSICAL',
          scheduledAt: futureDate(3),
          durationMinutes: 90,
          status: 'CONFIRMED',
          location: 'GIDEF Paris Centre — Salle 204',
        },
        {
          counselorId: counselorJean.id,
          beneficiaryId: beneficiaryThomas.id,
          title: 'Suivi marketing digital — TaskFlow',
          description: 'Discussion sur la stratégie d\'acquisition et le lancement en beta.',
          type: 'FOLLOW_UP',
          mode: 'VIDEO',
          scheduledAt: futureDate(7),
          durationMinutes: 60,
          status: 'SCHEDULED',
          videoLink: 'https://meet.jit.si/taskflow-followup',
        },
        {
          counselorId: counselorMarie.id,
          beneficiaryId: beneficiaryThomas.id,
          title: 'Revue du business plan — TaskFlow',
          description: 'Analyse détaillée des projections financières et du modèle économique.',
          type: 'WORKSHOP',
          mode: 'PHYSICAL',
          scheduledAt: futureDate(14),
          durationMinutes: 120,
          status: 'SCHEDULED',
          location: 'GIDEF Paris Centre — Salle Atelier',
        },
      ],
    })
    console.log('   ✅ 3 appointments created')

    // ────────────────────────────────────────────
    // 12. MODULE RESULTS (~9)
    // ────────────────────────────────────────────
    console.log('📊 Creating module results...')

    const moduleCodesSophie = [
      'DIAG_VISION', 'DIAG_MOTIVATION', 'DIAG_COMPETENCES',
      'DIAG_KIVIAT', 'DIAG_RIASEC', 'DIAG_BUDGET',
    ]

    const moduleCodesThomas = [
      'DIAG_VISION', 'DIAG_MOTIVATION', 'DIAG_KIVIAT',
    ]

    for (const code of moduleCodesSophie) {
      await db.moduleResult.upsert({
        where: { userId_moduleCode: { userId: sophie.id, moduleCode: code } },
        update: {},
        create: {
          userId: sophie.id,
          moduleCode: code,
          score: Math.floor(Math.random() * 30) + 70,
          maxScore: 100,
          answers: JSON.stringify({ completed: true }),
          feedback: `Module ${code} terminé avec succès.`,
          completedAt: pastDate(Math.floor(Math.random() * 30) + 1),
        },
      })
    }

    for (const code of moduleCodesThomas) {
      await db.moduleResult.upsert({
        where: { userId_moduleCode: { userId: thomas.id, moduleCode: code } },
        update: {},
        create: {
          userId: thomas.id,
          moduleCode: code,
          score: Math.floor(Math.random() * 25) + 75,
          maxScore: 100,
          answers: JSON.stringify({ completed: true }),
          feedback: `Module ${code} terminé avec succès.`,
          completedAt: pastDate(Math.floor(Math.random() * 30) + 1),
        },
      })
    }
    console.log(`   ✅ ${moduleCodesSophie.length + moduleCodesThomas.length} module results created`)

    // ────────────────────────────────────────────
    // 13. RIASEC RESULTS — Sophie (6)
    // ────────────────────────────────────────────
    console.log('🔬 Creating RIASEC results for Sophie...')

    const riasecTypes = [
      { profileType: 'R', score: 5.2, isDominant: false },
      { profileType: 'I', score: 7.8, isDominant: true },
      { profileType: 'A', score: 9.1, isDominant: true },
      { profileType: 'S', score: 6.5, isDominant: false },
      { profileType: 'E', score: 4.3, isDominant: false },
      { profileType: 'C', score: 3.8, isDominant: false },
    ]

    for (const r of riasecTypes) {
      await db.riasecResult.upsert({
        where: { userId_profileType: { userId: sophie.id, profileType: r.profileType } },
        update: {},
        create: {
          userId: sophie.id,
          ...r,
        },
      })
    }
    console.log('   ✅ 6 RIASEC results created for Sophie (dominant: A, I)')

    // ────────────────────────────────────────────
    // 14. FINANCIAL FORECAST — Thomas (1)
    // ────────────────────────────────────────────
    console.log('💰 Creating financial forecast for Thomas...')

    await db.financialForecast.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        sector: 'Tech / SaaS',
        year1Revenue: 80000,
        year2Revenue: 200000,
        year3Revenue: 450000,
        year1Expenses: 95000,
        year2Expenses: 160000,
        year3Expenses: 300000,
        breakevenMonth: 14,
        initialInvestment: 25000,
        aiSynthesis: 'Le projet TaskFlow présente un potentiel de croissance solide. Le seuil de rentabilité est atteint au 14ème mois grâce à un modèle d\'abonnement récurrent. Les marges s\'améliorent significativement en année 2 grâce aux économies d\'échelle.',
      },
    })
    console.log('   ✅ Financial forecast created for Thomas')

    // ────────────────────────────────────────────
    // 15. NOTIFICATIONS — Sophie (10)
    // ────────────────────────────────────────────
    console.log('🔔 Creating notifications for Sophie...')

    const notificationsData = [
      { title: 'Bienvenue sur CreaPulse !', content: 'Votre parcours de création commence. Explorez les modules diagnostics pour démarrer.', type: 'INFO' as const, isRead: true },
      { title: 'Module terminé : Vision entrepreneuriale', content: 'Félicitations ! Vous avez complété le module DIAG_VISION.', type: 'SUCCESS' as const, isRead: true },
      { title: 'Rendez-vous confirmé', content: 'Votre bilan de progression avec Marie Dupont est confirmé pour dans 3 jours.', type: 'ACTION_REQUIRED' as const, isRead: false },
      { title: 'Nouvelle réponse sur le forum', content: 'Jean Martin a répondu à votre discussion sur les statuts juridiques.', type: 'INFO' as const, isRead: false },
      { title: 'Jalon atteint : Phase Stratégie', content: 'Bravo ! Vous êtes entrée dans la phase Stratégie de votre parcours créateur.', type: 'MILESTONE' as const, isRead: true },
      { title: 'Rappel : Mettre à jour votre business plan', content: 'Votre business plan est en cours. N\'oubliez pas de compléter la section financière.', type: 'WARNING' as const, isRead: false },
      { title: 'Module terminé : Motivations', content: 'Vous avez complété le module DIAG_MOTIVATION. Découvrez vos résultats.', type: 'SUCCESS' as const, isRead: true },
      { title: 'Nouveau mentor disponible', content: 'Un mentor expert en design est disponible dans votre région. Consultez son profil.', type: 'INFO' as const, isRead: false },
      { title: 'Atelier : Réseautage créateurs', content: 'Inscrivez-vous à l\'atelier de réseautage ce samedi à la CCI Paris.', type: 'ACTION_REQUIRED' as const, isRead: false },
      { title: 'Conseil personnalisé', content: 'Marie Dupont vous a partagé une ressource sur le branding. Consultez-la dans vos messages.', type: 'INFO' as const, isRead: false },
    ]

    for (const n of notificationsData) {
      await db.notification.create({
        data: {
          userId: sophie.id,
          title: n.title,
          content: n.content,
          type: n.type,
          isRead: n.isRead,
          createdAt: pastDate(Math.floor(Math.random() * 20) + 1),
        },
      })
    }
    console.log('   ✅ 10 notifications created for Sophie')

    // ────────────────────────────────────────────
    // 16. SWIPE CARDS (60)
    // ────────────────────────────────────────────
    console.log('🃏 Seeding 60 SwipeCards (Pépites)...')

    const { SWIPE_CARDS } = await import('../src/data/swipe-cards')

    await db.swipeCard.deleteMany({})
    await db.swipeCard.createMany({
      data: SWIPE_CARDS.map(card => ({
        code: card.code,
        title: card.title,
        description: card.description,
        icon: card.icon,
        category: card.category,
        difficulty: card.difficulty,
        weight: card.weight,
        sortOrder: card.sortOrder,
      })),
    })
    console.log(`   ✅ ${SWIPE_CARDS.length} SwipeCards seeded`)

    // ────────────────────────────────────────────
    // 17. SWIPE QUESTIONS (300)
    // ────────────────────────────────────────────
    console.log('❓ Seeding 300 SwipeQuestions (Pépites)...')

    const { SWIPE_QUESTIONS } = await import('../src/data/swipe-questions')

    await db.swipeQuestion.deleteMany({})
    await db.swipeQuestion.createMany({
      data: SWIPE_QUESTIONS.map(q => ({
        code: q.code,
        question: q.question,
        category: q.category,
        subcategory: q.subcategory,
        type: q.type,
        options: q.options ? JSON.stringify(q.options) : null,
        helpText: q.helpText,
        scoring: q.scoring ? JSON.stringify(q.scoring) : null,
        difficulty: q.difficulty,
        sortOrder: q.sortOrder,
      })),
    })
    console.log(`   ✅ ${SWIPE_QUESTIONS.length} SwipeQuestions seeded`)

    // ────────────────────────────────────────────
    // DONE
    // ────────────────────────────────────────────
    console.log('\n✅ Seed completed successfully!')
    console.log('─'.repeat(50))
    console.log('  Tenant:         GIDEF Île-de-France')
    console.log('  Organization:   GIDEF Paris Centre')
    console.log('  Users:          5 (1 admin, 2 counselors, 2 beneficiaries)')
    console.log('  Categories:     5')
    console.log('  Discussions:    3 (+ 6 replies)')
    console.log('  Actors:         5')
    console.log('  Appointments:   3')
    console.log('  ModuleResults:  9')
    console.log('  RIASEC:         6 (Sophie)')
    console.log('  Forecast:       1 (Thomas)')
    console.log('  Notifications:  10 (Sophie)')
    console.log('  SwipeCards:     60 (Pépites)')
    console.log('  SwipeQuestions: 300 (Pépites Quiz)')
    console.log('─'.repeat(50))
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    throw err
  } finally {
    await db.$disconnect()
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
