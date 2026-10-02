/**
 * A pessoa: predisposição → prática → atributo.
 *
 * Cinco dimensões legíveis, cada uma com UMA fonte de verdade no estado:
 *
 *   Saúde           corpo.saude        (deriva anual: `estado.fatoresSaude`)
 *   Bem-estar       mente.felicidade   (equilíbrio anual: `estado.fatoresHumor`)
 *   Aprendizado     mente.cognicao     (aqui: leitura e estudo, devagar)
 *   Aparência       corpo.aparencia    (aqui: a base de nascença + o momento)
 *   Condicionamento corpo.forma        (aqui: o treino da semana, com teto)
 *
 * E três camadas que a vida real separa:
 *
 *   PREDISPOSIÇÃO  facilidade de nascença, da semente (`v.predisposicoes`).
 *                  Muda a velocidade e o teto plausível; nunca substitui prática.
 *   ATRIBUTO       o estado atual (condicionamento, aprendizado): sobe com o
 *                  que se faz, cai quando para, com retornos decrescentes.
 *   HABILIDADE     o que se aprendeu fazendo (técnica de futebol, violão):
 *                  mora nas frentes (`sistemas/frentes`) e só a prática
 *                  ESPECÍFICA a desenvolve. Academia não ensina futebol.
 *
 * Cada dimensão tem causas com nome (`fatores*`) — a mesma lista que a tela
 * "Você" mostra como o que ajuda e o que pesa — e consumidores reais
 * (`CONSUMIDORES`), ditos em palavras.
 *
 * O desenvolvimento do ano (`desenvolverPessoa`) roda ANTES do corpo e da
 * escola: o treino e a leitura do ano valem no mesmo ano (antes, a forma
 * da academia só chegava à saúde no ano seguinte).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Vida } from '../tipos';
import { predisposicao } from './predisposicao';
import type { Fator } from './estado';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { nivelDa } from './rotinas';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { fatorDeTreino, lesaoAtiva, pesoNoCondicionamento } from './lesoes';

/* ---------------------------------------------------------- Predisposições */

export { derivarPredisposicoes, predisposicao, type Eixo } from './predisposicao';

/** A aparência de nascença: em saves antigos, a própria aparência de hoje. */
export const aparenciaBase = (v: Vida) => v.corpo.aparenciaBase ?? v.corpo.aparencia;

/* ---------------------------------------------------------- Condicionamento */

/**
 * O esforço físico da semana, por atividade (e por intensidade). Uma
 * sessão de academia três vezes por semana vale 1; o treino de base, quase
 * todo dia, vale mais. Trabalho braçal e farda também contam um pouco.
 */
