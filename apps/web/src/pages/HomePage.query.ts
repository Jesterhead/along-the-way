import { graphql } from '../gql';

export const HomePageQuery = graphql(`
  query HomePage {
    me {
      id
      displayName
      journals {
        id
        title
      }
    }
  }
`);
