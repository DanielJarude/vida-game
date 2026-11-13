/**
 * VIDA 13 — OS CARROS PELAS MEDIDAS DE VERDADE. Cada modelo do catálogo tem as medidas da ficha técnica (comprimento,
 * altura, entre-eixos, diâmetro da roda com o pneu, balanço dianteiro e vão livre, em milímetros) e um ARQUÉTIPO — a
 * construção da carroceria: o hatch de tampa quase reta, o sedã de três volumes, o fastback, o SUV caixa, o SUV-cupê,
 * o jipe de linhas retas, a picape, o GT de capô longo, o muscle car, o motor traseiro do 911 (o teto que desce até o
 * para-choque), o motor central (a cabine adiantada, a tampa do motor atrás dela, a frente baixa e curta), o besouro
 * (a cúpula com os para-lamas soltos), o americano dos anos 1950 (comprido, baixo, cromado).
 *
 * O desenho (`carros.ts`) lê as medidas na escala (1 unidade ≈ 25 mm no comprimento, 23,5 mm na altura — o estilo
 * ilustrado engrossa um pouco) e o arquétipo diz onde ficam o para-brisa, o teto, a linha de cintura, a traseira. O
 * que é do modelo e não cabe nos números (o farol no para-lama do 911, as tomadas laterais do motor central, as aletas
 * do Eldorado, o estepe do G) vem nos ajustes. Sem logotipo de ninguém: só a forma.
 *
 * Puro (só dados): fica no pacote da UI (junto do desenho), nunca no motor.
 */
import type { Extras129 } from './veiculos129';

export type Traseira = 'hatch' | 'tres' | 'fastback' | 'caixa' | 'cacamba';
export type Farol = 'fino' | 'redondo' | 'alto' | 'paralama' | 'escamoteavel' | 'gota' | 'quadrado';
export type Lanterna = 'bloco' | 'fina' | 'vertical' | 'redonda' | 'barra' | 'aleta';

/** A ficha técnica (mm). */
export interface Medidas { L: number; H: number; W: number; D: number; bf: number; vao?: number }

/** A construção da carroceria: posições como fração do comprimento (a partir da FRENTE) e alturas como fração da altura. */
export interface Arquetipo {
  traseira: Traseira;
  /** linha de cintura (base dos vidros) na frente e atrás */
  cint: number; cintT?: number;
  /** o alto do bico (o fim do capô) e o capô junto do para-brisa */
  nariz: number; capoBase?: number;
  /** a base do para-brisa (da frente) e o quanto ele avança deitado até o teto */
  pb: number; para: number;
  /** onde o teto termina (da frente) */
  tT: number;
  /** a altura da traseira (o alto da tampa, do porta-malas, da caçamba) */
  tras: number;
  /** onde começa o porta-malas ou a tampa do motor (sedã, motor central), ou onde acaba a cabine (picape) */
  vol?: number;
  /** o recuo do alto da traseira (mm) e o comprimento do bico inclinado (mm) */
  cauda?: number; nz?: number;
  /** a curvatura dos cantos (1 = moderno; 2 = o arredondado dos antigos; 0,4 = o jipe de régua) */
  curva?: number;
  vao: number;
  /** a folga entre o pneu e o arco do para-lama (unidades) */
  folga?: number;
  /** a espessura da coluna de trás (mm) no alto e na base (o 911, o fastback: a coluna larga embaixo) */
  colC?: number; colCb?: number;
}

/** O que é do modelo além das medidas (todas opcionais). */
export interface Ajustes {
  colunas?: number[];
  portas?: 2 | 4;
  farol?: Farol;
  lanterna?: Lanterna;
  paraChoque?: 'cor' | 'preto' | 'cromo';
  moldura?: 'preta' | 'cromo' | 'cor';
  espelho?: 'cor' | 'preto' | 'cromo' | 'nenhum';
  rodas?: 'calota' | 'liga' | 'cravos' | 'raios';
  raios?: number;
  perfilBaixo?: boolean;
  corAro?: string;
  faixaBranca?: boolean;
  rack?: boolean; estribo?: boolean; cava?: boolean; santoAntonio?: boolean; tomada?: boolean;
  tetoCor?: string;
  /** a anca larga sobre a roda de trás (o 911): quanto sobe (unidades) */
  ombro?: number;
  /** as costas abauladas do fastback (o Fusca, o 911): quanto a descida estufa (unidades) */
  costas?: number;
  /** o capô abaulado no meio (o E-Type, o Corvette): quanto sobe (unidades) */
  bojo?: number;
  paralamaSolto?: boolean;
  semTeto?: boolean;
  /** capota de lona fechada (a cor) */
  capota?: string;
  grade?: boolean;
  saia?: boolean;
  difusor?: boolean;
  ponteiras?: number;
  guelra?: boolean;
  entrada?: boolean;
  /** a antena "barbatana" no teto */
  barbatana?: boolean;
  extras?: Extras129;
}

export type Modelo13 = { m: Medidas; a: keyof typeof ARQUETIPOS; o?: Partial<Arquetipo>; j?: Ajustes };

export const ARQUETIPOS = {
  compacto: { traseira: 'hatch', cint: 0.63, nariz: 0.56, pb: 0.29, para: 0.2, tT: 0.92, tras: 0.68, vao: 150, nz: 220 },
  hatch: { traseira: 'hatch', cint: 0.64, nariz: 0.55, pb: 0.3, para: 0.2, tT: 0.89, tras: 0.67, vao: 145, nz: 230 },
  seda: { traseira: 'tres', cint: 0.64, nariz: 0.55, pb: 0.33, para: 0.2, tT: 0.72, vol: 0.86, tras: 0.7, cauda: 60, vao: 145, nz: 240 },
  fastback: { traseira: 'fastback', cint: 0.66, nariz: 0.52, pb: 0.33, para: 0.17, tT: 0.64, tras: 0.68, cauda: 90, vao: 140, nz: 240, colC: 160 },
  luxo: { traseira: 'tres', cint: 0.67, nariz: 0.6, pb: 0.36, para: 0.18, tT: 0.73, vol: 0.85, tras: 0.72, cauda: 50, vao: 140, nz: 200 },
  suv: { traseira: 'caixa', cint: 0.6, nariz: 0.58, pb: 0.31, para: 0.17, tT: 0.955, tras: 0.6, vao: 200, nz: 220, folga: 3.8, colC: 140 },
  suv_cupe: { traseira: 'fastback', cint: 0.62, nariz: 0.58, pb: 0.31, para: 0.18, tT: 0.72, tras: 0.62, cauda: 130, vao: 190, nz: 230, folga: 3.4, colC: 170 },
  jipe: { traseira: 'caixa', cint: 0.57, nariz: 0.63, pb: 0.31, para: 0.07, tT: 0.985, tras: 0.57, vao: 230, nz: 90, curva: 0.4, folga: 4.6, colC: 120 },
  picape: { traseira: 'cacamba', cint: 0.58, nariz: 0.6, pb: 0.3, para: 0.13, tT: 0.6, vol: 0.62, tras: 0.58, vao: 230, nz: 160, folga: 4.4 },
  gt: { traseira: 'fastback', cint: 0.7, nariz: 0.48, pb: 0.42, para: 0.21, tT: 0.73, tras: 0.72, cauda: 140, vao: 120, nz: 260, folga: 2.4, colC: 200 },
  muscle: { traseira: 'fastback', cint: 0.71, nariz: 0.62, pb: 0.42, para: 0.19, tT: 0.72, tras: 0.75, cauda: 60, vao: 130, nz: 120, folga: 2.6, colC: 220 },
  traseiro: { traseira: 'fastback', cint: 0.66, nariz: 0.5, pb: 0.34, para: 0.15, tT: 0.64, tras: 0.6, cauda: 230, vao: 120, nz: 300, curva: 1.5, folga: 2.4, colC: 150, colCb: 520 },
  central: { traseira: 'tres', cint: 0.66, nariz: 0.4, pb: 0.26, para: 0.22, tT: 0.6, vol: 0.79, tras: 0.79, cauda: 40, vao: 105, nz: 300, folga: 2.2, colC: 210 },
  besouro: { traseira: 'fastback', cint: 0.6, nariz: 0.52, pb: 0.27, para: 0.16, tT: 0.58, tras: 0.48, cauda: 260, vao: 230, nz: 380, curva: 2.4, folga: 3, colC: 150, colCb: 480 },
  classico_us: { traseira: 'tres', cint: 0.6, nariz: 0.64, pb: 0.4, para: 0.14, tT: 0.66, vol: 0.73, tras: 0.65, cauda: 40, vao: 160, nz: 100, curva: 1.2, folga: 2.4 },
  roadster: { traseira: 'tres', cint: 0.72, nariz: 0.52, pb: 0.42, para: 0.17, tT: 0.66, vol: 0.74, tras: 0.74, cauda: 60, vao: 125, nz: 230, folga: 2.4, colC: 190 }
} satisfies Record<string, Arquetipo>;

