/**
 * Bimotor e jato à venda (os desenhos já existiam; faltava o motor inteiro):
 * catálogo e preço, onde se vende, quem pode comprar (patrimônio do jato),
 * quem pode pilotar (licença de piloto + habilitação de multimotor no
 * bimotor; tripulação contratada no jato), o que custa manter (combustível e
 * manutenção, seguro/hangar/inspeção, tripulação), o valor no patrimônio
 * (depreciação), o save e a venda.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import { disponibilidade, executar } from '../acoes';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { VEICULOS, VERSOES_VEICULO, modeloVeiculo, versoesDaClasse } from '../dados/bens';
import { ofertasDeVeiculos } from '../sistemas/mercado';
import { custosDeVeiculo, processarVeiculos, valorDeVenda } from '../sistemas/veiculos';
import { disponibilidadeHabilitacao, faltaHabilitacao, iniciarHabilitacao, processarHabilitacoes } from '../sistemas/habilitacoes';
import { rotuloUsoVeiculo } from '../sistemas/usos';
import { patrimonio } from '../sistemas/dinheiro';
import { exportarVida, importarVida } from '../save';
import type { Veiculo, Vida } from '../tipos';

let base: Vida | undefined;
/** Uma pessoa rica numa capital (a cidade tem aeroclube). */
function rica(conta: number): Vida {
  const v = structuredClone((base ??= adulto(45, { semente: 5, municipioId: 'sao-paulo-sp' })));
  v.trabalho.atual = undefined;
  contratar(v, criarRng(3), ocupacao('assistente_adm'));
  v.trabalho.atual!.salario = 90000;
  v.financas = { ...v.financas, conta, investimentos: [], dividas: [], bens: [], negativado: false };
  return v;
}
const oferta = (v: Vida, versao: string) => ofertasDeVeiculos(v, 'aeroclube').find(o => o.versaoId === versao && !o.usado)!;
const aeronave = (v: Vida) => v.financas.bens.find((b): b is Veiculo => b.tipo === 'veiculo' && modeloVeiculo(b.modeloId).categoria === 'aeronave')!;

describe('o catálogo do aeroclube', () => {
  it('bimotor e jato são classes com versões reais, à venda no aeroclube da capital, com preços em escada', () => {
    const v = rica(1000);
    for (const id of ['bimotor', 'jato']) {
      expect(VEICULOS.find(m => m.id === id)?.categoria).toBe('aeronave');
      expect(versoesDaClasse(id).length).toBeGreaterThanOrEqual(2);
    }
    for (const x of ['piper_seneca', 'beech_baron', 'embraer_phenom100', 'cessna_citation_m2']) expect(oferta(v, x)).toBeDefined();
    const preco = (id: string) => Math.min(...VERSOES_VEICULO.filter(x => x.classe === id).map(x => x.preco));
    expect(preco('ultraleve')).toBeLessThan(preco('monomotor'));
    expect(preco('monomotor')).toBeLessThan(preco('bimotor'));
    expect(preco('bimotor')).toBeLessThan(preco('jato'));
    // Interior sem aeroclube: nada de avião.
    const interior = { ...v, moradia: { ...v.moradia, municipioId: 'campina-grande-pb' } };
    expect(ofertasDeVeiculos(interior, 'aeroclube').length).toBe(0);
  });
});

