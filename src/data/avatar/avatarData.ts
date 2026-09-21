/**
 * Dados de personalização do avatar (B4-FIX2 item 17).
 *
 * O B4-FIX1 entregou um SÍMBOLO automático por fase de vida (ícone de
 * bebê/criança/adolescente/adulto/idoso) — isso passa a ser o FALLBACK
 * (save antigo, membro da família sem preferência salva). Este módulo é a
 * personalização real, feita na criação de Nova Vida: tom de pele, estilo
 * de cabelo, cor do cabelo e cor dos olhos.
 *
 * Puro: sem React, sem SVG, sem CSS. Só o catálogo de opções e os tipos.
 * O desenho (SVG) vive em `presentation/avatarRenderer.tsx`; a tela de
 * escolha vive em `components/character/AvatarEditor.tsx`.
 *
 * Cosmético apenas: nada aqui altera stats, inteligência, personalidade,
 * classe social ou qualquer oportunidade do jogo.
 */

export type TomPele = 'clara' | 'media' | 'morena' | 'escura' | 'negra';

export type EstiloCabelo =
  | 'careca'
  | 'curto'
  | 'medio'
  | 'longo'
  | 'cacheado'
  | 'coque';

export type CorCabelo = 'preto' | 'castanho' | 'castanho_claro' | 'loiro' | 'ruivo' | 'grisalho';

export type CorOlhos = 'castanho' | 'preto' | 'verde' | 'azul' | 'mel';

/**
 * Avatar 2.0 — pelo facial. Opcional no schema: saves anteriores
 * simplesmente não têm o campo e são normalizados para 'nenhuma'.
 */
export type EstiloBarba = 'nenhuma' | 'bigode' | 'cavanhaque' | 'cheia';

/** Preferência cosmética salva junto do save — nunca lida por sistemas de jogo. */
export interface AparenciaAvatar {
  tomPele: TomPele;
  estiloCabelo: EstiloCabelo;
  corCabelo: CorCabelo;
  corOlhos: CorOlhos;
  /** Avatar 2.0 — ausente equivale a 'nenhuma' (compatibilidade de save). */
  barba?: EstiloBarba;
}

export const TONS_PELE: { id: TomPele; rotulo: string; hex: string }[] = [
  { id: 'clara', rotulo: 'Clara', hex: '#f2d3b6' },
  { id: 'media', rotulo: 'Média', hex: '#dbab7f' },
  { id: 'morena', rotulo: 'Morena', hex: '#b9814f' },
  { id: 'escura', rotulo: 'Escura', hex: '#8a5a34' },
  { id: 'negra', rotulo: 'Negra', hex: '#5b3a22' }
];

// Cabelo grisalho não entra na oferta inicial de criação (a idade decide
// isso sozinha na renderização — ver avatarRenderer). Aqui ficam só as
// cores que fazem sentido escolher ativamente ao nascer o personagem.
export const CORES_CABELO: { id: CorCabelo; rotulo: string; hex: string }[] = [
  { id: 'preto', rotulo: 'Preto', hex: '#1c1a19' },
  { id: 'castanho', rotulo: 'Castanho', hex: '#4a2f22' },
  { id: 'castanho_claro', rotulo: 'Castanho claro', hex: '#7a5232' },
  { id: 'loiro', rotulo: 'Loiro', hex: '#d8b26a' },
  { id: 'ruivo', rotulo: 'Ruivo', hex: '#a34a26' }
];

export const ESTILOS_CABELO: { id: EstiloCabelo; rotulo: string }[] = [
  { id: 'careca', rotulo: 'Careca' },
  { id: 'curto', rotulo: 'Curto' },
  { id: 'medio', rotulo: 'Médio' },
  { id: 'longo', rotulo: 'Longo' },
  { id: 'cacheado', rotulo: 'Cacheado' },
  { id: 'coque', rotulo: 'Coque' }
];

export const ESTILOS_BARBA: { id: EstiloBarba; rotulo: string }[] = [
  { id: 'nenhuma', rotulo: 'Sem barba' },
  { id: 'bigode', rotulo: 'Bigode' },
  { id: 'cavanhaque', rotulo: 'Cavanhaque' },
  { id: 'cheia', rotulo: 'Barba cheia' }
];

export const CORES_OLHOS: { id: CorOlhos; rotulo: string; hex: string }[] = [
  { id: 'castanho', rotulo: 'Castanho', hex: '#5b3a22' },
  { id: 'preto', rotulo: 'Preto', hex: '#241f1c' },
  { id: 'verde', rotulo: 'Verde', hex: '#4f8a5b' },
  { id: 'azul', rotulo: 'Azul', hex: '#4a75a8' },
  { id: 'mel', rotulo: 'Mel', hex: '#b08948' }
];

/** Aparência neutra usada quando não há preferência salva (fallback seguro). */
export const APARENCIA_PADRAO: AparenciaAvatar = {
  tomPele: 'media',
  estiloCabelo: 'curto',
  corCabelo: 'castanho',
  corOlhos: 'castanho',
  barba: 'nenhuma'
};

