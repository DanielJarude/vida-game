/**
 * F6-FIX §17-§20 — CANÁRIOS DO PLAYTEST HUMANO.
 *
 * Cada bloco aqui nasceu de um defeito que um humano viu jogando e que
 * NENHUMA métrica automática apontou. São testes de semântica, não de id:
 * nenhum deles conhece "Luiz", "ado_cola_prova" ou qualquer nome próprio do
 * conteúdo — eles protegem a REGRA, para que o mesmo defeito não volte por
 * outro caminho.
 */
import { describe, it, expect } from 'vitest';
import type { FamilyMember, GameEvent } from '../../../types';
import {
  criarPersonagemTeste,
  criarFamiliaTeste
} from '../../__tests__/fixtures';
import { criarEducacaoInicial } from '../../educationSystem';
import { criarCarreiraInicial } from '../../careerSystem';
import { criarEconomiaInicial } from '../../economySystem';
import { criarPersonalidadeInicial } from '../../personalitySystem';
import {
  ehVinculoSocial,
  vinculosSociaisVisiveis
} from '../../contexto/contextoDaVida';
import { processarAnoSocial, TETO_CONVIVIO_PASSIVO, LIMIAR_AMIZADE } from '../redeSocial';
import { deveOferecerInteracao } from '../../interactionCapabilitySystem';
import { getActionAvailability } from '../../availabilitySystem';
import { interagirComFamiliar } from '../../familySystem';
import { avaliarRequisitoOpcao } from '../../events/optionRequirements';
import { MASTER_EVENTS_LIST } from '../../../data/events/allEvents';
import { processarAnoEducacao } from '../../educationSystem';
import { gerarPequenaMemoria } from '../../memorias/pequenaMemoria';

/** Um colega de escola como a F6 o cria: persistente, distante, com origem. */
function colegaDaEscola(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'colega-1',
    nome: 'Rafael',
    sobrenome: 'Dias',
    genero: 'masculino',
    tipo: 'colega',
    idade: 7,
    relacionamento: 25,
    vivo: true,
    origemSocial: 'escola',
    idadeEntrada: 7,
    ultimoContatoIdade: 7,
    estudante: true,
    ...overrides
  } as FamilyMember;
}

function contexto(idade: number, familia: FamilyMember[]) {
  return {
    personagem: criarPersonagemTeste({ idade }),
    educacao: { ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'fundamental' as const },
    carreira: criarCarreiraInicial(),
    economia: criarEconomiaInicial('classe_media'),
    familia,
    personalidade: criarPersonalidadeInicial(),
    acoesRealizadasAno: [] as string[]
  };
}

// ---------------------------------------------------------------------------
// §17 — CANÁRIO DO COLEGA
// ---------------------------------------------------------------------------

