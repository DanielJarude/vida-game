/**
 * Objetivos: a memória de intenção. Quem tenta o mestrado três vezes, a
 * peneira duas, o concurso quatro, não está "fazendo coisas soltas" — está
 * perseguindo algo. O objetivo guarda o que se tenta, quantas vezes, o que
 * pesou por último e o que dá para fazer (quando é controlável).
 *
 * Não é quest log: nasce SOZINHO das tentativas (cada devolutiva registrada
 * alimenta o seu objetivo — `devolutivas.registrarDevolutiva`), com a causa
 * que a própria conta do motor deu. Nada aqui inventa motivo depois.
 */

import type { Devolutiva, Objetivo, Vida } from '../tipos';

const LIMITE = 12;
/** Um objetivo sem tentativa há tanto tempo deixa de ser "o que você vem tentando" (fica na memória). */
export const MESES_ATIVO = 48;

/** A chave estável de um objetivo a partir de uma tentativa. */
export function chaveDaTentativa(d: Pick<Devolutiva, 'tipo' | 'titulo' | 'ocupacaoId' | 'dominio' | 'cursoId'>): string {
  if (d.cursoId) return `${d.tipo}:${d.cursoId}`;
  if (d.tipo === 'arte') return `arte:${/^edital/i.test(d.titulo) ? 'edital' : 'teste'}`;
  if (d.tipo === 'peneira') return `peneira:${d.dominio ?? 'esporte'}`;
  if (d.ocupacaoId) return `${d.tipo}:${d.ocupacaoId}`;
  return `${d.tipo}:${d.titulo.replace(/"[^"]*"/g, '').trim().toLowerCase()}`;
}

const TITULO: Partial<Record<Devolutiva['tipo'], (d: Pick<Devolutiva, 'titulo'>) => string>> = {
  selecao: d => /^Seleção para a residência/.test(d.titulo) ? 'Entrar na residência médica' : d.titulo.replace(/^Seleção para /, 'Entrar no ').replace(/^Entrar no Doutorado/, 'Entrar no doutorado').replace(/^Entrar no Mestrado/, 'Entrar no mestrado'),
  arte: d => (/^edital/i.test(d.titulo) ? 'Aprovar um projeto num edital de cultura' : 'Passar num teste de elenco'),
  peneira: () => 'Passar numa peneira'
};

/** Registra uma tentativa no objetivo correspondente (criando-o na primeira). */
export function registrarTentativa(v: Vida, o: { id: string; titulo: string; passou: boolean; obstaculo?: string; caminho?: string }): Objetivo {
  const lista = (v.caminhos.objetivos ??= []);
  let x = lista.find(y => y.id === o.id);
  if (!x) {
    x = { id: o.id, titulo: o.titulo, tentativas: 0, tPrimeira: v.t, tUltima: v.t };
    lista.push(x);
    if (lista.length > LIMITE) lista.splice(0, lista.length - LIMITE);
  }
  // Um objetivo alcançado que volta a ser tentado (outro concurso, outra peneira) recomeça a contagem.
  if (x.tAlcancado !== undefined && !o.passou) { x.tAlcancado = undefined; x.tentativas = 0; x.tPrimeira = v.t; }
  x.tentativas += 1;
  x.tUltima = v.t;
  x.resultado = o.passou ? 'passou' : 'nao_passou';
  x.obstaculo = o.passou ? undefined : o.obstaculo;
  x.caminho = o.passou ? undefined : o.caminho;
  if (o.passou) x.tAlcancado = v.t;
  return x;
}

/** A partir de uma devolutiva (a fonte única do "o que pesou"). */
export function tentativaDaDevolutiva(v: Vida, d: Devolutiva, caminho?: string): Objetivo {
  return registrarTentativa(v, {
    id: chaveDaTentativa(d),
    titulo: TITULO[d.tipo]?.(d) ?? d.titulo.replace(/^Entrevista para /, 'Uma vaga de ').replace(/"[^"]*"/g, '').trim(),
    passou: d.passou,
    obstaculo: d.passou ? undefined : d.texto,
    caminho
  });
}

/** O que a pessoa vem tentando (ainda não alcançado, tentado nos últimos anos). */
export function objetivosAtivos(v: Vida): Objetivo[] {
  return (v.caminhos.objetivos ?? []).filter(o => o.tAlcancado === undefined && v.t - o.tUltima <= MESES_ATIVO).sort((a, b) => b.tUltima - a.tUltima);
}

export function objetivoPorId(v: Vida, id: string): Objetivo | undefined {
  return (v.caminhos.objetivos ?? []).find(o => o.id === id);
}