export function corHexTomPele(tom: TomPele): string {
  return TONS_PELE.find(t => t.id === tom)?.hex ?? APARENCIA_PADRAO_HEX.pele;
}

export function corHexCabelo(cor: CorCabelo): string {
  if (cor === 'grisalho') return '#c7c3bd';
  return CORES_CABELO.find(c => c.id === cor)?.hex ?? APARENCIA_PADRAO_HEX.cabelo;
}

export function corHexOlhos(cor: CorOlhos): string {
  return CORES_OLHOS.find(c => c.id === cor)?.hex ?? APARENCIA_PADRAO_HEX.olhos;
}

const APARENCIA_PADRAO_HEX = {
  pele: '#dbab7f',
  cabelo: '#4a2f22',
  olhos: '#5b3a22'
};

/**
 * Normaliza uma aparência possivelmente incompleta/inválida (save antigo,
 * dado corrompido) para um valor sempre válido. Nunca lança.
 */
export function normalizarAparencia(bruto: unknown): AparenciaAvatar {
  const obj = typeof bruto === 'object' && bruto !== null
    ? (bruto as Record<string, unknown>)
    : {};

  const tomPele = TONS_PELE.some(t => t.id === obj.tomPele)
    ? (obj.tomPele as TomPele)
    : APARENCIA_PADRAO.tomPele;

  const estiloCabelo = ESTILOS_CABELO.some(e => e.id === obj.estiloCabelo)
    ? (obj.estiloCabelo as EstiloCabelo)
    : APARENCIA_PADRAO.estiloCabelo;

  const corCabelo =
    CORES_CABELO.some(c => c.id === obj.corCabelo) || obj.corCabelo === 'grisalho'
      ? (obj.corCabelo as CorCabelo)
      : APARENCIA_PADRAO.corCabelo;

  const corOlhos = CORES_OLHOS.some(c => c.id === obj.corOlhos)
    ? (obj.corOlhos as CorOlhos)
    : APARENCIA_PADRAO.corOlhos;

  // Avatar 2.0 — campo novo: save anterior não tem, e 'nenhuma' é o valor
  // que reproduz exatamente a aparência que a pessoa já tinha.
  const barba = ESTILOS_BARBA.some(b => b.id === obj.barba)
    ? (obj.barba as EstiloBarba)
    : 'nenhuma';

  return { tomPele, estiloCabelo, corCabelo, corOlhos, barba };
}

/* ========================================================================== */
/*                       CORES DERIVADAS (sombra e luz)                       */
/* ========================================================================== */

function comoRgb(hex: string): [number, number, number] {
  const limpo = hex.replace('#', '');
  const cheio = limpo.length === 3 ? limpo.split('').map(c => c + c).join('') : limpo;
  return [
    parseInt(cheio.slice(0, 2), 16),
    parseInt(cheio.slice(2, 4), 16),
    parseInt(cheio.slice(4, 6), 16)
  ];
}

function comoHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

/**
 * Mistura uma cor com preto ou branco.
 *
 * Avatar 2.0 usa isto para derivar sombra e luz do PRÓPRIO tom de pele
 * escolhido, em vez de sobrepor um preto translúcido fixo. A diferença é
 * concreta: preto translúcido acinzenta peles escuras e some em peles
 * claras; misturar mantém a temperatura da cor em todos os tons.
 */
export function escurecer(hex: string, intensidade: number): string {
  const [r, g, b] = comoRgb(hex);
  const f = 1 - Math.max(0, Math.min(1, intensidade));
  return comoHex([r * f, g * f, b * f]);
}

export function clarear(hex: string, intensidade: number): string {
  const [r, g, b] = comoRgb(hex);
  const f = Math.max(0, Math.min(1, intensidade));
  return comoHex([r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f]);
}

/* ========================================================================== */
/*                        APARÊNCIA DERIVADA (NPCs)                           */
/* ========================================================================== */

/** Hash estável e pequeno — mesma semente, sempre a mesma aparência. */
function embaralhar(semente: string): number {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Aparência determinística a partir de uma semente (normalmente o id
 * estável do NPC).
 *
 * Avatar 2.0 — até aqui só o personagem do jogador tinha rosto; toda a
 * família e todo NPC caíam no ícone genérico por fase de vida, o que faz
 * as pessoas ao redor parecerem linhas numa lista. Derivando a aparência
 * do id, cada pessoa da vida ganha um rosto próprio, estável entre sessões
 * e entre recarregamentos do save, sem custar um byte de persistência e
 * sem exigir migração.
 *
 * Continua puramente cosmético: nada aqui é lido por nenhuma regra.
 */
export function derivarAparenciaDeSemente(semente: string): AparenciaAvatar {
  const h = embaralhar(semente);
  const escolher = <T,>(itens: readonly T[], deslocamento: number): T =>
    itens[(h >>> deslocamento) % itens.length];

  return {
    tomPele: escolher(TONS_PELE, 0).id,
    estiloCabelo: escolher(ESTILOS_CABELO, 5).id,
    corCabelo: escolher(CORES_CABELO, 11).id,
    corOlhos: escolher(CORES_OLHOS, 17).id,
    barba: 'nenhuma'
  };
}
