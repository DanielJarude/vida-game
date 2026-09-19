import { AssetShopItem, OPCOES_INVESTIMENTO } from '../data/assetsData';
import { Character, EconomyState, FamilyMember, LifeLogEntry, Property } from '../types';
import { generateId, randomInt } from '../utils/random';

export function criarEconomiaInicial(classeSocial: string): EconomyState {
  let saldoInicial = 0;
  if (classeSocial === 'classe_alta') saldoInicial = 5000;
  else if (classeSocial === 'classe_media') saldoInicial = 1000;
  else if (classeSocial === 'classe_media_baixa') saldoInicial = 300;
  else saldoInicial = 50;

  return {
    dinheiro: saldoInicial,
    despesasAnuaisPadrao: 12000,
    padraoDeVida: 'confortavel',
    propriedades: [],
    investimentos: [],
    dividas: 0
  };
}

export function calcularPatrimonioLiquido(economia: EconomyState): number {
  let total = economia.dinheiro;

  for (const prop of economia.propriedades) {
    total += prop.valorAtual;
  }

  for (const inv of economia.investimentos) {
    total += inv.saldo;
  }

  total -= economia.dividas;
  return Math.max(0, total);
}

export function processarAnoEconomia(
  economia: EconomyState,
  personagem: Character,
  familia: FamilyMember[],
  salarioAnual: number,
  mensalidadeEducacaoAnual: number,
  anoAtual: number
): {
  economiaAtualizada: EconomyState;
  logsEconomia: LifeLogEntry[];
} {
  const eco = {
    ...economia,
    propriedades: economia.propriedades.map(p => ({ ...p })),
    investimentos: economia.investimentos.map(i => ({ ...i }))
  };
  const logs: LifeLogEntry[] = [];
  const idade = personagem.idade;

  if (idade < 18) {
    eco.dinheiro += salarioAnual;
    return { economiaAtualizada: eco, logsEconomia: logs };
  }

  let despesaBase = 14000;
  if (eco.padraoDeVida === 'modesto') despesaBase = 9000;
  if (eco.padraoDeVida === 'luxuoso') despesaBase = 45000;

  const temImovelProprio = eco.propriedades.some(p => p.tipo === 'imovel' && p.quitado);
  if (temImovelProprio) {
    despesaBase *= 0.6;
  }

  const filhos = familia.filter(f => f.vivo && (f.tipo === 'filho' || f.tipo === 'filha') && f.idade < 18);
  const despesaFilhos = filhos.length * 7000;

  let manutencaoBens = 0;
  for (const prop of eco.propriedades) {
    manutencaoBens += prop.custoAnualManutencao;
    if (prop.tipo === 'imovel') {
      prop.valorAtual = Math.round(prop.valorAtual * (1 + (randomInt(2, 6) / 100)));
    } else if (prop.tipo === 'veiculo') {
      prop.valorAtual = Math.round(prop.valorAtual * (1 - (randomInt(5, 10) / 100)));
    }
  }

  let rendimentoTotal = 0;
  for (const inv of eco.investimentos) {
    const info = OPCOES_INVESTIMENTO.find(o => o.id === inv.tipo);
    const taxa = info ? (info.rendimentoMin + Math.random() * (info.rendimentoMax - info.rendimentoMin)) : 0.08;
    const rendimento = Math.round(inv.saldo * taxa);
    inv.saldo += rendimento;
    rendimentoTotal += rendimento;
  }

  if (rendimentoTotal > 0 && eco.investimentos.length > 0) {
    logs.push({
      id: generateId('log'),
      idade,
      ano: anoAtual,
      categoria: 'financas',
      texto: `Seus investimentos renderam R$ ${rendimentoTotal.toLocaleString('pt-BR')} no último ano.`,
      tipo: 'positivo'
    });
  }

  const despesaTotal = Math.round(despesaBase + despesaFilhos + manutencaoBens + mensalidadeEducacaoAnual);
  const fluxoLiquido = salarioAnual - despesaTotal;

  eco.dinheiro += fluxoLiquido;

  return {
    economiaAtualizada: eco,
    logsEconomia: logs
  };
}

