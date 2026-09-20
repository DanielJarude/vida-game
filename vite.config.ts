import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  test: {
    // Testes de motor rodam em Node; os testes de interface do B4 declaram
    // `@vitest-environment jsdom` no topo do arquivo.
    environment: 'node',
    globals: false,
    css: false,
  },
});
