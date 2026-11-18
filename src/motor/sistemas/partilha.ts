/**
 * Casal e patrimônio: o que é de cada um e o que é de vocês.
 *
 * Simplificação documentada (não é direito de família): a união que durou —
 * casamento, ou morar junto por dois anos ou mais — segue a lógica da
 * comunhão parcial: o que o casal CONSTRUIU junto (o quanto o patrimônio
 * líquido cresceu desde que passaram a morar juntos) se divide ao meio na
 * separação. O que cada um tinha antes, e o que herdou, continua de cada um.
 *
 * A separação também muda a casa: o aluguel que cabia em duas rendas pode
 * não caber numa só; a casa comprada junto às vezes precisa ser vendida.
 */

import type { Bem, Heranca, Pessoa, RegimeDeBens, Vida } from '../tipos';
import { escrever, filhos, idadePessoa, lembrarCom } from '../nucleo';
import { dinheiro as fmt } from '../texto';
import { balanco, pagar, disponivel, rendaPropriaMensal } from './dinheiro';
import { voltarParaCasaDosPais } from './moradia';
import { valorDeVendaImovel } from './imoveis';
import { valorDeVenda } from './veiculos';
import { totalAplicado } from './investimentos';
import { dividaDoBem } from './obrigacoes';
import { modeloMoradia } from '../dados/bens';
import { aluguelDe } from './mercado';

/** Marca o começo da vida material em comum (a primeira vez que passam a morar juntos). */
export function comecarVidaEmComum(v: Vida, p: Pessoa): void {
  const chave = `uniao_${p.id}`;
  if (v.fatos[chave] !== undefined) return;
  v.fatos[chave] = v.t;
  v.fatos[`patrimonio_uniao_${p.id}`] = Math.max(0, balanco(v).liquido);
  v.fatos[`herdado_ate_uniao_${p.id}`] = v.fatos['herdado_total'] ?? 0;
  // VIDA 27 · §5: a fotografia dos DOIS lados — o dinheiro e as aplicações seus, e o que a outra pessoa tinha.
  v.fatos[`liquido_uniao_${p.id}`] = liquidoProprio(v);
  v.fatos[`posses_par_uniao_${p.id}`] = possesDe(p);
}

const liquidoProprio = (v: Vida) => Math.max(0, Math.round(v.financas.conta)) + Math.round(totalAplicado(v));
const possesDe = (p: Pessoa) => Math.max(0, Math.round((p.posses?.dinheiro ?? 0) + (p.posses?.bens ?? []).reduce((s, b) => s + b.valor, 0)));

/** Quanto o casal construiu junto até agora, do seu lado (o cálculo antigo: o crescimento do patrimônio líquido). */
export function construidoJunto(v: Vida, p: Pessoa): number {
  const inicio = v.fatos[`patrimonio_uniao_${p.id}`];
  if (inicio === undefined) return 0;
  const herdadoDepois = (v.fatos['herdado_total'] ?? 0) - (v.fatos[`herdado_ate_uniao_${p.id}`] ?? 0);
  return Math.max(0, balanco(v).liquido - inicio - Math.max(0, herdadoDepois));
}

export const uniaoConta = (v: Vida, p: Pessoa, estagio: string) =>
  estagio === 'casamento' || (v.fatos[`uniao_${p.id}`] !== undefined && v.t - v.fatos[`uniao_${p.id}`] >= 24);

export const NOME_DO_REGIME: Record<RegimeDeBens, string> = { comunhao_parcial: 'comunhão parcial de bens', separacao_total: 'separação total de bens', comunhao_universal: 'comunhão universal de bens' };

/**
 * VIDA 27 · §5 — a partilha planejada (antes de acontecer: é o que o resumo mostra e o que se aplica, igual).
 *
 * Antes: só o crescimento do SEU patrimônio entrava (o que a outra pessoa juntou, nunca), a valorização de um imóvel
 * que já era seu contava como "construído junto", e o pagamento saía do dinheiro, depois da venda da casa (mesmo que a
 * venda não cobrisse: conta negativa), depois de uma dívida — confundindo patrimônio com dinheiro. Agora:
 *   · comunhão parcial (o padrão, e a união estável): entram, dos dois lados, os bens comprados durante a união (o
 *     valor menos o que falta financiar), o dinheiro e as aplicações que cresceram, as empresas abertas na união, menos
 *     as dívidas feitas na união; ficam de fora o que cada um tinha antes e as heranças;
 *   · comunhão universal: tudo dos dois entra; separação total: nada se divide;
 *   · cada um tem direito à metade da soma: quem tem mais na partilha passa a diferença — em dinheiro até onde há
 *     dinheiro; depois, com bens da união (que vão com a dívida deles); um bem grande demais é vendido e a sobra fica;
 *     o que não couber (uma empresa não se divide no balcão) vira um acordo parcelado. Nunca saldo negativo.
 * Simplificação de jogo (sem sub-rogação, sem cláusulas de herança); o lado da outra pessoa é o que ela tem no jogo
 * (`Pessoa.posses`); sem a fotografia do começo (saves antigos), o que ela juntou não é conhecido e conta zero.
 */
