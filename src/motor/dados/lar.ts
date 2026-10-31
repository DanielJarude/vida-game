/**
 * REWORK 12.4 — A CASA POR DENTRO: os cômodos, a planta de cada tipo de moradia e os acabamentos.
 *
 * Uma kitnet não é uma mansão com menos dinheiro: é um cômodo só (cama, cozinha e sala no mesmo lugar), sem quarto
 * sobrando para virar estúdio e sem terreno para piscina. Cada tipo de moradia (`dados/bens.MORADIAS`) tem a sua
 * PLANTA — os cômodos que vêm com ela, quantos quartos sobram para mudar de uso, quanto terreno há para obra e quantas
 * vagas de garagem — e é ela que diz o que dá para fazer da casa. Nada aqui é luxo automático: o que vem com o imóvel é
 * o acabamento do padrão dele; o resto é o que a pessoa escolhe, paga e instala.
 *
 * Preços em reais de 2026 (cidade de custo 1,0). O cômodo equipado (o estúdio com instrumento, a academia com
 * aparelho) ajuda a prática do que se faz nele; o cômodo vazio é só metro quadrado.
 */

import type { AspectoDoComodo } from '../tipos';

export type TipoComodo =
  | 'sala' | 'cozinha' | 'quarto' | 'quarto_extra' | 'banheiro'
  | 'escritorio' | 'jogos' | 'academia' | 'garagem' | 'jardim' | 'piscina' | 'lazer'
  | 'estudio' | 'atelie' | 'biblioteca' | 'cinema';

export interface ModeloComodo {
  tipo: TipoComodo;
  nome: string;
  /** Para a frase ("o estúdio", "a sala de cinema"). */
  artigo: 'o' | 'a';
  /** Área típica (m²): pesa no preço do piso e da pintura. */
  area: number;
  /** Custo de transformar um quarto que sobra neste cômodo (estante, isolamento, espelho). Ausente: não cabe num quarto. */
  conversao?: number;
  /** Construir do zero, no terreno (m² de terreno que ocupa e o preço da obra). Ausente: não se constrói. */
  obra?: { preco: number; terreno: number };
  /**
   * O cômodo equipado ajuda a prática do que se faz nele (+ fração da qualidade, como as coisas — `coisas.bonusDaAtividade`,
   * com o mesmo teto). Só vale quando alguma das coisas de `pede` está nele: a academia vazia é só um quarto vazio.
   */
  ajuda?: Partial<Record<string, number>>;
  pede?: string[];
  /** Descanso que o cômodo dá por ano (felicidade), quando usado (equipado, quando pede). */
  lazer?: number;
  /** O que custa por mês para manter (piscineiro, jardineiro, filtro), na cidade de custo 1,0. */
  manutencao?: number;
  descricao: string;
}

const INSTRUMENTOS = ['violao', 'teclado', 'guitarra', 'bateria', 'violino', 'piano', 'cavaquinho', 'pandeiro', 'sanfona', 'saxofone', 'home_studio', 'controladora_dj'];

