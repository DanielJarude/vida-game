/**
 * Simulações dirigidas do pacote pós-playtest (REWORK 3 + FIX + FIX 3.1 +
 * hotfix). Amostras para ver comportamento emergente — não a simulação
 * oficial de mil vidas.
 *
 *   npx esbuild scripts/sim/pacotePlaytest.ts --bundle --platform=node --outfile=/tmp/pp.cjs
 *   VIDAS=300 SO=F node /tmp/pp.cjs
 *
 *   F futebol    — carreiras a partir do primeiro contrato (17→36): divisões,
 *                  titularidade, salário (percentis por divisão e por nome),
 *                  transferências, títulos, prêmios, seleção, notoriedade
 *   P progressão — perseguição deliberada desde os 7: base → profissional
 *   R relações   — conhecer → aproximar → romance/rejeição → relação → duração
 *   A atividades — escola: permanência, papel, marcos, consequência depois
 *   N fama       — famoso → aposenta → decai → política (nome × base)
 *   C carreiras  — situações de carreira por trajetória (frequência, escolhas, resultados)
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
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { encerrarCarreira, entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { entrarNaPolitica, leituraPolitica } from '../../src/motor/sistemas/politica';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { trajetoriaDeSituacao } from '../../src/motor/sistemas/situacoes';
import { CLUBES } from '../../src/motor/dados/clubes';
import { estrategia } from './estrategias';

const N = Number(process.env.VIDAS ?? 120);
const SO = (process.env.SO ?? 'F,P,R,A,N,C').split(',');
const pct = (xs: boolean[]) => (xs.length ? `${Math.round(xs.filter(Boolean).length / xs.length * 100)}%` : '—');
const quantil = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const mediana = (xs: number[]) => quantil(xs, 0.5);
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const reais = (x: number) => (x >= 1e6 ? `R$ ${(x / 1e6).toFixed(2).replace('.', ',')} mi` : x >= 1e4 ? `R$ ${Math.round(x / 1000)} mil` : `R$ ${Math.round(x).toLocaleString('pt-BR')}`);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr'];

function responder(v: Vida, prefs: string[], r: Rng): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const livres = v.momento.opcoes.filter(o => !o.bloqueio);
    const op = prefs.map(p => livres.find(o => o.id === p)).find(Boolean) ?? livres[r.int(0, Math.max(0, livres.length - 1))] ?? v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

/* ============================================================ F. Futebol */

const PREFS_ATLETA = ['aceitar', 'renovar', 'descer', 'assinar', 'mercado', 'ficar', 'recusar', 'nao', 'treinar', 'perguntar'];

interface Ano { idade: number; nivel: number; espaco?: string; salario: number; rep: number; porte: string; h: number; nota: number; noto: number }

