import { useMutation } from '@apollo/client/react';
import { type FormEvent, useState } from 'react';

import { Button } from '../ui/button/Button';
import { Input } from '../ui/input/Input';
import { TextArea } from '../ui/textArea/TextArea';
import { CreatePostMutation } from './posts.graphql';

export function NewPostForm({ journalId }: { journalId: string }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [createPost, { loading, error }] = useMutation(CreatePostMutation, {
    // Re-run the journal page query so the new post shows up in the list.
    refetchQueries: ['JournalPage'],
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createPost({
        variables: { journalId, input: { title, blocks: [{ type: 'TEXT', text }] } },
      });
      setText('');
      setTitle('');
    } catch {
      // Already shown through the "error" below.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        aria-label="New post title"
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextArea aria-label="New post" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !title.trim() || !text.trim()}>
          Post
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
