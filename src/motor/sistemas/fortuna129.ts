/**
 * VIDA 12.9 — A ESCALA DA FORTUNA: os indicadores com uma fonte só, o peso de uma perda conforme quem perde, perdas que
 * acontecem de verdade (da conta, das aplicações, dos bens vendidos às pressas e, quando é o caso, de dívida nova), a
 * venda de bens para cobrir um rombo, a insolvência e a volta por cima.
 *
 * Princípio: ser bilionário muda a natureza dos problemas, não tira as consequências. R$ 10 milhões arrasam quem tem
 * 20, pesam para quem tem 500, mal se notam em 10 bilhões — e R$ 2 bilhões pesam até para o bilionário. Pobreza é a
 * conta que não fecha, o imprevisto que vira dívida, a escolha difícil. Nada aqui cobra uma porcentagem da fortuna por
 * existir: o que custa é o que se faz (e o que acontece).
 */

import type { Colecionavel, Empresa, Imovel, TipoMovimento, Veiculo, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { balanco, condicaoEconomica, COBRIR_ROMBO, obrigacoesAtrasadas, orcamento, pagar, parcelaPrice, rendaPropriaMensal } from './dinheiro';
import { liquidez } from './investimentos';
import { medir } from './extrato';
import { abalar } from './abalo';
import { decidirEmpresa, empresasAtivas, valorDeVendaDaParte } from './empresas';
import { estimativaDeVenda, soltarUnica } from './colecao';
import { valorDeVendaImovel } from './imoveis';
import { valorDeVenda as valorDeVendaVeiculo } from './veiculos';

/* ================================================================ A escala */

export type Escala = 'pobreza' | 'media' | 'alta' | 'milionaria' | 'multimilionaria' | 'bilionaria';
export const NOME_ESCALA: Record<Escala, string> = { pobreza: 'aperto', media: 'classe média', alta: 'vida confortável', milionaria: 'milionária', multimilionaria: 'multimilionária', bilionaria: 'bilionária' };

const custoDe = (v: Vida) => Math.max(0.5, economiaLocal(v.moradia.municipioId).custo);

/** Em que faixa a vida está (o patrimônio líquido e a condição do mês, no custo de vida de onde se mora). */
export function escala(v: Vida): Escala {
  const c = condicaoEconomica(v);
  const k = custoDe(v);
  if (c.faixa === 'bilionaria') return 'bilionaria';
  if (c.faixa === 'milionaria') return c.patrimonio >= 50_000_000 * k ? 'multimilionaria' : 'milionaria';
  if (c.faixa === 'rica' || c.faixa === 'confortavel') return 'alta';
  if (c.faixa === 'sem_dinheiro' || c.faixa === 'apertada') return 'pobreza';
  return 'media';
}

export type PesoDaPerda = 'trocado' | 'sente' | 'pesa' | 'grave' | 'devastadora';

/**
 * O peso de uma perda: a fração do que a pessoa tem (o patrimônio líquido; se ele é negativo, o que dá para mobilizar e um
 * ano de renda). E um piso absoluto: um bilhão é muito dinheiro para qualquer um.
 */
export function pesoDaPerda(v: Vida, valor: number): { nivel: PesoDaPerda; fracao: number } {
  const b = balanco(v);
  const base = Math.max(1, b.liquido > 0 ? b.liquido : liquidez(v).mobilizavel + Math.max(0, rendaPropriaMensal(v)) * 12);
  const fracao = Math.max(0, valor) / base;
  let nivel: PesoDaPerda = fracao < 0.003 ? 'trocado' : fracao < 0.02 ? 'sente' : fracao < 0.1 ? 'pesa' : fracao < 0.35 ? 'grave' : 'devastadora';
  if (valor >= 1e9 * custoDe(v) && (nivel === 'trocado' || nivel === 'sente')) nivel = 'pesa';
  return { nivel, fracao };
}

const FRASE_DO_PESO: Record<PesoDaPerda, string> = { trocado: 'mal se nota no patrimônio', sente: 'dá para sentir, não muda a vida', pesa: 'pesa', grave: 'abre um buraco sério no patrimônio', devastadora: 'leva uma parte enorme do que você tinha' };
export const fraseDoPeso = (p: PesoDaPerda) => FRASE_DO_PESO[p];

/* ================================================================ Indicadores */

export interface IndicadoresFinanceiros {
  conta: number;
  aplicacoes: number;
  liquidezImediata: number;
  liquidez: number;
  imobilizado: { rotulo: string; valor: number }[];
  bruto: number;
  dividas: number;
  liquido: number;
  /** O que entra todo ano (salário, aluguéis, dividendos, lucros distribuídos), por fonte. */
  renda: { rotulo: string; valor: number }[];
  rendaAno: number;
  /** O fluxo de caixa do último ano fechado: o que de fato entrou e saiu da conta (sem contar as transferências para as aplicações). */
  fluxo?: { ano: number; entradas: number; saidas: number; saldo: number };
  escala: Escala;
  /** Rico em bens, curto de caixa. */
  iliquida: boolean;
  /** As empresas: o que se pôs e o que a sua parte vale. */
  exposicao: { investido: number; valor: number; dividaDasEmpresas: number };
  frase: string;
}

export function indicadores(v: Vida): IndicadoresFinanceiros {
  const b = balanco(v);
  const l = liquidez(v);
  const o = orcamento(v);
  const imobilizado = [
    { rotulo: 'Imóveis', valor: b.imoveis }, { rotulo: 'Veículos', valor: b.veiculos }, { rotulo: 'Coleção', valor: b.colecao },
    { rotulo: 'Empresas (a sua parte)', valor: b.empresas }, { rotulo: 'Caixa do negócio', valor: b.negocio }
  ].filter(x => x.valor > 0);
  const renda = o.entradas.filter(x => x.de !== 'familia' && x.valor > 0).map(x => ({ rotulo: x.rotulo, valor: Math.round(x.valor * 12) }));
  for (const e of empresasAtivas(v)) { const d = Math.round((e.ultimo?.distribuido ?? 0) * e.parte); if (d > 0) renda.push({ rotulo: `Lucros de ${e.nome}`, valor: d }); }
  const ex = v.financas.extrato;
  let fluxo: IndicadoresFinanceiros['fluxo'];
  if (ex && ex.linhas.length) {
    const linhas = ex.linhas.filter(x => x.tipo !== 'aporte' && x.tipo !== 'resgate');
    const entradas = Math.round(linhas.reduce((t, x) => t + Math.max(0, x.conta + x.aplicado), 0));
    const saidas = Math.round(linhas.reduce((t, x) => t + Math.min(0, x.conta + x.aplicado), 0));
    fluxo = { ano: anoDe(ex.tFim ?? v.t), entradas, saidas: -saidas, saldo: entradas + saidas };
  }
  const empresas = empresasAtivas(v);
  const exposicao = { investido: Math.round(empresas.reduce((t, e) => t + e.investido, 0)), valor: b.empresas, dividaDasEmpresas: Math.round(empresas.reduce((t, e) => t + (e.corp?.divida ?? 0) * e.parte, 0)) };
  const preso = imobilizado.reduce((t, x) => t + x.valor, 0);
  const iliquida = b.ativos > 0 && preso > b.ativos * 0.7 && l.mobilizavel < Math.max(o.despesa * 12, b.obrigacoes * 0.3);
  const esc = escala(v);
  const frase = esc === 'bilionaria' ? (iliquida ? 'Bilionário no papel, curto de caixa: quase tudo está em empresas e bens. Um compromisso grande pede vender alguma coisa — ou tomar crédito.' : 'A fortuna mudou o tamanho dos problemas: as decisões agora são sobre bilhões — e as perdas também podem ser.')
    : esc === 'multimilionaria' ? 'Dinheiro deixou de limitar a vida; os riscos agora são os dos grandes negócios e das grandes compras.'
      : esc === 'milionaria' ? (iliquida ? 'Milionário em bens, com pouco à mão: a liquidez é o aperto.' : 'Um patrimônio que permite escolhas grandes — e perdas grandes, se a escolha for ruim.')
        : esc === 'alta' ? 'Vida confortável: dá para construir patrimônio — o que se faz com a sobra decide o resto.'
          : esc === 'media' ? 'O mês fecha; um imprevisto grande ainda pede cuidado.'
            : 'O dinheiro é a preocupação: cada conta pede escolha, e um imprevisto vira dívida.';
  return { conta: b.conta, aplicacoes: b.aplicacoes, liquidezImediata: Math.round(l.imediata), liquidez: Math.round(l.mobilizavel), imobilizado, bruto: b.ativos, dividas: b.obrigacoes, liquido: b.liquido, renda, rendaAno: renda.reduce((t, x) => t + x.valor, 0), fluxo, escala: esc, iliquida, exposicao, frase };
}

/* ================================================================ Perder e ganhar de verdade */

export interface ResultadoDaPerda { pago: number; vendido: string[]; divida: number; naoCoberto: number; peso: PesoDaPerda }

/**
 * Uma perda que acontece: sai da conta, depois das aplicações (pelo preço do dia); com `vender`, bens são vendidos às pressas
 * (a participação, a peça de coleção, o imóvel que não é a casa, o carro a mais); com `endividar`, o que faltar vira dívida
 * (o acordo com quem cobra). Sem nenhum dos dois, o que não existe não se perde (o assalto não leva o que não há).
 */
export function aplicarPerda(v: Vida, valor: number, motivo: string, opcoes: { vender?: boolean; endividar?: boolean; tipo?: TipoMovimento; humor?: boolean } = {}): ResultadoDaPerda {
  valor = Math.max(0, Math.round(valor));
  const peso = pesoDaPerda(v, valor).nivel;
  const out = medir(v, motivo, opcoes.tipo ?? 'acontecimento', () => {
    const vendido: string[] = [];
    let tem = liquidez(v).mobilizavel;
    if (opcoes.vender && tem < valor) {
      vendido.push(...venderBens(v, valor - tem, motivo));
      tem = liquidez(v).mobilizavel;
    }
    const pago = Math.min(valor, tem);
    if (pago > 0) pagar(v, pago);
    let falta = valor - pago;
    let divida = 0;
    if (falta > 0 && opcoes.endividar && idade(v) >= 18) {
      const prazo = 60;
      v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'acordo', saldo: falta, jurosMes: 0.015, parcela: Math.round(parcelaPrice(falta, 0.015, prazo)), descricao: `Dívida: ${motivo}`, tInicio: v.t, prazo });
      divida = falta;
      falta = 0;
    }
    return { pago, vendido, divida, naoCoberto: falta, peso };
  });
  if (opcoes.humor !== false) sentirPerda(v, valor, motivo, peso);
  return out;
}

