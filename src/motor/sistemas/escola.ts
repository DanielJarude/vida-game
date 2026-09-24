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

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { EscolaBasica, Escolaridade, Matricula, NivelCurso, Vida } from '../tipos';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { CURSOS, curso, cursoOuNulo, type Curso, type Materia, ROTULO_AREA } from '../dados/cursos';
import { estudarMaterias, habilidade, materiasExtremas, mediaEscolar, praticar } from './frentes';

export const NOME_MATERIA: Record<string, string> = { exatas: 'matemática', linguagens: 'português', ciencias: 'ciências', humanas: 'história' };
import { marcar } from './marcas';
import type { Dominio } from '../tipos';
import { economiaLocal, municipio, nivelDeOferta, nomeLugar } from '../dados/lugares';
import { bloqueio, type Veredito } from '../plausibilidade';
import { rendaPerCapita } from './domicilio';
import { SALARIO_MINIMO } from './renda';
import { flex } from '../texto';
import { anoDe } from '../tempo';

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

function subir(v: Vida, e: Escolaridade): void {
  if (nivelEsc(e) > nivelEsc(v.educacao.escolaridade)) v.educacao.escolaridade = e;
}

/** A casa consegue pagar escola particular? */
export function redeParaCasa(v: Vida): 'publica' | 'privada' {
  const pc = rendaPerCapita(v);
  return pc > 2600 ? 'privada' : 'publica';
}

export function rotuloSerie(b: EscolaBasica): string {
  if (b.etapa === 'creche') return 'creche';
  if (b.etapa === 'pre') return 'pré-escola';
  if (b.etapa === 'medio') return `${b.serie}ª série do ensino médio`;
  return `${b.serie}º ano do fundamental`;
}

function escola(v: Vida, rede: 'publica' | 'privada', etapa: EscolaBasica['etapa']): string {
  const m = municipio(v.moradia.municipioId);
  if (rede === 'privada') return etapa === 'medio' ? 'um colégio particular' : 'uma escola particular';
  if (etapa === 'medio') return 'a escola estadual do bairro';
  if (etapa === 'creche') return 'a creche municipal';
  return m.perfil === 'pequena' ? 'a escola municipal da cidade' : 'a escola municipal do bairro';
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
  const casa = (v.mente.felicidade - 50) * 0.1 - Math.max(0, v.mente.estresse - 60) * 0.25;
  const trabalhoPesa = v.trabalho.atual ? (v.trabalho.atual.carga === 'integral' ? -10 : -4) : 0;
  const media = materias?.length ? materias.reduce((s, m) => s + habilidade(v, m), 0) / materias.length : mediaEscolar(v);
  const base = 24 + media * 0.5 + (v.mente.cognicao - 50) * 0.18 + d * 0.1 + postura + bonusRede + casa + trabalhoPesa + condicoesDeEstudo(v);
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
    escrever(v, { texto: `Entrou na pré-escola, ${em(escola(v, rede, 'pre'))}.`, relevancia: 'cotidiano', tema: 'escola' });
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

  // Reprovação: nunca no 1º ano (progressão continuada), mais comum no fundamental II e médio.
  const reprova = b.serie > 1 && b.desempenho < 38 && r.chance(b.desempenho < 28 ? 0.7 : 0.35);
  if (reprova) {
    b.reprovacoes += 1;
    escrever(v, {
      texto: b.reprovacoes === 1 ? `Repetiu ${b.etapa === 'medio' ? 'a' : 'o'} ${rotuloSerie(b)}.`
        : b.reprovacoes === 2 ? `Repetiu de ano pela segunda vez, agora ${b.etapa === 'medio' ? 'na' : 'no'} ${rotuloSerie(b)}.`
          : `${b.reprovacoes}ª reprovação: ${b.etapa === 'medio' ? 'a' : 'o'} ${rotuloSerie(b)} de novo, com colegas cada vez mais novos.`,
      relevancia: 'biografia', tema: 'escola', tom: 'ruim'
    });
    v.mente.felicidade = clamp(v.mente.felicidade - 6);
    return;
  }

  // Avança uma série
  if (b.etapa === 'fundamental1' || b.etapa === 'fundamental2') {
    if (b.serie >= 9) {
      subir(v, 'fundamental');
      b.etapa = 'medio';
      b.serie = 1;
      subir(v, 'medio_incompleto');
      escrever(v, { texto: `Terminou o fundamental e começou o ensino médio ${em(escola(v, b.rede, 'medio'))}.`, relevancia: 'biografia', tema: 'escola' });
    } else {
      b.serie += 1;
      if (b.serie === 6) b.etapa = 'fundamental2';
    }
    return;
  }

  if (b.etapa === 'medio') {
    if (b.serie >= 3) {
      subir(v, 'medio');
      e.basica = undefined;
      marcarFato(v, 'concluiu_medio');
      if (b.integrado) {
        const c = cursoOuNulo(b.integrado);
        if (c) {
          e.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: v.t, instituicao: 'o instituto federal', rede: 'publica', modalidade: 'presencial' });
          subir(v, 'tecnico');
          escrever(v, { texto: `Terminou o médio integrado: saiu com o diploma de ${c.nome.replace(/^Técnico em /, 'técnico em ')}.`, relevancia: 'marco', tema: 'escola', tom: 'bom' });
          marcar(v, 'formacao', `Técnico em ${c.nome.replace(/^Técnico em /, '')}, pelo médio integrado.`, 3);
        }
      }
      escrever(v, {
        texto: `Concluiu o ensino médio${b.reprovacoes > 0 ? `, com ${b.reprovacoes === 1 ? 'uma repetência' : `${b.reprovacoes} repetências`} no caminho` : ''}.`,
        relevancia: 'marco', tema: 'escola', tom: 'bom'
      });
    } else {
      b.serie += 1;
    }
  }
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
  escrever(v, { texto: 'Voltou a estudar à noite, no supletivo (EJA).', relevancia: 'marco', tema: 'escola', tom: 'bom', escolha: true });
}

