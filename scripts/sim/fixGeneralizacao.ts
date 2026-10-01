/**
 * Simulações dirigidas do FIX FINAL da generalização (antes/depois). Amostras
 * para ver distribuições — não a simulação oficial de mil vidas.
 *
 *   npx esbuild scripts/sim/fixGeneralizacao.ts --bundle --platform=node --outfile=/tmp/fixg.cjs
 *   VIDAS=300 SO=T node /tmp/fixg.cjs
 *
 *   T tênis      — população natural: tênis perseguido desde os 7 (treino, time,
 *                  pedir teste, aceitar as portas), até os 34. Quem vira
 *                  profissional, até onde chega no ranking, quem é chamado
 *                  para a equipe do país; e a amostra de elite (técnica 80+)
 *   P política   — vidas que entram na política aos 25 pela associação do
 *                  bairro, até os 70, com três agentes: só trabalho de base;
 *                  uma candidatura; carreira (toda eleição, prioridade no
 *                  mandato)
 *   F farda      — vidas que entram aos 19 na escola de sargentos ou na
 *                  academia (concurso), e vidas que só fazem o serviço inicial
 *                  (temporário), até os 62
 *   E esportes   — uma carreira por modalidade (vôlei, natação, atletismo,
 *                  luta): o que a temporada e o histórico mostram
 *
 * Sempre pelo que o jogador pode fazer (`disponibilidade` → `executar`).
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { CarreiraEsportiva, Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { anoDe } from '../../src/motor/tempo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { aptidao, garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, linhaDaTemporada, profissionalizar } from '../../src/motor/sistemas/esporte';
import { entrarNaPolitica, mandatosDaVida } from '../../src/motor/sistemas/politica';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { historicoDaCarreira, resumoDaCarreira } from '../../src/motor/sistemas/perfisEsportivos';
import { estrategia } from './estrategias';
import * as legado from '../../src/motor/sistemas/legado';

const N = Number(process.env.VIDAS ?? 120);
const SO = (process.env.SO ?? 'T,P,F,E').split(',');
const pct = (xs: boolean[]) => (xs.length ? `${Math.round(xs.filter(Boolean).length / xs.length * 100)}%` : '—');
const pctN = (xs: boolean[]) => (xs.length ? `${pct(xs)} (${xs.filter(Boolean).length}/${xs.length})` : '—');
const quantil = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0; };
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const dist = (xs: number[]) => (xs.length ? `p10 ${quantil(xs, 0.1)} · p25 ${quantil(xs, 0.25)} · mediana ${quantil(xs, 0.5)} · p75 ${quantil(xs, 0.75)} · p90 ${quantil(xs, 0.9)}` : '—');
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'campina-grande-pb', 'fortaleza-ce', 'curitiba-pr'];
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
const POL = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);
const portas = (v: Vida, tipos: string[]): Acao[] => v.caminhos.oportunidades.filter(o => tipos.includes(o.tipo)).map(o => ({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao));

function viver(v: Vida, ate: number, base: string, extra: (v: Vida, r: Rng) => Acao[], prefs: string[] | ((v: Vida) => string[]), r: Rng, ano?: (v: Vida) => void, filtro: (v: Vida, a: Acao) => boolean = () => true): Vida {
  const e = estrategia(base);
  const decidir = () => { const m = v.momento!; const livres = m.opcoes.filter(o => !o.bloqueio); for (const p of typeof prefs === 'function' ? prefs(v) : prefs) { const o = livres.find(x => x.id === p); if (o) return o.id; } return e.decidir(v, m, r); };
  const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: decidir() }).vida; };
  while (!v.morte && idade(v) < ate) {
    for (const a of [...extra(v, r), ...e.agir(v, r)]) { if (!filtro(v, a) || !tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
    v = avancarAno(v).vida; responder(); ano?.(v);
  }
  return v;
}
const carreiraDe = (v: Vida, d: string): CarreiraEsportiva | undefined => [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].find(c => c?.modalidade === d && (c.temporadas?.length ?? 0) > 0);

/* ============================================================ T. Tênis */

