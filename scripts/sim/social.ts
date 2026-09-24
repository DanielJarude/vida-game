/**
 * Simulação social: centenas de vidas, procurando OUTLIERS, não médias.
 *
 *   npx esbuild scripts/sim/social.ts --bundle --platform=node --outfile=/tmp/social.cjs
 *   VIDAS=20 SAIDA=/tmp/social node /tmp/social.cjs
 *
 * Mede relações por idade, amizades que duram, casamentos, separações,
 * viuvez, novos amores, filhos e a vida deles, netos, mortes e o peso delas
 * na Linha da Vida. Aponta absurdos: gente congelada, relações impossíveis,
 * mortos agindo, diferenças de idade inadequadas, filhos sem trajetória,
 * relações longas sem história, spam de perdas, vidas sem ninguém.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Pessoa, Vida } from '../../src/motor/tipos';
import { idade, idadePessoa, parceiro, vinculosVivos } from '../../src/motor/nucleo';
import { MUNICIPIOS, nomeLugar } from '../../src/motor/dados/lugares';
import { estrategia, NOMES_ESTRATEGIAS } from './estrategias';
import { importancia, papelDe } from '../../src/motor/sistemas/vinculos';
import { regraDeIdade } from '../../src/motor/sistemas/romance';
import { podeTentar } from '../../src/motor/plausibilidade';
import { tracosMarcantes } from '../../src/motor/personalidade';

const VIDAS = Number(process.env.VIDAS ?? 12);
const SAIDA = process.env.SAIDA ?? '/tmp/vida-social';
const ESTRATEGIAS = (process.env.ESTRATEGIAS ?? NOMES_ESTRATEGIAS.join(',')).split(',');
mkdirSync(SAIDA, { recursive: true });

interface Foto { idade: number; felicidade: number; estresse: number; relacoes: number; amigos: number; familia: number; nucleo: number; luto: number }
interface Resultado { semente: number; estrategia: string; vida: Vida; fotos: Foto[]; alertas: string[]; decisoes: string[] }

const TERMINAL = new Set(['terminar', 'contar_verdade']);

function checar(v: Vida, alertas: string[]): void {
  const i = idade(v);
  const vivos = vinculosVivos(v);
  const ativos = vivos.filter(x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio) && !x.vin.romance.secreto);
  if (ativos.length > 1) alertas.push(`${i}: ${ativos.length} parcerias oficiais ao mesmo tempo`);
  for (const { p, vin } of vivos) {
    const ip = idadePessoa(v, p);
    const rom = vin.romance;
    if (rom && rom.estagio !== 'ex' && rom.estagio !== 'interesse') {
      // Quem começou dentro da regra pode continuar; checa a regra como era no começo.
      const t0 = rom.tInicio ?? rom.tEstagio;
      const iEu0 = Math.floor((t0 - v.eu.tNasc) / 12), iP0 = Math.floor((t0 - p.tNasc) / 12);
      if (!podeTentar(regraDeIdade(iEu0, iP0))) alertas.push(`${i}: romance fora da regra de idade (${iEu0} e ${iP0} no começo)`);
      if (Math.min(i, ip) < 18 && Math.max(i, ip) >= 18 && (Math.max(i, ip) > 21 || Math.abs(i - ip) > 4)) alertas.push(`${i}: menor com adulto (${i} e ${ip})`);
      if (Math.abs(i - ip) > 30 && Math.min(i, ip) < 40) alertas.push(`${i}: diferença de idade absurda (${i} e ${ip})`);
    }
    if (vin.convivio.includes('casa') && p.municipioId !== v.moradia.municipioId && !p.especie) alertas.push(`${i}: mora junto em outra cidade (${papelDe(p, vin)})`);
    if (vin.parentesco === 'mae' && ip - i < 14) alertas.push(`${i}: mãe com ${ip}`);
    if ((vin.parentesco === 'neto') && p.genitores?.length) {
      const pai = v.pessoas[p.genitores[0]];
      if (pai && p.tNasc - pai.tNasc < 15 * 12) alertas.push(`${i}: neto de pai/mãe com menos de 15 anos`);
      if (pai && !['filho', 'enteado'].includes(v.vinculos[pai.id]?.parentesco ?? '')) alertas.push(`${i}: neto cujo genitor não é filho do jogador`);
    }
    if (vin.parentesco === 'neto' && !p.genitores?.length) alertas.push(`${i}: neto sem genitores`);
  }
  // Mortos não agem: nenhuma interação com quem já morreu.
  for (const a of v.anoAtual.acoes) {
    const id = a.split(':')[2];
    if (id && v.pessoas[id] && !v.pessoas[id].vivo) alertas.push(`${i}: interação com pessoa morta`);
  }
}

function simular(semente: number, nome: string): Resultado {
  const est = estrategia(nome);
  const r = criarRng(semente * 13 + 5);
  const m = MUNICIPIOS[semente % MUNICIPIOS.length];
  const genero = semente % 3 === 0 ? 'feminino' : semente % 3 === 1 ? 'masculino' : 'feminino';
  let v = criarVida({ nome: 'Sim', sobrenome: 'Social', genero, municipioId: m.id, semente });
  const fotos: Foto[] = [];
  const alertas: string[] = [];
  const decisoes: string[] = [];
  let guarda = 0;
  while (!v.morte && guarda++ < 120) {
    for (const a of est.agir(v, r)) {
      const antes = v;
      v = executar(v, a).vida;
      if (a.tipo === 'pessoa' && v !== antes && antes.pessoas[a.pessoaId] && !antes.pessoas[a.pessoaId].vivo) alertas.push(`${idade(v)}: executou ação com morto`);
      if (v.momento) { decisoes.push(v.momento.situacaoId); v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida; }
      void TERMINAL;
    }
    v = avancarAno(v).vida;
    if (v.momento) { decisoes.push(v.momento.situacaoId); v = executar(v, { tipo: 'decidir', opcaoId: est.decidir(v, v.momento, r) }).vida; }
    checar(v, alertas);
    const vivos = vinculosVivos(v).filter(x => !x.p.especie);
    fotos.push({
      idade: idade(v), felicidade: v.mente.felicidade, estresse: v.mente.estresse,
      relacoes: vivos.filter(x => importancia(v, x.p, x.vin) >= 20).length,
      amigos: vivos.filter(x => x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo').length,
      familia: vivos.filter(x => x.vin.parentesco).length,
      nucleo: vivos.filter(x => x.vin.convivio.includes('casa') || papelDe(x.p, x.vin) === 'parceiro' || papelDe(x.p, x.vin) === 'filho').length,
      luto: v.luto.reduce((s, l) => s + l.peso, 0)
    });
  }
  return { semente, estrategia: nome, vida: v, fotos, alertas, decisoes };
}

/* ------------------------------------------------------------------ Rodar */

