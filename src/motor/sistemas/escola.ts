/**
 * Escola e formação.
 *
 * Educação básica brasileira: creche (0-3, depende de vaga), pré-escola (4-5),
 * fundamental I (1º-5º ano), fundamental II (6º-9º), médio (1ª-3ª série).
 * Rede pública ou privada pela renda da casa — e ela muda quando a renda muda.
 *
 * Depois do médio: ENEM, SISU (com cotas), ProUni, FIES, faculdade privada,
 * EAD, técnico. Um curso existe onde existe: Medicina presencial não está
 * disponível em Tarauacá.
 */

import { falaALingua, perfilDaVida } from '../mundo/vida';
import { textoLocal } from '../mundo/locais';
import { paisCorrente } from '../mundo/moeda';
import { perfilDoPais, temPerfil } from '../mundo/registro';
import { salarioMinimoDoPais } from '../mundo/economia';
import { doPrograma, educacaoDaVida, oPrograma, paisDaVida } from '../mundo/vida';
import { dinheiroCurto as moedaCurta } from '../texto';
import { LISTA_ESPECIALIDADES, modeloEspecialidade, type EspecialidadeMedica } from '../dados/especialidades';
import { avaliacaoDaResidencia, MOTIVO_RESIDENCIA, preparoDaResidencia } from './medicina';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { EscolaBasica, Escolaridade, Matricula, NivelCurso, Vida, NovoCompromisso } from '../tipos';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { CURSOS, curso, cursoOuNulo, type AreaFormacao, type Curso, type Materia, ROTULO_AREA } from '../dados/cursos';
import { estudarMaterias, habilidade, materiasExtremas, mediaEscolar, praticar } from './frentes';

/**
 * O nome das matérias. A de língua é a língua do lugar (REWORK 4: "recuperação em português" vazava para vidas no
 * Japão e nos EUA) — lida do país da vida que está sendo processada (`paisCorrente`, o mesmo contexto da moeda).
 */
export const NOME_MATERIA: Record<string, string> = {
  exatas: 'matemática', ciencias: 'ciências', humanas: 'história',
  get linguagens() { const p = paisCorrente(); return temPerfil(p) ? perfilDoPais(p).idiomas[0] : 'português'; }
};
import { marcar } from './marcas';
import type { Dominio } from '../tipos';
import { cidadesDoPais, economiaLocal, municipio, nivelDeOferta, nomeLugar } from '../dados/lugares';
import { bloqueio, type Veredito } from '../plausibilidade';
import { rendaPerCapita } from './domicilio';
import { flex } from '../texto';
import { anoDe } from '../tempo';
import { abalar } from './abalo';
import { bonusDoPreparo, devolutivaDoEnem } from './vestibular';
import { aoConcluir, bonusDeEstudo, instituicaoAtual, pesoNaPesquisa } from './formacao';
import { ajustarAoLugarDeFormacao } from './formacao';
import { registrarDevolutiva } from './devolutivas';
import { objetivoPorId, registrarTentativa } from './objetivos';

