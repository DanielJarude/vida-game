/**
 * VIDA 12.9 · ESTUDOS — a faculdade como um caminho de verdade, sem burocracia.
 *
 *   INSTITUIÇÃO  No Brasil, as instituições reais do catálogo (`dados/instituicoes129`): cada uma com os seus campi, os
 *                cursos de CADA campus e as suas formas de ingresso. Fora do Brasil (ou num curso que nenhuma instituição
 *                do catálogo oferece), o ingresso genérico de sempre (`escola.opcoesDeCurso`).
 *   PROCESSO     Cada forma de ingresso tem fases, escala e corte próprios: a Fuvest (1ª fase objetiva, 2ª discursiva),
 *                o vestibular da Unicamp, o da Unesp, o da UERJ, o PAS da UnB, o SISU (a nota do ENEM), o vestibular da
 *                particular. A nota de cada fase sai da MESMA preparação que dá a nota do ENEM (`escola.notaEsperadaArea`)
 *                e o corte, do curso (o corte de referência do jogo) somado à seletividade relativa da instituição.
 *   CURSO        O motor anda por ano; a tela mostra dois semestres por ano (`semestres129`). No fim do ano, quem reprovou
 *                numa disciplina com nota de recuperação faz o exame final (`recuperacao`); nas férias, dá para cursar a
 *                dependência (`dependencia`). Reprovações demais cancelam a matrícula (o jubilamento); abandonar ou ter a
 *                matrícula cancelada com o FIES deixa a dívida do que foi cursado (antes, ela só existia na formatura).
 *   TROCA        Trocar de curso: a transferência interna (mesma instituição, mesmo campus, com aproveitamento de
 *                disciplinas) ou uma nova candidatura noutra instituição, que só fecha o curso de agora quando a matrícula
 *                nova é confirmada.
 *
 * Os ganchos no motor de sempre são pequenos: `escola.ganchos129` (o exame final e a saída com crédito), a ação
 * `estudos129` e as duas linhas do ano (`antesDoAno129`/`depoisDoCurso129`). Nada aqui consome o gerador principal da
 * vida: as provas e os exames usam geradores derivados (`rngDe`).
 */
import { INSTITUICOES_129, type Campus129, type Instituicao129, type Mensalidade129, type Processo129, type ProcessoFeito129, type FaseDoProcesso129, type MatriculaInstituicao129 } from '../dados/instituicoes129';
import { cursoOuNulo, curso as cursoPorId, type Curso, type Materia } from '../dados/cursos';
import { economiaLocal, existeMunicipio, municipio, nomeLugar } from '../dados/lugares';
import { educacaoDaVida, paisDaVida } from '../mundo/vida';
import { escrever, idade, marcarFato } from '../nucleo';
import { bloqueio, podeTentar, type Veredito } from '../plausibilidade';
import { clamp, rngDe, type Rng } from '../rng';
import { dinheiroCurto, flex } from '../texto';
import { anoDe } from '../tempo';
import type { Matricula, NovoCompromisso, RegistroAcademico, Vida } from '../tipos';
import { AREAS_ENEM, areaDaPos, em, fecharNoHistorico, ganchos129, nomeDaMatricula, notaEsperadaArea, notaParaCurso, opcoesDeCurso, requisitoDoCurso, temCota, tentarIngresso, novaMatricula, NOME_MATERIA, type OpcaoCurso } from './escola';
import { registrarAnoLetivo, registrosDoCurso } from './historicoAcademico';
import { pagar } from './dinheiro';

export type Turno129 = 'manha' | 'tarde' | 'noite' | 'integral';
export const PALAVRA_TURNO_129: Record<Turno129, string> = { manha: 'manhã', tarde: 'tarde', noite: 'noite', integral: 'integral' };

/* ================================================================ Instituições */

/** O país tem catálogo de instituições reais? (Brasil primeiro; os outros países seguem o ingresso genérico.) */
export const instituicoesDoPais129 = (pais: string): readonly Instituicao129[] => INSTITUICOES_129.filter(i => i.pais === pais);
export const temCatalogo129 = (v: Vida) => instituicoesDoPais129(paisDaVida(v)).length > 0;
export const instituicao129 = (id: string) => INSTITUICOES_129.find(i => i.id === id);
/** Os campi que existem no mapa do jogo (um campus numa cidade que o jogo não tem fica de fora: não há como morar lá). */
export const campiNoJogo129 = (i: Instituicao129) => i.campi.filter(c => existeMunicipio(c.municipioId));
export const campus129 = (i: Instituicao129, id: string): Campus129 | undefined => i.campi.find(c => c.id === id);
export const ehPublica129 = (i: Instituicao129) => i.tipo === 'federal' || i.tipo === 'estadual' || i.tipo === 'municipal';

/** "Universidade de São Paulo (USP)" — e o campus, quando a instituição tem mais de um no jogo. */
export function nomeDaInstituicao129(i: Instituicao129, c?: Campus129): string {
  const base = i.nome.includes(`(${i.sigla})`) || i.nome === i.sigla ? i.nome : `${i.nome} (${i.sigla})`;
  return c && campiNoJogo129(i).length > 1 ? `${base}, campus ${c.nome}` : base;
}

export const ROTULO_TIPO_129: Record<Instituicao129['tipo'], string> = { federal: 'pública federal', estadual: 'pública estadual', municipal: 'pública municipal', privada: 'particular', comunitaria: 'comunitária (sem fins lucrativos)', confessional: 'particular confessional' };

/**
 * A SELETIVIDADE relativa de cada instituição, em pontos da escala do ENEM somados ao corte de referência do curso.
 * É PARÂMETRO DE JOGO (a disputa relativa, para diferenciar uma da outra), não nota de corte oficial. Instituição fora da
 * tabela: o padrão do tipo dela.
 */
const SELETIVIDADE_POR_SIGLA: Record<string, number> = {
  USP: 45, UNICAMP: 40, UNIFESP: 35, UFRJ: 30, UFMG: 30, UNB: 30, UFRGS: 30, UFSCAR: 25, UFSC: 20, UFPR: 20, UFPE: 20,
  UFF: 15, UFC: 15, UFBA: 15, UNESP: 15, UERJ: 15, UFU: 10, UFJF: 10, UFG: 10, UFPA: 5, UFAM: 5,
  FGV: 30, INSPER: 30, 'PUC-RIO': 15, 'PUC-SP': 5, 'PUC-MINAS': 0, 'PUCRS': 5, 'PUCPR': 0, 'PUC-CAMPINAS': 0, MACKENZIE: 5, ESPM: 5
};
const SELETIVIDADE_DO_TIPO: Record<Instituicao129['tipo'], number> = { federal: 10, estadual: 8, municipal: 0, privada: 0, comunitaria: 0, confessional: 0 };
export function seletividade129(i: Instituicao129): number {
  const s = i.sigla.toUpperCase().replace(/\s+/g, '');
  return SELETIVIDADE_POR_SIGLA[s] ?? SELETIVIDADE_DO_TIPO[i.tipo];
}
/** A seletividade em palavras (a tela não mostra o número de jogo). */
export function palavraSeletividade129(i: Instituicao129): string {
  const s = seletividade129(i);
  if (!ehPublica129(i)) return s >= 25 ? 'instituição muito disputada' : s >= 5 ? 'instituição disputada' : 'instituição de disputa moderada';
  return s >= 35 ? 'das mais disputadas do país' : s >= 20 ? 'instituição muito disputada' : s >= 10 ? 'instituição disputada' : 'instituição de disputa moderada';
}

