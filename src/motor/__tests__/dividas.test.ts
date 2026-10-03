/**
 * Auditoria das dívidas no fim da vida (pendência 6 do pacote pré-América do
 * Sul) — a única causa de motor confirmada: o rotativo crescia sem teto.
 *
 * A Lei 14.690/2023 (art. 28) limita juros e encargos do rotativo do cartão
 * a 100% do valor original da dívida. O motor cobrava 4,5% ao mês sobre o
 * saldo inteiro, para sempre (≈ 70% ao ano composto): quem pagava um pouco
 * todo ano — e por isso não ia para a cobrança — via R$ 8 mil virarem
 * dezenas de milhares. Agora a dívida guarda o principal (o que de fato foi
 * tomado) e o saldo para no dobro dele. O resto do diagnóstico (agente que
 * não trabalha, aluguel sem renda na velhice) está em
 * `docs/notas/SAUDE-NPC-E-DIVIDAS.md` e em `scripts/sim/dividas.ts`.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { interpretar } from '../save';
import { processarDinheiro } from '../sistemas/dinheiro';
import { conciliar, fecharExtrato } from '../sistemas/extrato';
import type { AnoEconomico } from '../sistemas/economia';
import type { Divida, Vida } from '../tipos';

const ANO: AnoEconomico = { fase: 'normal', inflacao: 0.045, juroReal: 0.05, bolsa: 0.04, imoveis: 0.01, deltaJuro: 0, virou: false };

let base: Vida | undefined;
/** Adulto de 40, sem trabalho e sem nada guardado, com um cartão rodando (o limite de quem não tem renda já está tomado). */
function comCartao(cartao: Partial<Divida>, conta = 0): Vida {
  base ??= adulto(40, { semente: 31 });
  return transacao(structuredClone(base), x => {
    x.trabalho.atual = undefined;
    x.financas.investimentos = [];
    x.financas.negativado = false;
    x.financas.conta = conta;
    x.financas.dividas = [{ id: 'cartao1', tipo: 'cartao', saldo: 15000, jurosMes: 0.045, parcela: 0, descricao: 'Cartão e cheque especial', tInicio: x.t - 24, ...cartao }];
    x.financas.extratoAberto = undefined;
    x.momento = null;
  }).vida;
}

const umAno = (v: Vida) => transacao(v, (x, r) => { x.t += 12; processarDinheiro(x, r, ANO); fecharExtrato(x); }).vida;
const cartao = (v: Vida) => v.financas.dividas.find(d => d.tipo === 'cartao');

describe('rotativo: juros e encargos até 100% do principal (Lei 14.690/2023)', () => {
  it('R$ 15 mil de saldo sobre R$ 8 mil tomados: o ano para em R$ 16 mil (sem o teto, seriam R$ 25,5 mil)', () => {
    const v = umAno(comCartao({ principal: 8000 }));
    const c = cartao(v)!;
    expect(15000 * Math.pow(1.045, 12)).toBeGreaterThan(25000); // o que o motor cobrava antes
    expect(c.saldo).toBe(16000);
    expect(c.principal).toBe(8000);
  });

  it('o teto vale ano após ano: o saldo nunca passa do dobro do que foi tomado', () => {
    let v = comCartao({ saldo: 8000, principal: 8000 });
    for (let k = 0; k < 6; k++) {
      v = umAno(v);
      const c = cartao(v);
      if (!c) break; // caducou ou foi paga
      expect(c.saldo).toBeLessThanOrEqual(2 * (c.principal ?? 0) + 1);
    }
  });

  it('dívida antiga (sem principal registrado): o teto passa a contar do saldo de agora', () => {
    const v = umAno(comCartao({ saldo: 10000 }));
    const c = cartao(v)!;
    expect(c.principal).toBe(10000);
    expect(c.saldo).toBe(Math.round(Math.min(20000, 10000 * Math.pow(1.045, 12))));
  });

  it('o crédito novo do ano no vermelho entra no principal; o pagamento abate primeiro os encargos', () => {
    // Sem cartão: o buraco do ano vai para um cartão novo, e o principal é o que foi tomado.
    const semCartao = transacao(comCartao({}), x => { x.financas.dividas = []; }).vida;
    const v1 = umAno(semCartao);
    const novo = cartao(v1);
    if (novo) expect(novo.principal).toBe(novo.saldo);
    // Com dinheiro na conta, o fechamento paga o cartão: o principal só cai quando o saldo fica abaixo dele.
    const v2 = umAno(comCartao({ saldo: 15000, principal: 8000 }, 60000));
    const pago = cartao(v2);
    if (pago) expect(pago.principal).toBeLessThanOrEqual(Math.min(8000, pago.saldo));
  });

  it('a conta do ano continua fechando (os juros não passam pela conta; o extrato não ganha ajuste)', () => {
    const v = umAno(comCartao({ principal: 8000 }));
    const c = conciliar(v.financas.extrato!);
    expect(c.ok).toBe(true);
    expect(c.ajustes).toEqual([]);
  });

  it('o principal vai no save; valor inválido é recusado; save sem principal continua válido', () => {
    const v = umAno(comCartao({ principal: 8000 }));
    const ok = interpretar(JSON.stringify(v));
    expect(ok.tipo).toBe('ok');
    if (ok.tipo === 'ok') expect(cartao(ok.vida)!.principal).toBe(8000);
    const antigo = JSON.parse(JSON.stringify(v));
    delete antigo.financas.dividas[0].principal;
    expect(interpretar(JSON.stringify(antigo)).tipo).toBe('ok');
    const ruim = JSON.parse(JSON.stringify(v));
    ruim.financas.dividas[0].principal = -5;
    expect(interpretar(JSON.stringify(ruim)).tipo).toBe('invalido');
  });
});
