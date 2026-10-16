import type { PrismaClient } from './db.js';

export interface Context {
  prisma: PrismaClient;
  /** Null when no user is resolved. Until auth exists this is always the seeded local user. */
  currentUserId: string | null;
}
