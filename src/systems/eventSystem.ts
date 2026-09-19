import {
  Character,
  CareerState,
  EducationState,
  EconomyState,
  FamilyMember,
  GameEvent,
  EventOption,
  LifeLogEntry
} from '../types';
import { MASTER_EVENTS_LIST } from '../data/events/allEvents';
import { getLifeStage } from '../utils/formatters';
import { clamp, generateId } from '../utils/random';
import { normalizarHiddenStats, normalizarStats } from './attributeSystem';

export function avaliarCondicoesEvento(
  evento: GameEvent,
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historicoDisparados: string[]
): boolean {
  // Idade
  if (personagem.idade < evento.idadeMinima || personagem.idade > evento.idadeMaxima) {
    return false;
  }

  // Evento único já disparado
  if (evento.unico && historicoDisparados.includes(evento.id)) {
    return false;
  }

  const cond = evento.condicoes;
  if (!cond) return true;

  if (cond.genero && cond.genero !== personagem.genero) return false;

  if (cond.faseVida) {
    const faseAtual = getLifeStage(personagem.idade);
    if (faseAtual !== cond.faseVida) return false;
  }

  if (cond.empregado !== undefined && cond.empregado !== carreira.empregado) return false;
  if (cond.emEscola !== undefined && cond.emEscola !== educacao.emCurso) return false;
  if (cond.emFaculdade !== undefined) {
    const isFaculdade = educacao.emCurso && (educacao.tipoCurso === 'superior' || educacao.tipoCurso === 'pos');
    if (cond.emFaculdade !== isFaculdade) return false;
  }

  if (cond.temParceiro !== undefined) {
    const temParc = familia.some(
      f => f.vivo && ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(f.tipo)
    );
    if (cond.temParceiro !== temParc) return false;
  }

  if (cond.temFilhos !== undefined) {
    const temFil = familia.some(f => f.vivo && (f.tipo === 'filho' || f.tipo === 'filha'));
    if (cond.temFilhos !== temFil) return false;
  }

  if (cond.dinheiroMinimo !== undefined && economia.dinheiro < cond.dinheiroMinimo) return false;
  if (cond.dinheiroMaximo !== undefined && economia.dinheiro > cond.dinheiroMaximo) return false;

  if (cond.saudeMinima !== undefined && personagem.stats.saude < cond.saudeMinima) return false;
  if (cond.saudeMaxima !== undefined && personagem.stats.saude > cond.saudeMaxima) return false;

  if (cond.flagsNecessarias) {
    for (const flag of cond.flagsNecessarias) {
      if (!personagem.flags[flag]) return false;
    }
  }

  if (cond.flagsProibidas) {
    for (const flag of cond.flagsProibidas) {
      if (personagem.flags[flag]) return false;
    }
  }

  return true;
}

export function sortearEventoDoAno(
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  historicoDisparados: string[]
): GameEvent | null {
  // Chance de 70% de ter um evento interativo no ano (alguns anos são mais calmos)
  if (Math.random() > 0.75) {
    return null;
  }

  const eventosElegiveis = MASTER_EVENTS_LIST.filter(evento =>
    avaliarCondicoesEvento(
      evento,
      personagem,
      carreira,
      educacao,
      economia,
      familia,
      historicoDisparados
    )
  );

  if (eventosElegiveis.length === 0) return null;

  // Sorteio ponderado por peso
  const pesoTotal = eventosElegiveis.reduce((sum, ev) => sum + ev.peso, 0);
  let rolagem = Math.random() * pesoTotal;

  for (const evento of eventosElegiveis) {
    if (rolagem < evento.peso) {
      return evento;
    }
    rolagem -= evento.peso;
  }

  return eventosElegiveis[0];
}

