/**
 * calendario/calendario — o índice temporal de compromissos (F3).
 *
 * Responsabilidade única e deliberadamente estreita: dado um instante,
 * responder **o que está marcado**. Ele não resolve nada, não aplica
 * consequência, não escreve log e não conhece educação, carreira, família ou
 * economia. Devolve identificadores; quem sabe o que fazer com um nascimento
 * é o `familySystem`, e quem sabe narrar um marco é quem tem o conteúdo.
 *
 * Essa estreiteza é o desenho, não uma limitação: um "Calendário da Vida"
 * que soubesse resolver as coisas seria exatamente o God System que o
 * projeto proibiu. O teste de arquitetura que acompanha esta fase verifica
 * que este diretório não importa nenhum sistema de domínio.
 *
 * Todas as funções são puras e devolvem estado novo — nada é mutado no
 * lugar, pelo mesmo motivo que o resto do motor é assim: o estado do jogo é
 * serializado e comparado, e mutação silenciosa é a origem de bug que não
 * aparece em teste.
 */

import type { InstanteDaVida } from '../tempo/instante';
import { anoDoInstante } from '../tempo/instante';
import type {
  CompromissoAgendado,
  EstadoCalendario,
  MarcoDeVida
} from './tipos';
import { deveOcorrerAgora, estadoDaJanela, janelaPerdida } from './janelas';

// ---------------------------------------------------------------------------
// Marcos
// ---------------------------------------------------------------------------

export function marcoFoiCumprido(estado: EstadoCalendario, marcoId: string): boolean {
  return estado.marcosCumpridos[marcoId] !== undefined;
}

export function instanteDoMarco(
  estado: EstadoCalendario,
  marcoId: string
): InstanteDaVida | undefined {
  return estado.marcosCumpridos[marcoId];
}

/**
 * Registra que um marco aconteceu.
 *
 * Idempotente de propósito: registrar duas vezes preserva o primeiro
 * instante. Recarregar um save, reprocessar um ano ou chamar a função duas
 * vezes por engano não pode reescrever quando o marco ocorreu.
 */
export function marcarMarcoCumprido(
  estado: EstadoCalendario,
  marcoId: string,
  instante: InstanteDaVida
): EstadoCalendario {
  if (marcoFoiCumprido(estado, marcoId)) return estado;
  return {
    ...estado,
    marcosCumpridos: { ...estado.marcosCumpridos, [marcoId]: instante }
  };
}

/**
 * Quais marcos devem ocorrer nesta idade?
 *
 * O coração da fase, e a resposta ao problema medido: *A Primeira Palavra*
 * ocorria em 17% das vidas porque disputava um sorteio ponderado. Aqui não
 * há sorteio nenhum — há janela, condição e modo.
 *
 * `condicaoSatisfeita` é injetada em vez de avaliada aqui: é o que permite
 * ao calendário usar o vocabulário de condições do catálogo
 * (`events/eligibility`) sem importar o módulo que o avalia, mantendo a
 * direção de dependência limpa.
 *
 * A ordem do retorno segue a ordem do catálogo de marcos, que é estável.
 * Determinismo importa: o mesmo estado tem de produzir sempre a mesma lista.
 */
export function marcosDevidos(
  estado: EstadoCalendario,
  marcos: readonly MarcoDeVida[],
  idade: number,
  condicaoSatisfeita: (marco: MarcoDeVida) => boolean
): MarcoDeVida[] {
  return marcos.filter(marco => {
    if (marco.modo === 'aleatorio') return false;
    if (marcoFoiCumprido(estado, marco.id)) return false;
    if (!deveOcorrerAgora(marco.janela, idade)) return false;
    return condicaoSatisfeita(marco);
  });
}

/**
 * Marcos que perderam a janela sem acontecer.
 *
 * Um `garantido` que aparece aqui é um defeito de projeto, não um evento de
 * jogo — a suíte tem um teste que exige esta lista vazia para os garantidos.
 * Para `provavel_em_janela` é um resultado legítimo: a vida às vezes não
 * entrega.
 */
export function marcosPerdidos(
  estado: EstadoCalendario,
  marcos: readonly MarcoDeVida[],
  idade: number
): MarcoDeVida[] {
  return marcos.filter(
    marco =>
      marco.modo !== 'aleatorio' &&
      !marcoFoiCumprido(estado, marco.id) &&
      janelaPerdida(marco.janela, idade)
  );
}

