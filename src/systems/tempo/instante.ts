/**
 * REPRESENTAÇÃO CANÔNICA DE TEMPO — o instante da vida.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * O PROBLEMA QUE ESTE MÓDULO RESOLVE
 *
 * Antes, "ano" não era uma entidade: era a consequência de um clique em
 * "avançar". Cada sistema fazia sua própria aritmética temporal — a educação
 * somava semestres, a carreira subtraía anos de histórico, o harness comparava
 * `ano - anoIngresso` — e nenhuma dessas contas conhecia as outras. O
 * off-by-one da formatura nasceu exatamente daí: uma conta de tempo escrita
 * localmente, sem um conceito de tempo para se apoiar.
 *
 * Este módulo é esse conceito. Nada aqui depende de nenhum sistema do jogo;
 * é a base da pilha, como `politicaTrabalho` é para as regras de trabalho.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * UNIDADE INTERNA: O SEMESTRE
 *
 * Escolhida por ser a MENOR unidade que resolve todos os requisitos desta
 * fase, e não mais que isso:
 *
 *   · cursos de duração ímpar (3 semestres = 1 ano e meio) passam a ser
 *     representáveis sem arredondar para 1 nem para 2;
 *   · o catálogo já declara duração em semestres — a unidade do domínio já
 *     era essa, só não existia no motor;
 *   · períodos de consumo anual (vestibular, candidatura) são múltiplos
 *     exatos de semestre.
 *
 * Um calendário mensal completo resolveria os mesmos casos e traria doze vezes
 * mais estados, granularidade que nenhum requisito atual pede. Gestação (nove
 * meses) é o primeiro caso que vai apertar essa escolha, e está fora desta
 * fase — quando chegar, a decisão a tomar é trocar a constante
 * `SEMESTRES_POR_ANO` por uma unidade menor, e as operações deste módulo
 * continuam valendo porque nenhuma delas assume "2" fora daqui.
 *
 * TEMPO INTERNO ≠ TEMPO VISUAL
 *
 * O motor entende semestres; o jogador continua vivendo de ano em ano. Nada
 * aqui pede um clique a mais: a passagem de ano avança dois semestres de uma
 * vez. A precisão interna existe para que a interface possa dizer "cursando há
 * 1 ano e 6 meses" quando isso for relevante — e não para transformar o VIDA
 * numa simulação de calendário.
 */

/** Semestres em um ano de vida. Única definição desta constante no projeto. */
export const SEMESTRES_POR_ANO = 2;

/**
 * Um ponto no tempo, contado em semestres desde o ano 0.
 *
 * É um `number` por decisão: instantes precisam ser comparados, subtraídos e
 * ordenados o tempo todo, e um objeto `{ano, semestre}` tornaria cada uma
 * dessas operações uma chamada de função. Como número, `a < b` já é ordenação
 * cronológica correta — o que é exatamente o que a Linha da Vida vai precisar
 * para ordenar dois acontecimentos do mesmo ano.
 */
export type InstanteDaVida = number;

/** Metade do ano em que um instante cai. */
export type MetadeDoAno = 'primeiro' | 'segundo';

/**
 * Constrói um instante a partir de um ano de calendário.
 *
 * `metade` distingue os dois semestres do mesmo ano. O padrão é o primeiro:
 * quase tudo no jogo acontece na virada, e um chamador que não se importa com
 * a metade não deveria precisar informá-la.
 */
export function instanteDe(ano: number, metade: MetadeDoAno = 'primeiro'): InstanteDaVida {
  return ano * SEMESTRES_POR_ANO + (metade === 'segundo' ? 1 : 0);
}

/** Ano de calendário em que este instante cai. */
export function anoDoInstante(instante: InstanteDaVida): number {
  return Math.floor(instante / SEMESTRES_POR_ANO);
}

/** Em qual metade do ano este instante cai. */
export function metadeDoAno(instante: InstanteDaVida): MetadeDoAno {
  return instante % SEMESTRES_POR_ANO === 0 ? 'primeiro' : 'segundo';
}

/** Avança (ou recua, com valor negativo) um instante em semestres. */
export function somarSemestres(instante: InstanteDaVida, semestres: number): InstanteDaVida {
  return instante + semestres;
}

/** Avança um instante em anos inteiros. */
export function somarAnos(instante: InstanteDaVida, anos: number): InstanteDaVida {
  return instante + anos * SEMESTRES_POR_ANO;
}

/**
 * Quanto tempo separa dois instantes, em semestres. Positivo se `fim` é
 * posterior a `inicio`.
 *
 * É a operação que responde "quanto tempo passou desde X?" — hoje escrita à
 * mão em cada sistema, com uma convenção diferente em cada um.
 */
export function semestresEntre(inicio: InstanteDaVida, fim: InstanteDaVida): number {
  return fim - inicio;
}

/** O mesmo, em anos fracionários (3 semestres = 1.5 anos). */
export function anosEntre(inicio: InstanteDaVida, fim: InstanteDaVida): number {
  return semestresEntre(inicio, fim) / SEMESTRES_POR_ANO;
}

/**
 * Anos COMPLETOS entre dois instantes.
 *
 * Distinto de `anosEntre`: alguém que cursa há 1 ano e meio completou 1 ano.
 * É a conta certa para "idade", "tempo de casa", "anos de experiência" — todo
 * lugar onde meio ano não conta como ano.
 */
export function anosCompletosEntre(inicio: InstanteDaVida, fim: InstanteDaVida): number {
  return Math.floor(semestresEntre(inicio, fim) / SEMESTRES_POR_ANO);
}

/** `a` acontece antes de `b`? */
export function antesDe(a: InstanteDaVida, b: InstanteDaVida): boolean {
  return a < b;
}

/** Os dois instantes caem no mesmo semestre? (mesmo período de consumo) */
export function mesmoSemestre(a: InstanteDaVida, b: InstanteDaVida): boolean {
  return a === b;
}

/** Os dois instantes caem no mesmo ano de calendário? */
export function mesmoAno(a: InstanteDaVida, b: InstanteDaVida): boolean {
  return anoDoInstante(a) === anoDoInstante(b);
}

/**
 * Duração em texto para o jogador: "1 ano e 6 meses", "2 anos", "6 meses".
 *
 * Vive aqui, e não na camada de formatação, porque é a tradução direta da
 * unidade interna para a linguagem que o jogador usa — e é o ponto que garante
 * que meio semestre nunca apareça como "0 anos" nem seja arredondado para um
 * ano inteiro na tela.
 */
export function descreverDuracaoEmSemestres(semestres: number): string {
  if (semestres <= 0) return 'menos de 6 meses';

  const anos = Math.floor(semestres / SEMESTRES_POR_ANO);
  const meia = semestres % SEMESTRES_POR_ANO !== 0;

  const parteAnos = anos === 0 ? '' : anos === 1 ? '1 ano' : `${anos} anos`;
  if (!meia) return parteAnos;
  if (anos === 0) return '6 meses';
  return `${parteAnos} e 6 meses`;
}
