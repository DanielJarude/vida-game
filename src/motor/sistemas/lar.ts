/**
 * REWORK 12.4 — A CASA POR DENTRO (o núcleo): de que cômodos a casa é feita, o que está em cada um, quanto ela é
 * confortável e quanto custa o que se acrescentou.
 *
 * A casa é a planta do tipo de moradia (`dados/lar.PLANTAS`) mais o que a pessoa fez dela (`LarPersonalizado`: os
 * cômodos de obra, os quartos que mudaram de uso, os acabamentos). Os objetos são os de verdade (`financas.coisas`):
 * o cômodo mostra o que está nele, e só o que está na casa onde se mora (sem `local`) conta — o violão guardado no
 * depósito não toca no estúdio. O conforto sai dessas coisas, nunca do saldo da conta: ficar rico não mobilia a casa.
 *
 * Módulo de base (só lê tipos e catálogos): o dinheiro (custos do mês) e as coisas (a prática) o leem sem ciclo.
 */

import type { AspectoDoComodo, CoisaTida, Imovel, LarPersonalizado, Vida } from '../tipos';
import { clamp } from '../rng';
import { modeloMoradia, AREA_MORADIA } from '../dados/bens';
import { ACABAMENTOS, acabamentoDeOrigem, COMODO_DA_COISA, COMODOS, comodo as modeloComodo, opcaoDeAcabamento, plantaDe, type Planta, type TipoComodo } from '../dados/lar';

export interface ComodoDaCasa {
  /** O id estável do cômodo nesta casa ("sala", "quarto2", "piscina", "estudio_412"). */
  id: string;
  tipo: TipoComodo;
  nome: string;
  /** Veio com o imóvel, foi construído ou é um quarto que mudou de uso. */
  de: 'origem' | 'obra' | 'conversao';
}

/** A casa da família (dos pais, de um parente) é decisão dos adultos dela: não se personaliza. */
export const casaDaFamilia = (v: Vida) => v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente';

/** O imóvel onde se mora, quando é seu. */
export const imovelDaMoradia = (v: Vida): Imovel | undefined =>
  v.moradia.imovelId ? v.financas.bens.find((b): b is Imovel => b.tipo === 'imovel' && b.id === v.moradia.imovelId) : undefined;

/** Quem guarda o que foi feito da casa: o imóvel (é seu) ou o contrato de aluguel (fica na casa ao sair). */
export function donoDoLar(v: Vida): { lar?: LarPersonalizado } | undefined {
  if (casaDaFamilia(v)) return undefined;
  return imovelDaMoradia(v) ?? v.moradia;
}

/** O que se pode fazer na casa: tudo (é sua), o que não mexe na estrutura (alugada, cedida) ou nada (da família). */
export function poderSobreACasa(v: Vida): 'tudo' | 'superficie' | 'nada' {
  if (casaDaFamilia(v)) return 'nada';
  if (v.moradia.modeloId === 'republica') return 'superficie';
  return imovelDaMoradia(v) ? 'tudo' : 'superficie';
}

export const plantaDaCasa = (v: Vida): Planta => plantaDe(v.moradia.modeloId);

