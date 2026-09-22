/**
 * Gera um save VÁLIDO usando os sistemas reais do jogo e o imprime como JSON.
 *
 * O smoke test precisa provar que "recarregar a página e continuar" funciona.
 * Um objeto inventado à mão não serve: `migrarEstadoSalvo` valida o formato e
 * descarta o que não reconhece, então um save falso testaria a rejeição, não a
 * retomada. Aqui o estado nasce dos mesmos construtores que o jogo usa.
 *
 * Uso: npx tsx scripts/itch/gerarSaveReal.ts
 */

import { criarEstadoTeste } from '../../src/systems/__tests__/fixtures';
import { criarPersonalidadeInicial } from '../../src/systems/personalitySystem';
import { criarCalendarioInicial } from '../../src/systems/calendario/tipos';
import { VERSAO_SAVE } from '../../src/systems/saveSystem';

const base = criarEstadoTeste({ idade: 12, personagem: { nome: 'Joana Ribeiro' } });

const save = {
  versao: VERSAO_SAVE,
  personagem: base.personagem,
  familia: base.familia,
  educacao: base.educacao,
  carreira: base.carreira,
  economia: base.economia,
  personalidade: criarPersonalidadeInicial(),
  timeline: [
    {
      id: 'nasc',
      idade: 0,
      ano: 2026,
      categoria: 'geral',
      texto: 'Você nasceu em Marília, SP.'
    }
  ],
  eventoAtivoId: null,
  historicoEventosDisparados: [],
  historicoOcorrenciasEventos: [],
  calendario: criarCalendarioInicial(),
  acoesRealizadasAno: [],
  registroTemporal: { usos: {} },
  emJogo: true,
  morto: false
};

console.log(JSON.stringify(save));
