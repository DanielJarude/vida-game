/** VIDA 14 · viagens além do turismo: negócios (pede trabalho), cultura (pratica), Copa no ano dela, países conhecidos, preço por quem vai. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { copaDoAno, custoDaViagem14, destinos14, paisesVisitados } from '../v14/viagens/viagens14';
import { interpretar } from '../save';

describe('VIDA 14 · viagens', () => {
  it('cultural: paga, pratica, registra o país e o intervalo', () => {
    let v = structuredClone(adulto(30));
    v.financas.conta = 200000;
    const a = { tipo: 'viagem14' as const, destino: 'cul_dublin', dias: 14 };
    expect(podeTentar(disponibilidade(v, a))).toBe(true);
    const antes = v.financas.conta;
    v = executar(v, a).vida;
    expect(v.financas.conta).toBeLessThan(antes);
    expect(paisesVisitados(v)).toContain('IE');
    expect(v.biografia.some(e => e.fato?.tipo === 'm_viagem' && e.fato.dados.destino === 'Dublin (curso de inglês)')).toBe(true);
    expect(disponibilidade(v, { tipo: 'viagem14', destino: 'cul_kyoto', dias: 7 }).grau).toBe('incompativel');
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.viagens14?.paises.IE).toBeDefined();
  });
  it('negócios pede trabalho ou empresa; a Copa só existe no ano dela', () => {
    const v = structuredClone(adulto(30));
    v.financas.conta = 200000;
    v.trabalho.atual = undefined;
    expect(disponibilidade(v, { tipo: 'viagem14', destino: 'neg_nova_york', dias: 3 }).grau).toBe('requisito');
    expect(copaDoAno(2030)?.paises).toEqual(['ES', 'PT', 'MA']);
    expect(copaDoAno(2028)).toBeUndefined();
    v.t = 2030 * 12 + 1;
    expect(destinos14(v).some(d => d.id === 'evt_copa_2030')).toBe(true);
  });
  it('com mais gente, custa mais', () => {
    const v = structuredClone(adulto(35));
    const d = destinos14(v).find(x => x.id === 'mar_machu_picchu')!;
    expect(custoDaViagem14(v, d, 7, 'so')).toBeGreaterThan(0);
  });
});
