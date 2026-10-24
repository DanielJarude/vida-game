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
import { nomePor } from './notoriedade';
import { papelNaMusica } from './musica';
import { economiaLocal } from '../dados/lugares';

const custoLocal = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;

export const LINGUAGENS_DE_PALCO: Dominio[] = ['musica', 'teatro', 'danca'];
/**
 * Trilhas de trabalho em que a renda É a agenda de apresentações (não um salário).
 * REWORK 11 · ATR-01: o ator saiu daqui. A temporada de palco virava o "salário" do ator — e por cima entravam o cachê
 * de cada produção (inclusive das peças), a bilheteria e o patrocínio: o mesmo ofício pago três ou quatro vezes. A renda
 * do ator é o CACHÊ de cada trabalho (`audiovisual.cacheAudiovisual`); o salário dele são os trabalhos miúdos (aula,
 * leitura, dublagem), com teto (`trabalho.processarClientela`).
 */
const TRILHAS_DE_PALCO: Record<string, Dominio> = { musica: 'musica' };
/** REWORK 11 · ATR-03: o teto do valor contratado de uma apresentação por linguagem (a peça não é contratada como um show de estádio). */
const TETO_DA_APRESENTACAO: Partial<Record<Dominio, number>> = { musica: 1_200_000, teatro: 25_000, danca: 15_000 };
/** REWORK 11 · MUS-01: um ano não cabe mais de tantas datas (o resto da agenda é ensaio, estrada, gravação). */
export const TETO_DE_DATAS = 120;
/** REWORK 11 · ATR-02: a freguesia do trabalho conta como alcance só até aqui — o nome grande vem de obra e de público. */
const TETO_FREGUESIA_NO_ALCANCE = 30;
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
  const freguesia = trabalhoDePalco(v) ? Math.min(TETO_FREGUESIA_NO_ALCANCE, (v.trabalho.atual?.clientela ?? 0) * 0.6) : 0;
  const noto = nomePor(v, 'arte');
  // REWORK 11 · MUS-02: quem toca CONTRATADO por outro artista (o instrumentista da banda de alguém) é pago pela data,
  // não pelo nome próprio: o alcance que conta é o do mercado de quem contrata, com teto.
  const contratado = papelNaMusica(v) === 'contratado' && d === 'musica';
  // O nome conta um pouco menos que o público que paga ingresso (gente que conhece o nome nem sempre vai ao show).
  const x = Math.max(publico, freguesia, noto * 0.85);
  // A técnica mexe um pouco (para cima, no máximo +3: o virtuose sem público não lota estádio).
  return clamp((contratado ? Math.min(45, Math.max(x, 30)) : x) + clamp((habilidade(v, d) - 60) / 8, -6, 3), 0, 100);
}

/**
 * REWORK 11 · MUS-01: o público sobe cada vez mais devagar quanto maior ele já é (a sala que lota não vira estádio num
 * ano). Antes, um ano de shows, disco e turnê levava a banda de 45 a 70+ de público — e o cachê exponencial ia junto.
 * Perdas (o público que esquece) entram inteiras.
 */
export function subirPublico(atual: number, quanto: number): number {
  if (quanto <= 0) return clamp(atual + quanto, 0, 100);
  const folga = Math.max(0.05, 1 - atual / 100);
  return clamp(atual + quanto * folga * folga, 0, 100);
}

/** O valor contratado de UMA apresentação (bruto), para o alcance de agora. */
export function cacheDeApresentacao(v: Vida, d: Dominio): number {
  const x = alcanceNoPalco(v, d);
  // REWORK 11 · ATR-03: a curva começa mais baixo (a banda com público fiel na cidade cobra uns poucos milhares, não R$ 20
  // mil por show) e ganhou teto por linguagem. O topo continua raro e perto do milhão no show de música; teatro e dança
  // têm teto de sala.
  // REWORK 11.5 · ART-03: a cauda do topo começa um pouco mais acima (17% dos músicos ativos tinham um ano de R$ 1 mi;
  // o grande sucesso continua possível, mais raro).
  const bruto = 330 * Math.exp(x / 16) * (x > 75 ? Math.exp((x - 75) / 14) : 1) * (ESCALA[d] ?? 0.3);
  return Math.round(Math.min(TETO_DA_APRESENTACAO[d] ?? 25_000, bruto) / 100) * 100;
}

