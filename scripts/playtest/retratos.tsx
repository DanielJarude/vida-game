import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
const idades = [1, 5, 10, 15, 25, 50, 72, 85];
const linhas: [string, any, string][] = [
  ['feminino', { pele: 'p2', cabelo: 'longo_liso', corCabelo: 'castanho', olhos: 'verde' }, 'f1'],
  ['feminino', { pele: 'p5', cabelo: 'black', corCabelo: 'preto', olhos: 'castanho_escuro' }, 'f2'],
  ['feminino', { pele: 'p3', cabelo: 'cacheado_longo', corCabelo: 'castanho_escuro', olhos: 'mel' }, 'f3'],
  ['feminino', { pele: 'p1', cabelo: 'chanel', corCabelo: 'loiro', olhos: 'azul' }, 'f4'],
  ['feminino', { pele: 'p6', cabelo: 'trancas', corCabelo: 'preto', olhos: 'castanho' }, 'f5'],
  ['masculino', { pele: 'p3', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho', barba: 'curta' }, 'm1'],
  ['masculino', { pele: 'p5', cabelo: 'crespo_curto', corCabelo: 'preto', olhos: 'castanho_escuro', barba: 'cavanhaque' }, 'm2'],
  ['masculino', { pele: 'p1', cabelo: 'ondulado', corCabelo: 'ruivo', olhos: 'azul', barba: 'cheia' }, 'm3x'],
  ['masculino', { pele: 'p4', cabelo: 'raspado', corCabelo: 'castanho_escuro', olhos: 'castanho', barba: 'bigode' }, 'm4'],
  ['nao_binario', { pele: 'p3', cabelo: 'rabo', corCabelo: 'castanho_claro', olhos: 'mel' }, 'n1'],
];
let html = '<html><body style="background:#121010;margin:0;padding:12px;font:12px sans-serif;color:#bbb"><table>';
html += '<tr><td></td>' + idades.map(i => `<td style="text-align:center">${i}</td>`).join('') + '</tr>';
for (const [g, vis, s] of linhas) {
  html += `<tr><td>${g.slice(0,4)} ${vis.cabelo}</td>` + idades.map(i => `<td style="background:#1b1817;padding:2px">${renderToStaticMarkup(<Retrato visual={vis} genero={g as any} idade={i} semente={s} tamanho={96} />)}</td>`).join('') + '</tr>';
}
html += `<tr><td>pets</td><td>${renderToStaticMarkup(<Retrato genero="masculino" idade={3} especie="cachorro" semente="a" tamanho={96}/>)}</td><td>${renderToStaticMarkup(<Retrato genero="feminino" idade={3} especie="gato" semente="b" tamanho={96}/>)}</td></tr>`;
html += '</table></body></html>';
writeFileSync(process.env.OUT!, html);
