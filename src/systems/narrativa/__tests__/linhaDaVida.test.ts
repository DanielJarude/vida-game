/**
 * F5 — TESTES SEMÂNTICOS DA LINHA DA VIDA.
 *
 * O contrato aqui é de SENTIDO, não de redação. Por isso quase nenhum teste
 * compara string exata: um autor deve poder reescrever "Enfrentou sozinho um
 * medo do escuro..." sem quebrar a suíte, mas NÃO deve poder fazer a memória
 * desaparecer, nem fazer uma pequena memória mexer em estado, nem afirmar um
 * amigo que não existe.
 *
 * Onde um literal aparece (o caso monstro/casaco), ele é o caso reproduzido
 * do playtest e está verificado por propriedade — "é compreensível isolado" —
 * e não por igualdade de texto.
 */

import { describe, it, expect } from 'vitest';
import { MASTER_EVENTS_LIST } from '../../../data/events/allEvents';
import { classificacaoDoEvento } from '../../events/taxonomia';
import { memoriaDoDesfecho, temMemoriaDedicada } from '../memoriaDoEvento';
import { gerarPequenaMemoria } from '../../memorias/pequenaMemoria';
import type { ContextoMemoria } from '../../memorias/pequenaMemoria';
import { criarPersonagemTeste, criarFamiliaTeste } from '../../__tests__/fixtures';
import { criarCarreiraInicial } from '../../careerSystem';
import { criarEducacaoInicial } from '../../educationSystem';
import { criarEconomiaInicial } from '../../economySystem';
import type { EventOption, FamilyMember, GameEvent, LifeLogEntry } from '../../../types';

const eventos = MASTER_EVENTS_LIST as GameEvent[];
const automaticos = eventos.filter(e => {
  const t = classificacaoDoEvento(e);
  return t.startsWith('acontecimento') || t === 'marco_testemunhado';
});

function ctxBase(over: Partial<ContextoMemoria> = {}): ContextoMemoria {
  const personagem = criarPersonagemTeste({ idade: 8 });
  return {
    personagem,
    carreira: criarCarreiraInicial(),
    educacao: criarEducacaoInicial(),
    economia: criarEconomiaInicial('classe_media'),
    familia: criarFamiliaTeste(),
    ...over
  };
}

function membro(tipo: FamilyMember['tipo'], nome: string, idade = 10): FamilyMember {
  return {
    id: `fam_${tipo}_${nome}`,
    nome,
    sobrenome: 'Souza',
    genero: 'masculino',
    tipo,
    idade,
    relacionamento: 80,
    vivo: true
  };
}

// --------------------------------------------------------------------------
describe('F5 · memória do evento — a situação não se perde', () => {
  it('um desfecho com memória dedicada registra a MEMÓRIA, não o resultado', () => {
    const opcao: EventOption = {
      id: 'o',
      texto: '',
      descricaoResultado: 'Você devolveu na hora combinada.',
      descricaoMemoria: 'Ganhou os primeiros minutos sozinho no tablet da casa.',
      consequencias: {}
    };
    expect(memoriaDoDesfecho(opcao)).toBe('Ganhou os primeiros minutos sozinho no tablet da casa.');
  });

  it('sem memória dedicada, o resultado vai para a Linha da Vida como está', () => {
    const opcao: EventOption = {
      id: 'o',
      texto: '',
      descricaoResultado: 'A febre passou de manhã.',
      consequencias: {}
    };
    expect(memoriaDoDesfecho(opcao)).toBe('A febre passou de manhã.');
  });

  it('sem nenhum texto, não registra nada — silêncio é resultado válido', () => {
    expect(memoriaDoDesfecho({ id: 'o', texto: '', consequencias: {} })).toBeNull();
  });

  it('memória vazia ou só espaços não mascara o resultado', () => {
    const opcao: EventOption = {
      id: 'o',
      texto: '',
      descricaoResultado: 'Resultado real.',
      descricaoMemoria: '   ',
      consequencias: {}
    };
    expect(memoriaDoDesfecho(opcao)).toBe('Resultado real.');
  });

  it('NÃO concatena situação e resultado (a correção recusada pelo escopo)', () => {
    // A memória é AUTORADA. Se o motor colasse os dois textos, o resultado
    // conteria a situação inteira — e é isso que este teste proíbe.
    const opcao: EventOption = {
      id: 'o',
      texto: '',
      descricaoResultado: 'Você encarou e viu que era um casaco.',
      consequencias: {}
    };
    const saida = memoriaDoDesfecho(opcao)!;
    expect(saida).toBe('Você encarou e viu que era um casaco.');
    expect(saida).not.toContain('o quarto fica escuro');
  });
});