function tenis(): void {
  console.log(`\n## T. Tênis — população natural (${N} vidas, tênis desde os 7, dedicação alta, até os 34)\n`);
  interface R { hMax?: number; apt: number; base: boolean; pro: boolean; idadePro?: number; maxNivel: number; melhor: number; rk25?: number; rk28?: number; anosPrincipal: number; titulos: number; titulosPrincipal: number; finais: number; equipe: boolean; titularEquipe: boolean; temporadas: number }
  const xs: R[] = [];
  for (let s = 1; s <= N; s++) {
    const semente = 410000 + s;
    const r = criarRng(semente * 3);
    const res: R = { apt: 0, base: false, pro: false, maxNivel: 0, melhor: 9999, anosPrincipal: 0, titulos: 0, titulosPrincipal: 0, finais: 0, equipe: false, titularEquipe: false, temporadas: 0 };
    const extra = (v: Vida): Acao[] => {
      const i = idade(v);
      const out: Acao[] = [];
      if (i >= 7 && i <= 24) {
        if (!v.rotinas.some(x => x.id === 'tenis' && (x.nivel ?? 1) >= 2) && v.caminhos.esporte?.fase !== 'profissional') out.push({ tipo: 'rotina', id: 'tenis', ativa: true, nivel: 2 } as Acao);
        out.push(P('treino_fundamentos', 'tenis'), P('pedir_teste', 'tenis'));
      }
      out.push(...portas(v, ['peneira', 'convite', 'seletiva']));
      return out;
    };
    const filtro = (w: Vida, a: Acao) => !(w.caminhos.esporte && w.caminhos.esporte.fase !== 'encerrada' && (a.tipo === 'candidatar' || (a.tipo === 'oportunidade' && !['peneira', 'convite', 'seletiva'].includes(w.caminhos.oportunidades.find(o => o.id === (a as { id: string }).id)?.tipo ?? ''))));
    let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente });
    res.apt = aptidao(v, 'tenis');
    v = viver(v, 34, 'familiar', extra, ['assinar', 'aceitar', 'renovar', 'ir', 'sim', 'entrar', 'seguir', 'tentar', 'treinar', 'continuar'], r, w => {
      const e = w.caminhos.esporte;
      if (e?.modalidade !== 'tenis') return;
      if (e.fase === 'base') res.base = true;
      if (e.fase === 'profissional') {
        res.hMax = Math.max(res.hMax ?? 0, w.caminhos.frentes.tenis?.habilidade ?? 0);
        if (!res.pro) { res.pro = true; res.idadePro = idade(w); }
        const t = e.temporadas?.[e.temporadas.length - 1];
        if (t) { if (idade(w) === 25) res.rk25 = t.ranking; if (idade(w) === 28) res.rk28 = t.ranking; }
      }
    }, filtro);
    const e = carreiraDe(v, 'tenis');
    if (e && res.pro) {
      const ts = e.temporadas ?? [];
      res.temporadas = ts.length;
      res.maxNivel = Math.max(0, ...ts.map(t => t.nivel));
      res.melhor = Math.min(9999, ...ts.map(t => t.ranking ?? 9999));
      res.anosPrincipal = ts.filter(t => t.nivel === 4).length;
      res.titulos = ts.reduce((a, t) => a + (t.titulos ?? 0), 0);
      res.titulosPrincipal = ts.filter(t => t.nivel === 4).reduce((a, t) => a + (t.titulos ?? 0), 0);
      res.finais = ts.reduce((a, t) => a + (t.finais ?? 0), 0);
      res.equipe = (e.selecao?.convocacoes ?? 0) > 0;
      res.titularEquipe = (v.caminhos.palmares ?? []).some(x => x.tipo === 'selecao' && x.modalidade === 'tenis' && x.papel === 'protagonista');
    }
    xs.push(res);
  }
  const pros = xs.filter(x => x.pro);
  console.log(`Chegaram a uma academia: ${pctN(xs.map(x => x.base))} · viraram profissionais: ${pctN(xs.map(x => x.pro))} · idade do 1º ano profissional (mediana): ${quantil(pros.map(x => x.idadePro!), 0.5)}\n`);
  relatorioTenis(pros);
  console.log(`\nTécnica máxima no tênis como profissional: ${dist(pros.map(x => Math.round(x.hMax ?? 0)))} (a régua do circuito principal é 91)`);
  console.log('\n**Por facilidade de nascença (profissionais):**\n');
  console.log('| facilidade | profissionais | circuito principal | melhor ranking (mediana) | top 100 | equipe do país |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const [nome, f] of [['baixa/média (≤ 0,2)', (x: R) => x.apt <= 0.2], ['alta (> 0,2)', (x: R) => x.apt > 0.2], ['excepcional (> 0,45)', (x: R) => x.apt > 0.45]] as [string, (x: R) => boolean][]) {
    const g = pros.filter(f);
    console.log(`| ${nome} | ${g.length} | ${pct(g.map(x => x.maxNivel === 4))} | ${g.length ? quantil(g.map(x => x.melhor), 0.5) : '—'} | ${pct(g.map(x => x.melhor <= 100))} | ${pct(g.map(x => x.equipe))} |`);
  }

  console.log(`\n### Tênis — amostra de elite (${N} carreiras, técnica inicial 80+, 18 → 34; a mesma da simulação M do pacote)\n`);
  const elite: R[] = [];
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 41);
    const h0 = Math.min(95, 80 + Math.abs(r.normal()) * 5);
    let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 3 === 0 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 95000 + s });
    for (let k = 0; k < 18 && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
    if (v.morte) continue;
    v = transacao(v, (x, rr) => {
      garantirFrente(x, 'tenis');
      Object.assign(x.caminhos.frentes.tenis!, { habilidade: h0, interesse: 90, meses: 120, auge: h0 });
      x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined;
      x.financas.conta += 400000;
      entrarNaBase(x, 'tenis', x.moradia.municipioId, `academia de tênis de ${x.moradia.municipioId}`);
      profissionalizar(x, rr, h0 < 82 ? 1 : h0 < 86 ? 2 : h0 < 90 ? 3 : 4);
    }).vida;
    v = viver(v, 34, 'passivo', w => portas(w, ['convite']), ['aceitar', 'renovar', 'continuar', 'seguir'], r, undefined, (_w, a) => a.tipo !== 'candidatar');
    const e = carreiraDe(v, 'tenis');
    if (!e) continue;
    const ts = e.temporadas ?? [];
    elite.push({ apt: 0, base: true, pro: true, maxNivel: Math.max(0, ...ts.map(t => t.nivel)), melhor: Math.min(9999, ...ts.map(t => t.ranking ?? 9999)), anosPrincipal: ts.filter(t => t.nivel === 4).length, titulos: ts.reduce((a, t) => a + (t.titulos ?? 0), 0), titulosPrincipal: ts.filter(t => t.nivel === 4).reduce((a, t) => a + (t.titulos ?? 0), 0), finais: ts.reduce((a, t) => a + (t.finais ?? 0), 0), equipe: (e.selecao?.convocacoes ?? 0) > 0, titularEquipe: (v.caminhos.palmares ?? []).some(x => x.tipo === 'selecao' && x.modalidade === 'tenis' && x.papel === 'protagonista'), temporadas: ts.length, rk25: ts.find(t => t.ano === ts[0].ano + 7)?.ranking, rk28: ts.find(t => t.ano === ts[0].ano + 10)?.ranking });
  }
  relatorioTenis(elite);
}