/* ------------------------------------------------------------------ ENEM */

const AREAS_ENEM: Materia[] = ['exatas', 'linguagens', 'ciencias', 'humanas'];

/** Nota do ENEM por área: cada matéria vai para um lado. */
export function notasEnem(v: Vida, r: Rng): Record<Materia, number> {
  const hist = v.educacao.basica?.desempenho ?? 55;
  const privada = v.educacao.basica?.rede === 'privada' ? 35 : 0;
  const cursinho = v.educacao.cursinho ? 40 : 0;
  const idadeFora = v.educacao.basica ? 0 : Math.min(40, Math.max(0, idade(v) - 18) * 4);
  const postura = v.educacao.postura === 'dedicada' ? 20 : v.educacao.postura === 'relaxada' ? -20 : 0;
  const dia = r.normal() * 25;
  const out = {} as Record<Materia, number>;
  for (const a of AREAS_ENEM) {
    const nota = 250 + habilidade(v, a) * 4.4 + hist * 1.2 + (v.mente.cognicao - 50) * 1.2 + privada + cursinho + postura - idadeFora + dia + r.normal() * 30;
    out[a] = Math.round(clamp(nota, 320, 950));
  }
  return out;
}

export function notaEnem(v: Vida, r: Rng): number {
  const n = notasEnem(v, r);
  return Math.round(AREAS_ENEM.reduce((s, a) => s + n[a], 0) / AREAS_ENEM.length);
}