export function comprarBem(
  item: AssetShopItem,
  economia: EconomyState,
  personagem: Character,
  anoAtual: number
): {
  sucesso: boolean;
  mensagem: string;
  economiaAtualizada?: EconomyState;
  personagemAtualizado?: Character;
  novoLog?: LifeLogEntry;
} {
  if (economia.dinheiro < item.preco) {
    return {
      sucesso: false,
      mensagem: `Saldo insuficiente. Você precisa de R$ ${item.preco.toLocaleString('pt-BR')} e possui R$ ${economia.dinheiro.toLocaleString('pt-BR')}.`
    };
  }

  const novaPropriedade: Property = {
    id: generateId(item.tipo),
    tipo: item.tipo,
    nome: item.nome,
    valorCompra: item.preco,
    valorAtual: item.preco,
    custoAnualManutencao: item.custoAnualManutencao,
    anoCompra: anoAtual,
    quitado: true
  };

  const novaEco: EconomyState = {
    ...economia,
    dinheiro: economia.dinheiro - item.preco,
    propriedades: [...economia.propriedades, novaPropriedade]
  };

  const novoChar: Character = {
    ...personagem,
    stats: {
      ...personagem.stats,
      felicidade: Math.min(100, personagem.stats.felicidade + item.felicidadeBonus),
      aparencia: Math.min(100, personagem.stats.aparencia + (item.aparenciaBonus || 0))
    }
  };

  return {
    sucesso: true,
    mensagem: `Parabéns pela aquisição! Você comprou: ${item.nome}!`,
    economiaAtualizada: novaEco,
    personagemAtualizado: novoChar,
    novoLog: {
      id: generateId('log'),
      idade: personagem.idade,
      ano: anoAtual,
      categoria: 'financas',
      texto: `Você comprou um(a) ${item.nome} por R$ ${item.preco.toLocaleString('pt-BR')}.`,
      tipo: 'importante'
    }
  };
}

export function venderBem(
  propriedadeId: string,
  economia: EconomyState,
  personagem: Character,
  anoAtual: number
): {
  sucesso: boolean;
  mensagem: string;
  economiaAtualizada?: EconomyState;
  novoLog?: LifeLogEntry;
} {
  const prop = economia.propriedades.find(p => p.id === propriedadeId);
  if (!prop) {
    return { sucesso: false, mensagem: 'Item não encontrado em seu patrimônio.' };
  }

  const valorVenda = prop.valorAtual;
  const novaEco: EconomyState = {
    ...economia,
    dinheiro: economia.dinheiro + valorVenda,
    propriedades: economia.propriedades.filter(p => p.id !== propriedadeId)
  };

  return {
    sucesso: true,
    mensagem: `Você vendeu ${prop.nome} por R$ ${valorVenda.toLocaleString('pt-BR')}!`,
    economiaAtualizada: novaEco,
    novoLog: {
      id: generateId('log'),
      idade: personagem.idade,
      ano: anoAtual,
      categoria: 'financas',
      texto: `Você vendeu seu(sua) ${prop.nome} por R$ ${valorVenda.toLocaleString('pt-BR')}.`,
      tipo: 'info'
    }
  };
}

export function aplicarInvestimento(
  tipoId: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto',
  valor: number,
  economia: EconomyState
): {
  sucesso: boolean;
  mensagem: string;
  economiaAtualizada?: EconomyState;
} {
  if (valor <= 0) return { sucesso: false, mensagem: 'Informe um valor válido.' };
  if (economia.dinheiro < valor) return { sucesso: false, mensagem: 'Saldo insuficiente.' };

  const info = OPCOES_INVESTIMENTO.find(o => o.id === tipoId);
  if (!info) return { sucesso: false, mensagem: 'Tipo de investimento inválido.' };

  const novosInvestimentos = [...economia.investimentos];
  const existente = novosInvestimentos.find(i => i.tipo === tipoId);

  if (existente) {
    existente.saldo += valor;
  } else {
    novosInvestimentos.push({
      id: generateId('inv'),
      tipo: tipoId,
      nome: info.nome,
      saldo: valor,
      rendimentoMedioAnual: (info.rendimentoMin + info.rendimentoMax) / 2,
      risco: tipoId === 'cripto' ? 'muito_alto' : tipoId === 'acoes_b3' ? 'alto' : tipoId === 'fundo_imobiliario' ? 'medio' : 'baixo'
    });
  }

  return {
    sucesso: true,
    mensagem: `Aplicação de R$ ${valor.toLocaleString('pt-BR')} realizada com sucesso em ${info.nome}!`,
    economiaAtualizada: {
      ...economia,
      dinheiro: economia.dinheiro - valor,
      investimentos: novosInvestimentos
    }
  };
}

