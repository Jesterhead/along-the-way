import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/schema.graphql',
  generates: {
    'src/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useTypeImports: true,
        emitLegacyCommonJSImports: false,
        contextType: '../context.js#Context',
        // Resolvers receive Prisma rows, not GraphQL shapes; field resolvers fill the gaps.
        mappers: {
          User: './prisma/models.js#UserModel',
          Journal: './prisma/models.js#JournalModel',
          Post: './prisma/models.js#PostModel',
          Block: './prisma/models.js#BlockModel',
          TextBlock: './prisma/models.js#BlockModel',
        },
        scalars: { DateTime: 'Date' },
      },
    },
  },
};

export default config;
