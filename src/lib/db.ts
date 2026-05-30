import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── Hardcoded PostgreSQL connection (sandbox environment) ──
const PG_CONNECTION_STRING = 'postgresql://bureau_virtuelle_user:bureau_virtuelle_pass2026@213.199.38.41:5432/bureau_virtuelle'

function createPrismaClient(): PrismaClient {
  console.log('[DB] Creating PrismaClient with hardcoded PG connection')

  const pool = new pg.Pool({
    connectionString: PG_CONNECTION_STRING,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5,
  })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
