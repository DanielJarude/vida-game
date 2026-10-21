/**
 * REWORK 10 · CRI-01 / §17 — trajetórias à margem, vividas pelo motor dos 18 aos 60 anos, com estratégias:
 *
 *   honesta      recusa toda proposta (o caminho nunca começa por escolha)
 *   isolada      entra aos 18 num delito (pequeno ou patrimonial) e larga no ano seguinte
 *   carreira     entra aos 18 e vai fundo: aceita os trabalhos maiores, segue no rumo, enfrenta os atritos
 *   arrependida  entra aos 18, vai até o nível 2, pede ajuda aos 24 e reconstrói
 *   fraude       com acesso (escritório), entra na fraude aos 30 e segue
 *
 * Mede: quem foi processado, preso, absolvido; anos de prisão; o que entrou por fora; o patrimônio aos 45; a renda
 * formal aos 40; a idade ao morrer; a ficha; quem voltou à vida civil (trabalhando 5 anos depois da saída).
 *
 *   npx esbuild scripts/sim/crime10.ts --bundle --platform=node --outfile=<scratch>/c10.cjs && N=40 node <scratch>/c10.cjs
 */
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade, transacao } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { patrimonio } from '../../src/motor/sistemas/dinheiro';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import type { Vida } from '../../src/motor/tipos';
import { disponibilidade } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { agente } from './agentes';

/** O resto da vida é o de uma pessoa comum (o agente "prudente": trabalha, guarda, sai de casa com renda). */
const COMUM = agente('prudente');

const N = Number(process.env.N ?? 30);
type Estrategia = 'honesta' | 'isolada' | 'carreira' | 'arrependida' | 'fraude';
const ESTRATEGIAS: Estrategia[] = ['honesta', 'isolada', 'carreira', 'arrependida', 'fraude'];

function escolher(v: Vida, e: Estrategia): string {
  const m = v.momento!;
  const tem = (re: RegExp) => m.opcoes.find(o => re.test(o.id) && !o.bloqueio)?.id;
  const id = m.situacaoId;
  if (id === 'ilic_proposta') return (e === 'carreira' || e === 'fraude' ? tem(/aceitar/) : tem(/recusar/)) ?? m.opcoes[0].id;
  if (id === 'ilic_rumo') return (e === 'carreira' || e === 'fraude' ? tem(/fundo|seguir/) : e === 'arrependida' && idade(v) >= 24 ? tem(/parar/) : tem(/parar/)) ?? m.opcoes[0].id;
  if (id === 'ilic_trabalho') return (e === 'carreira' ? tem(/participar/) : tem(/sair|recusar/)) ?? m.opcoes[0].id;
  if (id === 'ilic_atrito') return (e === 'carreira' ? tem(/enfrentar/) : tem(/sair|ceder/)) ?? m.opcoes[0].id;
  if (id === 'ilic_cerco') return (e === 'carreira' ? tem(/advogado|sumir/) : tem(/assumir|sumir/)) ?? m.opcoes[0].id;
  if (id === 'jus_defesa') return tem(/particular/) ?? tem(/publica/) ?? m.opcoes[0].id;
  if (id === 'jus_acordo') return tem(/aceitar/) ?? m.opcoes[0].id;
  if (id === 'jus_fianca') return tem(/pagar/) ?? tem(/esperar/) ?? m.opcoes[0].id;
  if (id === 'jus_recurso') return tem(/recorrer/) ?? m.opcoes[0].id;
  if (id === 'pri_saida') return (e === 'carreira' ? tem(/antigos/) : tem(/programa/)) ?? m.opcoes[0].id;
  return COMUM.decidir(v, m, criarRng(v.t));
}

const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const f = (x: number) => (Number.isFinite(x) ? Math.round(x).toLocaleString('pt-BR') : '—');

