// REWORK 9.5 — as provas do relatório: montagens antes × depois (a base é o REWORK 9, 07e53dc, com OS MESMOS saves:
// `rework95.mjs` com URL do build da base e TAG=antes) e das quatro paletas, das capturas REAIS do jogo, em JPEG,
// para docs/rework95/.
//   SP=<pasta com antes/ e final-<tema>/> DEST=docs/rework95 node scripts/playtest/montagem95.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r95';
const DEST = process.env.DEST ?? 'docs/rework95';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const PARES = [
  ['01-semana-playtest', 'A criança do playtest (escola, futebol 2×, leitura, xadrez) — antes × depois, 390 px', [['antes', 'antes/semana-playtest-claro-390.png'], ['depois', 'final-claro/semana-playtest-claro-390.png'], ['depois · 1440', 'final-claro/semana-playtest-claro-1440.png']], 400],
  ['02-dedicacao', 'A dedicação aos estudos: o estudo em casa na agenda (a mesma criança, um ano depois)', [['antes', 'antes/semana-dedicada-claro-1440.png'], ['depois', 'final-claro/semana-dedicada-claro-1440.png']], 720],
  ['03-boletim', 'A escola como boletim — antes (duas listas das matérias) × depois', [['antes', 'antes/caminhos-boletim-claro-1440.png'], ['depois', 'final-claro/caminhos-boletim-claro-1440.png'], ['depois · 390', 'final-horizonte/caminhos-boletim-horizonte-390.png']], 560],
  ['04-historia', 'História — antes (os quatro medidores) × depois (o retrato da vida agora)', [['antes', 'antes/historia-retrato-claro-1440.png'], ['depois', 'final-claro/historia-retrato-claro-1440.png'], ['depois · infância 390', 'final-escuro/historia-infancia-escuro-390.png']], 560],
  ['05-voce', 'Você — antes × depois (uma ficha por habilidade, uma vez só)', [['antes', 'antes/voce-fichas-claro-1440.png'], ['depois', 'final-claro/voce-fichas-claro-1440.png']], 720],
  ['06-caminhos-17', 'Caminhos aos 17, técnico concluído, procurando emprego — antes × depois', [['antes · Agora', 'antes/caminhos-tecnico-claro-1440.png'], ['depois · Agora', 'final-claro/caminhos-tecnico-claro-1440.png'], ['depois · Oportunidades', 'final-claro/caminhos-tecnico-opo-claro-1440.png']], 560],
  ['07-caminhos-pastas', 'Oportunidades em pastas: Vida pública e Outras trajetórias', [['Vida pública', 'final-claro/caminhos-tecnico-publica-claro-1440.png'], ['Outras trajetórias', 'final-atlantico/caminhos-tecnico-outras-atlantico-1440.png'], ['390', 'final-horizonte/caminhos-tecnico-publica-horizonte-390.png']], 560],
  ['08-vida', 'Vida — Patrimônio (o inventário) e Dinheiro (o extrato)', [['antes · Pertences', 'antes/vida-patrimonio-claro-1440.png'], ['depois · Patrimônio', 'final-claro/vida-patrimonio-claro-1440.png'], ['depois · Dinheiro', 'final-claro/vida-dinheiro-claro-1440.png']], 560],
  ['09-pessoas', 'Pessoas como álbum', [['antes', 'antes/pessoas-album-claro-1440.png'], ['depois', 'final-claro/pessoas-album-claro-1440.png']], 720],
  ['10-paletas-semana', 'As quatro paletas — Minha Semana (390 px)', [['Memória Clara', 'final-claro/semana-playtest-claro-390.png'], ['Horizonte Claro', 'final-horizonte/semana-playtest-horizonte-390.png'], ['Memória Escura', 'final-escuro/semana-playtest-escuro-390.png'], ['Atlântico Noturno', 'final-atlantico/semana-playtest-atlantico-390.png']], 360],
  ['11-paletas-boletim', 'As quatro paletas — o boletim (1440 px)', [['Memória Clara', 'final-claro/caminhos-boletim-claro-1440.png'], ['Horizonte Claro', 'final-horizonte/caminhos-boletim-horizonte-1440.png'], ['Memória Escura', 'final-escuro/caminhos-boletim-escuro-1440.png'], ['Atlântico Noturno', 'final-atlantico/caminhos-boletim-atlantico-1440.png']], 600],
  ['12-tablet-baixo', 'Tablet (820 px) e celular de tela baixa (390 × 560)', [['820 · Caminhos', 'final-horizonte/caminhos-tecnico-horizonte-820.png'], ['820 · Vida', 'final-escuro/vida-casa-escuro-820.png'], ['390×560 · semana', 'final-claro/semana-playtest-claro-390b.png'], ['390×560 · boletim', 'final-atlantico/caminhos-boletim-atlantico-390b.png']], 400]
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
