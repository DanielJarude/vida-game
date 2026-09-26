/**
 * O que dá para fazer com uma pessoa — nasce da relação e do momento.
 *
 * Cada interação declara QUANDO faz sentido (papel, fase de vida da pessoa,
 * idade do jogador, morar junto ou longe, o que está acontecendo com ela) e
 * o QUE muda: afeto, confiança, atrito, presença, envolvimento. Um bebê não
 * recebe "ajudar com dinheiro"; um filho de 30 anos não recebe "ler uma
 * história"; quem mora em outra cidade não recebe "passar a tarde junto".
 *
 * O que se repete vira costume: a terceira vez que alguém lê para o filho
 * antes de dormir entra na história dos dois. Nada disso vira número na tela.
 */

import type { Rng } from '../rng';
import { animal } from '../dados/animais';
import { clamp } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { compatibilidade } from './social';
import {
  atraiGenero, encerrarCaso, iniciarCaso, interesseInicial, mudarEstagio, podeTerRomance, reacaoATraicao,
  regraDeIdade, romanceAdolescente, terminar
} from './romance';
import { morarJuntos } from './moradia';
import { gestacaoEmCurso } from './familia';
import { aplicarPersonalidade } from '../personalidade';
import { abalar } from './abalo';
import { flex, ge } from '../texto';
import { ehDescendente, faseDeIdade, mesmaCidade, moraJunto, papelDe, type Fase, type Papel } from './vinculos';
import { lacoCom, oLaco } from './rede';

export const LIMITE_INTERACOES = 5;

export interface CtxI {
  v: Vida;
  p: Pessoa;
  vin: Vinculo;
  papel: Papel;
  /** Fase de vida da pessoa. */
  fase: Fase;
  /** Idade do jogador e da pessoa. */
  eu: number;
  ip: number;
  casa: boolean;
  longe: boolean;
}

export interface Saida { resultado?: string; aviso?: { texto: string; tom: 'bom' | 'ruim' | 'neutro' }; titulo?: string }

export interface Interacao {
  id: string;
  rotulo: (c: CtxI) => string;
  /** Faz sentido oferecer isto a esta pessoa agora? (Se não, nem aparece.) */
  quando: (c: CtxI) => boolean;
  /** Dá para fazer agora? (Aparece bloqueado, com o motivo.) */
  disponivel?: (c: CtxI) => Veredito;
  variante?: 'principal' | 'secundario' | 'discreto' | 'perigo';
  /** Mostrar a chance em palavras. */
  chance?: boolean;
  /**
   * O quanto isso importa AGORA com esta pessoa (além da variante). A ficha
   * mostra primeiro o que é mais relevante — o aniversário de dez anos, a
   * pessoa em quem você anda pensando — e recolhe o resto.
   */
  prioridade?: (c: CtxI) => number;
  /** O resultado merece ser lido com calma (abre uma folha em vez de um aviso). */
  destaque?: boolean;
  executar: (c: CtxI, r: Rng) => Saida;
}

/* --------------------------------------------------------------- Contexto */

export function ctxPessoa(v: Vida, id: string): CtxI | null {
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  if (!p || !vin) return null;
  const ip = idadePessoa(v, p);
  return {
    v, p, vin, papel: papelDe(p, vin), fase: faseDeIdade(ip), eu: idade(v), ip,
    casa: moraJunto(vin), longe: !mesmaCidade(v, p)
  };
}

/* ---------------------------------------------------------------- Efeitos */

const afeto = (c: CtxI, n: number) => { c.vin.proximidade = clamp(Math.round(c.vin.proximidade + n)); };
const confiar = (c: CtxI, n: number) => { c.vin.confianca = clamp(Math.round(c.vin.confianca + n)); };
const acalmar = (c: CtxI, n: number) => { c.vin.tensao = clamp(Math.round(c.vin.tensao - n)); };
const envolver = (c: CtxI, n: number) => { if (c.vin.romance) c.vin.romance.envolvimento = clamp(Math.round(c.vin.romance.envolvimento + n)); };
const presente = (c: CtxI, n: number) => { c.vin.presenca = clamp(Math.round((c.vin.presenca ?? 30) + n)); };
const estresse = (c: CtxI, n: number) => { c.v.mente.estresse = clamp(c.v.mente.estresse + n); };

/** Conta a repetição e devolve quantas vezes já foi feito (1 = primeira). */
function habito(c: CtxI, id: string): number {
  const h = c.vin.habitos ?? (c.vin.habitos = {});
  h[id] = (h[id] ?? 0) + 1;
  return h[id];
}

/** Na n-ésima vez, o costume entra na história dos dois. */
function costume(c: CtxI, vezes: number, quando: number, texto: string): void {
  if (vezes === quando) lembrarCom(c.v, c.p.id, texto, 'ritual', 2);
}

/** Frase que muda com a repetição (a quinta vez não é descrita como a primeira). */
const variar = (vezes: number, frases: string[]) => frases[(vezes - 1) % frases.length];

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const dele = (p: Pessoa) => flex(p.genero, 'dele', 'dela', 'delu');
const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const cuidou = (c: CtxI) => marcarFato(c.v, `cuidou_${c.p.id}_${Math.floor(c.v.t / 12)}`);

/* ----------------------------------------------------------- Predicados */

const humano = (c: CtxI) => !c.p.especie;
const parceriaAtiva = (c: CtxI) => c.papel === 'parceiro';
const emRomance = (c: CtxI) => c.papel === 'parceiro' || c.papel === 'saindo' || c.papel === 'caso';
const pertoOuEmCasa = (c: CtxI) => c.casa || !c.longe;
/** Criança da família (filho, neto, irmão mais novo, primo) — não um amigo da escola do jogador adulto. */
const criancaDaFamilia = (c: CtxI) => ehDescendente(c.papel) || ((c.papel === 'irmao' || c.papel === 'parente') && c.eu >= 12);
const apertoRecente = (c: CtxI) => !!c.p.aperto && c.v.t - c.p.aperto.t <= 24;
const semContatoHa = (c: CtxI) => (c.v.t - c.vin.tUltimoContato) / 12;

/* ------------------------------------------------------------- Catálogo */

