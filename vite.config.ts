import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 相対パスで静的ホスティング可能に
  // @ts-expect-error vitest config
  test: {
    globals: true,
    environment: 'node',
  },
});
