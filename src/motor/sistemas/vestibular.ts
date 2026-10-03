/**
 * Vestibular: objetivo → situação → preparação dirigida → prova → devolutiva.
 *
 *   OBJETIVO       o curso que a pessoa quer (`educacao.objetivo`): Medicina,
 *                  Direito... A escolha é do jogador, em Estudos.
 *   SITUAÇÃO       a nota que a preparação de HOJE daria (`estimativaParaCurso`),
 *                  diante do corte, em palavras: longe, em construção, perto,
 *                  no corte. É a MESMA conta da prova (`escola.notaEsperadaArea`)
 *                  sem o acaso do dia — a tela não diz uma coisa e a prova, outra.
 *   PREPARAÇÃO     o cursinho é de Estudos (uma rotina da semana, fonte única):
 *                  acumula meses de preparo (`educacao.preparo`), que esfriam
 *                  quando para, e — com objetivo — puxa as matérias que o curso
 *                  pesa.
 *   PROVA          `escola.fazerEnem`: a esperada + o dia.
 *   DEVOLUTIVA     com objetivo, a prova deixa uma devolutiva: onde ficou diante
 *                  do corte, a matéria que mais pesou contra, e se subiu desde a
 *                  última tentativa.
 */

import { educacaoDaVida } from '../mundo/vida';
import type { Rng } from '../rng';
import type { Devolutiva, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { cursoOuNulo, type Curso, type Materia } from '../dados/cursos';
import { praticar } from './frentes';
import { NOME_MATERIA, notaEsperadaArea, AREAS_ENEM, temCota } from './escola';
import { registrarDevolutiva } from './devolutivas';
import { anoDe } from '../tempo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

/** Faz cursinho? A rotina é a única fonte (o que ocupa a semana é o que prepara). */
export const fazCursinho = (v: Vida) => v.rotinas.some(r => r.id === 'cursinho');

/** Meses de preparação acumulados (saves antigos: o cursinho do ano conta como um ano). */
export function mesesDePreparo(v: Vida): number {
  return v.educacao.preparo?.meses ?? (v.educacao.cursinho ? 12 : 0);
}

/** O que a preparação acrescenta à nota de cada área: rende muito no primeiro ano e pouco depois. */
export function bonusDoPreparo(v: Vida): number {
  return Math.round(45 * (1 - Math.exp(-mesesDePreparo(v) / 9)));
}

/** Um ano de cursinho: preparo acumulado e as matérias praticadas — as que o curso-objetivo pesa, mais. */
export function prepararVestibular(v: Vida, r: Rng): void {
  const p = v.educacao.preparo ?? (v.educacao.preparo = { meses: mesesDePreparo(v) });
  p.meses += 12;
  p.tUltimo = v.t;
  const alvo = objetivoCurso(v);
  const foco = v.educacao.focoMateria;
  for (const a of AREAS_ENEM) {
    const peso = alvo?.pesos?.[a] ?? 0;
    const w = alvo ? 0.35 + 0.25 * peso : 0.5;
    // O foco numa matéria (a que a própria estimativa aponta como fraca) puxa o cursinho para ela.
    praticar(v, r, a, 0.5 * w * (foco ? (a === foco ? 1.8 : 0.85) : 1), 1);
  }
}

/* ------------------------------------------------------ Estudo dirigido */

/**
 * Estudar uma matéria específica: a que a estimativa diz que mais pesa. É a
 * resposta acionável a "o que ajuda agora: mais português" — pratica a MESMA
 * variável que a nota da prova lê (`habilidade` da área) e, com cursinho,
 * puxa a preparação para ela. Uma vez por ano (é um ano de estudo, não um clique).
 */
export function podeEstudarMateria(v: Vida, area?: string): Veredito {
  if (!area || !AREAS_ENEM.includes(area as Materia)) return bloqueio('impossivel', 'Essa matéria não existe na prova.');
  if (idade(v) < 13) return bloqueio('requisito', 'A partir dos 13.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  const t = v.fatos['estudo_dirigido_t'];
  if (t !== undefined && v.t - t < 12) return bloqueio('incompativel', `O estudo dirigido deste ano já foi para ${NOME_MATERIA[v.educacao.focoMateria ?? 'linguagens']}.`);
  return PERMITIDO;
}

export function estudarMateria(v: Vida, r: Rng, area: Materia): { texto: string } {
  v.fatos['estudo_dirigido_t'] = v.t;
  v.educacao.focoMateria = area;
  const antes = Math.round(notaEsperadaArea(v, area));
  praticar(v, r, area, 0.9, 1);
  v.mente.estresse = Math.min(100, v.mente.estresse + 2);
  const depois = Math.round(notaEsperadaArea(v, area));
  const COMO: Record<string, string> = { linguagens: 'redação toda semana, gramática, leitura dirigida', exatas: 'lista de exercícios todo dia, as contas refeitas até sair', ciencias: 'resumos, experimentos em vídeo, as fórmulas no caderno', humanas: 'linha do tempo na parede, textos e mapas' };
  const texto = `Um ano de estudo dirigido em ${NOME_MATERIA[area]}: ${COMO[area]}.${fazCursinho(v) ? ' O cursinho passa a puxar para ela também.' : ''}${depois > antes ? ' Já se nota na preparação.' : ''}`;
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'estudo', escolha: true });
  return { texto };
}

