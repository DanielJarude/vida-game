/**
 * A AGENDA DA SEMANA (REWORK 9 · Fase B): a semana em HORÁRIOS.
 *
 * O motor continua avançando por ano; a agenda é a ROTINA RECORRENTE que o ano
 * repete — e que pesa no resultado dele. Não é simulação minuto a minuto, nem
 * uma barra de energia: é a semana típica, segunda a domingo, das 6h à meia-noite.
 *
 * FONTE DE VERDADE: a agenda não inventa compromisso. Cada bloco nasce de algo
 * que existe no estado (a escola, a matrícula, o emprego, a trajetória em
 * paralelo, o negócio, a política, os filhos pequenos, quem precisa de
 * cuidado, o bicho, a pena, o trajeto, cada atividade de `v.rotinas`). Quando o
 * estado muda (o emprego acaba, a escola troca, a aposentadoria chega, nasce um
 * filho, a prisão), a agenda muda junto — nada fica para trás.
 *
 * O QUE O JOGADOR DECIDE (guardado em `v.agenda`, pequeno):
 *   - o TURNO do que tem turno (a escola a partir dos 11, o curso presencial de
 *     meio período, o emprego de meio período);
 *   - o LUGAR de cada atividade (dias e hora de começar). Sem lugar escolhido, a
 *     atividade é encaixada sozinha no primeiro horário livre que combina com ela.
 *
 * CONFLITOS nunca passam em silêncio: dois compromissos no mesmo horário, ou uma
 * atividade sem horário livre para todas as vezes da semana, viram `Conflito`,
 * com as alternativas que existem de fato (mudar o turno, remarcar, diminuir,
 * largar). Enquanto o conflito existe, ele COBRA: as vezes perdidas da
 * atividade não treinam (`presencaNaAtividade` → `rotinas.processarRotinas`); a
 * aula que o trabalho atravessa é falta (`presencaNaEscola`, `presencaNoCurso` →
 * o desempenho do ano).
 */

import type { Dia, LugarNaAgenda, Turno, Vida } from '../tipos';
import { escrever, filhos, idade, idadePessoa, moraCom, vinculosVivos } from '../nucleo';
import { curso, cursoOuNulo } from '../dados/cursos';
import { animal } from '../dados/animais';
import { listaNatural } from '../texto';
import { modeloRotina, nivelDa, nivelModelo, type CategoriaAtividade } from './rotinas';
import { semanaDaPolitica } from './politica';
import { deslocamento } from './transporte';
import { rngDe } from '../rng';
import { registrarAnaliseDeHorario, type Alternativa, type ConflitoDeEntrada } from './compromissos';
import { ocupacao, ocupacaoOuNula } from '../dados/ocupacoes';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'] as const;
export const DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
export const UTEIS: Dia[] = [0, 1, 2, 3, 4];
export const TODOS: Dia[] = [0, 1, 2, 3, 4, 5, 6];
/** A janela que a agenda desenha (e onde as atividades podem morar). */
export const ABRE = 6 * 60;
export const FECHA = 24 * 60;

export type OrigemDoBloco = 'escola' | 'curso' | 'trabalho' | 'paralela' | 'negocio' | 'politica' | 'rotina' | 'filhos' | 'cuidado' | 'pets' | 'prisao' | 'pena' | 'trajeto';
/** As fontes que têm turno (e o jogador pode escolher). */
export type FonteDeTurno = 'escola' | 'curso' | 'trabalho';

export interface Bloco {
  /** Estável: a origem e a referência (o mesmo compromisso tem o mesmo id ano após ano). */
  id: string;
  origem: OrigemDoBloco;
  /** A atividade (`v.rotinas`) ou o curso a distância, quando o bloco é de uma. */
  ref?: string;
  rotulo: string;
  detalhe?: string;
  dias: Dia[];
  inicio: number;
  fim: number;
  /** Não depende de escolha da semana (aula, expediente, pena, bebê): o que conflita com ele perde. */
  obrigatorio: boolean;
  /** Dá para remarcar (as atividades e o curso a distância). */
  movel: boolean;
  turno?: Turno;
  /** Os turnos possíveis para quem tem (vazio: não se escolhe). */
  turnos?: Turno[];
  fonteDoTurno?: FonteDeTurno;
  /** Quantas vezes por semana a atividade pede (as que não couberam viram conflito). */
  vezes?: number;
  /** O jogador escolheu este lugar (não é mais encaixado sozinho). */
  fixado?: boolean;
  categoria?: CategoriaAtividade;
  /** Alternado (plantão: um fim de semana sim, outro não). */
  alternado?: boolean;
}

export interface Conflito {
  id: string;
  tipo: 'sobreposicao' | 'sem_horario';
  /** Quem perde (o bloco que fica sem acontecer nessas horas) e quem ocupa. */
  perde: string;
  ocupa?: string;
  dias: Dia[];
  inicio: number;
  fim: number;
  texto: string;
  /** Quanto se perde do que o bloco pede na semana (0..1). */
  perda: number;
}

export interface Agenda {
  blocos: Bloco[];
  conflitos: Conflito[];
  /** Minutos livres por dia, entre 7h e 23h (o que sobra fora dos blocos). */
  livre: number[];
  /** A presença de cada bloco que perde horas (1 = tudo acontece). */
  presenca: Record<string, number>;
}

/* ------------------------------------------------------------ Turnos */

export const PALAVRA_TURNO: Record<Turno, string> = { manha: 'manhã', tarde: 'tarde', noite: 'noite', integral: 'período integral' };
const h = (hora: number, min = 0) => hora * 60 + min;
export const hora = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
export const faixaDeHoras = (b: { inicio: number; fim: number }) => `${hora(b.inicio)}–${hora(b.fim >= FECHA ? FECHA : b.fim)}`;

function diasEmPalavras(d: Dia[]): string {
  const s = [...d].sort();
  if (s.length === 7) return 'todo dia';
  if (s.length === 5 && s.every((x, k) => x === k)) return 'de segunda a sexta';
  if (s.length === 6 && s.every((x, k) => x === k)) return 'de segunda a sábado';
  if (s.length === 2 && s[0] === 5 && s[1] === 6) return 'no fim de semana';
  return listaNatural(s.map(x => DIAS[x]));
}
export const quando = (b: { dias: Dia[]; inicio: number; fim: number }) => `${diasEmPalavras(b.dias)}, ${faixaDeHoras(b)}`;

/** O turno padrão da escola (estável para a vida: metade das escolas públicas tem dois turnos). */
function turnoPadraoDaEscola(v: Vida): Turno {
  const b = v.educacao.basica!;
  if (b.eja) return 'noite';
  if (b.etapa === 'medio' || b.etapa === 'creche' || b.etapa === 'pre') return 'manha';
  return rngDe(v.id, 'turno-escola').next() < 0.35 ? 'tarde' : 'manha';
}

/** Os turnos que a escola permite escolher pela idade (a criança pequena vai no turno que a família consegue). */
function turnosDaEscola(v: Vida): Turno[] {
  const i = idade(v);
  const b = v.educacao.basica!;
  if (b.integrado || b.etapa === 'creche' || b.etapa === 'pre' || i < 11) return [];
  // O noturno: ensino médio (ou EJA) a partir dos 15.
  return i >= 15 && (b.etapa === 'medio' || b.eja) ? ['manha', 'tarde', 'noite'] : ['manha', 'tarde'];
}

const HORAS_DA_ESCOLA: Record<Turno, [number, number]> = { manha: [h(7), h(12)], tarde: [h(13), h(17, 30)], noite: [h(19), h(22, 30)], integral: [h(7, 30), h(16, 30)] };
const HORAS_DO_CURSO: Record<Turno, [number, number]> = { manha: [h(8), h(12)], tarde: [h(13, 30), h(17, 30)], noite: [h(19), h(22, 30)], integral: [h(8), h(17)] };
const HORAS_DO_TRABALHO: Record<Turno, [number, number]> = { manha: [h(8), h(12)], tarde: [h(13), h(17)], noite: [h(18), h(22)], integral: [h(8), h(17)] };

