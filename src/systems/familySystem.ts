import { Character, FamilyMember, Gender, LifeLogEntry, SocialClass } from '../types';
import {
  NOMES_FEMININOS,
  NOMES_MASCULINOS,
  PROFISSOES_PAIS,
  sortearNome
} from '../data/brazilianData';
import { clamp, generateId, randomChoice, randomInt, rollChance } from '../utils/random';

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
    const generoIrmao: Gender = Math.random() > 0.5 ? 'masculino' : 'feminino';
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
          tipo: 'negativo'
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
          texto: `Seu ${membro.tipo} ${membro.nome} ${membro.sobrenome} faleceu pacificamente aos ${novaIdade} anos.${
            herancaParente > 0 ? ` Você recebeu uma herança de R$ ${herancaParente.toLocaleString('pt-BR')}.` : ''
          }`,
          tipo: 'importante'
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
    const generoNovo: Gender = Math.random() > 0.5 ? 'masculino' : 'feminino';
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
      texto: `Nasceu seu novo ${novoIrmao.tipo}, ${novoIrmao.nome}! A casa está em festa com a chegada do bebê.`,
      tipo: 'positivo'
    });
  }

  return {
    familiaAtualizada,
    logsFamilia,
    herancaDinheiro
  };
}

export type FamilyInteractionType =
  | 'conversar'
  | 'passar_tempo'
  | 'dar_presente'
  | 'discutir'
  | 'pedir_dinheiro'
  | 'pedir_conselho';

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

  switch (interacao) {
    case 'conversar':
      deltaRel = randomInt(4, 10);
      deltaFel = randomInt(3, 8);
      deltaEmpatia = 3;
      deltaEstresse = -4;
      msg = `Você teve uma ótima conversa com ${membro.nome}. Vocês riram e compartilharam novidades.`;
      break;

    case 'passar_tempo':
      deltaRel = randomInt(8, 16);
      deltaFel = randomInt(8, 15);
      deltaEstresse = -8;
      msg = `Você passou a tarde inteira com ${membro.nome}. O momento juntos foi maravilhoso!`;
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
      msg = `Você e ${membro.nome} tiveram uma discussão áspera sobre assuntos do dia a dia. O clima ficou pesado.`;
      break;

    case 'pedir_dinheiro':
      if (membro.relacionamento >= 60 && (membro.tipo === 'pai' || membro.tipo === 'mae')) {
        ganho = randomInt(50, 300);
        deltaRel = -2;
        deltaFel = 8;
        msg = `Seu ${membro.tipo} ${membro.nome} te deu R$ ${ganho} para ajudar nas suas despesas.`;
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
