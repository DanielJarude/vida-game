/**
 * HOTFIX 11.5.1 — AS TATUAGENS: o que se tatua (o desenho, o estilo, o tamanho, se é colorida) e onde.
 *
 * VIDA 12.6 — O CORPO INTEIRO, REGIÃO POR REGIÃO. O corpo deixa de ser dez "partes" com uma capacidade e passa a ser
 * um mapa de REGIÕES precisas (ombro, bíceps, tríceps, antebraço por dentro e por fora, pulso, mão, dedos; peitoral,
 * centro do peito, costelas, abdômen, as três faixas das costas; coxa, joelho, canela, panturrilha, tornozelo, pé;
 * pescoço e nuca), cada uma com o seu lado, a sua face (de frente, de costas) e o seu tamanho em unidades da figura (as
 * mesmas da `ui/avatar/Figura`, num adulto mediano). Cada tatuagem é um registro próprio, com a região, a posição dentro
 * dela, a escala, a rotação, o espelhamento, a cor e a intensidade: várias no mesmo braço, desde que não fiquem uma por
 * cima da outra — e o motor confere isso pela geometria, não por uma contagem.
 *
 * As SUPERFÍCIES (o braço inteiro, as costas inteiras, o peito inteiro, a perna inteira) são regiões que cobrem outras:
 * a peça única gigante (o dragão nas costas) ocupa a superfície; a COMPOSIÇÃO (a manga fechada feita de vários desenhos
 * com um fundo que os une) é um conjunto de tatuagens independentes, uma por região (`sistemas/tatuagens.compor`).
 *
 * As referências são as do estúdio de verdade, reinterpretadas no traço do VIDA: o contorno grosso e a cor chapada do
 * old school, o preto sólido do blackwork, o sombreado em cinza do realismo, a gravura do oriental (a onda, a carpa, a
 * cerejeira, a máscara hannya), a agulha única do fine line, a simetria da geometria sagrada, a caligrafia do lettering,
 * a renda e o pingente do ornamental, a mancha da aquarela no abstrato.
 */

import { DESENHOS_129, NOME_ESTILO_129, type EstiloDeTatuagem129, type TemaDeTatuagem } from './tatuagens129';
import { DESENHOS_13 } from './tatuagens13';

export type EstiloDeTatuagem =
  | EstiloDeTatuagem129 | 'realista' | 'tradicional' | 'blackwork' | 'tribal' | 'geometrica' | 'oriental' | 'minimalista' | 'fine_line'
  | 'lettering' | 'ornamental' | 'floral' | 'simbolica' | 'abstrata' | 'composicao';
/** A parte grande do corpo (a lupa do estúdio enquadra por ela; os saves antigos guardavam só ela). */
export type LocalDeTatuagem = 'braco' | 'antebraco' | 'ombro' | 'mao' | 'peito' | 'costas' | 'abdomen' | 'pescoco' | 'coxa' | 'panturrilha' | 'rosto';
export type Lado = 'e' | 'd';

export type RegiaoDeTatuagem =
  | 'ombro' | 'biceps' | 'triceps' | 'antebraco' | 'antebraco_externo' | 'pulso' | 'mao' | 'dedos'
  | 'pescoco' | 'nuca'
  // VIDA 17: o rosto (desenhado no próprio retrato — que também é a cabeça da figura de corpo inteiro).
  | 'testa' | 'tempora' | 'sobrancelha_t' | 'sob_olho' | 'bochecha' | 'nariz' | 'queixo'
  | 'peitoral' | 'centro_peito' | 'costelas' | 'abdomen' | 'costas_alta' | 'costas_media' | 'costas_baixa'
  | 'coxa' | 'joelho' | 'canela' | 'panturrilha' | 'tornozelo' | 'pe'
  // As superfícies: a peça única que fecha a parte inteira.
  | 'manga' | 'costas_inteiras' | 'peito_inteiro' | 'perna_inteira';

export const NOME_ESTILO: Record<EstiloDeTatuagem, string> = {
  realista: 'Realista', tradicional: 'Old school', blackwork: 'Blackwork', tribal: 'Tribal', geometrica: 'Geométrica',
  oriental: 'Oriental', minimalista: 'Minimalista', fine_line: 'Fine line', lettering: 'Lettering', ornamental: 'Ornamental',
  floral: 'Floral', simbolica: 'Simbólica', abstrata: 'Abstrata', ...NOME_ESTILO_129, composicao: 'Peças inteiras'
};

/** 1 pequena · 2 média · 3 grande · 4 a peça que fecha a superfície. */
export type TamanhoDeTatuagem = 1 | 2 | 3 | 4;
/** O lado maior do desenho, em unidades da figura (um adulto mediano tem ~8 de largura de braço). */
export const MEDIDA: Record<TamanhoDeTatuagem, number> = { 1: 5, 2: 9, 3: 14, 4: 0 };
export const NOME_TAMANHO: Record<TamanhoDeTatuagem, string> = { 1: 'pequena', 2: 'média', 3: 'grande', 4: 'peça inteira' };

export type GrupoDoCorpo = 'bracos' | 'tronco' | 'pernas' | 'cabeca';
export const NOME_GRUPO: Record<GrupoDoCorpo, string> = { bracos: 'Braços e mãos', tronco: 'Tronco e costas', pernas: 'Pernas e pés', cabeca: 'Pescoço e nuca' };

export interface RegiaoDoCorpo {
  nome: string;
  /** Feminino (a costela, a nuca...) e plural (as costas) — para "no/na/nos/nas" e "esquerdo/esquerda". */
  fem?: boolean;
  plural?: boolean;
  grupo: GrupoDoCorpo;
  lados: boolean;
  /** Onde aparece na figura de corpo inteiro. */
  frente: boolean;
  costas: boolean;
  /** O espaço tatuável, em unidades da figura: a largura que se vê (nos membros, o desenho dá a volta um pouco) e a altura. */
  w: number;
  h: number;
  /** O maior tamanho que a região comporta. */
  maximo: TamanhoDeTatuagem;
  /** A parte grande (a lupa e os saves antigos). */
  parte: LocalDeTatuagem;
  /** Dói mais (perto do osso, pele fina): o estúdio cobra um pouco mais. */
  sensivel?: boolean;
  /** Sempre à vista (mãos, dedos, pescoço): a tatuagem aparece com qualquer roupa. */
  visivel?: boolean;
  /** As superfícies cobrem as regiões de baixo: ocupar uma ocupa as outras. */
  cobre?: RegiaoDeTatuagem[];
  /** VIDA 17: a escala do "pequeno" na região (o rosto pede desenhos menores: a lágrima no canto do olho). */
  micro?: number;
}

