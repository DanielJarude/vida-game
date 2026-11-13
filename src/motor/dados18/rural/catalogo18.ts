/**
 * VIDA 18 · O CATÁLOGO DO CAMPO — dados puros (só imports de tipo): os tipos de propriedade, as culturas, os rebanhos,
 * as estruturas e as máquinas. Os números são referências brasileiras arredondadas (Conab, Cepea, Embrapa, IBGE —
 * médias de 2023–2025), em reais de hoje; o motor multiplica pelo custo da economia local (`economiaLocal().custo`).
 * São ordens de grandeza para o jogo, não cotação: o preço de cada ano anda com a safra e o mercado (`v18/rural`).
 */

export type TipoRural = 'agricola' | 'pecuaria' | 'sitio' | 'chacara' | 'haras' | 'cafeeira' | 'florestal' | 'aquicultura';
export type RegiaoRural = 'Sul' | 'Sudeste' | 'Centro-Oeste' | 'Nordeste' | 'Norte' | 'outro';

export type CulturaId =
  | 'soja' | 'milho' | 'arroz' | 'feijao' | 'algodao' | 'cana' | 'cafe' | 'trigo' | 'mandioca' | 'frutas' | 'horta'
  | 'cacau' | 'acai' | 'uva' | 'eucalipto' | 'pinus';
export type GrupoCultura = 'graminea' | 'leguminosa' | 'outra';
export type CicloCultura = 'anual' | 'perene' | 'semiperene' | 'florestal';

export interface Cultura18 {
  id: CulturaId;
  nome: string;
  ciclo: CicloCultura;
  grupo: GrupoCultura;
  /** Meses (1–12) de plantio e de colheita, no Centro-Sul (o calendário que a tela mostra). */
  plantio: [number, number];
  colheita: [number, number];
  /** Unidade de venda e quanto um hectare dá num ano normal (solo bom, água suficiente, sem praga). */
  unidade: string;
  produtividade: number;
  /** Preço de referência por unidade e custo de produção por hectare (insumos, operação, colheita). */
  preco: number;
  custoHa: number;
  /** Perenes: anos até a primeira colheita; vida útil do talhão em anos (florestal: o ciclo até o corte). */
  formacao?: number;
  vidaUtil?: number;
  /** Custo de implantação por hectare (perenes, semiperenes e florestas). */
  implantacaoHa?: number;
  /** Quanto depende de água (0–1): 1 = só dá com irrigação ou várzea. */
  agua: number;
  /** A praga ou doença típica (o que a tela conta quando ela vem) e o risco-base do ano (0–1). */
  praga: string;
  risco: number;
  /** Prêmio de preço do orgânico certificado e do produto de qualidade (fração). */
  premioOrganico: number;
  premioQualidade: number;
  /** Aptidão por região (1 = referência). Fora do Brasil, `outro`. Nada é proibido pela cidade: só rende menos. */
  aptidao: Record<RegiaoRural, number>;
  /** Sensível à geada (as frentes frias do inverno no Sul e no Sudeste). */
  geada?: boolean;
  /** Teto de área por pessoa da casa (a horta é braço, não máquina): hectares. */
  maxHa?: number;
  /** Em que tipos de propriedade cabe. */
  tipos: TipoRural[];
}

const TODAS: TipoRural[] = ['agricola', 'pecuaria', 'sitio', 'chacara', 'haras', 'cafeeira', 'florestal', 'aquicultura'];
const LAVOURA: TipoRural[] = ['agricola', 'sitio', 'pecuaria'];
const ap = (s: number, se: number, co: number, ne: number, n: number, o = 0.9): Record<RegiaoRural, number> => ({ Sul: s, Sudeste: se, 'Centro-Oeste': co, Nordeste: ne, Norte: n, outro: o });