function relatorioTenis(pros: { maxNivel: number; melhor: number; rk25?: number; rk28?: number; anosPrincipal: number; titulos: number; titulosPrincipal: number; finais: number; equipe: boolean; titularEquipe: boolean; temporadas: number }[]): void {
  if (!pros.length) { console.log('(nenhum profissional)'); return; }
  console.log(`Profissionais: ${pros.length} · anos de circuito (mediana): ${quantil(pros.map(x => x.temporadas), 0.5)}\n`);
  console.log('| maior circuito | profissionais |');
  console.log('| --- | --- |');
  for (const [n, nome] of [[1, 'torneios nacionais'], [2, 'entrada internacional'], [3, 'challengers'], [4, 'circuito principal']] as [number, string][]) console.log(`| ${nome} | ${pctN(pros.map(x => x.maxNivel === n))} |`);
  const melhores = pros.map(x => x.melhor);
  console.log(`\nMelhor ranking da carreira: ${dist(melhores)}`);
  console.log(`Faixas do melhor ranking: top 10 ${pct(melhores.map(x => x <= 10))} · top 50 ${pct(melhores.map(x => x <= 50))} · top 100 ${pct(melhores.map(x => x <= 100))} · 101–300 ${pct(melhores.map(x => x > 100 && x <= 300))} · 301–800 ${pct(melhores.map(x => x > 300 && x <= 800))} · acima de 800 ${pct(melhores.map(x => x > 800))}`);
  const r25 = pros.map(x => x.rk25).filter((x): x is number => x !== undefined);
  if (r25.length) console.log(`Ranking aos 25 (quem ainda jogava): ${dist(r25)}`);
  console.log(`Anos no circuito principal (média): ${media(pros.map(x => x.anosPrincipal)).toFixed(1)} · títulos (média): ${media(pros.map(x => x.titulos)).toFixed(1)} · títulos no principal (média · % com): ${media(pros.map(x => x.titulosPrincipal)).toFixed(2)} · ${pct(pros.map(x => x.titulosPrincipal > 0))} · finais (média): ${media(pros.map(x => x.finais)).toFixed(1)}`);
  console.log(`Equipe do país: convocados ${pctN(pros.map(x => x.equipe))} · titulares em algum confronto ${pctN(pros.map(x => x.titularEquipe))}`);
  console.log(`Convocados por faixa do melhor ranking: top 100 ${pct(pros.filter(x => x.melhor <= 100).map(x => x.equipe))} · 101–300 ${pct(pros.filter(x => x.melhor > 100 && x.melhor <= 300).map(x => x.equipe))} · acima de 300 ${pct(pros.filter(x => x.melhor > 300).map(x => x.equipe))}`);
}