/* ================================================================ Processos seletivos */

interface ModeloDeProcesso { nome: string; publica: boolean; usaEnem: boolean; descricao: string }
export const PROCESSOS_129: Record<Processo129 | 'prouni' | 'fies', ModeloDeProcesso> = {
  sisu: { nome: 'SISU (nota do ENEM)', publica: true, usaEnem: true, descricao: 'A nota do ENEM, ponderada pelo curso, disputa a vaga no SISU.' },
  fuvest: { nome: 'Fuvest', publica: true, usaEnem: false, descricao: '1ª fase de questões objetivas; quem passa do corte faz a 2ª fase, discursiva, com redação.' },
  comvest: { nome: 'Vestibular Unicamp (Comvest)', publica: true, usaEnem: false, descricao: '1ª fase objetiva; a 2ª fase, discursiva, decide a vaga.' },
  vunesp: { nome: 'Vestibular Unesp (Vunesp)', publica: true, usaEnem: false, descricao: '1ª fase objetiva; a 2ª fase, discursiva e com redação, decide a vaga.' },
  pas_unb: { nome: 'PAS/UnB (avaliação seriada)', publica: true, usaEnem: false, descricao: 'Três provas, uma em cada ano do ensino médio; vale a soma.' },
  vestibular_unb: { nome: 'Vestibular UnB', publica: true, usaEnem: false, descricao: 'Prova própria, objetiva e com redação.' },
  uerj: { nome: 'Vestibular Estadual UERJ', publica: true, usaEnem: false, descricao: 'Exame de Qualificação (objetivo, dá um conceito) e Exame Discursivo, que decide a vaga.' },
  vestibular: { nome: 'Vestibular próprio', publica: true, usaEnem: false, descricao: 'Prova objetiva e redação, aplicadas pela própria universidade.' },
  vestibular_privada: { nome: 'Vestibular próprio', publica: false, usaEnem: false, descricao: 'Prova e redação, em várias datas ao longo do ano.' },
  enem_privada: { nome: 'Nota do ENEM', publica: false, usaEnem: true, descricao: 'A faculdade aceita a nota do ENEM no lugar da prova.' },
  enem_publica: { nome: 'Seleção pela nota do ENEM', publica: true, usaEnem: true, descricao: 'Processo próprio da universidade que usa a nota do ENEM (não é o SISU).' },
  provao_paulista: { nome: 'Provão Paulista Seriado', publica: true, usaEnem: false, descricao: 'Provas ao longo do ensino médio, para quem estudou na rede pública de São Paulo.' },
  prouni: { nome: 'ProUni', publica: false, usaEnem: true, descricao: 'Bolsa integral pela nota do ENEM e pela renda da família.' },
  fies: { nome: 'FIES', publica: false, usaEnem: true, descricao: 'A mensalidade financiada, a pagar depois de formado.' }
};