async function main() {
  await carregarMundo();
  const linhas: string[] = [];
  for (const e of ESTRATEGIAS) {
    const m = { processado: 0, preso: 0, absolvido: 0, anosPresos: [] as number[], ganhos: [] as number[], pat45: [] as number[], renda40: [] as number[], morte: [] as number[], ficha: 0, reintegrado: 0, saiu: 0, reabilitado: 0, vidas: 0 };
    for (let s = 0; s < N; s++) {
      let v = viverAte(nova({ semente: 9000 + s * 7 + ESTRATEGIAS.indexOf(e), genero: s % 2 ? 'masculino' : 'feminino' }), 18);
      if (v.morte) continue;
      m.vidas++;
      v = transacao(v, x => { x.momento = null; }).vida;
      let preso = 0;
      for (let a = 18; a < 60 && !v.morte; a++) {
        const i = idade(v);
        if (i === 18 && (e === 'isolada' || e === 'carreira' || e === 'arrependida')) v = transacao(v, (x, r) => entrar(x, e === 'isolada' ? (s % 2 ? 'pequenos' : 'patrimonial') : 'mercado', undefined, r)).vida;
        if (i === 19 && e === 'isolada' && v.caminhos.envolvimento?.parou === undefined) v = executar(v, { tipo: 'parar_por_fora' }).vida;
        if (i === 20 && e === 'arrependida' && v.caminhos.envolvimento && v.caminhos.envolvimento.nivel < 2) v = transacao(v, x => { x.caminhos.envolvimento!.nivel = 2; }).vida;
        if (i === 24 && e === 'arrependida') v = executar(v, { tipo: 'margem', oque: 'procurar_ajuda' }).vida;
        if (i === 30 && e === 'fraude') v = transacao(v, (x, r) => { if (!x.trabalho.atual) contratar(x, r, ocupacao('aux_adm'), 'teste'); entrar(x, 'fraude', undefined, r); }).vida;
        // O resto da vida: o que uma pessoa comum faz (trabalhar, guardar) — a comparação é com uma vida honesta de verdade.
        for (const a of COMUM.agir(v, criarRng(v.t + s))) if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida;
        // Quem quer reconstruir aceita o programa de apoio (a porta que a saída ou o pedido de ajuda abriu).
        if (e !== 'carreira' && !v.trabalho.atual && !v.justica?.prisao) for (const o of v.caminhos.oportunidades.filter(x => x.tipo === 'reinsercao')) { const a = { tipo: 'oportunidade' as const, id: o.id, aceitar: true }; if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida; }
        // Uma ação pode abrir uma decisão (a entrevista do programa): responde antes do ano andar.
        for (let k = 0; k < 10 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: escolher(v, e) }).vida;
        v = avancarAno(v).vida;
        for (let k = 0; k < 10 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: escolher(v, e) }).vida;
        if (v.momento) v = transacao(v, x => { x.momento = null; }).vida;
        if (v.justica?.prisao) preso++;
        if (idade(v) === 45) m.pat45.push(patrimonio(v));
        if (idade(v) === 40) m.renda40.push(v.trabalho.atual?.salario ?? 0);
        // Reabilitação, quando a lei deixa.
        if (v.justica?.antecedentes.some(x => (x.desfecho === 'prisao' || x.desfecho === 'alternativa') && !x.reabilitado)) v = executar(v, { tipo: 'margem', oque: 'reabilitacao' }).vida;
      }
      const j = v.justica;
      if (v.fatos['respondeu_processo'] !== undefined) m.processado++;
      if (v.fatos['esteve_preso'] !== undefined) m.preso++;
      if (j?.antecedentes.some(x => x.desfecho === 'absolvicao')) m.absolvido++;
      if (j?.antecedentes.some(x => x.desfecho === 'prisao' || x.desfecho === 'alternativa')) m.ficha++;
      if (j?.antecedentes.some(x => x.reabilitado !== undefined)) m.reabilitado++;
      if (process.env.DEBUG === e && j?.tSaida !== undefined) console.error(e, s, 'saida', Math.round((j.tSaida - v.eu.tNasc) / 12), 'idade', idade(v), 'preso', !!j.prisao, 'atual', v.trabalho.atual?.ocupacaoId, v.trabalho.atual?.tInicio !== undefined ? Math.round((v.trabalho.atual.tInicio - v.eu.tNasc) / 12) : '-', 'hist', v.trabalho.historico.filter(h => h.tInicio > j.tSaida!).length, 'morte', !!v.morte);
      if (j?.tSaida !== undefined) { m.saiu++; if (!j.prisao && (v.trabalho.atual || v.trabalho.aposentadoria || v.trabalho.historico.some(h => h.tFim > j.tSaida!))) m.reintegrado++; }
      m.anosPresos.push(preso);
      m.ganhos.push(v.caminhos.envolvimento?.ganhos ?? 0);
      if (v.morte) m.morte.push(Math.round((v.morte.t - v.eu.tNasc) / 12));
    }
    linhas.push(`| ${e} | ${m.vidas} | ${Math.round(m.processado / m.vidas * 100)}% | ${Math.round(m.absolvido / m.vidas * 100)}% | ${Math.round(m.preso / m.vidas * 100)}% | ${pct(m.anosPresos, 0.5)} · ${pct(m.anosPresos, 0.9)} | ${f(pct(m.ganhos, 0.5))} | ${f(pct(m.pat45, 0.1))} · ${f(pct(m.pat45, 0.5))} · ${f(pct(m.pat45, 0.9))} | ${f(pct(m.renda40, 0.5))} | ${Math.round(m.ficha / m.vidas * 100)}% | ${m.saiu ? `${m.reintegrado}/${m.saiu}` : '—'} | ${m.reabilitado} | ${m.morte.length ? pct(m.morte, 0.5) : '—'} |`);
    console.error(e, 'ok');
  }
  console.log('| estratégia | vidas | processadas | absolvidas | presas | anos presos (med · p90) | ganhos por fora (med) | patrimônio aos 45 (p10 · med · p90) | renda aos 40 (med) | com ficha | trabalhando depois da saída (fora da prisão) | reabilitadas | morreu antes dos 60 (idade med) |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const l of linhas) console.log(l);
}
main();
