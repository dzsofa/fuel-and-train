import { defineConfig } from 'vitest/config';
import { Model } from './src/model/models';

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    unstubEnvs: true,
    env: {
      ANTHROPIC_MODEL: Model.Haiku
    },
    exclude: ['**/node_modules/**', 'tests/integration/**']
  }
});
