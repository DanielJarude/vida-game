/**
 * VIDA 27 · §5 — a partilha na separação e no divórcio.
 *
 * O defeito do playtest: depois da separação, a outra pessoa ficou com quase tudo e o personagem, no negativo. Causas:
 * só o SEU patrimônio entrava (o que a outra pessoa juntou, nunca), a valorização do que já era seu contava, e o
 * pagamento vendia a casa mesmo quando a venda não cobria (conta negativa) ou virava dívida.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro } from './cenarios';
import { executar } from '../acoes';
import { planoDaPartilha, resumoDaPartilha, separarVidaMaterial } from '../sistemas/partilha';
import { balanco } from '../sistemas/dinheiro';
import type { Imovel, Pessoa, Veiculo, Vida } from '../tipos';

function casal(o: { regime?: 'comunhao_parcial' | 'separacao_total' | 'comunhao_universal'; antesConta?: number; antesPar?: number } = {}): { v: Vida; p: Pessoa } {
  const v = adulto(40, { semente: 27 });
  v.financas.conta = 0; v.financas.dividas = []; v.financas.bens = []; v.financas.investimentos = []; v.financas.empresas = [];
  v.momento = null; delete v.fila;
  const { p, vin } = comParceiro(v, { estagio: 'casamento', anos: 10 });
  if (o.regime) vin.romance!.regime = o.regime;
  // A união começou há dez anos: a fotografia de cada lado naquele dia.
  const t0 = v.t - 120;
  v.fatos[`uniao_${p.id}`] = t0;
  v.fatos[`liquido_uniao_${p.id}`] = o.antesConta ?? 0;
  v.fatos[`patrimonio_uniao_${p.id}`] = o.antesConta ?? 0;
  v.fatos[`herdado_ate_uniao_${p.id}`] = 0;
  p.posses = { dinheiro: o.antesPar ?? 0, bens: [], historia: [] };
  v.fatos[`posses_par_uniao_${p.id}`] = o.antesPar ?? 0;
  return { v, p };
}
const imovel = (v: Vida, id: string, valor: number, tCompra: number, extra: Partial<Imovel> = {}): Imovel => {
  const b: Imovel = { id, tipo: 'imovel', modeloId: 'apto_2q', nome: `apartamento ${id}`, valor, tCompra, municipioId: v.moradia.municipioId, estado: 80, ...extra };
  v.financas.bens.push(b); return b;
};
const carro = (v: Vida, id: string, valor: number, tCompra: number): Veiculo => {
  const b = { id, tipo: 'veiculo', modeloId: 'popular', nome: `carro ${id}`, valor, tCompra, estado: 80, km: 30000 } as unknown as Veiculo;
  v.financas.bens.push(b); return b;
};

describe('VIDA 27 · partilha', () => {
  it('patrimônios parecidos dos dois lados: ninguém passa quase nada', () => {
    const { v, p } = casal();
    v.financas.conta = 200_000;
    p.posses!.dinheiro = 190_000;
    const pl = planoDaPartilha(v, p, 'casamento');
    expect(pl.meu).toBe(200_000);
    expect(pl.dela).toBe(190_000);
    expect(pl.saldo).toBe(5000);
  });

  it('o que a outra pessoa juntou entra (antes, só o seu): parceria mais rica passa a diferença para você', () => {
    const { v, p } = casal();
    v.financas.conta = 20_000;
    p.posses!.dinheiro = 300_000;
    const antes = v.financas.conta;
    const pl = planoDaPartilha(v, p, 'casamento');
    expect(pl.saldo).toBe(-140_000);
    expect(pl.receber).toBe(140_000);
    separarVidaMaterial(v, p, 'casamento');
    expect(v.financas.conta - antes).toBe(140_000);
    expect(p.posses!.dinheiro).toBe(160_000);
  });

  it('patrimônio muito desigual a seu favor: passa a metade da diferença, em dinheiro, sem ficar negativo', () => {
    const { v, p } = casal();
    v.financas.conta = 1_000_000;
    const pl = planoDaPartilha(v, p, 'casamento');
    expect(pl.saldo).toBe(500_000);
    separarVidaMaterial(v, p, 'casamento');
    expect(v.financas.conta).toBe(500_000);
    expect(p.posses!.dinheiro).toBe(500_000);
  });

  it('o que era seu antes da união (e a valorização dele) fica fora; a herança também', () => {
    const { v, p } = casal({ antesConta: 0 });
    imovel(v, 'antigo', 900_000, v.t - 200); // comprado antes da união (e valorizado)
    v.financas.conta = 100_000; v.fatos['herdado_total'] = 60_000; // 60 mil do dinheiro vieram de herança
    const pl = planoDaPartilha(v, p, 'casamento');
    expect(pl.meu).toBe(40_000);
    expect(pl.saldo).toBe(20_000);
    separarVidaMaterial(v, p, 'casamento');
    expect(v.financas.bens.some(b => b.id === 'antigo')).toBe(true);
  });

  it('dívidas feitas na união diminuem o que se divide; o bem vai com o financiamento dele', () => {
    const { v, p } = casal();
    v.financas.conta = 0;
    const casa = imovel(v, 'casa', 500_000, v.t - 60);
    v.financas.dividas.push({ id: 'fin', tipo: 'financiamento_imovel', saldo: 200_000, jurosMes: 0.008, parcela: 3000, bemId: casa.id, tInicio: v.t - 60, prazo: 240 });
    v.financas.dividas.push({ id: 'emp', tipo: 'emprestimo', saldo: 40_000, jurosMes: 0.02, parcela: 1500, tInicio: v.t - 12, prazo: 36 });
    const pl = planoDaPartilha(v, p, 'casamento');
    expect(pl.meu).toBe(260_000); // 500 − 200 (financiamento) − 40 (empréstimo)
    expect(pl.saldo).toBe(130_000);
    separarVidaMaterial(v, p, 'casamento');
    expect(v.financas.conta).toBeGreaterThanOrEqual(0);
    // Sem dinheiro, o apartamento (equity 300 mil > 130 mil) é vendido; a sobra fica.
    expect(v.financas.bens.some(b => b.id === 'casa')).toBe(false);
    expect(v.financas.dividas.some(d => d.id === 'fin')).toBe(false);
    expect(v.financas.conta).toBeGreaterThan(0);
  });

  it('sem dinheiro, um bem da união do tamanho certo fica com a outra pessoa (com a dívida dele); nunca saldo negativo', () => {
    const { v, p } = casal();
    v.financas.conta = 5000;
    carro(v, 'c1', 60_000, v.t - 24);
    imovel(v, 'i1', 100_000, v.t - 36);
    const pl = planoDaPartilha(v, p, 'casamento');
    expect(pl.saldo).toBe(82_500);
    separarVidaMaterial(v, p, 'casamento');
    expect(v.financas.conta).toBeGreaterThanOrEqual(0);
    expect(p.posses!.bens.length + (pl.vender ? 0 : 0)).toBeGreaterThan(0);
    expect(balanco(v).liquido).toBeGreaterThan(0);
  });

  it('separação total: nada se divide', () => {
    const { v, p } = casal({ regime: 'separacao_total' });
    v.financas.conta = 1_000_000;
    expect(planoDaPartilha(v, p, 'casamento').divide).toBe(false);
    separarVidaMaterial(v, p, 'casamento');
    expect(v.financas.conta).toBe(1_000_000);
  });

  it('comunhão universal: o de antes entra também', () => {
    const { v, p } = casal({ regime: 'comunhao_universal' });
    imovel(v, 'antigo', 400_000, v.t - 300);
    expect(planoDaPartilha(v, p, 'casamento').meu).toBe(400_000);
    expect(planoDaPartilha(v, p, 'casamento').saldo).toBe(200_000);
  });

  it('o resumo mostra exatamente o que a separação faz (o saldo de depois)', () => {
    const { v, p } = casal();
    v.financas.conta = 30_000;
    carro(v, 'c1', 40_000, v.t - 24);
    imovel(v, 'i1', 300_000, v.t - 36);
    const r = resumoDaPartilha(v, p, 'casamento');
    expect(r.linhas.join(' ')).toMatch(/Fica com você|Fica com/);
    separarVidaMaterial(v, p, 'casamento');
    expect(Math.round(v.financas.conta)).toBe(r.contaDepois);
  });

  it('pedir o divórcio abre o resumo antes; desistir não separa; seguir separa', () => {
    const { v, p } = casal();
    v.financas.conta = 100_000;
    const a = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'terminar' }).vida;
    expect(a.momento?.situacaoId).toBe('rel27_separacao');
    expect(a.momento!.texto).toMatch(/comunhão parcial/);
    expect(a.vinculos[p.id].romance!.estagio).toBe('casamento');
    const desistiu = executar(a, { tipo: 'decidir', opcaoId: 'desistir' }).vida;
    expect(desistiu.vinculos[p.id].romance!.estagio).toBe('casamento');
    const seguiu = executar(a, { tipo: 'decidir', opcaoId: 'seguir' }).vida;
    expect(seguiu.vinculos[p.id].romance!.estagio).toBe('ex');
    expect(seguiu.financas.conta).toBe(50_000);
  });
});
