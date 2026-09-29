/**
 * A economia do palco: música, teatro, dança.
 *
 *   VALOR CONTRATADO DO SHOW ≠ RENDA DO ARTISTA.
 *
 * O contratante paga um valor global pela apresentação; dele saem banda e
 * equipe, produção, transporte, hospedagem, agência e impostos. O que fica é o
 * cachê do artista — e ele depende de quantas datas o ano teve, que não são
 * garantidas. A escada emerge do estado (público do projeto, a freguesia do
 * trabalho artístico, a notoriedade vinda da arte, a habilidade), não de
 * faixas fixas:
 *
 *   início/local — poucas datas, poucos milhares por show, arte ainda não sustenta;
 *   regional     — mais datas, valores maiores, ainda instável;
 *   reconhecido  — dezenas de milhares por show, a agenda sustenta;
 *   nacional     — centenas de milhares contratados por show;
 *   topo, raro   — perto (ou acima) de R$ 1 milhão contratado, com custos grandes.
 *
 * Valores em reais de hoje (o jogo não infla preços: `sistemas/renda`).
 * Publicidade e patrocínio são outra renda (`notoriedade.rendaDeImagem`).
 * Escrita, desenho e fotografia não vivem de apresentação: a obra (`arte.lancarObra`) é a economia deles.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Palco, Vida } from '../tipos';
import { habilidade } from './frentes';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { anoDe } from '../tempo';

export const LINGUAGENS_DE_PALCO: Dominio[] = ['musica', 'teatro', 'danca'];
/** Trilhas de trabalho em que a renda É a agenda de apresentações (não um salário). */
const TRILHAS_DE_PALCO: Record<string, Dominio> = { musica: 'musica', cena: 'teatro' };
/** Uma apresentação de teatro ou de dança não é contratada como um show de música. */
const ESCALA: Partial<Record<Dominio, number>> = { musica: 1, teatro: 0.3, danca: 0.22 };

/** A linguagem de palco desta vida agora (o trabalho artístico ou o projeto ativo). */
export function linguagemDePalco(v: Vida): Dominio | undefined {
  const oc = v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId) : undefined;
  if (oc && TRILHAS_DE_PALCO[oc.trilha] && oc.id !== 'produtor_musical') return TRILHAS_DE_PALCO[oc.trilha];
  const p = v.caminhos.arte;
  if (p?.ativo && LINGUAGENS_DE_PALCO.includes(p.linguagem) && p.publico >= 15) return p.linguagem;
  return undefined;
}

/** O trabalho é de palco: a renda dele sai daqui (e não da tabela de freguesia). */
export function trabalhoDePalco(v: Vida): boolean {
  const oc = v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId) : undefined;
  return !!oc && !!TRILHAS_DE_PALCO[oc.trilha] && oc.id !== 'produtor_musical';
}

/** O tamanho do nome no palco, 0..100: público, freguesia, notoriedade pela arte — o maior deles. */
export function alcanceNoPalco(v: Vida, d: Dominio): number {
  const p = v.caminhos.arte;
  const publico = p?.ativo && p.linguagem === d ? p.publico : 0;
  const freguesia = trabalhoDePalco(v) ? (v.trabalho.atual?.clientela ?? 0) * 0.6 : 0;
  const noto = v.notoriedade?.fonte === 'arte' ? v.notoriedade.valor : 0;
  return clamp(Math.max(publico, freguesia, noto) + (habilidade(v, d) - 60) / 8, 0, 100);
}

/** O valor contratado de UMA apresentação (bruto), para o alcance de agora. */
export function cacheDeApresentacao(v: Vida, d: Dominio): number {
  const x = alcanceNoPalco(v, d);
  return Math.round(1500 * Math.exp(x / 15.6) * (ESCALA[d] ?? 0.3) / 100) * 100;
}

/** Quanto do valor contratado vai para custos: pouco no bar da esquina; a maior parte na turnê grande. */
export const parteDosCustos = (alcance: number) => clamp(0.3 + 0.35 * (alcance / 100), 0.3, 0.65);

/**
 * O ano no palco: quantas datas vieram (irregular: depende do alcance, do
 * ensaio, da cena — e do ano), quanto os contratantes pagaram, quanto custou,
 * quanto ficou. Fica gravado em `caminhos.palco` (o que a tela e o dinheiro leem).
 */
export function temporadaDePalco(v: Vida, r: Rng): Palco | undefined {
  const d = linguagemDePalco(v);
  if (!d) { v.caminhos.palco = undefined; return undefined; }
  const x = alcanceNoPalco(v, d);
  const ensaia = v.rotinas.some(rt => rt.id === d) || trabalhoDePalco(v);
  // O ano do palco é irregular: há anos magros (a agenda some, o público esquece, o contratante não liga) e anos bons.
  const sorte = r.next();
  const ano = sorte < 0.18 ? 0.15 + r.next() * 0.25 : sorte > 0.85 ? 1.4 + r.next() * 0.5 : 0.6 + r.next() * 0.7;
  const agenda = Math.pow(Math.max(0, x) / 10, 1.45) * ano * (ensaia ? 1 : 0.4) * (trabalhoDePalco(v) ? 1.4 : 1);
  const apresentacoes = Math.max(0, Math.round(agenda));
  const cacheMedio = cacheDeApresentacao(v, d);
  const bruto = apresentacoes * cacheMedio;
  const custos = Math.round(bruto * parteDosCustos(x) / 100) * 100;
  const palco: Palco = { ano: anoDe(v.t - 6), linguagem: d, apresentacoes, cacheMedio, bruto, custos, artista: bruto - custos };
  v.caminhos.palco = palco;
  // Quem vive do palco: a renda do trabalho É o que o palco deixou (média do ano, variável).
  const e = v.trabalho.atual;
  if (e && trabalhoDePalco(v)) e.salario = Math.max(0, Math.round(palco.artista / 12 / 10) * 10);
  return palco;
}

/** O palco como renda de quem NÃO vive dele (a banda do fim de semana): média mensal do último ano. */
export function rendaDoPalcoParalelo(v: Vida): number {
  const p = v.caminhos.palco;
  if (!p || trabalhoDePalco(v)) return 0;
  return Math.round(p.artista * 0.93 / 12 / 10) * 10;
}
