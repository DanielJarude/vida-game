/**
 * REWORK 10 · EVT-02 — OS ECOS: o que uma escolha deixa para depois. Não são flags soltas: cada eco é uma entrada com
 * tipo, quando nasceu, quem está nele, a janela em que pode voltar (de `volta` a `ate`) e se já voltou. Os
 * acontecimentos que respondem a ele (`conteudo/acontecimentos10`) só aparecem quando a janela está aberta E a vida está
 * na situação em que o eco faz sentido (o amigo que você ajudou aparece quando VOCÊ precisa; a carta do professor,
 * quando você se candidata). Um eco volta uma vez; passada a janela, some sem barulho.
 *
 *   favor            você ajudou alguém (o dinheiro emprestado, a mão na mudança)        → a ajuda volta na sua crise
 *   mentor           um professor apostou em você                                         → a carta de recomendação
 *   recusou          você recusou uma promoção ou uma transferência                       → o caminho que não foi
 *   fiador           você foi fiador de um parente                                        → a dívida pode chegar
 *   investiu         você pôs dinheiro no negócio de um amigo                             → o retorno, ou a perda
 *   denunciou        você denunciou um esquema                                            → o reconhecimento, ou o troco
 *   mudou_de_curso   você trocou de curso                                                 → a área nova abre (ou não) portas
 *   cuidou           você cuidou de alguém da família na doença                           → a família responde quando é você
 */
import type { Vida } from '../tipos';

export type TipoDeEco = 'favor' | 'mentor' | 'recusou' | 'fiador' | 'investiu' | 'denunciou' | 'mudou_de_curso' | 'cuidou';
export type Eco = NonNullable<Vida['ecos']>[number];

/** Guarda um eco (no máximo 24 vivos; o mais antigo sai). */
export function registrarEco(v: Vida, tipo: TipoDeEco, o: { pessoaId?: string; valor?: number; texto?: string; de?: number; ate?: number; empregador?: string; cursoId?: string } = {}): void {
  const lista = (v.ecos ??= []);
  lista.push({ tipo, t: v.t, volta: v.t + (o.de ?? 2) * 12, ate: v.t + (o.ate ?? 12) * 12, ...(o.pessoaId ? { pessoaId: o.pessoaId } : {}), ...(o.valor !== undefined ? { valor: o.valor } : {}), ...(o.texto ? { texto: o.texto } : {}), ...(o.empregador ? { empregador: o.empregador } : {}), ...(o.cursoId ? { cursoId: o.cursoId } : {}) });
  if (lista.length > 24) lista.splice(0, lista.length - 24);
}

/** O eco desse tipo com a janela aberta agora (e a pessoa dele viva, quando há pessoa). */
export function ecoAberto(v: Vida, tipo: TipoDeEco): Eco | undefined {
  return v.ecos?.find(e => e.tipo === tipo && e.voltou === undefined && v.t >= e.volta && v.t <= e.ate && (!e.pessoaId || (v.pessoas[e.pessoaId]?.vivo && !!v.vinculos[e.pessoaId])));
}
/** Marca que o eco voltou (não volta de novo). */
export function ecoVoltou(v: Vida, e: Eco): void { e.voltou = v.t; }

/** A pessoa de um eco aberto (para os papéis dos acontecimentos). */
export const pessoaDoEco = (tipo: TipoDeEco) => (v: Vida) => { const e = ecoAberto(v, tipo); const p = e?.pessoaId ? v.pessoas[e.pessoaId] : undefined; return p ? [p] : []; };

/** Uma vez por ano: os ecos que passaram da janela sem voltar saem (a vida seguiu). */
export function processarEcos(v: Vida): void {
  if (!v.ecos) return;
  v.ecos = v.ecos.filter(e => e.voltou === undefined ? v.t <= e.ate : v.t - e.voltou <= 60);
  if (!v.ecos.length) v.ecos = undefined;
}
