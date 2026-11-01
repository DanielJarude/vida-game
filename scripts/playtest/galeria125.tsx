/**
 * VIDA 12.5 — galeria visual: a lupa do estúdio de tatuagem (cada parte do corpo, nos níveis Região/Perto, de frente e
 * de costas, em corpos diferentes). Bundle como ESM e rode com OUT=<arquivo.html>; fotografe com fotografarHtml.mjs.
 *
 *   npx esbuild scripts/playtest/galeria125.tsx --bundle --platform=node --format=esm --jsx=automatic --outfile=<s>/g.mjs && OUT=<s>/g.html node <s>/g.mjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura, focoDaParte } from '../../src/ui/avatar/Figura';
import { LOCAIS, type LocalDeTatuagem } from '../../src/motor/dados/tatuagens';

const P = (ids: string[]) => ids.map((itemId, k) => ({ itemId, id: `e${k}${itemId}` }));
const L: { t: string; html: string }[] = [];
const add = (t: string, el: any) => L.push({ t, html: renderToStaticMarkup(el) });
const vis = (pele: string, extra: any = {}): any => ({ pele, cabelo: 'curto', corCabelo: pele <= 'p2' ? 'loiro' : 'preto', olhos: 'castanho', ...extra });
const T = (xs: [string, string, string?, number?][]) => xs.map(([desenho, local, lado, anos], k) => ({ id: `t${k}`, desenho, local: local as any, lado: lado as any, anos: anos ?? 1, clareou: 0 }));
const muitas = T([['rosa_tradicional', 'antebraco', 'e', 6], ['nome_cursivo', 'antebraco', 'e', 6], ['andorinha', 'peito'], ['mandala', 'abdomen'], ['ramo_fino', 'pescoco', 'd'], ['coracaozinho', 'mao', 'e'], ['tribal_faixa', 'panturrilha', 'd', 10], ['peonia', 'coxa', 'e'], ['dragao_costas', 'costas', undefined, 4], ['tribal_polinesio', 'ombro', 'e'], ['pantera', 'braco', 'd']]);
const corpos: [string, any, any, string][] = [['M atlético p4', 'masculino', 'atletico', 'p4'], ['F magra p1', 'feminino', 'magro', 'p1'], ['M acima do peso p6', 'masculino', 'acima_do_peso', 'p6']];
for (const [nome, genero, corpo, pele] of corpos) {
  for (const local of Object.keys(LOCAIS) as LocalDeTatuagem[]) {
    const vistas = [LOCAIS[local].frente ? 'frente' : null, LOCAIS[local].costas ? 'costas' : null].filter(Boolean) as ('frente' | 'costas')[];
    for (const vista of vistas) for (const perto of [1, 1.7]) {
      const foco = focoDaParte(genero, corpo, 30, local, LOCAIS[local].lados ? (local === 'antebraco' || local === 'coxa' || local === 'ombro' || local === 'mao' ? 'e' : 'd') : undefined, vista, perto);
      add(`${nome} · ${local} · ${vista} · ×${perto}`, <Figura visual={vis(pele)} genero={genero} idade={30} corpo={corpo} pecas={P(['bermuda_tactel', 'tenis_casual'])} semCima vista={vista} tatuagens={muitas} largura={180} semFundo foco={foco} />);
    }
  }
  add(`${nome} · inteiro`, <Figura visual={vis(pele)} genero={genero} idade={30} corpo={corpo} pecas={P(['bermuda_tactel', 'tenis_casual'])} semCima tatuagens={muitas} largura={180} semFundo foco={focoDaParte(genero, corpo, 30, 'inteiro', undefined, 'frente')} />);
  add(`${nome} · destaque`, <Figura visual={vis(pele)} genero={genero} idade={30} corpo={corpo} pecas={P(['bermuda_tactel', 'tenis_casual'])} semCima tatuagens={muitas} largura={64} semFundo destaque={focoDaParte(genero, corpo, 30, 'peito', undefined, 'frente')} />);
}
const html = (xs: typeof L) => `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{display:flex;flex-direction:column;align-items:center;background:#fbf8f2;padding:4px;border:1px solid #ddd}.c svg{border:1px solid #ccc}</style>${xs.map(x => `<div class=c>${x.html}<span>${x.t}</span></div>`).join('')}`;
writeFileSync(process.env.OUT!, html(L));
