/**
 * HOTFIX 11.5.1 — AS TATUAGENS: o que se tatua (o desenho, o estilo, o tamanho, se é colorida) e onde (a parte do
 * corpo, o lado). As referências são as do estúdio de verdade: a andorinha, a âncora e a rosa do tradicional americano
 * (contorno grosso, cor chapada), o traço único do fine line, a mandala e os triângulos da geométrica, os blocos pretos
 * do tribal polinésio, a peônia e o girassol do floral, a escrita cursiva, a onda e a carpa do desenho artístico, e as
 * composições grandes (o fechamento de braço, as costas inteiras, o peito). O desenho mora na interface
 * (`ui/avatar/tatuagens`); aqui, o que o motor precisa: o tamanho (quanto espaço ocupa), o preço, onde cabe.
 *
 * Cada parte do corpo tem uma área (`capacidade`, em unidades de tamanho): cabe o que couber — várias pequenas no
 * antebraço, uma grande nas costas — sem limite artificial de quantidade. O fechamento de braço ocupa o braço e o
 * antebraço inteiros daquele lado.
 */

export type EstiloDeTatuagem = 'tradicional' | 'fine_line' | 'geometrica' | 'tribal' | 'floral' | 'escrita' | 'artistica' | 'composicao';
export type LocalDeTatuagem = 'braco' | 'antebraco' | 'ombro' | 'mao' | 'peito' | 'costas' | 'abdomen' | 'pescoco' | 'coxa' | 'panturrilha';
export type Lado = 'e' | 'd';

export const NOME_ESTILO: Record<EstiloDeTatuagem, string> = {
  tradicional: 'Tradicional', fine_line: 'Fine line', geometrica: 'Geométrica', tribal: 'Tribal', floral: 'Floral',
  escrita: 'Escritas e símbolos', artistica: 'Desenho artístico', composicao: 'Composições grandes'
};

export interface LocalDoCorpo {
  nome: string;
  /** Tem lado (braço esquerdo/direito)? */
  lados: boolean;
  /** Quanto cabe, em unidades de tamanho (1 pequena · 2 média · 3 grande). */
  capacidade: number;
  /** O maior desenho que a parte comporta. */
  maximo: 1 | 2 | 3;
  /** Aparece de frente, de costas (na figura de corpo inteiro). */
  frente: boolean;
  costas: boolean;
}

export const LOCAIS: Record<LocalDeTatuagem, LocalDoCorpo> = {
  braco: { nome: 'braço', lados: true, capacidade: 3, maximo: 3, frente: true, costas: true },
  antebraco: { nome: 'antebraço', lados: true, capacidade: 3, maximo: 2, frente: true, costas: false },
  ombro: { nome: 'ombro', lados: true, capacidade: 2, maximo: 2, frente: true, costas: true },
  mao: { nome: 'mão', lados: true, capacidade: 1, maximo: 1, frente: true, costas: false },
  peito: { nome: 'peito', lados: false, capacidade: 4, maximo: 3, frente: true, costas: false },
  costas: { nome: 'costas', lados: false, capacidade: 5, maximo: 3, frente: false, costas: true },
  abdomen: { nome: 'abdômen', lados: false, capacidade: 3, maximo: 3, frente: true, costas: false },
  pescoco: { nome: 'pescoço', lados: true, capacidade: 1, maximo: 1, frente: true, costas: false },
  coxa: { nome: 'coxa', lados: true, capacidade: 3, maximo: 2, frente: true, costas: false },
  panturrilha: { nome: 'panturrilha', lados: true, capacidade: 2, maximo: 2, frente: true, costas: true }
};
export const ORDEM_DOS_LOCAIS = Object.keys(LOCAIS) as LocalDeTatuagem[];

