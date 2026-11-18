/**
 * VIDA 27 · §7 — a vizinhança pelo lugar: o país, o entorno e o padrão decidem quais construções podem aparecer;
 * variedade sem repetir os dois lados; nada incompatível (prédio no sítio, puxadinho ao lado da mansão).
 */
import { describe, expect, it } from 'vitest';
import { modelosPossiveis27, regiaoDoPais27, vizinhosDoLugar27 } from '../v14/fachadas/vizinhanca27';
import type { TipoDeEntorno } from '../v14/fachadas/entorno22';
import type { Vista } from '../v14/fachadas/kit';

const V = { OX: 100, GY: 200, S: 10 } as unknown as Vista;
const LADOS: [number, number][] = [[-10, -0.4], [12.4, 22]];
function h(semente: string) { return (k: string) => { let x = 2166136261; const s = `${semente}|${k}`; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0) / 4294967295; }; }
const ids = (tipo: TipoDeEntorno, pais: string, padrao: number, n = 120) => {
  const out: string[][] = [];
  for (let k = 0; k < n; k++) out.push(vizinhosDoLugar27(V, LADOS, tipo, { pais, padrao }, h(`casa${k}`)).ids);
  return out;
};

describe('VIDA 27 · vizinhança', () => {
  it('a região do mundo vem do país', () => {
    expect(regiaoDoPais27('BR')).toBe('br');
    expect(regiaoDoPais27('US')).toBe('anglo');
    expect(regiaoDoPais27('PT')).toBe('europa');
    expect(regiaoDoPais27('JP')).toBe('asia');
    expect(regiaoDoPais27('AR')).toBe('latam');
  });

  it('o lugar decide o que pode aparecer', () => {
    expect(modelosPossiveis27('periferia', 'BR', 0)).toEqual(expect.arrayContaining(['laje_caixa', 'laje_puxadinho']));
    expect(modelosPossiveis27('bairro', 'US', 2)).toContain('suburbio_duas_aguas');
    expect(modelosPossiveis27('bairro', 'US', 2)).not.toContain('laje_caixa');
    expect(modelosPossiveis27('bairro', 'DE', 2)).toContain('geminadas');
    expect(modelosPossiveis27('nobre', 'BR', 5)).not.toContain('laje_puxadinho');
    expect(modelosPossiveis27('centro', 'BR', 2).every(id => id.startsWith('predio'))).toBe(true);
  });

  it('sítio e fazenda: o entorno é do campo (sede, galpão e silo, mata) — nunca prédio', () => {
    const todos = ids('rural', 'BR', 2).flat();
    expect(todos.every(id => ['sede', 'galpao_silo', 'mata'].includes(id))).toBe(true);
    expect(new Set(todos).size).toBe(3);
  });

  it('variedade: o bairro brasileiro tem vários modelos, e os dois lados não repetem quando há alternativa', () => {
    const pares = ids('bairro', 'BR', 2);
    expect(new Set(pares.flat()).size).toBeGreaterThanOrEqual(4);
    expect(pares.every(([a, b]) => a !== b)).toBe(true);
  });

  it('bairro de luxo: só casas condizentes; periferia: só o que a periferia tem', () => {
    for (const [a, b] of ids('nobre', 'BR', 5)) for (const id of [a, b]) expect(['casa_grande', 'casa_moderna', 'platibanda_moderna']).toContain(id);
    for (const [a, b] of ids('periferia', 'BR', 0)) for (const id of [a, b]) expect(['laje_caixa', 'laje_puxadinho', 'casa_4aguas', 'terraco_plano']).toContain(id);
  });

  it('o subúrbio americano e a rua europeia não saem iguais à periferia brasileira', () => {
    const us = new Set(ids('bairro', 'US', 2).flat()), pt = new Set(ids('bairro', 'PT', 2).flat()), br = new Set(ids('bairro', 'BR', 2).flat());
    expect([...us].some(id => br.has(id) && id.startsWith('laje'))).toBe(false);
    expect(pt.has('geminadas') || pt.has('casa_frontao') || pt.has('casa_pedra')).toBe(true);
    expect(us.has('suburbio_duas_aguas') || us.has('rancho')).toBe(true);
  });
});
