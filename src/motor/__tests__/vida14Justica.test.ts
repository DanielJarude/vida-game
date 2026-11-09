/** VIDA 14 · Justiça cível: a causa nasce da vida, o advogado muda a chance, o acordo encerra, a derrota cobra, a improbidade torna inelegível. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { casos14, processarJustica14, type Caso14 } from '../v14/justica/justica14';
import { interpretar } from '../save';

const J = (oque: unknown) => ({ tipo: 'justica14', oque } as never);
function comCaso(c: Partial<Caso14>) {
  const v = structuredClone(adulto(35));
  v.financas.conta = 100000;
  v.justica14 = { casos: [{ id: 'j14-1', tipo: 'indenizacao', polo: 'reu', contra: 'o outro motorista', valor: 20000, t: v.t, tDecisao: v.t + 20, razao: 0.5, ...c } as Caso14], n: 1 };
  return v;
}

describe('VIDA 14 · justiça', () => {
  it('a demissão gera uma causa trabalhista pendente (às vezes); processar com advogado abre o prazo', () => {
    let achou = false;
    for (let s = 0; s < 30 && !achou; s++) {
      const v = structuredClone(adulto(30));
      v.id = `j14-${s}`;
      v.caminhos.marcas.push({ t: v.t - 2, tipo: 'demissao', texto: 'x', peso: 2 });
      processarJustica14(v);
      const c = casos14(v).find(x => x.tipo === 'trabalhista');
      if (!c) continue;
      achou = true;
      expect(c.pendente).toBe(true);
      expect(disponibilidade(v, J({ op: 'processar', id: c.id, advogado: 'nenhum' })).grau).toBe('requisito');
      v.financas.conta = 100000;
      const w = executar(v, J({ op: 'processar', id: c.id, advogado: 'particular' })).vida;
      expect(casos14(w)[0].tDecisao).toBeGreaterThan(w.t);
      expect(w.financas.conta).toBeLessThan(100000);
    }
    expect(achou).toBe(true);
  });
  it('perder como réu cobra o valor e as custas; o recurso reabre', () => {
    let v = comCaso({ razao: 0, advogado: 'particular', tDecisao: 0 });
    v.t += 1; processarJustica14(v);
    expect(casos14(v)[0].perdeu).toBeDefined();
    expect(podeTentar(disponibilidade(v, J({ op: 'recorrer', id: 'j14-1' })))).toBe(true);
    const antes = v.financas.conta;
    v = executar(v, J({ op: 'desistir', id: 'j14-1' })).vida;
    expect(casos14(v).length).toBe(0);
    expect(v.financas.conta).toBeLessThan(antes - 15000);
    expect(v.justica14!.fechados!.length).toBe(1);
  });
  it('a improbidade perdida torna inelegível', () => {
    const v = comCaso({ tipo: 'improbidade', contra: 'o Ministério Público', razao: 0, advogado: 'particular', tDecisao: 0 });
    v.caminhos.politica = { fase: 'entre_mandatos', apoio: 30, reputacao: 30, desgaste: 0, consecutivos: 0, historico: [], tInicio: v.t } as never;
    v.t += 1; processarJustica14(v);
    const w = executar(v, J({ op: 'desistir', id: 'j14-1' })).vida;
    expect(w.caminhos.politica!.inelegivelAte).toBeGreaterThan(w.t + 90);
  });
  it('acordo aceito encerra; save volta inteiro', () => {
    let v = comCaso({ acordoOferecido: 8000, advogado: 'particular' });
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.justica14?.casos.length).toBe(1);
    v = executar(v, J({ op: 'aceitar', id: 'j14-1' })).vida;
    expect(casos14(v).length).toBe(0);
  });
});
