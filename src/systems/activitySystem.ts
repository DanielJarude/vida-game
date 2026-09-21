/**
 * Sistema de Atividades.
 *
 * Concentra as REGRAS de uma atividade: quanto ela mexe em cada atributo,
 * se ela afeta a família e como o acontecimento é narrado na Linha da Vida.
 *
 * Extraído de `useGame.ts` no B4: balanceamento de jogo não pertence a um
 * hook de React. Aqui a regra é testável sem renderizar nada e pode ser
 * ajustada sem tocar na interface.
 */

import { ActivityOption } from '../data/activitiesData';
import { Character, HiddenStats, VisibleStats } from '../types';
import { randomInt } from '../utils/random';

/** Efeito bruto de uma atividade, antes de ser aplicado ao personagem. */
export interface EfeitoAtividade {
  stats: Partial<VisibleStats>;
  hiddenStats: Partial<HiddenStats>;
  /** Ganho de relacionamento aplicado a TODA a família (ex.: churrasco). */
  relacionamentoFamiliar: number;
}

const SEM_EFEITO: EfeitoAtividade = {
  stats: {},
  hiddenStats: {},
  relacionamentoFamiliar: 0
};

/**
 * Tabela de balanceamento. Mantida como dado, não como `switch`, para que
 * adicionar uma atividade seja uma linha nova e não um novo ramo de código.
 *
 * `felicidade` etc. são atributos visíveis; `estresse`, `empatia`,
 * `sociabilidade`, `condicionamentoFisico` e `reputacao` são internos e
 * continuam invisíveis para o jogador (decisão do B2/B3, preservada).
 */
type ReceitaAtividade = Omit<EfeitoAtividade, 'relacionamentoFamiliar'> & {
  relacionamentoFamiliar?: number;
  /** Quando o efeito tem variação aleatória, resolvida na aplicação. */
  saudeAleatoria?: [number, number];
};

const RECEITAS: Record<string, ReceitaAtividade> = {
  act_consulta_sus: {
    stats: { felicidade: 5 },
    hiddenStats: {},
    saudeAleatoria: [8, 15]
  },
  act_consulta_particular: {
    stats: { felicidade: 10 },
    hiddenStats: { estresse: -15 },
    saudeAleatoria: [18, 30]
  },
  act_terapia: {
    stats: { felicidade: 18 },
    hiddenStats: { estresse: -25, empatia: 8 }
  },
  act_academia: {
    stats: { felicidade: 8, saude: 10, aparencia: 6 },
    hiddenStats: { condicionamentoFisico: 14, estresse: -12 }
  },
  act_estetica: {
    stats: { felicidade: 12, aparencia: 14 },
    hiddenStats: {}
  },
  act_ferias_praia: {
    stats: { felicidade: 30 },
    hiddenStats: { estresse: -35 }
  },
  act_viagem_exterior: {
    stats: { felicidade: 45, inteligencia: 8 },
    hiddenStats: { estresse: -40, reputacao: 10 }
  },
  act_balada_barzinho: {
    stats: { felicidade: 18 },
    hiddenStats: { sociabilidade: 15, estresse: -10 }
  },
  act_churrasco: {
    stats: { felicidade: 20 },
    hiddenStats: { sociabilidade: 15, empatia: 10 },
    relacionamentoFamiliar: 10
  },
  act_voluntariado: {
    stats: { felicidade: 15 },
    hiddenStats: { empatia: 20, reputacao: 15 }
  },
  act_leitura: {
    stats: { felicidade: 5, inteligencia: 6 },
    hiddenStats: {}
  },
  act_meditacao: {
    stats: { felicidade: 8 },
    hiddenStats: { estresse: -20 }
  }
};

/** Resolve o efeito de uma atividade, incluindo variações aleatórias. */
export function calcularEfeitoAtividade(atividadeId: string): EfeitoAtividade {
  const receita = RECEITAS[atividadeId];
  if (!receita) return SEM_EFEITO;

  const stats: Partial<VisibleStats> = { ...receita.stats };
  if (receita.saudeAleatoria) {
    const [min, max] = receita.saudeAleatoria;
    stats.saude = (stats.saude ?? 0) + randomInt(min, max);
  }

  return {
    stats,
    hiddenStats: { ...receita.hiddenStats },
    relacionamentoFamiliar: receita.relacionamentoFamiliar ?? 0
  };
}

/**
 * Narração da atividade para a Linha da Vida.
 *
 * Crianças pequenas não "decidem" ir ao médico — quem leva são os
 * responsáveis. A frase muda para não soar absurda nessa fase.
 */
export function narrarAtividade(
  atividade: ActivityOption,
  personagem: Character
): string {
  if (personagem.idade < 6 && atividade.categoria === 'saude') {
    return `Seus responsáveis te levaram para: ${atividade.nome.toLowerCase()}.`;
  }
  return (
    NARRATIVAS[atividade.id] ||
    `Você dedicou tempo a: ${atividade.nome.toLowerCase()}.`
  );
}

const NARRATIVAS: Record<string, string> = {
  act_consulta_sus: 'Você fez um check-up no posto de saúde do bairro.',
  act_consulta_particular: 'Você consultou um médico particular.',
  act_terapia: 'Você foi a uma sessão de terapia.',
  act_academia: 'Você treinou na academia e cuidou do corpo.',
  act_estetica:
    'Você passou um dia cuidando da aparência no salão e na barbearia.',
  act_ferias_praia: 'Você passou as férias relaxando no litoral.',
  act_viagem_exterior: 'Você fez uma viagem internacional.',
  act_balada_barzinho: 'Você saiu com os amigos para um barzinho.',
  act_churrasco: 'Você organizou um churrasco em família.',
  act_voluntariado: 'Você dedicou tempo ao trabalho voluntário.',
  act_leitura: 'Você dedicou tempo à leitura.',
  act_meditacao: 'Você manteve a prática de meditação.'
};
