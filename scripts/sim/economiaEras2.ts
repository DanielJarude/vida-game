// ERAS v2 — a economia da época: salários por ocupação e ano, a cesta no mínimo e a saúde financeira de vidas inteiras.
// Uso: npx esbuild scripts/sim/economiaEras2.ts --bundle --platform=node --format=esm --outfile=X.mjs && node X.mjs [N]
import { nova, responderTudo } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { formatarDinheiro } from '../../src/motor/mundo/moeda';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { salarioLocal } from '../../src/motor/sistemas/renda';
import { orcamento, condicaoEconomica } from '../../src/motor/sistemas/dinheiro';
import { poderDeCompra } from '../../src/motor/eras/base/economia';
import { idade } from '../../src/motor/nucleo';
import { anoDe } from '../../src/motor/tempo';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const OCS = ['ambulante', 'caixa', 'porteiro', 'motorista_onibus', 'vendedor', 'professor_infantil', 'tec_enfermagem', 'aux_adm', 'contador', 'enfermeiro', 'dev_pleno', 'medico', 'cirurgiao', 'gerente_adm'];
const ANOS = [1981, 1985, 1990, 1995, 2000, 2004, 2010, 2014, 2020, 2025];
console.log('## Salário bruto em São Paulo (motor = reais de hoje; entre parênteses, o nominal da época)');
console.log('ocupação'.padEnd(20) + ANOS.map(a => String(a).padStart(10)).join('') + '      hoje');
for (const id of OCS) {
  const oc = ocupacao(id);
  let l = id.padEnd(20);
  for (const a of ANOS) {
    const v = nova({ semente: a, municipioId: 'sao-paulo-sp', ano: a, era: true } as never);
    v.t = a * 12 + 5; entrarNaVida(v);
    l += String(salarioLocal(oc, 'sao-paulo-sp')).padStart(10);
  }
  const c = nova({ semente: 1, municipioId: 'sao-paulo-sp' }); entrarNaVida(c);
  l += String(salarioLocal(oc, 'sao-paulo-sp')).padStart(10);
  console.log(l);
}
console.log('\n## Poder de compra');
for (const a of ANOS) { const p = poderDeCompra(a); console.log(a, `cesta=${p.cestaNoMinimo}% do mínimo`, `renda=${p.renda.toFixed(2)}`, `mínimo=${p.minimo.toFixed(2)}`, p.destaques.map(d => `${d.nome} ×${d.fator.toFixed(2)}`).join(', ')); }

// Vidas inteiras: estado financeiro aos 25, 35 e 45.
const N = Number(process.argv[2] ?? 12);
console.log(`\n## ${N} vidas por época (São Paulo, Recife, interior de MG), até os 45`);
const CIDADES = ['sao-paulo-sp', 'recife-pe', 'uberlandia-mg'];
for (const ano of [1982, 1992, 2002, undefined]) {
  const marcos: Record<number, string[]> = { 25: [], 35: [], 45: [] };
  const neg: Record<number, number> = { 25: 0, 35: 0, 45: 0 };
  for (let k = 0; k < N; k++) {
    let v: Vida = nova({ semente: 7000 + k * 13 + (ano ?? 0), municipioId: CIDADES[k % 3], ...(ano ? { ano, era: true } : {}) } as never);
    for (let i = 0; i < 45 && !v.morte; i++) {
      v = responderTudo(avancarAno(v).vida);
      entrarNaVida(v);
      const id = idade(v);
      if (marcos[id]) {
        const o = orcamento(v); const ce = condicaoEconomica(v);
        marcos[id].push(ce.faixa);
        if (ce.nivel === 'no_vermelho' || ce.nivel === 'apertado') neg[id]++;
        if (k < 2) console.log(`   ${ano ?? 'hoje'} #${k} ${anoDe(v.t)} ${id} anos · ${v.trabalho.atual?.ocupacaoId ?? '-'} ${v.trabalho.atual ? formatarDinheiro(v.trabalho.atual.salario) : ''} · conta ${formatarDinheiro(v.financas.conta)} · renda/mês ${Math.round(o.renda)} desp ${Math.round(o.despesa)} · ${ce.faixa}/${ce.nivel}`);
      }
    }
  }
  const cont = (l: string[]) => Object.entries(l.reduce((s, x) => ({ ...s, [x]: (s[x] ?? 0) + 1 }), {} as Record<string, number>)).map(([a, b]) => `${a}:${b}`).join(' ');
  console.log(`${ano ?? 'contemporânea'}: aos 25 [${cont(marcos[25])}] aperto ${neg[25]} · aos 35 [${cont(marcos[35])}] aperto ${neg[35]} · aos 45 [${cont(marcos[45])}] aperto ${neg[45]}`);
}