/** Sem cursinho, a preparação esfria (o que se decorou para a prova vai embora). */
export function esfriarPreparo(v: Vida): void {
  const p = v.educacao.preparo;
  if (!p || p.meses <= 0) return;
  if (p.tUltimo !== undefined && v.t - p.tUltimo < 12) return;
  p.meses = Math.max(0, Math.round(p.meses * 0.6) - 1);
}

/* ---------------------------------------------------------------- Objetivo */

export const objetivoCurso = (v: Vida): Curso | undefined => (v.educacao.objetivo ? cursoOuNulo(v.educacao.objetivo.cursoId) : undefined);

export function podeDefinirObjetivo(v: Vida, cursoId?: string): Veredito {
  if (!cursoId) return v.educacao.objetivo ? PERMITIDO : bloqueio('incompativel', 'Não há objetivo definido.');
  if (idade(v) < 14) return bloqueio('impossivel', 'Ainda é cedo para escolher um curso.');
  const c = cursoOuNulo(cursoId);
  if (!c || c.nivel !== 'superior' || c.corte <= 0) return bloqueio('impossivel', `Esse curso não entra ${educacaoDaVida(v).pelo}.`);
  if (v.educacao.objetivo?.cursoId === cursoId) return bloqueio('incompativel', 'Esse já é o seu objetivo.');
  if (v.educacao.concluidos.some(x => x.cursoId === cursoId)) return bloqueio('incompativel', 'Você já se formou nesse curso.');
  if (v.educacao.matricula?.cursoId === cursoId) return bloqueio('incompativel', 'Você já está nesse curso.');
  return PERMITIDO;
}

export function definirObjetivo(v: Vida, cursoId?: string): string {
  if (!cursoId) {
    const antes = objetivoCurso(v);
    v.educacao.objetivo = undefined;
    return antes ? `Deixou de lado a ideia de ${antes.nome}.` : 'Sem objetivo.';
  }
  const c = cursoOuNulo(cursoId)!;
  v.educacao.objetivo = { cursoId, t: v.t };
  escrever(v, { texto: `Decidiu tentar ${c.nome}.`, relevancia: 'cotidiano', tema: 'estudo', escolha: true });
  const e = estimativaParaCurso(v, c);
  return `Objetivo: ${c.nome}. ${e.frase}`;
}

/* -------------------------------------------------------------- Situação */

export type SituacaoVestibular = 'longe' | 'construcao' | 'perto' | 'no_corte';
export const PALAVRA_SITUACAO: Record<SituacaoVestibular, string> = { longe: 'longe do corte', construcao: 'em construção', perto: 'perto do corte', no_corte: 'no corte' };
const NIVEL_SITUACAO: Record<SituacaoVestibular, number> = { longe: 0, construcao: 1, perto: 2, no_corte: 3 };

export interface Estimativa {
  curso: Curso;
  /** A nota ponderada que a preparação de hoje daria, sem o acaso do dia. */
  nota: number;
  /** Faixa plausível (o dia da prova muda uns 30 pontos para cima ou para baixo). */
  faixa: [number, number];
  corte: number;
  situacao: SituacaoVestibular;
  nivel: number;
  /** A matéria que o curso pesa e que mais puxa para baixo. */
  fraca?: Materia;
  /** A última nota real para este curso (ENEM), para "desde". */
  ultima?: { t: number; nota: number };
  frase: string;
}

/** Cota: a MESMA regra do ingresso (`escola.temCota`). */
const cota = (v: Vida) => temCota(v);

