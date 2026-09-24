/**
 * Marcas do caminho: o que importou na vida profissional e educacional,
 * estruturado (tipo, peso, trilha, frente, ocupação). A Linha da Vida conta
 * em texto; as marcas guardam o esqueleto para a narrativa futura e para as
 * métricas. Nem todo aumento é marca: só o que muda o rumo.
 */

import type { Dominio, MarcaCaminho, TipoMarcaCaminho, Vida } from '../tipos';

export const LIMITE_MARCAS = 80;

export function marcar(v: Vida, tipo: TipoMarcaCaminho, texto: string, peso: 1 | 2 | 3, extra: { dominio?: Dominio; trilha?: string; ocupacaoId?: string; pessoaId?: string } = {}): void {
  const m: MarcaCaminho = { t: v.t, tipo, texto, peso, ...extra };
  const lista = v.caminhos.marcas;
  if (lista.some(x => x.tipo === tipo && x.texto === texto && Math.abs(x.t - v.t) < 12)) return;
  lista.push(m);
  while (lista.length > LIMITE_MARCAS) {
    const menor = Math.min(...lista.map(x => x.peso));
    lista.splice(lista.findIndex(x => x.peso === menor), 1);
  }
}

export const temMarca = (v: Vida, tipo: TipoMarcaCaminho, filtro?: (m: MarcaCaminho) => boolean) =>
  v.caminhos.marcas.some(m => m.tipo === tipo && (!filtro || filtro(m)));

/** Estado vazio dos caminhos (vida nova). */
export function caminhosVazios(): Vida['caminhos'] {
  return { frentes: {}, marcas: [], oportunidades: [], concurso: { meses: 0, tentativas: 0, aprovacoes: 0 }, ultimas: {} };
}
