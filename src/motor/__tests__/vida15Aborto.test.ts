/** VIDA 15 · interromper a gravidez segue a lei do lugar (país; nos EUA, o estado) — nunca presumida igual em todo lugar. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import { cidadesDoPais } from '../dados/lugares';
import { opcoesDoAborto15, legalAqui15, leiDoAborto15 } from '../v15/saude/aborto15';
import { gestacaoEmCurso } from '../sistemas/familia';
import type { Ctx } from '../conteudo/base';
import type { Vida } from '../tipos';

function gravida(pais: string, uf?: string, i = 25): Vida {
  const v = structuredClone(adulto(i, { genero: 'feminino' }));
  const m = cidadesDoPais(pais).find(x => !uf || x.uf === uf)!;
  v.moradia.municipioId = m.id;
  v.corpo.podeGestar = true;
  v.corpo.saude = 80;
  v.financas.conta = 30000;
  v.processos.push({ tipo: 'gestacao', id: 'g1', tConcepcao: v.t - 1, tParto: v.t + 8, gestanteId: 'eu', descoberta: true, planejada: false });
  return v;
}
const ctx = (v: Vida): Ctx => ({ v, r: criarRng(3), idade: 25, p: {}, g: (m, f) => f ?? m, vezes: 0 });
const disp = (v: Vida, id: string) => opcoesDoAborto15.find(o => o.id === id)!.disponivel!(ctx(v));

describe('VIDA 15 · aborto e a lei do lugar', () => {
  it('Portugal: legal a pedido no prazo, pela rede pública; a gravidez acaba e a biografia registra', () => {
    const v = gravida('PT');
    expect(legalAqui15(v).pode).toBe(true);
    expect(disp(v, 'interromper_legal')).toBe(true);
    expect(disp(v, 'interromper_fora')).toBe(false);
    const conta = v.financas.conta;
    const r = opcoesDoAborto15[0].resolver(ctx(v));
    expect(gestacaoEmCurso(v)).toBeUndefined();
    expect(v.financas.conta).toBe(conta);
    expect(r.memoria).toMatch(/interromper/);
  });

  it('Brasil, adulta e saudável: não é legal aqui; viajar ou fazer fora da lei aparecem, com o risco dito', () => {
    const v = gravida('BR');
    expect(legalAqui15(v).pode).toBe(false);
    expect(disp(v, 'interromper_legal')).toBe(false);
    expect(disp(v, 'interromper_fora')).toBe(true);
    expect(disp(v, 'interromper_clandestino')).toBe(true);
    expect(opcoesDoAborto15[2].consequencia!(ctx(v))).toMatch(/crime/);
    opcoesDoAborto15[2].resolver(ctx(v));
    expect(gestacaoEmCurso(v)).toBeUndefined();
    expect(v.segredos?.some(s => s.tipo === 'ilicito')).toBe(true);
  });

  it('Brasil: menor de 14 (estupro de vulnerável pela lei) e risco à vida têm acesso legal', () => {
    const v = gravida('BR', undefined, 13);
    expect(legalAqui15(v).pode).toBe(true);
    const w = gravida('BR');
    w.corpo.saude = 20;
    expect(legalAqui15(w).pode).toBe(true);
  });

  it('EUA: o estado decide (Texas proíbe; Califórnia permite)', () => {
    expect(leiDoAborto15(gravida('US', 'TX')).regime).toBe('permissivos');
    expect(legalAqui15(gravida('US', 'TX')).pode).toBe(false);
    expect(legalAqui15(gravida('US', 'CA')).pode).toBe(true);
  });

  it('sem dinheiro, viajar não dá (o motivo é dito)', () => {
    const v = gravida('CL');
    v.financas.conta = 0;
    v.financas.investimentos = [];
    expect(typeof disp(v, 'interromper_fora')).toBe('string');
  });
});