export const INTERACOES: Interacao[] = [
  /* ============================================= CRIANÇAS PEQUENAS DA FAMÍLIA */
  {
    id: 'cuidar', variante: 'principal',
    quando: c => humano(c) && c.fase === 'bebe' && criancaDaFamilia(c) && c.eu >= 14 && pertoOuEmCasa(c),
    rotulo: c => c.papel === 'filho' ? (c.ip === 0 ? 'Cuidar das madrugadas' : 'Dar banho, colo e comida') : `Ficar com ${c.p.nome} uma tarde`,
    executar: c => {
      const n = habito(c, 'cuidar');
      afeto(c, 7); presente(c, c.papel === 'filho' ? 14 : 8); estresse(c, 3);
      // Cuidar junto aproxima o casal que divide a criança.
      const par = parceiro(c.v);
      if (par && c.p.genitores?.includes(par.p.id) && par.vin.romance) par.vin.romance.envolvimento = clamp(par.vin.romance.envolvimento + 2);
      if (c.papel === 'filho') costume(c, n, 2, c.ip === 0 ? 'As madrugadas com o bebê no colo foram suas também.' : 'O banho e o colo eram com você.');
      else costume(c, n, 2, `Tardes de ${c.p.nome} na sua casa.`);
      return { resultado: variar(n, c.papel === 'filho'
        ? [`Três da manhã, ${c.p.nome} no colo, a casa inteira dormindo. ${capital(ele(c.p))} dormiu no seu ombro.`, 'Fralda, mamadeira, arroto, colo. Repetir.', `Você aprendeu o choro de fome e o choro de sono de ${c.p.nome}.`]
        : [`${c.p.nome} passou a tarde com você e dormiu no sofá, de boca aberta.`, `Uma tarde de papinha e desenho animado com ${c.p.nome}.`]) };
    }
  },
  {
    id: 'brincar', variante: 'principal',
    quando: c => humano(c) && c.ip <= 11 && pertoOuEmCasa(c) && (criancaDaFamilia(c) || (c.eu <= 12 && Math.abs(c.eu - c.ip) <= 3)),
    disponivel: c => (c.eu < 3 ? bloqueio('impossivel', 'Ainda muito pequeno.') : PERMITIDO),
    rotulo: c => c.fase === 'bebe' ? `Brincar no chão com ${c.p.nome}` : c.eu <= 12 ? `Brincar com ${c.p.nome}` : `Brincar com ${c.p.nome} até cansar`,
    executar: c => {
      const n = habito(c, 'brincar');
      const comp = compatibilidade(c.v, c.p);
      afeto(c, 6 + comp * 3); if (criancaDaFamilia(c)) presente(c, 10);
      if (criancaDaFamilia(c)) costume(c, n, 3, c.fase === 'bebe' ? 'Brincar no tapete da sala virou coisa de vocês.' : 'Vocês tinham as brincadeiras de vocês — ninguém mais entendia as regras.');
      const frases = c.fase === 'bebe'
        ? [`Você fazia careta, ${c.p.nome} gargalhava. Assim foi a tarde.`, `Torre de blocos, derrubada, de novo. ${c.p.nome} não cansava.`]
        : c.eu <= 12
          ? [`Uma tarde inteira de pega-pega com ${c.p.nome}.`, `Montaram uma cabana com lençol e cadeira.`, `Futebol na rua até a luz do poste acender.`]
          : [`Esconde-esconde até escurecer. ${c.p.nome} sempre no mesmo lugar, e você fingindo não saber.`, `Uma tarde de massinha, tinta e bagunça na mesa da cozinha.`, `Bola no quintal com ${c.p.nome} — você perdeu de propósito, e depois não precisou mais.`];
      return { resultado: variar(n, frases) };
    }
  },
  {
    id: 'ler', quando: c => humano(c) && c.ip >= 2 && c.ip <= 9 && criancaDaFamilia(c) && c.eu >= 14 && (c.casa || (c.papel !== 'filho' && !c.longe)),
    rotulo: () => 'Ler uma história antes de dormir',
    executar: c => {
      const n = habito(c, 'ler');
      afeto(c, 5); presente(c, 8);
      if (c.p.vida) c.p.vida.aptidao = Math.min(1, c.p.vida.aptidao + 0.015);
      costume(c, n, 3, 'Ler antes de dormir virou coisa de vocês.');
      return { resultado: variar(n, [`${c.p.nome} escolheu o livro. Você leu duas vezes; ${ele(c.p)} dormiu antes do fim da segunda.`, `A mesma história de novo — ${c.p.nome} corrigia quando você pulava uma página.`, `${c.p.nome} começou a ler uma página e você a outra.`]) };
    }
  },

  /* ============================================== CRIANÇA EM IDADE ESCOLAR */
  {
    id: 'estudos', quando: c => humano(c) && c.ip >= 6 && c.ip <= 17 && (c.papel === 'filho' || c.papel === 'neto' || (c.papel === 'irmao' && c.eu >= 15 && c.eu - c.ip >= 4)) && pertoOuEmCasa(c) && !c.p.vida?.parouDeEstudar,
    rotulo: c => c.ip <= 11 ? 'Ajudar com o dever de casa' : 'Ajudar a estudar para as provas',
    executar: c => {
      const n = habito(c, 'estudos');
      afeto(c, c.ip >= 13 ? 2 : 4); presente(c, 7); confiar(c, 2);
      if (c.p.vida) c.p.vida.aptidao = Math.min(1, c.p.vida.aptidao + 0.02);
      costume(c, n, 3, c.ip <= 11 ? 'A mesa da cozinha, à noite, era o lugar do dever de casa com você.' : 'Estudavam juntos na véspera das provas.');
      return { resultado: variar(n, c.ip <= 11
        ? ['Tabuada, redação e uma briga com a divisão de dois algarismos. No fim, deu.', `${c.p.nome} entendeu frações com uma pizza desenhada no caderno.`, 'Uma hora de dever na mesa da cozinha.']
        : [`Você não lembrava mais nada de química. Aprenderam juntos, e ${c.p.nome} riu disso.`, 'Uma revisão de véspera, com café e exercício resolvido no guardanapo.']) };
    }
  },
  {
    id: 'escola', quando: c => humano(c) && c.papel === 'filho' && c.ip >= 5 && c.ip <= 16 && c.p.ocupacao === 'estudante' && pertoOuEmCasa(c),
    rotulo: () => 'Ir à reunião da escola',
    executar: (c, r) => {
      const n = habito(c, 'escola');
      presente(c, 5); confiar(c, 3);
      costume(c, n, 4, 'Você ia às reuniões da escola.');
      const apt = c.p.vida?.aptidao ?? 0;
      const fala = apt > 0.2 ? `A professora elogiou ${c.p.nome}: presta atenção, ajuda os colegas.` : apt < -0.2 ? `A professora disse que ${c.p.nome} anda distraíd${o(c.p)} — e que em casa isso ajuda.` : r.pick([`A professora disse que ${c.p.nome} vai bem, sem sustos.`, `Nada de novo na reunião: ${c.p.nome} vai indo.`]);
      return { resultado: fala };
    }
  },
  {
    id: 'incentivar', quando: c => humano(c) && (c.papel === 'filho' || c.papel === 'neto') && c.ip >= 7 && c.ip <= 16 && pertoOuEmCasa(c),
    rotulo: c => `Incentivar o gosto de ${c.p.nome} por ${interesseDe(c.p)}`,
    executar: c => {
      const n = habito(c, 'incentivar');
      afeto(c, 5); presente(c, 6); confiar(c, 2);
      if (c.p.vida) c.p.vida.aptidao = Math.min(1, c.p.vida.aptidao + 0.01);
      costume(c, n, 3, `Você nunca perdeu uma apresentação de ${interesseDe(c.p)} de ${c.p.nome}.`);
      return { resultado: variar(n, [`Você foi ver ${c.p.nome} e sentou na primeira fila.`, `Compraram juntos o que faltava para ${interesseDe(c.p)}. ${capital(ele(c.p))} passou a semana contando os dias.`, `${c.p.nome} mostrou o que aprendeu. Você fingiu que entendia tudo — e entendia metade.`]) };
    }
  },

  /* ================================================================ ADOLESCENTE */
  {
    id: 'limite', variante: 'discreto',
    quando: c => humano(c) && c.papel === 'filho' && c.fase === 'adolescente' && c.casa && (c.vin.tensao >= 30 || temFatoRecente(c.v, `fil_problema_${c.p.id}`, 24)),
    rotulo: () => 'Impor um limite',
    executar: c => {
      aplicarPersonalidade(c.v, 'acao:limite', { disciplina: 1 });
      const presenca = c.vin.presenca ?? 30;
      if (presenca >= 50 && c.vin.confianca >= 50) {
        acalmar(c, 6); confiar(c, 2);
        lembrarCom(c.v, c.p.id, 'Você colocou limites — e foram respeitados.', 'conflito', 1);
        return { resultado: `${c.p.nome} reclamou, bateu a porta do quarto e, no dia seguinte, cumpriu.` };
      }
      acalmar(c, -12); afeto(c, -4);
      return { resultado: `${c.p.nome} ouviu calad${o(c.p)} e fez o contrário na primeira oportunidade.` };
    }
  },
  {
    id: 'futuro', quando: c => humano(c) && (c.papel === 'filho' || c.papel === 'neto') && c.ip >= 15 && c.ip <= 19 && !c.p.estudo,
    rotulo: () => 'Conversar sobre o futuro',
    executar: c => {
      const n = habito(c, 'futuro');
      afeto(c, 3); confiar(c, 3);
      // Uma conversa que chega antes do vestibular pesa no que a pessoa quer fazer.
      const chave = `fil_quer_${c.p.id}`;
      if (c.v.fatos[chave] === undefined && c.vin.confianca >= 45) c.v.fatos[`fil_conversou_${c.p.id}`] = c.v.t;
      if (n === 1) lembrarCom(c.v, c.p.id, `Conversaram sobre o que ${ele(c.p)} queria da vida.`, 'escola', 1);
      return { resultado: c.vin.confianca >= 45 ? `${c.p.nome} falou mais do que você esperava: tem planos, medo e uma lista de cursos no celular.` : `${c.p.nome} respondeu com "sei lá" e "vou ver". Mas ouviu.` };
    }
  },

  /* ============================================================ CONVERSA */
  {
    id: 'conversar',
    quando: c => humano(c) && c.ip >= 6 && c.eu >= 6 && !parceriaAtiva(c) && c.papel !== 'caso' && (!c.longe || c.casa),
    rotulo: c => c.vin.tensao >= 40 ? 'Conversar e tentar acertar as coisas' : c.papel === 'filho' && c.fase === 'adolescente' ? 'Conversar de verdade, sem sermão' : c.papel === 'filho' && c.ip < 13 ? `Perguntar como foi o dia ${c.ip < 9 ? 'na escola' : ''}`.trim() : 'Ter uma conversa de verdade',
    executar: c => {
      const comp = compatibilidade(c.v, c.p);
      const tensa = c.vin.tensao >= 40;
      acalmar(c, tensa ? 22 : 10); afeto(c, 3 + comp * 4); confiar(c, 4);
      if (tensa) lembrarCom(c.v, c.p.id, 'Conversaram e acertaram as coisas.', 'reconciliacao', 1);
      if (c.papel === 'filho' && c.fase === 'adolescente') { presente(c, 6); return { resultado: c.vin.confianca >= 50 ? `${c.p.nome} contou uma coisa que não tinha contado para ninguém.` : `${c.p.nome} falou pouco. Mas ficou mais tempo na cozinha do que precisava.` }; }
      if (c.papel === 'filho' && c.ip < 13) { presente(c, 5); return { resultado: `${c.p.nome} contou do dia inteiro, com personagens, reviravolta e um colega que comeu cola.` }; }
      return { resultado: tensa ? (comp > 0 ? `Não foi fácil, mas você e ${c.p.nome} saíram da conversa mais leves.` : 'Nem tudo ficou resolvido, mas o clima melhorou.') : comp > 0 ? `A conversa com ${c.p.nome} foi longe e fez bem aos dois.` : `Vocês conversaram. ${c.p.nome} agradeceu por você ter perguntado.` };
    }
  },

  /* ============================================================ TEMPO JUNTO */
  {
    id: 'tempo', variante: 'principal',
    quando: c => humano(c) && !emRomance(c) && c.ip >= 12 && c.eu >= 3 && pertoOuEmCasa(c) && !(criancaDaFamilia(c) && c.ip <= 11),
    rotulo: c => rotuloTempo(c),
    executar: c => {
      const n = habito(c, 'tempo');
      const comp = compatibilidade(c.v, c.p);
      afeto(c, 6 + comp * 6); confiar(c, 2);
      if (ehDescendente(c.papel)) presente(c, 8);
      if (c.papel === 'colega' || c.papel === 'conhecido') afeto(c, 2);
      if (c.papel === 'filho' && c.ip >= 18) costume(c, n, 4, c.casa ? 'Vocês mantinham um programa só de vocês, mesmo morando juntos.' : 'O almoço com você nunca saiu da agenda.');
      else if (c.papel === 'genitor' && c.eu >= 25) costume(c, n, 4, `Você nunca deixou de visitar ${c.p.nome}.`);
      else if (c.papel === 'amigo' || c.papel === 'amigo_proximo') costume(c, n, 5, 'Os encontros de vocês resistiram aos anos.');
      return { resultado: variar(n, frasesTempo(c)) };
    }
  },
  {
    id: 'visitar',
    quando: c => humano(c) && c.longe && !c.casa && c.eu >= 18 && !emRomance(c) && (c.papel !== 'colega' && c.papel !== 'conhecido'),
    disponivel: c => (c.v.financas.conta >= custoViagem(c) ? PERMITIDO : bloqueio('requisito', `A viagem custa cerca de R$ ${custoViagem(c).toLocaleString('pt-BR')}.`)),
    rotulo: c => `Viajar para ver ${c.p.nome}`,
    executar: c => {
      const n = habito(c, 'visitar');
      c.v.financas.conta -= custoViagem(c);
      afeto(c, 11); confiar(c, 3);
      if (ehDescendente(c.papel)) presente(c, 6);
      costume(c, n, 3, 'As viagens para se ver viraram rotina.');
      return { resultado: variar(n, [`Rodoviária, estrada, e ${c.p.nome} esperando no portão. Valeu cada hora.`, `Um fim de semana na casa de ${c.p.nome}, dormindo no sofá e conversando até tarde.`, `${c.p.nome} mostrou a cidade como se fosse ${dele(c.p)}.`]) };
    }
  },
  {
    id: 'ligar',
    quando: c => humano(c) && c.eu >= 9 && c.ip >= 8 && !parceriaAtiva(c) && (c.longe || semContatoHa(c) >= 2) && !c.casa,
    rotulo: c => (c.eu >= 60 || c.ip >= 60 ? `Ligar para ${c.p.nome}` : `Mandar mensagem para ${c.p.nome}`),
    executar: c => {
      const n = habito(c, 'ligar');
      afeto(c, 3); acalmar(c, 4);
      costume(c, n, 4, 'Uma ligação de vez em quando manteve vocês perto, mesmo longe.');
      return { resultado: variar(n, [`${c.p.nome} atendeu no segundo toque. Falaram quarenta minutos.`, `Uma troca de mensagens que foi da piada antiga à notícia nova.`, `${c.p.nome} mandou áudio de volta. Longo.`]) };
    }
  },
  {
    id: 'apoiar', variante: 'principal',
    quando: c => humano(c) && apertoRecente(c) && c.eu >= 10 && c.ip >= 6,
    rotulo: c => rotuloApoio(c),
    executar: c => {
      afeto(c, 10); confiar(c, 10); acalmar(c, 10);
      if (c.vin.romance) envolver(c, 6);
      const tipo = c.p.aperto!.tipo;
      // Um marco por momento difícil (estar junto de novo no mesmo aperto não é um marco novo).
      if (!c.vin.historia.some(h => h.tipo === 'apoio' && h.t >= c.p.aperto!.t)) lembrarCom(c.v, c.p.id, textoApoio(c), 'apoio', 2);
      aplicarPersonalidade(c.v, 'acao:apoiar', { empatia: 1 });
      // Quem tem apoio atravessa o aperto mais rápido.
      if (c.p.aperto && (tipo === 'fase' || tipo === 'luto' || tipo === 'separacao')) c.p.aperto.t -= 8;
      return { resultado: variar(1, [resultadoApoio(c)]) };
    }
  },
  {
    id: 'desabafar', destaque: true,
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 14 && precisaDesabafar(c.v) && ouve(c),
    prioridade: () => 2.2,
    rotulo: c => (c.longe && !c.casa ? `Ligar para ${c.p.nome} e desabafar` : c.eu < 18 && c.papel === 'genitor' ? `Contar para ${c.p.nome} o que anda pesando` : `Desabafar com ${c.p.nome}`),
    executar: c => {
      const n = habito(c, 'desabafar');
      const comp = compatibilidade(c.v, c.p);
      const confia = c.vin.confianca >= 45;
      abalar(c.v, `desabafar com ${c.p.nome}`, confia ? 3 + comp * 2 : 1, confia ? -(6 + c.vin.confianca / 20) : -3);
      afeto(c, 3); confiar(c, 4);
      if (!c.vin.historia.some(h => h.tipo === 'apoio' && h.texto.startsWith('Esteve do seu lado') && c.v.t - h.t < 36)) lembrarCom(c.v, c.p.id, 'Esteve do seu lado quando a vida pesou.', 'apoio', 2);
      if (!confia) return { resultado: `${c.p.nome} ouviu, mas pareceu não saber o que dizer. Mesmo assim, falar em voz alta ajudou um pouco.` };
      return { resultado: variar(n, [
        `Você falou mais do que pretendia. ${c.p.nome} não tentou resolver nada — só ficou.`,
        `${c.p.nome} escutou até o fim e depois contou de uma fase difícil ${dele(c.p)}. Você não se sentiu tão sozinh${flex(ge(c.v), 'o', 'a', 'e')}.`,
        `Uma conversa longa, café esfriando na mesa. Nada mudou lá fora; aqui dentro, um pouco.`
      ]) };
    }
  },
  {
    id: 'dinheiro',
    quando: c => humano(c) && c.eu >= 18 && c.ip >= 18 && !c.casa && !emRomance(c) && precisaDeDinheiro(c),
    disponivel: c => (c.v.financas.conta >= 500 ? { grau: 'permitido' } : bloqueio('requisito', 'Não sobra dinheiro para ajudar agora.')),
    rotulo: c => (c.p.aperto?.tipo === 'desemprego' ? `Ajudar ${c.p.nome} até arrumar trabalho` : `Ajudar ${c.p.nome} com dinheiro`),
    executar: c => {
      const valor = Math.min(Math.round(c.v.financas.conta * 0.3 / 100) * 100, 3000) || 500;
      c.v.financas.conta -= valor;
      afeto(c, 6); confiar(c, 4);
      aplicarPersonalidade(c.v, 'acao:ajudar', { generosidade: 1 });
      if (c.p.aperto?.tipo === 'dinheiro' || c.p.aperto?.tipo === 'desemprego') lembrarCom(c.v, c.p.id, 'Você ajudou num aperto de dinheiro.', 'apoio', 1);
      return { resultado: `Você mandou R$ ${valor.toLocaleString('pt-BR')}. ${c.p.nome} agradeceu com a voz embargada.` };
    }
  },
  {
    id: 'aconselhar',
    quando: c => humano(c) && (c.papel === 'filho' || c.papel === 'neto' || (c.papel === 'irmao' && c.eu > c.ip)) && c.ip >= 18 && apertoRecente(c) && c.p.aperto!.tipo !== 'luto',
    rotulo: () => 'Dar um conselho',
    executar: c => {
      if (c.vin.confianca >= 55) {
        afeto(c, 4); confiar(c, 2);
        return { resultado: `${c.p.nome} ouviu até o fim e disse que ia pensar. Pelo jeito, vai mesmo.` };
      }
      acalmar(c, -8);
      return { resultado: `${c.p.nome} disse que não pediu conselho. A conversa acabou ali.` };
    }
  },
  {
    id: 'medico',
    quando: c => humano(c) && (c.papel === 'genitor' || c.papel === 'avo' || (parceriaAtiva(c) && c.ip >= 60)) && c.ip >= 65 && c.p.saude < 62 && c.eu >= 18 && pertoOuEmCasa(c),
    rotulo: c => `Acompanhar ${c.p.nome} ao médico`,
    executar: c => {
      const n = habito(c, 'medico');
      afeto(c, 7); confiar(c, 5);
      c.p.saude = clamp(c.p.saude + 3);
      aplicarPersonalidade(c.v, 'acao:cuidar_idoso', { familia: 1 });
      costume(c, n, 2, `Era você quem levava ${c.p.nome} às consultas.`);
      return { resultado: variar(n, [`Sala de espera, senha, uma hora de atraso. ${c.p.nome} contou a vida inteira para a senhora do lado.`, `O médico trocou um remédio. ${c.p.nome} saiu reclamando e segurando seu braço.`]) };
    }
  },
  {
    id: 'reaproximar',
    quando: c => humano(c) && !emRomance(c) && c.papel !== 'ex' && c.eu >= 10 && (c.vin.estagio === 'afastado' || (semContatoHa(c) >= 3 && c.vin.proximidade < 45)),
    rotulo: c => `Procurar ${c.p.nome} depois de tanto tempo`,
    executar: c => {
      afeto(c, 14); confiar(c, 3);
      if (c.vin.proximidade >= 40 && !c.vin.parentesco) c.vin.estagio = 'amigo';
      escrever(c.v, { texto: `Procurou ${c.p.nome} depois de muito tempo sem se falar.`, relevancia: 'cotidiano', tema: c.vin.parentesco ? 'familia' : 'amizade', escolha: true, pessoas: [c.p.id], evento: { tipo: 'reencontro', pessoaId: c.p.id, peso: 20 } });
      lembrarCom(c.v, c.p.id, 'Voltaram a se falar depois de anos.', 'reconciliacao', 2);
      return { resultado: c.vin.proximidade >= 40 ? `${c.p.nome} respondeu na hora. Parecia estar esperando isso.` : `${c.p.nome} respondeu com educação. Vai levar tempo.` };
    }
  },

  /* ========================================================== ROMANCE: COMEÇO */
  /*
   * Iniciativa: UMA de cada vez, conforme o quanto vocês se conhecem.
   *  - mal se conhecem → demonstrar interesse (um sinal, sem risco grande);
   *  - se conhecem, ou já há um interesse no ar → chamar para sair;
   *  - amizade de verdade → dizer o que sente (arrisca mais, pode ganhar mais).
   * A resposta é da outra pessoa e nasce do que existe entre vocês
   * (`interesseDoOutro`): proximidade, confiança, história, afinidade, o
   * momento dela — com um pouco de acaso, nunca só acaso.
   */
  {
    id: 'flertar', destaque: true,
    quando: c => iniciativaPossivel(c) && !c.vin.romance && c.vin.proximidade < 35 && !c.longe && c.vin.convivio.length > 0,
    prioridade: c => (c.vin.proximidade >= 25 ? 1.5 : 0.6),
    rotulo: c => (c.eu < 18 ? `Puxar conversa com ${c.p.nome}, com segundas intenções` : `Demonstrar interesse por ${c.p.nome}`),
    executar: (c, r) => flertar(c, r)
  },
  {
    id: 'declarar', destaque: true,
    quando: c => iniciativaPossivel(c) && !c.vin.romance && (c.vin.estagio === 'amigo' || c.vin.estagio === 'amigo_proximo') && c.vin.proximidade >= 55,
    prioridade: () => 2.5,
    rotulo: c => (c.longe ? `Ligar e dizer a ${c.p.nome} o que sente` : c.eu < 18 ? `Contar para ${c.p.nome} que gosta ${dele(c.p)}` : `Dizer a ${c.p.nome} o que sente`),
    executar: (c, r) => declarar(c, r)
  },
  {
    id: 'convidar', chance: true, destaque: true,
    quando: c => {
      if (!humano(c) || c.vin.parentesco || c.eu < 13 || c.ip < 13) return false;
      const rom = c.vin.romance;
      if (parceiro(c.v)) return !rom || rom.estagio === 'interesse' || (rom.estagio === 'ex' && rom.fim !== 'morte');
      if (!iniciativaPossivel(c) || c.longe) return false;
      if (rom?.estagio === 'interesse') return !rom.pediuTempo;
      if (rom?.estagio === 'ex') return rom.fim !== 'morte' && c.v.t - rom.tEstagio >= 24 && c.vin.proximidade >= 35;
      if (rom) return false;
      return c.vin.proximidade >= 35 && !((c.vin.estagio === 'amigo' || c.vin.estagio === 'amigo_proximo') && c.vin.proximidade >= 55);
    },
    disponivel: c => disponibilidadeConvite(c),
    variante: 'secundario',
    prioridade: c => (c.vin.romance?.estagio === 'interesse' ? 4 : c.vin.romance?.estagio === 'ex' ? 0.8 : 2),
    rotulo: c => (parceiro(c.v) ? `Chamar ${c.p.nome} para sair, escondido` : c.vin.romance?.estagio === 'ex' ? `Tentar de novo com ${c.p.nome}` : c.eu < 18 ? `Chamar ${c.p.nome} para sair depois da aula` : `Chamar ${c.p.nome} para sair`),
    executar: (c, r) => {
      const traicao = !!parceiro(c.v);
      if (!c.v.eu.atracao) c.v.eu.atracao = c.p.genero === 'masculino' ? 'homens' : c.p.genero === 'feminino' ? 'mulheres' : 'ambos';
      if (traicao) {
        if (!r.chance(chanceConvite(c))) {
          if (c.vin.romance?.estagio === 'interesse') c.vin.romance = undefined;
          return { resultado: `${c.p.nome} agradeceu o convite e disse que prefere deixar as coisas como estão.` };
        }
        iniciarCaso(c.v, c.p, c.vin);
        return { resultado: `${c.p.nome} topou. Ninguém mais sabe.` };
      }
      return responderConvite(c, r);
    }
  },
  {
    id: 'pedir_namoro', variante: 'principal',
    quando: c => c.papel === 'saindo',
    disponivel: c => {
      const atual = parceiro(c.v);
      if (atual && atual.p.id !== c.p.id) return bloqueio('incompativel', `Você está com ${atual.p.nome}. Para namorar ${c.p.nome}, seria preciso terminar antes.`);
      if (c.v.t - c.vin.romance!.tEstagio < 3) return bloqueio('requisito', 'Cedo demais.');
      return PERMITIDO;
    },
    rotulo: () => 'Pedir em namoro',
    executar: (c, r) => {
      const rom = c.vin.romance!;
      if (r.chance(clamp((rom.envolvimento - 30) / 45, 0.05, 0.95))) {
        mudarEstagio(c.v, c.vin, 'namoro');
        escrever(c.v, { texto: `Começou a namorar ${c.p.nome}.`, relevancia: 'marco', tema: 'amor', tom: 'bom', escolha: true, pessoas: [c.p.id], evento: { tipo: 'namoro', pessoaId: c.p.id, peso: 40 } });
        lembrarCom(c.v, c.p.id, 'Começaram a namorar.', 'romance', 2);
        return { resultado: `${c.p.nome} disse sim antes de você terminar a frase.` };
      }
      envolver(c, -8);
      return { resultado: `${c.p.nome} disse que ainda não está pront${o(c.p)} para isso.` };
    }
  },
  {
    id: 'encerrar_caso', variante: 'perigo',
    quando: c => c.papel === 'caso',
    rotulo: () => 'Terminar o caso',
    executar: c => {
      encerrarCaso(c.v, c.p, c.vin);
      aplicarPersonalidade(c.v, 'acao:encerrar_caso', { familia: 1 });
      return { resultado: `Você disse a ${c.p.nome} que acabou. ${capital(ele(c.p))} não insistiu.` };
    }
  },

  /* ========================================================== ROMANCE: VIDA A DOIS */
  {
    id: 'sair_juntos', variante: 'principal',
    quando: c => (parceriaAtiva(c) || c.papel === 'saindo' || c.papel === 'caso') && pertoOuEmCasa(c),
    prioridade: c => (c.papel === 'saindo' ? 2 : 0),
    rotulo: c => {
      const ja = c.vin.habitos?.['sair'] ?? 0;
      if (c.papel === 'saindo' && ja === 0) return romanceAdolescente(c.v, c.p) ? `Primeiro encontro com ${c.p.nome}` : `Marcar o primeiro encontro com ${c.p.nome}`;
      if (parceriaAtiva(c) && ja >= 4) return romanceAdolescente(c.v, c.p) ? 'Manter o cinema de sábado' : 'Manter as saídas só de vocês';
      return romanceAdolescente(c.v, c.p) ? 'Ir ao cinema juntos' : c.papel === 'caso' ? `Encontrar ${c.p.nome}` : 'Sair só vocês dois';
    },
    executar: (c, r) => {
      const n = habito(c, 'sair');
      envolver(c, 6); afeto(c, 4); acalmar(c, 4); cuidou(c);
      if (c.papel === 'saindo' && n === 1) return primeiroEncontro(c, r);
      if (parceriaAtiva(c)) costume(c, n, 4, romanceAdolescente(c.v, c.p) ? 'O cinema de sábado era de vocês.' : 'Mantiveram as saídas só de vocês dois, mesmo com a vida corrida.');
      return { resultado: variar(n, romanceAdolescente(c.v, c.p)
        ? ['Pipoca grande, filme ruim, e a melhor tarde do mês.', 'Andaram pelo shopping sem comprar nada, conversando.']
        : c.papel === 'caso' ? ['Um encontro de duas horas num lugar onde ninguém conhece vocês.', 'Hotel no centro, celular desligado, volta separados.']
          : ['Um jantar sem pressa, sem celular, só vocês.', 'Um bar novo, uma mesa na calçada, e a conversa de quando se conheceram.', 'Saíram para dançar como não faziam há anos.', 'Um fim de semana fora, só os dois.']) };
    }
  },
  {
    id: 'carinho',
    quando: c => parceriaAtiva(c),
    rotulo: c => (romanceAdolescente(c.v, c.p) ? 'Mandar mensagem só para dizer que lembrou' : 'Demonstrar carinho'),
    executar: c => {
      const n = habito(c, 'carinho');
      envolver(c, 3); confiar(c, 2); acalmar(c, 3); cuidou(c);
      costume(c, n, 5, 'Os pequenos carinhos do dia a dia nunca sumiram.');
      return { resultado: variar(n, [`Um bilhete no espelho do banheiro. ${c.p.nome} guardou.`, `Você levou café na cama, num dia qualquer. ${c.p.nome} desconfiou e depois riu.`, `Um abraço demorado na cozinha, sem motivo.`, `Você lembrou de uma coisa pequena que ${c.p.nome} tinha dito meses atrás.`]) };
    }
  },
  {
    id: 'intimidade',
    quando: c => parceriaAtiva(c) && c.eu >= 18 && c.ip >= 18 && c.casa,
    rotulo: () => 'Uma noite só de vocês',
    executar: c => {
      const n = habito(c, 'intimidade');
      envolver(c, 4); acalmar(c, 5); cuidou(c);
      return { resultado: variar(n, ['A casa quieta, a porta trancada, e ninguém com pressa.', 'Uma noite que lembrou o começo.']) };
    }
  },
  {
    id: 'relacao', variante: 'secundario',
    quando: c => parceriaAtiva(c) && (c.vin.tensao >= 30 || (c.vin.romance?.envolvimento ?? 50) < 50),
    rotulo: () => 'Conversar sobre a relação',
    executar: c => {
      const comp = compatibilidade(c.v, c.p);
      const rom = c.vin.romance!;
      const antes = c.vin.tensao;
      acalmar(c, 18 + comp * 10); envolver(c, 5); confiar(c, 3); cuidou(c);
      lembrarCom(c.v, c.p.id, 'Conversaram de verdade sobre a relação.', 'reconciliacao', 1);
      if (rom.envolvimento < 40) return { resultado: `${c.p.nome} disse, sem raiva, que se sente sozinh${o(c.p)} há meses. Foi a conversa mais sincera em muito tempo.` };
      if (antes >= 50) return { resultado: 'Falaram alto, depois baixo, depois nada. No fim, estavam do mesmo lado da mesa.' };
      return { resultado: `Vocês falaram do que andava incomodando. ${c.p.nome} ouviu; você também.` };
    }
  },
  {
    id: 'conhecer',
    quando: c => (c.papel === 'saindo' || (parceriaAtiva(c) && c.v.t - (c.vin.romance?.tInicio ?? c.vin.tInicio) < 36)) && descobertasPendentes(c).length > 0 && pertoOuEmCasa(c),
    prioridade: c => (c.papel === 'saindo' ? 1.5 : 0.5),
    rotulo: c => `Conhecer melhor ${c.p.nome}`,
    destaque: true,
    executar: c => {
      const d = descobertasPendentes(c)[0];
      habito(c, `conhecer:${d.id}`);
      const comp = compatibilidade(c.v, c.p);
      envolver(c, 3 + comp * 4); afeto(c, 3); confiar(c, 2); cuidou(c);
      lembrarCom(c.v, c.p.id, d.marco, 'descoberta', 1);
      return { resultado: d.texto + (comp < -0.2 ? ' Vocês descobriram também que discordam de muita coisa.' : comp > 0.35 ? ' Quanto mais conversam, mais parece que se conhecem há tempo.' : '') };
    }
  },
  {
    id: 'visitar_par', variante: 'principal',
    quando: c => (parceriaAtiva(c) || c.papel === 'saindo') && c.longe && !c.casa && c.eu >= 16,
    disponivel: c => (c.v.financas.conta >= custoViagem(c) ? PERMITIDO : bloqueio('requisito', `A viagem custa cerca de R$ ${custoViagem(c).toLocaleString('pt-BR')}.`)),
    rotulo: c => `Viajar para ver ${c.p.nome}`,
    executar: c => {
      const n = habito(c, 'visitar_par');
      c.v.financas.conta -= custoViagem(c);
      envolver(c, 9); afeto(c, 5); acalmar(c, 6); cuidou(c);
      costume(c, n, 3, 'As viagens para se ver viraram parte do namoro.');
      return { resultado: variar(n, [`Rodoviária de madrugada e ${c.p.nome} esperando no desembarque. O fim de semana passou rápido demais.`, `Três dias na cidade de ${c.p.nome}, conhecendo a vida ${dele(c.p)} de perto.`, `A despedida no domingo foi a parte difícil. A distância ficou mais curta por uns dias.`]) };
    }
  },
  {
    id: 'ligar_par',
    quando: c => (parceriaAtiva(c) || c.papel === 'saindo') && c.longe && !c.casa,
    rotulo: c => `Chamada de vídeo com ${c.p.nome} toda noite`,
    executar: c => {
      const n = habito(c, 'ligar_par');
      envolver(c, 4); acalmar(c, 3); cuidou(c);
      return { resultado: variar(n, [`Uma semana de chamadas até alguém dormir no meio da frase.`, `${c.p.nome} mostrou a casa nova pela câmera, cômodo por cômodo.`, `Vocês viram o mesmo filme ao mesmo tempo, cada um na sua cidade.`]) };
    }
  },
  {
    id: 'comemorar', variante: 'principal', destaque: true,
    quando: c => parceriaAtiva(c) && (aniversarioRedondo(c) > 0 || !!conquistaRecente(c.v)) && !c.v.fatos[`comemorou_${c.p.id}_${Math.floor(c.v.t / 12)}`] && pertoOuEmCasa(c),
    prioridade: () => 3,
    rotulo: c => (aniversarioRedondo(c) > 0 ? `Comemorar os ${aniversarioRedondo(c)} anos com ${c.p.nome}` : `Comemorar ${conquistaRecente(c.v)!} com ${c.p.nome}`),
    executar: c => {
      c.v.fatos[`comemorou_${c.p.id}_${Math.floor(c.v.t / 12)}`] = c.v.t;
      envolver(c, 7); afeto(c, 4); acalmar(c, 6); cuidou(c);
      const anos = aniversarioRedondo(c);
      if (anos > 0) {
        lembrarCom(c.v, c.p.id, `Comemoraram ${anos} anos juntos.`, 'ritual', anos >= 20 ? 3 : 2);
        return { resultado: anos >= 25 ? `${anos} anos. Reuniram quem importa; alguém lembrou do dia em que vocês se conheceram e todo mundo riu da mesma parte.` : anos >= 10 ? `${anos} anos juntos: um jantar no lugar de sempre e uma lista, meio de brincadeira, do que ainda querem fazer.` : `${anos} anos. Um bolo pequeno, uma foto torta, e a sensação de que foi ontem.` };
      }
      const o = conquistaRecente(c.v)!;
      lembrarCom(c.v, c.p.id, `Comemoraram juntos ${o}.`, 'apoio', 1);
      abalar(c.v, `comemorar com ${c.p.nome}`, 3, -2);
      return { resultado: `${c.p.nome} fez questão de comemorar ${o}. Pizza, vinho barato e um brinde meio sem jeito.` };
    }
  },
  {
    id: 'futuro_casal',
    quando: c => parceriaAtiva(c) && c.eu >= 18 && c.ip >= 18 && c.v.t - (c.vin.romance?.tInicio ?? c.vin.tInicio) >= 12 && !c.vin.historia.some(h => h.tipo === 'descoberta' && h.texto.startsWith('Conversaram sobre o futuro') && c.v.t - h.t < 48),
    rotulo: () => 'Conversar sobre o futuro',
    destaque: true,
    executar: c => {
      envolver(c, 3); confiar(c, 3); cuidou(c);
      const partes: string[] = [];
      const temFilhos = filhosDoCasal(c) > 0;
      const quer = c.p.querFilhos ?? 'talvez';
      if (!temFilhos) partes.push(quer === 'sim' ? `${capital(ele(c.p))} quer ter filhos — e perguntou de você.` : quer === 'nao' ? `${capital(ele(c.p))} foi honest${o(c.p)}: não se vê com filhos.` : `Sobre filhos, ${ele(c.p)} disse que ainda não sabe.`);
      const rom = c.vin.romance!;
      if (rom.estagio !== 'casamento') partes.push(rom.envolvimento >= 70 ? `${capital(ele(c.p))} deixou escapar que pensa em casar.` : `Casamento? ${capital(ele(c.p))} riu e mudou de assunto.`);
      if (c.p.renda > 0 && c.v.trabalho.atual) partes.push('Falaram de trabalho, de dinheiro, de onde querem estar daqui a dez anos.');
      else partes.push('Falaram de onde querem estar daqui a dez anos.');
      lembrarCom(c.v, c.p.id, `Conversaram sobre o futuro. ${partes[0]}`, 'descoberta', 1);
      return { resultado: partes.join(' ') };
    }
  },
  {
    id: 'dinheiro_casal',
    quando: c => parceriaAtiva(c) && c.casa && c.eu >= 18 && (c.v.financas.negativado || c.v.financas.conta < 0 || (c.v.fatos['aperto_desde'] !== undefined && c.v.t - (c.v.fatos['aperto_desde'] ?? 0) <= 12)),
    prioridade: () => 1.5,
    rotulo: c => `Sentar com ${c.p.nome} para falar de dinheiro`,
    destaque: true,
    executar: c => {
      const comp = compatibilidade(c.v, c.p);
      cuidou(c);
      if (comp > -0.1 || c.vin.confianca >= 60) {
        acalmar(c, 12); confiar(c, 4); envolver(c, 3);
        lembrarCom(c.v, c.p.id, 'Enfrentaram juntos um aperto de dinheiro.', 'apoio', 2);
        abalar(c.v, `dividir o aperto com ${c.p.nome}`, 1, -4);
        return { resultado: 'Planilha na mesa da cozinha, lista do que dá para cortar. Não fechou a conta, mas vocês ficaram do mesmo lado dela.' };
      }
      c.vin.tensao = clamp(c.vin.tensao + 8);
      lembrarCom(c.v, c.p.id, 'Brigaram por dinheiro.', 'conflito', 1);
      return { resultado: 'Virou briga: cada um lembrou o gasto do outro. A conta continuou sem fechar.' };
    }
  },
  {
    id: 'desculpas', variante: 'principal',
    quando: c => humano(c) && c.eu >= 8 && c.ip >= 6 && c.vin.tensao >= 45 && (parceriaAtiva(c) || ehDescendente(c.papel) || c.papel === 'genitor' || c.papel === 'irmao' || c.papel === 'amigo' || c.papel === 'amigo_proximo') && (!c.longe || c.casa),
    prioridade: () => 2,
    rotulo: c => `Pedir desculpas a ${c.p.nome}`,
    destaque: true,
    executar: c => {
      aplicarPersonalidade(c.v, 'acao:desculpas', { empatia: 1 });
      const confia = c.vin.confianca >= 45;
      acalmar(c, confia ? 26 : 14); confiar(c, confia ? 6 : 3); afeto(c, 2);
      if (c.vin.romance) envolver(c, 4);
      lembrarCom(c.v, c.p.id, 'Você pediu desculpas, e as coisas voltaram a andar.', 'reconciliacao', 1);
      return { resultado: confia ? `${c.p.nome} ouviu, ficou quiet${o(c.p)} um tempo e disse "tá bom". Não precisou de mais.` : `${c.p.nome} aceitou as desculpas — do jeito de quem ainda está esperando para ver.` };
    }
  },
  {
    id: 'contar_verdade', variante: 'perigo',
    quando: c => parceriaAtiva(c) && !!c.vin.romance?.segredo,
    rotulo: () => 'Contar a verdade sobre o caso',
    executar: (c, r) => {
      const outro = c.v.pessoas[c.vin.romance!.segredo!.pessoaId];
      const caso = outro && c.v.vinculos[outro.id];
      if (outro && caso?.romance && caso.romance.estagio !== 'ex') encerrarCaso(c.v, outro, caso);
      aplicarPersonalidade(c.v, 'acao:confessar', { coragem: 1 });
      const reacao = reacaoATraicao(c.v, r, c.p, c.vin, true);
      escrever(c.v, { texto: `Contou a ${c.p.nome} sobre o caso com ${outro?.nome ?? 'outra pessoa'}.${reacao === 'ficou' ? ` ${c.p.nome} ficou — mas a confiança não voltou inteira.` : ''}`, relevancia: 'marco', tema: 'amor', tom: 'ruim', escolha: true, pessoas: [c.p.id], evento: { tipo: 'traicao_descoberta', pessoaId: c.p.id, peso: 70 } });
      return { resultado: reacao === 'ficou' ? `${c.p.nome} chorou, gritou e não foi embora. Disse que vai tentar. Não prometeu nada.` : `${c.p.nome} ouviu até o fim. Depois pegou a chave do carro e saiu.` };
    }
  },
  {
    id: 'planejar_filhos',
    quando: c => parceriaAtiva(c) && c.eu >= 18 && c.ip >= 18 && !gestacaoEmCurso(c.v) && c.vin.romance!.planoFilhos !== 'tentando',
    // Decisão do casal que não deve ficar escondida atrás de "Mais".
    prioridade: c => (filhosDoCasal(c) === 0 && c.eu <= 45 ? 0.8 : 0.3),
    disponivel: c => {
      if (!c.v.corpo.podeGestar && c.p.genero !== 'feminino') return bloqueio('impossivel', 'Vocês dois não podem gestar. A adoção é um caminho.');
      return PERMITIDO;
    },
    rotulo: () => 'Conversar sobre ter um filho',
    executar: c => {
      const rom = c.vin.romance!;
      cuidou(c);
      const quer = c.p.querFilhos ?? 'talvez';
      if (quer === 'nao' || (quer === 'talvez' && rom.envolvimento < 65)) {
        c.vin.tensao = clamp(c.vin.tensao + 15);
        lembrarCom(c.v, c.p.id, `Conversaram sobre filhos; ${c.p.nome} não quis${quer === 'talvez' ? ' naquele momento' : ''}.`, 'conflito', 1);
        return { resultado: `${c.p.nome} não quer ter filhos${quer === 'talvez' ? ' agora' : ''}. A conversa terminou tensa.` };
      }
      rom.planoFilhos = 'tentando';
      const deNovo = c.vin.historia.some(h => h.tipo === 'filho');
      escrever(c.v, { texto: deNovo ? `Decidiu com ${c.p.nome} tentar de novo.` : `Decidiu com ${c.p.nome} tentar ter um filho.`, relevancia: deNovo ? 'cotidiano' : 'biografia', tema: 'filhos', escolha: true, pessoas: [c.p.id] });
      if (!deNovo) lembrarCom(c.v, c.p.id, 'Decidiram tentar ter um filho.', 'filho', 2);
      return { resultado: `${c.p.nome} topou. Vocês começaram a tentar.` };
    }
  },
  {
    id: 'evitar_filhos', variante: 'discreto',
    quando: c => parceriaAtiva(c) && c.vin.romance!.planoFilhos === 'tentando' && !gestacaoEmCurso(c.v),
    rotulo: () => 'Combinar de esperar mais',
    executar: c => {
      c.vin.romance!.planoFilhos = 'evitando';
      if (c.p.querFilhos === 'sim') c.vin.tensao = clamp(c.vin.tensao + 8);
      return { resultado: 'Vocês combinaram esperar. Por agora.' };
    }
  },
  {
    id: 'morar_junto',
    quando: c => parceriaAtiva(c) && c.vin.romance!.estagio === 'namoro',
    disponivel: c => {
      if (c.eu < 18 || c.ip < 18) return bloqueio('ilegal', 'Os dois precisam ser maiores de idade.');
      if (c.v.t - c.vin.romance!.tEstagio < 12) return bloqueio('requisito', 'Namoram há pouco tempo.');
      return PERMITIDO;
    },
    rotulo: () => 'Propor morar junto',
    executar: (c, r) => {
      const rom = c.vin.romance!;
      if (r.chance(clamp((rom.envolvimento - 35) / 40, 0.05, 0.95))) {
        mudarEstagio(c.v, c.vin, 'morando_junto');
        morarJuntos(c.v, c.p);
        escrever(c.v, { texto: `Foi morar com ${c.p.nome}.`, relevancia: 'marco', tema: 'amor', tom: 'bom', escolha: true, pessoas: [c.p.id], evento: { tipo: 'uniao', pessoaId: c.p.id, peso: 55 } });
        lembrarCom(c.v, c.p.id, 'Foram morar juntos.', 'casa', 3);
        return { resultado: `${c.p.nome} topou. A primeira compra da casa nova foi um jogo de panelas.` };
      }
      envolver(c, -6);
      return { resultado: `${c.p.nome} achou cedo demais.` };
    }
  },
  {
    id: 'pedir_casamento',
    quando: c => parceriaAtiva(c) && c.vin.romance!.estagio !== 'casamento',
    disponivel: c => {
      if (c.eu < 18 || c.ip < 18) return bloqueio('ilegal', 'Casamento exige maioridade (16 com autorização dos pais, na lei; no jogo, 18).');
      if (c.v.t - (c.vin.romance!.tInicio ?? c.vin.tInicio) < 18) return bloqueio('requisito', 'Estão juntos há pouco tempo.');
      if (c.v.fatos[`noivado_${c.p.id}`] !== undefined) return bloqueio('incompativel', 'Vocês já estão noivos.');
      return PERMITIDO;
    },
    rotulo: () => 'Pedir em casamento',
    executar: (c, r) => {
      const rom = c.vin.romance!;
      if (r.chance(clamp((rom.envolvimento - 40) / 35, 0.05, 0.95))) {
        marcarFato(c.v, `noivado_${c.p.id}`);
        escrever(c.v, { texto: `Pediu ${c.p.nome} em casamento. A resposta foi sim.`, relevancia: 'marco', tema: 'amor', tom: 'bom', escolha: true, pessoas: [c.p.id] });
        lembrarCom(c.v, c.p.id, 'Ficaram noivos.', 'romance', 2);
        return { resultado: `Sim. ${c.p.nome} chorou, você chorou, o garçom bateu palmas.` };
      }
      envolver(c, -15);
      c.vin.tensao = clamp(c.vin.tensao + 25);
      escrever(c.v, { texto: `Pediu ${c.p.nome} em casamento e ouviu um não.`, relevancia: 'biografia', tema: 'amor', tom: 'ruim', escolha: true, pessoas: [c.p.id] });
      return { resultado: `${c.p.nome} ficou em silêncio por muito tempo. Depois disse que não.` };
    }
  },
  {
    id: 'terminar', variante: 'perigo',
    quando: c => parceriaAtiva(c) || c.papel === 'saindo',
    rotulo: c => (c.vin.romance?.estagio === 'casamento' ? 'Pedir o divórcio' : c.vin.romance?.estagio === 'morando_junto' ? 'Separar' : 'Terminar'),
    executar: c => {
      aplicarPersonalidade(c.v, 'acao:terminar', { independencia: 1 });
      terminar(c.v, c.p, c.vin, 'jogador');
      return { resultado: `Acabou com ${c.p.nome}.` };
    }
  },

  /* ================================================================== BICHOS */
  {
    id: 'passear', variante: 'principal',
    quando: c => !!c.p.especie && c.casa,
    disponivel: c => (c.eu < 3 ? bloqueio('impossivel', 'Ainda muito pequeno.') : PERMITIDO),
    // Cada bicho tem o próprio jeito de conviver: passear, brincar, soltar na sala, cuidar do aquário, dar banho de sol.
    rotulo: c => `${animal(c.p.especie).interacao.rotulo} ${c.p.nome}`,
    executar: c => {
      const n = habito(c, 'passear');
      const a = animal(c.p.especie);
      afeto(c, a.grupo === 'peixe' ? 3 : a.grupo === 'reptil' ? 4 : 8);
      const extra = c.p.especie === 'cachorro' ? [`Longo passeio com ${c.p.nome}. Voltaram os dois cansados.`, `${c.p.nome} achou um graveto maior do que ${dele(c.p)} e não largou.`] : [];
      return { resultado: variar(n, [...a.interacao.textos.map(t => t.replace(/\{nome\}/g, c.p.nome)), ...extra]) };
    }
  }
];

