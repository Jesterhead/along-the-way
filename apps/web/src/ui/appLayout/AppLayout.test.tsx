import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppLayout } from './AppLayout';

// Stand-in pages keep these tests about the layout, not about data loading.
function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<h1>Home page</h1>} />
          <Route path="/journals/:id" element={<h1>Journal page</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  it('shows the logo in the header as a link home', () => {
    renderAt('/journals/j1');

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'along the way' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('renders the current page inside the single main landmark', () => {
    renderAt('/journals/j1');

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Journal page' })).toBeInTheDocument();
  });

  it('navigates home when the logo is clicked', () => {
    renderAt('/journals/j1');

    fireEvent.click(screen.getByRole('link', { name: 'along the way' }));

    expect(screen.getByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Journal page' })).not.toBeInTheDocument();
  });
});
