/**
 * Fase 2 — O ANO COMO UNIDADE DE TEMPO. Testes obrigatórios A–J.
 *
 * O teste que sustenta a fase inteira é o D: matricular-se em Medicina NÃO
 * pode satisfazer o requisito de médico. Ele é a fronteira entre esta fase e a
 * Fase 1 — o único ponto em que o trabalho novo poderia corroer o antigo.
 */

import { describe, expect, it } from 'vitest';
import { criarEstadoTeste } from './fixtures';
import { CURSOS_DISPONIVEIS } from '../../data/coursesData';
import { TODAS_PROFISSOES } from '../../data/careersData';
import { criarEducacaoInicial, ingressarCurso, processarAnoEducacao } from '../educationSystem';
import { candidatarEmprego, criarCarreiraInicial } from '../careerSystem';
import { terFilho } from '../relationshipSystem';
import { avaliarElegibilidadeProfissional } from '../plausibility/elegibilidadeProfissional';
import {
  anosEntre,
  descreverDuracaoEmSemestres,
  instanteDe,
  mesmoAno,
  semestresEntre,
  SEMESTRES_POR_ANO
} from '../tempo/instante';
import {
  criarMatricula,
  duracaoTemMeioAno,
  instanteDeConclusao,
  matriculaConcluida,
  semestreEmCurso,
  semestresCursados
} from '../tempo/matricula';
import {
  avaliarDisponibilidadeTemporal,
  CHAVE_CONCEPCAO,
  chaveProcessoSeletivo,
  criarRegistroTemporal,
  registrarUso,
  usosDe
} from '../tempo/registroTemporal';
import type { Character, EducationState, FamilyMember, Job } from '../../types';

function vaga(id: string): Job {
  const j = TODAS_PROFISSOES.find(p => p.id === id);
  if (!j) throw new Error(`vaga inexistente: ${id}`);
  return j;
}

function curso(id: string) {
  const c = CURSOS_DISPONIVEIS.find(x => x.id === id);
  if (!c) throw new Error(`curso inexistente: ${id}`);
  return c;
}

/** Personagem apto a entrar em qualquer curso (inteligência alta, médio completo). */
function alunoApto(idade = 18) {
  const estado = criarEstadoTeste({ idade });
  const personagem: Character = {
    ...estado.personagem,
    stats: { ...estado.personagem.stats, inteligencia: 99 },
    hiddenStats: { ...estado.personagem.hiddenStats, disciplina: 99 }
  };
  const educacao: EducationState = {
    ...criarEducacaoInicial(),
    nivelAtual: 'medio_completo'
  };
  return { personagem, educacao, economia: estado.economia };
}

/**
 * Simula a vida ano a ano enquanto o curso não termina, e devolve em quantos
 * anos ele foi concluído. Usa o motor real (`processarAnoEducacao`).
 */
function anosAteFormar(cursoId: string, nivelInicial: EducationState['nivelAtual'] = 'medio_completo'): number {
  const c = curso(cursoId);
  const base = alunoApto(18);
  let personagem = { ...base.personagem };
  let educacao: EducationState = { ...base.educacao, nivelAtual: nivelInicial };

  // Toda pós exige superior completo; as de área regulamentada exigem também a
  // graduação daquela área (regra da Fase 1).
  if (c.tipo === 'pos') {
    educacao = { ...educacao, nivelAtual: 'superior_completo' };
  }
  if (c.tipo === 'pos' && c.preRequisitoAreas) {
    const graduacao = CURSOS_DISPONIVEIS.find(
      g => g.tipo === 'superior' && c.preRequisitoAreas!.includes(g.areaFormacao)
    )!;
    educacao = {
      ...educacao,
      cursosConcluidos: [{ nome: graduacao.nome, tipo: 'superior', anoConclusao: 2040 }]
    };
  }

  const r = ingressarCurso(c, 'publica', personagem, educacao, 2044);
  expect(r.sucesso, `não conseguiu ingressar em ${c.nome}: ${r.mensagem}`).toBe(true);
  educacao = { ...educacao, ...r.educacaoAtualizada };

  for (let ano = 1; ano <= 20; ano++) {
    personagem = { ...personagem, idade: personagem.idade + 1, anoAtual: personagem.anoAtual + 1 };
    const passo = processarAnoEducacao(educacao, personagem, personagem.anoAtual);
    educacao = passo.educacaoAtualizada;
    if (!educacao.emCurso) return ano;
  }
  throw new Error(`${c.nome} não formou em 20 anos`);
}

