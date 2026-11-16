/**
 * VIDA 24 — AUDITORIA VISUAL das joias e piercings: cada peça desenhada como na vitrine (de perto) e no corpo (equipada),
 * e agrupada pelo desenho SEM a cor (o metal) — dois itens no mesmo grupo têm a mesma silhueta, a mesma construção e o
 * mesmo tamanho: diferem só na cor. Sai um JSON (os grupos repetidos) e uma galeria HTML.
 *   npx esbuild scripts/playtest/auditoriaJoias24.tsx --bundle --platform=node --outfile=<scratch>/aj.cjs --jsx=automatic --loader:.tsx=tsx
 *   OUT=<scratch>/aj node <scratch>/aj.cjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'fs';
import { Figura, focoDaPeca } from '../../src/ui/avatar/Figura';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { focoDaJoiaNoRosto } from '../../src/ui/avatar/identidade13';
import { visualComPecaDoRosto } from '../../src/ui/avatar/MiniaturaDaPeca';
import { ITENS_ESTILO } from '../../src/motor/dados/estilo';
import { zonaDoFuro } from '../../src/motor/dados/piercings13';
import type { Visual } from '../../src/motor/tipos';

const OUT = process.env.OUT!; mkdirSync(OUT, { recursive: true });
const base: Visual = { pele: 'p3', cabelo: 'raspado', corCabelo: 'castanho', olhos: 'castanho' } as Visual;
const LUGARES = new Set(['orelha', 'joia', 'pulseira', 'anel', 'tornozelo', 'alianca', 'pulso']);
const itens = ITENS_ESTILO.filter(x => x.piercing || (x.lugar && LUGARES.has(x.lugar)));
const semCor = (s: string) => s.replace(/#[0-9a-fA-F]{3,8}\b/g, '#').replace(/ (id|aria-label|data-item|data-acabamento|data-metal|data-pedra|clip-path|fill|stroke|opacity|stop-color|stop-opacity)="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, '');
const comCor = (s: string) => s.replace(/ (id|aria-label|data-item|clip-path)="[^"]*"/g, '').replace(/url\(#[^)]*\)/g, '');
type Linha = { id: string; nome: string; grupo: string; perto: string; corpo: string };
const linhas: Linha[] = [];
for (const it of itens) {
  const g = it.piercing ? `piercing:${it.lugar}` : it.lugar!;
  let perto = '', corpo = '';
  const zona = it.lugar === 'orelha' ? 'orelha' : it.piercing ? zonaDoFuro(it.lugar!) : undefined;
  if (zona && zona !== 'umbigo') {
    const v = visualComPecaDoRosto(base, it.id);
    perto = renderToStaticMarkup(<Figura visual={v} genero="feminino" idade={30} semente="a" corpo="mediano" pecas={[]} largura={132} foco={focoDaJoiaNoRosto(zona, 30)} rotulo="x" />);
    corpo = renderToStaticMarkup(<Retrato visual={v} genero="feminino" idade={30} semente="a" tamanho={132} rotulo="x" />);
  } else if (zona === 'umbigo') {
    const v = { ...base, piercings: [it.id] };
    perto = renderToStaticMarkup(<Figura visual={v} genero="feminino" idade={30} semente="a" corpo="mediano" pecas={[]} semCima largura={132} foco={focoDaPeca('feminino', 'mediano', 30, 'umbigo')} rotulo="x" />);
    corpo = renderToStaticMarkup(<Figura visual={v} genero="feminino" idade={30} semente="a" corpo="mediano" pecas={[]} semCima largura={132} rotulo="x" />);
  } else {
    const lugar = it.lugar === 'joia' ? 'joia' : it.lugar!;
    const pecas = [{ itemId: 'regata', id: 'r' }, ...(it.lugar === 'tornozelo' ? [{ itemId: 'short_jeans', id: 's' }] : []), { itemId: it.id, id: it.id }];
    perto = renderToStaticMarkup(<Figura visual={base} genero="feminino" idade={30} semente="a" corpo="mediano" pecas={pecas} largura={132} semFundo foco={focoDaPeca('feminino', 'mediano', 30, lugar)} rotulo="x" />);
    corpo = renderToStaticMarkup(<Figura visual={base} genero="feminino" idade={30} semente="a" corpo="mediano" pecas={pecas} largura={132} semFundo rotulo="x" />);
    if (it.lugar === 'joia') corpo += renderToStaticMarkup(<Retrato visual={visualComPecaDoRosto(base, it.id)} genero="feminino" idade={30} semente="a" tamanho={132} rotulo="x" />);
  }
  linhas.push({ id: it.id, nome: it.nome, grupo: g, perto, corpo });
}
const agrupar = (f: (l: Linha) => string) => {
  const m = new Map<string, Linha[]>();
  for (const l of linhas) { const k = `${l.grupo}|${f(l)}`; m.set(k, [...(m.get(k) ?? []), l]); }
  return [...m.values()].filter(x => x.length > 1).map(x => x.map(l => l.id));
};
const iguaisSemCor = agrupar(l => semCor(l.perto) + semCor(l.corpo));
const iguaisComCor = agrupar(l => comCor(l.perto) + comCor(l.corpo));
const iguaisNoCorpo = agrupar(l => semCor(l.corpo));
writeFileSync(`${OUT}/auditoria.json`, JSON.stringify({ total: linhas.length, porGrupo: Object.fromEntries([...new Set(linhas.map(l => l.grupo))].map(g => [g, linhas.filter(l => l.grupo === g).length])), iguaisComCor, iguaisSemCor, iguaisNoCorpo }, null, 1));
const html = [...new Set(linhas.map(l => l.grupo))].map(g => `<h2>${g}</h2><div class=l>${linhas.filter(l => l.grupo === g).map(l => `<div class=c>${l.perto}<p>${l.nome}</p></div>`).join('')}</div>`).join('');
writeFileSync(`${OUT}/galeria.html`, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6}.l{display:flex;flex-wrap:wrap;gap:6px}.c{text-align:center;width:136px}.c p{margin:2px}</style>${html}`);
console.log('itens', linhas.length, 'iguais com cor', iguaisComCor.length, 'iguais sem cor', iguaisSemCor.length, 'iguais no corpo', iguaisNoCorpo.length);
