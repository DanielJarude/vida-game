/**
 * VIDA 13 · Ações — os contextos das listas de ações (Caminhos, Trabalho, a vida pública, a banda, o negócio).
 *
 * Antes, uma lista de dezessete linhas iguais com seta (o vereador com desgaste via o mandato, o partido, a imagem e a
 * saída misturados). Agora cada ação cai num contexto coerente com o que ela FAZ — pelo id que o motor já dá a ela (nada
 * de sistema novo: as mesmas ações, só arrumadas). O que não tem contexto conhecido fica em "Outras".
 */

export interface GrupoDeAcoes13 { id: string; titulo: string; ordem: number }

const G = (id: string, titulo: string, ordem: number): GrupoDeAcoes13 => ({ id, titulo, ordem });

// Política (`politica.acoesPoliticas`, `presidencia129`).
const MANDATO = G('mandato', 'Mandato e governo', 1);
const CAMPANHA = G('campanha', 'Campanha e eleições', 2);
const PARTIDO = G('partido', 'Partido', 3);
const RELACOES = G('relacoes', 'Relações políticas', 4);
const EXPOSICAO = G('exposicao', 'Exposição pública', 5);
const ESTRATEGIA = G('estrategia', 'Estratégia', 6);
// Trabalho (`profissao.acoesDoTrabalho`).
const DIA = G('dia', 'O dia a dia', 1);
const CRESCER = G('crescer', 'Crescer na carreira', 2);
const MUDAR = G('mudar', 'Procurar e mudar', 3);
const OUTRAS = G('outras', 'Outras', 8);
export const SAIDAS13 = G('saidas', 'Saídas', 9);

const POR_ID: Record<string, GrupoDeAcoes13> = {
  pol_crise: MANDATO, pol_prioridade: MANDATO,
  pol_candidatura: CAMPANHA, pres_independente: CAMPANHA,
  pol_filiar: PARTIDO, pol_indicacao: PARTIDO, pol_trocar_partido: PARTIDO, pol_paz: PARTIDO,
  pol_negociar: RELACOES, pol_bases: RELACOES,
  pol_comunidade: EXPOSICAO, pol_responder: EXPOSICAO, pol_recolher: EXPOSICAO, pol_propostas: EXPOSICAO,
  pol_bandeira: ESTRATEGIA, pol_trocar_bandeira: ESTRATEGIA, pol_afastar: ESTRATEGIA,
  promocao: CRESCER, aumento: CRESCER, qualificar: CRESCER, pos: CRESCER, titulacao: CRESCER, residencia: CRESCER, estudar: CRESCER,
  taf: CRESCER, movimentacao: CRESCER, remocao: CRESCER, treinador: CRESCER,
  horas: DIA, sem_horas: DIA, ritmo_leve: DIA, ritmo_normal: DIA, ritmo_puxado: DIA, foco_normal: DIA, forcar: DIA, reduzir: DIA,
  preservar: DIA, preco_alto: DIA, preco_baixo: DIA, preco_normal: DIA, estrutura: DIA, diversificar: DIA, carteira: DIA, mei: DIA,
  facultativo: DIA, cooperativa: DIA, investir_terra: DIA, comprar_terra: DIA,
  vagas: MUDAR, outra_vaga: MUDAR, outras: MUDAR, mercado: MUDAR, procurar_clube: MUDAR, parar_procurar: MUDAR, voltar_procurar: MUDAR,
  voltar: MUDAR, concurso: MUDAR, concursos: MUDAR, negocio: MUDAR, outra_coisa: MUDAR, bico: MUDAR, aprendiz: MUDAR,
  voluntariado: MUDAR, sucessao: MUDAR
};

/** O contexto de uma ação (pelo id do motor). */
export function grupoDaAcao13(x: { id: string; saida?: boolean }): GrupoDeAcoes13 {
  if (x.saida) return SAIDAS13;
  const g = POR_ID[x.id];
  if (g) return g;
  if (/^pol_(cargo_|gov_)|^pres_/.test(x.id)) return MANDATO;
  if (x.id.startsWith('banco_')) return DIA;
  return OUTRAS;
}

/**
 * Separa a lista em contextos — só quando ajuda (cinco ações ou mais, em dois contextos ou mais). Dentro de cada um, a
 * ordem do motor (que já põe o que pesa mais primeiro); os contextos, na ordem fixa (o mandato antes da imagem).
 */
export function agruparAcoes13<T extends { id: string; saida?: boolean }>(acoes: T[]): { grupo: GrupoDeAcoes13; acoes: T[] }[] | null {
  const mapa = new Map<string, { grupo: GrupoDeAcoes13; acoes: T[] }>();
  for (const a of acoes) {
    const g = grupoDaAcao13(a);
    const e = mapa.get(g.id) ?? { grupo: g, acoes: [] };
    e.acoes.push(a);
    mapa.set(g.id, e);
  }
  const semSaidas = [...mapa.values()].filter(x => x.grupo.id !== 'saidas' && x.grupo.id !== 'outras');
  if (acoes.length < 5 || semSaidas.length < 2) return null;
  return [...mapa.values()].sort((a, b) => a.grupo.ordem - b.grupo.ordem);
}