export const COMODOS: Record<TipoComodo, ModeloComodo> = {
  sala: { tipo: 'sala', nome: 'sala', artigo: 'a', area: 20, descricao: 'Onde a casa senta junto e recebe quem chega.' },
  cozinha: { tipo: 'cozinha', nome: 'cozinha', artigo: 'a', area: 10, descricao: 'Fogão, pia, a mesa do café.' },
  quarto: { tipo: 'quarto', nome: 'quarto', artigo: 'o', area: 12, descricao: 'O seu quarto: a cama, o armário, a janela.' },
  quarto_extra: { tipo: 'quarto_extra', nome: 'quarto', artigo: 'o', area: 9, conversao: 1500, obra: { preco: 90000, terreno: 15 }, descricao: 'Um quarto para filho, hóspede — ou para virar outra coisa.' },
  banheiro: { tipo: 'banheiro', nome: 'banheiro', artigo: 'o', area: 5, descricao: 'Chuveiro, pia, espelho.' },
  escritorio: { tipo: 'escritorio', nome: 'escritório', artigo: 'o', area: 9, conversao: 2500, obra: { preco: 60000, terreno: 15 }, pede: ['escrivaninha', 'computador', 'notebook'], ajuda: { programacao: 0.05, estudar_concurso: 0.06, freelas: 0.06, escrever: 0.04, cursinho: 0.05 }, descricao: 'Uma porta que fecha e uma mesa que é só de trabalho.' },
  jogos: { tipo: 'jogos', nome: 'sala de jogos', artigo: 'a', area: 16, conversao: 3000, obra: { preco: 80000, terreno: 30 }, pede: ['videogame', 'mesa_sinuca', 'jogos_tabuleiro'], lazer: 1.5, ajuda: { videogame: 0.05, xadrez: 0.03 }, descricao: 'A mesa, o console, os amigos até tarde.' },
  academia: { tipo: 'academia', nome: 'academia', artigo: 'a', area: 12, conversao: 4000, obra: { preco: 70000, terreno: 25 }, pede: ['kit_academia', 'esteira', 'estacao_musculacao'], ajuda: { academia: 0.1, corrida: 0.04, lutas: 0.03 }, descricao: 'Piso de borracha, espelho, o treino sem trânsito.' },
  garagem: { tipo: 'garagem', nome: 'garagem', artigo: 'a', area: 15, obra: { preco: 45000, terreno: 40 }, descricao: 'Coberta, com portão: o carro guardado em casa.' },
  jardim: { tipo: 'jardim', nome: 'jardim', artigo: 'o', area: 40, obra: { preco: 15000, terreno: 40 }, lazer: 1, manutencao: 250, descricao: 'Grama, árvore, terra para mexer. O jardineiro vem a cada quinze dias.' },
  piscina: { tipo: 'piscina', nome: 'piscina', artigo: 'a', area: 30, obra: { preco: 80000, terreno: 35 }, lazer: 2, manutencao: 450, descricao: 'Verão em casa. O piscineiro toda semana, a conta de água e de química.' },
  lazer: { tipo: 'lazer', nome: 'área de lazer', artigo: 'a', area: 25, obra: { preco: 60000, terreno: 30 }, lazer: 1, manutencao: 80, descricao: 'Churrasqueira, mesa comprida, o domingo de portas abertas.' },
  estudio: { tipo: 'estudio', nome: 'estúdio musical', artigo: 'o', area: 10, conversao: 18000, obra: { preco: 120000, terreno: 25 }, pede: INSTRUMENTOS, ajuda: { musica: 0.12, tocar_na_noite: 0.05, criar_conteudo: 0.05 }, descricao: 'Tratamento acústico, porta pesada: tocar às onze da noite sem o vizinho saber.' },
  atelie: { tipo: 'atelie', nome: 'ateliê', artigo: 'o', area: 12, conversao: 3000, obra: { preco: 60000, terreno: 25 }, pede: ['material_arte', 'cavalete', 'torno_ceramica', 'tablet', 'camera'], ajuda: { desenho: 0.12, fotografia: 0.06 }, descricao: 'Luz do dia, chão que pode sujar, a obra secando na parede.' },
  biblioteca: { tipo: 'biblioteca', nome: 'biblioteca', artigo: 'a', area: 12, conversao: 6000, obra: { preco: 80000, terreno: 25 }, pede: ['livros', 'livros_estudo', 'poltrona'], ajuda: { leitura: 0.1, escrever: 0.06, estudar_concurso: 0.03 }, lazer: 0.5, descricao: 'Estante do chão ao teto e uma poltrona boa.' },
  cinema: { tipo: 'cinema', nome: 'sala de cinema', artigo: 'a', area: 18, conversao: 25000, obra: { preco: 150000, terreno: 30 }, pede: ['projetor', 'tv'], lazer: 2, manutencao: 60, descricao: 'Blackout, som envolvente, poltronas: o filme de sábado com a família.' }
};

export const comodo = (t: string): ModeloComodo | undefined => COMODOS[t as TipoComodo];

/**
 * A planta de cada tipo de moradia: os cômodos que vêm com ela (além da sala, cozinha, quarto e banheiro, quando não é
 * um cômodo só), quantos quartos sobram (os outros quartos do imóvel), o terreno livre para obra e as vagas de
 * garagem. A república é o seu quarto na casa dos outros: nada além dele se personaliza.
 */
export interface Planta {
  /** Um cômodo só (kitnet, quarto de república): sala, cozinha e quarto juntos. */
  integrado?: boolean;
  /** Cômodos que vêm com o imóvel, além dos básicos e dos quartos. */
  extras: TipoComodo[];
  /** Terreno livre para construir (m²). Apartamento: zero (as regras do prédio). */
  terreno: number;
  /** Vagas de garagem (carro ou moto). Barco e avião ficam na marina e no hangar (já pagos). */
  vagas: number;
  /** O que o prédio deixa fazer num apartamento (a cobertura tem terraço; os outros, só o que é por dentro). */
  obrasPermitidas?: TipoComodo[];
}

