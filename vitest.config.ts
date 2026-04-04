import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      '@tauri-apps/api/event': path.resolve(__dirname, 'src/__mocks__/tauri-event.ts'),
      '@tauri-apps/api/core': path.resolve(__dirname, 'src/__mocks__/tauri-core.ts'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
