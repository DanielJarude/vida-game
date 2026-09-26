/**
 * ATT 3 — vida material: dinheiro pessoal × casa × casal, orçamento,
 * economia, moradia, compra e financiamento, patrimônio e dívidas, veículos,
 * investimentos, pets, herança, negócio e a migração do save v9 → v10.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, viverAte, viver, responder } from './ajuda';
import { criarRng } from '../rng';
import { avancarAno } from '../ano';
import { disponibilidade, executar, condicoesImovel, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { idade, idadePessoa, filhos, parceiro, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { arranjoDaCasa, balanco, limiteDeCredito, orcamento, patrimonio, processarDinheiro, seguranca } from '../sistemas/dinheiro';
import { avancarEconomia, economiaInicial, type AnoEconomico } from '../sistemas/economia';
import { aplicar, processarInvestimentos, resgatar, retornos } from '../sistemas/investimentos';
import { animaisDoAbrigo, ofertaPorModelo, ofertasDeImoveis, ofertasDeVeiculos } from '../sistemas/mercado';
import { animaisParaVoce, imoveisParaVoce, investimentosParaVoce, MAX_PRIMARIAS_MATERIAL, veiculosParaVoce } from '../sistemas/relevancia';
import { disponibilidadeVeiculo, processarVeiculos, veiculoUtil, type AcaoVeiculo } from '../sistemas/veiculos';
import { processarObrigacoes } from '../sistemas/obrigacoes';
import { adotarPet, custoDosPets, disponibilidadeVeterinario, processarPets } from '../sistemas/pets';
import { calcularHeranca, comecarVidaEmComum, construidoJunto } from '../sistemas/partilha';
import { mudarEstagio, terminar } from '../sistemas/romance';
import { semana } from '../sistemas/semana';
import { importancia } from '../sistemas/vinculos';
import { abrirNegocio, fecharNegocio, processarNegocio } from '../sistemas/negocio';
import { fatoresCabeca } from '../sistemas/estado';
import { interpretar, VERSAO_SAVE } from '../save';
import { PRODUTOS } from '../dados/investimentos';
import type { Genero, Pessoa, Vida } from '../tipos';

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const ANO_NORMAL: AnoEconomico = { fase: 'normal', inflacao: 0.045, juroReal: 0.045, bolsa: 0.03, imoveis: 0.005, deltaJuro: 0, virou: false };

/* ---------------------------------------------------------------- Cenários */

/** Uma adulta morando sozinha de aluguel, com emprego formal, sem bens nem dívidas. */
function sozinha(i = 30, semente = 21, genero: Genero = 'feminino'): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, genero }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero }), i);
  v.momento = null;
  v.caminhos.processo = undefined;
  v.caminhos.negocio = undefined;
  for (const vin of Object.values(v.vinculos)) { vin.convivio = vin.convivio.filter(c => c !== 'casa'); if (vin.romance) vin.romance = undefined; }
  v.trabalho.atual = undefined;
  v.trabalho.aposentadoria = undefined;
  contratar(v, criarRng(3), ocupacao('assistente_adm'));
  v.financas = { ...v.financas, conta: 20000, investimentos: [], dividas: [], bens: [], negativado: false, estilo: 'modesto', planoDeSaude: false };
  v.educacao.matricula = undefined;
  v.educacao.cursinho = false;
  v.rotinas = [];
  for (const k of Object.keys(v.fatos)) if (/^(ajuda_mensal|paga_cuidadora|casa_repouso|paga_faculdade|aposta)/.test(k)) delete v.fatos[k];
  // "Sozinha": morando só, de aluguel (a vida sorteada pode ainda estar na casa dos pais).
  if (v.moradia.tipo !== 'aluguel') v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'kitnet', aluguel: 1200, padrao: 2, tInicio: v.t, aceitaPet: true };
  v.justica = undefined;
  v.caminhos.envolvimento = undefined;
  v.trabalho.pausa = undefined;
  v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_1q', aluguel: 1200, padrao: 3, tInicio: v.t, aceitaPet: true };
  v.anoAtual = { acoes: [] };
  return v;
}