export function resgatarInvestimento(
  tipoId: string,
  valor: number,
  economia: EconomyState
): {
  sucesso: boolean;
  mensagem: string;
  economiaAtualizada?: EconomyState;
} {
  const inv = economia.investimentos.find(i => i.tipo === tipoId);
  if (!inv || inv.saldo < valor) {
    return { sucesso: false, mensagem: 'Saldo insuficiente no investimento para esse resgate.' };
  }

  const novosInvestimentos = economia.investimentos
    .map(i => {
      if (i.tipo === tipoId) {
        return { ...i, saldo: i.saldo - valor };
      }
      return i;
    })
    .filter(i => i.saldo > 0);

  return {
    sucesso: true,
    mensagem: `Resgate de R$ ${valor.toLocaleString('pt-BR')} transferido para sua conta corrente!`,
    economiaAtualizada: {
      ...economia,
      dinheiro: economia.dinheiro + valor,
      investimentos: novosInvestimentos
    }
  };
}

export function jogarMegaSena(
  economia: EconomyState,
  personagem: Character,
  anoAtual: number
): {
  sucesso: boolean;
  ganhou: boolean;
  premio: number;
  mensagem: string;
  economiaAtualizada?: EconomyState;
  personagemAtualizado?: Character;
  novoLog?: LifeLogEntry;
} {
  const custoBilhete = 15;
  if (economia.dinheiro < custoBilhete) {
    return {
      sucesso: false,
      ganhou: false,
      premio: 0,
      mensagem: 'Dinheiro insuficiente para a aposta da loteria.'
    };
  }

  const rolagem = Math.random() * 100;
  let ganhou = false;
  let premio = 0;
  let msg = 'Você conferiu o bilhete na lotérica... não foi dessa vez. Quem sabe no próximo concurso!';

  if (rolagem < 0.05) {
    ganhou = true;
    premio = randomInt(15000000, 60000000);
    msg = `INACREDITÁVEL! VOCÊ ACERTOU AS 6 DEZENAS DA MEGA-SENA E GANHOU R$ ${premio.toLocaleString('pt-BR')}! VOCÊ É O MAIS NOVO MULTIMILIONÁRIO DO BRASIL!`;
  } else if (rolagem < 3.0) {
    ganhou = true;
    premio = randomInt(800, 45000);
    msg = `Parabéns! Você acertou parte dos números e faturou um prêmio de R$ ${premio.toLocaleString('pt-BR')}!`;
  }

  const novaEco: EconomyState = {
    ...economia,
    dinheiro: economia.dinheiro - custoBilhete + premio
  };

  const novoChar: Character = {
    ...personagem,
    stats: {
      ...personagem.stats,
      felicidade: ganhou ? 100 : Math.max(0, personagem.stats.felicidade - 1)
    }
  };

  let novoLog: LifeLogEntry | undefined;
  if (ganhou) {
    novoLog = {
      id: generateId('log'),
      idade: personagem.idade,
      ano: anoAtual,
      categoria: 'financas',
      texto: msg,
      tipo: 'importante'
    };
  }

  return {
    sucesso: true,
    ganhou,
    premio,
    mensagem: msg,
    economiaAtualizada: novaEco,
    personagemAtualizado: novoChar,
    novoLog
  };
}
