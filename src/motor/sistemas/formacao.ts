/**
 * Formação como AMBIENTE da vida — não só série, nota e diploma.
 *
 *   instituição → ambiente → pessoas → atividades → escolhas →
 *   desenvolvimento → oportunidades → consequências → trajetória
 *
 * Cada instituição (esta escola estadual, este campus do instituto federal,
 * esta universidade) tem uma identidade estável: um nome e um PERFIL — o que
 * existe ali (o time, a olimpíada, o grêmio, o reforço, o laboratório, a
 * iniciação científica, a atlética). Escola A ≠ escola B: uma escola com
 * poucos recursos não é "onde nada acontece" — as oportunidades são outras.
 *
 * As atividades são ROTINAS (uma fonte só para semana, custo e prática:
 * `sistemas/rotinas`), que moram em Formação. O que se vive nelas vira
 * VIVÊNCIA (`educacao.vivencias`): fica depois que a formação acaba e pesa em
 * portas futuras — a medalha na seleção do instituto, o projeto técnico no
 * estágio, a iniciação científica no mestrado, o grêmio na vida pública.
 *
 * Pessoas: colega ≠ amigo (a amizade continua pedindo gesto: `social`). Às
 * vezes um professor repara — e vira uma pessoa da vida, com UMA porta a
 * oferecer. Colegas de turma saem com a formação para o mundo do trabalho e
 * podem voltar anos depois, numa indicação.
 *
 * Sorteios deste módulo usam geradores derivados (`rngDe`): não mexem na
 * sequência do gerador principal.
 */

import { rngDe } from '../rng';
import type { Pessoa, TipoVivencia, Vida, Vivencia } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, temFato, vinculosVivos } from '../nucleo';
import { cursoOuNulo, ROTULO_AREA, type AreaFormacao } from '../dados/cursos';
import { municipio, nivelDeOferta } from '../dados/lugares';
import { OCUPACOES } from '../dados/ocupacoes';
import { criarPessoa, vincular } from '../pessoas';
import { habilidade, materiasExtremas } from './frentes';
import { marcar } from './marcas';
import { flex } from '../texto';
import { anoDoArco } from './arcos';

/* ------------------------------------------------------------ Instituição */

export type TipoInstituicao = 'infantil' | 'escola' | 'if' | 'universidade' | 'faculdade' | 'ead' | 'tecnico' | 'pos' | 'livre';

export type OfertaFormacao =
  | 'time' | 'olimpiada' | 'reforco' | 'projeto' | 'gremio' | 'ciencias' | 'teatro' | 'fanfarra' | 'xadrez' | 'parceria'
  | 'projeto_tecnico' | 'iniciacao' | 'monitoria' | 'extensao' | 'centro_academico' | 'atletica' | 'grupo_estudos' | 'empresa_junior';

