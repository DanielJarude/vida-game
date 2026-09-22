/**
 * F6 — A REDE SOCIAL E A NARRATIVA (§15, §16, §18, §20, §21).
 *
 * A F6 é a primeira fase que dá contexto REAL para memórias e eventos de
 * amizade. Estes testes garantem que ela faz isso sem afrouxar nada do que
 * as fases anteriores conquistaram: contexto F4 continua obrigatório, o
 * cooldown temático da F5-FIX continua valendo, e um colega genérico
 * mencionado numa frase continua sendo efêmero.
 */

import { describe, it, expect } from 'vitest';
import { gerarPequenaMemoria } from '../../memorias/pequenaMemoria';
import { criarConhecido } from '../redeSocial';
import { temAmigo, TIPOS_AMIZADE } from '../../contexto/contextoDaVida';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../__tests__/fixtures';
import { criarCarreiraInicial } from '../../careerSystem';
import { criarEducacaoInicial } from '../../educationSystem';
import { criarEconomiaInicial } from '../../economySystem';
import { aplicarConsequenciasEscolha } from '../../eventSystem';
import type { FamilyMember, LifeLogEntry } from '../../../types';

function ctx(familia: FamilyMember[], idade: number) {
  return {
    personagem: criarPersonagemTeste({ idade }),
    carreira: criarCarreiraInicial(),
    educacao: criarEducacaoInicial(),
    economia: criarEconomiaInicial('classe_media'),
    familia
  };
}

const linha = (idade: number, tema?: string): LifeLogEntry => ({
  id: `l${idade}`, idade, ano: 2000 + idade, categoria: 'geral',
  texto: 'algo', relevancia: 'textura', temaDeMemoria: tema
});

function amigoDeVerdade(idadeJogador: number): FamilyMember {
  return {
    ...criarConhecido('escola', idadeJogador, 'Souza'),
    tipo: 'amigo',
    relacionamento: 70
  };
}

describe('F6 · 15. memória de amizade exige amizade real', () => {
  it('sem amigo, nenhuma memória de tema amizade é emitida', () => {
    const m = gerarPequenaMemoria(ctx([...criarFamiliaTeste()], 14), [], 14, 2014, [linha(13)]);
    expect(m?.temaDeMemoria).not.toBe('amizade');
  });

  it('um COLEGA não basta: colega não é amigo', () => {
    // Este é o degrau novo da F6 e o risco real de regressão: se `temAmigo`
    // passasse a aceitar 'colega', toda memória de amizade voltaria a poder
    // aparecer sem amizade nenhuma.
    const familia = [...criarFamiliaTeste(), criarConhecido('escola', 14, 'Souza')];
    expect(familia.some(p => p.tipo === 'colega')).toBe(true);

    const m = gerarPequenaMemoria(ctx(familia, 14), [], 14, 2014, [linha(13)]);
    expect(m?.temaDeMemoria).not.toBe('amizade');
  });

  it('com amigo de verdade, a memória de amizade passa a ser possível', () => {
    const familia = [...criarFamiliaTeste(), amigoDeVerdade(14)];
    const m = gerarPequenaMemoria(ctx(familia, 14), [], 14, 2014, [linha(13)]);
    expect(m).not.toBeNull();
    expect(m!.temaDeMemoria).toBe('amizade');
  });

  it('20. o cooldown temático da F5-FIX continua valendo para amizade', () => {
    const familia = [...criarFamiliaTeste(), amigoDeVerdade(14)];
    // tema usado no ano anterior: não pode repetir agora
    const m = gerarPequenaMemoria(
      ctx(familia, 14), [], 14, 2014, [linha(13, 'amizade')]
    );
    expect(m?.temaDeMemoria).not.toBe('amizade');
  });
});

