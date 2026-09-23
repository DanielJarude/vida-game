/**
 * Dinheiro com origem e destino.
 *
 * O orçamento é do DOMICÍLIO e é derivado do estado: quantas pessoas moram
 * junto, se a casa é alugada ou própria, se há carro, filhos na escola,
 * plano de saúde, dívidas, estilo de vida. Uma pessoa casada, com dois
 * filhos, casa financiada e carro gasta muito mais do que alguém solteiro
 * na casa dos pais — porque o orçamento é feito dessas coisas.
 *
 * Reais constantes: o dinheiro parado na conta perde um pouco por ano
 * (inflação); a reserva rende acima dela; ações oscilam.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { LinhaRazao, Vida } from '../tipos';
import { escrever, filhos, idade, idadePessoa, marcarFato, moraCom, parceiro, pets, temFato } from '../nucleo';
import { economiaLocal } from '../dados/lugares';
import { modeloMoradia, modeloVeiculo } from '../dados/bens';
import { curso } from '../dados/cursos';
import { liquido, mesesPagos } from './renda';
import { moraComFamiliaDeOrigem, rendaDosOutros } from './domicilio';
import { dinheiro as fmt } from '../texto';

const POR_ESTILO = {
  apertado: { basico: 520, lazer: 60, contas: 230 },
  modesto: { basico: 780, lazer: 220, contas: 340 },
  confortavel: { basico: 1150, lazer: 600, contas: 520 },
  folgado: { basico: 1900, lazer: 1500, contas: 850 }
} as const;

const CONTRIBUICAO_EM_CASA: Record<string, number> = { vulneravel: 0.4, trabalhadora: 0.3, media_baixa: 0.2, media: 0.1, alta: 0 };
const MESADA: Record<string, number> = { vulneravel: 0, trabalhadora: 30, media_baixa: 70, media: 180, alta: 450 };
/** Quanto da mensalidade da faculdade os pais conseguem bancar enquanto o filho mora com eles. */
const PAIS_PAGAM_ESTUDO: Record<string, number> = { vulneravel: 0, trabalhadora: 0, media_baixa: 400, media: 1600, alta: 12000 };

export function planoDeSaudeMensal(i: number): number {
  return i < 19 ? 230 : i < 34 ? 420 : i < 49 ? 640 : i < 59 ? 1050 : 1600;
}

/** Renda mensal que entra para o jogador (própria), com a origem de cada parte. */
export function rendasMensais(v: Vida): LinhaRazao[] {
  const out: LinhaRazao[] = [];
  const e = v.trabalho.atual;
  if (e) {
    const liq = liquido(e.salario, e.contrato);
    const meses = mesesPagos(e.contrato);
    out.push({ rotulo: e.contrato === 'clt' || e.contrato === 'servidor' ? 'Salário líquido (com 13º e férias)' : e.contrato === 'estagio' ? 'Bolsa de estágio' : 'Renda do trabalho', valor: Math.round(liq * meses / 12), grupo: 'renda' });
    if (v.anoAtual.acoes.includes('horas_extras')) out.push({ rotulo: 'Horas extras', valor: Math.round(liq * 0.15), grupo: 'renda' });
  }
  if (v.trabalho.aposentadoria) out.push({ rotulo: temFato(v, 'bpc') ? 'BPC' : 'Aposentadoria (INSS)', valor: Math.round(v.trabalho.aposentadoria.beneficio * 13 / 12), grupo: 'renda' });
  const m = v.educacao.matricula;
  if (m && !m.trancado) {
    const bolsa = curso(m.cursoId).bolsa;
    if (bolsa) out.push({ rotulo: 'Bolsa de estudos', valor: bolsa, grupo: 'renda' });
  }
  for (const b of v.financas.bens) {
    if (b.tipo === 'imovel' && b.alugadoPor) out.push({ rotulo: `Aluguel recebido (${b.nome})`, valor: b.alugadoPor, grupo: 'renda' });
  }
  const i = idade(v);
  if (moraComFamiliaDeOrigem(v) && i >= 8 && i < 18) {
    const mesada = MESADA[v.origem.classe];
    if (mesada > 0) out.push({ rotulo: 'Mesada', valor: mesada, grupo: 'renda' });
  }
  // Parceiro que mora junto divide a casa.
  const par = parceiro(v);
  if (par && v.vinculos[par.p.id].convivio.includes('casa') && !moraComFamiliaDeOrigem(v)) {
    if (par.p.renda > 0) out.push({ rotulo: `Renda de ${par.p.nome}`, valor: par.p.renda, grupo: 'renda' });
  }
  return out;
}

