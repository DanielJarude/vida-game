/**
 * Simulador comparativo do FIX pós-REWORK 2 (integração, relações, carreiras vivas).
 *
 *   npx esbuild scripts/sim/fixPosRework2.ts --bundle --platform=node --outfile=/tmp/fix.cjs
 *   VIDAS=40 node /tmp/fix.cjs
 *
 * Grupos comparados, sempre só com o que o jogador pode fazer
 * (`disponibilidade` → `executar`), com a mesma semente em cada grupo:
 *   política   — sem intenção política × perseguindo política;
 *   amizades   — passivo × típico × sociável (conhecidos, colegas, amigos, próximos por idade);
 *   esporte    — treino deliberado × mesma vida sem investir; e a carreira profissional
 *                (forçada no início, como nos testes) vivida até o fim: temporadas, lesões,
 *                declínio, fim por mercado × escolha;
 *   sobrecarga — vida leve × trabalho + faculdade + treino + academia;
 *   carreiras  — decisões e estado próprio por ano: profissão comum, arte, política, esporte, negócio.
 */

import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { clamp, criarRng, type Rng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao, vinculosVivos } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { ROTINAS } from '../../src/motor/sistemas/rotinas';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { lerTecnica } from '../../src/motor/sistemas/peneira';
import { interacoesPara } from '../../src/motor/sistemas/interacoes';
import { acoesDoTrabalho } from '../../src/motor/sistemas/profissao';
import { rendaDeImagem, processarNotoriedade } from '../../src/motor/sistemas/notoriedade';
import { temporadaDePalco } from '../../src/motor/sistemas/palco';
import { remuneracaoDe } from '../../src/motor/sistemas/renda';

const N = Number(process.env.VIDAS ?? 40);
const CIDADES = ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'salvador-ba', 'porto-alegre-rs', 'manaus-am'];
const nascer = (s: number) => criarVida({ nome: 'Ana', sobrenome: 'Souza', genero: s % 2 ? 'feminino' : 'masculino', municipioId: CIDADES[s % 6], semente: s });
const media = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 100) / 100 : 0);
const pct = (xs: boolean[]) => `${Math.round(xs.filter(Boolean).length / Math.max(1, xs.length) * 100)}%`;
const R = (id: string, nivel: 1 | 2 | 3 = 1): Acao => ({ tipo: 'rotina', id, ativa: true, nivel });

interface Jogador {
  acoes?: (v: Vida, r: Rng) => Acao[];
  /** Como responde às decisões: id preferido por situação. */
  prefere?: (situacao: string) => string | undefined;
  /** Chamados das pessoas: sim / não / aleatório / ignora. */
  chamados?: 'sim' | 'nao' | 'aleatorio' | 'ignora';
  /** Contador de momentos por situação. */
  conta?: Record<string, number>;
}

function responder(v: Vida, r: Rng, j: Jogador): Vida {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const m = v.momento;
    if (j.conta) j.conta[m.situacaoId] = (j.conta[m.situacaoId] ?? 0) + 1;
    const livres = m.opcoes.filter(o => !o.bloqueio);
    // A preferência pode ser uma lista em ordem ("renovar|descer|mercado"): a primeira livre vale.
    const prefs = (j.prefere?.(m.situacaoId) ?? '').split('|').filter(Boolean);
    const o = prefs.map(pf => livres.find(x => x.id === pf || x.id.startsWith(pf))).find(Boolean) || r.pick(livres.length ? livres : m.opcoes);
    v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida;
  }
  return v;
}
function tentar(v: Vida, r: Rng, j: Jogador, a: Acao): Vida {
  if (v.morte || v.momento) return v;
  try { if (!podeTentar(disponibilidade(v, a))) return v; } catch { return v; }
  return responder(executar(v, a).vida, r, j);
}
function viverAno(v: Vida, r: Rng, j: Jogador): Vida {
  if (j.chamados && j.chamados !== 'ignora') for (const { p, vin } of vinculosVivos(v)) {
    if (!vin.chamado) continue;
    const sim = j.chamados === 'sim' || (j.chamados === 'aleatorio' && r.chance(0.55));
    v = tentar(v, r, j, { tipo: 'pessoa', pessoaId: p.id, interacao: sim ? 'chamado_sim' : 'chamado_nao' });
  }
  for (const a of j.acoes?.(v, r) ?? []) v = tentar(v, r, j, a);
  return responder(avancarAno(v).vida, r, j);
}

