import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── Database connection string ──
// Primary: use DATABASE_URL from environment (Vercel / production)
// Fallback: hardcoded string for local dev / sandbox only
const FALLBACK_CONNECTION_STRING = 'postgresql://bureau_virtuelle_user:bureau_virtuelle_pass2026@213.199.38.41:5432/bureau_virtuelle'

function getConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  console.warn(
    '[DB] DATABASE_URL not set — falling back to hardcoded sandbox connection string. ' +
    'Set DATABASE_URL in your environment for production deployments.',
  )
  return FALLBACK_CONNECTION_STRING
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConnectionString()
  console.log('[DB] Creating PrismaClient')

  const pool = new pg.Pool({
    connectionString,
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
