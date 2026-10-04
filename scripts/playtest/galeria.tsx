/**
 * FIX pós-playtest humano — a galeria da Aparência 2.0: todos os cortes (3 idades), os traços universais um a um e
 * famílias geradas pelo motor (pais → filhos → netos). Uso:
 *   npx esbuild scripts/playtest/galeria.tsx --bundle --platform=node --outfile=<scratch>/g.cjs && OUT=<scratch>/g.html node <scratch>/g.cjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { CORTES } from '../../src/motor/dados/estilo';
import { visualDaAncestralidade, visualDosPais } from '../../src/motor/sistemas/identidade';
import { rngDe } from '../../src/motor/rng';
import type { Genero, Visual } from '../../src/motor/tipos';

const cel = (v: Visual, g: Genero, i: number, s: string, t = 84) => `<td style="background:#1b1817;padding:2px">${renderToStaticMarkup(<Retrato visual={v} genero={g} idade={i} semente={s} tamanho={t} />)}</td>`;
let html = '<html><body style="background:#121010;margin:0;padding:12px;font:12px sans-serif;color:#bbb">';
html += '<h3>Cortes (adulto 30, criança 8, 60)</h3><table><tr>';
const base = (cabelo: string, pele = 'p3', cor = 'castanho_escuro'): Visual => ({ pele, cabelo, corCabelo: cor, olhos: 'castanho', calvicie: 'nao' });
CORTES.forEach((c, k) => { html += `<td style="text-align:center;vertical-align:top">${c.nome}<table><tr>${cel(base(c.id, ['p2', 'p4', 'p3', 'p5', 'p1', 'p6'][k % 6], ['preto', 'castanho', 'castanho_escuro', 'loiro', 'ruivo'][k % 5]), k % 3 === 0 ? 'masculino' : 'feminino', 30, 'g' + k)}</tr><tr>${cel(base(c.id), 'feminino', 8, 'c' + k, 60)}</tr><tr>${cel(base(c.id), 'masculino', 60, 'v' + k, 60)}</tr></table></td>`; if (k % 9 === 8) html += '</tr><tr>'; });
html += '</tr></table>';
html += '<h3>Traços (um de cada vez, o resto igual)</h3><table>';
const neutro: Visual = { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho_escuro', olhos: 'castanho', calvicie: 'nao', olhosForma: 'amendoado', nariz: 'medio', boca: 'media', rosto: 'oval', sobrancelha: 'media' };
const variar: [string, string[]][] = [['rosto', ['oval', 'redondo', 'quadrado', 'longo', 'coracao']], ['olhosForma', ['amendoado', 'redondo', 'caido', 'puxado']], ['olhosTam', ['pequenos', 'medios', 'grandes']], ['olhosDist', ['proximos', 'medios', 'afastados']], ['nariz', ['fino', 'medio', 'largo', 'arrebitado', 'curvo', 'pequeno']], ['boca', ['fina', 'media', 'cheia']], ['bocaLarg', ['estreita', 'media', 'larga']], ['sobrancelhaForma', ['reta', 'arqueada', 'angulosa']], ['queixo', ['suave', 'medio', 'marcado']], ['orelhas', ['coladas', 'medias', 'de_abano']], ['linhaCabelo', ['reta', 'bico', 'alta']], ['sardas', ['nao', 'poucas', 'muitas']]];
for (const [k, vs] of variar) html += `<tr><td>${k}</td>${vs.map(x => cel({ ...neutro, pele: k === 'sardas' ? 'p1' : neutro.pele, [k]: x } as Visual, 'masculino', 30, 'n', 72)).join('')}</tr>`;
html += `<tr><td>calvície cedo (28/44/60)</td>${[24, 32, 46, 60].map(i => cel({ ...neutro, calvicie: 'cedo' }, 'masculino', i, 'n', 72)).join('')}${cel({ ...neutro, calvicie: 'cedo', transplante: true }, 'masculino', 50, 'n', 72)}</tr>`;
html += '</table><h3>Famílias (pais, 4 filhos, 2 netos)</h3><table>';
for (const [k, [ancA, ancB]] of [[{ eu: 1 }, { af: 1 }], [{ ea: 1 }, { eu: 1 }], [{ sa: 1 }, { sa: 1 }], [{ eu: 0.5, am: 0.5 }, { mena: 1 }]].entries()) {
  const r = rngDe('fam', k);
  const a = visualDaAncestralidade(r, 'feminino', ancA as any);
  const b = visualDaAncestralidade(r, 'masculino', ancB as any);
  const anc = { ...(ancA as object), ...(ancB as object) } as any;
  const filhos = [0, 1, 2, 3].map(j => visualDosPais(rngDe('filho', k, j), j % 2 ? 'masculino' : 'feminino', anc, a, b));
  const conj = visualDaAncestralidade(rngDe('conj', k), 'masculino', { eu: 0.5, af: 0.5 } as any);
  const netos = [0, 1].map(j => visualDosPais(rngDe('neto', k, j), j ? 'masculino' : 'feminino', anc, filhos[0], conj));
  html += `<tr>${cel(a, 'feminino', 34, 'a' + k)}${cel(b, 'masculino', 36, 'b' + k)}<td style="width:14px"></td>${filhos.map((f, j) => cel(f, j % 2 ? 'masculino' : 'feminino', 12 + j * 3, 'f' + k + j)).join('')}<td style="width:14px"></td>${netos.map((f, j) => cel(f, j ? 'masculino' : 'feminino', 6, 'nt' + k + j)).join('')}</tr>`;
}
html += '</table></body></html>';
writeFileSync(process.env.OUT!, html);
