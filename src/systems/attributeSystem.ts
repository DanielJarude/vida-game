import { Character, HiddenStats, VisibleStats } from '../types';
import { clamp, valorAleatorio } from '../utils/random';

export function normalizarStats(stats: VisibleStats): VisibleStats {
  return {
    felicidade: clamp(stats.felicidade, 0, 100),
    saude: clamp(stats.saude, 0, 100),
    inteligencia: clamp(stats.inteligencia, 0, 100),
    aparencia: clamp(stats.aparencia, 0, 100)
  };
}

export function normalizarHiddenStats(stats: HiddenStats): HiddenStats {
  return {
    disciplina: clamp(stats.disciplina, 0, 100),
    sociabilidade: clamp(stats.sociabilidade, 0, 100),
    empatia: clamp(stats.empatia, 0, 100),
    ambicao: clamp(stats.ambicao, 0, 100),
    estresse: clamp(stats.estresse, 0, 100),
    reputacao: clamp(stats.reputacao, 0, 100),
    condicionamentoFisico: clamp(stats.condicionamentoFisico, 0, 100)
  };
}

export function aplicarEnvelhecimentoAtributos(personagem: Character): {
  stats: VisibleStats;
  hiddenStats: HiddenStats;
} {
  const stats = { ...personagem.stats };
  const hidden = { ...personagem.hiddenStats };
  const idade = personagem.idade;

  // Redução natural de saúde e aparência na velhice
  if (idade >= 50) {
    const fatorIdade = Math.floor((idade - 50) / 10);
    const perdaSaude = 1 + fatorIdade + valorAleatorio() * 2;
    stats.saude = clamp(stats.saude - perdaSaude, 0, 100);

    const perdaAparencia = 1 + valorAleatorio() * 2;
    stats.aparencia = clamp(stats.aparencia - perdaAparencia, 0, 100);
  }

  // Impacto do estresse na saúde
  if (hidden.estresse > 75) {
    stats.saude = clamp(stats.saude - 4, 0, 100);
    stats.felicidade = clamp(stats.felicidade - 3, 0, 100);
  } else if (hidden.estresse < 25) {
    stats.felicidade = clamp(stats.felicidade + 2, 0, 100);
  }

  // Impacto do condicionamento físico na saúde
  if (hidden.condicionamentoFisico > 70) {
    stats.saude = clamp(stats.saude + 2, 0, 100);
  } else if (hidden.condicionamentoFisico < 20 && idade >= 30) {
    stats.saude = clamp(stats.saude - 2, 0, 100);
  }

  // Desgaste leve de condicionamento se sedentário
  if (hidden.condicionamentoFisico > 30) {
    hidden.condicionamentoFisico = clamp(hidden.condicionamentoFisico - 1, 0, 100);
  }

  return {
    stats: normalizarStats(stats),
    hiddenStats: normalizarHiddenStats(hidden)
  };
}
