// REWORK 10.6 — as provas do relatório: antes (a base cbb4373, os mesmos saves: rework106.mjs com URL do build da base,
// TAG=antes) × depois, e as quatro paletas e os tamanhos (rework106.mjs), em JPEG, para docs/rework106/.
//   SP=<pasta com depois/ e antes/> DEST=docs/rework106 node scripts/playtest/montagem106.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r106';
const ANTES = process.env.ANTES ?? `${SP}/antes`;
const DEST = process.env.DEST ?? 'docs/rework106';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const PARES = [
  ['01-estudos-antes-depois', 'C2 · Caminhos → Estudos aos 18, médio concluído — antes (a escola que acabou, "Cursos" na terceira aba) × depois (Minha formação e as ações principais)', [['antes · cbb4373', 'ANTES/estudos-inicio-claro-1440.png'], ['depois', 'depois/estudos-inicio-claro-1440.png']], 640],
  ['02-entrar-na-faculdade', 'C2 · "Entrar na faculdade": os passos, o requisito, as graduações com o que pedem — e as bolsas e auxílios (390 px)', [['faculdade · 1440', 'depois/estudos-faculdade-claro-1440.png'], ['faculdade · 390', 'depois/estudos-faculdade-horizonte-390.png'], ['bolsas · 390', 'depois/estudos-bolsas-escuro-390.png']], 420],
  ['03-vaga-aprovada', 'C2 · Candidatura → aprovação → matrícula: a vaga reservada espera a confirmação', [['1440', 'depois/estudos-vaga-aprovada-claro-1440.png'], ['360', 'depois/estudos-vaga-aprovada-atlantico-360.png']], 560],
  ['04-convite', 'UX-23 · "Francisco chamou para um projeto": antes (o toque levava a Trabalho, sem o convite) × depois (o convite aberto)', [['antes · cbb4373', 'ANTES/convite-claro-1440.png'], ['depois · 1440', 'depois/convite-claro-1440.png'], ['depois · 390', 'depois/convite-horizonte-390.png']], 480],
  ['05-crianca-loja', 'INF-02 · A criança de 10 anos com 193 no cofrinho diante da chuteira — antes (botão apagado) × depois (preço, cofrinho, falta, pedir)', [['antes · cbb4373', 'ANTES/crianca-loja-claro-390.png'], ['depois', 'depois/crianca-loja-claro-390.png'], ['de onde vem o dinheiro', 'depois/crianca-dinheiro-escuro-390.png']], 390],
  ['06-trabalho', 'C3 · Caminhos → Trabalho: as ações principais (antes × depois) e Minha carreira', [['antes · cbb4373', 'ANTES/trabalho-acoes-claro-1440.png'], ['depois', 'depois/trabalho-acoes-claro-1440.png'], ['Minha carreira', 'depois/trabalho-carreira-horizonte-1440.png']], 520],
  ['07-goleiro', 'FUT-05 / C4 · O goleiro profissional: o treino da posição (antes × depois) e "Em andamento" em Outros caminhos', [['antes · cbb4373', 'ANTES/trabalho-goleiro-claro-1440.png'], ['depois', 'depois/trabalho-goleiro-claro-1440.png'], ['Outros caminhos', 'depois/outros-goleiro-escuro-1440.png']], 520],
  ['08-agenda', 'AGE-01 · O save antigo com escola e trabalho das 8h às 12h: a agenda acusa o conflito e oferece as saídas', [['antes · cbb4373', 'ANTES/agenda-conflito-claro-390.png'], ['depois', 'depois/agenda-conflito-claro-390.png']], 390],
  ['09-tratamento-desgaste', 'P4 · Parar o tratamento (o risco antes) · C5 · o desgaste com as causas', [['tratamento · 390', 'depois/saude-tratamento-claro-390.png'], ['desgaste · 1440', 'depois/publica-desgaste-horizonte-1440.png']], 520],
  ['10-novidades', 'UX-24 · VIDA — Novidades da atualização (uma vez por versão; o histórico fica no Menu)', [['1440', 'depois/novidades-claro-1440.png'], ['390 · escuro', 'depois/novidades-escuro-390.png'], ['390×560', 'depois/novidades-atlantico-390b.png']], 460],
  ['11-paletas', 'As quatro paletas — Caminhos → Estudos (1440 px)', [['Memória Clara', 'depois/estudos-inicio-claro-1440.png'], ['Horizonte Claro', 'depois/estudos-inicio-horizonte-1440.png'], ['Memória Escura', 'depois/estudos-inicio-escuro-1440.png'], ['Atlântico Noturno', 'depois/estudos-inicio-atlantico-1440.png']], 520],
  ['12-tamanhos', '820 px, 390 × 560 e 360 px', [['820 · trabalho', 'depois/trabalho-acoes-horizonte-820.png'], ['390×560 · faculdade', 'depois/estudos-faculdade-claro-390b.png'], ['360 · convite', 'depois/convite-escuro-360.png']], 400]
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
