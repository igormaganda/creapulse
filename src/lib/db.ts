import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || ''

  // SQLite: use PrismaClient directly without adapter
  if (url.startsWith('file:')) {
    return new PrismaClient({ log: ['error', 'warn'] })
  }

  // PostgreSQL: use pg pool + PrismaPg adapter
  try {
    // Dynamic imports to avoid lint errors and missing-module crashes
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pgMod = require('pg')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const adapterMod = require('@prisma/adapter-pg')

    const pool = new pgMod.Pool({
      connectionString: url,
      connectionTimeoutMillis: 5000,
      max: 3,
    })
    pool.on('error', () => {}) // Prevent unhandled pool errors from crashing process

    const adapter = new adapterMod.PrismaPg(pool)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  } catch {
    return new PrismaClient({ log: ['error', 'warn'] })
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db