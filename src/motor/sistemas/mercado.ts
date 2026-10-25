/**
 * O mercado: o que existe à venda e para alugar AGORA, nesta cidade.
 *
 * Não é um catálogo global. Cada ano, cada cidade tem um punhado de ofertas
 * concretas — um apartamento de dois quartos num bairro novo, um compacto de
 * 2019 que rodou em aplicativo, uma gata de três anos no abrigo — geradas de
 * forma determinística (semente da economia + ano + cidade). Reabrir a tela
 * mostra as mesmas ofertas; no ano seguinte, o mercado é outro.
 *
 * A interface mostra primeiro o que faz sentido para esta vida
 * (`sistemas/relevancia`); o resto fica em "ver outras".
 */

import { paisCorrente } from '../mundo/moeda';
import { textoLocal } from '../mundo/locais';
import { criarRng, type Rng } from '../rng';
import { paisDoCatalogo } from '../mundo/registro';
import { ANIMAIS, animal } from '../dados/animais';
import type { Especie, Vida } from '../tipos';
import { anoDe } from '../tempo';
import { economiaLocal, municipio, pertoDaAgua } from '../dados/lugares';
import { MORADIAS, VEICULOS, VERSOES_VEICULO, depreciacao, type CategoriaVeiculo, modeloMoradia, modeloVeiculo, versaoVeiculo, versoesDaClasse, type ModeloMoradia, type ModeloVeiculo, type VersaoVeiculo } from '../dados/bens';
import { converterEntrePaises } from '../mundo/moeda';
import { paisDaCidade } from '../dados/lugares';
import { paisDaVida } from '../mundo/vida';
import { fatorDeImportado, fatorDoBairro, rendimentoDoMercado } from './precos';
import { indiceImoveis } from './economia';
import { corDaOferta } from '../dados/pertences';

function rngDe(v: Vida, chave: string): Rng {
  let h = (v.economia?.semente ?? 1) >>> 0;
  for (let i = 0; i < chave.length; i++) h = Math.imul(h ^ chave.charCodeAt(i), 0x01000193) >>> 0;
  return criarRng(h);
}

/* ----------------------------------------------------------------- Imóveis */

export type EstadoImovel = 'novo' | 'bom' | 'reforma';

export interface OfertaImovel {
  id: string;
  modo: 'aluguel' | 'venda';
  modeloId: string;
  bairro: string;
  estado: EstadoImovel;
  /** Preço de venda (também informado no aluguel, para referência). */
  preco: number;
  /** Aluguel mensal (na venda: quanto renderia alugado). */
  aluguel: number;
  aceitaPet: boolean;
  quartos: number;
  /** Detalhe que distingue uma oferta da outra. */
  detalhe: string;
  /** REWORK 12: o índice do bairro (1 = comum; o nobre, 1,5; o extremo da periferia, 0,62). */
  indiceBairro?: number;
}

// [onde, o índice do bairro: o quanto o endereço é disputado (1 = um bairro comum)]
const BAIRROS_GRANDE: [string, number][] = [['no centro', 1.12], ['num bairro tradicional', 1.05], ['num bairro novo', 1], ['na periferia', 0.74], ['num condomínio fechado', 1.22], ['perto do metrô', 1.1], ['num bairro nobre', 1.5], ['afastado, fora da mancha urbana', 0.62]];
const BAIRROS_PEQUENA: [string, number][] = [['no centro', 1.08], ['perto da praça', 1.04], ['num bairro novo', 1], ['na saída da cidade', 0.82], ['num loteamento', 0.9], ['na parte alta da cidade', 1.2], ['na zona rural, perto da cidade', 0.7]];
const ESTADOS: [EstadoImovel, number, string][] = [['novo', 1.1, 'nunca habitado'], ['bom', 1, 'bem conservado'], ['reforma', 0.8, 'precisa de reforma']];
const DETALHES = ['sol da manhã', 'vaga na garagem', 'perto de escola', 'rua tranquila', 'perto do comércio', 'vista aberta', 'área de serviço grande', 'andar alto', 'sem elevador', 'barulho da avenida'];

