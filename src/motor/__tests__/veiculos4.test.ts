/**
 * Veículos com marca e modelo: o catálogo de versões (carros, motos,
 * bicicletas) por cima das classes, a vitrine do mais barato ao mais caro, a
 * compra que guarda a versão e a migração dos veículos antigos.
 */

import { describe, expect, it } from 'vitest';
import { nova, viverAte } from './ajuda';
import { criarRng } from '../rng';
import { executar } from '../acoes';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { PALAVRA_FAIXA, VEICULOS, VEICULO_ANTIGO, VERSOES_VEICULO, modeloVeiculo, nomeDaVersao, versaoVeiculo, versoesDaClasse } from '../dados/bens';
import { catalogoDeVeiculos, ofertaVeiculoPorModelo, ofertasDeVeiculos } from '../sistemas/mercado';
import { veiculosParaVoce } from '../sistemas/relevancia';
import { categoriaDoVeiculo, nomeDoVeiculo, processarVeiculos, textoVeiculo } from '../sistemas/veiculos';
import { atribuirVersoesAosVeiculos, versaoParaVeiculoAntigo } from '../sistemas/versoesVeiculo';
import type { Veiculo, Vida } from '../tipos';

function adulta(semente = 21): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s }), 30);
  while (v.morte) v = viverAte(nova({ semente: ++s }), 30);
  v.momento = null;
  v.trabalho.atual = undefined;
  contratar(v, criarRng(3), ocupacao('assistente_adm'));
  v.trabalho.licencas.push('cnh');
  v.trabalho.atual!.salario = 12000;
  v.financas = { ...v.financas, conta: 900000, investimentos: [], dividas: [], bens: [], negativado: false };
  return v;
}

const categoriaDe = (classe: string) => modeloVeiculo(classe).categoria;

describe('catálogo de versões', () => {
  it('carros, motos e bicicletas com marcas reais, em várias faixas', () => {
    for (const cat of ['carro', 'moto', 'bicicleta'] as const) {
      const lista = VERSOES_VEICULO.filter(x => categoriaDe(x.classe) === cat);
      expect(lista.length).toBeGreaterThanOrEqual(6);
      expect(new Set(lista.map(x => x.marca)).size).toBeGreaterThanOrEqual(3);
      expect(new Set(lista.map(x => x.faixa)).size).toBeGreaterThanOrEqual(2);
    }
    const nomes = VERSOES_VEICULO.map(nomeDaVersao);
    for (const n of ['Renault Kwid', 'Fiat Mobi', 'Chevrolet Onix', 'Toyota Corolla', 'Jeep Compass', 'Toyota Hilux', 'BMW 320i', 'Honda Pop 110i', 'Honda CG 160 Fan', 'Yamaha Fazer FZ25', 'Honda CB 300F Twister', 'Caloi Andes']) expect(nomes).toContain(n);
    expect(new Set(VERSOES_VEICULO.map(x => x.faixa))).toEqual(new Set(Object.keys(PALAVRA_FAIXA)));
  });

  it('toda versão pertence a uma classe que existe; ids únicos; toda classe tem versões', () => {
    expect(new Set(VERSOES_VEICULO.map(x => x.id)).size).toBe(VERSOES_VEICULO.length);
    for (const x of VERSOES_VEICULO) {
      expect(VEICULOS.some(m => m.id === x.classe)).toBe(true);
      expect(x.preco).toBeGreaterThan(0);
      expect(x.dica.length).toBeGreaterThan(0);
    }
    for (const m of VEICULOS) expect(versoesDaClasse(m.id).length).toBeGreaterThanOrEqual(2);
  });

  it('preços coerentes: dentro da categoria, a faixa de entrada é mais barata que o topo; a moto de entrada cabe na renda de quem entrega', () => {
    for (const cat of ['carro', 'moto', 'bicicleta'] as const) {
      const lista = VERSOES_VEICULO.filter(x => categoriaDe(x.classe) === cat);
      const menor = (f: string) => Math.min(...lista.filter(x => x.faixa === f).map(x => x.preco));
      const maior = (f: string) => Math.max(...lista.filter(x => x.faixa === f).map(x => x.preco));
      const faixas = new Set(lista.map(x => x.faixa));
      if (faixas.has('economica') && faixas.has('alta')) expect(maior('economica')).toBeLessThan(maior('alta'));
      if (faixas.has('intermediaria') && faixas.has('alta')) expect(menor('intermediaria')).toBeLessThanOrEqual(menor('alta'));
    }
    const motoMaisBarata = Math.min(...VERSOES_VEICULO.filter(x => categoriaDe(x.classe) === 'moto').map(x => x.preco));
    expect(motoMaisBarata).toBeLessThan(2100 * 8);
    const carroMaisBarato = Math.min(...VERSOES_VEICULO.filter(x => categoriaDe(x.classe) === 'carro').map(x => x.preco));
    expect(carroMaisBarato).toBeGreaterThan(50000);
    expect(carroMaisBarato).toBeLessThan(90000);
  });

  it('categoriaDoVeiculo vale para todas as classes, ids antigos e objetos', () => {
    for (const m of VEICULOS) expect(categoriaDoVeiculo(m.id)).toBe(m.categoria);
    for (const [id, novo] of Object.entries(VEICULO_ANTIGO)) expect(categoriaDoVeiculo(id)).toBe(modeloVeiculo(novo.id).categoria);
    expect(categoriaDoVeiculo('moto_usada')).toBe('moto');
    expect(categoriaDoVeiculo('carro_novo')).toBe('carro');
    expect(categoriaDoVeiculo({ modeloId: 'bike_eletrica' })).toBe('bicicleta');
  });
});

