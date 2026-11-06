/** VIDA 12.9 — galeria dos piercings: rostos (gênero, idade, cabelo, barba, óculos) e o umbigo. OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { Figura, focoDaPeca } from '../../src/ui/avatar/Figura';
import { PIERCINGS } from '../../src/motor/dados/piercings129';
import type { Visual, Genero } from '../../src/motor/tipos';

const base: Visual = { pele: 'media', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanhos' } as Visual;
const rostos: [string, Genero, number, Partial<Visual>][] = [
  ['homem 30 curto', 'masculino', 30, {}],
  ['mulher 25 pixie', 'feminino', 25, { cabelo: 'pixie', pele: 'clara' } as Partial<Visual>],
  ['mulher 22 longo', 'feminino', 22, { cabelo: 'longo', pele: 'escura' } as Partial<Visual>],
  ['homem 40 barba', 'masculino', 40, { barba: 'cheia', pele: 'parda' } as Partial<Visual>],
  ['nb 19 óculos', 'nao_binario', 19, { cabelo: 'raspado', oculos: 'redondo' } as Partial<Visual>],
  ['idosa 72', 'feminino', 72, { cabelo: 'curto', corCabelo: 'grisalho', pele: 'clara' } as Partial<Visual>]
];
const conjuntos = [
  ['nariz ponto + helix trio + tragus', ['pc_nariz_ponto_zirconia', 'pc_helix_trio', 'pc_tragus_ponto']],
  ['septo + sobrancelha barra + labret', ['pc_septo_ferradura', 'pc_sobrancelha_barra', 'pc_labio_labret']],
  ['argolas: nariz, lábio, helix, sobrancelha', ['pc_nariz_argola_prata', 'pc_labio_argola', 'pc_helix_argola', 'pc_sobrancelha_argola']],
  ['ouro: nariz, septo, helix + brincos', ['pc_nariz_argola_ouro', 'pc_septo_clicker_ouro', 'pc_helix_ouro']]
];
const html: string[] = [];
for (const [nome, ids] of conjuntos) {
  html.push(`<h3>${nome}</h3><div class=l>`);
  for (const [r, g, i, x] of rostos) html.push(`<div class=c>${renderToStaticMarkup(<Retrato visual={{ ...base, ...x, piercings: ids as string[], ...(nome.includes('brincos') ? { brincos: true, modeloBrincos: 'brincos_ouro' } : {}) }} genero={g} idade={i} semente="g" tamanho={Number(process.env.TAM ?? 200)} rotulo={r} />)}<span>${r}</span></div>`);
  html.push('</div>');
}
html.push('<h3>umbigo</h3><div class=l>');
for (const id of PIERCINGS.filter(p => p.lugar === 'umbigo').map(p => p.id)) for (const [g, c] of [['feminino', 'mediano'], ['masculino', 'atletico']] as const) html.push(`<div class=c>${renderToStaticMarkup(<Figura visual={{ ...base, piercings: [id] }} genero={g} idade={25} semente="g" corpo={c} pecas={[]} semCima largura={220} semFundo foco={focoDaPeca(g, c, 25, 'umbigo')} />)}<span>${id} ${g}</span></div>`);
html.push('</div>');
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:12px sans-serif;background:#f4efe6;margin:8px;width:1600px}.l{display:flex;flex-wrap:wrap;gap:6px}.c{background:#fff;padding:4px;display:grid}</style>${html.join('')}`);
