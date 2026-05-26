import type { PrismaConfig } from 'prisma'

export default {
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    development() {
      return {
        url: process.env.DATABASE_URL!,
      }
    },
  },
} satisfies PrismaConfig
