/**
 * Auditoria das dívidas no fim da vida (pendência 6 do pacote pré-América do
 * Sul: "42% das mortes simuladas deixam mais dívida que patrimônio").
 *
 *   npx esbuild scripts/sim/dividas.ts --bundle --platform=node --outfile=/tmp/div.cjs
 *   VIDAS=6 node /tmp/div.cjs            (vidas por política × classe)
 *   POLITICAS=primeira,prudente CLASSES=vulneravel,media DETALHE=1 node /tmp/div.cjs
 *
 * Não é calibração: é diagnóstico. Cada vida é vivida do nascimento à morte
 * (ou aos 95) pelo que o jogador pode fazer (`disponibilidade` → `executar`)
 * e pelo ano do motor (`avancarAno`). Para cada ano, guarda o que o extrato
 * diz (`financas.extrato`: a linha que cobriu o buraco do ano no cartão, o
 * atraso, as contas que viraram nome sujo), a dívida que nasceu fora do
 * fechamento (empréstimo, acordo, crédito, o que o leilão não cobriu), o
 * juro que o rotativo somou e a situação da pessoa (trabalhando, aposentada,
 * sem renda, podendo se aposentar e não aposentada). Na morte: a dívida é
 * maior que o patrimônio? De que tipo? Desde quando? O que a gerou?
 *
 * Políticas (agentes, em `agentes.ts`):
 *   primeira          — a do `sucessao.ts`: nenhuma ação, a primeira opção livre de cada decisão;
 *   primeira_trabalha — a mesma, mais procurar trabalho quando não tem e aposentar quando pode;
 *   prudente          — o que uma pessoa comum faz com o dinheiro (trabalha, guarda, mata o cartão);
 *   economico / gastador — as estratégias do simulador geral (`estrategias.ts`).
 *
 * Andaime (o mesmo do `sucessao.ts`, ANDAIME=0 desliga): quem chega aos 30 sem
 * filhos ganha parceria e dois filhos — para medir a mesma população.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { balanco, orcamento, rendaPropriaMensal } from '../../src/motor/sistemas/dinheiro';
import { totalAplicado } from '../../src/motor/sistemas/investimentos';
import { moraComFamiliaDeOrigem } from '../../src/motor/sistemas/domicilio';
import { podeAposentar } from '../../src/motor/sistemas/trabalho';
import { calcularHeranca } from '../../src/motor/sistemas/partilha';
import { partilhar } from '../../src/motor/sistemas/sucessao';
import { criarRng } from '../../src/motor/rng';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { garantirVida } from '../../src/motor/sistemas/filhos';
import type { Classe, Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const VIDAS = Number(process.env.VIDAS ?? 6);
const POLITICAS = (process.env.POLITICAS ?? 'primeira,primeira_trabalha,prudente,economico,gastador').split(',');
const CLASSES = (process.env.CLASSES ?? 'vulneravel,trabalhadora,media_baixa,media,alta').split(',') as Classe[];
const ANDAIME = process.env.ANDAIME !== '0';
const DETALHE = !!process.env.DETALHE;
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'belem-pa', 'belo-horizonte-mg', 'salvador-ba'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fmt = (x: number) => `R$ ${Math.round(x).toLocaleString('pt-BR')}`;
const pct = (a: number, b: number) => (b ? `${Math.round(a / b * 100)}%` : '—');
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };

/* =============================================================== Andaime */

