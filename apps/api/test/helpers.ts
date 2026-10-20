import { randomUUID } from 'node:crypto';

import type { GraphQLFormattedError } from 'graphql';
import { afterAll, beforeEach } from 'vitest';

import { createPrismaClient } from '../src/db.js';
import { createApolloServer } from '../src/server.js';
import { assertIsTestDatabase, testDatabaseUrl } from './database-url.js';

assertIsTestDatabase(testDatabaseUrl);

export const prisma = createPrismaClient(testDatabaseUrl);
const apollo = createApolloServer();

/** Call at the top of an integration test file: every test starts with empty tables. */
export function useTestDatabase(): void {
  beforeEach(resetDatabase);
  afterAll(() => prisma.$disconnect());
}

async function resetDatabase(): Promise<void> {
  // Read table names from Postgres so new models are cleaned up without updating this list.
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const names = tables.map(({ tablename }) => `"${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE ${names} RESTART IDENTITY CASCADE`);
}

export interface ExecuteOptions {
  variables?: Record<string, unknown>;
  /** Who the request runs as. Omit (or pass null) to run signed out. */
  currentUserId?: string | null;
}

export interface ExecuteResult<TData> {
  data?: TData | null;
  errors?: readonly GraphQLFormattedError[];
}

/** Runs a GraphQL operation through the real server, resolvers, and test database. */
export async function execute<TData = Record<string, unknown>>(
  query: string,
  { variables, currentUserId = null }: ExecuteOptions = {},
): Promise<ExecuteResult<TData>> {
  const response = await apollo.executeOperation<TData>(
    { query, variables },
    { contextValue: { prisma, currentUserId } },
  );
  if (response.body.kind !== 'single') throw new Error('Expected a single GraphQL result');
  const { data, errors } = response.body.singleResult;
  return { data, errors };
}

export function createUser(displayName = 'Test User') {
  return prisma.user.create({ data: { email: `${randomUUID()}@test.dev`, displayName } });
}

export function createJournal(ownerId: string, title = 'Test Journal') {
  return prisma.journal.create({ data: { ownerId, title } });
}