/* ------------------------------------------------------- Rótulos e frases */

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const INTERESSES = ['desenho', 'futebol', 'música', 'ciências', 'dança', 'leitura', 'xadrez', 'natação'];
export function interesseDe(p: Pessoa): string {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return INTERESSES[h % INTERESSES.length];
}

function rotuloTempo(c: CtxI): string {
  const { papel, eu, p } = c;
  if (papel === 'genitor' || papel === 'avo') {
    if (eu <= 5) return `Pedir colo e história para ${p.nome}`;
    if (eu <= 12) return `Passar a tarde com ${p.nome}`;
    if (eu <= 17) return `Fazer alguma coisa com ${p.nome}`;
    return c.casa ? `Passar um tempo com ${p.nome}` : `Visitar ${p.nome}`;
  }
  if (papel === 'filho' || papel === 'neto') return c.casa ? (c.fase === 'adolescente' ? `Fazer um programa com ${p.nome}` : `Passar um tempo com ${p.nome}`) : `Almoçar com ${p.nome}`;
  if (papel === 'colega') return c.vin.convivio.includes('trabalho') ? `Chamar ${p.nome} para um café` : c.vin.convivio.includes('escola') ? `Chamar ${p.nome} para fazer o trabalho junto` : `Puxar conversa com ${p.nome}`;
  if (papel === 'conhecido') return `Puxar conversa com ${p.nome}`;
  if (papel === 'amigo' || papel === 'amigo_proximo') return eu <= 12 ? `Brincar com ${p.nome}` : eu <= 17 ? `Encontrar ${p.nome} depois da aula` : `Encontrar ${p.nome}`;
  return 'Passar um tempo junto';
}

