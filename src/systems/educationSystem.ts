import { Character, EducationLevel, EducationState, LifeLogEntry, PosturaEscolar } from '../types';
import { CourseOption } from '../data/coursesData';
import { formatarDinheiro, getEducationLabel } from '../utils/formatters';
import { IDADE_MINIMA_FACULDADE, nivelEscolaridade } from './availabilitySystem';
import { clamp, generateId, randomInt } from '../utils/random';
import { narrarPosturaEscolar } from './events/narrativeVariants';
import { possuiFormacaoEm } from './plausibility/formacaoConcluida';
import { rotularAreas } from '../data/formacao/areasFormacao';
import { instanteDe } from './tempo/instante';
import {
  criarMatricula,
  matriculaConcluida,
  semestreEmCurso,
  type Matricula
} from './tempo/matricula';

/**
 * Obtém a matrícula de um estado de educação, reconstruindo-a quando o save é
 * anterior à Fase 2.
 *
 * COMPATIBILIDADE DE SAVE — a parte delicada desta fase.
 *
 * Um save antigo tem `semestreAtual` (contador defeituoso) mas não tem
 * `matriculaInicio`. Reconstruímos o início retroagindo o progresso já
 * registrado, e o fazemos de forma CONSERVADORA: usamos `semestreAtual - 1`
 * porque naquele modelo o contador começava em 1 sem que nenhum semestre
 * tivesse sido cursado.
 *
 * O efeito para o jogador é que ele nunca perde progresso e nunca ganha
 * progresso que não viveu. Na pior hipótese, um aluno que estava a um passo da
 * formatura pelo contador antigo cursa meio ano a mais — o que é preferível a
 * receber um diploma que o novo modelo considera não cumprido.
 */