/* ------------------------------------------------------------ Os blocos fixos */

export interface TrabalhoHipotetico { ocupacaoId: string; carga?: 'integral' | 'parcial'; turno?: Turno }

/** Os blocos do trabalho principal (o de agora, ou um hipotético: a proposta que a decisão está pesando). */
export function blocosDoTrabalho(v: Vida, hip?: TrabalhoHipotetico): Bloco[] {
  const e = hip ? undefined : v.trabalho.atual;
  const ocId = hip?.ocupacaoId ?? e?.ocupacaoId;
  if (!ocId || ocId === '__nenhum__') return [];
  const oc = ocupacaoOuNula(ocId);
  const carga = hip?.carga ?? e?.carga ?? oc?.carga ?? 'integral';
  const nome = oc ? (v.eu.genero === 'feminino' ? oc.nome[1] : oc.nome[0]) : 'trabalho';
  const rot = `Trabalho (${nome})`;
  const base = { origem: 'trabalho' as const, obrigatorio: true, movel: false };
  if (e?.formacaoAte) return [{ ...base, id: 'trabalho', rotulo: `Curso de formação (${nome})`, dias: UTEIS, inicio: h(7), fim: h(18) }];
  if (e?.contrato === 'eletivo' || oc?.contrato === 'eletivo') return [{ ...base, id: 'trabalho', rotulo: `O mandato (${nome})`, dias: [0, 1, 2, 3], inicio: h(9), fim: h(19) }];
  if (oc?.trilha === 'atleta') return [
    { ...base, id: 'trabalho', rotulo: 'Treino no clube', detalhe: 'dois períodos', dias: [0, 1, 2, 3, 4, 5], inicio: h(9), fim: h(12) },
    { ...base, id: 'trabalho_tarde', rotulo: 'Treino no clube (tarde)', dias: [0, 1, 3, 4], inicio: h(15), fim: h(17) },
    { ...base, id: 'trabalho_jogo', rotulo: 'Jogo', detalhe: 'a rodada do fim de semana', dias: [6], inicio: h(16), fim: h(18, 30) }
  ];
  if (oc?.jornada === 'plantao') return [{ ...base, id: 'trabalho', rotulo: rot, detalhe: 'plantões de 12 horas', dias: [0, 2, 4], inicio: h(7), fim: h(19) }, { ...base, id: 'trabalho_fds', rotulo: `${rot} — fim de semana alternado`, dias: [6], inicio: h(7), fim: h(19), alternado: true }];
  if (oc?.jornada === 'fora') return [{ ...base, id: 'trabalho', rotulo: rot, detalhe: 'dias fora de casa', dias: UTEIS, inicio: h(6), fim: h(22) }];
  if (oc?.jornada === 'longa') return [{ ...base, id: 'trabalho', rotulo: rot, detalhe: 'jornada longa', dias: UTEIS, inicio: h(7), fim: h(19) }, { ...base, id: 'trabalho_sab', rotulo: `${rot} — sábado`, dias: [5], inicio: h(7), fim: h(12) }];
  if (carga === 'parcial') {
    const turnos: Turno[] = idade(v) >= 18 ? ['manha', 'tarde', 'noite'] : ['manha', 'tarde'];
    const t = hip?.turno ?? v.agenda?.turnos?.trabalho ?? turnoQueCabe(v, turnos, HORAS_DO_TRABALHO, ['escola', 'curso']) ?? 'manha';
    const [i0, i1] = HORAS_DO_TRABALHO[t];
    return [{ ...base, id: 'trabalho', rotulo: rot, detalhe: 'meio período', dias: UTEIS, inicio: i0, fim: i1, turno: t, turnos, fonteDoTurno: 'trabalho' }];
  }
  const fim = e?.reduzida ? h(14) : h(17);
  const out: Bloco[] = [{ ...base, id: 'trabalho', rotulo: rot, detalhe: e?.reduzida ? 'jornada reduzida' : undefined, dias: UTEIS, inicio: h(8), fim, turno: 'integral' }];
  if (!hip && v.trabalho.horasExtras) out.push({ ...base, id: 'horas_extras', rotulo: 'Horas extras', dias: UTEIS, inicio: fim, fim: fim + h(2) });
  return out;
}

/** O primeiro turno que não bate com a escola nem com o curso de agora (o encaixe automático do meio período). */
function turnoQueCabe(v: Vida, turnos: Turno[], horas: Record<Turno, [number, number]>, contra: OrigemDoBloco[]): Turno | undefined {
  const outros = blocosFixos(v, { semTrabalho: true }).filter(b => contra.includes(b.origem));
  return turnos.find(t => !outros.some(b => sobrepoe({ dias: UTEIS, inicio: horas[t][0], fim: horas[t][1] }, b)));
}

/** A escola e o curso de agora (com o turno guardado ou o padrão). */
function blocosDeEstudo(v: Vida): Bloco[] {
  const out: Bloco[] = [];
  const b = v.educacao.basica;
  if (b && !v.educacao.evadiu) {
    const turnos = turnosDaEscola(v);
    const t: Turno = b.integrado ? 'integral' : (v.agenda?.turnos?.escola && (turnos.includes(v.agenda.turnos.escola) || !turnos.length) ? v.agenda.turnos.escola : turnoPadraoDaEscola(v));
    const [i0, i1] = b.etapa === 'creche' || b.etapa === 'pre' ? [h(7, 30), h(11, 30)] : HORAS_DA_ESCOLA[t];
    out.push({ id: 'escola', origem: 'escola', rotulo: b.integrado ? 'Escola (médio integrado ao técnico)' : b.eja ? 'Escola (EJA)' : 'Escola', dias: UTEIS, inicio: i0, fim: i1, obrigatorio: true, movel: false, turno: t, turnos, fonteDoTurno: 'escola' });
  }
  const m = v.educacao.matricula;
  if (m && !m.trancado) {
    const c = cursoOuNulo(m.cursoId);
    const nome = c ? `${c.nivel === 'superior' ? 'Faculdade' : 'Curso'} (${c.nome})` : 'Curso';
    if (m.modalidade === 'ead') out.push({ id: 'curso_ead', origem: 'curso', ref: 'curso_ead', rotulo: `${nome}, a distância`, dias: [], inicio: 0, fim: 0, obrigatorio: false, movel: true, vezes: 3 });
    else if (c?.carga === 'integral' || m.cursoId === 'residencia') out.push({ id: 'curso', origem: 'curso', rotulo: nome, detalhe: 'período integral', dias: UTEIS, inicio: h(8), fim: m.cursoId === 'residencia' ? h(19) : h(17), obrigatorio: true, movel: false, turno: 'integral' });
    else {
      const turnos: Turno[] = ['manha', 'tarde', 'noite'];
      const t = v.agenda?.turnos?.curso ?? (v.trabalho.atual && v.trabalho.atual.carga === 'integral' ? 'noite' : turnoQueCabeContraTrabalho(v) ?? 'noite');
      const [i0, i1] = HORAS_DO_CURSO[t];
      out.push({ id: 'curso', origem: 'curso', rotulo: nome, dias: UTEIS, inicio: i0, fim: i1, obrigatorio: true, movel: false, turno: t, turnos, fonteDoTurno: 'curso' });
    }
  }
  return out;
}

function turnoQueCabeContraTrabalho(v: Vida): Turno | undefined {
  const tr = blocosDoTrabalho(v);
  return (['manha', 'noite', 'tarde'] as Turno[]).find(t => !tr.some(b => sobrepoe({ dias: UTEIS, inicio: HORAS_DO_CURSO[t][0], fim: HORAS_DO_CURSO[t][1] }, b)));
}