const todas: Resultado[] = [];
let semente = 3001;
for (const e of ESTRATEGIAS) for (let k = 0; k < VIDAS; k++) { semente += 7717; todas.push(simular(semente, e)); }

const out: string[] = [];
const log = (s = '') => { out.push(s); console.log(s); };
const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const f1 = (n: number) => n.toFixed(1);

log(`# Simulação social — ${todas.length} vidas (${ESTRATEGIAS.length} estratégias × ${VIDAS})`);
log('');
log('## Relações por idade (vínculos que importam, amigos, núcleo)');
log('| idade | n | relações (p10/med/p90) | amigos (med/p90) | núcleo (med) | sem ninguém próximo |');
log('|---|---|---|---|---|---|');
for (const a of [5, 10, 15, 20, 30, 40, 50, 60, 70, 80]) {
  const fs = todas.map(s => s.fotos.find(f => f.idade === a)).filter((f): f is Foto => !!f);
  if (!fs.length) continue;
  const sem = fs.filter(f => f.relacoes === 0).length;
  log(`| ${a} | ${fs.length} | ${pct(fs.map(f => f.relacoes), 0.1)}/${pct(fs.map(f => f.relacoes), 0.5)}/${pct(fs.map(f => f.relacoes), 0.9)} | ${pct(fs.map(f => f.amigos), 0.5)}/${pct(fs.map(f => f.amigos), 0.9)} | ${pct(fs.map(f => f.nucleo), 0.5)} | ${sem} |`);
}

