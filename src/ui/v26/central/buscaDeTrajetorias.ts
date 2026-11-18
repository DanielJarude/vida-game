/** VIDA 26.1 · a busca nas trajetórias (o nome, a área, as palavras-chave, as etapas, o depois) — a mesma pontuação da central. */
import type { Trajeto26 } from '../../../motor/v26/carreira/trajetorias26';
import { pontuarBusca } from '../../navegacao';

export function buscarTrajetorias(lista: Trajeto26[], busca: string): Trajeto26[] {
  return lista.map(t => ({ t, p: pontuarBusca(busca, [[t.nome, 4], [t.chaves, 3], [t.area, 2], [t.etapas.map(e => e.nome).join(' '), 1.5], [t.depois.join(' '), 1], [t.comeco, 1]]) }))
    .filter(x => x.p > 0).sort((a, b) => b.p - a.p).map(x => x.t);
}
