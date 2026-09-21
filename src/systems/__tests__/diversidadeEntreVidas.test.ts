/**
 * B4-FIX3 item 30 — teste de diversidade entre vidas (obrigatório).
 *
 * Simula 60 seeds diferentes (0 → 17 anos, o recorte pedido pelo PR) pelo
 * PIPELINE REAL do jogo (`executarPassagemDeAno` +
 * `aplicarConsequenciasEscolha`, os mesmos que `useGame` chama), e mede
 * exatamente o que o playtest apontou como problema: será que
 * "Primeiros Passos → Casa dos Avós → Macarronada" ainda domina o
 * começo das vidas?
 *
 * Importante (instrução explícita do PR): não definir sucesso só como
 * "zero violações de cooldown" — isso já está coberto em
 * `simulacaoLongaVidas.test.ts`. Aqui a métrica é VARIEDADE PERCEBIDA:
 * sequência dos primeiros acontecimentos, quantas vidas começam
 * idênticas, distribuição de contexto, overlap entre vidas.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../utils/random';
import { executarPassagemDeAno } from '../agingSystem';
import { aplicarConsequenciasEscolha } from '../eventSystem';
import { resolverPoliticaRepeticao, cooldownEfetivo } from '../events/repetitionPolicy';
import { criarEstadoTeste } from './fixtures';
import { criarPersonalidadeInicial } from '../personalitySystem';
import type { EventOccurrence, GameEvent, PersonalityState } from '../../types';

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
  contextos: string[];
}

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
  const contextos: string[] = [];

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

    // B4-FIX4 — a diversidade que este arquivo mede é a do que a pessoa
    // VIVEU, e a maior parte disso deixou de passar por `eventoDisparado`:
    // acontecimentos são resolvidos pelo próprio motor e chegam aqui em
    // `ocorrencia`. Ler só as decisões media uma fatia cada vez menor da
    // vida — e foi o que fez uma semente aparecer com "1 evento na vida
    // inteira" quando, de fato, ela tinha vivido uma dúzia.
    //
    // As checagens de repetição valem para as DUAS naturezas: cooldown e
    // unicidade nunca dependeram de quem resolveu o evento.
    const eventoDoAno: GameEvent | null =
      resultado.eventoDisparado ?? resultado.acontecimentoResolvido;

    if (eventoDoAno) {
      const evento: GameEvent = eventoDoAno;
      const politica = resolverPoliticaRepeticao(evento);
      contextos.push(evento.categoria);

      if (politica.tipo === 'unica' || politica.tipo === 'marco') {
        if (historicoDisparados.includes(evento.id)) {
          repeticoesUnicoOuMarco.push(evento.id);
        }
      }

      const ultima = [...historicoOcorrencias].reverse().find(o => o.eventId === evento.id);
      if (ultima) {
        const intervalo = personagem.idade - ultima.idade;
        // Mesma conta que o motor usa de verdade (repetitionPolicy):
        // nunca reimplementar o cálculo de cooldown num teste.
        const minimo = cooldownEfetivo(politica);
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
        if (intervalo === 1 && minimo > 1) {
          repeticoesConsecutivas.push({ eventId: evento.id, idade: personagem.idade });
        }
      }

      historicoDisparados = [...historicoDisparados, evento.id];
      historicoOcorrencias = [
        ...historicoOcorrencias,
        resultado.ocorrencia ?? {
          eventId: evento.id,
          idade: personagem.idade,
          ano: personagem.anoAtual,
          categoria: evento.categoria
        }
      ];

      // Só DECISÃO precisa de resposta: o acontecimento o motor já
      // resolveu e já aplicou antes de devolver o resultado do ano.
      const opcao = resultado.eventoDisparado
        ? evento.opcoes.find(o => !o.requisito) ?? evento.opcoes[0]
        : undefined;
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
    repeticoesConsecutivas,
    contextos
  };
}

afterEach(resetarFonteAleatoria);

// 60 seeds — custo de execução baixo (pipeline síncrono, sem I/O), dentro
// da recomendação do PR (50 mínimo, 100 se barato).
const SEEDS = Array.from({ length: 60 }, (_, i) => i * 97 + 3);
const IDADE_FINAL = 17;

describe('B4-FIX3 · diversidade entre 60 vidas simuladas (0→17 anos)', () => {
  const resultados = SEEDS.map(seed => ({ seed, ...simularVida(seed, IDADE_FINAL) }));

  it('sanidade: toda vida produziu ao menos alguns acontecimentos', () => {
    for (const r of resultados) {
      expect(r.acontecimentos.length, `seed ${r.seed}`).toBeGreaterThan(0);
    }
  });

  it('nenhuma vida viola cooldown, unique/marco ou repete em anos consecutivos (base da correção do B4-FIX2, ainda válida)', () => {
    for (const r of resultados) {
      expect(r.faltasDeCooldown, `seed ${r.seed}`).toEqual([]);
      expect(r.repeticoesUnicoOuMarco, `seed ${r.seed}`).toEqual([]);
      expect(r.repeticoesConsecutivas, `seed ${r.seed}`).toEqual([]);
    }
  });

  it('a sequência dos primeiros 3 acontecimentos NÃO é a mesma em todas as vidas (bug do playtest corrigido)', () => {
    const primeiros3 = resultados.map(r => r.acontecimentos.slice(0, 3).map(a => a.eventId).join('>'));
    const distintos = new Set(primeiros3);
    // Antes da expansão de conteúdo, era comum a sequência
    // "Primeiros Passos > Casa dos Avós > Macarronada" dominar quase
    // todas as vidas. Aqui exigimos que a MAIORIA das 60 vidas simuladas
    // tenha uma sequência diferente das outras — não exatamente 60
    // distintas (a idade automaticamente filtra o pool disponível nos
    // primeiros anos, então alguma coincidência é esperada), mas nunca
    // uma única sequência dominante.
    const contagemPorSequencia = new Map<string, number>();
    for (const seq of primeiros3) {
      contagemPorSequencia.set(seq, (contagemPorSequencia.get(seq) ?? 0) + 1);
    }
    const maiorGrupo = Math.max(...contagemPorSequencia.values());
    expect(distintos.size).toBeGreaterThan(1);
    // Nenhuma sequência única domina mais da metade das vidas simuladas.
    expect(maiorGrupo).toBeLessThan(resultados.length / 2);
  });

  it('a sequência dos primeiros 5 acontecimentos tem diversidade real', () => {
    const primeiros5 = resultados.map(r => r.acontecimentos.slice(0, 5).map(a => a.eventId).join('>'));
    const distintos = new Set(primeiros5);
    // Com 5 acontecimentos o espaço de combinações já é grande o
    // suficiente para esperar bem mais variedade que só 3.
    expect(distintos.size).toBeGreaterThanOrEqual(Math.ceil(resultados.length * 0.5));
  });

  it('quantas sequências (3 primeiros) são idênticas — reportado, não um bug em si se pequeno', () => {
    const primeiros3 = resultados.map(r => r.acontecimentos.slice(0, 3).map(a => a.eventId).join('>'));
    const contagem = new Map<string, number>();
    for (const seq of primeiros3) contagem.set(seq, (contagem.get(seq) ?? 0) + 1);
    const duplicadas = [...contagem.values()].filter(c => c > 1).reduce((s, c) => s + c, 0);
    // Reportar via console para o relatório final poder citar o número
    // exato observado nesta execução determinística.
    console.log(`[diversidade] sequências (3 primeiros) duplicadas: ${duplicadas} de ${resultados.length} vidas`);
    expect(duplicadas).toBeLessThan(resultados.length); // nunca TODAS iguais
  });

  it('evento mais frequente por idade não é sempre o mesmo id em todas as vidas', () => {
    const porIdade = new Map<number, Map<string, number>>();
    for (const r of resultados) {
      for (const a of r.acontecimentos) {
        if (!porIdade.has(a.idade)) porIdade.set(a.idade, new Map());
        const mapa = porIdade.get(a.idade)!;
        mapa.set(a.eventId, (mapa.get(a.eventId) ?? 0) + 1);
      }
    }
    // Para cada idade com dados suficientes, o evento mais comum não deve
    // aparecer em praticamente 100% das vidas que tiveram algum evento
    // naquela idade — evidência de que o pool realmente compete.
    for (const [idade, mapa] of porIdade.entries()) {
      const total = [...mapa.values()].reduce((s, c) => s + c, 0);
      if (total < 10) continue; // amostra pequena demais para concluir
      const maiorFreq = Math.max(...mapa.values());
      expect(maiorFreq / total, `idade ${idade}`).toBeLessThan(1);
    }
  });

  it('contexto/categoria: distribuição percentual não é dominada por "familia" (bug de design corrigido)', () => {
    const todosContextos = resultados.flatMap(r => r.contextos);
    const contagem = new Map<string, number>();
    for (const c of todosContextos) contagem.set(c, (contagem.get(c) ?? 0) + 1);
    const total = todosContextos.length;

    const percentuais: Record<string, string> = {};
    for (const [cat, n] of contagem.entries()) {
      percentuais[cat] = `${((100 * n) / total).toFixed(1)}%`;
    }
    console.log('[diversidade] distribuição de contexto (0-17, 60 vidas):', percentuais);

    const percFamilia = (contagem.get('familia') ?? 0) / total;
    // Antes da expansão, família dominava boa parte da infância. O PR
    // não define um teto arbitrário, mas exige que família NÃO seja
    // esmagadoramente maioria — menos da metade dos acontecimentos.
    expect(percFamilia).toBeLessThan(0.5);

    // Pelo menos 4 contextos diferentes aparecem de fato no conjunto
    // simulado (evidência de que o mundo não é só "escola e família").
    expect(contagem.size).toBeGreaterThanOrEqual(4);
  });

  it('quantidade de IDs únicos por vida — reportado (sanidade: nunca é 1 evento só)', () => {
    for (const r of resultados) {
      const unicos = new Set(r.acontecimentos.map(a => a.eventId)).size;
      expect(unicos, `seed ${r.seed}`).toBeGreaterThan(1);
    }
  });

  it('overlap médio entre pares de vidas é reportado, sem definir % arbitrário de aprovação', () => {
    const idsPorVida = resultados.map(r => new Set(r.acontecimentos.map(a => a.eventId)));
    const overlaps: number[] = [];
    // Amostra de pares (todos os pares seria O(n²) desnecessário para 60):
    // compara vida i com i+1, cobrindo todas uma vez.
    for (let i = 0; i < idsPorVida.length - 1; i++) {
      const a = idsPorVida[i];
      const b = idsPorVida[i + 1];
      const inter = [...a].filter(id => b.has(id));
      const menor = Math.min(a.size, b.size) || 1;
      overlaps.push(inter.length / menor);
    }
    const media = overlaps.reduce((s, v) => s + v, 0) / overlaps.length;
    console.log(`[diversidade] overlap médio entre pares consecutivos de vidas (0-17): ${(media * 100).toFixed(1)}%`);
    // Overlap esperado (pool compartilhado): nem 0% (viveriam em universos
    // sem nada em comum) nem 100% (vidas clonadas).
    expect(media).toBeGreaterThan(0);
    expect(media).toBeLessThan(1);
  });

  it('máximo de aparições de um mesmo evento recorrente por vida — reportado', () => {
    const maximos = resultados.map(r => {
      const contagem = new Map<string, number>();
      for (const a of r.acontecimentos) contagem.set(a.eventId, (contagem.get(a.eventId) ?? 0) + 1);
      return Math.max(0, ...contagem.values());
    });
    const maiorGeral = Math.max(...maximos);
    console.log(`[diversidade] maior frequência de um único evento numa vida (0-17, 60 seeds): ${maiorGeral}`);
    // Em 17 anos, nenhum evento isolado deveria dominar (ex.: aparecer
    // praticamente todo ano) — sinal de dominação de pool não corrigida.
    expect(maiorGeral).toBeLessThanOrEqual(5);
  });
});
