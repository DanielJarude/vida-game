/** VIDA 14 · objetivos pessoais (criar, alterar, abandonar, concluir pelo estado real), programas (gastronomia e eventos) e o reconhecimento do meio. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { objetivos14, progresso14 } from '../v14/conquistas/objetivos';
import { programasNaTela14 } from '../v14/conquistas/programas';
import { CATALOGO } from '../conteudo/catalogo';
import { interpretar } from '../save';
import { prestigioProfissional } from '../sistemas/fama';

const C = (oque: unknown) => ({ tipo: 'conquistas14', oque } as never);

describe('VIDA 14 · objetivos', () => {
  it('criar, mudar a meta, abandonar; o mesmo tipo não duplica', () => {
    let v = structuredClone(adulto(25));
    expect(podeTentar(disponibilidade(v, C({ op: 'criar', tipo: 'paises', alvo: 5 })))).toBe(true);
    v = executar(v, C({ op: 'criar', tipo: 'paises', alvo: 5 })).vida;
    expect(disponibilidade(v, C({ op: 'criar', tipo: 'paises', alvo: 10 })).grau).toBe('incompativel');
    const o = objetivos14(v)[0];
    v = executar(v, C({ op: 'alterar', id: o.id, alvo: 10 })).vida;
    expect(objetivos14(v)[0].alvo).toBe(10);
    v = executar(v, C({ op: 'abandonar', id: o.id })).vida;
    expect(objetivos14(v)[0].estado).toBe('abandonado');
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.conquistas14?.objetivos?.length).toBe(1);
  });
  it('conclui sozinho quando a vida chega lá (casa própria)', () => {
    let v = structuredClone(adulto(30));
    v = executar(v, C({ op: 'criar', tipo: 'milionario', alvo: 1 })).vida;
    const o = objetivos14(v)[0];
    expect(progresso14(v, o).fracao).toBeLessThan(1);
    v.financas.conta += 50_000_000;
    v = avancarAno(v).vida;
    const x = objetivos14(v).find(y => y.tipo === 'milionario')!;
    expect(x.estado).toBe('concluido');
    expect(v.biografia.some(e => /patrimônio passou de/.test(e.texto))).toBe(true);
  });
});

describe('VIDA 14 · programas e reconhecimento', () => {
  it('um restaurante especial: paga e fica na memória; o exclusivo de convite pede convite', () => {
    let v = structuredClone(adulto(30));
    v.financas.conta = 50000;
    const antes = v.financas.conta;
    const progs = programasNaTela14(v);
    expect(progs.some(p => p.grupo === 'mesa')).toBe(true);
    expect(progs.some(p => p.grupo === 'cultura')).toBe(true);
    v = executar(v, C({ op: 'programa', id: 'restaurante', nivel: 'medio' })).vida;
    expect(v.financas.conta).toBeLessThan(antes);
    expect(v.conquistas14?.programas?.restaurante?.vezes).toBe(1);
    expect(disponibilidade(v, C({ op: 'programa', id: 'degustacao', nivel: 'exclusivo' })).grau).toBe('requisito');
  });
  it('os convites do meio estão no catálogo como manuais (fora do sorteio principal); o prestígio soma', () => {
    const c14 = CATALOGO.filter(c => c.id.startsWith('c14p_'));
    expect(c14.length).toBeGreaterThan(3);
    for (const c of c14) expect(c.manual, c.id).toBe(true);
    const v = structuredClone(adulto(40));
    const p0 = prestigioProfissional(v).valor;
    v.conquistas14 = { prestigio: 10 };
    expect(prestigioProfissional(v).valor).toBeGreaterThan(p0);
  });
});