describe('F6-FIX §17 · o colega da escola é uma pessoa jogável, não enfeite', () => {
  it('um colega persistente APARECE na projeção de Relacionamentos', () => {
    // O defeito do playtest: Luiz aparecia no painel Pessoas e sumia da aba
    // Relacionamentos, porque a aba tinha uma lista de tipos própria, sem
    // 'colega'. A aba agora pergunta ao domínio.
    const familia = [...criarFamiliaTeste(), colegaDaEscola()];
    const visiveis = vinculosSociaisVisiveis(familia);
    expect(visiveis.map(p => p.id)).toContain('colega-1');
  });

  it('colega é vínculo social — e a taxonomia é UMA só', () => {
    // Se alguém criar um tipo social novo e esquecer de registrá-lo, este
    // teste não pega; mas se alguém REMOVER 'colega' da fonte única, a aba
    // volta a ficar vazia e isto falha.
    expect(ehVinculoSocial('colega')).toBe(true);
    expect(ehVinculoSocial('amigo')).toBe(true);
    // Família nunca é "vínculo social" nesta acepção: ela tem seção própria.
    expect(ehVinculoSocial('pai')).toBe(false);
    expect(ehVinculoSocial('filho')).toBe(false);
  });

  it('o colega tem identidade mínima: nome, origem e idade coerente', () => {
    const c = colegaDaEscola();
    expect(c.nome.trim().length).toBeGreaterThan(1);
    expect(c.nome).not.toBe('Novo Familiar');
    expect(c.origemSocial).toBe('escola');
    // Colega de escola de uma criança de 7 anos não é um adulto.
    expect(Math.abs(c.idade - 7)).toBeLessThanOrEqual(3);
    expect(c.profissao).toBeUndefined();
  });

  it('a relação NÃO nasce próxima', () => {
    expect(colegaDaEscola().relacionamento).toBeLessThan(LIMIAR_AMIZADE);
  });

  it('as ações oferecidas com um colega são as sociais, não as de família', () => {
    // Pedir dinheiro e pedir conselho pressupõem quem cria você; "discutir"
    // na infância é narrado como birra. Nada disso cabe num colega de sala.
    for (const proibida of ['pedir_dinheiro', 'pedir_conselho', 'discutir'] as const) {
      expect(deveOferecerInteracao(proibida, 7, false, true)).toBe(false);
    }
    expect(deveOferecerInteracao('conversar', 7, false, true)).toBe(true);
    expect(deveOferecerInteracao('passar_tempo', 7, false, true)).toBe(true);
    // ...e continuam existindo para a família.
    expect(deveOferecerInteracao('pedir_conselho', 30, false, false)).toBe(true);
  });

  it('o MOTOR recusa uma interação que não cabe no vínculo, não só a UI', () => {
    const familia = [...criarFamiliaTeste(), colegaDaEscola()];
    const ctx = contexto(7, familia);
    const disp = getActionAvailability(ctx as never, 'interagir_familia', {
      membroId: 'colega-1',
      tipoInteracao: 'pedir_dinheiro'
    });
    expect(disp.kind).not.toBe('disponivel');

    // Defesa em profundidade: mesmo chamando o comando direto.
    const r = interagirComFamiliar(
      colegaDaEscola(),
      criarPersonagemTeste({ idade: 7 }),
      'pedir_dinheiro'
    );
    expect(r.sucesso).toBe(false);
  });

  it('a mesma interação não pode ser repetida no mesmo ano (anti-farm §10)', () => {
    const familia = [...criarFamiliaTeste(), colegaDaEscola()];
    const ctx = {
      ...contexto(7, familia),
      acoesRealizadasAno: ['familia:colega-1:conversar']
    };
    const disp = getActionAvailability(ctx as never, 'interagir_familia', {
      membroId: 'colega-1',
      tipoInteracao: 'conversar'
    });
    expect(disp.kind).toBe('bloqueado');
  });

  it('uma interação social válida melhora a relação, mas pouco', () => {
    const antes = colegaDaEscola();
    const r = interagirComFamiliar(
      antes,
      criarPersonagemTeste({ idade: 7 }),
      'conversar'
    );
    expect(r.sucesso).toBe(true);
    const ganho = r.membroAtualizado.relacionamento - antes.relacionamento;
    expect(ganho).toBeGreaterThan(0);
    // Uma conversa não cria um melhor amigo.
    expect(ganho).toBeLessThanOrEqual(15);
  });

  it('a narrativa com um colega não usa papel de família', () => {
    const r = interagirComFamiliar(
      colegaDaEscola(),
      criarPersonagemTeste({ idade: 7 }),
      'passar_tempo'
    );
    // "engatinhou atrás de", "fez birra" etc. pressupõem convivência
    // doméstica. Com um colega, o gesto acontece no ambiente que aproximou.
    expect(r.mensagem).not.toMatch(/birra|colo|engatinh/i);
    expect(r.mensagem).toContain('Rafael');
  });
});

// ---------------------------------------------------------------------------
// §18 — CANÁRIO DA EVOLUÇÃO PASSIVA
// ---------------------------------------------------------------------------

