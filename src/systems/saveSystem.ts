import { GameState, GlobalStats, PastLifeRecord, PostMortemSummary } from '../types';

const SAVE_KEY = 'VIDA_GAME_SAVE_V1';
const STATS_KEY = 'VIDA_GLOBAL_STATS_V1';

export function salvarJogo(estado: GameState): boolean {
  try {
    const dados = JSON.stringify(estado);
    localStorage.setItem(SAVE_KEY, dados);
    return true;
  } catch (error) {
    console.warn('Erro ao salvar jogo no LocalStorage:', error);
    return false;
  }
}

export function carregarJogo(): GameState | null {
  try {
    const dados = localStorage.getItem(SAVE_KEY);
    if (!dados) return null;
    return JSON.parse(dados) as GameState;
  } catch (error) {
    console.warn('Erro ao carregar jogo do LocalStorage:', error);
    return null;
  }
}

export function limparSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn('Erro ao remover save:', error);
  }
}

export function carregarEstatisticasGlobais(): GlobalStats {
  try {
    const dados = localStorage.getItem(STATS_KEY);
    if (!dados) {
      return {
        vidasJogadas: 0,
        totalAnosVividos: 0,
        maiorIdade: 0,
        maiorPatrimonio: 0,
        totalFilhos: 0,
        historicoVidas: []
      };
    }
    return JSON.parse(dados) as GlobalStats;
  } catch {
    return {
      vidasJogadas: 0,
      totalAnosVividos: 0,
      maiorIdade: 0,
      maiorPatrimonio: 0,
      totalFilhos: 0,
      historicoVidas: []
    };
  }
}

export function registrarMorteNasEstatisticas(resumo: PostMortemSummary): void {
  try {
    const stats = carregarEstatisticasGlobais();

    const novoRegistro: PastLifeRecord = {
      id: `record_${Date.now()}`,
      nome: resumo.nomeCompleto,
      idadeMorte: resumo.idadeMorte,
      cidade: resumo.cidade,
      estado: resumo.estado,
      profissao: resumo.profissaoFinal,
      patrimonio: resumo.patrimonioFinal,
      pontuacao: resumo.pontuacaoVida,
      anoJogo: new Date().toLocaleDateString('pt-BR'),
      causaMorte: resumo.causaMorte
    };

    stats.vidasJogadas += 1;
    stats.totalAnosVividos += resumo.idadeMorte;
    stats.maiorIdade = Math.max(stats.maiorIdade, resumo.idadeMorte);
    stats.maiorPatrimonio = Math.max(stats.maiorPatrimonio, resumo.patrimonioFinal);
    stats.totalFilhos += resumo.quantidadeFilhos;
    stats.historicoVidas = [novoRegistro, ...stats.historicoVidas].slice(0, 30); // Mantém até 30 registros

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Erro ao registrar estatísticas globais:', error);
  }
}