/** Tudo o que não é atividade escolhida: estudo, trabalho, o que corre em paralelo, a casa, a pena, o trajeto. */
export function blocosFixos(v: Vida, o: { semTrabalho?: boolean; trabalho?: TrabalhoHipotetico } = {}): Bloco[] {
  const i = idade(v);
  const out: Bloco[] = [];
  const j = v.justica;
  if (j?.prisao) {
    // A unidade toma a semana: o que há são horários da casa (o banho de sol, a leitura, o trabalho interno).
    if (j.prisao.regime === 'fechado') return [{ id: 'prisao', origem: 'prisao', rotulo: 'A unidade prisional', detalhe: 'a rotina da casa', dias: TODOS, inicio: ABRE, fim: FECHA, obrigatorio: true, movel: false }];
    out.push({ id: 'prisao', origem: 'prisao', rotulo: 'A unidade (o semiaberto)', detalhe: 'de dia, trabalho; à noite, a unidade', dias: TODOS, inicio: h(19), fim: FECHA, obrigatorio: true, movel: false });
  }
  if (j?.alternativa) out.push({ id: 'pena', origem: 'pena', rotulo: 'Serviço à comunidade', detalhe: 'a pena alternativa', dias: [5], inicio: h(8), fim: h(12), obrigatorio: true, movel: false });
  out.push(...blocosDeEstudo(v));
  if (!o.semTrabalho) out.push(...blocosDoTrabalho(v, o.trabalho));
  const pa = v.trabalho.pausa;
  if (pa) {
    const quem = pa.pessoaId ? v.pessoas[pa.pessoaId] : undefined;
    const rot = pa.motivo === 'casa' ? 'A casa e a família' : `Cuidar de ${quem?.nome ?? 'quem depende de você'}`;
    out.push({ id: 'cuidado_pausa', origem: 'cuidado', rotulo: rot, dias: pa.intensidade === 'total' ? TODOS : UTEIS, inicio: h(8), fim: h(12), obrigatorio: true, movel: false });
    if (pa.intensidade === 'total') out.push({ id: 'cuidado_pausa_tarde', origem: 'cuidado', rotulo: rot, dias: UTEIS, inicio: h(14), fim: h(18), obrigatorio: true, movel: false });
  }
  const par = v.trabalho.paralela;
  if (par) {
    const oc = ocupacaoOuNula(par.ocupacaoId);
    const nome = oc ? (v.eu.genero === 'feminino' ? oc.nome[1] : oc.nome[0]) : 'trabalho';
    out.push({ id: 'paralela', origem: 'paralela', rotulo: `${nome.charAt(0).toUpperCase()}${nome.slice(1)} (em paralelo)`, dias: [0, 2], inicio: h(19), fim: h(22), obrigatorio: true, movel: false });
    out.push({ id: 'paralela_sab', origem: 'paralela', rotulo: `${nome.charAt(0).toUpperCase()}${nome.slice(1)} (em paralelo)`, dias: [5], inicio: h(9), fim: h(13), obrigatorio: true, movel: false });
  }
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado' && (n.dedicacao ?? 'integral') === 'paralela') {
    const ajuda = (n.equipe?.length ?? 0) > 0 || !!n.socioId;
    if (n.passivo) out.push({ id: 'negocio', origem: 'negocio', rotulo: `${n.nome} (de longe)`, dias: [5], inicio: h(9), fim: h(11), obrigatorio: true, movel: false });
    else {
      out.push({ id: 'negocio', origem: 'negocio', rotulo: `${n.nome} (nas horas vagas)`, dias: ajuda ? [1, 3] : UTEIS, inicio: h(19), fim: h(21), obrigatorio: true, movel: false });
      out.push({ id: 'negocio_sab', origem: 'negocio', rotulo: `${n.nome} (sábado)`, dias: [5], inicio: h(8), fim: h(13), obrigatorio: true, movel: false });
    }
  }
  const pol = semanaDaPolitica(v);
  if (pol) {
    out.push({ id: 'politica', origem: 'politica', rotulo: pol.rotulo, dias: [1, 3], inicio: h(19), fim: h(21, 30), obrigatorio: true, movel: false });
    if (pol.peso >= 1) out.push({ id: 'politica_sab', origem: 'politica', rotulo: `${pol.rotulo} (rua)`, dias: [5], inicio: h(9), fim: h(13), obrigatorio: true, movel: false });
  }
  const casa = filhos(v).filter(f => v.vinculos[f.id]?.convivio.includes('casa'));
  const pequenos = casa.filter(f => idadePessoa(v, f) < 6);
  const escolares = casa.filter(f => idadePessoa(v, f) >= 6 && idadePessoa(v, f) < 12);
  if (pequenos.length) {
    const rot = pequenos.length === 1 ? `${pequenos[0].nome || 'O bebê'}: banho, comida, dormir` : 'As crianças: banho, comida, dormir';
    out.push({ id: 'filhos_pequenos', origem: 'filhos', rotulo: rot, dias: TODOS, inicio: h(18, 30), fim: h(21), obrigatorio: true, movel: false });
    out.push({ id: 'filhos_pequenos_manha', origem: 'filhos', rotulo: pequenos.length === 1 ? `${pequenos[0].nome || 'O bebê'}: a manhã` : 'As crianças: a manhã', dias: TODOS, inicio: h(6, 30), fim: h(7, 30), obrigatorio: true, movel: false });
  } else if (escolares.length) out.push({ id: 'filhos_escola', origem: 'filhos', rotulo: escolares.length === 1 ? `${escolares[0].nome}: dever de casa e jantar` : 'Os filhos: dever de casa e jantar', dias: UTEIS, inicio: h(18, 30), fim: h(20), obrigatorio: true, movel: false });
  if (i >= 18) {
    const cuidar = moraCom(v).filter(p => { const pr = v.vinculos[p.id]?.parentesco; return (pr === 'mae' || pr === 'pai' || pr === 'avo' || pr === 'sogro') && idadePessoa(v, p) >= 75 && p.saude < 45; });
    if (cuidar.length && !(pa && cuidar.some(p => p.id === pa.pessoaId))) out.push({ id: 'cuidar', origem: 'cuidado', rotulo: `Cuidar de ${listaNatural(cuidar.map(p => p.nome))}`, dias: TODOS, inicio: h(20), fim: h(21), obrigatorio: true, movel: false });
    const bichos = vinculosVivos(v).filter(x => x.p.especie && x.vin.convivio.includes('casa') && x.p.pet?.tutor === 'eu' && animal(x.p.especie).semana > 0).map(x => x.p);
    const caes = bichos.filter(p => p.especie === 'cachorro');
    if (caes.length) out.push({ id: 'pets', origem: 'pets', rotulo: caes.length === 1 ? `Passear com ${caes[0].nome}` : `Passear com ${listaNatural(caes.map(p => p.nome))}`, dias: TODOS, inicio: h(6, 30), fim: h(7), obrigatorio: true, movel: false });
    else if (bichos.length) out.push({ id: 'pets', origem: 'pets', rotulo: `Cuidar de ${listaNatural(bichos.map(p => p.nome))}`, dias: TODOS, inicio: h(21), fim: h(21, 30), obrigatorio: true, movel: false });
  }
  // O trajeto de todo dia útil, antes e depois do compromisso principal (a mesma conta de `transporte`).
  const d = deslocamento(v);
  const principal = out.filter(b => (b.origem === 'trabalho' || b.origem === 'escola' || b.origem === 'curso') && !b.movel && b.dias.length >= 4 && b.inicio > ABRE).sort((a, b) => a.inicio - b.inicio);
  if (d && d.minutos >= 15 && principal.length) {
    const meia = Math.min(90, Math.round(d.minutos / 2 / 5) * 5);
    const ida = principal[0];
    const volta = principal.reduce((a, b) => (b.fim > a.fim ? b : a));
    const rot = d.rotulo;
    out.push({ id: 'trajeto_ida', origem: 'trajeto', rotulo: rot, dias: ida.dias, inicio: Math.max(ABRE, ida.inicio - meia), fim: ida.inicio, obrigatorio: true, movel: false });
    if (volta.fim + meia <= FECHA) out.push({ id: 'trajeto_volta', origem: 'trajeto', rotulo: rot, dias: volta.dias, inicio: volta.fim, fim: volta.fim + meia, obrigatorio: true, movel: false });
  }
  return out;
}

