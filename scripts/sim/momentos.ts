/**
 * Career Moments 2.0 — a medida (antes/depois). Quantos momentos de carreira
 * uma trajetória especial produz por ano, como se distribuem (intervalos,
 * maior silêncio), quantos modelos diferentes e quanta repetição.
 *
 *   npx esbuild scripts/sim/momentos.ts --bundle --platform=node --outfile=/tmp/mom.cjs
 *   VIDAS=30 ANOS=20 node /tmp/mom.cjs              (todas as carreiras)
 *   SO=futebol,tecnico VIDAS=30 node /tmp/mom.cjs   (só algumas)
 *
 * Cada vida entra na carreira (como o jogo faria: contrato, concurso, posse,
 * profissionalização) e vive ANOS anos respondendo às decisões com a
 * estratégia do simulador. Conta só os anos em que a carreira estava ATIVA.
 * Janelas de 10, 15 e 20 anos: a mesma vida, os primeiros N anos.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { entrarNaPolitica } from '../../src/motor/sistemas/politica';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { abrirNegocio } from '../../src/motor/sistemas/negocio';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { trajetoriaDeSituacao } from '../../src/motor/sistemas/situacoes';
import { estrategia } from './estrategias';

const N = Number(process.env.VIDAS ?? 30);
const ANOS = Number(process.env.ANOS ?? 20);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr'];
const quantil = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const POL = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);

interface Carreira {
  id: string;
  nome: string;
  idade: number;
  /** As trajetórias de situação que contam como "esta carreira". */
  trajetorias: string[];
  preparar: (x: Vida, r: Rng, s: number) => void;
  /** A carreira segue ativa (o ano conta). */
  ativa: (v: Vida) => boolean;
  agir?: (v: Vida) => Acao[];
  prefs?: string[];
  base?: string;
}

const atletaPro = (x: Vida, r: Rng, h0: number) => {
  garantirFrente(x, 'futebol');
  Object.assign(x.caminhos.frentes.futebol!, { habilidade: h0, interesse: 90, meses: 140, auge: h0 });
  x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = [];
  x.financas.conta += 100000;
  entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
  profissionalizar(x, r, h0 < 82 ? 1 : h0 < 86 ? 2 : h0 < 90 ? 3 : 4);
};
const limpar = (x: Vida) => { x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = []; };

