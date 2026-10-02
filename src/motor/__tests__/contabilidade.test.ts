/**
 * Contabilidade (A1, playtest: "dinheiro desaparecendo"): R$ 40 mil entrando
 * por mês, R$ 26 mil saindo, nenhuma dívida, aplicações rendendo — e "Na
 * conta" parada em R$ 0 ano após ano.
 *
 * As causas (ver o relatório "economia"):
 *   1. o circuito do tenista saía da conta no ano do esporte, fora do
 *      orçamento: a tela mostrava a premiação entrando e uma sobra que não
 *      existia; o fechamento cobria o buraco com as aplicações, sem dizer por quê;
 *   2. o "efeito riqueza" saía só no fechamento, fora do mês, e podia levar a
 *      conta inteira + a sobra do ano;
 *   3. a ajuda da família no ano que fechava no vermelho caía na conta DEPOIS
 *      de o vermelho ter sido zerado (o mesmo buraco coberto duas vezes).
 *
 * A regra agora: saldo inicial + linhas = saldo final, na conta e nas
 * aplicações, todo ano (`sistemas/extrato`). O fechamento confere o próprio
 * trabalho — e nenhum ano pode ter linha de 'ajuste'.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { responderTudo } from './ajuda';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { transacao, idade } from '../nucleo';
import { criarRng } from '../rng';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { gastoDoPatrimonio, orcamento, processarDinheiro } from '../sistemas/dinheiro';
import { aplicar, depositar, rendaDasAplicacoes, totalAplicado } from '../sistemas/investimentos';
import { conciliar, extratoAberto, fecharExtrato, lancar, pendente, somasDoExtrato } from '../sistemas/extrato';
import { garantirFrente } from '../sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../sistemas/esporte';
import { custosDoTrabalho } from '../sistemas/carreira';
import type { AnoEconomico } from '../sistemas/economia';
import type { ExtratoDoAno, Vida } from '../tipos';

/** Um ano de economia sem surpresa (para os testes que olham o fechamento sozinho). */
const ANO: AnoEconomico = { fase: 'normal', inflacao: 0.045, juroReal: 0.05, bolsa: 0.04, imoveis: 0.01, deltaJuro: 0, virou: false };

let base: Vida | undefined;
/** Adulto de 35, morando sozinho, com carteira assinada de R$ 46 mil brutos (uns R$ 40 mil líquidos, média do mês). */
function bemPago(o: { aplicado?: number; estilo?: Vida['financas']['estilo']; salario?: number } = {}): Vida {
  base ??= adulto(35, { semente: 23, municipioId: 'sao-paulo-sp' });
  return transacao(structuredClone(base), x => {
    x.financas.dividas = []; x.financas.investimentos = []; x.financas.bens = x.financas.bens.filter(b => b.tipo !== 'imovel' || x.moradia.imovelId === b.id);
    x.financas.estilo = o.estilo ?? 'modesto';
    x.educacao.matricula = undefined;
    contratar(x, criarRng(3), ocupacao('assistente_adm'));
    x.trabalho.atual!.salario = o.salario ?? 46000;
    x.financas.conta = 0;
    if (o.aplicado) depositar(x, 'pos_fixado', o.aplicado);
    x.financas.extratoAberto = undefined;
    x.momento = null;
  }).vida;
}

/** Um ano de fechamento isolado (sem o resto do ano): o extrato deve explicar cada real. */
function fecharUmAno(v: Vida, ec = ANO): Vida {
  return transacao(v, (x, r) => { x.t += 12; processarDinheiro(x, r, ec); fecharExtrato(x); }).vida;
}

const linha = (e: ExtratoDoAno, rotulo: RegExp) => e.linhas.filter(l => rotulo.test(l.rotulo)).reduce((s, l) => s + l.conta, 0);

/* ================================================================ O livro */

