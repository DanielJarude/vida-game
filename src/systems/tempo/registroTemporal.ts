/**
 * REGISTRO TEMPORAL — o que já foi consumido, e quando.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * UM EIXO DIFERENTE DA PLAUSIBILIDADE
 *
 * A Fase 1 respondeu "esta pessoa PODE?" (elegibilidade). Este módulo responde
 * "isto ainda CABE neste período?" — e as duas perguntas são independentes:
 *
 *     ELEGIBILIDADE        pode tentar?          ← plausibility/
 *     DISPONIBILIDADE      ainda cabe no período? ← este módulo
 *     PROCESSO SELETIVO    como se saiu?          ← career/processoSeletivo
 *
 * Quem já prestou o vestibular deste ano continua PERFEITAMENTE ELEGÍVEL para
 * o curso. Não lhe falta requisito nenhum; falta tempo. Por isso "sem
 * tentativa no período" NÃO é um `GrauDePlausibilidade` — misturar os dois
 * eixos corromperia o vocabulário que a Fase 1 estabeleceu (possível,
 * irregular, improvável, bloqueado), e faria o jogo dizer "você não tem os
 * requisitos" para alguém que os tem.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * O QUE ISTO SUBSTITUI
 *
 * `acoesRealizadasAno: string[]` vivia em `useGame.ts` — ou seja, a regra de
 * "uma vez por ano" era propriedade da interface. Chamar o motor diretamente
 * em laço a ignorava por completo. Aqui ela desce para o domínio, ganha
 * carimbo de tempo (em vez de ser uma lista que alguém zera) e passa a ser
 * verificável por quem aplica o efeito.
 *
 * COMO ISTO PREPARA O CALENDÁRIO DA VIDA
 *
 * Cada uso guarda o INSTANTE em que ocorreu, não um booleano. Isso é o que
 * permite, depois, perguntar "quando foi?" e "quanto falta?" — as perguntas
 * que um evento agendado precisa fazer. Um cooldown de N semestres já é
 * expressável hoje com `usosDesde`; o que falta para o calendário completo é
 * o agendamento de efeitos futuros, que é outra estrutura e outra fase.
 */

import type { InstanteDaVida } from './instante';
import { mesmoSemestre, semestresEntre } from './instante';

/**
 * Registro imutável de usos carimbados no tempo.
 *
 * `Readonly<Record<chave, instantes[]>>`: uma chave é uma ação identificável
 * (`'vestibular'`, `'processo:medico_geral'`), e o valor são os instantes em
 * que ela foi consumida. Guardar a lista — e não uma contagem — é o que
 * permite responder "quando" e "quantos desde tal momento", em vez de só
 * "quantos no total".
 */
export interface RegistroTemporal {
  readonly usos: Readonly<Record<string, readonly InstanteDaVida[]>>;
}

export function criarRegistroTemporal(): RegistroTemporal {
  return { usos: {} };
}

/** Registra um uso da chave no instante dado. Puro: devolve novo registro. */
export function registrarUso(
  registro: RegistroTemporal,
  chave: string,
  instante: InstanteDaVida
): RegistroTemporal {
  const anteriores = registro.usos[chave] ?? [];
  return {
    usos: { ...registro.usos, [chave]: [...anteriores, instante] }
  };
}

/** Todos os instantes em que a chave foi usada. */
export function usosDe(
  registro: RegistroTemporal,
  chave: string
): readonly InstanteDaVida[] {
  return registro.usos[chave] ?? [];
}

/** Quantas vezes a chave foi usada no MESMO semestre do instante dado. */
export function usosNoSemestre(
  registro: RegistroTemporal,
  chave: string,
  instante: InstanteDaVida
): number {
  return usosDe(registro, chave).filter(u => mesmoSemestre(u, instante)).length;
}

/** Quantas vezes a chave foi usada nos últimos N semestres (inclusive agora). */
export function usosDesde(
  registro: RegistroTemporal,
  chave: string,
  agora: InstanteDaVida,
  semestres: number
): number {
  return usosDe(registro, chave).filter(u => semestresEntre(u, agora) < semestres).length;
}

/** Instante do último uso, se houver. */
export function ultimoUso(
  registro: RegistroTemporal,
  chave: string
): InstanteDaVida | undefined {
  const lista = usosDe(registro, chave);
  return lista.length === 0 ? undefined : lista[lista.length - 1];
}

// ---------------------------------------------------------------------------
// Política de consumo — declarativa
// ---------------------------------------------------------------------------