describe('F6-FIX §18 · a convivência aproxima, mas não faz tudo sozinha', () => {
  /** Roda N anos de convivência escolar sem nenhuma ação do jogador. */
  function conviverAnos(n: number, idadeInicial = 7): FamilyMember | undefined {
    let familia: FamilyMember[] = [...criarFamiliaTeste(), colegaDaEscola()];
    for (let i = 0; i < n; i++) {
      const idade = idadeInicial + i;
      familia = processarAnoSocial(
        contexto(idade, familia) as never,
        2000 + idade
      ).familiaAtualizada;
    }
    return familia.find(p => p.id === 'colega-1');
  }

  it('alguns anos de convívio PODEM aproximar', () => {
    const depois = conviverAnos(4);
    expect(depois!.relacionamento).toBeGreaterThan(25);
  });

  it('a convivência passiva NÃO chega à intimidade máxima', () => {
    // O playtest viu "Distante → Estável" sem nenhuma ação, o que é
    // legítimo. O que não pode é a inércia levar sozinha até o topo:
    // proximidade profunda tem de custar agência.
    const depois = conviverAnos(12);
    expect(depois!.relacionamento).toBeLessThanOrEqual(TETO_CONVIVIO_PASSIVO);
    expect(depois!.relacionamento).toBeLessThan(100);
  });

  it('mas a amizade continua podendo nascer só de viver junto (§11)', () => {
    // O teto fica acima do limiar de amizade de propósito: ninguém precisa
    // "jogar" a amizade para ela existir.
    expect(TETO_CONVIVIO_PASSIVO).toBeGreaterThan(LIMIAR_AMIZADE);
  });
});

// ---------------------------------------------------------------------------
// §19 — CANÁRIO DE PRÉ-REQUISITO JUSTO
// ---------------------------------------------------------------------------

