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
import { variantesDaCoisa } from '../dados/pertences';
import { economiaLocal, municipio, nivelDeOferta, paisDaCidade, pertoDaAgua } from '../dados/lugares';
import { pagar, vereditoDePagar } from './dinheiro';
import { autonomia } from './autonomia';
import { moraComFamiliaDeOrigem } from './domicilio';
import { lancar } from './extrato';
import { dinheiro as fmt } from '../texto';
import { bonusDosComodos, naCasaAtual } from './lar';
import { afetoDe, registrarNoObjeto } from './memoriaDosObjetos';

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
  // REWORK 10.5 · ECO-04: dos 8 aos 11, o que é próprio da idade (o violino, a chuteira, o tabuleiro) dá para comprar com
  // o dinheiro guardado — com a família junto. Antes, a loja abria aos 10 e o motor só deixava aos 12.
  const crianca = i >= 8 && i < 12 && (c.idadeMin ?? 12) <= i;
  const a = crianca ? PERMITIDO : autonomia(v, 'compra_pessoal');
  if (a.grau !== 'permitido') return a;
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  // Os móveis e os eletrodomésticos da casa da família são da família (e decisão dos adultos dela).
  if (c.daCasa && moraComFamiliaDeOrigem(v)) return bloqueio('impossivel', 'Na casa da família, os móveis e os eletrodomésticos são decisão dos adultos da casa.');
  if (id === 'prancha' && !pertoDaAgua(v.moradia.municipioId)) return bloqueio('impossivel', 'Longe do mar, a prancha vira enfeite de parede.');
  // REWORK 12.4: os discos se compram de lote em lote (a coleção cresce); o resto, um de cada.
  if (temCoisa(v, id) && id !== 'discos') return bloqueio('incompativel', `Você já tem ${c.artigo} ${c.nome}.`);
  return vereditoDePagar(v, precoDaCoisa(v, id));
}

export function comprarCoisa(v: Vida, id: string): string {
  const c = coisa(id)!;
  const preco = precoDaCoisa(v, id);
  pagar(v, preco);
  const lote = id === 'discos' ? coisasDaVida(v).find(x => x.coisaId === 'discos') : undefined;
  if (lote) {
    lote.quantidade = (lote.quantidade ?? 1) + 1;
    lote.preco += preco;
    registrarNoObjeto(lote, v.t, `Mais um lote de discos (${fmt(preco)}).`);
    return `Mais um lote no sebo: a coleção passa de ${lote.quantidade * 25} discos.`;
  }
  receberCoisa(v, id, preco);
  const online = temLojaNaCidade(v, c.loja) ? '' : ' Veio pela internet: na cidade não há loja disso.';
  // REWORK 7: a concordância da frase ("A estante de livros é sua", "Os livros são seus") — e o nome que já traz o
  // artigo ("uma estante de livros") não ganha outro na frente ("A uma estante…").
  const nome = /^(um|uma) /.test(c.nome) ? c.nome.replace(/^um /, 'o ').replace(/^uma /, 'a ') : `${c.artigo} ${c.nome}`;
  const seu = c.artigo === 'a' ? 'é sua' : c.artigo === 'os' ? 'são seus' : c.artigo === 'as' ? 'são suas' : 'é seu';
  return `${cap(nome)} ${seu} agora, por ${fmt(preco)}.${online} ${efeitoEmPalavras(v, c)}`.trim();
}

/** A coisa passa a ser sua (comprada por você, ou dada — REWORK 10.6: o adulto que compra para a criança). */
export function receberCoisa(v: Vida, id: string, preco: number, dada = false): CoisaTida {
  const c = coisa(id)!;
  const nova: CoisaTida = { id: novoId(v, 'cs'), coisaId: id, t: v.t, preco, estado: 100 };
  // A cor e o acabamento desta coisa (o violão de madeira escura, a raquete vermelha): da compra para sempre.
  const vs = variantesDaCoisa(id);
  const x = vs[Math.floor(rngDe(nova.id, 'cor').next() * vs.length)];
  nova.cor = x.cor; nova.acabamento = x.nome;
  // REWORK 12.4: de onde veio (a memória do objeto): o presente de quem cuida, o primeiro instrumento.
  if (dada) nova.memoria = { origem: 'presente' };
  else if (c.loja === 'instrumentos' && id !== 'discos' && !coisasDaVida(v).some(x => coisa(x.coisaId)?.loja === 'instrumentos' && x.coisaId !== 'discos')) nova.memoria = { origem: 'compra', motivo: 'o primeiro instrumento', afeto: 20 };
  (v.financas.coisas ??= []).push(nova);
  // Só o que marca vai para a Linha da Vida (o primeiro instrumento, o primeiro computador, o piano); o resto é compra.
  const marca = c.loja === 'instrumentos' || id === 'computador' || id === 'notebook' || preco >= 8000;
  if (marca && !dada) escrever(v, { texto: `Comprou ${/^(um|uma) /.test(c.nome) ? c.nome : `${c.artigo} ${c.nome}`}.`, relevancia: c.loja === 'instrumentos' || id === 'piano' ? 'biografia' : 'cotidiano', tema: c.loja === 'instrumentos' ? 'lazer' : 'casa', escolha: true });
  return nova;
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
  // REWORK 12.4: o que tinha história sai com a história escrita (o valor afetivo não entra no preço).
  if (afetoDe(v, t) >= 45) escrever(v, { texto: `Vendeu ${c.artigo} ${c.nome}${t.memoria?.de ? ` que tinha sido de ${t.memoria.de}` : ''}. Foi junto um pedaço da história.`, relevancia: 'cotidiano', tema: 'casa', escolha: true });
  v.financas.conta += valor;
  v.financas.coisas = coisasDaVida(v).filter(x => x !== t);
  return valor > 0 ? `Vendeu ${c.artigo} ${c.nome} usad${c.artigo === 'a' || c.artigo === 'as' ? 'a' : 'o'} por ${fmt(valor)}.` : `Deu ${c.artigo} ${c.nome}: usad${c.artigo === 'a' ? 'a' : 'o'} assim, ninguém pagaria.`;
}

