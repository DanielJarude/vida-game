/**
 * 12.4.1 — ONDE SE COMPRA: as lojas e as marcas. O que existe para comprar continua nos catálogos de sempre
 * (`dados/coisas` para os objetos, `dados/estilo` para o que se veste); aqui mora QUEM vende e DE QUE MARCA:
 *
 *   ESPECIALIZADAS   a loja de roupas, a sapataria, a ótica, a relojoaria, a joalheria, a de acessórios, a de
 *                    eletrônicos, a de eletrodomésticos, a de móveis, a de instrumentos, a de esportes, a livraria
 *   GRANDES LOJAS    as de departamento de cada país (Renner e Magazine Luiza no Brasil, Coin e MediaWorld na
 *                    Itália, Macy's e Best Buy nos Estados Unidos…) — muitas seções, marcas de preço médio
 *   PELA INTERNET    o comércio online internacional (Amazon, AliExpress, Zalando na Europa, Mercado Livre na
 *                    América Latina, Farfetch para o luxo) — tudo chega, com frete e prazo
 *
 * Disponibilidade híbrida: na cidade, o que o mercado do país tem (e a cidade comporta — a grife pede cidade grande);
 * pela internet, o resto, mais caro. Marcas reais e fictícias convivem; cada marca diz em que mercados vende.
 * Os preços são o preço de referência do produto × o fator da faixa da marca (popular, média, premium, luxo).
 */

/** Os mercados (regiões de consumo) — onde uma marca está nas lojas físicas. */
export type Mercado = 'BR' | 'LATAM' | 'NA' | 'EU' | 'UK' | 'ASIA' | 'AFR' | 'OCE';

export type CategoriaDeProduto =
  | 'vestuario' | 'calcados' | 'acessorios' | 'otica' | 'relogios' | 'joias'
  | 'eletronicos' | 'eletrodomesticos' | 'moveis' | 'instrumentos' | 'esportes' | 'livros';

export const NOME_CATEGORIA: Record<CategoriaDeProduto, string> = {
  vestuario: 'Roupas', calcados: 'Calçados', acessorios: 'Bonés, chapéus e acessórios', otica: 'Óculos', relogios: 'Relógios', joias: 'Joias',
  eletronicos: 'Eletrônicos', eletrodomesticos: 'Eletrodomésticos', moveis: 'Móveis e casa', instrumentos: 'Instrumentos', esportes: 'Esporte e lazer', livros: 'Livros, arte e jogos'
};

/** 1 popular · 2 média · 3 premium · 4 luxo. */
export type Faixa = 1 | 2 | 3 | 4;
export const NOME_FAIXA: Record<Faixa, string> = { 1: 'popular', 2: 'preço médio', 3: 'premium', 4: 'luxo' };
/** O preço da marca sobre o de referência (o produto de luxo já é caro: a grife soma menos sobre ele). */
export const FATOR_FAIXA: Record<Faixa, number> = { 1: 0.72, 2: 1, 3: 1.65, 4: 4.2 };
export const FATOR_FAIXA_LUXO: Record<Faixa, number> = { 1: 0.8, 2: 0.9, 3: 1, 4: 1.45 };

export interface Marca {
  id: string;
  nome: string;
  /** Marca que existe de verdade (as fictícias são do mundo do VIDA). */
  real?: boolean;
  faixa: Faixa;
  categorias: CategoriaDeProduto[];
  /** Mercados com loja física (ausente = no mundo todo). */
  mercados?: Mercado[];
  /** Só estes produtos (ids de `dados/estilo` ou `dados/coisas`): a Havaianas faz chinelo, não coturno. */
  so?: string[];
  /** Só pela internet (marca que não tem loja em lugar nenhum). */
  online?: boolean;
}

const OCID: Mercado[] = ['NA', 'EU', 'UK', 'OCE'];
const QUASE_TUDO: Mercado[] = ['BR', 'LATAM', 'NA', 'EU', 'UK', 'ASIA', 'OCE'];

