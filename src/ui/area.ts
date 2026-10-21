/**
 * REWORK 10 · UX-13 — o que cada área diz no alto (`comum.CabecaDaArea`): o acontecimento recente daquele assunto, lido da
 * Linha da Vida (o tema que o motor deu a cada entrada — nada reclassificado).
 */
import type { Entrada, Vida } from '../motor/tipos';
import { idade } from '../motor/nucleo';

/** O acontecimento mais recente (marco ou biografia) com um dos temas, nos últimos `meses`. */
export function recenteDe(v: Vida, temas: Entrada['tema'][], meses = 36): { quando: string; texto: string } | undefined {
  const t = new Set(temas);
  for (let k = v.biografia.length - 1; k >= 0; k--) {
    const e = v.biografia[k];
    if (v.t - e.t > meses) break;
    if (e.relevancia === 'cotidiano' || e.relevancia === 'tecnico' || !t.has(e.tema)) continue;
    const anos = Math.round((v.t - e.t) / 12);
    return { quando: anos <= 0 ? 'este ano' : anos === 1 ? 'no ano passado' : `há ${anos} anos`, texto: e.texto };
  }
  return undefined;
}

export const TEMAS_PESSOAS: Entrada['tema'][] = ['amor', 'familia', 'filhos', 'amizade', 'perda', 'morte', 'nascimento'];
export const TEMAS_VOCE: Entrada['tema'][] = ['saude'];
export const TEMAS_SEMANA: Entrada['tema'][] = ['lazer'];
export const TEMAS_VIDA: Entrada['tema'][] = ['casa', 'dinheiro', 'lugar'];
export const TEMAS_CAMINHOS: Entrada['tema'][] = ['escola', 'estudo', 'trabalho'];
export const adulto = (v: Vida) => idade(v) >= 18;
