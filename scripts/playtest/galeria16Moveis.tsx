/** VIDA 16 — os móveis que ganharam volume (camas, sofás, poltronas, lazer, área externa). OUT=<html>. Bundle CJS. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';

const CENAS: [string, number, string[]][] = [
  ['quarto', 12, ['cama_box', 'criado_mudo', 'comoda']],
  ['quarto', 16, ['cama_king', 'criado_mudo', 'poltrona']],
  ['quarto', 9, ['cama_solteiro', 'beliche']],
  ['quarto', 9, ['sofa_cama', 'colchao']],
  ['sala', 14, ['sofa', 'poltrona', 'mesa_centro']],
  ['sala', 18, ['sofa_couro', 'sofa_designer', 'mesa_lateral']],
  ['sala', 14, ['sofa_retratil', 'tv_oled']],
  ['jogos', 25, ['bilhar_profissional', 'poltronas_cinema']],
  ['escritorio', 12, ['mesa_executiva', 'cadeira_ergonomica']],
  ['jardim', 40, ['churrasqueira', 'forno_pizza', 'sofa_externo']],
  ['jardim', 40, ['espaco_gourmet', 'mesa_externa']]
];
const html: string[] = [];
for (const [i, [tipo, area, ids]] of CENAS.entries()) {
  const objetos = ids.map((c, k) => ({ id: `o${k}`, coisaId: c }));
  html.push(`<div class=s>${renderToStaticMarkup(<CenaDoComodo tipo={tipo} area={area} objetos={objetos} largura={Number(process.env.LARGURA ?? 700)} rotulo={tipo} />)}<span>#${i} ${tipo} · ${ids.join(', ')}</span></div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:1430px}.s{width:705px;background:#fbf8f2;border:1px solid #ddd}.s span{display:block;padding:4px}.s svg{width:100%;height:auto}</style>${html.join('')}`);
