/**
 * VIDA 13 — PRODUTOS, LINHAS E NOMES DAS EMPRESAS (contas puras; quem decide e quem fecha o ano é `empresas129`).
 *
 *   1. PRODUTOS: o projeto de uma empresa grande deixa de ser só o item do ramo ("uma linha de alimentos") e passa a ser
 *      um produto (`dados/produtos13`: salgadinhos, cereais, moto urbana, smartphone, satélite meteorológico). O item vira
 *      o molde; o produto sobrepõe os números e traz público, posicionamento, concorrência, crescimento do mercado,
 *      sensibilidade a preço e o tempo até envelhecer. Projeto sem produto (os saves antigos) segue o item: nada muda.
 *   2. LINHAS: o que se decide numa linha à venda — reposicionar, mudar o preço, investir em qualidade, lançar uma versão
 *      nova — vira um FATOR nas contas do ano (procura, preço, custo variável, aceitação, envelhecimento) e na reputação.
 *   3. NOMES: empresas, concorrentes, fundos e marcas de produto saem de peças combinadas (`dados/nomes13`) e o gerador
 *      recusa o igual, o quase igual e o confuso no contexto (as empresas da pessoa, as compradas, as rivais). Só vale para
 *      o que nasce daqui em diante: um nome gravado no save não muda.
 *
 * Os sorteios daqui são derivados (`rngDe`) ou usam o gerador que quem chama já tinha: o acaso do resto da vida não muda.
 */

import type { Empresa, LinhaDoProduto13, ProjetoDaEmpresa, TipoEmpresa, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { ItemDeProjeto, PorteDoSetor, SetorGrande } from '../dados/empresas129';
import { setorGrande } from '../dados/empresas129';
import {
  NOME_POSICAO_13, POSICOES_13, produtoDoSetor13, produtoPadrao13, produtoPequeno13, produtosDoSetor13, produtosPequenos13,
  type Posicionamento13, type ProdutoDoSetor13, type ProdutoPequeno13
} from '../dados/produtos13';
import { FUNDOS_13, MARCAS_13, PADROES_GRANDES_13, PADROES_PEQUENOS_13, PECAS_13, RAIZES_13, SOBRENOMES_13 } from '../dados/nomes13';

/* ================================================================ Nomes */

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Palavras que não distinguem uma empresa da outra (o ramo, a forma jurídica, as preposições). */
const GENERICAS = new Set(
  ['grupo', 'companhia', 'cia', 'holding', 's', 'a', 'sa', 'ltda', 'participacoes', 'de', 'da', 'do', 'das', 'dos', 'e', 'filhos', 'irmaos', 'associados', 'the', 'and']
    .concat(...Object.values(PECAS_13).flatMap(p => [...p!.sufixos, ...p!.prefixos].map(x => semAcento(x).split(/[^a-z0-9]+/))))
);
export function nucleoDoNome13(nome: string): string[] {
  const todas = semAcento(nome).split(/[^a-z0-9]+/).filter(Boolean);
  const nucleo = todas.filter(t => !GENERICAS.has(t));
  return nucleo.length ? nucleo : todas;
}
function distancia(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let ant = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, ant + (a[i - 1] === b[j - 1] ? 0 : 1)); ant = t; }
  }
  return d[b.length];
}
/** Dois nomes se confundem: o mesmo núcleo, um dentro do outro ("Fortaleza" e "Fortaleza Alimentos") ou uma letra de diferença. */
export function nomesConfundem13(a: string, b: string): boolean {
  if (semAcento(a).trim() === semAcento(b).trim()) return true;
  const x = nucleoDoNome13(a);
  const y = nucleoDoNome13(b);
  if (x.every(t => y.includes(t)) || y.every(t => x.includes(t))) return true;
  const sx = x.join(' ');
  const sy = y.join(' ');
  return sx.length >= 5 && Math.abs(sx.length - sy.length) <= 1 && distancia(sx, sy) <= 1;
}

/** Os nomes já em uso no contexto da pessoa: as empresas dela (todas), as compradas, as rivais com nome. */
export function nomesEmUso13(v: Vida): string[] {
  const out: string[] = [];
  for (const e of v.financas.empresas ?? []) {
    out.push(e.nome);
    for (const n of e.corp?.aquisicoes ?? []) out.push(n);
    for (const n of e.corp?.rivais ?? []) out.push(n);
  }
  return out;
}