/** "Eletricista instalador (NR-10)" → "eletricista instalador (NR-10)": só a inicial, e só quando não é sigla. */
const minusculaInicial = (s: string) => (/^[A-ZÀ-Ú][a-zà-ú]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

const ORDEM_ESCOLARIDADE: Escolaridade[] = [
  'nenhuma', 'fundamental_incompleto', 'fundamental', 'medio_incompleto', 'medio',
  'tecnico', 'superior_incompleto', 'superior', 'pos', 'mestrado', 'doutorado'
];
export const nivelEsc = (e: Escolaridade) => ORDEM_ESCOLARIDADE.indexOf(e);
export const temEscolaridade = (v: Vida, e: Escolaridade) => nivelEsc(v.educacao.escolaridade) >= nivelEsc(e);

export const ROTULO_ESCOLARIDADE: Record<Escolaridade, string> = {
  nenhuma: 'sem escolaridade', fundamental_incompleto: 'fundamental incompleto', fundamental: 'fundamental completo',
  medio_incompleto: 'médio incompleto', medio: 'ensino médio completo', tecnico: 'técnico',
  superior_incompleto: 'superior incompleto', superior: 'superior completo', pos: 'pós-graduação',
  mestrado: 'mestrado', doutorado: 'doutorado'
};

/** A escolaridade com os nomes das etapas do país onde a pessoa mora ("fundamental completo" no Brasil, "primária completa" no Peru). */
export function rotuloEscolaridade(v: Vida, e: Escolaridade): string {
  const ed = educacaoDaVida(v);
  if (e === 'fundamental') return ed.fundamental.completo;
  if (e === 'fundamental_incompleto') return `${ed.fundamental.nome} incomplet${ed.fundamental.o.startsWith('a ') ? 'a' : 'o'}`;
  if (e === 'medio') return ed.medio.completo;
  if (e === 'medio_incompleto') return `${ed.medio.nome} incomplet${ed.medio.o.startsWith('a ') ? 'a' : 'o'}`;
  return ROTULO_ESCOLARIDADE[e];
}

function subir(v: Vida, e: Escolaridade): void {
  if (nivelEsc(e) > nivelEsc(v.educacao.escolaridade)) v.educacao.escolaridade = e;
}

/** A casa consegue pagar escola particular? */
export function redeParaCasa(v: Vida): 'publica' | 'privada' {
  const pc = rendaPerCapita(v);
  return pc > 2600 ? 'privada' : 'publica';
}

export function rotuloSerie(b: EscolaBasica, pais = paisCorrente()): string {
  // Os nomes das etapas são do país (o "fundamental" e o "ensino médio" do Brasil; a "primária" e a "secundária" alhures).
  const e = perfilDoPais(temPerfil(pais) ? pais : 'BR').educacao.etapas;
  if (b.etapa === 'creche') return 'creche';
  if (b.etapa === 'pre') return 'pré-escola';
  if (b.etapa === 'medio') return e.serieMedio === 'série' ? `${b.serie}ª série do ${e.medio}` : `${b.serie}º ano do ${e.medio}`;
  return `${b.serie}º ano do ${e.fundamental}`;
}

function escola(v: Vida, rede: 'publica' | 'privada', etapa: EscolaBasica['etapa']): string {
  const m = municipio(v.moradia.municipioId);
  if (rede === 'privada') return etapa === 'medio' ? 'um colégio particular' : 'uma escola particular';
  const ed = educacaoDaVida(v);
  if (etapa === 'medio') return `a ${ed.inst.escolaMedio} do bairro`;
  if (etapa === 'creche') return ed.etapas.publica.creche;
  return m.perfil === 'pequena' ? `a ${ed.inst.escolaFundamental} da cidade` : `a ${ed.inst.escolaFundamental} do bairro`;
}

/* ------------------------------------------------------------ Desempenho */

/**
 * Condições de estudo em casa: comida no prato, um canto quieto, alguém com
 * tempo para olhar o caderno. Vem da renda atual da casa, não de um carimbo
 * de origem — muda se a família sobe ou desce.
 */
export function condicoesDeEstudo(v: Vida): number {
  if (idade(v) >= 18) return 0;
  const pc = rendaPerCapita(v);
  return pc < 600 ? -7 : pc < 1200 ? -3 : pc < 2600 ? 0 : pc < 6000 ? 3 : 5;
}

/**
 * Desempenho: não há uma inteligência universal que faça alguém bom em tudo.
 * A nota vem principalmente das MATÉRIAS (cada uma com sua facilidade, seu
 * gosto e a prática de cada ano), e só um pouco da cabeça em geral; depois,
 * a postura, a casa, o trabalho e a escola.
 */
export function calcularDesempenho(v: Vida, r: Rng, bonusRede: number, materias?: Materia[]): number {
  const d = v.personalidade.tracos.disciplina;
  const postura = v.educacao.postura === 'dedicada' ? 10 : v.educacao.postura === 'relaxada' ? -10 : 0;
  // Bem-estar, cabeça e corpo: um ano doente ou para baixo rende menos na escola (sem virar fracasso).
  const casa = (v.mente.felicidade - 50) * 0.1 - Math.max(0, v.mente.estresse - 60) * 0.25 - Math.max(0, 55 - v.corpo.saude) * 0.2;
  const trabalhoPesa = v.trabalho.atual ? (v.trabalho.atual.carga === 'integral' ? -10 : -4) : 0;
  // A nota compara o que a pessoa sabe com o que se espera na série (ou no curso).
  const media = materias?.length ? materias.reduce((s, m) => s + habilidade(v, m), 0) / materias.length : mediaEscolar(v);
  const esperado = materias?.length ? 52 : Math.min(60, Math.max(6, 5 * (idade(v) - 5)));
  // O reforço e o grupo de estudos (atividades da formação) contam aqui — a mesma rotina que ocupa a semana.
  const apoio = bonusDeEstudo(v, materias === undefined);
  const base = 52 + (media - esperado) * 0.9 + (v.mente.cognicao - 50) * 0.18 + d * 0.1 + postura + bonusRede + casa + trabalhoPesa + condicoesDeEstudo(v) + apoio;
  return clamp(Math.round(base + r.normal() * 6), 5, 100);
}

/* ------------------------------------------------------ Educação básica */

export function processarEscola(v: Vida, r: Rng): void {
  const i = idade(v);
  const e = v.educacao;

  // Creche: depende de vaga (pública) ou de dinheiro (privada).
  if (i >= 1 && i <= 3 && !e.basica) {
    const rede = redeParaCasa(v);
    const vaga = rede === 'privada' ? r.chance(0.7) : r.chance(0.35);
    if (vaga && i === 2) {
      e.basica = { etapa: 'creche', serie: 0, rede, desempenho: 60, reprovacoes: 0 };
      escrever(v, { texto: `Começou a ir para ${escola(v, rede, 'creche')}.`, relevancia: 'cotidiano', tema: 'escola' });
    }
    return;
  }

  if (i === 4 && (!e.basica || e.basica.etapa === 'creche')) {
    const rede = redeParaCasa(v);
    e.basica = { etapa: 'pre', serie: 0, rede, desempenho: 60, reprovacoes: 0 };
    const onde = em(escola(v, rede, 'pre'));
    escrever(v, { texto: rngDe(v.id, 'pre_escola').pick([`Entrou na pré-escola, ${onde}.`, `Começou a pré-escola ${onde}: mochila de rodinha, nome bordado na camiseta.`, `Primeiro ano de pré-escola, ${onde}. Chorou três dias; no quarto, não quis voltar para casa.`, `A pré-escola começou ${onde}, com massinha, fila do lanche e uma música para cada coisa.`]), relevancia: 'cotidiano', tema: 'escola' });
    return;
  }

  const b = e.basica;
  if (!b || e.evadiu) return;

  if (b.etapa === 'pre') {
    if (i >= 6) {
      b.etapa = 'fundamental1';
      b.serie = 1;
      subir(v, 'fundamental_incompleto');
      // O primeiro dia de aula é marco do calendário (conteúdo), não daqui.
    }
    return;
  }

  // Mudança de rede quando a renda da casa muda de patamar.
  const redeIdeal = redeParaCasa(v);
  const fixa = b.integrado || (b.rede === 'privada' && temFato(v, 'bolsa_escola'));
  if (!fixa && redeIdeal !== b.rede && i < 17 && (b.serie === 1 || b.serie === 6 || b.etapa === 'medio' && b.serie === 1 || r.chance(0.3))) {
    const antes = b.rede;
    b.rede = redeIdeal;
    escrever(v, {
      texto: antes === 'privada'
        ? `O dinheiro em casa apertou e foi preciso trocar a escola particular ${escola(v, 'publica', b.etapa).replace(/^a /, 'pela ').replace(/^o /, 'pelo ').replace(/^uma /, 'por uma ')}.`
        : `Com a casa mais folgada, a família passou a pagar ${escola(v, 'privada', b.etapa)}.`,
      relevancia: 'biografia', tema: 'escola', tom: antes === 'privada' ? 'ruim' : 'neutro'
    });
    // Escola nova: o que era institucional da antiga (o time, o grêmio) acaba agora.
    ajustarAoLugarDeFormacao(v);
  }

  // As matérias do ano: a escola exercita todas; a particular, com mais estrutura.
  estudarMaterias(v, r, (b.rede === 'privada' ? 1.12 : 1) * (b.etapa === 'fundamental1' ? 0.85 : 1));
  if (b.integrado) { const c = cursoOuNulo(b.integrado); if (c?.pratica) for (const [dd, w] of Object.entries(c.pratica) as [Dominio, number][]) praticar(v, r, dd, w * 0.8, 1.1); }
  b.desempenho = calcularDesempenho(v, r, b.rede === 'privada' ? 6 : 0);
  if (b.rede === 'privada' && b.etapa === 'medio') marcarFato(v, 'estudou_privada');
  // A matéria difícil às vezes vira recuperação — textura, não tragédia.
  if (b.etapa !== 'fundamental1' && b.desempenho >= 38) {
    const { fraca } = materiasExtremas(v);
    if (fraca && habilidade(v, fraca) < 30 && r.chance(0.25)) escrever(v, { texto: `Ficou de recuperação em ${NOME_MATERIA[fraca]}, e passou raspando.`, relevancia: 'cotidiano', tema: 'escola', tom: 'ruim' });
  }

  // Muito acima da idade da série: a escola regular encaminha para a EJA (15+ no fundamental, 18+ no médio), à noite,
  // onde se avança por etapas. Antes, uma adulta seguia "repetindo o 4º ano" ano após ano, com "colegas cada vez mais novos".
  if (!b.eja && b.reprovacoes >= 2 && ((b.etapa !== 'medio' && i >= 15) || (b.etapa === 'medio' && i >= 18))) {
    b.eja = true;
    escrever(v, { texto: `Com ${i} anos ${b.etapa === 'medio' ? 'na' : 'no'} ${rotuloSerie(b)}, foi para ${textoLocal(v, 'eja')}, à noite: turma de gente de todas as idades, avançando por etapas.`, relevancia: 'biografia', tema: 'escola' });
  }
  // Reprovação: nunca no 1º ano (progressão continuada), mais comum no fundamental II e médio. Na EJA, rara (as etapas são mais curtas).
  const reprova = b.serie > 1 && (b.eja ? b.desempenho < 26 && r.chance(0.3) : b.desempenho < 38 && r.chance(b.desempenho < 28 ? 0.7 : 0.35));
  if (reprova) {
    b.reprovacoes += 1;
    escrever(v, {
      texto: b.eja ? `Ficou mais um semestre na mesma etapa ${textoLocal(v, 'eja').replace(/^o /, 'do ').replace(/^a /, 'da ')}${b.reprovacoes >= 4 ? ' — o cansaço do dia pesava na aula da noite' : ''}.` : b.reprovacoes === 1 ? `Repetiu ${b.etapa === 'medio' ? 'a' : 'o'} ${rotuloSerie(b)}.`
        : b.reprovacoes === 2 ? `Repetiu de ano pela segunda vez, agora ${b.etapa === 'medio' ? 'na' : 'no'} ${rotuloSerie(b)}.`
          : `${b.reprovacoes}ª reprovação: ${b.etapa === 'medio' ? 'a' : 'o'} ${rotuloSerie(b)} de novo, com colegas cada vez mais novos.`,
      relevancia: b.eja ? 'cotidiano' : 'biografia', tema: 'escola', tom: 'ruim'
    });
    abalar(v, 'a repetência', -6, 3);
    return;
  }

  // Avança uma série
  if (b.etapa === 'fundamental1' || b.etapa === 'fundamental2') {
    if (b.serie >= 9) {
      subir(v, 'fundamental');
      b.etapa = 'medio';
      b.serie = 1;
      subir(v, 'medio_incompleto');
      escrever(v, { texto: `Terminou ${educacaoDaVida(v).fundamental.o} e começou ${educacaoDaVida(v).medio.o} ${em(escola(v, b.rede, 'medio'))}.`, relevancia: 'biografia', tema: 'escola' });
    } else {
      // Na EJA, cada ano vale por dois (as etapas juntam séries).
      b.serie = Math.min(9, b.serie + (b.eja ? 2 : 1));
      if (b.serie >= 6) b.etapa = 'fundamental2';
    }
    return;
  }

  if (b.etapa === 'medio') {
    if (b.serie >= 3) {
      // A turma se espalha: colegas levam a formação (o técnico do integrado) para a vida (`formacao`).
      const inst = instituicaoAtual(v);
      if (inst) aoConcluir(v, inst.ambiente, inst.chave, b.integrado ? cursoOuNulo(b.integrado)?.area : undefined);
      subir(v, 'medio');
      e.basica = undefined;
      marcarFato(v, 'concluiu_medio');
      if (b.integrado) {
        const c = cursoOuNulo(b.integrado);
        if (c) {
          e.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: v.t, instituicao: educacaoDaVida(v).inst.tecnico, rede: 'publica', modalidade: 'presencial' });
          subir(v, 'tecnico');
          v.fatos['concluiu_integrado'] = v.t;
          escrever(v, { texto: `Terminou o médio integrado: saiu com o diploma de ${c.nome.replace(/^Técnico em /, 'técnico em ')}.`, relevancia: 'marco', tema: 'escola', tom: 'bom' });
          marcar(v, 'formacao', `Técnico em ${c.nome.replace(/^Técnico em /, '')}, pelo médio integrado.`, 3);
        }
      }
      escrever(v, {
        texto: `Concluiu ${educacaoDaVida(v).medio.o}${b.reprovacoes > 0 ? `, com ${b.reprovacoes === 1 ? 'uma repetência' : `${b.reprovacoes} repetências`} no caminho` : ''}.`,
        relevancia: 'marco', tema: 'escola', tom: 'bom'
      });
    } else {
      b.serie = Math.min(3, b.serie + (b.eja ? 2 : 1));
    }
  }
}

