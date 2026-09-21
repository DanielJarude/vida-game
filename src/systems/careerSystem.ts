import { CareerState, Character, EducationState, EconomyState, EducationLevel, Job, LifeLogEntry } from '../types';
import { BICOS_DISPONIVEIS, FreelanceOption, TODAS_PROFISSOES } from '../data/careersData';
import { formatarDinheiro, getEducationLabel } from '../utils/formatters';
import { nivelEscolaridade, IDADE_MINIMA_BICOS } from './availabilitySystem';
import { clamp, generateId, randomInt, rollChance } from '../utils/random';
import {
  avaliarElegibilidadeProfissional,
  calcularAnosDeExperiencia,
  podeSerPromovidoPara
} from './plausibility/elegibilidadeProfissional';
import { podeTentar, type Veredito } from './plausibility/types';
import { resolverProcessoSeletivo } from './career/processoSeletivo';

export function criarCarreiraInicial(): CareerState {
  return {
    empregado: false,
    anosNoCargo: 0,
    desempenhoTrabalho: 60,
    horasExtras: false,
    bicoAtivoId: null,
    aposentado: false,
    historicoEmpregos: []
  };
}

/**
 * Candidatura a uma vaga.
 *
 * Duas etapas explicitamente separadas (ver `career/processoSeletivo`):
 *
 *   1. ELEGIBILIDADE — pode tentar? Regra única em
 *      `plausibility/elegibilidadeProfissional`, a mesma que a interface usa.
 *      É defesa em profundidade real: mesmo chamando esta função diretamente,
 *      sem passar por tela nenhuma, um estado inválido é recusado.
 *   2. PROCESSO SELETIVO — como se saiu? Hoje uma rolagem ponderada; amanhã,
 *      um Desafio de Vida. Nenhum chamador precisa saber a diferença.
 *
 * `carreira` passou a ser parâmetro porque a experiência acumulada é um
 * requisito real da vaga — e era justamente o dado que existia em 22 das 36
 * profissões e nunca era lido.
 */
export function candidatarEmprego(
  job: Job,
  personagem: Character,
  educacao: EducationState,
  anoAtual: number,
  carreira: CareerState = criarCarreiraInicial()
): {
  sucesso: boolean;
  mensagem: string;
  novoCargo?: Job;
  novoLog?: LifeLogEntry;
  /** Exposto para teste e depuração; a interface não precisa consumir. */
  veredito?: Veredito;
} {
  const ctx = { personagem, educacao, carreira };
  const veredito = avaliarElegibilidadeProfissional(job, ctx);

  if (!podeTentar(veredito)) {
    return {
      sucesso: false,
      mensagem: veredito.motivo ?? 'Você ainda não reúne os requisitos desta vaga.',
      veredito
    };
  }

  const resultado = resolverProcessoSeletivo({
    job,
    personagem,
    veredito,
    anosDeExperiencia: calcularAnosDeExperiencia(carreira)
  });

  if (resultado.aprovado) {
    return {
      sucesso: true,
      mensagem: `Parabéns! Você foi contratado(a) como ${job.titulo} com salário de ${formatarDinheiro(job.salarioMensal)}/mês!`,
      novoCargo: job,
      veredito,
      novoLog: {
        id: generateId('log'),
        idade: personagem.idade,
        ano: anoAtual,
        categoria: 'carreira',
        texto: `Você começou a trabalhar como ${job.titulo} (Salário: ${formatarDinheiro(job.salarioMensal)}/mês).`,
        tipo: 'importante'
      }
    };
  }

  return {
    sucesso: false,
    veredito,
    mensagem:
      veredito.grau === 'improvavel'
        ? 'A empresa achou seu perfil interessante, mas escolheu alguém mais experiente desta vez.'
        : 'Infelizmente a empresa optou por outro candidato no momento. Continue tentando!'
  };
}

/**
 * Compromisso anual de horas extras. O efeito (desempenho, estresse, ambição)
 * é processado na passagem do ano; clicar de novo no mesmo ano é recusado.
 */
export function trabalharMais(
  carreira: CareerState,
  personagem: Character
): {
  sucesso: boolean;
  mensagem: string;
  carreiraAtualizada?: CareerState;
  personagemAtualizado?: Character;
} {
  if (!carreira.empregado || !carreira.cargoAtual) {
    return { sucesso: false, mensagem: 'Você não possui um emprego no momento.' };
  }
  if (carreira.horasExtras) {
    return { sucesso: false, mensagem: 'Você já se comprometeu com horas extras neste ano.' };
  }

  const car: CareerState = { ...carreira, horasExtras: true };
  return {
    sucesso: true,
    mensagem: 'Você se comprometeu com horas extras para este ano. O resultado aparece na virada do ano.',
    carreiraAtualizada: car,
    personagemAtualizado: personagem
  };
}

