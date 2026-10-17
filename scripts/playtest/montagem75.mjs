// REWORK 7.5 — as provas do relatório: montagens antes × depois e das quatro paletas, das capturas REAIS do jogo
// (`rework75.mjs`; "antes" = o build da base 0497af3 nas mesmas cenas), em JPEG, para docs/rework75/.
//   SP=<pasta com antes/ e depois/> DEST=docs/rework75 node scripts/playtest/montagem75.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r75';
const DEST = process.env.DEST ?? 'docs/rework75';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const PARES = [
  ['01-linha-fios', 'Linha da Vida em fios — antes × depois (infância, "mostrar tudo", 1440 px)', [['antes', 'antes/linha-infancia-claro-1440.png'], ['depois', 'depois/linha-infancia-claro-1440.png']], 720],
  ['02-linha-celular', 'Linha da Vida no celular — 390 e 360 px', [['390 · Memória Clara', 'depois/linha-infancia-claro-390.png'], ['390 · Atlântico Noturno', 'depois/linha-infancia-atlantico-390.png'], ['360 · Horizonte Claro', 'depois/linha-luto-horizonte-360.png']], 390],
  ['03-paletas', 'As quatro paletas — a mesma tela (Tempo livre, 1440 px)', [['Memória Clara', 'depois/agenda-varias-claro-1440.png'], ['Horizonte Claro', 'depois/agenda-varias-horizonte-1440.png'], ['Memória Escura', 'depois/agenda-varias-escuro-1440.png'], ['Atlântico Noturno', 'depois/agenda-varias-atlantico-1440.png']], 600],
  ['04-paletas-menu', 'O seletor com a prévia de cada paleta (Menu e tela inicial)', [['Menu · claro', 'depois/menu-paletas-claro-1440.png'], ['Menu · Atlântico', 'depois/menu-paletas-atlantico-390.png'], ['Nascer · Horizonte', 'depois/nascimento-horizonte-390.png']], 520],
  ['05-agenda', 'Tempo livre: a agenda da semana — antes × depois (cinco atividades)', [['antes', 'antes/agenda-varias-claro-1440.png'], ['depois', 'depois/agenda-varias-claro-1440.png']], 720],
  ['06-agenda-celular', 'A agenda no celular e a ficha aberta dela', [['390 · jovem', 'depois/agenda-jovem-claro-390.png'], ['390 · criança', 'depois/agenda-crianca-escuro-390.png'], ['a ficha (violão)', 'depois/agenda-ficha-horizonte-390.png']], 390],
  ['07-celular', 'Redes sociais: o celular — antes × depois', [['antes', 'antes/celular-influencer-claro-1440.png'], ['depois', 'depois/celular-influencer-claro-1440.png']], 720],
  ['08-celular-apps', 'O celular: tela inicial, YouTube, adolescente', [['tela inicial', 'depois/celular-inicio-escuro-390.png'], ['YouTube', 'depois/celular-youtube-horizonte-390.png'], ['16 anos', 'depois/celular-adolescente-atlantico-390.png']], 390],
  ['09-em-memoria', 'Pessoas: "Em memória" — antes × depois (o avô morreu este ano)', [['antes', 'antes/pessoas-luto-claro-1440.png'], ['depois', 'depois/pessoas-luto-claro-1440.png']], 720],
  ['10-ficha-avo', 'A ficha de quem se foi — antes × depois', [['antes', 'antes/ficha-avo-qsf-claro-1440.png'], ['depois', 'depois/ficha-avo-claro-1440.png']], 720],
  ['11-luto-anos', 'Três anos depois: a memória fica, o peso passa', [['ficha', 'depois/ficha-avo-depois-claro-1440.png'], ['Você, no ano da perda', 'depois/voce-luto-claro-1440.png']], 720],
  ['12-ficha-amiga', 'A ficha de uma amiga de anos (a memória da relação)', [['1440 · claro', 'depois/ficha-amiga-claro-1440.png'], ['390 · escuro', 'depois/ficha-amiga-escuro-390.png']], 600],
  ['13-compras', 'Compras: comparar as opções e o que rende no que você pratica', [['loja · 1440', 'depois/loja-instrumentos-claro-1440.png'], ['loja · 390 · Atlântico', 'depois/loja-instrumentos-atlantico-390.png']], 600],
  ['14-tablet', 'Tablet (820 px)', [['agenda', 'depois/agenda-varias-horizonte-820.png'], ['celular', 'depois/celular-influencer-escuro-820.png'], ['Em memória', 'depois/pessoas-luto-atlantico-820.png']], 420]
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