const CARGA: Record<string, number[]> = {
  academia: [1], corrida: [0.6], futebol: [0.45, 0.85, 1.3], volei: [0.4, 0.8, 1.2], natacao: [0.8, 1.05, 1.35],
  atletismo: [0.5, 0.9, 1.3], lutas: [0.8, 1.1], basquete: [0.45, 0.85, 1.25], tenis: [0.5, 0.9, 1.25], danca: [0.55, 0.85], bico: [0.15],
  // O time da escola e a atlética treinam de verdade (antes não contavam para o corpo).
  time_escola: [0.5], atletica: [0.45]
};
/** O que não é treino do corpo (é trabalho avulso): a lesão não o tira da semana. */
const NAO_E_TREINO = new Set(['bico']);
/** A modalidade, para dizer de qual base é o treino. */
const NOME_MODALIDADE: Record<string, string> = { futebol: 'futebol', volei: 'vôlei', basquete: 'basquete', tenis: 'tênis', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta' };
const NOME_CARGA: Record<string, string> = {
  academia: 'a academia', corrida: 'correr', futebol: 'o futebol', volei: 'o vôlei', natacao: 'a natação', atletismo: 'o atletismo',
  lutas: 'a luta', basquete: 'o basquete', tenis: 'o tênis', danca: 'a dança', bico: 'os bicos', time_escola: 'o time da escola', atletica: 'a atlética', farda: 'o treino da farda', obra: 'o trabalho pesado', profissional: 'o treino de atleta'
};
const TRABALHO_PESADO = new Set(['construcao', 'agro', 'campo', 'pesca', 'limpeza', 'logistica', 'reciclagem', 'marcenaria']);
const FARDA = new Set(['pm', 'pm_oficial', 'bombeiro', 'exercito_oficial', 'exercito_sargento', 'exercito', 'marinha', 'aeronautica', 'militar', 'policia_civil']);

export interface Estimulo { total: number; fontes: { id: string; texto: string; carga: number }[] }

export function estimuloFisico(v: Vida): Estimulo {
  const fontes: Estimulo['fontes'] = [];
  const e = v.caminhos.esporte;
  const pro = e?.fase === 'profissional' ? e.modalidade : undefined;
  const base = e?.fase === 'base' ? e.modalidade : undefined;
  // A lesão tira dos treinos de QUALQUER um (não só do profissional): a mesma conta do clube (`lesoes.fatorDeTreino`).
  const ft = fatorDeTreino(v);
  for (const r of v.rotinas) {
    const c = CARGA[r.id];
    if (!c) continue;
    // O treino do atleta profissional é do clube (abaixo): a mesma modalidade não conta duas vezes.
    if (r.id === pro) continue;
    const treino = !NAO_E_TREINO.has(r.id);
    // Na base, o treino é o da categoria (quase todo dia), e a tela diz de qual — não "o futebol" do tempo livre.
    const nome = r.id === base ? `o treino de base de ${NOME_MODALIDADE[r.id] ?? r.id}` : NOME_CARGA[r.id] ?? r.id;
    fontes.push({ id: r.id, texto: nome, carga: c[Math.min(c.length, nivelDa(r)) - 1] * (treino ? ft : 1) });
  }
  // O treino do clube, quase todo dia: é trabalho, e o corpo conta — menos quando a lesão tira dos treinos.
  if (pro && !e!.suspensoAte) fontes.push({ id: 'profissional', texto: NOME_CARGA.profissional, carga: (e!.foco === 'forcar' ? 1.5 : e!.foco === 'preservar' ? 1.15 : 1.35) * ft });
  const oc = v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId) : undefined;
  if (oc && FARDA.has(oc.trilha)) fontes.push({ id: 'farda', texto: NOME_CARGA.farda, carga: 0.5 });
  else if (oc && TRABALHO_PESADO.has(oc.trilha)) fontes.push({ id: 'obra', texto: NOME_CARGA.obra, carga: 0.35 });
  return { total: fontes.reduce((s, f) => s + f.carga, 0), fontes: fontes.sort((a, b) => b.carga - a.carga) };
}

/** Retornos decrescentes: dobrar o treino não dobra o corpo. */
const efetivo = (est: number) => 1.6 * (1 - Math.exp(-est / 1.1));

/** O corpo do dia a dia, sem exercício (andar, subir escada, brincar). */
export function pisoDeForma(i: number): number {
  // A infância de brincar o dia inteiro vai ficando para trás DEVAGAR (dos 10 aos 15), não num degrau aos 12:
  // antes, o piso caía de 48 para 32 de um ano para o outro, e o garoto que entrava na base aos 12 "vinha
  // piorando" treinando quase todo dia (playtest pós-REWORK 3).
  return i < 10 ? 48 : i < 15 ? Math.round((48 - (i - 9) * (16 / 6)) * 10) / 10 : i < 50 ? 32 : i < 70 ? 25 : 18;
}

/** O piso está caindo por causa da idade (o fim da infância), nesta idade? */
export const infanciaFicandoParaTras = (i: number) => i >= 10 && i < 15;

function tetoDeForma(i: number): number {
  return i < 30 ? 97 : Math.max(50, Math.round(97 - (i - 30) * 0.6));
}

function fatorIdadeTreino(i: number): number {
  // O corpo responde cada vez mais ao treino na adolescência (rampa, sem degrau aos 14).
  return i < 10 ? 0.8 : i < 14 ? 0.8 + (i - 9) * 0.04 : i <= 35 ? 1 : i < 50 ? 0.9 : i < 65 ? 0.8 : 0.65;
}

/**
 * O que puxa o condicionamento (soma = alvo − piso do dia a dia). A
 * predisposição física muda o quanto o treino rende, não substitui o treino:
 * sem exercício, quase não aparece.
 */
