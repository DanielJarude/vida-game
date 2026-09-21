/**
 * calendario/janelas — quando um marco ainda cabe na vida (F3).
 *
 * Funções puras sobre idade e janela. Nenhuma delas sorteia nada: essa é a
 * característica que define esta camada. Um marco garantido ocorre porque a
 * janela está aberta e a condição vale, não porque ganhou um dado.
 *
 * Trabalha em IDADE, não em `InstanteDaVida`, porque janela de
 * desenvolvimento humano é expressa em anos ("entre 1 e 2 anos") e porque a
 * passagem de ano é a cadência em que o motor consulta isto. Os instantes
 * entram no registro de cumprimento, onde a resolução de semestre importa
 * para ordenar dois marcos do mesmo ano.
 */

import type { EstadoDeJanela, JanelaDeVida } from './tipos';

/** A idade já entrou na janela? */
export function entrouNaJanela(janela: JanelaDeVida, idade: number): boolean {
  return idade >= janela.idadeMinima;
}

/** A idade ainda cabe na janela? */
export function dentroDaJanela(janela: JanelaDeVida, idade: number): boolean {
  return idade >= janela.idadeMinima && idade <= janela.idadeMaxima;
}

/**
 * Este é o último ano em que o marco ainda cabe?
 *
 * É o gatilho que dá força ao modo `garantido`: enquanto a janela está
 * apenas `aberta`, o marco pode esperar o ano típico; quando ela está
 * `vencendo`, ele não pode mais adiar.
 */
export function janelaVencendo(janela: JanelaDeVida, idade: number): boolean {
  return idade === janela.idadeMaxima;
}

export function janelaPerdida(janela: JanelaDeVida, idade: number): boolean {
  return idade > janela.idadeMaxima;
}

export function estadoDaJanela(
  janela: JanelaDeVida,
  idade: number,
  cumprido: boolean
): EstadoDeJanela {
  if (cumprido) return 'cumprida';
  if (!entrouNaJanela(janela, idade)) return 'futura';
  if (janelaPerdida(janela, idade)) return 'perdida';
  if (janelaVencendo(janela, idade)) return 'vencendo';
  return 'aberta';
}

/**
 * Este ano é o momento preferencial para o marco ocorrer?
 *
 * Sem isto, todo marco garantido dispararia no primeiro ano da janela e a
 * infância viraria uma parede de modais: *Primeiros Passos* e *A Primeira
 * Palavra* dividem a janela 1-2 e sairiam juntos no ano 1.
 *
 * `idadeTipica` ausente = o primeiro ano da janela, que é o comportamento
 * mais simples e previsível para marcos que não dividem espaço com ninguém.
 */
export function idadePreferencial(janela: JanelaDeVida): number {
  return janela.idadeTipica ?? janela.idadeMinima;
}

/**
 * O marco deve ocorrer nesta idade?
 *
 * Duas situações, e nenhuma delas consulta aleatoriedade:
 *   1. chegou o ano típico;
 *   2. a janela está vencendo e ele ainda não aconteceu — última chamada.
 *
 * O segundo caso é o que garante que um marco não se perca porque a idade
 * típica passou despercebida (por exemplo, se a condição só passou a valer
 * depois dela).
 */
export function deveOcorrerAgora(janela: JanelaDeVida, idade: number): boolean {
  if (!dentroDaJanela(janela, idade)) return false;
  return idade >= idadePreferencial(janela) || janelaVencendo(janela, idade);
}