describe('F6 · 18. o predicado de contexto F4 não foi afrouxado', () => {
  it('temAmigo continua exigindo amigo/amiga — colega não satisfaz', () => {
    const fatias = (familia: FamilyMember[]) => ({
      personagem: criarPersonagemTeste({ idade: 14 }),
      familia,
      economia: criarEconomiaInicial('classe_media'),
      carreira: criarCarreiraInicial(),
      educacao: criarEducacaoInicial()
    });

    expect(temAmigo(fatias([...criarFamiliaTeste()]) as never)).toBe(false);
    expect(
      temAmigo(fatias([...criarFamiliaTeste(), criarConhecido('escola', 14, 'Souza')]) as never)
    ).toBe(false);
    expect(temAmigo(fatias([...criarFamiliaTeste(), amigoDeVerdade(14)]) as never)).toBe(true);
  });

  it('o tipo "colega" NÃO entra na lista de amizade do contexto F4', () => {
    // Defesa em profundidade: se alguém adicionar 'colega' aqui, um evento
    // que pressupõe "seu amigo" passaria a disparar sem amigo nenhum.
    expect(TIPOS_AMIZADE).not.toContain('colega');
  });
});

describe('F6 · 17. colega genérico é efêmero (§19)', () => {
  it('o texto de um evento pode citar "um colega" sem NPC persistente', () => {
    // A frase é conteúdo; ela não exige que exista pessoa na aba Pessoas.
    // O que exige NPC é o evento que diz "seu amigo João" — coberto pelo
    // predicado temAmigo acima.
    const familia = [...criarFamiliaTeste()];
    const pessoasPersistentes = familia.filter(m => m.origemSocial);
    expect(pessoasPersistentes).toHaveLength(0);
  });
});

describe('F6 · a origem declarada pelo evento CHEGA na pessoa', () => {
  it('aplicarConsequenciasEscolha preserva origemSocial e estudante', () => {
    // Regressão real encontrada por auditoria: `eventSystem` monta o
    // FamilyMember campo a campo, então todo campo novo é silenciosamente
    // descartado até ser listado lá. O catálogo declarava `origemSocial` e
    // a pessoa chegava sem origem nenhuma.
    const personagem = criarPersonagemTeste({ idade: 13 });
    const r = aplicarConsequenciasEscolha(
      {
        id: 'opt_teste', texto: 'x',
        consequencias: {
          adicionarFamiliar: {
            tipo: 'amigo', idade: 13, relacionamento: 70,
            origemSocial: 'escola', estudante: true
          }
        }
      } as never,
      personagem, criarCarreiraInicial(), criarEducacaoInicial(),
      criarEconomiaInicial('classe_media'), [...criarFamiliaTeste()], personagem.anoAtual
    );
    const novo = r.familiaAtualizada.find(m => m.tipo === 'amigo')!;
    expect(novo).toBeDefined();
    expect(novo.origemSocial).toBe('escola');
    expect(novo.estudante).toBe(true);
    expect(novo.idadeEntrada).toBe(13);
  });

  it('o evento que não nomeia a pessoa recebe nome de verdade, não placeholder', () => {
    const personagem = criarPersonagemTeste({ idade: 30 });
    const r = aplicarConsequenciasEscolha(
      {
        id: 'opt_teste2', texto: 'x',
        consequencias: { adicionarFamiliar: { tipo: 'amigo', idade: 30, origemSocial: 'trabalho' } }
      } as never,
      personagem, criarCarreiraInicial(), criarEducacaoInicial(),
      criarEconomiaInicial('classe_media'), [...criarFamiliaTeste()], personagem.anoAtual
    );
    const novo = r.familiaAtualizada.find(m => m.tipo === 'amigo')!;
    expect(novo.nome).not.toBe('Novo Familiar');
    expect(novo.nome.length).toBeGreaterThan(1);
  });
});

describe('F6 · 15/16. família e romance não viram a mesma coisa', () => {
  it('pai e mãe nunca recebem origem social nem viram colegas', () => {
    const familia = criarFamiliaTeste();
    for (const m of familia) {
      expect(m.origemSocial).toBeUndefined();
      expect(['pai', 'mae']).toContain(m.tipo);
    }
  });

  it('um amigo criado pela F6 nunca nasce como parceiro', () => {
    const tiposRomanticos = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'];
    for (let i = 0; i < 30; i++) {
      expect(tiposRomanticos).not.toContain(criarConhecido('trabalho', 25, 'Souza').tipo);
    }
  });
});