/**
 * A FONTE ÚNICA de "o que mais pesa contra" para um curso: a área que mais
 * tira pontos da nota ponderada diante do corte — peso do curso × distância
 * do corte. A estimativa (a nota esperada, antes da prova) e a devolutiva (a
 * nota real, depois) passam pela mesma conta; se apontarem áreas diferentes,
 * a diferença é o dia da prova, e é dita assim.
 */
export function areaQueMaisPesa(notas: Record<Materia, number>, c: Curso, corte: number): Materia {
  const pesos = c.pesos ?? {};
  const perda = (a: Materia) => (1 + (pesos[a] ?? 0)) * (corte - notas[a]);
  return AREAS_ENEM.reduce((pior, a) => (perda(a) > perda(pior) ? a : pior), AREAS_ENEM[0]);
}

const pesaMais = (c: Curso, a: Materia) => ((c.pesos ?? {})[a] ?? 0) > 0 ? `, que ${c.nome} pesa mais` : '';

/** A nota esperada de cada área agora (sem o dia). */
export function notasEsperadas(v: Vida): Record<Materia, number> {
  const out = {} as Record<Materia, number>;
  for (const a of AREAS_ENEM) out[a] = notaEsperadaArea(v, a);
  return out;
}

export function situacaoDa(nota: number, corte: number): SituacaoVestibular {
  return nota >= corte - 5 ? 'no_corte' : nota >= corte - 35 ? 'perto' : nota >= corte - 100 ? 'construcao' : 'longe';
}

export function estimativaParaCurso(v: Vida, c: Curso): Estimativa {
  const pesos = c.pesos ?? {};
  let soma = 0, total = 0;
  const porArea = notasEsperadas(v);
  for (const a of AREAS_ENEM) {
    const w = 1 + (pesos[a] ?? 0);
    soma += porArea[a] * w; total += w;
  }
  const nota = Math.round(soma / total);
  const corte = c.corte - (cota(v) ? 45 : 0);
  const situacao = situacaoDa(nota, corte);
  const fraca = areaQueMaisPesa(porArea, c, corte);
  const ultimaProva = [...v.educacao.enem].reverse().find(x => x.areas);
  const ultima = ultimaProva ? { t: ultimaProva.t, nota: ponderada(ultimaProva.areas!, c) } : undefined;
  const falta = corte - nota;
  const partes: string[] = [];
  partes.push(situacao === 'no_corte' ? `Hoje, a preparação alcança o corte de ${c.nome} (~${corte}).`
    : `Hoje, a preparação daria algo entre ${nota - 30} e ${nota + 30} — ${PALAVRA_SITUACAO[situacao]} de ${c.nome} (~${corte}${falta > 0 ? `; faltam uns ${Math.round(falta / 10) * 10} pontos` : ''}).`);
  if (fraca && situacao !== 'no_corte') partes.push(`O que mais pesa contra: ${NOME_MATERIA[fraca]}${pesaMais(c, fraca)}.`);
  // A última prova para este curso apontou outra área? Foi o dia — e se diz.
  const dev = [...v.caminhos.devolutivas].reverse().find(d => d.tipo === 'vestibular' && d.titulo.endsWith(c.nome) && d.fraca);
  if (dev && dev.fraca !== fraca && situacao !== 'no_corte') {
    const nome = (x?: string) => NOME_MATERIA[x as Materia];
    partes.push(dev.fracaPrevista === fraca
      ? `(${educacaoDaVida(v).No} de ${anoDe(dev.t)}, quem mais pesou foi ${nome(dev.fraca)} — rendeu abaixo do que a preparação indicava, foi o dia; pela preparação, continua sendo ${nome(fraca)}.)`
      : `(${educacaoDaVida(v).No} de ${anoDe(dev.t)}, quem mais pesou foi ${nome(dev.fraca)}; desde então a preparação mudou, e hoje é ${nome(fraca)} que mais pesa.)`);
  }
  return { curso: c, nota, faixa: [nota - 30, nota + 30], corte, situacao, nivel: NIVEL_SITUACAO[situacao], fraca, ultima, frase: partes.join(' ') };
}

function ponderada(areas: Partial<Record<Materia, number>>, c: Curso): number {
  const pesos = c.pesos ?? {};
  let soma = 0, total = 0;
  for (const a of AREAS_ENEM) { const w = 1 + (pesos[a] ?? 0); soma += (areas[a] ?? 0) * w; total += w; }
  return Math.round(soma / total);
}

