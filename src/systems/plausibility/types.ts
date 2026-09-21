/**
 * Camada de PLAUSIBILIDADE — o contrato.
 *
 * `availabilitySystem` responde "posso clicar?" (idade mínima, saldo, repetição
 * anual). Esta camada responde uma pergunta diferente e mais profunda:
 *
 *     isto pode acontecer com ESTA pessoa, AGORA, com a trajetória que ela tem?
 *
 * A auditoria de coerência humana mediu o custo de não ter essa distinção: uma
 * pessoa formada apenas em Pedagogia era contratada como Médica Clínica Geral,
 * e um rapaz de 18 anos sem experiência virava Mestre de Obras a R$ 7.500/mês.
 * Em ambos os casos o motor conferiu apenas idade e NÍVEL de escolaridade —
 * as duas únicas perguntas que ele sabia fazer.
 *
 * O erro de arquitetura não era a falta de um `if`. Era o tipo de retorno:
 * `boolean`. Um booleano não consegue distinguir "isso é logicamente
 * impossível" de "isso é ilegal" de "isso exige um diploma que você pode
 * conquistar" de "isso é raro, mas acontece". São quatro situações com
 * consequências narrativas e mecânicas completamente diferentes, e achatá-las
 * em `permitido = true/false` é o que obriga a reescrever tudo depois.
 *
 * Por isso o veredito aqui é GRADUADO.
 */

/**
 * O grau de um veredito, do mais duro ao mais brando.
 *
 * A ordem da união importa: `GRAVIDADE_DO_GRAU` abaixo depende dela para
 * combinar vereditos (o pior grau sempre vence).
 */
export type GrauDePlausibilidade =
  /**
   * Logicamente ou biologicamente incompatível. Não existe caminho, esforço
   * ou sorte que leve a este estado a partir do estado atual.
   *
   * Exemplo real do jogo: uma vaga que exige 8 anos de experiência para uma
   * pessoa de 18 anos. Mesmo que ela trabalhasse desde a idade legal mínima,
   * não teria como ter acumulado esse tempo. Não é falta de requisito: é
   * aritmética do tempo de vida.
   */
  | 'impossivel'
  /**
   * Fisicamente possível, mas vedado por regra legal ou regulatória.
   *
   * Exemplo real do jogo: exercer Medicina sem ter cursado Medicina. Não é um
   * "requisito que falta" no sentido de um crachá — é exercício ilegal de
   * profissão regulamentada. Hoje isto bloqueia a contratação formal, mas o
   * grau existe separado justamente porque no futuro o personagem poderá
   * TENTAR agir irregularmente e assumir o risco. Quando essa camada chegar,
   * nada aqui precisa ser reescrito: só muda quem decide bloquear.
   */
  | 'irregular'
  /**
   * Possível e legal, mas falta um requisito objetivo e conquistável:
   * escolaridade, formação, experiência, licença.
   *
   * É o único grau que carrega uma lista acionável do que fazer para sair
   * dele — é isto que a interface mostra ao jogador como caminho.
   */
  | 'requisito'
  /**
   * Todos os requisitos duros estão satisfeitos, mas a combinação é atípica.
   *
   * NÃO BLOQUEIA. O improvável precisa continuar acontecendo — é dele que
   * nascem as histórias que valem a pena contar. O que ele faz é reduzir a
   * chance no processo seletivo, via `modificadorDeChance`.
   */
  | 'improvavel'
  /** Requisitos satisfeitos dentro do esperado. */
  | 'permitido';

/** Quanto mais alto, mais grave. Usado para combinar vereditos. */
const GRAVIDADE_DO_GRAU: Record<GrauDePlausibilidade, number> = {
  permitido: 0,
  improvavel: 1,
  requisito: 2,
  irregular: 3,
  impossivel: 4
};

/**
 * Um requisito específico que não foi atendido.
 *
 * `codigo` é estável e nunca é exibido — serve para teste, telemetria e para
 * a interface escolher ícone/agrupamento. `descricao` é o texto em pt-BR que
 * o jogador lê.
 */
