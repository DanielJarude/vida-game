/** VIDA 38 · bloco 3 — cozinhar em casa dá saúde (não só humor); comer fora custa e não mexe na saúde. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { receberCoisa } from '../sistemas/coisas';
import { comodosDaCasa } from '../sistemas/lar';
import { coisa } from '../dados/coisas';
import type { Imovel, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

function dona(): Vida {
  const v = adulto(40, { semente: 7 });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = 3_000_000; v.financas.dividas = []; v.financas.negativado = false;
  v.financas.coisas = []; v.financas.colecao = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  v.rotinas = [];
  return v;
}
const idCozinha = (v: Vida) => comodosDaCasa(v).find(c => c.tipo === 'cozinha')!.id;
const usar = (v: Vida, uso: string) => fazer(v, p({ o: 'usar_comodo', comodo: idCozinha(v), uso }));

describe('cozinha: a comida tem efeito na saúde (VIDA 38 · bloco 3)', () => {
  it('cozinhar em casa aumenta a saúde, com o fogão ligado', () => {
    let v = dona();
    receberCoisa(v, 'fogao', coisa('fogao')!.preco);
    v.corpo.saude = 50;
    v = usar(v, 'cozinhar');
    expect(v.corpo.saude).toBeGreaterThan(50);
  });

  it('comer fora cobra o jantar e não mexe na saúde', () => {
    let v = dona();
    receberCoisa(v, 'fogao', coisa('fogao')!.preco);
    v.corpo.saude = 50;
    const conta0 = v.financas.conta;
    v = usar(v, 'comer_fora');
    expect(v.financas.conta).toBeLessThan(conta0);
    expect(v.corpo.saude).toBe(50);
  });

  it('cozinhar só uma vez por ano', () => {
    let v = dona();
    receberCoisa(v, 'fogao', coisa('fogao')!.preco);
    v = usar(v, 'cozinhar');
    expect(pode(v, p({ o: 'usar_comodo', comodo: idCozinha(v), uso: 'cozinhar' }))).toBe(false);
  });
});