/** As marcas. As reais vendem onde vendem de fato (aproximadamente); as fictícias preenchem as faixas. */
export const MARCAS: readonly Marca[] = [
  // ------------------------------------------------------------ roupas
  { id: 'trama', nome: 'Trama', faixa: 1, categorias: ['vestuario'] },
  { id: 'hering', nome: 'Hering', real: true, faixa: 1, categorias: ['vestuario'], mercados: ['BR'] },
  { id: 'hm', nome: 'H&M', real: true, faixa: 1, categorias: ['vestuario'], mercados: ['EU', 'UK', 'NA', 'LATAM', 'ASIA', 'OCE'] },
  { id: 'uniqlo', nome: 'Uniqlo', real: true, faixa: 1, categorias: ['vestuario'], mercados: ['ASIA', 'NA', 'EU', 'UK', 'OCE'] },
  { id: 'zara', nome: 'Zara', real: true, faixa: 2, categorias: ['vestuario', 'calcados'], mercados: QUASE_TUDO },
  { id: 'levis', nome: "Levi's", real: true, faixa: 2, categorias: ['vestuario'], so: ['jeans', 'short_jeans', 'jaqueta_jeans', 'camiseta_lisa', 'camisa_xadrez'] },
  { id: 'benetton', nome: 'Benetton', real: true, faixa: 2, categorias: ['vestuario'], mercados: ['EU', 'UK', 'ASIA', 'LATAM'] },
  { id: 'linho_e_cia', nome: 'Linho & Cia', faixa: 2, categorias: ['vestuario'] },
  { id: 'osklen', nome: 'Osklen', real: true, faixa: 3, categorias: ['vestuario'], mercados: ['BR'] },
  { id: 'lacoste', nome: 'Lacoste', real: true, faixa: 3, categorias: ['vestuario', 'calcados'] },
  { id: 'ralph', nome: 'Ralph Lauren', real: true, faixa: 3, categorias: ['vestuario'], mercados: OCID },
  { id: 'moreau', nome: 'Atelier Moreau', faixa: 3, categorias: ['vestuario'], mercados: ['EU', 'UK'] },
  { id: 'gucci', nome: 'Gucci', real: true, faixa: 4, categorias: ['vestuario', 'calcados', 'otica', 'acessorios'] },
  { id: 'prada', nome: 'Prada', real: true, faixa: 4, categorias: ['vestuario', 'calcados', 'otica'] },
  { id: 'valentim', nome: 'Casa Valentim', faixa: 4, categorias: ['vestuario', 'joias'] },
  // ------------------------------------------------------------ calçados e esporte
  { id: 'havaianas', nome: 'Havaianas', real: true, faixa: 1, categorias: ['calcados'], so: ['chinelo_slide', 'sandalia'] },
  { id: 'olympikus', nome: 'Olympikus', real: true, faixa: 1, categorias: ['calcados', 'esportes'], mercados: ['BR'], so: ['tenis_casual', 'tenis_corrida', 'chinelo_slide', 'kit_academia'] },
  { id: 'passo_firme', nome: 'Passo Firme', faixa: 1, categorias: ['calcados'] },
  { id: 'nike', nome: 'Nike', real: true, faixa: 2, categorias: ['calcados', 'vestuario', 'esportes'], so: ['tenis_casual', 'tenis_corrida', 'tenis_cano_alto', 'tenis_colecionavel', 'chinelo_slide', 'moletom_oversized', 'regata', 'legging', 'camisa_time', 'corta_vento', 'bermuda_tactel', 'roupa_esportiva', 'chuteira_bola', 'kit_academia'] },
  { id: 'adidas', nome: 'Adidas', real: true, faixa: 2, categorias: ['calcados', 'vestuario', 'esportes'], so: ['tenis_casual', 'tenis_corrida', 'tenis_cano_alto', 'chinelo_slide', 'moletom_oversized', 'regata', 'legging', 'camisa_time', 'corta_vento', 'conjunto_baile', 'roupa_esportiva', 'chuteira_bola'] },
  { id: 'asics', nome: 'Asics', real: true, faixa: 2, categorias: ['calcados'], so: ['tenis_corrida'] },
  { id: 'vans', nome: 'Vans', real: true, faixa: 2, categorias: ['calcados'], so: ['tenis_lona', 'tenis_cano_alto'] },
  { id: 'converse', nome: 'Converse', real: true, faixa: 2, categorias: ['calcados'], so: ['tenis_lona', 'tenis_cano_alto'] },
  { id: 'geox', nome: 'Geox', real: true, faixa: 2, categorias: ['calcados'], mercados: ['EU', 'UK', 'LATAM'], so: ['sapato_social', 'mocassim', 'sapatilha', 'tenis_casual'] },
  { id: 'clarks', nome: 'Clarks', real: true, faixa: 2, categorias: ['calcados'], mercados: ['UK', 'EU', 'NA', 'OCE'], so: ['sapato_social', 'mocassim', 'botina', 'sandalia'] },
  { id: 'arezzo', nome: 'Arezzo', real: true, faixa: 3, categorias: ['calcados'], mercados: ['BR'], so: ['scarpin', 'sandalia', 'sapatilha', 'botina'] },
  { id: 'drmartens', nome: 'Dr. Martens', real: true, faixa: 3, categorias: ['calcados'], so: ['coturno', 'botina', 'mocassim'] },
  { id: 'louboutin', nome: 'Christian Louboutin', real: true, faixa: 4, categorias: ['calcados'], so: ['scarpin', 'sapato_social', 'tenis_colecionavel'] },
  { id: 'decathlon', nome: 'Decathlon', real: true, faixa: 1, categorias: ['esportes', 'calcados', 'vestuario'], mercados: ['EU', 'UK', 'BR', 'LATAM', 'ASIA'], so: ['tenis_corrida', 'legging', 'regata', 'corta_vento', 'kit_academia', 'esteira', 'raquete', 'prancha', 'camping', 'chuteira_bola', 'estacao_musculacao'] },
  { id: 'penalty', nome: 'Penalty', real: true, faixa: 1, categorias: ['esportes'], mercados: ['BR'], so: ['chuteira_bola', 'kit_academia'] },
  { id: 'wilson', nome: 'Wilson', real: true, faixa: 2, categorias: ['esportes'], so: ['raquete', 'chuteira_bola'] },
  { id: 'impulso', nome: 'Impulso Fitness', faixa: 2, categorias: ['esportes'] },
  // ------------------------------------------------------------ acessórios, óculos, relógios, joias
  { id: 'aba', nome: 'Aba Larga', faixa: 1, categorias: ['acessorios'] },
  { id: 'newera', nome: 'New Era', real: true, faixa: 2, categorias: ['acessorios'], so: ['bone', 'bone_aba_reta', 'gorro'] },
  { id: 'chilli', nome: 'Chilli Beans', real: true, faixa: 1, categorias: ['otica', 'relogios', 'acessorios'], mercados: ['BR', 'LATAM'], so: ['oculos_sol', 'oculos_juliet', 'oculos_aviador', 'oculos_redondo', 'relogio', 'relogio_digital', 'pulseira_couro'] },
  { id: 'vista', nome: 'Ótica Vista', faixa: 1, categorias: ['otica'] },
  { id: 'rayban', nome: 'Ray-Ban', real: true, faixa: 3, categorias: ['otica'] },
  { id: 'oakley', nome: 'Oakley', real: true, faixa: 3, categorias: ['otica'], so: ['oculos_sol', 'oculos_juliet', 'oculos_aviador', 'oculos_grife'] },
  { id: 'persol', nome: 'Persol', real: true, faixa: 3, categorias: ['otica'], mercados: ['EU', 'UK', 'NA'] },
  { id: 'casio', nome: 'Casio', real: true, faixa: 1, categorias: ['relogios'], so: ['relogio', 'relogio_digital'] },
  { id: 'ponteiro', nome: 'Ponteiro', faixa: 1, categorias: ['relogios'] },
  { id: 'technos', nome: 'Technos', real: true, faixa: 2, categorias: ['relogios'], mercados: ['BR'] },
  { id: 'swatch', nome: 'Swatch', real: true, faixa: 2, categorias: ['relogios'], so: ['relogio', 'relogio_digital'] },
  { id: 'seiko', nome: 'Seiko', real: true, faixa: 2, categorias: ['relogios'], so: ['relogio', 'relogio_luxo'] },
  { id: 'garmin', nome: 'Garmin', real: true, faixa: 3, categorias: ['relogios'], so: ['smartwatch', 'relogio_digital'] },
  { id: 'apple', nome: 'Apple', real: true, faixa: 3, categorias: ['relogios', 'eletronicos'], so: ['smartwatch', 'celular_topo', 'notebook', 'tablet', 'computador'] },
  { id: 'tissot', nome: 'Tissot', real: true, faixa: 3, categorias: ['relogios'], so: ['relogio', 'relogio_luxo'] },
  { id: 'rolex', nome: 'Rolex', real: true, faixa: 4, categorias: ['relogios'], so: ['relogio_luxo'] },
  { id: 'omega', nome: 'Omega', real: true, faixa: 4, categorias: ['relogios'], so: ['relogio_luxo'] },
  { id: 'prata_fina', nome: 'Prata Fina', faixa: 1, categorias: ['joias', 'acessorios'] },
  { id: 'pandora', nome: 'Pandora', real: true, faixa: 2, categorias: ['joias'], so: ['pulseira_prata', 'pulseira_couro', 'brincos', 'anel_prata', 'corrente_prata', 'pulseira_ouro', 'brincos_ouro'] },
  { id: 'vivara', nome: 'Vivara', real: true, faixa: 3, categorias: ['joias', 'relogios'], mercados: ['BR'] },
  { id: 'swarovski', nome: 'Swarovski', real: true, faixa: 3, categorias: ['joias'], so: ['brincos', 'corrente_prata', 'pulseira_prata', 'anel_prata', 'joia'] },
  { id: 'tiffany', nome: 'Tiffany & Co.', real: true, faixa: 4, categorias: ['joias'] },
  { id: 'cartier', nome: 'Cartier', real: true, faixa: 4, categorias: ['joias', 'relogios'], so: ['joia', 'brincos_ouro', 'anel_ouro', 'pulseira_ouro', 'relogio_luxo', 'corrente_grossa'] },
  // ------------------------------------------------------------ eletrônicos e eletrodomésticos
  { id: 'volt', nome: 'Volt', faixa: 1, categorias: ['eletronicos', 'eletrodomesticos'] },
  { id: 'positivo', nome: 'Positivo', real: true, faixa: 1, categorias: ['eletronicos'], mercados: ['BR'], so: ['notebook', 'tablet', 'celular_simples', 'computador'] },
  { id: 'xiaomi', nome: 'Xiaomi', real: true, faixa: 1, categorias: ['eletronicos', 'eletrodomesticos', 'relogios'], so: ['celular_simples', 'celular_bom', 'celular_topo', 'tablet', 'caixa_som', 'aspirador_robo', 'smartwatch', 'tv', 'projetor'] },
  { id: 'motorola', nome: 'Motorola', real: true, faixa: 1, categorias: ['eletronicos'], mercados: ['BR', 'LATAM', 'NA'], so: ['celular_simples', 'celular_bom'] },
  { id: 'samsung', nome: 'Samsung', real: true, faixa: 2, categorias: ['eletronicos', 'eletrodomesticos', 'relogios'], so: ['celular_simples', 'celular_bom', 'celular_topo', 'tablet', 'notebook', 'tv', 'projetor', 'maquina_lavar', 'lava_loucas', 'aspirador_robo', 'ar_condicionado', 'smartwatch'] },
  { id: 'lg', nome: 'LG', real: true, faixa: 2, categorias: ['eletronicos', 'eletrodomesticos'], so: ['tv', 'celular_bom', 'maquina_lavar', 'ar_condicionado', 'projetor', 'caixa_som', 'som_hifi'] },
  { id: 'lenovo', nome: 'Lenovo', real: true, faixa: 2, categorias: ['eletronicos'], so: ['notebook', 'tablet', 'computador'] },
  { id: 'dell', nome: 'Dell', real: true, faixa: 2, categorias: ['eletronicos'], so: ['notebook', 'computador'] },
  { id: 'sony', nome: 'Sony', real: true, faixa: 3, categorias: ['eletronicos'], so: ['videogame', 'tv', 'camera', 'caixa_som', 'som_hifi', 'celular_topo'] },
  { id: 'nintendo', nome: 'Nintendo', real: true, faixa: 2, categorias: ['eletronicos'], so: ['videogame'] },
  { id: 'canon', nome: 'Canon', real: true, faixa: 3, categorias: ['eletronicos'], so: ['camera', 'projetor'] },
  { id: 'consul', nome: 'Consul', real: true, faixa: 1, categorias: ['eletrodomesticos'], mercados: ['BR'] },
  { id: 'brastemp', nome: 'Brastemp', real: true, faixa: 2, categorias: ['eletrodomesticos'], mercados: ['BR'] },
  { id: 'electrolux', nome: 'Electrolux', real: true, faixa: 2, categorias: ['eletrodomesticos'], mercados: ['BR', 'LATAM', 'EU', 'UK', 'OCE'] },
  { id: 'whirlpool', nome: 'Whirlpool', real: true, faixa: 2, categorias: ['eletrodomesticos'], mercados: ['NA', 'EU', 'ASIA'] },
  { id: 'bosch', nome: 'Bosch', real: true, faixa: 3, categorias: ['eletrodomesticos'], mercados: ['EU', 'UK', 'NA', 'BR', 'ASIA'] },
  { id: 'smeg', nome: 'Smeg', real: true, faixa: 3, categorias: ['eletrodomesticos'], mercados: ['EU', 'UK', 'OCE'] },
  { id: 'miele', nome: 'Miele', real: true, faixa: 4, categorias: ['eletrodomesticos'], mercados: ['EU', 'UK', 'NA', 'OCE'] },
  // ------------------------------------------------------------ móveis e casa
  { id: 'casa_pratica', nome: 'Casa Prática', faixa: 1, categorias: ['moveis'] },
  { id: 'ikea', nome: 'IKEA', real: true, faixa: 1, categorias: ['moveis'], mercados: ['EU', 'UK', 'NA', 'ASIA', 'OCE', 'LATAM'] },
  { id: 'etna', nome: 'Etna', real: true, faixa: 1, categorias: ['moveis'], mercados: ['BR'] },
  { id: 'tokstok', nome: 'Tok&Stok', real: true, faixa: 2, categorias: ['moveis'], mercados: ['BR'] },
  { id: 'westwing', nome: 'Westwing', real: true, faixa: 2, categorias: ['moveis'], mercados: ['BR', 'EU'] },
  { id: 'aurora', nome: 'Marcenaria Aurora', faixa: 3, categorias: ['moveis'] },
  { id: 'natuzzi', nome: 'Natuzzi', real: true, faixa: 4, categorias: ['moveis'], so: ['sofa', 'poltrona', 'mesa_jantar', 'sofa_couro', 'sofa_designer', 'poltrona_designer', 'cama_king'] },
  // 12.7 — o alto padrão da casa (fictícias): o ateliê de móveis e a cozinha profissional.
  { id: 'atelier_ardent', nome: 'Atelier Ardent', faixa: 4, categorias: ['moveis'] },
  { id: 'fornaro', nome: 'Fornaro', faixa: 4, categorias: ['eletrodomesticos'] },
  // ------------------------------------------------------------ instrumentos
  { id: 'giannini', nome: 'Giannini', real: true, faixa: 1, categorias: ['instrumentos'], mercados: ['BR', 'LATAM'], so: ['violao', 'guitarra', 'cavaquinho'] },
  { id: 'tagima', nome: 'Tagima', real: true, faixa: 1, categorias: ['instrumentos'], mercados: ['BR'], so: ['guitarra', 'violao'] },
  { id: 'ressoar', nome: 'Ressoar', faixa: 1, categorias: ['instrumentos'] },
  { id: 'yamaha', nome: 'Yamaha', real: true, faixa: 2, categorias: ['instrumentos'], so: ['violao', 'teclado', 'guitarra', 'bateria', 'violino', 'piano', 'saxofone'] },
  { id: 'roland', nome: 'Roland', real: true, faixa: 2, categorias: ['instrumentos'], so: ['teclado', 'bateria', 'home_studio', 'controladora_dj'] },
  { id: 'fender', nome: 'Fender', real: true, faixa: 3, categorias: ['instrumentos'], so: ['guitarra', 'violao'] },
  { id: 'gibson', nome: 'Gibson', real: true, faixa: 4, categorias: ['instrumentos'], so: ['guitarra'] },
  { id: 'steinway', nome: 'Steinway & Sons', real: true, faixa: 4, categorias: ['instrumentos'], so: ['piano'] },
  // ------------------------------------------------------------ só pela internet (o barato que vem de longe)
  { id: 'genericos', nome: 'Sem marca (importado)', faixa: 1, categorias: ['vestuario', 'calcados', 'acessorios', 'otica', 'relogios', 'joias', 'eletronicos', 'esportes'], online: true }
];

