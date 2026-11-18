/**
 * VIDA 26 — DO CORPO ÀS CAPACIDADES. Três camadas que se relacionam, mas não são sinônimos:
 *
 *   1. CONSTITUIÇÃO herdada (`Visual.corpo23`, VIDA 23/24): estatura, estrutura óssea, ombros, tórax, quadril, comprimento
 *      das pernas, facilidade de ganhar músculo. Predisposição: não muda depois de adulto;
 *   2. CONDIÇÃO corporal (`Corpo.composicao24` e `Corpo.forma`): gordura, músculo, condicionamento, saúde — a vida muda;
 *   3. CAPACIDADES físicas (este módulo): força, potência, velocidade, aceleração, resistência, agilidade, impulsão,
 *      equilíbrio, alcance e recuperação. São DERIVADAS (nada é guardado): leem a constituição, a condição, a idade e a
 *      maturação. O esporte lê as capacidades nos atributos físicos de cada modalidade (`atributosEsportivos`).
 *
 * Cada relação é pequena e tem razão física (tabela `RELACOES26`, que a tela mostra): pernas longas alongam a passada;
 * músculo dá força e potência; gordura acima da média pesa na velocidade, na aceleração e no salto; o condicionamento é a
 * resistência e a recuperação; a estatura dá alcance e cobra um pouco de agilidade e de aceleração. A criança e o
 * adolescente ainda não têm a força nem o fôlego do adulto (a maturação), por mais que treinem: a coordenação e a
 * agilidade amadurecem antes. Depois dos 30, o corpo cobra — primeiro a explosão, depois a força.
 *
 * Nenhuma capacidade bloqueia coisa alguma: são números que somam ou tiram um pouco em cada atributo físico.
 * Folha (sem importações de tempo de execução).
 */

export type Capacidade26 = 'forca' | 'potencia' | 'velocidade' | 'aceleracao' | 'resistencia' | 'agilidade' | 'impulsao' | 'equilibrio' | 'alcance' | 'recuperacao';
export const CAPACIDADES26: Capacidade26[] = ['forca', 'potencia', 'velocidade', 'aceleracao', 'resistencia', 'agilidade', 'impulsao', 'equilibrio', 'alcance', 'recuperacao'];

export const NOME_CAPACIDADE26: Record<Capacidade26, string> = {
  forca: 'Força', potencia: 'Potência', velocidade: 'Velocidade', aceleracao: 'Aceleração', resistencia: 'Resistência',
  agilidade: 'Agilidade', impulsao: 'Impulsão', equilibrio: 'Equilíbrio', alcance: 'Alcance', recuperacao: 'Recuperação'
};

/** O que pesa em cada capacidade, em palavras (a tela explica com isto; a conta está em `capacidades26`). */
export const RELACOES26: Record<Capacidade26, string> = {
  forca: 'Massa muscular (o que mais pesa), estrutura óssea e ombros; amadurece até uns 18 anos e cai devagar depois dos 35.',
  potencia: 'Massa muscular e condicionamento; gordura acima da média tira um pouco. Cai cedo, depois dos 30.',
  velocidade: 'Comprimento das pernas (a passada), músculo e condicionamento; gordura acima da média pesa.',
  aceleracao: 'Músculo e condicionamento; corpos muito altos ou pesados demoram mais a arrancar.',
  resistencia: 'Condicionamento (quase tudo), saúde; gordura e músculo demais custam fôlego.',
  agilidade: 'Condicionamento; quem é mais baixo e mais leve muda de direção mais fácil. Amadurece cedo.',
  impulsao: 'Pernas, músculo e condicionamento; gordura acima da média pesa no salto.',
  equilibrio: 'Quadril e estrutura (a base), centro de gravidade mais baixo, condicionamento.',
  alcance: 'Estatura (a de agora: a criança ainda cresce), ombros e comprimento dos membros.',
  recuperacao: 'Saúde e condicionamento; a idade cobra a partir dos 28.'
};

/** As entradas: a constituição (−2..+2 por eixo), a condição e a idade. */
export interface EntradaCapacidades26 {
  idade: number;
  /** Eixos da constituição (−2..+2). */
  c: { estatura: number; estrutura: number; ombros: number; peito: number; quadril: number; pernas: number; musculo: number };
  /** Gordura e músculo (`Composicao24`). */
  g: number;
  m: number;
  /** Condicionamento e saúde (0..100). */
  forma: number;
  saude: number;
  /** A estatura de agora e a adulta, em desvios da média adulta do gênero (a criança fica abaixo pelo crescimento). */
  zAgora: number;
  zAdulta: number;
}

const lim = (x: number, a = 1, b = 99) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : 50));
const linear = (i: number, de: number, ate: number, v0: number) => (i >= ate ? 1 : i <= de ? v0 : v0 + (i - de) / (ate - de) * (1 - v0));

/** A maturação de cada capacidade (0..1): a força e o fôlego adultos chegam por volta dos 18; a agilidade, antes. */
export function maturacao26(i: number) {
  return {
    forca: linear(i, 8, 18, 0.4), resistencia: linear(i, 8, 17, 0.62), velocidade: linear(i, 8, 16, 0.62),
    agilidade: linear(i, 6, 14, 0.75), equilibrio: linear(i, 6, 14, 0.8)
  };
}

