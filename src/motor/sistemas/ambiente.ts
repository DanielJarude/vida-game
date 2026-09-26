/**
 * O AMBIENTE onde o trabalho acontece — não o cargo.
 *
 * O jogo sabe o cargo ("diarista"), mas um acontecimento de trabalho precisa
 * saber onde ele se passa: uma diarista por conta trabalha em casas de
 * clientes, com agenda e confiança — não tem chefia, colega de mesa nem
 * relatório. Uma trabalhadora doméstica de carteira tem patroa, mas não
 * "a empresa". Um caixa tem gerente, colegas e o caixa para fechar. Um dono
 * tem funcionários e fornecedores.
 *
 * Cada acontecimento pede as capacidades de que precisa (`noTrabalho`), e o
 * texto escolhe a variante do lugar. Nada de "se diarista, esconder X": a
 * elegibilidade vem do ambiente, derivado do estado (contrato, empregador,
 * setor, trilha, negócio).
 */

import type { Vida } from '../tipos';
import { ocupacaoOuNula, type Ocupacao } from '../dados/ocupacoes';
import { comChefia } from './ritmo';

export type Ambiente =
  /** Alguém acima que cobra e avalia. */
  | 'chefia'
  /** Gente do mesmo nível, no mesmo lugar, todo dia. */
  | 'colegas'
  /** Uma organização (empresa, órgão, hospital): RH, corte, festa, curso pago. */
  | 'organizacao'
  /** Papel, sistema, relatório, reunião. */
  | 'escritorio'
  /** Atendimento no balcão: clientes, caixa, estoque, gerente. */
  | 'balcao'
  /** Casas de outras pessoas (de clientes ou de patrões). */
  | 'residencias'
  /** Quem paga é o cliente, direto. */
  | 'clientes'
  /** A agenda e o preço são seus. */
  | 'agenda'
  | 'obra' | 'fabrica' | 'hospital' | 'escola' | 'farda' | 'estrada' | 'campo' | 'palco' | 'clube'
  /** Dono: funcionários, fornecedores, caixa. */
  | 'gestao';

const ESCRITORIO = new Set(['administrativo', 'financas', 'juridico', 'tecnologia', 'comunicacao', 'engenharia', 'publico']);
const TRILHAS_ESCRITORIO = new Set(['administrativo', 'contabil', 'financas', 'atendimento', 'ti', 'dados', 'direito', 'engenharia', 'arquitetura', 'eng_industrial', 'publico', 'judiciario', 'fiscal', 'comunicacao', 'design']);
const EM_CASAS = new Set(['domestico', 'cuidado', 'limpeza']);
const OBRA = new Set(['construcao', 'eletrica', 'hidraulica', 'marcenaria', 'manutencao']);

function doOficio(oc: Ocupacao, out: Set<Ambiente>) {
  if (oc.setor === 'industria' && oc.trilha !== 'costura') out.add('fabrica');
  if (OBRA.has(oc.trilha) || oc.setor === 'construcao') out.add('obra');
  if (oc.setor === 'saude') out.add('hospital');
  if (oc.setor === 'educacao') out.add('escola');
  if (oc.setor === 'seguranca') out.add('farda');
  if (oc.setor === 'transporte' || oc.setor === 'logistica') out.add('estrada');
  if (oc.setor === 'agro') out.add('campo');
  if (oc.setor === 'criativo') out.add('palco');
  if (oc.setor === 'esporte') out.add('clube');
  if (['comercio', 'alimentacao', 'beleza'].includes(oc.setor)) out.add('balcao');
  if (ESCRITORIO.has(oc.setor) || TRILHAS_ESCRITORIO.has(oc.trilha)) out.add('escritorio');
}

/** Onde o trabalho de hoje acontece (vazio: sem trabalho). */
export function ambienteDoTrabalho(v: Vida): Set<Ambiente> {
  const out = new Set<Ambiente>();
  const e = v.trabalho.atual;
  const n = v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado' ? v.caminhos.negocio : undefined;
  if (!e) { if (n) { out.add('gestao'); out.add('clientes'); } return out; }
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc) return out;
  // Dono do próprio negócio, no dia a dia.
  if (n && e.ocupacaoId === n.ocupacaoId) {
    out.add('gestao'); out.add('clientes'); out.add('agenda');
    if ((n.equipe?.length ?? 0) > 0) out.add('colegas');
    doOficio(oc, out);
    out.delete('escritorio');
    return out;
  }
  // Por conta (freguesia): clientes e agenda; o lugar é o do ofício.
  if (e.clientela !== undefined || e.contrato === 'autonomo' || e.contrato === 'informal') {
    out.add('clientes'); out.add('agenda');
    if (EM_CASAS.has(oc.trilha) || OBRA.has(oc.trilha)) out.add('residencias');
    doOficio(oc, out);
    // Quem trabalha por conta não tem mesa de escritório nem balcão de loja alheia.
    out.delete('escritorio');
    if (oc.setor !== 'beleza' && oc.setor !== 'alimentacao') out.delete('balcao');
    return out;
  }
  if (e.contrato === 'eletivo') { out.add('organizacao'); out.add('colegas'); out.add('escritorio'); return out; }
  if (comChefia(e)) out.add('chefia');
  // Trabalho doméstico de carteira: há patrão, mas não há "a empresa" nem colegas.
  if (EM_CASAS.has(oc.trilha) && /família|casa de família/.test(e.empregador)) { out.add('residencias'); return out; }
  out.add('organizacao');
  out.add('colegas');
  doOficio(oc, out);
  return out;
}

/** O trabalho de hoje acontece num lugar com todas estas capacidades? */
export function noTrabalho(v: Vida, ...pede: Ambiente[]): boolean {
  const a = ambienteDoTrabalho(v);
  return pede.every(x => a.has(x));
}

/** A variante de texto do lugar (a primeira capacidade que o trabalho tem). */
export function varianteDoLugar<T>(v: Vida, opcoes: Partial<Record<Ambiente, T>>, padrao: T): T {
  const a = ambienteDoTrabalho(v);
  for (const [k, t] of Object.entries(opcoes) as [Ambiente, T][]) if (a.has(k)) return t;
  return padrao;
}
