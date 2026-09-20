/**
 * @vitest-environment jsdom
 *
 * B4 — camada de apresentação.
 *
 * Garante que a UI derive tudo do estado real do motor e que o rework não
 * tenha introduzido regressão em save/reload nem vazamento de dados internos.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  agruparTimeline,
  rotuloIdade,
  rotuloCategoriaTimeline
} from '../timelinePresentation';
import {
  construirResumoAnual,
  descreverEfeitosPublicos
} from '../outcomePresentation';
import {
  classificarProximidade,
  selecionarRelacionamentosDestaque,
  apresentarRelacionamento
} from '../relationshipPresentation';
import {
  obterFaseApresentacao,
  obterPerfilDeFase,
  deveMostrarFinancasNaVisaoGeral
} from '../lifeStagePresentation';

import { salvarJogo, carregarJogo, VERSAO_SAVE } from '../../systems/saveSystem';
import { criarEstadoTeste, criarFamiliaTeste } from '../../systems/__tests__/fixtures';
import {
  CIDADES_BRASILEIRAS,
  encontrarCidade
} from '../../data/brazilianData';
import { criarPersonalidadeInicial } from '../../systems/personalitySystem';
import type { GameState, LifeLogEntry } from '../../types';

/* ------------------------------------------------------------- timeline */

describe('B4 · apresentação da Linha da Vida', () => {
  const logs: LifeLogEntry[] = [
    {
      id: 'l0',
      idade: 0,
      ano: 2026,
      categoria: 'geral',
      texto: 'Você nasceu em Marília, SP. Sua família comemorou a chegada.',
      tipo: 'importante'
    },
    {
      id: 'l1',
      idade: 1,
      ano: 2027,
      categoria: 'familia',
      texto: 'Primeiros passos.',
      tipo: 'positivo'
    },
    {
      id: 'l2',
      idade: 1,
      ano: 2027,
      categoria: 'saude',
      texto: 'Uma gripe forte no inverno.',
      tipo: 'negativo'
    }
  ];

  it('agrupa por ano preservando a ordem cronológica', () => {
    const grupos = agruparTimeline(logs);

    expect(grupos).toHaveLength(2);
    expect(grupos[0].idade).toBe(0);
    expect(grupos[1].idade).toBe(1);
    expect(grupos[1].entradas).toHaveLength(2);
  });

  it('marca o primeiro acontecimento da vida como nascimento', () => {
    const grupos = agruparTimeline(logs);
    expect(grupos[0].entradas[0].enfase).toBe('nascimento');
  });

  it('deriva ênfase do tipo registrado pelo motor', () => {
    const grupos = agruparTimeline(logs);
    const [passos, gripe] = grupos[1].entradas;

    expect(passos.enfase).toBe('positivo');
    expect(gripe.enfase).toBe('negativo');
  });

  it('divide texto longo em título e resumo sem inventar conteúdo', () => {
    const grupos = agruparTimeline(logs);
    const nascimento = grupos[0].entradas[0];

    expect(nascimento.titulo).toBe('Você nasceu em Marília, SP.');
    expect(nascimento.resumo).toBe('Sua família comemorou a chegada.');
  });

  it('texto curto vira apenas título, sem resumo fabricado', () => {
    const grupos = agruparTimeline([logs[1]]);
    expect(grupos[0].entradas[0].titulo).toBe('Primeiros passos.');
    expect(grupos[0].entradas[0].resumo).toBeUndefined();
  });

  it('usa rótulos de idade corretos, inclusive singular e ano zero', () => {
    expect(rotuloIdade(0)).toBe('Nascimento');
    expect(rotuloIdade(1)).toBe('1 ano');
    expect(rotuloIdade(18)).toBe('18 anos');
  });

  it('traduz todas as categorias para pt-BR', () => {
    expect(rotuloCategoriaTimeline('carreira')).toBe('Carreira');
    expect(rotuloCategoriaTimeline('amor')).toBe('Relacionamento');
  });

  it('timeline vazia não quebra o agrupamento', () => {
    expect(agruparTimeline([])).toEqual([]);
  });
});

/* -------------------------------------------------------- efeitos públicos */

