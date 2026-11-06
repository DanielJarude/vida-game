/**
 * VIDA 12.9 — GESTÃO ATIVA E EMPRESAS DE TODOS OS PORTES (em cima de `empresas`, sem um segundo sistema).
 *
 * Toda empresa da pessoa continua em `financas.empresas`: o caixa é dela, a sua parte entra no patrimônio, o lucro só vira
 * dinheiro seu quando é distribuído. Este módulo acrescenta três coisas:
 *
 *   1. AS ALAVANCAS (marketing, eficiência, padrão do produto, P&D — e, nas grandes, o ritmo de produção, o preço, onde
 *      vende, a dívida e as do ramo). Ficam como foram deixadas até alguém mudar (uma mudança por alavanca por ano); o
 *      padrão não muda nada (as empresas antigas seguem iguais).
 *   2. A DIRETORIA: o CEO (a gestão contratada, agora com um perfil) e os diretores financeiro, de operações e de
 *      tecnologia. O perfil que encaixa no cargo ajuda na medida da competência; o que não encaixa desperdiça. Delegar
 *      deixa a gestão mexer nas alavancas e nos projetos — com o juízo (e o viés) de quem está lá. Delegar não garante lucro.
 *   3. OS RAMOS GRANDES (`dados/empresas129`): tecnologia, construtora, indústria, montadora, banco, aérea, aeroespacial,
 *      semicondutores, energia, infraestrutura. Vivem de CAPACIDADE e de PROJETOS que consomem capital antes de vender,
 *      têm dívida própria (a S.A. responde com o que tem), recuperação judicial e falência, fatia de mercado, aquisições.
 *
 * O painel de cada ano guarda as CAUSAS — o que foi acaso (a crise, o concorrente, a explosão no teste) e o que foi
 * consequência de escolha (o marketing cortado, o preço, o lançamento). Os sorteios são derivados (`rngDe`): o acaso do
 * resto da vida não muda.
 */

import type { AnoDetalhadoDaEmpresa, CargoExecutivo, Empresa, EstrategiaDaEmpresa, Executivo, PerfilExecutivo, ProjetoDaEmpresa, TipoEmpresa, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt, dinheiroCurto as fmtc } from '../texto';
import { tipoDeEmpresa } from '../dados/empresas';
import {
  ALAVANCAS_COMUNS, DESCRICAO_PERFIL, EXECUTIVOS_129, NOME_CARGO, NOME_PERFIL, PERFIL_NO_CARGO, PROJETOS_PEQUENOS, SETORES_GRANDES, itemDoSetor, setorGrande,
  type Alavanca, type EfeitoDeAlavanca, type ItemDeProjeto, type PorteDoSetor, type SetorGrande
} from '../dados/empresas129';
import { converterEntrePaises } from '../mundo/moeda';
import { paisDaVida } from '../mundo/vida';
import { municipio } from '../dados/lugares';
import { disponivel, okDePagar, pagar } from './dinheiro';
import { lancar } from './extrato';
import { abalar } from './abalo';
import {
  GANCHOS_EMPRESA, capitalDaUnidade, competenciaDaGestao, conversao, custoLocal, empresa, empresasAtivas, falir, salarioLocal, type ResultadoDoAno
} from './empresas';

/* ================================================================== Básico */

export const ehGrande = (e: Pick<Empresa, 'tipo'>) => !!setorGrande(e.tipo);
export const setorDe = (e: Pick<Empresa, 'tipo'>) => setorGrande(e.tipo);
/** Reais do catálogo (economia brasileira) na moeda da vida. */
export const kDe = (v: Vida) => converterEntrePaises(1, 'BR', paisDaVida(v));

export function porteDe(e: Empresa): PorteDoSetor {
  const s = setorDe(e);
  if (s) return s.porte === 'medio' && (e.corp?.capacidade ?? 1) >= 4 ? 'grande' : s.porte;
  return tipoDeEmpresa(e.tipo).capital >= 5_000_000 || e.unidades >= 3 ? 'medio' : 'pequeno';
}
export const NOME_PORTE: Record<PorteDoSetor, string> = { pequeno: 'pequena', medio: 'média', grande: 'grande', gigante: 'de porte bilionário' };

const manda = (e: Empresa) => e.papel !== 'investidor' && e.estado !== 'encerrada';
const fem = (v: Vida) => v.eu.genero === 'feminino';
const r1000 = (x: number) => Math.round(x / 1000) * 1000;
const pct = (x: number) => `${Math.round(Math.abs(x) * 100)}%`;

/* ================================================================ Alavancas */

export function alavancasDe(e: Empresa): Alavanca[] {
  const s = setorDe(e);
  return s ? [...ALAVANCAS_COMUNS, ...s.alavancas] : ALAVANCAS_COMUNS.filter(a => !a.grande);
}
export const opcaoAtual = (e: Empresa, a: Alavanca) => a.opcoes.find(o => o.id === (e.estrategia?.alavancas[a.id] ?? a.padrao)) ?? a.opcoes.find(o => o.id === a.padrao)!;
const estrategia = (e: Empresa): EstrategiaDaEmpresa => (e.estrategia ??= { alavancas: {} });

/** O efeito somado: multiplicadores multiplicam; pontos e frações somam. */
type Ef = Required<EfeitoDeAlavanca>;
const NEUTRO: Ef = { demanda: 1, preco: 1, variavel: 1, fixo: 1, gasto: 0, risco: 1, volatilidade: 1, velocidade: 1, aceitacao: 0, reputacao: 0, teto: 1, inadimplencia: 1, juros: 1 };
const SOMA = new Set(['gasto', 'aceitacao', 'reputacao']);
function juntar(a: Ef, b: EfeitoDeAlavanca, escala = 1): Ef {
  const out = { ...a };
  for (const [k, x] of Object.entries(b) as [keyof Ef, number][]) {
    if (SOMA.has(k)) out[k] += x * escala;
    else out[k] *= Math.max(0.2, 1 + (x - 1) * escala);
  }
  return out;
}

/* ================================================================ Diretoria */

export const executivos = (e: Empresa) => e.executivos ?? [];
export const executivo = (e: Empresa, c: CargoExecutivo) => executivos(e).find(x => x.cargo === c);
const PERFIS: PerfilExecutivo[] = ['conservador', 'agressivo', 'inovador', 'expansao', 'eficiencia', 'financas'];

/** Os cargos que a empresa comporta (a pequena com uma unidade só tem a gestão). */
export function cargosPossiveis(e: Empresa): CargoExecutivo[] {
  const p = porteDe(e);
  if (p === 'pequeno') return e.unidades >= 2 ? ['cfo', 'coo'] : [];
  if (p === 'medio') return e.tipo === 'tecnologia' || ehGrande(e) ? ['cfo', 'coo', 'cto'] : ['cfo', 'coo'];
  return ['cfo', 'coo', 'cto'];
}

/** O salário mensal de um diretor (ou do CEO) pelo porte — na moeda da vida. */
export function salarioDeExecutivo(v: Vida, e: Empresa, ceo: boolean, competencia: number): number {
  const base = { pequeno: 15_000, medio: 35_000, grande: 250_000, gigante: 700_000 }[porteDe(e)];
  // A empresa média que ainda é pequena (a startup de sete milhões) não paga salário de diretoria de multinacional.
  const s = setorDe(e);
  const tamanho = s && porteDe(e) === 'medio' ? clamp(baseDoSetor(s) / 3e7, 0.3, 1) : 1;
  return r1000(base * tamanho * (ceo ? 1 : 0.55) * (0.7 + competencia / 100) * kDe(v));
}

/** O perfil do CEO (a gestão contratada); nos saves antigos, ausente = sem viés. */
export const perfilDoCeo = (e: Empresa): PerfilExecutivo | undefined => (e.gestao.quem === 'contratada' ? e.gestao.perfil : undefined);

/** A competência de quem toca uma empresa grande: a própria pessoa aprende devagar (e precisa ser do ramo). */
export function competenciaDoCeo(v: Vida, e: Empresa): number {
  if (!ehGrande(e)) return competenciaDaGestao(v, e);
  if (e.gestao.quem === 'contratada') return e.gestao.competencia ?? 55;
  const anos = Math.min(12, (v.t - e.gestao.tInicio) / 12);
  const s = setorDe(e)!;
  const ocs = [v.trabalho.atual?.ocupacaoId, ...v.trabalho.historico.slice(-5).map(h => h.ocupacaoId)].filter((x): x is string => !!x);
  const ramo = ocs.some(o => s.doRamo.test(o));
  return clamp(32 + anos * 2.2 + (ramo ? 14 : 0) + (v.caminhos.negocio ? 4 : 0), 0, ramo ? 74 : 60);
}

/** O que a diretoria muda (o perfil que encaixa ajuda pela competência; o que não encaixa desperdiça). */
function efeitoDaDiretoria(v: Vida, e: Empresa, grande: boolean): Ef {
  let ef = { ...NEUTRO };
  const escala = (c: number) => clamp((c - 40) / 35, -0.7, 1.4);
  if (grande) {
    // O CEO pesa em tudo (a competência mexe na procura, no custo, no risco e no ritmo dos projetos).
    const q = clamp((competenciaDoCeo(v, e) - 50) / 40, -1.2, 1.1);
    ef = juntar(ef, { demanda: 1 + 0.05 * q, variavel: 1 - 0.025 * q, risco: 1 - 0.18 * q, velocidade: 1 + 0.1 * q, fixo: 1 + Math.max(0, -q) * 0.05 });
  }
  const p = perfilDoCeo(e);
  if (p) { const x = PERFIL_NO_CARGO.ceo[p]; if (x) ef = juntar(ef, x, escala(e.gestao.competencia ?? 50)); }
  for (const d of executivos(e)) {
    const x = PERFIL_NO_CARGO[d.cargo][d.perfil];
    // O diretor fora do perfil do cargo (o inovador nas finanças) custa e não entrega: um pouco de desperdício.
    ef = x ? juntar(ef, x, escala(d.competencia)) : juntar(ef, { fixo: 1.015, risco: 1.03 });
    if (d.competencia < 35) ef = juntar(ef, { fixo: 1.02, variavel: 1.01 });
  }
  return ef;
}

/** O efeito de tudo (as alavancas e a diretoria). */
export function efeitosDaEmpresa(v: Vida, e: Empresa): Ef {
  let ef = { ...NEUTRO };
  for (const a of alavancasDe(e)) ef = juntar(ef, opcaoAtual(e, a).efeito);
  return juntar(ef, efeitoDaDiretoria(v, e, ehGrande(e)) as EfeitoDeAlavanca);
}

const nomeExecutivo = (v: Vida, e: Empresa, chave: string) => { const r = rngDe(v.id, e.id, 'exec', chave, v.t); const [m, f] = r.pick(EXECUTIVOS_129); return r.chance(0.5) ? m : f; };

/** Um candidato para o cargo, com o perfil pedido: a competência é sorteada (e só se mostra com o tempo). */
export function candidato(v: Vida, e: Empresa, cargo: CargoExecutivo | 'ceo', perfil: PerfilExecutivo): { nome: string; competencia: number; salario: number } {
  const r = rngDe(v.id, e.id, 'candidato', cargo, perfil, v.t);
  const competencia = Math.round(clamp(56 + r.normal() * 15, 18, 94));
  return { nome: nomeExecutivo(v, e, `${cargo}${perfil}`), competencia, salario: salarioDeExecutivo(v, e, cargo === 'ceo', competencia) };
}

export function leituraDeExecutivo(v: Vida, desde: number, competencia: number): string {
  if (v.t - desde < 12) return 'ainda é cedo para saber';
  return competencia >= 72 ? 'muito boa' : competencia >= 56 ? 'boa' : competencia >= 40 ? 'irregular' : 'fraca';
}

/* ================================================================ Os ramos grandes */