function futebol(): void {
  console.log(`\n## F. Futebol — ${N} carreiras a partir do primeiro contrato (17 → 36)\n`);
  const anos: Ano[] = [];
  const pico: number[] = []; const picoNivel4: number[] = [];
  const trans: number[] = []; const titulos: number[] = []; const titulosProt: number[] = []; const premios: number[] = [];
  const convocado: boolean[] = []; const jogosSel: number[] = []; const noto: number[] = []; const maxNivel: number[] = [];
  const acessos: number[] = []; const rebaix: number[] = []; const anosPro: number[] = [];
  const exemplos: string[] = [];
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 31);
    const h0 = Math.min(95, 79 + Math.abs(r.normal()) * 4.5);
    let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 40000 + s });
    // A infância passa depressa (o que importa aqui é a carreira): 17 anos, sem decisões.
    for (let k = 0; k < 17 && !v.morte; k++) { v = avancarAno(v).vida; v = responder(v, [], r); }
    if (v.morte) continue;
    const cidade = CLUBES.find(c => c.cidade === v.moradia.municipioId)?.nome ?? CLUBES[s % CLUBES.length].nome;
    v = transacao(v, (x, rr) => {
      garantirFrente(x, 'futebol');
      Object.assign(x.caminhos.frentes.futebol!, { habilidade: h0, interesse: 90, meses: 120, auge: h0 });
      x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined;
      entrarNaBase(x, 'futebol', CLUBES.find(c => c.nome === cidade)?.cidade ?? x.moradia.municipioId, cidade);
      profissionalizar(x, rr, h0 < 74 ? 1 : h0 < 81 ? 2 : h0 < 88 ? 3 : 4);
    }).vida;
    let max = 0, maxN = 0, maxNoto = 0, pro = 0;
    while (!v.morte && idade(v) < 36) {
      v = avancarAno(v).vida;
      v = responder(v, PREFS_ATLETA, r);
      // Sem clube, o telefone tocou: o atleta que insiste aceita a volta (como faria quem persegue a carreira).
      for (const o of v.caminhos.oportunidades.filter(o => o.tipo === 'convite' && /^(Um clube ligou|Voltar a jogar)$/.test(o.titulo))) { const a = { tipo: 'oportunidade', id: o.id, aceitar: true } as Acao; if (tenta(v, a)) { v = executar(v, a).vida; v = responder(v, PREFS_ATLETA, r); } }
      const e = v.caminhos.esporte;
      if (e?.fase !== 'profissional') { if (e?.fase === 'encerrada') break; continue; }
      const sal = v.trabalho.atual?.salario ?? 0;
      if (sal > 0) { pro++; anos.push({ idade: idade(v), nivel: e.nivel, espaco: e.espaco, salario: sal, rep: e.reputacao ?? 0, porte: CLUBES.find(c => c.nome === e.clube)?.porte ?? '?', h: v.caminhos.frentes.futebol?.habilidade ?? 0, nota: e.temporadas?.slice(-1)[0]?.nota ?? 0, noto: v.notoriedade?.valor ?? 0 }); }
      max = Math.max(max, sal); maxN = Math.max(maxN, e.nivel); maxNoto = Math.max(maxNoto, v.notoriedade?.valor ?? 0);
    }
    const e = v.caminhos.esporte;
    const pal = v.caminhos.palmares ?? [];
    if (process.env.DBG && s <= 12) console.log(`dbg s${s} h0 ${h0.toFixed(1)} fase ${e?.fase} motivo ${e?.motivoFim} idade ${idade(v)} anos ${pro} | ${v.biografia.filter(b => b.tema === 'trabalho').slice(-6).map(b => b.texto).join(' / ')}`);
    pico.push(max); if (maxN === 4) picoNivel4.push(max); maxNivel.push(maxN); noto.push(maxNoto); anosPro.push(pro);
    trans.push(v.biografia.filter(b => /^(Transferiu-se|Mudou de clube|Sem espaço no time|Voltou a jogar)/.test(b.texto)).length);
    titulos.push(pal.filter(x => x.tipo === 'titulo').length); titulosProt.push(pal.filter(x => x.tipo === 'titulo' && x.papel === 'protagonista').length);
    premios.push(pal.filter(x => x.tipo === 'premio').length);
    acessos.push(pal.filter(x => x.tipo === 'acesso').length); rebaix.push(pal.filter(x => x.tipo === 'rebaixamento').length);
    convocado.push((e?.selecao?.convocacoes ?? 0) > 0); jogosSel.push(e?.selecao?.jogos ?? 0);
    if (exemplos.length < 4 && pal.some(x => x.tipo === 'premio')) exemplos.push(`- h0 ${h0.toFixed(1)} · pico ${reais(max)} · ${pal.map(x => `${x.ano} ${x.texto}`).slice(0, 8).join('; ')}`);
  }
  const porNivel = [1, 2, 3, 4].map(n => anos.filter(a => a.nivel === n).map(a => a.salario));
  console.log('| divisão | anos-atleta | p10 | p25 | mediana | p75 | p90 | p99 | máx |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  ['estadual', 'acesso', 'Série B', 'Série A'].forEach((nome, k) => { const xs = porNivel[k]; console.log(`| ${nome} | ${xs.length} | ${reais(quantil(xs, 0.1))} | ${reais(quantil(xs, 0.25))} | ${reais(mediana(xs))} | ${reais(quantil(xs, 0.75))} | ${reais(quantil(xs, 0.9))} | ${reais(quantil(xs, 0.99))} | ${reais(Math.max(0, ...xs))} |`); });
  const a4 = anos.filter(a => a.nivel === 4);
  console.log('\nSérie A, por espaço e porte do clube (mediana · p90):');
  for (const esp of ['titular', 'reserva']) for (const porte of ['grande', 'tradicional']) { const xs = a4.filter(a => a.espaco === esp && a.porte === porte).map(a => a.salario); console.log(`- ${esp}, clube ${porte}: n=${xs.length} · ${reais(mediana(xs))} · ${reais(quantil(xs, 0.9))}`); }
  console.log('\nSérie A, por nome no mercado (reputação):');
  for (const [lo, hi] of [[0, 50], [50, 65], [65, 78], [78, 101]]) { const xs = a4.filter(a => a.rep >= lo && a.rep < hi).map(a => a.salario); console.log(`- reputação ${lo}–${hi - 1}: n=${xs.length} · mediana ${reais(mediana(xs))} · p90 ${reais(quantil(xs, 0.9))}`); }
  for (const n of [2, 3, 4]) { const xs = anos.filter(a => a.nivel === n); console.log(`- nível ${n}: técnica p25/med/p75 ${quantil(xs.map(a => a.h), 0.25).toFixed(0)}/${mediana(xs.map(a => a.h)).toFixed(0)}/${quantil(xs.map(a => a.h), 0.75).toFixed(0)} · nota p25/med/p75 ${quantil(xs.map(a => a.nota), 0.25)}/${mediana(xs.map(a => a.nota))}/${quantil(xs.map(a => a.nota), 0.75)} · notoriedade med ${mediana(xs.map(a => a.noto)).toFixed(0)} · titular ${pct(xs.map(a => a.espaco === 'titular'))}`); }
  console.log(`\nPico de salário (todas as carreiras): mediana ${reais(mediana(pico))} · p75 ${reais(quantil(pico, 0.75))} · p90 ${reais(quantil(pico, 0.9))} · p99 ${reais(quantil(pico, 0.99))}`);
  console.log(`Pico de quem chegou à Série A (${picoNivel4.length}): mediana ${reais(mediana(picoNivel4))} · p90 ${reais(quantil(picoNivel4, 0.9))}`);
  console.log(`Maior divisão alcançada: ${[1, 2, 3, 4].map(n => `${['estadual', 'acesso', 'B', 'A'][n - 1]} ${pct(maxNivel.map(x => x === n))}`).join(' · ')}`);
  console.log(`Anos como profissional (mediana): ${mediana(anosPro)} · transferências por carreira (média): ${media(trans).toFixed(1)}`);
  console.log(`Títulos por carreira (média): ${media(titulos).toFixed(2)} (como protagonista ${media(titulosProt).toFixed(2)}) · com ao menos 1 título: ${pct(titulos.map(x => x > 0))}`);
  console.log(`Acessos (média) ${media(acessos).toFixed(2)} · rebaixamentos (média) ${media(rebaix).toFixed(2)}`);
  console.log(`Prêmios individuais por carreira (média): ${media(premios).toFixed(2)} · com ao menos 1: ${pct(premios.map(x => x > 0))}`);
  console.log(`Seleção: convocado ao menos uma vez ${pct(convocado)} · jogos (mediana entre convocados) ${mediana(jogosSel.filter((_, k) => convocado[k]))}`);
  console.log(`Notoriedade máxima: mediana ${mediana(noto).toFixed(0)} · ≥ 55 (famoso) ${pct(noto.map(x => x >= 55))} · ≥ 78 (muito famoso) ${pct(noto.map(x => x >= 78))}`);
  if (exemplos.length) console.log(`\nExemplos:\n${exemplos.join('\n')}`);
}

