/**
 * REWORK 12 — a leitura do patrimônio para as telas: o que é disponível, o que é investido, o que está preso em
 * imóvel, veículo, coleção e empresa; o que se deve; o que o patrimônio rende e custa por mês; e a diferença entre
 * TER (patrimônio) e PODER PAGAR AGORA (liquidez). Nada aqui calcula regra: os números são os do motor.
 */

import type { Vida } from '../motor/tipos';
import { balanco, orcamento, PATRIMONIO_NO_MES } from '../motor/sistemas/dinheiro';
import { liquidezImediata, rendaDasAplicacoes } from '../motor/sistemas/investimentos';
import { custosDeVeiculo, veiculos } from '../motor/sistemas/veiculos';
import { economiaLocal } from '../motor/dados/lugares';
import { empresasAtivas } from '../motor/sistemas/empresas';
import { anoDe } from '../motor/tempo';
import { AREA_MORADIA, depreciacao, modeloMoradia, modeloVeiculo, versaoVeiculo } from '../motor/dados/bens';
import type { OfertaImovel, OfertaVeiculo } from '../motor/sistemas/mercado';
import { dinheiroCurto } from './leituraMaterial';

export interface LinhaRecorrente { rotulo: string; valor: number }

export interface PainelPatrimonial {
  disponivel: number;
  investido: number;
  imoveis: number;
  veiculos: number;
  colecao: number;
  empresas: number;
  negocio: number;
  ativos: number;
  dividas: number;
  liquido: number;
  /** O que dá para usar em semanas (conta + reserva + renda fixa). */
  liquidez: number;
  /** Quantos meses de despesa a liquidez paga. */
  meses: number;
  /** O que o patrimônio põe na conta por mês (aluguéis, rendimentos, a média distribuída pelas empresas). */
  receitas: LinhaRecorrente[];
  /** O que ele custa por mês (os veículos, os imóveis que não são a casa, a coleção, as parcelas dos financiamentos). */
  despesas: LinhaRecorrente[];
  /** A frase que separa patrimônio de caixa. */
  frase: string;
}

export function painelPatrimonial(v: Vida): PainelPatrimonial {
  const b = balanco(v);
  const o = orcamento(v);
  const c = economiaLocal(v.moradia.municipioId).custo;
  const liquidez = liquidezImediata(v);
  const despesaMes = Math.max(1, o.despesa);
  const meses = liquidez / despesaMes;
  const receitas: LinhaRecorrente[] = [];
  for (const x of v.financas.bens) if (x.tipo === 'imovel' && x.alugadoPor && !x.calote) receitas.push({ rotulo: `Aluguel: ${x.nome}`, valor: x.alugadoPor });
  const apl = rendaDasAplicacoes(v);
  if (apl > 0) receitas.push({ rotulo: 'Rendimentos que pagam (dividendos, fundos)', valor: apl });
  for (const e of empresasAtivas(v)) {
    const media = e.ultimo ? Math.round(e.ultimo.distribuido * e.parte / 12) : 0;
    if (media > 0) receitas.push({ rotulo: `${e.nome}: lucro distribuído (média do último ano)`, valor: media });
  }
  const despesas: LinhaRecorrente[] = [];
  for (const x of veiculos(v)) for (const l of custosDeVeiculo(v, x, c, 0.7)) despesas.push(l);
  for (const fn of PATRIMONIO_NO_MES) for (const l of fn(v, c)) despesas.push(l);
  for (const d of v.financas.dividas) if (d.bemId && d.parcela > 0 && d.saldo > 0) despesas.push({ rotulo: d.descricao, valor: Math.min(d.parcela, d.saldo) });
  const imobilizado = b.imoveis + b.veiculos + b.colecao + b.empresas;
  const frase = b.ativos <= 0 && b.obrigacoes <= 0 ? 'Nada no seu nome ainda.'
    : b.liquido < 0 ? 'Deve mais do que tem: o caminho é cortar o que custa, renegociar o que é caro e vender o que pesa.'
      : imobilizado > b.liquido * 0.7 && meses < 3 ? `Rico em patrimônio, curto de caixa: quase tudo está em ${b.imoveis >= b.empresas && b.imoveis >= b.colecao ? 'imóveis' : b.empresas >= b.colecao ? 'empresas' : 'coleção'} — o que se paga no mês sai de ${meses < 1 ? 'menos de um mês' : `uns ${Math.floor(meses)} meses`} de reserva. Não é falência; é pouca liquidez.`
        : meses >= 12 ? `O que dá para usar já paga ${meses >= 24 ? `uns ${Math.floor(meses / 12)} anos` : 'mais de um ano'} de despesas.`
          : `A reserva líquida segura ${meses < 1 ? 'menos de um mês' : `uns ${Math.floor(meses)} meses`} de despesas.`;
  return {
    disponivel: Math.max(0, b.conta), investido: b.aplicacoes, imoveis: b.imoveis, veiculos: b.veiculos, colecao: b.colecao, empresas: b.empresas, negocio: b.negocio,
    ativos: b.ativos, dividas: b.obrigacoes, liquido: b.liquido, liquidez, meses, receitas, despesas, frase
  };
}