/** Despesas mensais do domicílio (ou, na casa dos pais, as despesas próprias). */
export function despesasMensais(v: Vida, estiloForcado?: Vida['financas']['estilo']): LinhaRazao[] {
  const out: LinhaRazao[] = [];
  const f = v.financas;
  const local = economiaLocal(v.moradia.municipioId);
  const c = local.custo;
  const estilo = POR_ESTILO[estiloForcado ?? f.estilo];
  const i = idade(v);
  const naCasaDosPais = moraComFamiliaDeOrigem(v);
  const add = (rotulo: string, valor: number, grupo: LinhaRazao['grupo']) => {
    if (valor > 0) out.push({ rotulo, valor: -Math.round(valor), grupo });
  };

  if (naCasaDosPais) {
    if (i < 16) return out; // criança: quem paga a casa são os adultos
    const renda = rendasMensais(v).filter(l => l.rotulo !== 'Mesada').reduce((s, l) => s + l.valor, 0);
    if (renda > 0) add('Ajuda nas contas de casa', renda * CONTRIBUICAO_EM_CASA[v.origem.classe], 'moradia');
    if (i >= 18 && renda > 0) add('Gastos pessoais e lazer', (estilo.lazer + estilo.basico * 0.25) * c, 'lazer');
  } else {
    // Moradia
    const mor = v.moradia;
    const modelo = mor.modeloId ? modeloMoradia(mor.modeloId) : undefined;
    if (mor.tipo === 'aluguel' || mor.tipo === 'republica') add('Aluguel', mor.aluguel, 'moradia');
    if (modelo?.condominio) add('Condomínio', modelo.condominio * c, 'moradia');
    if (mor.tipo === 'propria') {
      const im = f.bens.find(b => b.id === mor.imovelId);
      if (im) add('IPTU e manutenção da casa', im.valor * 0.009 / 12, 'moradia');
    }
    // Casa: comida, contas, higiene — cresce com as pessoas.
    const adultos = 1 + moraCom(v).filter(p => idadePessoa(v, p) >= 18).length;
    const criancas = moraCom(v).filter(p => idadePessoa(v, p) < 18).length;
    add('Mercado, contas e casa', (estilo.basico * (adultos + criancas * 0.6) + estilo.contas * (mor.tipo === 'republica' ? 0.4 : 1)) * c, 'casa');
    add('Lazer', estilo.lazer * adultos * c, 'lazer');
  }

  // Filhos (os que moram junto; e pensão dos que não moram)
  for (const fl of filhos(v)) {
    const idF = idadePessoa(v, fl);
    if (idF >= 18) continue;
    const mora = v.vinculos[fl.id].convivio.includes('casa');
    if (!mora) { add(`Pensão de ${fl.nome}`, 700 * c, 'filhos'); continue; }
    add(`Custos de ${fl.nome}`, (idF < 3 ? 650 : 420) * c, 'filhos');
    if (idF >= 2 && temFato(v, 'filhos_escola_privada')) add(`Escola de ${fl.nome}`, 1300 * c, 'filhos');
  }
  if (pets(v).length > 0 && !naCasaDosPais) add('Pet', 140 * pets(v).length, 'casa');

  // Transporte
  const veiculos = f.bens.filter(b => b.tipo === 'veiculo');
  for (const vei of veiculos) {
    if (vei.tipo !== 'veiculo') continue;
    const m = modeloVeiculo(vei.modeloId);
    add(`${capital(m.nome)}: uso e manutenção`, m.usoMensal * c * (vei.estado < 40 ? 1.4 : 1), 'transporte');
    if (m.taxaAnual) add(`${capital(m.nome)}: IPVA e seguro`, vei.valor * m.taxaAnual / 12, 'transporte');
  }
  const precisaDeslocar = v.trabalho.atual || v.educacao.matricula?.modalidade === 'presencial';
  if (precisaDeslocar && !veiculos.some(b => b.tipo === 'veiculo' && !b.modeloId.startsWith('bike')) && i >= 16) {
    add('Transporte público', (local.transporte === 'bom' ? 260 : local.transporte === 'medio' ? 210 : 150), 'transporte');
  }

  // Saúde
  if (f.planoDeSaude && (!naCasaDosPais || i >= 24)) {
    add('Plano de saúde', planoDeSaudeMensal(i) * c, 'saude');
    const par = parceiro(v);
    if (par && v.vinculos[par.p.id].convivio.includes('casa')) add(`Plano de saúde de ${par.p.nome}`, planoDeSaudeMensal(idadePessoa(v, par.p)) * c, 'saude');
    const pequenos = filhos(v).filter(fl => idadePessoa(v, fl) < 18 && v.vinculos[fl.id].convivio.includes('casa')).length;
    if (pequenos) add('Plano de saúde dos filhos', 250 * pequenos * c, 'saude');
  }
  const tratamentos = v.corpo.condicoes.filter(x => x.tratando && x.cronica).length;
  if (tratamentos) add('Remédios e consultas', 180 * tratamentos, 'saude');

  // Educação própria
  const m = v.educacao.matricula;
  if (m && !m.trancado && m.mensalidade > 0 && m.financiamento !== 'fies') {
    const pagoPelosPais = naCasaDosPais ? Math.min(m.mensalidade, PAIS_PAGAM_ESTUDO[v.origem.classe]) : 0;
    add('Mensalidade da faculdade', m.mensalidade - pagoPelosPais, 'educacao');
  }
  if (v.educacao.cursinho) add('Cursinho', (naCasaDosPais && ['media', 'alta'].includes(v.origem.classe) ? 0 : 450) * c, 'educacao');

  // Rotinas pagas
  for (const rot of v.rotinas) {
    const custo = CUSTO_ROTINA[rot.id];
    if (custo && !(naCasaDosPais && i < 18)) add(ROTULO_ROTINA_CUSTO[rot.id] ?? rot.id, custo * c, 'lazer');
  }

  // Compromissos com a família: ajuda mensal, cuidadora, casa de repouso.
  for (const [chave] of Object.entries(v.fatos)) {
    const m = chave.match(/^(ajuda_mensal|paga_cuidadora|casa_repouso)_(.+)$/);
    if (!m) continue;
    const p = v.pessoas[m[2]];
    if (!p || !p.vivo) continue;
    const valor = m[1] === 'ajuda_mensal' ? 600 : m[1] === 'paga_cuidadora' ? 2800 : 1900;
    add(m[1] === 'ajuda_mensal' ? `Ajuda para ${p.nome}` : m[1] === 'paga_cuidadora' ? `Cuidadora de ${p.nome}` : `Casa de repouso de ${p.nome}`, valor * c, 'outros');
  }

  // Padrão de vida acompanha a renda: quem ganha mais passa a gastar mais
  // (restaurante, roupa, viagem, carro melhor). Só o estilo apertado resiste.
  const propria = rendasMensais(v).filter(l => l.grupo === 'renda' && !l.rotulo.startsWith('Renda de') && l.rotulo !== 'Mesada').reduce((s, l) => s + l.valor, 0);
  const creep = { apertado: 0.1, modesto: 0.35, confortavel: 0.55, folgado: 0.8 }[estiloForcado ?? f.estilo];
  if (propria > 3000 && i >= 18) add('Gastos que vieram com a renda', (propria - 3000) * creep, 'lazer');

  // Dívidas
  for (const d of f.dividas) {
    if (d.parcela > 0) add(d.descricao, Math.min(d.parcela, d.saldo), 'dividas');
  }
  return out;
}

