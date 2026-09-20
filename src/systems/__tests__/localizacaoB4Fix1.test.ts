import { describe, expect, it } from 'vitest';
import {
  CIDADES_BRASILEIRAS,
  UNIDADES_FEDERATIVAS,
  encontrarCidade,
  encontrarEstado,
  listarCidadesPorEstado,
  listarEstados,
  nomeDoEstado,
  sortearEstado
} from '../../data/locations';

/**
 * As 27 UFs.
 *
 * O bug do B4-FIX era derivar a lista de estados das cidades cadastradas:
 * 8 UFs sem cidade simplesmente não existiam para o jogador. A UF é
 * entidade própria — estes testes fixam isso.
 */
describe('B4-FIX.1 · unidades federativas', () => {
  const SIGLAS_OFICIAIS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  it('existem exatamente 27 unidades federativas', () => {
    expect(listarEstados()).toHaveLength(27);
  });

  it('todas as 27 siglas oficiais estão presentes', () => {
    const presentes = listarEstados().map(uf => uf.sigla).sort();
    expect(presentes).toEqual([...SIGLAS_OFICIAIS].sort());
  });

  it('as UFs ausentes no B4-FIX agora existem', () => {
    // Regressão explícita: estas oito faltavam por serem derivadas de cidades.
    for (const sigla of ['AC', 'AP', 'MA', 'PI', 'RO', 'RR', 'SE', 'TO']) {
      expect(encontrarEstado(sigla)).toBeDefined();
    }
  });

  it('Distrito Federal está na lista', () => {
    expect(encontrarEstado('DF')?.nome).toBe('Distrito Federal');
  });

  it('não há siglas duplicadas', () => {
    const siglas = listarEstados().map(uf => uf.sigla);
    expect(new Set(siglas).size).toBe(siglas.length);
  });

  it('não há nomes duplicados', () => {
    const nomes = listarEstados().map(uf => uf.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('toda sigla tem duas letras maiúsculas', () => {
    for (const uf of listarEstados()) {
      expect(uf.sigla).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('todo estado tem nome por extenso não vazio e diferente da sigla', () => {
    for (const uf of listarEstados()) {
      expect(uf.nome.length).toBeGreaterThan(2);
      expect(uf.nome).not.toBe(uf.sigla);
    }
  });

  it('nomes conhecidos por extenso estão corretos', () => {
    expect(nomeDoEstado('AC')).toBe('Acre');
    expect(nomeDoEstado('SP')).toBe('São Paulo');
    expect(nomeDoEstado('RR')).toBe('Roraima');
  });

  it('a lista está ordenada por nome', () => {
    const nomes = listarEstados().map(uf => uf.nome);
    const ordenados = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    expect(nomes).toEqual(ordenados);
  });
});

describe('B4-FIX.1 · integridade UF → cidade', () => {
  it('toda UF tem ao menos uma cidade de nascimento', () => {
    for (const uf of listarEstados()) {
      expect(listarCidadesPorEstado(uf.sigla).length).toBeGreaterThan(0);
    }
  });

  it('toda cidade pertence a uma UF do catálogo', () => {
    const siglas = new Set(listarEstados().map(uf => uf.sigla));
    for (const cidade of CIDADES_BRASILEIRAS) {
      expect(siglas.has(cidade.estado)).toBe(true);
    }
  });

  it('listarCidadesPorEstado só devolve cidades daquele estado', () => {
    for (const uf of listarEstados()) {
      for (const cidade of listarCidadesPorEstado(uf.sigla)) {
        expect(cidade.estado).toBe(uf.sigla);
      }
    }
  });

  it('não há cidade duplicada dentro da mesma UF', () => {
    for (const uf of listarEstados()) {
      const nomes = listarCidadesPorEstado(uf.sigla).map(c => c.cidade);
      expect(new Set(nomes).size).toBe(nomes.length);
    }
  });

  it('trocar de UF muda o conjunto de cidades', () => {
    const sp = listarCidadesPorEstado('SP').map(c => c.cidade);
    const ac = listarCidadesPorEstado('AC').map(c => c.cidade);
    expect(sp).not.toEqual(ac);
    expect(sp.some(c => ac.includes(c))).toBe(false);
  });

  it('encontrarCidade exige o par cidade + UF correto', () => {
    expect(encontrarCidade('Rio Branco', 'AC')).toBeDefined();
    // Mesmo nome, UF errada: não existe.
    expect(encontrarCidade('Rio Branco', 'SP')).toBeUndefined();
  });

  it('custo de vida fica na faixa de balanceamento declarada', () => {
    for (const cidade of CIDADES_BRASILEIRAS) {
      expect(cidade.custoVidaRelativo).toBeGreaterThanOrEqual(0.8);
      expect(cidade.custoVidaRelativo).toBeLessThanOrEqual(1.4);
    }
  });

  it('sortearEstado sempre devolve UF com cidade válida', () => {
    for (let i = 0; i < 50; i++) {
      const uf = sortearEstado();
      expect(listarCidadesPorEstado(uf.sigla).length).toBeGreaterThan(0);
    }
  });

  it('toda UF declara região', () => {
    for (const uf of UNIDADES_FEDERATIVAS) {
      expect(uf.regiao.length).toBeGreaterThan(0);
    }
  });
});
