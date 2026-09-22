import { Character, FamilyInteractionType, FamilyMember, Gender, LifeLogEntry, SocialClass } from '../types';
import {
  NOMES_FEMININOS,
  NOMES_MASCULINOS,
  PROFISSOES_PAIS,
  sortearNome
} from '../data/brazilianData';
import { getTratamentoParentesco } from '../utils/formatters';
import { IDADE_MINIMA_PEDIR_CONSELHO, IDADE_MINIMA_PEDIR_DINHEIRO } from './availabilitySystem';
import {
  avaliarCapacidadeInteracao,
  deveOferecerInteracao,
  narrarInteracaoPorFase
} from './interactionCapabilitySystem';
import { clamp, generateId, randomChoice, randomInt, rollChance, valorAleatorio } from '../utils/random';
import { ehVinculoSocial } from './contexto/contextoDaVida';

/** Narrativa da interação conforme a fase da vida do personagem. */
function narrarInteracao(
  interacao: FamilyInteractionType,
  membro: FamilyMember,
  idade: number
): string {
  return narrarInteracaoPorFase(
    interacao,
    membro.nome,
    idade,
    membro.tipo === 'pet',
    ehVinculoSocial(membro.tipo)
  );
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function gerarFamiliaInicial(
  sobrenomeFamilia: string,
  _classeSocial: SocialClass
): FamilyMember[] {
  const familia: FamilyMember[] = [];

  // Pai
  const idadePai = randomInt(24, 38);
  const profPai = randomChoice(PROFISSOES_PAIS);
  const pai: FamilyMember = {
    id: generateId('pai'),
    nome: randomChoice(NOMES_MASCULINOS),
    sobrenome: sobrenomeFamilia,
    genero: 'masculino',
    tipo: 'pai',
    idade: idadePai,
    relacionamento: randomInt(75, 95),
    vivo: true,
    profissao: profPai.cargo,
    renda: profPai.renda,
    situacaoAtual: 'Trabalhando e cuidando da família'
  };
  familia.push(pai);

  // Mãe
  const idadeMae = randomInt(22, 36);
  const profMae = randomChoice(PROFISSOES_PAIS);
  const mae: FamilyMember = {
    id: generateId('mae'),
    nome: randomChoice(NOMES_FEMININOS),
    sobrenome: sobrenomeFamilia,
    genero: 'feminino',
    tipo: 'mae',
    idade: idadeMae,
    relacionamento: randomInt(80, 98),
    vivo: true,
    profissao: profMae.cargo,
    renda: profMae.renda,
    situacaoAtual: 'Muito carinhosa com o novo bebê'
  };
  familia.push(mae);

  // Chance de 40% de já ter um irmão mais velho
  if (rollChance(40)) {
    const generoIrmao: Gender = valorAleatorio() > 0.5 ? 'masculino' : 'feminino';
    const idadeIrmao = randomInt(1, 6);
    const irmao: FamilyMember = {
      id: generateId('irmao'),
      nome: sortearNome(generoIrmao),
      sobrenome: sobrenomeFamilia,
      genero: generoIrmao,
      tipo: generoIrmao === 'masculino' ? 'irmao' : 'irma',
      idade: idadeIrmao,
      relacionamento: randomInt(70, 90),
      vivo: true,
      situacaoAtual: 'Brincando pela casa'
    };
    familia.push(irmao);
  }

  return familia;
}

export function processarEnvelhecimentoFamilia(
  familia: FamilyMember[],
  personagem: Character,
  anoAtual: number
): {
  familiaAtualizada: FamilyMember[];
  logsFamilia: LifeLogEntry[];
  herancaDinheiro: number;
} {
  const familiaAtualizada: FamilyMember[] = [];
  const logsFamilia: LifeLogEntry[] = [];
  let herancaDinheiro = 0;

  for (const membro of familia) {
    if (!membro.vivo) {
      familiaAtualizada.push(membro);
      continue;
    }

    const novaIdade = membro.idade + 1;
    let continuaVivo = true;
    let causaMorte = '';

    if (membro.tipo === 'pet') {
      if (novaIdade >= 13 && rollChance((novaIdade - 12) * 20)) {
        continuaVivo = false;
        causaMorte = 'velhice tranquila';
        logsFamilia.push({
          id: generateId('log'),
          idade: personagem.idade,
          ano: anoAtual,
          categoria: 'familia',
          texto: `Seu querido pet ${membro.nome} faleceu em paz aos ${novaIdade} anos. Sua companhia deixará saudades eternas.`,
          tipo: 'negativo',
          relevancia: 'marco'
        });
      }
    } else {
      if (novaIdade >= 70 && rollChance((novaIdade - 68) * 3.5)) {
        continuaVivo = false;
        causaMorte = 'causas naturais';
        const herancaParente = membro.tipo === 'pai' || membro.tipo === 'mae' ? randomInt(5000, 35000) : 0;
        herancaDinheiro += herancaParente;

        logsFamilia.push({
          id: generateId('log'),
          idade: personagem.idade,
          ano: anoAtual,
          categoria: 'familia',
          texto: `${capitalizar(getTratamentoParentesco(membro.tipo))} ${membro.nome} ${membro.sobrenome} faleceu pacificamente aos ${novaIdade} anos.${
            herancaParente > 0 ? ` Você recebeu uma herança de R$ ${herancaParente.toLocaleString('pt-BR')}.` : ''
          }`,
          tipo: 'importante',
          relevancia: 'marco'
        });
      }
    }

    if (!continuaVivo) {
      familiaAtualizada.push({
        ...membro,
        idade: novaIdade,
        vivo: false,
        anoMorte: anoAtual,
        causaMorte,
        situacaoAtual: 'Falecido(a)'
      });
    } else {
      const flutuacao = randomInt(-2, 2);
      familiaAtualizada.push({
        ...membro,
        idade: novaIdade,
        relacionamento: clamp(membro.relacionamento + flutuacao, 0, 100)
      });
    }
  }

  const mae = familiaAtualizada.find(f => f.tipo === 'mae' && f.vivo);
  if (personagem.idade >= 1 && personagem.idade <= 7 && mae && mae.idade < 42 && rollChance(18)) {
    const generoNovo: Gender = valorAleatorio() > 0.5 ? 'masculino' : 'feminino';
    const novoIrmao: FamilyMember = {
      id: generateId('irmao'),
      nome: sortearNome(generoNovo),
      sobrenome: personagem.sobrenome,
      genero: generoNovo,
      tipo: generoNovo === 'masculino' ? 'irmao' : 'irma',
      idade: 0,
      relacionamento: randomInt(85, 95),
      vivo: true,
      situacaoAtual: 'Bebê recém-chegado à família'
    };
    familiaAtualizada.push(novoIrmao);
    logsFamilia.push({
      id: generateId('log'),
      idade: personagem.idade,
      ano: anoAtual,
      categoria: 'familia',
      texto: `Nasceu ${getTratamentoParentesco(novoIrmao.tipo)}, ${novoIrmao.nome}! A casa está em festa com a chegada do bebê.`,
      tipo: 'positivo',
      relevancia: 'marco'
    });
  }

  return {
    familiaAtualizada,
    logsFamilia,
    herancaDinheiro
  };
}

export type { FamilyInteractionType } from '../types';

export function interagirComFamiliar(
  membro: FamilyMember,
  personagem: Character,
  interacao: FamilyInteractionType,
  presenteTipo?: 'barato' | 'medio' | 'luxo'
): {
  membroAtualizado: FamilyMember;
  personagemAtualizado: Character;
  custoDinheiro: number;
  dinheiroGanho: number;
  mensagem: string;
  sucesso: boolean;
} {
  let deltaRel = 0;
  let deltaFel = 0;
  let deltaEstresse = 0;
  let deltaEmpatia = 0;
  let deltaInteligencia = 0;
  let custo = 0;
  let ganho = 0;
  let msg = '';
  let sucesso = true;

  const ehPet = membro.tipo === 'pet';

  // Revalidação da política central: interações que pressupõem autonomia
  // maior do que a fase atual permite são recusadas sem efeitos.
  //
  // Esta checagem é a que realmente protege o estado. Esconder o botão é
  // apresentação; aqui é onde uma chamada direta (save editado, código,
  // teste) também falha, sem aplicar nenhum efeito parcial. Um pet usa a
  // trilha própria: conversar, discutir e presente comprado não existem
  // para ele em nenhuma idade.
  // F6-FIX — o motor também recusa interação que não cabe no VÍNCULO (pedir
  // dinheiro a um colega de sala, por exemplo), não só a que não cabe na
  // idade. Defesa em profundidade: a UI já não oferece, e aqui também não
  // passa.
  if (!deveOferecerInteracao(interacao, personagem.idade, ehPet, ehVinculoSocial(membro.tipo))) {
    return {
      membroAtualizado: membro,
      personagemAtualizado: personagem,
      custoDinheiro: 0,
      dinheiroGanho: 0,
      mensagem: `Isso não faz sentido na sua relação com ${membro.nome}.`,
      sucesso: false
    };
  }

  const capacidade = avaliarCapacidadeInteracao(interacao, personagem.idade, ehPet);
  if (!capacidade.permitido) {
    return {
      membroAtualizado: membro,
      personagemAtualizado: personagem,
      custoDinheiro: 0,
      dinheiroGanho: 0,
      mensagem: capacidade.motivo,
      sucesso: false
    };
  }

  if (!ehPet && interacao === 'pedir_dinheiro' && personagem.idade < IDADE_MINIMA_PEDIR_DINHEIRO) {
    return {
      membroAtualizado: membro,
      personagemAtualizado: personagem,
      custoDinheiro: 0,
      dinheiroGanho: 0,
      mensagem: 'Você ainda é muito pequeno(a) para pedir dinheiro.',
      sucesso: false
    };
  }
  if (!ehPet && interacao === 'pedir_conselho' && personagem.idade < IDADE_MINIMA_PEDIR_CONSELHO) {
    return {
      membroAtualizado: membro,
      personagemAtualizado: personagem,
      custoDinheiro: 0,
      dinheiroGanho: 0,
      mensagem: 'Você ainda é muito pequeno(a) para pedir conselhos de vida.',
      sucesso: false
    };
  }

  switch (interacao) {
    case 'conversar':
      deltaRel = randomInt(4, 10);
      deltaFel = randomInt(3, 8);
      deltaEmpatia = 3;
      deltaEstresse = -4;
      msg = narrarInteracao('conversar', membro, personagem.idade);
      break;

    case 'passar_tempo':
      deltaRel = randomInt(8, 16);
      deltaFel = randomInt(8, 15);
      deltaEstresse = -8;
      msg = narrarInteracao('passar_tempo', membro, personagem.idade);
      break;

    case 'dar_presente':
      if (presenteTipo === 'luxo') {
        custo = 1200;
        deltaRel = randomInt(20, 35);
        deltaFel = 15;
        msg = `Você deu um presente de luxo inesquecível para ${membro.nome}! Os olhos dele(a) brilharam de emoção.`;
      } else if (presenteTipo === 'medio') {
        custo = 250;
        deltaRel = randomInt(12, 22);
        deltaFel = 10;
        msg = `Você presenteou ${membro.nome} com algo muito especial e carinhoso.`;
      } else {
        custo = 50;
        deltaRel = randomInt(6, 12);
        deltaFel = 5;
        msg = `Você deu uma lembrancinha charmosa para ${membro.nome}. Ele(a) adorou o gesto!`;
      }
      break;

    case 'discutir':
      deltaRel = -randomInt(10, 25);
      deltaFel = -randomInt(8, 15);
      deltaEstresse = 15;
      sucesso = false;
      msg = narrarInteracao('discutir', membro, personagem.idade);
      break;

    case 'pedir_dinheiro':
      if (membro.relacionamento >= 60 && (membro.tipo === 'pai' || membro.tipo === 'mae')) {
        ganho = randomInt(50, 300);
        deltaRel = -2;
        deltaFel = 8;
        msg = `${capitalizar(getTratamentoParentesco(membro.tipo))} ${membro.nome} te deu R$ ${ganho} para ajudar nas suas despesas.`;
      } else {
        deltaRel = -5;
        sucesso = false;
        msg = `${membro.nome} disse que está sem dinheiro no momento e não pôde te ajudar.`;
      }
      break;

    case 'pedir_conselho':
      deltaRel = randomInt(5, 10);
      deltaInteligencia = 3;
      deltaFel = 5;
      deltaEstresse = -5;
      msg = `${membro.nome} compartilhou valiosos conselhos de vida com você. Você se sentiu inspirado(a)!`;
      break;

    // Interações exclusivas de pet (B4-FIX1): o vínculo é físico, não verbal.
    case 'fazer_carinho':
      deltaRel = randomInt(6, 14);
      deltaFel = randomInt(5, 10);
      deltaEstresse = -6;
      msg = narrarInteracao('fazer_carinho', membro, personagem.idade);
      break;

    case 'alimentar':
      deltaRel = randomInt(4, 9);
      deltaFel = randomInt(2, 5);
      deltaEmpatia = 2;
      msg = narrarInteracao('alimentar', membro, personagem.idade);
      break;

    case 'passear':
      deltaRel = randomInt(8, 15);
      deltaFel = randomInt(6, 12);
      deltaEstresse = -8;
      msg = narrarInteracao('passear', membro, personagem.idade);
      break;
  }

  const membroAtualizado: FamilyMember = {
    ...membro,
    relacionamento: clamp(membro.relacionamento + deltaRel, 0, 100)
  };

  const personagemAtualizado: Character = {
    ...personagem,
    stats: {
      ...personagem.stats,
      felicidade: clamp(personagem.stats.felicidade + deltaFel, 0, 100),
      inteligencia: clamp(personagem.stats.inteligencia + deltaInteligencia, 0, 100)
    },
    hiddenStats: {
      ...personagem.hiddenStats,
      empatia: clamp(personagem.hiddenStats.empatia + deltaEmpatia, 0, 100),
      estresse: clamp(personagem.hiddenStats.estresse + deltaEstresse, 0, 100)
    }
  };

  return {
    membroAtualizado,
    personagemAtualizado,
    custoDinheiro: custo,
    dinheiroGanho: ganho,
    mensagem: msg,
    sucesso
  };
}
