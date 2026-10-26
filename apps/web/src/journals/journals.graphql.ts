import { graphql } from '../gql';

export const UpdateJournalMutation = graphql(`
  mutation UpdateJournal($id: ID!, $input: JournalInput!) {
    updateJournal(id: $id, input: $input) {
      id
      title
    }
  }
`);