function comParceria(v: Vida, estagio: 'morando_junto' | 'casamento', renda = 4000): Pessoa {
  const p = criarPessoa(v, criarRng(v.seq + 5), { idade: idade(v), genero: 'masculino', municipioId: v.moradia.municipioId, renda });
  vincular(v, p, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
  v.vinculos[p.id].romance = { estagio: 'namoro', tEstagio: v.t, envolvimento: 80 };
  mudarEstagio(v, v.vinculos[p.id], estagio);
  if (!v.vinculos[p.id].convivio.includes('casa')) v.vinculos[p.id].convivio.push('casa');
  return p;
}

function comFilho(v: Vida, i: number): Pessoa {
  const f = criarPessoa(v, criarRng(v.seq + 9), { idade: i, genero: 'feminino', municipioId: v.moradia.municipioId });
  f.genitores = ['eu'];
  vincular(v, f, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
  return f;
}

function comCarro(v: Vida, anos = 10, estado = 50): string {
  const id = `v${v.seq++}`;
  v.financas.bens.push({ id, tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'carro compacto', valor: 30000, tCompra: v.t, estado, anoFabricacao: Math.floor(v.t / 12) - anos, usado: true, historia: [] });
  return id;
}

/* ================================================================ Dinheiro */

describe('dinheiro pessoal não é dinheiro da casa', () => {
  it('uma criança de família rica não tem o dinheiro dos pais: o orçamento dela é a mesada; a renda da casa é contexto', () => {
    const v = viverAte(nova({ semente: 31, classe: 'alta' }), 10);
    const o = orcamento(v);
    expect(o.arranjo).toBe('familia');
    expect(o.entradas.every(l => l.de === 'familia' || l.de === 'eu')).toBe(true);
    expect(o.entradas.some(l => /Renda de|Salário/.test(l.rotulo))).toBe(false);
    expect(o.saidas.some(l => /Mercado|Aluguel|Condomínio/.test(l.rotulo))).toBe(false);
    expect(o.daCasa?.renda ?? 0).toBeGreaterThan(o.renda * 5);
    expect(v.financas.conta).toBeLessThan(5000);
    expect(seguranca(v).nivel).toBe('dependente');
  });

  it('a mesada quase toda vira lanche e saída: aos 17, o guardado é uma fração do que a criança recebeu', () => {
    const v = viverAte(nova({ semente: 32, classe: 'alta' }), 17);
    const recebido = [8, 9, 10, 11, 12, 13, 14, 15, 16].reduce((s, i) => s + 450 * Math.min(1, (i - 6) / 10) * 12, 0);
    expect(v.financas.conta).toBeLessThan(recebido * 0.35);
  });

  it('adulto que mora com os pais e trabalha: ajuda nas contas, gasta o dele — e não paga o mercado da casa', () => {
    let v = viverAte(nova({ semente: 33, classe: 'trabalhadora' }), 20);
    if (v.moradia.tipo !== 'pais') v = viverAte(nova({ semente: 34, classe: 'trabalhadora' }), 20);
    v.trabalho.atual = undefined;
    contratar(v, criarRng(1), ocupacao('assistente_adm'));
    const o = orcamento(v);
    expect(o.arranjo).toBe('familia');
    expect(o.saidas.some(l => l.rotulo === 'Ajuda nas contas de casa')).toBe(true);
    expect(o.saidas.some(l => /Mercado, luz/.test(l.rotulo))).toBe(false);
    expect(o.entradas.some(l => l.de === 'parceria')).toBe(false);
  });

  it('morando junto sem casar, a parceria paga a parte dela nas contas da casa — não entra a renda inteira', () => {
    const v = sozinha(30, 40);
    const p = comParceria(v, 'morando_junto', 9000);
    const o = orcamento(v);
    expect(o.arranjo).toBe('juntos');
    const parte = o.entradas.find(l => l.de === 'parceria')!;
    expect(parte.rotulo).toMatch(/Parte de/);
    const compartilhadas = o.saidas.filter(l => ['moradia', 'casa', 'filhos', 'animais'].includes(l.grupo)).reduce((s, l) => s - l.valor, 0);
    expect(parte.valor).toBeLessThanOrEqual(compartilhadas + 1);
    expect(parte.valor).toBeLessThan(p.renda);
  });

  it('casados, a renda é comum: entra a renda inteira da parceria (e o plano de saúde dela)', () => {
    const v = sozinha(30, 41);
    v.financas.planoDeSaude = true;
    const p = comParceria(v, 'casamento', 5000);
    const o = orcamento(v);
    expect(o.arranjo).toBe('casados');
    expect(o.entradas.find(l => l.de === 'parceria')?.valor).toBe(p.renda);
    expect(o.saidas.some(l => l.rotulo.includes(`Plano de saúde de ${p.nome}`))).toBe(true);
  });

  it('o orçamento fecha: sobra = entradas − saídas; balanço líquido = ativos − obrigações', () => {
    const v = sozinha(35, 42);
    comCarro(v);
    v.financas.dividas.push({ id: 'x', tipo: 'emprestimo', saldo: 5000, jurosMes: 0.03, parcela: 300, descricao: 'Empréstimo pessoal', tInicio: v.t, prazo: 24 });
    aplicar(v, 'reserva', 8000);
    const o = orcamento(v);
    expect(o.sobra).toBeCloseTo(o.entradas.reduce((s, l) => s + l.valor, 0) + o.saidas.reduce((s, l) => s + l.valor, 0), 5);
    const b = balanco(v);
    expect(b.liquido).toBe(b.ativos - b.obrigacoes);
    expect(b.ativos).toBe(Math.max(0, b.conta) + b.aplicacoes + b.imoveis + b.veiculos);
    expect(patrimonio(v)).toBe(b.liquido);
  });

  it('filhos pesam no orçamento como parte da casa — nunca como "custo de fulano"', () => {
    const so = sozinha(33, 43);
    const fam = structuredClone(so);
    comFilho(fam, 2); comFilho(fam, 8);
    const d = (x: Vida) => orcamento(x).despesa;
    expect(d(fam)).toBeGreaterThan(d(so) + 800);
    const nomes = filhos(fam).map(f => f.nome);
    expect(orcamento(fam).saidas.some(l => nomes.some(n => l.rotulo.includes(`Custos de ${n}`)))).toBe(false);
    expect(orcamento(fam).saidas.some(l => l.grupo === 'filhos')).toBe(true);
  });

  it('o padrão de vida é propensão: quem ganha mais gasta mais no mesmo estilo; o apertado guarda mais que o folgado', () => {
    const baixo = sozinha(32, 44);
    const alto = structuredClone(baixo);
    alto.trabalho.atual!.salario *= 3;
    const lazer = (x: Vida) => -orcamento(x).saidas.filter(l => l.grupo === 'lazer').reduce((s, l) => s + l.valor, 0);
    expect(lazer(alto)).toBeGreaterThan(lazer(baixo) * 1.5);
    const apertado = structuredClone(alto); apertado.financas.estilo = 'apertado';
    const folgado = structuredClone(alto); folgado.financas.estilo = 'folgado';
    expect(orcamento(apertado).sobra).toBeGreaterThan(orcamento(folgado).sobra * 2 + 500);
  });

  it('sem emprego, a reserva segura antes do cartão; o crédito rotativo tem limite pela renda própria', () => {
    const v = sozinha(35, 45);
    v.trabalho.atual = undefined;
    v.financas.conta = 0;
    aplicar(v, 'reserva', 0);
    v.financas.investimentos = [];
    v.financas.conta = 60000;
    aplicar(v, 'reserva', 60000);
    processarDinheiro(v, criarRng(1), ANO_NORMAL);
    expect(v.financas.dividas.some(d => d.tipo === 'cartao')).toBe(false);
    expect(v.financas.investimentos.find(a => a.produto === 'reserva')!.valor).toBeLessThan(60000);
    expect(limiteDeCredito(v)).toBeLessThanOrEqual(1000);
  });

  it('a inflação corrói o dinheiro parado na conta; a reserva rende acima dela', () => {
    const v = sozinha(35, 46);
    v.trabalho.atual = undefined;
    v.moradia = { tipo: 'cedida', municipioId: v.moradia.municipioId, aluguel: 0, padrao: 1, tInicio: v.t };
    const parado = structuredClone(v); parado.financas.conta = 200000;
    const guardado = structuredClone(v); guardado.financas.conta = 0; guardado.financas.conta = 200000; aplicar(guardado, 'reserva', 200000);
    processarDinheiro(parado, criarRng(1), { ...ANO_NORMAL, inflacao: 0.08 });
    processarDinheiro(guardado, criarRng(1), { ...ANO_NORMAL, inflacao: 0.08 });
    expect(parado.financas.razao.some(l => /inflação levou/.test(l.rotulo))).toBe(true);
    expect(balanco(guardado).liquido).toBeGreaterThan(balanco(parado).liquido);
  });

  it('aposentadoria: o benefício entra como renda; quando não basta, as economias cobrem', () => {
    const v = sozinha(70, 47);
    v.trabalho.atual = undefined;
    v.trabalho.aposentadoria = { t: v.t, beneficio: 1700 };
    v.financas.estilo = 'confortavel';
    v.financas.conta = 0;
    v.financas.conta = 100000; aplicar(v, 'pos_fixado', 100000);
    const o = orcamento(v);
    expect(o.entradas.some(l => /Aposentadoria|BPC/.test(l.rotulo) && l.de === 'governo')).toBe(true);
    const antes = balanco(v).aplicacoes;
    processarDinheiro(v, criarRng(2), ANO_NORMAL);
    if (o.sobra < 0) expect(balanco(v).aplicacoes).toBeLessThan(antes * 1.05);
    expect(v.financas.dividas.some(d => d.tipo === 'cartao')).toBe(false);
  });

  it('mesma semente + mesmos comandos = mesmas finanças; e a economia não depende do que o jogador faz', () => {
    const a = viver(nova({ semente: 77 }), 40);
    const b = viver(nova({ semente: 77 }), 40);
    expect(JSON.stringify(a.financas)).toBe(JSON.stringify(b.financas));
    const c = viver(nova({ semente: 77 }), 40, v => (idade(v) >= 22 && v.financas.conta > 2000 ? [{ tipo: 'investir', destino: 'acoes', valor: 1000 }] : []));
    expect(c.economia.historico).toEqual(a.economia.historico);
  });
});

/* ================================================================ Economia */

describe('economia do país', () => {
  it('atravessa fases (crise, recuperação, expansão) com inflação e juro variando — nada fixo', () => {
    const e = economiaInicial(12345, 2026 * 12);
    const fases = new Set<string>();
    const juros = new Set<number>();
    for (let k = 1; k <= 60; k++) { const ec = avancarEconomia(e, (2026 + k) * 12); fases.add(ec.fase); juros.add(Math.round(ec.juroReal * 1000)); }
    expect(fases.has('crise')).toBe(true);
    expect(fases.size).toBeGreaterThanOrEqual(4);
    expect(juros.size).toBeGreaterThan(10);
  });

  it('juros compostos sem fórmula quebrada: em 100 anos, bolsa e imóveis voltam para uma tendência modesta', () => {
    let maxB = 0; let maxI = 0; let minI = 9;
    for (let s = 1; s <= 120; s++) {
      const e = economiaInicial(s * 97, 2026 * 12);
      for (let k = 1; k <= 100; k++) avancarEconomia(e, (2026 + k) * 12);
      maxB = Math.max(maxB, e.bolsa); maxI = Math.max(maxI, e.imoveis); minI = Math.min(minI, e.imoveis);
      expect(e.juroReal).toBeGreaterThanOrEqual(0.01);
      expect(e.juroReal).toBeLessThanOrEqual(0.09);
    }
    expect(maxB).toBeLessThan(25);
    expect(maxI).toBeLessThan(2.5);
    expect(minI).toBeGreaterThan(0.4);
  });

  it('crise aumenta demissões e diminui a clientela: a pessoa percebe pela vida', () => {
    const v = sozinha(30, 50);
    v.economia.fase = 'crise';
    const c = orcamento(v);
    expect(c.renda).toBeGreaterThan(0);
    // Via fatores de trabalho (ver consequencias.test para as demissões): aqui, a crise é a mesma para quem joga de novo.
    const e1 = economiaInicial(9, 2026 * 12); const e2 = economiaInicial(9, 2026 * 12);
    for (let k = 1; k <= 30; k++) { avancarEconomia(e1, (2026 + k) * 12); avancarEconomia(e2, (2026 + k) * 12); }
    expect(e1).toEqual(e2);
  });
});

/* ================================================================= Moradia */

describe('moradia', () => {
  it('criança mora com os responsáveis; aos 18, sai de casa por uma oferta real, paga a entrada e vira marco', () => {
    let v = viverAte(nova({ semente: 60, classe: 'media' }), 5);
    expect(v.moradia.tipo).toBe('pais');
    v = viverAte(v, 19);
    v.momento = null;
    if (v.moradia.tipo !== 'pais') return;
    v.trabalho.atual = undefined;
    contratar(v, criarRng(2), ocupacao('assistente_adm'));
    v.financas.conta = 15000;
    const o = imoveisParaVoce(v, 'aluguel').para[0]?.item ?? ofertaPorModelo(v, 'aluguel', 'kitnet')!;
    const antes = v.financas.conta;
    const d = executar(v, { tipo: 'sair_de_casa', ofertaId: o.id }).vida;
    expect(d.moradia.tipo === 'aluguel' || d.moradia.tipo === 'republica').toBe(true);
    expect(d.moradia.aluguel).toBe(o.aluguel);
    expect(d.financas.conta).toBeLessThan(antes);
    expect(d.biografia.some(e => /Saiu da casa da família/.test(e.texto) && e.relevancia === 'marco')).toBe(true);
    expect(vinculosVivos(d).filter(x => x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai').every(x => !x.vin.convivio.includes('casa'))).toBe(true);
  });

  it('dividir com um amigo: metade do aluguel', () => {
    const v = sozinha(24, 61);
    const amigo = criarPessoa(v, criarRng(4), { idade: 25, genero: 'masculino', municipioId: v.moradia.municipioId });
    // O amigo mais próximo (a vida sorteada pode ter outros amigos).
    vincular(v, amigo, { origem: 'trabalho', proximidade: 100, convivio: [] });
    v.vinculos[amigo.id].estagio = 'amigo_proximo';
    const o = ofertasDeImoveis(v, 'aluguel').find(x => x.quartos >= 2 && x.aluguel < 5000)!;
    const d = executar(v, { tipo: 'trocar_moradia', ofertaId: o.id, dividirCom: amigo.id }).vida;
    expect(d.moradia.divide).toBe(1);
    expect(orcamento(d).saidas.find(l => l.rotulo === 'Sua parte do aluguel')?.valor).toBe(-Math.round(o.aluguel / 2));
  });

  it('coabitação: o casal passa a morar junto e o arranjo muda', () => {
    const v = sozinha(28, 62);
    comParceria(v, 'morando_junto');
    expect(arranjoDaCasa(v)).toBe('juntos');
  });

  it('comprar financiado: entrada e custos saem na hora, a parcela cabe em 30% da renda, o financiamento fica preso ao imóvel', () => {
    const v = sozinha(32, 63);
    v.trabalho.atual!.salario = 9000;
    v.financas.conta = 150000;
    const o = imoveisParaVoce(v, 'venda').para[0].item;
    const c = condicoesImovel(v, o.preco, true, undefined, 30);
    expect(podeTentar(c.veredito)).toBe(true);
    const d = executar(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 }).vida;
    const div = d.financas.dividas.find(x => x.tipo === 'financiamento_imovel')!;
    expect(div.bemId).toBe(d.moradia.imovelId);
    expect(div.parcela).toBeLessThanOrEqual(orcamento(v).renda * 0.3 + 1);
    expect(d.financas.conta).toBeCloseTo(150000 - c.entrada - c.custos, -1);
    expect(d.moradia.tipo).toBe('propria');
  });

  it('a prestação amortiza com os anos; amortizar tudo quita e vira marco; vender quita o financiamento e volta para o aluguel', () => {
    const v = sozinha(32, 64);
    v.trabalho.atual!.salario = 9000;
    v.financas.conta = 150000;
    const o = imoveisParaVoce(v, 'venda').para[0].item;
    let d = executar(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 20 }).vida;
    const saldo0 = d.financas.dividas[0].saldo;
    d = structuredClone(d); d.financas.conta += 50000;
    processarDinheiro(d, criarRng(1), ANO_NORMAL);
    expect(d.financas.dividas[0].saldo).toBeLessThan(saldo0);
    const quitar = structuredClone(d); quitar.financas.conta = quitar.financas.dividas[0].saldo + 1000;
    const q = executar(quitar, { tipo: 'amortizar', dividaId: quitar.financas.dividas[0].id, valor: quitar.financas.dividas[0].saldo }).vida;
    expect(q.financas.dividas.length).toBe(0);
    expect(q.biografia.some(e => /Quitou o financiamento/.test(e.texto) && e.relevancia === 'marco')).toBe(true);
    const vend = executar(d, { tipo: 'vender_bem', bemId: d.moradia.imovelId! }).vida;
    expect(vend.financas.dividas.some(x => x.tipo === 'financiamento_imovel')).toBe(false);
    expect(vend.moradia.tipo).toBe('aluguel');
  });

  it('mudar de cidade com casa própria: a casa fica (dá para alugar), no destino começa-se de aluguel', () => {
    const v = sozinha(35, 65);
    v.financas.conta = 400000;
    const o = imoveisParaVoce(v, 'venda').para[0].item;
    let d = executar(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: true }).vida;
    const destino = d.moradia.municipioId === 'sao-paulo-sp' ? 'recife-pe' : 'sao-paulo-sp';
    d = executar(d, { tipo: 'mudar_cidade', municipioId: destino }).vida;
    expect(d.moradia.tipo).toBe('aluguel');
    expect(d.moradia.municipioId).toBe(destino);
    const casa = d.financas.bens.find(b => b.tipo === 'imovel')!;
    expect(casa.tipo === 'imovel' && casa.municipioId).not.toBe(destino);
    expect(tenta(d, { tipo: 'imovel', bemId: casa.id, oque: 'alugar' })).toBe(true);
  });

  it('voltar para a família quando os pais moram na cidade', () => {
    const v = sozinha(26, 66);
    const mae = vinculosVivos(v).find(x => x.vin.parentesco === 'mae');
    if (!mae) return;
    mae.p.municipioId = v.moradia.municipioId;
    const d = executar(v, { tipo: 'voltar_pais' }).vida;
    expect(d.moradia.tipo).toBe('pais');
  });

  it('quem tem bicho não aluga onde não aceita animal', () => {
    const v = sozinha(28, 67);
    adotarPet(v, criarRng(1), { especie: 'cachorro', nome: 'Thor', genero: 'masculino', idade: 3, porte: 'medio', jeito: 'calmo', historia: '' }, 'abrigo');
    const nao = ofertasDeImoveis(v, 'aluguel').find(o => !o.aceitaPet);
    if (nao) expect(disponibilidade(v, { tipo: 'trocar_moradia', ofertaId: nao.id }).motivo).toMatch(/animais/);
  });

  it('as ofertas mais plausíveis vêm primeiro (com motivo), poucas; o resto continua acessível', () => {
    const v = sozinha(24, 68);
    for (const modo of ['aluguel', 'venda'] as const) {
      const { para, resto } = imoveisParaVoce(v, modo);
      expect(para.length).toBeLessThanOrEqual(MAX_PRIMARIAS_MATERIAL.imoveis);
      expect(para.every(x => x.motivo.length > 3)).toBe(true);
      expect(para.length + resto.length).toBe(ofertasDeImoveis(v, modo).length);
    }
    // Uma pessoa sozinha de 24 anos não recebe casa de quatro quartos como primeira sugestão de aluguel.
    const top = imoveisParaVoce(v, 'aluguel').para[0];
    if (top) expect(top.item.quartos).toBeLessThanOrEqual(2);
  });

  it('a casa que ficou pequena para a família pesa na cabeça e aparece como causa', () => {
    const v = sozinha(34, 69);
    v.moradia.modeloId = 'kitnet';
    comParceria(v, 'casamento'); comFilho(v, 3); comFilho(v, 6); comFilho(v, 9);
    const d = executar(v, { tipo: 'estilo', valor: 'modesto' }).vida;
    expect(d).toBeTruthy();
    expect(fatoresCabeca(v).some(f => f.id === 'casa_pequena')).toBe(true);
  });
});

/* =========================================================== Patrimônio e dívida */

describe('patrimônio e obrigações', () => {
  it('financiamento em dia não é dívida problemática: não deixa "no vermelho" nem pesa como dívida', () => {
    const v = sozinha(32, 70);
    v.trabalho.atual!.salario = 9000;
    v.financas.conta = 150000;
    const o = imoveisParaVoce(v, 'venda').para[0].item;
    const d = executar(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 }).vida;
    expect(seguranca(d).nivel).not.toBe('no_vermelho');
    const b = balanco(d);
    expect(b.financiamentos).toBeGreaterThan(0);
    expect(b.cartao).toBe(0);
    expect(fatoresCabeca(d).some(f => f.id === 'dividas')).toBe(false);
  });

  it('atraso é gradual: primeiro a cobrança, a decisão; só depois de anos o banco retoma a casa', () => {
    const v = sozinha(35, 71);
    v.trabalho.atual!.salario = 9000;
    v.financas.conta = 150000;
    const o = imoveisParaVoce(v, 'venda').para[0].item;
    let d = executar(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 }).vida;
    d = structuredClone(d);
    d.trabalho.atual = undefined;
    d.financas.conta = 0; d.financas.investimentos = [];
    for (const vin of Object.values(d.vinculos)) vin.proximidade = 10; // ninguém cobre
    const r = criarRng(3);
    d.t += 12; processarDinheiro(d, r, ANO_NORMAL); processarObrigacoes(d);
    expect(d.financas.dividas.find(x => x.tipo === 'financiamento_imovel')?.atraso ?? 0).toBeGreaterThan(0);
    expect(d.financas.bens.some(b => b.tipo === 'imovel')).toBe(true);
    for (let k = 0; k < 4 && d.financas.bens.some(b => b.tipo === 'imovel'); k++) { d.t += 12; processarDinheiro(d, r, ANO_NORMAL); processarObrigacoes(d); }
    expect(d.financas.bens.some(b => b.tipo === 'imovel')).toBe(false);
    expect(d.biografia.some(e => /banco retomou/.test(e.texto))).toBe(true);
  });

  it('nenhuma dívida cresce sem limite em silêncio: 25 anos sem renda nenhuma e com dívidas, o saldo fica limitado', () => {
    const v = sozinha(30, 72);
    v.trabalho.atual = undefined;
    v.financas.conta = 0;
    v.financas.dividas.push({ id: 'e', tipo: 'emprestimo', saldo: 30000, jurosMes: 0.035, parcela: 1500, descricao: 'Empréstimo pessoal', tInicio: v.t, prazo: 36 });
    v.financas.dividas.push({ id: 'c', tipo: 'cartao', saldo: 8000, jurosMes: 0.045, parcela: 0, descricao: 'Cartão e cheque especial', tInicio: v.t });
    for (const vin of Object.values(v.vinculos)) vin.proximidade = 10;
    const r = criarRng(5);
    let maximo = 0;
    for (let k = 0; k < 25; k++) { v.t += 12; processarDinheiro(v, r, ANO_NORMAL); processarObrigacoes(v); maximo = Math.max(maximo, balanco(v).obrigacoes); }
    expect(maximo).toBeLessThan(300000);
    expect(v.biografia.some(e => /cobrança|cadastro de devedores|caducou/.test(e.texto))).toBe(true);
  });

  it('renegociar junta tudo o que está no rotativo e em cobrança num acordo só, e limpa o nome', () => {
    const v = sozinha(35, 73);
    v.financas.negativado = true;
    v.fatos['negativado_desde'] = v.t;
    v.financas.dividas.push({ id: 'c1', tipo: 'cartao', saldo: 4000, jurosMes: 0.045, parcela: 0, descricao: 'Cartão e cheque especial' });
    v.financas.dividas.push({ id: 'c2', tipo: 'cartao', saldo: 3000, jurosMes: 0.01, parcela: 0, descricao: 'Em cobrança: empréstimo pessoal' });
    const d = executar(v, { tipo: 'renegociar' }).vida;
    expect(d.financas.dividas.filter(x => x.tipo === 'cartao').length).toBe(0);
    expect(d.financas.dividas.filter(x => x.tipo === 'acordo').length).toBe(1);
    expect(d.financas.negativado).toBe(false);
  });

  it('empréstimo: limite pela renda, parcela que cabe; sem renda, não há', () => {
    const v = sozinha(35, 74);
    expect(tenta(v, { tipo: 'emprestimo', valor: 5000, meses: 24 })).toBe(true);
    expect(tenta(v, { tipo: 'emprestimo', valor: 5_000_000, meses: 24 })).toBe(false);
    const sem = structuredClone(v); sem.trabalho.atual = undefined;
    expect(disponibilidade(sem, { tipo: 'emprestimo', valor: 5000, meses: 24 }).motivo).toMatch(/renda/);
  });
});

