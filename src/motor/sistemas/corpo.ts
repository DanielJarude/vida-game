/**
 * Corpo: envelhecer, adoecer, morrer.
 *
 * Saúde não é um número que só cai com a idade. Ela responde a hábitos
 * (sedentarismo, cigarro, bebida), a estresse prolongado, a condições
 * crônicas e ao acesso a tratamento (SUS ou plano). A morte é um risco anual
 * que cresce com a idade (curva de Gompertz) e com a saúde ruim, mais as
 * causas externas que pesam sobre jovens no Brasil.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Condicao, Pessoa, Vida } from '../tipos';
import { escrever, idade, novoId } from '../nucleo';
import { municipio } from '../dados/lugares';
import { idadeEm } from '../tempo';

export interface ModeloCondicao {
  id: string;
  nome: string;
  cronica: boolean;
  /** Chance anual de surgir, dada a idade e o estado. */
  risco: (v: Vida, idade: number) => number;
  gravidade: number;
  /** Perda anual de saúde sem tratamento / com tratamento. */
  perda: [number, number];
  /** Condição aguda: dura um ano e some (curada ou não). */
  descoberta: string;
}

const MODELOS: ModeloCondicao[] = [
  {
    id: 'hipertensao', nome: 'pressão alta', cronica: true, gravidade: 1, perda: [1, 0.2],
    risco: (v, i) => i < 28 ? 0 : (0.004 + (i - 28) * 0.0012) * (v.corpo.habitos.sedentario ? 1.5 : 1) * (v.mente.estresse > 60 ? 1.4 : 1),
    descoberta: 'Uma medição de pressão num posto de saúde deu alta. O médico falou em remédio para o resto da vida.'
  },
  {
    id: 'diabetes', nome: 'diabetes', cronica: true, gravidade: 2, perda: [1.5, 0.4],
    risco: (v, i) => i < 35 ? 0 : (0.002 + (i - 35) * 0.0006) * (v.corpo.habitos.sedentario ? 1.8 : 1),
    descoberta: 'Um exame de sangue apontou diabetes. A comida da casa precisou mudar.'
  },
  {
    id: 'depressao', nome: 'depressão', cronica: true, gravidade: 2, perda: [1.5, 0.3],
    risco: (v, i) => i < 14 ? 0 : 0.006 + Math.max(0, v.mente.estresse - 55) * 0.0012 + Math.max(0, 40 - v.mente.felicidade) * 0.0012,
    descoberta: 'Os meses pesados ganharam um nome no consultório: depressão.'
  },
  {
    id: 'ansiedade', nome: 'transtorno de ansiedade', cronica: true, gravidade: 1, perda: [1, 0.2],
    risco: (v, i) => i < 13 ? 0 : 0.005 + Math.max(0, v.mente.estresse - 50) * 0.0015,
    descoberta: 'As crises de falta de ar sem motivo tinham diagnóstico: ansiedade.'
  },
  {
    id: 'coluna', nome: 'problema de coluna', cronica: true, gravidade: 1, perda: [0.6, 0.2],
    risco: (v, i) => i < 25 ? 0 : 0.006 + (v.trabalho.atual && ['construcao', 'agro', 'cuidado'].some(t => v.trabalho.atual!.ocupacaoId.includes(t)) ? 0.01 : 0),
    descoberta: 'A dor nas costas virou hérnia de disco na ressonância.'
  },
  {
    id: 'cancer', nome: 'câncer', cronica: true, gravidade: 3, perda: [9, 3],
    risco: (v, i) => i < 35 ? 0.0002 : (0.0008 + (i - 35) * 0.00025) * (v.corpo.habitos.fuma ? 2.2 : 1),
    descoberta: 'Um nódulo, uma biópsia, uma palavra que ninguém quer ouvir: câncer.'
  },
  {
    id: 'dengue', nome: 'dengue', cronica: false, gravidade: 1, perda: [4, 2],
    risco: v => {
      const m = municipio(v.moradia.municipioId);
      return m.regiao === 'Sudeste' || m.regiao === 'Centro-Oeste' || m.regiao === 'Nordeste' || m.regiao === 'Norte' ? 0.02 : 0.004;
    },
    descoberta: 'Febre alta, dor atrás dos olhos, manchas pelo corpo: dengue. Foram duas semanas de cama.'
  }
];

export const modeloCondicao = (id: string) => MODELOS.find(m => m.id === id);