export interface RequisitoNaoAtendido {
  codigo: CodigoRequisito;
  grau: GrauDePlausibilidade;
  descricao: string;
  /** O que o personagem tem hoje (para a interface mostrar a distância). */
  atual?: string | number;
  /** O que a oportunidade exige. */
  exigido?: string | number;
}

export type CodigoRequisito =
  | 'idade_minima'
  | 'idade_maxima'
  | 'escolaridade'
  | 'formacao_area'
  | 'formacao_nivel'
  | 'licenca_profissional'
  | 'experiencia'
  | 'experiencia_impossivel_para_a_idade'
  | 'matricula_superior'
  | 'aptidao'
  | 'estado_invalido';

/**
 * O resultado de uma avaliação de plausibilidade.
 *
 * Funções que produzem `Veredito` são PURAS: não sorteiam, não alteram estado
 * e não decidem resultado. Elas apenas descrevem a relação entre um
 * personagem e uma oportunidade.
 */
export interface Veredito {
  grau: GrauDePlausibilidade;
  /** Vazio quando `grau` é `permitido`. */
  requisitosFaltantes: RequisitoNaoAtendido[];
  /**
   * Multiplicador aplicado à chance de sucesso de um eventual processo
   * seletivo. 1 = sem penalidade. Só é menor que 1 no grau `improvavel`.
   */
  modificadorDeChance: number;
  /** Primeira razão legível, pronta para a interface. `undefined` se permitido. */
  motivo?: string;
}

// ---------------------------------------------------------------------------
// Construtores e combinadores — puros
// ---------------------------------------------------------------------------

export const PERMITIDO: Veredito = Object.freeze({
  grau: 'permitido',
  requisitosFaltantes: [],
  modificadorDeChance: 1
});

export function vereditoDe(
  requisitos: RequisitoNaoAtendido[],
  modificadorDeChance = 1
): Veredito {
  if (requisitos.length === 0) {
    return modificadorDeChance === 1
      ? PERMITIDO
      : { grau: 'permitido', requisitosFaltantes: [], modificadorDeChance };
  }

  const pior = requisitos.reduce((acc, r) =>
    GRAVIDADE_DO_GRAU[r.grau] > GRAVIDADE_DO_GRAU[acc.grau] ? r : acc
  );

  return {
    grau: pior.grau,
    requisitosFaltantes: requisitos,
    modificadorDeChance: pior.grau === 'improvavel' ? modificadorDeChance : 0,
    motivo: pior.descricao
  };
}

/** Combina vereditos independentes: o pior grau vence, os motivos se somam. */
export function combinarVereditos(vereditos: Veredito[]): Veredito {
  const requisitos = vereditos.flatMap(v => v.requisitosFaltantes);
  const modificador = vereditos.reduce((acc, v) => acc * v.modificadorDeChance, 1);
  return vereditoDe(requisitos, modificador);
}

/**
 * Este veredito impede a EFETIVAÇÃO de uma conquista formal?
 *
 * `improvavel` responde `false` de propósito: ele é raro, não proibido.
 *
 * `irregular` responde `true` hoje porque a única via modelada é a formal (um
 * hospital não contrata quem não pode exercer). Quando existir a via informal
 * — trabalhar sem registro assumindo risco — este é o ÚNICO ponto que muda.
 */
export function bloqueiaEfetivacao(veredito: Veredito): boolean {
  return (
    veredito.grau === 'impossivel' ||
    veredito.grau === 'irregular' ||
    veredito.grau === 'requisito'
  );
}

/**
 * O personagem pode ao menos TENTAR?
 *
 * Separado de `bloqueiaEfetivacao` de propósito. Elegibilidade responde
 * "pode tentar"; ela nunca responde "conseguiu". Quem responde "conseguiu" é
 * o processo seletivo (ver `systems/career/processoSeletivo`).
 */
export function podeTentar(veredito: Veredito): boolean {
  return !bloqueiaEfetivacao(veredito);
}

/** Requisitos agrupados por código, para a interface. */
export function descreverRequisitos(veredito: Veredito): string[] {
  return veredito.requisitosFaltantes.map(r => r.descricao);
}
