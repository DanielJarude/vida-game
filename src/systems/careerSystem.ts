import { CareerState, Character, EducationLevel, Job, LifeLogEntry } from '../types';
import { TODAS_PROFISSOES } from '../data/careersData';
import { clamp, generateId, randomInt, rollChance } from '../utils/random';

export function criarCarreiraInicial(): CareerState {
  return {
    empregado: false,
    anosNoCargo: 0,
    desempenhoTrabalho: 60,
    horasExtras: false,
    aposentado: false,
    historicoEmpregos: []
  };
}

const HIERARQUIA_EDUCACAO: Record<EducationLevel, number> = {
  nenhuma: 0,
  fundamental_incompleto: 1,
  fundamental_completo: 2,
  medio_incompleto: 3,
  medio_completo: 4,
  tecnico: 5,
  superior_incompleto: 6,
  superior_completo: 7,
  pos_graduacao: 8
};

export function obterVagasDisponiveis(
  escolaridade: EducationLevel,
  inteligencia: number
): Job[] {
  const nivelJogador = HIERARQUIA_EDUCACAO[escolaridade] || 0;

  return TODAS_PROFISSOES.filter(job => {
    const nivelReq = HIERARQUIA_EDUCACAO[job.escolaridadeMinima] || 0;
    return nivelJogador >= nivelReq && job.inteligenciaMinima <= inteligencia + 15;
  });
}

export function candidatarEmprego(
  job: Job,
  personagem: Character,
  anoAtual: number
): {
  sucesso: boolean;
  mensagem: string;
  novoCargo?: Job;
  novoLog?: LifeLogEntry;
} {
  const nivelJogador = HIERARQUIA_EDUCACAO[personagem.flags['escolaridade'] as EducationLevel || 'nenhuma'] || 0;
  const nivelReq = HIERARQUIA_EDUCACAO[job.escolaridadeMinima] || 0;

  let chance = 60;
  if (personagem.stats.inteligencia >= job.inteligenciaMinima) chance += 20;
  if (personagem.hiddenStats.reputacao >= 60) chance += 10;
  if (personagem.stats.aparencia >= 60) chance += 5;
  if (nivelJogador > nivelReq) chance += 15;

  if (rollChance(chance)) {
    return {
      sucesso: true,
      mensagem: `Parabéns! Você foi contratado(a) como ${job.titulo} com salário de R$ ${job.salarioMensal.toLocaleString('pt-BR')}/mês!`,
      novoCargo: job,
      novoLog: {
        id: generateId('log'),
        idade: personagem.idade,
        ano: anoAtual,
        categoria: 'carreira',
        texto: `Você começou a trabalhar como ${job.titulo} (Salário: R$ ${job.salarioMensal.toLocaleString('pt-BR')}/mês).`,
        tipo: 'importante'
      }
    };
  } else {
    return {
      sucesso: false,
      mensagem: `Infelizmente a empresa optou por outro candidato no momento. Continue tentando!`
    };
  }
}

export function trabalharMais(
  carreira: CareerState,
  personagem: Character
): {
  carreiraAtualizada: CareerState;
  personagemAtualizado: Character;
  mensagem: string;
} {
  const car = { ...carreira };
  const char = { ...personagem };

  car.horasExtras = true;
  car.desempenhoTrabalho = clamp(car.desempenhoTrabalho + randomInt(8, 16), 0, 100);
  char.stats.energia = clamp(char.stats.energia - 20, 0, 100);
  char.hiddenStats.estresse = clamp(char.hiddenStats.estresse + 12, 0, 100);
  char.hiddenStats.ambicao = clamp(char.hiddenStats.ambicao + 5, 0, 100);

  return {
    carreiraAtualizada: car,
    personagemAtualizado: char,
    mensagem: 'Você fez horas extras e dedicou-se com afinco aos projetos da empresa. Seu chefe notou seu esforço!'
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
      mensagem: `Aumento concedido! Seu salário aumentou para R$ ${novoCargoAtual.salarioMensal.toLocaleString('pt-BR')}/mês.`,
      novoLog: {
        id: generateId('log'),
        idade: char.idade,
        ano: anoAtual,
        categoria: 'carreira',
        texto: `Seu pedido de aumento salarial foi aceito! Novo salário: R$ ${novoCargoAtual.salarioMensal.toLocaleString('pt-BR')}/mês.`,
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
  anoAtual: number
): {
  carreiraAtualizada: CareerState;
  personagemAtualizado: Character;
  logsCarreira: LifeLogEntry[];
  salarioTotalAnual: number;
} {
  let car = { ...carreira };
  const char = { ...personagem };
  const logs: LifeLogEntry[] = [];
  let salarioTotalAnual = 0;

  if (car.aposentado && car.rendaAposentadoria) {
    salarioTotalAnual = car.rendaAposentadoria * 13;
    return { carreiraAtualizada: car, personagemAtualizado: char, logsCarreira: logs, salarioTotalAnual };
  }

  if (!car.empregado || !car.cargoAtual) {
    return { carreiraAtualizada: car, personagemAtualizado: char, logsCarreira: logs, salarioTotalAnual: 0 };
  }

  const cargoAtual = car.cargoAtual;
  salarioTotalAnual = cargoAtual.salarioMensal * 13;
  car.anosNoCargo += 1;

  char.hiddenStats.estresse = clamp(
    char.hiddenStats.estresse + cargoAtual.estresseNivel * 2,
    0,
    100
  );

  // Promoção automática por mérito
  if (cargoAtual.progressaoPara && car.desempenhoTrabalho >= 80 && car.anosNoCargo >= 2 && rollChance(40)) {
    const proximoCargo = TODAS_PROFISSOES.find(p => p.id === cargoAtual.progressaoPara);
    if (proximoCargo) {
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
        texto: `PROMOÇÃO! Seu excelente trabalho foi reconhecido e você foi promovido(a) a ${proximoCargo.titulo}! (Novo salário: R$ ${proximoCargo.salarioMensal.toLocaleString('pt-BR')}/mês).`,
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

  car.horasExtras = false;

  return {
    carreiraAtualizada: car,
    personagemAtualizado: char,
    logsCarreira: logs,
    salarioTotalAnual
  };
}