export interface Instituicao {
  /** Identidade estável (o perfil vem daqui). */
  chave: string;
  /** Onde as pessoas convivem (a mesma chave do ambiente social). */
  ambiente?: string;
  tipo: TipoInstituicao;
  nome: string;
  /** Como a área Formação se chama agora ("Escola", "Instituto Federal", "Universidade"...). */
  rotulo: string;
  descricao: string;
  ofertas: OfertaFormacao[];
  municipioId: string;
  publica: boolean;
  /** Área do curso (técnico, faculdade, pós). */
  area?: string;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

const PATRONOS = ['Castro Alves', 'Cecília Meireles', 'Anísio Teixeira', 'Paulo Freire', 'Machado de Assis', 'Rui Barbosa', 'Santos Dumont', 'Monteiro Lobato', 'Carlos Drummond de Andrade', 'Chico Mendes', 'Zumbi dos Palmares', 'Nise da Silveira', 'Darcy Ribeiro', 'Oswaldo Cruz', 'Carolina Maria de Jesus', 'Tiradentes', 'Dom Pedro II', 'Clarice Lispector', 'Vital Brazil', 'Maria Quitéria', 'Joaquim Nabuco', 'Graciliano Ramos', 'Anita Garibaldi', 'Luiz Gonzaga'];
const PARTICULARES = ['Colégio Horizonte', 'Colégio São José', 'Colégio Santa Maria', 'Colégio Alfa', 'Colégio Crescer', 'Colégio Integração', 'Colégio Dom Bosco', 'Colégio Novo Tempo', 'Colégio Pioneiro', 'Colégio Vértice'];

const grupoEscolar = (etapa: string) => (etapa === 'creche' || etapa === 'pre' ? 'infantil' : etapa === 'medio' ? 'medio' : etapa === 'fundamental1' ? 'fund1' : 'fund2');

/** Probabilidade de cada oferta existir, por tipo de instituição (a semente da instituição decide). */
const PERFIS: Partial<Record<TipoInstituicao | 'fund1', Partial<Record<OfertaFormacao, number>>>> = {
  fund1: { time: 0.5, reforco: 0.6, projeto: 0.5, teatro: 0.3, xadrez: 0.3, fanfarra: 0.25, ciencias: 0.15 },
  escola: { time: 0.75, olimpiada: 0.72, reforco: 0.6, projeto: 0.55, gremio: 0.75, ciencias: 0.38, teatro: 0.4, xadrez: 0.35, fanfarra: 0.3, parceria: 0.45 },
  if: { projeto_tecnico: 1, time: 0.85, gremio: 0.85, olimpiada: 0.6, ciencias: 0.7, parceria: 0.6, teatro: 0.4 },
  universidade: { iniciacao: 0.95, monitoria: 0.85, extensao: 0.85, centro_academico: 0.9, atletica: 0.8, grupo_estudos: 1, empresa_junior: 0.55 },
  faculdade: { iniciacao: 0.35, monitoria: 0.55, extensao: 0.45, centro_academico: 0.5, atletica: 0.6, grupo_estudos: 1, empresa_junior: 0.3 },
  ead: { grupo_estudos: 0.8 },
  tecnico: { projeto_tecnico: 0.7, grupo_estudos: 0.7, parceria: 0.5 },
  pos: { grupo_estudos: 0.8, monitoria: 0.7 }
};

/** Áreas em que empresa júnior existe de fato. */
const AREAS_EMPRESA_JUNIOR = new Set(['administracao', 'economia', 'contabilidade', 'engenharia', 'engenharia_civil', 'computacao', 'arquitetura', 'direito', 'comunicacao', 'design']);

function perfil(v: Vida, chave: string, tipo: TipoInstituicao | 'fund1', publica: boolean, municipioId: string, area?: string): OfertaFormacao[] {
  const base = PERFIS[tipo] ?? {};
  const cidade = nivelDeOferta(municipioId);
  const out: OfertaFormacao[] = [];
  for (const [o, p0] of Object.entries(base) as [OfertaFormacao, number][]) {
    let p = p0;
    if (['ciencias', 'teatro', 'xadrez', 'fanfarra'].includes(o)) p += cidade * 0.05 + (publica ? 0 : 0.15);
    if (o === 'olimpiada' && !publica) p -= 0.15;
    if (o === 'reforco' && !publica) p -= 0.1;
    if (o === 'parceria' && cidade === 0) p -= 0.2;
    if (o === 'empresa_junior' && (!area || !AREAS_EMPRESA_JUNIOR.has(area))) p = 0;
    if (hash(`${v.id}:${chave}:${o}`) < p) out.push(o);
  }
  // Toda escola tem vida: se a sorte deixou pouco, ficam o reforço, um projeto, a quadra.
  if (tipo === 'escola' || tipo === 'fund1') for (const o of ['reforco', 'projeto', 'time'] as OfertaFormacao[]) if (out.length < 3 && !out.includes(o)) out.push(o);
  return out;
}

const NOME_OFERTA: Record<OfertaFormacao, string> = {
  time: 'um time que disputa os jogos escolares', olimpiada: 'turma de preparação para as olimpíadas', reforco: 'aula de reforço à tarde',
  projeto: 'um projeto que junta alunos e professores', gremio: 'um grêmio atuante', ciencias: 'um laboratório e um clube de ciências',
  teatro: 'um grupo de teatro', fanfarra: 'uma fanfarra', xadrez: 'tabuleiros de xadrez no recreio', parceria: 'parceria com empresas da cidade (jovem aprendiz)',
  projeto_tecnico: 'laboratórios e projetos técnicos', iniciacao: 'iniciação científica', monitoria: 'monitoria', extensao: 'projetos de extensão',
  centro_academico: 'um centro acadêmico', atletica: 'uma atlética', grupo_estudos: 'grupos de estudo', empresa_junior: 'uma empresa júnior'
};

function descrever(tipo: TipoInstituicao, publica: boolean, ofertas: OfertaFormacao[], municipioId: string, etapa?: string): string {
  const m = municipio(municipioId);
  const destaque = ofertas.filter(o => o !== 'grupo_estudos').slice(0, 3).map(o => NOME_OFERTA[o]);
  const lista = destaque.length > 1 ? `${destaque.slice(0, -1).join(', ')} e ${destaque[destaque.length - 1]}` : destaque[0] ?? '';
  const abre = tipo === 'infantil' ? (publica ? 'Uma escola pública de educação infantil' : 'Uma escolinha particular')
    : tipo === 'escola' ? (publica ? (etapa === 'medio' ? 'Uma escola estadual' : m.perfil === 'pequena' ? 'A escola municipal da cidade' : 'Uma escola municipal de bairro') : 'Um colégio particular')
      : tipo === 'if' ? 'Um campus do instituto federal, de dia inteiro'
        : tipo === 'universidade' ? 'Uma universidade pública' : tipo === 'faculdade' ? 'Uma faculdade particular'
          : tipo === 'ead' ? 'Um curso a distância: aula no celular, prova no polo' : tipo === 'tecnico' ? 'Uma escola técnica' : tipo === 'pos' ? 'Uma pós-graduação' : 'Um curso livre';
  if (tipo === 'infantil') return `${abre}: brincar, cantar, aprender a esperar a vez.`;
  return lista ? `${abre}. Tem ${lista}.` : `${abre}.`;
}

/** A instituição onde a pessoa está agora (a escola vem primeiro; sem nada, nenhuma). */
export function instituicaoAtual(v: Vida): Instituicao | undefined {
  const b = v.educacao.basica;
  const cidade = v.moradia.municipioId;
  if (b && !v.educacao.evadiu) {
    const g = grupoEscolar(b.etapa);
    const ambiente = `escola:${cidade}:${b.rede}:${g}`;
    if (b.integrado) {
      const chave = `if:${cidade}`;
      const c = cursoOuNulo(b.integrado);
      const ofertas = perfil(v, chave, 'if', true, cidade, c?.area);
      const m = municipio(cidade);
      return { chave, ambiente, tipo: 'if', nome: `Instituto Federal, campus ${m.perfil === 'pequena' ? 'da região' : m.nome}`, rotulo: 'Instituto Federal', descricao: descrever('if', true, ofertas, cidade), ofertas, municipioId: cidade, publica: true, area: c?.area };
    }
    if (g === 'infantil') {
      const chave = `${ambiente}`;
      return { chave, ambiente, tipo: 'infantil', nome: b.etapa === 'creche' ? (b.rede === 'publica' ? 'Creche municipal' : 'Creche particular') : (b.rede === 'publica' ? 'Escola de educação infantil' : 'Escolinha particular'), rotulo: 'Escola', descricao: descrever('infantil', b.rede === 'publica', [], cidade), ofertas: [], municipioId: cidade, publica: b.rede === 'publica' };
    }
    // Do 1º ao 9º ano, a escola municipal é uma; o médio, estadual, é outra.
    const chave = `escola:${cidade}:${b.rede}:${g === 'medio' ? 'medio' : 'fund'}`;
    const k = Math.floor(hash(`${v.id}:${chave}:nome`) * 1000);
    const nome = b.rede === 'privada' ? PARTICULARES[k % PARTICULARES.length] : `${g === 'medio' ? 'Escola Estadual' : 'Escola Municipal'} ${PATRONOS[k % PATRONOS.length]}`;
    const ofertas = perfil(v, chave, g === 'fund1' ? 'fund1' : 'escola', b.rede === 'publica', cidade).filter(o => o !== 'gremio' || g !== 'fund1').filter(o => o !== 'parceria' || g === 'medio');
    return { chave, ambiente, tipo: 'escola', nome, rotulo: 'Escola', descricao: descrever('escola', b.rede === 'publica', ofertas, cidade, b.etapa), ofertas, municipioId: cidade, publica: b.rede === 'publica' };
  }
  const m = v.educacao.matricula;
  if (m && !m.trancado) {
    const c = cursoOuNulo(m.cursoId);
    if (!c) return undefined;
    const tipo: TipoInstituicao = m.modalidade === 'ead' ? 'ead'
      : c.nivel === 'superior' ? (m.rede === 'publica' ? 'universidade' : 'faculdade')
        : c.nivel === 'tecnico' ? 'tecnico' : c.nivel === 'livre' ? 'livre' : 'pos';
    const chave = `sup:${m.instituicao}`;
    const area = m.area ?? c.area;
    const ofertas = perfil(v, chave, tipo, m.rede === 'publica', m.municipioId, area);
    const rotulo = tipo === 'universidade' || tipo === 'faculdade' ? (m.rede === 'publica' ? 'Universidade' : 'Faculdade')
      : tipo === 'ead' ? 'Curso a distância' : tipo === 'tecnico' ? 'Curso técnico' : tipo === 'livre' ? 'Curso'
        : c.nivel === 'mestrado' ? 'Mestrado' : c.nivel === 'doutorado' ? 'Doutorado' : c.nivel === 'residencia' ? 'Residência' : 'Especialização';
    const nome = m.instituicao.charAt(0).toUpperCase() + m.instituicao.slice(1);
    return { chave, ambiente: m.modalidade === 'presencial' ? `faculdade:${m.cursoId}:${m.tInicio}` : undefined, tipo, nome, rotulo, descricao: descrever(tipo, m.rede === 'publica', ofertas, m.municipioId), ofertas, municipioId: m.municipioId, publica: m.rede === 'publica', area };
  }
  return undefined;
}

/** A instituição de agora oferece isto? (Consumido pelas atividades em `rotinas`.) */
export function ofereceAqui(v: Vida, o: OfertaFormacao): boolean {
  return !!instituicaoAtual(v)?.ofertas.includes(o);
}

/* ------------------------------------------------------------- Atividades */

/** As atividades que moram em Formação (rotinas: a mesma semana, o mesmo custo). */
export const ROTINA_DA_OFERTA: Partial<Record<OfertaFormacao, string>> = {
  time: 'time_escola', olimpiada: 'olimpiada', reforco: 'reforco', projeto: 'projeto_escola', gremio: 'gremio', ciencias: 'clube_ciencias',
  teatro: 'teatro', fanfarra: 'fanfarra', xadrez: 'xadrez', projeto_tecnico: 'projeto_tecnico', iniciacao: 'iniciacao', monitoria: 'monitoria',
  extensao: 'extensao', centro_academico: 'centro_academico', atletica: 'atletica', grupo_estudos: 'grupo_estudos', empresa_junior: 'empresa_junior'
};

/** Rotinas que SÓ existem numa instituição (começam, mudam e param em Formação; somem quando ela acaba). */
export const DE_FORMACAO = new Set(['time_escola', 'olimpiada', 'reforco', 'projeto_escola', 'gremio', 'clube_ciencias', 'fanfarra', 'projeto_tecnico', 'iniciacao', 'monitoria', 'extensao', 'centro_academico', 'atletica', 'grupo_estudos', 'empresa_junior']);

/** A vivência que cada atividade deixa. */
export const VIVENCIA_DA_ROTINA: Record<string, TipoVivencia> = {
  time_escola: 'time', olimpiada: 'olimpiada', reforco: 'reforco', projeto_escola: 'projeto', gremio: 'gremio', clube_ciencias: 'ciencias',
  projeto_tecnico: 'projeto_tecnico', iniciacao: 'iniciacao', monitoria: 'monitoria', extensao: 'extensao', centro_academico: 'centro_academico',
  atletica: 'atletica', grupo_estudos: 'grupo_estudos', empresa_junior: 'empresa_junior', xadrez: 'xadrez'
};

export const NOME_VIVENCIA: Record<TipoVivencia, string> = {
  olimpiada: 'olimpíadas', projeto: 'projeto da escola', gremio: 'grêmio estudantil', time: 'time da escola', reforco: 'aula de reforço', ciencias: 'clube de ciências',
  projeto_tecnico: 'projeto técnico', iniciacao: 'iniciação científica', monitoria: 'monitoria', extensao: 'extensão', centro_academico: 'centro acadêmico',
  atletica: 'atlética', empresa_junior: 'empresa júnior', grupo_estudos: 'grupo de estudos', xadrez: 'equipe de xadrez'
};

/** Registra (ou estende) a vivência de uma atividade nesta instituição. */
export function registrarVivencia(v: Vida, tipo: TipoVivencia, extra: { area?: string; feito?: string; pessoaId?: string } = {}): Vivencia {
  const e = v.educacao;
  e.vivencias ??= [];
  const inst = instituicaoAtual(v);
  const chave = inst?.chave ?? 'formacao';
  let x = e.vivencias.find(y => y.tipo === tipo && y.tFim === undefined && (y.instituicao === chave || y.instituicao === 'escola:migrada'));
  if (!x) {
    x = { tipo, t: v.t, anos: 0, instituicao: chave, ...(extra.area ?? inst?.area ? { area: extra.area ?? inst?.area } : {}) };
    e.vivencias.push(x);
  }
  if (x.t !== v.t || x.anos === 0) x.anos += 1;
  if (extra.feito && !x.feito) x.feito = extra.feito;
  if (extra.pessoaId) x.pessoaId = extra.pessoaId;
  if (e.vivencias.length > 30) e.vivencias.splice(0, e.vivencias.length - 30);
  return x;
}

export const temVivencia = (v: Vida, tipo: TipoVivencia, filtro?: (x: Vivencia) => boolean) => (v.educacao.vivencias ?? []).some(x => x.tipo === tipo && (!filtro || filtro(x)));

const cursoAtualId = (v: Vida) => v.educacao.basica?.integrado ?? (v.educacao.matricula && !v.educacao.matricula.trancado ? v.educacao.matricula.cursoId : undefined);

/**
 * O ano de uma atividade de formação (chamado pela rotina): a vivência
 * cresce e, às vezes, dá um resultado — com o que ele abre. Nenhum
 * resultado é garantido; dedicação e habilidade mudam a chance.
 */
export function anoDaAtividade(v: Vida, id: string, nivel: number): void {
  const tipo = VIVENCIA_DA_ROTINA[id];
  if (!tipo) return;
  const inst = instituicaoAtual(v);
  if (!inst) return;
  const r = rngDe(v.id, 'atividade', id, v.t);
  const i = idade(v);
  const viv = registrarVivencia(v, tipo);
  const g = v.eu.tratamento ?? v.eu.genero;
  // A iniciação tem orientador: é quem aceitou você no projeto (antes do arco, que conta a história da pesquisa).
  if (id === 'iniciacao') {
    const c = cursoOuNulo(cursoAtualId(v) ?? '');
    if (c?.area) viv.area = v.educacao.matricula?.area ?? c.area;
    if (!viv.pessoaId) {
      const orient = professorDe(v, inst) ?? criarProfessor(v, inst, 'orientador');
      if (orient) {
        viv.pessoaId = orient.id;
        const vin = v.vinculos[orient.id];
        if (vin?.formacao) vin.formacao.papel = 'orientador';
        lembrarCom(v, orient.id, 'Começou a orientar você na iniciação científica.', 'inicio', 2);
        escrever(v, { texto: `Começou uma iniciação científica, com orientação ${flex(orient.genero, 'do professor', 'da professora', 'de professore')} ${orient.nome}.`, relevancia: 'biografia', tema: 'estudo', tom: 'bom', pessoas: [orient.id] });
      }
    }
  }
  // As atividades com história interna (o time, a olimpíada, o projeto, a robótica, o reforço, o xadrez — e as da universidade): `arcos`.
  if (anoDoArco(v, id, viv, nivel, r)) return;
  switch (id) {
    case 'projeto_tecnico': {
      const c = cursoOuNulo(cursoAtualId(v) ?? '');
      if (c?.area) viv.area = c.area;
      if (!viv.feito && viv.anos >= 1 && r.chance(0.35 + (nivel - 1) * 0.1)) {
        viv.feito = 'o projeto técnico apresentado numa mostra';
        escrever(v, { texto: `O projeto no laboratório${c ? ` (${c.nome.replace(/^Técnico em /, '').toLowerCase()})` : ''} foi apresentado numa mostra de tecnologia. Uma empresa pediu o contato da turma.`, relevancia: 'biografia', tema: 'estudo', tom: 'bom' });
      }
      break;
    }
    case 'iniciacao': {
      const c = cursoOuNulo(cursoAtualId(v) ?? '');
      if (c?.area) viv.area = v.educacao.matricula?.area ?? c.area;
      // A iniciação tem orientador: é quem aceitou você no projeto.
      if (!viv.pessoaId) {
        const orient = professorDe(v, inst) ?? criarProfessor(v, inst, 'orientador');
        if (orient) {
          viv.pessoaId = orient.id;
          const vin = v.vinculos[orient.id];
          if (vin?.formacao) vin.formacao.papel = 'orientador';
          lembrarCom(v, orient.id, 'Começou a orientar você na iniciação científica.', 'inicio', 2);
          escrever(v, { texto: `Começou uma iniciação científica, com orientação ${flex(orient.genero, 'do professor', 'da professora', 'de professore')} ${orient.nome}.`, relevancia: 'biografia', tema: 'estudo', tom: 'bom', pessoas: [orient.id] });
        }
      }
      if (!viv.feito && viv.anos >= 1 && r.chance(0.3 + (v.mente.cognicao - 50) / 200)) {
        viv.feito = r.chance(0.3) ? 'um artigo publicado com a orientadora' : 'um trabalho apresentado num congresso';
        escrever(v, { texto: viv.feito.startsWith('um artigo') ? 'Saiu o primeiro artigo com o seu nome — o último da lista de autores, mas o seu.' : 'Apresentou o trabalho da iniciação num congresso, com a voz tremendo nos primeiros minutos.', relevancia: 'biografia', tema: 'estudo', tom: 'bom' });
        marcar(v, 'conquista', `Iniciação científica: ${viv.feito}.`, 2);
      }
      break;
    }
    case 'centro_academico': case 'gremio': {
      // A eleição do grêmio já é conteúdo (`esc_gremio_eleicao`); aqui, a do centro acadêmico.
      if (id === 'centro_academico' && !viv.feito && habilidade(v, 'lideranca') >= 45 && r.chance(0.3)) {
        viv.feito = 'a coordenação do centro acadêmico';
        marcarFato(v, 'gremio_eleito');
        escrever(v, { texto: `Foi ${flex(g, 'eleito', 'eleita', 'eleite')} para a coordenação do centro acadêmico.`, relevancia: 'biografia', tema: 'estudo', tom: 'bom' });
        marcar(v, 'conquista', 'Coordenação do centro acadêmico.', 2, { dominio: 'lideranca' });
      }
      break;
    }
    case 'extensao': {
      if (!viv.feito && viv.anos >= 1 && r.chance(0.25)) {
        viv.feito = 'um projeto de extensão que chegou à comunidade';
        escrever(v, { texto: `O projeto de extensão ${r.pick(['levou atendimento a um bairro sem posto', 'abriu um cursinho popular no bairro', 'assessorou uma cooperativa da periferia', 'montou oficinas numa escola pública'])}. Gente de fora da universidade passou a contar com vocês.`, relevancia: 'biografia', tema: 'estudo', tom: 'bom' });
      }
      break;
    }
    case 'empresa_junior': {
      if (!viv.feito && viv.anos >= 1 && r.chance(0.3)) {
        viv.feito = 'o primeiro projeto para um cliente de verdade';
        escrever(v, { texto: 'Na empresa júnior, entregou o primeiro projeto para um cliente de verdade — com prazo, reunião e reclamação.', relevancia: 'cotidiano', tema: 'estudo', tom: 'bom' });
      }
      break;
    }
    default: break;
  }
  void i;
}

/** O que a atividade de apoio faz pela nota (consumido por `escola.calcularDesempenho`). */
export function bonusDeEstudo(v: Vida, basica: boolean): number {
  let b = 0;
  const tem = (id: string) => v.rotinas.some(r => r.id === id);
  if (basica && tem('reforco')) b += 6;
  if (!basica && tem('grupo_estudos')) b += 4;
  if (!basica && tem('monitoria')) b += 2;
  return b;
}

/* ------------------------------------------------------------- Pessoas */

/** O professor que já reparou em você nesta instituição (um por instituição). */
export function professorDe(v: Vida, inst: Instituicao): Pessoa | undefined {
  return vinculosVivos(v).find(x => x.vin.formacao && x.vin.formacao.instituicao === inst.chave && x.vin.formacao.papel !== 'colega')?.p;
}

/** As pessoas da formação de agora (quem convive ali), com o papel de cada uma. */
export function pessoasDaFormacao(v: Vida): { p: Pessoa; papel: 'professor' | 'orientador' | 'colega' | 'amigo' }[] {
  const inst = instituicaoAtual(v);
  if (!inst) return [];
  const out: { p: Pessoa; papel: 'professor' | 'orientador' | 'colega' | 'amigo' }[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || vin.parentesco) continue;
    if (vin.formacao && vin.formacao.instituicao === inst.chave && vin.formacao.papel !== 'colega') { out.push({ p, papel: vin.formacao.papel }); continue; }
    if (inst.ambiente && vin.ambiente === inst.ambiente && vin.convivio.length > 0) out.push({ p, papel: vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo' ? 'amigo' : 'colega' });
  }
  return out;
}

const MATERIA_PROF: Record<string, string> = { exatas: 'matemática', linguagens: 'português', ciencias: 'ciências', humanas: 'história' };

function criarProfessor(v: Vida, inst: Instituicao, papel: 'professor' | 'orientador', disciplina?: string): Pessoa | undefined {
  if (!inst.ambiente && inst.tipo !== 'ead') return undefined;
  const r = rngDe(v.id, 'professor', inst.chave, v.t);
  const p = criarPessoa(v, r, { idade: r.int(29, 58), municipioId: inst.municipioId });
  const superior = ['universidade', 'faculdade', 'pos', 'tecnico'].includes(inst.tipo);
  const area = inst.area && ROTULO_AREA[inst.area as AreaFormacao] ? ROTULO_AREA[inst.area as AreaFormacao].toLowerCase() : undefined;
  const de = disciplina ?? (superior || inst.tipo === 'if' ? area : undefined) ?? 'matemática';
  p.ocupacao = `${flex(p.genero, 'professor', 'professora', 'professore')}${superior ? ' universitári' + flex(p.genero, 'o', 'a', 'e') : ''}${de ? ` de ${de}` : ''}`;
  p.ocupacaoId = superior ? 'professor_univ' : inst.publica ? 'professor_concursado' : 'professor_fund';
  p.renda = superior ? 9000 : 4200;
  p.temperamento.afabilidade = Math.max(p.temperamento.afabilidade, 0.2);
  p.temperamento.responsabilidade = Math.max(p.temperamento.responsabilidade, 0.3);
  const vin = vincular(v, p, { origem: superior ? 'faculdade' : 'escola', proximidade: 30, convivio: superior ? ['faculdade'] : ['escola'], estagio: 'conhecido' });
  vin.ambiente = inst.ambiente;
  vin.formacao = { papel, instituicao: inst.chave, ...(inst.area ? { area: inst.area } : {}) };
  return p;
}

/**
 * O ano da formação: atividades que perderam o lugar (a escola acabou) saem
 * da semana e a vivência se fecha; às vezes um professor repara (e vira
 * alguém da vida, com uma porta); o convite dele é oferecido uma vez.
 */
export function processarFormacao(v: Vida): void {
  const inst = ajustarAoLugarDeFormacao(v);
  if (!inst || inst.tipo === 'infantil' || inst.tipo === 'livre') return;
  formacaoDoAno(v, inst);
}

/**
 * O que era da instituição e ficou para trás — NA HORA da troca (mudança de
 * cidade, de rede, de etapa), não no fim do ano: a atividade institucional
 * da escola antiga (o time, o grêmio, a fanfarra) acaba; a vivência se fecha;
 * quem era de lá vira passado de formação. O que é independente da escola (a
 * aula de música particular, o futebol da rua) continua; o histórico fica.
 */
export function ajustarAoLugarDeFormacao(v: Vida): ReturnType<typeof instituicaoAtual> {
  const inst = instituicaoAtual(v);
  for (const rot of [...v.rotinas]) {
    if (!DE_FORMACAO.has(rot.id)) continue;
    const oferta = (Object.entries(ROTINA_DA_OFERTA).find(([, id]) => id === rot.id)?.[0]) as OfertaFormacao | undefined;
    // A atividade era DE uma instituição: trocou de instituição, ela acaba (mesmo que a nova tenha uma igual — lá, é outra entrada).
    const daMesma = rot.instituicao === undefined ? true : rot.instituicao === inst?.chave;
    if (daMesma && oferta && inst?.ofertas.includes(oferta)) continue;
    v.rotinas = v.rotinas.filter(x => x !== rot);
    const t = VIVENCIA_DA_ROTINA[rot.id];
    if (t) for (const x of v.educacao.vivencias ?? []) if (x.tipo === t && x.tFim === undefined) x.tFim = v.t;
  }
  for (const x of v.educacao.vivencias ?? []) {
    const rot = Object.entries(VIVENCIA_DA_ROTINA).find(([, t]) => t === x.tipo)?.[0];
    if (x.tFim === undefined && rot && !v.rotinas.some(r => r.id === rot)) x.tFim = v.t;
  }
  // Quem era da formação e a formação acabou: o papel fica, a convivência não.
  for (const { vin } of vinculosVivos(v)) if (vin.formacao && vin.formacao.tFim === undefined && vin.formacao.instituicao !== inst?.chave) vin.formacao.tFim = v.t;
  return inst;
}

function formacaoDoAno(v: Vida, inst: NonNullable<ReturnType<typeof instituicaoAtual>>): void {

  // 2. Um professor repara — por um motivo concreto.
  const i = idade(v);
  const r = rngDe(v.id, 'formacao', inst.chave, v.t);
  if (!professorDe(v, inst) && i >= 9) {
    const viv = (v.educacao.vivencias ?? []).filter(x => x.instituicao === inst.chave && x.tFim === undefined);
    const b = v.educacao.basica;
    const m = v.educacao.matricula;
    const desempenho = b?.desempenho ?? m?.desempenho ?? 50;
    const deAtividade = viv.find(x => ['olimpiada', 'projeto', 'ciencias', 'time', 'projeto_tecnico', 'extensao', 'monitoria'].includes(x.tipo) && (x.anos >= 2 || !!x.feito));
    const emReforco = v.rotinas.some(x => x.id === 'reforco');
    let motivo: { disc?: string; texto: string } | undefined;
    if (deAtividade && r.chance(0.4)) {
      const disc = { olimpiada: 'matemática', projeto: 'ciências', ciencias: 'ciências', time: 'educação física', extensao: undefined, monitoria: undefined, projeto_tecnico: undefined } as Record<string, string | undefined>;
      motivo = { disc: inst.tipo === 'escola' ? disc[deAtividade.tipo] : undefined, texto: `reparou no seu trabalho ${deAtividade.tipo === 'time' ? 'na quadra' : `no ${NOME_VIVENCIA[deAtividade.tipo]}`}` };
    } else if (desempenho >= 80 && r.chance(0.22)) {
      const forte = materiasExtremas(v).forte;
      motivo = { disc: inst.tipo === 'escola' && forte ? MATERIA_PROF[forte] : undefined, texto: 'reparou em como você pensa nas aulas' };
    } else if (emReforco && r.chance(0.3)) {
      const fraca = materiasExtremas(v).fraca;
      motivo = { disc: inst.tipo === 'escola' && fraca ? MATERIA_PROF[fraca] : undefined, texto: 'ficou depois da aula para explicar de novo o que não tinha entrado' };
    }
    if (motivo) {
      const p = criarProfessor(v, inst, 'professor', motivo.disc);
      if (p) {
        const quem = motivo.disc ? `${flex(p.genero, 'O professor', 'A professora', 'Professore')} de ${motivo.disc}, ${p.nome},` : `${flex(p.genero, 'O professor', 'A professora', 'Professore')} ${p.nome}`;
        escrever(v, { texto: `${quem} ${motivo.texto}.`, relevancia: 'biografia', tema: inst.tipo === 'escola' || inst.tipo === 'if' ? 'escola' : 'estudo', pessoas: [p.id] });
        lembrarCom(v, p.id, `${motivo.texto.charAt(0).toUpperCase() + motivo.texto.slice(1)}.`, 'inicio', 2);
      }
    }
  }
}

/**
 * O convite que um professor faz (uma vez): o que ele vê que faria diferença
 * — a prova do instituto federal, a olimpíada, um projeto, a iniciação
 * científica, a monitoria. A porta é oferecida por `oportunidades`; aceitar
 * começa a atividade (ou pesa na seleção). Devolve o convite ou nada.
 */
export function conviteDoProfessor(v: Vida): { pessoaId: string; atividade?: string; titulo: string; texto: string; incentivoIf?: boolean } | undefined {
  const inst = instituicaoAtual(v);
  if (!inst) return undefined;
  const p = professorDe(v, inst);
  if (!p || v.fatos[`convite_prof_${p.id}`] !== undefined) return undefined;
  const vin = v.vinculos[p.id];
  if (!vin || v.t - vin.tInicio < 12 && !temFato(v, 'convite_imediato')) return undefined;
  const i = idade(v);
  const b = v.educacao.basica;
  const ela = p.nome;
  const faz = (id: string) => v.rotinas.some(x => x.id === id);
  if (inst.tipo === 'escola' && b && (b.etapa === 'fundamental2' || b.etapa === 'medio' && b.serie === 1) && i >= 13 && i <= 15 && nivelDeOferta(v.moradia.municipioId) >= 0 && !b.integrado) {
    return { pessoaId: p.id, incentivoIf: true, titulo: `${ela} sugeriu a prova do instituto federal`, texto: `${ela} disse que você daria conta da prova do instituto federal — e ofereceu umas aulas de preparação depois do horário.` };
  }
  if ((inst.tipo === 'escola' || inst.tipo === 'if') && inst.ofertas.includes('olimpiada') && !faz('olimpiada') && i >= 11 && i <= 17) {
    return { pessoaId: p.id, atividade: 'olimpiada', titulo: `${ela} chamou para a turma da olimpíada`, texto: `${ela} montou uma turma para as olimpíadas de matemática e ciências e chamou você pelo nome.` };
  }
  if ((inst.tipo === 'escola' || inst.tipo === 'if') && inst.ofertas.includes('projeto') && !faz('projeto_escola') && i >= 10 && i <= 17) {
    return { pessoaId: p.id, atividade: 'projeto_escola', titulo: `${ela} chamou para um projeto`, texto: `${ela} está tocando um projeto na escola e precisa de gente que leve a sério.` };
  }
  if (inst.tipo === 'if' && !faz('projeto_tecnico')) {
    return { pessoaId: p.id, atividade: 'projeto_tecnico', titulo: `${ela} chamou para o laboratório`, texto: `${ela} tem um projeto no laboratório e perguntou se você quer entrar.` };
  }
  if ((inst.tipo === 'universidade' || inst.tipo === 'faculdade') && inst.ofertas.includes('iniciacao') && !faz('iniciacao') && (v.educacao.matricula?.desempenho ?? 0) >= 55) {
    return { pessoaId: p.id, atividade: 'iniciacao', titulo: `${ela} ofereceu uma iniciação científica`, texto: `${ela} tem uma vaga de iniciação científica no grupo de pesquisa, com bolsa, e pensou em você.` };
  }
  if ((inst.tipo === 'universidade' || inst.tipo === 'faculdade' || inst.tipo === 'pos') && inst.ofertas.includes('monitoria') && !faz('monitoria')) {
    return { pessoaId: p.id, atividade: 'monitoria', titulo: `${ela} chamou para a monitoria`, texto: `${ela} precisa de monitoria na disciplina e chamou você.` };
  }
  return undefined;
}

/* ----------------------------------------------------- Depois da formação */

/**
 * A formação acabou: a turma se espalha. Quem era colega leva a formação
 * para o trabalho — e pode reaparecer anos depois, numa indicação. O
 * professor fica na memória (sem convivência). Ninguém vira amigo por isso.
 */
export function aoConcluir(v: Vida, ambiente: string | undefined, instituicao: string, area?: string): void {
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || vin.parentesco) continue;
    if (vin.formacao && vin.formacao.instituicao === instituicao && vin.formacao.papel !== 'colega') { vin.formacao.tFim ??= v.t; continue; }
    if (!ambiente || vin.ambiente !== ambiente) continue;
    vin.formacao = { papel: 'colega', instituicao, ...(area ? { area } : {}), tFim: v.t };
    if (area && idadePessoa(v, p) >= 19 && (p.ocupacao === 'estudante' || !p.ocupacao)) {
      const opcoes = OCUPACOES.filter(o => o.area?.includes(area as never) && o.nivel <= 3 && o.contrato !== 'estagio' && !o.concurso);
      if (opcoes.length) {
        const oc = opcoes[Math.floor(hash(`${p.id}:carreira`) * opcoes.length) % opcoes.length];
        p.ocupacaoId = oc.id;
        p.ocupacao = p.genero === 'feminino' ? oc.nome[1] : oc.nome[0];
        p.renda = Math.round(oc.salario * 0.75 / 10) * 10;
      }
    }
  }
}

