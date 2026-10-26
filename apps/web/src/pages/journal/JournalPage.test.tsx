import { MockedProvider } from '@apollo/client/testing/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { UpdateJournalMutation } from '../../journals/journals.graphql';
import { CreatePostMutation, UpdatePostMutation } from '../../posts/posts.graphql';
import { JournalPage } from './JournalPage';
import { JournalPageQuery } from './JournalPage.query';

type Mocks = NonNullable<ComponentProps<typeof MockedProvider>['mocks']>;

// Apollo's cache needs __typename on every object to store and merge results correctly.
function textBlock(id: string, position: number, text: string) {
  return { __typename: 'TextBlock' as const, id, position, text };
}

function post(id: string, blocks: ReturnType<typeof textBlock>[], title = 'Post title') {
  return { __typename: 'Post' as const, id, title, createdAt: '2026-10-19T18:00:00.000Z', blocks };
}

function journalQuery(posts: ReturnType<typeof post>[]) {
  return {
    request: { query: JournalPageQuery, variables: { id: 'j1' } },
    result: {
      data: { journal: { __typename: 'Journal' as const, id: 'j1', title: 'Travel', posts } },
    },
  };
}

function updatePostMock(id: string, texts: string[], title = 'Post title') {
  return {
    request: {
      query: UpdatePostMutation,
      variables: {
        id,
        input: { title, blocks: texts.map((text) => ({ type: 'TEXT' as const, text })) },
      },
    },
    result: {
      data: {
        updatePost: {
          __typename: 'Post' as const,
          id,
          title,
          updatedAt: '2026-10-20T10:00:00.000Z',
          blocks: texts.map((text, i) => textBlock(`${id}-new-${i}`, i, text)),
        },
      },
    },
  };
}

function updateJournalMock(title: string) {
  return {
    request: { query: UpdateJournalMutation, variables: { id: 'j1', input: { title } } },
    result: { data: { updateJournal: { __typename: 'Journal' as const, id: 'j1', title } } },
  };
}

function renderPage(mocks: Mocks) {
  render(
    <MockedProvider mocks={mocks}>
      <MemoryRouter initialEntries={['/journals/j1']}>
        <Routes>
          <Route path="/journals/:id" element={<JournalPage />} />
        </Routes>
      </MemoryRouter>
    </MockedProvider>,
  );
}

const onePost = [post('p1', [textBlock('b1', 0, 'Before')])];

