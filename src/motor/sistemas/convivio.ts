/**
 * REWORK 10 · Fase C — AS RELAÇÕES COMO HISTÓRIA ENTRE DUAS PESSOAS (REL-01/02/03, NPC-04, BAL-03).
 *
 * O que já existia continua (o laço em três números — proximidade, confiança, tensão —, o envolvimento do romance, a
 * história dos dois, o temperamento e a compatibilidade). Aqui entra o que faltava para uma relação ser vivida:
 *
 *   TEMPO      cada coisa feita com alguém gasta tempo do ano (uma conversa é um pedaço de tarde; uma viagem, uma
 *              semana) — e o ano tem as tardes que a semana deixa (`semana.encaixe`). Conversar não custa dinheiro;
 *              viajar custa os dois.
 *   PROGRAMAS  cinema, show, jantar, estádio, caminhada, cozinha e viagem deixam de ser a mesma conta: cada um tem o
 *              seu perfil (`PERFIS`): quanto arrisca, o que favorece (a conversa, a lembrança, a calma, o afeto) e para
 *              quem é (o gosto e o jeito da pessoa). E o convite pode ser recusado — com o motivo da pessoa.
 *   MARCOS     o sim do namoro, de morar junto, do noivado e do casamento aproxima de verdade (a barra sobe), na medida
 *              da relação que existia — e não apaga o que houve (a tensão, as traições, as brigas ficam). O não tem
 *              motivo (cedo, não sente o mesmo, as coisas estão ruins, não quer casar), e cada motivo deixa uma coisa
 *              diferente: desconforto, distância, uma conversa sobre expectativas — ou o fim.
 *   CONFLITO   criticar, ofender, acusar, exigir explicações, mentir, espalhar boato, desmarcar, ameaçar, intimidar,
 *              cortar relações — e partir para a briga física. A escada (desentendimento → discussão → conflito sério
 *              → ruptura ou agressão) depende do jeito dos dois, da história e de quem tenta acalmar. A agressão usa o
 *              corpo (`lesoes`), a saúde e a Justiça (`justica`) — nunca é vantagem.
 *   DEPOIS     o que se fez volta: a mentira pode ser descoberta, o segredo contado pode vazar, o boato chega na pessoa,
 *              a briga esfria — ou a pessoa se afasta, ou toma a iniciativa de fazer as pazes (`processarConvivio`).
 *
 * Nada disso vira número na tela: a ficha lê o laço em palavras e a história dos dois.
 */

import { firmarCompromisso } from './afetos';
import type { Rng } from '../rng';
import { clamp, hashMisturado, rngDe } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import type { CtxI, Interacao } from './interacoes';
import { escrever, idade, lembrarCom, marcarFato, parceiro, vinculosVivos } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { compatibilidade } from './social';
import { encaixe } from './semana';
import { discutir, estadoDaRelacao, romper } from './lacos';
import { machucarNaBriga } from './lesoes';
import { abalar } from './abalo';
import { flex, comPreposicao } from '../texto';
import { terminar } from './romance';
import { abrirProcesso } from './justica';
import { pagar, vereditoDePagar } from './dinheiro';
import { economiaLocal } from '../dados/lugares';
import { encerrarEmprego } from './trabalho';
import { mesmaCidade } from './vinculos';

/* ============================================================ O tempo do ano com as pessoas (BAL-03) */

/** Quanto tempo cada coisa toma, em tardes. O que não está aqui é uma conversa (um pedaço de tarde). */
const TEMPO: Record<string, number> = {
  // conversas e ligações: pouco tempo, nenhum dinheiro
  conversar: 0.25, perguntar_vida: 0.25, desabafar: 0.3, ligar: 0.1, ligar_par: 0.1, pedir_conselho: 0.25, aconselhar: 0.3, agradecer: 0.1,
  elogiar: 0.05, carinho: 0.1, contar_novidade: 0.15, compartilhar_segredo: 0.3, falar_futuro: 0.4, conversar_mudanca: 0.4, reconhecer_erro: 0.25,
  // programas: uma tarde (ou mais)
  cinema: 1, jantar_fora: 1, show: 1.2, estadio: 1, parque: 1, ensinar: 1, cozinhar_junto: 0.8, caminhar_junto: 0.6, tempo: 1, visitar: 1,
  sair_juntos: 1, treinar_junto: 0.8, jantar_romantico: 1, aniversario: 2, brincar: 0.5, ler: 0.25, passear: 0.3,
  fim_de_semana: 4, viajar_juntos: 8, feriado_juntos: 3, acompanhar_consulta: 1, organizar_encontro: 1.5, conhecer_familia: 1, visitar_par: 2,
  reconstruir_confianca: 1, reparar_dano: 1
};
export const tempoDa = (id: string) => TEMPO[id] ?? 0.25;
const PALAVRA_DO_TEMPO = (t: number) => (t >= 6 ? 'uma semana' : t >= 3 ? 'um fim de semana prolongado' : t >= 2 ? 'um fim de semana' : t >= 0.8 ? 'uma tarde' : 'um pouco de tempo');

/** As tardes livres do ano para as pessoas, pela semana que se tem (folgada: muitas; no teto: quase nenhuma). */
const TARDES = new WeakMap<Vida, { t: number; n: number }>();
export function tardesDoAno(v: Vida): number {
  // A ficha pergunta isto para cada ação: a semana é a mesma dentro da mesma vida (o mesmo objeto, o mesmo mês).
  const c = TARDES.get(v);
  if (c && c.t === v.t) return c.n;
  const n = tardesPelaSemana(v);
  TARDES.set(v, { t: v.t, n });
  return n;
}
function tardesPelaSemana(v: Vida): number {
  const f = encaixe(v, 0).faixa;
  const base = { folgada: 60, ocupada: 46, cheia: 32, sobrecarregada: 20, alem: 12 }[f];
  return idade(v) < 18 ? Math.round(base * 0.85) : base;
}
/** O que já foi gasto com as pessoas no ano (as respostas a um chamado não contam: quem gastou foi quem chamou). */
export function tardesUsadas(v: Vida): number {
  let soma = 0;
  for (const a of v.anoAtual.acoes) {
    if (!a.startsWith('pessoa:')) continue;
    const id = a.split(':')[1];
    if (id === 'chamado_sim' || id === 'chamado_nao') continue;
    soma += tempoDa(id);
  }
  return Math.round(soma * 100) / 100;
}
/** O tempo cabe no ano? Coisas curtas (uma conversa, uma ligação) sempre cabem. */
export function vereditoDeTempo(v: Vida, interacao: string): Veredito {
  const t = tempoDa(interacao);
  if (t < 0.5) return PERMITIDO;
  const sobra = tardesDoAno(v) - tardesUsadas(v);
  if (sobra >= t) return PERMITIDO;
  return bloqueio('incompativel', `Falta tempo: isso pede ${PALAVRA_DO_TEMPO(t)}, e o ano já foi gasto entre a semana e as outras pessoas. Uma conversa ou uma ligação ainda cabem.`);
}

/* ============================================================ O gosto de cada um (REL-01) */

const GOSTOS = ['desenho', 'futebol', 'música', 'ciências', 'dança', 'leitura', 'xadrez', 'natação', 'cinema', 'cozinha', 'viagem', 'natureza'];
/** Os dois gostos de uma pessoa: o primeiro é o mesmo de sempre (`interacoes.interesseDe`); o segundo, outro sorteio estável. */
export function gostosDe(p: Pessoa): [string, string] {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = GOSTOS[h % 8];
  const lista = GOSTOS.filter(x => x !== a);
  return [a, lista[Math.floor(hashMisturado(`${p.id}:gosto2`) * lista.length) % lista.length]];
}
const gosta = (p: Pessoa, g: string) => gostosDe(p).includes(g);

/**
 * O PERFIL DE CADA PROGRAMA: o risco (o quanto o resultado varia), a afinidade (para quem é: o gosto e o jeito da
 * pessoa) e o que ele favorece. O cinema é seguro e calmo (dá para não conversar); o show é uma aposta (ou vira a noite
 * da vida, ou um tédio para quem não gosta); o jantar é conversa (confiança); o estádio é de quem gosta de futebol; a
 * caminhada acalma; a cozinha é presença; a viagem é a lembrança grande — e o risco grande, se as coisas já estão tensas.
 */
export type FocoDoPrograma = 'calma' | 'memoria' | 'confianca' | 'afeto' | 'presenca' | 'romance';
export interface PerfilDePrograma { risco: number; foco: FocoDoPrograma; afinidade: (p: Pessoa) => number }
const ext = (p: Pessoa) => p.temperamento.extroversao;
export const PERFIS: Record<string, PerfilDePrograma> = {
  cinema: { risco: 0.55, foco: 'calma', afinidade: p => (gosta(p, 'cinema') ? 0.2 : 0) + (ext(p) < 0 ? 0.08 : 0) },
  show: { risco: 1.25, foco: 'memoria', afinidade: p => (gosta(p, 'música') || gosta(p, 'dança') ? 0.3 : -0.12) + ext(p) * 0.15 },
  jantar: { risco: 0.8, foco: 'confianca', afinidade: p => p.temperamento.afabilidade * 0.1 + (gosta(p, 'cozinha') ? 0.1 : 0) },
  estadio: { risco: 1, foco: 'afeto', afinidade: p => (gosta(p, 'futebol') ? 0.3 : -0.15) + ext(p) * 0.1 },
  caminhar: { risco: 0.5, foco: 'calma', afinidade: p => (gosta(p, 'natureza') ? 0.15 : 0) },
  cozinhar: { risco: 0.7, foco: 'presenca', afinidade: p => (gosta(p, 'cozinha') ? 0.2 : 0) },
  fim_de_semana: { risco: 1.1, foco: 'memoria', afinidade: p => (gosta(p, 'viagem') || gosta(p, 'natureza') ? 0.15 : 0) },
  viagem: { risco: 1.2, foco: 'memoria', afinidade: p => (gosta(p, 'viagem') ? 0.25 : 0) + p.temperamento.abertura * 0.1 },
  romantico: { risco: 0.9, foco: 'romance', afinidade: () => 0 }
};

