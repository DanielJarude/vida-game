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

/** Preferência cosmética salva junto do save — nunca lida por sistemas de jogo. */
export interface AparenciaAvatar {
  tomPele: TomPele;
  estiloCabelo: EstiloCabelo;
  corCabelo: CorCabelo;
  corOlhos: CorOlhos;
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
  corOlhos: 'castanho'
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

  return { tomPele, estiloCabelo, corCabelo, corOlhos };
}
