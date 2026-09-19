import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VERSAO_SAVE, carregarJogo, salvarJogo, limparSave } from '../saveSystem';
import { criarEstadoTeste } from './fixtures';
import { criarPersonalidadeInicial, registrarEscolha } from '../personalitySystem';

// Stub de localStorage (ambiente de teste não tem browser)
function criarLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    get _store() {
      return store;
    }
  };
}

let stub: ReturnType<typeof criarLocalStorageStub>;

beforeEach(() => {
  stub = criarLocalStorageStub();
  vi.stubGlobal('localStorage', stub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Save legado da versão 1: contém Energia, eventoAtivo serializado e
// cabeçalhos de ano armazenados. Deve carregar preservando os dados válidos.
// ---------------------------------------------------------------------------
describe('Migração de save legado (versão 1 com Energia)', () => {
  const saveLegadoV1 = {
    personagem: {
      id: 'char_velho',
      nome: 'Bruno',
      sobrenome: 'Costa',
      genero: 'masculino',
      idade: 27,
      anoAtual: 2035,
      anoNascimento: 2008,
      cidade: 'Recife',
      estado: 'PE',
      classeSocial: 'classe_media',
      stats: { felicidade: 70, saude: 80, inteligencia: 65, aparencia: 60, energia: 40 },
      hiddenStats: {
        disciplina: 55, sociabilidade: 60, empatia: 65, ambicao: 70,
        estresse: 30, reputacao: 58, condicionamentoFisico: 50
      },
      doencas: ['Asma'],
      flags: { escolaridade: 'nenhuma', casado_oficialmente: true },
      marcos: []
    },
    familia: [
      {
        id: 'fam_mae_velha', nome: 'Rita', sobrenome: 'Costa', genero: 'feminino', tipo: 'mae',
        idade: 55, relacionamento: 88, vivo: true
      }
    ],
    educacao: {
      nivelAtual: 'superior_completo', emCurso: false, desempenho: 82,
      cursosConcluidos: [{ nome: 'Direito', tipo: 'superior', anoConclusao: 2032 }]
    },
    carreira: {
      empregado: true,
      cargoAtual: {
        id: 'advogado', titulo: 'Advogado', setor: 'Jurídico', salarioMensal: 9000,
        escolaridadeMinima: 'superior_completo', inteligenciaMinima: 60,
        experienciaNecessaria: 0, horasSemanais: 40, estresseNivel: 4
      },
      anosNoCargo: 3, desempenhoTrabalho: 77, horasExtras: true, aposentado: false,
      historicoEmpregos: []
    },
    economia: {
      dinheiro: 25000, despesasAnuaisPadrao: 12000, padraoDeVida: 'confortavel',
      propriedades: [
        {
          id: 'prop_velha', tipo: 'imovel', nome: 'Apartamento', valorCompra: 300000,
          valorAtual: 330000, custoAnualManutencao: 4000, anoCompra: 2033, quitado: true
        }
      ],
      investimentos: [], dividas: 0
    },
    timeline: [
      { id: 'log_3', idade: 27, ano: 2035, categoria: 'geral', texto: 'Ação no ano 27' },
      { id: 'ano_head_1', idade: 27, ano: 2035, categoria: 'geral', texto: 'Ano 2035 — Você completou 27 anos.' },
      { id: 'log_2', idade: 26, ano: 2034, categoria: 'geral', texto: 'Acontecimento aos 26' },
      { id: 'log_1', idade: 25, ano: 2033, categoria: 'geral', texto: 'Acontecimento aos 25' }
    ],
    eventoAtivo: {
      id: 'evt_x',
      titulo: 'Evento Qualquer',
      descricao: 'desc',
      idadeMinima: 18,
      idadeMaxima: 99,
      categoria: 'cotidiano',
      peso: 10,
      opcoes: [{ id: 'opt', texto: 'Ok', consequencias: {} }]
    },
    historicoEventosDisparados: ['evt_x'],
    emJogo: true,
    morto: false
  };

  it('carrega save v1 sem quebrar: Energia descartada, dados válidos preservados', () => {
    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(saveLegadoV1));
    const estado = carregarJogo();

    expect(estado).not.toBeNull();
    expect(estado!.versao).toBe(VERSAO_SAVE);
    expect(estado!.personagem).not.toBeNull();
    expect(estado!.personagem!.nome).toBe('Bruno');
    expect(estado!.personagem!.idade).toBe(27);
    expect(estado!.personagem!.stats).not.toHaveProperty('energia');
    expect(estado!.personagem!.stats.felicidade).toBe(70);
    expect(estado!.personagem!.doencas).toEqual(['Asma']);
    // patrimônio e vínculos preservados
    expect(estado!.economia.propriedades).toHaveLength(1);
    expect(estado!.economia.dinheiro).toBe(25000);
    expect(estado!.familia).toHaveLength(1);
    expect(estado!.carreira.empregado).toBe(true);
    expect(estado!.educacao.nivelAtual).toBe('superior_completo');
    // flag legada de escolaridade descartada
    expect(estado!.personagem!.flags).not.toHaveProperty('escolaridade');
    // novos campos com padrão seguro
    expect(estado!.acoesRealizadasAno).toEqual([]);
    expect(estado!.carreira.bicoAtivoId ?? null).toBeNull();
  });

  it('eventoAtivo legado (objeto inteiro) é reidratado por id', () => {
    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(saveLegadoV1));
    const estado = carregarJogo();
    // evt_x não existe no catálogo real → evento descartado com segurança (não trava)
    expect(estado!.eventoAtivo).toBeNull();
  });

  it('remove cabeçalhos de ano legados da timeline e inverte para ordem cronológica', () => {
    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(saveLegadoV1));
    const estado = carregarJogo();
    const textos = estado!.timeline.map(e => e.texto);
    expect(textos).not.toContain('Ano 2035 — Você completou 27 anos.');
    // ordem cronológica: primeiro o mais antigo
    expect(estado!.timeline[0].texto).toBe('Acontecimento aos 25');
    expect(estado!.timeline[estado!.timeline.length - 1].idade).toBe(27);
  });

  it('JSON corrompido retorna null sem lançar (dado original preservado)', () => {
    stub.setItem('VIDA_GAME_SAVE_V1', '{isso não é json válido');
    expect(() => carregarJogo()).not.toThrow();
    expect(carregarJogo()).toBeNull();
    // não sobrescreveu o conteúdo original
    expect(stub.getItem('VIDA_GAME_SAVE_V1')).toBe('{isso não é json válido');
  });

  it('payload sem personagem válido retorna null (erro recuperável)', () => {
    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify({ versao: 1, timeline: [] }));
    expect(carregarJogo()).toBeNull();
  });
});