// --------------------------------------------------------------------------
describe('F5 · caso do playtest — monstro/casaco', () => {
  const evento = eventos.find(e => e.id === 'prc_medo_escuro')!;
  const encarar = evento.opcoes.find(o => o.id === 'opt_encarar_armario')!;

  it('o evento ainda existe e continua sendo acontecimento automático', () => {
    expect(evento).toBeDefined();
    expect(classificacaoDoEvento(evento).startsWith('acontecimento')).toBe(true);
  });

  it('a memória é compreensível sozinha: diz DO QUE se trata, não só o desfecho', () => {
    const texto = memoriaDoDesfecho(encarar)!;
    // Contrato semântico: quem lê a linha isolada, anos depois, precisa saber
    // que aquilo foi um medo do escuro — o resultado original só dizia
    // "encarou o monstro e era um casaco", começando no meio da história.
    expect(texto.toLowerCase()).toContain('medo do escuro');
    // E a resolução concreta continua lá.
    expect(texto.toLowerCase()).toContain('casaco');
  });

  it('todos os desfechos deste evento têm memória própria', () => {
    for (const o of evento.opcoes) {
      expect(temMemoriaDedicada(o), `${o.id} sem memória`).toBe(true);
    }
  });
});

// --------------------------------------------------------------------------
describe('F5 · acontecimento não inventa escolha', () => {
  // Guarda da F3, reverificada DEPOIS da composição narrativa (seção 5).
  const VERBOS_DE_DELIBERACAO =
    /\b(você (decidiu|escolheu|preferiu|optou|resolveu deliberadamente|recusou|aceitou))\b/i;

  it('nenhuma MEMÓRIA nova atribui deliberação ao jogador', () => {
    const infratores: string[] = [];
    for (const e of automaticos) {
      for (const o of e.opcoes) {
        if (!temMemoriaDedicada(o)) continue;
        if (VERBOS_DE_DELIBERACAO.test(o.descricaoMemoria!)) {
          infratores.push(`${e.id}/${o.id}: ${o.descricaoMemoria}`);
        }
      }
    }
    expect(
      infratores,
      'Um acontecimento é resolvido pelo motor. A memória não pode dizer que ' +
        'o jogador decidiu algo que ele nunca decidiu.'
    ).toEqual([]);
  });

  it('nenhum desfecho automático atribui deliberação ao jogador', () => {
    const infratores: string[] = [];
    for (const e of automaticos) {
      for (const o of e.opcoes) {
        const t = o.descricaoResultado ?? '';
        if (VERBOS_DE_DELIBERACAO.test(t)) infratores.push(`${e.id}/${o.id}`);
      }
    }
    expect(infratores).toEqual([]);
  });
});

