import { Character, FamilyMember, Gender, LifeLogEntry, RelationType } from '../types';
import { sortearNome, sortearSobrenome } from '../data/brazilianData';
import { clamp, generateId, randomChoice, randomInt } from '../utils/random';

export interface DatingCandidate {
  nome: string;
  sobrenome: string;
  genero: Gender;
  idade: number;
  profissao: string;
  aparencia: number;
  inteligencia: number;
  personalidade: string;
}

const PROFISSOES_PRETENDENTES = [
  'Arquiteta de Interiores',
  'Desenvolvedor Web',
  'Advogada Trabalhista',
  'Médico Pediatra',
  'Professor de Educação Física',
  'Chef de Cozinha',
  'Contadora',
  'Designer Gráfico',
  'Jornalista',
  'Engenheiro Mecânico',
  'Enfermeira',
  'Psicólogo Clínico',
  'Empresária do Varejo',
  'Fotógrafo'
];

export function gerarCandidatosNamoro(
  generoPreferencia: 'homens' | 'mulheres' | 'todos',
  idadeJogador: number
): DatingCandidate[] {
  const candidatos: DatingCandidate[] = [];

  for (let i = 0; i < 3; i++) {
    let genero: Gender = 'feminino';
    if (generoPreferencia === 'homens') genero = 'masculino';
    else if (generoPreferencia === 'todos') genero = Math.random() > 0.5 ? 'masculino' : 'feminino';

    const idade = Math.max(18, idadeJogador + randomInt(-4, 5));
    const cand: DatingCandidate = {
      nome: sortearNome(genero),
      sobrenome: sortearSobrenome(),
      genero,
      idade,
      profissao: randomChoice(PROFISSOES_PRETENDENTES),
      aparencia: randomInt(40, 95),
      inteligencia: randomInt(40, 95),
      personalidade: randomChoice([
        'Super carinhoso(a) e divertido(a)',
        'Intelectual e focado(a) na carreira',
        'Aventureiro(a) que adora viagens e praia',
        'Tranquilo(a), caseiro(a) e fã de gastronomia',
        'Cheio(a) de energia, carismático(a) e comunicativo(a)'
      ])
    };
    candidatos.push(cand);
  }

  return candidatos;
}

export function iniciarNamoro(
  candidato: DatingCandidate,
  personagem: Character,
  anoAtual: number
): {
  novoMembro: FamilyMember;
  personagemAtualizado: Character;
  novoLog: LifeLogEntry;
} {
  const tipo: RelationType = candidato.genero === 'masculino' ? 'namorado' : 'namorada';

  const novoMembro: FamilyMember = {
    id: generateId('parceiro'),
    nome: candidato.nome,
    sobrenome: candidato.sobrenome,
    genero: candidato.genero,
    tipo,
    idade: candidato.idade,
    relacionamento: 85,
    vivo: true,
    profissao: candidato.profissao,
    situacaoAtual: 'Namorando apaixonadamente com você'
  };

  const char: Character = {
    ...personagem,
    stats: {
      ...personagem.stats,
      felicidade: clamp(personagem.stats.felicidade + 25, 0, 100)
    }
  };

  const log: LifeLogEntry = {
    id: generateId('log'),
    idade: personagem.idade,
    ano: anoAtual,
    categoria: 'amor',
    texto: `Você começou a namorar com ${candidato.nome} ${candidato.sobrenome} (${candidato.profissao})!`,
    tipo: 'importante'
  };

  return { novoMembro, personagemAtualizado: char, novoLog: log };
}

export function pedirEmCasamento(
  parceiro: FamilyMember,
  personagem: Character,
  anoAtual: number
): {
  sucesso: boolean;
  mensagem: string;
  parceiroAtualizado?: FamilyMember;
  personagemAtualizado?: Character;
  novoLog?: LifeLogEntry;
} {
  if (parceiro.relacionamento >= 65) {
    const novoTipo: RelationType = parceiro.genero === 'masculino' ? 'esposo' : 'esposa';
    const parceiroAtualizado: FamilyMember = {
      ...parceiro,
      tipo: novoTipo,
      relacionamento: 100,
      situacaoAtual: 'Casado(a) feliz com você'
    };

    const char: Character = {
      ...personagem,
      stats: {
        ...personagem.stats,
        felicidade: 100
      },
      flags: {
        ...personagem.flags,
        casado_oficialmente: true
      }
    };

    const log: LifeLogEntry = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: anoAtual,
      categoria: 'amor',
      texto: `CASAMENTO! Você e ${parceiro.nome} se casaram em uma linda cerimônia com a bênção dos amigos e da família!`,
      tipo: 'importante'
    };

    return {
      sucesso: true,
      mensagem: `${parceiro.nome} disse SIM! Vocês estão oficialmente casados!`,
      parceiroAtualizado,
      personagemAtualizado: char,
      novoLog: log
    };
  } else {
    return {
      sucesso: false,
      mensagem: `${parceiro.nome} achou que ainda é cedo para esse passo ou o relacionamento precisa melhorar.`
    };
  }
}

export function terFilho(
  _parceiro: FamilyMember | null,
  personagem: Character,
  nomePersonalizado?: string,
  generoPersonalizado?: Gender,
  anoAtual?: number
): {
  novoFilho: FamilyMember;
  personagemAtualizado: Character;
  novoLog: LifeLogEntry;
} {
  const genero: Gender = generoPersonalizado || (Math.random() > 0.5 ? 'masculino' : 'feminino');
  const nome = nomePersonalizado || sortearNome(genero);
  const ano = anoAtual || personagem.anoAtual;

  const novoFilho: FamilyMember = {
    id: generateId('filho'),
    nome,
    sobrenome: personagem.sobrenome,
    genero,
    tipo: genero === 'masculino' ? 'filho' : 'filha',
    idade: 0,
    relacionamento: 100,
    vivo: true,
    situacaoAtual: 'Bebê no berço'
  };

  const char: Character = {
    ...personagem,
    stats: {
      ...personagem.stats,
      felicidade: clamp(personagem.stats.felicidade + 30, 0, 100)
    },
    hiddenStats: {
      ...personagem.hiddenStats,
      empatia: clamp(personagem.hiddenStats.empatia + 20, 0, 100)
    }
  };

  const log: LifeLogEntry = {
    id: generateId('log'),
    idade: personagem.idade,
    ano,
    categoria: 'familia',
    texto: `Nasceu seu(sua) ${novoFilho.tipo}, ${nome} ${personagem.sobrenome}! O amor da sua vida em forma de bebê!`,
    tipo: 'importante'
  };

  return { novoFilho, personagemAtualizado: char, novoLog: log };
}

export function terminarRelacionamento(
  parceiro: FamilyMember,
  personagem: Character,
  anoAtual: number
): {
  personagemAtualizado: Character;
  novoLog: LifeLogEntry;
} {
  const char: Character = {
    ...personagem,
    stats: {
      ...personagem.stats,
      felicidade: clamp(personagem.stats.felicidade - 20, 0, 100)
    }
  };

  const log: LifeLogEntry = {
    id: generateId('log'),
    idade: personagem.idade,
    ano: anoAtual,
    categoria: 'amor',
    texto: `Você e ${parceiro.nome} terminaram o relacionamento e decidiram seguir caminhos separados.`,
    tipo: 'negativo'
  };

  return { personagemAtualizado: char, novoLog: log };
}
