import { useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { EditPostForm } from '../../posts/EditPostForm';
import { NewPostForm } from '../../posts/NewPostForm';
import { Button } from '../../ui/button/Button';
import { Card } from '../../ui/card/Card';
import { JournalPageQuery } from './JournalPage.query';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function JournalPage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useQuery(JournalPageQuery, { variables: { id } });
  const [editingId, setEditingId] = useState<string | null>(null);

  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert">Couldn't load this journal: {error.message}</p>;
  if (!data?.journal) return <p>Journal not found.</p>;

  const { journal } = data;

  return (
    <div className="flex flex-col gap-6">
      <p>
        <Link to="/" className="text-link">
          ← All journals
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">{journal.title}</h1>
      <NewPostForm journalId={journal.id} />
      {journal.posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {journal.posts.map((post) => (
            <Card key={post.id}>
              <article className="flex flex-col gap-3">
                <time className="text-sm text-muted-foreground" dateTime={post.createdAt}>
                  {dateFormat.format(new Date(post.createdAt))}
                </time>
                {editingId === post.id ? (
                  <EditPostForm
                    postId={post.id}
                    blocks={post.blocks}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    {post.blocks.map((block) =>
                      block.__typename === 'TextBlock' ? (
                        <p key={block.id} className="whitespace-pre-wrap">
                          {block.text}
                        </p>
                      ) : null,
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setEditingId(post.id)}>
                        Edit
                      </Button>
                    </div>
                  </>
                )}
              </article>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
