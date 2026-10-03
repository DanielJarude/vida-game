/**
 * Transferências internacionais (auditoria): existe "América do Sul → Europa"?
 *
 *   npx esbuild scripts/sim/transferencias.ts --bundle --platform=node --outfile=/tmp/tr.cjs && node /tmp/tr.cjs
 *
 * Parte 1 (natural): jogadores profissionais em vários países, aos ~22, na elite (nível 4) e na Série B (nível 3),
 *   reputação 40..80, vivem 14 anos respondendo; a proposta é aceita. Duas estratégias: renovar quando o contrato
 *   vence, ou "testar o mercado" e pedir ao empresário um clube maior todo ano.
 * Parte 2 (forçada): monta a proposta de um clube de fora com `criarProposta` e aceita pela decisão de verdade —
 *   para conferir o encanamento (residência, liga, moeda, seleção, migração, biografia).
 * Parte 3: basquete/vôlei fora do Brasil (de onde vem a equipe que faz a proposta?) e técnico (clubes de fora?).
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar, criarProposta, propostaNaMesa, assinarContrato } from '../../src/motor/sistemas/esporte';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { sortearMunicipio, paisDaCidade, municipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { clubesDoPais, clubesDoNivel, divisaoDoNivel } from '../../src/motor/dados/clubes';
import { paisDaVida, entrarNaVida, nacionalidadesDaVida } from '../../src/motor/mundo/vida';
import { paisEsportivo } from '../../src/motor/sistemas/selecao';
import { dinheiro } from '../../src/motor/texto';
import { abrirDecisao, conteudoPorId } from '../../src/motor/conteudo/motor';
import { contexto } from '../../src/motor/conteudo/base';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { processarTecnico, criarPropostaDeTecnico, aceitarPropostaDeTecnico } from '../../src/motor/sistemas/tecnico';
import { perfilDoPais, temPerfil } from '../../src/motor/mundo/registro';
import * as fs from 'node:fs';

const OUT = process.env.OUT ?? '/tmp/claude-1000/-mnt-c-Daniel-vida-game/9e199cec-4f76-4281-a547-ee7e3efef423/scratchpad/unicidade';
const PAISES = (process.env.PAISES ?? 'AR,BR,UY,CO,NG,MA,JP,MX,PT,CL').split(',');
const SEMENTES = Number(process.env.SEMENTES ?? 2);
const ANOS = Number(process.env.ANOS ?? 14);
const REPS = [40, 55, 65, 75, 80];
const log: string[] = [];
const say = (s: string) => { log.push(s); console.log(s); };

function responderPrimeira(v: Vida): Vida { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; return v; }

const BASES = new Map<string, Vida>();
function adultoEm(pais: string, s: number, ate = 21): Vida {
  const k = `${pais}:${s}:${ate}`;
  if (BASES.has(k)) return structuredClone(BASES.get(k)!);
  let semente = 7000 + s * 104729 + pais.charCodeAt(0) * 31 + pais.charCodeAt(1);
  for (;;) {
    const r = criarRng(semente);
    const m = sortearMunicipio(() => r.next(), pais);
    let v = criarVida({ nome: sortearNome(r, 'masculino', 2026, pais, m.uf), sobrenome: sortearSobrenome(r, pais, m.uf), genero: 'masculino', municipioId: m.id, semente });
    for (let a = 0; a < ate && !v.morte; a++) { v = responderPrimeira(v); v = avancarAno(v).vida; }
    v = responderPrimeira(v);
    if (!v.morte) { v.momento = null; BASES.set(k, v); return structuredClone(v); }
    semente++;
  }
}

/** Um profissional de futebol no país da vida, num clube de lá do nível dado. */
function profissional(v: Vida, nivel: 3 | 4, rep: number, h: number): Vida {
  return transacao(v, (x, r) => {
    const pais = paisDaVida(x);
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: h, interesse: 90, meses: 160, auge: Math.max(h, 84) });
    x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
    x.financas.conta += 50000;
    const clube = clubesDoNivel(nivel, undefined, pais)[0];
    entrarNaBase(x, 'futebol', x.moradia.municipioId, clube.nome);
    profissionalizar(x, r, nivel);
    const e = x.caminhos.esporte!;
    e.nivel = nivel; e.reputacao = rep; e.espaco = 'titular';
    assinarContrato(x, e, 24);
    x.momento = null; x.caminhos.pendente = undefined;
  }).vida;
}

interface Tr { pais: string; rep: number; nivel: number; estrategia: string; propostas: number; propostasFora: number; aceitasFora: number; destinos: string[]; problemas: string[]; exemplos: string[] }

