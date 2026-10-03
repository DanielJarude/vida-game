/**
 * Abrir a vida salva: qual dos dois saves usar.
 *
 * O principal é o normal. Se ele não abre (gravação corrompida, texto
 * truncado, versão que não se valida), o anterior — o save bom de um passo
 * atrás — entra no lugar, e o jogador é avisado do que se perdeu. O texto que
 * não abriu nunca é jogado fora: vai para o backup.
 */

import type { Leitura } from '../../motor/save';
import type { Vida } from '../../motor/tipos';
import type { Carga } from './index';

export type Abertura =
  | { tipo: 'vazio' }
  | {
      tipo: 'ok';
      vida: Vida;
      /** O save veio de uma versão anterior do jogo e foi convertido (o original deve ir para o backup). */
      migrado: boolean;
      /** Veio do save anterior porque o principal não abriu. */
      recuperado: boolean;
      /** O texto que não abriu (para o backup), se houve um. */
      descartado?: string;
      /** O texto original do save usado (para o backup, se ele foi migrado). */
      bruto: string;
    }
  | { tipo: 'invalido'; motivo: string; descartado: string };

export function abrirSalva(c: Pick<Carga, 'principal' | 'anterior'>, interpretar: (bruto: string) => Leitura): Abertura {
  if (c.principal === null) {
    // Sem principal e com anterior não acontece numa gravação normal (o anterior só existe depois de um
    // principal) — mas se acontecer, o anterior é a vida que há.
    if (c.anterior === null) return { tipo: 'vazio' };
    const r = interpretar(c.anterior);
    return r.tipo === 'ok' ? { tipo: 'ok', vida: r.vida, migrado: r.migrado, recuperado: true, bruto: c.anterior } : { tipo: 'vazio' };
  }
  const r = interpretar(c.principal);
  if (r.tipo === 'ok') return { tipo: 'ok', vida: r.vida, migrado: r.migrado, recuperado: false, bruto: c.principal };
  const motivo = r.tipo === 'invalido' ? r.motivo : 'O save está vazio.';
  if (c.anterior !== null) {
    const a = interpretar(c.anterior);
    if (a.tipo === 'ok') return { tipo: 'ok', vida: a.vida, migrado: a.migrado, recuperado: true, descartado: c.principal, bruto: c.anterior };
  }
  return { tipo: 'invalido', motivo, descartado: c.principal };
}
