/**
 * A decisão das situações de carreira (`sistemas/situacoes`): o contexto
 * guardado vira a cena; cada intenção mostra o que arrisca (nunca números);
 * o desfecho vem da distribuição que o estado real produz.
 */

import type { Conteudo, Ctx } from './base';
import { intencoesDe, memoriaDaSituacao, resolverSituacao, situacaoAberta, textoDaSituacao } from '../sistemas/situacoes';

const it = (c: Ctx, k: number) => { const a = situacaoAberta(c.v); return a ? intencoesDe(a.m, c.v, a.d)[k] : undefined; };

export const SITUACOES: Conteudo[] = [
  {
    id: 'car_situacao', tipo: 'decisao', idade: [16, 90], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 0,
    quando: c => !!situacaoAberta(c.v),
    titulo: c => { const a = situacaoAberta(c.v)!; return typeof a.m.titulo === 'string' ? a.m.titulo : a.m.titulo(c.v, a.d); },
    texto: c => { const a = situacaoAberta(c.v)!; return textoDaSituacao(c.v, a.m, a.d); },
    opcoes: [0, 1, 2, 3].map(k => ({
      id: `i${k}`,
      texto: (c: Ctx) => { const x = it(c, k); const a = situacaoAberta(c.v); return x && a ? (typeof x.texto === 'string' ? x.texto : x.texto(c.v, a.d)) : '—'; },
      disponivel: (c: Ctx) => (it(c, k) ? true : false),
      consequencia: (c: Ctx) => it(c, k)?.dica,
      resolver: (c: Ctx) => {
        const x = it(c, k);
        const res = x ? resolverSituacao(c.v, c.r, x.id) : undefined;
        if (!res) return { texto: 'O momento passou.', memoria: null };
        return { texto: res.texto, memoria: null, tom: res.desfecho === 'otimo' || res.desfecho === 'bom' ? 'bom' : res.desfecho === 'pessimo' ? 'ruim' : 'neutro', efeito: () => memoriaDaSituacao(c.v, res.memoria, res.desfecho) };
      }
    }))
  }
];