/* ================================================================ Veículos */

describe('veículos', () => {
  it('comprar usado de um anúncio: história, idade e estado; zero financiado: financiamento preso ao carro', () => {
    const v = sozinha(30, 80);
    v.trabalho.licencas.push('cnh');
    v.financas.conta = 90000;
    const usado = ofertasDeVeiculos(v, 'usados')[0];
    let d = executar(v, { tipo: 'comprar_veiculo', ofertaId: usado.id, financiar: false }).vida;
    const b = d.financas.bens.find(x => x.tipo === 'veiculo')!;
    expect(b.tipo === 'veiculo' && b.usado).toBe(true);
    expect(b.tipo === 'veiculo' && (b.anoFabricacao ?? 9999) < Math.floor(v.t / 12)).toBe(true);
    expect(b.tipo === 'veiculo' && b.historia?.[0].texto).toMatch(/usado/);
    d = structuredClone(v); d.trabalho.atual!.salario = 12000;
    const zero = ofertasDeVeiculos(d, 'concessionaria')[0];
    d = executar(d, { tipo: 'comprar_veiculo', ofertaId: zero.id, financiar: true }).vida;
    const fin = d.financas.dividas.find(x => x.tipo === 'financiamento_veiculo');
    expect(fin?.bemId).toBe(d.financas.bens[0].id);
  });

  it('carro velho e mal cuidado dá problema; todo problema tem saída (consertar, adiar, parar ou vender)', () => {
    let problemas = 0;
    for (let s = 1; s <= 40; s++) {
      const v = sozinha(35, 81);
      v.financas.conta = 50000;
      comCarro(v, 12, 35);
      const r = criarRng(s);
      for (let k = 0; k < 3; k++) { v.t += 12; processarVeiculos(v, r); }
      const b = v.financas.bens[0];
      if (b.tipo !== 'veiculo' || !b.problema) continue;
      problemas++;
      const saidas = (['consertar', 'adiar', 'parar'] as AcaoVeiculo[]).filter(o => disponibilidadeVeiculo(v, b, o).ok);
      expect(saidas.length + (tenta(v, { tipo: 'vender_bem', bemId: b.id }) ? 1 : 0)).toBeGreaterThan(0);
      expect(disponibilidadeVeiculo(v, b, 'consertar').ok).toBe(true);
    }
    expect(problemas).toBeGreaterThan(20);
  });

  it('consertar paga e melhora; adiar deixa o conserto crescer; parado não custa uso e não dá condução', () => {
    const v = sozinha(35, 82);
    v.financas.conta = 50000;
    const id = comCarro(v, 10, 45);
    const b = v.financas.bens[0];
    if (b.tipo !== 'veiculo') throw new Error();
    b.problema = { id: 'p', texto: 'a embreagem patinando', custo: 2500, desde: v.t - 12, gravidade: 2, adiado: 0 };
    const cons = executar(v, { tipo: 'veiculo', bemId: id, oque: 'consertar' }).vida;
    expect(cons.financas.bens[0].tipo === 'veiculo' && cons.financas.bens[0].problema).toBeFalsy();
    expect(cons.financas.conta).toBe(47500);
    const adiado = executar(v, { tipo: 'veiculo', bemId: id, oque: 'adiar' }).vida;
    processarVeiculos(adiado, criarRng(1));
    const p = adiado.financas.bens[0].tipo === 'veiculo' ? adiado.financas.bens[0].problema : undefined;
    expect(p && p.custo).toBeGreaterThan(2500);
    const parado = executar(v, { tipo: 'veiculo', bemId: id, oque: 'parar' }).vida;
    expect(orcamento(parado).saidas.some(l => /combustível/.test(l.rotulo))).toBe(false);
    expect(veiculoUtil(parado.financas.bens[0] as never)).toBe(false);
    expect(semana(parado).ganhos.some(g => g.id === 'conducao')).toBe(false);
  });

  it('o carro entra no orçamento e tira o ônibus; bicicleta não "quebra de vez" nem custa mais que ela', () => {
    const v = sozinha(30, 83);
    const antes = orcamento(v).saidas.some(l => /ônibus/i.test(l.rotulo));
    comCarro(v, 3, 80);
    v.trabalho.licencas.push('cnh'); // FIX #4: sem carteira, o carro não leva ninguém ao trabalho
    expect(antes).toBe(true);
    expect(orcamento(v).saidas.some(l => /ônibus/i.test(l.rotulo))).toBe(false);
    expect(orcamento(v).saidas.some(l => /combustível/.test(l.rotulo))).toBe(true);
    const bici = sozinha(30, 84);
    bici.financas.bens.push({ id: 'b', tipo: 'veiculo', modeloId: 'bike', nome: 'bicicleta', valor: 500, tCompra: bici.t, estado: 30, anoFabricacao: Math.floor(bici.t / 12) - 8, usado: true, problema: { id: 'x', texto: 'corrente e pneus', custo: 300, desde: bici.t - 24, gravidade: 2, adiado: 3 } });
    for (let k = 0; k < 6; k++) { bici.t += 12; processarVeiculos(bici, criarRng(k)); }
    const pb = bici.financas.bens[0].tipo === 'veiculo' ? bici.financas.bens[0].problema! : undefined;
    expect(pb!.gravidade).toBeLessThan(3);
    expect(pb!.custo).toBeLessThanOrEqual(1200 * 0.45 + 10);
  });

  it('as ofertas de veículo aparecem por lugar, poucas primeiro e com motivo', () => {
    const v = sozinha(30, 85);
    v.trabalho.licencas.push('cnh');
    for (const lugar of ['concessionaria', 'usados', 'motos'] as const) {
      const { para, resto } = veiculosParaVoce(v, lugar);
      expect(para.length).toBeLessThanOrEqual(MAX_PRIMARIAS_MATERIAL.veiculos);
      expect(para.length + resto.length).toBe(ofertasDeVeiculos(v, lugar).length);
    }
  });
});

