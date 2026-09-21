/**
 * B4-FIX2 — testes de regressão dos bugs REAIS reportados no playtest,
 * identificados por ID (nunca por título/texto):
 *
 * 1. "Tarde na Casa dos Avós" (`fam_visita_avo`) repetindo em anos
 *    seguidos (a simulação forense da sessão anterior mediu até 5
 *    ocorrências na mesma vida).
 * 2. "O Primeiro Celular Próprio" (`ado_smartphone`) sem nenhum controle
 *    de repetição, podendo "ganhar o celular" mais de uma vez.
 * 3. "Primeiros Passos" (`inf_primeiros_passos`) precisa continuar existindo
 *    mas nunca pode ser sorteado de novo depois de resolvido (é marco de
 *    desenvolvimento, não sorteio aleatório repetível).
 * 4. "Você dedicou o ano aos estudos..." reaparecendo palavra por palavra
 *    — o texto vem de `educationSystem.processarAnoEducacao`, um pipeline
 *    diferente do `eventSystem`, e não tinha nenhuma variação textual.
 *
 * Cada teste consulta o EVENTO REAL do jogo (`MASTER_EVENTS_LIST`), não uma
 * cópia local — garante que a correção sobrevive a qualquer edição futura
 * dos dados de evento.
 */

import { describe, it, expect } from 'vitest';
import { MASTER_EVENTS_LIST } from '../../data/events/allEvents';
import { resolverPoliticaRepeticao, eventoDisponivelPorRepeticao } from '../events/repetitionPolicy';
import { processarAnoEducacao } from '../educationSystem';
import { criarPersonagemTeste } from './fixtures';
import type { EventOccurrence } from '../../types';

function encontrarEventoReal(id: string) {
  const evento = MASTER_EVENTS_LIST.find(e => e.id === id);
  if (!evento) throw new Error(`Evento ${id} não encontrado em MASTER_EVENTS_LIST`);
  return evento;
}

describe('B4-FIX2 · regressão — "Tarde na Casa dos Avós" (fam_visita_avo)', () => {
  const evento = encontrarEventoReal('fam_visita_avo');

  it('tem uma política de repetição explícita (não fica sem controle nenhum)', () => {
    const politica = resolverPoliticaRepeticao(evento);
    expect(politica.tipo).toBe('cooldown');
    expect(politica.cooldownAnos).toBeGreaterThanOrEqual(2);
  });

  it('não pode ser sorteado de novo no ano seguinte a uma ocorrência (bug original: até 5x na mesma vida)', () => {
    const ocorrenciaAnterior: EventOccurrence[] = [{ eventId: evento.id, idade: 10, ano: 2030 }];
    // Um ano depois: ainda dentro do cooldown, não deveria estar disponível.
    const disponivelUmAnoDepois = eventoDisponivelPorRepeticao(evento, 11, [evento.id], ocorrenciaAnterior);
    expect(disponivelUmAnoDepois).toBe(false);
  });

  it('volta a ficar disponível só depois do intervalo mínimo de idade', () => {
    const ocorrenciaAnterior: EventOccurrence[] = [{ eventId: evento.id, idade: 10, ano: 2030 }];
    const politica = resolverPoliticaRepeticao(evento);
    const idadeAposCooldown = 10 + (politica.cooldownAnos ?? 4);
    const disponivel = eventoDisponivelPorRepeticao(evento, idadeAposCooldown, [evento.id], ocorrenciaAnterior);
    expect(disponivel).toBe(true);
  });
});

describe('B4-FIX2 · regressão — "O Primeiro Celular Próprio" (ado_smartphone)', () => {
  const evento = encontrarEventoReal('ado_smartphone');

  it('é marcado como único (bug original: nenhum controle, podia repetir)', () => {
    expect(evento.unico).toBe(true);
    const politica = resolverPoliticaRepeticao(evento);
    expect(politica.tipo).toBe('unica');
  });

  it('depois de disparado uma vez, nunca mais é elegível para sorteio', () => {
    const disponivel = eventoDisponivelPorRepeticao(evento, 14, [evento.id], []);
    expect(disponivel).toBe(false);
  });
});