log('');
log('## Parceria');
const bio = (s: Resultado, re: RegExp) => s.vida.biografia.filter(e => re.test(e.texto)).length;
const ev = (s: Resultado, tipo: string) => s.vida.biografia.filter(e => e.evento?.tipo === tipo).length;
const casou = todas.filter(s => bio(s, /^Casou-se/) > 0).length;
const divorcios = todas.filter(s => ev(s, 'divorcio') > 0).length;
const viuvos = todas.filter(s => ev(s, 'viuvez') > 0);
const recasou = todas.filter(s => {
  const fim = s.vida.biografia.find(e => e.evento?.tipo === 'viuvez' || e.evento?.tipo === 'divorcio' || e.evento?.tipo === 'termino');
  return fim && s.vida.biografia.some(e => e.t > fim.t && (e.evento?.tipo === 'namoro' || e.evento?.tipo === 'uniao') );
}).length;
const traicoes = todas.filter(s => ev(s, 'traicao') > 0);
const descobertas = todas.filter(s => ev(s, 'traicao_descoberta') > 0).length;
log(`- casaram: ${casou}/${todas.length} · divórcio: ${divorcios} · viuvez: ${viuvos.length} · novo amor depois de separação/viuvez: ${recasou}`);
log(`- casos: ${traicoes.length} vidas (${traicoes.filter(s => s.estrategia === 'infiel').length} da estratégia infiel) · descobertos: ${descobertas}`);
const idadeViuvez = viuvos.map(s => s.vida.biografia.find(e => e.evento?.tipo === 'viuvez')!.idade);
if (idadeViuvez.length) log(`- idade na viuvez: p10 ${pct(idadeViuvez, 0.1)} · mediana ${pct(idadeViuvez, 0.5)} · p90 ${pct(idadeViuvez, 0.9)}`);
const despedidas = viuvos.filter(s => s.decisoes.includes('luto_despedida')).length;
log(`- viuvez com despedida aberta (decisão): ${despedidas}/${viuvos.length}`);
const humorViuvez = viuvos.map(s => {
  const i0 = s.vida.biografia.find(e => e.evento?.tipo === 'viuvez')!.idade;
  const antes = s.fotos.find(f => f.idade === i0 - 1)?.felicidade;
  const depois = s.fotos.find(f => f.idade === i0)?.felicidade;
  const dois = s.fotos.find(f => f.idade === i0 + 2)?.felicidade;
  return antes !== undefined && depois !== undefined ? [antes, depois, dois ?? depois] : null;
}).filter((x): x is number[] => !!x);
const recuperacao = viuvos.map(s => { const i0 = s.vida.biografia.find(e => e.evento?.tipo === 'viuvez')!.idade; return s.fotos.find(f => f.idade === i0 + 5)?.felicidade; }).filter((x): x is number => x !== undefined);
if (recuperacao.length) log(`- humor cinco anos depois da viuvez: média ${f1(media(recuperacao))} (n=${recuperacao.length})`);
if (humorViuvez.length) log(`- humor ao enviuvar (média): antes ${f1(media(humorViuvez.map(x => x[0])))} → no ano ${f1(media(humorViuvez.map(x => x[1])))} → dois anos depois ${f1(media(humorViuvez.map(x => x[2])))}`);

