/**
 * B4-FIX4 — ACONTECIMENTOS: a vida que acontece sozinha.
 *
 * O que este arquivo protege é a promessa central do PR: existe diferença
 * entre o que aconteceu com a pessoa e o que a pessoa decidiu fazer, e essa
 * diferença tem efeito mecânico real — não é só rótulo.
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  categoriaDeLogDoEvento,
  desfechoSemMarcaDeEscolha,
  sortearDesfecho,
  tomDoDesfecho
} from '../happenings';
import { naturezaDoEvento, exigeAcontecimentoPorIdade, IDADE_SEM_DECISAO_CONSCIENTE } from '../nature';
import { classificacaoDoEvento } from '../taxonomia';
import { executarPassagemDeAno } from '../../agingSystem';
import { criarEstadoTeste } from '../../__tests__/fixtures';
import { criarPersonalidadeInicial } from '../../personalitySystem';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../../utils/random';
import { MASTER_EVENTS_LIST } from '../../../data/events/allEvents';
import type { EventOccurrence, EventOption, GameEvent, PersonalityState } from '../../../types';

afterEach(resetarFonteAleatoria);

function eventoDeTeste(opcoes: EventOption[], parcial: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'teste_acontecimento',
    titulo: 'Teste',
    descricao: 'Descrição de teste.',
    idadeMinima: 0,
    idadeMaxima: 99,
    categoria: 'cotidiano',
    peso: 10,
    natureza: 'acontecimento',
    opcoes,
    ...parcial
  };
}

describe('B4-FIX4 · sorteio do desfecho de um acontecimento', () => {
  const estado = criarEstadoTeste({ idade: 30, economia: { dinheiro: 1000 } });

  it('respeita o peso declarado em cada desfecho', () => {
    const evento = eventoDeTeste([
      { id: 'raro', texto: 'a', peso: 1, consequencias: { stats: { felicidade: 1 } } },
      { id: 'comum', texto: 'b', peso: 9, consequencias: { stats: { felicidade: 1 } } }
    ]);
    // rolagem 0.5 * pesoTotal(10) = 5 → cai no segundo desfecho
    expect(sortearDesfecho(evento, estado.personagem, estado.economia, undefined, () => 0.5)?.id).toBe('comum');
    expect(sortearDesfecho(evento, estado.personagem, estado.economia, undefined, () => 0.05)?.id).toBe('raro');
  });

  it('desfecho sem peso declarado vale 1 (nenhum evento antigo precisa ser reescrito)', () => {
    const evento = eventoDeTeste([
      { id: 'a', texto: 'a', consequencias: { stats: { felicidade: 1 } } },
      { id: 'b', texto: 'b', consequencias: { stats: { felicidade: 1 } } }
    ]);
    expect(sortearDesfecho(evento, estado.personagem, estado.economia, undefined, () => 0.1)?.id).toBe('a');
    expect(sortearDesfecho(evento, estado.personagem, estado.economia, undefined, () => 0.9)?.id).toBe('b');
  });

  it('nunca sorteia um desfecho cujo requisito o personagem não cumpre', () => {
    const crianca = criarEstadoTeste({ idade: 8, economia: { dinheiro: 0 } });
    const evento = eventoDeTeste([
      {
        id: 'so_adulto',
        texto: 'a',
        requisito: { idadeMinima: 18 },
        consequencias: { stats: { felicidade: 1 } }
      },
      { id: 'qualquer_idade', texto: 'b', consequencias: { stats: { felicidade: 1 } } }
    ]);
    for (const rolagem of [0, 0.25, 0.5, 0.75, 0.99]) {
      expect(
        sortearDesfecho(evento, crianca.personagem, crianca.economia, undefined, () => rolagem)?.id
      ).toBe('qualquer_idade');
    }
  });

  it('sem nenhum desfecho viável, devolve null em vez de aplicar algo impossível', () => {
    const crianca = criarEstadoTeste({ idade: 8, economia: { dinheiro: 0 } });
    const evento = eventoDeTeste([
      { id: 'caro', texto: 'a', requisito: { dinheiroMinimo: 999999 }, consequencias: { dinheiro: -1 } }
    ]);
    expect(sortearDesfecho(evento, crianca.personagem, crianca.economia)).toBeNull();
  });
});

describe('B4-FIX4 · um acontecimento nunca caracteriza quem não escolheu', () => {
  it('a marca de escolha é removida do desfecho antes de qualquer aplicação', () => {
    const opcao: EventOption = {
      id: 'x',
      texto: 'x',
      consequencias: {
        stats: { felicidade: 5 },
        impactosComportamentais: { coragem: 3, empatia: 2 }
      }
    };
    const limpo = desfechoSemMarcaDeEscolha(opcao);
    expect(limpo.consequencias.impactosComportamentais).toBeUndefined();
    // O resto das consequências sobrevive intacto.
    expect(limpo.consequencias.stats).toEqual({ felicidade: 5 });
    // E o original não é mutado.
    expect(opcao.consequencias.impactosComportamentais).toEqual({ coragem: 3, empatia: 2 });
  });

  it('uma vida inteira só de acontecimentos NÃO move nenhum traço de personalidade', () => {
    // Regressão de comportamento, não de implementação: simula anos reais
    // pelo motor e confirma que a personalidade continua zerada enquanto o
    // jogador não decidiu nada.
    let semente = 4242;
    definirFonteAleatoria(() => {
      semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
      return semente / 4294967296;
    });

    const estado = criarEstadoTeste({ idade: 0 });
    let p = estado.personagem;
    let f = estado.familia;
    let e = estado.educacao;
    let c = estado.carreira;
    let eco = estado.economia;
    const personalidade: PersonalityState = criarPersonalidadeInicial();
    let disparados: string[] = [];
    let ocorrencias: EventOccurrence[] = [];
    let acontecimentosVividos = 0;

    // 0 → 2 anos: por regra de autonomia, a faixa inteira é acontecimento.
    while (p.idade < IDADE_SEM_DECISAO_CONSCIENTE) {
      const r = executarPassagemDeAno(p, f, e, c, eco, disparados, personalidade, ocorrencias);
      p = r.personagemAtualizado; f = r.familiaAtualizada; e = r.educacaoAtualizada;
      c = r.carreiraAtualizada; eco = r.economiaAtualizada;
      // F3 — o que esta linha protege continua valendo, mas ficou mais
      // preciso. A promessa nunca foi "nada aparece na tela antes dos 3
      // anos"; foi "nada CARACTERIZA um bebê que não deliberou". O Calendário
      // da Vida introduziu a escolha biográfica (`bb_primeira_palavra`, janela
      // 1-2): o jogador escolhe qual foi a primeira palavra, e isso é do
      // jogador, não do bebê — por isso não move traço nenhum, como as duas
      // asserções ao fim deste teste continuam exigindo.
      //
      // Então: um bebê pode receber um marco biográfico, e não pode receber
      // uma decisão comportamental. É a mesma regra do catálogo em
      // `taxonomiaCatalogo.test.ts`, verificada aqui no motor real.
      if (r.eventoDisparado) {
        expect(
          classificacaoDoEvento(r.eventoDisparado),
          `um bebê de ${p.idade} ano(s) recebeu "${r.eventoDisparado.id}" como deliberação`
        ).toBe('escolha_biografica');
      }
      if (r.acontecimentoResolvido) acontecimentosVividos++;
      if (r.ocorrencia) {
        disparados = [...disparados, r.ocorrencia.eventId];
        ocorrencias = [...ocorrencias, r.ocorrencia];
      }
      if (r.morreu) break;
    }

    // A memória de escolhas continua vazia e nenhum eixo saiu do zero.
    expect(personalidade.memorias).toEqual([]);
    for (const intensidade of Object.values(personalidade.tracos)) {
      expect(intensidade).toBe(0);
    }
    // Sanidade: a simulação realmente exercitou o caminho de acontecimento.
    expect(acontecimentosVividos).toBeGreaterThan(0);
  });

  it('o acontecimento resolvido pelo motor JÁ vem aplicado e narrado, sem modal', () => {
    let semente = 909;
    definirFonteAleatoria(() => {
      semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
      return semente / 4294967296;
    });

    const estado = criarEstadoTeste({ idade: 0 });
    let p = estado.personagem;
    let f = estado.familia;
    let e = estado.educacao;
    let c = estado.carreira;
    let eco = estado.economia;
    let disparados: string[] = [];
    let ocorrencias: EventOccurrence[] = [];

    for (let i = 0; i < 40; i++) {
      const r = executarPassagemDeAno(p, f, e, c, eco, disparados, criarPersonalidadeInicial(), ocorrencias);
      p = r.personagemAtualizado; f = r.familiaAtualizada; e = r.educacaoAtualizada;
      c = r.carreiraAtualizada; eco = r.economiaAtualizada;
      if (r.acontecimentoResolvido) {
        // Nada fica pendente para a interface resolver.
        expect(r.eventoDisparado).toBeNull();
        // A ocorrência é registrada com a natureza certa.
        expect(r.ocorrencia?.natureza).toBe('acontecimento');
        expect(r.ocorrencia?.eventId).toBe(r.acontecimentoResolvido.id);
        // E o ano produziu narrativa.
        expect(r.novosLogs.length).toBeGreaterThan(0);
        resetarFonteAleatoria();
        return;
      }
      if (r.ocorrencia) {
        disparados = [...disparados, r.ocorrencia.eventId];
        ocorrencias = [...ocorrencias, r.ocorrencia];
      }
      if (r.morreu) break;
    }
    throw new Error('nenhum acontecimento foi resolvido em 40 anos simulados');
  });
});

describe('B4-FIX4 · onde o acontecimento entra na Linha da Vida', () => {
  it('a categoria do evento vira a categoria real do log — nunca o genérico "evento"', () => {
    const casos: [GameEvent['categoria'], string][] = [
      ['escola', 'escola'],
      ['trabalho', 'carreira'],
      ['dinheiro', 'financas'],
      ['romance', 'amor'],
      ['amizade', 'amizade'],
      ['comunidade', 'amizade'],
      ['hobby', 'lazer'],
      ['esporte', 'lazer'],
      ['tecnologia', 'lazer'],
      ['saude', 'saude'],
      ['familia', 'familia']
    ];
    for (const [categoriaEvento, esperado] of casos) {
      expect(categoriaDeLogDoEvento(eventoDeTeste([], { categoria: categoriaEvento }))).toBe(esperado);
    }
  });

  it('nenhum acontecimento é rebaixado a "cotidiano" — se o motor o escolheu, ele conta no ano', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      expect(categoriaDeLogDoEvento(evento), evento.id).not.toBe('cotidiano');
    }
  });

  it('o tom do log vem das consequências reais, e não é mais "positivo" fixo', () => {
    expect(tomDoDesfecho({ stats: { felicidade: 10 } })).toBe('positivo');
    expect(tomDoDesfecho({ stats: { saude: -8, felicidade: -4 } })).toBe('negativo');
    expect(tomDoDesfecho({ demissao: true })).toBe('negativo');
    expect(tomDoDesfecho({ adicionarDoenca: 'Gripe' })).toBe('negativo');
    expect(tomDoDesfecho({ dinheiro: -500 })).toBe('negativo');
    expect(tomDoDesfecho({ dinheiro: 500 })).toBe('positivo');
    expect(tomDoDesfecho({})).toBe('info');
  });
});

describe('B4-FIX4 · regra de autonomia por idade no catálogo', () => {
  it('todo evento cuja janela inteira cabe em 0-2 anos é obrigatoriamente acontecimento', () => {
    const violacoes = MASTER_EVENTS_LIST.filter(
      e => exigeAcontecimentoPorIdade(e) && naturezaDoEvento(e) !== 'acontecimento'
    );
    expect(
      violacoes.map(e => e.id),
      'eventos que pediriam uma decisão consciente a um bebê'
    ).toEqual([]);
  });

  it('natureza ausente continua significando decisão (compatibilidade com conteúdo pré-B4-FIX4)', () => {
    const semNatureza = eventoDeTeste([], { natureza: undefined, idadeMinima: 20, idadeMaxima: 30 });
    expect(naturezaDoEvento(semNatureza)).toBe('decisao');
  });
});
