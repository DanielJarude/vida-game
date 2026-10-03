/**
 * Gera os ícones PNG do PWA a partir da marca "V" (a mesma do favicon em
 * index.html: quadrado escuro #121010, V âmbar #d9a05b).
 *
 * Sem PIL nem sharp no projeto: o SVG é desenhado num Chromium de verdade
 * (Playwright, que já é dependência de desenvolvimento) e fotografado.
 * O V é um polígono, não texto — o favicon usa `system-ui` em negrito, que
 * muda de máquina para máquina; um ícone instalado tem de ser sempre igual.
 *
 * Saída (versionada em public/icones/):
 *   icone-192.png, icone-512.png  — "any": cantos arredondados, fundo transparente fora deles
 *   icone-maskable-512.png        — "maskable": fundo até a borda, V dentro da zona segura (círculo de 80%)
 *   apple-touch-icon.png (180)    — o iOS arredonda sozinho e não aceita transparência
 *
 * Uso:  node scripts/pwa/gerarIcones.mjs
 */

import { mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const destino = join(raiz, 'public', 'icones');
mkdirSync(destino, { recursive: true });

const FUNDO = '#121010';
const MARCA = '#d9a05b';
// O V em negrito, na caixa 100×100 do favicon (mesma altura e largura aproximadas do glifo de 52px).
const V = '31,31 41.6,31 50,58.5 58.4,31 69,31 55.6,69 44.4,69';

/** `escala` encolhe o V em torno do centro (o maskable precisa de margem); `cantos` é o raio do quadrado. */
function svg({ cantos, escala }) {
  const t = 50 - 50 * escala;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <rect width="100" height="100" rx="${cantos}" fill="${FUNDO}"/>
    <polygon points="${V}" fill="${MARCA}" transform="translate(${t} ${t}) scale(${escala})"/>
  </svg>`;
}

const ICONES = [
  { nome: 'icone-192.png', lado: 192, cantos: 22, escala: 1, transparente: true },
  { nome: 'icone-512.png', lado: 512, cantos: 22, escala: 1, transparente: true },
  // Zona segura do maskable: o V (38 de altura) a 0,8× cabe folgado no círculo de raio 40.
  { nome: 'icone-maskable-512.png', lado: 512, cantos: 0, escala: 0.8, transparente: false },
  { nome: 'apple-touch-icon.png', lado: 180, cantos: 0, escala: 0.9, transparente: false }
];

const navegador = await chromium.launch();
for (const i of ICONES) {
  const p = await navegador.newPage({ viewport: { width: i.lado, height: i.lado }, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
    <div style="width:${i.lado}px;height:${i.lado}px">${svg(i)}</div></body></html>`);
  await p.screenshot({ path: join(destino, i.nome), omitBackground: i.transparente, clip: { x: 0, y: 0, width: i.lado, height: i.lado } });
  await p.close();
  console.log(`public/icones/${i.nome} (${i.lado}×${i.lado})`);
}
await navegador.close();