// ---------------------------------------------------------------------------

describe('Representação canônica de tempo', () => {
  it('ordena e subtrai instantes corretamente', () => {
    const a = instanteDe(20, 'primeiro');
    const b = instanteDe(20, 'segundo');
    const c = instanteDe(21, 'primeiro');
    expect(a < b && b < c).toBe(true);
    expect(semestresEntre(a, c)).toBe(2);
    expect(anosEntre(a, b)).toBe(0.5);
  });

  it('distingue dois momentos do mesmo ano — base para ordenar a Linha da Vida', () => {
    const manha = instanteDe(30, 'primeiro');
    const tarde = instanteDe(30, 'segundo');
    expect(mesmoAno(manha, tarde)).toBe(true);
    expect(manha === tarde).toBe(false);
    expect(manha < tarde).toBe(true);
  });

  it('descreve duração em linguagem humana, sem arredondar meio ano', () => {
    expect(descreverDuracaoEmSemestres(3)).toBe('1 ano e 6 meses');
    expect(descreverDuracaoEmSemestres(8)).toBe('4 anos');
    expect(descreverDuracaoEmSemestres(1)).toBe('6 meses');
    expect(descreverDuracaoEmSemestres(2)).toBe('1 ano');
  });
});

describe('CASO A — curso não conclui antes da duração', () => {
  it('matrícula não é diploma: no instante zero nada está concluído', () => {
    const m = criarMatricula(instanteDe(18), 8);
    expect(semestresCursados(m, instanteDe(18))).toBe(0);
    expect(matriculaConcluida(m, instanteDe(18))).toBe(false);
  });

  it('não conclui em nenhum instante anterior ao previsto', () => {
    const m = criarMatricula(instanteDe(18), 8);
    for (let s = 0; s < 8; s++) {
      expect(matriculaConcluida(m, instanteDe(18) + s), `concluiu com ${s} semestres`).toBe(false);
    }
    expect(matriculaConcluida(m, instanteDe(18) + 8)).toBe(true);
  });

  it('o semestre exibido nunca ultrapassa a duração do curso', () => {
    const m = criarMatricula(instanteDe(18), 3);
    expect(semestreEmCurso(m, instanteDe(18))).toBe(1);
    expect(semestreEmCurso(m, instanteDe(18) + 2)).toBe(3);
    expect(semestreEmCurso(m, instanteDe(18) + 9)).toBe(3);
  });
});

describe('CASO B — todos os 17 cursos respeitam a duração declarada', () => {
  it('nenhum curso forma antes nem depois do previsto', () => {
    const divergentes: string[] = [];

    for (const c of CURSOS_DISPONIVEIS) {
      // O motor avança 2 semestres por ano; a conclusão de um curso ímpar cai
      // no meio do ano e só é observável na virada seguinte.
      const esperado = Math.ceil(c.duracaoSemestres / SEMESTRES_POR_ANO);
      const medido = anosAteFormar(c.id);
      if (medido !== esperado) {
        divergentes.push(`${c.nome}: ${c.duracaoSemestres} sem → esperado ${esperado}a, medido ${medido}a`);
      }
    }

    expect(divergentes).toEqual([]);
  });

  it('os 17 cursos do catálogo foram de fato exercitados', () => {
    expect(CURSOS_DISPONIVEIS.length).toBe(17);
  });
});

describe('CASO C — duração ímpar (meio ano) é representável', () => {
  const imparesNoCatalogo = CURSOS_DISPONIVEIS.filter(c => c.duracaoSemestres % 2 !== 0);

  it('o catálogo tem cursos de duração ímpar (o caso que quebrava antes)', () => {
    expect(imparesNoCatalogo.length).toBeGreaterThan(0);
  });

  it('1,5 ano não é arredondado para 1 nem para 2 no modelo temporal', () => {
    const m = criarMatricula(instanteDe(18), 3);
    expect(duracaoTemMeioAno(m)).toBe(true);
    expect(anosEntre(m.inicio, instanteDeConclusao(m))).toBe(1.5);
    // O erro histórico: formar com 1 ano (2 semestres) cumpridos.
    expect(matriculaConcluida(m, instanteDe(19))).toBe(false);
  });

  it('nenhum curso de 3 semestres forma em 1 ano (regressão de C-03)', () => {
    for (const c of imparesNoCatalogo) {
      expect(anosAteFormar(c.id), `${c.nome} formou rápido demais`).toBeGreaterThan(1);
    }
  });
});