export function fatoresCondicionamento(v: Vida): Fator[] {
  const i = idade(v);
  const c = v.corpo;
  const out: Fator[] = [];
  const est = estimuloFisico(v);
  const fis = predisposicao(v, 'fisica');
  if (est.total > 0) {
    const nomes = est.fontes.slice(0, 2).map(f => f.texto);
    // A lesão que tira dos treinos é dita junto do treino (o que sobrou dele), uma vez só.
    const ft = fatorDeTreino(v);
    const comLesao = ft < 0.95 && est.fontes.some(f => !NAO_E_TREINO.has(f.id) && f.id !== 'farda' && f.id !== 'obra') ? (ft <= 0.6 ? ' (bem reduzido pela lesão)' : ' (reduzido pela lesão)') : '';
    out.push({ id: 'treino', texto: (nomes.length > 1 ? `${nomes[0]} e ${nomes[1]}` : nomes[0]) + comLesao, efeito: efetivo(est.total) * 40 * fatorIdadeTreino(i) });
    if (Math.abs(fis) >= 0.25) out.push({ id: 'predisposicao', texto: fis > 0 ? 'um corpo que responde rápido ao treino' : 'um corpo que custa a responder ao treino', efeito: fis * 6 * Math.min(1, est.total) });
  }
  if (i >= 14) {
    if (c.habitos.fuma) out.push({ id: 'fuma', texto: 'o cigarro', efeito: -6 });
    if (c.habitos.bebe === 'muito') out.push({ id: 'bebe', texto: 'a bebida', efeito: -4 });
  }
  if (c.saude < 55) out.push({ id: 'saude', texto: 'a saúde fraca', efeito: -(55 - c.saude) * 0.5 });
  for (const cond of c.condicoes) {
    if (cond.lesao) { out.push({ id: 'condicao:lesao', texto: cond.lesao.cuidado === 'sacrificio' ? `${cond.lesao.parte} (jogando em cima)` : cond.lesao.parte, efeito: pesoNoCondicionamento(cond.lesao) }); continue; }
    const pesa = cond.id === 'coluna' ? (cond.tratando ? -2 : -6)
      : cond.id === 'cancer' ? (cond.tratando ? -6 : -10)
        : cond.id === 'diabetes' && !cond.tratando ? -3
          : cond.id === 'depressao' && !cond.tratando ? -3
            : cond.id === 'lesao' ? -8 : 0;
    if (pesa) out.push({ id: `condicao:${cond.id}`, texto: cond.diagnosticada === false ? 'um incômodo que ainda não tem nome' : cond.nome, efeito: pesa });
  }
  return out.filter(f => Math.abs(f.efeito) >= 0.5);
}

export function alvoCondicionamento(v: Vida): number {
  const i = idade(v);
  const soma = fatoresCondicionamento(v).reduce((s, f) => s + f.efeito, 0);
  return clamp(Math.round(pisoDeForma(i) + soma), 5, tetoDeForma(i));
}

/**
 * Um ano de corpo: o condicionamento anda em direção ao alvo — sobe rápido
 * no começo e devagar perto do topo; sem treino, volta ao do dia a dia.
 */
export function desenvolverCondicionamento(v: Vida, r: Rng): void {
  const i = idade(v);
  const alvo = alvoCondicionamento(v);
  const f = v.corpo.forma;
  const fis = predisposicao(v, 'fisica');
  const vel = alvo > f ? 0.42 * (1 + fis * 0.2) : 0.32;
  v.corpo.forma = clamp(Math.round(f + (alvo - f) * vel + r.normal() * 1.2));
  const est = estimuloFisico(v);
  v.corpo.habitos.sedentario = i >= 12 && est.total < 0.4;
  // Um marco, uma vez: o corpo que mudou de verdade (adulto que saiu do sedentarismo).
  if (i >= 18 && v.corpo.forma >= 72 && f < 72 && (v.fatos['forma_minima_adulto'] ?? 100) < 45 && !temFato(v, 'entrou_em_forma')) {
    marcarFato(v, 'entrou_em_forma');
    escrever(v, { texto: `${est.fontes[0] ? cap(est.fontes[0].texto) : 'O exercício'} mudou o corpo: o fôlego de hoje não é o de antes.`, relevancia: 'biografia', tema: 'saude', tom: 'bom' });
  }
  if (i >= 18) v.fatos['forma_minima_adulto'] = Math.min(v.fatos['forma_minima_adulto'] ?? 100, v.corpo.forma);
}

