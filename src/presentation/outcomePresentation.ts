/**
 * Resultado de ação e resumo anual — camada de APRESENTAÇÃO (B4).
 *
 * Separação obrigatória:
 *   resultado narrativo  ≠  efeito mecânico público  ≠  Linha da Vida
 *
 * Regra de privacidade preservada do B2/B3: traços de personalidade e
 * atributos internos (disciplina, empatia, ambição, estresse, reputação,
 * sociabilidade, condicionamento) NUNCA viram texto numérico para o jogador.
 * Este módulo só sabe montar efeitos públicos.
 */

import type { EventConsequence, LifeLogEntry, VisibleStats } from '../types';
import { formatarDinheiro } from '../utils/formatters';

/** Um efeito visível ao jogador, em linguagem humana. */
export interface EfeitoPublico {
  id: string;
  texto: string;
  tom: 'positivo' | 'negativo' | 'neutro';
}

const ROTULO_ATRIBUTO_VISIVEL: Record<keyof VisibleStats, string> = {
  felicidade: 'Felicidade',
  saude: 'Saúde',
  inteligencia: 'Inteligência',
  aparencia: 'Aparência'
};

/**
 * Traduz as consequências de uma escolha em efeitos públicos.
 *
 * Deliberadamente ignora `hiddenStats` e `impactosComportamentais`:
 * são estado interno do motor e continuam invisíveis.
 */
export function descreverEfeitosPublicos(
  consequencias: EventConsequence
): EfeitoPublico[] {
  const efeitos: EfeitoPublico[] = [];

  // Dinheiro — valor real vindo do motor, nunca um número de exemplo.
  if (typeof consequencias.dinheiro === 'number' && consequencias.dinheiro !== 0) {
    const ganhou = consequencias.dinheiro > 0;
    efeitos.push({
      id: 'dinheiro',
      texto: ganhou
        ? `${formatarDinheiro(consequencias.dinheiro)} recebidos`
        : `${formatarDinheiro(Math.abs(consequencias.dinheiro))} gastos`,
      tom: ganhou ? 'positivo' : 'negativo'
    });
  }

  // Atributos visíveis — direção da mudança, sem expor o delta numérico.
  if (consequencias.stats) {
    (Object.keys(consequencias.stats) as (keyof VisibleStats)[]).forEach(chave => {
      const delta = consequencias.stats?.[chave];
      if (typeof delta !== 'number' || delta === 0) return;
      const subiu = delta > 0;
      efeitos.push({
        id: `stat-${chave}`,
        texto: `${ROTULO_ATRIBUTO_VISIVEL[chave]} ${subiu ? 'aumentou' : 'diminuiu'}`,
        tom: subiu ? 'positivo' : 'negativo'
      });
    });
  }

  // Saúde tratada à parte pelo motor em alguns eventos.
  if (typeof consequencias.saudeDelta === 'number' && consequencias.saudeDelta !== 0) {
    const subiu = consequencias.saudeDelta > 0;
    efeitos.push({
      id: 'saude-delta',
      texto: `Saúde ${subiu ? 'aumentou' : 'diminuiu'}`,
      tom: subiu ? 'positivo' : 'negativo'
    });
  }

  // Relacionamento — direção, sem percentual.
  if (consequencias.relacionamentoDelta) {
    const { delta } = consequencias.relacionamentoDelta;
    if (delta !== 0) {
      const melhorou = delta > 0;
      efeitos.push({
        id: 'relacionamento',
        texto: melhorou
          ? 'Uma relação próxima melhorou'
          : 'Uma relação próxima ficou abalada',
        tom: melhorou ? 'positivo' : 'negativo'
      });
    }
  }

  if (consequencias.demissao) {
    efeitos.push({
      id: 'demissao',
      texto: 'Você perdeu o emprego',
      tom: 'negativo'
    });
  }

  if (consequencias.adicionarDoenca) {
    efeitos.push({
      id: 'doenca',
      texto: `Diagnóstico: ${consequencias.adicionarDoenca}`,
      tom: 'negativo'
    });
  }

  if (consequencias.curarDoenca) {
    efeitos.push({
      id: 'cura',
      texto: `Você se recuperou: ${consequencias.curarDoenca}`,
      tom: 'positivo'
    });
  }

  if (consequencias.adicionarFamiliar?.nome) {
    efeitos.push({
      id: 'familiar',
      texto: `${consequencias.adicionarFamiliar.nome} agora faz parte da sua vida`,
      tom: 'positivo'
    });
  }

  return efeitos;
}

/* ========================================================================== */
/*                               RESUMO ANUAL                                 */
/* ========================================================================== */

export interface ItemResumoAnual {
  id: string;
  texto: string;
  tom: 'positivo' | 'negativo' | 'neutro';
}

export interface ResumoAnual {
  idade: number;
  ano: number;
  itens: ItemResumoAnual[];
  /** Verdadeiro quando o ano não produziu acontecimentos relevantes. */
  silencioso: boolean;
}

/**
 * Monta o resumo do ano a partir dos logs que o motor acabou de gerar.
 *
 * "O que este ano fez com a minha vida?" — acontecimentos e mudanças, não
 * extrato técnico. Se nada relevante ocorreu, o resumo assume o silêncio em
 * vez de inventar drama.
 */
export function construirResumoAnual(
  idade: number,
  ano: number,
  logsDoAno: LifeLogEntry[]
): ResumoAnual {
  // Ruído de rotina não entra no resumo do ano.
  //
  // B4-FIX4 — quando a entrada declara `relevancia`, ela manda: 'textura' é
  // fundo e fica de fora, qualquer outro valor entra. Sem o campo (entradas
  // já persistidas em saves antigos), vale a heurística anterior por
  // categoria/tipo, para que nenhuma linha antiga mude de sentido ao ser
  // recarregada.
  const relevantes = logsDoAno.filter(log => {
    if (log.relevancia) return log.relevancia !== 'textura';
    if (log.categoria === 'cotidiano') return false;
    if (log.tipo === 'info' && log.categoria === 'geral') return false;
    return true;
  });

  const itens: ItemResumoAnual[] = relevantes.map(log => ({
    id: log.id,
    texto: log.texto,
    tom:
      log.tipo === 'negativo' || log.tipo === 'alerta'
        ? 'negativo'
        : log.tipo === 'positivo' || log.tipo === 'importante'
        ? 'positivo'
        : 'neutro'
  }));

  return {
    idade,
    ano,
    itens,
    silencioso: itens.length === 0
  };
}