// --------------------------------------------------------------------------
describe('F5 · pequena memória — o que ela NUNCA faz', () => {
  it('é sempre textura, nunca marco nem decisão', () => {
    const memoria = gerarPequenaMemoria(ctxBase({ personagem: criarPersonagemTeste({ idade: 8 }) }), [], 8, 2034);
    if (memoria) expect(memoria.relevancia).toBe('textura');
  });

  it('não devolve estado: a assinatura só produz uma linha de log', () => {
    const ctx = ctxBase();
    const antesPersonagem = JSON.stringify(ctx.personagem);
    const antesFamilia = JSON.stringify(ctx.familia);
    const antesEconomia = JSON.stringify(ctx.economia);
    const antesCarreira = JSON.stringify(ctx.carreira);

    gerarPequenaMemoria(ctx, [], ctx.personagem.idade, 2034);

    // Nenhuma mutação em nada que tenha sido passado.
    expect(JSON.stringify(ctx.personagem)).toBe(antesPersonagem);
    expect(JSON.stringify(ctx.familia)).toBe(antesFamilia);
    expect(JSON.stringify(ctx.economia)).toBe(antesEconomia);
    expect(JSON.stringify(ctx.carreira)).toBe(antesCarreira);
  });

  it('não cria NPC: a família sai do mesmo tamanho', () => {
    const ctx = ctxBase();
    const antes = ctx.familia.length;
    gerarPequenaMemoria(ctx, [], ctx.personagem.idade, 2034);
    expect(ctx.familia.length).toBe(antes);
  });

  it('não altera personalidade: o retorno não tem campo de traço nenhum', () => {
    const memoria = gerarPequenaMemoria(ctxBase(), [], 8, 2034);
    if (memoria) {
      expect(Object.keys(memoria).sort()).toEqual(
        ['ano', 'categoria', 'id', 'idade', 'relevancia', 'texto', 'tipo'].sort()
      );
    }
  });

  it('NÃO aparece quando o ano já tem conteúdo (não polui)', () => {
    const jaTem: LifeLogEntry[] = [
      { id: 'l1', idade: 8, ano: 2034, categoria: 'escola', texto: 'Algo aconteceu.', tipo: 'info' }
    ];
    expect(gerarPequenaMemoria(ctxBase(), jaTem, 8, 2034)).toBeNull();
  });

  it('o silêncio continua possível: estado sem nada a dizer devolve null', () => {
    // CONTRATO ATUALIZADO NO F5-FIX, com o motivo registrado:
    //
    // Na F5 este teste usava uma criança de 4 anos COM pai e mãe e esperava
    // silêncio. O playtest humano mostrou que era justamente essa a faixa do
    // buraco "2 anos -> 6 anos", e o F5-FIX passou a reconhecer uma verdade
    // que já existia no estado e não era consultada: alguém está criando essa
    // criança (`mem_primeira_infancia_casa`, que exige `temResponsavel`).
    //
    // O contrato que continua valendo — e que este teste agora verifica de
    // forma mais honesta — é: sem NENHUM contexto verdadeiro, nada é emitido.
    // Por isso a família aqui está vazia: criança sem responsável vivo, sem
    // irmão, sem pet e sem escola não recebe memória nenhuma.
    const ctx = ctxBase({
      personagem: criarPersonagemTeste({ idade: 4 }),
      familia: []
    });
    expect(gerarPequenaMemoria(ctx, [], 4, 2030)).toBeNull();
  });
});

