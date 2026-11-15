/**
 * VIDA 22 · A FAMÍLIA DAS PEÇAS BÁSICAS — peças lisas que, na mesma cor, são peças diferentes: a camiseta oversized
 * (encorpada, ombro caído, longline), a de algodão pima (encorpada, ajustada, gola larga, barra dupla), a henley (carcela
 * de três botões), a de bolso (corte reto, bolso no peito), a de manga longa (malha leve, ajustada), a raglan de beisebol
 * (manga de outra cor, três quartos), a regata de alcinha (canelada). O desenho de cada uma está em `ui/avatar/pecas22`
 * (a construção antes da cor). Entram no fim de `ITENS_ESTILO`, nas mesmas categorias de sempre.
 *
 * Preços: reais de 2026, referência de varejo brasileiro (a cidade e a marca ajustam).
 */
import type { ItemEstilo } from '../../dados/estilo';

export const ITENS_ESTILO_22: readonly ItemEstilo[] = [
  { id: 'camiseta_oversized', nome: 'Camiseta oversized', categoria: 'roupa', lugar: 'tronco', preco: 99, nivel: 2, estilos: ['streetwear', 'casual', 'urbano'], ocasioes: ['dia', 'festa'], descricao: 'Malha grossa de 220 g, ombro caído, comprimento abaixo do quadril e gola canelada larga.' },
  { id: 'camiseta_pima', nome: 'Camiseta de algodão pima', categoria: 'roupa', lugar: 'tronco', preco: 290, nivel: 3, estilos: ['minimalista', 'casual', 'elegante'], ocasioes: ['dia', 'trabalho', 'encontro'], descricao: 'Fio longo e encorpado, corte ajustado, gola de ribana firme e barra de costura dupla: não deforma.' },
  { id: 'camiseta_henley', nome: 'Henley de manga longa', categoria: 'roupa', lugar: 'tronco', preco: 149, nivel: 2, estilos: ['casual', 'vintage', 'tradicional'], ocasioes: ['dia', 'encontro'], descricao: 'Malha média, sem gola, carcela de três botões no peito, punho canelado.' },
  { id: 'camiseta_bolso', nome: 'Camiseta com bolso', categoria: 'roupa', lugar: 'tronco', preco: 69, nivel: 1, estilos: ['casual', 'vintage'], ocasioes: ['dia', 'estudo'], descricao: 'Corte reto e solto, bolso chapado no peito, manga dobrada na ponta.' },
  { id: 'camiseta_manga_longa', nome: 'Camiseta de manga longa', categoria: 'roupa', lugar: 'tronco', preco: 79, nivel: 1, estilos: ['casual', 'minimalista'], ocasioes: ['dia', 'estudo'], descricao: 'Malha leve e fina, corte rente ao corpo, gola careca estreita.' },
  { id: 'camiseta_raglan', nome: 'Camiseta raglan de beisebol', categoria: 'roupa', lugar: 'tronco', preco: 89, nivel: 1, estilos: ['casual', 'esportivo', 'vintage'], ocasioes: ['dia', 'esporte'], descricao: 'Corpo branco, manga três quartos de outra cor com a costura em diagonal do ombro à axila.' },
  { id: 'regata_alcinha', nome: 'Regata de alcinha canelada', categoria: 'roupa', lugar: 'tronco', preco: 49, nivel: 1, estilos: ['casual', 'minimalista'], ocasioes: ['dia', 'festa'], descricao: 'Malha canelada justa, alças finas, decote reto.' }
];
