/**
 * Plausibilidade graduada.
 *
 * Nem tudo é "pode" ou "não pode". Uma criança de 9 anos não pode ter
 * carteira assinada (ilegal: o sistema nem oferece), mas pode vender
 * brigadeiro na porta da escola (irregular: acontece, e o mundo reage).
 */

export type Grau =
  | 'impossivel'    // fisicamente/estruturalmente não existe (bebê trabalhar)
  | 'incompativel'  // conflita com o estado atual (já está matriculado)
  | 'ilegal'        // a lei proíbe e ninguém vai aceitar (criança com carteira assinada)
  | 'requisito'     // falta algo que pode ser conquistado (diploma, CNH, experiência)
  | 'irregular'     // dá para fazer, mas fora da regra — tem consequência
  | 'improvavel'    // permitido, chance baixa
  | 'permitido';

export interface Veredito {
  grau: Grau;
  motivo?: string;
  /** Chance de sucesso quando o resultado depende de terceiros (0..1). */
  chance?: number;
}

export const PERMITIDO: Veredito = { grau: 'permitido' };

/** A ação pode ser tentada (ainda que com risco ou chance baixa)? */
export const podeTentar = (v: Veredito) => v.grau === 'permitido' || v.grau === 'improvavel' || v.grau === 'irregular';

/** A ação deve aparecer na interface (mesmo bloqueada, com o motivo)? */
export const visivel = (v: Veredito) => v.grau !== 'impossivel';

export const bloqueio = (grau: Grau, motivo: string): Veredito => ({ grau, motivo });
