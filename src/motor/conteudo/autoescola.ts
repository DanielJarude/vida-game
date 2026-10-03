/**
 * A prova teórica da carteira de motorista (a idade é a do lugar: `mundo/regras`), pergunta por pergunta (`sistemas/autoescola`).
 * Três perguntas respondidas pelo jogador; as outras, pela preparação do
 * personagem. A decisão reabre a cada pergunta, como as etapas da peneira.
 */

import type { Conteudo, Ctx } from './base';
import { cnhEmProva, perguntaAtual, PERGUNTAS_DO_JOGADOR, responderPerguntaCnh } from '../sistemas/autoescola';

const prova = (c: Ctx) => cnhEmProva(c.v);

export const AUTOESCOLA: Conteudo[] = [
  {
    id: 'cnh_prova', tipo: 'decisao', idade: [13, 95], tema: 'lugar', prioritario: true, prioridade: 5, repetir: 0,
    quando: c => !!prova(c),
    titulo: c => { const p = prova(c); return `A prova teórica · ${Math.min(PERGUNTAS_DO_JOGADOR, (p?.prova?.atual ?? 0) + 1)} de ${PERGUNTAS_DO_JOGADOR}`; },
    texto: c => { const p = prova(c); const q = p ? perguntaAtual(p) : undefined; return q ? q.enunciado : 'A prova já tinha acabado.'; },
    opcoes: [0, 1, 2].map(k => ({
      id: `r${k}`,
      texto: (c: Ctx) => { const p = prova(c); const q = p ? perguntaAtual(p) : undefined; return q?.opcoes[k] ?? '—'; },
      disponivel: (c: Ctx) => !!prova(c),
      resolver: (c: Ctx) => {
        if (!prova(c)) return { texto: 'A prova já tinha acabado.', memoria: null };
        const res = responderPerguntaCnh(c.v, c.r, k);
        if (res.continua) return { texto: '', memoria: null, reabrir: true };
        return { texto: res.texto, memoria: null, tom: res.tom };
      }
    }))
  }
];