const BR_ESPECIFICO = /Série A|Série B|Brasileirão|Copa do Brasil|estadual|R\$|reais\b/;

function viverJogador(pais: string, s: number, rep: number, nivel: 3 | 4, estr: 'renovar' | 'mercado'): Tr {
  const h = 70 + Math.round((rep - 40) / 3);
  let v = profissional(adultoEm(pais, s), nivel, rep, h);
  const r = criarRng(s * 31 + rep);
  const tr: Tr = { pais, rep, nivel, estrategia: estr, propostas: 0, propostasFora: 0, aceitasFora: 0, destinos: [], problemas: [], exemplos: [] };
  const responder = () => {
    for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
      const m = v.momento; const livres = m.opcoes.filter(o => !o.bloqueio);
      let op = livres[0]?.id ?? m.opcoes[0].id;
      if (m.situacaoId === 'esp_proposta') {
        tr.propostas++;
        const p = propostaNaMesa(v);
        const fora = p && paisDaCidade(p.municipioId) !== paisDaVida(v);
        if (fora) { tr.propostasFora++; tr.exemplos.push(`PROPOSTA ${m.titulo}: ${m.texto} || ${m.opcoes.map(o => o.detalhe ?? '').join(' ')}`); }
        op = livres.find(o => o.id === 'aceitar')?.id ?? op;
        const antesPais = paisDaVida(v);
        const bioAntes = v.biografia.length;
        v = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
        if (fora && op === 'aceitar') {
          tr.aceitasFora++;
          const clubePais = paisDaCidade(v.caminhos.esporte!.municipioId!);
          tr.destinos.push(`${antesPais}→${clubePais}`);
          if (paisDaVida(v) !== clubePais) tr.problemas.push(`residência ${paisDaVida(v)} ≠ clube ${clubePais}`);
          if (!(v.mundo?.migracoes ?? []).length) tr.problemas.push('sem registro em v.mundo.migracoes');
          tr.exemplos.push(`BIO: ${v.biografia.slice(bioAntes).map(b => b.texto).join(' | ')}`);
        }
        continue;
      }
      if (m.situacaoId === 'esp_renovacao') op = (estr === 'mercado' ? livres.find(o => o.id === 'mercado') : livres.find(o => o.id === 'renovar' || o.id === 'assinar'))?.id ?? op;
      if (m.situacaoId === 'esp_mercado') op = livres.find(o => o.id === 'maior')?.id ?? op;
      if (m.situacaoId === 'esp_pendurar') op = livres.find(o => o.id === 'nao')?.id ?? op;
      v = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
    }
  };
  for (let a = 0; a < ANOS && !v.morte; a++) {
    if (estr === 'mercado' && v.caminhos.esporte?.fase === 'profissional') {
      const ac = { tipo: 'profissao', oque: 'mercado' } as unknown as Acao;
      if (podeTentar(disponibilidade(v, ac))) { v = executar(v, ac).vida; responder(); }
    }
    v = avancarAno(v).vida;
    responder();
  }
  return tr;
}