/* =========================================================== Investimentos */

describe('investimentos', () => {
  it('aporte e retirada: sai da conta, volta para a conta; resgatar com perda realiza a perda (base de custo cai junto)', () => {
    const v = sozinha(35, 90);
    v.financas.conta = 50000;
    const a = aplicar(v, 'acoes', 20000);
    expect(v.financas.conta).toBe(30000);
    a.valor = 15000; // caiu
    resgatar(v, a.id, 7500);
    expect(v.financas.conta).toBe(37500);
    expect(v.financas.investimentos[0].aportado).toBe(10000);
    expect(v.financas.investimentos[0].valor).toBe(7500);
  });

  it('valoriza e perde de verdade: em 40 anos, ações têm anos de alta e anos de queda; renda fixa quase nunca cai', () => {
    const e = economiaInicial(4242, 2026 * 12);
    let quedasAcoes = 0; let altasAcoes = 0; let quedasPos = 0;
    for (let k = 1; k <= 40; k++) {
      const ec = avancarEconomia(e, (2026 + k) * 12);
      const r = retornos(ec, e.semente, 2026 + k);
      if (r.preco.acoes < 0) quedasAcoes++; else altasAcoes++;
      if (r.preco.pos_fixado < 0) quedasPos++;
    }
    expect(quedasAcoes).toBeGreaterThan(3);
    expect(altasAcoes).toBeGreaterThan(quedasAcoes);
    expect(quedasPos).toBe(0);
  });

  it('renda só onde existe: ações e fundos de imóveis pagam; reserva e renda fixa não pagam nada na conta', () => {
    const v = sozinha(35, 91);
    v.financas.conta = 400000;
    for (const p of ['reserva', 'pos_fixado', 'acoes', 'imobiliario'] as const) aplicar(v, p, 100000);
    processarInvestimentos(v, ANO_NORMAL);
    const por = (p: string) => v.financas.investimentos.find(a => a.produto === p)!;
    expect(por('reserva').rendaAno).toBeUndefined();
    expect(por('pos_fixado').rendaAno).toBeUndefined();
    expect(por('acoes').rendaAno).toBeGreaterThan(0);
    expect(por('imobiliario').rendaAno).toBeGreaterThan(0);
  });

  it('risco diferente: a bolsa oscila muito mais que a renda fixa; nenhum rendimento é fixo', () => {
    const ret: Record<string, number[]> = { acoes: [], pos_fixado: [] };
    for (let s = 1; s <= 30; s++) {
      const e = economiaInicial(s * 13, 2026 * 12);
      for (let k = 1; k <= 30; k++) { const ec = avancarEconomia(e, (2026 + k) * 12); const r = retornos(ec, e.semente, 2026 + k); ret.acoes.push(r.preco.acoes); ret.pos_fixado.push(r.preco.pos_fixado); }
    }
    const dp = (x: number[]) => { const m = x.reduce((a, b) => a + b, 0) / x.length; return Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / x.length); };
    expect(dp(ret.acoes)).toBeGreaterThan(dp(ret.pos_fixado) * 5);
    expect(new Set(ret.pos_fixado.map(x => Math.round(x * 1000))).size).toBeGreaterThan(10);
  });

  it('nenhuma estratégia trivialmente dominante: em janelas de 10 anos, ações nem sempre vencem a renda fixa', () => {
    let vence = 0; let janelas = 0;
    for (let s = 1; s <= 150; s++) {
      const e = economiaInicial(s * 31, 2026 * 12);
      let a = 1; let p = 1;
      for (let k = 1; k <= 10; k++) { const ec = avancarEconomia(e, (2026 + k) * 12); const r = retornos(ec, e.semente, 2026 + k); a *= 1 + r.preco.acoes + (r.renda.acoes ?? 0); p *= 1 + r.preco.pos_fixado; }
      janelas++; if (a > p) vence++;
    }
    expect(vence / janelas).toBeGreaterThan(0.4);
    expect(vence / janelas).toBeLessThan(0.85);
  });

  it('determinismo por semente: a mesma economia dá os mesmos rendimentos; outra semente, outros', () => {
    const r1 = retornos({ ...ANO_NORMAL, bolsa: 0.1 }, 7, 2040);
    const r2 = retornos({ ...ANO_NORMAL, bolsa: 0.1 }, 7, 2040);
    const r3 = retornos({ ...ANO_NORMAL, bolsa: 0.1 }, 8, 2040);
    expect(r1).toEqual(r2);
    expect(r1.preco.acoes).not.toBe(r3.preco.acoes);
  });

  it('o banco sugere pelo momento: sem reserva, primeiro a reserva; nunca "sempre ações"', () => {
    const v = sozinha(30, 92);
    v.financas.conta = 1000;
    expect(investimentosParaVoce(v)[0].item.id).toBe('reserva');
    const rico = sozinha(30, 93);
    rico.financas.conta = 0; rico.financas.conta = 200000; aplicar(rico, 'reserva', 200000);
    const s = investimentosParaVoce(rico).map(x => x.item.id);
    expect(s.length).toBeLessThanOrEqual(MAX_PRIMARIAS_MATERIAL.investimentos);
    expect(s[0]).not.toBe('acao_unica');
    expect(PRODUTOS.every(p => p.liquidez && p.riscoTexto)).toBe(true);
  });
});

