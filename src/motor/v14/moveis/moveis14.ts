/**
 * VIDA 14 · MÓVEIS — o espaço da casa, o depósito, os conjuntos e a mobília dos imóveis.
 *
 *   ESPAÇO      cada móvel ocupa uma área (m² de piso, já com o espaço de abrir e passar); cada cômodo comporta uma
 *               fração da área dele (o resto é circulação). Ao comprar: cabe no cômodo, cabe em outro cômodo onde faz
 *               sentido, ou vai para o DEPÓSITO — nunca some e nunca é proibido. Substituir: a peça antiga vai para o
 *               depósito e a nova entra no lugar dela.
 *   DEPÓSITO    um box alugado (cobra por ano, pelo tamanho do que está guardado); dá para retirar quando houver espaço.
 *   CONJUNTOS   sala, quarto, jantar e área externa, em seis estilos, com as peças do catálogo (desconto de conjunto).
 *   MOBILIADOS  o imóvel à venda ou para alugar vem vazio, semimobiliado, mobiliado ou mobiliado de luxo. No ALUGUEL as
 *               peças são do proprietário (`CoisaTida.doImovel`): ficam ao sair, não se vendem, e o que repete o que
 *               já é seu o proprietário guarda (sem duplicar). Na COMPRA a mobília é sua (paga junto, pelo valor de
 *               usada). Ninguém paga duas vezes pela mesma peça.
 */
import { rngDe } from '../../rng';
import type { CoisaTida, Moradia, Vida } from '../../tipos';
import { escrever } from '../../nucleo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { economiaLocal } from '../../dados/lugares';
import { coisa } from '../../dados/coisas';
import { modeloMoradia } from '../../dados/bens';
import { areaDoComodo, casaDaFamilia, coisasPorComodo, comodoDaCoisa, comodosDaCasa, naCasaAtual, type ComodoDaCasa } from '../../sistemas/lar';
import { coisasDaVida, precoDaCoisa, receberCoisa } from '../../sistemas/coisas';
import { pagar, vereditoDePagar } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import type { OfertaImovel } from '../../sistemas/mercado';
import {
  ACRESCIMO_DO_ALUGUEL, CONJUNTOS, COZINHA_DA_MOBILIA, ESTADO_DA_MOBILIA, ESTILOS, FATOR_DA_MOBILIA_NA_VENDA, NOME_DA_MOBILIA, QUARTO_DO_SEMIMOBILIADO,
  conjunto14, conjuntoDe, tipoDeMovel, type EstiloDeMovel, type NivelDeMobilia, type TipoDeMovel
} from '../../dados14/moveis/catalogo';

export const DEPOSITO = 'deposito';
/** A fração da área do cômodo que os móveis podem ocupar (o resto é passagem, porta, janela). */
const UTIL = 0.5;

/** Área ocupada (m²) — por peça quando ela foge do padrão do tipo. */
const OCUPA_PECA: Record<string, number> = {
  sofa: 2.2, sofa_retratil: 3, sofa_couro: 2.4, sofa_designer: 2.8, sofa_cama: 2.2, poltrona: 0.8, poltrona_designer: 1, poltronas_cinema: 4,
  colchao: 2.8, cama_box: 3.2, cama_king: 4.2, colchao_hotel: 4, cama_solteiro: 2, beliche: 2.1,
  mesa_jantar: 3.5, mesa_centro: 0.8, mesa_centro_marmore: 1, mesa_lateral: 0.3, criado_mudo: 0.3, escrivaninha: 1.2, mesa_executiva: 2, cadeira_ergonomica: 0.5, ilha_cozinha: 2.5,
  guarda_roupa: 1.4, comoda: 0.7, armarios_planejados: 2, closet: 4, penteadeira: 0.8, espelho_chao: 0.2, expositor_relogios: 0.4,
  estante_sala: 1, estante_escritorio: 0.8, aparador: 0.7, vitrine_colecao: 0.8, estante_trofeus: 0.8,
  banheira: 2, banheira_pedra: 2.4, sauna: 4, mesa_jogos: 4, playground: 10, cama_elastica: 8, lareira: 1,
  sofa_externo: 3, mesa_externa: 3, espreguicadeira: 1.4, espreguicadeira_teca: 1.6, churrasqueira: 1.5, espaco_gourmet: 6, forno_pizza: 1.5, pergolado: 9, gazebo: 9,
  geladeira: 0.7, geladeira_inox: 1, fogao: 0.5, cooktop_forno: 0.5, maquina_lavar: 0.5, lava_loucas: 0.4, adega: 0.4
};
const OCUPA_TIPO: Partial<Record<TipoDeMovel, number>> = { sofas: 2.4, poltronas: 0.9, camas: 3, mesas: 1.2, armarios: 1.2, closets: 1, estantes: 0.8, eletro: 0.3, externos: 2, lazer: 3, banheiro: 0.6 };