/** ENEM (escala ~300..950) → porcentagem de acerto (0..100). */
const pct = (x: number) => clamp((x - 300) / 6.5, 0, 100);
/** A nota ponderada pelo curso, a partir das notas por área. */
function ponderar(c: Curso, areas: Record<Materia, number>): number {
  const pesos = c.pesos ?? {};
  let soma = 0, total = 0;
  for (const a of AREAS_ENEM) { const w = 1 + (pesos[a] ?? 0); soma += areas[a] * w; total += w; }
  return soma / total;
}
/** A nota que a preparação de hoje daria numa prova (sem o dia), ponderada pelo curso. */
export function notaEsperada129(v: Vida, c: Curso): number {
  const areas = {} as Record<Materia, number>;
  for (const a of AREAS_ENEM) areas[a] = notaEsperadaArea(v, a);
  return Math.round(ponderar(c, areas));
}
/** Φ(z) — a chance de a nota do dia passar do corte, com o dia e as matérias variando (desvio ~38 pontos). */
function phi(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
const DESVIO_DA_PROVA = 38;

/**
 * Os turnos possíveis de um curso numa instituição: o curso integral é integral; os outros, os turnos que a instituição
 * oferece (a fonte dá a lista da instituição, não a de cada curso). Instituição só de período integral (a FGV): integral.
 * Sem a lista verificada: manhã, tarde ou noite, à escolha.
 */
export function turnosDaInstituicao129(i: Instituicao129, c: Curso): Turno129[] {
  if (c.carga === 'integral') return ['integral'];
  if (!i.turnos?.length) return ['manha', 'tarde', 'noite'];
  const parciais = i.turnos.filter(t => t !== 'integral');
  return parciais.length ? parciais : ['integral'];
}

/* ================================================================ Opções de candidatura */

export interface Opcao129 {
  /** Estável: identifica a opção na ação (`inst:<id>:<campus>:<curso>:<processo>` ou `g:<curso>:<via>:<municipio>`). */
  chave: string;
  curso: Curso;
  inst?: Instituicao129;
  campus?: Campus129;
  processo: Processo129 | 'prouni' | 'fies' | string;
  nomeProcesso: string;
  rede: 'publica' | 'privada';
  modalidade: 'presencial' | 'ead';
  mensalidade: number;
  /** A mensalidade de referência VERIFICADA (fonte e ano); ausente = valor genérico do jogo para o curso, não da instituição. */
  mensalidadeVerificada?: Mensalidade129;
  municipioId: string;
  veredito: Veredito;
  /** O corte da instituição na escala do ENEM (o jogo), e a nota que a preparação de hoje daria. */
  corte?: number;
  esperada?: number;
  /** A opção genérica (fora do catálogo), quando é o caso. */
  generica?: OpcaoCurso;
  observacao?: string;
  /** Turnos possíveis (o curso integral é só integral). */
  turnos: Turno129[];
}

/** A vida sem o curso de agora (para ver os requisitos de uma TROCA: o "já está cursando" não vale aí). */
const semMatricula = (v: Vida): Vida => ({ ...v, educacao: { ...v.educacao, matricula: undefined } });

const cacheGenerico = new WeakMap<Vida, OpcaoCurso[]>();
function genericas(v: Vida): OpcaoCurso[] {
  let x = cacheGenerico.get(v);
  if (!x) { x = opcoesDeCurso(v); cacheGenerico.set(v, x); }
  return x;
}

const jaTentou = (v: Vida, chave: string) => v.fatos[`proc129:${chave}:${anoDe(v.t)}`] !== undefined;

/** As instituições do catálogo que oferecem o curso, com os campi (no mapa do jogo) onde ele é oferecido. */
export function ondeHa129(pais: string, cursoId: string): { inst: Instituicao129; campus: Campus129 }[] {
  const out: { inst: Instituicao129; campus: Campus129 }[] = [];
  for (const i of instituicoesDoPais129(pais)) for (const c of campiNoJogo129(i)) if (c.cursos.includes(cursoId)) out.push({ inst: i, campus: c });
  return out;
}

/** A mensalidade de um curso numa instituição: a verificada, ou (sem ela) a genérica do curso na cidade. */
export function mensalidade129(i: Instituicao129 | undefined, c: Curso, municipioId: string, campus?: Campus129): { valor: number; verificada?: Mensalidade129 } {
  if (i && ehPublica129(i)) return { valor: 0 };
  const ver = campus?.mensalidades?.[c.id];
  if (ver) return { valor: ver.valor, verificada: ver };
  return { valor: Math.round(c.mensalidade * economiaLocal(municipioId).custo / 10) * 10 };
}

/**
 * Todas as formas de entrar num curso a partir de onde a pessoa mora: no Brasil, instituição por instituição, campus por
 * campus, processo por processo; fora dele (ou sem instituição no catálogo), as vias genéricas de sempre. `troca`: para
 * trocar de curso (a vaga nova só fecha o curso de agora quando a matrícula for confirmada).
 */
export function opcoes129(v: Vida, cursoId: string, troca = false): Opcao129[] {
  const c = cursoOuNulo(cursoId);
  if (!c) return [];
  const base = troca ? semMatricula(v) : v;
  const pais = paisDaVida(v);
  const req = requisitoDoCurso(base, c);
  const out: Opcao129[] = [];
  const turnosDe = (cc: Curso, modalidade: 'presencial' | 'ead'): Turno129[] => (modalidade === 'ead' ? [] : cc.carga === 'integral' ? ['integral'] : ['manha', 'tarde', 'noite']);
  const ondeHa = c.nivel === 'superior' ? ondeHa129(pais, c.id) : [];
  const gen = genericas(base).filter(o => o.curso.id === c.id);
  const cota = temCota(v);
  for (const { inst, campus } of ondeHa) {
    const sel = seletividade129(inst);
    const tInst = turnosDaInstituicao129(inst, c);
    const publica = ehPublica129(inst);
    const mens = mensalidade129(inst, c, campus.municipioId, campus);
    const muda = campus.municipioId !== v.moradia.municipioId;
    const obsMuda = muda ? `Fica em ${nomeLugar(campus.municipioId)}: estudar lá é mudar de cidade.` : undefined;
    for (const p of inst.ingresso) {
      const chave = `inst:${inst.id}:${campus.id}:${c.id}:${p}`;
      const modelo = PROCESSOS_129[p];
      if (!modelo) continue;
      let veredito: Veredito;
      let corte: number | undefined;
      let esperada: number | undefined;
      if (p === 'sisu' || p === 'enem_privada' || p === 'enem_publica') {
        corte = p !== 'enem_privada' ? c.corte + sel - (cota ? 45 : 0) : Math.max(450, c.corte - 160 + sel);
        const nota = notaParaCurso(v, c);
        esperada = nota || undefined;
        veredito = nota === 0 ? bloqueio('requisito', 'Precisa de uma nota do ENEM dos últimos três anos.')
          : nota >= corte ? { grau: 'permitido', chance: Math.min(0.95, 0.55 + (nota - corte) / 120) }
            : nota >= corte - 30 ? { grau: 'improvavel', chance: 0.15, motivo: `Nota ${nota} abaixo do corte (~${corte}): só pela lista de espera.` }
              : bloqueio('requisito', `Nota ${nota} muito abaixo do corte (~${corte}${cota && p === 'sisu' ? ', já com cota' : ''}).`);
      } else if (p === 'pas_unb' && !podeFazerPas(v)) {
        veredito = bloqueio('requisito', 'O PAS é feito em três etapas durante o ensino médio no Distrito Federal: só vale para quem acabou de concluí-lo lá.');
      } else if (p === 'provao_paulista' && !podeFazerProvao(v)) {
        veredito = bloqueio('requisito', 'O Provão Paulista é feito ao longo do médio na rede pública de São Paulo: só vale para quem acabou de concluí-lo lá.');
      } else {
        corte = publica || p !== 'vestibular_privada' ? c.corte + sel - (cota && publica ? 45 : 0) : (c.id === 'medicina' ? c.corte - 60 + sel : Math.max(430, c.corte - 200 + sel));
        esperada = notaEsperada129(v, c);
        const chance = clamp(phi((esperada - corte) / DESVIO_DA_PROVA), 0.02, 0.97);
        veredito = { grau: chance < 0.3 ? 'improvavel' : 'permitido', chance, ...(chance < 0.3 ? { motivo: 'A preparação de hoje ainda fica abaixo do corte: dá para tentar, mas é pouco provável.' } : {}) };
      }
      if (req) veredito = req;
      else if (jaTentou(v, chave)) veredito = bloqueio('incompativel', `Você já fez ${modelo.nome} para este curso neste ano.`);
      out.push({ chave, curso: c, inst, campus, processo: p, nomeProcesso: modelo.nome, rede: publica ? 'publica' : 'privada', modalidade: 'presencial', mensalidade: mens.valor, mensalidadeVerificada: mens.verificada, municipioId: campus.municipioId, veredito, corte, esperada, observacao: [obsMuda, cota && publica && !modelo.usaEnem ? 'Concorre por cota.' : cota && p === 'sisu' ? 'Concorre por cota.' : undefined].filter(Boolean).join(' ') || undefined, turnos: tInst });
    }
    // Na particular, a bolsa e o crédito públicos (no Brasil, o ProUni e o FIES): as regras de sempre, nesta instituição.
    if (!publica) {
      for (const via of ['prouni', 'fies'] as const) {
        const g = gen.find(o => o.via === via);
        if (!g) continue;
        const chave = `inst:${inst.id}:${campus.id}:${c.id}:${via}`;
        const veredito = req ?? (jaTentou(v, chave) ? bloqueio('incompativel', `Você já tentou ${PROCESSOS_129[via].nome} para este curso neste ano.`) : g.veredito);
        out.push({ chave, curso: c, inst, campus, processo: via, nomeProcesso: PROCESSOS_129[via].nome, rede: 'privada', modalidade: 'presencial', mensalidade: via === 'prouni' ? 0 : mens.valor, mensalidadeVerificada: mens.verificada, municipioId: campus.municipioId, veredito, observacao: [obsMuda, via === 'fies' ? 'A mensalidade vira dívida, a pagar depois de formado (ou proporcional, se largar).' : undefined].filter(Boolean).join(' ') || undefined, turnos: tInst });
      }
    }
  }
  // As vias genéricas: tudo, quando não há instituição no catálogo para o curso; com catálogo, só o que ele não cobre (EAD).
  for (const g of gen) {
    if (ondeHa.length && g.modalidade !== 'ead') continue;
    const chave = `g:${c.id}:${g.via}:${g.municipioId}${g.especialidade ? `:${g.especialidade}` : ''}`;
    const veredito = req ?? (jaTentou(v, chave) ? bloqueio('incompativel', 'Você já tentou este curso por esta via neste ano.') : g.veredito);
    out.push({ chave, curso: g.curso, processo: g.via, nomeProcesso: rotuloViaGenerica(v, g.via), rede: g.rede, modalidade: g.modalidade, mensalidade: g.mensalidade, municipioId: g.municipioId, veredito, generica: g, observacao: g.observacao, turnos: turnosDe(c, g.modalidade) });
  }
  return out;
}

/** O nome de uma via genérica, com os nomes do país. */
export function rotuloViaGenerica(v: Vida, via: string): string {
  const ed = educacaoDaVida(v);
  return via === 'sisu' ? ed.via.sisu : via === 'prouni' ? ed.via.prouni : via === 'fies' ? ed.via.fies : ({ selecao_publica: 'Seleção pública', privada: 'Particular', ead: 'A distância (EAD)' } as Record<string, string>)[via] ?? via;
}

/** O PAS/UnB: só para quem concluiu o médio no Distrito Federal há pouco (as três etapas são feitas durante ele). */
function podeFazerPas(v: Vida): boolean {
  const t = v.fatos['concluiu_medio'];
  return municipio(v.moradia.municipioId).uf === 'DF' && t !== undefined && v.t - t <= 12;
}

/** O Provão Paulista: rede pública de SP, médio concluído há pouco (e sem passagem por escola particular no médio). */
function podeFazerProvao(v: Vida): boolean {
  const t = v.fatos['concluiu_medio'];
  return municipio(v.moradia.municipioId).uf === 'SP' && t !== undefined && v.t - t <= 12 && v.fatos['estudou_privada'] === undefined;
}

/* ================================================================ A prova e o resultado */

/** As notas de um processo (as fases), feitas com um gerador derivado: a mesma prova não muda ao recarregar. */
function aplicarProva(v: Vida, o: Opcao129): { fases: FaseDoProcesso129[]; aprovado: boolean; nota?: string } {
  const c = o.curso;
  const r = rngDe(v.id, 'proc129', o.chave, v.t);
  const corte = o.corte ?? c.corte;
  if (o.processo === 'sisu' || o.processo === 'enem_privada' || o.processo === 'enem_publica') {
    const nota = notaParaCurso(v, c);
    const chance = o.veredito.chance ?? 0.5;
    const aprovado = r.chance(chance);
    return { fases: [{ nome: 'Nota do ENEM, ponderada pelo curso', nota, max: 1000, corte, passou: aprovado }], aprovado, nota: aprovado ? (nota >= corte ? 'aprovado na chamada regular' : 'aprovado pela lista de espera') : nota >= corte ? 'a nota passou do corte de referência, mas a vaga ficou com outros candidatos' : 'ficou abaixo do corte' };
  }
  if (o.processo === 'prouni' || o.processo === 'fies') {
    const aprovado = r.chance(o.veredito.chance ?? 0.5);
    const nota = notaParaCurso(v, c);
    return { fases: [{ nome: 'Nota do ENEM e renda da família', nota, max: 1000, passou: aprovado }], aprovado, nota: aprovado ? (o.processo === 'prouni' ? 'bolsa concedida' : 'financiamento aprovado') : (o.processo === 'prouni' ? 'as bolsas do curso ficaram com notas mais altas' : 'o financiamento não foi aprovado neste semestre') };
  }
  // Uma prova de verdade: as notas por área (a preparação de hoje + o dia), ponderadas pelo curso.
  const dia = r.normal() * 25;
  const areas = {} as Record<Materia, number>;
  for (const a of AREAS_ENEM) areas[a] = clamp(notaEsperadaArea(v, a) + dia + r.normal() * 30, 320, 950);
  const geral = AREAS_ENEM.reduce((s, a) => s + areas[a], 0) / AREAS_ENEM.length;
  const pond = ponderar(c, areas);
  const redacao = Math.round(clamp(pct(areas.linguagens + r.normal() * 20) / 10, 0, 10) * 10) / 10;
  const fase = (nome: string, valor: number, max: number, corteV: number): FaseDoProcesso129 => {
    const nota = Math.round(pct(valor) * max / 100);
    const cc = Math.round(pct(corteV) * max / 100);
    return { nome, nota, max, corte: cc, passou: nota >= cc };
  };
  const duas = (n1: string, max1: number, n2: string, max2: number) => {
    const f1 = fase(n1, geral, max1, corte - 45);
    if (!f1.passou) return { fases: [f1], aprovado: false, nota: 'não passou do corte da 1ª fase' };
    const f2 = fase(n2, pond, max2, corte);
    return { fases: [f1, f2], aprovado: f2.passou, nota: f2.passou ? 'aprovado na 2ª fase' : 'passou da 1ª fase; a 2ª ficou abaixo do corte' };
  };
  switch (o.processo) {
    case 'fuvest': return duas('1ª fase (objetiva)', 90, '2ª fase (discursiva e redação)', 100);
    case 'comvest': return duas('1ª fase (objetiva)', 72, '2ª fase (discursiva)', 100);
    case 'vunesp': return duas('1ª fase (objetiva)', 90, '2ª fase (discursiva e redação)', 100);
    case 'uerj': {
      const q = pct(geral);
      const conceito = q >= 80 ? 'A' : q >= 65 ? 'B' : q >= 50 ? 'C' : q >= 35 ? 'D' : 'E';
      const f1: FaseDoProcesso129 = { nome: `Exame de Qualificação (conceito ${conceito})`, nota: Math.round(q * 0.6), max: 60, corte: 18, passou: q >= 30 };
      if (!f1.passou) return { fases: [f1], aprovado: false, nota: 'o Exame de Qualificação não deu acesso ao Discursivo' };
      const f2 = fase('Exame Discursivo', pond + (conceito === 'A' ? 10 : conceito === 'B' ? 5 : 0), 100, corte);
      return { fases: [f1, f2], aprovado: f2.passou, nota: f2.passou ? 'aprovado no Discursivo' : 'o Discursivo ficou abaixo do corte' };
    }
    case 'provao_paulista': {
      const f = fase('Três provas do médio (soma)', pond, 100, corte);
      return { fases: [f], aprovado: f.passou, nota: f.passou ? 'aprovado pelo Provão Paulista' : 'a soma das provas ficou abaixo do corte' };
    }
    case 'pas_unb': {
      const f = fase('Etapas 1, 2 e 3 (soma)', pond, 100, corte);
      return { fases: [f], aprovado: f.passou, nota: f.passou ? 'aprovado pelo PAS' : 'a soma das três etapas ficou abaixo do corte' };
    }
    default: {
      const f1 = fase('Prova objetiva', pond, 100, corte);
      const f2: FaseDoProcesso129 = { nome: 'Redação', nota: redacao, max: 10, corte: o.rede === 'privada' ? 4 : 5, passou: redacao >= (o.rede === 'privada' ? 4 : 5) };
      const aprovado = f1.passou && f2.passou;
      return { fases: [f1, f2], aprovado, nota: aprovado ? 'aprovado' : !f2.passou ? 'a redação ficou abaixo do mínimo' : 'a prova ficou abaixo do corte' };
    }
  }
}

/* ================================================================ A ação */

export type AcaoEstudos129 =
  | { tipo: 'estudos129'; oque: 'candidatar'; chave: string; turno?: Turno129; troca?: boolean }
  | { tipo: 'estudos129'; oque: 'trocar_interna'; cursoId: string }
  | { tipo: 'estudos129'; oque: 'dependencia' };

export interface SaidaEstudos129 { resultado?: string; titulo?: string; aviso?: { texto: string; tom: 'bom' | 'ruim' | 'neutro' } }

export function disponibilidadeEstudos129(v: Vida, a: AcaoEstudos129): Veredito {
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  switch (a.oque) {
    case 'candidatar': {
      const o = opcaoPorChave129(v, a.chave, !!a.troca);
      if (!o) return bloqueio('impossivel', 'Essa opção não existe mais.');
      if (v.educacao.aprovacao && v.educacao.aprovacao.tAte > v.t) return bloqueio('incompativel', `Há uma vaga esperando a sua confirmação: ${v.educacao.aprovacao.nome}.`);
      if (a.troca) {
        const m = v.educacao.matricula;
        if (!m) return bloqueio('incompativel', 'Não há curso para trocar.');
        if (m.cursoId === o.curso.id && (m.inst129?.id ?? m.instituicao) === (o.inst?.id ?? m.instituicao)) return bloqueio('incompativel', 'Esse é o curso de agora.');
      }
      return o.veredito;
    }
    case 'trocar_interna': {
      const x = trocasInternas129(v).find(t => t.curso.id === a.cursoId);
      if (!x) return bloqueio('impossivel', 'Esse curso não é oferecido onde você estuda.');
      return x.veredito;
    }
    case 'dependencia': return podeDependencia129(v);
  }
}

export function executarEstudos129(v: Vida, r: Rng, a: AcaoEstudos129): SaidaEstudos129 {
  switch (a.oque) {
    case 'candidatar': return candidatar129(v, r, a.chave, a.turno, !!a.troca);
    case 'trocar_interna': return trocarInterna129(v, a.cursoId);
    case 'dependencia': return dependencia129(v);
  }
}

export function opcaoPorChave129(v: Vida, chave: string, troca = false): Opcao129 | undefined {
  const cursoId = chave.startsWith('inst:') ? chave.split(':')[3] : chave.split(':')[1];
  return opcoes129(v, cursoId, troca).find(o => o.chave === chave);
}

function guardarProcesso(v: Vida, p: ProcessoFeito129): void {
  const xs = (v.educacao.processos129 ??= []);
  xs.push(p);
  if (xs.length > 12) xs.splice(0, xs.length - 12);
}

/** Candidatar-se: a prova (ou a nota), o resultado e, aprovado, a vaga reservada à espera da matrícula. */
export function candidatar129(v: Vida, r: Rng, chave: string, turno?: Turno129, troca = false): SaidaEstudos129 {
  const o = opcaoPorChave129(v, chave, troca)!;
  const c = o.curso;
  v.fatos[`proc129:${chave}:${anoDe(v.t)}`] = v.t;
  const g = v.eu.tratamento ?? v.eu.genero;
  const turnoOk = turno && o.turnos.includes(turno) ? turno : o.turnos[0];
  if (o.generica) {
    // A via genérica (fora do catálogo): a conta de sempre (`escola.tentarIngresso`).
    const res = tentarIngresso(v, r, o.generica);
    guardarProcesso(v, { t: v.t, cursoId: c.id, processo: String(o.processo), nome: o.nomeProcesso, instituicao: res.entrou ? novaMatricula(v, o.generica).instituicao : (o.modalidade === 'ead' ? 'a distância' : nomeLugar(o.municipioId)), fases: o.processo === 'sisu' && notaParaCurso(v, c) ? [{ nome: `Nota ${educacaoDaVida(v).do}, ponderada`, nota: notaParaCurso(v, c), max: 1000, corte: c.corte, passou: res.entrou }] : [], aprovado: res.entrou });
    if (!res.entrou) return { resultado: res.texto, titulo: 'Resultado da candidatura' };
    const novo = novaMatricula(v, o.generica);
    v.educacao.aprovacao = { novo, nome: `${c.nome}, ${novo.instituicao}`, t: v.t, tAte: v.t + 12, ...(troca ? { troca129: true } : {}) };
    escrever(v, { texto: res.texto, relevancia: 'biografia', tema: 'estudo', tom: 'bom' });
    return { resultado: `${res.texto} A vaga está reservada até ${anoDe(v.t + 12)}: falta confirmar a matrícula.${troca ? ' Confirmada, ela fecha o curso de agora.' : ''}`, titulo: 'Resultado da candidatura' };
  }
  const inst = o.inst!, campus = o.campus!;
  const nomeInst = nomeDaInstituicao129(inst, campus);
  const prova = aplicarProva(v, o);
  guardarProcesso(v, { t: v.t, instId: inst.id, campus: campus.id, cursoId: c.id, processo: String(o.processo), nome: o.nomeProcesso, instituicao: nomeInst, fases: prova.fases, aprovado: prova.aprovado, nota: prova.nota });
  const resumo = prova.fases.map(f => `${f.nome}: ${fmtNota(f.nota)} de ${f.max}${f.corte !== undefined ? ` (corte ${fmtNota(f.corte)})` : ''}`).join('; ');
  if (!prova.aprovado) {
    const texto = `Não passou ${o.processo === 'prouni' || o.processo === 'fies' ? `no ${o.nomeProcesso}` : `n${o.nomeProcesso.startsWith('Nota') ? 'a seleção pela nota' : `o ${o.nomeProcesso}`}`} para ${c.nome} (${inst.sigla}): ${prova.nota}.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'estudo', tom: 'ruim', escolha: true });
    return { resultado: `${texto} ${resumo}.`, titulo: `Resultado · ${o.nomeProcesso}` };
  }
  const via = o.processo === 'prouni' ? 'prouni' : o.processo === 'fies' ? 'fies' : o.rede === 'publica' ? 'sisu' : 'privada';
  const novo: Extract<NovoCompromisso, { tipo: 'curso' }> = {
    tipo: 'curso', cursoId: c.id, via, modalidade: 'presencial', rede: o.rede, mensalidade: o.processo === 'prouni' ? 0 : o.mensalidade,
    municipioId: campus.municipioId, instituicao: nomeInst, inst129: { id: inst.id, campus: campus.id, processo: o.processo as MatriculaInstituicao129['processo'], turno: turnoOk, ...(inst.duracoes?.[c.id] ? { meses: inst.duracoes[c.id] } : {}) }
  };
  v.educacao.aprovacao = { novo, nome: `${c.nome}, ${nomeInst}`, t: v.t, tAte: v.t + 12, ...(troca ? { troca129: true } : {}) };
  const texto = `${flex(g, 'Aprovado', 'Aprovada')} ${o.processo === 'prouni' ? `com bolsa do ProUni em ${c.nome}` : o.processo === 'fies' ? `com FIES em ${c.nome}` : `em ${c.nome} pelo ${o.nomeProcesso}`}, ${em(nomeInst)}.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'estudo', tom: 'bom', escolha: true });
  return { resultado: `${texto} ${resumo}. A vaga está reservada até ${anoDe(v.t + 12)}: falta confirmar a matrícula.${troca ? ' Confirmada, ela fecha o curso de agora.' : ''}`, titulo: `Resultado · ${o.nomeProcesso}` };
}

