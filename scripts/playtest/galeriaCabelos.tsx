/**
 * HOTFIX dos cabelos — galeria de auditoria. Gera páginas HTML com:
 *   cortes   — cada corte × cada textura × as quatro idades da prévia (bebê, 9, 30, 75), grandes (120 px), em fundo claro
 *              e escuro (os dois temas), com cor de cabelo escura e clara;
 *   rostos   — tranças, locs, black, cacheado longo e rabo em cada formato de rosto, orelhas, linha do cabelo e calvície;
 *   miniaturas — os mesmos cortes nos tamanhos das listas (34, 40, 56 px) e no cabeçalho (36 px).
 *   npx esbuild scripts/playtest/galeriaCabelos.tsx --bundle --platform=node --outfile=<scratch>/gc.cjs --jsx=automatic --loader:.tsx=tsx
 *   OUT=<pasta> SO=trancas,locs node <scratch>/gc.cjs   → <pasta>/cabelos-*.html (fotografar com fotografarHtml.mjs)
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
import type { Genero, Visual } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const SO = process.env.SO?.split(',');
const pagina = (fundo: string, tinta: string, corpo: string) => `<html><head><meta charset="utf-8"><style>body{background:${fundo};margin:0;padding:10px;font:11px system-ui,sans-serif;color:${tinta}}td{padding:2px 4px;text-align:center;vertical-align:middle}th{font-weight:600;text-align:left;padding-right:8px;white-space:nowrap}</style></head><body>${corpo}</body></html>`;
// O rótulo diz o caso (a auditoria `cabelos.mjs` aponta o retrato que falhou por ele).
const R = (v: Visual, g: Genero, i: number, s: string, t: number) => renderToStaticMarkup(<Retrato visual={v} genero={g} idade={i} semente={s} tamanho={t} rotulo={[v.cabelo, v.textura, `${i} anos`, g, v.corCabelo, v.rosto, v.orelhas, v.linhaCabelo, v.calvicie, v.oculos, v.chapeu, `${t}px`].filter(Boolean).join(' · ')} />);

const CORTES: [string, Genero][] = [
  ['trancas', 'feminino'], ['locs', 'feminino'], ['locs', 'masculino'], ['black', 'feminino'], ['crespo_curto', 'masculino'], ['cacheado', 'masculino'],
  ['cacheado_longo', 'feminino'], ['longo_liso', 'feminino'], ['longo_ondulado', 'feminino'], ['chanel', 'feminino'], ['pixie', 'feminino'],
  ['rabo', 'feminino'], ['coque', 'feminino'], ['curto', 'masculino'], ['curto_lado', 'masculino'], ['topete', 'masculino'], ['ondulado', 'masculino'], ['raspado', 'masculino']
].filter(([c]) => !SO || SO.includes(c)) as [string, Genero][];
const TEXTURAS = (process.env.TEXTURAS ?? 'liso,ondulado,encaracolado,cacheado,crespo').split(',');
const IDADES = [0, 9, 30, 75];

// 1. Cortes × texturas × idades, nos dois fundos.
for (const [tema, fundo, tinta] of [['claro', '#f2eee5', '#1d2126'], ['escuro', '#1a1d21', '#ebe5d9']]) {
  let h = '<table>';
  CORTES.forEach(([c, g], k) => {
    h += `<tr><th colspan="${1 + TEXTURAS.length * IDADES.length}" style="padding-top:8px">${c} · ${g}</th></tr><tr><td></td>${TEXTURAS.map(t => `<td colspan="${IDADES.length}">${t}</td>`).join('')}</tr>`;
    for (const [cor, pele] of [['preto', k % 2 ? 'p5' : 'p4'], ['loiro', k % 2 ? 'p1' : 'p2']]) {
      h += `<tr><td>${cor}</td>${TEXTURAS.map(tx => IDADES.map(i => `<td>${R({ pele, cabelo: c, corCabelo: cor, olhos: 'castanho', textura: tx, rosto: 'oval', calvicie: 'nao' } as Visual, g, i, `${c}${k}`, 92)}</td>`).join('')).join('')}</tr>`;
    }
  });
  writeFileSync(`${OUT}/cabelos-cortes-${tema}.html`, pagina(fundo, tinta, h + '</table>'));
}

// 2. Os cortes mais longos e volumosos em cada rosto, orelha, linha do cabelo e calvície (30 e 75 anos).
const VARIAS: [string, Partial<Visual>][] = [
  ['oval', { rosto: 'oval' }], ['redondo', { rosto: 'redondo' }], ['quadrado', { rosto: 'quadrado' }], ['longo', { rosto: 'longo' }], ['coração', { rosto: 'coracao' }],
  ['orelhas de abano', { orelhas: 'de_abano' }], ['orelhas coladas', { orelhas: 'coladas' }], ['linha alta', { linhaCabelo: 'alta' }], ['linha em bico', { linhaCabelo: 'bico' }],
  ['calvície cedo', { calvicie: 'cedo' }], ['calvície tardia', { calvicie: 'tardia' }], ['com óculos', { oculos: 'grau' }], ['com chapéu', { chapeu: 'chapeu' }]
];
{
  let h = '<table>';
  for (const [c, g, tx] of ([['trancas', 'feminino', 'crespo'], ['locs', 'masculino', 'crespo'], ['black', 'feminino', 'crespo'], ['cacheado_longo', 'feminino', 'cacheado'], ['rabo', 'feminino', 'encaracolado'], ['curto', 'masculino', 'liso']] as [string, Genero, string][]).filter(([c]) => !SO || SO.includes(c))) {
    h += `<tr><th colspan="${1 + VARIAS.length}" style="padding-top:8px">${c} · ${tx}</th></tr><tr><td></td>${VARIAS.map(([n]) => `<td>${n}</td>`).join('')}</tr>`;
    for (const i of [9, 30, 75]) h += `<tr><td>${i}</td>${VARIAS.map(([, x], k) => `<td>${R({ pele: k % 2 ? 'p5' : 'p3', cabelo: c, corCabelo: 'preto', olhos: 'castanho', textura: tx, rosto: 'oval', calvicie: 'nao', ...x } as Visual, g, i, `${c}-${k}`, 92)}</td>`).join('')}</tr>`;
  }
  writeFileSync(`${OUT}/cabelos-rostos.html`, pagina('#f2eee5', '#1d2126', h + '</table>'));
}

// 3. Miniaturas (listas de pessoas, cabeçalho, "Em casa").
{
  let h = '<table>';
  for (const t of [34, 40, 56]) {
    h += `<tr><th>${t} px</th>${CORTES.map(([c, g], k) => `<td>${R({ pele: k % 2 ? 'p5' : 'p2', cabelo: c, corCabelo: k % 3 ? 'preto' : 'castanho', olhos: 'castanho', textura: c === 'trancas' || c === 'locs' || c === 'black' ? 'crespo' : 'cacheado', rosto: 'oval' } as Visual, g, 30, `${c}${k}`, t)}<br>${t === 56 ? c : ''}</td>`).join('')}</tr>`;
  }
  writeFileSync(`${OUT}/cabelos-miniaturas.html`, pagina('#f2eee5', '#1d2126', h + '</table>') );
  writeFileSync(`${OUT}/cabelos-miniaturas-escuro.html`, pagina('#22262b', '#ebe5d9', h + '</table>'));
}

// 4. Zoom (260 px): o corte em detalhe nas três idades, para ver a raiz, as junções e as pontas. ZOOM=trancas,locs
if (process.env.ZOOM) {
  let h = '';
  for (const c of process.env.ZOOM.split(',')) for (const [cor, pele] of [['preto', 'p4'], ['loiro', 'p2']]) {
    h += `<div><b>${c} · ${cor} · ${process.env.T ?? 'crespo'}</b><br>`;
    for (const i of [9, 30, 75]) h += R({ pele, cabelo: c, corCabelo: cor, olhos: 'castanho', textura: process.env.T ?? 'crespo', rosto: 'oval', calvicie: 'nao' } as Visual, c === 'locs' ? 'masculino' : 'feminino', i, c, 260);
    h += '</div>';
  }
  writeFileSync(`${OUT}/cabelos-zoom.html`, pagina('#f2eee5', '#1d2126', h));
}
