/**
 * Modelo de apresentação da Linha da Vida (B4).
 *
 * Converte `LifeLogEntry[]` (produzido pelo motor) em grupos por ano com
 * ênfase visual derivada dos dados reais. Nenhuma regra de gameplay aqui:
 * a função não cria, filtra por permissão nem inventa acontecimentos.
 */

import type { LifeLogCategory, LifeLogEntry } from '../types';

/** Ênfase visual de um acontecimento — mapeada para classes CSS discretas. */
export type EnfaseEntrada =
  | 'nascimento'
  | 'marco'
  | 'positivo'
  | 'negativo'
  | 'neutro';

export interface EntradaApresentada {
  entrada: LifeLogEntry;
  enfase: EnfaseEntrada;
  /** Rótulo curto do tipo de acontecimento (já em pt-BR). */
  rotuloCategoria: string;
  /**
   * Título e resumo. O motor grava um texto único por acontecimento; quando
   * ele tem mais de uma frase, a primeira vira título e o resto vira resumo.
   * Isso dá hierarquia sem exigir mudança no modelo de dados do gameplay.
   */
  titulo: string;
  resumo?: string;
}

export interface GrupoAnoApresentado {
  idade: number;
  ano: number;
  entradas: EntradaApresentada[];
}

const ROTULOS_CATEGORIA: Record<LifeLogCategory, string> = {
  geral: 'Vida',
  familia: 'Família',
  // B4-FIX4 — o mundo fora de casa e o tempo livre deixam de cair no
  // rótulo genérico "Escolha".
  amizade: 'Amizade',
  lazer: 'Lazer',
  escola: 'Escola',
  carreira: 'Carreira',
  amor: 'Relacionamento',
  saude: 'Saúde',
  financas: 'Finanças',
  evento: 'Escolha',
  morte: 'Perda',
  cotidiano: 'Cotidiano'
};

export function rotuloCategoriaTimeline(categoria: LifeLogCategory): string {
  return ROTULOS_CATEGORIA[categoria] ?? 'Vida';
}

/**
 * Divide o texto do log em título + resumo.
 * Mantém o texto do motor intacto; apenas escolhe onde quebrar a leitura.
 */
function dividirTexto(texto: string): { titulo: string; resumo?: string } {
  const limpo = texto.trim();

  // Quebra na primeira pontuação forte, desde que sobre conteúdo relevante.
  const match = limpo.match(/^(.+?[.!?])\s+(.{12,})$/s);
  if (match) {
    return { titulo: match[1].trim(), resumo: match[2].trim() };
  }

  // Texto curto: vira só título, sem resumo inventado.
  return { titulo: limpo };
}

function determinarEnfase(entrada: LifeLogEntry, indiceGlobal: number): EnfaseEntrada {
  // O primeiro acontecimento da vida abre a biografia.
  if (indiceGlobal === 0 && entrada.idade === 0) return 'nascimento';

  if (entrada.tipo === 'importante') return 'marco';
  if (entrada.tipo === 'negativo') return 'negativo';
  if (entrada.tipo === 'alerta') return 'negativo';
  if (entrada.tipo === 'positivo') return 'positivo';
  return 'neutro';
}

/**
 * Agrupa a timeline por ano de vida preservando a ordem cronológica de
 * inserção dentro de cada ano. A ordem dos grupos é decidida na camada de UI.
 */
export function agruparTimeline(timeline: LifeLogEntry[]): GrupoAnoApresentado[] {
  const grupos: GrupoAnoApresentado[] = [];

  timeline.forEach((entrada, indice) => {
    const { titulo, resumo } = dividirTexto(entrada.texto);
    const apresentada: EntradaApresentada = {
      entrada,
      enfase: determinarEnfase(entrada, indice),
      rotuloCategoria: rotuloCategoriaTimeline(entrada.categoria),
      titulo,
      resumo
    };

    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.idade === entrada.idade && ultimo.ano === entrada.ano) {
      ultimo.entradas.push(apresentada);
    } else {
      grupos.push({
        idade: entrada.idade,
        ano: entrada.ano,
        entradas: [apresentada]
      });
    }
  });

  return grupos;
}

/** Rótulo de idade coerente com singular/plural e com o ano 0. */
export function rotuloIdade(idade: number): string {
  if (idade === 0) return 'Nascimento';
  if (idade === 1) return '1 ano';
  return `${idade} anos`;
}