/**
 * Compromisso anual de bico (renda extra). O pagamento é processado na
 * passagem do ano; apenas um bico por ano.
 */
export function escolherBico(
  bicoId: string,
  carreira: CareerState,
  personagem: Character,
  educacao: EducationState,
  economia: EconomyState
): {
  sucesso: boolean;
  mensagem: string;
  carreiraAtualizada?: CareerState;
} {
  if (personagem.idade < IDADE_MINIMA_BICOS) {
    return { sucesso: false, mensagem: 'Os bicos disponíveis exigem maioridade.' };
  }
  const bico = BICOS_DISPONIVEIS.find(b => b.id === bicoId);
  if (!bico) {
    return { sucesso: false, mensagem: 'Bico não encontrado.' };
  }
  if (carreira.bicoAtivoId) {
    return { sucesso: false, mensagem: 'Você já tem um bico escolhido para este ano.' };
  }
  if (bico.requisito && bico.requisito !== 'veiculo') {
    const nivelExigido = bico.requisito as EducationLevel;
    if (nivelEscolaridade(educacao.nivelAtual) < nivelEscolaridade(nivelExigido)) {
      return { sucesso: false, mensagem: `Este bico exige ${getEducationLabel(nivelExigido)}.` };
    }
  }
  if (bico.requisito === 'veiculo' && !economia.propriedades.some(p => p.tipo === 'veiculo')) {
    return { sucesso: false, mensagem: 'Você precisa possuir um veículo para este bico.' };
  }

  return {
    sucesso: true,
    mensagem: `Você vai trabalhar com "${bico.nome}" neste ano. O pagamento entra na virada do ano.`,
    carreiraAtualizada: { ...carreira, bicoAtivoId: bico.id }
  };
}

export function pedirAumento(
  carreira: CareerState,
  personagem: Character,
  anoAtual: number
): {
  carreiraAtualizada: CareerState;
  personagemAtualizado: Character;
  sucesso: boolean;
  mensagem: string;
  novoLog?: LifeLogEntry;
} {
  if (!carreira.cargoAtual) {
    return { carreiraAtualizada: carreira, personagemAtualizado: personagem, sucesso: false, mensagem: 'Você não possui um emprego no momento.' };
  }

  const cargo = carreira.cargoAtual;
  const car = { ...carreira };
  const char = { ...personagem };

  if (car.desempenhoTrabalho >= 75 || car.anosNoCargo >= 2) {
    const aumento = Math.round(cargo.salarioMensal * 0.18);
    const novoCargoAtual: Job = {
      ...cargo,
      salarioMensal: cargo.salarioMensal + aumento
    };
    car.cargoAtual = novoCargoAtual;
    char.stats.felicidade = clamp(char.stats.felicidade + 15, 0, 100);
    return {
      carreiraAtualizada: car,
      personagemAtualizado: char,
      sucesso: true,
      mensagem: `Aumento concedido! Seu salário aumentou para ${formatarDinheiro(novoCargoAtual.salarioMensal)}/mês.`,
      novoLog: {
        id: generateId('log'),
        idade: char.idade,
        ano: anoAtual,
        categoria: 'carreira',
        texto: `Seu pedido de aumento salarial foi aceito! Novo salário: ${formatarDinheiro(novoCargoAtual.salarioMensal)}/mês.`,
        tipo: 'positivo'
      }
    };
  } else {
    char.stats.felicidade = clamp(char.stats.felicidade - 5, 0, 100);
    return {
      carreiraAtualizada: car,
      personagemAtualizado: char,
      sucesso: false,
      mensagem: 'A diretoria informou que não há orçamento para aumentos no momento. Tente melhorar seu desempenho.'
    };
  }
}