describe('CASO D — matrícula não é formação concluída (PROTEÇÃO DA FASE 1)', () => {
  /** Estudante de um curso, com o nível intermediário já atribuído. */
  function estudanteDe(cursoId: string, anosCursados: number) {
    const c = curso(cursoId);
    const base = alunoApto(18);
    let personagem = { ...base.personagem };
    let educacao: EducationState = { ...base.educacao };

    const r = ingressarCurso(c, 'publica', personagem, educacao, 2044);
    expect(r.sucesso).toBe(true);
    educacao = { ...educacao, ...r.educacaoAtualizada };

    for (let i = 0; i < anosCursados; i++) {
      personagem = { ...personagem, idade: personagem.idade + 1, anoAtual: personagem.anoAtual + 1 };
      const passo = processarAnoEducacao(educacao, personagem, personagem.anoAtual);
      educacao = passo.educacaoAtualizada;
    }
    return { personagem, educacao, carreira: criarCarreiraInicial() };
  }

  it('o nível intermediário É atribuído (E-04 corrigido)', () => {
    const ctx = estudanteDe('sup_medicina', 2);
    expect(ctx.educacao.emCurso).toBe(true);
    expect(ctx.educacao.nivelAtual).toBe('superior_incompleto');
  });

  it('estudante de Medicina NÃO vira médico', () => {
    const ctx = estudanteDe('sup_medicina', 4);
    const v = avaliarElegibilidadeProfissional(vaga('medico_geral'), ctx);
    expect(v.grau).not.toBe('permitido');
    expect(v.grau).not.toBe('improvavel');

    const r = candidatarEmprego(vaga('medico_geral'), ctx.personagem, ctx.educacao, 2050, ctx.carreira);
    expect(r.sucesso).toBe(false);
  });

  it('estudante de Direito não é tratado como advogado', () => {
    const ctx = estudanteDe('sup_direito', 4);
    const v = avaliarElegibilidadeProfissional(vaga('advogado_jr'), ctx);
    expect(['permitido', 'improvavel']).not.toContain(v.grau);
  });

  it('estudante de Engenharia não é tratado como engenheiro', () => {
    const ctx = estudanteDe('sup_eng_civil', 4);
    const v = avaliarElegibilidadeProfissional(vaga('eng_civil_jr'), ctx);
    expect(['permitido', 'improvavel']).not.toContain(v.grau);
  });

  it('nenhuma vaga que exija formação concluída aceita quem só está cursando', () => {
    const reguladas = ['medico_geral', 'medico_especialista', 'advogado_jr', 'advogado_senior',
                       'eng_civil_jr', 'eng_civil_pleno', 'gerente_obras', 'enfermeiro_chefe',
                       'psicologo_clinico', 'professor_fundamental', 'professor_medio'];
    for (const cursoId of ['sup_medicina', 'sup_direito', 'sup_eng_civil', 'sup_enfermagem', 'sup_psicologia', 'sup_pedagogia']) {
      const ctx = estudanteDe(cursoId, 3);
      for (const jobId of reguladas) {
        const v = avaliarElegibilidadeProfissional(vaga(jobId), ctx);
        expect(
          v.grau === 'permitido' || v.grau === 'improvavel',
          `cursando ${cursoId} destravou ${jobId}`
        ).toBe(false);
      }
    }
  });

  it('mas o nível intermediário DESTRAVA o que ele deve destravar: o estágio', () => {
    const ctx = estudanteDe('sup_eng_software', 2);
    const v = avaliarElegibilidadeProfissional(vaga('estagiario'), ctx);
    expect(['permitido', 'improvavel']).toContain(v.grau);
  });
});

