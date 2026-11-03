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
  // 12.8.1: a carta da importadora — tintos, brancos, rosés, espumantes, fortificados e de sobremesa.
  { id: 'vin_tinto_guarda', nome: 'caixa de tinto de guarda (seis garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1800, retencao: 0.6, tendencia: 0.01, oscila: 0.04, fabricante: 'vinícola de denominação de origem', periodo: 'safra recente', material: 'vinho tinto', faixa: 1, liquidez: 'media', estilo: 'tinto', descricao: 'Feito para esperar uns anos na adega antes de abrir.' },
  { id: 'vin_malbec_altitude', nome: 'caixa de Malbec de altitude (seis garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1500, retencao: 0.55, tendencia: 0.01, oscila: 0.04, fabricante: 'bodega de Mendoza, vinhedo a mil metros', periodo: 'safra recente', material: 'malbec', faixa: 1, liquidez: 'media', estilo: 'tinto', descricao: 'Fruta escura, taninos macios; ganha corpo em cinco ou seis anos de garrafa.' },
  { id: 'vin_douro_reserva', nome: 'caixa de Douro tinto reserva (seis garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 2100, retencao: 0.6, tendencia: 0.01, oscila: 0.04, fabricante: 'quinta do Douro', periodo: 'safra recente', material: 'touriga nacional e touriga franca', faixa: 1, liquidez: 'media', estilo: 'tinto', descricao: 'Os socalcos de xisto em garrafa: firme hoje, redondo daqui a uma década.' },
  { id: 'vin_rioja_gran_reserva', nome: 'Rioja gran reserva', artigo: 'o', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1300, retencao: 0.6, tendencia: 0.02, oscila: 0.04, fabricante: 'bodega da Rioja Alta', periodo: 'cinco anos entre barrica e garrafa', material: 'tempranillo', faixa: 1, liquidez: 'media', estilo: 'tinto', descricao: 'Sai da adega da bodega já envelhecido; aguenta outros vinte anos deitado.' },
  { id: 'vin_chianti_riserva', nome: 'caixa de Chianti Classico riserva (três garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1600, retencao: 0.55, tendencia: 0.01, oscila: 0.04, fabricante: 'fattoria do Chianti Classico', periodo: 'safra recente', material: 'sangiovese', faixa: 1, liquidez: 'media', estilo: 'tinto', descricao: 'Cereja, couro e ervas secas: o tinto toscano de mesa farta que também sabe esperar.' },
  { id: 'vin_napa_cabernet', nome: 'Cabernet Sauvignon de Napa Valley', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 4200, retencao: 0.65, tendencia: 0.02, oscila: 0.05, fabricante: 'vinícola do vale de Napa', periodo: 'safra recente', material: 'cabernet sauvignon', faixa: 1, liquidez: 'media', estilo: 'tinto', descricao: 'Potente e polido: o Novo Mundo que aprendeu a envelhecer bem.' },
  { id: 'vin_brunello', nome: 'Brunello di Montalcino', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 3900, retencao: 0.7, tendencia: 0.03, oscila: 0.05, fabricante: 'tenuta de Montalcino', periodo: 'safra boa', material: 'sangiovese grosso', faixa: 1, liquidez: 'media', estilo: 'tinto', descricao: 'Cinco anos de espera antes de sair da vinícola; melhora por mais vinte.' },
  { id: 'vin_barolo', nome: 'Barolo de vinhedo único', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 5200, retencao: 0.72, tendencia: 0.03, oscila: 0.06, fabricante: 'cantina das Langhe', periodo: 'safra boa', material: 'nebbiolo', faixa: 2, liquidez: 'media', estilo: 'tinto', descricao: 'O "vinho dos reis" do Piemonte: rosas e alcatrão, taninos que pedem paciência.' },
  { id: 'vin_bordeaux', nome: 'caixa de Bordeaux de château classificado', artigo: 'a', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 16000, retencao: 0.75, tendencia: 0.03, oscila: 0.07, fabricante: 'château classificado de Bordeaux', periodo: 'safra boa', material: 'vinho tinto', faixa: 2, liquidez: 'media', estilo: 'tinto', descricao: 'Seis garrafas de uma safra elogiada: o investimento clássico de quem tem adega.' },
  { id: 'vin_borgonha', nome: 'garrafa de Borgonha grand cru', artigo: 'a', categoria: 'vinho', raridade: 'rara', loja: 'vinhos', preco: 24000, retencao: 0.85, tendencia: 0.04, oscila: 0.09, fabricante: 'domaine da Borgonha', periodo: 'safra boa', material: 'pinot noir', faixa: 3, liquidez: 'baixa', estilo: 'tinto', descricao: 'De um vinhedo de poucos hectares: pouca garrafa no mundo, muita gente querendo.' },
  { id: 'vin_chablis', nome: 'caixa de Chablis premier cru (três garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1900, retencao: 0.6, tendencia: 0.01, oscila: 0.04, fabricante: 'domaine de Chablis', periodo: 'safra recente', material: 'chardonnay', faixa: 1, liquidez: 'media', estilo: 'branco', descricao: 'Mineral, sem madeira, de solo de conchas fósseis: o branco que envelhece de verdade.' },
  { id: 'vin_riesling', nome: 'Riesling Spätlese do Mosel', artigo: 'o', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 650, retencao: 0.55, tendencia: 0.01, oscila: 0.04, fabricante: 'vinícola das encostas do Mosel', periodo: 'safra recente', material: 'riesling', faixa: 1, liquidez: 'media', estilo: 'branco', descricao: 'Leve, de acidez viva e um fio de doçura; vira mel e querosene com os anos.' },
  { id: 'vin_sancerre', nome: 'caixa de Sancerre (seis garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1400, retencao: 0.5, tendencia: 0.0, oscila: 0.03, fabricante: 'domaine do Loire', periodo: 'safra recente', material: 'sauvignon blanc', faixa: 1, liquidez: 'alta', estilo: 'branco', descricao: 'Cítrico e fresco: para beber nos próximos anos, não para guardar uma vida.' },
  { id: 'vin_borgonha_branco', nome: 'Meursault premier cru', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 4600, retencao: 0.7, tendencia: 0.03, oscila: 0.06, fabricante: 'domaine da Côte de Beaune', periodo: 'safra boa', material: 'chardonnay', faixa: 2, liquidez: 'media', estilo: 'branco', descricao: 'Manteiga, avelã e uma tensão que segura o vinho por quinze anos.' },
  { id: 'vin_rose_provence', nome: 'caixa de rosé da Provence (seis garrafas)', artigo: 'a', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 1100, retencao: 0.45, tendencia: 0.0, oscila: 0.03, fabricante: 'château da Provence', periodo: 'safra do ano', material: 'grenache e cinsault', faixa: 1, liquidez: 'alta', estilo: 'rose', descricao: 'Cor de casca de cebola, seco e salino: o vinho do verão, para abrir logo.' },
  { id: 'vin_cava', nome: 'Cava gran reserva', artigo: 'o', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 520, retencao: 0.5, tendencia: 0.0, oscila: 0.03, fabricante: 'cava do Penedès', periodo: 'trinta meses sobre as borras', material: 'macabeo, xarel·lo e parellada', faixa: 1, liquidez: 'alta', estilo: 'espumante', descricao: 'Método tradicional, bolha fina, preço de espumante comum.' },
  { id: 'vin_franciacorta', nome: 'Franciacorta millesimato', artigo: 'o', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 780, retencao: 0.55, tendencia: 0.01, oscila: 0.03, fabricante: 'casa da Franciacorta', periodo: 'safra declarada', material: 'chardonnay e pinot nero', faixa: 1, liquidez: 'media', estilo: 'espumante', descricao: 'O espumante italiano de método clássico, de safra.' },
  { id: 'vin_champagne', nome: 'champanhe de cuvée de prestígio', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 3600, retencao: 0.7, tendencia: 0.02, oscila: 0.05, fabricante: 'casa de champanhe', periodo: 'safra declarada', material: 'espumante', faixa: 1, liquidez: 'media', estilo: 'espumante', descricao: 'A garrafa das grandes datas — e das que viram data por causa dela.' },
  { id: 'vin_porto_vintage', nome: 'Porto vintage de safra declarada', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 4800, retencao: 0.8, tendencia: 0.03, oscila: 0.05, fabricante: 'casa do Douro', periodo: 'safra declarada', material: 'vinho do Porto', faixa: 1, liquidez: 'media', estilo: 'fortificado', descricao: 'Só se declara vintage nos anos bons. Melhora por décadas.' },
  { id: 'vin_porto_tawny', nome: 'Porto tawny 20 anos', artigo: 'o', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 900, retencao: 0.6, tendencia: 0.01, oscila: 0.03, fabricante: 'casa do Douro', periodo: 'média de vinte anos em barrica', material: 'vinho do Porto', faixa: 1, liquidez: 'media', estilo: 'fortificado', descricao: 'Âmbar, nozes e caramelo: pronto para beber, aberto dura semanas.' },
  { id: 'vin_madeira', nome: 'Madeira Malvasia de 15 anos', artigo: 'o', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 950, retencao: 0.65, tendencia: 0.02, oscila: 0.03, fabricante: 'armazém do Funchal', periodo: 'quinze anos em canteiro', material: 'malvasia', faixa: 1, liquidez: 'media', estilo: 'fortificado', descricao: 'O vinho quase eterno: aquecido de propósito, não tem medo do tempo.' },
  { id: 'vin_jerez_px', nome: 'Jerez Pedro Ximénez', artigo: 'o', categoria: 'vinho', raridade: 'comum', loja: 'vinhos', preco: 420, retencao: 0.5, tendencia: 0.0, oscila: 0.03, fabricante: 'bodega de Jerez', periodo: 'solera', material: 'pedro ximénez', faixa: 1, liquidez: 'alta', estilo: 'fortificado', descricao: 'Uva passa, figo e café: a sobremesa servida em taça pequena.' },
  { id: 'vin_sauternes', nome: 'Sauternes de château classificado', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 2800, retencao: 0.75, tendencia: 0.03, oscila: 0.05, fabricante: 'château de Sauternes', periodo: 'safra boa', material: 'sémillon com podridão nobre', faixa: 1, liquidez: 'media', estilo: 'fortificado', descricao: 'O doce de Bordeaux: dourado hoje, cor de âmbar em trinta anos.' },
  { id: 'vin_tokaji', nome: 'Tokaji Aszú 5 puttonyos', artigo: 'o', categoria: 'vinho', raridade: 'incomum', loja: 'vinhos', preco: 1700, retencao: 0.7, tendencia: 0.02, oscila: 0.05, fabricante: 'adega de Tokaj', periodo: 'safra boa', material: 'furmint', faixa: 1, liquidez: 'media', estilo: 'fortificado', descricao: 'O doce húngaro dos czares: mel, damasco e uma acidez que não deixa cansar.' },
  { id: 'vin_safra_historica', nome: 'garrafa de uma safra histórica', artigo: 'a', categoria: 'vinho', raridade: 'rara', loja: 'leilao', preco: 180000, retencao: 0.85, tendencia: 0.03, oscila: 0.12, fabricante: 'grande château', periodo: 'safra lendária do século XX', material: 'vinho tinto', faixa: 5, liquidez: 'baixa', estilo: 'tinto', patrimonioMin: 8_000_000, descricao: 'Lote de leilão com a procedência de adega em adega desde a safra.' }
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