/**
 * REWORK 12: onde cada tipo aparece. O alto padrão e a cobertura, nos bairros disputados; a mansão, no bairro
 * nobre, no condomínio — ou longe, onde o terreno é grande e barato; a casa simples, nas bordas. O resto, em
 * qualquer bairro que não seja o extremo (nem o mais caro dos caros, nem o fim da cidade).
 */
function bairrosDoTipo(modeloId: string, pequena: boolean): [string, number][] {
  const lista = pequena ? BAIRROS_PEQUENA : BAIRROS_GRANDE;
  const por = (f: (b: [string, number]) => boolean) => lista.filter(f);
  switch (modeloId) {
    case 'alto_padrao': case 'cobertura': return por(b => b[1] >= 1.05);
    case 'mansao': return por(b => b[1] >= 1.2 || b[1] <= 0.7);
    case 'casa_simples': return por(b => b[1] < 0.95);
    default: return por(b => b[1] > 0.7 && b[1] < 1.45);
  }
}

/** Aluguel de um tipo de moradia numa cidade, hoje (acompanha em parte o preço dos imóveis). */
export function aluguelDe(v: Vida, m: ModeloMoradia, municipioId: string): number {
  const idx = 0.5 + 0.5 * indiceImoveis(v);
  return Math.round(economiaLocal(municipioId).aluguel * m.fatorAluguel * idx / 10) * 10;
}

/**
 * Preço de um tipo de imóvel numa cidade, hoje, num bairro comum. REWORK 12: sai do aluguel de referência da
 * cidade pelo rendimento do mercado (`precos.rendimentoDoMercado`) — o preço e o aluguel conversam; o tipo
 * entra pela relação do seu preço de catálogo com o do dois quartos.
 */
export function precoDeImovel(v: Vida, m: ModeloMoradia, municipioId: string): number {
  const referencia = economiaLocal(municipioId).aluguel * 12 / rendimentoDoMercado(municipioId);
  return Math.round(referencia * (m.preco / PRECO_DOIS_QUARTOS) * indiceImoveis(v) / 1000) * 1000;
}
const PRECO_DOIS_QUARTOS = 320000;

/**
 * REWORK 12: quanto um imóvel que é seu vale no mercado de hoje — o tipo, a cidade, o bairro e o estado. É para
 * onde o valor dele caminha ano a ano (devagar: o mercado não reavalia ninguém de um dia para o outro). Em
 * outro país, nos preços de lá convertidos para os daqui.
 */
export function valorJustoDoImovel(v: Vida, b: { modeloId: string; municipioId: string; estado: number; indiceBairro?: number }): number {
  const m = modeloMoradia(b.modeloId);
  const conv = converterEntrePaises(1, paisDaCidade(b.municipioId), paisDaVida(v));
  return Math.round(precoDeImovel(v, m, b.municipioId) * fatorDoBairro(b.indiceBairro ?? 1, m.id, 'preco') * (0.7 + 0.35 * b.estado / 100) * conv / 1000) * 1000;
}

/** O índice do bairro de uma oferta (pelo texto, para os imóveis já comprados). */
export function indiceDoBairro(bairro: string | undefined): number {
  const x = [...BAIRROS_GRANDE, ...BAIRROS_PEQUENA].find(b => b[0] === bairro);
  return x ? x[1] : 1;
}

