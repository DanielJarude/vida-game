/**
 * Contexto populacional (REWORK 4): de onde costumam vir as FAMÍLIAS que
 * vivem em cada país — usado SÓ para gerar a primeira geração (os pais, os
 * avós, quem aparece sem família conhecida). Depois que a família existe, os
 * pais são a fonte da aparência e do nome dos filhos (`sistemas/identidade`).
 *
 * Não é um sistema de "etnias": não há rótulo na tela, nem regra rígida.
 * Cada pessoa tem uma ANCESTRALIDADE em proporções (soma 1) sobre grandes
 * origens geográficas — o que muda a PROBABILIDADE de tom de pele, textura e
 * cor de cabelo, cor e forma dos olhos, nariz e boca. Famílias misturadas são
 * a regra em muitos lugares; a mistura é contínua.
 *
 * `nomes`: a tradição de nomes de uma família que veio de fora (a família
 * japonesa em São Paulo, a mexicana em Los Angeles, a indiana em Londres) —
 * um país com lista de nomes no jogo. O sobrenome segue a família; o prenome,
 * com o tempo, vai ficando do lugar.
 *
 * Proporções aproximadas, para probabilidade de geração (censos e estudos
 * populacionais de cada país; arredondadas). Não são afirmações sobre pessoas.
 */

export type Origem = 'eu' | 'af' | 'ea' | 'sa' | 'mena' | 'am' | 'oc';
export const ORIGENS: Origem[] = ['eu', 'af', 'ea', 'sa', 'mena', 'am', 'oc'];
export type Ancestralidade = Partial<Record<Origem, number>>;

export interface PerfilPopulacional { peso: number; mix: Ancestralidade; nomes?: string }

const P = (peso: number, mix: Ancestralidade, nomes?: string): PerfilPopulacional => ({ peso, mix, ...(nomes ? { nomes } : {}) });