/* ===================================================================== Pets */

describe('animais de estimação', () => {
  it('adotar no abrigo: nome, espécie, idade, jeito, vínculo, tutor — e a chegada na biografia', () => {
    const v = sozinha(28, 100);
    const a = animaisDoAbrigo(v)[0];
    const d = executar(v, { tipo: 'adotar_pet', animalId: a.id }).vida;
    const pet = Object.values(d.pessoas).find(p => p.especie && p.nome === a.nome)!;
    expect(pet.pet?.tutor).toBe('eu');
    expect(pet.pet?.origem).toBe('abrigo');
    expect(idadePessoa(d, pet)).toBe(a.idade);
    expect(d.vinculos[pet.id].parentesco).toBe('pet');
    expect(d.biografia.some(e => e.texto.startsWith(`${a.nome} chegou`))).toBe(true);
  });

  it('o bicho custa todo mês e o cachorro pede tempo na semana', () => {
    const v = sozinha(28, 101);
    const antes = orcamento(v).despesa;
    adotarPet(v, criarRng(1), { especie: 'cachorro', nome: 'Thor', genero: 'masculino', idade: 2, porte: 'grande', jeito: 'calmo', historia: '' }, 'abrigo');
    expect(orcamento(v).despesa).toBeGreaterThan(antes);
    expect(custoDosPets(v, 1)).toBeGreaterThan(0);
    expect(semana(v).fixos.some(f => f.id === 'pets')).toBe(true);
  });

  it('bicho doente sempre tem o que fazer; o tratamento custa e o prognóstico é incerto', () => {
    const v = sozinha(28, 102);
    v.financas.conta = 20000;
    const pet = adotarPet(v, criarRng(1), { especie: 'gato', nome: 'Mia', genero: 'feminino', idade: 10, porte: 'pequeno', jeito: 'tímida', historia: '' }, 'abrigo');
    pet.pet!.doenca = { nome: 'um tumor', desde: v.t, gravidade: 3, tratavel: true, tratando: false };
    const saidas = (['tratar', 'basico', 'paliativo'] as const).filter(o => disponibilidadeVeterinario(v, pet, o).ok);
    expect(saidas.length).toBeGreaterThanOrEqual(2);
    let curou = 0;
    for (let s = 0; s < 30; s++) {
      const c = structuredClone(v); c.rng = s * 97 + 1;
      const d = executar(c, { tipo: 'veterinario', petId: pet.id, opcao: 'tratar' }).vida;
      expect(d.financas.conta).toBeLessThan(20000);
      if (!d.pessoas[pet.id].pet!.doenca) curou++;
    }
    expect(curou).toBeGreaterThan(5);
    expect(curou).toBeLessThan(28);
  });

  it('envelhece e morre antes da gente; a perda pesa na medida do vínculo — nunca como a de um filho', () => {
    const v = sozinha(28, 103);
    const pet = adotarPet(v, criarRng(1), { especie: 'cachorro', nome: 'Bidu', genero: 'masculino', idade: 1, porte: 'medio', jeito: 'agitado', historia: '' }, 'abrigo');
    let d = v;
    for (let k = 0; k < 20 && d.pessoas[pet.id].vivo && !d.morte; k++) { d = avancarAno(d).vida; if (d.momento) d = responder(d); }
    expect(d.pessoas[pet.id].vivo).toBe(false);
    expect(Math.floor((d.pessoas[pet.id].tMorte! - d.pessoas[pet.id].tNasc) / 12)).toBeLessThanOrEqual(pet.pet!.vidaMax + 1);
    expect(d.biografia.some(e => e.texto.includes('Bidu morreu') && /juntos/.test(e.texto))).toBe(true);
    const luto = d.luto.find(l => l.pessoaId === pet.id);
    if (luto) expect(luto.peso).toBeLessThanOrEqual(50);
    expect(importancia(d, d.pessoas[pet.id], d.vinculos[pet.id])).toBeLessThanOrEqual(50);
  });

  it('pet e família: as crianças lembram da chegada; o bicho da casa dos pais fica com eles, e dá para trazê-lo depois', () => {
    const v = sozinha(34, 104);
    const f = comFilho(v, 6);
    adotarPet(v, criarRng(1), { especie: 'gato', nome: 'Tom', genero: 'masculino', idade: 0, porte: 'pequeno', jeito: 'curioso', historia: '' }, 'abrigo');
    expect(v.vinculos[f.id].historia.some(h => /Tom/.test(h.texto))).toBe(true);
    const crianca = viverAte(nova({ semente: 3 }), 8);
    const bicho = vinculosVivos(crianca).find(x => x.p.especie);
    if (bicho) expect(bicho.p.pet?.tutor).toBe('familia');
  });

  it('processar os bichos não mexe no acaso do resto da vida', () => {
    const v = sozinha(30, 105);
    adotarPet(v, criarRng(1), { especie: 'gato', nome: 'Nala', genero: 'feminino', idade: 4, porte: 'pequeno', jeito: 'calma', historia: '' }, 'abrigo');
    const r1 = criarRng(99); const r2 = criarRng(99);
    processarPets(structuredClone(v), r1);
    expect(r1.next()).toBe(r2.next());
  });
});