const fmtNota = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/* ================================================================ Semestres */

export interface Periodo129 { rotulo: string; ano: number; disciplinas: RegistroAcademico['disciplinas']; media?: number }
export interface Semestres129 { atual: number; total: number; previstos: number; atraso: number; esteAno: [number, number]; periodos: Periodo129[]; progresso: number }

/** Os meses previstos do curso da matrícula (a residência pela especialidade). */
function mesesDoCurso(m: Matricula): number {
  const c = cursoOuNulo(m.cursoId);
  return Math.max(6, m.inst129?.meses ?? c?.meses ?? 12);
}

/**
 * O curso em SEMESTRES (dois por ano): o motor anda por ano, e cada ano fechado vira dois períodos — as disciplinas do
 * ano, em duas metades. `atraso`: semestres a mais que as reprovações acrescentaram.
 */
export function semestres129(v: Vida, m: Matricula = v.educacao.matricula!): Semestres129 {
  const meses = mesesDoCurso(m);
  const previstos = Math.max(1, Math.ceil(meses / 6));
  const anos = registrosDoCurso(v, m.cursoId, m.tInicio).filter(x => x.disciplinas.length);
  const cursados = anos.length * 2;
  const faltam = Math.max(0, Math.ceil(m.mesesRestantes / 6));
  const total = Math.max(previstos, cursados + faltam);
  const atraso = Math.max(0, total - previstos);
  const atual = Math.min(total, cursados + 1);
  const periodos: Periodo129[] = [];
  anos.forEach((x, k) => {
    const meio = Math.ceil(x.disciplinas.length / 2);
    const ano = anoDe(x.t - 6);
    for (const [j, ds] of [x.disciplinas.slice(0, meio), x.disciplinas.slice(meio)].entries()) {
      if (!ds.length) continue;
      const media = Math.round((ds.reduce((s, d) => s + d.nota, 0) / ds.length) * 10) / 10;
      periodos.push({ rotulo: `${k * 2 + j + 1}º semestre`, ano, disciplinas: ds, media });
    }
  });
  return { atual, total, previstos, atraso, esteAno: [atual, Math.min(total, atual + 1)], periodos, progresso: total ? Math.min(1, cursados / total) : 0 };
}

