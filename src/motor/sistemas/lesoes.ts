/**
 * Lesões: o problema do corpo que a pessoa VIVE, não um número que cai.
 *
 *   lesão (no jogo, no treino, na prática) → percepção (a Linha da Vida, a
 *   tela Você, o painel) → DECISÃO (parar, reabilitar, operar — ou seguir
 *   no sacrifício) → evolução (o prazo de volta depende do cuidado; jogar
 *   em cima pode piorar) → consequência → recuperação.
 *
 * A lesão mora em `corpo.condicoes` (id `lesao`), com os dados em
 * `Condicao.lesao`. É a FONTE ÚNICA: a saúde (`estado.fatoresSaude`), o
 * condicionamento (`pessoa.fatoresCondicionamento`), o treino
 * (`frentes.praticar`), a temporada (`esporte`), a disponibilidade e o risco
 * de nova lesão leem daqui. Nada disso é conselho médico: são escolhas
 * abstratas de jogo, com custo e consequência.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Condicao, CuidadoLesao, Lesao, Vida } from '../tipos';
import { escrever, idade, marcarFato } from '../nucleo';
import { abalar } from './abalo';
import { marcar } from './marcas';

/** Quanto tempo (meses) cada gravidade tira, com repouso simples. */
const MESES_BASE: Record<1 | 2 | 3, number> = { 1: 2, 2: 5, 3: 10 };

export const lesaoAtiva = (v: Vida): (Condicao & { lesao: Lesao }) | undefined =>
  v.corpo.condicoes.find((c): c is Condicao & { lesao: Lesao } => c.id === 'lesao' && !!c.lesao);

const PARTES: Record<1 | 2 | 3, string[]> = {
  1: ['uma distensão na coxa', 'um entorse no tornozelo', 'uma contusão no joelho', 'uma lesão muscular na panturrilha'],
  2: ['uma lesão no menisco', 'um estiramento sério na coxa', 'uma fratura no pé', 'uma lesão no ombro'],
  3: ['o ligamento do joelho rompido', 'uma fratura na perna', 'o tendão de Aquiles rompido']
};

/** O nome da lesão, em palavras (é o que a tela Você e a Linha da Vida mostram). */
export const nomeDaLesao = (l: Lesao) => l.parte;

/**
 * A lesão acontece. Abre a decisão de como cuidar (`sau_lesao`): o motor
 * não decide como a pessoa reagiu.
 */
export function lesionar(v: Vida, r: Rng, gravidade: 1 | 2 | 3, origem: Lesao['origem']): Condicao {
  // Uma lesão em cima da outra: a de agora piora a que já existe (não empilha duas).
  const atual = lesaoAtiva(v);
  if (atual) {
    const g = Math.min(3, Math.max(atual.lesao.gravidade, gravidade) + (atual.lesao.cuidado === 'sacrificio' ? 1 : 0)) as 1 | 2 | 3;
    atual.lesao.gravidade = g;
    atual.gravidade = g;
    atual.lesao.tFim = Math.max(atual.lesao.tFim, v.t + MESES_BASE[g]);
    atual.lesao.cuidado = undefined;
    v.fatos['lesao_decidir'] = v.t;
    return atual;
  }
  const parte = r.pick(PARTES[gravidade]);
  const lesao: Lesao = { parte, gravidade, tFim: v.t + MESES_BASE[gravidade], origem };
  const cond: Condicao = { id: 'lesao', nome: parte, tInicio: v.t, cronica: false, gravidade, tratando: false, diagnosticada: true, tDiagnostico: v.t, lesao };
  v.corpo.condicoes.push(cond);
  v.fatos['lesao_decidir'] = v.t;
  v.fatos['lesoes_total'] = (v.fatos['lesoes_total'] ?? 0) + 1;
  const onde = origem === 'profissional' ? (gravidade >= 3 ? 'num lance de jogo' : 'num treino') : origem === 'trabalho' ? 'no trabalho' : 'jogando';
  const texto = gravidade >= 3 ? `Sofreu uma lesão grave ${onde}: ${parte}.` : gravidade === 2 ? `Machucou-se ${onde}: ${parte}. Coisa de meses.` : `Sentiu ${parte} ${onde}.`;
  escrever(v, { texto, relevancia: gravidade >= 2 ? 'biografia' : 'cotidiano', tema: 'saude', tom: 'ruim' });
  if (gravidade >= 3) marcar(v, 'fracasso', texto, 2);
  abalar(v, gravidade >= 3 ? 'a lesão grave' : 'a lesão', gravidade >= 3 ? -8 : gravidade === 2 ? -4 : -1, gravidade >= 2 ? 5 : 1);
  return cond;
}

/** O que cada cuidado faz com o prazo (e com o risco de piorar). */
export function prazoDoCuidado(l: Lesao, cuidado: CuidadoLesao, sus = false): number {
  const base = MESES_BASE[l.gravidade];
  switch (cuidado) {
    case 'repouso': return Math.round(base * (l.gravidade >= 3 ? 1.5 : 1));
    case 'fisio': return Math.max(1, Math.round(base * (l.gravidade >= 3 ? 1.1 : 0.65) * (sus ? 1.25 : 1)));
    case 'cirurgia': return Math.round(base * 0.85 + (sus ? 4 : 0));
    case 'sacrificio': return base;
  }
}

/** Quem paga o cuidado: o clube paga o atleta; o plano cobre; o resto é SUS (de graça e mais lento) ou bolso. */
export function custoDoCuidado(v: Vida, l: Lesao, cuidado: CuidadoLesao): number {
  if (l.origem === 'profissional' || v.financas.planoDeSaude) return 0;
  if (cuidado === 'fisio') return l.gravidade >= 2 ? 2400 : 900;
  if (cuidado === 'cirurgia') return 18000;
  return 0;
}

