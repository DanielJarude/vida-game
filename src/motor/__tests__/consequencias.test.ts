import { describe, expect, it } from 'vitest';
import { nova, viverAte } from './ajuda';
import { criarRng } from '../rng';
import { processarDinheiro } from '../sistemas/dinheiro';
import { verificarDespejo } from '../sistemas/moradia';
import { processarTrabalho, contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { vinculosVivos } from '../nucleo';
import type { Vida } from '../tipos';

function adultaSozinha(semente = 7): Vida {
  const v = viverAte(nova({ semente, classe: 'trabalhadora' }), 24);
  for (const { vin } of vinculosVivos(v)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'kitnet', aluguel: 900, padrao: 2, tInicio: v.t };
  v.trabalho.atual = undefined;
  v.financas.conta = 0;
  v.financas.reserva = 0;
  return v;
}

describe('dinheiro com consequência', () => {
  it('cartão sem nenhum pagamento no ano suja o nome, a dívida para de explodir e caduca em 5 anos', () => {
    const v = adultaSozinha();
    // Mora de favor: sem aluguel, o único problema é o cartão antigo.
    v.moradia = { tipo: 'cedida', municipioId: v.moradia.municipioId, aluguel: 0, padrao: 1, tInicio: v.t };
    v.financas.estilo = 'apertado';
    v.financas.dividas.push({ id: 'c', tipo: 'cartao', saldo: 1200, jurosMes: 0.045, parcela: 0, descricao: 'Cartão' });
    const r = criarRng(1);
    v.t += 12; processarDinheiro(v, r);
    expect(v.financas.negativado).toBe(true);
    for (let k = 0; k < 6; k++) { v.t += 12; processarDinheiro(v, r); }
    const cartao = v.financas.dividas.find(d => d.tipo === 'cartao');
    expect(cartao?.saldo ?? 0).toBeLessThan(10000);
    expect(v.biografia.some(e => /caducou/.test(e.texto))).toBe(true);
  });

  it('quitar as dívidas limpa o nome', () => {
    const v = adultaSozinha();
    v.financas.negativado = true;
    v.fatos['negativado_desde'] = v.t;
    v.financas.dividas.push({ id: 'c', tipo: 'cartao', saldo: 500, jurosMes: 0.045, parcela: 0, descricao: 'Cartão' });
    v.financas.conta = 100000;
    v.t += 12;
    processarDinheiro(v, criarRng(2));
    expect(v.financas.negativado).toBe(false);
  });

  it('sem renda, sem reserva e com nome sujo há mais de um ano: despejo', () => {
    const v = adultaSozinha();
    v.financas.negativado = true;
    v.fatos['negativado_desde'] = v.t - 24;
    verificarDespejo(v);
    expect(['pais', 'cedida']).toContain(v.moradia.tipo);
    expect(v.biografia[v.biografia.length - 1].texto).toMatch(/despejo/i);
  });
});

describe('o mundo acontece', () => {
  it('recessão aumenta demissões', () => {
    const base = adultaSozinha(3);
    const contar = (recessao: boolean) => {
      let demitidos = 0;
      for (let s = 1; s <= 400; s++) {
        const v = structuredClone(base);
        const r = criarRng(s);
        contratar(v, r, ocupacao('atendente'));
        v.trabalho.atual!.desempenho = 60;
        // O mundo da vida-base pode já estar em crise: o teste controla os dois lados.
        v.fatos['recessao_ate'] = recessao ? v.t + 36 : 0;
        v.t += 12;
        processarTrabalho(v, r);
        if (!v.trabalho.atual) demitidos++;
      }
      return demitidos;
    };
    expect(contar(true)).toBeGreaterThan(contar(false));
  });
});
