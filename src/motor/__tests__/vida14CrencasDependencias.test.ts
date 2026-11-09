/** VIDA 14 · crenças (mudar, praticar, datas) e dependências (a partir dos hábitos, progressão, tratamento, recuperação, recaída). */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { crencaDe, datasDaCrenca14, praticaDe } from '../v14/crencas/crencas';
import { processarDependencias14 } from '../v14/crencas/dependencias14';
import { CATALOGO } from '../conteudo/catalogo';
import { interpretar } from '../save';

describe('VIDA 14 · crenças', () => {
  it('nasce na crença da família; mudar e praticar são escolhas; sem religião não há prática', () => {
    let v = structuredClone(adulto(25));
    const e = crencaDe(v);
    if (!e.historia.length) expect(e.familia).toBe(e.atual); // (a vida até os 25 pode ter mudado de ideia por uma decisão)
    const n0 = e.historia.length;
    v = executar(v, { tipo: 'crenca14', op: { oque: 'mudar', para: 'budismo' } }).vida;
    expect(crencaDe(v).atual).toBe('budismo');
    expect(datasDaCrenca14(v).length).toBeGreaterThan(0);
    expect(disponibilidade(v, { tipo: 'crenca14', op: { oque: 'mudar', para: 'ateismo' } }).grau).toBe('incompativel'); // uma mudança por ano
    v.anoAtual = { acoes: [] };
    v = executar(v, { tipo: 'crenca14', op: { oque: 'mudar', para: 'ateismo' } }).vida;
    expect(praticaDe(v)).toBe('nenhuma');
    expect(disponibilidade(v, { tipo: 'crenca14', op: { oque: 'pratica', nivel: 'regular' } }).grau).toBe('impossivel');
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === "ok" && l.vida.crenca14?.historia.length).toBe(n0 + 2);
    for (const c of CATALOGO.filter(x => x.id.startsWith('c14_'))) expect(c.manual, c.id).toBe(true);
  });
});

describe('VIDA 14 · dependências', () => {
  it('o cigarro de sempre vira dependência registrada; parar devolve aos hábitos', () => {
    let v = structuredClone(adulto(30));
    v.corpo.habitos.fuma = true;
    processarDependencias14(v);
    expect(v.dependencias14?.lista.tabaco).toBeDefined();
    v.dependencias14!.lista.tabaco!.nivel = 5;
    let parou = false;
    for (let k = 0; k < 8 && !parou; k++) { v.anoAtual = { acoes: [] }; v.t += 12; v = executar(v, { tipo: 'dep14', oque: { op: 'parar', tipo: 'tabaco' } }).vida; parou = v.dependencias14!.lista.tabaco?.limpoDesde !== undefined; }
    expect(parou).toBe(true);
    expect(v.corpo.habitos.fuma).toBe(false);
  });
  it('a bebida pesada progride, custa e pesa; o tratamento leva à recuperação', () => {
    let v = structuredClone(adulto(35));
    v.corpo.habitos.bebe = 'muito';
    v.financas.conta = 200000;
    v.mente.estresse = 80;
    processarDependencias14(v);
    const d = v.dependencias14!.lista.alcool!;
    expect(d.nivel).toBeGreaterThanOrEqual(50);
    expect(podeTentar(disponibilidade(v, { tipo: 'dep14', oque: { op: 'tratar', tipo: 'alcool', modo: 'ambulatorial' } }))).toBe(true);
    v = executar(v, { tipo: 'dep14', oque: { op: 'tratar', tipo: 'alcool', modo: 'ambulatorial' } }).vida;
    v.mente.estresse = 30;
    for (let k = 0; k < 4; k++) { v.t += 12; processarDependencias14(v); }
    const x = v.dependencias14!.lista.alcool;
    expect(x === undefined || x.limpoDesde !== undefined || x.nivel < d.nivel).toBe(true);
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo).toBe('ok');
  });
});
