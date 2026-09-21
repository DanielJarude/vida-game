import { AssetShopItem, OPCOES_INVESTIMENTO } from '../data/assetsData';
import { Character, EconomyState, FamilyMember, LifeLogEntry, Property } from '../types';
import {
  IDADE_MINIMA_COMPRA_BENS,
  IDADE_MINIMA_INVESTIMENTOS,
  IDADE_MINIMA_LOTERIA,
  IDADE_MINIMA_NEGOCIAR_BENS
} from './availabilitySystem';
import { generateId, randomInt, valorAleatorio } from '../utils/random';
import { formatarDinheiro } from '../utils/formatters';

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
  /**
   * Efeito de PRIVAÇÃO no corpo e no ânimo, quando o dinheiro acabou e não
   * há mais crédito. Aplicado pela passagem de ano em `agingSystem`.
   * Ausente quando o ano fechou sem aperto.
   */
  efeitosPrivacao?: { saude: number; felicidade: number; estresse: number };
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
    const taxa = info ? (info.rendimentoMin + valorAleatorio() * (info.rendimentoMax - info.rendimentoMin)) : 0.08;
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
      tipo: 'positivo',
      relevancia: 'textura'
    });
  }

  const despesaTotal = Math.round(despesaBase + despesaFilhos + manutencaoBens + mensalidadeEducacaoAnual);
  const fluxoLiquido = salarioAnual - despesaTotal;

  eco.dinheiro += fluxoLiquido;

  // ====================================================================== //
  //            QUANDO O DINHEIRO ACABA — antes isto não existia            //
  // ====================================================================== //
  //
  // O saldo era simplesmente somado e podia ficar negativo para sempre, sem
  // nenhuma consequência. A simulação de 60 vidas mediu o resultado: 60 de
  // 60 ficavam negativas a partir dos 20 anos e chegavam aos 80 com uma
  // mediana de −R$ 848.000. O jogador via um número vermelho crescendo e
  // absolutamente nada acontecia por causa dele.
  //
  // Pior: `EconomyState.dividas` já existia, já era subtraído do patrimônio
  // líquido e já tinha lugar em DUAS telas — e nenhum sistema jamais
  // escrevia nele. `padraoDeVida` era lido para calcular despesa e nunca
  // mudava. Duas peças prontas, desligadas.
  //
  // A regra agora é a que a vida usa: quando falta dinheiro, primeiro o
  // padrão de vida cede — ninguém sustenta um padrão sem renda — e só o que
  // ainda faltar vira dívida. Isso é um estabilizador de verdade: cair para
  // um padrão modesto reduz a despesa do ano seguinte, então o buraco para
  // de crescer no mesmo ritmo em vez de acelerar até o infinito.
  let privacao: { saude: number; felicidade: number; estresse: number } | undefined;

  const aplicarFaltaDeDinheiro = () => {
    if (eco.dinheiro >= 0) return;
    const falta = Math.round(-eco.dinheiro);
    eco.dinheiro = 0;

    if (eco.padraoDeVida === 'luxuoso') {
      eco.padraoDeVida = 'confortavel';
      logs.push({
        id: generateId('log'),
        idade,
        ano: anoAtual,
        categoria: 'financas',
        texto: 'As contas não fecharam e você precisou cortar o padrão de vida. Saíram os supérfluos primeiro.',
        tipo: 'negativo',
        relevancia: 'normal'
      });
    } else if (eco.padraoDeVida === 'confortavel') {
      eco.padraoDeVida = 'modesto';
      logs.push({
        id: generateId('log'),
        idade,
        ano: anoAtual,
        categoria: 'financas',
        texto: 'Você passou a viver com bem menos: trocou marca por preço e cortou o que dava para cortar.',
        tipo: 'negativo',
        relevancia: 'normal'
      });
    }

    const antes = eco.dividas;

    // TETO DE CRÉDITO. Na primeira versão desta correção a dívida
    // simplesmente somava e rendia juros, e a medição mostrou algo pior do
    // que o problema original: R$ 10 milhões aos 90 anos. Trocar um número
    // negativo que cresce para sempre por um número positivo que cresce
    // para sempre não conserta nada.
    //
    // Na vida real o crédito acaba. A partir do teto, a falta deixa de
    // virar dívida e passa a ser PRIVAÇÃO: menos comida boa, menos
    // cuidado, mais aperto — que é uma consequência de verdade, sentida no
    // corpo, e não um dígito a mais na tela.
    const espacoDeCredito = Math.max(0, TETO_DE_DIVIDA - eco.dividas);
    const viraDivida = Math.min(falta, espacoDeCredito);
    const semCobertura = falta - viraDivida;
    eco.dividas = Math.round(eco.dividas + viraDivida);

    if (semCobertura > 0) {
      // Proporcional ao tamanho do aperto, com limite: privação desgasta,
      // não executa.
      const severidade = Math.min(1, semCobertura / 20000);
      privacao = {
        saude: -Math.round(severidade * 3),
        felicidade: -Math.round(severidade * 6),
        estresse: Math.round(severidade * 8)
      };
    }

    // Um aviso por travessia de patamar, não um relatório todo ano: a Linha
    // da Vida conta a história do endividamento, não o extrato dele.
    for (const patamar of PATAMARES_DE_DIVIDA) {
      if (antes < patamar && eco.dividas >= patamar) {
        logs.push({
          id: generateId('log'),
          idade,
          ano: anoAtual,
          categoria: 'financas',
          texto: `Suas dívidas passaram de ${formatarDinheiro(patamar)} e começaram a pesar em tudo.`,
          tipo: 'alerta',
          relevancia: 'marco'
        });
        break;
      }
    }
  };

  aplicarFaltaDeDinheiro();

  // Sobrou dinheiro e existe dívida? Ela é paga antes de virar saldo. É o
  // que qualquer pessoa endividada faz, e é o que impede o estado absurdo
  // de alguém com poupança e dívida crescendo lado a lado.
  if (eco.dividas > 0 && eco.dinheiro > 0) {
    const abatido = Math.min(eco.dividas, eco.dinheiro);
    eco.dividas -= abatido;
    eco.dinheiro -= abatido;
    if (eco.dividas === 0) {
      logs.push({
        id: generateId('log'),
        idade,
        ano: anoAtual,
        categoria: 'financas',
        texto: 'Você quitou o que devia. Pela primeira vez em muito tempo, o que entra é seu.',
        tipo: 'positivo',
        relevancia: 'marco'
      });
    }
  }

  // Juros sobre o que ficou. Dívida parada cresce — é justamente por isso
  // que ela é uma limitação e não um número decorativo.
  if (eco.dividas > 0) {
    eco.dividas = Math.min(TETO_DE_DIVIDA, Math.round(eco.dividas * (1 + JUROS_ANUAIS_DIVIDA)));
  }

  return {
    economiaAtualizada: eco,
    logsEconomia: logs,
    efeitosPrivacao: privacao
  };
}

