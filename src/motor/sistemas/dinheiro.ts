/**
 * Dinheiro com origem e destino.
 *
 * DINHEIRO PESSOAL ≠ DINHEIRO DA CASA. `financas.conta` é o dinheiro da
 * PESSOA. Enquanto ela mora com a família de origem, a casa é sustentada
 * pelos adultos de lá: a criança não paga o mercado e também não tem acesso
 * ao que os pais ganham — tem a mesada (quando há) e, na adolescência, o que
 * ganhar trabalhando. O orçamento desse tempo é o dela; o da casa aparece
 * como contexto ("a casa vive da renda da sua mãe").
 *
 * Quando sai de casa, o orçamento passa a ser do domicílio que ela sustenta:
 *   - sozinha ou dividindo (república): paga a sua parte;
 *   - morando junto sem casar: as contas da casa se dividem na proporção das
 *     rendas; o resto do dinheiro de cada um é de cada um;
 *   - casados: a renda é comum e as despesas também (comunhão parcial, sem
 *     cartório: o que se constrói junto é do casal — ver `partilha`).
 *
 * O PADRÃO DE VIDA é uma propensão, não um preço fixo: quem ganha mais gasta
 * mais, mesmo no "modesto". O estilo diz quanto da renda que sobra depois do
 * essencial vira lazer, restaurante, viagem, coisa nova.
 *
 * Valores em reais de hoje (ver `economia`).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Divida, EstiloDeVida, LinhaRazao, Pessoa, Rotina, Vida } from '../tipos';
import { escrever, filhos, idade, idadePessoa, lembrarCom, marcarFato, moraCom, parceiro, temFato, vinculosVivos } from '../nucleo';
import { economiaLocal } from '../dados/lugares';
import { modeloMoradia } from '../dados/bens';
import { curso } from '../dados/cursos';
import { liquido, mesesPagos, SALARIO_MINIMO } from './renda';
import { custosDoTrabalho } from './carreira';
import { moraComFamiliaDeOrigem, rendaDosOutros } from './domicilio';
import { dinheiro as fmt, flex } from '../texto';
import { abalar } from './abalo';
import { cobrirComAplicacoes, liquidezImediata, processarInvestimentos, rendaDasAplicacoes, resgatar, totalAplicado } from './investimentos';
import { produto } from '../dados/investimentos';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { custoDosPets } from './pets';
import { custosDeVeiculo } from './veiculos';
import { deslocamento } from './transporte';
import type { AnoEconomico } from './economia';

const ESTILO: Record<EstiloDeVida, { basico: number; lazerBase: number; parte: number }> = {
  apertado: { basico: 0.8, lazerBase: 60, parte: 0.35 },
  modesto: { basico: 1, lazerBase: 200, parte: 0.55 },
  confortavel: { basico: 1.3, lazerBase: 450, parte: 0.75 },
  folgado: { basico: 1.7, lazerBase: 900, parte: 0.95 }
};
const MERCADO_POR_ADULTO = 780;
const CONTAS_DA_CASA = 340;

const CONTRIBUICAO_EM_CASA: Record<string, number> = { vulneravel: 0.4, trabalhadora: 0.3, media_baixa: 0.2, media: 0.1, alta: 0 };
const MESADA: Record<string, number> = { vulneravel: 0, trabalhadora: 30, media_baixa: 70, media: 180, alta: 450 };
/** Quanto da mensalidade da faculdade os pais conseguem bancar enquanto o filho mora com eles. */
const PAIS_PAGAM_ESTUDO: Record<string, number> = { vulneravel: 0, trabalhadora: 0, media_baixa: 400, media: 1600, alta: 12000 };

export function planoDeSaudeMensal(i: number): number {
  return i < 19 ? 230 : i < 34 ? 420 : i < 49 ? 640 : i < 59 ? 1050 : 1600;
}

/* ================================================================ Orçamento */

/** Como a casa se sustenta — quem paga o quê. */
export type ArranjoDaCasa = 'familia' | 'sozinho' | 'dividindo' | 'juntos' | 'casados';

export interface Orcamento {
  arranjo: ArranjoDaCasa;
  /** Entradas mensais (positivas), com a origem de cada uma. */
  entradas: LinhaRazao[];
  /** Saídas mensais (negativas). */
  saidas: LinhaRazao[];
  renda: number;
  despesa: number;
  sobra: number;
  /** Na casa da família: quanto a casa tem por mês (dos outros, não seu) e quem sustenta. */
  daCasa?: { renda: number; porPessoa: number; quem: Pessoa[] };
}

export function arranjoDaCasa(v: Vida): ArranjoDaCasa {
  if (moraComFamiliaDeOrigem(v)) return 'familia';
  const par = parceiro(v);
  if (par && v.vinculos[par.p.id].convivio.includes('casa')) return par.vin.romance?.estagio === 'casamento' ? 'casados' : 'juntos';
  if (v.moradia.tipo === 'republica' || (v.moradia.divide ?? 0) > 0) return 'dividindo';
  return 'sozinho';
}

