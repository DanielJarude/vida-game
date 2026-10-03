/**
 * AS COISAS DA VIDA — comprar, usar, gastar, perder, vender, levar.
 *
 * Um bem durável não é enfeite: ele muda o que a pessoa faz (a prática de
 * quem tem o instrumento em casa rende mais), o peso da semana (a máquina de
 * lavar tira um pouco da casa da cabeça), o descanso (a TV, o videogame) —
 * e se gasta: tem vida útil, quebra, perde valor. Pode ser vendido pelo que
 * ainda vale; numa mudança de país, o que é da casa fica (vendido), o resto
 * vai na mala.
 *
 * O dinheiro: comprar e vender passam pelo extrato do ano (a linha da ação,
 * `acoes.linhaDoExtrato`). As coisas não entram no patrimônio (bem de
 * consumo perde valor e não se herda como investimento): o que vale é o
 * valor de revenda, mostrado na tela.
 *
 * Os sorteios do ano (o desgaste de cada coisa) são derivados da vida e do
 * ano — nunca do sorteio principal (que mudaria o acaso de todo o resto).
 */

import type { CoisaTida, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { escrever, idade, novoId } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { coisa, COISAS, type Coisa, type LojaDeCoisas } from '../dados/coisas';
import { economiaLocal, municipio, nivelDeOferta, paisDaCidade, pertoDaAgua } from '../dados/lugares';
import { pagar, vereditoDePagar } from './dinheiro';
import { autonomia } from './autonomia';
import { moraComFamiliaDeOrigem } from './domicilio';
import { lancar } from './extrato';
import { dinheiro as fmt } from '../texto';

export const coisasDaVida = (v: Vida): CoisaTida[] => v.financas.coisas ?? [];
export const temCoisa = (v: Vida, id: string) => coisasDaVida(v).some(c => c.coisaId === id);

/**
 * A loja na cidade: as grandes estão em toda cidade; a de instrumentos e a
 * livraria, nas que têm comércio para isso. Onde não há, compra-se pela
 * internet — com frete.
 */
export function temLojaNaCidade(v: Vida, loja: LojaDeCoisas): boolean {
  if (loja === 'instrumentos' || loja === 'livraria') return nivelDeOferta(v.moradia.municipioId) >= 1;
  return true;
}

/** O preço aqui: a referência pelo custo de vida da cidade; sem loja na cidade, mais o frete. */
export function precoDaCoisa(v: Vida, id: string): number {
  const c = coisa(id);
  if (!c) return 0;
  const frete = temLojaNaCidade(v, c.loja) ? 1 : 1.1;
  return Math.round(c.preco * economiaLocal(v.moradia.municipioId).custo * frete / 10) * 10;
}

/** O que a coisa ainda vale, vendida usada: o que sobra da vida útil, o estado, e a metade que o mercado de usados paga. */
export function valorDeRevenda(v: Vida, t: CoisaTida): number {
  const c = coisa(t.coisaId);
  if (!c) return 0;
  const anos = (v.t - t.t) / 12;
  const resta = clamp(1 - anos / c.vida, 0.1, 1);
  return Math.round(t.preco * resta * (t.estado / 100) * 0.5 / 10) * 10;
}

/** O calor de verdade, que faz do ar-condicionado outra coisa: no Brasil, fora do Sul; no mundo, os países e estados quentes. */
const PAISES_QUENTES = new Set(['NG', 'IN', 'MX', 'CO', 'DO', 'CR', 'KE', 'AO', 'MA', 'AU']);
const DIVISOES_QUENTES = new Set(['US-TX', 'US-FL', 'US-GA', 'US-CA', 'ZA-KZN', 'ZA-LP', 'ES-AN', 'PE-LIM', 'PE-PIU', 'CN-GD', 'CN-GX']);
export function fazCalor(municipioId: string): boolean {
  const m = municipio(municipioId);
  const pais = paisDaCidade(municipioId);
  if (pais === 'BR') return m.regiao !== 'Sul';
  return PAISES_QUENTES.has(pais) || DIVISOES_QUENTES.has(`${pais}-${m.uf}`);
}

/* ------------------------------------------------------------- Comprar */

export function disponibilidadeComprarCoisa(v: Vida, id: string): Veredito {
  const c = coisa(id);
  if (!c) return bloqueio('impossivel', 'Isso não existe na loja.');
  const i = idade(v);
  if (i < (c.idadeMin ?? 12)) return bloqueio('impossivel', i < 12 ? 'Com essa idade, quem compra são os adultos da casa.' : `A partir dos ${c.idadeMin} anos.`);
  const a = autonomia(v, 'compra_pessoal');
  if (a.grau !== 'permitido') return a;
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  // Os móveis e os eletrodomésticos da casa da família são da família (e decisão dos adultos dela).
  if (c.daCasa && moraComFamiliaDeOrigem(v)) return bloqueio('impossivel', 'Na casa da família, os móveis e os eletrodomésticos são decisão dos adultos da casa.');
  if (id === 'prancha' && !pertoDaAgua(v.moradia.municipioId)) return bloqueio('impossivel', 'Longe do mar, a prancha vira enfeite de parede.');
  if (temCoisa(v, id)) return bloqueio('incompativel', `Você já tem ${c.artigo} ${c.nome}.`);
  return vereditoDePagar(v, precoDaCoisa(v, id));
}

export function comprarCoisa(v: Vida, id: string): string {
  const c = coisa(id)!;
  const preco = precoDaCoisa(v, id);
  pagar(v, preco);
  (v.financas.coisas ??= []).push({ id: novoId(v, 'cs'), coisaId: id, t: v.t, preco, estado: 100 });
  // Só o que marca vai para a Linha da Vida (o primeiro instrumento, o primeiro computador, o piano); o resto é compra.
  const marca = c.loja === 'instrumentos' || id === 'computador' || id === 'notebook' || preco >= 8000;
  if (marca) escrever(v, { texto: `Comprou ${c.artigo} ${c.nome}.`, relevancia: c.loja === 'instrumentos' || id === 'piano' ? 'biografia' : 'cotidiano', tema: c.loja === 'instrumentos' ? 'lazer' : 'casa', escolha: true });
  const online = temLojaNaCidade(v, c.loja) ? '' : ' Veio pela internet: na cidade não há loja disso.';
  return `${cap(c.artigo)} ${c.nome} é seu agora, por ${fmt(preco)}.${online} ${efeitoEmPalavras(v, c)}`.trim();
}

/* ------------------------------------------------------------- Vender */

export function disponibilidadeVenderCoisa(v: Vida, coisaTidaId: string): Veredito {
  const t = coisasDaVida(v).find(x => x.id === coisaTidaId);
  if (!t) return bloqueio('impossivel', 'Isso não é mais seu.');
  return PERMITIDO;
}

export function venderCoisa(v: Vida, coisaTidaId: string): string {
  const t = coisasDaVida(v).find(x => x.id === coisaTidaId)!;
  const c = coisa(t.coisaId)!;
  const valor = valorDeRevenda(v, t);
  v.financas.conta += valor;
  v.financas.coisas = coisasDaVida(v).filter(x => x !== t);
  return valor > 0 ? `Vendeu ${c.artigo} ${c.nome} usad${c.artigo === 'a' || c.artigo === 'as' ? 'a' : 'o'} por ${fmt(valor)}.` : `Deu ${c.artigo} ${c.nome}: usad${c.artigo === 'a' ? 'a' : 'o'} assim, ninguém pagaria.`;
}

/* ---------------------------------------------------------- O que muda */

/** Quanto as suas coisas somam à prática de uma atividade (0.25 = +25% de qualidade), com teto. */
export function bonusDaAtividade(v: Vida, rotinaId: string): number {
  let soma = 0;
  for (const t of coisasDaVida(v)) soma += coisa(t.coisaId)?.ajuda?.[rotinaId] ?? 0;
  return Math.min(0.5, soma);
}

/** O que a coisa faz, em palavras (na loja e depois da compra). */
export function efeitoEmPalavras(v: Vida, c: Coisa): string {
  const partes: string[] = [];
  if (c.ajuda) partes.push('rende mais em atividades que você pratica');
  if (c.alivio && (!c.calor || fazCalor(v.moradia.municipioId))) partes.push('tira um peso da semana');
  if (c.calor && !fazCalor(v.moradia.municipioId)) partes.push('aqui quase não faz calor: vai ficar desligado');
  if (c.lazer) partes.push('é descanso');
  return partes.length ? `${cap(partes.join('; '))}.` : '';
}

/** As atividades que uma coisa ajuda (os nomes vêm de quem chama: `rotinas`). */
export const atividadesQueAjuda = (c: Coisa): string[] => Object.keys(c.ajuda ?? {});

/**
 * O ano das coisas: cada uma se gasta pela vida útil (com acaso derivado);
 * a que chega ao fim quebra — e a vida escreve isso quando importa. O que
 * fica: o peso que tiram da casa (na cabeça) e o descanso que dão.
 */
export function processarCoisas(v: Vida): void {
  const lista = coisasDaVida(v);
  if (!lista.length) return;
  const quebradas: CoisaTida[] = [];
  for (const t of lista) {
    const c = coisa(t.coisaId);
    if (!c) { quebradas.push(t); continue; }
    const r = rngDe(v.id, 'coisa', t.id, v.t);
    t.estado = clamp(Math.round(t.estado - (100 / c.vida) * (0.75 + r.next() * 0.5)), 0, 100);
    if (t.estado <= 0) quebradas.push(t);
  }
  for (const t of quebradas) {
    const c = coisa(t.coisaId);
    if (c) escrever(v, { texto: `${cap(c.artigo)} ${c.nome} chegou ao fim, depois de ${Math.max(1, Math.round((v.t - t.t) / 12))} ${Math.round((v.t - t.t) / 12) === 1 ? 'ano' : 'anos'} de uso.`, relevancia: c.loja === 'instrumentos' || c.preco >= 8000 ? 'biografia' : 'cotidiano', tema: 'casa' });
  }
  v.financas.coisas = lista.filter(t => !quebradas.includes(t));
  // O que fica: menos peso da casa (para quem cuida da própria casa) e descanso.
  const calor = fazCalor(v.moradia.municipioId);
  const daPropriaCasa = !moraComFamiliaDeOrigem(v);
  let alivio = 0, lazer = 0;
  for (const t of coisasDaVida(v)) {
    const c = coisa(t.coisaId);
    if (!c) continue;
    if (c.alivio && daPropriaCasa && (!c.calor || calor)) alivio += c.alivio;
    if (c.lazer) lazer += c.lazer;
  }
  if (alivio) v.mente.estresse = clamp(v.mente.estresse - Math.min(6, alivio));
  if (lazer) v.mente.felicidade = clamp(v.mente.felicidade + Math.min(3, lazer * 0.5));
}

/**
 * Mudança de país: o que é da casa (móveis, eletrodomésticos, o piano) fica —
 * vendido pelo valor de usado; o resto (o celular, o notebook, o violão) vai
 * na mala. Devolve o que entrou na conta.
 */
export function coisasNaMudancaDePais(v: Vida): number {
  const ficam = coisasDaVida(v).filter(t => coisa(t.coisaId)?.daCasa);
  if (!ficam.length) return 0;
  const valor = ficam.reduce((s, t) => s + valorDeRevenda(v, t), 0);
  v.financas.conta += valor;
  lancar(v, 'Móveis e eletrodomésticos vendidos antes da mudança de país', 'escolha', valor);
  v.financas.coisas = coisasDaVida(v).filter(t => !ficam.includes(t));
  return valor;
}

/** O catálogo de uma loja. */
export const coisasDaLoja = (loja: LojaDeCoisas) => COISAS.filter(c => c.loja === loja);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
