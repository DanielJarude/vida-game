/**
 * REGRAS LEGAIS POR LUGAR — idade e etapas que a lei fixa.
 *
 * Algumas regras são nacionais (a maioridade no Brasil), outras são de
 * estado/província (a carteira de motorista nos EUA, no Canadá e na
 * Austrália). A resolução é hierárquica e única:
 *
 *   universal (abaixo) → país (`PerfilDePais.regras`) → divisão (`REGRAS_DAS_DIVISOES`)
 *
 * Quem pergunta "com que idade dá para..." pergunta AQUI — a ação, a tela,
 * a elegibilidade e o texto. Nada de `if (país)` nas telas.
 *
 * Abstração declarada: o jogo anda por ano, então uma idade de meio ano
 * (15½ na Califórnia) vira o ano cheio seguinte (16) — nunca antes do que a
 * lei permite. Não é um simulador de DETRAN/DMV: só as etapas que mudam o
 * que a pessoa pode fazer (dirigir acompanhada, dirigir sozinha, licença
 * sem restrição). Fontes: IIHS (Graduated Driver Licensing, 2024) para os
 * estados americanos; os governos provinciais/estaduais (Canadá, Austrália);
 * DVLA (Reino Unido); Fahrerlaubnis-Verordnung (Alemanha, BF17); Code de la
 * route (França, permis à 17 ans desde 2024); CTB art. 140 e 148 (Brasil).
 */

import type { Vida } from '../tipos';
import { lugarDe, sobrepor, type Lugar } from './escopo';
import { perfilDoPais, temPerfil } from './registro';

export interface RegraDeDirecao {
  /** O documento, como se diz em português ("carteira de motorista"; no Brasil, "CNH"). */
  nome: string;
  /** Dirigir ACOMPANHADO, com permissão de aprendiz (learner's permit, BF17, conduite accompagnée). */
  aprendiz?: { idade: number; nome: string };
  /** Dirigir SOZINHO com restrições (licença provisória/graduada; no Brasil, a Permissão para Dirigir). */
  provisoria?: { idade: number; nome: string };
  /** A licença sem restrições. */
  plena: number;
  /** A escola de direção é obrigatória (no Brasil, sim; nos EUA, a prova é no órgão de trânsito e a aula é opcional). */
  autoescolaObrigatoria: boolean;
}

export interface RegrasLegais {
  /** Maioridade civil: contratos, imóvel, empréstimo, morar sozinho. */
  maioridade: number;
  /** Idade mínima para trabalhar; e a porta antes dela, quando a lei tem uma (no Brasil, o jovem aprendiz aos 14). */
  trabalho: { minima: number; aprendiz?: { idade: number; nome: string } };
  direcao: RegraDeDirecao;
  /** Até que idade a escola é obrigatória (quem tem menos não pode largar). */
  escolaObrigatoriaAte: number;
  /** A partir de quando se entra em bar e balada (a idade para beber, onde ela manda). */
  vidaNoturna: number;
  /** Filiação a partido. */
  filiacao: number;
}

/**
 * O UNIVERSAL: a forma mais comum no mundo, usada onde o perfil não diz
 * outra coisa. Trabalho aos 16 (Convenção 138 da OIT admite 15; a maioria
 * dos países fica em 15–16), carteira aos 18, escola até os 16.
 */
export const REGRAS_UNIVERSAIS: RegrasLegais = {
  maioridade: 18,
  trabalho: { minima: 16 },
  direcao: { nome: 'carteira de motorista', plena: 18, autoescolaObrigatoria: false },
  escolaObrigatoriaAte: 16,
  vidaNoturna: 18,
  filiacao: 18
};

/** As regras de um país, por cima das universais (o que o país muda). */
export type RegrasDoPais = Partial<Omit<RegrasLegais, 'direcao'>> & { direcao?: Partial<RegraDeDirecao> };

/**
 * Onde a regra é da DIVISÃO (estado, província), não do país. Só a
 * carteira de motorista chega a esse nível no jogo. [aprendiz, sozinho, plena].
 */
type Graduada = [aprendiz: number, sozinho: number, plena: number];
const graduada = ([a, s, p]: Graduada, nomes: [string, string]): Partial<RegraDeDirecao> =>
  ({ aprendiz: { idade: a, nome: nomes[0] }, provisoria: { idade: s, nome: nomes[1] }, plena: p });