/** O humor sente a perda pelo peso dela (o trocado não abala; a devastadora abala muito). */
export function sentirPerda(v: Vida, valor: number, motivo: string, peso = pesoDaPerda(v, valor).nivel): void {
  const n = { trocado: 0, sente: 1, pesa: 3, grave: 7, devastadora: 12 }[peso];
  if (n) abalar(v, motivo, -n, Math.round(n * 0.8));
}

/** Um ganho que acontece (um prêmio, uma venda, uma herança inesperada): na conta, com o nome. */
export function receberGanho(v: Vida, valor: number, motivo: string): void {
  valor = Math.max(0, Math.round(valor));
  medir(v, motivo, 'acontecimento', () => { v.financas.conta += valor; });
  const { fracao } = pesoDaPerda(v, valor);
  if (fracao >= 0.02) abalar(v, motivo, clamp(fracao * 20, 1, 10), -1);
}

/* ================================================================ Vender bens quando falta */

/**
 * Vende bens até cobrir `falta`, do que dói menos ao que dói mais: as participações de investidor, as peças de coleção sem
 * afeto, os imóveis que não são a casa, o carro a mais, um quarto da empresa que é sua. Venda às pressas paga menos. Nunca
 * vende a casa onde se mora, o objeto de família, a peça com história. Devolve o que vendeu (em palavras).
 */
