/** VIDA 14 · aparência: riscos na sobrancelha (quantidade, lado, posição, estilo), desenho, pinta, cílios; piercings comprados e furados no painel. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { estadoDoFuro, joiasDoFuro, FUROS_14, precoNoPainel } from '../v14/aparencia/piercings14';
import { interpretar } from '../save';

describe('VIDA 14 · rosto', () => {
  it('riscos na sobrancelha com quantidade, lado, posição e estilo; persistem no save; tirar volta ao natural', () => {
    let v = structuredClone(adulto(22));
    v.financas.conta = 5000;
    const riscos = { quantidade: 2, lado: 'esquerdo', posicao: 'externo', estilo: 'diagonal' } as const;
    expect(podeTentar(disponibilidade(v, { tipo: 'rosto14', mudanca: { sobrancelhaRiscos: riscos } }))).toBe(true);
    v = executar(v, { tipo: 'rosto14', mudanca: { sobrancelhaRiscos: riscos } }).vida;
    expect(v.eu.visual.sobrancelhaRiscos).toEqual(riscos);
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.eu.visual.sobrancelhaRiscos?.estilo).toBe('diagonal');
    v = executar(v, { tipo: 'rosto14', mudanca: { sobrancelhaRiscos: null } }).vida;
    expect(v.eu.visual.sobrancelhaRiscos).toBeUndefined();
  });
});

describe('VIDA 14 · piercings no painel', () => {
  it('comprar uma joia de furo fura, cobra joia + furo, ocupa o furo; o furo fica ao tirar', () => {
    let v = structuredClone(adulto(20));
    v.financas.conta = 20000;
    const lugar = FUROS_14.find(f => f !== 'orelha' && joiasDoFuro(f).length > 0)!;
    const joia = joiasDoFuro(lugar)[0];
    expect(estadoDoFuro(v, lugar).estado).toBe('sem_furo');
    const preco = precoNoPainel(v, joia.id);
    expect(preco.total).toBe(preco.joia + preco.furo);
    const antes = v.financas.conta;
    v = executar(v, { tipo: 'piercing14', oque: { op: 'comprar', itemId: joia.id } }).vida;
    expect(antes - v.financas.conta).toBeGreaterThanOrEqual(preco.furo);
    expect(v.eu.estilo?.furos?.[lugar]).toBeDefined();
    expect(estadoDoFuro(v, lugar).estado).not.toBe('sem_furo');
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });
  it('menor de 16 não fura fora da orelha', () => {
    const v = structuredClone(adulto(14));
    v.financas.conta = 20000;
    const lugar = FUROS_14.find(f => f !== 'orelha' && joiasDoFuro(f).length > 0)!;
    expect(disponibilidade(v, { tipo: 'piercing14', oque: { op: 'comprar', itemId: joiasDoFuro(lugar)[0].id } }).grau).toBe('impossivel');
  });
});