/** Reprovações que a instituição tolera antes de cancelar a matrícula (o jubilamento). */
export function limiteDeReprovacoes129(c: Curso): number {
  return c.nivel === 'superior' ? Math.max(6, 2 * Math.ceil(c.meses / 12)) : c.nivel === 'livre' ? 3 : 4;
}

/* ================================================================ Exame final (recuperação) */

/** A chance de passar no exame final: o desempenho do ano e a dedicação. */
export function chanceDoExameFinal129(v: Vida, m: Matricula): number {
  const p = v.educacao.postura === 'dedicada' ? 0.15 : v.educacao.postura === 'relaxada' ? -0.15 : 0;
  return clamp(0.35 + (m.desempenho - 25) / 30 + p, 0.1, 0.85);
}

/**
 * O exame final (gancho do fim do ano do curso): cada disciplina reprovada com nota de recuperação (3 ou mais) vai ao
 * exame; passando, a disciplina fica aprovada (com nota 5, marcada como recuperação). Devolve se TODAS passaram — então
 * o ano não atrasa.
 */
function recuperacao(v: Vida, m: Matricula, ds: RegistroAcademico['disciplinas']): boolean {
  const reprovadas = ds.filter(d => d.situacao === 'reprovada');
  if (!reprovadas.length) return false;
  const chance = chanceDoExameFinal129(v, m);
  const passou: string[] = [];
  const ficou: string[] = [];
  for (const d of reprovadas) {
    if (d.nota >= 3 && rngDe(v.id, 'exame-final', v.t, d.nome).chance(chance)) { d.nota = 5; d.situacao = 'aprovada'; d.rec = true; passou.push(d.nome); }
    else ficou.push(d.nome);
  }
  if (passou.length) {
    const lista = juntar(passou);
    escrever(v, { texto: ficou.length ? `Passou no exame final de ${lista}; ${juntar(ficou)} ficou para refazer.` : `Ficou de exame final em ${lista} e passou: o ano não atrasou.`, relevancia: 'cotidiano', tema: 'estudo', tom: ficou.length ? 'neutro' : 'bom' });
  }
  return ficou.length === 0;
}
const juntar = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

