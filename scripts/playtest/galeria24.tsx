/**
 * VIDA 24 — galeria de inspeção: a gordura em vários níveis e distribuições (pele e vestido), o músculo e as regiões, os
 * pelos (0 a 3, com a idade e os cuidados), a criança e os mesmos corpos de antes (as cinco condições).
 *   npx esbuild scripts/playtest/galeria24.tsx --bundle --platform=node --outfile=<scratch>/g24.cjs --jsx=automatic --loader:.tsx=tsx
 *   OUT=<scratch>/g24.html node <scratch>/g24.cjs ; HTML=... OUT=<pasta> node scripts/playtest/foto23.mjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';
import type { Genero, Visual } from '../../src/motor/tipos';
const base = (x: Partial<Visual> = {}): Visual => ({ pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', ...x } as Visual);
const html: string[] = [];
type Comp = { g: number; m: number; r?: Record<string, number> };
const fig = (v: Visual, g: Genero, extra: { idade?: number; comp?: Comp; tipo?: string; pecas?: unknown[]; semCima?: boolean; vista?: string } = {}, rot = '') => `<div class=c>${renderToStaticMarkup(<Figura visual={v} genero={g} idade={extra.idade ?? 30} semente={rot} corpo={{ tipo: (extra.tipo ?? 'mediano') as never, c: v.corpo23, comp: extra.comp }} pecas={(extra.pecas as never) ?? []} largura={132} semFundo semCima={!!extra.semCima} descalco={!!extra.semCima} vista={(extra.vista as never) ?? 'frente'} />)}<p>${rot}</p></div>`;
const secao = (t: string) => html.push(`<h2>${t}</h2><div class=l>`);
const fim = () => html.push('</div>');
const roupa = [{ itemId: 'camiseta', id: 'c' }, { itemId: 'jeans', id: 'j' }];
const cab = (g: Genero) => (g === 'feminino' ? 'coque' : 'raspado');
secao('Gordura de −1,5 a +3 (constituição média) — pele');
for (const g of ['feminino', 'masculino'] as Genero[]) for (const x of [-1.5, 0, 1, 2, 3]) html.push(fig(base({ corpo23: '222222222222', cabelo: cab(g) }), g, { comp: { g: x, m: 0 }, semCima: true }, `${g} gordura ${x}`));
fim();
secao('Distribuições com gordura +2,2: média, maçã (barriga/cintura), pera (coxas/quadril), braços — pele e vestido');
const dist: [string, string][] = [['média', '222222222222'], ['maçã', '222232224232'], ['pera', '222223423222'], ['braços', '222222322222']];
for (const g of ['feminino', 'masculino'] as Genero[]) for (const [n, c] of dist) { html.push(fig(base({ corpo23: c, cabelo: cab(g) }), g, { comp: { g: 2.2, m: 0 }, semCima: true }, `${g} ${n}`)); html.push(fig(base({ corpo23: c, cabelo: cab(g) }), g, { comp: { g: 2.2, m: 0 }, pecas: roupa }, `${g} ${n} vestido`)); }
fim();
secao('De costas e de casaco (gordura +2,2)');
for (const g of ['feminino', 'masculino'] as Genero[]) { html.push(fig(base({ corpo23: '222232224232', cabelo: cab(g) }), g, { comp: { g: 2.2, m: 0 }, semCima: true, vista: 'costas' }, `${g} costas`)); html.push(fig(base({ corpo23: '222232224232', cabelo: cab(g) }), g, { comp: { g: 2.2, m: 0 }, pecas: [...roupa, { itemId: 'jaqueta_jeans', id: 'jj' }] }, `${g} jaqueta`)); html.push(fig(base({ corpo23: '222232224232', cabelo: cab(g) }), g, { comp: { g: 2.6, m: 0 }, pecas: [{ itemId: 'vestido_midi', id: 'v' }] }, `${g} vestido`)); }
fim();
secao('Músculo 0 a 2,4 (gordura −0,4) e regiões treinadas');
for (const m of [0, 0.8, 1.6, 2.4]) html.push(fig(base({ corpo23: '222222222222', cabelo: 'raspado' }), 'masculino', { comp: { g: -0.4, m }, semCima: true }, `músculo ${m}`));
for (const r of ['bracos', 'ombros', 'pernas', 'gluteos']) html.push(fig(base({ corpo23: '222222222222', cabelo: 'coque' }), 'feminino', { comp: { g: -0.3, m: 1, r: { [r]: 1.2 } }, semCima: true }, `região ${r}`));
fim();
secao('As cinco condições de antes (sem composição) × a mesma condição pela composição (âncora): devem coincidir');
for (const [t, c] of [['magro', { g: -1.5, m: 0 }], ['atletico', { g: -0.5, m: 1 }], ['musculoso', { g: -0.3, m: 2.2 }], ['acima_do_peso', { g: 2.2, m: 0 }]] as [string, Comp][]) { html.push(fig(base({ corpo23: '222222222222' }), 'masculino', { tipo: t, semCima: true }, `${t} antes`)); html.push(fig(base({ corpo23: '222222222222' }), 'masculino', { tipo: t, comp: c, semCima: true }, `${t} composição`)); }
fim();
secao('Pelos 0 a 3 — homem e mulher, pele clara e escura, cabelo preto e loiro');
for (const g of ['masculino', 'feminino'] as Genero[]) for (const [pele, cor] of [['p2', 'preto'], ['p5', 'preto'], ['p1', 'loiro']]) for (const n of [0, 1, 2, 3]) html.push(fig(base({ pele, pelos23: n, corCabelo: cor, corpo23: '222222222222', cabelo: cab(g) }), g, { semCima: true }, `${g} ${pele} ${cor} ${n}`));
fim();
secao('Pelos 3 de costas; com a idade (11, 13, 15, 17, 19); e os cuidados (aparar braços, raspar pernas, laser peito)');
html.push(fig(base({ pele: 'p2', pelos23: 3, corCabelo: 'preto', corpo23: '222222222222', cabelo: 'raspado' }), 'masculino', { semCima: true, vista: 'costas' }, 'costas 3'));
for (const i of [11, 13, 15, 17, 19]) html.push(fig(base({ pele: 'p2', pelos23: 3, corCabelo: 'preto', corpo23: '222222222222', cabelo: 'raspado' }), 'masculino', { semCima: true, idade: i, comp: { g: 0, m: 0 } }, `pelos 3 aos ${i}`));
html.push(fig(base({ pele: 'p2', pelos23: 3, corCabelo: 'preto', corpo23: '222222222222', cabelo: 'raspado', pelos24: { metodo: 'aparar', regioes: ['bracos'], desde: 0 } } as never), 'masculino', { semCima: true }, 'aparar braços'));
html.push(fig(base({ pele: 'p2', pelos23: 3, corCabelo: 'preto', corpo23: '222222222222', cabelo: 'raspado', pelos24: { metodo: 'lamina', regioes: ['pernas'], desde: 0 } } as never), 'masculino', { semCima: true }, 'raspar pernas'));
html.push(fig(base({ pele: 'p2', pelos23: 3, corCabelo: 'preto', corpo23: '222222222222', cabelo: 'raspado', laser24: ['peito', 'abdomen'] } as never), 'masculino', { semCima: true }, 'laser peito'));
fim();
secao('Crianças com corpo de criança (3, 6, 9, 12, 15, 30) — constituição ampulheta, gordura 0');
for (const g of ['feminino', 'masculino'] as Genero[]) for (const i of [3, 6, 9, 12, 15, 30]) html.push(fig(base({ corpo23: '232242242222', cabelo: g === 'feminino' ? 'longo_liso' : 'curto' }), g, { idade: i, pecas: roupa, comp: { g: 0, m: 0 } }, `${g} ${i}`));
fim();
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:12px sans-serif;background:#f4efe6}.l{display:flex;flex-wrap:wrap;gap:8px}.c{text-align:center}.c p{margin:2px;max-width:140px}</style>${html.join('')}`);
