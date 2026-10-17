/**
 * REWORK 8 (Fase A) — as três direções lado a lado: as dez amostras, cada uma em três tamanhos (miniatura a 32 px, a
 * identificação a 88 px, o destaque a 220 px), sobre o papel e a moldura de verdade de cada uma das QUATRO paletas
 * (os tokens do jogo). E duas provas da arquitetura: as oito famílias de carro saindo do mesmo perfil por números, e
 * o "esportivo" que vira um 911 ou um Mustang só mudando os números.
 *   (da raiz) npx esbuild scripts/playtest/rework8/galeriaPropostas.tsx --bundle --platform=node --jsx=automatic --outfile=<s>/gp.cjs
 *   OUT=<s>/propostas.html node <s>/gp.cjs   → propostas-<paleta>.html (e foto.mjs para as imagens)
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AMOSTRAS, Desenho, PERFIS, carro, type Direcao } from './propostas';

const raiz = join(process.cwd(), 'src', 'ui');
const css = ['tokens.css'].map(f => readFileSync(join(raiz, f), 'utf8')).join('\n');
const r = (x: JSX.Element) => renderToStaticMarkup(x);
const DIRS: { d: Direcao; nome: string; ideia: string }[] = [
  { d: 'A', nome: 'A · Catálogo editorial', ideia: 'cor material chapada, contorno fino, o detalhe que distingue' },
  { d: 'B', nome: 'B · Miniaturas de mundo', ideia: 'volume discreto, luz de cima, sombra no chão, sem contorno' },
  { d: 'C', nome: 'C · Ilustração narrativa', ideia: 'nanquim levemente irregular, aguada fora do traço, hachura' }
];
const NOMES: Record<string, string> = { claro: 'Memória Clara', horizonte: 'Horizonte Claro', escuro: 'Memória Escura', atlantico: 'Atlântico Noturno' };

function pagina(paleta: string, so?: string[]) {
  const linhas = AMOSTRAS.filter(x => !so || so.includes(x.id)).map(x => `<tr><th>${x.nome}</th>${DIRS.map(({ d }) => `<td><div class="tamanhos">${r(<Desenho a={x.a()} dir={d} largura={32} rotulo={x.nome} chao={false} />)}${r(<Desenho a={x.a()} dir={d} largura={88} rotulo={x.nome} />)}${r(<Desenho a={x.a()} dir={d} largura={220} rotulo={x.nome} />)}</div></td>`).join('')}</tr>`).join('');
  const familias = Object.keys(PERFIS).map(k => `<figure>${r(<Desenho a={carro(PERFIS[k], '#2c5c8a')} dir="A" largura={150} rotulo={k} />)}<figcaption>${k}</figcaption></figure>`).join('');
  return `<!doctype html><html data-tema="${paleta === 'claro' || paleta === 'horizonte' ? 'claro' : 'escuro'}" data-paleta="${paleta}"><head><meta charset="utf-8"><style>${css}
body{background:var(--fundo);color:var(--tinta);font:13px Inter,system-ui,sans-serif;margin:0;padding:18px;width:1540px}
h1{font:500 26px Newsreader,Georgia,serif;margin:0 0 4px}.sub{color:var(--tinta-2);margin:0 0 14px}
table{border-collapse:separate;border-spacing:10px 8px;width:100%}th{font-weight:600;text-align:left;width:150px;color:var(--tinta-2)}
thead th{font:500 17px Newsreader,Georgia,serif;color:var(--tinta)}thead span{display:block;font:12px Inter,sans-serif;color:var(--tinta-3)}
td{background:var(--superficie);border-radius:10px;padding:8px 10px;box-shadow:0 0 0 1px var(--fio)}.tamanhos{display:flex;align-items:flex-end;gap:12px}
.familias{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}figure{margin:0;padding:6px;background:var(--superficie);border-radius:8px}figcaption{color:var(--tinta-3);font-size:12px}
.moldura{background:var(--moldura);color:var(--moldura-tinta);padding:10px 14px;border-radius:10px;margin-top:14px;display:flex;gap:16px;align-items:flex-end}</style></head><body>
<h1>REWORK 8 · três direções de ilustração — ${NOMES[paleta]}</h1>
<p class="sub">As mesmas dez amostras, a mesma geometria (peças semânticas), três renderizadores. Cada célula: miniatura 32 px · identificação 88 px · destaque 220 px. A cor do objeto é dado: não muda com a paleta.</p>
<table><thead><tr><th></th>${DIRS.map(x => `<th>${x.nome}<span>${x.ideia}</span></th>`).join('')}</tr></thead><tbody>${linhas}</tbody></table>
<h1 style="margin-top:22px;font-size:20px">A arquitetura: as famílias de carro são números (direção A)</h1>
<p class="sub">compacto, hatch, sedã, SUV, SUV médio, SUV grande, picape, esportivo (o perfil de um 911) e muscle (o de um Mustang): o mesmo gerador, parâmetros diferentes — comprimento, altura, entre-eixos, teto, capô, traseira, vão livre, colunas, rodas.</p>
<div class="familias">${familias}</div>
<div class="moldura">${DIRS.map(({ d }) => r(<Desenho a={AMOSTRAS[0].a()} dir={d} largura={120} rotulo="na moldura" />)).join('')}<span>na moldura escura da interface (a barra, o celular)</span></div>
</body></html>`;
}

/** O destaque de perto (340 px): o que muda de verdade entre as direções — traço, luz, textura. */
function zoom(paleta: string) {
  const ids = ['compacto', 'cachorro', 'gato', 'violao', 'casa', 'moto'];
  const linhas = AMOSTRAS.filter(x => ids.includes(x.id)).map(x => `<tr><th>${x.nome}</th>${DIRS.map(({ d }) => `<td>${r(<Desenho a={x.a()} dir={d} largura={x.id === 'violao' ? 170 : 440} rotulo={x.nome} />)}</td>`).join('')}</tr>`).join('');
  return pagina(paleta).replace(/<table>[\s\S]*<\/table>[\s\S]*<\/body>/, `<table><thead><tr><th></th>${DIRS.map(x => `<th>${x.nome}<span>${x.ideia}</span></th>`).join('')}</tr></thead><tbody>${linhas}</tbody></table></body>`);
}

for (const p of ['claro', 'horizonte', 'escuro', 'atlantico']) {
  writeFileSync(process.env.OUT!.replace('.html', `-${p}.html`), pagina(p));
  writeFileSync(process.env.OUT!.replace('.html', `-zoom-${p}.html`), zoom(p));
}
