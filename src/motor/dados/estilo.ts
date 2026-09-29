/**
 * O que existe para a aparência e o estilo — poucas coisas, que o retrato
 * sabe desenhar. Cortes, cores e barba são personalização básica (grátis);
 * óculos, chapéus, roupas e acessórios são itens comprados, que ficam com a
 * pessoa. Luxo existe — e só pesa na IMAGEM de quem já é conhecido
 * (`sistemas/estilo`), nunca na notoriedade.
 */

import type { EstiloRoupa, Vida, Visual } from '../tipos';

/** Cortes de cabelo (o retrato desenha todos). Nenhum é de um gênero só. */
export const CORTES: { id: string; nome: string; curto?: boolean }[] = [
  { id: 'raspado', nome: 'Raspado', curto: true },
  { id: 'curto', nome: 'Curto', curto: true },
  { id: 'curto_lado', nome: 'Curto, repartido de lado', curto: true },
  { id: 'crespo_curto', nome: 'Crespo curto', curto: true },
  { id: 'ondulado', nome: 'Ondulado', curto: true },
  { id: 'cacheado', nome: 'Cacheado' },
  { id: 'chanel', nome: 'Chanel' },
  { id: 'black', nome: 'Black power' },
  { id: 'longo_liso', nome: 'Longo e liso' },
  { id: 'longo_ondulado', nome: 'Longo e ondulado' },
  { id: 'cacheado_longo', nome: 'Cacheado longo' },
  { id: 'trancas', nome: 'Tranças' },
  { id: 'rabo', nome: 'Rabo de cavalo' },
  { id: 'coque', nome: 'Coque' }
];

/** Cores: as naturais e as de tinta (a tinta é a partir da adolescência). */
export const CORES_NATURAIS = ['preto', 'castanho_escuro', 'castanho', 'castanho_claro', 'loiro', 'ruivo'];
export const CORES_TINTA = ['platinado', 'vermelho', 'azul', 'rosa'];
export const NOME_COR: Record<string, string> = {
  preto: 'Preto', castanho_escuro: 'Castanho-escuro', castanho: 'Castanho', castanho_claro: 'Castanho-claro', loiro: 'Loiro', ruivo: 'Ruivo',
  platinado: 'Platinado', vermelho: 'Vermelho (tinta)', azul: 'Azul (tinta)', rosa: 'Rosa (tinta)', grisalho: 'Grisalho'
};

export const BARBAS: { id: string; nome: string }[] = [
  { id: 'nenhuma', nome: 'Sem barba' }, { id: 'por_fazer', nome: 'Por fazer' }, { id: 'curta', nome: 'Curta' },
  { id: 'cheia', nome: 'Cheia' }, { id: 'cavanhaque', nome: 'Cavanhaque' }, { id: 'bigode', nome: 'Só bigode' }
];

export const ROUPAS: { id: EstiloRoupa; nome: string }[] = [
  { id: 'basica', nome: 'Do dia a dia' }, { id: 'esportiva', nome: 'Esportiva' }, { id: 'social', nome: 'Social' },
  { id: 'alternativa', nome: 'Alternativa' }, { id: 'elegante', nome: 'Elegante' }
];

export type CategoriaItem = 'oculos' | 'chapeu' | 'roupa' | 'acessorio';

export interface ItemEstilo {
  id: string;
  nome: string;
  categoria: CategoriaItem;
  /** Preço de referência (reais de hoje; a cidade ajusta). */
  preco: number;
  /** O que o item muda no retrato quando está em uso. */
  visual?: Partial<Pick<Visual, 'oculos' | 'chapeu' | 'roupa'>>;
  /** Peça de luxo: status social em certos contextos — nunca fama. */
  luxo?: boolean;
  descricao: string;
  /** Óculos de grau pedem receita (o corpo precisa ter pedido). */
  receita?: boolean;
}

