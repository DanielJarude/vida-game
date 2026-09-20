import { Character, EducationLevel, EducationState, LifeLogEntry, PosturaEscolar } from '../types';
import { CourseOption } from '../data/coursesData';
import { formatarDinheiro, getEducationLabel } from '../utils/formatters';
import { IDADE_MINIMA_FACULDADE, nivelEscolaridade } from './availabilitySystem';
import { clamp, generateId, randomInt } from '../utils/random';
import { narrarPosturaEscolar } from './events/narrativeVariants';

export function criarEducacaoInicial(): EducationState {
  return {
    nivelAtual: 'nenhuma',
    emCurso: false,
    desempenho: 70,
    posturaAno: null,
    cursosConcluidos: []
  };
}

export function processarAnoEducacao(
  educacao: EducationState,
  personagem: Character,
  anoAtual: number
): {
  educacaoAtualizada: EducationState;
  personagemAtualizado: Character;
  logsEducacao: LifeLogEntry[];
  mensalidadeAnual: number;
} {
  const edu = { ...educacao };
  const char = { ...personagem };
  const logs: LifeLogEntry[] = [];
  let mensalidadeAnual = 0;
  const idade = char.idade;

  // Entrada automática no Ensino Fundamental aos 6 anos
  if (idade === 6 && edu.nivelAtual === 'nenhuma' && !edu.emCurso) {
    edu.emCurso = true;
    edu.tipoCurso = 'fundamental';
    edu.nomeCurso = 'Ensino Fundamental';
    edu.instituicao = 'Escola Municipal de Ensino Básico';
    edu.isPublica = true;
    edu.desempenho = clamp(50 + char.stats.inteligencia * 0.4, 40, 100);
    logs.push({
      id: generateId('log'),
      idade,
      ano: anoAtual,
      categoria: 'escola',
      texto: 'Você ingressou no 1º ano do Ensino Fundamental.',
      tipo: 'importante'
    });
  }

  // Se está estudando no Ensino Fundamental / Médio
  if (edu.emCurso && (edu.tipoCurso === 'fundamental' || edu.tipoCurso === 'medio')) {
    const notaBase = (char.stats.inteligencia * 0.5) + (char.hiddenStats.disciplina * 0.5);
    const variacao = randomInt(-5, 5);
    // A postura escolhida para o ano influi diretamente nas notas
    const ajustePostura = edu.posturaAno === 'estudar' ? 12 : edu.posturaAno === 'matar_aula' ? -14 : 0;
    edu.desempenho = clamp(Math.round(notaBase + variacao + ajustePostura), 10, 100);

    // Conclusão do Fundamental aos 14 anos
    if (idade === 14 && edu.tipoCurso === 'fundamental') {
      edu.nivelAtual = 'fundamental_completo';
      edu.tipoCurso = 'medio';
      edu.nomeCurso = 'Ensino Médio';
      edu.instituicao = 'Colégio Estadual';
      edu.cursosConcluidos.push({
        nome: 'Ensino Fundamental',
        tipo: 'Educação Básica',
        anoConclusao: anoAtual
      });
      logs.push({
        id: generateId('log'),
        idade,
        ano: anoAtual,
        categoria: 'escola',
        texto: 'Você concluiu o Ensino Fundamental e ingressou no Ensino Médio.',
        tipo: 'positivo'
      });
    }

    // Conclusão do Ensino Médio aos 17 anos
    if (idade === 17 && edu.tipoCurso === 'medio') {
      edu.nivelAtual = 'medio_completo';
      edu.emCurso = false;
      edu.tipoCurso = undefined;
      edu.nomeCurso = undefined;
      edu.cursosConcluidos.push({
        nome: 'Ensino Médio',
        tipo: 'Educação Básica',
        anoConclusao: anoAtual
      });
      logs.push({
        id: generateId('log'),
        idade,
        ano: anoAtual,
        categoria: 'escola',
        texto: 'Você se formou no Ensino Médio e recebeu seu diploma.',
        tipo: 'importante'
      });
    }
  }

  // Se está na Faculdade / Curso Técnico
  if (edu.emCurso && (edu.tipoCurso === 'superior' || edu.tipoCurso === 'tecnico' || edu.tipoCurso === 'pos')) {
    edu.semestreAtual = (edu.semestreAtual || 0) + 2;

    if (!edu.isPublica && edu.mensalidade) {
      mensalidadeAnual = edu.mensalidade * 12;
    }

    char.stats.inteligencia = clamp(char.stats.inteligencia + 2, 0, 100);

    // Formatura
    if (edu.semestreAtual >= (edu.totalSemestres || 8)) {
      const nomeConcluido = edu.nomeCurso || 'Graduação';
      if (edu.tipoCurso === 'superior') {
        edu.nivelAtual = 'superior_completo';
      } else if (edu.tipoCurso === 'tecnico') {
        if (edu.nivelAtual !== 'superior_completo') edu.nivelAtual = 'tecnico';
      } else if (edu.tipoCurso === 'pos') {
        edu.nivelAtual = 'pos_graduacao';
      }

      edu.cursosConcluidos.push({
        nome: nomeConcluido,
        tipo: edu.tipoCurso,
        anoConclusao: anoAtual
      });

      edu.emCurso = false;
      edu.tipoCurso = undefined;
      edu.nomeCurso = undefined;
      edu.semestreAtual = undefined;
      edu.totalSemestres = undefined;
      edu.mensalidade = undefined;

      char.stats.felicidade = clamp(char.stats.felicidade + 25, 0, 100);
      char.hiddenStats.reputacao = clamp(char.hiddenStats.reputacao + 20, 0, 100);

      logs.push({
        id: generateId('log'),
        idade,
        ano: anoAtual,
        categoria: 'escola',
        texto: `FORMATURA! Você colou grau e formou-se em ${nomeConcluido} na ${edu.instituicao || 'Universidade'}!`,
        tipo: 'importante'
      });
    }
  }

  // Resolução da postura escolar do ano (efeitos aplicados uma única vez)
  if (edu.emCurso && edu.posturaAno) {
    switch (edu.posturaAno) {
      case 'estudar':
        char.stats.inteligencia = clamp(char.stats.inteligencia + 3, 0, 100);
        char.hiddenStats.disciplina = clamp(char.hiddenStats.disciplina + 4, 0, 100);
        logs.push({
          id: generateId('log'),
          idade,
          ano: anoAtual,
          categoria: 'escola',
          texto: narrarPosturaEscolar('estudar'),
          tipo: 'positivo'
        });
        break;
      case 'matar_aula':
        char.stats.felicidade = clamp(char.stats.felicidade + 8, 0, 100);
        char.hiddenStats.disciplina = clamp(char.hiddenStats.disciplina - 8, 0, 100);
        char.hiddenStats.sociabilidade = clamp(char.hiddenStats.sociabilidade + 5, 0, 100);
        logs.push({
          id: generateId('log'),
          idade,
          ano: anoAtual,
          categoria: 'escola',
          texto: narrarPosturaEscolar('matar_aula'),
          tipo: 'negativo'
        });
        break;
      case 'socializar':
        char.stats.felicidade = clamp(char.stats.felicidade + 12, 0, 100);
        char.hiddenStats.sociabilidade = clamp(char.hiddenStats.sociabilidade + 10, 0, 100);
        char.hiddenStats.reputacao = clamp(char.hiddenStats.reputacao + 5, 0, 100);
        logs.push({
          id: generateId('log'),
          idade,
          ano: anoAtual,
          categoria: 'escola',
          texto: narrarPosturaEscolar('socializar'),
          tipo: 'positivo'
        });
        break;
    }
    edu.posturaAno = null;
  }

  return {
    educacaoAtualizada: edu,
    personagemAtualizado: char,
    logsEducacao: logs,
    mensalidadeAnual
  };
}