describe('ofertas e vitrine', () => {
  it('toda oferta tem versão da sua classe; o mercado é determinístico', () => {
    const v = adulta();
    for (const l of ['concessionaria', 'usados', 'motos'] as const) {
      const a = ofertasDeVeiculos(v, l);
      expect(a.length).toBeGreaterThan(0);
      for (const o of a) expect(versaoVeiculo(o.versaoId)?.classe).toBe(o.modeloId);
      expect(ofertasDeVeiculos(structuredClone(v), l)).toEqual(a);
    }
    // A concessionária tem todos os carros zero; a loja de motos, todas as motos e bicicletas zero.
    expect(ofertasDeVeiculos(v, 'concessionaria').filter(o => !o.usado).length).toBe(VERSOES_VEICULO.filter(x => categoriaDe(x.classe) === 'carro').length);
    expect(ofertasDeVeiculos(v, 'motos').filter(o => !o.usado).length).toBe(VERSOES_VEICULO.filter(x => categoriaDe(x.classe) !== 'carro').length);
    expect(ofertasDeVeiculos(v, 'usados').every(o => o.usado)).toBe(true);
  });

  it('o catálogo completo vem do mais barato ao mais caro, com as três categorias e novos e usados', () => {
    const v = adulta();
    const c = catalogoDeVeiculos(v);
    for (let k = 1; k < c.length; k++) expect(c[k].preco).toBeGreaterThanOrEqual(c[k - 1].preco);
    expect(new Set(c.map(o => categoriaDe(o.modeloId)))).toEqual(new Set(['carro', 'moto', 'bicicleta']));
    expect(c.some(o => o.usado) && c.some(o => !o.usado)).toBe(true);
    expect(c.length).toBe((['concessionaria', 'usados', 'motos'] as const).reduce((s, l) => s + ofertasDeVeiculos(v, l).length, 0));
  });

  it('"ver os outros" de cada loja vem em ordem de preço', () => {
    const v = adulta();
    for (const l of ['concessionaria', 'usados', 'motos'] as const) {
      const { para, resto } = veiculosParaVoce(v, l);
      for (let k = 1; k < resto.length; k++) expect(resto[k].preco).toBeGreaterThanOrEqual(resto[k - 1].preco);
      expect(para.length + resto.length).toBe(ofertasDeVeiculos(v, l).length);
    }
  });

  it('ofertaVeiculoPorModelo: pela classe (a mais barata) ou pela versão', () => {
    const v = adulta();
    const o = ofertaVeiculoPorModelo(v, 'carro_compacto', false)!;
    expect(o.modeloId).toBe('carro_compacto');
    expect(o.preco).toBe(Math.min(...ofertasDeVeiculos(v, 'concessionaria').filter(x => x.modeloId === 'carro_compacto').map(x => x.preco)));
    expect(ofertaVeiculoPorModelo(v, 'toyota_hilux', false)?.versaoId).toBe('toyota_hilux');
    expect(ofertaVeiculoPorModelo(v, 'carro_usado', true)?.usado).toBe(true);
    expect(ofertaVeiculoPorModelo(v, 'moto_pequena')?.modeloId).toBe('moto_pequena');
  });
});

