/**
 * REWORK 11.5 · POL-05 — o pedido do aliado (`sistemas/aliancas`): a decisão do ano em que quem está do seu lado pede o
 * seu nome numa pauta dele. Atender, adiar com prazo (vira promessa) ou recusar — e cada um fica na memória da aliança.
 */
import type { Conteudo, Ctx } from './base';
import { pedidoDeHoje, responderPedido } from '../sistemas/aliancas';

const pedido = (c: Ctx) => pedidoDeHoje(c.v);

export const ALIANCAS: Conteudo[] = [
  {
    id: 'polal_pedido', tipo: 'decisao', idade: [18, 90], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    quando: c => c.v.fatos['pol_alianca_pedido'] === c.v.t && !!pedido(c) && !c.v.justica?.prisao,
    titulo: c => `${pedido(c)!.nome} pede o seu apoio`,
    texto: c => { const x = pedido(c)!; return `${x.nome}, de ${x.a.grupo}, quer o seu nome numa pauta deles — uma votação, uma reunião com quem decide, uma foto ao lado. ${x.a.favores > 0 ? 'Eles já fizeram por você; é a vez de devolver.' : x.a.favores < 0 ? 'Você ainda deve uma a eles.' : 'Nada se deve, ainda, de lado nenhum.'}`; },
    opcoes: [
      { id: 'atender', texto: 'Atender', comportamento: { empatia: 1 }, consequencia: () => 'A confiança do grupo sobe e ele passa a dever uma; parte da rua não gosta.', resolver: c => ({ texto: responderPedido(c.v, 'atender'), memoria: null }) },
      { id: 'adiar', texto: 'Prometer para o ano que vem', consequencia: () => 'Vira promessa com prazo: cumprida, a confiança sobe; esquecida, cai.', resolver: c => ({ texto: responderPedido(c.v, 'adiar'), memoria: null }) },
      { id: 'recusar', texto: 'Recusar', comportamento: { independencia: 1 }, consequencia: () => 'O grupo esfria; a aliança pode não aguentar outra.', resolver: c => ({ texto: responderPedido(c.v, 'recusar'), memoria: null }) }
    ]
  }
];