export function ofertasDeImoveis(v: Vida, modo: 'aluguel' | 'venda', municipioId = v.moradia.municipioId): OfertaImovel[] {
  const ano = anoDe(v.t);
  const r = rngDe(v, `im:${modo}:${ano}:${municipioId}`);
  const perfil = municipio(municipioId).perfil;
  const pequena = ['pequena', 'polo'].includes(perfil);
  const out: OfertaImovel[] = [];
  let k = 0;
  for (const m of MORADIAS) {
    if (m.rural) continue;
    if (m.id === 'republica' && modo === 'venda') continue;
    if (m.id === 'alto_padrao' && pequena) continue;
    // REWORK 12: a cobertura só nas cidades grandes; a mansão em qualquer uma que não seja pequena.
    if (m.id === 'cobertura' && (pequena || perfil === 'metropolitana')) continue;
    if (m.id === 'mansao' && perfil === 'pequena') continue;
    const quantas = m.id === 'republica' ? 1 : m.padrao >= 5 ? (m.id === 'mansao' ? 2 : 1) : 2;
    const bairros = bairrosDoTipo(m.id, pequena);
    for (let q = 0; q < quantas; q++) {
      const [bairro, ib] = r.pick(bairros);
      const [estado, fe, textoEstado] = m.id === 'republica' ? ESTADOS[1] : r.weighted(ESTADOS, e => (e[0] === 'novo' ? (modo === 'venda' ? 1 : 0.5) : e[0] === 'bom' ? 2 : 1))!;
      const ruido = 0.93 + r.next() * 0.14;
      const preco = Math.round(precoDeImovel(v, m, municipioId) * fatorDoBairro(ib, m.id, 'preco') * fe * ruido / 1000) * 1000;
      const aluguel = Math.round(aluguelDe(v, m, municipioId) * fatorDoBairro(ib, m.id, 'aluguel') * (0.92 + (fe - 1) * 0.5 + r.next() * 0.16) / 10) * 10;
      const aceitaPet = m.casa ? true : m.id === 'republica' ? r.chance(0.3) : r.chance(m.id === 'kitnet' ? 0.4 : 0.7);
      out.push({
        id: `im-${modo}-${ano}-${k++}`, modo, modeloId: m.id, bairro, estado, preco, aluguel, aceitaPet, quartos: m.quartos, indiceBairro: ib,
        detalhe: m.id === 'republica' ? r.pick(['quatro moradores', 'três moradores, um gato', 'casa de estudantes']) : `${textoEstado}, ${r.pick(DETALHES)}`
      });
    }
  }
  return out;
}

export const ofertaDeImovel = (v: Vida, id: string) => {
  const modo = id.startsWith('im-aluguel') ? 'aluguel' : 'venda';
  return ofertasDeImoveis(v, modo).find(o => o.id === id);
};

/** A oferta mais simples de um tipo (para comandos antigos que só dizem o tipo). */
export function ofertaPorModelo(v: Vida, modo: 'aluguel' | 'venda', modeloId: string): OfertaImovel | undefined {
  const lista = ofertasDeImoveis(v, modo).filter(o => o.modeloId === modeloId);
  return lista.sort((a, b) => (modo === 'aluguel' ? a.aluguel - b.aluguel : a.preco - b.preco))[0];
}

export function nomeImovel(o: { modeloId: string }): string {
  return modeloMoradia(o.modeloId).nome;
}

/* ---------------------------------------------------------------- Veículos */

/** As lojas de veículos da cidade. REWORK 12: a garagem de colecionador (superesportivos, altíssimo luxo, clássicos). */
export type LojaDeVeiculo = 'concessionaria' | 'usados' | 'motos' | 'nautica' | 'aeroclube' | 'colecionador';

/**
 * A fonte única do que cada loja vende: a vitrine, o "catálogo completo" da
 * loja e o filtro por tipo partem daqui (a loja de motos e bicicletas nunca
 * mostra carro, nem o filtro "Carros").
 */
export const CATEGORIAS_DA_LOJA: Record<LojaDeVeiculo, CategoriaVeiculo[]> = {
  concessionaria: ['carro'], usados: ['carro'], motos: ['moto', 'bicicleta'], nautica: ['embarcacao'], aeroclube: ['aeronave'], colecionador: ['carro']
};

/** REWORK 12: o segmento que cada loja de carros vende (a concessionária não vende Ferrari; o colecionador não vende Mobi). */
export const lojaDoSegmento = (m: ModeloVeiculo): LojaDeVeiculo | undefined =>
  m.segmento ? 'colecionador' : m.categoria === 'carro' ? undefined : m.categoria === 'embarcacao' ? 'nautica' : m.categoria === 'aeronave' ? 'aeroclube' : 'motos';

/** A loja existe nesta cidade? Náutica, perto da água; aeroclube e colecionador, em cidade grande. */
export function lojaNaCidade(municipioId: string, loja: LojaDeVeiculo): boolean {
  if (loja === 'nautica') return pertoDaAgua(municipioId);
  if (loja === 'aeroclube' || loja === 'colecionador') { const m = municipio(municipioId); return m.perfil === 'metropole' || m.perfil === 'capital'; }
  return true;
}

