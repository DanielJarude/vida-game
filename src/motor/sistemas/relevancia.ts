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
import { animaisDoAbrigo, ofertasDeImoveis, ofertasDeVeiculos, type AnimalDoAbrigo, type OfertaImovel, type OfertaVeiculo } from './mercado';
import { disponivel, rendaPropriaMensal, seguranca } from './dinheiro';
import { quartosNecessarios } from './imoveis';
import { podeTerPet, seusPets } from './pets';
import { modeloMoradia, modeloVeiculo } from '../dados/bens';
import { produto, type ProdutoInvestimento } from '../dados/investimentos';
import { condicoesImovel, condicoesVeiculo } from '../acoes';
import { semana } from './semana';

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

/* ------------------------------------------------------------ Vida material */

export const MAX_PRIMARIAS_MATERIAL = { imoveis: 4, veiculos: 4, investimentos: 3, animais: 3 } as const;

/** Renda que conta para a moradia: a sua e a da parceria que mora (ou vai morar) junto. */
function rendaDaMoradia(v: Vida): number {
  const par = parceiro(v);
  return rendaPropriaMensal(v) + (par && (v.vinculos[par.p.id].convivio.includes('casa') || par.vin.romance?.estagio === 'casamento') ? par.p.renda : 0);
}

/**
 * Imóveis para alugar ou comprar, na ordem do que faz sentido: cabe no
 * orçamento, cabe a família, aceita o bicho, tem a ver com o momento.
 */
export function imoveisParaVoce(v: Vida, modo: 'aluguel' | 'venda'): { para: Relevante<OfertaImovel>[]; resto: OfertaImovel[] } {
  const ofertas = ofertasDeImoveis(v, modo);
  const renda = rendaDaMoradia(v);
  const i = idade(v);
  const junto = parceiro(v);
  const precisa = Math.max(quartosNecessarios(v), junto ? 1 : 1);
  const pets = seusPets(v).length > 0;
  const estilo = v.financas.estilo;
  const tem = disponivel(v);
  const cabem = ofertas.map(o => {
    const custo = modo === 'aluguel' ? o.aluguel : condicoesImovel(v, o.preco, true).parcela;
    const acessivel = modo === 'aluguel' ? renda > 0 ? o.aluguel <= renda * 0.35 : tem >= o.aluguel * 8 : podeTentar(condicoesImovel(v, o.preco, true).veredito) || podeTentar(condicoesImovel(v, o.preco, false).veredito);
    return { o, custo, acessivel };
  });
  const maisBarataQueCabe = cabem.filter(x => x.acessivel && x.o.quartos >= precisa && (!pets || x.o.aceitaPet)).sort((a, b) => a.custo - b.custo)[0]?.o;
  const lista: Relevante<OfertaImovel>[] = cabem.map(({ o, acessivel }) => {
    let pontos = 0;
    let motivo = '';
    const dar = (p: number, m: string) => { pontos += p; if (!motivo && p > 0) motivo = m; };
    if (!acessivel) pontos -= 6;
    if (pets && !o.aceitaPet) pontos -= 6;
    if (o === maisBarataQueCabe) dar(2.2, modo === 'aluguel' ? 'O que melhor cabe no orçamento agora.' : 'A compra que cabe na sua renda.');
    if (o.quartos >= precisa && precisa >= 2) dar(1.6, precisa >= 3 ? 'Um quarto para cada filho.' : 'Cabe a família.');
    if (o.quartos > precisa + 1) pontos -= 1.2;
    if (o.quartos < precisa) pontos -= 3;
    if (pets && o.aceitaPet) dar(0.8, 'Aceita animais.');
    if (modo === 'aluguel' && i < 26 && !junto && (o.modeloId === 'republica' || o.modeloId === 'kitnet')) dar(1.4, 'Um bom primeiro lugar só seu.');
    if ((estilo === 'confortavel' || estilo === 'folgado') && modeloMoradia(o.modeloId).padrao >= 4) dar(1, 'Do jeito que você gosta de viver.');
    if (estilo === 'apertado' && modeloMoradia(o.modeloId).padrao <= 2) dar(0.8, 'Simples e barato.');
    if (modo === 'venda' && o.estado === 'reforma') dar(0.4, 'Mais barato — mas vem com obra.');
    if (junto && o.modeloId === 'republica') pontos -= 5;
    if (!motivo) motivo = modo === 'aluguel' ? 'Disponível na cidade.' : 'À venda na cidade.';
    return { item: o, motivo, pontos };
  });
  return primarias(lista, MAX_PRIMARIAS_MATERIAL.imoveis);
}