export const ITENS_ESTILO: readonly ItemEstilo[] = [
  { id: 'oculos_grau', nome: 'Óculos de grau', categoria: 'oculos', preco: 480, visual: { oculos: 'grau' }, receita: true, descricao: 'Consulta, receita, armação e lente. Enxergar o quadro de novo.' },
  { id: 'oculos_redondo', nome: 'Armação redonda', categoria: 'oculos', preco: 260, visual: { oculos: 'redondo' }, descricao: 'Armação de acetato, lente sem grau ou com grau leve. Muda o rosto.' },
  { id: 'oculos_sol', nome: 'Óculos escuros', categoria: 'oculos', preco: 180, visual: { oculos: 'sol' }, descricao: 'Para o sol — e para quem gosta de não ser olhado nos olhos.' },
  { id: 'oculos_grife', nome: 'Óculos escuros de grife', categoria: 'oculos', preco: 1900, visual: { oculos: 'sol' }, luxo: true, descricao: 'O mesmo sol, com a marca na haste.' },
  { id: 'bone', nome: 'Boné', categoria: 'chapeu', preco: 70, visual: { chapeu: 'bone' }, descricao: 'Aba curva, do time ou liso.' },
  { id: 'chapeu', nome: 'Chapéu', categoria: 'chapeu', preco: 160, visual: { chapeu: 'chapeu' }, descricao: 'Chapéu de aba: panamá, feltro ou palha.' },
  { id: 'gorro', nome: 'Gorro', categoria: 'chapeu', preco: 55, visual: { chapeu: 'gorro' }, descricao: 'Lã, para o frio (ou para o estilo).' },
  { id: 'lenco', nome: 'Lenço na cabeça', categoria: 'chapeu', preco: 45, visual: { chapeu: 'lenco' }, descricao: 'Estampado, amarrado do seu jeito.' },
  { id: 'roupa_esportiva', nome: 'Roupas esportivas', categoria: 'roupa', preco: 450, visual: { roupa: 'esportiva' }, descricao: 'Tênis bom, agasalho, camiseta que respira.' },
  { id: 'roupa_social', nome: 'Roupas sociais', categoria: 'roupa', preco: 950, visual: { roupa: 'social' }, descricao: 'Camisa, calça de alfaiataria, um sapato que não machuca. A entrevista agradece.' },
  { id: 'roupa_alternativa', nome: 'Roupas de brechó e autorais', categoria: 'roupa', preco: 380, visual: { roupa: 'alternativa' }, descricao: 'Peças garimpadas, cor, estampa, um jeito próprio.' },
  { id: 'roupa_elegante', nome: 'Guarda-roupa de grife', categoria: 'roupa', preco: 6500, visual: { roupa: 'elegante' }, luxo: true, descricao: 'Peças de marca, corte perfeito. Ninguém pergunta o preço; quem sabe, sabe.' },
  { id: 'relogio', nome: 'Relógio', categoria: 'acessorio', preco: 320, descricao: 'Um relógio de pulso que dura.' },
  { id: 'relogio_luxo', nome: 'Relógio de luxo', categoria: 'acessorio', preco: 24000, luxo: true, descricao: 'Suíço, automático. Um anônimo com ele continua anônimo.' },
  { id: 'joia', nome: 'Uma joia', categoria: 'acessorio', preco: 2800, luxo: true, descricao: 'Ouro, uma pedra, um presente para si.' }
];

const POR_ID = new Map(ITENS_ESTILO.map(x => [x.id, x]));
export const itemEstilo = (id: string) => POR_ID.get(id);

/** O que o estilo em uso comunica (para a imagem pública de quem é conhecido — e só dela). */
export function sinalDoEstilo(v: Vida): { luxo: boolean; marcante: boolean } {
  const usando = (v.eu.estilo?.itens ?? []).filter(x => x.usando).map(x => itemEstilo(x.itemId)).filter(Boolean);
  const vis = v.eu.visual;
  const luxo = usando.some(x => x!.luxo);
  const recente = v.fatos['visual_repercutiu'] !== undefined && v.t - v.fatos['visual_repercutiu'] <= 36;
  const marcante = recente || CORES_TINTA.includes(vis.corCabelo) || !!vis.chapeu || vis.oculos === 'sol' || vis.roupa === 'alternativa';
  return { luxo, marcante };
}