export const REGIOES: Record<RegiaoDeTatuagem, RegiaoDoCorpo> = {
  ombro: { nome: 'ombro', grupo: 'bracos', lados: true, frente: true, costas: true, w: 12, h: 10, maximo: 2, parte: 'ombro' },
  biceps: { nome: 'bíceps', grupo: 'bracos', lados: true, frente: true, costas: false, w: 15, h: 26, maximo: 3, parte: 'braco' },
  triceps: { nome: 'tríceps', grupo: 'bracos', lados: true, frente: false, costas: true, w: 15, h: 26, maximo: 3, parte: 'braco' },
  antebraco: { nome: 'antebraço', grupo: 'bracos', lados: true, frente: true, costas: false, w: 11, h: 24, maximo: 2, parte: 'antebraco' },
  antebraco_externo: { nome: 'antebraço (por fora)', grupo: 'bracos', lados: true, frente: false, costas: true, w: 11, h: 24, maximo: 2, parte: 'antebraco' },
  pulso: { nome: 'pulso', grupo: 'bracos', lados: true, frente: true, costas: false, w: 8, h: 5.5, maximo: 1, parte: 'antebraco', sensivel: true, visivel: true },
  mao: { nome: 'mão', fem: true, grupo: 'bracos', lados: true, frente: true, costas: false, w: 6.4, h: 6.5, maximo: 1, parte: 'mao', sensivel: true, visivel: true },
  dedos: { nome: 'dedos', plural: true, grupo: 'bracos', lados: true, frente: true, costas: false, w: 7, h: 5, maximo: 1, parte: 'mao', sensivel: true, visivel: true },
  pescoco: { nome: 'pescoço', grupo: 'cabeca', lados: true, frente: true, costas: false, w: 6, h: 9, maximo: 1, parte: 'pescoco', sensivel: true, visivel: true },
  nuca: { nome: 'nuca', fem: true, grupo: 'cabeca', lados: false, frente: false, costas: true, w: 10, h: 8, maximo: 1, parte: 'pescoco', sensivel: true },
  // VIDA 17 · o rosto: regiões pequenas (unidades do retrato), sempre à vista, doloridas — e o retrato as desenha no lugar.
  testa: { nome: 'testa', fem: true, grupo: 'cabeca', lados: false, frente: true, costas: false, w: 16, h: 7, maximo: 1, parte: 'rosto', sensivel: true, visivel: true, micro: 0.9 },
  tempora: { nome: 'têmpora', fem: true, grupo: 'cabeca', lados: true, frente: true, costas: false, w: 5.5, h: 8, maximo: 1, parte: 'rosto', sensivel: true, visivel: true, micro: 0.75 },
  sobrancelha_t: { nome: 'canto da sobrancelha', grupo: 'cabeca', lados: true, frente: true, costas: false, w: 4.5, h: 3.2, maximo: 1, parte: 'rosto', sensivel: true, visivel: true, micro: 0.5 },
  sob_olho: { nome: 'canto do olho', grupo: 'cabeca', lados: true, frente: true, costas: false, w: 4, h: 4, maximo: 1, parte: 'rosto', sensivel: true, visivel: true, micro: 0.5 },
  bochecha: { nome: 'bochecha', fem: true, grupo: 'cabeca', lados: true, frente: true, costas: false, w: 7, h: 7, maximo: 1, parte: 'rosto', sensivel: true, visivel: true, micro: 0.8 },
  nariz: { nome: 'nariz', grupo: 'cabeca', lados: false, frente: true, costas: false, w: 3.6, h: 6, maximo: 1, parte: 'rosto', sensivel: true, visivel: true, micro: 0.55 },
  queixo: { nome: 'queixo', grupo: 'cabeca', lados: false, frente: true, costas: false, w: 9, h: 4.5, maximo: 1, parte: 'rosto', sensivel: true, visivel: true, micro: 0.7 },
  peitoral: { nome: 'peitoral', grupo: 'tronco', lados: true, frente: true, costas: false, w: 17, h: 15, maximo: 3, parte: 'peito' },
  centro_peito: { nome: 'centro do peito', grupo: 'tronco', lados: false, frente: true, costas: false, w: 9, h: 20, maximo: 2, parte: 'peito', sensivel: true },
  costelas: { nome: 'costela', fem: true, grupo: 'tronco', lados: true, frente: true, costas: false, w: 14, h: 22, maximo: 3, parte: 'abdomen', sensivel: true },
  abdomen: { nome: 'abdômen', grupo: 'tronco', lados: false, frente: true, costas: false, w: 24, h: 20, maximo: 3, parte: 'abdomen' },
  costas_alta: { nome: 'parte alta das costas', fem: true, grupo: 'tronco', lados: false, frente: false, costas: true, w: 36, h: 17, maximo: 3, parte: 'costas' },
  costas_media: { nome: 'meio das costas', grupo: 'tronco', lados: false, frente: false, costas: true, w: 30, h: 17, maximo: 3, parte: 'costas' },
  costas_baixa: { nome: 'lombar', fem: true, grupo: 'tronco', lados: false, frente: false, costas: true, w: 28, h: 12, maximo: 2, parte: 'costas', sensivel: true },
  coxa: { nome: 'coxa', fem: true, grupo: 'pernas', lados: true, frente: true, costas: false, w: 20, h: 32, maximo: 3, parte: 'coxa' },
  joelho: { nome: 'joelho', grupo: 'pernas', lados: true, frente: true, costas: false, w: 12, h: 10, maximo: 2, parte: 'panturrilha', sensivel: true },
  canela: { nome: 'canela', fem: true, grupo: 'pernas', lados: true, frente: true, costas: false, w: 10, h: 28, maximo: 2, parte: 'panturrilha', sensivel: true },
  panturrilha: { nome: 'panturrilha', fem: true, grupo: 'pernas', lados: true, frente: false, costas: true, w: 15, h: 28, maximo: 3, parte: 'panturrilha' },
  tornozelo: { nome: 'tornozelo', grupo: 'pernas', lados: true, frente: true, costas: false, w: 7, h: 5, maximo: 1, parte: 'panturrilha', sensivel: true },
  pe: { nome: 'pé', grupo: 'pernas', lados: true, frente: true, costas: false, w: 7, h: 6, maximo: 1, parte: 'panturrilha', sensivel: true },
  manga: { nome: 'braço inteiro', grupo: 'bracos', lados: true, frente: true, costas: true, w: 12, h: 68, maximo: 4, parte: 'braco', cobre: ['ombro', 'biceps', 'triceps', 'antebraco', 'antebraco_externo', 'pulso'] },
  costas_inteiras: { nome: 'costas inteiras', fem: true, plural: true, grupo: 'tronco', lados: false, frente: false, costas: true, w: 36, h: 48, maximo: 4, parte: 'costas', cobre: ['costas_alta', 'costas_media', 'costas_baixa'] },
  peito_inteiro: { nome: 'peito inteiro', grupo: 'tronco', lados: false, frente: true, costas: false, w: 40, h: 18, maximo: 4, parte: 'peito', cobre: ['peitoral', 'centro_peito'] },
  perna_inteira: { nome: 'perna inteira', fem: true, grupo: 'pernas', lados: true, frente: true, costas: true, w: 16, h: 84, maximo: 4, parte: 'coxa', cobre: ['coxa', 'joelho', 'canela', 'panturrilha', 'tornozelo'] }
};
export const ORDEM_DAS_REGIOES = Object.keys(REGIOES) as RegiaoDeTatuagem[];
/** As regiões de verdade (sem as superfícies), na ordem de cima para baixo. */
export const REGIOES_SIMPLES = ORDEM_DAS_REGIOES.filter(r => !REGIOES[r].cobre);
export const SUPERFICIES = ORDEM_DAS_REGIOES.filter(r => !!REGIOES[r].cobre);

