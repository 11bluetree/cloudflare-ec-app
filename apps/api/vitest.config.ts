import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    env: loadEnv('test', process.cwd(), ''),
  },
}));
