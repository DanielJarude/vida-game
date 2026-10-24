// REWORK 11 · QA visual — as montagens (JPEG) das capturas de rework11.mjs: cada cena nas quatro paletas e tamanhos.
//   SP=<pasta com depois/> DEST=<pasta de saída> node scripts/playtest/montagem11.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa11`;
const DEST = process.env.DEST ?? `${SP}/montagens`;
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);
const D = `${SP}/depois`;
const C = (cena, tema, w) => [`${tema} · ${w}`, `${D}/${cena}-${tema}-${w}.png`];
// [arquivo, título, quadros, largura de cada quadro]
const PARES = [
  ['01-atleta-sem-clube', '1 · Caminhos → Trabalho do goleiro sem clube (placar "sem clube · último: Cruzeiro", ações de atleta) e a página inicial de Caminhos', [C('trabalho-sem-clube', 'claro', 1440), C('trabalho-sem-clube', 'atlantico', 390), C('caminhos-sem-clube', 'horizonte', 1440), C('caminhos-sem-clube', 'escuro', 390)], 520],
  ['02-carreira-paises', '2 · A carreira no esporte: Cruzeiro → Barcelona → Juventus (a liga de cada temporada) e os Momentos da carreira', [C('carreira-paises', 'claro', 1440), C('carreira-paises', 'escuro', 390), C('carreira-momentos', 'horizonte', 1440), C('carreira-momentos', 'atlantico', 390)], 520],
  ['03-comissao', '3 · A comissão técnica: o técnico principal e o auxiliar', [C('comissao-tecnico', 'claro', 1440), C('comissao-tecnico', 'escuro', 390), C('comissao-auxiliar', 'horizonte', 1440), C('comissao-auxiliar', 'atlantico', 390)], 520],
  ['04-portas', '4 · As portas: mudança de carreira (Adele, manicure) e por conta própria, sem entrevista (Tito, escolinha)', [C('porta-mudanca', 'claro', 1440), C('porta-mudanca', 'horizonte', 390), ['escuro · 360', `${D}/porta-mudanca-escuro-360.png`], C('porta-por-conta', 'atlantico', 390), ['claro · 390×560', `${D}/porta-por-conta-claro-390b.png`]], 400],
  ['05-ator-politico', '5 · O ator (modo artista) e a prefeita em mandato (Trabalho e Vida pública)', [C('trabalho-ator', 'claro', 1440), C('trabalho-ator', 'escuro', 390), C('trabalho-politico', 'horizonte', 1440), C('publica-politico', 'claro', 1440), C('publica-politico', 'atlantico', 390)], 440],
  ['06-noivado-ex', '6 · O planejamento do casamento na ficha do noivo e as ações com o ex', [C('noivado', 'claro', 1440), C('noivado', 'horizonte', 390), ['escuro · 360', `${D}/noivado-escuro-360.png`], ['atlantico · 390×560', `${D}/noivado-atlantico-390b.png`], C('ex', 'claro', 390), C('ex-acoes', 'escuro', 390)], 400],
  ['07-redes', '7 · Publicar em passos (o quê → como → publicar), o histórico "No fim de cada ano"/"agora" e a conta suspensa', [C('redes-oque', 'claro', 390), C('redes-como', 'horizonte', 390), C('redes-confirmar', 'escuro', 390), C('redes-historico', 'atlantico', 390), ['claro · 360', `${D}/redes-historico-claro-360.png`], C('redes-suspensa', 'claro', 1440), ['escuro · 390×560', `${D}/redes-suspensa-escuro-390b.png`]], 390],
  ['08-agenda', '8 · A agenda do músico com a calopsita e do auxiliar técnico', [C('agenda-musico', 'claro', 1440), C('agenda-musico', 'escuro', 390), ['horizonte · 360', `${D}/agenda-musico-horizonte-360.png`], C('agenda-auxiliar', 'atlantico', 1440), ['claro · 390×560', `${D}/agenda-auxiliar-claro-390b.png`]], 440],
  ['09-lojas-crianca', '9 · A criança de 10 anos nas lojas: instrumentos (a regressão), bicicletas e esportes', [['instrumentos · claro · 360', `${D}/loja-instrumentos-claro-360.png`], ['instrumentos · escuro · 390×560', `${D}/loja-instrumentos-escuro-390b.png`], ['instrumentos · horizonte · 1440', `${D}/loja-instrumentos-horizonte-1440.png`], ['bicicletas · atlantico · 360', `${D}/loja-bicicletas-atlantico-360.png`], ['bicicletas · claro · 390', `${D}/loja-bicicletas-claro-390.png`], ['esportes · escuro · 360', `${D}/loja-esportes-escuro-360.png`]], 390],
  ['10-euros', '10 · Milhões em euro: o placar e a carreira de quem joga na Juventus', [C('euros-placar', 'claro', 1440), C('euros-placar', 'horizonte', 390), C('euros-placar', 'atlantico', 390)], 520],
  ['11-paletas', 'As quatro paletas — o goleiro sem clube (1440 px)', [C('trabalho-sem-clube', 'claro', 1440), C('trabalho-sem-clube', 'horizonte', 1440), C('trabalho-sem-clube', 'escuro', 1440), C('trabalho-sem-clube', 'atlantico', 1440)], 520]
];
const extra = process.env.EXTRA ? JSON.parse(readFileSync(process.env.EXTRA, 'utf8')) : [];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
for (const [arq, titulo, quadros, larg] of [...PARES, ...extra]) {
  const itens = quadros.map(([leg, cam]) => ({ leg, src: img(cam) })).filter(x => x.src);
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
  console.log('ok', arq, itens.length);
}
await b.close();