export const CULTURAS18: Record<CulturaId, Cultura18> = {
  soja: { id: 'soja', nome: 'soja', ciclo: 'anual', grupo: 'leguminosa', plantio: [9, 12], colheita: [1, 4], unidade: 'saca de 60 kg', produtividade: 58, preco: 125, custoHa: 4900, agua: 0.5, praga: 'a ferrugem-asiática', risco: 0.16, premioOrganico: 0.35, premioQualidade: 0.04, aptidao: ap(1, 0.95, 1.1, 0.85, 0.85), tipos: LAVOURA },
  milho: { id: 'milho', nome: 'milho', ciclo: 'anual', grupo: 'graminea', plantio: [9, 3], colheita: [2, 8], unidade: 'saca de 60 kg', produtividade: 95, preco: 60, custoHa: 4300, agua: 0.55, praga: 'a lagarta-do-cartucho', risco: 0.15, premioOrganico: 0.35, premioQualidade: 0.04, aptidao: ap(1.05, 1, 1.05, 0.8, 0.8), tipos: TODAS.filter(t => t !== 'florestal' && t !== 'aquicultura') },
  arroz: { id: 'arroz', nome: 'arroz irrigado', ciclo: 'anual', grupo: 'graminea', plantio: [9, 11], colheita: [2, 4], unidade: 'saca de 50 kg', produtividade: 160, preco: 90, custoHa: 11000, agua: 0.95, praga: 'a brusone', risco: 0.12, premioOrganico: 0.4, premioQualidade: 0.06, aptidao: ap(1.15, 0.8, 0.8, 0.75, 0.8), tipos: LAVOURA },
  feijao: { id: 'feijao', nome: 'feijão', ciclo: 'anual', grupo: 'leguminosa', plantio: [8, 4], colheita: [11, 7], unidade: 'saca de 60 kg', produtividade: 30, preco: 230, custoHa: 4600, agua: 0.6, praga: 'a mosca-branca', risco: 0.18, premioOrganico: 0.4, premioQualidade: 0.05, aptidao: ap(1, 1, 1, 0.9, 0.85), tipos: [...LAVOURA, 'chacara'] },
  algodao: { id: 'algodao', nome: 'algodão', ciclo: 'anual', grupo: 'outra', plantio: [12, 2], colheita: [6, 9], unidade: 'arroba de pluma', produtividade: 120, preco: 130, custoHa: 12500, agua: 0.5, praga: 'o bicudo', risco: 0.2, premioOrganico: 0.3, premioQualidade: 0.05, aptidao: ap(0.6, 0.85, 1.15, 1, 0.7), tipos: ['agricola'] },
  cana: { id: 'cana', nome: 'cana-de-açúcar', ciclo: 'semiperene', grupo: 'graminea', plantio: [1, 4], colheita: [4, 11], unidade: 'tonelada', produtividade: 80, preco: 145, custoHa: 6800, formacao: 1, vidaUtil: 6, implantacaoHa: 9000, agua: 0.6, praga: 'a cigarrinha', risco: 0.1, premioOrganico: 0.3, premioQualidade: 0.03, aptidao: ap(0.75, 1.15, 1, 0.9, 0.7), geada: true, tipos: ['agricola', 'sitio'] },
  cafe: { id: 'cafe', nome: 'café', ciclo: 'perene', grupo: 'outra', plantio: [11, 2], colheita: [5, 9], unidade: 'saca de 60 kg', produtividade: 30, preco: 1300, custoHa: 24000, formacao: 3, vidaUtil: 20, implantacaoHa: 28000, agua: 0.55, praga: 'a broca-do-café', risco: 0.14, premioOrganico: 0.35, premioQualidade: 0.35, aptidao: ap(0.8, 1.15, 0.85, 0.85, 0.75, 0.7), geada: true, tipos: ['cafeeira', 'sitio', 'agricola'] },
  trigo: { id: 'trigo', nome: 'trigo', ciclo: 'anual', grupo: 'graminea', plantio: [5, 6], colheita: [9, 11], unidade: 'saca de 60 kg', produtividade: 50, preco: 75, custoHa: 3100, agua: 0.4, praga: 'a giberela', risco: 0.17, premioOrganico: 0.3, premioQualidade: 0.05, aptidao: ap(1.1, 0.7, 0.6, 0.4, 0.3, 1), geada: true, tipos: ['agricola'] },
  mandioca: { id: 'mandioca', nome: 'mandioca', ciclo: 'anual', grupo: 'outra', plantio: [3, 6], colheita: [6, 12], unidade: 'tonelada', produtividade: 22, preco: 650, custoHa: 9000, agua: 0.3, praga: 'o mandarová', risco: 0.08, premioOrganico: 0.3, premioQualidade: 0.05, aptidao: ap(0.9, 0.9, 0.95, 1.1, 1.1), tipos: ['sitio', 'agricola', 'chacara'] },
  frutas: { id: 'frutas', nome: 'pomar (laranja, manga, banana)', ciclo: 'perene', grupo: 'outra', plantio: [10, 2], colheita: [1, 12], unidade: 'tonelada', produtividade: 30, preco: 900, custoHa: 17000, formacao: 3, vidaUtil: 15, implantacaoHa: 15000, agua: 0.6, praga: 'o greening', risco: 0.12, premioOrganico: 0.4, premioQualidade: 0.15, aptidao: ap(0.9, 1.05, 0.95, 1.1, 1), geada: true, tipos: ['sitio', 'chacara', 'agricola', 'cafeeira'] },
  horta: { id: 'horta', nome: 'hortaliças', ciclo: 'anual', grupo: 'outra', plantio: [1, 12], colheita: [1, 12], unidade: 'tonelada', produtividade: 35, preco: 1600, custoHa: 40000, agua: 0.85, praga: 'os pulgões e a mela', risco: 0.15, premioOrganico: 0.45, premioQualidade: 0.15, aptidao: ap(1, 1.05, 1, 0.95, 0.95, 1), maxHa: 4, tipos: ['sitio', 'chacara', 'agricola'] },
  cacau: { id: 'cacau', nome: 'cacau', ciclo: 'perene', grupo: 'outra', plantio: [10, 3], colheita: [4, 9], unidade: 'tonelada de amêndoa', produtividade: 0.8, preco: 22000, custoHa: 9500, formacao: 4, vidaUtil: 25, implantacaoHa: 14000, agua: 0.7, praga: 'a vassoura-de-bruxa', risco: 0.15, premioOrganico: 0.35, premioQualidade: 0.3, aptidao: ap(0.3, 0.6, 0.5, 1, 1.1, 0.6), tipos: ['sitio', 'agricola'] },
  acai: { id: 'acai', nome: 'açaí manejado', ciclo: 'perene', grupo: 'outra', plantio: [12, 3], colheita: [7, 12], unidade: 'tonelada', produtividade: 8, preco: 2500, custoHa: 11000, formacao: 4, vidaUtil: 20, implantacaoHa: 8000, agua: 0.85, praga: 'a broca-do-açaizeiro', risco: 0.08, premioOrganico: 0.25, premioQualidade: 0.1, aptidao: ap(0.15, 0.3, 0.4, 0.6, 1.2, 0.2), tipos: ['sitio', 'agricola', 'florestal'] },
  uva: { id: 'uva', nome: 'uva', ciclo: 'perene', grupo: 'outra', plantio: [7, 9], colheita: [1, 3], unidade: 'tonelada', produtividade: 18, preco: 3200, custoHa: 38000, formacao: 3, vidaUtil: 20, implantacaoHa: 60000, agua: 0.5, praga: 'o míldio', risco: 0.18, premioOrganico: 0.35, premioQualidade: 0.4, aptidao: ap(1.1, 0.9, 0.6, 1.05, 0.3, 1.1), geada: true, maxHa: 30, tipos: ['sitio', 'chacara', 'agricola'] },
  eucalipto: { id: 'eucalipto', nome: 'eucalipto', ciclo: 'florestal', grupo: 'outra', plantio: [10, 2], colheita: [1, 12], unidade: 'metro cúbico', produtividade: 280, preco: 85, custoHa: 300, formacao: 7, vidaUtil: 7, implantacaoHa: 7500, agua: 0.4, praga: 'as formigas-cortadeiras', risco: 0.06, premioOrganico: 0, premioQualidade: 0.05, aptidao: ap(1, 1.1, 1.05, 0.9, 0.9), tipos: ['florestal', 'pecuaria', 'agricola', 'sitio'] },
  pinus: { id: 'pinus', nome: 'pínus', ciclo: 'florestal', grupo: 'outra', plantio: [5, 8], colheita: [1, 12], unidade: 'metro cúbico', produtividade: 450, preco: 95, custoHa: 250, formacao: 12, vidaUtil: 12, implantacaoHa: 8000, agua: 0.3, praga: 'a vespa-da-madeira', risco: 0.06, premioOrganico: 0, premioQualidade: 0.05, aptidao: ap(1.15, 0.85, 0.5, 0.3, 0.2, 1), tipos: ['florestal'] }
};

