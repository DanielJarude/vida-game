/**
 * REWORK 12.2 — NEGÓCIOS VIVOS: o que é próprio de cada ramo, decidido pelo dono (ou pelo gestor) e lido nas contas.
 *
 * `empresas` é o esqueleto comum (caixa, distribuição, crise, falência, avaliação). Este módulo é o que faz um
 * restaurante não ser um hotel com outro nome:
 *
 *   RESTAURANTE  conceito, cozinha, insumo, fornecedor, chef, salão, atendimento, pratos da casa — e a NOTA que o
 *                público dá (o que se entrega contra o que se cobra); o prestígio vem devagar e vai depressa
 *   HOTEL        estrelas, público, quartos, serviços, atendimento, estratégia de temporada — e a OCUPAÇÃO, que
 *                responde ao preço, à cidade, ao que se entrega e à estação (o cinco estrelas caro não lota)
 *   CLÍNICA      especialidades (equipamento e profissional), convênio ou particular, equipamento, conformidade
 *                sanitária — a inspeção vem
 *   ACADEMIA     modalidades, equipamentos, instrutores, programas de retenção — a carteira e a evasão
 *   ESTÚDIO      serviços, equipamento que envelhece, técnico de som com nome, créditos (quem gravou ali)
 *   LOJA         segmento (a margem do segmento), estoque (ruptura ou encalhe), fornecedor, variedade, venda online
 *   MUSEU        obras com nome, autenticidade e conservação; exposições temáticas; curador; segurança;
 *                patrocínio; empréstimos (dar e receber); a linha (prestígio × rentabilidade)
 *   ZOOLÓGICO    cada animal com nome e idade, em recintos por habitat com vagas; alimentação, veterinários,
 *                educação, conservação — o bem-estar sai do que se dá a cada um, a lotação pesa
 *
 * Cada decisão muda um estado que entra numa conta (`efeitosDoSetor`) — nada aqui é só texto. O gestor contratado,
 * quando o dono delega, decide o dia a dia do ramo conforme a competência dele (o bom acerta, o fraco descuida) e só
 * com o caixa da empresa. Os sorteios são derivados (`rngDe`): o acaso do resto da vida não muda.
 */