/** Veículos de um lugar (concessionária, usados, motos), pelo que faz sentido para esta vida. */
export function veiculosParaVoce(v: Vida, lugar: OfertaVeiculo['lugar']): { para: Relevante<OfertaVeiculo>[]; resto: OfertaVeiculo[] } {
  const ofertas = ofertasDeVeiculos(v, lugar);
  const renda = rendaPropriaMensal(v);
  const familia = filhos(v).filter(f => v.vinculos[f.id]?.convivio.includes('casa')).length;
  const primeiro = !v.financas.bens.some(b => b.tipo === 'veiculo');
  const cnh = v.trabalho.licencas.includes('cnh');
  const lista: Relevante<OfertaVeiculo>[] = ofertas.map(o => {
    const m = modeloVeiculo(o.modeloId);
    let pontos = 0;
    let motivo = '';
    const dar = (p: number, t: string) => { pontos += p; if (!motivo && p > 0) motivo = t; };
    const aVista = podeTentar(condicoesVeiculo(v, o.preco, false).veredito);
    const financiado = podeTentar(condicoesVeiculo(v, o.preco, true).veredito);
    if (!aVista && !financiado) pontos -= 6;
    if (m.cnh && !cnh) pontos -= 6;
    if (aVista) dar(1.2, 'Dá para pagar à vista.');
    else if (financiado) dar(0.6, 'Cabe financiado.');
    if (primeiro && o.usado && m.categoria === 'carro' && o.preco <= Math.max(30000, renda * 10)) dar(1.6, 'Um bom primeiro carro.');
    if (familia >= 2 && m.lugares >= 5 && m.conforto >= 3) dar(1.2, 'Cabe a família com folga.');
    if (familia >= 3 && m.lugares >= 7) dar(1.4, 'Sete lugares.');
    if (o.usado && o.estado >= 80) dar(0.8, 'Usado bem conservado.');
    if (o.usado && o.estado < 50) pontos -= 0.8;
    if (m.categoria !== 'carro' && renda > 0 && renda < 3500) dar(1.2, 'Barata de manter.');
    if (m.id === 'carro_luxo' && renda < 25000) pontos -= 2;
    if (!motivo) motivo = o.usado ? 'Usado à venda.' : 'Zero quilômetro.';
    return { item: o, motivo, pontos };
  });
  return primarias(lista, MAX_PRIMARIAS_MATERIAL.veiculos);
}

/**
 * Onde guardar, pelo momento: sem reserva, primeiro a reserva; com reserva e
 * tempo pela frente, algo de longo prazo; perto de parar de trabalhar, renda
 * e proteção. Nunca "sempre ações".
 */
export function investimentosParaVoce(v: Vida): Relevante<ProdutoInvestimento>[] {
  const i = idade(v);
  const seg = seguranca(v);
  const out: Relevante<ProdutoInvestimento>[] = [];
  const add = (id: ProdutoInvestimento['id'], motivo: string, pontos: number) => out.push({ item: produto(id), motivo, pontos });
  if (seg.meses < 6) add('reserva', seg.meses < 1 ? 'Primeiro, uma reserva para emergência: seis meses de despesa.' : 'A reserva ainda não chega a seis meses de despesa.', 5);
  else {
    add('pos_fixado', 'Para o que você vai usar em poucos anos.', 2.5);
    if (i < 55) add('acoes', 'Para dinheiro que pode esperar dez anos ou mais — e aguentar anos ruins.', 2.2);
    if (i < 60) add('inflacao', 'Para um objetivo longo: aposentadoria, o estudo dos filhos.', 2);
    if (i >= 50) add('imobiliario', 'Para quem quer uma renda caindo todo mês.', 2.4);
  }
  return out.sort((a, b) => b.pontos - a.pontos).slice(0, MAX_PRIMARIAS_MATERIAL.investimentos);
}

/** Animais do abrigo, pelo que cabe na casa e na rotina. */
export function animaisParaVoce(v: Vida): { para: Relevante<AnimalDoAbrigo>[]; resto: AnimalDoAbrigo[] } {
  const semana_ = semanaLivre(v);
  const lista: Relevante<AnimalDoAbrigo>[] = animaisDoAbrigo(v).map(a => {
    const d = podeTerPet(v, a.especie, a.porte);
    let pontos = d.grau === 'permitido' ? 2 : d.grau === 'improvavel' ? 0.5 : -5;
    let motivo = d.grau === 'permitido' ? '' : d.motivo ?? '';
    if (a.especie === 'gato' && semana_ < 0.5) { pontos += 1; motivo ||= 'Um gato pede menos tempo que um cachorro.'; }
    if (a.idade >= 6) { pontos += 0.3; motivo ||= 'Os mais velhos são os que menos são adotados.'; }
    if (a.idade === 0) { pontos += 0.4; motivo ||= 'Filhote: dá trabalho, cresce com a casa.'; }
    return { item: a, motivo: motivo || 'Esperando uma casa.', pontos };
  });
  return primarias(lista, MAX_PRIMARIAS_MATERIAL.animais);
}

function semanaLivre(v: Vida): number {
  return semana(v).livre;
}
