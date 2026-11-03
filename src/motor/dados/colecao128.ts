/**
 * VIDA 12.8 — COLEÇÕES: o vinho de guarda, os móveis de expor e a raridade em seis graus.
 *
 * A RARIDADE sai dos dados da peça, nunca do preço: a peça única é a do catálogo marcada como única; a edição limitada
 * é a que o próprio nome declara a tiragem (a gravura numerada, a fotografia de tiragem de 10, o relógio de edição
 * limitada; na casa, a peça numerada da 12.7); "muito rara" é a rara das faixas de cima do mercado (5 e 6: a que só sai
 * sob consulta ou em leilão especial). Um Rolex de série caro continua "de série": preço não é raridade.
 *
 * O VINHO é a coleção que pede casa: fora da temperatura certa (sem adega), envelhece mal — perde estado e valor todo
 * ano. As garrafas são descritas pela classe (o Bordeaux de château classificado, o Porto vintage), não por um rótulo
 * inventado; os preços são de referência do mercado brasileiro de importação, em reais de 2026.
 *
 * Catálogo puro (só tipos), no pacote próprio dos catálogos da 12.8.
 */
import type { PecaDeColecao } from './colecionaveis';
import type { Coisa } from './coisas';

export const VINHOS: PecaDeColecao[] = [
  { id: 'vin_tinto_guarda', nome: 'caixa de tinto de guarda (seis garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1800, retencao: 0.6, tendencia: 0.01, oscila: 0.04, fabricante: 'vinícola de denominação de origem', periodo: 'safra recente', material: 'vinho tinto', faixa: 1, liquidez: 'media', descricao: 'Feito para esperar uns anos na adega antes de abrir.' },
  { id: 'vin_champagne', nome: 'champanhe de cuvée de prestígio', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 3600, retencao: 0.7, tendencia: 0.02, oscila: 0.05, fabricante: 'casa de champanhe', periodo: 'safra declarada', material: 'espumante', faixa: 1, liquidez: 'media', descricao: 'A garrafa das grandes datas — e das que viram data por causa dela.' },
  { id: 'vin_porto_vintage', nome: 'Porto vintage de safra declarada', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 4800, retencao: 0.8, tendencia: 0.03, oscila: 0.05, fabricante: 'casa do Douro', periodo: 'safra declarada', material: 'vinho do Porto', faixa: 1, liquidez: 'media', descricao: 'Só se declara vintage nos anos bons. Melhora por décadas.' },
  { id: 'vin_bordeaux', nome: 'caixa de Bordeaux de château classificado', artigo: 'a', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 16000, retencao: 0.75, tendencia: 0.03, oscila: 0.07, fabricante: 'château classificado de Bordeaux', periodo: 'safra boa', material: 'vinho tinto', faixa: 2, liquidez: 'media', descricao: 'Seis garrafas de uma safra elogiada: o investimento clássico de quem tem adega.' },
  { id: 'vin_borgonha', nome: 'garrafa de Borgonha grand cru', artigo: 'a', categoria: 'vinho', raridade: 'rara', loja: 'vinhos', preco: 24000, retencao: 0.85, tendencia: 0.04, oscila: 0.09, fabricante: 'domaine da Borgonha', periodo: 'safra boa', material: 'pinot noir', faixa: 3, liquidez: 'baixa', descricao: 'De um vinhedo de poucos hectares: pouca garrafa no mundo, muita gente querendo.' },
  { id: 'vin_safra_historica', nome: 'garrafa de uma safra histórica', artigo: 'a', categoria: 'vinho', raridade: 'rara', loja: 'leilao', preco: 180000, retencao: 0.85, tendencia: 0.03, oscila: 0.12, fabricante: 'grande château', periodo: 'safra lendária do século XX', material: 'vinho tinto', faixa: 5, liquidez: 'baixa', patrimonioMin: 8_000_000, descricao: 'Lote de leilão com a procedência de adega em adega desde a safra.' }
];

/** Os móveis de expor: a vitrine, o expositor de relógios, a estante de troféus, a adega de parede. */
export const COISAS_DE_EXPOR: Coisa[] = [
  { id: 'vitrine_colecao', nome: 'vitrine de vidro iluminada', artigo: 'a', loja: 'casa', preco: 7800, vida: 30, idadeMin: 18, nivel: 4, descricao: 'Vidro temperado, luz de LED, chave: o que é de coleção fica à vista e sem poeira.', daCasa: true },
  { id: 'expositor_relogios', nome: 'expositor de relógios com giradores', artigo: 'o', loja: 'casa', preco: 4200, vida: 20, idadeMin: 18, nivel: 4, descricao: 'Caixa de madeira e vidro com giradores: os automáticos seguem andando.', daCasa: true },
  { id: 'estante_trofeus', nome: 'estante de troféus e lembranças', artigo: 'a', loja: 'casa', preco: 3400, vida: 30, idadeMin: 18, nivel: 3, descricao: 'Nichos iluminados para troféus, medalhas, a bola autografada.', daCasa: true },
  { id: 'adega_parede', nome: 'adega de parede para duzentas garrafas', artigo: 'a', loja: 'casa', preco: 26000, vida: 20, idadeMin: 18, nivel: 5, descricao: 'Do chão ao teto, porta de vidro, duas temperaturas: a coleção de vinhos guardada como deve.', eletro: true, daCasa: true }
];

/** Onde cada categoria de peça fica bem exposta (o móvel que a protege e mostra). */
export const EXPOSITOR_DA_CATEGORIA: Record<string, string[]> = {
  relogio: ['expositor_relogios', 'vitrine_colecao'],
  joia: ['vitrine_colecao', 'expositor_relogios'],
  antiguidade: ['vitrine_colecao'],
  memorabilia: ['estante_trofeus', 'vitrine_colecao'],
  vinho: ['adega', 'adega_parede'],
  arte: []
};

export type GrauDeRaridade = 'comum' | 'incomum' | 'rara' | 'muito_rara' | 'limitada' | 'unica';
export const NOME_GRAU: Record<GrauDeRaridade, string> = { comum: 'Comum', incomum: 'Incomum', rara: 'Rara', muito_rara: 'Muito rara', limitada: 'Edição limitada', unica: 'Peça única' };
export const ORDEM_DO_GRAU: GrauDeRaridade[] = ['comum', 'incomum', 'rara', 'muito_rara', 'limitada', 'unica'];

/** O que o nome da peça declara como tiragem (a gravura numerada, a tiragem de 10, a edição limitada, a peça numerada). */
export const DECLARA_TIRAGEM = /edição limitada|tiragem|numerad/i;

/** O grau de raridade de uma peça, dos dados dela (a raridade do catálogo, a faixa do mercado, a tiragem declarada). */
export function grauDaPeca(p: { raridade: string; faixa?: number; nome: string; unica?: boolean | string; canal?: string }): GrauDeRaridade {
  if (p.raridade === 'unica' || p.unica) return 'unica';
  if (DECLARA_TIRAGEM.test(p.nome)) return 'limitada';
  if (p.raridade === 'rara') return (p.faixa ?? 0) >= 5 || p.canal ? 'muito_rara' : 'rara';
  return p.raridade === 'incomum' ? 'incomum' : 'comum';
}
