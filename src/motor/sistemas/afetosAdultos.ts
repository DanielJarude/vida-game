/**
 * REWORK 11 · Fase H — A VIDA ADULTA DOS AFETOS (REL-11.2, REL-11.3, REL-11.4, REL-16).
 *
 *   INTIMIDADE   a noite a dois deixa de exigir morar junto: o namoro, o casamento e o caso (quem está nele consente),
 *                sempre entre dois adultos — e a outra pessoa pode dizer "hoje não" (o envolvimento, a tensão, o luto).
 *                Quando o par pode conceber, a proteção é escolha (com ou sem preservativo) e a gravidez é uma CHANCE
 *                da noite (`familia.conceberPorEncontro`), nunca automática. Os textos não descrevem nada.
 *   EX           o que se faz com quem já foi par, além de conversar e combinar os filhos: elogiar, mandar mensagem,
 *                pedir para tentar de novo, provocar, insultar, propor um encontro casual. A resposta é do ex — e lê
 *                como acabou (`Romance.porque`: quem terminou, se houve traição). Pode recusar, ignorar, bloquear.
 *                Uma vez por ano por pessoa (a regra geral) e esperas próprias depois de um não.
 *   POLIAMOR     num acordo de poliamor, o vínculo paralelo pode virar namoro — se a outra pessoa quiser E a parceria
 *                principal estiver de acordo agora (a reciprocidade). O principal continua sendo o de `parceiro()`.
 *   NOIVADO      desfazer o noivado é uma escolha possível (com o peso dela).
 *
 * Sorteios próprios (`rngDe`): nada aqui mexe no acaso do resto da vida.
 */

