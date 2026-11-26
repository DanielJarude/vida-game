/**
 * VIDA 37 — e-sports de verdade e uma bicicleta só.
 *  - Organizações reais (a Liquid, a FURIA…) não estão à venda: quem compra uma line delas vira dono do time real.
 *  - A vantagem sobre o campo tem teto: dinheiro e gestão somam, mas um time muito acima da liga ainda perde de vez em quando.
 *  - O torneio de convidados só chama quem tem nome; o major não se compra (a vaga vem da colocação na liga).
 *  - Troféu só para o campeonato principal de cada jogo (o mundial, o Major, o Six Invitational); liga e torneio ficam no histórico.
 *  - A história da bicicleta sem rodinhas acontece uma vez só na infância.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { orgsAVenda31, principalDoAno37, processarOrg31, vantagemContida37, TETO_DA_VANTAGEM37, FATOR_DA_SOBRA37, linhaDe31 } from '../v31/esports/org31';
import type { OqueOrg31 } from '../v31/esports/org31';
import type { Vida } from '../tipos';

const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
function rico(semente = 370): Vida {
  const v = adulto(30, { semente, municipioId: 'campinas-sp' });
  v.financas.conta = 2e10;
  return v;
}

describe('VIDA 37 · organizações reais não se compram', () => {
  it('a lista à venda só tem organizações fictícias', () => {
    const v = rico();
    const lista = orgsAVenda31(v);
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every(x => !x.real)).toBe(true);
  });

  it('nenhuma line de organização real entra na lista, em nenhuma região', () => {
    const v = rico(371);
    const nomesReais = orgsAVenda31(v).filter(x => x.real).map(x => x.nome);
    expect(nomesReais).toEqual([]);
  });
});

describe('VIDA 37 · teto da vantagem sobre o campo', () => {
  it('até o teto, a vantagem vale inteira; acima dele, rende uma fração', () => {
    expect(vantagemContida37(0)).toBe(0);
    expect(vantagemContida37(TETO_DA_VANTAGEM37)).toBe(TETO_DA_VANTAGEM37);
    expect(vantagemContida37(TETO_DA_VANTAGEM37 + 16)).toBeCloseTo(TETO_DA_VANTAGEM37 + 16 * FATOR_DA_SOBRA37, 6);
    expect(vantagemContida37(-5)).toBe(-5);
  });
});

describe('VIDA 37 · torneios: o convite é de quem tem nome, o major não se compra', () => {
  it('o torneio de convidados fica bloqueado para uma organização sem reputação', () => {
    let v = rico();
    v = tenta(v, A({ op: 'fundar', nome: 'Sem Nome Esports', jogo: 'lol', regiao: 'br', modo: 'elite', investimento: 2e6 }));
    if (!v.orgEsports31) throw new Error('a organização não foi fundada');
    v.orgEsports31.reputacao = 10;
    expect(pode(v, A({ op: 'torneio', jogo: 'lol', tipo: 'convite' }))).toBe(false);
    v.orgEsports31.reputacao = 80;
    expect(pode(v, A({ op: 'torneio', jogo: 'lol', tipo: 'convite' }))).toBe(true);
  });
});

describe('VIDA 37 · o campeonato principal é o único troféu', () => {
  it('o principal é o evento de maior peso do ano (o Six Invitational em 2019, o Mundial do RLCS em 2024)', () => {
    expect(principalDoAno37('r6', 2019)).toBe('Six Invitational');
    expect(principalDoAno37('rocket', 2024)).toBe('Mundial do RLCS');
    expect(principalDoAno37('cs', 2019)).toBe('Major de Counter-Strike');
  });

  it('uma temporada de liga não gera troféu; só o principal pode gerar', () => {
    let v = rico(372);
    v = tenta(v, A({ op: 'fundar', nome: 'Troféu Esports', jogo: 'cs', regiao: 'sa', modo: 'elite', investimento: 2e7 }));
    expect(v.orgEsports31).toBeDefined();
    for (let k = 0; k < 8; k++) { v.t += 12; processarOrg31(v); }
    const L = linhaDe31(v.orgEsports31!, 'cs')!;
    expect(L.historico.length).toBeGreaterThan(0);
    for (const t of L.trofeus) expect(t.tipo).toBe('mundial');
  });
});
