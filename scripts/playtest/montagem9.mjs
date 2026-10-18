// REWORK 9 — as provas do relatório: montagens antes × depois (a base é o REWORK 8, 3c2bf18, nas cenas equivalentes:
// Trabalho e Formação → Caminhos; Tempo livre → Minha Semana) e das quatro paletas, das capturas REAIS do jogo
// (`rework9.mjs`, TAG=final; "antes" por `rework75.mjs` no build da base), em JPEG, para docs/rework9/.
//   SP=<pasta com antes/ e final/> DEST=docs/rework9 node scripts/playtest/montagem9.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r9';
const DEST = process.env.DEST ?? 'docs/rework9';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const PARES = [
  ['01-navegacao', 'As seis áreas — antes (sete, com Formação e Trabalho) × depois (Caminhos), 1440 px', [['antes · Trabalho', 'antes/trabalho-empregado-claro-1440.png'], ['depois · Caminhos', 'final/caminhos-empregado-claro-1440.png']], 720],
  ['02-caminhos-partes', 'Caminhos: Agora, Desenvolvimento, Oportunidades, Histórico', [['Desenvolvimento', 'final/caminhos-empregado-dev-claro-1440.png'], ['Oportunidades', 'final/caminhos-empregado-opo-claro-1440.png'], ['Histórico', 'final/caminhos-empregado-hist-claro-1440.png']], 560],
  ['03-caminhos-fases', 'Caminhos muda com a fase da vida (390 px)', [['criança', 'final/caminhos-crianca-claro-390.png'], ['adolescente', 'final/caminhos-adolescente-horizonte-390.png'], ['trabalho e faculdade', 'final/caminhos-faculdade-escuro-390.png'], ['atleta', 'final/caminhos-atleta-atlantico-390.png']], 360],
  ['04-agenda', 'Minha Semana: a agenda em horários — antes (frequência, sem dia nem hora) × depois', [['antes', 'antes/agenda-varias-claro-1440.png'], ['depois', 'final/semana-varias-claro-1440.png']], 720],
  ['05-agenda-conflito', 'Um conflito de horário (o futebol das 16h e o meio período da tarde) e a ficha do compromisso', [['o conflito, com as saídas', 'final/semana-conflito-claro-1440.png'], ['a ficha', 'final/semana-conflito-bloco-horizonte-1440.png']], 720],
  ['06-agenda-celular', 'A agenda no celular: um dia de cada vez', [['adolescente', 'final/semana-adolescente-claro-390.png'], ['trabalho e faculdade', 'final/semana-faculdade-atlantico-390.png'], ['criança', 'final/semana-crianca-escuro-390.png']], 390],
  ['07-celular', 'O celular — antes (uma tira comprida) × depois (telas curtas e os números ao lado)', [['antes', 'antes/celular-influencer-claro-1440.png'], ['depois', 'final/celular-influencer-claro-1440.png']], 720],
  ['08-celular-balanco', 'De onde veio o público (SOC-01) e o celular no celular', [['o balanço · 1440', 'final/celular-rede-claro-1440.png'], ['390 · Atlântico', 'final/celular-rede-atlantico-390.png'], ['390 · perfil', 'final/celular-perfil-horizonte-390.png']], 480],
  ['09-progressao', 'PROG-01: ano a ano, o que mudou e por quê', [['Caminhos · Desenvolvimento', 'final/caminhos-jovem-dev-claro-1440.png'], ['Você (trabalho e faculdade)', 'final/voce-faculdade-claro-1440.png']], 720],
  ['10-pessoas', 'Pessoas: a vida deles e a nossa história', [['A vida deles', 'final/pessoas-vida-deles-claro-1440.png'], ['Nossa história', 'final/pessoas-nossa-horizonte-1440.png']], 720],
  ['11-historia', 'História: ver por um fio e as conquistas (o acesso para a Série A)', [['Conquistas', 'final/historia-conquistas-claro-1440.png'], ['Trabalho', 'final/historia-trabalho-escuro-1440.png'], ['Caminhos · Histórico (atleta)', 'final/caminhos-promovido-hist-atlantico-1440.png']], 560],
  ['12-paletas', 'As quatro paletas — a agenda (1440 px)', [['Memória Clara', 'final/semana-varias-claro-1440.png'], ['Horizonte Claro', 'final/semana-varias-horizonte-1440.png'], ['Memória Escura', 'final/semana-varias-escuro-1440.png'], ['Atlântico Noturno', 'final/semana-varias-atlantico-1440.png']], 600],
  ['13-paletas-caminhos', 'As quatro paletas — Caminhos (390 px)', [['Memória Clara', 'final/caminhos-empregado-claro-390.png'], ['Horizonte Claro', 'final/caminhos-empregado-horizonte-390.png'], ['Memória Escura', 'final/caminhos-empregado-escuro-390.png'], ['Atlântico Noturno', 'final/caminhos-empregado-atlantico-390.png']], 360],
  ['14-tablet-baixo', 'Tablet (820 px) e celular de tela baixa (390 × 560)', [['820 · agenda', 'final/semana-varias-horizonte-820.png'], ['820 · Caminhos', 'final/caminhos-faculdade-escuro-820.png'], ['390×560 · celular', 'final/celular-influencer-claro-390b.png'], ['390×560 · agenda', 'final/semana-conflito-atlantico-390b.png']], 400],
  ['15-vida', 'Vida: viagens (saíram de Tempo livre), a vitrine e a imobiliária', [['Viagens', 'final/viagens-empregado-claro-1440.png'], ['Compras', 'final/compras-adulto-horizonte-1440.png'], ['a loja', 'final/loja-imobiliaria-claro-1440.png']], 560]
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