describe('Save atual (versão 2): ida e volta', () => {
  it('salva e recarrega preservando estado relevante, sem Energia e com evento por id', () => {
    const estado = criarEstadoTeste({ idade: 20 });
    const estadoCompleto = {
      versao: VERSAO_SAVE,
      personagem: estado.personagem,
      familia: estado.familia,
      educacao: estado.educacao,
      carreira: estado.carreira,
      economia: estado.economia,
      personalidade: criarPersonalidadeInicial(),
      timeline: [{ id: 'l1', idade: 20, ano: 2026, categoria: 'geral' as const, texto: 'Feito' }],
      eventoAtivo: null,
      historicoEventosDisparados: [],
      acoesRealizadasAno: ['atividade:act_leitura'],
      emJogo: true,
      morto: false
    };

    expect(salvarJogo(estadoCompleto)).toBe(true);
    const bruto = JSON.parse(stub.getItem('VIDA_GAME_SAVE_V1')!);
    // o evento ativo não é serializado como objeto inteiro
    expect(bruto.eventoAtivo).toBeUndefined();
    expect(bruto.eventoAtivoId).toBeNull();
    expect(bruto.versao).toBe(VERSAO_SAVE);

    const recarregado = carregarJogo();
    expect(recarregado!.acoesRealizadasAno).toEqual(['atividade:act_leitura']);
    expect(recarregado!.personagem!.nome).toBe('Ana');
    expect(recarregado!.personagem!.stats).not.toHaveProperty('energia');
    // timeline v2 NÃO é invertida na migração
    expect(recarregado!.timeline[0].texto).toBe('Feito');

    limparSave();
    expect(carregarJogo()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// B2 — migração de saves do B1-FIX (versão 2, sem PersonalityState):
// carregam normalmente com personalidade inicializada em branco.
// Saves da versão 3 preservam personalidade e memória de escolhas.
// ---------------------------------------------------------------------------
describe('Migração de save B1-FIX (versão 2) para schema com personalidade', () => {
  const saveB1FixV2 = {
    versao: 2,
    personagem: {
      id: 'char_b1fix',
      nome: 'Carla',
      sobrenome: 'Mendes',
      genero: 'feminino',
      idade: 9,
      anoAtual: 2035,
      anoNascimento: 2026,
      cidade: 'Curitiba',
      estado: 'PR',
      classeSocial: 'classe_media',
      stats: { felicidade: 75, saude: 85, inteligencia: 60, aparencia: 65 },
      hiddenStats: {
        disciplina: 62, sociabilidade: 58, empatia: 66, ambicao: 55,
        estresse: 15, reputacao: 60, condicionamentoFisico: 55
      },
      doencas: [],
      flags: { tem_animal_estimacao: true },
      marcos: []
    },
    familia: [
      {
        id: 'fam_mae_b1', nome: 'Sueli', sobrenome: 'Mendes', genero: 'feminino', tipo: 'mae',
        idade: 38, relacionamento: 80, vivo: true
      }
    ],
    educacao: { nivelAtual: 'fundamental_incompleto', emCurso: true, desempenho: 78, cursosConcluidos: [] },
    carreira: { empregado: false, anosNoCargo: 0, desempenhoTrabalho: 60, horasExtras: false, aposentado: false, historicoEmpregos: [] },
    economia: { dinheiro: 0, despesasAnuaisPadrao: 0, padraoDeVida: 'modesto', propriedades: [], investimentos: [], dividas: 0 },
    timeline: [
      { id: 'log_b1_1', idade: 8, ano: 2034, categoria: 'geral', texto: 'Aconteceu algo aos 8' },
      { id: 'log_b1_2', idade: 9, ano: 2035, categoria: 'geral', texto: 'Aconteceu algo aos 9' }
    ],
    eventoAtivoId: null,
    historicoEventosDisparados: ['inf_primeiro_dia_escola'],
    acoesRealizadasAno: [],
    emJogo: true,
    morto: false
  };

  it('save do B1-FIX sem personalidade carrega normalmente e inicializa os novos campos', () => {
    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(saveB1FixV2));
    const estado = carregarJogo();

    expect(estado).not.toBeNull();
    expect(estado!.versao).toBe(VERSAO_SAVE);
    // dados válidos do B1-FIX preservados (nada destruído)
    expect(estado!.personagem!.nome).toBe('Carla');
    expect(estado!.personagem!.idade).toBe(9);
    expect(estado!.personagem!.flags['tem_animal_estimacao']).toBe(true);
    expect(estado!.historicoEventosDisparados).toContain('inf_primeiro_dia_escola');
    expect(estado!.timeline).toHaveLength(2);
    // personalidade inicializada de forma segura (em branco, sem invenção)
    expect(estado!.personalidade).toEqual(criarPersonalidadeInicial());
    expect(estado!.personalidade.memorias).toEqual([]);
  });

  it('save novo (v3) preserva personalidade e memória de escolhas na ida e volta', () => {
    const estado = criarEstadoTeste({ idade: 12 });
    let personalidade = criarPersonalidadeInicial();
    personalidade = registrarEscolha(personalidade, {
      eventoId: 'inf_birra_brinquedo',
      opcaoId: 'opt_aceitar',
      idade: 5,
      ano: 2031,
      tagsComportamentais: { disciplina: 2 }
    }).personalidade;
    personalidade = registrarEscolha(personalidade, {
      eventoId: 'inf_bullying_defesa',
      opcaoId: 'opt_defender',
      idade: 9,
      ano: 2035,
      tagsComportamentais: { coragem: 2, empatia: 2 }
    }).personalidade;

    const estadoCompleto = {
      versao: VERSAO_SAVE,
      personagem: estado.personagem,
      familia: estado.familia,
      educacao: estado.educacao,
      carreira: estado.carreira,
      economia: estado.economia,
      personalidade,
      timeline: [],
      eventoAtivo: null,
      historicoEventosDisparados: [],
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    };

    expect(salvarJogo(estadoCompleto)).toBe(true);
    const recarregado = carregarJogo();

    expect(recarregado!.personalidade).toEqual(personalidade);
    expect(recarregado!.personalidade.tracos.coragem).toBe(2);
    expect(recarregado!.personalidade.tracos.empatia).toBe(2);
    expect(recarregado!.personalidade.tracos.disciplina).toBe(2);
    expect(recarregado!.personalidade.memorias).toHaveLength(2);
    expect(recarregado!.personalidade.memorias[0].opcaoId).toBe('opt_aceitar');
    expect(recarregado!.personalidade.memorias[1].eventoId).toBe('inf_bullying_defesa');
  });

  it('save v3 com personalidade corrompida é normalizado sem descartar a partida', () => {
    const saveCorrompido = {
      ...saveB1FixV2,
      versao: 3,
      personalidade: {
        tracos: { empatia: 'muito', generosidade: 7, traco_inexistente: 99 },
        memorias: [
          { eventoId: 'inf_gatinho_rua', opcaoId: 'opt_adotar', idade: 4, ano: 2030, tagsComportamentais: { empatia: 2 }, impactos: { empatia: 2 } },
          { eventoId: 42, opcaoId: 'x' }, // registro inválido: descartado
          'lixo'
        ]
      }
    };
    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(saveCorrompido));
    const estado = carregarJogo();

    expect(estado).not.toBeNull();
    expect(estado!.personagem!.nome).toBe('Carla'); // partida preservada
    expect(estado!.personalidade.tracos.generosidade).toBe(7);
    expect(estado!.personalidade.tracos.empatia).toBe(0); // valor não numérico descartado
    expect(estado!.personalidade.tracos).not.toHaveProperty('traco_inexistente');
    expect(estado!.personalidade.memorias).toHaveLength(1);
    expect(estado!.personalidade.memorias[0].eventoId).toBe('inf_gatinho_rua');
  });
});