/* ============================================================ P. Política */

function politica(): void {
  console.log(`\n## P. Política — ${N} vidas por agente, que entram aos 25 pela associação do bairro, até os 70\n`);
  const AGENTES = {
    base: 'trabalho de base (nunca se filia nem se candidata)',
    uma: 'uma candidatura (filia-se, disputa a primeira eleição para vereador, depois só o trabalho de base)',
    carreira: 'carreira (filia-se, disputa toda eleição, prioridade no mandato)'
  } as const;
  for (const agente of Object.keys(AGENTES) as (keyof typeof AGENTES)[]) {
    const nReal: number[] = [], nCand: number[] = [], nEleito: number[] = [], nMand: number[] = [];
    const semReal: boolean[] = [], reeleito: boolean[] = [], filiado: boolean[] = [], encerrou: boolean[] = [], sobreposto: boolean[] = [];
    const exemplos: string[] = [];
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 29);
      let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 520000 + s });
      v = viver(v, 25, 'social', () => [], [], r);
      if (v.morte) continue;
      v = transacao(v, x => { entrarNaPolitica(x, 'comunidade', 1); }).vida;
      const disputou = (w: Vida) => (w.caminhos.politica?.historico ?? []).some(h => h.resultado === 'eleito' || h.resultado === 'derrotado') || !!w.caminhos.politica?.campanha;
      const extra = (w: Vida): Acao[] => {
        const p = w.caminhos.politica;
        if (!p || p.fase === 'encerrada') return [];
        const out: Acao[] = [POL('comunidade')];
        if (agente === 'base') return out;
        if (!p.partido) out.push(POL('filiar'));
        if (!p.prioridade) out.push(POL('bandeira', 'saude'));
        if (agente === 'carreira' || !disputou(w)) out.push(POL('candidatura'));
        if (p.mandato) out.push(POL('prioridade'));
        return out;
      };
      const prefs = (w: Vida) => agente === 'base' ? ['nenhum', 'nao'] : agente === 'uma' && disputou(w) && !w.caminhos.politica?.campanha ? ['nao', 'voltar', 'fin_pequenas', 'rua_porta', 'tom_propostas'] : ['p0', 'p1', agente === 'uma' ? 'cargo_vereador' : 'cargo_prefeito', 'cargo_vereador', 'cargo_deputado_estadual', 'fin_pequenas', 'rua_porta', 'tom_propostas', 'entrar'];
      v = viver(v, 70, 'social', extra, prefs, r);
      const p = v.caminhos.politica;
      if (!p) continue;
      const tr = legado.trajetoriasDaVida(v).find(t => t.area === 'politica');
      const cands = p.historico.filter(h => h.resultado === 'eleito' || h.resultado === 'derrotado');
      nReal.push(tr?.realizacoes.length ?? 0);
      semReal.push(!tr || tr.realizacoes.length === 0);
      nCand.push(cands.length);
      nEleito.push(cands.filter(h => h.resultado === 'eleito').length);
      nMand.push(p.historico.filter(h => h.resultado === 'concluiu' || h.resultado === 'renunciou' || h.resultado === 'cassado').length + (p.mandato ? 1 : 0));
      reeleito.push(cands.some((h, k) => h.resultado === 'eleito' && cands.slice(0, k).some(x => x.resultado === 'eleito' && x.cargo === h.cargo)));
      filiado.push(!!p.partido || (p.partidos?.length ?? 0) > 0);
      encerrou.push(p.fase === 'encerrada');
      // Integridade do histórico: dois mandatos ao mesmo tempo não existem.
      const ms = mandatosDaVida(v);
      const vigentes = ms.filter(m => m.como !== 'à espera da posse');
      sobreposto.push(vigentes.some((m, k) => vigentes.some((o, j) => j !== k && o.de < (m.ate ?? 9999) && m.de < (o.ate ?? 9999))));
      if (process.env.DEBUG_POL && sobreposto[sobreposto.length - 1]) console.log(JSON.stringify(ms.map(m => [m.cargo, m.de, m.ate, m.como])), JSON.stringify(p.historico.map(h => [anoDe(h.t), h.cargo, h.resultado])));
      if (exemplos.length < 3 && tr) exemplos.push(`- ${tr.titulo} (${tr.periodo}): ${tr.resumo}\n  - realizações: ${tr.realizacoes.length ? tr.realizacoes.join('; ') : '(nenhuma)'}`);
    }
    console.log(`### Agente ${AGENTES[agente]}\n`);
    console.log(`Vidas: ${nReal.length} · filiadas: ${pct(filiado)} · encerraram a vida pública: ${pct(encerrou)}`);
    console.log(`Candidaturas por vida: ${dist(nCand)} · eleições ganhas: ${dist(nEleito)} · mandatos: ${dist(nMand)}`);
    console.log(`Ao menos uma eleição ganha: ${pct(nEleito.map(x => x > 0))} · reeleição no mesmo cargo: ${pct(reeleito)} · histórico com mandatos sobrepostos: ${pct(sobreposto)}`);
    console.log(`Realizações na trajetória: ${dist(nReal)} · trajetórias sem nenhuma realização: ${pct(semReal)}`);
    if (exemplos.length) console.log(`\nExemplos:\n${exemplos.join('\n')}\n`);
  }
}