/* =========================================================== Família e dinheiro */

describe('casal, separação, herança, apoio entre gerações', () => {
  it('separação de quem construiu junto: metade vai para o outro lado; o aluguel que não cabe numa renda muda a casa', () => {
    const v = sozinha(35, 110);
    v.moradia.aluguel = 3500;
    const p = comParceria(v, 'casamento', 6000);
    v.financas.conta = 0;
    v.financas.conta = 200000; aplicar(v, 'pos_fixado', 200000);
    expect(construidoJunto(v, p)).toBeGreaterThan(150000);
    terminar(v, p, v.vinculos[p.id], 'jogador');
    expect(balanco(v).liquido).toBeLessThan(130000);
    expect(v.biografia.some(e => /A separação dividiu também a vida material/.test(e.texto))).toBe(true);
    expect(orcamento(v).entradas.some(l => l.de === 'parceria')).toBe(false);
  });

  it('herança: as dívidas não passam; o cônjuge fica com a metade do que construíram e divide o resto com os filhos', () => {
    const v = sozinha(60, 111);
    const p = comParceria(v, 'casamento');
    const f = comFilho(v, 30);
    comecarVidaEmComum(v, p);
    v.fatos[`patrimonio_uniao_${p.id}`] = 0;
    v.financas.conta = 300000;
    const h = calcularHeranca(v);
    expect(h.liquido).toBe(300000);
    const doConjuge = h.partes.filter(x => x.pessoaId === p.id).reduce((s, x) => s + x.valor, 0);
    const doFilho = h.partes.filter(x => x.pessoaId === f.id).reduce((s, x) => s + x.valor, 0);
    expect(doConjuge).toBeGreaterThan(doFilho);
    expect(doConjuge + doFilho).toBeCloseTo(300000, -2);
    const devedor = sozinha(60, 112);
    devedor.financas.conta = 0;
    devedor.financas.dividas.push({ id: 'c', tipo: 'cartao', saldo: 50000, jurosMes: 0.01, parcela: 0, descricao: 'Cartão' });
    expect(calcularHeranca(devedor).liquido).toBe(0);
  });

  it('quando falta, a família às vezes cobre — depende de poder e de querer (relação boa ajuda; relação ruim, não)', () => {
    const contar = (prox: number, tensao: number) => {
      let ajudou = 0;
      for (let s = 0; s < 20; s++) {
        const v = sozinha(25, 113);
        const mae = vinculosVivos(v).find(x => x.vin.parentesco === 'mae');
        if (!mae) return -1;
        for (const x of vinculosVivos(v)) if (x.p.id !== mae.p.id) x.vin.proximidade = 5;
        mae.p.renda = 6000; mae.vin.proximidade = prox; mae.vin.tensao = tensao; mae.vin.confianca = prox;
        mae.p.tNasc = v.t - 55 * 12;
        v.trabalho.atual = undefined;
        v.financas.conta = 0;
        const antes = v.fatos['ajudas_recebidas'] ?? 0;
        processarDinheiro(v, criarRng(s + 1), ANO_NORMAL);
        if ((v.fatos['ajudas_recebidas'] ?? 0) > antes) ajudou++;
      }
      return ajudou;
    };
    const boa = contar(90, 0);
    if (boa < 0) return;
    expect(boa).toBeGreaterThanOrEqual(8);
    expect(contar(20, 70)).toBe(0);
  });
});