/**
 * Teto de crédito: o quanto uma pessoa consegue dever antes de ninguém
 * mais lhe emprestar. Passado daqui, a falta vira privação, não saldo
 * devedor — é o que impede a dívida de crescer sem limite.
 */
export const TETO_DE_DIVIDA = 250000;

/**
 * Juros anuais sobre a dívida acumulada. Deliberadamente moderado: o
 * objetivo é que a dívida seja um peso real e difícil de sair, não uma
 * espiral que torne qualquer tropeço irreversível.
 */
export const JUROS_ANUAIS_DIVIDA = 0.06;

/** Patamares que merecem uma linha na biografia quando são atravessados. */
export const PATAMARES_DE_DIVIDA = [10000, 50000, 150000, 400000];

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
  if (personagem.idade < IDADE_MINIMA_COMPRA_BENS) {
    return {
      sucesso: false,
      mensagem: 'Você precisa ser maior de idade para comprar imóveis e veículos.'
    };
  }
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
      tipo: 'importante',
      relevancia: 'normal'
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
  if (personagem.idade < IDADE_MINIMA_NEGOCIAR_BENS) {
    return { sucesso: false, mensagem: 'Você precisa ser maior de idade para negociar bens.' };
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
      tipo: 'info',
      relevancia: 'normal'
    }
  };
}

export function aplicarInvestimento(
  tipoId: 'poupanca' | 'tesouro_selic' | 'fundo_imobiliario' | 'acoes_b3' | 'cripto',
  valor: number,
  economia: EconomyState,
  personagem: Character
): {
  sucesso: boolean;
  mensagem: string;
  economiaAtualizada?: EconomyState;
} {
  if (personagem.idade < IDADE_MINIMA_INVESTIMENTOS) {
    return { sucesso: false, mensagem: 'Você precisa ser maior de idade para investir.' };
  }
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
  economia: EconomyState,
  personagem: Character
): {
  sucesso: boolean;
  mensagem: string;
  economiaAtualizada?: EconomyState;
} {
  if (personagem.idade < IDADE_MINIMA_INVESTIMENTOS) {
    return { sucesso: false, mensagem: 'Você precisa ser maior de idade para resgatar investimentos.' };
  }
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
  if (personagem.idade < IDADE_MINIMA_LOTERIA) {
    return {
      sucesso: false,
      ganhou: false,
      premio: 0,
      mensagem: 'Você precisa ser maior de idade para apostar na loteria.'
    };
  }
  const custoBilhete = 15;
  if (economia.dinheiro < custoBilhete) {
    return {
      sucesso: false,
      ganhou: false,
      premio: 0,
      mensagem: 'Dinheiro insuficiente para a aposta da loteria.'
    };
  }

  const rolagem = valorAleatorio() * 100;
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
      tipo: 'importante',
      relevancia: 'normal'
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