/** Renda mensal do trabalho, da aposentadoria e de bolsas: a que é SUA. */
function entradasProprias(v: Vida): LinhaRazao[] {
  const out: LinhaRazao[] = [];
  const e = v.trabalho.atual;
  if (e) {
    const liq = liquido(e.salario, e.contrato);
    const meses = mesesPagos(e.contrato);
    out.push({ rotulo: e.contrato === 'clt' || e.contrato === 'servidor' ? 'Salário (com 13º e férias)' : e.contrato === 'estagio' ? 'Bolsa de estágio' : v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado' && e.ocupacaoId === v.caminhos.negocio.ocupacaoId ? `Retirada do negócio` : 'Renda do trabalho', valor: Math.round(liq * meses / 12), grupo: 'renda', de: 'eu' });
    if (v.anoAtual.acoes.includes('horas_extras')) out.push({ rotulo: 'Horas extras', valor: Math.round(liq * 0.15), grupo: 'renda', de: 'eu' });
  }
  if (v.trabalho.aposentadoria) out.push({ rotulo: temFato(v, 'bpc') ? 'Benefício assistencial (BPC)' : 'Aposentadoria', valor: Math.round(v.trabalho.aposentadoria.beneficio * 13 / 12), grupo: 'renda', de: 'governo' });
  const m = v.educacao.matricula;
  if (m && !m.trancado) {
    const bolsa = curso(m.cursoId).bolsa;
    if (bolsa) out.push({ rotulo: 'Bolsa de estudos', valor: bolsa, grupo: 'renda', de: 'governo' });
  }
  for (const b of v.financas.bens) if (b.tipo === 'imovel' && b.alugadoPor) out.push({ rotulo: `Aluguel recebido (${b.nome})`, valor: b.alugadoPor, grupo: 'renda', de: 'patrimonio' });
  const dasAplicacoes = rendaDasAplicacoes(v);
  if (dasAplicacoes > 0) out.push({ rotulo: 'Dividendos e aluguéis de fundos', valor: dasAplicacoes, grupo: 'renda', de: 'patrimonio' });
  return out;
}

/** Renda própria mensal (trabalho, aposentadoria, bolsa, patrimônio): o que é seu, sem parceria nem mesada. */
export const rendaPropriaMensal = (v: Vida) => entradasProprias(v).reduce((s, l) => s + l.valor, 0);

/** Pensão que o outro genitor paga pelos filhos que moram com você. */
function pensaoRecebida(v: Vida): LinhaRazao[] {
  const out: LinhaRazao[] = [];
  const porGenitor = new Map<string, number>();
  for (const fl of filhos(v)) {
    if (idadePessoa(v, fl) >= 18 || !v.vinculos[fl.id].convivio.includes('casa')) continue;
    const outro = fl.genitores?.find(g => g !== 'eu');
    const p = outro ? v.pessoas[outro] : undefined;
    if (!p || !p.vivo || v.vinculos[p.id]?.convivio.includes('casa') || p.renda <= 0) continue;
    porGenitor.set(p.id, (porGenitor.get(p.id) ?? 0) + 1);
  }
  for (const [id, n] of porGenitor) {
    const p = v.pessoas[id];
    out.push({ rotulo: `Pensão que ${p.nome} paga pelos filhos`, valor: Math.round(Math.max(SALARIO_MINIMO * 0.3 * n, p.renda * Math.min(0.3, 0.15 * n)) / 10) * 10, grupo: 'renda', de: 'familia' });
  }
  return out;
}

export function orcamento(v: Vida, estiloForcado?: EstiloDeVida): Orcamento {
  const f = v.financas;
  const i = idade(v);
  const arranjo = arranjoDaCasa(v);
  const local = economiaLocal(v.moradia.municipioId);
  const c = local.custo;
  const estilo = ESTILO[estiloForcado ?? f.estilo];
  const entradas: LinhaRazao[] = [...entradasProprias(v)];
  const saidas: LinhaRazao[] = [];
  const sai = (rotulo: string, valor: number, grupo: LinhaRazao['grupo']) => { if (valor >= 1) saidas.push({ rotulo, valor: -Math.round(valor), grupo }); };
  const naFamilia = arranjo === 'familia';
  const propria = entradas.reduce((s, l) => s + l.valor, 0);

  /* ------------------------------------------------------------- Na prisão */
  // A casa segue com quem ficou; da pessoa, sai o que a família leva nas visitas e o que ela devia.
  if (v.justica?.prisao && !v.trabalho.atual) {
    sai('O que a família leva nas visitas', 180 * c, 'outros');
    for (const d of f.dividas) if (d.parcela > 0 && d.saldo > 0) sai(d.descricao, Math.min(d.parcela, d.saldo), 'dividas');
    return fechar(v, arranjo, entradas, saidas);
  }

  /* ---------------------------------------------- Na casa da família de origem */
  if (naFamilia) {
    const mesada = i >= 8 && i < 18 ? Math.round(MESADA[v.origem.classe] * Math.min(1, (i - 6) / 10)) : 0;
    if (mesada > 0) entradas.push({ rotulo: 'Mesada', valor: mesada, grupo: 'renda', de: 'familia' });
    const quem = moraCom(v).filter(p => idadePessoa(v, p) >= 16 && p.renda > 0);
    const rendaCasa = rendaDosOutros(v);
    const daCasa = { renda: Math.round(rendaCasa), porPessoa: Math.round(rendaCasa / (moraCom(v).length + 1)), quem };
    if (i < 18) {
      // A criança e o adolescente gastam quase tudo o que têm: lanche, saída, figurinha.
      if (mesada > 0) sai('Lanches, saídas e miudezas', mesada * 0.85, 'lazer');
      if (propria > 0) sai('O que você gasta com o que ganha', propria * 0.6, 'lazer');
      return fechar(v, arranjo, entradas, saidas, daCasa);
    }
    // Adulto na casa dos pais: ajuda nas contas quando tem renda; o resto é dele.
    if (propria > 0) sai('Ajuda nas contas de casa', propria * CONTRIBUICAO_EM_CASA[v.origem.classe], 'moradia');
    comuns(v, sai, c, true);
    const livre = propria - somaSaidas(saidas);
    if (propria > 0) sai('Gastos pessoais e lazer', estilo.lazerBase * c * 0.6 + Math.max(0, livre - estilo.lazerBase * c * 0.6) * estilo.parte, 'lazer');
    return fechar(v, arranjo, entradas, saidas, daCasa);
  }

  /* ----------------------------------------------------- Casa própria da pessoa */
  const mor = v.moradia;
  const modelo = mor.modeloId ? modeloMoradia(mor.modeloId) : undefined;
  const parte = mor.tipo === 'republica' ? 1 : 1 / (1 + (mor.divide ?? 0));
  if (mor.tipo === 'aluguel' || mor.tipo === 'republica') sai(parte < 1 ? 'Sua parte do aluguel' : 'Aluguel', mor.aluguel * parte, 'moradia');
  if (modelo?.condominio && mor.tipo !== 'republica') sai('Condomínio', modelo.condominio * c * parte, 'moradia');
  if (mor.tipo === 'propria') {
    const im = f.bens.find(b => b.id === mor.imovelId);
    if (im) sai('IPTU e manutenção da casa', im.valor * 0.006 / 12, 'moradia');
  }
  const junto = moraCom(v);
  const adultos = 1 + junto.filter(p => idadePessoa(v, p) >= 18).length;
  const criancas = junto.filter(p => idadePessoa(v, p) < 18).length;
  const contas = CONTAS_DA_CASA * Math.sqrt(estilo.basico) * (mor.tipo === 'republica' ? 0.4 : parte);
  sai('Mercado, luz, água e internet', (MERCADO_POR_ADULTO * estilo.basico * (adultos + criancas * 0.6) + contas) * c, 'casa');

  // Filhos: a criação aparece como parte da casa, não como preço de alguém.
  let criacao = 0;
  let escola = 0;
  for (const fl of filhos(v)) {
    const idF = idadePessoa(v, fl);
    if (idF >= 18 || !v.vinculos[fl.id].convivio.includes('casa')) continue;
    criacao += (idF < 3 ? 700 : idF < 6 ? 480 : idF < 15 ? 430 : 560) * c;
    if (idF >= 2 && temFato(v, 'filhos_escola_privada')) escola += 1300 * c;
  }
  sai('Criação dos filhos: roupa, material, remédio, o que crescer pede', criacao, 'filhos');
  sai('Escola particular', escola, 'filhos');
  sai('Animais: ração, vacina, areia', custoDosPets(v, c), 'animais');

  // Morando junto sem casar: as contas da casa se dividem pela renda.
  const par = parceiro(v);
  if (par && arranjo === 'juntos') {
    const compartilhadas = saidas.filter(l => ['moradia', 'casa', 'filhos', 'animais'].includes(l.grupo)).reduce((s, l) => s - l.valor, 0);
    const rp = Math.max(0, par.p.renda);
    const re = Math.max(1, propria);
    const parteDele = Math.min(rp * 0.75, compartilhadas * rp / (rp + re));
    if (parteDele >= 1) entradas.push({ rotulo: `Parte de ${par.p.nome} nas contas da casa`, valor: Math.round(parteDele), grupo: 'renda', de: 'parceria' });
  } else if (par && arranjo === 'casados' && par.p.renda > 0) {
    entradas.push({ rotulo: `Renda de ${par.p.nome}`, valor: Math.round(par.p.renda), grupo: 'renda', de: 'parceria' });
  }
  entradas.push(...pensaoRecebida(v));

  // Pensão dos filhos que não moram junto.
  let pensao = 0;
  for (const fl of filhos(v)) {
    if (idadePessoa(v, fl) >= 18 || v.vinculos[fl.id].convivio.includes('casa') || v.vinculos[fl.id].parentesco !== 'filho') continue;
    pensao += Math.max(SALARIO_MINIMO * 0.3, propria * 0.15);
  }
  sai('Pensão dos filhos que moram com o outro lado', Math.min(pensao, propria * 0.45), 'filhos');

  comuns(v, sai, c, false);
  // Plano de saúde de quem é casado inclui a parceria.
  if (f.planoDeSaude && par && arranjo === 'casados') sai(`Plano de saúde de ${par.p.nome}`, planoDeSaudeMensal(idadePessoa(v, par.p)) * c, 'saude');

  // Lazer e extras: o que o estilo faz com a renda que sobra depois do essencial.
  const rendaTotal = entradas.reduce((s, l) => s + l.valor, 0);
  const adultosQueGastam = arranjo === 'casados' ? adultos : 1;
  const base = estilo.lazerBase * c * adultosQueGastam;
  const livre = rendaTotal - somaSaidas(saidas);
  sai('Lazer, restaurante, roupa e extras', base + Math.max(0, livre - base) * estilo.parte, 'lazer');
  return fechar(v, arranjo, entradas, saidas);
}

/** Despesas que existem em qualquer arranjo: transporte, saúde, estudo, rotinas, compromissos, dívidas. */
function comuns(v: Vida, sai: (r: string, x: number, g: LinhaRazao['grupo']) => void, c: number, naFamilia: boolean): void {
  const f = v.financas;
  const i = idade(v);
  // O veículo do trajeto roda todo dia; o outro (ou o de quem não tem trajeto) roda menos — gasta menos combustível.
  const d = deslocamento(v);
  for (const vei of f.bens) {
    if (vei.tipo !== 'veiculo') continue;
    const uso = d?.veiculoId === vei.id ? 1 : d ? 0.45 : 0.7;
    for (const l of custosDeVeiculo(v, vei, c, uso)) sai(l.rotulo, l.valor, 'transporte');
  }
  // A passagem só existe para quem vai de transporte público (o veículo próprio já custa acima; a pé e de bicicleta, nada).
  if (d && d.modo === 'publico' && d.passagem > 0 && i >= 16) sai('Passagem de ônibus (o trajeto de todo dia)', d.passagem, 'transporte');
  if (f.planoDeSaude && (!naFamilia || i >= 24)) {
    sai('Plano de saúde', planoDeSaudeMensal(i) * c, 'saude');
    const pequenos = filhos(v).filter(fl => idadePessoa(v, fl) < 18 && v.vinculos[fl.id].convivio.includes('casa')).length;
    if (pequenos && !naFamilia) sai('Plano de saúde dos filhos', 250 * pequenos * c, 'saude');
  }
  const tratamentos = v.corpo.condicoes.filter(x => x.tratando && x.cronica).length;
  if (tratamentos) sai('Remédios e consultas', 180 * tratamentos, 'saude');
  const m = v.educacao.matricula;
  if (m && !m.trancado && m.mensalidade > 0 && m.financiamento !== 'fies') {
    const pagoPelosPais = naFamilia ? Math.min(m.mensalidade, PAIS_PAGAM_ESTUDO[v.origem.classe]) : 0;
    sai('Mensalidade da faculdade', m.mensalidade - pagoPelosPais, 'educacao');
  }
  if (v.educacao.cursinho) sai('Cursinho', (naFamilia && ['media', 'alta'].includes(v.origem.classe) ? 0 : 450) * c, 'educacao');
  for (const rot of v.rotinas) {
    const custo = CUSTO_ROTINA.de(v, rot);
    if (custo && !(naFamilia && i < 18)) sai(CUSTO_ROTINA.rotulo(rot), custo * c, 'lazer');
  }
  for (const [chave] of Object.entries(v.fatos)) {
    const x = chave.match(/^(ajuda_mensal|paga_cuidadora|casa_repouso)_(.+)$/);
    if (!x) continue;
    const p = v.pessoas[x[2]];
    if (!p || !p.vivo) continue;
    const valor = x[1] === 'ajuda_mensal' ? 600 : x[1] === 'paga_cuidadora' ? 2800 : 1900;
    sai(x[1] === 'ajuda_mensal' ? `Ajuda para ${p.nome}` : x[1] === 'paga_cuidadora' ? `Cuidadora de ${p.nome}` : `Casa de repouso de ${p.nome}`, valor * c, 'outros');
  }
  for (const [chave, valor] of Object.entries(v.fatos)) {
    const x = chave.match(/^paga_faculdade_(.+)$/);
    const p = x && v.pessoas[x[1]];
    if (p && p.vivo && p.estudo?.paga === 'familia') sai(`Faculdade de ${p.nome}`, valor, 'filhos');
  }
  for (const l of custosDoTrabalho(v)) sai(l.rotulo, l.valor, 'outros');
  if (v.fatos['aposta_online'] !== undefined && i >= 18) sai('Apostas', Math.max(300, Math.min(2500, rendaPropriaMensal(v) * 0.15)), 'lazer');
  if (naFamilia && i >= 18) sai('Animais: ração, vacina, areia', custoDosPets(v, c, 'eu'), 'animais');
  for (const d of f.dividas) if (d.parcela > 0 && d.saldo > 0) sai(d.descricao, Math.min(d.parcela, d.saldo), 'dividas');
}

const somaSaidas = (s: LinhaRazao[]) => 0 - s.reduce((x, l) => x + l.valor, 0) + 0;

function fechar(v: Vida, arranjo: ArranjoDaCasa, entradas: LinhaRazao[], saidas: LinhaRazao[], daCasa?: Orcamento['daCasa']): Orcamento {
  const renda = entradas.reduce((s, l) => s + l.valor, 0);
  const despesa = somaSaidas(saidas);
  void v;
  return { arranjo, entradas, saidas, renda, despesa, sobra: renda - despesa, daCasa };
}

/** Compatibilidade: renda, despesa e linhas mensais do orçamento. */
export function saldoMensal(v: Vida): { renda: number; despesa: number; linhas: LinhaRazao[] } {
  const o = orcamento(v);
  return { renda: o.renda, despesa: o.despesa, linhas: [...o.entradas, ...o.saidas] };
}

export const rendasMensais = (v: Vida) => orcamento(v).entradas;
export const despesasMensais = (v: Vida, estilo?: EstiloDeVida) => orcamento(v, estilo).saidas;

/** Custo mensal de uma rotina (preenchido pelo módulo de rotinas, que conhece os níveis). */
export const CUSTO_ROTINA: { de: (v: Vida, r: Rotina) => number; rotulo: (r: Rotina) => string } = { de: () => 0, rotulo: r => r.id };

/* ================================================================ Balanço */

export interface Balanco {
  conta: number;
  aplicacoes: number;
  imoveis: number;
  veiculos: number;
  /** O que está no caixa do próprio negócio (não é conta sua, mas é seu). */
  negocio: number;
  ativos: number;
  /** Financiamentos: obrigações presas a um bem. */
  financiamentos: number;
  /** Empréstimos, acordos, FIES: parcelas fixas. */
  emprestimos: number;
  /** Cartão rotativo e cheque especial: a dívida cara. */
  cartao: number;
  /** Parcelas e aluguéis que ficaram sem pagar. */
  atrasado: number;
  obrigacoes: number;
  liquido: number;
}

export function balanco(v: Vida): Balanco {
  const f = v.financas;
  const conta = Math.round(f.conta);
  const aplicacoes = Math.round(totalAplicado(v));
  const imoveis = f.bens.filter(b => b.tipo === 'imovel').reduce((s, b) => s + b.valor, 0);
  const veiculos = f.bens.filter(b => b.tipo === 'veiculo').reduce((s, b) => s + b.valor, 0);
  const financiamentos = f.dividas.filter(d => d.tipo === 'financiamento_imovel' || d.tipo === 'financiamento_veiculo').reduce((s, d) => s + d.saldo, 0);
  const emprestimos = f.dividas.filter(d => d.tipo === 'emprestimo' || d.tipo === 'acordo' || d.tipo === 'fies').reduce((s, d) => s + d.saldo, 0);
  const cartao = f.dividas.filter(d => d.tipo === 'cartao').reduce((s, d) => s + d.saldo, 0);
  const atrasado = f.dividas.reduce((s, d) => s + (d.atraso ?? 0) * d.parcela, 0) + (v.moradia.atraso ?? 0) * v.moradia.aluguel;
  const n = v.caminhos?.negocio;
  const negocio = n && n.estado !== 'fechado' ? Math.max(0, Math.round(n.caixa ?? 0)) : 0;
  const ativos = Math.max(0, conta) + aplicacoes + imoveis + veiculos + negocio;
  const obrigacoes = Math.round(financiamentos + emprestimos + cartao + (v.moradia.atraso ?? 0) * v.moradia.aluguel + Math.max(0, -conta));
  return { conta, aplicacoes, imoveis, veiculos, negocio, ativos, financiamentos, emprestimos, cartao, atrasado: Math.round(atrasado), obrigacoes, liquido: Math.round(ativos - obrigacoes) };
}

export const patrimonio = (v: Vida) => balanco(v).liquido;

/* ============================================================== Segurança */

export type NivelSeguranca = 'dependente' | 'no_vermelho' | 'apertado' | 'no_limite' | 'equilibrado' | 'seguro' | 'folgado';

export interface Seguranca {
  nivel: NivelSeguranca;
  /** Meses de despesa que o dinheiro disponível (conta + reserva + renda fixa) seguraria sem renda. */
  meses: number;
  /** Uma frase sobre a situação. */
  texto: string;
}

export function obrigacoesAtrasadas(v: Vida): number {
  return Math.max(v.moradia.atraso ?? 0, ...v.financas.dividas.map(d => d.atraso ?? 0), 0);
}

export function seguranca(v: Vida): Seguranca {
  const o = orcamento(v);
  const i = idade(v);
  const disponivel = liquidezImediata(v);
  const despesa = Math.max(1, o.despesa);
  const meses = Math.round(disponivel / despesa * 10) / 10;
  if (o.arranjo === 'familia' && i < 18) return { nivel: 'dependente', meses, texto: 'Quem sustenta a casa são os adultos da família.' };
  const b = balanco(v);
  const atraso = obrigacoesAtrasadas(v);
  const renda = Math.max(1, o.renda);
  const financeiro = Math.max(0, b.conta) + b.aplicacoes;
  if (atraso > 0 || v.financas.negativado || b.cartao > renda * 3) {
    return { nivel: 'no_vermelho', meses, texto: atraso > 0 ? `${atraso >= 2 ? `${Math.round(atraso)} meses` : 'Um mês'} de contas atrasadas.` : v.financas.negativado ? 'O nome está sujo: sem crédito até acertar.' : 'A dívida do cartão já é maior que três meses de renda.' };
  }
  if (financeiro >= despesa * 12 * 15) return { nivel: 'folgado', meses, texto: 'O que você juntou paga muitos anos de vida. Dinheiro deixou de ser a preocupação.' };
  if (meses >= 12 || financeiro >= despesa * 12 * 4) return { nivel: 'seguro', meses, texto: `Se a renda parasse hoje, o guardado seguraria ${meses >= 24 ? `uns ${Math.floor(meses / 12)} anos` : `${Math.floor(meses)} meses`}.` };
  if (o.sobra < 0 && meses < 3) return { nivel: 'apertado', meses, texto: 'O mês não fecha: falta todo mês, e quase nada guardado para cobrir.' };
  if (meses < 1) return { nivel: 'no_limite', meses, texto: o.sobra > 0 ? 'Fecha o mês, mas qualquer imprevisto vira dívida.' : 'O mês está no limite e não há reserva.' };
  if (meses < 3) return { nivel: 'no_limite', meses, texto: `A reserva seguraria ${Math.round(meses * 4) >= 8 ? `uns ${Math.round(meses)} meses` : 'pouco mais de um mês'} sem renda.` };
  return { nivel: 'equilibrado', meses, texto: `Uma reserva de uns ${Math.floor(meses)} meses. Dá para atravessar um imprevisto.` };
}

/* ================================================================ Crédito */

/** Limite de crédito rotativo (cartão, cheque especial): pela renda PRÓPRIA. */
export function limiteDeCredito(v: Vida): number {
  if (v.financas.negativado || idade(v) < 18) return 0;
  const renda = rendaPropriaMensal(v);
  return Math.max(renda > 0 ? 1000 : 500, Math.round(renda * 2.5));
}

/** Quanto das parcelas cabe na renda própria + da casa (bancos olham o comprometimento). */
export function comprometimento(v: Vida, parcelaNova = 0): number {
  const renda = Math.max(1, rendaPropriaMensal(v) + (arranjoDaCasa(v) === 'casados' ? parceiro(v)?.p.renda ?? 0 : 0));
  const parcelas = v.financas.dividas.reduce((s, d) => s + (d.parcela > 0 ? d.parcela : 0), 0);
  return (parcelas + parcelaNova) / renda;
}

export function parcelaPrice(valor: number, juros: number, meses: number): number {
  if (juros === 0) return valor / meses;
  return (valor * juros) / (1 - Math.pow(1 + juros, -meses));
}

/** Meses que faltam numa dívida parcelada (pelo prazo contratado). */
export function mesesRestantes(v: Vida, d: Divida): number {
  if (!d.prazo || d.tInicio === undefined) {
    if (d.parcela <= 0) return 0;
    const j = d.jurosMes;
    const x = 1 - d.saldo * j / d.parcela;
    return x <= 0 ? 360 : Math.ceil(-Math.log(x) / Math.log(1 + j));
  }
  return Math.max(1, d.prazo - (v.t - d.tInicio));
}

/* ======================================================= O ano financeiro */

export function processarDinheiro(v: Vida, r: Rng, ec?: AnoEconomico): void {
  const f = v.financas;
  const i = idade(v);
  const o = orcamento(v);
  // Os dividendos do ano entram direto na conta pelos investimentos: aqui não contam duas vezes.
  const renda = o.renda - rendaDasAplicacoes(v);
  let despesa = o.despesa;
  const linhas = [...o.entradas.filter(l => l.rotulo !== 'Dividendos e aluguéis de fundos'), ...o.saidas];

  // Ninguém gasta o que não tem: quando o ano não fecha e o guardado não
  // segura, o supérfluo é cortado antes de virar dívida.
  const guardado = Math.max(0, f.conta) + totalAplicado(v);
  if ((despesa - renda) * 12 > guardado && f.estilo !== 'apertado' && o.arranjo !== 'familia') {
    const minimo = orcamento(v, 'apertado').despesa;
    const corte = Math.min(Math.max(0, despesa - minimo), despesa - renda);
    if (corte > 0) {
      despesa -= corte;
      linhas.push({ rotulo: 'Cortes no mercado, no lazer e nos extras', valor: Math.round(corte), grupo: 'lazer' });
      abalar(v, 'os cortes para o dinheiro fechar', -Math.min(8, Math.round(corte / 250)), 0);
      narrarAperto(v);
    }
  }
  f.razao = linhas.map(l => ({ ...l, valor: l.valor * 12 }));
  // O prejuízo do negócio que saiu da conta (já descontado em `processarNegocio`): aparece na conta do ano.
  const neg = v.caminhos.negocio;
  if (neg?.devolvidoAno && neg.estado !== 'fechado') f.razao.push({ rotulo: `Prejuízo de ${neg.nome} coberto do seu bolso`, valor: -neg.devolvidoAno, grupo: 'outros' });
  if (o.sobra < 0) { if (v.fatos['sem_sobra_desde'] === undefined) v.fatos['sem_sobra_desde'] = v.t; } else delete v.fatos['sem_sobra_desde'];

  // Dívidas parceladas: o ano de parcelas pagas amortiza (a parcela já está na despesa).
  for (const d of f.dividas) {
    if (d.parcela > 0) {
      const devido = d.saldo * Math.pow(1 + d.jurosMes, 12);
      const pago = Math.min(devido, d.parcela * 12);
      d.saldo = Math.max(0, Math.round(devido - pago));
    } else {
      // Rotativo: em cobrança (nome sujo), vira juro de mora; caduca em cinco anos.
      const juros = f.negativado ? 0.01 : d.jurosMes;
      d.saldo = Math.round(d.saldo * Math.pow(1 + juros, 12));
    }
  }
  if (f.negativado && v.fatos['negativado_desde'] !== undefined && v.t - v.fatos['negativado_desde'] >= 60) {
    f.negativado = false;
    f.dividas = f.dividas.filter(d => d.tipo !== 'cartao');
    delete v.fatos['negativado_desde'];
    const vezes = (v.fatos['caducou'] ?? 0) + 1;
    v.fatos['caducou'] = vezes;
    escrever(v, { texto: vezes === 1 ? 'Cinco anos depois, a dívida velha caducou e o nome saiu do cadastro de devedores.' : 'Mais uma dívida velha caducou.', relevancia: vezes === 1 ? 'cotidiano' : 'tecnico', tema: 'dinheiro' });
  }

  // As aplicações rendem (ou perdem) e pagam o que pagam.
  if (ec) f.razao.push(...processarInvestimentos(v, ec).map(l => ({ ...l })));
  // A inflação do ano corrói o que ficou parado na conta.
  const inflacao = ec?.inflacao ?? 0.045;
  if (f.conta > 0) {
    const perda = Math.round(f.conta - f.conta / (1 + inflacao));
    f.conta -= perda;
    if (perda >= 50) f.razao.push({ rotulo: 'O que a inflação levou do dinheiro parado', valor: -perda, grupo: 'outros' });
  }
  // Efeito riqueza: quem juntou muito passa a gastar parte do que juntou
  // (viagens, reformas, ajuda à família, carro melhor).
  const financeiro = Math.max(0, f.conta) + totalAplicado(v);
  const limiar = Math.max(300000, despesa * 12 * 8);
  if (financeiro > limiar && i >= 30) {
    const taxa = { apertado: 0.015, modesto: 0.02, confortavel: 0.03, folgado: 0.05 }[f.estilo];
    // O que o patrimônio permite gastar sai do que está livre na conta — não obriga a vender aplicação.
    const gasto = Math.min(Math.round((financeiro - limiar) * taxa), Math.max(0, Math.round(f.conta + (renda - despesa) * 12)));
    if (gasto > 0) f.razao.push({ rotulo: 'Viagens, reformas e presentes que o patrimônio permitiu', valor: -gasto, grupo: 'lazer' });
    f.conta -= gasto;
  }

  f.conta += (renda - despesa) * 12;

  // Com o que sobrou: primeiro o que está atrasado, depois a dívida cara.
  pagarAtrasos(v);
  let pagoNoCartao = 0;
  // O cartão rotativo é o mais caro de todos: qualquer sobra vai para ele primeiro.
  for (const d of f.dividas.filter(x => x.tipo === 'cartao' && x.saldo > 0)) {
    if (f.conta <= 0) break;
    const pago = Math.min(d.saldo, f.conta);
    d.saldo -= pago;
    f.conta -= pago;
    pagoNoCartao += pago;
  }
  const colchao = despesa;
  for (const d of [...f.dividas].sort((a, b) => b.jurosMes - a.jurosMes)) {
    if (f.conta <= colchao || d.saldo <= 0 || d.tipo === 'cartao') continue;
    if (d.tipo === 'financiamento_imovel' || d.tipo === 'financiamento_veiculo' || d.tipo === 'fies') continue; // amortizar é decisão do jogador
    const pago = Math.min(d.saldo, f.conta - colchao);
    d.saldo -= pago;
    f.conta -= pago;
  }
  const cartaoAberto = f.dividas.find(d => d.tipo === 'cartao' && d.saldo > 0);
  if (cartaoAberto && pagoNoCartao === 0 && !f.negativado && i >= 18) negativar(v, 'A fatura do cartão ficou sem pagar e o nome foi parar no cadastro de devedores.');
  if (f.negativado && !f.dividas.some(d => d.saldo > 0 && (d.tipo === 'cartao' || d.tipo === 'emprestimo')) && obrigacoesAtrasadas(v) === 0) {
    f.negativado = false;
    delete v.fatos['negativado_desde'];
    escrever(v, { texto: 'Com as dívidas pagas, o nome ficou limpo de novo.', relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom' });
  }
  for (const d of f.dividas.filter(x => x.saldo <= 0)) quitada(v, d);
  f.dividas = f.dividas.filter(d => d.saldo > 0);

  // Faltou dinheiro: aplicações, família, crédito caro e, por fim, atraso.
  if (f.conta < 0) cobrirRombo(v, r);
}

function narrarAperto(v: Vida): void {
  if (v.fatos['aperto_desde'] === undefined || v.t - (v.fatos['ultimo_aperto'] ?? 0) > 36) {
    v.fatos['aperto_desde'] = v.t;
    const n = (v.fatos['apertos'] ?? 0) + 1;
    v.fatos['apertos'] = n;
    const textos = [
      'O dinheiro não fechava. Saíram o lazer, a marca boa do supermercado, o que dava para cortar.',
      'De novo o mês maior que o salário: carne virou ovo, a assinatura de streaming foi cancelada.',
      'Voltou o tempo das contas na ponta do lápis. Nada de pedir comida, nada de sair no fim de semana.',
      'O aperto voltou. A lista do mercado encolheu e o cartão ficou na gaveta.'
    ];
    escrever(v, { texto: textos[(n - 1) % textos.length], relevancia: 'cotidiano', tema: 'dinheiro', tom: 'ruim' });
  }
  v.fatos['ultimo_aperto'] = v.t;
}

function quitada(v: Vida, d: Divida): void {
  if (d.tipo === 'financiamento_imovel') {
    const im = v.financas.bens.find(b => b.id === d.bemId);
    escrever(v, { texto: `Pagou a última parcela ${im && v.moradia.imovelId === im.id ? 'da casa' : 'do imóvel'}. ${im?.dono === 'casal' ? 'Agora é de vocês, sem banco no meio.' : 'Agora é todo seu.'}`, relevancia: 'marco', tema: 'casa', tom: 'bom' });
    if (im) (im.historia ??= []).push({ t: v.t, texto: 'Quitado.' });
  } else if (d.tipo === 'financiamento_veiculo') {
    const vei = v.financas.bens.find(b => b.id === d.bemId);
    if (vei) (vei.historia ??= []).push({ t: v.t, texto: 'Última parcela paga.' });
  } else if (d.tipo === 'cartao' && temFato(v, 'teve_divida_cartao') && d.descricao.startsWith('Cartão') && v.fatos['zerou_cartao'] !== v.t) {
    v.fatos['zerou_cartao'] = v.t;
    escrever(v, { texto: 'Conseguiu zerar a dívida do cartão.', relevancia: 'biografia', tema: 'dinheiro', tom: 'bom' });
  }
}

function negativar(v: Vida, texto: string): void {
  const f = v.financas;
  if (f.negativado) return;
  f.negativado = true;
  v.fatos['negativado_desde'] = v.t;
  const primeira = v.fatos['ja_foi_negativado'] === undefined;
  v.fatos['ja_foi_negativado'] = v.t;
  const vezes = (v.fatos['negativacoes'] ?? 0) + 1;
  v.fatos['negativacoes'] = vezes;
  escrever(v, { texto: primeira ? texto : vezes === 2 ? 'O nome voltou para o cadastro de devedores.' : 'Nome sujo de novo.', relevancia: primeira ? 'biografia' : 'tecnico', tema: 'dinheiro', tom: 'ruim' });
}

/** Paga parcelas e aluguéis atrasados com o que há na conta. */
function pagarAtrasos(v: Vida): void {
  const f = v.financas;
  const itens: { valor: number; quitar: () => void }[] = [];
  if ((v.moradia.atraso ?? 0) > 0) itens.push({ valor: v.moradia.atraso! * v.moradia.aluguel, quitar: () => { v.moradia.atraso = 0; v.moradia.atrasoDesde = undefined; } });
  // O saldo da dívida já inclui as parcelas que ficaram para trás: pagar o atraso abate dele.
  for (const d of f.dividas) if ((d.atraso ?? 0) > 0) { const valor = Math.round(d.atraso! * d.parcela); itens.push({ valor, quitar: () => { d.atraso = 0; d.atrasoDesde = undefined; d.saldo = Math.max(0, d.saldo - valor); } }); }
  for (const it of itens.sort((a, b) => a.valor - b.valor)) {
    if (f.conta < it.valor) continue;
    f.conta -= it.valor;
    it.quitar();
  }
}

/**
 * Faltou dinheiro no ano. Em ordem: as aplicações (da reserva à bolsa), a
 * família (se alguém pode e quer), o crédito caro (até o limite) e, por fim,
 * o ATRASO — que é gradual: parcelas e aluguel ficam devendo, e o que vem
 * depois (acordo, venda, retomada, despejo) está em `sistemas/obrigacoes`.
 */
function cobrirRombo(v: Vida, r: Rng): void {
  const f = v.financas;
  const i = idade(v);
  let falta = -f.conta;
  f.conta = 0;
  const aplic = cobrirComAplicacoes(v, falta);
  const resgatado = falta - aplic.resta;
  falta = aplic.resta;
  f.conta = 0;
  // O ano fechou no vermelho e as aplicações cobriram: não é silêncio — fica na conta do ano e na Linha da Vida.
  if (resgatado >= 100) {
    f.razao.push({ rotulo: 'Tirado das aplicações para cobrir o ano', valor: Math.round(resgatado), grupo: 'outros' });
    escrever(v, { texto: `As contas do ano passaram do que entrou: saíram ${fmt(resgatado)} das aplicações para cobrir.`, relevancia: resgatado >= 20000 ? 'cotidiano' : 'tecnico', tema: 'dinheiro', tom: 'ruim' });
  }
  if (aplic.vendeuNaBaixa.length && !temFato(v, 'vendeu_na_baixa')) {
    marcarFato(v, 'vendeu_na_baixa');
    escrever(v, { texto: `Para fechar as contas, precisou vender ${aplic.vendeuNaBaixa[0]} num momento ruim — por menos do que tinha posto.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
  }
  if (falta <= 0) return;
  if (i >= 18) falta = ajudaDaFamilia(v, r, falta);
  if (falta <= 0) return;

  let cartao = f.dividas.find(d => d.tipo === 'cartao');
  const cabe = Math.max(0, limiteDeCredito(v) - (cartao?.saldo ?? 0));
  const noCredito = Math.min(cabe, falta);
  if (noCredito > 0) {
    if (!cartao) {
      cartao = { id: `cartao${v.seq++}`, tipo: 'cartao', saldo: 0, jurosMes: 0.045, parcela: 0, descricao: 'Cartão e cheque especial', tInicio: v.t };
      f.dividas.push(cartao);
    }
    const antes = cartao.saldo;
    cartao.saldo += Math.round(noCredito);
    if (!temFato(v, 'teve_divida_cartao') && cartao.saldo >= 300) {
      marcarFato(v, 'teve_divida_cartao');
      escrever(v, { texto: `As contas não fecharam e o buraco foi para o cartão de crédito: ${fmt(cartao.saldo)} rodando a juros altos.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    } else if (antes < 20000 && cartao.saldo >= 20000) {
      escrever(v, { texto: `A dívida do cartão passou de ${fmt(20000)}. Os juros comem o salário antes dele chegar.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    }
    falta -= noCredito;
  }
  if (falta <= 0 || i < 18) return;

  // O que não coube em lugar nenhum vira atraso: parcelas e aluguel ficam devendo.
  const parceladas = f.dividas.filter(d => d.parcela > 0 && d.saldo > 0);
  const aluguel = v.moradia.tipo === 'aluguel' || v.moradia.tipo === 'republica' ? v.moradia.aluguel : 0;
  const obrigacoesMes = parceladas.reduce((s, d) => s + d.parcela, 0) + aluguel;
  if (obrigacoesMes > 0) {
    const meses = Math.min(12, Math.round(falta / obrigacoesMes * 10) / 10);
    for (const d of parceladas) { if (!(d.atraso ?? 0)) d.atrasoDesde = v.t; d.atraso = Math.round(((d.atraso ?? 0) + meses) * 10) / 10; d.saldo += Math.round(d.parcela * meses * 1.02); }
    if (aluguel) { if (!(v.moradia.atraso ?? 0)) v.moradia.atrasoDesde = v.t; v.moradia.atraso = Math.round(((v.moradia.atraso ?? 0) + meses) * 10) / 10; }
    if (!temFato(v, 'teve_atraso')) {
      marcarFato(v, 'teve_atraso');
      escrever(v, { texto: `Pela primeira vez, as parcelas${aluguel ? ' e o aluguel' : ''} atrasaram. Chegou a primeira carta de cobrança.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    }
    abalar(v, 'as contas atrasadas', -3, 8);
  } else {
    negativar(v, 'Contas de luz, água e telefone atrasadas viraram nome sujo. Crédito, agora, só depois de acertar.');
    abalar(v, 'as contas atrasadas', 0, 6);
    v.corpo.saude = clamp(v.corpo.saude - Math.min(2, Math.round(falta / 10000)));
  }
}

/**
 * Quando falta, a família às vezes cobre — se pode e se quer. Pais com renda,
 * filhos adultos que estão bem, um irmão próximo. Não é garantido: depende da
 * relação e de quanto a pessoa tem. Devolve o que ainda faltou.
 */
function ajudaDaFamilia(v: Vida, r: Rng, falta: number): number {
  const candidatos = vinculosVivos(v)
    .filter(x => !x.p.especie && idadePessoa(v, x.p) >= 25 && x.p.renda > 0 && ['mae', 'pai', 'filho', 'irmao', 'avo'].includes(x.vin.parentesco ?? ''))
    .filter(x => v.t - (v.fatos[`ajudou_${x.p.id}`] ?? -999) >= 36)
    .map(x => {
      const pais = x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai' || x.vin.parentesco === 'avo';
      const classe = pais ? ({ vulneravel: 0.5, trabalhadora: 1, media_baixa: 2, media: 5, alta: 15 } as Record<string, number>)[v.origem.classe] : 1.5;
      return { ...x, capacidade: x.p.renda * 2 * classe, vontade: (x.vin.proximidade - 35) / 50 + x.vin.confianca / 200 - x.vin.tensao / 100 + (pais ? 0.15 : 0) };
    })
    .filter(x => x.vontade > 0 && x.capacidade >= 500)
    .sort((a, b) => b.vontade * b.capacidade - a.vontade * a.capacidade);
  for (const x of candidatos) {
    if (falta <= 0) break;
    if (!r.chance(Math.min(0.85, x.vontade))) continue;
    const valor = Math.round(Math.min(falta, x.capacidade) / 100) * 100;
    if (valor <= 0) continue;
    v.financas.conta += valor;
    falta -= valor;
    v.fatos[`ajudou_${x.p.id}`] = v.t;
    const papel = x.vin.parentesco === 'filho' ? flex(x.p.genero, 'O filho', 'A filha', 'Filhe') : x.vin.parentesco === 'mae' ? 'A mãe' : x.vin.parentesco === 'pai' ? 'O pai' : x.vin.parentesco === 'avo' ? flex(x.p.genero, 'O avô', 'A avó') : flex(x.p.genero, 'O irmão', 'A irmã', 'Irmane');
    const vezes = (v.fatos['ajudas_recebidas'] ?? 0) + 1;
    v.fatos['ajudas_recebidas'] = vezes;
    const quem = `${papel}${x.vin.parentesco === 'filho' || x.vin.parentesco === 'irmao' ? `, ${x.p.nome},` : ''}`;
    const textos = [
      `${quem} cobriu ${fmt(valor)} do buraco do ano${x.vin.parentesco === 'filho' ? ' — sem cobrar nada' : ''}.`,
      `De novo, ${quem.charAt(0).toLowerCase() + quem.slice(1)} ajudou a fechar as contas: ${fmt(valor)}.`,
      `${quem} mandou ${fmt(valor)} "para ajudar", sem perguntar muito.`
    ];
    escrever(v, { texto: textos[(vezes - 1) % textos.length], relevancia: vezes <= 2 ? 'cotidiano' : 'tecnico', tema: 'familia', pessoas: [x.p.id], tom: 'bom' });
    lembrarCom(v, x.p.id, x.vin.parentesco === 'filho' ? 'Ajudou você com dinheiro quando apertou.' : 'Ajudou com dinheiro num ano apertado.', 'apoio', 2);
    x.vin.proximidade = Math.min(100, x.vin.proximidade + 2);
  }
  return Math.max(0, falta);
}

/** Registra como estava o dinheiro neste aniversário (evolução e métricas). */
export function fotografar(v: Vida): void {
  const b = balanco(v);
  const o = orcamento(v);
  const h = v.financas.historico;
  h.push({ t: v.t, ativos: b.ativos + 0, obrigacoes: b.obrigacoes + 0, renda: Math.round(o.renda) + 0, despesa: Math.round(o.despesa) + 0 });
  if (h.length > 110) h.shift();
}

/* ============================================================ Pagar e ter */

/* ============================================== Liquidez: conta × patrimônio */

/**
 * Posso pagar isto agora? Separa três situações que o jogo não pode
 * confundir:
 *   'tem'            — o dinheiro está na conta;
 *   'resgatando'     — a conta não cobre, mas as aplicações cobrem (é
 *                      patrimônio que existe: tirar é escolha do jogador);
 *   'sem_patrimonio' — nem somando conta e aplicações.
 * Imóveis e veículos não entram: vender a casa para pagar o conserto do
 * carro é outra decisão, não um detalhe de pagamento.
 */
export interface Capacidade {
  situacao: 'tem' | 'resgatando' | 'sem_patrimonio';
  conta: number;
  /** Quanto falta na conta. */
  falta: number;
  /** Quanto as aplicações cobrem agora (pelo valor do dia). */
  aplicado: number;
  /** Aplicações que seriam vendidas abaixo do que se pôs (a perda se realiza). */
  naBaixa: string[];
}

export function capacidade(v: Vida, valor: number): Capacidade {
  const conta = Math.max(0, v.financas.conta);
  const aplicado = totalAplicado(v);
  const falta = Math.max(0, Math.round(valor - conta));
  if (falta <= 0) return { situacao: 'tem', conta, falta: 0, aplicado, naBaixa: [] };
  if (falta > aplicado) return { situacao: 'sem_patrimonio', conta, falta, aplicado, naBaixa: [] };
  return { situacao: 'resgatando', conta, falta, aplicado, naBaixa: planoDeResgate(v, falta).naBaixa };
}

/** O que sairia de cada aplicação para cobrir `valor` (a mesma ordem da vida real: reserva primeiro, bolsa por último). */
export function planoDeResgate(v: Vida, valor: number): { itens: { id: string; nome: string; valor: number }[]; naBaixa: string[] } {
  const itens: { id: string; nome: string; valor: number }[] = [];
  const naBaixa: string[] = [];
  let falta = valor;
  for (const a of [...v.financas.investimentos].sort((x, y) => produto(x.produto).ordemResgate - produto(y.produto).ordemResgate)) {
    if (falta <= 0) break;
    const tirar = Math.min(falta, a.valor);
    if (tirar <= 0) continue;
    const nome = produto(a.produto).nome.toLowerCase();
    itens.push({ id: a.id, nome, valor: Math.round(tirar) });
    if (a.valor < a.aportado * 0.9 && produto(a.produto).risco >= 3) naBaixa.push(nome);
    falta -= tirar;
  }
  return { itens, naBaixa };
}

/**
 * O veredito de um pagamento, com a frase certa para cada situação:
 * "Custa R$ X; na conta há R$ Y" (e as aplicações cobrem: dá para tirar) ou
 * "Custa R$ X; somando conta e aplicações, você tem R$ Y".
 */
export function vereditoDePagar(v: Vida, valor: number, oque = 'Custa'): Veredito {
  const k = capacidade(v, valor);
  if (k.situacao === 'tem') return PERMITIDO;
  const custa = `${oque} ${fmt(valor)}`;
  if (k.situacao === 'resgatando') {
    return { grau: 'requisito', motivo: `${custa}; na conta há ${fmt(k.conta)}. Faltam ${fmt(k.falta)} — dá para tirar das suas aplicações${k.naBaixa.length ? ` (${k.naBaixa.join(' e ')} está abaixo do que você pôs: vender agora realiza a perda)` : ''}.`, resgate: { valor: k.falta, naBaixa: k.naBaixa } };
  }
  return bloqueio('requisito', k.aplicado > 0 ? `${custa}; somando conta e aplicações, você tem ${fmt(k.conta + k.aplicado)}.` : `${custa}; na conta há ${fmt(k.conta)}.`);
}

/**
 * Tira `valor` das aplicações para a conta — só por escolha do jogador (ou
 * pelo fim do ano, quando a conta fica negativa: aí fica dito). Devolve o
 * que saiu de cada uma, para a mensagem.
 */
export function tirarDasAplicacoes(v: Vida, valor: number, motivo: string): string {
  const plano = planoDeResgate(v, valor);
  let tirado = 0;
  for (const it of plano.itens) tirado += resgatar(v, it.id, it.valor);
  const partes = plano.itens.map(it => `${fmt(it.valor)} ${it.nome.startsWith('a ') || it.nome.startsWith('o ') ? 'd' + it.nome : `de ${it.nome}`}`);
  const texto = `Tirou ${fmt(tirado)} das aplicações ${motivo}: ${partes.join(', ')}.${plano.naBaixa.length ? ` Vendeu ${plano.naBaixa.join(' e ')} abaixo do que tinha posto.` : ''}`;
  escrever(v, { texto, relevancia: tirado >= 50000 ? 'cotidiano' : 'tecnico', tema: 'dinheiro', escolha: true });
  return texto;
}

/** O mesmo veredito, no formato `{ ok, motivo }` que alguns sistemas usam (com o resgate possível junto). */
export function okDePagar(v: Vida, valor: number, oque = 'Custa'): { ok: boolean; motivo?: string; resgate?: Veredito['resgate'] } {
  const d = vereditoDePagar(v, valor, oque);
  return d.grau === 'permitido' ? { ok: true } : { ok: false, motivo: d.motivo, resgate: d.resgate };
}

/** O que dá para usar agora: conta + aplicações (vendendo pelo preço do dia). */
export const disponivel = (v: Vida) => Math.max(0, v.financas.conta) + totalAplicado(v);

/** Paga um valor com a conta e, se faltar, com as aplicações (da mais fácil de tirar para a mais arriscada). */
export function pagar(v: Vida, valor: number): void {
  const f = v.financas;
  f.conta -= Math.round(valor);
  if (f.conta < 0) {
    const falta = -f.conta;
    f.conta = 0;
    const res = cobrirComAplicacoes(v, falta);
    f.conta = -res.resta;
  }
}