/** Os cômodos de uma casa (de um tipo de moradia e do que foi feito nela), na ordem em que se anda por ela. */
export function comodosDe(modeloId: string | undefined, lar: LarPersonalizado | undefined): ComodoDaCasa[] {
  const p = plantaDe(modeloId);
  const extras = lar?.extras ?? [];
  if (p.integrado) {
    const out: ComodoDaCasa[] = [{ id: 'quarto', tipo: 'quarto', nome: modeloId === 'republica' ? 'o seu quarto' : 'o cômodo (sala, cozinha e quarto)', de: 'origem' }];
    if (modeloId !== 'republica') out.push({ id: 'banheiro', tipo: 'banheiro', nome: 'banheiro', de: 'origem' });
    return out;
  }
  const m = modeloMoradia(modeloId ?? 'apto_2q');
  const out: ComodoDaCasa[] = [
    { id: 'sala', tipo: 'sala', nome: 'sala', de: 'origem' }, { id: 'cozinha', tipo: 'cozinha', nome: 'cozinha', de: 'origem' },
    { id: 'quarto', tipo: 'quarto', nome: 'quarto principal', de: 'origem' }
  ];
  for (let k = 2; k <= Math.max(1, m.quartos); k++) {
    const id = `quarto${k}`;
    const conv = extras.find(x => x.id === id && x.de === 'conversao');
    out.push(conv ? { id, tipo: conv.tipo as TipoComodo, nome: COMODOS[conv.tipo as TipoComodo]?.nome ?? 'quarto', de: 'conversao' } : { id, tipo: 'quarto_extra', nome: `quarto ${k}`, de: 'origem' });
  }
  out.push({ id: 'banheiro', tipo: 'banheiro', nome: 'banheiro', de: 'origem' });
  for (const t of p.extras) out.push({ id: t, tipo: t, nome: COMODOS[t].nome, de: 'origem' });
  for (const x of extras) if (x.de === 'obra') {
    // O quarto construído que depois mudou de uso tem a sua conversão registrada pelo mesmo id.
    const conv = extras.find(y => y.id === x.id && y.de === 'conversao');
    const tipo = (conv?.tipo ?? x.tipo) as TipoComodo;
    out.push({ id: x.id, tipo, nome: COMODOS[tipo]?.nome ?? x.tipo, de: conv ? 'conversao' : 'obra' });
  }
  return out;
}

export const comodosDaCasa = (v: Vida): ComodoDaCasa[] => (casaDaFamilia(v) ? [] : comodosDe(v.moradia.modeloId, donoDoLar(v)?.lar));

/** O terreno que sobra para construir (m²): a planta menos o que já se construiu. */
export function terrenoLivre(modeloId: string | undefined, lar: LarPersonalizado | undefined): number {
  const usado = (lar?.extras ?? []).filter(x => x.de === 'obra').reduce((s, x) => s + (COMODOS[x.tipo as TipoComodo]?.obra?.terreno ?? 0), 0);
  return Math.max(0, plantaDe(modeloId).terreno - usado);
}

/** Área do cômodo (m²): a referência do tipo, ajustada ao tamanho do imóvel (a sala da mansão não é a do apartamento). */
export function areaDoComodo(modeloId: string | undefined, c: ComodoDaCasa): number {
  const base = modeloComodo(c.tipo)?.area ?? 10;
  if (c.de === 'obra') return base;
  const escala = Math.sqrt((AREA_MORADIA[modeloId ?? ''] ?? 62) / 62);
  return Math.round(base * clamp(escala, 0.6, 3.2));
}

/** O acabamento de um aspecto de um cômodo (o escolhido; senão, o de origem do imóvel pelo padrão). */
export function acabamentoDoComodo(v: Vida, comodoId: string, a: AspectoDoComodo, lar = donoDoLar(v)?.lar): string {
  return lar?.acabamentos[comodoId]?.[a] ?? acabamentoDeOrigem(a, v.moradia.padrao);
}

/* ------------------------------------------------------------- objetos */

/** Está na casa onde se mora (não guardada noutro lugar, não emprestada). */
export const naCasaAtual = (t: { local?: string; emprestadaA?: string }) => !t.local && !t.emprestadaA;

/** Em que cômodo a coisa está: o escolhido (se a casa tem esse cômodo); senão, onde ela costuma ficar. */
export function comodoDaCoisa(v: Vida, t: CoisaTida, comodos = comodosDaCasa(v)): ComodoDaCasa | undefined {
  if (!comodos.length || !naCasaAtual(t)) return undefined;
  const escolhido = t.comodo ? comodos.find(c => c.id === t.comodo) : undefined;
  if (escolhido) return escolhido;
  for (const tipo of COMODO_DA_COISA[t.coisaId] ?? []) { const c = comodos.find(x => x.tipo === tipo); if (c) return c; }
  return comodos.find(c => c.tipo === 'quarto') ?? comodos[0];
}