/* ------------------------------------------------------------ As atividades */

/** Quantas vezes por semana uma atividade pede, pela dedicação (o mesmo peso de `semana`). */
export function vezesPorSemana(tempo: number): number {
  return tempo <= 0.5 ? 1 : tempo <= 1 ? 2 : tempo <= 1.6 ? 3 : 5;
}
const DURACAO: Record<CategoriaAtividade, number> = { esporte: 90, arte: 60, estudo: 90, oficio: 120, social: 120, corpo: 60, renda: 240, cuidado: 60, lazer: 120 };
const DURACAO_DE: Record<string, number> = { cursinho: 240, estudar_concurso: 180, terapia: 60, time_escola: 90 };
/** As horas em que cada tipo de atividade costuma acontecer, em ordem de preferência. */
const HORARIOS: Record<CategoriaAtividade, number[]> = {
  esporte: [h(17), h(18), h(19), h(7), h(14), h(9)], arte: [h(18), h(19), h(15), h(10)], estudo: [h(19), h(14), h(20), h(9)],
  oficio: [h(19), h(14), h(9)], social: [h(19), h(15), h(10)], corpo: [h(7), h(18), h(19), h(12)], renda: [h(8), h(13)],
  cuidado: [h(10), h(16), h(19)], lazer: [h(19), h(15), h(10)]
};
const DO_FIM_DE_SEMANA = new Set<CategoriaAtividade>(['renda', 'social', 'lazer', 'cuidado']);
/** Um número estável por atividade (para que duas atividades de uma vez por semana não caiam sempre no mesmo dia). */
const giro = (id: string) => { let x = 2166136261; for (let k = 0; k < id.length; k++) { x ^= id.charCodeAt(k); x = Math.imul(x, 16777619); } return (x >>> 0) % 7; };

/** Os dias de uma atividade, pela quantidade de vezes (espalhados pela semana, como gente faz). */
function padraoDeDias(vezes: number, fds: boolean): Dia[][] {
  if (vezes >= 5) return [UTEIS, [0, 1, 2, 3, 5], [1, 2, 3, 4, 5]];
  if (vezes === 3) return [[0, 2, 4], [1, 3, 5], [0, 2, 5]];
  if (vezes === 2) return fds ? [[4, 5], [5, 6], [1, 3]] : [[1, 3], [0, 2], [2, 4], [5, 6]];
  return fds ? [[5], [6], [4], [2]] : [[2], [5], [3], [1], [6]];
}

export function sobrepoe(a: { dias: Dia[]; inicio: number; fim: number }, b: { dias: Dia[]; inicio: number; fim: number }): boolean {
  return a.inicio < b.fim && b.inicio < a.fim && a.dias.some(d => b.dias.includes(d));
}

function livreEm(ocupados: Bloco[], dia: Dia, inicio: number, fim: number): boolean {
  return !ocupados.some(b => b.dias.includes(dia) && inicio < b.fim && b.inicio < fim);
}

/** Até que horas uma pessoa dessa idade faz atividade (criança não treina às 21h). */
const ultimaHora = (i: number) => (i < 12 ? h(19, 30) : i < 16 ? h(21, 30) : h(23));

/**
 * Encaixa uma atividade: o primeiro horário (da preferência dela) livre nos dias do padrão; se nenhum padrão
 * inteiro couber, dia a dia — e o que não couber de jeito nenhum fica de fora (e vira conflito).
 */
function encaixar(v: Vida, ocupados: Bloco[], cat: CategoriaAtividade, vezes: number, dur: number, id: string): { dias: Dia[]; inicio: number }[] {
  const i = idade(v);
  const limite = ultimaHora(i);
  const horas = HORARIOS[cat].filter(x => x + dur <= limite && (i >= 12 || x >= h(8)));
  const todos = padraoDeDias(vezes, DO_FIM_DE_SEMANA.has(cat));
  const k0 = giro(id) % todos.length;
  const padroes = [...todos.slice(k0), ...todos.slice(0, k0)];
  for (const p of padroes) for (const ini of horas) if (p.every(d => livreEm(ocupados, d, ini, ini + dur))) return [{ dias: p, inicio: ini }];
  // Dia a dia: cada vez no primeiro horário livre (pode ficar em horas diferentes).
  const usados: { dias: Dia[]; inicio: number }[] = [];
  const diasJa = new Set<Dia>();
  const ordem: Dia[] = [...padroes[0], ...TODOS.filter(d => !padroes[0].includes(d))];
  const extras = [...horas, ...[h(8), h(10), h(13), h(15), h(16), h(20), h(21)].filter(x => x + dur <= limite && !horas.includes(x) && (i >= 12 || x >= h(13)))];
  for (const d of ordem) {
    if (usados.length >= vezes) break;
    if (diasJa.has(d)) continue;
    const ini = extras.find(x => livreEm([...ocupados, ...usados.map(u => ({ dias: u.dias, inicio: u.inicio, fim: u.inicio + dur }) as Bloco)], d, x, x + dur));
    if (ini === undefined) continue;
    diasJa.add(d);
    const mesmo = usados.find(u => u.inicio === ini);
    if (mesmo) mesmo.dias = [...mesmo.dias, d].sort() as Dia[]; else usados.push({ dias: [d], inicio: ini });
  }
  return usados;
}

/** A duração de uma sessão da atividade (minutos). */
export function duracaoDa(id: string, cat: CategoriaAtividade): number { return DURACAO_DE[id] ?? DURACAO[cat]; }

/* ------------------------------------------------------------ A agenda */

/**
 * A agenda da semana: os blocos fixos, as atividades (no lugar escolhido ou encaixadas), os conflitos e a presença
 * de cada coisa que perde horas. `o.trabalho`: com um trabalho hipotético no lugar do de agora (a proposta pesada
 * numa decisão); `o.turnos`/`o.lugares`: com outra escolha (as alternativas de um conflito são testadas assim).
 */
