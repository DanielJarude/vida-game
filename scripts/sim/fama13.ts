/**
 * VIDA 13 · Fama — o mundo reage e o passado volta. Vidas inteiras (estratégias e países variados) e, à parte, saves de
 * QA avançados: quantos ficam conhecidos, quantas reações (f13_*) e lembranças (h13_*) por vida e por trajetória, quanto
 * a fama pagou (campanhas, participações, palestras — e o patrocínio mensal de sempre), e o ritmo (nada de spam).
 *
 *   npx esbuild scripts/sim/fama13.ts --bundle --platform=node --outfile=<scratch>/f13.cjs && VIDAS=40 node <scratch>/f13.cjs
 */
import { readFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { sortearMunicipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { interpretar } from '../../src/motor/save';
import { rendaDeImagem, faixaDaNotoriedade } from '../../src/motor/sistemas/notoriedade';
import { estrategia } from './estrategias';
import type { Vida } from '../../src/motor/tipos';

const NOMES = (process.env.ESTRATEGIAS ?? 'passivo,familiar,ambicioso,estudioso,impulsivo,social,antissocial,economico,gastador,esportista,aleatorio,ascensao').split(',');
const N = Number(process.env.VIDAS ?? 40);
const IDADE = Number(process.env.IDADE ?? 80);
const PAISES = (process.env.PAISES ?? 'BR,BR,US,PT,JP,NG').split(',');

interface Linha { nome: string; pico: number; f13: number; h13: number; fama13: number; imagem: number; receita: number; porId: Record<string, number>; anosConhecido: number; maxNoAno: number }

function jogar(v: Vida, e: ReturnType<typeof estrategia>, r: ReturnType<typeof criarRng>, anos: number, l: Linha): Vida {
  for (let k = 0; k < anos && !v.morte; k++) {
    for (const a of e.agir(v, r)) if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida;
    const antes = v.ocorrencias.length;
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento, r) }).vida;
    const novas = v.ocorrencias.slice(antes).filter(o => /^[fh]13_/.test(o.id));
    l.maxNoAno = Math.max(l.maxNoAno, novas.length);
    if ((v.notoriedade?.valor ?? 0) >= 10) l.anosConhecido++;
    l.imagem += rendaDeImagem(v) * 12;
  }
  return v;
}
function fechar(v: Vida, l: Linha): Linha {
  for (const o of v.ocorrencias) if (/^[fh]13_/.test(o.id)) { l.porId[o.id] = (l.porId[o.id] ?? 0) + 1; if (o.id.startsWith('f13_')) l.f13++; else l.h13++; }
  l.pico = v.notoriedade?.pico ?? Math.max(0, ...(v.fama13?.serie ?? []).map(s => s[1]));
  l.receita = (v.fama13?.receitas ?? []).reduce((s, x) => s + x.valor, 0);
  l.fama13 = (v.fama13?.marcos ?? []).length;
  return l;
}