export function pedirDemissao(
  carreira: CareerState,
  anoAtual: number,
  idade: number
): {
  carreiraAtualizada: CareerState;
  novoLog: LifeLogEntry;
} {
  const cargoAnterior = carreira.cargoAtual?.titulo || 'emprego';
  const car: CareerState = {
    ...carreira,
    empregado: false,
    cargoAtual: undefined,
    desempenhoTrabalho: 50,
    horasExtras: false,
    bicoAtivoId: null,
    historicoEmpregos: [
      ...carreira.historicoEmpregos,
      {
        cargo: cargoAnterior,
        salario: carreira.cargoAtual?.salarioMensal || 0,
        anoInicio: anoAtual - carreira.anosNoCargo,
        anoFim: anoAtual,
        motivoSaida: 'Pedido de demissão voluntária'
      }
    ]
  };

  return {
    carreiraAtualizada: car,
    novoLog: {
      id: generateId('log'),
      idade,
      ano: anoAtual,
      categoria: 'carreira',
      texto: `Você pediu demissão do cargo de ${cargoAnterior} para buscar novos rumos na vida.`,
      tipo: 'info'
    }
  };
}

export function processarAnoCarreira(
  carreira: CareerState,
  personagem: Character,
  anoAtual: number,
  educacao: EducationState,
  economia: EconomyState
): {
  carreiraAtualizada: CareerState;
  personagemAtualizado: Character;
  economiaAtualizada: EconomyState;
  logsCarreira: LifeLogEntry[];
  salarioTotalAnual: number;
} {
  let car = { ...carreira };
  const char = { ...personagem };
  let eco = { ...economia };
  const logs: LifeLogEntry[] = [];
  let salarioTotalAnual = 0;

  if (car.aposentado && car.rendaAposentadoria) {
    salarioTotalAnual = car.rendaAposentadoria * 13;
    const resBicoAposent = resolverBicoDoAno(car, char, eco, educacao, anoAtual, logs);
    car = resBicoAposent.carreira;
    eco = resBicoAposent.economia;
    return { carreiraAtualizada: car, personagemAtualizado: char, economiaAtualizada: eco, logsCarreira: logs, salarioTotalAnual };
  }

  if (car.empregado && car.cargoAtual) {
    const cargoAtual = car.cargoAtual;
    salarioTotalAnual = cargoAtual.salarioMensal * 13;
    car.anosNoCargo += 1;

    char.hiddenStats.estresse = clamp(
      char.hiddenStats.estresse + cargoAtual.estresseNivel * 2,
      0,
      100
    );

    // Efeito do compromisso anual de horas extras (resolvido uma única vez)
    if (car.horasExtras) {
      car.desempenhoTrabalho = clamp(car.desempenhoTrabalho + randomInt(8, 16), 0, 100);
      char.hiddenStats.estresse = clamp(char.hiddenStats.estresse + 12, 0, 100);
      char.hiddenStats.ambicao = clamp(char.hiddenStats.ambicao + 5, 0, 100);
      logs.push({
        id: generateId('log'),
        idade: char.idade,
        ano: anoAtual,
        categoria: 'carreira',
        texto: 'As horas extras deste ano renderam reconhecimento: seu desempenho no trabalho subiu, mas o cansaço também.',
        tipo: 'positivo'
      });
      car.horasExtras = false;
    }

    // Promoção automática por mérito.
    //
    // Mérito não dispensa habilitação. A auditoria mediu escadas como
    // "Gerente de Loja → COO" e "Médico Clínico → Cirurgião Especialista"
    // percorridas sem nenhum diploma, porque a promoção não conferia nada
    // além de desempenho e tempo de casa. Agora ela consulta a MESMA regra
    // de elegibilidade da contratação — exceto experiência, que é justamente
    // o que se está adquirindo no cargo (ver `podeSerPromovidoPara`).
    if (cargoAtual.progressaoPara && car.desempenhoTrabalho >= 80 && car.anosNoCargo >= 2 && rollChance(40)) {
      const proximoCargo = TODAS_PROFISSOES.find(p => p.id === cargoAtual.progressaoPara);
      const habilitado =
        proximoCargo !== undefined &&
        podeSerPromovidoPara(proximoCargo, { personagem: char, educacao, carreira: car });
      if (proximoCargo && habilitado) {
        const cargoVelho = cargoAtual.titulo;
        car = {
          ...car,
          cargoAtual: proximoCargo,
          anosNoCargo: 0,
          desempenhoTrabalho: 65,
          historicoEmpregos: [
            ...car.historicoEmpregos,
            {
              cargo: cargoVelho,
              salario: cargoAtual.salarioMensal,
              anoInicio: anoAtual - car.anosNoCargo,
              anoFim: anoAtual,
              motivoSaida: 'Promoção por mérito'
            }
          ]
        };
        char.stats.felicidade = clamp(char.stats.felicidade + 25, 0, 100);
        char.hiddenStats.reputacao = clamp(char.hiddenStats.reputacao + 15, 0, 100);
        logs.push({
          id: generateId('log'),
          idade: char.idade,
          ano: anoAtual,
          categoria: 'carreira',
          texto: `Você foi promovido(a) a ${proximoCargo.titulo}! (Novo salário: ${formatarDinheiro(proximoCargo.salarioMensal)}/mês).`,
          tipo: 'importante'
        });
      }
    }

    // Risco de demissão por desempenho muito baixo
    if (car.desempenhoTrabalho < 25 && rollChance(50) && car.cargoAtual) {
      const cargoPerdido = car.cargoAtual.titulo;
      const salarioPerdido = car.cargoAtual.salarioMensal;
      car = {
        ...car,
        empregado: false,
        cargoAtual: undefined,
        desempenhoTrabalho: 50,
        historicoEmpregos: [
          ...car.historicoEmpregos,
          {
            cargo: cargoPerdido,
            salario: salarioPerdido,
            anoInicio: anoAtual - car.anosNoCargo,
            anoFim: anoAtual,
            motivoSaida: 'Demissão por baixo desempenho'
          }
        ]
      };
      char.stats.felicidade = clamp(char.stats.felicidade - 20, 0, 100);
      logs.push({
        id: generateId('log'),
        idade: char.idade,
        ano: anoAtual,
        categoria: 'carreira',
        texto: `Você foi demitido(a) do cargo de ${cargoPerdido} devido ao baixo rendimento nas avaliações.`,
        tipo: 'negativo'
      });
    }
  }

  // Bico do ano: pagamento único na virada, com revalidação do requisito
  const resBico = resolverBicoDoAno(car, char, eco, educacao, anoAtual, logs);
  car = resBico.carreira;
  eco = resBico.economia;

  return {
    carreiraAtualizada: car,
    personagemAtualizado: char,
    economiaAtualizada: eco,
    logsCarreira: logs,
    salarioTotalAnual
  };
}

