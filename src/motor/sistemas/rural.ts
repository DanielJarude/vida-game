/**
 * Campo e água: produzir é outra vida, não "um emprego no agro".
 *
 *   TERRA — da família (o sítio do avô), arrendada (paga por ano, com a
 *   safra) ou própria (comprada à vista ou com crédito rural, que no Brasil
 *   tem juro menor que o do banco comum — no jogo, uma abstração do crédito
 *   da agricultura familiar).
 *   SAFRA — a renda vem do ano: chuva, seca, preço. É a mesma para a região
 *   inteira naquele ano (o mundo, não a pessoa). Cooperativa suaviza os
 *   extremos: vende junto, compra junto, perde menos no ano ruim.
 *   DECISÕES — dois anos ruins seguidos pedem uma decisão: diversificar,
 *   entrar na cooperativa, vender ou arrendar a terra, largar.
 *   PESCA — o defeso (Lei 10.779/2003): na época em que é proibido pescar, o
 *   pescador artesanal recebe o seguro-defeso.
 *
 * Não é simulador de fazenda: não há talhão, praga ou planilha de insumo.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Imovel, Vida, VidaRural } from '../tipos';
import { escrever, idade } from '../nucleo';
import { municipio, economiaLocal } from '../dados/lugares';
import { anoDe } from '../tempo';
import { marcar } from './marcas';
import { SALARIO_MINIMO } from './renda';
import { modeloMoradia, precoImovel } from '../dados/bens';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/** A safra da região neste ano (estável: o clima e o preço não dependem de quem joga). */
export function safraDaRegiao(municipioId: string, ano: number): 'boa' | 'normal' | 'ruim' {
  const x = hash(`safra:${municipio(municipioId).uf}:${ano}`);
  return x < 0.22 ? 'ruim' : x > 0.74 ? 'boa' : 'normal';
}

const CULTURA_DA_REGIAO: Record<string, VidaRural['cultura']> = { Sul: 'lavoura', 'Centro-Oeste': 'lavoura', Sudeste: 'leite', Nordeste: 'misto', Norte: 'misto' };
const NOME_CULTURA: Record<VidaRural['cultura'], string> = { lavoura: 'a lavoura', leite: 'o leite', horta: 'a horta', misto: 'um pouco de tudo — roça, criação, horta' };

export function iniciarRural(v: Vida, terra: VidaRural['terra']): VidaRural {
  const cultura = CULTURA_DA_REGIAO[municipio(v.moradia.municipioId).regiao] ?? 'misto';
  v.caminhos.rural = { terra, cultura, cooperativa: false, tInicio: v.t, anosRuins: 0 };
  return v.caminhos.rural;
}

export const produzindo = (v: Vida) => v.trabalho.atual?.ocupacaoId === 'produtor_rural' && !!v.caminhos.rural;
export const pescando = (v: Vida) => v.trabalho.atual?.ocupacaoId === 'pescador';

