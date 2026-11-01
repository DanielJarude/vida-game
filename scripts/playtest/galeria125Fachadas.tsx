/** VIDA 12.5 — as fachadas das lojas (grande e miniatura). Bundle como CJS e rode com OUT=<arquivo.html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Fachada } from '../../src/ui/ilustracao/Fachada';
import { FACHADAS_DE_LOJA } from '../../src/ui/ilustracao/fachadasDeLoja';
const L: string[] = [];
for (const id of [...Object.keys(FACHADAS_DE_LOJA), 'estilo', 'casa', 'eletronicos', 'joalheria']) {
  L.push(`<div class=c>${renderToStaticMarkup(<Fachada lugar={id as any} largura={420} altura={170} />)}<span>${id}</span></div>`);
  L.push(`<div class=c>${renderToStaticMarkup(<Fachada lugar={id as any} largura={110} recorte />)}<span>mini</span></div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{display:flex;flex-direction:column;align-items:center;background:#fbf8f2;padding:4px;border:1px solid #ddd}</style>${L.join('')}`);
