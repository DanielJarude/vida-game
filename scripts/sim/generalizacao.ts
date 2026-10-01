/**
 * Simulações dirigidas do pacote de generalização de carreiras e legado.
 * Amostras para ver comportamento emergente — não a simulação oficial de mil
 * vidas.
 *
 *   npx esbuild scripts/sim/generalizacao.ts --bundle --platform=node --outfile=/tmp/gen.cjs
 *   VIDAS=150 SO=I node /tmp/gen.cjs
 *
 *   I idade de início — futebol perseguido a partir dos 7, 10, 12, 14 e 16,
 *                       com dedicação alta (treino de fundamentos, pedir teste)
 *                       ou regular (só o treino na semana): base, profissional,
 *                       idade e nível do primeiro contrato, carreira até os 27,
 *                       separados por facilidade de nascença e corpo
 *   M modalidades     — basquete e tênis profissionais (17 → 34): temporadas,
 *                       títulos, finais, prêmios, representação nacional,
 *                       transferências, momentos de carreira
 *   L legado          — vidas de várias trajetórias até os 70: o que fica
 *                       consultável (trajetórias, realizações, linha da vida)
 *
 * Sempre pelo que o jogador pode fazer (`disponibilidade` → `executar`).
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { aptidao, garantirFrente } from '../../src/motor/sistemas/frentes';
import { predisposicao } from '../../src/motor/sistemas/predisposicao';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { estrategia } from './estrategias';
import * as legado from '../../src/motor/sistemas/legado';
import { retrospectiva } from '../../src/motor/sistemas/retrospectiva';

const N = Number(process.env.VIDAS ?? 120);
const SO = (process.env.SO ?? 'I').split(',');
const IDADES = (process.env.IDADES ?? '7,10,12,14,16').split(',').map(Number);
const ATE = Number(process.env.ATE ?? 27);
const pct = (xs: boolean[]) => (xs.length ? `${Math.round(xs.filter(Boolean).length / xs.length * 100)}%` : '—');
const pctN = (xs: boolean[]) => (xs.length ? `${pct(xs)} (${xs.filter(Boolean).length}/${xs.length})` : '—');
const quantil = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const mediana = (xs: number[]) => quantil(xs, 0.5);
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr'];
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
const portas = (v: Vida, tipos: string[]): Acao[] => v.caminhos.oportunidades.filter(o => tipos.includes(o.tipo)).map(o => ({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao));

function viver(v: Vida, ate: number, base: string, extra: (v: Vida, r: Rng) => Acao[], prefs: string[], r: Rng, ano?: (v: Vida) => void, filtro: (v: Vida, a: Acao) => boolean = () => true): Vida {
  const e = estrategia(base);
  const decidir = () => { const m = v.momento!; const livres = m.opcoes.filter(o => !o.bloqueio); for (const p of prefs) { const o = livres.find(x => x.id === p); if (o) return o.id; } return e.decidir(v, m, r); };
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir() }).vida; };
  while (!v.morte && idade(v) < ate) {
    for (const a of [...extra(v, r), ...e.agir(v, r)]) { if (!filtro(v, a) || !tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    for (const a of extra(v, r).filter(x => x.tipo === 'oportunidade')) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida; responder(); ano?.(v);
  }
  return v;
}

/* ============================================================ I. Idade de início */

interface Res { inicio: number; dedicacao: string; apt: number; fis: number; base: boolean; idadeBase?: number; pro: boolean; idadePro?: number; nivel0?: number; maxNivel: number; anosPro: number; h17: number; h20: number; rota?: string }

