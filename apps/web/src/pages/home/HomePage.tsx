import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';

import { Card } from '../../ui/card/Card';
import { HomePageQuery } from './HomePage.query';

export function HomePage() {
  const { data, loading, error } = useQuery(HomePageQuery);

  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert">Couldn't reach the API: {error.message}</p>;
  if (!data?.me) return <p>No user found. Has the database been seeded?</p>;

  return (
    <div>
      <p>Welcome, {data.me.displayName}.</p>
      <h1>Your journals</h1>
      <Card>
        <ul>
          {data.me.journals.map((journal) => (
            <li key={journal.id}>
              <Link to={`/journals/${journal.id}`}>{journal.title}</Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