export function aplicarConsequenciasEscolha(
  opcao: EventOption,
  personagem: Character,
  carreira: CareerState,
  educacao: EducationState,
  economia: EconomyState,
  familia: FamilyMember[],
  anoAtual: number
): {
  personagemAtualizado: Character;
  carreiraAtualizada: CareerState;
  educacaoAtualizada: EducationState;
  economiaAtualizada: EconomyState;
  familiaAtualizada: FamilyMember[];
  novosLogs: LifeLogEntry[];
  morreu: boolean;
  causaMorte?: string;
} {
  const cons = opcao.consequencias;
  const char = { ...personagem };
  let car = { ...carreira };
  const edu = { ...educacao };
  let eco = { ...economia };
  let fam = [...familia];
  const logs: LifeLogEntry[] = [];
  let morreu = false;
  let causaMorte = cons.causaMorte;

  // Stats
  if (cons.stats) {
    char.stats = normalizarStats({
      ...char.stats,
      ...Object.fromEntries(
        Object.entries(cons.stats).map(([k, v]) => [
          k,
          char.stats[k as keyof typeof char.stats] + (v ?? 0)
        ])
      )
    });
  }

  // Hidden stats
  if (cons.hiddenStats) {
    char.hiddenStats = normalizarHiddenStats({
      ...char.hiddenStats,
      ...Object.fromEntries(
        Object.entries(cons.hiddenStats).map(([k, v]) => [
          k,
          char.hiddenStats[k as keyof typeof char.hiddenStats] + (v ?? 0)
        ])
      )
    });
  }

  // Dinheiro
  if (cons.dinheiro) {
    eco.dinheiro += cons.dinheiro;
  }

  // Flags
  if (cons.adicionarFlag) {
    char.flags = {
      ...char.flags,
      [cons.adicionarFlag]: true
    };
  }
  if (cons.removerFlag) {
    const novasFlags = { ...char.flags };
    delete novasFlags[cons.removerFlag];
    char.flags = novasFlags;
  }

  // Relacionamentos
  if (cons.relacionamentoDelta) {
    const { relationId, relationType, delta } = cons.relacionamentoDelta;
    fam = fam.map(membro => {
      let match = false;
      if (relationId && membro.id === relationId) match = true;
      else if (relationType && membro.tipo === relationType) match = true;
      else if (!relationId && !relationType) match = true; // Aplica a todos

      if (match) {
        return {
          ...membro,
          relacionamento: clamp(membro.relacionamento + delta, 0, 100)
        };
      }
      return membro;
    });
  }

  // Novo familiar (ex: animal de estimação ou novo parente)
  if (cons.adicionarFamiliar) {
    const novoFamiliar: FamilyMember = {
      id: generateId('fam'),
      nome: cons.adicionarFamiliar.nome || 'Novo Familiar',
      sobrenome: cons.adicionarFamiliar.sobrenome || char.sobrenome,
      genero: cons.adicionarFamiliar.genero || 'masculino',
      tipo: cons.adicionarFamiliar.tipo || 'pet',
      idade: cons.adicionarFamiliar.idade || 1,
      relacionamento: cons.adicionarFamiliar.relacionamento || 80,
      vivo: true,
      situacaoAtual: cons.adicionarFamiliar.situacaoAtual || 'Em casa com a família'
    };
    fam.push(novoFamiliar);
  }

  // Doenças
  if (cons.adicionarDoenca && !char.doencas.includes(cons.adicionarDoenca)) {
    char.doencas = [...char.doencas, cons.adicionarDoenca];
  }
  if (cons.curarDoenca) {
    char.doencas = char.doencas.filter(d => d !== cons.curarDoenca);
  }

  // Demissão
  if (cons.demissao && car.empregado) {
    const cargoAnterior = car.cargoAtual?.titulo || 'emprego';
    car = {
      ...car,
      empregado: false,
      cargoAtual: undefined,
      desempenhoTrabalho: 50,
      historicoEmpregos: [
        ...car.historicoEmpregos,
        {
          cargo: cargoAnterior,
          salario: car.cargoAtual?.salarioMensal || 0,
          anoInicio: anoAtual - car.anosNoCargo,
          anoFim: anoAtual,
          motivoSaida: 'Demissão por ocorrência de evento'
        }
      ]
    };
    logs.push({
      id: generateId('log'),
      idade: char.idade,
      ano: anoAtual,
      categoria: 'carreira',
      texto: `Você foi demitido(a) do cargo de ${cargoAnterior}.`,
      tipo: 'negativo'
    });
  }

  // Morte
  if (cons.morte || char.stats.saude <= 0) {
    morreu = true;
    causaMorte = causaMorte || (char.stats.saude <= 0 ? 'Problemas graves de saúde' : 'Incidente fatal');
  }

  // Log do resultado
  if (opcao.descricaoResultado) {
    logs.push({
      id: generateId('log'),
      idade: char.idade,
      ano: anoAtual,
      categoria: 'evento',
      texto: opcao.descricaoResultado,
      tipo: 'positivo'
    });
  }

  return {
    personagemAtualizado: char,
    carreiraAtualizada: car,
    educacaoAtualizada: edu,
    economiaAtualizada: eco,
    familiaAtualizada: fam,
    novosLogs: logs,
    morreu,
    causaMorte
  };
}
