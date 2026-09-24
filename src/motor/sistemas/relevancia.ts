/**
 * O que mostrar primeiro: divulgação progressiva.
 *
 * O catálogo continua inteiro — atividades, vagas, cursos —, mas a tela não
 * despeja tudo de uma vez. Estas funções ordenam o que está AO ALCANCE pelo
 * que faz sentido para ESTA vida (o que a pessoa já fez, gosta, sabe, a
 * estrada, a formação, o momento da cabeça e do corpo) e dizem por quê.
 * O resto fica em "explorar", agrupado.
 *
 * Regra das primárias: só entra quem tem motivo (relevância acima de um
 * mínimo), até um teto pequeno. Uma vida sem motivo nenhum recebe poucas
 * ideias variadas, não a lista toda.
 */

import type { Dominio, Vida } from '../tipos';
import type { Veredito } from '../plausibilidade';
import { podeTentar } from '../plausibilidade';
import { idade, filhos, parceiro } from '../nucleo';
import { ROTINAS, atividadeExiste, podeComecarRotina, type ModeloRotina } from './rotinas';
import { BEM_ESTAR, fatoresHumor } from './estado';
import { habilidade } from './frentes';
import { OCUPACOES, ocupacao, type Ocupacao } from '../dados/ocupacoes';
import { degrausAcima, elegibilidade, experienciaNaTrilha, porContaPropria } from './trabalho';
import { cursoOuNulo, type Curso } from '../dados/cursos';
import { opcoesDeCurso, type OpcaoCurso } from './escola';

export interface Relevante<T> { item: T; motivo: string; pontos: number }

/** Teto das opções primárias por tela: poucas, e cada uma com motivo. */
export const MAX_PRIMARIAS = { atividades: 4, vagas: 5, cursos: 4 } as const;
const MINIMO = 1.5;

function primarias<T>(lista: Relevante<T>[], max: number): { para: Relevante<T>[]; resto: T[] } {
  const ordenada = [...lista].sort((a, b) => b.pontos - a.pontos);
  // Variedade: no máximo duas primárias pelo mesmo motivo.
  const porMotivo: Record<string, number> = {};
  const para = ordenada.filter(x => x.pontos >= MINIMO).filter(x => (porMotivo[x.motivo] = (porMotivo[x.motivo] ?? 0) + 1) <= 2).slice(0, max);
  const usados = new Set(para.map(x => x.item));
  return { para, resto: ordenada.filter(x => !usados.has(x.item)).map(x => x.item) };
}

/* ------------------------------------------------------------- Atividades */

const CATEGORIA_MOVIMENTO = new Set(['esporte', 'corpo']);
const MATERIAS_ESCOLA = new Set<Dominio>(['exatas', 'linguagens', 'ciencias', 'humanas']);

/**
 * Atividades que cabem e existem aqui, ordenadas pelo que faz sentido: o que
 * a pessoa já fez e parou, o que ela gosta, o que a cabeça ou o corpo estão
 * pedindo, a fase da vida, a família, o dinheiro.
 */