/** A área de piso que uma peça ocupa (0 para o que não ocupa chão: quadro, toalha, luminária, louça). */
export function ocupa14(coisaId: string): number {
  const c = coisa(coisaId);
  if (!c?.daCasa) return 0;
  if (OCUPA_PECA[coisaId] !== undefined) return OCUPA_PECA[coisaId];
  return OCUPA_TIPO[tipoDeMovel(coisaId, c.eletro === true)] ?? 0;
}

export interface EspacoDoComodo { id: string; nome: string; area: number; capacidade: number; usado: number; livre: number }
export function espacoDoComodo(v: Vida, c: ComodoDaCasa, porComodo = coisasPorComodo(v)): EspacoDoComodo {
  const area = areaDoComodo(v.moradia.modeloId, c);
  const capacidade = Math.round(area * UTIL * 10) / 10;
  const usado = Math.round((porComodo.get(c.id) ?? []).reduce((s, t) => s + ocupa14(t.coisaId), 0) * 10) / 10;
  return { id: c.id, nome: c.nome, area, capacidade, usado, livre: Math.round((capacidade - usado) * 10) / 10 };
}

export interface Encaixe14 { ocupa: number; comodo?: EspacoDoComodo; cabe: boolean; outro?: EspacoDoComodo; semControle?: boolean; substituiveis: CoisaTida[] }
/** Onde uma peça nova ficaria (o cômodo dela; senão outro em que faz sentido) e se cabe — e o que dá para substituir. */
export function encaixe14(v: Vida, coisaId: string, comodoId?: string): Encaixe14 {
  const ocupa = ocupa14(coisaId);
  const comodos = comodosDaCasa(v);
  if (!ocupa || !comodos.length || casaDaFamilia(v)) return { ocupa, cabe: true, semControle: true, substituiveis: [] };
  const por = coisasPorComodo(v);
  const fake = { id: '_novo', coisaId, t: v.t, preco: 0, estado: 100, comodo: comodoId } as CoisaTida;
  const alvo = comodoDaCoisa(v, fake, comodos)!;
  const esp = espacoDoComodo(v, alvo, por);
  const tipo = tipoDeMovel(coisaId, false);
  const substituiveis = (por.get(alvo.id) ?? []).filter(t => !t.lembranca && tipoDeMovel(t.coisaId, false) === tipo && ocupa14(t.coisaId) > 0);
  if (esp.livre >= ocupa) return { ocupa, comodo: esp, cabe: true, substituiveis };
  const mesmoTipo = comodos.filter(c => c.id !== alvo.id && c.tipo === alvo.tipo).map(c => espacoDoComodo(v, c, por)).find(e => e.livre >= ocupa);
  return { ocupa, comodo: esp, cabe: false, outro: mesmoTipo, substituiveis };
}