const repete = (nome: string) => { const ws = semAcento(nome).split(/[^a-z0-9]+/).filter(w => w.length > 2); return new Set(ws).size !== ws.length; };

/**
 * Um nome de empresa do ramo e do porte, que não se confunde com nenhum dos `usados`. `r` é o gerador de quem chama (um
 * derivado: o nome não mexe no acaso de mais nada). `sobrenome`: a empresa pode levar o da família de quem funda.
 */
export function nomeDeEmpresa13(r: Rng, tipo: TipoEmpresa, porte: PorteDoSetor, usados: readonly string[], sobrenome?: string): string {
  const pecas = PECAS_13[tipo] ?? PECAS_13.industria!;
  const proprias = pecas.raizes ?? [];
  const tentar = (): string => {
    const x = r.next();
    // Metade das vezes uma raiz do próprio ramo; a outra metade, uma geral (lugares, bichos, astros).
    const raiz = proprias.length && r.chance(0.45) ? r.pick(proprias) : r.pick(RAIZES_13);
    const soPrefixo = /^(da|do|das|dos|de) /.test(raiz);
    if (sobrenome && x < 0.12) return r.pick(pecas.familia).replace('{sobrenome}', sobrenome);
    if (x < 0.22) return r.pick(pecas.familia).replace('{sobrenome}', r.pick(SOBRENOMES_13));
    if ((porte === 'grande' || porte === 'gigante') && x < 0.36 && !soPrefixo) return r.pick(PADROES_GRANDES_13).replace('{raiz}', raiz);
    if (porte === 'pequeno' && x < 0.3 && !soPrefixo) return r.pick(PADROES_PEQUENOS_13).replace('{raiz}', raiz);
    if (soPrefixo || x < 0.6) return `${r.pick(pecas.prefixos)} ${raiz}`;
    return `${raiz} ${r.pick(pecas.sufixos)}`;
  };
  let ultimo = '';
  for (let k = 0; k < 80; k++) {
    const n = tentar();
    ultimo = n;
    if (!repete(n) && !usados.some(u => nomesConfundem13(n, u))) return n;
  }
  return `${ultimo} ${usados.length + 2}`;
}

/** Um fundo, uma gestora, um grupo de investidores com nome. */
export function nomeDeFundo13(r: Rng, usados: readonly string[]): string {
  for (let k = 0; k < 40; k++) {
    const n = `${r.pick(FUNDOS_13.raiz)} ${r.pick(FUNDOS_13.sufixo)}`;
    if (!usados.some(u => nomesConfundem13(n, u))) return n;
  }
  return `${r.pick(FUNDOS_13.raiz)} ${r.pick(FUNDOS_13.sufixo)} ${usados.length + 2}`;
}
export const sobrenomeAoAcaso13 = (r: Rng) => r.pick(SOBRENOMES_13);

/** O nome de uma linha nova: o produto e uma marca que a empresa ainda não usa ("Salgadinho Crocante", "SUV Jaguara", "Satélite Iara-2"). */
export function nomeDaLinha13(r: Rng, prod: Pick<ProdutoDoSetor13, 'curto' | 'marcas'>, usados: readonly string[]): string {
  const pool = MARCAS_13[prod.marcas] ?? MARCAS_13.tech;
  const numerado = prod.marcas === 'espaco';
  const ja = usados.map(semAcento);
  for (let k = 0; k < 40; k++) {
    const m = r.pick(pool);
    if (ja.some(u => u.includes(semAcento(m)))) continue;
    return numerado ? `${prod.curto} ${m}-${r.int(1, 3)}` : `${prod.curto} ${m}`;
  }
  return `${prod.curto} ${r.pick(pool)} ${usados.length + 1}`;
}

/** O porte de base do ramo (para o nome): as pequenas são pequenas; as grandes, o que o catálogo diz. */
const porteDoTipo = (tipo: TipoEmpresa): PorteDoSetor => setorGrande(tipo)?.porte ?? 'pequeno';

