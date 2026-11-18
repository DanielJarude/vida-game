/**
 * VIDA 27 · §6 — o passaporte registra cada viagem concluída, de qualquer caminho.
 *
 * O defeito: duas viagens para fora e o passaporte dizia "1 viagem": as Experiências (viagem pelo país, para fora, lua
 * de mel) não registravam; os países guardavam só a primeira vez.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { avancarAno } from '../ano';
import { interpretar } from '../save';
import { criarRng } from '../rng';
import { escolhasDaExperiencia, viverExperiencia } from '../sistemas/experiencias';
import { executarViagem14 } from '../v14/viagens/viagens14';
import { leituraDoPassaporte } from '../sistemas/passaporte';
import type { Vida } from '../tipos';

function viajante(): Vida {
  const v = adulto(30, { semente: 27 });
  v.financas.conta = 5_000_000; v.momento = null; delete v.fila;
  return v;
}
/** Uma viagem para fora pelas Experiências, para a cidade cujo id contém `onde`. */
function paraFora(v: Vida, onde: string, k = 0) {
  const esc = escolhasDaExperiencia(v, 'viagem_exterior').find(e => e.id.startsWith(onde))!;
  expect(esc, onde).toBeTruthy();
  viverExperiencia(v, criarRng(k), 'viagem_exterior', esc.id);
  v.t += 1;
}

describe('VIDA 27 · passaporte', () => {
  it('duas viagens para fora pelas Experiências: duas viagens, dois países', () => {
    const v = viajante();
    const ids = escolhasDaExperiencia(v, 'viagem_exterior').map(e => e.id.split(':')[0]);
    const [a, b] = [...new Set(ids)];
    paraFora(v, a, 1); paraFora(v, b, 2);
    const l = leituraDoPassaporte(v);
    expect(l.viagens).toBe(2);
    expect(l.internacionais).toBe(2);
    expect(l.paises.length).toBeGreaterThanOrEqual(1);
    expect(v.viagens14!.registro!.map(x => x.via)).toEqual(['experiencia', 'experiencia']);
  });

  it('o mesmo país três vezes (Viagens e Experiências): três viagens, um país com ×3', () => {
    const v = viajante();
    executarViagem14(v, criarRng(1), { destino: 'cul_buenos_tango', dias: 7 }); v.t += 13;
    executarViagem14(v, criarRng(2), { destino: 'neg_buenos_aires', dias: 3 }); v.t += 13;
    const ar = escolhasDaExperiencia(v, 'viagem_exterior').find(e => /buenos/i.test(e.id));
    if (ar) { viverExperiencia(v, criarRng(3), 'viagem_exterior', ar.id); }
    const l = leituraDoPassaporte(v);
    const n = ar ? 3 : 2;
    expect(l.viagens).toBe(n);
    const arg = l.paises.find(p => p.iso === 'AR')!;
    expect(arg.vezes).toBe(n);
    expect(l.paises.filter(p => p.iso === 'AR').length).toBe(1);
  });

  it('viagem pelo país conta como viagem, nacional, sem carimbo', () => {
    const v = viajante();
    const esc = escolhasDaExperiencia(v, 'viagem_pais')[0];
    viverExperiencia(v, criarRng(4), 'viagem_pais', esc.id);
    const l = leituraDoPassaporte(v);
    expect(l.viagens).toBe(1);
    expect(l.nacionais).toBe(1);
    expect(l.paises.length).toBe(0);
  });

  it('o registro sobrevive ao ano que passa e a salvar e carregar', () => {
    let v = viajante();
    const ids = [...new Set(escolhasDaExperiencia(v, 'viagem_exterior').map(e => e.id.split(':')[0]))];
    paraFora(v, ids[0], 1); paraFora(v, ids[1], 2);
    v = avancarAno(v).vida;
    expect(leituraDoPassaporte(v).viagens).toBe(2);
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(leituraDoPassaporte(r.vida).viagens).toBe(2);
  });

  it('save antigo: as viagens da biografia viram o registro (uma vez)', () => {
    const v = viajante();
    const ids = [...new Set(escolhasDaExperiencia(v, 'viagem_exterior').map(e => e.id.split(':')[0]))];
    paraFora(v, ids[0], 1); paraFora(v, ids[1], 2); paraFora(v, ids[0], 3);
    // Como era antes da atualização: sem registro e com o contador antigo (que não contava as Experiências).
    delete v.viagens14!.registro; v.viagens14!.n = 0;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const l = leituraDoPassaporte(r.vida);
    expect(l.viagens).toBe(3);
    expect(r.vida.viagens14!.registro!.length).toBe(3);
    const de2 = interpretar(JSON.stringify(r.vida));
    if (de2.tipo === 'ok') expect(de2.vida.viagens14!.registro!.length).toBe(3);
  });
});