describe('CASO E — vestibular não pode ser rerrolado no mesmo período', () => {
  it('a nota da segunda tentativa do ano é a MESMA da primeira', () => {
    const base = alunoApto(18);
    const medicina = curso('sup_medicina');

    const r1 = ingressarCurso(medicina, 'publica', base.personagem, base.educacao, 2044);
    const nota1 = r1.educacaoAtualizada?.vestibular?.nota;
    expect(nota1).toBeGreaterThan(0);

    const educacaoComProva = { ...base.educacao, ...r1.educacaoAtualizada, emCurso: false };
    for (let i = 0; i < 30; i++) {
      const r = ingressarCurso(medicina, 'publica', base.personagem, educacaoComProva, 2044);
      expect(r.educacaoAtualizada?.vestibular?.nota).toBe(nota1);
    }
  });

  it('insistir no mesmo ano não aprova quem foi reprovado (fim do re-roll)', () => {
    // Inteligência baixa contra a nota de corte mais alta do catálogo.
    const estado = criarEstadoTeste({ idade: 20 });
    const personagem: Character = {
      ...estado.personagem,
      stats: { ...estado.personagem.stats, inteligencia: 40 },
      hiddenStats: { ...estado.personagem.hiddenStats, disciplina: 40 }
    };
    let educacao: EducationState = { ...criarEducacaoInicial(), nivelAtual: 'medio_completo' };
    const medicina = curso('sup_medicina');

    for (let i = 0; i < 200; i++) {
      const r = ingressarCurso(medicina, 'publica', personagem, educacao, 2046);
      expect(r.sucesso, `aprovado na tentativa ${i + 1} do mesmo ano`).toBe(false);
      educacao = { ...educacao, ...r.educacaoAtualizada };
    }
  });

  it('a nota é gravada mesmo na reprovação — é isso que fecha o re-roll', () => {
    const estado = criarEstadoTeste({ idade: 20 });
    const personagem: Character = {
      ...estado.personagem,
      stats: { ...estado.personagem.stats, inteligencia: 40 }
    };
    const educacao: EducationState = { ...criarEducacaoInicial(), nivelAtual: 'medio_completo' };
    const r = ingressarCurso(curso('sup_medicina'), 'publica', personagem, educacao, 2046);
    expect(r.sucesso).toBe(false);
    expect(r.educacaoAtualizada?.vestibular?.nota).toBeGreaterThan(0);
  });
});

describe('CASO F — save/reload não recupera tentativa', () => {
  it('a nota do vestibular sobrevive a uma ida e volta pelo save', () => {
    const base = alunoApto(18);
    const r = ingressarCurso(curso('sup_medicina'), 'publica', base.personagem, base.educacao, 2044);
    const educacao = { ...base.educacao, ...r.educacaoAtualizada };

    // Serialização equivalente à do save.
    const revivida: EducationState = JSON.parse(JSON.stringify(educacao));
    expect(revivida.vestibular?.nota).toBe(educacao.vestibular?.nota);
    expect(revivida.vestibular?.anoDeVida).toBe(18);
  });

  it('o registro temporal sobrevive a uma ida e volta pelo save', () => {
    let reg = criarRegistroTemporal();
    reg = registrarUso(reg, chaveProcessoSeletivo('medico_geral'), instanteDe(30));
    const revivido = JSON.parse(JSON.stringify(reg));
    expect(usosDe(revivido, chaveProcessoSeletivo('medico_geral'))).toEqual([instanteDe(30)]);
  });
});

describe('CASO G — novo período válido libera nova tentativa', () => {
  it('a prova do ano seguinte é uma prova nova', () => {
    const base = alunoApto(18);
    const r1 = ingressarCurso(curso('sup_medicina'), 'publica', base.personagem, base.educacao, 2044);
    const educacao = { ...base.educacao, ...r1.educacaoAtualizada, emCurso: false };

    const maisVelho = { ...base.personagem, idade: 19, anoAtual: 2045 };
    const r2 = ingressarCurso(curso('sup_medicina'), 'publica', maisVelho, educacao, 2045);
    expect(r2.educacaoAtualizada?.vestibular?.anoDeVida).toBe(19);
  });

  it('o processo seletivo volta a ficar disponível no ano seguinte', () => {
    let reg = criarRegistroTemporal();
    const chave = chaveProcessoSeletivo('atendente');
    reg = registrarUso(reg, chave, instanteDe(25));

    expect(avaliarDisponibilidadeTemporal(reg, chave, { tipo: 'uma_vez_por_ano' }, 25, 'x').disponivel).toBe(false);
    expect(avaliarDisponibilidadeTemporal(reg, chave, { tipo: 'uma_vez_por_ano' }, 26, 'x').disponivel).toBe(true);
  });
});