function resolverBicoDoAno(
  carreira: CareerState,
  char: Character,
  economia: EconomyState,
  educacao: EducationState,
  anoAtual: number,
  logs: LifeLogEntry[]
): { carreira: CareerState; economia: EconomyState } {
  if (!carreira.bicoAtivoId) return { carreira, economia };

  const bico = BICOS_DISPONIVEIS.find(b => b.id === carreira.bicoAtivoId);
  if (!bico) {
    return { carreira: { ...carreira, bicoAtivoId: null }, economia };
  }

  // Revalidação do requisito no momento do pagamento
  if (bico.requisito && bico.requisito !== 'veiculo') {
    const nivelExigido = bico.requisito as EducationLevel;
    if (nivelEscolaridade(educacao.nivelAtual) < nivelEscolaridade(nivelExigido)) {
      logs.push({
        id: generateId('log'),
        idade: char.idade,
        ano: anoAtual,
        categoria: 'financas',
        texto: `Você não pôde continuar com o bico "${bico.nome}" porque não cumpre mais o requisito de escolaridade.`,
        tipo: 'negativo'
      });
      return { carreira: { ...carreira, bicoAtivoId: null }, economia };
    }
  }
  if (bico.requisito === 'veiculo' && !economia.propriedades.some(p => p.tipo === 'veiculo')) {
    logs.push({
      id: generateId('log'),
      idade: char.idade,
      ano: anoAtual,
      categoria: 'financas',
      texto: `Você não pôde continuar com o bico "${bico.nome}" porque não possui mais um veículo.`,
      tipo: 'negativo'
    });
    return { carreira: { ...carreira, bicoAtivoId: null }, economia };
  }

  char.hiddenStats.estresse = clamp(char.hiddenStats.estresse + bico.estresseGasto, 0, 100);
  logs.push({
    id: generateId('log'),
    idade: char.idade,
    ano: anoAtual,
    categoria: 'financas',
    texto: `O ano dedicado ao bico "${bico.nome}" rendeu ${formatarDinheiro(bico.ganhoEstimadoAnual)}.`,
    tipo: 'positivo'
  });

  return {
    carreira: { ...carreira, bicoAtivoId: null },
    economia: { ...economia, dinheiro: economia.dinheiro + bico.ganhoEstimadoAnual }
  };
}

// Utilitário mantido para consulta de bicos por identificador
export function obterBicoPorId(bicoId: string): FreelanceOption | undefined {
  return BICOS_DISPONIVEIS.find(b => b.id === bicoId);
}