/** As concorrentes com nome (três, geradas uma vez a partir da empresa — e gravadas por quem chama `garantirRivais13`). */
export function rivaisDe13(v: Vida, e: Empresa): string[] {
  if (e.corp?.rivais?.length) return e.corp.rivais;
  const r = rngDe(e.id, 'rivais13');
  const usados = nomesEmUso13(v);
  const out: string[] = [];
  for (let k = 0; k < 3; k++) out.push(nomeDeEmpresa13(r, e.tipo, porteDoTipo(e.tipo), [...usados, ...out]));
  return out;
}
export function garantirRivais13(v: Vida, e: Empresa): string[] {
  if (!e.corp) return [];
  if (!e.corp.rivais?.length) e.corp.rivais = rivaisDe13(v, e);
  return e.corp.rivais;
}
/** Uma concorrente sai (comprada): entra outra no lugar, com nome novo. */
export function trocarRival13(v: Vida, e: Empresa, saiu: string): void {
  if (!e.corp) return;
  const resto = (e.corp.rivais ?? []).filter(x => x !== saiu);
  const r = rngDe(e.id, 'rivais13', v.t, resto.length);
  resto.push(nomeDeEmpresa13(r, e.tipo, porteDoTipo(e.tipo), [...nomesEmUso13(v), ...resto, saiu]));
  e.corp.rivais = resto;
}

/* ================================================================ Produtos */

export const idxPos = (p: Posicionamento13) => POSICOES_13.indexOf(p);

/** O alvo de um lançamento: um produto (o item sai dele) ou um item (os saves e chamadas antigas). */
export function resolverProjeto13(s: SetorGrande, alvo: string): { it?: ItemDeProjeto; prod?: ProdutoDoSetor13 } {
  const prod = produtoDoSetor13(s.id, alvo);
  if (prod) return { it: s.itens.find(i => i.id === prod.item), prod };
  return { it: s.itens.find(i => i.id === alvo) };
}

/** O item com as sobreposições do produto: é o que as contas usam. */
export function itemEfetivo13(it: ItemDeProjeto, prod?: ProdutoDoSetor13): ItemDeProjeto {
  if (!prod) return it;
  const risco = prod.risco ?? 1;
  return {
    ...it, nome: prod.nome, descricao: prod.descricao,
    capex: prod.capex ?? it.capex, meses: prod.meses ?? it.meses, receita: prod.receita ?? it.receita, margem: prod.margem ?? it.margem, usa: prod.usa ?? it.usa,
    risco: it.risco * risco, ...(it.fatal ? { fatal: it.fatal * risco } : {})
  };
}
export function itemDoProjeto13(s: SetorGrande, p: Pick<ProjetoDaEmpresa, 'item' | 'produto'>): ItemDeProjeto | undefined {
  const it = s.itens.find(i => i.id === p.item);
  return it ? itemEfetivo13(it, produtoDoSetor13(s.id, p.produto)) : undefined;
}
export const produtoDoProjeto13 = (s: SetorGrande, p: Pick<ProjetoDaEmpresa, 'produto'>) => produtoDoSetor13(s.id, p.produto);
export { produtoPadrao13, produtosDoSetor13, produtosPequenos13, produtoPequeno13, NOME_POSICAO_13, POSICOES_13 };
export type { Posicionamento13, ProdutoDoSetor13, ProdutoPequeno13 };

export interface FatorDaLinha13 { demanda: number; preco: number; variavel: number; aceitacao: number; envelhece: number; mercado: number }
const NEUTRO_LINHA: FatorDaLinha13 = { demanda: 1, preco: 1, variavel: 1, aceitacao: 0, envelhece: 1, mercado: 1 };

/**
 * O que a linha muda nas contas do ano: o mercado do produto (cresce ou encolhe), a concorrência, o posicionamento (contra
 * o de nascença), o preço (pela sensibilidade do público), a qualidade investida e o envelhecimento sem versão nova.
 * Projeto sem produto: neutro.
 */
