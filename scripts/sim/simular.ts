/**
 * Simulador de vidas sobre o motor novo.
 *
 *   npx esbuild scripts/sim/simular.ts --bundle --platform=node | VIDAS=20 SAIDA=/tmp/sim node
 *
 * Roda N vidas por estratégia, grava biografias legíveis e imprime métricas
 * por faixa etária e por estratégia. Não é teste: é instrumento de leitura.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, filhos, amigos, parceiro, vinculosVivos } from '../../src/motor/nucleo';
import { patrimonio, saldoMensal } from '../../src/motor/sistemas/dinheiro';
import { MUNICIPIOS, nomeLugar } from '../../src/motor/dados/lugares';
import { estrategia, NOMES_ESTRATEGIAS } from './estrategias';
import { descricaoEmprego } from '../../src/motor/sistemas/trabalho';
import { ROTULO_ESCOLARIDADE } from '../../src/motor/sistemas/escola';
import { tracosMarcantes } from '../../src/motor/personalidade';
import { ocupacao } from '../../src/motor/dados/ocupacoes';

const VIDAS = Number(process.env.VIDAS ?? 12);
const SAIDA = process.env.SAIDA ?? '/tmp/vida-sim';
const ESTRATEGIAS = (process.env.ESTRATEGIAS ?? NOMES_ESTRATEGIAS.join(',')).split(',');
mkdirSync(SAIDA, { recursive: true });

interface AnoSim {
  idade: number;
  entradas: { texto: string; rel: string; escolha: boolean }[];
  decisao?: string;
  opcao?: string;
  resultado?: string;
  renda: number;
  despesa: number;
  patrimonio: number;
  emprego: string;
  amigos: number;
  parceiro: boolean;
  diag: string;
}

interface VidaSim { semente: number; estrategia: string; vida: Vida; anos: AnoSim[]; violacoes: string[]; }

/** Checagens de coerência feitas a cada ano simulado. */
function checar(v: Vida, out: string[]): void {
  const i = idade(v);
  const vivos = vinculosVivos(v);
  const serios = vivos.filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio));
  if (serios.length > 1) out.push(`${i}: ${serios.length} relacionamentos sérios ao mesmo tempo`);
  for (const x of vivos) {
    const ip = Math.floor((v.t - x.p.tNasc) / 12);
    // Namoro que começou entre dois adolescentes e continua quando um faz 18 é legal; o resto não.
    if (x.vin.romance && x.vin.romance.estagio !== 'ex' && x.vin.romance.estagio !== 'interesse' && ((i >= 18) !== (ip >= 18)) && Math.min(i, ip) < 18 && (Math.abs(i - ip) > 3 || Math.min(i, ip) < 14)) out.push(`${i}: romance adulto-menor (${x.p.nome}, ${ip})`);
    if (x.vin.parentesco === 'mae' && ip - i < 14) out.push(`${i}: mãe com ${ip}`);
  }
  if (v.trabalho.atual && i < 14) out.push(`${i}: trabalho formal com ${i} anos`);
  if (v.trabalho.atual && i < 16 && v.trabalho.atual.contrato !== 'aprendiz') out.push(`${i}: ${v.trabalho.atual.contrato} aos ${i}`);
  const nFilhos = Object.values(v.vinculos).filter(x => x.parentesco === 'filho').length;
  if (nFilhos > 6) out.push(`${i}: ${nFilhos} filhos`);
  const nomes = new Map<string, string[]>();
  for (const x of vivos) if (!x.p.especie && (x.vin.parentesco || x.vin.romance || x.vin.proximidade >= 45)) nomes.set(x.p.nome, [...(nomes.get(x.p.nome) ?? []), x.vin.parentesco ?? x.vin.romance?.estagio ?? x.vin.estagio ?? '?']);
  for (const [n, k] of nomes) if (k.length > 1 && n) out.push(`${i}: ${k.length} pessoas próximas chamadas ${n} (${k.join('+')})`);
  const ultima = v.biografia[v.biografia.length - 1];
  if (ultima?.pessoas) for (const id of ultima.pessoas) if (!v.pessoas[id]) out.push(`${i}: biografia cita pessoa inexistente`);
}