/** Depois de comprar: a peça vai para onde cabe (o cômodo dela, outro igual) ou para o depósito. Devolve a frase. */
export function acomodarCompra14(v: Vida, t: CoisaTida): string | undefined {
  if (!ocupa14(t.coisaId) || !comodosDaCasa(v).length || casaDaFamilia(v)) return undefined;
  // Calcula sem a peça nova (ela ainda não tem lugar).
  t.local = DEPOSITO;
  const e = encaixe14(v, t.coisaId, t.comodo);
  if (e.cabe && e.comodo) { t.local = undefined; t.comodo = e.comodo.id; return undefined; }
  if (e.outro) { t.local = undefined; t.comodo = e.outro.id; return `Na ${e.comodo?.nome} não cabia: ficou n${e.outro.nome.startsWith('a') ? 'a' : 'o'} ${e.outro.nome}.`; }
  return `Não havia espaço (${e.comodo?.nome ?? 'o cômodo'}: ${String(e.comodo?.livre ?? 0).replace('.', ',')} m² livres para ${String(e.ocupa).replace('.', ',')} m²): foi para o depósito. Dá para trocar por uma peça da casa ou retirar quando houver espaço.`;
}

/** O custo anual do depósito (o box cobra pelo volume guardado). */
export function custoDoDeposito14(v: Vida): number {
  const guardado = coisasDaVida(v).filter(t => t.local === DEPOSITO).reduce((s, t) => s + Math.max(0.3, ocupa14(t.coisaId)), 0);
  if (!guardado) return 0;
  return Math.round((60 + guardado * 18) * 12 * Math.max(0.5, economiaLocal(v.moradia.municipioId).custo) / 10) * 10;
}

/* ================================================================ Mobília dos imóveis */

export interface Mobilia14 { nivel: NivelDeMobilia; estilo: EstiloDeMovel; pecas: string[]; valor: number; acrescimo: number; precoExtra: number }

/** A mobília de uma oferta (sorteio derivado do id da oferta: a mesma oferta, a mesma mobília). */
export function mobiliaDaOferta14(v: Vida, o: OfertaImovel): Mobilia14 {
  const m = modeloMoradia(o.modeloId);
  const r = rngDe(v.id, 'mob14', o.id);
  const x = r.next();
  const nivel: NivelDeMobilia = o.modeloId === 'republica' ? 'mobiliado' : m.padrao >= 4 && x < 0.18 ? 'luxo' : x < 0.42 ? 'vazio' : x < 0.66 ? 'parcial' : x < 0.92 ? 'mobiliado' : m.padrao >= 3 ? 'luxo' : 'mobiliado';
  const estilo: EstiloDeMovel = nivel === 'luxo' ? 'luxo' : r.pick(ESTILOS.filter(e => e.id !== 'luxo').map(e => e.id));
  const pecas = pecasDaMobilia14(nivel, estilo, m.casa ?? false);
  const valor = pecas.reduce((s, id) => s + precoDaCoisa(v, id), 0);
  return { nivel, estilo, pecas, valor, acrescimo: ACRESCIMO_DO_ALUGUEL[nivel], precoExtra: Math.round(valor * FATOR_DA_MOBILIA_NA_VENDA / 1000) * 1000 };
}

export function pecasDaMobilia14(nivel: NivelDeMobilia, estilo: EstiloDeMovel, casa: boolean): string[] {
  if (nivel === 'vazio') return [];
  const out = [...COZINHA_DA_MOBILIA[nivel]];
  if (nivel === 'parcial') out.push(...QUARTO_DO_SEMIMOBILIADO);
  else {
    out.push(...conjuntoDe('sala', estilo).pecas.map(x => x.coisaId), ...conjuntoDe('quarto', estilo).pecas.map(x => x.coisaId), ...conjuntoDe('jantar', estilo).pecas.map(x => x.coisaId));
    if (nivel === 'luxo' && casa) out.push(...conjuntoDe('externa', estilo).pecas.map(x => x.coisaId));
  }
  return [...new Set(out)].filter(id => !!coisa(id));
}

