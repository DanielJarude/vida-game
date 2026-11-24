/**
 * VIDA 36 · NAVEGAÇÃO DAS LOJAS DE CARROS E MOTOS. A vitrine de veículos (concessionária, usados, motos) ganha busca,
 * filtro por marca, classe e faixa de preço, ordenação e comparação de até três modelos. Tudo é lido das ofertas que a
 * loja já mostra (`ofertasDeVeiculos`) e do catálogo (`versaoVeiculo`, `modeloVeiculo`) — nada aqui inventa veículo.
 */
import type { OfertaVeiculo } from './mercado';
import { modeloVeiculo, versaoVeiculo, type FaixaVeiculo } from '../dados/bens';
import { normalizarBusca } from './lojas';

export type OrdemDeVeiculos = 'relevancia' | 'menor' | 'maior' | 'nova' | 'conforto' | 'nome';

export interface FiltroDeVeiculos {
  texto?: string;
  marca?: string;
  /** A classe em palavras ("compacto", "SUV", "moto 160 cc"): o que a versão diz de si. */
  classe?: string;
  faixa?: FaixaVeiculo | '';
  ordem?: OrdemDeVeiculos;
}

/** Os dados que a vitrine e a comparação leem, de uma oferta. */
export interface FichaDeVeiculo {
  oferta: OfertaVeiculo;
  marca: string;
  modelo: string;
  nome: string;
  classe: string;
  faixa: FaixaVeiculo | undefined;
  categoria: string;
  lugares: number;
  conforto: number;
  cnh: boolean;
  idadeMin: number;
  usoMensal: number;
  taxaAnual: number;
  preco: number;
  anoFabricacao: number;
  usado: boolean;
}

/** A ficha de uma oferta: tudo o que a vitrine e a comparação precisam, lido do catálogo. */
export function fichaDoVeiculo(o: OfertaVeiculo): FichaDeVeiculo {
  const ve = versaoVeiculo(o.versaoId);
  const mo = modeloVeiculo(o.modeloId);
  const marca = ve?.marca ?? '';
  const modelo = ve?.modelo ?? mo.nome;
  return {
    oferta: o,
    marca,
    modelo,
    nome: `${marca} ${modelo}`.trim(),
    classe: ve?.dica ?? mo.nome,
    faixa: ve?.faixa,
    categoria: mo.categoria,
    lugares: ve?.lugares ?? mo.lugares,
    conforto: mo.conforto,
    cnh: mo.cnh,
    idadeMin: mo.idadeMin,
    usoMensal: ve?.usoMensal ?? mo.usoMensal,
    taxaAnual: mo.taxaAnual,
    preco: o.preco,
    anoFabricacao: o.anoFabricacao,
    usado: o.usado,
  };
}

/** As marcas que a vitrine tem agora (para o filtro), sem repetição e em ordem de nome. */
export function marcasDaVitrine(fichas: FichaDeVeiculo[]): string[] {
  return [...new Set(fichas.map(f => f.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** As classes da vitrine (o que a versão diz de si: "SUV", "compacto", "moto 160 cc"). */
export function classesDaVitrine(fichas: FichaDeVeiculo[]): string[] {
  return [...new Set(fichas.map(f => f.classe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Filtra e ordena. Sem filtro, devolve tudo na ordem pedida (a relevância é a ordem que a loja já dá). */
export function filtrarVeiculos(fichas: FichaDeVeiculo[], f: FiltroDeVeiculos): FichaDeVeiculo[] {
  const t = f.texto ? normalizarBusca(f.texto) : '';
  let out = fichas.filter(x => {
    if (t && !normalizarBusca(`${x.nome} ${x.classe} ${x.categoria}`).includes(t)) return false;
    if (f.marca && x.marca !== f.marca) return false;
    if (f.classe && x.classe !== f.classe) return false;
    if (f.faixa && x.faixa !== f.faixa) return false;
    return true;
  });
  const ordem = f.ordem ?? 'relevancia';
  if (ordem === 'menor') out = [...out].sort((a, b) => a.preco - b.preco);
  else if (ordem === 'maior') out = [...out].sort((a, b) => b.preco - a.preco);
  else if (ordem === 'nova') out = [...out].sort((a, b) => b.anoFabricacao - a.anoFabricacao || a.preco - b.preco);
  else if (ordem === 'conforto') out = [...out].sort((a, b) => b.conforto - a.conforto || a.preco - b.preco);
  else if (ordem === 'nome') out = [...out].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return out;
}

/** Até três modelos para comparar, lado a lado. Mais que três: os três primeiros (a tela avisa o limite). */
export const LIMITE_DE_COMPARACAO = 3;
export function compararVeiculos(fichas: FichaDeVeiculo[], ids: string[]): FichaDeVeiculo[] {
  const escolhidas: FichaDeVeiculo[] = [];
  for (const id of ids) {
    const x = fichas.find(f => f.oferta.id === id);
    if (x && !escolhidas.includes(x)) escolhidas.push(x);
    if (escolhidas.length === LIMITE_DE_COMPARACAO) break;
  }
  return escolhidas;
}
