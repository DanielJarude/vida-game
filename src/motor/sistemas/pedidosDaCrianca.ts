/**
 * REWORK 10.6 · INF-01/02 — PEDIR AOS RESPONSÁVEIS.
 *
 * O playtest: uma criança de 10 anos, com 193 no cofrinho, recebia "pagar 240 pelos ingressos do estádio"; a loja
 * mostrava a chuteira e a bola por 920 com o botão apagado ("na conta há 193") — e o pedido de dinheiro existia em
 * Vida · Dinheiro, longe dali, genérico, sem o produto. A criança era tratada como um adulto em miniatura.
 *
 * Agora, o que envolve dinheiro de verdade passa pelos adultos da casa, a partir do lugar onde a vontade nasceu:
 *
 *   O PROGRAMA      "Pedir ao Bernardo para levar você ao estádio": quem paga é o adulto, se aceitar
 *   A COMPRA        o preço, o que há no cofrinho, o que falta — e pedir para comprar, ou para completar o valor
 *
 * A resposta é do adulto, nunca garantida: a folga da casa (o dinheiro), o tempo (quem trabalha nem sempre pode), a
 * relação e o jeito da pessoa. Recusar por falta de dinheiro não estraga nada entre vocês. O dinheiro sai de algum
 * lugar: do guardado do adulto, quando ele tem um registrado; senão, do orçamento da casa (a folga, `recursosDaFamilia`).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { dinheiro as fmt, flex } from '../texto';
import { recursosDaFamilia, responsaveis } from './origem';
import { moraComFamiliaDeOrigem } from './domicilio';
import { precoDaCoisa, receberCoisa, temCoisa } from './coisas';
import { coisa } from '../dados/coisas';
import { pagar } from './dinheiro';

const local = (v: Vida, x: number) => Math.max(5, Math.round(x * economiaLocal(v.moradia.municipioId).custo / 5) * 5);

/** Até quanto a casa costuma topar de uma vez, pela folga (0 no limite … 4 com sobra) — no custo de vida daqui. */
const TETO_DA_CASA = [0, 60, 220, 700, 2400];

/** Depende dos adultos para gastar de verdade: criança e adolescente que mora com a família de origem. */
export function dependeDosResponsaveis(v: Vida): boolean {
  return idade(v) < 16 && moraComFamiliaDeOrigem(v) && responsaveis(v).length > 0;
}

/** Os adultos a quem a criança pode pedir (os que moram com ela primeiro; os de longe também ouvem, por telefone). */
export function aQuemPedir(v: Vida): { p: Pessoa; vin: Vinculo }[] {
  return [...responsaveis(v)].sort((a, b) => Number(b.p.municipioId === v.moradia.municipioId) - Number(a.p.municipioId === v.moradia.municipioId) || (b.vin.proximidade - b.vin.tensao * 0.5) - (a.vin.proximidade - a.vin.tensao * 0.5));
}

export type Resposta = { sim: boolean; motivo: 'aceitou' | 'dinheiro' | 'tempo' | 'agora_nao'; texto: string };

/**
 * A resposta de um adulto a um pedido que custa `valor`: o dinheiro primeiro (a casa no limite não tem de onde tirar),
 * depois o tempo (programa pede o adulto junto) e, por fim, a relação e o jeito da pessoa.
 */
export function respostaDoResponsavel(v: Vida, r: Rng, quem: { p: Pessoa; vin: Vinculo }, valor: number, o: { programa?: boolean } = {}): Resposta {
  const nome = quem.p.nome;
  const teto = local(v, TETO_DA_CASA[recursosDaFamilia(v).folga] ?? 0);
  const peso = teto > 0 ? valor / teto : 99;
  const cabe = peso <= 1 ? 0.92 : peso <= 2 ? 0.5 : peso <= 4 ? 0.15 : 0;
  if (!r.chance(cabe)) return { sim: false, motivo: 'dinheiro', texto: peso > 4 ? `${nome} explicou, com calma, que isso está muito acima do que a casa pode agora.` : `${nome} explicou que o dinheiro da casa está contado — quem sabe mais para a frente, ou no aniversário.` };
  if (o.programa && quem.p.renda > 0 && r.chance(0.15)) return { sim: false, motivo: 'tempo', texto: `${nome} queria, mas o trabalho não deixa nesse fim de semana — ficou prometido para outra vez.` };
  const rel = clamp((quem.vin.proximidade - 30) / 50, 0, 1) * clamp(1 - quem.vin.tensao / 120, 0.2, 1);
  const jeito = clamp(((quem.p.temperamento?.afabilidade ?? 0) + 1) / 2, 0, 1);
  if (!r.chance(0.5 + rel * 0.35 + jeito * 0.15)) return { sim: false, motivo: 'agora_nao', texto: `${nome} disse que agora não — e não quis muita conversa.` };
  return { sim: true, motivo: 'aceitou', texto: '' };
}

/** O dinheiro sai de algum lugar: do guardado do adulto, quando há um; senão, do orçamento da casa. */
export function adultoPaga(quem: Pessoa, valor: number): void {
  if (quem.posses && quem.posses.dinheiro > 0) quem.posses.dinheiro = Math.max(0, quem.posses.dinheiro - valor);
}

