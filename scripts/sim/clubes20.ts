/**
 * VIDA 20 · sim: comprar um clube (pequeno ou grande) e administrá-lo por ANOS anos — um dono que investe (base,
 * obras, contratações com o caixa, promove os juniores bons, vende quem envelhece) e um dono passivo. Mede divisão,
 * títulos, acesso/queda, caixa e dívida, coerência (o clube na tabela da liga = o histórico do clube; nenhum jogador
 * duplicado), custo do ano e determinismo (DET=1).
 *   npx esbuild scripts/sim/clubes20.ts --bundle --platform=node --outfile=<scratch>/c20.cjs && node <scratch>/c20.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { clubesAVenda, mercadoDoAno, mediaDoElenco } from '../../src/motor/v20/clubes/clubes20';
import { anoDe } from '../../src/motor/tempo';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 6), ANOS = Number(process.env.ANOS ?? 30);
const faz = (v: Vida, oque: unknown) => { const a = { tipo: 'clube20', oque } as never; return podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v; };
const problemas: string[] = [];
let ms = 0, anos = 0;
function viver(s: number, alvo: 'pequeno' | 'grande', ativo: boolean): string {
  let v = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: 'feminino', municipioId: 'recife-pe', semente: 7000 + s * 31 });
  while (v.eu.tNasc > v.t - 30 * 12) { v = avancarAno(v).vida; v.momento = null; v.fila = undefined; }
  v.financas.conta += alvo === 'grande' ? 3e9 : 80e6;
  const lista = clubesAVenda(v, 'BR').filter(c => alvo === 'grande' ? c.porte === 'grande' : c.porte === 'regional' && c.divisao <= 2);
  const c0 = lista[s % lista.length];
  v = faz(v, { op: 'comprar', nome: c0.nome, pais: 'BR' });
  if (!v.clube20) return `${alvo}: não comprou ${c0.nome}`;
  const linha: string[] = [];
  for (let a = 0; a < ANOS && !v.morte; a++) {
    const c = v.clube20!;
    if (ativo) {
      v = faz(v, { op: 'base', nivel: 2 });
      for (const q of ['ct', 'base', 'estadio'] as const) v = faz(v, { op: 'obra', qual: q });
      for (const j of [...v.clube20!.juniores].filter(j => j.forca >= mediaDoElenco(v.clube20!) - 4)) v = faz(v, { op: 'promover', id: j.id });
      for (const j of [...v.clube20!.elenco].filter(j => anoDe(v.t) - anoDe(j.tNasc) >= 31)) v = faz(v, { op: 'vender', id: j.id });
      for (const m of mercadoDoAno(v).sort((x, y) => y.forca - x.forca).slice(0, 4)) v = faz(v, { op: 'contratar', id: m.id });
      for (const j of [...v.clube20!.elenco]) v = faz(v, { op: 'renovar', id: j.id });
      if (alvo === 'pequeno' && a % 5 === 0) v = faz(v, { op: 'aportar', valor: 8e6 });
    }
    void c;
    const t0 = performance.now(); v = avancarAno(v).vida; v.momento = null; v.fila = undefined; ms += performance.now() - t0; anos++;
    const cc = v.clube20;
    if (!cc) break;
    const ids = cc.elenco.map(j => j.id).concat(cc.juniores.map(j => j.id));
    if (new Set(ids).size !== ids.length) problemas.push(`${s}: jogador duplicado`);
    const nomes = cc.elenco.map(j => j.nome);
    const h = cc.historico.slice(-1)[0];
    const liga = v.caminhos.ligas?.BR;
    if (h && liga?.ultima?.ano === h.ano && h.posicao && h.divisao >= 2 && liga.ultima.tabelas?.[h.divisao as 2]?.[h.posicao - 1]?.[0] !== cc.nome) problemas.push(`${s}: histórico ${h.ano} ${h.posicao}º div${h.divisao} ≠ tabela`);
    if (!Number.isFinite(cc.caixa) || !Number.isFinite(cc.divida) || !Number.isFinite(cc.valor)) problemas.push(`${s}: número inválido`);
    void nomes;
    if (h) linha.push(`${h.ano % 100}:d${h.divisao}${h.posicao ? '/' + h.posicao : ''}${h.titulo ? 'T' : ''}${h.acesso ? '↑' : ''}${h.queda ? '↓' : ''}`);
  }
  const cc = v.clube20!;
  return `${alvo}${ativo ? ' ativo' : ' passivo'} ${c0.nome} (d${c0.divisao}, ${Math.round(c0.preco / 1e6)} mi): ${linha.join(' ')} | média ${mediaDoElenco(cc).toFixed(0)} infra ${cc.estadio}/${cc.ct}/${cc.base} caixa ${Math.round(cc.caixa / 1e6)} mi dívida ${Math.round(cc.divida / 1e6)} mi valor ${Math.round(cc.valor / 1e6)} mi tamanho ${JSON.stringify(cc).length}`;
}
const out: string[] = [];
for (let s = 0; s < N; s++) for (const alvo of ['pequeno', 'grande'] as const) for (const ativo of [true, false]) out.push(viver(s, alvo, ativo));
console.log(out.join('\n'));
console.log(`ms/ano ${(ms / anos).toFixed(1)} · problemas: ${problemas.length ? problemas.slice(0, 10).join('; ') : 'nenhum'}`);
if (process.env.DET) console.log('determinismo', viver(0, 'pequeno', true) === out[0] ? 'OK' : 'DIFERENTE');