describe('B4 · separação entre efeito público e estado interno', () => {
  it('nunca expõe hiddenStats', () => {
    const efeitos = descreverEfeitosPublicos({
      hiddenStats: { disciplina: 5, estresse: -3, reputacao: 8 }
    });
    expect(efeitos).toHaveLength(0);
  });

  it('nunca expõe impactos comportamentais', () => {
    const efeitos = descreverEfeitosPublicos({
      impactosComportamentais: { empatia: 3, coragem: 2 }
    });
    expect(efeitos).toHaveLength(0);
  });

  it('descreve atributos visíveis por direção, sem o delta numérico', () => {
    const efeitos = descreverEfeitosPublicos({ stats: { felicidade: 7 } });
    expect(efeitos[0].texto).toBe('Felicidade aumentou');
    expect(efeitos[0].texto).not.toContain('7');
  });

  it('formata dinheiro recebido e gasto a partir do valor real', () => {
    expect(descreverEfeitosPublicos({ dinheiro: 500 })[0].tom).toBe('positivo');
    expect(descreverEfeitosPublicos({ dinheiro: -500 })[0].tom).toBe('negativo');
  });

  it('descreve relacionamento por direção, sem percentual', () => {
    const efeitos = descreverEfeitosPublicos({
      relacionamentoDelta: { relationType: 'mae', delta: 10 }
    });
    expect(efeitos[0].texto).not.toContain('%');
    expect(efeitos[0].texto).toMatch(/melhorou/i);
  });

  it('ignora deltas zerados', () => {
    expect(descreverEfeitosPublicos({ dinheiro: 0, stats: { saude: 0 } })).toHaveLength(0);
  });
});

/* ------------------------------------------------------------ resumo anual */

describe('B4 · resumo anual', () => {
  it('marca como silencioso um ano sem acontecimentos relevantes', () => {
    expect(construirResumoAnual(4, 2030, []).silencioso).toBe(true);
  });

  it('filtra ruído de cotidiano', () => {
    const resumo = construirResumoAnual(8, 2034, [
      {
        id: 'c1',
        idade: 8,
        ano: 2034,
        categoria: 'cotidiano',
        texto: 'Mais um dia.',
        tipo: 'info'
      }
    ]);
    expect(resumo.silencioso).toBe(true);
  });

  it('preserva o texto do motor, sem reescrever a narrativa', () => {
    const texto = 'Você foi aprovado no vestibular.';
    const resumo = construirResumoAnual(18, 2044, [
      { id: 'x', idade: 18, ano: 2044, categoria: 'escola', texto, tipo: 'importante' }
    ]);

    expect(resumo.itens[0].texto).toBe(texto);
    expect(resumo.itens[0].tom).toBe('positivo');
  });
});

/* -------------------------------------------------------- relacionamentos */

describe('B4 · proximidade qualitativa', () => {
  it('classifica a intensidade interna em faixas legíveis', () => {
    expect(classificarProximidade(95)).toBe('muito_proxima');
    expect(classificarProximidade(65)).toBe('proxima');
    expect(classificarProximidade(45)).toBe('estavel');
    expect(classificarProximidade(25)).toBe('distante');
    expect(classificarProximidade(5)).toBe('conflituosa');
  });

  it('o rótulo exibido nunca contém números', () => {
    const p = apresentarRelacionamento(criarFamiliaTeste()[0]);
    expect(/\d/.test(p.rotuloProximidade)).toBe(false);
  });

  it('destaca apenas pessoas vivas', () => {
    const familia = criarFamiliaTeste();
    familia[0].vivo = false;

    const destaque = selecionarRelacionamentosDestaque(familia);
    expect(destaque.every(p => p.membro.vivo)).toBe(true);
  });

  it('ordena por proximidade', () => {
    const destaque = selecionarRelacionamentosDestaque(criarFamiliaTeste());
    // Mãe (90) antes do pai (85).
    expect(destaque[0].nome).toBe('Maria');
  });
});

/* ------------------------------------------------------------- fase da vida */

