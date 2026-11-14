/**
 * VIDA 21 · o catálogo da garagem: utilitários, jipes, picapes grandes na concessionária; hipercarros e carros de
 * competição no colecionador (com o patrimônio que quem vende exige); o carro de competição não vai para a rua (não
 * leva ninguém, não vira o do dia a dia, não passeia) e se usa no dia de pista — que custa, diverte e pode quebrar.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import type { Veiculo, Vida } from '../tipos';
import { executar, disponibilidade } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { ofertasDeVeiculos } from '../sistemas/mercado';
import { modeloVeiculo, VEICULOS, VERSOES_VEICULO } from '../dados/bens';
import { CLASSES_21, VERSOES_21 } from '../dados/veiculos21';
import { opcoesDeDeslocamento } from '../sistemas/transporte';
import { disponibilidadeUsoVeiculo } from '../sistemas/usos';
import { exportarVida, importarVida } from '../save';

const rico = (conta: number): Vida => transacao(adulto(40, { semente: 2131, municipioId: 'sao-paulo-sp' }), x => {
  x.financas.conta = conta; x.financas.dividas = []; x.momento = null; delete x.fila;
  if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh');
}).vida;
const comprar = (v: Vida, lugar: 'concessionaria' | 'colecionador', versao: string) => {
  const o = ofertasDeVeiculos(v, lugar).find(x => x.versaoId === versao && !x.usado);
  expect(o, `${versao} à venda em ${lugar}`).toBeTruthy();
  const a = { tipo: 'comprar_veiculo' as const, ofertaId: o!.id, financiar: false };
  return { a, d: disponibilidade(v, a) };
};
const meu = (v: Vida, versao: string) => v.financas.bens.find((b): b is Veiculo => b.tipo === 'veiculo' && b.versaoId === versao)!;

describe('VIDA 21 · o catálogo novo', () => {
  it('as classes e versões existem, cada versão aponta para uma classe e tem preço; nada entra no sorteio de usados', () => {
    for (const c of CLASSES_21) { expect(VEICULOS).toContain(c); expect(c.usado).toBe(false); }
    for (const x of VERSOES_21) { expect(VERSOES_VEICULO).toContain(x); expect(modeloVeiculo(x.classe)).toBeTruthy(); expect(x.preco).toBeGreaterThan(0); }
    expect(new Set(VERSOES_VEICULO.map(x => x.id)).size).toBe(VERSOES_VEICULO.length);
    expect(VERSOES_21.filter(x => x.classe === 'competicao').map(x => x.id)).toContain('f1_monoposto');
  });

  it('concessionária vende picape grande e jipe; colecionador vende hipercarro e carro de competição', () => {
    const v = rico(100_000_000);
    const conc = ofertasDeVeiculos(v, 'concessionaria').map(o => o.versaoId);
    for (const id of ['ram_1500_laramie', 'lr_defender', 'fiat_strada', 'jeep_wrangler']) expect(conc).toContain(id);
    const col = ofertasDeVeiculos(v, 'colecionador').map(o => o.versaoId);
    for (const id of ['bugatti_chiron_ss', 'f1_monoposto', 'porsche_gt3r', 'rali_r5']) expect(col).toContain(id);
    // A concessionária não vende carro de corrida.
    expect(conc).not.toContain('f1_monoposto');
  });

  it('quem tem dinheiro compra; o hipercarro pede patrimônio (a fábrica escolhe a quem vende)', () => {
    expect(podeTentar(comprar(rico(100_000_000), 'colecionador', 'bugatti_chiron_ss').d)).toBe(true);
    const meioRico = rico(45_000_000);
    const h = comprar(meioRico, 'colecionador', 'bugatti_chiron_ss').d;
    expect(podeTentar(h)).toBe(false);
    expect(h.motivo).toMatch(/patrimônio/);
    expect(podeTentar(comprar(rico(900_000), 'concessionaria', 'ram_1500_laramie').d)).toBe(true);
  });
});

describe('VIDA 21 · o carro de competição não é carro de rua', () => {
  it('comprado, não leva ninguém, não vira o do dia a dia, não passeia; vai ao dia de pista (custa, pode quebrar) e persiste', () => {
    let v = rico(100_000_000);
    v = executar(v, comprar(v, 'colecionador', 'f1_monoposto').a).vida;
    const f1 = meu(v, 'f1_monoposto');
    expect(f1).toBeTruthy();
    expect(opcoesDeDeslocamento(v).some(o => o.veiculoId === f1.id)).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'veiculo', bemId: f1.id, oque: 'principal' }))).toBe(false);
    expect(disponibilidadeUsoVeiculo(v, f1, 'passear').ok).toBe(false);
    expect(disponibilidadeUsoVeiculo(v, f1, 'pista').ok).toBe(true);
    const conta = v.financas.conta;
    let quebrou = false;
    for (let k = 0; k < 3; k++) {
      const a = { tipo: 'usar_veiculo' as const, bemId: f1.id, oque: 'pista' as const };
      if (!podeTentar(disponibilidade(v, a))) break;
      v = executar(v, a).vida;
      if (meu(v, 'f1_monoposto').problema) { quebrou = true; break; }
    }
    expect(v.financas.conta).toBeLessThan(conta - 300_000);
    if (!quebrou) expect(podeTentar(disponibilidade(v, { tipo: 'usar_veiculo', bemId: f1.id, oque: 'pista' }))).toBe(false);
    const l = importarVida(exportarVida(v));
    if (l.tipo !== 'ok') throw new Error(l.tipo);
    expect(meu(l.vida, 'f1_monoposto').historia?.some(h => h.texto.startsWith('Dia de pista'))).toBe(true);
  });

  it('o superesportivo faz track day; o carro popular não', () => {
    let v = rico(10_000_000);
    v = executar(v, comprar(v, 'concessionaria', 'fiat_strada').a).vida;
    expect(disponibilidadeUsoVeiculo(v, meu(v, 'fiat_strada'), 'pista').ok).toBe(false);
    expect(disponibilidadeUsoVeiculo(v, meu(v, 'fiat_strada'), 'passear').ok).toBe(true);
  });
});
