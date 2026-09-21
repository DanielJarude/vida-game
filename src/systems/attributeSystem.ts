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

/** Idade em que o desgaste natural começa a ser perceptível. */
export const IDADE_INICIO_DESGASTE = 50;

/** Quanto de estresse se dissipa por ano quando nada o realimenta. */
export const ALIVIO_NATURAL_ESTRESSE = 3;

/**
 * Resiliência: o quanto a vida vivida protege (ou não) o corpo que
 * envelhece. 1 é o percurso neutro; abaixo de 1 o desgaste é mais lento,
 * acima de 1 é mais rápido.
 *
 * ESTE É O CONSERTO CENTRAL do envelhecimento. Antes, a perda de saúde
 * dependia exclusivamente da idade — condicionamento físico e estresse
 * entravam só como um bônus/castigo fixo de ±2 pontos. O efeito, medido em
 * 60 vidas simuladas: a saúde mediana ia de 100 aos 40 para 17 aos 80, a
 * mediana de morte era 80 anos e NINGUÉM passava dos 87, independentemente
 * de como tivesse vivido. Longevidade não era uma trajetória, era uma
 * contagem regressiva igual para todo mundo.
 *
 * Agora quem chegou aos 50 em forma, sem estresse crônico e sem condições
 * de saúde acumuladas envelhece a pouco mais de metade da velocidade de
 * quem chegou sedentário, esgotado e adoecido. A diferença entre as duas
 * trajetórias passa de zero para mais de uma década de vida.
 *
 * Os limites existem para que nenhum extremo vire imortalidade nem
 * sentença: por melhor que seja a vida, o corpo envelhece.
 */
export const RESILIENCIA_MINIMA = 0.55;
export const RESILIENCIA_MAXIMA = 1.6;

export function calcularResiliencia(personagem: Character): number {
  const { condicionamentoFisico, estresse } = personagem.hiddenStats;

  let fator = 1;
  // Condicionamento acima da média protege; abaixo, cobra.
  fator -= (condicionamentoFisico - 50) / 200;
  // Estresse crônico acelera o desgaste; tranquilidade o adia um pouco.
  fator += (estresse - 30) / 250;
  // Cada condição de saúde acumulada pesa.
  fator += personagem.doencas.length * 0.08;

  return clamp(fator, RESILIENCIA_MINIMA, RESILIENCIA_MAXIMA);
}

export function aplicarEnvelhecimentoAtributos(personagem: Character): {
  stats: VisibleStats;
  hiddenStats: HiddenStats;
} {
  const stats = { ...personagem.stats };
  const hidden = { ...personagem.hiddenStats };
  const idade = personagem.idade;

  // ------------------------------------------------- Desgaste natural
  // Curva contínua em vez de degraus por década: aos 50 a perda é quase
  // imperceptível e vai crescendo devagar. A curva anterior somava um
  // ponto inteiro a cada década cheia, o que fazia o aniversário de 60
  // custar mais caro que os nove anos anteriores juntos.
  if (idade >= IDADE_INICIO_DESGASTE) {
    const perdaBase = 0.9 + (idade - IDADE_INICIO_DESGASTE) * 0.075;
    const perdaSaude = (perdaBase + valorAleatorio() * 0.8) * calcularResiliencia(personagem);
    stats.saude = clamp(stats.saude - perdaSaude, 0, 100);

    const perdaAparencia = 0.8 + valorAleatorio() * 1.4;
    stats.aparencia = clamp(stats.aparencia - perdaAparencia, 0, 100);
  }

  // Impacto do estresse na saúde. Os valores caíram de −4 e −2 para −2,5 e
  // −1,5 depois de uma simulação: somados, os dois davam −6 por ano, o que
  // matava por negligência em dezessete anos. Descuido deve cobrar caro ao
  // longo de uma vida, não executar em menos de duas décadas.
  if (hidden.estresse > 75) {
    stats.saude = clamp(stats.saude - 2.5, 0, 100);
    stats.felicidade = clamp(stats.felicidade - 3, 0, 100);
  } else if (hidden.estresse < 25) {
    stats.felicidade = clamp(stats.felicidade + 2, 0, 100);
  }

  // Impacto do condicionamento físico na saúde. O corpo cuidado também
  // RECUPERA, não só resiste — é o que dá sentido a cuidar dele por
  // décadas em vez de só adiar o inevitável.
  //
  // Mas a recuperação cede com a idade: manter a forma aos 30 devolve
  // saúde, aos 80 apenas segura a queda. Sem esse decaimento, um perfil
  // muito cuidadoso ficava com saúde 100 aos 70 — imunidade ao tempo, que
  // é justamente o oposto de envelhecer bem.
  if (hidden.condicionamentoFisico > 70) {
    const recuperacao = 2 * Math.max(0, 1 - Math.max(0, idade - 45) / 55);
    stats.saude = clamp(stats.saude + recuperacao, 0, 100);
  } else if (hidden.condicionamentoFisico < 20 && idade >= 30) {
    stats.saude = clamp(stats.saude - 1.5, 0, 100);
  }

  // ---------------------------------------------------- Alívio natural
  // O estresse só subia. Nada no motor o reduzia com o tempo: sem uma
  // atividade deliberada do jogador, uma vida passiva chegava a 100 e
  // ficava lá para sempre, somando −2,5 de saúde por ano até o fim. Mas
  // pessoas se adaptam: o que não é realimentado, alivia.
  //
  // O alívio é pequeno de propósito — pressão contínua (privação,
  // trabalho pesado, cuidar de alguém) continua vencendo a recuperação e
  // mantendo o estresse alto. O que deixa de existir é a catraca.
  hidden.estresse = clamp(hidden.estresse - ALIVIO_NATURAL_ESTRESSE, 0, 100);

  // Desgaste leve de condicionamento se sedentário. O piso existe para
  // que uma vida longa sem atividade não zere o eixo e transforme a
  // resiliência num castigo travado no pior valor possível.
  if (hidden.condicionamentoFisico > 20) {
    hidden.condicionamentoFisico = clamp(hidden.condicionamentoFisico - 1, 0, 100);
  }

  return {
    stats: normalizarStats(stats),
    hiddenStats: normalizarHiddenStats(hidden)
  };
}
