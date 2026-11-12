/**
 * 12.4.1 — COMO CADA PEÇA SE VÊ. O motor sabe o que a pessoa tem e usa (`dados/estilo`, `eu.estilo.itens`); aqui mora
 * só o desenho de cada peça: a forma (camiseta, camisa, calça, saia, tênis, coturno…), a cor, a estampa, a manga, o
 * comprimento, o caimento. Lido pela figura de corpo inteiro (`Figura.tsx`) e pelo retrato (a peça de cima).
 *
 * As referências são as peças de verdade (o colarinho e a carcela da camisa social, a costura dupla e o bolso do
 * jeans, o capuz e o bolso canguru do moletom, a sola alta do tênis de corrida, o cano do coturno, o salto do
 * scarpin), traduzidas na linguagem do VIDA: formas chapadas, um tom de sombra, uma linha de costura — sem textura
 * fotográfica. Cada peça precisa se distinguir das vizinhas pela SILHUETA antes da cor (manga, gola, comprimento).
 */

export type Estampa = 'listras' | 'xadrez' | 'floral' | 'wax' | 'chita' | 'banda' | 'time' | 'logo' | 'tachas';
export type Manga = 'sem' | 'curta' | 'longa';
export type Gola = 'redonda' | 'v' | 'colarinho' | 'capuz' | 'polo' | 'canoa' | 'alta';

/** Uma cor fixa ou opções (a peça comprada sorteia uma, estável pelo id dela). */
type Cor = string | string[];

export type Peca =
  | { parte: 'cima'; forma: 'camiseta' | 'regata' | 'camisa' | 'moletom' | 'bata' | 'polo' | 'sueter' | 'blusa' | 'agasalho'; cor: Cor; cor2?: string; estampa?: Estampa; manga: Manga; gola: Gola; folga?: number; bolso?: boolean; botoes?: boolean }
  | { parte: 'baixo'; forma: 'calca' | 'bermuda' | 'saia' | 'short' | 'legging'; corte: 'reta' | 'larga' | 'justa' | 'bombacha' | 'midi' | 'curta' | 'lapis'; cor: Cor; cor2?: string; estampa?: Estampa; bolsos?: boolean; vinco?: boolean; costura?: string; listra?: string }
  | { parte: 'inteira'; forma: 'vestido' | 'macacao' | 'terno'; comprimento: 'curto' | 'joelho' | 'midi' | 'longo' | 'calca'; cor: Cor; cor2?: string; estampa?: Estampa; manga: Manga; gola: Gola; cinto?: string }
  | { parte: 'casaco'; forma: 'jaqueta' | 'blazer' | 'sobretudo' | 'corta_vento' | 'casaco' | 'jaqueta_jeans'; comprimento: 'cintura' | 'quadril' | 'joelho'; cor: Cor; cor2?: string; ziper?: boolean; lapela?: boolean; gola?: 'alta' | 'pelo' | 'camisa' }
  | { parte: 'pes'; forma: 'tenis' | 'tenis_corrida' | 'tenis_cano' | 'tenis_lona' | 'sapato' | 'coturno' | 'chinelo' | 'botina' | 'salto' | 'sandalia' | 'sapatilha' | 'mocassim'; cor: Cor; sola: string; detalhe?: string }
  | { parte: 'pulso'; forma: 'analogico' | 'digital' | 'smart'; pulseira: string; caixa: string; mostrador: string }
  | { parte: 'pulseira'; cor: string; grossa?: boolean; contas?: string[] }
  | { parte: 'anel'; cor: string; pedra?: string }
  | { parte: 'pescoco'; cor: string; grossa?: boolean; contas?: string[]; pingente?: string; cruz?: boolean }
  /** VIDA 17: a bolsa (cruzada no peito, na mão, nas costas, na cintura). */
  | { parte: 'bolsa'; forma: 'transversal' | 'tote' | 'mochila' | 'pochete' | 'clutch'; cor: string; alca?: string; ferragem?: string };

