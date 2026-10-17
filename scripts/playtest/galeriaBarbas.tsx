/**
 * Galeria de auditoria das barbas: cada barba × rosto × queixo × idade × pele/cor, em tamanho grande e em miniatura.
 *   npx esbuild scripts/playtest/galeriaBarbas.tsx --bundle --platform=node --outfile=<scratch>/gb.cjs --jsx=automatic --loader:.tsx=tsx
 *   OUT=<pasta> node <scratch>/gb.cjs   → <pasta>/barbas-*.html
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Retrato, type Expressao } from '../../src/ui/avatar/Retrato';
import { BARBAS } from '../../src/motor/dados/estilo';
import type { Visual } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const T = Number(process.env.T ?? 110);
const pagina = (fundo: string, tinta: string, corpo: string) => `<html><head><meta charset="utf-8"><style>body{background:${fundo};margin:0;padding:10px;font:11px system-ui,sans-serif;color:${tinta}}td{padding:2px 4px;text-align:center;vertical-align:middle}th{font-weight:600;text-align:left;padding-right:8px;white-space:nowrap}</style></head><body>${corpo}</body></html>`;
const R = (v: Visual, i: number, s: string, t: number, x?: Expressao) => renderToStaticMarkup(<Retrato visual={v} genero="masculino" idade={i} semente={s} tamanho={t} expressao={x} rotulo={[v.barba, v.bigode === false ? 'sem bigode' : '', `${i} anos`, v.corCabelo, v.pele, v.rosto, v.queixo, x, `${t}px`].filter(Boolean).join(' · ')} />);
const TIPOS = BARBAS.filter(b => b.id !== 'nenhuma');

// 1. Barba × idade × pele/cor.
{
  let h = '<table>';
  const COMBOS: [string, string][] = [['p1', 'loiro'], ['p2', 'ruivo'], ['p3', 'castanho'], ['p4', 'preto'], ['p6', 'preto']];
  for (const b of TIPOS) {
    h += `<tr><th colspan="20" style="padding-top:8px">${b.nome} (${b.id})</th></tr>`;
    h += `<tr>${[17, 30, 55, 75].map(i => COMBOS.map(([pele, cor]) => `<td>${R({ pele, cabelo: 'curto', corCabelo: cor, olhos: 'castanho', barba: b.id, calvicie: 'nao' } as Visual, i, `${b.id}${pele}`, T)}</td>`).join('')).join('')}</tr>`;
  }
  writeFileSync(`${OUT}/barbas-idades.html`, pagina('#f2eee5', '#1d2126', h + '</table>'));
}
// 2. Barba × rosto, queixo, boca, expressão, óculos, cabelo comprido.
{
  const VARIAS: [string, Partial<Visual>, Expressao?][] = [
    ['oval', { rosto: 'oval' }], ['redondo', { rosto: 'redondo' }], ['quadrado', { rosto: 'quadrado' }], ['longo', { rosto: 'longo' }], ['coração', { rosto: 'coracao' }],
    ['queixo marcado', { queixo: 'marcado' }], ['queixo suave', { queixo: 'suave' }], ['boca cheia larga', { boca: 'cheia', bocaLarg: 'larga' }], ['nariz largo', { nariz: 'largo' }],
    ['sorriso', {}, 'bem'], ['abatido', {}, 'abatido'], ['óculos', { oculos: 'grau' }], ['abano', { orelhas: 'de_abano' }], ['locs', { cabelo: 'locs', textura: 'crespo' }], ['longo liso', { cabelo: 'longo_liso' }]
  ];
  let h = '<table>';
  for (const b of TIPOS) {
    h += `<tr><th colspan="${VARIAS.length}" style="padding-top:8px">${b.nome}</th></tr><tr>${VARIAS.map(([n]) => `<td>${n}</td>`).join('')}</tr>`;
    h += `<tr>${VARIAS.map(([, x, e], k) => `<td>${R({ pele: k % 2 ? 'p5' : 'p2', cabelo: 'curto', corCabelo: k % 2 ? 'preto' : 'castanho', olhos: 'castanho', barba: b.id, calvicie: 'nao', ...x } as Visual, 35, `${b.id}-${k}`, T, e)}</td>`).join('')}</tr>`;
  }
  writeFileSync(`${OUT}/barbas-rostos.html`, pagina('#f2eee5', '#1d2126', h + '</table>'));
}
// 3. Miniaturas.
{
  let h = '<table>';
  for (const t of [34, 40, 56]) h += `<tr><th>${t}px</th>${TIPOS.map((b, k) => `<td>${R({ pele: k % 2 ? 'p5' : 'p2', cabelo: 'curto', corCabelo: k % 2 ? 'preto' : 'castanho', olhos: 'castanho', barba: b.id } as Visual, 35, b.id, t)}${t === 56 ? '<br>' + b.id : ''}</td>`).join('')}</tr>`;
  writeFileSync(`${OUT}/barbas-miniaturas.html`, pagina('#f2eee5', '#1d2126', h + '</table>'));
}
// 4. Zoom (240 px): cada barba em detalhe, pele clara e escura, adulto e idoso.
{
  let h = '<table>';
  for (const b of TIPOS) h += `<tr><th>${b.id}</th>${([['p2', 'castanho', 30], ['p5', 'preto', 30], ['p3', 'castanho', 72]] as [string, string, number][]).map(([pele, cor, i]) => `<td>${R({ pele, cabelo: 'curto', corCabelo: cor, olhos: 'castanho', barba: b.id, calvicie: 'nao' } as Visual, i, b.id, 240)}</td>`).join('')}</tr>`;
  writeFileSync(`${OUT}/barbas-zoom.html`, pagina('#f2eee5', '#1d2126', h + '</table>'));
}
// 5. Toda barba × toda expressão × boca (fina, cheia, estreita, larga) × idade (17, 40, 80): a boca tem de ficar livre.
{
  const EXP: Expressao[] = ['bem', 'neutro', 'cansado', 'abatido', 'tenso', 'doente'];
  const BOCAS: Partial<Visual>[] = [{ boca: 'fina' }, { boca: 'cheia' }, { bocaLarg: 'estreita' }, { boca: 'cheia', bocaLarg: 'larga' }];
  let h = '<table>';
  for (const b of TIPOS) for (const sem of [false, true]) {
    h += `<tr><th>${b.id}${sem ? ' sem bigode' : ''}</th>`;
    for (const i of [17, 40, 80]) for (const e of EXP) for (const [k, bo] of BOCAS.entries()) h += `<td>${R({ pele: k % 2 ? 'p6' : 'p1', cabelo: 'curto', corCabelo: k % 2 ? 'preto' : 'loiro', olhos: 'castanho', barba: b.id, bigode: sem ? false : undefined, textura: k % 2 ? 'crespo' : 'liso', rosto: (['oval', 'redondo', 'quadrado', 'longo', 'coracao'] as const)[(i + k) % 5], ...bo } as Visual, i, `${b.id}${k}${e}`, 40, e)}</td>`;
    h += '</tr>';
  }
  writeFileSync(`${OUT}/barbas-expressoes.html`, pagina('#f2eee5', '#1d2126', h + '</table>'));
}