/**
 * REWORK 12: as versões que se vendem num país (o Kwid na América do Sul, a F-150 na do Norte). Uma classe que
 * não tem nenhuma versão do mercado local fica com todas (ninguém deixa de achar um compacto por falta de dado).
 */
export function versoesNoPais(pais: string): VersaoVeiculo[] {
  const regiao = paisDoCatalogo(pais).regiao;
  const aqui = (x: VersaoVeiculo) => !x.mercados || x.mercados.includes(regiao) || (pais === 'BR' && x.mercados.includes('BR'));
  const out = VERSOES_VEICULO.filter(aqui);
  const classes = new Set(out.map(x => x.classe));
  for (const m of VEICULOS) if (!classes.has(m.id)) out.push(...versoesDaClasse(m.id));
  return out;
}

/** O preço de uma versão zero neste país (o de catálogo, trocado o imposto do Brasil pelo de lá; a cidade ajusta). */
export function precoNovoNoPais(x: { preco: number }, municipioId: string): number {
  const custo = economiaLocal(municipioId).custo;
  const regional = 0.96 + 0.08 * Math.min(1.3, custo);
  return Math.round(x.preco * fatorDeImportado(paisDaCidade(municipioId)) * regional / 100) * 100;
}

const CACHE_CLASSICOS = new Map<string, number>();
/**
 * REWORK 12: o mercado de clássicos (um índice mundial, 1 = 2026). Sobe um pouco na média (~1% real ao ano) e
 * oscila bastante (~7%): há décadas boas e décadas ruins. Determinístico pela semente da economia — o mesmo
 * para todos os clássicos da vida; cada carro ainda tem o seu estado e a sua história.
 */
export function indiceClassicos(semente: number, ano: number): number {
  const chave = `${semente}:${ano}`;
  const c = CACHE_CLASSICOS.get(chave);
  if (c !== undefined) return c;
  let x = 1;
  for (let y = 2027; y <= ano; y++) {
    const r = criarRng(((semente >>> 0) ^ Math.imul(y, 0x9e3779b1)) >>> 0);
    x *= 1 + 0.01 + r.normal() * 0.07;
    x = Math.max(0.45, Math.min(3, x));
  }
  if (CACHE_CLASSICOS.size > 2000) CACHE_CLASSICOS.clear();
  CACHE_CLASSICOS.set(chave, x);
  return x;
}

/** O que um clássico vale hoje: o exemplar de catálogo, o mercado e o estado (o bom estado vale muito mais). */
export function valorDeClassico(v: Vida, preco: number, estado: number, municipioId = v.moradia.municipioId): number {
  return Math.round(preco * fatorDeImportado(paisDaCidade(municipioId), 0.6) * indiceClassicos(v.economia?.semente ?? 1, anoDe(v.t)) * (0.45 + estado / 180) / 100) * 100;
}

export interface OfertaVeiculo {
  id: string;
  lugar: LojaDeVeiculo;
  /** A classe (`VEICULOS`). */
  modeloId: string;
  /** A versão concreta: marca e modelo (`VERSOES_VEICULO`). */
  versaoId: string;
  usado: boolean;
  anoFabricacao: number;
  preco: number;
  estado: number;
  /** A história do usado, em uma linha. */
  historico?: string;
  /** FIX pós-REWORK 4: a cor deste veículo (do anúncio; é ela que vai para a garagem). */
  cor: string;
  corNome: string;
}

const HISTORICOS: [string, number, number][] = [
  // [texto, efeito no estado, efeito no preço]
  ['um dono só, revisões em dia', 10, 1.04],
  ['de garagem, pouco rodado', 14, 1.08],
  ['veio de locadora, muito rodado', -8, 0.93],
  ['rodou em aplicativo', -15, 0.88],
  ['batido e recuperado', -12, 0.82],
  ['pintura cansada, mecânica boa', -2, 0.95],
  ['vendido por uma senhora que parou de dirigir', 8, 1.02]
];
/** REWORK 12: a história de um clássico — o que pesa no valor é o estado e a originalidade. */
const HISTORICOS_CLASSICO: [string, number][] = [
  ['restaurado, peças originais', 92], ['original de fábrica, nunca restaurado', 80], ['de colecionador, com documentação', 86],
  ['precisa de restauração', 45], ['motor refeito, lataria cansada', 58], ['achado de garagem, parado há anos', 35]
];