// --------------------------------------------------------------------------
describe('F5 · pequena memória respeita o contexto da F4', () => {
  // Estes são os testes NEGATIVOS exigidos pela seção 14: nenhuma memória
  // pode pressupor algo que o estado não contém.
  //
  // As idades usadas aqui são PARES de propósito: memórias de época têm
  // `cadencia: 'alternada'` e só podem aparecer em ano par (ver
  // pequenaMemoria). Testar o caso POSITIVO num ano ímpar mediria a cadência,
  // não o contexto — e o contrato sob teste aqui é o contexto.

  function textoDaMemoria(ctx: ContextoMemoria, idade: number): string {
    const m = gerarPequenaMemoria(ctx, [], idade, 2030 + idade);
    return m?.texto ?? '';
  }

  it('sem irmão, nenhuma memória fala de irmãos', () => {
    const t = textoDaMemoria(ctxBase({ personagem: criarPersonagemTeste({ idade: 8 }) }), 8);
    expect(t.toLowerCase()).not.toContain('irmão');
    expect(t.toLowerCase()).not.toContain('irmãos');
  });

  it('COM irmão, a memória de irmãos passa a ser possível', () => {
    const ctx = ctxBase({
      personagem: criarPersonagemTeste({ idade: 8 }),
      familia: [...criarFamiliaTeste(), membro('irmao', 'Tiago', 7)]
    });
    expect(textoDaMemoria(ctx, 8).toLowerCase()).toContain('irmão');
  });

  it('TRANSIÇÃO: removido o irmão, a memória volta a não mencioná-lo', () => {
    const comIrmao = ctxBase({
      personagem: criarPersonagemTeste({ idade: 8 }),
      familia: [...criarFamiliaTeste(), membro('irmao', 'Tiago', 7)]
    });
    expect(textoDaMemoria(comIrmao, 8).toLowerCase()).toContain('irmão');

    const semIrmao = ctxBase({ personagem: criarPersonagemTeste({ idade: 8 }) });
    expect(textoDaMemoria(semIrmao, 8).toLowerCase()).not.toContain('irmão');
  });

  it('sem pet, nenhuma memória fala de bicho de estimação', () => {
    const t = textoDaMemoria(ctxBase({ personagem: criarPersonagemTeste({ idade: 10 }) }), 10);
    expect(t.toLowerCase()).not.toContain('estimação');
    expect(t.toLowerCase()).not.toContain('bicho');
  });

  it('COM pet, a memória de pet passa a ser possível', () => {
    const ctx = ctxBase({
      personagem: criarPersonagemTeste({ idade: 10 }),
      familia: [...criarFamiliaTeste(), membro('pet', 'Bidu', 3)]
    });
    const t = textoDaMemoria(ctx, 10).toLowerCase();
    expect(t.includes('estimação') || t.includes('bicho') || t.includes('animal')).toBe(true);
  });

  it('sem amigo, nenhuma memória de adolescência fala de amigos', () => {
    const t = textoDaMemoria(ctxBase({ personagem: criarPersonagemTeste({ idade: 13 }) }), 13);
    expect(t.toLowerCase()).not.toContain('amigo');
  });

  it('COM amigo, a memória de amizade passa a ser possível', () => {
    const ctx = ctxBase({
      personagem: criarPersonagemTeste({ idade: 14 }),
      familia: [...criarFamiliaTeste(), membro('amigo', 'Léo', 14)]
    });
    expect(textoDaMemoria(ctx, 14).toLowerCase()).toContain('amigo');
  });

  it('sem matrícula ativa, nenhuma memória afirma estar na escola', () => {
    // Educação inicial não está em curso.
    const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade: 8 }) });
    const t = textoDaMemoria(ctx, 8).toLowerCase();
    expect(t).not.toContain('escola');
    expect(t).not.toContain('aula');
  });

  it('COM matrícula ativa, a memória escolar passa a ser possível', () => {
    const ctx = ctxBase({
      personagem: criarPersonagemTeste({ idade: 8 }),
      educacao: { ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'fundamental' }
    });
    const t = textoDaMemoria(ctx, 8).toLowerCase();
    expect(t.includes('escola') || t.includes('aula') || t.includes('escolar')).toBe(true);
  });

  it('nenhuma memória de criança fala de emprego, cônjuge ou filhos', () => {
    for (let idade = 1; idade <= 17; idade++) {
      const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade }) });
      const t = textoDaMemoria(ctx, idade).toLowerCase();
      for (const proibido of ['trabalho', 'emprego', 'esposa', 'esposo', 'filho', 'aposenta']) {
        expect(t.includes(proibido), `idade ${idade} disse "${proibido}": ${t}`).toBe(false);
      }
    }
  });
});

// --------------------------------------------------------------------------
describe('F5 · memória é determinística e não se repete em anos seguidos', () => {
  it('mesmo estado produz o mesmo texto (sem RNG)', () => {
    const a = gerarPequenaMemoria(ctxBase(), [], 8, 2034);
    const b = gerarPequenaMemoria(ctxBase(), [], 8, 2034);
    expect(a?.texto).toBe(b?.texto);
  });

  it('aparições seguidas da mesma memória não repetem a frase literal', () => {
    // Foi o teste qualitativo que pegou isto: uma criança com irmãos tinha a
    // MESMA frase, palavra por palavra, em dois registros seguidos — o que lê
    // como bug e não como biografia. Com `cadencia: 'alternada'`, duas
    // aparições consecutivas da memória de irmãos são anos pares seguidos.
    const familia = [...criarFamiliaTeste(), membro('irmao', 'Tiago', 7)];
    const t8 = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 8 }), familia }), [], 8, 2034
    )?.texto;
    const t10 = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 10 }), familia }), [], 10, 2036
    )?.texto;
    expect(t8).toBeTruthy();
    expect(t10).toBeTruthy();
    expect(t8).not.toBe(t10);
  });
});