/**
 * Quanto de um período uma ação consome.
 *
 * Declarativo de propósito: a regra de repetição de cada ação passa a ser um
 * DADO, não um `if` espalhado. Acrescentar uma ação limitada é acrescentar uma
 * entrada, não editar lógica.
 */
export type PoliticaDeConsumo =
  /** Uma única vez por ano de vida, qualquer que seja o alvo. */
  | { readonly tipo: 'uma_vez_por_ano' }
  /** Até `maximo` vezes por ano de vida. */
  | { readonly tipo: 'limitado_por_ano'; readonly maximo: number }
  /** Sem limite temporal. */
  | { readonly tipo: 'livre' };

export interface ResultadoDisponibilidadeTemporal {
  readonly disponivel: boolean;
  /** Usos já consumidos no período corrente. */
  readonly usosNoPeriodo: number;
  /** Teto do período, quando houver. */
  readonly maximo?: number;
  /** Explicação em pt-BR, quando indisponível. */
  readonly motivo?: string;
}

const DISPONIVEL: ResultadoDisponibilidadeTemporal = { disponivel: true, usosNoPeriodo: 0 };

/**
 * A ação ainda cabe no período?
 *
 * O "período" é o ANO DE VIDA, não o semestre: é a unidade que o jogador
 * percebe e a que a passagem de ano avança. O semestre existe como precisão
 * interna (duração de curso), não como cadência de decisão — ninguém deve
 * precisar clicar duas vezes para viver um ano.
 */
export function avaliarDisponibilidadeTemporal(
  registro: RegistroTemporal,
  chave: string,
  politica: PoliticaDeConsumo,
  anoDeVida: number,
  descricaoDaAcao: string
): ResultadoDisponibilidadeTemporal {
  if (politica.tipo === 'livre') return DISPONIVEL;

  const usados = usosDe(registro, chave).filter(u => anoDeVidaDoUso(u) === anoDeVida).length;
  const maximo = politica.tipo === 'uma_vez_por_ano' ? 1 : politica.maximo;

  if (usados < maximo) {
    return { disponivel: true, usosNoPeriodo: usados, maximo };
  }

  return {
    disponivel: false,
    usosNoPeriodo: usados,
    maximo,
    motivo:
      maximo === 1
        ? `${descricaoDaAcao} já aconteceu neste ano. Avance o ano para tentar de novo.`
        : `Você já usou suas ${maximo} tentativas deste ano para ${descricaoDaAcao.toLowerCase()}. Avance o ano para tentar de novo.`
  };
}

/**
 * Ano de vida de um uso.
 *
 * Os instantes são gravados com `instanteDe(anoDeVida)`, onde o "ano" é a
 * idade do personagem — e não o ano de calendário. Ancorar na IDADE é o que
 * torna o registro imune à variação de `anoAtual` entre saves e o que faz
 * "este ano" significar "este ano da minha vida".
 */
function anoDeVidaDoUso(instante: InstanteDaVida): number {
  return Math.floor(instante / 2);
}

// ---------------------------------------------------------------------------
// Chaves canônicas
// ---------------------------------------------------------------------------

/**
 * Chaves de consumo usadas pelo jogo.
 *
 * Centralizadas para que motor, interface e testes falem exatamente a mesma
 * string — um erro de digitação aqui desliga silenciosamente um limite, que é
 * o tipo de falha que não aparece em teste nenhum.
 */
export const CHAVE_VESTIBULAR = 'vestibular';

/**
 * Uma chave POR OPORTUNIDADE, não uma chave global de "candidatar-se".
 *
 * A distinção é o ponto da regra: o exploit medido pela auditoria era rolar o
 * dado de novo **na mesma vaga** até ela cair (`emprego:${id}:tentativa2`).
 * Procurar trabalho em várias empresas no mesmo ano é comportamento humano
 * normal — e travar isso deixaria o mercado artificialmente imóvel, o oposto
 * do que se quer.
 */
export function chaveProcessoSeletivo(jobId: string): string {
  return `processo_seletivo:${jobId}`;
}

/**
 * Concepção — a decisão de ter um filho.
 *
 * A chave é a DECISÃO, não o nascimento. A diferença importa: uma gestação
 * múltipla (gêmeos) é UMA concepção que produz DOIS filhos, e continuará
 * cabendo nesta regra quando a gestação for modelada. O que se limita aqui é
 * repetir a decisão em laço no mesmo ano — que é o que o motor permitia e o
 * harness mediu.
 */
export const CHAVE_CONCEPCAO = 'concepcao';
