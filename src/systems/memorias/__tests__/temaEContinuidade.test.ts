/**
 * F5-FIX — TEMA SEMÂNTICO, COOLDOWN TEMÁTICO E POLÍTICA DE CONTINUIDADE.
 *
 * Os três mecanismos nasceram de um playtest humano (Igor Rodrigues, 0-18) e
 * são testados aqui pelos CONTRATOS que o playtest expôs, não pela redação:
 *
 *   1. uma sequência silenciosa longa na infância faz a vida parecer que
 *      sumiu (o caso "2 anos -> 6 anos");
 *   2. duas frases diferentes sobre o mesmo assunto são, biograficamente,
 *      uma repetição;
 *   3. um texto só pode afirmar uma mudança se o ANTES existir.
 */

import { describe, it, expect } from 'vitest';
import {
  gerarPequenaMemoria,
  anosSilenciososAntesDe,
  TEMAS_DO_CATALOGO,
  TOTAL_MEMORIAS_CANDIDATAS
} from '../pequenaMemoria';
import type { ContextoMemoria } from '../pequenaMemoria';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../__tests__/fixtures';
import { criarCarreiraInicial } from '../../careerSystem';
import { criarEducacaoInicial } from '../../educationSystem';
import { criarEconomiaInicial } from '../../economySystem';
import type { FamilyMember, LifeLogEntry } from '../../../types';

function ctxBase(over: Partial<ContextoMemoria> = {}): ContextoMemoria {
  return {
    personagem: criarPersonagemTeste({ idade: 8 }),
    carreira: criarCarreiraInicial(),
    educacao: criarEducacaoInicial(),
    economia: criarEconomiaInicial('classe_media'),
    familia: criarFamiliaTeste(),
    ...over
  };
}

function membro(tipo: FamilyMember['tipo'], nome: string, idade = 10): FamilyMember {
  return {
    id: `fam_${tipo}_${nome}`, nome, sobrenome: 'Souza', genero: 'masculino',
    tipo, idade, relacionamento: 80, vivo: true
  };
}

function linha(idade: number, tema?: string): LifeLogEntry {
  return {
    id: `l${idade}`, idade, ano: 2020 + idade, categoria: 'geral',
    texto: 'alguma coisa', relevancia: 'textura', temaDeMemoria: tema
  };
}

// --------------------------------------------------------------------------
describe('F5-FIX · tema é dado declarativo', () => {
  it('toda memória do catálogo declara um tema', () => {
    // Se alguém adicionar uma memória sem tema, ela escaparia do cooldown e
    // voltaria a repetir assunto. O contrato é verificado no total.
    expect(TEMAS_DO_CATALOGO.length).toBe(TOTAL_MEMORIAS_CANDIDATAS);
    expect(TEMAS_DO_CATALOGO.every(t => typeof t === 'string' && t.length > 0)).toBe(true);
  });

  it('a taxonomia é mínima: menos temas do que memórias', () => {
    // Um tema por memória tornaria o cooldown inútil — nada nunca colidiria.
    const distintos = new Set(TEMAS_DO_CATALOGO);
    expect(distintos.size).toBeLessThan(TOTAL_MEMORIAS_CANDIDATAS);
  });

  it('a memória emitida carrega o tema na entrada da Linha da Vida', () => {
    const ctx = ctxBase({
      personagem: criarPersonagemTeste({ idade: 8 }),
      familia: [...criarFamiliaTeste(), membro('irmao', 'Tiago', 7)]
    });
    const m = gerarPequenaMemoria(ctx, [], 8, 2034, [linha(7)]);
    expect(m?.temaDeMemoria).toBeTruthy();
  });

  it('duas REDAÇÕES do mesmo assunto têm o MESMO tema', () => {
    // O caso exato do playtest: irmãos aos 8 e aos 10, textos diferentes.
    const familia = [...criarFamiliaTeste(), membro('irmao', 'Tiago', 7)];
    const a = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 8 }), familia }), [], 8, 2034, [linha(7)]
    );
    const b = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 10 }), familia }), [], 10, 2036, [linha(9)]
    );
    expect(a?.texto).not.toBe(b?.texto);      // redação diferente
    expect(a?.temaDeMemoria).toBe(b?.temaDeMemoria); // mesmo assunto
  });
});

// --------------------------------------------------------------------------
describe('F5-FIX · CANÁRIO B — repetição semântica de "irmãos"', () => {
  const familia = [...criarFamiliaTeste(), membro('irmao', 'Tiago', 7)];

  it('tema recente cede lugar a outro tema verdadeiro quando existe', () => {
    // Aos 10, irmãos foi usado aos 8 (dentro da janela). Há escola disponível
    // como alternativa verdadeira → deve escolher escola, não irmãos.
    const ctx = ctxBase({
      personagem: criarPersonagemTeste({ idade: 10 }),
      familia,
      educacao: { ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'fundamental' }
    });
    const m = gerarPequenaMemoria(ctx, [], 10, 2036, [linha(8, 'familia_irmaos'), linha(9)]);
    expect(m).not.toBeNull();
    expect(m!.temaDeMemoria).not.toBe('familia_irmaos');
  });

  it('sem alternativa verdadeira e sem buraco, prefere o SILÊNCIO a repetir', () => {
    // Só irmãos é verdadeiro, e irmãos foi usado há 2 anos. O ano anterior
    // teve linha (não há buraco se formando) → silêncio é a resposta certa.
    const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade: 10 }), familia });
    const m = gerarPequenaMemoria(ctx, [], 10, 2036, [linha(8, 'familia_irmaos'), linha(9)]);
    expect(m).toBeNull();
  });

  it('o tema VOLTA depois da janela de cooldown', () => {
    // Usado aos 4; aos 10 já passou da janela de 3 anos → pode reaparecer.
    // (A idade fica dentro da faixa de `mem_infancia_irmaos`, que vai até 11:
    // o que se testa aqui é o cooldown, não o limite etário da candidata.)
    const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade: 10 }), familia });
    const m = gerarPequenaMemoria(ctx, [], 10, 2036, [linha(4, 'familia_irmaos'), linha(9)]);
    expect(m?.temaDeMemoria).toBe('familia_irmaos');
  });
});