/**
 * TROCA DE SISTEMA EDUCACIONAL (uma mudança de país). O sistema atual passa
 * a ser o do país novo — a escola, os nomes das etapas, o exame —, e o que
 * se estudou antes vira HISTÓRICO (`historicoEscolar`), sem se perder. A
 * série é reconciliada pela idade e pela etapa (o jogo conta a escola em
 * 9 + 3 anos em todo país: a série de chegada é a equivalente, nunca um
 * recomeço do zero). O que só existe no sistema de lá fica para trás: o
 * técnico integrado de um instituto federal não continua noutro país.
 */
export function trocarDeSistemaEscolar(v: Vida, dePais: string, paraPais: string, desde: number): void {
  if (dePais === paraPais) return;
  const e = v.educacao;
  const b = e.basica;
  (e.historicoEscolar ??= []).push({ pais: dePais, desde, ate: v.t, etapa: b?.etapa, serie: b?.serie, escolaridade: e.escolaridade });
  // As notas de antes (de saves sem o país gravado) eram do sistema que fica para trás: ganham o país agora.
  for (const n of e.enem) n.pais ??= dePais;
  // O que só existe no sistema de lá (o cursinho para uma prova que aqui não há, o estudo para um concurso que aqui
  // não existe) acaba com a mudança.
  const antes = v.rotinas.length;
  // (A mesma regra de `rotinas.existeNoPais`, sem importar as rotinas — a escola é base delas.)
  v.rotinas = v.rotinas.filter(r => !(r.id === 'cursinho' && educacaoDaVida(v).aberto) && !(r.id === 'estudar_concurso' && !perfilDaVida(v).trabalho.concurso));
  if (v.rotinas.length < antes) escrever(v, { texto: 'A preparação que fazia sentido no país de antes (a prova, o concurso) ficou para trás.', relevancia: 'cotidiano', tema: 'estudo' });
  if (!b) return;
  // A rede da escola nova: a mesma conta da casa (a escola particular de lá é outra conta).
  b.rede = redeParaCasa(v);
  if (b.integrado) {
    const c = cursoOuNulo(b.integrado);
    b.integrado = undefined;
    if (c) escrever(v, { texto: `O técnico integrado (${c.nome.replace(/^Técnico em /, '')}) ficou para trás: o ensino de lá não tem esse curso junto.`, relevancia: 'cotidiano', tema: 'escola' });
  }
  const ed = educacaoDaVida(v);
  const lingua = !falaALingua(v);
  // Chegar no meio do caminho, numa língua nova, pesa nas notas do primeiro ano (a adaptação devolve).
  if (lingua) b.desempenho = clamp(b.desempenho - 14);
  else b.desempenho = clamp(b.desempenho - 4);
  const etapa = b.etapa === 'creche' || b.etapa === 'pre' ? 'a educação infantil' : `${b.etapa === 'medio' ? 'a' : 'o'} ${rotuloSerie(b, paraPais)}`;
  escrever(v, { texto: `Na escola nova, ${b.rede === 'publica' ? ed.etapas.publica[b.etapa === 'medio' ? 'medio' : b.etapa === 'creche' ? 'creche' : 'fundamental'] : 'uma escola particular'}, entrou ${etapa.replace(/^o /, 'no ').replace(/^a /, 'na ')}${lingua ? ', numa língua que ainda não era a sua' : ''}.`, relevancia: 'biografia', tema: 'escola', tom: lingua ? 'ruim' : 'neutro' });
}

/** Largar a escola — só por decisão do jogador. */
export function largarEscola(v: Vida): void {
  const b = v.educacao.basica;
  if (!b) return;
  v.educacao.evadiu = true;
  v.educacao.basica = undefined;
  escrever(v, { texto: `Largou a escola no ${rotuloSerie(b)}.`, relevancia: 'marco', tema: 'escola', tom: 'ruim', escolha: true });
}

/** Voltar a estudar (EJA / supletivo) depois de ter largado. */
export function voltarAEstudar(v: Vida): void {
  v.educacao.evadiu = false;
  const esc = v.educacao.escolaridade;
  const etapa = nivelEsc(esc) >= nivelEsc('fundamental') ? 'medio' : 'fundamental2';
  v.educacao.basica = { etapa, serie: etapa === 'medio' ? 1 : 8, rede: 'publica', desempenho: 50, reprovacoes: 0 };
  escrever(v, { texto: `Voltou a estudar à noite, ${textoLocal(v, 'supletivo').replace(/^o /, 'no ').replace(/^a /, 'na ')}.`, relevancia: 'marco', tema: 'escola', tom: 'bom', escolha: true });
}

/* ------------------------------------------------------------------ ENEM */

export const AREAS_ENEM: Materia[] = ['exatas', 'linguagens', 'ciencias', 'humanas'];

/**
 * A nota que a preparação de hoje daria numa área, sem o acaso do dia. É a
 * MESMA conta da prova (`notasEnem` só soma o dia) — e a que Estudos mostra
 * como "onde você está" (`vestibular.estimativaParaCurso`).
 */
export function notaEsperadaArea(v: Vida, a: Materia): number {
  const hist = v.educacao.basica?.desempenho ?? 55;
  const privada = v.educacao.basica?.rede === 'privada' ? 35 : 0;
  const preparo = bonusDoPreparo(v);
  const idadeFora = v.educacao.basica ? 0 : Math.min(40, Math.max(0, idade(v) - 18) * 4);
  const postura = v.educacao.postura === 'dedicada' ? 20 : v.educacao.postura === 'relaxada' ? -20 : 0;
  return 250 + habilidade(v, a) * 4.4 + hist * 1.2 + (v.mente.cognicao - 50) * 1.2 + privada + preparo + postura - idadeFora;
}

/** Nota do ENEM por área: cada matéria vai para um lado, e o dia pesa. */
export function notasEnem(v: Vida, r: Rng): Record<Materia, number> {
  const dia = r.normal() * 25;
  const out = {} as Record<Materia, number>;
  for (const a of AREAS_ENEM) {
    const nota = notaEsperadaArea(v, a) + dia + r.normal() * 30;
    out[a] = Math.round(clamp(nota, 320, 950));
  }
  return out;
}

export function notaEnem(v: Vida, r: Rng): number {
  const n = notasEnem(v, r);
  return Math.round(AREAS_ENEM.reduce((s, a) => s + n[a], 0) / AREAS_ENEM.length);
}

