/**
 * VIDA 12.7 — os acontecimentos financeiros leem a condição econômica de verdade (o milionário recebia "O curso pesa: a
 * mensalidade vence dia 10, e o dinheiro do mês já acabou no dia 3"). Patrimônio ≠ dinheiro disponível.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { criarRng } from '../rng';
import { apertoDeVerdade, condicaoEconomica, semCaixa } from '../sistemas/dinheiro';
import type { Imovel, Vida } from '../tipos';

function estudante(conta: number, imovel = 0): Vida {
  const v = adulto(22, { semente: 21 });
  v.trabalho.atual = undefined;
  v.financas.conta = conta; v.financas.investimentos = []; v.financas.dividas = []; v.financas.bens = [];
  if (imovel) v.financas.bens = [{ id: 'iimo', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: imovel, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 } as Imovel];
  v.educacao.matricula = { cursoId: 'ed_fisica', instituicao: 'uma faculdade', rede: 'privada', modalidade: 'presencial', tInicio: v.t - 14, mesesRestantes: 30, mensalidade: 1500, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
  return v;
}
const cena = conteudoPorId('esc_faculdade_aperto')!;
const texto = (v: Vida) => { const c = preparar(cena, v, criarRng(3)); const t = (cena as unknown as { texto: string | ((c: unknown) => string) }).texto; return c ? (typeof t === 'function' ? t(c) : t) : null; };

describe('12.7 · a economia dos acontecimentos', () => {
  it('quem não tem dinheiro recebe "o curso pesa"; o milionário, não', () => {
    expect(texto(estudante(200))).toMatch(/dia 3/);
    expect(texto(estudante(5_000_000))).toBeNull();
    expect(texto(estudante(400_000))).toBeNull();
  });

  it('patrimônio alto preso em imóvel e pouco na conta: o aperto existe, mas é outro', () => {
    const v = estudante(300, 4_000_000);
    const c = condicaoEconomica(v);
    expect(c.faixa).toBe('milionaria');
    expect(c.iliquida).toBe(true);
    expect(apertoDeVerdade(v, 1500)).toBe(true);
    expect(texto(v)).toMatch(/patrimônio está quase todo em bens/);
  });

  it('as faixas: sem dinheiro, média, rica, milionária e bilionária', () => {
    expect(condicaoEconomica(estudante(0)).faixa).toMatch(/sem_dinheiro|apertada/);
    expect(condicaoEconomica(estudante(2_000_000)).faixa).toBe('milionaria');
    expect(condicaoEconomica(estudante(2e9)).faixa).toBe('bilionaria');
    expect(condicaoEconomica(estudante(500_000)).faixa).toBe('rica');
    expect(apertoDeVerdade(estudante(500_000), 1500)).toBe(false);
  });

  it('conta negativa com aplicação que cobre não é "sem caixa"', () => {
    const v = estudante(-2000);
    expect(semCaixa(v)).toBe(true);
    v.financas.investimentos = [{ produto: 'reserva', valor: 80_000, tInicio: v.t } as Vida['financas']['investimentos'][number]];
    expect(semCaixa(v)).toBe(false);
  });
});
