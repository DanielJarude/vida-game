import { Character, FamilyMember, Gender, LifeLogEntry, RelationType } from '../types';
import { sortearNome, sortearSobrenome } from '../data/brazilianData';
import {
  IDADE_MINIMA_CASAMENTO,
  IDADE_MINIMA_FILHOS,
  IDADE_MINIMA_RELACIONAMENTO_ADULTO
} from './availabilitySystem';
import { clamp, generateId, randomChoice, randomInt, valorAleatorio } from '../utils/random';
import { instanteDe } from './tempo/instante';
import {
  avaliarDisponibilidadeTemporal,
  CHAVE_CONCEPCAO,
  criarRegistroTemporal,
  registrarUso,
  type RegistroTemporal
} from './tempo/registroTemporal';

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
    else if (generoPreferencia === 'todos') genero = valorAleatorio() > 0.5 ? 'masculino' : 'feminino';

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
  sucesso: boolean;
  mensagem: string;
  novoMembro?: FamilyMember;
  personagemAtualizado?: Character;
  novoLog?: LifeLogEntry;
} {
  // Revalidação da política central: sistema adulto de relacionamentos
  if (personagem.idade < IDADE_MINIMA_RELACIONAMENTO_ADULTO) {
    return {
      sucesso: false,
      mensagem: 'O sistema de encontros é para adultos. Relações na adolescência ainda não são modeladas neste jogo.'
    };
  }

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

  return { sucesso: true, mensagem: `Você e ${candidato.nome} começaram a namorar.`, novoMembro, personagemAtualizado: char, novoLog: log };
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
  if (personagem.idade < IDADE_MINIMA_CASAMENTO) {
    return {
      sucesso: false,
      mensagem: 'Você precisa ser maior de idade para se casar.'
    };
  }
  if (parceiro.idade < IDADE_MINIMA_CASAMENTO) {
    return {
      sucesso: false,
      mensagem: `${parceiro.nome} ainda não tem idade para casar.`
    };
  }
  if (parceiro.relacionamento >= 65) {
    const novoTipo: RelationType = parceiro.genero === 'masculino' ? 'esposo' : 'esposa';
    const parceiroAtualizado: FamilyMember = {
      ...parceiro,
      tipo: novoTipo,
      // progresso relativo: o casamento fortalece o vínculo, não o teleporta
      relacionamento: clamp(parceiro.relacionamento + 15, 0, 100),
      situacaoAtual: 'Casado(a) feliz com você'
    };

    const char: Character = {
      ...personagem,
      stats: {
        ...personagem.stats,
        felicidade: clamp(personagem.stats.felicidade + 30, 0, 100)
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

/**
 * A decisão de ter um filho.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * FASE 2 — UMA CONCEPÇÃO POR ANO, NÃO "UM FILHO POR ANO"
 *
 * O harness mediu 1.259 ocorrências de múltiplos nascimentos no mesmo ano, em
 * 99 de 105 vidas — até três filhos no mesmo ano, repetidamente. A causa é que
 * nada limitava quantas vezes esta função podia ser chamada.
 *
 * A proteção é deliberadamente uma CONCEPÇÃO por ano, e não um NASCIMENTO por
 * ano. A diferença não é semântica:
 *
 *   · gêmeos são UMA concepção que produz DOIS filhos — continuarão cabendo
 *     nesta regra sem que ela precise mudar;
 *   · o que se limita é a DECISÃO ser repetida em laço, que é o que o motor
 *     permitia e o harness mediu.
 *
 * Escrever "um ser humano só pode ter um filho por ano" seria uma regra
 * ontológica falsa, e ela bloquearia a gestação múltipla legítima quando a
 * fase de relacionamentos chegar.
 *
 * NÃO é gestação: não há nove meses, descoberta, risco nem nascimento
 * agendado. Isso é a fase de relacionamentos. Aqui existe apenas o teto
 * temporal, que é a mesma regra de consumo das demais ações desta fase.
 * ────────────────────────────────────────────────────────────────────────────
 */
export function terFilho(
  parceiro: FamilyMember | null,
  personagem: Character,
  nomePersonalizado?: string,
  generoPersonalizado?: Gender,
  anoAtual?: number,
  registroTemporal: RegistroTemporal = criarRegistroTemporal()
): {
  sucesso: boolean;
  mensagem: string;
  novoFilho?: FamilyMember;
  personagemAtualizado?: Character;
  novoLog?: LifeLogEntry;
  /**
   * Registro com a concepção consumida. O chamador DEVE persistir este valor.
   * Ausente quando nenhuma concepção ocorreu.
   */
  registroTemporalAtualizado?: RegistroTemporal;
} {
  // Revalidação da política central: decisões familiares adultas
  if (personagem.idade < IDADE_MINIMA_FILHOS) {
    return {
      sucesso: false,
      mensagem: 'Ter filhos é uma decisão da vida adulta.'
    };
  }

  // Revalidação no motor: a decisão de ter filhos pressupõe um relacionamento
  // estável — chamar terFilho sem parceiro (via UI ou direto) não tem efeito.
  const TIPOS_PARCEIRO: RelationType[] = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'];
  if (!parceiro || !parceiro.vivo || !TIPOS_PARCEIRO.includes(parceiro.tipo)) {
    return {
      sucesso: false,
      mensagem: 'Você precisa de um relacionamento estável para ter filhos.'
    };
  }

  const disponibilidade = avaliarDisponibilidadeTemporal(
    registroTemporal,
    CHAVE_CONCEPCAO,
    { tipo: 'uma_vez_por_ano' },
    personagem.idade,
    'A chegada de um filho'
  );
  if (!disponibilidade.disponivel) {
    return {
      sucesso: false,
      mensagem:
        'Vocês já receberam um filho neste ano. Dê tempo à família antes de pensar no próximo.'
    };
  }

  const registroTemporalAtualizado = registrarUso(
    registroTemporal,
    CHAVE_CONCEPCAO,
    instanteDe(personagem.idade)
  );

  const genero: Gender = generoPersonalizado || (valorAleatorio() > 0.5 ? 'masculino' : 'feminino');
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

  return { sucesso: true, mensagem: `${novoFilho.nome} nasceu com saúde.`, novoFilho, personagemAtualizado: char, novoLog: log, registroTemporalAtualizado };
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