/** As regiões que uma região ocupa de fato (a superfície ocupa as de baixo; a região simples, a si mesma). */
export const regioesCobertas = (r: RegiaoDeTatuagem): RegiaoDeTatuagem[] => REGIOES[r].cobre ?? [r];
/** As superfícies que contêm a região. */
export const superficiesDe = (r: RegiaoDeTatuagem): RegiaoDeTatuagem[] => SUPERFICIES.filter(s => REGIOES[s].cobre!.includes(r));

/** Se o texto do desenho é escrito pelo jogador (o nome, a data, a frase, as iniciais). */
export type TextoDaTatuagem = 'nome' | 'data' | 'frase' | 'iniciais' | 'coordenadas';

export interface DesenhoDeTatuagem {
  id: string;
  nome: string;
  estilo: EstiloDeTatuagem;
  /** O tamanho em que o estúdio desenha (o jogador escolhe dentro de `tamanhos`). */
  tamanho: TamanhoDeTatuagem;
  /** Os tamanhos possíveis desse desenho (o mesmo traço não fica bom em qualquer escala). */
  tamanhos: TamanhoDeTatuagem[];
  /** Leva cor (pode ser feita em preto, em cinza ou colorida); sem isso, é traço (a tinta pode ter tom). */
  colorida?: boolean;
  /** Largura ÷ altura do desenho (a frase é larga; a serpente, alta). 1 = quadrado. */
  proporcao?: number;
  /** A faixa que dá a volta no membro (braçadeira): ocupa a largura inteira. */
  faixa?: boolean;
  /** Onde o desenho faz sentido (vazio = onde o tamanho couber). */
  regioes?: RegiaoDeTatuagem[];
  /** O texto que o jogador escreve. */
  texto?: TextoDaTatuagem;
  descricao: string;
  /** VIDA 12.9: a obra de ficção que o desenho lembra (cultura pop) e o tema (bichos, natureza). */
  referencia?: string;
  tema?: TemaDeTatuagem;
}

const FAIXA: RegiaoDeTatuagem[] = ['biceps', 'antebraco', 'coxa', 'panturrilha', 'canela', 'pulso', 'tornozelo'];
const T = (...xs: TamanhoDeTatuagem[]) => xs;