/**
 * VIDA 17 · O MATERIAL de cada peça (a textura que se vê de perto): lido do próprio produto — o jeans tem a sarja
 * diagonal, o tricô o ponto, o linho a trama, o couro e a seda o brilho, a sarja e a alfaiataria a diagonal fina, o
 * moletom a felpa. A cor é a mesma; o tecido deixa de ser chapado (a vitrine, o provador e o corpo usam o mesmo).
 */
export type Material = 'jeans' | 'trico' | 'linho' | 'couro' | 'seda' | 'sarja' | 'moletom' | 'veludo';
export function materialDe(itemId: string): Material | undefined {
  if (/jeans/.test(itemId)) return 'jeans';
  if (/couro|motoqueiro/.test(itemId)) return 'couro';
  if (/seda|cetim|festa|longo|gala/.test(itemId)) return 'seda';
  if (/tricot|tric|sueter|cardigan|_la\b|casaco_la|gola_alta/.test(itemId)) return 'trico';
  if (/linho|bata/.test(itemId)) return 'linho';
  if (/veludo/.test(itemId)) return 'veludo';
  if (/moletom|agasalho|baile/.test(itemId)) return 'moletom';
  if (/alfaiataria|sarja|cargo|terno|blazer|sobretudo|bombacha|social/.test(itemId)) return 'sarja';
  return undefined;
}

/** Um conjunto antigo (as "roupas" de antes do 12.4 ocupam a parte de cima e a de baixo). */
export interface Conjunto { cima?: Peca; baixo?: Peca; inteira?: Peca; casaco?: Peca; pes?: Peca }

const JEANS = ['#3d5a80', '#2f4562', '#5b7aa3', '#22324a'];
const NEUTRAS = ['#f2efe8', '#22262b', '#7d8590', '#2d3e5c', '#b9a58a', '#5d6b4f'];

