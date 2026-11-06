/**
 * VIDA 12.9 — hobbies com história: o instrumento avança (mais com aula e com o instrumento em casa; mais devagar o
 * difícil), trocar não apaga o que se aprendeu, os marcos vêm da habilidade e têm consequência pequena e real, e o ano
 * dos hobbies não escreve na biografia nem gasta o acaso.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { executar } from '../acoes';
import { processarHobbies129, instrumentoAtual, nivelNoInstrumento } from '../sistemas/hobbies129';
import type { Vida } from '../tipos';

const base = (): Vida => transacao(adulto(20, { semente: 1296, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 50_000; x.rotinas = []; }).vida;
const comRotina = (v: Vida, id: string, nivel: 1 | 2 | 3) => transacao(v, x => { x.rotinas.push({ id, tInicio: x.t, nivel } as never); }).vida;
const anos = (v: Vida, n: number) => transacao(v, x => { for (let k = 0; k < n; k++) { processarHobbies129(x); x.t += 12; } }).vida;

describe('12.9 · instrumentos', () => {
  it('aula avança mais que tocar por conta; instrumento em casa acelera; violino é mais lento que violão', () => {
    const s = anos(comRotina(base(), 'musica', 1), 3).caminhos.hobbies129!.instrumentos!.violao;
    const a = anos(comRotina(base(), 'musica', 2), 3).caminhos.hobbies129!.instrumentos!.violao;
    expect(a).toBeGreaterThan(s);
    let v = comRotina(base(), 'musica', 2);
    v = executar(v, { tipo: 'instrumento', id: 'violino' }).vida;
    const vi = anos(v, 3).caminhos.hobbies129!.instrumentos!.violino;
    expect(vi).toBeLessThan(a);
    let c = transacao(comRotina(base(), 'musica', 2), x => { (x.financas.coisas ??= []).push({ id: 'cv1', coisaId: 'violao', t: x.t, estado: 100 } as never); }).vida;
    c = anos(c, 3);
    expect(c.caminhos.hobbies129!.instrumentos!.violao).toBeGreaterThan(a);
  });

  it('trocar de instrumento guarda o que se aprendeu; marcos por degrau, uma vez cada; nada na biografia', () => {
    let v = comRotina(base(), 'musica', 3);
    const bio = v.biografia.length;
    v = anos(v, 6);
    const meses = v.caminhos.hobbies129!.instrumentos!.violao;
    expect(nivelNoInstrumento(meses).indice).toBeGreaterThanOrEqual(2);
    const marcos = v.caminhos.hobbies129!.marcos!.filter(m => m.id.startsWith('musica:violao'));
    expect(marcos.length).toBe(nivelNoInstrumento(meses).indice);
    v = executar(v, { tipo: 'instrumento', id: 'piano' }).vida;
    expect(instrumentoAtual(v)).toBe('piano');
    v = anos(v, 2);
    expect(v.caminhos.hobbies129!.instrumentos!.violao).toBe(meses);
    expect(v.caminhos.hobbies129!.instrumentos!.piano).toBeGreaterThan(0);
    expect(v.biografia.length).toBe(bio + 0);
  });
});

describe('12.9 · marcos dos hobbies', () => {
  it('a foto vendida põe dinheiro na conta uma vez; o almoço de domingo aproxima quem mora junto', () => {
    let v = transacao(comRotina(comRotina(base(), 'fotografia', 2), 'cozinhar', 1), x => {
      x.caminhos.frentes.fotografia = { ...(x.caminhos.frentes.fotografia ?? {}), habilidade: 80 } as never;
      x.caminhos.frentes.cozinha = { ...(x.caminhos.frentes.cozinha ?? {}), habilidade: 55 } as never;
    }).vida;
    const conta = v.financas.conta;
    v = anos(v, 1);
    expect(v.financas.conta).toBeGreaterThan(conta);
    const depois = v.financas.conta;
    v = anos(v, 1);
    expect(v.financas.conta).toBe(depois);
    expect(v.caminhos.hobbies129!.marcos!.map(m => m.id)).toEqual(expect.arrayContaining(['fotografia:72', 'cozinhar:50']));
  });
  it('sem a rotina, sem marco (a habilidade sozinha não basta)', () => {
    const v = anos(transacao(base(), x => { x.caminhos.frentes.desenho = { habilidade: 90 } as never; }).vida, 1);
    expect(v.caminhos.hobbies129?.marcos ?? []).toEqual([]);
  });
});