/* ------------------------------------------------------------------ Rebanhos */

export type EspecieRural = 'corte' | 'leite' | 'cavalos' | 'ovelhas' | 'cabras' | 'porcos' | 'galinhas' | 'frangos' | 'tilapia' | 'tambaqui';

export interface Rebanho18Dados {
  id: EspecieRural;
  nome: string;
  /** Plural de uma cabeça (para "120 cabeças", "3.000 aves", "8 t/ano"). */
  unidade: string;
  /** Unidade animal (UA = 450 kg de peso vivo) por cabeça: quanto pasto ocupa. Zero: não vai ao pasto (galpão, tanque). */
  ua: number;
  /** Preço médio de uma cabeça do rebanho (matrizes, jovens e reprodutores) e custo de manter uma por ano (pasto, ração, sal, vacina). */
  valor: number;
  custoAno: number;
  /** Fração de matrizes e nascidos (ou lotes) por matriz por ano, num manejo médio. */
  matrizes: number;
  natalidade: number;
  /** Mortalidade-base por ano (com sanidade média). */
  mortalidade: number;
  /** O que sai por ano, por cabeça, com genética e manejo médios: quantidade e preço. */
  produto: string;
  produtoPorCabeca: number;
  precoProduto: number;
  /** Quanto se vende de animais por ano (desfrute) ao preço de venda. */
  desfrute: number;
  precoVenda: number;
  /** A estrutura sem a qual o rebanho não passa de um tamanho (curral, estábulo, aviário...) e esse tamanho. */
  estrutura?: EstruturaId;
  semEstrutura: number;
  /** A doença típica (o que a tela conta). */
  doenca: string;
  tipos: TipoRural[];
  /** Comprar um lote: quantas cabeças vêm. */
  lote: number;
}

