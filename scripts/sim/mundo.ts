/**
 * Simulação do MUNDO (ATT Mundo, Parte 38): vidas em todos os países que
 * podem ser vividos, do nascimento até a morte, com as estratégias de vida
 * do simulador (`estrategias.ts`: familiar, ambicioso, estudioso, econômico).
 *
 *   npx esbuild scripts/sim/mundo.ts --bundle --platform=node --outfile=/tmp/mundo.cjs && VIDAS=4 node /tmp/mundo.cjs
 *
 * Mede, por país: escolaridade, ocupação e renda aos 35 (moeda local e unidade
 * do motor), patrimônio e idade na morte, dívida maior que o patrimônio na
 * morte — e confere que nada quebra (exceção, save que não reabre, extrato
 * que não fecha). Depois, um lote de MIGRAÇÕES (adultos de 30 anos que mudam
 * de país por cada porta) confere a conservação do valor de mercado.
 *
 * Não busca igualdade: países diferentes devem produzir trajetórias diferentes.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { interpretar } from '../../src/motor/save';
import { balanco, patrimonio } from '../../src/motor/sistemas/dinheiro';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { paisesVivenciaveis } from '../../src/motor/mundo/registro';
import { cidadesDoPais, sortearMunicipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { criarRng, type Rng } from '../../src/motor/rng';
import { converterEntrePaises, formatarDinheiro } from '../../src/motor/mundo/moeda';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { remuneracaoDe } from '../../src/motor/sistemas/renda';
import { avaliarMigracao } from '../../src/motor/sistemas/migracao';
import { entrarNaVida, paisDaVida } from '../../src/motor/mundo/vida';
import { podeTentar } from '../../src/motor/plausibilidade';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import type { MotivoMigracao, Vida } from '../../src/motor/tipos';
import { estrategia } from './estrategias';

const VIDAS = Number(process.env.VIDAS ?? 4);
const PERFIS = ['familiar', 'ambicioso', 'estudioso', 'economico'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);

let extratos = 0, extratosRuins = 0, erros = 0, savesRuins = 0;

function viverAno(v: Vida, r: Rng, e: ReturnType<typeof estrategia>): Vida {
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
  for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
  v = avancarAno(v).vida;
  responder();
  const x = v.financas.extrato;
  if (x?.contaFinal !== undefined && x.tFim === v.t) { extratos++; if (!conciliar(x).ok) extratosRuins++; }
  return v;
}

async function main() {
  const falhas = await carregarMundo();
  if (falhas.length) throw new Error(`regiões que não carregaram: ${falhas}`);
  console.log('país                 | escolaridade aos 35 (sup/méd/fund) | com trabalho aos 35 | renda líquida aos 35 (mediana)        | patrimônio na morte (mediana) | morte | dívida > patrimônio | ocupações (amostra)');
  for (const p of paisesVivenciaveis()) {
    const st = { esc: [0, 0, 0], trab: 0, n35: 0, renda: [] as number[], pat: [] as number[], morte: [] as number[], divida: 0, mortes: 0, ocup: new Set<string>() };
    for (let k = 0; k < VIDAS; k++) {
      const r = criarRng(1000 + k * 7919 + p.id.charCodeAt(0) * 31 + p.id.charCodeAt(1));
      const m = sortearMunicipio(() => r.next(), p.id);
      const g = r.chance(0.5) ? 'masculino' : 'feminino';
      const e = estrategia(PERFIS[k % PERFIS.length]);
      let v = criarVida({ nome: sortearNome(r, g, 2026, p.id, m.uf), sobrenome: sortearSobrenome(r, p.id, m.uf), genero: g, municipioId: m.id, semente: 5000 + k * 104729 + p.id.charCodeAt(1) * 13 });
      try {
        while (!v.morte && idade(v) < 100) {
          v = viverAno(v, r, e);
          if (idade(v) === 35) {
            st.n35++;
            const esc = v.educacao.escolaridade;
            st.esc[['superior', 'pos', 'mestrado', 'doutorado'].includes(esc) ? 0 : ['medio', 'tecnico', 'superior_incompleto'].includes(esc) ? 1 : 2]++;
            if (v.trabalho.atual) { st.trab++; st.renda.push(remuneracaoDe(v.trabalho.atual).liquido); st.ocup.add(ocupacao(v.trabalho.atual.ocupacaoId).nome[0]); }
          }
        }
        if (interpretar(JSON.stringify(v)).tipo !== 'ok') savesRuins++;
        if (v.morte) { st.mortes++; st.morte.push(idade(v)); const b = balanco(v); if (b.obrigacoes > b.ativos) st.divida++; }
        st.pat.push(patrimonio(v));
      } catch (err) {
        erros++;
        console.log(`ERRO ${p.id} (${idade(v)} anos): ${(err as Error).stack?.split('\n').slice(0, 4).join(' | ')}`);
      }
    }
    const pc = (a: number) => `${Math.round(100 * a / Math.max(1, st.n35))}%`;
    console.log(`${(p.id + ' ' + p.nome).padEnd(20)} | ${pc(st.esc[0])}/${pc(st.esc[1])}/${pc(st.esc[2])}`.padEnd(58) + ` | ${pc(st.trab).padEnd(19)} | ${(formatarDinheiro(med(st.renda), p.id) + ` (${Math.round(med(st.renda))} u)`).padEnd(37)} | ${formatarDinheiro(med(st.pat), p.id).padEnd(29)} | ${String(med(st.morte)).padEnd(5)} | ${st.divida}/${st.mortes}`.padEnd(20) + ` | ${[...st.ocup].slice(0, 4).join(', ')}`);
  }

  // ------------------------------------------------------------ Migrações
  console.log('\nMIGRAÇÕES (adulto de 30 anos, R$ 60 mil na conta, sem veículo): o valor de mercado se conserva?');
  const casos: [string, string, MotivoMigracao][] = [['sao-paulo-sp', 'AR', 'pessoal'], ['sao-paulo-sp', 'PT', 'pessoal'], ['recife-pe', 'US', 'trabalho'], ['belo-horizonte-mg', 'DE', 'estudo'], ['salvador-ba', 'JP', 'oportunidade'],
    ['curitiba-pr', 'AU', 'trabalho'], ['porto-alegre-rs', 'UY', 'pessoal'], ['fortaleza-ce', 'AO', 'pessoal'], ['manaus-am', 'NG', 'trabalho'], ['brasilia-df', 'KR', 'estudo']];
  let semPorta = 0, maiorDesvio = 0;
  for (const [de, para, motivo] of casos) {
    const r = criarRng(para.charCodeAt(0) * 97);
    let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: 'feminino', municipioId: de, semente: 9000 + para.charCodeAt(1) });
    const e = estrategia('ambicioso');
    while (idade(v) < 30 && !v.morte) v = viverAno(v, r, e);
    v = transacao(v, x => { x.momento = null; x.financas.conta += 60000; x.financas.bens = x.financas.bens.filter(b => b.tipo !== 'veiculo'); x.financas.dividas = x.financas.dividas.filter(d => !d.bemId); }).vida;
    const cidade = (cidadesDoPais(para).find(c => c.perfil === 'metropole') ?? cidadesDoPais(para)[0]).id;
    const av = avaliarMigracao(v, cidade, motivo);
    entrarNaVida(v);
    const antes = patrimonio(v);
    const n = executar(v, { tipo: 'migrar', municipioId: cidade, motivo }).vida;
    if (n === v) { semPorta++; console.log(`  ${de} → ${para} (${motivo}): porta fechada — ${av.veredito.motivo}`); continue; }
    const esperado = (antes - av.custo) * converterEntrePaises(1, 'BR', para);
    const depois = patrimonio(n);
    const desvio = Math.abs(depois - esperado) / Math.max(1, Math.abs(esperado));
    maiorDesvio = Math.max(maiorDesvio, desvio);
    let w = n;
    for (let k = 0; k < 5 && !w.morte; k++) w = viverAno(w, r, e);
    entrarNaVida(w);
    console.log(`  ${de} → ${para} (${motivo}, via ${av.via}): ${formatarDinheiro(antes, 'BR')} → ${formatarDinheiro(depois, para)} (esperado ${formatarDinheiro(esperado, para)}, desvio ${(desvio * 100).toFixed(2)}%) · 5 anos depois: mora ${paisDaVida(w)}, adaptação ${w.mundo?.adaptacao}, línguas ${w.mundo?.idiomas.join(',') || '—'}, trabalho ${w.trabalho.atual ? ocupacao(w.trabalho.atual.ocupacaoId).nome[0] : '—'}`);
  }
  console.log(`\nerros: ${erros} · saves que não reabrem: ${savesRuins} · extratos conferidos: ${extratos}, sem fechar: ${extratosRuins} · migrações sem porta: ${semPorta}/${casos.length} · maior desvio da conservação: ${(maiorDesvio * 100).toFixed(2)}%`);
}
void main();