/** As notas que valem AQUI: as do exame do país onde a pessoa mora (a nota do ENEM não abre universidade nos EUA). */
export const notasDaqui = (v: Vida) => { const pais = paisDaVida(v); return v.educacao.enem.filter(x => !x.pais || x.pais === pais); };

/** Nota ponderada para um curso (o sistema de vagas usa os pesos do curso). */
export function notaParaCurso(v: Vida, c: Curso): number {
  const recentes = notasDaqui(v).filter(x => x.t > v.t - 36);
  if (!recentes.length) return 0;
  const pesos = c.pesos ?? {};
  let melhor = 0;
  for (const x of recentes) {
    if (!x.areas) { melhor = Math.max(melhor, x.nota); continue; }
    let soma = 0, total = 0;
    for (const a of AREAS_ENEM) { const w = 1 + (pesos[a] ?? 0); soma += (x.areas[a] ?? x.nota) * w; total += w; }
    melhor = Math.max(melhor, Math.round(soma / total));
  }
  return melhor;
}

export function podeFazerEnem(v: Vida): Veredito {
  const i = idade(v);
  const ed = educacaoDaVida(v);
  // Onde a universidade pública é de acesso aberto (a Argentina, o Uruguai), não há prova para entrar.
  if (ed.aberto) return bloqueio('impossivel', 'Aqui não há prova para entrar na universidade pública: a matrícula é aberta.');
  if (i < 15) return bloqueio('impossivel', `${ed.O} é para quem está terminando ${ed.medio.o}.`);
  const e = v.educacao;
  const noTerceiro = e.basica?.etapa === 'medio' && e.basica.serie >= 3;
  if (!noTerceiro && !temEscolaridade(v, 'medio') && !(e.basica?.etapa === 'medio')) {
    return bloqueio('requisito', `Precisa estar ${ed.medio.no} ou tê-lo concluído.`);
  }
  if (notasDaqui(v).some(x => anoDe(x.t) === anoDe(v.t) || x.t > v.t - 12)) {
    return bloqueio('incompativel', `${ed.O} deste ano já foi feito. A próxima prova é no ano que vem.`);
  }
  return { grau: 'permitido' };
}

export function fazerEnem(v: Vida, r: Rng): number {
  const areas = notasEnem(v, r);
  const nota = Math.round(AREAS_ENEM.reduce((s, a) => s + areas[a], 0) / AREAS_ENEM.length);
  const anterior = notasDaqui(v).reduce((m, x) => Math.max(m, x.nota), 0);
  const ed = educacaoDaVida(v);
  v.educacao.enem.push({ t: v.t, nota, areas, pais: ed.pais, exame: ed.nome });
  const faixa = nota >= 750 ? 'uma nota que abre quase qualquer porta' : nota >= 650 ? 'uma boa nota' : nota >= 520 ? 'uma nota mediana' : 'uma nota baixa';
  const fez = ed.prova ? `Fez ${ed.o}` : `Fechou ${ed.o}`;
  const texto = anterior === 0
    ? `${fez} pela primeira vez: ${nota} — ${faixa}.`
    : nota > anterior ? `${fez} de novo e subiu para ${nota}.` : `${fez} de novo: ${nota}, sem melhorar.`;
  escrever(v, { texto, relevancia: anterior === 0 || nota > anterior + 40 ? 'biografia' : 'cotidiano', tema: 'estudo', tom: nota >= 650 ? 'bom' : nota < 500 ? 'ruim' : 'neutro', escolha: true });
  devolutivaDoEnem(v, areas);
  return nota;
}

export const melhorNotaRecente = (v: Vida) =>
  notasDaqui(v).filter(x => x.t > v.t - 36).reduce((m, x) => Math.max(m, x.nota), 0);

/* ---------------------------------------------------------- Ingresso */

export type Via = 'sisu' | 'privada' | 'prouni' | 'fies' | 'ead' | 'selecao_publica';

export interface OpcaoCurso {
  curso: Curso;
  via: Via;
  modalidade: 'presencial' | 'ead';
  rede: 'publica' | 'privada';
  mensalidade: number;
  veredito: Veredito;
  /** Onde o curso é (outra cidade exige mudança). */
  municipioId: string;
  observacao?: string;
  /** Residência médica: a especialidade desta vaga (cada especialidade é uma seleção própria). */
  especialidade?: EspecialidadeMedica;
}

function temFormacaoNaArea(v: Vida, area: string, nivel?: NivelCurso): boolean {
  return v.educacao.concluidos.some(c => (area === 'qualquer' || c.area === area) && (!nivel || c.nivel === nivel));
}

/** Cotas (Lei 12.711): estudou em escola pública e tem renda per capita baixa. */
export function temCota(v: Vida): boolean {
  // Só onde a lei reserva vagas (no Brasil, a Lei 12.711); o teto é o salário mínimo do país.
  return educacaoDaVida(v).cotas && !temFato(v, 'estudou_privada') && rendaPerCapita(v) <= 1.5 * salarioMinimoDoPais(paisDaVida(v));
}

function requisitoDoCurso(v: Vida, c: Curso): Veredito | null {
  const i = idade(v);
  const e = v.educacao;
  if (e.matricula) return bloqueio('incompativel', `Já está cursando ${nomeDaMatricula(v, e.matricula)}.`);
  if (e.concluidos.some(x => x.cursoId === c.id)) return bloqueio('incompativel', 'Já concluiu este curso.');
  if (c.idadeMin && i < c.idadeMin) return bloqueio('requisito', `A partir dos ${c.idadeMin} anos.`);
  if (c.teste && habilidade(v, c.teste.dominio) < c.teste.minimo) return bloqueio('requisito', `O curso tem prova de habilidade específica, e ainda falta preparo em ${c.teste.dominio === 'musica' ? 'música' : 'interpretação'}.`);
  if (c.nivel === 'livre') {
    if (i < 15) return bloqueio('impossivel', 'Os cursos de qualificação são a partir dos 15.');
    return null;
  }
  if (c.nivel === 'tecnico') {
    if (i < 15) return bloqueio('impossivel', `Curso técnico é a partir ${educacaoDaVida(v).medio.do}.`);
    if (!temEscolaridade(v, 'medio') && !(e.basica?.etapa === 'medio' && e.basica.serie >= 2)) {
      return bloqueio('requisito', `Técnico exige estar no 2º ano ${educacaoDaVida(v).medio.do} ou tê-lo concluído.`);
    }
    return null;
  }
  if (c.nivel === 'superior') {
    if (!temEscolaridade(v, 'medio')) return bloqueio('requisito', `Faculdade exige ${educacaoDaVida(v).medio.completo}.`);
    return null;
  }
  // pós, residência, mestrado, doutorado
  if (!temEscolaridade(v, 'superior')) return bloqueio('requisito', 'Exige graduação concluída.');
  if (c.requerArea && !temFormacaoNaArea(v, c.requerArea, 'superior')) {
    return bloqueio('requisito', `Exige graduação em ${ROTULO_AREA[c.requerArea]}.`);
  }
  if (c.nivel === 'doutorado' && !temFormacaoNaArea(v, 'qualquer', 'mestrado')) return bloqueio('requisito', 'Doutorado exige mestrado.');
  return null;
}