export interface DesenhoDeTatuagem {
  id: string;
  nome: string;
  estilo: EstiloDeTatuagem;
  /** 1 pequena · 2 média · 3 grande · 4 composição que fecha a parte (o fechamento de braço). */
  tamanho: 1 | 2 | 3 | 4;
  colorida?: boolean;
  /** Onde o desenho faz sentido (a escrita fina no pescoço; o fechamento só no braço; o dragão só nas costas). */
  locais: LocalDeTatuagem[];
  descricao: string;
}

const TODOS_PEQUENOS: LocalDeTatuagem[] = ['braco', 'antebraco', 'ombro', 'mao', 'peito', 'costas', 'abdomen', 'pescoco', 'coxa', 'panturrilha'];
const MEDIOS: LocalDeTatuagem[] = ['braco', 'antebraco', 'ombro', 'peito', 'costas', 'abdomen', 'coxa', 'panturrilha'];
const GRANDES: LocalDeTatuagem[] = ['braco', 'peito', 'costas', 'abdomen'];

export const DESENHOS: readonly DesenhoDeTatuagem[] = [
  // Tradicional (old school): contorno grosso, cor chapada.
  { id: 'andorinha', nome: 'Andorinha', estilo: 'tradicional', tamanho: 2, colorida: true, locais: MEDIOS, descricao: 'A do marinheiro: a volta para casa.' },
  { id: 'ancora', nome: 'Âncora', estilo: 'tradicional', tamanho: 2, locais: MEDIOS, descricao: 'Firmeza, o porto, o mar.' },
  { id: 'rosa_tradicional', nome: 'Rosa tradicional', estilo: 'tradicional', tamanho: 2, colorida: true, locais: MEDIOS, descricao: 'Vermelha, com duas folhas, contorno grosso.' },
  { id: 'coracao_faixa', nome: 'Coração com faixa', estilo: 'tradicional', tamanho: 2, colorida: true, locais: MEDIOS, descricao: 'Com espaço para um nome na faixa.' },
  { id: 'adaga', nome: 'Adaga', estilo: 'tradicional', tamanho: 2, locais: MEDIOS, descricao: 'A lâmina atravessando, o cabo trabalhado.' },
  { id: 'pantera', nome: 'Pantera', estilo: 'tradicional', tamanho: 3, locais: GRANDES, descricao: 'A cabeça da pantera rugindo, em preto chapado.' },
  // Fine line: traço único, fino.
  { id: 'ramo_fino', nome: 'Ramo fino', estilo: 'fine_line', tamanho: 1, locais: TODOS_PEQUENOS, descricao: 'Um galho de folhas, traço de agulha única.' },
  { id: 'lua_estrelas', nome: 'Lua e estrelas', estilo: 'fine_line', tamanho: 1, locais: TODOS_PEQUENOS, descricao: 'Crescente e três pontos de luz.' },
  { id: 'linha_continua', nome: 'Rosto em linha contínua', estilo: 'fine_line', tamanho: 2, locais: MEDIOS, descricao: 'Um perfil num traço só, sem tirar a agulha.' },
  { id: 'coracaozinho', nome: 'Coraçãozinho', estilo: 'fine_line', tamanho: 1, locais: TODOS_PEQUENOS, descricao: 'Pequeno, discreto, para lembrar de alguém.' },
  // Geométrica.
  { id: 'mandala', nome: 'Mandala', estilo: 'geometrica', tamanho: 3, locais: ['braco', 'peito', 'costas', 'abdomen', 'ombro'], descricao: 'Pétalas em anéis, pontilhismo no centro.' },
  { id: 'triangulos', nome: 'Triângulos', estilo: 'geometrica', tamanho: 2, locais: MEDIOS, descricao: 'Formas sobrepostas, linha e preenchimento.' },
  { id: 'bracadeira', nome: 'Braçadeira geométrica', estilo: 'geometrica', tamanho: 2, locais: ['braco', 'antebraco', 'panturrilha', 'coxa'], descricao: 'Uma faixa em volta: losangos e linhas.' },
  // Tribal.
  { id: 'tribal_polinesio', nome: 'Tribal polinésio', estilo: 'tribal', tamanho: 3, locais: ['braco', 'ombro', 'peito', 'costas', 'panturrilha'], descricao: 'Blocos pretos, ondas e dentes de tubarão.' },
  { id: 'tribal_faixa', nome: 'Faixa tribal', estilo: 'tribal', tamanho: 2, locais: ['braco', 'antebraco', 'panturrilha', 'coxa'], descricao: 'As pontas curvas, em preto.' },
  // Floral.
  { id: 'peonia', nome: 'Peônia', estilo: 'floral', tamanho: 2, colorida: true, locais: MEDIOS, descricao: 'Pétalas cheias, rosa e folhas verdes.' },
  { id: 'girassol', nome: 'Girassol', estilo: 'floral', tamanho: 2, colorida: true, locais: MEDIOS, descricao: 'O miolo marrom, as pétalas amarelas.' },
  { id: 'ramos', nome: 'Ramos de folhas', estilo: 'floral', tamanho: 2, locais: [...MEDIOS, 'pescoco'], descricao: 'Folhas que acompanham a curva do corpo.' },
  // Escritas e símbolos.
  { id: 'nome_cursivo', nome: 'Nome em letra cursiva', estilo: 'escrita', tamanho: 1, locais: TODOS_PEQUENOS, descricao: 'Um nome, uma palavra, em caligrafia.' },
  { id: 'data_romana', nome: 'Data em romanos', estilo: 'escrita', tamanho: 1, locais: TODOS_PEQUENOS, descricao: 'A data que importa, em algarismos romanos.' },
  { id: 'frase', nome: 'Frase', estilo: 'escrita', tamanho: 2, locais: ['antebraco', 'costas', 'peito', 'coxa', 'braco'], descricao: 'Duas linhas de uma frase que ficou.' },
  { id: 'simbolo_infinito', nome: 'Infinito', estilo: 'escrita', tamanho: 1, locais: TODOS_PEQUENOS, descricao: 'O oito deitado.' },
  // Desenho artístico.
  { id: 'onda', nome: 'A grande onda', estilo: 'artistica', tamanho: 2, colorida: true, locais: MEDIOS, descricao: 'A onda de gravura japonesa, espuma em garras.' },
  { id: 'montanha', nome: 'Montanhas', estilo: 'artistica', tamanho: 2, locais: MEDIOS, descricao: 'Picos, um sol, o traço de gravura.' },
  { id: 'carpa', nome: 'Carpa koi', estilo: 'artistica', tamanho: 3, colorida: true, locais: GRANDES, descricao: 'A carpa subindo a correnteza, laranja e preta.' },
  { id: 'caveira', nome: 'Caveira', estilo: 'artistica', tamanho: 2, locais: MEDIOS, descricao: 'Sombreada em cinza, sem susto.' },
  // Composições grandes.
  { id: 'fechamento', nome: 'Fechamento de braço', estilo: 'composicao', tamanho: 4, locais: ['braco'], descricao: 'Do ombro ao pulso: ondas, flores e nuvens, em sessões ao longo de meses.' },
  { id: 'dragao_costas', nome: 'Dragão nas costas', estilo: 'composicao', tamanho: 3, colorida: true, locais: ['costas'], descricao: 'O dragão ocupando as costas inteiras.' },
  { id: 'aguia_peito', nome: 'Águia no peito', estilo: 'composicao', tamanho: 3, locais: ['peito'], descricao: 'As asas abertas de um ombro ao outro.' }
];
export const desenhoDeTatuagem = (id: string) => DESENHOS.find(d => d.id === id);

/** O preço base no Brasil (o estúdio, a sessão, a cor): a cidade multiplica. */
export const PRECO_POR_TAMANHO: Record<1 | 2 | 3 | 4, number> = { 1: 280, 2: 750, 3: 2300, 4: 5200 };