/**
 * O que está à venda neste ano, nesta cidade. Zero quilômetro: todas as
 * versões das categorias da loja (as lojas da cidade, juntas). Usados: um
 * punhado de anúncios, sorteados pelo que é comum na rua (peso da classe e
 * da versão), cada um com ano, estado e uma história.
 */
export function ofertasDeVeiculos(v: Vida, lugar: OfertaVeiculo['lugar']): OfertaVeiculo[] {
  if (!lojaNaCidade(v.moradia.municipioId, lugar)) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v, `vei:${lugar}:${ano}:${v.moradia.municipioId}`);
  const pais = paisDaCidade(v.moradia.municipioId);
  const fatorUsado = precoNovoNoPais({ preco: 1000 }, v.moradia.municipioId) / 1000;
  const locais = versoesNoPais(pais);
  const daClasse = (id: string) => locais.filter(x => x.classe === id);
  const out: OfertaVeiculo[] = [];
  let k = 0;
  const novo = (x: VersaoVeiculo) => out.push({ id: `ve-${lugar}-${ano}-${k++}`, lugar, modeloId: x.classe, versaoId: x.id, usado: false, anoFabricacao: ano, preco: precoNovoNoPais(x, v.moradia.municipioId), estado: 100, cor: '', corNome: '' });
  const usado = (m: ModeloVeiculo) => {
    const x = r.weighted(daClasse(m.id), y => y.pesoUsado)!;
    if (m.segmento === 'classico') {
      const [historico, base] = r.pick(HISTORICOS_CLASSICO);
      const estado = Math.round(Math.max(20, Math.min(97, base + r.normal() * 5)));
      // Quem vende um clássico pede um pouco acima do mercado (a margem da garagem): comprar e revender no mesmo ano perde.
      const preco = Math.round(valorDeClassico(v, x.preco, estado) * 1.1 / 100) * 100;
      out.push({ id: `ve-${lugar}-${ano}-${k++}`, lugar, modeloId: m.id, versaoId: x.id, usado: true, anoFabricacao: x.ano ?? ano - 40, preco, estado, historico, cor: '', corNome: '' });
      return;
    }
    const anos = m.categoria === 'bicicleta' ? r.int(1, 5) : m.raro ? r.int(3, 20) : m.segmento ? r.int(1, 8) : r.int(2, 14);
    const [historico, de, dp] = r.pick(HISTORICOS);
    const estado = Math.round(Math.max(25, Math.min(95, 92 - anos * 4 + de + r.normal() * 5)));
    const preco = Math.round(x.preco * fatorUsado * depreciacao(m, anos) * dp * (0.85 + estado / 600) / 100) * 100;
    out.push({ id: `ve-${lugar}-${ano}-${k++}`, lugar, modeloId: m.id, versaoId: x.id, usado: true, anoFabricacao: ano - anos, preco, estado, historico, cor: '', corNome: '' });
  };
  const daCategoria = (f: (m: ModeloVeiculo) => boolean) => locais.filter(x => f(modeloVeiculo(x.classe)));
  if (lugar === 'concessionaria') for (const x of daCategoria(m => m.categoria === 'carro' && !m.segmento)) novo(x);
  else if (lugar === 'colecionador') {
    // Zero: os exóticos do mercado. Usados: um ou dois exóticos e uns clássicos (cada um com a sua história).
    for (const x of daCategoria(m => m.segmento === 'exotico')) novo(x);
    const exoticos = VEICULOS.filter(m => m.segmento === 'exotico');
    for (let q = 0; q < 2; q++) usado(r.weighted(exoticos, m => m.preco > 5e6 ? 0.5 : 1)!);
    for (let q = 0; q < 4; q++) usado(modeloVeiculo('classico'));
  } else if (lugar === 'nautica' || lugar === 'aeroclube') {
    // Raros: todas as versões novas da loja e um ou dois usados (anúncio de marina, de hangar).
    const cats = CATEGORIAS_DA_LOJA[lugar];
    for (const x of daCategoria(m => cats.includes(m.categoria))) novo(x);
    const classes = VEICULOS.filter(m => cats.includes(m.categoria));
    for (let q = 0; q < (lugar === 'nautica' ? 2 : 1); q++) usado(r.weighted(classes, m => m.pesoUsado)!);
  } else if (lugar === 'motos') {
    for (const x of daCategoria(m => CATEGORIAS_DA_LOJA.motos.includes(m.categoria))) novo(x);
    usado(modeloVeiculo('moto_pequena'));
    usado(modeloVeiculo('moto_pequena'));
    usado(modeloVeiculo('moto_media'));
    usado(r.weighted(VEICULOS.filter(m => m.categoria === 'bicicleta'), m => m.pesoUsado)!);
  } else {
    const carros = VEICULOS.filter(m => m.categoria === 'carro' && m.usado && !m.segmento);
    for (let q = 0; q < 9; q++) usado(r.weighted(carros, m => m.pesoUsado)!);
  }
  // A cor de cada anúncio (estável, sem sorteio): o Argo vermelho continua vermelho quando se volta à loja.
  for (const o of out) { const c = corDaOferta(o.id, v.moradia.municipioId, modeloVeiculo(o.modeloId).categoria); o.cor = c.cor; o.corNome = c.nome; }
  return out;
}