/* ============================================================ P. Progressão base → profissional */

const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
function viverComAgente(v: Vida, ate: number, base: string, extra: (v: Vida, r: Rng) => Acao[], prefs: string[], r: Rng, ano?: (v: Vida) => void, filtro: (v: Vida, a: Acao) => boolean = () => true): Vida {
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
const portas = (v: Vida, tipos: string[]): Acao[] => v.caminhos.oportunidades.filter(o => tipos.includes(o.tipo)).map(o => ({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao));

function progressao(): void {
  console.log(`\n## P. Futebol, perseguição deliberada desde os 7 (${N} vidas, até os 34)\n`);
  const x = { base: [] as boolean[], pro: [] as boolean[], nivel: [] as number[], pico: [] as number[], titulos: [] as number[], premios: [] as number[], selecao: [] as boolean[], destaque: [] as boolean[], noto: [] as number[], trans: [] as number[], momentos: [] as number[] };
  for (let s = 1; s <= N; s++) {
    let base = false, pro = false, maxN = 0, pico = 0;
    const extra = (v: Vida): Acao[] => { const i = idade(v); const out: Acao[] = []; if (i >= 7 && i <= 17) { if (!v.rotinas.some(r => r.id === 'futebol' && (r.nivel ?? 1) >= 2)) out.push({ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 } as Acao); if (i >= 9 && i <= 15 && !v.rotinas.some(r => r.id === 'time_escola')) out.push({ tipo: 'rotina', id: 'time_escola', ativa: true, nivel: 1 } as Acao); out.push(P('treino_fundamentos', 'futebol'), P('pedir_teste', 'futebol')); } out.push(...portas(v, ['peneira', 'convite'])); return out; };
    const naCarreira = (w: Vida, a: Acao) => !(w.caminhos.esporte && w.caminhos.esporte.fase !== 'encerrada' && (a.tipo === 'candidatar' || (a.tipo === 'oportunidade' && !['peneira', 'convite'].includes(w.caminhos.oportunidades.find(o => o.id === (a as { id: string }).id)?.tipo ?? ''))));
    const v = viverComAgente(criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 50000 + s }), 34, 'social', extra, ['assinar', 'aceitar', 'renovar', 'descer', 'ir', 'sim', 'entrar', 'seguir', 'tentar'], criarRng(s * 7), w => {
      const e = w.caminhos.esporte; if (e?.modalidade === 'futebol') { if (e.fase !== 'encerrada') base = true; if (e.fase === 'profissional') { pro = true; maxN = Math.max(maxN, e.nivel); pico = Math.max(pico, w.trabalho.atual?.salario ?? 0); } }
    }, naCarreira);
    if (v.morte) continue;
    const pal = v.caminhos.palmares ?? [];
    x.base.push(base); x.pro.push(pro); x.destaque.push((v.educacao.vivencias ?? []).some(y => y.tipo === 'time' && (y.etapa === 'destaque' || y.etapa === 'capitao')));
    if (pro) { x.nivel.push(maxN); x.pico.push(pico); x.titulos.push(pal.filter(c => c.tipo === 'titulo').length); x.premios.push(pal.filter(c => c.tipo === 'premio').length); x.selecao.push((v.caminhos.esporte?.selecao?.convocacoes ?? 0) > 0); x.noto.push(v.notoriedade?.pico ?? 0); x.trans.push(v.biografia.filter(b => /^(Transferiu-se|Mudou de clube)/.test(b.texto)).length); x.momentos.push((v.caminhos.situacoes ?? []).length); }
  }
  console.log(`| chegou a uma base | profissional | destaque/capitão no time da escola | maior divisão (mediana, pros) | pico de salário (mediana, pros) | títulos (média) | prêmios (média) | convocado | notoriedade pico ≥ 55 | transferências (média) | momentos de carreira (média) |`);
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  console.log(`| ${pct(x.base)} | ${pct(x.pro)} | ${pct(x.destaque)} | ${x.nivel.length ? mediana(x.nivel) : '—'} | ${x.pico.length ? reais(mediana(x.pico)) : '—'} | ${media(x.titulos).toFixed(2)} | ${media(x.premios).toFixed(2)} | ${pct(x.selecao)} | ${pct(x.noto.map(n => n >= 55))} | ${media(x.trans).toFixed(1)} | ${media(x.momentos).toFixed(1)} |`);
}