export const POPULACOES: Record<string, PerfilPopulacional[]> = {
  BR: [P(34, { eu: 0.85, af: 0.1, am: 0.05 }), P(38, { eu: 0.48, af: 0.42, am: 0.1 }), P(17, { af: 0.78, eu: 0.17, am: 0.05 }), P(5, { am: 0.55, eu: 0.3, af: 0.15 }), P(1.5, { ea: 0.95, eu: 0.05 }, 'JP'), P(2, { mena: 0.7, eu: 0.3 }), P(1.5, { eu: 0.97 }, 'IT'), P(1, { eu: 0.97 }, 'DE')],
  AR: [P(68, { eu: 0.82, am: 0.15, af: 0.03 }), P(26, { eu: 0.5, am: 0.47, af: 0.03 }), P(3, { eu: 0.97 }, 'IT'), P(2, { am: 0.8, eu: 0.2 }, 'PE'), P(1, { ea: 0.95, eu: 0.05 }, 'KR')],
  CL: [P(70, { eu: 0.55, am: 0.43, af: 0.02 }), P(20, { eu: 0.88, am: 0.12 }), P(6, { am: 0.9, eu: 0.1 }), P(4, { am: 0.6, eu: 0.3, af: 0.1 }, 'PE')],
  CO: [P(55, { eu: 0.5, am: 0.33, af: 0.17 }), P(18, { eu: 0.85, am: 0.12, af: 0.03 }), P(13, { af: 0.75, eu: 0.2, am: 0.05 }), P(8, { am: 0.85, eu: 0.15 }), P(6, { eu: 0.45, am: 0.35, af: 0.2 }, 'DO')],
  PE: [P(50, { am: 0.6, eu: 0.37, af: 0.03 }), P(28, { am: 0.88, eu: 0.12 }), P(13, { eu: 0.85, am: 0.15 }), P(5, { af: 0.6, am: 0.2, eu: 0.2 }), P(1.5, { ea: 0.92, am: 0.08 }, 'JP'), P(1.5, { ea: 0.92, am: 0.08 }, 'CN')],
  UY: [P(80, { eu: 0.87, am: 0.1, af: 0.03 }), P(12, { eu: 0.6, am: 0.3, af: 0.1 }), P(6, { af: 0.7, eu: 0.3 }), P(2, { eu: 0.97 }, 'IT')],
  MX: [P(62, { am: 0.55, eu: 0.4, af: 0.05 }), P(17, { eu: 0.85, am: 0.15 }), P(18, { am: 0.9, eu: 0.1 }), P(2, { af: 0.55, am: 0.3, eu: 0.15 }), P(1, { eu: 0.95 }, 'ES')],
  US: [P(57, { eu: 0.96, af: 0.02, am: 0.02 }), P(12, { af: 0.82, eu: 0.17, am: 0.01 }), P(17, { am: 0.5, eu: 0.45, af: 0.05 }, 'MX'), P(2.5, { ea: 0.97 }, 'CN'), P(1, { ea: 0.97 }, 'KR'), P(1.5, { sa: 0.97 }, 'IN'), P(0.6, { ea: 0.97 }, 'JP'), P(3, { eu: 0.5, af: 0.45, am: 0.05 }), P(1, { am: 0.85, eu: 0.15 }), P(1, { af: 0.97 }, 'NG'), P(1, { eu: 0.45, af: 0.4, am: 0.15 }, 'DO')],
  CA: [P(68, { eu: 0.97 }), P(5, { ea: 0.97 }, 'CN'), P(6, { sa: 0.97 }, 'IN'), P(4, { af: 0.9, eu: 0.1 }), P(5, { am: 0.85, eu: 0.15 }), P(2, { mena: 0.92, eu: 0.08 }, 'MA'), P(1, { ea: 0.97 }, 'KR'), P(6, { eu: 0.97 }, 'FR'), P(1.5, { am: 0.5, eu: 0.45, af: 0.05 }, 'MX'), P(1.5, { eu: 0.95 }, 'IT')],
  CR: [P(78, { eu: 0.6, am: 0.35, af: 0.05 }), P(12, { eu: 0.9, am: 0.1 }), P(4, { af: 0.7, eu: 0.3 }), P(3, { am: 0.9, eu: 0.1 }), P(3, { am: 0.6, eu: 0.35, af: 0.05 }, 'MX')],
  DO: [P(70, { eu: 0.4, af: 0.5, am: 0.1 }), P(16, { af: 0.85, eu: 0.15 }), P(14, { eu: 0.85, af: 0.15 })],
  ZA: [P(80, { af: 0.98, eu: 0.02 }), P(8, { eu: 0.97 }), P(8, { af: 0.45, eu: 0.3, sa: 0.15, ea: 0.1 }), P(2.5, { sa: 0.97 }, 'IN'), P(1.5, { af: 0.97 }, 'NG')],
  AO: [P(94, { af: 0.98, eu: 0.02 }), P(4, { af: 0.6, eu: 0.4 }), P(2, { eu: 0.95, af: 0.05 }, 'PT')],
  MA: [P(97, { mena: 0.88, af: 0.08, eu: 0.04 }), P(2, { af: 0.85, mena: 0.15 }), P(1, { eu: 0.97 }, 'FR')],
  NG: [P(99, { af: 0.99 }), P(1, { mena: 0.6, af: 0.4 })],
  KE: [P(96, { af: 0.99 }), P(2, { sa: 0.97 }, 'IN'), P(1, { af: 0.6, mena: 0.4 }), P(1, { eu: 0.97 }, 'GB')],
  CN: [P(99, { ea: 0.99 }), P(1, { ea: 0.6, mena: 0.3, eu: 0.1 })],
  KR: [P(98, { ea: 0.99 }), P(1, { ea: 0.97 }, 'CN'), P(1, { eu: 0.97 }, 'US')],
  JP: [P(98, { ea: 0.99 }), P(1, { ea: 0.97 }, 'KR'), P(0.5, { ea: 0.97 }, 'CN'), P(0.5, { ea: 0.5, am: 0.25, eu: 0.15, af: 0.1 }, 'BR')],
  IN: [P(99, { sa: 0.98, ea: 0.02 }), P(1, { ea: 0.6, sa: 0.4 })],
  DE: [P(82, { eu: 0.98 }), P(8, { mena: 0.75, eu: 0.25 }), P(3, { eu: 0.97 }, 'IT'), P(2, { eu: 0.97 }, 'ES'), P(1.5, { af: 0.95 }, 'NG'), P(1.5, { mena: 0.9, eu: 0.1 }, 'MA'), P(1, { ea: 0.97 }, 'CN'), P(1, { eu: 0.97 }, 'PT')],
  ES: [P(84, { eu: 0.96, mena: 0.04 }), P(5, { am: 0.35, eu: 0.5, af: 0.15 }, 'CO'), P(4, { mena: 0.9, eu: 0.1 }, 'MA'), P(2, { am: 0.5, eu: 0.45, af: 0.05 }, 'AR'), P(2, { af: 0.97 }, 'NG'), P(1, { ea: 0.97 }, 'CN'), P(2, { am: 0.6, eu: 0.37, af: 0.03 }, 'PE')],
  FR: [P(80, { eu: 0.97, mena: 0.03 }), P(9, { mena: 0.9, eu: 0.1 }, 'MA'), P(5, { af: 0.95, eu: 0.05 }), P(1, { ea: 0.97 }, 'CN'), P(2, { eu: 0.97 }, 'PT'), P(1.5, { eu: 0.97 }, 'IT'), P(1.5, { eu: 0.97 }, 'ES')],
  IT: [P(91, { eu: 0.97, mena: 0.03 }), P(2, { mena: 0.9, eu: 0.1 }, 'MA'), P(1.5, { af: 0.97 }, 'NG'), P(1, { ea: 0.97 }, 'CN'), P(1.5, { sa: 0.97 }, 'IN'), P(1.5, { am: 0.5, eu: 0.45, af: 0.05 }, 'PE'), P(1.5, { eu: 0.95 }, 'BR')],
  PT: [P(89, { eu: 0.96, af: 0.02, mena: 0.02 }), P(3, { af: 0.9, eu: 0.1 }, 'AO'), P(5, { eu: 0.5, af: 0.4, am: 0.1 }, 'BR'), P(1, { sa: 0.97 }, 'IN'), P(1, { ea: 0.97 }, 'CN'), P(1, { af: 0.6, eu: 0.4 })],
  GB: [P(81, { eu: 0.98 }), P(7, { sa: 0.97 }, 'IN'), P(4, { af: 0.95 }, 'NG'), P(1.5, { ea: 0.97 }, 'CN'), P(2.5, { eu: 0.5, af: 0.45, sa: 0.05 }), P(1, { eu: 0.97 }, 'IT'), P(1, { eu: 0.97 }, 'PT'), P(1, { mena: 0.9, eu: 0.1 }, 'MA'), P(1, { af: 0.97 }, 'KE')],
  AU: [P(72, { eu: 0.98 }), P(6, { ea: 0.97 }, 'CN'), P(4, { sa: 0.97 }, 'IN'), P(3, { oc: 0.8, eu: 0.2 }), P(3, { eu: 0.97 }, 'IT'), P(1, { ea: 0.97 }, 'KR'), P(2, { mena: 0.9, eu: 0.1 }), P(5, { eu: 0.98 }, 'GB'), P(1, { ea: 0.9, eu: 0.1 }, 'JP'), P(1, { oc: 0.9, eu: 0.1 }, 'NZ'), P(2, { ea: 0.6, oc: 0.2, eu: 0.2 })],
  NZ: [P(66, { eu: 0.98 }), P(16, { oc: 0.6, eu: 0.4 }), P(6, { oc: 0.9, eu: 0.1 }), P(5, { ea: 0.97 }, 'CN'), P(4, { sa: 0.97 }, 'IN'), P(2, { eu: 0.98 }, 'GB'), P(1, { ea: 0.97 }, 'KR')]
};