async function principal() {
  await carregarMundo();
  const linhas: Linha[] = [];
  let erros = 0;
  for (let s = 1; s <= N; s++) {
    const pais = PAISES[s % PAISES.length];
    const rr = criarRng(130000 + s * 7919);
    const m = sortearMunicipio(() => rr.next(), pais);
    const genero = s % 2 ? 'feminino' : 'masculino';
    let v = criarVida({ nome: sortearNome(rr, genero, 2026, pais, m.uf), sobrenome: sortearSobrenome(rr, pais, m.uf), genero, municipioId: m.id, semente: 710000 + s * 104729 });
    const nome = NOMES[s % NOMES.length];
    const l: Linha = { nome, pico: 0, f13: 0, h13: 0, fama13: 0, imagem: 0, receita: 0, porId: {}, anosConhecido: 0, maxNoAno: 0 };
    try { v = jogar(v, estrategia(nome), criarRng(s * 37 + 11), IDADE, l); } catch (err) { erros++; console.error(`vida ${s}:`, err); continue; }
    linhas.push(fechar(v, l));
  }
  // Saves de QA (a empresária, o presidente...) avançados 20 anos com a estratégia ambiciosa.
  const saves = (process.env.SAVES ?? '').split(',').filter(Boolean);
  const REPLICAS = Number(process.env.REPLICAS ?? 1);
  const ESTR_SAVE = process.env.ESTR_SAVE ?? 'ambicioso';
  for (const arq0 of saves.flatMap(a => Array.from({ length: REPLICAS }, (_, k) => `${a}#${k}`))) {
    const [arq, k] = arq0.split('#');
    const r = interpretar(readFileSync(arq, 'utf8'));
    if (r.tipo !== 'ok') { console.error('save', arq, r); continue; }
    r.vida.id = `${r.vida.id}-r${k}`;
    const l: Linha = { nome: `save:${arq.split('/').pop()}`, pico: 0, f13: 0, h13: 0, fama13: 0, imagem: 0, receita: 0, porId: {}, anosConhecido: 0, maxNoAno: 0 };
    const antes = r.vida.ocorrencias.length;
    let v: Vida;
    try { v = jogar(r.vida, estrategia(ESTR_SAVE), criarRng(7 + Number(k)), Number(process.env.ANOS_SAVE ?? 20), l); } catch (err) { erros++; console.error('save', arq, err); continue; }
    v = { ...v, ocorrencias: v.ocorrencias.slice(antes) };
    linhas.push(fechar(v, l));
  }
  const faixa = (x: number) => ['anônimo (<10)', 'local (10–29)', 'reconhecido (30–54)', 'famoso (55–77)', 'muito famoso (78+)'][faixaDaNotoriedade(x)];
  const grupos: Record<string, Linha[]> = {};
  for (const l of linhas) (grupos[faixa(l.pico)] ??= []).push(l);
  const real = (x: number) => `R$ ${Math.round(x).toLocaleString('pt-BR')}`;
  console.log(`# Fama 13 — ${linhas.length} vidas (${N} inteiras até ${IDADE}, ${saves.length} saves) · erros ${erros}\n`);
  console.log('| pico da notoriedade | vidas | reações f13/vida | lembranças h13/vida | marcos guardados/vida | receita da fama/vida | patrocínio mensal ×12 acumulado/vida | anos conhecido/vida |\n|---|---|---|---|---|---|---|---|');
  for (const [g, ls] of Object.entries(grupos).sort()) {
    const m = (f: (l: Linha) => number) => (ls.reduce((s, l) => s + f(l), 0) / ls.length);
    console.log(`| ${g} | ${ls.length} | ${m(l => l.f13).toFixed(2)} | ${m(l => l.h13).toFixed(2)} | ${m(l => l.fama13).toFixed(1)} | ${real(m(l => l.receita))} | ${real(m(l => l.imagem))} | ${m(l => l.anosConhecido).toFixed(1)} |`);
  }
  console.log('\n| trajetória (estratégia) | vidas | pico médio | f13 | h13 |\n|---|---|---|---|---|');
  const porNome: Record<string, Linha[]> = {};
  for (const l of linhas) (porNome[l.nome] ??= []).push(l);
  for (const [n, ls] of Object.entries(porNome)) console.log(`| ${n} | ${ls.length} | ${(ls.reduce((s, l) => s + l.pico, 0) / ls.length).toFixed(1)} | ${ls.reduce((s, l) => s + l.f13, 0)} | ${ls.reduce((s, l) => s + l.h13, 0)} |`);
  const tot: Record<string, number> = {};
  for (const l of linhas) for (const [id, n] of Object.entries(l.porId)) tot[id] = (tot[id] ?? 0) + n;
  console.log('\n| evento | vezes | vidas |\n|---|---|---|');
  for (const [id, n] of Object.entries(tot).sort((a, b) => b[1] - a[1])) console.log(`| ${id} | ${n} | ${linhas.filter(l => l.porId[id]).length} |`);
  console.log(`\nmáximo de eventos novos num mesmo ano: ${Math.max(0, ...linhas.map(l => l.maxNoAno))}`);
  console.log(`anônimos (pico < 10) com alguma reação f13: ${linhas.filter(l => l.pico < 10 && l.f13 > 0).length}`);
}
void principal();
