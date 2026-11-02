/** VIDA 12.7 — os acabamentos (miniatura 132 e cena 320, a mesma), as peças novas na vitrine (miniatura) e no corpo. Bundle CJS; OUT=<arquivo.html>, PARTE=acabamentos|roupas. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';
import { ACABAMENTOS } from '../../src/motor/dados/lar';
import { ITENS_ESTILO } from '../../src/motor/dados/estilo';
import { MiniaturaDaPeca } from '../../src/ui/avatar/MiniaturaDaPeca';
import { adulto } from '../../src/motor/__tests__/cenarios';

const L: string[] = [];
const N: JSX.Element[] = [];
const op = (a: 'piso' | 'parede', id: string) => ({ id, cor: ACABAMENTOS[a].opcoes.find(o => o.id === id)!.cor });
if (process.env.PARTE !== 'roupas') {
  const combos: [string, string, string, string, string, string, string?, number?][] = [];
  const pisos = ACABAMENTOS.piso.opcoes.map(o => o.id), paredes = ACABAMENTOS.parede.opcoes.map(o => o.id), luzes = ACABAMENTOS.luz.opcoes.map(o => o.id);
  const rods = ACABAMENTOS.rodape.opcoes.map(o => o.id), corts = ACABAMENTOS.cortina.opcoes.map(o => o.id);
  const n = Math.max(pisos.length, paredes.length);
  for (let i = 0; i < n; i++) combos.push(['sala', pisos[i % pisos.length], paredes[i % paredes.length], luzes[i % luzes.length], rods[i % rods.length], corts[i % corts.length], ['quente', 'neutra', 'fria'][i % 3], [100, 70, 40][i % 3]]);
  for (const [tipo, piso, parede, luz, rodape, cortina, temperatura, intensidade] of combos) {
    const p = { tipo, piso: op('piso', piso), parede: op('parede', parede), luz, rodape, cortina, luzRegulada: { temperatura: temperatura as never, intensidade }, objetos: [{ coisaId: 'sofa', id: 'a' }, { coisaId: 'poltrona', id: 'b' }] };
    N.push(<div className="c" key={N.length}><div className="r"><CenaDoComodo {...p} largura={132} rotulo="m" /><CenaDoComodo {...p} largura={320} rotulo="g" /></div><span>{piso} · {parede} · {luz} · {rodape} · {cortina} · {temperatura} {intensidade}%</span></div>);
  }
} else {
  for (const genero of ['feminino', 'masculino'] as const) {
    const v = adulto(35, { semente: 7, genero });
    for (const it of ITENS_ESTILO) N.push(<div className="p" key={N.length}><MiniaturaDaPeca vida={v} itemId={it.id} largura={96} /><span>{it.id}</span></div>);
  }
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{background:#fbf8f2;padding:4px;border:1px solid #ddd}.r{display:flex;gap:6px;align-items:flex-start}.p{width:104px;display:flex;flex-direction:column;align-items:center;background:#fbf8f2;border:1px solid #ddd;padding:2px}</style>${renderToStaticMarkup(<>{N}</>)}`);