/* ================================================================ Política */

function politica() {
  const grupos: Record<string, { convite: boolean[]; entrou: boolean[]; filiou: boolean[]; candidato: boolean[]; eleito: boolean[]; convites: number[]; disputas: number[]; vitorias: number[] }> = {};
  const origens: Record<string, string[]> = {};
  const primeiras: Record<string, [number, number]> = {};
  const P = (oque: string): Acao => ({ tipo: 'politica', oque } as unknown as Acao);
  const jogadores: Record<string, (conta: Record<string, number>) => Jogador> = {
    'A sem intenção nem contexto (atividades ao acaso, sem voluntariado/grêmio)': conta => ({ conta, chamados: 'aleatorio', acoes: (v, r) => (r.chance(0.3) ? [R(r.pick(ROTINAS.filter(x => !['voluntariado', 'gremio'].includes(x.id))).id)] : []), prefere: s => (s === 'pol_convite' ? 'nao' : undefined) }),
    'A2 sem intenção, com contexto comunitário (voluntariado desde os 18)': conta => ({ conta, chamados: 'aleatorio', acoes: (v, r) => [...(idade(v) >= 18 ? [R('voluntariado')] : []), ...(r.chance(0.3) ? [R(r.pick(ROTINAS).id)] : [])], prefere: s => (s === 'pol_convite' ? 'nao' : undefined) }),
    'A3 contexto comunitário que aceita o convite (sem campanha deliberada)': conta => ({ conta, chamados: 'aleatorio', acoes: (v, r) => [...(idade(v) >= 18 ? [R('voluntariado')] : []), ...(r.chance(0.3) ? [R(r.pick(ROTINAS).id)] : [])], prefere: s => (s === 'pol_convite' ? 'entrar' : undefined) }),
    'B perseguindo política desde os 20': conta => ({ conta, chamados: 'aleatorio', acoes: v => (idade(v) >= 20 ? [P('aproximar'), P('filiar'), P('comunidade'), P('bandeira'), P('candidatura'), P('prioridade')] : []),
      prefere: s => (s === 'pol_convite' ? 'entrar' : s === 'pol_aproximar' ? 'bairro' : s === 'pol_filiacao' ? 'p0' : s === 'pol_eleicao' ? 'cargo_vereador' : undefined) })
  };
  for (const [nome, fab] of Object.entries(jogadores)) {
    const g = grupos[nome] = { convite: [], entrou: [], filiou: [], candidato: [], eleito: [], convites: [], disputas: [], vitorias: [] };
    for (let s = 1; s <= N; s++) {
      const conta: Record<string, number> = {};
      const j = fab(conta);
      const r = criarRng(s * 7919);
      let v = nascer(s);
      while (!v.morte && idade(v) < 60) v = viverAno(v, r, j);
      const p = v.caminhos.politica;
      g.convites.push(conta['pol_convite'] ?? 0);
      if (conta['pol_convite']) origens[nome] = [...(origens[nome] ?? []), String(v.fatos['pol_origem'])];
      g.convite.push((conta['pol_convite'] ?? 0) > 0);
      g.entrou.push(!!p);
      g.filiou.push(!!p?.partido || !!p?.partidos?.length);
      g.candidato.push(!!p?.historico.length || !!p?.campanha);
      g.eleito.push(!!p?.historico.some(h => h.resultado === 'eleito'));
      const disp = (p?.historico ?? []).filter(h => h.resultado === 'eleito' || h.resultado === 'derrotado');
      g.disputas.push(disp.length); g.vitorias.push(disp.filter(h => h.resultado === 'eleito').length);
      if (disp.length) { primeiras[nome] = primeiras[nome] ?? [0, 0]; primeiras[nome][0]++; if (disp[0].resultado === 'eleito') primeiras[nome][1]++; }
    }
  }
  console.log('\n## Política (até 60 anos)');
  console.log('| grupo | recebeu convite | convites/vida | entrou | filiou | candidatou | elegeu | disputas/vida | vitória por disputa |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const [k, g] of Object.entries(grupos)) { const d = g.disputas.reduce((a, b) => a + b, 0); const w = g.vitorias.reduce((a, b) => a + b, 0); console.log(`| ${k} | ${pct(g.convite)} | ${media(g.convites)} | ${pct(g.entrou)} | ${pct(g.filiou)} | ${pct(g.candidato)} | ${pct(g.eleito)} | ${media(g.disputas)} | ${d ? Math.round(w / d * 100) + '%' : '—'} |`); }
  for (const [k, [n, w]] of Object.entries(primeiras)) console.log(`- primeira disputa (${k.split(' ')[0]}): ${w}/${n} eleitos`);
  const ORIG = ['comunidade', 'estudantil', 'sindicato', 'causa', 'notoriedade', 'empresario', 'servidor', 'convite', 'decisao'];
  for (const [k, o] of Object.entries(origens)) { const f = new Map<string, number>(); for (const x of o) f.set(ORIG[Number(x)] ?? x, (f.get(ORIG[Number(x)] ?? x) ?? 0) + 1); console.log(`- origem do convite (${k.split(' ')[0]}): ${[...f].map(([a, b]) => `${a} ${b}`).join(', ')}`); }
}

/* ================================================================ Amizades */

function amizades() {
  const IDADES = [12, 18, 25, 35, 45, 60];
  const jogadores: Record<string, Jogador> = {
    passivo: { chamados: 'ignora', acoes: (v, r) => (r.chance(0.3) ? [R(r.pick(ROTINAS).id)] : []) },
    tipico: { chamados: 'aleatorio', acoes: (v, r) => [...(r.chance(0.3) ? [R(r.pick(ROTINAS).id)] : []), ...vinculosVivos(v).filter(x => !x.vin.parentesco && x.vin.convivio.length && (x.vin.estagio === 'colega' || x.vin.estagio === 'conhecido') && r.chance(0.15)).slice(0, 2).map(x => ({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'aproximar' } as Acao))] },
    sociavel: { chamados: 'sim', acoes: v => [R('voluntariado'), ...vinculosVivos(v).filter(x => !x.vin.parentesco && !x.p.especie && x.vin.convivio.length && (x.vin.estagio === 'colega' || x.vin.estagio === 'conhecido')).slice(0, 3).map(x => ({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'aproximar' } as Acao)),
      ...vinculosVivos(v).filter(x => !x.vin.parentesco && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo')).slice(0, 3).map(x => ({ tipo: 'pessoa', pessoaId: x.p.id, interacao: interacoesPara(v, x.p.id).some(i => i.id === 'aprofundar') ? 'aprofundar' : 'tempo' } as Acao))] }
  };
  console.log('\n## Amizades (média por vida, sem família; conhecido · colega · amigo · próximo · afastado)');
  console.log(`| jogador | ${IDADES.join(' | ')} |`);
  console.log(`| --- | ${IDADES.map(() => '---').join(' | ')} |`);
  for (const [nome, j] of Object.entries(jogadores)) {
    const soma: Record<number, number[]> = {};
    const cont: Record<number, number> = {};
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 104729);
      let v = nascer(s);
      while (!v.morte && idade(v) < 61) {
        v = viverAno(v, r, j);
        const i = idade(v);
        if (IDADES.includes(i)) {
          const c = [0, 0, 0, 0, 0];
          for (const { p, vin } of vinculosVivos(v)) { if (p.especie || vin.parentesco || vin.romance) continue; const k = { conhecido: 0, colega: 1, amigo: 2, amigo_proximo: 3, afastado: 4 }[vin.estagio ?? 'conhecido']; c[k]++; }
          soma[i] = (soma[i] ?? [0, 0, 0, 0, 0]).map((x, k) => x + c[k]);
          cont[i] = (cont[i] ?? 0) + 1;
        }
      }
    }
    console.log(`| ${nome} | ${IDADES.map(i => (soma[i] ?? [0, 0, 0, 0, 0]).map(x => (x / (cont[i] || 1)).toFixed(1)).join(' · ')).join(' | ')} |`);
  }
}

/* ================================================================ Esporte */

function esporte() {
  const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);
  const grupos: Record<string, Jogador> = {
    'A treina a sério desde os 7 e pede teste': { acoes: v => (idade(v) >= 7 && idade(v) <= 20 && !v.caminhos.esporte ? [R('futebol', 3), R('futebol', idade(v) >= 9 ? 2 : 1), ...(idade(v) >= 12 && (lerTecnica(v, 'futebol').nivel >= 3 || idade(v) >= 16) ? [P('pedir_teste', 'futebol')] : [])] : []), prefere: s => (s === 'esp_base' ? 'aceitar' : s === 'esp_contrato' ? 'assinar' : s.startsWith('comp_') ? undefined : s === 'esp_renovacao' ? 'renovar' : undefined) },
    'B mesma vida, bola só por diversão': { acoes: v => (idade(v) >= 7 && idade(v) <= 20 ? [R('futebol', 1)] : []) }
  };
  console.log('\n## Esporte — trajetória (até 24 anos)');
  console.log('| grupo | técnica aos 16 | peneiras | chegou à base | virou profissional |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const [nome, j] of Object.entries(grupos)) {
    const tec: number[] = []; const pen: number[] = []; const base: boolean[] = []; const pro: boolean[] = [];
    for (let s = 1; s <= N; s++) {
      const r = criarRng(s * 31337);
      let v = nascer(s);
      let foiBase = false;
      while (!v.morte && idade(v) < 24) { v = viverAno(v, r, j); if (idade(v) === 16) tec.push(v.caminhos.frentes.futebol?.habilidade ?? 0); if (v.caminhos.esporte) foiBase = true; }
      pen.push(v.fatos['peneiras_futebol'] ?? 0); base.push(foiBase); pro.push(v.fatos['atleta_profissional'] !== undefined);
    }
    console.log(`| ${nome} | ${media(tec)} | ${media(pen)} | ${pct(base)} | ${pct(pro)} |`);
  }

  // A carreira profissional vivida até o fim (começa como nos testes: técnica 76–86, contrato aos 20).
  const fins: Record<string, number> = {}; const dur: number[] = []; const idadeFim: number[] = []; const les: number[] = []; const graves: number[] = []; const temps: number[] = [];
  const topoNivel: number[] = []; const salTitA: number[] = []; const salResB: number[] = []; const salTit1: number[] = []; const notoPico: number[] = []; const semClube: boolean[] = []; const seguiuAposAuge: boolean[] = [];
  const conta: Record<string, number> = {};
  for (let s = 1; s <= N; s++) {
    const r = criarRng(s * 4099);
    let v = nascer(s);
    while (!v.morte && idade(v) < 20) v = avancarAno(v).vida, v.momento = null;
    v.caminhos.pendente = undefined; v.trabalho.atual = undefined; v.educacao.basica = undefined; v.educacao.matricula = undefined;
    const h = 76 + (s % 11);
    v = transacao(v, x => { garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = h; f.interesse = 90; f.meses = 120; f.auge = h; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Esporte Clube Teste'); profissionalizar(x, criarRng(s), h >= 84 ? 3 : 2); }).vida;
    const inicio = idade(v);
    let aposAuge = false;
    const j: Jogador = { conta, prefere: sit => (sit === 'esp_renovacao' ? (s % 3 === 0 ? 'mercado' : 'renovar|descer|mercado') : sit === 'esp_proposta' ? 'aceitar' : sit === 'sau_lesao' ? (s % 4 === 0 ? 'sacrificio' : s % 4 === 1 ? 'repouso' : 'fisio') : sit === 'esp_posicao' ? undefined : sit === 'noto_convite' ? 'aceitar' : undefined), acoes: vv => (vv.caminhos.esporte?.espaco === 'reserva' ? [{ tipo: 'profissao', oque: 'treinador' } as unknown as Acao] : []) };
    let topo = 1;
    while (!v.morte && v.caminhos.esporte?.fase === 'profissional' && idade(v) < 48) {
      v = viverAno(v, r, j);
      const e = v.caminhos.esporte;
      if (!e) break;
      topo = Math.max(topo, e.nivel);
      const sal = v.trabalho.atual?.salario;
      if (sal && e.nivel === 4 && e.espaco === 'titular') salTitA.push(sal);
      if (sal && e.nivel === 2 && e.espaco === 'reserva') salResB.push(sal);
      if (sal && e.nivel === 1 && e.espaco === 'titular') salTit1.push(sal);
      if (v.fatos['esp_sem_clube'] !== undefined) semClube[s] = true;
      if (e.fase === 'profissional' && idade(v) > 32) aposAuge = true;
    }
    const e = v.caminhos.esporte!;
    fins[e.motivoFim ?? (v.morte ? 'morte' : 'ainda jogando')] = (fins[e.motivoFim ?? (v.morte ? 'morte' : 'ainda jogando')] ?? 0) + 1;
    dur.push((e.tFim ?? v.t) / 12 - (v.eu.tNasc / 12) - inicio);
    idadeFim.push(Math.floor(((e.tFim ?? v.t) - v.eu.tNasc) / 12));
    les.push(e.lesoes); graves.push(v.biografia.filter(x => /lesão grave/.test(x.texto)).length); temps.push(e.temporadas?.length ?? 0);
    topoNivel.push(topo); notoPico.push(v.notoriedade?.pico ?? 0); seguiuAposAuge.push(aposAuge);
  }
  console.log('\n## Esporte — carreira profissional vivida até o fim');
  console.log(`- duração média: ${media(dur)} anos; idade no fim: média ${media(idadeFim)}, mín ${Math.min(...idadeFim)}, máx ${Math.max(...idadeFim)}`);
  console.log(`- como acabou: ${Object.entries(fins).map(([k, x]) => `${k} ${x}`).join(', ')}`);
  console.log(`- jogou depois dos 32: ${pct(seguiuAposAuge)}; passou por "sem clube": ${semClube.filter(Boolean).length} vidas`);
  console.log(`- lesões por carreira: ${media(les)} (graves: ${media(graves)}); temporadas registradas: ${media(temps)}`);
  console.log(`- maior divisão alcançada: ${media(topoNivel)} (4 = elite)`);
  console.log(`- salário mensal bruto — titular da elite: ${media(salTitA)}; reserva da divisão de acesso: ${media(salResB)}; titular do estadual: ${media(salTit1)}`);
  console.log(`- notoriedade (pico): média ${media(notoPico)}; ≥55 (famoso): ${notoPico.filter(x => x >= 55).length}/${N}`);
  console.log(`- decisões da carreira: ${Object.entries(conta).filter(([k]) => /^esp_|^sau_lesao|^noto_/.test(k)).map(([k, x]) => `${k} ${x}`).join(', ')}`);
}

/* ================================================================ Sobrecarga */

function sobrecarga() {
  const grupos: Record<string, Jogador> = {
    'leve (um trabalho, nada mais)': {},
    'carregada (trabalho integral + horas extras + faculdade integral)': { acoes: v => (idade(v) >= 20 ? [{ tipo: 'horas_extras' } as Acao, R('academia')] : []) },
    'carregada que alivia quando a vida pergunta': { acoes: v => (idade(v) >= 20 ? [{ tipo: 'horas_extras' } as Acao, R('academia')] : []) }
  };
  console.log('\n## Sobrecarga (dos 20 aos 40)');
  console.log('| grupo | anos sobrecarregado (máx) | saúde aos 40 | bem-estar aos 40 | cabeça aos 40 | desempenho no trabalho | perguntas "a semana não fecha" |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const [nome, j0] of Object.entries(grupos)) {
    const sob: number[] = []; const sau: number[] = []; const bem: number[] = []; const cab: number[] = []; const des: number[] = []; const perg: number[] = [];
    for (let s = 1; s <= N; s++) {
      const conta: Record<string, number> = {};
      const j: Jogador = { ...j0, conta, prefere: sit => (sit === 'sob_semana' ? (nome.includes('alivia') ? 'descansar' : 'seguir') : undefined) };
      const r = criarRng(s * 7);
      let v = nascer(s);
      while (!v.morte && idade(v) < 20) v = viverAno(v, r, {});
      if (v.morte) continue;
      v = transacao(v, x => { x.caminhos.pendente = undefined; contratar(x, criarRng(s), ocupacao('assistente_adm')); if (nome.startsWith('carregada')) x.educacao.matricula = { cursoId: 'medicina', instituicao: 'Faculdade', rede: 'privada', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 240, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId }; }).vida;
      let maxSob = 0;
      while (!v.morte && idade(v) < 40) { v = viverAno(v, r, j); maxSob = Math.max(maxSob, v.mente.sobrecarga?.anos ?? 0); if (!v.trabalho.atual) v = transacao(v, x => { contratar(x, criarRng(s + x.t), ocupacao('assistente_adm')); }).vida; }
      if (v.morte) continue;
      sob.push(maxSob); sau.push(v.corpo.saude); bem.push(v.mente.felicidade); cab.push(v.mente.estresse); des.push(v.trabalho.atual?.desempenho ?? 0); perg.push(conta['sob_semana'] ?? 0);
    }
    console.log(`| ${nome} | ${media(sob)} | ${media(sau)} | ${media(bem)} | ${media(cab)} | ${media(des)} | ${media(perg)} |`);
  }
}

/* ================================================================ Carreiras */

function carreiras() {
  type C = { nome: string; montar: (v: Vida, s: number) => Vida; filtro: RegExp; acoes?: (v: Vida) => Acao[] };
  const P = (oque: string, valor?: string) => ({ tipo: 'profissao', oque, valor } as unknown as Acao);
  const casos: C[] = [
    { nome: 'profissão comum (advogada)', filtro: /^ofi_|^trab_|^adu_chefe|^adu_colega|^adu_proposta|^neg_abrir/, montar: (v, s) => transacao(v, x => { x.educacao.concluidos.push({ cursoId: 'direito', nome: 'Direito', nivel: 'superior', area: 'direito', tFim: x.t - 12, instituicao: 'x' }); x.educacao.escolaridade = 'superior'; x.trabalho.licencas.push('oab'); contratar(x, criarRng(s), ocupacao('advogado_jr')); }).vida },
    { nome: 'profissão comum (dentista)', filtro: /^ofi_|^trab_|^neg_/, montar: (v, s) => transacao(v, x => { x.educacao.concluidos.push({ cursoId: 'odontologia', nome: 'Odontologia', nivel: 'superior', area: 'odontologia', tFim: x.t - 12, instituicao: 'x' }); x.educacao.escolaridade = 'superior'; x.trabalho.licencas.push('cro'); contratar(x, criarRng(s), ocupacao('dentista')); }).vida },
    { nome: 'arte (música, lança trabalhos)', filtro: /^arte_|^noto_/, acoes: () => [P('lancar'), P('estrada')], montar: (v, s) => transacao(v, x => { garantirFrente(x, 'musica'); const f = x.caminhos.frentes.musica!; f.habilidade = 70 + (s % 15); f.meses = 120; x.rotinas.push({ id: 'musica', tInicio: x.t, nivel: 3 }); contratar(x, criarRng(s), ocupacao('musico_noite')); }).vida },
    { nome: 'esporte (profissional)', filtro: /^esp_|^sau_lesao|^noto_/, montar: (v, s) => transacao(v, x => { garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = 78 + (s % 8); f.meses = 120; f.interesse = 90; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Esporte Clube Teste'); profissionalizar(x, criarRng(s), 2); }).vida },
    { nome: 'política (perseguindo)', filtro: /^pol_/, acoes: () => ['aproximar', 'filiar', 'comunidade', 'bandeira', 'candidatura', 'prioridade'].map(o => ({ tipo: 'politica', oque: o } as unknown as Acao)), montar: v => v },
    { nome: 'negócio (lanchonete)', filtro: /^neg|^adu_negocio/, montar: (v, s) => { v.financas.conta = 60000; return executar(transacao(v, x => { x.trabalho.experiencia['alimentacao'] = 48; void s; }).vida, { tipo: 'abrir_negocio', negocio: 'lanchonete' }).vida; } }
  ];
  console.log('\n## Carreiras — 10 anos a partir dos 24 (média por vida)');
  console.log('| carreira | decisões da carreira | tipos distintos | decisões/ano | ações de carreira à mão | estado próprio ao fim |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const c of casos) {
    const tot: number[] = []; const tipos: number[] = []; const estado: string[] = []; const acoes: number[] = [];
    for (let s = 1; s <= Math.min(N, 24); s++) {
      const conta: Record<string, number> = {};
      const r = criarRng(s * 999);
      let v = nascer(s);
      while (!v.morte && idade(v) < 24) v = avancarAno(v).vida, v.momento = null;
      if (v.morte) continue;
      v.caminhos.pendente = undefined; v.trabalho.atual = undefined; v.educacao.matricula = undefined; v.caminhos.esporte = undefined; v.caminhos.politica = undefined; v.caminhos.negocio = undefined;
      v = responder(c.montar(v, s), r, { conta: {}, prefere: sit => (sit === 'neg_abrir' ? 'guardado' : undefined) });
      const j: Jogador = { conta, chamados: 'aleatorio', acoes: c.acoes, prefere: sit => (sit === 'pol_convite' ? 'entrar' : sit === 'pol_aproximar' ? 'bairro' : sit === 'pol_filiacao' ? 'p0' : sit === 'esp_renovacao' ? 'renovar' : sit === 'ofi_desafio' ? 'encarar' : undefined) };
      for (let k = 0; k < 10 && !v.morte; k++) v = viverAno(v, r, j);
      const n = Object.entries(conta).filter(([k]) => c.filtro.test(k));
      tot.push(n.reduce((a, [, x]) => a + x, 0)); tipos.push(n.length);
      if (!v.morte) { const a = acoesDoTrabalho(v, disponibilidade); acoes.push(a.agora.length + a.mais.length); }
      const e = v.trabalho.atual;
      estado.push(c.nome.startsWith('esporte') ? `${v.caminhos.esporte?.temporadas?.length ?? 0} temporadas` : c.nome.startsWith('arte') ? `${v.caminhos.obras?.length ?? 0} obras` : c.nome.startsWith('política') ? (v.caminhos.politica?.fase ?? '—') : c.nome.startsWith('negócio') ? (v.caminhos.negocio?.estado ?? '—') : `${e?.especialidade ? 'com área' : 'generalista'}, ${e?.feitos ?? 0} feitos, ${e?.contrato ?? '—'}`);
    }
    const freq = new Map<string, number>(); for (const x of estado) freq.set(x.replace(/\d+ (temporadas|obras|feitos)/, m => m), (freq.get(x) ?? 0) + 1);
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, x]) => `${k} (${x})`).join('; ');
    console.log(`| ${c.nome} | ${media(tot)} | ${media(tipos)} | ${media(tot.map(x => x / 10))} | ${media(acoes)} | ${top} |`);
  }
}

/* ================================================================ Economia */

const q = (xs: number[], p: number) => { const o = [...xs].sort((a, b) => a - b); return o.length ? o[Math.min(o.length - 1, Math.floor(p * o.length))] : 0; };
const fx = (xs: number[]) => (xs.length ? `mediana ${q(xs, 0.5).toLocaleString('pt-BR')} · p10 ${q(xs, 0.1).toLocaleString('pt-BR')} · p90 ${q(xs, 0.9).toLocaleString('pt-BR')} · máx ${Math.max(...xs).toLocaleString('pt-BR')} (n=${xs.length})` : '—');

function economia() {
  // Futebol: carreiras vividas até o fim; cada ano contratado vira uma observação na sua categoria.
  const cat: Record<string, number[]> = { 'baixa (estadual/acesso) · reserva': [], 'baixa (estadual/acesso) · titular': [], 'elite · reserva': [], 'elite · titular': [], 'elite · estrela (rep ≥ 78, fama ≥ 60)': [] };
  const img: number[] = []; const anual: number[] = []; const semClubeAnos: number[] = [];
  const casosTopo: string[] = [];
  for (let s = 1; s <= N * 2; s++) {
    const r = criarRng(s * 5003);
    let v = nascer(s);
    while (!v.morte && idade(v) < 19) v = avancarAno(v).vida, v.momento = null;
    v.caminhos.pendente = undefined; v.trabalho.atual = undefined; v.educacao.basica = undefined; v.educacao.matricula = undefined;
    const h = 72 + (s % 19);
    v = transacao(v, x => { garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = h; f.interesse = 90; f.meses = 120; f.auge = h; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Esporte Clube Teste'); profissionalizar(x, criarRng(s), h >= 86 ? 4 : h >= 80 ? 3 : 2); }).vida;
    const j: Jogador = { chamados: 'aleatorio', prefere: sit => (sit === 'esp_renovacao' ? 'renovar|descer|mercado' : sit === 'esp_proposta' ? 'aceitar' : sit === 'sau_lesao' ? 'fisio' : sit === 'noto_convite' ? 'aceitar' : undefined) };
    let semClube = 0;
    while (!v.morte && v.caminhos.esporte?.fase === 'profissional' && idade(v) < 44) {
      v = viverAno(v, r, j);
      const e = v.caminhos.esporte;
      const emp = v.trabalho.atual;
      if (!e || e.fase !== 'profissional') break;
      if (!emp || emp.ocupacaoId !== 'jogador_futebol') { semClube++; continue; }
      const noto = v.notoriedade?.valor ?? 0;
      const k = e.nivel >= 4 ? ((e.reputacao ?? 0) >= 78 && noto >= 60 ? 'elite · estrela (rep ≥ 78, fama ≥ 60)' : e.espaco === 'titular' ? 'elite · titular' : 'elite · reserva') : e.nivel <= 2 ? `baixa (estadual/acesso) · ${e.espaco === 'titular' ? 'titular' : 'reserva'}` : '';
      if (k) cat[k].push(emp.salario);
      if (emp.salario >= 400000) casosTopo.push(`${emp.salario.toLocaleString('pt-BR')}: ${idade(v)} anos, rep ${e.reputacao}, fama ${Math.round(noto)}, ${e.clube}, nota ${e.temporadas?.slice(-1)[0]?.nota}`);
      const im = rendaDeImagem(v); if (im) img.push(im);
      anual.push(remuneracaoDe(emp).bruto * 12);
    }
    semClubeAnos.push(semClube);
  }
  console.log('\n## Economia do futebol (salário bruto mensal do contrato, por ano contratado)');
  for (const [k, xs] of Object.entries(cat)) console.log(`- ${k}: ${fx(xs)}`);
  console.log(`- patrocínio/imagem (à parte do salário), quando há: ${fx(img)}`);
  console.log(`- anos "sem clube" por carreira: média ${media(semClubeAnos)}; carreiras com algum: ${semClubeAnos.filter(x => x > 0).length}/${semClubeAnos.length}`);
  console.log(`- casos ≥ R$ 400 mil/mês: ${casosTopo.length ? casosTopo.slice(0, 6).join(' | ') : 'nenhum'}`);

  // Palco (música): tiers por alcance construído; cada tier vive 6 anos; mede-se valor contratado, custos, cachê do artista, imagem.
  const tiers: [string, number, number, number][] = [['iniciante', 30, 8, 0], ['regional/em ascensão', 60, 35, 0], ['reconhecido', 75, 55, 35], ['famoso', 86, 75, 70], ['excepcional', 95, 95, 96]];
  console.log('\n## Economia do palco (música)');
  console.log('| perfil | cachê contratado por show | shows/ano | custos/ano | cachê do artista/ano | anos sem show | patrocínio/mês |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const [nome, hab, publico, noto] of tiers) {
    const cache: number[] = []; const shows: number[] = []; const custos: number[] = []; const artista: number[] = []; const imagem: number[] = []; let vazios = 0; let anos = 0;
    for (let s = 1; s <= N; s++) {
      let v = transacao(nascer(s), x => { x.t += 12 * 28; }).vida;
      v = transacao(v, x => {
        garantirFrente(x, 'musica'); x.caminhos.frentes.musica!.habilidade = hab;
        x.rotinas = [{ id: 'musica', tInicio: x.t, nivel: 3 }];
        x.caminhos.arte = { linguagem: 'musica', nome: 'Maré', tipo: 'banda', tInicio: x.t - 60, publico, membros: [], ativo: true };
        contratar(x, criarRng(s), ocupacao(publico >= 55 ? 'musico_profissional' : 'musico_noite')); x.trabalho.atual!.clientela = publico;
        if (noto) x.notoriedade = { valor: noto, pico: noto, fonte: 'arte', t: x.t };
      }).vida;
      for (let k = 0; k < 6; k++) {
        v = transacao(v, (x, r) => { x.t += 12; x.caminhos.arte!.publico = clamp(publico + r.normal() * 8, 0, 100); temporadaDePalco(x, criarRng(s * 31 + k)); }).vida;
        const p = v.caminhos.palco!; anos++;
        if (!p.apresentacoes) vazios++;
        if (p.apresentacoes) { cache.push(p.cacheMedio); shows.push(p.apresentacoes); custos.push(p.custos); artista.push(p.artista); }
        const im = rendaDeImagem(v); if (im) imagem.push(im);
        void r0;
      }
    }
    console.log(`| ${nome} | ${fx(cache).split(' · ')[0].replace('mediana ', '')} (p90 ${q(cache, 0.9).toLocaleString('pt-BR')}) | ${q(shows, 0.5)} (${q(shows, 0.1)}–${q(shows, 0.9)}) | ${q(custos, 0.5).toLocaleString('pt-BR')} | ${q(artista, 0.5).toLocaleString('pt-BR')} (${q(artista, 0.1).toLocaleString('pt-BR')}–${q(artista, 0.9).toLocaleString('pt-BR')}) | ${Math.round(vazios / anos * 100)}% | ${imagem.length ? q(imagem, 0.5).toLocaleString('pt-BR') : '—'} |`);
  }
}
const r0 = 0;

const quais = (process.env.PARTES ?? 'politica,amizades,esporte,sobrecarga,carreiras').split(',');
if (quais.includes('politica')) politica();
if (quais.includes('amizades')) amizades();
if (quais.includes('esporte')) esporte();
if (quais.includes('sobrecarga')) sobrecarga();
if (quais.includes('carreiras')) carreiras();
if (quais.includes('economia')) economia();
