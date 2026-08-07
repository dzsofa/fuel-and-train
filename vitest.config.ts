import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    unstubEnvs: true,
    env: {
      ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001'
    },
    exclude: ['**/node_modules/**', 'tests/integration/**']
  }
});