const CARREIRAS: Carreira[] = [
  { id: 'futebol', nome: 'futebol (profissional)', idade: 18, trajetorias: ['futebol'], prefs: ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'], base: 'passivo',
    preparar: (x, r, s) => atletaPro(x, r, Math.min(94, 80 + (s % 7) * 2)),
    ativa: v => v.caminhos.esporte?.fase === 'profissional' },
  { id: 'tecnico', nome: 'técnico de futebol', idade: 36, trajetorias: ['tecnico', 'emprego'], prefs: ['aceitar', 'assinar', 'renovar', 'continuar', 'ficar'], base: 'passivo',
    preparar: (x, r) => { limpar(x); garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 70, interesse: 90, meses: 200, auge: 84 }); x.trabalho.experiencia['treino'] = 60; contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade'); },
    ativa: v => v.trabalho.atual?.ocupacaoId === 'tecnico_futebol' || (!!v.caminhos.tecnico && !v.caminhos.tecnico.tFim) },
  { id: 'medicina', nome: 'medicina', idade: 30, trajetorias: ['medicina'], base: 'passivo',
    preparar: (x, r) => { limpar(x); x.educacao.concluidos.push({ cursoId: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', tFim: x.t - 36, instituicao: 'a universidade federal' }); x.educacao.concluidos.push({ cursoId: 'residencia', nome: 'Residência em Clínica Médica', nivel: 'residencia', area: 'medicina', tFim: x.t - 6, instituicao: 'o hospital universitário', especialidade: 'clinica' } as never); contratar(x, r, ocupacao('medico_hospital'), 'concurso'); },
    ativa: v => trajetoriaDeSituacao(v) === 'medicina' },
  { id: 'academia', nome: 'academia (professor universitário)', idade: 30, trajetorias: ['academia'], base: 'passivo',
    preparar: (x, r) => { limpar(x); x.mente.cognicao = Math.max(x.mente.cognicao, 80); contratar(x, r, ocupacao('professor_univ'), 'concurso'); },
    ativa: v => trajetoriaDeSituacao(v) === 'academia' },
  { id: 'atuacao', nome: 'atuação / audiovisual', idade: 24, trajetorias: ['cena'], base: 'passivo',
    preparar: (x, r) => { limpar(x); garantirFrente(x, 'teatro'); Object.assign(x.caminhos.frentes.teatro!, { habilidade: 82, meses: 120, interesse: 90, auge: 86 }); contratar(x, r, ocupacao('ator'), 'oportunidade'); },
    ativa: v => trajetoriaDeSituacao(v) === 'cena' },
  { id: 'politica', nome: 'política (entra aos 25, disputa toda eleição)', idade: 25, trajetorias: ['politica'], base: 'social',
    prefs: ['p0', 'p1', 'cargo_vereador', 'cargo_prefeito', 'cargo_deputado_estadual', 'fin_pequenas', 'rua_porta', 'tom_propostas', 'entrar', 'continuar', 'ficar'],
    preparar: x => { entrarNaPolitica(x, 'comunidade', 1); },
    ativa: v => !!v.caminhos.politica && v.caminhos.politica.fase !== 'encerrada',
    agir: v => { const p = v.caminhos.politica; if (!p || p.fase === 'encerrada') return []; const out = [POL('comunidade')]; if (!p.partido) out.push(POL('filiar')); if (!p.prioridade) out.push(POL('bandeira', 'saude')); out.push(POL('candidatura')); if (p.mandato) out.push(POL('prioridade')); return out; } },
  { id: 'negocio', nome: 'negócio próprio', idade: 30, trajetorias: ['negocio'], base: 'passivo',
    preparar: (x, r) => { limpar(x); x.financas.conta += 60000; abrirNegocio(x, r, 'lanchonete'); },
    ativa: v => trajetoriaDeSituacao(v) === 'negocio' },
  { id: 'autonomo', nome: 'autônomo (eletricista)', idade: 26, trajetorias: ['autonomo'], base: 'passivo',
    preparar: (x, r) => { limpar(x); contratar(x, r, ocupacao('eletricista'), 'curriculo'); },
    ativa: v => trajetoriaDeSituacao(v) === 'autonomo' },
  { id: 'emprego', nome: 'emprego comum (analista administrativo)', idade: 26, trajetorias: ['emprego'], base: 'passivo',
    preparar: (x, r) => { limpar(x); contratar(x, r, ocupacao('analista_adm'), 'curriculo'); },
    ativa: v => trajetoriaDeSituacao(v) === 'emprego' }
];

interface Ano { ativa: boolean; momento?: string; sorteada: boolean }
/** Diagnóstico: que decisão ocupou o ano em que um momento foi sorteado. */
const TOMOU = new Map<string, number>();

function viverCarreira(c: Carreira, s: number): Ano[] | undefined {
  const r = criarRng(s * 7919 + c.id.length);
  let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 880000 + s * 13 + c.id.length * 1000 });
  for (let k = 0; k < c.idade && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
  if (v.morte) return undefined;
  v = transacao(v, (x, rr) => { c.preparar(x, rr, s); x.momento = null; }).vida;
  const e = estrategia(c.base ?? 'passivo');
  const decidir = () => { const m = v.momento!; const livres = m.opcoes.filter(o => !o.bloqueio); if (m.situacaoId !== 'car_situacao') for (const p of c.prefs ?? []) { const o = livres.find(x => x.id === p); if (o) return o.id; } return e.decidir(v, m, r); };
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir() }).vida; };
  const anos: Ano[] = [];
  for (let k = 0; k < ANOS && !v.morte; k++) {
    for (const a of [...(c.agir?.(v) ?? []), ...e.agir(v, r)]) {
      // A carreira não é abandonada pelo simulador (procurar outro emprego, outra carreira).
      if (a.tipo === 'candidatar' || a.tipo === 'matricular' || a.tipo === 'pedir_demissao' || (a.tipo as string) === 'abrir_negocio' || a.tipo === 'oportunidade') continue;
      if (!podeTentar(disponibilidade(v, a))) continue;
      v = executar(v, a).vida; responder();
    }
    const antes = (v.caminhos.situacoes ?? []).length;
    const ativaAntes = c.ativa(v);
    v = avancarAno(v).vida;
    const sorteada = !!v.caminhos.situacao && v.caminhos.situacao.t === v.t;
    if (process.env.DEBUG && sorteada && v.momento?.situacaoId !== 'car_situacao') TOMOU.set(v.momento?.situacaoId ?? '(nenhuma)', (TOMOU.get(v.momento?.situacaoId ?? '(nenhuma)') ?? 0) + 1);
    responder();
    const novos = (v.caminhos.situacoes ?? []).slice(antes).filter(x => c.trajetorias.includes(x.trajetoria));
    anos.push({ ativa: ativaAntes || c.ativa(v), momento: novos[0]?.id, sorteada });
  }
  return anos;
}