/** Todas as formas de fazer cada curso a partir de onde a pessoa mora. */
export function opcoesDeCurso(v: Vida): OpcaoCurso[] {
  const aqui = v.moradia.municipioId;
  const oferta = nivelDeOferta(aqui);
  const local = economiaLocal(aqui);
  const cota = temCota(v);
  const pc = rendaPerCapita(v);
  const opcoes: OpcaoCurso[] = [];
  // A universidade do país onde se mora: como se entra (prova, acesso aberto, candidatura), quanto a pública
  // cobra, que bolsa e que crédito existem (`mundo/paises`, campo `educacao`).
  const ed = educacaoDaVida(v);
  const bolsa = ed.bolsa;
  const credito = ed.credito;
  const minimo = salarioMinimoDoPais(paisDaVida(v));

  for (const c of CURSOS) {
    const req = requisitoDoCurso(v, c);
    const mens = Math.round(c.mensalidade * local.custo / 10) * 10;
    const add = (o: Omit<OpcaoCurso, 'curso' | 'municipioId'> & { municipioId?: string }) =>
      opcoes.push({ curso: c, municipioId: o.municipioId ?? aqui, ...o, veredito: req ?? o.veredito });

    // Rede pública presencial
    if (c.publica !== null) {
      const existeAqui = oferta >= c.publica;
      const lugar = existeAqui ? aqui : capitalDoEstado(aqui);
      const observacao = existeAqui ? undefined : `Não existe aqui — só em ${nomeLugar(lugar)}. Exige mudar de cidade.`;
      if (c.nivel === 'superior' && ed.aberto) {
        // Acesso aberto (a universidade pública argentina, a Udelar): a matrícula é aberta; o filtro é o primeiro ano.
        const mensP = Math.round(mens * ed.publicaCobra / 10) * 10;
        add({ via: 'sisu', modalidade: 'presencial', rede: 'publica', mensalidade: mensP, veredito: { grau: 'permitido', chance: 0.95 }, municipioId: lugar, observacao: [observacao, 'Acesso aberto: a matrícula é livre; o primeiro ano é que filtra.'].filter(Boolean).join(' ') });
      } else if (c.nivel === 'superior') {
        const nota = notaParaCurso(v, c);
        const corte = c.corte - (cota ? 45 : 0);
        const veredito: Veredito = nota === 0
          ? bloqueio('requisito', `Precisa de uma nota ${ed.do} dos últimos três anos.`)
          : nota >= corte
            ? { grau: 'permitido', chance: Math.min(0.95, 0.55 + (nota - corte) / 120) }
            : nota >= corte - 30
              ? { grau: 'improvavel', chance: 0.15, motivo: `Nota ${nota} abaixo do corte (~${corte}). Pode entrar na lista de espera.` }
              : bloqueio('requisito', `Nota ${nota} muito abaixo do corte (~${corte}${cota ? ', já com cota' : ''}).`);
        // Onde a pública cobra (os EUA, o Reino Unido, o Japão), a mensalidade é uma fração da particular.
        add({ via: 'sisu', modalidade: 'presencial', rede: 'publica', mensalidade: Math.round(mens * ed.publicaCobra / 10) * 10, veredito, municipioId: lugar, observacao: [observacao, cota ? 'Concorre por cota.' : '', ed.publicaDiferida && ed.publicaCobra > 0 ? `A contribuição vai para ${ed.credito?.nome ?? 'o crédito público'}: paga depois de formado.` : ''].filter(Boolean).join(' ') || undefined });
      } else {
        // qualificação e técnico públicos, residência, mestrado, doutorado: processo seletivo próprio
        if (c.nivel === 'mestrado' || c.nivel === 'doutorado') {
          // A seleção da pós tem fatores próprios (histórico, pesquisa, projeto, tentativas): a MESMA conta dá a chance e o que a tela diz.
          const a = avaliacaoDaPos(v, c);
          add({ via: 'selecao_publica', modalidade: 'presencial', rede: 'publica', mensalidade: 0, veredito: { grau: a.chance < 0.3 ? 'improvavel' : 'permitido', chance: a.chance }, municipioId: lugar, observacao: [observacao, a.leitura].filter(Boolean).join(' ') });
        } else if (c.nivel === 'residencia') {
          // Cada especialidade é uma seleção própria: duração e concorrência dela (a mesma conta dá a chance e o que a tela diz).
          const desempenho = ultimoDesempenho(v);
          const feitas = new Set(v.educacao.concluidos.filter(x => x.nivel === 'residencia').map(x => especialidadeDaResidencia(x)));
          for (const esp of LISTA_ESPECIALIDADES) {
            if (feitas.has(esp.id)) continue;
            const { chance, leitura: disputa } = avaliacaoDaResidencia(v, esp, desempenho);
            // Cada especialidade é um item próprio do catálogo (`residencia:<especialidade>`); a matrícula volta ao curso `residencia`.
            opcoes.push({ curso: { ...c, id: `residencia:${esp.id}`, nome: esp.residencia, meses: esp.meses, descricao: esp.descricao }, especialidade: esp.id, via: 'selecao_publica', modalidade: 'presencial', rede: 'publica', mensalidade: 0,
              veredito: req ?? { grau: chance < 0.3 ? 'improvavel' : 'permitido', chance }, municipioId: lugar, observacao: [observacao, disputa].filter(Boolean).join(' ') });
          }
        } else {
          const base = c.nivel === 'livre' ? 0.6 : c.nivel === 'tecnico' ? 0.5 : 0.45;
          const desempenho = v.educacao.basica?.desempenho ?? ultimoDesempenho(v);
          const chance = clamp(base + (desempenho - 60) / 100, 0.08, 0.9);
          add({ via: 'selecao_publica', modalidade: 'presencial', rede: 'publica', mensalidade: 0, veredito: { grau: chance < 0.3 ? 'improvavel' : 'permitido', chance }, municipioId: lugar, observacao });
        }
      }
    }

    // Rede privada presencial
    if (c.privada !== null) {
      const existeAqui = oferta >= c.privada;
      const lugar = existeAqui ? aqui : capitalDoEstado(aqui);
      const observacao = existeAqui ? undefined : `Não existe aqui — só em ${nomeLugar(lugar)}.`;
      add({ via: 'privada', modalidade: 'presencial', rede: 'privada', mensalidade: mens, veredito: { grau: 'permitido', chance: c.id === 'medicina' ? 0.6 : 0.95 }, municipioId: lugar, observacao });
      if (c.nivel === 'superior' && bolsa) {
        // A bolsa pública (no Brasil, o ProUni: bolsa integral para renda per capita até 1,5 SM e ENEM razoável).
        const nota = notaParaCurso(v, c);
        const prouni: Veredito = pc > bolsa.teto * minimo
          ? bloqueio('requisito', `${bolsa!.nome} é para renda familiar de até ${bolsa!.teto.toLocaleString('pt-BR')} salário mínimo por pessoa.`)
          : nota < 450 && !ed.aberto ? bloqueio('requisito', `${bolsa!.nome} exige ${ed.nome} recente com pelo menos 450 pontos.`)
            : { grau: nota >= c.corte - 60 ? 'permitido' : 'improvavel', chance: clamp(0.25 + (nota - (c.corte - 90)) / 200, 0.05, 0.8) };
        add({ via: 'prouni', modalidade: 'presencial', rede: 'privada', mensalidade: 0, veredito: prouni, municipioId: lugar, observacao });
      }
      if (c.nivel === 'superior' && credito) {
        // O crédito estudantil público (no Brasil, o FIES: renda per capita até 3 SM).
        const nota = notaParaCurso(v, c);
        const fies: Veredito = pc > (credito.teto ?? Infinity) * minimo
          ? bloqueio('requisito', `${credito!.nome} é para renda de até ${credito!.teto ?? 0} salários mínimos por pessoa.`)
          : nota < 450 && !ed.aberto ? bloqueio('requisito', `${credito!.nome} exige ${ed.nome} com pelo menos 450 pontos.`)
            : { grau: 'permitido', chance: 0.7 };
        add({ via: 'fies', modalidade: 'presencial', rede: 'privada', mensalidade: 0, veredito: fies, municipioId: lugar, observacao: `A mensalidade vira dívida a pagar depois de formado. ${observacao ?? ''}`.trim() });
      }
    }

    // EAD
    if (c.ead) {
      add({ via: 'ead', modalidade: 'ead', rede: 'privada', mensalidade: Math.round(mens * 0.32 / 10) * 10, veredito: { grau: 'permitido', chance: 0.98 } });
    }
  }
  return opcoes;
}

/** "a universidade" → "na universidade"; "uma faculdade" → "numa faculdade". */
export function em(instituicao: string): string {
  if (instituicao.startsWith('a ')) return 'na ' + instituicao.slice(2);
  if (instituicao.startsWith('o ')) return 'no ' + instituicao.slice(2);
  if (instituicao.startsWith('uma ')) return 'numa ' + instituicao.slice(4);
  if (instituicao.startsWith('um ')) return 'num ' + instituicao.slice(3);
  return 'em ' + instituicao;
}