function reconstruirMatricula(edu: EducationState, idadeAtual: number): Matricula {
  const duracao = edu.totalSemestres ?? 8;

  if (typeof edu.matriculaInicio === 'number' && Number.isFinite(edu.matriculaInicio)) {
    return criarMatricula(edu.matriculaInicio, duracao);
  }

  // Save anterior à Fase 2: retroage a partir do progresso registrado.
  const progressoAntigo = Math.max(0, (edu.semestreAtual ?? 1) - 1);
  const inicioReconstruido = instanteDe(idadeAtual) - progressoAntigo;
  return criarMatricula(inicioReconstruido, duracao);
}

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
    // A conclusão é consequência do TEMPO CUMPRIDO desde a matrícula, não de
    // um contador que alguém incrementa. Ver `tempo/matricula.ts` para a
    // anatomia do off-by-one que isto substitui.
    //
    // `idade` aqui já é a idade NOVA (a passagem de ano acontece antes), então
    // ela é o instante "agora" do fim deste ano de vida.
    const matricula = reconstruirMatricula(edu, idade);
    const agora = instanteDe(idade);

    // Espelha o progresso no estado para exibição e compatibilidade de save.
    edu.semestreAtual = semestreEmCurso(matricula, agora);
    edu.totalSemestres = matricula.duracaoSemestres;
    edu.matriculaInicio = matricula.inicio;

    // NÍVEL INTERMEDIÁRIO — 'superior_incompleto'
    //
    // A auditoria (E-04/R10) mostrou que este nível nunca era atribuído, o que
    // tornava Estagiário Universitário e Dev Júnior inalcançáveis: duas vagas
    // que EXIGEM superior incompleto, num jogo onde ninguém jamais o tinha.
    //
    // ATENÇÃO — ESTE É O PONTO DE MAIOR RISCO DA FASE 2 PARA A FASE 1:
    // 'superior_incompleto' vale 6 na hierarquia e 'medio_completo' vale 4,
    // ou seja, matricular-se ELEVA a escolaridade. Isso é correto para vagas
    // que pedem "cursando o superior" e seria catastrófico se destravasse
    // vagas que exigem formação CONCLUÍDA.
    //
    // O que garante que não destrava: a elegibilidade profissional confere
    // formação por `cursosConcluidos` (via `plausibility/formacaoConcluida`),
    // e uma matrícula em curso NÃO entra nessa lista — ela só é escrita na
    // formatura. Um estudante de Medicina sobe para 'superior_incompleto' e
    // continua sem CRM, sem área de formação em medicina e sem o nível
    // 'superior_completo' que a vaga de médico exige. Coberto por teste
    // explícito.
    if (edu.tipoCurso === 'superior' && nivelEscolaridade(edu.nivelAtual) < nivelEscolaridade('superior_incompleto')) {
      edu.nivelAtual = 'superior_incompleto';
    }

    if (!edu.isPublica && edu.mensalidade) {
      mensalidadeAnual = edu.mensalidade * 12;
    }

    char.stats.inteligencia = clamp(char.stats.inteligencia + 2, 0, 100);

    // Formatura — só quando a duração declarada foi realmente cumprida.
    if (matriculaConcluida(matricula, agora)) {
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
      edu.matriculaInicio = undefined;
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

  // Pré-requisito de ÁREA, além do nível.
  //
  // "Tem superior completo" não basta para uma pós de área regulamentada: a
  // auditoria reproduziu uma pedagoga matriculada em Residência Médica. Só
  // cursos que declaram `preRequisitoAreas` restringem — o MBA, por exemplo,
  // segue aberto a formados de qualquer área, como no Brasil real.
  if (curso.preRequisitoAreas && curso.preRequisitoAreas.length > 0) {
    if (!possuiFormacaoEm(educacao, curso.preRequisitoAreas, 'superior')) {
      return {
        sucesso: false,
        mensagem: `${curso.nome} é destinado a quem já tem graduação em ${rotularAreas(curso.preRequisitoAreas)}.`
      };
    }
  }

  // ---------------------------------------------------------------------
  // A PROVA DO ANO
  //
  // Antes, esta nota era sorteada a cada chamada e jogada fora: o ENEM era um
  // botão de re-roll, e o jogador clicava até passar (23 aprovações medidas na
  // segunda tentativa do mesmo ano).
  //
  // A correção ataca a CAUSA, não o botão: a prova passa a ser um FATO do ano
  // de vida do personagem. Prestou, tirou 640 — 640 é a sua nota deste ano.
  // Tentar de novo não re-sorteia nada, porque não há nada a sortear.
  //
  // Isso preserva um comportamento legítimo que um bloqueio destruiria: não
  // passar na federal e se matricular numa particular com a MESMA nota é o
  // caminho real de milhões de estudantes, e a própria mensagem de recusa já
  // sugeria isso. O que deixa de existir é a repetição que fabricava nota
  // nova.
  //
  // A nota vive em `EducationState`, que é persistido — logo, recarregar o
  // save não devolve a tentativa.
  // ---------------------------------------------------------------------
  const anoDeVida = personagem.idade;
  const provaJaPrestada =
    educacao.vestibular !== undefined && educacao.vestibular.anoDeVida === anoDeVida;

  const notaEnem = provaJaPrestada
    ? educacao.vestibular!.nota
    : clamp(
        Math.round(
          personagem.stats.inteligencia * 7.5 +
          personagem.hiddenStats.disciplina * 2.0 +
          (personagem.flags['focou_enem'] ? 60 : 0) +
          randomInt(-20, 20)
        ),
        350,
        990
      );

  /** Carimbo da prova deste ano, presente em toda resposta desta função. */
  const registroDaProva = { anoDeVida, nota: notaEnem };

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
          // Progresso ZERO: o aluno acabou de se matricular e ainda não
          // cursou semestre nenhum. O modelo antigo gravava 1 aqui, e esse
          // meio ano fantasma era metade do off-by-one.
          semestreAtual: 1,
          totalSemestres: curso.duracaoSemestres,
          matriculaInicio: instanteDe(personagem.idade),
          desempenho: 80,
          mensalidade: 0,
          anoIngresso: anoAtual,
          posturaAno: null,
          vestibular: registroDaProva
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
      // A nota é gravada MESMO na reprovação — é justamente isso que fecha o
      // re-roll: a próxima tentativa deste ano encontrará esta mesma nota.
      return {
        sucesso: false,
        mensagem: `Sua nota no ENEM (${notaEnem}) ficou abaixo da nota de corte (${curso.notaCorteEnem}) para a universidade pública. Você pode tentar em uma faculdade privada ou estudar mais.`,
        educacaoAtualizada: { vestibular: registroDaProva }
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
          matriculaInicio: instanteDe(personagem.idade),
          desempenho: 75,
          mensalidade: curso.mensalidadePrivada,
          anoIngresso: anoAtual,
          posturaAno: null,
          vestibular: registroDaProva
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
        mensagem: 'Você não atingiu o conhecimento mínimo necessário para a admissão neste curso.',
        educacaoAtualizada: { vestibular: registroDaProva }
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
