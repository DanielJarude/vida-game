/**
 * REWORK 10 · JOG-01 — LOTERIA, BLACKJACK, ROLETA E O CAÇA-NÍQUEL DA RAPOSA. Só com o dinheiro do jogo: nada de
 * dinheiro real, depósito, saque, cripto, prêmio fora do jogo, link ou serviço de apostas.
 *
 * REGRAS, PROBABILIDADES E RETORNO (o que a casa devolve, em média, de cada aposta — RTP), todos auditáveis
 * (`__tests__/rework10` confere em milhares de rodadas):
 *
 *   LOTERIA "Seis de Quarenta" (modalidade fictícia): escolhem-se 6 números de 1 a 40; sorteiam-se 6.
 *     Combinações: C(40,6) = 3.838.380. Prêmio fixo, em vezes o bilhete:
 *       3 acertos (119.680 combinações) → 2×  ·  4 (8.415) → 40×  ·  5 (204) → 2.500×  ·  6 (1) → 500.000×
 *     RTP = (119.680·2 + 8.415·40 + 204·2.500 + 500.000) / 3.838.380 = 41,3%  (como as loterias de verdade: ~40–50%).
 *   BLACKJACK: seis baralhos embaralhados a cada mão; a banca para no 17 (inclusive o 17 "macio"); blackjack paga 3:2;
 *     empate devolve a aposta; dobrar nas duas primeiras cartas (uma carta só, depois para). NÃO há divisão (split) nem
 *     seguro — não há botão sem regra. O ás vale 11 ou 1; as figuras, 10. A vantagem da casa, nessas regras e com a
 *     estratégia básica, fica perto de 1% (medida nos testes).
 *   ROLETA EUROPEIA: 37 casas (0 a 36), um zero só. Vermelho/preto, par/ímpar e 1–18/19–36 pagam 1:1; dúzias, 2:1; um
 *     número, 35:1. O zero perde as apostas "de fora". RTP = 36/37 = 97,30% em toda aposta.
 *   CAÇA-NÍQUEL DA RAPOSA (máquina original, três rolos, uma linha): cada rolo tem 32 posições — folha ×10, sino ×10,
 *     estrela ×5, moeda ×4, raposa ×3 —, sorteadas de forma independente. Paga (em vezes a aposta): três iguais — folha
 *     5, sino 10, estrela 20, moeda 50, raposa 150; duas raposas nos dois primeiros rolos, 10; uma raposa no primeiro, 1
 *     (a aposta de volta). RTP = 30.144/32.768 = 91,99%; uma rodada em 6,2 paga alguma coisa (16,1%).
 *     O que aparece nos rolos é o que foi sorteado: nada de "quase ganhou" fabricado, nada que mude com o saldo, a
 *     sequência ou o comportamento de quem joga.
 *
 * O sorteio é do gerador da vida (`transacao`): é salvo a cada passo, e recarregar a página não muda o que já saiu.
 *
 * O LUGAR: aposta é coisa de adulto (18) e não existe onde a lei proíbe o jogo (`proibido`). O DINHEIRO: só o que está
 * na conta (não se aposta o aplicado nem o emprestado). A VIDA: o que se ganha e perde entra no extrato, no humor e — o
 * que é grande — na biografia; perder muito, ano após ano, vira um assunto na vida (`processarApostas`), sem sermão e
 * sem a dependência automática de quem jogou uma vez.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Vida } from '../tipos';
import { escrever, idade, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { abalar } from './abalo';
import { dinheiro } from '../texto';
import { paisDaVida } from '../mundo/vida';
import { economiaLocal } from '../dados/lugares';
import { rendaPropriaMensal } from './dinheiro';

/* ============================================================ O estado */

import type { ApostaNaRoleta, Carta, EstadoDasApostas, Naipe, ResultadoDeAposta, Simbolo, TipoDeApostaNaRoleta } from '../tipos';
export type { ApostaNaRoleta, Carta, EstadoDasApostas, ResultadoDeAposta, Simbolo, TipoDeApostaNaRoleta };
const estado = (v: Vida): EstadoDasApostas => (v.apostas ??= { ultimas: [], ano: { t: v.t, apostado: 0, recebido: 0 }, total: { apostado: 0, recebido: 0 } });

/* ============================================================ A regra do lugar e do bolso */

