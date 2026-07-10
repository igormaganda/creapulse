import { PrismaClient } from '@prisma/client'
import { createLogger } from './logger'

const log = createLogger('DB')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── Database connection string ──
// DATABASE_URL must be set in the environment (Vercel / production / local .env)

function getConnectionString(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '[DB] DATABASE_URL environment variable is not set. ' +
      'Please set it in your .env file or deployment environment.',
    )
  }
  return process.env.DATABASE_URL
}

function createPrismaClient(): PrismaClient {
  const connectionString = getConnectionString()
  log.info('Creating PrismaClient')

  return new PrismaClient({
    datasourceUrl: connectionString,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db