export const REBANHOS18: Record<EspecieRural, Rebanho18Dados> = {
  corte: { id: 'corte', nome: 'gado de corte', unidade: 'cabeças', ua: 1, valor: 3200, custoAno: 650, matrizes: 0.45, natalidade: 0.68, mortalidade: 0.03, produto: 'arrobas vendidas', produtoPorCabeca: 0, precoProduto: 0, desfrute: 0.27, precoVenda: 5200, semEstrutura: 60, estrutura: 'curral', doenca: 'o carrapato e a tristeza parasitária', tipos: ['pecuaria', 'sitio', 'agricola', 'haras'], lote: 20 },
  leite: { id: 'leite', nome: 'gado leiteiro', unidade: 'vacas', ua: 1.1, valor: 6500, custoAno: 5200, matrizes: 0.7, natalidade: 0.75, mortalidade: 0.03, produto: 'litros de leite', produtoPorCabeca: 2900, precoProduto: 2.4, desfrute: 0.12, precoVenda: 3000, semEstrutura: 15, estrutura: 'ordenha', doenca: 'a mastite', tipos: ['pecuaria', 'sitio', 'chacara'], lote: 10 },
  cavalos: { id: 'cavalos', nome: 'cavalos', unidade: 'animais', ua: 1, valor: 15000, custoAno: 6500, matrizes: 0.45, natalidade: 0.6, mortalidade: 0.025, produto: 'reais de hospedagem, coberturas e treino', produtoPorCabeca: 2500, precoProduto: 1, desfrute: 0.14, precoVenda: 18000, semEstrutura: 6, estrutura: 'cocheiras', doenca: 'a cólica e a anemia infecciosa', tipos: ['haras', 'pecuaria', 'sitio', 'chacara'], lote: 3 },
  ovelhas: { id: 'ovelhas', nome: 'ovelhas', unidade: 'cabeças', ua: 0.16, valor: 450, custoAno: 140, matrizes: 0.6, natalidade: 1.1, mortalidade: 0.06, produto: 'kg de lã', produtoPorCabeca: 3.5, precoProduto: 9, desfrute: 0.38, precoVenda: 520, semEstrutura: 80, estrutura: 'aprisco', doenca: 'a verminose', tipos: ['pecuaria', 'sitio', 'chacara'], lote: 30 },
  cabras: { id: 'cabras', nome: 'cabras', unidade: 'cabeças', ua: 0.14, valor: 420, custoAno: 420, matrizes: 0.6, natalidade: 1.3, mortalidade: 0.06, produto: 'litros de leite de cabra', produtoPorCabeca: 160, precoProduto: 3.8, desfrute: 0.36, precoVenda: 380, semEstrutura: 80, estrutura: 'aprisco', doenca: 'a verminose', tipos: ['pecuaria', 'sitio', 'chacara'], lote: 30 },
  porcos: { id: 'porcos', nome: 'porcos', unidade: 'animais alojados', ua: 0, valor: 650, custoAno: 1950, matrizes: 0.08, natalidade: 0, mortalidade: 0.04, produto: 'porcos terminados', produtoPorCabeca: 0, precoProduto: 0, desfrute: 2.4, precoVenda: 880, semEstrutura: 20, estrutura: 'pocilga', doenca: 'a circovirose', tipos: ['sitio', 'agricola', 'pecuaria'], lote: 50 },
  galinhas: { id: 'galinhas', nome: 'galinhas poedeiras', unidade: 'aves', ua: 0, valor: 28, custoAno: 115, matrizes: 1, natalidade: 0, mortalidade: 0.08, produto: 'ovos', produtoPorCabeca: 300, precoProduto: 0.4, desfrute: 0.7, precoVenda: 12, semEstrutura: 200, estrutura: 'aviario', doenca: 'a doença de Newcastle', tipos: ['sitio', 'chacara', 'agricola', 'pecuaria'], lote: 500 },
  frangos: { id: 'frangos', nome: 'frangos de corte', unidade: 'aves alojadas', ua: 0, valor: 6, custoAno: 86, matrizes: 0, natalidade: 0, mortalidade: 0.04, produto: 'lotes por ano', produtoPorCabeca: 0, precoProduto: 0, desfrute: 6, precoVenda: 16, semEstrutura: 300, estrutura: 'aviario', doenca: 'a bronquite infecciosa', tipos: ['sitio', 'agricola', 'pecuaria'], lote: 2000 },
  tilapia: { id: 'tilapia', nome: 'tilápia', unidade: 'toneladas por ano', ua: 0, valor: 0, custoAno: 7600, matrizes: 0, natalidade: 0, mortalidade: 0, produto: 'kg de peixe', produtoPorCabeca: 1000, precoProduto: 9.8, desfrute: 0, precoVenda: 0, semEstrutura: 0, estrutura: 'tanques', doenca: 'a estreptococose', tipos: ['aquicultura', 'sitio', 'chacara'], lote: 5 },
  tambaqui: { id: 'tambaqui', nome: 'tambaqui', unidade: 'toneladas por ano', ua: 0, valor: 0, custoAno: 8200, matrizes: 0, natalidade: 0, mortalidade: 0, produto: 'kg de peixe', produtoPorCabeca: 1000, precoProduto: 10.5, desfrute: 0, precoVenda: 0, semEstrutura: 0, estrutura: 'tanques', doenca: 'a ictiofitiríase', tipos: ['aquicultura', 'sitio'], lote: 5 }
};

