// Fixtures isoladas para testes (nunca tocam na partida real do usuário)
import {
  CareerState,
  Character,
  EconomyState,
  EducationState,
  FamilyMember
} from '../../types';
import { criarAvatarPadrao } from '../avatarSystem';
import { criarCarreiraInicial } from '../careerSystem';
import { criarEducacaoInicial } from '../educationSystem';
import { criarEconomiaInicial } from '../economySystem';

export function criarPersonagemTeste(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char_teste',
    nome: 'Ana',
    sobrenome: 'Souza',
    genero: 'feminino',
    idade: 0,
    anoAtual: 2026,
    anoNascimento: 2026,
    cidade: 'Marília',
    estado: 'SP',
    classeSocial: 'classe_media',
    avatar: criarAvatarPadrao(),
    stats: {
      felicidade: 80,
      saude: 90,
      inteligencia: 60,
      aparencia: 70
    },
    hiddenStats: {
      disciplina: 60,
      sociabilidade: 60,
      empatia: 60,
      ambicao: 60,
      estresse: 10,
      reputacao: 50,
      condicionamentoFisico: 60
    },
    doencas: [],
    flags: {},
    marcos: [],
    ...overrides
  };
}

export function criarFamiliaTeste(): FamilyMember[] {
  return [
    {
      id: 'fam_pai_1',
      nome: 'João',
      sobrenome: 'Souza',
      genero: 'masculino',
      tipo: 'pai',
      idade: 32,
      relacionamento: 85,
      vivo: true,
      profissao: 'Motorista',
      renda: 30000
    },
    {
      id: 'fam_mae_1',
      nome: 'Maria',
      sobrenome: 'Souza',
      genero: 'feminino',
      tipo: 'mae',
      idade: 30,
      relacionamento: 90,
      vivo: true,
      profissao: 'Professora',
      renda: 42000
    }
  ];
}

/** Um pet vivo, para exercitar a fronteira de entidade (B4-FIX.1). */
export function criarPetTeste(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'pet_1',
    nome: 'Bolinha',
    sobrenome: '',
    genero: 'masculino',
    tipo: 'pet',
    idade: 3,
    relacionamento: 70,
    vivo: true,
    ...overrides
  };
}

export interface EstadoTeste {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
  economia: EconomyState;
  familia: FamilyMember[];
  acoesRealizadasAno: string[];
}

export function criarEstadoTeste(overrides: {
  idade?: number;
  personagem?: Partial<Character>;
  educacao?: Partial<EducationState>;
  carreira?: Partial<CareerState>;
  economia?: Partial<EconomyState>;
  acoesRealizadasAno?: string[];
} = {}): EstadoTeste {
  return {
    personagem: criarPersonagemTeste({ idade: overrides.idade ?? 0, ...overrides.personagem }),
    educacao: { ...criarEducacaoInicial(), ...overrides.educacao },
    carreira: { ...criarCarreiraInicial(), ...overrides.carreira },
    economia: { ...criarEconomiaInicial('classe_media'), ...overrides.economia },
    familia: criarFamiliaTeste(),
    acoesRealizadasAno: overrides.acoesRealizadasAno ?? []
  };
}