/** O efeito de um programa pelo que ele favorece (a mesma régua de "como foi", com a dimensão que é a dele). */
export function efeitoDoPrograma(c: CtxI, foi: 'otimo' | 'bom' | 'morno' | 'ruim', base: number, foco: FocoDoPrograma, nomeDoPrograma: string): void {
  const vin = c.vin;
  const add = (k: 'proximidade' | 'confianca', n: number) => { vin[k] = clamp(Math.round(vin[k] + n)); };
  const calma = (n: number) => { vin.tensao = clamp(Math.round(vin.tensao - n)); };
  const env = (n: number) => { if (vin.romance) vin.romance.envolvimento = clamp(Math.round(vin.romance.envolvimento + n)); };
  if (foi === 'ruim') {
    vin.tensao = clamp(vin.tensao + (foco === 'memoria' ? 7 : 4));
    // A viagem ou o show que deram errado com as coisas já tensas viram briga de verdade (pequena).
    if (foco === 'memoria' && vin.tensao >= 40 && !vin.conflito) vin.conflito = { t: c.v.t, assunto: nomeDoPrograma, gravidade: 1, quem: 'outro' };
    return;
  }
  const k = foi === 'otimo' ? 1.5 : foi === 'bom' ? 1 : 0.35;
  switch (foco) {
    case 'calma': add('proximidade', base * 0.8 * k); calma(5 * k); break;
    case 'confianca': add('proximidade', base * 0.8 * k); add('confianca', 3 * k); calma(2 * k); break;
    case 'memoria':
      add('proximidade', base * 1.15 * k); env(3 * k);
      if (foi === 'otimo') lembrarCom(c.v, c.p.id, `${nomeDoPrograma.charAt(0).toUpperCase()}${nomeDoPrograma.slice(1)} que vocês não esquecem.`, 'ritual', 2);
      break;
    case 'afeto': add('proximidade', base * 1.1 * k); calma(k); break;
    case 'presenca': add('proximidade', base * 0.9 * k); vin.presenca = clamp(Math.round((vin.presenca ?? 30) + 5 * k)); break;
    case 'romance': add('proximidade', base * 0.9 * k); env(5 * k); break;
  }
}

/**
 * NPC-04 — o convite pode ser recusado: a pessoa tem a vida dela (filhos pequenos, um trabalho que toma tudo), o gosto
 * dela (quem não gosta de show diz não ao show) e o momento da relação (com a tensão alta, ninguém quer programa).
 * Sorteio próprio (`rngDe`): não mexe na sequência do ano. O não diz o motivo — e não custa nada.
 */
export function recusaDoConvite(c: CtxI, programa: string): string | undefined {
  const p = c.p;
  if (c.papel === 'filho' && c.ip < 14) return undefined; // criança vai junto
  const perfil = PERFIS[programa];
  const tensao = c.vin.tensao / 220;
  const ocupada = p.ocupacao && /médic|enfermeir|motorista|plantão|caminhoneir/i.test(p.ocupacao) ? 0.06 : 0;
  const gostoRuim = perfil ? Math.max(0, -perfil.afinidade(p)) * 0.6 : 0;
  const chance = clamp(0.05 + tensao + ocupada + gostoRuim - Math.max(0, c.vin.proximidade - 60) / 300, 0.02, 0.6);
  const r = rngDe(c.v.id, 'convite', programa, p.id, c.v.t);
  if (!r.chance(chance)) return undefined;
  if (gostoRuim > 0.05 && r.chance(0.6)) return `${p.nome} agradeceu, mas não é muito de ${programa === 'show' ? 'show' : programa === 'estadio' ? 'futebol' : 'programa assim'} — e disse com franqueza.`;
  if (c.vin.tensao >= 35) return `${p.nome} disse que não estava no clima. Com as coisas como estão entre vocês, um programa não resolve.`;
  if (ocupada) return `${p.nome} estava de plantão no único dia possível.`;
  return r.pick([`${p.nome} já tinha outro compromisso. Ficou para uma próxima.`, `${p.nome} estava cansad${flex(p.genero, 'o', 'a', 'e')} demais para sair.`, `${p.nome} topou e desmarcou na véspera — uma coisa de família.`]);
}

/* ============================================================ Os marcos afetivos (REL-02) */

export type MarcoAfetivo = 'namoro' | 'morar' | 'noivado' | 'casamento';
const BASE_DO_MARCO: Record<MarcoAfetivo, number> = { namoro: 12, morar: 9, noivado: 14, casamento: 16 };

/** Os problemas que a relação carrega (0..1): a tensão, as traições, as brigas sérias dos últimos anos, uma mentira descoberta. */
export function problemasDaRelacao(v: Vida, vin: Vinculo): number {
  const brigas = vin.historia.filter(h => h.tipo === 'conflito' && v.t - h.t <= 60).length;
  const traicoes = vin.historia.filter(h => h.tipo === 'traicao').length;
  const mentira = v.fatos[`mentira_descoberta_${vin.pessoaId}`] !== undefined && v.t - v.fatos[`mentira_descoberta_${vin.pessoaId}`] <= 60 ? 0.15 : 0;
  return clamp(vin.tensao / 100 + brigas * 0.08 + traicoes * 0.3 + mentira, 0, 1);
}

/**
 * O SIM: um compromisso novo aproxima de verdade — o afeto, a confiança, o envolvimento e o humor sobem, na medida do
 * que a relação já era (o tempo junto, o desejo da outra pessoa, a afinidade) e menos o que ela carrega. A tensão, as
 * traições e as brigas não somem: um casamento não apaga nada. Devolve uma frase quando o que pesa continua pesando.
 */
export function marcoAfetivo(v: Vida, p: Pessoa, vin: Vinculo, tipo: MarcoAfetivo): string | undefined {
  const rom = vin.romance;
  const desejo = (rom?.envolvimento ?? 50) / 100;
  const anos = Math.min(1, (v.t - (rom?.tInicio ?? vin.tInicio)) / 36);
  const afinidade = compatibilidade(v, p);
  const problemas = problemasDaRelacao(v, vin);
  const ganho = BASE_DO_MARCO[tipo] * (0.55 + 0.45 * desejo) * (0.8 + 0.2 * anos) * (1 + 0.2 * afinidade) * (1 - Math.min(0.7, problemas));
  vin.proximidade = clamp(Math.round(vin.proximidade + ganho));
  vin.confianca = clamp(Math.round(vin.confianca + ganho * 0.35 * (1 - problemas)));
  if (rom) rom.envolvimento = clamp(Math.round(rom.envolvimento + ganho * 0.5));
  v.mente.felicidade = clamp(Math.round(v.mente.felicidade + 3 + ganho * 0.4));
  marcarFato(v, `marco_${tipo}_${p.id}`);
  // REWORK 10.5 · REL-09: o marco firma o COMPROMISSO (o que amarra a vida) — a confiança continua a que foi construída.
  firmarCompromisso(vin, tipo);
  if (problemas >= 0.35) return tipo === 'casamento' || tipo === 'noivado'
    ? `O sim não apagou o que houve: ${vin.historia.some(h => h.tipo === 'traicao') ? 'a traição' : 'as brigas'} continua${vin.historia.some(h => h.tipo === 'traicao') ? '' : 'm'} entre vocês.`
    : 'O que andava pesando entre vocês continua lá.';
  return undefined;
}

/** NPC-04: há quem não queira casar (um traço estável, do jeito da pessoa e de um sorteio dela — não muda por insistência). */
export function naoQuerCasar(p: Pessoa): boolean {
  const t = p.temperamento;
  return hashMisturado(`${p.id}:casar`) < clamp(0.08 + t.abertura * 0.12 - t.responsabilidade * 0.1, 0.02, 0.3);
}

export type MotivoDoNao = 'cedo' | 'nao_sente' | 'momento_ruim' | 'nao_quer_casar' | 'casual';
/** Por que a pessoa disse não (o que ela diz é o que o estado da relação mostra). */
export function motivoDoNao(_v: Vida, p: Pessoa, vin: Vinculo, tipo: MarcoAfetivo): MotivoDoNao {
  const rom = vin.romance;
  if ((tipo === 'noivado' || tipo === 'casamento') && naoQuerCasar(p)) return 'nao_quer_casar';
  if (vin.tensao >= 40 || vin.conflito) return 'momento_ruim';
  if ((rom?.envolvimento ?? 50) < 45) return 'nao_sente';
  return 'cedo';
}

/**
 * O NÃO, com consequências diferentes para cada motivo. Fica guardado (`recusa_<tipo>_<id>`): o pedido não volta no mesmo
 * ano, e a ficha lembra o porquê. Repetido com quem não sente o mesmo, pode acabar a relação — a decisão é da outra pessoa.
 */