/**
 * Tudo o que está à venda na cidade neste ano, do mais barato ao mais caro.
 * Com uma loja: o catálogo DAQUELA loja (as categorias dela, novos e usados
 * da cidade) — é o "Catálogo completo" de dentro da loja.
 */
export function catalogoDeVeiculos(v: Vida, loja?: LojaDeVeiculo): OfertaVeiculo[] {
  const cats = loja ? CATEGORIAS_DA_LOJA[loja] : undefined;
  const lojas = (['concessionaria', 'usados', 'motos', 'nautica', 'aeroclube', 'colecionador'] as const).filter(l => !cats || CATEGORIAS_DA_LOJA[l].some(c => cats.includes(c)));
  return lojas.flatMap(l => ofertasDeVeiculos(v, l)).filter(o => !cats || cats.includes(modeloVeiculo(o.modeloId).categoria)).sort((a, b) => a.preco - b.preco || a.id.localeCompare(b.id));
}

export function ofertaDeVeiculo(v: Vida, id: string): OfertaVeiculo | undefined {
  const lugar = id.split('-')[1] as OfertaVeiculo['lugar'];
  return ofertasDeVeiculos(v, lugar).find(o => o.id === id);
}

/**
 * Oferta para comandos que só dizem o modelo: a mais barata da classe (ou,
 * se o id for de uma versão, daquela versão).
 */
export function ofertaVeiculoPorModelo(v: Vida, modeloId: string, usado?: boolean): OfertaVeiculo | undefined {
  const versao = versaoVeiculo(modeloId);
  const m = modeloVeiculo(versao?.classe ?? modeloId);
  const lugar: LojaDeVeiculo = lojaDoSegmento(m) ?? (usado ? 'usados' : 'concessionaria');
  const lista = ofertasDeVeiculos(v, lugar).filter(o => o.modeloId === m.id && (!versao || o.versaoId === versao.id) && (usado === undefined || o.usado === usado));
  return lista.sort((a, b) => a.preco - b.preco)[0];
}

/* ---------------------------------------------------------------- Animais */

export interface AnimalDoAbrigo {
  id: string;
  especie: Especie;
  nome: string;
  genero: 'masculino' | 'feminino';
  idade: number;
  porte: 'pequeno' | 'medio' | 'grande';
  jeito: string;
  historia: string;
}

