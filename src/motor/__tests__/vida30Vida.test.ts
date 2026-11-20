/**
 * VIDA 30 · §4–§5 — as experiências de cada fase e as pessoas que reagem: toda cena cabe na idade e resolve; conhecer a
 * família do par cria gente com jeito próprio e impressões diferentes; o que vem depois lê o que ficou; apresentar o par
 * à sua família traz a opinião depois; a velhice lembra um acontecimento real da infância.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { adulto, comFilho, comNeto, comParceiro, comParente } from './cenarios';
import { nova, viverAte } from './ajuda';
import { ACONTECIMENTOS_30_VIDA } from '../conteudo/acontecimentos30Vida';
import { abrirDecisao, prepararCom, preparar } from '../conteudo/motor';
import { executar } from '../acoes';
import { criarRng } from '../rng';
import { escrever } from '../nucleo';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

function abrir(v: Vida, id: string, papeis?: Record<string, string>): boolean {
  const c = ACONTECIMENTOS_30_VIDA.find(x => x.id === id)!;
  const ctx = papeis ? prepararCom(c, v, criarRng(7), papeis) : preparar(c, v, criarRng(7));
  if (!ctx || c.tipo !== 'decisao') return false;
  v.momento = null; delete v.fila;
  abrirDecisao(v, c, ctx);
  return v.momento?.situacaoId === id;
}

describe('VIDA 30 · §4 cada cena cabe na idade e resolve', () => {
  it('em vidas de 8 a 75 anos, toda cena que abre resolve todas as opções com texto', () => {
    const vidas: Vida[] = [];
    for (const [i, s] of [[8, 61], [15, 62], [24, 63], [36, 64], [52, 65], [72, 66]] as const) {
      let v = viverAte(nova({ semente: s, genero: s % 2 ? 'feminino' : 'masculino', municipioId: 'recife-pe' }), i);
      while (v.morte) v = viverAte(nova({ semente: s + 100, municipioId: 'recife-pe' }), i);
      v.momento = null; delete v.fila;
      vidas.push(v);
    }
    let abertas = 0;
    for (const base of vidas) for (const c of ACONTECIMENTOS_30_VIDA) {
      if (c.tipo !== 'decisao') continue;
      const teste = structuredClone(base);
      if (!abrir(teste, c.id)) continue;
      abertas++;
      for (const o of teste.momento!.opcoes.filter(x => !x.bloqueio)) {
        const v2 = structuredClone(teste);
        const r = executar(v2, { tipo: 'decidir', opcaoId: o.id });
        expect(r.vida.momento?.situacaoId === c.id ? '' : 'ok', `${c.id}/${o.id}`).toBe('ok');
      }
      // A idade da cena é respeitada.
      const i = Math.floor((base.t - base.eu.tNasc) / 12);
      expect(i >= c.idade[0] && i <= c.idade[1], c.id).toBe(true);
    }
    expect(abertas).toBeGreaterThan(8);
  });
});

describe('VIDA 30 · §5 a família do par e a sua', () => {
  it('conhecer a família: familiares com jeito próprio, impressões diferentes, memória com peso, o par sente', () => {
    const v = adulto(27, { semente: 71 });
    const { p } = comParceiro(v, { estagio: 'namoro', anos: 1 });
    expect(abrir(v, 'rel30_familia_par', { par: p.id })).toBe(true);
    expect(v.momento!.texto).toMatch(/almoço de domingo/);
    const r = executar(v, { tipo: 'decidir', opcaoId: 'sincero' }).vida;
    const par = r.pessoas[p.id];
    expect(par.familia30?.conheceu).toBe(r.t);
    expect(par.familia30!.ids.length).toBeGreaterThanOrEqual(1);
    for (const id of par.familia30!.ids) {
      expect(r.vinculos[id].historia.some(h => /primeiro almoço/.test(h.texto))).toBe(true);
      expect(typeof par.familia30!.impressao![id]).toBe('number');
    }
    expect(r.vinculos[p.id].historia.some(h => /conhecer a família/.test(h.texto))).toBe(true);
  });

  it('a desconfiança tem continuação: o par comenta, e ir ao aniversário pode virar a opinião', () => {
    let mudou = 0, tentou = 0;
    for (let s = 0; s < 6; s++) {
      const v = adulto(29, { semente: 72 + s });
      const { p } = comParceiro(v, { estagio: 'namoro', anos: 1 });
      abrir(v, 'rel30_familia_par', { par: p.id });
      let w = executar(v, { tipo: 'decidir', opcaoId: 'timido' }).vida;
      const par = w.pessoas[p.id];
      const pior = Object.entries(par.familia30!.impressao!).sort((a, b) => a[1] - b[1])[0];
      par.familia30!.impressao![pior[0]] = -14; // a desconfiança (o cenário que esta continuação lê)
      w.t += 8;
      if (!abrir(w, 'rel30_depois_familia', { par: p.id })) continue;
      tentou++;
      w = executar(w, { tipo: 'decidir', opcaoId: 'reaproximar' }).vida;
      if (w.pessoas[p.id].familia30!.impressao![pior[0]] > 0) mudou++;
    }
    expect(tentou).toBeGreaterThan(0);
    expect(mudou).toBeGreaterThan(0);
  });

  it('apresentar o par à sua família: cada um com a sua opinião; depois, a conversa', () => {
    const v = adulto(26, { semente: 81 });
    comParente(v, 'mae', 55, 'feminino', 70);
    const { p } = comParceiro(v, { estagio: 'namoro', anos: 1 });
    expect(abrir(v, 'rel30_apresentar', { par: p.id })).toBe(true);
    let w = executar(v, { tipo: 'decidir', opcaoId: 'preparar' }).vida;
    expect(Object.keys(w.pessoas[p.id].familia30!.aprovacao!).length).toBeGreaterThan(0);
    w.t += 4;
    expect(abrir(w, 'rel30_opiniao', { par: p.id })).toBe(true);
    w = executar(w, { tipo: 'decidir', opcaoId: 'defender' }).vida;
    expect(w.pessoas[p.id].familia30!.opiniao).toBe(w.t);
    expect(w.vinculos[p.id].historia.some(h => /Defendeu/.test(h.texto))).toBe(true);
  });

  it('a velhice lembra um acontecimento real da infância (lido da biografia)', () => {
    const v = adulto(72, { semente: 91 });
    const { p: filho } = comFilho(v, 44);
    const { p: neto } = comNeto(v, filho, 12);
    escrever(v, { texto: 'Ganhou a corrida de carrinho de rolimã da rua', relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
    v.biografia[v.biografia.length - 1].t = v.eu.tNasc + 9 * 12;
    expect(abrir(v, 'vel30_album', { quem: neto.id })).toBe(true);
    // A lembrança é uma entrada real da infância (antes dos 12), com o ano em que aconteceu.
    const infancia = v.biografia.filter(e => e.t <= v.eu.tNasc + 144 && (e.relevancia === 'marco' || e.relevancia === 'biografia') && e.tom !== 'ruim');
    expect(infancia.some(e => v.momento!.texto.toLowerCase().includes(e.texto.replace(/\.$/, '').slice(1, 30).toLowerCase()))).toBe(true);
  });
});
