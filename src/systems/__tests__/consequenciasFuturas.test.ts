/**
 * B4-FIX2 item 11 — consequências futuras leves, ligadas por ID/flag.
 *
 * O PR pede "poucas conexões boas" para provar a infraestrutura, não uma
 * árvore narrativa gigantesca. Este arquivo testa as três implementadas:
 *
 * 1. `inf_primeiros_passos` (opt_correr) → `inf_bullying_defesa` ganha
 *    `opt_defender_com_confianca` (ligado por memória de escolha/id).
 * 2. `inf_bullying_defesa` (flag `defendeu_amigo`) → `ado_cola_prova`
 *    ganha `opt_colega_retribui` (ligado por flag).
 * 3. `inf_aula_musica` (flag `sabe_tocar_violao`) → `ado_trote_festa`
 *    ganha `opt_tocar_violao_festa` (ligado por flag).
 *
 * Em nenhum caso a ligação depende de comparar título/texto — sempre
 * `eventoId`/`opcaoId` (memória de personalidade) ou `flagNecessaria`.
 */

import { describe, it, expect } from 'vitest';
import { CHILDHOOD_EVENTS } from '../../data/events/childhoodEvents';
import { ADOLESCENCE_EVENTS } from '../../data/events/adolescenceEvents';
import { avaliarRequisitoOpcao } from '../eventSystem';
import { criarPersonalidadeInicial, registrarEscolha } from '../personalitySystem';
import { criarPersonagemTeste, criarEstadoTeste } from './fixtures';

function encontrarEvento(lista: typeof CHILDHOOD_EVENTS, id: string) {
  const evento = lista.find(e => e.id === id);
  if (!evento) throw new Error(`Evento ${id} não encontrado`);
  return evento;
}

function encontrarOpcao(evento: ReturnType<typeof encontrarEvento>, id: string) {
  const opcao = evento.opcoes.find(o => o.id === id);
  if (!opcao) throw new Error(`Opção ${id} não encontrada em ${evento.id}`);
  return opcao;
}

describe('B4-FIX2 · consequência futura 1 — primeiros passos → confiança no bullying', () => {
  const eventoBullying = encontrarEvento(CHILDHOOD_EVENTS, 'inf_bullying_defesa');
  const opcaoConfianca = encontrarOpcao(eventoBullying, 'opt_defender_com_confianca');

  it('a opção está ligada por eventoId+opcaoId, nunca por texto', () => {
    expect(opcaoConfianca.requisito?.condicaoComportamental?.escolheuAnteriormente).toEqual({
      eventoId: 'inf_primeiros_passos',
      opcaoId: 'opt_correr'
    });
  });

  it('fica indisponível para quem nunca escolheu "correr para os braços"', () => {
    const personagem = criarPersonagemTeste({ idade: 9 });
    const economia = criarEstadoTeste({ idade: 9 }).economia;
    const personalidade = criarPersonalidadeInicial(); // nenhuma escolha registrada

    const resultado = avaliarRequisitoOpcao(opcaoConfianca, personagem, economia, personalidade);
    expect(resultado.aprovado).toBe(false);
  });

  it('fica disponível para quem escolheu "correr" em Primeiros Passos', () => {
    const personagem = criarPersonagemTeste({ idade: 9 });
    const economia = criarEstadoTeste({ idade: 9 }).economia;
    const personalidade = registrarEscolha(criarPersonalidadeInicial(), {
      eventoId: 'inf_primeiros_passos',
      opcaoId: 'opt_correr',
      idade: 1,
      ano: 2026
    }).personalidade;

    const resultado = avaliarRequisitoOpcao(opcaoConfianca, personagem, economia, personalidade);
    expect(resultado.aprovado).toBe(true);
  });

  it('quem engatinhou (escolha diferente) continua sem acesso à opção', () => {
    const personagem = criarPersonagemTeste({ idade: 9 });
    const economia = criarEstadoTeste({ idade: 9 }).economia;
    const personalidade = registrarEscolha(criarPersonalidadeInicial(), {
      eventoId: 'inf_primeiros_passos',
      opcaoId: 'opt_engatinhar',
      idade: 1,
      ano: 2026
    }).personalidade;

    const resultado = avaliarRequisitoOpcao(opcaoConfianca, personagem, economia, personalidade);
    expect(resultado.aprovado).toBe(false);
  });
});

describe('B4-FIX2 · consequência futura 2 — defendeu o amigo → retribuição anos depois', () => {
  const eventoCola = encontrarEvento(ADOLESCENCE_EVENTS, 'ado_cola_prova');
  const opcaoRetribuicao = encontrarOpcao(eventoCola, 'opt_colega_retribui');

  it('a opção está ligada por FLAG, nunca por texto', () => {
    expect(opcaoRetribuicao.requisito?.flagNecessaria).toBe('defendeu_amigo');
  });

  it('fica indisponível sem a flag `defendeu_amigo`', () => {
    const personagem = criarPersonagemTeste({ idade: 14, flags: {} });
    const economia = criarEstadoTeste({ idade: 14 }).economia;

    const resultado = avaliarRequisitoOpcao(opcaoRetribuicao, personagem, economia);
    expect(resultado.aprovado).toBe(false);
  });

  it('fica disponível para quem defendeu o colega na infância', () => {
    const personagem = criarPersonagemTeste({ idade: 14, flags: { defendeu_amigo: true } });
    const economia = criarEstadoTeste({ idade: 14 }).economia;

    const resultado = avaliarRequisitoOpcao(opcaoRetribuicao, personagem, economia);
    expect(resultado.aprovado).toBe(true);
  });
});

describe('B4-FIX2 · consequência futura 3 — violão na infância → talento na formatura', () => {
  const eventoFormatura = encontrarEvento(ADOLESCENCE_EVENTS, 'ado_trote_festa');
  const opcaoViolao = encontrarOpcao(eventoFormatura, 'opt_tocar_violao_festa');

  it('a opção está ligada por FLAG, nunca por texto', () => {
    expect(opcaoViolao.requisito?.flagNecessaria).toBe('sabe_tocar_violao');
  });

  it('fica indisponível para quem nunca aprendeu violão', () => {
    const personagem = criarPersonagemTeste({ idade: 17, flags: {} });
    const economia = criarEstadoTeste({ idade: 17 }).economia;

    const resultado = avaliarRequisitoOpcao(opcaoViolao, personagem, economia);
    expect(resultado.aprovado).toBe(false);
  });

  it('fica disponível para quem tem a flag `sabe_tocar_violao`', () => {
    const personagem = criarPersonagemTeste({ idade: 17, flags: { sabe_tocar_violao: true } });
    const economia = criarEstadoTeste({ idade: 17 }).economia;

    const resultado = avaliarRequisitoOpcao(opcaoViolao, personagem, economia);
    expect(resultado.aprovado).toBe(true);
  });
});
