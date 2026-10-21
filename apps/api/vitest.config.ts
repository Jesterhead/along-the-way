import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    // Integration tests share one database and truncate it between tests, so test
    // files must not run at the same time.
    fileParallelism: false,
  },
});
