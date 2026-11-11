/** VIDA 16.1 · engenharia, enfermagem, contabilidade, jornalismo e psicologia por dentro: cada uma com o seu estado e as suas consequências. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { decisoesDe16, pastaDe16, ramoDe16 } from '../v16/oficios/oficios16';
import type { Vida } from '../tipos';

function comEmprego(s: number, ocupacaoId: string, contrato: 'clt' | 'autonomo' = 'clt'): Vida {
  const v = structuredClone(adulto(34, { semente: s }));
  v.trabalho.atual = { ocupacaoId, empregador: 'um lugar', contrato, salario: 5000, tInicio: v.t - 48, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral' };
  v.financas.conta = 50000;
  return v;
}
const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; return x; };
const tentar = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const plano = (v: Vida, escolha: string) => tentar(v, { tipo: 'oficio16', oque: { op: 'plano', escolha } });
const decidirTudo = (v: Vida, k = 0, tipo?: string) => { for (const it of pastaDe16(v)!.itens) { if (tipo && it.tipo !== tipo) continue; const d = decisoesDe16(it); if (d.length) v = tentar(v, { tipo: 'oficio16', oque: { op: 'decidir', id: it.id, escolha: d[Math.min(k, d.length - 1)].escolha } }); } return v; };

describe('VIDA 16.1 · cinco ofícios por dentro', () => {
  it('cada profissão tem a sua pasta, com itens próprios (não o desafio genérico)', () => {
    const tipos: Record<string, string[]> = {};
    for (const [oc, ramo] of [['eng_pleno', 'engenharia'], ['eng_industrial', 'engenharia'], ['enfermeiro', 'enfermagem'], ['tec_enfermagem', 'enfermagem'], ['contador', 'contabilidade'], ['jornalista', 'jornalismo'], ['psicologo_clinico', 'psicologia']] as const) {
      const v = comEmprego(2, oc, oc === 'psicologo_clinico' ? 'autonomo' : 'clt');
      expect(ramoDe16(v)).toBe(ramo);
      const p = pastaDe16(v)!;
      expect(p.itens.length).toBeGreaterThan(0);
      tipos[ramo] = [...new Set([...(tipos[ramo] ?? []), ...p.itens.map(i => i.tipo)])];
      expect(v.oficio16).toBeUndefined();
    }
    expect(tipos.engenharia).toContain('obra');
    expect(tipos.enfermagem).toContain('plantao');
    expect(tipos.contabilidade).toContain('fechamento');
    expect(tipos.jornalismo).toContain('pauta');
    expect(tipos.psicologia).toContain('paciente');
    expect(ramoDe16(comEmprego(2, 'estagio_eng'))).toBeUndefined();
  });

  it('engenharia: o padrão "enxugar" deixa risco latente nas obras entregues; "reforçar", pouco', () => {
    let riscoEco = 0, riscoRef = 0;
    for (let s = 1; s <= 6; s++) {
      for (const pl of ['economia', 'reforco']) {
        let v = plano(comEmprego(s, 'eng_pleno'), pl);
        v = ano(v);
        const o = v.oficio16?.obras?.slice(-1)[0];
        if (!o) continue;
        if (pl === 'economia') riscoEco += o.risco; else riscoRef += o.risco;
        expect(v.oficio16!.feitos.length).toBeGreaterThan(0);
      }
    }
    expect(riscoEco).toBeGreaterThan(riscoRef + 100);
  });

  it('enfermagem: as dobras pagam e acumulam sobrecarga de um ano para o outro; o diurno alivia', () => {
    let v = plano(comEmprego(3, 'enfermeiro'), 'dobras');
    const conta = v.financas.conta;
    v = ano(v);
    if (ramoDe16(v) !== 'enfermagem') return;
    const s1 = v.oficio16!.sobrecarga!;
    expect(v.oficio16!.plantoes).toBeGreaterThanOrEqual(160);
    expect(v.financas.conta).not.toBe(conta);
    v = plano(v, 'diurno');
    v = ano(v);
    if (ramoDe16(v) !== 'enfermagem') return;
    expect(v.oficio16!.sobrecarga!).toBeLessThan(s1);
  });

  it('contabilidade: a carteira cheia traz mais clientes e mais risco de perder prazo', () => {
    let perdasCheia = 0, perdasEnxuta = 0;
    for (let s = 1; s <= 12; s++) {
      for (const pl of ['cheia', 'enxuta']) {
        let v = plano(comEmprego(s, 'contador_socio', 'autonomo'), pl);
        v = ano(v);
        const c = v.oficio16?.carteira;
        if (!c) continue;
        if (pl === 'cheia') perdasCheia += c.multas; else perdasEnxuta += c.multas;
      }
    }
    expect(perdasCheia).toBeGreaterThan(perdasEnxuta);
  });

  it('jornalismo: apurar a fundo protege a credibilidade; a pauta publicada se decide na virada', () => {
    let credApurar = 0, credRapido = 0;
    for (let s = 1; s <= 10; s++) {
      for (const k of [0, 1]) {
        let v = plano(comEmprego(s, 'jornalista'), 'equilibrio');
        v = decidirTudo(v, k, 'pauta'); // 0 = publicar logo; 1 = apurar
        v = ano(v);
        if (!v.oficio16?.credibilidade) continue;
        expect(v.oficio16.itens.filter(i => i.tipo === 'pauta').every(i => i.estado === 'resolvido')).toBe(true);
        if (k) credApurar += v.oficio16.credibilidade; else credRapido += v.oficio16.credibilidade;
      }
    }
    expect(credApurar).toBeGreaterThan(credRapido);
  });

  it('psicologia: os pacientes ficam de um ano para o outro e evoluem; a alta entra na carreira; o save guarda', () => {
    let v = plano(comEmprego(5, 'psicologo_clinico', 'autonomo'), 'supervisao');
    const ids = pastaDe16(v)!.itens.filter(i => i.tipo === 'paciente').map(i => i.ref);
    v = decidirTudo(v, 0);
    for (let k = 0; k < 4; k++) {
      v = ano(v);
      if (ramoDe16(v) !== 'psicologia') return;
      const p = pastaDe16(v)!;
      const segue = p.itens.filter(i => i.tipo === 'paciente').map(i => i.ref);
      if (k === 0) expect(segue.some(id => ids.includes(id))).toBe(true);
      for (const it of p.itens) { const d = decisoesDe16(it); const alta = d.find(x => x.escolha === 'alta'); if (alta || d.length) v = tentar(v, { tipo: 'oficio16', oque: { op: 'decidir', id: it.id, escolha: (alta ?? d[0]).escolha } }); }
      v = plano(v, 'supervisao');
    }
    expect((v.oficio16!.altas ?? 0) + (v.oficio16!.pacientes ?? []).filter(x => x.evolucao >= 50).length).toBeGreaterThan(0);
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.oficio16?.pacientes?.length).toBe(v.oficio16!.pacientes!.length);
  });
});