/** As peças do proprietário de um contrato que já não é o de agora saem (ficaram no imóvel). Devolve quantas. */
export function limparMobilia14(v: Vida): number {
  if (v.moradia.mobilia14 && v.moradia.tipo !== 'aluguel') delete v.moradia.mobilia14;
  const contrato = v.moradia.mobilia14?.contrato;
  const lista = v.financas.coisas ?? [];
  const antes = lista.length;
  v.financas.coisas = lista.filter(t => !t.doImovel || t.doImovel === contrato);
  return antes - (v.financas.coisas?.length ?? 0);
}

/** Entra no imóvel com a mobília: no aluguel, as peças do proprietário (o que repete o seu, ele guarda); na compra, suas. */
export function instalarMobilia14(v: Vida, o: OfertaImovel, modo: 'aluguel' | 'compra'): string | undefined {
  const mob = mobiliaDaOferta14(v, o);
  limparMobilia14(v);
  if (mob.nivel === 'vazio') return undefined;
  const contrato = `ct14-${o.id}-${v.t}`;
  const meus = new Set(coisasDaVida(v).filter(t => naCasaAtual(t) && !t.doImovel).map(t => t.coisaId));
  const devolvidos: NonNullable<Moradia['mobilia14']>['devolvidos'] = [];
  const conj = (id: string) => CONJUNTOS.find(c => c.estilo === mob.estilo && c.pecas.some(p => p.coisaId === id))?.pecas.find(p => p.coisaId === id);
  let entrou = 0;
  for (const id of mob.pecas) {
    if (modo === 'aluguel' && meus.has(id)) { devolvidos.push({ coisaId: id, preco: precoDaCoisa(v, id) }); continue; }
    const t = receberCoisa(v, id, modo === 'compra' ? Math.round(precoDaCoisa(v, id) * FATOR_DA_MOBILIA_NA_VENDA) : 0, true);
    t.estado = ESTADO_DA_MOBILIA;
    const acab = conj(id)?.acabamento?.[0];
    if (acab) t.acabamento = acab;
    if (modo === 'aluguel') t.doImovel = contrato;
    entrou++;
  }
  if (modo === 'aluguel') {
    v.moradia.mobilia14 = { contrato, nivel: mob.nivel, estilo: mob.estilo, ...(devolvidos.length ? { devolvidos } : {}) };
    v.moradia.aluguel = Math.round(v.moradia.aluguel * (1 + mob.acrescimo) / 10) * 10;
  }
  // O que é seu e não cabe mais vai para o depósito (nunca some).
  const guardadas = reacomodar14(v);
  return `${NOME_DA_MOBILIA[mob.nivel]} (estilo ${ESTILOS.find(e => e.id === mob.estilo)!.nome.toLowerCase()}): ${entrou} peças ${modo === 'aluguel' ? 'do proprietário' : 'agora suas'}${devolvidos.length ? `; ${devolvidos.length} que repetiam as suas o proprietário guardou` : ''}${guardadas ? `; ${guardadas} peça${guardadas > 1 ? 's' : ''} sua${guardadas > 1 ? 's' : ''} sem lugar foi para o depósito` : ''}.`;
}

/** O que é seu e passou do espaço de um cômodo vai para o depósito (o maior primeiro). Devolve quantas. */
export function reacomodar14(v: Vida): number {
  const comodos = comodosDaCasa(v);
  if (!comodos.length || casaDaFamilia(v)) return 0;
  let n = 0;
  const por = coisasPorComodo(v);
  for (const c of comodos) {
    const esp = espacoDoComodo(v, c, por);
    let excesso = esp.usado - esp.capacidade;
    if (excesso <= 0) continue;
    const meus = (por.get(c.id) ?? []).filter(t => !t.doImovel && ocupa14(t.coisaId) > 0).sort((a, b) => ocupa14(b.coisaId) - ocupa14(a.coisaId));
    for (const t of meus) { if (excesso <= 0) break; t.local = DEPOSITO; excesso -= ocupa14(t.coisaId); n++; }
  }
  return n;
}

