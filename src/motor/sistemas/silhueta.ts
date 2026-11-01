/**
 * 12.4.1 — O TIPO DE CORPO, lido do que o jogo já sabe (nenhum atributo novo): o condicionamento (`corpo.forma`), os
 * hábitos (sedentarismo, bebida), o que a pessoa pratica (academia, esporte, a base e o profissional), a predisposição
 * física de nascença e a idade. A figura de corpo inteiro desenha a partir daqui — e ela muda com a vida, porque tudo
 * isso muda com a vida.
 */
import type { Vida } from '../tipos';
import { idade } from '../nucleo';
import { predisposicao } from './predisposicao';
import { modeloRotina } from './rotinas';

export type TipoDeCorpo = 'magro' | 'mediano' | 'atletico' | 'musculoso' | 'acima_do_peso';

export const NOME_DO_CORPO: Record<TipoDeCorpo, string> = {
  magro: 'magro', mediano: 'mediano', atletico: 'atlético', musculoso: 'musculoso', acima_do_peso: 'acima do peso'
};

export function tipoDeCorpo(v: Vida): TipoDeCorpo {
  const i = idade(v);
  const forma = v.corpo.forma;
  const academia = v.rotinas.find(r => r.id === 'academia');
  const esportes = v.rotinas.filter(r => modeloRotina(r.id)?.categoria === 'esporte').length;
  const atleta = v.caminhos.esporte?.fase === 'base' || v.caminhos.esporte?.fase === 'profissional';
  const nato = predisposicao(v, 'fisica');
  const parado = v.corpo.habitos.sedentario || v.corpo.habitos.bebe === 'muito';
  if (i < 12) return forma < 30 && parado ? 'acima_do_peso' : forma >= 75 && esportes ? 'atletico' : nato < -0.35 ? 'magro' : 'mediano';
  // A academia pesada por anos faz o músculo; o esporte, o corpo atlético.
  if (academia && (academia.nivel ?? 1) >= 2 && forma >= 62 && i >= 16 && v.t - academia.tInicio >= 24) return 'musculoso';
  if ((atleta || esportes >= 1 || academia) && forma >= 68) return 'atletico';
  if (forma < 38 && (parado || i >= 45)) return 'acima_do_peso';
  if (forma < 30) return 'acima_do_peso';
  if (nato < -0.3 && !parado && forma >= 40 && forma < 62) return 'magro';
  return 'mediano';
}