describe('B4 · a interface acompanha a fase da vida', () => {
  it('mapeia as seis faixas de apresentação', () => {
    expect(obterFaseApresentacao(1)).toBe('bebe');
    expect(obterFaseApresentacao(4)).toBe('primeira_infancia');
    expect(obterFaseApresentacao(8)).toBe('infancia');
    expect(obterFaseApresentacao(13)).toBe('adolescencia_inicial');
    expect(obterFaseApresentacao(16)).toBe('adolescencia_final');
    expect(obterFaseApresentacao(30)).toBe('adulto');
  });

  it('um bebê não recebe painel financeiro dominante', () => {
    expect(obterPerfilDeFase(0).mostrarFinancas).toBe(false);
    expect(deveMostrarFinancasNaVisaoGeral(0, false)).toBe(false);
  });

  it('um adulto recebe o painel financeiro', () => {
    expect(deveMostrarFinancasNaVisaoGeral(25, false)).toBe(true);
  });

  it('menor com patrimônio legítimo enxerga finanças (posse ≠ poder agir)', () => {
    expect(deveMostrarFinancasNaVisaoGeral(10, true)).toBe(true);
  });

  it('personalidade não é anunciada para um bebê', () => {
    expect(obterPerfilDeFase(1).mostrarPersonalidade).toBe(false);
  });
});

/* ----------------------------------------------------------- save / reload */

describe('B4 · o rework não afeta save e reload', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('salva e recarrega preservando o estado do jogo', () => {
    const estado = criarEstadoTeste({ idade: 22 });

    const gameState: GameState = {
      versao: VERSAO_SAVE,
      personagem: estado.personagem,
      familia: estado.familia,
      educacao: estado.educacao,
      carreira: estado.carreira,
      economia: estado.economia,
      personalidade: criarPersonalidadeInicial(),
      timeline: [
        {
          id: 'l1',
          idade: 22,
          ano: 2048,
          categoria: 'carreira',
          texto: 'Primeiro emprego.',
          tipo: 'positivo'
        }
      ],
      eventoAtivo: null,
      historicoEventosDisparados: ['evt_a'],
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    };

    salvarJogo(gameState);
    const carregado = carregarJogo();

    expect(carregado).not.toBeNull();
    expect(carregado!.personagem?.idade).toBe(22);
    expect(carregado!.personagem?.nome).toBe('Ana');
    expect(carregado!.timeline).toHaveLength(1);
    expect(carregado!.historicoEventosDisparados).toContain('evt_a');
  });

  it('a timeline recarregada continua agrupável pela nova apresentação', () => {
    const estado = criarEstadoTeste({ idade: 30 });

    salvarJogo({
      versao: VERSAO_SAVE,
      personagem: estado.personagem,
      familia: estado.familia,
      educacao: estado.educacao,
      carreira: estado.carreira,
      economia: estado.economia,
      personalidade: criarPersonalidadeInicial(),
      timeline: [
        { id: 'a', idade: 29, ano: 2055, categoria: 'geral', texto: 'Um ano.', tipo: 'info' },
        { id: 'b', idade: 30, ano: 2056, categoria: 'geral', texto: 'Outro ano.', tipo: 'info' }
      ],
      eventoAtivo: null,
      historicoEventosDisparados: [],
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    });

    const carregado = carregarJogo();
    const grupos = agruparTimeline(carregado!.timeline);

    expect(grupos).toHaveLength(2);
    expect(grupos[1].idade).toBe(30);
  });
});

/* ------------------------------------------------- B4-FIX: local de nascimento */

describe('B4-FIX · o local escolhido sobrevive à criação e ao save', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('a cidade escolhida persiste no estado salvo e recarregado', () => {
    // Simula exatamente o que o motor recebe da tela de criação.
    const estado = criarEstadoTeste({
      idade: 0,
      personagem: { cidade: 'Feira de Santana', estado: 'BA' }
    });

    salvarJogo({
      versao: VERSAO_SAVE,
      personagem: estado.personagem,
      familia: estado.familia,
      educacao: estado.educacao,
      carreira: estado.carreira,
      economia: estado.economia,
      personalidade: criarPersonalidadeInicial(),
      timeline: [],
      eventoAtivo: null,
      historicoEventosDisparados: [],
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    });

    const carregado = carregarJogo();

    expect(carregado!.personagem?.cidade).toBe('Feira de Santana');
    expect(carregado!.personagem?.estado).toBe('BA');
  });

  it('nenhuma cidade suportada perde o vínculo com seu estado', () => {
    // Guarda de integridade dos dados de localização.
    for (const c of CIDADES_BRASILEIRAS) {
      expect(encontrarCidade(c.cidade, c.estado)).toBeTruthy();
      expect(c.estado).toMatch(/^[A-Z]{2}$/);
      expect(c.custoVidaRelativo).toBeGreaterThan(0);
    }
  });
});