describe('F6-FIX §19 · opção travada por histórico distingue trajetória de azar', () => {
  /** Qualquer opção do catálogo que exija uma flag concedida por outro evento. */
  function acharOpcaoComFlag(): { evento: GameEvent; opcaoId: string; flag: string; fontes: string[] } {
    const concede = new Map<string, string[]>();
    for (const e of MASTER_EVENTS_LIST)
      for (const o of e.opcoes)
        if (o.consequencias.adicionarFlag) {
          const f = o.consequencias.adicionarFlag;
          concede.set(f, [...new Set([...(concede.get(f) ?? []), e.id])]);
        }
    for (const e of MASTER_EVENTS_LIST)
      for (const o of e.opcoes) {
        const flag = o.requisito?.flagNecessaria;
        if (flag && (concede.get(flag) ?? []).length > 0)
          return { evento: e, opcaoId: o.id, flag, fontes: concede.get(flag)! };
      }
    throw new Error('catálogo sem opção travada por flag');
  }

  const caso = acharOpcaoComFlag();
  const opcao = caso.evento.opcoes.find(o => o.id === caso.opcaoId)!;
  const economia = criarEconomiaInicial('classe_media');

  it('A) teve a oportunidade e escolheu outro caminho → LOCK DE TRAJETÓRIA', () => {
    const r = avaliarRequisitoOpcao(
      opcao,
      criarPersonagemTeste({ idade: caso.evento.idadeMinima }),
      economia,
      undefined,
      caso.fontes // o evento antecedente FOI apresentado
    );
    expect(r.aprovado).toBe(false);
    expect(r.origemDoBloqueio).toBe('trajetoria');
  });

  it('B) nunca recebeu a oportunidade → NÃO é apresentado como consequência pessoal', () => {
    // Este é o achado E: a opção dizia "o colega que você defendeu na
    // infância..." para quem nunca teve chance de defender colega nenhum.
    const r = avaliarRequisitoOpcao(
      opcao,
      criarPersonagemTeste({ idade: caso.evento.idadeMinima }),
      economia,
      undefined,
      [] // o jogo nunca apresentou o antecedente
    );
    expect(r.aprovado).toBe(false);
    expect(r.origemDoBloqueio).toBe('nunca_oferecido');
    // E a mensagem não pode culpar o jogador por uma escolha inexistente.
    expect(r.motivo).not.toMatch(/não cumpre os requisitos/i);
  });

  it('cumprir a flag libera a opção', () => {
    const p = criarPersonagemTeste({ idade: caso.evento.idadeMinima });
    p.flags[caso.flag] = true;
    expect(avaliarRequisitoOpcao(opcao, p, economia, undefined, caso.fontes).aprovado).toBe(true);
  });

  it('sem histórico informado, o comportamento antigo é preservado', () => {
    // Compatibilidade: chamadas que não passam histórico continuam válidas.
    const r = avaliarRequisitoOpcao(
      opcao,
      criarPersonagemTeste({ idade: caso.evento.idadeMinima }),
      economia
    );
    expect(r.aprovado).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §20 — CANÁRIO DE DISCIPLINA
// ---------------------------------------------------------------------------

describe('F6-FIX §20 · o lock por disciplina reflete comportamento real', () => {
  it('estudar constrói traço de disciplina (a rotina chega à personalidade)', () => {
    // Era o furo: a postura escolar movia apenas `hiddenStats.disciplina`,
    // enquanto o requisito lê o TRAÇO. Estudar todo ano não contava, e
    // 76/105 vidas chegavam aos 12 sem nenhuma fonte de disciplina.
    const educacao = {
      ...criarEducacaoInicial(),
      emCurso: true,
      tipoCurso: 'fundamental' as const,
      posturaAno: 'estudar' as const
    };
    const r = processarAnoEducacao(educacao, criarPersonagemTeste({ idade: 10 }), 2010);
    expect(r.impactoComportamental?.disciplina).toBeGreaterThan(0);
  });

  it('matar aula empurra o traço para o outro lado', () => {
    const educacao = {
      ...criarEducacaoInicial(),
      emCurso: true,
      tipoCurso: 'fundamental' as const,
      posturaAno: 'matar_aula' as const
    };
    const r = processarAnoEducacao(educacao, criarPersonagemTeste({ idade: 10 }), 2010);
    expect(r.impactoComportamental?.disciplina).toBeLessThan(0);
  });

  it('quem não está estudando não acumula disciplina por rotina', () => {
    const r = processarAnoEducacao(
      criarEducacaoInicial(),
      criarPersonagemTeste({ idade: 30 }),
      2030
    );
    expect(r.impactoComportamental).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// §13 — FILLER
// ---------------------------------------------------------------------------

describe('F6-FIX §13 · o ano escolar não recebe frase de preenchimento', () => {
  it('nenhuma pequena memória da escola declara que nada aconteceu', () => {
    // "Um ano escolar sem nada de extraordinário, do jeito que a maioria é."
    // não caracteriza ninguém: existia para ocupar o ano. O silêncio já diz
    // isso, de graça e melhor. A varredura cobre toda a faixa escolar para
    // que a frase não volte por outra variante.
    const proibido = /sem nada de (extraordinário|especial)|nada demais aconteceu|como (a maioria|todo mundo)|um ano comum e sem/i;
    const vistos: string[] = [];
    for (let idade = 6; idade <= 14; idade++) {
      for (let ano = 0; ano < 12; ano++) {
        const m = gerarPequenaMemoria(
          {
            personagem: criarPersonagemTeste({ idade }),
            educacao: {
              ...criarEducacaoInicial(),
              emCurso: true,
              tipoCurso: 'fundamental'
            },
            carreira: criarCarreiraInicial(),
            economia: criarEconomiaInicial('classe_media'),
            familia: criarFamiliaTeste()
          } as never,
          [],
          idade,
          2000 + ano
        );
        if (m?.texto) vistos.push(m.texto);
      }
    }
    expect(vistos.length).toBeGreaterThan(0);
    for (const t of vistos) expect(t).not.toMatch(proibido);
  });
});