/* ------------------------------------------------------------- Aprendizado */

/**
 * O que exercita a cabeça de um jeito geral (ler, xadrez, faculdade). Não
 * é "inteligência universal": sobe devagar, com teto, e só modifica a
 * aquisição de matérias e ofícios de estudo — nunca de esporte ou arte.
 */
const CARGA_COGNITIVA: Record<string, number> = { leitura: 1, xadrez: 0.35, clube_ciencias: 0.3, programacao: 0.25, escrever: 0.2, cursinho: 0.25, estudar_concurso: 0.2 };
const NOME_COGNITIVA: Record<string, string> = { leitura: 'ler com regularidade', xadrez: 'o xadrez', clube_ciencias: 'o clube de ciências', programacao: 'programar', escrever: 'escrever', cursinho: 'o cursinho', estudar_concurso: 'o estudo para concurso', curso: 'a faculdade' };

export function estimuloCognitivo(v: Vida): Estimulo {
  const fontes: Estimulo['fontes'] = [];
  for (const r of v.rotinas) {
    const c = CARGA_COGNITIVA[r.id];
    if (c) fontes.push({ id: r.id, texto: NOME_COGNITIVA[r.id], carga: c });
  }
  const m = v.educacao.matricula;
  if (m && !m.trancado) fontes.push({ id: 'curso', texto: NOME_COGNITIVA.curso, carga: 0.5 });
  return { total: fontes.reduce((s, f) => s + f.carga, 0), fontes: fontes.sort((a, b) => b.carga - a.carga) };
}

/** O teto plausível do aprendizado: a predisposição cognitiva desloca, não decide. */
export const tetoDeAprendizado = (v: Vida) => Math.min(92, Math.round(70 + predisposicao(v, 'cognitiva') * 14));

export function fatoresAprendizado(v: Vida): Fator[] {
  const i = idade(v);
  const out: Fator[] = [];
  const est = estimuloCognitivo(v);
  if (est.total > 0) out.push({ id: 'estimulo', texto: est.fontes.slice(0, 2).map(f => f.texto).join(' e '), efeito: ganhoCognitivo(v, est.total) });
  if (i >= 72) out.push({ id: 'idade', texto: 'a idade', efeito: -0.4 * (est.total >= 0.8 ? 0.4 : 1) });
  if (v.mente.estresse >= 75) out.push({ id: 'cabeca', texto: 'a cabeça no limite (que atrapalha a concentração)', efeito: -0.3 });
  return out.filter(f => Math.abs(f.efeito) >= 0.05);
}

function ganhoCognitivo(v: Vida, est: number): number {
  const i = idade(v);
  const cog = predisposicao(v, 'cognitiva');
  const teto = tetoDeAprendizado(v);
  const falta = clamp((teto - v.mente.cognicao) / 10, 0, 1);
  const fIdade = i < 18 ? 1.2 : i <= 60 ? 1 : 0.7;
  return 1.4 * (1 - Math.exp(-est)) * (1 + cog * 0.3) * falta * fIdade;
}

export function desenvolverAprendizado(v: Vida): void {
  const i = idade(v);
  if (i < 7) return;
  const antes = v.mente.cognicao;
  const delta = fatoresAprendizado(v).reduce((s, f) => s + f.efeito, 0);
  v.mente.cognicao = clamp(Math.round((antes + delta) * 10) / 10);
}

/* ---------------------------------------------------------------- Aparência */

/**
 * A aparência é simples: o que se nasceu com (a base) e o momento — o corpo
 * em forma, a saúde, o cigarro, o cansaço, o cuidado que o dinheiro permite,
 * os anos. Não é um sistema de beleza: é presença, e pesa pouco.
 */
