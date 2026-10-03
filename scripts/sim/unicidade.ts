/**
 * Unicidade narrativa (auditoria): três vidas na MESMA linha (mesma carreira, mesmo país) são diferentes?
 * As frases são do emprego da pessoa e do país dela?
 *
 *   npx esbuild scripts/sim/unicidade.ts --bundle --platform=node --outfile=/tmp/uni.cjs && node /tmp/uni.cjs
 *   VIDAS=3 ANOS=20 PAISES=BR,ES,JP,AR SO=futebol,medicina node /tmp/uni.cjs
 *
 * Para cada carreira especial × país, VIDAS vidas com sementes diferentes (infância vivida de verdade até a idade
 * de entrada; a carreira montada como em `momentos.ts`; ANOS anos respondendo com a estratégia do simulador).
 * Coleta: ids de tudo o que aconteceu (`v.ocorrencias`), decisões abertas (pop-ups, `momento.situacaoId`),
 * situações de carreira (`v.caminhos.situacoes`), textos de pop-up / resultado, e a biografia.
 * Grava o bruto em OUT/vidas.json e as tabelas em OUT/unicidade.md.
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
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { sortearMunicipio, paisDaCidade, municipio } from '../../src/motor/dados/lugares';
import { sortearNome, sortearSobrenome } from '../../src/motor/dados/nomes';
import { clubesDoNivel } from '../../src/motor/dados/clubes';
import { paisDaVida } from '../../src/motor/mundo/vida';
import { conteudoPorId } from '../../src/motor/conteudo/motor';
import { estrategia } from './estrategias';
import * as fs from 'node:fs';

const OUT = process.env.OUT ?? '/tmp/claude-1000/-mnt-c-Daniel-vida-game/9e199cec-4f76-4281-a547-ee7e3efef423/scratchpad/unicidade';
const N = Number(process.env.VIDAS ?? 3);
const ANOS = Number(process.env.ANOS ?? 20);
const PAISES = (process.env.PAISES ?? 'BR,ES,JP,AR').split(',');
const POL = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);
const limpar = (x: Vida) => { x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = []; };

interface Carreira { id: string; idade: number; preparar: (x: Vida, r: Rng, s: number) => void; agir?: (v: Vida) => Acao[]; prefs?: string[]; base?: string }
const CARREIRAS: Carreira[] = [
  { id: 'futebol', idade: 19, prefs: ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar', 'nao'], base: 'passivo',
    preparar: (x, r, s) => {
      const h0 = 80 + (s % 4) * 2;
      garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: h0, interesse: 90, meses: 140, auge: h0 + 4 });
      limpar(x); x.caminhos.esporte = undefined; x.financas.conta += 20000;
      const c = clubesDoNivel(2, undefined, paisDaVida(x));
      entrarNaBase(x, 'futebol', x.moradia.municipioId, c[s % c.length].nome);
      profissionalizar(x, r, 2);
    } },
  { id: 'tecnico', idade: 36, prefs: ['aceitar', 'assinar', 'renovar', 'continuar', 'ficar'], base: 'passivo',
    preparar: (x, r) => { limpar(x); garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 70, interesse: 90, meses: 200, auge: 84 }); x.trabalho.experiencia['treino'] = 60; contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade'); } },
  { id: 'medicina', idade: 30, base: 'passivo',
    preparar: (x, r) => { limpar(x); x.educacao.concluidos.push({ cursoId: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', tFim: x.t - 36, instituicao: 'a universidade' }); x.educacao.concluidos.push({ cursoId: 'residencia', nome: 'Residência em Clínica Médica', nivel: 'residencia', area: 'medicina', tFim: x.t - 6, instituicao: 'o hospital universitário', especialidade: 'clinica' } as never); contratar(x, r, ocupacao('medico_hospital'), 'concurso'); } },
  { id: 'academia', idade: 30, base: 'passivo',
    preparar: (x, r) => { limpar(x); x.mente.cognicao = Math.max(x.mente.cognicao, 80); contratar(x, r, ocupacao('professor_univ'), 'concurso'); } },
  { id: 'atuacao', idade: 24, base: 'passivo',
    preparar: (x, r) => { limpar(x); garantirFrente(x, 'teatro'); Object.assign(x.caminhos.frentes.teatro!, { habilidade: 82, meses: 120, interesse: 90, auge: 86 }); contratar(x, r, ocupacao('ator'), 'oportunidade'); } },
  { id: 'politica', idade: 25, base: 'social',
    prefs: ['p0', 'p1', 'cargo_vereador', 'cargo_prefeito', 'cargo_deputado_estadual', 'fin_pequenas', 'rua_porta', 'tom_propostas', 'entrar', 'continuar', 'ficar'],
    preparar: x => { entrarNaPolitica(x, 'comunidade', 1); },
    agir: v => { const p = v.caminhos.politica; if (!p || p.fase === 'encerrada') return []; const out = [POL('comunidade')]; if (!p.partido) out.push(POL('filiar')); if (!p.prioridade) out.push(POL('bandeira', 'saude')); out.push(POL('candidatura')); if (p.mandato) out.push(POL('prioridade')); return out; } },
  { id: 'militar', idade: 24, base: 'passivo', prefs: ['ficar', 'continuar', 'aceitar', 'seguir'],
    preparar: (x, r) => { limpar(x); contratar(x, r, ocupacao('sargento'), 'concurso'); } },
  { id: 'negocio', idade: 30, base: 'passivo',
    preparar: (x, r) => { limpar(x); x.financas.conta += 60000; abrirNegocio(x, r, 'lanchonete'); } },
  { id: 'autonomo', idade: 26, base: 'passivo',
    preparar: (x, r) => { limpar(x); contratar(x, r, ocupacao('eletricista'), 'curriculo'); } },
  { id: 'emprego', idade: 26, base: 'passivo',
    preparar: (x, r) => { limpar(x); contratar(x, r, ocupacao('analista_adm'), 'curriculo'); } }
];

export interface Registro {
  carreira: string; pais: string; semente: number; nome: string; cidade: string;
  ocorrencias: { id: string; t: number }[];
  popups: { id: string; t: number; titulo: string; texto: string; resultado?: string; trajetoria?: string; ocupacao?: string; paisAgora: string }[];
  situacoes: { id: string; t: number; trajetoria: string; texto: string }[];
  bio: { t: number; texto: string; relevancia: string; trajetoria?: string; ocupacao?: string; paisAgora: string }[];
  trajetoriaAnos: string[];
  ocupacoesAnos: string[];
  erro?: string;
}

function viver(c: Carreira, pais: string, s: number): Registro | undefined {
  const r = criarRng(s * 7919 + c.id.length * 31 + pais.charCodeAt(0));
  const semente = 900000 + s * 104729 + c.id.length * 1000 + pais.charCodeAt(0) * 7 + pais.charCodeAt(1);
  const rr = criarRng(semente);
  const m = sortearMunicipio(() => rr.next(), pais);
  const g = s % 2 ? 'feminino' : 'masculino';
  const genero = c.id === 'futebol' || c.id === 'tecnico' ? 'masculino' : g;
  let v = criarVida({ nome: sortearNome(rr, genero, 2026, pais, m.uf), sobrenome: sortearSobrenome(rr, pais, m.uf), genero, municipioId: m.id, semente });
  for (let k = 0; k < c.idade && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
  if (v.morte) return undefined;
  const reg: Registro = { carreira: c.id, pais, semente: s, nome: `${v.eu.nome} ${v.eu.sobrenome}`, cidade: municipio(v.moradia.municipioId).nome, ocorrencias: [], popups: [], situacoes: [], bio: [], trajetoriaAnos: [], ocupacoesAnos: [] };
  v = transacao(v, (x, rx) => { c.preparar(x, rx, s); x.momento = null; }).vida;
  const t0 = v.t;
  const oc0 = v.ocorrencias.length, bio0 = v.biografia.length, sit0 = (v.caminhos.situacoes ?? []).length;
  const e = estrategia(c.base ?? 'passivo');
  const ctxAgora = () => ({ trajetoria: trajetoriaDeSituacao(v) ?? '-', ocupacao: v.trabalho.atual?.ocupacaoId ?? (v.caminhos.negocio ? 'negocio' : '-'), paisAgora: paisDaVida(v) });
  const decidir = () => { const mm = v.momento!; const livres = mm.opcoes.filter(o => !o.bloqueio); if (mm.situacaoId !== 'car_situacao') for (const p of c.prefs ?? []) { const o = livres.find(x => x.id === p); if (o) return o.id; } return e.decidir(v, mm, r); };
  const responder = () => {
    for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
      const mm = v.momento; const cx = ctxAgora();
      const id = mm.situacaoId === 'car_situacao' ? `car:${v.caminhos.situacao?.id ?? '?'}` : mm.situacaoId;
      const op = decidir();
      if (process.env.DEBUG) console.error(`      popup ${id} -> ${op} | ${mm.texto.slice(0, 100)}`);
      const ret = executar(v, { tipo: 'decidir', opcaoId: op });
      reg.popups.push({ id, t: v.t, titulo: mm.titulo, texto: mm.texto, resultado: ret.resultado, ...cx });
      v = ret.vida;
    }
  };
  try {
    for (let k = 0; k < ANOS && !v.morte; k++) {
      if (process.env.DEBUG) console.error(`  ano ${k} idade ${idade(v)} traj ${trajetoriaDeSituacao(v)} momento ${v.momento?.situacaoId}`);
      for (const a of [...(c.agir?.(v) ?? []), ...e.agir(v, r)]) {
        if (process.env.DEBUG) console.error(`    acao ${JSON.stringify(a)}`);
        if (a.tipo === 'candidatar' || a.tipo === 'matricular' || a.tipo === 'pedir_demissao' || (a.tipo as string) === 'abrir_negocio' || a.tipo === 'oportunidade') continue;
        if (!podeTentar(disponibilidade(v, a))) continue;
        v = executar(v, a).vida; if (process.env.DEBUG) console.error('      executou'); responder();
      }
      const b0 = v.biografia.length; const cx = ctxAgora();
      reg.trajetoriaAnos.push(cx.trajetoria); reg.ocupacoesAnos.push(cx.ocupacao);
      if (process.env.DEBUG) console.error('    avancarAno');
      v = avancarAno(v).vida;
      for (const b of v.biografia.slice(b0)) (b as never as { _cx: unknown })._cx = cx;
      responder();
    }
  } catch (err) { reg.erro = (err as Error).stack?.split('\n').slice(0, 4).join(' | '); }
  reg.ocorrencias = v.ocorrencias.slice(oc0).map(o => ({ id: o.id, t: o.t }));
  reg.situacoes = (v.caminhos.situacoes ?? []).slice(sit0).map(x => ({ id: x.id, t: x.t, trajetoria: x.trajetoria, texto: x.texto }));
  reg.bio = v.biografia.slice(bio0).filter(b => b.relevancia !== 'tecnico').map(b => { const cx = (b as never as { _cx?: ReturnType<typeof ctxAgora> })._cx ?? ctxAgora(); return { t: b.t, texto: b.texto, relevancia: b.relevancia, ...cx }; });
  void t0; void idade; void paisDaCidade;
  return reg;
}

/* ------------------------------------------------------------ análise */