function garantirFamilia(v: Vida): Vida {
  if (!ANDAIME || idade(v) !== 30 || Object.values(v.vinculos).some(x => x.parentesco === 'filho')) return v;
  const n = structuredClone(v);
  const r = criarRng(n.seq + 99);
  const par = criarPessoa(n, r, { idade: 31, genero: n.eu.genero === 'feminino' ? 'masculino' : 'feminino', municipioId: n.moradia.municipioId });
  const vp = vincular(n, par, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
  vp.romance = { estagio: 'casamento', tEstagio: n.t - 36, tInicio: n.t - 60, envolvimento: 80 };
  n.fatos[`uniao_${par.id}`] = n.t - 36;
  n.fatos[`patrimonio_uniao_${par.id}`] = Math.max(0, balanco(n).liquido);
  for (const k of [3, 1]) {
    const g = r.chance(0.5) ? 'masculino' : 'feminino';
    const f = criarPessoa(n, r, { idade: k, genero: g, municipioId: n.moradia.municipioId, sobrenome: n.eu.sobrenome });
    f.genitores = ['eu', par.id];
    vincular(n, f, { parentesco: 'filho', origem: 'familia', proximidade: 85, convivio: ['casa'] }).tInicio = f.tNasc;
    garantirVida(f);
  }
  return n;
}

/* ============================================================ Medição */

type Situacao = 'trabalhando' | 'aposentado' | 'elegivel_sem_aposentar' | 'sem_renda' | 'outra_renda' | 'na_familia';

interface Ano {
  idade: number;
  situacao: Situacao;
  renda: number;
  despesa: number;
  ativos: number;
  /** Dívida cara (cartão, empréstimo, acordo, atraso) — fora os financiamentos presos a um bem. */
  cara: number;
  financiamentos: number;
  /** O fechamento cobriu o buraco do ano no cartão / em atraso / em contas sem pagar. */
  romboCartao: number;
  romboAtraso: number;
  romboSemPagar: number;
  resgateRombo: number;
  familiaRombo: number;
  /** Juro que o rotativo somou no ano (saldo de antes × (1+j)^12 − saldo). */
  jurosCartao: number;
  /** Dívida que nasceu fora do fechamento: rótulo → valor. */
  novas: Record<string, number>;
  /** O maior grupo de despesa do ano (onde o dinheiro foi). */
  maiorGasto: string;
  /** As maiores saídas do mês (rótulo e valor), para o detalhe. */
  saidas: string;
  plano: boolean;
}

interface Resultado {
  politica: string;
  classe: Classe;
  idadeMorte: number;
  causa: string;
  insolvente: boolean;
  naoCoberto: number;
  ativos: number;
  obrigacoes: number;
  porTipo: Record<string, number>;
  anos: Ano[];
}

function situacao(v: Vida): Situacao {
  if (moraComFamiliaDeOrigem(v) && !v.trabalho.atual) return 'na_familia';
  if (v.trabalho.atual) return 'trabalhando';
  if (v.trabalho.aposentadoria) return 'aposentado';
  if (podeTentar(podeAposentar(v))) return 'elegivel_sem_aposentar';
  return rendaPropriaMensal(v) > 0 ? 'outra_renda' : 'sem_renda';
}

const caraDe = (v: Vida) => v.financas.dividas.filter(d => d.tipo !== 'financiamento_imovel' && d.tipo !== 'financiamento_veiculo').reduce((s, d) => s + d.saldo, 0) + (v.moradia.atraso ?? 0) * v.moradia.aluguel;

function viverUmaVida(politica: string, classe: Classe, s: number): Resultado {
  const r = criarRng(s * 31 + 7);
  const ag = agente(politica);
  let v = criarVida({ nome: 'Ana', sobrenome: 'Teste', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 81000 + s * 13 + CLASSES.indexOf(classe), classe });
  const anos: Ano[] = [];
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; };
  while (!v.morte && idade(v) < 95) {
    for (const a of ag.agir(v, r)) { if (v.morte) break; if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    const antes = new Map(v.financas.dividas.map(d => [d.id, { ...d }]));
    const jurosCartao = v.financas.dividas.filter(d => d.tipo === 'cartao').reduce((t, d) => t + d.saldo * (Math.pow(1 + (v.financas.negativado ? 0.01 : d.jurosMes), 12) - 1), 0);
    v = avancarAno(v).vida;
    responder();
    v = garantirFamilia(v);
    const i = idade(v);
    if (i < 18) continue;
    const e = v.financas.extrato;
    const linha = (rot: string) => e?.linhas.filter(l => l.rotulo.startsWith(rot)).reduce((t, l) => t + l.conta, 0) ?? 0;
    const novas: Record<string, number> = {};
    for (const d of v.financas.dividas) {
      if (antes.has(d.id) || d.id.startsWith('cartao') || d.descricao === 'Acordo de renegociação') continue;
      const k = d.descricao.replace(/^Em cobrança: /, '').replace(/ (de|para) [A-ZÀ-Ú].*$/, '');
      novas[k] = (novas[k] ?? 0) + d.saldo;
    }
    const o = orcamento(v);
    const grupos = new Map<string, number>();
    for (const l of o.saidas) grupos.set(l.grupo, (grupos.get(l.grupo) ?? 0) - l.valor);
    const maiorGasto = [...grupos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const b = balanco(v);
    anos.push({
      idade: i, situacao: situacao(v), renda: o.renda, despesa: o.despesa, ativos: b.ativos, cara: caraDe(v), financiamentos: b.financiamentos,
      romboCartao: linha('Coberto no cartão'), romboAtraso: linha('Parcelas e aluguel que ficaram em atraso'), romboSemPagar: linha('Contas que ficaram sem pagar'),
      resgateRombo: linha('Tirado das aplicações para cobrir'), familiaRombo: linha('A família cobriu'),
      jurosCartao, novas, maiorGasto, plano: v.financas.planoDeSaude,
      saidas: [...o.saidas].sort((a, b) => a.valor - b.valor).slice(0, 4).map(l => `${l.rotulo.slice(0, 28)} ${Math.round(-l.valor)}`).join('; ')
    });
  }
  let causa = v.morte?.causa ?? 'velhice (corte aos 95)';
  if (!v.morte) v = { ...structuredClone(v), morte: { t: v.t, causa, heranca: calcularHeranca(v) } };
  const p = partilhar(v, {});
  const b = balanco(v);
  const porTipo: Record<string, number> = {};
  for (const d of v.financas.dividas) porTipo[d.tipo] = (porTipo[d.tipo] ?? 0) + d.saldo;
  if (v.moradia.atraso) porTipo['aluguel_atrasado'] = v.moradia.atraso * v.moradia.aluguel;
  void totalAplicado; causa = String(causa);
  return { politica, classe, idadeMorte: idade(v), causa, insolvente: p.naoCoberto > 0, naoCoberto: p.naoCoberto, ativos: b.ativos, obrigacoes: b.obrigacoes, porTipo, anos };
}

/* ============================================================ Relatório */

const resultados: Resultado[] = [];
const t0 = Date.now();
for (const pol of POLITICAS) for (const cl of CLASSES) for (let s = 1; s <= VIDAS; s++) resultados.push(viverUmaVida(pol, cl, s));

function resumo(rs: Resultado[], titulo: string): void {
  const ins = rs.filter(x => x.insolvente);
  const grandes = ins.filter(x => x.naoCoberto >= 5000).length;
  const linha = [`${titulo.padEnd(26)}`, `n=${String(rs.length).padStart(3)}`, `insolventes ${pct(ins.length, rs.length).padStart(4)}`, `com mais de R$ 5 mil não cobertos ${pct(grandes, rs.length).padStart(4)}`, `idade morte med ${med(rs.map(x => x.idadeMorte))}`, `não coberto med ${fmt(med(ins.map(x => x.naoCoberto)))}`];
  console.log(linha.join(' · '));
}

console.log(`# Auditoria das dívidas — ${resultados.length} vidas (${VIDAS} por política × classe), andaime ${ANDAIME ? 'ligado' : 'desligado'}, ${Math.round((Date.now() - t0) / 1000)} s`);
console.log('\n## Morte com dívida maior que o patrimônio (partilha: naoCoberto > 0)');
resumo(resultados, 'TODAS');
for (const pol of POLITICAS) resumo(resultados.filter(x => x.politica === pol), pol);
console.log('');
for (const cl of CLASSES) resumo(resultados.filter(x => x.classe === cl), cl);
console.log('\n## Política × classe (insolventes / n)');
console.log(`${''.padEnd(12)}${CLASSES.map(c => c.padStart(14)).join('')}`);
for (const pol of POLITICAS) console.log(`${pol.padEnd(12)}${CLASSES.map(c => { const rs = resultados.filter(x => x.politica === pol && x.classe === c); return `${rs.filter(x => x.insolvente).length}/${rs.length}`.padStart(14); }).join('')}`);

for (const pol of POLITICAS) {
  const rs = resultados.filter(x => x.politica === pol);
  const ins = rs.filter(x => x.insolvente);
  console.log(`\n## ${pol}: de onde vem a dívida (${ins.length} insolventes de ${rs.length})`);
  if (!ins.length) continue;
  // Composição no fim.
  const tipos = new Map<string, number>();
  for (const x of ins) for (const [t, s] of Object.entries(x.porTipo)) tipos.set(t, (tipos.get(t) ?? 0) + s);
  const total = [...tipos.values()].reduce((a, b) => a + b, 0);
  console.log(`dívida na morte por tipo: ${[...tipos.entries()].sort((a, b) => b[1] - a[1]).map(([t, s]) => `${t} ${pct(s, total)}`).join(' · ')}`);
  // Quando começa: primeiro ano adulto com dívida cara > ativos.
  const inicio = ins.map(x => x.anos.find(a => a.cara > a.ativos && a.cara > 500)?.idade ?? x.idadeMorte);
  console.log(`a dívida cara passa dos ativos pela primeira vez aos (mediana): ${med(inicio)} · anos seguidos devendo mais que tem até a morte (mediana): ${med(ins.map(x => { let k = 0; for (let j = x.anos.length - 1; j >= 0 && x.anos[j].cara > x.anos[j].ativos; j--) k++; return k; }))}`);
  // O que gerou: a soma ao longo da vida.
  const soma = (f: (a: Ano) => number) => ins.reduce((t, x) => t + x.anos.reduce((u, a) => u + f(a), 0), 0);
  const romboC = soma(a => a.romboCartao), juros = soma(a => a.jurosCartao), atraso = soma(a => a.romboAtraso), semPagar = soma(a => a.romboSemPagar);
  const novas = new Map<string, number>();
  for (const x of ins) for (const a of x.anos) for (const [k, s] of Object.entries(a.novas)) novas.set(k, (novas.get(k) ?? 0) + s);
  const novasTot = [...novas.values()].reduce((p, q) => p + q, 0);
  const gerado = romboC + juros + atraso + novasTot;
  console.log(`o que gerou dívida (vida inteira): buraco do ano no cartão ${pct(romboC, gerado)} · juros do rotativo ${pct(juros, gerado)} · atraso de parcela/aluguel ${pct(atraso, gerado)} · dívidas novas fora do fechamento ${pct(novasTot, gerado)} (${[...novas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, s]) => `${k} ${fmt(s)}`).join('; ')})`);
  console.log(`  (contas que viraram nome sujo sem virar dívida: ${fmt(semPagar)} — saem do extrato como 'divida' e não ficam em lugar nenhum)`);
  // Situação nos anos em que o fechamento foi para o cartão.
  const sit = new Map<string, number>();
  let anosRombo = 0;
  for (const x of ins) for (const a of x.anos) if (a.romboCartao > 0 || a.romboAtraso > 0 || a.romboSemPagar > 0) { anosRombo++; sit.set(a.situacao, (sit.get(a.situacao) ?? 0) + 1); }
  console.log(`situação nos ${anosRombo} anos em que o ano fechou no vermelho e virou dívida: ${[...sit.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${pct(n, anosRombo)}`).join(' · ')}`);
  const gasto = new Map<string, number>();
  for (const x of ins) for (const a of x.anos) if (a.romboCartao > 0) gasto.set(a.maiorGasto, (gasto.get(a.maiorGasto) ?? 0) + 1);
  console.log(`maior grupo de despesa nesses anos: ${[...gasto.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  // Renda e aposentadoria.
  const em = (x: Resultado, i: number) => x.anos.find(a => a.idade === i);
  for (const i of [30, 45, 60, 70, 80]) {
    const xs = rs.map(x => em(x, i)).filter((a): a is Ano => !!a);
    const xi = ins.map(x => em(x, i)).filter((a): a is Ano => !!a);
    if (!xs.length) continue;
    const s = (arr: Ano[]) => { const m = new Map<string, number>(); for (const a of arr) m.set(a.situacao, (m.get(a.situacao) ?? 0) + 1); return [...m.entries()].sort((p, q) => q[1] - p[1]).map(([k, n]) => `${k} ${pct(n, arr.length)}`).join(', '); };
    console.log(`  aos ${i}: todos — renda med ${fmt(med(xs.map(a => a.renda)))}, despesa med ${fmt(med(xs.map(a => a.despesa)))}, sobra<0 ${pct(xs.filter(a => a.renda < a.despesa).length, xs.length)} [${s(xs)}] | insolventes — renda ${fmt(med(xi.map(a => a.renda)))}, despesa ${fmt(med(xi.map(a => a.despesa)))} [${s(xi)}]`);
  }
  const elegTodos = rs.filter(x => x.anos.some(a => a.situacao === 'elegivel_sem_aposentar')).length;
  console.log(`em toda a política: vidas com anos podendo aposentar, sem trabalho e sem aposentar: ${elegTodos} de ${rs.length} · anos sem renda nenhuma depois dos 25: ${pct(rs.reduce((t, x) => t + x.anos.filter(a => a.idade >= 25 && (a.situacao === 'sem_renda' || a.situacao === 'na_familia')).length, 0), rs.reduce((t, x) => t + x.anos.filter(a => a.idade >= 25).length, 0))}`);
  const aposentados = ins.filter(x => x.anos.some(a => a.situacao === 'aposentado')).length;
  const elegiveis = ins.filter(x => x.anos.some(a => a.situacao === 'elegivel_sem_aposentar')).length;
  console.log(`insolventes que se aposentaram: ${pct(aposentados, ins.length)} · que passaram anos podendo aposentar sem aposentar: ${pct(elegiveis, ins.length)} (mediana de anos assim: ${med(ins.map(x => x.anos.filter(a => a.situacao === 'elegivel_sem_aposentar').length).filter(n => n > 0))})`);
  if (DETALHE) for (const x of ins.slice(0, 6)) {
    console.log(`  · ${x.classe}, morreu aos ${x.idadeMorte} (${x.causa}): ativos ${fmt(x.ativos)}, obrigações ${fmt(x.obrigacoes)} — ${Object.entries(x.porTipo).map(([t, s]) => `${t} ${fmt(s)}`).join(', ')}`);
    for (const a of x.anos.filter(a => a.idade % 5 === 0 || a.romboCartao > 0).slice(-12)) console.log(`      ${a.idade}: ${a.situacao}, renda ${fmt(a.renda)}, despesa ${fmt(a.despesa)}, ativos ${fmt(a.ativos)}, dívida cara ${fmt(a.cara)}${a.romboCartao ? `, cartão +${fmt(a.romboCartao)}` : ''}${a.jurosCartao > 1 ? `, juros ${fmt(a.jurosCartao)}` : ''}${Object.keys(a.novas).length ? `, novas ${JSON.stringify(a.novas)}` : ''}${a.plano ? ', plano' : ''} [${a.saidas}]`);
  }
}