export interface PlanoDePartilha {
  regime: RegimeDeBens;
  divide: boolean;
  meu: number; dela: number;
  /** > 0: você passa à outra pessoa; < 0: recebe. */
  saldo: number;
  emDinheiro: number;
  entregar: { bemId: string; nome: string; valor: number; divida: number }[];
  vender?: { bemId: string; nome: string; liquido: number };
  acordo: number;
  receber: number;
  /** O que a outra pessoa devolve porque um bem entregue valia um pouco mais que a diferença. */
  troco: number;
}

function bensDaUniao(v: Vida, p: Pessoa, regime: RegimeDeBens): Bem[] {
  const t0 = v.fatos[`uniao_${p.id}`] ?? v.t;
  return v.financas.bens.filter(b => !b.bloqueio && (regime === 'comunhao_universal' || (!(b.tipo === 'imovel' && b.herdado) && ((b.tipo === 'imovel' && b.dono === 'casal') || b.tCompra >= t0))));
}

export function planoDaPartilha(v: Vida, p: Pessoa, estagio: string): PlanoDePartilha {
  const regime = v.vinculos[p.id]?.romance?.regime ?? 'comunhao_parcial';
  const nada: PlanoDePartilha = { regime, divide: false, meu: 0, dela: 0, saldo: 0, emDinheiro: 0, entregar: [], acordo: 0, receber: 0, troco: 0 };
  if (!uniaoConta(v, p, estagio) || regime === 'separacao_total') return nada;
  const t0 = v.fatos[`uniao_${p.id}`] ?? v.t;
  const f = v.financas;
  const equity = (b: Bem) => Math.max(0, b.valor - (dividaDoBem(v, b.id)?.saldo ?? 0));
  const bens = bensDaUniao(v, p, regime);
  let meu: number, dela: number;
  if (regime === 'comunhao_universal') { meu = Math.max(0, balanco(v).liquido); dela = possesDe(p); }
  else {
    const herdado = Math.max(0, (v.fatos['herdado_total'] ?? 0) - (v.fatos[`herdado_ate_uniao_${p.id}`] ?? 0));
    const valorBens = bens.reduce((s, b) => s + equity(b), 0);
    const ini = v.fatos[`liquido_uniao_${p.id}`];
    // Save antigo (sem a fotografia do dinheiro): o crescimento líquido menos os bens da união, até o dinheiro de agora.
    const ganho = ini !== undefined ? liquidoProprio(v) - ini - herdado : Math.min(liquidoProprio(v), construidoJunto(v, p) - valorBens);
    const empresas = (f.empresas ?? []).filter(e => e.estado !== 'encerrada' && e.tInicio >= t0).reduce((s, e) => s + Math.max(0, e.avaliacao ?? 0) * e.parte, 0);
    const dividas = f.dividas.filter(d => !d.bemId && (d.tInicio ?? 0) >= t0 && d.tipo !== 'fies').reduce((s, d) => s + d.saldo, 0);
    meu = Math.max(0, Math.round(valorBens + Math.max(0, ganho) + empresas - dividas));
    const iniPar = v.fatos[`posses_par_uniao_${p.id}`];
    dela = iniPar !== undefined ? Math.max(0, possesDe(p) - iniPar) : 0;
  }
  const saldo = Math.round((meu - dela) / 2);
  const plano: PlanoDePartilha = { ...nada, divide: true, meu, dela, saldo };
  if (saldo < -1000) { plano.receber = Math.min(-saldo, possesDe(p)); return plano; }
  if (saldo <= 1000) return plano;
  let falta = saldo;
  plano.emDinheiro = Math.min(falta, Math.max(0, disponivel(v)));
  falta -= plano.emDinheiro;
  // Depois do dinheiro, os bens da união: o veículo, o imóvel que não é a moradia, a moradia por último.
  const ordem = [...bens].sort((a, b) => (a.tipo === 'veiculo' ? 0 : v.moradia.imovelId === a.id ? 2 : 1) - (b.tipo === 'veiculo' ? 0 : v.moradia.imovelId === b.id ? 2 : 1) || equity(a) - equity(b));
  for (const b of ordem) {
    if (falta <= 0) break;
    const eq = equity(b);
    if (eq <= 0) continue;
    if (eq <= falta * 1.1) {
      plano.entregar.push({ bemId: b.id, nome: b.nome, valor: b.valor, divida: dividaDoBem(v, b.id)?.saldo ?? 0 });
      plano.troco += Math.max(0, eq - falta);
      falta -= eq;
    } else {
      const liquido = (b.tipo === 'imovel' ? valorDeVendaImovel(b) : valorDeVenda(b, v)) - (dividaDoBem(v, b.id)?.saldo ?? 0);
      if (liquido <= 0) continue;
      plano.vender = { bemId: b.id, nome: b.nome, liquido };
      falta -= Math.min(falta, liquido);
      break;
    }
  }
  plano.acordo = Math.max(0, Math.round(falta));
  return plano;
}

