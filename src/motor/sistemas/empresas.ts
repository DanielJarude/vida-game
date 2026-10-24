/**
 * REWORK 12 — AS EMPRESAS DA PESSOA: ser dona, sócia ou investidora sem largar a profissão.
 *
 * A empresa é separada da pessoa. O caixa é dela; o lucro só vira dinheiro seu quando é DISTRIBUÍDO (e só na sua
 * parte). O que entra no seu patrimônio é o valor da sua participação (a avaliação da empresa × a parte) — uma
 * vez, já com o caixa e as instalações dentro (nunca os dois somados de novo).
 *
 * Quem toca o dia a dia importa: tocar você mesmo custa horas da semana (e rende mais para quem é do ramo);
 * contratar um gestor custa salário, e o resultado depende de quem foi contratado (o que só se vê com o tempo).
 * O investidor não decide nada: recebe o que for distribuído e pode vender a parte.
 *
 * Nada aqui garante lucro. A procura anda com a reputação, a qualidade, o preço, a cidade, a economia e o acaso;
 * os custos não perguntam se o ano foi bom. Um ano ruim aperta; o caixa no vermelho por anos seguidos leva à
 * falência — com saídas antes dela (pôr dinheiro, trocar a gestão, cortar custos, vender, fechar).
 */

import type { Empresa, PapelNaEmpresa, PrecoEmpresa, TipoEmpresa, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { economiaLocal, municipio, paisDaCidade, pertoDaAgua } from '../dados/lugares';
import { GESTORES, NOMES_DE_EMPRESA, TIPOS_DE_EMPRESA, tipoDeEmpresa, type TipoDeEmpresa } from '../dados/empresas';
import { converterEntrePaises } from '../mundo/moeda';
import { paisDaVida } from '../mundo/vida';
import { okDePagar } from './dinheiro';
import { lancar } from './extrato';
import type { Veredito } from '../plausibilidade';

export const empresas = (v: Vida): Empresa[] => v.financas.empresas ?? [];
export const empresasAtivas = (v: Vida) => empresas(v).filter(e => e.estado !== 'encerrada');
export const empresa = (v: Vida, id: string) => empresas(v).find(e => e.id === id);

/** O valor da sua parte (o que entra no patrimônio). */
export const valorDaParte = (e: Empresa) => (e.estado === 'encerrada' ? 0 : Math.max(0, e.avaliacao ?? 0) * e.parte);
export const valorDasEmpresas = (v: Vida) => empresas(v).reduce((s, e) => s + valorDaParte(e), 0);

/* ------------------------------------------------------- O lugar e o ramo */

/** O quanto a cidade rende para este tipo (o porte; o turismo para hotel, museu e zoológico). */
function fatorDaCidade(t: TipoDeEmpresa, municipioId: string): number {
  const p = municipio(municipioId).perfil;
  const porte = { metropole: 1.25, capital: 1, metropolitana: 0.85, polo: 0.75, pequena: 0.5 }[p] ?? 0.8;
  return t.turismo ? porte * (pertoDaAgua(municipioId) ? 1.15 : 1) : porte;
}

/** Os preços da cidade (o prato, a diária, o salário) — o custo de vida e o nível de salário locais. */
const custoLocal = (municipioId: string) => economiaLocal(municipioId).custo;
const salarioLocal = (municipioId: string) => economiaLocal(municipioId).salario;

/** Os números de uma empresa em outro país estão nos preços de lá: convertidos para os da vida. */
const conversao = (v: Vida, e: Empresa) => converterEntrePaises(1, paisDaCidade(e.municipioId), paisDaVida(v));

/** A pessoa é do ramo (o médico e a clínica, o músico e o estúdio)? */
export function doRamo(v: Vida, tipo: TipoEmpresa): boolean {
  const t = tipoDeEmpresa(tipo);
  const ocs = [v.trabalho.atual?.ocupacaoId, v.trabalho.paralela?.ocupacaoId, ...v.trabalho.historico.slice(-4).map(h => h.ocupacaoId)].filter((x): x is string => !!x);
  return ocs.some(o => t.doRamo.test(o));
}

/** A competência de quem toca (0..100). A própria cresce com os anos; a do gestor contratado é a que ele tem. */
export function competenciaDaGestao(v: Vida, e: Empresa): number {
  if (e.gestao.quem === 'contratada') return e.gestao.competencia ?? 50;
  const anos = Math.min(10, (v.t - e.gestao.tInicio) / 12);
  // Quem toca aprende com os anos — até um teto: a pessoa tem outra profissão (e quem não é do ramo para mais cedo).
  return clamp(40 + anos * 2.5 + (doRamo(v, e.tipo) ? 10 : 0) + (v.caminhos.negocio ? 5 : 0), 0, doRamo(v, e.tipo) ? 76 : 66);
}

/** A competência do gestor só aparece com o tempo (a tela diz em palavras, nunca em número). */
export function leituraDoGestor(v: Vida, e: Empresa): string {
  if ((v.t - e.gestao.tInicio) / 12 < 1) return 'ainda é cedo para saber';
  const c = competenciaDaGestao(v, e);
  return c >= 70 ? 'muito boa' : c >= 55 ? 'boa' : c >= 40 ? 'irregular' : 'fraca';
}

/** Quem está à frente, em palavras. */
export function quemToca(e: Empresa): string {
  if (e.papel === 'investidor') return 'a gestão dos sócios majoritários';
  return e.gestao.quem === 'propria' ? 'você' : `${e.gestao.nome ?? 'um gestor'} (contratad${/a$/.test((e.gestao.nome ?? '').split(' ')[0]) ? 'a' : 'o'})`;
}

/* ------------------------------------------------------- Os custos fixos */

/** O que a empresa custa por ano, antes de vender nada (folha, ponto, manutenção, gestão, o específico do tipo). */
export function custosFixos(v: Vida, e: Empresa): { rotulo: string; valor: number }[] {
  const t = tipoDeEmpresa(e.tipo);
  const s = salarioLocal(e.municipioId);
  const c = custoLocal(e.municipioId);
  const out: { rotulo: string; valor: number }[] = [];
  out.push({ rotulo: 'Folha (com encargos)', valor: e.equipe * t.salario * 12 * s });
  if (t.ponto) out.push({ rotulo: 'Aluguel do ponto', valor: t.ponto * e.unidades * Math.pow(c, 1.4) });
  // As instalações estão contadas na unidade de onde a vida está; a conta do ano é feita nos preços da cidade da empresa.
  const k = conversao(v, e);
  out.push({ rotulo: 'Manutenção das instalações', valor: e.ativos / k * t.manutencao });
  if (e.gestao.quem === 'contratada' && e.gestao.salario) out.push({ rotulo: 'Gestor contratado', valor: e.gestao.salario * 12 * s });
  if (t.responsavel && !(e.gestao.quem === 'propria' && v.trabalho.atual && t.responsavel.ocupacao.test(v.trabalho.atual.ocupacaoId))) out.push({ rotulo: `${t.responsavel.rotulo.charAt(0).toUpperCase()}${t.responsavel.rotulo.slice(1)}`, valor: t.responsavel.salario * 12 * s });
  if (e.acervo) out.push({ rotulo: 'Conservação do acervo', valor: e.acervo.valor / k * 0.025 });
  if (e.zoo) out.push({ rotulo: 'Alimentação, veterinária e recintos', valor: e.zoo.recintos * 95000 * c * (0.7 + e.zoo.bemEstar / 170) + (e.zoo.conservacao ? 600000 * c : 0) });
  return out;
}

/* ------------------------------------------------------- Abrir e comprar */

export interface PlanoDeAbertura { tipo: TipoEmpresa; capital: number; capitalDaPessoa: number; comSocio: boolean; custoAnual: number; receitaTipica: number; disponivel: boolean; motivo?: string }

/** O que abrir custa aqui, hoje (com sócio, metade). */
export function planoDeAbertura(v: Vida, tipo: TipoEmpresa, comSocio: boolean): PlanoDeAbertura {
  const t = tipoDeEmpresa(tipo);
  const onde = v.moradia.municipioId;
  const capital = Math.round(t.capital * Math.pow(custoLocal(onde), 1.2) / 1000) * 1000;
  const capitalDaPessoa = comSocio ? Math.round(capital / 2 / 1000) * 1000 : capital;
  const rascunho = novaEmpresa(v, tipo, comSocio, 'teste');
  const custoAnual = Math.round(custosFixos(v, rascunho).reduce((s, x) => s + x.valor, 0) / 1000) * 1000;
  const receitaTipica = Math.round(t.publico * fatorDaCidade(t, onde) * t.ticket.medio * custoLocal(onde) / 1000) * 1000;
  const grande = ['metropole', 'capital'].includes(municipio(onde).perfil);
  const motivo = idade(v) < 18 ? 'A partir dos 18.' : t.cidadeGrande && !grande ? `${t.rotulo} pede cidade grande: público e equipe especializada não existem aqui.` : empresasAtivas(v).filter(e => e.papel !== 'investidor').length >= 4 ? 'Já são quatro empresas: mais uma, ninguém acompanha.' : undefined;
  return { tipo, capital, capitalDaPessoa, comSocio, custoAnual, receitaTipica, disponivel: !motivo, motivo };
}

function novaEmpresa(v: Vida, tipo: TipoEmpresa, comSocio: boolean, id: string): Empresa {
  const t = tipoDeEmpresa(tipo);
  const onde = v.moradia.municipioId;
  const capital = Math.round(t.capital * Math.pow(custoLocal(onde), 1.2) / 1000) * 1000;
  const r = rngDe(v.id, id, 'nome');
  const nome = r.pick(NOMES_DE_EMPRESA[tipo]).replace('{sobrenome}', v.eu.sobrenome.split(' ').slice(-1)[0] ?? 'Silva');
  return {
    id, tipo, nome, municipioId: onde, tInicio: v.t, papel: comSocio ? 'socio' : 'dono', parte: comSocio ? 0.5 : 1, investido: comSocio ? capital / 2 : capital,
    caixa: Math.round(capital * (1 - t.ativos)), ativos: Math.round(capital * t.ativos), unidades: 1, qualidade: 62, reputacao: t.obra ? 45 : 40, equipe: t.equipe, preco: 'medio',
    gestao: { quem: 'contratada', ...gestorNovo(v, id, 0, tipo), tInicio: v.t }, distribuir: true, anosNoVermelho: 0, estado: t.obra ? 'abrindo' : 'operando',
    ...(tipo === 'museu' ? { acervo: { valor: Math.round(capital * 0.35), conservacao: 75, pecas: 120 } } : {}),
    ...(tipo === 'zoologico' ? { zoo: { bemEstar: 70, recintos: 24, especies: 40, licenca: false, conservacao: false } } : {}),
    ...(comSocio ? { socio: r.pick(GESTORES)[r.chance(0.5) ? 0 : 1] } : {}),
    avaliacao: capital, historia: [{ t: v.t, texto: `Aberto${t.artigo === 'a' ? 'a' : ''} com ${fmt(capital)}${comSocio ? ', meio a meio com um sócio' : ''}.` }]
  };
}

/**
 * Um gestor para contratar: a competência é sorteada (e só se mostra com o tempo); quem é melhor cobra mais — e
 * o gerente de um estúdio não ganha o que ganha o diretor de um hotel (o salário segue o porte do negócio).
 */
function gestorNovo(v: Vida, id: string, n: number, tipo?: TipoEmpresa): { nome: string; competencia: number; salario: number } {
  const r = rngDe(v.id, id, 'gestor', n, v.t);
  const competencia = Math.round(clamp(55 + r.normal() * 16, 15, 92));
  const [m, f] = r.pick(GESTORES);
  const escala = clamp(Math.sqrt(tipoDeEmpresa(tipo ?? 'loja').capital / 1e6), 0.45, 2.5);
  return { nome: r.chance(0.5) ? m : f, competencia, salario: Math.round((6000 + competencia * 100) * escala / 100) * 100 };
}

export function abrirEmpresa(v: Vida, tipo: TipoEmpresa, comSocio: boolean): string {
  const p = planoDeAbertura(v, tipo, comSocio);
  const id = `em${v.seq++}`;
  const e = novaEmpresa(v, tipo, comSocio, id);
  v.financas.conta -= p.capitalDaPessoa;
  (v.financas.empresas ??= []).push(e);
  const t = tipoDeEmpresa(tipo);
  escrever(v, { texto: `Abriu ${t.nome}: ${e.nome}${comSocio ? `, em sociedade com ${e.socio}` : ''}. ${t.obra ? 'Primeiro, um ano de obra.' : 'As portas abrem este ano.'}`, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  if (!temFato(v, 'abriu_empresa')) marcarFato(v, 'abriu_empresa');
  return `${e.nome} ${t.obra ? 'começa a obra' : 'abre as portas'}. Quem toca o dia a dia é ${e.gestao.nome}, contratad${/a$/.test((e.gestao.nome ?? '').split(' ')[0]) ? 'a' : 'o'} — dá para assumir você mesm${v.eu.genero === 'feminino' ? 'a' : 'o'}.`;
}

/* ---------------------------------------------- Participações à venda */

export interface OfertaDeParticipacao { id: string; tipo: TipoEmpresa; nome: string; parte: number; preco: number; avaliacao: number; historico: number[]; papel: PapelNaEmpresa }

/**
 * Participações que aparecem no ano (cidade grande): uma fatia de um hotel, de uma clínica, de uma academia — com
 * o histórico dos últimos anos (o que se sabe de verdade). O preço é a avaliação; o resultado, ninguém promete.
 */
export function ofertasDeParticipacao(v: Vida): OfertaDeParticipacao[] {
  const onde = v.moradia.municipioId;
  if (!['metropole', 'capital'].includes(municipio(onde).perfil) || idade(v) < 18) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v.economia?.semente ?? 1, 'participacoes', ano, onde);
  const out: OfertaDeParticipacao[] = [];
  for (let k = 0; k < 2; k++) {
    const t = r.pick(TIPOS_DE_EMPRESA.filter(x => x.id !== 'zoologico' && x.id !== 'museu'));
    const base = t.capital * Math.pow(custoLocal(onde), 1.2) * (0.9 + r.next() * 0.8);
    // Os últimos anos: a média diz se é boa; a dispersão, o risco. Às vezes quem vende está saindo de um negócio ruim.
    const media = base * (r.normal() * 0.08 + 0.07);
    const historico = [0, 1, 2].map(() => Math.round(media * (1 + r.normal() * 0.6) / 1000) * 1000);
    const lucro = historico.reduce((s, x) => s + x, 0) / 3;
    const avaliacao = Math.round(Math.max(base * 0.45, base * 0.3 + Math.max(0, lucro) * 4.5) / 1000) * 1000;
    const parte = r.pick([0.1, 0.2, 0.3]);
    const nome = r.pick(NOMES_DE_EMPRESA[t.id]).replace('{sobrenome}', r.pick(['Albuquerque', 'Ferraz', 'Monteiro', 'Duarte', 'Siqueira']));
    out.push({ id: `pa-${ano}-${k}`, tipo: t.id, nome, parte, preco: Math.round(avaliacao * parte / 1000) * 1000, avaliacao, historico, papel: 'investidor' });
  }
  return out;
}

export function comprarParticipacao(v: Vida, ofertaId: string): string {
  const o = ofertasDeParticipacao(v).find(x => x.id === ofertaId)!;
  const t = tipoDeEmpresa(o.tipo);
  const id = `em${v.seq++}`;
  const e = novaEmpresa(v, o.tipo, false, id);
  const media = o.historico.reduce((s, x) => s + x, 0) / 3;
  Object.assign(e, {
    nome: o.nome, papel: 'investidor', parte: o.parte, investido: o.preco, avaliacao: o.avaliacao, estado: 'operando', reputacao: 50 + Math.round(clamp(media / Math.max(1, t.capital) * 300, -20, 25)), qualidade: 60,
    caixa: Math.round(o.avaliacao * 0.08), ativos: Math.round(o.avaliacao * 0.6), historico: o.historico, socio: 'os sócios majoritários',
    historia: [{ t: v.t, texto: `Comprou ${Math.round(o.parte * 100)}% por ${fmt(o.preco)}.` }]
  } satisfies Partial<Empresa>);
  if (e.zoo) delete e.zoo;
  if (e.acervo) delete e.acervo;
  v.financas.conta -= o.preco;
  v.anoAtual.acoes.push(`participacao:${ofertaId}`);
  (v.financas.empresas ??= []).push(e);
  escrever(v, { texto: `Comprou ${Math.round(o.parte * 100)}% de ${t.nome}: ${o.nome}. Sócio${v.eu.genero === 'feminino' ? 'a' : ''} investidor${v.eu.genero === 'feminino' ? 'a' : ''} — sem mandar em nada, com parte no que sobrar.`, relevancia: 'biografia', tema: 'dinheiro', escolha: true });
  return `Agora ${Math.round(o.parte * 100)}% d${t.artigo === 'a' ? 'a' : 'o'} ${o.nome} são seus. O que vier, vem quando os sócios distribuírem.`;
}

/* ------------------------------------------------------------------ O ano */

const CICLO: Record<string, number> = { expansao: 1.06, normal: 1, desaceleracao: 0.95, crise: 0.84, recuperacao: 0.98 };

/** O público possível no ano (antes do teto da casa). */
function procura(v: Vida, e: Empresa, r: Rng): number {
  const t = tipoDeEmpresa(e.tipo);
  const fase = CICLO[v.economia?.fase ?? 'normal'] ?? 1;
  const ciclo = 1 + (fase - 1) * t.ciclo;
  const rep = 0.45 + e.reputacao / 90;
  const qual = 0.75 + e.qualidade / 250;
  const gestao = 0.85 + competenciaDaGestao(v, e) / 380;
  const sorte = Math.max(0.55, 1 + r.normal() * 0.12);
  let base = t.publico * e.unidades * fatorDaCidade(t, e.municipioId) * rep * qual * gestao * t.procura[e.preco] * ciclo * sorte;
  if (e.tipo === 'museu' && e.acervo) base *= (0.6 + Math.min(1.2, (e.acervo.valor + valorCedidoAoMuseu(v, e)) / Math.max(1, t.capital * 0.6)) * 0.4) * (e.acervo.exposicao && v.t - (e.acervo.tExposicao ?? 0) < 12 ? 1.45 : 1);
  if (e.tipo === 'zoologico' && e.zoo) base *= (0.55 + e.zoo.bemEstar / 220) * (0.7 + e.zoo.especies / 130);
  if (e.tipo === 'estudio' && doRamo(v, 'estudio') && e.papel !== 'investidor') base *= 1 + Math.min(0.5, (v.notoriedade?.valor ?? 0) / 120);
  return base;
}

export interface ResultadoDoAno { publico: number; receita: number; custos: number; apoio: number; imposto: number; resultado: number }

/** As contas de um ano (sem mexer em nada): a procura, o teto, a receita, os custos, o apoio, o imposto. */
export function contasDoAno(v: Vida, e: Empresa, r: Rng): ResultadoDoAno {
  const t = tipoDeEmpresa(e.tipo);
  const c = custoLocal(e.municipioId);
  if (e.estado === 'abrindo' || e.estado === 'interditada') {
    const fixos = custosFixos(v, e).reduce((s, x) => s + x.valor, 0) * (e.estado === 'abrindo' ? 0.35 : 0.8);
    return { publico: 0, receita: 0, custos: Math.round(fixos), apoio: 0, imposto: 0, resultado: -Math.round(fixos) };
  }
  // A capacidade cresce com a equipe (a clínica atende o que os profissionais dão conta; a academia, o que a sala comporta).
  const teto = t.capacidade * e.unidades * Math.min(1.3, 0.55 + 0.45 * e.equipe / (t.equipe * e.unidades));
  let publico: number;
  if (e.tipo === 'academia') {
    // A carteira: entra quem a procura traz; sai quem desiste (mais no popular, menos com qualidade).
    const evasao = clamp(0.42 - e.qualidade / 400 + (e.preco === 'popular' ? 0.06 : e.preco === 'alto' ? -0.06 : 0), 0.18, 0.55) / 1;
    const antes = e.carteira ?? Math.round(t.publico * e.unidades * 0.7);
    publico = Math.round(Math.min(teto, antes * (1 - evasao) + procura(v, e, r) * evasao * 1.1));
    e.carteira = publico;
  } else publico = Math.round(Math.min(teto, procura(v, e, r)));
  const receita = publico * t.ticket[e.preco] * c;
  const fixos = custosFixos(v, e).reduce((s, x) => s + x.valor, 0);
  const custos = fixos + receita * (t.variavel + t.outros);
  // O apoio (museu, zoológico): patrocínio e incentivo cobrem parte do custo — mais para quem tem reputação e cuida bem.
  const cuidado = e.zoo ? e.zoo.bemEstar / 100 * (e.zoo.conservacao ? 1.3 : 1) : e.acervo ? e.acervo.conservacao / 100 : 1;
  const apoio = t.apoio ? custos * t.apoio * clamp((e.reputacao - 20) / 70, 0, 1.2) * cuidado : 0;
  const antesDoImposto = receita + apoio - custos;
  const imposto = Math.max(0, antesDoImposto) * 0.24 + receita * 0.03;
  return { publico, receita: Math.round(receita), custos: Math.round(custos), apoio: Math.round(apoio), imposto: Math.round(imposto), resultado: Math.round(antesDoImposto - imposto) };
}

/** O ano de todas as empresas da pessoa. */
export function processarEmpresas(v: Vida, r: Rng): void {
  for (const e of empresasAtivas(v)) processarEmpresa(v, e, r);
}

function processarEmpresa(v: Vida, e: Empresa, r: Rng): void {
  // Quem se mudou não toca de longe: a gestão passa a alguém contratado (a empresa fica onde está).
  if (e.gestao.quem === 'propria' && e.municipioId !== v.moradia.municipioId) empresasNaMudanca(v, v.moradia.municipioId);
  const k = conversao(v, e);
  const contas = contasDoAno(v, e, r);
  const resultado = Math.round(contas.resultado * k);
  // O caixa no vermelho paga juros (o cheque especial da empresa).
  if (e.caixa < 0) e.caixa = Math.round(e.caixa * 1.12);
  e.caixa += resultado;
  let nota: string | undefined;
  if (e.estado === 'abrindo') {
    e.estado = 'operando';
    if (e.zoo) e.zoo.licenca = true;
    nota = 'Obra concluída: abriu ao público.';
    escrever(v, { texto: `${e.nome} abriu ao público.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  } else if (e.estado === 'interditada') {
    if (!e.zoo || e.zoo.bemEstar >= 55) { e.estado = 'operando'; if (e.zoo) e.zoo.licenca = true; nota = 'A interdição foi levantada.'; }
  }
  // A distribuição: o LUCRO acumulado que passa de uma reserva (dois meses de custo) vai aos donos — a sua parte cai
  // na sua conta. O capital que se pôs para abrir não volta como "lucro": só o que a empresa ganhou.
  let distribuido = 0;
  e.retido = (e.retido ?? 0) + resultado;
  const reserva = contas.custos * k / 6;
  if (e.distribuir && e.caixa > reserva && e.retido > 0 && e.estado === 'operando') {
    distribuido = Math.round(Math.min(e.caixa - reserva, e.retido) * 0.8);
    e.retido -= distribuido;
    e.caixa -= distribuido;
    const minha = Math.round(distribuido * e.parte);
    v.financas.conta += minha;
    lancar(v, `Lucros distribuídos: ${e.nome}`, 'renda', minha);
  }
  // A qualidade se gasta devagar (a manutenção de rotina já está nos custos); quem toca bem segura, quem toca mal deixa cair.
  // A reputação caminha para o que a casa entrega (a qualidade e a gestão) — não sobe para sempre só porque o tempo passa.
  e.qualidade = clamp(Math.round(e.qualidade - 1.5 + (competenciaDaGestao(v, e) - 55) / 25));
  const alvo = Math.min(82, e.qualidade * 0.85 + (competenciaDaGestao(v, e) - 50) / 4);
  e.reputacao = clamp(Math.round(e.reputacao + (alvo - e.reputacao) * 0.25 + r.normal() * 4));
  // A concorrência: de tempos em tempos abre alguém igual perto (ou o bairro muda) — o público some por uns anos.
  if (e.estado === 'operando' && r.chance(e.tipo === 'museu' || e.tipo === 'zoologico' ? 0.04 : 0.12)) {
    e.reputacao = clamp(e.reputacao - r.int(8, 18));
    nota = nota ?? (e.tipo === 'museu' || e.tipo === 'zoologico' ? 'Uma atração nova na cidade dividiu o público.' : 'Abriu um concorrente parecido perto: parte do público foi experimentar.');
  }
  e.ativos = Math.round(e.ativos * 0.93);
  if (e.acervo) e.acervo.conservacao = clamp(Math.round(e.acervo.conservacao - 2 + (e.caixa > 0 ? 1 : -2)));
  if (e.zoo) zooNoAno(v, e, r);
  // O vermelho: um ano ruim aperta; anos seguidos com o caixa negativo levam à crise e, depois, à falência.
  if (e.caixa < 0) { e.anosNoVermelho += 1; if (e.estado === 'operando') e.estado = 'em_crise'; }
  else { e.anosNoVermelho = 0; if (e.estado === 'em_crise') e.estado = 'operando'; }
  e.historico = [...(e.historico ?? []), resultado].slice(-6);
  e.ultimo = { t: v.t, publico: contas.publico, receita: Math.round(contas.receita * k), custos: Math.round(contas.custos * k), apoio: contas.apoio ? Math.round(contas.apoio * k) : undefined, imposto: Math.round(contas.imposto * k), resultado, distribuido, nota };
  avaliar(v, e);
  if (e.anosNoVermelho >= 3 && e.caixa < -contas.custos * k * 0.5) falir(v, e);
}

/** O zoológico no ano: o bem-estar segue o que se gasta e a equipe; a fiscalização vem, e às vezes interdita. */
function zooNoAno(v: Vida, e: Empresa, r: Rng): void {
  const z = e.zoo!;
  const t = tipoDeEmpresa('zoologico');
  const equipe = e.equipe / t.equipe;
  z.bemEstar = clamp(Math.round(z.bemEstar + (equipe - 1) * 20 + (e.caixa < 0 ? -6 : 1) - 2 + r.normal() * 3));
  if (r.chance(0.35) || z.bemEstar < 45) {
    z.tFiscalizacao = v.t;
    if (z.bemEstar < 40) {
      e.estado = 'interditada';
      z.licenca = false;
      e.reputacao = clamp(e.reputacao - 25);
      e.caixa -= Math.round(400000 * custoLocal(e.municipioId));
      escrever(v, { texto: `A fiscalização interditou ${e.nome}: recintos sem condição, animais sem o cuidado devido. Multa, manchete e portas fechadas até corrigir.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    } else if (z.bemEstar < 55) {
      e.caixa -= Math.round(120000 * custoLocal(e.municipioId));
      escrever(v, { texto: `A fiscalização passou por ${e.nome} e deixou prazo e multa: o bem-estar dos animais está abaixo do exigido.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    }
  }
}

/**
 * O valor da empresa inteira: o maior entre o que sobraria fechando (as instalações vendidas com desconto, mais o
 * caixa) e o que um comprador pagaria pelo que ela rende (uns quatro a cinco anos do lucro médio recente, mais o
 * caixa). Nunca abaixo de zero (a responsabilidade é limitada — a dívida da empresa não é avaliada como sua).
 */
export function avaliar(v: Vida, e: Empresa): number {
  const h = e.historico ?? [];
  const media = h.length ? h.slice(-3).reduce((s, x) => s + x, 0) / Math.min(3, h.length) : 0;
  const acervo = e.acervo ? e.acervo.valor * 0.6 * conversao(v, e) : 0;
  const liquidacao = e.ativos * 0.45 + e.caixa + acervo;
  const operacao = Math.max(0, media) * 4.5 + e.caixa + e.ativos * 0.3 + acervo;
  e.avaliacao = Math.max(0, Math.round(Math.max(liquidacao, operacao) / 1000) * 1000);
  return e.avaliacao;
}

/**
 * A falência: as instalações vão a leilão, a equipe é desligada, a empresa fecha. A dívida que o caixa não cobre
 * fica em parte com quem a tocava (o aval pessoal que todo banco pede): um acordo parcelado, não uma ruína
 * instantânea. A história fica.
 */
function falir(v: Vida, e: Empresa): void {
  const sobra = e.ativos * 0.3 + e.caixa;
  e.estado = 'encerrada';
  e.tFim = v.t;
  e.avaliacao = 0;
  if (sobra < 0 && e.papel !== 'investidor') {
    const aval = Math.round(-sobra * e.parte * 0.5 / 100) * 100;
    v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'acordo', saldo: aval, jurosMes: 0.012, parcela: Math.max(200, Math.round(aval / 48)), descricao: `Aval da falência: ${e.nome}`, tInicio: v.t, prazo: 48 });
  }
  (e.historia ??= []).push({ t: v.t, texto: 'Faliu.' });
  escrever(v, { texto: `${e.nome} faliu, depois de ${Math.max(1, Math.round((v.t - e.tInicio) / 12))} anos. ${e.papel === 'investidor' ? 'A parte que era sua virou nada.' : sobra < 0 ? 'O que o leilão não cobriu, uma parte ficou com você, parcelada.' : 'O leilão das instalações pagou as contas.'}`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
}

/* -------------------------------------------------------------- Decisões */

export type DecisaoEmpresa = 'assumir' | 'contratar_gestor' | 'melhorar' | 'contratar' | 'cortar' | 'expandir' | 'preco_popular' | 'preco_medio' | 'preco_alto' | 'distribuir' | 'reinvestir' | 'aportar' | 'vender' | 'vender_parte' | 'encerrar' | 'exposicao' | 'bem_estar' | 'conservacao';

const capitalDaUnidade = (e: Empresa) => Math.round(tipoDeEmpresa(e.tipo).capital * Math.pow(custoLocal(e.municipioId), 1.2) / 1000) * 1000;

/** Quanto custa cada decisão (o que sai do caixa — e, se o caixa não tem, do seu bolso como aporte). */
export function custoDaDecisao(v: Vida, e: Empresa, d: DecisaoEmpresa): number {
  const cap = capitalDaUnidade(e) * conversao(v, e);
  switch (d) {
    case 'melhorar': return Math.round(cap * 0.12 * e.unidades / 1000) * 1000;
    case 'expandir': return Math.round(cap * 0.9 / 1000) * 1000;
    case 'aportar': return Math.round(Math.max(cap * 0.1, -e.caixa + cap * 0.05) / 1000) * 1000;
    case 'exposicao': return Math.round(cap * 0.06 / 1000) * 1000;
    case 'bem_estar': return Math.round(cap * 0.05 / 1000) * 1000;
    case 'cortar': return Math.round(tipoDeEmpresa(e.tipo).salario * 2 * 2 * salarioLocal(e.municipioId) * conversao(v, e));
    case 'encerrar': return Math.max(0, Math.round((e.equipe * tipoDeEmpresa(e.tipo).salario * 2 * salarioLocal(e.municipioId) + (e.zoo ? e.zoo.recintos * 60000 : 0)) * conversao(v, e) - Math.max(0, e.caixa + e.ativos * 0.35)));
    default: return 0;
  }
}

/** O valor da venda da sua parte (um comprador negocia para baixo; a corretagem fica com 5%). */
export const valorDeVendaDaParte = (e: Empresa) => Math.round(valorDaParte(e) * 0.85 / 1000) * 1000;

export function disponibilidadeEmpresa(v: Vida, e: Empresa | undefined, d: DecisaoEmpresa): Pick<Veredito, 'motivo'> & { ok: boolean; resgate?: Veredito['resgate'] } {
  if (!e || e.estado === 'encerrada') return { ok: false, motivo: 'Essa empresa não existe mais.' };
  if (e.papel === 'investidor' && d !== 'vender') return { ok: false, motivo: 'Investidor não decide: só recebe e pode vender a parte.' };
  if (v.anoAtual.acoes.includes(`empresa:${e.id}:${d}`)) return { ok: false, motivo: 'Já decidido este ano.' };
  const longe = e.municipioId !== v.moradia.municipioId;
  const pagar = (x: number, oque: string) => (e.caixa >= x ? { ok: true } : okDePagar(v, x - Math.max(0, e.caixa), oque));
  switch (d) {
    case 'assumir':
      if (e.gestao.quem === 'propria') return { ok: false, motivo: 'Já é você quem toca.' };
      if (longe) return { ok: false, motivo: 'De outra cidade, não dá para tocar o dia a dia.' };
      return { ok: true };
    case 'contratar_gestor': return { ok: true };
    case 'melhorar': return pagar(custoDaDecisao(v, e, d), 'A reforma custa');
    case 'expandir':
      if (e.unidades >= 4) return { ok: false, motivo: 'Já são quatro unidades.' };
      if (e.tipo === 'museu' || e.tipo === 'zoologico') return { ok: false, motivo: 'Não se abre filial de museu ou de zoológico.' };
      if (e.estado !== 'operando') return { ok: false, motivo: 'Primeiro, sair da crise.' };
      return pagar(custoDaDecisao(v, e, d), 'A nova unidade custa');
    case 'contratar': return { ok: true };
    case 'cortar': return e.equipe <= Math.ceil(tipoDeEmpresa(e.tipo).equipe * e.unidades * 0.5) ? { ok: false, motivo: 'Menos que isso, não abre as portas.' } : { ok: true };
    case 'preco_popular': case 'preco_medio': case 'preco_alto': return e.preco === d.slice(6) ? { ok: false, motivo: 'Já é esse o preço.' } : { ok: true };
    case 'distribuir': return e.distribuir ? { ok: false, motivo: 'Já distribui.' } : { ok: true };
    case 'reinvestir': return e.distribuir ? { ok: true } : { ok: false, motivo: 'Já reinveste tudo.' };
    case 'aportar': return okDePagar(v, custoDaDecisao(v, e, d), 'O aporte é de');
    case 'vender': return valorDeVendaDaParte(e) > 0 ? { ok: true } : { ok: false, motivo: 'Ninguém compra uma empresa que só dá prejuízo — o caminho é fechar.' };
    case 'vender_parte':
      if (e.papel === 'investidor') return { ok: false, motivo: 'Investidor vende a parte inteira.' };
      if (e.parte <= 0.5) return { ok: false, motivo: 'Vender mais tiraria o controle: aí é vender tudo.' };
      return valorDeVendaDaParte(e) > 0 ? { ok: true } : { ok: false, motivo: 'Ninguém compra parte de uma empresa que só dá prejuízo.' };
    case 'encerrar': return okDePagar(v, custoDaDecisao(v, e, d), 'Fechar custa (rescisões, contas, transferências)');
    case 'exposicao': return e.acervo ? pagar(custoDaDecisao(v, e, d), 'A exposição custa') : { ok: false, motivo: 'Só museu.' };
    case 'bem_estar': return e.zoo ? pagar(custoDaDecisao(v, e, d), 'A obra nos recintos custa') : { ok: false, motivo: 'Só zoológico.' };
    case 'conservacao': return e.zoo ? (e.zoo.conservacao ? { ok: false, motivo: 'O programa já existe.' } : { ok: true }) : { ok: false, motivo: 'Só zoológico.' };
  }
}

/** Tira do caixa; o que faltar sai da sua conta (um aporte, contado como investido). */
function gastar(v: Vida, e: Empresa, valor: number): void {
  const doCaixa = Math.min(Math.max(0, e.caixa), valor);
  e.caixa -= doCaixa;
  const resto = valor - doCaixa;
  if (resto > 0) { v.financas.conta -= resto; e.investido += resto; }
}

export function decidirEmpresa(v: Vida, e: Empresa, d: DecisaoEmpresa): string {
  v.anoAtual.acoes.push(`empresa:${e.id}:${d}`);
  const t = tipoDeEmpresa(e.tipo);
  const custo = custoDaDecisao(v, e, d);
  const hist = (texto: string) => (e.historia ??= []).push({ t: v.t, texto });
  switch (d) {
    case 'assumir':
      e.gestao = { quem: 'propria', tInicio: v.t };
      hist('Você assumiu a gestão.');
      return `O dia a dia é seu: algumas noites e os sábados. ${doRamo(v, e.tipo) ? 'Quem é do ramo sabe onde aperta.' : 'Sem ser do ramo, o começo ensina — e custa.'}`;
    case 'contratar_gestor': {
      const g = gestorNovo(v, e.id, (e.historia ?? []).length, e.tipo);
      e.gestao = { quem: 'contratada', ...g, tInicio: v.t };
      hist(`Contratou ${g.nome} para a gestão.`);
      return `${g.nome} assume a gestão por ${fmt(Math.round(g.salario * salarioLocal(e.municipioId)))} por mês. Se é bom, o tempo vai dizer.`;
    }
    case 'melhorar':
      gastar(v, e, custo);
      e.qualidade = clamp(e.qualidade + 16);
      e.ativos += Math.round(custo * 0.7);
      hist(`Reforma e equipamento novo (${fmt(custo)}).`);
      return `Reforma feita (${fmt(custo)}): mais qualidade. O público percebe — aos poucos.`;
    case 'expandir':
      gastar(v, e, custo);
      e.unidades += 1;
      e.equipe += t.equipe;
      e.ativos += Math.round(custo * t.ativos);
      e.reputacao = clamp(e.reputacao - 4);
      hist(`Abriu a unidade ${e.unidades}.`);
      escrever(v, { texto: `${e.nome} abriu mais uma unidade — agora são ${e.unidades}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return `Nova unidade (${fmt(custo)}): mais público possível, mais custo certo. A reputação se divide até a nova casa firmar.`;
    case 'contratar':
      e.equipe += Math.max(1, Math.round(t.equipe * 0.15));
      return 'Mais gente na equipe: dá conta de mais público (e a folha cresce).';
    case 'cortar':
      gastar(v, e, custo);
      e.equipe = Math.max(1, e.equipe - Math.max(1, Math.round(t.equipe * 0.15)));
      e.qualidade = clamp(e.qualidade - 5);
      e.reputacao = clamp(e.reputacao - 3);
      return `Cortou a equipe (rescisões de ${fmt(custo)}): a folha cai; o atendimento sente.`;
    case 'preco_popular': case 'preco_medio': case 'preco_alto':
      e.preco = d.slice(6) as PrecoEmpresa;
      return e.preco === 'popular' ? 'Preço popular: mais gente, menos por pessoa.' : e.preco === 'alto' ? 'Alto padrão: menos gente, mais exigente — e mais por pessoa.' : 'Preço médio.';
    case 'distribuir': e.distribuir = true; return 'O que passar de uma reserva vai aos donos, todo ano.';
    case 'reinvestir': e.distribuir = false; return 'O lucro fica na empresa (caixa para crescer ou atravessar crise).';
    case 'aportar':
      v.financas.conta -= custo;
      e.caixa += custo;
      e.investido += custo;
      hist(`Aporte de ${fmt(custo)}.`);
      return `${fmt(custo)} da sua conta para o caixa da empresa.`;
    case 'vender': {
      const valor = valorDeVendaDaParte(e);
      v.financas.conta += valor;
      e.estado = 'encerrada';
      e.tFim = v.t;
      const ganho = valor - e.investido;
      hist(`Vendeu a sua parte por ${fmt(valor)}.`);
      escrever(v, { texto: `Vendeu ${e.parte < 1 ? `a sua parte d${t.artigo === 'a' ? 'a' : 'o'}` : ''} ${e.nome} por ${fmt(valor)} — ${ganho >= 0 ? `${fmt(ganho)} acima` : `${fmt(-ganho)} abaixo`} do que tinha posto.`.replace('  ', ' '), relevancia: 'biografia', tema: 'trabalho', tom: ganho >= 0 ? 'bom' : 'ruim', escolha: true });
      v.financas.empresas = empresas(v).filter(x => x.id !== e.id);
      return `Vendida: ${fmt(valor)} na conta.`;
    }
    case 'vender_parte': {
      // Um quarto da empresa para um investidor: dinheiro agora, menos lucro depois — e você segue no comando.
      const fatia = Math.min(0.25, e.parte - 0.5);
      const valor = Math.round(Math.max(0, e.avaliacao ?? 0) * fatia * 0.85 / 1000) * 1000;
      v.financas.conta += valor;
      e.investido = Math.round(e.investido * (e.parte - fatia) / e.parte);
      e.parte = Math.round((e.parte - fatia) * 100) / 100;
      e.papel = 'socio';
      e.socio ??= 'um investidor';
      hist(`Vendeu ${Math.round(fatia * 100)}% por ${fmt(valor)}.`);
      return `${Math.round(fatia * 100)}% vendidos por ${fmt(valor)}. Você fica com ${Math.round(e.parte * 100)}% — e com ${Math.round(e.parte * 100)}% do lucro que vier.`;
    }
    case 'encerrar': {
      const sobra = Math.round(Math.max(0, e.caixa + e.ativos * 0.35) * e.parte);
      v.financas.conta += sobra - custo;
      e.estado = 'encerrada';
      e.tFim = v.t;
      hist('Fechou as portas.');
      escrever(v, { texto: `Fechou ${e.nome}${e.zoo ? ', depois de transferir os animais para outras instituições' : ''}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
      v.financas.empresas = empresas(v).filter(x => x.id !== e.id);
      return e.zoo ? 'Os animais foram transferidos para outros zoológicos e santuários — com custo, não com venda. As portas fecharam.' : `Portas fechadas.${sobra ? ` Sobrou ${fmt(sobra)} das instalações e do caixa.` : ''}`;
    }
    case 'exposicao':
      gastar(v, e, custo);
      e.acervo!.exposicao = 'a exposição do ano';
      e.acervo!.tExposicao = v.t;
      e.reputacao = clamp(e.reputacao + 6);
      return `Exposição temporária montada (${fmt(custo)}): fila na porta por alguns meses — e o nome do museu no jornal.`;
    case 'bem_estar':
      gastar(v, e, custo);
      e.zoo!.bemEstar = clamp(e.zoo!.bemEstar + 18);
      e.ativos += Math.round(custo * 0.6);
      return `Recintos ampliados, enriquecimento ambiental, mais veterinários (${fmt(custo)}): os animais vivem melhor — e a fiscalização vê.`;
    case 'conservacao':
      e.zoo!.conservacao = true;
      e.reputacao = clamp(e.reputacao + 5);
      return 'O zoológico entrou num programa de conservação (reprodução de espécies ameaçadas, pesquisa): custa todo ano; traz apoio e respeito.';
  }
}

/* -------------------------------------------------------- O museu e a coleção */

/** Ceder uma peça da sua coleção ao seu museu (continua sua; o acervo exposto cresce, e o público também). */
export function cederAoMuseu(v: Vida, e: Empresa, pecaId: string): string {
  const c = (v.financas.colecao ?? []).find(x => x.id === pecaId)!;
  c.emprestadaA = e.id;
  e.acervo!.pecas += 1;
  e.reputacao = clamp(e.reputacao + (c.raridade === 'unica' || c.raridade === 'rara' ? 4 : 1));
  (c.historia ??= []).push({ t: v.t, texto: `Cedida em exposição a ${e.nome}.` });
  return `${c.nome.charAt(0).toUpperCase() + c.nome.slice(1)} está em exposição no ${e.nome} — continua sua.`;
}

/** As peças cedidas ao museu entram na atração dele (não no valor da empresa: a peça é sua, não do museu). */
export const valorCedidoAoMuseu = (v: Vida, e: Empresa) => (v.financas.colecao ?? []).filter(c => c.emprestadaA === e.id).reduce((s, c) => s + c.valor, 0);

/* ---------------------------------------------------- Mudança e sucessão */

/** Numa mudança, a empresa fica onde está: só investida (a gestão própria passa a um gestor contratado). */
export function empresasNaMudanca(v: Vida, destinoId: string): void {
  for (const e of empresasAtivas(v)) {
    if (e.municipioId === destinoId || e.gestao.quem !== 'propria') continue;
    const g = gestorNovo(v, e.id, 99, e.tipo);
    e.gestao = { quem: 'contratada', ...g, tInicio: v.t };
    (e.historia ??= []).push({ t: v.t, texto: `Com a mudança, a gestão passou a ${g.nome}.` });
  }
}

export { TIPOS_DE_EMPRESA };