export const DESENHOS: readonly DesenhoDeTatuagem[] = [
  // Realista: sombreado em cinza, volume, luz.
  { id: 'leao_realista', nome: 'Leão', estilo: 'realista', tamanho: 3, tamanhos: T(2, 3), descricao: 'A cabeça do leão de frente, a juba em sombra e luz.' },
  { id: 'lobo_realista', nome: 'Lobo', estilo: 'realista', tamanho: 3, tamanhos: T(2, 3), descricao: 'O lobo de perfil, o pelo em degradê de cinza.' },
  { id: 'olho_realista', nome: 'Olho', estilo: 'realista', tamanho: 2, tamanhos: T(1, 2), proporcao: 1.6, descricao: 'Um olho com cílios e o brilho na íris.' },
  { id: 'relogio_rosa', nome: 'Relógio e rosa', estilo: 'realista', tamanho: 3, tamanhos: T(2, 3), descricao: 'O relógio de bolso parado numa hora, uma rosa em cinza.' },
  { id: 'rosa_realista', nome: 'Rosa sombreada', estilo: 'realista', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'A rosa em preto e cinza, pétala por pétala.' },
  { id: 'bussola', nome: 'Bússola', estilo: 'realista', tamanho: 2, tamanhos: T(2, 3), descricao: 'A rosa dos ventos dentro do metal da bússola.' },
  { id: 'caveira', nome: 'Caveira', estilo: 'realista', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'Sombreada em cinza, sem susto.' },
  { id: 'maos_rezando', nome: 'Mãos em prece', estilo: 'realista', tamanho: 2, tamanhos: T(2, 3), proporcao: 0.8, descricao: 'As mãos juntas, com um terço caindo.' },
  // Old school (tradicional americano): contorno grosso, cor chapada.
  { id: 'andorinha', nome: 'Andorinha', estilo: 'tradicional', tamanho: 2, tamanhos: T(1, 2), colorida: true, descricao: 'A do marinheiro: a volta para casa.' },
  { id: 'ancora', nome: 'Âncora', estilo: 'tradicional', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'Firmeza, o porto, o mar.' },
  { id: 'rosa_tradicional', nome: 'Rosa tradicional', estilo: 'tradicional', tamanho: 2, tamanhos: T(1, 2, 3), colorida: true, descricao: 'Vermelha, com duas folhas, contorno grosso.' },
  { id: 'coracao_faixa', nome: 'Coração com faixa', estilo: 'tradicional', tamanho: 2, tamanhos: T(2, 3), colorida: true, texto: 'nome', descricao: 'Com um nome escrito na faixa.' },
  { id: 'adaga', nome: 'Adaga', estilo: 'tradicional', tamanho: 2, tamanhos: T(1, 2, 3), proporcao: 0.55, descricao: 'A lâmina atravessando, o cabo trabalhado.' },
  { id: 'pantera', nome: 'Pantera', estilo: 'tradicional', tamanho: 3, tamanhos: T(2, 3), descricao: 'A cabeça da pantera rugindo, em preto chapado.' },
  { id: 'navio', nome: 'Navio', estilo: 'tradicional', tamanho: 3, tamanhos: T(2, 3), colorida: true, descricao: 'O veleiro nas ondas, as velas cheias.' },
  { id: 'cobra_tradicional', nome: 'Serpente', estilo: 'tradicional', tamanho: 2, tamanhos: T(2, 3), colorida: true, proporcao: 0.6, descricao: 'Enrolada, a boca aberta, verde e amarela.' },
  { id: 'aguia_tradicional', nome: 'Águia', estilo: 'tradicional', tamanho: 3, tamanhos: T(2, 3), colorida: true, proporcao: 1.4, descricao: 'A águia de asas abertas, garras à mostra.' },
  // Blackwork: preto sólido, espaço negativo.
  { id: 'fases_da_lua', nome: 'Fases da lua', estilo: 'blackwork', tamanho: 2, tamanhos: T(1, 2), proporcao: 3, descricao: 'Cinco luas lado a lado, da nova à cheia.' },
  { id: 'faixa_solida', nome: 'Braçadeira sólida', estilo: 'blackwork', tamanho: 2, tamanhos: T(1, 2), proporcao: 3, faixa: true, regioes: FAIXA, descricao: 'Uma faixa preta inteira em volta do membro.' },
  { id: 'floresta', nome: 'Floresta', estilo: 'blackwork', tamanho: 2, tamanhos: T(2, 3), proporcao: 2.4, faixa: true, regioes: FAIXA, descricao: 'Os pinheiros em silhueta dando a volta.' },
  { id: 'serpente_negra', nome: 'Serpente negra', estilo: 'blackwork', tamanho: 2, tamanhos: T(2, 3), proporcao: 0.45, descricao: 'A cobra descendo, escamas em espaço negativo.' },
  { id: 'corvo', nome: 'Corvo', estilo: 'blackwork', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'O corvo pousado, preto chapado.' },
  { id: 'montanha', nome: 'Montanhas', estilo: 'blackwork', tamanho: 2, tamanhos: T(1, 2), descricao: 'Picos, um sol, o traço de gravura.' },
  // Tribal.
  { id: 'tribal_polinesio', nome: 'Tribal polinésio', estilo: 'tribal', tamanho: 3, tamanhos: T(2, 3), descricao: 'Blocos pretos, ondas e dentes de tubarão.' },
  { id: 'tribal_faixa', nome: 'Faixa tribal', estilo: 'tribal', tamanho: 2, tamanhos: T(1, 2), proporcao: 2.5, faixa: true, regioes: FAIXA, descricao: 'As pontas curvas, em preto.' },
  { id: 'maori_espiral', nome: 'Espiral maori', estilo: 'tribal', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'Espirais que se abrem (koru), linhas paralelas.' },
  { id: 'sol_tribal', nome: 'Sol tribal', estilo: 'tribal', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'Raios pontudos em volta de um círculo.' },
  // Geométrica.
  { id: 'mandala', nome: 'Mandala', estilo: 'geometrica', tamanho: 3, tamanhos: T(2, 3), descricao: 'Pétalas em anéis, pontilhismo no centro.' },
  { id: 'triangulos', nome: 'Triângulos', estilo: 'geometrica', tamanho: 2, tamanhos: T(1, 2), descricao: 'Formas sobrepostas, linha e preenchimento.' },
  { id: 'bracadeira', nome: 'Braçadeira geométrica', estilo: 'geometrica', tamanho: 2, tamanhos: T(1, 2), proporcao: 2.5, faixa: true, regioes: FAIXA, descricao: 'Uma faixa em volta: losangos e linhas.' },
  { id: 'flor_da_vida', nome: 'Flor da vida', estilo: 'geometrica', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'Círculos que se cruzam em pétalas.' },
  { id: 'lobo_geometrico', nome: 'Lobo geométrico', estilo: 'geometrica', tamanho: 3, tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A cabeça do lobo em facetas de linha.' },
  { id: 'hexagonos', nome: 'Colmeia', estilo: 'geometrica', tamanho: 2, tamanhos: T(1, 2), descricao: 'Hexágonos, alguns cheios, que se desfazem.' },
  // Oriental (japonês).
  { id: 'onda', nome: 'A grande onda', estilo: 'oriental', tamanho: 2, tamanhos: T(2, 3), colorida: true, descricao: 'A onda de gravura japonesa, espuma em garras.' },
  { id: 'carpa', nome: 'Carpa koi', estilo: 'oriental', tamanho: 3, tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'A carpa subindo a correnteza, laranja e preta.' },
  { id: 'cerejeira', nome: 'Flor de cerejeira', estilo: 'oriental', tamanho: 2, tamanhos: T(1, 2, 3), colorida: true, descricao: 'O galho escuro com as flores rosadas.' },
  { id: 'hannya', nome: 'Máscara hannya', estilo: 'oriental', tamanho: 2, tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'Os chifres, os olhos de ouro, a boca aberta.' },
  { id: 'dragao_oriental', nome: 'Dragão oriental', estilo: 'oriental', tamanho: 3, tamanhos: T(2, 3), colorida: true, proporcao: 0.6, descricao: 'O dragão serpenteando entre nuvens.' },
  { id: 'tigre', nome: 'Tigre', estilo: 'oriental', tamanho: 3, tamanhos: T(2, 3), colorida: true, descricao: 'O tigre saltando, listras pretas no laranja.' },
  { id: 'nuvens', nome: 'Nuvens orientais', estilo: 'oriental', tamanho: 2, tamanhos: T(1, 2), proporcao: 1.8, descricao: 'As nuvens em espiral da gravura.' },
  // Minimalista.
  { id: 'aviao_papel', nome: 'Aviãozinho de papel', estilo: 'minimalista', tamanho: 1, tamanhos: T(1), descricao: 'Dobrado, com a linha tracejada do voo.' },
  { id: 'onda_mini', nome: 'Onda pequena', estilo: 'minimalista', tamanho: 1, tamanhos: T(1), proporcao: 1.6, descricao: 'Três curvas e o sol.' },
  { id: 'triangulo_mini', nome: 'Triângulo', estilo: 'minimalista', tamanho: 1, tamanhos: T(1), descricao: 'Um triângulo vazado, nada mais.' },
  { id: 'pontos', nome: 'Três pontos', estilo: 'minimalista', tamanho: 1, tamanhos: T(1), proporcao: 2.4, descricao: 'Três pontos em linha.' },
  { id: 'montanha_mini', nome: 'Montanha mínima', estilo: 'minimalista', tamanho: 1, tamanhos: T(1), proporcao: 1.6, descricao: 'Dois picos num traço.' },
  { id: 'gato_linha', nome: 'Gatinho', estilo: 'minimalista', tamanho: 1, tamanhos: T(1), descricao: 'O contorno de um gato sentado.' },
  // Fine line.
  { id: 'ramo_fino', nome: 'Ramo fino', estilo: 'fine_line', tamanho: 1, tamanhos: T(1, 2), descricao: 'Um galho de folhas, traço de agulha única.' },
  { id: 'lua_estrelas', nome: 'Lua e estrelas', estilo: 'fine_line', tamanho: 1, tamanhos: T(1, 2), descricao: 'Crescente e três pontos de luz.' },
  { id: 'linha_continua', nome: 'Rosto em linha contínua', estilo: 'fine_line', tamanho: 2, tamanhos: T(1, 2), proporcao: 0.8, descricao: 'Um perfil num traço só, sem tirar a agulha.' },
  { id: 'coracaozinho', nome: 'Coraçãozinho', estilo: 'fine_line', tamanho: 1, tamanhos: T(1), descricao: 'Pequeno, discreto, para lembrar de alguém.' },
  { id: 'borboleta', nome: 'Borboleta', estilo: 'fine_line', tamanho: 1, tamanhos: T(1, 2), descricao: 'As asas abertas em traço fino.' },
  { id: 'constelacao', nome: 'Constelação', estilo: 'fine_line', tamanho: 1, tamanhos: T(1, 2), descricao: 'Pontos ligados por linhas, um signo no céu.' },
  { id: 'flor_fina', nome: 'Flor de haste longa', estilo: 'fine_line', tamanho: 2, tamanhos: T(1, 2), proporcao: 0.4, descricao: 'Uma flor só, a haste comprida.' },
  { id: 'beija_flor', nome: 'Beija-flor', estilo: 'fine_line', tamanho: 1, tamanhos: T(1, 2), colorida: true, descricao: 'Parado no ar, as asas em traço.' },
  // Lettering: o texto é do jogador.
  { id: 'nome_cursivo', nome: 'Nome em letra cursiva', estilo: 'lettering', tamanho: 1, tamanhos: T(1, 2), proporcao: 2.6, texto: 'nome', descricao: 'Um nome, uma palavra, em caligrafia.' },
  { id: 'data_romana', nome: 'Data em romanos', estilo: 'lettering', tamanho: 1, tamanhos: T(1, 2), proporcao: 3, texto: 'data', descricao: 'A data que importa, em algarismos romanos.' },
  { id: 'frase', nome: 'Frase', estilo: 'lettering', tamanho: 2, tamanhos: T(1, 2), proporcao: 2.4, texto: 'frase', descricao: 'Uma frase que ficou, em letra de máquina.' },
  { id: 'palavra_gotica', nome: 'Palavra em letra pesada', estilo: 'lettering', tamanho: 2, tamanhos: T(1, 2, 3), proporcao: 2.8, texto: 'frase', descricao: 'Letras serifadas, pretas e cheias, como de capa de disco.' },
  { id: 'iniciais', nome: 'Iniciais', estilo: 'lettering', tamanho: 1, tamanhos: T(1), proporcao: 1.6, texto: 'iniciais', descricao: 'Duas ou três letras, com um ponto entre elas.' },
  { id: 'coordenadas', nome: 'Coordenadas', estilo: 'lettering', tamanho: 1, tamanhos: T(1, 2), proporcao: 3.2, texto: 'coordenadas', descricao: 'Latitude e longitude de um lugar.' },
  // Ornamental.
  { id: 'lustre', nome: 'Pingente ornamental', estilo: 'ornamental', tamanho: 2, tamanhos: T(2, 3), proporcao: 0.6, descricao: 'Contas, gotas e arabescos que descem (o do esterno).' },
  { id: 'filigrana', nome: 'Filigrana', estilo: 'ornamental', tamanho: 2, tamanhos: T(1, 2), proporcao: 2.6, faixa: true, regioes: FAIXA, descricao: 'Arabescos em volta, como joia.' },
  { id: 'renda', nome: 'Renda', estilo: 'ornamental', tamanho: 2, tamanhos: T(1, 2), proporcao: 2.6, faixa: true, regioes: FAIXA, descricao: 'A barra de renda, pontilhada e com festões.' },
  { id: 'medalhao', nome: 'Medalhão', estilo: 'ornamental', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'Um círculo de pétalas e pontos, simétrico.' },
  // Floral.
  { id: 'peonia', nome: 'Peônia', estilo: 'floral', tamanho: 2, tamanhos: T(2, 3), colorida: true, descricao: 'Pétalas cheias, rosa e folhas verdes.' },
  { id: 'girassol', nome: 'Girassol', estilo: 'floral', tamanho: 2, tamanhos: T(1, 2, 3), colorida: true, descricao: 'O miolo marrom, as pétalas amarelas.' },
  { id: 'ramos', nome: 'Ramos de folhas', estilo: 'floral', tamanho: 2, tamanhos: T(1, 2), proporcao: 0.8, descricao: 'Folhas que acompanham a curva do corpo.' },
  { id: 'lirio', nome: 'Lírio', estilo: 'floral', tamanho: 2, tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'As pétalas abertas para trás, os estames.' },
  { id: 'lavanda', nome: 'Raminhos de lavanda', estilo: 'floral', tamanho: 1, tamanhos: T(1, 2), colorida: true, proporcao: 0.5, descricao: 'Três hastes com as flores em espiga.' },
  { id: 'buque', nome: 'Buquê', estilo: 'floral', tamanho: 3, tamanhos: T(2, 3), colorida: true, descricao: 'Rosas, folhas e botões amarrados.' },
  // Simbólica.
  { id: 'simbolo_infinito', nome: 'Infinito', estilo: 'simbolica', tamanho: 1, tamanhos: T(1), proporcao: 1.8, descricao: 'O oito deitado.' },
  { id: 'ponto_e_virgula', nome: 'Ponto e vírgula', estilo: 'simbolica', tamanho: 1, tamanhos: T(1), proporcao: 0.6, descricao: 'A frase que continua.' },
  { id: 'arvore_da_vida', nome: 'Árvore da vida', estilo: 'simbolica', tamanho: 2, tamanhos: T(1, 2, 3), descricao: 'A copa e as raízes dentro de um círculo.' },
  { id: 'olho_de_horus', nome: 'Olho de Hórus', estilo: 'simbolica', tamanho: 1, tamanhos: T(1, 2), proporcao: 1.4, descricao: 'O olho egípcio, proteção.' },
  { id: 'lotus', nome: 'Flor de lótus', estilo: 'simbolica', tamanho: 1, tamanhos: T(1, 2), proporcao: 1.3, descricao: 'Que nasce na lama e abre limpa.' },
  { id: 'pegadas', nome: 'Pezinhos de bebê', estilo: 'simbolica', tamanho: 1, tamanhos: T(1), descricao: 'As duas pegadas de quando o filho nasceu.' },
  { id: 'batimento', nome: 'Batimento', estilo: 'simbolica', tamanho: 1, tamanhos: T(1, 2), proporcao: 3, descricao: 'A linha do coração, com um pico.' },
  { id: 'cruz', nome: 'Cruz', estilo: 'simbolica', tamanho: 1, tamanhos: T(1, 2), proporcao: 0.7, descricao: 'Simples, de traço firme.' },
  { id: 'yin_yang', nome: 'Yin-yang', estilo: 'simbolica', tamanho: 1, tamanhos: T(1, 2), descricao: 'As duas metades que se completam.' },
  // Abstrata.
  { id: 'aquarela', nome: 'Mancha de aquarela', estilo: 'abstrata', tamanho: 2, tamanhos: T(1, 2, 3), colorida: true, descricao: 'Tinta escorrida em cores, com respingos.' },
  { id: 'pinceladas', nome: 'Pinceladas', estilo: 'abstrata', tamanho: 2, tamanhos: T(1, 2), proporcao: 1.6, descricao: 'Três traços de pincel seco, em preto.' },
  { id: 'linhas_fluidas', nome: 'Linhas fluidas', estilo: 'abstrata', tamanho: 2, tamanhos: T(1, 2, 3), proporcao: 0.7, descricao: 'Curvas paralelas que seguem o corpo.' },
  { id: 'formas', nome: 'Formas orgânicas', estilo: 'abstrata', tamanho: 2, tamanhos: T(1, 2), colorida: true, descricao: 'Círculo, gota e linha, em cor chapada.' },
  // As peças inteiras (uma tatuagem só que fecha a superfície).
  { id: 'fechamento', nome: 'Fechamento de braço', estilo: 'composicao', tamanho: 4, tamanhos: T(4), colorida: true, regioes: ['manga'], descricao: 'Do ombro ao pulso: ondas, flores e nuvens, em sessões ao longo de meses.' },
  { id: 'dragao_costas', nome: 'Dragão nas costas', estilo: 'composicao', tamanho: 4, tamanhos: T(4), colorida: true, regioes: ['costas_inteiras'], descricao: 'O dragão ocupando as costas inteiras.' },
  { id: 'fenix_costas', nome: 'Fênix nas costas', estilo: 'composicao', tamanho: 4, tamanhos: T(4), colorida: true, regioes: ['costas_inteiras'], descricao: 'A fênix subindo, as asas de ombro a ombro.' },
  { id: 'aguia_peito', nome: 'Águia no peito', estilo: 'composicao', tamanho: 4, tamanhos: T(4), regioes: ['peito_inteiro'], descricao: 'As asas abertas de um ombro ao outro.' },
  { id: 'perna_floral', nome: 'Perna florida', estilo: 'composicao', tamanho: 4, tamanhos: T(4), colorida: true, proporcao: 0.3, regioes: ['perna_inteira'], descricao: 'Rosas e folhas subindo do tornozelo à coxa.' },
  ...DESENHOS_129,
  ...DESENHOS_13
];
const POR_ID = new Map(DESENHOS.map(d => [d.id, d]));
export const desenhoDeTatuagem = (id: string) => POR_ID.get(id);

/** O retângulo do desenho (largura e altura, já girado), nas unidades da região. */
export function medidaDoDesenho(d: DesenhoDeTatuagem, regiao: RegiaoDeTatuagem, tamanho: TamanhoDeTatuagem, escala = 1, rot = 0): { w: number; h: number } {
  const R = REGIOES[regiao];
  if (tamanho === 4) return { w: R.w, h: R.h };
  const s = MEDIDA[tamanho] * escala * (R.micro ?? 1);
  const p = d.proporcao ?? 1;
  if (d.faixa) return { w: R.w, h: Math.max(2.4, s / p) };
  const w = p >= 1 ? s : s * p, h = p >= 1 ? s / p : s;
  const a = (Math.abs(rot) % 180) * Math.PI / 180;
  return { w: Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a)), h: Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)) };
}
/** Se o desenho, nesse tamanho e sem girar, cabe na região (a geometria — não uma tabela). */
export const cabeNaRegiao = (d: DesenhoDeTatuagem, r: RegiaoDeTatuagem, tamanho: TamanhoDeTatuagem) => {
  const m = medidaDoDesenho(d, r, tamanho);
  return m.w <= REGIOES[r].w + 0.01 && m.h <= REGIOES[r].h + 0.01;
};

