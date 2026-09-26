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

import { criarRng, type Rng } from '../rng';
import { ANIMAIS, animal } from '../dados/animais';
import type { Especie, Vida } from '../tipos';
import { anoDe } from '../tempo';
import { economiaLocal, municipio } from '../dados/lugares';
import { MORADIAS, VEICULOS, depreciacao, modeloMoradia, modeloVeiculo, precoImovel, type ModeloMoradia, type ModeloVeiculo } from '../dados/bens';
import { indiceImoveis } from './economia';

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
}

const BAIRROS_GRANDE: [string, number][] = [['no centro', 1.12], ['num bairro tradicional', 1.05], ['num bairro novo', 1], ['na periferia', 0.74], ['num condomínio fechado', 1.22], ['perto do metrô', 1.1]];
const BAIRROS_PEQUENA: [string, number][] = [['no centro', 1.08], ['perto da praça', 1.04], ['num bairro novo', 1], ['na saída da cidade', 0.82], ['num loteamento', 0.9]];
const ESTADOS: [EstadoImovel, number, string][] = [['novo', 1.1, 'nunca habitado'], ['bom', 1, 'bem conservado'], ['reforma', 0.8, 'precisa de reforma']];
const DETALHES = ['sol da manhã', 'vaga na garagem', 'perto de escola', 'rua tranquila', 'perto do comércio', 'vista aberta', 'área de serviço grande', 'andar alto', 'sem elevador', 'barulho da avenida'];

/** Aluguel de um tipo de moradia numa cidade, hoje (acompanha em parte o preço dos imóveis). */
export function aluguelDe(v: Vida, m: ModeloMoradia, municipioId: string): number {
  const idx = 0.5 + 0.5 * indiceImoveis(v);
  return Math.round(economiaLocal(municipioId).aluguel * m.fatorAluguel * idx / 10) * 10;
}

/** Preço de um tipo de imóvel numa cidade, hoje. */
export const precoDeImovel = (v: Vida, m: ModeloMoradia, municipioId: string) =>
  Math.round(precoImovel(m, economiaLocal(municipioId).custo) * indiceImoveis(v) / 1000) * 1000;