export function cuidarDaLesao(v: Vida, cuidado: CuidadoLesao, pagarDoBolso: boolean): void {
  const c = lesaoAtiva(v);
  if (!c) return;
  const l = c.lesao;
  const sus = !pagarDoBolso && custoDoCuidado(v, l, cuidado) > 0;
  l.cuidado = cuidado;
  c.tratando = cuidado !== 'sacrificio';
  l.tFim = c.tInicio + prazoDoCuidado(l, cuidado, sus);
  if (l.tFim < v.t) l.tFim = v.t + 1;
  if (cuidado === 'cirurgia' && l.gravidade >= 3) marcarFato(v, 'operou_lesao');
  delete v.fatos['lesao_decidir'];
}

/** Meses fora (sem jogar/treinar de verdade) dentro do ano que termina agora. */
export function mesesForaNoAno(v: Vida): number {
  const c = lesaoAtiva(v);
  if (!c) return 0;
  const l = c.lesao;
  if (l.cuidado === 'sacrificio') return 0;
  const ini = Math.max(c.tInicio, v.t - 12);
  const fim = Math.min(l.tFim, v.t);
  return clamp(fim - ini, 0, 12);
}

/**
 * O quanto a lesão deixa treinar (0..1): parado, quase nada; reabilitando,
 * um pouco; no sacrifício, treina — mas rende menos e arrisca mais.
 */
export function fatorDeTreino(v: Vida): number {
  const c = lesaoAtiva(v);
  if (!c) return 1;
  const l = c.lesao;
  if (l.cuidado === 'sacrificio') return 0.75;
  const fora = mesesForaNoAno(v) / 12;
  return clamp(1 - fora * (l.cuidado === 'fisio' ? 0.6 : 0.85), 0.15, 1);
}

/** O peso da lesão na saúde do ano (o mesmo número que a tela Você mostra). */
export function pesoNaSaude(l: Lesao): number {
  const base = l.gravidade * 1.3;
  return l.cuidado === 'sacrificio' ? base * 1.8 : l.cuidado ? base * 0.6 : base;
}

/** O peso da lesão no condicionamento (alvo do ano). */
export function pesoNoCondicionamento(l: Lesao): number {
  if (l.cuidado === 'sacrificio') return -4 * l.gravidade;
  if (l.cuidado === 'fisio') return -3 * l.gravidade;
  return -5 * l.gravidade;
}

/** O ano da lesão: volta (quando o prazo chega) ou piora (quando se joga em cima). */
export function processarLesoes(v: Vida, r: Rng): void {
  const c = lesaoAtiva(v);
  if (!c) return;
  const l = c.lesao;
  // Seguir no sacrifício tem preço: às vezes piora — e o prazo de volta foge.
  if (l.cuidado === 'sacrificio' && v.t < l.tFim + 12) {
    const piora = 0.18 * l.gravidade + (v.mente.sobrecarga?.anos ?? 0) * 0.04;
    if (r.chance(Math.min(0.6, piora))) {
      l.recaidas = (l.recaidas ?? 0) + 1;
      const g = Math.min(3, l.gravidade + 1) as 1 | 2 | 3;
      l.gravidade = g;
      c.gravidade = g;
      l.tFim = v.t + MESES_BASE[g];
      l.cuidado = undefined;
      c.tratando = false;
      v.fatos['lesao_decidir'] = v.t;
      v.corpo.saude = clamp(v.corpo.saude - 3);
      escrever(v, { texto: `Jogar em cima da lesão cobrou: ${l.parte} piorou.`, relevancia: 'biografia', tema: 'saude', tom: 'ruim' });
      abalar(v, 'a lesão que piorou', -5, 5);
      return;
    }
    // Aguentou o ano: o corpo se acomoda, mas não cura sozinho de uma vez.
    if (v.t >= l.tFim) l.tFim = v.t + Math.round(MESES_BASE[l.gravidade] * 0.5);
    else return;
  }
  if (v.t < l.tFim) return;
  v.corpo.condicoes = v.corpo.condicoes.filter(x => x !== c);
  const meses = Math.max(1, l.tFim - c.tInicio);
  // A lesão some das condições, mas o que ela tirou do corpo continua na tendência por um tempo:
  // a tela que explica "vem piorando" precisa dizer que foi ela (`pessoa.causasDoCondicionamento`).
  v.fatos['lesao_curada'] = v.t;
  v.fatos['lesao_curada_meses'] = Math.min(meses, 24);
  if (l.gravidade >= 2) {
    const texto = `Voltou ${l.origem === 'profissional' ? 'a jogar' : 'a treinar'} depois de ${meses} ${meses === 1 ? 'mês' : 'meses'} por causa d${/^[ao] /.test(l.parte) ? l.parte.slice(0, 1) + ' ' + l.parte.slice(2) : 'a lesão'}.`;
    escrever(v, { texto: l.cuidado === 'cirurgia' && l.gravidade >= 3 ? `${texto} A cirurgia e a recuperação deram certo.` : texto, relevancia: l.gravidade >= 3 ? 'biografia' : 'cotidiano', tema: 'saude', tom: 'bom' });
  }
  // Lesão grave mal cuidada deixa marca no corpo (o joelho que nunca mais foi o mesmo).
  if (l.gravidade >= 3 && (l.recaidas ?? 0) >= 1 && idade(v) >= 25) marcarFato(v, 'sequela_lesao');
}

/** A decisão ainda está por tomar (abre `sau_lesao`). */
export const lesaoPorDecidir = (v: Vida) => { const c = lesaoAtiva(v); return !!c && !c.lesao.cuidado; };