export function ingressarCurso(
  curso: CourseOption,
  tipoInstituicao: 'publica' | 'privada',
  personagem: Character,
  educacao: EducationState,
  anoAtual: number
): {
  sucesso: boolean;
  mensagem: string;
  educacaoAtualizada?: Partial<EducationState>;
  novoLog?: LifeLogEntry;
} {
  // Revalidação da política central no motor
  if (educacao.emCurso) {
    return { sucesso: false, mensagem: 'Você já está matriculado em um curso.' };
  }
  if (personagem.idade < IDADE_MINIMA_FACULDADE) {
    return { sucesso: false, mensagem: `O vestibular e a faculdade abrem aos ${IDADE_MINIMA_FACULDADE} anos.` };
  }
  const nivelNecessario: EducationLevel = curso.tipo === 'pos' ? 'superior_completo' : 'medio_completo';
  if (nivelEscolaridade(educacao.nivelAtual) < nivelEscolaridade(nivelNecessario)) {
    return {
      sucesso: false,
      mensagem: `Você precisa concluir ${getEducationLabel(nivelNecessario)} para este curso.`
    };
  }

  let notaEnem = Math.round(
    personagem.stats.inteligencia * 7.5 +
    personagem.hiddenStats.disciplina * 2.0 +
    (personagem.flags['focou_enem'] ? 60 : 0) +
    randomInt(-20, 20)
  );
  notaEnem = clamp(notaEnem, 350, 990);

  if (tipoInstituicao === 'publica') {
    if (notaEnem >= curso.notaCorteEnem) {
      const instNome = curso.tipo === 'tecnico' ? 'Instituto Federal (IF)' : 'Universidade Federal Pública';
      return {
        sucesso: true,
        mensagem: `Aprovado(a) na ${instNome}! Sua nota no ENEM foi ${notaEnem} (corte: ${curso.notaCorteEnem}). Matrícula 100% gratuita!`,
        educacaoAtualizada: {
          emCurso: true,
          tipoCurso: curso.tipo,
          nomeCurso: curso.nome,
          instituicao: instNome,
          isPublica: true,
          semestreAtual: 1,
          totalSemestres: curso.duracaoSemestres,
          desempenho: 80,
          mensalidade: 0,
          anoIngresso: anoAtual,
          posturaAno: null
        },
        novoLog: {
          id: generateId('log'),
          idade: personagem.idade,
          ano: anoAtual,
          categoria: 'escola',
          texto: `Você foi aprovado(a) no vestibular da ${instNome} em ${curso.nome}!`,
          tipo: 'importante'
        }
      };
    } else {
      return {
        sucesso: false,
        mensagem: `Sua nota no ENEM (${notaEnem}) ficou abaixo da nota de corte (${curso.notaCorteEnem}) para a universidade pública. Você pode tentar em uma faculdade privada ou estudar mais.`
      };
    }
  } else {
    if (personagem.stats.inteligencia >= curso.inteligenciaMinima) {
      return {
        sucesso: true,
        mensagem: `Matrícula realizada com sucesso na Universidade Particular em ${curso.nome}! Mensalidade: ${formatarDinheiro(curso.mensalidadePrivada)}/mês.`,
        educacaoAtualizada: {
          emCurso: true,
          tipoCurso: curso.tipo,
          nomeCurso: curso.nome,
          instituicao: 'Centro Universitário Privado',
          isPublica: false,
          semestreAtual: 1,
          totalSemestres: curso.duracaoSemestres,
          desempenho: 75,
          mensalidade: curso.mensalidadePrivada,
          anoIngresso: anoAtual,
          posturaAno: null
        },
        novoLog: {
          id: generateId('log'),
          idade: personagem.idade,
          ano: anoAtual,
          categoria: 'escola',
          texto: `Você iniciou sua graduação em ${curso.nome} na faculdade particular.`,
          tipo: 'positivo'
        }
      };
    } else {
      return {
        sucesso: false,
        mensagem: 'Você não atingiu o conhecimento mínimo necessário para a admissão neste curso.'
      };
    }
  }
}

/**
 * Define a postura escolar do ano corrente (compromisso anual).
 * Os efeitos são processados na passagem do ano; só é permitido escolher
 * uma vez por ano.
 */
export function definirPosturaEscolar(
  acao: PosturaEscolar,
  educacao: EducationState
): {
  sucesso: boolean;
  mensagem: string;
  educacaoAtualizada?: EducationState;
} {
  if (!educacao.emCurso) {
    return { sucesso: false, mensagem: 'Você não está matriculado em nenhum curso.' };
  }
  if (educacao.posturaAno) {
    return { sucesso: false, mensagem: 'Você já definiu sua postura para este ano.' };
  }

  const mensagens: Record<PosturaEscolar, string> = {
    estudar: 'Você vai dedicar este ano aos estudos. Os efeitos aparecem na virada do ano.',
    socializar: 'Você vai aproveitar este ano para conviver com os colegas. Os efeitos aparecem na virada do ano.',
    matar_aula: 'Você decidiu matar aula sempre que puder este ano. Os efeitos aparecem na virada do ano.'
  };

  return {
    sucesso: true,
    mensagem: mensagens[acao],
    educacaoAtualizada: { ...educacao, posturaAno: acao }
  };
}