export function fatoresAparencia(v: Vida): Fator[] {
  const i = idade(v);
  const c = v.corpo;
  const out: Fator[] = [];
  if (i < 14) return out;
  const forma = clamp((c.forma - 50) / 6, -4, 5);
  if (Math.abs(forma) >= 1) out.push({ id: 'forma', texto: forma > 0 ? 'o corpo em forma' : 'o corpo parado', efeito: forma });
  if (c.saude < 60) out.push({ id: 'saude', texto: 'a saúde abatida', efeito: -(60 - c.saude) / 5 });
  if (c.habitos.fuma) out.push({ id: 'fuma', texto: 'o cigarro', efeito: -3 });
  if (c.habitos.bebe === 'muito') out.push({ id: 'bebe', texto: 'a bebida', efeito: -3 });
  if (v.mente.estresse >= 70) out.push({ id: 'cansaco', texto: 'o cansaço no rosto', efeito: -2 });
  const est = v.financas.estilo;
  if (i >= 18 && est === 'folgado') out.push({ id: 'cuidado', texto: 'o cuidado que o dinheiro permite', efeito: 3 });
  else if (i >= 18 && est === 'confortavel') out.push({ id: 'cuidado', texto: 'tempo e dinheiro para se cuidar', efeito: 1 });
  else if (i >= 18 && est === 'apertado') out.push({ id: 'aperto', texto: 'pouco tempo e dinheiro para se cuidar', efeito: -1 });
  if (i > 45) out.push({ id: 'idade', texto: 'os anos', efeito: -Math.min(8, (i - 45) * 0.2) });
  return out.filter(f => Math.abs(f.efeito) >= 0.5);
}

export function alvoAparencia(v: Vida): number {
  return clamp(Math.round(aparenciaBase(v) + fatoresAparencia(v).reduce((s, f) => s + f.efeito, 0)));
}

export function desenvolverAparencia(v: Vida): void {
  const a = v.corpo.aparencia;
  v.corpo.aparencia = clamp(Math.round(a + (alvoAparencia(v) - a) * 0.4));
}

/* ------------------------------------------------------------------ O ano */

/** O que a semana do ano fez pela pessoa — antes de o corpo e a escola lerem o resultado. */
export function desenvolverPessoa(v: Vida, r: Rng): void {
  desenvolverCondicionamento(v, r);
  desenvolverAprendizado(v);
  desenvolverAparencia(v);
}

/* ---------------------------------------------------------------- Palavras */

export type DimensaoPessoal = 'condicionamento' | 'aparencia' | 'aprendizado';

export const NOME_PESSOAL: Record<DimensaoPessoal, string> = { condicionamento: 'Condicionamento', aparencia: 'Aparência', aprendizado: 'Aprendizado' };

export function palavraCondicionamento(f: number): string {
  return f >= 82 ? 'em forma de atleta' : f >= 68 ? 'em boa forma' : f >= 52 ? 'razoável' : f >= 38 ? 'fora de forma' : 'bem fora de forma';
}
export function palavraAparencia(a: number): string {
  return a >= 78 ? 'chama atenção por onde passa' : a >= 63 ? 'boa aparência' : a >= 45 ? 'aparência comum' : a >= 32 ? 'aparência descuidada' : 'aparência abatida';
}
export function palavraAprendizado(c: number): string {
  return c >= 80 ? 'aprende com muita facilidade' : c >= 66 ? 'aprende com facilidade' : c >= 50 ? 'aprende no ritmo da maioria' : c >= 36 ? 'precisa de mais tempo para aprender' : 'aprender custa bastante';
}

/**
 * Quem USA cada dimensão (em palavras, para a tela): nada aqui é
 * decorativo — cada linha é um lugar do motor que lê o valor.
 */
export const CONSUMIDORES: Record<DimensaoPessoal, string> = {
  condicionamento: 'Pesa na saúde, no rendimento do treino de esporte, no fim de uma peneira e nos testes físicos de concurso e farda.',
  aparencia: 'Pesa um pouco no primeiro interesse de alguém, numa entrevista e em quem vende ou atende.',
  aprendizado: 'Pesa na escola, no ENEM, na faculdade e em concursos, e deixa as matérias e os estudos renderem um pouco mais — não ensina esporte nem arte.'
};

export const valorPessoal = (v: Vida, d: DimensaoPessoal) => (d === 'condicionamento' ? v.corpo.forma : d === 'aparencia' ? v.corpo.aparencia : v.mente.cognicao);

export function fatoresPessoais(v: Vida, d: DimensaoPessoal): Fator[] {
  return d === 'condicionamento' ? fatoresCondicionamento(v) : d === 'aparencia' ? fatoresAparencia(v) : fatoresAprendizado(v);
}