/* ============================================================ R. Relações */

function relacoes(): void {
  console.log(`\n## R. Relações (${N} vidas adultas, 18 → 45; estratégia "social" + busca ativa alternando contextos)\n`);
  const ctxs = ['app', 'amigos', 'noite', 'atividade', 'estudo_trabalho'] as const;
  const c = { match: 0, conversa: 0, encontro: 0, saindoApp: 0, semQuimica: 0, soAmizade: 0, ghost: 0, buscas: 0, achou: 0, interesse: 0 };
  const namoros: number[] = [], duracoes: number[] = [], separacoes: number[] = [], amigos: number[] = [], reconc: number[] = [], porVia = new Map<string, { inicios: number; namoros: number }>();
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 13);
    let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: r.chance(0.5) ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 60000 + s });
    for (let k = 0; k < 18 && !v.morte; k++) { v = avancarAno(v).vida; v = responder(v, [], r); }
    if (v.morte) continue;
    v.eu.atracao = v.eu.genero === 'feminino' ? 'homens' : 'mulheres';
    const extra = (w: Vida, rr: Rng): Acao[] => {
      const out: Acao[] = [];
      const par = Object.values(w.vinculos).some(x => x.romance && ['saindo', 'namoro', 'morando_junto', 'casamento'].includes(x.romance.estagio) && !x.romance.secreto);
      if (!par) out.push({ tipo: 'conhecer_alguem', contexto: rr.pick([...ctxs]) } as Acao);
      for (const x of Object.values(w.vinculos)) {
        if (x.contexto?.via === 'app' && x.romance?.estagio === 'interesse') out.push({ tipo: 'pessoa', pessoaId: x.pessoaId, interacao: x.contexto.etapa === 'match' ? 'app_conversar' : 'app_encontro' } as Acao);
        else if (x.romance?.estagio === 'interesse' && !x.romance.pediuTempo) out.push({ tipo: 'pessoa', pessoaId: x.pessoaId, interacao: 'convidar' } as Acao);
      }
      return out;
    };
    v = viverComAgente(v, 45, 'social', extra, ['aceitar', 'sim', 'conversar', 'ficar'], r);
    if (v.morte) continue;
    for (const x of Object.values(v.vinculos)) {
      const fases = (x.fases ?? []).map(f => f.fase);
      const via = x.contexto?.via ?? (x.origem === 'online' ? 'app' : x.origem);
      if (fases.includes('match')) c.match++;
      if (fases.includes('conversa')) c.conversa++;
      if (fases.includes('encontro')) c.encontro++;
      if (via === 'app' && fases.includes('saindo')) c.saindoApp++;
      if (fases.includes('so_amizade')) c.soAmizade++;
      if (via === 'app' && fases.includes('sem_quimica') && !fases.includes('encontro')) c.ghost++;
      if (via === 'app' && fases.includes('encontro') && fases.includes('sem_quimica')) c.semQuimica++;
      if (fases.includes('saindo') || x.romance) { const pv = porVia.get(via) ?? { inicios: 0, namoros: 0 }; pv.inicios++; if (fases.includes('namoro') || ['namoro', 'morando_junto', 'casamento'].includes(x.romance?.estagio ?? '')) pv.namoros++; porVia.set(via, pv); }
    }
    namoros.push(Object.values(v.vinculos).filter(x => (x.fases ?? []).some(f => f.fase === 'namoro') || ['namoro', 'morando_junto', 'casamento'].includes(x.romance?.estagio ?? '')).length);
    separacoes.push(Object.values(v.vinculos).filter(x => x.romance?.estagio === 'ex' && x.romance.fim !== 'morte').length);
    for (const x of Object.values(v.vinculos)) { const f = x.fases ?? []; const ini = f.find(y => y.fase === 'namoro'); const fim = f.find(y => y.fase === 'ex' && ini && y.t > ini.t); if (ini) duracoes.push(((fim?.t ?? v.t) - ini.t) / 12); }
    amigos.push(Object.values(v.vinculos).filter(x => !x.parentesco && (x.estagio === 'amigo' || x.estagio === 'amigo_proximo')).length);
    reconc.push(Object.values(v.vinculos).filter(x => (x.fases ?? []).some(f => f.fase === 'reconciliacao')).length);
  }
  console.log(`App: matches ${c.match} → conversas ${c.conversa} (${Math.round(c.conversa / Math.max(1, c.match) * 100)}%) → encontros ${c.encontro} → saindo ${c.saindoApp} (${Math.round(c.saindoApp / Math.max(1, c.encontro) * 100)}% dos encontros) · sem química depois do encontro ${c.semQuimica} · viraram amizade ${c.soAmizade} · sumiram antes do encontro ${c.ghost}`);
  console.log(`Por origem (relações que começaram a sair → chegaram a namoro): ${[...porVia.entries()].map(([k, x]) => `${k} ${x.inicios}→${x.namoros}`).join(' · ')}`);
  console.log(`Namoros por vida (mediana) ${mediana(namoros)} · duração do namoro (mediana, anos — inclui os que seguem juntos) ${mediana(duracoes).toFixed(1)} · separações por vida (média) ${media(separacoes).toFixed(2)} · amigos aos 45 (mediana) ${mediana(amigos)} · vidas com reconciliação ${pct(reconc.map(n => n > 0))}`);
}

