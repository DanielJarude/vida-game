/** VIDA 36 · correções de bugs da atualização (5.1 base esportiva; 5.4 desabafo do negócio que fechou). */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { executar } from '../acoes';
import { entrarNaBase } from '../sistemas/esporte';
import { FALAS17 as DESABAFOS17 } from '../dados17/celular/catalogo17';

describe('VIDA 36 · 5.1 parar a modalidade encerra a carreira na base', () => {
  it('a rotina de futebol parada no meio da base encerra a carreira (sem personagem "vinculado" à base)', () => {
    const { vida: v0 } = transacao(adulto(17, { semente: 36, genero: 'masculino', municipioId: 'campina-grande-pb' }), x => {
      x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined;
      entrarNaBase(x, 'futebol', x.moradia.municipioId, 'clube de bairro de Campina Grande');
    });
    expect(v0.caminhos.esporte?.fase).toBe('base');
    expect(v0.rotinas.some(r => r.id === 'futebol')).toBe(true);
    const { vida } = executar(v0, { tipo: 'rotina', id: 'futebol', ativa: false });
    expect(vida.caminhos.esporte?.fase).toBe('encerrada');
    expect(vida.caminhos.esporte?.motivoFim).toBe('escolha');
    expect(vida.rotinas.some(r => r.id === 'futebol')).toBe(false);
  });
});

describe('VIDA 36 · 5.4 quem fechou o próprio negócio não "foi demitido"', () => {
  it('há um desabafo próprio para o negócio que fechou, em todos os tons', () => {
    const d = DESABAFOS17.desabafo_negocio;
    expect(d).toBeDefined();
    for (const tom of ['expansivo', 'contido', 'carinhoso', 'ironico'] as const) expect(d[tom].length).toBeGreaterThan(0);
    expect(JSON.stringify(d)).not.toMatch(/demit|mandad/);
  });
});

import { nova } from './ajuda';
import { reacaoDoFamiliar } from '../sistemas/convivio126';
import { criarRng } from '../rng';
import type { Pessoa } from '../tipos';

describe('VIDA 36 · família: cada familiar reage pelo seu temperamento', () => {
  const base = Object.values(nova({ semente: 36 }).pessoas)[0] as Pessoa;
  const com = (t: Partial<Pessoa['temperamento']>, genero: 'feminino' | 'masculino' = 'masculino'): Pessoa => ({ ...base, nome: 'Sueli', genero, temperamento: { ...base.temperamento, extroversao: 0, afabilidade: 0, abertura: 0, estabilidade: 0, ...t } });
  const eu = { ...base, nome: 'Léo', genero: 'masculino' as const };

  it('o desconfiado e o afetuoso não saem com a mesma frase', () => {
    const desconf = com({ afabilidade: -0.6 });
    const afetuoso = com({ afabilidade: 0.7 });
    const tirar = (p: Pessoa) => { const outs = new Set<string>(); for (let k = 0; k < 40; k++) outs.add(reacaoDoFamiliar(p, eu, criarRng(k + 1), true)); return outs; };
    const a = tirar(desconf), b = tirar(afetuoso);
    for (const x of a) expect(b.has(x)).toBe(false);
    expect(a.size).toBeGreaterThan(5);
  });

  it('a reação diz o papel do familiar e o nome de quem chegou', () => {
    const mae = com({ afabilidade: 0.7 }, 'feminino');
    const texto = reacaoDoFamiliar(mae, eu, criarRng(3), false);
    expect(texto).toMatch(/A mãe/);
    expect(texto).toMatch(/Léo|Sueli/);
    expect(texto).not.toMatch(/\{/);
  });
});

import { reagiuConflito } from '../sistemas/conflitos';

describe('VIDA 36 · conflitos: a reação de quem discorda depende do tom dela', () => {
  const base = Object.values(nova({ semente: 37 }).pessoas)[0] as Pessoa;
  const com = (t: Partial<Pessoa['temperamento']>): Pessoa => ({ ...base, nome: 'Rui', temperamento: { ...base.temperamento, extroversao: 0, afabilidade: 0, abertura: 0, estabilidade: 0, ...t } });
  const ctx = (p: Pessoa) => ({ p } as unknown as Parameters<typeof reagiuConflito>[0]);
  it('o expansivo e o tímido reagem de forma diferente, e o nome aparece', () => {
    const colher = (p: Pessoa) => { const s = new Set<string>(); for (let k = 0; k < 30; k++) s.add(reagiuConflito(ctx(p), criarRng(k + 7))); return s; };
    const a = colher(com({ extroversao: 0.7 })), b = colher(com({ extroversao: -0.6 }));
    for (const x of a) expect(b.has(x)).toBe(false);
    for (const x of a) { expect(x).toMatch(/Rui/); expect(x).not.toMatch(/\{/); }
  });
});
