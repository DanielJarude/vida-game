/** VIDA 13 (correção final) — o formato de um lote de personagens (`tatuagens13c*`). Só tipos. */
import type { DesenhoDeTatuagem, TamanhoDeTatuagem } from './tatuagens';

export type DesenhoDoLote = Omit<DesenhoDeTatuagem, 'tamanho' | 'tamanhos'> & { tamanhos: TamanhoDeTatuagem[] };
export interface LoteDeClassicos {
  /** Obra → tipo de obra ('livros' | 'filmes' | 'animacoes' | 'quadrinhos' | 'lendas' ...), só as obras NOVAS do lote. */
  midias: Record<string, 'games' | 'livros' | 'series' | 'filmes' | 'animacoes' | 'quadrinhos' | 'lendas'>;
  lista: DesenhoDoLote[];
}