/** Envelhecimento e condições do ano. Devolve se algo marcante aconteceu. */
export function processarCorpo(v: Vida, r: Rng): void {
  const i = idade(v);
  const c = v.corpo;

  // Deriva natural por idade. Corpo jovem se recupera; depois dos 50, cobra.
  let delta = i < 18 ? (90 - c.saude) * 0.25
    : i < 35 ? (84 - c.saude) * 0.12
    : i < 50 ? (80 - c.saude) * 0.07 - 0.3
    : i < 65 ? (74 - c.saude) * 0.04 - 0.5
    : i < 80 ? -1 : -1.8;
  delta += (c.forma - 45) / 70;
  if (c.habitos.fuma) delta -= 1.6;
  if (c.habitos.bebe === 'muito') delta -= 1.4;
  if (v.mente.estresse > 75) delta -= 0.8;
  if (v.mente.felicidade < 25) delta -= 0.5;

  // Condições em curso
  for (const cond of c.condicoes) {
    const m = modeloCondicao(cond.id);
    if (!m) continue;
    delta -= (cond.tratando ? m.perda[1] : m.perda[0]) * (i < 45 ? 0.5 : 1);
    if (cond.id === 'depressao' || cond.id === 'ansiedade') {
      v.mente.felicidade = clamp(v.mente.felicidade - (cond.tratando ? 2 : 6));
      // Transtornos mentais melhoram com o tempo e com a vida melhorando.
      if (v.mente.estresse < 40 && v.mente.felicidade > 60 && r.chance(0.25)) {
        c.condicoes = c.condicoes.filter(x => x !== cond);
        escrever(v, { texto: `A ${cond.nome} foi embora devagar, sem data certa.`, relevancia: 'cotidiano', tema: 'saude', tom: 'bom' });
      }
    }
  }
  // Agudas duram um ano
  c.condicoes = c.condicoes.filter(cond => modeloCondicao(cond.id)?.cronica !== false || cond.tInicio > v.t - 12);

  c.saude = clamp(Math.round(c.saude + delta + r.normal() * 1.5));

  // Forma física decai sem atividade, mais com a idade
  // Sem exercício a forma cai até o piso do dia a dia (andar, subir escada).
  const decaiForma = c.habitos.sedentario ? 3 : 1;
  const piso = i < 50 ? 30 : i < 70 ? 22 : 15;
  c.forma = Math.max(Math.min(c.forma, piso), clamp(Math.round(c.forma - decaiForma - (i > 50 ? 1 : 0))));

  // Novas condições (no máximo uma por ano, para não virar lista)
  const candidatas = MODELOS.filter(m => !c.condicoes.some(x => x.id === m.id));
  for (const m of candidatas) {
    if (r.chance(m.risco(v, i))) {
      const nova: Condicao = { id: m.id, nome: m.nome, tInicio: v.t, cronica: m.cronica, gravidade: m.gravidade, tratando: v.financas.planoDeSaude && m.cronica };
      c.condicoes.push(nova);
      escrever(v, {
        texto: m.descoberta + (nova.tratando ? ' O plano de saúde cobriu o tratamento.' : m.cronica ? ' Tratar ia depender de fila no SUS ou de pagar do bolso.' : ''),
        relevancia: m.gravidade >= 2 ? 'marco' : 'biografia',
        tema: 'saude',
        tom: 'ruim'
      });
      break;
    }
  }
}

/* ---------------------------------------------------------------- Morte */

/**
 * Risco anual de morte. Calibrado para expectativa de vida perto de 76 anos
 * (mais para mulheres, menos para homens), com saúde e condições mexendo
 * no risco e causas externas pesando sobre homens jovens.
 */
function riscoBase(i: number, saude: number, masculino: boolean, condicoes: { id: string; tratando: boolean }[] = []): number {
  const gompertz = 0.000012 * Math.exp(0.1 * i) * (masculino ? 1.35 : 1);
  const externas = i >= 15 && i <= 34 ? (masculino ? 0.0018 : 0.0004) : 0;
  const infantil = i <= 1 ? 0.003 : 0;
  const fatorSaude = Math.exp((70 - saude) / 22);
  let fatorCondicoes = 1;
  for (const c of condicoes) {
    if (c.id === 'hipertensao') fatorCondicoes *= c.tratando ? 1.15 : 1.6;
    if (c.id === 'diabetes') fatorCondicoes *= c.tratando ? 1.25 : 1.8;
  }
  return (gompertz + infantil) * fatorSaude * fatorCondicoes + externas;
}

export function causaDaMorte(r: Rng, i: number, masculino: boolean, condicoes: string[]): string {
  if (condicoes.includes('cancer') && r.chance(0.7)) return 'câncer';
  if (i >= 15 && i <= 34 && r.chance(0.6)) return r.chance(masculino ? 0.45 : 0.25) ? 'violência urbana' : 'acidente de trânsito';
  if (i >= 88 && r.chance(0.5)) return 'causas naturais, dormindo';
  if (condicoes.includes('diabetes') && r.chance(0.35)) return 'complicações do diabetes';
  if (condicoes.includes('hipertensao') && r.chance(0.5)) return r.chance(0.5) ? 'infarto' : 'AVC';
  return r.weighted(['infarto', 'AVC', 'pneumonia', 'câncer', 'insuficiência renal'], c => ({ infarto: 3, AVC: 2.5, pneumonia: 2, 'câncer': 2, 'insuficiência renal': 1 } as Record<string, number>)[c])!;
}

/** Sorteia a morte do personagem neste ano. */
export function morreEsteAno(v: Vida, r: Rng): string | null {
  const i = idade(v);
  const risco = riscoBase(i, v.corpo.saude, v.eu.genero === 'masculino', v.corpo.condicoes)
    + v.corpo.condicoes.reduce((s, c) => s + (c.id === 'cancer' ? (c.tratando ? 0.04 : 0.12) : 0), 0);
  if (!r.chance(Math.min(0.95, risco))) return null;
  return causaDaMorte(r, i, v.eu.genero === 'masculino', v.corpo.condicoes.map(c => c.id));
}

/** Envelhece e, às vezes, leva uma pessoa da vida do jogador. */
export function processarCorpoDePessoa(v: Vida, r: Rng, p: Pessoa): string | null {
  if (!p.vivo) return null;
  const i = idadeEm(p.tNasc, v.t);
  if (p.especie) {
    const vidaMax = p.especie === 'gato' ? 16 : 13;
    if (i >= vidaMax - 3 && r.chance((i - (vidaMax - 4)) * 0.18)) return 'velhice';
    return null;
  }
  const deriva = i < 40 ? 0 : i < 60 ? -0.8 : i < 75 ? -1.5 : -2.5;
  p.saude = clamp(Math.round(p.saude + deriva + r.normal() * 2));
  if (r.chance(riscoBase(i, p.saude, p.genero === 'masculino'))) {
    return causaDaMorte(r, i, p.genero === 'masculino', []);
  }
  return null;
}

export { novoId };