describe('bimotor: licença de piloto + habilitação de multimotor', () => {
  it('compra, custo de manter, quem pilota: sem multimotor, piloto contratado — e a habilitação pede a licença antes', () => {
    let v = rica(9_000_000);
    const o = oferta(v, 'piper_seneca');
    expect(disponibilidade(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).grau).not.toBe('impossivel');
    v = executar(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).vida;
    const b = aeronave(v);
    expect(b.modeloId).toBe('bimotor');
    expect(b.versaoId).toBe('piper_seneca');
    expect(v.biografia.some(e => /Comprou o primeiro avião bimotor: um Piper Seneca V/.test(e.texto))).toBe(true);
    const custos = custosDeVeiculo(v, b, 1);
    expect(custos.some(l => /combustível e manutenção/.test(l.rotulo))).toBe(true);
    expect(custos.some(l => /seguro, hangar e inspeção/.test(l.rotulo))).toBe(true);
    expect(custos.some(l => /tripulação/.test(l.rotulo))).toBe(false);
    // Sem nenhuma habilitação: falta a de multimotor; e a de multimotor não abre sem a licença de piloto.
    expect(faltaHabilitacao(v, 'bimotor')).toBe('multimotor');
    expect(rotuloUsoVeiculo(v, b, 'passear')).toMatch(/piloto contratado/);
    expect(disponibilidadeHabilitacao(v, 'multimotor').grau).toBe('requisito');
    v.trabalho.licencas.push('piloto');
    // Só a licença de piloto não basta para o bimotor.
    expect(faltaHabilitacao(v, 'bimotor')).toBe('multimotor');
    expect(disponibilidadeHabilitacao(v, 'multimotor').grau).toBe('permitido');
    const antes = v.financas.conta;
    iniciarHabilitacao(v, 'multimotor');
    expect(v.financas.conta).toBeLessThan(antes);
    for (let k = 0; k < 6 && !v.trabalho.licencas.includes('multimotor'); k++) { v.t += 12; processarHabilitacoes(v); }
    expect(v.trabalho.licencas).toContain('multimotor');
    expect(faltaHabilitacao(v, 'bimotor')).toBeUndefined();
    expect(rotuloUsoVeiculo(v, b, 'passear')).not.toMatch(/contratado/);
  });
});

describe('jato: patrimônio para comprar, tripulação para voar', () => {
  it('abaixo do patrimônio pedido a venda não sai; acima, sai — e a tripulação entra na conta do mês (não quando parado)', () => {
    const pobre = rica(30_000_000);
    const o1 = oferta(pobre, 'embraer_phenom100');
    expect(patrimonio(pobre)).toBeLessThan(modeloVeiculo('jato').patrimonioMin!);
    const d = disponibilidade(pobre, { tipo: 'comprar_veiculo', ofertaId: o1.id, financiar: false });
    expect(d.grau).toBe('requisito');
    expect(d.motivo).toMatch(/patrimônio/);
    let v = rica(70_000_000);
    const o = oferta(v, 'embraer_phenom100');
    expect(disponibilidade(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).grau).toBe('permitido');
    v = executar(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }).vida;
    const b = aeronave(v);
    expect(b.modeloId).toBe('jato');
    expect(v.biografia.some(e => /Comprou o primeiro jato executivo: um Embraer Phenom 100EV/.test(e.texto))).toBe(true);
    // Ninguém pilota jato por conta: a tripulação está na folha, e o voo diz isso.
    expect(faltaHabilitacao(v, 'jato')).toBeUndefined();
    expect(rotuloUsoVeiculo(v, b, 'viajar')).toMatch(/com a tripulação/);
    const trip = custosDeVeiculo(v, b, 1).find(l => /tripulação/.test(l.rotulo));
    expect(trip?.valor).toBe(modeloVeiculo('jato').tripulacao);
    b.parado = true;
    expect(custosDeVeiculo(v, b, 1).some(l => /tripulação/.test(l.rotulo))).toBe(false);
  });

  it('o valor deprecia e entra no patrimônio; o save guarda; a venda devolve o valor de mercado', () => {
    let v = rica(70_000_000);
    v = executar(v, { tipo: 'comprar_veiculo', ofertaId: oferta(v, 'cessna_citation_m2').id, financiar: false }).vida;
    const valor0 = aeronave(v).valor;
    const pat0 = patrimonio(v);
    for (let k = 0; k < 3; k++) { v.t += 12; processarVeiculos(v, criarRng(k + 1)); }
    expect(aeronave(v).valor).toBeLessThan(valor0);
    expect(patrimonio(v)).toBeLessThan(pat0);
    const l = importarVida(exportarVida(v));
    if (l.tipo !== 'ok') throw new Error(l.tipo);
    expect(aeronave(l.vida)).toEqual(aeronave(v));
    const b = aeronave(v);
    const vende = valorDeVenda(b);
    const conta = v.financas.conta;
    v = executar(v, { tipo: 'vender_bem', bemId: b.id }).vida;
    expect(v.financas.bens.some(x => x.id === b.id)).toBe(false);
    expect(v.financas.conta).toBe(conta + vende);
  });
});
