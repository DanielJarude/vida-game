/**
 * calendario/tipos — o vocabulário do Calendário da Vida (F3).
 *
 * A Fase 2 criou o TEMPO: um instante canônico, ancorado na idade, com
 * resolução de semestre. A Fase 3 precisa de algo que o tempo sozinho não
 * responde — **o que está marcado para acontecer**.
 *
 * O problema que isto resolve foi medido: `repeticao: 'marco'` governa se um
 * evento pode REPETIR, e nada mais. Quem decide se ele OCORRE é o sorteio
 * ponderado, igual a qualquer outro conteúdo. O resultado é que *A Primeira
 * Palavra* aparece em 17% das vidas e *Primeiros Passos* em 13%: 83% dos
 * jogadores nunca veem o próprio personagem aprender a falar, não porque
 * aquela vida não teve o marco, mas porque o dado caiu em outro evento.
 *
 * Ocorrência e repetição são perguntas diferentes. Este módulo existe para
 * responder a primeira.
 *
 * DISCIPLINA DE DEPENDÊNCIA (a mesma que quebrou o ciclo da Fase 1):
 * `calendario/` importa `systems/tempo/` e `types`, e NADA MAIS de
 * `systems/`. Se um dia precisar importar `agingSystem`, `educationSystem`
 * ou qualquer sistema de domínio, o desenho está errado — o calendário
 * devolve identificadores e quem resolve é o dono do assunto. É o que o
 * impede de virar um God System.
 */

import type { GameEvent } from '../../types';
import type { InstanteDaVida } from '../tempo/instante';

// ---------------------------------------------------------------------------
// Modo de ocorrência
// ---------------------------------------------------------------------------

/**
 * Com que força a vida insiste que isto aconteça.
 *
 * Nem todo marco é obrigatório — essa foi uma exigência explícita do
 * projeto, e é o que impede o calendário de virar uma esteira de modais.
 *
 * - `garantido`          acontece se a condição básica existir. Não negocia
 *                        com o dado. É para desenvolvimento humano e
 *                        transições que o próprio motor já produz.
 * - `provavel_em_janela` deve acontecer dentro da faixa, salvo exceção
 *                        coerente (a pessoa morreu, adoeceu, a condição
 *                        deixou de valer). Pode ser perdido; raramente é.
 * - `condicional`        só existe se a trajetória criou a condição. Uma
 *                        vida sem faculdade nunca terá colação de grau.
 * - `agendado`           uma consequência anterior marcou isto para um
 *                        instante futuro (ver `CompromissoAgendado`).
 * - `aleatorio`          o comportamento atual de todo o catálogo: pode
 *                        simplesmente nunca ocorrer naquela vida.
 */
export type ModoDeOcorrencia =
  | 'garantido'
  | 'provavel_em_janela'
  | 'condicional'
  | 'agendado'
  | 'aleatorio';

/** Modos que o calendário conduz. `aleatorio` continua no caminho do sorteio. */
export function ehConduzidoPeloCalendario(modo: ModoDeOcorrencia): boolean {
  return modo !== 'aleatorio';
}

// ---------------------------------------------------------------------------
// Janela
// ---------------------------------------------------------------------------

/**
 * A faixa de vida em que um marco pode ocorrer.
 *
 * `idadeTipica` não é enfeite e resolve um problema concreto: *Primeiros
 * Passos* e *A Primeira Palavra* compartilham a janela 1-2. Com os dois
 * garantidos e sem distribuição, ambos disparariam no primeiro ano possível
 * e a infância abriria com dois marcos empilhados no mesmo ano. Andar
 * tipicamente vem antes de falar; o dado declara isso, sem `if` no motor.
 */
export interface JanelaDeVida {
  readonly idadeMinima: number;
  readonly idadeMaxima: number;
  readonly idadeTipica?: number;
}

/**
 * Situação de uma janela num dado momento da vida.
 *
 * `vencendo` é o estado que dá força ao `garantido`: é o último ano em que
 * o marco ainda cabe, e a partir dali ele não pode mais esperar.
 */
export type EstadoDeJanela =
  | 'futura'
  | 'aberta'
  | 'vencendo'
  | 'cumprida'
  | 'perdida';