/* ================================================================ Negócio */

describe('negócio na vida material', () => {
  it('movimento fraco tira do bolso; fechar devolve parte do capital; o lucro tem teto', () => {
    const v = sozinha(35, 120);
    v.financas.conta = 60000;
    v.trabalho.experiencia['comercio'] = 60;
    const n = abrirNegocio(v, criarRng(1), 'comercio');
    expect(v.financas.conta).toBeLessThan(60000);
    v.trabalho.atual!.clientela = 5;
    const antes = v.financas.conta;
    processarNegocio(v);
    expect(v.caminhos.negocio!.resultadoAno!).toBeLessThan(0);
    expect(v.financas.conta).toBeLessThan(antes);
    const c = v.financas.conta;
    fecharNegocio(v, 'o movimento não pagou as contas');
    expect(v.financas.conta).toBeGreaterThan(c);
    expect(v.financas.conta - c).toBeLessThan(n.capital * 0.3);
  });
});

/* ============================================================ Trabalho e renda */

describe('renda com teto: o bug do milionário por aumento', () => {
  it('servidor não negocia salário; pedir aumento todo ano não passa do que o cargo paga', () => {
    const v = sozinha(30, 130);
    v.trabalho.atual = undefined;
    contratar(v, criarRng(1), ocupacao('auditor_fiscal'));
    expect(tenta(v, { tipo: 'pedir_aumento' })).toBe(false);
    let w = sozinha(30, 131);
    w.trabalho.atual = undefined;
    contratar(w, criarRng(1), ocupacao('vendedor'));
    const inicial = w.trabalho.atual!.salario;
    for (let k = 0; k < 25 && !w.morte; k++) {
      w.anoAtual = { acoes: [] };
      w.trabalho.atual!.tInicio = w.t - 24;
      if (tenta(w, { tipo: 'pedir_aumento' })) { w = executar(w, { tipo: 'pedir_aumento' }).vida; if (w.momento) w = responder(w); }
      w = avancarAno(w).vida; if (w.momento) w = responder(w);
      if (w.trabalho.atual?.ocupacaoId !== 'vendedor') break;
    }
    if (w.trabalho.atual?.ocupacaoId === 'vendedor') expect(w.trabalho.atual.salario).toBeLessThan(inicial * 2);
  });
});

