/**
 * VIDA 21 · O QUE VEIO DO ROUBO — o catálogo (dados puros, sem lógica; a lógica mora em `motor/v21/crime/espolio21`).
 *
 * Antes, um furto ou um roubo bem-sucedido virava só um número ("R$ 2.300 no bolso"): o jogador não sabia o que tinha
 * conseguido nem o que fazer com aquilo. Agora a parte de quem fez é dinheiro em espécie (que vai para o saldo) e/ou
 * BENS concretos — um celular, um relógio, uma corrente, um quadro, uma carga, um carro — que ficam com a pessoa até ela
 * decidir: guardar, usar (o que é de usar), vestir (o que é da Aparência), vender no mercado paralelo, ou se livrar.
 *
 * PREÇOS (abstração de jogo): `preco` é o valor de mercado de referência em reais de 2026 (a cidade ajusta, como o resto do
 * catálogo). As peças equipáveis apontam para o item do guarda-roupa (`estiloId`) e usam o preço dele. A FRAÇÃO é quanto
 * do valor de mercado o mercado paralelo costuma pagar — referências gerais de jornalismo policial sobre receptação (o
 * ouro, que tem cotação, perde menos; a obra de arte cadastrada quase não tem quem compre); são estimativas de jogo, não
 * dados oficiais. Nada aqui descreve COMO se comete coisa alguma: são objetos, valores, compradores e consequências.
 */

export type CategoriaDoEspolio21 = 'celular' | 'computador' | 'eletronico' | 'joia' | 'relogio' | 'bolsa' | 'roupa' | 'arte' | 'colecionavel' | 'mercadoria' | 'veiculo';

export interface ModeloDoEspolio21 {
  id: string;
  categoria: CategoriaDoEspolio21;
  nome: string;
  /** Valor de mercado de referência (R$ de 2026). Ausente: o preço da peça do guarda-roupa (`estiloId`). */
  preco?: number;
  /** A peça do guarda-roupa (Aparência): o bem pode ser vestido/usado no corpo. */
  estiloId?: string;
  /** Tem número de série, IMEI, chassi ou cadastro de obra roubada: é procurado e pode ser achado. */
  rastreavel: boolean;
  /** 1: o que aparece num serviço pequeno; 3: só nos grandes. */
  escala: 1 | 3;
  /** Raro: pouca gente compra, e quem compra paga mais (o colecionador). */
  raro?: boolean;
  /** A surpresa ruim: parecia valer, não vale (a corrente folheada, o celular bloqueado). */
  engano?: boolean;
  /** Patamar mínimo no meio para chegar a esse tipo de serviço (1..3). */
  patamar?: number;
}