/** O que falta fazer, em palavras — o próximo passo da preparação. */
export function proximoPassoVestibular(v: Vida, e: Estimativa): string {
  if (e.situacao === 'no_corte') return v.educacao.enem.some(x => x.t > v.t - 12) ? `A nota está no nível: é tentar a vaga ${educacaoDaVida(v).vagas === 'o SISU' ? 'pelo SISU' : 'pela nota'}.` : `No nível do corte: fazer ${educacaoDaVida(v).o} é o próximo passo (o dia ainda pesa).`;
  const cursinho = fazCursinho(v);
  const meses = mesesDePreparo(v);
  const d = v.educacao.postura;
  const passos: string[] = [];
  if (!cursinho) passos.push('um cursinho (é a preparação que mais sobe a nota no primeiro ano)');
  else if (meses >= 24) passos.push('o cursinho já rendeu o grosso; agora pesa mais a matéria fraca');
  if (e.fraca) passos.push(`estudar ${NOME_MATERIA[e.fraca]} de forma dirigida${v.educacao.focoMateria === e.fraca ? ' (é o foco agora; mais um ano ajuda)' : ''}`);
  if (v.educacao.basica && d !== 'dedicada') passos.push('estudar com dedicação na escola');
  if (!v.rotinas.some(r => r.id === 'leitura') && e.fraca === 'linguagens') passos.push('ler com regularidade (a redação agradece)');
  return passos.length ? `O que ajuda agora: ${passos.slice(0, 3).join('; ')}.` : 'Mais um ano de preparação encurta a distância.';
}

/* -------------------------------------------------------------- Devolutiva */

/**
 * Depois da prova, com objetivo: a devolutiva diz onde ficou diante do corte,
 * o que mais pesou e se melhorou desde a última vez.
 */
export function devolutivaDoEnem(v: Vida, areas: Record<Materia, number>): Devolutiva | undefined {
  const c = objetivoCurso(v);
  if (!c) return undefined;
  const nota = ponderada(areas, c);
  const corte = c.corte - (cota(v) ? 45 : 0);
  const situacao = situacaoDa(nota, corte);
  // A prova e a preparação passam pela mesma conta (`areaQueMaisPesa`); a preparação é a da véspera (o mesmo estado da prova, sem o dia).
  const fraca = areaQueMaisPesa(areas, c, corte);
  const fracaPrevista = areaQueMaisPesa(notasEsperadas(v), c, corte);
  const anterior = [...v.caminhos.devolutivas].reverse().find(d => d.tipo === 'vestibular' && d.titulo.endsWith(c.nome));
  const partes: string[] = [];
  partes.push(nota >= corte ? `Para ${c.nome} (corte ~${corte}), a nota ponderada foi ${nota}: alcança o corte.` : `Para ${c.nome} (corte ~${corte}), a nota ponderada foi ${nota}: ${PALAVRA_SITUACAO[situacao]}.`);
  if (nota < corte) partes.push(fraca === fracaPrevista
    ? `O que mais pesou contra: ${NOME_MATERIA[fraca]}${pesaMais(c, fraca)} — como a preparação indicava.`
    : `O que mais pesou contra, nesta prova: ${NOME_MATERIA[fraca]}, que rendeu abaixo do que a preparação indicava (o dia pesa); na preparação, a área que mais pesa continua sendo ${NOME_MATERIA[fracaPrevista]}.`);
  if (anterior && anterior.nivel !== undefined) {
    const antes = Number((anterior.texto.match(/ponderada foi (\d+)/) ?? [])[1] ?? 0);
    const dif = nota - antes;
    partes.push(antes ? (dif >= 15 ? `Desde ${educacaoDaVida(v).o} de ${anoDe(anterior.t)}, subiu ${dif} pontos.` : dif <= -15 ? `Desde ${educacaoDaVida(v).o} de ${anoDe(anterior.t)}, caiu ${-dif} pontos.` : `Desde ${educacaoDaVida(v).o} de ${anoDe(anterior.t)}, ficou onde estava.`) : '');
  }
  return registrarDevolutiva(v, {
    tipo: 'vestibular', titulo: `${educacaoDaVida(v).nome} ${anoDe(v.t)} — ${c.nome}`, texto: partes.filter(Boolean).join(' '),
    passou: nota >= corte, perto: nota < corte && situacao === 'perto', falta: nota >= corte ? undefined : 'preparo', nivel: NIVEL_SITUACAO[situacao],
    fraca, fracaPrevista
  });
}