describe('JournalPage', () => {
  describe('viewing', () => {
    it('shows the title and every block of each post', async () => {
      renderPage([
        journalQuery([post('p1', [textBlock('b1', 0, 'First'), textBlock('b2', 1, 'Second')])]),
      ]);

      expect(await screen.findByRole('heading', { name: 'Travel' })).toBeInTheDocument();
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('keeps line breaks in post text', async () => {
      renderPage([journalQuery([post('p1', [textBlock('b1', 0, 'Line one\nLine two')])])]);

      const paragraph = await screen.findByText(/Line one/);
      expect(paragraph).toHaveClass('whitespace-pre-wrap');
      expect(paragraph.textContent).toBe('Line one\nLine two');
    });

    it("shows each post's title as a heading", async () => {
      renderPage([journalQuery([post('p1', [textBlock('b1', 0, 'Body')], 'Morning hike')])]);

      expect(await screen.findByRole('heading', { name: 'Morning hike' })).toBeInTheDocument();
    });

    it('shows an empty state when there are no posts', async () => {
      renderPage([journalQuery([])]);

      expect(await screen.findByText('No posts yet.')).toBeInTheDocument();
    });

    it('shows not found when the journal is missing or not yours', async () => {
      renderPage([
        {
          request: { query: JournalPageQuery, variables: { id: 'j1' } },
          result: { data: { journal: null } },
        },
      ]);

      expect(await screen.findByText('Journal not found.')).toBeInTheDocument();
    });

    it('shows an error when the API fails', async () => {
      renderPage([
        {
          request: { query: JournalPageQuery, variables: { id: 'j1' } },
          error: new Error('Network down'),
        },
      ]);

      expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
    });
  });

  describe('creating a post', () => {
    it('refetches the journal so the new post appears', async () => {
      renderPage([
        journalQuery([]),
        {
          request: {
            query: CreatePostMutation,
            variables: {
              journalId: 'j1',
              input: { title: 'Greeting', blocks: [{ type: 'TEXT', text: 'Hello' }] },
            },
          },
          result: { data: { createPost: { __typename: 'Post', id: 'p2' } } },
        },
        journalQuery([post('p2', [textBlock('b1', 0, 'Hello')], 'Greeting')]),
      ]);

      fireEvent.change(await screen.findByRole('textbox', { name: 'New post title' }), {
        target: { value: 'Greeting' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'New post' }), {
        target: { value: 'Hello' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Post' }));

      expect(await screen.findByRole('heading', { name: 'Greeting' })).toBeInTheDocument();
      expect(screen.getByText('Hello', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'New post title' })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: 'New post' })).toHaveValue('');
    });

    it('keeps the text and shows the error when saving fails', async () => {
      renderPage([
        journalQuery([]),
        {
          request: {
            query: CreatePostMutation,
            variables: {
              journalId: 'j1',
              input: { title: 'Greeting', blocks: [{ type: 'TEXT', text: 'Hello' }] },
            },
          },
          error: new Error('Server unavailable'),
        },
      ]);

      fireEvent.change(await screen.findByRole('textbox', { name: 'New post title' }), {
        target: { value: 'Greeting' },
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'New post' }), {
        target: { value: 'Hello' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Post' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
      expect(screen.getByRole('textbox', { name: 'New post title' })).toHaveValue('Greeting');
      expect(screen.getByRole('textbox', { name: 'New post' })).toHaveValue('Hello');
    });

    it('disables Post until both a title and text are filled in', async () => {
      renderPage([journalQuery([])]);

      const post = await screen.findByRole('button', { name: 'Post' });
      fireEvent.change(screen.getByRole('textbox', { name: 'New post' }), {
        target: { value: 'Hello' },
      });
      expect(post).toBeDisabled();

      fireEvent.change(screen.getByRole('textbox', { name: 'New post title' }), {
        target: { value: '   ' },
      });
      expect(post).toBeDisabled();

      fireEvent.change(screen.getByRole('textbox', { name: 'New post title' }), {
        target: { value: 'Greeting' },
      });
      expect(post).toBeEnabled();
    });
  });

  describe('editing a post', () => {
    it('saves and updates the post in place without refetching', async () => {
      // Only one journal query is mocked: a refetch would have no response and fail.
      renderPage([journalQuery(onePost), updatePostMock('p1', ['After'])]);

      fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
      const textbox = screen.getByRole('textbox', { name: 'Edit block 1 of 1' });
      expect(textbox).toHaveValue('Before');
      fireEvent.change(textbox, { target: { value: 'After' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('After', { selector: 'p' })).toBeInTheDocument();
      expect(screen.queryByText('Before')).not.toBeInTheDocument();
      expect(screen.queryAllByRole('textbox', { name: /Edit block/ })).toHaveLength(0);
    });

    it('sends every block back so editing one block keeps the others', async () => {
      renderPage([
        journalQuery([
          post('p1', [
            textBlock('b1', 0, 'First'),
            textBlock('b2', 1, 'Second'),
            textBlock('b3', 2, 'Third'),
          ]),
        ]),
        updatePostMock('p1', ['First', 'Second, edited', 'Third']),
      ]);

      fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
      expect(screen.getByRole('textbox', { name: 'Edit block 1 of 3' })).toHaveValue('First');
      expect(screen.getByRole('textbox', { name: 'Edit block 3 of 3' })).toHaveValue('Third');
      fireEvent.change(screen.getByRole('textbox', { name: 'Edit block 2 of 3' }), {
        target: { value: 'Second, edited' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('Second, edited', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('First', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Third', { selector: 'p' })).toBeInTheDocument();
    });

    it('shows the current title and saves a renamed post in place', async () => {
      renderPage([
        journalQuery([post('p1', [textBlock('b1', 0, 'Before')], 'Old title')]),
        updatePostMock('p1', ['Before'], 'New title'),
      ]);

      fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
      const titleBox = screen.getByRole('textbox', { name: 'Edit post title' });
      expect(titleBox).toHaveValue('Old title');
      fireEvent.change(titleBox, { target: { value: 'New title' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('heading', { name: 'New title' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Old title' })).not.toBeInTheDocument();
    });

    it('disables Save while the title is blank', async () => {
      renderPage([journalQuery(onePost)]);

      fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Edit post title' }), {
        target: { value: '  ' },
      });

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('disables Save while any block is blank', async () => {
      renderPage([journalQuery(onePost)]);

      fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Edit block 1 of 1' }), {
        target: { value: '   ' },
      });

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('cancel discards the draft without saving it', async () => {
      // A ready mock for saving "Draft": if Cancel ever submitted the form, this would be called.
      const saveDraft = updatePostMock('p1', ['Draft']);
      const saveResult = vi.fn(() => saveDraft.result);
      renderPage([journalQuery(onePost), { request: saveDraft.request, result: saveResult }]);

      fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Edit block 1 of 1' }), {
        target: { value: 'Draft' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(saveResult).not.toHaveBeenCalled();
      expect(screen.getByText('Before', { selector: 'p' })).toBeInTheDocument();
      expect(screen.queryByText('Draft')).not.toBeInTheDocument();
    });

    it('stays in edit mode and keeps the draft when saving fails', async () => {
      renderPage([
        journalQuery(onePost),
        { ...updatePostMock('p1', ['After']), result: undefined, error: new Error('Timed out') },
      ]);

      fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Edit block 1 of 1' }), {
        target: { value: 'After' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Timed out');
      expect(screen.getByRole('textbox', { name: 'Edit block 1 of 1' })).toHaveValue('After');
    });
  });

  describe('renaming the journal', () => {
    it('shows the current title and updates the heading in place on save', async () => {
      // Only one journal query is mocked: a refetch would have no response and fail.
      renderPage([journalQuery([]), updateJournalMock('Summer trip')]);

      fireEvent.click(await screen.findByRole('button', { name: 'Rename' }));
      const titleBox = screen.getByRole('textbox', { name: 'Edit journal title' });
      expect(titleBox).toHaveValue('Travel');
      fireEvent.change(titleBox, { target: { value: 'Summer trip' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('heading', { name: 'Summer trip' })).toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: 'Edit journal title' })).not.toBeInTheDocument();
    });

    it('cancel keeps the old title without saving', async () => {
      const rename = updateJournalMock('Draft');
      const renameResult = vi.fn(() => rename.result);
      renderPage([journalQuery([]), { request: rename.request, result: renameResult }]);

      fireEvent.click(await screen.findByRole('button', { name: 'Rename' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Edit journal title' }), {
        target: { value: 'Draft' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(renameResult).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Travel' })).toBeInTheDocument();
    });

    it('disables Save for a blank or unchanged title', async () => {
      renderPage([journalQuery([])]);

      fireEvent.click(await screen.findByRole('button', { name: 'Rename' }));
      const titleBox = screen.getByRole('textbox', { name: 'Edit journal title' });
      const save = screen.getByRole('button', { name: 'Save' });
      expect(save).toBeDisabled();

      fireEvent.change(titleBox, { target: { value: '   ' } });
      expect(save).toBeDisabled();

      fireEvent.change(titleBox, { target: { value: '  Travel  ' } });
      expect(save).toBeDisabled();

      fireEvent.change(titleBox, { target: { value: 'Summer trip' } });
      expect(save).toBeEnabled();
    });

    it('stays in rename mode and keeps the draft when saving fails', async () => {
      renderPage([
        journalQuery([]),
        { ...updateJournalMock('Summer trip'), result: undefined, error: new Error('Offline') },
      ]);

      fireEvent.click(await screen.findByRole('button', { name: 'Rename' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Edit journal title' }), {
        target: { value: 'Summer trip' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
      expect(screen.getByRole('textbox', { name: 'Edit journal title' })).toHaveValue(
        'Summer trip',
      );
    });
  });
});