/** Nota ponderada para um curso (o SISU usa os pesos do curso). */
export function notaParaCurso(v: Vida, c: Curso): number {
  const recentes = v.educacao.enem.filter(x => x.t > v.t - 36);
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
  if (i < 15) return bloqueio('impossivel', 'O ENEM é para quem está terminando o ensino médio.');
  const e = v.educacao;
  const noTerceiro = e.basica?.etapa === 'medio' && e.basica.serie >= 3;
  if (!noTerceiro && !temEscolaridade(v, 'medio') && !(e.basica?.etapa === 'medio')) {
    return bloqueio('requisito', 'Precisa estar no ensino médio ou tê-lo concluído.');
  }
  if (e.enem.some(x => anoDe(x.t) === anoDe(v.t) || x.t > v.t - 12)) {
    return bloqueio('incompativel', 'O ENEM deste ano já foi feito. A próxima prova é no ano que vem.');
  }
  return { grau: 'permitido' };
}

export function fazerEnem(v: Vida, r: Rng): number {
  const areas = notasEnem(v, r);
  const nota = Math.round(AREAS_ENEM.reduce((s, a) => s + areas[a], 0) / AREAS_ENEM.length);
  const anterior = v.educacao.enem.reduce((m, x) => Math.max(m, x.nota), 0);
  v.educacao.enem.push({ t: v.t, nota, areas });
  const faixa = nota >= 750 ? 'uma nota que abre quase qualquer porta' : nota >= 650 ? 'uma boa nota' : nota >= 520 ? 'uma nota mediana' : 'uma nota baixa';
  const texto = anterior === 0
    ? `Fez o ENEM pela primeira vez e tirou ${nota} — ${faixa}.`
    : nota > anterior ? `Fez o ENEM de novo e subiu para ${nota}.` : `Fez o ENEM de novo: ${nota}, sem melhorar.`;
  escrever(v, { texto, relevancia: anterior === 0 || nota > anterior + 40 ? 'biografia' : 'cotidiano', tema: 'estudo', tom: nota >= 650 ? 'bom' : nota < 500 ? 'ruim' : 'neutro', escolha: true });
  return nota;
}

export const melhorNotaRecente = (v: Vida) =>
  v.educacao.enem.filter(x => x.t > v.t - 36).reduce((m, x) => Math.max(m, x.nota), 0);

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
}

function temFormacaoNaArea(v: Vida, area: string, nivel?: NivelCurso): boolean {
  return v.educacao.concluidos.some(c => (area === 'qualquer' || c.area === area) && (!nivel || c.nivel === nivel));
}

/** Cotas (Lei 12.711): estudou em escola pública e tem renda per capita baixa. */
export function temCota(v: Vida): boolean {
  return !temFato(v, 'estudou_privada') && rendaPerCapita(v) <= 1.5 * SALARIO_MINIMO;
}

