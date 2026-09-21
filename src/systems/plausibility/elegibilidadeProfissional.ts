/**
 * ELEGIBILIDADE PROFISSIONAL — a regra única para "esta pessoa pode ocupar
 * este cargo?".
 *
 * PURO: não sorteia, não altera estado, não decide contratação. Devolve um
 * `Veredito` descrevendo a relação entre um personagem e uma vaga.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * A SEPARAÇÃO QUE ESTE MÓDULO PROTEGE
 *
 *   elegibilidade  → PODE TENTAR
 *   processo seletivo → COMO SE SAIU  (systems/career/processoSeletivo)
 *   resultado      → conseguiu ou não
 *
 * Elegível NÃO é contratado. Isso não é purismo: é o que permite acrescentar
 * entrevista, prova de concurso e Exame da OAB depois sem reescrever nada
 * aqui. Um bom desempenho num processo seletivo futuro jamais poderá driblar
 * este módulo, porque só quem passa por ele chega lá.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Todas as regras saem de dados que já existiam e nunca eram lidos
 * (`Job.experienciaNecessaria`) ou de dados declarativos novos
 * (`data/formacao/requisitosProfissionais.ts`). Não há nenhuma condição
 * escrita para um caso específico da auditoria.
 */

import type { CareerState, Character, EducationState, Job } from '../../types';
import { getEducationLabel } from '../../utils/formatters';
import {
  IDADE_MINIMA_TRABALHO_JUVENIL,
  nivelEscolaridade,
  obterJanelaIdadeEmprego
} from '../politicaTrabalho';
import {
  ROTULO_LICENCA,
  ROTULO_NIVEL_CURSO,
  rotularAreas
} from '../../data/formacao/areasFormacao';
import { obterRequisitoProfissional } from '../../data/formacao/requisitosProfissionais';
import {
  listarFormacoesConcluidas,
  possuiFormacaoEm,
  possuiLicenca
} from './formacaoConcluida';
import {
  combinarVereditos,
  vereditoDe,
  type RequisitoNaoAtendido,
  type Veredito
} from './types';

/**
 * Piso etário usado para medir quanta experiência alguém PODERIA ter
 * acumulado até hoje.
 *
 * Reaproveita `IDADE_MINIMA_TRABALHO_JUVENIL` (16) em vez de declarar um
 * número próprio: é a idade a partir da qual o jogo efetivamente permite
 * trabalhar, então é a partir dela que o tempo de carreira pode correr. A
 * Constituição admite 14 na condição de aprendiz, mas o jogo não modela
 * aprendizagem antes dos 16 — usar 14 aqui contaria um tempo que nenhum
 * personagem tem como ter vivido.
 */
export const IDADE_LEGAL_MINIMA_TRABALHO = IDADE_MINIMA_TRABALHO_JUVENIL;

/**
 * Folga de inteligência tolerada para uma vaga.
 *
 * A auditoria apontou que `listarVagasCompativeis` tolerava +15 silenciosamente,
 * anulando um requisito declarado. A folga em si é defensável — ninguém é
 * contratado por um número — mas precisa ser explícita e ter consequência.
 * Aqui ela deixa de ser invisível: dentro da folga, a vaga fica `improvavel`,
 * com penalidade na chance do processo seletivo, em vez de simplesmente passar.
 */
export const FOLGA_APTIDAO = 15;

/** Penalidade de chance para cada eixo em que o personagem está no limite. */
const PENALIDADE_APTIDAO_NO_LIMITE = 0.6;
const PENALIDADE_EXPERIENCIA_NO_LIMITE = 0.75;

export interface ContextoElegibilidade {
  personagem: Character;
  educacao: EducationState;
  carreira: CareerState;
}

/**
 * Anos de experiência profissional acumulados.
 *
 * Soma o histórico de empregos com o tempo no cargo atual. Usa os dados que o
 * motor já mantinha (`historicoEmpregos`, `anosNoCargo`) — nenhum campo novo,
 * portanto nenhum save precisa migrar.
 *
 * Períodos sem `anoFim` (vínculo em aberto no histórico) contam como 0 em vez
 * de gerar `NaN`: prudência contra saves antigos malformados.
 */
export function calcularAnosDeExperiencia(carreira: CareerState): number {
  let total = 0;
  for (const periodo of carreira.historicoEmpregos ?? []) {
    const inicio = Number.isFinite(periodo.anoInicio) ? periodo.anoInicio : 0;
    const fim = Number.isFinite(periodo.anoFim as number) ? (periodo.anoFim as number) : inicio;
    const duracao = fim - inicio;
    if (duracao > 0) total += duracao;
  }
  if (carreira.empregado && Number.isFinite(carreira.anosNoCargo)) {
    total += Math.max(0, carreira.anosNoCargo);
  }
  return total;
}

/**
 * Experiência máxima que alguém desta idade poderia ter acumulado.
 *
 * É esta função que separa `impossivel` de `requisito`. Um jovem de 18 anos
 * que precise de 8 anos de experiência não está a um esforço de distância:
 * ele precisaria ter começado a trabalhar aos 10. Isso é aritmética do tempo
 * de vida, não falta de empenho — e o jogo deve dizer isso com outra voz.
 */
