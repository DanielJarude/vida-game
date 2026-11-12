/**
 * VIDA 17 · AS TATUAGENS DO ROSTO — onde cada região fica no rosto do `Retrato` (que também é a cabeça da `Figura`).
 *
 * A caixa sai da geometria viva do rosto (o centro, a largura, a altura, a linha dos olhos, o queixo): num rosto longo a
 * testa sobe, num rosto redondo a bochecha abre — o desenho acompanha o rosto e nunca flutua (é recortado pela pele).
 */
import type { RegiaoDeTatuagem } from '../../motor/dados/tatuagens';

export interface GeoDoRosto { cx: number; cy: number; w: number; hh: number; olhoY: number; esp: number; queixo: number }

export const REGIOES_DO_ROSTO = new Set<RegiaoDeTatuagem>(['testa', 'tempora', 'sobrancelha_t', 'sob_olho', 'bochecha', 'nariz', 'queixo']);
export const ehDoRosto = (r: RegiaoDeTatuagem) => REGIOES_DO_ROSTO.has(r);

/** A caixa (centro, largura, altura) da região no rosto. `s`: +1 à direita de quem olha. */
export function caixaNoRosto(g: GeoDoRosto, r: RegiaoDeTatuagem, s: 1 | -1): { x: number; y: number; w: number; h: number } {
  const topo = g.cy - g.hh / 2;
  switch (r) {
    case 'testa': return { x: g.cx, y: topo + (g.olhoY - topo) * 0.5, w: g.w * 0.46, h: (g.olhoY - topo) * 0.34 };
    case 'tempora': return { x: g.cx + s * g.w * 0.4, y: g.olhoY - 3.2, w: g.w * 0.13, h: 7 };
    case 'sobrancelha_t': return { x: g.cx + s * (g.esp + 3.4), y: g.olhoY - 4.2, w: 4.2, h: 3 };
    case 'sob_olho': return { x: g.cx + s * (g.esp + 0.6), y: g.olhoY + 3.6, w: 3.4, h: 3.4 };
    case 'bochecha': return { x: g.cx + s * g.w * 0.27, y: g.olhoY + 8.5, w: g.w * 0.19, h: 6.5 };
    case 'nariz': return { x: g.cx, y: g.olhoY + 4.2, w: 3, h: 5.2 };
    case 'queixo': return { x: g.cx, y: g.queixo - 3.6, w: g.w * 0.24, h: 3.8 };
    default: return { x: g.cx, y: g.cy, w: 4, h: 4 };
  }
}

/** O rosto de um adulto típico (para a figura de corpo inteiro marcar as regiões no mapa do corpo). */
export const ROSTO_PADRAO: GeoDoRosto = { cx: 50, cy: 44, w: 35, hh: 46, olhoY: 43, esp: 7.6, queixo: 67 };
