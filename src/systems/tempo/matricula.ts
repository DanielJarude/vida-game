/**
 * MATRÍCULA — a duração de um curso como fato temporal.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * A CAUSA DO OFF-BY-ONE
 *
 * O código anterior era:
 *
 *     semestreAtual = 1                          // na matrícula
 *     semestreAtual += 2                         // a cada ano
 *     if (semestreAtual >= totalSemestres) { formatura }
 *
 * Três erros somados num só lugar:
 *
 *  1. `semestreAtual` começava em 1, mas media PROGRESSO — ou seja, o aluno
 *     já nascia com meio ano cursado que nunca viveu.
 *  2. `>=` comparava um contador de posição com um total de duração.
 *  3. Somar 2 por ano não sabe representar duração ímpar: num curso de 3
 *     semestres, o progresso pula de 1 para 3 e ATRAVESSA o ponto de
 *     conclusão sem nunca pousar nele.
 *
 * Resultado medido: curso de 3 semestres formava em 1 ano. Em durações pares
 * os três erros se cancelavam, e foi por isso que ninguém notou por tanto
 * tempo.
 *
 * A correção não é mexer no `>=`. É parar de contar posição e passar a contar
 * TEMPO DECORRIDO desde um início real:
 *
 *     concluído  ⟺  semestres vividos desde o início  ≥  duração do curso
 *
 * Com isso, um curso de 3 semestres conclui quando 3 semestres passaram — 1
 * ano e meio — sem exceção por nome de curso e sem arredondamento.
 * ────────────────────────────────────────────────────────────────────────────
 */

import {
  anoDoInstante,
  descreverDuracaoEmSemestres,
  semestresEntre,
  SEMESTRES_POR_ANO,
  type InstanteDaVida
} from './instante';

/**
 * O fato temporal de estar matriculado.
 *
 * Três campos, e nenhum deles redundante: início (quando começou), duração
 * (quanto precisa) e — derivado dos dois com o instante atual — o progresso.
 * O progresso deixa de ser um contador que alguém incrementa e passa a ser
 * uma CONSEQUÊNCIA do tempo, que é o que impede que ele seja adiantado.
 */
export interface Matricula {
  /** Instante da matrícula, ancorado na IDADE do personagem. */
  readonly inicio: InstanteDaVida;
  /** Duração declarada pelo catálogo, em semestres. */
  readonly duracaoSemestres: number;
}

export function criarMatricula(
  inicio: InstanteDaVida,
  duracaoSemestres: number
): Matricula {
  return { inicio, duracaoSemestres: Math.max(1, Math.round(duracaoSemestres)) };
}

/** Semestres efetivamente cursados até `agora` (nunca negativo). */
export function semestresCursados(matricula: Matricula, agora: InstanteDaVida): number {
  return Math.max(0, semestresEntre(matricula.inicio, agora));
}

/** Semestres que ainda faltam (nunca negativo). */
export function semestresRestantes(matricula: Matricula, agora: InstanteDaVida): number {
  return Math.max(0, matricula.duracaoSemestres - semestresCursados(matricula, agora));
}

/**
 * O curso está concluído?
 *
 * A pergunta que substitui o `>=` defeituoso. Conclusão é consequência de
 * duração cumprida — não de um contador ter ultrapassado um número.
 */
export function matriculaConcluida(matricula: Matricula, agora: InstanteDaVida): boolean {
  return semestresCursados(matricula, agora) >= matricula.duracaoSemestres;
}

/**
 * Instante em que o curso conclui. É o que um evento agendado vai consumir:
 * "matrícula → formatura prevista para tal período".
 */
export function instanteDeConclusao(matricula: Matricula): InstanteDaVida {
  return matricula.inicio + matricula.duracaoSemestres;
}

/**
 * Semestre em que o aluno está, para exibição — 1-based.
 *
 * Distinto do progresso: quem cursou 0 semestres está NO 1º semestre. É a
 * confusão entre estas duas contagens que produziu o off-by-one, e mantê-las
 * como funções separadas é o que impede que ela volte.
 *
 * Nunca ultrapassa a duração: no último semestre de um curso de 3, mostra
 * "3 de 3", não "4 de 3".
 */
export function semestreEmCurso(matricula: Matricula, agora: InstanteDaVida): number {
  const cursados = semestresCursados(matricula, agora);
  return Math.min(cursados + 1, matricula.duracaoSemestres);
}

/** Fração concluída, de 0 a 1 — para barra de progresso. */
export function progressoDaMatricula(matricula: Matricula, agora: InstanteDaVida): number {
  if (matricula.duracaoSemestres <= 0) return 1;
  return Math.min(1, semestresCursados(matricula, agora) / matricula.duracaoSemestres);
}

/** Ano de vida previsto para a conclusão. */
export function anoDeVidaDaConclusao(matricula: Matricula): number {
  return anoDoInstante(instanteDeConclusao(matricula));
}

/**
 * Duração total em texto: "1 ano e 6 meses", "4 anos".
 *
 * É o que torna o tempo interno visível ao jogador SEM transformar o jogo numa
 * simulação semestral: ele continua avançando de ano em ano e apenas lê que o
 * curso dura um ano e meio.
 */
export function descreverDuracaoTotal(matricula: Matricula): string {
  return descreverDuracaoEmSemestres(matricula.duracaoSemestres);
}

/** Tempo já cursado em texto: "cursando há 1 ano e 6 meses". */
export function descreverTempoCursado(
  matricula: Matricula,
  agora: InstanteDaVida
): string {
  return descreverDuracaoEmSemestres(semestresCursados(matricula, agora));
}

/**
 * A duração declarada é ímpar (meio ano)?
 *
 * Exposto porque é a característica que o modelo antigo não sabia representar,
 * e porque os testes precisam encontrar esses cursos sem citá-los pelo nome.
 */
export function duracaoTemMeioAno(matricula: Matricula): boolean {
  return matricula.duracaoSemestres % SEMESTRES_POR_ANO !== 0;
}