export function experienciaMaximaPossivelNaIdade(idade: number): number {
  return Math.max(0, idade - IDADE_LEGAL_MINIMA_TRABALHO);
}

// ---------------------------------------------------------------------------
// Avaliação
// ---------------------------------------------------------------------------

function avaliarIdade(job: Job, idade: number): Veredito {
  const janela = obterJanelaIdadeEmprego(job.id);
  const faltantes: RequisitoNaoAtendido[] = [];

  if (idade < janela.minima) {
    faltantes.push({
      codigo: 'idade_minima',
      grau: 'requisito',
      descricao: `Esta vaga abre aos ${janela.minima} anos.`,
      atual: idade,
      exigido: janela.minima
    });
  }
  if (janela.maxima !== null && idade > janela.maxima) {
    faltantes.push({
      codigo: 'idade_maxima',
      grau: 'impossivel',
      descricao: `Esta vaga é para jovens de ${janela.minima} a ${janela.maxima} anos.`,
      atual: idade,
      exigido: janela.maxima
    });
  }
  return vereditoDe(faltantes);
}

function avaliarEscolaridade(job: Job, educacao: EducationState): Veredito {
  const atual = nivelEscolaridade(educacao.nivelAtual);
  const exigido = nivelEscolaridade(job.escolaridadeMinima);
  if (atual >= exigido) return vereditoDe([]);

  return vereditoDe([
    {
      codigo: 'escolaridade',
      grau: 'requisito',
      descricao: `Esta vaga exige ${getEducationLabel(job.escolaridadeMinima)}. Sua escolaridade atual: ${getEducationLabel(educacao.nivelAtual)}.`,
      atual: getEducationLabel(educacao.nivelAtual),
      exigido: getEducationLabel(job.escolaridadeMinima)
    }
  ]);
}

/**
 * Formação específica e licença profissional.
 *
 * A distinção de grau entre os dois é deliberada e é o coração desta fase:
 *
 *   falta o CURSO       → `requisito`  (conquistável: vá estudar)
 *   falta a LICENÇA     → `irregular`  (exercer assim é ilegal)
 *
 * Na prática, hoje, quem não tem o curso também não tem a licença — então o
 * grau `irregular` prevalece nas profissões regulamentadas. Isso é correto: o
 * jogo deve dizer "você não pode exercer Medicina", não "falta um requisito".
 */
function avaliarFormacao(job: Job, educacao: EducationState): Veredito {
  const requisito = obterRequisitoProfissional(job.id);
  if (!requisito) return vereditoDe([]);

  const faltantes: RequisitoNaoAtendido[] = [];
  const nivelMinimo = requisito.nivelFormacaoMinimo ?? 'tecnico';

  if (requisito.areasHabilitantes && requisito.areasHabilitantes.length > 0) {
    if (!possuiFormacaoEm(educacao, requisito.areasHabilitantes, nivelMinimo)) {
      const areas = rotularAreas(requisito.areasHabilitantes);
      const temAreaMasNivelBaixo = listarFormacoesConcluidas(educacao).some(f =>
        requisito.areasHabilitantes!.includes(f.area)
      );

      faltantes.push(
        temAreaMasNivelBaixo
          ? {
              codigo: 'formacao_nivel',
              grau: 'requisito',
              descricao: `Esta vaga exige ${ROTULO_NIVEL_CURSO[nivelMinimo]} em ${areas}. Sua formação na área não alcança esse nível.`,
              exigido: ROTULO_NIVEL_CURSO[nivelMinimo]
            }
          : {
              codigo: 'formacao_area',
              grau: 'requisito',
              descricao: `Esta vaga exige formação em ${areas}.`,
              exigido: areas
            }
      );
    }
  }

  if (requisito.licenca && !possuiLicenca(educacao, requisito.licenca)) {
    faltantes.push({
      codigo: 'licenca_profissional',
      grau: 'irregular',
      descricao: `Profissão regulamentada: exige ${ROTULO_LICENCA[requisito.licenca]}.`,
      exigido: ROTULO_LICENCA[requisito.licenca]
    });
  }

  return vereditoDe(faltantes);
}

/**
 * Experiência — o dado que existia em 22 de 36 profissões e nunca era lido.
 *
 * Três desfechos:
 *   · impossível para a idade  → `impossivel`
 *   · abaixo do exigido        → `requisito`
 *   · no último ano da conta   → `improvavel` (passa, com chance reduzida)
 */