/** O desenho de cada item que se veste (os ids de `dados/estilo.ITENS_ESTILO`). */
export const PECAS: Record<string, Peca | Conjunto> = {
  // ------------------------------------------------------------ a parte de cima
  camiseta_lisa: { parte: 'cima', forma: 'camiseta', cor: NEUTRAS, manga: 'curta', gola: 'redonda' },
  camiseta_banda: { parte: 'cima', forma: 'camiseta', cor: ['#1b1b1d', '#2a2a2e'], cor2: '#e8e2d4', estampa: 'banda', manga: 'curta', gola: 'redonda' },
  camisa_time: { parte: 'cima', forma: 'camiseta', cor: ['#c8102e', '#0b5d2a', '#f2c200', '#1d4fa3', '#111214', '#7a1e2b'], cor2: '#f4f4f2', estampa: 'time', manga: 'curta', gola: 'v', folga: 1.03 },
  camisa_social: { parte: 'cima', forma: 'camisa', cor: ['#f4f6f8', '#cfe0f2', '#f3ece3'], manga: 'longa', gola: 'colarinho', botoes: true },
  camisa_linho: { parte: 'cima', forma: 'camisa', cor: ['#ece4d4', '#d9e2dc', '#f6f1e7'], manga: 'longa', gola: 'colarinho', botoes: true, folga: 1.05 },
  moletom_oversized: { parte: 'cima', forma: 'moletom', cor: ['#8d9399', '#3b3f45', '#5d6b4f', '#b65d3a'], manga: 'longa', gola: 'capuz', folga: 1.14, bolso: true },
  camiseta_grife: { parte: 'cima', forma: 'camiseta', cor: ['#f4f2ee', '#111214'], cor2: '#c9a14a', estampa: 'logo', manga: 'curta', gola: 'redonda', folga: 1.1 },
  regata: { parte: 'cima', forma: 'regata', cor: ['#f2efe8', '#1f2328', '#c8102e', '#2b5d8a'], manga: 'sem', gola: 'redonda' },
  bata_wax: { parte: 'cima', forma: 'bata', cor: '#d9822b', cor2: '#1f5c7a', estampa: 'wax', manga: 'curta', gola: 'v', folga: 1.08 },
  camisa_xadrez: { parte: 'cima', forma: 'camisa', cor: ['#a3302c', '#2f6a44', '#2b4a7b'], cor2: '#151515', estampa: 'xadrez', manga: 'longa', gola: 'colarinho', botoes: true },
  camisa_polo: { parte: 'cima', forma: 'polo', cor: ['#1f3a5f', '#f2efe8', '#2f5a3c', '#8a1e2b'], manga: 'curta', gola: 'polo' },
  camiseta_listrada: { parte: 'cima', forma: 'camiseta', cor: '#f4f1ea', cor2: '#1f3a5f', estampa: 'listras', manga: 'longa', gola: 'canoa' },
  sueter_tricot: { parte: 'cima', forma: 'sueter', cor: ['#b9a58a', '#5a3d2b', '#2d3e5c', '#7b2d3a'], manga: 'longa', gola: 'redonda', folga: 1.04 },
  blusa_seda: { parte: 'cima', forma: 'blusa', cor: ['#f3e7dc', '#1e2a3a', '#9c3b4a', '#2f5a52'], manga: 'longa', gola: 'v' },
  cropped: { parte: 'cima', forma: 'blusa', cor: ['#f2efe8', '#1b1b1d', '#d97a8a'], manga: 'curta', gola: 'redonda', folga: 0.96 },

  // ------------------------------------------------------------ a parte de baixo
  jeans: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: JEANS, bolsos: true, costura: '#c99a4a' },
  calca_alfaiataria: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#2b2f36', '#3b3a40', '#6b5e4e', '#1e2a3a'], vinco: true },
  calca_cargo: { parte: 'baixo', forma: 'calca', corte: 'larga', cor: ['#6b6a4e', '#2b2d2f', '#a49a7c'], bolsos: true },
  bermuda_tactel: { parte: 'baixo', forma: 'bermuda', corte: 'larga', cor: ['#1d4fa3', '#1b1b1d', '#c8102e'], listra: '#f4f4f2' },
  bermuda_sarja: { parte: 'baixo', forma: 'bermuda', corte: 'reta', cor: ['#b9a58a', '#5d6b4f', '#2d3e5c'], bolsos: true },
  saia_midi: { parte: 'baixo', forma: 'saia', corte: 'midi', cor: ['#7b2d3a', '#2d3e5c', '#c9a46a', '#3f5a48'] },
  saia_xadrez: { parte: 'baixo', forma: 'saia', corte: 'curta', cor: '#8a1e2b', cor2: '#1a1a1a', estampa: 'xadrez' },
  bombacha: { parte: 'baixo', forma: 'calca', corte: 'bombacha', cor: ['#4a3b2c', '#2b2f36', '#6b5e4e'] },
  short_jeans: { parte: 'baixo', forma: 'short', corte: 'curta', cor: JEANS, bolsos: true, costura: '#c99a4a' },
  legging: { parte: 'baixo', forma: 'legging', corte: 'justa', cor: ['#1b1b1d', '#2d3e5c', '#5a4a6b'] },
  saia_lapis: { parte: 'baixo', forma: 'saia', corte: 'lapis', cor: ['#1b1b1d', '#2b2f36', '#6b5e4e'] },

  // ------------------------------------------------------------ peça inteira (cima e baixo)
  vestido_floral: { parte: 'inteira', forma: 'vestido', comprimento: 'joelho', cor: ['#f3e2c8', '#cfe0f2', '#f2d4d8'], cor2: '#c2566b', estampa: 'floral', manga: 'curta', gola: 'v' },
  vestido_festa: { parte: 'inteira', forma: 'vestido', comprimento: 'longo', cor: ['#14213d', '#7b1e2b', '#1b1b1d', '#2f5a52'], manga: 'sem', gola: 'v', cinto: '#c9a14a' },
  vestido_chita: { parte: 'inteira', forma: 'vestido', comprimento: 'midi', cor: '#c8102e', cor2: '#f2c200', estampa: 'chita', manga: 'curta', gola: 'redonda' },
  conjunto_baile: { cima: { parte: 'cima', forma: 'agasalho', cor: ['#1d4fa3', '#c8102e', '#1b1b1d'], cor2: '#f4f4f2', manga: 'longa', gola: 'alta' }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#1d4fa3', '#c8102e', '#1b1b1d'], listra: '#f4f4f2' } },
  macacao: { parte: 'inteira', forma: 'macacao', comprimento: 'calca', cor: ['#5d6b4f', '#3d5a80', '#b65d3a'], manga: 'sem', gola: 'v' },
  vestido_longo: { parte: 'inteira', forma: 'vestido', comprimento: 'longo', cor: ['#e8d9c0', '#6b8a7a', '#b65d3a'], manga: 'sem', gola: 'canoa' },
  terno: { parte: 'inteira', forma: 'terno', comprimento: 'calca', cor: ['#1e2533', '#2b2f36', '#3b3a40'], cor2: '#f4f6f8', manga: 'longa', gola: 'colarinho' },

  // ------------------------------------------------------------ por cima
  jaqueta_couro: { parte: 'casaco', forma: 'jaqueta', comprimento: 'cintura', cor: ['#1b1a1a', '#4a2c20'], ziper: true, lapela: true },
  jaqueta_jeans: { parte: 'casaco', forma: 'jaqueta_jeans', comprimento: 'cintura', cor: JEANS, gola: 'camisa' },
  corta_vento: { parte: 'casaco', forma: 'corta_vento', comprimento: 'quadril', cor: ['#2b5d8a', '#c84b31', '#2f5a3c'], cor2: '#f2efe8', ziper: true, gola: 'alta' },
  blazer: { parte: 'casaco', forma: 'blazer', comprimento: 'quadril', cor: ['#2b2f36', '#2d3e5c', '#6b5e4e'], lapela: true },
  casaco_la: { parte: 'casaco', forma: 'casaco', comprimento: 'joelho', cor: ['#8a7a66', '#3b3f45', '#7b2d3a'], lapela: true },
  sobretudo_grife: { parte: 'casaco', forma: 'sobretudo', comprimento: 'joelho', cor: ['#c2a47a', '#1b1b1d'], lapela: true },

  // ------------------------------------------------------------ nos pés
  tenis_casual: { parte: 'pes', forma: 'tenis', cor: ['#f4f4f2', '#1b1b1d', '#7d8590'], sola: '#f4f4f2' },
  tenis_corrida: { parte: 'pes', forma: 'tenis_corrida', cor: ['#2b5d8a', '#c84b31', '#3a3f45'], sola: '#f4f4f2', detalhe: '#e8f04a' },
  tenis_cano_alto: { parte: 'pes', forma: 'tenis_cano', cor: ['#f4f4f2', '#1b1b1d', '#8a1e2b'], sola: '#f4f4f2', detalhe: '#1b1b1d' },
  tenis_lona: { parte: 'pes', forma: 'tenis_lona', cor: ['#1b1b1d', '#c8102e', '#2d3e5c', '#f2efe8'], sola: '#f4f1ea' },
  tenis_colecionavel: { parte: 'pes', forma: 'tenis_cano', cor: '#f4f4f2', sola: '#e9e2d0', detalhe: '#c84b31' },
  chinelo_slide: { parte: 'pes', forma: 'chinelo', cor: ['#1b1b1d', '#f4f4f2'], sola: '#2a2a2e' },
  sapato_social: { parte: 'pes', forma: 'sapato', cor: ['#1b1515', '#4a2c20'], sola: '#141010' },
  coturno: { parte: 'pes', forma: 'coturno', cor: '#1b1a1a', sola: '#0f0f0f', detalhe: '#c9c3b6' },
  botina: { parte: 'pes', forma: 'botina', cor: ['#6b4428', '#4a2c20'], sola: '#2a1d14' },
  scarpin: { parte: 'pes', forma: 'salto', cor: ['#1b1b1d', '#8a1e2b', '#c9a46a'], sola: '#141010' },
  sandalia: { parte: 'pes', forma: 'sandalia', cor: ['#8a5a3a', '#1b1b1d', '#c9a46a'], sola: '#3a2a1e' },
  sapatilha: { parte: 'pes', forma: 'sapatilha', cor: ['#1b1b1d', '#c9a46a', '#d97a8a'], sola: '#2a2a2e' },
  mocassim: { parte: 'pes', forma: 'mocassim', cor: ['#6b4428', '#2b2f36'], sola: '#2a1d14' },

  // ------------------------------------------------------------ pulso, mãos, pescoço
  relogio: { parte: 'pulso', forma: 'analogico', pulseira: '#5a3d2b', caixa: '#c9ccd1', mostrador: '#f4f1ea' },
  // VIDA 17: os relógios, as joias e as bolsas novas.
  relogio_mergulho: { parte: 'pulso', forma: 'analogico', pulseira: '#b9bec5', caixa: '#2d5fa8', mostrador: '#14213d' },
  relogio_couro_classico: { parte: 'pulso', forma: 'analogico', pulseira: '#6b3f22', caixa: '#d8b45a', mostrador: '#f3ead2' },
  relogio_digital_retro: { parte: 'pulso', forma: 'digital', pulseira: '#c9a14a', caixa: '#d8b45a', mostrador: '#9fb58a' },
  corrente_cruz: { parte: 'pescoco', cor: '#c9ccd1', grossa: true, pingente: '#c9ccd1', cruz: true },
  colar_perolas: { parte: 'pescoco', cor: '#f1ece0', contas: ['#f4efe4', '#f4efe4', '#f4efe4', '#f4efe4', '#f4efe4', '#f4efe4', '#f4efe4'] },
  anel_grafite: { parte: 'anel', cor: '#7d838a' },
  bolsa_transversal: { parte: 'bolsa', forma: 'transversal', cor: '#2b2f36', alca: '#1b1b1d', ferragem: '#c9ccd1' },
  bolsa_tote: { parte: 'bolsa', forma: 'tote', cor: '#c9a46a', alca: '#6b4a2a' },
  mochila: { parte: 'bolsa', forma: 'mochila', cor: '#2f4f7a', alca: '#1f2f4a' },
  pochete: { parte: 'bolsa', forma: 'pochete', cor: '#1b1b1d', alca: '#3b3f45', ferragem: '#e0b43c' },
  clutch: { parte: 'bolsa', forma: 'clutch', cor: '#7b1e2b', ferragem: '#d8b45a' },
  bolsa_grife: { parte: 'bolsa', forma: 'transversal', cor: '#5a2a1e', alca: '#d8b45a', ferragem: '#d8b45a' },
  relogio_luxo: { parte: 'pulso', forma: 'analogico', pulseira: '#c9a14a', caixa: '#d8b45a', mostrador: '#1a2a44' },
  relogio_digital: { parte: 'pulso', forma: 'digital', pulseira: '#1b1b1d', caixa: '#2a2a2e', mostrador: '#9fb3a0' },
  smartwatch: { parte: 'pulso', forma: 'smart', pulseira: '#3a3f45', caixa: '#1b1b1d', mostrador: '#0d1520' },
  pulseira_couro: { parte: 'pulseira', cor: '#5a3d2b' },
  pulseira_prata: { parte: 'pulseira', cor: '#c9ccd1' },
  pulseira_ouro: { parte: 'pulseira', cor: '#d8b45a', grossa: true },
  pulseira_contas: { parte: 'pulseira', cor: '#7a4a2a', contas: ['#c84b31', '#f2c200', '#2f5a3c', '#f4f1ea'] },
  anel_prata: { parte: 'anel', cor: '#c9ccd1' },
  anel_ouro: { parte: 'anel', cor: '#d8b45a', pedra: '#b8323c' },
  joia: { parte: 'pescoco', cor: '#c9a14a', pingente: '#c9a14a' },
  corrente_prata: { parte: 'pescoco', cor: '#c9ccd1' },
  corrente_grossa: { parte: 'pescoco', cor: '#d8b45a', grossa: true },
  guias: { parte: 'pescoco', cor: '#f4f1ea', contas: ['#f4f1ea', '#c8102e', '#1d4fa3', '#f2c200'] },

  // ------------------------------------------------------------ 12.7 · esporte, grife, alta-costura e alta joalheria
  top_esportivo: { parte: 'cima', forma: 'regata', cor: ['#1b1b1d', '#5a4a6b', '#2b5d8a', '#c84b31'], manga: 'sem', gola: 'redonda', folga: 0.94 },
  short_corrida: { parte: 'baixo', forma: 'short', corte: 'curta', cor: ['#1b1b1d', '#2b5d8a', '#3a3f45'], listra: '#e8f04a' },
  camisa_seda_grife: { parte: 'cima', forma: 'camisa', cor: ['#f3e7dc', '#14213d'], cor2: '#c9a14a', estampa: 'floral', manga: 'longa', gola: 'colarinho', botoes: true, folga: 1.04 },
  moletom_grife: { parte: 'cima', forma: 'moletom', cor: ['#111214', '#f4f2ee', '#6b6a4e'], cor2: '#c9a14a', estampa: 'logo', manga: 'longa', gola: 'capuz', folga: 1.12, bolso: true },
  calca_alfaiataria_grife: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#1d1f24', '#3a3036', '#c2b7a3'], vinco: true, costura: '#c9a14a' },
  saia_couro_grife: { parte: 'baixo', forma: 'saia', corte: 'lapis', cor: ['#151313', '#4a1e24'], costura: '#c9a14a' },
  vestido_grife: { parte: 'inteira', forma: 'vestido', comprimento: 'longo', cor: ['#7b1e2b', '#0f1a2e', '#f2ece2'], manga: 'sem', gola: 'canoa', cinto: '#d8b45a' },
  vestido_alta_costura: { parte: 'inteira', forma: 'vestido', comprimento: 'longo', cor: ['#e9dcc4', '#1a1630', '#5a1630'], cor2: '#e8d48a', estampa: 'floral', manga: 'sem', gola: 'v', cinto: '#e8d48a' },
  terno_vicunha: { parte: 'inteira', forma: 'terno', comprimento: 'calca', cor: ['#8a6e4e', '#3a3530', '#1c2230'], cor2: '#f6f1e7', manga: 'longa', gola: 'colarinho' },
  blazer_grife: { parte: 'casaco', forma: 'blazer', comprimento: 'quadril', cor: ['#14213d', '#f2ece2', '#1b1b1d'], cor2: '#c9a14a', lapela: true },
  jaqueta_couro_grife: { parte: 'casaco', forma: 'jaqueta', comprimento: 'cintura', cor: ['#5a3a24', '#151313'], cor2: '#c9a14a', ziper: true, lapela: true },
  casaco_cashmere_bordado: { parte: 'casaco', forma: 'sobretudo', comprimento: 'joelho', cor: ['#2a1f3a', '#efe6d6', '#1f2b26'], cor2: '#d8b45a', lapela: true, gola: 'pelo' },
  sapato_bespoke: { parte: 'pes', forma: 'sapato', cor: ['#5a2f1c', '#2a1a14'], sola: '#141010', detalhe: '#c9a14a' },
  salto_grife: { parte: 'pes', forma: 'salto', cor: ['#1b1b1d', '#c9a46a', '#f2ece2'], sola: '#c8102e' },
  tenis_colab_raro: { parte: 'pes', forma: 'tenis_cano', cor: '#f2ece2', sola: '#e0c36a', detalhe: '#3a6fd1' },
  relogio_ouro: { parte: 'pulso', forma: 'analogico', pulseira: '#d8b45a', caixa: '#e4c56a', mostrador: '#f4ecd8' },
  relogio_complicacao: { parte: 'pulso', forma: 'analogico', pulseira: '#2a1a14', caixa: '#e5e4e2', mostrador: '#0f1a30' },
  colar_diamantes: { parte: 'pescoco', cor: '#e5e4e2', grossa: true, pingente: '#dff3ff' },
  anel_diamante: { parte: 'anel', cor: '#e5e4e2', pedra: '#dff3ff' },

  // ------------------------------------------------------------ os conjuntos de antes (cima + baixo)
  roupa_basica_boa: { cima: { parte: 'cima', forma: 'camiseta', cor: NEUTRAS, manga: 'curta', gola: 'redonda' }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: JEANS, bolsos: true, costura: '#c99a4a' }, pes: { parte: 'pes', forma: 'tenis', cor: '#f4f4f2', sola: '#f4f4f2' } },
  roupa_esportiva: { cima: { parte: 'cima', forma: 'agasalho', cor: ['#2f6f8f', '#b0493c', '#3f7a52'], cor2: '#f2efe8', manga: 'longa', gola: 'alta' }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#2b2f36', '#2f6f8f'], listra: '#f2efe8' }, pes: { parte: 'pes', forma: 'tenis_corrida', cor: '#3a3f45', sola: '#f4f4f2', detalhe: '#e8f04a' } },
  roupa_social: { cima: { parte: 'cima', forma: 'camisa', cor: ['#f4f6f8', '#cfe0f2'], manga: 'longa', gola: 'colarinho', botoes: true }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#2b2f36', '#29384a'], vinco: true }, pes: { parte: 'pes', forma: 'sapato', cor: '#1b1515', sola: '#141010' } },
  roupa_alternativa: { cima: { parte: 'cima', forma: 'bata', cor: ['#8a5a2b', '#6b3f73', '#2f6b66'], cor2: '#f2c200', estampa: 'floral', manga: 'curta', gola: 'v', folga: 1.06 }, baixo: { parte: 'baixo', forma: 'calca', corte: 'larga', cor: ['#5d6b4f', '#4a3b2c'] }, pes: { parte: 'pes', forma: 'tenis_lona', cor: '#c8102e', sola: '#f4f1ea' } },
  roupa_elegante: { cima: { parte: 'cima', forma: 'camisa', cor: ['#1d1f24', '#3a2430', '#f4f6f8'], manga: 'longa', gola: 'colarinho', botoes: true }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: '#1d1f24', vinco: true }, casaco: { parte: 'casaco', forma: 'blazer', comprimento: 'quadril', cor: ['#1d1f24', '#1f2d3a'], lapela: true }, pes: { parte: 'pes', forma: 'sapato', cor: '#1b1515', sola: '#141010' } }
};