export function atividadesParaVoce(v: Vida): { para: Relevante<ModeloRotina>[]; resto: ModeloRotina[] } {
  const i = idade(v);
  const possiveis = ROTINAS.filter(m => !v.rotinas.some(r => r.id === m.id) && atividadeExiste(v, m) && podeTentar(podeComecarRotina(v, m.id, 1)));
  const cabeca = v.mente.estresse;
  const humor = v.mente.felicidade;
  const solidao = fatoresHumor(v).some(f => f.id === 'solidao');
  const aperto = v.financas.negativado || v.financas.conta < 0;
  const lista = possiveis.map(m => {
    let pontos = 0;
    let motivo = '';
    let maior = 0;
    const add = (p: number, porque: string) => { if (porque && p > maior) { motivo = porque; maior = p; } pontos += p; };
    const dominios = Object.keys(m.pratica ?? {}) as Dominio[];
    for (const d of dominios) {
      const f = v.caminhos.frentes[d];
      // Matérias da escola não são hobby: "já fez isso" vale para o que se escolheu fazer.
      if (!f || MATERIAS_ESCOLA.has(d)) continue;
      if (f.auge >= 30 && v.t - f.tUltimo >= 12) add(4.5, 'Você já fez isso, e fazia bem.');
      else if (f.interesse >= 60) add(f.interesse / 30, 'Você gosta disso.');
    }
    const bem = BEM_ESTAR[m.id];
    const alivio = typeof bem?.cabeca === 'number' ? bem.cabeca : 0;
    if (cabeca >= 45 && alivio < 0) add(-alivio / 3, 'Ajuda a desanuviar a cabeça.');
    if (cabeca >= 45 && alivio > 0) pontos -= alivio / 3;
    if (humor < 50 && (bem?.humor ?? 0) > 0) add((bem!.humor ?? 0) / 2, 'Anima.');
    if (v.corpo.forma < 40 && CATEGORIA_MOVIMENTO.has(m.categoria) && i >= 12) add(i >= 30 ? 2.5 : 1.5, 'O corpo anda pedindo movimento.');
    if (solidao && m.social && m.social.fluxo >= 0.8) add(2.5, 'Um lugar com gente toda semana.');
    if (aperto && m.renda && m.renda(v, 1) > 0) add(2.5, 'Um dinheiro por fora ajudaria agora.');
    if (m.id === 'tempo_familia' && (filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa')) || parceiro(v))) add(2, 'Tempo com quem mora com você.');
    if (m.id === 'cursinho' && i >= 16 && i <= 20 && !v.educacao.matricula && v.educacao.escolaridade !== 'superior') add(2.5, 'O vestibular está chegando.');
    if (m.id === 'estudar_concurso' && !v.trabalho.atual && i >= 20 && i <= 45) add(1.2, 'Uma porta para quem estuda com constância.');
    // A fase da vida: criança brinca e se mexe; adolescente procura turma.
    if (i < 12 && (m.categoria === 'esporte' || m.categoria === 'arte')) add(1, 'Coisa boa de começar criança.');
    if (i >= 12 && i < 18 && m.social && m.social.fluxo >= 1) add(0.8, 'Onde a turma está.');
    return { item: m, motivo: motivo || m.descricao, pontos };
  });
  const r = primarias(lista, MAX_PRIMARIAS.atividades);
  // Sem motivo nenhum: algumas ideias variadas (uma por categoria), não o catálogo.
  if (r.para.length === 0) {
    const vistas = new Set<string>();
    const ideias = lista.filter(x => (vistas.has(x.item.categoria) ? false : (vistas.add(x.item.categoria), true))).slice(0, 3).map(x => ({ ...x, motivo: x.item.descricao }));
    const usados = new Set(ideias.map(x => x.item));
    return { para: ideias, resto: r.resto.filter(m => !usados.has(m)) };
  }
  return r;
}

/* ------------------------------------------------------------------ Vagas */

const minhaArea = (v: Vida, oc: Ocupacao) => {
  const areas = new Set(v.educacao.concluidos.map(c => c.area));
  return (v.trabalho.experiencia[oc.trilha] ?? 0) >= 12 || !!oc.area?.some(a => areas.has(a)) || (!!oc.habilidade && habilidade(v, oc.habilidade.dominio) >= oc.habilidade.minimo);
};

export interface Vaga { oc: Ocupacao; d: Veredito }

/**
 * Vagas ao alcance, pela sua vida: o próximo degrau da estrada, a sua área
 * (estrada, formação, ofício), o que dá para começar. Um passo atrás no
 * salário não vira sugestão.
 */
export function vagasParaVoce(v: Vida): { para: Relevante<Vaga>[]; resto: Vaga[] } {
  const atual = v.trabalho.atual ? ocupacao(v.trabalho.atual.ocupacaoId) : undefined;
  const acima = new Set(atual ? degrausAcima(atual).map(x => x.id) : []);
  const alcance = OCUPACOES.filter(oc => !oc.concurso && oc.id !== atual?.id).map(oc => ({ oc, d: elegibilidade(v, oc) })).filter(x => podeTentar(x.d));
  const lista = alcance.map(x => {
    let pontos = 0;
    let motivo = '';
    let maior = 0;
    const add = (p: number, porque: string) => { if (porque && p > maior) { motivo = porque; maior = p; } pontos += p; };
    if (acima.has(x.oc.id)) add(4, 'O próximo passo da sua estrada.');
    if (minhaArea(v, x.oc)) add(3, porContaPropria(x.oc) ? 'Você sabe fazer isso.' : 'Na sua área.');
    if (!atual && x.oc.nivel <= 1) add(1.2, 'Para começar.');
    add((x.d.chance ?? 0) * 1.5, '');
    if (atual && x.oc.salario < atual.salario * 0.95 && !acima.has(x.oc.id)) pontos -= 3;
    if (experienciaNaTrilha(v, x.oc.trilha) >= 24 && x.oc.nivel >= (atual?.nivel ?? 0)) add(1, 'Sua experiência conta aqui.');
    return { item: x, motivo: motivo || 'Ao seu alcance.', pontos };
  });
  return primarias(lista, MAX_PRIMARIAS.vagas);
}

/* ----------------------------------------------------------------- Cursos */

export interface CursoOpcoes { curso: Curso; opcoes: { o: OpcaoCurso; indice: number }[]; possivel: boolean }

/** Cursos agrupados, com as vias de entrada (a mesma lista que a matrícula usa). */
export function cursosAgrupados(v: Vida): CursoOpcoes[] {
  const por = new Map<string, { o: OpcaoCurso; indice: number }[]>();
  opcoesDeCurso(v).forEach((o, indice) => { const l = por.get(o.curso.id) ?? []; l.push({ o, indice }); por.set(o.curso.id, l); });
  return [...por.entries()].map(([id, opcoes]) => ({ curso: cursoOuNulo(id)!, opcoes, possivel: opcoes.some(x => podeTentar(x.o.veredito)) }))
    .filter(c => c.curso && !c.opcoes.every(x => x.o.veredito.grau === 'incompativel' && /concluiu/.test(x.o.veredito.motivo ?? '')));
}

/**
 * O próximo passo nos estudos: o nível seguinte da escolaridade, cursos que
 * abrem o próximo degrau da sua área, cursos que exercitam o que você faz
 * bem ou gosta.
 */
export function cursosParaVoce(v: Vida): { para: Relevante<CursoOpcoes>[]; resto: CursoOpcoes[] } {
  const esc = v.educacao.escolaridade;
  const trilhas = Object.entries(v.trabalho.experiencia).filter(([, m]) => m >= 12).map(([t]) => t);
  const areasDaEstrada = new Set(OCUPACOES.filter(oc => trilhas.includes(oc.trilha)).flatMap(oc => oc.area ?? []));
  const lista = cursosAgrupados(v).filter(c => c.possivel).map(c => {
    let pontos = 0;
    let motivo = '';
    let maior = 0;
    const add = (p: number, porque: string) => { if (porque && p > maior) { motivo = porque; maior = p; } pontos += p; };
    const n = c.curso.nivel;
    if (n === 'superior' && ['medio', 'tecnico'].includes(esc)) add(1.5, 'O próximo nível da sua formação.');
    if (n === 'tecnico' && ['medio', 'medio_incompleto'].includes(esc)) add(1.2, 'Formação mais curta, com ofício.');
    if ((n === 'pos' || n === 'mestrado') && esc === 'superior') add(1, 'Depois da graduação.');
    if (areasDaEstrada.has(c.curso.area)) add(3, 'Abre portas na área em que você já trabalha.');
    for (const [d, w] of Object.entries(c.curso.pratica ?? {}) as [Dominio, number][]) {
      const f = v.caminhos.frentes[d];
      if (f && (f.habilidade >= 40 || f.interesse >= 60) && w >= 0.5) add(2.5, 'Combina com o que você faz.');
    }
    for (const [m, w] of Object.entries(c.curso.pesos ?? {}) as [Dominio, number][]) {
      const f = v.caminhos.frentes[m];
      if (f && f.habilidade >= 60 && w >= 2) add(1.5, 'Pesa as matérias em que você vai bem.');
    }
    const melhorChance = Math.max(0, ...c.opcoes.filter(x => podeTentar(x.o.veredito)).map(x => x.o.veredito.chance ?? 0.5));
    pontos += melhorChance;
    return { item: c, motivo: motivo || c.curso.descricao, pontos };
  });
  const r = primarias(lista, MAX_PRIMARIAS.cursos);
  const usados = new Set(r.para.map(x => x.item.curso.id));
  return { para: r.para, resto: cursosAgrupados(v).filter(c => !usados.has(c.curso.id)) };
}