// [masculino, feminino]
const JEITOS_CAO: [string, string][] = [
  ['agitado, quer brincar o tempo todo', 'agitada, quer brincar o tempo todo'],
  ['calmo, deita no pé de quem estiver perto', 'calma, deita no pé de quem estiver perto'],
  ['desconfiado no começo, grudado depois', 'desconfiada no começo, grudada depois'],
  ['late para tudo que passa', 'late para tudo que passa'],
  ['come qualquer coisa que cair no chão', 'come qualquer coisa que cair no chão'],
  ['dorminhoco, dorme metade do dia', 'dorminhoca, dorme metade do dia']
];
const JEITOS_GATO: [string, string][] = [
  ['tímido, gosta de colo quando ninguém está olhando', 'tímida, gosta de colo quando ninguém está olhando'],
  ['curioso, entra em toda caixa', 'curiosa, entra em toda caixa'],
  ['independente, aparece para comer e some', 'independente, aparece para comer e some'],
  ['conversa miando', 'conversa miando'],
  ['dorme no sol da janela', 'dorme no sol da janela'],
  ['ciumento de quem chega', 'ciumenta de quem chega']
];
const HISTORIAS: [string, string][] = [
  ['resgatado de um terreno baldio', 'resgatada de um terreno baldio'],
  ['devolvido por uma família que se mudou', 'devolvida por uma família que se mudou'],
  ['nasceu no abrigo', 'nasceu no abrigo'],
  ['achado numa caixa na porta de uma padaria', 'achada numa caixa na porta de uma padaria'],
  ['recolhido da rua depois de um atropelamento, já recuperado', 'recolhida da rua depois de um atropelamento, já recuperada'],
  ['de uma ninhada que ninguém quis', 'de uma ninhada que ninguém quis']
];
const NOMES: Record<'cachorro' | 'gato', [string[], string[]]> = {
  cachorro: [['Thor', 'Bidu', 'Bob', 'Scooby', 'Fred', 'Tobias', 'Faísca', 'Pingo'], ['Mel', 'Luna', 'Pretinha', 'Nina', 'Belinha', 'Paçoca', 'Pipoca', 'Estrela']],
  gato: [['Frajola', 'Mingau', 'Salem', 'Tom', 'Chico', 'Garfield', 'Café'], ['Mia', 'Nala', 'Amora', 'Jade', 'Mimi', 'Lua', 'Canela']]
};

/**
 * Fora do Brasil, os nomes de bicho brasileiros (Paçoca, Nescau, Frajola) não são o padrão: nomes que se ouvem
 * em quase todo lugar. [masculino, feminino].
 */
const NOMES_UNIVERSAIS: Record<'cachorro' | 'gato' | 'outro', [string[], string[]]> = {
  cachorro: [['Max', 'Rocky', 'Charlie', 'Buddy', 'Toby', 'Leo', 'Milo', 'Bruno'], ['Luna', 'Bella', 'Lola', 'Daisy', 'Nina', 'Kira', 'Maya', 'Coco']],
  gato: [['Simba', 'Oliver', 'Milo', 'Oscar', 'Tom', 'Leo'], ['Luna', 'Mia', 'Nala', 'Cleo', 'Kiki', 'Lily']],
  outro: [['Kiwi', 'Pip', 'Sunny', 'Mango', 'Pepper'], ['Coco', 'Kiki', 'Lulu', 'Mimi', 'Pearl']]
};

/** Um nome de bicho que combina com o gênero dele — e com o lugar onde ele mora (os brasileiros, no Brasil). */
export const nomeDePet = (r: Rng, especie: Especie, genero: 'masculino' | 'feminino' | 'nao_binario', pais = paisCorrente()) => {
  const g = genero === 'feminino' ? 1 : 0;
  if (pais !== 'BR') return r.pick(NOMES_UNIVERSAIS[especie === 'cachorro' || especie === 'gato' ? especie : 'outro'][g]);
  return r.pick(especie === 'cachorro' || especie === 'gato' ? NOMES[especie][g] : animal(especie).nomes[g]);
};;

