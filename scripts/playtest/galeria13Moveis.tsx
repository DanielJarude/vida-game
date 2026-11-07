/**
 * VIDA 13 — MÓVEIS COM VOLUME: as cenas da 12.9 (quartos, salas, cozinhas, jogos, escritório) mais banheiros, lavabo,
 * escritório grande, cômodos mínimos e a garagem. OUT=<html> (uma cena por bloco, 760 px; SO=0,3,7 filtra). Bundle CJS.
 * Fotografar: node scripts/playtest/fotos13Moveis.mjs <html> <pasta> <prefixo>
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';
import { disporComodo } from '../../src/ui/ilustracao/disposicao';
import { CENAS as CENAS129 } from './galeria129Comodos';

export const CENAS13: [string, number, string[]][] = [
  ...CENAS129,
  ['quarto', 6, ['cama_solteiro', 'penteadeira', 'guarda_roupa']],
  ['quarto', 9, ['cama_box', 'penteadeira', 'comoda']],
  ['banheiro', 4, ['gabinete', 'espelho_led', 'toalheiro']],
  ['banheiro', 10, ['banheira', 'bancada_marmore', 'espelho_led', 'ducha', 'toalhas']],
  ['lavabo', 2.5, ['gabinete', 'espelho_led']],
  ['escritorio', 20, ['mesa_executiva', 'cadeira_ergonomica', 'monitores', 'estante_escritorio', 'livros', 'poltrona', 'aparador', 'plantas']],
  ['cozinha', 6, ['geladeira', 'fogao', 'maquina_lavar', 'microondas']],
  ['sala', 10, ['sofa', 'estante_sala', 'home_theater', 'tv', 'som_hifi']],
  ['garagem', 30, ['bancada_ferramentas', 'armario_garagem', 'organizadores', 'ferramentas']]
];

if (process.env.OUT) {
  const so = process.env.SO ? new Set(process.env.SO.split(',').map(Number)) : undefined;
  const html: string[] = [];
  for (const [i, [tipo, area, ids]] of CENAS13.entries()) {
    if (so && !so.has(i)) continue;
    const objetos = ids.map((c, k) => ({ id: `o${k}`, coisaId: c }));
    const d = disporComodo(tipo, area, objetos);
    html.push(`<div class=s id=c${i}>${renderToStaticMarkup(<CenaDoComodo tipo={tipo} area={area} objetos={objetos} largura={760} rotulo={tipo} />)}<span><b>#${i} ${tipo} ${area} m²</b> · fora: ${d.fora.map(f => objetos.find(o => o.id === f)?.coisaId).join(',')}<br>${d.postos.map(p => `${p.coisaId}[${p.montagem[0]}${p.giro ? '↻' + p.giro : ''} x${p.x0.toFixed(1)}-${p.x1.toFixed(1)} z${p.z0.toFixed(1)}-${p.z1.toFixed(1)}]`).join(' ')}</span></div>`);
  }
  writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:1600px}.s{width:780px;background:#fbf8f2;border:1px solid #ddd}.s span{display:block;padding:4px}</style>${html.join('')}`);
}