// ---------------------------------------------------------------------------
// Marco
// ---------------------------------------------------------------------------

/**
 * Um marco de vida, declarado como DADO.
 *
 * O marco não carrega texto nem consequência: ele aponta (`conteudoId`) para
 * um `GameEvent` do catálogo, que já tem descrição, opções e efeitos
 * escritos e testados. O calendário decide QUE aquilo acontece; o conteúdo
 * continua sendo o que sempre foi. É o que permite converter marcos sem
 * reescrever uma linha de catálogo.
 */
export interface MarcoDeVida {
  readonly id: string;
  /** Id do `GameEvent` que dá voz a este marco. */
  readonly conteudoId: string;
  readonly janela: JanelaDeVida;
  readonly modo: ModoDeOcorrencia;
  /**
   * Condição estrutural para o marco existir nesta vida. Reusa o mesmo
   * formato de `GameEvent['condicoes']` de propósito: é o vocabulário que o
   * catálogo já fala e que `events/eligibility` já sabe avaliar. Também é o
   * gancho por onde condições de cidade/renda/escola entrarão no futuro, sem
   * nada hardcoded agora.
   */
  readonly condicao?: GameEvent['condicoes'];
  /**
   * O jogador participa da definição deste marco?
   *
   * Independente do modo: um marco garantido pode ser testemunhado
   * (primeiros passos) ou ter uma escolha biográfica (primeira palavra). O
   * calendário sustenta os dois — era um requisito explícito do projeto e é
   * o que os dois canários provam.
   */
  readonly temEscolha: boolean;
}

// ---------------------------------------------------------------------------
// Compromisso agendado
// ---------------------------------------------------------------------------

/**
 * Algo que uma consequência anterior marcou para um instante futuro.
 *
 * `tipo` é string livre DE PROPÓSITO. O calendário não precisa saber o que é
 * um nascimento: ele devolve o compromisso vencido e quem sabe o que fazer
 * com ele é o sistema dono do assunto. Mesmo padrão de
 * `chaveProcessoSeletivo(jobId)` na Fase 2, que funcionou bem.
 *
 * Isto é o TRILHO das cadeias futuras (gestação → nascimento, inscrição →
 * prova, tratamento → retorno, parcelamento → parcelas). Nenhuma delas é
 * implementada agora; o que existe aqui é a estrutura que as sustentará sem
 * precisar de outra rodada de arquitetura.
 *
 * Note o que NÃO vem para cá: a conclusão de curso, que a Fase 2 já resolve
 * com `Matricula` (início + duração + progresso). Uma matrícula é melhor
 * representada como duração contínua do que como um compromisso pontual, e
 * migrá-la seria regressão.
 */
export interface CompromissoAgendado {
  readonly id: string;
  readonly tipo: string;
  /** A que se refere: cursoId, jobId, npcId… Opcional. */
  readonly alvoId?: string;
  readonly agendadoEm: InstanteDaVida;
  readonly venceEm: InstanteDaVida;
  /** Até quando ainda vale, se não for resolvido no vencimento. */
  readonly expiraEm?: InstanteDaVida;
  readonly dados?: Readonly<Record<string, string | number | boolean>>;
  readonly cumpridoEm?: InstanteDaVida;
}

// ---------------------------------------------------------------------------
// Estado persistido
// ---------------------------------------------------------------------------

/**
 * O que o calendário guarda entre um ano e outro — e entre uma sessão e
 * outra.
 *
 * Persistir é requisito, não detalhe: um compromisso não pode sumir no
 * reload, um marco cumprido não pode reocorrer e uma janela não pode
 * resetar. Guardar o instante do cumprimento (em vez de um booleano) é o que
 * permite responder "quando isso aconteceu?" sem consultar a Linha da Vida.
 */
export interface EstadoCalendario {
  readonly compromissos: readonly CompromissoAgendado[];
  /** marcoId → instante em que foi cumprido. */
  readonly marcosCumpridos: Readonly<Record<string, InstanteDaVida>>;
}

export function criarCalendarioInicial(): EstadoCalendario {
  return { compromissos: [], marcosCumpridos: {} };
}
