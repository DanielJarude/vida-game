/**
 * HOTFIX 11.5.1 — A MEMÓRIA DA ABA COMPRAS: o segmento aberto, a busca e os filtros (e, por loja, a busca e os filtros
 * de dentro dela). Fica na sessão do navegador: sair para outra aba e voltar, abrir uma loja e fechar, comprar — tudo
 * volta onde estava. Sem armazenamento (aba privada, bloqueio), vale só enquanto a página está aberta.
 */
import { useEffect, useState } from 'react';
import type { OrdemDeCompras } from '../../motor/sistemas/lojas';

export interface EstadoDeCompras {
  /** 'inicio' ou o id de um segmento (`sistemas/lojas.SEGMENTOS`). */
  segmento: string;
  texto: string;
  categoria: string;
  marca: string;
  faixa: string;
  ordem: OrdemDeCompras;
  /** No segmento: a categoria que filtra as lojas (Roupas, Calçados…). */
  categoriaDasLojas: string;
  /** A vida a que este estado pertence (outra vida começa do começo). */
  vidaId?: string;
  /** O segmento foi pedido de fora (o mapa "Comprar carro" leva a Veículos): vale mesmo numa vida nova. */
  deFora?: boolean;
}
export interface EstadoDaLoja { texto: string; cat: string; faixa: string; marca: string; preco: string; ordem: OrdemDeCompras; quantos: number }

const CHAVE = 'vida-compras-1151';
const PADRAO: EstadoDeCompras = { segmento: 'inicio', texto: '', categoria: '', marca: '', faixa: '', ordem: 'relevancia', categoriaDasLojas: '' };
let atual: EstadoDeCompras = (() => { try { return { ...PADRAO, ...JSON.parse(sessionStorage.getItem(CHAVE) ?? '{}') }; } catch { return { ...PADRAO }; } })();
const ouvintes = new Set<(x: EstadoDeCompras) => void>();
/** A posição da página em cada segmento (para voltar no mesmo lugar). */
export const rolagemDeCompras: Record<string, number> = {};
/** A busca e os filtros de dentro de cada loja. */
export const memoriaDasLojas = new Map<string, EstadoDaLoja>();

export const estadoDeCompras = () => atual;
export function guardarCompras(x: Partial<EstadoDeCompras>): void {
  atual = { ...atual, ...x };
  try { sessionStorage.setItem(CHAVE, JSON.stringify(atual)); } catch { /* sem armazenamento: só nesta página */ }
  for (const f of ouvintes) f(atual);
}
/** Volta ao começo (os testes; uma vida nova). */
export function limparCompras(): void { memoriaDasLojas.clear(); for (const k of Object.keys(rolagemDeCompras)) delete rolagemDeCompras[k]; guardarCompras({ ...PADRAO }); }

/** O estado da aba (e quem muda), sincronizado entre quem lê (a navegação pode abrir um segmento de fora). */
export function useEstadoDeCompras(vidaId?: string): [EstadoDeCompras, (x: Partial<EstadoDeCompras>) => void] {
  if (vidaId && atual.vidaId !== vidaId) { const seg = atual.deFora || !atual.vidaId ? atual.segmento : 'inicio'; memoriaDasLojas.clear(); atual = { ...PADRAO, segmento: seg, vidaId }; try { sessionStorage.setItem(CHAVE, JSON.stringify(atual)); } catch { /* */ } }
  const [x, setX] = useState(atual);
  useEffect(() => { ouvintes.add(setX); setX(atual); return () => { ouvintes.delete(setX); }; }, []);
  return [x, guardarCompras];
}
