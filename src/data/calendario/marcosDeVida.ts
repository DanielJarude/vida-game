/**
 * data/calendario/marcosDeVida — quais marcos a vida garante (F3).
 *
 * DADO, não código. Acrescentar um marco é acrescentar uma entrada; nenhuma
 * lógica do motor muda. É a mesma disciplina de `REQUISITOS_PROFISSIONAIS`
 * (Fase 1) e do catálogo de cursos: regra declarativa, motor genérico.
 *
 * CRITÉRIO DE ENTRADA — e ele é deliberadamente exigente:
 *
 *   1. o fato precisa ser universal ou quase, dentro da condição declarada.
 *      Aprender a andar e a falar é desenvolvimento humano; ganhar na
 *      loteria não é marco, é sorte.
 *   2. já precisa existir conteúdo escrito no catálogo. O calendário decide
 *      QUE acontece; o texto continua sendo o que já estava lá e testado.
 *   3. o motor não pode já estar garantindo aquilo por conta própria. A
 *      formatura, por exemplo, NÃO entra aqui: `educationSystem` já a emite
 *      em 100% das vidas que concluem um curso. Duplicar viraria dois logs
 *      para o mesmo fato.
 *
 * Esta lista começa curta de propósito. Marco garantido é um instrumento
 * forte: cada entrada é um modal ou uma linha que TODO jogador verá em TODA
 * vida. Inflar isto transformaria a infância numa esteira de cerimônias —
 * exatamente o oposto de "a vida acontece; às vezes você decide".
 */

import type { MarcoDeVida } from '../../systems/calendario/tipos';

export const MARCOS_DE_VIDA: readonly MarcoDeVida[] = [
  /**
   * Primeiros passos — MARCO SEM ESCOLHA (canário da Revisão 2).
   *
   * Auditei as duas opções antes de classificar. Elas são "correr tropeçando
   * para os braços deles" e "preferir continuar engatinhando no seu ritmo".
   * Não há decisão genuína ali: um bebê de 1 ano não delibera sobre quando
   * vai andar, e a segunda opção estava escrita como deliberação ("preferir")
   * apenas porque nasceu botão numa época em que todo o catálogo era escolha.
   *
   * Então este é um marco testemunhado: acontece, é narrado, entra na Linha
   * da Vida com ênfase, e não pergunta nada a ninguém. O desfecho continua
   * variando entre as duas descrições — o que dá variação real sem fingir
   * agência.
   *
   * Idade típica 1: andar vem antes de falar.
   */
  {
    id: 'marco_primeiros_passos',
    conteudoId: 'inf_primeiros_passos',
    janela: { idadeMinima: 1, idadeMaxima: 2, idadeTipica: 1 },
    modo: 'garantido',
    temEscolha: false
  },

  /**
   * A primeira palavra — MARCO COM ESCOLHA BIOGRÁFICA (canário principal).
   *
   * Que a criança comece a falar é desenvolvimento: garantido. QUAL foi a
   * primeira palavra é do jogador — e as duas opções já existem escritas no
   * catálogo ("o nome de quem cuida de você" × "o nome da coisa que você
   * queria"). É pequeno, é identidade, é memorável.
   *
   * E não move personalidade nenhuma, por decisão explícita (Revisão 1):
   * responder "mamãe" em vez de "bola" não torna a pessoa mais empática.
   * A regra é imposta pelo motor, não pela boa vontade do catálogo.
   *
   * Idade típica 2, um ano depois dos primeiros passos, para que os dois
   * marcos da mesma janela não caiam no mesmo ano.
   */
  {
    id: 'marco_primeira_palavra',
    conteudoId: 'bb_primeira_palavra',
    janela: { idadeMinima: 1, idadeMaxima: 2, idadeTipica: 2 },
    modo: 'garantido',
    temEscolha: true
  },

  /**
   * Primeiro dia no Ensino Fundamental — GARANTIDO.
   *
   * O caso que melhor expõe o defeito que esta fase corrige: o FATO já é
   * universal (as 105 vidas medidas têm o log "ingressou no 1º ano do Ensino
   * Fundamental", emitido pelo `educationSystem`), mas a NARRATIVA daquele
   * dia dependia de sorteio e aparecia numa fração das vidas. Fato garantido,
   * história aleatória.
   *
   * Aqui os dois passam a andar juntos. Não há duplicação: o log do
   * `educationSystem` registra a matrícula; este marco narra o primeiro dia.
   *
   * Testemunhado. Auditei as opções: "conversar com todo mundo", "sentar na
   * primeira carteira", "chorar com saudades de casa" — são temperamentos de
   * uma criança de 6 anos diante de uma situação nova, não escolhas de vida.
   * Tratá-las como decisão seria pedir a uma criança de seis anos que
   * definisse a própria personalidade num modal.
   */
  {
    id: 'marco_primeiro_dia_escola',
    conteudoId: 'inf_primeiro_dia_escola',
    janela: { idadeMinima: 6, idadeMaxima: 7, idadeTipica: 6 },
    modo: 'garantido',
    temEscolha: false
  },

] as const;

/** Índice por id de conteúdo — evita varrer a lista a cada consulta. */
const POR_CONTEUDO = new Map(MARCOS_DE_VIDA.map(m => [m.conteudoId, m]));

/**
 * Este conteúdo é conduzido pelo calendário?
 *
 * Consultado pelo sorteio: conteúdo de marco precisa sair do pool aleatório,
 * senão ele poderia ocorrer duas vezes — uma por sorte, outra por janela.
 */
export function ehConteudoDeMarco(conteudoId: string): boolean {
  return POR_CONTEUDO.has(conteudoId);
}

export function marcoDoConteudo(conteudoId: string): MarcoDeVida | undefined {
  return POR_CONTEUDO.get(conteudoId);
}
