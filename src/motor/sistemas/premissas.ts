/**
 * REWORK 11 · Fase F (EVT-11.7) — AS PREMISSAS QUE O FUTURO PODE DESMENTIR. Um conteúdo de memória ("o sonho que ficou
 * para trás", "o caminho que não foi", "a decisão de sair do curso") nasce de um fato antigo — a dispensa da base, a
 * promoção recusada, o curso largado. Mas a vida continua depois do fato: o dispensado aos 14 virou profissional e
 * campeão; a empresa da promoção recusada ficou para trás; o curso novo também foi largado. A cena não pode contar a
 * premissa como se nada tivesse acontecido depois.
 *
 * `destinoDoSonho` lê o que veio DEPOIS de um instante, num domínio: as carreiras (esportivas e de técnico), o palmarés,
 * as marcas, os empregos, as obras e as rotinas. `premissaVale` responde, para cada premissa de memória, se ela ainda
 * é verdade agora — o `quando` dos conteúdos consulta aqui.
 */
import type { Dominio, Vida } from '../tipos';
import type { Eco } from './ecos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { carreirasEsportivas } from './esporte';
import { anoDe } from '../tempo';

export type DestinoDoSonho = 'abandonado' | 'retomado' | 'realizado' | 'transformado';

/** O domínio de uma ocupação (a modalidade do esporte, a linguagem da arte), e se é o ofício de ensinar/dirigir esse domínio. */
function dominioDaOcupacao(id: string): { d?: Dominio; ensino: boolean } {
  const oc = ocupacaoOuNula(id);
  if (!oc) return { ensino: false };
  const d = (oc.habilidade?.dominio ?? (oc as { modalidade?: Dominio }).modalidade) as Dominio | undefined;
  return { d, ensino: id === 'tecnico_futebol' || ['treino', 'ensino_musica', 'ensino_danca'].includes(oc.trilha ?? '') };
}

/** As temporadas profissionais de um domínio depois de um instante (todas as carreiras da vida). */
export function temporadasDepois(v: Vida, d: Dominio, t: number): number {
  const ano = anoDe(t);
  return carreirasEsportivas(v).filter(c => c.modalidade === d).reduce((a, c) => a + (c.temporadas ?? []).filter(x => x.ano >= ano).length, 0);
}

/**
 * O que aconteceu com um domínio DEPOIS de `t`:
 *  - realizado: virou profissão (temporadas no profissional, um título, a estreia, um emprego do ofício, obras lançadas);
 *  - transformado: não virou profissão, mas virou ensino, banco de técnico, comissão (o ofício vizinho);
 *  - retomado: voltou como prática (a marca de retomada, a rotina de agora);
 *  - abandonado: nada disso.
 */
export function destinoDoSonho(v: Vida, d: Dominio, t: number): DestinoDoSonho {
  const marcas = v.caminhos.marcas.filter(m => m.t > t && m.dominio === d);
  const empregos = [v.trabalho.atual, ...v.trabalho.historico].filter((e): e is NonNullable<typeof e> => !!e && e.tInicio > t).map(e => dominioDaOcupacao(e.ocupacaoId)).filter(x => x.d === d);
  const realizado = temporadasDepois(v, d, t) > 0
    || (v.caminhos.palmares ?? []).some(c => c.modalidade === d && c.t > t)
    || marcas.some(m => m.tipo === 'profissional' || m.tipo === 'conquista' || m.tipo === 'fim_carreira')
    || empregos.some(x => !x.ensino)
    || (v.caminhos.obras ?? []).some(o => o.linguagem === d && o.t > t);
  if (realizado) return 'realizado';
  const tec = v.caminhos.tecnico;
  if (empregos.some(x => x.ensino) || (d === 'futebol' && !!tec && tec.tInicio > t)) return 'transformado';
  if (marcas.some(m => m.tipo === 'retomada' || m.tipo === 'ingresso') || v.rotinas.some(r => r.id === d && r.tInicio > t)) return 'retomado';
  return 'abandonado';
}

/** Os números da virada (para o texto que a reconhece): temporadas, o título mais recente, a estreia. */
export function viradaDoSonho(v: Vida, d: Dominio, t: number): { temporadas: number; titulo?: string; obras: number } {
  const titulo = [...(v.caminhos.palmares ?? [])].reverse().find(c => c.modalidade === d && c.t > t && (c.tipo === 'titulo' || c.tipo === 'selecao' || c.tipo === 'premio'));
  return { temporadas: temporadasDepois(v, d, t), titulo: titulo ? `${titulo.texto.replace(/\.$/, '')} (${titulo.ano})` : undefined, obras: (v.caminhos.obras ?? []).filter(o => o.linguagem === d && o.t > t).length };
}

/** Quem já viveu do domínio (para não dizer a um campeão que "houve um tempo em que era dos bons por aí"). */
export function passadoProfissional(v: Vida, d: Dominio): string | undefined {
  const ts = temporadasDepois(v, d, -Infinity);
  if (ts > 0) {
    const t = viradaDoSonho(v, d, -Infinity).titulo;
    return `Você foi profissional: ${ts} ${ts === 1 ? 'temporada' : 'temporadas'}${t ? ` — ${t.charAt(0).toLowerCase()}${t.slice(1)}` : ''}`;
  }
  const viveu = [v.trabalho.atual, ...v.trabalho.historico].some(e => e && dominioDaOcupacao(e.ocupacaoId).d === d && !dominioDaOcupacao(e.ocupacaoId).ensino);
  return viveu ? 'Você já viveu disso' : undefined;
}

export type Premissa =
  | { tipo: 'sonho'; d: Dominio; t: number }
  | { tipo: 'eco_recusou'; eco: Eco }
  | { tipo: 'eco_curso'; eco: Eco };

/**
 * A premissa de um conteúdo de memória ainda vale AGORA?
 *  - sonho: o domínio segue abandonado depois do fato;
 *  - eco_recusou ("o colega hoje é a sua chefia"): você continua no mesmo empregador da recusa, e não foi promovido depois;
 *  - eco_curso ("a decisão de sair hoje parece a mais lúcida"): houve um curso novo depois (em andamento, ou concluído),
 *    diferente do largado — e ele não foi largado também.
 */
export function premissaVale(v: Vida, p: Premissa): boolean {
  if (p.tipo === 'sonho') return destinoDoSonho(v, p.d, p.t) === 'abandonado';
  const e = p.eco;
  if (p.tipo === 'eco_recusou') {
    const atual = v.trabalho.atual;
    if (!atual) return false;
    // O eco antigo (antes do REWORK 11) não guardava o empregador: vale só se o emprego atual já existia na recusa.
    if (e.empregador !== undefined ? atual.empregador !== e.empregador : atual.tInicio > e.t) return false;
    return !v.caminhos.marcas.some(m => m.tipo === 'promocao' && m.t > e.t);
  }
  const largouDeNovo = (v.ecos ?? []).some(x => x.tipo === 'mudou_de_curso' && x !== e && x.t > e.t);
  if (largouDeNovo) return false;
  const m = v.educacao.matricula;
  const outroCurso = (id: string) => (e.cursoId === undefined ? true : id !== e.cursoId);
  const cursando = !!m && !m.trancado && m.tInicio > e.t && outroCurso(m.cursoId);
  const concluiu = v.educacao.concluidos.some(x => x.tFim > e.t && outroCurso(x.cursoId));
  return cursando || concluiu;
}