/** Quem não tem perfil vivível (o catálogo de 193 países): pela grande região do mundo (ainda só para gerar). */
export const POPULACOES_POR_REGIAO: Record<string, PerfilPopulacional[]> = {
  america_sul: [P(60, { eu: 0.5, am: 0.4, af: 0.1 }), P(25, { am: 0.8, eu: 0.2 }), P(15, { af: 0.6, eu: 0.3, am: 0.1 })],
  america_norte: [P(60, { eu: 0.9, am: 0.1 }), P(40, { am: 0.6, eu: 0.4 })],
  america_central_caribe: [P(50, { eu: 0.4, af: 0.4, am: 0.2 }), P(30, { am: 0.6, eu: 0.4 }), P(20, { af: 0.85, eu: 0.15 })],
  europa: [P(92, { eu: 0.98 }), P(5, { mena: 0.8, eu: 0.2 }), P(3, { af: 0.9, eu: 0.1 })],
  africa: [P(85, { af: 0.98 }), P(15, { mena: 0.85, af: 0.15 })],
  asia: [P(45, { ea: 0.97 }), P(30, { sa: 0.97 }), P(20, { mena: 0.95 }), P(5, { ea: 0.6, sa: 0.4 })],
  oceania: [P(60, { oc: 0.85, eu: 0.15 }), P(40, { eu: 0.95 })]
};

