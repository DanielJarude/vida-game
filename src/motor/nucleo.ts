/**
 * Núcleo: consultas e escrita sobre uma `Vida`.
 *
 * Padrão de mutação: todo comando do motor abre uma TRANSAÇÃO — clona a vida,
 * cria o gerador a partir do estado salvo, altera o rascunho livremente e
 * grava o estado do gerador de volta. Fora da transação a vida é imutável.
 */

import { criarRng, type Rng } from './rng';
import type {
  Entrada, Genero, Parentesco, Pessoa, Relevancia, Tema, Temperamento, Vida, Vinculo
} from './tipos';
import { idadeEm } from './tempo';

export function transacao<T>(vida: Vida, fn: (v: Vida, r: Rng) => T): { vida: Vida; valor: T } {
  const v = structuredClone(vida);
  const r = criarRng(v.rng);
  const valor = fn(v, r);
  v.rng = r.estado();
  return { vida: v, valor };
}

export function novoId(v: Vida, prefixo: string): string {
  v.seq += 1;
  return `${prefixo}${v.seq.toString(36)}`;
}

/* ------------------------------------------------------------------ Idade */

export const idade = (v: Vida) => idadeEm(v.eu.tNasc, v.t);
export const idadePessoa = (v: Vida, p: Pessoa) => idadeEm(p.tNasc, v.t);

/* ---------------------------------------------------------------- Pessoas */

export const pessoa = (v: Vida, id: string): Pessoa | undefined => v.pessoas[id];

export function vinculosVivos(v: Vida): { p: Pessoa; vin: Vinculo }[] {
  const out: { p: Pessoa; vin: Vinculo }[] = [];
  for (const vin of Object.values(v.vinculos)) {
    const p = v.pessoas[vin.pessoaId];
    if (p && p.vivo) out.push({ p, vin });
  }
  return out;
}

export function parentes(v: Vida, ...tipos: Parentesco[]): Pessoa[] {
  return vinculosVivos(v).filter(x => x.vin.parentesco && tipos.includes(x.vin.parentesco)).map(x => x.p);
}

export const pais = (v: Vida) => parentes(v, 'mae', 'pai');
export const mae = (v: Vida) => parentes(v, 'mae')[0];
export const pai = (v: Vida) => parentes(v, 'pai')[0];
export const irmaos = (v: Vida) => parentes(v, 'irmao', 'meio_irmao');
export const avos = (v: Vida) => parentes(v, 'avo');
export const filhos = (v: Vida) => parentes(v, 'filho', 'enteado');
export const pets = (v: Vida) => parentes(v, 'pet');

/** Parceria romântica atual (namoro ou mais). */
export function parceiro(v: Vida): { p: Pessoa; vin: Vinculo } | undefined {
  return vinculosVivos(v).find(
    x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio)
  );
}

/** Alguém com quem está saindo (antes do namoro). */
export function saindoCom(v: Vida): { p: Pessoa; vin: Vinculo }[] {
  return vinculosVivos(v).filter(x => x.vin.romance?.estagio === 'saindo');
}

export function amigos(v: Vida, minimo: 'amigo' | 'amigo_proximo' = 'amigo'): Pessoa[] {
  return vinculosVivos(v)
    .filter(x => !x.vin.parentesco && (x.vin.estagio === 'amigo_proximo' || (minimo === 'amigo' && x.vin.estagio === 'amigo')))
    .filter(x => !x.vin.romance || x.vin.romance.estagio === 'ex')
    .map(x => x.p);
}

export function moraCom(v: Vida): Pessoa[] {
  return vinculosVivos(v).filter(x => x.vin.convivio.includes('casa') && !x.p.especie).map(x => x.p);
}

/* ------------------------------------------------------------ Temperamento */

export function temperamentoAleatorio(r: Rng): Temperamento {
  const eixo = () => Math.max(-1, Math.min(1, r.normal() * 0.45));
  return { extroversao: eixo(), afabilidade: eixo(), responsabilidade: eixo(), abertura: eixo(), estabilidade: eixo() };
}

/** Descrição curta e estável de alguém, derivada do temperamento. */
export function jeitoDe(p: Pessoa): string {
  const t = p.temperamento;
  const g = p.genero;
  const f = (m: string, fe: string) => (g === 'feminino' ? fe : g === 'masculino' ? m : m.replace(/o$/, 'e'));
  const eixos: [number, string, string][] = [
    [t.extroversao, f('expansivo', 'expansiva'), f('reservado', 'reservada')],
    [t.afabilidade, 'de coração mole', f('difícil de agradar', 'difícil de agradar')],
    [t.responsabilidade, f('organizado', 'organizada'), f('desligado', 'desligada')],
    [t.abertura, f('curioso', 'curiosa'), f('tradicional', 'tradicional')],
    [t.estabilidade, f('tranquilo', 'tranquila'), f('ansioso', 'ansiosa')]
  ];
  const fortes = eixos
    .map(([val, pos, neg]) => ({ forca: Math.abs(val), texto: val >= 0 ? pos : neg }))
    .sort((a, b) => b.forca - a.forca)
    .slice(0, 2)
    .map(x => x.texto);
  return fortes.join(' e ');
}

/* --------------------------------------------------------------- Biografia */

export interface NovaEntrada {
  texto: string;
  relevancia?: Relevancia;
  tema: Tema;
  tom?: Entrada['tom'];
  pessoas?: string[];
  escolha?: boolean;
  /** Mês dentro do ano de vida (0..11) — para ordenar processos. */
  t?: number;
}

export function escrever(v: Vida, e: NovaEntrada): Entrada {
  const t = e.t ?? v.t;
  const entrada: Entrada = {
    id: novoId(v, 'e'),
    t,
    idade: idadeEm(v.eu.tNasc, t),
    texto: e.texto,
    relevancia: e.relevancia ?? 'biografia',
    tema: e.tema,
    tom: e.tom,
    pessoas: e.pessoas,
    escolha: e.escolha
  };
  v.biografia.push(entrada);
  return entrada;
}

/** Acrescenta um fato à história compartilhada com alguém. */
export function lembrarCom(v: Vida, pessoaId: string, texto: string): void {
  const vin = v.vinculos[pessoaId];
  if (!vin) return;
  vin.historia.push({ t: v.t, texto });
  if (vin.historia.length > 12) vin.historia.splice(0, vin.historia.length - 12);
}

/* ------------------------------------------------------------------- Fatos */

export const fato = (v: Vida, chave: string) => v.fatos[chave];
export const temFato = (v: Vida, chave: string) => v.fatos[chave] !== undefined;
export function marcarFato(v: Vida, chave: string): void {
  if (v.fatos[chave] === undefined) v.fatos[chave] = v.t;
}

export const generoEu = (v: Vida): Genero => v.eu.genero;