function idadeDeInicio(): void {
  console.log(`\n## I. Futebol por idade de início (${N} vidas por grupo, até os ${ATE})\n`);
  const todos: Res[] = [];
  for (const inicio of IDADES) for (const dedicacao of ['alta', 'regular']) {
    for (let s = 1; s <= N; s++) {
      const semente = 70000 + inicio * 1000 + s;
      const r = criarRng(semente * 7);
      const res: Res = { inicio, dedicacao, apt: 0, fis: 0, base: false, pro: false, maxNivel: 0, anosPro: 0, h17: 0, h20: 0 };
      const extra = (v: Vida): Acao[] => {
        const i = idade(v);
        const out: Acao[] = [];
        if (i >= inicio && i <= 24) {
          if (!v.rotinas.some(x => x.id === 'futebol' && (x.nivel ?? 1) >= 2) && v.caminhos.esporte?.fase !== 'profissional') out.push({ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 } as Acao);
          if (dedicacao === 'alta') {
            if (i >= 9 && i <= 15 && !v.rotinas.some(x => x.id === 'time_escola')) out.push({ tipo: 'rotina', id: 'time_escola', ativa: true, nivel: 1 } as Acao);
            out.push(P('treino_fundamentos', 'futebol'), P('pedir_teste', 'futebol'));
          }
        }
        if (i >= inicio) out.push(...portas(v, ['peneira', 'convite', 'seletiva']));
        return out;
      };
      // Antes da idade de início, futebol não entra na vida (nem a pelada, nem o time da escola).
      const filtro = (w: Vida, a: Acao) => {
        const fut = (a.tipo === 'rotina' && ((a as { id: string }).id === 'futebol' || (a as { id: string }).id === 'time_escola'));
        if (fut && idade(w) < inicio) return false;
        // Quem está na carreira não larga por um emprego comum.
        if (w.caminhos.esporte && w.caminhos.esporte.fase !== 'encerrada' && (a.tipo === 'candidatar' || (a.tipo === 'oportunidade' && !['peneira', 'convite', 'seletiva'].includes(w.caminhos.oportunidades.find(o => o.id === (a as { id: string }).id)?.tipo ?? '')))) return false;
        return true;
      };
      let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: 'masculino', municipioId: CIDADES[s % CIDADES.length], semente });
      v.rotinas = v.rotinas.filter(x => x.id !== 'futebol' && x.id !== 'time_escola');
      res.apt = aptidao(v, 'futebol'); res.fis = predisposicao(v, 'fisica');
      v = viver(v, ATE, 'familiar', extra, ['assinar', 'aceitar', 'renovar', 'descer', 'ir', 'sim', 'entrar', 'seguir', 'tentar', 'treinar'], r, w => {
        const i = idade(w);
        if (i === 17) res.h17 = w.caminhos.frentes.futebol?.habilidade ?? 0;
        if (i === 20) res.h20 = w.caminhos.frentes.futebol?.habilidade ?? 0;
        const e = w.caminhos.esporte;
        if (e?.modalidade !== 'futebol') return;
        if (e.fase === 'base' && !res.base && e.origem !== 'amador') { res.base = true; res.idadeBase = i; }
        if (e.fase === 'profissional') {
          if (!res.pro) { res.pro = true; res.idadePro = i; res.nivel0 = e.nivel; res.rota = res.base && res.idadeBase !== undefined ? 'base' : 'direto'; }
          res.anosPro += w.trabalho.atual ? 1 : 0;
          res.maxNivel = Math.max(res.maxNivel, e.nivel);
        }
      }, filtro);
      // A rota: base (passou por uma base) ou amadora (contrato sem base, pelo campeonato amador).
      if (res.pro && [...(v.caminhos.carreirasEsportivas ?? []), v.caminhos.esporte].some(c => c?.origem === 'amador')) res.rota = 'amadora';
      todos.push(res);
    }
  }
  const linha = (xs: Res[]) => {
    const pros = xs.filter(x => x.pro);
    return `${xs.length} | ${pctN(xs.map(x => x.base))} | ${pctN(xs.map(x => x.pro))} | ${pros.length ? mediana(pros.map(x => x.idadePro!)) : '—'} | ${pros.length ? `${pct(pros.map(x => x.nivel0 === 1))}/${pct(pros.map(x => x.nivel0 === 2))}/${pct(pros.map(x => (x.nivel0 ?? 0) >= 3))}` : '—'} | ${pros.length ? mediana(pros.map(x => x.maxNivel)) : '—'} | ${pros.length ? media(pros.map(x => x.anosPro)).toFixed(1) : '—'} | ${mediana(xs.map(x => x.h17)).toFixed(0)} · ${mediana(xs.map(x => x.h20)).toFixed(0)}`;
  };
  console.log('| início | dedicação | vidas | chegou a uma base | profissional | idade do 1º contrato (mediana) | nível inicial (estadual/acesso/B+) | maior divisão até os 27 (mediana) | anos como profissional até os 27 (média) | técnica aos 17 · 20 (mediana) |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const inicio of IDADES) for (const ded of ['alta', 'regular']) console.log(`| ${inicio} | ${ded} | ${linha(todos.filter(x => x.inicio === inicio && x.dedicacao === ded))} |`);
  console.log('\n**Por facilidade de nascença no futebol (dedicação alta):**\n');
  console.log('| início | facilidade | vidas | chegou a uma base | profissional | idade do 1º contrato | nível inicial | maior divisão | anos pro | técnica 17 · 20 |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  const faixas: [string, (x: Res) => boolean][] = [['baixa (< −0,2)', x => x.apt < -0.2], ['média', x => x.apt >= -0.2 && x.apt <= 0.2], ['alta (> 0,2)', x => x.apt > 0.2], ['excepcional (> 0,45)', x => x.apt > 0.45]];
  for (const inicio of IDADES) for (const [nome, f] of faixas) console.log(`| ${inicio} | ${nome} | ${linha(todos.filter(x => x.inicio === inicio && x.dedicacao === 'alta' && f(x)))} |`);
  console.log('\n**Por corpo (predisposição física), dedicação alta, início aos 14 e 16:**\n');
  console.log('| início | corpo | vidas | chegou a uma base | profissional | idade do 1º contrato | nível inicial | maior divisão | anos pro | técnica 17 · 20 |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const inicio of IDADES.filter(i => i >= 14)) for (const [nome, f] of [['abaixo da média', (x: Res) => x.fis < 0], ['acima da média', (x: Res) => x.fis >= 0]] as [string, (x: Res) => boolean][]) console.log(`| ${inicio} | ${nome} | ${linha(todos.filter(x => x.inicio === inicio && x.dedicacao === 'alta' && f(x)))} |`);
  const rotas = todos.filter(x => x.pro);
  console.log(`\nRota de quem se profissionalizou: ${IDADES.map(i => { const xs = rotas.filter(x => x.inicio === i); return `${i} anos → base ${xs.filter(x => x.rota === 'base').length} · amadora ${xs.filter(x => x.rota === 'amadora').length} · direto ${xs.filter(x => x.rota === 'direto').length}`; }).join(' | ')}`);
  const tardios = rotas.filter(x => x.inicio >= 14);
  if (tardios.length) console.log(`\nCasos tardios (início ≥ 14) que viraram profissionais:\n${tardios.slice(0, 12).map(x => `- início ${x.inicio}, dedicação ${x.dedicacao}, facilidade ${x.apt.toFixed(2)}, corpo ${x.fis.toFixed(2)}: base ${x.idadeBase ?? '—'}, contrato aos ${x.idadePro}, nível ${x.nivel0}, maior divisão ${x.maxNivel}, ${x.anosPro} anos pro (rota ${x.rota})`).join('\n')}`);
}

/* ============================================================ M. Modalidades (basquete, tênis) */

function modalidades(): void {
  for (const d of ['basquete', 'tenis'] as const) {
    console.log(`\n## M. ${d === 'basquete' ? 'Basquete' : 'Tênis'} — ${N} carreiras a partir do primeiro contrato (18 → 34)\n`);
    const out = { temporadas: [] as number[], titulos: [] as number[], finais: [] as number[], premios: [] as number[], selecao: [] as boolean[], torneiosSel: [] as number[], clubes: [] as number[], momentos: [] as number[], maxNivel: [] as number[], melhorRanking: [] as number[], legado: [] as boolean[] };
    const exemplos: string[] = [];
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 41);
      const h0 = Math.min(95, 80 + Math.abs(r.normal()) * 5);
      let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 3 === 0 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 90000 + s + (d === 'tenis' ? 5000 : 0) });
      for (let k = 0; k < 18 && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
      if (v.morte) continue;
      v = transacao(v, (x, rr) => {
        garantirFrente(x, d);
        Object.assign(x.caminhos.frentes[d]!, { habilidade: h0, interesse: 90, meses: 120, auge: h0 });
        x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined;
        if (d === 'tenis') x.financas.conta += 400000;
        entrarNaBase(x, d, x.moradia.municipioId, d === 'tenis' ? `academia de tênis de ${x.moradia.municipioId}` : 'equipe da prefeitura');
        profissionalizar(x, rr, h0 < 82 ? 1 : h0 < 86 ? 2 : h0 < 90 ? 3 : 4);
      }).vida;
      let maxN = 0;
      v = viver(v, 34, 'passivo', w => [...portas(w, ['convite'])], ['aceitar', 'renovar', 'descer', 'assinar', 'mercado', 'ficar', 'continuar', 'seguir', 'i0', 'i1'], r, w => { const e = w.caminhos.esporte; if (e?.fase === 'profissional') maxN = Math.max(maxN, e.nivel); }, (w, a) => !(a.tipo === 'candidatar'));
      const e = v.caminhos.esporte;
      const pal = (v.caminhos.palmares ?? []).filter(x => x.modalidade === d);
      out.temporadas.push(e?.temporadas?.length ?? 0);
      out.titulos.push(pal.filter(x => x.tipo === 'titulo').length);
      out.finais.push(pal.filter(x => x.tipo === 'final').length);
      out.premios.push(pal.filter(x => x.tipo === 'premio').length);
      out.selecao.push((e?.selecao?.convocacoes ?? 0) > 0);
      out.torneiosSel.push(e?.selecao?.torneios.length ?? 0);
      out.clubes.push(new Set((e?.temporadas ?? []).map(t => t.clube)).size);
      out.momentos.push((v.caminhos.situacoes ?? []).filter(x => x.trajetoria === d).length);
      out.maxNivel.push(maxN);
      out.melhorRanking.push(Math.min(9999, ...(e?.temporadas ?? []).map(t => t.ranking ?? 9999)));
      const tr = legado.trajetoriasDaVida(v).find(x => x.area === 'esporte');
      out.legado.push(!!tr && tr.realizacoes.length > 0);
      if (exemplos.length < 3 && tr) exemplos.push(`- ${tr.titulo} (${tr.periodo}): ${tr.resumo}${tr.realizacoes.length ? ` — ${tr.realizacoes.slice(0, 3).join('; ')}` : ''}`);
    }
    console.log('| temporadas (mediana) | maior nível (mediana) | títulos (média · % com) | finais (média) | prêmios (média · % com) | representação nacional | torneios pelo país (média) | equipes por carreira (média) | melhor ranking (mediana) | momentos de carreira (média) | trajetória com realizações |');
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    console.log(`| ${mediana(out.temporadas)} | ${mediana(out.maxNivel)} | ${media(out.titulos).toFixed(2)} · ${pct(out.titulos.map(x => x > 0))} | ${media(out.finais).toFixed(2)} | ${media(out.premios).toFixed(2)} · ${pct(out.premios.map(x => x > 0))} | ${pct(out.selecao)} | ${media(out.torneiosSel).toFixed(2)} | ${media(out.clubes).toFixed(1)} | ${d === 'tenis' ? `${mediana(out.melhorRanking)}º` : '—'} | ${media(out.momentos).toFixed(1)} | ${pct(out.legado)} |`);
    if (exemplos.length) console.log(`\nExemplos:\n${exemplos.join('\n')}`);
  }
}

