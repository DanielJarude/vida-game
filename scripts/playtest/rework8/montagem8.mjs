// REWORK 8 (Fase A) — as provas do documento de propostas: o diagnóstico (a galeria do que existe), as três direções
// (as dez amostras nas quatro paletas; o destaque de perto) e as três direções APLICADAS nas telas reais (Compras e a
// folha da concessionária, antes × A × B × C), em JPEG, para docs/rework8/.
//   SP=<pasta com r8/ e telas8/> DEST=docs/rework8 node scripts/playtest/rework8/montagem8.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r8';
const DEST = process.env.DEST ?? 'docs/rework8';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const T = (pal, w) => ['atual', 'A', 'B', 'C'].map(d => [d === 'atual' ? 'hoje' : `direção ${d}`, `telas8/compras-${pal}-${w}-${d}.png`]);
const C = (pal, w) => ['atual', 'A', 'B', 'C'].map(d => [d === 'atual' ? 'hoje' : `direção ${d}`, `telas8/concessionaria-${pal}-${w}-${d}.png`]);
const PARES = [
  ['01-diagnostico-veiculos', 'Diagnóstico — os veículos de hoje (cada forma em cinco cores, a 72 e a 180 px)', [['carros', 'r8/atual-claro-1.png'], ['picape, esportivo, motos', 'r8/atual-claro-2.png'], ['bicicletas, barcos', 'r8/atual-claro-3.png']], 720],
  ['02-diagnostico-objetos-animais', 'Diagnóstico — objetos, animais, casas e lugares de hoje', [['objetos', 'r8/atual-claro-5.png'], ['animais e casas', 'r8/atual-claro-6.png'], ['lugares (ícones de traço)', 'r8/atual-claro-7.png']], 720],
  ['03-propostas-claro', 'As três direções — as dez amostras (Memória Clara)', [['', 'r8/propostas-claro.png']], 1576],
  ['04-propostas-horizonte', 'As três direções — Horizonte Claro', [['', 'r8/propostas-horizonte.png']], 1576],
  ['05-propostas-escuro', 'As três direções — Memória Escura', [['', 'r8/propostas-escuro.png']], 1576],
  ['06-propostas-atlantico', 'As três direções — Atlântico Noturno', [['', 'r8/propostas-atlantico.png']], 1576],
  ['07-destaque-de-perto', 'O destaque de perto — o que muda entre as direções (claro e Atlântico)', [['Memória Clara', 'r8/propostas-zoom-claro.png'], ['Atlântico Noturno', 'r8/propostas-zoom-atlantico.png']], 900],
  ['08-compras-claro', 'Aplicado na tela real — Compras (Memória Clara, 1440 px)', T('claro', 1440), 720],
  ['09-compras-escuras', 'Aplicado na tela real — Compras nas paletas escuras', [['A · Memória Escura', 'telas8/compras-escuro-1440-A.png'], ['B · Memória Escura', 'telas8/compras-escuro-1440-B.png'], ['A · Atlântico', 'telas8/compras-atlantico-1440-A.png'], ['C · Atlântico', 'telas8/compras-atlantico-1440-C.png']], 720],
  ['10-concessionaria', 'Aplicado na tela real — a folha da concessionária (os anúncios, na cor de cada um)', C('claro', 1440), 720],
  ['12-presentes', 'O bug dos presentes — antes (o build de c1465e5) × depois (sem dinheiro, 390 px; com dinheiro, 1440 px)', [['antes', 'presentes-antes.png'], ['depois · sem dinheiro · 390', 'presentes-depois-390.png'], ['depois · com dinheiro · 1440', 'presentes-depois-1440.png']], 420],
  ['11-celular', 'Aplicado na tela real — 390 px (Horizonte Claro e Atlântico)', [['hoje · Horizonte', 'telas8/compras-horizonte-390-atual.png'], ['A · Horizonte', 'telas8/compras-horizonte-390-A.png'], ['B · Horizonte', 'telas8/compras-horizonte-390-B.png'], ['C · Atlântico', 'telas8/compras-atlantico-390-C.png']], 390]
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