function frasesTempo(c: CtxI): string[] {
  const n = c.p.nome;
  if (c.papel === 'genitor' || c.papel === 'avo') {
    if (c.eu <= 5) return [`${n} contou a mesma história três vezes. Você pediu a quarta.`, `Colo, cafuné e desenho animado com ${n}.`];
    if (c.eu <= 12) return [`Uma tarde na cozinha com ${n}, aprendendo a fazer bolo.`, `Foram juntos à feira. Você carregou a sacola mais leve.`];
    if (c.eu <= 17) return [`Assistiram a um jogo juntos, xingando o juiz.`, `${n} te levou para dirigir num estacionamento vazio.`];
    return [`Almoço de domingo com ${n}. A mesma comida de sempre, do jeito de sempre.`, `Uma tarde com ${n} vendo fotos antigas.`, `${n} pediu ajuda para mexer no celular. Virou uma tarde inteira de conversa.`];
  }
  if (c.papel === 'filho' || c.papel === 'neto') {
    if (c.fase === 'adolescente') return [`${n} aceitou ir ao jogo com você. Vocês nem conversaram muito — não precisou.`, `Uma pizza e uma série, cada um num canto do sofá.`];
    return [`Almoço com ${n}, que agora pede a conta antes de você.`, `${n} contou do trabalho, das contas, dos planos. Você ouviu mais do que falou.`, `Uma tarde com ${n} consertando a pia — do jeito que você ensinou.`];
  }
  if (c.papel === 'colega' || c.papel === 'conhecido') return [`Um café com ${n} que durou mais que o intervalo.`, `Descobriram que moram perto e voltaram juntos.`];
  return [`Um dia inteiro com ${n}, sem pressa.`, `Saíram para comer e perderam a hora conversando.`, `Um fim de semana com ${n} que ficou na memória.`, `${n} apareceu sem avisar, com cerveja e fofoca.`];
}