/** Ex-colegas de formação que trabalham numa área (quem pode indicar). */
export function exColegasDaArea(v: Vida, area: string): Pessoa[] {
  return vinculosVivos(v)
    .filter(x => x.vin.formacao?.papel === 'colega' && x.vin.formacao.area === area && x.p.ocupacaoId && x.p.renda > 0 && x.vin.estagio !== 'afastado' && x.vin.distancia === undefined)
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)
    .map(x => x.p);
}

/**
 * O quanto o que se viveu na formação pesa numa porta de trabalho (chance a
 * mais na seleção, até +0,1) e em que frase — a mesma conta para o motor e
 * para a tela (`empregabilidade.perfilParaVaga`).
 */
export function vivenciaQuePesa(v: Vida, oc: { area?: readonly string[]; trilha: string; setor: string }): { bonus: number; texto?: string } {
  const viv = v.educacao.vivencias ?? [];
  if (!viv.length) return { bonus: 0 };
  const areas = (oc.area ?? []).filter(a => a !== 'qualquer');
  let bonus = 0;
  let texto: string | undefined;
  const conta = (b: number, t: string) => { bonus += b; texto ??= t; };
  for (const x of viv) {
    const naArea = !!x.area && areas.includes(x.area);
    if (x.tipo === 'projeto_tecnico' && naArea) conta(0.05, `O projeto técnico da formação conta: você já fez isso na prática${x.feito ? ` (${x.feito})` : ''}.`);
    if (x.tipo === 'empresa_junior' && (naArea || ['administrativo', 'comercio', 'financas'].includes(oc.trilha))) conta(0.04, 'A empresa júnior pesa: projeto com cliente de verdade.');
    if (x.tipo === 'iniciacao' && (naArea || ['academia', 'pesquisa', 'docencia_superior'].includes(oc.trilha))) conta(['academia', 'pesquisa'].includes(oc.trilha) ? 0.08 : 0.04, `A iniciação científica aparece no currículo${x.feito ? `: ${x.feito}` : ''}.`);
    if (x.tipo === 'monitoria' && oc.setor === 'educacao') conta(0.04, 'A monitoria conta: você já deu aula, de algum jeito.');
    if (x.tipo === 'extensao' && naArea) conta(0.03, 'A extensão mostra trabalho com gente de verdade.');
    // A história da escola também conta: a robótica premiada para engenharia e TI; a medalha da olimpíada para quem vai para a área de exatas.
    if (x.tipo === 'ciencias' && x.feito && ['engenharia', 'eng_industrial', 'ti', 'dados', 'tecnico_industrial', 'eletrica'].includes(oc.trilha)) conta(x.feito.startsWith('prêmio') ? 0.04 : 0.02, `A robótica da escola aparece no currículo: ${x.feito}.`);
    if (x.tipo === 'olimpiada' && x.feito?.startsWith('medalha') && ['engenharia', 'ti', 'dados', 'financas', 'academia', 'pesquisa'].includes(oc.trilha)) conta(0.03, `A ${x.feito} na olimpíada ainda chama atenção.`);
  }
  return { bonus: Math.min(0.1, bonus), texto };
}