/** Onde o desenho pode ficar: a região comporta o tamanho e o desenho cabe nela; a faixa só nos membros; a peça inteira só na superfície. */
export function regioesDoDesenho(d: DesenhoDeTatuagem, tamanho: TamanhoDeTatuagem = d.tamanho): RegiaoDeTatuagem[] {
  if (d.regioes) return d.regioes.filter(r => (tamanho === 4 ? !!REGIOES[r].cobre : REGIOES[r].maximo >= tamanho && cabeNaRegiao(d, r, tamanho)));
  if (tamanho === 4) return [];
  return REGIOES_SIMPLES.filter(r => REGIOES[r].maximo >= tamanho && cabeNaRegiao(d, r, tamanho));
}

/* ------------------------------------------------------------------ cor */

export type CorDaTatuagem = 'preta' | 'cinza' | 'colorida';
/** A cor em que o estúdio faz o desenho se ninguém pedir outra (o realismo é em preto e cinza). */
export const corPadraoDe = (d: DesenhoDeTatuagem): CorDaTatuagem => (d.colorida ? 'colorida' : d.estilo === 'realista' ? 'cinza' : 'preta');
export const NOME_COR: Record<CorDaTatuagem, string> = { preta: 'Só preto', cinza: 'Preto e cinza', colorida: 'Colorida' };
/** O tom da tinta (no traço) ou a paleta (no colorido). */
export const TONS_DO_TRACO = [
  { id: 'preto', nome: 'Preto' }, { id: 'sepia', nome: 'Sépia' }, { id: 'vermelho', nome: 'Vermelho' }, { id: 'azul', nome: 'Azul-marinho' }, { id: 'verde', nome: 'Verde-musgo' }
] as const;
export const PALETAS = [
  { id: 'original', nome: 'Cores do desenho' }, { id: 'quente', nome: 'Quentes' }, { id: 'fria', nome: 'Frias' }, { id: 'pastel', nome: 'Pastel' }, { id: 'vibrante', nome: 'Vibrantes' }
] as const;
export type TomDoTraco = (typeof TONS_DO_TRACO)[number]['id'];
export type Paleta = (typeof PALETAS)[number]['id'];