const CICLO: Record<string, number> = { expansao: 1.06, normal: 1, desaceleracao: 0.95, crise: 0.84, recuperacao: 0.98 };
const ativos = (e: Empresa) => (e.corp?.projetos ?? []).filter(p => p.estado === 'ativo');
const emObra = (e: Empresa) => (e.corp?.projetos ?? []).filter(p => p.estado === 'desenvolvimento');
const usoDe = (s: SetorGrande, ps: ProjetoDaEmpresa[]) => ps.reduce((t, p) => t + (itemDoSetor(s, p.item)?.usa ?? 1) * (p.escala ?? 1), 0);
export const capacidadeEmObra = (e: Empresa) => (e.corp?.obras ?? []).reduce((t, o) => t + o.quanto, 0);

/** A receita "de catálogo" (madura, aceitação média) do que está ativo, na moeda da vida. */
const receitaPotencial = (v: Vida, s: SetorGrande, e: Empresa) => ativos(e).reduce((t, p) => t + (itemDoSetor(s, p.item)?.receita ?? 0) * (p.escala ?? 1), 0) * kDe(v);

/** Quanto o banco empresta à empresa (receita, o que já foi construído, o que está em obra). */
export function limiteDeDivida(v: Vida, e: Empresa): number {
  const s = setorDe(e);
  if (!s || !e.corp) return 0;
  const receita = Math.max(e.ultimo?.receita ?? 0, receitaPotencial(v, s, e) * 0.5);
  // O que já foi construído (as unidades, as linhas em operação, as obras) serve de garantia — e o projeto aprovado tem
  // financiamento próprio (o banco do empreendimento, da usina, da concessão), na medida da alavancagem do ramo.
  const k = kDe(v);
  const projetos = e.corp.projetos.filter(p => p.estado === 'ativo' || p.estado === 'desenvolvimento');
  const construido = ((e.corp.capacidade + capacidadeEmObra(e) * 0.6) * s.custoCapacidade * k + projetos.reduce((t, p) => t + p.investido, 0)) * (0.25 + s.alavancagem * 0.5)
    + emObra(e).reduce((t, p) => t + Math.max(0, p.orcamento - p.investido), 0) * s.alavancagem;
  const pol = { evitar: 0.6, moderada: 1, alavancada: 1.6 }[e.estrategia?.alavancas.divida ?? 'moderada'] ?? 1;
  return r1000(Math.max(0, (receita * s.alavancagem * 1.5 + construido) * pol * (e.reputacao >= 40 ? 1 : 0.7)));
}
export const creditoLivre = (v: Vida, e: Empresa) => Math.max(0, limiteDeDivida(v, e) - (e.corp?.divida ?? 0));
const taxaDaDivida = (v: Vida, e: Empresa) => ((v.economia?.juroReal ?? 0.045) + 0.04) * efeitosDaEmpresa(v, e).juros;

/** O valor da empresa inteira: o que um comprador pagaria (lucro, receita do ramo que cresce, projetos, caixa, dívida). */
export function avaliarGrande(v: Vida, e: Empresa): number {
  const s = setorDe(e)!;
  const c = e.corp!;
  const k = kDe(v);
  const h = (e.anos ?? []).slice(-3);
  const lucro = h.length ? h.reduce((t, a) => t + a.lucro, 0) / h.length : 0;
  const receita = e.ultimo?.receita ?? 0;
  const instalado = c.capacidade * s.custoCapacidade * k * 0.55 + capacidadeEmObra(e) * s.custoCapacidade * k * 0.8;
  const linhas = ativos(e).reduce((t, p) => t + p.investido * 0.35, 0);
  // O que está em obra vale pelo que já foi feito, descontado o risco do ramo (o foguete que pode não voar).
  const pipeline = emObra(e).reduce((t, p) => { const it = itemDoSetor(s, p.item); return t + p.investido * clamp(0.85 - (it?.risco ?? 0.2) - (it?.fatal ?? 0) * 3, 0.25, 0.85); }, 0);
  const crescimento = clamp(1 + ((h[h.length - 1]?.receita ?? 0) - (h[0]?.receita ?? 0)) / Math.max(1, h[0]?.receita ?? 1) / 2, 0.6, 1.8);
  const operacao = Math.max(0, lucro) * s.multiplo + receita * s.multReceita * (lucro > 0 ? crescimento : crescimento * 0.5) + pipeline;
  const liquidacao = instalado + linhas + pipeline * 0.4;
  e.avaliacao = Math.max(0, r1000(Math.max(operacao, liquidacao) + e.caixa - c.divida));
  return e.avaliacao;
}

/** Tira do caixa da empresa; o que faltar, do crédito dela; o resto, da sua conta (um aporte). Devolve o aporte. */
export function pagarPelaEmpresa(v: Vida, e: Empresa, valor: number, rotulo: string): number {
  const doCaixa = Math.min(Math.max(0, e.caixa), valor);
  e.caixa -= doCaixa;
  let resto = valor - doCaixa;
  if (resto > 0 && e.corp) { const tomar = Math.min(resto, creditoLivre(v, e)); e.corp.divida += tomar; resto -= tomar; }
  if (resto > 0) {
    pagar(v, resto);
    e.investido += resto;
    lancar(v, `Aporte em ${e.nome}: ${rotulo}`, 'escolha', -resto);
  }
  return Math.max(0, resto);
}
const podePagarPelaEmpresa = (v: Vida, e: Empresa, valor: number, oque: string) => {
  const daEmpresa = Math.max(0, e.caixa) + (e.corp ? creditoLivre(v, e) : 0);
  return daEmpresa >= valor ? { ok: true } : okDePagar(v, valor - daEmpresa, `${oque} ${fmt(valor)}; a empresa cobre ${fmt(daEmpresa)} (caixa e crédito). O resto, ${fmt(valor - daEmpresa)}, sairia da sua conta — e`);
};