export function agendaDaSemana(v: Vida, o: { trabalho?: TrabalhoHipotetico; turnos?: Partial<Record<FonteDeTurno, Turno>>; lugares?: Record<string, LugarNaAgenda | null> } = {}): Agenda {
  const guardada = v.agenda;
  const turnos = { ...(guardada?.turnos ?? {}), ...(o.turnos ?? {}) };
  const sobre = o.turnos || o.lugares ? { ...v, agenda: { ...(guardada ?? {}), turnos } } as Vida : v;
  const fixos = blocosFixos(sobre, o.trabalho ? { trabalho: o.trabalho } : {});
  const conflitos: Conflito[] = [];
  const presenca: Record<string, number> = {};
  // Fixo contra fixo: quem é atravessado perde as horas (a aula que o expediente atravessa é falta).
  const rigidos = fixos.filter(b => !b.movel);
  // A residência médica é a obrigação principal de quem a faz (o resto é plantão por fora): nela, quem cede é o trabalho.
  const residencia = sobre.educacao.matricula?.cursoId === 'residencia';
  const prioridade = (b: Bloco) => (b.origem === 'prisao' ? 0 : residencia && b.origem === 'curso' ? 0.5 : b.origem === 'trabalho' || b.origem === 'cuidado' || b.origem === 'filhos' ? 1 : b.origem === 'trajeto' ? 4 : b.origem === 'escola' || b.origem === 'curso' ? 2 : 3);
  for (let a = 0; a < rigidos.length; a++) for (let b = a + 1; b < rigidos.length; b++) {
    const A = rigidos[a], B = rigidos[b];
    if (A.origem === 'trajeto' || B.origem === 'trajeto' || !sobrepoe(A, B)) continue;
    const [ocupa, perde] = prioridade(A) <= prioridade(B) ? [A, B] : [B, A];
    const dias = perde.dias.filter(d => ocupa.dias.includes(d));
    const ini = Math.max(ocupa.inicio, perde.inicio), fim = Math.min(ocupa.fim, perde.fim);
    const perda = (dias.length * (fim - ini)) / Math.max(1, perde.dias.length * (perde.fim - perde.inicio));
    presenca[perde.id] = Math.max(0, (presenca[perde.id] ?? 1) - perda);
    conflitos.push({ id: `${perde.id}x${ocupa.id}`, tipo: 'sobreposicao', perde: perde.id, ocupa: ocupa.id, dias, inicio: ini, fim, perda, texto: `${perde.rotulo} e ${ocupa.rotulo.charAt(0).toLowerCase()}${ocupa.rotulo.slice(1)} no mesmo horário (${diasEmPalavras(dias)}, ${hora(ini)}–${hora(fim)}): ${perde.origem === 'escola' || perde.origem === 'curso' ? 'as aulas desse horário viram falta' : `${perde.rotulo.toLowerCase()} perde essas horas`}.` });
  }
  // As atividades: primeiro as de lugar escolhido (fixadas), depois as encaixadas, das que pedem mais para as que pedem menos.
  const lugares = { ...(guardada?.lugares ?? {}), ...(o.lugares ?? {}) };
  const ocupados: Bloco[] = [...fixos.filter(b => !b.movel)];
  const atividades: { id: string; rotulo: string; cat: CategoriaAtividade; vezes: number; dur: number; origem: 'rotina' | 'curso' }[] = [];
  for (const r of sobre.rotinas) {
    const m = modeloRotina(r.id);
    if (!m) continue;
    const n = nivelModelo(m, nivelDa(r));
    atividades.push({ id: r.id, rotulo: m.niveis.length > 1 ? `${m.nome} — ${n.rotulo.toLowerCase()}` : m.nome, cat: m.categoria, vezes: vezesPorSemana(n.tempo), dur: duracaoDa(r.id, m.categoria), origem: 'rotina' });
  }
  const ead = fixos.find(b => b.id === 'curso_ead');
  if (ead) atividades.push({ id: 'curso_ead', rotulo: ead.rotulo, cat: 'estudo', vezes: 3, dur: 120, origem: 'curso' });
  // Na prisão fechada não há agenda de fora: as atividades possíveis lá dentro acontecem dentro da rotina da casa.
  const fechado = sobre.justica?.prisao?.regime === 'fechado';
  const blocosAtiv: Bloco[] = [];
  const ordem = [...atividades].sort((a, b) => Number(!!lugares[b.id]) - Number(!!lugares[a.id]) || b.vezes * b.dur - a.vezes * a.dur);
  for (const x of ordem) {
    if (fechado) { presenca[x.id] = 1; continue; }
    const lugar = lugares[x.id];
    const base = { origem: x.origem === 'curso' ? 'curso' as const : 'rotina' as const, ref: x.id, rotulo: x.rotulo, obrigatorio: false, movel: true, vezes: x.vezes, categoria: x.cat };
    if (lugar) {
      // O lugar escolhido é respeitado — e, se algo fixo chegou depois nesse horário, é conflito (não remarcação silenciosa).
      const b: Bloco = { ...base, id: x.id, dias: lugar.dias, inicio: lugar.inicio, fim: lugar.inicio + x.dur, fixado: true };
      const batem = ocupados.filter(o2 => sobrepoe(b, o2));
      blocosAtiv.push(b);
      if (batem.length) {
        const diasPerdidos = b.dias.filter(d => batem.some(o2 => o2.dias.includes(d) && b.inicio < o2.fim && o2.inicio < b.fim));
        const perda = diasPerdidos.length / Math.max(1, b.dias.length);
        presenca[x.id] = 1 - perda;
        const quem = batem[0];
        conflitos.push({ id: `${x.id}x${quem.id}`, tipo: 'sobreposicao', perde: x.id, ocupa: quem.id, dias: diasPerdidos, inicio: Math.max(b.inicio, quem.inicio), fim: Math.min(b.fim, quem.fim), perda, texto: `${x.rotulo} está marcado ${diasEmPalavras(diasPerdidos)} às ${hora(b.inicio)} — e ${quem.rotulo.charAt(0).toLowerCase()}${quem.rotulo.slice(1)} ocupa esse horário. Assim, essas vezes não acontecem.` });
      } else presenca[x.id] = 1;
      ocupados.push(b);
      continue;
    }
    const lugaresAchados = encaixar(sobre, ocupados, x.cat, x.vezes, x.dur, x.id);
    const vezes = lugaresAchados.reduce((s, l) => s + l.dias.length, 0);
    for (const [k, l] of lugaresAchados.entries()) {
      const b: Bloco = { ...base, id: k === 0 ? x.id : `${x.id}#${k}`, dias: l.dias, inicio: l.inicio, fim: l.inicio + x.dur };
      blocosAtiv.push(b);
      ocupados.push(b);
    }
    presenca[x.id] = Math.min(1, vezes / x.vezes);
    if (vezes < x.vezes) {
      conflitos.push({ id: `${x.id}:sem_horario`, tipo: 'sem_horario', perde: x.id, dias: [], inicio: 0, fim: 0, perda: 1 - vezes / x.vezes, texto: vezes === 0 ? `${x.rotulo} não tem horário livre na semana: do jeito que os dias estão, não acontece.` : `${x.rotulo} pede ${x.vezes} vezes por semana; só ${vezes === 1 ? 'uma cabe' : `${vezes} cabem`} nos horários livres.` });
    }
  }
  const blocos = [...fixos.filter(b => !b.movel), ...blocosAtiv].sort((a, b) => a.inicio - b.inicio);
  const livre = TODOS.map(d => {
    let min = 0;
    for (let t = h(7); t < h(23); t += 15) if (livreEm(blocos, d, t, t + 15)) min += 15;
    return min;
  });
  return { blocos, conflitos, livre, presenca };
}

/* ------------------------------------------------------------ A presença: o que a agenda cobra do ano */

/** Quanto de uma atividade acontece de fato (as vezes sem horário ou atravessadas não treinam). */
export const presencaNaAtividade = (v: Vida, id: string, a = agendaDaSemana(v)) => a.presenca[id] ?? 1;
/** Quanto das aulas da escola acontece (o trabalho que atravessa o turno vira falta). */
export const presencaNaEscola = (v: Vida, a = agendaDaSemana(v)) => a.presenca['escola'] ?? 1;
/** Quanto das aulas do curso acontece. */
export const presencaNoCurso = (v: Vida, a = agendaDaSemana(v)) => a.presenca['curso'] ?? a.presenca['curso_ead'] ?? 1;

/* ------------------------------------------------------------ Alternativas de um conflito */

export interface AlternativaDaAgenda {
  texto: string;
  /** O que acontece (dito antes). */
  efeito: string;
  /** A ação de verdade (`acoes`): mudar o turno, remarcar, diminuir, largar, trancar. */
  acao: { tipo: 'agenda'; op: OpAgenda } | { tipo: 'rotina'; id: string; ativa: boolean; nivel?: 1 | 2 | 3 } | { tipo: 'trancar' };
}

export type OpAgenda =
  | { oque: 'turno'; fonte: FonteDeTurno; turno: Turno }
  | { oque: 'mover'; id: string; dias: Dia[]; inicio: number }
  | { oque: 'soltar'; id: string };