/** As coisas de cada cômodo da casa (a casa mostra o que de fato tem). */
export function coisasPorComodo(v: Vida): Map<string, CoisaTida[]> {
  const comodos = comodosDaCasa(v);
  const out = new Map<string, CoisaTida[]>(comodos.map(c => [c.id, []]));
  for (const t of v.financas.coisas ?? []) {
    const c = comodoDaCoisa(v, t, comodos);
    if (c) out.get(c.id)!.push(t);
  }
  return out;
}

/** O cômodo tem o que ele pede para funcionar (a academia, um aparelho; o estúdio, um instrumento)? */
export function comodoEquipado(v: Vida, c: ComodoDaCasa, porComodo = coisasPorComodo(v)): boolean {
  const pede = modeloComodo(c.tipo)?.pede;
  if (!pede) return true;
  return (porComodo.get(c.id) ?? []).some(t => pede.includes(t.coisaId) && t.estado > 0 && !t.lembranca);
}

/** O que os cômodos equipados somam à prática de uma atividade (lido por `coisas.bonusDaAtividade`, com o teto de lá). */
export function bonusDosComodos(v: Vida, rotinaId: string): number {
  const comodos = comodosDaCasa(v);
  if (!comodos.length) return 0;
  const porComodo = coisasPorComodo(v);
  let soma = 0;
  const vistos = new Set<string>();
  for (const c of comodos) {
    const x = modeloComodo(c.tipo)?.ajuda?.[rotinaId];
    // Dois estúdios não dobram o estúdio: cada tipo de cômodo conta uma vez.
    if (!x || vistos.has(c.tipo) || !comodoEquipado(v, c, porComodo)) continue;
    vistos.add(c.tipo);
    soma += x;
  }
  return soma;
}

/* ------------------------------------------------------------- conforto */

/** Quantas pessoas moram na casa (você e quem divide a casa com você). */
export function moradores(v: Vida): number {
  return 1 + Object.values(v.vinculos).filter(x => x.convivio.includes('casa') && x.parentesco !== 'pet' && v.pessoas[x.pessoaId]?.vivo).length;
}

const ESSENCIAIS: [string, number][] = [['colchao', 5], ['sofa', 3], ['mesa_jantar', 2], ['roupa_de_cama', 2], ['maquina_lavar', 2], ['cozinha_equipada', 2]];

export interface LeituraDoConforto { valor: number; palavra: string; partes: { rotulo: string; valor: number }[] }

/**
 * O conforto da casa (0..100) e de onde ele vem — o padrão do imóvel, os acabamentos que a pessoa pôs, a conservação, o
 * que tem dentro (a cama boa, o sofá, a mesa), os cômodos equipados e o aperto (gente demais para os quartos).
 */