const EUA: [string, string] = ['permissão de aprendiz (learner’s permit)', 'licença provisória'];
const CANADA: [string, string] = ['licença de aprendiz', 'licença provisória'];
const AUSTRALIA: [string, string] = ['licença de aprendiz (L)', 'licença provisória (P)'];
export const REGRAS_DAS_DIVISOES: Record<string, { direcao: Partial<RegraDeDirecao> }> = {
  // Estados Unidos (IIHS GDL): permit, intermediate, full. Meio ano arredonda para cima.
  'US-CA': { direcao: graduada([16, 16, 18], EUA) },
  'US-NY': { direcao: graduada([16, 17, 18], EUA) },
  'US-IL': { direcao: graduada([15, 16, 18], EUA) },
  'US-TX': { direcao: graduada([15, 16, 18], EUA) },
  'US-DC': { direcao: graduada([16, 17, 18], EUA) },
  'US-FL': { direcao: graduada([15, 16, 18], EUA) },
  'US-GA': { direcao: graduada([15, 16, 18], EUA) },
  'US-WA': { direcao: graduada([15, 16, 18], EUA) },
  'US-OH': { direcao: graduada([16, 16, 18], EUA) },
  'US-OR': { direcao: graduada([15, 16, 18], EUA) },
  'US-KY': { direcao: graduada([16, 17, 17], EUA) },
  'US-NJ': { direcao: graduada([16, 17, 18], EUA) },
  'US-MT': { direcao: graduada([15, 15, 16], EUA) },
  // Canadá (G1/G2/G em Ontário; Classe 5 L/N em BC; Classe 7/5-GDL em Alberta; apprenti/probatoire no Quebec).
  'CA-ON': { direcao: graduada([16, 17, 18], CANADA) },
  'CA-BC': { direcao: graduada([16, 17, 19], CANADA) },
  'CA-AB': { direcao: graduada([14, 16, 18], CANADA) },
  'CA-QC': { direcao: graduada([16, 17, 19], CANADA) },
  'CA-MB': { direcao: graduada([16, 16, 18], CANADA) },
  'CA-SK': { direcao: graduada([16, 17, 18], CANADA) },
  'CA-NS': { direcao: graduada([16, 17, 19], CANADA) },
  // Austrália: L aos 16 (ACT 15¾ → 16), P1 aos 17 (Vitória aos 18; NT 16½ → 17); a licença plena depois dos anos de P.
  'AU-NSW': { direcao: graduada([16, 17, 20], AUSTRALIA) },
  'AU-VIC': { direcao: graduada([16, 18, 22], AUSTRALIA) },
  'AU-QLD': { direcao: graduada([16, 17, 20], AUSTRALIA) },
  'AU-WA': { direcao: graduada([16, 17, 19], AUSTRALIA) },
  'AU-SA': { direcao: graduada([16, 17, 19], AUSTRALIA) },
  'AU-TAS': { direcao: graduada([16, 17, 20], AUSTRALIA) },
  'AU-ACT': { direcao: graduada([16, 17, 20], AUSTRALIA) },
  'AU-NT': { direcao: graduada([16, 17, 19], AUSTRALIA) }
};

/** As regras de um lugar: universal → país → divisão. */
export function regrasDoLugar(l: Lugar): RegrasLegais {
  const doPais: RegrasDoPais | undefined = temPerfil(l.pais) ? perfilDoPais(l.pais).regras : undefined;
  const daDivisao = REGRAS_DAS_DIVISOES[l.divisao];
  const base = sobrepor(REGRAS_UNIVERSAIS, doPais && { ...doPais, direcao: undefined, trabalho: undefined });
  return {
    ...base,
    trabalho: sobrepor(REGRAS_UNIVERSAIS.trabalho, doPais?.trabalho),
    direcao: sobrepor(REGRAS_UNIVERSAIS.direcao, doPais?.direcao, daDivisao?.direcao)
  };
}

/** As regras do lugar onde a pessoa MORA. */
export const regrasDaVida = (v: Vida): RegrasLegais => regrasDoLugar(lugarDe(v.moradia.municipioId));

/** Com que idade se dirige SOZINHO aqui (a provisória, se houver; senão a plena). */
export const idadeParaDirigir = (r: RegraDeDirecao) => r.provisoria?.idade ?? r.plena;
/** Com que idade se começa o processo (a permissão de aprendiz, se houver). */
export const idadeParaComecar = (r: RegraDeDirecao) => Math.min(r.aprendiz?.idade ?? r.plena, idadeParaDirigir(r));

/** A frase da regra para a tela e o veredito: "Aqui, carteira de motorista aos 18." / "Aqui: permissão de aprendiz aos 15, licença provisória aos 16 e plena aos 18." */
export function fraseDaDirecao(r: RegraDeDirecao): string {
  const etapas = [r.aprendiz && `${r.aprendiz.nome} aos ${r.aprendiz.idade}`, r.provisoria && `${r.provisoria.nome} aos ${r.provisoria.idade}`].filter(Boolean) as string[];
  if (!etapas.length) return `Aqui, ${r.nome} aos ${r.plena}.`;
  return `Aqui: ${etapas.join(', ')}${r.plena > idadeParaDirigir(r) ? ` e sem restrições aos ${r.plena}` : ''}.`;
}