/** As saídas que existem de fato para um conflito (cada uma testada: só entra se resolve, ou ao menos diminui a perda). */
export function alternativasDoConflito(v: Vida, c: Conflito, agora = agendaDaSemana(v)): AlternativaDaAgenda[] {
  const out: AlternativaDaAgenda[] = [];
  const perde = agora.blocos.find(b => b.id === c.perde) ?? blocosFixos(v).find(b => b.id === c.perde);
  const ocupa = c.ocupa ? agora.blocos.find(b => b.id === c.ocupa) : undefined;
  const resolve = (o: Parameters<typeof agendaDaSemana>[1]) => {
    const depois = agendaDaSemana(v, o);
    const ainda = depois.conflitos.find(x => x.perde === c.perde && (x.ocupa === c.ocupa || x.tipo === c.tipo));
    return { resolve: !ainda, perda: ainda?.perda ?? 0, novos: depois.conflitos.length - agora.conflitos.length + (ainda ? 0 : 1) };
  };
  // 1. Mudar o turno (de quem tem): só os turnos que tiram o conflito sem criar outro.
  for (const b of [perde, ocupa]) {
    if (!b?.fonteDoTurno || !b.turnos?.length) continue;
    for (const t of b.turnos) {
      if (t === b.turno) continue;
      const r = resolve({ turnos: { [b.fonteDoTurno]: t } });
      if (r.resolve && r.novos <= 0) out.push({ texto: `Passar ${b.origem === 'escola' ? 'a escola' : b.origem === 'curso' ? 'o curso' : 'o trabalho'} para o turno da ${PALAVRA_TURNO[t]}`, efeito: `${b.rotulo}: ${quando({ ...b, inicio: (b.origem === 'escola' ? HORAS_DA_ESCOLA : b.origem === 'curso' ? HORAS_DO_CURSO : HORAS_DO_TRABALHO)[t][0], fim: (b.origem === 'escola' ? HORAS_DA_ESCOLA : b.origem === 'curso' ? HORAS_DO_CURSO : HORAS_DO_TRABALHO)[t][1] })}.`, acao: { tipo: 'agenda', op: { oque: 'turno', fonte: b.fonteDoTurno, turno: t } } });
    }
  }
  // 2. A atividade: remarcar (soltar o lugar escolhido, se o encaixe automático acha horário), diminuir, largar.
  if (perde?.movel && perde.ref) {
    const id = perde.ref;
    if (v.agenda?.lugares?.[id]) {
      const r = resolve({ lugares: { [id]: null } });
      if (r.resolve) out.push({ texto: `Remarcar ${perde.rotulo.replace(/ — .*/, '').toLowerCase()} para um horário livre`, efeito: 'A atividade vai para o primeiro horário que sobra na semana.', acao: { tipo: 'agenda', op: { oque: 'soltar', id } } });
    }
    const rot = v.rotinas.find(x => x.id === id);
    if (rot && nivelDa(rot) > 1 && c.tipo === 'sem_horario') out.push({ texto: `Diminuir a dedicação a ${perde.rotulo.replace(/ — .*/, '').toLowerCase()}`, efeito: 'Menos vezes por semana: cabe no que sobra.', acao: { tipo: 'rotina', id, ativa: true, nivel: (nivelDa(rot) - 1) as 1 | 2 | 3 } });
    if (rot) out.push({ texto: `Largar ${perde.rotulo.replace(/ — .*/, '').toLowerCase()}`, efeito: 'A atividade sai da semana (o que se aprendeu fica).', acao: { tipo: 'rotina', id, ativa: false } });
  }
  if (perde?.origem === 'curso' && !perde.movel && v.educacao.matricula && !out.length) out.push({ texto: 'Trancar o curso', efeito: 'A vaga espera; as aulas saem da semana.', acao: { tipo: 'trancar' } });
  return out;
}

/* ------------------------------------------------------------ Guardar escolhas (as ações) */

/** Um lugar escolhido para uma atividade é válido? (dentro da janela, nos dias, sem bater em nada fixo nem em outra atividade). */
export function validarLugar(v: Vida, id: string, dias: Dia[], inicio: number): string | undefined {
  if (!dias.length) return 'Escolha ao menos um dia.';
  const r = v.rotinas.find(x => x.id === id);
  const m = r ? modeloRotina(r.id) : undefined;
  if (!m && id !== 'curso_ead') return 'Essa atividade não está na sua semana.';
  const dur = m ? duracaoDa(id, m.categoria) : 120;
  // A dedicação diz quantas vezes; o lugar diz quando. Mudar quantas vezes é mudar a dedicação (outro comando).
  const vezes = r && m ? vezesPorSemana(nivelModelo(m, nivelDa(r)).tempo) : 3;
  if (dias.length !== vezes) return `Do jeito que está, isso é ${vezes === 1 ? 'uma vez' : `${vezes} vezes`} por semana: escolha ${vezes === 1 ? 'um dia' : `${vezes} dias`} (ou mude a dedicação).`;
  if (inicio < ABRE || inicio + dur > Math.min(FECHA, ultimaHora(idade(v)) + 30)) return idade(v) < 12 ? 'Nesse horário, criança não vai sozinha a lugar nenhum.' : 'Fora do horário em que a atividade acontece.';
  const a = agendaDaSemana(v, { lugares: { [id]: null } });
  const outros = a.blocos.filter(b => b.ref !== id && b.id !== id);
  const bate = outros.find(b => sobrepoe({ dias, inicio, fim: inicio + dur }, b));
  if (bate) return `Nesse horário já tem ${bate.rotulo.charAt(0).toLowerCase()}${bate.rotulo.slice(1)} (${quando(bate)}).`;
  return undefined;
}

/** Tira da agenda guardada o que não existe mais (a atividade largada, o turno de um vínculo que acabou). */
export function limparAgenda(v: Vida): void {
  const g = v.agenda;
  if (!g) return;
  if (g.lugares) for (const id of Object.keys(g.lugares)) if (!(v.rotinas.some(r => r.id === id) || (id === 'curso_ead' && v.educacao.matricula?.modalidade === 'ead'))) delete g.lugares[id];
  if (g.turnos) {
    if (!v.educacao.basica) delete g.turnos.escola;
    if (!v.educacao.matricula || v.educacao.matricula.modalidade === 'ead') delete g.turnos.curso;
    if (!v.trabalho.atual || v.trabalho.atual.carga !== 'parcial') delete g.turnos.trabalho;
  }
  if (g.lugares && !Object.keys(g.lugares).length) delete g.lugares;
  if (g.turnos && !Object.keys(g.turnos).length) delete g.turnos;
  if (!g.lugares && !g.turnos && !g.avisados?.length) v.agenda = undefined;
}

/** Os blocos de um curso hipotético (a matrícula que a decisão está pesando), para o conflito de horário ser dito antes. */
export function cursoHipotetico(cursoId: string, modalidade: 'presencial' | 'ead', turno?: Turno): Bloco | undefined {
  const c = curso(cursoId);
  if (modalidade === 'ead') return undefined;
  if (c.carga === 'integral') return { id: 'curso', origem: 'curso', rotulo: c.nome, dias: UTEIS, inicio: h(8), fim: h(17), obrigatorio: true, movel: false, turno: 'integral' };
  const t = turno ?? 'noite';
  return { id: 'curso', origem: 'curso', rotulo: c.nome, dias: UTEIS, inicio: HORAS_DO_CURSO[t][0], fim: HORAS_DO_CURSO[t][1], obrigatorio: true, movel: false, turno: t, turnos: ['manha', 'tarde', 'noite'], fonteDoTurno: 'curso' };
}

/* ------------------------------------------------------------ O ano */