/**
 * Estado de cada marco para uma idade. Diagnóstico e teste; nunca exibido.
 */
export function panoramaDeMarcos(
  estado: EstadoCalendario,
  marcos: readonly MarcoDeVida[],
  idade: number
): { marco: MarcoDeVida; estado: ReturnType<typeof estadoDaJanela> }[] {
  return marcos.map(marco => ({
    marco,
    estado: estadoDaJanela(marco.janela, idade, marcoFoiCumprido(estado, marco.id))
  }));
}

// ---------------------------------------------------------------------------
// Compromissos agendados
// ---------------------------------------------------------------------------

export function agendar(
  estado: EstadoCalendario,
  compromisso: CompromissoAgendado
): EstadoCalendario {
  return { ...estado, compromissos: [...estado.compromissos, compromisso] };
}

/**
 * O que vence até este instante e ainda não foi cumprido.
 *
 * "Até", e não "exatamente em": se o jogador fechou o jogo e voltou depois,
 * ou se um ano foi processado sem passar por aqui, o compromisso não pode
 * ser engolido silenciosamente. Um compromisso perdido é pior que um
 * compromisso atrasado.
 *
 * Um compromisso com `expiraEm` já passado deixa de ser devido — é o que
 * permite modelar oportunidades que de fato passam do ponto.
 */
export function compromissosVencidos(
  estado: EstadoCalendario,
  agora: InstanteDaVida
): CompromissoAgendado[] {
  return estado.compromissos.filter(
    c =>
      c.cumpridoEm === undefined &&
      c.venceEm <= agora &&
      (c.expiraEm === undefined || agora <= c.expiraEm)
  );
}

/** Compromissos que expiraram sem serem resolvidos. */
export function compromissosExpirados(
  estado: EstadoCalendario,
  agora: InstanteDaVida
): CompromissoAgendado[] {
  return estado.compromissos.filter(
    c => c.cumpridoEm === undefined && c.expiraEm !== undefined && agora > c.expiraEm
  );
}

export function marcarCompromissoCumprido(
  estado: EstadoCalendario,
  compromissoId: string,
  instante: InstanteDaVida
): EstadoCalendario {
  return {
    ...estado,
    compromissos: estado.compromissos.map(c =>
      c.id === compromissoId && c.cumpridoEm === undefined
        ? { ...c, cumpridoEm: instante }
        : c
    )
  };
}

/** Compromissos pendentes de um tipo (ex.: "já existe gestação em curso?"). */
export function compromissosPendentesDoTipo(
  estado: EstadoCalendario,
  tipo: string
): CompromissoAgendado[] {
  return estado.compromissos.filter(c => c.tipo === tipo && c.cumpridoEm === undefined);
}

// ---------------------------------------------------------------------------
// Migração de save
// ---------------------------------------------------------------------------

/**
 * Fecha retroativamente todo marco cuja janela já passou.
 *
 * Roda uma vez, ao carregar um save anterior à Fase 3. Sem isto, um
 * personagem de 40 anos daria os primeiros passos no ano seguinte ao update
 * — que é a pior falha possível desta fase, porque quebra a coerência da
 * biografia inteira para consertar um marco que aquela vida já viveu sem.
 *
 * `conteudoJaDisparado` consulta o histórico de eventos: se o conteúdo do
 * marco já ocorreu naquela vida, ele é marcado como cumprido de verdade
 * (com o instante atual, que é a melhor aproximação disponível). Se apenas a
 * janela passou, também fecha — a vida seguiu sem ele, e reescrever o
 * passado seria pior do que perdê-lo.
 */
export function fecharMarcosDoPassado(
  estado: EstadoCalendario,
  marcos: readonly MarcoDeVida[],
  idadeAtual: number,
  agora: InstanteDaVida,
  conteudoJaDisparado: (conteudoId: string) => boolean
): EstadoCalendario {
  let resultado = estado;
  for (const marco of marcos) {
    if (marcoFoiCumprido(resultado, marco.id)) continue;
    const passou = janelaPerdida(marco.janela, idadeAtual);
    if (passou || conteudoJaDisparado(marco.conteudoId)) {
      resultado = marcarMarcoCumprido(resultado, marco.id, agora);
    }
  }
  return resultado;
}

/** Ano de vida de um instante — conveniência para diagnóstico. */
export function anoDeVidaDe(instante: InstanteDaVida): number {
  return anoDoInstante(instante);
}
