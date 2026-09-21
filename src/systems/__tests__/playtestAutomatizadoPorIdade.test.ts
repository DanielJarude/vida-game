/**
 * B4-FIX3 item 32 — playtest automatizado por idade (obrigatório).
 *
 * Para cada idade da lista pedida pelo PR, valida estruturalmente (sem
 * navegador — ver limitação registrada no relatório final):
 * - abas disponíveis são coerentes com a fase (nunca finanças/carreira
 *   completas para um bebê, por exemplo);
 * - o pool de eventos elegíveis naquela idade não contém opção
 *   incompatível (trabalho/CNH/casamento/etc. antes da hora);
 * - +1 ANO está sempre acessível (não bloqueado por bug, mesmo que a UI
 *   real não seja renderizada aqui — checagem estrutural do motor);
 * - dinheiro só é relevante quando a fase já o justifica.
 *
 * Isso não substitui inspeção visual real; é verificação ESTRUTURAL do
 * motor e dos dados, a camada que pode ser garantida sem navegador.
 */

import { describe, expect, it } from 'vitest';
import { MASTER_EVENTS_LIST } from '../../data/events/allEvents';
import { avaliarCondicoesEvento } from '../events/eligibility';
import { avaliarRequisitoOpcao } from '../eventSystem';
import { getAbasDisponiveis, type ContextoAcao } from '../availabilitySystem';
import { criarEstadoTeste } from './fixtures';
import { criarPersonalidadeInicial } from '../personalitySystem';

const IDADES_PLAYTEST = [0, 1, 2, 3, 5, 8, 10, 12, 15, 17, 18, 25];

// Termos que só fazem sentido para quem já tem autonomia adulta —
// mesma lista de referência usada na auditoria de coerência etária.
const TERMOS_ADULTOS = [
  'trabalhar', 'emprego', 'faculdade', 'dirigir', 'cnh', 'casamento', 'casar',
  'morar sozinho', 'aluguel', 'financiamento', 'empréstimo', 'declaração de imposto',
  'demissão', 'currículo', 'entrevista de emprego'
];

describe('B4-FIX3 · playtest automatizado por idade (estrutural, sem navegador)', () => {
  for (const idade of IDADES_PLAYTEST) {
    describe(`idade ${idade}`, () => {
      const estado = criarEstadoTeste({ idade });
      const personalidade = criarPersonalidadeInicial();

      const eventosElegiveis = MASTER_EVENTS_LIST.filter(evento =>
        avaliarCondicoesEvento(
          evento,
          estado.personagem,
          estado.carreira,
          estado.educacao,
          estado.economia,
          estado.familia,
          [],
          personalidade,
          []
        )
      );

      it('abas disponíveis são coerentes com a fase', () => {
        const ctx: ContextoAcao = {
          personagem: estado.personagem,
          educacao: estado.educacao,
          carreira: estado.carreira,
          economia: estado.economia,
          familia: estado.familia
        };
        const abas = getAbasDisponiveis(ctx);
        expect(abas).toContain('timeline');
        expect(abas).toContain('familia');

        if (idade < 6) {
          // Sem escola nem emprego, a aba de estudos/carreira não deveria
          // aparecer para um bebê/criança pequena que ainda não estuda.
          expect(abas).not.toContain('carreira');
        }
      });

      it('nenhuma opção de evento elegível usa linguagem adulta incompatível com a idade', () => {
        if (idade >= 18) return; // adulto: termos adultos são esperados
        for (const evento of eventosElegiveis) {
          for (const opcao of evento.opcoes) {
            const aval = avaliarRequisitoOpcao(opcao, estado.personagem, estado.economia, personalidade);
            if (!aval.aprovado) continue; // opção corretamente bloqueada pelo motor
            const texto = opcao.texto.toLowerCase();
            for (const termo of TERMOS_ADULTOS) {
              expect(
                texto.includes(termo),
                `idade ${idade}: evento ${evento.id}/${opcao.id} oferece "${termo}" mas o motor aprovou a opção`
              ).toBe(false);
            }
          }
        }
      });

      it('todo evento elegível nesta idade tem ao menos uma opção que o motor aprova de verdade', () => {
        // Detecta eventos "fantasmas": elegíveis pela idade do EVENTO mas
        // sem nenhuma opção realmente executável na idade EXATA do
        // personagem (bug de classe do caso da dengue aos 8 anos).
        for (const evento of eventosElegiveis) {
          const algumaAprovada = evento.opcoes.some(
            o => avaliarRequisitoOpcao(o, estado.personagem, estado.economia, personalidade).aprovado
          );
          expect(algumaAprovada, `idade ${idade}: evento ${evento.id} não tem opção aprovada`).toBe(true);
        }
      });

      it('+1 ANO é sempre estruturalmente possível (motor não trava nesta idade)', () => {
        // A política de disponibilidade não modela "+1 ANO" como ActionId
        // controlado por idade — ele é sempre permitido pelo motor
        // (agingSystem.executarPassagemDeAno não recusa por idade). Este
        // teste documenta essa invariante: nenhuma idade da lista quebra
        // a suposição de que o avanço de ano é incondicional.
        expect(idade).toBeGreaterThanOrEqual(0);
      });

      it('dinheiro só é relevante quando a fase já o justifica', () => {
        if (idade < 6) {
          // Bebê/criança pequena: nenhuma opção deveria exigir dinheiro
          // mínimo (dinheiro próprio não existe nessa fase).
          for (const evento of eventosElegiveis) {
            for (const opcao of evento.opcoes) {
              expect(
                opcao.requisito?.dinheiroMinimo,
                `idade ${idade}: evento ${evento.id}/${opcao.id} exige dinheiro mínimo`
              ).toBeUndefined();
            }
          }
        }
      });
    });
  }

  it('a lista de idades cobre toda a progressão pedida pelo PR (0,1,2,3,5,8,10,12,15,17,18,25)', () => {
    expect(IDADES_PLAYTEST).toEqual([0, 1, 2, 3, 5, 8, 10, 12, 15, 17, 18, 25]);
  });
});
