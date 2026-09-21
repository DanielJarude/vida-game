/**
 * B4-FIX2 — simulação longa (múltiplas seeds, 0 → 25 anos).
 *
 * Formaliza em teste permanente o que a investigação forense da sessão
 * anterior fez com um script temporário (removido). Roda o PIPELINE REAL
 * do jogo (`executarPassagemDeAno` + `aplicarConsequenciasEscolha`,
 * exatamente o que `useGame.envelhecerAno`/`responderEvento` chamam) sob
 * uma fonte de aleatoriedade determinística, para várias seeds, e mede:
 *
 * - total de acontecimentos e quantos ids únicos apareceram;
 * - repetição de evento UNIQUE/MARCO (deve ser sempre 0 — bug corrigido);
 * - violação de cooldown, ou seja, duas ocorrências do mesmo id com menos
 *   anos de intervalo do que a política exige (deve ser sempre 0);
 * - repetição em anos consecutivos (o cooldown sistêmico mínimo é 1 ano
 *   para recorrentes sem cooldown explícito — nunca deveria repetir 2 anos
 *   seguidos);
 * - maior frequência de um único id numa vida;
 * - distribuição de acontecimentos por faixa etária;
 * - overlap de ids entre vidas diferentes de seeds distintas (reportado,
 *   sem % arbitrário de aprovação — só registrado e sem contradizer o
 *   comportamento esperado: universos de eventos compartilhados produzem
 *   overlap, isso não é bug).
 *
 * PRNG: mulberry32, só para tornar a simulação determinística e
 * reproduzível entre execuções — não é lógica de produção.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../utils/random';
import { executarPassagemDeAno } from '../agingSystem';
import { aplicarConsequenciasEscolha } from '../eventSystem';
import { resolverPoliticaRepeticao, COOLDOWN_PADRAO_RECORRENTE } from '../events/repetitionPolicy';
import { criarEstadoTeste } from './fixtures';
import { criarPersonalidadeInicial } from '../personalitySystem';
import type { EventOccurrence, PersonalityState } from '../../types';

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ResultadoVida {
  acontecimentos: EventOccurrence[];
  faltasDeCooldown: { eventId: string; idadeAnterior: number; idadeAtual: number; minimo: number }[];
  repeticoesUnicoOuMarco: string[];
  repeticoesConsecutivas: { eventId: string; idade: number }[];
}

/** Roda uma vida inteira de 0 a `idadeFinal`, escolhendo sempre a primeira opção elegível do evento sorteado. */
function simularVida(seed: number, idadeFinal: number): ResultadoVida {
  definirFonteAleatoria(mulberry32(seed));

  const estado = criarEstadoTeste({ idade: 0 });
  let personagem = estado.personagem;
  let familia = estado.familia;
  let educacao = estado.educacao;
  let carreira = estado.carreira;
  let economia = estado.economia;
  let personalidade: PersonalityState = criarPersonalidadeInicial();
  let historicoDisparados: string[] = [];
  let historicoOcorrencias: EventOccurrence[] = [];

  const faltasDeCooldown: ResultadoVida['faltasDeCooldown'] = [];
  const repeticoesUnicoOuMarco: string[] = [];
  const repeticoesConsecutivas: ResultadoVida['repeticoesConsecutivas'] = [];

  while (personagem.idade < idadeFinal) {
    const resultado = executarPassagemDeAno(
      personagem,
      familia,
      educacao,
      carreira,
      economia,
      historicoDisparados,
      personalidade,
      historicoOcorrencias
    );

    personagem = resultado.personagemAtualizado;
    familia = resultado.familiaAtualizada;
    educacao = resultado.educacaoAtualizada;
    carreira = resultado.carreiraAtualizada;
    economia = resultado.economiaAtualizada;

    if (resultado.morreu) break;

    if (resultado.eventoDisparado) {
      const evento = resultado.eventoDisparado;
      const politica = resolverPoliticaRepeticao(evento);

      // --- Medição: unique/marco não pode repetir ---
      if (politica.tipo === 'unica' || politica.tipo === 'marco') {
        if (historicoDisparados.includes(evento.id)) {
          repeticoesUnicoOuMarco.push(evento.id);
        }
      }

      // --- Medição: cooldown mínimo respeitado ---
      const ultima = [...historicoOcorrencias].reverse().find(o => o.eventId === evento.id);
      if (ultima) {
        const intervalo = personagem.idade - ultima.idade;
        const minimo =
          politica.cooldownAnos ??
          (politica.tipo === 'cooldown' ? 3 : COOLDOWN_PADRAO_RECORRENTE);
        if (politica.tipo === 'cooldown' || politica.tipo === 'recorrente') {
          if (intervalo < minimo) {
            faltasDeCooldown.push({
              eventId: evento.id,
              idadeAnterior: ultima.idade,
              idadeAtual: personagem.idade,
              minimo
            });
          }
        }
        if (intervalo === 1) {
          repeticoesConsecutivas.push({ eventId: evento.id, idade: personagem.idade });
        }
      }

      historicoDisparados = [...historicoDisparados, evento.id];
      historicoOcorrencias = [
        ...historicoOcorrencias,
        { eventId: evento.id, idade: personagem.idade, ano: personagem.anoAtual }
      ];

      // Resolve a escolha: pega a primeira opção sem requisito, ou a
      // primeira de todas se todas tiverem requisito (o motor recusa sem
      // efeito colateral quando não cumprido — seguro para a simulação).
      const opcao = evento.opcoes.find(o => !o.requisito) ?? evento.opcoes[0];
      if (opcao) {
        const res = aplicarConsequenciasEscolha(
          opcao,
          personagem,
          carreira,
          educacao,
          economia,
          familia,
          personagem.anoAtual,
          { eventoId: evento.id, personalidade }
        );
        if (!res.recusado) {
          personagem = res.personagemAtualizado;
          carreira = res.carreiraAtualizada;
          educacao = res.educacaoAtualizada;
          economia = res.economiaAtualizada;
          familia = res.familiaAtualizada;
          if (res.personalidadeAtualizada) personalidade = res.personalidadeAtualizada;
        }
      }
    }
  }

  return {
    acontecimentos: historicoOcorrencias,
    faltasDeCooldown,
    repeticoesUnicoOuMarco,
    repeticoesConsecutivas
  };
}