/* ================================================================ As ações */

export type OqueMoveis14 =
  | { op: 'guardar'; id: string }
  | { op: 'retirar'; id: string; comodo?: string }
  | { op: 'substituir'; novo: string; sai: string }
  | { op: 'conjunto'; id: string }
  | { op: 'devolver'; id: string };

const tida = (v: Vida, id: string) => coisasDaVida(v).find(t => t.id === id);

export function precoDoConjunto14(v: Vida, id: string): number {
  const c = conjunto14(id);
  if (!c) return 0;
  return Math.round(c.pecas.reduce((s, p) => s + precoDaCoisa(v, p.coisaId), 0) * 0.92 / 10) * 10;
}

export function disponibilidadeMoveis14(v: Vida, a: OqueMoveis14): Veredito {
  switch (a.op) {
    case 'guardar': { const t = tida(v, a.id); if (!t || !naCasaAtual(t)) return bloqueio('impossivel', 'Não está em casa.'); if (t.doImovel) return bloqueio('impossivel', 'É do proprietário: para tirar da casa, peça que ele guarde.'); return ocupa14(t.coisaId) ? PERMITIDO : bloqueio('impossivel', 'Isso não ocupa espaço: não precisa de depósito.'); }
    case 'retirar': { const t = tida(v, a.id); if (!t || t.local !== DEPOSITO) return bloqueio('impossivel', 'Não está no depósito.'); const e = encaixe14(v, t.coisaId, a.comodo); return e.cabe || e.outro ? PERMITIDO : bloqueio('incompativel', `Não cabe agora (${e.comodo?.nome}: ${String(e.comodo?.livre ?? 0).replace('.', ',')} m² livres para ${String(e.ocupa).replace('.', ',')} m²). Troque por uma peça da casa ou libere espaço.`); }
    case 'substituir': { const n = tida(v, a.novo), s = tida(v, a.sai); if (!n || n.local !== DEPOSITO || !s || !naCasaAtual(s)) return bloqueio('impossivel', 'Não se aplica.'); if (s.doImovel) return bloqueio('impossivel', 'A peça é do proprietário: peça que ele a guarde.'); return PERMITIDO; }
    case 'conjunto': { const c = conjunto14(a.id); if (!c) return bloqueio('impossivel', 'Esse conjunto não existe.'); if (v.t - v.eu.tNasc < 18 * 12) return bloqueio('requisito', 'A partir dos 18.'); return vereditoDePagar(v, precoDoConjunto14(v, a.id), 'O conjunto custa'); }
    case 'devolver': { const t = tida(v, a.id); return t?.doImovel ? PERMITIDO : bloqueio('impossivel', 'Essa peça é sua.'); }
  }
}

