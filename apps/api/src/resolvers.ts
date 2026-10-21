import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';

import type { Context } from './context.js';
import type { BlockInput, Resolvers } from './generated/graphql.js';

function badInput(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

function notFound(what: string): GraphQLError {
  return new GraphQLError(`${what} not found`, { extensions: { code: 'NOT_FOUND' } });
}

function requireUser({ currentUserId }: Context): string {
  if (!currentUserId) {
    throw new GraphQLError('Not signed in', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  return currentUserId;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres rejects non-UUID values in UUID columns with an error, so treat a
// malformed ID the same as an ID that doesn't exist.
function isUuid(id: string): boolean {
  return UUID_PATTERN.test(id);
}

// Mirrors the Block_text_required_for_text CHECK constraint so clients get a clear
// error instead of a database exception. Array order becomes block position.
function toBlockRows(blocks: readonly BlockInput[]) {
  if (blocks.length === 0) throw badInput('A post needs at least one block');

  return blocks.map((block, position) => {
    if (block.type === 'TEXT' && !block.text?.trim()) {
      throw badInput(`Block ${position} is a TEXT block but has no text`);
    }

    return { type: block.type, text: block.text ?? null, position };
  });
}

function parseDateTime(value: unknown): Date {
  const date = typeof value === 'string' ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) throw badInput('DateTime must be an ISO-8601 string');
  return date;
}

// Dates leave the API as ISO-8601 strings and arrive in resolvers as Date objects.
const DateTime = new GraphQLScalarType<Date, string>({
  name: 'DateTime',
  serialize: (value) => {
    if (!(value instanceof Date)) throw new TypeError('DateTime can only serialize Date objects');
    return value.toISOString();
  },
  parseValue: parseDateTime,
  parseLiteral: (ast) => parseDateTime(ast.kind === Kind.STRING ? ast.value : undefined),
});

export const resolvers: Resolvers = {
  DateTime,
  Query: {
    health: () => 'ok',
    me: (_parent, _args, { prisma, currentUserId }) =>
      currentUserId ? prisma.user.findUnique({ where: { id: currentUserId } }) : null,
    journal: (_parent, { id }, context) => {
      const ownerId = requireUser(context);
      if (!isUuid(id)) return null;
      return context.prisma.journal.findFirst({ where: { id, ownerId: ownerId } });
    },
  },
  User: {
    journals: (user, _args, { prisma }) =>
      prisma.journal.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'asc' } }),
  },
  Journal: {
    posts: (journal, _args, { prisma }) =>
      prisma.post.findMany({ where: { journalId: journal.id }, orderBy: { createdAt: 'desc' } }),
  },
  Post: {
    journal: (post, _args, { prisma }) =>
      prisma.journal.findUniqueOrThrow({ where: { id: post.journalId } }),
    blocks: (post, _args, { prisma }) =>
      prisma.block.findMany({ where: { postId: post.id }, orderBy: { position: 'asc' } }),
  },
  Block: {
    __resolveType: (block) => {
      switch (block.type) {
        case 'TEXT':
          return 'TextBlock';
      }
    },
  },
  TextBlock: {
    // The CHECK constraint guarantees text is present on TEXT blocks.
    text: (block) => block.text ?? '',
  },
  Mutation: {
    createPost: async (_parent, { journalId, input }, context) => {
      const { prisma } = context;
      if (!isUuid(journalId)) throw notFound('Journal');
      const journal = await prisma.journal.findFirst({
        where: { id: journalId, ownerId: requireUser(context) },
        select: { id: true },
      });
      if (!journal) throw notFound('Journal');

      return prisma.post.create({
        data: { journalId, blocks: { create: toBlockRows(input.blocks) } },
      });
    },

    updatePost: async (_parent, { id, input }, context) => {
      const { prisma } = context;
      if (!isUuid(id)) throw notFound('Post');
      const post = await prisma.post.findFirst({
        where: { id, journal: { ownerId: requireUser(context) } },
        select: { id: true },
      });
      if (!post) throw notFound('Post');

      const blocks = toBlockRows(input.blocks);
      // Delete first: the new blocks reuse positions 0..n, which would collide with
      // the old rows on the (postId, position) unique index.
      return prisma.$transaction(async (tx) => {
        await tx.block.deleteMany({ where: { postId: id } });
        return tx.post.update({
          where: { id },
          // Set explicitly: a nested-only write doesn't touch the Post row, so @updatedAt wouldn't change.
          data: { updatedAt: new Date(), blocks: { create: blocks } },
        });
      });
    },
  },
};