/* ============================================================ A. Atividades */

function atividades(): void {
  console.log(`\n## A. Atividades da escola com história (${N} vidas, dos 9 aos 18)\n`);
  const ids = ['time_escola', 'olimpiada', 'clube_ciencias', 'projeto_escola', 'reforco', 'xadrez'];
  const tipo: Record<string, string> = { time_escola: 'time', olimpiada: 'olimpiada', clube_ciencias: 'ciencias', projeto_escola: 'projeto', reforco: 'reforco', xadrez: 'xadrez' };
  const etapas = new Map<string, Map<string, number>>();
  const feitos = new Map<string, number>();
  const n = new Map<string, number>();
  let comMarcos = 0, total = 0;
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 17);
    const escolha = ids[s % ids.length];
    const extra = (w: Vida): Acao[] => (idade(w) >= 9 && idade(w) <= 17 && !w.rotinas.some(x => x.id === escolha) ? [{ tipo: 'rotina', id: escolha, ativa: true, nivel: escolha === 'xadrez' ? 2 : 1 } as Acao] : []);
    const v = viverComAgente(criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: r.chance(0.5) ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 70000 + s }), 18, r.pick(['estudioso', 'social', 'familiar']), extra, [], r);
    if (v.morte) continue;
    const viv = (v.educacao.vivencias ?? []).filter(x => x.tipo === tipo[escolha]);
    if (!viv.length) continue;
    total++;
    n.set(escolha, (n.get(escolha) ?? 0) + 1);
    const melhor = viv.sort((a, b) => b.anos - a.anos)[0];
    const m = etapas.get(escolha) ?? new Map<string, number>(); m.set(melhor.etapa ?? '—', (m.get(melhor.etapa ?? '—') ?? 0) + 1); etapas.set(escolha, m);
    if (melhor.feito) feitos.set(escolha, (feitos.get(escolha) ?? 0) + 1);
    if ((melhor.marcos?.length ?? 0) > 0) comMarcos++;
  }
  console.log('| atividade | vidas | onde a história parou (a etapa final) | com um "feito" |');
  console.log('| --- | --- | --- | --- |');
  for (const id of ids) console.log(`| ${id} | ${n.get(id) ?? 0} | ${[...(etapas.get(id) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([k, x]) => `${k} ${x}`).join(' · ')} | ${feitos.get(id) ?? 0} |`);
  console.log(`\nCom pelo menos um marco na história: ${Math.round(comMarcos / Math.max(1, total) * 100)}% das que entraram.`);
}