const TEMA_DO_CONFLITO = (perde: string): 'escola' | 'trabalho' | 'lazer' => (perde === 'escola' || perde.startsWith('curso') ? 'escola' : perde.startsWith('trabalho') ? 'trabalho' : 'lazer');

/**
 * A agenda no ano: limpa o que não existe mais e, a cada conflito NOVO que pesa (um quinto da coisa ou mais), uma
 * nota na Linha da Vida (uma vez: enquanto o mesmo conflito durar, não se repete). O que o conflito cobra não é
 * daqui: é das presenças, lidas por quem treina e por quem dá nota.
 */
export function processarAgenda(v: Vida): Agenda {
  limparAgenda(v);
  const a = agendaDaSemana(v);
  const avisados = new Set(v.agenda?.avisados ?? []);
  const pesam = a.conflitos.filter(c => c.perda >= 0.2);
  for (const c of pesam) {
    if (avisados.has(c.id)) continue;
    escrever(v, { texto: c.texto, relevancia: 'cotidiano', tema: TEMA_DO_CONFLITO(c.perde), tom: 'ruim' });
  }
  if (pesam.length) (v.agenda ??= {}).avisados = pesam.map(c => c.id);
  else if (v.agenda) delete v.agenda.avisados;
  limparAgenda(v);
  // A mesma semana serve às atividades do ano (as escolhas guardadas não mudam a semana: só as notas mudaram).
  return a;
}

/* ------------------------------------------------------------ As ações */

const naoDa = (motivo: string): Veredito => bloqueio('incompativel', motivo);

function blocoDaFonte(v: Vida, fonte: FonteDeTurno): Bloco | undefined {
  return agendaDaSemana(v).blocos.find(b => b.fonteDoTurno === fonte);
}

/** Pode mudar a agenda assim? (o turno precisa existir para aquele vínculo e não pode cair em cima de outro compromisso fixo). */
export function disponibilidadeDaAgenda(v: Vida, op: OpAgenda): Veredito {
  if (op.oque === 'turno') {
    const b = blocoDaFonte(v, op.fonte);
    if (!b) return naoDa(op.fonte === 'escola' ? 'Você não está na escola.' : op.fonte === 'curso' ? 'Não há curso presencial com turno agora.' : 'O trabalho de agora não tem turno para escolher.');
    if (!b.turnos?.includes(op.turno)) return naoDa(op.fonte === 'escola' && idade(v) < 11 ? 'Nessa idade, o turno da escola é o que a família consegue.' : `Não há turno da ${PALAVRA_TURNO[op.turno]} para isso.`);
    if (b.turno === op.turno) return naoDa('Já é nesse turno.');
    const depois = agendaDaSemana(v, { turnos: { [op.fonte]: op.turno } });
    const bate = depois.conflitos.find(c => c.tipo === 'sobreposicao' && (c.perde === b.id || c.ocupa === b.id) && !depois.blocos.find(x => x.id === c.perde)?.movel);
    if (bate) return naoDa(`No turno da ${PALAVRA_TURNO[op.turno]}, ${bate.texto.charAt(0).toLowerCase()}${bate.texto.slice(1)}`);
    return PERMITIDO;
  }
  if (op.oque === 'mover') {
    const motivo = validarLugar(v, op.id, op.dias, op.inicio);
    return motivo ? naoDa(motivo) : PERMITIDO;
  }
  return v.agenda?.lugares?.[op.id] ? PERMITIDO : naoDa('Essa atividade já é encaixada sozinha.');
}

/** Executa a mudança e diz o que ficou (e o que se mexeu junto). */
export function executarNaAgenda(v: Vida, op: OpAgenda): string {
  const antes = agendaDaSemana(v);
  const g = (v.agenda ??= {});
  if (op.oque === 'turno') {
    (g.turnos ??= {})[op.fonte] = op.turno;
    const b = blocoDaFonte(v, op.fonte)!;
    const nome = op.fonte === 'escola' ? 'A escola' : op.fonte === 'curso' ? 'O curso' : 'O trabalho';
    escrever(v, { texto: `${nome} passou para o turno da ${PALAVRA_TURNO[op.turno]}.`, relevancia: 'cotidiano', tema: op.fonte === 'trabalho' ? 'trabalho' : 'escola', escolha: true });
    return `${nome} agora é ${quando(b)}.${mexeu(v, antes)}`;
  }
  if (op.oque === 'mover') {
    (g.lugares ??= {})[op.id] = { dias: [...op.dias].sort() as Dia[], inicio: op.inicio };
    const b = agendaDaSemana(v).blocos.find(x => x.id === op.id)!;
    return `${b.rotulo.replace(/ — .*/, '')}: ${quando(b)}.${mexeu(v, antes)}`;
  }
  delete g.lugares?.[op.id];
  const b = agendaDaSemana(v).blocos.filter(x => x.ref === op.id);
  return b.length ? `${b[0].rotulo.replace(/ — .*/, '')} volta a ser encaixado no horário livre: ${b.map(quando).join('; ')}.` : 'A atividade ficou sem horário livre na semana.';
}

/** O que se mexeu sozinho com a mudança (as atividades encaixadas que trocaram de lugar, os conflitos que surgiram ou sumiram). */
function mexeu(v: Vida, antes: Agenda): string {
  const depois = agendaDaSemana(v);
  const out: string[] = [];
  for (const b of depois.blocos.filter(x => x.movel && !x.fixado && !x.id.includes('#'))) {
    const a = antes.blocos.find(x => x.id === b.id);
    if (a && (a.inicio !== b.inicio || a.dias.join() !== b.dias.join())) out.push(`${b.rotulo.replace(/ — .*/, '')} passou para ${quando(b)}`);
  }
  const novos = depois.conflitos.filter(c => !antes.conflitos.some(x => x.id === c.id));
  const sumiram = antes.conflitos.filter(c => !depois.conflitos.some(x => x.id === c.id));
  if (out.length) out[0] = ` ${out[0]}`;
  return `${out.length ? `${out.join('; ')}.` : ''}${sumiram.length ? ` ${sumiram.length === 1 ? 'Um conflito' : `${sumiram.length} conflitos`} a menos.` : ''}${novos.length ? ` Atenção: ${novos[0].texto.charAt(0).toLowerCase()}${novos[0].texto.slice(1)}` : ''}`;
}

/* ------------------------------------------------------------ Antes de aceitar: o que um trabalho novo faz com a semana */

export interface ImpactoNaAgenda {
  /** Os conflitos que o trabalho novo criaria (no turno padrão dele). */
  novos: Conflito[];
  /** Os turnos em que o trabalho novo NÃO cria conflito (meio período). */
  turnosSemConflito: Turno[];
  /** A agenda com o trabalho novo (no turno padrão). */
  com: Agenda;
}

/** O que muda na semana se este trabalho entrar no lugar do de agora — para a decisão dizer ANTES. */
export function impactoDoTrabalho(v: Vida, hip: TrabalhoHipotetico): ImpactoNaAgenda {
  const antes = agendaDaSemana(v, { trabalho: { ocupacaoId: '__nenhum__' } });
  const ids = new Set(antes.conflitos.map(c => c.id));
  const com = agendaDaSemana(v, { trabalho: hip });
  const novos = com.conflitos.filter(c => !ids.has(c.id) && c.perda >= 0.05);
  const oc = ocupacaoOuNula(hip.ocupacaoId);
  const parcial = (hip.carga ?? oc?.carga) === 'parcial';
  const turnos: Turno[] = parcial ? (idade(v) >= 18 ? ['manha', 'tarde', 'noite'] : ['manha', 'tarde']) : [];
  const turnosSemConflito = turnos.filter(t => !agendaDaSemana(v, { trabalho: { ...hip, turno: t } }).conflitos.some(c => !ids.has(c.id) && c.perda >= 0.05));
  return { novos, turnosSemConflito, com };
}