import { clamp, rngDe } from '../rng';
import type { Pessoa, Vida } from '../tipos';
import type { CtxI, Interacao } from './interacoes';
import { escrever, lembrarCom, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { flex } from '../texto';
import { acordoConsentido, atraiGenero, desfazerNoivado, estaNoivo, interesseInicial, mudarEstagio, romanceAdolescente } from './romance';
import { compatibilidade } from './social';
import { conceberPorEncontro, gestacaoEmCurso, podemConceber } from './familia';
import { abalar } from './abalo';

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const habito = (c: CtxI, id: string) => { const h = c.vin.habitos ?? (c.vin.habitos = {}); h[id] = (h[id] ?? 0) + 1; return h[id]; };
const variar = (n: number, xs: string[]) => xs[(n - 1) % xs.length];
const marcar = (v: Vida, k: string) => { v.fatos[k] = v.t; };
const recente = (v: Vida, k: string, meses: number) => v.fatos[k] !== undefined && v.t - v.fatos[k] < meses;

/* ============================================================ Intimidade (REL-11.2) */

/** Quem pode ter a noite a dois: a parceria e o caso (o paralelo consentido ou o escondido), os dois adultos, perto. */
function intimidadeCabe(c: CtxI): boolean {
  if (c.p.especie || c.vin.parentesco || c.eu < 18 || c.ip < 18 || romanceAdolescente(c.v, c.p)) return false;
  if (c.papel !== 'parceiro' && c.papel !== 'caso') return false;
  return c.casa || !c.longe;
}

/** A proteção é uma escolha quando há o que proteger: o par pode conceber e o casal não está tentando ter filho. */
const protecaoEmJogo = (c: CtxI) => podemConceber(c.v, c.p) && c.vin.romance?.planoFilhos !== 'tentando' && !gestacaoEmCurso(c.v);

/**
 * O consentimento da outra pessoa: depende do quanto ela está na relação, da tensão entre vocês e do momento dela (um
 * luto, uma separação recente). Determinístico na noite (`rngDe`): a mesma noite não muda de resposta.
 */
export function consenteIntimidade(c: CtxI): boolean {
  const rom = c.vin.romance;
  if (!rom) return false;
  const ap = c.p.aperto && !c.p.aperto.resolvido && c.v.t - c.p.aperto.t <= 6 && (c.p.aperto.tipo === 'luto' || c.p.aperto.tipo === 'doenca');
  const chance = clamp((rom.envolvimento - 25) / 40 - c.vin.tensao / 150 - (ap ? 0.35 : 0), 0.1, 0.97);
  return rngDe(c.v.id, 'intimidade', c.p.id, c.v.t).chance(chance);
}

function noite(c: CtxI, protegido: boolean): { resultado: string; titulo?: string } {
  const n = habito(c, 'intimidade');
  if (!consenteIntimidade(c)) {
    c.vin.tensao = clamp(c.vin.tensao - 2);
    return { resultado: `${c.p.nome} disse que hoje não — e você respeitou. Ficaram conversando até tarde.`, titulo: c.p.nome };
  }
  if (c.vin.romance) c.vin.romance.envolvimento = clamp(c.vin.romance.envolvimento + 4);
  c.vin.tensao = clamp(c.vin.tensao - 5);
  const emJogo = protecaoEmJogo(c);
  // A gravidez, se vier, é descoberta depois (`processarGestacoes`): a noite não anuncia nada.
  if (emJogo) conceberPorEncontro(c.v, rngDe(c.v.id, 'concepcao_noite', c.p.id, c.v.t), c.p, protegido);
  const paralelo = !!c.vin.romance?.paralelo;
  const escondido = !!c.vin.romance?.secreto;
  const frase = variar(n, escondido
    ? ['Um quarto de hotel, o celular desligado, a volta separada.', 'Pouco tempo, muito cuidado para ninguém ver.']
    : c.casa ? ['A casa quieta, a porta trancada, e ninguém com pressa.', 'Uma noite que lembrou o começo.']
      : [`Uma noite na casa de ${c.p.nome}, sem pressa de ir embora.`, 'Uma noite só de vocês dois.', 'Uma noite que lembrou o começo.']);
  const cuidado = emJogo ? (protegido ? ' Com preservativo.' : ' Sem proteção — e isso fica com vocês.') : '';
  const extra = paralelo ? ' Dentro do combinado.' : '';
  return { resultado: `${frase}${cuidado}${extra}`, titulo: c.p.nome };
}

/* ============================================================ Ex (REL-11.3) */

const exAtivo = (c: CtxI) => c.papel === 'ex' && !c.p.especie && c.vin.romance?.fim !== 'morte' && c.eu >= 16 && c.ip >= 16;
const exBloqueou = (c: CtxI) => recente(c.v, `ex_bloqueou_${c.p.id}`, 36);
const cortado = (c: CtxI) => c.vin.distancia !== undefined && c.v.t - c.vin.distancia < 60;
const exDisponivel = (c: CtxI) => exAtivo(c) && !cortado(c) && !exBloqueou(c);

/** O quanto o ex está aberto a você: o que sobrou da relação, o tempo, e como acabou (quem terminou, se houve traição). */
export function aberturaDoEx(c: CtxI): number {
  const por = c.vin.romance?.porque;
  let x = interesseInicial(c.v, c.p) * 0.4 + c.vin.proximidade * 0.35 + (c.vin.confianca - 50) * 0.3 - c.vin.tensao * 0.35;
  if (por?.quem === 'ela') x -= 8; // quem terminou foi o ex: já decidiu uma vez
  if (por?.motivo === 'traicao' && por.quem === 'ela') x -= 20; // o ex foi traído (a traição foi descoberta e ele saiu)
  if (c.p.parceiroId) x -= 18;
  const meses = c.v.t - (c.vin.romance?.tEstagio ?? c.v.t);
  if (meses < 6) x -= 10;
  return clamp(Math.round(x + 20));
}

/** A outra pessoa reage mal a provocação ou insulto: tensão, e às vezes o bloqueio (ela corta o contato). */
function reacaoNegativa(c: CtxI, peso: number, oque: string): string {
  c.vin.tensao = clamp(c.vin.tensao + peso);
  c.vin.confianca = clamp(c.vin.confianca - Math.round(peso / 3));
  c.vin.proximidade = clamp(c.vin.proximidade - Math.round(peso / 4));
  const r = rngDe(c.v.id, 'ex_reacao', c.p.id, c.v.t, oque);
  if (r.chance(clamp(0.25 + c.vin.tensao / 200 + (c.vin.romance?.porque?.motivo === 'traicao' ? 0.15 : 0), 0.2, 0.8))) {
    marcar(c.v, `ex_bloqueou_${c.p.id}`);
    c.vin.distancia = c.v.t;
    lembrarCom(c.v, c.p.id, `Depois ${oque}, ${c.p.nome} bloqueou você.`, 'distancia', 2);
    return ` ${cap(ele(c.p))} bloqueou seu número.`;
  }
  return ` ${cap(ele(c.p))} respondeu à altura — e a conversa morreu ali.`;
}

const INTERACOES_DE_EX: Interacao[] = [
  {
    id: 'ex_mensagem',
    quando: c => exDisponivel(c),
    rotulo: c => (c.longe ? `Ligar para ${c.p.nome}` : `Mandar uma mensagem para ${c.p.nome}`),
    executar: c => {
      const r = rngDe(c.v.id, 'ex_mensagem', c.p.id, c.v.t);
      if (!r.chance(clamp(aberturaDoEx(c) / 80, 0.1, 0.9))) return { resultado: `${c.p.nome} visualizou e não respondeu.` };
      c.vin.proximidade = clamp(c.vin.proximidade + 2); c.vin.tensao = clamp(c.vin.tensao - 3);
      return { resultado: `${c.p.nome} respondeu — curto, educado. "Tudo bem por aqui. E você?"` };
    }
  },
  {
    id: 'ex_elogiar',
    quando: c => exDisponivel(c) && c.vin.tensao < 60,
    rotulo: c => `Elogiar ${c.p.nome}`,
    executar: c => {
      const r = rngDe(c.v.id, 'ex_elogio', c.p.id, c.v.t);
      if (!r.chance(clamp(aberturaDoEx(c) / 75, 0.1, 0.9))) { c.vin.tensao = clamp(c.vin.tensao + 2); return { resultado: `${c.p.nome} agradeceu seco. Pareceu desconfiar da intenção.` }; }
      c.vin.proximidade = clamp(c.vin.proximidade + 3);
      return { resultado: `${c.p.nome} sorriu. "Você também está bem" — e mudou de assunto.` };
    }
  },
  {
    id: 'ex_reaproximar', variante: 'secundario', chance: true,
    quando: c => exDisponivel(c) && c.eu >= 16 && !parceiro(c.v) && (!c.v.eu.atracao || atraiGenero(c.v.eu.atracao, c.p.genero)),
    disponivel: c => {
      if (recente(c.v, `ex_reaprox_nao_${c.p.id}`, 24)) return bloqueio('incompativel', `${c.p.nome} já disse não a isso há pouco. Insistir agora seria pior.`);
      if (c.v.t - (c.vin.romance?.tEstagio ?? 0) < 6) return bloqueio('requisito', 'Acabou agora: cedo demais para pedir outra chance.');
      return { grau: 'improvavel', motivo: c.vin.romance?.porque?.motivo === 'traicao' ? 'Depois de uma traição, a resposta costuma ser não.' : 'A resposta é de quem já foi par — e pesa como acabou.', chance: clamp((aberturaDoEx(c) - 30) / 60, 0.03, 0.8) };
    },
    rotulo: c => `Pedir a ${c.p.nome} para tentarem de novo`,
    executar: c => {
      const r = rngDe(c.v.id, 'ex_reaprox', c.p.id, c.v.t);
      if (!r.chance(clamp((aberturaDoEx(c) - 30) / 60, 0.03, 0.8))) {
        marcar(c.v, `ex_reaprox_nao_${c.p.id}`);
        c.vin.tensao = clamp(c.vin.tensao + 5);
        abalar(c.v, `o não de ${c.p.nome}`, -4, 2);
        return { resultado: `${c.p.nome} ouviu até o fim e disse que não. ${c.vin.romance?.porque?.motivo === 'traicao' ? 'Algumas coisas não voltam.' : 'O que acabou, acabou.'}` };
      }
      mudarEstagio(c.v, c.vin, 'saindo');
      c.vin.romance!.envolvimento = Math.max(c.vin.romance!.envolvimento, 55);
      escrever(c.v, { texto: `Voltou a sair com ${c.p.nome}.`, relevancia: 'biografia', tema: 'amor', tom: 'bom', escolha: true, pessoas: [c.p.id], evento: { tipo: 'reconciliacao', pessoaId: c.p.id, peso: 15 } });
      lembrarCom(c.v, c.p.id, 'Resolveram tentar de novo.', 'reconciliacao', 2);
      return { resultado: `${c.p.nome} demorou a responder. Depois disse: "devagar". Voltaram a sair.` };
    }
  },
  {
    id: 'ex_encontro_casual', variante: 'discreto', chance: true,
    quando: c => exDisponivel(c) && c.eu >= 18 && c.ip >= 18 && !parceiro(c.v) && (!c.v.eu.atracao || atraiGenero(c.v.eu.atracao, c.p.genero)),
    disponivel: c => (recente(c.v, `ex_casual_nao_${c.p.id}`, 12) ? bloqueio('incompativel', `${c.p.nome} disse não há pouco.`) : { grau: 'improvavel', motivo: 'Só se os dois quiserem — sem voltar.', chance: clamp((aberturaDoEx(c) - 25) / 70, 0.03, 0.7) }),
    rotulo: c => `Propor a ${c.p.nome} um encontro, sem compromisso`,
    executar: c => {
      const r = rngDe(c.v.id, 'ex_casual', c.p.id, c.v.t);
      if (c.p.parceiroId || !r.chance(clamp((aberturaDoEx(c) - 25) / 70, 0.03, 0.7))) {
        marcar(c.v, `ex_casual_nao_${c.p.id}`);
        return { resultado: c.p.parceiroId ? `${c.p.nome} está com outra pessoa — e disse isso sem rodeio.` : `${c.p.nome} riu, sem graça, e disse que não. "Não faz bem para nenhum dos dois."` };
      }
      c.vin.proximidade = clamp(c.vin.proximidade + 3);
      if (podemConceber(c.v, c.p)) conceberPorEncontro(c.v, rngDe(c.v.id, 'concepcao_ex', c.p.id, c.v.t), c.p, true);
      lembrarCom(c.v, c.p.id, 'Um reencontro, sem voltar.', 'romance', 1);
      return { resultado: `Os dois quiseram. Uma noite, com cuidado${podemConceber(c.v, c.p) ? ' (e preservativo)' : ''}, e cada um para a sua casa — sem promessa.` };
    }
  },
  {
    id: 'ex_provocar', variante: 'perigo',
    quando: c => exDisponivel(c),
    rotulo: c => `Mandar uma indireta para ${c.p.nome}`,
    executar: c => ({ resultado: `Você mandou a mensagem — daquelas que se escrevem para doer.${reacaoNegativa(c, 12, 'da indireta')}` })
  },
  {
    id: 'ex_insultar', variante: 'perigo',
    quando: c => exDisponivel(c) && c.vin.tensao >= 20,
    rotulo: c => `Xingar ${c.p.nome}`,
    executar: c => {
      c.v.fatos[`ofendeu_${c.p.id}`] = c.v.t;
      return { resultado: `Você disse o que guardava, do pior jeito.${reacaoNegativa(c, 22, 'dos xingamentos')}` };
    }
  }
];

/* ============================================================ Poliamor (REL-11.4) e noivado (REL-16) */

/** A parceria principal está de acordo AGORA com um segundo namoro (o acordo existe e a relação não está em crise). */
export function principalConsente(v: Vida): Veredito {
  const par = parceiro(v);
  if (!par || par.vin.romance?.acordo !== 'poliamor') return bloqueio('incompativel', 'Um segundo namoro só com o acordo de poliamor da sua parceria.');
  if (par.vin.tensao >= 50 || (par.vin.romance.envolvimento ?? 50) < 40) return bloqueio('incompativel', `${par.p.nome} não está de acordo agora: as coisas entre vocês não andam bem.`);
  return PERMITIDO;
}

const INTERACOES_DE_POLIAMOR: Interacao[] = [
  {
    id: 'namorar_paralelo', variante: 'principal', chance: true,
    quando: c => c.papel === 'caso' && !!c.vin.romance?.paralelo && c.vin.romance.estagio === 'saindo' && acordoConsentido(parceiro(c.v)?.vin.romance),
    disponivel: c => {
      const ok = principalConsente(c.v);
      if (ok.grau !== 'permitido') return ok;
      if (c.v.t - c.vin.romance!.tEstagio < 3) return bloqueio('requisito', 'Cedo demais.');
      return { grau: 'improvavel', motivo: `Os três precisam querer: ${parceiro(c.v)!.p.nome} está de acordo; a resposta agora é de ${c.p.nome}.`, chance: chanceParalelo(c) };
    },
    rotulo: c => `Pedir ${c.p.nome} em namoro (poliamor)`,
    executar: c => {
      const par = parceiro(c.v)!;
      if (!rngDe(c.v.id, 'namoro_paralelo', c.p.id, c.v.t).chance(chanceParalelo(c))) {
        c.vin.romance!.envolvimento = clamp(c.vin.romance!.envolvimento - 6);
        return { resultado: `${c.p.nome} gosta de você — e disse que não quer ser a segunda relação de ninguém. Continuam como estão.` };
      }
      mudarEstagio(c.v, c.vin, 'namoro');
      lembrarCom(c.v, c.p.id, 'Começaram a namorar — com todo mundo sabendo.', 'romance', 3);
      lembrarCom(c.v, par.p.id, `Esteve de acordo com o seu namoro com ${c.p.nome}.`, 'romance', 1);
      escrever(c.v, { texto: `Começou a namorar ${c.p.nome}, com o acordo de ${par.p.nome}.`, relevancia: 'biografia', tema: 'amor', tom: 'bom', escolha: true, pessoas: [c.p.id, par.p.id] });
      return { resultado: `${c.p.nome} disse sim, e quis conhecer ${par.p.nome} antes de qualquer coisa. A casa e a vida com ${par.p.nome} seguem as mesmas.` };
    }
  },
  {
    id: 'desfazer_noivado', variante: 'perigo',
    quando: c => c.papel === 'parceiro' && estaNoivo(c.v, c.vin),
    rotulo: c => `Desfazer o noivado com ${c.p.nome}`,
    executar: c => {
      desfazerNoivado(c.v, c.vin);
      c.vin.tensao = clamp(c.vin.tensao + 25);
      if (c.vin.romance) c.vin.romance.envolvimento = clamp(c.vin.romance.envolvimento - 15);
      lembrarCom(c.v, c.p.id, 'Você desfez o noivado.', 'conflito', 2);
      escrever(c.v, { texto: `Desfez o noivado com ${c.p.nome}.`, relevancia: 'biografia', tema: 'amor', tom: 'ruim', escolha: true, pessoas: [c.p.id] });
      return { resultado: `${c.p.nome} tirou a aliança devagar. A relação continua — o casamento, não por enquanto.` };
    }
  }
];

/** A outra pessoa aceita ser o segundo vínculo (o envolvimento dela, a abertura, a afinidade). */
function chanceParalelo(c: CtxI): number {
  const rom = c.vin.romance;
  return clamp(((rom?.envolvimento ?? 50) - 40) / 50 + c.p.temperamento.abertura * 0.2 + compatibilidade(c.v, c.p) * 0.1, 0.05, 0.85);
}

/* ============================================================ O catálogo */

export const INTERACOES_ADULTAS: Interacao[] = [
  {
    id: 'intimidade',
    quando: c => intimidadeCabe(c),
    rotulo: c => (protecaoEmJogo(c) ? 'Uma noite só de vocês (com preservativo)' : 'Uma noite só de vocês'),
    executar: c => noite(c, true)
  },
  {
    id: 'intimidade_sem_protecao', variante: 'discreto',
    quando: c => intimidadeCabe(c) && protecaoEmJogo(c),
    disponivel: () => ({ grau: 'permitido', motivo: 'Sem proteção, uma gravidez pode acontecer.' }),
    rotulo: () => 'Uma noite só de vocês, sem preservativo',
    executar: c => noite(c, false)
  },
  ...INTERACOES_DE_EX,
  ...INTERACOES_DE_POLIAMOR
];

export const GRUPOS_ADULTOS = {
  intimidade: 'afeto', intimidade_sem_protecao: 'afeto',
  ex_mensagem: 'conversar', ex_elogiar: 'conversar', ex_reaproximar: 'romance', ex_encontro_casual: 'romance', ex_provocar: 'confrontar', ex_insultar: 'confrontar',
  namorar_paralelo: 'romance', desfazer_noivado: 'decisoes'
} as const;

void o;