describe('B4-FIX2 · regressão — "Primeiros Passos" (inf_primeiros_passos)', () => {
  const evento = encontrarEventoReal('inf_primeiros_passos');

  it('continua existindo (o PR pediu para não removê-lo)', () => {
    expect(evento).toBeTruthy();
    expect(evento.titulo).toBe('Primeiros Passos');
  });

  it('é tratado como MARCO de desenvolvimento, não sorteio aleatório repetível', () => {
    const politica = resolverPoliticaRepeticao(evento);
    expect(politica.tipo).toBe('marco');
  });

  it('nunca reaparece depois de resolvido, em nenhuma idade posterior', () => {
    for (const idadeFutura of [2, 5, 10, 18, 30]) {
      const disponivel = eventoDisponivelPorRepeticao(evento, idadeFutura, [evento.id], []);
      expect(disponivel, `idade ${idadeFutura}`).toBe(false);
    }
  });

  it('tem mais de uma opção coerente (não é sempre idêntico em toda vida)', () => {
    expect(evento.opcoes.length).toBeGreaterThanOrEqual(2);
    const idsUnicos = new Set(evento.opcoes.map(o => o.id));
    expect(idsUnicos.size).toBe(evento.opcoes.length);
  });
});

describe('B4-FIX3 · regressão — "Guerra pelo Controle da TV" (fam_briga_controle_tv) não domina anos diferentes', () => {
  const evento = encontrarEventoReal('fam_briga_controle_tv');

  it('ganhou política de repetição explícita (antes caía no padrão implícito, cooldown de só 2 anos)', () => {
    const politica = resolverPoliticaRepeticao(evento);
    expect(politica.tipo).toBe('cooldown');
    expect(politica.cooldownAnos).toBeGreaterThanOrEqual(3);
  });

  it('respeita o cooldown: não fica disponível de novo antes do intervalo mínimo', () => {
    const ocorrenciaAnterior: EventOccurrence = { eventId: evento.id, idade: 8, ano: 2030, categoria: evento.categoria };
    for (let idade = 8; idade < 8 + (resolverPoliticaRepeticao(evento).cooldownAnos ?? 3); idade++) {
      const disponivel = eventoDisponivelPorRepeticao(evento, idade, [evento.id], [ocorrenciaAnterior]);
      expect(disponivel, `idade ${idade}`).toBe(false);
    }
  });

  it('peso relativo foi reduzido (não compete com o mesmo destaque de antes na primeira sorteada)', () => {
    // Não é uma regra rígida de "peso máximo X", mas o evento não pode
    // continuar com o mesmo peso alto (80) que tinha quando dominava o
    // playtest — reduzido junto com o cooldown mais longo.
    expect(evento.peso).toBeLessThan(80);
  });
});

describe('B4-FIX3 · regressão — "A Tradicional Macarronada de Domingo" não é mais falsa escolha', () => {
  const evento = encontrarEventoReal('ext_macarronada_domingo');

  it('tem 2+ desfechos genuinamente diferentes (antes tinha exatamente 1 — falsa decisão)', () => {
    expect(evento.opcoes.length).toBeGreaterThanOrEqual(2);
    // F3 — a distinção passou a ser medida em `descricaoResultado` e não em
    // `texto`. Este é um ACONTECIMENTO: o motor sorteia o desfecho e o
    // jogador nunca vê um botão, então `texto` foi esvaziado no passo 8 (o
    // rótulo de botão num evento que não pergunta nada era justamente o que
    // convidava a escrever deliberação onde não houve escolha).
    //
    // O que o teste protege continua idêntico: o evento não pode ter um
    // desfecho só, e os desfechos não podem ser o mesmo texto repetido.
    // Agora ele mede o texto que o jogador realmente lê.
    const desfechos = evento.opcoes.map(o => (o.descricaoResultado ?? '').trim().toLowerCase());
    expect(new Set(desfechos).size).toBe(desfechos.length);
  });

  it('as opções têm consequências realmente diferentes entre si (não é a mesma escolha maquiada)', () => {
    const [primeira, segunda] = evento.opcoes;
    expect(primeira.consequencias).not.toEqual(segunda.consequencias);
  });

  it('ganhou cooldown explícito (antes não tinha nenhuma política própria)', () => {
    const politica = resolverPoliticaRepeticao(evento);
    expect(politica.tipo).toBe('cooldown');
  });
});