/** Os turnos da escola que tirariam o conflito com o trabalho novo (no turno padrão dele). */
export function turnosDaEscolaSemConflito(v: Vida, hip: TrabalhoHipotetico): Turno[] {
  const b = v.educacao.basica;
  if (!b || v.educacao.evadiu) return [];
  return turnosDaEscola(v).filter(t => !agendaDaSemana(v, { trabalho: hip, turnos: { escola: t } }).conflitos.some(c => c.perde === 'escola'));
}

/* ------------------------------------------------------------ A ficha de um compromisso (o que a tela mostra) */

export interface FichaDoBloco {
  /** De onde vem (a origem real no estado). */
  origem: string;
  obrigatorio: boolean;
  remarcavel: boolean;
  /** Quanto custa por mês (atividade paga), na unidade do motor. */
  custo?: number;
  /** O que isso faz na vida, em palavras (o que o motor usa). */
  efeito: string;
  /** Até quando. */
  termina: string;
  /** Horas por semana. */
  horas: number;
}

const ORIGEM_EM_PALAVRAS: Record<OrigemDoBloco, string> = {
  escola: 'a escola', curso: 'a matrícula', trabalho: 'o trabalho', paralela: 'a trajetória em paralelo', negocio: 'o negócio',
  politica: 'a vida política', rotina: 'uma atividade que você escolheu', filhos: 'os filhos em casa', cuidado: 'quem precisa de você',
  pets: 'os bichos da casa', prisao: 'a pena', pena: 'a pena', trajeto: 'o trajeto de todo dia'
};

/** A ficha de um bloco: origem, obrigação, se remarca, custo, efeito, até quando, horas por semana. */
export function fichaDoBloco(v: Vida, b: Bloco, custoDe?: (id: string, nivel: number) => number): FichaDoBloco {
  const horas = Math.round(((b.fim - b.inicio) * b.dias.length) / 60 * 10) / 10;
  const base = { origem: ORIGEM_EM_PALAVRAS[b.origem], obrigatorio: b.obrigatorio, remarcavel: b.movel, horas };
  switch (b.origem) {
    case 'escola': return { ...base, efeito: 'as aulas: o que se aprende em cada matéria e a nota do ano (faltar pesa nos dois)', termina: v.educacao.basica?.etapa === 'medio' ? 'até o fim do ensino médio' : 'até a escola acabar' };
    case 'curso': return { ...base, efeito: 'o curso: o desempenho e o diploma (faltar atrasa)', termina: v.educacao.matricula ? `uns ${Math.ceil(v.educacao.matricula.mesesRestantes / 12)} anos ainda` : 'até a formatura' };
    case 'trabalho': return { ...base, efeito: 'o salário, a experiência, o desempenho — e o cansaço', termina: v.trabalho.atual?.contrato === 'eletivo' ? 'até o fim do mandato' : 'enquanto durar o trabalho' };
    case 'paralela': case 'negocio': case 'politica': return { ...base, efeito: 'renda e experiência por fora, ao custo de noites e sábados', termina: 'enquanto você mantiver' };
    case 'filhos': return { ...base, efeito: 'a rotina das crianças: não é escolha, é a casa', termina: 'até as crianças crescerem' };
    case 'cuidado': return { ...base, efeito: 'o cuidado de quem depende de você', termina: 'enquanto for preciso' };
    case 'pets': return { ...base, efeito: 'o bicho bem cuidado', termina: 'enquanto ele estiver com você' };
    case 'prisao': case 'pena': return { ...base, efeito: 'o cumprimento da pena', termina: 'até o fim da pena' };
    case 'trajeto': return { ...base, efeito: 'ir e voltar — a condução muda quanto (Vida · Cidade)', termina: 'enquanto o trajeto for esse' };
    case 'rotina': {
      const r = v.rotinas.find(x => x.id === b.ref);
      const m = r ? modeloRotina(r.id) : undefined;
      const treina = m?.pratica ? Object.keys(m.pratica) : [];
      return { ...base, custo: r && custoDe ? custoDe(r.id, nivelDa(r)) : undefined, efeito: treina.length ? 'o treino de verdade: cada vez que acontece conta; a que não acontece, não' : 'o que a atividade faz pela semana (a cabeça, a gente, o corpo)', termina: 'enquanto você mantiver (dá para largar a qualquer hora)' };
    }
  }
}

/* ------------------------------------------------------------ Na decisão: o conflito de horário de uma proposta */

/**
 * REWORK 9 · a agenda: o que o expediente novo atravessa (a escola, uma atividade que tem dia e hora). As saídas são
 * as que existem: outro turno (meio período), passar a escola para outro turno, remarcar ou largar a atividade, ou
 * manter tudo e perder as vezes que batem — e recusar, nos planos.
 */
function conflitoDeHorario(v: Vida, ocupacaoId: string): ConflitoDeEntrada | undefined {
  const oc = ocupacao(ocupacaoId);
  const hip = { ocupacaoId, carga: oc.carga };
  const imp = impactoDoTrabalho(v, hip);
  if (!imp.novos.length) return undefined;
  const alternativas: Alternativa[] = [];
  for (const t of imp.turnosSemConflito) alternativas.push({ larga: `turno_trabalho:${t}`, texto: `trabalhar no turno da ${PALAVRA_TURNO[t]}`, consequencia: `O trabalho fica no turno da ${PALAVRA_TURNO[t]}: nada da semana é atravessado.` });
  const escola = imp.novos.find(c => c.perde === 'escola');
  if (escola) {
    for (const t of turnosDaEscolaSemConflito(v, hip)) alternativas.push({ larga: `turno_escola:${t}`, texto: `passar a escola para o turno da ${PALAVRA_TURNO[t]}`, consequencia: `A escola vai para o turno da ${PALAVRA_TURNO[t]}; o trabalho fica com o horário dele.` });
    if (idade(v) >= 15) alternativas.push({ larga: 'escola', texto: 'largar a escola', consequencia: 'A escola sai da vida: o diploma fica para depois (dá para voltar, no supletivo).' });
    alternativas.push({ conciliar: true, texto: 'tentar dar conta dos dois', consequencia: 'As aulas que o trabalho atravessa viram falta: as notas e o aprendizado sentem.' });
  }
  for (const c of imp.novos.filter(x => x.perde !== 'escola')) {
    const b = imp.com.blocos.find(x => x.id === c.perde || x.ref === c.perde);
    const rot = v.rotinas.find(x => x.id === c.perde);
    if (!b || !rot) continue;
    const nome = b.rotulo.replace(/ — .*/, '').toLowerCase();
    if (v.agenda?.lugares?.[rot.id]) {
      const solto = agendaDaSemana(v, { trabalho: hip, lugares: { [rot.id]: null } });
      if (!solto.conflitos.some(x => x.perde === rot.id)) { const nb = solto.blocos.find(x => x.ref === rot.id)!; alternativas.push({ larga: `soltar:${rot.id}`, texto: `passar ${nome} para outro horário`, consequencia: `${b.rotulo.replace(/ — .*/, '')} vai para ${quando(nb)}.` }); }
    }
    alternativas.push({ larga: `rotina:${rot.id}`, texto: `largar ${nome}`, consequencia: `${b.rotulo.replace(/ — .*/, '')} sai da semana (o que se aprendeu fica).` });
    if (!escola) alternativas.push({ conciliar: true, texto: `manter ${nome} como está`, consequencia: `As vezes de ${nome} que batem com o trabalho não acontecem.` });
  }
  if (!alternativas.length) return undefined;
  const primeiro = imp.novos[0];
  return { com: 'agenda', rotulo: escola ? 'a escola' : 'a sua semana', motivo: primeiro.texto.replace(/\.$/, ''), alternativas };
}

// A regra mora aqui (num pacote acima de `compromissos`): ao carregar, a agenda se registra lá.
registrarAnaliseDeHorario(conflitoDeHorario);
