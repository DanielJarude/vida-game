/**
 * AUDITORIA 12.5 · CAR-11.9 — acontecimentos profissionais recorrentes, carreira por carreira, ao longo de 20–30 anos.
 *
 *   npx esbuild scripts/sim/auditoria125Carreiras.ts --bundle --platform=node --format=esm --outfile=$HOME/vida-trabalho/a125/car119.mjs
 *   VIDAS=8 ANOS=25 SO=futebol,musica node $HOME/vida-trabalho/a125/car119.mjs
 *
 * Cada vida entra na carreira (forçada como em `momentos.ts`/`arte115.ts`) e vive ANOS anos sem abandoná-la. Por ano de
 * carreira mede três camadas:
 *   cena      `caminhos.situacoes` da trajetória (cena `car_situacao` + decisão de contrato registrada)
 *   decisão   ocorrências de conteúdo profissional (tema trabalho ou catálogos profissionais), fora a `car_situacao`
 *   bio       linhas da biografia com tema 'trabalho' (relevância ≠ técnico) — o que o jogador lê depois
 * e por faixa de anos de carreira (0–5, 5–10, 10–20, 20+): frequência, variedade (distintos/total), repetição na vida,
 * anos vazios, coerência (texto de estreante em veterano; registro com a carreira inativa) e progressão.
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
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
import { ocupacao, ocupacaoOuNula } from '../../src/motor/dados/ocupacoes';
import { trajetoriaDeSituacao, candidatosDoAno, DECISOES_DE_CONTRATO, MODELOS } from '../../src/motor/sistemas/situacoes';
import { criarProjeto } from '../../src/motor/sistemas/arte';
import { remuneracaoDe } from '../../src/motor/sistemas/renda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { conteudoPorId } from '../../src/motor/conteudo/motor';
import { SITUACOES } from '../../src/motor/conteudo/situacoes';
import { TECNICO } from '../../src/motor/conteudo/tecnico';
import { FAMA } from '../../src/motor/conteudo/fama';
import { OFICIOS_CONTEUDO } from '../../src/motor/conteudo/oficios';
import { CARREIRAS as C_CARREIRAS } from '../../src/motor/conteudo/carreiras';
import { TRAJETORIAS } from '../../src/motor/conteudo/trajetorias';
import { PROFISSAO } from '../../src/motor/conteudo/profissao';
import { POLITICA } from '../../src/motor/conteudo/politica';
import { estrategia } from './estrategias';
import { writeFileSync } from 'node:fs';

const N = Number(process.env.VIDAS ?? 8);
const ANOS = Number(process.env.ANOS ?? 25);
const PROF = new Set([...SITUACOES, ...TECNICO, ...FAMA, ...OFICIOS_CONTEUDO, ...C_CARREIRAS, ...TRAJETORIAS, ...PROFISSAO, ...POLITICA].map(c => c.id));
const ehProf = (id: string) => id !== 'car_situacao' && (PROF.has(id) || conteudoPorId(id)?.tema === 'trabalho');
const POL = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
const Pr = (oque: string) => ({ tipo: 'profissao', oque } as unknown as Acao);

interface Carreira {
  id: string; idade: number; trajetorias: string[];
  preparar: (x: Vida, r: Rng, s: number) => void;
  ativa: (v: Vida) => boolean;
  agir?: (v: Vida) => Acao[];
  prefs?: string[];
  /** Métrica de progressão (maior = mais longe). */
  prog: (v: Vida) => number;
}
const limpar = (x: Vida) => { x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = []; };
const salario = (v: Vida) => { const e = v.trabalho.atual; return e ? Math.round(remuneracaoDe(e).mediaMensal) : 0; };
const esporte = (d: string, clube: string) => (x: Vida, r: Rng, s: number) => {
  limpar(x); garantirFrente(x, d as never);
  const h0 = Math.min(92, 78 + (s % 6) * 2);
  Object.assign(x.caminhos.frentes[d as 'futebol']!, { habilidade: h0, interesse: 90, meses: 140, auge: h0 });
  x.caminhos.esporte = undefined; x.financas.conta += 100000;
  entrarNaBase(x, d as never, x.moradia.municipioId, clube);
  profissionalizar(x, r, h0 < 82 ? 1 : h0 < 86 ? 2 : 3);
};
const proEsporte = (v: Vida) => v.caminhos.esporte?.fase === 'profissional';
const progEsporte = (v: Vida) => (v.caminhos.esporte?.nivel ?? 0) * 100 + (v.caminhos.esporte?.reputacao ?? 0);
const emprego = (oc: string, via: string, extra?: (x: Vida) => void) => (x: Vida, r: Rng) => { limpar(x); extra?.(x); contratar(x, r, ocupacao(oc), via as never); };
const naTrilha = (trilha: string, trs = ['emprego', 'autonomo']) => (v: Vida) => { const e = v.trabalho.atual; return !!e && ocupacaoOuNula(e.ocupacaoId)?.trilha === trilha && trs.includes(trajetoriaDeSituacao(v) ?? ''); };
const progEmprego = (v: Vida) => { const e = v.trabalho.atual; return e ? (ocupacaoOuNula(e.ocupacaoId)?.nivel ?? 0) * 10000 + salario(v) : 0; };
const curso = (x: Vida, id: string, nome: string, area: string) => x.educacao.concluidos.push({ cursoId: id, nome, nivel: 'superior', area, tFim: x.t - 24, instituicao: 'a universidade federal' } as never);