/** Onde o jogo de azar é proibido por lei (os países do catálogo em que ele é crime para todos): declarado, não deduzido. */
const PROIBIDO = new Set(['SA', 'AE', 'QA', 'KW', 'IR', 'AF', 'BN', 'PK', 'BD', 'LY', 'SD', 'YE', 'MV']);
export const proibido = (v: Vida) => PROIBIDO.has(paisDaVida(v));
/** As fichas e o bilhete, em valores do lugar (o mesmo jogo custa outro tanto em outra economia). */
export const precoDoBilhete = (v: Vida) => Math.max(1, Math.round(5 * economiaLocal(v.moradia.municipioId).custo));
/** Um valor "redondo" (1, 2, 2,5, 5 × uma potência de 10): ficha de cassino não vale 55 nem 275. */
const redondo = (x: number) => { const m = 10 ** Math.floor(Math.log10(Math.max(1, x))); return [1, 2, 2.5, 5, 10].map(k => k * m).reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a)); };
export const valoresDeAposta = (v: Vida) => [...new Set([10, 25, 50, 100, 250, 500].map(x => redondo(x * economiaLocal(v.moradia.municipioId).custo)))];

export function podeApostar(v: Vida, valor: number): Veredito {
  if (idade(v) < 18) return bloqueio('ilegal', 'Aposta é coisa de maior de idade.');
  if (proibido(v)) return bloqueio('ilegal', 'Aqui, o jogo de azar é proibido por lei.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não há cassino na unidade.');
  if (!Number.isFinite(valor) || valor <= 0) return bloqueio('impossivel', 'Escolha um valor.');
  const e = v.apostas;
  if (e?.autoexclusao !== undefined && v.t < e.autoexclusao) return bloqueio('incompativel', `Você pediu para ficar fora das apostas até ${Math.floor(e.autoexclusao / 12)}. A autoexclusão vale.`);
  if (e?.limiteAnual !== undefined && e.ano.t === v.t && e.ano.apostado - e.ano.recebido + valor > e.limiteAnual) return bloqueio('incompativel', `O limite que você se deu para o ano (${dinheiro(e.limiteAnual)} de perda) chegou.`);
  if (valor > Math.max(0, v.financas.conta)) return bloqueio('incompativel', `Na conta há ${dinheiro(Math.max(0, v.financas.conta))}: não dá para apostar mais do que se tem (nem o aplicado, nem o emprestado).`);
  return PERMITIDO;
}