/** As lojas de cada tipo, por mercado. `cidade` = a oferta mínima da cidade (0 qualquer · 1 média · 2 grande). */
export interface Estabelecimento {
  id: string;
  nome: string;
  tipo: 'especializada' | 'departamento' | 'online';
  categorias: CategoriaDeProduto[];
  /** As faixas de marca que a loja trabalha. */
  faixas: Faixa[];
  frase: string;
  mercados?: Mercado[];
  cidade?: 0 | 1 | 2;
  /** Online: o frete e o prazo (o preço sobe; a marca de fora sobe mais — a importação). */
  frete?: number;
  prazo?: string;
}

export const ESTABELECIMENTOS: readonly Estabelecimento[] = [
  // Especializadas (o nome é do tipo de loja: cada cidade tem as suas).
  { id: 'roupas', nome: 'Loja de roupas', tipo: 'especializada', categorias: ['vestuario'], faixas: [1, 2, 3], frase: 'Camisetas, camisas, calças, saias, vestidos, casacos' },
  { id: 'sapataria', nome: 'Sapataria e tênis', tipo: 'especializada', categorias: ['calcados'], faixas: [1, 2, 3], frase: 'Tênis, sapatos, botas, sandálias, chinelos' },
  { id: 'otica', nome: 'Ótica', tipo: 'especializada', categorias: ['otica'], faixas: [1, 2, 3], frase: 'Óculos de grau e escuros, com a receita ou sem' },
  { id: 'acessorios', nome: 'Acessórios', tipo: 'especializada', categorias: ['acessorios'], faixas: [1, 2, 3], frase: 'Bonés, chapéus, gorros, lenços, pulseiras' },
  { id: 'relojoaria', nome: 'Relojoaria', tipo: 'especializada', categorias: ['relogios'], faixas: [1, 2, 3, 4], frase: 'Do digital de treino ao suíço automático', cidade: 1 },
  { id: 'joalheria', nome: 'Joalheria', tipo: 'especializada', categorias: ['joias'], faixas: [2, 3, 4], frase: 'Correntes, brincos, anéis, pulseiras', cidade: 1 },
  { id: 'grifes', nome: 'Rua das grifes', tipo: 'especializada', categorias: ['vestuario', 'calcados', 'otica', 'acessorios', 'joias'], faixas: [4], frase: 'As casas de luxo, cada uma com a sua vitrine', cidade: 2 },
  { id: 'eletronicos', nome: 'Eletrônicos', tipo: 'especializada', categorias: ['eletronicos'], faixas: [1, 2, 3], frase: 'Celular, notebook, câmera, videogame, TV' },
  { id: 'eletrodomesticos', nome: 'Eletrodomésticos', tipo: 'especializada', categorias: ['eletrodomesticos'], faixas: [1, 2, 3, 4], frase: 'Máquina de lavar, lava-louças, ar-condicionado' },
  { id: 'moveis', nome: 'Móveis e decoração', tipo: 'especializada', categorias: ['moveis'], faixas: [1, 2, 3, 4], frase: 'Sofá, cama, mesa, poltrona, a cozinha montada' },
  { id: 'instrumentos', nome: 'Instrumentos musicais', tipo: 'especializada', categorias: ['instrumentos'], faixas: [1, 2, 3, 4], frase: 'Violão, teclado, guitarra, bateria, sopros', cidade: 1 },
  { id: 'esportes', nome: 'Artigos esportivos', tipo: 'especializada', categorias: ['esportes'], faixas: [1, 2, 3], frase: 'Chuteira, raquete, academia em casa, camping' },
  { id: 'livraria', nome: 'Livraria e papelaria', tipo: 'especializada', categorias: ['livros'], faixas: [1, 2], frase: 'Livros, apostilas, material de arte, jogos', cidade: 1 },
  // Grandes lojas e lojas de departamento (as de verdade de cada país).
  { id: 'renner', nome: 'Renner', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'acessorios', 'joias'], faixas: [1, 2], frase: 'Moda para todo mundo, num andar só', mercados: ['BR'], cidade: 1 },
  { id: 'cea', nome: 'C&A', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'acessorios', 'relogios'], faixas: [1, 2], frase: 'Roupa, sapato e relógio de preço médio', mercados: ['BR', 'LATAM', 'EU'], cidade: 1 },
  { id: 'magalu', nome: 'Magazine Luiza', tipo: 'departamento', categorias: ['eletronicos', 'eletrodomesticos', 'moveis', 'esportes'], faixas: [1, 2, 3], frase: 'Eletrônicos, eletrodomésticos e móveis, em parcelas', mercados: ['BR'] },
  { id: 'casasbahia', nome: 'Casas Bahia', tipo: 'departamento', categorias: ['eletronicos', 'eletrodomesticos', 'moveis'], faixas: [1, 2], frase: 'A casa inteira, do colchão à geladeira', mercados: ['BR'] },
  { id: 'falabella', nome: 'Falabella', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'eletronicos', 'eletrodomesticos', 'moveis'], faixas: [1, 2, 3], frase: 'Moda, casa e tecnologia sob o mesmo teto', mercados: ['LATAM'], cidade: 1 },
  { id: 'liverpool', nome: 'Liverpool', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'joias', 'relogios', 'eletronicos', 'moveis'], faixas: [2, 3], frase: 'A loja de departamento do México', mercados: ['LATAM'], cidade: 2 },
  { id: 'macys', nome: "Macy's", tipo: 'departamento', categorias: ['vestuario', 'calcados', 'acessorios', 'joias', 'relogios', 'moveis'], faixas: [1, 2, 3], frase: 'Seis andares de moda, casa e beleza', mercados: ['NA'], cidade: 1 },
  { id: 'target', nome: 'Target', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'eletronicos', 'eletrodomesticos', 'moveis', 'esportes', 'livros'], faixas: [1, 2], frase: 'Um pouco de tudo, a preço de todo dia', mercados: ['NA'] },
  { id: 'bestbuy', nome: 'Best Buy', tipo: 'departamento', categorias: ['eletronicos', 'eletrodomesticos'], faixas: [1, 2, 3], frase: 'Tecnologia e eletrodomésticos', mercados: ['NA'], cidade: 1 },
  { id: 'corteingles', nome: 'El Corte Inglés', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'acessorios', 'joias', 'relogios', 'eletronicos', 'eletrodomesticos', 'moveis', 'livros'], faixas: [2, 3, 4], frase: 'A grande loja da Espanha (e de Portugal)', mercados: ['EU'], cidade: 2 },
  { id: 'coin', nome: 'Coin', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'acessorios', 'moveis'], faixas: [2, 3], frase: 'Moda e casa à italiana', mercados: ['EU'], cidade: 1 },
  { id: 'rinascente', nome: 'Rinascente', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'otica', 'joias', 'relogios'], faixas: [3, 4], frase: 'O luxo em vários andares, no centro', mercados: ['EU'], cidade: 2 },
  { id: 'lafayette', nome: 'Galeries Lafayette', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'otica', 'joias', 'relogios', 'moveis'], faixas: [2, 3, 4], frase: 'A cúpula de vidro e todas as marcas', mercados: ['EU'], cidade: 2 },
  { id: 'mediamarkt', nome: 'MediaMarkt', tipo: 'departamento', categorias: ['eletronicos', 'eletrodomesticos'], faixas: [1, 2, 3], frase: 'Eletrônicos e eletrodomésticos, de tudo', mercados: ['EU'], cidade: 1 },
  { id: 'marks', nome: 'Marks & Spencer', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'moveis'], faixas: [1, 2], frase: 'Roupa, casa e o básico de qualidade', mercados: ['UK'], cidade: 1 },
  { id: 'johnlewis', nome: 'John Lewis', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'eletronicos', 'eletrodomesticos', 'moveis', 'joias'], faixas: [2, 3], frase: 'A casa e a família, com garantia', mercados: ['UK'], cidade: 2 },
  { id: 'isetan', nome: 'Isetan', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'joias', 'relogios', 'otica'], faixas: [2, 3, 4], frase: 'Andares de moda japonesa e importada', mercados: ['ASIA'], cidade: 2 },
  { id: 'yodobashi', nome: 'Yodobashi', tipo: 'departamento', categorias: ['eletronicos', 'eletrodomesticos', 'instrumentos'], faixas: [1, 2, 3], frase: 'Prédios inteiros de eletrônicos', mercados: ['ASIA'], cidade: 1 },
  { id: 'myer', nome: 'Myer', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'joias', 'moveis', 'eletrodomesticos'], faixas: [1, 2, 3], frase: 'A loja de departamento da Austrália', mercados: ['OCE'], cidade: 1 },
  { id: 'armazens', nome: 'Grandes Armazéns Central', tipo: 'departamento', categorias: ['vestuario', 'calcados', 'acessorios', 'eletronicos', 'eletrodomesticos', 'moveis'], faixas: [1, 2], frase: 'A grande loja da cidade: roupa, casa e tecnologia', mercados: ['AFR', 'ASIA', 'LATAM'], cidade: 1 },
  // Pela internet (o comércio online internacional).
  { id: 'amazon', nome: 'Amazon', tipo: 'online', categorias: ['vestuario', 'calcados', 'acessorios', 'otica', 'relogios', 'eletronicos', 'eletrodomesticos', 'moveis', 'instrumentos', 'esportes', 'livros'], faixas: [1, 2, 3], frase: 'Quase tudo, entregue em casa', mercados: ['BR', 'LATAM', 'NA', 'EU', 'UK', 'ASIA', 'OCE'], frete: 1.06, prazo: 'chega em dias' },
  { id: 'mercadolivre', nome: 'Mercado Livre', tipo: 'online', categorias: ['vestuario', 'calcados', 'acessorios', 'relogios', 'eletronicos', 'eletrodomesticos', 'moveis', 'instrumentos', 'esportes', 'livros'], faixas: [1, 2, 3], frase: 'De loja grande a vendedor pequeno', mercados: ['BR', 'LATAM'], frete: 1.05, prazo: 'chega em dias' },
  { id: 'zalando', nome: 'Zalando', tipo: 'online', categorias: ['vestuario', 'calcados', 'acessorios'], faixas: [1, 2, 3], frase: 'Moda e calçados, com devolução grátis', mercados: ['EU', 'UK'], frete: 1.03, prazo: 'chega em dias' },
  { id: 'aliexpress', nome: 'AliExpress', tipo: 'online', categorias: ['vestuario', 'calcados', 'acessorios', 'otica', 'relogios', 'joias', 'eletronicos', 'esportes'], faixas: [1], frase: 'Barato e de longe: a encomenda atravessa o mundo', frete: 1.12, prazo: 'chega em semanas' },
  { id: 'farfetch', nome: 'Farfetch', tipo: 'online', categorias: ['vestuario', 'calcados', 'otica', 'joias', 'relogios'], faixas: [3, 4], frase: 'As grifes do mundo, de boutiques de várias cidades', frete: 1.1, prazo: 'chega em uma ou duas semanas' }
];

export const estabelecimento = (id: string) => ESTABELECIMENTOS.find(e => e.id === id);
export const marca = (id: string) => MARCAS.find(m => m.id === id);