export function simular(semente: number, nomeEstrategia: string): VidaSim {
  const est = estrategia(nomeEstrategia);
  const r = criarRng(semente * 7 + 3);
  const m = MUNICIPIOS[semente % MUNICIPIOS.length];
  const genero = semente % 3 === 0 ? 'feminino' : semente % 3 === 1 ? 'masculino' : (semente % 7 === 0 ? 'nao_binario' : 'feminino');
  let v = criarVida({ nome: 'Sim', sobrenome: 'Vida', genero, municipioId: m.id, semente });
  const anos: AnoSim[] = [];
  const violacoes: string[] = [];
  let guarda = 0;
  while (!v.morte && idade(v) < 115 && guarda++ < 130) {
    const antes = v.biografia.length;
    for (const a of est.agir(v, r)) {
      const ret = executar(v, a);
      v = ret.vida;
      if (v.momento) {
        const op = est.decidir(v, v.momento, r);
        v = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
      }
    }
    v = avancarAno(v).vida;
    let decisao: string | undefined, opcao: string | undefined, resultado: string | undefined;
    if (v.momento) {
      decisao = v.momento.titulo;
      const op = est.decidir(v, v.momento, r);
      opcao = v.momento.opcoes.find(o => o.id === op)?.texto;
      const ret = executar(v, { tipo: 'decidir', opcaoId: op });
      resultado = ret.resultado;
      v = ret.vida;
    }
    checar(v, violacoes);
    const s = saldoMensal(v);
    anos.push({
      idade: idade(v),
      entradas: v.biografia.slice(antes).map(e => ({ texto: e.texto, rel: e.relevancia, escolha: !!e.escolha })),
      decisao, opcao, resultado,
      renda: s.renda, despesa: s.despesa, patrimonio: patrimonio(v),
      emprego: descricaoEmprego(v), amigos: amigos(v).length, parceiro: !!parceiro(v),
      diag: `renda ${s.renda} · desp ${s.despesa} · conta ${Math.round(v.financas.conta)} · res ${Math.round(v.financas.reserva + v.financas.acoes)} · dív ${Math.round(v.financas.dividas.reduce((x, d) => x + d.saldo, 0))}${v.financas.negativado ? ' NEG' : ''} · saúde ${v.corpo.saude} · feliz ${v.mente.felicidade} · estr ${v.mente.estresse} · ${descricaoEmprego(v)} · mora ${v.moradia.tipo}`
    });
  }
  return { semente, estrategia: nomeEstrategia, vida: v, anos, violacoes };
}

