/** VIDA 12.5 — as casas por padrão (república → mansão), para conferir se a aparência acompanha o valor. Bundle como CJS; OUT=<arquivo.html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDaCasa } from '../../src/ui/jogo/material/Desenhos';
import { leituraDoLar } from '../../src/ui/leituraMaterial';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { transacao } from '../../src/motor/nucleo';

const base = adulto(35, { semente: 125, municipioId: 'sao-paulo-sp' });
const L: string[] = [];
for (const id of ['republica', 'kitnet', 'casa_simples', 'apto_1q', 'apto_2q', 'casa_2q', 'apto_3q', 'casa_3q', 'casa_grande', 'sitio', 'alto_padrao', 'cobertura', 'mansao']) {
  const v = transacao(base, x => { x.moradia.modeloId = id; x.moradia.tipo = 'propria' as never; }).vida;
  L.push(`<div class=c>${renderToStaticMarkup(<CenaDaCasa l={leituraDoLar(v)} />)}<span>${id}</span></div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{width:280px;display:flex;flex-direction:column;align-items:center;background:#fbf8f2;padding:4px;border:1px solid #ddd}.c svg{width:270px;height:auto}</style>${L.join('')}`);
