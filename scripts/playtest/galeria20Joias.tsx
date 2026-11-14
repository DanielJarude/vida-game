/** VIDA 20 — as joias novas no corpo (a miniatura da loja e o provador). OUT=<html>. Bundle como CJS (--loader:.css=empty). */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { criarVida } from '../../src/motor/criacao';
import { JOIAS20 } from '../../src/motor/dados20/joias20';
import { MiniaturaDaPeca } from '../../src/ui/avatar/MiniaturaDaPeca';
const html: string[] = [];
for (const genero of ['feminino', 'masculino'] as const) {
  const v = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero, municipioId: 'sao-paulo-sp', semente: genero === 'feminino' ? 7 : 8 });
  v.t += 30 * 12;
  const lista = process.env.TODAS ? JOIAS20 : JOIAS20.filter((_, k) => k % (genero === 'feminino' ? 1 : 3) === 0);
  for (const j of lista) html.push(`<div class=s>${renderToStaticMarkup(<MiniaturaDaPeca vida={v} itemId={j.id} largura={Number(process.env.L ?? 120)} />)}<span>${j.nome}<br>R$ ${j.preco}</span></div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:4px;margin:6px;width:1500px}.s{width:140px;background:#fff;border:1px solid #ddd;padding:2px}.s span{display:block}.s svg{display:block}</style>${html.join('')}`);