const ehPeca = (x: Peca | Conjunto): x is Peca => 'parte' in x;

/** Uma cor da peça: a fixa, ou uma das opções — estável pela semente (o id da peça comprada). */
export function corDe(c: Cor, semente: string): string {
  if (typeof c === 'string') return c;
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) { h ^= semente.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return c[(h >>> 0) % c.length];
}

/** A peça (ou o conjunto) de um item, com as cores resolvidas pela semente. */
export type PecaResolvida = Peca & { cor?: string };
export function pecasDoItem(itemId: string, semente: string): Conjunto {
  const x = PECAS[itemId];
  if (!x) return {};
  const mat = materialDe(itemId);
  const resolver = (p: Peca): Peca => ('cor' in p ? { ...p, cor: corDe(p.cor as Cor, semente + p.parte), ...(mat && p.parte !== 'pes' ? { material: mat } : {}) } as Peca : p);
  if (ehPeca(x)) {
    const p = resolver(x);
    const chave = p.parte === 'cima' ? 'cima' : p.parte === 'baixo' ? 'baixo' : p.parte === 'inteira' ? 'inteira' : p.parte === 'casaco' ? 'casaco' : p.parte === 'pes' ? 'pes' : undefined;
    return chave ? { [chave]: p } : {};
  }
  const out: Conjunto = {};
  for (const k of ['cima', 'baixo', 'inteira', 'casaco', 'pes'] as const) if (x[k]) out[k] = resolver(x[k]!);
  return out;
}