/* ============================================================ L. Legado (vidas até os 70) */

function legadoDasVidas(): void {
  const ate = Number(process.env.ATE_L ?? 70);
  const estrategias = ['ambicioso', 'estudioso', 'familiar', 'social', 'economico', 'impulsivo'];
  console.log(`\n## L. Legado — ${N} vidas até os ${ate} (estratégias ${estrategias.join(', ')})\n`);
  const porArea = new Map<string, { n: number; encerradas: number; comRealizacao: number }>();
  const nTraj: number[] = [], nFrases: number[] = [], nBio: number[] = [], nRetro: number[] = [], encerradasConsultaveis: boolean[] = [];
  const exemplos: string[] = [];
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 17);
    const est = estrategias[s % estrategias.length];
    let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 120000 + s });
    v = viver(v, ate, est, () => [], ['aceitar', 'sim', 'ir', 'assinar', 'renovar'], r);
    if (v.morte && idade(v) < 40) continue;
    const ts = legado.trajetoriasDaVida(v);
    nTraj.push(ts.length);
    nFrases.push(legado.legadoEmFrases(v).length);
    nBio.push(v.biografia.length);
    nRetro.push(retrospectiva(v).length);
    encerradasConsultaveis.push(ts.some(t => !t.ativa));
    for (const t of ts) { const x = porArea.get(t.area) ?? { n: 0, encerradas: 0, comRealizacao: 0 }; x.n++; if (!t.ativa) x.encerradas++; if (t.realizacoes.length) x.comRealizacao++; porArea.set(t.area, x); }
    if (exemplos.length < 4 && ts.filter(t => t.area !== 'formacao').length >= 2) exemplos.push(`- (${est}, ${idade(v)} anos, ${v.biografia.length} acontecimentos na Linha da Vida)\n${ts.map(t => `  - **${t.titulo}** (${t.periodo}): ${t.resumo}${t.realizacoes.length ? ` — ${t.realizacoes.slice(0, 2).join('; ')}` : ''}`).join('\n')}`);
  }
  console.log(`Trajetórias por vida (mediana): ${mediana(nTraj)} · frases de legado (mediana): ${mediana(nFrases)} · acontecimentos na Linha da Vida (mediana): ${mediana(nBio)} · frases da retrospectiva (mediana): ${mediana(nRetro)}`);
  console.log(`Vidas com alguma trajetória encerrada ainda consultável: ${pct(encerradasConsultaveis)}\n`);
  console.log('| área | trajetórias | encerradas (consultáveis) | com realizações |');
  console.log('| --- | --- | --- | --- |');
  for (const [k, x] of [...porArea.entries()].sort((a, b) => b[1].n - a[1].n)) console.log(`| ${k} | ${x.n} | ${x.encerradas} | ${x.comRealizacao} |`);
  if (exemplos.length) console.log(`\nExemplos:\n${exemplos.join('\n')}`);
}

if (SO.includes('I')) idadeDeInicio();
if (SO.includes('L')) legadoDasVidas();
if (SO.includes('M')) modalidades();
