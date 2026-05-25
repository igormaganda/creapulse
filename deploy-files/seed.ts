import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Connecting to PostgreSQL...')

  // Test connection
  await db.$queryRaw`SELECT 1`
  console.log('✅ PostgreSQL connection OK!')

  // Create default tenant
  console.log('📦 Creating tenant GIDEF...')
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

  // Create organization
  console.log('🏢 Creating organization...')
  const org = await db.organization.create({
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
    },
  }).catch(() => {
    console.log('   ⚠️ Organization already exists, skipping...')
    return null
  })
  if (org) console.log(`   ✅ Organization: ${org.name}`)

  // Hash password helper
  const hash = (pw: string) => bcrypt.hashSync(pw, 12)

  // Create users
  console.log('👤 Creating users...')
  const users = [
    { email: 'admin@gidef.fr', password: 'Admin123!', firstName: 'Admin', lastName: 'GIDEF', role: 'ADMIN' as const },
    { email: 'marie.dupont@gidef.fr', password: 'Conseiller1!', firstName: 'Marie', lastName: 'Dupont', role: 'COUNSELOR' as const },
    { email: 'jean.martin@gidef.fr', password: 'Conseiller2!', firstName: 'Jean', lastName: 'Martin', role: 'COUNSELOR' as const },
    { email: 'sophie.bernard@email.fr', password: 'Beneficiaire1!', firstName: 'Sophie', lastName: 'Bernard', role: 'BENEFICIARY' as const },
    { email: 'thomas.petit@email.fr', password: 'Beneficiaire2!', firstName: 'Thomas', lastName: 'Petit', role: 'BENEFICIARY' as const },
  ]

  for (const u of users) {
    try {
      const user = await db.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
        update: { firstName: u.firstName, lastName: u.lastName, role: u.role, passwordHash: hash(u.password) },
        create: {
          tenantId: tenant.id,
          email: u.email,
          passwordHash: hash(u.password),
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          emailVerified: true,
        },
      })
      console.log(`   ✅ ${u.email} (${u.role})`)
    } catch (e: any) {
      console.log(`   ⚠️ ${u.email}: ${e.message}`)
    }
  }

  console.log('\n✅ Seed completed!')
  console.log('─'.repeat(50))
  console.log('  Comptes de test :')
  console.log('  admin@gidef.fr / Admin123!')
  console.log('  marie.dupont@gidef.fr / Conseiller1!')
  console.log('  jean.martin@gidef.fr / Conseiller2!')
  console.log('  sophie.bernard@email.fr / Beneficiaire1!')
  console.log('  thomas.petit@email.fr / Beneficiaire2!')
  console.log('─'.repeat(50))
}

main()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