const CARREIRAS: Carreira[] = [
  { id: 'futebol', idade: 18, trajetorias: ['futebol'], prefs: ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'], preparar: esporte('futebol', 'Sport'), ativa: proEsporte, prog: progEsporte },
  { id: 'basquete', idade: 18, trajetorias: ['basquete'], prefs: ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'], preparar: esporte('basquete', 'Clube Teste'), ativa: proEsporte, prog: progEsporte },
  { id: 'volei', idade: 18, trajetorias: ['atleta'], prefs: ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'], preparar: esporte('volei', 'equipe da prefeitura'), ativa: proEsporte, prog: progEsporte },
  { id: 'atletismo', idade: 18, trajetorias: ['atleta'], prefs: ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'], preparar: esporte('atletismo', 'equipe de atletismo'), ativa: proEsporte, prog: progEsporte },
  { id: 'tenis', idade: 18, trajetorias: ['tenis'], prefs: ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'], preparar: esporte('tenis', 'academia de tênis de Recife'), ativa: proEsporte, prog: progEsporte },
  { id: 'tecnico', idade: 36, trajetorias: ['tecnico'], prefs: ['aceitar', 'assinar', 'renovar', 'continuar', 'ficar'],
    preparar: (x, r) => { limpar(x); garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 70, interesse: 90, meses: 200, auge: 84 }); x.trabalho.experiencia['treino'] = 60; contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade'); },
    ativa: v => trajetoriaDeSituacao(v) === 'tecnico', prog: v => (v.caminhos.tecnico?.reputacao ?? 0) },
  { id: 'atuacao', idade: 22, trajetorias: ['cena'], prefs: ['ir', 'aceitar', 'seguir', 'sim'],
    preparar: (x, r) => { limpar(x); const fr = garantirFrente(x, 'teatro'); Object.assign(fr, { habilidade: 72, meses: 80, interesse: 90, auge: 80 }); x.rotinas = x.rotinas.filter(rt => rt.id !== 'teatro'); x.rotinas.push({ id: 'teatro', tInicio: x.t, nivel: 2 } as never); x.financas.conta += 8000; contratar(x, r, ocupacao('ator'), 'teste' as never); },
    agir: v => { const out = [P('buscar_agente'), P('audicao'), P('audicao'), P('apresentar'), P('edital'), P('trabalho_pequeno'), Pr('lancar')]; for (const c of (v.caminhos.audiovisual?.contratos ?? []).filter(c => c.status === 'proposta')) out.push(P('aceitar_contrato', c.id)); return out; },
    ativa: v => trajetoriaDeSituacao(v) === 'cena', prog: v => (v.notoriedade?.valor ?? 0) * 100 + (ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '')?.nivel ?? 0) },
  { id: 'musica', idade: 22, trajetorias: ['cena'], prefs: ['ir', 'aceitar', 'seguir', 'sim'],
    preparar: (x, r) => { limpar(x); const fr = garantirFrente(x, 'musica'); Object.assign(fr, { habilidade: 72, meses: 80, interesse: 90, auge: 80 }); x.rotinas = x.rotinas.filter(rt => rt.id !== 'musica'); x.rotinas.push({ id: 'musica', tInicio: x.t, nivel: 2 } as never); x.financas.conta += 8000; criarProjeto(x, r, 'musica'); x.caminhos.arte!.publico = 45; contratar(x, r, ocupacao('musico_profissional'), 'teste' as never); },
    agir: () => [P('apresentar'), P('edital'), P('trabalho_pequeno'), Pr('lancar'), Pr('estrada')],
    ativa: v => trajetoriaDeSituacao(v) === 'cena', prog: v => (v.notoriedade?.valor ?? 0) * 100 + (v.caminhos.arte?.publico ?? 0) },
  { id: 'medicina', idade: 28, trajetorias: ['medicina'],
    preparar: (x, r) => { limpar(x); x.educacao.concluidos.push({ cursoId: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', tFim: x.t - 36, instituicao: 'a universidade federal' } as never); x.educacao.concluidos.push({ cursoId: 'residencia', nome: 'Residência em Clínica Médica', nivel: 'residencia', area: 'medicina', tFim: x.t - 6, instituicao: 'o hospital universitário', especialidade: 'clinica' } as never); contratar(x, r, ocupacao('medico_hospital'), 'concurso'); },
    ativa: v => trajetoriaDeSituacao(v) === 'medicina', prog: progEmprego },
  { id: 'academia', idade: 30, trajetorias: ['academia'], preparar: (x, r) => { limpar(x); x.mente.cognicao = Math.max(x.mente.cognicao, 80); contratar(x, r, ocupacao('professor_univ'), 'concurso'); }, ativa: v => trajetoriaDeSituacao(v) === 'academia', prog: progEmprego },
  { id: 'politica', idade: 25, trajetorias: ['politica'],
    prefs: ['p0', 'p1', 'cargo_vereador', 'cargo_prefeito', 'cargo_deputado_estadual', 'fin_pequenas', 'rua_porta', 'tom_propostas', 'entrar', 'continuar', 'ficar'],
    preparar: x => { entrarNaPolitica(x, 'comunidade', 1); },
    ativa: v => !!v.caminhos.politica && v.caminhos.politica.fase !== 'encerrada',
    agir: v => { const p = v.caminhos.politica; if (!p || p.fase === 'encerrada') return []; const out = [POL('comunidade')]; if (!p.partido) out.push(POL('filiar')); if (!p.prioridade) out.push(POL('bandeira', 'saude')); out.push(POL('candidatura')); if (p.mandato) out.push(POL('prioridade')); return out; },
    prog: v => (v.caminhos.politica?.historico?.filter(h => (h as { eleito?: boolean }).eleito).length ?? 0) * 100 + (v.caminhos.politica?.reputacao ?? 0) },
  { id: 'negocio', idade: 30, trajetorias: ['negocio'], preparar: (x, r) => { limpar(x); x.financas.conta += 60000; abrirNegocio(x, r, 'lanchonete'); }, ativa: v => trajetoriaDeSituacao(v) === 'negocio', prog: v => v.financas.conta },
  { id: 'eletricista', idade: 24, trajetorias: ['autonomo', 'emprego'], preparar: emprego('eletricista', 'curriculo'), ativa: naTrilha('eletrica'), prog: progEmprego },
  { id: 'analista_adm', idade: 24, trajetorias: ['emprego'], preparar: emprego('analista_adm', 'curriculo'), ativa: naTrilha('administrativo'), prog: progEmprego },
  { id: 'advogado', idade: 25, trajetorias: ['autonomo', 'emprego'], preparar: emprego('advogado', 'curriculo', x => { curso(x, 'direito', 'Direito', 'direito'); x.fatos['oab'] = x.t - 12; }), ativa: naTrilha('direito'), prog: progEmprego },
  { id: 'professor', idade: 25, trajetorias: ['emprego'], preparar: emprego('professor_fund', 'curriculo', x => curso(x, 'pedagogia', 'Pedagogia', 'educacao')), ativa: naTrilha('educacao'), prog: progEmprego },
  { id: 'enfermeiro', idade: 25, trajetorias: ['emprego'], preparar: emprego('enfermeiro', 'curriculo', x => curso(x, 'enfermagem', 'Enfermagem', 'saude')), ativa: naTrilha('enfermagem'), prog: progEmprego },
  { id: 'policial', idade: 25, trajetorias: ['emprego'], preparar: emprego('policial_civil', 'concurso', x => curso(x, 'direito', 'Direito', 'direito')), ativa: naTrilha('policia_civil'), prog: progEmprego }
];

const FAIXAS: [string, number, number][] = [['0–5', 0, 5], ['5–10', 5, 10], ['10–20', 10, 20], ['20+', 20, 99]];
const norm = (s: string) => s.replace(/R\$\s?[\d.,]+( mil| milhões?)?/g, 'R$#').replace(/\d+([.,]\d+)?/g, '#').replace(/(?<=[a-zà-ú,;:—–] )[A-ZÀ-Ú][\wà-úÀ-Ú'-]+/g, 'N').replace(/\s+/g, ' ').trim().slice(0, 160);
const ESTREANTE = /(?<!não é o |não é mais o |já não é o )estrei|estreante|primeir[oa]s? (temporada|contrato|papel|papéis|show|disco|álbum|plantão|plantões|dia de|ano de|caso|cliente|turma|aula|eleição|mandato|campanha|jogo|partida|semana|mês)|novato|novata|recém-chegad|calour|quem acabou de chegar|ainda (é|era) novo no|primeira vez (que|em) (entr|pis|sub)/i;

interface AnoReg { k: number; ativa: boolean; cenas: { id: string; texto: string; desfecho: string }[]; decisoes: string[]; bio: string[]; bioIds: string[]; bioAcao: number }
interface VidaReg { anos: AnoReg[]; prog0: number; progF: number; sal0: number; salF: number; oc0: string; ocF: string; boas: number; ruins: number; cand0: number; cand10: number; candMax: number; fim: string }

const ADULTOS = new Map<string, string>();
function adultoEm(s: number, i: number): Vida {
  const key = `${s}:${i}`;
  if (!ADULTOS.has(key)) ADULTOS.set(key, JSON.stringify(adulto(i, { semente: 125900 + s * 31, genero: s % 2 ? 'masculino' : 'feminino', municipioId: ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'porto-alegre-rs', 'salvador-ba', 'curitiba-pr', 'fortaleza-ce', 'campina-grande-pb'][s % 8] })));
  return JSON.parse(ADULTOS.get(key)!) as Vida;
}

function viver(c: Carreira, s: number): VidaReg | undefined {
  const r = criarRng(s * 7919 + c.id.length * 101);
  let v = adultoEm(s, c.idade);
  v = transacao(v, (x, rr) => { x.id = `${x.id}-car119-${c.id}-${s}`; c.preparar(x, rr, s); x.momento = null; }).vida;
  if (!c.ativa(v)) { /* algumas entram no ano seguinte */ }
  const e = estrategia('passivo');
  const decidir = () => { const m = v.momento!; const livres = m.opcoes.filter(o => !o.bloqueio); if (m.situacaoId !== 'car_situacao') for (const p of c.prefs ?? []) { const o = livres.find(x => x.id === p); if (o) return o.id; } return e.decidir(v, m, r); };
  const responder = () => { for (let k = 0; k < 15 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir() }).vida; };
  const tr0 = trajetoriaDeSituacao(v);
  const reg: VidaReg = { anos: [], prog0: c.prog(v), progF: 0, sal0: salario(v), salF: 0, oc0: v.trabalho.atual?.ocupacaoId ?? '-', ocF: '-', boas: 0, ruins: 0, cand0: tr0 ? candidatosDoAno(v, tr0).length : 0, cand10: 0, candMax: 0, fim: '' };
  for (let k = 0; k < ANOS && !v.morte; k++) {
    const tAntes = v.t; const bioAntes = v.biografia.length; const ocAntes = v.ocorrencias.length;
    for (const a of [...(c.agir?.(v) ?? []), ...e.agir(v, r)]) {
      if (a.tipo === 'candidatar' || a.tipo === 'matricular' || a.tipo === 'pedir_demissao' || (a.tipo as string) === 'abrir_negocio' || a.tipo === 'oportunidade') continue;
      if (!podeTentar(disponibilidade(v, a))) continue;
      v = executar(v, a).vida; responder();
    }
    const ativaAntes = c.ativa(v);
    const bioAcao = v.biografia.slice(bioAntes).filter(b => b.tema === 'trabalho' && b.relevancia !== 'tecnico').length;
    const bioAno = v.biografia.length; const ocAno = v.ocorrencias.length;
    v = avancarAno(v).vida; responder();
    const tr = trajetoriaDeSituacao(v);
    if (tr) { const n = candidatosDoAno(v, tr).length; if (k === 10) reg.cand10 = n; reg.candMax = Math.max(reg.candMax, n); }
    const cenas = (v.caminhos.situacoes ?? []).filter(x => x.t > tAntes && x.t <= v.t && c.trajetorias.includes(x.trajetoria)).map(x => ({ id: x.id, texto: x.texto ?? '', desfecho: x.desfecho }));
    for (const x of cenas) if (!DECISOES_DE_CONTRATO.has(x.id)) { if (x.desfecho === 'otimo' || x.desfecho === 'bom') reg.boas++; else reg.ruins++; }
    const decisoes = v.ocorrencias.slice(ocAno).map(o => o.id).filter(ehProf);
    const bioE = v.biografia.slice(bioAno).filter(b => b.tema === 'trabalho' && b.relevancia !== 'tecnico');
    reg.anos.push({ k, ativa: ativaAntes || c.ativa(v), cenas, decisoes, bio: bioE.map(b => b.texto), bioIds: bioE.map(b => b.fato?.tipo ?? ''), bioAcao });
  }
  reg.progF = c.prog(v); reg.salF = salario(v); reg.ocF = v.trabalho.atual?.ocupacaoId ?? '-';
  reg.fim = v.morte ? `morreu aos ${idade(v)}` : `${idade(v)} anos`;
  return reg;
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f2 = (x: number) => x.toFixed(2);
const out: string[] = [];
const log = (s: string) => { out.push(s); console.log(s); };
const JSONOUT: Record<string, unknown> = {};

async function principal() {
  await carregarMundo();
  // Estático: modelos por trajetória.
  const porTr: Record<string, number> = {};
  for (const m of MODELOS) porTr[m.trajetoria] = (porTr[m.trajetoria] ?? 0) + 1;
  log(`modelos de cena por trajetória: ${JSON.stringify(porTr)}`);
  const SO = process.env.SO?.split(',');
  for (const c of CARREIRAS.filter(x => !SO || SO.includes(x.id))) {
    const t0 = Date.now();
    const vidas: VidaReg[] = [];
    for (let s = 1; s <= N; s++) { try { const x = viver(c, s); if (x) vidas.push(x); } catch (err) { log(`  ERRO ${c.id} s${s}: ${(err as Error).message}`); } }
    log(`\n### ${c.id} — ${vidas.length} vidas, entra aos ${c.idade}, ${ANOS} anos (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    log(`anos ativos/vida: ${media(vidas.map(v => v.anos.filter(a => a.ativa).length)).toFixed(1)}; fim: ${vidas.map(v => `${v.oc0}→${v.ocF}(${v.anos.filter(a => a.ativa).length}a)`).join(' ')}`);
    log(`candidatos de cena: no início ${media(vidas.map(v => v.cand0)).toFixed(1)}, ano 10 ${media(vidas.map(v => v.cand10)).toFixed(1)}, máx ${Math.max(...vidas.map(v => v.candMax))}`);
    log('| faixa | anos ativos | cenas/ano | cenas distintas/total | contrato/ano | outras decisões prof/ano (distintas) | bio trabalho do ano (sem ações) | bio distintas/total | bio das ações do jogador/ano | anos sem cena nem decisão | anos sem nada (nem bio) |');
    log('|---|---|---|---|---|---|---|---|---|---|---|');
    const resumo: Record<string, unknown> = {};
    for (const [nome, a0, a1] of FAIXAS) {
      const anos = vidas.flatMap(v => v.anos.filter(a => a.ativa && a.k >= a0 && a.k < a1));
      if (!anos.length) { log(`| ${nome} | 0 | — | — | — | — | — | — | — | — | — |`); continue; }
      const todas = anos.flatMap(a => a.cenas);
      const cenas = todas.filter(x => !DECISOES_DE_CONTRATO.has(x.id));
      const contratos = todas.length - cenas.length;
      const decs = anos.flatMap(a => a.decisoes.filter(d => !DECISOES_DE_CONTRATO.has(d)));
      const bio = anos.flatMap(a => a.bio.map(norm));
      const semCena = anos.filter(a => !a.cenas.length && !a.decisoes.length).length;
      const semNada = anos.filter(a => !a.cenas.length && !a.decisoes.length && !a.bio.length).length;
      log(`| ${nome} | ${anos.length} | ${f2(cenas.length / anos.length)} | ${new Set(cenas.map(x => x.id)).size}/${cenas.length} | ${f2(contratos / anos.length)} | ${f2(decs.length / anos.length)} (${new Set(decs).size}) | ${f2(bio.length / anos.length)} | ${new Set(bio).size}/${bio.length} | ${f2(anos.reduce((s, a) => s + a.bioAcao, 0) / anos.length)} | ${Math.round(semCena / anos.length * 100)}% | ${Math.round(semNada / anos.length * 100)}% |`);
      resumo[nome] = { anos: anos.length, cenas: cenas.length, semCena, semNada };
    }
    // Anos vazios depois de 10+ anos de carreira, e o maior silêncio (sem cena nem decisão) depois dos 10.
    const silencios = vidas.map(v => { let c2 = 0, m = 0; for (const a of v.anos.filter(a => a.ativa && a.k >= 10)) { if (!a.cenas.length && !a.decisoes.length) { c2++; m = Math.max(m, c2); } else c2 = 0; } return m; });
    log(`maior silêncio depois de 10 anos (anos seguidos sem cena nem decisão), por vida: ${silencios.join(',')}`);
    // Repetição na mesma vida.
    const maxIdVida = vidas.map(v => { const m = new Map<string, number>(); for (const a of v.anos) for (const x of a.cenas) m.set(x.id, (m.get(x.id) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['-', 0]; });
    const maxDecVida = vidas.map(v => { const m = new Map<string, number>(); for (const a of v.anos) for (const x of a.decisoes) m.set(x, (m.get(x) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['-', 0]; });
    const maxBioVida = vidas.map(v => { const m = new Map<string, number>(); for (const a of v.anos) for (const x of a.bio) { const k2 = norm(x); m.set(k2, (m.get(k2) ?? 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['-', 0]; });
    log(`mesma cena na vida (máx por vida): ${maxIdVida.map(x => `${x[0]}×${x[1]}`).join(' ')}`);
    log(`mesma decisão prof na vida (máx): ${maxDecVida.map(x => `${x[0]}×${x[1]}`).join(' ')}`);
    log(`mesma linha de bio na vida (máx): ${maxBioVida.map(x => x[1]).join(',')} — pior: "${[...maxBioVida].sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0]}"`);
    // Ids mais frequentes.
    const cont = (xs: string[]) => { const m = new Map<string, number>(); for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
    const todasCenas = cont(vidas.flatMap(v => v.anos.filter(a => a.ativa).flatMap(a => a.cenas.map(x => x.id))));
    log(`cenas (${todasCenas.length} ids): ${todasCenas.map(([k, n]) => `${k}:${n}`).join(' ')}`);
    const todasDec = cont(vidas.flatMap(v => v.anos.filter(a => a.ativa).flatMap(a => a.decisoes)));
    log(`decisões prof (${todasDec.length} ids): ${todasDec.slice(0, 30).map(([k, n]) => `${k}:${n}`).join(' ')}`);
    const todasBio = cont(vidas.flatMap(v => v.anos.filter(a => a.ativa).flatMap(a => a.bio.map(norm))));
    log(`bio trabalho top 8: ${todasBio.slice(0, 8).map(([k, n]) => `[${n}] ${k.slice(0, 110)}`).join(' | ')}`);
    // Coerência.
    const estreanteVeterano: string[] = [];
    for (const v of vidas) for (const a of v.anos) if (a.ativa && a.k >= 8) for (const t of [...a.bio, ...a.cenas.map(x => x.texto)]) if (ESTREANTE.test(t)) estreanteVeterano.push(`k${a.k}: ${t.slice(0, 140)}`);
    log(`texto de estreante com 8+ anos de carreira: ${estreanteVeterano.length}${estreanteVeterano.length ? ' — ex.: ' + [...new Set(estreanteVeterano)].slice(0, 5).join(' || ') : ''}`);
    const inativos = vidas.flatMap(v => v.anos.filter(a => !a.ativa && a.cenas.length).map(a => `k${a.k}:${a.cenas.map(x => x.id).join('+')}`));
    log(`cenas da trajetória com a carreira inativa: ${inativos.length}${inativos.length ? ' ' + inativos.slice(0, 6).join(' ') : ''}`);
    // Progressão × desfechos.
    const ord = [...vidas].sort((a, b) => a.boas / Math.max(1, a.boas + a.ruins) - b.boas / Math.max(1, b.boas + b.ruins));
    const meio = Math.floor(ord.length / 2);
    const dProg = (xs: VidaReg[]) => media(xs.map(x => x.progF - x.prog0));
    const dSal = (xs: VidaReg[]) => media(xs.map(x => x.salF - x.sal0));
    log(`progressão: metade com MENOS desfechos bons (${f2(media(ord.slice(0, meio).map(x => x.boas / Math.max(1, x.boas + x.ruins))))}) Δprog ${dProg(ord.slice(0, meio)).toFixed(0)} Δsal ${dSal(ord.slice(0, meio)).toFixed(0)} · metade com MAIS (${f2(media(ord.slice(meio).map(x => x.boas / Math.max(1, x.boas + x.ruins))))}) Δprog ${dProg(ord.slice(meio)).toFixed(0)} Δsal ${dSal(ord.slice(meio)).toFixed(0)}`);
    // Amostra de linhas da bio de veterano (k>=15).
    const amostra = vidas[0]?.anos.filter(a => a.k >= 15).flatMap(a => [...a.cenas.map(x => `k${a.k} cena ${x.id}`), ...a.decisoes.map(d => `k${a.k} dec ${d}`), ...a.bio.map(b => `k${a.k} bio ${b.slice(0, 120)}`)]) ?? [];
    log(`amostra (vida 1, anos 15+): ${amostra.slice(0, 18).join(' || ')}`);
    JSONOUT[c.id] = { resumo, vidas: vidas.map(v => ({ anos: v.anos, prog0: v.prog0, progF: v.progF, oc0: v.oc0, ocF: v.ocF, boas: v.boas, ruins: v.ruins, fim: v.fim })) };
  }
  const dir = `${process.env.HOME}/vida-trabalho/a125`;
  writeFileSync(`${dir}/car119-saida${process.env.TAG ?? ''}.txt`, out.join('\n'));
  writeFileSync(`${dir}/car119-dados${process.env.TAG ?? ''}.json`, JSON.stringify(JSONOUT));
}
principal();
