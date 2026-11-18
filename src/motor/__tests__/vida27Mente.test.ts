/**
 * VIDA 27 · §15 — a saúde mental como processo: o que pesa e o que protege, quem percebe, a crise com caminhos de ajuda,
 * a recuperação. E a auditoria do que NÃO pode existir: método, cena, morte como desfecho, crise automática por condição.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { adulto, comParceiro, comParente } from './cenarios';
import { criarRng } from '../rng';
import { executar } from '../acoes';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { fatoresDoSofrimento27, processarMente27, sofrimento27 } from '../v27/mente/mente27';
import type { Vida } from '../tipos';

function base(i = 30): Vida {
  const v = adulto(i, { semente: 27 });
  v.momento = null; delete v.fila;
  v.corpo.condicoes = []; v.luto = []; v.mente.estresseAlto = undefined; v.mente.felicidade = 55;
  v.rotinas = v.rotinas.filter(r => r.id !== 'terapia');
  for (const id of Object.keys(v.vinculos)) { v.vinculos[id].proximidade = 30; if (v.vinculos[id].romance) v.vinculos[id].romance = undefined; }
  return v;
}
const depressao = (v: Vida, tratando: boolean) => v.corpo.condicoes.push({ id: 'depressao', nome: 'depressão', tInicio: v.t - 12, cronica: true, gravidade: 2, tratando, diagnosticada: tratando });
const ano = (v: Vida) => { v.t += 12; processarMente27(v); };

describe('VIDA 27 · saúde mental', () => {
  it('uma condição sozinha não leva à crise: depressão tratada, com gente por perto, não abre crise', () => {
    const v = base();
    depressao(v, true);
    comParceiro(v, { estagio: 'casamento' });
    v.rotinas.push({ id: 'terapia', tInicio: v.t, nivel: 1 });
    for (let k = 0; k < 5; k++) ano(v);
    expect(sofrimento27(v)).toBeLessThan(40);
    expect(v.mente.crise27).toBeUndefined();
  });

  it('o contexto pesa: depressão sem tratamento, isolamento e luto abrem uma crise, e o texto diz o que pesa', () => {
    const v = base();
    depressao(v, false);
    v.mente.felicidade = 20;
    v.luto = [{ pessoaId: 'x', t: v.t, peso: 80 } as never];
    ano(v);
    const c = v.mente.crise27!;
    expect(c.nivel).toBeGreaterThanOrEqual(2);
    expect(c.nivel).toBeLessThan(3); // nunca grave no primeiro ano
    expect(v.biografia.some(b => /crise/.test(b.texto) && /depressão/.test(b.texto))).toBe(true);
    expect(fatoresDoSofrimento27(v).some(f => f.id === 'isolamento')).toBe(true);
  });

  it('a fase grave só depois de um ano de crise, e não com acompanhamento', () => {
    let graves = 0;
    for (let s = 0; s < 30; s++) {
      const v = base(); v.id = `teste${s}`;
      depressao(v, false); v.mente.felicidade = 10; v.luto = [{ pessoaId: 'x', t: v.t, peso: 100 } as never];
      ano(v);
      expect(v.mente.crise27!.nivel).toBeLessThan(3);
      v.rotinas.push({ id: 'terapia', tInicio: v.t, nivel: 1 });
      v.mente.crise27!.psiquiatra = v.t;
      v.mente.felicidade = 10;
      ano(v);
      if (v.mente.crise27!.nivel === 3) graves++;
    }
    expect(graves).toBe(0);
  });

  it('isolado e sem cuidado, a fase grave pode vir — mas não sempre (contexto, não destino)', () => {
    let graves = 0;
    for (let s = 0; s < 40; s++) {
      const v = base(); v.id = `iso${s}`;
      depressao(v, false); v.luto = [{ pessoaId: 'x', t: v.t, peso: 100 } as never];
      for (let k = 0; k < 3; k++) { v.mente.felicidade = 10; ano(v); }
      if (v.mente.crise27?.nivel === 3) graves++;
    }
    expect(graves).toBeGreaterThan(0);
    expect(graves).toBeLessThan(40);
  });

  it('quem está perto percebe; abrir-se é apoio que protege', () => {
    const v = base(17);
    const { p } = comParente(v, 'mae', 45, 'feminino', 80);
    v.vinculos[p.id].convivio = ['casa'];
    depressao(v, false); v.mente.felicidade = 15; v.luto = [{ pessoaId: 'x', t: v.t, peso: 100 } as never];
    ano(v);
    expect(v.fatos['mente27_percebe']).toBe(v.t);
    const d = conteudoPorId('mental27_percebe')!;
    abrirDecisao(v, d as never, contexto(v, criarRng(1), { pessoa: p }));
    expect(v.momento?.situacaoId).toBe('mental27_percebe');
    const w = executar(v, { tipo: 'decidir', opcaoId: 'abrir' }).vida;
    expect(w.mente.crise27!.apoio!.some(a => a.pid === p.id)).toBe(true);
    expect(fatoresDoSofrimento27(w).some(f => f.id === 'apoio' && f.peso < 0)).toBe(true);
  });

  it('procurar atendimento começa o acompanhamento (psicólogo e psiquiatra) e a crise passa com o tempo', () => {
    const v = base();
    depressao(v, false); v.mente.felicidade = 15; v.luto = [{ pessoaId: 'x', t: v.t, peso: 90 } as never];
    ano(v);
    expect(v.fatos['mente27_crise']).toBe(v.t);
    abrirDecisao(v, conteudoPorId('mental27_crise') as never, contexto(v, criarRng(2), {}));
    let w = executar(v, { tipo: 'decidir', opcaoId: 'atendimento' }).vida;
    expect(w.rotinas.some(r => r.id === 'terapia')).toBe(true);
    expect(w.mente.crise27!.psiquiatra).toBe(w.t);
    expect(w.corpo.condicoes.find(c => c.id === 'depressao')!.tratando).toBe(true);
    // O tempo, o cuidado e o luto que diminui.
    w = structuredClone(w); w.luto = []; w.mente.felicidade = 50; w.momento = null;
    for (let k = 0; k < 3; k++) ano(w);
    expect(w.mente.crise27!.fim).toBeDefined();
    expect(w.biografia.some(b => /foi passando/.test(b.texto))).toBe(true);
  });

  it('a crise nunca mata nem é desfecho: anos de crise sem ajuda não produzem morte por este sistema', () => {
    const v = base();
    depressao(v, false); v.luto = [{ pessoaId: 'x', t: v.t, peso: 100 } as never];
    for (let k = 0; k < 20; k++) { v.mente.felicidade = 5; ano(v); expect(v.morte).toBeUndefined(); }
  });

  it('auditoria de texto: nenhum método, meio ou cena; nenhuma opção de desistir da vida; sempre um caminho de ajuda', () => {
    const fontes = ['src/motor/v27/mente/mente27.ts', 'src/motor/conteudo/acontecimentos27.ts'].map(f => readFileSync(f, 'utf8')).join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); // só o que o jogador lê (sem os comentários de projeto)
    for (const proibido of [/enforc/i, /envenen/i, /overdose/i, /\bcorda\b/i, /\bpulsos?\b/i, /\bpular d[eo]/i, /\barma de fogo\b/i, /como se matar/i, /tirar a própria vida/i, /\bmétodo\b/i])
      expect(proibido.test(fontes), String(proibido)).toBe(false);
    const d = conteudoPorId('mental27_crise')!;
    expect(d.tipo).toBe('decisao');
    const ids = (d as { opcoes: { id: string }[] }).opcoes.map(o => o.id);
    expect(ids).toEqual(['linha', 'alguem', 'atendimento', 'sozinho']);
    expect(fontes).toMatch(/CVV, 188/);
  });
});
