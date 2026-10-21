import { graphql } from '../gql';

export const CreatePostMutation = graphql(`
  mutation CreatePost($journalId: ID!, $input: PostInput!) {
    createPost(journalId: $journalId, input: $input) {
      id
    }
  }
`);

export const UpdatePostMutation = graphql(`
  mutation UpdatePost($id: ID!, $input: PostInput!) {
    updatePost(id: $id, input: $input) {
      id
      updatedAt
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
`);
