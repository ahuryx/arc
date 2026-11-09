import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// @ts-expect-error process is a nodejs global
const configuredHost = process.env.TAURI_DEV_HOST;
const host = configuredHost?.trim() ? configuredHost : undefined;

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    port: 3010,
    strictPort: true,
    // Bind IPv4 explicitly — on Windows, `false`/`localhost` often listens on
    // [::1] only, so Tauri's http://localhost:3010 check never connects.
    host: host ?? '127.0.0.1',
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 3011,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
}));
