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
    // 18. KIVIAT RESULTS — Sophie (8) & Thomas (8)
    // ────────────────────────────────────────────
    console.log('📊 Creating Kiviat results...')

    const kiviatDimensions = [
      'Leadership', 'Créativité', 'Communication', 'Gestion stress',
      'Résolution problèmes', 'Adaptabilité', 'Autonomie', 'Persévérance'
    ]

    // Sophie: strong creative profile
    const kiviatSophie = [6.5, 9.2, 7.8, 5.5, 7.0, 8.5, 6.0, 7.5]
    // Thomas: strong tech/logic profile
    const kiviatThomas = [7.0, 6.8, 5.5, 6.0, 9.0, 7.5, 8.8, 8.0]

    for (let i = 0; i < kiviatDimensions.length; i++) {
      await db.kiviatResult.upsert({
        where: { userId_category: { userId: sophie.id, category: kiviatDimensions[i] } },
        update: { score: kiviatSophie[i] },
        create: { userId: sophie.id, category: kiviatDimensions[i], score: kiviatSophie[i], maxScore: 10 },
      })
      await db.kiviatResult.upsert({
        where: { userId_category: { userId: thomas.id, category: kiviatDimensions[i] } },
        update: { score: kiviatThomas[i] },
        create: { userId: thomas.id, category: kiviatDimensions[i], score: kiviatThomas[i], maxScore: 10 },
      })
    }
    console.log('   ✅ 16 Kiviat results created (8 per beneficiary)')

    // ────────────────────────────────────────────
    // 19. TREMPLIN — Sophie (completed, GO) & Thomas (in progress)
    // ────────────────────────────────────────────
    console.log('🎯 Creating Tremplin data...')

    await db.tremplin.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        currentStep: 6,
        isCompleted: true,
        completedAt: pastDate(5),
        score: 82,
        decision: 'GO',
        summary: 'Sophie présente un profil entrepreneur cohérent avec une forte motivation et des compétences créatives bien développées. Son projet de studio de design est viable et bien structuré. La dimension financière nécessite un accompagnement spécifique.',
        responses: JSON.stringify({
          etape1_motivation: { score: 9, note: 'Motivation très forte, liée à une passion authentique pour le design' },
          etape2_competences: { score: 8, note: 'Compétences techniques solides en design graphique et identité visuelle' },
          etape3_marche: { score: 7, note: 'Bonne connaissance du marché, besoin d\'approfondir la segmentation' },
          etape4_financier: { score: 6, note: 'Plan financier réaliste mais prudent. Besoin de sécuriser la trésorerie de démarrage.' },
          etape5_juridique: { score: 8, note: 'Choix du statut juridique pertinent (micro-entreprise au démarrage)' },
          etape6_reseau: { score: 8, note: 'Réseau professionnel établi, contacts pertinents dans le secteur créatif' },
        }),
        recommendations: [
          'Valider la clientèle cible avec 3 à 5 entrevues clients',
          'Préparer un plan de trésorerie à 12 mois détaillé',
          'Établir des partenariats avec des agences complémentaires',
          'Finaliser le portfolio digital avant le lancement',
          'Programmer les premières actions marketing (LinkedIn + Behance)',
        ],
      },
    })

    await db.tremplin.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        currentStep: 3,
        isCompleted: false,
        score: 68,
        summary: 'Thomas dispose d\'un profil technique solide et d\'une vision claire pour TaskFlow. L\'analyse de marché et la validation client sont en cours. La dimension juridique et le plan de financement restent à structurer.',
        responses: JSON.stringify({
          etape1_motivation: { score: 8, note: 'Motivation solide, tirée d\'un besoin identifié sur le terrain' },
          etape2_competences: { score: 9, note: 'Compétences techniques exceptionnelles en développement et gestion de projet' },
          etape3_marche: { score: 6, note: 'Analyse en cours, concurrence identifiée mais pricing à valider' },
        }),
        recommendations: [
          'Compléter l\'étude de marché avec des entrevues utilisateurs',
          'Définir le pricing (freemium vs. abonnement)',
          'Structurer le plan de financement (Bpifiance, love money)',
        ],
      },
    })
    console.log('   ✅ 2 Tremplin records (Sophie: GO/82%, Thomas: en cours/68%)')

    // ────────────────────────────────────────────
    // 20. CREASIM SIMULATIONS — Sophie & Thomas
    // ────────────────────────────────────────────
    console.log('🔄 Creating CreaSim simulations...')

    await db.creaSimSimulation.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        monthlyRevenue: 3750,
        fixedCharges: JSON.stringify([
          { name: 'Location bureau (coworking)', amount: 350 },
          { name: 'Abonnement Adobe CC', amount: 55 },
          { name: 'Assurance pro', amount: 45 },
          { name: 'Internet/télécom', amount: 35 },
          { name: 'Comptabilité', amount: 120 },
        ]),
        variableChargesRate: 15,
        averageSellingPrice: 1500,
        unitCost: 225,
        targetMarginRate: 65,
        initialInvestment: 8000,
        fixedChargesTotal: 605,
        variableChargesAmount: 562.5,
        totalCharges: 1167.5,
        grossMarginAmount: 2582.5,
        grossMarginRate: 68.87,
        netMarginAmount: 1977.5,
        netMarginRate: 52.73,
        monthlyBreakeven: 1817,
        breakevenMonths: 1,
        profitability1Y: 23730,
        profitability2Y: 31476,
        profitability3Y: 39222,
        year1Revenue: 45000,
        year1Expenses: 21270,
        year2Revenue: 58500,
        year2Expenses: 27024,
        year3Revenue: 76050,
        year3Expenses: 36828,
        aiAnalysis: 'Le modèle économique de Studio Bloom est viable dès le 2ème mois d\'activité. La marge brute de 69% est excellente pour le secteur des services créatifs. Le point mort mensuel est faible (1 817€), ce qui limite le risque financier. Recommandation : prévoir une réserve de 3 mois de charges fixes au démarrage.',
      },
    })

    await db.creaSimSimulation.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        monthlyRevenue: 6667,
        fixedCharges: JSON.stringify([
          { name: 'Hébergement serveurs (AWS)', amount: 450 },
          { name: 'Salaires (2 devs)', amount: 5000 },
          { name: 'Bureaux', amount: 600 },
          { name: 'Assurance pro', amount: 120 },
          { name: 'Outils SaaS (Jira, Figma, etc.)', amount: 350 },
          { name: 'Comptabilité/Juridique', amount: 280 },
        ]),
        variableChargesRate: 20,
        averageSellingPrice: 29,
        unitCost: 5.8,
        targetMarginRate: 70,
        initialInvestment: 25000,
        fixedChargesTotal: 6800,
        variableChargesAmount: 1333,
        totalCharges: 8133,
        grossMarginAmount: 5334,
        grossMarginRate: 80,
        netMarginAmount: -1466,
        netMarginRate: -22,
        monthlyBreakeven: 22667,
        breakevenMonths: 8,
        profitability1Y: -17600,
        profitability2Y: 48000,
        profitability3Y: 120000,
        year1Revenue: 80000,
        year1Expenses: 97600,
        year2Revenue: 200000,
        year2Expenses: 152000,
        year3Revenue: 450000,
        year3Expenses: 330000,
        aiAnalysis: 'TaskFlow présente un profil typique de startup SaaS : déficit la première année (-17 600€) suivi d\'une forte croissance en année 2. Le seuil de rentabilité est atteint au 8ème mois avec un CA mensuel de 22 667€ (environ 780 abonnés). La structure de coûts est bien calibrée pour un modèle d\'abonnement récurrent. Attention au cash-flow critique les 7 premiers mois.',
      },
    })
    console.log('   ✅ 2 CreaSim simulations created')

    // ────────────────────────────────────────────
    // 21. BMC — Sophie & Thomas
    // ────────────────────────────────────────────
    console.log('📐 Creating Business Model Canvas...')

    await db.businessModelCanvas.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        partenairesCles: 'Imprimeurs locaux, photographes freelances, développeurs web, agences de communication partenaires',
        activitesCles: 'Création d\'identité visuelle, design de supports print/digital, consultations branding, workshops créatifs',
        ressourcesCles: 'Compétences en design (Illustrator, Photoshop, Figma), réseau professionnel, portfolio en ligne, matériel pro',
        propositionValeur: 'Un design créatif accessible et impactant qui transforme l\'image de marque des startups et PME',
        relationsClients: 'Relation de confiance et proximité, suivi personnalisé, ateliers collaboratifs, communauté en ligne',
        canaux: 'LinkedIn professionnel, Behance portfolio, bouche-à-oreille, partenariats agences, networking GIDEF',
        segmentsClients: 'Startups en phase de lancement (B2B), PME en rebranding, indépendants/artisans, associations',
        structureCouts: 'Charges fixes : coworking + Adobe (605€/mois), charges variables : 15% du CA (sous-traitance, fournitures)',
        sourcesRevenus: 'Prestations de design (80% du CA), workshops et formations (15%), consultation horaire (5%)',
        status: 'DRAFT',
      },
    })

    await db.businessModelCanvas.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        partenairesCles: 'AWS/Cloud providers, communities tech (Dev.to, HN), Bpifrance, incubateurs, beta-testeurs TPE',
        activitesCles: 'Développement produit SaaS, support client, marketing digital, gestion communautaire, analyse données utilisateurs',
        ressourcesCles: 'Équipe dev full-stack, infrastructure cloud, base de code, marque TaskFlow, données utilisateurs anonymisées',
        propositionValeur: 'La gestion de projet simplifiée pour les TPE/PME à un prix abordable (29€/mois), sans complexité',
        relationsClients: 'Self-service avec onboarding guidé, support chat/email, webinaires mensuels, base de connaissance',
        canaux: 'Site web + SEO, Product Hunt, LinkedIn, partenariats incubateurs, programme d\'affiliation',
        segmentsClients: 'TPE de 5-50 employés, freelances multi-projets, PME sans outil dédié, secteurs : tech, consulting, créatif',
        structureCouts: 'Coûts fixes : hébergement + salaires (6 800€/mois), variables : marketing (20% du CA)',
        sourcesRevenus: 'Abonnements mensuels (SaaS) - 3 plans : Starter 29€, Pro 49€, Team 99€/utilisateur/mois',
        status: 'DRAFT',
      },
    })
    console.log('   ✅ 2 BMC records created')

    // ────────────────────────────────────────────
    // 22. JURIDIQUE ANALYSIS — Sophie & Thomas
    // ────────────────────────────────────────────
    console.log('⚖️ Creating Juridique analyses...')

    await db.juridiqueAnalysis.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        recommendedStatus: 'micro-entreprise',
        fiscalRegime: 'Micro-BIC (prestations de services)',
        legalStructure: 'Micro-entrepreneur',
        socialCharges: JSON.stringify({
          tauxSocial: 21.1,
          plafondCA: 77700,
          abattement: 50,
          cotisations: ['CFE (cotisation foncière)', 'Formation professionnelle'],
          avantageACRE: 'Exonération partielle des charges sociales pendant 1 an (taux réduit à 11.3%)',
        }),
      },
    })

    await db.juridiqueAnalysis.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        recommendedStatus: 'sasu',
        fiscalRegime: 'IS (Impôt sur les sociétés)',
        legalStructure: 'SASU',
        socialCharges: JSON.stringify({
          tauxSocial: 45,
          plafondCA: 'Pas de plafond',
          abattement: 0,
          cotisations: ['Assurance chômage', 'Retraite complémentaire', 'Prévoyance', 'AGIRC-ARRCO'],
          avantageACRE: 'Exonération partielle des charges sociales pendant 1 an',
          rj: 'Rémunération du dirigeant déductible du résultat imposable',
        }),
      },
    })
    console.log('   ✅ 2 Juridique analyses created')

    // ────────────────────────────────────────────
    // 23. MARKET ANALYSIS — Sophie & Thomas
    // ────────────────────────────────────────────
    console.log('📈 Creating Market analyses...')

    await db.marketAnalysis.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        sector: 'Services créatifs / Design',
        marketSize: '2,3 Mrd€ (marché du design en France)',
        targetAudience: 'Startups et PME en IDF (~350 000 entreprises)',
        trends: JSON.stringify([
          'Croissance de 8% par an du marché du design digital',
          'Demande croissante en identité visuelle post-COVID',
          'Transition vers les outils de design collaboratifs (Figma)',
          'Importance croissante du personal branding pour les dirigeants',
        ]),
        competitors: JSON.stringify([
          { name: 'Agences traditionnelles', force: 'Expérience et réseau', faiblesse: 'Tarifs élevés, lenteur' },
          { name: 'Freelances sur Malt/ComeUp', force: 'Prix compétitifs', faiblesse: 'Fiabilité variable, manque de structure' },
          { name: 'Plateformes (Canva, Looka)', force: 'Rapidité et accessibilité', faiblesse: 'Standardisation, pas de sur-mesure' },
        ]),
        opportunities: 'Créneau des startups en phase de lancement qui cherchent un partenaire design flexible et abordable. Peu d\'offres entre les freelances isolés et les grandes agences.',
        threats: 'Risque de concurrence accrue des freelances sur les plateformes. Évolution rapide des outils d\'IA générative (Midjourney, DALL-E) qui pourraient réduire la demande en design sur-mesure.',
        aiSynthesis: 'Le marché du design en France est dynamique avec une croissance soutenue. Sophie peut se positionner avantageusement sur un créneau peu servi : le design accessible pour startups, entre l\'offre freelance et les grandes agences. La menace IA est réelle mais concerne surtout le design générique — le sur-mesure et l\'accompagnement stratégique restent des valeurs différenciantes.',
      },
    })

    await db.marketAnalysis.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        sector: 'Tech / SaaS / Gestion de projets',
        marketSize: '8,5 Mrd€ (marché mondial PM tools, 2,1 Mrd€ en Europe)',
        targetAudience: 'TPE/PME de 5-50 employés en France (~3,5 M entreprises)',
        trends: JSON.stringify([
          'Migration vers le SaaS (+15% par an en PME française)',
          'Demande d\'outils simplifiés face à la complexité de Jira/Asana',
          'Intégration IA dans les outils de productivité',
          'Croissance du travail hybride et du besoin de visibilité collaborative',
        ]),
        competitors: JSON.stringify([
          { name: 'Trello', force: 'Simplicité, notoriété, base gratuite', faiblesse: 'Fonctionnalités limitées, peu adapté aux PME structurées' },
          { name: 'Asana', force: 'Complet, adapté aux équipes', faiblesse: 'Complexe pour les petites structures, pricing élevé' },
          { name: 'Notion', force: 'Polyvalent, forte communauté', faiblesse: 'Trop généraliste, courbe d\'apprentissage' },
          { name: 'Monday.com', force: 'Interface visuelle, automatisations', faiblesse: 'Pricing élevé pour les TPE' },
        ]),
        opportunities: 'Créneau des TPE qui trouvent Trello trop simple et Asana/Monday trop complexes et chers. Positionnement "simplicité puissance" avec pricing accessible.',
        threats: 'Concurrence intense sur le segment PM tools. Les géants (Microsoft, Google) peuvent intégrer des fonctionnalités similaires. Difficulté à acquérir les premiers utilisateurs sans budget marketing important.',
        aiSynthesis: 'Le marché des PM tools est très concurrentiel mais le créneau des TPE (5-50 employés) est sous-servi. TaskFlow a un positionnement clair entre Trello et Asana, avec un pricing adapté. La clé du succès sera l\'onboarding rapide et la simplicité d\'usage dès le premier contact.',
      },
    })
    console.log('   ✅ 2 Market analyses created')

    // ────────────────────────────────────────────
    // 24. FINANCIAL FORECAST — Sophie
    // ────────────────────────────────────────────
    console.log('💰 Creating financial forecast for Sophie...')

    await db.financialForecast.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        sector: 'Services créatifs',
        year1Revenue: 45000,
        year2Revenue: 58500,
        year3Revenue: 76050,
        year1Expenses: 21270,
        year2Expenses: 27024,
        year3Expenses: 36828,
        breakevenMonth: 2,
        initialInvestment: 8000,
        aiSynthesis: 'Le projet Studio Bloom présente un profil financier très rassurant. Le seuil de rentabilité est atteint dès le 2ème mois grâce à des charges fixes limitées (coworking + abonnements). La marge nette de 53% la première année est excellente. Recommandation : constituer une épargne de précaution de 2 000€ avant le démarrage.',
      },
    })
    console.log('   ✅ Financial forecast created for Sophie')

    // ────────────────────────────────────────────
    // 25. MOTIVATION ASSESSMENT — Sophie & Thomas
    // ────────────────────────────────────────────
    console.log('💡 Creating motivation assessments...')

    await db.motivationAssessment.upsert({
      where: { userId: sophie.id },
      update: {},
      create: {
        userId: sophie.id,
        scores: JSON.stringify({
          autonomie: 9,
          accomplishment: 8,
          influence: 6,
          securite: 4,
          creativite: 10,
          impact_social: 7,
        }),
        summary: 'Profil entrepreneur à dominante créative. Sophie est fortement motivée par l\'autonomie et l\'accomplissement personnel. La dimension créative est son moteur principal (10/10). La sécurité financière n\'est pas un facteur décisionnel, ce qui est cohérent avec un projet de création artistique.',
      },
    })

    await db.motivationAssessment.upsert({
      where: { userId: thomas.id },
      update: {},
      create: {
        userId: thomas.id,
        scores: JSON.stringify({
          autonomie: 7,
          accomplishment: 9,
          influence: 8,
          securite: 5,
          creativite: 6,
          impact_social: 7,
        }),
        summary: 'Profil entrepreneur orienté accomplissement et influence. Thomas cherche à construire quelque chose de significatif à l\'échelle (influence 8/10). La résolution de problèmes concrets est son moteur principal. Profil cohérent avec un projet SaaS B2B.',
      },
    })
    console.log('   ✅ 2 Motivation assessments created')

    // ────────────────────────────────────────────
    // 26. RIASEC — Thomas (6)
    // ────────────────────────────────────────────
    console.log('🔬 Creating RIASEC results for Thomas...')

    const riasecThomas = [
      { profileType: 'R', score: 8.5, isDominant: true },
      { profileType: 'I', score: 9.0, isDominant: true },
      { profileType: 'A', score: 4.2, isDominant: false },
      { profileType: 'S', score: 5.0, isDominant: false },
      { profileType: 'E', score: 7.5, isDominant: true },
      { profileType: 'C', score: 6.8, isDominant: false },
    ]

    for (const r of riasecThomas) {
      await db.riasecResult.upsert({
        where: { userId_profileType: { userId: thomas.id, profileType: r.profileType } },
        update: {},
        create: {
          userId: thomas.id,
          ...r,
        },
      })
    }
    console.log('   ✅ 6 RIASEC results created for Thomas (dominant: I, R, E)')

    // ────────────────────────────────────────────
    // 27. INTERVIEW SESSIONS + NOTES (CréaScope)
    // ────────────────────────────────────────────
    console.log('📋 Creating interview sessions (CréaScope)...')

    // Interview 1: Sophie — Bilan initial avec Marie
    const interview1 = await db.interviewSession.create({
      data: {
        counselorId: counselorMarie.id,
        beneficiaryId: beneficiarySophie.id,
        type: 'bilan-initial',
        phase: 'ACCUEIL',
        scheduledAt: pastDate(45),
        startedAt: pastDate(45),
        completedAt: pastDate(45),
        status: 'completed',
        synthesis: 'Premier contact avec Sophie. Profil créatif affirmé, 5 ans d\'expérience en agence. Motivation forte pour le design indépendant. Projet de studio de design bien formulé. Points de vigilance : gestion administrative, prospection commerciale.',
        recommendations: [
          'Compléter les diagnostics Kiviat et RIASEC',
          'Élaborer une étude de marché ciblée',
          'Préparer un plan financier à 3 ans',
        ],
      },
    })

    await db.interviewNote.createMany({
      data: [
        { interviewId: interview1.id, phase: 'ACCUEIL', category: 'observation', content: 'Sophie arrive motivée et préparée. Elle a un carnet de croquis avec ses premières idées de branding.', isKeyPoint: true, isActionItem: false },
        { interviewId: interview1.id, phase: 'ACCUEIL', category: 'competence', content: 'Maîtrise d\'Illustrator, Photoshop et Figma. Bonne culture du design.', isKeyPoint: true, isActionItem: false },
        { interviewId: interview1.id, phase: 'ACCUEIL', category: 'observation', content: 'Aucune expérience en gestion d\'entreprise ou comptabilité. Formation nécessaire.', isKeyPoint: false, isActionItem: true },
        { interviewId: interview1.id, phase: 'ACCUEIL', category: 'objectif', content: 'Objectif : lancer le studio dans 3 mois. Budget de démarrage : 8 000€ (équipement + réserve).', isKeyPoint: true, isActionItem: false },
      ],
    })

    // Interview 2: Sophie — Suivi approfondissement avec Jean
    const interview2 = await db.interviewSession.create({
      data: {
        counselorId: counselorJean.id,
        beneficiaryId: beneficiarySophie.id,
        type: 'suivi-marketing',
        phase: 'APPROFONDISSEMENT',
        scheduledAt: pastDate(20),
        startedAt: pastDate(20),
        completedAt: pastDate(20),
        status: 'completed',
        synthesis: 'Deuxième entretien focalisé sur la stratégie marketing. Sophie a bien défini ses cibles (startups en phase de lancement). Le positionnement prix est pertinent (entre les freelances et les agences). Besoin d\'affiner la stratégie de contenu digital.',
        recommendations: [
          'Créer un portfolio Behance avec 5 projets fictifs de qualité',
          'Publier 3 articles LinkedIn par semaine sur le branding',
          'Contacter 10 startups récemment financées (via Dealroom)',
        ],
      },
    })

    await db.interviewNote.createMany({
      data: [
        { interviewId: interview2.id, phase: 'APPROFONDISSEMENT', category: 'strategie', content: 'Positionnement prix : 1 500€ pour une identité visuelle complète (pack logo + charte graphique). Concurrents : 800€ (freelance junior) à 5 000€+ (agence).', isKeyPoint: true, isActionItem: false },
        { interviewId: interview2.id, phase: 'APPROFONDISSEMENT', category: 'action', content: 'Plan d\'action digital validé : LinkedIn + Behance. Calendrier éditorial sur 3 mois.', isKeyPoint: false, isActionItem: true },
        { interviewId: interview2.id, phase: 'APPROFONDISSEMENT', category: 'observation', content: 'Sophie montre une bonne compréhension du marketing B2B malgré son profil créatif.', isKeyPoint: true, isActionItem: false },
      ],
    })

    // Interview 3: Thomas — Bilan initial avec Jean
    const interview3 = await db.interviewSession.create({
      data: {
        counselorId: counselorJean.id,
        beneficiaryId: beneficiaryThomas.id,
        type: 'bilan-initial',
        phase: 'ACCUEIL',
        scheduledAt: pastDate(30),
        startedAt: pastDate(30),
        completedAt: pastDate(30),
        status: 'completed',
        synthesis: 'Thomas est développeur senior avec 8 ans d\'expérience. Il a identifié un problème concret dans la gestion de projet pour les TPE. Profil technique fort mais peu d\'expérience business/marketing. Besoin d\'un accompagnement structuré sur les aspects commerciaux.',
        recommendations: [
          'Valider le besoin avec 20 entrevues utilisateurs',
          'Construire un MVP en 4-6 semaines',
          'Explorer les options de financement (Bpifrance, love money)',
        ],
      },
    })

    await db.interviewNote.createMany({
      data: [
        { interviewId: interview3.id, phase: 'ACCUEIL', category: 'competence', content: 'Développeur full-stack senior (React, Node.js, PostgreSQL). 8 ans d\'expérience dont 3 en startup.', isKeyPoint: true, isActionItem: false },
        { interviewId: interview3.id, phase: 'ACCUEIL', category: 'observation', content: 'Thomas est actuellement salarié (CDI). Il envisage un départ progressif (congé création).', isKeyPoint: true, isActionItem: false },
        { interviewId: interview3.id, phase: 'ACCUEIL', category: 'vulnerabilite', content: 'Budget de démarrage de 25 000€ dont 15 000€ en love money et 10 000€ d\'économie personnelle. Risque financier limité.', isKeyPoint: false, isActionItem: false },
        { interviewId: interview3.id, phase: 'ACCUEIL', category: 'action', content: 'Planifier le congé création de 12 mois via son employeur actuel.', isKeyPoint: false, isActionItem: true },
      ],
    })
    console.log('   ✅ 3 interview sessions + 11 notes created')

    // ────────────────────────────────────────────
    // 28. BUSINESS PLAN SECTIONS — Sophie
    // ────────────────────────────────────────────
    console.log('📄 Updating Sophie\'s Business Plan sections...')

    await db.creatorJourney.update({
      where: { userId: sophie.id },
      data: {
        bpSections: JSON.stringify({
          'resume': 'Studio Bloom est une agence de design créatif spécialisée en identité visuelle et branding pour startups et PME en Île-de-France. Fondée par Sophie Bernard, designer expérimentée (5 ans en agence), Studio Bloom propose des prestations sur-mesure à des prix accessibles (à partir de 1 500€), comblant le vide entre les freelances juniors et les grandes agences.\n\nLe marché du design en France (2,3 Mrd€) croît de 8% par an, porté par le digital et le renouvellement post-COVID des identités de marque. Studio Bloom cible les startups en phase de lancement et les PME en rebranding, un segment estimé à 350 000 entreprises en IDF.\n\nObjectifs année 1 : 45 000€ de CA, 15-20 clients, marge nette 53%. Investissement initial : 8 000€ (équipement + réserve). Seuil de rentabilité atteint au 2ème mois d\'activité.',
          'equipe': 'Studio Bloom est une structure unipersonnelle au démarrage, dirigée par Sophie Bernard.\n\nSophie apporte :\n- 5 ans d\'expérience en agence de design (postes de designer puis senior designer)\n- Maîtrise complète de la suite Adobe (Illustrator, Photoshop, InDesign) et des outils modernes (Figma, Sketch)\n- Licence en Communication (Bac+3)\n- Réseau professionnel établi dans le milieu créatif parisien\n\nÉvolutions prévues :\n- Mois 6 : recrutement d\'un stagiaire en design graphique\n- Année 2 : collaboration avec un développeur web freelance pour les projets digitaux\n- Année 3 : embauche d\'un designer junior CDI',
          'etude-marche': 'Le marché du design en France est estimé à 2,3 milliards d\'euros (source : INSEE, 2023). Il connaît une croissance soutenue de 8% par an, tirée par la digitalisation et l\'importance croissante de l\'identité de marque.\n\nSegmentation cible :\n1. Startups en phase de lancement (40% du CA visé) — Besoin urgent d\'identité visuelle pour lever des fonds et se positionner\n2. PME en rebranding (35% du CA visé) — Modernisation de leur image de marque\n3. Indépendants et artisans (25% du CA visé) — Création d\'une identité professionnelle\n\nTendances clés :\n- Croissance de 8% par an du design digital\n- Demande post-COVID en identité visuelle renouvelée\n- Outils collaboratifs (Figma) qui changent les méthodes de travail\n- IA générative qui standardise le design générique mais valorise le sur-mesure',
          'swot': JSON.stringify({
            strengths: 'Compétences design solides (5 ans d\'expérience), pricing compétitif, approche sur-mesure, réseau professionnel établi, profil créatif affirmé',
            weaknesses: 'Aucune expérience en gestion d\'entreprise, réseau commercial limité, pas de visibilité en ligne initiale, structure unipersonnelle (risque de capacité)',
            opportunities: 'Créneau peu servi entre freelances et agences, marché en croissance, demandes croissantes des startups, possibilité de développer des workshops/formations',
            threats: 'IA générative (Midjourney, DALL-E) qui menace le design standardisé, concurrence accrue des plateformes (Malt, ComeUp), risque de retard de paiement des startups',
          }),
          'strategie-marketing': 'Stratégie marketing sur 12 mois :\n\nPhase 1 (Mois 1-3) — Visibilité :\n- Création du portfolio Behance (5 projets fictifs)\n- Optimisation du profil LinkedIn (15 publications)\n- Inscription sur Malt et ComeUp\n- Création du site vitrine Studio Bloom\n\nPhase 2 (Mois 4-6) — Acquisition :\n- Prospection ciblée : 10 startups/mois récemment financées\n- Contenu LinkedIn : 3 posts/semaine sur le branding\n- Partenariat avec 2 incubateurs parisiens\n- Témoignages clients vidéo\n\nPhase 3 (Mois 7-12) — Fidélisation :\n- Programme de fidélité (réduction 10% sur 2ème prestation)\n- Newsletter mensuelle design tips\n- Référencement naturel (SEO) sur mots-clés design\n- Présence dans 3 événements startup/networking par trimestre',
          'plan-commercial': 'Grille tarifaire :\n\nPack Essentiel (1 500€) :\n- Logo + 3 déclinaisons\n- Charte couleurs et typographie\n- Fichiers sources\n- Livrable : 2 semaines\n\nPack Premium (3 000€) :\n- Logo + déclinaisons complètes\n- Charte graphique complète\n- Papeterie business (cartes, papier en-tête)\n- Templates réseaux sociaux (10)\n- Brandbook (20 pages)\n- Livrable : 4 semaines\n\nPack Startup (5 000€) :\n- Identité visuelle complète\n- Pitch deck template\n- Site vitrine one-page\n- Kit lancement ( réseaux sociaux)\n- 2 sessions de coaching branding\n- Livrable : 6 semaines\n\nObjectifs commerciaux Année 1 :\n- Pack Essentiel : 8 clients\n- Pack Premium : 5 clients\n- Pack Startup : 2 clients\n- CA total : 45 000€',
          'financement': JSON.stringify([
            { id: 'f1', source: 'Économies personnelles', montant: 5000 },
            { id: 'f2', source: 'ACRE (allègement charges 1 an)', montant: 1500 },
            { id: 'f3', source: 'Aide à la création (ARCE si éligible)', montant: 2500 },
          ]),
          'statut-juridique': 'micro-entreprise',
          'calendrier': JSON.stringify([
            { id: 'c1', title: 'Inscription micro-entreprise', date: 'Mois 1, Semaine 1', completed: false },
            { id: 'c2', title: 'Création portfolio + site vitrine', date: 'Mois 1, Semaine 2-3', completed: false },
            { id: 'c3', title: 'Lancement prospection (10 contacts)', date: 'Mois 2', completed: false },
            { id: 'c4', title: 'Premier client signé', date: 'Mois 2, Semaine 3', completed: false },
            { id: 'c5', title: 'Objectif : 5 clients actifs', date: 'Mois 4', completed: false },
            { id: 'c6', title: 'Recrutement stagiaire design', date: 'Mois 6', completed: false },
            { id: 'c7', title: 'Objectif : 15 clients cumulés', date: 'Mois 8', completed: false },
            { id: 'c8', title: 'Passage en SASU si CA > 77 700€', date: 'Mois 12', completed: false },
          ]),
        }),
        bpScore: 65,
        bpStatus: 'IN_PROGRESS',
        bpGeneratedAt: pastDate(10),
      },
    })
    console.log('   ✅ Business Plan sections updated for Sophie')

    // ────────────────────────────────────────────
    // 29. ADDITIONAL MODULE RESULTS
    // ────────────────────────────────────────────
    console.log('📊 Creating additional module results...')

    const additionalModulesSophie = [
      { moduleCode: 'marche', score: 78, feedback: 'Analyse de marché structurée et réaliste pour le secteur créatif.' },
      { moduleCode: 'juridique', score: 82, feedback: 'Choix du statut juridique adapté. Bonne compréhension des obligations.' },
      { moduleCode: 'creasim', score: 85, feedback: 'Simulation financière très rassurante. Rentabilité rapide.' },
      { moduleCode: 'tremplin', score: 82, feedback: 'Tremplin GO — Profil entrepreneur cohérent et viable.' },
      { moduleCode: 'profil-createur', score: 88, feedback: 'Profil créateur affirmé avec des compétences bien identifiées.' },
      { moduleCode: 'mon-projet', score: 76, feedback: 'Projet bien formulé. Besoin d\'affiner la segmentation client.' },
    ]

    const additionalModulesThomas = [
      { moduleCode: 'marche', score: 72, feedback: 'Marché bien analysé mais pricing à valider avec les utilisateurs.' },
      { moduleCode: 'juridique', score: 80, feedback: 'Choix SASU pertinent pour un projet SaaS avec ambition de croissance.' },
      { moduleCode: 'creasim', score: 75, feedback: 'Simulation réaliste. Cash-flow critique les 7 premiers mois.' },
      { moduleCode: 'profil-createur', score: 85, feedback: 'Profil technique solide avec bonne orientation entrepreneuriale.' },
    ]

    for (const m of additionalModulesSophie) {
      await db.moduleResult.upsert({
        where: { userId_moduleCode: { userId: sophie.id, moduleCode: m.moduleCode } },
        update: {},
        create: {
          userId: sophie.id,
          moduleCode: m.moduleCode,
          score: m.score,
          maxScore: 100,
          answers: JSON.stringify({ completed: true }),
          feedback: m.feedback,
          completedAt: pastDate(Math.floor(Math.random() * 20) + 5),
        },
      })
    }

    for (const m of additionalModulesThomas) {
      await db.moduleResult.upsert({
        where: { userId_moduleCode: { userId: thomas.id, moduleCode: m.moduleCode } },
        update: {},
        create: {
          userId: thomas.id,
          moduleCode: m.moduleCode,
          score: m.score,
          maxScore: 100,
          answers: JSON.stringify({ completed: true }),
          feedback: m.feedback,
          completedAt: pastDate(Math.floor(Math.random() * 15) + 8),
        },
      })
    }
    console.log('   ✅ 10 additional module results created')

    // ────────────────────────────────────────────
    // DONE
    // ────────────────────────────────────────────
    console.log('\n✅ Seed completed successfully!')
    console.log('─'.repeat(60))
    console.log('  Tenant:           GIDEF Île-de-France')
    console.log('  Organization:     GIDEF Paris Centre')
    console.log('  Users:            5 (1 admin, 2 counselors, 2 beneficiaries)')
    console.log('  Categories:       5')
    console.log('  Discussions:      3 (+ 6 replies)')
    console.log('  Actors:           5')
    console.log('  Appointments:     3')
    console.log('  ModuleResults:    19 (12 Sophie, 7 Thomas)')
    console.log('  RIASEC:           12 (6 Sophie, 6 Thomas)')
    console.log('  Kiviat:           16 (8 Sophie, 8 Thomas)')
    console.log('  Tremplin:         2 (Sophie GO/82%, Thomas en cours/68%)')
    console.log('  CreaSim:          2 (Sophie rentable M2, Thomas rentable M8)')
    console.log('  BMC:              2 (Sophie & Thomas)')
    console.log('  Juridique:        2 (Sophie micro-entreprise, Thomas SASU)')
    console.log('  Market Analysis:   2 (Sophie design, Thomas SaaS)')
    console.log('  Financial:        2 (Sophie & Thomas)')
    console.log('  Motivation:       2 (Sophie & Thomas)')
    console.log('  InterviewSessions: 3 + 11 notes')
    console.log('  BP Sections:      9 sections (Sophie)')
    console.log('  Notifications:    10 (Sophie)')
    console.log('  SwipeCards:       60 (Pépites)')
    console.log('  SwipeQuestions:   300 (Pépites Quiz)')
    console.log('─'.repeat(60))
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
