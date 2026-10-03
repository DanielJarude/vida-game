/**
 * A casa de origem: de onde a pessoa veio — e o que essa casa PODE hoje.
 *
 * A classe social registrada no nascimento é o ponto de partida, não o
 * destino. O que a família pode fazer por alguém (pagar um curso, ajudar numa
 * mudança, segurar uma emergência) vem de três coisas reais, lidas do estado:
 *
 *   - RECURSOS: a renda de quem sustenta a casa agora (os pais perdem e
 *     arrumam emprego, se aposentam, se separam) dividida por quem vive dela,
 *     e a RESERVA que a família guardou — que cresce nos anos folgados,
 *     encolhe nos apertados, e diminui a cada ajuda. Não é infinita.
 *   - RELAÇÃO: quem está perto ajuda mais do que quem está brigado ou longe.
 *     Um pai que nunca esteve por perto raramente é a quem se pede.
 *   - NECESSIDADE E HISTÓRIA: uma emergência pesa mais que uma mudança; quem
 *     já pediu muito nos últimos anos encontra menos.
 *
 * Não existe "pais pobres nunca ajudam" nem "pais ricos pagam tudo": uma
 * família apertada ainda junta o que pode numa emergência; uma família com
 * dinheiro pode dizer não. E o sentido também se inverte: a família pode
 * precisar — e pedir (`iniciativas`, pelo aperto de quem sustenta a casa).
 *
 * Fonte única para: mesada, contribuição de quem mora com a família, o que
 * os pais conseguem pagar do estudo, o cursinho, o pedido de ajuda.
 */