export const PLANTAS: Record<string, Planta> = {
  republica: { integrado: true, extras: [], terreno: 0, vagas: 0 },
  kitnet: { integrado: true, extras: [], terreno: 0, vagas: 0 },
  apto_1q: { extras: [], terreno: 0, vagas: 1 },
  apto_2q: { extras: [], terreno: 0, vagas: 1 },
  apto_3q: { extras: [], terreno: 0, vagas: 2 },
  alto_padrao: { extras: [], terreno: 0, vagas: 2 },
  cobertura: { extras: ['piscina', 'lazer'], terreno: 70, vagas: 3, obrasPermitidas: ['jardim', 'academia', 'jogos', 'cinema'] },
  casa_simples: { extras: [], terreno: 25, vagas: 1 },
  casa_2q: { extras: ['garagem'], terreno: 40, vagas: 1 },
  casa_3q: { extras: ['garagem', 'jardim'], terreno: 90, vagas: 2 },
  casa_grande: { extras: ['garagem', 'jardim', 'lazer'], terreno: 260, vagas: 3 },
  mansao: { extras: ['garagem', 'jardim', 'lazer', 'piscina', 'escritorio'], terreno: 700, vagas: 6 },
  sitio: { extras: ['garagem', 'jardim', 'lazer'], terreno: 3000, vagas: 4 }
};
export const plantaDe = (modeloId: string | undefined): Planta => PLANTAS[modeloId ?? ''] ?? PLANTAS.apto_2q;

/* ----------------------------------------------------------- acabamentos */

export interface OpcaoDeAcabamento {
  id: string;
  nome: string;
  /** 1..5 — o padrão do acabamento (pesa no conforto e no cuidado que pede). */
  nivel: number;
  /** Preço por m² (piso, pintura) ou por cômodo (luz), na cidade de custo 1,0. */
  preco: number;
  porM2?: boolean;
  /** A cor (para a cena do cômodo). */
  cor?: string;
  /** O que pede de cuidado por mês (o mármore polido, a automação). */
  manutencao?: number;
}

export const ACABAMENTOS: Record<AspectoDoComodo, { nome: string; opcoes: OpcaoDeAcabamento[] }> = {
  piso: {
    nome: 'Piso',
    opcoes: [
      { id: 'ceramica', nome: 'cerâmica simples', nivel: 1, preco: 60, porM2: true, cor: '#c9b9a0' },
      { id: 'cimento', nome: 'cimento queimado', nivel: 2, preco: 90, porM2: true, cor: '#9b9894' },
      { id: 'vinilico', nome: 'vinílico amadeirado', nivel: 2, preco: 110, porM2: true, cor: '#b48a5e' },
      { id: 'porcelanato', nome: 'porcelanato', nivel: 3, preco: 180, porM2: true, cor: '#d6d0c6' },
      { id: 'madeira', nome: 'taco de madeira', nivel: 4, preco: 320, porM2: true, cor: '#8f5e37' },
      { id: 'marmore', nome: 'mármore', nivel: 5, preco: 700, porM2: true, cor: '#e8e4dc', manutencao: 0.6 }
    ]
  },
  parede: {
    nome: 'Paredes',
    opcoes: [
      { id: 'branco', nome: 'branco gelo', nivel: 2, preco: 28, porM2: true, cor: '#efede8' },
      { id: 'areia', nome: 'areia', nivel: 2, preco: 28, porM2: true, cor: '#ddcdb2' },
      { id: 'terracota', nome: 'terracota', nivel: 2, preco: 32, porM2: true, cor: '#c0714f' },
      { id: 'verde_oliva', nome: 'verde-oliva', nivel: 2, preco: 32, porM2: true, cor: '#7d8350' },
      { id: 'verde_menta', nome: 'verde-menta', nivel: 2, preco: 32, porM2: true, cor: '#a9cdb6' },
      { id: 'azul_petroleo', nome: 'azul-petróleo', nivel: 2, preco: 32, porM2: true, cor: '#2f5d68' },
      { id: 'rosa_antigo', nome: 'rosa-antigo', nivel: 2, preco: 32, porM2: true, cor: '#c99a97' },
      { id: 'mostarda', nome: 'amarelo-mostarda', nivel: 2, preco: 32, porM2: true, cor: '#cf9f3b' },
      { id: 'grafite', nome: 'grafite', nivel: 2, preco: 32, porM2: true, cor: '#45484c' },
      { id: 'tijolo', nome: 'tijolo aparente', nivel: 3, preco: 140, porM2: true, cor: '#a5583c' },
      { id: 'papel', nome: 'papel de parede estampado', nivel: 3, preco: 95, porM2: true, cor: '#b7a37d' },
      { id: 'boiserie', nome: 'boiserie (molduras)', nivel: 4, preco: 260, porM2: true, cor: '#e4dfd5' }
    ]
  },
  luz: {
    nome: 'Iluminação',
    opcoes: [
      { id: 'simples', nome: 'lâmpada no teto', nivel: 1, preco: 0 },
      { id: 'quente', nome: 'luz quente, abajur e arandela', nivel: 2, preco: 450 },
      { id: 'planejada', nome: 'projeto de iluminação (sanca, pendentes)', nivel: 3, preco: 2600 },
      { id: 'automacao', nome: 'automação (cenas, controle pelo celular)', nivel: 4, preco: 6500, manutencao: 25 }
    ]
  }
};

