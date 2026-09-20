/**
 * B4-FIX2 item 16-18 — domínio de localização.
 *
 * Cobre o agrupamento por região (Norte→Sul, estados em ordem alfabética
 * dentro da região), o nome completo do estado como informação principal,
 * e a expansão real de municípios (mais de uma cidade por estado grande).
 */

import { describe, it, expect } from 'vitest';
import { ESTADOS_BRASILEIROS, ORDEM_REGIOES, obterNomeEstado, obterRegiaoEstado } from '../estados';
import {
  MUNICIPIOS_BRASILEIROS,
  listarEstadosDisponiveis,
  listarCidadesPorEstado,
  encontrarCidade
} from '../municipios';
import { listarRegioesComEstados, sortearCidade } from '../index';

describe('B4-FIX2 · estados e regiões', () => {
  it('as 27 UFs têm nome completo e região atribuídos', () => {
    expect(ESTADOS_BRASILEIROS.length).toBe(27);
    for (const e of ESTADOS_BRASILEIROS) {
      expect(e.nome.length).toBeGreaterThan(1);
      expect(ORDEM_REGIOES).toContain(e.regiao);
    }
  });

  it('obterNomeEstado traduz sigla para nome completo (ex.: AC -> Acre)', () => {
    expect(obterNomeEstado('AC')).toBe('Acre');
    expect(obterNomeEstado('SP')).toBe('São Paulo');
    expect(obterNomeEstado('RN')).toBe('Rio Grande do Norte');
  });

  it('obterRegiaoEstado devolve a região correta', () => {
    expect(obterRegiaoEstado('AC')).toBe('Norte');
    expect(obterRegiaoEstado('SP')).toBe('Sudeste');
    expect(obterRegiaoEstado('RS')).toBe('Sul');
  });
});

describe('B4-FIX2 · agrupamento por região (item 16)', () => {
  it('agrupa estados disponíveis nas 5 regiões, na ordem Norte->Sul', () => {
    const grupos = listarRegioesComEstados();
    const regioesPresentes = grupos.map(g => g.regiao);
    // Ordem relativa deve respeitar ORDEM_REGIOES mesmo que alguma região falte.
    let ultimoIndice = -1;
    for (const regiao of regioesPresentes) {
      const indice = ORDEM_REGIOES.indexOf(regiao);
      expect(indice).toBeGreaterThan(ultimoIndice);
      ultimoIndice = indice;
    }
  });

  it('dentro de cada região, os estados aparecem em ordem alfabética pelo nome', () => {
    const grupos = listarRegioesComEstados();
    for (const grupo of grupos) {
      const nomes = grupo.estados.map(e => e.nome);
      const ordenado = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      expect(nomes).toEqual(ordenado);
    }
  });

  it('todas as 27 UFs aparecem em algum grupo, sem duplicata', () => {
    const grupos = listarRegioesComEstados();
    const todasSiglas = grupos.flatMap(g => g.estados.map(e => e.sigla));
    expect(todasSiglas.length).toBe(27);
    expect(new Set(todasSiglas).size).toBe(27);
  });

  it('cada estado do agrupamento carrega nome completo e contagem de cidades', () => {
    const grupos = listarRegioesComEstados();
    for (const grupo of grupos) {
      for (const estado of grupo.estados) {
        expect(estado.nome.length).toBeGreaterThan(1);
        expect(estado.quantidadeCidades).toBeGreaterThan(0);
      }
    }
  });
});

describe('B4-FIX2 · municípios expandidos (item 17-18)', () => {
  it('há bem mais de 1 cidade por estado em média (expansão real)', () => {
    const estados = listarEstadosDisponiveis();
    const media = MUNICIPIOS_BRASILEIROS.length / estados.length;
    expect(media).toBeGreaterThan(1.5);
  });

  it('estados grandes (SP, MG, RJ, BA, PR, RS, SC, PE, CE, GO, PA, AM) têm mais de uma cidade', () => {
    const grandes = ['SP', 'MG', 'RJ', 'BA', 'PR', 'RS', 'SC', 'PE', 'CE', 'GO', 'PA', 'AM'];
    for (const uf of grandes) {
      const cidades = listarCidadesPorEstado(uf);
      expect(cidades.length).toBeGreaterThan(1);
    }
  });

  it('a capital aparece primeiro na lista de cidades do estado, quando marcada', () => {
    const cidadesSP = listarCidadesPorEstado('SP');
    expect(cidadesSP[0].cidade).toBe('São Paulo');
    expect(cidadesSP[0].capital).toBe(true);
  });

  it('encontrarCidade localiza uma cidade existente e não localiza uma inexistente', () => {
    expect(encontrarCidade('Marília', 'SP')).toBeTruthy();
    expect(encontrarCidade('Cidade Inexistente', 'SP')).toBeUndefined();
  });

  it('sortearCidade sempre devolve uma cidade da lista suportada', () => {
    for (let i = 0; i < 20; i++) {
      const c = sortearCidade();
      expect(MUNICIPIOS_BRASILEIROS).toContain(c);
    }
  });

  it('nenhuma cidade tem custoVidaRelativo fora de uma faixa plausível de balanceamento', () => {
    for (const c of MUNICIPIOS_BRASILEIROS) {
      expect(c.custoVidaRelativo).toBeGreaterThanOrEqual(0.7);
      expect(c.custoVidaRelativo).toBeLessThanOrEqual(1.5);
    }
  });

  it('a expansão de municípios é significativa em relação à base anterior (1 por UF = 36)', () => {
    // Antes do B4-FIX2 havia exatamente 1 cidade por UF (36 no total, com
    // 26 estados + DF). Este PR expandiu a cobertura mantendo as 27 UFs
    // (incluindo Acre, item já aprovado no B4-FIX1). O número exato não é
    // contrato — só a garantia de que a expansão é real, não cosmética.
    expect(MUNICIPIOS_BRASILEIROS.length).toBeGreaterThanOrEqual(80);
    // Toda UF tem pelo menos a capital cadastrada.
    for (const uf of listarEstadosDisponiveis()) {
      expect(listarCidadesPorEstado(uf.sigla).length).toBeGreaterThanOrEqual(1);
    }
  });
});
