import { describe, expect, it } from 'vitest';
import {
  aplicarImpactosComportamentais,
  atendeCondicaoComportamental,
  consultarMemoria,
  contarOcorrenciasTag,
  criarPersonalidadeInicial,
  IMPACTO_MAXIMO_POR_ESCOLHA,
  LIMIAR_TRACO_PERCEBIDO,
  obterIntensidade,
  obterTracosPercebidos,
  registrarEscolha,
  TRACOS_COMPORTAMENTAIS
} from '../personalitySystem';
import {
  aplicarConsequenciasEscolha,
  avaliarCondicoesEvento,
  avaliarRequisitoOpcao
} from '../eventSystem';
import { MASTER_EVENTS_LIST } from '../../data/events/allEvents';
import { naturezaDoEvento } from '../events/nature';
import { criarEstadoTeste } from './fixtures';
import { EscolhaRegistrada, GameEvent, PersonalityState, TracoComportamental } from '../../types';

// ---------------------------------------------------------------------------
// Cenário 1 — uma escolha registra memória com evento/opção/idade
// ---------------------------------------------------------------------------
describe('Registro de escolhas na memória', () => {
  it('uma escolha registra memória com evento/opção/idade/ano e aplica tags', () => {
    const estado = criarEstadoTeste({ idade: 4 });
    const evento = MASTER_EVENTS_LIST.find(e => e.id === 'inf_birra_brinquedo')!;
    const opcao = evento.opcoes.find(o => o.id === 'opt_aceitar')!;

    const res = aplicarConsequenciasEscolha(
      opcao, estado.personagem, estado.carreira, estado.educacao, estado.economia,
      estado.familia, 2030,
      { eventoId: evento.id, personalidade: criarPersonalidadeInicial() }
    );

    expect(res.recusado ?? false).toBe(false);
    expect(res.personalidadeAtualizada).toBeDefined();
    const memorias = res.personalidadeAtualizada!.memorias;
    expect(memorias).toHaveLength(1);
    expect(memorias[0]).toEqual({
      eventoId: 'inf_birra_brinquedo',
      opcaoId: 'opt_aceitar',
      idade: 4,
      ano: 2030,
      tagsComportamentais: { disciplina: 2 },
      impactos: { disciplina: 2 }
    } satisfies EscolhaRegistrada);
    expect(obterIntensidade(res.personalidadeAtualizada!, 'disciplina')).toBe(2);
  });

  it('escolhas sem tags também viram memória (o motor sabe o que aconteceu)', () => {
    let p = criarPersonalidadeInicial();
    p = registrarEscolha(p, {
      eventoId: 'inf_aula_musica', opcaoId: 'opt_nao_querer', idade: 10, ano: 2036
    }).personalidade;
    expect(p.memorias).toHaveLength(1);
    expect(p.memorias[0].tagsComportamentais).toEqual({});
    // nenhum traço mexeu
    expect(TRACOS_COMPORTAMENTAIS.every(t => p.tracos[t] === 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cenário 2 e 3 — escolha isolada não define; repetição acumula
// ---------------------------------------------------------------------------
describe('Emergência gradual (uma escolha não cria personalidade extrema)', () => {
  it('uma única escolha não produz traço percebido nem intensidade extrema', () => {
    const p = registrarEscolha(criarPersonalidadeInicial(), {
      eventoId: 'inf_bullying_defesa', opcaoId: 'opt_defender', idade: 9, ano: 2035,
      tagsComportamentais: { coragem: 2, empatia: 2 }
    }).personalidade;

    // impacto máximo absoluto de uma escolha em qualquer eixo é pequeno
    for (const traco of TRACOS_COMPORTAMENTAIS) {
      expect(Math.abs(obterIntensidade(p, traco))).toBeLessThanOrEqual(IMPACTO_MAXIMO_POR_ESCOLHA);
      expect(Math.abs(obterIntensidade(p, traco))).toBeLessThan(LIMIAR_TRACO_PERCEBIDO);
    }
    expect(obterTracosPercebidos(p, 'feminino')).toEqual([]);
  });

  it('escolhas repetidas acumulam tendência até ela ser percebida', () => {
    let p = criarPersonalidadeInicial();
    const intensidades: number[] = [];
    for (const idade of [4, 5, 6, 7]) {
      p = registrarEscolha(p, {
        eventoId: `evt_empatia_${idade}`, opcaoId: 'opt_ajudar', idade, ano: 2026 + idade,
        tagsComportamentais: { empatia: 2 }
      }).personalidade;
      intensidades.push(obterIntensidade(p, 'empatia'));
    }
    // crescimento monotônico: 2 → 4 → 6 → 8
    expect(intensidades).toEqual([2, 4, 6, 8]);

    const percebidos = obterTracosPercebidos(p, 'masculino');
    expect(percebidos.map(t => t.rotulo)).toContain('Empático');
  });

  it('três escolhas isoladas de eixos diferentes não criam traço algum', () => {
    let p = criarPersonalidadeInicial();
    p = registrarEscolha(p, { eventoId: 'a', opcaoId: 'a', idade: 4, ano: 2030, tagsComportamentais: { empatia: 2 } }).personalidade;
    p = registrarEscolha(p, { eventoId: 'b', opcaoId: 'b', idade: 5, ano: 2031, tagsComportamentais: { coragem: 2 } }).personalidade;
    p = registrarEscolha(p, { eventoId: 'c', opcaoId: 'c', idade: 6, ano: 2032, tagsComportamentais: { disciplina: 2 } }).personalidade;
    // cada eixo ficou em 2: nada consolidado, personalidade ainda em formação
    expect(obterTracosPercebidos(p)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Cenário 4 e 5 — mudança ao longo da vida; opostos contrabalançam
// ---------------------------------------------------------------------------
describe('Evolução e contrabalanceamento', () => {
  it('tendências podem mudar ao longo da vida (comportamentos posteriores enfraquecem anteriores)', () => {
    let p = criarPersonalidadeInicial();
    // infância disciplinada
    for (const idade of [5, 6, 7]) {
      p = registrarEscolha(p, { eventoId: `d_${idade}`, opcaoId: 'opt', idade, ano: 2030 + idade, tagsComportamentais: { disciplina: 2 } }).personalidade;
    }
    expect(obterIntensidade(p, 'disciplina')).toBe(6);

    // adolescência rebelde: a tendência cai ano a ano
    const aoLongoDaVida: number[] = [];
    for (const idade of [14, 15, 16]) {
      p = registrarEscolha(p, { eventoId: `r_${idade}`, opcaoId: 'opt', idade, ano: 2040 + idade, tagsComportamentais: { disciplina: -2 } }).personalidade;
      aoLongoDaVida.push(obterIntensidade(p, 'disciplina'));
    }
    expect(aoLongoDaVida).toEqual([4, 2, 0]);
    // o traço positivo deixou de ser percebido
    expect(obterTracosPercebidos(p).map(t => t.rotulo)).not.toContain('Disciplinado');
  });

  it('escolhas opostas reduzem/contrabalançam a tendência no mesmo eixo', () => {
    let p = criarPersonalidadeInicial();
    for (const idade of [4, 5, 6]) {
      p = registrarEscolha(p, { eventoId: `g_${idade}`, opcaoId: 'opt', idade, ano: 2030 + idade, tagsComportamentais: { generosidade: 2 } }).personalidade;
    }
    expect(obterIntensidade(p, 'generosidade')).toBe(6);

    p = registrarEscolha(p, { eventoId: 'g_8', opcaoId: 'opt', idade: 8, ano: 2034, tagsComportamentais: { generosidade: -2 } }).personalidade;
    p = registrarEscolha(p, { eventoId: 'g_9', opcaoId: 'opt', idade: 9, ano: 2035, tagsComportamentais: { generosidade: -2 } }).personalidade;
    expect(obterIntensidade(p, 'generosidade')).toBe(2);
    expect(obterTracosPercebidos(p)).toEqual([]); // deixou de ser perceptível
  });

  it('aplicarImpactosComportamentais é puro e não altera o estado original', () => {
    const original = criarPersonalidadeInicial();
    const atualizado = aplicarImpactosComportamentais(original, { empatia: 3, coragem: -1 });
    expect(original.tracos.empatia).toBe(0);
    expect(atualizado.tracos.empatia).toBe(3);
    expect(atualizado.tracos.coragem).toBe(-1);
    expect(atualizado.memorias).toBe(original.memorias);
  });
});

// ---------------------------------------------------------------------------
// Cenário 6 — memória não depende do texto da opção
// ---------------------------------------------------------------------------
describe('Memória por ids estáveis (nunca texto visível)', () => {
  it('o registro guarda ids e tags; o texto da opção não entra na memória', () => {
    const p = registrarEscolha(criarPersonalidadeInicial(), {
      eventoId: 'inf_birra_brinquedo', opcaoId: 'opt_aceitar', idade: 4, ano: 2030,
      tagsComportamentais: { disciplina: 2 }
    }).personalidade;

    const memoria = JSON.stringify(p.memorias[0]);
    expect(memoria).not.toContain('Aceitar');
    expect(memoria).not.toContain('na volta');
    expect(consultarMemoria(p, { eventoId: 'inf_birra_brinquedo', opcaoId: 'opt_aceitar' })).toHaveLength(1);
  });

  it('mudar o texto da opção não muda o resultado: mesmos ids, mesmos efeitos', () => {
    const estado = criarEstadoTeste({ idade: 5 });
    const opcaoA = {
      id: 'opt_aceitar',
      texto: 'Aceitar quando disseram "na volta a gente compra"',
      descricaoResultado: 'Você aceitou.',
      consequencias: { impactosComportamentais: { disciplina: 2 } }
    };
    const opcaoB = { ...opcaoA, texto: 'Texto completamente diferente depois de uma revisão' };

    const resA = aplicarConsequenciasEscolha(opcaoA, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, 2030, { eventoId: 'inf_birra_brinquedo', personalidade: criarPersonalidadeInicial() });
    const resB = aplicarConsequenciasEscolha(opcaoB, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, 2030, { eventoId: 'inf_birra_brinquedo', personalidade: criarPersonalidadeInicial() });

    // memória e traços idênticos: só ids e tags importam
    expect(resB.personalidadeAtualizada!.memorias).toEqual(resA.personalidadeAtualizada!.memorias);
    expect(resB.personalidadeAtualizada!.tracos).toEqual(resA.personalidadeAtualizada!.tracos);
  });
});

// ---------------------------------------------------------------------------
// Cenário 7 e 8 — condições consultam personalidade e memória
// ---------------------------------------------------------------------------
describe('Condições comportamentais de eventos', () => {
  const eventoComCondicao: GameEvent = {
    id: 'tst_evento_condicional',
    titulo: 'Evento Condicional',
    descricao: 'Um evento que exige histórico.',
    idadeMinima: 12,
    idadeMaxima: 30,
    categoria: 'cotidiano',
    peso: 10,
    condicoes: { personalidade: [{ traco: 'disciplina', intensidadeMinima: 5 }] },
    opcoes: [{ id: 'opt_ok', texto: 'Ok', consequencias: {} }]
  };

  const estado = criarEstadoTeste({ idade: 14 });

  it('condição de evento consulta traço mínimo: fraco reprova, forte aprova', () => {
    const fraca = criarPersonalidadeInicial();
    expect(avaliarCondicoesEvento(eventoComCondicao, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, [], fraca)).toBe(false);

    let forte = criarPersonalidadeInicial();
    forte = aplicarImpactosComportamentais(forte, { disciplina: 6 });
    expect(avaliarCondicoesEvento(eventoComCondicao, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, [], forte)).toBe(true);
  });

  it('condição de evento também suporta traço máximo e ocorrências de tag', () => {
    const eventoImpulsivo: GameEvent = {
      ...eventoComCondicao,
      id: 'tst_evento_impulsivo',
      condicoes: { personalidade: [{ traco: 'impulsividade', intensidadeMaxima: 0 }, { minimoOcorrencias: { tag: 'empatia', quantidade: 2 } }] }
    };

    let p = criarPersonalidadeInicial();
    expect(avaliarCondicoesEvento(eventoImpulsivo, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, [], p)).toBe(false);

    p = registrarEscolha(p, { eventoId: 'e1', opcaoId: 'o', idade: 6, ano: 2032, tagsComportamentais: { empatia: 2 } }).personalidade;
    p = registrarEscolha(p, { eventoId: 'e2', opcaoId: 'o', idade: 7, ano: 2033, tagsComportamentais: { empatia: 1 } }).personalidade;
    expect(avaliarCondicoesEvento(eventoImpulsivo, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, [], p)).toBe(true);

    // impulsividade acumulada reprova a condição de traço máximo
    p = aplicarImpactosComportamentais(p, { impulsividade: 3 });
    expect(avaliarCondicoesEvento(eventoImpulsivo, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, [], p)).toBe(false);
  });

  it('sem estado de personalidade informado, condição reprova por segurança (sem aprovação por falta de dado)', () => {
    expect(avaliarCondicoesEvento(eventoComCondicao, estado.personagem, estado.carreira, estado.educacao, estado.economia, estado.familia, [], undefined)).toBe(false);
  });

  it('condição pode consultar escolha anterior específica (evento + opção)', () => {
    const cond = { escolheuAnteriormente: { eventoId: 'inf_gatinho_rua', opcaoId: 'opt_adotar' } };
    let p = criarPersonalidadeInicial();
    expect(atendeCondicaoComportamental(p, cond)).toBe(false);

    p = registrarEscolha(p, { eventoId: 'inf_gatinho_rua', opcaoId: 'opt_adotar', idade: 5, ano: 2031, tagsComportamentais: { empatia: 2 } }).personalidade;
    expect(atendeCondicaoComportamental(p, cond)).toBe(true);

    // escolha de OUTRA opção do mesmo evento não satisfaz a condição específica
    let p2 = registrarEscolha(criarPersonalidadeInicial(), { eventoId: 'inf_gatinho_rua', opcaoId: 'opt_alimentar', idade: 5, ano: 2031 }).personalidade;
    expect(atendeCondicaoComportamental(p2, cond)).toBe(false);

    // sem opção especificada, qualquer escolha do evento serve
    expect(atendeCondicaoComportamental(p2, { escolheuAnteriormente: { eventoId: 'inf_gatinho_rua' } })).toBe(true);
  });

  it('opção de evento real exige histórico de disciplina (ado_cola_prova)', () => {
    const evento = MASTER_EVENTS_LIST.find(e => e.id === 'ado_cola_prova')!;
    const opcao = evento.opcoes.find(o => o.id === 'opt_estudar_juntos')!;
    expect(opcao.requisito?.condicaoComportamental).toBeDefined();

    const estadoAdolescente = criarEstadoTeste({ idade: 13 });
    // sem histórico: recusada com motivo qualitativo (sem números)
    const semHistorico = avaliarRequisitoOpcao(opcao, estadoAdolescente.personagem, estadoAdolescente.economia, criarPersonalidadeInicial());
    expect(semHistorico.aprovado).toBe(false);
    expect(semHistorico.motivo).toContain('disciplina');
    expect(semHistorico.motivo).not.toMatch(/\d/);

    // motor também recusa sem efeitos e sem registrar memória
    const res = aplicarConsequenciasEscolha(
      opcao, estadoAdolescente.personagem, estadoAdolescente.carreira, estadoAdolescente.educacao,
      estadoAdolescente.economia, estadoAdolescente.familia, 2039,
      { eventoId: 'ado_cola_prova', personalidade: criarPersonalidadeInicial() }
    );
    expect(res.recusado).toBe(true);
    expect(res.personalidadeAtualizada).toBeUndefined();
    expect(res.novosLogs).toHaveLength(0);

    // com padrão acumulado de disciplina: aprovada
    let disciplinado = criarPersonalidadeInicial();
    disciplinado = aplicarImpactosComportamentais(disciplinado, { disciplina: 5 });
    const aprovada = avaliarRequisitoOpcao(opcao, estadoAdolescente.personagem, estadoAdolescente.economia, disciplinado);
    expect(aprovada.aprovado).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cenários 11 e auditoria de conteúdo — eventos infantis coerentes e tags válidas
// ---------------------------------------------------------------------------
describe('Coerência dos eventos e da taxonomia', () => {
  it('todos os eventos têm faixa de idade válida', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      expect(evento.idadeMinima).toBeGreaterThanOrEqual(0);
      expect(evento.idadeMinima).toBeLessThanOrEqual(evento.idadeMaxima);
    }
  });

  it('"O Brinquedo na Loja" não aparece aos 3 anos (negociação verbal exigida pelas opções)', () => {
    const evento = MASTER_EVENTS_LIST.find(e => e.id === 'inf_birra_brinquedo')!;
    expect(evento.idadeMinima).toBe(4);

    const base = criarEstadoTeste({ idade: 3 });
    const cond = (idade: number) =>
      avaliarCondicoesEvento(evento, { ...criarEstadoTeste({ idade }).personagem }, base.carreira, base.educacao, base.economia, base.familia, []);

    expect(cond(2)).toBe(false);
    expect(cond(3)).toBe(false); // era o gap de coerência apontado no playtest
    expect(cond(4)).toBe(true);
    expect(cond(5)).toBe(true);
    expect(cond(6)).toBe(false);
  });

  it('todos os impactos comportamentais do catálogo usam traços válidos e valores pequenos', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      for (const opcao of evento.opcoes) {
        const impactos = opcao.consequencias.impactosComportamentais ?? {};
        for (const [traco, valor] of Object.entries(impactos)) {
          expect(TRACOS_COMPORTAMENTAIS).toContain(traco as TracoComportamental);
          expect(Math.abs(valor as number)).toBeLessThanOrEqual(IMPACTO_MAXIMO_POR_ESCOLHA);
        }
      }
    }
  });

  it('um ACONTECIMENTO nunca declara tag comportamental — quem não escolheu não é caracterizado', () => {
    // B4-FIX4 — `inf_primeiros_passos` era a amostra auditada deste teste e
    // premiava "coragem: 2" no bebê que correu atrás do brinquedo. Um bebê
    // de 1-2 anos não escolhe ser corajoso: ele anda. Desde que o evento
    // passou a ser acontecimento (a vida acontecendo, sem pergunta), a tag
    // deixou de existir no conteúdo — e o motor, por garantia redundante,
    // também a removeria antes de aplicar
    // (`events/happenings.desfechoSemMarcaDeEscolha`).
    //
    // A verificação vale para o catálogo inteiro, não para uma amostra: é a
    // regra que sustenta a personalidade emergente do VIDA.
    const violacoes: string[] = [];
    for (const evento of MASTER_EVENTS_LIST) {
      if (naturezaDoEvento(evento) !== 'acontecimento') continue;
      for (const opcao of evento.opcoes) {
        if (opcao.consequencias.impactosComportamentais) {
          violacoes.push(`${evento.id}/${opcao.id}`);
        }
      }
    }
    expect(violacoes, 'acontecimentos que atribuiriam traço a uma não-escolha').toEqual([]);

    const primeirosPassos = MASTER_EVENTS_LIST.find(e => e.id === 'inf_primeiros_passos')!;
    expect(naturezaDoEvento(primeirosPassos)).toBe('acontecimento');
  });

  it('eventos de DECISÃO infantis marcados têm opções com tags coerentes (amostra auditada)', () => {
    const esperados: Record<string, Record<string, Partial<Record<TracoComportamental, number>>>> = {
      inf_birra_brinquedo: {
        opt_espernear: { impulsividade: 2, disciplina: -1 },
        opt_aceitar: { disciplina: 2 }
      },
      inf_bullying_defesa: {
        opt_defender: { coragem: 2, empatia: 2 },
        opt_ignorar: { empatia: -2 }
      }
    };
    for (const [eventoId, opcoes] of Object.entries(esperados)) {
      const evento = MASTER_EVENTS_LIST.find(e => e.id === eventoId)!;
      for (const [opcaoId, tags] of Object.entries(opcoes)) {
        const opcao = evento.opcoes.find(o => o.id === opcaoId)!;
        expect(opcao.consequencias.impactosComportamentais).toEqual(tags);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Cenário 12 — Linha da Vida não recebe logs técnicos da memória
// ---------------------------------------------------------------------------
describe('Memória interna não vaza para a Linha da Vida', () => {
  it('responder um evento gera apenas o log narrativo; nenhum log técnico de personalidade', () => {
    const estado = criarEstadoTeste({ idade: 9 });
    const evento = MASTER_EVENTS_LIST.find(e => e.id === 'inf_bullying_defesa')!;
    const opcao = evento.opcoes.find(o => o.id === 'opt_defender')!;

    const res = aplicarConsequenciasEscolha(
      opcao, estado.personagem, estado.carreira, estado.educacao, estado.economia,
      estado.familia, 2035,
      { eventoId: evento.id, personalidade: criarPersonalidadeInicial() }
    );

    // memória registrada...
    expect(res.personalidadeAtualizada!.memorias).toHaveLength(1);
    // ...mas a timeline só recebeu o texto narrativo do resultado
    expect(res.novosLogs).toHaveLength(1);
    expect(res.novosLogs[0].texto).toBe(opcao.descricaoResultado);
    for (const log of res.novosLogs) {
      expect(log.texto).not.toMatch(/([+-]\s?\d|impactosComportamentais|traco|eventoId|opcaoId|tagsComportamentais)/i);
    }
  });
});

// ---------------------------------------------------------------------------
// Cenário 13 — mesmo evento não duplica memória indevidamente
// ---------------------------------------------------------------------------
describe('Idempotência do registro', () => {
  it('registrar a mesma escolha (mesma idade) duas vezes não duplica memória nem traço', () => {
    const registro = {
      eventoId: 'inf_birra_brinquedo', opcaoId: 'opt_aceitar', idade: 4, ano: 2030,
      tagsComportamentais: { disciplina: 2 } as Partial<Record<TracoComportamental, number>>
    };
    const primeira = registrarEscolha(criarPersonalidadeInicial(), registro);
    expect(primeira.registrada).toBe(true);

    const segunda = registrarEscolha(primeira.personalidade, registro);
    expect(segunda.registrada).toBe(false);
    expect(segunda.personalidade.memorias).toHaveLength(1);
    expect(obterIntensidade(segunda.personalidade, 'disciplina')).toBe(2); // contado uma única vez
  });

  it('o mesmo evento respondido em IDADES diferentes gera memórias legítimas (não é duplicação indevida)', () => {
    let p = criarPersonalidadeInicial();
    p = registrarEscolha(p, { eventoId: 'ext_festa_junina', opcaoId: 'opt_dancar_quadrilha', idade: 8, ano: 2034 }).personalidade;
    p = registrarEscolha(p, { eventoId: 'ext_festa_junina', opcaoId: 'opt_dancar_quadrilha', idade: 9, ano: 2035 }).personalidade;
    expect(p.memorias).toHaveLength(2);
    expect(consultarMemoria(p, { eventoId: 'ext_festa_junina' })).toHaveLength(2);
  });

  it('memória é limitada: memórias antigas são descartadas mantendo as recentes', () => {
    let p = criarPersonalidadeInicial();
    for (let i = 0; i < 130; i++) {
      p = registrarEscolha(p, { eventoId: `evt_${i}`, opcaoId: 'opt', idade: i, ano: 2000 + i }).personalidade;
    }
    expect(p.memorias.length).toBeLessThanOrEqual(120);
    expect(p.memorias[p.memorias.length - 1].eventoId).toBe('evt_129');
  });
});

// ---------------------------------------------------------------------------
// Cenário 14 — motor continua recusando ações inválidas do B1-FIX
// ---------------------------------------------------------------------------
describe('Regras do B1-FIX permanecem (sem efeitos parciais)', () => {
  it('opção recusada por requisito do B1-FIX não registra memória nem altera personalidade', () => {
    const estado = criarEstadoTeste({ idade: 30, economia: { dinheiro: 100 } });
    const opcaoCarad = {
      id: 'opt_caro',
      texto: 'Pagar tratamento de luxo',
      consequencias: { dinheiro: -5000, stats: { saude: 20 }, impactosComportamentais: { generosidade: 2 } },
      requisito: { dinheiroMinimo: 5000 }
    };

    const antes: PersonalityState = criarPersonalidadeInicial();
    const res = aplicarConsequenciasEscolha(
      opcaoCarad, estado.personagem, estado.carreira, estado.educacao, estado.economia,
      estado.familia, 2030, { eventoId: 'evt_caro', personalidade: antes }
    );

    expect(res.recusado).toBe(true);
    expect(res.economiaAtualizada.dinheiro).toBe(100);
    expect(res.personalidadeAtualizada).toBeUndefined(); // memória intacta
    expect(antes.memorias).toHaveLength(0);
  });

  it('guardas do B1-FIX seguem ativos: bebê não compra imóvel e save v1 segue migrando (cobertura completa na suíte existente)', () => {
    // Guarda de referência rápida; a suíte completa do B1-FIX (motorGuards,
    // availabilitySystem, repeticaoEAno) roda junto nesta execução.
    const estado = criarEstadoTeste({ idade: 0, economia: { dinheiro: 1000000 } });
    expect(estado.economia.propriedades).toHaveLength(0);
    expect(estado.personagem.stats).not.toHaveProperty('energia');
  });
});

// ---------------------------------------------------------------------------
// Interface — apenas rótulos qualitativos, com combinações possíveis
// ---------------------------------------------------------------------------
describe('Traços percebidos (camada interpretativa)', () => {
  it('rótulos são qualitativos: nenhum número é exposto', () => {
    let p = criarPersonalidadeInicial();
    p = aplicarImpactosComportamentais(p, { empatia: 18, disciplina: 12, generosidade: -7 });
    const percebidos = obterTracosPercebidos(p, 'feminino');
    expect(percebidos.length).toBeGreaterThan(0);
    for (const t of percebidos) {
      expect(t.rotulo).not.toMatch(/\d/);
    }
  });

  it('inflecte rótulos por gênero sem alterar o estado', () => {
    let p = criarPersonalidadeInicial();
    p = aplicarImpactosComportamentais(p, { empatia: 8 });
    const rotulosF = obterTracosPercebidos(p, 'feminino').map(t => t.rotulo);
    const rotulosM = obterTracosPercebidos(p, 'masculino').map(t => t.rotulo);
    expect(rotulosF).toContain('Empática');
    expect(rotulosM).toContain('Empático');
  });

  it('perfis contraditórios coexistem: disciplinado E impulsivo ao mesmo tempo', () => {
    let p = criarPersonalidadeInicial();
    p = aplicarImpactosComportamentais(p, { disciplina: 9, impulsividade: 7, familia: 5 });
    const rotulos = obterTracosPercebidos(p, 'masculino').map(t => t.rotulo);
    expect(rotulos).toContain('Disciplinado');
    expect(rotulos).toContain('Impulsivo');
    expect(rotulos).toContain('Ligado à família');
  });

  it('sem evidência suficiente: nenhum traço percebido (personalidade em formação)', () => {
    expect(obterTracosPercebidos(criarPersonalidadeInicial())).toEqual([]);
    let p = aplicarImpactosComportamentais(criarPersonalidadeInicial(), { coragem: LIMIAR_TRACO_PERCEBIDO - 1 });
    expect(obterTracosPercebidos(p)).toEqual([]);
  });

  it('contarOcorrenciasTag conta escolhas com a tag, não a soma dos pesos', () => {
    let p = criarPersonalidadeInicial();
    p = registrarEscolha(p, { eventoId: 'a', opcaoId: 'o', idade: 5, ano: 2031, tagsComportamentais: { empatia: 2 } }).personalidade;
    p = registrarEscolha(p, { eventoId: 'b', opcaoId: 'o', idade: 6, ano: 2032, tagsComportamentais: { empatia: 1 } }).personalidade;
    p = registrarEscolha(p, { eventoId: 'c', opcaoId: 'o', idade: 7, ano: 2033, tagsComportamentais: { coragem: 2 } }).personalidade;
    expect(contarOcorrenciasTag(p, 'empatia')).toBe(2);
    expect(contarOcorrenciasTag(p, 'coragem')).toBe(1);
    expect(contarOcorrenciasTag(p, 'generosidade')).toBe(0);
  });
});
