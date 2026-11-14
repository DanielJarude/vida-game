/**
 * VIDA 21 · OS NÚMEROS DO OFÍCIO — cada trilha conta o que é dela (`dados21/carreiras/indicadores21`), a partir do
 * trabalho que de fato aconteceu: os meses em cada emprego (o atual e os que ficaram no histórico), a carga (parcial
 * conta metade), o cargo (quem chefia faz mais e responde por mais) e o desempenho daquele emprego. Sorteio derivado,
 * estável: recalcular dá o mesmo número.
 *
 * Calculado, não guardado (nada novo no save além dos marcos já ditos): `numerosDoOficio(v)` relê a carreira inteira.
 * `processarOficio21` (no fim do ano) só conta os marcos novos — "passou de 10.000 pacientes atendidos" — e os escreve na
 * biografia, uma vez cada; os grandes (o último patamar de cada indicador) entram como marco da carreira, que o
 * reconhecimento (`v21/fama/fama21`) lê.
 */
import type { Vida } from '../../tipos';
import { rngDe } from '../../rng';
import { escrever, marcarFato, temFato } from '../../nucleo';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { INDICADORES21, PROPRIOS21, type Indicador21 } from '../../dados21/carreiras/indicadores21';

export interface Numero21 { trilha: string; indicador: Indicador21; valor: number; doAno: number }

type Passagem = { ocupacaoId: string; tInicio: number; tFim: number; desempenho: number };

function passagens(v: Vida): Passagem[] {
  const out: Passagem[] = v.trabalho.historico.map(h => ({ ocupacaoId: h.ocupacaoId, tInicio: h.tInicio, tFim: h.tFim, desempenho: h.desempenho }));
  const e = v.trabalho.atual;
  if (e) out.push({ ocupacaoId: e.ocupacaoId, tInicio: e.tInicio, tFim: v.t, desempenho: e.desempenho });
  return out;
}

/** O ritmo de uma passagem: o desempenho e o cargo multiplicam; a carga parcial conta metade. */
function ritmo(v: Vida, p: Passagem, ind: Indicador21): number {
  const o = ocupacaoOuNula(p.ocupacaoId);
  if (!o) return 0;
  const carga = o.carga === 'parcial' ? 0.5 : 1;
  const jeito = 0.85 + rngDe(v.id, 'oficio21', p.ocupacaoId, p.tInicio, ind.id).next() * 0.3;
  return carga * (0.75 + Math.max(0, Math.min(100, p.desempenho)) / 200) * (1 + o.nivel * 0.06) * jeito;
}

/** Os números da carreira, por trilha, com o que entrou no último ano. As trilhas com sistema próprio ficam de fora. */
export function numerosDoOficio(v: Vida): Numero21[] {
  const acc = new Map<string, Numero21>();
  for (const p of passagens(v)) {
    const o = ocupacaoOuNula(p.ocupacaoId);
    if (!o || o.contrato === 'estagio' || o.contrato === 'aprendiz') continue;
    const inds = INDICADORES21[o.trilha];
    if (!inds) continue;
    const meses = Math.max(0, p.tFim - p.tInicio);
    const doAno = Math.max(0, p.tFim - Math.max(p.tInicio, v.t - 12));
    for (const ind of inds) {
      const k = `${o.trilha}:${ind.id}`;
      const x = acc.get(k) ?? { trilha: o.trilha, indicador: ind, valor: 0, doAno: 0 };
      const taxa = ((ind.mes ?? 0) + (ind.ano ?? 0) / 12) * ritmo(v, p, ind);
      x.valor += taxa * meses;
      x.doAno += taxa * doAno;
      acc.set(k, x);
    }
  }
  return [...acc.values()].map(x => ({ ...x, valor: Math.floor(x.valor), doAno: Math.floor(x.doAno) })).filter(x => x.valor > 0);
}

/** A trilha do trabalho de agora, quando os números dela moram noutro lugar. */
export function numerosEmOutroLugar(v: Vida): string | undefined {
  const o = ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '');
  return o ? PROPRIOS21[o.trilha] : undefined;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

/** No fim do ano: os números redondos novos viram lembrança (uma vez cada). */
export function processarOficio21(v: Vida): void {
  if (!v.trabalho.atual && !v.trabalho.historico.length) return;
  // A primeira vez (a vida que já vinha trabalhando, o save antigo): o que já passou fica registrado em silêncio.
  const primeira = !temFato(v, 'of21_inicio');
  if (primeira) marcarFato(v, 'of21_inicio');
  for (const n of numerosDoOficio(v)) {
    const marcos = n.indicador.marcos ?? [];
    marcos.forEach((m, k) => {
      const chave = `of21_${n.trilha}_${n.indicador.id}_${m}`;
      if (n.valor < m || temFato(v, chave)) return;
      marcarFato(v, chave);
      if (primeira) return;
      const grande = k === marcos.length - 1;
      escrever(v, { texto: `Passou de ${fmt(m)} ${n.indicador.rotulo}.`, relevancia: grande ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'bom' });
      if (grande) (v.fatos[`of21_marco_${n.trilha}`] = v.t);
    });
  }
}
