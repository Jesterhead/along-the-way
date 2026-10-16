import 'dotenv/config';
import { createPrismaClient } from '../src/db.js';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) throw new Error('Missing required environment variable: DATABASE_URL');

const email = process.env['LOCAL_USER_EMAIL'] ?? 'local@along-the-way.dev';
const prisma = createPrismaClient(databaseUrl);

// Idempotent: safe to run on every container start.
const user = await prisma.user.upsert({
  where: { email },
  update: {},
  create: { email, displayName: 'Local User' },
});

const journalCount = await prisma.journal.count({ where: { ownerId: user.id } });
if (journalCount === 0) {
  await prisma.journal.create({ data: { title: 'My Journal', ownerId: user.id } });
}

console.log(`Seeded local user ${email}`);
await prisma.$disconnect();
