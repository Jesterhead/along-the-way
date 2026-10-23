import { useMutation } from '@apollo/client/react';
import { type FormEvent, useState } from 'react';

import { Button } from '../ui/button/Button';
import { TextArea } from '../ui/textArea/TextArea';
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {blocks.map((block, index) => (
        <TextArea
          key={block.id}
          aria-label={`Edit block ${index + 1} of ${blocks.length}`}
          value={texts[index]}
          onChange={(e) => setTextAt(index, e.target.value)}
        />
      ))}
      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={loading || hasBlankBlock}>
          Save
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={loading}>
          Cancel
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </form>
  );
}
