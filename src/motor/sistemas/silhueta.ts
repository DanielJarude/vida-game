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
import { estaturaAdulta } from './modalidades';

export type TipoDeCorpo = 'magro' | 'mediano' | 'atletico' | 'musculoso' | 'acima_do_peso';

export const NOME_DO_CORPO: Record<TipoDeCorpo, string> = {
  magro: 'magro', mediano: 'mediano', atletico: 'atlético', musculoso: 'musculoso', acima_do_peso: 'acima do peso'
};

export function tipoDeCorpo(v: Vida): TipoDeCorpo {
  const base = tipoDeCorpoBase(v);
  // VIDA 17: a bariátrica muda o corpo AOS POUCOS — seis meses ainda igual; depois, mediano (com o reganho, volta).
  const b = v.eu.cirurgia17?.bariatrica;
  if (b && !b.reganho && base === 'acima_do_peso' && v.t - b.t >= (b.fraca ? 12 : 6)) return 'mediano';
  return base;
}

function tipoDeCorpoBase(v: Vida): TipoDeCorpo {
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

/**
 * VIDA 23 — o corpo que a figura desenha: a CONDIÇÃO (`tipoDeCorpo`, a vida) e, para quem tem a constituição da VIDA 23
 * (`Visual.corpo23`), a ESTATURA DE VERDADE — a mesma altura em centímetros que o motor já usa (a seletiva de vôlei, o
 * basquete), lida como desvio da média do gênero. Sem a constituição (saves de antes), nada muda: a altura média de
 * sempre. Nos outros (as pessoas do mundo), a estatura sai do eixo da constituição.
 */
export interface CorpoDaFigura { tipo: TipoDeCorpo; /** Desvios da média (≈ −2,2 a +2,2). */ estatura?: number; /** A constituição (`Visual.corpo23`). */ c?: string }
export function corpoDaFigura(v: Vida): CorpoDaFigura {
  const tipo = tipoDeCorpo(v);
  if (!v.eu.visual.corpo23) return { tipo };
  // A constituição vai junto (as lupas e as miniaturas montam o mesmo corpo da figura).
  const media = v.eu.genero === 'feminino' ? 163 : v.eu.genero === 'masculino' ? 176 : 169.5;
  return { tipo, c: v.eu.visual.corpo23, estatura: Math.max(-2.2, Math.min(2.2, Math.round(((estaturaAdulta(v) - media) / 7) * 100) / 100)) };
}
