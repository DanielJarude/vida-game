import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

type InfoDeModulo = { importedIds: readonly string[] } | null;
const BASE = new Map<string, boolean>();
const CAMADA_DE_CIMA = /[\\/]src[\\/]motor[\\/](conteudo[\\/]|ano\.ts|acoes\.ts|fachada\.ts|save\.ts|criacao\.ts)/;
/** Um módulo do motor é da camada de base se tudo o que ele importa (em tempo de execução) é catálogo ou base também. */
function ehBase(id: string, info: (id: string) => InfoDeModulo, visitando = new Set<string>()): boolean {
  const ja = BASE.get(id);
  if (ja !== undefined) return ja;
  if (CAMADA_DE_CIMA.test(id) || visitando.has(id)) return false;
  visitando.add(id);
  const m = info(id);
  const r = !!m && m.importedIds.every(d => /[\\/]src[\\/]motor[\\/]dados[\\/]/.test(d) || (/[\\/]src[\\/]motor[\\/]/.test(d) && ehBase(d, info, visitando)));
  visitando.delete(id);
  BASE.set(id, r);
  return r;
}

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
  // REWORK 2: o pacote único passou de 1,8 MB (o motor é ~70% dele). Agora a
  // primeira tela carrega só o React e a interface inicial; o motor e as telas
  // do jogo vêm sob demanda (`ui/motor.ts`, `ui/util/sobDemanda.tsx`), logo em
  // seguida. O React fica num pacote próprio (muda pouco: o navegador guarda);
  // o motor, em três por camada — sistemas, conteúdo (os textos, com o que os
  // orquestra) e dados (os catálogos) —, sem ciclos, que carregam em paralelo. O limite de aviso não foi
  // aumentado.
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string, { getModuleInfo }) {
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          // O conteúdo (os textos) e o que o orquestra (o ano, as ações, a fachada, a relevância das telas) ficam
          // juntos: são eles que importam o conteúdo, e o conteúdo importa os sistemas — sem ciclo entre pacotes.
          if (/[\\/]src[\\/]motor[\\/](conteudo[\\/]|ano\.ts|acoes\.ts|fachada\.ts|sistemas[\\/]relevancia\.ts)/.test(id)) return 'motor-conteudo';
          // REWORK 3: o que só a camada de cima usa (salvar, nascer, as ações de cuidado, de estilo, de busca, a
          // entrevista, a leitura da independência) vai com ela — o pacote dos sistemas volta a caber no limite, sem ciclo.
          // FIX 3.1: as interações com pessoas, as experiências e a autoria (só as ações e as telas as chamam) também.
          if (/[\\/]src[\\/]motor[\\/](save\.ts|criacao\.ts|sistemas[\\/](entrevista|cuidados|usos|busca|estilo|independencia|pausa|ambiente|empregabilidade|interacoes|experiencias|autoria)\.ts)/.test(id)) return 'motor-conteudo';
          // Pacote pós-playtest: as situações de carreira e o uso da visibilidade num pacote próprio — o conteúdo (e o ano)
          // os chamam; eles só chamam os sistemas. Sem ciclo, e os dois pacotes de cima seguem abaixo do limite.
          // Generalização de carreiras: o legado (as trajetórias da vida) e a retrospectiva, que só a tela e o fim da vida
          // leem; e a família, as iniciativas, o ilícito e a pessoa, que só o ano, as ações e as interações chamam — o pacote
          // dos sistemas volta a caber no limite. Nenhum deles importa a camada de cima: sem ciclo.
          // Carreira de técnico 2.0: o banco (`tecnico`) vai junto — só o ano, as situações, o legado e a tela o chamam.
          // Sucessão (pacote pré-América do Sul): a partilha e a troca de protagonista leem o legado e a retrospectiva; só a
          // fachada (a tela do legado) e a família a chamam — vai com elas, sem ciclo.
          if (/[\\/]src[\\/]motor[\\/]sistemas[\\/](situacoes|tecnico|visibilidade|legado|retrospectiva|familia|iniciativas|ilicito|pessoa|sucessao)\.ts/.test(id)) return 'motor-carreira';
          if (/[\\/]src[\\/]motor[\\/]dados[\\/]/.test(id)) return 'motor-dados';
          // Pacote pré-América do Sul: a CAMADA DE BASE — os sistemas-folha que só importam os catálogos e uns aos outros
          // (núcleo, texto, tempo, mercado, origem, rede, notoriedade, economia...) — vai com os catálogos, embaixo de
          // tudo. É a mesma regra de camadas, só que medida no grafo real (um módulo-folha novo cai aqui sozinho, e um
          // que passe a importar um sistema de cima sai daqui sozinho): nenhum ciclo entre pacotes, e o pacote dos
          // sistemas volta a ter folga sem aumentar o limite.
          if (/[\\/]src[\\/]motor[\\/]/.test(id) && ehBase(id, getModuleInfo)) return 'motor-dados';
          if (/[\\/]src[\\/]motor[\\/]/.test(id)) return 'motor';
          return undefined;
        }
      }
    }
  },
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
    // Os testes que vivem muitas vidas (média de várias sementes) passam de 5 s em máquina carregada.
    testTimeout: 20000,
    // O `precarregar()` dos testes de interface importa todas as telas: passa de 10 s em disco lento (WSL em /mnt/c).
    hookTimeout: 60000,
    // Cópias de trabalho paralelas (worktrees de agentes) não são a suíte deste checkout.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