/* ================================================================ Dependência nas férias */

/** As disciplinas reprovadas do último ano do curso de agora (as que a dependência refaz). */
export function reprovadasDoUltimoAno129(v: Vida, m: Matricula = v.educacao.matricula!): string[] {
  const anos = registrosDoCurso(v, m.cursoId, m.tInicio).filter(x => x.disciplinas.length);
  const ult = anos[anos.length - 1];
  if (!ult || v.t - ult.t > 12) return [];
  return ult.disciplinas.filter(d => d.situacao === 'reprovada').map(d => d.nome);
}
export function custoDaDependencia129(m: Matricula, n: number): number {
  return m.rede === 'privada' && m.financiamento !== 'prouni' ? Math.round(m.mensalidade * 0.5 * n) : 0;
}

export function podeDependencia129(v: Vida): Veredito {
  const m = v.educacao.matricula;
  if (!m || m.trancado) return bloqueio('incompativel', 'Não há curso em andamento.');
  const rep = reprovadasDoUltimoAno129(v, m);
  if (!rep.length) return bloqueio('incompativel', 'Não há disciplina reprovada no último ano para refazer.');
  if (m.dependencia129 !== undefined && anoDe(m.dependencia129) === anoDe(v.t)) return bloqueio('incompativel', 'A dependência deste ano já foi feita.');
  if (m.mesesRestantes <= 6) return bloqueio('incompativel', 'O curso está no fim: as reprovadas entram no último semestre.');
  const chance = chanceDaDependencia129(v, m);
  return { grau: chance < 0.3 ? 'improvavel' : 'permitido', chance };
}
export function chanceDaDependencia129(v: Vida, m: Matricula): number {
  const p = v.educacao.postura === 'dedicada' ? 0.12 : v.educacao.postura === 'relaxada' ? -0.15 : 0;
  return clamp(0.5 + (m.desempenho - 45) / 60 + p - (v.trabalho.atual?.carga === 'integral' ? 0.1 : 0), 0.15, 0.9);
}

