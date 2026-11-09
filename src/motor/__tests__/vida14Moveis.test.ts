/** VIDA 14 · móveis: tipo de cada produto, espaço do cômodo, depósito (nunca some), conjuntos e imóveis mobiliados (sem duplicar, sem cobrar duas vezes). */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { COISAS } from '../dados/coisas';
import { tipoDeMovel, temTipoDeMovel } from '../dados14/moveis/catalogo';
import { DEPOSITO, encaixe14, leituraMoveis14, mobiliaDaOferta14, ocupa14 } from '../v14/moveis/moveis14';
import { ofertasDeImoveis } from '../sistemas/mercado';
import { interpretar } from '../save';
import type { Vida } from '../tipos';

function morador(): Vida {
  let v = structuredClone(adulto(30));
  v.financas.conta = 2_000_000;
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') {
    const o = ofertasDeImoveis(v, 'aluguel').find(x => x.modeloId === 'apto_1q' && mobiliaDaOferta14(v, x).nivel === 'vazio') ?? ofertasDeImoveis(v, 'aluguel').find(x => x.modeloId === 'apto_1q')!;
    v = executar(v, { tipo: 'sair_de_casa', ofertaId: o.id }).vida;
  }
  return v;
}

describe('VIDA 14 · loja de móveis', () => {
  it('todo móvel e eletrodoméstico tem tipo (nada cai em "Outros")', () => {
    for (const c of COISAS.filter(x => x.daCasa && x.loja === 'casa')) expect(c.eletro || temTipoDeMovel(c.id), c.id).toBe(true);
    expect(tipoDeMovel('sofa_couro', false)).toBe('sofas');
    expect(tipoDeMovel('poltrona_designer', false)).toBe('poltronas');
  });
  it('comprar além do espaço não proíbe: a peça vai para o depósito; dá para trocar e retirar', () => {
    let v = morador();
    const sofas = ['sofa', 'sofa_retratil', 'sofa_couro', 'sofa_designer', 'sofa_cama'];
    for (const id of sofas) if (podeTentar(disponibilidade(v, { tipo: 'comprar_coisa', coisaId: id }))) v = executar(v, { tipo: 'comprar_coisa', coisaId: id }).vida;
    const meus = (v.financas.coisas ?? []).filter(t => sofas.includes(t.coisaId));
    expect(meus.length).toBeGreaterThanOrEqual(3);
    expect(meus.some(t => t.local === DEPOSITO)).toBe(true);
    const l = leituraMoveis14(v);
    for (const c of l.comodos) expect(c.usado).toBeLessThanOrEqual(c.capacidade + 0.01);
    const dep = meus.find(t => t.local === DEPOSITO)!;
    const naSala = meus.find(t => !t.local)!;
    v = executar(v, { tipo: 'moveis14', oque: { op: 'substituir', novo: dep.id, sai: naSala.id } } as never).vida;
    expect((v.financas.coisas ?? []).find(t => t.id === dep.id)!.local).toBeUndefined();
    expect((v.financas.coisas ?? []).find(t => t.id === naSala.id)!.local).toBe(DEPOSITO);
    expect(encaixe14(v, 'cama_king').ocupa).toBe(ocupa14('cama_king'));
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });
  it('conjunto: compra as peças juntas com desconto', () => {
    let v = morador();
    const antes = (v.financas.coisas ?? []).length;
    v = executar(v, { tipo: 'moveis14', oque: { op: 'conjunto', id: 'quarto_minimalista' } } as never).vida;
    expect((v.financas.coisas ?? []).length).toBe(antes + 3);
  });
});

describe('VIDA 14 · imóveis mobiliados', () => {
  it('no aluguel mobiliado, as peças são do proprietário: ficam ao sair; o que repete o seu ele guarda', () => {
    let v = morador();
    v = executar(v, { tipo: 'comprar_coisa', coisaId: 'geladeira' }).vida;
    v.t += 13; v.anoAtual = { acoes: [] };
    const o = ofertasDeImoveis(v, 'aluguel').find(x => ['mobiliado', 'luxo'].includes(mobiliaDaOferta14(v, x).nivel) && mobiliaDaOferta14(v, x).pecas.includes('geladeira'));
    expect(o).toBeDefined();
    const mob = mobiliaDaOferta14(v, o!);
    v = executar(v, { tipo: 'trocar_moradia', ofertaId: o!.id }).vida;
    const doDono = (v.financas.coisas ?? []).filter(t => t.doImovel);
    expect(doDono.length).toBeGreaterThan(0);
    expect((v.financas.coisas ?? []).filter(t => t.coisaId === 'geladeira').length).toBe(1); // a sua (na casa ou no depósito); a dele ficou guardada com ele
    expect(v.moradia.mobilia14?.devolvidos?.some(d => d.coisaId === 'geladeira')).toBe(true);
    expect(v.moradia.aluguel).toBeGreaterThanOrEqual(Math.round(o!.aluguel * (1 + mob.acrescimo) / 10) * 10 - 10);
    expect(disponibilidade(v, { tipo: 'vender_coisa', id: doDono[0].id } as never).grau).toBe('impossivel');
    v.t += 13; v.anoAtual = { acoes: [] };
    const vazio = ofertasDeImoveis(v, 'aluguel').find(x => mobiliaDaOferta14(v, x).nivel === 'vazio' && x.modeloId !== 'republica')!;
    v = executar(v, { tipo: 'trocar_moradia', ofertaId: vazio.id }).vida;
    expect(v.moradia.mobilia14).toBeUndefined();
    expect((v.financas.coisas ?? []).some(t => t.doImovel)).toBe(false);
    expect((v.financas.coisas ?? []).some(t => t.coisaId === 'geladeira')).toBe(true); // a sua foi junto
  });
});