export function fatorDaLinha13(v: Vida, e: Empresa, s: SetorGrande, p: ProjetoDaEmpresa): FatorDaLinha13 {
  const prod = produtoDoSetor13(s.id, p.produto);
  if (!prod) return NEUTRO_LINHA;
  const l: LinhaDoProduto13 = p.linha ?? {};
  const anos = Math.max(0, (v.t - (p.tLanc ?? v.t)) / 12);
  const desdeVersao = Math.max(0, (v.t - (l.tRenov ?? p.tLanc ?? v.t)) / 12);
  const mercado = clamp(Math.pow(1 + prod.cresc, anos), 0.55, 1.8);
  // A concorrência conta CONTRA a do produto de nascença do item (os números do item já são os de um mercado como aquele).
  const ref = produtoPadrao13(s.id, p.item)?.conc ?? 3;
  let demanda = mercado * (1 + (ref - prod.conc) * 0.04);
  let preco = 1;
  let aceitacao = 0;
  const q = clamp(l.qualidade ?? 0, 0, 3);
  const pos = l.pos ?? prod.pos;
  const passos = idxPos(pos) - idxPos(prod.pos);
  if (passos > 0) { preco *= Math.pow(1.2, passos); demanda *= Math.pow(0.75, passos); }
  if (passos < 0) { preco *= Math.pow(0.85, -passos); demanda *= Math.pow(1.22, -passos); }
  // Subir de patamar sem marca nem qualidade: o público não compra a história.
  if (passos > 0 && e.reputacao < 60 && q < 2) { demanda *= 0.85; aceitacao -= 6; }
  const x = clamp(l.preco ?? 0, -0.2, 0.3);
  preco *= 1 + x;
  demanda *= Math.pow(1 + x, -prod.elast);
  aceitacao += -Math.max(0, x - 0.05 * q) * 40 + Math.max(0, -x) * 15;
  aceitacao += 4 * q;
  demanda *= 1 + 0.03 * q;
  const envelhece = prod.ciclo ? clamp(1 - Math.max(0, desdeVersao - prod.ciclo) * 0.05, 0.5, 1) : 1;
  return { demanda, preco, variavel: 1 + 0.04 * q, aceitacao, envelhece, mercado };
}

/** O que as linhas fazem pela reputação (pontos no alvo do ano): qualidade, premium que pegou, encalhe, preço abusivo. */
export function bonusDeReputacao13(s: SetorGrande, e: Empresa): number {
  let b = 0;
  for (const p of e.corp?.projetos ?? []) {
    if (p.estado !== 'ativo') continue;
    const prod = produtoDoSetor13(s.id, p.produto);
    if (!prod) continue;
    const q = p.linha?.qualidade ?? 0;
    b += q * 1.2;
    if ((p.linha?.pos ?? prod.pos) === 'premium' && (p.aceitacao ?? 50) >= 60) b += 1.5;
    if ((p.aceitacao ?? 50) < 35) b -= 2;
    if ((p.linha?.preco ?? 0) >= 0.2 && q === 0) b -= 1.5;
  }
  return clamp(b, -8, 8);
}

/* ================================================================ Leituras para a tela */

export const leituraDaConcorrencia13 = (c: number) => (c >= 5 ? 'feroz' : c >= 4 ? 'forte' : c >= 3 ? 'normal' : c >= 2 ? 'pouca' : 'quase nenhuma');
export const leituraDoCrescimento13 = (c: number) => (c >= 0.07 ? `cresce rápido (uns ${Math.round(c * 100)}% ao ano)` : c >= 0.03 ? `cresce (uns ${Math.round(c * 100)}% ao ano)` : c > 0 ? 'cresce devagar' : c === 0 ? 'estável' : c > -0.03 ? 'encolhendo devagar' : 'encolhendo');
export const leituraDoPreco13 = (elast: number) => (elast >= 1.6 ? 'o público sente qualquer aumento' : elast >= 1.2 ? 'sensível a preço' : elast >= 0.9 ? 'aceita algum aumento' : 'quem compra paga o que for preciso');
export function leituraDoRisco13(it: ItemDeProjeto): string {
  if (it.fatal && it.fatal >= 0.04) return 'alto: pode atrasar, estourar e até fracassar';
  if (it.fatal) return 'médio: atrasa e estoura com alguma frequência; fracassar é raro';
  return it.risco >= 0.2 ? 'médio: atraso e estouro são comuns' : 'baixo: atrasos pequenos';
}

