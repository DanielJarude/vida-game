/** VIDA 36 · navegação da vitrine de veículos: filtro, ordenação e comparação lidos das ofertas reais. */
import { describe, expect, it } from 'vitest';
import { nova, viverAte } from './ajuda';
import { ofertasDeVeiculos } from '../sistemas/mercado';
import { fichaDoVeiculo, filtrarVeiculos, compararVeiculos, marcasDaVitrine, classesDaVitrine, LIMITE_DE_COMPARACAO } from '../sistemas/vitrineDeVeiculos36';

const vitrine = () => {
  const v = viverAte(nova({ semente: 36, municipioId: 'recife-pe' }), 30);
  return ofertasDeVeiculos(v, 'concessionaria').map(fichaDoVeiculo);
};

describe('VIDA 36 · vitrine de veículos', () => {
  it('a vitrine tem carros de mais de uma marca e classe (dados reais do catálogo)', () => {
    const fichas = vitrine();
    expect(fichas.length).toBeGreaterThan(3);
    expect(marcasDaVitrine(fichas).length).toBeGreaterThan(1);
    expect(classesDaVitrine(fichas).length).toBeGreaterThan(1);
    for (const f of fichas) expect(f.nome.length).toBeGreaterThan(3);
  });

  it('o filtro por marca devolve só aquela marca', () => {
    const fichas = vitrine();
    const marca = marcasDaVitrine(fichas)[0];
    const so = filtrarVeiculos(fichas, { marca });
    expect(so.length).toBeGreaterThan(0);
    for (const f of so) expect(f.marca).toBe(marca);
  });

  it('a ordenação por preço vai do menor ao maior e do maior ao menor', () => {
    const fichas = vitrine();
    const menor = filtrarVeiculos(fichas, { ordem: 'menor' }).map(f => f.preco);
    const maior = filtrarVeiculos(fichas, { ordem: 'maior' }).map(f => f.preco);
    expect(menor).toEqual([...menor].sort((a, b) => a - b));
    expect(maior).toEqual([...maior].sort((a, b) => b - a));
  });

  it('a busca acha pelo nome do modelo, sem acento e sem maiúscula', () => {
    const fichas = vitrine();
    const alvo = fichas[0];
    const achou = filtrarVeiculos(fichas, { texto: alvo.modelo.toUpperCase() });
    expect(achou.some(f => f.oferta.id === alvo.oferta.id)).toBe(true);
  });

  it('a comparação aceita no máximo três modelos, na ordem escolhida, sem repetir', () => {
    const fichas = vitrine();
    const ids = fichas.slice(0, 5).map(f => f.oferta.id);
    const cmp = compararVeiculos(fichas, [ids[0], ids[0], ids[1], ids[2], ids[3], ids[4]]);
    expect(cmp.length).toBe(LIMITE_DE_COMPARACAO);
    expect(cmp.map(f => f.oferta.id)).toEqual([ids[0], ids[1], ids[2]]);
  });
});