// --------------------------------------------------------------------------
describe('F5 · cobertura de memória por faixa etária', () => {
  it('uma criança em idade escolar matriculada tem memória nos anos de cadência', () => {
    // Anos pares: a memória de época pode aparecer. Nos ímpares o silêncio é
    // o comportamento desejado, coberto pelo teste seguinte.
    for (let idade = 6; idade <= 14; idade += 2) {
      const ctx = ctxBase({
        personagem: criarPersonagemTeste({ idade }),
        educacao: { ...criarEducacaoInicial(), emCurso: true, tipoCurso: 'fundamental' }
      });
      expect(gerarPequenaMemoria(ctx, [], idade, 2030 + idade), `idade ${idade}`).not.toBeNull();
    }
  });

  it('um bebê de 0 a 2 sempre tem memória possível', () => {
    for (let idade = 0; idade <= 2; idade++) {
      const ctx = ctxBase({ personagem: criarPersonagemTeste({ idade }) });
      expect(gerarPequenaMemoria(ctx, [], idade, 2026 + idade), `idade ${idade}`).not.toBeNull();
    }
  });

  it('a infância NÃO é preenchida incondicionalmente (silêncio preservado)', () => {
    // Nenhuma memória de infância pode ser uma rede INCONDICIONAL — esse foi
    // o texto de preenchimento removido pelo B4-FIX4 e recusado de novo na F5.
    //
    // O F5-FIX acrescentou `mem_primeira_infancia_casa` para a faixa 3-5, mas
    // ela exige `temResponsavel`. A prova de que não é rede incondicional é
    // esta: sem nenhum vínculo vivo, o silêncio permanece.
    const semVinculo = [3, 4, 5].map(idade =>
      gerarPequenaMemoria(
        ctxBase({ personagem: criarPersonagemTeste({ idade }), familia: [] }), [], idade, 2030
      )
    );
    expect(semVinculo.every(m => m === null)).toBe(true);

    // E a cadência continua produzindo silêncio em ano ímpar, mesmo com
    // contexto verdadeiro disponível, quando não há buraco se formando.
    const anoImpar = gerarPequenaMemoria(
      ctxBase({ personagem: criarPersonagemTeste({ idade: 5 }) }), [], 5, 2031,
      [{ id: 'l', idade: 4, ano: 2030, categoria: 'geral', texto: 'algo' }]
    );
    expect(anoImpar).toBeNull();
  });
});

// --------------------------------------------------------------------------
describe('F5 · catálogo — guarda permanente das memórias declaradas', () => {
  it('nenhuma memória dedicada é idêntica ao seu próprio resultado', () => {
    const inuteis: string[] = [];
    for (const e of eventos) {
      for (const o of e.opcoes) {
        if (!temMemoriaDedicada(o)) continue;
        if (o.descricaoMemoria!.trim() === (o.descricaoResultado ?? '').trim()) {
          inuteis.push(`${e.id}/${o.id}`);
        }
      }
    }
    expect(inuteis, 'memória idêntica ao resultado não acrescenta nada').toEqual([]);
  });

  it('toda memória dedicada é uma frase completa e não um fragmento', () => {
    for (const e of eventos) {
      for (const o of e.opcoes) {
        if (!temMemoriaDedicada(o)) continue;
        const t = o.descricaoMemoria!.trim();
        expect(t.length, `${e.id}/${o.id} curta demais`).toBeGreaterThan(20);
        expect(/[.!?]$/.test(t), `${e.id}/${o.id} sem pontuação final`).toBe(true);
      }
    }
  });
});
