import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Caminhos RELATIVOS nos assets gerados.
  //
  // O padrão do Vite ('/') emite <script src="/assets/index-xxxx.js">, que só
  // resolve se o jogo estiver na raiz do domínio. O itch.io serve cada projeto
  // HTML5 de um subdiretório com hash (algo como
  // https://html-classic.itch.zone/html/<id>/index.html) dentro de um iframe,
  // então um caminho absoluto aponta para a raiz do CDN e o jogo abre em tela
  // branca — o HTML carrega, o JS 404.
  //
  // './' torna o pacote independente de onde ele é servido: itch.io, um
  // subdiretório qualquer, ou até `file://` para conferência local. Não afeta
  // `npm run dev`, que continua servindo da raiz.
  base: './',
  plugins: [react()],
  // O pacote é react-dom + o conteúdo do jogo (~600 kB, ~185 kB gzip). Um
  // único arquivo é o que o itch.io serve melhor; não vale fatiar.
  build: { chunkSizeWarningLimit: 800 },
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