/* ============================================================ N. Fama */

function fama(): void {
  console.log(`\n## N. Fama através das fases (${N} atletas de nome, aposentando aos 34, até os 46)\n`);
  const apos: number[][] = [], politica: { publico: string; reputacao: string; apoio: number; noto: number }[] = [];
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 19);
    let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: 'masculino', municipioId: 'sao-paulo-sp', semente: 80000 + s });
    for (let k = 0; k < 17 && !v.morte; k++) { v = avancarAno(v).vida; v = responder(v, [], r); }
    if (v.morte) continue;
    v = transacao(v, (x, rr) => { garantirFrente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 90 + r.next() * 5, interesse: 90, meses: 120, auge: 92 }); x.trabalho.atual = undefined; x.educacao.basica = undefined; x.caminhos.esporte = undefined; entrarNaBase(x, 'futebol', 'sao-paulo-sp', 'São Paulo'); profissionalizar(x, rr, 4); }).vida;
    while (!v.morte && idade(v) < 34) { v = avancarAno(v).vida; v = responder(v, PREFS_ATLETA, r); }
    if (v.morte || (v.notoriedade?.valor ?? 0) < 30) continue;
    const serie = [v.notoriedade!.valor];
    v = transacao(v, x => { if (x.caminhos.esporte?.fase === 'profissional') encerrarCarreira(x, x.caminhos.esporte, 'escolha'); }).vida;
    for (let k = 0; k < 12 && !v.morte; k++) { v = avancarAno(v).vida; v = responder(v, [], r); serie.push(v.notoriedade?.valor ?? 0); if (k === 1) v = transacao(v, x => { entrarNaPolitica(x, 'notoriedade'); }).vida; }
    apos.push(serie);
    const l = leituraPolitica(v);
    if (l) politica.push({ publico: l.publico ?? '', reputacao: l.reputacao, apoio: v.caminhos.politica?.apoio ?? 0, noto: v.notoriedade?.valor ?? 0 });
  }
  const em = (k: number) => mediana(apos.map(x => x[k] ?? 0)).toFixed(0);
  console.log(`Notoriedade (mediana) ao parar: ${em(0)} · +2 anos ${em(2)} · +5 anos ${em(5)} · +10 anos ${em(10)} (n=${apos.length})`);
  console.log(`Na política (depois de entrar pela porta da notoriedade): apoio mediano ${mediana(politica.map(x => x.apoio))}; exemplos de leitura:`);
  for (const x of politica.slice(0, 3)) console.log(`- Para o público: ${x.publico} | Como político: ${x.reputacao} | apoio ${x.apoio}`);
}