/* ------------------------------------------------------------------ Estruturas e máquinas */

export type EstruturaId =
  | 'galpao' | 'silo' | 'estufa' | 'irrigacao_gotejo' | 'pivo' | 'curral' | 'ordenha' | 'cocheiras' | 'pista' | 'aprisco' | 'pocilga'
  | 'aviario' | 'tanques' | 'poco' | 'represa' | 'solar' | 'estradas' | 'terreiro' | 'viveiro' | 'sede';

export interface Estrutura18 {
  id: EstruturaId;
  nome: string;
  oque: string;
  /** Custo de construir (o motor multiplica pelo custo local). Algumas escalam por hectare servido (`porHa`). */
  custo: number;
  porHa?: number;
  /** Área mínima da propriedade e quantas cabem (por tamanho: 1 a cada `haPorUnidade`, com teto). */
  minHa: number;
  max: number;
  haPorUnidade?: number;
  /** Capacidade que dá (cabeças, aves, toneladas/ano de peixe, hectares irrigados, toneladas guardadas). */
  capacidade?: number;
  /** Manutenção por ano (fração do custo). */
  manutencao: number;
  tipos: TipoRural[];
}

export const ESTRUTURAS18: Record<EstruturaId, Estrutura18> = {
  sede: { id: 'sede', nome: 'casa-sede', oque: 'Dá para morar e passar temporadas; a família tem onde ficar.', custo: 280000, minHa: 0, max: 1, manutencao: 0.01, tipos: TODAS },
  galpao: { id: 'galpao', nome: 'galpão de máquinas', oque: 'Guarda máquinas e insumo: a máquina dura mais, o insumo não se perde.', custo: 120000, minHa: 3, max: 3, haPorUnidade: 300, manutencao: 0.01, tipos: TODAS },
  silo: { id: 'silo', nome: 'silo', oque: 'Guarda a safra: vende-se na entressafra, não na hora em que todo mundo vende (o preço melhora).', custo: 350000, minHa: 40, max: 4, haPorUnidade: 400, capacidade: 3000, manutencao: 0.012, tipos: ['agricola', 'pecuaria', 'sitio', 'cafeeira'] },
  estufa: { id: 'estufa', nome: 'estufa', oque: 'Horta e muda protegidas do granizo e da geada; produz o ano inteiro.', custo: 90000, minHa: 0.5, max: 6, haPorUnidade: 2, capacidade: 0.5, manutencao: 0.04, tipos: ['sitio', 'chacara', 'agricola'] },
  irrigacao_gotejo: { id: 'irrigacao_gotejo', nome: 'irrigação por gotejamento', oque: 'Água na raiz, sem desperdício: pomar, café, horta e uva. Precisa de poço ou represa.', custo: 0, porHa: 9000, minHa: 0.5, max: 1, capacidade: 30, manutencao: 0.03, tipos: ['sitio', 'chacara', 'cafeeira', 'agricola'] },
  pivo: { id: 'pivo', nome: 'pivô central', oque: 'Irriga grão em área grande: duas safras garantidas e a seca pesa bem menos. Precisa de represa e outorga de água.', custo: 0, porHa: 12000, minHa: 60, max: 4, haPorUnidade: 250, capacidade: 100, manutencao: 0.03, tipos: ['agricola', 'pecuaria'] },
  curral: { id: 'curral', nome: 'curral e tronco', oque: 'Manejo do gado: vacina, pesagem, apartação. Sem ele, o rebanho não passa de umas sessenta cabeças.', custo: 60000, minHa: 10, max: 3, haPorUnidade: 500, capacidade: 600, manutencao: 0.02, tipos: ['pecuaria', 'sitio', 'agricola', 'haras'] },
  ordenha: { id: 'ordenha', nome: 'estábulo e sala de ordenha', oque: 'Ordenha mecânica e tanque de resfriamento: o laticínio paga pela qualidade do leite.', custo: 180000, minHa: 5, max: 2, haPorUnidade: 100, capacidade: 120, manutencao: 0.025, tipos: ['pecuaria', 'sitio', 'chacara'] },
  cocheiras: { id: 'cocheiras', nome: 'cocheiras', oque: 'Baias para os cavalos: cuidado de perto, menos cólica, mais valor na venda.', custo: 90000, minHa: 2, max: 4, haPorUnidade: 25, capacidade: 20, manutencao: 0.02, tipos: ['haras', 'pecuaria', 'sitio', 'chacara'] },
  pista: { id: 'pista', nome: 'pista de treino', oque: 'Treino diário de cavalo de corrida e de prova: os animais chegam prontos ao hipódromo.', custo: 160000, minHa: 15, max: 1, manutencao: 0.02, tipos: ['haras'] },
  aprisco: { id: 'aprisco', nome: 'aprisco', oque: 'Abrigo de ovelhas e cabras: menos verminose, mais cria vingando.', custo: 45000, minHa: 2, max: 3, haPorUnidade: 50, capacidade: 400, manutencao: 0.02, tipos: ['pecuaria', 'sitio', 'chacara'] },
  pocilga: { id: 'pocilga', nome: 'granja de suínos', oque: 'Baias, maternidade e esterqueira (o licenciamento ambiental pede).', custo: 220000, minHa: 3, max: 3, haPorUnidade: 40, capacidade: 600, manutencao: 0.03, tipos: ['sitio', 'agricola', 'pecuaria'] },
  aviario: { id: 'aviario', nome: 'aviário', oque: 'Galpão climatizado: até vinte mil aves (corte) ou poedeiras.', custo: 480000, minHa: 2, max: 4, haPorUnidade: 15, capacidade: 20000, manutencao: 0.03, tipos: ['sitio', 'agricola', 'pecuaria', 'chacara'] },
  tanques: { id: 'tanques', nome: 'tanques escavados', oque: 'Um hectare de lâmina d\'água: umas 15 toneladas de peixe por ano, com ração e aeração.', custo: 95000, minHa: 2, max: 30, haPorUnidade: 1.6, capacidade: 15, manutencao: 0.03, tipos: ['aquicultura', 'sitio', 'chacara'] },
  poco: { id: 'poco', nome: 'poço artesiano', oque: 'Água de casa e dos animais garantida o ano todo; a base da irrigação pequena.', custo: 45000, minHa: 0, max: 2, manutencao: 0.02, tipos: TODAS },
  represa: { id: 'represa', nome: 'represa e reservatório', oque: 'Guarda a água da chuva para a estiagem: o que segura o pivô e o gado na seca.', custo: 140000, minHa: 20, max: 2, manutencao: 0.01, tipos: ['agricola', 'pecuaria', 'haras', 'cafeeira', 'aquicultura', 'florestal'] },
  solar: { id: 'solar', nome: 'energia solar', oque: 'Placas no telhado do galpão: a conta de luz da ordenha, da irrigação e do aviário cai.', custo: 110000, minHa: 0, max: 1, manutencao: 0.01, tipos: TODAS },
  estradas: { id: 'estradas', nome: 'estradas internas e cascalho', oque: 'O caminhão entra na chuva: menos perda no transporte, menos quebra de máquina.', custo: 0, porHa: 250, minHa: 20, max: 1, manutencao: 0.05, tipos: ['agricola', 'pecuaria', 'cafeeira', 'florestal', 'haras'] },
  terreiro: { id: 'terreiro', nome: 'terreiro e secador de café', oque: 'Seca o café no ponto: o grão sobe de bebida, e o preço vem junto.', custo: 130000, minHa: 5, max: 1, manutencao: 0.02, tipos: ['cafeeira', 'sitio'] },
  viveiro: { id: 'viveiro', nome: 'viveiro de mudas', oque: 'A muda própria: replantar a floresta e o pomar custa menos.', custo: 70000, minHa: 10, max: 1, manutencao: 0.03, tipos: ['florestal', 'cafeeira', 'agricola', 'sitio'] }
};

