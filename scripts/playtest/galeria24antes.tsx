/** VIDA 24 — o "antes": corpos volumosos (o triângulo da cintura), os pelos (0 a 3) e a criança. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';
import type { Genero, Visual } from '../../src/motor/tipos';
const base = (x: Partial<Visual> = {}): Visual => ({ pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', ...x } as Visual);
const html: string[] = [];
const fig = (v: Visual, g: Genero, extra: Record<string, unknown> = {}, rot = '') => `<div class=c>${renderToStaticMarkup(<Figura visual={v} genero={g} idade={(extra.idade as number) ?? 30} semente={rot} corpo={(extra.corpo as never) ?? 'mediano'} pecas={(extra.pecas as never) ?? []} largura={(extra.largura as number) ?? 132} semFundo semCima={!!extra.semCima} descalco={!!extra.semCima} />)}<p>${rot}</p></div>`;
const secao = (t: string) => html.push(`<h2>${t}</h2><div class=l>`);
const fim = () => html.push('</div>');
const roupa = [{ itemId: 'camiseta', id: 'c' }, { itemId: 'jeans', id: 'j' }];
secao('Corpo volumoso — pele e vestido');
for (const g of ['feminino', 'masculino'] as Genero[]) for (const c of [undefined, '222224222242', '222242224222', '232242242222']) {
  html.push(fig(base({ corpo23: c, cabelo: g === 'feminino' ? 'coque' : 'raspado' }), g, { corpo: 'acima_do_peso', semCima: true }, `${g} ${c ?? 'antigo'} pele`));
  html.push(fig(base({ corpo23: c, cabelo: g === 'feminino' ? 'coque' : 'raspado' }), g, { corpo: 'acima_do_peso', pecas: roupa }, `${g} ${c ?? 'antigo'} vestido`));
}
fim();
secao('Pelos do corpo 0 a 3 (masculino e feminino, pele clara e escura)');
for (const g of ['masculino', 'feminino'] as Genero[]) for (const pele of ['p2', 'p5']) for (const n of [0, 1, 2, 3]) html.push(fig(base({ pele, pelos23: n, corCabelo: 'preto', corpo23: '222222222222' }), g, { semCima: true }, `${g} ${pele} pelos ${n}`));
fim();
secao('Idades: 3, 6, 9, 12, 15, 30');
for (const i of [3, 6, 9, 12, 15, 30]) html.push(fig(base({ corpo23: '232222222222' }), 'feminino', { idade: i, pecas: roupa }, `${i} anos`));
fim();
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:12px sans-serif;background:#f4efe6}.l{display:flex;flex-wrap:wrap;gap:8px}.c{text-align:center}.c p{margin:2px;max-width:140px}</style>${html.join('')}`);
