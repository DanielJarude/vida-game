/** VIDA 22 — as peças lisas lado a lado (na mesma cor), o acabamento da marca e os pares que eram iguais. CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';
import { pecasDoItem, varianteDaCor } from '../../src/ui/avatar/pecas';

const CORPOS: [string, any, any, number, string, string][] = [['M magro 22', 'masculino', 'magro', 22, 'p2', 'curto'], ['F mediana 40', 'feminino', 'mediano', 40, 'p5', 'longo_ondulado'], ['M acima 55', 'masculino', 'acima_do_peso', 55, 'p6', 'curto'], ['F atlética 30', 'feminino', 'atletico', 30, 'p1', 'coque']];
let n = 0;
const fig = (k: number, pecas: { itemId: string; id: string; variante?: string; marca?: string }[], larg = 130) => { const [, g, c, i, pele, cab] = CORPOS[k]; return renderToStaticMarkup(<Figura visual={{ pele, cabelo: cab, corCabelo: 'castanho', olhos: 'castanho' } as any} genero={g} idade={i} corpo={c} pecas={pecas} largura={larg} semFundo />, { identifierPrefix: `f${n++}-` }); };
/** A variante que dá a cor pedida (para comparar na mesma cor). */
const na = (itemId: string, cor: string) => ({ itemId, id: itemId, variante: varianteDaCor(itemId, cor) });
const BRANCAS = ['camiseta_lisa', 'camiseta_basica_gola_v', 'camiseta_oversized', 'camiseta_pima', 'camiseta_bolso', 'camiseta_manga_longa', 'camiseta_henley', 'camiseta_dry_fit', 'camiseta_raglan', 'regata', 'regata_academia', 'regata_alcinha', 'top_esportivo', 'cropped'];
const L: string[] = [];
const cel = (rot: string, svg: string) => `<div class=p>${svg}<span>${rot}</span></div>`;
for (const k of [0, 1, 2, 3]) L.push(`<h3>Lisas em branco/claro · ${CORPOS[k][0]}</h3><div class=f>${BRANCAS.map(id => { const c = pecasDoItem(id, 'x').cima as any; const cores: string[] = Array.isArray((require('../../src/ui/avatar/pecas').PECAS[id] as any).cor) ? (require('../../src/ui/avatar/pecas').PECAS[id] as any).cor : [(require('../../src/ui/avatar/pecas').PECAS[id] as any).cor]; return cel(id, fig(k, [na(id, cores[0]), { itemId: 'jeans', id: 'j' }])); }).join('')}</div>`);
L.push(`<h3>O mesmo item, marcas de segmentos diferentes (Hering 1 · Zara 2 · Gucci 4 · Hermès 5)</h3><div class=f>${['camiseta_pima', 'camisa_social', 'calca_alfaiataria', 'blazer'].flatMap(id => ['hering', 'zara', 'gucci', 'hermes'].map(m => cel(`${id}·${m}`, fig(0, [{ itemId: id, id: id, marca: m }, ...(id === 'blazer' ? [{ itemId: 'camisa_social', id: 'cs' }] : []), ...(id === 'calca_alfaiataria' ? [{ itemId: 'camisa_social', id: 'cs2' }] : [])])))).join('')}</div>`);
L.push(`<h3>Os pares que eram iguais</h3><div class=f>${[['terno', 'terno_vicunha'], ['camisa_polo', 'polo_pique_premium'], ['jaqueta_bomber', 'jaqueta_corrida'], ['jeans', 'jeans_reto_premium']].flatMap(par => par.map(id => cel(id, fig(2, [{ itemId: id, id: id }, ...(id.startsWith('jaqueta') ? [{ itemId: 'camiseta_lisa', id: 'cl' }] : [])])))).join('')}</div>`);
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;margin:6px;width:1500px}.f{display:flex;flex-wrap:wrap;gap:4px;align-items:flex-end}.p{display:flex;flex-direction:column;align-items:center;width:100px}.p svg{width:100px;height:auto}</style>${L.join('')}`);