describe('o extrato: saldo inicial + linhas = saldo final', () => {
  it('conciliar é puro: bate quando bate, acusa quando não bate', () => {
    const e: ExtratoDoAno = { tInicio: 0, tFim: 12, contaInicial: 1000, aplicadoInicial: 5000, contaFinal: 1500, aplicadoFinal: 5200, linhas: [
      { rotulo: 'Salário', tipo: 'renda', conta: 3000, aplicado: 0 },
      { rotulo: 'Mercado', tipo: 'despesa', conta: -2300, aplicado: 0 },
      { rotulo: 'Posto nas aplicações', tipo: 'aporte', conta: -200, aplicado: 200 }
    ] };
    expect(conciliar(e).ok).toBe(true);
    expect(conciliar({ ...e, contaFinal: 1400 }).ok).toBe(false);
    expect(conciliar({ ...e, contaFinal: 1400 }).diferencaConta).toBe(100);
    expect(conciliar({ ...e, linhas: [...e.linhas, { rotulo: 'x', tipo: 'ajuste', conta: 0.5, aplicado: 0 }] }).ok).toBe(false);
  });

  it('o que mexe sem lançar fica pendente e ganha nome na conferência; aporte é −conta e +aplicado', () => {
    const v = bemPago();
    const x = transacao(v, xv => {
      extratoAberto(xv);
      xv.financas.conta += 5000; // um cachê que ninguém lançou
      expect(pendente(xv).conta).toBe(5000);
      lancar(xv, 'Cachê', 'acontecimento', 0); // linha vazia não entra
      aplicar(xv, 'reserva', 2000);
      expect(pendente(xv)).toEqual({ conta: 3000, aplicado: 2000 });
      fecharExtrato(xv);
    }).vida;
    expect(conciliar(x.financas.extrato!).ok).toBe(true);
    expect(x.financas.extratoAberto!.contaInicial).toBe(x.financas.conta);
  });
});

/* ================================================== O fechamento do ano */

describe('o fechamento do ano explica cada real (nenhuma linha de ajuste)', () => {
  it('renda maior que a despesa: a conta cresce o que o mês diz que sobra, menos a inflação do dinheiro parado', () => {
    let v = bemPago();
    const o = orcamento(v);
    expect(o.renda).toBeGreaterThan(30000);
    expect(o.sobra).toBeGreaterThan(5000);
    for (let k = 0; k < 6; k++) {
      const antes = v.financas.conta;
      const sobraDoAno = orcamento(v).sobra * 12;
      v = fecharUmAno(v);
      const e = v.financas.extrato!;
      expect(conciliar(e)).toMatchObject({ ok: true, diferencaConta: 0, diferencaAplicado: 0 });
      const inflacao = -linha(e, /inflação/);
      expect(Math.round(v.financas.conta - antes)).toBe(Math.round(sobraDoAno - inflacao));
    }
    expect(v.financas.conta).toBeGreaterThan(orcamento(v).sobra * 12 * 4);
  });

  it('o cenário do playtest: ~R$ 40 mil entram, ~R$ 26 mil saem, aplicações altas — a conta NÃO fica em zero', () => {
    // Com R$ 12 milhões aplicados, o antigo "efeito riqueza" do fechamento levava a conta inteira + a sobra do ano.
    let v = bemPago({ aplicado: 12_000_000, estilo: 'modesto' });
    const o = orcamento(v);
    expect(o.renda).toBeGreaterThan(30000);
    expect(o.sobra).toBeGreaterThan(0);
    const viagens = o.saidas.find(l => /patrimônio permite/.test(l.rotulo));
    // O gasto do patrimônio é linha do mês, à vista — e nunca leva mais que metade do que sobraria.
    expect(viagens).toBeDefined();
    expect(-viagens!.valor).toBeLessThanOrEqual(o.sobra + 1);
    for (let k = 0; k < 5; k++) {
      const antes = v.financas.conta;
      v = fecharUmAno(v);
      const e = v.financas.extrato!;
      expect(conciliar(e).ok).toBe(true);
      expect(v.financas.conta).toBeGreaterThan(antes);
      // Os dividendos entram, a valorização fica nas aplicações; nada sai delas sem linha.
      expect(somasDoExtrato(e).resgate).toBeUndefined();
    }
    expect(v.financas.conta).toBeGreaterThan(100000);
  });

  it('gastoDoPatrimonio: zero abaixo do limiar, e no máximo metade da sobra', () => {
    const v = bemPago({ aplicado: 50_000_000 });
    expect(gastoDoPatrimonio(v, 20000, 10000)).toBe(5000);
    expect(gastoDoPatrimonio(v, 20000, -100)).toBe(0);
    expect(gastoDoPatrimonio(bemPago(), 20000, 10000)).toBe(0);
  });

  it('ano no vermelho: aplicações, família, cartão e atraso — cada um na sua linha; a ajuda tapa o buraco e não vira dinheiro novo', () => {
    for (let s = 1; s <= 30; s++) {
      const v = transacao(bemPago({ aplicado: 3000 }), x => { x.trabalho.atual = undefined; x.financas.conta = -25000; x.rng = s * 7919; }).vida;
      const x = fecharUmAno(v);
      const e = x.financas.extrato!;
      expect(conciliar(e).ok).toBe(true);
      // Depois de coberto, a conta fecha em zero (nunca acima: o que cobriu, cobriu o buraco).
      expect(x.financas.conta).toBe(0);
      expect(linha(e, /aplicações para cobrir/)).toBeGreaterThan(0);
      // O vermelho do ano (o de antes + o mês a mês que não fechou) é exatamente o que as coberturas somam.
      const coberto = e.linhas.filter(l => ['resgate', 'familia', 'divida'].includes(l.tipo)).reduce((t, l) => t + l.conta, 0);
      const doAno = e.linhas.filter(l => !['resgate', 'familia', 'divida'].includes(l.tipo)).reduce((t, l) => t + l.conta, 0);
      expect(Math.round(coberto)).toBe(Math.round(-(e.contaInicial + doAno)));
    }
  });
});