/** Quanto custa arrendar a terra por mês (uma parte da safra, em dinheiro). */
export const arrendamentoMensal = (v: Vida) => Math.round(420 * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

/** Um sítio: preço de mercado na região (terra do interior custa menos que a da capital). */
export const precoDoSitio = (v: Vida) => precoImovel(modeloMoradia('sitio'), economiaLocal(v.moradia.municipioId).custo);

export function processarRural(v: Vida, r: Rng): void {
  const e = v.trabalho.atual;
  if (pescando(v) && e) {
    // O defeso: meses sem pescar, com seguro.
    v.financas.conta += SALARIO_MINIMO * 4;
    if (!v.fatos['defeso']) { v.fatos['defeso'] = v.t; escrever(v, { texto: 'Chegou o primeiro defeso: quatro meses sem poder pescar, com o seguro-defeso pagando o básico.', relevancia: 'biografia', tema: 'trabalho' }); }
    const s = safraDaRegiao(v.moradia.municipioId, anoDe(v.t));
    if (e.clientela !== undefined) e.clientela = clamp(e.clientela + (s === 'boa' ? 6 : s === 'ruim' ? -8 : 0));
    return;
  }
  const ru = v.caminhos.rural;
  if (!ru || !e || e.ocupacaoId !== 'produtor_rural') return;
  const s = safraDaRegiao(v.moradia.municipioId, anoDe(v.t));
  ru.ultimaSafra = s;
  const coop = ru.cooperativa ? 0.5 : 1;
  const delta = s === 'boa' ? 12 * (ru.cooperativa ? 0.8 : 1) : s === 'ruim' ? -18 * coop : 2;
  if (e.clientela !== undefined) e.clientela = clamp(Math.round(e.clientela + delta + (ru.terra === 'propria' ? 2 : 0)));
  ru.anosRuins = s === 'ruim' ? ru.anosRuins + 1 : 0;
  const anos = Math.floor((v.t - ru.tInicio) / 12);
  if (s === 'ruim') escrever(v, { texto: r.pick(['A chuva não veio na hora certa. A safra deu metade.', 'O preço caiu na época de vender. Trabalhou o ano todo para empatar.', 'Uma seca comprida: o pasto secou antes do tempo.']) + (ru.cooperativa ? ' A cooperativa segurou parte do prejuízo.' : ''), relevancia: anos <= 2 || ru.anosRuins >= 2 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  else if (s === 'boa' && r.chance(0.5)) escrever(v, { texto: r.pick(['Safra cheia e preço bom: o ano pagou os dois anteriores.', 'Choveu na hora certa. Deu para trocar o equipamento velho.', 'O leite rendeu e o laticínio pagou em dia.']), relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
  if (ru.anosRuins >= 2) v.fatos['rural_aperto'] = v.t;
  // Convites que o campo faz para quem está nele.
  if (!ru.cooperativa && anos >= 2 && r.chance(0.2)) v.fatos['rural_cooperativa'] = v.t;
  if (ru.terra === 'arrendada' && anos >= 4 && r.chance(0.12)) v.fatos['rural_comprar'] = v.t;
  if (anos === 10 && !v.fatos['rural_dez']) {
    v.fatos['rural_dez'] = v.t;
    marcar(v, 'lideranca', `Dez anos produzindo ${NOME_CULTURA[ru.cultura].split(' —')[0]}.`, 2, { trilha: 'campo' });
  }
}

/** Comprar a terra (à vista ou com crédito rural, a juro menor que o do banco). */
export function comprarSitio(v: Vida, financiar: boolean): { preco: number; entrada: number } {
  const preco = precoDoSitio(v);
  const entrada = financiar ? Math.round(preco * 0.2) : preco;
  v.financas.conta -= entrada;
  const id = `im${v.seq++}`;
  const imovel: Imovel = { id, tipo: 'imovel', modeloId: 'sitio', nome: 'sítio', valor: preco, precoPago: preco, tCompra: v.t, municipioId: v.moradia.municipioId, estado: 70, bairro: 'na zona rural', historia: [{ t: v.t, texto: financiar ? 'Comprado com crédito rural.' : 'Comprado à vista.' }], dono: 'eu', tManutencao: v.t };
  v.financas.bens.push(imovel);
  if (financiar) {
    const saldo = preco - entrada;
    const j = 0.004;
    const n = 144;
    const parcela = Math.round(saldo * j / (1 - Math.pow(1 + j, -n)));
    v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'financiamento_imovel', saldo, jurosMes: j, parcela, bemId: id, descricao: 'Crédito rural: o sítio', tInicio: v.t, prazo: n });
  }
  if (v.caminhos.rural) v.caminhos.rural.terra = 'propria';
  return { preco, entrada };
}

export const leituraRural = (v: Vida): string | undefined => {
  const ru = v.caminhos.rural;
  if (!produzindo(v) || !ru) return undefined;
  const terra = ru.terra === 'familia' ? 'na terra da família' : ru.terra === 'arrendada' ? 'em terra arrendada' : 'na sua terra';
  const safra = ru.ultimaSafra === 'boa' ? 'A última safra foi boa.' : ru.ultimaSafra === 'ruim' ? 'A última safra foi ruim.' : ru.ultimaSafra ? 'A última safra foi normal.' : '';
  return `Produz ${NOME_CULTURA[ru.cultura]}, ${terra}${ru.cooperativa ? ', com a cooperativa' : ''}. ${safra} A renda vem do ano, não do mês.`;
};

export { idade };