/** A evolução do patrimônio líquido, ano a ano (só os anos que a vida de fato fotografou: nada inventado). */
export function evolucaoPatrimonial(v: Vida): { ano: number; liquido: number }[] {
  return v.financas.historico.map(h => ({ ano: anoDe(h.t), liquido: Math.round(h.ativos - h.obrigacoes) }));
}

/* ------------------------------------------------------------- Antes de comprar */

interface LinhaAntes { rotulo: string; texto: string }

/**
 * Antes de comprar um imóvel: o que ele custa por mês, o preço por metro (o que é caro pelo endereço e o que é caro
 * pelo tamanho), o que muda já, e — comprando para alugar — o que deve render, sem prometer nada.
 */
export function custosAntesDeComprarImovel(v: Vida, o: OfertaImovel, morar: boolean): LinhaAntes[] {
  const m = modeloMoradia(o.modeloId);
  const c = economiaLocal(v.moradia.municipioId).custo;
  const fixo = Math.round((o.preco * 0.006 / 12 + (m.condominio ? m.condominio * c : 0)) / 10) * 10;
  const out: LinhaAntes[] = [];
  const area = AREA_MORADIA[m.id];
  if (area) out.push({ rotulo: 'Preço por metro', texto: `${dinheiroCurto(Math.round(o.preco / area))}/m² (uns ${area} m²)` });
  out.push({ rotulo: 'Todo mês', texto: `uns ${dinheiroCurto(fixo)} de imposto, manutenção${m.condominio ? ' e condomínio' : ''}` });
  if (morar && (v.moradia.tipo === 'aluguel' || v.moradia.tipo === 'republica')) out.push({ rotulo: 'O que muda já', texto: `deixa de pagar o aluguel de ${dinheiroCurto(v.moradia.aluguel)}` });
  if (!morar) {
    const bruto = o.aluguel;
    const liquido = Math.round((bruto * 0.9 * 0.88 - o.preco * 0.006 / 12) / 10) * 10;
    out.push({ rotulo: 'Alugado', texto: `deve render uns ${dinheiroCurto(bruto)} por mês (${(bruto * 12 / o.preco * 100).toFixed(1).replace('.', ',')}% ao ano, bruto); depois da imobiliária, do imposto e do IPTU, uns ${dinheiroCurto(liquido)}` });
    out.push({ rotulo: 'Riscos', texto: 'imóvel vazio entre inquilinos, calote, reparo — e o preço anda com o mercado (cai numa crise). Nada disso é garantido.' });
  } else out.push({ rotulo: 'Riscos', texto: 'reformas grandes de tempos em tempos; o valor anda com o mercado da cidade e do bairro.' });
  return out;
}

/** Antes de comprar um veículo: quanto custa manter e quanto deve valer daqui a uns anos (o clássico não tem tabela). */
export function custosAntesDeComprarVeiculo(v: Vida, o: OfertaVeiculo): LinhaAntes[] {
  const m = modeloVeiculo(o.modeloId);
  const c = economiaLocal(v.moradia.municipioId).custo;
  const uso = versaoVeiculo(o.versaoId)?.usoMensal ?? m.usoMensal;
  const mes = Math.round((uso * c + o.preco * m.taxaAnual / 12 + (m.tripulacao ?? 0)) / 10) * 10;
  const out: LinhaAntes[] = [{ rotulo: 'Para manter', texto: `uns ${dinheiroCurto(mes)} por mês, contando uso, seguro e impostos${m.tripulacao ? ' e a tripulação' : ''}` }];
  const anos = Math.max(0, anoDe(v.t) - o.anoFabricacao);
  if (m.segmento === 'classico') out.push({ rotulo: 'O valor', texto: 'segue o mercado de clássicos e o estado da peça: pode subir, pode cair. Restaurar é caro e não garante retorno.' });
  else {
    const daqui = Math.round(o.preco * depreciacao(m, anos + 3) / Math.max(0.01, depreciacao(m, anos)) / 1000) * 1000;
    out.push({ rotulo: 'Em três anos', texto: `deve valer uns ${dinheiroCurto(daqui)} (estimativa, com o estado em dia)${m.segmento === 'exotico' ? ' — o exótico perde muito no começo' : ''}` });
  }
  if (m.segmento || m.raro) out.push({ rotulo: 'Riscos', texto: 'oficina especializada e peça cara; um conserto grave pode custar o preço de um carro popular.' });
  return out;
}