function requisitoDoCurso(v: Vida, c: Curso): Veredito | null {
  const i = idade(v);
  const e = v.educacao;
  if (e.matricula) return bloqueio('incompativel', `Já está cursando ${curso(e.matricula.cursoId).nome}.`);
  if (e.concluidos.some(x => x.cursoId === c.id)) return bloqueio('incompativel', 'Já concluiu este curso.');
  if (c.idadeMin && i < c.idadeMin) return bloqueio('requisito', `A partir dos ${c.idadeMin} anos.`);
  if (c.teste && habilidade(v, c.teste.dominio) < c.teste.minimo) return bloqueio('requisito', `O curso tem prova de habilidade específica, e ainda falta preparo em ${c.teste.dominio === 'musica' ? 'música' : 'interpretação'}.`);
  if (c.nivel === 'livre') {
    if (i < 15) return bloqueio('impossivel', 'Os cursos de qualificação são a partir dos 15.');
    return null;
  }
  if (c.nivel === 'tecnico') {
    if (i < 15) return bloqueio('impossivel', 'Curso técnico é a partir do ensino médio.');
    if (!temEscolaridade(v, 'medio') && !(e.basica?.etapa === 'medio' && e.basica.serie >= 2)) {
      return bloqueio('requisito', 'Técnico exige estar no 2º ano do médio ou tê-lo concluído.');
    }
    return null;
  }
  if (c.nivel === 'superior') {
    if (!temEscolaridade(v, 'medio')) return bloqueio('requisito', 'Faculdade exige ensino médio completo.');
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
      if (c.nivel === 'superior') {
        const nota = notaParaCurso(v, c);
        const corte = c.corte - (cota ? 45 : 0);
        const veredito: Veredito = nota === 0
          ? bloqueio('requisito', 'Precisa de uma nota do ENEM dos últimos três anos.')
          : nota >= corte
            ? { grau: 'permitido', chance: Math.min(0.95, 0.55 + (nota - corte) / 120) }
            : nota >= corte - 30
              ? { grau: 'improvavel', chance: 0.15, motivo: `Nota ${nota} abaixo do corte (~${corte}). Pode entrar na lista de espera.` }
              : bloqueio('requisito', `Nota ${nota} muito abaixo do corte (~${corte}${cota ? ', já com cota' : ''}).`);
        add({ via: 'sisu', modalidade: 'presencial', rede: 'publica', mensalidade: 0, veredito, municipioId: lugar, observacao: [observacao, cota ? 'Concorre por cota.' : ''].filter(Boolean).join(' ') || undefined });
      } else {
        // qualificação e técnico públicos, residência, mestrado, doutorado: processo seletivo próprio
        const base = c.nivel === 'livre' ? 0.6 : c.nivel === 'tecnico' ? 0.5 : c.nivel === 'residencia' ? 0.35 : 0.45;
        const desempenho = v.educacao.basica?.desempenho ?? ultimoDesempenho(v);
        const chance = clamp(base + (desempenho - 60) / 100, 0.08, 0.9);
        add({ via: 'selecao_publica', modalidade: 'presencial', rede: 'publica', mensalidade: 0, veredito: { grau: chance < 0.3 ? 'improvavel' : 'permitido', chance }, municipioId: lugar, observacao });
      }
    }

    // Rede privada presencial
    if (c.privada !== null) {
      const existeAqui = oferta >= c.privada;
      const lugar = existeAqui ? aqui : capitalDoEstado(aqui);
      const observacao = existeAqui ? undefined : `Não existe aqui — só em ${nomeLugar(lugar)}.`;
      add({ via: 'privada', modalidade: 'presencial', rede: 'privada', mensalidade: mens, veredito: { grau: 'permitido', chance: c.id === 'medicina' ? 0.6 : 0.95 }, municipioId: lugar, observacao });
      if (c.nivel === 'superior') {
        // ProUni: bolsa integral para renda per capita até 1,5 SM e ENEM razoável.
        const nota = notaParaCurso(v, c);
        const prouni: Veredito = pc > 1.5 * SALARIO_MINIMO
          ? bloqueio('requisito', 'ProUni é para renda familiar de até 1,5 salário mínimo por pessoa.')
          : nota < 450 ? bloqueio('requisito', 'ProUni exige ENEM recente com pelo menos 450 pontos.')
            : { grau: nota >= c.corte - 60 ? 'permitido' : 'improvavel', chance: clamp(0.25 + (nota - (c.corte - 90)) / 200, 0.05, 0.8) };
        add({ via: 'prouni', modalidade: 'presencial', rede: 'privada', mensalidade: 0, veredito: prouni, municipioId: lugar, observacao });
        // FIES: financiamento, renda per capita até 3 SM.
        const fies: Veredito = pc > 3 * SALARIO_MINIMO
          ? bloqueio('requisito', 'FIES é para renda de até 3 salários mínimos por pessoa.')
          : nota < 450 ? bloqueio('requisito', 'FIES exige ENEM com pelo menos 450 pontos.')
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
  const capital = CAPITAIS[m.uf];
  return capital ?? id;
}

const CAPITAIS: Record<string, string> = {
  AC: 'rio-branco-ac', AP: 'macapa-ap', AM: 'manaus-am', PA: 'belem-pa', RO: 'porto-velho-ro', RR: 'boa-vista-rr', TO: 'palmas-to',
  AL: 'maceio-al', BA: 'salvador-ba', CE: 'fortaleza-ce', MA: 'sao-luis-ma', PB: 'joao-pessoa-pb', PE: 'recife-pe', PI: 'teresina-pi', RN: 'natal-rn', SE: 'aracaju-se',
  DF: 'brasilia-df', GO: 'goiania-go', MT: 'cuiaba-mt', MS: 'campo-grande-ms',
  ES: 'vitoria-es', MG: 'belo-horizonte-mg', RJ: 'rio-de-janeiro-rj', SP: 'sao-paulo-sp',
  PR: 'curitiba-pr', RS: 'porto-alegre-rs', SC: 'florianopolis-sc'
};

function ultimoDesempenho(v: Vida): number {
  return v.fatos['desempenho_ultimo_curso'] !== undefined ? 60 : 55;
}

const INSTITUICOES: Record<Via, (c: Curso, v: Vida, lugar: string) => string> = {
  sisu: (c, _v, lugar) => (c.nivel === 'superior' ? `a universidade federal em ${municipio(lugar).nome}` : `o instituto federal`),
  selecao_publica: (c, _v, lugar) => c.nivel === 'livre' ? `um curso gratuito do Sistema S em ${municipio(lugar).nome}` : c.nivel === 'tecnico' ? `o instituto federal em ${municipio(lugar).nome}` : c.nivel === 'residencia' ? `o hospital universitário em ${municipio(lugar).nome}` : `a universidade federal em ${municipio(lugar).nome}`,
  privada: (c, _v, lugar) => c.nivel === 'livre' ? `uma escola de cursos livres em ${municipio(lugar).nome}` : c.nivel === 'tecnico' ? `uma escola técnica particular em ${municipio(lugar).nome}` : `uma faculdade particular em ${municipio(lugar).nome}`,
  prouni: (_c, _v, lugar) => `uma faculdade particular em ${municipio(lugar).nome}, com bolsa do ProUni`,
  fies: (_c, _v, lugar) => `uma faculdade particular em ${municipio(lugar).nome}, pelo FIES`,
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
      ? `Não passou em ${nome} pelo SISU. A nota ficou perto, mas não o bastante.`
      : o.via === 'prouni' ? `Não conseguiu a bolsa do ProUni para ${nome}.`
        : o.via === 'selecao_publica' ? `Não passou na seleção para ${nome}.`
          : `A matrícula em ${nome} não deu certo neste semestre.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'estudo', tom: 'ruim', escolha: true });
    marcarFato(v, `tentou_${o.curso.id}_${anoDe(v.t)}`);
    return { entrou: false, texto };
  }
  const m: Matricula = {
    cursoId: o.curso.id,
    instituicao: INSTITUICOES[o.via](o.curso, v, o.municipioId),
    rede: o.rede,
    modalidade: o.modalidade,
    tInicio: v.t,
    mesesRestantes: o.curso.meses,
    mensalidade: o.mensalidade,
    financiamento: o.via === 'fies' ? 'fies' : o.via === 'prouni' ? 'prouni' : undefined,
    desempenho: 60,
    trancado: false,
    municipioId: o.municipioId
  };
  if (o.via === 'fies') m.mensalidade = Math.round(o.curso.mensalidade * economiaLocal(o.municipioId).custo);
  v.educacao.matricula = m;
  v.educacao.cursinho = false;
  if (o.curso.nivel === 'superior') subir(v, 'superior_incompleto');
  const g = v.eu.tratamento ?? v.eu.genero;
  const texto = `${flex(g, 'Aprovado', 'Aprovada')} em ${nome}, ${em(m.instituicao)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'estudo', tom: 'bom', escolha: true });
  return { entrou: true, texto };
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

function concluirCurso(v: Vida, r: Rng, m: Matricula, c: Curso): void {
  const e = v.educacao;
  e.matricula = undefined;
  e.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: v.t, instituicao: m.instituicao, rede: m.rede, modalidade: m.modalidade, fies: m.financiamento === 'fies' || undefined });
  const nivelEsc: Partial<Record<NivelCurso, Escolaridade>> = { tecnico: 'tecnico', superior: 'superior', pos: 'pos', residencia: 'pos', mestrado: 'mestrado', doutorado: 'doutorado' };
  const esc = nivelEsc[c.nivel];
  if (esc) subir(v, esc);
  const g = v.eu.genero;
  const titulo = c.nivel === 'superior' ? `Formou-se em ${c.nome}` : c.nivel === 'livre' ? `Terminou o curso de qualificação: ${c.nome.replace(/^Curso de /, '').toLowerCase()}` : c.nivel === 'tecnico' ? `Concluiu o ${c.nome}` : c.nivel === 'residencia' ? 'Terminou a residência médica' : `Concluiu ${c.nivel === 'pos' ? 'a pós' : `o ${c.nome.toLowerCase()}`} (${c.nome})`;
  const voltou = idade(v) >= 30 && c.nivel !== 'pos' && c.nivel !== 'mestrado' && c.nivel !== 'doutorado' && c.nivel !== 'residencia';
  escrever(v, { texto: `${titulo}${voltou ? `, aos ${idade(v)}` : ''}.`, relevancia: c.nivel === 'livre' ? 'biografia' : 'marco', tema: 'estudo', tom: 'bom' });
  marcar(v, 'formacao', `${titulo}${voltou ? `, aos ${idade(v)}` : ''}.`, c.nivel === 'livre' ? 1 : c.nivel === 'superior' || c.nivel === 'tecnico' ? 3 : 2);

  // Registros profissionais que vêm com o diploma.
  const lic = v.trabalho.licencas;
  const reg: Record<string, string> = { medicina: 'crm', enfermagem: 'coren', psicologia: 'crp', engenharia_civil: 'crea', engenharia: 'crea', agro: 'crea', odontologia: 'cro', fisioterapia: 'crefito', farmacia: 'crf', veterinaria: 'crmv' };
  if (c.nivel === 'superior' && reg[c.area] && !lic.includes(reg[c.area])) lic.push(reg[c.area]);
  if (c.area === 'imoveis' && !lic.includes('creci')) lic.push('creci');
  if (c.area === 'direito' && c.nivel === 'superior') marcarFato(v, 'pode_prestar_oab');

  // FIES vira dívida.
  if (m.financiamento === 'fies') {
    const total = Math.round(m.mensalidade * c.meses * 0.85);
    v.financas.dividas.push({ id: `fies${v.seq++}`, tipo: 'fies', saldo: total, jurosMes: 0.001, parcela: Math.round(total / 120), descricao: `FIES de ${c.nome}` });
    escrever(v, { texto: `A conta do FIES chegou: ${Math.round(total / 1000)} mil reais a pagar nos próximos dez anos.`, relevancia: 'cotidiano', tema: 'dinheiro' });
  }
  void g; void r;
}

/** Exame da OAB: tentado uma vez por ano depois de formado em Direito. */
export function processarOab(v: Vida, r: Rng): void {
  if (!temFato(v, 'pode_prestar_oab') || v.trabalho.licencas.includes('oab')) return;
  const des = v.fatos['tentativas_oab'] ?? 0;
  const chance = clamp(0.3 + (v.mente.cognicao - 50) / 120 + (v.educacao.postura === 'dedicada' ? 0.15 : 0), 0.1, 0.85);
  v.fatos['tentativas_oab'] = des + 1;
  if (r.chance(chance)) {
    v.trabalho.licencas.push('oab');
    escrever(v, { texto: des === 0 ? `Passou no Exame da OAB de primeira.` : `Passou no Exame da OAB, na ${des + 1}ª tentativa.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  } else if (des === 0) {
    escrever(v, { texto: 'Reprovou na primeira tentativa do Exame da OAB.', relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  }
}