export function ofertasDeImoveis(v: Vida, modo: 'aluguel' | 'venda', municipioId = v.moradia.municipioId): OfertaImovel[] {
  const ano = anoDe(v.t);
  const r = rngDe(v, `im:${modo}:${ano}:${municipioId}`);
  const pequena = ['pequena', 'polo'].includes(municipio(municipioId).perfil);
  const bairros = pequena ? BAIRROS_PEQUENA : BAIRROS_GRANDE;
  const out: OfertaImovel[] = [];
  let k = 0;
  for (const m of MORADIAS) {
    if (m.rural) continue;
    if (m.id === 'republica' && modo === 'venda') continue;
    if (m.id === 'alto_padrao' && pequena) continue;
    const quantas = m.id === 'republica' ? 1 : m.padrao >= 5 ? 1 : 2;
    for (let q = 0; q < quantas; q++) {
      const [bairro, fb] = m.id === 'casa_simples' ? bairros[bairros.length - 1 - r.int(0, 1)] : r.pick(bairros);
      const [estado, fe, textoEstado] = m.id === 'republica' ? ESTADOS[1] : r.weighted(ESTADOS, e => (e[0] === 'novo' ? (modo === 'venda' ? 1 : 0.5) : e[0] === 'bom' ? 2 : 1))!;
      const ruido = 0.93 + r.next() * 0.14;
      const preco = Math.round(precoDeImovel(v, m, municipioId) * fb * fe * ruido / 1000) * 1000;
      const aluguel = Math.round(aluguelDe(v, m, municipioId) * fb * (0.92 + (fe - 1) * 0.5 + r.next() * 0.16) / 10) * 10;
      const aceitaPet = m.casa ? true : m.id === 'republica' ? r.chance(0.3) : r.chance(m.id === 'kitnet' ? 0.4 : 0.7);
      out.push({
        id: `im-${modo}-${ano}-${k++}`, modo, modeloId: m.id, bairro, estado, preco, aluguel, aceitaPet, quartos: m.quartos,
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

export interface OfertaVeiculo {
  id: string;
  lugar: 'concessionaria' | 'usados' | 'motos';
  modeloId: string;
  usado: boolean;
  anoFabricacao: number;
  preco: number;
  estado: number;
  /** A história do usado, em uma linha. */
  historico?: string;
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

export function ofertasDeVeiculos(v: Vida, lugar: OfertaVeiculo['lugar']): OfertaVeiculo[] {
  const ano = anoDe(v.t);
  const r = rngDe(v, `vei:${lugar}:${ano}:${v.moradia.municipioId}`);
  const custo = economiaLocal(v.moradia.municipioId).custo;
  const regional = 0.96 + 0.08 * Math.min(1.3, custo);
  const out: OfertaVeiculo[] = [];
  let k = 0;
  const novo = (m: ModeloVeiculo) => out.push({ id: `ve-${lugar}-${ano}-${k++}`, lugar, modeloId: m.id, usado: false, anoFabricacao: ano, preco: Math.round(m.preco * regional / 100) * 100, estado: 100 });
  const usado = (m: ModeloVeiculo) => {
    const anos = m.categoria === 'bicicleta' ? r.int(1, 5) : r.int(2, 14);
    const [historico, de, dp] = r.pick(HISTORICOS);
    const estado = Math.round(Math.max(25, Math.min(95, 92 - anos * 4 + de + r.normal() * 5)));
    const preco = Math.round(m.preco * regional * depreciacao(m, anos) * dp * (0.85 + estado / 600) / 100) * 100;
    out.push({ id: `ve-${lugar}-${ano}-${k++}`, lugar, modeloId: m.id, usado: true, anoFabricacao: ano - anos, preco, estado, historico });
  };
  if (lugar === 'concessionaria') for (const m of VEICULOS.filter(x => x.categoria === 'carro')) novo(m);
  else if (lugar === 'motos') {
    for (const m of VEICULOS.filter(x => x.categoria !== 'carro')) novo(m);
    for (const m of VEICULOS.filter(x => x.categoria === 'moto')) usado(m);
    usado(modeloVeiculo('bike'));
  } else {
    const carros = VEICULOS.filter(x => x.categoria === 'carro');
    for (let q = 0; q < 9; q++) usado(r.weighted(carros, m => (m.id === 'carro_compacto' ? 4 : m.id === 'carro_sedan' ? 2.5 : m.id === 'carro_suv' ? 2 : m.id === 'carro_suv_grande' ? 1 : 0.5))!);
  }
  return out;
}

export function ofertaDeVeiculo(v: Vida, id: string): OfertaVeiculo | undefined {
  const lugar = id.split('-')[1] as OfertaVeiculo['lugar'];
  return ofertasDeVeiculos(v, lugar).find(o => o.id === id);
}

/** Oferta para comandos antigos que só dizem o modelo. */
export function ofertaVeiculoPorModelo(v: Vida, modeloId: string, usado?: boolean): OfertaVeiculo | undefined {
  const m = modeloVeiculo(modeloId);
  const lugar = m.categoria === 'carro' ? (usado ? 'usados' : 'concessionaria') : 'motos';
  const lista = ofertasDeVeiculos(v, lugar).filter(o => o.modeloId === m.id && (usado === undefined || o.usado === usado));
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

/** Um nome de bicho que combina com o gênero dele. */
export const nomeDePet = (r: Rng, especie: Especie, genero: 'masculino' | 'feminino' | 'nao_binario') => r.pick(especie === 'cachorro' || especie === 'gato' ? NOMES[especie][genero === 'feminino' ? 1 : 0] : animal(especie).nomes[genero === 'feminino' ? 1 : 0]);

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
      out.push({ id: `ab-${ano}-${k}`, especie: esp, nome: r.pick(a.nomes[genero === 'feminino' ? 1 : 0]), genero, idade: r.int(1, 3), porte: 'pequeno', jeito: r.pick(a.jeitos)[genero === 'feminino' ? 1 : 0], historia: genero === 'feminino' ? 'deixada numa caixa na porta do abrigo' : 'deixado numa caixa na porta do abrigo' });
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
  const especies = ANIMAIS.filter(a => a.origens.includes('loja') || a.origens.includes('criadouro'));
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
      id: `pt-${ano}-${k}`, especie: a.id, nome: r.pick(a.nomes[g]), genero, idade: a.grupo === 'reptil' ? r.int(0, 2) : 0, porte: 'pequeno',
      jeito: r.pick(a.jeitos)[g], historia: a.silvestre ? 'de um criadouro autorizado' : 'nascido em criador', preco: Math.round(r.int(a.preco[0], a.preco[1]) * c / 10) * 10,
      origem: a.origens.includes('criadouro') && (a.silvestre || !a.origens.includes('loja')) ? 'criador' : 'loja',
      documentos: a.silvestre ? 'Nota fiscal, marcação (anilha ou microchip) e o registro do criadouro no IBAMA.' : undefined
    });
  }
  return out;
}

export const ofertaDePet = (v: Vida, id: string) => ofertasDePets(v).find(o => o.id === id);
