import { describe, expect, it } from 'vitest';

import { createJournal, createUser, execute, prisma, useTestDatabase } from '../test/helpers.js';

useTestDatabase();

const CREATE_POST = `
  mutation CreatePost($journalId: ID!, $input: PostInput!) {
    createPost(journalId: $journalId, input: $input) {
      id
      blocks {
        __typename
        position
        ... on TextBlock { text }
      }
    }
  }
`;

interface CreatePostData {
  createPost: {
    id: string;
    blocks: { __typename: string; position: number; text: string }[];
  };
}

describe('createPost', () => {
  it('creates a post whose blocks keep the order they were sent in', async () => {
    const user = await createUser();
    const journal = await createJournal(user.id);

    const result = await execute<CreatePostData>(CREATE_POST, {
      currentUserId: user.id,
      variables: {
        journalId: journal.id,
        input: {
          blocks: [
            { type: 'TEXT', text: 'First' },
            { type: 'TEXT', text: 'Second' },
          ],
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createPost.blocks).toEqual([
      { __typename: 'TextBlock', position: 0, text: 'First' },
      { __typename: 'TextBlock', position: 1, text: 'Second' },
    ]);
    // Check the database too, not just the response.
    expect(await prisma.block.count({ where: { postId: result.data?.createPost.id } })).toBe(2);
  });

  it('rejects a TEXT block with blank text', async () => {
    const user = await createUser();
    const journal = await createJournal(user.id);

    const result = await execute(CREATE_POST, {
      currentUserId: user.id,
      variables: { journalId: journal.id, input: { blocks: [{ type: 'TEXT', text: '   ' }] } },
    });

    expect(errorCode(result)).toBe('BAD_USER_INPUT');
    expect(await prisma.post.count()).toBe(0);
  });

  it('rejects a post with no blocks', async () => {
    const user = await createUser();
    const journal = await createJournal(user.id);

    const result = await execute(CREATE_POST, {
      currentUserId: user.id,
      variables: { journalId: journal.id, input: { blocks: [] } },
    });

    expect(errorCode(result)).toBe('BAD_USER_INPUT');
    expect(await prisma.post.count()).toBe(0);
  });
});

const UPDATE_POST = `
  mutation UpdatePost($id: ID!, $input: PostInput!) {
    updatePost(id: $id, input: $input) {
      updatedAt
      blocks {
        position
        ... on TextBlock { text }
      }
    }
  }
`;

interface UpdatePostData {
  updatePost: { updatedAt: string; blocks: { position: number; text: string }[] };
}

describe('updatePost', () => {
  it("returns NOT_FOUND for another user's post and leaves it unchanged", async () => {
    const owner = await createUser('Owner');
    const intruder = await createUser('Intruder');
    const post = await createPost((await createJournal(owner.id)).id, ['Original']);

    const result = await execute(UPDATE_POST, {
      currentUserId: intruder.id,
      variables: { id: post.id, input: { blocks: [{ type: 'TEXT', text: 'Hacked' }] } },
    });

    expect(errorCode(result)).toBe('NOT_FOUND');
    const blocks = await prisma.block.findMany({ where: { postId: post.id } });
    expect(blocks.map((block) => block.text)).toEqual(['Original']);
  });

  it('replaces the blocks in order and bumps updatedAt', async () => {
    const user = await createUser();
    const post = await createPost((await createJournal(user.id)).id, ['Old one', 'Old two'], {
      at: new Date('2020-01-01T00:00:00Z'),
    });

    const result = await execute<UpdatePostData>(UPDATE_POST, {
      currentUserId: user.id,
      variables: {
        id: post.id,
        input: {
          blocks: [
            { type: 'TEXT', text: 'New first' },
            { type: 'TEXT', text: 'New second' },
            { type: 'TEXT', text: 'New third' },
          ],
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.updatePost.blocks).toEqual([
      { position: 0, text: 'New first' },
      { position: 1, text: 'New second' },
      { position: 2, text: 'New third' },
    ]);
    expect(new Date(result.data!.updatePost.updatedAt).getTime()).toBeGreaterThan(
      post.updatedAt.getTime(),
    );
    // The old blocks must be gone, not left alongside the new ones.
    expect(await prisma.block.count({ where: { postId: post.id } })).toBe(3);
  });
});

const JOURNAL = `
  query Journal($id: ID!) {
    journal(id: $id) {
      posts {
        blocks {
          position
          ... on TextBlock { text }
        }
      }
    }
  }
`;

interface JournalData {
  journal: { posts: { blocks: { position: number; text: string }[] }[] } | null;
}

describe('journal query', () => {
  it('returns posts newest first, each with blocks in position order', async () => {
    const user = await createUser();
    const journal = await createJournal(user.id);
    await createPost(journal.id, ['Older A', 'Older B'], { at: new Date('2026-01-01T00:00:00Z') });
    await createPost(journal.id, ['Newer A', 'Newer B'], { at: new Date('2026-02-01T00:00:00Z') });

    const result = await execute<JournalData>(JOURNAL, {
      currentUserId: user.id,
      variables: { id: journal.id },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.journal?.posts).toEqual([
      {
        blocks: [
          { position: 0, text: 'Newer A' },
          { position: 1, text: 'Newer B' },
        ],
      },
      {
        blocks: [
          { position: 0, text: 'Older A' },
          { position: 1, text: 'Older B' },
        ],
      },
    ]);
  });

  describe('input safety', () => {
    it('returns NOT_FOUND, not an internal error, for malformed ids in mutations', async () => {
      const user = await createUser();

      const create = await execute(CREATE_POST, {
        currentUserId: user.id,
        variables: { journalId: 'not-a-uuid', input: { blocks: [{ type: 'TEXT', text: 'Hi' }] } },
      });
      const update = await execute(UPDATE_POST, {
        currentUserId: user.id,
        variables: { id: 'not-a-uuid', input: { blocks: [{ type: 'TEXT', text: 'Hi' }] } },
      });

      expect(errorCode(create)).toBe('NOT_FOUND');
      expect(errorCode(update)).toBe('NOT_FOUND');
    });

    it('leaves the existing blocks untouched when an edit is rejected', async () => {
      const user = await createUser();
      const post = await createPost((await createJournal(user.id)).id, ['Keep me', 'Me too']);

      const result = await execute(UPDATE_POST, {
        currentUserId: user.id,
        variables: { id: post.id, input: { blocks: [{ type: 'TEXT', text: '  ' }] } },
      });

      expect(errorCode(result)).toBe('BAD_USER_INPUT');
      const blocks = await prisma.block.findMany({
        where: { postId: post.id },
        orderBy: { position: 'asc' },
      });
      expect(blocks.map((block) => block.text)).toEqual(['Keep me', 'Me too']);
    });
  });
});

function errorCode(result: { errors?: readonly { extensions?: Record<string, unknown> }[] }) {
  return result.errors?.[0]?.extensions?.['code'];
}

// Inserts directly through Prisma so update and read tests don't depend on createPost working.
// Blocks are created in reverse so the test proves results are sorted by position, not insertion.
function createPost(journalId: string, texts: string[], { at = new Date() } = {}) {
  return prisma.post.create({
    data: {
      journalId,
      createdAt: at,
      updatedAt: at,
      blocks: {
        create: texts
          .map((text, position) => ({ type: 'TEXT' as const, text, position }))
          .reverse(),
      },
    },
  });
}

it('returns null for a malformed id instead of an error', async () => {
  const user = await createUser();

  const result = await execute<JournalData>(JOURNAL, {
    currentUserId: user.id,
    variables: { id: 'not-a-uuid' },
  });

  expect(result.errors).toBeUndefined();
  expect(result.data?.journal).toBeNull();
});

describe('access control', () => {
  it("returns null for another user's journal", async () => {
    const owner = await createUser('Owner');
    const intruder = await createUser('Intruder');
    const journal = await createJournal(owner.id);
    await createPost(journal.id, ['Private']);

    const result = await execute<JournalData>(JOURNAL, {
      currentUserId: intruder.id,
      variables: { id: journal.id },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.journal).toBeNull();
  });

  it("returns NOT_FOUND when creating a post in another user's journal", async () => {
    const owner = await createUser('Owner');
    const intruder = await createUser('Intruder');
    const journal = await createJournal(owner.id);

    const result = await execute(CREATE_POST, {
      currentUserId: intruder.id,
      variables: { journalId: journal.id, input: { blocks: [{ type: 'TEXT', text: 'Hi' }] } },
    });

    expect(errorCode(result)).toBe('NOT_FOUND');
    expect(await prisma.post.count()).toBe(0);
  });

  it('requires a signed-in user for reads and writes', async () => {
    const owner = await createUser();
    const journal = await createJournal(owner.id);
    const post = await createPost(journal.id, ['Original']);

    const read = await execute(JOURNAL, { variables: { id: journal.id } });
    const create = await execute(CREATE_POST, {
      variables: { journalId: journal.id, input: { blocks: [{ type: 'TEXT', text: 'Hi' }] } },
    });
    const update = await execute(UPDATE_POST, {
      variables: { id: post.id, input: { blocks: [{ type: 'TEXT', text: 'Changed' }] } },
    });

    expect([errorCode(read), errorCode(create), errorCode(update)]).toEqual([
      'UNAUTHENTICATED',
      'UNAUTHENTICATED',
      'UNAUTHENTICATED',
    ]);
    expect(await prisma.post.count()).toBe(1);
  });
});