/** O resumo para ler antes de confirmar (o que fica com cada um, o que se paga, as dívidas, o dinheiro depois). */
export function resumoDaPartilha(v: Vida, p: Pessoa, estagio: string): { linhas: string[]; contaDepois: number } {
  const pl = planoDaPartilha(v, p, estagio);
  const conta = Math.round(v.financas.conta);
  if (!pl.divide) {
    const porque = pl.regime === 'separacao_total' ? 'o regime é de separação total: cada um fica com o que é seu' : 'a união não chegou a dividir patrimônio (casamento, ou dois anos morando juntos)';
    return { linhas: [`Não há partilha: ${porque}.`, `O que é seu continua seu; as suas dívidas continuam suas.`], contaDepois: conta };
  }
  const L: string[] = [`Regime: ${NOME_DO_REGIME[pl.regime]}. Entra na partilha: do seu lado, ${fmt(pl.meu)}; do lado de ${p.nome}, ${fmt(pl.dela)}.`];
  const entregues = new Set(pl.entregar.map(x => x.bemId));
  if (pl.saldo > 1000) {
    L.push(`Cada um tem direito à metade: você passa ${fmt(pl.saldo)} a ${p.nome}.`);
    if (pl.emDinheiro) L.push(`Em dinheiro (conta e aplicações): ${fmt(pl.emDinheiro)}.`);
    for (const x of pl.entregar) L.push(`Fica com ${p.nome}: ${x.nome} (${fmt(x.valor)}${x.divida ? `, com o financiamento de ${fmt(x.divida)}` : ''}).`);
    if (pl.troco) L.push(`${p.nome} devolve ${fmt(pl.troco)}, a diferença do bem.`);
    if (pl.vender) L.push(`${cap(pl.vender.nome)} é vendid${pl.vender.nome.startsWith('casa') ? 'a' : 'o'} (${fmt(pl.vender.liquido)} livres); a sobra fica com você.`);
    if (pl.acordo) L.push(`O que não coube (${fmt(pl.acordo)}) vira um acordo em 60 parcelas — dívida, não saldo negativo.`);
  } else if (pl.saldo < -1000) L.push(`Cada um tem direito à metade: ${p.nome} passa ${fmt(pl.receber)} a você.`);
  else L.push('Os dois lados ficaram parecidos: ninguém passa nada a ninguém.');
  const ficam = v.financas.bens.filter(b => !entregues.has(b.id) && b.id !== pl.vender?.bemId).map(b => b.nome);
  if (ficam.length) L.push(`Fica com você: ${ficam.join(', ')}.`);
  const dividas = v.financas.dividas.filter(d => !d.bemId || (!entregues.has(d.bemId) && d.bemId !== pl.vender?.bemId));
  if (dividas.length || pl.acordo) L.push(`Dívidas que continuam suas: ${[...dividas.map(d => `${d.descricao ?? d.tipo} (${fmt(d.saldo)})`), ...(pl.acordo ? [`o acordo da partilha (${fmt(pl.acordo)})`] : [])].join('; ')}.`);
  // O saldo depois: o MESMO plano aplicado numa cópia (o resumo não tem conta própria que possa divergir).
  const copia = JSON.parse(JSON.stringify(v)) as Vida;
  aplicarPartilha(copia, copia.pessoas[p.id], pl);
  const contaDepois = Math.round(copia.financas.conta);
  L.push(`Na conta, depois: ${fmt(contaDepois)}${pl.emDinheiro > Math.max(0, conta) ? ' (parte saiu das aplicações)' : ''}. Patrimônio líquido: de ${fmt(balanco(v).liquido)} para ${fmt(balanco(copia).liquido)}.`);
  return { linhas: L, contaDepois };
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** Aplica a partilha planejada (o mesmo plano do resumo). Devolve o que contar na biografia. */
function aplicarPartilha(v: Vida, p: Pessoa, pl: PlanoDePartilha): string[] {
  const f = v.financas;
  const partes: string[] = [];
  if (pl.receber > 0) {
    f.conta += pl.receber;
    if (p.posses) p.posses.dinheiro = Math.max(0, p.posses.dinheiro - pl.receber);
    partes.push(`${p.nome} passou ${fmt(pl.receber)} a você, a metade do que construíram`);
    lembrarCom(v, p.id, `Dividiram o que construíram juntos: ${fmt(pl.receber)} vieram para você.`, 'conflito', 2);
    return partes;
  }
  if (pl.saldo <= 1000) return partes;
  if (pl.emDinheiro > 0) pagar(v, pl.emDinheiro);
  const posses = (p.posses ??= { dinheiro: 0, bens: [], historia: [] });
  posses.dinheiro += pl.emDinheiro;
  let pago = pl.emDinheiro;
  for (const x of pl.entregar) {
    const b = f.bens.find(y => y.id === x.bemId);
    if (!b) continue;
    f.bens = f.bens.filter(y => y.id !== b.id);
    f.dividas = f.dividas.filter(d => d.bemId !== b.id);
    if (f.veiculoPrincipal === b.id) f.veiculoPrincipal = undefined;
    posses.bens.push(b);
    pago += Math.max(0, x.valor - x.divida);
    partes.push(`${b.nome} ficou com ${p.nome}`);
    if (v.moradia.imovelId === b.id) {
      v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_1q', aluguel: aluguelDe(v, modeloMoradia('apto_1q'), v.moradia.municipioId), padrao: 3, tInicio: v.t, aceitaPet: true };
    }
  }
  if (pl.troco > 0) { f.conta += pl.troco; posses.dinheiro = Math.max(0, posses.dinheiro - pl.troco); pago -= pl.troco; }
  if (pl.vender) {
    const b = f.bens.find(y => y.id === pl.vender!.bemId);
    if (b) {
      const resta = Math.max(0, pl.saldo - pago - pl.acordo);
      f.bens = f.bens.filter(y => y.id !== b.id);
      f.dividas = f.dividas.filter(d => d.bemId !== b.id);
      if (f.veiculoPrincipal === b.id) f.veiculoPrincipal = undefined;
      f.conta += pl.vender.liquido - resta;
      posses.dinheiro += resta;
      partes.push(`${b.nome} foi vendid${b.nome.startsWith('casa') ? 'a' : 'o'}`);
      if (v.moradia.imovelId === b.id) v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_1q', aluguel: aluguelDe(v, modeloMoradia('apto_1q'), v.moradia.municipioId), padrao: 3, tInicio: v.t, aceitaPet: true };
    }
  }
  if (pl.acordo > 0) {
    f.dividas.push({ id: `d${v.seq++}`, tipo: 'acordo', saldo: pl.acordo, jurosMes: 0.005, parcela: Math.max(300, Math.round(pl.acordo / 60)), descricao: `Parte de ${p.nome} na partilha`, tInicio: v.t, prazo: 60 });
    partes.push(`${fmt(pl.acordo)} ficaram num acordo parcelado`);
  }
  partes.unshift(`${fmt(pl.saldo)} ficaram com ${p.nome}, a metade da diferença do que construíram (${NOME_DO_REGIME[pl.regime]})`);
  lembrarCom(v, p.id, `Dividiram o que construíram juntos: ${fmt(pl.saldo)} foram para ${p.nome}.`, 'conflito', 2);
  return partes;
}

/**
 * Separação de quem morava junto: partilha, casa, filhos. Chamada com o
 * vínculo já como `ex`.
 */
export function separarVidaMaterial(v: Vida, p: Pessoa, estagio: string): void {
  const partes = aplicarPartilha(v, p, planoDaPartilha(v, p, estagio));
  // A casa que cabia em duas rendas pode não caber numa só.
  const m = v.moradia;
  const renda = rendaPropriaMensal(v);
  if ((m.tipo === 'aluguel') && m.aluguel > Math.max(1, renda) * 0.45) {
    const comFilhos = filhos(v).some(fl => idadePessoa(v, fl) < 18 && v.vinculos[fl.id]?.convivio.includes('casa'));
    const idadeEu = Math.floor((v.t - v.eu.tNasc) / 12);
    if (idadeEu < 35 && !comFilhos && voltarParaCasaDosPais(v)) partes.push('você voltou para a casa da família');
    else {
      const menor = modeloMoradia(comFilhos ? 'apto_2q' : renda < 2500 ? 'kitnet' : 'apto_1q');
      v.moradia = { tipo: 'aluguel', municipioId: m.municipioId, modeloId: menor.id, aluguel: aluguelDe(v, menor, m.municipioId), padrao: menor.padrao, tInicio: v.t, aceitaPet: true };
      partes.push(`o aluguel não cabia numa renda só: mudou para ${menor.nome.startsWith('casa') ? 'uma' : 'um'} ${menor.nome}`);
    }
  }
  if (partes.length) escrever(v, { texto: `A separação dividiu também a vida material: ${partes.join('; ')}.`, relevancia: 'biografia', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
}

/**
 * O que fica quando a pessoa morre (simplificado, sem direito sucessório
 * completo): as dívidas são pagas com o que havia — nunca passam para os
 * herdeiros. Do que sobra, o cônjuge (ou quem morava junto há anos) fica com
 * a sua metade do que construíram juntos; o restante se divide igualmente
 * entre o cônjuge e os filhos vivos (netos no lugar de um filho que já se
 * foi). Sem cônjuge nem descendentes, vai para os pais ou irmãos.
 */
export function calcularHeranca(v: Vida): Heranca {
  const b = balanco(v);
  const liquido = Math.max(0, b.liquido);
  const bens = v.financas.bens.map(x => x.nome + (x.tipo === 'imovel' && x.municipioId !== v.moradia.municipioId ? ` em ${x.municipioId.split('-')[0].replace(/(^|\s)\S/g, s => s.toUpperCase())}` : ''));
  const partes: Heranca['partes'] = [];
  const par = Object.values(v.vinculos).find(x => x.romance && (x.romance.estagio === 'casamento' || (x.romance.estagio === 'morando_junto' && uniaoConta(v, v.pessoas[x.pessoaId], 'morando_junto'))) && v.pessoas[x.pessoaId]?.vivo);
  const conjuge = par ? v.pessoas[par.pessoaId] : undefined;
  let resto = liquido;
  if (conjuge) {
    const meacao = Math.min(resto, Math.round(construidoJunto(v, conjuge) / 2));
    if (meacao > 0) partes.push({ pessoaId: conjuge.id, valor: meacao, papel: 'conjuge', meacao: true });
    resto -= meacao;
  }
  const herdeiros: { id: string; papel: Heranca['partes'][number]['papel'] }[] = [];
  const seus = Object.values(v.vinculos).filter(x => x.parentesco === 'filho').map(x => v.pessoas[x.pessoaId]).filter(Boolean);
  for (const fl of seus) {
    if (fl.vivo) herdeiros.push({ id: fl.id, papel: 'filho' });
    else {
      const netos = Object.values(v.pessoas).filter(n => n.vivo && n.genitores?.includes(fl.id));
      for (const n of netos) herdeiros.push({ id: n.id, papel: 'neto' });
    }
  }
  if (conjuge && herdeiros.length) herdeiros.push({ id: conjuge.id, papel: 'conjuge' });
  if (!herdeiros.length) {
    if (conjuge) herdeiros.push({ id: conjuge.id, papel: 'conjuge' });
    else for (const x of Object.values(v.vinculos)) {
      const p = v.pessoas[x.pessoaId];
      if (p?.vivo && !p.especie && (x.parentesco === 'mae' || x.parentesco === 'pai' || x.parentesco === 'irmao')) herdeiros.push({ id: p.id, papel: 'outro' });
    }
  }
  if (herdeiros.length && resto > 0) {
    const cada = Math.round(resto / herdeiros.length);
    for (const h of herdeiros) {
      const ja = partes.find(x => x.pessoaId === h.id);
      if (ja) ja.valor += cada;
      else partes.push({ pessoaId: h.id, valor: cada, papel: h.papel });
    }
  }
  return { liquido, partes, bens, dividas: b.obrigacoes };
}