export function capitalDoEstado(id: string): string {
  const m = municipio(id);
  if (m.pais === 'BR') return CAPITAIS[m.uf] ?? id;
  // Fora do Brasil: a sede da divisão (a capital da província, do estado, da região) — ou, sem ela no catálogo, a maior cidade do país.
  const doPais = cidadesDoPais(m.pais);
  const sede = doPais.find(x => x.uf === m.uf && x.capital) ?? doPais.find(x => x.uf === m.uf && x.perfil === 'metropole');
  return (sede ?? doPais.find(x => x.perfil === 'metropole') ?? doPais.find(x => x.capitalNacional) ?? m).id;
}

const CAPITAIS: Record<string, string> = {
  AC: 'rio-branco-ac', AP: 'macapa-ap', AM: 'manaus-am', PA: 'belem-pa', RO: 'porto-velho-ro', RR: 'boa-vista-rr', TO: 'palmas-to',
  AL: 'maceio-al', BA: 'salvador-ba', CE: 'fortaleza-ce', MA: 'sao-luis-ma', PB: 'joao-pessoa-pb', PE: 'recife-pe', PI: 'teresina-pi', RN: 'natal-rn', SE: 'aracaju-se',
  DF: 'brasilia-df', GO: 'goiania-go', MT: 'cuiaba-mt', MS: 'campo-grande-ms',
  ES: 'vitoria-es', MG: 'belo-horizonte-mg', RJ: 'rio-de-janeiro-rj', SP: 'sao-paulo-sp',
  PR: 'curitiba-pr', RS: 'porto-alegre-rs', SC: 'florianopolis-sc'
};

/** O desempenho no último curso concluído (a graduação guarda o seu; saves antigos sem ele ficam no meio). */
function ultimoDesempenho(v: Vida, niveis?: string[]): number {
  const c = [...v.educacao.concluidos].filter(x => !niveis || niveis.includes(x.nivel)).sort((a, b) => b.tFim - a.tFim)[0];
  return c?.desempenho ?? 58;
}

/* ------------------------------------------------------- A seleção da pós */

export type FatorPos = 'historico' | 'pesquisa' | 'projeto';

/** Anos de preparação do projeto (e da prova) para a pós — esfria se parar por três anos. */
export function preparoDaPos(v: Vida): number {
  const t = v.fatos['pos_preparo_t'];
  if (t === undefined || v.t - t > 36) return 0;
  return Math.min(3, v.fatos['pos_preparo'] ?? 0);
}

/**
 * A seleção de mestrado ou doutorado, com os fatores separados: o histórico
 * (a nota da graduação — ou do mestrado, para o doutorado), a experiência de
 * pesquisa (iniciação, um orientador que escreva a carta), o projeto (a
 * preparação que o jogador escolhe fazer) e as tentativas anteriores (quem
 * já passou pelo processo conhece a banca). A chance, a leitura da tela e a
 * causa de uma rejeição saem desta MESMA conta.
 */
export function avaliacaoDaPos(v: Vida, c: Curso): { chance: number; fatores: Record<FatorPos, number>; obstaculo: FatorPos | 'concorrencia'; leitura: string } {
  const hist = ultimoDesempenho(v, c.nivel === 'doutorado' ? ['mestrado'] : ['superior']);
  const pesquisa = pesoNaPesquisa(v);
  const projeto = preparoDaPos(v);
  const tentativas = objetivoPorId(v, `selecao:${c.id}`)?.tentativas ?? 0;
  const fatores: Record<FatorPos, number> = { historico: (hist - 60) / 90, pesquisa, projeto: projeto * 0.08 };
  const chance = clamp(0.28 + fatores.historico + fatores.pesquisa + fatores.projeto + Math.min(0.09, tentativas * 0.03), 0.06, 0.88);
  // O que mais falta, entre o que se pode trabalhar (o histórico não muda mais): quanto cada fator ainda poderia render.
  const faltas: [FatorPos, number][] = [['projeto', 0.24 - fatores.projeto], ['pesquisa', 0.2 - fatores.pesquisa], ['historico', hist < 58 ? 0.12 : 0]];
  faltas.sort((a, b) => b[1] - a[1]);
  const obstaculo: FatorPos | 'concorrencia' = faltas[0][1] > 0.06 ? faltas[0][0] : 'concorrencia';
  const leitura = obstaculo === 'projeto' ? `O que mais pode ajudar agora: preparar o projeto de pesquisa${projeto ? ' (já começou)' : ''}.`
    : obstaculo === 'pesquisa' ? 'O que mais pesa contra: pouca experiência de pesquisa (iniciação, orientador).'
      : obstaculo === 'historico' ? 'O histórico da graduação pesa contra; o projeto compensa parte.'
        : 'Bem preparado: a seleção agora é concorrência.';
  return { chance, fatores, obstaculo, leitura };
}

/** O motivo de uma rejeição na pós, em palavras (da mesma avaliação). */
function motivoDaPos(o: ReturnType<typeof avaliacaoDaPos>['obstaculo']): string {
  return o === 'projeto' ? 'a banca achou o projeto de pesquisa pouco amadurecido'
    : o === 'pesquisa' ? 'faltou experiência de pesquisa no currículo (iniciação científica, uma carta de orientador)'
      : o === 'historico' ? 'o histórico da graduação pesou na nota final'
        : 'o projeto foi bem avaliado, mas havia mais candidatos bons do que vagas';
}

const INSTITUICOES: Record<Via, (c: Curso, v: Vida, lugar: string) => string> = {
  sisu: (c, v, lugar) => (c.nivel === 'superior' ? `${educacaoDaVida(v).inst.universidade} em ${municipio(lugar).nome}` : educacaoDaVida(v).inst.tecnico),
  selecao_publica: (c, v, lugar) => c.nivel === 'livre' ? `${educacaoDaVida(v).inst.livre} em ${municipio(lugar).nome}` : c.nivel === 'tecnico' ? `${educacaoDaVida(v).inst.tecnico} em ${municipio(lugar).nome}` : c.nivel === 'residencia' ? `o hospital universitário em ${municipio(lugar).nome}` : `${educacaoDaVida(v).inst.universidade} em ${municipio(lugar).nome}`,
  privada: (c, _v, lugar) => c.nivel === 'livre' ? `uma escola de cursos livres em ${municipio(lugar).nome}` : c.nivel === 'tecnico' ? `uma escola técnica particular em ${municipio(lugar).nome}` : `uma faculdade particular em ${municipio(lugar).nome}`,
  prouni: (_c, v, lugar) => `uma faculdade particular em ${municipio(lugar).nome}, com bolsa ${doPrograma(educacaoDaVida(v).bolsa?.nome ?? 'programa público')}`,
  fies: (_c, v, lugar) => `uma faculdade particular em ${municipio(lugar).nome}, com ${oPrograma(educacaoDaVida(v).credito?.nome ?? 'crédito estudantil')}`,
  ead: () => 'uma faculdade a distância'
};

