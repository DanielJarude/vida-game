/**
 * VIDA 12.8.1 — os cômodos de um save de verdade (os objetos, a área, as peças expostas), a 640 px, mais as cenas da
 * galeria 12.8. SAVE=<json> OUT=<html>. Bundle como CJS (--loader:.css=empty).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'fs';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';
import { objetosDaCena } from '../../src/ui/jogo/Personalizar';
import { comodosDaCasa, coisasPorComodo, acabamentoDoComodo } from '../../src/motor/sistemas/lar';
import { interpretar } from '../../src/motor/save';
import { disporComodo } from '../../src/ui/ilustracao/disposicao';

const html: string[] = [];
for (const arq of process.env.SAVE!.split(',')) {
  const r = interpretar(readFileSync(arq, 'utf8')); if (r.tipo !== 'ok') throw new Error(arq); const vida = r.vida;
  const por = coisasPorComodo(vida);
  for (const cm of comodosDaCasa(vida)) {
    const coisas = por.get(cm.id) ?? [];
    if (!coisas.length && !process.env.VAZIOS) continue;
    const { area, objetos } = objetosDaCena(vida, cm.id, cm.tipo, coisas);
    const luz0 = process.env.LUZ ?? acabamentoDoComodo(vida, cm.id, 'luz'); const d = disporComodo(cm.tipo, area, objetos, luz0);
    const luz = process.env.LUZ ?? acabamentoDoComodo(vida, cm.id, 'luz');
    html.push(`<div class=s>${renderToStaticMarkup(<CenaDoComodo tipo={cm.tipo} area={area} luz={luz} objetos={objetos} largura={760} rotulo={cm.tipo} />)}<span>${cm.id} · ${cm.tipo} ${area?.toFixed(0)} m² · luz ${luz} · fora: ${d.fora.join(',')}<br>${d.postos.map(p => `${p.coisaId}[${p.montagem[0]} x${p.x0.toFixed(1)}-${p.x1.toFixed(1)} z${p.z0.toFixed(1)}-${p.z1.toFixed(1)}]`).join(' ')}</span></div>`);
  }
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:1600px}.s{width:780px;background:#fbf8f2;border:1px solid #ddd}.s span{display:block;padding:4px}</style>${html.join('')}`);
