/**
 * F5-FIX · CANÁRIO C — ESTADO vs TRANSIÇÃO.
 *
 * O playtest recebeu, num personagem de 18 anos recém-saído do Ensino Médio,
 * desempregado e com saldo zero:
 *
 *   "Você passou a viver com bem menos: trocou marca por preço e cortou o
 *    que dava para cortar."
 *
 * A frase afirma uma MUDANÇA, e mudança pressupõe um antes: que ele vivesse
 * com mais e comprasse por marca. O jogo nunca estabeleceu isso —
 * `padraoDeVida` nasce 'confortavel' por PADRÃO, igual para todo mundo, e
 * nada jamais o eleva. Era uma queda a partir de um patamar que ninguém
 * viveu.
 *
 * ESTE TESTE NÃO VERIFICA A ECONOMIA. A dívida aos 18 é real e continua
 * sendo registrada — corrigi-la é F7. O que se verifica aqui é estritamente
 * narrativo: nenhum texto pode inventar um passado que o estado não contém.
 */

import { describe, it, expect } from 'vitest';
import { processarAnoEconomia, criarEconomiaInicial } from '../../economySystem';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../__tests__/fixtures';

/**
 * Marcas de TRANSIÇÃO: afirmam que algo mudou em relação a um estado
 * anterior. Usadas para TRIAGEM — a decisão sobre cada ocorrência é
 * semântica e está registrada no relatório da fase.
 */
const MARCAS_DE_TRANSICAO =
  /\b(passou a|começou a|deixou de|voltou a|trocou .* por|reduziu|tornou-se|ficou mais|novamente|agora você|antes você)\b/i;

/**
 * Transições que o estado COMPROVA e que, por isso, podem ser afirmadas.
 * Cada entrada precisa de justificativa — é o que impede a lista de virar
 * uma válvula de escape para silenciar o teste.
 */
const TRANSICOES_COMPROVADAS: { trecho: string; porque: string }[] = [
  {
    trecho: 'cortar o padrão de vida',
    porque:
      'Só dispara quando padraoDeVida ERA luxuoso e passa a confortavel — a ' +
      'mudança está no próprio estado. Hoje o ramo é inalcançável (nada ' +
      'atribui luxuoso), mas o texto estará correto quando a F7 criar a subida.'
  }
];

describe('F5-FIX · o aperto financeiro é narrado como ESTADO, não como mudança de hábito', () => {
  /** Roda um ano de economia com saldo negativo forçado, como aos 18. */
  function anoComAperto() {
    const personagem = criarPersonagemTeste({ idade: 18 });
    const economia = criarEconomiaInicial('classe_media');
    // Saldo zero e nenhuma renda: a situação exata do playtest — 18 anos,
    // recém-formado no Ensino Médio, desempregado.
    economia.dinheiro = 0;
    return processarAnoEconomia(
      economia, personagem, criarFamiliaTeste(), 0, 0, personagem.anoAtual
    );
  }

  it('nenhum texto afirma que a pessoa "passou a viver com menos"', () => {
    const r = anoComAperto();
    for (const log of r.logsEconomia) {
      expect(
        /passou a viver com|trocou marca por preço/i.test(log.texto),
        `texto inventa um padrão de consumo anterior: "${log.texto}"`
      ).toBe(false);
    }
  });

  it('o aperto continua sendo registrado — o bug econômico não foi escondido', () => {
    // A instrução foi explícita: não remover a entrada só porque parece ruim.
    // Se a dívida existe no estado, a Linha da Vida pode e deve registrá-la.
    const r = anoComAperto();
    const falouDoAperto = r.logsEconomia.some(l =>
      /contas do ano não fecharam|dívidas|padrão de vida/i.test(l.texto)
    );
    expect(falouDoAperto, 'o aperto financeiro real precisa continuar visível').toBe(true);
  });

  it('toda marca de transição nos textos financeiros é comprovada pelo estado', () => {
    const r = anoComAperto();
    const naoComprovadas: string[] = [];
    for (const log of r.logsEconomia) {
      if (!MARCAS_DE_TRANSICAO.test(log.texto)) continue;
      const comprovada = TRANSICOES_COMPROVADAS.some(t => log.texto.includes(t.trecho));
      if (!comprovada) naoComprovadas.push(log.texto);
    }
    expect(
      naoComprovadas,
      'Um texto que afirma mudança precisa de um ANTES no estado. Se o dado ' +
        'não existe, reescreva como estado atual em vez de inventar o passado.'
    ).toEqual([]);
  });

  it('as justificativas das transições comprovadas são substantivas', () => {
    for (const t of TRANSICOES_COMPROVADAS) {
      expect(t.porque.length, `justificar "${t.trecho}"`).toBeGreaterThan(40);
    }
  });
});
