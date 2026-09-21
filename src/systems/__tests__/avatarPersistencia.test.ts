/**
 * B4-FIX2 item 17 — persistência da aparência do avatar.
 *
 * Cobre a exigência explícita do PR: "save antigo precisa fallback
 * válido". Um save salvo ANTES deste PR não tem `personagem.aparencia`
 * nenhum — precisa carregar sem lançar e resultar numa aparência válida
 * (não `undefined`, não um objeto pela metade).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VERSAO_SAVE, carregarJogo, salvarJogo } from '../saveSystem';
import { criarEstadoTeste } from './fixtures';
import { criarPersonalidadeInicial } from '../personalitySystem';
import { APARENCIA_PADRAO } from '../../data/avatar/avatarData';

function criarLocalStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear()
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

describe('B4-FIX2 · persistência da aparência do avatar', () => {
  it('uma aparência escolhida na criação é preservada intacta no ciclo salvar/carregar', () => {
    const estado = criarEstadoTeste({ idade: 20 });
    const aparenciaEscolhida = {
      tomPele: 'escura' as const,
      estiloCabelo: 'coque' as const,
      corCabelo: 'loiro' as const,
      corOlhos: 'mel' as const
    };
    const personagemComAparencia = { ...estado.personagem, aparencia: aparenciaEscolhida };

    salvarJogo({
      versao: VERSAO_SAVE,
      personagem: personagemComAparencia,
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
    } as any);

    const recarregado = carregarJogo();
    expect(recarregado!.personagem!.aparencia).toEqual(aparenciaEscolhida);
  });

  it('save legado sem o campo `aparencia` carrega com um fallback válido, não undefined', () => {
    const saveLegadoSemAvatar = {
      versao: 3,
      personagem: {
        id: 'char_legado',
        nome: 'Marta',
        sobrenome: 'Reis',
        genero: 'feminino',
        idade: 40,
        anoAtual: 2020,
        anoNascimento: 1980,
        cidade: 'Recife',
        estado: 'PE',
        classeSocial: 'classe_media',
        stats: { felicidade: 70, saude: 80, inteligencia: 60, aparencia: 55 },
        hiddenStats: {
          disciplina: 50,
          sociabilidade: 50,
          empatia: 50,
          ambicao: 50,
          estresse: 10,
          reputacao: 50,
          condicionamentoFisico: 50
        },
        doencas: [],
        flags: {},
        marcos: []
        // sem `aparencia` — exatamente o formato de save de antes do B4-FIX2
      },
      familia: [],
      educacao: { nivelAtual: 'nenhuma', emCurso: false, desempenho: 70, cursosConcluidos: [] },
      carreira: { empregado: false, aposentado: false },
      economia: { dinheiro: 1000, propriedades: [], investimentos: [] },
      personalidade: criarPersonalidadeInicial(),
      timeline: [],
      historicoEventosDisparados: [],
      eventoAtivoId: null,
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    };

    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(saveLegadoSemAvatar));

    const carregado = carregarJogo();
    expect(carregado).not.toBeNull();
    expect(carregado!.personagem!.aparencia).toBeTruthy();
    expect(carregado!.personagem!.aparencia).toEqual(APARENCIA_PADRAO);
  });

  it('save com `aparencia` corrompida (tipos errados) cai no padrão em vez de quebrar', () => {
    const saveComAparenciaCorrompida = {
      versao: 3,
      personagem: {
        id: 'char_corrompido',
        nome: 'Ivo',
        sobrenome: 'Nunes',
        genero: 'masculino',
        idade: 30,
        anoAtual: 2020,
        anoNascimento: 1990,
        cidade: 'Curitiba',
        estado: 'PR',
        classeSocial: 'trabalhadora',
        stats: { felicidade: 70, saude: 80, inteligencia: 60, aparencia: 55 },
        hiddenStats: {
          disciplina: 50,
          sociabilidade: 50,
          empatia: 50,
          ambicao: 50,
          estresse: 10,
          reputacao: 50,
          condicionamentoFisico: 50
        },
        doencas: [],
        flags: {},
        marcos: [],
        aparencia: { tomPele: 999, estiloCabelo: null, corCabelo: 'roxo-fluor' }
      },
      familia: [],
      educacao: { nivelAtual: 'nenhuma', emCurso: false, desempenho: 70, cursosConcluidos: [] },
      carreira: { empregado: false, aposentado: false },
      economia: { dinheiro: 1000, propriedades: [], investimentos: [] },
      personalidade: criarPersonalidadeInicial(),
      timeline: [],
      historicoEventosDisparados: [],
      eventoAtivoId: null,
      acoesRealizadasAno: [],
      emJogo: true,
      morto: false
    };

    stub.setItem('VIDA_GAME_SAVE_V1', JSON.stringify(saveComAparenciaCorrompida));

    const carregado = carregarJogo();
    expect(carregado).not.toBeNull();
    expect(carregado!.personagem!.aparencia).toEqual(APARENCIA_PADRAO);
  });
});