export function venderBens(v: Vida, falta: number, motivo: string): string[] {
  const f = v.financas;
  const vendidos: string[] = [];
  let resta = falta;
  const entrou = (texto: string, valor: number) => { vendidos.push(texto); resta -= valor; };
  // 1. Participações de investidor.
  for (const e of [...empresasAtivas(v)].filter(x => x.papel === 'investidor').sort((a, b) => valorDeVendaDaParte(b) - valorDeVendaDaParte(a))) {
    if (resta <= 0) break;
    const valor = valorDeVendaDaParte(e);
    if (valor <= 0) continue;
    decidirEmpresa(v, e, 'vender');
    entrou(`a participação em ${e.nome} (${fmt(valor)})`, valor);
  }
  // 2. Peças de coleção sem afeto (as de maior valor primeiro: menos peças, menos perda de história).
  const pecas = (f.colecao ?? []).filter((c: Colecionavel) => !c.afeto && !c.deFamilia && !c.emprestadaA && !c.emprestadaFora && c.valor >= 1000).sort((a, b) => b.valor - a.valor);
  for (const c of pecas) {
    if (resta <= 0) break;
    const valor = estimativaDeVenda(c, 'rapido');
    v.financas.conta += valor;
    f.colecao = (f.colecao ?? []).filter(x => x.id !== c.id);
    soltarUnica(v, c);
    entrou(`${c.nome} (${fmt(valor)})`, valor);
  }
  // 3. Imóveis que não são a casa (às pressas: 5% abaixo da avaliação de venda; o financiamento é quitado na venda).
  for (const b of f.bens.filter((x): x is Imovel => x.tipo === 'imovel' && x.id !== v.moradia.imovelId && !x.bloqueio && x.dono !== 'casal').sort((a, b2) => b2.valor - a.valor)) {
    if (resta <= 0) break;
    const divida = f.dividas.find(d => d.bemId === b.id);
    const liquido = Math.round(valorDeVendaImovel(b) * 0.95 - (divida?.saldo ?? 0));
    if (liquido <= 0) continue;
    v.financas.conta += liquido;
    f.bens = f.bens.filter(x => x.id !== b.id);
    f.dividas = f.dividas.filter(d => d.bemId !== b.id);
    entrou(`${b.nome ?? 'um imóvel'} (${fmt(liquido)})`, liquido);
  }
  // 4. O veículo a mais (nunca o do dia a dia).
  const veiculos = f.bens.filter((x): x is Veiculo => x.tipo === 'veiculo');
  if (veiculos.length > 1) {
    for (const b of veiculos.filter(x => x.id !== (f.veiculoPrincipal ?? veiculos[0].id) && !x.bloqueio && x.dono !== 'casal').sort((a, b2) => b2.valor - a.valor)) {
      if (resta <= 0) break;
      const divida = f.dividas.find(d => d.bemId === b.id);
      const liquido = Math.round(valorDeVendaVeiculo(b, v) * 0.92 - (divida?.saldo ?? 0));
      if (liquido <= 0) continue;
      v.financas.conta += liquido;
      f.bens = f.bens.filter(x => x.id !== b.id);
      f.dividas = f.dividas.filter(d => d.bemId !== b.id);
      entrou(`${b.nome ?? 'um veículo'} (${fmt(liquido)})`, liquido);
    }
  }
  // 5. Um quarto da empresa que é sua (segue no comando).
  for (const e of empresasAtivas(v).filter((x: Empresa) => x.papel !== 'investidor' && x.parte > 0.5 && (x.avaliacao ?? 0) > 0)) {
    if (resta <= 0) break;
    const antes = v.financas.conta;
    decidirEmpresa(v, e, 'vender_parte');
    entrou(`uma parte de ${e.nome} (${fmt(v.financas.conta - antes)})`, v.financas.conta - antes);
  }
  if (vendidos.length) escrever(v, { texto: `Para cobrir ${motivo}, vendeu ${vendidos.length > 1 ? `${vendidos.slice(0, -1).join(', ')} e ${vendidos[vendidos.length - 1]}` : vendidos[0]}.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
  return vendidos;
}

/** O rombo do ano que só o crédito caro cobriria: quem tem bens vende antes (a partir de uns três meses de renda). */
function cobrirRomboComBens(v: Vida, falta: number): void {
  const limiar = Math.max(rendaPropriaMensal(v) * 3, 20_000 * custoDe(v));
  if (falta < limiar) return;
  venderBens(v, falta, 'o rombo do ano');
}
COBRIR_ROMBO.push(cobrirRomboComBens);

/* ================================================================ O ano: marcos, insolvência, a volta */

/* ================================================================ O que só se sabe depois */

/** As apostas de longo prazo: quanto tempo leva para saber e o que pode sair (chance, multiplicador do que se pôs, frase). */
const PENDENTES: Record<string, { anos: number; saidas: [number, number, string][] }> = {
  amigo: { anos: 3, saidas: [[0.4, 2, 'O negócio do amigo deu certo: a sua parte foi vendida por {x}, o dobro do que pôs.'], [0.3, 0.6, 'O negócio do amigo sobreviveu, pequeno: a sua parte saiu por {x}, menos do que pôs.'], [0.3, 0, 'O negócio do amigo fechou. O dinheiro foi junto ({p}).']] },
  fundo: { anos: 2, saidas: [[0.25, 1.3, 'O fundo exclusivo devolveu {x} — e fechou antes que alguém perguntasse demais.'], [0.75, 0, 'O fundo exclusivo era uma pirâmide: o gestor sumiu, a polícia chegou, os {p} não voltaram.']] },
  mega: { anos: 5, saidas: [[0.35, 2.8, 'O megaprojeto deu certo: a sua parte vale {x}.'], [0.35, 0.7, 'O megaprojeto ficou pela metade: a sua parte saiu por {x}.'], [0.3, 0, 'O megaprojeto naufragou: os {p} viraram processo e manchete.']] }
};

/** Guarda o dinheiro posto em algo que só se resolve anos depois. */
export function pendurar(v: Vida, tipo: string, valor: number): void {
  if (valor <= 0) return;
  (v.financas.pendentes129 ??= []).push({ tipo, valor: Math.round(valor), t: v.t });
}
export const temPendente = (v: Vida, tipo: string) => (v.financas.pendentes129 ?? []).some(p => p.tipo === tipo);

function resolverPendentes(v: Vida): void {
  const lista = v.financas.pendentes129;
  if (!lista?.length) return;
  for (const p of [...lista]) {
    const def = PENDENTES[p.tipo];
    if (!def || v.t - p.t < def.anos * 12) continue;
    const r = rngDe(v.id, 'pendente129', p.tipo, p.t);
    let x = r.next();
    const saida = def.saidas.find(([chance]) => (x -= chance) < 0) ?? def.saidas[def.saidas.length - 1];
    const volta = Math.round(p.valor * saida[1]);
    const texto = saida[2].replace('{x}', fmt(volta)).replace('{p}', fmt(p.valor));
    if (volta > 0) receberGanho(v, volta, texto.split(':')[0]);
    else sentirPerda(v, p.valor, texto.split(':')[0]);
    escrever(v, { texto, relevancia: p.valor >= 1e6 || volta === 0 ? 'marco' : 'biografia', tema: 'dinheiro', tom: volta >= p.valor ? 'bom' : 'ruim' });
    v.financas.pendentes129 = (v.financas.pendentes129 ?? []).filter(y => y !== p);
  }
  if (!v.financas.pendentes129?.length) delete v.financas.pendentes129;
}

const PATAMARES: [number, string][] = [[1e9, 'o primeiro bilhão'], [1e8, 'os primeiros cem milhões'], [1e7, 'os primeiros dez milhões'], [1e6, 'o primeiro milhão']];

/**
 * O ano da fortuna (silencioso quase sempre): o patamar novo (o primeiro milhão, o primeiro bilhão), a queda grande (perdeu
 * a maior parte do que tinha), a insolvência (quando a dívida passa do que se tem e as contas atrasam por meses: os bens
 * vão a leilão e a dívida é renegociada) e a volta por cima.
 */
export function processarFortuna129(v: Vida): void {
  if (idade(v) < 18 || v.morte) return;
  resolverPendentes(v);
  const b = balanco(v);
  const k = custoDe(v);
  const pico = v.fatos['pico_patrimonio_129'] ?? 0;
  if (b.liquido > pico) v.fatos['pico_patrimonio_129'] = b.liquido;
  for (const [x, nome] of PATAMARES) {
    const chave = `patamar_${x}`;
    if (b.liquido >= x * k && !temFato(v, chave)) {
      for (const [y] of PATAMARES) if (y <= x && !temFato(v, `patamar_${y}`)) marcarFato(v, `patamar_${y}`);
      escrever(v, { texto: `Chegou a ${nome} de patrimônio${x >= 1e8 ? ': os problemas agora são de outro tamanho' : ''}.`, relevancia: x >= 1e7 ? 'marco' : 'biografia', tema: 'dinheiro', tom: 'bom' });
      break;
    }
  }
  // A queda: perdeu mais de dois terços do que já teve (uma vez a cada dez anos).
  if (pico >= 1e6 * k && b.liquido < pico * 0.33 && v.t - (v.fatos['queda_129'] ?? -999) >= 120) {
    v.fatos['queda_129'] = v.t;
    escrever(v, { texto: `Do que chegou a ter (${fmt(pico)}), sobrou ${b.liquido > 0 ? fmt(b.liquido) : 'nada — sobrou dívida'}. A vida que o dinheiro sustentava teve de mudar.`, relevancia: 'marco', tema: 'dinheiro', tom: 'ruim' });
    abalar(v, 'a fortuna perdida', -10, 10);
  }
  // A insolvência: deve mais do que tem, a dívida cara passa de dois anos de renda e as contas atrasam há seis meses.
  const caras = v.financas.dividas.filter(d => !d.bemId && d.tipo !== 'fies').reduce((t, d) => t + d.saldo, 0);
  const renda = Math.max(1, rendaPropriaMensal(v));
  if (b.liquido < 0 && caras > Math.max(renda * 24, 50_000 * k) && obrigacoesAtrasadas(v) >= 6 && v.t - (v.fatos['insolvencia_129'] ?? -999) >= 120) {
    v.fatos['insolvencia_129'] = v.t;
    venderBens(v, caras, 'as dívidas da insolvência');
    const f = v.financas;
    const pagavel = Math.min(Math.max(0, f.conta), caras);
    const saldo = Math.max(0, caras - pagavel);
    f.conta -= pagavel;
    f.dividas = f.dividas.filter(d => d.bemId || d.tipo === 'fies');
    if (saldo > 0) {
      const novo = Math.round(saldo * 0.6);
      f.dividas.push({ id: `d${v.seq++}`, tipo: 'acordo', saldo: novo, jurosMes: 0.008, parcela: Math.max(100, Math.round(parcelaPrice(novo, 0.008, 72))), descricao: 'Plano de pagamento da insolvência', tInicio: v.t, prazo: 72 });
    }
    f.negativado = true;
    v.fatos['negativado_desde'] ??= v.t;
    escrever(v, { texto: `Insolvência: os bens que dava para vender foram vendidos, e o que sobrou da dívida virou um plano de seis anos, com desconto. O nome ficou sujo; recomeçar, agora, é parcela por parcela.`, relevancia: 'marco', tema: 'dinheiro', tom: 'ruim' });
    abalar(v, 'a insolvência', -10, 12);
  }
  // A volta por cima: depois de uma insolvência ou de uma queda, o patrimônio voltou a ser positivo e as contas estão em dia.
  const caiu = v.fatos['insolvencia_129'] ?? v.fatos['queda_129'];
  if (caiu !== undefined && !temFato(v, 'reergueu_129') && v.t - caiu >= 36 && b.liquido > Math.max(50_000 * k, renda * 12) && obrigacoesAtrasadas(v) === 0) {
    marcarFato(v, 'reergueu_129');
    escrever(v, { texto: 'Anos depois do tombo, as contas estão em dia e há patrimônio de novo. Não é o que já foi — é de pé.', relevancia: 'marco', tema: 'dinheiro', tom: 'bom' });
  }
}

/* ================================================================ As cenas de cada faixa */

/**
 * As cenas de cada faixa de fortuna e das empresas (`conteudo/acontecimentos129economia`, ids `eco129_`): um sorteio derivado
 * próprio (as vidas que não vivem nenhuma seguem iguais), no máximo uma por ano, numa parte dos anos; a decisão só num ano que
 * ainda não abriu outra. O ano passa o catálogo e as peças do motor de conteúdo (este módulo fica embaixo deles).
 */
export function vidaEconomicaDoAno129<C extends { id: string; tipo: string; manual?: boolean; peso?: unknown }, X>(
  v: Vida, catalogo: readonly C[], preparar: (c: C, v: Vida, r: ReturnType<typeof rngDe>) => X | null, abrir: (c: C, ctx: X) => boolean
): void {
  if (v.morte || idade(v) < 18) return;
  const r = rngDe(v.id, 'economia_129', v.t);
  const temEmpresa = empresasAtivas(v).some(e => e.papel !== 'investidor');
  // A empresa que ficou sem caixa pergunta aos donos todo ano (não depende de a tela ser aberta).
  const pedido = empresasAtivas(v).some(e => e.papel !== 'investidor' && !!e.corp?.pedido);
  if (!pedido && !r.chance(temEmpresa ? 0.38 : 0.2)) return;
  // Uma decisão por ano destas; se outra está aberta, esta entra na fila do ano (abre quando aquela fechar).
  const cabeDecisao = !v.ocorrencias.some(o => o.t === v.t && /^eco129_/.test(o.id)) && !(v.fila ?? []).some(x => x.id.startsWith('eco129_'));
  const lista: { c: C; ctx: X }[] = [];
  for (const c of catalogo) {
    if (!c.manual || !c.id.startsWith('eco129_') || (c.tipo === 'decisao' && !cabeDecisao) || (pedido && c.id !== 'eco129_emp_pedido')) continue;
    const ctx = preparar(c, v, r);
    if (ctx) lista.push({ c, ctx });
  }
  const x = r.weighted(lista, y => (typeof y.c.peso === 'number' ? y.c.peso : 1));
  if (!x) return;
  if (x.c.tipo === 'decisao' && v.momento) (v.fila ??= []).push({ id: x.c.id, t: v.t, papeis: {}, prioridade: pedido ? 5 : 1, ...(pedido ? { urgente: true } : {}) });
  else abrir(x.c, x.ctx);
}