export function recusaAfetiva(v: Vida, p: Pessoa, vin: Vinculo, tipo: MarcoAfetivo): string {
  const m = motivoDoNao(v, p, vin, tipo);
  const chave = `recusa_${tipo}_${p.id}`;
  const vezes = (v.fatos[`vezes_${chave}`] ?? 0) + 1;
  v.fatos[chave] = v.t;
  v.fatos[`vezes_${chave}`] = vezes;
  v.fatos[`motivo_${chave}`] = ['cedo', 'nao_sente', 'momento_ruim', 'nao_quer_casar', 'casual'].indexOf(m);
  const rom = vin.romance;
  const env = (n: number) => { if (rom) rom.envolvimento = clamp(Math.round(rom.envolvimento + n)); };
  const ele = flex(p.genero, 'ele', 'ela', 'elu');
  const oque = tipo === 'namoro' ? 'namorar' : tipo === 'morar' ? 'morar junto' : 'casar';
  switch (m) {
    case 'cedo':
      env(-3); abalar(v, `o não de ${p.nome}`, -3, 3);
      lembrarCom(v, p.id, `Você quis ${oque}; ${p.nome} achou cedo.`, 'romance', 1);
      return `${p.nome} disse que gosta do que vocês têm — e que ainda é cedo para ${oque}. Sem drama: a frustração é sua, e passa.`;
    case 'nao_sente':
      env(-10); vin.proximidade = clamp(vin.proximidade - 6); abalar(v, `o não de ${p.nome}`, -7, 5);
      if (vezes >= 2 && (rom?.envolvimento ?? 50) < 32 && rom && rom.estagio !== 'ex') {
        terminar(v, p, vin, 'ela');
        return `Era a segunda vez. ${p.nome} disse, com cuidado, que não sente o mesmo — e que é melhor parar por aqui. Acabou.`;
      }
      lembrarCom(v, p.id, `${p.nome} disse não a ${oque}.`, 'distancia', 2);
      return `${p.nome} ficou quiet${flex(p.genero, 'o', 'a', 'e')} e disse que não sente o mesmo. Vocês continuam — um pouco mais longe.`;
    case 'momento_ruim':
      vin.tensao = clamp(vin.tensao + 6); vin.confianca = clamp(vin.confianca + 3); abalar(v, `o não de ${p.nome}`, -4, 4);
      lembrarCom(v, p.id, `Conversaram sobre o que cada um espera da relação.`, 'conflito', 2);
      return `${p.nome} disse que não com as coisas como estão entre vocês — e a conversa virou outra: o que cada um espera. Foi difícil, e foi franca.`;
    case 'nao_quer_casar':
      vin.tensao = clamp(vin.tensao + 8); abalar(v, `o não de ${p.nome}`, -6, 5);
      marcarFato(v, `nao_quer_casar_${p.id}`);
      lembrarCom(v, p.id, `${p.nome} disse que não quer casar — com ninguém.`, 'romance', 2);
      return `${p.nome} foi direto ao ponto: não é você — ${ele} não quer casar, nunca quis. Vocês seguem juntos; a pergunta é se isso basta.`;
    default:
      env(-8);
      return `${p.nome} disse que não quer isso agora.`;
  }
}

/** O pedido recusado há pouco não volta no mesmo ano (e a ficha lembra o porquê). */
export function vereditoDoPedido(v: Vida, p: Pessoa, tipo: MarcoAfetivo): Veredito {
  const t = v.fatos[`recusa_${tipo}_${p.id}`];
  const espera = tipo === 'namoro' ? 6 : 12;
  if (t !== undefined && v.t - t < espera) {
    const m = v.fatos[`motivo_recusa_${tipo}_${p.id}`];
    const porque = ['achou cedo', 'disse que não sente o mesmo', 'disse que não com as coisas como estão', 'disse que não quer casar', 'não quer isso agora'][m ?? 4];
    return bloqueio('incompativel', `${p.nome} ${porque} há pouco. Pedir de novo agora seria insistir.`);
  }
  if ((tipo === 'noivado' || tipo === 'casamento') && v.fatos[`nao_quer_casar_${p.id}`] !== undefined && v.t - v.fatos[`nao_quer_casar_${p.id}`] < 36)
    return bloqueio('incompativel', `${p.nome} já disse que não quer casar. Isso não muda de um ano para o outro.`);
  return PERMITIDO;
}

/* ============================================================ A escada do conflito (REL-03) */

export type DegrauDoConflito = 'acalmou' | 'desentendimento' | 'discussao' | 'conflito_serio' | 'ruptura' | 'agressao';

/**
 * Um ato negativo (`peso` 1..3) e a reação da outra pessoa. A escada sobe pelo peso do ato, pela tensão que já havia,
 * pelas brigas de antes e pelo jeito dos dois (a estabilidade e a afabilidade de quem recebe, a impulsividade de quem
 * faz) — e desce quando um dos dois acalma. A agressão física da outra pessoa é rara (quem tem pavio curto, já no limite)
 * e nunca acontece com criança, idoso frágil ou bicho.
 */
export function escalar(c: CtxI, peso: 1 | 2 | 3, assunto: string, r: Rng): DegrauDoConflito {
  const { v, p, vin } = c;
  const t = p.temperamento;
  const brigas = vin.historia.filter(h => h.tipo === 'conflito' && v.t - h.t <= 60).length;
  const pavio = clamp(0.25 + peso * 0.14 + vin.tensao / 250 + brigas * 0.05 - t.estabilidade * 0.18 - t.afabilidade * 0.12 + v.personalidade.tracos.impulsividade / 400, 0.03, 0.92);
  const x = r.next();
  let d: DegrauDoConflito = x > pavio + 0.25 ? 'acalmou' : x > pavio ? 'desentendimento' : x > pavio * 0.45 ? 'discussao' : 'conflito_serio';
  // Uma crítica (peso 1) num clima bom não vira conflito sério de uma vez: a escada sobe de degrau em degrau.
  if (d === 'conflito_serio' && peso === 1 && vin.tensao < 50 && !vin.conflito) d = 'discussao';
  if (d === 'conflito_serio' && !vin.parentesco && !vin.romance && vin.proximidade < 40 && r.chance(0.35)) d = 'ruptura';
  const podeBater = c.ip >= 14 && c.ip < 75 && !p.especie && c.eu >= 12;
  if (d === 'conflito_serio' && podeBater && t.estabilidade < -0.4 && t.afabilidade < -0.2 && vin.tensao >= 60 && r.chance(0.12)) d = 'agressao';
  const g: 1 | 2 | 3 = d === 'desentendimento' ? 1 : d === 'discussao' ? 2 : 3;
  if (d === 'acalmou') { vin.tensao = clamp(vin.tensao + peso * 2); return d; }
  vin.tensao = clamp(vin.tensao + 6 + g * 7 + peso * 3);
  vin.proximidade = clamp(vin.proximidade - 2 - g * 2);
  if (g >= 2) vin.confianca = clamp(vin.confianca - 2 - g * 2);
  if (!vin.conflito || vin.conflito.gravidade < g) vin.conflito = { t: v.t, assunto, gravidade: g, quem: 'eu' };
  if (g >= 2) lembrarCom(v, p.id, g === 3 ? `Um conflito sério por causa ${comPreposicao('de', assunto)}.` : `Discutiram por causa ${comPreposicao('de', assunto)}.`, 'conflito', g === 3 ? 3 : 2);
  if (d === 'ruptura') romper(v, p, vin, `Romperam depois de uma briga por causa ${comPreposicao('de', assunto)}.`, 'outro');
  // REWORK 10.5 · REL-10: a agressão da outra pessoa ACONTECE (antes, a escada dizia "partiu para cima de você" e nada
  // seguia: nenhuma lesão, nenhum registro — e o "cortar relações depois da agressão" nunca abria).
  if (d === 'agressao') {
    v.fatos[`agressao_dela_${p.id}`] = v.t;
    BRIGA.set(v, brigaFisica(c, r, 'outro').texto);
  }
  return d;
}
/** O desfecho da agressão que a escada acabou de produzir (a frase do degrau o conta). */
const BRIGA = new WeakMap<Vida, string>();

/** O que a escada virou, em palavras (para a resposta da ação). */
export function fraseDoDegrau(c: CtxI, d: DegrauDoConflito): string {
  const n = c.p.nome;
  const ele = flex(c.p.genero, 'ele', 'ela', 'elu');
  return {
    acalmou: `${n} respirou fundo e não entrou na briga. O clima ficou estranho — mas não passou disso.`,
    desentendimento: `${n} rebateu. Um desentendimento, desses que ficam no ar.`,
    discussao: `Virou discussão: vozes altas, coisas ditas que não se desdizem tão fácil.`,
    conflito_serio: `Virou um conflito sério. ${ele.charAt(0).toUpperCase() + ele.slice(1)} saiu batendo a porta.`,
    ruptura: `${n} disse que acabou. Não quer mais falar com você.`,
    agressao: BRIGA.get(c.v) ?? `${n} perdeu o controle e partiu para cima de você.`
  }[d];
}

/* ============================================================ A agressão física (REL-03 · Saúde e Justiça) */

export interface DesfechoDaBriga { texto: string; lesaoDela: 0 | 1 | 2 | 3; lesaoSua: 0 | 1 | 2 | 3; denuncia: boolean }

