import { PrismaClient } from '@prisma/client'
import { createLogger } from './logger'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const log = createLogger('DB')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// ─── Database connection string ──
// Force-read from .env file to override any shell-level env vars
function getConnectionString(): string {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('DATABASE_URL=')) {
        const value = trimmed.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '')
        if (value) {
          // Override process.env so Prisma picks it up
          process.env.DATABASE_URL = value
          return value
        }
      }
    }
  } catch {
    // .env file not found, fall through to process.env
  }

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