/* ===================================================================== Save */

describe('save v10', () => {
  it('saves v9 reais migram para v10: reserva e ações viram aplicações, valores preservados, a vida continua 5 anos e volta a ler', () => {
    expect(VERSAO_SAVE).toBe(13);
    for (const nome of ['save-v9-adolescente-pet.json', 'save-v9-jovem-carro.json', 'save-v9-familia-financiada.json', 'save-v9-endividado.json', 'save-v9-aposentada-acoes.json']) {
      const antes = JSON.parse(fixture(nome));
      const r = interpretar(fixture(nome));
      expect(r.tipo, nome).toBe('ok');
      if (r.tipo !== 'ok') continue;
      const v = r.vida;
      expect(v.versao).toBe(VERSAO_SAVE);
      expect(r.migrado).toBe(true);
      expect(v.financas.conta).toBe(antes.financas.conta);
      const aplicado = v.financas.investimentos.reduce((s, a) => s + a.valor, 0);
      expect(Math.abs(aplicado - Math.round(antes.financas.reserva) - Math.round(antes.financas.acoes))).toBeLessThanOrEqual(2);
      expect(v.financas.bens.length).toBe(antes.financas.bens.length);
      expect(v.financas.dividas.length).toBe(antes.financas.dividas.length);
      expect(v.economia.fase).toBeTruthy();
      for (const p of Object.values(v.pessoas)) if (p.especie) expect(p.pet?.vidaMax).toBeGreaterThan(idadePessoa(v, p));
      let w = v;
      if (w.momento) w = responder(w);
      for (let k = 0; k < 5 && !w.morte; k++) { w = avancarAno(w).vida; if (w.momento) w = responder(w); }
      const volta = interpretar(JSON.stringify(w));
      expect(volta.tipo, nome).toBe('ok');
    }
  });

  it('v8, v7, v6 e v5 reais atravessam a cadeia inteira até v10', () => {
    for (const nome of ['save-v8-adulta.json', 'save-v8-meia-idade.json', 'save-v7-adulto-familia.json', 'save-v6-familia.json', 'save-v5-adulta.json']) {
      const r = interpretar(fixture(nome));
      expect(r.tipo, nome).toBe('ok');
      if (r.tipo === 'ok') {
        expect(r.vida.versao).toBe(VERSAO_SAVE);
        expect(Array.isArray(r.vida.financas.investimentos)).toBe(true);
        let w = r.vida; if (w.momento) w = responder(w);
        w = avancarAno(w).vida;
        expect(w.financas.historico.length).toBeGreaterThan(0);
      }
    }
  });

  it('finanças corrompidas são recusadas (não invalidam em silêncio)', () => {
    const v = viverAte(nova({ semente: 8 }), 30);
    const ruim = structuredClone(v) as unknown as { financas: { investimentos: { valor: number }[] } };
    ruim.financas.investimentos = [{ valor: Number.NaN } as never];
    expect(interpretar(JSON.stringify(ruim)).tipo).toBe('invalido');
    const semEconomia = structuredClone(v) as unknown as Record<string, unknown>;
    delete semEconomia.economia;
    expect(interpretar(JSON.stringify(semEconomia)).tipo).toBe('invalido');
  });

  it('ida e volta preserva a vida material (bens com história, aplicações, pet, economia)', () => {
    const v = sozinha(35, 140);
    v.financas.conta = 90000;
    comCarro(v);
    aplicar(v, 'acoes', 30000);
    adotarPet(v, criarRng(1), { especie: 'gato', nome: 'Jade', genero: 'feminino', idade: 2, porte: 'pequeno', jeito: 'calma', historia: '' }, 'abrigo');
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida).toEqual(v);
  });
});

/* ============================================================== Desempenho */

describe('desempenho', () => {
  it('uma vida inteira continua rápida de simular', () => {
    const t0 = Date.now();
    const v = viver(nova({ semente: 555 }), 100);
    expect(v.morte || idade(v) >= 99).toBeTruthy();
    expect(Date.now() - t0).toBeLessThan(6000);
    void parceiro; void animaisParaVoce;
  });
});