/** Custos mensais das rotinas pagas (sobrescritos pelo módulo de rotinas). */
export const CUSTO_ROTINA: Record<string, number> = {};
export const ROTULO_ROTINA_CUSTO: Record<string, string> = {};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function saldoMensal(v: Vida): { renda: number; despesa: number; linhas: LinhaRazao[] } {
  const rendas = rendasMensais(v);
  const despesas = despesasMensais(v);
  return {
    renda: rendas.reduce((s, l) => s + l.valor, 0),
    despesa: -despesas.reduce((s, l) => s + l.valor, 0),
    linhas: [...rendas, ...despesas]
  };
}

/** Limite de crédito rotativo que os bancos concedem. */
export function limiteDeCredito(v: Vida): number {
  if (v.financas.negativado) return 0;
  const renda = rendasMensais(v).reduce((s, l) => s + l.valor, 0);
  return Math.max(idade(v) >= 18 ? 1500 : 0, Math.round(renda * 3));
}

/* ------------------------------------------------------------ Ano financeiro */

export function processarDinheiro(v: Vida, r: Rng): void {
  const f = v.financas;
  const i = idade(v);
  const saldo = saldoMensal(v);
  const renda = saldo.renda;
  let despesa = saldo.despesa;
  const linhas = [...saldo.linhas];

  // Ninguém gasta o que não tem: quando o ano não fecha e não há reserva
  // que segure, o supérfluo é cortado antes de virar dívida.
  const reservas = Math.max(0, f.conta) + f.reserva + f.acoes;
  if ((despesa - renda) * 12 > reservas && f.estilo !== 'apertado') {
    const minimo = -despesasMensais(v, 'apertado').reduce((s, l) => s + l.valor, 0);
    const corte = Math.min(Math.max(0, despesa - minimo), despesa - renda);
    if (corte > 0) {
      despesa -= corte;
      linhas.push({ rotulo: 'Cortes no mercado, no lazer e nos extras', valor: Math.round(corte), grupo: 'lazer' });
      v.mente.felicidade = clamp(v.mente.felicidade - Math.min(8, Math.round(corte / 250)));
      if (v.fatos['aperto_desde'] === undefined || v.t - (v.fatos['ultimo_aperto'] ?? 0) > 36) {
        v.fatos['aperto_desde'] = v.t;
        escrever(v, { texto: 'O dinheiro não fechava. Saíram o lazer, a marca boa do supermercado, o que dava para cortar.', relevancia: 'cotidiano', tema: 'dinheiro', tom: 'ruim' });
      }
      v.fatos['ultimo_aperto'] = v.t;
    }
  }
  f.razao = linhas.map(l => ({ ...l, valor: l.valor * 12 }));

  // Juros e amortização das dívidas parceladas. Dívida em cobrança (nome
  // sujo) para de rodar juros de cartão: vira cobrança com juros de mora.
  for (const d of f.dividas) {
    if (d.parcela > 0) {
      const pago = Math.min(d.saldo * Math.pow(1 + d.jurosMes, 12), d.parcela * 12);
      d.saldo = Math.max(0, Math.round(d.saldo * Math.pow(1 + d.jurosMes, 12) - pago));
    } else {
      const juros = f.negativado ? 0.01 : d.jurosMes;
      d.saldo = Math.round(d.saldo * Math.pow(1 + juros, 12));
    }
  }
  // Depois de cinco anos, a dívida sai do cadastro de inadimplentes.
  if (f.negativado && v.fatos['negativado_desde'] !== undefined && v.t - v.fatos['negativado_desde'] >= 60) {
    f.negativado = false;
    f.dividas = f.dividas.filter(d => d.tipo !== 'cartao');
    delete v.fatos['negativado_desde'];
    const vezes = (v.fatos['caducou'] ?? 0) + 1;
    v.fatos['caducou'] = vezes;
    escrever(v, { texto: vezes === 1 ? 'Cinco anos depois, a dívida velha caducou e o nome saiu do Serasa.' : 'Mais uma dívida velha caducou.', relevancia: vezes === 1 ? 'cotidiano' : 'tecnico', tema: 'dinheiro' });
  }

  // Rendimentos
  const rendReserva = Math.round(f.reserva * 0.03);
  const variacaoAcoes = Math.round(f.acoes * (0.035 + r.normal() * 0.14));
  f.reserva += rendReserva;
  f.acoes = Math.max(0, f.acoes + variacaoAcoes);
  if (f.reserva > 0) f.razao.push({ rotulo: 'Rendimento da reserva', valor: rendReserva, grupo: 'renda' });
  if (f.acoes > 0 || variacaoAcoes !== 0) f.razao.push({ rotulo: 'Variação das ações', valor: variacaoAcoes, grupo: 'renda' });
  // Inflação corrói o que fica parado na conta.
  if (f.conta > 0) f.conta = Math.round(f.conta * 0.975);

  f.conta += (renda - despesa) * 12;

  // Pagar dívidas caras com o que sobrou (mantendo um mês de colchão).
  const colchao = despesa;
  for (const d of [...f.dividas].sort((a, b) => b.jurosMes - a.jurosMes)) {
    if (f.conta <= colchao || d.saldo <= 0) continue;
    if (d.tipo === 'financiamento_imovel') continue; // amortizar imóvel é decisão do jogador
    const pago = Math.min(d.saldo, f.conta - colchao);
    d.saldo -= pago;
    f.conta -= pago;
  }
  const quitadas = f.dividas.filter(d => d.saldo <= 0);
  for (const d of quitadas) {
    if (d.tipo === 'financiamento_imovel') escrever(v, { texto: 'Pagou a última parcela da casa. O imóvel agora é todo seu.', relevancia: 'marco', tema: 'casa', tom: 'bom' });
    else if (d.tipo === 'cartao' && d.saldo <= 0 && temFato(v, 'teve_divida_cartao')) escrever(v, { texto: 'Conseguiu zerar a dívida do cartão.', relevancia: 'biografia', tema: 'dinheiro', tom: 'bom' });
  }
  f.dividas = f.dividas.filter(d => d.saldo > 0);

  // Faltou dinheiro: reserva, ações, crédito caro, e por fim o nome sujo.
  if (f.conta < 0) cobrirRombo(v, -f.conta);

  // Bens mudam de valor.
  for (const b of f.bens) {
    if (b.tipo === 'veiculo') {
      b.valor = Math.round(b.valor * (b.modeloId.startsWith('bike') ? 0.85 : 0.9));
      b.estado = clamp(b.estado - 7);
    } else {
      b.valor = Math.round(b.valor * (1.01 + r.normal() * 0.03));
      b.estado = clamp(b.estado - 2);
    }
  }

  // Aperto sentido no corpo.
  const cartao = f.dividas.find(d => d.tipo === 'cartao');
  if (f.negativado || (cartao && cartao.saldo > renda * 6 && renda > 0)) {
    v.mente.estresse = clamp(v.mente.estresse + 10);
    v.mente.felicidade = clamp(v.mente.felicidade - 6);
  }
  if (!moraComFamiliaDeOrigem(v) && f.estilo === 'folgado') v.mente.felicidade = clamp(v.mente.felicidade + 2);

  // Na casa dos pais, a pobreza da família também é sentida.
  if (moraComFamiliaDeOrigem(v) && i < 18) {
    const pc = (rendaDosOutros(v) + renda) / (moraCom(v).length + 1);
    if (pc < 500) v.mente.estresse = clamp(v.mente.estresse + 3);
  }
}