export const MODELOS_ESPOLIO21: readonly ModeloDoEspolio21[] = [
  // Celulares e computadores (IMEI e número de série: rastreáveis).
  { id: 'cel_top', categoria: 'celular', nome: 'Celular top de linha', preco: 7500, rastreavel: true, escala: 1 },
  { id: 'cel_medio', categoria: 'celular', nome: 'Celular intermediário', preco: 1800, rastreavel: true, escala: 1 },
  { id: 'cel_bloqueado', categoria: 'celular', nome: 'Celular bloqueado (só vale pelas peças)', preco: 350, rastreavel: false, escala: 1, engano: true },
  { id: 'notebook', categoria: 'computador', nome: 'Notebook', preco: 4500, rastreavel: true, escala: 1 },
  { id: 'notebook_pro', categoria: 'computador', nome: 'Notebook de alto desempenho', preco: 13000, rastreavel: true, escala: 3 },
  { id: 'tablet', categoria: 'computador', nome: 'Tablet', preco: 3200, rastreavel: true, escala: 1 },
  // Eletrônicos.
  { id: 'fone', categoria: 'eletronico', nome: 'Fone sem fio', preco: 1500, rastreavel: false, escala: 1 },
  { id: 'caixa_som', categoria: 'eletronico', nome: 'Caixa de som portátil', preco: 900, rastreavel: false, escala: 1 },
  { id: 'console', categoria: 'eletronico', nome: 'Console de videogame', preco: 4200, rastreavel: true, escala: 1 },
  { id: 'camera', categoria: 'eletronico', nome: 'Câmera fotográfica profissional', preco: 14000, rastreavel: true, escala: 3 },
  // Joias (peças do guarda-roupa: dá para usar).
  { id: 'corrente_ouro', categoria: 'joia', nome: 'Corrente veneziana de ouro', estiloId: 'j20_veneziana_ouro_amarelo', rastreavel: false, escala: 1 },
  { id: 'grumet_ouro', categoria: 'joia', nome: 'Corrente grumet de ouro', estiloId: 'j20_grumet_ouro_amarelo', rastreavel: false, escala: 3 },
  { id: 'brincos_ouro', categoria: 'joia', nome: 'Brincos de ouro', estiloId: 'brincos_ouro', rastreavel: false, escala: 1 },
  { id: 'anel_ouro', categoria: 'joia', nome: 'Anel de ouro', estiloId: 'anel_ouro', rastreavel: false, escala: 1 },
  { id: 'pulseira_ouro', categoria: 'joia', nome: 'Pulseira de ouro', estiloId: 'pulseira_ouro', rastreavel: false, escala: 3 },
  { id: 'solitario', categoria: 'joia', nome: 'Anel solitário de diamante', estiloId: 'j20_solitario_ouro_branco_diamante', rastreavel: true, escala: 3 },
  { id: 'colar_diamantes', categoria: 'joia', nome: 'Colar de diamantes', estiloId: 'colar_diamantes', rastreavel: true, escala: 3, raro: true, patamar: 2 },
  { id: 'corrente_folheada', categoria: 'joia', nome: 'Corrente que parecia ouro (era folheada)', estiloId: 'j20_choker_folheado', rastreavel: false, escala: 1, engano: true },
  // Relógios.
  { id: 'rel_mergulho', categoria: 'relogio', nome: 'Relógio de mergulho', estiloId: 'relogio_mergulho', rastreavel: false, escala: 1 },
  { id: 'smartwatch', categoria: 'relogio', nome: 'Relógio inteligente', estiloId: 'smartwatch', rastreavel: true, escala: 1 },
  { id: 'rel_luxo', categoria: 'relogio', nome: 'Relógio suíço de luxo', estiloId: 'relogio_luxo', rastreavel: true, escala: 3 },
  { id: 'rel_ouro', categoria: 'relogio', nome: 'Relógio de ouro', estiloId: 'relogio_ouro', rastreavel: true, escala: 3, raro: true, patamar: 2 },
  { id: 'rel_complicacao', categoria: 'relogio', nome: 'Relógio de alta relojoaria', estiloId: 'relogio_complicacao', rastreavel: true, escala: 3, raro: true, patamar: 3 },
  // Bolsas e roupas (peças do guarda-roupa).
  { id: 'mochila', categoria: 'bolsa', nome: 'Mochila', estiloId: 'mochila', rastreavel: false, escala: 1 },
  { id: 'bolsa_tote', categoria: 'bolsa', nome: 'Bolsa sacola', estiloId: 'bolsa_tote', rastreavel: false, escala: 1 },
  { id: 'bolsa_grife', categoria: 'bolsa', nome: 'Bolsa de grife', estiloId: 'bolsa_grife', rastreavel: false, escala: 3 },
  { id: 'jaqueta_couro', categoria: 'roupa', nome: 'Jaqueta de couro', estiloId: 'jaqueta_couro', rastreavel: false, escala: 1 },
  { id: 'blazer_grife', categoria: 'roupa', nome: 'Blazer de grife', estiloId: 'blazer_grife', rastreavel: false, escala: 3 },
  { id: 'jaqueta_grife', categoria: 'roupa', nome: 'Jaqueta de couro de grife', estiloId: 'jaqueta_couro_grife', rastreavel: false, escala: 3 },
  // Arte e coleção (cadastradas: difíceis de vender).
  { id: 'gravura', categoria: 'arte', nome: 'Gravura assinada', preco: 15000, rastreavel: true, escala: 3, patamar: 2 },
  { id: 'escultura', categoria: 'arte', nome: 'Escultura pequena em bronze', preco: 42000, rastreavel: true, escala: 3, patamar: 2 },
  { id: 'quadro', categoria: 'arte', nome: 'Quadro de um artista conhecido', preco: 180000, rastreavel: true, escala: 3, raro: true, patamar: 3 },
  { id: 'moedas', categoria: 'colecionavel', nome: 'Coleção de moedas antigas', preco: 12000, rastreavel: false, escala: 3 },
  { id: 'caneta', categoria: 'colecionavel', nome: 'Caneta-tinteiro de grife', preco: 6000, rastreavel: false, escala: 1 },
  { id: 'uisque', categoria: 'colecionavel', nome: 'Garrafas de uísque raro', preco: 9000, rastreavel: false, escala: 3 },
  { id: 'rel_bolso', categoria: 'colecionavel', nome: 'Relógio de bolso antigo', preco: 8000, rastreavel: false, escala: 3, raro: true },
  // Mercadorias (a carga, o lote).
  { id: 'perfumes', categoria: 'mercadoria', nome: 'Caixas de perfume importado', preco: 22000, rastreavel: false, escala: 3 },
  { id: 'pneus', categoria: 'mercadoria', nome: 'Lote de pneus', preco: 18000, rastreavel: false, escala: 3 },
  { id: 'eletrodomesticos', categoria: 'mercadoria', nome: 'Eletrodomésticos ainda na caixa', preco: 26000, rastreavel: true, escala: 3 },
  { id: 'ferramentas', categoria: 'mercadoria', nome: 'Ferramentas elétricas', preco: 12000, rastreavel: false, escala: 3 },
  // Veículos (chassi: rastreáveis; sem documento, não entram na garagem legal).
  { id: 'moto', categoria: 'veiculo', nome: 'Moto de 160 cilindradas', preco: 18000, rastreavel: true, escala: 3 },
  { id: 'carro_popular', categoria: 'veiculo', nome: 'Carro popular', preco: 62000, rastreavel: true, escala: 3 },
  { id: 'picape', categoria: 'veiculo', nome: 'Picape média', preco: 220000, rastreavel: true, escala: 3, patamar: 2 },
  { id: 'suv_luxo', categoria: 'veiculo', nome: 'SUV de luxo', preco: 450000, rastreavel: true, escala: 3, raro: true, patamar: 3 }
];

