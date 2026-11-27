/**
 * VIDA 38 · bloco 2 — o jardim que se vê. O estado vem do cuidado do dia a dia (o uso `cuidar` do jardim) e das mudas
 * de flores compradas na loja da casa. Sem jardim na casa, não há estado nenhum.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { receberCoisa } from '../sistemas/coisas';
import { comodosDaCasa } from '../sistemas/lar';
import { podeTentar } from '../plausibilidade';
import { estadoDoJardim } from '../sistemas/casaViva';
import { coisa } from '../dados/coisas';
import type { Imovel, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

/** Dona de uma casa com jardim (casa_3q tem jardim de série), com dinheiro e sem ninguém morando junto. */
function dona(modeloId = 'casa_3q', conta = 3_000_000): Vida {
  const v = adulto(40, { semente: 7 });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false;
  v.financas.coisas = []; v.financas.colecao = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId, nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId, aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  v.rotinas = [];
  return v;
}

const idJardim = (v: Vida) => comodosDaCasa(v).find(c => c.tipo === 'jardim')!.id;
const cuidar = (v: Vida) => fazer(v, p({ o: 'usar_comodo', comodo: idJardim(v), uso: 'cuidar' }));

describe('o jardim que se vê (VIDA 38 · bloco 2)', () => {
  it('sem jardim na casa, não há estado nenhum', () => {
    const v = dona('apto_1q');
    expect(estadoDoJardim(v)).toBeUndefined();
  });

  it('casa com jardim começa "comum": nunca foi cuidado', () => {
    expect(estadoDoJardim(dona())).toBe('comum');
  });

  it('cuidar do jardim o deixa "cuidado"', () => {
    const v = cuidar(dona());
    expect(estadoDoJardim(v)).toBe('cuidado');
  });

  it('com mudas de flores compradas e cuidado, o jardim fica "florido"', () => {
    let v = dona();
    receberCoisa(v, 'mudas_flores', coisa('mudas_flores')!.preco);
    v = cuidar(v);
    expect(estadoDoJardim(v)).toBe('florido');
  });

  it('as mudas sozinhas, sem cuidado, não florescem', () => {
    const v = dona();
    receberCoisa(v, 'mudas_flores', coisa('mudas_flores')!.preco);
    expect(estadoDoJardim(v)).toBe('comum');
  });

  it('dois anos sem cuidar, o jardim fica "descuidado" (mesmo com mudas)', () => {
    let v = dona();
    receberCoisa(v, 'mudas_flores', coisa('mudas_flores')!.preco);
    v = cuidar(v);
    v.t += 25;
    expect(estadoDoJardim(v)).toBe('descuidado');
  });

  it('a loja de casa vende as mudas de flores, com o jardim como cômodo delas', () => {
    expect(coisa('mudas_flores')?.loja).toBe('casa');
    expect(coisa('mudas_flores')?.preco).toBeGreaterThan(0);
  });
});
