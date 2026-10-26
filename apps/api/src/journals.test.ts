import { describe, expect, it } from 'vitest';

import { createJournal, createUser, execute, prisma, useTestDatabase } from '../test/helpers.js';

useTestDatabase();

const UPDATE_JOURNAL = `
  mutation UpdateJournal($id: ID!, $input: JournalInput!) {
    updateJournal(id: $id, input: $input) {
      id
      title
    }
  }
`;

interface UpdateJournalData {
  updateJournal: { id: string; title: string };
}

function errorCode(result: { errors?: readonly { extensions?: Record<string, unknown> }[] }) {
  return result.errors?.[0]?.extensions?.['code'];
}

async function titleOf(journalId: string) {
  return (await prisma.journal.findUniqueOrThrow({ where: { id: journalId } })).title;
}

describe('updateJournal', () => {
  it('renames your own journal and stores the title trimmed', async () => {
    const user = await createUser();
    const journal = await createJournal(user.id, 'Old name');

    const result = await execute<UpdateJournalData>(UPDATE_JOURNAL, {
      currentUserId: user.id,
      variables: { id: journal.id, input: { title: '  Summer trip  ' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.updateJournal).toEqual({ id: journal.id, title: 'Summer trip' });
    expect(await titleOf(journal.id)).toBe('Summer trip');
  });

  it("returns NOT_FOUND for another user's journal and leaves it unchanged", async () => {
    const owner = await createUser('Owner');
    const intruder = await createUser('Intruder');
    const journal = await createJournal(owner.id, 'Private');

    const result = await execute(UPDATE_JOURNAL, {
      currentUserId: intruder.id,
      variables: { id: journal.id, input: { title: 'Hacked' } },
    });

    expect(errorCode(result)).toBe('NOT_FOUND');
    expect(await titleOf(journal.id)).toBe('Private');
  });

  it('requires a signed-in user', async () => {
    const owner = await createUser();
    const journal = await createJournal(owner.id, 'Mine');

    const result = await execute(UPDATE_JOURNAL, {
      variables: { id: journal.id, input: { title: 'Changed' } },
    });

    expect(errorCode(result)).toBe('UNAUTHENTICATED');
    expect(await titleOf(journal.id)).toBe('Mine');
  });

  it('returns NOT_FOUND, not an internal error, for a malformed id', async () => {
    const user = await createUser();

    const result = await execute(UPDATE_JOURNAL, {
      currentUserId: user.id,
      variables: { id: 'not-a-uuid', input: { title: 'Anything' } },
    });

    expect(errorCode(result)).toBe('NOT_FOUND');
  });

  it('rejects blank and too-long titles without changing the journal', async () => {
    const user = await createUser();
    const journal = await createJournal(user.id, 'Keep me');
    const rename = (title: string) =>
      execute(UPDATE_JOURNAL, {
        currentUserId: user.id,
        variables: { id: journal.id, input: { title } },
      });

    expect(errorCode(await rename('   '))).toBe('BAD_USER_INPUT');
    expect(errorCode(await rename('a'.repeat(121)))).toBe('BAD_USER_INPUT');
    expect(await titleOf(journal.id)).toBe('Keep me');
  });
});