/* --------------------------------------------- A aparência pelas origens */

type Dist = number[];
/** Peso de cada origem em cada traço (as listas casam com as ordens em `sistemas/identidade`). */
export const TRACOS: Record<string, Record<Origem, Dist>> = {
  // liso, ondulado, cacheado, crespo
  textura: { eu: [5, 3, 1.2, 0.1], af: [0, 0.3, 2, 6], ea: [9, 1, 0.1, 0], sa: [5, 3, 1, 0.2], mena: [2, 4, 3, 0.5], am: [8, 1.5, 0.3, 0], oc: [1, 2, 4, 3] },
  // preto, castanho_escuro, castanho, castanho_claro, loiro, ruivo
  corCabelo: { eu: [1.5, 3, 3, 2, 1.6, 0.5], af: [8, 2, 0.3, 0, 0, 0], ea: [9, 1.5, 0.2, 0, 0, 0], sa: [8, 2.5, 0.5, 0, 0, 0], mena: [5, 4, 1, 0.2, 0.05, 0.05], am: [8, 2, 0.3, 0, 0, 0], oc: [6, 3, 0.5, 0.2, 0.15, 0] },
  // castanho_escuro, castanho, mel, verde, azul
  olhos: { eu: [1.5, 3, 2, 1.2, 2], af: [7, 2.5, 0.4, 0.03, 0.01], ea: [7, 2.5, 0.3, 0.01, 0.01], sa: [6, 3, 0.7, 0.1, 0.02], mena: [4, 4, 1.5, 0.4, 0.15], am: [6, 3, 0.6, 0.05, 0.02], oc: [6, 3, 0.6, 0.05, 0.05] },
  // amendoado, redondo, caido, puxado
  olhosForma: { eu: [3, 3, 1, 0.1], af: [3, 3, 1, 0.2], ea: [2, 0.3, 0.5, 5], sa: [3, 3, 1, 0.2], mena: [4, 2, 1, 0.1], am: [3, 1, 1, 2], oc: [3, 2, 1, 0.5] },
  // fino, medio, largo, arrebitado, curvo, pequeno — os dois últimos (FIX pós-playtest humano) com o MESMO peso em toda
  // origem: variação individual, não marca de origem.
  nariz: { eu: [3, 3, 0.5, 1.5, 0.9, 0.9], af: [0.2, 2, 5, 0.3, 0.9, 0.9], ea: [0.5, 3, 2, 0.5, 0.9, 0.9], sa: [1.5, 3, 1.5, 0.3, 0.9, 0.9], mena: [2, 3, 1, 0.2, 0.9, 0.9], am: [1, 3, 2, 0.3, 0.9, 0.9], oc: [0.3, 2, 4, 0.3, 0.9, 0.9] },
  // fina, media, cheia
  boca: { eu: [3, 4, 1], af: [0.3, 2, 5], ea: [2, 4, 1.5], sa: [1.5, 4, 2], mena: [1.5, 4, 2], am: [2, 4, 2], oc: [0.5, 3, 4] },
  // oval, redondo, quadrado, longo, coracao
  rosto: { eu: [3, 2, 2, 2, 1.5], af: [3, 2, 2, 1.5, 1.5], ea: [2.5, 3, 2, 1, 1.5], sa: [3, 2, 1.5, 2, 1.5], mena: [3, 1.5, 2, 2.5, 1], am: [2, 3, 2.5, 1, 1], oc: [2, 3, 3, 1, 1] },
  // fina, media, grossa
  sobrancelha: { eu: [2, 4, 2], af: [2, 4, 2], ea: [2.5, 4, 1.5], sa: [1, 3, 4], mena: [0.5, 2, 5], am: [2, 4, 2], oc: [1.5, 4, 2.5] }
};

/** O tom de pele médio de cada origem (índice 0..5 = p1..p6). */
export const PELE_MEDIA: Record<Origem, number> = { eu: 0.9, af: 4.3, ea: 1.3, sa: 3.0, mena: 2.0, am: 2.7, oc: 3.8 };