function cobrirRombo(v: Vida, falta: number): void {
  const f = v.financas;
  f.conta = 0;
  const daReserva = Math.min(f.reserva, falta);
  f.reserva -= daReserva;
  falta -= daReserva;
  if (falta > 0 && f.acoes > 0) {
    const dasAcoes = Math.min(f.acoes, falta);
    f.acoes -= dasAcoes;
    falta -= dasAcoes;
  }
  if (falta <= 0) return;
  let cartao = f.dividas.find(d => d.tipo === 'cartao');
  const limite = limiteDeCredito(v);
  const usado = cartao?.saldo ?? 0;
  const cabe = Math.max(0, limite - usado);
  const noCredito = Math.min(cabe, falta);
  if (noCredito > 0) {
    if (!cartao) {
      cartao = { id: `cartao${v.seq++}`, tipo: 'cartao', saldo: 0, jurosMes: 0.045, parcela: 0, descricao: 'Cartão e cheque especial' };
      f.dividas.push(cartao);
    }
    const antes = cartao.saldo;
    cartao.saldo += Math.round(noCredito);
    if (!temFato(v, 'teve_divida_cartao')) {
      marcarFato(v, 'teve_divida_cartao');
      escrever(v, { texto: `As contas não fecharam e o buraco foi para o cartão de crédito: ${fmt(cartao.saldo)} rodando a juros altos.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    } else if (antes < 20000 && cartao.saldo >= 20000) {
      escrever(v, { texto: `A dívida do cartão passou de ${fmt(20000)}. Os juros comem o salário antes dele chegar.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    }
  }
  const semCobertura = falta - noCredito;
  if (semCobertura > 0 && idade(v) >= 18) {
    if (!f.negativado) {
      f.negativado = true;
      v.fatos['negativado_desde'] = v.t;
      const primeira = v.fatos['ja_foi_negativado'] === undefined;
      v.fatos['ja_foi_negativado'] = v.t;
      const vezes = (v.fatos['negativacoes'] ?? 0) + 1;
      v.fatos['negativacoes'] = vezes;
      escrever(v, { texto: primeira ? 'Contas atrasadas viraram nome sujo no Serasa. Crédito, agora, só depois de renegociar.' : vezes === 2 ? 'O nome voltou para o Serasa.' : 'Nome sujo de novo.', relevancia: primeira ? 'marco' : vezes === 2 ? 'cotidiano' : 'tecnico', tema: 'dinheiro', tom: 'ruim' });
    }
    v.mente.estresse = clamp(v.mente.estresse + 6);
    v.corpo.saude = clamp(v.corpo.saude - Math.min(2, Math.round(semCobertura / 10000)));
  }
}

export function patrimonio(v: Vida): number {
  const f = v.financas;
  const bens = f.bens.reduce((s, b) => s + b.valor, 0);
  const dividas = f.dividas.reduce((s, d) => s + d.saldo, 0);
  return Math.round(f.conta + f.reserva + f.acoes + bens - dividas);
}
