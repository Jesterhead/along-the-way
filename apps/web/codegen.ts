import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Read the schema file directly so codegen works without a running API.
  schema: '../api/src/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**'],
  ignoreNoDocuments: true,
  generates: {
    'src/gql/': {
      preset: 'client',
      config: { useTypeImports: true },
    },
  },
};

export default config;