import { textoLocalEm } from '../mundo/locais';
import { converterEntrePaises } from '../mundo/moeda';
import { paisDaPessoa, paisDaVida } from '../mundo/vida';
import type { Rng } from '../rng';
import { clamp, criarRng } from '../rng';
import type { ApoioFamiliar, Classe, Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { economiaLocal, municipio } from '../dados/lugares';
import { dinheiro as fmt, flex } from '../texto';
import { moraComFamiliaDeOrigem } from './domicilio';
import { autonomia } from './autonomia';

/* ------------------------------------------------------------ Quem é a casa */

const RESPONSAVEIS = new Set(['mae', 'pai', 'madrasta', 'padrasto']);

/** Quem criou (e ainda pode ser "a família" a quem se recorre): pais vivos e a avó que criou. */
export function responsaveis(v: Vida): { p: Pessoa; vin: Vinculo }[] {
  return vinculosVivos(v).filter(x => !x.p.especie && (RESPONSAVEIS.has(x.vin.parentesco ?? '') || x.p.id === v.origem.responsavelId || (x.vin.parentesco === 'avo' && v.origem.arranjo === 'avos' && x.vin.proximidade >= 70)));
}

/**
 * A pessoa da família a quem se recorre primeiro: a mais próxima entre quem
 * tem como ajudar (o afeto pesa mais que a renda — ninguém pede ao pai
 * ausente só porque ele ganha mais).
 */
export function principal(v: Vida): { p: Pessoa; vin: Vinculo } | undefined {
  const rs = responsaveis(v);
  return [...rs].sort((a, b) => (b.vin.proximidade - b.vin.tensao * 0.5 + (b.p.renda > 0 ? 8 : 0)) - (a.vin.proximidade - a.vin.tensao * 0.5 + (a.p.renda > 0 ? 8 : 0)))[0];
}

/** A casa de quem é a principal: ela e quem mora com ela (parceria entre responsáveis, a avó que criou). */
function casaDaPrincipal(v: Vida): Pessoa[] {
  const pr = principal(v);
  if (!pr) return [];
  const rs = responsaveis(v).map(x => x.p);
  return rs.filter(p => p.id === pr.p.id || p.parceiroId === pr.p.id || pr.p.parceiroId === p.id || (p.municipioId === pr.p.municipioId && v.origem.arranjo === 'avos' && v.vinculos[p.id]?.parentesco === 'avo'));
}

/** Quem ainda vive da renda da casa de origem (irmãos menores; você, se mora lá). */
function dependentes(v: Vida): number {
  const pr = principal(v);
  if (!pr) return 0;
  const i = idade(v);
  const irmaosMenores = vinculosVivos(v).filter(x => (x.vin.parentesco === 'irmao' || x.vin.parentesco === 'meio_irmao') && idadePessoa(v, x.p) < 18 && x.p.municipioId === pr.p.municipioId).length;
  const eu = moraComFamiliaDeOrigem(v) && v.moradia.tipo === 'pais' ? (i < 18 || !(v.trabalho.atual) ? 1 : 0.5) : 0;
  return irmaosMenores + eu;
}

/** Renda mensal da casa de origem (de quem a sustenta agora). */
export function rendaDaOrigem(v: Vida): number {
  return casaDaPrincipal(v).reduce((s, p) => s + Math.max(0, p.renda || 0), 0);
}

export type Folga = 0 | 1 | 2 | 3 | 4;
export const PALAVRA_FOLGA: Record<Folga, string> = { 0: 'no limite', 1: 'apertada', 2: 'com o básico, sem folga', 3: 'com alguma folga', 4: 'confortável' };

export interface RecursosDaFamilia {
  /** Renda mensal da casa de origem. */
  renda: number;
  /** Por pessoa que vive dela (ajustado pelo custo de vida da cidade dela). */
  porPessoa: number;
  folga: Folga;
  reserva: number;
  /** Alguém ainda sustenta essa casa. */
  existe: boolean;
}

/**
 * MUNDO: a casa de origem conta na moeda do país onde ELA está. Para quem
 * mora em outro país, o que a família manda atravessa pelo câmbio — este é
 * o fator (1 quando moram no mesmo país). A reserva continua guardada na
 * unidade de lá; quem tira dela divide por ele.
 */
export function cambioDaFamilia(v: Vida): number {
  const pr = principal(v);
  return pr ? converterEntrePaises(1, paisDaPessoa(pr.p), paisDaVida(v)) : 1;
}

export function recursosDaFamilia(v: Vida): RecursosDaFamilia {
  const pr = principal(v);
  if (!pr) return { renda: 0, porPessoa: 0, folga: 0, reserva: 0, existe: false };
  const casa = casaDaPrincipal(v);
  const renda = rendaDaOrigem(v);
  const custo = economiaLocal(pr.p.municipioId).custo;
  const porPessoa = renda / Math.max(1, casa.length + dependentes(v)) / Math.max(0.6, custo);
  const folga: Folga = porPessoa < 700 ? 0 : porPessoa < 1300 ? 1 : porPessoa < 2600 ? 2 : porPessoa < 6000 ? 3 : 4;
  // A folga é a de lá (no custo de lá); a renda e a reserva, vistas daqui (pelo câmbio).
  const k = cambioDaFamilia(v);
  return { renda: Math.round(renda * k), porPessoa: Math.round(porPessoa), folga, reserva: Math.round((v.origem.reserva ?? 0) * k), existe: true };
}

/* --------------------------------------------------------------- A reserva */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/** A reserva com que a família começa (do ponto de partida — e com variação: família não é carimbo). */
export function reservaInicial(id: string, classe: Classe): number {
  const base = { vulneravel: 300, trabalhadora: 1800, media_baixa: 7000, media: 28000, alta: 160000 }[classe];
  return Math.round(base * (0.4 + hash(`${id}:reserva`) * 1.2) / 100) * 100;
}

/** O bairro onde a pessoa cresceu (texto estável, da semente): contexto, não sentença. */
export function bairroDeOrigem(id: string, classe: Classe, municipioId: string): string {
  const pequena = municipio(municipioId).perfil === 'pequena';
  const op: Record<Classe, string[]> = {
    vulneravel: pequena ? ['na zona rural, longe do centro', 'num bairro de casas sem reboco, na saída da cidade'] : [textoLocalEm(municipioId, 'bairroPobre'), 'num conjunto habitacional da periferia', 'numa ocupação que virou bairro'],
    trabalhadora: pequena ? ['num bairro de trabalhadores, perto da feira', 'numa rua de terra que depois foi asfaltada'] : ['num bairro da periferia, de casas geminadas', 'num bairro operário perto da linha do trem'],
    media_baixa: ['num bairro residencial simples', 'numa rua de casas iguais, perto da escola'],
    media: ['num bairro de classe média, de prédios baixos', 'num bairro arborizado, perto do centro'],
    alta: pequena ? ['na casa grande perto da praça', 'numa chácara na saída da cidade'] : ['num bairro nobre', 'num condomínio fechado']
  };
  const xs = op[classe];
  return xs[Math.floor(hash(`${id}:bairro`) * xs.length) % xs.length];
}

/** Quanto a família guarda por mês, pela folga (a renda que sobra depois de viver). */
const POUPA: Record<Folga, number> = { 0: 0, 1: 0.015, 2: 0.04, 3: 0.09, 4: 0.16 };

/**
 * O ano da casa de origem: a reserva cresce ou encolhe com a folga real; e,
 * quando a casa aperta (quem sustenta perdeu o emprego, a renda não dá), ela
 * pode precisar de quem já saiu — o pedido vem pela própria pessoa
 * (`p.aperto`), e responder é escolha do jogador (`iniciativas`).
 */
export function processarOrigem(v: Vida): void {
  const rec = recursosDaFamilia(v);
  const o = v.origem;
  if (!rec.existe) { o.reserva = 0; return; }
  let reserva = o.reserva ?? 0;
  if (rec.folga === 0) reserva = reserva * 0.75 - 600;
  else if (rec.folga === 1) reserva = reserva * 0.95 + rec.renda * 12 * POUPA[1];
  else reserva += rec.renda * 12 * POUPA[rec.folga];
  // Quem sustenta a casa desempregado: a reserva é o que segura o mês.
  const pr = principal(v)!;
  if (pr.p.aperto?.tipo === 'desemprego' && !pr.p.aperto.resolvido) reserva = reserva * 0.7 - 400;
  // O que a família pôs no seu estudo e na sua vida fora saiu de algum lugar: metade da margem do mês, metade da reserva.
  const m = v.educacao.matricula;
  const noEstudo = m && !m.trancado && m.mensalidade > 0 && m.financiamento !== 'fies' ? Math.min(m.mensalidade, familiaPagaEstudo(v)) : 0;
  reserva -= (noEstudo + ajudaMensalDaFamilia(v)) * 12 * 0.5;
  const teto = rec.renda * 12 * 8 + reservaInicial(v.id, o.classe);
  o.reserva = Math.round(clamp(reserva, 0, Math.max(teto, 0)));
  if (o.apoios && o.apoios.length > 12) o.apoios = o.apoios.slice(-12);

  // A família que precisa: casa no limite, reserva no fim, e alguém da família já adulto e fora, com renda.
  const i = idade(v);
  const r = criarRng(Math.floor(hash(`${v.id}:origem:${v.t}`) * 2 ** 31));
  if (i >= 21 && !moraComFamiliaDeOrigem(v) && rec.folga <= 1 && (o.reserva ?? 0) < 1500 && !pr.p.aperto
    && (v.trabalho.atual || v.trabalho.aposentadoria) && pr.vin.proximidade >= 35 && pr.vin.confianca >= 40
    && (v.fatos['familia_pediu'] === undefined || v.t - v.fatos['familia_pediu'] >= 36) && r.chance(0.4)) {
    pr.p.aperto = { tipo: 'dinheiro', t: v.t };
    v.fatos['familia_pediu'] = v.t;
  }
}

/* ------------------------------------------------------ O que a família dá */

/** 0..1: o quanto a relação com quem sustenta a casa faz a ajuda acontecer. */
function fatorDaRelacao(vin: Vinculo): number {
  return clamp((vin.proximidade - 22) / 50, 0, 1) * clamp(1 - vin.tensao / 140, 0.2, 1);
}

/** Mesada: o que sobra para a criança numa casa com folga (e nada numa casa no limite). */
export function mesadaDaFamilia(v: Vida): number {
  const i = idade(v);
  if (i < 8 || i >= 18 || !moraComFamiliaDeOrigem(v)) return 0;
  const rec = recursosDaFamilia(v);
  const base = [0, 25, 60, 150, 400][rec.folga];
  return Math.round(base * Math.min(1, (i - 6) / 10));
}

/** Parte da renda que quem trabalha e mora com a família põe em casa — pelo que a casa precisa, não pela classe. */
export function contribuicaoEsperada(v: Vida): number {
  return [0.4, 0.3, 0.2, 0.1, 0][recursosDaFamilia(v).folga];
}

/** O que a pessoa de fato põe em casa (a escolha dela sobre o esperado). */
export function contribuicaoEmCasa(v: Vida): number {
  const esperado = contribuicaoEsperada(v);
  const c = v.origem.contribuicao ?? 'combinado';
  return c === 'nada' ? 0 : c === 'mais' ? Math.min(0.5, esperado + 0.15) : esperado;
}

/**
 * Quanto por mês a família consegue pôr no estudo (mensalidade da faculdade
 * ou do técnico particular): o que a folga permite, mediado pela relação.
 * Quem estuda longe de casa também pode contar com isso (a família ajuda
 * com a vida na outra cidade), até uns 26 anos.
 */
export function familiaPagaEstudo(v: Vida): number {
  const pr = principal(v);
  if (!pr) return 0;
  const i = idade(v);
  if (i >= 27) return 0;
  const rec = recursosDaFamilia(v);
  const base = [0, 80, 450, 1600, 9000][rec.folga];
  // Uma reserva gorda segura um pouco mais quando a folga do mês é pouca.
  const daReserva = Math.min(900, (rec.reserva ?? 0) / 60);
  // Quem já ganha o próprio salário recebe menos (a família ajuda quem precisa, não quem já se sustenta).
  const propria = v.trabalho.atual && v.trabalho.atual.contrato !== 'estagio' && v.trabalho.atual.contrato !== 'aprendiz' ? 0.5 : 1;
  return Math.round((base + (rec.folga >= 1 ? daReserva : 0)) * fatorDaRelacao(pr.vin) * propria / 10) * 10;
}

/**
 * Quem estuda longe da casa de origem (faculdade, técnico) e ainda não se
 * sustenta: a família manda o que a folga permite para a vida na outra casa.
 * Acaba com a formatura, com um trabalho que sustente, ou aos 26.
 */
export function ajudaMensalDaFamilia(v: Vida): number {
  const pr = principal(v);
  const m = v.educacao.matricula;
  if (!pr || moraComFamiliaDeOrigem(v) || idade(v) >= 26 || !m || m.trancado) return 0;
  const e = v.trabalho.atual;
  if (e && e.contrato !== 'estagio' && e.contrato !== 'aprendiz') return 0;
  const base = [0, 0, 250, 700, 2500][recursosDaFamilia(v).folga];
  return Math.round(base * fatorDaRelacao(pr.vin) / 10) * 10;
}

/** A família banca o cursinho? (Numa casa com folga, sim; apertada, é com a pessoa.) */
export function familiaPagaCursinho(v: Vida): boolean {
  const pr = principal(v);
  return !!pr && recursosDaFamilia(v).folga >= 3 && fatorDaRelacao(pr.vin) >= 0.4 && idade(v) < 25;
}

/* -------------------------------------------------------- Pedir ajuda */

export type MotivoDeAjuda = ApoioFamiliar['motivo'];

export const ROTULO_MOTIVO: Record<MotivoDeAjuda, string> = {
  emergencia: 'para segurar uma emergência', estudo: 'para os estudos', mudanca: 'para a mudança',
  divida: 'para acertar uma dívida', casa: 'para as contas', recomeco: 'para recomeçar'
};

export interface ApoioPossivel {
  quem?: Pessoa;
  /** Até quanto a família consegue (sem se quebrar). */
  ate: number;
  /** A chance de a família dizer sim (0..1) — não aparece como número. */
  chance: number;
  /** Como está a relação, em palavras (para o texto antes de pedir). */
  leitura: string;
}

const NECESSIDADE: Record<MotivoDeAjuda, number> = { emergencia: 1.25, estudo: 1.1, recomeco: 1.05, mudanca: 0.9, casa: 0.85, divida: 0.75 };

/** O que já foi pedido nos últimos anos (quem pede sempre encontra menos). */
function recebidoRecente(v: Vida, anos = 3): { vezes: number; valor: number } {
  const xs = (v.origem.apoios ?? []).filter(a => a.sentido === 'recebeu' && v.t - a.t < anos * 12);
  return { vezes: xs.length, valor: xs.reduce((s, a) => s + a.valor, 0) };
}

export function apoioPossivel(v: Vida, motivo: MotivoDeAjuda): ApoioPossivel {
  const pr = principal(v);
  if (!pr) return { ate: 0, chance: 0, leitura: 'Não há mais a casa de onde você veio para recorrer.' };
  const rec = recursosDaFamilia(v);
  const rel = fatorDaRelacao(pr.vin);
  const hist = recebidoRecente(v);
  // Numa emergência, até a casa apertada junta alguma coisa; com folga, a margem do mês e parte da reserva.
  const margemMensal = [60, 150, 400, 1400, 6000][rec.folga];
  const ate = Math.max(0, Math.round((rec.reserva * (motivo === 'emergencia' ? 0.6 : 0.4) + margemMensal * (motivo === 'emergencia' ? 4 : 3)) * (0.5 + rel * 0.5) / 100) * 100);
  const chance = clamp((0.12 + rel * 0.72) * NECESSIDADE[motivo] - hist.vezes * 0.14, 0.04, 0.93);
  const quem = pr.p;
  const leitura = rel < 0.25 ? `Vocês andam distantes; pedir a ${quem.nome} agora é difícil.`
    : hist.vezes >= 2 ? `${quem.nome} já ajudou mais de uma vez nos últimos anos.`
      : rec.folga <= 1 ? `A casa de ${quem.nome} anda ${PALAVRA_FOLGA[rec.folga]}: o que der, vai ser pouco.`
        : `${quem.nome} costuma estar por perto quando é preciso.`;
  return { quem, ate, chance, leitura };
}

/** Uma necessidade concreta que justifica pedir — com o valor que ela pede. Sem necessidade, não há o que pedir. */
export function necessidadeDe(v: Vida, motivo: MotivoDeAjuda): { valor: number; texto: string } | undefined {
  const conta = v.financas.conta;
  switch (motivo) {
    case 'emergencia': {
      const atrasadas = v.financas.dividas.filter(d => (d.atraso ?? 0) > 0).reduce((s, d) => s + d.parcela * (d.atraso ?? 0), 0) + (v.moradia.atraso ?? 0) * v.moradia.aluguel;
      if (conta >= 0 && atrasadas <= 0) return undefined;
      return { valor: Math.round((Math.max(0, -conta) + atrasadas + 500) / 100) * 100, texto: 'a conta no vermelho e o que está atrasado' };
    }
    case 'estudo': {
      const m = v.educacao.matricula;
      if (!m || m.trancado || m.mensalidade <= 0 || m.financiamento) return undefined;
      return { valor: Math.round(m.mensalidade * 6 / 100) * 100, texto: 'seis meses de mensalidade' };
    }
    case 'mudanca': {
      if (!moraComFamiliaDeOrigem(v) || idade(v) < 18) return undefined;
      const c = economiaLocal(v.moradia.municipioId);
      const valor = Math.round((c.aluguel * 3 + 900 * c.custo) / 100) * 100;
      if (conta >= valor) return undefined;
      return { valor: valor - Math.max(0, Math.round(conta / 100) * 100), texto: 'a caução, o primeiro aluguel e o frete' };
    }
    case 'divida': {
      const caras = v.financas.dividas.filter(d => d.tipo === 'cartao' && d.saldo > 0).reduce((s, d) => s + d.saldo, 0);
      if (caras < 500) return undefined;
      return { valor: Math.round(caras / 100) * 100, texto: 'a dívida do cartão' };
    }
    case 'recomeco': {
      const recem = (v.justica?.tSaida !== undefined && v.t - v.justica.tSaida <= 24) || (v.trabalho.desempregadoDesde !== undefined && v.t - v.trabalho.desempregadoDesde >= 12);
      if (!recem || conta > 3000) return undefined;
      return { valor: 3000, texto: 'o começo de novo: roupa, passagem, o mês até o primeiro salário' };
    }
    case 'casa': return undefined;
  }
}

export const MOTIVOS_DE_AJUDA: MotivoDeAjuda[] = ['emergencia', 'estudo', 'mudanca', 'divida', 'recomeco'];

export function disponibilidadePedirAjuda(v: Vida, motivo: MotivoDeAjuda): Veredito {
  const a = autonomia(v, 'pedir_ajuda');
  if (a.grau !== 'permitido') return a;
  if (v.anoAtual.acoes.includes('pedir_ajuda_familia')) return bloqueio('incompativel', 'Você já pediu ajuda à família neste ano.');
  const pr = principal(v);
  if (!pr) return bloqueio('impossivel', 'Não há mais a casa de onde você veio para recorrer.');
  const n = necessidadeDe(v, motivo);
  if (!n) return bloqueio('impossivel', 'Não há uma necessidade dessas agora.');
  if (pr.vin.distancia !== undefined && v.t - pr.vin.distancia < 60) return bloqueio('incompativel', `Você tomou distância de ${pr.p.nome}.`);
  const ap = apoioPossivel(v, motivo);
  return { grau: ap.chance < 0.3 ? 'improvavel' : 'permitido', chance: ap.chance, motivo: ap.leitura };
}

/**
 * Pedir. A família pode dar tudo, parte ou nada — e o que dá sai da reserva
 * dela. Pesa na relação (pedir muito, ou ouvir um não) e fica na história
 * quando o valor importa.
 */
export function pedirAjuda(v: Vida, r: Rng, motivo: MotivoDeAjuda): { texto: string; valor: number; pessoaId?: string } {
  const pr = principal(v)!;
  const n = necessidadeDe(v, motivo)!;
  const ap = apoioPossivel(v, motivo);
  v.anoAtual.acoes.push('pedir_ajuda_familia');
  const o = v.origem;
  o.apoios ??= [];
  const quem = pr.p;
  const ela = flex(quem.genero, 'ele', 'ela', 'elu');
  if (!r.chance(ap.chance) || ap.ate < 200) {
    o.apoios.push({ t: v.t, valor: 0, motivo, sentido: 'negado', pessoaId: quem.id });
    pr.vin.tensao = clamp(pr.vin.tensao + 4);
    const semTer = ap.ate < Math.min(n.valor, 1500);
    const texto = semTer ? `${quem.nome} ouviu tudo e disse que não tinha como. Não era falta de vontade: a casa ${ela === 'ela' ? 'dela' : 'dele'} também anda contada.`
      : `${quem.nome} disse que não. Que já era hora de você resolver as suas coisas — e ficou um silêncio estranho no fim da ligação.`;
    lembrarCom(v, quem.id, semTer ? `Pediu ajuda ${ROTULO_MOTIVO[motivo]}; não havia como.` : `Pediu ajuda ${ROTULO_MOTIVO[motivo]} e ouviu um não.`, 'conflito', 1);
    return { texto, valor: 0, pessoaId: quem.id };
  }
  const valor = Math.max(200, Math.min(n.valor, ap.ate));
  v.financas.conta += valor;
  o.reserva = Math.max(0, Math.round((o.reserva ?? 0) - valor / cambioDaFamilia(v)));
  o.apoios.push({ t: v.t, valor, motivo, sentido: 'recebeu', pessoaId: quem.id });
  pr.vin.confianca = clamp(pr.vin.confianca + 2);
  if (valor >= 5000) pr.vin.tensao = clamp(pr.vin.tensao + 2);
  const parte = valor < n.valor;
  const texto = parte ? `${quem.nome} juntou o que dava: ${fmt(valor)}. Não era tudo — era o que havia.` : `${quem.nome} mandou ${fmt(valor)} e só pediu que você desse notícia.`;
  lembrarCom(v, quem.id, `Ajudou você ${ROTULO_MOTIVO[motivo]}${valor >= 3000 ? ` (${fmt(valor)})` : ''}.`, 'apoio', valor >= 3000 ? 2 : 1);
  if (valor >= 3000) escrever(v, { texto: `A família ajudou ${ROTULO_MOTIVO[motivo]}: ${quem.nome} mandou ${fmt(valor)}.`, relevancia: 'biografia', tema: 'familia', pessoas: [quem.id], escolha: true });
  return { texto, valor, pessoaId: quem.id };
}

/** Ajudar a família (o sentido inverso): o dinheiro sai da sua conta e segura a casa de lá. */
export function registrarAjudaDada(v: Vida, p: Pessoa, valor: number): void {
  if (valor <= 0) return;
  const o = v.origem;
  o.apoios ??= [];
  o.apoios.push({ t: v.t, valor, motivo: 'casa', sentido: 'deu', pessoaId: p.id });
  if (responsaveis(v).some(x => x.p.id === p.id)) o.reserva = Math.round((o.reserva ?? 0) + valor / cambioDaFamilia(v));
}

/* ----------------------------------------------------------- Leitura */

/** A frase da origem para a tela (Pessoas, Vida): de onde veio, como está a casa de lá hoje. */
export function leituraDaOrigem(v: Vida): string {
  const rec = recursosDaFamilia(v);
  const pr = principal(v);
  if (!rec.existe || !pr) return 'A casa de onde você veio já não existe como casa: quem a sustentava não está mais aqui.';
  const quem = casaDaPrincipal(v).map(p => p.nome);
  const deQuem = quem.length > 1 ? `${quem.slice(0, -1).join(', ')} e ${quem[quem.length - 1]}` : quem[0];
  return `A casa de ${deQuem} anda ${PALAVRA_FOLGA[rec.folga]}${rec.reserva >= 20000 ? ', com um dinheiro guardado' : rec.reserva < 1000 ? ', sem reserva' : ''}.`;
}

/** Validação leve (para o save). */
export const origemValida = (v: Vida) => v.origem.reserva === undefined || Number.isFinite(v.origem.reserva);