export interface FichaDoProduto13 {
  id: string; familia: string; nome: string; descricao: string; publico: string; posicionamento: string;
  investimento: number; meses: number; capacidade: number; custoAnual: number; faturamento: number; margem: number;
  concorrencia: string; rivais: string[]; preco: string; risco: string; potencial: string; mercado: number;
}
/** A ficha de um produto antes de lançar (na moeda da vida: `k`). */
export function fichaDoProduto13(s: SetorGrande, prod: ProdutoDoSetor13, k: number, rivais: string[]): FichaDoProduto13 {
  const it = itemEfetivo13(s.itens.find(i => i.id === prod.item)!, prod);
  const faturamento = it.receita * k;
  return {
    id: prod.id, familia: prod.familia, nome: prod.nome, descricao: prod.descricao, publico: prod.publico, posicionamento: NOME_POSICAO_13[prod.pos],
    investimento: Math.round(it.capex * k / 1000) * 1000, meses: it.meses, capacidade: it.usa,
    // O custo de um ano maduro: o direto (o que a margem não cobre) e a parte da estrutura que a linha ocupa.
    custoAnual: Math.round((faturamento * (1 - it.margem) + s.fixoPorCapacidade * it.usa * k) / 1000) * 1000,
    faturamento: Math.round(faturamento / 1000) * 1000, margem: it.margem,
    concorrencia: leituraDaConcorrencia13(prod.conc), rivais: prod.conc >= 3 ? rivais.slice(0, prod.conc >= 4 ? 2 : 1) : [],
    preco: leituraDoPreco13(prod.elast), risco: leituraDoRisco13(it), potencial: leituraDoCrescimento13(prod.cresc), mercado: Math.round(prod.mercado * k)
  };
}

/** O preço de uma linha em palavras ("10% acima do mercado"). */
export const leituraDoPrecoDaLinha13 = (x: number) => (Math.abs(x) < 0.01 ? 'o de mercado' : `${Math.round(Math.abs(x) * 100)}% ${x > 0 ? 'acima' : 'abaixo'} do mercado`);
export const NOME_QUALIDADE_13 = ['padrão do ramo', 'caprichada', 'superior', 'de referência'];

/* ================================================================ Empresas pequenas */

/** O produto pequeno de um projeto antigo (sem `produto`): o primeiro do item, que tem os números do projeto de sempre. */
export const produtoPequenoDoProjeto13 = (tipo: TipoEmpresa, p: Pick<ProjetoDaEmpresa, 'item' | 'produto'>) =>
  produtoPequeno13(tipo, p.produto) ?? (p.produto ? undefined : produtosPequenos13(tipo).find(x => x.item === p.item));

/* ================================================================ Saves */

/**
 * VIDA 13 · saves antigos: tudo é opcional. Linhas com campos fora do lugar voltam ao padrão; listas que não são listas
 * somem; produto que não existe no catálogo vira o item genérico (como na 12.9). Nenhum nome é tocado. Idempotente.
 */
export function normalizarVida13Empresas(v: Vida): void {
  for (const e of v.financas.empresas ?? []) {
    if (e.decisoes13 !== undefined && !Array.isArray(e.decisoes13)) delete e.decisoes13;
    if (e.decisoes13) e.decisoes13 = e.decisoes13.filter(d => d && typeof d.t === 'number' && typeof d.titulo === 'string').slice(-8);
    if (e.corp && e.corp.rivais !== undefined && (!Array.isArray(e.corp.rivais) || e.corp.rivais.some(x => typeof x !== 'string'))) delete e.corp.rivais;
    const s = setorGrande(e.tipo);
    for (const p of [...(e.corp?.projetos ?? []), ...(e.projetos ?? [])]) {
      if (p.produto !== undefined && (typeof p.produto !== 'string' || (s ? !produtoDoSetor13(s.id, p.produto) : !produtoPequeno13(e.tipo, p.produto)))) delete p.produto;
      if (p.linha === undefined) continue;
      if (typeof p.linha !== 'object' || p.linha === null) { delete p.linha; continue; }
      const l = p.linha;
      if (l.pos !== undefined && !POSICOES_13.includes(l.pos)) delete l.pos;
      if (l.preco !== undefined) l.preco = typeof l.preco === 'number' && Number.isFinite(l.preco) ? clamp(l.preco, -0.2, 0.3) : 0;
      if (l.qualidade !== undefined) l.qualidade = typeof l.qualidade === 'number' && Number.isFinite(l.qualidade) ? Math.round(clamp(l.qualidade, 0, 3)) : 0;
      if (l.fatia !== undefined && !(typeof l.fatia === 'number' && Number.isFinite(l.fatia))) delete l.fatia;
    }
  }
}
