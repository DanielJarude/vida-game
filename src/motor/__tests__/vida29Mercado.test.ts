/** VIDA 29 · o mercado autônomo dos e-sports e do automobilismo: elenco com nome, janela com motivo, identidade coerente da equipe. */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { executar, type Acao } from '../acoes';
import { equipesDoCenario29, garantirElencoEsports29, processarEsports25 } from '../v25/esports/esports25';
import { processarAutomobilismo20 } from '../v20/automobilismo/automobilismo20';
import { adulto } from './cenarios';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });
const E = (oque: object) => ({ tipo: 'esports25', oque } as Acao);
function aos(idade: number): Vida { const v = nova({ semente: 290 + idade, genero: 'masculino', municipioId: 'sao-paulo-sp' } as never); v.t = v.eu.tNasc + idade * 12; return v; }

describe('VIDA 29 · e-sports: o cenário tem equipes fixas e elenco com nome', () => {
  it('as equipes de cada degrau são as mesmas sempre e não se repetem entre degraus', () => {
    const v = aos(18);
    const todos = [2, 3, 4, 5].flatMap(n => equipesDoCenario29('cs', n, v.id));
    expect(new Set(todos).size).toBe(todos.length);
    expect(equipesDoCenario29('cs', 3, v.id)).toEqual(equipesDoCenario29('cs', 3, v.id));
  });

  it('a proposta é de uma equipe do cenário (nunca a sua), e a equipe que propõe é a do contrato e do emprego', () => {
    let v = aos(18);
    v = executar(v, E({ op: 'comecar', jogo: 'cs' })).vida;
    const lista = equipesDoCenario29('cs', 3, v.id);
    v.esports25!.proposta = { equipe: lista[0], nivel: 3, forca: 60, salario: 4000, meses: 24, validaAte: v.t + 11, origem: 'mercado', titular: true, municipioId: 'sao-paulo-sp' };
    v = executar(v, E({ op: 'aceitar' })).vida;
    const e = v.esports25!;
    expect(e.equipe?.nome).toBe(lista[0]);
    expect(v.trabalho.atual?.empregador).toBe(lista[0]);
    expect(e.passagens[e.passagens.length - 1]?.equipe).toBe(lista[0]);
    // O elenco: quatro companheiros com nick, nome e função diferente da sua.
    const el = garantirElencoEsports29(v, e);
    expect(el.length).toBe(4);
    for (const x of el) { expect(x.nick.length).toBeGreaterThan(1); expect(x.nome).toMatch(/ /); expect(x.funcao).not.toBe(e.funcao); }
    // Anos de mercado: as trocas têm texto, e nenhuma proposta vem da própria equipe.
    for (let k = 0; k < 4 && e.fase !== 'encerrada'; k++) {
      v.t += 12;
      processarEsports25(v);
      const m = v.esports25!.mercado29!;
      expect(m.movimentos.length).toBeGreaterThan(0);
      const p = v.esports25!.proposta;
      if (p && v.esports25!.equipe) expect(p.equipe).not.toBe(v.esports25!.equipe.nome);
      if (v.esports25!.equipe && v.trabalho.atual?.ocupacaoId === 'jogador_esports') expect(v.trabalho.atual.empregador).toBe(v.esports25!.equipe.nome);
    }
  });
});

describe('VIDA 29 · automobilismo: o mercado de pilotos', () => {
  it('depois da temporada, o mercado registra o companheiro (fica ou é trocado) e as trocas do grid', () => {
    const v = adulto(19, { semente: 291 });
    v.financas.conta = 50_000_000;
    v.automobilismo20 = {
      fase: 'f3', inicio: v.t - 60, desde: v.t - 12, equipe: 'Halcyon GP', talento: 80,
      atributos: { pilotagem: 70, consistencia: 65, adaptacao: 60, fisico: 70, experiencia: 50, pressao: 60 },
      temporadas: [], vitorias: 0, podios: 0, titulos: 0, largadas: 0, companheiro: 'Teo Lins', rival: 'Bruno Sá'
    } as unknown as Vida['automobilismo20'];
    processarAutomobilismo20(v);
    const a = v.automobilismo20!;
    expect(a.temporadas.length).toBeGreaterThan(0);
    if (a.fase !== 'encerrada') {
      expect(a.mercado29?.movimentos.length).toBeGreaterThan(0);
      expect(a.mercado29!.movimentos.some(m => m.includes('Halcyon GP') || /trocou a/.test(m))).toBe(true);
      // Uma proposta na mesma categoria nunca é da própria equipe.
      if (a.proposta && a.proposta.categoria === a.fase) expect(a.proposta.equipe).not.toBe(a.equipe);
    }
  });

  it('o rival que sobe sai do seu grid (rivalCat29) e reaparece quando você chega à categoria dele', () => {
    const v = adulto(19, { semente: 292 });
    v.financas.conta = 50_000_000;
    v.automobilismo20 = {
      fase: 'f3', inicio: v.t - 60, desde: v.t - 12, equipe: 'Halcyon GP', talento: 80,
      atributos: { pilotagem: 70, consistencia: 65, adaptacao: 60, fisico: 70, experiencia: 50, pressao: 60 },
      temporadas: [], vitorias: 0, podios: 0, titulos: 0, largadas: 0, companheiro: 'Teo Lins', rival: 'Bruno Sá', rivalCat29: 'f2'
    } as unknown as Vida['automobilismo20'];
    processarAutomobilismo20(v);
    const ts = v.automobilismo20!.temporadas; const t = ts[ts.length - 1];
    expect(t.rivalPos ?? 0).toBe(0);
  });
});
