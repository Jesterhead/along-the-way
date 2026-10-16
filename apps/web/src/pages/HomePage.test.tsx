import { MockedProvider } from '@apollo/client/testing/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';
import { HomePageQuery } from './HomePage.query';

describe('HomePage', () => {
  it("shows the user's journals", async () => {
    const mocks = [
      {
        request: { query: HomePageQuery },
        result: {
          data: {
            me: {
              __typename: 'User' as const,
              id: 'user-1',
              displayName: 'Local User',
              journals: [{ __typename: 'Journal' as const, id: 'journal-1', title: 'My Journal' }],
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <HomePage />
      </MockedProvider>,
    );

    expect(await screen.findByText('Welcome, Local User.')).toBeInTheDocument();
    expect(screen.getByText('My Journal')).toBeInTheDocument();
  });

  it('shows an error when the API fails', async () => {
    const mocks = [{ request: { query: HomePageQuery }, error: new Error('Network down') }];

    render(
      <MockedProvider mocks={mocks}>
        <HomePage />
      </MockedProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
  });
});