/**
 * VIDA 12.9 — AS CORES À VENDA de uma peça: as opções da parte principal (a de cima, o vestido, a calça, o casaco, o
 * calçado — a primeira que tem mais de uma cor). Vazio: a peça tem uma cor só.
 */
const PARTES_PRINCIPAIS = ['cima', 'inteira', 'baixo', 'casaco', 'pes'] as const;
function partePrincipal(itemId: string): Peca | undefined {
  const x = PECAS[itemId];
  if (!x) return undefined;
  if (ehPeca(x)) return x;
  for (const k of PARTES_PRINCIPAIS) { const p = x[k]; if (p && 'cor' in p && Array.isArray(p.cor) && p.cor.length > 1) return p; }
  return undefined;
}
export function coresDoItem(itemId: string): string[] {
  const p = partePrincipal(itemId);
  return p && 'cor' in p && Array.isArray(p.cor) && p.cor.length > 1 ? [...p.cor] : [];
}
/** A cor principal que a semente dá (a mesma conta de `pecasDoItem`). */
export function corPrincipalDa(itemId: string, semente: string): string | undefined {
  const p = partePrincipal(itemId);
  return p && 'cor' in p ? corDe(p.cor as Cor, semente + p.parte) : undefined;
}
/** O nome de uma cor (para o leitor de tela e a dica): pelo tom, pela claridade e pela saturação. */
export function nomeDaCor(hex: string): string {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (sat < 0.15 || d < 0.08) return l > 0.85 ? 'branco' : l > 0.6 ? 'cinza-claro' : l > 0.3 ? 'cinza' : l > 0.12 ? 'grafite' : 'preto';
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h >= 15 && h < 55 && sat < 0.5 && l > 0.45) return l > 0.8 ? 'creme' : 'bege';
  const base = h < 15 || h >= 345 ? 'vermelho' : h < 40 ? (l < 0.35 ? 'marrom' : 'laranja') : h < 65 ? (l < 0.35 ? 'oliva' : 'amarelo') : h < 165 ? 'verde' : h < 200 ? 'azul-petróleo' : h < 255 ? 'azul' : h < 290 ? 'roxo' : 'rosa';
  return l < 0.33 && base !== 'marrom' ? `${base} escuro` : l > 0.75 ? `${base} claro` : base;
}

