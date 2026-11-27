/** VIDA 38 · bloco 3 — ajudar a cidade: a doação custa e dá alívio; o voluntariado não custa e cansa; uma vez por ano. */
import '../sistemas/extrasCarregar38';
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import type { Imovel, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

function gente(idadeAnos = 40): Vida {
  const v = adulto(idadeAnos, { semente: 7 });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = 3_000_000; v.financas.dividas = []; v.financas.negativado = false;
  v.financas.coisas = []; v.financas.colecao = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  v.rotinas = [];
  return v;
}

describe('ajudar a cidade (VIDA 38 · bloco 3)', () => {
  it('a doação grande custa, dá felicidade e fica no total da vida', () => {
    let v = gente();
    const conta0 = v.financas.conta, f0 = v.mente.felicidade;
    expect(pode(v, p({ o: 'ajudar_dinheiro', valor: 'grande' }))).toBe(true);
    v = executar(v, p({ o: 'ajudar_dinheiro', valor: 'grande' })).vida;
    expect(v.financas.conta).toBeLessThan(conta0);
    expect(v.mente.felicidade).toBeGreaterThan(f0);
    expect(v.fatos['ajudar:total']).toBeGreaterThan(0);
  });

  it('uma doação por ano do mesmo tipo', () => {
    let v = gente();
    v = executar(v, p({ o: 'ajudar_dinheiro', valor: 'pequena' })).vida;
    expect(pode(v, p({ o: 'ajudar_dinheiro', valor: 'pequena' }))).toBe(false);
  });

  it('o voluntariado não custa dinheiro e cansa', () => {
    let v = gente();
    const conta0 = v.financas.conta, e0 = v.mente.estresse;
    v = executar(v, p({ o: 'voluntariar' })).vida;
    expect(v.financas.conta).toBe(conta0);
    expect(v.mente.estresse).toBeGreaterThan(e0);
  });

  it('criança não pode ajudar com dinheiro', () => {
    expect(pode(gente(10), p({ o: 'ajudar_dinheiro', valor: 'pequena' }))).toBe(false);
  });
});