const norm = (s: string) => s
  .replace(/(R\$|US\$|€|£|ARS|JP¥|¥|MX\$|COP|CLP|UYU)\s?[\d.,]+( mil| milhões?)?/g, '$$')
  .replace(/\d+([.,]\d+)*/g, '#')
  .replace(/(?<=[^.!?:—]\s)[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wáéíóúâêôãõçü'-]*(\s(de|da|do|dos|das|y|del|la)?\s?[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wáéíóúâêôãõçü'-]*)*/g, 'X')
  .trim();
const jacc = <T>(a: Set<T>, b: Set<T>) => { const i = [...a].filter(x => b.has(x)).length; const u = new Set([...a, ...b]).size; return u ? i / u : 0; };
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Termos que só cabem numa carreira (para achar frase de outra profissão). */
const TERMOS: Record<string, RegExp> = {
  futebol: /\b(chuteira|gol(s|aço)?|torcida|vestiário|escalação|titular|reserva do time|clube|zagueir|atacante|meia\b|goleir|empresário do jogador|Série [AB]|rodada)\b/i,
  tecnico: /\b(comando técnico|à beira do campo|elenco|prancheta|diretoria do clube|o time perdeu|o time ganhou)\b/i,
  medicina: /\b(paciente|plantão|prontuário|residência médica|diagnóstic|enfermaria|UTI|pronto-socorro|cirurgia|CRM)\b/i,
  academia: /\b(artigo|orientand|tese|dissertação|laboratório|bolsa de pesquisa|CNPq|CAPES|congresso científico|revista científica|banca)\b/i,
  atuacao: /\b(palco|ensaio|elenco da peça|novela|bilheteria|cachê|teste de elenco|diretor de cena|figurino|estreia da peça|plateia)\b/i,
  politica: /\b(mandato|vereador|prefeit|deputad|eleitor|campanha|urna|partido|câmara|plenário|gabinete)\b/i,
  militar: /\b(quartel|farda|tropa|continência|guarnição|comandante|sargento|patente|caserna|boletim interno)\b/i,
  negocio: /\b(freguesia|fregueses|clientes do negócio|o caixa do negócio|fornecedor|balcão|sócio|lanchonete|cardápio|a loja)\b/i,
  autonomo: /\b(orçamento do serviço|chamado|obra|instalação elétrica|disjuntor|fiação|cliente ligou|o serviço)\b/i,
  emprego: /\b(chefe|chefia|expediente|reunião de equipe|RH|carteira assinada|planilha|gerente)\b/i
};
/** O que é do Brasil e não deveria aparecer numa vida em outro país. */
const BRASIL = /\b(SUS|ENEM|Enem|vestibular|Série A|Série B|Brasileirão|Copa do Brasil|R\$|reais|real\b|Pix|PIX|INSS|FGTS|CLT|carteira assinada|Polícia Militar|PM\b|Brasília|São João|Carnaval|carnaval|Bolsa Família|MEI\b|CNPJ|CPF|ProUni|Fies|FIES|Sisu|SiSU|Caixa Econômica|Receita Federal|cartório|vereador|prefeitur|deputado estadual|Assembleia Legislativa|campeonato estadual|estadual\b|Detran|DETRAN|CNH|concurso público|Exército Brasileiro|brasileir[oa]s?|Brasil|nordest|paulista|carioca|mineir[oa]|gaúch[oa])\b/;