function biografia(s: VidaSim): string {
  const v = s.vida;
  const linhas: string[] = [];
  linhas.push(`# ${v.eu.nome} (${v.eu.genero}) — ${s.estrategia}, semente ${s.semente}`);
  linhas.push(`${nomeLugar(v.eu.municipioNatal)} · ${v.origem.classe} · ${v.origem.arranjo} · morreu aos ${idade(v)} (${v.morte?.causa ?? '—'})`);
  linhas.push(`escolaridade: ${ROTULO_ESCOLARIDADE[v.educacao.escolaridade]} · último trabalho: ${v.trabalho.atual ? ocupacao(v.trabalho.atual.ocupacaoId).nome[0] : v.trabalho.historico.at(-1)?.ocupacaoId ?? '—'} · filhos: ${filhos(v).length + Object.values(v.pessoas).filter(p => !p.vivo && v.vinculos[p.id]?.parentesco === 'filho').length} · patrimônio: R$ ${patrimonio(v).toLocaleString('pt-BR')} · traços: ${tracosMarcantes(v).join(', ') || '—'}`);
  linhas.push('');
  for (const e of v.biografia.filter(e => e.idade === 0)) linhas.push(`  0 ★ ${e.texto}`);
  for (const a of s.anos) {
    const cab = String(a.idade).padStart(3);
    const itens = a.entradas.filter(e => e.rel !== 'tecnico');
    if (process.env.DIAG) linhas.push(`    {${a.diag}}`);
    if (!itens.length && !a.decisao) { linhas.push(`${cab} ·`); continue; }
    let primeiro = true;
    for (const e of itens) {
      const m = e.rel === 'marco' ? '★' : e.rel === 'cotidiano' ? '·' : '–';
      linhas.push(`${primeiro ? cab : '   '} ${m} ${e.escolha ? '[escolha] ' : ''}${e.texto}`);
      primeiro = false;
    }
    if (a.decisao) linhas.push(`${primeiro ? cab : '   '}   ▸ DECISÃO "${a.decisao}" → ${a.opcao} ⇒ ${a.resultado ?? ''}`);
  }
  linhas.push('');
  linhas.push('## Pessoas ao fim da vida');
  for (const { p, vin } of vinculosVivos(v).filter(x => !x.p.especie).sort((a, b) => b.vin.proximidade - a.vin.proximidade).slice(0, 12)) {
    linhas.push(`- ${p.nome} ${p.sobrenome} · ${vin.parentesco ?? vin.estagio}${vin.romance ? ` (${vin.romance.estagio})` : ''} · prox ${vin.proximidade} · ${vin.historia.map(h => h.texto).join(' / ')}`);
  }
  return linhas.join('\n');
}

/* ----------------------------------------------------------------- Rodar */

const todas: VidaSim[] = [];
let semente = 101;
for (const e of ESTRATEGIAS) {
  for (let k = 0; k < VIDAS; k++) {
    semente += 7919;
    todas.push(simular(semente, e));
  }
}

const FAIXAS: [string, number, number][] = [['0-2', 0, 2], ['3-5', 3, 5], ['6-11', 6, 11], ['12-14', 12, 14], ['15-17', 15, 17], ['18-29', 18, 29], ['30-44', 30, 44], ['45-59', 45, 59], ['60+', 60, 200]];
const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

const out: string[] = [];
const log = (s = '') => { out.push(s); console.log(s); };

log(`# Simulação — ${todas.length} vidas (${ESTRATEGIAS.length} estratégias × ${VIDAS})`);
log('');
log('## Ritmo por faixa (média por ano-vida)');
log('| faixa | anos | linhas bio/ano | marcos/ano | % anos sem nada | % anos com decisão | escolhas/ano |');
log('|---|---|---|---|---|---|---|');
for (const [nome, a, b] of FAIXAS) {
  const anos = todas.flatMap(s => s.anos.filter(x => x.idade >= a && x.idade <= b));
  if (!anos.length) continue;
  const bio = anos.map(x => x.entradas.filter(e => e.rel === 'marco' || e.rel === 'biografia').length);
  const marcos = anos.map(x => x.entradas.filter(e => e.rel === 'marco').length);
  const vazios = anos.filter(x => x.entradas.filter(e => e.rel !== 'tecnico').length === 0 && !x.decisao).length;
  const dec = anos.filter(x => x.decisao).length;
  const esc = anos.map(x => x.entradas.filter(e => e.escolha).length);
  log(`| ${nome} | ${anos.length} | ${media(bio).toFixed(2)} | ${media(marcos).toFixed(2)} | ${(100 * vazios / anos.length).toFixed(0)}% | ${(100 * dec / anos.length).toFixed(0)}% | ${media(esc).toFixed(2)} |`);
}