/** Quanto do valor de mercado o mercado paralelo costuma pagar, por categoria (estimativa de jogo). */
export const FRACAO_DO_MERCADO21: Record<CategoriaDoEspolio21, number> = {
  celular: 0.3, computador: 0.3, eletronico: 0.35, joia: 0.55, relogio: 0.28, bolsa: 0.25, roupa: 0.22,
  arte: 0.1, colecionavel: 0.3, mercadoria: 0.38, veiculo: 0.15
};

export const NOME_DA_CATEGORIA21: Record<CategoriaDoEspolio21, string> = {
  celular: 'Celular', computador: 'Computador', eletronico: 'Eletrônico', joia: 'Joia', relogio: 'Relógio', bolsa: 'Bolsa',
  roupa: 'Roupa', arte: 'Obra de arte', colecionavel: 'Colecionável', mercadoria: 'Mercadoria', veiculo: 'Veículo'
};

export type Comprador21 = 'bairro' | 'usados' | 'ouro' | 'desmanche' | 'colecionador';

export interface PerfilDoComprador21 {
  nome: string;
  /** O que compra. */
  compra: CategoriaDoEspolio21[];
  /** Quanto paga sobre a fração de referência. */
  paga: number;
  /** A chance-base de a venda dar errado (flagrante, informante, a polícia de olho na loja). */
  risco: number;
  /** O nome no meio (reputação no mercado, 0..100) para alguém assim aceitar negociar com você. */
  reputacao: number;
  descricao: string;
}

export const COMPRADORES21: Record<Comprador21, PerfilDoComprador21> = {
  bairro: { nome: 'Receptador do bairro', compra: ['celular', 'computador', 'eletronico', 'joia', 'relogio', 'bolsa', 'roupa', 'colecionavel', 'mercadoria'], paga: 0.8, risco: 0.05, reputacao: 0, descricao: 'Compra quase tudo, paga pouco e não pergunta.' },
  usados: { nome: 'Loja de usados sem nota', compra: ['celular', 'computador', 'eletronico'], paga: 1, risco: 0.06, reputacao: 0, descricao: 'Eletrônico tem saída rápida — e IMEI tem cadastro.' },
  ouro: { nome: 'Comprador de ouro e relógios', compra: ['joia', 'relogio'], paga: 1.05, risco: 0.07, reputacao: 10, descricao: 'Ouro tem cotação; relógio caro tem número de série.' },
  desmanche: { nome: 'Desmanche', compra: ['veiculo', 'mercadoria'], paga: 1, risco: 0.12, reputacao: 25, descricao: 'Peça por peça: some rápido, mas é o lugar que a polícia mais visita.' },
  colecionador: { nome: 'Colecionador que não pergunta', compra: ['arte', 'colecionavel', 'relogio', 'joia', 'bolsa', 'roupa'], paga: 1.35, risco: 0.1, reputacao: 45, descricao: 'Paga o que vale o raro — se você for alguém em quem ele confia.' }
};

/** O estado do bem: escondido (guardado longe), em uso (o celular, o carro, o quadro na parede) ou no guarda-roupa. */
export type EstadoDoBem21 = 'escondido' | 'em_uso' | 'no_guarda_roupa';

export interface BemIlicito21 {
  id: string;
  modelo: string;
  categoria: CategoriaDoEspolio21;
  nome: string;
  /** Valor de mercado, na moeda da vida (a cidade de quando veio). */
  valor: number;
  t: number;
  /** De onde veio ("um serviço pequeno", "a carga desviada"). */
  origem: string;
  rastreavel: boolean;
  raro?: boolean;
  engano?: boolean;
  /** O quanto está sendo procurado (0..100): começa alto, esfria com os anos. */
  calor: number;
  estado: EstadoDoBem21;
  /** A peça do guarda-roupa (catálogo) e a instância, quando foi vestida. */
  estiloId?: string;
  pecaId?: string;
}

export interface Espolio21 {
  bens: BemIlicito21[];
  /** O nome no mercado paralelo (0..100): sobe com venda limpa, cai com a que dá errado. Abre compradores melhores. */
  reputacao: number;
  /** O que já se vendeu, perdeu ou largou (no máximo 40, os mais recentes). */
  historico: { t: number; nome: string; desfecho: 'vendido' | 'apreendido' | 'recuperado' | 'descartado'; valor?: number; comprador?: Comprador21 }[];
}