export function confortoDaCasa(v: Vida): LeituraDoConforto {
  const partes: { rotulo: string; valor: number }[] = [];
  const padrao = v.moradia.padrao;
  partes.push({ rotulo: 'O padrão do imóvel', valor: padrao * 9 + 5 });
  const comodos = comodosDaCasa(v);
  const lar = donoDoLar(v)?.lar;
  if (comodos.length && lar && Object.keys(lar.acabamentos).length) {
    // Só os cômodos de dentro (onde há piso e luz): a média do que se escolheu contra a do padrão de origem.
    const internos = comodos.filter(c => !['jardim', 'piscina', 'garagem', 'lazer'].includes(c.tipo));
    const nivel = (a: AspectoDoComodo, c: ComodoDaCasa) => opcaoDeAcabamento(a, acabamentoDoComodo(v, c.id, a, lar))?.nivel ?? 1;
    const origem = (a: AspectoDoComodo) => opcaoDeAcabamento(a, acabamentoDeOrigem(a, padrao))?.nivel ?? 1;
    const delta = internos.reduce((s, c) => s + (nivel('piso', c) - origem('piso')) + (nivel('luz', c) - origem('luz')) * 0.8, 0) / Math.max(1, internos.length);
    const pintou = internos.filter(c => lar.acabamentos[c.id]?.parede).length / Math.max(1, internos.length);
    const x = Math.round(delta * 5 + pintou * 3);
    if (x) partes.push({ rotulo: 'Os acabamentos que você escolheu', valor: x });
  }
  const im = imovelDaMoradia(v);
  if (im) { const x = Math.round((im.estado - 70) / 3); if (x) partes.push({ rotulo: im.estado < 60 ? 'A casa pedindo reparo' : 'A conservação', valor: x }); }
  const aqui = (v.financas.coisas ?? []).filter(t => naCasaAtual(t) && t.estado > 0 && !t.lembranca);
  const tem = (id: string) => aqui.some(t => t.coisaId === id);
  const dentro = casaDaFamilia(v) ? 0 : ESSENCIAIS.reduce((s, [id, x]) => s + (tem(id) ? x : 0), 0);
  if (dentro) partes.push({ rotulo: 'O que tem dentro (cama, sofá, mesa…)', valor: dentro });
  if (comodos.length) {
    const porComodo = coisasPorComodo(v);
    const equipados = comodos.filter(c => modeloComodo(c.tipo)?.lazer && comodoEquipado(v, c, porComodo)).length;
    if (equipados) partes.push({ rotulo: 'Cômodos de lazer em uso', valor: Math.min(8, equipados * 2) });
    const quartos = comodos.filter(c => c.tipo === 'quarto' || c.tipo === 'quarto_extra').length;
    const sobra = quartos * 2 - moradores(v);
    if (sobra < 0) partes.push({ rotulo: 'Gente demais para os quartos', valor: Math.max(-20, sobra * 6) });
  }
  const valor = clamp(Math.round(partes.reduce((s, p) => s + p.valor, 0)), 5, 100);
  const palavra = valor >= 80 ? 'muito confortável' : valor >= 62 ? 'confortável' : valor >= 45 ? 'razoável' : valor >= 30 ? 'apertada' : 'difícil';
  return { valor, palavra, partes };
}

/**
 * O ano dentro de casa: a casa confortável descansa (um pouco); a casa difícil cansa (um pouco). Só para quem cuida da
 * própria casa — na dos pais, a casa é dos pais. Pequeno de propósito: a casa é pano de fundo, não atalho.
 */
export function efeitoDoAnoEmCasa(v: Vida): { felicidade: number; estresse: number } {
  if (casaDaFamilia(v)) return { felicidade: 0, estresse: 0 };
  const c = confortoDaCasa(v).valor;
  return { felicidade: clamp((c - 50) / 20, -2, 2), estresse: -clamp((c - 50) / 25, -1.5, 1.5) };
}

/* ------------------------------------------------------------- custos */

/** O que custa por mês o que a pessoa acrescentou à casa (a piscina que construiu, o mármore, a automação). */
export function custoMensalDoLar(modeloId: string | undefined, lar: LarPersonalizado | undefined, c: number, modelo = modeloId): number {
  if (!lar) return 0;
  let soma = 0;
  for (const x of lar.extras) if (x.de === 'obra') soma += COMODOS[x.tipo as TipoComodo]?.manutencao ?? 0;
  for (const [id, a] of Object.entries(lar.acabamentos)) {
    const cm = comodosDe(modelo, lar).find(y => y.id === id);
    if (!cm) continue;
    const piso = opcaoDeAcabamento('piso', a.piso);
    if (piso?.manutencao) soma += piso.manutencao * areaDoComodo(modeloId, cm);
    soma += opcaoDeAcabamento('luz', a.luz)?.manutencao ?? 0;
  }
  return Math.round(soma * c);
}

/** O preço de trocar um aspecto de um cômodo (material e mão de obra, na cidade). */
export function precoDoAcabamento(modeloId: string | undefined, cm: ComodoDaCasa, a: AspectoDoComodo, id: string, custoLocal: number): number {
  const o = opcaoDeAcabamento(a, id);
  if (!o) return 0;
  const area = areaDoComodo(modeloId, cm);
  // Parede: a área das paredes (~2,6× o piso de um cômodo comum).
  const m2 = a === 'parede' ? area * 2.6 : area;
  const base = o.porM2 ? o.preco * m2 + (a === 'piso' ? 40 * m2 : 0) : o.preco;
  return Math.round(base * custoLocal / 10) * 10;
}

export const ASPECTOS: AspectoDoComodo[] = ['piso', 'parede', 'luz'];
export { ACABAMENTOS };
