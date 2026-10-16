import type { Resolvers } from './generated/graphql.js';

export const resolvers: Resolvers = {
  Query: {
    health: () => 'ok',
    me: (_parent, _args, { prisma, currentUserId }) =>
      currentUserId ? prisma.user.findUnique({ where: { id: currentUserId } }) : null,
  },
  User: {
    journals: (user, _args, { prisma }) =>
      prisma.journal.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'asc' } }),
  },
};
