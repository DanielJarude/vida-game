/**
 * HOTFIX 11.5.1 — a auditoria do catálogo de compras: em cada mercado (uma cidade grande e uma pequena), que lojas a
 * vida tem, quantas ofertas cada uma, quais ficam VAZIAS (loja que não vende nada), que produtos não têm loja nenhuma,
 * marcas sem produto, e a contagem por categoria.
 *
 *   npx esbuild scripts/sim/lojas1151.ts --bundle --platform=node --format=esm --outfile=<s>/l.mjs && node <s>/l.mjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { carregarRegiao } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { ESTABELECIMENTOS, MARCAS, NOME_CATEGORIA } from '../../src/motor/dados/lojas';
import { categoriaDoProduto, lojasDaVida, mercadoDe, ofertasDaLoja, produtosDaCategoria } from '../../src/motor/sistemas/lojas';
import { transacao } from '../../src/motor/nucleo';

for (const r of ['europa', 'america_norte', 'america_sul', 'asia', 'africa', 'oceania']) await carregarRegiao(r as never);
const PAISES = ['BR', 'AR', 'MX', 'US', 'GB', 'IT', 'ES', 'FR', 'JP', 'NG', 'AU'];
const vendidos = new Set<string>();
const marcasUsadas = new Set<string>();
for (const pais of PAISES) {
  const cs = cidadesDoPais(pais);
  if (!cs.length) { console.log(`${pais}: sem cidades carregadas`); continue; }
  const grande = cs.find(c => c.capitalNacional) ?? cs[0];
  const pequena = cs[cs.length - 1];
  for (const c of [grande, pequena]) {
    const v = transacao(adulto(30, { semente: 1 }), x => { x.moradia.municipioId = c.id; }).vida;
    const lojas = lojasDaVida(v);
    const linhas = lojas.map(l => { const o = ofertasDaLoja(v, l.id); o.forEach(x => { vendidos.add(`${x.produto.tipo}:${x.produto.id}`); if (x.marca) marcasUsadas.add(x.marca); }); return { l, n: o.length, produtos: new Set(o.map(x => x.produto.id)).size }; });
    const vazias = linhas.filter(x => x.n === 0).map(x => x.l.nome);
    const por = (t: string) => linhas.filter(x => x.l.tipo === t).length;
    console.log(`${pais} ${c.nome} (${mercadoDe(v)}): ${lojas.length} lojas (esp ${por('especializada')}, dep ${por('departamento')}, online ${por('online')}) · ofertas ${linhas.reduce((s, x) => s + x.n, 0)} · maior ${Math.max(...linhas.map(x => x.n))} (${linhas.sort((a, b) => b.n - a.n)[0].l.nome})${vazias.length ? ` · VAZIAS: ${vazias.join(', ')}` : ''}`);
  }
}
const cats = Object.keys(NOME_CATEGORIA) as (keyof typeof NOME_CATEGORIA)[];
const todos = cats.flatMap(c => produtosDaCategoria(c));
const semLoja = todos.filter(p => !vendidos.has(`${p.tipo}:${p.id}`));
console.log(`produtos: ${todos.length} (${cats.map(c => `${NOME_CATEGORIA[c]} ${produtosDaCategoria(c).length}`).join(', ')})`);
console.log(`sem loja em nenhum dos mercados: ${semLoja.length ? semLoja.map(p => p.id).join(', ') : 'nenhum'}`);
console.log(`marcas: ${MARCAS.length}; sem nenhum produto vendido: ${MARCAS.filter(m => !marcasUsadas.has(m.id)).map(m => m.nome).join(', ') || 'nenhuma'}`);
console.log(`estabelecimentos: ${ESTABELECIMENTOS.length} (esp ${ESTABELECIMENTOS.filter(e => e.tipo === 'especializada').length}, dep ${ESTABELECIMENTOS.filter(e => e.tipo === 'departamento').length}, online ${ESTABELECIMENTOS.filter(e => e.tipo === 'online').length})`);
// Categorias: um produto que cai numa categoria estranha?
void categoriaDoProduto;