/** Parte 2: a proposta de fora, forçada, aceita pela decisão de verdade. */
function forcada(pais: string, s: number, rep: number): string[] {
  const out: string[] = [];
  const base = profissional(adultoEm(pais, s), 4, rep, 88);
  let v: Vida | undefined;
  for (let k = 0; k < 400 && !v; k++) {
    const t = transacao(structuredClone(base), x => { x.id = `${x.id}_${k}`; const e = x.caminhos.esporte!; e.proposta = undefined; criarProposta(x, e, 4, 'maior'); x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    const p = t.caminhos.esporte!.proposta;
    if (p && paisDaCidade(p.municipioId) !== pais) v = t;
  }
  if (!v) { out.push(`  ${pais} rep ${rep}: nenhuma proposta de fora em 400 tentativas (criarProposta direto, nível 4, origem 'maior')`); return out; }
  const p = v.caminhos.esporte!.proposta!;
  const dest = paisDaCidade(p.municipioId);
  v = transacao(v, (x, r) => { const d = conteudoPorId('esp_proposta'); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
  const m = v.momento;
  if (!m) { out.push(`  ${pais}: a decisão esp_proposta não abriu`); return out; }
  out.push(`  ${pais} (rep ${rep}) → ${dest}: «${m.titulo}» ${m.texto}`);
  out.push(`     opções: ${m.opcoes.map(o => `[${o.id}] ${o.texto}${o.bloqueio ? ` (bloq: ${o.bloqueio})` : ''}${o.detalhe ? ` — ${o.detalhe}` : ''}`).join(' · ')}`);
  const bio0 = v.biografia.length;
  const nac0 = nacionalidadesDaVida(v).join('+');
  v = executar(v, { tipo: 'decidir', opcaoId: 'aceitar' }).vida;
  v = responderPrimeira(v);
  entrarNaVida(v);
  const e = v.caminhos.esporte!;
  out.push(`     depois: mora em ${municipio(v.moradia.municipioId).nome} (${paisDaVida(v)}), clube ${e.clube} em ${paisDaCidade(e.municipioId!)}, emprego em ${v.trabalho.atual ? paisDaCidade(v.trabalho.atual.municipioId) : '—'}; salário ${v.trabalho.atual ? dinheiro(v.trabalho.atual.salario) : '—'}; conta ${dinheiro(v.financas.conta)}`);
  out.push(`     migrações: ${JSON.stringify((v.mundo?.migracoes ?? []).map(x => ({ para: paisDaCidade(x.para), motivo: x.motivo, via: x.via })))}; seleção: ${paisEsportivo(v)} (nacionalidade ${nac0}); divisão elite de lá: ${divisaoDoNivel(4, dest)}`);
  out.push(`     biografia nova: ${v.biografia.slice(bio0).map(b => b.texto).join(' | ')}`);
  // Mais 3 temporadas lá: a liga nos textos é a de lá?
  const bio1 = v.biografia.length;
  for (let a = 0; a < 3 && !v.morte; a++) { v = avancarAno(v).vida; v = responderPrimeira(v); }
  const novos = v.biografia.slice(bio1).map(b => b.texto);
  const br = novos.filter(t => dest !== 'BR' && BR_ESPECIFICO.test(t));
  out.push(`     3 anos lá: ${novos.length} linhas; com termo brasileiro: ${br.length}${br.length ? ` — ex.: ${br.slice(0, 3).join(' | ')}` : ''}`);
  const temp = (v.caminhos.esporte?.temporadas ?? []).slice(-3).map(t => `${t.clube}/n${t.nivel}`);
  out.push(`     temporadas: ${temp.join(', ')}; residência agora ${paisDaVida(v)}; amostra: ${novos.filter(t => /temporada|título|liga|campe|divis|jog/i.test(t)).slice(0, 4).join(' | ')}`);
  return out;
}

/** Parte 3: basquete / vôlei fora do Brasil — de onde vem a equipe da proposta? */
function coletivaFora(pais: string, d: 'basquete' | 'volei', s: number): string {
  let v = adultoEm(pais, s);
  v = transacao(v, (x, r) => {
    garantirFrente(x, d);
    Object.assign(x.caminhos.frentes[d]!, { habilidade: 86, interesse: 90, meses: 140, auge: 88 });
    x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
    entrarNaBase(x, d, x.moradia.municipioId, `equipe de ${d} de ${municipio(x.moradia.municipioId).nome}`);
    profissionalizar(x, r, 2);
  }).vida;
  const e0 = v.caminhos.esporte;
  if (!e0 || e0.fase !== 'profissional') return `  ${pais} ${d}: não profissionalizou`;
  const achados: string[] = [];
  for (const nivel of [3, 1] as const) for (const origem of ['mercado', 'liberacao'] as const) {
    const t = transacao(structuredClone(v), x => { const e = x.caminhos.esporte!; e.proposta = undefined; criarProposta(x, e, nivel, origem); }).vida;
    const p = t.caminhos.esporte!.proposta;
    if (p) achados.push(`n${nivel}/${origem}: ${p.clube} em ${municipio(p.municipioId).nome} (${paisDaCidade(p.municipioId)})`);
  }
  const b0 = v.biografia.length;
  for (let a = 0; a < 5 && !v.morte; a++) { v = avancarAno(v).vida; v = responderPrimeira(v); }
  const ligas = v.biografia.slice(b0).map(b => b.texto).filter(t => /NBB|Liga Ouro|Superliga|estadual|Brasil/.test(t));
  return `  ${pais} ${d}: equipe atual «${e0.clube}» em ${paisDaCidade(e0.municipioId!)}; propostas: ${achados.join(' · ')}\n     5 anos depois: mora em ${paisDaVida(v)}, equipe em ${v.caminhos.esporte?.municipioId ? paisDaCidade(v.caminhos.esporte.municipioId) : '—'}; frases com liga brasileira: ${ligas.slice(0, 4).join(' | ') || '—'}`;
}

function tecnicoFora(pais: string, s: number): string {
  let v = adultoEm(pais, s, 38);
  v = transacao(v, (x, r) => {
    x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
    garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 70, interesse: 90, meses: 200, auge: 84 });
    x.trabalho.experiencia['treino'] = 60;
    contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade');
    processarTecnico(x, r);
    x.momento = null;
  }).vida;
  const clubes: string[] = [];
  for (let k = 0; k < 10; k++) {
    v = transacao(v, (x, r) => {
      x.t += 12; processarTecnico(x, r);
      const c = x.caminhos.tecnico;
      if (c && !c.proposta) criarPropostaDeTecnico(x, r, c, (1 + (k % 4)) as 1 | 2 | 3 | 4, 'sem_clube');
      if (c?.proposta) { clubes.push(`${c.proposta.clube}(${paisDaCidade(c.proposta.municipioId)})`); aceitarPropostaDeTecnico(x, r, c.proposta.id); }
    }).vida;
  }
  const paises = new Set(clubes.map(c => c.slice(-3, -1)));
  const bio = v.biografia.filter(b => /comando|técnic|estadual|Série|liga|campeonato/i.test(b.texto)).slice(-4).map(b => b.texto);
  return `  ${pais} técnico: ${clubes.length} propostas, países dos clubes: ${[...paises].join(',')} · ex.: ${clubes.slice(0, 4).join(', ')}\n     bio: ${bio.join(' | ')}`;
}

async function main() {
  const falhas = await carregarMundo();
  if (falhas.length) throw new Error(`regiões que não carregaram: ${falhas}`);
  fs.mkdirSync(OUT, { recursive: true });
  say(`# Transferências internacionais — ${new Date().toISOString()}`);
  say(`clubes por país: ${PAISES.map(p => `${p}:${clubesDoPais(p).length}`).join(' ')} · ES:${clubesDoPais('ES').length} GB:${clubesDoPais('GB').length} IT:${clubesDoPais('IT').length}`);
  say(`ligas: ${PAISES.map(p => `${p}=${temPerfil(p) ? perfilDoPais(p).esporte.divisoes.join('/') : '?'}`).join(' ; ')}`);
  say('\n## Parte 1 — natural');
  const tabela: Tr[] = [];
  for (const pais of PAISES) for (let s = 1; s <= SEMENTES; s++) for (const rep of REPS) for (const nivel of [4, 3] as const) for (const estr of ['renovar', 'mercado'] as const) {
    try { tabela.push(viverJogador(pais, s, rep, nivel, estr)); } catch (err) { say(`ERRO ${pais} s${s} rep${rep}: ${(err as Error).stack?.split('\n').slice(0, 3).join(' | ')}`); }
  }
  say('| país | vidas | propostas | de fora | aceitas de fora | destinos | problemas |');
  say('| --- | --- | --- | --- | --- | --- | --- |');
  for (const pais of PAISES) {
    const xs = tabela.filter(t => t.pais === pais);
    const soma = (f: (t: Tr) => number) => xs.reduce((a, t) => a + f(t), 0);
    const dest = new Map<string, number>(); for (const t of xs) for (const d of t.destinos) dest.set(d, (dest.get(d) ?? 0) + 1);
    say(`| ${pais} | ${xs.length} | ${soma(t => t.propostas)} | ${soma(t => t.propostasFora)} | ${soma(t => t.aceitasFora)} | ${[...dest].map(([a, b]) => `${a}:${b}`).join(' ') || '—'} | ${[...new Set(xs.flatMap(t => t.problemas))].join('; ') || '—'} |`);
  }
  for (const t of tabela.filter(x => x.exemplos.length).slice(0, 6)) say(`ex ${t.pais} rep${t.rep}: ${t.exemplos.slice(0, 2).join(' /// ')}`);
  say('\n## Parte 2 — forçada (criarProposta nível 4, origem maior, até sair um clube de fora)');
  for (const pais of PAISES) for (const rep of [60, 80]) { try { forcada(pais, 1, rep).forEach(say); } catch (err) { say(`ERRO forcada ${pais}: ${(err as Error).stack?.split('\n').slice(0, 3).join(' | ')}`); } }
  say('\n## Parte 3 — basquete / vôlei / técnico');
  for (const pais of ['AR', 'JP', 'ES', 'BR']) for (const d of ['basquete', 'volei'] as const) { try { say(coletivaFora(pais, d, 1)); } catch (err) { say(`ERRO ${pais} ${d}: ${(err as Error).message}`); } }
  for (const pais of ['AR', 'JP', 'PT', 'BR']) { try { say(tecnicoFora(pais, 1)); } catch (err) { say(`ERRO técnico ${pais}: ${(err as Error).stack?.split('\n').slice(0, 3).join(' | ')}`); } }
  fs.writeFileSync(`${OUT}/transferencias.txt`, log.join('\n'));
}
void main();