log('');
log('## Filhos, netos, gerações');
const filhosDe = (s: Resultado) => Object.values(s.vida.vinculos).filter(x => x.parentesco === 'filho').map(x => s.vida.pessoas[x.pessoaId]);
const nf = todas.map(s => filhosDe(s).length);
log(`- filhos por vida: mediana ${pct(nf, 0.5)} · p90 ${pct(nf, 0.9)} · máx ${Math.max(...nf)} · sem filhos ${nf.filter(n => n === 0).length}`);
const adultos = todas.flatMap(s => filhosDe(s).filter(f => f && Math.floor(((f.tMorte ?? s.vida.t) - f.tNasc) / 12) >= 25).map(f => ({ s, f })));
const semTrajetoria = adultos.filter(({ f }) => (f.vida?.trajetoria.length ?? 0) < 2);
const semHistoria = adultos.filter(({ s, f }) => (s.vida.vinculos[f.id]?.historia.length ?? 0) <= 1);
log(`- filhos que chegaram aos 25: ${adultos.length} · sem trajetória (<2 marcos): ${semTrajetoria.length} · com só um marco na história com você: ${semHistoria.length}`);
const hist = adultos.map(({ s, f }) => s.vida.vinculos[f.id]?.historia.length ?? 0);
log(`- marcos na história pai/mãe–filho adulto: p10 ${pct(hist, 0.1)} · mediana ${pct(hist, 0.5)} · p90 ${pct(hist, 0.9)}`);
const formados = adultos.filter(({ f }) => f.formacao).length;
const trabalham = adultos.filter(({ f }) => f.renda > 0).length;
log(`- filhos adultos: com formação ${formados} · com renda ${trabalham}`);
// Congelados: no mesmo cargo há mais de 8 anos sem nenhum marco de trabalho que explique.
const congelados = adultos.filter(({ s, f }) => {
  const vd = f.vida;
  if (!vd?.tCargo || !f.vivo) return false;
  const anos = (s.vida.t - vd.tCargo) / 12;
  // Explicado: algo aconteceu no trabalho nos últimos 8 anos, ou a estagnação deste cargo já foi contada.
  const explicado = vd.trajetoria.some(t => (s.vida.t - t.t <= 96 || t.t >= (vd.tCargo ?? 0)) && (t.tipo === 'trabalho' || t.tipo === 'promocao' || t.tipo === 'estudo' || t.tipo === 'desemprego'));
  return anos > 8 && !explicado && Math.floor((s.vida.t - f.tNasc) / 12) < 60;
});
log(`- carreiras congeladas sem explicação (mesmo cargo 8+ anos, nenhum marco): ${congelados.length}`);
for (const { s, f } of congelados.slice(0, 3)) log(`    ex.: [${s.estrategia} ${s.semente}] ${f.nome}, ${Math.floor((s.vida.t - f.tNasc) / 12)} anos, ${f.ocupacao}, cargo desde ${Math.floor((f.vida!.tCargo ?? 0) / 12)}: ${f.vida!.trajetoria.slice(-4).map(t => `${Math.floor(t.t / 12)} ${t.texto}`).join(' | ')}`);
const netos = todas.map(s => Object.values(s.vida.vinculos).filter(x => x.parentesco === 'neto').length);
const bisnetos = todas.map(s => Object.values(s.vida.vinculos).filter(x => x.parentesco === 'bisneto').length);
log(`- netos: vidas com neto ${netos.filter(n => n > 0).length} · mediana entre quem tem ${pct(netos.filter(n => n > 0), 0.5)} · máx ${Math.max(...netos)} · bisnetos em ${bisnetos.filter(n => n > 0).length} vidas`);
const avo = todas.filter(s => ev(s, 'virou_avo') > 0);
const idadeAvo = avo.map(s => s.vida.biografia.find(e => e.evento?.tipo === 'virou_avo')!.idade);
if (idadeAvo.length) log(`- idade ao virar avô/avó: p10 ${pct(idadeAvo, 0.1)} · mediana ${pct(idadeAvo, 0.5)} · p90 ${pct(idadeAvo, 0.9)}`);
const notif = todas.map(s => s.vida.biografia.filter(e => (e.tema === 'filhos' || e.tema === 'familia') && e.pessoas?.some(id => ['filho', 'neto'].includes(s.vida.vinculos[id]?.parentesco ?? '')) && e.idade >= 45).length);
log(`- notícias de filhos/netos depois dos 45 (por vida): mediana ${pct(notif, 0.5)} · p90 ${pct(notif, 0.9)}`);