export const opcaoDeAcabamento = (a: AspectoDoComodo, id: string | undefined): OpcaoDeAcabamento | undefined => ACABAMENTOS[a].opcoes.find(o => o.id === id);

/** O acabamento com que o imóvel vem, pelo padrão dele (a casa simples não vem com mármore; a mansão não vem com cerâmica). */
export function acabamentoDeOrigem(a: AspectoDoComodo, padrao: number): string {
  if (a === 'piso') return padrao >= 5 ? 'madeira' : padrao >= 3 ? 'porcelanato' : 'ceramica';
  if (a === 'parede') return 'branco';
  return padrao >= 5 ? 'quente' : 'simples';
}

/**
 * Onde cada coisa costuma ficar (o primeiro cômodo da lista que a casa tem; senão, o quarto ou a sala). Quem decide é
 * a pessoa: isto é só onde a coisa entra quando chega.
 */
export const COMODO_DA_COISA: Record<string, TipoComodo[]> = {
  tv: ['sala'], sofa: ['sala'], mesa_jantar: ['sala'], som_hifi: ['sala'], discos: ['sala'], poltrona: ['biblioteca', 'sala'],
  projetor: ['cinema', 'sala'], videogame: ['jogos', 'sala'], mesa_sinuca: ['jogos', 'sala'], jogos_tabuleiro: ['jogos', 'sala'],
  maquina_lavar: ['cozinha'], lava_loucas: ['cozinha'], cozinha_equipada: ['cozinha'], aspirador_robo: ['sala'], ar_condicionado: ['quarto'],
  colchao: ['quarto'], roupa_de_cama: ['quarto'], escrivaninha: ['escritorio', 'quarto'], computador: ['escritorio', 'quarto'], notebook: ['escritorio', 'quarto'],
  livros: ['biblioteca', 'sala'], livros_estudo: ['escritorio', 'biblioteca', 'quarto'],
  kit_academia: ['academia', 'quarto'], esteira: ['academia', 'sala'], estacao_musculacao: ['academia', 'garagem', 'sala'],
  piano: ['estudio', 'sala'], material_arte: ['atelie', 'quarto'], cavalete: ['atelie', 'sala'], torno_ceramica: ['atelie', 'garagem', 'cozinha'],
  camera: ['atelie', 'quarto'], tablet: ['atelie', 'quarto']
};
for (const id of INSTRUMENTOS) COMODO_DA_COISA[id] ??= ['estudio', 'quarto'];

/** Coisas grandes (pesam numa mudança, no frete entre casas, no depósito); as pequenas vão na mala. */
export const COISAS_GRANDES = new Set(['tv', 'sofa', 'mesa_jantar', 'maquina_lavar', 'lava_loucas', 'colchao', 'esteira', 'piano', 'bateria', 'mesa_sinuca', 'estacao_musculacao', 'torno_ceramica', 'escrivaninha', 'ar_condicionado', 'cozinha_equipada', 'poltrona', 'projetor', 'som_hifi']);

/** O depósito alugado (self storage), por mês, na cidade de custo 1,0: o boxe pequeno e o espaço por coisa grande. */
export const DEPOSITO = { base: 180, porGrande: 45 };
/** O cofre do banco, por ano (só o que é pequeno: joia, relógio, a peça de coleção que cabe numa caixa). */
export const COFRE_ANUAL = 900;
/** A vaga alugada (carro além das vagas da casa), por mês, na cidade de custo 1,0. */
export const VAGA_MENSAL = 260;
