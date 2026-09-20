/**
 * Apresentação por fase da vida (B4).
 *
 * A interface acompanha a vida: densidade, microcopy e blocos secundários
 * mudam conforme a fase. Isto é APRESENTAÇÃO — a elegibilidade de ações e
 * abas continua vindo exclusivamente de `systems/availabilitySystem`.
 *
 * Não contém regra de gameplay, não decide o que o jogador pode fazer.
 */

export type FaseApresentacao =
  | 'bebe'
  | 'primeira_infancia'
  | 'infancia'
  | 'adolescencia_inicial'
  | 'adolescencia_final'
  | 'adulto';

export interface PerfilDeFase {
  fase: FaseApresentacao;
  /** Rótulo curto da fase, para contexto na identidade. */
  rotulo: string;
  /** Texto de apoio da Linha da Vida nesta fase. */
  introTimeline: string;
  /** Blocos secundários que fazem sentido exibir na lateral. */
  mostrarAtributos: boolean;
  mostrarPersonalidade: boolean;
  mostrarRelacionamentos: boolean;
  /** Finanças na visão geral: um bebê não precisa de painel financeiro. */
  mostrarFinancas: boolean;
  /** Rótulo da ação de avanço de ano, coerente com a fase. */
  rotuloAvancar: string;
}

export function obterFaseApresentacao(idade: number): FaseApresentacao {
  if (idade <= 2) return 'bebe';
  if (idade <= 5) return 'primeira_infancia';
  if (idade <= 11) return 'infancia';
  if (idade <= 14) return 'adolescencia_inicial';
  if (idade <= 17) return 'adolescencia_final';
  return 'adulto';
}

const PERFIS: Record<FaseApresentacao, Omit<PerfilDeFase, 'fase'>> = {
  bebe: {
    rotulo: 'Primeiros anos',
    introTimeline: 'Os primeiros acontecimentos de uma vida que está começando.',
    mostrarAtributos: true,
    mostrarPersonalidade: false,
    mostrarRelacionamentos: true,
    mostrarFinancas: false,
    rotuloAvancar: '+ 1 ano'
  },
  primeira_infancia: {
    rotulo: 'Primeira infância',
    introTimeline: 'Brincadeiras, descobertas e as primeiras memórias.',
    mostrarAtributos: true,
    mostrarPersonalidade: true,
    mostrarRelacionamentos: true,
    mostrarFinancas: false,
    rotuloAvancar: '+ 1 ano'
  },
  infancia: {
    rotulo: 'Infância',
    introTimeline: 'Escola, amizades e os primeiros interesses.',
    mostrarAtributos: true,
    mostrarPersonalidade: true,
    mostrarRelacionamentos: true,
    mostrarFinancas: false,
    rotuloAvancar: '+ 1 ano'
  },
  adolescencia_inicial: {
    rotulo: 'Adolescência',
    introTimeline: 'Autonomia crescente e relações entre pares.',
    mostrarAtributos: true,
    mostrarPersonalidade: true,
    mostrarRelacionamentos: true,
    mostrarFinancas: false,
    rotuloAvancar: '+ 1 ano'
  },
  adolescencia_final: {
    rotulo: 'Adolescência',
    introTimeline: 'Formação e a transição para a vida adulta.',
    mostrarAtributos: true,
    mostrarPersonalidade: true,
    mostrarRelacionamentos: true,
    mostrarFinancas: true,
    rotuloAvancar: '+ 1 ano'
  },
  adulto: {
    rotulo: 'Vida adulta',
    introTimeline: 'As escolhas se acumulam e começam a formar uma trajetória.',
    mostrarAtributos: true,
    mostrarPersonalidade: true,
    mostrarRelacionamentos: true,
    mostrarFinancas: true,
    rotuloAvancar: '+ 1 ano'
  }
};

export function obterPerfilDeFase(idade: number): PerfilDeFase {
  const fase = obterFaseApresentacao(idade);
  return { fase, ...PERFIS[fase] };
}

/**
 * Finanças na visão geral só aparecem quando a fase pede OU quando existe
 * patrimônio/saldo real que o jogador precisa enxergar. Nunca inventa valores.
 */
export function deveMostrarFinancasNaVisaoGeral(
  idade: number,
  temPatrimonio: boolean
): boolean {
  return obterPerfilDeFase(idade).mostrarFinancas || temPatrimonio;
}