/** Refazer nas férias as disciplinas reprovadas (a dependência): passando, o semestre de atraso volta. */
function dependencia129(v: Vida): SaidaEstudos129 {
  const m = v.educacao.matricula!;
  const c = cursoPorId(m.cursoId);
  const rep = reprovadasDoUltimoAno129(v, m);
  const custo = custoDaDependencia129(m, rep.length);
  if (custo > 0) pagar(v, custo);
  m.dependencia129 = v.t;
  v.mente.estresse = Math.min(100, v.mente.estresse + 4);
  const r = rngDe(v.id, 'dependencia', v.t);
  const passou = r.chance(chanceDaDependencia129(v, m));
  const notas = rep.map(n => `${n} (${fmtNota(passou ? Math.round((5 + r.next() * 2) * 10) / 10 : Math.round((2.5 + r.next() * 2) * 10) / 10)})`);
  registrarAnoLetivo(v, { nivel: c.nivel, instituicao: m.instituicao, cursoId: c.id, tInicioCurso: m.tInicio, pais: paisDaVida(v), rotulo: `Dependência nas férias: ${notas.join(', ')}`, disciplinas: [], situacao: passou ? 'aprovado' : 'reprovado' });
  if (passou) m.mesesRestantes = Math.max(1, m.mesesRestantes - 6);
  const texto = passou
    ? `Refez ${juntar(rep)} nas férias e passou: o semestre de atraso ficou para trás.`
    : `Refez ${juntar(rep)} nas férias e não passou: ${rep.length === 1 ? 'a disciplina volta' : 'as disciplinas voltam'} no ano que vem.`;
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'estudo', tom: passou ? 'bom' : 'ruim', escolha: true });
  return { aviso: { texto: `${texto}${custo > 0 ? ` Custou ${dinheiroCurto(custo)}.` : ''}`, tom: passou ? 'bom' : 'ruim' } };
}

/* ================================================================ Crédito estudantil ao sair */

/** Os meses efetivamente cursados (cada ano letivo fechado conta doze; o ano em curso, o tempo desde o ingresso). */
export function mesesCursados129(v: Vida, m: Matricula): number {
  const anos = registrosDoCurso(v, m.cursoId, m.tInicio).filter(x => x.disciplinas.length).length;
  return Math.min(mesesDoCurso(m) + 24, anos > 0 ? anos * 12 : m.trancado ? 0 : Math.max(0, v.t - m.tInicio));
}
/** O que o crédito estudantil cobra de quem sai sem se formar: o que foi cursado (a mesma conta da formatura). */
export function dividaProporcional129(v: Vida, m: Matricula): number {
  if (m.financiamento !== 'fies') return 0;
  return Math.round(m.mensalidade * mesesCursados129(v, m) * 0.85) + (m.fiesAnterior129 ?? 0);
}