/** Tenta entrar. Devolve o texto do resultado. A mudança de cidade, se houver, é do chamador. */
export function tentarIngresso(v: Vida, r: Rng, o: OpcaoCurso): { entrou: boolean; texto: string } {
  const chance = o.veredito.chance ?? 0.9;
  const nome = o.curso.nome;
  if (!r.chance(chance)) {
    const antes = v.biografia.filter(b => b.texto.includes(nome) && b.tom === 'ruim' && b.tema === 'estudo').length;
    const texto = antes > 0
      ? r.pick([`Tentou ${nome} de novo e ficou de fora outra vez.`, `Mais uma lista de aprovados em ${nome} sem o seu nome.`, `A ${antes + 1}ª tentativa em ${nome} também não deu.`])
      : o.via === 'sisu'
      ? `Não passou em ${nome} ${educacaoDaVida(v).vagas === 'o SISU' ? 'pelo SISU' : 'pela nota'}. A nota ficou perto, mas não o bastante.`
      : o.via === 'prouni' ? `Não conseguiu a bolsa ${doPrograma(educacaoDaVida(v).bolsa?.nome ?? 'programa público')} para ${nome}.`
        : o.via === 'selecao_publica' ? `Não passou na seleção para ${nome}.`
          : `A matrícula em ${nome} não deu certo neste semestre.`;
    marcarFato(v, `tentou_${o.curso.id}_${anoDe(v.t)}`);
    if (o.especialidade) {
      // A residência também diz a causa real (a mesma avaliação que deu a chance) e fica no objetivo.
      const esp = modeloEspecialidade(o.especialidade);
      const a = avaliacaoDaResidencia(v, esp, ultimoDesempenho(v));
      const motivo = MOTIVO_RESIDENCIA[a.obstaculo];
      registrarDevolutiva(v, { tipo: 'selecao', titulo: `Seleção para a residência em ${esp.area}`, texto: `Não passou: ${motivo}.`, passou: false, perto: chance >= 0.4, falta: a.obstaculo, nivel: preparoDaResidencia(v), cursoId: 'residencia' });
      const comMotivo = `Não passou na prova da ${esp.residencia.replace(/^R/, 'r')}: ${motivo}.`;
      escrever(v, { texto: comMotivo, relevancia: 'biografia', tema: 'estudo', tom: 'ruim', escolha: true });
      return { entrou: false, texto: comMotivo };
    }
    if (o.via === 'selecao_publica' && (o.curso.nivel === 'mestrado' || o.curso.nivel === 'doutorado')) {
      // A rejeição diz a causa real (a mesma avaliação que deu a chance) e fica no objetivo.
      const a = avaliacaoDaPos(v, o.curso);
      const motivo = motivoDaPos(a.obstaculo);
      registrarDevolutiva(v, { tipo: 'selecao', titulo: `Seleção para ${nomeDaFormacao(o.curso, areaDaPos(v, o.curso))}`, texto: `Não passou: ${motivo}.`, passou: false, perto: chance >= 0.4, falta: a.obstaculo, nivel: preparoDaPos(v), cursoId: o.curso.id });
      const comMotivo = `${texto.replace(/\.$/, '')}: ${motivo}.`;
      escrever(v, { texto: comMotivo, relevancia: 'biografia', tema: 'estudo', tom: 'ruim', escolha: true });
      return { entrou: false, texto: comMotivo };
    }
    escrever(v, { texto, relevancia: 'biografia', tema: 'estudo', tom: 'ruim', escolha: true });
    return { entrou: false, texto };
  }
  if (o.especialidade) registrarTentativa(v, { id: 'selecao:residencia', titulo: 'Entrar na residência médica', passou: true });
  if (o.via === 'selecao_publica' && (o.curso.nivel === 'mestrado' || o.curso.nivel === 'doutorado')) registrarTentativa(v, { id: `selecao:${o.curso.id}`, titulo: `Entrar no ${nomeDaFormacao(o.curso, areaDaPos(v, o.curso)).replace(/^./, x => x.toLowerCase())}`, passou: true });
  const texto = `${flex(v.eu.tratamento ?? v.eu.genero, 'Aprovado', 'Aprovada')} em ${nome}, ${em(INSTITUICOES[o.via](o.curso, v, o.municipioId))}.`;
  return { entrou: true, texto };
}

/** A matrícula que a aprovação deu, como dado (entra na vida pelo sistema de compromissos). */
export function novaMatricula(v: Vida, o: OpcaoCurso): Extract<NovoCompromisso, { tipo: 'curso' }> {
  return { tipo: 'curso', cursoId: o.especialidade ? 'residencia' : o.curso.id, via: o.via, modalidade: o.modalidade, rede: o.rede, mensalidade: o.mensalidade, municipioId: o.municipioId, instituicao: INSTITUICOES[o.via](o.curso, v, o.municipioId), ...(o.especialidade ? { especialidade: o.especialidade } : {}) };
}

/** A matrícula entra de fato (depois de a vida caber, ou do plano escolhido). */
export function efetivarMatricula(v: Vida, n: Extract<NovoCompromisso, { tipo: 'curso' }>): void {
  const c = curso(n.cursoId);
  if (n.destrancar) {
    const atual = v.educacao.matricula;
    if (atual && atual.cursoId === n.cursoId) { atual.trancado = false; atual.tTrancou = undefined; }
    escrever(v, { texto: `Destrancou a matrícula e voltou para ${c.nome}.`, relevancia: 'biografia', tema: 'estudo', escolha: true });
    return;
  }
  const m: Matricula = {
    cursoId: n.cursoId,
    instituicao: n.instituicao,
    rede: n.rede,
    modalidade: n.modalidade,
    tInicio: v.t,
    mesesRestantes: n.especialidade ? modeloEspecialidade(n.especialidade).meses : c.meses,
    mensalidade: n.mensalidade,
    // A pública de contribuição diferida (HECS-HELP, Student Finance) entra pelo crédito público: nada no mês, dívida depois.
    financiamento: n.via === 'fies' || (n.rede === 'publica' && n.mensalidade > 0 && educacaoDaVida(v).publicaDiferida) ? 'fies' : n.via === 'prouni' ? 'prouni' : undefined,
    desempenho: 60,
    trancado: false,
    municipioId: n.municipioId,
    area: areaDaPos(v, c),
    ...(n.especialidade ? { especialidade: n.especialidade } : {})
  };
  if (n.via === 'fies') m.mensalidade = Math.round(c.mensalidade * economiaLocal(n.municipioId).custo);
  v.educacao.matricula = m;
  // O cursinho acaba com a aprovação (a rotina é a fonte única; a preparação fica para trás).
  v.rotinas = v.rotinas.filter(x => x.id !== 'cursinho');
  if (v.educacao.cursinho !== undefined) v.educacao.cursinho = false;
  ajustarAoLugarDeFormacao(v);
  if (c.nivel === 'superior') subir(v, 'superior_incompleto');
  const g = v.eu.tratamento ?? v.eu.genero;
  const objetivo = v.educacao.objetivo?.cursoId === c.id;
  const tentativas = objetivo ? notasDaqui(v).filter(x => x.t >= v.educacao.objetivo!.t).length : 0;
  escrever(v, { texto: `${flex(g, 'Aprovado', 'Aprovada')} em ${c.nome}, ${em(m.instituicao)}.${objetivo ? (tentativas > 1 ? ` Era o curso que queria — depois de ${tentativas} tentativas.` : ' Era o curso que queria.') : ''}`, relevancia: 'marco', tema: 'estudo', tom: 'bom', escolha: true });
  if (objetivo) v.educacao.objetivo = undefined;
}

/* --------------------------------------------------- Andamento do curso */

export function processarCurso(v: Vida, r: Rng): void {
  const m = v.educacao.matricula;
  if (!m) return;
  if (m.trancado) {
    if (v.t - (m.tTrancou ?? v.t) >= 48) {
      v.educacao.matricula = undefined;
      escrever(v, { texto: `Depois de quatro anos trancada, a matrícula em ${curso(m.cursoId).nome} foi cancelada pela instituição.`, relevancia: 'biografia', tema: 'estudo', tom: 'ruim' });
    }
    return;
  }
  const c = curso(m.cursoId);
  // O curso exercita o que ensina: quem faz Design desenha; quem faz Computação programa.
  for (const [d, w] of Object.entries(c.pratica ?? {}) as [Dominio, number][]) praticar(v, r, d, w * (m.modalidade === 'ead' ? 0.6 : 1), 1.15);
  for (const [d, w] of Object.entries(c.pesos ?? {}) as [Materia, number][]) praticar(v, r, d, Math.min(1, w * 0.3), 1);
  const materias = Object.keys(c.pesos ?? {}) as Materia[];
  m.desempenho = calcularDesempenho(v, r, c.nivel === 'residencia' || c.nivel === 'mestrado' ? 8 : c.nivel === 'livre' ? 10 : 0, materias);
  let atraso = 0;
  if (m.desempenho < 35 && r.chance(0.6)) atraso = 6;
  m.mesesRestantes -= Math.min(12, m.mesesRestantes + atraso) - atraso;
  if (atraso > 0) {
    escrever(v, { texto: `Reprovou em matérias de ${c.nome} e o curso ficou mais comprido.`, relevancia: 'cotidiano', tema: 'estudo', tom: 'ruim' });
  }
  v.mente.cognicao = clamp(v.mente.cognicao + (c.nivel === 'tecnico' ? 1 : 2));
  if (m.mesesRestantes <= 0) concluirCurso(v, r, m, c);
}

