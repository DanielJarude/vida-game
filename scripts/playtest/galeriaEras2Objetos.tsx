/** ERAS v2 — os aparelhos de casa por década (TV, computador, som, videogame, celular simples). CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Ilustracao } from '../../src/ui/ilustracao/nucleo';
import { amostraDoObjeto } from '../../src/ui/ilustracao/objetos';
import { definirDecadaDaFigura } from '../../src/ui/eras/modaDaDecada';
const IDS = ['tv', 'computador', 'caixa_som', 'videogame', 'celular_simples'];
const L: string[] = [];
for (const d of [1970, 1980, 1990, 2000, 2010, null]) {
  definirDecadaDaFigura(d);
  L.push(`<h3>${d ?? 'hoje'}</h3><div class=f>${IDS.map(id => `<div class=c>${renderToStaticMarkup(<Ilustracao a={amostraDoObjeto(id, '#2d3e5c')} largura={120} rotulo={id} />)}<span>${id}</span></div>`).join('')}</div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;margin:6px;width:800px}.f{display:flex;gap:8px}.c{display:flex;flex-direction:column;align-items:center}h3{margin:4px 0}</style>${L.join('')}`);
