/**
 * Núcleo: consultas e escrita sobre uma `Vida`.
 *
 * Padrão de mutação: todo comando do motor abre uma TRANSAÇÃO — clona a vida,
 * cria o gerador a partir do estado salvo, altera o rascunho livremente e
 * grava o estado do gerador de volta. Fora da transação a vida é imutável.
 */

import { criarRng, type Rng } from './rng';
import { entrarNaVida } from './mundo/vida';
import type {
  Entrada, EventoSocial, Genero, Marco, Parentesco, Pessoa, Relevancia, Tema, Temperamento, TipoMarco, Vida, Vinculo
} from './tipos';
import { idadeEm } from './tempo';

export function transacao<T>(vida: Vida, fn: (v: Vida, r: Rng) => T): { vida: Vida; valor: T } {
  const v = structuredClone(vida);
  const r = criarRng(v.rng);
  // O texto desta vida fala na moeda do país onde ela mora (e no de depois, se ela mudou de país no caminho).
  entrarNaVida(v);
  const valor = fn(v, r);
  v.rng = r.estado();
  entrarNaVida(v);
  return { vida: v, valor };
}

export function novoId(v: Vida, prefixo: string): string {
  v.seq += 1;
  return `${prefixo}${v.seq.toString(36)}`;
}

/* ------------------------------------------------------------------ Idade */

export const idade = (v: Vida) => idadeEm(v.eu.tNasc, v.t);
/**
 * A idade de alguém AGORA — e, de quem morreu, a idade com que morreu (REWORK 7.5: a ficha de um avô dizia "morreu
 * aos 75" num lugar e "aos 76" noutro, porque metade das telas contava até hoje). Uma porta só para a idade de uma
 * pessoa: quem morreu para de envelhecer em `tMorte`.
 */
export const idadePessoa = (v: Vida, p: Pessoa) => idadeEm(p.tNasc, !p.vivo && p.tMorte !== undefined ? Math.min(v.t, p.tMorte) : v.t);
/** A idade com que alguém morreu (undefined se está vivo). */
export const idadeAoMorrer = (p: Pessoa): number | undefined => (!p.vivo && p.tMorte !== undefined ? idadeEm(p.tNasc, p.tMorte) : undefined);

/** REWORK 7.5: a entrada da Linha da Vida que conta a morte de alguém (a mais recente), para ligar o que vem depois. */
export function entradaDaMorte(v: Vida, pessoaId: string): Entrada | undefined {
  for (let k = v.biografia.length - 1; k >= 0; k--) {
    const e = v.biografia[k];
    if ((e.evento?.tipo === 'morte' || e.evento?.tipo === 'viuvez') && (e.evento.pessoaId === pessoaId || (!e.evento.pessoaId && e.pessoas?.includes(pessoaId)))) return e;
  }
  return undefined;
}

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

/**
 * REWORK 11 · REL-11.4: o romance que fica FORA da parceria principal — o caso escondido (`secreto`) ou o vínculo
 * consentido de um acordo aberto/poliamor (`paralelo`). Nenhum dos dois é a parceria de moradia, dinheiro e filhos.
 */
export const foraDaParceria = (rom: Vinculo['romance']) => !!rom && (!!rom.secreto || !!rom.paralelo);

/** Parceria romântica atual (namoro ou mais). Um caso escondido (ou um vínculo paralelo consentido) não é a parceria. */
export function parceiro(v: Vida): { p: Pessoa; vin: Vinculo } | undefined {
  return vinculosVivos(v).find(
    x => x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio) && !foraDaParceria(x.vin.romance)
  );
}

/** Alguém com quem está saindo (antes do namoro). */
export function saindoCom(v: Vida): { p: Pessoa; vin: Vinculo }[] {
  return vinculosVivos(v).filter(x => x.vin.romance?.estagio === 'saindo' && !foraDaParceria(x.vin.romance));
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
  /** Acontecimento social estruturado. */
  evento?: EventoSocial;
  /** REWORK 4: o fato estruturado por trás da frase. */
  fato?: Entrada['fato'];
  /** REWORK 7.5: a entrada de que esta é consequência (ver `Entrada.segue`). */
  segue?: string;
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
    escolha: e.escolha,
    evento: e.evento,
    ...(e.fato ? { fato: e.fato } : {}),
    ...(e.segue ? { segue: e.segue } : {})
  };
  v.biografia.push(entrada);
  return entrada;
}

/**
 * REWORK 7.5: guarda a marca de uma cena vivida com alguém (`Vinculo.cenas`, a antirrepetição compacta). As
 * microcenas (marcas sem prefixo, "comum.2") e as situações de conversa (com prefixo, "conv:lembranca") têm
 * memórias separadas, de quatro cada — uma não apaga a outra.
 */