log('');
log('## Mortes e luto');
const perdasPorAno = todas.flatMap(s => {
  const m = new Map<number, number>();
  for (const e of s.vida.biografia) if (e.tema === 'perda' && (e.relevancia === 'marco' || e.relevancia === 'biografia')) m.set(e.idade, (m.get(e.idade) ?? 0) + 1);
  return [...m.values()];
});
log(`- linhas de perda visíveis por ano com perda: média ${f1(media(perdasPorAno))} · máx ${Math.max(0, ...perdasPorAno)}`);
const velhice = todas.map(s => s.vida.biografia.filter(e => e.tema === 'perda' && e.idade >= 60 && (e.relevancia === 'marco' || e.relevancia === 'biografia')).length);
const anos60 = todas.map(s => Math.max(0, idade(s.vida) - 60));
log(`- perdas visíveis depois dos 60: mediana ${pct(velhice, 0.5)} por vida · p90 ${pct(velhice, 0.9)} · (anos vividos 60+: mediana ${pct(anos60, 0.5)})`);
const janelas = todas.map(s => {
  let pior = 0;
  for (let a = 55; a < 100; a++) pior = Math.max(pior, s.vida.biografia.filter(e => e.tema === 'perda' && e.idade >= a && e.idade < a + 3 && (e.relevancia === 'marco' || e.relevancia === 'biografia')).length);
  return pior;
});
log(`- pior janela de 3 anos (perdas visíveis): mediana ${pct(janelas, 0.5)} · p90 ${pct(janelas, 0.9)} · máx ${Math.max(...janelas)}`);
const pesos = todas.flatMap(s => s.vida.biografia.filter(e => e.evento?.tipo === 'morte' || e.evento?.tipo === 'viuvez').map(e => ({ tipo: e.evento!.tipo, papel: e.evento!.pessoaId ? papelDe(s.vida.pessoas[e.evento!.pessoaId], s.vida.vinculos[e.evento!.pessoaId]) : 'varios', peso: e.evento!.peso ?? 0 })));
const porPapel = new Map<string, number[]>();
for (const x of pesos) porPapel.set(x.papel, [...(porPapel.get(x.papel) ?? []), x.peso]);
log(`- peso da perda por papel (mediana): ${[...porPapel.entries()].sort((a, b) => pct(b[1], 0.5) - pct(a[1], 0.5)).map(([p, l]) => `${p} ${pct(l, 0.5)} (n=${l.length})`).join(' · ')}`);