/** REWORK 11 · MUS-01: quantas datas um ano comum desse alcance teria (sem a sorte do ano): a régua da turnê. */
export function datasEsperadas(v: Vida, d: Dominio): number {
  return Math.pow(Math.max(0, alcanceNoPalco(v, d)) / 10, 1.3) * (trabalhoDePalco(v) ? 1.15 : 1);
}

/** Quanto do valor contratado vai para custos: pouco no bar da esquina; a maior parte na turnê grande. */
// REWORK 11: a estrutura do show grande come mais (equipe, palco, logística): até 70%.
export const parteDosCustos = (alcance: number) => clamp(0.3 + 0.4 * (alcance / 100), 0.3, 0.7);

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
  // REWORK 11 · MUS-01: quem vive do palco tem um pouco mais de datas (×1,15, antes ×1,4); a agenda tem teto; e a turnê do
  // ano (`conteudo/profissao.estrada`) ocupa datas DESTA temporada — já foi paga lá, não se soma de novo.
  const papel = papelNaMusica(v);
  const fatorPapel = d !== 'musica' ? 1 : papel === 'compositor' ? 0.45 : papel === 'contratado' ? 1.25 : 1;
  const agenda = Math.pow(Math.max(0, x) / 10, 1.3) * ano * (ensaia ? 1 : 0.4) * (trabalhoDePalco(v) ? 1.15 : 1) * fatorPapel;
  const naEstrada = v.fatos['estrada_t'] !== undefined && v.t - v.fatos['estrada_t'] < 12 ? v.fatos['estrada_datas'] ?? 0 : 0;
  const apresentacoes = Math.max(0, Math.min(TETO_DE_DATAS, Math.round(agenda)) - naEstrada);
  const cacheMedio = cacheDeApresentacao(v, d);
  const bruto = apresentacoes * cacheMedio;
  const custos = Math.round(bruto * parteDosCustos(x) / 100) * 100;
  const palco: Palco = { ano: anoDe(v.t - 6), linguagem: d, apresentacoes, cacheMedio, bruto, custos, artista: bruto - custos };
  v.caminhos.palco = palco;
  // O ano no palco entra na história (o `palco` guarda só o último; o histórico de shows e temporadas fica aqui).
  if (apresentacoes > 0) { (v.caminhos.palcos ??= []).push({ ano: palco.ano, linguagem: d, apresentacoes, bruto }); if (v.caminhos.palcos.length > 60) v.caminhos.palcos.splice(0, v.caminhos.palcos.length - 60); }
  // Quem vive do palco: a renda do trabalho É o que o palco deixou (média do ano, variável).
  // REWORK 11.5 · ART-02: quem vive de música não vive só do palco — há as aulas, as gravações para outros artistas, o
  // estúdio (o que o músico parado tinha era ~R$ 6 mil no ano). Pela técnica, no custo do lugar, e menos quando a agenda
  // de shows come o tempo. Trabalho intermitente: varia com o ano.
  if (d === 'musica' && trabalhoDePalco(v)) {
    const h = habilidade(v, 'musica');
    const tempo = 1 - Math.min(0.75, apresentacoes / 110);
    palco.freelas = Math.round(clamp((h - 35) * 45, 250, 2800) * 12 * tempo * (0.6 + r.next() * 0.7) * (custoLocal(v) / 100) / 100) * 100;
  }
  const e = v.trabalho.atual;
  if (e && trabalhoDePalco(v)) e.salario = Math.max(0, Math.round((palco.artista + (palco.freelas ?? 0)) / 12 / 10) * 10);
  return palco;
}

/** O palco como renda de quem NÃO vive dele (a banda do fim de semana): média mensal do último ano. */
export function rendaDoPalcoParalelo(v: Vida): number {
  const p = v.caminhos.palco;
  if (!p || trabalhoDePalco(v)) return 0;
  return Math.round(p.artista * 0.93 / 12 / 10) * 10;
}
