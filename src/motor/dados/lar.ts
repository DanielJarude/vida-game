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
  escritorio: { tipo: 'escritorio', nome: 'escritório', artigo: 'o', area: 9, conversao: 2500, obra: { preco: 60000, terreno: 15 }, pede: ['escrivaninha', 'computador', 'notebook', 'mesa_executiva', 'monitores', 'cadeira_ergonomica'], ajuda: { programacao: 0.05, estudar_concurso: 0.06, freelas: 0.06, escrever: 0.04, cursinho: 0.05 }, descricao: 'Uma porta que fecha e uma mesa que é só de trabalho.' },
  jogos: { tipo: 'jogos', nome: 'sala de jogos', artigo: 'a', area: 16, conversao: 3000, obra: { preco: 80000, terreno: 30 }, pede: ['videogame', 'mesa_sinuca', 'jogos_tabuleiro', 'pebolim', 'pingue_pongue', 'bilhar_profissional', 'fliperama', 'mesa_jogos'], lazer: 1.5, ajuda: { videogame: 0.05, xadrez: 0.03 }, descricao: 'A mesa, o console, os amigos até tarde.' },
  academia: { tipo: 'academia', nome: 'academia', artigo: 'a', area: 12, conversao: 4000, obra: { preco: 70000, terreno: 25 }, pede: ['kit_academia', 'esteira', 'estacao_musculacao', 'bicicleta_ergometrica', 'remo_seco', 'saco_pancada'], ajuda: { academia: 0.1, corrida: 0.04, lutas: 0.03 }, descricao: 'Piso de borracha, espelho, o treino sem trânsito.' },
  garagem: { tipo: 'garagem', nome: 'garagem', artigo: 'a', area: 15, obra: { preco: 45000, terreno: 40 }, descricao: 'Coberta, com portão: o carro guardado em casa.' },
  jardim: { tipo: 'jardim', nome: 'jardim', artigo: 'o', area: 40, obra: { preco: 15000, terreno: 40 }, lazer: 1, manutencao: 250, descricao: 'Grama, árvore, terra para mexer. O jardineiro vem a cada quinze dias.' },
  piscina: { tipo: 'piscina', nome: 'piscina', artigo: 'a', area: 30, obra: { preco: 80000, terreno: 35 }, lazer: 2, manutencao: 450, descricao: 'Verão em casa. O piscineiro toda semana, a conta de água e de química.' },
  lazer: { tipo: 'lazer', nome: 'área de lazer', artigo: 'a', area: 25, obra: { preco: 60000, terreno: 30 }, lazer: 1, manutencao: 80, descricao: 'Churrasqueira, mesa comprida, o domingo de portas abertas.' },
  estudio: { tipo: 'estudio', nome: 'estúdio musical', artigo: 'o', area: 10, conversao: 18000, obra: { preco: 120000, terreno: 25 }, pede: INSTRUMENTOS, ajuda: { musica: 0.12, tocar_na_noite: 0.05, criar_conteudo: 0.05 }, descricao: 'Tratamento acústico, porta pesada: tocar às onze da noite sem o vizinho saber.' },
  atelie: { tipo: 'atelie', nome: 'ateliê', artigo: 'o', area: 12, conversao: 3000, obra: { preco: 60000, terreno: 25 }, pede: ['material_arte', 'cavalete', 'torno_ceramica', 'tablet', 'camera'], ajuda: { desenho: 0.12, fotografia: 0.06 }, descricao: 'Luz do dia, chão que pode sujar, a obra secando na parede.' },
  biblioteca: { tipo: 'biblioteca', nome: 'biblioteca', artigo: 'a', area: 12, conversao: 6000, obra: { preco: 80000, terreno: 25 }, pede: ['livros', 'livros_estudo', 'poltrona'], ajuda: { leitura: 0.1, escrever: 0.06, estudar_concurso: 0.03 }, lazer: 0.5, descricao: 'Estante do chão ao teto e uma poltrona boa.' },
  cinema: { tipo: 'cinema', nome: 'sala de cinema', artigo: 'a', area: 18, conversao: 25000, obra: { preco: 150000, terreno: 30 }, pede: ['projetor', 'tv', 'poltronas_cinema', 'home_theater', 'tv_oled'], lazer: 2, manutencao: 60, descricao: 'Blackout, som envolvente, poltronas: o filme de sábado com a família.' }
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
  /** 1..6 — o padrão do acabamento (pesa no conforto e no cuidado que pede): básico, intermediário, premium, luxo, alto luxo, exclusivo. */
  nivel: number;
  /** Preço por m² (piso, pintura) ou por cômodo (luz), na cidade de custo 1,0. */
  preco: number;
  porM2?: boolean;
  /** A cor (para a cena do cômodo). */
  cor?: string;
  /** 12.7 — a segunda cor do desenho (o veio do mármore, a estampa do papel, o friso da boiserie). */
  cor2?: string;
  /** 12.7 — como a cena desenha (o padrão do piso, o desenho da parede, o tipo de luminária). */
  desenho?: string;
  /** 12.7 — luz que aceita regular temperatura e intensidade (dimmer, lâmpada de cor ajustável). */
  regulavel?: boolean;
  /** O que pede de cuidado por mês (o mármore polido, a automação). */
  manutencao?: number;
}