/** Pesa na seleção de mestrado e doutorado: a iniciação científica e a orientação que ficou (carta de recomendação). */
export function pesoNaPesquisa(v: Vida): number {
  const ic = temVivencia(v, 'iniciacao');
  const feito = temVivencia(v, 'iniciacao', x => !!x.feito);
  const orientador = vinculosVivos(v).some(x => x.vin.formacao?.papel === 'orientador' && x.vin.proximidade >= 25);
  return (ic ? 0.12 : 0) + (feito ? 0.06 : 0) + (orientador ? 0.07 : 0) + (temFato(v, 'medalha_nacional') ? 0.04 : 0);
}

/** Pesa na prova do instituto federal: a preparação que o professor ofereceu e a olimpíada. */
export function pesoNaSelecaoDoIf(v: Vida): number {
  return (temFato(v, 'incentivo_if') ? 0.1 : 0) + (temFato(v, 'medalha_obmep') ? 0.06 : 0);
}

/** Uma frase sobre o que ficou da formação (para Formação e Você). */
export function leituraDasVivencias(v: Vida): string[] {
  return (v.educacao.vivencias ?? [])
    .filter(x => x.anos >= 1 && x.tipo !== 'reforco' && x.tipo !== 'grupo_estudos')
    .map(x => `${NOME_VIVENCIA[x.tipo].charAt(0).toUpperCase() + NOME_VIVENCIA[x.tipo].slice(1)}${x.anos >= 2 ? `, ${x.anos} anos` : ''}${x.papel && !['participante', 'nos treinos'].includes(x.papel) ? ` — ${x.papel}` : ''}${x.feito ? ` — ${x.feito}` : ''}${x.tFim === undefined ? ' (agora)' : ''}`);
}