/** Por quem a pessoa está de luto (quando se sabe). */
const quemSeFoi = (c: CtxI) => (c.p.aperto?.tipo === 'luto' && c.p.aperto.pessoaId ? c.v.pessoas[c.p.aperto.pessoaId] : undefined);
/** O jogador também perdeu essa pessoa (é um luto dos dois, não só dela). */
const perdaDividida = (c: CtxI) => { const x = quemSeFoi(c); return !!x && c.v.luto.some(l => l.pessoaId === x.id); };

function rotuloApoio(c: CtxI): string {
  const n = c.p.nome;
  switch (c.p.aperto!.tipo) {
    case 'desemprego': return `Estar com ${n} depois da demissão`;
    case 'separacao': return c.papel === 'filho' && c.ip < 18 ? `Explicar a separação para ${n}` : `Ficar do lado de ${n} na separação`;
    case 'doenca': return `Ficar com ${n} no hospital`;
    case 'luto': { const x = quemSeFoi(c); return x ? (perdaDividida(c) ? `Atravessar com ${n} o luto por ${x.nome}` : `Estar com ${n} no luto por ${x.nome}`) : `Estar com ${n} no luto`; }
    case 'dinheiro': return `Ajudar ${n} a colocar as contas em ordem`;
    default: return `Estar perto de ${n} nessa fase`;
  }
}

