// REWORK 10 — as provas do relatório, em JPEG, para docs/rework10/: cada uma das seis áreas antes (a base 674188d, os
// mesmos saves) × depois, em 1440 e no celular (390, a página inteira); as telas novas (Pessoas e a ficha, a margem e a
// Justiça, as quatro mesas, uma situação nova, o seguro em parcelas); as quatro paletas; 820, 390×560 e 360 px.
//   SP=<pasta com antes/ e depois/> DEST=docs/rework10 node scripts/playtest/montagem10.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r10';
const DEST = process.env.DEST ?? 'docs/rework10';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);
const AD = (cena, rotulo) => [[`antes · 1440`, `antes/${cena}-claro-1440.png`], [`depois · 1440`, `depois/${cena}-claro-1440.png`], [`antes · celular`, `antes/${cena}-claro-390-inteira.png`], [`depois · celular`, `depois/${cena}-claro-390-inteira.png`]].map(([l, c]) => [`${rotulo} — ${l}`, c]);

// [arquivo, título, quadros [[legenda, caminho relativo a SP]], largura de cada quadro]
const PARES = [
  ['01-historia', 'UX-13 · História — antes (o retrato, o ano e a Linha da Vida inteira numa página só; no celular, ~10 telas) × depois (Agora | Biografia, a cabeça da área; ~3 telas)', AD('historia-empregado', 'História'), 360],
  ['02-voce', 'UX-13 · Você — antes (cinco blocos longos em sequência) × depois (Resumo · Saúde · Habilidades · Aparência · No mundo, uma parte à vista)', AD('voce-empregado', 'Você'), 360],
  ['03-pessoas', 'UX-14 · Pessoas — antes (listas por grupo) × depois (o álbum com filtros, a cabeça com quem está em conflito e o tempo para as pessoas)', AD('pessoas-familia', 'Pessoas'), 360],
  ['04-pessoas-ficha', 'UX-14 · A ficha de uma pessoa — antes (as ações em abas genéricas) × depois (Agora · Vocês dois · Quem é, ações por situação, o conflito pendente)', [...AD('pessoas-ficha-amiga', 'Ficha').slice(0, 2), ['Ficha com conflito — depois · 1440', 'depois/pessoas-conflito-claro-1440.png']], 520],
  ['05-caminhos', 'UX-13 · Caminhos — antes × depois (a cabeça: onde, a situação, há pouco, o próximo passo); Estudos com o curso e a dedicação primeiro', [...AD('caminhos-inicio', 'Início').slice(0, 2), ...AD('caminhos-estudos', 'Estudos').slice(2)], 360],
  ['06-semana', 'UX-13 · Minha Semana — antes × depois (a cabeça da área, a agenda)', AD('semana-agenda', 'Semana'), 360],
  ['07-vida', 'UX-13 · Vida · Patrimônio — antes (cada bem com todas as ações abertas; ~9 telas no celular) × depois (inventário compacto, ações a um toque; ~5,5 telas)', AD('vida-patrimonio', 'Patrimônio'), 360],
  ['08-vida-compras', 'UX-13 · Vida · Compras — antes × depois (duas colunas no celular)', AD('vida-compras', 'Compras').slice(2), 360],
  ['09-momento', 'A decisão aberta — antes (a página atrás, ~10 telas) × depois; e uma situação nova do REWORK 10 com quatro respostas', [['antes · celular', 'antes/momento-claro-390-inteira.png'], ['depois · celular', 'depois/momento-claro-390-inteira.png'], ['situação nova · 1440', 'depois/evento-novo-claro-1440.png'], ['situação nova · celular', 'depois/evento-novo-claro-390.png']], 360],
  ['10-margem', 'CRI-01 · À margem e a Justiça (Caminhos · Outros caminhos): a trajetória, as saídas, o processo como ficha', [['1440', 'depois/caminhos-margem-claro-1440.png'], ['celular', 'depois/caminhos-margem-escuro-390-inteira.png']], 560],
  ['11-mesas', 'JOG-01 · As quatro mesas, com uma rodada jogada (dinheiro do jogo, só maiores de idade)', [['Loteria', 'depois/apostas-loteria-claro-1440.png'], ['Blackjack', 'depois/apostas-blackjack-claro-1440.png'], ['Roleta', 'depois/apostas-roleta-claro-1440.png'], ['A Raposa', 'depois/apostas-niquel-claro-1440.png']], 460],
  ['12-mesas-celular', 'JOG-01 · As mesas no celular (390 px) e o balanço de quem aposta', [['Blackjack · escuro', 'depois/apostas-blackjack-escuro-390.png'], ['Roleta · atlântico', 'depois/apostas-roleta-atlantico-390.png'], ['A Raposa · horizonte', 'depois/apostas-niquel-horizonte-390.png'], ['Balanço · claro', 'depois/apostas-balanco-claro-390.png']], 330],
  ['13-seguro', 'ECO-03 · O seguro-desemprego em parcelas (Caminhos · Trabalho)', [['1440', 'depois/caminhos-seguro-claro-1440.png'], ['celular', 'depois/caminhos-seguro-claro-390.png']], 560],
  ['14-paletas', 'As quatro paletas — a ficha de uma pessoa em conflito (1440 px)', [['Memória Clara', 'depois/pessoas-conflito-claro-1440.png'], ['Horizonte Claro', 'depois/pessoas-conflito-horizonte-1440.png'], ['Memória Escura', 'depois/pessoas-conflito-escuro-1440.png'], ['Atlântico Noturno', 'depois/pessoas-conflito-atlantico-1440.png']], 520],
  ['15-paletas-mesas', 'As quatro paletas — a roleta (1440 px)', [['Memória Clara', 'depois/apostas-roleta-claro-1440.png'], ['Horizonte Claro', 'depois/apostas-roleta-horizonte-1440.png'], ['Memória Escura', 'depois/apostas-roleta-escuro-1440.png'], ['Atlântico Noturno', 'depois/apostas-roleta-atlantico-1440.png']], 520],
  ['16-tamanhos', '820 px, 390 × 560 e 360 px', [['820 · Pessoas', 'depois/pessoas-familia-horizonte-820.png'], ['390×560 · História', 'depois/historia-empregado-atlantico-390b.png'], ['360 · Vida', 'depois/vida-patrimonio-escuro-360.png'], ['360 · Você', 'depois/voce-empregado-claro-360.png']], 380]
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
for (const [arq, titulo, quadros, larg] of PARES) {
  const itens = quadros.map(([leg, cam]) => ({ leg, src: img(`${SP}/${cam}`) })).filter(x => x.src);
  if (!itens.length) { console.log('sem imagens:', arq); continue; }
  if (itens.length < quadros.length) console.log('faltam quadros em', arq, quadros.filter(([, c]) => !existsSync(`${SP}/${c}`)).map(q => q[1]));
  const largura = itens.length * (larg + 16) + 24;
  await p.setViewportSize({ width: largura, height: 200 });
  await p.setContent(`<html><body style="margin:0;padding:12px;background:#d9d4ca;font-family:system-ui,sans-serif">
    <h1 style="font-size:18px;margin:0 0 10px;color:#1d2126;max-width:${largura - 24}px">${titulo}</h1>
    <div style="display:flex;gap:16px;align-items:flex-start">${itens.map(x => `<figure style="margin:0;width:${larg}px"><figcaption style="font-size:13px;color:#434a53;margin-bottom:4px">${x.leg}</figcaption><img src="${x.src}" style="width:${larg}px;display:block;border:1px solid #a9a39a"></figure>`).join('')}</div></body></html>`);
  await p.waitForTimeout(150);
  const alt = await p.evaluate(() => document.body.scrollHeight);
  await p.setViewportSize({ width: largura, height: Math.min(alt, 3600) });
  await p.screenshot({ path: `${DEST}/${arq}.jpg`, type: 'jpeg', quality: 70, clip: { x: 0, y: 0, width: largura, height: Math.min(alt, 3600) } });
  console.log('ok', arq);
}
await b.close();