// --------------------------------------------------------------------------
describe('F5-FIX · CANÁRIO A — sequência silenciosa 2 → 6', () => {
  it('conta corretamente os anos silenciosos anteriores', () => {
    // Linha da Vida com entradas até os 2 anos; consultando aos 6, houve
    // silêncio em 3, 4 e 5.
    const tl = [linha(1), linha(2)];
    expect(anosSilenciososAntesDe(tl, 6)).toBe(3);
    expect(anosSilenciososAntesDe(tl, 3)).toBe(0);
    expect(anosSilenciososAntesDe(tl, 4)).toBe(1);
  });

  it('timeline vazia significa SEM INFORMAÇÃO, não vida inteira em silêncio', () => {
    // Esta distinção não é detalhe: sem ela, todo chamador que não passa a
    // Linha da Vida faria a política disparar sempre, ignorando a cadência —
    // que é exatamente o preenchimento que esta fase evita.
    expect(anosSilenciososAntesDe([], 40)).toBe(0);
  });

  it('após 2 anos de silêncio, a continuidade TENTA emitir memória', () => {
    // Ano ímpar (5): a cadência normalmente bloquearia. Com um buraco se
    // formando, ela cede — melhor repetir assunto que perder o terceiro ano.
    const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade: 5 }) });
    const m = gerarPequenaMemoria(ctx, [], 5, 2031, [linha(1), linha(2)]);
    expect(m).not.toBeNull();
  });

  it('a continuidade NUNCA inventa contexto: sem vínculo, segue em silêncio', () => {
    // Mesmo buraco, mas criança sem nenhum vínculo vivo. Não há memória
    // verdadeira, e silêncio é melhor que mentira.
    const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade: 5 }), familia: [] });
    const m = gerarPequenaMemoria(ctx, [], 5, 2031, [linha(1), linha(2)]);
    expect(m).toBeNull();
  });

  it('silêncio CURTO não aciona a política (1 ano é normal)', () => {
    // Ano ímpar com apenas 1 ano de silêncio antes: a cadência prevalece.
    const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade: 5 }) });
    const m = gerarPequenaMemoria(ctx, [], 5, 2031, [linha(3), linha(4)]);
    expect(m).toBeNull();
  });
});

// --------------------------------------------------------------------------
describe('F5-FIX · a pequena memória continua inerte', () => {
  it('não altera atributos, dinheiro, família nem personalidade', () => {
    const ctx = ctxBase();
    const antes = JSON.stringify({
      p: ctx.personagem, f: ctx.familia, e: ctx.economia, c: ctx.carreira, ed: ctx.educacao
    });
    gerarPequenaMemoria(ctx, [], 8, 2034, [linha(7)]);
    const depois = JSON.stringify({
      p: ctx.personagem, f: ctx.familia, e: ctx.economia, c: ctx.carreira, ed: ctx.educacao
    });
    expect(depois).toBe(antes);
  });

  it('continua sendo textura — nunca marco, nunca decisão, nunca modal', () => {
    const m = gerarPequenaMemoria(ctxBase(), [], 8, 2034, [linha(7)]);
    if (m) expect(m.relevancia).toBe('textura');
  });

  it('o tema é classificação biográfica, não traço de personalidade', () => {
    // O retorno é uma linha de log e nada mais: nenhum campo de traço.
    const m = gerarPequenaMemoria(ctxBase(), [], 8, 2034, [linha(7)]);
    if (m) {
      const campos = Object.keys(m).sort();
      expect(campos).toEqual(
        ['ano', 'categoria', 'id', 'idade', 'relevancia', 'temaDeMemoria', 'texto', 'tipo'].sort()
      );
    }
  });
});

// --------------------------------------------------------------------------
describe('F5-FIX · contexto F4 continua obrigatório', () => {
  it('memória de irmãos exige irmão', () => {
    const semIrmao = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 8 }) }), [], 8, 2034, [linha(7)]
    );
    expect(semIrmao?.temaDeMemoria).not.toBe('familia_irmaos');
  });

  it('memória de amigo exige amigo', () => {
    const semAmigo = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 14 }) }), [], 14, 2040, [linha(13)]
    );
    expect(semAmigo?.temaDeMemoria).not.toBe('amizade');
  });

  it('memória de pet exige pet', () => {
    const semPet = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 10 }) }), [], 10, 2036, [linha(9)]
    );
    expect(semPet?.temaDeMemoria).not.toBe('familia_pet');
  });

  it('memória de primeira infância exige responsável vivo', () => {
    const orfa = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 4 }), familia: [] }), [], 4, 2030, [linha(1), linha(2)]
    );
    expect(orfa).toBeNull();
  });
});