function textoApoio(c: CtxI): string {
  switch (c.p.aperto!.tipo) {
    case 'desemprego': return 'Você esteve lá quando perdeu o emprego.';
    case 'separacao': return 'Você esteve lá na separação.';
    case 'doenca': return 'Você esteve no hospital.';
    case 'luto': { const x = quemSeFoi(c); if (!x) return 'Você esteve lá no luto.'; if (perdaDividida(c)) return `Atravessaram juntos o luto por ${x.nome}.`; const l = lacoCom(c.v, c.p.id, x.id); return l ? `Você esteve lá quando ${ele(c.p)} perdeu ${oLaco(l, x.genero)}, ${x.nome}.` : `Você esteve lá no luto por ${x.nome}.`; }
    case 'dinheiro': return 'Você ajudou quando o dinheiro apertou.';
    default: return 'Você esteve perto numa fase difícil.';
  }
}

function resultadoApoio(c: CtxI): string {
  const n = c.p.nome;
  switch (c.p.aperto!.tipo) {
    case 'desemprego': return `Você revisou o currículo de ${n} e mandou para três conhecidos. ${capital(ele(c.p))} disse que era a primeira vez em semanas que alguém perguntava.`;
    case 'separacao': return c.papel === 'filho' && c.ip < 18 ? `Você explicou do jeito que deu. ${n} perguntou se a culpa era ${flex(c.p.genero, 'dele', 'dela', 'delu')}. Não era, e você disse isso muitas vezes.` : `Você ouviu ${n} falar da separação a noite inteira. Não precisou dizer nada.`;
    case 'doenca': return `Você passou a tarde no hospital com ${n}, revezando o controle da televisão.`;
    case 'luto': { const x = quemSeFoi(c); return x ? (perdaDividida(c) ? `Você e ${n} ficaram juntos com a falta de ${x.nome}. Às vezes em silêncio, às vezes falando ${flex(x.genero, 'dele', 'dela', 'delu')}.` : `Você ficou com ${n}. Às vezes em silêncio, às vezes deixando ${ele(c.p)} falar de ${x.nome}.`) : `Você ficou com ${n}. Às vezes em silêncio, às vezes falando de quem se foi.`; }
    case 'dinheiro': return `Sentaram com as contas na mesa. Não fechou, mas ficou mais claro.`;
    default: return `Você chamou ${n} para caminhar. Falaram de tudo e de nada.`;
  }
}

function precisaDeDinheiro(c: CtxI): boolean {
  if (c.p.aperto && (c.p.aperto.tipo === 'desemprego' || c.p.aperto.tipo === 'dinheiro') && c.v.t - c.p.aperto.t <= 24) return true;
  if ((ehDescendente(c.papel) || c.papel === 'genitor' || c.papel === 'irmao') && c.p.renda < 2200) return true;
  return false;
}

function custoViagem(c: CtxI): number {
  const uf = (id: string) => id.slice(-2);
  return uf(c.p.municipioId) === uf(c.v.moradia.municipioId) ? 300 : 1200;
}

