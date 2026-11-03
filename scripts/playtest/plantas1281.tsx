import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { amostraDoObjeto } from '../../src/ui/ilustracao/objetos';
import { Ilustracao } from '../../src/ui/ilustracao/nucleo';
const out: string[] = [];
for (const [id, n] of [['plantas', 35], ['vasos_grandes', 12]] as const) for (let v = 0; v < n; v++) out.push(`<div>${renderToStaticMarkup(<Ilustracao a={amostraDoObjeto(`${id}#${v}`, '#b5704a')} largura={150} rotulo="" />)}<br>${id} ${v}</div>`);
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{display:flex;flex-wrap:wrap;gap:4px;width:1600px;font:10px sans-serif;background:#f4efe6}</style>${out.join('')}`);
