import assert from 'node:assert';
import { describe, expect, it, vi } from 'vitest';
import type { Context } from './context.js';
import type { PrismaClient } from './db.js';
import { createApolloServer } from './server.js';

const localUser = { id: 'user-1', email: 'local@test.dev', displayName: 'Local User' };

function makeContext(currentUserId: string | null): Context {
  const prisma = {
    user: { findUnique: vi.fn().mockResolvedValue(localUser) },
    journal: { findMany: vi.fn().mockResolvedValue([{ id: 'journal-1', title: 'My Journal' }]) },
  };
  return { prisma: prisma as unknown as PrismaClient, currentUserId };
}

async function execute(query: string, context: Context) {
  const response = await createApolloServer().executeOperation(
    { query },
    { contextValue: context },
  );
  assert(response.body.kind === 'single');
  return response.body.singleResult;
}

describe('resolvers', () => {
  it('answers the health query', async () => {
    const result = await execute('{ health }', makeContext(null));
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ health: 'ok' });
  });

  it('returns the current user with their journals', async () => {
    const result = await execute(
      '{ me { displayName journals { title } } }',
      makeContext('user-1'),
    );
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      me: { displayName: 'Local User', journals: [{ title: 'My Journal' }] },
    });
  });

  it('returns null for me when no user is resolved', async () => {
    const result = await execute('{ me { id } }', makeContext(null));
    expect(result.data).toEqual({ me: null });
  });
});
