/**
 * VIDA 39 · toda resposta do celular tem fala e tom próprios (nada de "Respondido." genérico).
 * As opções v17 e as antigas que o jogo oferece hoje: cada código precisa de uma fala e de um tom.
 */
import { describe, expect, it } from 'vitest';

import { etiquetasDoEfeito39, FALA_DA_RESPOSTA39, ROTULO_DO_TOM39, TOM_DA_RESPOSTA39 } from '../v15/celular/falasDaResposta39';

// Códigos de resposta que a interface pode mostrar depois de escolhidos (motor v15 e v17).
const CODIGOS_V17 = ['apoio', 'conselho', 'ajudar', 'engracada', 'evasiva', 'provocar', 'carinhosa', 'desinteresse', 'interesse', 'devagar', 'negociar', 'recusa', 'cumprir', 'desculpas', 'firme', 'confrontar', 'cache', 'agradecimento', 'abrir', 'tranquilizar', 'irritar', 'explicar', 'ouvir', 'cortar', 'dar', 'parte', 'topar', 'negar', 'adiar', 'desviar'];
const CODIGOS_ANTIGOS = ['aceitar', 'recusar', 'outro_dia', 'ligar', 'marcar', 'curto', 'conversar', 'cordial', 'atender', 'ir', 'confirmar', 'sem_comentar', 'cumprimentar', 'ignorar'];

describe('VIDA 39 · respostas visíveis no celular', () => {
  it('cada resposta nova tem fala própria (não cai no genérico)', () => {
    for (const op of CODIGOS_V17) expect(FALA_DA_RESPOSTA39[op], op).toBeTruthy();
    for (const op of CODIGOS_V17) expect(FALA_DA_RESPOSTA39[op]).not.toMatch(/Respondido/);
  });

  it('cada código de resposta tem um tom que aparece como etiqueta', () => {
    for (const op of [...CODIGOS_V17, ...CODIGOS_ANTIGOS]) {
      const tom = TOM_DA_RESPOSTA39[op];
      if (op === 'ignorar') continue; // sem resposta: nenhum tom
      expect(tom, op).toBeDefined();
      expect(ROTULO_DO_TOM39[tom]).toBeTruthy();
    }
  });

  it('os tons são os cinco que o CSS conhece', () => {
    expect(Object.keys(ROTULO_DO_TOM39).sort()).toEqual(['carinho', 'cautela', 'disposicao', 'firmeza', 'humor']);
  });
});


describe('VIDA 39 · efeito da resposta na relação (etiquetas)', () => {
  it('sem efeito, sem etiqueta; cada mudança relevante vira uma etiqueta com o tom certo', () => {
    expect(etiquetasDoEfeito39(undefined)).toEqual([]);
    expect(etiquetasDoEfeito39({ prox: 1, tensao: 0, confianca: 1 })).toEqual([]);
    expect(etiquetasDoEfeito39({ prox: 4, tensao: -5, confianca: 0 })).toEqual([{ texto: 'Mais perto', tom: 'bom' }, { texto: 'Tensão diminuiu', tom: 'bom' }]);
    expect(etiquetasDoEfeito39({ prox: -3, tensao: 6, confianca: -2 })).toEqual([{ texto: 'Mais distante', tom: 'ruim' }, { texto: 'Menos confiança', tom: 'ruim' }, { texto: 'Tensão subiu', tom: 'ruim' }]);
  });
});
