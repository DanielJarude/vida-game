/** VIDA 14 · eventos mundiais: o passado fica, o efeito chega aos sistemas (trabalho, empresas, fronteiras), determinístico por mundo. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { avancarAno } from '../ano';
import { disponibilidade } from '../acoes';
import { combinarEfeitos, processarMundo14, resumoDoMundo14 } from '../v14/mundo/mundo14';
import { interpretar } from '../save';

describe('VIDA 14 · mundo', () => {
  it('anda com a vida: eventos guardados, efeitos combinados, nada sorteado de novo', () => {
    let v = structuredClone(adulto(20));
    for (let k = 0; k < 12; k++) v = avancarAno(v).vida;
    const m = v.mundo14!;
    expect(m.eventos.length).toBeGreaterThan(0);
    const ids = m.eventos.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const antes = JSON.stringify(m.eventos);
    processarMundo14(v);
    expect(JSON.stringify(v.mundo14!.eventos)).toBe(antes); // o mesmo ano não é sorteado duas vezes
    expect(resumoDoMundo14(v).decadas.length).toBeGreaterThan(0);
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.mundo14?.eventos.length).toBe(m.eventos.length);
  });
  it('a pandemia fecha as fronteiras para a viagem de fora', () => {
    const v = structuredClone(adulto(30));
    v.financas.conta = 500000;
    v.mundo14 = { eventos: [], exteriorAte: v.t + 6 };
    expect(disponibilidade(v, { tipo: 'experiencia', id: 'viagem_exterior' }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'viagem14', destino: 'mar_gize', dias: 7 }).grau).toBe('impossivel');
  });
  it('os efeitos por ramo e setor somam/multiplicam', () => {
    const ef = combinarEfeitos([{ id: '1', ano: 2040, tipo: 'pandemia', escopo: 'mundo', titulo: 'x', texto: 'x', mods: { ramos: { hotel: 0.5 }, setores: { saude: 1.2 } }, ate: 2041 }], 2040);
    expect(ef?.ramos?.hotel).toBe(0.5);
    expect(ef?.setores?.saude).toBe(1.2);
  });
});
