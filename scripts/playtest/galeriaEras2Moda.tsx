/** ERAS v2 — as peças da época e a roupa de todo dia de cada década, em corpos diferentes. CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';
import { definirDecadaDaFigura } from '../../src/ui/eras/modaDaDecada';
import { PECAS_ERAS } from '../../src/ui/eras/pecasEras';

const CORPOS: [string, any, any, number, string, string][] = [['M magro 22', 'masculino', 'magro', 22, 'p2', 'curto'], ['F mediana 30', 'feminino', 'mediano', 30, 'p5', 'longo_ondulado'], ['M acima 45', 'masculino', 'acima_do_peso', 45, 'p6', 'curto'], ['F atlética 19', 'feminino', 'atletico', 19, 'p1', 'rabo'], ['criança 8', 'feminino', 'mediano', 8, 'p3', 'trancas'], ['M 66', 'masculino', 'mediano', 66, 'p4', 'curto']];
let n = 0;
const fig = (k: number, pecas: { itemId: string; id: string }[], semente = 'x', larg = 130) => { const [, g, c, i, pele, cab] = CORPOS[k]; return renderToStaticMarkup(<Figura visual={{ pele, cabelo: cab, corCabelo: 'castanho', olhos: 'castanho' } as any} genero={g} idade={i} corpo={c} pecas={pecas} largura={larg} semFundo semente={semente} />, { identifierPrefix: `f${n++}-` }); };
const cel = (rot: string, svg: string) => `<div class=p>${svg}<span>${rot}</span></div>`;
const seguro = (f: () => string, rot: string) => { try { return f(); } catch (e) { console.log("ERRO", rot, (e as Error).message); return ""; } };
const L: string[] = [];
const base = (id: string) => { const p = PECAS_ERAS[id] as any; const extra = p.parte === 'baixo' ? [{ itemId: 'camiseta_lisa', id: 'cl' }] : p.parte === 'cima' ? [{ itemId: 'jeans', id: 'j' }] : [{ itemId: 'camiseta_lisa', id: 'cl' }, { itemId: 'calca_alfaiataria', id: 'ca' }]; return [{ itemId: id, id }, ...extra]; };
definirDecadaDaFigura(null);
for (const k of [0, 1, 2]) L.push(`<h3>Peças da época · ${CORPOS[k][0]}</h3><div class=f>${Object.keys(PECAS_ERAS).map(id => cel(id.replace("ep_", ""), seguro(() => fig(k, base(id)), id))).join('')}</div>`);
for (const d of [1970, 1980, 1990, 2000, 2010, 2020]) {
  definirDecadaDaFigura(d);
  L.push(`<h3>Roupa de todo dia · anos ${d}</h3><div class=f>${[0, 1, 2, 3, 4, 5].flatMap(k => ['a', 'b', 'c'].map(s => cel(`${CORPOS[k][0]} ${s}`, seguro(() => fig(k, [], `p${k}${s}${d}`, 100), `${d} ${k} ${s}`)))).join('')}</div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;margin:6px;width:1600px}.f{display:flex;flex-wrap:wrap;gap:4px;align-items:flex-end}.p{display:flex;flex-direction:column;align-items:center;width:90px}.p svg{width:90px;height:auto}h3{margin:6px 0 2px}</style>${L.join('')}`);
