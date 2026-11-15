// @vitest-environment jsdom
/** VIDA 22 — a ficha do imóvel e a casa no lugar dela (entorno, anexos). */
import { describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);
import { FichaDoImovel22 } from '../v22/casa/FichaDoImovel22';
import { CenaDaCasa } from '../jogo/material/Desenhos';
import { leituraDoLar, type LeituraLar } from '../leituraMaterial';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import type { Imovel } from '../../motor/tipos';

const base = adulto(35, { semente: 125, municipioId: 'sao-paulo-sp' });
function propria(modeloId: string, valor = 600000, extra: (x: typeof base) => void = () => {}) {
  return transacao(base, x => {
    const im = { id: 'im1', tipo: 'imovel', modeloId, nome: 'casa', valor, tCompra: x.t - 24, municipioId: x.moradia.municipioId, estado: 80, precoPago: 500000, bairro: 'num bairro novo' } as Imovel;
    x.financas.bens.push(im);
    Object.assign(x.moradia, { tipo: 'propria', modeloId, imovelId: 'im1', aluguel: 0, bairro: 'num bairro novo' });
    x.financas.conta = 12345;
    extra(x);
  }).vida;
}

describe('VIDA 22 · ficha do imóvel', () => {
  it('separa o valor do imóvel, o dinheiro na conta e o patrimônio', () => {
    const v = propria('casa_3q', 640000);
    const { container } = render(<FichaDoImovel22 vida={v} />);
    const t = container.textContent!;
    expect(t).toMatch(/Valor estimado do imóvel/);
    expect(t).toMatch(/Não é dinheiro na conta/);
    expect(t).toMatch(/Na conta agora/);
    expect(t).toMatch(/Patrimônio líquido/);
    expect(t).toMatch(/num bairro novo/);
  });
  it('casa alugada não mostra valor do imóvel como patrimônio', () => {
    const v = transacao(base, x => { Object.assign(x.moradia, { tipo: 'aluguel', modeloId: 'apto_2q', aluguel: 2000 }); }).vida;
    const t = render(<FichaDoImovel22 vida={v} />).container.textContent!;
    expect(t).toMatch(/Alugada/);
    expect(t).not.toMatch(/Valor estimado do imóvel/);
  });
  it('lista a obra feita como melhoria', () => {
    const v = propria('casa_2q', 400000, x => { (x.financas.bens[x.financas.bens.length - 1] as Imovel).lar = { extras: [{ id: 'piscina', tipo: 'piscina', de: 'obra', t: x.t - 12 }], acabamentos: {} }; });
    const t = render(<FichaDoImovel22 vida={v} />).container.textContent!;
    expect(t).toMatch(/Construiu a piscina/);
  });
});

describe('VIDA 22 · a casa no lugar dela', () => {
  it('a piscina construída aparece no desenho; sem ela, não', () => {
    const com = propria('casa_2q', 400000, x => { (x.financas.bens[x.financas.bens.length - 1] as Imovel).lar = { extras: [{ id: 'piscina', tipo: 'piscina', de: 'obra', t: x.t - 12 }], acabamentos: {} }; });
    const l = leituraDoLar(com);
    expect(l.extras).toContain('piscina');
    expect(render(<CenaDaCasa l={l} />).container.querySelector('[data-anexo="piscina"]')).toBeTruthy();
    const sem = leituraDoLar(propria('casa_2q'));
    expect(render(<CenaDaCasa l={sem} />).container.querySelector('[data-anexo="piscina"]')).toBeNull();
  });
  it('a casa tem vizinhos e rua conforme o bairro; o sítio não tem vizinho de casa', () => {
    const l = leituraDoLar(propria('casa_2q'));
    const c = render(<CenaDaCasa l={l} />).container;
    expect(c.querySelectorAll('[data-entorno="casa"]').length).toBeGreaterThan(0);
    expect(c.querySelectorAll('[data-entorno="poste"]').length).toBe(2);
    const s: LeituraLar = { ...leituraDoLar(propria('sitio')), entorno: { perfil: 'pequena', semente: 'x', bairro: 'na zona rural, perto da cidade' } };
    const cs = render(<CenaDaCasa l={s} />).container;
    expect(cs.querySelectorAll('[data-entorno="casa"]').length).toBe(0);
    expect(cs.querySelectorAll('[data-entorno="pasto"]').length).toBeGreaterThan(0);
  });
  it('a churrasqueira comprada vai para o quintal da casa', () => {
    const v = propria('casa_3q', 600000, x => { (x.financas.coisas ??= []).push({ id: 'c1', coisaId: 'churrasqueira', t: x.t, preco: 900, estado: 100 }); });
    const c = render(<CenaDaCasa l={leituraDoLar(v)} />).container;
    expect(c.querySelector('[data-coisa="churrasqueira"]')).toBeTruthy();
  });
});
