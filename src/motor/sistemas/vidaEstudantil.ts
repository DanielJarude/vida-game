/**
 * Formação 2.0 (REWORK 4): o ano dentro da escola e da faculdade.
 *
 * "A vida acontece; às vezes você decide." Aqui, o que acontece sozinho: um
 * momento por ano, escolhido pelo CONTEXTO (a idade ou o ano do curso, a
 * matéria forte e a fraca, o desempenho, a rede, o jeito da pessoa, o que ela
 * pratica) e pela FAMÍLIA do curso (`dados/vidaEstudantil`). Cada momento:
 *   - envolve gente de verdade (o professor que repara — que vira mentor, que
 *     indica —; o colega da turma — o gesto que pode virar amizade);
 *   - vai para sistemas que já existem (a prática da frente, a cabeça, o
 *     desempenho, a saúde, a marca da trajetória);
 *   - fica na HISTÓRIA DA FORMAÇÃO (`Educacao.trajetoria`), que a tela de
 *     Formação e o legado leem anos depois.
 * Nenhum momento se repete na mesma vida. Sorteios derivados.
 */

import type { MarcoDeFormacao, Pessoa, Vida } from '../tipos';
import { clamp, rngDe, type Rng } from '../rng';
import { escrever, idade, lembrarCom, vinculosVivos } from '../nucleo';
import { flex } from '../texto';
import { curso } from '../dados/cursos';
import { DETALHES, MOMENTOS_DA_ESCOLA, MOMENTOS_DA_FACULDADE, MOMENTOS_DO_CURSO, familiaDoCurso, type MomentoDeFormacao } from '../dados/vidaEstudantil';
import { instituicaoAtual, professorDe, registrarNaFormacao, type Instituicao } from './formacao';
import { habilidade, materiasExtremas, praticar } from './frentes';
import { marcar } from './marcas';

const MATERIA: Record<string, string> = { exatas: 'matemática', linguagens: 'redação', ciencias: 'ciências', humanas: 'história' };

function condicao(v: Vida, se: MomentoDeFormacao['se']): boolean {
  if (!se) return true;
  const ex = materiasExtremas(v);
  const desempenho = v.educacao.matricula?.desempenho ?? v.educacao.basica?.desempenho ?? 55;
  switch (se) {
    case 'forte': return !!ex.forte;
    case 'fraca': return !!ex.fraca;
    case 'alto': return desempenho >= 75;
    case 'baixo': return desempenho < 50;
    case 'publica': return v.educacao.basica?.rede === 'publica';
    case 'privada': return v.educacao.basica?.rede === 'privada';
    case 'impulsivo': return v.personalidade.tracos.impulsividade >= 15;
    case 'esporte': return v.rotinas.some(r => ['time_escola', 'futebol', 'volei', 'basquete', 'atletismo'].includes(r.id)) || habilidade(v, 'futebol') >= 25;
    case 'arte': return v.rotinas.some(r => ['teatro', 'musica', 'danca', 'desenho'].includes(r.id)) || v.personalidade.tracos.sociabilidade >= 10;
  }
}

/** Os momentos possíveis agora (os da idade ou do ano do curso, que ainda não aconteceram nesta vida). */
export function momentosPossiveis(v: Vida): { lista: MomentoDeFormacao[]; curso: boolean } {
  // O momento que é DE um professor só acontece com um professor de verdade na vida (o que reparou).
  const inst = instituicaoAtual(v);
  const temProf = !!inst && !!professorDe(v, inst);
  const ja = (id: string) => v.fatos[`vest:${id}`] !== undefined || ((id === 'fac_professor' || id === 'esc_reforco_professor') && !temProf);
  const m = v.educacao.matricula;
  if (m && !m.trancado) {
    const c = curso(m.cursoId);
    if (c.nivel === 'superior' || c.nivel === 'tecnico') {
      const ano = Math.floor((v.t - m.tInicio) / 12) + 1;
      const fam = familiaDoCurso(c.area, c.nivel);
      const proprios = (MOMENTOS_DO_CURSO[fam] ?? []).filter(x => ano >= x.de && ano <= x.ate);
      const comuns = c.nivel === 'superior' ? MOMENTOS_DA_FACULDADE.filter(x => ano >= x.de && ano <= x.ate && (x.id !== 'fac_tcc' || ano >= Math.max(3, Math.ceil(c.meses / 12)))) : [];
      return { lista: [...proprios, ...proprios, ...comuns].filter(x => !ja(x.id) && condicao(v, x.se)), curso: true };
    }
  }
  if (v.educacao.basica) {
    const i = idade(v);
    return { lista: MOMENTOS_DA_ESCOLA.filter(x => i >= x.de && i <= x.ate && !ja(x.id) && condicao(v, x.se)), curso: false };
  }
  return { lista: [], curso: false };
}

/** Um colega de verdade da instituição de agora (quem convive ali e não é da família). */
function colegaDaTurma(v: Vida, r: Rng): Pessoa | undefined {
  const lugar = v.educacao.matricula && !v.educacao.matricula.trancado ? 'faculdade' : 'escola';
  const lista = vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && x.vin.convivio.includes(lugar) && !x.vin.formacao?.papel?.startsWith('prof'));
  return lista.length ? r.pick(lista).p : undefined;
}