/** Os nomes das cores de uma peça, sem repetir: duas do mesmo tom se distinguem pela claridade. */
export function nomesDasCores(cores: string[]): string[] {
  const nomes = cores.map(nomeDaCor);
  const luz = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };
  for (const nome of new Set(nomes)) {
    const idx = nomes.map((x, i) => (x === nome ? i : -1)).filter(i => i >= 0);
    if (idx.length < 2) continue;
    const ord = [...idx].sort((a, b) => luz(cores[b]) - luz(cores[a]));
    const rot = ord.length === 2 ? ['tom claro', 'tom escuro'] : ord.map((_, k) => (k === 0 ? 'tom claro' : k === ord.length - 1 ? 'tom escuro' : `tom médio${ord.length > 3 ? ` ${k}` : ''}`));
    ord.forEach((i, k) => { nomes[i] = `${nome}, ${rot[k]}`; });
  }
  return nomes;
}

/** A variante da vitrine (a de sempre) e a de cada cor: uma semente estável que dá exatamente aquela cor. */
export const varianteDaVitrine = (itemId: string) => `${itemId}-vitrine`;
export function varianteDaCor(itemId: string, cor: string): string {
  if (corPrincipalDa(itemId, varianteDaVitrine(itemId)) === cor) return varianteDaVitrine(itemId);
  for (let n = 0; n < 400; n++) { const s = `${itemId}~${n}`; if (corPrincipalDa(itemId, s) === cor) return s; }
  return varianteDaVitrine(itemId);
}

/** O acessório (pulso, pulseira, anel, pescoço) de um item. */
export function acessorioDoItem(itemId: string): Extract<Peca, { parte: 'pulso' | 'pulseira' | 'anel' | 'pescoco' | 'bolsa' }> | undefined {
  const x = PECAS[itemId];
  return x && ehPeca(x) && (x.parte === 'pulso' || x.parte === 'pulseira' || x.parte === 'anel' || x.parte === 'pescoco' || x.parte === 'bolsa') ? x : undefined;
}