/**
 * Uma briga física. Quem bate não "ganha": o resultado depende do corpo dos dois e da sorte; a outra pessoa pode não se
 * machucar, sair com um hematoma, com um corte que pede pontos ou com uma fratura; você também (`lesoes.machucarNaBriga`,
 * que abre o cuidado: o atendimento, a recuperação). Depois: a relação (ruptura, o fim do casamento), a escola ou o
 * trabalho (suspensão, justa causa), a reputação entre os conhecidos e a Justiça (a denúncia — mais provável quanto pior
 * a lesão, em casa, ou com testemunhas — vira processo: `justica.abrirProcesso`).
 */
export function brigaFisica(c: CtxI, r: Rng, quemComecou: 'eu' | 'outro'): DesfechoDaBriga {
  const { v, p, vin } = c;
  const ip = c.ip;
  // O corpo de cada um: a forma (sua) contra a idade e a saúde (dela).
  const fragil = ip >= 65 || ip < 16 ? 0.25 : 0;
  const sorte = r.next() + (v.corpo.forma - 50) / 200 + fragil - (p.saude - 60) / 300;
  const lesaoDela: 0 | 1 | 2 | 3 = sorte > 1.05 ? 3 : sorte > 0.8 ? 2 : sorte > 0.45 ? 1 : 0;
  if (lesaoDela) {
    p.saude = clamp(p.saude - [0, 3, 8, 18][lesaoDela]);
    p.aperto = { tipo: 'doenca', t: v.t };
  }
  const minha = machucarNaBriga(v, r, quemComecou === 'outro' ? 2 : lesaoDela >= 2 ? 1 : 2);
  const lesaoSua = (minha ? minha.lesao?.gravidade ?? 1 : 0) as 0 | 1 | 2 | 3;
  // A relação: não sai inteira — e o tamanho do estrago acompanha o da briga (REWORK 10.5 · REL-10: antes, o mesmo
  // −25 de confiança para um empurrão e para uma fratura).
  const peso = Math.max(lesaoDela, lesaoSua);
  vin.tensao = clamp(Math.max(vin.tensao, 60 + peso * 10));
  // Quem partiu para a briga perde mais (a violência nunca sai barata para quem a começa).
  vin.confianca = clamp(vin.confianca - (quemComecou === 'eu' ? 20 + peso * 5 : 12 + peso * 6));
  vin.proximidade = clamp(vin.proximidade - 8 - peso * 4);
  // Quem apanhou fica com medo de quem bateu (a distância vira proteção, não birra).
  if (quemComecou === 'outro') { v.fatos[`medo_${p.id}`] = v.t; abalar(v, `o medo de ${p.nome}`, -4 - peso * 2, 6 + peso * 3); }
  vin.conflito = { t: v.t, assunto: 'a briga física', gravidade: 3, quem: quemComecou };
  lembrarCom(v, p.id, quemComecou === 'eu' ? 'O dia em que você partiu para a briga.' : `O dia em que ${p.nome} partiu para cima de você.`, 'conflito', 3);
  marcarFato(v, `agressao_${p.id}`);
  // A denúncia: quem apanhou e se machucou, em casa (violência doméstica), ou com gente olhando (escola, trabalho).
  const emCasa = vin.convivio.includes('casa') || vin.romance?.estagio === 'casamento' || vin.romance?.estagio === 'morando_junto';
  const testemunhas = vin.convivio.includes('escola') || vin.convivio.includes('trabalho') || vin.convivio.includes('faculdade');
  const chanceDenuncia = quemComecou === 'eu' ? clamp(0.15 + lesaoDela * 0.2 + (emCasa ? 0.3 : 0) + (testemunhas ? 0.15 : 0), 0.05, 0.92) : 0;
  const denuncia = rngDe(v.id, 'denuncia', p.id, v.t).chance(chanceDenuncia);
  const nomeLesao = ['sem um arranhão', 'com um hematoma', 'com um corte que pediu pontos', 'com uma fratura'][lesaoDela];
  const partes: string[] = [quemComecou === 'eu' ? `Você partiu para cima de ${p.nome}.` : `${p.nome} partiu para cima de você.`, `${p.nome} saiu ${nomeLesao}${lesaoSua ? '; você também não saiu inteir' + flex(v.eu.tratamento ?? v.eu.genero, 'o', 'a', 'e') : ''}.`];
  // Em casa, com a parceria: quem apanhou vai embora (quase sempre).
  if (vin.romance && vin.romance.estagio !== 'ex' && quemComecou === 'eu' && rngDe(v.id, 'agressao_fim', p.id, v.t).chance(0.85)) {
    terminar(v, p, vin, 'ela');
    marcarFato(v, `medida_protetiva_${p.id}`);
    partes.push(`${p.nome} foi embora — e pediu uma medida de proteção.`);
  } else if (!vin.parentesco && !vin.romance && quemComecou === 'eu') {
    romper(v, p, vin, 'A amizade acabou numa briga física.', 'outro');
  }
  // A escola e o trabalho.
  if (vin.convivio.includes('escola') && v.educacao.basica && idade(v) < 18) {
    v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - 8);
    for (const x of vinculosVivos(v).filter(y => (y.vin.parentesco === 'mae' || y.vin.parentesco === 'pai') && y.vin.convivio.includes('casa'))) x.vin.tensao = clamp(x.vin.tensao + 15);
    partes.push('A escola suspendeu você e chamou a família.');
    marcarFato(v, 'suspenso_por_briga');
  }
  if (vin.convivio.includes('trabalho') && v.trabalho.atual && quemComecou === 'eu' && rngDe(v.id, 'justa_causa', p.id, v.t).chance(0.65)) {
    encerrarEmprego(v, 'justa causa');
    partes.push('A empresa demitiu você por justa causa.');
  }
  // A reputação: os amigos em comum ficam sabendo.
  for (const x of vinculosVivos(v).filter(y => y.p.id !== p.id && !y.p.especie && (y.vin.convivio.some(cv => vin.convivio.includes(cv))) && y.vin.estagio !== 'rival').slice(0, 6)) x.vin.tensao = clamp(x.vin.tensao + 8);
  abalar(v, 'a briga física', -10, 14);
  escrever(v, { texto: `${quemComecou === 'eu' ? `Partiu para a briga com ${p.nome}` : `Brigou fisicamente com ${p.nome}`}: ${p.nome} saiu ${nomeLesao}.`, relevancia: 'marco', tema: vin.romance ? 'amor' : vin.parentesco ? 'familia' : 'amizade', tom: 'ruim', escolha: quemComecou === 'eu', pessoas: [p.id] });
  if (denuncia) {
    partes.push(`${p.nome} registrou a ocorrência.`);
    v.fatos['denuncia_agressao'] = v.t;
    abrirProcesso(v, r, 'violencia');
  }
  return { texto: partes.join(' '), lesaoDela, lesaoSua, denuncia };
}

/* ============================================================ As interações novas */

const humano = (c: CtxI) => !c.p.especie;
const perto = (c: CtxI) => c.casa || !c.longe;
const parceria = (c: CtxI) => c.papel === 'parceiro';
const proximo = (c: CtxI) => c.vin.parentesco !== undefined || parceria(c) || c.papel === 'amigo' || c.papel === 'amigo_proximo';
const adulto = (c: CtxI) => c.eu >= 18 && c.ip >= 18;
const crianca = (c: CtxI) => c.ip < 12;
const tenso = (c: CtxI) => c.vin.tensao >= 30 || !!c.vin.conflito;
const preco = (c: CtxI, x: number) => Math.round(x * economiaLocal(c.v.moradia.municipioId).custo / 10) * 10;
const recente = (c: CtxI, chave: string, meses: number) => { const t = c.v.fatos[`${chave}_${c.p.id}`]; return t !== undefined && c.v.t - t <= meses; };
/** O que você fez de errado com a pessoa há pouco (ofender, o boato, a agressão, desmarcar de novo): há o que reparar. */
const fezMal = (c: CtxI) => ['ofendeu', 'boato_descoberto', 'agressao', 'desmarcou', 'mentira_descoberta', 'ameacou'].some(k => recente(c, k, 36));

/** O marco seu mais recente (o que dá para contar a alguém): uma conquista, um começo, uma mudança. */
function novidadeSua(v: Vida): string | undefined {
  for (let k = v.biografia.length - 1; k >= 0; k--) {
    const e = v.biografia[k];
    if (v.t - e.t > 12) break;
    if (e.relevancia === 'marco' && e.tom === 'bom' && e.tema !== 'morte' && e.tema !== 'perda') return e.texto;
  }
  return undefined;
}

