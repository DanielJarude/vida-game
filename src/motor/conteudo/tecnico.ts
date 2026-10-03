/**
 * As decisões da carreira de técnico (`sistemas/tecnico`): a proposta de
 * outro clube (ou da seleção). Como no mercado de jogador: a proposta foi
 * criada UMA vez (clube, cidade, divisão, prazo, salário) — a decisão mostra
 * ESTA proposta, e "aceitar" executa ESTA proposta.
 */

import type { Conteudo, Ctx } from './base';
import { municipio } from '../dados/lugares';
import { aSelecao, divisaoDoNivel, doClube, oClube } from '../dados/clubes';
import { dinheiro, flex, ge } from '../texto';
import { aceitarPropostaDeTecnico, passagemAtual, propostaDeTecnico, recusarPropostaDeTecnico } from '../sistemas/tecnico';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const divisao = (n: number) => { const d = divisaoDoNivel(n); return d.startsWith('campeonato') ? `o ${d}` : d.startsWith('divisões') ? `as ${d}` : `a ${d}`; };

export const TECNICO: Conteudo[] = [
  {
    id: 'tec_proposta', tipo: 'decisao', idade: [28, 85], tema: 'trabalho', prioritario: true, prioridade: 4, repetir: 0,
    // A proposta fica na mesa até a próxima temporada: se outra decisão ocupou o ano, ela ainda está lá.
    quando: c => !!propostaDeTecnico(c.v),
    titulo: c => (propostaDeTecnico(c.v)?.selecao ? 'A seleção' : propostaDeTecnico(c.v)?.meioDeTemporada ? 'Um clube em crise' : passagemAtual(c.v) ? 'Outro clube quer você' : 'O telefone tocou'),
    texto: (c: Ctx) => {
      const p = propostaDeTecnico(c.v)!;
      const atual = passagemAtual(c.v);
      const g = ge(c.v);
      if (p.selecao) return `A confederação ligou: quer você no comando da ${aSelecao(p.clube).replace(/^a /, '')}, num ciclo de quatro anos até o próximo torneio mundial. ${atual ? `Seria deixar ${oClube(atual.clube)} no meio do contrato.` : ''} Salário de ${dinheiro(p.salario)} por mês.`.trim();
      const d = municipio(p.municipioId);
      const longe = p.municipioId !== c.v.moradia.municipioId ? ` A mudança seria para ${d.nome}.` : '';
      // No meio da temporada: a tabela do dia (é dela que o time será pego).
      const m = p.meioDeTemporada;
      if (m) {
        const falta = m.rodadas - m.rodada;
        const situacao = m.posicao >= 17 ? 'na zona de rebaixamento' : m.posicao - m.esperada >= 8 ? 'muito abaixo do que o elenco promete' : 'abaixo do que o elenco promete';
        return `${cap(oClube(p.clube))}, de ${d.nome}, demitiu o técnico depois de ${m.rodada} rodadas ${divisao(p.nivel).replace(/^(o|a|as) /, x => (x === 'o ' ? 'do ' : x === 'a ' ? 'da ' : 'das '))}: o time está em ${m.posicao}º lugar, com ${m.pontos[0]} pontos, ${situacao}. Querem você já, para as ${falta} rodadas que faltam e a temporada seguinte: ${dinheiro(p.salario)} por mês. Os números que contam são só os dos jogos que você dirigir.${longe}`;
      }
      return `${cap(oClube(p.clube))}, de ${d.nome}, quer você como ${flex(g, 'técnico', 'técnica')}: ${divisao(p.nivel)}, contrato de ${Math.round(p.meses / 12)} anos, ${dinheiro(p.salario)} por mês.${atual ? ` ${p.nivel > atual.nivel ? 'Divisão acima da sua.' : p.nivel < atual.nivel ? 'Divisão abaixo da sua.' : 'A mesma divisão.'} Seria deixar ${oClube(atual.clube)}.` : ' Faz tempo que você está sem clube.'}${longe}`;
    },
    opcoes: [
      { id: 'aceitar', texto: c => (propostaDeTecnico(c.v)?.selecao ? 'Aceitar a seleção' : 'Aceitar'),
        consequencia: c => { const p = propostaDeTecnico(c.v); const a = passagemAtual(c.v); return p && a ? `A passagem ${doClube(a.clube)} termina aqui.` : undefined; },
        resolver: c => { const p = propostaDeTecnico(c.v)!; return { texto: p.selecao ? 'A primeira convocação já é sua.' : `Apresentação ${doClube(p.clube)} na semana seguinte.`, memoria: null, tom: 'bom', efeito: () => { aceitarPropostaDeTecnico(c.v, c.r, p.id); } }; } },
      { id: 'recusar', texto: c => (passagemAtual(c.v) ? 'Ficar onde está' : 'Recusar'), comportamento: { familia: 1 },
        resolver: c => ({ texto: passagemAtual(c.v) ? 'Você ficou. O presidente soube — e gostou.' : 'Você disse que não. O próximo telefonema, ninguém sabe quando vem.', memoria: null, efeito: () => { const a = passagemAtual(c.v); if (a) a.pressao = Math.max(0, a.pressao - 5); recusarPropostaDeTecnico(c.v); } }) }
    ]
  }
];