export function marcarCena(vin: Vinculo, marca: string): void {
  const todas = [...(vin.cenas ?? []), marca];
  const temPrefixo = (x: string) => x.includes(':');
  vin.cenas = [...todas.filter(x => !temPrefixo(x)).slice(-4), ...todas.filter(temPrefixo).slice(-4)];
}

/** Quantos marcos a história com uma pessoa guarda (os menos importantes saem primeiro). */
export const LIMITE_HISTORIA = 30;

/**
 * Acrescenta um marco à história compartilhada com alguém. Só o que importa:
 * quem chama decide o peso (1 corriqueiro, 2 importante, 3 marcante). Quando
 * a história enche, sai o marco mais antigo entre os de menor peso.
 */
export function lembrarCom(v: Vida, pessoaId: string, texto: string, tipo?: TipoMarco, peso = 1, t = v.t, de?: Marco['de']): void {
  const vin = v.vinculos[pessoaId];
  if (!vin) return;
  if (vin.historia.some(h => h.texto === texto && Math.abs(h.t - t) < 12)) return;
  const m: Marco = { t, texto, tipo, peso, ...(de ? { de } : {}) };
  vin.historia.push(m);
  vin.historia.sort((a, b) => a.t - b.t);
  while (vin.historia.length > LIMITE_HISTORIA) {
    const menor = Math.min(...vin.historia.map(h => h.peso ?? 1));
    const idx = vin.historia.findIndex(h => (h.peso ?? 1) === menor);
    vin.historia.splice(idx, 1);
  }
}

/* ------------------------------------------------------------------- Fatos */

export const fato = (v: Vida, chave: string) => v.fatos[chave];
export const temFato = (v: Vida, chave: string) => v.fatos[chave] !== undefined;

/** REWORK 12.3 · F1: os marcos de uma vez só de alguém ('eu' = quem é jogado). */
const marcosDe = (v: Vida, pessoaId: string) => (pessoaId === 'eu' ? v.eu.marcos : v.pessoas[pessoaId]?.marcos);
/** O marco já aconteceu com essa pessoa (em qualquer geração)? */
export const temMarco = (v: Vida, pessoaId: string, chave: string) => marcosDe(v, pessoaId)?.[chave] !== undefined;
/**
 * Os marcos da infância de quem é jogado: o acontecimento, a chave, e a idade em que a janela abre. Quem passa a ser
 * jogado (sucessão) já depois dessa idade não vive o marco "pela primeira vez" de novo — a vida anterior pode tê-lo
 * narrado como marco do filho (`fil_palavra`), e na dúvida ele não se repete.
 */
export const MARCOS_DA_INFANCIA: [id: string, chave: string, desde: number][] = [['bb_primeiros_passos', 'primeiros_passos', 1], ['bb_primeira_palavra', 'primeira_palavra', 2], ['inf_primeiro_dia_aula', 'primeiro_dia_de_aula', 6], ['inf_alfabetizacao', 'alfabetizacao', 7]];
/** Registra o marco (a primeira vez vale: registrar de novo não muda o instante). */
export function registrarMarco(v: Vida, pessoaId: string, chave: string, t = v.t): void {
  const alvo = pessoaId === 'eu' ? v.eu : v.pessoas[pessoaId];
  if (!alvo) return;
  (alvo.marcos ??= {})[chave] ??= t;
}
export function marcarFato(v: Vida, chave: string): void {
  if (v.fatos[chave] === undefined) v.fatos[chave] = v.t;
}

export const generoEu = (v: Vida): Genero => v.eu.genero;

/** O país está em recessão? (estado do mundo, não da pessoa) */
export const emRecessao = (v: Vida) => v.economia?.fase === 'crise' || (v.fatos['recessao_ate'] ?? 0) > v.t;

/**
 * REWORK 5 — a ÚNICA porta para somar experiência numa trilha. O emprego, o bico, o ofício da família, a oportunidade e
 * a caserna somavam cada um os seus meses; juntos, uma trilha chegava a ganhar 20+ meses num ano ("25 anos de estrada" aos
 * 30). Aqui, nenhuma trilha ganha mais que 12 meses por ano de calendário — o tempo de verdade.
 */
export function somarExperiencia(v: Vida, trilha: string, meses: number): number {
  const ano = Math.floor(v.t / 12);
  const t = v.trabalho;
  if (!t.expAno || t.expAno.ano !== ano) t.expAno = { ano, m: {} };
  const ja = t.expAno.m[trilha] ?? 0;
  const ganho = Math.max(0, Math.min(meses, 12 - ja));
  if (ganho <= 0) return 0;
  t.expAno.m[trilha] = ja + ganho;
  t.experiencia[trilha] = (t.experiencia[trilha] ?? 0) + ganho;
  return ganho;
}