export const MODELOS_13: Record<string, Modelo13> = {
  /* ------------------------------------------------------------ ERAS HISTÓRICAS: os carros da época (`motor/eras/base/veiculos`).
     Medidas aproximadas das fichas técnicas de cada modelo (mm); o desenho é o do VIDA, sem logotipo. */
  ep_vw_fusca: { m: { L: 4070, H: 1500, W: 2400, D: 620, bf: 770 }, a: 'besouro', j: { costas: 8, paralamaSolto: true, farol: 'paralama', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', colunas: [0.36], portas: 2 } },
  ep_vw_fusca_itamar: { m: { L: 4090, H: 1500, W: 2400, D: 620, bf: 780 }, a: 'besouro', j: { costas: 8, paralamaSolto: true, farol: 'paralama', lanterna: 'bloco', paraChoque: 'cor', moldura: 'preta', espelho: 'preto', rodas: 'calota', colunas: [0.36], portas: 2 } },
  ep_fiat_147: { m: { L: 3625, H: 1350, W: 2225, D: 560, bf: 640 }, a: 'compacto', o: { tT: 0.95, tras: 0.7, curva: 0.7 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', rodas: 'calota', portas: 2 } },
  ep_gm_chevette: { m: { L: 4190, H: 1330, W: 2395, D: 570, bf: 780 }, a: 'seda', o: { curva: 0.8 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', rodas: 'calota', portas: 2 } },
  ep_vw_gol_quadrado: { m: { L: 3810, H: 1360, W: 2358, D: 570, bf: 700 }, a: 'hatch', o: { curva: 0.6, tT: 0.9 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'preto', moldura: 'preta', rodas: 'calota', portas: 2 } },
  ep_fiat_uno: { m: { L: 3640, H: 1430, W: 2360, D: 560, bf: 650 }, a: 'compacto', o: { tT: 0.96, tras: 0.74, curva: 0.6 }, j: { farol: 'quadrado', lanterna: 'vertical', paraChoque: 'preto', moldura: 'preta', rodas: 'calota', portas: 2 } },
  ep_fiat_mille: { m: { L: 3690, H: 1445, W: 2361, D: 560, bf: 660 }, a: 'compacto', o: { tT: 0.96, tras: 0.74, curva: 0.6 }, j: { farol: 'quadrado', lanterna: 'vertical', paraChoque: 'cor', moldura: 'preta', rodas: 'calota', portas: 4 } },
  ep_ford_escort: { m: { L: 4050, H: 1390, W: 2400, D: 580, bf: 770 }, a: 'hatch', o: { curva: 0.7, tT: 0.88 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'preto', moldura: 'preta', rodas: 'calota', portas: 2 } },
  ep_gm_corsa: { m: { L: 3729, H: 1420, W: 2443, D: 570, bf: 690 }, a: 'hatch', o: { curva: 1.4, tT: 0.9 }, j: { farol: 'gota', lanterna: 'vertical', paraChoque: 'cor', rodas: 'calota', portas: 2 } },
  ep_vw_gol_bola: { m: { L: 3830, H: 1415, W: 2468, D: 580, bf: 690 }, a: 'hatch', o: { curva: 1.2, tT: 0.89 }, j: { farol: 'gota', lanterna: 'bloco', paraChoque: 'cor', rodas: 'calota', portas: 2 } },
  ep_fiat_palio: { m: { L: 3734, H: 1440, W: 2361, D: 580, bf: 680 }, a: 'hatch', o: { curva: 1.1 }, j: { farol: 'gota', lanterna: 'vertical', paraChoque: 'cor', rodas: 'calota', portas: 4 } },
  ep_ford_ka: { m: { L: 3620, H: 1430, W: 2448, D: 570, bf: 640 }, a: 'compacto', o: { curva: 1.6, tT: 0.9 }, j: { farol: 'gota', lanterna: 'vertical', paraChoque: 'preto', rodas: 'calota', portas: 2 } },
  ep_gm_celta: { m: { L: 3748, H: 1416, W: 2443, D: 570, bf: 690 }, a: 'hatch', o: { curva: 1.1, tT: 0.91 }, j: { farol: 'fino', lanterna: 'vertical', paraChoque: 'cor', rodas: 'calota', portas: 4 } },
  ep_vw_fox: { m: { L: 3828, H: 1544, W: 2465, D: 600, bf: 720 }, a: 'compacto', o: { tT: 0.94, tras: 0.71 }, j: { farol: 'fino', lanterna: 'vertical', rodas: 'calota', portas: 4 } },
  ep_gm_onix: { m: { L: 3933, H: 1476, W: 2528, D: 600, bf: 760 }, a: 'hatch', o: { tT: 0.89 }, j: { farol: 'fino', raios: 5, lanterna: 'vertical', portas: 4 } },
  ep_hyundai_hb20: { m: { L: 3920, H: 1470, W: 2500, D: 600, bf: 770 }, a: 'hatch', o: { tT: 0.86, tras: 0.66 }, j: { farol: 'fino', raios: 7, lanterna: 'vertical', portas: 4 } },
  ep_gm_opala: { m: { L: 4575, H: 1380, W: 2670, D: 640, bf: 870 }, a: 'seda', o: { curva: 0.7, vol: 0.84 }, j: { farol: 'quadrado', lanterna: 'barra', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', portas: 4 } },
  ep_vw_passat: { m: { L: 4190, H: 1360, W: 2470, D: 580, bf: 760 }, a: 'fastback', o: { curva: 0.8 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', rodas: 'calota', portas: 2 } },
  ep_ford_del_rey: { m: { L: 4410, H: 1350, W: 2440, D: 580, bf: 850 }, a: 'seda', o: { curva: 0.6 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', portas: 4 } },
  ep_gm_monza: { m: { L: 4366, H: 1360, W: 2574, D: 600, bf: 800 }, a: 'seda', o: { curva: 0.7 }, j: { farol: 'quadrado', lanterna: 'barra', paraChoque: 'preto', moldura: 'preta', rodas: 'liga', raios: 8, portas: 4 } },
  ep_vw_santana: { m: { L: 4545, H: 1400, W: 2550, D: 600, bf: 870 }, a: 'seda', o: { curva: 0.6 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'preto', moldura: 'preta', rodas: 'calota', portas: 4 } },
  ep_fiat_tempra: { m: { L: 4354, H: 1445, W: 2540, D: 600, bf: 830 }, a: 'seda', o: { curva: 0.7, vol: 0.85 }, j: { farol: 'fino', lanterna: 'barra', paraChoque: 'cor', rodas: 'liga', raios: 5, portas: 4 } },
  ep_gm_vectra: { m: { L: 4477, H: 1400, W: 2600, D: 610, bf: 880 }, a: 'seda', o: { curva: 1.2 }, j: { farol: 'fino', lanterna: 'fina', paraChoque: 'cor', rodas: 'liga', raios: 6, portas: 4 } },
  ep_fiat_siena: { m: { L: 4120, H: 1440, W: 2373, D: 580, bf: 690 }, a: 'seda', o: { curva: 1.1, vol: 0.83 }, j: { farol: 'gota', lanterna: 'fina', paraChoque: 'cor', rodas: 'calota', portas: 4 } },
  ep_honda_civic: { m: { L: 4450, H: 1390, W: 2620, D: 600, bf: 860 }, a: 'seda', o: { curva: 1.1 }, j: { farol: 'gota', lanterna: 'fina', paraChoque: 'cor', rodas: 'liga', raios: 5, portas: 4 } },
  ep_toyota_corolla: { m: { L: 4420, H: 1385, W: 2465, D: 610, bf: 860 }, a: 'seda', o: { curva: 1.2, vol: 0.85 }, j: { farol: 'fino', lanterna: 'barra', paraChoque: 'cor', rodas: 'liga', raios: 10, portas: 4 } },
  ep_toyota_bandeirante: { m: { L: 3870, H: 1910, W: 2285, D: 760, bf: 620 }, a: 'jipe', o: { nariz: 0.6, pb: 0.36 }, j: { farol: 'redondo', lanterna: 'bloco', paraChoque: 'preto', moldura: 'cor', espelho: 'preto', rodas: 'cravos', portas: 2 } },
  ep_vw_saveiro: { m: { L: 4155, H: 1395, W: 2358, D: 580, bf: 700 }, a: 'picape', o: { vao: 160, nariz: 0.56, folga: 3 }, j: { farol: 'quadrado', lanterna: 'vertical', paraChoque: 'preto', rodas: 'calota', portas: 2, colunas: [0.48] } },
  ep_ford_f1000: { m: { L: 5110, H: 1840, W: 2920, D: 760, bf: 820 }, a: 'picape', o: { curva: 0.5, nariz: 0.66 }, j: { farol: 'redondo', lanterna: 'vertical', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', portas: 2, colunas: [0.5] } },
  ep_gm_s10: { m: { L: 5180, H: 1700, W: 3030, D: 720, bf: 860 }, a: 'picape', o: { curva: 0.9 }, j: { farol: 'quadrado', lanterna: 'vertical', paraChoque: 'cor', estribo: true, rodas: 'liga', raios: 6, portas: 4, colunas: [0.5] } },
  ep_ford_ecosport: { m: { L: 4228, H: 1679, W: 2490, D: 660, bf: 800 }, a: 'suv', o: { curva: 1.1 }, j: { farol: 'gota', lanterna: 'vertical', paraChoque: 'preto', rack: true, cava: true, rodas: 'liga', raios: 5 } },
  ep_renault_duster: { m: { L: 4315, H: 1695, W: 2673, D: 680, bf: 820 }, a: 'suv', o: { curva: 0.9 }, j: { farol: 'fino', lanterna: 'vertical', paraChoque: 'preto', rack: true, cava: true, rodas: 'liga', raios: 6 } },
  ep_jeep_renegade: { m: { L: 4232, H: 1690, W: 2570, D: 690, bf: 840 }, a: 'suv', o: { curva: 0.6, nariz: 0.62 }, j: { farol: 'redondo', lanterna: 'bloco', paraChoque: 'preto', cava: true, rodas: 'liga', raios: 7 } },
  /* ------------------------------------------------------------ compactos */
  fiat_mobi: { m: { L: 3566, H: 1490, W: 2305, D: 580, bf: 640 }, a: 'compacto', o: { tT: 0.94, tras: 0.72 }, j: { rodas: 'calota', farol: 'alto', lanterna: 'vertical' } },
  renault_kwid: { m: { L: 3680, H: 1474, W: 2423, D: 590, bf: 680 }, a: 'compacto', o: { vao: 180, nariz: 0.6 }, j: { rack: true, cava: true, farol: 'alto', rodas: 'calota', paraChoque: 'preto' } },
  citroen_c3: { m: { L: 3980, H: 1570, W: 2540, D: 640, bf: 800 }, a: 'compacto', o: { vao: 185, nariz: 0.6, cint: 0.62 }, j: { cava: true, tetoCor: '#f1eee7', rodas: 'liga', raios: 6, farol: 'fino', lanterna: 'vertical' } },
  kia_picanto: { m: { L: 3595, H: 1485, W: 2400, D: 590, bf: 690 }, a: 'compacto', o: { tT: 0.93 }, j: { farol: 'fino', raios: 5, lanterna: 'vertical' } },
  dacia_sandero: { m: { L: 4088, H: 1499, W: 2604, D: 620, bf: 820 }, a: 'compacto', o: { tT: 0.91, tras: 0.66 }, j: { farol: 'fino', rodas: 'calota', lanterna: 'vertical' } },
  vw_fusca_1972: { m: { L: 4060, H: 1500, W: 2400, D: 640, bf: 760 }, a: 'besouro', j: { costas: 8, paralamaSolto: true, farol: 'paralama', lanterna: 'redonda', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', colunas: [0.36], portas: 2 } },
  vw_beetle_1967: { m: { L: 4080, H: 1500, W: 2400, D: 640, bf: 770 }, a: 'besouro', o: { tT: 0.58, tras: 0.5 }, j: { costas: 8, paralamaSolto: true, farol: 'paralama', lanterna: 'redonda', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', colunas: [0.36], portas: 2, faixaBranca: true } },
  vw_brasilia_1978: { m: { L: 4013, H: 1435, W: 2400, D: 610, bf: 780 }, a: 'suv', o: { vao: 150, tT: 0.965, tras: 0.62, nariz: 0.56, cint: 0.6, curva: 0.8, folga: 2.8 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', colunas: [0.4], portas: 2, extras: { cromado: true } } },
  mini_cooper_s_1965: { m: { L: 3054, H: 1346, W: 2036, D: 480, bf: 470 }, a: 'compacto', o: { tT: 0.96, tras: 0.7, nariz: 0.6, pb: 0.31, para: 0.14, curva: 1.3, cint: 0.6, vao: 150 }, j: { farol: 'redondo', lanterna: 'vertical', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', tetoCor: '#ecebe6', rodas: 'calota', colunas: [0.36], portas: 2 } },
  fiat_500_1968: { m: { L: 2970, H: 1325, W: 1840, D: 500, bf: 560 }, a: 'besouro', o: { vao: 160, tT: 0.66, tras: 0.62, cauda: 160, cint: 0.58, nariz: 0.5, curva: 1.8, pb: 0.3 }, j: { costas: 3, farol: 'redondo', lanterna: 'redonda', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', capota: '#3b3936', rodas: 'calota', colunas: [0.3], portas: 2 } },
  citroen_2cv_1970: { m: { L: 3830, H: 1600, W: 2400, D: 640, bf: 700 }, a: 'besouro', o: { tT: 0.7, tras: 0.55, cauda: 220, nariz: 0.55, pb: 0.3, para: 0.08, curva: 1.6, cint: 0.6 }, j: { costas: 5, paralamaSolto: true, farol: 'paralama', lanterna: 'redonda', capota: '#77736c', moldura: 'cor', espelho: 'nenhum', rodas: 'calota', colunas: [0.5], portas: 4 } },
  /* ------------------------------------------------------------ hatches */
  fiat_argo: { m: { L: 4000, H: 1505, W: 2521, D: 610, bf: 800 }, a: 'hatch', j: { farol: 'fino', raios: 6, lanterna: 'fina' } },
  vw_polo: { m: { L: 4057, H: 1468, W: 2566, D: 620, bf: 820 }, a: 'hatch', o: { tT: 0.9 }, j: { farol: 'fino', raios: 5, lanterna: 'fina', barbatana: true } },
  hyundai_hb20: { m: { L: 3940, H: 1470, W: 2530, D: 610, bf: 780 }, a: 'hatch', o: { tT: 0.87, tras: 0.65 }, j: { farol: 'fino', raios: 10, lanterna: 'barra' } },
  chevrolet_onix: { m: { L: 4163, H: 1476, W: 2551, D: 620, bf: 860 }, a: 'hatch', o: { tT: 0.88 }, j: { farol: 'fino', raios: 6, lanterna: 'fina' } },
  toyota_yaris: { m: { L: 3940, H: 1500, W: 2550, D: 620, bf: 790 }, a: 'hatch', o: { tT: 0.9, nariz: 0.53 }, j: { farol: 'fino', raios: 7, lanterna: 'vertical' } },
  renault_clio: { m: { L: 4050, H: 1440, W: 2583, D: 630, bf: 820 }, a: 'hatch', o: { tT: 0.87, cintT: 0.67 }, j: { farol: 'fino', raios: 5, lanterna: 'fina', portas: 4 } },
  suzuki_swift: { m: { L: 3860, H: 1495, W: 2450, D: 600, bf: 760 }, a: 'hatch', o: { tT: 0.91, tras: 0.69 }, j: { farol: 'fino', raios: 8, lanterna: 'vertical', tetoCor: '#1f1f22' } },
  vw_golf: { m: { L: 4284, H: 1456, W: 2636, D: 640, bf: 880 }, a: 'hatch', o: { tT: 0.9, colC: 220 }, j: { farol: 'fino', raios: 5, lanterna: 'fina', barbatana: true } },
  vw_golf_gti: { m: { L: 4287, H: 1442, W: 2631, D: 650, bf: 880, vao: 125 }, a: 'hatch', o: { tT: 0.9, colC: 220, folga: 2.2 }, j: { farol: 'fino', raios: 12, perfilBaixo: true, lanterna: 'fina', saia: true, ponteiras: 2, corAro: '#55585d', extras: { asa: 'baixa', faixa: 'lateral' } } },
  honda_civic_type_r: { m: { L: 4594, H: 1407, W: 2735, D: 660, bf: 950, vao: 120 }, a: 'hatch', o: { tT: 0.84, tras: 0.68, colC: 260, folga: 2 }, j: { farol: 'fino', raios: 9, perfilBaixo: true, corAro: '#26272a', lanterna: 'barra', saia: true, guelra: true, ponteiras: 3, extras: { asa: 'alta' } } },
  lancia_delta_integrale_1992: { m: { L: 3900, H: 1365, W: 2480, D: 610, bf: 720, vao: 130 }, a: 'hatch', o: { tT: 0.92, tras: 0.68, curva: 0.6, nariz: 0.58 }, j: { farol: 'quadrado', lanterna: 'bloco', raios: 8, cava: true, paraChoque: 'preto', guelra: true, extras: { asa: 'baixa' } } },
  /* ------------------------------------------------------------ sedãs */
  chevrolet_onix_plus: { m: { L: 4474, H: 1484, W: 2600, D: 620, bf: 860 }, a: 'seda', j: { rodas: 'calota', farol: 'fino', lanterna: 'fina' } },
  honda_city: { m: { L: 4549, H: 1477, W: 2600, D: 620, bf: 900 }, a: 'seda', o: { tT: 0.7, vol: 0.85 }, j: { farol: 'fino', raios: 10, lanterna: 'fina' } },
  vw_virtus: { m: { L: 4561, H: 1468, W: 2651, D: 630, bf: 880 }, a: 'seda', o: { tT: 0.71 }, j: { farol: 'fino', raios: 5, lanterna: 'barra' } },
  toyota_corolla: { m: { L: 4630, H: 1455, W: 2700, D: 650, bf: 910 }, a: 'seda', o: { tT: 0.7, vol: 0.85 }, j: { farol: 'fino', raios: 10, lanterna: 'fina', barbatana: true } },
  honda_civic: { m: { L: 4674, H: 1415, W: 2735, D: 660, bf: 920 }, a: 'fastback', o: { tT: 0.66, tras: 0.71, cauda: 70 }, j: { farol: 'fino', raios: 10, lanterna: 'barra', barbatana: true } },
  bmw_320i: { m: { L: 4709, H: 1435, W: 2851, D: 650, bf: 800 }, a: 'seda', o: { pb: 0.36, tT: 0.73, vol: 0.86, para: 0.19 }, j: { farol: 'fino', raios: 5, lanterna: 'fina', barbatana: true } },
  mercedes_c300: { m: { L: 4751, H: 1438, W: 2865, D: 660, bf: 830 }, a: 'seda', o: { pb: 0.35, tT: 0.74, vol: 0.87, cint: 0.66 }, j: { farol: 'fino', raios: 5, lanterna: 'fina', moldura: 'cromo', barbatana: true } },
  nissan_versa: { m: { L: 4495, H: 1474, W: 2620, D: 610, bf: 870 }, a: 'seda', o: { tT: 0.71, vol: 0.85 }, j: { farol: 'fino', raios: 6, lanterna: 'fina' } },
  toyota_camry: { m: { L: 4885, H: 1445, W: 2825, D: 660, bf: 960 }, a: 'seda', o: { tT: 0.7, vol: 0.86, para: 0.22 }, j: { farol: 'fino', raios: 10, lanterna: 'barra', moldura: 'cromo' } },
  hyundai_elantra: { m: { L: 4675, H: 1415, W: 2720, D: 640, bf: 900 }, a: 'fastback', o: { tT: 0.62, tras: 0.7, cauda: 60 }, j: { farol: 'fino', raios: 5, lanterna: 'barra', colunas: [0.48] } },
  tesla_model3: { m: { L: 4720, H: 1441, W: 2875, D: 670, bf: 860 }, a: 'fastback', o: { tT: 0.64, tras: 0.68, nariz: 0.47, cauda: 70 }, j: { farol: 'fino', raios: 10, corAro: '#55585d', lanterna: 'fina', espelho: 'preto', tetoCor: '#26292d' } },
  maybach_s680: { m: { L: 5469, H: 1510, W: 3396, D: 740, bf: 930 }, a: 'luxo', o: { tT: 0.75, colC: 260 }, j: { farol: 'fino', raios: 10, corAro: '#e2e0db', lanterna: 'fina', moldura: 'cromo', grade: true, colunas: [0.45, 0.82], portas: 4, tetoCor: '#1f1f22' } },
  rolls_ghost: { m: { L: 5546, H: 1571, W: 3295, D: 760, bf: 900 }, a: 'luxo', o: { cint: 0.68, nariz: 0.65, pb: 0.37, colC: 300 }, j: { farol: 'quadrado', rodas: 'calota', corAro: '#e2e0db', lanterna: 'vertical', moldura: 'cromo', grade: true, colunas: [0.48] } },
  chevrolet_opala_ss: { m: { L: 4575, H: 1380, W: 2667, D: 640, bf: 900 }, a: 'seda', o: { tT: 0.66, vol: 0.78, cint: 0.62, nariz: 0.62, curva: 0.9, pb: 0.37 }, j: { farol: 'redondo', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 6, corAro: '#3a3633', colunas: [0.28], portas: 2, extras: { faixa: 'dupla' } } },
  porsche_taycan: { m: { L: 4963, H: 1379, W: 2900, D: 700, bf: 900 }, a: 'fastback', o: { nariz: 0.45, tT: 0.64, tras: 0.66, cauda: 120, colC: 200 }, j: { farol: 'paralama', raios: 10, perfilBaixo: true, lanterna: 'barra', colunas: [0.45], ombro: 2 } },
  mercedes_s500: { m: { L: 5289, H: 1503, W: 3216, D: 720, bf: 920 }, a: 'luxo', o: { tT: 0.74 }, j: { farol: 'fino', raios: 10, lanterna: 'fina', moldura: 'cromo', colunas: [0.5] } },
  rolls_phantom: { m: { L: 5762, H: 1646, W: 3552, D: 790, bf: 920 }, a: 'luxo', o: { cint: 0.69, nariz: 0.68, pb: 0.39, tT: 0.76, vol: 0.86, colC: 360 }, j: { farol: 'quadrado', rodas: 'calota', corAro: '#e2e0db', lanterna: 'vertical', moldura: 'cromo', grade: true, colunas: [0.5] } },
  ford_landau_1980: { m: { L: 5600, H: 1430, W: 3015, D: 690, bf: 1100 }, a: 'classico_us', o: { cint: 0.6, tT: 0.66, vol: 0.79, curva: 0.6, colC: 380 }, j: { farol: 'quadrado', lanterna: 'vertical', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', faixaBranca: true, tetoCor: '#ecebe6', grade: true, colunas: [0.5], extras: { cromado: true } } },
  chevrolet_bel_air_1957: { m: { L: 5000, H: 1500, W: 2921, D: 700, bf: 1000 }, a: 'classico_us', o: { vol: 0.75 }, j: { farol: 'redondo', lanterna: 'aleta', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', faixaBranca: true, tetoCor: '#ecebe6', colunas: [0.52], extras: { aletas: 5, cromado: true } } },
  cadillac_eldorado_1959: { m: { L: 5715, H: 1380, W: 3302, D: 720, bf: 1100 }, a: 'classico_us', o: { tT: 0.67, vol: 0.76, cint: 0.58, nariz: 0.62 }, j: { farol: 'redondo', lanterna: 'aleta', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', faixaBranca: true, colunas: [0.35], portas: 2, extras: { aletas: 13, cromado: true } } },
  bmw_m3_e30_1988: { m: { L: 4345, H: 1370, W: 2562, D: 610, bf: 800 }, a: 'seda', o: { tT: 0.7, vol: 0.83, tras: 0.72, curva: 0.55, nariz: 0.56, pb: 0.36 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'preto', raios: 8, corAro: '#d4d2cc', cava: true, colunas: [0.32], portas: 2, extras: { asa: 'baixa' } } },
  /* ------------------------------------------------------------ SUVs compactos */
  vw_nivus: { m: { L: 4266, H: 1493, W: 2566, D: 650, bf: 860 }, a: 'suv_cupe', o: { tT: 0.76, tras: 0.64 }, j: { farol: 'fino', raios: 5, lanterna: 'barra', tetoCor: '#2b2826', cava: true } },
  hyundai_creta: { m: { L: 4330, H: 1635, W: 2610, D: 680, bf: 860 }, a: 'suv', j: { farol: 'fino', raios: 6, lanterna: 'vertical', rack: true, cava: true } },
  jeep_renegade: { m: { L: 4255, H: 1700, W: 2570, D: 690, bf: 850 }, a: 'jipe', o: { vao: 200, para: 0.12, nariz: 0.6, tT: 0.97, curva: 0.7 }, j: { farol: 'redondo', lanterna: 'bloco', raios: 7, rack: true, cava: true, paraChoque: 'preto' } },
  chevrolet_tracker: { m: { L: 4270, H: 1626, W: 2570, D: 680, bf: 860 }, a: 'suv', o: { tT: 0.94, tras: 0.62 }, j: { farol: 'fino', raios: 6, lanterna: 'vertical', cava: true } },
  porsche_macan: { m: { L: 4726, H: 1621, W: 2807, D: 740, bf: 900 }, a: 'suv_cupe', o: { tT: 0.74, nariz: 0.52 }, j: { farol: 'paralama', raios: 5, perfilBaixo: true, lanterna: 'barra', ombro: 1.5 } },
  ferrari_purosangue: { m: { L: 4973, H: 1589, W: 3018, D: 760, bf: 900 }, a: 'suv_cupe', o: { pb: 0.38, para: 0.2, tT: 0.73, nariz: 0.5, cint: 0.64, cauda: 160 }, j: { farol: 'fino', raios: 5, perfilBaixo: true, lanterna: 'redonda', guelra: true, ponteiras: 2 } },
  lamborghini_urus: { m: { L: 5112, H: 1638, W: 3003, D: 770, bf: 1000 }, a: 'suv_cupe', o: { tT: 0.7, nariz: 0.5, cint: 0.64, cauda: 180 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, corAro: '#26272a', lanterna: 'fina', cava: true, ponteiras: 2 } },
  toyota_bandeirante_1985: { m: { L: 4100, H: 1950, W: 2285, D: 760, bf: 640 }, a: 'jipe', o: { nariz: 0.6, pb: 0.36, tT: 0.985 }, j: { farol: 'redondo', lanterna: 'bloco', paraChoque: 'preto', moldura: 'cor', espelho: 'preto', rodas: 'cravos', corAro: '#ecebe6', colunas: [0.42], portas: 2, extras: { estepe: true } } },
  /* ------------------------------------------------------------ SUVs médios */
  toyota_corolla_cross: { m: { L: 4460, H: 1620, W: 2640, D: 690, bf: 880 }, a: 'suv', o: { tT: 0.94 }, j: { farol: 'fino', raios: 10, lanterna: 'fina', cava: true } },
  jeep_compass: { m: { L: 4404, H: 1650, W: 2636, D: 700, bf: 880 }, a: 'suv', o: { tT: 0.95, nariz: 0.6 }, j: { farol: 'fino', raios: 7, lanterna: 'fina', cava: true, rack: true } },
  volvo_xc60: { m: { L: 4708, H: 1658, W: 2865, D: 720, bf: 870 }, a: 'suv', o: { tT: 0.95 }, j: { farol: 'fino', raios: 5, lanterna: 'vertical', moldura: 'cromo', tomada: true, rack: true } },
  toyota_rav4: { m: { L: 4600, H: 1685, W: 2690, D: 710, bf: 920 }, a: 'suv', o: { curva: 0.6, nariz: 0.6 }, j: { farol: 'fino', raios: 6, lanterna: 'fina', cava: true, rack: true } },
  honda_crv: { m: { L: 4700, H: 1690, W: 2700, D: 710, bf: 920 }, a: 'suv', o: { tT: 0.94 }, j: { farol: 'fino', raios: 10, lanterna: 'vertical', moldura: 'cromo', rack: true } },
  vw_tiguan: { m: { L: 4701, H: 1675, W: 2790, D: 710, bf: 900 }, a: 'suv', o: { tT: 0.95 }, j: { farol: 'fino', raios: 5, lanterna: 'fina', rack: true, colunas: [0.42, 0.78] } },
  hyundai_tucson: { m: { L: 4630, H: 1665, W: 2755, D: 710, bf: 900 }, a: 'suv', o: { tT: 0.93, tras: 0.62 }, j: { farol: 'fino', raios: 7, lanterna: 'barra', moldura: 'cromo', cava: true } },
  porsche_cayenne: { m: { L: 4930, H: 1696, W: 2895, D: 760, bf: 950 }, a: 'suv', o: { tT: 0.93, nariz: 0.54, tras: 0.62 }, j: { farol: 'paralama', raios: 5, perfilBaixo: true, lanterna: 'barra', ombro: 1.5 } },
  bmw_x5: { m: { L: 4922, H: 1745, W: 2975, D: 770, bf: 880 }, a: 'suv', o: { tT: 0.95, pb: 0.33 }, j: { farol: 'fino', raios: 7, perfilBaixo: true, lanterna: 'fina', moldura: 'cromo', rack: true, colunas: [0.5] } },
  /* ------------------------------------------------------------ SUVs de sete lugares */
  jeep_commander: { m: { L: 4769, H: 1730, W: 2794, D: 720, bf: 880 }, a: 'suv', o: { tT: 0.96 }, j: { farol: 'fino', raios: 7, lanterna: 'fina', rack: true, cava: true, colunas: [0.38, 0.72] } },
  toyota_sw4: { m: { L: 4795, H: 1835, W: 2745, D: 760, bf: 900 }, a: 'suv', o: { tT: 0.96, vao: 250, nariz: 0.6 }, j: { farol: 'fino', raios: 6, rodas: 'liga', lanterna: 'vertical', rack: true, estribo: true, cava: true, colunas: [0.38, 0.72] } },
  chevrolet_tahoe: { m: { L: 5352, H: 1927, W: 3071, D: 800, bf: 1000 }, a: 'suv', o: { tT: 0.975, nariz: 0.66, curva: 0.6, vao: 230 }, j: { farol: 'alto', raios: 6, lanterna: 'vertical', rack: true, estribo: true, grade: true, colunas: [0.36, 0.7] } },
  toyota_land_cruiser: { m: { L: 4985, H: 1925, W: 2850, D: 790, bf: 950 }, a: 'suv', o: { tT: 0.97, nariz: 0.64, curva: 0.6, vao: 235 }, j: { farol: 'alto', raios: 6, lanterna: 'vertical', rack: true, estribo: true, colunas: [0.38, 0.72] } },
  rolls_cullinan: { m: { L: 5341, H: 1835, W: 3295, D: 820, bf: 900 }, a: 'suv', o: { tT: 0.96, nariz: 0.68, pb: 0.36, tras: 0.62 }, j: { farol: 'quadrado', rodas: 'calota', corAro: '#e2e0db', lanterna: 'vertical', moldura: 'cromo', grade: true, colunas: [0.5] } },
  range_rover: { m: { L: 5052, H: 1870, W: 2997, D: 800, bf: 900 }, a: 'suv', o: { tT: 0.97, nariz: 0.64, curva: 0.7 }, j: { farol: 'fino', raios: 7, lanterna: 'vertical', tetoCor: '#1f1f22', moldura: 'preta', espelho: 'preto', colunas: [0.5] } },
  mercedes_g63: { m: { L: 4873, H: 1969, W: 2890, D: 800, bf: 780 }, a: 'jipe', o: { pb: 0.31, tT: 0.955 }, j: { farol: 'redondo', lanterna: 'bloco', raios: 5, perfilBaixo: true, paraChoque: 'cor', espelho: 'cor', estribo: true, colunas: [0.5], extras: { estepe: true } } },
  cadillac_escalade: { m: { L: 5382, H: 1948, W: 3071, D: 820, bf: 1000 }, a: 'suv', o: { tT: 0.975, nariz: 0.67, curva: 0.5, vao: 220 }, j: { farol: 'alto', raios: 6, lanterna: 'vertical', moldura: 'cromo', estribo: true, grade: true, colunas: [0.36, 0.7] } },
  bentley_bentayga: { m: { L: 5125, H: 1742, W: 2995, D: 790, bf: 950 }, a: 'suv', o: { tT: 0.94, nariz: 0.6, tras: 0.62 }, j: { farol: 'redondo', raios: 10, lanterna: 'fina', moldura: 'cromo', grade: true, rack: true, ombro: 1.5 } },
  /* ------------------------------------------------------------ picapes */
  chevrolet_s10: { m: { L: 5361, H: 1800, W: 3096, D: 780, bf: 900 }, a: 'picape', j: { farol: 'fino', raios: 6, lanterna: 'vertical', estribo: true, colunas: [0.5] } },
  toyota_hilux: { m: { L: 5325, H: 1815, W: 3085, D: 780, bf: 900 }, a: 'picape', o: { nariz: 0.62 }, j: { farol: 'fino', raios: 6, lanterna: 'vertical', estribo: true, santoAntonio: true, cava: true, colunas: [0.5] } },
  ford_f150: { m: { L: 5890, H: 1960, W: 3683, D: 820, bf: 960 }, a: 'picape', o: { nariz: 0.68, vol: 0.6, curva: 0.6 }, j: { farol: 'alto', raios: 6, lanterna: 'vertical', estribo: true, grade: true, colunas: [0.5] } },
  ford_ranger: { m: { L: 5370, H: 1880, W: 3270, D: 800, bf: 880 }, a: 'picape', o: { nariz: 0.64, curva: 0.7 }, j: { farol: 'alto', raios: 6, lanterna: 'vertical', estribo: true, cava: true, colunas: [0.5] } },
  /* ------------------------------------------------------------ esportivos de motor dianteiro */
  ford_mustang: { m: { L: 4811, H: 1396, W: 2720, D: 690, bf: 920 }, a: 'muscle', o: { tT: 0.66, tras: 0.73, cauda: 70 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, lanterna: 'vertical', colunas: [0.28], portas: 2, ponteiras: 2 } },
  mazda_mx5: { m: { L: 3915, H: 1235, W: 2310, D: 610, bf: 770 }, a: 'roadster', o: { tT: 0.67, vol: 0.73 }, j: { farol: 'fino', raios: 10, lanterna: 'redonda', capota: '#2b2826', colunas: [0.99], portas: 2 } },
  toyota_gr86: { m: { L: 4265, H: 1310, W: 2575, D: 640, bf: 850 }, a: 'gt', o: { pb: 0.4, tT: 0.72, tras: 0.73, cauda: 100 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, lanterna: 'fina', guelra: true, colunas: [0.3], portas: 2, ponteiras: 2, extras: { asa: 'baixa' } } },
  toyota_supra: { m: { L: 4379, H: 1292, W: 2470, D: 660, bf: 880 }, a: 'gt', o: { tT: 0.7, tras: 0.7 }, j: { farol: 'fino', raios: 5, perfilBaixo: true, corAro: '#55585d', lanterna: 'fina', ombro: 4, colunas: [0.99], portas: 2, ponteiras: 2, extras: { asa: 'ducktail' } } },
  chevrolet_corvette: { m: { L: 4630, H: 1234, W: 2722, D: 660, bf: 980 }, a: 'central', o: { tT: 0.6, vol: 0.79 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, lanterna: 'fina', colunas: [0.99], portas: 2, ponteiras: 4, extras: { tomadas: true, asa: 'baixa' } } },
  porsche_718_cayman: { m: { L: 4379, H: 1295, W: 2475, D: 660, bf: 900 }, a: 'central', o: { nariz: 0.46, tT: 0.6, vol: 0.76, tras: 0.72 }, j: { farol: 'paralama', raios: 5, perfilBaixo: true, lanterna: 'barra', ombro: 3, colunas: [0.22], portas: 2, ponteiras: 1, extras: { tomadas: true } } },
  bmw_m4: { m: { L: 4794, H: 1393, W: 2857, D: 670, bf: 870 }, a: 'gt', o: { pb: 0.37, tT: 0.71, tras: 0.73, cauda: 90 }, j: { farol: 'fino', raios: 7, perfilBaixo: true, lanterna: 'fina', guelra: true, colunas: [0.25], portas: 2, ponteiras: 4 } },
  aston_db12: { m: { L: 4725, H: 1295, W: 2805, D: 700, bf: 900 }, a: 'gt', o: { pb: 0.45, tT: 0.73, cauda: 120 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, lanterna: 'fina', guelra: true, colunas: [0.99], portas: 2, ponteiras: 2, bojo: 1.5 } },
  mercedes_amg_gt: { m: { L: 4728, H: 1354, W: 2700, D: 690, bf: 920 }, a: 'gt', o: { pb: 0.44, tT: 0.72 }, j: { farol: 'fino', raios: 5, perfilBaixo: true, lanterna: 'fina', guelra: true, colunas: [0.99], ponteiras: 2, extras: { asa: 'baixa' } } },
  ferrari_roma: { m: { L: 4656, H: 1301, W: 2670, D: 690, bf: 940 }, a: 'gt', o: { pb: 0.44, tT: 0.72, cauda: 110 }, j: { farol: 'fino', raios: 5, perfilBaixo: true, lanterna: 'redonda', colunas: [0.99], portas: 2, ponteiras: 4, bojo: 1 } },
  bentley_continental: { m: { L: 4850, H: 1405, W: 2851, D: 720, bf: 900 }, a: 'gt', o: { pb: 0.42, tT: 0.74, cint: 0.68, tras: 0.72 }, j: { farol: 'redondo', raios: 10, perfilBaixo: true, lanterna: 'fina', moldura: 'cromo', grade: true, colunas: [0.22], portas: 2, ombro: 2 } },
  rolls_spectre: { m: { L: 5475, H: 1573, W: 3210, D: 800, bf: 950 }, a: 'gt', o: { pb: 0.4, tT: 0.74, cint: 0.68, nariz: 0.62, tras: 0.7, cauda: 220 }, j: { farol: 'fino', rodas: 'calota', corAro: '#e2e0db', lanterna: 'vertical', moldura: 'cromo', grade: true, colunas: [0.25], portas: 2 } },
  bentley_bacalar: { m: { L: 4800, H: 1300, W: 2851, D: 730, bf: 900 }, a: 'roadster', o: { tT: 0.62, vol: 0.7, cint: 0.74 }, j: { farol: 'redondo', raios: 10, perfilBaixo: true, corAro: '#c9a23a', lanterna: 'fina', grade: true, semTeto: true, portas: 2, ombro: 2 } },
  /* ------------------------------------------------------------ superesportivos (motor central e o 911) */
  porsche_911: { m: { L: 4519, H: 1298, W: 2450, D: 690, bf: 960 }, a: 'traseiro', j: { costas: 2.5, farol: 'paralama', raios: 10, perfilBaixo: true, lanterna: 'barra', ombro: 4, colunas: [0.25], portas: 2, ponteiras: 2 } },
  porsche_911_turbo: { m: { L: 4535, H: 1303, W: 2450, D: 700, bf: 960 }, a: 'traseiro', o: { tras: 0.64 }, j: { costas: 2.5, farol: 'paralama', raios: 5, perfilBaixo: true, corAro: '#55585d', lanterna: 'barra', ombro: 5.5, colunas: [0.25], portas: 2, entrada: true, ponteiras: 2, extras: { asa: 'baixa' } } },
  porsche_911_dakar: { m: { L: 4530, H: 1338, W: 2450, D: 720, bf: 960, vao: 160 }, a: 'traseiro', o: { folga: 4 }, j: { costas: 2.5, farol: 'paralama', raios: 5, rodas: 'cravos', corAro: '#e2e0db', lanterna: 'barra', ombro: 4, colunas: [0.25], portas: 2, rack: true, cava: true } },
  porsche_911_st: { m: { L: 4573, H: 1300, W: 2450, D: 690, bf: 960 }, a: 'traseiro', j: { costas: 2.5, farol: 'paralama', raios: 10, perfilBaixo: true, corAro: '#c9a23a', lanterna: 'barra', ombro: 4, colunas: [0.25], portas: 2, ponteiras: 2, extras: { asa: 'ducktail' } } },
  mclaren_artura: { m: { L: 4539, H: 1193, W: 2640, D: 680, bf: 1000 }, a: 'central', o: { tT: 0.62, vol: 0.8, tras: 0.82 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, lanterna: 'fina', colunas: [0.18], portas: 2, ponteiras: 2, extras: { tomadas: true } } },
  lamborghini_huracan: { m: { L: 4520, H: 1165, W: 2620, D: 680, bf: 1000 }, a: 'central', j: { farol: 'fino', raios: 5, perfilBaixo: true, corAro: '#26272a', lanterna: 'fina', colunas: [0.25], portas: 2, ponteiras: 2, saia: true, extras: { tomadas: true } } },
  mclaren_765lt: { m: { L: 4600, H: 1193, W: 2670, D: 690, bf: 1050 }, a: 'central', o: { tT: 0.62, vol: 0.8, tras: 0.84 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, corAro: '#26272a', lanterna: 'fina', colunas: [0.18], portas: 2, ponteiras: 4, saia: true, extras: { tomadas: true, asa: 'alta' } } },
  /* ------------------------------------------------------------ clássicos */
  ford_mustang_1967: { m: { L: 4661, H: 1308, W: 2743, D: 670, bf: 900 }, a: 'muscle', o: { tT: 0.68, tras: 0.73, cauda: 40 }, j: { farol: 'redondo', lanterna: 'vertical', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 5, corAro: '#d4d2cc', colunas: [0.3], portas: 2, guelra: true, extras: { cromado: true } } },
  ferrari_308: { m: { L: 4230, H: 1120, W: 2340, D: 610, bf: 950 }, a: 'central', o: { tT: 0.6, vol: 0.78, nariz: 0.44, curva: 1.2 }, j: { farol: 'escamoteavel', raios: 5, lanterna: 'redonda', colunas: [0.22], portas: 2, tetoCor: '#1f1f22', extras: { tomadas: true } } },
  mercedes_280sl: { m: { L: 4285, H: 1320, W: 2400, D: 650, bf: 850 }, a: 'roadster', o: { tT: 0.67, vol: 0.73, nariz: 0.6, cint: 0.66, curva: 0.8, cauda: 30 }, j: { farol: 'quadrado', lanterna: 'vertical', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', faixaBranca: true, tetoCor: '#ecebe6', colunas: [0.99], portas: 2, grade: true } },
  porsche_911_1973: { m: { L: 4147, H: 1320, W: 2271, D: 640, bf: 850 }, a: 'traseiro', o: { cauda: 260, curva: 1.8 }, j: { costas: 3.5, farol: 'paralama', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 5, corAro: '#d4d2cc', ombro: 3, colunas: [0.3], portas: 2 } },
  jaguar_etype: { m: { L: 4453, H: 1220, W: 2438, D: 660, bf: 1250 }, a: 'gt', o: { pb: 0.5, para: 0.17, tT: 0.76, tras: 0.7, nariz: 0.42, curva: 1.8, cauda: 200 }, j: { costas: 2, farol: 'gota', lanterna: 'redonda', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'raios', colunas: [0.99], portas: 2, bojo: 3 } },
  vw_sp2_1973: { m: { L: 4220, H: 1160, W: 2400, D: 600, bf: 900 }, a: 'gt', o: { pb: 0.4, tT: 0.7, tras: 0.72, curva: 0.7, cauda: 80 }, j: { farol: 'quadrado', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', colunas: [0.18], portas: 2, guelra: true, extras: { cromado: true } } },
  willys_interlagos_1964: { m: { L: 3850, H: 1130, W: 2100, D: 570, bf: 760 }, a: 'gt', o: { pb: 0.37, para: 0.17, tT: 0.66, tras: 0.68, nariz: 0.46, curva: 1.8, cauda: 220 }, j: { costas: 3, farol: 'gota', lanterna: 'redonda', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', colunas: [0.99], portas: 2, extras: { cromado: true } } },
  puma_gte_1976: { m: { L: 4000, H: 1120, W: 2150, D: 590, bf: 790 }, a: 'gt', o: { pb: 0.38, tT: 0.68, tras: 0.7, nariz: 0.48, curva: 1.4, cauda: 160 }, j: { farol: 'gota', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 4, corAro: '#d4d2cc', colunas: [0.99], portas: 2 } },
  ford_maverick_gt_1974: { m: { L: 4720, H: 1350, W: 2790, D: 660, bf: 950 }, a: 'muscle', o: { tT: 0.67, tras: 0.72, cauda: 70, curva: 0.9 }, j: { farol: 'redondo', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 8, corAro: '#3a3633', colunas: [0.3], portas: 2, extras: { cromado: true, faixa: 'lateral' } } },
  dodge_charger_rt_1971: { m: { L: 5280, H: 1340, W: 2921, D: 690, bf: 1050 }, a: 'muscle', o: { pb: 0.44, tT: 0.68, tras: 0.73, cauda: 60, nariz: 0.64 }, j: { farol: 'escamoteavel', lanterna: 'barra', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 6, corAro: '#3a3633', tetoCor: '#1f1f22', colunas: [0.99], portas: 2, extras: { cromado: true } } },
  datsun_240z_1971: { m: { L: 4115, H: 1285, W: 2305, D: 620, bf: 900 }, a: 'gt', o: { pb: 0.44, tT: 0.68, tras: 0.72, cauda: 50, curva: 1.1 }, j: { farol: 'gota', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 8, corAro: '#d4d2cc', colunas: [0.99], portas: 2 } },
  corvette_1963: { m: { L: 4450, H: 1265, W: 2490, D: 660, bf: 1000 }, a: 'gt', o: { pb: 0.46, tT: 0.68, tras: 0.68, nariz: 0.44, cauda: 150, curva: 1.3 }, j: { farol: 'escamoteavel', lanterna: 'redonda', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', faixaBranca: true, colunas: [0.99], portas: 2, guelra: true, bojo: 2, extras: { cromado: true } } },
  shelby_gt500_1967: { m: { L: 4740, H: 1310, W: 2743, D: 670, bf: 950 }, a: 'muscle', o: { tT: 0.68, tras: 0.74, cauda: 30 }, j: { farol: 'redondo', lanterna: 'barra', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', raios: 5, corAro: '#d4d2cc', colunas: [0.3], portas: 2, guelra: true, extras: { asa: 'ducktail', cromado: true, faixa: 'dupla' } } },
  ferrari_testarossa_1986: { m: { L: 4485, H: 1130, W: 2550, D: 640, bf: 1000 }, a: 'central', o: { tT: 0.6, vol: 0.79, tras: 0.82, curva: 0.7 }, j: { farol: 'escamoteavel', raios: 5, lanterna: 'barra', colunas: [0.18], portas: 2, extras: { tomadas: true } } },
  porsche_911_rs_1973: { m: { L: 4147, H: 1320, W: 2271, D: 650, bf: 850 }, a: 'traseiro', o: { cauda: 260, curva: 1.8 }, j: { costas: 3.5, farol: 'paralama', lanterna: 'bloco', paraChoque: 'cromo', moldura: 'preta', espelho: 'cromo', raios: 5, corAro: '#d4d2cc', ombro: 3.5, colunas: [0.3], portas: 2, extras: { asa: 'ducktail', faixa: 'lateral' } } },
  lamborghini_countach_1985: { m: { L: 4140, H: 1070, W: 2450, D: 660, bf: 950 }, a: 'central', o: { tT: 0.58, vol: 0.76, tras: 0.86, curva: 0.4, nariz: 0.36, para: 0.25 }, j: { farol: 'escamoteavel', raios: 5, lanterna: 'bloco', colunas: [0.3], portas: 2, extras: { asa: 'alta', tomadas: true } } },
  toyota_2000gt_1967: { m: { L: 4175, H: 1160, W: 2330, D: 620, bf: 950 }, a: 'gt', o: { pb: 0.46, tT: 0.72, tras: 0.68, nariz: 0.44, curva: 1.6, cauda: 160 }, j: { costas: 2, farol: 'gota', lanterna: 'redonda', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'raios', colunas: [0.99], portas: 2 } },
  mercedes_300sl_1955: { m: { L: 4520, H: 1300, W: 2400, D: 680, bf: 1000 }, a: 'gt', o: { pb: 0.46, tT: 0.72, tras: 0.66, nariz: 0.5, curva: 1.7, cauda: 220 }, j: { costas: 2, farol: 'redondo', lanterna: 'vertical', paraChoque: 'cromo', moldura: 'cromo', espelho: 'cromo', rodas: 'calota', colunas: [0.99], portas: 2, guelra: true, bojo: 1.5, extras: { cromado: true } } },
  /* ------------------------------------------------------------ VIDA 12.9: luxo, superesportivos, edições limitadas */
  ferrari_296: { m: { L: 4565, H: 1186, W: 2600, D: 680, bf: 1000 }, a: 'central', o: { tT: 0.6, vol: 0.78 }, j: { farol: 'fino', raios: 5, perfilBaixo: true, lanterna: 'redonda', colunas: [0.2], portas: 2, ponteiras: 1, ombro: 2, extras: { tomadas: true } } },
  lamborghini_revuelto: { m: { L: 4947, H: 1160, W: 2779, D: 700, bf: 1050 }, a: 'central', o: { tT: 0.6, vol: 0.8, tras: 0.82, curva: 0.6, para: 0.24 }, j: { farol: 'fino', raios: 10, perfilBaixo: true, corAro: '#26272a', lanterna: 'fina', colunas: [0.25], portas: 2, saia: true, ponteiras: 2, extras: { tomadas: true } } },
  lamborghini_sterrato: { m: { L: 4525, H: 1248, W: 2620, D: 720, bf: 1000, vao: 165 }, a: 'central', o: { folga: 4 }, j: { farol: 'fino', raios: 6, rodas: 'cravos', corAro: '#e2e0db', lanterna: 'fina', colunas: [0.25], portas: 2, rack: true, cava: true, extras: { tomadas: true } } },
  ferrari_sf90_xx: { m: { L: 4850, H: 1225, W: 2650, D: 690, bf: 1050 }, a: 'central', o: { tT: 0.6, vol: 0.8, tras: 0.8 }, j: { farol: 'fino', raios: 5, perfilBaixo: true, corAro: '#26272a', lanterna: 'redonda', colunas: [0.2], portas: 2, saia: true, ponteiras: 2, extras: { asa: 'alta', tomadas: true } } }
};

/** As formas (para quem não tem modelo: um save antigo, um desenho sem anúncio). */
export const FAMILIAS_13: Record<'compacto' | 'hatch' | 'seda' | 'suv' | 'suv_medio' | 'suv_grande' | 'picape' | 'esportivo', Modelo13> = {
  compacto: { m: { L: 3700, H: 1500, W: 2420, D: 590, bf: 700 }, a: 'compacto', j: { rodas: 'calota', farol: 'alto' } },
  hatch: { m: { L: 4050, H: 1480, W: 2550, D: 620, bf: 820 }, a: 'hatch', j: { farol: 'fino', lanterna: 'fina' } },
  seda: { m: { L: 4600, H: 1460, W: 2680, D: 640, bf: 900 }, a: 'seda', j: { farol: 'fino', lanterna: 'fina' } },
  suv: { m: { L: 4300, H: 1640, W: 2600, D: 680, bf: 860 }, a: 'suv', j: { farol: 'fino', lanterna: 'vertical', rack: true, cava: true } },
  suv_medio: { m: { L: 4600, H: 1680, W: 2720, D: 710, bf: 900 }, a: 'suv', j: { farol: 'fino', lanterna: 'vertical', rack: true, cava: true, colunas: [0.42, 0.78] } },
  suv_grande: { m: { L: 4900, H: 1820, W: 2800, D: 760, bf: 920 }, a: 'suv', o: { tT: 0.965 }, j: { farol: 'alto', lanterna: 'vertical', rack: true, estribo: true, cava: true, colunas: [0.36, 0.7] } },
  picape: { m: { L: 5330, H: 1810, W: 3090, D: 780, bf: 900 }, a: 'picape', j: { farol: 'alto', lanterna: 'vertical', estribo: true, rodas: 'cravos', colunas: [0.5] } },
  esportivo: { m: { L: 4500, H: 1300, W: 2600, D: 670, bf: 920 }, a: 'gt', j: { farol: 'fino', lanterna: 'fina', raios: 5, perfilBaixo: true, colunas: [0.99], portas: 2 } }
};
