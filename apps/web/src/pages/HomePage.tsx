import { useQuery } from '@apollo/client/react';
import { HomePageQuery } from './HomePage.query';

export function HomePage() {
  const { data, loading, error } = useQuery(HomePageQuery);

  if (loading) return <p>Loading…</p>;
  if (error) return <p role="alert">Couldn't reach the API: {error.message}</p>;
  if (!data?.me) return <p>No user found. Has the database been seeded?</p>;

  return (
    <main>
      <h1>along the way</h1>
      <p>Welcome, {data.me.displayName}.</p>
      <h2>Your journals</h2>
      <ul>
        {data.me.journals.map((journal) => (
          <li key={journal.id}>{journal.title}</li>
        ))}
      </ul>
    </main>
  );
}