/* ============================================================ C. Situações de carreira */

function situacoes(): void {
  console.log(`\n## C. Situações de carreira (${N} vidas adultas, 25 → 45, emprego comum e outras trajetórias)\n`);
  const porTraj = new Map<string, { anos: number; momentos: number; desf: Map<string, number> }>();
  const ocs = ['vendedor', 'assistente_adm', 'medico', 'professor_univ', 'ator', 'tec_enfermagem'];
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 23);
    let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: r.chance(0.5) ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 90000 + s });
    for (let k = 0; k < 25 && !v.morte; k++) { v = avancarAno(v).vida; v = responder(v, [], r); }
    if (v.morte) continue;
    const oc = ocs[s % ocs.length];
    v = transacao(v, (x, rr) => { x.trabalho.atual = undefined; contratar(x, rr, ocupacao(oc), 'oportunidade'); }).vida;
    const chave = trajetoriaDeSituacao(v) ?? oc;
    let anos = 0;
    while (!v.morte && idade(v) < 45) {
      v = avancarAno(v).vida; anos++;
      if (v.momento?.situacaoId === 'car_situacao') {
        const op = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: r.pick(op).id }).vida;
      }
      v = responder(v, [], r);
    }
    const x = porTraj.get(chave) ?? { anos: 0, momentos: 0, desf: new Map() };
    x.anos += anos; x.momentos += (v.caminhos.situacoes ?? []).length;
    for (const y of v.caminhos.situacoes ?? []) x.desf.set(y.desfecho, (x.desf.get(y.desfecho) ?? 0) + 1);
    porTraj.set(chave, x);
  }
  console.log('| trajetória | anos vividos | momentos | por década | desfechos (ótimo/bom/ruim/péssimo) |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const [k, x] of porTraj) console.log(`| ${k} | ${x.anos} | ${x.momentos} | ${(x.momentos / Math.max(1, x.anos) * 10).toFixed(1)} | ${['otimo', 'bom', 'ruim', 'pessimo'].map(d => x.desf.get(d) ?? 0).join('/')} |`);
}

if (SO.includes('F')) futebol();
if (SO.includes('P')) progressao();
if (SO.includes('R')) relacoes();
if (SO.includes('A')) atividades();
if (SO.includes('N')) fama();
if (SO.includes('C')) situacoes();