export function executarMoveis14(v: Vida, a: OqueMoveis14): string {
  switch (a.op) {
    case 'guardar': { const t = tida(v, a.id)!; t.local = DEPOSITO; return `${coisa(t.coisaId)?.nome ?? 'A peça'} foi para o depósito.`; }
    case 'retirar': {
      const t = tida(v, a.id)!;
      const e = encaixe14(v, t.coisaId, a.comodo);
      t.local = undefined;
      t.comodo = e.cabe ? e.comodo?.id : e.outro?.id;
      return `${coisa(t.coisaId)?.nome ?? 'A peça'} voltou para casa${e.cabe || e.outro ? `, n${(e.cabe ? e.comodo : e.outro)?.nome.startsWith('a') ? 'a' : 'o'} ${(e.cabe ? e.comodo : e.outro)?.nome}` : ''}.`;
    }
    case 'substituir': {
      const n = tida(v, a.novo)!, s = tida(v, a.sai)!;
      const comodo = comodoDaCoisa(v, s)?.id;
      s.local = DEPOSITO;
      n.local = undefined; n.comodo = comodo;
      return `Trocou: ${coisa(n.coisaId)?.nome} entrou; ${coisa(s.coisaId)?.nome} foi para o depósito.`;
    }
    case 'conjunto': {
      const c = conjunto14(a.id)!;
      const preco = precoDoConjunto14(v, a.id);
      pagar(v, preco);
      const notas: string[] = [];
      for (const p of c.pecas) {
        const t = receberCoisa(v, p.coisaId, Math.round(preco / c.pecas.length));
        if (p.acabamento?.[0]) t.acabamento = p.acabamento[0];
        const x = acomodarCompra14(v, t);
        if (x) notas.push(`${coisa(p.coisaId)?.nome}: ${t.local === DEPOSITO ? 'depósito' : 'outro cômodo'}`);
      }
      escrever(v, { texto: `Comprou o conjunto ${c.nome.toLowerCase()}.`, relevancia: 'cotidiano', tema: 'casa', escolha: true });
      return `${c.nome}: ${c.pecas.length} peças por ${fmt(preco)} (8% de desconto no conjunto).${notas.length ? ` Sem espaço para tudo — ${notas.join('; ')}.` : ''}`;
    }
    case 'devolver': {
      const t = tida(v, a.id)!;
      const mob = v.moradia.mobilia14;
      if (mob) (mob.devolvidos ??= []).push({ coisaId: t.coisaId, cor: t.cor, acabamento: t.acabamento, preco: precoDaCoisa(v, t.coisaId) });
      v.financas.coisas = (v.financas.coisas ?? []).filter(x => x.id !== t.id);
      return `O proprietário levou ${coisa(t.coisaId)?.nome ?? 'a peça'} para o depósito dele: o espaço é seu.`;
    }
  }
}

/** O ano: o depósito cobra. */
export function processarMoveis14(v: Vida): void {
  const c = custoDoDeposito14(v);
  if (c > 0) { pagar(v, Math.min(c, Math.max(0, v.financas.conta))); lancar(v, 'Depósito de móveis', 'despesa', -c); }
  limparMobilia14(v);
}

/** Para a tela: o espaço de cada cômodo, o que está no depósito, a mobília do proprietário. */
export function leituraMoveis14(v: Vida) {
  const por = coisasPorComodo(v);
  const comodos = casaDaFamilia(v) ? [] : comodosDaCasa(v).map(c => ({ ...espacoDoComodo(v, c, por), pecas: (por.get(c.id) ?? []).filter(t => ocupa14(t.coisaId) > 0).map(t => ({ id: t.id, nome: coisa(t.coisaId)?.nome ?? t.coisaId, ocupa: ocupa14(t.coisaId), doImovel: !!t.doImovel })) })).filter(c => c.pecas.length || c.capacidade >= 2);
  const deposito = coisasDaVida(v).filter(t => t.local === DEPOSITO).map(t => ({ id: t.id, nome: coisa(t.coisaId)?.nome ?? t.coisaId, ocupa: ocupa14(t.coisaId), coisaId: t.coisaId }));
  const m = v.moradia.mobilia14;
  return { comodos, deposito, custoDeposito: custoDoDeposito14(v), mobilia: m ? { nivel: NOME_DA_MOBILIA[m.nivel], estilo: ESTILOS.find(e => e.id === m.estilo)?.nome ?? m.estilo, guardados: m.devolvidos?.length ?? 0 } : undefined };
}

export function normalizarVida14Moveis(v: Vida): void {
  const m = v.moradia.mobilia14;
  if (m && (typeof m.contrato !== 'string' || v.moradia.tipo !== 'aluguel')) delete v.moradia.mobilia14;
  if (!v.moradia.mobilia14 && (v.financas.coisas ?? []).some(t => t.doImovel)) v.financas.coisas = (v.financas.coisas ?? []).filter(t => !t.doImovel);
}
