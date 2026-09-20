/**
 * B4-FIX1 — cobertura das 27 unidades federativas.
 *
 * O playtest apontou que faltavam estados na lista de nascimento (Acre
 * entre eles). A lista já era data-driven desde o B4-FIX; a lacuna era
 * puramente de dados — 19 das 27 UFs estavam presentes.
 *
 * Este teste fixa a garantia de cobertura total, incluindo Acre por nome,
 * para que uma futura edição de `CIDADES_BRASILEIRAS` não volte a reduzir
 * a lista sem que um teste quebre.
 */

import { describe, it, expect } from 'vitest';
import {
  CIDADES_BRASILEIRAS,
  listarEstadosDisponiveis
} from '../brazilianData';

const TODAS_AS_27_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

describe('B4-FIX1 · cobertura das 27 UFs', () => {
  it('lista exatamente as 27 unidades federativas do Brasil', () => {
    const siglas = listarEstadosDisponiveis().map(uf => uf.sigla).sort();
    expect(siglas).toEqual([...TODAS_AS_27_UFS].sort());
    expect(siglas.length).toBe(27);
  });

  it('inclui o Acre com pelo menos uma cidade suportada', () => {
    const acre = listarEstadosDisponiveis().find(uf => uf.sigla === 'AC');
    expect(acre).toBeTruthy();
    expect(acre!.quantidadeCidades).toBeGreaterThan(0);

    const cidadesDoAcre = CIDADES_BRASILEIRAS.filter(c => c.estado === 'AC');
    expect(cidadesDoAcre.length).toBeGreaterThan(0);
    expect(cidadesDoAcre.some(c => c.cidade === 'Rio Branco')).toBe(true);
  });

  it('nenhuma UF aparece duplicada na lista de estados', () => {
    const siglas = listarEstadosDisponiveis().map(uf => uf.sigla);
    expect(new Set(siglas).size).toBe(siglas.length);
  });

  it('toda cidade cadastrada pertence a uma das 27 UFs válidas', () => {
    for (const cidade of CIDADES_BRASILEIRAS) {
      expect(TODAS_AS_27_UFS).toContain(cidade.estado);
    }
  });
});
