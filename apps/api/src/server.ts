import { readFileSync } from 'node:fs';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import type { Context } from './context.js';
import type { PrismaClient } from './db.js';
import { resolvers } from './resolvers.js';

export const typeDefs = readFileSync(new URL('./schema.graphql', import.meta.url), 'utf8');

export function createApolloServer(): ApolloServer<Context> {
  return new ApolloServer<Context>({ typeDefs, resolvers });
}

interface AppOptions {
  prisma: PrismaClient;
  localUserEmail: string;
}

export async function createApp({ prisma, localUserEmail }: AppOptions) {
  const apollo = createApolloServer();
  await apollo.start();

  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(apollo, {
      // Placeholder for auth: every request acts as the seeded local user.
      context: async (): Promise<Context> => {
        const user = await prisma.user.findUnique({
          where: { email: localUserEmail },
          select: { id: true },
        });
        return { prisma, currentUserId: user?.id ?? null };
      },
    }),
  );

  return { app, apollo };
}