import type { AnimalDoZoo, Empresa, Nivel3, ObraDoMuseu, ProfissionalChave, SetorDaEmpresa, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import { escrever } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { tipoDeEmpresa } from '../dados/empresas';
import {
  ACERVO_INICIAL_ZOO, CONCEITOS, CULINARIAS, ESPECIALIDADES, ESPECIES_ZOO, ESTRELAS, FORNECEDORES, HABITATS, INGREDIENTES, LINHAS_MUSEU, MODALIDADES, MUSEUS_DE_FORA,
  PATROCINADORES, PRATOS, PUBLICOS_HOTEL, RECINTOS_INICIAIS_ZOO, RETENCAO, SEGMENTOS_LOJA, SERVICOS_ESTUDIO, SERVICOS_HOTEL, TEMAS_MUSEU, culinaria, especialidade,
  especieDeZoo, habitat, modalidade, segmentoLoja, servicoEstudio, servicoHotel, temaMuseu
} from '../dados/setores';
import { competenciaDaGestao, conversao, custoLocal, doRamo, gastar, salarioLocal } from './empresas';
import { okDePagar } from './dinheiro';
import { municipio } from '../dados/lugares';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const mil = (x: number) => Math.round(x / 1000) * 1000;
const NOMES_CHAVE: [string, string][] = [['Rodrigo Albuquerque', 'Helena Duarte'], ['Thiago Fontana', 'Camila Rocha'], ['Marcos Vianna', 'Luísa Ferraz'], ['André Kato', 'Paula Nakamura'], ['Bruno Salles', 'Marina Couto'], ['Felipe Arantes', 'Isabela Teles']];

/* ============================================================ o estado do ramo */

/** O estado próprio do ramo (criado na primeira vez, sempre igual para a mesma empresa: vem do id). */
export function garantirSetor(v: Vida, e: Empresa): SetorDaEmpresa {
  const s = (e.setor ??= {});
  const r = rngDe(v.id, e.id, 'setor');
  switch (e.tipo) {
    case 'restaurante':
      s.restaurante ??= { conceito: e.preco === 'alto' ? 'especializado' : e.preco === 'popular' ? 'popular' : 'familiar', culinaria: r.pick(CULINARIAS).id, ingredientes: 2, fornecedor: 'atacado', pratos: [], ambiente: 55, atendimento: 55, prestigio: 20 };
      break;
    case 'hotel':
      s.hotel ??= { estrelas: e.preco === 'alto' ? 4 : e.preco === 'popular' ? 2 : 3, publico: 'lazer', quartos: 60, servicos: [], atendimento: 'padrao', temporada: 'fixa' };
      break;
    case 'clinica':
      s.clinica ??= { especialidades: ['clinica_geral'], atendimento: 'misto', equipamento: 65, conformidade: 70 };
      break;
    case 'academia':
      s.academia ??= { modalidades: ['musculacao'], equipamentos: 65, instrutores: 55, retencao: [] };
      break;
    case 'estudio':
      s.estudio ??= { servicos: ['gravacao'], equipamento: 70, creditos: [] };
      break;
    case 'loja':
      s.loja ??= { segmento: r.pick(SEGMENTOS_LOJA).id, estoque: 2, fornecedor: 'nacional', variedade: 50, online: false, encalhe: 10 };
      break;
    case 'museu':
      if (!s.museu) {
        const valor = e.acervo?.valor ?? 2_000_000;
        s.museu = { linha: 'equilibrada', obras: obrasIniciais(v, e, valor), seguranca: 55 };
      }
      break;
    case 'zoologico':
      if (!s.zoo) s.zoo = zooInicial(v, e);
      sincronizarZoo(e);
      break;
  }
  return s;
}

function obrasIniciais(v: Vida, e: Empresa, valorDoAcervo: number): ObraDoMuseu[] {
  const r = rngDe(v.id, e.id, 'obras');
  const temas = [r.pick(TEMAS_MUSEU), r.pick(TEMAS_MUSEU)];
  const out: ObraDoMuseu[] = [];
  for (let k = 0; k < 8; k++) {
    const tema = temas[k % 2];
    out.push({ id: `${e.id}-o${k}`, nome: r.pick(tema.obras), tema: tema.id, periodo: r.pick(tema.periodos), valor: Math.round(valorDoAcervo * 0.6 / 8 * (0.5 + r.next()) / 1000) * 1000, conservacao: Math.max(20, Math.min(95, (e.acervo?.conservacao ?? 75) + r.int(-12, 8))), exposta: k < 6, autenticidade: 'presumida', origem: 'acervo', ...(r.chance(0.08) ? { falsa: true } : {}) });
  }
  return out;
}

function zooInicial(v: Vida, e: Empresa): NonNullable<SetorDaEmpresa['zoo']> {
  const r = rngDe(v.id, e.id, 'zoo');
  // O zoológico que já existia (save do REWORK 12) começa com os recintos no estado que o bem-estar dele dizia.
  const qualidade = Math.round(Math.max(30, Math.min(95, ((e.zoo?.bemEstar ?? 70) - 35) / 0.45)));
  const recintos = RECINTOS_INICIAIS_ZOO.map(([h, vagas], k) => ({ id: `${e.id}-r${k}`, habitat: h, vagas, qualidade, t: e.tInicio }));
  const animais: AnimalDoZoo[] = [];
  let n = 0;
  for (const [esp, qtd] of ACERVO_INICIAL_ZOO) {
    const x = especieDeZoo(esp)!;
    const rec = recintos.find(q => q.habitat === x.habitat);
    if (!rec) continue;
    for (let k = 0; k < qtd; k++) animais.push(novoAnimal(e, x.id, rec.id, 'acervo', e.tInicio - r.int(1, Math.max(2, Math.round(x.vida * 0.5))) * 12, n++, r));
  }
  return { recintos, animais, alimentacao: 2, veterinarios: 3, educacao: false, memoria: [] };
}

function novoAnimal(e: Empresa, especie: string, recinto: string, origem: AnimalDoZoo['origem'], nasceu: number, n: number, r: Rng, historia?: string): AnimalDoZoo {
  const x = especieDeZoo(especie)!;
  const usados = new Set((e.setor?.zoo?.animais ?? []).filter(a => a.especie === especie).map(a => a.nome));
  const livres = x.nomes.filter(z => !usados.has(z));
  const nome = livres.length ? r.pick(livres) : `${r.pick(x.nomes)} ${['II', 'III', 'IV', 'V'][n % 4]}`;
  return { id: `${e.id}-a${n}-${especie}`, especie, nome, genero: r.chance(0.5) ? 'masculino' : 'feminino', nasceu, saude: 85, origem, recinto, chegou: nasceu > e.tInicio ? nasceu : e.tInicio, ...(historia ? { historia: [historia] } : {}) };
}

/** Os números antigos do zoológico (recintos, espécies, bem-estar) passam a ser lidos do acervo (uma fonte só). */
export function sincronizarZoo(e: Empresa): void {
  const z = e.setor?.zoo;
  if (!z || !e.zoo) return;
  e.zoo.recintos = z.recintos.length;
  e.zoo.especies = new Set(z.animais.map(a => a.especie)).size;
  e.zoo.bemEstar = bemEstarDoZoo(e);
}

/* ============================================================ leituras do ramo */

const delegado = (e: Empresa) => e.papel === 'investidor' || (e.gestao.quem === 'contratada' && e.setor?.delegar !== false);
export const decideOGestor = delegado;

/** Restaurante: a cozinha que se entrega (0..100) — insumo, fornecedor, chef, instalações. */
export function cozinhaDoRestaurante(e: Empresa): number {
  const x = e.setor!.restaurante!;
  const chef = x.chef ? (x.chef.talento - 50) * 0.55 : -8;
  const conc = CONCEITOS[x.conceito];
  const imp = x.fornecedor === 'importador' && conc.exige >= 70 ? 3 : 0;
  return clamp(Math.round(48 + INGREDIENTES[x.ingredientes].qualidade + FORNECEDORES[x.fornecedor].qualidade + imp + chef + (e.qualidade - 60) * 0.25 + x.pratos.length * 2));
}

/** A nota que o público dá (1..5): o que se entrega contra o que o conceito e o preço prometem. */
export function notaDoRestaurante(e: Empresa): number {
  const x = e.setor!.restaurante!;
  const entregue = cozinhaDoRestaurante(e) * 0.55 + x.ambiente * 0.2 + x.atendimento * 0.25;
  const promessa = CONCEITOS[x.conceito].exige + (e.preco === 'alto' ? 7 : e.preco === 'popular' ? -6 : 0);
  return Math.round(clamp(3.2 + (entregue - promessa) / 11, 1, 5) * 10) / 10;
}

/** Hotel: o que se entrega (quartos, instalações, serviços) contra o que as estrelas prometem. */
function entregueDoHotel(e: Empresa): number {
  const h = e.setor!.hotel!;
  const servicos = h.servicos.length * 3 + (h.atendimento === 'personalizado' ? 8 : h.atendimento === 'enxuto' ? -8 : 0);
  return h.quartos * 0.55 + e.qualidade * 0.3 + servicos;
}

/** O bem-estar de cada animal (0..100): o recinto (qualidade e lotação), a comida, o veterinário, o grupo. */
export function bemEstarDoAnimal(e: Empresa, a: AnimalDoZoo): number {
  const z = e.setor!.zoo!;
  const x = especieDeZoo(a.especie)!;
  const rec = z.recintos.find(q => q.id === a.recinto);
  if (!rec) return 20;
  const lotacao = ocupacaoDoRecinto(e, rec.id) / Math.max(1, rec.vagas);
  const grupo = z.animais.filter(b => b.especie === a.especie && b.recinto === a.recinto).length;
  const especialistas = new Set(z.animais.filter(b => especieDeZoo(b.especie)?.especialista).map(b => b.especie)).size;
  const vets = z.veterinarios / Math.max(1, Math.ceil(z.animais.length / 18) + (x.especialista ? Math.ceil(especialistas / 2) : 0));
  const tratadores = e.equipe / Math.max(1, tipoDeEmpresa('zoologico').equipe * Math.max(0.4, z.animais.length / 45));
  return clamp(Math.round(
    rec.qualidade * 0.45 + 32
    - Math.max(0, lotacao - 1) * 60 - (lotacao > 0.9 ? 6 : 0)
    + (z.alimentacao - 2) * 8
    + Math.min(8, (vets - 1) * 10)
    + Math.min(6, (tratadores - 1) * 12)
    - (grupo < x.grupo ? 14 : 0)
    + (z.educacao ? 2 : 0)
    + (a.saude - 70) * 0.2
  ));
}

export const ocupacaoDoRecinto = (e: Empresa, recId: string) => (e.setor?.zoo?.animais ?? []).filter(a => a.recinto === recId).reduce((s, a) => s + (especieDeZoo(a.especie)?.vagas ?? 1), 0);

export function bemEstarDoZoo(e: Empresa): number {
  const z = e.setor?.zoo;
  if (!z || !z.animais.length) return e.zoo?.bemEstar ?? 60;
  return Math.round(z.animais.reduce((s, a) => s + bemEstarDoAnimal(e, a), 0) / z.animais.length);
}

/** O interesse do público pelo acervo: a variedade e o que atrai (um animal a mais da mesma espécie quase não soma). */
export function interesseDoZoo(e: Empresa): number {
  const z = e.setor!.zoo!;
  const por = new Map<string, number>();
  for (const a of z.animais) por.set(a.especie, (por.get(a.especie) ?? 0) + 1);
  let s = 0;
  for (const [esp, n] of por) s += (especieDeZoo(esp)?.atracao ?? 3) * (1 + Math.log2(Math.max(1, n)) * 0.15);
  return s;
}

/** O museu: o que está exposto (os destaques, o que veio emprestado) e a exposição em cartaz. */
function atracaoDoMuseu(v: Vida, e: Empresa): number {
  const m = e.setor!.museu!;
  const k = conversao(v, e);
  const expostas = m.obras.filter(o => o.exposta && !o.fora);
  const valor = expostas.reduce((s, o) => s + o.valor / k * (0.6 + o.conservacao / 250), 0);
  const cedidas = (v.financas.colecao ?? []).filter(c => c.emprestadaA === e.id).reduce((s, c) => s + c.valor / k, 0);
  return valor + cedidas;
}

/* ============================================================ os efeitos nas contas */

export interface EfeitosDoSetor {
  /** Multiplicadores sobre a procura, o tíquete, o custo variável, a capacidade e o apoio. */
  procura: number;
  ticket: number;
  variavel: number;
  capacidade: number;
  apoio: number;
  /** Custos fixos próprios do ramo (o chef, os serviços, os recintos), por ano, nos preços da cidade da empresa. */
  fixos: { rotulo: string; valor: number }[];
  /** O que a casa entrega (desloca o alvo da reputação) e o teto da reputação no ramo. */
  reputacao: number;
  teto: number;
  /** Academia: o que tira (ou põe) na evasão. */
  evasao: number;
}

const NEUTRO = (): EfeitosDoSetor => ({ procura: 1, ticket: 1, variavel: 1, capacidade: 1, apoio: 1, fixos: [], reputacao: 0, teto: 82, evasao: 0 });

const FAIXA_TICKET = { popular: 0.85, medio: 1, alto: 1.2 } as const;
const FAIXA_PROCURA = { popular: 1.12, medio: 1, alto: 0.84 } as const;

export function efeitosDoSetor(v: Vida, e: Empresa): EfeitosDoSetor {
  const ef = NEUTRO();
  if (!e.setor) return ef;
  const t = tipoDeEmpresa(e.tipo);
  const s = salarioLocal(e.municipioId);
  const c = custoLocal(e.municipioId);
  const div = e.setor.divulgacao ?? 20;
  ef.procura *= (0.94 + div / 400) * (1 + (e.setor.mercado ?? 0));
  const baseTicket = t.ticket[e.preco];
  const baseProcura = t.procura[e.preco];
  if (e.setor.restaurante) {
    const x = e.setor.restaurante;
    const conc = CONCEITOS[x.conceito];
    const nota = notaDoRestaurante(e);
    ef.ticket = t.ticket.medio * conc.ticket * FAIXA_TICKET[e.preco] / baseTicket;
    const alto = conc.exige >= 70;
    ef.procura *= conc.procura * FAIXA_PROCURA[e.preco] / baseProcura * (0.62 + nota * 0.12) * (1 + (x.prestigio - 20) / 100 * (alto ? 0.55 : 0.15)) / culinaria(x.culinaria).concorrencia * (1 + x.pratos.length * 0.025);
    ef.variavel = INGREDIENTES[x.ingredientes].custo * FORNECEDORES[x.fornecedor].custo * culinaria(x.culinaria).insumo * (alto ? 1.12 : 1);
    if (x.chef) ef.fixos.push({ rotulo: `Chef (${x.chef.nome})`, valor: x.chef.salario * 12 * s });
    ef.reputacao = (nota - 3) * 8 + x.prestigio / 12;
    ef.teto = 55 + conc.teto * 0.4;
  } else if (e.setor.hotel) {
    const h = e.setor.hotel;
    const est = ESTRELAS[h.estrelas];
    const pub = PUBLICOS_HOTEL[h.publico];
    const valor = entregueDoHotel(e) - est.exige;
    const atrai = h.servicos.reduce((x, id) => x + (servicoHotel(id)?.atrai[h.publico] ?? 0), 0);
    const temporada = h.temporada === 'dinamica' ? { o: 0.45, d: 0.97 } : h.temporada === 'pacotes' ? { o: 0.6, d: 0.93 } : { o: 0, d: 1 };
    // A estação: quem depende de turismo vê os quartos esvaziarem fora de época; a estratégia recupera parte disso.
    const sazonal = 1 + pub.sazonal * 0.35 * (temporada.o - 0.3);
    const extra = h.servicos.reduce((x, id) => x + (servicoHotel(id)?.ticket ?? 0), 0);
    ef.ticket = t.ticket.medio * est.diaria * ({ popular: 0.8, medio: 1, alto: 1.3 } as const)[e.preco] * temporada.d * (1 + extra) / baseTicket;
    // Quanto mais cara a diária para o que se entrega, menos gente — e o segmento de luxo é pequeno em qualquer cidade.
    const preco = ({ popular: 1.25, medio: 1, alto: 0.68 } as const)[e.preco] / baseProcura;
    ef.procura *= est.procura * preco * (1 + atrai) * clamp(1 + valor / 70, 0.45, 1.3) * sazonal * (h.publico === 'negocios' ? 0.9 + (c - 1) * 0.3 : 1);
    ef.fixos.push(...h.servicos.map(id => servicoHotel(id)).filter(Boolean).map(x => ({ rotulo: x!.nome, valor: x!.anual * e.unidades * c })));
    if (h.temporada === 'pacotes') ef.fixos.push({ rotulo: 'Pacotes e agências', valor: 160000 * e.unidades * c });
    ef.fixos.push({ rotulo: 'Equipe a mais (estrelas e atendimento)', valor: e.equipe * t.salario * 12 * s * (est.equipe * (h.atendimento === 'personalizado' ? 1.22 : h.atendimento === 'enxuto' ? 0.85 : 1) - 1) });
    ef.reputacao = valor / 5;
  } else if (e.setor.clinica) {
    const x = e.setor.clinica;
    const esps = x.especialidades.map(especialidade).filter(Boolean) as typeof ESPECIALIDADES;
    const procura = esps.reduce((a, b) => a + b.procura, 0);
    const ticketMedio = esps.reduce((a, b) => a + b.ticket * b.procura, 0) / Math.max(0.1, procura);
    const at = { convenios: { p: 1.45, t: 0.62 }, misto: { p: 1, t: 1 }, particular: { p: 0.6, t: 1.5 } }[x.atendimento];
    const particulares = esps.filter(z => z.particular).length;
    ef.procura *= procura * at.p * (0.88 + x.equipamento / 550) * (x.atendimento === 'convenios' ? 1 - particulares * 0.05 : 1);
    ef.ticket = ticketMedio * at.t;
    ef.capacidade = 0.82 + esps.length * 0.18;
    ef.fixos.push(...esps.filter(z => z.profissional).map(z => ({ rotulo: `Profissional de ${z.nome.toLowerCase()}`, valor: z.profissional * 12 * s })));
    if (x.atendimento === 'convenios') ef.fixos.push({ rotulo: 'Glosas e faturamento de convênios', valor: 90000 * c });
    ef.reputacao = (x.equipamento - 60) / 6 + (x.conformidade - 60) / 8;
  } else if (e.setor.academia) {
    const x = e.setor.academia;
    const ms = x.modalidades.map(modalidade).filter(Boolean) as typeof MODALIDADES;
    ef.procura *= ms.reduce((a, b) => a + b.procura, 0) * (0.783 + x.equipamentos / 300) / (1 + Math.max(0, ms.length - 4) * 0.05);
    ef.ticket = 1 + ms.reduce((a, b) => a + b.ticket, 0);
    ef.capacidade = 0.92 + ms.length * 0.08 + (x.modalidades.includes('natacao') ? 0.15 : 0);
    ef.fixos.push(...ms.filter(m => m.anual).map(m => ({ rotulo: m.nome, valor: m.anual * e.unidades * c })));
    ef.fixos.push(...x.retencao.map(id => RETENCAO.find(z => z.id === id)!).filter(Boolean).map(z => ({ rotulo: z.nome, valor: z.anual * e.unidades * c })));
    if (x.instrutores > 55) ef.fixos.push({ rotulo: 'Instrutores (qualificação)', valor: (x.instrutores - 55) * 1400 * e.unidades * s });
    ef.evasao = ms.reduce((a, b) => a + b.evasao, 0) + x.retencao.reduce((a, id) => a + (RETENCAO.find(z => z.id === id)?.evasao ?? 0), 0) - (x.instrutores - 50) / 900 - (x.equipamentos - 60) / 1500;
    ef.reputacao = (x.equipamentos - 60) / 6 + (x.instrutores - 55) / 5;
  } else if (e.setor.estudio) {
    const x = e.setor.estudio;
    const ss = x.servicos.map(servicoEstudio).filter(Boolean) as typeof SERVICOS_ESTUDIO;
    const tec = x.tecnico?.talento ?? 45;
    const usaveis = ss.filter(z => !z.exige || tec >= z.exige);
    ef.procura *= usaveis.reduce((a, b) => a + b.procura, 0) * (0.7 + x.equipamento / 230) * (1 + Math.min(0.25, x.creditos.length * 0.025));
    ef.ticket = (1 + usaveis.reduce((a, b) => a + b.ticket * b.procura, 0) / Math.max(1, usaveis.reduce((a, b) => a + b.procura, 0))) * (0.865 + tec / 330);
    ef.capacidade = 0.92 + ss.length * 0.08;
    if (x.tecnico) ef.fixos.push({ rotulo: `Técnico de som (${x.tecnico.nome})`, valor: x.tecnico.salario * 12 * s });
    ef.reputacao = (x.equipamento - 60) / 5 + (tec - 50) / 5 + Math.min(8, x.creditos.length);
  } else if (e.setor.loja) {
    const x = e.setor.loja;
    const seg = segmentoLoja(x.segmento);
    const forn = { nacional: { c: 1, v: 0 }, importador: { c: 1.07, v: 12 }, direto: { c: 0.93, v: -6 } }[x.fornecedor];
    const estoque = { 1: 0.9, 2: 1, 3: 1.07 }[x.estoque];
    ef.procura *= seg.procura * (0.75 + (x.variedade + forn.v) / 200) * estoque * (x.online ? 1.16 : 1) * (1 - Math.max(0, x.encalhe - 12) / 300);
    ef.ticket = seg.ticket;
    ef.capacidade = Math.max(1, seg.procura);
    ef.variavel = seg.variavel * forn.c / t.variavel;
    if (x.online) ef.fixos.push({ rotulo: 'Loja online (plataforma, fotos, frete)', valor: 120000 * c });
    if (x.encalhe > 12) ef.fixos.push({ rotulo: 'Estoque parado (capital empatado)', valor: (x.encalhe - 12) * 1500 * e.unidades * c });
    ef.reputacao = (x.variedade - 50) / 8 - x.encalhe / 12;
  } else if (e.setor.museu) {
    const m = e.setor.museu;
    const lin = LINHAS_MUSEU[m.linha];
    const atr = atracaoDoMuseu(v, e);
    const expo = m.exposicao && v.t < m.exposicao.ate ? 1 + m.exposicao.qualidade / 160 : 1;
    const emprestadas = m.obras.filter(o => o.origem === 'emprestimo' && o.exposta).length;
    ef.procura *= (0.75 + Math.min(1.3, atr / Math.max(1, t.capital * 0.25)) * 0.4) * expo * lin.procura * (1 + emprestadas * 0.04);
    ef.ticket = lin.ticket;
    ef.apoio = lin.apoio;
    if (m.curador) ef.fixos.push({ rotulo: `Curadoria (${m.curador.nome})`, valor: m.curador.salario * 12 * s });
    if (m.seguranca > 30) ef.fixos.push({ rotulo: 'Segurança do acervo', valor: (m.seguranca - 30) * 3000 * c });
    ef.reputacao = lin.reputacao + (m.curador ? (m.curador.talento - 50) / 6 : -4) + Math.min(10, m.obras.filter(o => o.exposta && o.autenticidade === 'verificada').length * 1.5);
    ef.teto = m.linha === 'comercial' ? 70 : 90;
  } else if (e.setor.zoo) {
    const z = e.setor.zoo;
    const bem = bemEstarDoZoo(e);
    // O público vem pela variedade e pelo que atrai; o bem-estar ruim afasta (e a imprensa ajuda). Lotar não traz ninguém.
    ef.procura *= (0.5 + Math.min(1.4, interesseDoZoo(e) / 100) * 0.55) * (0.55 + bem / 220) * (z.educacao ? 1.06 : 1);
    ef.fixos = custosDoZoo(v, e).map(x => ({ ...x }));
    ef.reputacao = (bem - 60) / 3 + (z.educacao ? 3 : 0);
    ef.apoio = (0.4 + bem / 250) * (e.zoo?.conservacao ? 1.15 : 1) * (z.educacao ? 1.06 : 1);
  }
  return ef;
}

/** O que o acervo do zoológico custa por ano (substitui a conta por recinto do REWORK 12). */
export function custosDoZoo(_v: Vida, e: Empresa): { rotulo: string; valor: number }[] {
  const z = e.setor!.zoo!;
  const c = custoLocal(e.municipioId);
  const s = salarioLocal(e.municipioId);
  const comida = z.animais.reduce((x, a) => x + (especieDeZoo(a.especie)?.custo ?? 5000), 0) * ({ 1: 0.75, 2: 1, 3: 1.3 } as const)[z.alimentacao] * c;
  const recintos = z.recintos.reduce((x, q) => x + q.vagas * habitat(q.habitat).manutencao, 0) * c;
  return [
    { rotulo: 'Alimentação e enriquecimento dos animais', valor: comida },
    { rotulo: 'Manutenção dos recintos', valor: recintos },
    { rotulo: 'Veterinários', valor: z.veterinarios * 16000 * 12 * s },
    ...(z.educacao ? [{ rotulo: 'Programa educativo', valor: 280000 * c }] : []),
    ...(e.zoo?.conservacao ? [{ rotulo: 'Programa de conservação', valor: 600000 * c }] : [])
  ];
}

/* ============================================================ o ano do ramo */

/** O ano próprio do ramo (depois das contas): a nota, o prestígio, a ocupação, os animais, as obras, a inspeção. */
export function anoDoSetor(v: Vida, e: Empresa, publico: number): string | undefined {
  const s = garantirSetor(v, e);
  const r = rngDe(v.id, e.id, 'ano-setor', v.t);
  if (delegado(e)) decidirPeloGestor(v, e, r);
  s.divulgacao = clamp(Math.round((s.divulgacao ?? 20) * 0.75));
  // O mercado do negócio anda devagar e não volta sozinho para o meio: o bairro que esvazia, a moda que vira.
  s.mercado = Math.round(Math.max(-0.35, Math.min(0.3, (s.mercado ?? 0) * 0.92 + r.normal() * 0.07)) * 100) / 100;
  let nota: string | undefined;
  if (s.restaurante) nota = anoDoRestaurante(v, e, r);
  else if (s.hotel) { const h = s.hotel; h.ocupacao = Math.round(publico / Math.max(1, 60 * 365 * e.unidades) * 100) / 100; h.quartos = clamp(h.quartos - 2); h.diaria = Math.round(tipoDeEmpresa('hotel').ticket.medio * ESTRELAS[h.estrelas].diaria * custoLocal(e.municipioId) * conversao(v, e)); }
  else if (s.clinica) nota = anoDaClinica(v, e, r);
  else if (s.academia) { s.academia.equipamentos = clamp(s.academia.equipamentos - 3); s.academia.evasao = Math.round(clamp(0.42 - e.qualidade / 400 + efeitosDoSetor(v, e).evasao, 0.12, 0.6) * 100) / 100; }
  else if (s.estudio) nota = anoDoEstudio(v, e, r);
  else if (s.loja) nota = anoDaLoja(v, e, r);
  else if (s.museu) nota = anoDoMuseu(v, e, r);
  else if (s.zoo) nota = anoDoZoo(v, e, r);
  return nota;
}

function anoDoRestaurante(v: Vida, e: Empresa, r: Rng): string | undefined {
  const x = e.setor!.restaurante!;
  const conc = CONCEITOS[x.conceito];
  let nota: string | undefined;
  x.ambiente = clamp(x.ambiente - 2);
  x.atendimento = clamp(x.atendimento - 2 + (e.equipe >= tipoDeEmpresa('restaurante').equipe * conc.equipe * e.unidades ? 1 : -3));
  if (x.chef) x.chef.talento = clamp(x.chef.talento + (r.chance(0.3) ? 1 : 0));
  const n = Math.round(clamp(notaDoRestaurante(e) + r.normal() * 0.25, 1, 5) * 10) / 10;
  x.nota = n;
  // O prestígio vem devagar (anos de nota alta) e vai depressa (um ano ruim já pesa).
  if (n >= 4.3) x.prestigio = Math.min(conc.teto, x.prestigio + Math.round(2 + (n - 4.3) * 8));
  else if (n < 3.4) x.prestigio = clamp(x.prestigio - Math.round(4 + (3.4 - n) * 6));
  else x.prestigio = clamp(x.prestigio - 1);
  const antes = (x.avaliacoes ?? [])[(x.avaliacoes ?? []).length - 1]?.nota;
  (x.avaliacoes ??= []).push({ t: v.t, nota: n, texto: textoDaAvaliacao(e, n, r) });
  if (x.avaliacoes.length > 6) x.avaliacoes.splice(0, x.avaliacoes.length - 6);
  if (antes !== undefined && n <= antes - 0.8) nota = `As avaliações despencaram (${antes.toFixed(1)} → ${n.toFixed(1)}): ${x.avaliacoes[x.avaliacoes.length - 1].texto}`;
  if (x.prestigio >= 80 && conc.exige >= 70 && !(e.historia ?? []).some(h => /guia/.test(h.texto))) {
    (e.historia ??= []).push({ t: v.t, texto: 'Entrou no guia gastronômico mais respeitado do país.' });
    escrever(v, { texto: `${e.nome} entrou no guia gastronômico mais respeitado do país. Lista de espera de semanas.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    nota = 'Entrou no guia gastronômico: lista de espera de semanas.';
  }
  // A falta de insumo do fornecedor: o cardápio pela metade por uns meses (já pesou na procura deste ano).
  if (r.chance(FORNECEDORES[x.fornecedor].falta)) {
    e.reputacao = clamp(e.reputacao - 4);
    nota = nota ?? `O ${FORNECEDORES[x.fornecedor].nome.toLowerCase()} falhou por semanas: pratos fora do cardápio, cliente reclamando.`;
  }
  return nota;
}

function textoDaAvaliacao(e: Empresa, n: number, r: Rng): string {
  const x = e.setor!.restaurante!;
  const cozinha = cozinhaDoRestaurante(e);
  const caro = CONCEITOS[x.conceito].exige + (e.preco === 'alto' ? 7 : 0) - cozinha;
  if (n >= 4.5) return r.pick(['"Vale cada centavo."', '"O melhor da cidade no que se propõe."', '"Voltaria amanhã."']);
  if (n >= 3.8) return r.pick(['"Muito bom; o atendimento podia ser mais rápido."', '"Comida honesta, lugar agradável."']);
  if (caro > 15) return r.pick(['"Caro demais para o que entrega."', '"Preço de restaurante fino, prato de lanchonete."']);
  if (x.atendimento < 40) return '"Esperamos quarenta minutos e ninguém se desculpou."';
  if (x.ambiente < 40) return '"A comida até vai, mas o salão está caindo aos pedaços."';
  return n < 2.6 ? r.pick(['"Não volto."', '"Comida fria e sem graça."']) : '"Nada de especial."';
}

function anoDaClinica(v: Vida, e: Empresa, r: Rng): string | undefined {
  const x = e.setor!.clinica!;
  x.equipamento = clamp(x.equipamento - 3);
  x.conformidade = clamp(x.conformidade - (e.gestao.quem === 'contratada' && competenciaDaGestao(v, e) < 45 ? 6 : 3));
  if (!r.chance(0.28)) return undefined;
  x.tInspecao = v.t;
  const c = custoLocal(e.municipioId) * conversao(v, e);
  if (x.conformidade < 30) {
    e.estado = 'interditada';
    e.caixa -= Math.round(180000 * c);
    e.reputacao = clamp(e.reputacao - 18);
    escrever(v, { texto: `A vigilância sanitária interditou ${e.nome}: equipamento sem manutenção, protocolos vencidos. Multa e portas fechadas até regularizar.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    return 'Interditada pela vigilância sanitária.';
  }
  if (x.conformidade < 50) { e.caixa -= Math.round(60000 * c); return 'A vigilância sanitária passou e deixou multa e prazo.'; }
  return 'A vigilância sanitária passou: tudo em ordem.';
}

function anoDoEstudio(v: Vida, e: Empresa, r: Rng): string | undefined {
  const x = e.setor!.estudio!;
  x.equipamento = clamp(x.equipamento - 3);
  // Uma proposta: alguém conhecido quer gravar ali — com desconto, pelo nome que deixa.
  if (!x.proposta && r.chance(0.18 + e.reputacao / 400)) {
    x.proposta = { t: v.t, artista: r.pick(['uma cantora em ascensão', 'uma banda que lotou o último festival', 'um rapper com milhões de ouvintes', 'um compositor premiado', 'uma orquestra de câmara']), desconto: r.pick([0.3, 0.5, 0.7]) };
    return `Proposta: ${x.proposta.artista} quer gravar aqui — com ${Math.round(x.proposta.desconto * 100)}% de desconto.`;
  }
  if (x.proposta && v.t - x.proposta.t >= 12) delete x.proposta;
  return undefined;
}

function anoDaLoja(v: Vida, e: Empresa, r: Rng): string | undefined {
  const x = e.setor!.loja!;
  const seg = segmentoLoja(x.segmento);
  // O estoque que não gira encalha: mais no estoque amplo, mais no segmento que envelhece (eletrônico, moda) ou estraga.
  const sobe = ({ 1: 0, 2: 2, 3: 8 } as const)[x.estoque] + (seg.obsoleto || seg.perecivel ? 3 : 0) + (seg.id === 'moda' ? 1 : 0) - (x.online ? 2 : 0);
  x.encalhe = clamp(Math.round(x.encalhe * 0.85 + sobe + r.normal() * 3));
  if (x.fornecedor === 'importador' && r.chance(0.12)) {
    e.caixa -= Math.round(capitalDaUnidadeLocal(e) * 0.04 * conversao(v, e));
    return 'O câmbio virou: a mercadoria importada chegou mais cara do que se vendia.';
  }
  return x.encalhe >= 55 ? 'O estoque encalhou: mercadoria parada, capital preso.' : undefined;
}

const capitalDaUnidadeLocal = (e: Empresa) => tipoDeEmpresa(e.tipo).capital * Math.pow(custoLocal(e.municipioId), 1.2);

function anoDoMuseu(v: Vida, e: Empresa, r: Rng): string | undefined {
  const m = e.setor!.museu!;
  let nota: string | undefined;
  for (const o of m.obras) o.conservacao = clamp(o.conservacao - (o.exposta ? 1 : 0) + (e.caixa > 0 ? 0 : -1));
  // Os empréstimos vencem: o que veio, volta; o que foi, retorna.
  const voltaram = m.obras.filter(o => o.origem === 'emprestimo' && o.ate !== undefined && v.t >= o.ate);
  if (voltaram.length) { m.obras = m.obras.filter(o => !voltaram.includes(o)); nota = `${cap(voltaram[0].nome)} voltou para ${voltaram[0].de ?? 'quem emprestou'}.`; }
  for (const o of m.obras) if (o.fora && v.t >= o.fora.ate) { (e.historia ??= []).push({ t: v.t, texto: `${cap(o.nome)} voltou do empréstimo a ${o.fora.instituicao}.` }); delete o.fora; }
  if (m.exposicao && v.t >= m.exposicao.ate) delete m.exposicao;
  if (m.patrocinio && v.t >= m.patrocinio.ate) { nota = nota ?? `O patrocínio de ${m.patrocinio.nome} terminou.`; delete m.patrocinio; }
  // A falsificação exposta: alguém de fora percebe (a imprensa, um pesquisador). Quem verificou antes não passa por isso.
  const falsa = m.obras.find(o => o.falsa && o.exposta && o.autenticidade !== 'verificada');
  if (falsa && r.chance(0.12)) {
    falsa.exposta = false;
    falsa.autenticidade = 'verificada';
    falsa.valor = Math.round(falsa.valor * 0.03);
    e.reputacao = clamp(e.reputacao - 16);
    escrever(v, { texto: `Um pesquisador provou que ${falsa.nome} de ${e.nome} é falso. A peça saiu da parede; a manchete ficou.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    nota = `Escândalo: ${falsa.nome} era falso.`;
  }
  // A segurança baixa: um dano (ou um furto) numa peça exposta.
  if (r.chance(Math.max(0, (55 - m.seguranca) / 400))) {
    const o = r.pick(m.obras.filter(x => x.exposta));
    if (o) { o.conservacao = clamp(o.conservacao - 30); o.valor = Math.round(o.valor * 0.7); e.reputacao = clamp(e.reputacao - 6); nota = `${cap(o.nome)} foi danificado numa noite sem vigilância.`; }
  }
  return nota;
}

function anoDoZoo(v: Vida, e: Empresa, r: Rng): string | undefined {
  const z = e.setor!.zoo!;
  const notas: string[] = [];
  for (const q of z.recintos) q.qualidade = clamp(q.qualidade - 1);
  for (const a of [...z.animais]) {
    const x = especieDeZoo(a.especie)!;
    const bem = bemEstarDoAnimal(e, a);
    a.saude = clamp(Math.round(a.saude + (bem - 60) / 6 + r.normal() * 4));
    const anos = (v.t - a.nasceu) / 12;
    const velho = anos > x.vida * 0.85;
    if (a.saude < 12 || (velho && r.chance(0.25)) || anos > x.vida * 1.15) {
      z.animais = z.animais.filter(b => b !== a);
      (z.memoria ??= []).push({ t: v.t, texto: `${a.nome} (${x.nome}) morreu${velho ? ' de velhice' : ''}, aos ${Math.max(1, Math.round(anos))} anos.` });
      notas.push(`${a.nome}, ${x.nome === 'onça-pintada' ? 'a onça' : `o ${x.nome}`}, morreu${velho ? ' de velhice' : ''}.`);
      if (!velho) e.reputacao = clamp(e.reputacao - 4);
    }
  }
  // Nascimentos: só quem tem par, espaço, cuidado — e, nas ameaçadas, o programa de conservação.
  const por = new Map<string, AnimalDoZoo[]>();
  for (const a of z.animais) por.set(a.especie, [...(por.get(a.especie) ?? []), a]);
  for (const [esp, lista] of por) {
    const x = especieDeZoo(esp)!;
    if (!lista.some(a => a.genero === 'masculino') || !lista.some(a => a.genero === 'feminino')) continue;
    if (x.ameacada && !e.zoo?.conservacao) continue;
    const rec = z.recintos.find(q => q.id === lista[0].recinto)!;
    if (bemEstarDoZoo(e) < 55 || !r.chance(0.16)) continue;
    const filhote = novoAnimal(e, esp, rec.id, x.ameacada ? 'conservacao' : 'nascido', v.t, z.animais.length + (z.memoria?.length ?? 0) + 100, r);
    z.animais.push(filhote);
    notas.push(`Nasceu ${filhote.nome}, ${x.ameacada ? 'filhote de uma espécie ameaçada' : `um filhote de ${x.nome}`}.`);
    (z.memoria ??= []).push({ t: v.t, texto: `Nasceu ${filhote.nome} (${x.nome}).` });
    if (ocupacaoDoRecinto(e, rec.id) > rec.vagas) notas.push(`O recinto de ${habitat(rec.habitat).nome.toLowerCase()} ficou lotado: é preciso ampliar ou transferir.`);
  }
  if (z.memoria && z.memoria.length > 30) z.memoria.splice(0, z.memoria.length - 30);
  // O acidente: espécies perigosas, equipe curta ou recinto ruim.
  const perigosos = z.animais.filter(a => (especieDeZoo(a.especie)?.perigo ?? 0) >= 2);
  if (perigosos.length && r.chance(perigosos.length * 0.006 * (e.equipe < tipoDeEmpresa('zoologico').equipe * 0.8 ? 2 : 1))) {
    const a = r.pick(perigosos);
    e.reputacao = clamp(e.reputacao - 10);
    e.caixa -= Math.round(250000 * custoLocal(e.municipioId) * conversao(v, e));
    notas.push(`Um tratador se feriu no recinto de ${a.nome}: investigação, indenização, manchete.`);
  }
  sincronizarZoo(e);
  return notas[0];
}

/* ============================================================ o gestor decide (delegado) */

function decidirPeloGestor(v: Vida, e: Empresa, r: Rng): void {
  const s = e.setor!;
  const comp = e.papel === 'investidor' ? 58 : competenciaDaGestao(v, e);
  const bom = comp >= 55, fraco = comp < 42;
  const pode = (x: number) => e.caixa > x;
  const k = conversao(v, e), c = custoLocal(e.municipioId) * k;
  const gasta = (x: number) => { e.caixa -= x; };
  if (s.restaurante) {
    const x = s.restaurante;
    if (fraco && r.chance(0.3) && x.ingredientes > 1) x.ingredientes = (x.ingredientes - 1) as Nivel3;
    if (bom && notaDoRestaurante(e) < 3.3 && x.ingredientes < 3) x.ingredientes = (x.ingredientes + 1) as Nivel3;
    if (bom && (x.ambiente < 45 || x.atendimento < 45) && pode(60000 * c)) { gasta(Math.round(60000 * c)); x.ambiente = clamp(x.ambiente + 15); x.atendimento = clamp(x.atendimento + 15); }
    if (bom && !x.chef && CONCEITOS[x.conceito].exige >= 56 && pode(200000 * c)) x.chef = profissional(v, e, 'chef', 0, 55);
  } else if (s.hotel) {
    const h = s.hotel;
    if (bom && h.temporada === 'fixa' && PUBLICOS_HOTEL[h.publico].sazonal > 0.2) h.temporada = 'dinamica';
    if (!fraco && h.quartos < 45 && pode(capitalDaUnidadeLocal(e) * 0.05 * k)) { gasta(Math.round(capitalDaUnidadeLocal(e) * 0.05 * k)); h.quartos = clamp(h.quartos + 20); }
  } else if (s.clinica) {
    const x = s.clinica;
    if (!fraco && x.conformidade < 60 && pode(80000 * c)) { gasta(Math.round(80000 * c)); x.conformidade = clamp(x.conformidade + 25); }
    if (bom && x.equipamento < 45 && pode(150000 * c)) { gasta(Math.round(150000 * c)); x.equipamento = clamp(x.equipamento + 25); }
  } else if (s.academia) {
    const x = s.academia;
    if (!fraco && x.equipamentos < 45 && pode(120000 * c)) { gasta(Math.round(120000 * c)); x.equipamentos = clamp(x.equipamentos + 30); }
  } else if (s.estudio) {
    const x = s.estudio;
    if (!fraco && x.equipamento < 45 && pode(70000 * c)) { gasta(Math.round(70000 * c)); x.equipamento = clamp(x.equipamento + 30); }
    if (x.proposta && bom) { aceitarProposta(v, e); }
  } else if (s.loja) {
    const x = s.loja;
    if (!fraco && x.encalhe >= 45) liquidar(v, e);
    if (fraco && r.chance(0.3)) x.estoque = 3;
  } else if (s.museu) {
    const m = s.museu;
    if (bom && !m.exposicao && pode(capitalDaUnidadeLocal(e) * 0.05 * k) && r.chance(0.5)) { const tema = temaComMaisObras(m); if (tema) montarExposicao(v, e, tema); }
  } else if (s.zoo) {
    const z = s.zoo;
    for (const q of z.recintos) if (!fraco && q.qualidade < 50 && pode(q.vagas * habitat(q.habitat).vaga * 0.1 * c)) { gasta(Math.round(q.vagas * habitat(q.habitat).vaga * 0.1 * c)); q.qualidade = clamp(q.qualidade + 18); }
    // O gestor fraco aceita animal sem lugar (a transferência que ninguém recusa) — a lotação aparece depois.
    if (fraco && r.chance(0.2)) { const x = r.pick(ESPECIES_ZOO.filter(y => !y.ameacada)); const rec = z.recintos.find(q => q.habitat === x.habitat); if (rec) z.animais.push(novoAnimal(e, x.id, rec.id, 'transferencia', v.t - 36, z.animais.length + 200, r, 'Recebido numa transferência que ninguém recusou.')); }
    sincronizarZoo(e);
  }
}

/* ============================================================ as decisões do dono */

export interface DecisaoDoSetor {
  id: string;
  alvo?: string;
  rotulo: string;
  grupo: string;
  /** O que sai (do caixa da empresa; o que faltar, do seu bolso como aporte), nos preços da vida. */
  custo: number;
  descricao?: string;
  /** Já é assim (a escolha atual): a tela mostra marcada, sem botão. */
  atual?: boolean;
}

function profissional(v: Vida, e: Empresa, papel: string, n: number, piso = 30): ProfissionalChave {
  const r = rngDe(v.id, e.id, papel, n, v.t);
  const talento = Math.round(clamp(58 + r.normal() * 16, piso, 95));
  const [m, f] = r.pick(NOMES_CHAVE);
  const base = papel === 'chef' ? 7000 : papel === 'curador' ? 11000 : 4000;
  return { nome: r.chance(0.5) ? m : f, talento, salario: Math.round(base * (0.6 + talento / 80) / 100) * 100, t: v.t };
}

/** O nome (e o que se sabe) do profissional à frente: o talento aparece com o tempo, como o do gestor. */
export function leituraDoProfissional(v: Vida, p: ProfissionalChave): string {
  if (v.t - p.t < 12) return 'ainda é cedo para saber';
  return p.talento >= 75 ? 'excepcional' : p.talento >= 60 ? 'muito bom' : p.talento >= 45 ? 'correto' : 'fraco';
}

/** As decisões de cada ramo, com o custo dito antes (a tela agrupa por `grupo`). */
export function decisoesDoSetor(v: Vida, e: Empresa): DecisaoDoSetor[] {
  const s = garantirSetor(v, e);
  const k = conversao(v, e), c = custoLocal(e.municipioId) * k;
  const cap0 = capitalDaUnidadeLocal(e) * k;
  const out: DecisaoDoSetor[] = [];
  const add = (d: DecisaoDoSetor) => out.push({ ...d, custo: mil(d.custo) });
  add({ id: 'divulgar', rotulo: 'Fazer uma campanha de divulgação', grupo: 'Divulgação', custo: cap0 * 0.03, descricao: 'Mais gente lembra da casa por um ou dois anos (a lembrança cai sozinha).' });
  if (s.restaurante) {
    const x = s.restaurante;
    for (const id of Object.keys(CONCEITOS) as (keyof typeof CONCEITOS)[]) add({ id: 'conceito', alvo: id, rotulo: CONCEITOS[id].nome, grupo: 'Conceito', custo: x.conceito === id ? 0 : cap0 * (CONCEITOS[id].exige >= 70 ? 0.25 : 0.08), descricao: CONCEITOS[id].descricao, atual: x.conceito === id });
    for (const id of CULINARIAS.map(z => z.id)) add({ id: 'culinaria', alvo: id, rotulo: cap(culinaria(id).nome), grupo: 'Cozinha', custo: x.culinaria === id ? 0 : cap0 * 0.05, atual: x.culinaria === id });
    for (const n of [1, 2, 3] as Nivel3[]) add({ id: 'ingredientes', alvo: String(n), rotulo: `Ingredientes ${INGREDIENTES[n].nome}`, grupo: 'Insumo', custo: 0, atual: x.ingredientes === n });
    for (const f of Object.keys(FORNECEDORES) as (keyof typeof FORNECEDORES)[]) add({ id: 'fornecedor', alvo: f, rotulo: FORNECEDORES[f].nome, grupo: 'Fornecedor', custo: 0, descricao: FORNECEDORES[f].descricao, atual: x.fornecedor === f });
    add({ id: 'chef', rotulo: x.chef ? `Trocar o chef (${x.chef.nome})` : 'Contratar um chef', grupo: 'Cozinha e salão', custo: 0, descricao: 'O salário entra na folha; o talento só se vê com o tempo.' });
    add({ id: 'prato', rotulo: 'Criar um prato da casa', grupo: 'Cozinha e salão', custo: 40000 * c, descricao: 'Pede um chef (ou você do ramo). Até três: cada um, um motivo para voltar.' });
    add({ id: 'salao', rotulo: 'Reformar o salão', grupo: 'Cozinha e salão', custo: 120000 * c * e.unidades });
    add({ id: 'atendimento', rotulo: 'Treinar e reforçar o atendimento', grupo: 'Cozinha e salão', custo: 50000 * c * e.unidades });
  } else if (s.hotel) {
    const h = s.hotel;
    for (const n of [2, 3, 4, 5] as const) add({ id: 'estrelas', alvo: String(n), rotulo: `${n} estrelas`, grupo: 'Categoria', custo: n > h.estrelas ? cap0 * 0.18 * (n - h.estrelas) * ESTRELAS[n].obra : 0, descricao: n > h.estrelas ? 'Obra, enxoval, equipe: subir de categoria custa; a diária acompanha — e a exigência também.' : undefined, atual: h.estrelas === n });
    for (const p of Object.keys(PUBLICOS_HOTEL) as (keyof typeof PUBLICOS_HOTEL)[]) add({ id: 'publico', alvo: p, rotulo: PUBLICOS_HOTEL[p].nome, grupo: 'Público', custo: 0, descricao: PUBLICOS_HOTEL[p].descricao, atual: h.publico === p });
    for (const sv of SERVICOS_HOTEL) add({ id: h.servicos.includes(sv.id) ? 'servico_tirar' : 'servico', alvo: sv.id, rotulo: h.servicos.includes(sv.id) ? `Encerrar: ${sv.nome.toLowerCase()}` : `Oferecer: ${sv.nome.toLowerCase()}`, grupo: 'Serviços', custo: h.servicos.includes(sv.id) ? 0 : sv.capital * c * e.unidades });
    for (const a of ['enxuto', 'padrao', 'personalizado'] as const) add({ id: 'politica', alvo: a, rotulo: { enxuto: 'Atendimento enxuto', padrao: 'Atendimento padrão', personalizado: 'Atendimento personalizado' }[a], grupo: 'Atendimento', custo: 0, atual: h.atendimento === a });
    for (const a of ['fixa', 'dinamica', 'pacotes'] as const) add({ id: 'temporada', alvo: a, rotulo: { fixa: 'Diária fixa o ano todo', dinamica: 'Tarifa que sobe e desce com a procura', pacotes: 'Pacotes para a baixa temporada' }[a], grupo: 'Temporada', custo: 0, atual: h.temporada === a });
    add({ id: 'quartos', rotulo: 'Reformar os quartos', grupo: 'Quartos', custo: cap0 * 0.05 * e.unidades });
  } else if (s.clinica) {
    const x = s.clinica;
    for (const z of ESPECIALIDADES.filter(y => y.id !== 'clinica_geral')) add({ id: x.especialidades.includes(z.id) ? 'especialidade_tirar' : 'especialidade', alvo: z.id, rotulo: x.especialidades.includes(z.id) ? `Encerrar ${z.nome.toLowerCase()}` : `Abrir ${z.nome.toLowerCase()}`, grupo: 'Especialidades', custo: x.especialidades.includes(z.id) ? 0 : z.equipamento * c, descricao: x.especialidades.includes(z.id) ? undefined : `Equipamento agora; ${fmt(Math.round(z.profissional * salarioLocal(e.municipioId) * k))}/mês de profissional.` });
    for (const a of ['convenios', 'misto', 'particular'] as const) add({ id: 'atendimento_clinica', alvo: a, rotulo: { convenios: 'Só convênios', misto: 'Convênios e particular', particular: 'Só particular' }[a], grupo: 'Atendimento', custo: 0, atual: x.atendimento === a });
    add({ id: 'equipamento', rotulo: 'Renovar os equipamentos', grupo: 'Estrutura', custo: 150000 * c * e.unidades });
    add({ id: 'conformidade', rotulo: 'Regularizar protocolos e licenças', grupo: 'Estrutura', custo: 80000 * c * e.unidades, descricao: 'A vigilância sanitária passa todo ano; o que está vencido vira multa — ou interdição.' });
  } else if (s.academia) {
    const x = s.academia;
    for (const m of MODALIDADES.filter(y => y.id !== 'musculacao')) add({ id: x.modalidades.includes(m.id) ? 'modalidade_tirar' : 'modalidade', alvo: m.id, rotulo: x.modalidades.includes(m.id) ? `Encerrar ${m.nome.toLowerCase()}` : `Abrir ${m.nome.toLowerCase()}`, grupo: 'Modalidades', custo: x.modalidades.includes(m.id) ? 0 : m.capital * c * e.unidades });
    for (const z of RETENCAO) add({ id: x.retencao.includes(z.id) ? 'retencao_tirar' : 'retencao', alvo: z.id, rotulo: x.retencao.includes(z.id) ? `Encerrar: ${z.nome.toLowerCase()}` : z.nome, grupo: 'Retenção', custo: 0, descricao: x.retencao.includes(z.id) ? undefined : `${fmt(mil(z.anual * c * e.unidades))} por ano.` });
    add({ id: 'equipamentos', rotulo: 'Trocar os equipamentos', grupo: 'Estrutura', custo: 120000 * c * e.unidades });
    add({ id: 'instrutores', rotulo: 'Formar e contratar instrutores melhores', grupo: 'Estrutura', custo: 30000 * c * e.unidades, descricao: 'Instrutor bom segura o aluno — e cobra mais.' });
  } else if (s.estudio) {
    const x = s.estudio;
    for (const z of SERVICOS_ESTUDIO.filter(y => y.id !== 'gravacao')) add({ id: x.servicos.includes(z.id) ? 'servico_estudio_tirar' : 'servico_estudio', alvo: z.id, rotulo: x.servicos.includes(z.id) ? `Encerrar ${z.nome.toLowerCase()}` : `Oferecer ${z.nome.toLowerCase()}`, grupo: 'Serviços', custo: x.servicos.includes(z.id) ? 0 : z.capital * c, descricao: z.exige && !x.servicos.includes(z.id) ? 'Só rende com um técnico de som de nível.' : undefined });
    add({ id: 'equipamento_estudio', rotulo: 'Renovar o equipamento', grupo: 'Estrutura', custo: 70000 * c });
    add({ id: 'tecnico', rotulo: x.tecnico ? `Trocar o técnico de som (${x.tecnico.nome})` : 'Contratar um técnico de som com nome', grupo: 'Estrutura', custo: 0 });
    if (x.proposta) {
      add({ id: 'proposta', alvo: 'sim', rotulo: `Aceitar ${x.proposta.artista} com ${Math.round(x.proposta.desconto * 100)}% de desconto`, grupo: 'Projeto proposto', custo: 0, descricao: 'Menos receita no projeto; o crédito no disco fica.' });
      add({ id: 'proposta', alvo: 'nao', rotulo: 'Recusar a proposta', grupo: 'Projeto proposto', custo: 0 });
    }
  } else if (s.loja) {
    const x = s.loja;
    for (const g of SEGMENTOS_LOJA) add({ id: 'segmento', alvo: g.id, rotulo: g.nome, grupo: 'Segmento', custo: x.segmento === g.id ? 0 : cap0 * 0.2, descricao: x.segmento === g.id ? undefined : 'Trocar de segmento é quase abrir outra loja: estoque novo, clientela nova.', atual: x.segmento === g.id });
    for (const n of [1, 2, 3] as Nivel3[]) add({ id: 'estoque', alvo: String(n), rotulo: { 1: 'Estoque enxuto', 2: 'Estoque normal', 3: 'Estoque amplo' }[n], grupo: 'Estoque', custo: 0, descricao: { 1: 'Pouco capital parado; às vezes falta o que o cliente pede.', 2: undefined, 3: 'Tem de tudo — e o que não sai, encalha.' }[n], atual: x.estoque === n });
    for (const f of ['nacional', 'importador', 'direto'] as const) add({ id: 'fornecedor_loja', alvo: f, rotulo: { nacional: 'Distribuidores nacionais', importador: 'Importador', direto: 'Direto do fabricante' }[f], grupo: 'Fornecedor', custo: 0, descricao: { nacional: undefined, importador: 'Mais variedade; o câmbio pesa.', direto: 'Margem melhor; pede volume (duas unidades ou mais).' }[f], atual: x.fornecedor === f });
    add({ id: 'variedade', rotulo: 'Ampliar a variedade', grupo: 'Vitrine', custo: 60000 * c * e.unidades });
    add({ id: x.online ? 'online_tirar' : 'online', rotulo: x.online ? 'Fechar a loja online' : 'Abrir a venda online', grupo: 'Vitrine', custo: x.online ? 0 : 90000 * c });
    add({ id: 'liquidacao', rotulo: 'Fazer uma liquidação', grupo: 'Estoque', custo: 0, descricao: 'Limpa o encalhe; a margem vai embora junto.' });
  } else if (s.museu) {
    const m = s.museu;
    for (const l of Object.keys(LINHAS_MUSEU) as (keyof typeof LINHAS_MUSEU)[]) add({ id: 'linha', alvo: l, rotulo: LINHAS_MUSEU[l].nome, grupo: 'Linha', custo: 0, descricao: LINHAS_MUSEU[l].descricao, atual: m.linha === l });
    for (const tm of TEMAS_MUSEU.filter(z => m.obras.some(o => o.tema === z.id))) add({ id: 'exposicao', alvo: tm.id, rotulo: `Montar a exposição "${tm.nome}"`, grupo: 'Exposições', custo: cap0 * 0.05, descricao: `${m.obras.filter(o => o.tema === tm.id).length} obras do acervo neste tema; a curadoria pesa.` });
    for (const o of ofertasDeObras(v, e)) add({ id: 'comprar_obra', alvo: o.id, rotulo: `Comprar: ${o.nome} (${o.periodo})`, grupo: 'Acervo', custo: o.valor, descricao: o.descricao });
    add({ id: 'receber_emprestimo', rotulo: 'Receber uma obra emprestada por um ano', grupo: 'Acervo', custo: cap0 * 0.025, descricao: 'Uma peça de fora atrai público; o seguro e o transporte são seus.' });
    add({ id: 'curador', rotulo: m.curador ? `Trocar a curadoria (${m.curador.nome})` : 'Contratar um curador', grupo: 'Equipe', custo: 0 });
    add({ id: 'seguranca', rotulo: 'Reforçar a segurança', grupo: 'Equipe', custo: 120000 * c });
    add({ id: 'patrocinio', rotulo: 'Buscar um patrocinador', grupo: 'Dinheiro', custo: 30000 * c, descricao: 'Depende do nome do museu: com reputação baixa, ninguém assina.' });
    add({ id: 'evento', rotulo: 'Fazer um evento de gala', grupo: 'Dinheiro', custo: 90000 * c, descricao: 'Abre portas para patrocínio e doação.' });
  } else if (s.zoo) {
    const z = s.zoo;
    for (const h of HABITATS) add({ id: 'recinto', alvo: h.id, rotulo: z.recintos.some(q => q.habitat === h.id) ? `Ampliar o recinto: ${h.nome.toLowerCase()} (+6 vagas)` : `Construir recinto: ${h.nome.toLowerCase()} (8 vagas)`, grupo: 'Recintos', custo: h.vaga * (z.recintos.some(q => q.habitat === h.id) ? 6 : 8) * c });
    add({ id: 'reformar_recintos', rotulo: 'Reformar os recintos (enriquecimento ambiental)', grupo: 'Recintos', custo: z.recintos.reduce((x, q) => x + q.vagas * habitat(q.habitat).vaga * 0.08, 0) * c });
    for (const x of ESPECIES_ZOO) add({ id: 'receber', alvo: x.id, rotulo: `Receber ${x.grupo > 1 ? `um grupo de ${x.grupo}` : 'um'} ${x.nome}${x.grupo > 1 ? 's' : ''}`.replace(/(ão)s$/, 'ões').replace(/ls$/, 'is'), grupo: 'Espécies', custo: x.transferencia * x.grupo * c, descricao: `${habitat(x.habitat).nome}; ${x.vagas * x.grupo} vagas; ${fmt(mil(x.custo * x.grupo * c))}/ano${x.ameacada ? '; só por programa de conservação' : ''}${x.especialista ? '; pede veterinário especializado' : ''}.` });
    for (const n of [1, 2, 3] as Nivel3[]) add({ id: 'alimentacao', alvo: String(n), rotulo: { 1: 'Alimentação básica', 2: 'Alimentação adequada', 3: 'Alimentação e enriquecimento excelentes' }[n], grupo: 'Cuidado', custo: 0, atual: z.alimentacao === n });
    add({ id: 'veterinario', alvo: 'mais', rotulo: `Contratar mais um veterinário (hoje: ${z.veterinarios})`, grupo: 'Cuidado', custo: 0 });
    if (z.veterinarios > 1) add({ id: 'veterinario', alvo: 'menos', rotulo: 'Dispensar um veterinário', grupo: 'Cuidado', custo: 0 });
    add({ id: z.educacao ? 'educacao_tirar' : 'educacao', rotulo: z.educacao ? 'Encerrar o programa educativo' : 'Criar um programa educativo (escolas, visitas guiadas)', grupo: 'Cuidado', custo: z.educacao ? 0 : 80000 * c });
  }
  return out;
}

export function disponibilidadeSetor(v: Vida, e: Empresa | undefined, id: string, alvo?: string): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  if (!e || e.estado === 'encerrada') return { ok: false, motivo: 'Essa empresa não existe mais.' };
  if (e.papel === 'investidor') return { ok: false, motivo: 'Investidor não decide: quem decide são os sócios majoritários.' };
  if (e.estado === 'abrindo' && !['conceito', 'culinaria', 'estrelas', 'publico', 'linha', 'segmento'].includes(id)) return { ok: false, motivo: 'Primeiro, terminar a obra.' };
  const s = garantirSetor(v, e);
  const d = decisoesDoSetor(v, e).find(x => x.id === id && (x.alvo ?? '') === (alvo ?? ''));
  if (!d) return { ok: false, motivo: 'Isso não se decide neste negócio.' };
  if (d.atual) return { ok: false, motivo: 'Já é assim.' };
  const chave = `negocio:${e.id}:${id}`;
  const umaVez = ['conceito', 'culinaria', 'estrelas', 'segmento', 'chef', 'curador', 'tecnico', 'prato', 'divulgar', 'exposicao', 'patrocinio', 'evento', 'receber_emprestimo', 'liquidacao', 'publico', 'linha'];
  if (umaVez.includes(id) && v.anoAtual.acoes.includes(chave)) return { ok: false, motivo: 'Já decidido este ano.' };
  if (v.anoAtual.acoes.includes(`${chave}:${alvo ?? ''}`)) return { ok: false, motivo: 'Já decidido este ano.' };
  switch (id) {
    case 'prato': {
      const x = s.restaurante!;
      if (x.pratos.length >= 3) return { ok: false, motivo: 'Já são três pratos da casa: mais um, ninguém lembra.' };
      if (!x.chef && !(e.gestao.quem === 'propria' && doRamo(v, 'restaurante'))) return { ok: false, motivo: 'Prato de assinatura pede quem cozinhe com assinatura: um chef (ou você, se for do ramo).' };
      break;
    }
    case 'conceito':
      if (CONCEITOS[alvo as keyof typeof CONCEITOS]?.exige >= 70 && !s.restaurante!.chef) return { ok: false, motivo: 'Alta gastronomia sem chef não existe: contrate um antes.' };
      break;
    case 'estrelas':
      if (Number(alvo) === 5 && !['metropole', 'capital'].includes(municipioPerfil(e))) return { ok: false, motivo: 'Cinco estrelas pede cidade grande (ou destino turístico de nome).' };
      break;
    case 'servico': {
      const sv = servicoHotel(alvo!);
      if (sv?.minEstrelas && s.hotel!.estrelas < sv.minEstrelas) return { ok: false, motivo: `${sv.nome} combina com ${sv.minEstrelas} estrelas ou mais.` };
      break;
    }
    case 'fornecedor_loja': if (alvo === 'direto' && e.unidades < 2) return { ok: false, motivo: 'O fabricante só vende direto para quem compra volume (duas unidades ou mais).' }; break;
    case 'receber': {
      const msg = podeReceberAnimal(e, alvo!);
      if (msg) return { ok: false, motivo: msg };
      break;
    }
    case 'patrocinio': if (e.reputacao < 45) return { ok: false, motivo: 'Com a reputação de hoje, nenhuma empresa põe o nome aqui.' }; if (s.museu?.patrocinio) return { ok: false, motivo: 'Já há patrocínio em curso.' }; break;
    case 'exposicao': if (s.museu?.exposicao && v.t < s.museu.exposicao.ate) return { ok: false, motivo: 'Há uma exposição em cartaz.' }; break;
    case 'liquidacao': if ((s.loja?.encalhe ?? 0) < 15) return { ok: false, motivo: 'Não há encalhe que justifique.' }; break;
    case 'veterinario': if (alvo === 'menos' && (s.zoo?.veterinarios ?? 0) <= 1) return { ok: false, motivo: 'Sem veterinário, a licença cai.' }; break;
  }
  if (d.custo > 0) {
    if (e.caixa >= d.custo) return { ok: true };
    return okDePagar(v, d.custo - Math.max(0, e.caixa), 'Custa (o que o caixa não cobre sai do seu bolso)');
  }
  return { ok: true };
}

const municipioPerfil = (e: Empresa) => municipio(e.municipioId).perfil;

/** Pode receber esta espécie? (O recinto do habitat com vaga, a licença, o programa, o veterinário.) */
export function podeReceberAnimal(e: Empresa, especie: string, umSo = false): string | undefined {
  const z = e.setor?.zoo;
  const x = especieDeZoo(especie);
  if (!z || !x) return 'Isso não é um zoológico.';
  if (!e.zoo?.licenca && e.estado !== 'abrindo') return 'Sem licença de operação, nenhuma instituição transfere animais para cá.';
  const rec = z.recintos.find(q => q.habitat === x.habitat);
  if (!rec) return `Não há recinto de ${habitat(x.habitat).nome.toLowerCase()}: sem instalação adequada, a transferência não é autorizada.`;
  const precisa = umSo ? x.vagas : x.vagas * Math.max(1, x.grupo - z.animais.filter(a => a.especie === especie && a.recinto === rec.id).length);
  if (ocupacaoDoRecinto(e, rec.id) + precisa > rec.vagas) return `O recinto de ${habitat(x.habitat).nome.toLowerCase()} não tem vaga (${ocupacaoDoRecinto(e, rec.id)}/${rec.vagas}): ampliar antes.`;
  if (x.ameacada && !e.zoo?.conservacao && !umSo) return 'Espécie ameaçada só vem por programa de conservação — e o zoológico não participa de nenhum.';
  if (x.especialista && z.veterinarios < 3) return 'Pede veterinário especializado: contrate antes (três ou mais na equipe).';
  if (bemEstarDoZoo(e) < 55) return 'Com o bem-estar de hoje, nenhuma instituição manda animais para cá.';
  return undefined;
}

export function decidirSetor(v: Vida, e: Empresa, id: string, alvo?: string): string {
  const s = garantirSetor(v, e);
  const d = decisoesDoSetor(v, e).find(x => x.id === id && (x.alvo ?? '') === (alvo ?? ''))!;
  v.anoAtual.acoes.push(`negocio:${e.id}:${id}`, `negocio:${e.id}:${id}:${alvo ?? ''}`);
  if (d.custo > 0) gastar(v, e, d.custo);
  const hist = (texto: string) => (e.historia ??= []).push({ t: v.t, texto });
  const t = tipoDeEmpresa(e.tipo);
  const k = conversao(v, e);
  switch (id) {
    case 'divulgar': s.divulgacao = clamp((s.divulgacao ?? 20) + 45); return 'Campanha na rua e nas redes: mais gente sabe que a casa existe. Dura um ou dois anos.';
    /* restaurante */
    case 'conceito': {
      const x = s.restaurante!;
      x.conceito = alvo as typeof x.conceito;
      x.prestigio = Math.round(x.prestigio * 0.4);
      e.equipe = Math.max(4, Math.round(t.equipe * CONCEITOS[x.conceito].equipe * e.unidades));
      hist(`Virou ${CONCEITOS[x.conceito].nome.toLowerCase()}.`);
      return `Novo conceito: ${CONCEITOS[x.conceito].nome.toLowerCase()}. O público antigo estranha; o novo leva tempo para descobrir — o prestígio recomeça quase do zero.`;
    }
    case 'culinaria': s.restaurante!.culinaria = alvo!; s.restaurante!.pratos = []; hist(`Mudou a cozinha para ${culinaria(alvo!).nome}.`); return `Cardápio novo: cozinha ${culinaria(alvo!).nome}. Os pratos da casa de antes saíram.`;
    case 'ingredientes': { const n = Number(alvo) as Nivel3; s.restaurante!.ingredientes = n; return n === 3 ? 'Ingredientes excelentes: o prato melhora, a margem encolhe.' : n === 1 ? 'Ingredientes básicos: a margem respira; o cliente percebe.' : 'Ingredientes bons, no meio do caminho.'; }
    case 'fornecedor': s.restaurante!.fornecedor = alvo as never; return `${FORNECEDORES[alvo as keyof typeof FORNECEDORES].nome}: ${FORNECEDORES[alvo as keyof typeof FORNECEDORES].descricao.toLowerCase()}`;
    case 'chef': { const p = profissional(v, e, 'chef', (e.historia ?? []).length); s.restaurante!.chef = p; hist(`Contratou ${p.nome} como chef.`); return `${p.nome} assume a cozinha por ${fmt(Math.round(p.salario * salarioLocal(e.municipioId) * k))} por mês. Se é bom, a nota vai dizer.`; }
    case 'prato': { const x = s.restaurante!; const lista = (PRATOS[x.culinaria] ?? PRATOS.brasileira).filter(p => !x.pratos.includes(p)); const p = rngDe(v.id, e.id, 'prato', v.t).pick(lista.length ? lista : ['prato do chef']); x.pratos.push(p); x.prestigio = Math.min(CONCEITOS[x.conceito].teto, x.prestigio + 4); hist(`Criou ${p}.`); return `Nasceu um prato da casa: ${p}. Quem prova, comenta.`; }
    case 'salao': s.restaurante!.ambiente = clamp(s.restaurante!.ambiente + 28); e.ativos += Math.round(d.custo * 0.6); return 'Salão reformado: luz, cadeiras, acústica. A primeira impressão mudou.';
    case 'atendimento': s.restaurante!.atendimento = clamp(s.restaurante!.atendimento + 25); return 'Equipe treinada e reforçada: a mesa espera menos, o erro some.';
    /* hotel */
    case 'estrelas': { const h = s.hotel!; const sobe = Number(alvo) > h.estrelas; h.estrelas = Number(alvo) as 2 | 3 | 4 | 5; if (sobe) { h.quartos = clamp(h.quartos + 20); e.ativos += Math.round(d.custo * 0.7); } hist(`Passou a ${h.estrelas} estrelas.`); return sobe ? `${h.estrelas} estrelas: diária mais alta, hóspede mais exigente — o que não estiver à altura vira avaliação ruim.` : `${h.estrelas} estrelas: diária menor, público mais amplo.`; }
    case 'publico': s.hotel!.publico = alvo as never; return `O hotel passa a mirar ${PUBLICOS_HOTEL[alvo as keyof typeof PUBLICOS_HOTEL].nome.toLowerCase()}: ${PUBLICOS_HOTEL[alvo as keyof typeof PUBLICOS_HOTEL].descricao.toLowerCase()}`;
    case 'servico': s.hotel!.servicos.push(alvo!); e.ativos += Math.round(d.custo * 0.7); return `${servicoHotel(alvo!)!.nome}: pronto. Custa todo ano; atrai quem procura isso.`;
    case 'servico_tirar': s.hotel!.servicos = s.hotel!.servicos.filter(x => x !== alvo); return `${servicoHotel(alvo!)!.nome} encerrado: menos custo, menos motivo para escolher a casa.`;
    case 'politica': s.hotel!.atendimento = alvo as never; return alvo === 'personalizado' ? 'Atendimento personalizado: mais gente na equipe, hóspede que volta.' : alvo === 'enxuto' ? 'Atendimento enxuto: folha menor, fila na recepção.' : 'Atendimento padrão.';
    case 'temporada': s.hotel!.temporada = alvo as never; return alvo === 'dinamica' ? 'Tarifa dinâmica: mais barata quando vazio, mais cara quando cheio. A ocupação média sobe um pouco.' : alvo === 'pacotes' ? 'Pacotes com agências para a baixa temporada: quartos ocupados, diária média menor, comissão.' : 'Diária fixa: simples, e a baixa temporada vazia.';
    case 'quartos': s.hotel!.quartos = clamp(s.hotel!.quartos + 25); e.ativos += Math.round(d.custo * 0.7); return 'Quartos reformados: colchão, banheiro, isolamento. A nota dos hóspedes acompanha.';
    /* clínica */
    case 'especialidade': s.clinica!.especialidades.push(alvo!); e.ativos += Math.round(d.custo * 0.8); hist(`Abriu ${especialidade(alvo!)!.nome.toLowerCase()}.`); return `${especialidade(alvo!)!.nome}: equipamento instalado, profissional contratado. Agenda nova para encher.`;
    case 'especialidade_tirar': s.clinica!.especialidades = s.clinica!.especialidades.filter(x => x !== alvo); return `${especialidade(alvo!)!.nome} encerrada: um salário a menos, um público a menos.`;
    case 'atendimento_clinica': s.clinica!.atendimento = alvo as never; return alvo === 'convenios' ? 'Só convênios: agenda cheia, consulta mal paga, glosa no fim do mês.' : alvo === 'particular' ? 'Só particular: menos gente, mais por consulta — e quem paga quer ser bem atendido.' : 'Convênios e particular.';
    case 'equipamento': s.clinica!.equipamento = clamp(s.clinica!.equipamento + 30); e.ativos += Math.round(d.custo * 0.7); return 'Equipamentos renovados: exame mais preciso, paciente que indica.';
    case 'conformidade': s.clinica!.conformidade = clamp(s.clinica!.conformidade + 35); return 'Protocolos, licenças e manutenção em dia: a próxima inspeção encontra tudo certo.';
    /* academia */
    case 'modalidade': s.academia!.modalidades.push(alvo!); e.ativos += Math.round(d.custo * 0.7); return `${modalidade(alvo!)!.nome}: nova turma aberta.`;
    case 'modalidade_tirar': s.academia!.modalidades = s.academia!.modalidades.filter(x => x !== alvo); return `${modalidade(alvo!)!.nome} encerrada.`;
    case 'retencao': s.academia!.retencao.push(alvo!); return `${RETENCAO.find(z => z.id === alvo)!.nome}: menos aluno sumindo em março.`;
    case 'retencao_tirar': s.academia!.retencao = s.academia!.retencao.filter(x => x !== alvo); return 'Programa encerrado.';
    case 'equipamentos': s.academia!.equipamentos = clamp(s.academia!.equipamentos + 35); e.ativos += Math.round(d.custo * 0.7); return 'Aparelhos novos: a sala lotada volta a funcionar.';
    case 'instrutores': s.academia!.instrutores = clamp(s.academia!.instrutores + 15); return 'Instrutores melhores: o aluno é visto — e fica.';
    /* estúdio */
    case 'servico_estudio': s.estudio!.servicos.push(alvo!); e.ativos += Math.round(d.custo * 0.8); return `${servicoEstudio(alvo!)!.nome}: no cardápio do estúdio.`;
    case 'servico_estudio_tirar': s.estudio!.servicos = s.estudio!.servicos.filter(x => x !== alvo); return 'Serviço encerrado.';
    case 'equipamento_estudio': s.estudio!.equipamento = clamp(s.estudio!.equipamento + 32); e.ativos += Math.round(d.custo * 0.8); return 'Mesa, microfones, monitores novos: o som da casa voltou a ser o de antes.';
    case 'tecnico': { const p = profissional(v, e, 'tecnico', (e.historia ?? []).length); s.estudio!.tecnico = p; hist(`Contratou ${p.nome} como técnico de som.`); return `${p.nome} assume a técnica por ${fmt(Math.round(p.salario * salarioLocal(e.municipioId) * k))} por mês.`; }
    case 'proposta': if (alvo === 'sim') return aceitarProposta(v, e); delete s.estudio!.proposta; return 'Proposta recusada: a agenda segue com quem paga o preço cheio.';
    /* loja */
    case 'segmento': s.loja!.segmento = alvo!; s.loja!.encalhe = 0; e.ativos += Math.round(d.custo * 0.4); hist(`Mudou para ${segmentoLoja(alvo!).nome.toLowerCase()}.`); return `A loja virou ${segmentoLoja(alvo!).nome.toLowerCase()}: estoque novo, clientela por conquistar.`;
    case 'estoque': s.loja!.estoque = Number(alvo) as Nivel3; return Number(alvo) === 3 ? 'Estoque amplo: o cliente acha tudo; o que não sai, fica.' : Number(alvo) === 1 ? 'Estoque enxuto: capital livre, uma ou outra venda perdida.' : 'Estoque normal.';
    case 'fornecedor_loja': s.loja!.fornecedor = alvo as never; return alvo === 'importador' ? 'Importador: mais variedade, câmbio no meio.' : alvo === 'direto' ? 'Direto do fabricante: margem melhor, pedido mínimo grande.' : 'Distribuidores nacionais.';
    case 'variedade': s.loja!.variedade = clamp(s.loja!.variedade + 20); return 'Mais marcas, mais tamanhos, mais cores: mais motivos para entrar.';
    case 'online': s.loja!.online = true; return 'Venda online aberta: frete, fotos, devolução — e clientes de fora do bairro.';
    case 'online_tirar': s.loja!.online = false; return 'Loja online fechada.';
    case 'liquidacao': return liquidar(v, e);
    /* museu */
    case 'linha': s.museu!.linha = alvo as never; return LINHAS_MUSEU[alvo as keyof typeof LINHAS_MUSEU].descricao;
    case 'exposicao': return montarExposicao(v, e, alvo!);
    case 'comprar_obra': { const o = ofertasDeObras(v, e).find(x => x.id === alvo)!; s.museu!.obras.push({ id: `${e.id}-${o.id}`, nome: o.nome, tema: o.tema, periodo: o.periodo, valor: o.valor, conservacao: o.conservacao, exposta: true, autenticidade: o.laudo ? 'verificada' : 'presumida', origem: 'compra', ...(o.falsa ? { falsa: true } : {}) }); if (e.acervo) { e.acervo.valor += Math.round(o.valor / k); e.acervo.pecas += 1; } hist(`Comprou ${o.nome}.`); return `${cap(o.nome)} entrou no acervo${o.laudo ? ', com laudo' : ' (sem laudo: a autenticidade é a palavra de quem vendeu)'}.`; }
    case 'receber_emprestimo': { const r = rngDe(v.id, e.id, 'recebe', v.t); const tema = r.pick(TEMAS_MUSEU); const de = r.pick(MUSEUS_DE_FORA); s.museu!.obras.push({ id: `${e.id}-emp${v.t}`, nome: r.pick(tema.obras), tema: tema.id, periodo: r.pick(tema.periodos), valor: Math.round(capitalDaUnidadeLocal(e) * k * 0.12 / 1000) * 1000, conservacao: 85, exposta: true, autenticidade: 'verificada', origem: 'emprestimo', de, ate: v.t + 12 }); return `Uma obra de ${de} chega por um ano: o público vem ver o que não se vê aqui.`; }
    case 'curador': { const p = profissional(v, e, 'curador', (e.historia ?? []).length); s.museu!.curador = p; hist(`Contratou ${p.nome} para a curadoria.`); return `${p.nome} assume a curadoria por ${fmt(Math.round(p.salario * salarioLocal(e.municipioId) * k))} por mês.`; }
    case 'seguranca': s.museu!.seguranca = clamp(s.museu!.seguranca + 25); return 'Câmeras, vigias, controle de clima: o acervo dorme mais tranquilo.';
    case 'patrocinio': { const r = rngDe(v.id, e.id, 'patro', v.t); if (!r.chance(clamp((e.reputacao - 35) / 45, 0.1, 0.9))) return 'Reuniões, propostas, café: ninguém assinou este ano.'; const anual = Math.round(capitalDaUnidadeLocal(e) * k * (0.02 + e.reputacao / 2500) / 1000) * 1000; s.museu!.patrocinio = { nome: r.pick(PATROCINADORES), anual, ate: v.t + 36 }; hist(`Patrocínio de ${s.museu!.patrocinio.nome}.`); return `${cap(s.museu!.patrocinio.nome)} assinou: ${fmt(anual)} por ano, por três anos — com o nome na entrada.`; }
    case 'evento': { e.reputacao = clamp(e.reputacao + 3); s.divulgacao = clamp((s.divulgacao ?? 20) + 20); const r = rngDe(v.id, e.id, 'gala', v.t); if (r.chance(0.35)) { const doacao = Math.round(capitalDaUnidadeLocal(e) * k * 0.03 / 1000) * 1000; e.caixa += doacao; return `A gala rendeu uma doação de ${fmt(doacao)} — e fotos nos jornais.`; } return 'A gala encheu o salão e as colunas sociais. Dinheiro, por enquanto, nenhum.'; }
    /* zoológico */
    case 'recinto': { const z = s.zoo!; const h = habitat(alvo!); const q = z.recintos.find(x => x.habitat === h.id); if (q) { q.vagas += 6; q.qualidade = clamp(q.qualidade + 5); } else z.recintos.push({ id: `${e.id}-r${z.recintos.length}-${v.t}`, habitat: h.id, vagas: 8, qualidade: 78, t: v.t }); e.ativos += Math.round(d.custo * 0.8); sincronizarZoo(e); hist(q ? `Ampliou o recinto: ${h.nome.toLowerCase()}.` : `Construiu o recinto: ${h.nome.toLowerCase()}.`); return q ? `Recinto ampliado (${h.nome.toLowerCase()}): mais espaço, menos estresse.` : `Recinto novo (${h.nome.toLowerCase()}): pronto para receber.`; }
    case 'reformar_recintos': for (const q of s.zoo!.recintos) q.qualidade = clamp(q.qualidade + 18); e.ativos += Math.round(d.custo * 0.6); sincronizarZoo(e); return 'Recintos reformados: sombra, água, esconderijos, coisas para fazer. Os animais vivem melhor — e a fiscalização vê.';
    case 'receber': return receberAnimais(v, e, alvo!);
    case 'alimentacao': s.zoo!.alimentacao = Number(alvo) as Nivel3; sincronizarZoo(e); return Number(alvo) === 1 ? 'Alimentação básica: a conta cai; os animais sentem.' : Number(alvo) === 3 ? 'Alimentação e enriquecimento excelentes: custa mais; o bem-estar sobe.' : 'Alimentação adequada.';
    case 'veterinario': s.zoo!.veterinarios += alvo === 'mais' ? 1 : -1; sincronizarZoo(e); return alvo === 'mais' ? 'Mais um veterinário na equipe.' : 'Um veterinário a menos.';
    case 'educacao': s.zoo!.educacao = true; return 'Programa educativo: escolas, visitas guiadas, placas que ensinam. Atrai apoio e famílias.';
    case 'educacao_tirar': s.zoo!.educacao = false; return 'Programa educativo encerrado.';
  }
  return 'Feito.';
}

/** Decisões sobre uma obra específica do museu (verificar, expor, restaurar, emprestar): custos. */
export function custoDaObra(v: Vida, e: Empresa, id: 'verificar' | 'restaurar_obra' | 'emprestar_obra' | 'expor', obra: ObraDoMuseu): number {
  const c = custoLocal(e.municipioId) * conversao(v, e);
  return id === 'verificar' ? mil(Math.max(15000 * c, obra.valor * 0.01)) : id === 'restaurar_obra' ? mil(Math.max(20000 * c, obra.valor * 0.04)) : 0;
}

export function disponibilidadeObra(v: Vida, e: Empresa | undefined, id: 'verificar' | 'restaurar_obra' | 'emprestar_obra' | 'expor', obraId: string): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  if (!e || e.estado === 'encerrada' || !e.setor?.museu) return { ok: false, motivo: 'Só museu.' };
  if (e.papel === 'investidor') return { ok: false, motivo: 'Investidor não decide.' };
  const o = e.setor.museu.obras.find(x => x.id === obraId);
  if (!o) return { ok: false, motivo: 'A obra não está mais no acervo.' };
  if (v.anoAtual.acoes.includes(`obra:${obraId}:${id}`)) return { ok: false, motivo: 'Já decidido este ano.' };
  if (o.fora) return { ok: false, motivo: `Está emprestada a ${o.fora.instituicao}.` };
  if (id === 'verificar' && o.autenticidade === 'verificada') return { ok: false, motivo: 'Já tem laudo.' };
  if (id === 'emprestar_obra' && (o.origem === 'emprestimo' || o.autenticidade !== 'verificada')) return { ok: false, motivo: o.origem === 'emprestimo' ? 'Não é do museu.' : 'Nenhum museu sério pega obra sem laudo de autenticidade.' };
  if (id === 'restaurar_obra' && o.conservacao >= 85) return { ok: false, motivo: 'Está bem conservada.' };
  if (id === 'expor' && o.origem === 'emprestimo') return { ok: false, motivo: 'A obra emprestada fica exposta enquanto estiver aqui.' };
  const custo = custoDaObra(v, e, id, o);
  if (custo > 0 && e.caixa < custo) return okDePagar(v, custo - Math.max(0, e.caixa), 'Custa (o que o caixa não cobre sai do seu bolso)');
  return { ok: true };
}

export function decidirObra(v: Vida, e: Empresa, id: 'verificar' | 'restaurar_obra' | 'emprestar_obra' | 'expor', obraId: string): string {
  const o = e.setor!.museu!.obras.find(x => x.id === obraId)!;
  v.anoAtual.acoes.push(`obra:${obraId}:${id}`);
  const custo = custoDaObra(v, e, id, o);
  if (custo > 0) gastar(v, e, custo);
  return decidirSetorObra(v, e, id, obraId);
}
function decidirSetorObra(v: Vida, e: Empresa, id: string, obraId: string): string {
  const o = e.setor!.museu!.obras.find(x => x.id === obraId)!;
  switch (id) {
    case 'verificar': {
      o.autenticidade = 'verificada';
      if (o.falsa) { o.exposta = false; o.valor = Math.round(o.valor * 0.03); (e.historia ??= []).push({ t: v.t, texto: `${cap(o.nome)}: o laudo provou que é falso.` }); return `O laudo veio: ${o.nome} é falso. Saiu da parede antes que alguém de fora descobrisse.`; }
      e.reputacao = clamp(e.reputacao + 1);
      return `Laudo de autenticidade: ${o.nome} é o que dizia ser.`;
    }
    case 'expor': o.exposta = !o.exposta; return o.exposta ? `${cap(o.nome)} voltou para a parede.` : `${cap(o.nome)} foi para a reserva técnica.`;
    case 'restaurar_obra': o.conservacao = clamp(o.conservacao + 35); return `${cap(o.nome)}: restauro concluído. O que se perdia, parou de se perder.`;
    case 'emprestar_obra': {
      const quem = rngDe(v.id, e.id, 'fora', v.t, obraId).pick(MUSEUS_DE_FORA);
      o.fora = { instituicao: quem, ate: v.t + 12 };
      o.exposta = false;
      const taxa = Math.round(o.valor * 0.02 / 1000) * 1000;
      e.caixa += taxa;
      e.reputacao = clamp(e.reputacao + 4);
      (e.historia ??= []).push({ t: v.t, texto: `Emprestou ${o.nome} a ${quem}.` });
      return `${cap(o.nome)} vai para ${quem} por um ano: ${fmt(taxa)} de taxa e o nome do museu no catálogo de lá.`;
    }
  }
  return 'Feito.';
}

/** As obras à venda para o museu neste ano (o mercado institucional: galerias, espólios, leilões). */
export function ofertasDeObras(v: Vida, e: Empresa): { id: string; nome: string; tema: string; periodo: string; valor: number; conservacao: number; laudo: boolean; falsa: boolean; descricao: string }[] {
  if (!e.setor?.museu) return [];
  const r = rngDe(v.id, e.id, 'obras-venda', anoDe(v.t));
  const k = conversao(v, e);
  const base = capitalDaUnidadeLocal(e) * k;
  return [0, 1, 2].map(n => {
    const tema = r.pick(TEMAS_MUSEU);
    const laudo = r.chance(0.6);
    const valor = Math.round(base * (0.02 + r.next() * 0.08) * (laudo ? 1 : 0.7) / 1000) * 1000;
    return { id: `ov${anoDe(v.t)}-${n}`, nome: r.pick(tema.obras), tema: tema.id, periodo: r.pick(tema.periodos), valor, conservacao: r.int(45, 90), laudo, falsa: !laudo && r.chance(0.25), descricao: laudo ? `${tema.nome}; com laudo de autenticidade.` : `${tema.nome}; sem laudo — mais barata, e com o risco disso.` };
  }).filter(o => !e.setor!.museu!.obras.some(x => x.id === `${e.id}-${o.id}`));
}

const temaComMaisObras = (m: NonNullable<SetorDaEmpresa['museu']>) => [...TEMAS_MUSEU].sort((a, b) => m.obras.filter(o => o.tema === b.id && !o.fora).length - m.obras.filter(o => o.tema === a.id && !o.fora).length)[0]?.id;

/** Para `empresas` (a decisão antiga de exposição): o tema mais forte do acervo e a montagem dele. */
export const temaMaisForte = (e: Empresa) => (e.setor?.museu ? temaComMaisObras(e.setor.museu) : undefined);
export const montarExposicaoDoTema = (v: Vida, e: Empresa, tema: string) => montarExposicao(v, e, tema);

function montarExposicao(v: Vida, e: Empresa, tema: string): string {
  const m = e.setor!.museu!;
  const obras = m.obras.filter(o => o.tema === tema && !o.fora);
  const k = conversao(v, e);
  const valor = obras.reduce((s, o) => s + o.valor / k * (o.conservacao / 100), 0);
  const curadoria = m.curador ? m.curador.talento : 35;
  const qualidade = Math.round(clamp(20 + obras.length * 7 + Math.min(30, valor / Math.max(1, capitalDaUnidadeLocal(e)) * 60) + (curadoria - 50) * 0.6));
  for (const o of obras) if (o.origem !== 'emprestimo') o.exposta = true;
  const nome = temaMuseu(tema).nome;
  m.exposicao = { tema, t: v.t, ate: v.t + 12, qualidade, nome };
  if (e.acervo) { e.acervo.exposicao = nome; e.acervo.tExposicao = v.t; }
  e.reputacao = clamp(e.reputacao + Math.round(qualidade / 20));
  (e.historia ??= []).push({ t: v.t, texto: `Exposição "${nome}".` });
  if (qualidade >= 70) escrever(v, { texto: `A exposição "${nome}" de ${e.nome} virou assunto na cidade: fila na porta, crítica elogiando.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  return qualidade >= 70 ? `"${nome}" em cartaz: crítica elogiando, fila na porta.` : qualidade >= 45 ? `"${nome}" em cartaz: uma exposição honesta; o público vem.` : `"${nome}" em cartaz — com poucas obras e sem curadoria de nome, passa quase despercebida.`;
}

function receberAnimais(v: Vida, e: Empresa, especie: string): string {
  const z = e.setor!.zoo!;
  const x = especieDeZoo(especie)!;
  const rec = z.recintos.find(q => q.habitat === x.habitat)!;
  const r = rngDe(v.id, e.id, 'receber', especie, v.t);
  const ja = z.animais.filter(a => a.especie === especie && a.recinto === rec.id).length;
  const n = Math.max(1, x.grupo - ja);
  const novos: AnimalDoZoo[] = [];
  for (let k = 0; k < n; k++) {
    const a = novoAnimal(e, especie, rec.id, x.ameacada ? 'conservacao' : 'transferencia', v.t - r.int(1, Math.max(2, Math.round(x.vida * 0.4))) * 12, z.animais.length + k + v.t, r, x.ameacada ? 'Chegou pelo programa de conservação.' : 'Transferido de outra instituição.');
    a.chegou = v.t;
    // O par: se já há um macho, chega fêmea (e vice-versa).
    if (ja + k === 1 && z.animais.some(b => b.especie === especie)) a.genero = z.animais.find(b => b.especie === especie)!.genero === 'masculino' ? 'feminino' : 'masculino';
    novos.push(a);
    z.animais.push(a);
  }
  sincronizarZoo(e);
  (e.historia ??= []).push({ t: v.t, texto: `Recebeu ${novos.map(a => a.nome).join(', ')} (${x.nome}).` });
  return `${novos.map(a => a.nome).join(', ')} ${novos.length > 1 ? 'chegaram' : 'chegou'} (${x.nome}). Quarentena, adaptação — e, se der certo, o público vai ver.`;
}

function aceitarProposta(v: Vida, e: Empresa): string {
  const x = e.setor!.estudio!;
  const p = x.proposta!;
  delete x.proposta;
  x.creditos.push({ t: v.t, texto: `${cap(p.artista)} gravou aqui (${anoDe(v.t)}).` });
  e.reputacao = clamp(e.reputacao + 6);
  e.caixa -= Math.round(capitalDaUnidadeLocal(e) * 0.02 * p.desconto * conversao(v, e));
  (e.historia ??= []).push({ t: v.t, texto: `${cap(p.artista)} gravou aqui.` });
  return `${cap(p.artista)} gravou aqui. Rendeu pouco; o nome no encarte vale mais.`;
}

function liquidar(v: Vida, e: Empresa): string {
  const x = e.setor!.loja!;
  const perda = Math.round(capitalDaUnidadeLocal(e) * x.encalhe / 100 * 0.12 * e.unidades * conversao(v, e));
  e.caixa -= perda;
  x.encalhe = Math.round(x.encalhe * 0.2);
  e.reputacao = clamp(e.reputacao - 1);
  return `Liquidação: o estoque parado virou dinheiro — ${fmt(perda)} abaixo do custo.`;
}

/* ============================================================ leituras para a tela */

export interface Indicador { rotulo: string; valor: string; tom?: 'bom' | 'ruim' }

export function indicadoresDoSetor(v: Vida, e: Empresa): Indicador[] {
  const s = garantirSetor(v, e);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const out: Indicador[] = [];
  const tom = (bom: boolean, ruim: boolean) => (bom ? 'bom' : ruim ? 'ruim' : undefined);
  const mer = s.mercado ?? 0;
  if (Math.abs(mer) >= 0.08) out.push({ rotulo: 'O mercado ao redor', valor: mer >= 0.15 ? 'em alta: o bairro e a moda a favor' : mer > 0 ? 'melhorando' : mer <= -0.2 ? 'em queda forte: o público está indo para outro lado' : 'esfriando', tom: tom(mer > 0, mer < 0) });
  if (s.restaurante) {
    const x = s.restaurante;
    const n = x.nota ?? notaDoRestaurante(e);
    out.push({ rotulo: 'Conceito', valor: `${CONCEITOS[x.conceito].nome}, cozinha ${culinaria(x.culinaria).nome}` });
    out.push({ rotulo: 'Nota do público', valor: `${n.toFixed(1)} de 5`, tom: tom(n >= 4, n < 3) });
    out.push({ rotulo: 'Prestígio', valor: `${x.prestigio}/100`, tom: tom(x.prestigio >= 60, false) });
    out.push({ rotulo: 'Cozinha', valor: `${cozinhaDoRestaurante(e)}/100 · ingredientes ${INGREDIENTES[x.ingredientes].nome} · ${FORNECEDORES[x.fornecedor].nome.toLowerCase()}` });
    out.push({ rotulo: 'Chef', valor: x.chef ? `${x.chef.nome} (${leituraDoProfissional(v, x.chef)})` : 'sem chef', tom: x.chef ? undefined : 'ruim' });
    out.push({ rotulo: 'Salão · atendimento', valor: `${x.ambiente} · ${x.atendimento}`, tom: tom(false, x.ambiente < 40 || x.atendimento < 40) });
    if (x.pratos.length) out.push({ rotulo: 'Pratos da casa', valor: x.pratos.join('; ') });
  } else if (s.hotel) {
    const h = s.hotel;
    out.push({ rotulo: 'Categoria', valor: `${h.estrelas} estrelas · ${PUBLICOS_HOTEL[h.publico].nome.toLowerCase()}` });
    if (h.ocupacao !== undefined) out.push({ rotulo: 'Ocupação média', valor: pct(h.ocupacao), tom: tom(h.ocupacao >= 0.7, h.ocupacao < 0.45) });
    if (h.diaria) out.push({ rotulo: 'Diária de referência', valor: fmt(h.diaria) });
    out.push({ rotulo: 'Quartos', valor: `${h.quartos}/100`, tom: tom(false, h.quartos < 45) });
    out.push({ rotulo: 'Serviços', valor: h.servicos.map(id => servicoHotel(id)?.nome.toLowerCase()).filter(Boolean).join(', ') || 'nenhum' });
  } else if (s.clinica) {
    const x = s.clinica;
    out.push({ rotulo: 'Especialidades', valor: x.especialidades.map(id => especialidade(id)?.nome).filter(Boolean).join(', ') });
    out.push({ rotulo: 'Atendimento', valor: { convenios: 'só convênios', misto: 'convênios e particular', particular: 'só particular' }[x.atendimento] });
    out.push({ rotulo: 'Equipamento', valor: `${x.equipamento}/100`, tom: tom(false, x.equipamento < 45) });
    out.push({ rotulo: 'Conformidade sanitária', valor: `${x.conformidade}/100`, tom: tom(x.conformidade >= 70, x.conformidade < 50) });
  } else if (s.academia) {
    const x = s.academia;
    out.push({ rotulo: 'Modalidades', valor: x.modalidades.map(id => modalidade(id)?.nome).filter(Boolean).join(', ') });
    if (e.carteira !== undefined) out.push({ rotulo: 'Alunos matriculados', valor: String(e.carteira) });
    if (x.evasao !== undefined) out.push({ rotulo: 'Evasão no ano', valor: pct(x.evasao), tom: tom(x.evasao < 0.25, x.evasao > 0.38) });
    out.push({ rotulo: 'Equipamentos · instrutores', valor: `${x.equipamentos} · ${x.instrutores}`, tom: tom(false, x.equipamentos < 45) });
  } else if (s.estudio) {
    const x = s.estudio;
    out.push({ rotulo: 'Serviços', valor: x.servicos.map(id => servicoEstudio(id)?.nome).filter(Boolean).join(', ') });
    out.push({ rotulo: 'Equipamento', valor: `${x.equipamento}/100`, tom: tom(false, x.equipamento < 45) });
    out.push({ rotulo: 'Técnico de som', valor: x.tecnico ? `${x.tecnico.nome} (${leituraDoProfissional(v, x.tecnico)})` : 'sem técnico de nome' });
    out.push({ rotulo: 'Créditos', valor: x.creditos.length ? x.creditos.slice(-2).map(c => c.texto).join(' ') : 'ninguém conhecido gravou aqui ainda' });
  } else if (s.loja) {
    const x = s.loja;
    out.push({ rotulo: 'Segmento', valor: segmentoLoja(x.segmento).nome });
    out.push({ rotulo: 'Estoque', valor: `${({ 1: 'enxuto', 2: 'normal', 3: 'amplo' } as const)[x.estoque]} · encalhe ${x.encalhe}/100`, tom: tom(false, x.encalhe >= 45) });
    out.push({ rotulo: 'Variedade', valor: `${x.variedade}/100${x.online ? ' · vende online' : ''}` });
  } else if (s.museu) {
    const m = s.museu;
    out.push({ rotulo: 'Linha', valor: LINHAS_MUSEU[m.linha].nome });
    out.push({ rotulo: 'Obras de destaque', valor: `${m.obras.filter(o => o.exposta).length} expostas de ${m.obras.length}` });
    out.push({ rotulo: 'Em cartaz', valor: m.exposicao && v.t < m.exposicao.ate ? `"${m.exposicao.nome}" (${m.exposicao.qualidade >= 70 ? 'sucesso de crítica' : m.exposicao.qualidade >= 45 ? 'honesta' : 'fraca'})` : 'nenhuma exposição temporária' });
    out.push({ rotulo: 'Curadoria', valor: m.curador ? `${m.curador.nome} (${leituraDoProfissional(v, m.curador)})` : 'sem curador', tom: m.curador ? undefined : 'ruim' });
    out.push({ rotulo: 'Segurança', valor: `${m.seguranca}/100`, tom: tom(false, m.seguranca < 40) });
    if (m.patrocinio) out.push({ rotulo: 'Patrocínio', valor: `${m.patrocinio.nome}, ${fmt(m.patrocinio.anual)}/ano até ${anoDe(m.patrocinio.ate)}`, tom: 'bom' });
  } else if (s.zoo) {
    const z = s.zoo;
    const bem = bemEstarDoZoo(e);
    out.push({ rotulo: 'Animais', valor: `${z.animais.length} de ${new Set(z.animais.map(a => a.especie)).size} espécies` });
    out.push({ rotulo: 'Bem-estar', valor: `${bem}/100`, tom: tom(bem >= 70, bem < 55) });
    const lotados = z.recintos.filter(q => ocupacaoDoRecinto(e, q.id) > q.vagas);
    out.push({ rotulo: 'Recintos', valor: `${z.recintos.length}${lotados.length ? ` · ${lotados.length} lotado${lotados.length > 1 ? 's' : ''}` : ''}`, tom: lotados.length ? 'ruim' : undefined });
    out.push({ rotulo: 'Cuidado', valor: `alimentação ${({ 1: 'básica', 2: 'adequada', 3: 'excelente' } as const)[z.alimentacao]} · ${z.veterinarios} veterinário${z.veterinarios > 1 ? 's' : ''}${z.educacao ? ' · programa educativo' : ''}` });
  }
  return out;
}

/** O que pede atenção numa empresa (a visão geral de quem tem muitas). */
export function alertasDaEmpresa(v: Vida, e: Empresa): string[] {
  if (e.estado === 'encerrada') return [];
  const s = garantirSetor(v, e);
  const out: string[] = [];
  if (e.estado === 'em_crise') out.push('caixa no vermelho');
  if (e.estado === 'interditada') out.push('interditada');
  if (e.fachada && e.fachada.tFim === undefined) out.push('ligada a um negócio por fora');
  if (s.restaurante && (s.restaurante.nota ?? 5) < 3) out.push(`nota ${(s.restaurante.nota ?? 0).toFixed(1)}`);
  if (s.hotel && (s.hotel.ocupacao ?? 1) < 0.45) out.push(`ocupação ${Math.round((s.hotel.ocupacao ?? 0) * 100)}%`);
  if (s.clinica && s.clinica.conformidade < 50) out.push('conformidade sanitária baixa');
  if (s.academia && s.academia.equipamentos < 45) out.push('equipamentos gastos');
  if (s.estudio?.proposta) out.push('proposta de projeto esperando');
  if (s.estudio && s.estudio.equipamento < 45) out.push('equipamento velho');
  if (s.loja && s.loja.encalhe >= 45) out.push('estoque encalhado');
  if (s.museu && s.museu.obras.some(o => o.exposta && o.conservacao < 40)) out.push('obra exposta se deteriorando');
  if (s.zoo) {
    const bem = bemEstarDoZoo(e);
    if (bem < 55) out.push(`bem-estar ${bem}`);
    if (s.zoo.recintos.some(q => ocupacaoDoRecinto(e, q.id) > q.vagas)) out.push('recinto lotado');
  }
  return out;
}

/** A pessoa transfere um animal seu (de estimação) para o próprio zoológico: o mesmo bicho, com nome, idade e história. */
export function receberAnimalDeEstimacao(v: Vida, e: Empresa, especieDoZoo: string, nome: string, genero: 'masculino' | 'feminino', nasceu: number, saude: number, deQuem: string, historia: string): AnimalDoZoo | undefined {
  const z = garantirSetor(v, e).zoo;
  const x = especieDeZoo(especieDoZoo);
  if (!z || !x) return undefined;
  const rec = z.recintos.find(q => q.habitat === x.habitat);
  if (!rec) return undefined;
  const a: AnimalDoZoo = { id: `${e.id}-pet-${deQuem}`, especie: x.id, nome, genero, nasceu, saude: clamp(Math.round(saude)), origem: 'doacao', recinto: rec.id, chegou: v.t, historia: [historia], deQuem };
  z.animais.push(a);
  sincronizarZoo(e);
  return a;
}

export { HABITATS, ESPECIES_ZOO };