log('');
log('## Ritmo social na Linha da Vida');
const social = new Set(['amizade', 'amor', 'familia', 'filhos', 'perda']);
const porAno = todas.flatMap(s => {
  const m = new Map<number, number>();
  for (const e of s.vida.biografia) if (social.has(e.tema) && (e.relevancia === 'marco' || e.relevancia === 'biografia')) m.set(e.idade, (m.get(e.idade) ?? 0) + 1);
  return [...Array(idade(s.vida)).keys()].map(a => m.get(a) ?? 0);
});
log(`- linhas sociais visíveis por ano: média ${f1(media(porAno))} · p90 ${pct(porAno, 0.9)} · máx ${Math.max(...porAno)} · anos com 4+: ${porAno.filter(n => n >= 4).length}`);
const repet = todas.map(s => {
  const vistos = new Map<string, number>();
  for (const e of s.vida.biografia) if (social.has(e.tema) && e.relevancia !== 'tecnico') { const k = e.texto.replace(/[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+/g, 'N').replace(/\d+/g, '#'); vistos.set(k, (vistos.get(k) ?? 0) + 1); }
  return [...vistos.values()].filter(n => n > 2).reduce((a, n) => a + n - 2, 0);
});
log(`- repetições sociais (mesma frase 3+ vezes na vida): média ${f1(media(repet))} · máx ${Math.max(...repet)}`);
const frases = new Map<string, number>();
for (const s of todas) {
  const vistos = new Map<string, number>();
  for (const e of s.vida.biografia) if (social.has(e.tema) && e.relevancia !== 'tecnico') { const k = e.texto.replace(/[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+/g, 'N').replace(/\d+/g, '#'); vistos.set(k, (vistos.get(k) ?? 0) + 1); }
  for (const [k, n] of vistos) if (n > 2) frases.set(k, (frases.get(k) ?? 0) + n - 2);
}
for (const [k, n] of [...frases.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) log(`    ${n}× ${k.slice(0, 140)}`);

log('');
log('## Relações longas com pouca história');
const longas = todas.flatMap(s => vinculosVivos(s.vida).filter(x => !x.p.especie && (s.vida.t - x.vin.tInicio) / 12 >= 20 && importancia(s.vida, x.p, x.vin) >= 55).map(x => ({ s, x })));
const pobres = longas.filter(({ x }) => x.vin.historia.length <= 2);
log(`- relações de 20+ anos que importam: ${longas.length} · com até 2 marcos: ${pobres.length}`);
for (const { s, x } of pobres.slice(0, 5)) log(`    ex.: [${s.estrategia} ${s.semente}] ${x.p.nome} (${papelDe(x.p, x.vin)}, ${Math.floor((s.vida.t - x.vin.tInicio) / 12)} anos): ${x.vin.historia.map(h => h.texto).join(' / ') || '—'}`);

log('');
log('## Personalidade');
const tracos = new Map<string, number>();
for (const s of todas) for (const t of tracosMarcantes(s.vida)) tracos.set(t, (tracos.get(t) ?? 0) + 1);
log(`- traços mais comuns: ${[...tracos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => `${t} ${n}`).join(' · ')}`);
const origens = new Map<string, number>();
for (const s of todas) for (const e of s.vida.personalidade.evidencias) { const o = e.origem.split(':')[0]; origens.set(o === 'rotina' || o === 'acao' ? o : 'decisão', (origens.get(o === 'rotina' || o === 'acao' ? o : 'decisão') ?? 0) + 1); }
log(`- origem das evidências de personalidade: ${[...origens.entries()].map(([o, n]) => `${o} ${n}`).join(' · ')}`);

log('');
log('## Alertas de coerência');
const tipos = new Map<string, { n: number; ex: string }>();
for (const s of todas) for (const a of s.alertas) {
  const k = a.replace(/^\d+: /, '').replace(/\d+/g, '#');
  const t = tipos.get(k) ?? { n: 0, ex: `[${s.estrategia} ${s.semente}] ${a}` };
  t.n++; tipos.set(k, t);
}
if (!tipos.size) log('nenhum');
for (const [k, t] of [...tipos.entries()].sort((a, b) => b[1].n - a[1].n)) log(`- ${t.n}× ${k} — ${t.ex}`);

log('');
log('## Por estratégia');
log('| estratégia | morte (med) | casou | separou | viuvez | caso | filhos (med) | netos (med) | amigos aos 60 (med) | humor aos 70 (med) | afeto filho adulto (med) | marcos filho adulto (med) |');
log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const e of ESTRATEGIAS) {
  const vs = todas.filter(s => s.estrategia === e);
  const a60 = vs.map(s => s.fotos.find(f => f.idade === 60)?.amigos).filter((x): x is number => x !== undefined);
  const h70 = vs.map(s => s.fotos.find(f => f.idade === 70)?.felicidade).filter((x): x is number => x !== undefined);
  const fa = vs.flatMap(s => filhosDe(s).filter(f => f && f.vivo && Math.floor((s.vida.t - f.tNasc) / 12) >= 20).map(f => s.vida.vinculos[f.id]));
  const afeto = fa.length ? pct(fa.map(x => x.proximidade), 0.5) : '—';
  const marcos = fa.length ? pct(fa.map(x => x.historia.length), 0.5) : '—';
  log(`| ${e} | ${pct(vs.map(s => idade(s.vida)), 0.5)} | ${vs.filter(s => bio(s, /^Casou-se/) > 0).length} | ${vs.filter(s => ev(s, 'divorcio') + ev(s, 'termino') > 0 && s.vida.biografia.some(b => /se separar|fez as malas|divórcio/.test(b.texto))).length} | ${vs.filter(s => ev(s, 'viuvez') > 0).length} | ${vs.filter(s => ev(s, 'traicao') > 0).length} | ${pct(vs.map(s => filhosDe(s).length), 0.5)} | ${pct(vs.map(s => Object.values(s.vida.vinculos).filter(x => x.parentesco === 'neto').length), 0.5)} | ${pct(a60, 0.5)} | ${pct(h70, 0.5)} | ${afeto} | ${marcos} |`);
}

writeFileSync(`${SAIDA}/resumo.md`, out.join('\n'));

/* ------------------------------------------------------ Histórias legíveis */

function historiaDaPessoa(v: Vida, p: Pessoa): string[] {
  const vin = v.vinculos[p.id];
  const linhas = [`### ${p.nome} ${p.sobrenome} — ${papelDe(p, vin)}${p.vivo ? `, ${idadePessoa(v, p)} anos` : ` (${Math.floor(((p.tMorte ?? v.t) - p.tNasc) / 12)}, †${Math.floor((p.tMorte ?? 0) / 12)})`} · ${p.ocupacao ?? '—'} · ${nomeLugar(p.municipioId)}`];
  linhas.push(`afeto ${vin.proximidade} · confiança ${vin.confianca} · atrito ${vin.tensao} · presença ${vin.presenca ?? '—'} · importância ${importancia(v, p, vin)}`);
  for (const h of vin.historia) linhas.push(`  ${Math.floor(h.t / 12)} [${h.tipo ?? '?'}${h.peso ? `/${h.peso}` : ''}] ${h.texto}`);
  if (p.vida?.trajetoria.length) { linhas.push('  vida própria:'); for (const t of p.vida.trajetoria) linhas.push(`    ${Math.floor(t.t / 12)} ${t.texto}`); }
  return linhas;
}

for (const s of todas.filter((_, i) => i % Math.max(1, Math.floor(VIDAS / 2)) === 0)) {
  const v = s.vida;
  const l: string[] = [`# ${s.estrategia} ${s.semente} — morreu aos ${idade(v)} (${v.morte?.causa ?? '—'})`, ''];
  for (const e of v.biografia) if (e.relevancia !== 'tecnico') l.push(`${String(e.idade).padStart(3)} ${e.relevancia === 'marco' ? '★' : e.relevancia === 'cotidiano' ? '·' : '–'} ${e.escolha ? '[escolha] ' : ''}${e.texto}`);
  l.push('', '## Pessoas que importaram');
  const todasP = Object.values(v.vinculos).map(vin => ({ p: v.pessoas[vin.pessoaId], vin })).filter(x => x.p && !x.p.especie && importancia(v, x.p, x.vin) >= 30).sort((a, b) => importancia(v, b.p, b.vin) - importancia(v, a.p, a.vin)).slice(0, 10);
  for (const { p } of todasP) l.push(...historiaDaPessoa(v, p), '');
  writeFileSync(`${SAIDA}/vida-${s.estrategia}-${s.semente}.md`, l.join('\n'));
}
void parceiro;
console.log(`\nhistórias em ${SAIDA}`);
