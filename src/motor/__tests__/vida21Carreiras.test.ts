/**
 * VIDA 21 · os números de cada ofício: o médico conta pacientes e plantões, o caminhoneiro conta quilômetros e fretes —
 * não o mesmo "desempenho"; o número sai do trabalho que aconteceu (meses, carga, cargo, desempenho), soma a carreira
 * inteira (o histórico também), e os números redondos viram lembrança uma vez (o save antigo não recebe uma enxurrada).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import type { Emprego, Vida } from '../tipos';
import { numerosDoOficio, numerosEmOutroLugar, processarOficio21 } from '../v21/carreiras/oficio21';

const comEmprego = (ocupacaoId: string, anos: number, desempenho = 70): Vida => transacao(adulto(45, { semente: 2141 }), x => {
  x.trabalho.historico = [];
  // O cenário já viveu anos com o motor: começa limpo (como um save que nunca contou os números do ofício).
  for (const k of Object.keys(x.fatos)) if (k.startsWith('of21_')) delete x.fatos[k];
  x.trabalho.atual = { ...(x.trabalho.atual ?? {}), ocupacaoId, tInicio: x.t - anos * 12, desempenho, salario: 10000 } as Emprego;
}).vida;

describe('VIDA 21 · os números do ofício', () => {
  it('cada trilha conta o que é dela', () => {
    const med = numerosDoOficio(comEmprego('medico', 10)).map(n => n.indicador.rotulo);
    const cam = numerosDoOficio(comEmprego('caminhoneiro', 10)).map(n => n.indicador.rotulo);
    expect(med).toContain('pacientes atendidos');
    expect(med).toContain('plantões');
    expect(cam).toContain('quilômetros rodados');
    expect(med.some(r => cam.includes(r))).toBe(false);
  });
  it('mais tempo e melhor desempenho, mais números; o último ano é a fatia do ano', () => {
    const p = (v: Vida) => numerosDoOficio(v).find(n => n.indicador.id === 'pacientes')!;
    const dez = p(comEmprego('medico', 10)), vinte = p(comEmprego('medico', 20));
    expect(vinte.valor).toBeGreaterThan(dez.valor * 1.8);
    expect(p(comEmprego('medico', 10, 95)).valor).toBeGreaterThan(p(comEmprego('medico', 10, 30)).valor);
    expect(dez.doAno).toBeGreaterThan(dez.valor / 15);
    expect(dez.doAno).toBeLessThan(dez.valor / 5);
  });
  it('quem tem números próprios (o atleta) é apontado para lá', () => {
    expect(numerosEmOutroLugar(comEmprego('jogador_futebol', 3))).toMatch(/gols/);
  });
  it('os marcos: a primeira passada registra em silêncio; o próximo número redondo vira lembrança uma vez', () => {
    let v = comEmprego('medico', 3);
    const bio0 = v.biografia.length;
    v = transacao(v, x => processarOficio21(x)).vida;
    expect(v.biografia.slice(bio0).map(b => b.texto)).toEqual([]);
    // Anos depois: passa de 100 plantões? (6/mês ≈ 72/ano) e dos 10.000 pacientes.
    v = transacao(v, x => { x.t += 36; processarOficio21(x); }).vida;
    const novos = v.biografia.slice(bio0).map(b => b.texto);
    expect(novos.some(t => /^Passou de [\d.]+ (pacientes atendidos|plantões|procedimentos)\.$/.test(t))).toBe(true);
    const n = v.biografia.length;
    v = transacao(v, x => processarOficio21(x)).vida;
    expect(v.biografia.length).toBe(n);
  });
});
