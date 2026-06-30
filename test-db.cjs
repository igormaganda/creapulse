/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

const DATABASE_URL = 'file:/home/z/my-project/db/creapulse.db';

async function main() {
  console.log('Using DB:', DATABASE_URL);
  const { createClient } = require('@libsql/client');
  const { PrismaLibSql } = require('@prisma/adapter-libsql');
  const { PrismaClient } = require('@prisma/client');

  const libsql = createClient({ url: DATABASE_URL });
  const adapter = new PrismaLibSql(libsql);
  const db = new PrismaClient({ adapter, log: ['error', 'warn'] });

  const t = await db.tenant.upsert({
    where: { slug: 'gidef' },
    create: { name: 'GIDEF', slug: 'gidef', isActive: true },
    update: {},
  });
  console.log('SQLite OK! Tenant:', t.id, t.name);
  await db.$disconnect();
}
main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