function temFatoRecente(v: Vida, chave: string, meses: number): boolean {
  const t = v.fatos[chave];
  return t !== undefined && v.t - t <= meses;
}

/* --------------------------------------------------------- Convite (romance) */

function disponibilidadeConvite(c: CtxI): Veredito {
  // Solteiro: a idade decide se existe; o resto (orientação, compromisso) é a resposta da outra pessoa.
  if (!parceiro(c.v)) {
    const idadeV = regraDeIdade(c.eu, c.ip);
    if (idadeV.grau !== 'permitido') return idadeV;
    return { grau: 'permitido', motivo: idadeV.motivo };
  }
  if (!podeTerRomance(c.v, c.p, c.vin)) {
    const idadeV = regraDeIdade(c.eu, c.ip);
    if (idadeV.grau !== 'permitido') return idadeV;
    if (!atraiGenero(c.p.atracao, c.v.eu.genero)) return bloqueio('impossivel', `${c.p.nome} não se interessa por ${flex(ge(c.v), 'homens', 'mulheres', 'pessoas como você')}.`);
    if (c.p.parceiroId) return bloqueio('impossivel', `${c.p.nome} está com outra pessoa.`);
    return bloqueio('impossivel', 'Não vai rolar.');
  }
  return { grau: 'irregular', motivo: 'Você está num relacionamento. Seria traição.', chance: chanceConvite(c) };
}

export function chanceConvite(c: CtxI): number {
  const base = c.vin.romance?.envolvimento ?? interesseInicial(c.v, c.p);
  return clamp((base + c.vin.proximidade * 0.3 - 30) / 60, 0.05, 0.9);
}

/* -------------------------------------------------- Iniciativa romântica */

/**
 * A regra de quem pode receber uma iniciativa: idade graduada (ATT 1),
 * ninguém da família, o jogador sem parceria (com parceria, só o caminho
 * escondido do convite), e não logo depois de um "não" da mesma pessoa.
 * Orientação e compromisso da OUTRA pessoa: quem é próximo sabe (se ela
 * namora, por quem se interessa) — com essas pessoas a iniciativa nem
 * aparece. Com quem mal se conhece, não se sabe: a resposta é que diz.
 */
function iniciativaPossivel(c: CtxI): boolean {
  if (!humano(c) || c.vin.parentesco || !c.p.vivo) return false;
  if (!podeTentarIdade(c)) return false;
  if (parceiro(c.v)) return false;
  if (c.papel === 'parceiro' || c.papel === 'saindo' || c.papel === 'caso') return false;
  if (c.v.eu.atracao && !atraiGenero(c.v.eu.atracao, c.p.genero)) return false;
  if (c.p.parceiroId && c.vin.proximidade >= 35) return false;
  // Uma história de cada vez: saindo com alguém (ou esperando uma resposta), não se começa outra.
  if (Object.values(c.v.vinculos).some(x => x.pessoaId !== c.p.id && c.v.pessoas[x.pessoaId]?.vivo && x.romance && !x.romance.secreto && (x.romance.estagio === 'saindo' || x.romance.pediuTempo !== undefined))) return false;
  if (!atraiGenero(c.p.atracao, c.v.eu.genero) && c.vin.proximidade >= 55) return false;
  const recusa = c.v.fatos[`recusa_romance_${c.p.id}`];
  if (recusa !== undefined && c.v.t - recusa < 36) return false;
  return true;
}

const podeTentarIdade = (c: CtxI) => { const g = regraDeIdade(c.eu, c.ip).grau; return g === 'permitido' || g === 'improvavel'; };

/**
 * O quanto a outra pessoa quer o mesmo — do que existe entre vocês:
 * afinidade e aparência (`interesseInicial`), proximidade, confiança,
 * história, atrito e o momento dela. Um pouco de acaso por cima.
 */
export function interesseDoOutro(c: CtxI, r?: Rng): { valor: number; motivo?: 'orientacao' | 'compromisso' | 'momento' } {
  let x = Math.max(c.vin.romance?.envolvimento ?? 0, interesseInicial(c.v, c.p));
  x += c.vin.proximidade * 0.25 - 10;
  x += (c.vin.confianca - 50) * 0.12;
  x += Math.min(8, c.vin.historia.length * 1.2);
  x -= c.vin.tensao * 0.3;
  let motivo: 'orientacao' | 'compromisso' | 'momento' | undefined;
  if (c.p.aperto && c.v.t - c.p.aperto.t <= 18 && (c.p.aperto.tipo === 'separacao' || c.p.aperto.tipo === 'luto')) { x -= 12; motivo = 'momento'; }
  if (r) x += r.normal() * 6;
  if (!atraiGenero(c.p.atracao, c.v.eu.genero)) { x = Math.min(x, 28); motivo = 'orientacao'; }
  if (c.p.parceiroId) { x = Math.min(x, 24); motivo = 'compromisso'; }
  return { valor: clamp(Math.round(x)), motivo };
}

function recusar(c: CtxI): void {
  c.v.fatos[`recusa_romance_${c.p.id}`] = c.v.t;
  if (c.vin.romance?.estagio === 'interesse' || c.vin.romance?.estagio === 'ex') c.vin.romance = c.vin.romance.estagio === 'ex' ? c.vin.romance : undefined;
}

function motivoDoNao(c: CtxI, m?: 'orientacao' | 'compromisso' | 'momento'): string {
  if (m === 'compromisso') return ` ${capital(ele(c.p))} está com outra pessoa.`;
  if (m === 'orientacao') return ` ${capital(ele(c.p))} gosta de você — mas não desse jeito.`;
  if (m === 'momento') return ` Não é o momento: ${ele(c.p)} está atravessando ${c.p.aperto?.tipo === 'luto' ? 'um luto' : 'uma separação'}.`;
  return '';
}

function comecarASair(c: CtxI, envolvimento: number, marco: string, texto: string, peso = 1): Saida {
  const ex = c.vin.romance?.estagio === 'ex';
  mudarEstagio(c.v, c.vin, 'saindo');
  c.vin.romance!.envolvimento = Math.max(c.vin.romance!.envolvimento, envolvimento);
  c.vin.romance!.pediuTempo = undefined;
  escrever(c.v, { texto: ex ? `Voltou a sair com ${c.p.nome}.` : marco, relevancia: 'biografia', tema: 'amor', tom: 'bom', escolha: true, pessoas: [c.p.id], evento: { tipo: ex ? 'reconciliacao' : 'namoro', pessoaId: c.p.id, peso: 15 } });
  lembrarCom(c.v, c.p.id, ex ? 'Voltaram a sair.' : 'Começaram a sair.', 'romance', ex ? 2 : peso);
  abalar(c.v, `o sim de ${c.p.nome}`, 6, 0);
  return { resultado: texto, titulo: c.p.nome };
}

function flertar(c: CtxI, r: Rng): Saida {
  if (!c.v.eu.atracao) c.v.eu.atracao = c.p.genero === 'masculino' ? 'homens' : c.p.genero === 'feminino' ? 'mulheres' : 'ambos';
  const { valor, motivo } = interesseDoOutro(c, r);
  if (valor >= 55) {
    c.vin.romance = { estagio: 'interesse', tEstagio: c.v.t, envolvimento: Math.min(100, valor + 6) };
    afeto(c, 6);
    return { resultado: `${c.p.nome} retribuiu o olhar, riu das suas piadas — até das ruins. Ficou claro que tem alguma coisa ali.`, titulo: c.p.nome };
  }
  if (valor >= 40) {
    c.vin.romance = { estagio: 'interesse', tEstagio: c.v.t, envolvimento: valor + 3 };
    afeto(c, 3);
    return { resultado: `${c.p.nome} sorriu, conversou, e não deu para saber se entendeu a intenção. Talvez sim.`, titulo: c.p.nome };
  }
  if (valor < 25 && c.vin.convivio.includes('trabalho')) {
    c.vin.tensao = clamp(c.vin.tensao + 10); afeto(c, -6);
    c.v.fatos[`recusa_romance_${c.p.id}`] = c.v.t;
    return { resultado: `${c.p.nome} ficou sem graça e, nos dias seguintes, passou a manter distância no trabalho.${motivoDoNao(c, motivo)}`, titulo: c.p.nome };
  }
  c.v.fatos[`recusa_romance_${c.p.id}`] = c.v.t - 24; // um tempo curto: dá para tentar de novo mais adiante
  return { resultado: `${c.p.nome} não pareceu perceber — ou preferiu não perceber.${motivoDoNao(c, motivo)}`, titulo: c.p.nome };
}

function responderConvite(c: CtxI, r: Rng): Saida {
  const { valor, motivo } = interesseDoOutro(c, r);
  const jovem = c.eu < 18;
  if (valor >= 58) {
    return comecarASair(c, Math.max(50, valor), `Começou a sair com ${c.p.nome}.`, jovem ? `${c.p.nome} topou. Foram ao shopping e dividiram uma batata frita.` : `${c.p.nome} topou. Marcaram para sexta — e você passou a semana ensaiando o que dizer.`);
  }
  if (valor >= 48 && !motivo) {
    c.vin.romance = { ...(c.vin.romance ?? { tEstagio: c.v.t, envolvimento: valor }), estagio: 'interesse', tEstagio: c.v.t, envolvimento: valor, pediuTempo: c.v.t };
    lembrarCom(c.v, c.p.id, `Você chamou ${c.p.nome} para sair; ${ele(c.p)} pediu um tempo.`, 'romance', 1);
    return { resultado: `${c.p.nome} ficou vermelh${o(c.p)}, disse que gostou do convite — e que precisava pensar. Não foi um não.`, titulo: c.p.nome };
  }
  recusar(c);
  if (valor >= 36 || c.vin.confianca >= 55) {
    lembrarCom(c.v, c.p.id, `Você chamou ${c.p.nome} para sair; ${ele(c.p)} preferiu a amizade.`, 'romance', 1);
    abalar(c.v, `o não de ${c.p.nome}`, -4, 2);
    return { resultado: `${c.p.nome} agradeceu, com cuidado, e disse que prefere deixar as coisas como estão.${motivoDoNao(c, motivo)}`, titulo: c.p.nome };
  }
  c.vin.tensao = clamp(c.vin.tensao + 8); afeto(c, -5);
  abalar(c.v, `o não de ${c.p.nome}`, -5, 2);
  return { resultado: `${c.p.nome} disse que não, sem rodeio. Ficou um silêncio esquisito entre vocês.${motivoDoNao(c, motivo)}`, titulo: c.p.nome };
}

