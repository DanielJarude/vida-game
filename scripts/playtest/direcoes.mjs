// REWORK 6 — comparação das três direções de arte NAS TELAS DE VERDADE. As direções diferem só na camada de paleta
// (`--p-*` de tokens.css); este script injeta cada paleta por cima da que está publicada e fotografa Linha da Vida,
// Pessoas e Trabalho em 1440 e 390 px. Também mede o contraste dos pares de texto de cada direção.
//   SP=<pasta com os saves de gerarRework6.ts> URL=http://localhost:5173/ node scripts/playtest/direcoes.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r6';
const URL = process.env.URL ?? 'http://localhost:4173/';
const OUT = `${SP}/direcoes`;
mkdirSync(OUT, { recursive: true });

export const DIRECOES = {
  // A — Atlas: azul-petróleo, papel claro, cobre e verde mineral.
  atlas: {
    papel: '#f3f1ea', 'papel-alto': '#fbfaf6', 'papel-topo': '#ffffff', tinta: '#13303a', 'tinta-2': '#38535c', 'tinta-3': '#536a72',
    moldura: '#0f3a46', 'moldura-2': '#18505e', 'moldura-tinta': '#f3f1ea', 'moldura-tinta-2': '#a8c3c9',
    acao: '#a85a24', 'acao-forte': '#8f4b1c', 'acao-sobre': '#ffffff', bom: '#2c7a64', ruim: '#a3343a', alerta: '#8a6212', info: '#2f6a80', neutro: '#5f6b70',
    linha: '#8f4b1c', voce: '#6a4f8a', pessoas: '#a03f52', formacao: '#2a6488', trabalho: '#7e6115', tempo: '#23725f', vida: '#2c7a64', cidade: '#4b6672', saude: '#357340', esquema: 'light'
  },
  // B — Memória: grafite, cinza-azulado, marfim, coral envelhecido e oliva (a de tokens.css).
  memoria: null,
  // C — Horizonte: petróleo profundo, branco quente, dourado e azul suave.
  horizonte: {
    papel: '#0f2530', 'papel-alto': '#16303d', 'papel-topo': '#1c3a49', tinta: '#f5efe4', 'tinta-2': '#c9d4d9', 'tinta-3': '#9fb1ba',
    moldura: '#0a1a22', 'moldura-2': '#14303c', 'moldura-tinta': '#f5efe4', 'moldura-tinta-2': '#8fa7b2',
    acao: '#e2b04a', 'acao-forte': '#e8bf62', 'acao-sobre': '#1a1406', bom: '#8fcf9a', ruim: '#f08a8a', alerta: '#f0b75e', info: '#93bde3', neutro: '#8b979d',
    linha: '#e8bf62', voce: '#d3a6e8', pessoas: '#f29aa8', formacao: '#93bde3', trabalho: '#e9c86a', tempo: '#7fd3c1', vida: '#a9d47f', cidade: '#b7c6cf', saude: '#98d68b', esquema: 'dark',
    extra: '--sombra-cor: rgba(0,0,0,.55); --shadow-lg: 0 24px 60px -24px rgba(0,0,0,.8);'
  }
};
const css = d => (d ? `:root{${Object.entries(d).filter(([k]) => k !== 'extra').map(([k, v]) => `--p-${k}:${v};`).join('')}${d.extra ?? ''}}` : '');

// Contraste WCAG dos pares de texto principais.
const lum = h => { const c = [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255).map(x => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const con = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
const MEMORIA = Object.fromEntries([...readFileSync(new globalThis.URL('../../src/ui/tokens.css', import.meta.url), 'utf8').matchAll(/--p-([a-z0-9-]+):\s*(#[0-9a-f]{6}|light|dark);/g)].map(m => [m[1], m[2]]));
const contrastes = {};
for (const [nome, d0] of Object.entries(DIRECOES)) {
  const d = d0 ?? MEMORIA;
  const pares = { 'tinta/papel': [d.tinta, d.papel], 'tinta-2/papel': [d['tinta-2'], d.papel], 'tinta-3/papel': [d['tinta-3'], d.papel], 'tinta-3/papel-alto': [d['tinta-3'], d['papel-alto']], 'acao-sobre/acao': [d['acao-sobre'], d.acao], 'acao-forte/papel': [d['acao-forte'], d.papel], 'moldura-tinta-2/moldura': [d['moldura-tinta-2'], d.moldura], 'bom/papel': [d.bom, d.papel], 'ruim/papel': [d.ruim, d.papel] };
  for (const a of ['linha', 'voce', 'pessoas', 'formacao', 'trabalho', 'tempo', 'vida', 'cidade', 'saude']) pares[`${a}/papel`] = [d[a], d.papel];
  contrastes[nome] = Object.fromEntries(Object.entries(pares).map(([k, [a, b]]) => [k, con(a, b)]));
}

const b = await chromium.launch();
const cenas = [['linha', 'vivida', null], ['pessoas', 'vivida', 'Pessoas'], ['trabalho', 'atleta', 'Trabalho']];
for (const [dir, d] of Object.entries(DIRECOES)) {
  for (const [nome, save, area] of cenas) {
    for (const w of [1440, 390]) {
      const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 800 : 900 } });
      const p = await ctx.newPage();
      await p.goto(URL);
      await p.evaluate(s => { localStorage.clear(); localStorage.setItem('VIDA_GAME_SAVE_V1', s); }, readFileSync(`${SP}/saves/vida-r6-${save}.json`, 'utf8'));
      await p.goto(URL);
      if (d) await p.addStyleTag({ content: css(d) });
      await p.getByRole('button', { name: /Continuar a vida/ }).click();
      await p.waitForTimeout(400);
      if (area) {
        let bt = p.getByRole('button', { name: area, exact: true }).locator('visible=true').first();
        if (!(await bt.count())) bt = p.locator('.barra__item', { hasText: area }).first();
        await bt.click(); await p.waitForTimeout(300);
      }
      await p.screenshot({ path: `${OUT}/${dir}-${nome}-${w}.png` });
      await ctx.close();
    }
  }
}
await b.close();
writeFileSync(`${OUT}/contrastes.json`, JSON.stringify(contrastes, null, 2));
console.log(JSON.stringify(contrastes, null, 1));
