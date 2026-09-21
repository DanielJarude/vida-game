/**
 * Renderer do avatar personalizável (B4-FIX2 item 17).
 *
 * PURO: decide as formas/cores do rosto vetorial a partir de
 * (idade, aparência escolhida). Não conhece React nem JSX — devolve dados
 * simples que o componente `AvatarFace` traduz em elementos SVG. Separado
 * de `data/avatar/avatarData.ts` (catálogo de opções) e do componente de
 * edição (`components/character/AvatarEditor.tsx`).
 *
 * Vetorial/CSS puro: nenhum asset externo, nenhuma IA, nenhum upload.
 */

import type { AparenciaAvatar, EstiloCabelo } from '../data/avatar/avatarData';
import {
  corHexCabelo,
  corHexOlhos,
  corHexTomPele
} from '../data/avatar/avatarData';
import { obterCategoriaAvatarPessoa, CategoriaAvatar } from './avatarPresentation';

export interface FormaCabelo {
  /** Path SVG (viewBox 0 0 100 100) desenhado ATRÁS do rosto, se houver. */
  atras?: string;
  /** Path SVG desenhado NA FRENTE do rosto (franja, topo). */
  frente?: string;
}

/** Geometria de cabelo por estilo — proporções simples, sem asset externo. */
const FORMAS_CABELO: Record<EstiloCabelo, FormaCabelo> = {
  careca: {},
  curto: {
    frente: 'M 26 40 Q 24 14 50 12 Q 76 14 74 40 Q 74 26 50 24 Q 26 26 26 40 Z'
  },
  medio: {
    atras: 'M 24 44 Q 22 66 26 78 L 34 78 Q 30 58 30 42 Z M 76 44 Q 78 66 74 78 L 66 78 Q 70 58 70 42 Z',
    frente: 'M 24 42 Q 22 12 50 10 Q 78 12 76 42 Q 76 24 50 22 Q 24 24 24 42 Z'
  },
  longo: {
    atras: 'M 20 44 Q 16 78 22 96 L 34 96 Q 28 66 28 42 Z M 80 44 Q 84 78 78 96 L 66 96 Q 72 66 72 42 Z',
    frente: 'M 20 42 Q 18 10 50 8 Q 82 10 80 42 Q 80 22 50 20 Q 20 22 20 42 Z'
  },
  cacheado: {
    frente:
      'M 22 38 a6 6 0 1 1 10 -6 a6 6 0 1 1 10 -6 a6 6 0 1 1 10 -4 a6 6 0 1 1 10 4 a6 6 0 1 1 10 6 a6 6 0 1 1 10 6 Q 76 24 50 22 Q 24 24 22 38 Z'
  },
  coque: {
    atras: 'M 46 8 a8 8 0 1 1 8 0 a8 8 0 1 1 -8 0 Z',
    frente: 'M 25 42 Q 23 14 50 12 Q 77 14 75 42 Q 75 26 50 24 Q 25 26 25 42 Z'
  }
};

export interface EspecificacaoAvatar {
  categoria: CategoriaAvatar;
  corPele: string;
  corCabelo: string;
  corOlhos: string;
  cabelo: FormaCabelo;
  /** Proporção do rosto (bebê tem cabeça maior/mais redonda que adulto). */
  escalaRosto: number;
  /** Adiciona traços simples de idade avançada (rugas discretas). */
  mostrarRugas: boolean;
  /** Bebê e criança pequena não têm o mesmo desenho de cabelo adulto — mantém proporção simples. */
  simplificado: boolean;
}

/**
 * Hidrata a especificação de desenho a partir de idade + aparência.
 *
 * Regra de envelhecimento visual: o cabelo escolhido na criação continua
 * sendo a preferência registrada (não é reescrita), mas a partir dos 65
 * anos a exibição usa uma cor grisalha — mantendo estilo, tom de pele e
 * olhos idênticos, para "a mesma pessoa mais velha", não alguém diferente.
 */
export function construirEspecificacaoAvatar(
  idade: number,
  aparencia: AparenciaAvatar
): EspecificacaoAvatar {
  const categoria = obterCategoriaAvatarPessoa(idade);
  const idoso = idade >= 65;

  return {
    categoria,
    corPele: corHexTomPele(aparencia.tomPele),
    corCabelo: idoso ? corHexCabelo('grisalho') : corHexCabelo(aparencia.corCabelo),
    corOlhos: corHexOlhos(aparencia.corOlhos),
    cabelo: FORMAS_CABELO[aparencia.estiloCabelo],
    escalaRosto: categoria === 'bebe' ? 1.12 : categoria === 'crianca' ? 1.05 : 1,
    mostrarRugas: idoso,
    simplificado: categoria === 'bebe'
  };
}