describe('comprar uma versão', () => {
  it('a compra guarda a versão, e o nome é marca e modelo — no bem, no financiamento e nas frases', () => {
    const v = adulta();
    const o = ofertasDeVeiculos(v, 'concessionaria').find(x => x.versaoId === 'fiat_mobi')!;
    const r = executar(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: true, entrada: Math.round(o.preco * 0.2) });
    expect(r.aviso?.texto).toBe('Fiat Mobi zero na garagem.');
    const d = r.vida;
    const b = d.financas.bens.find((x): x is Veiculo => x.tipo === 'veiculo')!;
    expect(b.versaoId).toBe('fiat_mobi');
    expect(b.modeloId).toBe('carro_compacto');
    expect(b.nome).toBe('Fiat Mobi');
    expect(nomeDoVeiculo(b)).toBe('Fiat Mobi');
    expect(textoVeiculo(b)).toBe('o Fiat Mobi');
    expect(d.financas.dividas.find(x => x.bemId === b.id)?.descricao).toBe('Financiamento: Fiat Mobi');
    expect(d.biografia.some(e => e.texto.includes('Fiat Mobi'))).toBe(true);
  });

  it('moto usada da loja: versão, artigo e concordância', () => {
    const v = adulta();
    const o = ofertasDeVeiculos(v, 'motos').find(x => x.usado && categoriaDe(x.modeloId) === 'moto')!;
    const d = executar(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).vida;
    const b = d.financas.bens.find((x): x is Veiculo => x.tipo === 'veiculo')!;
    expect(b.versaoId).toBe(o.versaoId);
    expect(textoVeiculo(b).startsWith('a ')).toBe(true);
    expect(d.biografia.some(e => e.texto.startsWith('Comprou a primeira moto: uma ') && e.texto.includes('usada de'))).toBe(true);
  });

  it('o valor do ano segue o preço da versão (um Porsche não deprecia como um compacto genérico)', () => {
    const v = adulta();
    const o = ofertasDeVeiculos(v, 'concessionaria').find(x => x.versaoId === 'porsche_macan')!;
    const d = executar(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).vida;
    d.t += 12;
    processarVeiculos(d, criarRng(1));
    const b = d.financas.bens.find((x): x is Veiculo => x.tipo === 'veiculo')!;
    expect(b.valor).toBeGreaterThan(modeloVeiculo('carro_luxo').preco * 0.6);
  });
});

describe('migração: veículos sem versão', () => {
  const antigo = (id: string, modeloId: string): Veiculo => ({ id, tipo: 'veiculo', modeloId, nome: modeloVeiculo(modeloId).nome, valor: 30000, tCompra: 0, estado: 70 });

  it('dá uma versão da classe, de forma determinística, e é idempotente', () => {
    const v = adulta();
    v.financas.bens = [antigo('v1', 'carro_compacto'), antigo('v2', 'moto_usada'), antigo('v3', 'bike'), antigo('v4', 'carro_suv_grande')];
    v.financas.dividas = [{ id: 'd1', tipo: 'financiamento_veiculo', saldo: 10000, jurosMes: 0.02, parcela: 500, bemId: 'v1', descricao: 'Financiamento: carro compacto', tInicio: 0, prazo: 24 }];
    const outra = structuredClone(v);
    expect(atribuirVersoesAosVeiculos(v)).toBe(4);
    atribuirVersoesAosVeiculos(outra);
    expect(outra.financas.bens).toEqual(v.financas.bens);
    for (const b of v.financas.bens as Veiculo[]) {
      const x = versaoVeiculo(b.versaoId)!;
      expect(x.classe).toBe(modeloVeiculo(b.modeloId).id);
      expect(b.nome).toBe(nomeDaVersao(x));
      expect(b.valor).toBe(30000);
    }
    expect(v.financas.dividas[0].descricao).toBe(`Financiamento: ${v.financas.bens[0].nome}`);
    const depois = structuredClone(v);
    expect(atribuirVersoesAosVeiculos(v)).toBe(0);
    expect(v).toEqual(depois);
  });

  it('a escolha depende do id do veículo e espalha pelas versões da classe', () => {
    const escolhas = new Set<string>();
    for (let k = 0; k < 60; k++) {
      const x = versaoParaVeiculoAntigo({ id: `v${k}`, modeloId: 'carro_compacto' })!;
      expect(x.classe).toBe('carro_compacto');
      expect(versaoParaVeiculoAntigo({ id: `v${k}`, modeloId: 'carro_compacto' })).toBe(x);
      escolhas.add(x.id);
    }
    expect(escolhas.size).toBeGreaterThanOrEqual(4);
  });
});