describe('B4-FIX3 · regressão — "Primeiros Passos" não vira competição de atributos', () => {
  const evento = encontrarEventoReal('inf_primeiros_passos');

  it('nenhuma opção usa linguagem de pontuação/competição (ex.: "vencer", "ranking", "pontos")', () => {
    const PADRAO_COMPETITIVO = /(vencer|ranking|pontua|placar|competi[cç][aã]o)/i;
    for (const opcao of evento.opcoes) {
      expect(PADRAO_COMPETITIVO.test(opcao.texto)).toBe(false);
      expect(PADRAO_COMPETITIVO.test(opcao.descricaoResultado ?? '')).toBe(false);
    }
  });

  it('continua sendo um marco (não pode ser sorteado de novo), mas outros eventos de 0-2 anos competem pelo mesmo espaço', () => {
    // B4-FIX3 — antes deste PR a faixa 0-2 tinha só este evento; agora
    // "Primeiros Passos" precisa competir de verdade com outros
    // acontecimentos de desenvolvimento (ver earlyChildhood/babyEvents.ts).
    const outrosNaFaixa = MASTER_EVENTS_LIST.filter(
      e => e.id !== evento.id && e.idadeMinima <= 2 && e.idadeMaxima >= 1
    );
    expect(outrosNaFaixa.length).toBeGreaterThan(0);
  });
});

describe('B4-FIX2 · regressão — "Você dedicou o ano aos estudos..." (postura escolar)', () => {
  it('o texto do log de escola varia entre chamadas com a mesma postura (não é mais uma frase fixa)', () => {
    const personagem = criarPersonagemTeste({ idade: 10 });
    const eduBase = {
      nivelAtual: 'fundamental_incompleto' as const,
      emCurso: true,
      tipoCurso: 'fundamental' as const,
      nomeCurso: 'Ensino Fundamental',
      desempenho: 60,
      cursosConcluidos: [] as { nome: string; tipo: string; anoConclusao: number }[]
    };

    const textosGerados = new Set<string>();
    for (let ano = 2020; ano < 2020 + 30; ano++) {
      const res = processarAnoEducacao({ ...eduBase, posturaAno: 'estudar' }, personagem, ano);
      const log = res.logsEducacao.find(l => l.categoria === 'escola');
      if (log) textosGerados.add(log.texto);
    }

    // Antes da correção, era sempre a MESMA string. Agora deve haver mais
    // de uma variação genuína dentro de 30 tentativas.
    expect(textosGerados.size).toBeGreaterThan(1);
  });

  it('o pipeline de educação é INDEPENDENTE do eventSystem — não usa MASTER_EVENTS_LIST', () => {
    // Confirma a causa raiz documentada: a postura escolar nunca passou
    // por `historicoEventosDisparados`/`sortearEventoDoAno`. Isso não é
    // um bug em si (arquiteturalmente correto ter pipelines diferentes
    // para evento-com-decisão vs. resultado-de-ação), mas precisa
    // continuar sendo esse tipo de coisa, não confundir os dois.
    const personagem = criarPersonagemTeste({ idade: 10 });
    const eduBase = {
      nivelAtual: 'fundamental_incompleto' as const,
      emCurso: true,
      tipoCurso: 'fundamental' as const,
      nomeCurso: 'Ensino Fundamental',
      desempenho: 60,
      posturaAno: 'estudar' as const,
      cursosConcluidos: [] as { nome: string; tipo: string; anoConclusao: number }[]
    };
    const res = processarAnoEducacao(eduBase, personagem, 2030);
    // O resultado não referencia nenhum id de MASTER_EVENTS_LIST.
    const idsDeEventos = new Set(MASTER_EVENTS_LIST.map(e => e.id));
    for (const log of res.logsEducacao) {
      expect(idsDeEventos.has(log.texto)).toBe(false);
    }
  });
});