describe('CASO H — a mesma oportunidade não é rerrolável, mas o mercado segue aberto', () => {
  function candidato() {
    const estado = criarEstadoTeste({ idade: 25, educacao: { nivelAtual: 'medio_completo' } });
    return {
      personagem: { ...estado.personagem, stats: { ...estado.personagem.stats, inteligencia: 90 } },
      educacao: estado.educacao,
      carreira: criarCarreiraInicial()
    };
  }

  it('insistir 50× na MESMA vaga gasta uma única tentativa', () => {
    const ctx = candidato();
    let reg = criarRegistroTemporal();
    let tentativasAceitas = 0;

    for (let i = 0; i < 50; i++) {
      const r = candidatarEmprego(vaga('atendente'), ctx.personagem, ctx.educacao, 2051, ctx.carreira, reg);
      if (r.registroTemporalAtualizado) {
        reg = r.registroTemporalAtualizado;
        tentativasAceitas++;
      }
    }
    expect(tentativasAceitas).toBe(1);
  });

  it('candidatar-se a vagas DIFERENTES no mesmo ano continua permitido', () => {
    const ctx = candidato();
    let reg = criarRegistroTemporal();
    const distintas = ['atendente', 'garcom', 'aux_eletrica'];
    let aceitas = 0;

    for (const id of distintas) {
      const r = candidatarEmprego(vaga(id), ctx.personagem, ctx.educacao, 2051, ctx.carreira, reg);
      if (r.registroTemporalAtualizado) {
        reg = r.registroTemporalAtualizado;
        aceitas++;
      }
    }
    // O mercado não pode ficar imóvel: procurar em várias empresas é normal.
    expect(aceitas).toBe(distintas.length);
  });

  it('o limite é temporal, não de elegibilidade — o veredito continua permitindo', () => {
    const ctx = candidato();
    let reg = criarRegistroTemporal();
    const r1 = candidatarEmprego(vaga('atendente'), ctx.personagem, ctx.educacao, 2051, ctx.carreira, reg);
    reg = r1.registroTemporalAtualizado!;

    const r2 = candidatarEmprego(vaga('atendente'), ctx.personagem, ctx.educacao, 2051, ctx.carreira, reg);
    expect(r2.sucesso).toBe(false);
    // Elegibilidade intacta: não lhe falta requisito, falta tempo.
    expect(r2.veredito?.grau).toBe('permitido');
  });
});

describe('CASO I — proteção de filhos sem impedir múltiplos legítimos', () => {
  function casal() {
    const estado = criarEstadoTeste({ idade: 30 });
    const parceiro: FamilyMember = {
      id: 'p1',
      nome: 'Marcos',
      sobrenome: 'Lima',
      genero: 'masculino',
      tipo: 'esposo',
      idade: 31,
      relacionamento: 90,
      vivo: true,
      situacaoAtual: 'Casado'
    };
    return { personagem: estado.personagem, parceiro };
  }

  it('repetir a decisão em laço produz UM filho, não três', () => {
    const { personagem, parceiro } = casal();
    let reg = criarRegistroTemporal();
    let nascidos = 0;

    for (let i = 0; i < 10; i++) {
      const r = terFilho(parceiro, personagem, undefined, undefined, 2056, reg);
      if (r.sucesso) {
        nascidos++;
        reg = r.registroTemporalAtualizado!;
      }
    }
    expect(nascidos).toBe(1);
  });

  it('o ano seguinte libera uma nova decisão', () => {
    const { personagem, parceiro } = casal();
    let reg = criarRegistroTemporal();
    const r1 = terFilho(parceiro, personagem, undefined, undefined, 2056, reg);
    reg = r1.registroTemporalAtualizado!;

    const maisVelho = { ...personagem, idade: 31, anoAtual: 2057 };
    const r2 = terFilho(parceiro, maisVelho, undefined, undefined, 2057, reg);
    expect(r2.sucesso).toBe(true);
  });

  it('a regra limita a CONCEPÇÃO, deixando espaço para gêmeos no futuro', () => {
    // Uma concepção registrada; uma futura gestação múltipla continuará
    // cabendo aqui, porque o que se consome é a decisão, não o nascimento.
    let reg = criarRegistroTemporal();
    reg = registrarUso(reg, CHAVE_CONCEPCAO, instanteDe(30));
    expect(usosDe(reg, CHAVE_CONCEPCAO).length).toBe(1);

    const disponibilidade = avaliarDisponibilidadeTemporal(
      reg, CHAVE_CONCEPCAO, { tipo: 'uma_vez_por_ano' }, 30, 'x'
    );
    expect(disponibilidade.usosNoPeriodo).toBe(1);
    // A chave é 'concepcao' e não 'nascimento' — nomeia a decisão, não o
    // desfecho, que é o que permite 1 concepção → N filhos depois.
    expect(CHAVE_CONCEPCAO).toBe('concepcao');
  });
});