function aoSair(v: Vida, m: Matricula): void {
  const total = dividaProporcional129(v, m);
  if (total <= 0) return;
  const ed = educacaoDaVida(v);
  const c = cursoOuNulo(m.cursoId);
  v.financas.dividas.push({ id: `fies${v.seq++}`, tipo: 'fies', saldo: total, jurosMes: 0.001, parcela: Math.max(50, Math.round(total / 120)), descricao: `${ed.credito?.nome ?? 'Crédito estudantil'} de ${c?.nome ?? 'curso'} (o que foi cursado)`, tInicio: v.t });
  escrever(v, { texto: `O ${ed.credito?.nome ?? 'crédito estudantil'} do que foi cursado em ${c?.nome ?? 'curso'} virou dívida: ${dinheiroCurto(total)}, em parcelas.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'ruim' });
}

/** Sair do curso de agora (abandono decidido num acontecimento): o histórico e o crédito, como na ação de abandonar. */
export function encerrarMatricula129(v: Vida, situacao: 'abandonado' | 'cancelado' = 'abandonado'): void {
  const m = v.educacao.matricula;
  if (!m) return;
  fecharNoHistorico(v, m, situacao);
  v.educacao.matricula = undefined;
}

/* ================================================================ Trancar */

/** O texto de trancar, pelo nível do curso (antes, "a faculdade" até para o técnico e a pós). */
export function textoDeTrancar129(v: Vida, m: Matricula): string {
  const c = cursoOuNulo(m.cursoId);
  const nome = nomeDaMatricula(v, m);
  switch (c?.nivel) {
    case 'superior': return `Trancou a matrícula da faculdade (${nome}).`;
    case 'tecnico': return `Trancou a matrícula do curso técnico (${nome.replace(/^Técnico em /, '')}).`;
    case 'livre': return `Trancou o curso de ${nome.replace(/^Curso de /, '').toLowerCase()}.`;
    case 'pos': return `Trancou a pós (${nome}).`;
    case 'mestrado': return 'Trancou o mestrado.';
    case 'doutorado': return 'Trancou o doutorado.';
    case 'residencia': return 'Trancou a residência médica.';
    default: return 'Trancou a matrícula do curso.';
  }
}

/* ================================================================ Troca de curso */

export interface TrocaInterna129 { curso: Curso; veredito: Veredito; aproveita: number; mensalidade: number; mensalidadeVerificada?: Mensalidade129 }

/** Os cursos para onde dá para pedir transferência interna (a mesma instituição, o mesmo campus). */
export function trocasInternas129(v: Vida): TrocaInterna129[] {
  const m = v.educacao.matricula;
  if (!m) return [];
  const atual = cursoOuNulo(m.cursoId);
  if (!atual || (atual.nivel !== 'superior' && atual.nivel !== 'tecnico')) return [];
  const anos = registrosDoCurso(v, m.cursoId, m.tInicio).filter(x => x.disciplinas.length).length;
  const inst = m.inst129 ? instituicao129(m.inst129.id) : undefined;
  const campus = inst && m.inst129 ? campus129(inst, m.inst129.campus) : undefined;
  let ids: string[];
  if (campus) ids = campus.cursos;
  else {
    // A instituição genérica: os cursos do mesmo nível que a mesma rede oferece na mesma cidade (ou a distância).
    ids = genericas(semMatricula(v)).filter(o => o.curso.nivel === atual.nivel && o.rede === m.rede && o.modalidade === m.modalidade && (m.modalidade === 'ead' || o.municipioId === m.municipioId)).map(o => o.curso.id);
  }
  const base = semMatricula(v);
  const out: TrocaInterna129[] = [];
  for (const id of [...new Set(ids)]) {
    if (id === atual.id) continue;
    const c = cursoOuNulo(id);
    if (!c || c.nivel !== atual.nivel) continue;
    const mesma = c.area === atual.area;
    const aproveita = Math.min(Math.max(0, c.meses - 12), anos * (mesma ? 6 : 3));
    const req = requisitoDoCurso(base, c);
    const chave = `troca:${id}:${anoDe(v.t)}`;
    let veredito: Veredito;
    if (req) veredito = req;
    else if (m.trancado) veredito = bloqueio('incompativel', 'Com a matrícula trancada, a transferência interna espera a volta ao curso.');
    else if (atual.nivel === 'superior' && anos < 1) veredito = bloqueio('requisito', 'A transferência interna pede ao menos um ano de curso concluído.');
    else if (v.fatos[`t129:${chave}`] !== undefined) veredito = bloqueio('incompativel', 'O pedido de transferência para este curso já foi feito neste ano.');
    else {
      const chance = m.rede === 'privada' ? 0.92 : clamp(0.2 + (m.desempenho - 50) / 45 + (mesma ? 0.1 : 0), 0.05, 0.85);
      veredito = { grau: chance < 0.3 ? 'improvavel' : 'permitido', chance };
    }
    const mens = m.rede === 'publica' ? { valor: 0 } : mensalidade129(inst, c, m.municipioId);
    out.push({ curso: c, veredito, aproveita, mensalidade: m.modalidade === 'ead' ? Math.round(mens.valor * 0.32 / 10) * 10 : mens.valor, mensalidadeVerificada: mens.verificada });
  }
  return out;
}

/** O crédito do curso que se deixa (numa troca): o que foi cursado nele. */
function creditoDoQueFica(v: Vida, m: Matricula): number {
  return m.financiamento === 'fies' ? Math.round(m.mensalidade * mesesCursados129(v, m) * 0.85) : 0;
}

function trocarInterna129(v: Vida, cursoId: string): SaidaEstudos129 {
  const m = v.educacao.matricula!;
  const x = trocasInternas129(v).find(t => t.curso.id === cursoId)!;
  v.fatos[`t129:troca:${cursoId}:${anoDe(v.t)}`] = v.t;
  const antes = cursoPorId(m.cursoId);
  const passou = rngDe(v.id, 'troca129', cursoId, v.t).chance(x.veredito.chance ?? 0.5);
  if (!passou) {
    const texto = `Pediu transferência interna de ${antes.nome} para ${x.curso.nome} e não conseguiu a vaga.`;
    escrever(v, { texto, relevancia: 'cotidiano', tema: 'estudo', tom: 'ruim', escolha: true });
    return { aviso: { texto: `${texto} Dá para tentar de novo no ano que vem — ou por um processo seletivo.`, tom: 'ruim' } };
  }
  const fiesAnterior = (m.fiesAnterior129 ?? 0) + creditoDoQueFica(v, m);
  fecharNoHistorico(v, m, 'transferido');
  const nova: Matricula = {
    cursoId: x.curso.id, instituicao: m.instituicao, rede: m.rede, modalidade: m.modalidade, tInicio: v.t,
    mesesRestantes: Math.max(6, x.curso.meses - x.aproveita), mensalidade: m.financiamento === 'prouni' ? 0 : x.mensalidade,
    ...(m.financiamento ? { financiamento: m.financiamento } : {}), desempenho: m.desempenho, trancado: false, municipioId: m.municipioId,
    ...(m.inst129 ? { inst129: { ...m.inst129 } } : {}), ...(fiesAnterior > 0 ? { fiesAnterior129: fiesAnterior } : {})
  };
  const area = areaDaPos(v, x.curso);
  if (area) nova.area = area;
  v.educacao.matricula = nova;
  if (x.curso.nivel === 'superior') marcarFato(v, 'trocou_de_curso');
  const texto = `Trocou de curso: saiu de ${antes.nome} para ${x.curso.nome}, ${em(m.instituicao)}.${x.aproveita ? ` Aproveitou ${x.aproveita} meses de disciplinas.` : ''}`;
  escrever(v, { texto, relevancia: 'marco', tema: 'estudo', tom: 'bom', escolha: true });
  return { aviso: { texto, tom: 'bom' } };
}

/** Confirmar uma vaga de TROCA: o curso de agora fecha (o crédito dele vira dívida do que foi cursado — é outro contrato). */
export function encerrarParaTroca129(v: Vida): void {
  const m = v.educacao.matricula;
  if (!m) return;
  const c = cursoOuNulo(m.cursoId);
  aoSair(v, m);
  fecharNoHistorico(v, m, 'transferido');
  v.educacao.matricula = undefined;
  if (c) escrever(v, { texto: `Deixou ${c.nome} para começar o curso novo.`, relevancia: 'biografia', tema: 'estudo', escolha: true });
}

/* ================================================================ O ano */

/**
 * Depois do ano do curso: o jubilamento (reprovações demais cancelam a matrícula — antes, o contador só crescia) e, um
 * ano antes do limite, o aviso. Silencioso no ano comum.
 */
export function depoisDoCurso129(v: Vida): void {
  const m = v.educacao.matricula;
  if (!m || m.trancado) return;
  const c = cursoOuNulo(m.cursoId);
  if (!c) return;
  const rep = m.reprovacoes ?? 0;
  const limite = limiteDeReprovacoes129(c);
  if (rep >= limite) {
    fecharNoHistorico(v, m, 'cancelado');
    v.educacao.matricula = undefined;
    escrever(v, { texto: `A matrícula em ${c.nome} foi cancelada: ${rep} reprovações, mais do que o regimento ${m.rede === 'publica' ? 'da universidade' : 'da instituição'} permite.`, relevancia: 'marco', tema: 'estudo', tom: 'ruim' });
    return;
  }
  const chave = `aviso_jubilamento_${m.cursoId}_${m.tInicio}`;
  if (rep >= limite - 2 && v.fatos[chave] === undefined) {
    v.fatos[chave] = v.t;
    escrever(v, { texto: `Chegou a advertência da coordenação: ${rep} reprovações em ${c.nome}. Mais ${limite - rep === 1 ? 'uma' : 'duas'}, e a matrícula é cancelada.`, relevancia: 'biografia', tema: 'estudo', tom: 'ruim' });
  }
}

// Os ganchos no motor de baixo (`escola`): registrados ao carregar este módulo (que só a camada de cima importa).
ganchos129.recuperacao = recuperacao;
ganchos129.aoSair = aoSair;

/* ================================================================ Leituras para a tela */

/** A instituição real da matrícula (e o campus), quando há. */
export function instituicaoDaMatricula129(m: Matricula | undefined): { inst: Instituicao129; campus?: Campus129 } | undefined {
  if (!m?.inst129) return undefined;
  const inst = instituicao129(m.inst129.id);
  return inst ? { inst, campus: campus129(inst, m.inst129.campus) } : undefined;
}

/** O resumo do que pesa no ano do curso, em palavras (para a tela do curso). */
export function leituraDoCurso129(v: Vida, m: Matricula): string[] {
  const out: string[] = [];
  const c = cursoOuNulo(m.cursoId);
  if (!c) return out;
  const rep = m.reprovacoes ?? 0;
  const limite = limiteDeReprovacoes129(c);
  if (rep > 0) out.push(`${rep} ${rep === 1 ? 'reprovação' : 'reprovações'} de ${limite} que o regimento tolera antes de cancelar a matrícula.`);
  if (v.trabalho.atual && !m.trancado) out.push(v.trabalho.atual.carga === 'integral' ? 'Trabalhar o dia inteiro pesa nas notas (e nas faltas, se o horário bate).' : 'O trabalho de meio período pesa pouco nas notas.');
  if (v.educacao.postura === 'dedicada') out.push('Com dedicação: as horas de estudo em casa contam nas notas e no exame final.');
  else if (v.educacao.postura === 'relaxada') out.push('Empurrando: a nota cai e o exame final fica mais difícil.');
  return out;
}

/** Para a tela: as notas das matérias da prova (o que mais puxa para baixo num curso). */
export function materiaMaisFraca129(v: Vida, c: Curso): Materia | undefined {
  const ms = (Object.keys(c.pesos ?? {}) as Materia[]);
  if (!ms.length) return undefined;
  return ms.reduce((a, b) => (notaEsperadaArea(v, a) <= notaEsperadaArea(v, b) ? a : b));
}
export const nomeMateria129 = (m: Materia) => NOME_MATERIA[m];

/** O ingresso já está ao alcance desta vida (a partir dos 15, para olhar; para tentar, os requisitos de cada curso)? */
export const podeVerFaculdade129 = (v: Vida) => idade(v) >= 15;
export { podeTentar };