/* ================================================== O tenista (A1) */

describe('A1 · o circuito do tenista é despesa do mês, à vista', () => {
  function tenista(): Vida {
    return transacao(adulto(20, { semente: 31, genero: 'masculino', municipioId: 'campina-grande-pb' }), x => {
      garantirFrente(x, 'tenis');
      Object.assign(x.caminhos.frentes.tenis!, { habilidade: 95, interesse: 90, meses: 140, auge: 95 });
      x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
      entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis');
      profissionalizar(x, criarRng(1), 4);
      x.momento = null; x.caminhos.pendente = undefined;
      x.financas.conta = 0;
      depositar(x, 'pos_fixado', 300000); depositar(x, 'acoes', 200000);
    }).vida;
  }

  it('a premiação entra e o circuito sai no mesmo orçamento: a tela não promete uma sobra que não existe', () => {
    let v = responderTudo(avancarAno(tenista()).vida);
    const custos = custosDoTrabalho(v).find(l => /Circuito/.test(l.rotulo));
    expect(custos).toBeDefined();
    const o = orcamento(v);
    expect(o.saidas.some(l => /Circuito/.test(l.rotulo))).toBe(true);
    // O ano fechado tem a linha do circuito (antes: sumia da conta sem linha nenhuma).
    const e = v.financas.extrato!;
    expect(conciliar(e).ok).toBe(true);
    expect(linha(e, /Circuito/)).toBeLessThan(-100000);
    // Se a conta fechou em zero, foi porque o mês não fechou — e o resgate está dito.
    if (v.financas.conta <= 0) {
      expect(o.sobra).toBeLessThan(0);
      expect(linha(e, /aplicações para cobrir/)).toBeGreaterThan(0);
    }
    // E os "acontecimentos" do ano não escondem o circuito: o que sobrou neles é pequeno perto do custo.
    expect(Math.abs(linha(e, /^Acontecimentos do ano/))).toBeLessThan(-linha(e, /Circuito/) / 2);
    v = responderTudo(avancarAno(v).vida);
    expect(conciliar(v.financas.extrato!).ok).toBe(true);
  });
});

/* ======================================= Vidas inteiras, muitos anos */

describe('vidas de muitos anos: todo ano concilia, nenhum real some', () => {
  it('três vidas com renda maior que a despesa, aplicando parte da sobra, por 20 anos', () => {
    for (const [semente, aplicado] of [[1, 0], [2, 200_000], [3, 2_000_000]] as const) {
      let v = transacao(bemPago({ aplicado, salario: 30000 + semente * 6000 }), x => { x.rng = semente * 104729; }).vida;
      let anosComSobra = 0;
      let anos = 0;
      let financeiroInicial = Math.max(0, v.financas.conta) + totalAplicado(v);
      for (let k = 0; k < 20 && !v.morte && idade(v) < 80; k++) {
        // O jogador põe metade do que está na conta nas aplicações, de vez em quando.
        if (k % 3 === 1 && v.financas.conta > 20000) v = responderTudo(executar(v, { tipo: 'investir', destino: 'pos_fixado', valor: Math.round(v.financas.conta / 2) }).vida);
        const sobra = orcamento(v).sobra;
        v = responderTudo(avancarAno(v).vida);
        const e = v.financas.extrato!;
        const c = conciliar(e);
        expect(c.ajustes, `vida ${semente}, ano ${k}: ${JSON.stringify(c.ajustes)}`).toEqual([]);
        expect(c.ok).toBe(true);
        if (sobra > 0) anosComSobra++;
        anos++;
      }
      expect(anos).toBe(20);
      // Quem sobrou dinheiro na maior parte dos anos termina com mais do que começou (conta + aplicações).
      const financeiroFinal = Math.max(0, v.financas.conta) + totalAplicado(v);
      if (anosComSobra >= 15) expect(financeiroFinal).toBeGreaterThan(financeiroInicial);
      // Os dividendos que o orçamento mostra são os do ano passado (não contam duas vezes).
      expect(rendaDasAplicacoes(v)).toBeGreaterThanOrEqual(0);
      financeiroInicial = financeiroFinal;
    }
  });
});