function analisar(regs: Registro[]): string {
  const L: string[] = [];
  const carreiras = [...new Set(regs.map(r => r.carreira))];
  const paises = [...new Set(regs.map(r => r.pais))];
  L.push('## 1. Repetição dentro de uma vida\n');
  L.push('| carreira | país | vidas | pop-ups/vida | pop-up id repetido (ocorrências extras/vida) | frases de biografia/vida | frase idêntica repetida (extras/vida) | molde repetido ≥3× (extras/vida) |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  const repPop = new Map<string, number>(), repBio = new Map<string, number>(), repMolde = new Map<string, number>();
  for (const c of carreiras) for (const p of paises) {
    const xs = regs.filter(r => r.carreira === c && r.pais === p);
    if (!xs.length) continue;
    const extras = (arr: string[]) => { const m = new Map<string, number>(); for (const a of arr) m.set(a, (m.get(a) ?? 0) + 1); return [...m.values()].reduce((a, b) => a + b - 1, 0); };
    for (const x of xs) {
      const mp = new Map<string, number>(); for (const q of x.popups) mp.set(q.id, (mp.get(q.id) ?? 0) + 1);
      for (const [k, n] of mp) if (n > 1) repPop.set(`${c}|${k}`, (repPop.get(`${c}|${k}`) ?? 0) + n - 1);
      const mb = new Map<string, number>(); for (const b of x.bio) mb.set(b.texto, (mb.get(b.texto) ?? 0) + 1);
      for (const [k, n] of mb) if (n > 1) repBio.set(`${c}|${k}`, (repBio.get(`${c}|${k}`) ?? 0) + n - 1);
      const mm = new Map<string, number>(); for (const b of x.bio) mm.set(norm(b.texto), (mm.get(norm(b.texto)) ?? 0) + 1);
      for (const [k, n] of mm) if (n > 2) repMolde.set(`${c}|${k}`, (repMolde.get(`${c}|${k}`) ?? 0) + n - 1);
    }
    const molde = (x: Registro) => { const mm = new Map<string, number>(); for (const b of x.bio) mm.set(norm(b.texto), (mm.get(norm(b.texto)) ?? 0) + 1); return [...mm.values()].filter(n => n > 2).reduce((a, b) => a + b - 1, 0); };
    L.push(`| ${c} | ${p} | ${xs.length} | ${media(xs.map(x => x.popups.length)).toFixed(1)} | ${media(xs.map(x => extras(x.popups.map(q => q.id)))).toFixed(1)} | ${media(xs.map(x => x.bio.length)).toFixed(1)} | ${media(xs.map(x => extras(x.bio.map(b => b.texto)))).toFixed(1)} | ${media(xs.map(molde)).toFixed(1)} |`);
  }
  L.push('\n### Pop-ups que mais se repetem na MESMA vida (soma das repetições extras; `repetir` = intervalo do conteúdo)\n');
  L.push('| carreira | id | extras | repetir |'); L.push('| --- | --- | --- | --- |');
  for (const [k, n] of [...repPop].sort((a, b) => b[1] - a[1]).slice(0, 40)) { const [c, id] = k.split('|'); const d = conteudoPorId(id.replace(/^car:/, '')) as { repetir?: number } | undefined; L.push(`| ${c} | ${id} | ${n} | ${d ? (d.repetir ?? 'uma vez') : (id.startsWith('car:') ? 'situação' : '?')} |`); }
  L.push('\n### Frases idênticas que se repetem na MESMA vida\n');
  L.push('| carreira | extras | frase |'); L.push('| --- | --- | --- |');
  for (const [k, n] of [...repBio].sort((a, b) => b[1] - a[1]).slice(0, 40)) { const [c, ...t] = k.split('|'); L.push(`| ${c} | ${n} | ${t.join('|').slice(0, 180)} |`); }
  L.push('\n### Moldes (frase com nomes/números mascarados) ≥3× na mesma vida\n');
  L.push('| carreira | extras | molde |'); L.push('| --- | --- | --- |');
  for (const [k, n] of [...repMolde].sort((a, b) => b[1] - a[1]).slice(0, 30)) { const [c, ...t] = k.split('|'); L.push(`| ${c} | ${n} | ${t.join('|').slice(0, 180)} |`); }

  L.push('\n## 2. Entre as vidas da mesma linha (mesma carreira, mesmo país)\n');
  L.push('| carreira | país | Jaccard ids de pop-up | Jaccard ids de tudo (ocorrências) | Jaccard situações de carreira | Jaccard frases exatas | Jaccard moldes | frases em TODAS as vidas | moldes em TODAS |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  const comuns = new Map<string, { n: number; carreiras: Set<string> }>();
  for (const c of carreiras) for (const p of paises) {
    const xs = regs.filter(r => r.carreira === c && r.pais === p);
    if (xs.length < 2) continue;
    const par = (f: (x: Registro) => Set<string>) => { const js: number[] = []; for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) js.push(jacc(f(xs[i]), f(xs[j]))); return media(js); };
    const todas = (f: (x: Registro) => Set<string>) => { const ss = xs.map(f); return [...ss[0]].filter(k => ss.every(s => s.has(k))); };
    const fr = (x: Registro) => new Set(x.bio.map(b => b.texto));
    const md = (x: Registro) => new Set(x.bio.map(b => norm(b.texto)));
    const emTodas = todas(md);
    for (const k of emTodas) { const o = comuns.get(k) ?? { n: 0, carreiras: new Set() }; o.n++; o.carreiras.add(c); comuns.set(k, o); }
    L.push(`| ${c} | ${p} | ${pct(par(x => new Set(x.popups.map(q => q.id))))} | ${pct(par(x => new Set(x.ocorrencias.map(q => q.id))))} | ${pct(par(x => new Set(x.situacoes.map(q => q.id))))} | ${pct(par(fr))} | ${pct(par(md))} | ${todas(fr).length} / ${media(xs.map(x => fr(x).size)).toFixed(0)} | ${emTodas.length} / ${media(xs.map(x => md(x).size)).toFixed(0)} |`);
  }
  L.push('\n### Moldes de frase presentes em todas as vidas de uma linha (os mais espalhados)\n');
  L.push('| linhas (carreira×país) | carreiras | molde |'); L.push('| --- | --- | --- |');
  for (const [k, o] of [...comuns].sort((a, b) => b[1].n - a[1].n).slice(0, 40)) L.push(`| ${o.n} | ${[...o.carreiras].join(', ')} | ${k.slice(0, 170)} |`);

  L.push('\n## 3. Frases de outra profissão (candidatas — revisar à mão)\n');
  L.push('| carreira da vida | trajetória/ocupação no ano | termo de | onde | frase |'); L.push('| --- | --- | --- | --- | --- |');
  const vistos = new Set<string>();
  let nOutra = 0;
  for (const x of regs) {
    const itens = [...x.bio.map(b => ({ onde: 'bio', texto: b.texto, tr: b.trajetoria, oc: b.ocupacao })), ...x.popups.map(q => ({ onde: `pop ${q.id}`, texto: `${q.titulo}: ${q.texto}`, tr: q.trajetoria, oc: q.ocupacao }))];
    for (const it of itens) for (const [outra, re] of Object.entries(TERMOS)) {
      if (outra === x.carreira || (x.carreira === 'tecnico' && outra === 'futebol') || (x.carreira === 'futebol' && outra === 'tecnico')) continue;
      if (TERMOS[x.carreira]?.test(it.texto)) continue;
      if (!re.test(it.texto)) continue;
      const k = `${x.carreira}|${outra}|${norm(it.texto)}`; if (vistos.has(k)) continue; vistos.add(k); nOutra++;
      if (nOutra <= 120) L.push(`| ${x.carreira} | ${it.tr}/${it.oc} | ${outra} (${it.texto.match(re)?.[0]}) | ${it.onde} | ${it.texto.replace(/\|/g, '/').slice(0, 200)} |`);
    }
  }
  L.push(`\n(${nOutra} frases distintas marcadas)\n`);

  L.push('\n## 4. Frases brasileiras em vidas fora do Brasil\n');
  L.push('| país | carreira | termo | onde | frase |'); L.push('| --- | --- | --- | --- | --- |');
  const contagem = new Map<string, number>();
  const vistosBR = new Set<string>();
  for (const x of regs.filter(r => r.pais !== 'BR')) {
    const itens = [...x.bio.map(b => ({ onde: 'bio', texto: b.texto, pa: b.paisAgora })), ...x.popups.map(q => ({ onde: `pop ${q.id}`, texto: `${q.titulo}: ${q.texto} ${q.resultado ?? ''}`, pa: q.paisAgora }))];
    for (const it of itens) {
      if (it.pa === 'BR') continue;
      const m = it.texto.match(BRASIL); if (!m) continue;
      contagem.set(`${x.pais}|${x.carreira}`, (contagem.get(`${x.pais}|${x.carreira}`) ?? 0) + 1);
      const k = `${m[0]}|${norm(it.texto)}`; if (vistosBR.has(k)) continue; vistosBR.add(k);
      if (vistosBR.size <= 150) L.push(`| ${x.pais} | ${x.carreira} | ${m[0]} | ${it.onde} | ${it.texto.replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 220)} |`);
    }
  }
  L.push(`\n(${vistosBR.size} frases distintas marcadas)\n`);
  L.push('| país | carreira | ocorrências com termo brasileiro |'); L.push('| --- | --- | --- |');
  for (const [k, n] of [...contagem].sort()) L.push(`| ${k.replace('|', ' | ')} | ${n} |`);
  L.push('\n### Mudança de país durante a vida (deveria ser rara nestas linhas)\n');
  for (const x of regs) { const ps = [...new Set(x.bio.map(b => b.paisAgora))]; if (ps.length > 1) L.push(`- ${x.carreira} ${x.pais} s${x.semente}: ${ps.join('→')}`); }
  L.push('\n### Erros\n');
  for (const x of regs.filter(r => r.erro)) L.push(`- ${x.carreira} ${x.pais} s${x.semente}: ${x.erro}`);
  return L.join('\n');
}

async function main() {
  const falhas = await carregarMundo();
  if (falhas.length) throw new Error(`regiões que não carregaram: ${falhas}`);
  fs.mkdirSync(OUT, { recursive: true });
  const SO = process.env.SO?.split(',');
  const regs: Registro[] = [];
  if (process.env.SO_ANALISAR) regs.push(...JSON.parse(fs.readFileSync(`${OUT}/vidas.json`, 'utf8')));
  else for (const c of CARREIRAS.filter(x => !SO || SO.includes(x.id))) for (const p of PAISES) for (let s = 1; s <= N; s++) {
    const t = Date.now();
    const reg = viver(c, p, s);
    if (reg) regs.push(reg);
    console.error(`${c.id} ${p} s${s}: ${reg ? `${reg.popups.length} pop-ups, ${reg.bio.length} frases${reg.erro ? ' ERRO' : ''}` : 'morreu antes'} (${Date.now() - t} ms)`);
  }
  if (!process.env.SO_ANALISAR) fs.writeFileSync(`${OUT}/vidas${process.env.SUF ?? ''}.json`, JSON.stringify(regs));
  fs.writeFileSync(`${OUT}/unicidade${process.env.SUF ?? ''}.md`, analisar(regs));
  console.error('ok');
}
void main();