function avaliarExperiencia(
  job: Job,
  personagem: Character,
  carreira: CareerState
): Veredito {
  const exigida = job.experienciaNecessaria ?? 0;
  if (exigida <= 0) return vereditoDe([]);

  const maximoPossivel = experienciaMaximaPossivelNaIdade(personagem.idade);

  // A experiência é LIMITADA PELA IDADE, não apenas lida do histórico.
  //
  // Uma varredura adversarial encontrou o furo: um estado com 8 anos de
  // histórico aos 18 anos era aceito sem questionamento, porque o motor
  // confiava no número gravado. Saves são editáveis e o histórico pode vir
  // corrompido de versões antigas; o tempo de vida, não. Ancorar na idade
  // torna a regra inviolável por adulteração de save, sem precisar rejeitar
  // o save nem apagar o histórico do jogador.
  const possui = Math.min(calcularAnosDeExperiencia(carreira), maximoPossivel);
  if (possui >= exigida) return vereditoDe([]);
  if (exigida > maximoPossivel) {
    return vereditoDe([
      {
        codigo: 'experiencia_impossivel_para_a_idade',
        grau: 'impossivel',
        descricao: `Esta vaga pede ${exigida} anos de experiência — mais tempo do que alguém de ${personagem.idade} anos teria como ter trabalhado.`,
        atual: possui,
        exigido: exigida
      }
    ]);
  }

  // Faltando exatamente um ano: o mercado às vezes abre exceção.
  if (exigida - possui <= 1) {
    return vereditoDe(
      [
        {
          codigo: 'experiencia',
          grau: 'improvavel',
          descricao: `Esta vaga pede ${exigida} anos de experiência e você tem ${possui}. É uma candidatura arriscada.`,
          atual: possui,
          exigido: exigida
        }
      ],
      PENALIDADE_EXPERIENCIA_NO_LIMITE
    );
  }

  return vereditoDe([
    {
      codigo: 'experiencia',
      grau: 'requisito',
      descricao: `Esta vaga exige ${exigida} anos de experiência. Você tem ${possui}.`,
      atual: possui,
      exigido: exigida
    }
  ]);
}

/**
 * Aptidão (`inteligenciaMinima`).
 *
 * Nunca bloqueia: um número de atributo não é um requisito do mundo real.
 * Dentro da folga, vira `improvavel` com penalidade — o que torna a antiga
 * tolerância silenciosa de +15 visível e consequente.
 */
function avaliarAptidao(job: Job, personagem: Character): Veredito {
  const possui = personagem.stats.inteligencia;
  const exigida = job.inteligenciaMinima ?? 0;
  if (possui >= exigida) return vereditoDe([]);

  if (possui + FOLGA_APTIDAO >= exigida) {
    return vereditoDe(
      [
        {
          codigo: 'aptidao',
          grau: 'improvavel',
          descricao: 'O perfil da vaga é mais exigente do que o seu no momento. Dá para tentar, mas a concorrência pesa.',
          atual: possui,
          exigido: exigida
        }
      ],
      PENALIDADE_APTIDAO_NO_LIMITE
    );
  }

  return vereditoDe([
    {
      codigo: 'aptidao',
      grau: 'requisito',
      descricao: 'Esta vaga exige um preparo bem acima do seu perfil atual.',
      atual: possui,
      exigido: exigida
    }
  ]);
}

/**
 * Veredito completo de uma vaga para um personagem.
 *
 * Esta é a ÚNICA função que responde a pergunta. `availabilitySystem`
 * (interface) e `careerSystem` (motor) consultam esta mesma função — é o que
 * garante a defesa em profundidade sem duplicar regra.
 */
export function avaliarElegibilidadeProfissional(
  job: Job,
  ctx: ContextoElegibilidade
): Veredito {
  return combinarVereditos([
    avaliarIdade(job, ctx.personagem.idade),
    avaliarEscolaridade(job, ctx.educacao),
    avaliarFormacao(job, ctx.educacao),
    avaliarExperiencia(job, ctx.personagem, ctx.carreira),
    avaliarAptidao(job, ctx.personagem)
  ]);
}

/** O personagem pode se candidatar (não significa que será contratado). */
export function podeSeCandidatar(job: Job, ctx: ContextoElegibilidade): boolean {
  const veredito = avaliarElegibilidadeProfissional(job, ctx);
  return veredito.grau === 'permitido' || veredito.grau === 'improvavel';
}

/**
 * Elegibilidade para PERMANECER/ASSUMIR um cargo por via interna (promoção).
 *
 * A promoção automática ignorava escolaridade e formação, produzindo escadas
 * medidas pela auditoria como "Gerente de Loja → COO" e "Médico Clínico →
 * Cirurgião" sem residência.
 *
 * A experiência NÃO é reavaliada aqui, e isso é intencional: quem é promovido
 * está justamente adquirindo experiência no cargo, e exigir o tempo do cargo
 * de destino tornaria toda promoção impossível. O que uma promoção não pode
 * driblar é formação, licença e escolaridade — requisitos que não se adquirem
 * trabalhando.
 */
export function podeSerPromovidoPara(job: Job, ctx: ContextoElegibilidade): boolean {
  const veredito = combinarVereditos([
    avaliarEscolaridade(job, ctx.educacao),
    avaliarFormacao(job, ctx.educacao)
  ]);
  return veredito.grau === 'permitido' || veredito.grau === 'improvavel';
}