/* ------------------------------------------------------------------ preço */

/** O preço base no Brasil (o estúdio, a sessão, a cor): a cidade multiplica. */
export const PRECO_POR_TAMANHO: Record<TamanhoDeTatuagem, number> = { 1: 280, 2: 750, 3: 2300, 4: 5200 };

/* ------------------------------------------------------------------ significado */

export type SignificadoDaTatuagem = 'estetica' | 'familia' | 'filho' | 'amor' | 'homenagem' | 'conquista' | 'data' | 'fe' | 'recomeco' | 'viagem' | 'liberdade';
export const NOME_SIGNIFICADO: Record<SignificadoDaTatuagem, string> = {
  estetica: 'Só porque é bonita', familia: 'Pela família', filho: 'Por um filho', amor: 'Por um amor', homenagem: 'Homenagem a alguém',
  conquista: 'Uma conquista', data: 'Uma data importante', fe: 'Fé', recomeco: 'Um recomeço', viagem: 'Uma viagem', liberdade: 'Liberdade'
};
/** Os significados que pedem uma pessoa. */
export const SIGNIFICADO_COM_PESSOA: SignificadoDaTatuagem[] = ['familia', 'filho', 'amor', 'homenagem'];

/* ------------------------------------------------------------------ composições */

export type FundoDeComposicao = 'nenhum' | 'ondas' | 'nuvens' | 'pontilhado' | 'folhagem' | 'blackwork' | 'geometrico';
export const NOME_FUNDO: Record<FundoDeComposicao, string> = {
  nenhum: 'Sem fundo (desenhos soltos)', ondas: 'Ondas (oriental)', nuvens: 'Nuvens e vento', pontilhado: 'Pontilhismo',
  folhagem: 'Folhagem', blackwork: 'Preto sólido entre os desenhos', geometrico: 'Linhas geométricas'
};
export type TipoDeComposicao = 'manga' | 'meia_manga' | 'peito' | 'costas' | 'perna';

