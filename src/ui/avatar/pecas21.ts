/**
 * VIDA 21 — o desenho das peças novas (`dados21/estilo/estilo21`): cada uma pela silhueta antes da cor, na linguagem de
 * sempre (`pecas.ts`). A gola V da camiseta, o ombro a ombro (canoa) com manga bufante (bispo), a pantalona (larga), o
 * skinny (justa), a jardineira (macacão de cinto), o macacão de piloto (com as faixas), o pijama cirúrgico (gola V e calça
 * de cordão na mesma cor), o puffer (casaco curto de gola alta), o trench (trespassado com cinto), a bomber (punho de
 * ribana), o jaleco (branco, reto, até o joelho), o tênis de basquete (cano), a chelsea (botina sem cadarço).
 */
import type { Conjunto, Peca } from './pecas';

const ESCURAS = ['#1b1b1d', '#22262b', '#2d3e5c'];
const JEANS = ['#3d5a80', '#2f4562', '#5b7aa3', '#22324a'];

export const PECAS_21: Record<string, Peca | Conjunto> = {
  camiseta_basica_gola_v: { parte: 'cima', forma: 'camiseta', cor: ['#f2efe8', '#22262b', '#7d8590', '#5d6b4f'], manga: 'curta', gola: 'v', modelo: 'ajustada', barra: 'reta' },
  camiseta_dry_fit: { parte: 'cima', forma: 'camiseta', cor: ['#1d4fa3', '#c84b31', '#1b1b1d', '#e8f04a'], manga: 'curta', gola: 'redonda', modelo: 'ajustada', barra: 'curva', folga: 0.98 },
  regata_academia: { parte: 'cima', forma: 'regata', cor: ['#1b1b1d', '#f2efe8', '#7d8590'], manga: 'sem', gola: 'redonda', folga: 1.06, modelo: 'ampla' },
  camisa_oxford: { parte: 'cima', forma: 'camisa', cor: ['#cfe0f2', '#f4f6f8', '#f3d9d4'], manga: 'longa', gola: 'colarinho', botoes: true, modelo: 'caixa', barra: 'curva', punho: true, bolsosPeito: true },
  camisa_havaiana: { parte: 'cima', forma: 'camisa', cor: ['#1f5c7a', '#2f5a3c', '#c84b31'], cor2: '#f2c200', estampa: 'floral', manga: 'curta', gola: 'colarinho', botoes: true, modelo: 'ampla', barra: 'reta', folga: 1.08 },
  blusa_ombro_a_ombro: { parte: 'cima', forma: 'blusa', cor: ['#f2efe8', '#d97a8a', '#2d3e5c'], manga: 'curta', gola: 'canoa', modelo: 'fluida', barra: 'reta', bispo: true },
  body_canelado: { parte: 'cima', forma: 'blusa', cor: ['#1b1b1d', '#b9a58a', '#7b2d3a'], manga: 'longa', gola: 'alta', modelo: 'ajustada', barra: 'reta', folga: 0.94 },
  camisa_seda_grife: { parte: 'cima', forma: 'camisa', cor: ['#14213d', '#7b1e2b', '#f3e7dc'], cor2: '#c9a14a', estampa: 'floral', manga: 'longa', gola: 'colarinho', botoes: true, modelo: 'fluida', barra: 'curva', punho: true },
  polo_pique_premium: { parte: 'cima', forma: 'polo', cor: ['#f4f4f2', '#14213d', '#2f5a3c'], manga: 'curta', gola: 'polo', modelo: 'ajustada', barra: 'fenda', punho: true },
  moletom_grife: { parte: 'cima', forma: 'moletom', cor: ['#111214', '#f4f2ee', '#5a4a3a'], cor2: '#c9a14a', estampa: 'logo', manga: 'longa', gola: 'redonda', folga: 1.16, modelo: 'ampla', barra: 'canelada', punho: true, ombroCaido: true },

  calca_moletom: { parte: 'baixo', forma: 'calca', corte: 'bombacha', cor: ['#8d9399', '#22262b', '#2d3e5c'], cordao: true },
  calca_wide_leg: { parte: 'baixo', forma: 'calca', corte: 'larga', cor: ['#f2efe8', '#1b1b1d', '#b9a58a', '#7b2d3a'], vinco: true, passadores: true },
  jeans_skinny: { parte: 'baixo', forma: 'calca', corte: 'justa', cor: JEANS, bolsos: true, costura: '#c99a4a' },
  jeans_reto_premium: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#1b2a44', '#22324a'], bolsos: true, costura: '#d8b45a', passadores: true },
  short_corrida: { parte: 'baixo', forma: 'short', corte: 'curta', cor: ['#1b1b1d', '#1d4fa3', '#c84b31'], listra: '#f4f4f2', fendaLateral: true, cordao: true },
  short_alfaiataria: { parte: 'baixo', forma: 'short', corte: 'curta', cor: ['#b9a58a', '#1b1b1d', '#f2efe8'], pregas: true, passadores: true },
  saia_plissada_longa: { parte: 'baixo', forma: 'saia', corte: 'midi', cor: ['#c9a46a', '#2f5a52', '#7b2d3a'], pregas: true },
  minissaia_jeans: { parte: 'baixo', forma: 'saia', corte: 'curta', cor: JEANS, bolsos: true, costura: '#c99a4a' },
  calca_alfaiataria_grife: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#3b3a40', '#1e2533', '#6b5e4e'], vinco: true, passadores: true },

  vestido_tubinho: { parte: 'inteira', forma: 'vestido', comprimento: 'joelho', cor: ESCURAS, manga: 'sem', gola: 'canoa', modelo: 'coluna' },
  vestido_midi_estampado: { parte: 'inteira', forma: 'vestido', comprimento: 'midi', cor: ['#f3e2c8', '#2d3e5c', '#c2566b'], cor2: '#5d6b4f', estampa: 'floral', manga: 'sem', gola: 'v', modelo: 'rodado' },
  vestido_gala_grife: { parte: 'inteira', forma: 'vestido', comprimento: 'longo', cor: ['#c9a14a', '#14213d', '#7b1e2b'], manga: 'sem', gola: 'v', modelo: 'baile', cinto: '#f2e6c8' },
  terno_grife: { parte: 'inteira', forma: 'terno', comprimento: 'calca', cor: ['#1e2533', '#3b3a40', '#4a3b2c'], cor2: '#f4f6f8', manga: 'longa', gola: 'colarinho' },
  smoking: { parte: 'inteira', forma: 'terno', comprimento: 'calca', cor: '#111214', cor2: '#f8f8f6', manga: 'longa', gola: 'colarinho' },
  macacao_jeans: { parte: 'inteira', forma: 'macacao', comprimento: 'calca', cor: JEANS, manga: 'sem', gola: 'redonda', cinto: '#c9ccd1' },
  macacao_piloto: { parte: 'inteira', forma: 'macacao', comprimento: 'calca', cor: ['#c8102e', '#1d4fa3', '#111214', '#f2c200'], cor2: '#f4f4f2', estampa: 'logo', manga: 'longa', gola: 'alta', cinto: '#1b1b1d' },
  uniforme_hospitalar: { cima: { parte: 'cima', forma: 'camiseta', cor: ['#3f8f8a', '#2d5fa8', '#5a8f5a'], manga: 'curta', gola: 'v', modelo: 'caixa', barra: 'reta', bolso: true }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#3f8f8a', '#2d5fa8', '#5a8f5a'], cordao: true } },
  // O quimono: o casaco de trama grossa cruzado (gola V funda, manga longa, ampla) e a calça reta, da mesma cor.
  kimono_judo: { cima: { parte: 'cima', forma: 'camisa', cor: ['#f4f4f2', '#2d5fa8'], manga: 'longa', gola: 'v', modelo: 'ampla', barra: 'reta', folga: 1.1 }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#f4f4f2', '#2d5fa8'], cordao: true } },
  agasalho_selecao: { cima: { parte: 'cima', forma: 'agasalho', cor: ['#f2c200', '#0b5d2a', '#1d4fa3'], cor2: '#f4f4f2', manga: 'longa', gola: 'alta', barra: 'canelada', punho: true }, baixo: { parte: 'baixo', forma: 'calca', corte: 'reta', cor: ['#0b5d2a', '#1d4fa3', '#111214'], listra: '#f2c200' } },

  puffer: { parte: 'casaco', forma: 'casaco', comprimento: 'quadril', cor: ['#1b1b1d', '#c84b31', '#2d3e5c', '#e8e2d4'], ziper: true, gola: 'alta', modelo: 'reto', punhoElastico: true },
  trench_coat: { parte: 'casaco', forma: 'sobretudo', comprimento: 'joelho', cor: ['#c2a47a', '#b9a58a'], lapela: true, modelo: 'trespassado', cinto: true },
  jaqueta_bomber: { parte: 'casaco', forma: 'jaqueta', comprimento: 'cintura', cor: ['#3f4a33', '#1b1b1d', '#2d3e5c'], cor2: '#c84b31', ziper: true, gola: 'alta', modelo: 'reto', punhoElastico: true },
  cardigan: { parte: 'casaco', forma: 'casaco', comprimento: 'quadril', cor: ['#b9a58a', '#7b2d3a', '#5d6b4f', '#f2efe8'], modelo: 'reto', bolsosFaca: true },
  jaqueta_corrida: { parte: 'casaco', forma: 'jaqueta', comprimento: 'cintura', cor: ['#c8102e', '#111214', '#1d4fa3'], cor2: '#f2c200', ziper: true, gola: 'alta', modelo: 'reto', punhoElastico: true },
  jaleco: { parte: 'casaco', forma: 'casaco', comprimento: 'joelho', cor: '#f8f8f6', lapela: true, modelo: 'reto', bolsosFaca: true },
  casaco_vison_sintetico: { parte: 'casaco', forma: 'casaco', comprimento: 'joelho', cor: ['#e8dccb', '#3a2a22', '#111214'], gola: 'pelo', modelo: 'reto' },

  tenis_basquete: { parte: 'pes', forma: 'tenis_cano', cor: ['#c8102e', '#111214', '#f4f4f2'], sola: '#f4f4f2', detalhe: '#111214' },
  chuteira: { parte: 'pes', forma: 'tenis_corrida', cor: ['#e8f04a', '#1d4fa3', '#f4f4f2'], sola: '#111214', detalhe: '#c84b31' },
  bota_chelsea: { parte: 'pes', forma: 'botina', cor: ['#1b1515', '#6b4428'], sola: '#141010' },
  salto_grife: { parte: 'pes', forma: 'salto', cor: ['#111214', '#c9a14a', '#f2e6c8'], sola: '#a3141f' },
  tenis_grife: { parte: 'pes', forma: 'tenis', cor: ['#f4f4f2', '#111214'], sola: '#e9e2d0', detalhe: '#c9a14a' },

  relogio_esportivo_cronografo: { parte: 'pulso', forma: 'analogico', pulseira: '#b9bec5', caixa: '#c9ccd1', mostrador: '#111214' },
  relogio_titanio: { parte: 'pulso', forma: 'analogico', pulseira: '#8d9399', caixa: '#7d8590', mostrador: '#3a3f45' },
  relogio_ouro_rose: { parte: 'pulso', forma: 'analogico', pulseira: '#3a2418', caixa: '#d9a18a', mostrador: '#f3ead2' },
  gargantilha_couro: { parte: 'pescoco', cor: '#3a2418', grossa: true },
  bolsa_couro_media: { parte: 'bolsa', forma: 'tote', cor: '#6b3f22', alca: '#4a2c20', ferragem: '#c9a14a' },
  mochila_couro: { parte: 'bolsa', forma: 'mochila', cor: '#7a4a2a', alca: '#4a2c20' },
  mochila_esportiva: { parte: 'bolsa', forma: 'mochila', cor: '#1b1b1d', alca: '#c84b31' },
  pochete_grife: { parte: 'bolsa', forma: 'pochete', cor: '#7a5a3a', alca: '#3a2418', ferragem: '#d8b45a' },
  clutch_pedraria: { parte: 'bolsa', forma: 'clutch', cor: '#d9d4e8', ferragem: '#e8e2d4' },
  bolsa_edicao_limitada: { parte: 'bolsa', forma: 'tote', cor: '#2f5a52', alca: '#1b1b1d', ferragem: '#e0b43c' }
};