/* ============================================================ F. Farda */

function farda(): void {
  console.log(`\n## F. Farda — ${N} vidas por agente, até os 62\n`);
  for (const agente of ['carreira', 'temporario'] as const) {
    const nReal: number[] = [], anos: number[] = [], postos: number[] = [], semReal: boolean[] = [], longa: boolean[] = [], guarn: number[] = [];
    const exemplos: string[] = [];
    let entraram = 0;
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 31 + (agente === 'carreira' ? 0 : 7));
      let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: agente === 'temporario' || s % 3 ? 'masculino' : 'feminino', municipioId: CIDADES[s % CIDADES.length], semente: 630000 + s + (agente === 'carreira' ? 0 : 5000) });
      // A porta (concurso ou convocação) não é o que se mede aqui: a vida entra aos 19 e a carreira segue pelo que o jogador pode fazer.
      v = viver(v, 19, 'estudioso', () => [], [], r);
      if (v.morte) continue;
      v = transacao(v, (x, rr) => { x.educacao.matricula = undefined; x.trabalho.atual = undefined; contratar(x, rr, ocupacao(agente === 'temporario' ? 'soldado_ep' : s % 2 ? 'aluno_sargento' : 'cadete'), agente === 'temporario' ? 'oportunidade' : 'concurso'); }).vida;
      const filtro = (w: Vida, a: Acao) => !(w.trabalho.atual?.contrato === 'militar' && (a.tipo === 'candidatar' || a.tipo === 'pedir_demissao' || a.tipo === 'oportunidade'));
      // O temporário dá baixa no fim do primeiro engajamento possível (prefere sair); o de carreira fica, faz os cursos, aceita as transferências.
      const prefs = agente === 'carreira' ? ['fazer', 'aceitar', 'todos', 'ir', 'continuar', 'ficar', 'sim'] : ['baixa', 'sair', 'dar_baixa', 'nao'];
      v = viver(v, 62, 'estudioso', () => [], prefs, r, undefined, filtro);
      const m = v.caminhos.militar;
      if (!m) continue;
      entraram++;
      const tr = legado.trajetoriasDaVida(v).find(t => t.area === 'militar');
      const det = tr?.detalhe.find(d => d.titulo === 'Postos');
      nReal.push(tr?.realizacoes.length ?? 0);
      semReal.push(!tr || tr.realizacoes.length === 0);
      const a = Number(/^(\d+)/.exec(tr?.resumo ?? '')?.[1] ?? 0);
      anos.push(a);
      longa.push(a >= 15);
      postos.push(det?.linhas.length ?? 0);
      guarn.push((m.guarnicoes ?? []).length || 1);
      if (exemplos.length < 3 && tr) exemplos.push(`- ${tr.titulo} (${tr.periodo}): ${tr.resumo}\n  - realizações: ${tr.realizacoes.length ? tr.realizacoes.join('; ') : '(nenhuma)'}`);
    }
    console.log(`### Agente ${agente === 'carreira' ? 'carreira (concurso de sargento ou academia)' : 'serviço inicial (dá baixa quando pode)'}\n`);
    console.log(`Entraram nas Forças: ${entraram}/${N} · anos de farda: ${dist(anos)} · postos na escada: ${dist(postos)} · guarnições: ${dist(guarn)}`);
    console.log(`Realizações: ${dist(nReal)} · sem nenhuma realização: ${pct(semReal)}`);
    console.log(`Carreira longa (15+ anos): ${pct(longa)} · realizações (média) longa ${media(nReal.filter((_, k) => longa[k])).toFixed(1)} vs curta ${media(nReal.filter((_, k) => !longa[k])).toFixed(1)}`);
    if (exemplos.length) console.log(`\nExemplos:\n${exemplos.join('\n')}\n`);
  }
}