/** Debita a aposta e credita o prêmio, e conta no ano e na vida (nenhuma moeda aparece ou some fora daqui). */
function registrar(v: Vida, res: ResultadoDeAposta): ResultadoDeAposta {
  const e = estado(v);
  if (e.ano.t !== v.t) e.ano = { t: v.t, apostado: 0, recebido: 0 };
  v.financas.conta = Math.round((v.financas.conta + res.recebido) * 100) / 100;
  e.ano.apostado += res.apostado; e.ano.recebido += res.recebido;
  e.total.apostado += res.apostado; e.total.recebido += res.recebido;
  e.ultimas = [res, ...e.ultimas].slice(0, 10);
  const liquido = res.recebido - res.apostado;
  const renda = Math.max(rendaPropriaMensal(v), 1000);
  // O humor: a vitória alegra, a perda pesa — pouco, e proporcional ao bolso.
  if (liquido > 0) abalar(v, 'a sorte no jogo', clamp(liquido / renda * 2, 0.5, 6), -1);
  else if (liquido < 0) abalar(v, 'o que perdeu no jogo', -clamp(-liquido / renda * 1.5, 0, 5), clamp(-liquido / renda, 0, 4));
  // O que é grande entra na vida: o prêmio de verdade, a perda de um salário de uma vez.
  if (liquido >= renda * 6) escrever(v, { texto: `Ganhou ${dinheiro(liquido)} ${res.jogo === 'loteria' ? 'na loteria' : res.jogo === 'roleta' ? 'na roleta' : res.jogo === 'blackjack' ? 'no blackjack' : 'no caça-níquel'}.`, relevancia: liquido >= renda * 60 ? 'marco' : 'biografia', tema: 'dinheiro', tom: 'bom', escolha: true });
  else if (-liquido >= renda * 3) escrever(v, { texto: `Perdeu ${dinheiro(-liquido)} numa noite de ${res.jogo === 'roleta' ? 'roleta' : res.jogo === 'blackjack' ? 'blackjack' : res.jogo === 'niquel' ? 'caça-níquel' : 'apostas'}.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim', escolha: true });
  return res;
}
/** Tira a aposta da conta (antes do sorteio). */
function debitar(v: Vida, valor: number): void { v.financas.conta = Math.round((v.financas.conta - valor) * 100) / 100; }

/* ============================================================ A loteria: seis de quarenta */

export const LOTERIA = { numeros: 40, escolhe: 6, premio: { 3: 2, 4: 40, 5: 2500, 6: 500000 } as Record<number, number> };
const comb = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
/** A chance exata de cada número de acertos (de 0 a 6). */
export const chanceLoteria = (acertos: number) => comb(6, acertos) * comb(34, 6 - acertos) / comb(40, 6);
export const rtpLoteria = () => [3, 4, 5, 6].reduce((s, k) => s + chanceLoteria(k) * LOTERIA.premio[k], 0);

export function validarBilhete(numeros: number[]): string | undefined {
  if (numeros.length !== 6) return 'Marque seis números.';
  if (new Set(numeros).size !== 6) return 'Os seis números precisam ser diferentes.';
  if (numeros.some(n => !Number.isInteger(n) || n < 1 || n > 40)) return 'Os números vão de 1 a 40.';
  return undefined;
}

export function sortearLoteria(r: Rng): number[] {
  const bola = Array.from({ length: 40 }, (_, k) => k + 1);
  for (let i = bola.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [bola[i], bola[j]] = [bola[j], bola[i]]; }
  return bola.slice(0, 6).sort((a, b) => a - b);
}

export function jogarLoteria(v: Vida, r: Rng, numeros: number[]): ResultadoDeAposta {
  const preco = precoDoBilhete(v);
  debitar(v, preco);
  const sorteio = sortearLoteria(r);
  const acertos = numeros.filter(n => sorteio.includes(n)).length;
  const recebido = (LOTERIA.premio[acertos] ?? 0) * preco;
  return registrar(v, { jogo: 'loteria', t: v.t, apostado: preco, recebido, sorteio, acertos, texto: recebido > 0 ? `${acertos} acertos: o bilhete pagou ${dinheiro(recebido)}.` : `${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}. Não foi desta vez.` });
}

/* ============================================================ A roleta europeia */

export const VERMELHOS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
/** Quanto a aposta devolve se acertar (o valor apostado incluído): 1:1 → 2×; 2:1 → 3×; 35:1 → 36×. */
export const PAGA_ROLETA: Record<TipoDeApostaNaRoleta, number> = { vermelho: 2, preto: 2, par: 2, impar: 2, baixo: 2, alto: 2, duzia1: 3, duzia2: 3, duzia3: 3, numero: 36 };
export function acertaNaRoleta(a: ApostaNaRoleta, casa: number): boolean {
  if (a.tipo === 'numero') return a.numero === casa;
  if (casa === 0) return false;
  switch (a.tipo) {
    case 'vermelho': return VERMELHOS.has(casa);
    case 'preto': return !VERMELHOS.has(casa);
    case 'par': return casa % 2 === 0;
    case 'impar': return casa % 2 === 1;
    case 'baixo': return casa <= 18;
    case 'alto': return casa >= 19;
    case 'duzia1': return casa <= 12;
    case 'duzia2': return casa >= 13 && casa <= 24;
    case 'duzia3': return casa >= 25;
  }
}
export function validarApostasNaRoleta(as: ApostaNaRoleta[]): string | undefined {
  if (!as.length) return 'Faça ao menos uma aposta.';
  for (const a of as) {
    if (!(a.valor > 0)) return 'Cada aposta precisa de um valor.';
    if (a.tipo === 'numero' && (!Number.isInteger(a.numero) || a.numero! < 0 || a.numero! > 36)) return 'Os números da roleta vão de 0 a 36.';
  }
  return undefined;
}

export function jogarRoleta(v: Vida, r: Rng, apostas: ApostaNaRoleta[]): ResultadoDeAposta {
  const total = apostas.reduce((s, a) => s + a.valor, 0);
  debitar(v, total);
  const casa = Math.floor(r.next() * 37);
  const recebido = apostas.filter(a => acertaNaRoleta(a, casa)).reduce((s, a) => s + a.valor * PAGA_ROLETA[a.tipo], 0);
  const cor = casa === 0 ? 'verde' : VERMELHOS.has(casa) ? 'vermelho' : 'preto';
  return registrar(v, { jogo: 'roleta', t: v.t, apostado: total, recebido, casa, texto: `Deu ${casa} (${cor}).${recebido > 0 ? ` As apostas pagaram ${dinheiro(recebido)}.` : ' A mesa levou as fichas.'}` });
}

/* ============================================================ O caça-níquel da Raposa */

/** As 32 posições de cada rolo (as mesmas nos três). */
export const ROLO: Record<Simbolo, number> = { folha: 10, sino: 10, estrela: 5, moeda: 4, raposa: 3 };
export const PAGA_TRES: Record<Simbolo, number> = { folha: 5, sino: 10, estrela: 20, moeda: 50, raposa: 150 };
const POSICOES: Simbolo[] = (Object.keys(ROLO) as Simbolo[]).flatMap(s => Array(ROLO[s]).fill(s));
/** Quanto uma linha paga, em vezes a aposta. */
export function premioDaLinha([a, b, c]: Simbolo[]): number {
  if (a === b && b === c) return PAGA_TRES[a];
  if (a === 'raposa' && b === 'raposa') return 10;
  if (a === 'raposa') return 1;
  return 0;
}
/** O retorno exato (todas as 32³ combinações). */
export function rtpNiquel(): number {
  let soma = 0;
  for (const a of POSICOES) for (const b of POSICOES) for (const c of POSICOES) soma += premioDaLinha([a, b, c]);
  return soma / POSICOES.length ** 3;
}
export function jogarNiquel(v: Vida, r: Rng, valor: number): ResultadoDeAposta {
  debitar(v, valor);
  const rolos = [0, 1, 2].map(() => POSICOES[Math.floor(r.next() * POSICOES.length)]);
  const vezes = premioDaLinha(rolos);
  const recebido = vezes * valor;
  return registrar(v, { jogo: 'niquel', t: v.t, apostado: valor, recebido, rolos, texto: vezes ? (vezes === 1 ? 'Uma raposa no primeiro rolo: a aposta voltou.' : `A linha pagou ${vezes}× a aposta: ${dinheiro(recebido)}.`) : 'Nada na linha.' });
}

/* ============================================================ O blackjack */

/** O valor de uma mão: o ás é 11 enquanto não estourar; senão, 1. `macia`: há um ás contado como 11. */
export function valorDaMao(cs: Carta[]): { total: number; macia: boolean } {
  let total = 0, ases = 0;
  for (const c of cs) { if (c.v === 1) { ases++; total += 11; } else total += Math.min(10, c.v); }
  while (total > 21 && ases > 0) { total -= 10; ases--; }
  return { total, macia: ases > 0 };
}
export const ehBlackjack = (cs: Carta[]) => cs.length === 2 && valorDaMao(cs).total === 21;
function baralhoNovo(r: Rng): Carta[] {
  const naipes: Naipe[] = ['copas', 'ouros', 'espadas', 'paus'];
  const b: Carta[] = [];
  for (let d = 0; d < 6; d++) for (const n of naipes) for (let x = 1; x <= 13; x++) b.push({ v: x, n });
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

/** Começa a mão: a aposta sai da conta; duas cartas para cada lado (uma da banca fica virada). O blackjack natural fecha na hora. */
export function apostarBlackjack(v: Vida, r: Rng, valor: number): ResultadoDeAposta | undefined {
  const e = estado(v);
  debitar(v, valor);
  const baralho = baralhoNovo(r);
  const voce = [baralho.pop()!, baralho.pop()!];
  const banca = [baralho.pop()!, baralho.pop()!];
  e.mao = { aposta: valor, voce, banca, baralho: baralho.slice(-40), t: v.t };
  if (ehBlackjack(voce) || ehBlackjack(banca)) return fecharBlackjack(v);
  return undefined;
}
export function pedirCarta(v: Vida): ResultadoDeAposta | undefined {
  const m = estado(v).mao!;
  m.voce.push(m.baralho.pop()!);
  if (valorDaMao(m.voce).total > 21) return fecharBlackjack(v);
  if (valorDaMao(m.voce).total === 21) return fecharBlackjack(v);
  return undefined;
}
export function dobrar(v: Vida): ResultadoDeAposta {
  const m = estado(v).mao!;
  debitar(v, m.aposta);
  m.aposta *= 2;
  m.dobrou = true;
  m.voce.push(m.baralho.pop()!);
  return fecharBlackjack(v);
}
/** Parar: a banca joga (pede até 17, e para no 17, inclusive o macio), e a mão se resolve. */
export const parar = (v: Vida) => fecharBlackjack(v);
function fecharBlackjack(v: Vida): ResultadoDeAposta {
  const e = estado(v);
  const m = e.mao!;
  e.mao = undefined;
  const vv = valorDaMao(m.voce).total;
  const bj = ehBlackjack(m.voce), bjBanca = ehBlackjack(m.banca);
  if (!bj && vv <= 21) while (valorDaMao(m.banca).total < 17) m.banca.push(m.baralho.pop()!);
  const vb = valorDaMao(m.banca).total;
  let recebido = 0, texto: string;
  if (bj && bjBanca) { recebido = m.aposta; texto = 'Blackjack dos dois lados: empate, a aposta volta.'; }
  else if (bj) { recebido = m.aposta * 2.5; texto = `Blackjack! Paga 3 para 2: ${dinheiro(recebido)}.`; }
  else if (bjBanca) { texto = 'A banca tinha blackjack.'; }
  else if (vv > 21) { texto = `Estourou: ${vv}.`; }
  else if (vb > 21) { recebido = m.aposta * 2; texto = `A banca estourou (${vb}). Você ganhou ${dinheiro(m.aposta)}.`; }
  else if (vv > vb) { recebido = m.aposta * 2; texto = `${vv} contra ${vb}: você ganhou ${dinheiro(m.aposta)}.`; }
  else if (vv === vb) { recebido = m.aposta; texto = `${vv} a ${vb}: empate, a aposta volta.`; }
  else texto = `${vv} contra ${vb}: a banca ganhou.`;
  return registrar(v, { jogo: 'blackjack', t: v.t, apostado: m.aposta, recebido, voce: m.voce, banca: m.banca, texto });
}
/** A estratégia básica (simplificada, sem divisão): o que os testes usam para medir a vantagem da casa. */
export function estrategiaBasica(voce: Carta[], cartaDaBanca: Carta): 'pedir' | 'parar' | 'dobrar' {
  const { total, macia } = valorDaMao(voce);
  const b = cartaDaBanca.v === 1 ? 11 : Math.min(10, cartaDaBanca.v);
  if (voce.length === 2 && !macia && (total === 11 || (total === 10 && b <= 9) || (total === 9 && b >= 3 && b <= 6))) return 'dobrar';
  if (macia) return total >= 19 || (total === 18 && b <= 8) ? 'parar' : 'pedir';
  if (total >= 17) return 'parar';
  if (total >= 13) return b <= 6 ? 'parar' : 'pedir';
  if (total === 12) return b >= 4 && b <= 6 ? 'parar' : 'pedir';
  return 'pedir';
}

/** A mão abandonada (o ano andou com ela na mesa): a aposta fica com a casa, sem nenhuma moeda criada. */
export function encerrarMaoEsquecida(v: Vida): void {
  const e = v.apostas;
  if (!e?.mao || e.mao.t === v.t) return;
  const m = e.mao;
  e.mao = undefined;
  registrar(v, { jogo: 'blackjack', t: v.t, apostado: m.aposta, recebido: 0, voce: m.voce, banca: m.banca, texto: 'A mão ficou na mesa: a aposta ficou com a casa.' });
}

/* ============================================================ O ano: quando o jogo vira um assunto */

/**
 * Uma vez por ano: quem perdeu muito no ano (mais de um quarto da própria renda do ano) por dois anos seguidos passa a
 * ter o jogo como assunto — a parceria cobra, o dinheiro aperta, e a vida pergunta (`apo_conversa`). Quem joga de vez em
 * quando, ganhando ou perdendo pouco, não vira personagem de tragédia.
 */
export function processarApostas(v: Vida): void {
  encerrarMaoEsquecida(v);
  const e = v.apostas;
  if (!e) return;
  const anual = e.ano.t >= v.t - 12 ? e.ano : { apostado: 0, recebido: 0 };
  const perdeu = anual.apostado - anual.recebido;
  const renda = Math.max(rendaPropriaMensal(v) * 12, 12000);
  e.anosPesados = perdeu > renda * 0.25 ? (e.anosPesados ?? 0) + 1 : 0;
  if (e.anosPesados >= 2) {
    v.fatos['apo_conversa'] = v.t;
    const par = parceiro(v);
    if (par) par.vin.tensao = clamp(par.vin.tensao + 8);
  }
}

/** O balanço do ano e da vida, em palavras (para a tela). */
export function balancoDasApostas(v: Vida): { ano: number; total: number; frase: string } {
  const e = v.apostas;
  const ano = e && e.ano.t === v.t ? e.ano.recebido - e.ano.apostado : 0;
  const total = e ? e.total.recebido - e.total.apostado : 0;
  const frase = !e || !e.total.apostado ? 'Você ainda não apostou.' : total >= 0 ? `Na vida inteira, o jogo devolveu ${dinheiro(total)} a mais do que você pôs — por enquanto.` : `Na vida inteira, o jogo levou ${dinheiro(-total)}.`;
  return { ano, total, frase };
}

/* ============================================================ A ação (o que a tela pede) */

export type OpAposta =
  | { jogo: 'loteria'; numeros: number[] }
  | { jogo: 'roleta'; apostas: ApostaNaRoleta[] }
  | { jogo: 'niquel'; valor: number }
  | { jogo: 'blackjack'; oque: 'apostar'; valor: number }
  | { jogo: 'blackjack'; oque: 'pedir' | 'parar' | 'dobrar' }
  /** A autoexclusão (um ano fora) e o limite de perda do ano (liga e desliga). */
  | { jogo: 'controle'; oque: 'autoexcluir' | 'limite' };

export function disponibilidadeAposta(v: Vida, op: OpAposta): Veredito {
  const mao = v.apostas?.mao;
  switch (op.jogo) {
    case 'controle': return idade(v) < 18 ? bloqueio('impossivel', 'Aposta é coisa de maior de idade.') : PERMITIDO;
    case 'loteria': { const erro = validarBilhete(op.numeros); return erro ? bloqueio('impossivel', erro) : podeApostar(v, precoDoBilhete(v)); }
    case 'roleta': { const erro = validarApostasNaRoleta(op.apostas); return erro ? bloqueio('impossivel', erro) : podeApostar(v, op.apostas.reduce((s, a) => s + a.valor, 0)); }
    case 'niquel': return podeApostar(v, op.valor);
    case 'blackjack':
      if (op.oque === 'apostar') return mao ? bloqueio('incompativel', 'Há uma mão na mesa: termine-a primeiro.') : podeApostar(v, op.valor);
      if (!mao) return bloqueio('impossivel', 'Não há mão na mesa.');
      if (op.oque === 'dobrar') return mao.voce.length !== 2 ? bloqueio('impossivel', 'Dobrar só nas duas primeiras cartas.') : podeApostar(v, mao.aposta);
      return PERMITIDO;
  }
}

/** Joga: devolve o resultado (a rodada que fechou) ou nada (a mão de blackjack continua). */
export function executarAposta(v: Vida, r: Rng, op: OpAposta): ResultadoDeAposta | undefined {
  switch (op.jogo) {
    case 'controle':
      if (op.oque === 'autoexcluir') autoexcluir(v, 1);
      else limitar(v, v.apostas?.limiteAnual ? undefined : Math.round(Math.max(rendaPropriaMensal(v), 1000) * 0.5));
      return undefined;
    case 'loteria': return jogarLoteria(v, r, op.numeros);
    case 'roleta': return jogarRoleta(v, r, op.apostas);
    case 'niquel': return jogarNiquel(v, r, op.valor);
    case 'blackjack':
      if (op.oque === 'apostar') return apostarBlackjack(v, r, op.valor);
      if (op.oque === 'pedir') return pedirCarta(v);
      if (op.oque === 'dobrar') return dobrar(v);
      return parar(v);
  }
}

/** Ficar fora das apostas (a autoexclusão) por um tempo, ou pôr um limite de perda no ano. */
export function autoexcluir(v: Vida, anos: number): void { estado(v).autoexclusao = v.t + anos * 12; }
export function limitar(v: Vida, valor: number | undefined): void { estado(v).limiteAnual = valor; }