export interface PecaDaComposicao { regiao: RegiaoDeTatuagem; desenho: string; tamanho: TamanhoDeTatuagem; lado?: Lado }
export interface ModeloDeComposicao {
  id: string;
  nome: string;
  tipo: TipoDeComposicao;
  /** Os desenhos por região (o estúdio faz os que faltam; o que já existe na região entra no conjunto). */
  pecas: PecaDaComposicao[];
  fundo: FundoDeComposicao;
  cor: CorDaTatuagem;
  descricao: string;
}
/** As regiões de cada tipo de composição (o fundo une as tatuagens delas). */
export const REGIOES_DA_COMPOSICAO: Record<TipoDeComposicao, RegiaoDeTatuagem[]> = {
  manga: ['ombro', 'biceps', 'triceps', 'antebraco', 'antebraco_externo', 'pulso'],
  meia_manga: ['ombro', 'biceps', 'triceps'],
  peito: ['peitoral', 'centro_peito'],
  costas: ['costas_alta', 'costas_media', 'costas_baixa'],
  perna: ['coxa', 'joelho', 'canela', 'panturrilha', 'tornozelo']
};
export const NOME_COMPOSICAO: Record<TipoDeComposicao, string> = { manga: 'Manga fechada', meia_manga: 'Meia manga', peito: 'Peito fechado', costas: 'Costas fechadas', perna: 'Perna fechada' };
export const COMPOSICAO_TEM_LADO: Record<TipoDeComposicao, boolean> = { manga: true, meia_manga: true, peito: false, costas: false, perna: true };

