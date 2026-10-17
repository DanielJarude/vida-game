// REWORK 7 — as provas do relatório: montagens antes × depois (e claro × escuro, desktop × celular) das capturas
// REAIS do jogo (`rework7.mjs`), em JPEG, para docs/rework7/. Sem PIL: a montagem é uma página do próprio Chromium.
//   SP=<pasta com antes7/ e depois/> DEST=docs/rework7 node scripts/playtest/montagem7.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r7';
const DEST = process.env.DEST ?? 'docs/rework7';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const PARES = [
  ['01-tempo-livre', 'Tempo livre — antes × depois (jovem, 22 anos, 1440 px)', [['antes', 'antes7/tempo-jovem-claro-1440.png'], ['depois', 'depois/tempo-jovem-claro-1440.png']], 720],
  ['02-ficha-da-pratica', 'A ficha da prática (nova) — claro e escuro', [['claro · 1440', 'depois/pratica-jovem-claro-1440.png'], ['escuro · 1440', 'depois/pratica-adolescente-escuro-1440.png']], 720],
  ['03-pratica-celular', 'Práticas no celular — 390 e 360 px, claro e escuro', [['390 claro', 'depois/tempo-varias-claro-390.png'], ['390 escuro', 'depois/pratica-adolescente-escuro-390.png'], ['360 claro', 'depois/hobbies-crianca-claro-360.png'], ['390×560', 'depois/tempo-jovem-claro-390b.png']], 390],
  ['04-compras', 'Compras — antes × depois (adulto empregado, 1440 px)', [['antes', 'antes7/compras-adulto-claro-1440.png'], ['depois', 'depois/compras-adulto-claro-1440.png']], 720],
  ['05-compras-crianca', 'Compras para uma criança — antes × depois', [['antes', 'antes7/compras-crianca-claro-1440.png'], ['depois', 'depois/compras-crianca-claro-1440.png']], 720],
  ['06-compras-celular', 'Compras no celular e no escuro', [['390 claro', 'depois/compras-adulto-claro-390.png'], ['390 escuro', 'depois/compras-rica-escuro-390.png'], ['820 claro', 'depois/compras-rica-claro-820.png']], 420],
  ['07-ficha-pessoa', 'A ficha de uma pessoa — antes × depois', [['antes', 'antes7/ficha-pessoa-claro-1440.png'], ['depois', 'depois/ficha-pessoa-claro-1440.png']], 720],
  ['08-ficha-pessoa-celular', 'A ficha de uma pessoa no celular', [['390 claro', 'depois/ficha-pessoa-claro-390.png'], ['390 escuro', 'depois/ficha-pessoa-escuro-390.png'], ['360 claro', 'depois/ficha-pessoa-claro-360.png']], 390],
  ['09-voce', 'Você — antes × depois (jovem)', [['antes', 'antes7/voce-jovem-claro-1440.png'], ['depois', 'depois/voce-jovem-claro-1440.png']], 720],
  ['10-formacao', 'Formação — antes × depois (16 anos, no Japão)', [['antes', 'antes7/formacao-japao-claro-1440.png'], ['depois', 'depois/formacao-japao-claro-1440.png']], 720],
  ['11-trabalho', 'Trabalho: cada família com o seu emblema e o seu tom', [['diarista (cuidado)', 'depois/trabalho-empregado-claro-1440.png'], ['atleta', 'depois/trabalho-atleta-escuro-1440.png'], ['a pena', 'depois/trabalho-presa-claro-1440.png'], ['desempregado', 'depois/trabalho-desempregado-claro-1440.png']], 600],
  ['12-redes', 'Redes sociais: cada rede com a sua forma', [['Instagram', 'depois/redes-instagram-claro-1440.png'], ['YouTube', 'depois/redes-youtube-claro-1440.png'], ['X', 'depois/redes-x-escuro-1440.png'], ['TikTok', 'depois/redes-tiktok-escuro-1440.png']], 600],
  ['13-linha-da-vida', 'Linha da Vida: o marco, a escolha e o rosto de quem estava', [['antes', 'antes7/viver-ano-claro-1440.png'], ['depois', 'depois/viver-ano-claro-1440.png']], 720],
  ['14-casa-cidade', 'Casa e Cidade: quem mora, o que há em casa, os lugares desta vida', [['casa', 'depois/casa-familia-claro-1440.png'], ['cidade (Lisboa)', 'depois/cidade-portugal-escuro-1440.png']], 720],
  ['15-temas', 'Os temas: claro e escuro nas telas novas', [['Tempo livre · claro', 'depois/tempo-varias-claro-1440.png'], ['Tempo livre · escuro', 'depois/tempo-varias-escuro-1440.png'], ['Compras · claro', 'depois/compras-rica-claro-1440.png'], ['Compras · escuro', 'depois/compras-rica-escuro-1440.png']], 600],
  ['16-tablet', 'Tablet (820 px)', [['Tempo livre', 'depois/tempo-jovem-claro-820.png'], ['Pessoas', 'depois/ficha-pessoa-escuro-820.png'], ['Trabalho', 'depois/trabalho-atleta-claro-820.png']], 420]
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
for (const [arq, titulo, quadros, larg] of PARES) {
  const itens = quadros.map(([leg, cam]) => ({ leg, src: img(`${SP}/${cam}`) })).filter(x => x.src);
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
