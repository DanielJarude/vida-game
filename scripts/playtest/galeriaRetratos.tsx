/**
 * REWORK 6 — galeria de auditoria dos retratos. Três folhas:
 *   1. cada corte × idades (bebê, 5, 9, 15, 30, 50, 75) em duas cores (escura e clara) — a continuidade da infância à
 *      velhice e a silhueta de cada corte;
 *   2. 132 pessoas sorteadas pelo próprio motor (`visualDaAncestralidade`, ancestralidades variadas) em idades
 *      variadas, com traços universais, calvície, óculos, barba, tinta e cirurgia — as combinações que o jogo produz;
 *   3. casos extremos (calvície cedo aos 30/45/70, transplante, lifting, orelhas de abano + chapéu, tinta, black com
 *      óculos, sardas, todos os rostos).
 *   npx esbuild scripts/playtest/galeriaRetratos.tsx --bundle --platform=node --outfile=<scratch>/gr.cjs --jsx=automatic --loader:.tsx=tsx
 *   OUT=<pasta> node <scratch>/gr.cjs   → <pasta>/retratos-{cortes,sorteio,extremos}.html (capturar com Playwright)
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { visualDaAncestralidade } from '../../src/motor/sistemas/identidade';
import { criarRng } from '../../src/motor/rng';
import type { Genero, Visual } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const css = 'body{background:#20242a;margin:0;padding:12px;font:11px system-ui,sans-serif;color:#cfd3d8}td{padding:2px;text-align:center;vertical-align:top}.c{display:inline-block;margin:3px;text-align:center;width:104px}.c small{display:block;line-height:1.2;color:#9aa2ab;height:28px;overflow:hidden}';
const R = (v: Visual, g: Genero, i: number, s: string, t = 96) => renderToStaticMarkup(<Retrato visual={v} genero={g} idade={i} semente={s} tamanho={t} />);

// 1. Cortes × idades
const CORTES: [string, Genero, string][] = [
  ['raspado', 'masculino', 'crespo'], ['curto', 'masculino', 'liso'], ['curto', 'masculino', 'ondulado'], ['curto_lado', 'masculino', 'liso'], ['topete', 'masculino', 'ondulado'],
  ['ondulado', 'masculino', 'ondulado'], ['crespo_curto', 'masculino', 'crespo'], ['cacheado', 'masculino', 'cacheado'], ['locs', 'masculino', 'crespo'],
  ['black', 'feminino', 'crespo'], ['trancas', 'feminino', 'crespo'], ['locs', 'feminino', 'crespo'], ['longo_liso', 'feminino', 'liso'], ['longo_ondulado', 'feminino', 'ondulado'],
  ['cacheado_longo', 'feminino', 'cacheado'], ['chanel', 'feminino', 'liso'], ['pixie', 'feminino', 'liso'], ['rabo', 'feminino', 'liso'], ['rabo', 'feminino', 'cacheado'], ['coque', 'feminino', 'crespo']
];
const IDADES = [1, 5, 9, 15, 30, 50, 75];
let h = `<html><head><style>${css}</style></head><body><table><tr><td></td>${IDADES.map(i => `<td>${i}</td>`).join('')}</tr>`;
CORTES.forEach(([c, g, tx], k) => {
  for (const [cor, pele] of [['preto', k % 2 ? 'p5' : 'p4'], [k % 3 ? 'loiro' : 'ruivo', k % 2 ? 'p1' : 'p2']]) {
    const v = { pele, cabelo: c, corCabelo: cor, olhos: 'castanho', textura: tx, rosto: 'oval' } as Visual;
    h += `<tr><td>${c}<br>${tx} ${g.slice(0, 4)}<br>${cor}</td>${IDADES.map(i => `<td>${R(v, g, i, `${c}${k}`)}</td>`).join('')}</tr>`;
  }
});
writeFileSync(`${OUT}/retratos-cortes.html`, h + '</table></body></html>');

// 2. Sorteio do próprio motor
const ANCS = [{ af: 1 }, { eu: 1 }, { am: 1 }, { ea: 1 }, { mena: 1 }, { af: 0.5, eu: 0.5 }, { eu: 0.4, af: 0.3, am: 0.3 }, { ea: 0.5, eu: 0.5 }, { sa: 1 }, { af: 0.7, am: 0.3 }, { oc: 1 }];
const GENEROS: Genero[] = ['feminino', 'masculino', 'nao_binario'];
const IDADES2 = [0, 3, 8, 12, 17, 24, 33, 41, 52, 63, 71, 84];
h = `<html><head><style>${css}</style></head><body>`;
for (let n = 0; n < 132; n++) {
  const r = criarRng(1000 + n * 7);
  const g = GENEROS[n % 3 === 2 && n % 9 !== 8 ? 0 : n % 3];
  const anc = ANCS[n % ANCS.length] as Record<string, number>;
  const v = visualDaAncestralidade(r, g, anc);
  const i = IDADES2[(n * 5) % IDADES2.length];
  if (g === 'masculino' && i >= 17 && n % 4 === 0) v.barba = ['curta', 'cheia', 'por_fazer', 'cavanhaque', 'bigode'][n % 5];
  if (n % 11 === 3) v.oculos = (['grau', 'redondo', 'sol'] as const)[n % 3];
  if (i >= 16 && n % 13 === 5) v.corCabelo = ['platinado', 'vermelho', 'azul', 'rosa'][n % 4];
  if (n % 17 === 6) v.chapeu = (['bone', 'chapeu', 'gorro', 'lenco'] as const)[n % 4];
  h += `<div class="c">${R(v, g, i, `s${n}`)}<small>${i}a ${g.slice(0, 4)} ${v.cabelo}<br>${v.textura} ${v.corCabelo} ${v.calvicie ?? ''}</small></div>`;
}
writeFileSync(`${OUT}/retratos-sorteio.html`, h + '</body></html>');

// 3. Extremos
const base = (o: Partial<Visual>) => ({ pele: 'p3', cabelo: 'curto', corCabelo: 'castanho_escuro', olhos: 'castanho', textura: 'liso', rosto: 'oval', ...o }) as Visual;
const EXT: [string, Visual, Genero, number][] = [
  ['calvície cedo 25', base({ calvicie: 'cedo' }), 'masculino', 25], ['calvície cedo 32', base({ calvicie: 'cedo' }), 'masculino', 32], ['calvície cedo 50', base({ calvicie: 'cedo' }), 'masculino', 50],
  ['tardia 55', base({ calvicie: 'tardia', cabelo: 'ondulado', textura: 'ondulado' }), 'masculino', 55], ['tardia 75', base({ calvicie: 'tardia', cabelo: 'crespo_curto', textura: 'crespo', pele: 'p6' }), 'masculino', 75],
  ['transplante 50', base({ calvicie: 'cedo', transplante: true }), 'masculino', 50], ['lifting 70', base({ lifting: 66 }), 'feminino', 70], ['sem lifting 70', base({}), 'feminino', 70],
  ['abano + boné', base({ orelhas: 'de_abano', chapeu: 'bone' }), 'masculino', 30], ['abano', base({ orelhas: 'de_abano', cabelo: 'raspado' }), 'masculino', 9], ['coladas', base({ orelhas: 'coladas', cabelo: 'longo_liso' }), 'feminino', 30],
  ['black + óculos', base({ cabelo: 'black', textura: 'crespo', oculos: 'redondo', pele: 'p6', corCabelo: 'preto' }), 'feminino', 28], ['platinado chanel', base({ cabelo: 'chanel', corCabelo: 'platinado' }), 'feminino', 22],
  ['rosa pixie', base({ cabelo: 'pixie', corCabelo: 'rosa', sardas: 'muitas', pele: 'p1' }), 'feminino', 19], ['azul topete', base({ cabelo: 'topete', corCabelo: 'azul' }), 'masculino', 20],
  ['grisalho assumido', base({ cabelo: 'longo_ondulado', corCabelo: 'grisalho', textura: 'ondulado' }), 'feminino', 48],
  ['bico, sobr. grossa', base({ linhaCabelo: 'bico', sobrancelha: 'grossa', sobrancelhaForma: 'angulosa' }), 'masculino', 35], ['testa alta', base({ linhaCabelo: 'alta', cabelo: 'rabo' }), 'feminino', 35],
  ['lenço', base({ chapeu: 'lenco', cabelo: 'trancas', textura: 'crespo', pele: 'p5', corCabelo: 'preto' }), 'feminino', 40], ['chapéu + barba cheia', base({ chapeu: 'chapeu', barba: 'cheia' }), 'masculino', 60],
  ['gorro + locs', base({ chapeu: 'gorro', cabelo: 'locs', textura: 'crespo', pele: 'p5', corCabelo: 'preto' }), 'masculino', 26],
  ...(['oval', 'redondo', 'quadrado', 'longo', 'coracao'] as const).map((ro, k) => [`rosto ${ro}`, base({ rosto: ro, cabelo: ['curto_lado', 'cacheado_longo', 'crespo_curto', 'longo_liso', 'coque'][k], textura: ['liso', 'cacheado', 'crespo', 'liso', 'ondulado'][k] }), k % 2 ? 'feminino' : 'masculino', 32] as [string, Visual, Genero, number]),
  ['bebê 0', base({ cabelo: 'black', textura: 'crespo' }), 'feminino', 0], ['bebê 2', base({ cabelo: 'curto', corCabelo: 'loiro', pele: 'p1' }), 'masculino', 2], ['noventa', base({ cabelo: 'coque', calvicie: 'nao' }), 'feminino', 92], ['noventa', base({ cabelo: 'curto', calvicie: 'tardia' }), 'masculino', 92]
];
h = `<html><head><style>${css}</style></head><body>`;
for (const [rot, v, g, i] of EXT) h += `<div class="c">${R(v, g, i, rot)}<small>${rot}</small></div>`;
writeFileSync(`${OUT}/retratos-extremos.html`, h + '</body></html>');
