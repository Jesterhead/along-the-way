import { Link, Outlet } from 'react-router';

export function AppLayout() {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link to="/" className="font-display text-4xl text-link">
            along the way
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </>
  );
}
