/**
 * Domínio de localização (B4-FIX2 item 16-18): estados, regiões e
 * municípios. Ponto único de entrada para quem precisa de local de
 * nascimento — a UI nunca importa `estados.ts`/`municipios.ts` diretamente,
 * para que o agrupamento por região e a ordenação fiquem centralizados aqui.
 */

import { randomChoice } from '../../utils/random';
import { ESTADOS_BRASILEIROS, ORDEM_REGIOES, obterNomeEstado, obterRegiaoEstado } from './estados';
import type { InfoEstado, Regiao } from './estados';
import {
  MUNICIPIOS_BRASILEIROS,
  listarEstadosDisponiveis,
  listarCidadesPorEstado,
  encontrarCidade
} from './municipios';
import type { Municipio } from './municipios';

export type { Regiao, InfoEstado } from './estados';
export type { Municipio, EstadoBrasileiro } from './municipios';
export {
  MUNICIPIOS_BRASILEIROS,
  listarEstadosDisponiveis,
  listarCidadesPorEstado,
  encontrarCidade
};
export { obterNomeEstado, obterRegiaoEstado };

export interface RegiaoComEstados {
  regiao: Regiao;
  estados: (InfoEstado & { quantidadeCidades: number })[];
}

/**
 * Estados disponíveis agrupados por região, na ordem editorial Norte→Sul,
 * com estados em ordem alfabética dentro da região (item 16 do B4-FIX2).
 */
export function listarRegioesComEstados(): RegiaoComEstados[] {
  const disponiveis = new Map(listarEstadosDisponiveis().map(e => [e.sigla, e]));

  return ORDEM_REGIOES.map(regiao => {
    const estados = ESTADOS_BRASILEIROS
      .filter(e => e.regiao === regiao && disponiveis.has(e.sigla))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map(e => ({
        ...e,
        quantidadeCidades: disponiveis.get(e.sigla)!.quantidadeCidades
      }));
    return { regiao, estados };
  }).filter(grupo => grupo.estados.length > 0);
}

/** Sorteia uma cidade entre todas as suportadas. */
export function sortearCidade(): Municipio {
  return randomChoice(MUNICIPIOS_BRASILEIROS);
}
