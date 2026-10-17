/**
 * REWORK 8 (Fase B) — a fachada de um lugar como componente: o fundo da vitrine de Compras (preenche a caixa, a loja
 * no meio, a rua cortada dos lados) ou a miniatura recortada só na loja (a lista das lojas da cidade).
 */
import type { ReactElement } from 'react';
import { Ilustracao, lembrar, type Amostra } from './nucleo';
import { amostraDaFachada, type LugarDaCidade } from './lugares';

const VARIANTES = lembrar<Amostra>(128);

export function Fachada({ lugar, largura = 240, altura, rotulo, vazia, recorte, className }: {
  lugar: LugarDaCidade; largura?: number; altura?: number; rotulo?: string;
  /** Sem objetos na frente: a vitrine mostra o interior da loja. Com objetos, o interior some (não disputa com eles). */
  vazia?: boolean;
  /** Só a loja (x 140..340), sem a rua: a miniatura. */
  recorte?: boolean;
  className?: string;
}): ReactElement {
  const am = VARIANTES(`${lugar}|${vazia ? 1 : 0}|${recorte ? 1 : 0}`, () => {
    const a = amostraDaFachada(lugar);
    const pecas = vazia ? a.pecas : a.pecas.filter(p => p.classe !== 'fachada__interior');
    return recorte ? { ...a, pecas: [{ tipo: 'grupo' as const, t: 'translate(-130 0)', pecas }], vb: [220, 120] as [number, number] } : { ...a, pecas };
  });
  return (
    <Ilustracao a={am} largura={largura} altura={altura} ajuste={recorte ? undefined : 'xMidYMax slice'} rotulo={rotulo}
      className={`fachada fachada--${lugar}${className ? ` ${className}` : ''}`} dados={{ 'data-lugar': lugar }} />
  );
}