function declarar(c: CtxI, r: Rng): Saida {
  if (!c.v.eu.atracao) c.v.eu.atracao = c.p.genero === 'masculino' ? 'homens' : c.p.genero === 'feminino' ? 'mulheres' : 'ambos';
  aplicarPersonalidade(c.v, 'acao:declarar', { coragem: 1 });
  const { valor, motivo } = interesseDoOutro(c, r);
  const anos = Math.max(1, Math.floor((c.v.t - c.vin.tInicio) / 12));
  if (valor >= 60) {
    const s = comecarASair(c, Math.max(62, valor), `Da amizade de ${anos} ${anos === 1 ? 'ano' : 'anos'} com ${c.p.nome} nasceu outra coisa: começaram a sair.`,
      `${c.p.nome} ficou em silêncio um segundo e depois riu, nervos${o(c.p)}: "eu achava que era só eu".`, 3);
    lembrarCom(c.v, c.p.id, 'Da amizade, algo mais.', 'romance', 3);
    return s;
  }
  if (valor >= 50 && !motivo) {
    c.vin.romance = { estagio: 'interesse', tEstagio: c.v.t, envolvimento: valor, pediuTempo: c.v.t };
    lembrarCom(c.v, c.p.id, `Você disse o que sentia; ${c.p.nome} pediu um tempo para pensar.`, 'romance', 2);
    return { resultado: `${c.p.nome} não respondeu na hora. Disse que a amizade de vocês importa demais para responder sem pensar — e pediu um tempo.`, titulo: c.p.nome };
  }
  recusar(c);
  if (c.vin.confianca >= 60 || valor >= 38) {
    c.vin.tensao = clamp(c.vin.tensao + 5);
    lembrarCom(c.v, c.p.id, `Você disse o que sentia; ${c.p.nome} preferiu a amizade. A amizade ficou.`, 'romance', 2);
    abalar(c.v, `o não de ${c.p.nome}`, -6, 3);
    return { resultado: `${c.p.nome} segurou sua mão e disse, com todo o cuidado, que não sente o mesmo.${motivoDoNao(c, motivo)} Pediu para a amizade continuar. Por enquanto, está esquisito; depois, passa.`, titulo: c.p.nome };
  }
  c.vin.tensao = clamp(c.vin.tensao + 14); afeto(c, -12);
  if (c.vin.proximidade < 45 && c.vin.estagio === 'amigo_proximo') c.vin.estagio = 'amigo';
  lembrarCom(c.v, c.p.id, `Você disse o que sentia; ${c.p.nome} não sentia o mesmo, e a amizade esfriou.`, 'conflito', 2);
  abalar(c.v, `o não de ${c.p.nome}`, -8, 4);
  return { resultado: `${c.p.nome} ficou sem saber onde pôr as mãos. Disse que não, e nos dias seguintes as mensagens ficaram mais curtas.${motivoDoNao(c, motivo)}`, titulo: c.p.nome };
}

const LUGARES_ENCONTRO_JOVEM = ['uma sorveteria perto da escola', 'o cinema do shopping, filme escolhido às pressas', 'a praça, dividindo um açaí', 'uma festa junina da escola'];
const LUGARES_ENCONTRO = ['um bar pequeno onde a música deixava conversar', 'um restaurante japonês que nenhum dos dois conhecia', 'um show de uma banda que só um de vocês gostava', 'uma feira de domingo, andando sem pressa', 'um café que fechou antes de a conversa acabar'];

function primeiroEncontro(c: CtxI, r: Rng): Saida {
  const jovem = romanceAdolescente(c.v, c.p);
  const lugar = r.pick(jovem ? LUGARES_ENCONTRO_JOVEM : LUGARES_ENCONTRO);
  const comp = compatibilidade(c.v, c.p);
  envolver(c, comp * 8);
  lembrarCom(c.v, c.p.id, `O primeiro encontro: ${lugar}.`, 'romance', 2);
  const fim = comp > 0.3 ? 'Na volta, os dois já estavam marcando o próximo.' : comp < -0.2 ? 'Foi simpático — e um pouco longo demais. Nenhum dos dois sabe se vai ter outro.' : 'No fim, ficou aquela dúvida boa de quem quer ver de novo.';
  return { resultado: `O primeiro encontro foi em ${lugar}. ${fim}`, titulo: c.p.nome };
}

/** O que dá para descobrir sobre alguém convivendo (e ainda não foi descoberto). */
function descobertasPendentes(c: CtxI): { id: string; texto: string; marco: string }[] {
  const t = c.p.temperamento;
  const nome = c.p.nome;
  const todas: { id: string; texto: string; marco: string }[] = [];
  const ocup = c.p.ocupacao && c.p.ocupacao !== 'estudante' ? c.p.ocupacao : undefined;
  todas.push({ id: 'origem', texto: `${nome} contou da cidade onde cresceu, da família, de uma infância que você não imaginava.`, marco: `Descobriu de onde ${nome} veio.` });
  if (t.abertura > 0.3) todas.push({ id: 'curiosa', texto: `${nome} tem uma lista enorme de lugares para conhecer e de coisas para aprender. Falou disso com os olhos brilhando.`, marco: `Descobriu a curiosidade de ${nome}.` });
  else if (t.abertura < -0.3) todas.push({ id: 'rotina', texto: `${nome} gosta das coisas do jeito de sempre: o mesmo café, o mesmo caminho, a mesma série revista.`, marco: `Descobriu que ${nome} gosta de rotina.` });
  if (t.extroversao > 0.3) todas.push({ id: 'gente', texto: `${nome} conhece meio mundo e fica mais feliz no meio de gente.`, marco: `Descobriu que ${nome} vive no meio de gente.` });
  else if (t.extroversao < -0.3) todas.push({ id: 'quieta', texto: `${nome} é de pouca gente: poucos amigos, e para a vida toda.`, marco: `Descobriu que ${nome} é de poucos e bons.` });
  if (t.estabilidade < -0.3) todas.push({ id: 'ansiosa', texto: `${nome} carrega mais preocupação do que mostra. Contou isso baixinho, quase pedindo desculpa.`, marco: `Descobriu as preocupações de ${nome}.` });
  if (ocup) todas.push({ id: 'trabalho', texto: `${nome} explicou o que faz como ${ocup} — as partes boas e as que ninguém vê.`, marco: `Entendeu o trabalho de ${nome}.` });
  const feitas = new Set(Object.keys(c.vin.habitos ?? {}).filter(k => k.startsWith('conhecer:')).map(k => k.slice(9)));
  return todas.filter(d => !feitas.has(d.id)).slice(0, 3 - Math.min(3, feitas.size));
}

/** 5, 10, 15... anos juntos neste ano (0 se não é ano redondo). */
function aniversarioRedondo(c: CtxI): number {
  const ini = c.vin.romance?.tInicio ?? c.vin.tInicio;
  const anos = Math.floor((c.v.t - ini) / 12);
  return anos >= 5 && anos % 5 === 0 ? anos : 0;
}

/** Uma conquista do ano (abalo bom recente) que vale comemorar. */
function conquistaRecente(v: Vida): string | undefined {
  const a = [...(v.mente.abalos ?? [])].reverse().find(x => x.humor >= 5 && v.t - x.t <= 12 && !/^(o sim|comemorar|desabafar|os dias)/.test(x.texto));
  return a?.texto;
}

const filhosDoCasal = (c: CtxI) => Object.values(c.v.pessoas).filter(p => p.vivo && p.genitores?.includes('eu') && p.genitores.includes(c.p.id)).length;

/** O jogador está num momento em que desabafar faz sentido. */
function precisaDesabafar(v: Vida): boolean {
  if (v.mente.estresse >= 45 || v.mente.felicidade < 48) return true;
  if (v.luto.some(l => l.peso >= 25 && v.t - l.t <= 36)) return true;
  return (v.mente.abalos ?? []).some(a => (a.humor <= -6 || a.cabeca >= 8) && v.t - a.t <= 12);
}

/** Essa pessoa escuta: alguém próximo o bastante, e não uma criança. */
function ouve(c: CtxI): boolean {
  if (c.papel === 'parceiro') return true;
  if (c.papel === 'amigo_proximo') return true;
  if (c.papel === 'amigo' && c.vin.proximidade >= 55) return true;
  if ((c.papel === 'genitor' || c.papel === 'avo') && c.vin.proximidade >= 45) return true;
  if ((c.papel === 'irmao' || c.papel === 'filho') && c.ip >= 16 && c.vin.proximidade >= 55) return true;
  return false;
}

/* -------------------------------------------------------------- Interface */

const porId = new Map(INTERACOES.map(x => [x.id, x]));

const PESO_VARIANTE = { principal: 3, secundario: 2, discreto: 1, perigo: 0 } as const;

/**
 * As interações que fazem sentido com esta pessoa agora, da mais relevante
 * para a menos: a variante dá a base; o momento (um aniversário redondo, uma
 * briga, alguém em quem você anda pensando) sobe o que importa agora.
 */
export function interacoesPara(v: Vida, id: string): Interacao[] {
  const c = ctxPessoa(v, id);
  if (!c || !c.p.vivo) return [];
  const lista = INTERACOES.filter(x => x.quando(c));
  const rel = (x: Interacao) => (x.variante === 'perigo' ? -1 : PESO_VARIANTE[x.variante ?? 'secundario'] + (x.prioridade?.(c) ?? 0));
  return lista.map((x, k) => ({ x, k, r: rel(x) })).sort((a, b) => b.r - a.r || a.k - b.k).map(y => y.x);
}

const interacoesNoAno = (v: Vida) => v.anoAtual.acoes.filter(a => a.startsWith('pessoa:')).length;

export function disponibilidadeInteracao(v: Vida, id: string, interacao: string): Veredito {
  const c = ctxPessoa(v, id);
  if (!c || !c.p.vivo) return bloqueio('impossivel', 'Essa pessoa não está mais na sua vida.');
  const def = porId.get(interacao);
  if (!def || !def.quando(c)) return bloqueio('impossivel', 'Isso não faz sentido com essa pessoa agora.');
  if (interacoesNoAno(v) >= LIMITE_INTERACOES) return bloqueio('incompativel', 'O ano não tem mais tempo para isso. Avance o ano.');
  if (v.anoAtual.acoes.includes(`pessoa:${interacao}:${id}`)) return bloqueio('incompativel', 'Você já fez isso neste ano.');
  return def.disponivel ? def.disponivel(c) : PERMITIDO;
}

export function executarInteracao(v: Vida, r: Rng, id: string, interacao: string): Saida {
  const c = ctxPessoa(v, id)!;
  const def = porId.get(interacao)!;
  v.anoAtual.acoes.push(`pessoa:${interacao}:${id}`);
  c.vin.tUltimoContato = v.t;
  const out = def.executar(c, r);
  if (def.destaque && out.resultado && !out.titulo) out.titulo = c.p.nome;
  return out;
}

export const rotuloInteracao = (v: Vida, id: string, interacao: string) => {
  const c = ctxPessoa(v, id);
  const def = porId.get(interacao);
  return c && def ? def.rotulo(c) : interacao;
};