function aplicar(v: Vida, inst: Instituicao, x: MomentoDeFormacao, r: Rng): string {
  const ex = materiasExtremas(v);
  const materia = MATERIA[(x.se === 'fraca' ? ex.fraca : ex.forte) ?? 'linguagens'] ?? 'redação';
  let prof: Pessoa | undefined;
  // Só o professor que já existe na vida (o que reparou): o momento não cria gente nova — a história usa quem está lá.
  if (x.professor) prof = professorDe(v, inst);
  const colega = x.colega ? colegaDaTurma(v, r) : undefined;
  const g = v.eu.tratamento ?? v.eu.genero;
  const nomeProf = prof ? `${flex(prof.genero, 'o professor', 'a professora', 'professore')} ${prof.nome}` : inst.tipo === 'escola' ? `a professora de ${materia}` : 'o professor da disciplina';
  let texto = r.pick(x.textos)
    .replace(/\{materia\}/g, materia)
    .replace(/\{inst\}/g, inst.nome)
    .replace(/\{curso\}/g, v.educacao.matricula ? curso(v.educacao.matricula.cursoId).nome.replace(/^Técnico em /, '').replace(/^(.)/, x => x.toLowerCase()) : 'o curso')
    .replace(/\{prof\}/g, nomeProf)
    .replace(/\{colega\}/g, colega?.nome ?? flex(g, 'um colega', 'uma colega', 'ume colegue'))
    .replace(/\{o\}/g, flex(g, 'o', 'a', 'e'))
    .replace(/\{(projeto|passeio|tema)\}/g, (_, k: string) => r.pick(DETALHES[k]));
  texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  // O que o momento faz — sempre por sistemas que já existem.
  for (const [d, w] of x.pratica ?? []) praticar(v, r, d, w, 1);
  if (x.estresse) v.mente.estresse = clamp(v.mente.estresse + x.estresse);
  if (x.saude) v.corpo.saude = clamp(v.corpo.saude + x.saude);
  if (x.desempenho) {
    const m = v.educacao.matricula;
    if (m && !m.trancado) m.desempenho = clamp(m.desempenho + x.desempenho);
    else if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho + x.desempenho);
  }
  if (prof && v.vinculos[prof.id]) { v.vinculos[prof.id].confianca = clamp(v.vinculos[prof.id].confianca + 3); lembrarCom(v, prof.id, texto, 'escola', 1); }
  if (colega && v.vinculos[colega.id]) {
    const vin = v.vinculos[colega.id];
    // O momento junto é o gesto que pode virar amizade (o resto é com a convivência e a afinidade — `social`).
    vin.aproximacao = v.t; vin.proximidade = clamp(vin.proximidade + 4); vin.tUltimoContato = v.t;
    lembrarCom(v, colega.id, texto, 'escola', 1);
  }
  if (x.conquista) marcar(v, 'conquista', `${x.conquista}.`, 2);
  return texto;
}

/** O ano da vida estudantil: no máximo um momento (a vida acontece; nem todo ano tem um). */
export function processarVidaEstudantil(v: Vida): void {
  const inst = instituicaoAtual(v);
  if (!inst) return;
  const { lista, curso: ehCurso } = momentosPossiveis(v);
  if (!lista.length) return;
  const r = rngDe(v.id, 'vida_estudantil', v.t);
  if (!r.chance(ehCurso ? 0.75 : 0.55)) return;
  const x = r.pick(lista);
  v.fatos[`vest:${x.id}`] = v.t;
  const texto = aplicar(v, inst, x, r);
  const marcante = ['reconhecimento', 'estagio', 'projeto', 'pesquisa', 'formatura', 'pratica'].includes(x.tipo) || !!x.conquista;
  escrever(v, { texto, relevancia: marcante ? 'biografia' : 'cotidiano', tema: inst.tipo === 'escola' ? 'escola' : 'estudo', tom: x.tipo === 'dificuldade' || x.tipo === 'conflito' ? 'ruim' : x.tipo === 'reconhecimento' ? 'bom' : undefined });
  registrarNaFormacao(v, { t: v.t, idade: idade(v), instituicao: inst.nome, tipo: x.tipo, texto });
}

/** Guarda um momento na história da formação — a fonte única mora em `formacao` (os verbos da formação também gravam). */
export { registrarNaFormacao } from './formacao';

/** A história da formação agrupada por instituição (a mais recente por último). */
export function historiaDaFormacao(v: Vida): { instituicao: string; de: number; ate: number; momentos: MarcoDeFormacao[] }[] {
  const out: { instituicao: string; de: number; ate: number; momentos: MarcoDeFormacao[] }[] = [];
  for (const m of v.educacao.trajetoria ?? []) {
    const ult = out[out.length - 1];
    if (ult && ult.instituicao === m.instituicao) { ult.momentos.push(m); ult.ate = m.t; }
    else out.push({ instituicao: m.instituicao, de: m.t, ate: m.t, momentos: [m] });
  }
  return out;
}
