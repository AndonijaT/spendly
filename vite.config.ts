// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: '127.0.0.1', // 👈 force bind to 127.0.0.1 instead of localhost
    port: 5173
  },
  plugins: [react()]
});