/* ------------------------------------------------------------ A compra */

export interface SituacaoDaCompra { preco: number; tem: number; falta: number; quem: { id: string; nome: string }[] }

/** O que a vitrine mostra a quem depende dos adultos: o preço, o cofrinho, o que falta e a quem pedir. */
export function situacaoDaCompra(v: Vida, coisaId: string): SituacaoDaCompra {
  const preco = precoDaCoisa(v, coisaId);
  const tem = Math.max(0, Math.round(v.financas.conta));
  return { preco, tem, falta: Math.max(0, preco - tem), quem: aQuemPedir(v).map(x => ({ id: x.p.id, nome: x.p.nome })) };
}

const chaveDoPedido = (coisaId: string) => `crianca:pedido:${coisaId}`;

export function disponibilidadePedidoDeCompra(v: Vida, coisaId: string, completar: boolean, responsavelId?: string): Veredito {
  const c = coisa(coisaId);
  if (!c) return bloqueio('impossivel', 'Isso não existe na loja.');
  if (!dependeDosResponsaveis(v)) return bloqueio('impossivel', idade(v) >= 16 ? 'A partir daqui, a compra é sua (ou um pedido de ajuda de adulto, em Vida · Dinheiro).' : 'Sem os adultos da casa por perto, não há a quem pedir.');
  if (idade(v) < 4) return bloqueio('impossivel', 'Ainda é cedo para pedir.');
  if (c.daCasa) return bloqueio('impossivel', 'Os móveis e os eletrodomésticos da casa são decisão dos adultos.');
  if ((c.idadeMin ?? 12) > idade(v) + 4) return bloqueio('impossivel', `Isso é para quem tem uns ${c.idadeMin} anos.`);
  if (temCoisa(v, coisaId)) return bloqueio('incompativel', `Você já tem ${c.artigo} ${c.nome}.`);
  if (v.anoAtual.acoes.includes(chaveDoPedido(coisaId))) return bloqueio('incompativel', 'Você já pediu isso este ano.');
  if (responsavelId && !aQuemPedir(v).some(x => x.p.id === responsavelId)) return bloqueio('impossivel', 'Essa pessoa não é um dos seus responsáveis.');
  const s = situacaoDaCompra(v, coisaId);
  if (completar && s.tem <= 0) return bloqueio('incompativel', 'Não há nada guardado para completar: o pedido é para comprar inteiro.');
  if (completar && s.falta <= 0) return bloqueio('incompativel', 'O que você tem já paga.');
  return PERMITIDO;
}

/** Pede: o adulto responde; aceitando, compra (inteiro, ou completando o que a criança tem) e a coisa é dela. */
export function executarPedidoDeCompra(v: Vida, r: Rng, coisaId: string, completar: boolean, responsavelId?: string): { texto: string; tom: 'bom' | 'neutro' | 'ruim' } {
  v.anoAtual.acoes.push(chaveDoPedido(coisaId));
  const c = coisa(coisaId)!;
  const quem = aQuemPedir(v).find(x => x.p.id === responsavelId) ?? aQuemPedir(v)[0];
  const s = situacaoDaCompra(v, coisaId);
  const valor = completar ? s.falta : s.preco;
  const nomeCoisa = /^(um|uma) /.test(c.nome) ? c.nome : `${c.artigo} ${c.nome}`;
  const res = respostaDoResponsavel(v, r, quem, valor);
  if (!res.sim) {
    escrever(v, { texto: `Pediu a ${quem.p.nome} ${completar ? `ajuda para comprar ${nomeCoisa}` : nomeCoisa}. Não deu: ${res.motivo === 'dinheiro' ? 'o dinheiro da casa está contado' : 'agora não'}.`, relevancia: 'cotidiano', tema: 'familia', escolha: true });
    return { texto: `${res.texto} Dá para guardar dinheiro e voltar depois${completar ? '' : ' — ou pedir só para completar o que faltar'}.`, tom: 'neutro' };
  }
  if (completar) pagar(v, s.tem);
  adultoPaga(quem.p, valor);
  receberCoisa(v, coisaId, s.preco, true);
  lembrarCom(v, quem.p.id, completar ? `Completou o que faltava para ${nomeCoisa}.` : `Comprou ${nomeCoisa} para você.`, 'apoio', 1, v.t, 'ela');
  escrever(v, { texto: completar ? `Juntou ${fmt(s.tem)} e ${quem.p.nome} completou ${fmt(valor)}: ${nomeCoisa} é seu agora.` : `${quem.p.nome} comprou ${nomeCoisa} para você (${fmt(s.preco)}).`, relevancia: 'cotidiano', tema: 'familia', tom: 'bom', escolha: true, pessoas: [quem.p.id] });
  return { texto: completar ? `${quem.p.nome} topou completar: você pôs ${fmt(s.tem)} do cofrinho, ${flex(quem.p.genero, 'ele', 'ela', 'elu')} pôs ${fmt(valor)}. ${cap(nomeCoisa)} é seu agora.` : `${quem.p.nome} topou e comprou ${nomeCoisa} para você, por ${fmt(s.preco)}.`, tom: 'bom' };
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
