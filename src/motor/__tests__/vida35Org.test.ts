/**
 * VIDA 35 — a organização que o dono monta: o equipamento da line (soma na força e envelhece), os cômodos da casa, os
 * eventos, a line academy (temporada própria, subir e descer), a reformulação, emprestar e vender, comprar a line de outra
 * organização e os saves.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { exportarVida, importarVida, interpretar } from '../save';
import { anoDe } from '../tempo';
import { forcaDoTime31, linhaDe31, orgsAVenda31, planoDaReformulacao35, processarOrg31, titularesDoJogo31, type OqueOrg31 } from '../v31/esports/org31';
import { bonusDoSetup35 } from '../v31/esports/org35';
import type { Vida } from '../tipos';

const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
function comOrg(): Vida {
  const v = adulto(30, { semente: 35, municipioId: 'campinas-sp' }); v.financas.conta = 2e9;
  const w = tenta(v, A({ op: 'fundar', nome: 'Quero-Quero Esports', jogo: 'lol', regiao: 'br', modo: 'elite', investimento: 2e6 }));
  w.orgEsports31!.caixa = 3e8;
  return w;
}
const L = (v: Vida) => v.orgEsports31!.linhas[0];

describe('equipamento', () => {
  it('o topo de linha soma na força, custa do caixa e envelhece', () => {
    let v = comOrg(); const ano = anoDe(v.t);
    const f0 = forcaDoTime31(v.orgEsports31!, L(v), ano); const c0 = v.orgEsports31!.caixa;
    v = tenta(v, A({ op: 'setup', jogo: 'lol', setup: { pc: 3, monitor: 3, perifericos: 3, cadeira: 3, gabinete: 'aquario', rgb: '#06b6d4' } }));
    expect(L(v).setup35).toMatchObject({ pc: 3, gabinete: 'aquario' });
    expect(v.orgEsports31!.caixa).toBeLessThan(c0);
    expect(forcaDoTime31(v.orgEsports31!, L(v), ano)).toBeCloseTo(f0 + 1.8, 1);
    expect(bonusDoSetup35(L(v).setup35, ano + 3)).toBeCloseTo(0.9, 1);
    expect(bonusDoSetup35(L(v).setup35, ano + 5)).toBe(0);
  });
});

describe('a casa e os eventos', () => {
  it('cômodos somam força e custam por ano; evento uma vez por ano', () => {
    let v = comOrg(); const ano = anoDe(v.t);
    const f0 = forcaDoTime31(v.orgEsports31!, L(v), ano);
    v = tenta(v, A({ op: 'comodo', id: 'analise', construir: true }));
    v = tenta(v, A({ op: 'comodo', id: 'chef', construir: true }));
    expect(v.orgEsports31!.casa35).toEqual(['analise', 'chef']);
    expect(forcaDoTime31(v.orgEsports31!, L(v), ano)).toBeGreaterThan(f0);
    const fas = v.orgEsports31!.fas;
    v = tenta(v, A({ op: 'evento', tipo: 'torneio' }));
    expect(v.orgEsports31!.fas).toBeGreaterThan(fas);
    expect(pode(v, A({ op: 'evento', tipo: 'torneio' }))).toBe(false);
  });
});

describe('line academy', () => {
  it('monta, joga a temporada uma divisão abaixo, sobe e desce jogadores', () => {
    let v = comOrg();
    v = tenta(v, A({ op: 'academy', jogo: 'lol', ativar: true }));
    const a = L(v).academy35!;
    expect(a.elenco.length).toBe(titularesDoJogo31('lol', anoDe(v.t)));
    const quem = a.elenco[0].id;
    // A principal cheia (titulares + reserva) não recebe: desce alguém antes.
    if (L(v).elenco.length > titularesDoJogo31('lol', anoDe(v.t))) v = tenta(v, A({ op: 'descer', jogo: 'lol', id: L(v).elenco[L(v).elenco.length - 1].id }));
    v = tenta(v, A({ op: 'subir', jogo: 'lol', id: quem }));
    expect(L(v).elenco.some(j => j.id === quem)).toBe(true);
    v.t += 12; processarOrg31(v);
    expect(L(v).academy35!.historico.length).toBe(1);
    expect(L(v).academy35!.historico[0].divisao).toBeLessThan(L(v).historico[0].divisao);
  });
});

describe('reformular, emprestar, vender', () => {
  it('a reformulação troca quem não fica, pelo plano mostrado', () => {
    let v = comOrg();
    const fica = L(v).elenco[0].id;
    const plano = planoDaReformulacao35(v, v.orgEsports31!, L(v), [fica], 'ambiciosa');
    v = tenta(v, A({ op: 'reformular', jogo: 'lol', manter: [fica], nivel: 'ambiciosa' }));
    expect(L(v).elenco.map(j => j.nick).sort()).toEqual([L(v).elenco.find(j => j.id === fica)!.nick, ...plano.novos.map(j => j.nick)].sort());
  });
  it('emprestado volta na virada; vender põe dinheiro no caixa', () => {
    let v = comOrg();
    const n = L(v).elenco.length;
    if (n <= titularesDoJogo31('lol', anoDe(v.t))) return;
    const res = L(v).elenco[L(v).elenco.length - 1].id;
    v = tenta(v, A({ op: 'emprestar', jogo: 'lol', id: res }));
    expect(L(v).emprestados35?.length).toBe(1);
    v.t += 12; processarOrg31(v);
    expect(L(v).emprestados35).toBeUndefined();
    const c = v.orgEsports31!.caixa;
    const extra = L(v).elenco.length > titularesDoJogo31('lol', anoDe(v.t)) ? L(v).elenco[L(v).elenco.length - 1].id : undefined;
    if (extra) { v = tenta(v, A({ op: 'vender_jogador', jogo: 'lol', id: extra })); expect(v.orgEsports31!.caixa).toBeGreaterThan(c); }
  });
});

describe('comprar a line de outra organização', () => {
  it('num jogo novo vira line nova; a org comprada sai da vitrine', () => {
    let v = comOrg();
    const alvo = orgsAVenda31(v, { jogo: 'cs' }).sort((a, b) => b.divisao - a.divisao)[0];
    v = tenta(v, A({ op: 'comprar_linha', nome: alvo.nome, jogo: 'cs', regiao: alvo.regiao }));
    expect(linhaDe31(v.orgEsports31!, 'cs')?.divisao).toBe(alvo.divisao);
    expect(orgsAVenda31(v, { jogo: 'cs' }).some(x => x.nome === alvo.nome)).toBe(false);
  });
});

describe('saves', () => {
  it('equipamento, academy e cômodos sobrevivem a exportar/importar', () => {
    let v = comOrg();
    v = tenta(v, A({ op: 'setup', jogo: 'lol', setup: { pc: 2, monitor: 2, perifericos: 1, cadeira: 1 } }));
    v = tenta(v, A({ op: 'academy', jogo: 'lol', ativar: true }));
    v = tenta(v, A({ op: 'comodo', id: 'fisio', construir: true }));
    const r = interpretar(JSON.stringify(JSON.parse(exportarVida(v)).vida));
    expect(r.tipo).toBe('ok'); if (r.tipo !== 'ok') return;
    const w = r.vida;
    expect(importarVida(exportarVida(v)).tipo).toBe('ok');
    expect(w.orgEsports31!.linhas[0].setup35?.pc).toBe(2);
    expect(w.orgEsports31!.linhas[0].academy35?.elenco.length).toBeGreaterThan(0);
    expect(w.orgEsports31!.casa35).toEqual(['fisio']);
  });
});