/**
 * A área de uma pós-graduação que o catálogo oferece a qualquer formado
 * (especialização, mestrado, doutorado): a da formação em que ela se apoia —
 * o doutorado, a do mestrado; o mestrado e a especialização, a da graduação
 * mais recente. O MBA é de gestão para qualquer um (não herda). Cursos com
 * área própria ficam com ela.
 */
export function areaDaPos(v: Vida, c: Curso): string | undefined {
  if (c.area !== 'qualquer') return c.area;
  if (c.id === 'mba' || !['pos', 'mestrado', 'doutorado'].includes(c.nivel)) return undefined;
  const base = (niveis: NivelCurso[]) => [...v.educacao.concluidos].filter(x => niveis.includes(x.nivel) && x.area !== 'qualquer').sort((a, b) => b.tFim - a.tFim)[0]?.area;
  return (c.nivel === 'doutorado' ? base(['mestrado']) : undefined) ?? base(['superior']) ?? undefined;
}

/** O nome de uma formação com a área que ela carrega: "Doutorado em Nutrição". */
export function nomeDaFormacao(c: Curso, area?: string): string {
  if (!area || area === 'qualquer' || c.area !== 'qualquer' || c.id === 'mba') return c.nome;
  const rotulo = ROTULO_AREA[area as AreaFormacao] ?? area;
  return `${c.nome} em ${rotulo}`;
}

/** O nome do curso em andamento, com a área (para a tela e a biografia). */
export function nomeDaMatricula(v: Vida, m: Matricula = v.educacao.matricula!): string {
  const c = curso(m.cursoId);
  if (m.especialidade) return modeloEspecialidade(m.especialidade).residencia;
  return nomeDaFormacao(c, m.area ?? areaDaPos(v, c));
}

/** A especialidade de uma residência concluída (saves anteriores à escolha: clínica médica, a residência de base). */
export function especialidadeDaResidencia(x: Vida['educacao']['concluidos'][number]): EspecialidadeMedica {
  return x.especialidade ?? 'clinica';
}

function concluirCurso(v: Vida, r: Rng, m: Matricula, c: Curso): void {
  const e = v.educacao;
  { const inst = instituicaoAtual(v); if (inst) aoConcluir(v, inst.ambiente, inst.chave, m.area ?? c.area); }
  e.matricula = undefined;
  const area = m.area ?? areaDaPos(v, c) ?? c.area;
  const esp = m.especialidade ? modeloEspecialidade(m.especialidade) : undefined;
  e.concluidos.push({ cursoId: c.id, nome: esp?.residencia ?? nomeDaFormacao(c, area), nivel: c.nivel, area, tFim: v.t, instituicao: m.instituicao, rede: m.rede, modalidade: m.modalidade, fies: m.financiamento === 'fies' || undefined, desempenho: Math.round(m.desempenho), ...(esp ? { especialidade: esp.id } : {}) });
  // REWORK 4: a formatura fecha a história desta formação (`vidaEstudantil`), com o desempenho de como terminou.
  e.trajetoria = [...(e.trajetoria ?? []), { t: v.t, idade: idade(v), instituicao: m.instituicao, tipo: 'formatura', texto: `Formatura em ${esp?.residencia ?? nomeDaFormacao(c, area)}${m.desempenho >= 80 ? ', entre os melhores da turma' : m.desempenho < 45 ? ', no limite' : ''}.` }].slice(-60);
  const nivelEsc: Partial<Record<NivelCurso, Escolaridade>> = { tecnico: 'tecnico', superior: 'superior', pos: 'pos', residencia: 'pos', mestrado: 'mestrado', doutorado: 'doutorado' };
  const esc = nivelEsc[c.nivel];
  if (esc) subir(v, esc);
  const g = v.eu.genero;
  const nomeF = nomeDaFormacao(c, area);
  const titulo = c.nivel === 'superior' ? `Formou-se em ${c.nome}` : c.nivel === 'livre' ? `Terminou o curso de qualificação: ${minusculaInicial(c.nome.replace(/^Curso de /, ''))}` : c.nivel === 'tecnico' ? `Concluiu o ${c.nome}` : c.nivel === 'residencia' ? `Terminou a residência médica${esp ? ` em ${esp.area}` : ''}` : (c.nivel === 'pos' ? `Concluiu a pós (${nomeF})` : `Concluiu o ${minusculaInicial(nomeF)}`);
  const voltou = idade(v) >= 30 && c.nivel !== 'pos' && c.nivel !== 'mestrado' && c.nivel !== 'doutorado' && c.nivel !== 'residencia';
  escrever(v, { texto: `${titulo}${voltou ? `, aos ${idade(v)}` : ''}.`, relevancia: c.nivel === 'livre' ? 'biografia' : 'marco', tema: 'estudo', tom: 'bom' });
  marcar(v, 'formacao', `${titulo}${voltou ? `, aos ${idade(v)}` : ''}.`, c.nivel === 'livre' ? 1 : c.nivel === 'superior' || c.nivel === 'tecnico' ? 3 : 2);

  // Registros profissionais que vêm com o diploma.
  const lic = v.trabalho.licencas;
  const reg: Record<string, string> = { contabilidade: 'crc', medicina: 'crm', enfermagem: 'coren', psicologia: 'crp', engenharia_civil: 'crea', engenharia: 'crea', agro: 'crea', odontologia: 'cro', fisioterapia: 'crefito', farmacia: 'crf', veterinaria: 'crmv' };
  if (c.nivel === 'superior' && reg[c.area] && !lic.includes(reg[c.area])) lic.push(reg[c.area]);
  if (c.area === 'imoveis' && !lic.includes('creci')) lic.push('creci');
  if (c.area === 'direito' && c.nivel === 'superior') marcarFato(v, 'pode_prestar_oab');

  // FIES vira dívida.
  if (m.financiamento === 'fies') {
    const total = Math.round(m.mensalidade * c.meses * 0.85);
    v.financas.dividas.push({ id: `fies${v.seq++}`, tipo: 'fies', saldo: total, jurosMes: 0.001, parcela: Math.round(total / 120), descricao: `${educacaoDaVida(v).credito?.nome ?? 'Crédito estudantil'} de ${c.nome}` });
    escrever(v, { texto: `A conta ${doPrograma(educacaoDaVida(v).credito?.nome ?? 'crédito estudantil')} chegou: ${moedaCurta(total)} a pagar nos próximos dez anos.`, relevancia: 'cotidiano', tema: 'dinheiro' });
  }
  void g; void r;
}

/** "o X" → "no X"/"do X" (a contração com o artigo do nome). */
const de = (comArtigo: string, p: 'n' | 'd') => comArtigo.replace(/^(o|a) /, (_, a: string) => `${p}${a} `);

/** O exame da ordem (no Brasil, o da OAB; o bar exam nos EUA): tentado uma vez por ano depois de formado em Direito. */
export function processarOab(v: Vida, r: Rng): void {
  if (!temFato(v, 'pode_prestar_oab') || v.trabalho.licencas.includes('oab')) return;
  const des = v.fatos['tentativas_oab'] ?? 0;
  const chance = clamp(0.3 + (v.mente.cognicao - 50) / 120 + (v.educacao.postura === 'dedicada' ? 0.15 : 0), 0.1, 0.85);
  v.fatos['tentativas_oab'] = des + 1;
  if (r.chance(chance)) {
    v.trabalho.licencas.push('oab');
    escrever(v, { texto: des === 0 ? `Passou ${de(textoLocal(v, 'exameDaOrdem'), 'n')} de primeira.` : `Passou ${de(textoLocal(v, 'exameDaOrdem'), 'n')}, na ${des + 1}ª tentativa.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  } else if (des === 0) {
    escrever(v, { texto: `Reprovou na primeira tentativa ${de(textoLocal(v, 'exameDaOrdem'), 'd')}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  }
}