export type MaquinaId = 'trator' | 'colheitadeira' | 'plantadeira' | 'pulverizador' | 'drone' | 'caminhao' | 'ordenhadeira' | 'microtrator';

export interface Maquina18 {
  id: MaquinaId;
  nome: string;
  oque: string;
  preco: number;
  /** Quantos hectares uma máquina dá conta (acima disso, terceiriza o resto). */
  ha: number;
  /** Quanto da operação deixa de ser terceirizada (fração do custo por hectare que cai) e quanto soma de tecnologia. */
  economia: number;
  tecnologia: number;
  minHa: number;
  tipos: TipoRural[];
}

export const MAQUINAS18: Record<MaquinaId, Maquina18> = {
  microtrator: { id: 'microtrator', nome: 'microtrator', oque: 'O trator do sítio e da horta: ara, carrega, puxa a carreta.', preco: 38000, ha: 15, economia: 0.06, tecnologia: 0.3, minHa: 0, tipos: ['sitio', 'chacara', 'haras', 'aquicultura', 'cafeeira'] },
  trator: { id: 'trator', nome: 'trator', oque: 'A base de toda operação: preparo, plantio, pulverização e transporte.', preco: 420000, ha: 300, economia: 0.07, tecnologia: 0.5, minHa: 20, tipos: ['agricola', 'pecuaria', 'cafeeira', 'florestal', 'haras', 'sitio'] },
  plantadeira: { id: 'plantadeira', nome: 'plantadeira de precisão', oque: 'Semente no espaçamento certo: estande uniforme, menos replantio.', preco: 380000, ha: 600, economia: 0.04, tecnologia: 0.5, minHa: 60, tipos: ['agricola'] },
  pulverizador: { id: 'pulverizador', nome: 'pulverizador autopropelido', oque: 'Aplicação rápida na janela certa: a praga é contida antes de espalhar.', preco: 950000, ha: 1500, economia: 0.04, tecnologia: 0.6, minHa: 150, tipos: ['agricola'] },
  colheitadeira: { id: 'colheitadeira', nome: 'colheitadeira', oque: 'Colher no ponto, sem esperar a máquina alugada: a perda na colheita cai.', preco: 1800000, ha: 1200, economia: 0.09, tecnologia: 0.6, minHa: 150, tipos: ['agricola', 'cafeeira'] },
  drone: { id: 'drone', nome: 'drone agrícola', oque: 'Mapa de falhas e aplicação localizada: agricultura de precisão.', preco: 160000, ha: 800, economia: 0.03, tecnologia: 0.8, minHa: 30, tipos: ['agricola', 'cafeeira', 'florestal', 'sitio'] },
  caminhao: { id: 'caminhao', nome: 'caminhão', oque: 'Levar a produção sem pagar frete: vale para quem vende longe.', preco: 520000, ha: 2000, economia: 0.03, tecnologia: 0.1, minHa: 30, tipos: ['agricola', 'pecuaria', 'cafeeira', 'florestal', 'aquicultura'] },
  ordenhadeira: { id: 'ordenhadeira', nome: 'ordenhadeira mecânica', oque: 'Ordenha mais rápida e higiênica: o leite sobe de qualidade.', preco: 45000, ha: 99999, economia: 0.05, tecnologia: 0.4, minHa: 0, tipos: ['pecuaria', 'sitio', 'chacara'] }
};