export function animaisDoAbrigo(v: Vida): AnimalDoAbrigo[] {
  const ano = anoDe(v.t);
  const r = rngDe(v, `abrigo:${ano}:${v.moradia.municipioId}`);
  const n = r.int(3, 5);
  const out: AnimalDoAbrigo[] = [];
  const usados = new Set<string>();
  for (let k = 0; k < n; k++) {
    // Abrigo recebe sobretudo cães e gatos; às vezes, um coelho ou um porquinho-da-índia abandonado.
    if (r.chance(0.08)) {
      const esp: Especie = r.chance(0.5) ? 'coelho' : 'porquinho';
      const a = animal(esp);
      const genero = r.chance(0.5) ? 'masculino' : 'feminino';
      out.push({ id: `ab-${ano}-${k}`, especie: esp, nome: nomeDePet(r, esp, genero), genero, idade: r.int(1, 3), porte: 'pequeno', jeito: r.pick(a.jeitos)[genero === 'feminino' ? 1 : 0], historia: genero === 'feminino' ? 'deixada numa caixa na porta do abrigo' : 'deixado numa caixa na porta do abrigo' });
      continue;
    }
    const especie = r.chance(0.58) ? 'cachorro' : 'gato';
    const genero = r.chance(0.5) ? 'masculino' : 'feminino';
    const g = genero === 'feminino' ? 1 : 0;
    const idade = r.weighted([0, 1, 2, 3, 4, 6, 8, 10], x => (x === 0 ? 3 : x <= 3 ? 2 : 1))!;
    const porte = especie === 'gato' ? 'pequeno' : r.weighted(['pequeno', 'medio', 'grande'] as const, p => (p === 'medio' ? 2 : 1))!;
    const jeito = r.pick(especie === 'cachorro' ? JEITOS_CAO : JEITOS_GATO)[g];
    let nome = r.pick(NOMES[especie][g]);
    for (let t = 0; t < 5 && usados.has(nome); t++) nome = r.pick(NOMES[especie][g]);
    usados.add(nome);
    out.push({ id: `ab-${ano}-${k}`, especie, nome, genero, idade, porte, jeito, historia: r.pick(HISTORIAS)[g] });
  }
  return out;
}

export const animalDoAbrigo = (v: Vida, id: string) => animaisDoAbrigo(v).find(a => a.id === id);

/**
 * A loja de animais e os criadouros autorizados da cidade, neste ano: só
 * espécies que se podem ter legalmente. Silvestre nativo (papagaio, jabuti,
 * iguana) só de criadouro autorizado — com nota fiscal e marcação.
 */
export interface OfertaDePet extends AnimalDoAbrigo { preco: number; origem: 'loja' | 'criador'; documentos?: string }

export function ofertasDePets(v: Vida): OfertaDePet[] {
  const ano = anoDe(v.t);
  const r = rngDe(v, `pets:${ano}:${v.moradia.municipioId}`);
  const c = Math.sqrt(economiaLocal(v.moradia.municipioId).custo);
  const out: OfertaDePet[] = [];
  const especies = ANIMAIS.filter(a => !a.exotico && (a.origens.includes('loja') || a.origens.includes('criadouro')));
  const escolhidas = [...especies];
  for (let k = escolhidas.length - 1; k > 0; k--) { const j = r.int(0, k); [escolhidas[k], escolhidas[j]] = [escolhidas[j], escolhidas[k]]; }
  escolhidas.length = Math.min(6, escolhidas.length);
  // Silvestres de criadouro só aparecem em cidade com esse comércio (ou por encomenda, nas capitais).
  const grande = ['metropole', 'capital', 'metropolitana'].includes(municipio(v.moradia.municipioId).perfil);
  for (const [k, a] of escolhidas.entries()) {
    if (a.silvestre && !grande) continue;
    const genero = r.chance(0.5) ? 'masculino' : 'feminino';
    const g = genero === 'feminino' ? 1 : 0;
    out.push({
      id: `pt-${ano}-${k}`, especie: a.id, nome: nomeDePet(r, a.id, genero), genero, idade: a.grupo === 'reptil' ? r.int(0, 2) : 0, porte: 'pequeno',
      jeito: r.pick(a.jeitos)[g], historia: a.silvestre ? 'de um criadouro autorizado' : 'nascido em criador', preco: Math.round(r.int(a.preco[0], a.preco[1]) * c / 10) * 10,
      origem: a.origens.includes('criadouro') && (a.silvestre || !a.origens.includes('loja')) ? 'criador' : 'loja',
      documentos: a.silvestre ? `Nota fiscal, marcação (anilha ou microchip) e o registro do criadouro ${textoLocal(v, 'orgaoAmbiental').replace(/^o /, 'no ').replace(/^a /, 'na ')}.` : undefined
    });
  }
  return out;
}

export const ofertaDePet = (v: Vida, id: string) => ofertasDePets(v).find(o => o.id === id);