/** 12.7 — os segmentos (o nível do acabamento, do móvel e da roupa): o mesmo vocabulário em toda loja. */
export const SEGMENTOS_DE_LUXO = ['básico', 'intermediário', 'premium', 'luxo', 'alto luxo', 'exclusivo'] as const;
export const segmentoDoNivel = (nivel: number) => SEGMENTOS_DE_LUXO[Math.max(0, Math.min(5, Math.round(nivel) - 1))];

const tinta = (id: string, nome: string, cor: string, nivel = 2, preco = 32): OpcaoDeAcabamento => ({ id, nome, nivel, preco, porM2: true, cor, desenho: 'liso' });

export const ACABAMENTOS: Record<AspectoDoComodo, { nome: string; opcoes: OpcaoDeAcabamento[] }> = {
  piso: {
    nome: 'Piso',
    opcoes: [
      { id: 'ceramica', nome: 'cerâmica simples', nivel: 1, preco: 60, porM2: true, cor: '#c9b9a0', desenho: 'rejunte' },
      { id: 'cimento', nome: 'cimento queimado', nivel: 2, preco: 90, porM2: true, cor: '#9b9894', desenho: 'cimento' },
      { id: 'vinilico', nome: 'vinílico amadeirado', nivel: 2, preco: 110, porM2: true, cor: '#b48a5e', desenho: 'tabua' },
      { id: 'vinilico_cinza', nome: 'vinílico cinza-carvalho', nivel: 2, preco: 120, porM2: true, cor: '#a39d93', desenho: 'tabua' },
      { id: 'carpete', nome: 'carpete em placas', nivel: 2, preco: 95, porM2: true, cor: '#8c8f96', desenho: 'carpete' },
      { id: 'ladrilho', nome: 'ladrilho hidráulico', nivel: 3, preco: 210, porM2: true, cor: '#d9cbb0', cor2: '#3f6f7a', desenho: 'ladrilho' },
      { id: 'porcelanato', nome: 'porcelanato', nivel: 3, preco: 180, porM2: true, cor: '#d6d0c6', desenho: 'rejunte' },
      { id: 'porcelanato_gf', nome: 'porcelanato de grande formato', nivel: 3, preco: 260, porM2: true, cor: '#e2ddd4', desenho: 'grande_formato' },
      { id: 'porcelanato_marmo', nome: 'porcelanato marmorizado', nivel: 3, preco: 240, porM2: true, cor: '#ece8e1', cor2: '#b9b3a8', desenho: 'marmore' },
      { id: 'granito', nome: 'granito polido', nivel: 3, preco: 280, porM2: true, cor: '#8a8580', cor2: '#3e3a37', desenho: 'granito' },
      { id: 'madeira', nome: 'taco de madeira', nivel: 4, preco: 320, porM2: true, cor: '#8f5e37', desenho: 'tabua' },
      { id: 'taco_espinha', nome: 'taco em espinha de peixe', nivel: 4, preco: 420, porM2: true, cor: '#9a6a40', desenho: 'espinha' },
      { id: 'carvalho', nome: 'assoalho de carvalho, tábua larga', nivel: 4, preco: 480, porM2: true, cor: '#c39b6c', desenho: 'tabua_larga' },
      { id: 'demolicao', nome: 'madeira de demolição', nivel: 4, preco: 390, porM2: true, cor: '#6e4a2e', desenho: 'tabua_larga' },
      { id: 'carpete_la', nome: 'carpete de lã', nivel: 4, preco: 450, porM2: true, cor: '#cdbfae', desenho: 'carpete' },
      { id: 'travertino', nome: 'travertino', nivel: 4, preco: 560, porM2: true, cor: '#dcc9a8', cor2: '#c4ad87', desenho: 'grande_formato' },
      { id: 'marmore', nome: 'mármore', nivel: 5, preco: 700, porM2: true, cor: '#e8e4dc', cor2: '#b9b3a8', desenho: 'marmore', manutencao: 0.6 },
      { id: 'marmore_nero', nome: 'mármore Nero Marquina', nivel: 5, preco: 980, porM2: true, cor: '#26262a', cor2: '#d9d6d0', desenho: 'marmore', manutencao: 0.7 },
      { id: 'parquet_versailles', nome: 'parquet Versailles', nivel: 5, preco: 1400, porM2: true, cor: '#8b5a33', cor2: '#6b4224', desenho: 'versailles', manutencao: 0.5 },
      { id: 'marmore_calacatta', nome: 'mármore Calacatta em peça única', nivel: 6, preco: 2600, porM2: true, cor: '#f1eee8', cor2: '#a88c5c', desenho: 'marmore', manutencao: 0.9 }
    ]
  },
  parede: {
    nome: 'Paredes',
    opcoes: [
      tinta('branco', 'branco gelo', '#efede8', 2, 28), tinta('areia', 'areia', '#ddcdb2', 2, 28),
      tinta('off_white', 'off-white', '#f3eee2', 2, 28), tinta('cinza_claro', 'cinza-claro', '#cfd0cf', 2, 28),
      tinta('terracota', 'terracota', '#c0714f'), tinta('verde_oliva', 'verde-oliva', '#7d8350'), tinta('verde_menta', 'verde-menta', '#a9cdb6'),
      tinta('verde_salvia', 'verde-sálvia', '#9fae95'), tinta('verde_floresta', 'verde-floresta', '#2f4a3a'),
      tinta('azul_petroleo', 'azul-petróleo', '#2f5d68'), tinta('azul_ceu', 'azul-céu', '#b9d3e4'), tinta('azul_marinho', 'azul-marinho', '#24314f'),
      tinta('rosa_antigo', 'rosa-antigo', '#c99a97'), tinta('pessego', 'pêssego', '#efc2a2'), tinta('lilas', 'lilás', '#b8a6c9'),
      tinta('mostarda', 'amarelo-mostarda', '#cf9f3b'), tinta('bordo', 'bordô', '#6d2632'), tinta('grafite', 'grafite', '#45484c'),
      tinta('preto_fosco', 'preto fosco', '#232325', 3, 38),
      { id: 'cimento_parede', nome: 'cimento queimado na parede', nivel: 3, preco: 110, porM2: true, cor: '#a3a09b', desenho: 'cimento' },
      { id: 'tijolo', nome: 'tijolo aparente', nivel: 3, preco: 140, porM2: true, cor: '#a5583c', desenho: 'tijolo' },
      { id: 'tijolo_branco', nome: 'tijolo aparente pintado de branco', nivel: 3, preco: 150, porM2: true, cor: '#ebe6dd', desenho: 'tijolo' },
      { id: 'papel', nome: 'papel de parede estampado', nivel: 3, preco: 95, porM2: true, cor: '#b7a37d', desenho: 'papel_floral' },
      { id: 'papel_listras', nome: 'papel de parede listrado', nivel: 3, preco: 95, porM2: true, cor: '#e7dfcd', cor2: '#9fb2a3', desenho: 'papel_listras' },
      { id: 'papel_geometrico', nome: 'papel de parede geométrico', nivel: 3, preco: 110, porM2: true, cor: '#2d3a3f', cor2: '#c9a24f', desenho: 'papel_geometrico' },
      { id: 'azulejo_metro', nome: 'azulejo metrô branco', nivel: 3, preco: 160, porM2: true, cor: '#f2f1ec', desenho: 'azulejo' },
      { id: 'lambri', nome: 'lambri de madeira', nivel: 3, preco: 190, porM2: true, cor: '#b98a5a', desenho: 'lambri' },
      { id: 'ripado', nome: 'painel ripado de madeira', nivel: 4, preco: 330, porM2: true, cor: '#8a5d38', desenho: 'ripado' },
      { id: 'pedra', nome: 'pedra natural (canjiquinha)', nivel: 4, preco: 300, porM2: true, cor: '#b3a48c', desenho: 'pedra' },
      { id: 'papel_damasco', nome: 'papel de parede damasco', nivel: 4, preco: 240, porM2: true, cor: '#3d2a3a', cor2: '#a8865a', desenho: 'papel_damasco' },
      { id: 'boiserie', nome: 'boiserie (molduras)', nivel: 4, preco: 260, porM2: true, cor: '#e4dfd5', desenho: 'boiserie' },
      { id: 'boiserie_verde', nome: 'boiserie pintada de verde-inglês', nivel: 4, preco: 280, porM2: true, cor: '#3b5444', desenho: 'boiserie' },
      { id: 'marmore_parede', nome: 'mármore na parede', nivel: 5, preco: 820, porM2: true, cor: '#ece8e0', cor2: '#b0a796', desenho: 'marmore' },
      { id: 'tecido', nome: 'parede revestida de tecido', nivel: 5, preco: 680, porM2: true, cor: '#c9b79c', desenho: 'tecido' },
      { id: 'boiserie_ouro', nome: 'boiserie com folha de ouro', nivel: 6, preco: 1900, porM2: true, cor: '#efe8da', cor2: '#c8a24a', desenho: 'boiserie' }
    ]
  },
  luz: {
    nome: 'Iluminação',
    opcoes: [
      { id: 'simples', nome: 'lâmpada no teto', nivel: 1, preco: 0, desenho: 'teto' },
      { id: 'plafon', nome: 'plafon de LED', nivel: 1, preco: 180, desenho: 'plafon', regulavel: true },
      { id: 'quente', nome: 'luz quente, abajur e arandela', nivel: 2, preco: 450, desenho: 'abajur', regulavel: true },
      { id: 'arandelas', nome: 'arandelas nas paredes', nivel: 2, preco: 780, desenho: 'arandelas', regulavel: true },
      { id: 'pendentes', nome: 'pendentes sobre a mesa', nivel: 2, preco: 950, desenho: 'pendentes', regulavel: true },
      { id: 'trilho', nome: 'trilho com spots', nivel: 3, preco: 1400, desenho: 'trilho', regulavel: true },
      { id: 'fita_led', nome: 'fita de LED indireta', nivel: 3, preco: 1200, desenho: 'fita', regulavel: true },
      { id: 'planejada', nome: 'projeto de iluminação (sanca, pendentes)', nivel: 3, preco: 2600, desenho: 'sanca', regulavel: true },
      { id: 'destaque', nome: 'luz de destaque (quadros e nichos)', nivel: 3, preco: 2100, desenho: 'destaque', regulavel: true },
      { id: 'lustre', nome: 'lustre', nivel: 3, preco: 2400, desenho: 'lustre', regulavel: true },
      { id: 'automacao', nome: 'automação (cenas, controle pelo celular)', nivel: 4, preco: 6500, desenho: 'sanca', regulavel: true, manutencao: 25 },
      { id: 'lustre_cristal', nome: 'lustre de cristal', nivel: 5, preco: 18000, desenho: 'lustre_cristal', regulavel: true, manutencao: 15 },
      { id: 'luminotecnico', nome: 'projeto luminotécnico assinado', nivel: 5, preco: 26000, desenho: 'sanca', regulavel: true, manutencao: 30 },
      { id: 'lustre_assinado', nome: 'lustre de designer, peça numerada', nivel: 6, preco: 120000, desenho: 'lustre_cristal', regulavel: true, manutencao: 40 }
    ]
  },
  rodape: {
    nome: 'Rodapé e molduras',
    opcoes: [
      { id: 'simples', nome: 'rodapé simples', nivel: 1, preco: 0, desenho: 'simples' },
      { id: 'madeira', nome: 'rodapé de madeira', nivel: 2, preco: 70, porM2: true, desenho: 'madeira', cor: '#8a5d38' },
      { id: 'alto', nome: 'rodapé alto branco', nivel: 3, preco: 110, porM2: true, desenho: 'alto', cor: '#f4f2ec' },
      { id: 'moldura_teto', nome: 'rodapé alto e moldura de gesso no teto', nivel: 4, preco: 220, porM2: true, desenho: 'moldura', cor: '#f4f2ec' },
      { id: 'embutido', nome: 'rodapé embutido com luz', nivel: 4, preco: 260, porM2: true, desenho: 'led', cor: '#2a2a2a' }
    ]
  },
  cortina: {
    nome: 'Cortinas e persianas',
    opcoes: [
      { id: 'nenhuma', nome: 'sem cortina', nivel: 1, preco: 0, desenho: 'nenhuma' },
      { id: 'tecido', nome: 'cortina de tecido leve', nivel: 1, preco: 320, desenho: 'tecido', cor: '#efe7d6' },
      { id: 'persiana', nome: 'persiana horizontal', nivel: 2, preco: 450, desenho: 'persiana', cor: '#e8e6e0' },
      { id: 'rolo', nome: 'persiana rolô blackout', nivel: 2, preco: 520, desenho: 'rolo', cor: '#5d5f63' },
      { id: 'linho', nome: 'cortina de linho', nivel: 3, preco: 1100, desenho: 'tecido', cor: '#d8cbb3' },
      { id: 'romana', nome: 'persiana romana', nivel: 3, preco: 980, desenho: 'romana', cor: '#c9bba1' },
      { id: 'veludo', nome: 'cortina de veludo', nivel: 4, preco: 2400, desenho: 'tecido', cor: '#5b2333' },
      { id: 'motorizada', nome: 'cortina motorizada de linho', nivel: 5, preco: 7800, desenho: 'tecido', cor: '#e2d8c4', manutencao: 8 }
    ]
  }
};

