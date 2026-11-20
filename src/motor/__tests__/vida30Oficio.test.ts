/**
 * VIDA 30 · o ofício depois de competir: a mídia tem o jeito no ar e a audiência; a escolinha tem alunos com nome e a
 * revelação que, indicada, assina com um clube anos depois; a comissão tem o técnico com nome e, quando ele cai, o
 * convite para assumir — que vira o comando no MESMO clube.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { carregarMundo } from '../mundo/carregar';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { anoDoOficio30, oficio30 } from '../v30/oficio/oficio30';
import { abrirCena30 } from '../ano';
import { executar } from '../acoes';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

function no(ocId: string, s = 1): Vida {
  const v = adulto(38, { semente: 200 + s, municipioId: 'sao-paulo-sp' });
  contratar(v, criarRng(s), ocupacao(ocId));
  v.momento = null; delete v.fila;
  return v;
}
function anos(v: Vida, n: number, sem = false): string[] {
  const out: string[] = [];
  for (let k = 0; k < n; k++) { v.t += 12; const id = anoDoOficio30(v, sem); if (id) out.push(id); }
  return out;
}

describe('VIDA 30 · o ofício depois de competir', () => {
  it('mídia: a emissora, o programa, a primeira escolha é o jeito no ar; os anos ficam registrados', () => {
    const v = no('comentarista_esportivo');
    const o = oficio30(v)!;
    expect(o.familia).toBe('midia');
    expect(o.casa).toBeTruthy();
    const ids = anos(v, 1, true);
    expect(ids[0]).toBe('pos30_estilo');
    abrirCena30(v, ids[0]);
    const r = executar(v, { tipo: 'decidir', opcaoId: 'polemico' }).vida;
    expect(r.oficio30!.estilo).toBe('polemico');
    anos(r, 4);
    expect(r.oficio30!.anos.length).toBeGreaterThanOrEqual(4);
    // Os anos comuns não repetem a mesma frase em sequência.
    const textos = r.oficio30!.anos.map(a => a.texto);
    for (let k = 1; k < textos.length; k++) expect(textos[k]).not.toBe(textos[k - 1]);
  });

  it('formação: alunos com nome; a revelação indicada assina com um clube anos depois (e a notícia volta)', () => {
    const v = no('treinador_escolinha', 2);
    let assinou = false;
    for (let k = 0; k < 14 && !assinou; k++) {
      v.t += 12;
      const id = anoDoOficio30(v, true);
      if (id === 'pos30_revelacao') { abrirCena30(v, id); const r = executar(v, { tipo: 'decidir', opcaoId: 'indicar' }); Object.assign(v, r.vida); v.momento = null; }
      assinou = (v.oficio30!.alunos ?? []).some(a => !!a.destino);
    }
    expect((v.oficio30!.alunos ?? []).length).toBeGreaterThan(3);
    expect(assinou).toBe(true);
    expect(v.biografia.some(e => /assinou o primeiro contrato/.test(e.texto))).toBe(true);
  });

  it('comissão: o técnico tem nome; quando cai, assumir leva ao comando no mesmo clube', () => {
    let feito = false;
    for (let s = 3; s < 30 && !feito; s++) {
      const v = no('auxiliar_tecnico', s);
      const clube = v.trabalho.atual!.clube;
      const o = oficio30(v)!;
      o.a = 80;
      for (let k = 0; k < 6 && !feito; k++) {
        v.t += 12;
        const id = anoDoOficio30(v, true);
        expect(v.pessoas[v.oficio30!.chefeId!]).toBeTruthy();
        if (id !== 'pos30_interino') continue;
        abrirCena30(v, id);
        const r = executar(v, { tipo: 'decidir', opcaoId: 'assumir' }).vida;
        if (r.trabalho.atual?.ocupacaoId === 'tecnico_futebol') { expect(r.trabalho.atual.clube).toBe(clube); feito = true; }
      }
    }
    expect(feito).toBe(true);
  });
});
