import { useMutation } from '@apollo/client/react';
import { type FormEvent, useState } from 'react';

import { Button } from '../ui/button/Button';
import { Input } from '../ui/input/Input';
import { UpdateJournalMutation } from './journals.graphql';

interface EditJournalFormProps {
  journalId: string;
  initialTitle: string;
  onDone: () => void;
}

export function RenameJournalForm({ journalId, initialTitle, onDone }: EditJournalFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [updateJournal, { loading, error }] = useMutation(UpdateJournalMutation);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await updateJournal({
        variables: { id: journalId, input: { title } },
      });
      onDone();
    } catch {
      // Already shown through the "error" below.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        aria-label="Edit journal title"
        maxLength={120}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={loading || !title.trim() || title.trim() === initialTitle}>
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
