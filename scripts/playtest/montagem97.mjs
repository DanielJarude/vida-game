// REWORK 9.7 — as provas do relatório: antes (a base 435f284, os mesmos saves: elementos97.mjs com URL do build da base,
// SP=<pasta-antes>) × depois, e as quatro paletas (rework97.mjs), em JPEG, para docs/rework97/.
//   SP=<pasta com depois/ e elementos97/> ANTES=<pasta com elementos97/ da base> DEST=docs/rework97 node scripts/playtest/montagem97.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r97';
const ANTES = process.env.ANTES ?? `${SP}-antes`;
const DEST = process.env.DEST ?? 'docs/rework97';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const PARES = [
  ['01-boletim-antes-depois', 'EDU-04 · O boletim aos 16, com o mesmo save — antes (o domínio de 0 a 100 escrito à mão na coluna da nota) × depois (a nota do ano, de 0 a 10, e o conhecimento, impresso)', [['antes · 435f284', 'ANTES/elementos97/boletim-16-claro-1440.png'], ['depois', 'elementos97/boletim-16-claro-1440.png']], 640],
  ['02-boletim-celular', 'EDU-04 · O boletim no celular (360 px) — antes × depois, e a escala de Portugal (0 a 20)', [['antes', 'ANTES/elementos97/boletim-16-escuro-360.png'], ['depois', 'elementos97/boletim-16-escuro-360.png'], ['Portugal · 0 a 20', 'elementos97/boletim-portugal-claro-360.png']], 360],
  ['03-futebol-adulto', 'FUT-02 · Caminhos aos 23, jogando bola a sério no amador — antes ("a janela das bases já passou") × depois (a porta do time adulto)', [['antes', 'ANTES/elementos97/futebol-adulto-claro-1440.png'], ['depois', 'elementos97/futebol-adulto-claro-1440.png']], 640],
  ['04-semana-crianca', 'ROT-04 · A semana de uma criança de 9 anos com quatro atividades (360 px) — antes × depois (aulas de uma hora)', [['antes', 'ANTES/elementos97/semana-crianca4-claro-360.png'], ['depois', 'elementos97/semana-crianca4-claro-360.png']], 360],
  ['05-seguidores', 'SOC-01 · O salto de seguidores com causa: a linha da vida diz o acontecimento', [['História · 1440', 'depois/historia-famoso-claro-1440.png'], ['Celular · 390', 'depois/celular-famoso-escuro-390.png']], 620],
  ['06-paletas-boletim', 'As quatro paletas — o boletim novo (1440 px)', [['Memória Clara', 'depois/boletim-16-claro-1440.png'], ['Horizonte Claro', 'depois/boletim-16-horizonte-1440.png'], ['Memória Escura', 'depois/boletim-16-escuro-1440.png'], ['Atlântico Noturno', 'depois/boletim-16-atlantico-1440.png']], 520],
  ['07-tamanhos', '820 px, 390 × 560 e 360 px', [['820 · boletim', 'depois/boletim-16-horizonte-820.png'], ['390×560 · futebol', 'depois/futebol-adulto-atlantico-390b.png'], ['360 · semana', 'depois/semana-crianca4-escuro-360.png']], 400]
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
for (const [arq, titulo, quadros, larg] of PARES) {
  const itens = quadros.map(([leg, cam]) => ({ leg, src: img(cam.startsWith('ANTES/') ? `${ANTES}/${cam.slice(6)}` : `${SP}/${cam}`) })).filter(x => x.src);
  if (!itens.length) { console.log('sem imagens:', arq); continue; }
  const largura = itens.length * (larg + 16) + 24;
  await p.setViewportSize({ width: largura, height: 200 });
  await p.setContent(`<html><body style="margin:0;padding:12px;background:#d9d4ca;font-family:system-ui,sans-serif">
    <h1 style="font-size:18px;margin:0 0 10px;color:#1d2126">${titulo}</h1>
    <div style="display:flex;gap:16px;align-items:flex-start">${itens.map(x => `<figure style="margin:0;width:${larg}px"><figcaption style="font-size:13px;color:#434a53;margin-bottom:4px">${x.leg}</figcaption><img src="${x.src}" style="width:${larg}px;display:block;border:1px solid #a9a39a"></figure>`).join('')}</div></body></html>`);
  await p.waitForTimeout(150);
  const alt = await p.evaluate(() => document.body.scrollHeight);
  await p.setViewportSize({ width: largura, height: Math.min(alt, 2400) });
  await p.screenshot({ path: `${DEST}/${arq}.jpg`, type: 'jpeg', quality: 72, fullPage: true });
  console.log('ok', arq);
}
await b.close();
