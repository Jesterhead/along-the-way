import { useMutation } from '@apollo/client/react';
import { type FormEvent, useState } from 'react';

import { CreatePostMutation } from './posts.graphql';

export function NewPostForm({ journalId }: { journalId: string }) {
  const [text, setText] = useState('');
  const [createPost, { loading, error }] = useMutation(CreatePostMutation, {
    // Re-run the journal page query so the new post shows up in the list.
    refetchQueries: ['JournalPage'],
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createPost({
        variables: { journalId, input: { blocks: [{ type: 'TEXT', text }] } },
      });
      setText('');
    } catch {
      // Already shown through the "error" below.
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea aria-label="New post" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit" disabled={loading || !text.trim()}>
        Post
      </button>
      {error && <p role="alert">{error.message}</p>}
    </form>
  );
}
