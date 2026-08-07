import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    unstubEnvs: true,
    env: {
      ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001'
    },
    exclude: ['**/node_modules/**', 'tests/integration/**']
  }
});