/* ------------------------------------------------------------------ Tipos de propriedade */

export interface TipoRural18 {
  id: TipoRural;
  nome: string;
  artigo: 'a' | 'o';
  oque: string;
  /** Os tamanhos em que aparece à venda (hectares). */
  tamanhos: number[];
  /** Preço da terra nua por hectare na referência (Sudeste); a região muda. */
  precoHa: number;
  /** As culturas e os rebanhos que são a vocação dela (aparecem primeiro). */
  vocacao: (CulturaId | EspecieRural)[];
  /** Estruturas que já vêm (o mínimo de cada tipo: a sede, o curral da fazenda de gado...). */
  vemCom: EstruturaId[];
  /** Fração da área que vira pasto quando não há lavoura (a fazenda de gado nasce pasto). */
  pasto: number;
}

export const TIPOS18: Record<TipoRural, TipoRural18> = {
  agricola: { id: 'agricola', nome: 'fazenda agrícola', artigo: 'a', oque: 'Lavoura em escala: soja, milho, algodão, trigo — máquina, safra e silo.', tamanhos: [80, 200, 500, 1200], precoHa: 32000, vocacao: ['soja', 'milho', 'algodao', 'trigo', 'feijao', 'arroz', 'cana'], vemCom: ['galpao'], pasto: 0.1 },
  pecuaria: { id: 'pecuaria', nome: 'fazenda de gado', artigo: 'a', oque: 'Pasto e rebanho: cria, recria e engorda, ou leite. O capim é a lavoura.', tamanhos: [150, 400, 900, 2000], precoHa: 16000, vocacao: ['corte', 'leite', 'cavalos', 'ovelhas', 'eucalipto'], vemCom: ['curral'], pasto: 0.85 },
  sitio: { id: 'sitio', nome: 'sítio', artigo: 'o', oque: 'Terra de família: um pouco de tudo — roça, leite, galinha, pomar, horta.', tamanhos: [6, 12, 25, 45], precoHa: 30000, vocacao: ['horta', 'frutas', 'milho', 'feijao', 'leite', 'galinhas', 'porcos', 'mandioca'], vemCom: ['sede', 'poco'], pasto: 0.4 },
  chacara: { id: 'chacara', nome: 'chácara', artigo: 'a', oque: 'Perto da cidade: casa, pomar, horta e lazer de fim de semana. Produz pouco, vive-se muito.', tamanhos: [1, 2, 3.5], precoHa: 110000, vocacao: ['horta', 'frutas', 'galinhas', 'uva'], vemCom: ['sede'], pasto: 0.2 },
  haras: { id: 'haras', nome: 'haras', artigo: 'o', oque: 'Criação e treino de cavalos: genética, cobertura, prova e corrida.', tamanhos: [25, 60, 150], precoHa: 45000, vocacao: ['cavalos'], vemCom: ['sede', 'cocheiras'], pasto: 0.6 },
  cafeeira: { id: 'cafeeira', nome: 'fazenda de café', artigo: 'a', oque: 'Café de montanha ou de cerrado: lavoura perene, colheita no inverno, bebida que vale preço.', tamanhos: [20, 60, 150, 400], precoHa: 48000, vocacao: ['cafe', 'frutas', 'milho'], vemCom: ['sede', 'terreiro'], pasto: 0.15 },
  florestal: { id: 'florestal', nome: 'propriedade florestal', artigo: 'a', oque: 'Floresta plantada e reserva: eucalipto ou pínus em ciclo longo, renda de corte, pouca mão de obra.', tamanhos: [120, 400, 1000], precoHa: 11000, vocacao: ['eucalipto', 'pinus', 'acai'], vemCom: [], pasto: 0.05 },
  aquicultura: { id: 'aquicultura', nome: 'piscicultura', artigo: 'a', oque: 'Tanques e água boa: tilápia ou tambaqui, ração e aeração, e um pesque-pague, se quiser.', tamanhos: [5, 15, 40], precoHa: 36000, vocacao: ['tilapia', 'tambaqui'], vemCom: ['poco', 'tanques'], pasto: 0.1 }
};