/** O que a idade cobra de cada capacidade (pontos a menos), depois do auge. */
function envelhecimento(i: number) {
  const depois = (a: number, k: number) => Math.max(0, i - a) * k;
  return { explosao: depois(30, 0.8), forca: depois(35, 0.6), resistencia: depois(35, 0.5), agilidade: depois(32, 0.6), recuperacao: depois(28, 0.9) };
}

export function capacidades26(x: EntradaCapacidades26): Record<Capacidade26, number> {
  const { c, g, m, forma: F, saude: S, idade: i } = x;
  const gord = Math.max(0, g);
  const mat = maturacao26(i);
  const vel = envelhecimento(i);
  const musculoDemais = Math.max(0, m - 1.6);
  const r = {
    forca: (35 + m * 14 + c.estrutura * 2.5 + c.ombros * 1.5 + x.zAdulta * 1.5 + (F - 50) * 0.15) * mat.forca - vel.forca,
    potencia: (40 + m * 10 + (F - 50) * 0.2 - gord * 6) * mat.forca - vel.explosao,
    velocidade: (48 + c.pernas * 3 + m * 4 - gord * 8 + (F - 50) * 0.3) * mat.velocidade - vel.explosao,
    aceleracao: (50 + m * 5 - gord * 8 - Math.max(0, x.zAdulta) * 2.5 + Math.max(0, -x.zAdulta) * 1.5 + (F - 50) * 0.25) * mat.velocidade - vel.explosao,
    resistencia: (25 + F * 0.65 - gord * 5 - musculoDemais * 4 + (S - 70) * 0.1) * mat.resistencia - vel.resistencia,
    agilidade: (52 - Math.max(0, x.zAdulta) * 3.5 + Math.max(0, -x.zAdulta) * 1.5 - gord * 7 + (F - 50) * 0.2) * mat.agilidade - vel.agilidade,
    impulsao: (45 + c.pernas * 3 + m * 5 - gord * 8 + (F - 50) * 0.2) * mat.velocidade - vel.explosao,
    equilibrio: (50 + c.quadril * 1.5 + c.estrutura * 1 - x.zAdulta * 1.5 + (F - 50) * 0.15) * mat.equilibrio,
    alcance: 50 + x.zAgora * 12 + c.ombros * 2 + c.pernas * 1,
    recuperacao: 35 + S * 0.25 + F * 0.25 - gord * 3 - vel.recuperacao
  };
  return Object.fromEntries(CAPACIDADES26.map(k => [k, Math.round(lim(r[k]) * 10) / 10])) as Record<Capacidade26, number>;
}

/**
 * A régua: as capacidades do atleta PROFISSIONAL médio (constituição média, o músculo e a pouca gordura de quem treina
 * todo dia, condicionamento de atleta — calibrada na simulação de carreiras: o profissional médio fica com efeito ~0).
 * O atributo físico do esporte soma (ou tira) a distância até ela — o atleta médio fica na técnica, como antes da VIDA 26.
 */
export const REFERENCIA26: Record<Capacidade26, number> = capacidades26({
  idade: 25, c: { estatura: 0, estrutura: 0, ombros: 0, peito: 0, quadril: 0, pernas: 0, musculo: 0 }, g: -0.8, m: 1.6, forma: 90, saude: 85, zAgora: 0, zAdulta: 0
});

/** Uma leitura em palavras (0..100). */
export const leituraCapacidade26 = (x: number) => (x >= 75 ? 'excelente' : x >= 62 ? 'boa' : x >= 48 ? 'média' : x >= 35 ? 'abaixo da média' : 'baixa');

/**
 * O que cada eixo da constituição faz nas capacidades (a mesma conta de `capacidades26`, em palavras — a criação de
 * personagem mostra isto ao lado de cada escolha). Os eixos de distribuição só dizem ONDE a gordura vai.
 */
export const EIXO_NAS_CAPACIDADES26: Record<string, string> = {
  estatura: 'Mais alcance; um pouco menos de agilidade e de arrancada; um pouco mais de força.',
  estrutura: 'Mais força e equilíbrio.',
  ombros: 'Um pouco mais de força e de alcance.',
  peito: 'A proporção do tronco: muda a silhueta, não as capacidades.',
  quadril: 'Um pouco mais de equilíbrio (a base).',
  pernas: 'Passada maior: velocidade, impulsão e alcance.',
  musculo: 'O treino vira músculo mais rápido: força, potência, velocidade e impulsão sobem mais com o mesmo treino.',
  cintura: 'Só diz onde a gordura vai. A quantidade de gordura — que pesa na velocidade e no fôlego — depende da vida.',
  barriga: 'Só diz onde a gordura vai. A quantidade de gordura — que pesa na velocidade e no fôlego — depende da vida.',
  coxas: 'Só diz onde a gordura vai. A quantidade de gordura — que pesa na velocidade e no fôlego — depende da vida.',
  bracos: 'Só diz onde a gordura vai. A quantidade de gordura — que pesa na velocidade e no fôlego — depende da vida.',
  panturrilhas: 'O formato da perna de baixo; a quantidade de gordura depende da vida.'
};