describe('CASO J — métricas da Fase 1 permanecem em zero', () => {
  it('experiência continua sendo exigida (nada na Fase 2 afrouxou)', () => {
    const estado = criarEstadoTeste({ idade: 18, educacao: { nivelAtual: 'medio_completo' } });
    const ctx = { personagem: estado.personagem, educacao: estado.educacao, carreira: criarCarreiraInicial() };
    const v = avaliarElegibilidadeProfissional(vaga('mestre_obras'), ctx);
    expect(v.grau).toBe('impossivel');
  });

  it('licença profissional continua sendo exigida', () => {
    const estado = criarEstadoTeste({
      idade: 25,
      educacao: {
        nivelAtual: 'superior_completo',
        cursosConcluidos: [{ nome: 'Pedagogia / Licenciatura', tipo: 'superior', anoConclusao: 2048 }]
      }
    });
    const ctx = { personagem: estado.personagem, educacao: estado.educacao, carreira: criarCarreiraInicial() };
    expect(avaliarElegibilidadeProfissional(vaga('medico_geral'), ctx).grau).toBe('irregular');
  });

  it('o registro temporal não é consultado quando a pessoa é inelegível', () => {
    // Quem não pode tentar não gasta tentativa: os eixos são independentes.
    const estado = criarEstadoTeste({ idade: 18, educacao: { nivelAtual: 'medio_completo' } });
    const r = candidatarEmprego(
      vaga('medico_geral'), estado.personagem, estado.educacao, 2044,
      criarCarreiraInicial(), criarRegistroTemporal()
    );
    expect(r.sucesso).toBe(false);
    expect(r.registroTemporalAtualizado).toBeUndefined();
  });
});

describe('Compatibilidade com saves anteriores à Fase 2', () => {
  it('estado sem matriculaInicio é reconstruído sem perder progresso', () => {
    const base = alunoApto(18);
    // Save antigo: tem semestreAtual (contador legado), não tem matriculaInicio.
    let educacao: EducationState = {
      ...base.educacao,
      nivelAtual: 'medio_completo',
      emCurso: true,
      tipoCurso: 'superior',
      nomeCurso: 'Pedagogia / Licenciatura',
      instituicao: 'Universidade Federal Pública',
      isPublica: true,
      semestreAtual: 7,
      totalSemestres: 8,
      anoIngresso: 2041
    };
    let personagem = { ...base.personagem, idade: 21, anoAtual: 2047 };

    // Progresso legado de 6 semestres cursados: falta 1 ano para os 8.
    for (let i = 0; i < 2; i++) {
      personagem = { ...personagem, idade: personagem.idade + 1, anoAtual: personagem.anoAtual + 1 };
      const passo = processarAnoEducacao(educacao, personagem, personagem.anoAtual);
      educacao = passo.educacaoAtualizada;
    }

    expect(educacao.emCurso).toBe(false);
    expect(educacao.nivelAtual).toBe('superior_completo');
  });

  it('estado sem o campo de vestibular funciona como "ainda não prestou"', () => {
    const base = alunoApto(18);
    expect(base.educacao.vestibular).toBeUndefined();
    const r = ingressarCurso(curso('sup_pedagogia'), 'publica', base.personagem, base.educacao, 2044);
    expect(r.educacaoAtualizada?.vestibular?.anoDeVida).toBe(18);
  });

  it('candidatura sem registro temporal informado não quebra', () => {
    const estado = criarEstadoTeste({ idade: 25, educacao: { nivelAtual: 'medio_completo' } });
    expect(() =>
      candidatarEmprego(vaga('atendente'), estado.personagem, estado.educacao, 2051)
    ).not.toThrow();
  });

  it('ninguém perde escolaridade já conquistada ao entrar em curso novo', () => {
    const estado = criarEstadoTeste({
      idade: 30,
      educacao: {
        nivelAtual: 'superior_completo',
        cursosConcluidos: [{ nome: 'Administração de Empresas', tipo: 'superior', anoConclusao: 2050 }]
      }
    });
    const personagem = { ...estado.personagem, stats: { ...estado.personagem.stats, inteligencia: 95 } };
    const r = ingressarCurso(curso('pos_mba_executivo'), 'publica', personagem, estado.educacao, 2056);
    expect(r.sucesso).toBe(true);
    // A pós não rebaixa para 'superior_incompleto'.
    let educacao = { ...estado.educacao, ...r.educacaoAtualizada };
    const passo = processarAnoEducacao(educacao, { ...personagem, idade: 31 }, 2057);
    expect(passo.educacaoAtualizada.nivelAtual).toBe('superior_completo');
  });
});