/* ---------------------------------------------------------- O que muda */

/** Quanto as suas coisas somam à prática de uma atividade (0.25 = +25% de qualidade), com teto. */
export function bonusDaAtividade(v: Vida, rotinaId: string): number {
  let soma = 0;
  // REWORK 12.4: só ajuda o que está com você (o violão guardado no depósito não toca) — e o cômodo equipado soma.
  for (const t of coisasDaVida(v)) if (naCasaAtual(t) && !t.lembranca) soma += coisa(t.coisaId)?.ajuda?.[rotinaId] ?? 0;
  return Math.min(0.5, soma + bonusDosComodos(v, rotinaId));
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
    if (t.lembranca) continue;
    const r = rngDe(v.id, 'coisa', t.id, v.t);
    // REWORK 12.4: o que está guardado (depósito, outra casa) quase não se gasta; emprestado, gasta como em uso.
    const guardada = !!t.local && !t.emprestadaA ? 0.25 : 1;
    t.estado = clamp(Math.round(t.estado - (100 / c.vida) * (0.75 + r.next() * 0.5) * guardada), 0, 100);
    if (t.estado <= 0) quebradas.push(t);
  }
  const guardadas: CoisaTida[] = [];
  for (const t of quebradas) {
    const c = coisa(t.coisaId);
    // REWORK 12.4: o que tem história não vai para o lixo quando para de funcionar — fica guardado como lembrança.
    const fica = !!c && afetoDe(v, t) >= 45;
    if (fica) { t.lembranca = true; t.emprestadaA = undefined; registrarNoObjeto(t, v.t, 'Parou de funcionar. Ficou guardado como lembrança.'); guardadas.push(t); }
    if (c) escrever(v, { texto: `${cap(c.artigo)} ${c.nome} chegou ao fim, depois de ${Math.max(1, Math.round((v.t - t.t) / 12))} ${Math.round((v.t - t.t) / 12) === 1 ? 'ano' : 'anos'} de uso.${fica ? ' Não teve coragem de jogar fora.' : ''}`, relevancia: c.loja === 'instrumentos' || c.preco >= 8000 ? 'biografia' : 'cotidiano', tema: 'casa' });
  }
  v.financas.coisas = lista.filter(t => !quebradas.includes(t) || guardadas.includes(t));
  // O que fica: menos peso da casa (para quem cuida da própria casa) e descanso.
  const calor = fazCalor(v.moradia.municipioId);
  const daPropriaCasa = !moraComFamiliaDeOrigem(v);
  let alivio = 0, lazer = 0;
  for (const t of coisasDaVida(v)) {
    const c = coisa(t.coisaId);
    if (!c || !naCasaAtual(t) || t.lembranca) continue;
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
  // REWORK 12.4: só o que está na casa (o que está guardado noutro lugar fica onde está) e o que não tem história:
  // o piano da avó vai de navio, com frete.
  const daCasa = coisasDaVida(v).filter(t => coisa(t.coisaId)?.daCasa && naCasaAtual(t) && !t.lembranca);
  const vaoJunto = daCasa.filter(t => afetoDe(v, t) >= 45);
  if (vaoJunto.length) {
    const frete = Math.round(vaoJunto.reduce((s, t) => s + Math.max(800, t.preco * 0.15), 0) / 10) * 10;
    v.financas.conta -= frete;
    lancar(v, 'Frete internacional dos móveis de família', 'escolha', -frete);
    for (const t of vaoJunto) registrarNoObjeto(t, v.t, 'Atravessou o oceano na mudança, num contêiner.');
  }
  const ficam = daCasa.filter(t => !vaoJunto.includes(t));
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