log('');
log('## Por estratégia');
log('| estratégia | morte (med) | superior | pós | filhos (med) | casou | nunca teve parceria | mudou de cidade | patr. 40 (med) | patr. 60 (med) | patr. final (p10/med/p90) | renda 40 (med) | amigos 40 (med) | traços |');
log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const e of ESTRATEGIAS) {
  const vs = todas.filter(s => s.estrategia === e);
  const mortes = vs.map(s => idade(s.vida));
  const sup = vs.filter(s => ['superior', 'pos', 'mestrado', 'doutorado'].includes(s.vida.educacao.escolaridade)).length;
  const pos = vs.filter(s => ['pos', 'mestrado', 'doutorado'].includes(s.vida.educacao.escolaridade)).length;
  const nf = vs.map(s => Object.values(s.vida.vinculos).filter(x => x.parentesco === 'filho').length);
  const casou = vs.filter(s => s.vida.biografia.some(b => /^Casou-se/.test(b.texto))).length;
  const nunca = vs.filter(s => !Object.values(s.vida.vinculos).some(x => x.romance && x.romance.estagio !== 'interesse')).length;
  const mudou = vs.filter(s => s.vida.fatos['mudou_de_cidade'] !== undefined).length;
  const aos = (n: number, f: (a: AnoSim) => number) => vs.map(s => s.anos.find(a => a.idade === n)).filter(Boolean).map(a => f(a!));
  const finais = vs.map(s => patrimonio(s.vida));
  const tracos = new Map<string, number>();
  for (const s of vs) for (const t of tracosMarcantes(s.vida)) tracos.set(t, (tracos.get(t) ?? 0) + 1);
  const topT = [...tracos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t} (${n})`).join(', ');
  log(`| ${e} | ${pct(mortes, 0.5)} | ${sup}/${vs.length} | ${pos} | ${pct(nf, 0.5)} | ${casou} | ${nunca} | ${mudou} | ${pct(aos(40, a => a.patrimonio), 0.5).toLocaleString('pt-BR')} | ${pct(aos(60, a => a.patrimonio), 0.5).toLocaleString('pt-BR')} | ${pct(finais, 0.1).toLocaleString('pt-BR')} / ${pct(finais, 0.5).toLocaleString('pt-BR')} / ${pct(finais, 0.9).toLocaleString('pt-BR')} | ${pct(aos(40, a => a.renda), 0.5).toLocaleString('pt-BR')} | ${pct(aos(40, a => a.amigos), 0.5)} | ${topT} |`);
}

log('');
log('## Saúde e morte');
for (const idadeAlvo of [20, 30, 40, 50, 60, 70, 80]) {
  const s = todas.map(x => x.anos.find(a => a.idade === idadeAlvo)?.diag.match(/saúde (\d+)/)?.[1]).filter(Boolean).map(Number);
  log(`- saúde aos ${idadeAlvo}: mediana ${pct(s, 0.5)} · p10 ${pct(s, 0.1)} (n=${s.length})`);
}
const causas = new Map<string, number>();
for (const s of todas) causas.set(s.vida.morte?.causa ?? 'viva', (causas.get(s.vida.morte?.causa ?? 'viva') ?? 0) + 1);
log(`- causas: ${[...causas.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(' · ')}`);
const mortesTodas = todas.map(s => idade(s.vida));
log(`- idade de morte: p10 ${pct(mortesTodas, 0.1)} · p25 ${pct(mortesTodas, 0.25)} · mediana ${pct(mortesTodas, 0.5)} · p75 ${pct(mortesTodas, 0.75)} · p90 ${pct(mortesTodas, 0.9)}`);

log('');
log('## Classe de origem × resultado');
for (const classe of ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta']) {
  const vs = todas.filter(s => s.vida.origem.classe === classe);
  if (!vs.length) continue;
  const sup = vs.filter(s => ['superior', 'pos', 'mestrado', 'doutorado'].includes(s.vida.educacao.escolaridade)).length;
  const r40 = vs.map(s => s.anos.find(a => a.idade === 40)?.renda).filter((x): x is number => x !== undefined);
  const grads = vs.map(s => ({ s, g: s.vida.educacao.concluidos.find(c => c.nivel === 'superior') })).filter(x => x.g);
  const idadeGrad = grads.map(x => Math.floor((x.g!.tFim - x.s.vida.eu.tNasc) / 12));
  const pub = grads.filter(x => x.g!.rede === 'publica').length, ead = grads.filter(x => x.g!.modalidade === 'ead').length;
  const largou = vs.filter(s => s.vida.biografia.some(e => /^Largou .* no meio|^Abandonou o curso|foi cancelada pela instituição/.test(e.texto))).length;
  log(`- ${classe}: ${vs.length} vidas · superior ${sup} (${(100 * sup / vs.length).toFixed(0)}%) · formatura aos ${pct(idadeGrad, 0.5)} (mediana) · pública ${pub} · EAD ${ead} · largou/perdeu curso ${largou} · renda aos 40 mediana R$ ${pct(r40, 0.5).toLocaleString('pt-BR')} · p90 R$ ${pct(r40, 0.9).toLocaleString('pt-BR')}`);
}

log('');
log('## Violações de coerência');
const tipos = new Map<string, { n: number; ex: string }>();
for (const s of todas) for (const vv of s.violacoes) {
  const k = vv.replace(/^\d+: /, '').replace(/\d+/g, '#').replace(/chamadas [^(]*/, 'chamadas X ').replace(/romance adulto-menor \(.*\)/, 'romance adulto-menor');
  const t = tipos.get(k) ?? { n: 0, ex: `[${s.estrategia} ${s.semente}] ${vv}` };
  t.n++;
  tipos.set(k, t);
}
if (tipos.size === 0) log('nenhuma');
for (const [k, t] of [...tipos.entries()].sort((a, b) => b[1].n - a[1].n)) log(`- ${t.n}× ${k} — ex.: ${t.ex}`);
const casamentos = todas.filter(s => s.vida.biografia.some(b => /^Casou-se/.test(b.texto))).length;
const divorcios = todas.filter(s => s.vida.biografia.some(b => /divórcio/.test(b.texto))).length;
const separacoes = todas.filter(s => s.vida.biografia.some(b => /divórcio|fez as malas|se separar de|Decidiu se separar/.test(b.texto))).length;
const juntaram = todas.filter(s => s.vida.biografia.some(b => /^Casou-se|morar junto|morar com/.test(b.texto))).length;
const terminos = todas.reduce((n, s) => n + s.vida.biografia.filter(b => /terminou o namoro|Terminou o namoro|divórcio|fez as malas|se separar/.test(b.texto)).length, 0);
log(`- casamentos: ${casamentos} vidas · divórcios: ${divorcios} · separações de quem morava junto (inclui divórcio): ${separacoes} de ${juntaram} vidas que moraram junto · términos de namoro/relação no total: ${terminos}`);

log('');
log('## Repetição de textos (mesmo texto na mesma vida)');
let repet = 0;
const exemplosRep = new Map<string, number>();
for (const s of todas) {
  const vistos = new Map<string, number>();
  for (const e of s.vida.biografia) {
    if (e.relevancia === 'tecnico') continue;
    const k = e.texto.replace(/\d+/g, '#');
    vistos.set(k, (vistos.get(k) ?? 0) + 1);
  }
  for (const [k, n] of vistos) if (n > 1) { repet += n - 1; exemplosRep.set(k, (exemplosRep.get(k) ?? 0) + n - 1); }
}
log(`repetições totais: ${repet} (${(repet / todas.length).toFixed(1)} por vida)`);
for (const [k, n] of [...exemplosRep.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) log(`  ${n}× ${k.slice(0, 120)}`);

log('');
log('## Conteúdo: uso do catálogo');
const usos = new Map<string, number>();
for (const s of todas) for (const o of s.vida.ocorrencias) usos.set(o.id, (usos.get(o.id) ?? 0) + 1);
log([...usos.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id}:${n}`).join('  '));

writeFileSync(`${SAIDA}/resumo.md`, out.join('\n'));
for (const s of todas.filter((_, i) => i % Math.max(1, Math.floor(VIDAS / 2)) === 0)) {
  writeFileSync(`${SAIDA}/vida-${s.estrategia}-${s.semente}.md`, biografia(s));
}
console.log(`\nbiografias em ${SAIDA}`);