export const MODELOS_DE_COMPOSICAO: readonly ModeloDeComposicao[] = [
  { id: 'manga_oriental', nome: 'Manga oriental', tipo: 'manga', fundo: 'ondas', cor: 'colorida', descricao: 'Carpa, cerejeira, máscara e nuvens, unidas pelas ondas.',
    pecas: [{ regiao: 'ombro', desenho: 'nuvens', tamanho: 2 }, { regiao: 'biceps', desenho: 'carpa', tamanho: 3 }, { regiao: 'triceps', desenho: 'cerejeira', tamanho: 3 }, { regiao: 'antebraco', desenho: 'hannya', tamanho: 2 }, { regiao: 'antebraco_externo', desenho: 'onda', tamanho: 2 }] },
  { id: 'manga_old_school', nome: 'Manga old school', tipo: 'manga', fundo: 'nenhum', cor: 'colorida', descricao: 'Os clássicos do marinheiro, soltos, um por região.',
    pecas: [{ regiao: 'ombro', desenho: 'rosa_tradicional', tamanho: 2 }, { regiao: 'biceps', desenho: 'navio', tamanho: 3 }, { regiao: 'triceps', desenho: 'pantera', tamanho: 3 }, { regiao: 'antebraco', desenho: 'andorinha', tamanho: 2 }, { regiao: 'antebraco_externo', desenho: 'adaga', tamanho: 2 }] },
  { id: 'manga_realista', nome: 'Manga realista', tipo: 'manga', fundo: 'nuvens', cor: 'cinza', descricao: 'Leão, relógio, rosa e bússola em preto e cinza, com fumaça entre eles.',
    pecas: [{ regiao: 'ombro', desenho: 'rosa_realista', tamanho: 2 }, { regiao: 'biceps', desenho: 'leao_realista', tamanho: 3 }, { regiao: 'triceps', desenho: 'relogio_rosa', tamanho: 3 }, { regiao: 'antebraco', desenho: 'bussola', tamanho: 2 }, { regiao: 'antebraco_externo', desenho: 'olho_realista', tamanho: 2 }] },
  { id: 'manga_blackwork', nome: 'Manga blackwork', tipo: 'manga', fundo: 'blackwork', cor: 'preta', descricao: 'Serpente, corvo e luas, com o preto sólido fechando os vãos.',
    pecas: [{ regiao: 'ombro', desenho: 'mandala', tamanho: 2 }, { regiao: 'biceps', desenho: 'serpente_negra', tamanho: 3 }, { regiao: 'triceps', desenho: 'corvo', tamanho: 3 }, { regiao: 'antebraco', desenho: 'fases_da_lua', tamanho: 2 }, { regiao: 'antebraco_externo', desenho: 'montanha', tamanho: 2 }] },
  { id: 'meia_manga_floral', nome: 'Meia manga floral', tipo: 'meia_manga', fundo: 'folhagem', cor: 'colorida', descricao: 'Peônia, girassol e lírio do ombro ao cotovelo.',
    pecas: [{ regiao: 'ombro', desenho: 'peonia', tamanho: 2 }, { regiao: 'biceps', desenho: 'girassol', tamanho: 3 }, { regiao: 'triceps', desenho: 'lirio', tamanho: 2 }] },
  { id: 'meia_manga_geometrica', nome: 'Meia manga geométrica', tipo: 'meia_manga', fundo: 'geometrico', cor: 'preta', descricao: 'Mandala no ombro, flor da vida e colmeia, ligadas por linhas.',
    pecas: [{ regiao: 'ombro', desenho: 'mandala', tamanho: 2 }, { regiao: 'biceps', desenho: 'flor_da_vida', tamanho: 3 }, { regiao: 'triceps', desenho: 'hexagonos', tamanho: 2 }] },
  { id: 'meia_manga_tribal', nome: 'Meia manga tribal', tipo: 'meia_manga', fundo: 'nenhum', cor: 'preta', descricao: 'Espirais maori e o sol tribal.',
    pecas: [{ regiao: 'ombro', desenho: 'sol_tribal', tamanho: 2 }, { regiao: 'biceps', desenho: 'tribal_polinesio', tamanho: 3 }, { regiao: 'triceps', desenho: 'maori_espiral', tamanho: 3 }] },
  { id: 'peito_ornamental', nome: 'Peito ornamental', tipo: 'peito', fundo: 'pontilhado', cor: 'preta', descricao: 'O pingente no esterno e um medalhão em cada peitoral.',
    pecas: [{ regiao: 'centro_peito', desenho: 'lustre', tamanho: 2 }, { regiao: 'peitoral', lado: 'e', desenho: 'medalhao', tamanho: 3 }, { regiao: 'peitoral', lado: 'd', desenho: 'medalhao', tamanho: 3 }] },
  { id: 'peito_old_school', nome: 'Peito old school', tipo: 'peito', fundo: 'nenhum', cor: 'colorida', descricao: 'Duas andorinhas e a adaga no meio.',
    pecas: [{ regiao: 'centro_peito', desenho: 'adaga', tamanho: 2 }, { regiao: 'peitoral', lado: 'e', desenho: 'andorinha', tamanho: 2 }, { regiao: 'peitoral', lado: 'd', desenho: 'andorinha', tamanho: 2 }] },
  { id: 'costas_oriental', nome: 'Costas orientais', tipo: 'costas', fundo: 'ondas', cor: 'colorida', descricao: 'O tigre no alto, a carpa no meio, as ondas na base.',
    pecas: [{ regiao: 'costas_alta', desenho: 'tigre', tamanho: 3 }, { regiao: 'costas_media', desenho: 'carpa', tamanho: 3 }, { regiao: 'costas_baixa', desenho: 'onda', tamanho: 2 }] },
  { id: 'costas_floral', nome: 'Costas florais', tipo: 'costas', fundo: 'folhagem', cor: 'colorida', descricao: 'Buquê, peônia e lavanda descendo pelas costas.',
    pecas: [{ regiao: 'costas_alta', desenho: 'buque', tamanho: 3 }, { regiao: 'costas_media', desenho: 'peonia', tamanho: 3 }, { regiao: 'costas_baixa', desenho: 'lavanda', tamanho: 2 }] },
  { id: 'perna_old_school', nome: 'Perna old school', tipo: 'perna', fundo: 'nenhum', cor: 'colorida', descricao: 'Navio na coxa, rosa no joelho, serpente na canela, âncora na panturrilha.',
    pecas: [{ regiao: 'coxa', desenho: 'navio', tamanho: 3 }, { regiao: 'joelho', desenho: 'rosa_tradicional', tamanho: 2 }, { regiao: 'canela', desenho: 'cobra_tradicional', tamanho: 2 }, { regiao: 'panturrilha', desenho: 'ancora', tamanho: 3 }] },
  { id: 'perna_blackwork', nome: 'Perna blackwork', tipo: 'perna', fundo: 'blackwork', cor: 'preta', descricao: 'Corvo na coxa, mandala no joelho, floresta na canela, serpente na panturrilha.',
    pecas: [{ regiao: 'coxa', desenho: 'corvo', tamanho: 3 }, { regiao: 'joelho', desenho: 'mandala', tamanho: 2 }, { regiao: 'canela', desenho: 'floresta', tamanho: 2 }, { regiao: 'panturrilha', desenho: 'serpente_negra', tamanho: 3 }] }
];
export const modeloDeComposicao = (id: string) => MODELOS_DE_COMPOSICAO.find(m => m.id === id);

/* ------------------------------------------------------------------ saves antigos */

/** A região de um registro antigo (só com a parte grande): os lugares mais naturais daquela parte, em ordem. */
export const REGIAO_DA_PARTE: Record<LocalDeTatuagem, RegiaoDeTatuagem[]> = {
  rosto: ['bochecha', 'testa', 'tempora', 'sob_olho', 'queixo', 'nariz', 'sobrancelha_t'],
  braco: ['biceps', 'triceps', 'ombro'],
  antebraco: ['antebraco', 'antebraco_externo', 'pulso'],
  ombro: ['ombro', 'biceps'],
  mao: ['mao', 'dedos'],
  peito: ['peitoral', 'centro_peito', 'abdomen'],
  costas: ['costas_alta', 'costas_media', 'costas_baixa'],
  abdomen: ['abdomen', 'costelas'],
  pescoco: ['pescoco', 'nuca'],
  coxa: ['coxa', 'joelho'],
  panturrilha: ['panturrilha', 'canela', 'tornozelo']
};