/** O quanto mudou na janela da tendência (os últimos dois anos, pelos registros de aniversário) — e desde quando. */
export function variacaoPessoal(v: Vida, d: DimensaoPessoal): { dif: number; desde: number } | undefined {
  const campo = d === 'condicionamento' ? 'forma' : d === 'aparencia' ? 'aparencia' : 'cognicao';
  const h = (v.mente.historico ?? []).filter(x => x[campo] !== undefined);
  const antes = h.filter(x => x.t <= v.t - 24).pop() ?? h.filter(x => x.t < v.t).shift();
  if (!antes) return undefined;
  return { dif: valorPessoal(v, d) - (antes[campo] as number), desde: antes.t };
}

/** Melhorando ou piorando nos últimos dois anos: a mudança MEDIDA (não o que o alvo promete). */
export function tendenciaPessoal(v: Vida, d: DimensaoPessoal): 'melhorando' | 'piorando' | 'estavel' | 'sem_dado' {
  const x = variacaoPessoal(v, d);
  if (!x) return 'sem_dado';
  const limiar = d === 'aprendizado' ? 1.5 : 4;
  return x.dif >= limiar ? 'melhorando' : x.dif <= -limiar ? 'piorando' : 'estavel';
}

export interface CausasDaTendencia {
  tendencia: 'melhorando' | 'piorando' | 'estavel' | 'sem_dado';
  /** O que puxa para cima (o treino, o corpo que responde) — na ordem do peso. */
  aFavor: string[];
  /** O que puxa para baixo (a lesão, o cigarro, a semana parada) — na ordem do peso. */
  contra: string[];
}

/**
 * Por que o condicionamento anda para onde anda: as causas do alvo do ano
 * (`fatoresCondicionamento`, as mesmas do desenvolvimento) e o que mexeu no
 * corpo DENTRO da janela da tendência e já não está mais ativo (a lesão que
 * sarou, o fim da infância de brincar o dia inteiro). Quem "vem piorando"
 * sempre tem ao menos uma causa do lado que pesa; quem "vem melhorando",
 * do lado que ajuda — a seta e a explicação dizem a mesma coisa.
 */
export function causasDoCondicionamento(v: Vida): CausasDaTendencia {
  const i = idade(v);
  const fat = fatoresCondicionamento(v);
  const tendencia = tendenciaPessoal(v, 'condicionamento');
  const janela = variacaoPessoal(v, 'condicionamento');
  const aFavor = fat.filter(f => f.efeito > 0).sort((a, b) => b.efeito - a.efeito).map(f => f.texto);
  const contra = fat.filter(f => f.efeito < 0).sort((a, b) => a.efeito - b.efeito).map(f => f.texto);
  const est = estimuloFisico(v);
  if (i >= 12 && est.total < 0.4) contra.unshift('nenhum exercício na semana');
  const curada = v.fatos['lesao_curada'];
  const lesaoNaJanela = curada !== undefined && !!janela && curada > janela.desde && !lesaoAtiva(v);
  const forma = v.corpo.forma;
  const alvo = alvoCondicionamento(v);
  if (tendencia === 'piorando') {
    if (lesaoNaJanela) { const m = v.fatos['lesao_curada_meses'] ?? 0; contra.push(m >= 2 ? `a lesão que tirou ${m} meses de treino` : 'a lesão que tirou um tempo de treino'); }
    // O treino de base (ou de clube) que acabou dentro da janela: a semana ficou mais leve que a de antes.
    const esp = v.caminhos.esporte;
    if (esp?.fase === 'encerrada' && esp.tFim !== undefined && janela && esp.tFim > janela.desde && forma > alvo) contra.push(esp.temporadas?.length ? 'o fim do treino de atleta' : 'o fim do treino de base, quase todo dia');
    if (infanciaFicandoParaTras(i) && forma > alvo) contra.push('menos brincadeira solta, como em toda adolescência');
    if (!contra.length) contra.push(est.total >= 0.4 ? 'um treino que já não sustenta a forma de antes' : 'menos movimento do que antes');
  } else if (tendencia === 'melhorando') {
    if (lesaoNaJanela) aFavor.push('a volta aos treinos depois da lesão');
    if (!aFavor.length) aFavor.push('o corpo se recuperando');
  }
  const unico = (xs: string[]) => xs.filter((x, k) => xs.indexOf(x) === k);
  return { tendencia, aFavor: unico(aFavor), contra: unico(contra) };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