function analisar(vidas: Ano[][], janela: number): string {
  const porAno: number[] = [], maxSilencio: number[] = [], gaps: number[] = [], distintos: number[] = [], primeiro: number[] = [];
  let repeticoes = 0, momentos = 0, anosAtivos = 0, sorteadasPerdidas = 0;
  for (const anos of vidas) {
    const w = anos.slice(0, janela).filter(a => a.ativa);
    if (w.length < Math.min(janela, 5)) continue;
    const ms = w.map((a, k) => ({ k, id: a.momento })).filter(x => x.id);
    momentos += ms.length; anosAtivos += w.length;
    porAno.push(ms.length / w.length);
    sorteadasPerdidas += w.filter(a => a.sorteada && !a.momento).length;
    let corrida = 0, maior = 0;
    for (const a of w) { if (a.momento) corrida = 0; else { corrida++; maior = Math.max(maior, corrida); } }
    maxSilencio.push(maior);
    primeiro.push(ms.length ? ms[0].k + 1 : w.length + 1);
    for (let k = 1; k < ms.length; k++) gaps.push(ms[k].k - ms[k - 1].k);
    distintos.push(new Set(ms.map(x => x.id)).size);
    for (let k = 0; k < ms.length; k++) if (ms.slice(0, k).some(x => x.id === ms[k].id && ms[k].k - x.k <= 4)) repeticoes++;
  }
  const n = porAno.length;
  if (!n) return `| ${janela} | — | — | — | — | — | — | — |`;
  const g = gaps.length ? `${quantil(gaps, 0.25)} · ${quantil(gaps, 0.5)} · ${quantil(gaps, 0.75)} · ${Math.max(...gaps)}` : '—';
  return `| ${janela} | ${n} | ${(momentos / anosAtivos).toFixed(2)} (${media(porAno.map(x => x * janela)).toFixed(1)} por carreira) | ${quantil(primeiro, 0.5)} | ${g} | ${quantil(maxSilencio, 0.5)} · ${Math.max(...maxSilencio)} | ${media(distintos).toFixed(1)} | ${momentos ? Math.round(repeticoes / momentos * 100) : 0}% | ${anosAtivos ? Math.round(sorteadasPerdidas / anosAtivos * 100) : 0}% |`;
}

const SO = process.env.SO?.split(',');
for (const c of CARREIRAS.filter(x => !SO || SO.includes(x.id))) {
  const vidas: Ano[][] = [];
  for (let s = 1; s <= N; s++) { const a = viverCarreira(c, s); if (a) vidas.push(a); }
  console.log(`\n### ${c.nome} — ${vidas.length} vidas, a partir dos ${c.idade}\n`);
  console.log('| janela (anos) | carreiras | momentos/ano ativo | 1º momento (ano, mediana) | intervalos p25 · mediana · p75 · máx | maior silêncio mediana · máx | modelos distintos | repetição ≤ 4 anos | sorteada e não vivida (por ano) |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const j of [10, 15, 20].filter(x => x <= ANOS)) console.log(analisar(vidas, j));
  if (process.env.DEBUG) { console.log('ocupado por:', JSON.stringify([...TOMOU.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8))); TOMOU.clear(); }
}
