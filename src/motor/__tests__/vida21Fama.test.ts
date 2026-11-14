/**
 * VIDA 21 · o reconhecimento que não é fama: a médica de vinte anos na cidade pequena é conhecida pela cidade (sem virar
 * celebridade); a mesma carreira na metrópole chega ao bairro; o engenheiro de escritório, a ninguém; sair do ofício
 * apaga devagar. As formas de reconhecimento são distintas; o mundo de perto reage sozinho (rádio, escola, moção,
 * jornal, freguesia) — e nada disso cria notoriedade.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import type { Emprego, Vida } from '../tipos';
import { formasDeReconhecimento21, processarFama21, reconhecimentoLocal21 } from '../v21/fama/fama21';

const vida = (ocupacaoId: string, anos: number, cidade: string): Vida => transacao(adulto(50, { semente: 2151, municipioId: cidade }), x => {
  x.trabalho.historico = [];
  x.trabalho.atual = { ...(x.trabalho.atual ?? {}), ocupacaoId, tInicio: x.t - anos * 12, desempenho: 75, salario: 12000 } as Emprego;
  x.moradia.tInicio = x.t - anos * 12;
  x.notoriedade = undefined;
  for (const k of Object.keys(x.fatos)) if (k.startsWith('fama21_') || k.startsWith('of21_')) delete x.fatos[k];
}).vida;

describe('VIDA 21 · reconhecimento onde se vive', () => {
  it('a médica de 20 anos na cidade pequena é conhecida pela cidade; na metrópole, pela comunidade no máximo; o engenheiro, não', () => {
    const peq = reconhecimentoLocal21(vida('medico', 20, 'tarauaca-ac'));
    const met = reconhecimentoLocal21(vida('medico', 20, 'manaus-am'));
    const eng = reconhecimentoLocal21(vida('engenheiro_infra', 20, 'tarauaca-ac'));
    expect(['a cidade', 'a comunidade']).toContain(peq.alcance);
    expect(met.alcance).not.toBe('a cidade');
    expect(met.valor).toBeLessThanOrEqual(75);
    expect(eng.valor).toBeLessThan(peq.valor / 3);
    expect(peq.por).toMatch(/pacientes|plantões|procedimentos/);
  });
  it('dois anos de cidade conhecem menos que vinte; deixar o ofício apaga com os anos', () => {
    expect(reconhecimentoLocal21(vida('medico', 2, 'tarauaca-ac')).valor).toBeLessThan(reconhecimentoLocal21(vida('medico', 20, 'tarauaca-ac')).valor);
    const saiu = (anosFora: number) => transacao(vida('medico', 20, 'tarauaca-ac'), x => {
      const e = x.trabalho.atual!;
      x.trabalho.historico.push({ ...e, tFim: x.t - anosFora * 12, motivo: 'aposentou' } as never);
      x.trabalho.atual = undefined;
    }).vida;
    const v2 = reconhecimentoLocal21(saiu(2)).valor, v8 = reconhecimentoLocal21(saiu(8)).valor;
    expect(v2).toBeGreaterThan(v8);
    expect(reconhecimentoLocal21(saiu(11)).valor).toBe(0);
  });
  it('as formas são distintas: reconhecimento local alto não é fama', () => {
    const fs = formasDeReconhecimento21(vida('medico', 20, 'tarauaca-ac'));
    expect(fs.find(f => f.id === 'local')!.valor).toBeGreaterThanOrEqual(45);
    expect(fs.find(f => f.id === 'fama')!.valor).toBe(0);
    expect(fs.find(f => f.id === 'prestigio')!.valor).toBeGreaterThan(0);
  });
  it('o mundo de perto reage sozinho ao longo dos anos — e nunca cria notoriedade; a quem ninguém conhece, nada', () => {
    let v = vida('medico', 20, 'tarauaca-ac');
    let eng = vida('engenheiro_infra', 20, 'tarauaca-ac');
    const bio0 = v.biografia.length, bioE = eng.biografia.length;
    for (let a = 0; a < 15; a++) { v = transacao(v, x => { x.t += 12; x.trabalho.atual!.tInicio -= 0; processarFama21(x); }).vida; eng = transacao(eng, x => { x.t += 12; processarFama21(x); }).vida; }
    const novos = v.biografia.slice(bio0).map(b => b.texto);
    expect(novos.some(t => /rádio comunitária|escola do bairro|moção de aplauso|jornal da cidade/.test(t))).toBe(true);
    expect(v.notoriedade?.valor ?? 0).toBe(0);
    expect(eng.biografia.slice(bioE).some(b => /rádio comunitária|moção de aplauso/.test(b.texto))).toBe(false);
  });
});