/** Quanto a terra custa em cada região, em relação à referência (IEA/Scot/S&P: Sul e Sudeste caros, Norte barato). */
export const PRECO_TERRA_REGIAO: Record<RegiaoRural, number> = { Sul: 1.35, Sudeste: 1, 'Centro-Oeste': 0.9, Nordeste: 0.55, Norte: 0.45, outro: 1 };

/** A reserva legal do Código Florestal (Lei 12.651/2012): 80% na floresta amazônica, 35% no cerrado da Amazônia Legal, 20% no resto. */
export const RESERVA_LEGAL: Record<string, number> = { AM: 0.8, PA: 0.8, AC: 0.8, RO: 0.8, RR: 0.8, AP: 0.8, MT: 0.35, TO: 0.35, MA: 0.35 };

/** As festas e os eventos do campo por região (o calendário da vida rural). */
export const FESTAS18: { id: string; nome: string; mes: number; regioes: RegiaoRural[]; oque: string; custo: number; equestre?: boolean; leilao?: boolean }[] = [
  { id: 'junina', nome: 'a festa junina da comunidade', mes: 6, regioes: ['Nordeste', 'Sudeste', 'Centro-Oeste', 'Sul', 'Norte'], oque: 'Quadrilha, fogueira, quentão, a barraca da igreja e o bingo de prendas.', custo: 150 },
  { id: 'exposicao', nome: 'a exposição agropecuária', mes: 5, regioes: ['Sudeste', 'Centro-Oeste', 'Sul', 'Nordeste', 'Norte'], oque: 'Julgamento de raças, leilão de matrizes, máquinas novas e show à noite.', custo: 400, leilao: true },
  { id: 'rodeio', nome: 'o rodeio da cidade', mes: 8, regioes: ['Sudeste', 'Centro-Oeste', 'Sul', 'Norte'], oque: 'Montaria em touro, laço, tambor e a arquibancada cheia.', custo: 250, equestre: true },
  { id: 'cavalgada', nome: 'a cavalgada da padroeira', mes: 7, regioes: ['Sudeste', 'Centro-Oeste', 'Nordeste', 'Sul', 'Norte'], oque: 'Dezenas de cavaleiros pela estrada de terra até a capela, com almoço no fim.', custo: 80, equestre: true },
  { id: 'vaquejada', nome: 'a vaquejada', mes: 9, regioes: ['Nordeste'], oque: 'A dupla de vaqueiros e a faixa de areia (regulamentada como patrimônio cultural, com regras de bem-estar animal).', custo: 200, equestre: true },
  { id: 'crioula', nome: 'a semana farroupilha e as provas crioulas', mes: 9, regioes: ['Sul'], oque: 'Gineteada, laço, chimarrão e o acampamento no parque.', custo: 200, equestre: true },
  { id: 'feira', nome: 'a feira do produtor', mes: 3, regioes: ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'], oque: 'Banca própria no sábado de manhã: vender direto, conhecer o freguês.', custo: 60 },
  { id: 'colheita', nome: 'a festa da colheita', mes: 4, regioes: ['Sul', 'Sudeste', 'Centro-Oeste'], oque: 'A comunidade agradece a safra: missa, almoço e a banda.', custo: 100 }
];
