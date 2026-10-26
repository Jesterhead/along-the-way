import { graphql } from '../../gql';

export const JournalPageQuery = graphql(`
  query JournalPage($id: ID!) {
    journal(id: $id) {
      id
      title
      posts {
        id
        title
        createdAt
        blocks {
          __typename
          id
          position
          ... on TextBlock {
            text
          }
        }
      }
    }
  }
`);