/** 12.7 — os aspectos que se escolhem (os três de sempre e, desde o 12.7, rodapé e cortina). */
export const ASPECTOS_DO_COMODO: AspectoDoComodo[] = ['piso', 'parede', 'luz', 'rodape', 'cortina'];

/** 12.7 — a temperatura e a intensidade da luz (só nas luzes reguláveis). Ausente = a de fábrica. */
export const TEMPERATURAS_DA_LUZ = [{ id: 'quente', nome: 'quente (2700 K)', cor: '#ffcf7a' }, { id: 'neutra', nome: 'neutra (4000 K)', cor: '#fff3d6' }, { id: 'fria', nome: 'fria (6000 K)', cor: '#dceeff' }] as const;
export type TemperaturaDaLuz = (typeof TEMPERATURAS_DA_LUZ)[number]['id'];

export const opcaoDeAcabamento = (a: AspectoDoComodo, id: string | undefined): OpcaoDeAcabamento | undefined => ACABAMENTOS[a].opcoes.find(o => o.id === id);

/** O acabamento com que o imóvel vem, pelo padrão dele (a casa simples não vem com mármore; a mansão não vem com cerâmica). */
export function acabamentoDeOrigem(a: AspectoDoComodo, padrao: number): string {
  if (a === 'piso') return padrao >= 5 ? 'madeira' : padrao >= 3 ? 'porcelanato' : 'ceramica';
  if (a === 'parede') return 'branco';
  if (a === 'rodape') return 'simples';
  if (a === 'cortina') return 'nenhuma';
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
// 12.7 — a casa inteira: cada coisa nova com o cômodo dela (e para onde vai quando ele não existe ainda).
Object.assign(COMODO_DA_COISA, {
  sofa_retratil: ['sala'], sofa_couro: ['sala'], sofa_designer: ['sala'], poltrona_designer: ['sala', 'biblioteca', 'escritorio'], mesa_centro: ['sala'], mesa_centro_marmore: ['sala'],
  mesa_lateral: ['sala', 'quarto'], estante_sala: ['sala'], aparador: ['sala'], tv_oled: ['sala', 'cinema'], home_theater: ['cinema', 'sala'], tapete: ['sala'], tapete_persa: ['sala'],
  quadros: ['sala'], objetos_decor: ['sala'], lareira: ['sala'],
  geladeira: ['cozinha'], geladeira_inox: ['cozinha'], freezer: ['cozinha', 'garagem'], adega: ['cozinha', 'sala'], fogao: ['cozinha'], cooktop_forno: ['cozinha'], fogao_profissional: ['cozinha'],
  microondas: ['cozinha'], cafeteira: ['cozinha'], louca_talheres: ['cozinha'], ilha_cozinha: ['cozinha'], armarios_planejados: ['cozinha'],
  cama_box: ['quarto'], cama_king: ['quarto'], colchao_hotel: ['quarto'], guarda_roupa: ['quarto'], closet: ['quarto'], penteadeira: ['quarto'], criado_mudo: ['quarto'], espelho_chao: ['quarto'], comoda: ['quarto_extra', 'quarto'],
  cama_solteiro: ['quarto_extra', 'quarto'], sofa_cama: ['quarto_extra', 'escritorio', 'sala'], beliche: ['quarto_extra', 'quarto'],
  banheira: ['banheiro'], banheira_pedra: ['banheiro'], ducha: ['banheiro'], gabinete: ['banheiro'], bancada_marmore: ['banheiro'], espelho_led: ['banheiro'], toalheiro: ['banheiro'], toalhas: ['banheiro'], sauna: ['academia', 'banheiro'],
  espreguicadeira: ['piscina', 'jardim', 'lazer'], espreguicadeira_teca: ['piscina', 'jardim', 'lazer'], guarda_sol: ['piscina', 'jardim', 'lazer'], ombrelone: ['piscina', 'jardim', 'lazer'],
  mesa_externa: ['lazer', 'jardim', 'piscina'], sofa_externo: ['lazer', 'piscina', 'jardim'], boias: ['piscina'], luz_piscina: ['piscina'], aquecedor_piscina: ['piscina'], capa_piscina: ['piscina'], cascata: ['piscina'], kit_piscina: ['piscina', 'garagem'],
  churrasqueira: ['lazer', 'jardim'], espaco_gourmet: ['lazer', 'jardim'], forno_pizza: ['lazer', 'jardim'], pergolado: ['jardim', 'lazer'], gazebo: ['jardim', 'lazer'], fonte: ['jardim'], escultura_jardim: ['jardim'],
  plantas: ['jardim', 'sala'], vasos_grandes: ['jardim', 'sala'], luz_jardim: ['jardim'], playground: ['jardim', 'lazer'], cama_elastica: ['jardim', 'lazer'],
  bilhar_profissional: ['jogos', 'sala'], pebolim: ['jogos', 'garagem'], pingue_pongue: ['jogos', 'garagem'], mesa_jogos: ['jogos', 'sala'], fliperama: ['jogos', 'sala'], poltronas_cinema: ['cinema', 'sala'],
  bicicleta_ergometrica: ['academia', 'quarto'], remo_seco: ['academia', 'sala'], saco_pancada: ['academia', 'garagem'],
  ferramentas: ['garagem', 'cozinha'], bancada_ferramentas: ['garagem'], armario_garagem: ['garagem'], organizadores: ['garagem', 'quarto_extra'], carregador_ev: ['garagem'], lavadora_pressao: ['garagem'],
  mesa_executiva: ['escritorio', 'sala'], cadeira_ergonomica: ['escritorio', 'quarto'], monitores: ['escritorio', 'quarto'], impressora: ['escritorio', 'quarto'], estante_escritorio: ['escritorio', 'sala']
} satisfies Record<string, TipoComodo[]>);

/** Coisas grandes (pesam numa mudança, no frete entre casas, no depósito); as pequenas vão na mala. */
export const COISAS_GRANDES = new Set(['sofa_retratil', 'sofa_couro', 'sofa_designer', 'poltrona_designer', 'estante_sala', 'aparador', 'tv_oled', 'geladeira', 'geladeira_inox', 'freezer', 'adega', 'fogao', 'cooktop_forno', 'fogao_profissional', 'ilha_cozinha', 'cama_box', 'cama_king', 'colchao_hotel', 'guarda_roupa', 'comoda', 'cama_solteiro', 'sofa_cama', 'beliche', 'espreguicadeira_teca', 'sofa_externo', 'mesa_externa', 'bilhar_profissional', 'pebolim', 'pingue_pongue', 'mesa_jogos', 'fliperama', 'poltronas_cinema', 'bicicleta_ergometrica', 'remo_seco', 'bancada_ferramentas', 'armario_garagem', 'mesa_executiva', 'penteadeira', 'tv', 'sofa', 'mesa_jantar', 'maquina_lavar', 'lava_loucas', 'colchao', 'esteira', 'piano', 'bateria', 'mesa_sinuca', 'estacao_musculacao', 'torno_ceramica', 'escrivaninha', 'ar_condicionado', 'cozinha_equipada', 'poltrona', 'projetor', 'som_hifi']);

/** O depósito alugado (self storage), por mês, na cidade de custo 1,0: o boxe pequeno e o espaço por coisa grande. */
export const DEPOSITO = { base: 180, porGrande: 45 };
/** O cofre do banco, por ano (só o que é pequeno: joia, relógio, a peça de coleção que cabe numa caixa). */
export const COFRE_ANUAL = 900;
/** A vaga alugada (carro além das vagas da casa), por mês, na cidade de custo 1,0. */
export const VAGA_MENSAL = 260;
