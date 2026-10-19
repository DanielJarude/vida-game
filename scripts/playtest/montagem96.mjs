// REWORK 9.6 — as provas do relatório (antesdepois/ de antesDepois96.mjs, final-<tema>/ de rework96.mjs, elementos/ de
// elementos96.mjs), em JPEG, para docs/rework96/. (Base: montagem95.mjs.)
// REWORK 9.5 — as provas do relatório: montagens antes × depois (a base é o REWORK 9, 07e53dc, com OS MESMOS saves:
// `rework95.mjs` com URL do build da base e TAG=antes) e das quatro paletas, das capturas REAIS do jogo, em JPEG,
// para docs/rework95/.
//   SP=<pasta com antes/ e final-<tema>/> DEST=docs/rework95 node scripts/playtest/montagem95.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
const SP = process.env.SP ?? '/tmp/vida-r95';
const DEST = process.env.DEST ?? 'docs/rework96';
mkdirSync(DEST, { recursive: true });
const img = p => (existsSync(p) ? `data:image/png;base64,${readFileSync(p).toString('base64')}` : null);

// [arquivo de saída, título, [[legenda, caminho], ...], largura de cada quadro]
const PARES = [
  ['01-vaga-antes-depois', 'UX-08 · A vaga aberta, com os mesmos saves — antes (a grade velha: com um aviso longo, cargo, salário e avisos se sobrepõem) × depois (o anúncio)', [['antes · conteúdo do save', 'antesdepois/vaga-antes-nativo-1440.png'], ['antes · com um aviso longo', 'antesdepois/vaga-antes-longo-1440.png'], ['depois', 'antesdepois/vaga-depois-1440.png']], 520],
  ['02-vaga-celular', 'UX-08 · A vaga no celular — antes × depois (390 px)', [['antes · aviso longo', 'antesdepois/vaga-antes-longo-390.png'], ['depois', 'antesdepois/vaga-depois-390.png'], ['depois · nome e cidade longos, 4 vagas abertas', 'final-horizonte/caminhos-vaga-longa-horizonte-390.png']], 390],
  ['03-anuncio', 'O anúncio de emprego (elemento inteiro): claro e escuro', [['claro · 1440', 'elementos/anuncio-claro-1440.png'], ['escuro · 390', 'elementos/anuncio-escuro-390.png']], 620],
  ['04-caminhos-inicio', 'UX-09/10 · Caminhos: antes (a escola, as vagas, a política e o esporte na mesma página) × depois (página inicial e divisões)', [['antes', 'antesdepois/caminhos-antes-1440.png'], ['depois · início', 'antesdepois/caminhos-depois-1440.png'], ['depois · criança', 'final-claro/caminhos-inicio-crianca-claro-1440.png']], 520],
  ['05-divisoes', 'As quatro divisões, cada uma o seu', [['Estudos · Cursos', 'final-claro/caminhos-cursos-claro-1440.png'], ['Trabalho · Agora', 'final-claro/caminhos-trabalho-agora-claro-1440.png'], ['Vida pública', 'final-claro/caminhos-publica-claro-1440.png'], ['Outros caminhos', 'final-claro/caminhos-outros-atleta-claro-1440.png']], 440],
  ['06-nascer', 'NASC · ATR-01 · Nascer — antes (sempre Mulher · Salvador ao abrir) × depois (sorteado; atributos iniciais)', [['antes', 'antesdepois/nascer-antes-1440.png'], ['depois', 'antesdepois/nascer-depois-1440.png'], ['escolher · 390', 'elementos/nascer-claro-390.png']], 520],
  ['07-voce', 'ATR-01 · Você — antes (Bem-estar, Cabeça, Saúde) × depois (a ficha dos cinco atributos)', [['antes', 'antesdepois/voce-antes-1440.png'], ['depois', 'antesdepois/voce-depois-1440.png'], ['aberta · escuro', 'elementos/atributos-escuro-1440.png']], 520],
  ['08-boletim', 'VIS-02 · O boletim — antes × depois (papel, cabeçalho impresso, notas à mão, carimbo e rubrica)', [['antes', 'antesdepois/boletim-antes-1440.png'], ['depois', 'elementos/boletim-claro-1440.png'], ['depois · escuro 390', 'elementos/boletim-escuro-390.png']], 560],
  ['09-documentos', 'VIS-02 · Os documentos: certificado, currículo, ficha do atleta, prontuário', [['certificado', 'elementos/certificados-claro-1440.png'], ['currículo · escuro', 'elementos/curriculo-escuro-390.png'], ['ficha do atleta', 'elementos/atleta-claro-1440.png'], ['prontuário', 'elementos/prontuario-claro-1440.png']], 440],
  ['10-areas', 'VIS-02 · As outras áreas: diário, álbum, planner, extrato', [['História · diário', 'elementos/diario-claro-1440.png'], ['Pessoas · álbum', 'final-claro/pessoas-album-claro-1440.png'], ['Minha Semana · planner', 'final-claro/semana-planner-claro-1440.png'], ['Vida · extrato', 'final-claro/vida-extrato-claro-1440.png']], 440],
  ['11-paletas-boletim', 'As quatro paletas — o boletim (1440 px)', [['Memória Clara', 'final-claro/caminhos-boletim-claro-1440.png'], ['Horizonte Claro', 'final-horizonte/caminhos-boletim-horizonte-1440.png'], ['Memória Escura', 'final-escuro/caminhos-boletim-escuro-1440.png'], ['Atlântico Noturno', 'final-atlantico/caminhos-boletim-atlantico-1440.png']], 520],
  ['12-paletas-atributos', 'As quatro paletas — a ficha de atributos aberta (390 px)', [['Memória Clara', 'final-claro/voce-atributos-abertos-claro-390.png'], ['Horizonte Claro', 'final-horizonte/voce-atributos-abertos-horizonte-390.png'], ['Memória Escura', 'final-escuro/voce-atributos-abertos-escuro-390.png'], ['Atlântico Noturno', 'final-atlantico/voce-atributos-abertos-atlantico-390.png']], 360],
  ['13-tamanhos', '820 px, 360 px e 390 × 560', [['820 · vaga', 'final-escuro/caminhos-vaga-aberta-escuro-820.png'], ['360 · bebê', 'final-claro/voce-bebe-claro-360.png'], ['390×560 · prontuário', 'final-atlantico/voce-prontuario-atlantico-390b.png'], ['360 · Nascer', 'final-horizonte/criacao-escolher-horizonte-360.png']], 380]
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