/* ============================================================ E. Esportes */

function esportes(): void {
  console.log(`\n## E. Esportes — o que a temporada e o histórico mostram (vôlei, natação, atletismo, luta; ${Math.min(N, 20)} carreiras, 18 → 34)\n`);
  for (const d of ['volei', 'natacao', 'atletismo', 'lutas'] as const) {
    const linhas: string[] = [], resumos: string[] = [], colunas: string[] = [];
    let n = 0;
    for (let s = 1; s <= Math.min(N, 20); s++) {
      const r = criarRng(s * 59);
      const h0 = Math.min(95, 78 + Math.abs(r.normal()) * 7);
      let v = criarVida({ nome: 'Sim', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % CIDADES.length], semente: 740000 + s * 11 + d.length * 1000 });
      for (let k = 0; k < 18 && !v.morte; k++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; }
      if (v.morte) continue;
      v = transacao(v, (x, rr) => {
        garantirFrente(x, d);
        Object.assign(x.caminhos.frentes[d]!, { habilidade: h0, interesse: 90, meses: 120, auge: h0 });
        x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.caminhos.esporte = undefined;
        entrarNaBase(x, d, x.moradia.municipioId, 'equipe da prefeitura');
        profissionalizar(x, rr, h0 < 82 ? 1 : h0 < 86 ? 2 : h0 < 90 ? 3 : 4);
      }).vida;
      v = viver(v, 34, 'passivo', w => portas(w, ['convite']), ['aceitar', 'renovar', 'assinar', 'continuar', 'seguir', 'ficar'], r, undefined, (_w, a) => a.tipo !== 'candidatar');
      const e = carreiraDe(v, d);
      if (!e) continue;
      n++;
      if (linhas.length < 3) linhas.push(`- ${linhaDaTemporada(v, e.temporadas![Math.min(4, e.temporadas!.length - 1)], d)}`);
      if (resumos.length < 3) resumos.push(`- ${resumoDaCarreira(e)}`);
      if (!colunas.length) colunas.push(historicoDaCarreira(e).colunas.join(' · '));
    }
    console.log(`### ${d} (${n} carreiras)\n\nColunas do histórico: ${colunas[0] ?? '—'}\n\nUma temporada (a quinta):\n${linhas.join('\n')}\n\nResumo da carreira:\n${resumos.join('\n')}\n`);
  }
}

if (SO.includes('T')) tenis();
if (SO.includes('P')) politica();
if (SO.includes('F')) farda();
if (SO.includes('E')) esportes();