afterEach(resetarFonteAleatoria);

const SEEDS = [1, 7, 42, 123, 2026, 99999, 555, 8, 31415, 271828];
const IDADE_FINAL = 25;

describe('B4-FIX2 · simulação longa 0→25 anos, múltiplas seeds', () => {
  const resultados = SEEDS.map(seed => ({ seed, ...simularVida(seed, IDADE_FINAL) }));

  it('nenhuma vida simulada repete um evento UNIQUE ou MARCO (bug corrigido)', () => {
    for (const r of resultados) {
      expect(r.repeticoesUnicoOuMarco, `seed ${r.seed}`).toEqual([]);
    }
  });

  it('nenhuma vida simulada viola o cooldown mínimo de um evento (bug corrigido)', () => {
    for (const r of resultados) {
      expect(r.faltasDeCooldown, `seed ${r.seed}`).toEqual([]);
    }
  });

  it('nenhum evento recorrente/cooldown repete em anos consecutivos', () => {
    for (const r of resultados) {
      expect(r.repeticoesConsecutivas, `seed ${r.seed}`).toEqual([]);
    }
  });

  it('reporta total de acontecimentos e ids únicos por vida (sanidade: há eventos reais)', () => {
    for (const r of resultados) {
      expect(r.acontecimentos.length).toBeGreaterThan(0);
      const idsUnicos = new Set(r.acontecimentos.map(a => a.eventId)).size;
      expect(idsUnicos).toBeGreaterThan(0);
      expect(idsUnicos).toBeLessThanOrEqual(r.acontecimentos.length);
    }
  });

  it('reporta a maior frequência de um único id numa vida (não deve ser desproporcional)', () => {
    for (const r of resultados) {
      const contagem = new Map<string, number>();
      for (const a of r.acontecimentos) {
        contagem.set(a.eventId, (contagem.get(a.eventId) ?? 0) + 1);
      }
      const maiorFrequencia = Math.max(0, ...contagem.values());
      // Ao longo de 25 anos, nenhum id isolado deveria dominar a vida
      // inteira — um evento recorrente pode repetir, mas não a cada ano.
      expect(maiorFrequencia, `seed ${r.seed}`).toBeLessThanOrEqual(6);
    }
  });

  it('distribui acontecimentos ao longo de faixas etárias (não concentra tudo numa idade só)', () => {
    const faixas: [number, number][] = [
      [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5],
      [6, 8], [9, 11], [12, 14], [15, 17], [18, 25]
    ];
    const totalPorFaixa = new Map<string, number>();

    for (const r of resultados) {
      for (const a of r.acontecimentos) {
        const faixa = faixas.find(([min, max]) => a.idade >= min && a.idade <= max);
        const chave = faixa ? `${faixa[0]}-${faixa[1]}` : 'fora';
        totalPorFaixa.set(chave, (totalPorFaixa.get(chave) ?? 0) + 1);
      }
    }

    // Pelo menos metade das faixas etárias teve algum acontecimento em
    // alguma das 10 vidas simuladas — não é uma vida "vazia" na infância
    // nem só eventos concentrados na vida adulta.
    const faixasComEventos = [...totalPorFaixa.keys()].filter(k => k !== 'fora').length;
    expect(faixasComEventos).toBeGreaterThanOrEqual(Math.ceil(faixas.length / 2));
  });

  it('overlap de ids entre vidas de seeds diferentes é reportado (pool compartilhado é esperado)', () => {
    const idsPorVida = resultados.map(r => new Set(r.acontecimentos.map(a => a.eventId)));
    const [primeira, segunda] = idsPorVida;
    const intersecao = [...primeira].filter(id => segunda.has(id));

    // Não define um % de aprovação arbitrário: só confirma que a métrica é
    // computável e que nem TODOS os eventos de uma vida são exclusivos
    // dela (esperado, já que o pool de eventos é compartilhado entre
    // vidas) nem duas vidas são idênticas (a aleatoriedade e o histórico
    // de cada vida produzem trajetórias diferentes).
    expect(intersecao.length).toBeGreaterThan(0);
    expect(intersecao.length).toBeLessThan(primeira.size);
  });

  it('vidas com seeds diferentes produzem sequências de acontecimentos diferentes (diversidade real)', () => {
    const assinaturas = resultados.map(r =>
      r.acontecimentos.map(a => `${a.idade}:${a.eventId}`).join('|')
    );
    expect(new Set(assinaturas).size).toBe(assinaturas.length);
  });
});