export const INTERACOES_DE_CONVIVIO: Interacao[] = [
  /* ---------------------------------------------------------------- Conversar */
  {
    id: 'contar_novidade',
    quando: c => humano(c) && c.eu >= 8 && c.ip >= 6 && proximo(c) && !!novidadeSua(c.v) && estadoDaRelacao(c.v, c.vin) !== 'rompido',
    rotulo: c => `Contar a novidade a ${c.p.nome}`,
    executar: c => {
      const n = novidadeSua(c.v)!;
      const vibra = c.p.temperamento.afabilidade > -0.2 && c.vin.tensao < 45;
      if (vibra) { c.vin.proximidade = clamp(c.vin.proximidade + 4); c.vin.confianca = clamp(c.vin.confianca + 2); c.v.mente.felicidade = clamp(c.v.mente.felicidade + 2); }
      else c.vin.tensao = clamp(c.vin.tensao + 2);
      return { resultado: vibra ? `Você contou (${n.charAt(0).toLowerCase()}${n.slice(1, 80)}${n.length > 80 ? '…' : ''}). ${c.p.nome} vibrou junto — e quis saber de tudo.` : `Você contou. ${c.p.nome} ouviu, disse "que bom" e mudou de assunto. Doeu um pouco.` };
    }
  },
  {
    id: 'compartilhar_segredo',
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 12 && proximo(c) && c.vin.confianca >= 40 && !recente(c, 'segredo_com', 60),
    rotulo: c => `Contar a ${c.p.nome} uma coisa que ninguém sabe`,
    executar: c => {
      c.v.fatos[`segredo_com_${c.p.id}`] = c.v.t;
      c.vin.confianca = clamp(c.vin.confianca + 8); c.vin.proximidade = clamp(c.vin.proximidade + 4);
      lembrarCom(c.v, c.p.id, 'Você contou um segredo seu.', 'descoberta', 2);
      return { resultado: `${c.p.nome} ouviu sem interromper e prometeu guardar. Agora são duas pessoas que sabem — e uma confiança diferente entre vocês.` };
    }
  },
  {
    id: 'falar_futuro',
    quando: c => humano(c) && c.eu >= 15 && c.ip >= 15 && !parceria(c) && (c.papel === 'amigo_proximo' || c.papel === 'genitor' || c.papel === 'irmao' || (c.papel === 'filho' && c.ip >= 15)) && !recente(c, 'futuro_com', 24),
    rotulo: c => `Falar sobre o futuro com ${c.p.nome}`,
    executar: c => {
      c.v.fatos[`futuro_com_${c.p.id}`] = c.v.t;
      c.vin.confianca = clamp(c.vin.confianca + 4); c.vin.proximidade = clamp(c.vin.proximidade + 2);
      const sonho = gostosDe(c.p)[1];
      lembrarCom(c.v, c.p.id, `${c.p.nome} contou o que quer da vida (tem a ver com ${sonho}).`, 'descoberta', 2);
      return { resultado: `Uma conversa comprida sobre o que cada um quer da vida. ${c.p.nome} falou de ${sonho} com um brilho que você não conhecia.` };
    }
  },
  {
    id: 'conversar_mudanca',
    quando: c => humano(c) && parceria(c) && adulto(c) && !recente(c, 'mudanca_conversada', 24),
    rotulo: c => `Conversar com ${c.p.nome} sobre mudar de cidade`,
    executar: c => {
      c.v.fatos[`mudanca_conversada_${c.p.id}`] = c.v.t;
      // A pessoa tem raízes (o trabalho, a família por perto) — ou não.
      const raizes = (c.p.renda > 0 ? 0.25 : 0) + (vinculosVivos(c.v).length > 0 ? 0 : 0) + c.p.temperamento.responsabilidade * 0.1 - c.p.temperamento.abertura * 0.2;
      const topa = rngDe(c.v.id, 'mudanca', c.p.id, c.v.t).chance(clamp(0.55 - raizes + (c.vin.romance?.envolvimento ?? 50) / 300, 0.1, 0.9));
      if (topa) { c.v.fatos[`aceita_mudar_${c.p.id}`] = c.v.t; c.vin.confianca = clamp(c.vin.confianca + 3); return { resultado: `${c.p.nome} topa: se a oportunidade vier, vão juntos. O combinado ficou — e pesa a favor quando a mudança chegar.` }; }
      delete c.v.fatos[`aceita_mudar_${c.p.id}`];
      c.vin.tensao = clamp(c.vin.tensao + 4);
      return { resultado: `${c.p.nome} não quer sair daqui — ${c.p.renda > 0 ? 'o trabalho, a vida montada' : 'as raízes'}. Se a mudança vier, vai ser uma conversa difícil.` };
    }
  },
  {
    id: 'reconhecer_erro',
    quando: c => humano(c) && c.eu >= 10 && (c.vin.conflito?.quem === 'eu' || fezMal(c)),
    rotulo: c => `Reconhecer para ${c.p.nome} que você errou`,
    executar: c => {
      c.vin.confianca = clamp(c.vin.confianca + 6); c.vin.tensao = clamp(c.vin.tensao - 10);
      c.v.fatos[`reconheceu_${c.p.id}`] = c.v.t;
      return { resultado: c.p.temperamento.afabilidade > 0 ? `Você disse, sem rodeio: "eu errei". ${c.p.nome} não respondeu na hora — mas a voz mudou.` : `"Eu errei." ${c.p.nome} ouviu de braços cruzados. Não perdoou ainda, mas ouviu.` };
    }
  },
  {
    id: 'reconstruir_confianca',
    quando: c => humano(c) && c.eu >= 14 && c.vin.confianca < 40 && (recente(c, 'mentira_descoberta', 96) || c.vin.historia.some(h => h.tipo === 'traicao')) && estadoDaRelacao(c.v, c.vin) !== 'rompido',
    rotulo: c => `Tentar reconstruir a confiança de ${c.p.nome}, aos poucos`,
    executar: c => {
      const n = (c.v.fatos[`reconstruindo_${c.p.id}`] ?? 0) + 1;
      c.v.fatos[`reconstruindo_${c.p.id}`] = n;
      c.vin.confianca = clamp(c.vin.confianca + 6); c.vin.tensao = clamp(c.vin.tensao - 6);
      if (n >= 3) { lembrarCom(c.v, c.p.id, 'A confiança voltou, devagar.', 'reconciliacao', 3); delete c.v.fatos[`reconstruindo_${c.p.id}`]; return { resultado: `Três anos de coisas pequenas, cumpridas. ${c.p.nome} disse que voltou a confiar — não como antes, de outro jeito.` }; }
      return { resultado: `Mais um ano de cumprir o que se diz. ${c.p.nome} reparou. Confiança não volta de uma vez (${n} de 3).` };
    }
  },

  /* ---------------------------------------------------------------- Conviver */
  {
    id: 'viajar_juntos',
    quando: c => humano(c) && c.eu >= 18 && c.ip >= 16 && (parceria(c) || c.papel === 'amigo_proximo' || c.papel === 'irmao' || c.papel === 'genitor' || (c.papel === 'filho' && c.ip >= 16)) && estadoDaRelacao(c.v, c.vin) !== 'rompido',
    disponivel: c => vereditoDePagar(c.v, preco(c, 2600 * 2), 'Uma viagem de uma semana custa uns'),
    rotulo: c => `Viajar uma semana com ${c.p.nome}`,
    executar: (c, r) => {
      const recusa = recusaDoConvite(c, 'viagem');
      if (recusa) return { resultado: recusa };
      pagar(c.v, preco(c, 2600 * 2));
      const pf = PERFIS.viagem;
      const x = compatibilidade(c.v, c.p) * 0.25 + c.p.temperamento.afabilidade * 0.15 - c.vin.tensao / 200 + pf.afinidade(c.p) + 0.15 + (r.next() - 0.5) * 0.9 * pf.risco;
      const foi = x > 0.38 ? 'otimo' : x > 0 ? 'bom' : x > -0.3 ? 'morno' : 'ruim';
      const destino = r.pick(['para a praia', 'para as montanhas', 'para uma cidade que nenhum dos dois conhecia', 'para o interior']);
      efeitoDoPrograma(c, foi, 10, 'memoria', `a viagem ${destino}`);
      c.v.mente.estresse = clamp(c.v.mente.estresse - 8); c.v.mente.felicidade = clamp(c.v.mente.felicidade + (foi === 'ruim' ? -2 : 5));
      if (foi !== 'ruim') { lembrarCom(c.v, c.p.id, `A viagem ${destino}.`, 'ritual', 3); escrever(c.v, { texto: `Viajou ${destino} com ${c.p.nome}.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom', escolha: true, pessoas: [c.p.id] }); }
      return { titulo: `A viagem com ${c.p.nome}`, resultado: foi === 'otimo' ? `Uma semana ${destino} que vocês vão contar por anos: o lugar, as risadas, a conversa da última noite.` : foi === 'bom' ? `Uma semana boa ${destino}. Voltaram cansados e mais perto.` : foi === 'morno' ? `A viagem ${destino} foi… uma viagem. Bonita nas fotos.` : `Uma semana juntos demais ${destino}. A briga do terceiro dia voltou com vocês na mala.` };
    }
  },
  {
    id: 'acompanhar_consulta',
    quando: c => humano(c) && c.eu >= 16 && c.ip >= 18 && perto(c) && proximo(c) && (c.p.condicoes?.some(x => x.diagnosticada !== false) || c.p.aperto?.tipo === 'doenca' && c.v.t - c.p.aperto.t <= 24) === true && !(c.ip >= 60 && c.vin.parentesco),
    rotulo: c => `Acompanhar ${c.p.nome} numa consulta`,
    executar: c => {
      c.vin.confianca = clamp(c.vin.confianca + 6); c.vin.proximidade = clamp(c.vin.proximidade + 5); c.p.saude = clamp(c.p.saude + 1);
      lembrarCom(c.v, c.p.id, 'Você foi junto à consulta.', 'apoio', 2);
      return { resultado: `Uma manhã de sala de espera. ${c.p.nome} não disse muito — segurou o braço da cadeira, depois o seu. Na saída, agradeceu com os olhos.` };
    }
  },
  {
    id: 'feriado_juntos',
    quando: c => humano(c) && c.eu >= 14 && (c.vin.parentesco !== undefined || parceria(c)) && !c.casa && estadoDaRelacao(c.v, c.vin) !== 'rompido',
    disponivel: c => (c.longe ? vereditoDePagar(c.v, preco(c, 600), 'A viagem do feriado custa uns') : PERMITIDO),
    rotulo: c => `Passar o feriado com ${c.p.nome}`,
    executar: c => {
      if (c.longe) pagar(c.v, preco(c, 600));
      const recusa = recusaDoConvite(c, 'feriado');
      if (recusa) return { resultado: recusa };
      c.vin.proximidade = clamp(c.vin.proximidade + 6); c.vin.presenca = clamp((c.vin.presenca ?? 30) + 10); c.vin.tensao = clamp(c.vin.tensao - 3);
      return { resultado: `O feriado inteiro com ${c.p.nome}: a mesa cheia, a conversa de sempre, a sesta depois do almoço.` };
    }
  },
  {
    id: 'organizar_encontro',
    quando: c => humano(c) && c.eu >= 14 && (c.papel === 'amigo' || c.papel === 'amigo_proximo') && perto(c),
    disponivel: c => vereditoDePagar(c.v, preco(c, 250), 'Juntar a turma custa uns'),
    rotulo: c => `Juntar a turma (com ${c.p.nome})`,
    executar: c => {
      pagar(c.v, preco(c, 250));
      const turma = vinculosVivos(c.v).filter(x => x.p.id !== c.p.id && !x.p.especie && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && mesmaCidade(c.v, x.p)).slice(0, 4);
      for (const x of [{ vin: c.vin }, ...turma]) { x.vin.proximidade = clamp(x.vin.proximidade + 3); x.vin.tUltimoContato = c.v.t; }
      c.v.mente.felicidade = clamp(c.v.mente.felicidade + 3);
      return { resultado: turma.length ? `Você, ${c.p.nome}${turma.length ? `, ${turma.map(x => x.p.nome).join(', ')}` : ''}: uma noite longa, as histórias de sempre, uma nova para a coleção.` : `Juntou o que deu: você e ${c.p.nome}, e a promessa de chamar mais gente da próxima vez.` };
    }
  },
  {
    id: 'conhecer_familia',
    quando: c => humano(c) && (c.papel === 'parceiro' || c.papel === 'saindo') && c.eu >= 16 && !recente(c, 'conheceu_familia', 9999),
    rotulo: c => `Conhecer a família de ${c.p.nome}`,
    executar: (c, r) => {
      c.v.fatos[`conheceu_familia_${c.p.id}`] = c.v.t;
      const deu = r.next() + compatibilidade(c.v, c.p) * 0.3 > 0.35;
      if (deu) { c.vin.confianca = clamp(c.vin.confianca + 5); if (c.vin.romance) c.vin.romance.envolvimento = clamp(c.vin.romance.envolvimento + 4); lembrarCom(c.v, c.p.id, `Você conheceu a família de ${c.p.nome}.`, 'romance', 2); return { resultado: `Um almoço de domingo que podia dar errado e deu certo. A mãe de ${c.p.nome} mandou comida para você levar.` }; }
      c.vin.tensao = clamp(c.vin.tensao + 6);
      lembrarCom(c.v, c.p.id, `O almoço com a família de ${c.p.nome}, que não foi bem.`, 'conflito', 1);
      return { resultado: `O almoço foi educado e frio. Na volta, ${c.p.nome} disse que a família "é assim mesmo". Ficou um incômodo.` };
    }
  },

  /* ---------------------------------------------------------------- Decisões importantes */
  {
    id: 'assumir_publico',
    quando: c => humano(c) && parceria(c) && c.eu >= 14 && !recente(c, 'publico', 9999) && c.vin.romance?.estagio === 'namoro',
    rotulo: c => `Assumir o namoro com ${c.p.nome} para todo mundo`,
    executar: c => {
      c.v.fatos[`publico_${c.p.id}`] = c.v.t;
      const discreto = c.p.temperamento.extroversao < -0.4;
      if (discreto) { c.vin.tensao = clamp(c.vin.tensao + 5); return { resultado: `${c.p.nome} preferia que ficasse entre vocês. Assumido, está — e ${flex(c.p.genero, 'ele', 'ela', 'elu')} levou uns dias para se acostumar com as perguntas.` }; }
      if (c.vin.romance) c.vin.romance.envolvimento = clamp(c.vin.romance.envolvimento + 5);
      c.vin.confianca = clamp(c.vin.confianca + 3);
      lembrarCom(c.v, c.p.id, 'Assumiram o namoro para todo mundo.', 'romance', 2);
      return { resultado: `Agora todo mundo sabe: a família, os amigos, o grupo do trabalho. ${c.p.nome} gostou de ser assumid${flex(c.p.genero, 'o', 'a', 'e')}.` };
    }
  },
  {
    id: 'dividir_financas',
    quando: c => humano(c) && parceria(c) && adulto(c) && (c.vin.romance?.estagio === 'morando_junto' || c.vin.romance?.estagio === 'casamento'),
    rotulo: c => (c.v.fatos[`financas_juntas_${c.p.id}`] !== undefined ? `Voltar a separar as finanças com ${c.p.nome}` : `Juntar as finanças com ${c.p.nome}`),
    executar: c => {
      const juntas = c.v.fatos[`financas_juntas_${c.p.id}`] !== undefined;
      if (juntas) { delete c.v.fatos[`financas_juntas_${c.p.id}`]; c.vin.tensao = clamp(c.vin.tensao + 3); return { resultado: `Cada um com a sua conta de novo. ${c.p.nome} entendeu — e perguntou se havia algo errado.` }; }
      c.v.fatos[`financas_juntas_${c.p.id}`] = c.v.t;
      c.vin.confianca = clamp(c.vin.confianca + 4);
      return { resultado: `Uma conta só para a casa. Quando o mês apertar para um, o outro cobre — e as discussões sobre dinheiro passam a ser dos dois.` };
    }
  },
  {
    id: 'marcar_casamento',
    quando: c => humano(c) && parceria(c) && c.v.fatos[`noivado_${c.p.id}`] !== undefined && c.vin.romance?.estagio !== 'casamento',
    disponivel: c => (c.v.t - (c.v.fatos[`noivado_${c.p.id}`] ?? c.v.t) < 4 ? bloqueio('requisito', 'Ficaram noivos agora: casamento leva uns meses para organizar.') : PERMITIDO),
    rotulo: c => `Marcar a data do casamento com ${c.p.nome}`,
    executar: c => ({ decisao: 'rom_casamento', papeis: { pessoa: c.p.id } })
  },

  /* ---------------------------------------------------------------- Confrontar (as ações negativas) */
  {
    id: 'criticar', variante: 'discreto',
    quando: c => humano(c) && c.eu >= 10 && c.ip >= 8 && !crianca(c),
    rotulo: c => `Criticar ${c.p.nome}`,
    executar: (c, r) => {
      const d = escalar(c, 1, c.vin.conflito?.assunto ?? 'um jeito que incomoda', r);
      return { resultado: `Você disse o que achava, sem rodeio. ${fraseDoDegrau(c, d)}` };
    }
  },
  {
    id: 'insultar', variante: 'perigo',
    quando: c => humano(c) && c.eu >= 10 && c.ip >= 10 && tenso(c),
    rotulo: c => `Ofender ${c.p.nome}`,
    executar: (c, r) => {
      c.v.fatos[`ofendeu_${c.p.id}`] = c.v.t;
      c.vin.confianca = clamp(c.vin.confianca - 6);
      const d = escalar(c, 2, c.vin.conflito?.assunto ?? 'o que foi dito', r);
      return { resultado: `Saiu o que não devia — e foi para machucar. ${fraseDoDegrau(c, d)}` };
    }
  },
  {
    id: 'acusar', variante: 'discreto',
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 12 && tenso(c),
    rotulo: c => `Acusar ${c.p.nome}`,
    executar: (c, r) => {
      // A acusação pode ser justa ou não: é o jeito da pessoa (a responsabilidade) — e você não sabe ao certo.
      const justa = rngDe(c.v.id, 'acusacao', c.p.id, c.v.t).chance(clamp(0.45 - c.p.temperamento.responsabilidade * 0.35, 0.1, 0.85));
      if (justa) {
        const d = escalar(c, 2, 'uma acusação', r);
        c.vin.confianca = clamp(c.vin.confianca - 3);
        return { resultado: `Você acusou — e acertou. ${c.p.nome} tentou negar, depois admitiu em parte. ${fraseDoDegrau(c, d)}` };
      }
      c.vin.confianca = clamp(c.vin.confianca - 15); c.vin.tensao = clamp(c.vin.tensao + 25); c.vin.proximidade = clamp(c.vin.proximidade - 6);
      c.v.fatos[`ofendeu_${c.p.id}`] = c.v.t;
      lembrarCom(c.v, c.p.id, 'Você acusou sem razão.', 'conflito', 2);
      return { resultado: `${c.p.nome} não tinha feito nada — e não engoliu a acusação. A conversa acabou em silêncio, e o silêncio vai durar.` };
    }
  },
  {
    id: 'exigir_explicacoes',
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 12 && (c.vin.conflito?.quem === 'outro' || c.vin.chamado?.tipo === 'cobranca' || recente(c, 'boato_dela', 36) || c.vin.tensao >= 45),
    rotulo: c => `Exigir explicações de ${c.p.nome}`,
    executar: (c, r) => {
      const d = discutir(c.v, r, c.p, c.vin, 2, c.vin.conflito?.assunto ?? 'o que aconteceu');
      const t = { resolveu: `${c.p.nome} explicou — e, explicado, ficou resolvido.`, desconforto: `${c.p.nome} explicou mal, e a conversa ficou pela metade.`, briga: 'As explicações viraram briga.', ruptura: `${c.p.nome} disse que não deve explicação nenhuma — e foi embora de vez.` }[d];
      return { resultado: `Você foi direto: queria entender. ${t}` };
    }
  },
  {
    id: 'mentir', variante: 'discreto',
    quando: c => humano(c) && c.eu >= 8 && c.ip >= 8 && (tenso(c) || c.vin.chamado?.tipo === 'cobranca') && !recente(c, 'mentira', 24),
    rotulo: c => `Mentir para ${c.p.nome} e evitar a briga`,
    executar: c => {
      c.v.fatos[`mentira_${c.p.id}`] = c.v.t;
      c.vin.tensao = clamp(c.vin.tensao - 12);
      if (c.vin.chamado?.tipo === 'cobranca') c.vin.chamado = undefined;
      return { resultado: `Uma história bem contada, e ${c.p.nome} acreditou. Por enquanto, a briga não aconteceu. Por enquanto.` };
    }
  },
  {
    id: 'espalhar_boato', variante: 'perigo',
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 10 && !c.vin.parentesco && !parceria(c) && (tenso(c) || c.papel === 'rival' || c.papel === 'ex_amigo'),
    rotulo: c => `Espalhar um boato sobre ${c.p.nome}`,
    executar: c => {
      c.v.fatos[`boato_${c.p.id}`] = c.v.t;
      return { resultado: `Uma frase dita para a pessoa certa, no momento certo. Até o fim da semana, metade da turma já tinha ouvido — e boato não tem dono, até ter.` };
    }
  },
  {
    id: 'desmarcar', variante: 'discreto',
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 10 && proximo(c) && !crianca(c),
    rotulo: c => `Desmarcar com ${c.p.nome} (de novo)`,
    executar: c => {
      const n = (c.vin.habitos ??= {})['desmarcou'] = (c.vin.habitos['desmarcou'] ?? 0) + 1;
      c.v.fatos[`desmarcou_${c.p.id}`] = c.v.t;
      c.vin.tensao = clamp(c.vin.tensao + 5 + n * 2); c.vin.confianca = clamp(c.vin.confianca - 3 - n);
      if (n === 3) lembrarCom(c.v, c.p.id, 'Você vive desmarcando.', 'distancia', 2);
      return { resultado: n >= 3 ? `"De novo?" ${c.p.nome} não disse mais nada. Promessa quebrada pela terceira vez não é mais imprevisto.` : `Você desmarcou em cima da hora. ${c.p.nome} disse que tudo bem — do jeito que se diz quando não está.` };
    }
  },
  {
    id: 'cortar_relacoes', variante: 'perigo',
    quando: c => humano(c) && c.eu >= 16 && !!c.vin.parentesco && !crianca(c) && (tenso(c) || fezMal(c) || recente(c, 'agressao_dela', 60)) && estadoDaRelacao(c.v, c.vin) !== 'rompido',
    rotulo: c => `Cortar relações com ${c.p.nome}`,
    executar: c => {
      romper(c.v, c.p, c.vin, `Você cortou relações com ${c.p.nome}.`, 'eu');
      c.vin.distancia = c.v.t;
      // A família inteira sente (o almoço de domingo nunca mais é o mesmo).
      for (const x of vinculosVivos(c.v).filter(y => y.p.id !== c.p.id && y.vin.parentesco && !y.p.especie).slice(0, 5)) x.vin.tensao = clamp(x.vin.tensao + 6);
      escrever(c.v, { texto: `Cortou relações com ${c.p.nome}.`, relevancia: 'biografia', tema: 'familia', tom: 'ruim', escolha: true, pessoas: [c.p.id] });
      return { resultado: `Você disse que não quer mais contato. A família ficou dividida — e cada um tomou um lado.` };
    }
  },
  {
    id: 'ameacar', variante: 'perigo',
    quando: c => humano(c) && c.eu >= 14 && c.ip >= 12 && (c.vin.tensao >= 55 || (c.vin.conflito?.gravidade ?? 0) >= 2 || c.papel === 'rival'),
    rotulo: c => `Ameaçar ${c.p.nome}`,
    executar: (c, r) => {
      c.v.fatos[`ameacou_${c.p.id}`] = c.v.t;
      c.vin.tensao = clamp(c.vin.tensao + 20); c.vin.confianca = clamp(c.vin.confianca - 15); c.vin.proximidade = clamp(c.vin.proximidade - 10);
      c.vin.distancia = c.v.t;
      // Quem é ameaçado pode ter medo — ou registrar a ocorrência (e a ameaça é crime).
      if (idade(c.v) >= 18 && rngDe(c.v.id, 'ameaca', c.p.id, c.v.t).chance(clamp(0.18 + c.p.temperamento.responsabilidade * 0.15, 0.05, 0.4))) {
        escrever(c.v, { texto: `${c.p.nome} registrou uma ocorrência por ameaça.`, relevancia: 'biografia', tema: 'amizade', tom: 'ruim', pessoas: [c.p.id] });
        abrirProcesso(c.v, r, 'violencia');
        return { resultado: `${c.p.nome} não reagiu na hora. Uma semana depois, chegou a intimação: a ameaça virou ocorrência.` };
      }
      return { resultado: `${c.p.nome} recuou — com medo, e com raiva. Ninguém esquece uma ameaça.` };
    }
  },
  {
    id: 'intimidar', variante: 'perigo',
    quando: c => humano(c) && c.eu >= 10 && c.ip >= 8 && Math.abs(c.eu - c.ip) <= 6 && (c.vin.convivio.includes('escola') || c.vin.convivio.includes('trabalho')) && !c.vin.parentesco,
    rotulo: c => (c.vin.convivio.includes('escola') ? `Intimidar ${c.p.nome} na escola` : `Intimidar ${c.p.nome} no trabalho`),
    executar: c => {
      c.v.fatos[`intimidou_${c.p.id}`] = c.v.t;
      c.vin.tensao = clamp(c.vin.tensao + 18); c.vin.proximidade = clamp(c.vin.proximidade - 8);
      const pego = rngDe(c.v.id, 'intimidar', c.p.id, c.v.t).chance(0.4);
      if (!pego) return { resultado: `${c.p.nome} passou a evitar o seu corredor. Ninguém disse nada — por enquanto.` };
      if (c.vin.convivio.includes('escola') && c.v.educacao.basica) {
        c.v.educacao.basica.desempenho = clamp(c.v.educacao.basica.desempenho - 5);
        for (const x of vinculosVivos(c.v).filter(y => (y.vin.parentesco === 'mae' || y.vin.parentesco === 'pai') && y.vin.convivio.includes('casa'))) x.vin.tensao = clamp(x.vin.tensao + 10);
        escrever(c.v, { texto: `A escola chamou a família: você vinha intimidando ${c.p.nome}.`, relevancia: 'biografia', tema: 'escola', tom: 'ruim', pessoas: [c.p.id] });
        return { resultado: `Alguém contou. A coordenação chamou a sua família — e a conversa em casa foi pior que a da escola.` };
      }
      if (c.v.trabalho.atual) {
        c.v.trabalho.atual.desempenho = clamp(c.v.trabalho.atual.desempenho - 12);
        escrever(c.v, { texto: `O RH abriu uma apuração: você vinha intimidando ${c.p.nome}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', pessoas: [c.p.id] });
        return { resultado: `${c.p.nome} levou ao RH. Uma advertência por escrito — e todo mundo no setor sabe.` };
      }
      return { resultado: `${c.p.nome} contou para quem precisava saber.` };
    }
  },
  {
    id: 'agredir', variante: 'perigo',
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 12 && ((c.vin.conflito?.gravidade ?? 0) >= 2 || c.vin.tensao >= 60 || c.papel === 'rival'),
    rotulo: c => `Partir para a briga com ${c.p.nome}`,
    destaque: true,
    executar: (c, r) => ({ titulo: 'A briga', resultado: brigaFisica(c, r, 'eu').texto })
  },

  /* ---------------------------------------------------------------- Resolver */
  {
    id: 'reparar_dano',
    quando: c => humano(c) && c.eu >= 12 && fezMal(c) && estadoDaRelacao(c.v, c.vin) !== 'rompido',
    disponivel: c => (recente(c, 'agressao', 36) ? vereditoDePagar(c.v, preco(c, 900), 'Pagar o tratamento custa uns') : PERMITIDO),
    rotulo: c => (recente(c, 'agressao', 36) ? `Pagar o tratamento de ${c.p.nome} e pedir perdão` : `Reparar o que você fez a ${c.p.nome}`),
    executar: (c, r) => {
      if (recente(c, 'agressao', 36)) pagar(c.v, preco(c, 900));
      const aceita = r.chance(clamp(0.35 + c.p.temperamento.afabilidade * 0.25 + (c.vin.confianca - 30) / 150 - (recente(c, 'agressao', 36) ? 0.2 : 0), 0.05, 0.85));
      if (!aceita) { c.v.fatos[`reparo_recusado_${c.p.id}`] = c.v.t; return { resultado: `${c.p.nome} aceitou o gesto — e disse que perdão é outra coisa, que ainda não dá.` }; }
      for (const k of ['ofendeu', 'boato_descoberto', 'desmarcou', 'mentira_descoberta', 'ameacou']) delete c.v.fatos[`${k}_${c.p.id}`];
      c.vin.confianca = clamp(c.vin.confianca + 8); c.vin.tensao = clamp(c.vin.tensao - 15); c.vin.reconciliacao = c.v.t;
      lembrarCom(c.v, c.p.id, 'Você reparou o que tinha feito.', 'reconciliacao', 2);
      return { resultado: `Você fez o que dava para fazer — e disse por quê. ${c.p.nome} aceitou. Não ficou como antes; ficou melhor do que estava.` };
    }
  }
];

/** A categoria de cada interação nova na ficha (`juntos.ROTULO_DO_GRUPO`; quem registra é `interacoes`). */
export const GRUPOS_DO_CONVIVIO = {
  contar_novidade: 'conversar', compartilhar_segredo: 'conversar', falar_futuro: 'conversar', conversar_mudanca: 'planos', reconhecer_erro: 'resolver', reconstruir_confianca: 'resolver',
  viajar_juntos: 'conviver', acompanhar_consulta: 'familia', feriado_juntos: 'conviver', organizar_encontro: 'conviver', conhecer_familia: 'romance',
  assumir_publico: 'decisoes', dividir_financas: 'decisoes', marcar_casamento: 'decisoes',
  criticar: 'confrontar', insultar: 'confrontar', acusar: 'confrontar', exigir_explicacoes: 'confrontar', mentir: 'confrontar', espalhar_boato: 'confrontar',
  desmarcar: 'confrontar', cortar_relacoes: 'confrontar', ameacar: 'confrontar', intimidar: 'confrontar', agredir: 'confrontar', reparar_dano: 'resolver'
} as const;

/* ============================================================ O que volta depois (EVT-02 · NPC-04) */

/**
 * Uma vez por ano: o que se fez com as pessoas volta. A mentira pode ser descoberta; o segredo contado pode vazar (quem
 * é pouco discreto, ou depois de uma briga); o boato chega a quem foi alvo; a briga antiga esfria, ou a pessoa se afasta,
 * ou ela mesma procura fazer as pazes (um chamado); as finanças juntas cobrem o mês de quem aperta. Sorteio próprio
 * (`rngDe`): a sequência do ano não muda por isto.
 */
export function processarConvivio(v: Vida): void {
  const r = rngDe(v.id, 'convivio', v.t);
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie) continue;
    const id = p.id;
    // A mentira descoberta.
    const m = v.fatos[`mentira_${id}`];
    if (m !== undefined && v.t - m >= 12) {
      // Quanto mais tempo passa, mais gente sabe a verdade — e mais fácil ela chegar (até uns oito anos; depois, ficou enterrada).
      if (r.chance(0.12 + Math.min(0.16, (v.t - m) / 12 * 0.02))) {
        delete v.fatos[`mentira_${id}`];
        v.fatos[`mentira_descoberta_${id}`] = v.t;
        vin.confianca = clamp(vin.confianca - 20); vin.tensao = clamp(vin.tensao + 18);
        vin.conflito = { t: v.t, assunto: 'uma mentira', gravidade: 2, quem: 'eu' };
        vin.chamado = { tipo: 'cobranca', t: v.t, texto: `${p.nome} descobriu a mentira — e quer uma explicação.`, assunto: 'a mentira' };
        lembrarCom(v, id, `${p.nome} descobriu a mentira.`, 'traicao', 3);
        escrever(v, { texto: `${p.nome} descobriu uma mentira sua.`, relevancia: 'biografia', tema: vin.romance ? 'amor' : vin.parentesco ? 'familia' : 'amizade', tom: 'ruim', pessoas: [id], segue: undefined });
      } else if (v.t - m >= 96) delete v.fatos[`mentira_${id}`];
    }
    // O segredo que vaza (quem é pouco discreto, ou quem brigou com você).
    const s = v.fatos[`segredo_com_${id}`];
    if (s !== undefined && v.t - s >= 12 && v.fatos[`segredo_vazou_${id}`] === undefined) {
      const discricao = p.temperamento.responsabilidade * 0.5 + p.temperamento.afabilidade * 0.3;
      const chance = clamp(0.06 - discricao * 0.08 + (vin.conflito ? 0.25 : 0) + (estadoDaRelacao(v, vin) === 'rompido' ? 0.3 : 0), 0.01, 0.6);
      if (r.chance(chance)) {
        v.fatos[`segredo_vazou_${id}`] = v.t;
        vin.confianca = clamp(vin.confianca - 18); vin.tensao = clamp(vin.tensao + 15);
        lembrarCom(v, id, `${p.nome} contou o seu segredo.`, 'traicao', 3);
        abalar(v, 'o segredo que vazou', -6, 8);
        escrever(v, { texto: `O segredo que você tinha contado a ${p.nome} se espalhou.`, relevancia: 'biografia', tema: 'amizade', tom: 'ruim', pessoas: [id] });
      }
    }
    // O boato chega.
    const b = v.fatos[`boato_${id}`];
    if (b !== undefined && v.t - b >= 6) {
      delete v.fatos[`boato_${id}`];
      p.saude = clamp(p.saude - 1);
      if (r.chance(0.45)) {
        v.fatos[`boato_descoberto_${id}`] = v.t;
        vin.confianca = clamp(vin.confianca - 25); vin.tensao = clamp(vin.tensao + 30);
        if (!vin.parentesco && !vin.romance) romper(v, p, vin, `${p.nome} descobriu que o boato tinha saído de você.`, 'outro');
        for (const x of vinculosVivos(v).filter(y => y.p.id !== id && !y.p.especie && y.vin.convivio.some(cv => vin.convivio.includes(cv))).slice(0, 5)) x.vin.confianca = clamp(x.vin.confianca - 6);
        escrever(v, { texto: `Descobriram que o boato sobre ${p.nome} tinha saído de você.`, relevancia: 'biografia', tema: 'amizade', tom: 'ruim', pessoas: [id] });
      }
    }
    // A briga antiga: esfria, afasta — ou a pessoa procura fazer as pazes.
    const c = vin.conflito;
    if (c && v.t - c.t >= 24 && estadoDaRelacao(v, vin) !== 'rompido') {
      const t = p.temperamento;
      if (!vin.chamado && t.afabilidade > 0.25 && r.chance(0.35)) {
        vin.chamado = { tipo: 'desculpas', t: v.t, texto: `${p.nome} procurou você: disse que sente falta, e que a briga por causa ${comPreposicao('de', c.assunto)} não vale o que custou.`, assunto: c.assunto };
      } else if (!vin.parentesco && !vin.romance && vin.proximidade < 35 && vin.tensao >= 55 && r.chance(0.4)) {
        vin.estagio = 'afastado'; vin.distancia = v.t; vin.conflito = undefined;
        lembrarCom(v, id, `${p.nome} se afastou depois da briga.`, 'distancia', 2);
        escrever(v, { texto: `${p.nome} se afastou depois da briga por causa ${comPreposicao('de', c.assunto)}.`, relevancia: 'cotidiano', tema: 'amizade', tom: 'ruim', pessoas: [id] });
      } else if (r.chance(0.3 + t.estabilidade * 0.2)) {
        vin.conflito = undefined; vin.tensao = clamp(vin.tensao - 12);
        lembrarCom(v, id, `O tempo esfriou a briga por causa ${comPreposicao('de', c.assunto)}.`, 'reconciliacao', 1);
      }
    }
    // As finanças juntas: quem tem cobre o mês de quem aperta — e o dinheiro vira assunto dos dois.
    if (v.fatos[`financas_juntas_${id}`] !== undefined && vin.romance && (vin.romance.estagio === 'morando_junto' || vin.romance.estagio === 'casamento')) {
      if (v.financas.conta < 0 && p.renda > 0) {
        const cobre = Math.min(-v.financas.conta, Math.round(p.renda * 2));
        v.financas.conta += cobre;
        vin.tensao = clamp(vin.tensao + (p.temperamento.responsabilidade > 0.2 ? 5 : 2));
        escrever(v, { texto: `${p.nome} cobriu ${cobre > 0 ? 'parte do' : 'o'} buraco do mês com a conta da casa.`, relevancia: 'cotidiano', tema: 'dinheiro', pessoas: [id] });
      }
    } else if (v.fatos[`financas_juntas_${id}`] !== undefined && (!vin.romance || vin.romance.estagio === 'ex')) delete v.fatos[`financas_juntas_${id}`];
  }
}

