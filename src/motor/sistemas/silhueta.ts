/**
 * 12.4.1 — O TIPO DE CORPO, lido do que o jogo já sabe (nenhum atributo novo): o condicionamento (`corpo.forma`), os
 * hábitos (sedentarismo, bebida), o que a pessoa pratica (academia, esporte, a base e o profissional), a predisposição
 * física de nascença e a idade. A figura de corpo inteiro desenha a partir daqui — e ela muda com a vida, porque tudo
 * isso muda com a vida.
 */
import type { Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { predisposicao } from './predisposicao';
import { modeloRotina } from './rotinas';
import { estaturaAdulta } from './modalidades';
import { estimuloFisico } from './pessoa';
import { capacidade, pagar } from './dinheiro';
import { economiaLocal } from '../dados/lugares';
import { clamp } from '../rng';
import { lerCorpo23 } from '../v23/corpo/corpo23';
import { composicaoInicial24, METODOS24, tipoDaComposicao, umAno24, type Composicao24, type Entrada24 } from '../v24/corpo/corpo24';

export type TipoDeCorpo = 'magro' | 'mediano' | 'atletico' | 'musculoso' | 'acima_do_peso';

export const NOME_DO_CORPO: Record<TipoDeCorpo, string> = {
  magro: 'magro', mediano: 'mediano', atletico: 'atlético', musculoso: 'musculoso', acima_do_peso: 'acima do peso'
};

export function tipoDeCorpo(v: Vida): TipoDeCorpo {
  // VIDA 24: com a composição (gordura e músculo, que andam um pouco por ano), o tipo é o que ela é.
  const comp = v.corpo.composicao24;
  const base = comp ? tipoDaComposicao(comp) : tipoDeCorpoBase(v);
  // VIDA 17: a bariátrica muda o corpo AOS POUCOS — seis meses ainda igual; depois, mediano (com o reganho, volta).
  const b = v.eu.cirurgia17?.bariatrica;
  if (b && !b.reganho && base === 'acima_do_peso' && v.t - b.t >= (b.fraca ? 12 : 6)) return 'mediano';
  return base;
}

/** O tipo de antes da VIDA 24 (lido na hora do treino e dos hábitos) — o ponto de partida da composição dos saves antigos. */
export function tipoDeCorpoBase(v: Vida): TipoDeCorpo {
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
export interface CorpoDaFigura {
  tipo: TipoDeCorpo; /** Desvios da média (≈ −2,2 a +2,2). */ estatura?: number; /** A constituição (`Visual.corpo23`). */ c?: string;
  /** VIDA 24: a composição (gordura, músculo, regiões) — a figura desenha o corpo contínuo, não só cinco tipos. */
  comp?: Pick<Composicao24, 'g' | 'm' | 'r'>;
}
export function corpoDaFigura(v: Vida): CorpoDaFigura {
  const tipo = tipoDeCorpo(v);
  const c24 = v.corpo.composicao24;
  // A bariátrica muda o tipo aos poucos (acima): a figura acompanha o que o tipo diz.
  const comp = c24 ? { g: tipo === 'mediano' && c24.g >= 1.2 ? 0.6 : c24.g, m: c24.m, ...(c24.r ? { r: c24.r } : {}) } : undefined;
  if (!v.eu.visual.corpo23) return comp ? { tipo, comp } : { tipo };
  // A constituição vai junto (as lupas e as miniaturas montam o mesmo corpo da figura).
  const media = v.eu.genero === 'feminino' ? 163 : v.eu.genero === 'masculino' ? 176 : 169.5;
  return { tipo, c: v.eu.visual.corpo23, ...(comp ? { comp } : {}), estatura: Math.max(-2.2, Math.min(2.2, Math.round(((estaturaAdulta(v) - media) / 7) * 100) / 100)) };
}

/* ------------------------------------------------------------------ VIDA 24: a evolução do corpo */

/** Quanto de cada atividade é força (o resto é aeróbico): a academia é força; a luta, metade; o esporte, quase tudo aeróbico. */
const FORCA_DE: Record<string, number> = { academia: 1, lutas: 0.55, obra: 0.6, farda: 0.5, profissional: 0.4, natacao: 0.3, atletismo: 0.3, bico: 0.4 };

/** O que entra na conta do ano (a semana de verdade: as rotinas, o trabalho, o esporte, a alimentação, o objetivo). */
export function entrada24(v: Vida): Entrada24 {
  let forca = 0, cardio = 0;
  for (const f of estimuloFisico(v).fontes) { const k = FORCA_DE[f.id] ?? 0.2; forca += f.carga * k; cardio += f.carga * (1 - k); }
  const b = v.eu.cirurgia17?.bariatrica;
  return {
    idade: idade(v), forca, cardio, sedentario: v.corpo.habitos.sedentario, bebeMuito: v.corpo.habitos.bebe === 'muito', forma: v.corpo.forma,
    c: lerCorpo23(v.eu.visual.corpo23), plano: v.corpo.plano24,
    bariatrica: !!b && !b.reganho && v.t - b.t >= 6,
    doente: v.corpo.condicoes.some(x => (x.id === 'cancer' && !x.tratando) || (x.id === 'depressao' && !x.tratando))
  };
}

/** A composição de agora (a gravada; num save que ainda não tem, a da condição de antes — sem gravar nada). */
export function composicaoDe(v: Vida): Composicao24 {
  return v.corpo.composicao24 ?? composicaoInicial24(tipoDeCorpoBase(v), lerCorpo23(v.eu.visual.corpo23), v.t);
}

/**
 * Um ano de corpo (depois do condicionamento do ano): a composição anda na direção do que a vida pede. O save antigo
 * começa da condição em que estava (a figura não pula) e evolui a partir daí.
 */
export function evoluirCorpo24(v: Vida): void {
  const atual = composicaoDe(v);
  v.corpo.composicao24 = umAno24(atual, entrada24(v), v.t);
  const i = idade(v);
  // Comer menos que o corpo gasta cobra no humor (a fome de todo dia).
  if (v.corpo.plano24?.alimentacao === 'deficit' && i >= 13) v.mente.felicidade = clamp(v.mente.felicidade - 2);
  cuidarDosPelos24(v);
}

/** O preço de um cuidado com os pelos aqui (o salão da cidade: a mesma régua das clínicas). */
export const precoDoCuidado24 = (v: Vida, metodo: keyof typeof METODOS24, regioes: number) =>
  Math.round(METODOS24[metodo].custo * Math.max(1, regioes) * 0.5 * economiaLocal(v.moradia.municipioId).custo / 10) * 10;

/** O ano dos pelos: a cera cobra a manutenção (sem dinheiro, para); o laser, depois de um ano de sessões, fica para sempre. */
function cuidarDosPelos24(v: Vida): void {
  const c = v.eu.visual.pelos24;
  if (!c) return;
  if (c.metodo === 'laser' && v.t - c.desde >= 12) {
    v.eu.visual.laser24 = [...new Set([...(v.eu.visual.laser24 ?? []), ...c.regioes])];
    delete v.eu.visual.pelos24;
    escrever(v, { texto: 'Acabaram as sessões de laser: os pelos quase não voltam mais.', relevancia: 'cotidiano', tema: 'saude', tom: 'bom' });
    return;
  }
  if (c.metodo === 'cera') {
    const preco = precoDoCuidado24(v, 'cera', c.regioes.length);
    if (capacidade(v, preco).situacao === 'tem') pagar(v, preco);
    else { delete v.eu.visual.pelos24; escrever(v, { texto: 'A cera no salão ficou cara demais para manter: os pelos voltaram.', relevancia: 'cotidiano', tema: 'dinheiro', tom: 'neutro' }); }
  }
}
