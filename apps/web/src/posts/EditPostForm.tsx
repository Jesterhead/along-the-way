import { useMutation } from '@apollo/client/react';
import { type FormEvent, useState } from 'react';

import { UpdatePostMutation } from './posts.graphql';

interface EditPostFormProps {
  postId: string;
  blocks: { id: string; text: string }[];
  onDone: () => void;
}

export function EditPostForm({ postId, blocks, onDone }: EditPostFormProps) {
  const [texts, setTexts] = useState(() => blocks.map((block) => block.text));
  // No refetchQueries: the response returns the Post with its id, so Apollo's cache
  // updates the existing post in place and JournalPage re-renders by itself.
  const [updatePost, { loading, error }] = useMutation(UpdatePostMutation);

  function setTextAt(index: number, text: string) {
    setTexts((current) => current.map((existing, i) => (i === index ? text : existing)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      // updatePost replaces every block, so send all of them, not just the edited ones.
      await updatePost({
        variables: {
          id: postId,
          input: { blocks: texts.map((text) => ({ type: 'TEXT', text })) },
        },
      });
      onDone();
    } catch {
      // Already shown through the "error" below.
    }
  }

  const hasBlankBlock = texts.some((text) => !text.trim());

  return (
    <form onSubmit={handleSubmit}>
      {blocks.map((block, index) => (
        <textarea
          key={block.id}
          aria-label={`Edit block ${index + 1} of ${blocks.length}`}
          value={texts[index]}
          onChange={(e) => setTextAt(index, e.target.value)}
        />
      ))}
      <button type="submit" disabled={loading || hasBlankBlock}>
        Save
      </button>
      <button type="button" onClick={onDone} disabled={loading}>
        Cancel
      </button>
      {error && <p role="alert">{error.message}</p>}
    </form>
  );
}