/** A mudança de cidade com a parceria junto: combinada antes, vai em paz; sem combinar (ou contra a vontade), pesa. */
export function reacaoDaParceriaAMudanca(v: Vida): string | undefined {
  const par = parceiro(v);
  if (!par || !par.vin.convivio.includes('casa')) return undefined;
  const id = par.p.id;
  const combinou = v.fatos[`aceita_mudar_${id}`] !== undefined && v.t - v.fatos[`aceita_mudar_${id}`] <= 60;
  if (combinou) { par.vin.confianca = clamp(par.vin.confianca + 2); return `${par.p.nome} veio junto, como tinham combinado.`; }
  const conversou = v.fatos[`mudanca_conversada_${id}`] !== undefined && v.t - v.fatos[`mudanca_conversada_${id}`] <= 60;
  par.vin.tensao = clamp(par.vin.tensao + (conversou ? 14 : 9));
  lembrarCom(v, id, conversou ? `${par.p.nome} veio junto, contra a vontade.` : `A mudança que não foi combinada com ${par.p.nome}.`, 'conflito', 2);
  return conversou ? `${par.p.nome} veio junto — contra a vontade, e disse isso mais de uma vez.` : `${par.p.nome} veio junto, mas não foi consultad${flex(par.p.genero, 'o', 'a', 'e')} — e isso ficou entre vocês.`;
}

