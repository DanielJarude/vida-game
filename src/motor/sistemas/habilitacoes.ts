/**
 * Habilitações para operar o que é raro: o barco e o avião. POSSUIR NÃO É
 * SABER OPERAR — dá para comprar uma lancha sem habilitação (e pagar quem a
 * conduza), mas sair com ela sozinho pede o curso e a prova. Sem regra legal
 * específica: um curso com prova (náutica, alguns meses) e uma formação longa
 * e cara (piloto, um ano de horas de voo), com resultado que depende da
 * pessoa. A carteira de motorista tem o seu próprio caminho (`autoescola`).
 *
 * O bimotor pede, além da licença de piloto, a habilitação de multimotor
 * (horas em bimotor com instrutor e um exame próprio — abstraído: alguns
 * meses, uns R$ 45 mil). O jato não entra aqui: voa com tripulação contratada
 * (`ModeloVeiculo.tripulacao`); a habilitação de tipo de jato fica fora do jogo.
 */

import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { NOME_HABILITACAO, modeloVeiculo } from '../dados/bens';
import { pagar, vereditoDePagar } from './dinheiro';

export type HabilitacaoRara = 'nautica' | 'piloto' | 'multimotor';

const CURSO: Record<HabilitacaoRara, { custo: number; meses: number; idade: number; requer?: HabilitacaoRara }> = {
  nautica: { custo: 1800, meses: 4, idade: 18 },
  piloto: { custo: 68000, meses: 12, idade: 18 },
  multimotor: { custo: 45000, meses: 4, idade: 18, requer: 'piloto' }
};
const HABILITACOES: HabilitacaoRara[] = ['nautica', 'piloto', 'multimotor'];

export const temHabilitacao = (v: Vida, h: HabilitacaoRara | 'cnh') => v.trabalho.licencas.includes(h);

/** O veículo pede uma habilitação que a pessoa não tem? */
export function faltaHabilitacao(v: Vida, modeloId: string): HabilitacaoRara | undefined {
  const m = modeloVeiculo(modeloId);
  return m.habilitacao && !temHabilitacao(v, m.habilitacao) ? m.habilitacao : undefined;
}

const custoDoCurso = (v: Vida, h: HabilitacaoRara) => Math.round(CURSO[h].custo * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

export function disponibilidadeHabilitacao(v: Vida, h: HabilitacaoRara): Veredito {
  if (idade(v) < CURSO[h].idade) return bloqueio('requisito', `A partir dos ${CURSO[h].idade}.`);
  if (temHabilitacao(v, h)) return bloqueio('incompativel', `Você já tem a ${NOME_HABILITACAO[h]}.`);
  const requer = CURSO[h].requer;
  if (requer && !temHabilitacao(v, requer)) return bloqueio('requisito', `Primeiro, a ${NOME_HABILITACAO[requer]}.`);
  if (v.fatos[`hab_${h}_ate`] !== undefined) return bloqueio('incompativel', 'O curso já está em andamento.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  return vereditoDePagar(v, custoDoCurso(v, h), h === 'piloto' ? 'A formação de piloto (aulas e horas de voo) custa uns' : h === 'multimotor' ? 'As horas em bimotor com instrutor e o exame custam uns' : 'O curso e a prova custam uns');
}

export function iniciarHabilitacao(v: Vida, h: HabilitacaoRara): string {
  pagar(v, custoDoCurso(v, h));
  v.fatos[`hab_${h}_ate`] = v.t + CURSO[h].meses;
  return h === 'piloto' ? 'Matrícula no aeroclube: teoria, simulador e horas de voo com instrutor — um ano, se tudo andar.' : h === 'multimotor' ? 'Horas em bimotor com instrutor: pane de um motor simulada até virar reflexo, e um exame no fim.' : 'Matrícula no curso de habilitação náutica: aulas, prática na água e uma prova no fim.';
}

/** O ano das habilitações: o curso que terminou dá (ou não) a habilitação — e o porquê. */
export function processarHabilitacoes(v: Vida): void {
  for (const h of HABILITACOES) {
    const ate = v.fatos[`hab_${h}_ate`];
    if (ate === undefined || v.t < ate) continue;
    const r: Rng = rngDe(v.id, 'hab', h, v.t);
    const chance = clamp((h === 'piloto' ? 0.55 : h === 'multimotor' ? 0.7 : 0.75) + (v.mente.cognicao - 50) / 200 - (v.mente.estresse > 65 ? 0.1 : 0), 0.3, 0.92);
    if (r.chance(chance)) {
      delete v.fatos[`hab_${h}_ate`];
      v.trabalho.licencas.push(h);
      escrever(v, { texto: h === 'piloto' ? 'Tirou a licença de piloto: o primeiro voo solo ficou na memória.' : h === 'multimotor' ? 'Tirou a habilitação de multimotor: agora, dois motores também.' : 'Tirou a habilitação náutica.', relevancia: h === 'piloto' ? 'marco' : 'biografia', tema: 'lazer', tom: 'bom' });
    } else {
      v.fatos[`hab_${h}_ate`] = v.t + (h === 'nautica' ? 3 : 6);
      pagar(v, h === 'piloto' ? 9000 : h === 'multimotor' ? 7000 : 400);
      escrever(v, { texto: h === 'nautica' ? 'Reprovou na prova da habilitação náutica; nova prova em alguns meses.' : 'O exame de voo não passou: mais horas com instrutor antes de tentar de novo.', relevancia: 'cotidiano', tema: 'lazer', tom: 'ruim' });
    }
  }
}

/** Em palavras (a loja, o detalhe do veículo). */
export function leituraDaHabilitacao(v: Vida, h: HabilitacaoRara): string {
  if (temHabilitacao(v, h)) return `Você tem a ${NOME_HABILITACAO[h]}.`;
  if (v.fatos[`hab_${h}_ate`] !== undefined) return `O curso da ${NOME_HABILITACAO[h]} está em andamento.`;
  return h === 'piloto' ? 'Sem licença de piloto: dá para ter o avião, mas voar nele pede um piloto contratado.' : h === 'multimotor' ? 'Sem a habilitação de multimotor: dá para ter o bimotor, mas voar nele pede um piloto contratado.' : 'Sem habilitação náutica: dá para ter o barco, mas sair com ele pede um marinheiro contratado.';
}