/** O ano de uma empresa grande. Devolve true (tratou). */
function anoDaGrande(v: Vida, e: Empresa): boolean {
  const s = setorDe(e);
  if (!s) return false;
  const c = (e.corp ??= { capacidade: s.capacidadeInicial, divida: 0, projetos: [] });
  const k = kDe(v);
  const r = rngDe(v.id, e.id, 'ano129', v.t);
  const ef = efeitosDaEmpresa(v, e);
  const causas: AnoDetalhadoDaEmpresa['causas'] = [];
  const caixaAntes = e.caixa;
  const fase = v.economia?.fase ?? 'normal';
  const ciclo = 1 + ((CICLO[fase] ?? 1) - 1) * s.ciclo;
  const crise = fase === 'crise';

  // 1. A capacidade em obra.
  for (const o of c.obras ?? []) {
    o.faltam -= 12 * Math.min(1.3, ef.velocidade);
    if (o.faltam <= 0) { c.capacidade += o.quanto; causas.push({ texto: `${o.quanto > 1 ? `${o.quanto} novas ${s.unidade[1]}` : `Uma nova ${s.unidade[0]}`} ficou pronta.`, acaso: false, tom: 'bom' }); }
  }
  c.obras = (c.obras ?? []).filter(o => o.faltam > 0);

  // 2. Os projetos em desenvolvimento: andam, custam, tropeçam — e alguns lançam.
  let capex = 0;
  for (const p of emObra(e)) {
    const it = itemDoSetor(s, p.item);
    if (!it) continue;
    const anda = 12 * ef.velocidade;
    const fracao = Math.min(1, anda / Math.max(1, p.meses - p.feitos));
    const estouro = Math.max(0, r.normal() * 0.06 + (ef.risco - 1) * 0.05);
    const custo = r1000(Math.max(0, p.orcamento - p.investido) * fracao * (1 + estouro));
    p.investido += custo;
    if (p.investido > p.orcamento) p.orcamento = p.investido;
    capex += custo;
    p.feitos += anda;
    const marco = (texto: string, acaso: boolean) => (p.marcos ??= []).push({ t: v.t, texto, acaso });
    if (r.chance(Math.min(0.85, it.risco * ef.risco))) {
      const atraso = r.int(4, 14);
      const extra = r1000(p.orcamento * r.int(4, 16) / 100);
      p.meses += atraso;
      p.orcamento += extra;
      const t = r.pick(s.tropeco);
      marco(`${t} (+${atraso} meses, +${fmtc(extra)})`, true);
      causas.push({ texto: `${p.nome}: ${t.charAt(0).toLowerCase()}${t.slice(1)} Mais ${atraso} meses e ${fmtc(extra)} no orçamento.`, acaso: true, tom: 'ruim' });
    }
    if (it.fatal && r.chance(it.fatal * ef.risco)) {
      p.estado = 'fracassado';
      marco('O projeto foi abandonado: não ia funcionar.', true);
      causas.push({ texto: `${p.nome} fracassou: ${fmtc(p.investido)} investidos viraram aprendizado — e prejuízo.`, acaso: true, tom: 'ruim' });
      escrever(v, { texto: `${e.nome} abandonou ${p.nome.charAt(0).toLowerCase()}${p.nome.slice(1)} depois de ${fmt(p.investido)} investidos.`, relevancia: p.investido >= 1e8 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'ruim' });
      continue;
    }
    if (p.feitos >= p.meses) {
      p.estado = 'ativo';
      p.tLanc = v.t;
      p.escala ??= 1;
      const premium = e.estrategia?.alavancas.preco === 'premium';
      const fitPremium = premium ? (e.estrategia?.alavancas.qualidade === 'superior' ? 4 : -8) + (e.reputacao - 55) / 4 : 0;
      p.aceitacao = Math.round(clamp(52 + ef.aceitacao + (e.reputacao - 50) / 5 + fitPremium + r.normal() * 13, 5, 97));
      marco(`${s.lancamento} Aceitação ${leituraDaAceitacao(p.aceitacao)}.`, false);
      causas.push({ texto: `${p.nome} foi lançado: o mercado recebeu ${leituraDaAceitacao(p.aceitacao)}${p.aceitacao < 40 ? ' — vale rever o preço, o marketing ou o produto' : ''}.`, acaso: false, tom: p.aceitacao >= 55 ? 'bom' : p.aceitacao < 40 ? 'ruim' : 'neutro' });
      escrever(v, { texto: `${e.nome} lançou ${p.nome.charAt(0).toLowerCase()}${p.nome.slice(1)}. ${p.aceitacao >= 65 ? 'O mercado gostou.' : p.aceitacao < 40 ? 'A recepção foi fria.' : 'Recepção morna, a ver.'}`, relevancia: p.investido >= 5e8 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: p.aceitacao >= 55 ? 'bom' : p.aceitacao < 40 ? 'ruim' : 'neutro' });
    }
  }

  // 3. O que se vende: cada linha ativa, pela aceitação, pelas alavancas, pelo ciclo, pela capacidade e pelo acaso do ramo.
  const at = ativos(e);
  const teto = c.capacidade * ef.teto;
  const uso = usoDe(s, at);
  const fatorCap = uso > teto && uso > 0 ? teto / uso : 1;
  if (fatorCap < 0.97) causas.push({ texto: `A capacidade não deu conta: ${pct(1 - fatorCap)} do que dava para vender ficou sem produzir. Ampliar ${s.unidade[1]} resolve — e leva tempo.`, acaso: false, tom: 'ruim' });
  const rep = 0.8 + e.reputacao / 250;
  const sorte = Math.max(0.4, 1 + r.normal() * s.volatilidade * ef.volatilidade * 0.5);
  let receita = 0;
  let variavel = 0;
  for (const p of at) {
    const it = itemDoSetor(s, p.item);
    if (!it) continue;
    const anos = (v.t - (p.tLanc ?? v.t)) / 12;
    // O primeiro ano vende parte; depois, maduro; com os anos (e sem P&D), envelhece.
    const maturidade = it.vida ? 1 : anos < 1 ? 0.6 : anos < 2 ? 0.85 : 1 - Math.max(0, anos - 10) * 0.02 * (ef.velocidade >= 1.2 ? 0.4 : 1);
    const aceitacao = 0.3 + (p.aceitacao ?? 55) / 85;
    const linha = it.receita * (p.escala ?? 1) * aceitacao * Math.max(0.3, maturidade) * ef.demanda * ef.preco * ciclo * rep * sorte * fatorCap * k;
    p.receitaAno = r1000(linha);
    receita += linha;
    // A margem melhora com o preço (o mesmo custo, mais por unidade) e com o P&D no elétrico.
    const margem = clamp(1 - (1 - it.margem) / ef.preco + (it.segmento === 'eletrico' ? (ef.velocidade - 1) * 0.06 : 0), 0.02, 0.95);
    variavel += linha * (1 - margem) * ef.variavel;
    // O empreendimento esgota: depois da vida dele, sai de linha.
    if (it.vida && anos + 1 >= it.vida) { p.estado = 'descontinuado'; (p.marcos ??= []).push({ t: v.t, texto: 'Esgotado: todas as unidades vendidas.' }); causas.push({ texto: `${p.nome} esgotou: as equipes precisam de um empreendimento novo.`, acaso: false, tom: 'neutro' }); }
  }
  if (Math.abs(sorte - 1) >= 0.08 && at.length) causas.push({ texto: `O mercado do ramo ${sorte > 1 ? 'ajudou' : 'atrapalhou'} (${sorte > 1 ? '+' : '−'}${pct(sorte - 1)} nas vendas) — acaso, não escolha.`, acaso: true, tom: sorte > 1 ? 'bom' : 'ruim' });
  if (Math.abs(ciclo - 1) >= 0.04 && at.length) causas.push({ texto: `A economia (${fase === 'crise' ? 'em crise' : fase === 'expansao' ? 'em expansão' : fase === 'desaceleracao' ? 'desacelerando' : 'se recuperando'}) mexeu ${pct(ciclo - 1)} nas vendas.`, acaso: true, tom: ciclo > 1 ? 'bom' : 'ruim' });

  // 4. Os acasos do ramo (o recall, a explosão, a inadimplência).
  let custoExtra = 0;
  for (const x of s.riscos) {
    if (x.crise !== undefined && x.crise !== crise) continue;
    const chance = x.chance * (x.bom ? 1 : ef.risco) * (x.credito ? ef.inadimplencia : 1);
    if (!r.chance(Math.min(0.9, chance))) continue;
    const i = x.intensidade[0] + r.next() * (x.intensidade[1] - x.intensidade[0]);
    if (x.efeito === 'projeto') {
      const p = emObra(e)[0];
      if (!p) continue;
      p.meses += Math.round(i);
      p.orcamento += r1000(p.orcamento * 0.05);
      (p.marcos ??= []).push({ t: v.t, texto: x.texto, acaso: true });
    } else if (x.efeito === 'receita') {
      if (!at.length) continue;
      receita *= 1 - i;
      variavel *= 1 - i;
    } else if (x.efeito === 'custo') {
      if (!at.length) continue;
      custoExtra += receita * i * (x.credito ? ef.inadimplencia : 1);
    }
    if (x.reputacao) e.reputacao = clamp(e.reputacao - x.reputacao);
    causas.push({ texto: x.texto, acaso: true, tom: x.bom ? 'bom' : 'ruim' });
  }

  // 5. Os custos.
  const fixos = (c.capacidade * s.fixoPorCapacidade + s.estrutura) * k * ef.fixo;
  const gastos = receita * Math.max(0, s.gastoBase + ef.gasto) + (at.length ? 0 : s.estrutura * k * Math.max(0, ef.gasto) * 2);
  const diretoria = (executivos(e).reduce((t, d) => t + d.salario, 0) + (e.gestao.quem === 'contratada' ? e.gestao.salario ?? 0 : 0)) * 12;
  const juros = c.divida * taxaDaDivida(v, e);
  const custos = variavel + fixos + gastos + diretoria + juros + custoExtra;
  const antes = receita - custos;
  // O imposto sobre o lucro (os tributos sobre a venda já estão na margem de cada linha).
  const imposto = Math.max(0, antes) * 0.25;
  const lucro = r1000(antes - imposto);
  if (juros > Math.max(receita * 0.06, 1)) causas.push({ texto: `Os juros da dívida da empresa levaram ${fmtc(juros)} no ano.`, acaso: false, tom: 'ruim' });
  if (capex > 0) causas.push({ texto: `${fmtc(capex)} foram para os projetos em andamento — dinheiro que sai antes de voltar.`, acaso: false, tom: 'neutro' });

  // 6. O caixa: o resultado menos o investimento; a dívida cobre o buraco até o limite; a política de dívida amortiza.
  e.caixa += lucro - capex;
  if (e.caixa < 0) {
    const tomar = Math.min(-e.caixa + r1000(fixos * 0.1), creditoLivre(v, e));
    if (tomar > 0) { c.divida += tomar; e.caixa += tomar; causas.push({ texto: `O caixa não bastou: a empresa tomou ${fmtc(tomar)} emprestados.`, acaso: false, tom: 'neutro' }); }
  } else if (c.divida > 0 && (e.estrategia?.alavancas.divida === 'evitar' || executivo(e, 'cfo')?.perfil === 'financas')) {
    const pagarDivida = Math.min(c.divida, Math.max(0, e.caixa - fixos * 0.25));
    c.divida -= pagarDivida;
    e.caixa -= pagarDivida;
  }
  // A distribuição: o lucro acumulado que passa de uma reserva vai aos donos (a sua parte na conta).
  let distribuido = 0;
  e.retido = (e.retido ?? 0) + lucro;
  const reserva = fixos * 0.3 + capex * 0.5;
  if (e.distribuir && e.caixa > reserva && e.retido > 0 && e.estado === 'operando' && c.divida <= limiteDeDivida(v, e) * 0.6) {
    distribuido = r1000(Math.min(e.caixa - reserva, e.retido) * 0.6);
    if (distribuido > 0) {
      e.retido -= distribuido;
      e.caixa -= distribuido;
      const minha = Math.round(distribuido * e.parte);
      v.financas.conta += minha;
      lancar(v, `Dividendos: ${e.nome}`, 'renda', minha);
    }
  }

  // 7. A reputação anda com o que a empresa entrega (as alavancas, a diretoria, os lançamentos).
  const aceitMedia = at.length ? at.reduce((t, p) => t + (p.aceitacao ?? 50), 0) / at.length : 50;
  const alvo = clamp(45 + ef.reputacao * 5 + (aceitMedia - 50) / 2 + (lucro < 0 ? -5 : 0), 5, 95);
  e.reputacao = clamp(Math.round(e.reputacao + (alvo - e.reputacao) * 0.2 + r.normal() * 2));
  c.participacao = receita > 0 ? Math.min(0.9, receita / (s.mercado * k)) : 0;

  // 8. O vermelho: sem caixa e sem crédito, a empresa pede aos donos; depois, recuperação judicial; depois, falência.
  if (e.estado === 'abrindo' && at.length) { e.estado = 'operando'; escrever(v, { texto: `${e.nome} começou a faturar.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' }); }
  if (e.caixa < 0) {
    e.caixa = Math.round(e.caixa * 1.12);
    e.anosNoVermelho += 1;
    c.pedido = { valor: r1000(-e.caixa + fixos * 0.25), t: v.t };
    if (e.estado === 'operando') e.estado = 'em_crise';
    causas.push({ texto: `O caixa ficou ${fmtc(-e.caixa)} no vermelho e o crédito acabou: a empresa precisa de dinheiro dos donos${e.anosNoVermelho >= 2 ? ' — ou vai à Justiça' : ''}.`, acaso: false, tom: 'ruim' });
  } else {
    if (e.anosNoVermelho > 0 && e.estado === 'em_crise') e.estado = at.length ? 'operando' : 'abrindo';
    e.anosNoVermelho = 0;
    delete c.pedido;
  }

  // 9. A gestão delegada mexe nas alavancas e nos projetos para o ano que vem.
  if (e.estrategia?.delegar && e.gestao.quem === 'contratada' && manda(e)) for (const t of delegado(v, e)) causas.push({ texto: t, acaso: false, tom: 'neutro' });

  const valor = avaliarGrande(v, e);
  const produtividade = Math.round(clamp(teto > 0 ? Math.min(uso, teto) / teto * 100 * (0.6 + aceitMedia / 125) : 0, 0, 100));
  registrarAno(e, { t: v.t, receita: r1000(receita), custos: r1000(custos + imposto), lucro, fluxo: r1000(e.caixa - caixaAntes), investimentos: r1000(capex), produtividade, reputacao: e.reputacao, valor, participacao: c.participacao, fatores: { ciclo, sorte, demanda: ef.demanda, preco: ef.preco, cap: fatorCap }, causas });
  e.historico = [...(e.historico ?? []), lucro].slice(-6);
  e.ultimo = { t: v.t, publico: produtividade, receita: r1000(receita), custos: r1000(custos), imposto: r1000(imposto), resultado: lucro, distribuido, nota: causas.find(x => x.acaso)?.texto };
  e.ativos = r1000(c.capacidade * s.custoCapacidade * k * 0.55);

  // 10. A recuperação judicial (uma vez) e a falência.
  const buraco = e.caixa < -fixos * 0.15;
  if (e.anosNoVermelho >= 2 && buraco && !c.recuperacao) {
    c.recuperacao = v.t;
    const corte = r1000(c.divida * 0.35);
    c.divida -= corte;
    e.caixa += r1000(Math.max(0, -e.caixa) * 0.5);
    e.reputacao = clamp(e.reputacao - 15);
    (e.historia ??= []).push({ t: v.t, texto: 'Pediu recuperação judicial.' });
    escrever(v, { texto: `${e.nome} pediu recuperação judicial: os credores aceitaram um corte de ${fmt(corte)} na dívida e um plano de anos. A empresa segue, menor e vigiada.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  } else if (buraco && (e.anosNoVermelho >= 4 || (e.anosNoVermelho >= 2 && c.recuperacao && v.t - c.recuperacao >= 12))) {
    const exposicao = e.investido;
    // A limitada (médio porte) tem o aval de quem a tocava nos empréstimos (a dívida dela entra na conta do leilão); a S.A.
    // grande responde só com o que tem — os credores ficam com o prejuízo, e o dono, com a perda do que pôs.
    if (s.porte === 'medio') e.caixa -= c.divida;
    else e.caixa = Math.max(0, e.caixa);
    falir(v, e);
    lamentar(v, exposicao, `a falência de ${e.nome}`);
  }
  return true;
}

function registrarAno(e: Empresa, a: AnoDetalhadoDaEmpresa): void {
  e.anos = [...(e.anos ?? []), a].slice(-12);
}

export const leituraDaAceitacao = (a: number) => (a >= 75 ? 'muito bem' : a >= 58 ? 'bem' : a >= 42 ? 'de forma morna' : 'mal');

/** O peso de uma perda no humor: o que é muito para quem tem pouco é pouco para quem tem muito (e o enorme pesa em qualquer um). */
function lamentar(v: Vida, perda: number, oque: string): void {
  if (perda <= 0) return;
  const base = Math.max(1, Math.abs(v.financas.conta) + (v.financas.historico[v.financas.historico.length - 1]?.ativos ?? 0));
  const fracao = perda / (base + perda);
  if (fracao < 0.02) return;
  abalar(v, oque, -clamp(fracao * 20, 1, 12), clamp(fracao * 16, 1, 10));
}

/* ================================================================ A gestão que decide (delegação) */

/**
 * O CEO contratado, com a empresa delegada, mexe numa ou duas coisas por ano: com a competência dele, lê a situação (o
 * caixa, a capacidade, a procura, o que está em obra); com o perfil, puxa para o lado dele. Não toca no que o dono mudou
 * nos últimos dois anos. Devolve o que fez (para o painel).
 */
function delegado(v: Vida, e: Empresa): string[] {
  const s = setorDe(e);
  const out: string[] = [];
  const r = rngDe(v.id, e.id, 'delegado', v.t);
  const comp = e.gestao.competencia ?? 50;
  const perfil = e.gestao.perfil ?? 'conservador';
  const st = estrategia(e);
  const nome = e.gestao.nome ?? 'A gestão';
  const livre = (id: string) => st.mudou?.[id] === undefined || v.t - st.mudou[id] >= 24 || st.mudou[`${id}:gestao`] !== undefined;
  const mexer = (id: string, op: string, porque: string) => {
    const a = alavancasDe(e).find(x => x.id === id);
    if (!a || !livre(id) || (st.alavancas[id] ?? a.padrao) === op) return false;
    st.alavancas[id] = op;
    (st.mudou ??= {})[id] = v.t;
    st.mudou[`${id}:gestao`] = v.t;
    out.push(`${nome} (${NOME_PERFIL[perfil]}) mudou ${a.rotulo.toLowerCase()} para "${a.opcoes.find(o => o.id === op)!.rotulo.toLowerCase()}": ${porque}`);
    return true;
  };
  const ultimo = e.anos?.[e.anos.length - 1];
  const prejuizo = (ultimo?.lucro ?? 0) < 0;
  const acerta = r.chance(clamp(comp / 100, 0.15, 0.92));
  if (acerta) {
    // Lê a situação: no prejuízo sem projeto em obra, corta; com capacidade sobrando e lucro, divulga; caixa folgado e nada em obra, lança.
    if (prejuizo && !emObra(e).length) mexer('eficiencia', 'enxuta', 'o ano fechou no prejuízo.') || mexer('marketing', 'padrao', 'o prejuízo pede cautela.');
    else if (!prejuizo && (ultimo?.produtividade ?? 100) < 70) mexer('marketing', 'forte', 'há capacidade sobrando.');
  } else {
    // Segue o próprio viés (o que nem sempre é o que a empresa precisa).
    if (perfil === 'agressivo') mexer('marketing', 'agressivo', 'crescer é a prioridade.');
    else if (perfil === 'conservador') mexer('marketing', 'minimo', 'guardar caixa.');
    else if (perfil === 'inovador') mexer('pd', 'lider', 'tecnologia é o futuro da empresa.');
    else if (perfil === 'eficiencia') mexer('eficiencia', 'corte', 'cortar onde der.');
    else if (perfil === 'expansao' && s) mexer('alcance', 'internacional', 'novos mercados.');
    else if (perfil === 'financas' && s) mexer('divida', 'evitar', 'reduzir a dívida.');
  }
  // Os projetos: a gestão começa um quando não há nada em obra e o caixa (com o crédito) cobre — o agressivo começa mesmo apertado.
  if (s && e.corp && !emObra(e).length) {
    const folga = Math.max(0, e.caixa) + creditoLivre(v, e) * (perfil === 'agressivo' ? 1 : 0.5);
    const livreCap = e.corp.capacidade + capacidadeEmObra(e) - usoDe(s, ativos(e));
    const k = kDe(v);
    const op = s.itens.filter(it => it.capex * k * (1 - s.alavancagem) <= folga * (perfil === 'conservador' ? 0.4 : 0.8) && it.usa <= livreCap + 1e-9 && requisitoOk(e, it))
      .sort((a, b) => (b.receita * b.margem / b.capex) - (a.receita * a.margem / a.capex));
    const escolhido = acerta ? op[0] : op[op.length - 1];
    if (escolhido && (acerta || perfil !== 'conservador')) {
      iniciarProjeto(v, e, escolhido);
      out.push(`${nome} começou ${escolhido.nome.charAt(0).toLowerCase()}${escolhido.nome.slice(1)} (${fmtc(escolhido.capex * k)}).`);
    } else if (livreCap <= 0 && e.caixa > s.custoCapacidade * k + Math.min(...s.itens.map(it => it.capex)) * k * (1 - s.alavancagem) && (perfil === 'expansao' || acerta)) {
      (e.corp.obras ??= []).push({ quanto: 1, faltam: s.mesesCapacidade });
      e.caixa -= r1000(s.custoCapacidade * k);
      out.push(`${nome} mandou construir mais ${s.unidade[0] === 'fábrica' ? 'uma' : 'uma unidade de'} ${s.unidade[0]}.`);
    }
  }
  return out;
}

/* ================================================================ A pequena: alavancas, diretoria e produtos */

/** O que as alavancas, a diretoria e os produtos mudam na empresa pequena (o gancho de `empresas`). */
function ajustePequena(v: Vida, e: Empresa): { procura: number; variavel: number; fixos: { rotulo: string; valor: number }[] } {
  if (!e.estrategia && !e.executivos?.length && !e.projetos?.length && !e.gestao.perfil) return { procura: 1, variavel: 1, fixos: [] };
  const ef = efeitosDaEmpresa(v, e);
  const t = tipoDeEmpresa(e.tipo);
  const k = conversao(v, e);
  let procura = ef.demanda;
  let variavel = ef.variavel;
  for (const p of e.projetos ?? []) {
    if (p.estado !== 'ativo') continue;
    const pp = PROJETOS_PEQUENOS.find(x => x.id === p.item);
    if (!pp) continue;
    procura *= 1 + pp.ganho * clamp(((p.aceitacao ?? 50) - 45) / 40, -0.5, 1.2);
    if (pp.variavel) variavel *= pp.variavel;
  }
  // A receita de referência (o último ano, nos preços da cidade da empresa; ou a de uma casa madura).
  const receitaRef = e.ultimo?.receita ? e.ultimo.receita / k : t.publico * e.unidades * t.ticket[e.preco] * custoLocal(e.municipioId);
  const fixos: { rotulo: string; valor: number }[] = [];
  const mkt = opcaoAtual(e, ALAVANCAS_COMUNS[0]).efeito.gasto ?? 0;
  if (mkt) fixos.push({ rotulo: mkt > 0 ? 'Campanha de marketing' : 'Divulgação cortada', valor: Math.round(receitaRef * mkt) });
  const pd = opcaoAtual(e, ALAVANCAS_COMUNS.find(a => a.id === 'pd')!).efeito.gasto ?? 0;
  if (pd) fixos.push({ rotulo: pd > 0 ? 'Tecnologia e inovação' : 'Tecnologia cortada', valor: Math.round(receitaRef * pd) });
  if (ef.fixo !== 1) {
    const base = e.equipe * t.salario * 12 * salarioLocal(e.municipioId) + t.ponto * e.unidades * Math.pow(custoLocal(e.municipioId), 1.4);
    fixos.push({ rotulo: ef.fixo < 1 ? 'Corte de custos fixos' : 'Estrutura a mais (diretoria fora do perfil)', valor: Math.round(base * (ef.fixo - 1)) });
  }
  const dir = executivos(e).reduce((s2, d) => s2 + d.salario, 0);
  if (dir) fixos.push({ rotulo: 'Diretoria', valor: Math.round(dir * 12 / k) });
  return { procura, variavel, fixos };
}

/** Depois do ano da pequena: os projetos andam, a reputação sente as alavancas, a gestão delegada decide, o painel guarda o porquê. */
function depoisDaPequena(v: Vida, e: Empresa, contas: ResultadoDoAno, caixaAntes: number): void {
  const ef = e.estrategia || e.executivos?.length || e.gestao.perfil || e.projetos?.length ? efeitosDaEmpresa(v, e) : NEUTRO;
  const r = rngDe(v.id, e.id, 'pequena129', v.t);
  const causas: AnoDetalhadoDaEmpresa['causas'] = [];
  if (ef.reputacao) { e.reputacao = clamp(Math.round(e.reputacao + ef.reputacao)); e.qualidade = clamp(Math.round(e.qualidade + ef.reputacao / 2)); }
  for (const p of e.projetos ?? []) {
    if (p.estado !== 'desenvolvimento') continue;
    p.feitos += 12 * ef.velocidade;
    if (p.feitos >= p.meses) {
      p.estado = 'ativo';
      p.tLanc = v.t;
      p.aceitacao = Math.round(clamp(50 + ef.aceitacao + (e.qualidade - 55) / 3 + (e.reputacao - 50) / 5 + r.normal() * 14, 5, 97));
      causas.push({ texto: `${p.nome} entrou no ar: o público recebeu ${leituraDaAceitacao(p.aceitacao)}.`, acaso: false, tom: p.aceitacao >= 55 ? 'bom' : p.aceitacao < 40 ? 'ruim' : 'neutro' });
    }
  }
  if (e.estrategia?.delegar && e.gestao.quem === 'contratada' && manda(e)) for (const t of delegado(v, e)) causas.push({ texto: t, acaso: false, tom: 'neutro' });
  const u = e.ultimo;
  const ant = e.anos?.[e.anos.length - 1];
  if (u) {
    if (ant && ant.receita > 0) {
      const d = u.receita / ant.receita - 1;
      if (Math.abs(d) >= 0.06) causas.push({ texto: `A receita ${d > 0 ? 'subiu' : 'caiu'} ${pct(d)}${explicarVariacao(v, e, d)}.`, acaso: false, tom: d > 0 ? 'bom' : 'ruim' });
      const dc = u.custos / Math.max(1, ant.custos) - 1;
      if (dc >= 0.08) causas.push({ texto: `Os custos subiram ${pct(dc)} (equipe, gestão, campanha ou expansão).`, acaso: false, tom: 'ruim' });
    }
    if (u.nota) causas.push({ texto: u.nota, acaso: /concorrente|atração nova|fiscaliza/i.test(u.nota), tom: /abriu ao público|levantada/.test(u.nota) ? 'bom' : 'neutro' });
    const fase = v.economia?.fase ?? 'normal';
    if (fase === 'crise' || fase === 'expansao') causas.push({ texto: fase === 'crise' ? 'A economia em crise tirou clientes de todo o ramo — não foi só aqui.' : 'A economia em expansão ajudou o ramo inteiro.', acaso: true, tom: fase === 'crise' ? 'ruim' : 'bom' });
  }
  const t = tipoDeEmpresa(e.tipo);
  const teto = t.capacidade * e.unidades;
  registrarAno(e, { t: v.t, receita: u?.receita ?? 0, custos: u?.custos ?? 0, lucro: u?.resultado ?? 0, fluxo: r1000(e.caixa - caixaAntes), investimentos: 0, produtividade: Math.round(clamp(contas.publico / Math.max(1, teto) * 100, 0, 100)), reputacao: e.reputacao, valor: e.avaliacao ?? 0, causas });
}

/** Por que a receita mudou (o preço, a reputação, o marketing, o produto): o que se sabe, em palavras. */
function explicarVariacao(v: Vida, e: Empresa, d: number): string {
  const st = e.estrategia;
  const recente = (id: string) => st?.mudou?.[id] !== undefined && v.t - st.mudou[id] <= 12;
  if (recente('marketing')) return d > 0 ? ' — a campanha trouxe gente' : ' — com menos divulgação, menos gente';
  if ((e.projetos ?? []).some(p => p.tLanc === v.t)) return ' — o lançamento do ano pesou';
  if ((v.economia?.fase ?? 'normal') === 'crise' && d < 0) return ' — a crise';
  if (e.reputacao >= 65 && d > 0) return ' — a reputação trabalhando';
  if (e.reputacao < 40 && d < 0) return ' — a reputação fraca afasta';
  return d > 0 ? '' : ' — demanda mais fraca no ano';
}

/* ================================================================ Decisões */

export type OqueEmpresa129 = 'alavanca' | 'projeto' | 'ampliar' | 'descontinuar' | 'capacidade' | 'concorrente' | 'captar' | 'amortizar' | 'aportar' | 'investidores' | 'executivo' | 'demitir' | 'ceo' | 'delegar';

const requisitoOk = (e: Empresa, it: ItemDeProjeto) => !it.requer || ativos(e).some(p => new RegExp(`^(${it.requer})$`).test(p.item));
const jaDecidiu = (v: Vida, e: Empresa, chave: string) => v.anoAtual.acoes.includes(`e129:${e.id}:${chave}`);
const marcar = (v: Vida, e: Empresa, chave: string) => v.anoAtual.acoes.push(`e129:${e.id}:${chave}`);

/** Os valores de aporte oferecidos (o que a empresa pede; 5% e 15% do valor dela). */
export function aportesPossiveis(v: Vida, e: Empresa): number[] {
  const base = Math.max(e.avaliacao ?? 0, capitalDaUnidade(e) * conversao(v, e));
  return [...new Set([e.corp?.pedido?.valor ?? 0, r1000(base * 0.05), r1000(base * 0.15)].filter(x => x > 0))].sort((a, b) => a - b);
}

/** O que custa cada decisão (para a tela dizer antes). */
export function custoEmpresa129(v: Vida, e: Empresa, oque: OqueEmpresa129, alvo = ''): number {
  const s = setorDe(e);
  const k = s ? kDe(v) : conversao(v, e);
  switch (oque) {
    case 'alavanca': { const [a, o] = alvo.split(':'); const op = alavancasDe(e).find(x => x.id === a)?.opcoes.find(x => x.id === o); return op?.custo ? r1000(op.custo * (s ? baseDoSetor(s) * k : capitalDaUnidade(e) * k)) : 0; }
    case 'projeto': {
      if (s) { const it = itemDoSetor(s, alvo); return it ? r1000(it.capex * k) : 0; }
      const pp = PROJETOS_PEQUENOS.find(x => x.id === alvo);
      return pp ? r1000(pp.capex * capitalDaUnidade(e) * k * e.unidades ** 0.5) : 0;
    }
    case 'ampliar': { const p = (e.corp?.projetos ?? []).find(x => x.id === alvo); const it = p && s ? itemDoSetor(s, p.item) : undefined; return it ? r1000(it.capex * 0.4 * k) : 0; }
    case 'capacidade': return s ? r1000(s.custoCapacidade * k) : 0;
    case 'concorrente': return r1000(Math.max(e.avaliacao ?? 0, s ? baseDoSetor(s) * k : 0) * 0.3);
    case 'captar': return r1000(creditoLivre(v, e) * 0.5);
    case 'amortizar': return r1000(Math.min(e.corp?.divida ?? 0, Math.max(0, e.caixa)));
    case 'aportar': return Number(alvo) || 0;
    case 'demitir': { const d = executivo(e, alvo as CargoExecutivo); return d ? d.salario * 6 : 0; }
    default: return 0;
  }
}
/** O capital de base do ramo (uma unidade de capacidade + o projeto típico). */
const baseDoSetor = (s: SetorGrande) => s.custoCapacidade * s.capacidadeInicial + s.itens[0].capex + s.giro;

export function disponibilidadeEmpresa129(v: Vida, e: Empresa | undefined, oque: OqueEmpresa129, alvo = ''): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  if (!e || e.estado === 'encerrada') return { ok: false, motivo: 'Essa empresa não existe mais.' };
  if (e.papel === 'investidor') return { ok: false, motivo: 'Investidor não decide: recebe o que for distribuído e pode vender a parte.' };
  const s = setorDe(e);
  const custo = custoEmpresa129(v, e, oque, alvo);
  switch (oque) {
    case 'alavanca': {
      const [a, o] = alvo.split(':');
      const al = alavancasDe(e).find(x => x.id === a);
      if (!al || !al.opcoes.some(x => x.id === o)) return { ok: false, motivo: 'Não se aplica a esta empresa.' };
      if (opcaoAtual(e, al).id === o) return { ok: false, motivo: 'Já é assim.' };
      if (jaDecidiu(v, e, `al:${a}`)) return { ok: false, motivo: 'Já mudou isso este ano: deixe o efeito aparecer.' };
      return custo ? podePagarPelaEmpresa(v, e, custo, 'A mudança custa') : { ok: true };
    }
    case 'projeto': {
      if (s) {
        const it = itemDoSetor(s, alvo);
        if (!it) return { ok: false, motivo: 'Projeto desconhecido.' };
        if (!requisitoOk(e, it)) return { ok: false, motivo: 'Precisa antes de outro projeto pronto (o foguete antes da cápsula, o lançador antes dos satélites).' };
        if (emObra(e).length >= Math.max(2, Math.floor((e.corp?.capacidade ?? 1) + capacidadeEmObra(e)))) return { ok: false, motivo: 'Já há projetos demais em andamento para esta estrutura.' };
        const livre = (e.corp?.capacidade ?? 0) + capacidadeEmObra(e) - usoDe(s, [...ativos(e), ...emObra(e)]);
        if (it.usa > livre + 1e-9) return { ok: false, motivo: `Não há ${s.unidade[0]} livre para produzir isto: amplie a capacidade antes (ou descontinue algo).` };
        // O projeto se paga ao longo dos meses; para começar, a empresa precisa cobrir ao menos um quarto (o primeiro ano).
        return podePagarPelaEmpresa(v, e, r1000(custo * 0.25), 'O primeiro ano do projeto custa uns');
      }
      const pp = PROJETOS_PEQUENOS.find(x => x.id === alvo);
      if (!pp) return { ok: false, motivo: 'Projeto desconhecido.' };
      if ((e.projetos ?? []).some(p => p.item === alvo && (p.estado === 'ativo' || p.estado === 'desenvolvimento'))) return { ok: false, motivo: 'Já existe.' };
      if (e.tipo === 'museu' || e.tipo === 'zoologico') return { ok: false, motivo: 'Não se aplica a esta casa.' };
      return podePagarPelaEmpresa(v, e, custo, 'O projeto custa');
    }
    case 'ampliar': {
      const p = (e.corp?.projetos ?? []).find(x => x.id === alvo);
      if (!s || !p || p.estado !== 'ativo') return { ok: false, motivo: 'Só o que já está à venda.' };
      if ((p.aceitacao ?? 0) < 45) return { ok: false, motivo: 'Com essa aceitação, ampliar é produzir encalhe.' };
      const it = itemDoSetor(s, p.item)!;
      const livre = (e.corp?.capacidade ?? 0) + capacidadeEmObra(e) - usoDe(s, [...ativos(e), ...emObra(e)]);
      if (it.usa * 0.5 > livre + 1e-9) return { ok: false, motivo: `Ampliar pede ${s.unidade[0]} livre: construa capacidade antes.` };
      if (jaDecidiu(v, e, `amp:${alvo}`)) return { ok: false, motivo: 'Já ampliado este ano.' };
      return podePagarPelaEmpresa(v, e, custo, 'Ampliar custa');
    }
    case 'descontinuar': { const p = [...(e.corp?.projetos ?? []), ...(e.projetos ?? [])].find(x => x.id === alvo); return p && (p.estado === 'ativo' || p.estado === 'desenvolvimento') ? { ok: true } : { ok: false, motivo: 'Não se aplica.' }; }
    case 'capacidade':
      if (!s) return { ok: false, motivo: 'Na empresa pequena, crescer é abrir outra unidade.' };
      if ((e.corp?.obras ?? []).length >= 2) return { ok: false, motivo: 'Já há duas obras de capacidade em andamento.' };
      return podePagarPelaEmpresa(v, e, custo, `A nova ${s.unidade[0]} custa`);
    case 'concorrente':
      if (!s) return { ok: false, motivo: 'Só nas empresas grandes.' };
      if (!ativos(e).length) return { ok: false, motivo: 'Primeiro, a empresa precisa vender alguma coisa: ninguém incorpora concorrente sem operação.' };
      if (jaDecidiu(v, e, 'concorrente')) return { ok: false, motivo: 'Uma aquisição por ano: a integração já é trabalho bastante.' };
      return podePagarPelaEmpresa(v, e, custo, 'Comprar um concorrente custa');
    case 'captar':
      if (!s) return { ok: false, motivo: 'Só nas empresas grandes.' };
      if (custo < 1000) return { ok: false, motivo: 'O banco não empresta mais a esta empresa agora.' };
      return jaDecidiu(v, e, 'captar') ? { ok: false, motivo: 'Já captou este ano.' } : { ok: true };
    case 'amortizar': return s && (e.corp?.divida ?? 0) > 0 && e.caixa > 0 ? { ok: true } : { ok: false, motivo: 'Sem dívida a pagar, ou sem caixa.' };
    case 'aportar':
      if (!aportesPossiveis(v, e).includes(custo)) return { ok: false, motivo: 'Escolha um valor.' };
      return okDePagar(v, custo, 'O aporte é de');
    case 'investidores':
      if ((e.avaliacao ?? 0) <= 0) return { ok: false, motivo: 'Ninguém investe numa empresa que hoje não vale nada.' };
      if (e.parte <= 0.3) return { ok: false, motivo: 'Diluir mais tiraria o controle de vez.' };
      return jaDecidiu(v, e, 'investidores') ? { ok: false, motivo: 'Uma rodada por ano.' } : { ok: true };
    case 'executivo': {
      const [cargo, perfil] = alvo.split(':') as [CargoExecutivo, PerfilExecutivo];
      if (!cargosPossiveis(e).includes(cargo)) return { ok: false, motivo: porteDe(e) === 'pequeno' ? 'Com uma unidade só, a gestão dá conta: diretoria é para a rede (duas unidades ou mais).' : 'Esse cargo não existe nesta empresa.' };
      if (!PERFIS.includes(perfil)) return { ok: false, motivo: 'Escolha um perfil.' };
      if (jaDecidiu(v, e, `ex:${cargo}`)) return { ok: false, motivo: 'Já mexeu nesse cargo este ano.' };
      return { ok: true };
    }
    case 'demitir': return executivo(e, alvo as CargoExecutivo) ? { ok: true } : { ok: false, motivo: 'Ninguém no cargo.' };
    case 'ceo': {
      if (!PERFIS.includes(alvo as PerfilExecutivo)) return { ok: false, motivo: 'Escolha um perfil.' };
      if (jaDecidiu(v, e, 'ceo')) return { ok: false, motivo: 'Já trocou a gestão este ano.' };
      return { ok: true };
    }
    case 'delegar':
      if (e.gestao.quem !== 'contratada') return { ok: false, motivo: 'Delegar pede uma gestão contratada (é você quem toca).' };
      return (!!e.estrategia?.delegar) === (alvo === 'sim') ? { ok: false, motivo: alvo === 'sim' ? 'A gestão já decide.' : 'Você já decide.' } : { ok: true };
  }
}

function iniciarProjeto(v: Vida, e: Empresa, it: ItemDeProjeto, id?: string): ProjetoDaEmpresa {
  const k = kDe(v);
  const p: ProjetoDaEmpresa = { id: id ?? `pj${v.seq++}`, item: it.id, nome: it.nome.replace(/^(Um|Uma|A|O) /, m => m.charAt(0).toUpperCase() + m.slice(1)), estado: 'desenvolvimento', investido: 0, orcamento: r1000(it.capex * k), meses: it.meses, feitos: 0, tInicio: v.t, escala: 1, marcos: [{ t: v.t, texto: 'Projeto aprovado.' }] };
  (e.corp ??= { capacidade: 0, divida: 0, projetos: [] }).projetos.push(p);
  return p;
}

export function decidirEmpresa129(v: Vida, e: Empresa, oque: OqueEmpresa129, alvo = ''): string {
  const s = setorDe(e);
  const custo = custoEmpresa129(v, e, oque, alvo);
  const hist = (texto: string) => (e.historia ??= []).push({ t: v.t, texto });
  const st = estrategia(e);
  switch (oque) {
    case 'alavanca': {
      const [a, o] = alvo.split(':');
      const al = alavancasDe(e).find(x => x.id === a)!;
      const op = al.opcoes.find(x => x.id === o)!;
      marcar(v, e, `al:${a}`);
      if (custo) pagarPelaEmpresa(v, e, custo, al.rotulo.toLowerCase());
      if (o === al.padrao) delete st.alavancas[a]; else st.alavancas[a] = o;
      (st.mudou ??= {})[a] = v.t;
      delete st.mudou[`${a}:gestao`];
      hist(`${al.rotulo}: ${op.rotulo.toLowerCase()}.`);
      return `${al.rotulo}: ${op.rotulo.toLowerCase()}. ${op.descricao}${custo ? ` (${fmtc(custo)} agora.)` : ''} O efeito aparece no fechamento do ano.`;
    }
    case 'projeto': {
      if (s) {
        const it = itemDoSetor(s, alvo)!;
        const p = iniciarProjeto(v, e, it);
        hist(`Aprovou ${it.nome.charAt(0).toLowerCase()}${it.nome.slice(1)} (${fmtc(p.orcamento)}).`);
        if (p.orcamento >= 5e8) escrever(v, { texto: `${e.nome} aprovou ${it.nome.charAt(0).toLowerCase()}${it.nome.slice(1)}: ${fmt(p.orcamento)} previstos e ${Math.round(it.meses / 12 * 10) / 10} anos até vender.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
        return `Aprovado: ${fmtc(p.orcamento)} ao longo de uns ${Math.round(it.meses / 12 * 10) / 10} anos (o dinheiro sai aos poucos, do caixa e do crédito da empresa). ${it.fatal ? 'Pode atrasar, estourar — e até não dar certo.' : 'Pode atrasar e estourar o orçamento.'}`;
      }
      const pp = PROJETOS_PEQUENOS.find(x => x.id === alvo)!;
      pagarPelaEmpresa(v, e, custo, 'projeto novo');
      const nome = pp.nome[e.tipo] ?? pp.nome.padrao;
      (e.projetos ??= []).push({ id: `pj${v.seq++}`, item: pp.id, nome, estado: 'desenvolvimento', investido: custo, orcamento: custo, meses: pp.meses, feitos: 0, tInicio: v.t });
      e.investido += 0;
      hist(`${nome} (${fmtc(custo)}).`);
      return `${nome}: ${fmtc(custo)}. Em uns meses, o público diz se pegou.`;
    }
    case 'ampliar': {
      const p = e.corp!.projetos.find(x => x.id === alvo)!;
      marcar(v, e, `amp:${alvo}`);
      pagarPelaEmpresa(v, e, custo, `ampliar ${p.nome}`);
      p.escala = (p.escala ?? 1) + 0.5;
      p.investido += custo;
      (p.marcos ??= []).push({ t: v.t, texto: `Produção ampliada (${fmtc(custo)}).` });
      return `${p.nome}: produção ampliada pela metade (${fmtc(custo)}). Se o mercado acompanhar, vende mais; se não, sobra.`;
    }
    case 'descontinuar': {
      const p = [...(e.corp?.projetos ?? []), ...(e.projetos ?? [])].find(x => x.id === alvo)!;
      const emDev = p.estado === 'desenvolvimento';
      p.estado = 'descontinuado';
      (p.marcos ??= []).push({ t: v.t, texto: emDev ? 'Cancelado.' : 'Descontinuado.' });
      hist(`${emDev ? 'Cancelou' : 'Descontinuou'} ${p.nome}.`);
      return emDev ? `${p.nome} cancelado: os ${fmtc(p.investido)} já gastos não voltam; o resto do orçamento fica no caixa.` : `${p.nome} saiu de linha: libera capacidade, e a receita dele acaba.`;
    }
    case 'capacidade': {
      pagarPelaEmpresa(v, e, custo, `nova ${s!.unidade[0]}`);
      (e.corp!.obras ??= []).push({ quanto: 1, faltam: s!.mesesCapacidade });
      e.investido += 0;
      hist(`Mandou construir mais ${s!.unidade[0] === 'aeronave' ? 'uma' : 'uma unidade:'} ${s!.unidade[0]} (${fmtc(custo)}).`);
      return `Mais ${s!.unidade[0] === 'aeronave' ? 'uma' : 'uma'} ${s!.unidade[0]}: ${fmtc(custo)}, pront${s!.unidade[0].endsWith('a') || s!.unidade[0].endsWith('e') ? 'a' : 'o'} em uns ${s!.mesesCapacidade} meses.`;
    }
    case 'concorrente': {
      marcar(v, e, 'concorrente');
      pagarPelaEmpresa(v, e, custo, 'compra de concorrente');
      const r = rngDe(v.id, e.id, 'concorrente', v.t);
      const c = e.corp!;
      const nome = r.pick(s!.nomes).replace('{sobrenome}', r.pick(['Albuquerque', 'Ferraz', 'Monteiro', 'Duarte', 'Siqueira', 'Valadares']));
      const ganho = Math.max(1, Math.round(c.capacidade * 0.3));
      c.capacidade += ganho;
      const melhor = [...ativos(e)].sort((a, b) => (b.receitaAno ?? 0) - (a.receitaAno ?? 0))[0];
      if (melhor) { const copia = iniciarProjeto(v, e, itemDoSetor(s!, melhor.item)!); Object.assign(copia, { estado: 'ativo', investido: custo * 0.4, feitos: copia.meses, tLanc: v.t - 24, aceitacao: Math.round(clamp((melhor.aceitacao ?? 50) + r.normal() * 12, 10, 90)), escala: 0.6, nome: `${melhor.nome} (linha de ${nome})` }); }
      (c.aquisicoes ??= []).push(nome);
      // A integração: às vezes custa mais que o previsto (a cultura, os sistemas) — o perfil de finanças ou de expansão ajuda.
      const dificil = r.chance(perfilDoCeo(e) === 'expansao' || perfilDoCeo(e) === 'financas' ? 0.15 : 0.35);
      if (dificil) e.reputacao = clamp(e.reputacao - 6);
      hist(`Comprou a concorrente ${nome} (${fmtc(custo)}).`);
      escrever(v, { texto: `${e.nome} comprou a concorrente ${nome} por ${fmt(custo)}.`, relevancia: custo >= 1e9 ? 'marco' : 'biografia', tema: 'trabalho', escolha: true });
      return `${nome} agora é sua: mais ${ganho} ${ganho > 1 ? s!.unidade[1] : s!.unidade[0]} e as linhas dela. ${dificil ? 'A integração começou difícil: sistemas que não conversam, gente saindo.' : 'A integração anda bem.'}`;
    }
    case 'captar': {
      marcar(v, e, 'captar');
      e.corp!.divida += custo;
      e.caixa += custo;
      hist(`Captou ${fmtc(custo)} em dívida.`);
      return `${fmtc(custo)} no caixa da empresa — emprestados, a uns ${Math.round(taxaDaDivida(v, e) * 1000) / 10}% ao ano acima da inflação. A dívida é da empresa, não sua.`;
    }
    case 'amortizar': {
      e.corp!.divida -= custo;
      e.caixa -= custo;
      return `${fmtc(custo)} da dívida pagos: menos juros daqui para a frente, menos caixa agora.`;
    }
    case 'aportar': {
      pagar(v, custo);
      lancar(v, `Aporte em ${e.nome}`, 'escolha', -custo);
      e.caixa += custo;
      e.investido += custo;
      if (e.corp?.pedido && e.caixa >= 0) delete e.corp.pedido;
      hist(`Aporte de ${fmtc(custo)}.`);
      if (custo >= 1e8) escrever(v, { texto: `Pôs ${fmt(custo)} do próprio bolso em ${e.nome}.`, relevancia: 'biografia', tema: 'dinheiro', escolha: true });
      return `${fmt(custo)} da sua conta para o caixa de ${e.nome}. A sua exposição na empresa passou a ${fmtc(e.investido)}.`;
    }
    case 'investidores': {
      // Uma rodada: os investidores põem dinheiro por uma fatia nova da empresa (a sua parte dilui).
      marcar(v, e, 'investidores');
      const valor = Math.max(0, e.avaliacao ?? 0);
      const entra = r1000(Math.max(valor * 0.25, e.corp?.pedido?.valor ?? 0));
      const fatia = entra / (valor + entra);
      const antes = e.parte;
      e.parte = Math.round(e.parte * (1 - fatia) * 1000) / 1000;
      e.caixa += entra;
      if (e.parte < 1 && e.papel === 'dono') { e.papel = 'socio'; e.socio ??= 'um grupo de investidores'; }
      if (e.corp?.pedido && e.caixa >= 0) delete e.corp.pedido;
      hist(`Rodada de investimento: ${fmtc(entra)} de fora; a sua parte foi de ${Math.round(antes * 100)}% para ${Math.round(e.parte * 100)}%.`);
      return `${fmtc(entra)} entraram de investidores por ${pct(fatia)} da empresa. Você fica com ${Math.round(e.parte * 1000) / 10}% — de uma empresa com mais caixa.`;
    }
    case 'executivo': {
      const [cargo, perfil] = alvo.split(':') as [CargoExecutivo, PerfilExecutivo];
      marcar(v, e, `ex:${cargo}`);
      const c = candidato(v, e, cargo, perfil);
      const antigo = executivo(e, cargo);
      if (antigo) pagarPelaEmpresa(v, e, antigo.salario * 6, 'rescisão');
      const novo: Executivo = { cargo, nome: c.nome, perfil, competencia: c.competencia, salario: c.salario, t: v.t };
      e.executivos = [...executivos(e).filter(x => x.cargo !== cargo), novo];
      hist(`${NOME_CARGO[cargo]}: ${c.nome} (${NOME_PERFIL[perfil]}).`);
      return `${c.nome} assume a ${NOME_CARGO[cargo].toLowerCase()} por ${fmtc(c.salario)} por mês — perfil ${NOME_PERFIL[perfil]}: ${DESCRICAO_PERFIL[perfil]}. Se é bom, o tempo vai dizer.`;
    }
    case 'demitir': {
      const d = executivo(e, alvo as CargoExecutivo)!;
      pagarPelaEmpresa(v, e, custo, 'rescisão');
      e.executivos = executivos(e).filter(x => x.cargo !== d.cargo);
      hist(`Dispensou ${d.nome} (${NOME_CARGO[d.cargo].toLowerCase()}).`);
      return `${d.nome} saiu (${fmtc(custo)} de rescisão). O cargo fica vago.`;
    }
    case 'ceo': {
      const perfil = alvo as PerfilExecutivo;
      marcar(v, e, 'ceo');
      const c = candidato(v, e, 'ceo', perfil);
      // Na pequena, o salário segue a régua de `empresas.gestorNovo` (em reais de base: a cidade ajusta na conta do ano).
      const escala = clamp(Math.sqrt(tipoDeEmpresa(e.tipo).capital / 1e6), 0.45, 2.5);
      e.gestao = { quem: 'contratada', nome: c.nome, competencia: c.competencia, salario: ehGrande(e) ? c.salario : Math.round((6000 + c.competencia * 100) * escala / 100) * 100, tInicio: v.t, perfil };
      hist(`Nova gestão: ${c.nome} (${NOME_PERFIL[perfil]}).`);
      return `${c.nome} assume ${ehGrande(e) ? 'a presidência' : 'a gestão'} — perfil ${NOME_PERFIL[perfil]}: ${DESCRICAO_PERFIL[perfil]}.`;
    }
    case 'delegar':
      st.delegar = alvo === 'sim';
      return st.delegar ? `${e.gestao.nome ?? 'A gestão'} passa a decidir as alavancas e os projetos — com o juízo e o viés de quem está lá. Você continua podendo mudar qualquer coisa (o que você mudar, a gestão respeita por dois anos).` : 'As decisões de estratégia voltam a ser só suas: a gestão executa o que estiver decidido.';
  }
}

/* ================================================================ Fundar e adquirir */

export interface PlanoDeFundacao { setor: TipoEmpresa; item: string; capital: number; capitalDaPessoa: number; consumoAnual: number; anosAteVender: number; receitaPrevista: number; disponivel: boolean; motivo?: string }

/** O que fundar custa: a capacidade inicial, o primeiro projeto e o capital de giro (com sócios, metade). */
export function planoDeFundacao(v: Vida, setor: TipoEmpresa, item: string, comSocio: boolean): PlanoDeFundacao {
  const s = setorGrande(setor)!;
  const it = itemDoSetor(s, item) ?? s.itens[0];
  const k = kDe(v);
  const capital = r1000((s.custoCapacidade * s.capacidadeInicial + it.capex + s.giro) * k);
  const capitalDaPessoa = comSocio ? r1000(capital / 2) : capital;
  const consumoAnual = r1000((s.fixoPorCapacidade * s.capacidadeInicial + s.estrutura) * k + it.capex * k / Math.max(1, it.meses / 12));
  const motivo = idade(v) < 18 ? 'A partir dos 18.' : empresasAtivas(v).filter(e => e.papel !== 'investidor').length >= 8 ? 'Já são oito empresas.' : !requisitoOk({ corp: { projetos: [] } } as unknown as Empresa, it) ? 'Esse projeto depende de outro pronto: comece pelo que vem antes.' : undefined;
  return { setor, item: it.id, capital, capitalDaPessoa, consumoAnual, anosAteVender: Math.round(Math.max(it.meses, s.mesesCapacidade * (s.custoCapacidade > 1e9 ? 1 : 0)) / 12 * 10) / 10, receitaPrevista: r1000(it.receita * k), disponivel: !motivo, motivo };
}

/** Os ramos que fazem sentido mostrar: os que a pessoa pode bancar (ou quase: vendendo o que tem). */
export function setoresAoAlcance(v: Vida): { s: SetorGrande; minimo: number; perto: boolean }[] {
  const k = kDe(v);
  const liq = disponivel(v);
  const patrimonioBruto = liq + (v.financas.historico[v.financas.historico.length - 1]?.ativos ?? 0);
  return SETORES_GRANDES.map(s => {
    const minimo = r1000(Math.min(...s.itens.filter(it => !it.requer).map(it => (s.custoCapacidade * s.capacidadeInicial + it.capex + s.giro) * k)) / 2);
    return { s, minimo, perto: minimo <= Math.max(liq, patrimonioBruto * 0.6) };
  });
}

export function fundarEmpresa(v: Vida, setor: TipoEmpresa, item: string, comSocio: boolean): string {
  const s = setorGrande(setor)!;
  const p = planoDeFundacao(v, setor, item, comSocio);
  const it = itemDoSetor(s, p.item)!;
  const id = `em${v.seq++}`;
  const r = rngDe(v.id, id, 'nome');
  const nome = r.pick(s.nomes).replace('{sobrenome}', v.eu.sobrenome.split(' ').slice(-1)[0] ?? 'Silva');
  const k = kDe(v);
  const perfil = r.pick(PERFIS);
  const e: Empresa = {
    id, tipo: setor, nome, municipioId: v.moradia.municipioId, tInicio: v.t, papel: comSocio ? 'socio' : 'dono', parte: comSocio ? 0.5 : 1, investido: p.capitalDaPessoa,
    caixa: r1000(s.giro * k + it.capex * k), ativos: 0, unidades: 1, qualidade: 60, reputacao: 40, equipe: 0, preco: 'medio',
    gestao: { quem: 'contratada', tInicio: v.t, perfil, nome: '', competencia: 50, salario: 0 }, distribuir: false, anosNoVermelho: 0, estado: 'abrindo',
    ...(comSocio ? { socio: r.pick(['um fundo de investimento', 'um grupo de investidores', 'um sócio do ramo']) } : {}),
    corp: { capacidade: 0, obras: [{ quanto: s.capacidadeInicial, faltam: s.mesesCapacidade }], divida: 0, projetos: [] },
    estrategia: { alavancas: {}, delegar: true }, avaliacao: p.capital
  };
  const c = candidato(v, e, 'ceo', perfil);
  e.gestao = { quem: 'contratada', nome: c.nome, competencia: c.competencia, salario: c.salario, tInicio: v.t, perfil };
  // A capacidade inicial é paga já (a obra começa); o primeiro projeto sai do caixa ao longo dos meses.
  iniciarProjeto(v, e, it);
  pagar(v, p.capitalDaPessoa);
  lancar(v, `Capital para fundar ${nome}`, 'escolha', -p.capitalDaPessoa);
  (v.financas.empresas ??= []).push(e);
  e.historia = [{ t: v.t, texto: `Fundada com ${fmt(p.capital)}${comSocio ? `, meio a meio com ${e.socio}` : ''}.` }];
  escrever(v, { texto: `Fundou ${s.nome}: ${nome}. ${fmt(p.capital)} de capital, ${it.nome.charAt(0).toLowerCase()}${it.nome.slice(1)} como primeiro projeto — e uns ${p.anosAteVender} anos até vender alguma coisa.`, relevancia: p.capital >= 1e8 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
  if (!temFato(v, 'abriu_empresa')) marcarFato(v, 'abriu_empresa');
  return `${nome} existe. ${c.nome} assume a presidência (perfil ${NOME_PERFIL[perfil]}); a empresa começa com ${fmtc(e.caixa)} em caixa, ${s.unidade[1]} em obra e o primeiro projeto andando. Até vender, ela só gasta: uns ${fmtc(p.consumoAnual)} por ano.`;
}

export interface OfertaDeAquisicao { id: string; setor: TipoEmpresa; nome: string; preco: number; receita: number; lucro: number; divida: number; capacidade: number; linhas: string[]; partes: number[]; nota: string }

/** As empresas grandes à venda no ano (o controle ou uma fatia), do tamanho que a pessoa consegue pagar. */
export function ofertasDeAquisicao(v: Vida): OfertaDeAquisicao[] {
  if (idade(v) < 18) return [];
  const liq = disponivel(v);
  const k = kDe(v);
  const ano = anoDe(v.t);
  const r = rngDe(v.economia?.semente ?? 1, 'aquisicoes129', ano, v.id);
  const out: OfertaDeAquisicao[] = [];
  const candidatos = SETORES_GRANDES.filter(s => (s.custoCapacidade + s.itens[0].capex) * k * 0.1 <= liq);
  for (let n = 0; n < 3 && candidatos.length; n++) {
    const s = candidatos.splice(r.int(0, candidatos.length - 1), 1)[0];
    const e = empresaAVenda(v, s, `aq-${ano}-${n}`, r, liq);
    const lucro = e.anos?.[e.anos.length - 1]?.lucro ?? 0;
    const partes = [1, 0.25, 0.1].filter(p => r1000((e.avaliacao ?? 0) * p) <= liq * 1.05 && (e.avaliacao ?? 0) * p >= 1e5);
    if (!partes.length) continue;
    out.push({ id: e.id, setor: s.id, nome: e.nome, preco: e.avaliacao ?? 0, receita: e.ultimo?.receita ?? 0, lucro, divida: e.corp!.divida, capacidade: e.corp!.capacidade, linhas: ativos(e).map(p => p.nome), partes,
      nota: e.corp!.divida > (e.avaliacao ?? 0) * 0.6 ? 'Endividada: o preço é baixo pelo que deve.' : lucro < 0 ? 'Dá prejuízo: quem vende está cansado.' : (e.reputacao >= 60 ? 'Marca respeitada no ramo.' : 'Uma operação mediana, sem nada de especial.') });
  }
  return out;
}

/** Monta a empresa à venda (sempre a mesma no ano): capacidade, linhas maduras, dívida, reputação — e o valor que o mercado dá. */
function empresaAVenda(v: Vida, s: SetorGrande, id: string, r: Rng, liq: number): Empresa {
  const k = kDe(v);
  const base = (s.custoCapacidade + s.itens[0].capex) * k;
  const escala = clamp(liq / base * (0.4 + r.next() * 0.9), 0.5, 6);
  const cap = Math.max(1, Math.round(s.capacidadeInicial * escala));
  const nome = r.pick(s.nomes).replace('{sobrenome}', r.pick(['Albuquerque', 'Ferraz', 'Monteiro', 'Duarte', 'Siqueira', 'Valadares', 'Brandão']));
  const e: Empresa = { id, tipo: s.id, nome, municipioId: v.moradia.municipioId, tInicio: v.t - 12 * r.int(4, 30), papel: 'dono', parte: 1, investido: 0, caixa: 0, ativos: 0, unidades: 1, qualidade: 60, reputacao: Math.round(clamp(52 + r.normal() * 14, 15, 90)), equipe: 0, preco: 'medio',
    gestao: { quem: 'contratada', nome: '', competencia: Math.round(clamp(52 + r.normal() * 14, 20, 90)), salario: 0, tInicio: v.t, perfil: r.pick(PERFIS) }, distribuir: true, anosNoVermelho: 0, estado: 'operando',
    corp: { capacidade: cap, divida: 0, projetos: [] }, estrategia: { alavancas: {}, delegar: true } };
  const possiveis = s.itens.filter(it => !it.requer);
  let usado = 0;
  const ordem = [...possiveis];
  for (let i = ordem.length - 1; i > 0; i--) { const j = r.int(0, i); [ordem[i], ordem[j]] = [ordem[j], ordem[i]]; }
  for (const it of ordem) {
    if (usado + it.usa > cap + 1e-9) continue;
    usado += it.usa;
    const p = iniciarProjeto(v, e, it, `${id}-${it.id}`);
    Object.assign(p, { estado: 'ativo', investido: r1000(it.capex * k * 0.6), feitos: it.meses, tLanc: v.t - 12 * r.int(2, 6), aceitacao: Math.round(clamp(55 + r.normal() * 14, 15, 92)) });
    if (usado >= cap * 0.8) break;
  }
  if (!ativos(e).length) { const it = possiveis[0]; const p = iniciarProjeto(v, e, it, `${id}-${it.id}`); Object.assign(p, { estado: 'ativo', feitos: it.meses, tLanc: v.t - 36, aceitacao: 50 }); }
  // O último ano dela (o que o comprador vê): as contas de catálogo com o acaso de um ano.
  const receita = r1000(ativos(e).reduce((t, p) => t + (itemDoSetor(s, p.item)!.receita * (0.3 + (p.aceitacao ?? 50) / 85)), 0) * k * (0.85 + r.next() * 0.3));
  const custos = r1000(ativos(e).reduce((t, p) => { const it = itemDoSetor(s, p.item)!; return t + it.receita * (0.3 + (p.aceitacao ?? 50) / 85) * (1 - it.margem); }, 0) * k + (cap * s.fixoPorCapacidade + s.estrutura) * k + receita * s.gastoBase);
  const lucro = r1000((receita - custos) * (receita > custos ? 0.75 : 1));
  e.corp!.divida = r1000(Math.max(0, receita * s.alavancagem * (0.2 + r.next() * 1.1)));
  e.caixa = r1000(Math.max(receita * 0.05, s.giro * k * 0.3));
  e.anos = [{ t: v.t, receita, custos, lucro, fluxo: 0, investimentos: 0, produtividade: 80, reputacao: e.reputacao, valor: 0, causas: [] }];
  e.ultimo = { t: v.t, publico: 80, receita, custos, imposto: 0, resultado: lucro, distribuido: 0 };
  e.historico = [lucro];
  avaliarGrande(v, e);
  return e;
}

export function disponibilidadeAquisicao(v: Vida, ofertaId: string, parte: number): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  const o = ofertasDeAquisicao(v).find(x => x.id === ofertaId);
  if (!o) return { ok: false, motivo: 'A oferta não está mais de pé.' };
  if (!o.partes.includes(parte)) return { ok: false, motivo: 'Essa fatia não está à venda (ou não cabe no que você tem).' };
  if (v.anoAtual.acoes.includes('aquisicao129')) return { ok: false, motivo: 'Uma aquisição por ano: a análise e a negociação levam meses.' };
  if (parte === 1 && empresasAtivas(v).filter(e => e.papel !== 'investidor').length >= 8) return { ok: false, motivo: 'Já são oito empresas.' };
  return okDePagar(v, r1000(o.preco * parte * 1.02), 'Com as taxas da operação (2%), custa');
}

export function adquirirEmpresa(v: Vida, ofertaId: string, parte: number): string {
  const liq = disponivel(v);
  const s = setorGrande(ofertasDeAquisicao(v).find(x => x.id === ofertaId)!.setor)!;
  const ano = anoDe(v.t);
  // A mesma empresa da oferta (mesmo gerador, mesma ordem).
  const r = rngDe(v.economia?.semente ?? 1, 'aquisicoes129', ano, v.id);
  const cands = SETORES_GRANDES.filter(x => (x.custoCapacidade + x.itens[0].capex) * kDe(v) * 0.1 <= liq);
  let e: Empresa | undefined;
  for (let n = 0; n < 3 && cands.length; n++) {
    const sx = cands.splice(r.int(0, cands.length - 1), 1)[0];
    const x = empresaAVenda(v, sx, `aq-${ano}-${n}`, r, liq);
    if (x.id === ofertaId) { e = x; break; }
  }
  e ??= empresaAVenda(v, s, ofertaId, rngDe(v.id, ofertaId), liq);
  const preco = r1000((e.avaliacao ?? 0) * parte);
  const taxas = r1000(preco * 0.02);
  v.anoAtual.acoes.push('aquisicao129');
  pagar(v, preco + taxas);
  lancar(v, `Compra de ${Math.round(parte * 100)}% de ${e.nome}`, 'escolha', -(preco + taxas));
  e.id = `em${v.seq++}`;
  for (const p of e.corp!.projetos) p.id = `pj${v.seq++}`;
  e.tInicio = v.t;
  e.parte = parte;
  e.papel = parte === 1 ? 'dono' : 'investidor';
  e.investido = preco + taxas;
  e.gestao.nome = candidato(v, e, 'ceo', e.gestao.perfil ?? 'conservador').nome;
  e.gestao.salario = salarioDeExecutivo(v, e, true, e.gestao.competencia ?? 50);
  if (parte < 1) e.socio = 'os acionistas majoritários';
  e.historia = [{ t: v.t, texto: `${parte === 1 ? 'Comprada' : `Comprou ${Math.round(parte * 100)}%`} por ${fmt(preco)}.` }];
  (v.financas.empresas ??= []).push(e);
  escrever(v, { texto: parte === 1 ? `Comprou ${s.nome}: ${e.nome}, por ${fmt(preco)}.` : `Comprou ${Math.round(parte * 100)}% de ${e.nome} (${s.rotulo.toLowerCase()}) por ${fmt(preco)}.`, relevancia: preco >= 1e8 ? 'marco' : 'biografia', tema: 'dinheiro', escolha: true });
  return parte === 1 ? `${e.nome} é sua: ${e.corp!.capacidade} ${e.corp!.capacidade > 1 ? s.unidade[1] : s.unidade[0]}, ${ativos(e).length} ${ativos(e).length > 1 ? 'linhas' : 'linha'} vendendo, ${fmtc(e.corp!.divida)} de dívida da empresa. A gestão de ${e.gestao.nome} continua — mude o que quiser.` : `${Math.round(parte * 100)}% de ${e.nome}: você recebe a sua parte dos dividendos e não manda em nada.`;
}

/* ================================================================ O painel (leitura para a tela) */

export interface PainelDaEmpresa {
  porte: PorteDoSetor;
  grande: boolean;
  setor?: SetorGrande;
  kpis: { rotulo: string; valor: number; tipo: 'dinheiro' | 'pct' | 'nota'; tom?: 'bom' | 'ruim' }[];
  alertas: string[];
  causas: AnoDetalhadoDaEmpresa['causas'];
  serie: { ano: number; receita: number; lucro: number; valor: number }[];
  projetos: { p: ProjetoDaEmpresa; progresso: number; descricao?: string }[];
  diretoria: { cargo: CargoExecutivo | 'ceo'; nome: string; perfil?: PerfilExecutivo; leitura: string; salario: number }[];
  delegado: boolean;
}

export function painelDaEmpresa(v: Vida, e: Empresa): PainelDaEmpresa {
  const s = setorDe(e);
  const u = e.ultimo;
  const a = e.anos?.[e.anos.length - 1];
  const kpis: PainelDaEmpresa['kpis'] = [];
  if (u) {
    kpis.push({ rotulo: 'Faturamento', valor: u.receita, tipo: 'dinheiro' });
    kpis.push({ rotulo: 'Despesas', valor: u.custos + (u.imposto ?? 0), tipo: 'dinheiro' });
    kpis.push({ rotulo: u.resultado >= 0 ? 'Lucro' : 'Prejuízo', valor: u.resultado, tipo: 'dinheiro', tom: u.resultado >= 0 ? 'bom' : 'ruim' });
  }
  if (a) kpis.push({ rotulo: 'Fluxo de caixa', valor: a.fluxo, tipo: 'dinheiro', tom: a.fluxo >= 0 ? 'bom' : 'ruim' });
  kpis.push({ rotulo: 'Caixa da empresa', valor: e.caixa, tipo: 'dinheiro', tom: e.caixa < 0 ? 'ruim' : undefined });
  if (e.corp?.divida) kpis.push({ rotulo: 'Dívida da empresa', valor: e.corp.divida, tipo: 'dinheiro' });
  kpis.push({ rotulo: 'Valor estimado (inteira)', valor: e.avaliacao ?? 0, tipo: 'dinheiro' });
  kpis.push({ rotulo: 'A sua parte', valor: Math.round((e.avaliacao ?? 0) * e.parte), tipo: 'dinheiro' });
  kpis.push({ rotulo: 'Você pôs', valor: e.investido, tipo: 'dinheiro' });
  if (a) kpis.push({ rotulo: 'Produtividade', valor: a.produtividade, tipo: 'nota' });
  kpis.push({ rotulo: 'Reputação', valor: e.reputacao, tipo: 'nota' });
  if (e.corp?.participacao) kpis.push({ rotulo: 'Fatia do mercado', valor: e.corp.participacao, tipo: 'pct' });
  const alertas: string[] = [];
  if (e.corp?.pedido) alertas.push(`O caixa acabou: a empresa precisa de ${fmtc(e.corp.pedido.valor)} (aporte, investidores ou cortar um projeto).`);
  else if (e.caixa < 0) alertas.push('O caixa está no vermelho.');
  if (e.anosNoVermelho >= 1) alertas.push(`${e.anosNoVermelho} ${e.anosNoVermelho > 1 ? 'anos seguidos' : 'ano'} no vermelho${e.anosNoVermelho >= 2 ? ': a falência está perto' : ''}.`);
  if (s && e.corp) {
    const at = ativos(e);
    if (!at.length && !emObra(e).length) alertas.push('Nada à venda e nada em obra: sem projeto, a empresa só tem custo.');
    else if (!emObra(e).length && s.itens.some(it => it.vida)) alertas.push('Nenhum empreendimento novo em obra: quando os atuais esgotarem, as equipes ficam paradas.');
    if ((a?.fatores?.cap ?? 1) < 0.97) alertas.push(`A capacidade travou as vendas: ${s.unidade[1]} a mais renderiam.`);
    for (const p of at) if ((p.aceitacao ?? 50) < 40) alertas.push(`${p.nome}: aceitação fraca — rever o preço, o marketing, o padrão ou descontinuar.`);
    for (const p of emObra(e)) if (p.meses - p.feitos > 0 && p.orcamento > p.investido && (p.marcos ?? []).filter(m => m.acaso).length >= 2) alertas.push(`${p.nome}: tropeçou mais de uma vez — o orçamento já é ${fmtc(p.orcamento)}.`);
    if (e.corp.divida > limiteDeDivida(v, e) * 0.85 && e.corp.divida > 0) alertas.push('A dívida está perto do limite que os bancos aceitam.');
  }
  if (e.gestao.quem === 'contratada' && v.t - e.gestao.tInicio >= 12 && (e.gestao.competencia ?? 50) < 40) alertas.push(`A gestão de ${e.gestao.nome} tem sido fraca.`);
  for (const d of executivos(e)) if (v.t - d.t >= 12 && d.competencia < 40) alertas.push(`${NOME_CARGO[d.cargo]}: ${d.nome} não tem entregado.`);
  if (e.reputacao < 30) alertas.push('A reputação está baixa: afasta clientes e encarece o crédito.');
  const diretoria: PainelDaEmpresa['diretoria'] = [{ cargo: 'ceo', nome: e.gestao.quem === 'propria' ? 'Você' : e.gestao.nome ?? '—', perfil: e.gestao.perfil, leitura: e.gestao.quem === 'propria' ? 'você mesm' + (fem(v) ? 'a' : 'o') : leituraDeExecutivo(v, e.gestao.tInicio, e.gestao.competencia ?? 50), salario: e.gestao.quem === 'contratada' ? e.gestao.salario ?? 0 : 0 },
    ...executivos(e).map(d => ({ cargo: d.cargo, nome: d.nome, perfil: d.perfil, leitura: leituraDeExecutivo(v, d.t, d.competencia), salario: d.salario }))];
  const projetos = [...(e.corp?.projetos ?? []), ...(e.projetos ?? [])].filter(p => p.estado !== 'descontinuado' || v.t - (p.marcos?.[p.marcos.length - 1]?.t ?? 0) < 24)
    .map(p => ({ p, progresso: p.estado === 'desenvolvimento' ? clamp(p.feitos / Math.max(1, p.meses), 0, 1) : 1, descricao: s ? itemDoSetor(s, p.item)?.descricao : PROJETOS_PEQUENOS.find(x => x.id === p.item)?.descricao }));
  return { porte: porteDe(e), grande: !!s, setor: s, kpis, alertas, causas: a?.causas ?? [], serie: (e.anos ?? []).map(x => ({ ano: anoDe(x.t), receita: x.receita, lucro: x.lucro, valor: x.valor })), projetos, diretoria, delegado: !!e.estrategia?.delegar };
}

/** Os projetos que dá para começar (com o custo e o que se espera). */
export function projetosPossiveis(v: Vida, e: Empresa): { id: string; nome: string; descricao: string; custo: number; meses: number; receita?: number; risco?: string }[] {
  const s = setorDe(e);
  if (s) {
    const k = kDe(v);
    return s.itens.map(it => ({ id: it.id, nome: it.nome, descricao: it.descricao, custo: r1000(it.capex * k), meses: it.meses, receita: r1000(it.receita * k), risco: it.fatal ? (it.fatal >= 0.04 ? 'alto (pode fracassar)' : 'médio') : it.risco >= 0.2 ? 'médio' : 'baixo' }));
  }
  if (e.tipo === 'museu' || e.tipo === 'zoologico') return [];
  return PROJETOS_PEQUENOS.map(pp => ({ id: pp.id, nome: pp.nome[e.tipo] ?? pp.nome.padrao, descricao: pp.descricao, custo: custoEmpresa129(v, e, 'projeto', pp.id), meses: pp.meses }));
}

/* ================================================================ Registro e saves */

GANCHOS_EMPRESA.motor = (v, e) => (ehGrande(e) ? anoDaGrande(v, e) : false);
GANCHOS_EMPRESA.ajuste = ajustePequena;
GANCHOS_EMPRESA.depois = depoisDaPequena;
GANCHOS_EMPRESA.unidades = e => 4 + (executivo(e, 'coo') ? 4 : 0) + (executivo(e, 'cfo') ? 2 : 0);

/**
 * VIDA 12.9 · saves antigos: nada é obrigatório. As empresas pequenas seguem sem estratégia (= o padrão); a grande que
 * vier sem `corp` (não deveria) ganha a estrutura mínima. Idempotente.
 */
export function normalizarVida129Economia(v: Vida): void {
  for (const e of v.financas.empresas ?? []) {
    const s = setorGrande(e.tipo);
    if (s && !e.corp) e.corp = { capacidade: s.capacidadeInicial, divida: 0, projetos: [] };
    if (e.estrategia && typeof e.estrategia.alavancas !== 'object') e.estrategia.alavancas = {};
    if (e.executivos && !Array.isArray(e.executivos)) delete e.executivos;
  }
}

export { empresa, municipio };
