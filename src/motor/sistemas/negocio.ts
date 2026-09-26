/**
 * O próprio negócio: não é "comprou empresa → renda passiva". É trabalho.
 *
 *   ABRIR — nasce da biografia: estrada no ramo (ou um ofício forte), algum
 *   dinheiro (guardado, emprestado, de um sócio) e, nas profissões
 *   regulamentadas, o registro. Dá para tentar cedo, sem conhecer o ramo: o
 *   começo é mais duro e o fracasso ensina (quem tenta de novo começa melhor).
 *   Abrir é um pequeno processo (`conteudo/profissao`): com o guardado, pequeno
 *   e em casa, com empréstimo, com sócio.
 *
 *   DEDICAÇÃO — o negócio pode ser o trabalho de todo dia (`integral`: o
 *   emprego é o de dono, a retirada é o salário) ou tocado nas horas vagas
 *   (`paralela`: ao lado de outro emprego ou do estudo; cresce mais devagar,
 *   pede parte da semana e não paga retirada fixa — o que sobra fica no
 *   caixa). Abrir um negócio NÃO é pedir demissão; mudar de dedicação é
 *   escolha, e quando não cabe na vida, o jogo pergunta (`compromissos`).
 *
 *   O ANO — o movimento (freguesia, pedidos, agenda, obras: 0..100) cresce
 *   com o ofício, a estrada, a reputação, a equipe, o jeito de vender e o que
 *   já foi feito pelo negócio (`melhorias`); míngua na crise. A margem do ano
 *   cresce MAIS depressa que a retirada do dono: com a casa vazia, o negócio
 *   não paga nem quem o toca; com a casa cheia, sobra. O que sobra fica no
 *   CAIXA do negócio (não é o seu dinheiro: retirar é decisão); o que falta
 *   sai do caixa e, quando ele acaba, do seu bolso.
 *
 *   CADA UM É UM — a loja on-line não tem porta nem vitrine; a oficina não
 *   vende em marketplace; o consultório vive de agenda. A presença de cada
 *   tipo (`dados/negocios`) decide as palavras, os jeitos de vender, os
 *   tombos e os acontecimentos que podem chegar.
 *
 * Não é simulador contábil: margem, custo fixo e folha são três números, e a
 * tela fala em palavras.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { EstrategiaNegocio, Funcionario, Negocio, Vida } from '../tipos';
import { escrever, idade, lembrarCom, marcarFato, parceiro, temFato } from '../nucleo';
import { ocupacao, type Ocupacao } from '../dados/ocupacoes';
import { economiaLocal, municipio } from '../dados/lugares';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { contratar, encerrarEmprego, experienciaNaTrilha, nomeOcupacao, rendaDeClientela } from './trabalho';
import { bloqueio, type Veredito } from '../plausibilidade';
import { comprometimento, disponivel, limiteDeCredito, pagar, parcelaPrice } from './dinheiro';
import { juroDeFinanciamento } from './economia';
import { criarPessoa, vincular } from '../pessoas';
import { salarioLocal, SALARIO_MINIMO } from './renda';
import { dinheiro as fmt, flex } from '../texto';
import { abalar } from './abalo';
import { estrategiaPadrao, FATOR_ESTRATEGIA, faixa, NEGOCIOS, PALAVRAS, tipoNegocio, type PresencaNegocio, type TipoNegocio } from '../dados/negocios';

export { NEGOCIOS, tipoNegocio, type TipoNegocio };

export const tipoDoNegocio = (n: Negocio) => tipoNegocio(n.tipo);
export const presencaDe = (n: Negocio): PresencaNegocio => tipoDoNegocio(n)?.presenca ?? 'rua';
export const estrategiaDe = (n: Negocio): EstrategiaNegocio => {
  const t = tipoDoNegocio(n);
  const e = n.estrategia;
  return t && e && t.estrategias.includes(e) ? e : t ? estrategiaPadrao(t) : 'bairro';
};
export const tem = (n: Negocio, melhoria: string) => (n.melhorias ?? []).includes(melhoria);
export const nivelDe = (n: Negocio, prefixo: string) => (n.melhorias ?? []).filter(m => m.startsWith(prefixo)).length;
export const parteDoSocio = (n: Negocio) => (n.socioId ? n.parteSocio ?? 0.5 : 0);
export const dedicacaoDe = (n: Negocio) => n.dedicacao ?? 'integral';

export const custoLocal = (v: Vida, t: TipoNegocio) => Math.round(t.capital * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

/** O negócio aberto (em qualquer dedicação), quando há. */
export function negocioAberto(v: Vida): Negocio | undefined {
  const n = v.caminhos.negocio;
  return n && n.estado !== 'fechado' ? n : undefined;
}
/** O negócio aberto — nome antigo, mesmo sentido. */
export const negocioAtivo = negocioAberto;

/** O negócio é o trabalho de todo dia (o emprego atual é o de dono dele)? */
export function donoIntegral(v: Vida): Negocio | undefined {
  const n = negocioAberto(v);
  return n && dedicacaoDe(n) === 'integral' && v.trabalho.atual?.ocupacaoId === n.ocupacaoId ? n : undefined;
}

/** A chave do lugar de trabalho do negócio (quem trabalha nele convive ali, qualquer que seja a dedicação do dono). */
export const ambienteDoNegocio = (n: Negocio) => `negocio:${n.nome}:${n.tInicio}`;

/* ------------------------------------------------------------ Abrir */

export type ModoAbertura = 'guardado' | 'pequeno' | 'emprestimo' | 'socio';

/** Quanto do custo de abrir pode vir de empréstimo (o banco olha a renda). */
function emprestimoPossivel(v: Vida, falta: number): boolean {
  if (v.financas.negativado || falta <= 0) return false;
  const j = juroDeFinanciamento(v, 'emprestimo');
  return limiteDeCredito(v) * 3 >= falta && comprometimento(v, parcelaPrice(falta, j, 48)) <= 0.45;
}

export function podeAbrirNegocio(v: Vida, id: string): Veredito {
  const t = tipoNegocio(id);
  if (!t) return bloqueio('impossivel', 'Negócio desconhecido.');
  if (idade(v) < 18) return bloqueio('ilegal', 'Abrir empresa exige maioridade.');
  if (v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado') return bloqueio('incompativel', 'Você já tem um negócio aberto.');
  if (v.trabalho.atual?.ocupacaoId === t.ocupacaoId) return bloqueio('incompativel', 'É o que você já faz.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  if (t.licenca && !v.trabalho.licencas.includes(t.licenca)) return bloqueio('requisito', `Exige registro profissional (${t.licenca.toUpperCase()}).`);
  if (v.trabalho.atual?.contrato === 'militar') return bloqueio('incompativel', 'Militar da ativa não pode ser dono de comércio.');
  if (v.trabalho.atual?.contrato === 'eletivo') return bloqueio('incompativel', 'Com mandato, abrir empresa própria abre também conflito de interesses: não agora.');
  const custo = custoLocal(v, t);
  const tem = disponivel(v);
  const cabe = tem >= custo || (t.emCasa && tem >= custo * 0.4) || emprestimoPossivel(v, custo - Math.min(tem, custo * 0.3));
  if (!cabe) return bloqueio('requisito', `Para começar, uns ${fmt(custo)} (${t.presenca === 'online' ? 'estoque, fotos, plataforma' : t.presenca === 'obra' ? 'ferramentas, material, primeiro mês de equipe' : t.presenca === 'atendimento' ? 'sala, equipamento, registro' : 'ponto, equipamento, primeiro estoque'})${t.emCasa ? ` — ou uns ${fmt(Math.round(custo * 0.4 / 100) * 100)} começando pequeno, em casa` : ''}.`);
  const estrada = Math.max(...t.trilhas.map(tr => experienciaNaTrilha(v, tr)));
  const oficio = t.dominio ? habilidade(v, t.dominio) : 0;
  const conhece = estrada >= t.meses || oficio >= (t.habilidade ?? 101);
  // Sem conhecer o ramo dá para tentar — e o jogo diz o que isso significa.
  if (!conhece) return { grau: 'improvavel', chance: 0.35, motivo: `Sem conhecer o ramo (quem abre ${t.nome} costuma ter uns ${Math.round(t.meses / 12)} anos na área${t.habilidade ? ' ou o ofício na mão' : ''}), o começo é mais duro e dar errado é mais provável.` };
  if (v.financas.negativado) return { grau: 'improvavel', chance: 0.4, motivo: 'Com o nome sujo, fornecedor não vende a prazo.' };
  return { grau: 'permitido', chance: 0.6 };
}

/** Como dá para abrir, agora: com o que se tem, pequeno, emprestado. */
export function modosDeAbrir(v: Vida, id: string): { modo: ModoAbertura; custo: number; motivo?: string }[] {
  const t = tipoNegocio(id);
  if (!t) return [];
  const custo = custoLocal(v, t);
  const tem = disponivel(v);
  const out: { modo: ModoAbertura; custo: number; motivo?: string }[] = [];
  out.push({ modo: 'guardado', custo, motivo: tem >= custo ? undefined : `Faltam ${fmt(custo - tem)}.` });
  if (t.emCasa) { const c = Math.round(custo * 0.4 / 100) * 100; out.push({ modo: 'pequeno', custo: c, motivo: tem >= c ? undefined : `Faltam ${fmt(c - tem)}.` }); }
  const falta = custo - Math.min(tem, custo * 0.3);
  out.push({ modo: 'emprestimo', custo, motivo: v.financas.negativado ? 'Com o nome sujo, o banco não empresta.' : emprestimoPossivel(v, falta) ? undefined : 'O banco não empresta tanto para a sua renda.' });
  return out;
}

export interface OpcoesAbertura { modo?: ModoAbertura; socioId?: string; dedicacao?: 'integral' | 'paralela' }

export function abrirNegocio(v: Vida, r: Rng, id: string, opcoes: OpcoesAbertura | string = {}): Negocio {
  const op: OpcoesAbertura = typeof opcoes === 'string' ? { socioId: opcoes, modo: 'socio' } : opcoes;
  const t = tipoNegocio(id)!;
  const cheio = custoLocal(v, t);
  const pequeno = op.modo === 'pequeno' && !!t.emCasa;
  const custo = pequeno ? Math.round(cheio * 0.4 / 100) * 100 : cheio;
  const paralela = op.dedicacao === 'paralela';
  let dividaId: string | undefined;
  if (op.modo === 'emprestimo') {
    // Põe um pouco do que tem; o resto é empréstimo, que fica — mesmo que o negócio não fique.
    const proprio = Math.min(disponivel(v), Math.round(custo * 0.3));
    const valor = custo - proprio;
    pagar(v, proprio);
    const j = juroDeFinanciamento(v, 'emprestimo');
    dividaId = `d${v.seq++}`;
    v.financas.dividas.push({ id: dividaId, tipo: 'emprestimo', saldo: valor, jurosMes: j, parcela: Math.round(parcelaPrice(valor, j, 48)), descricao: `Empréstimo para abrir ${t.nome}`, tInicio: v.t, prazo: 48 });
  } else {
    pagar(v, Math.min(custo, disponivel(v)));
  }
  const oc = ocupacao(t.ocupacaoId);
  const estrada = Math.max(...t.trilhas.map(tr => experienciaNaTrilha(v, tr)));
  const oficio = t.dominio ? habilidade(v, t.dominio) : 0;
  const semEstrada = estrada < t.meses && oficio < (t.habilidade ?? 101) && !op.socioId;
  const aprendeu = Math.min(2, v.fatos['negocio_aprendizado'] ?? 0);
  let clientela = 10 + estrada / 10 + (t.dominio ? oficio / 6 : 0) + aprendeu * 5;
  if (semEstrada) clientela *= 0.6;
  if (paralela) clientela *= 0.8;
  const inicial = Math.round(clamp(clientela, 5, 40));
  const anterior = v.trabalho.atual;
  const nomeAnterior = anterior ? nomeOcupacao(v, ocupacao(anterior.ocupacaoId)) : undefined;
  const n: Negocio = {
    tipo: t.id, nome: nomeDoNegocio(v, t), ocupacaoId: oc.id, tInicio: v.t, capital: custo, clientela: inicial, estado: 'comecando', anosNoVermelho: 0,
    socioId: op.socioId, caixa: 0, porte: 1, unidades: 1, equipe: [], reputacao: Math.round(30 + aprendeu * 5), semEstrada: semEstrada || undefined, dividaId, emCasa: pequeno || undefined, historico: [],
    estrategia: estrategiaPadrao(t), dedicacao: paralela ? 'paralela' : 'integral', melhorias: []
  };
  v.caminhos.negocio = n;
  if (!paralela) {
    const e = contratar(v, r, oc, 'negocio');
    e.clientela = inicial;
    e.empregador = n.nome;
    e.salario = rendaDeClientela(v, oc, inicial);
  }
  const como = pequeno ? ', começando pequeno, em casa' : op.modo === 'emprestimo' ? ', com um empréstimo do banco' : '';
  const lado = paralela ? (nomeAnterior ? ` Sem largar o trabalho de ${nomeAnterior}: o negócio fica para as horas vagas.` : ' Nas horas vagas, ao lado dos estudos.') : '';
  const texto = `Abriu ${t.nome}${op.socioId && v.pessoas[op.socioId] ? ` com ${v.pessoas[op.socioId].nome}` : ''}${como}: ${n.nome}, em ${municipio(v.moradia.municipioId).nome}. ${op.modo === 'emprestimo' ? `A dívida: ${fmt(v.financas.dividas.find(d => d.id === dividaId)!.saldo)}.` : `Pôs ${fmt(custo)} do próprio bolso.`}${lado}`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true, pessoas: op.socioId ? [op.socioId] : undefined });
  marcar(v, 'negocio_aberto', texto, 3, { ocupacaoId: oc.id, pessoaId: op.socioId });
  if (op.socioId && v.vinculos[op.socioId]) v.vinculos[op.socioId].ambiente ??= ambienteDoNegocio(n);
  return n;
}

function nomeDoNegocio(v: Vida, t: TipoNegocio): string {
  const nome = v.eu.nome;
  const sob = v.eu.sobrenome;
  return ({ salao: `Salão ${nome}`, oficina: `Auto Mecânica ${nome}`, lanchonete: `Lanchonete da ${v.eu.genero === 'feminino' ? nome : 'Esquina'}`, comercio: `Empório ${nome}`, loja_online: `Loja ${nome} (on-line)`, empreiteira: `${sob} Construções`, marcenaria: `Marcenaria ${nome}`, estudio: `Estúdio ${nome}`, consultoria_ti: `${sob} Tecnologia`, escritorio_contabil: `${sob} Contabilidade`, consultorio_psicologia: `Consultório de ${nome} ${sob}`, clinica_fisio: `Clínica ${sob} de Fisioterapia`, clinica_vet: `Clínica Veterinária ${nome}` } as Record<string, string>)[t.id] ?? `${t.nome} de ${nome}`;
}

/* ------------------------------------------------------- Dedicação */

/** Dá para tocar nas horas vagas sem que o negócio pare? (alguém no balcão, ou um negócio que não depende de balcão) */
export function podeTocarNasHorasVagas(_v: Vida, n: Negocio): boolean {
  const p = presencaDe(n);
  return p === 'online' || p === 'atendimento' || !!n.emCasa || (n.equipe?.length ?? 0) > 0 || !!n.socioId;
}

/** Passa a tocar o negócio nas horas vagas (o emprego de dono acaba; o negócio continua seu). */
export function passarParaHorasVagas(v: Vida, n: Negocio, motivo = ''): void {
  if (dedicacaoDe(n) === 'paralela') return;
  n.dedicacao = 'paralela';
  if (v.trabalho.atual?.ocupacaoId === n.ocupacaoId) encerrarEmprego(v, 'passou o negócio para as horas vagas');
  const quem = (n.equipe?.length ?? 0) > 0 ? ', com a equipe no dia a dia' : n.socioId && v.pessoas[n.socioId] ? `, com ${v.pessoas[n.socioId].nome} no dia a dia` : '';
  escrever(v, { texto: `${n.nome} passou a ser tocado nas horas vagas${quem}${motivo ? ` ${motivo}` : ''}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
}

/** Passa a se dedicar só ao negócio (quem chama já resolveu o emprego de antes). */
export function dedicarAoNegocio(v: Vida, r: Rng, n: Negocio): void {
  if (dedicacaoDe(n) === 'integral' && v.trabalho.atual?.ocupacaoId === n.ocupacaoId) return;
  const oc = ocupacao(n.ocupacaoId);
  const e = contratar(v, r, oc, 'negocio');
  e.clientela = n.clientela;
  e.empregador = n.nome;
  e.salario = rendaDeClientela(v, oc, n.clientela);
  n.dedicacao = 'integral';
  escrever(v, { texto: `Passou a viver só de ${n.nome}: o negócio virou o trabalho de todo dia.`, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'mudanca_carreira', `Dedicou-se de vez a ${n.nome}.`, 2, { ocupacaoId: oc.id });
}

/* ---------------------------------------------------------- A conta */

const ESCALA_MARGEM = [0, 1, 1.95, 2.6];
const ESCALA_CUSTO = [0, 1, 2.0, 3.2];
/** Quanta gente cabe (e é preciso) em cada porte. */
export const EQUIPE_MAXIMA = [0, 2, 4, 7];

export const tamanhoDaEquipe = (n: Negocio) => n.equipe?.length ?? 0;

/** Até onde o movimento chega com a gente que há: sozinho, ninguém atende uma casa cheia. */
export function tetoDoMovimento(n: Negocio): number {
  const eq = tamanhoDaEquipe(n);
  const porte = n.porte ?? 1;
  const estrutura = nivelDe(n, 'estrutura') * 6;
  let teto: number;
  if (n.emCasa) teto = 55 + estrutura / 2;
  else if (porte === 1) teto = (eq >= 1 ? 100 : 72) + estrutura;
  else if (porte === 2) teto = 38 + eq * 18 + estrutura;
  else teto = 26 + eq * 12 + estrutura;
  // Nas horas vagas, sem ninguém no dia a dia, um negócio de porta aberta abre pouco.
  if (dedicacaoDe(n) === 'paralela' && eq === 0 && !n.socioId && presencaDe(n) === 'rua' && !n.emCasa) teto = Math.min(teto, 40);
  if (dedicacaoDe(n) === 'paralela' && eq === 0 && !n.socioId && presencaDe(n) !== 'rua') teto = Math.min(teto, 55);
  return Math.round(clamp(teto, 0, 100));
}

/** Multiplicador de tamanho (porte e unidades); cada unidade a mais precisa de gente para não render pela metade. */
function escala(n: Negocio, tabela: number[]): number {
  const porte = n.porte ?? 1;
  const u = n.unidades ?? 1;
  const extras = Math.max(0, u - 1);
  const gentePorUnidade = Math.max(0, tamanhoDaEquipe(n) - EQUIPE_MAXIMA[porte] / 2);
  const cobertas = Math.min(extras, Math.floor(gentePorUnidade / 2));
  return tabela[porte] * (1 + 0.55 * cobertas + 0.25 * (extras - cobertas));
}

/** O que já foi feito pelo negócio mexe na margem e no custo (e continua valendo). */
function fatorMelhorias(n: Negocio): { margem: number; custo: number } {
  let margem = 1 + nivelDe(n, 'estrutura') * 0.05 + (tem(n, 'especialidade') ? 0.07 : 0) + (tem(n, 'fornecedor') ? 0.05 : 0) - (tem(n, 'delivery') ? 0.07 : 0);
  let custo = 1 + (tem(n, 'gestao') ? 0.04 : 0) + (tem(n, 'agenda') ? 0.02 : 0) + (tem(n, 'logistica') ? 0.04 : 0);
  if (tem(n, 'fornecedor_ruim')) margem -= 0.04;
  custo = Math.max(0.8, custo);
  return { margem, custo };
}

export const salarioDaFuncao = (v: Vida, t: TipoNegocio) => Math.round(SALARIO_MINIMO * t.folha * economiaLocal(v.moradia.municipioId).salario / 10) * 10;

/** A conta do ano (em reais por ano): o que o movimento deixa, o que o ponto custa, a folha, a sua retirada. */
export function contaDoAno(v: Vida, n: Negocio): { margem: number; fixo: number; folha: number; retirada: number; resultado: number } {
  const e = donoIntegral(v) ? v.trabalho.atual : undefined;
  const oc = ocupacao(n.ocupacaoId);
  const ref = salarioLocal(oc, v.moradia.municipioId);
  const est = FATOR_ESTRATEGIA[estrategiaDe(n)];
  const mel = fatorMelhorias(n);
  const casa = n.emCasa ? { margem: 0.62, custo: 0.3 } : { margem: 1, custo: 1 };
  const c = n.clientela;
  const margem = ref * (3.7 + 0.176 * c) * escala(n, ESCALA_MARGEM) * est.margem * casa.margem * mel.margem;
  const fixo = n.capital / (n.emCasa ? 0.4 : 1) * 0.2 * escala(n, ESCALA_CUSTO) * est.custo * casa.custo * mel.custo;
  const folha = (n.equipe ?? []).reduce((s, f) => s + f.salario * 13.33 * 1.3, 0);
  // Nas horas vagas não há retirada fixa: o que sobra fica no caixa, e tirar é decisão.
  const retirada = e ? e.salario * 12 : 0;
  const bruto = margem - fixo - folha - retirada;
  const resultado = Math.round(bruto * (1 - parteDoSocio(n)) / 100) * 100;
  return { margem: Math.round(margem), fixo: Math.round(fixo), folha: Math.round(folha), retirada: Math.round(retirada), resultado };
}

/** Quanto alguém pagaria pela SUA parte do negócio hoje. */
export function valorDoNegocio(v: Vida, n: Negocio): number {
  return Math.round(valorInteiro(v, n) * (1 - parteDoSocio(n)) / 1000) * 1000;
}

/** Quanto vale o negócio inteiro (as duas partes). */
export function valorInteiro(v: Vida, n: Negocio): number {
  const hist = n.historico ?? [];
  const medio = hist.length ? hist.reduce((s, x) => s + x, 0) / hist.length / Math.max(0.3, 1 - parteDoSocio(n)) : (n.resultadoAno ?? 0);
  const estrutura = n.capital * 0.35 * escala(n, ESCALA_CUSTO);
  const rep = 0.6 + (n.reputacao ?? 40) / 100 * 0.8;
  // Na crise, quem compra paga menos.
  const base = Math.max(estrutura, estrutura + Math.max(0, medio) * 2.5) * rep * (emCrise(v) ? 0.75 : 1);
  return Math.round(base / 1000) * 1000;
}

/* ------------------------------------------------------------ O ano */

/** Depois do ano de trabalho: o negócio acompanha a freguesia. Devolve true se abriu a hora de decidir. */
export function processarNegocio(v: Vida, r?: Rng): boolean {
  const n = v.caminhos.negocio;
  if (!n || n.estado === 'fechado') return false;
  n.caixa ??= 0; n.porte ??= 1; n.unidades ??= 1; n.equipe ??= []; n.reputacao ??= 40; n.historico ??= []; n.melhorias ??= [];
  const e = v.trabalho.atual;
  if (dedicacaoDe(n) === 'integral' && e?.ocupacaoId !== n.ocupacaoId) {
    const ultimo = v.trabalho.historico[v.trabalho.historico.length - 1];
    const doNegocio = ultimo?.ocupacaoId === n.ocupacaoId && ultimo.tFim === v.t;
    if (doNegocio && ultimo.motivo === 'falta de clientela') { fecharNegocio(v, 'o movimento não pagou as contas'); return false; }
    if (n.passivo) { /* nas mãos da equipe durante um mandato: segue abaixo como paralelo */ }
    else {
      // O dia de dono acabou por outro caminho (aposentadoria parcial, mandato, um trabalho novo que veio de fora): o negócio segue, nas horas vagas.
      n.dedicacao = 'paralela';
      escrever(v, { texto: `${n.nome} seguiu aberto, agora nas horas vagas.`, relevancia: 'cotidiano', tema: 'trabalho' });
    }
  }
  const integral = dedicacaoDe(n) === 'integral' && !n.passivo && e?.ocupacaoId === n.ocupacaoId;
  const anos = (v.t - n.tInicio) / 12;
  const est = FATOR_ESTRATEGIA[estrategiaDe(n)];
  const equipe = tamanhoDaEquipe(n);
  const tamanho = (n.porte - 1) + (n.unidades - 1);
  // O que o motor do trabalho já moveu (ofício, estrada, economia) ganha o que é só do negócio.
  let extra = (n.reputacao - 50) / 15 + est.movimento + Math.min(3, equipe) * 0.6 - tamanho * 1.5 + Math.min(2, v.fatos['negocio_aprendizado'] ?? 0);
  if (n.semEstrada && anos < 3) extra -= 3;
  if (emCrise(v)) extra -= 2 + tamanho * 2;
  if (tem(n, 'delivery')) extra += 2;
  if (tem(n, 'agenda')) extra += 1.5;
  if (integral && e?.ritmo === 'puxado') extra += 2.5;
  if (integral && e?.ritmo === 'leve') extra -= equipe >= 2 ? 0.5 : 2;
  const divulgou = v.fatos[`neg_divulgou_${n.tInicio}`];
  if (divulgou !== undefined && v.t - divulgou <= 12) extra += 3;
  let base = integral ? (e!.clientela ?? n.clientela) : n.clientela;
  if (!integral) {
    // Sem o motor do trabalho por baixo: o ofício, a estrada e o jeito de quem toca, com menos horas.
    const t = tipoDoNegocio(n);
    const hab = t?.dominio ? habilidade(v, t.dominio) : 55;
    const exp = Math.max(...(t?.trilhas ?? ['comercio']).map(tr => experienciaNaTrilha(v, tr))) / 12;
    const horas = n.passivo || equipe >= 2 || n.socioId ? -0.5 : presencaDe(n) === 'online' || n.emCasa ? -1 : -2.5;
    base += (hab - 50) / 14 + Math.min(3, exp / 4) + v.personalidade.tracos.sociabilidade / 60 - Math.max(0, n.clientela - 70) / 6 + 0.5 + horas;
  }
  const nova = Math.round(clamp(base + extra + (r ? r.normal() * 2 : 0), 0, tetoDoMovimento(n)));
  n.clientela = nova;
  if (integral) {
    e!.clientela = nova;
    e!.salario = rendaDeClientela(v, ocupacao(n.ocupacaoId), nova);
    if (v.fatos['corte_proprio'] !== undefined && v.t - v.fatos['corte_proprio'] <= 12) e!.salario = Math.round(e!.salario * 0.7 / 10) * 10;
  }

  const conta = contaDoAno(v, n);
  const resultado = conta.resultado;
  n.resultadoAno = resultado;
  n.acumulado = (n.acumulado ?? 0) + resultado;
  n.historico = [...n.historico, resultado].slice(-6);
  n.caixa += resultado;
  if (n.caixa < 0) {
    const falta = -n.caixa;
    n.caixa = 0;
    v.financas.conta -= falta;
    if (!v.fatos[`negocio_bolso_${n.tInicio}`] || v.t - v.fatos[`negocio_bolso_${n.tInicio}`] >= 36) {
      v.fatos[`negocio_bolso_${n.tInicio}`] = v.t;
      escrever(v, { texto: `${n.nome} não pagou as contas do ano: o caixa acabou e saíram ${fmt(falta)} do seu bolso.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    }
    const par = parceiro(v);
    if (par && falta > n.capital * 0.4) par.vin.tensao = Math.min(100, par.vin.tensao + 6);
    // Quem já não cobre o prejuízo nem com o próprio bolso não escolhe mais: fornecedor e banco fecham a porta.
    if (v.financas.conta < -Math.max(8000, n.capital * 0.8)) {
      fecharNegocio(v, 'as dívidas do negócio passaram do que dava para cobrir: fornecedores e banco fecharam a porta');
      if (v.trabalho.atual?.ocupacaoId === n.ocupacaoId) encerrarEmprego(v, 'fechou o negócio');
      return false;
    }
  }

  // Reputação: o que se fala dele.
  n.reputacao = Math.round(clamp(n.reputacao + (n.clientela >= 45 ? 2 : n.clientela < 20 ? -2 : 0) + est.reputacao + (tem(n, 'especialidade') ? 1 : 0) + (resultado < 0 && emCrise(v) ? -2 : 0) - (n.reputacao - 50) / 25, 0, 100));

  if (n.clientela < 20 || resultado < -n.capital * 0.15) { n.anosNoVermelho += 1; n.estado = 'apertado'; }
  else { n.anosNoVermelho = 0; n.estado = n.clientela >= 45 && resultado >= 0 ? 'firme' : 'comecando'; }

  if (n.estado === 'firme' && !v.caminhos.marcas.some(m => m.tipo === 'conquista' && m.ocupacaoId === n.ocupacaoId)) {
    const texto = `${n.nome} firmou: ${presencaDe(n) === 'online' ? 'cliente que volta a comprar' : presencaDe(n) === 'atendimento' ? 'agenda certa' : presencaDe(n) === 'obra' ? 'obra que não para' : 'freguesia certa'}, contas em dia.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 2, { ocupacaoId: n.ocupacaoId });
  }
  if (r) { anoDaEquipe(v, r, n); tombo(v, r, n); }
  return n.anosNoVermelho >= 2;
}

const emCrise = (v: Vida) => v.economia?.fase === 'crise';

/**
 * O que derruba negócio de verdade (e derruba mais o que é maior). Acontece
 * — não é escolha; a reação (insistir, enxugar, vender) é. Cada presença tem
 * os próprios tombos: loja on-line não é assaltada no balcão; consultório não
 * perde a rua para uma obra.
 */
function tombo(v: Vida, r: Rng, n: Negocio): void {
  const tamanho = (n.porte ?? 1) - 1 + (n.unidades ?? 1) - 1;
  const chance = 0.04 + tamanho * 0.05 + (emCrise(v) ? 0.06 : 0);
  if (!r.chance(chance)) return;
  const p = presencaDe(n);
  const desvio = tamanho > 0 && !tem(n, 'gestao') ? ['desvio'] : [];
  const tipo = r.pick([...desvio, 'concorrente', 'assalto', ...(p === 'rua' ? ['obra'] : [])]);
  if (tipo === 'assalto' && p === 'online' && tem(n, 'logistica') && r.chance(0.5)) return;
  const perda = Math.round(n.capital * (tipo === 'desvio' ? 0.25 : tipo === 'assalto' ? 0.08 : 0.05) / 100) * 100;
  const queda = tipo === 'concorrente' ? 14 + tamanho * 4 : tipo === 'obra' ? 8 : tipo === 'desvio' ? 6 : 3;
  n.clientela = Math.max(0, n.clientela - queda);
  if (donoIntegral(v)) v.trabalho.atual!.clientela = n.clientela;
  pagarPeloCaixa(v, n, perda);
  n.reputacao = clamp((n.reputacao ?? 40) - (tipo === 'desvio' ? 4 : 2));
  const texto = {
    desvio: `Alguém de confiança em ${n.nome} desviou dinheiro durante meses. Quando você descobriu, faltavam ${fmt(perda)}.`,
    concorrente: p === 'online' ? `Uma plataforma grande passou a vender o mesmo que ${n.nome}, mais barato e com entrega no dia seguinte.` : p === 'atendimento' ? `Uma rede grande abriu na cidade oferecendo o mesmo que ${n.nome}, com preço de pacote.` : p === 'obra' ? `Uma construtora de fora chegou pegando as obras da região por um preço que ${n.nome} não cobre.` : `Uma rede grande abriu a duas quadras de ${n.nome}, com preço que você não consegue cobrir.`,
    assalto: p === 'obra' ? `Roubaram as ferramentas e o material de uma obra de ${n.nome} num fim de semana. O cliente não quis saber: a entrega atrasou.` : p === 'online' ? `${n.nome} caiu num golpe de pagamento: pedidos pagos com cartão clonado, mercadoria enviada, dinheiro estornado.` : p === 'atendimento' ? `Um cliente grande de ${n.nome} recebeu o serviço e sumiu sem pagar. A cobrança foi parar na Justiça.` : `${n.nome} foi assaltado num sábado à noite. Levaram o caixa e parte do equipamento.`,
    obra: `Uma obra da prefeitura fechou a rua de ${n.nome} por meses. A freguesia foi para outro lugar.`
  }[tipo]!;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  abalar(v, tipo === 'desvio' ? 'o dinheiro desviado do negócio' : 'o golpe no negócio', -4, 6);
}

/** Quem trabalha para você também vive: pede para sair, cresce junto, conta que vai ter filho. */
function anoDaEquipe(v: Vida, r: Rng, n: Negocio): void {
  for (const f of [...(n.equipe ?? [])]) {
    const p = v.pessoas[f.pessoaId];
    if (!p || !p.vivo) { n.equipe = n.equipe!.filter(x => x !== f); continue; }
    const anos = (v.t - f.tInicio) / 12;
    const sai = (n.estado === 'apertado' ? 0.14 : 0.06) + (anos >= 5 ? 0.04 : 0) - (tem(n, 'treino') ? 0.02 : 0);
    if (r.chance(sai)) {
      n.equipe = n.equipe!.filter(x => x !== f);
      desligar(v, f, 'saiu');
      escrever(v, { texto: `${p.nome}, que trabalhava ${em(n.nome)} como ${f.funcao}, pediu as contas: ${n.estado === 'apertado' ? 'o movimento fraco assustou' : r.pick(['uma proposta melhor', 'mudou de cidade', 'quis tentar outra coisa'])}.`, relevancia: 'cotidiano', tema: 'trabalho', pessoas: [p.id] });
    } else if (anos >= 3 && !temFato(v, `equipe_casa_${p.id}`) && r.chance(0.12)) {
      marcarFato(v, `equipe_casa_${p.id}`);
      lembrarCom(v, p.id, `Anos trabalhando juntos ${em(n.nome)}.`, 'trabalho', 2);
      const vin = v.vinculos[p.id];
      if (vin) vin.proximidade = clamp(vin.proximidade + 6);
    }
  }
}

export const em = (nome: string) => `n${/^(Lanchonete|Loja|Marcenaria|Clínica|Auto)/.test(nome) ? 'a' : 'o'} ${nome}`;

/* ------------------------------------------------------ Gente e porte */

/** Uma pessoa nova entra para trabalhar no negócio (e na sua vida). */
export function contratarFuncionario(v: Vida, r: Rng, perfil: 'indicacao' | 'experiente' | 'jovem', indicadoPor?: string): Funcionario | undefined {
  const n = negocioAberto(v);
  const t = n && tipoDoNegocio(n);
  if (!n || !t) return undefined;
  const idadeP = perfil === 'jovem' ? r.int(18, 22) : perfil === 'experiente' ? r.int(30, 52) : r.int(20, 45);
  const p = criarPessoa(v, r, { idade: idadeP, municipioId: v.moradia.municipioId });
  const [m, fem] = r.pick(t.funcoes);
  const funcao = p.genero === 'feminino' ? fem : m;
  const salario = Math.round(salarioDaFuncao(v, t) * (perfil === 'experiente' ? 1.35 : perfil === 'jovem' ? 0.85 : 1) / 10) * 10;
  p.ocupacao = funcao;
  p.renda = Math.round(salario * 0.9);
  const vin = vincular(v, p, { origem: 'trabalho', proximidade: perfil === 'indicacao' ? 22 : 12, convivio: ['trabalho'], estagio: 'colega' });
  vin.ambiente = ambienteDoNegocio(n);
  const f: Funcionario = { pessoaId: p.id, tInicio: v.t, funcao, salario };
  (n.equipe ??= []).push(f);
  const quem = indicadoPor && v.pessoas[indicadoPor] ? `, por indicação de ${v.pessoas[indicadoPor].nome}` : '';
  const texto = `${p.nome} começou a trabalhar ${em(n.nome)}, como ${funcao}${quem}.${perfil === 'jovem' ? ` Primeiro emprego ${p.genero === 'feminino' ? 'dela' : 'dele'}.` : ''}`;
  escrever(v, { texto, relevancia: tamanhoDaEquipe(n) === 1 ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, pessoas: [p.id] });
  if (tamanhoDaEquipe(n) === 1) marcar(v, 'lideranca', `Contratou a primeira pessoa ${em(n.nome)}: ${p.nome}.`, 2, { ocupacaoId: n.ocupacaoId, pessoaId: p.id });
  // Quem entra ainda aprende: no primeiro ano, rende menos.
  if (perfil === 'jovem') n.clientela = Math.max(0, n.clientela - 2);
  return f;
}

/** Tirar alguém da equipe (demissão ou saída): a convivência de trabalho acaba; a pessoa continua existindo. */
function desligar(v: Vida, f: Funcionario, como: 'demitido' | 'saiu' | 'fechou'): void {
  const vin = v.vinculos[f.pessoaId];
  const p = v.pessoas[f.pessoaId];
  if (!vin || !p) return;
  vin.ambiente = undefined;
  vin.convivio = vin.convivio.filter(c => c !== 'trabalho');
  p.ocupacao = undefined;
  p.renda = 0;
  if (como === 'demitido') { vin.tensao = clamp(vin.tensao + 25); vin.proximidade = clamp(vin.proximidade - 10); vin.confianca = clamp(vin.confianca - 10); }
  lembrarCom(v, p.id, como === 'demitido' ? `${flex(p.genero, 'Foi demitido', 'Foi demitida', 'Foi demitide')} por você.` : como === 'fechou' ? 'O negócio em que trabalhava com você fechou.' : 'Saiu do trabalho no seu negócio.', 'trabalho', como === 'saiu' ? 1 : 2);
}

export function demitirFuncionario(v: Vida, pessoaId: string): number {
  const n = negocioAberto(v);
  const f = n?.equipe?.find(x => x.pessoaId === pessoaId);
  if (!n || !f) return 0;
  n.equipe = n.equipe!.filter(x => x !== f);
  // O acerto: saldo, férias, multa — uns dois salários, do caixa (e, se faltar, do bolso).
  const acerto = Math.round(f.salario * 2.2 / 10) * 10;
  pagarPeloCaixa(v, n, acerto);
  n.reputacao = clamp((n.reputacao ?? 40) - 3);
  desligar(v, f, 'demitido');
  const p = v.pessoas[pessoaId];
  escrever(v, { texto: `Demitiu ${p?.nome ?? 'um funcionário'}, que trabalhava ${em(n.nome)} como ${f.funcao}. O acerto: ${fmt(acerto)}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true, tom: 'ruim', pessoas: p ? [p.id] : undefined });
  abalar(v, `ter demitido ${p?.nome ?? 'alguém'}`, -3, 4);
  return acerto;
}

/** Paga do caixa do negócio; o que faltar, do seu bolso. */
export function pagarPeloCaixa(v: Vida, n: Negocio, valor: number): void {
  const doCaixa = Math.min(n.caixa ?? 0, valor);
  n.caixa = (n.caixa ?? 0) - doCaixa;
  if (valor > doCaixa) pagar(v, valor - doCaixa);
}

export const custoDeAmpliar = (v: Vida, n: Negocio) => Math.round(custoLocal(v, tipoDoNegocio(n)!) * 0.9 * (n.porte ?? 1) / 1000) * 1000;
export const custoDeUnidade = (v: Vida, n: Negocio) => Math.round(custoLocal(v, tipoDoNegocio(n)!) * 1.1 / 1000) * 1000;
export const cabeNoCaixaEBolso = (v: Vida, n: Negocio, valor: number) => (n.caixa ?? 0) + disponivel(v) >= valor;

export function podeAmpliar(v: Vida): Veredito {
  const n = negocioAberto(v);
  if (!n) return bloqueio('impossivel', 'Não há negócio.');
  if (n.emCasa) return (n.clientela >= 45 ? { grau: 'permitido' } : bloqueio('requisito', `Primeiro, ${presencaDe(n) === 'online' ? 'os pedidos precisam pedir mais espaço do que a casa tem' : 'a freguesia de casa precisa pedir mais espaço'}.`)) as Veredito;
  if ((n.porte ?? 1) >= 3) return bloqueio('impossivel', 'Já é do maior tamanho que um negócio assim costuma ter.');
  if (n.clientela < 60) return bloqueio('requisito', 'Com o movimento ainda pela metade, crescer só aumenta a conta.');
  const custo = custoDeAmpliar(v, n);
  if (!cabeNoCaixaEBolso(v, n, custo)) return bloqueio('requisito', `Ampliar custa uns ${fmt(custo)} (entre o caixa e o seu bolso, não há).`);
  return { grau: 'permitido' };
}

export function ampliar(v: Vida): void {
  const n = negocioAberto(v)!;
  const p = presencaDe(n);
  if (n.emCasa) {
    // Sair de casa: um ponto (ou uma sala, ou um galpão pequeno).
    const custo = Math.round(custoLocal(v, tipoDoNegocio(n)!) * 0.6 / 100) * 100;
    pagarPeloCaixa(v, n, custo);
    n.capital += custo;
    n.emCasa = undefined;
    n.clientela = Math.round(n.clientela * 0.8);
    if (donoIntegral(v)) v.trabalho.atual!.clientela = n.clientela;
    const lugar = p === 'online' ? 'um galpãozinho alugado, com prateleira e mesa de embalar' : p === 'atendimento' ? 'uma sala de atendimento de verdade' : p === 'obra' ? 'um depósito para material e ferramenta' : 'um ponto de verdade, com porta para a rua';
    escrever(v, { texto: `${n.nome} saiu de casa: ${lugar}. Custou ${fmt(custo)}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
    marcar(v, 'promocao', `${n.nome} saiu de casa.`, 2, { ocupacaoId: n.ocupacaoId });
    return;
  }
  const custo = custoDeAmpliar(v, n);
  pagarPeloCaixa(v, n, custo);
  n.capital += custo;
  n.porte = ((n.porte ?? 1) + 1) as 2 | 3;
  // O lugar maior começa com cadeira vazia.
  n.clientela = Math.round(n.clientela * 0.6);
  if (donoIntegral(v)) v.trabalho.atual!.clientela = n.clientela;
  const grande = n.porte === 3;
  const texto = {
    rua: grande ? `${n.nome} virou um negócio grande: outro andar, outro tamanho. Custou ${fmt(custo)}.` : `Ampliou ${n.nome}: o ponto ao lado, mais espaço, mais conta. Custou ${fmt(custo)}.`,
    online: grande ? `${n.nome} virou uma operação grande: galpão, sistema, turnos de expedição. Custou ${fmt(custo)}.` : `Ampliou ${n.nome}: mais estoque, um catálogo maior, mais conta. Custou ${fmt(custo)}.`,
    atendimento: grande ? `${n.nome} virou uma clínica de verdade: várias salas, recepção, profissionais atendendo junto. Custou ${fmt(custo)}.` : `Ampliou ${n.nome}: mais uma sala, mais horários, mais conta. Custou ${fmt(custo)}.`,
    obra: grande ? `${n.nome} virou uma empresa de obras de verdade: várias equipes, caminhão próprio. Custou ${fmt(custo)}.` : `Ampliou ${n.nome}: equipamento próprio, uma equipe fixa, mais conta. Custou ${fmt(custo)}.`
  }[p];
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'promocao', texto, 3, { ocupacaoId: n.ocupacaoId });
}

export function podeAbrirUnidade(v: Vida): Veredito {
  const n = negocioAberto(v);
  if (!n) return bloqueio('impossivel', 'Não há negócio.');
  if (n.emCasa) return bloqueio('impossivel', 'Primeiro, sair de casa.');
  if ((n.unidades ?? 1) >= 3) return bloqueio('impossivel', 'Três frentes já é o que uma pessoa consegue acompanhar.');
  if (n.estado !== 'firme' || n.clientela < 65 || (n.reputacao ?? 0) < 55) return bloqueio('requisito', 'Outra frente pede a primeira firme, cheia e com nome na cidade.');
  if (tamanhoDaEquipe(n) < 1) return bloqueio('requisito', 'Sem ninguém de confiança para tocar uma das frentes, não dá para estar nas duas.');
  const custo = custoDeUnidade(v, n);
  if (!cabeNoCaixaEBolso(v, n, custo)) return bloqueio('requisito', `Outra frente custa uns ${fmt(custo)}.`);
  return { grau: 'improvavel', chance: 0.5, motivo: 'Duas frentes dobram o que pode dar certo — e o que pode dar errado.' };
}

/** O nome da "segunda unidade" em cada presença. */
export const nomeDaUnidade = (n: Negocio) => ({ rua: 'outra unidade', online: 'uma segunda marca', atendimento: 'uma segunda sala, em outro bairro', obra: 'uma segunda equipe de obra' } as const)[presencaDe(n)];

export function abrirUnidade(v: Vida): void {
  const n = negocioAberto(v)!;
  const custo = custoDeUnidade(v, n);
  pagarPeloCaixa(v, n, custo);
  n.capital += custo;
  n.unidades = (n.unidades ?? 1) + 1;
  n.clientela = Math.round(n.clientela * 0.75);
  if (donoIntegral(v)) v.trabalho.atual!.clientela = n.clientela;
  const p = presencaDe(n);
  const texto = p === 'rua' ? `${n.nome} abriu a ${n.unidades === 2 ? 'segunda' : 'terceira'} unidade, em outro bairro de ${municipio(v.moradia.municipioId).nome}. Custou ${fmt(custo)}.`
    : p === 'online' ? `${n.nome} lançou ${n.unidades === 2 ? 'uma segunda marca' : 'uma terceira marca'}, com catálogo e público próprios. Custou ${fmt(custo)}.`
      : p === 'atendimento' ? `${n.nome} abriu ${n.unidades === 2 ? 'uma segunda sala' : 'uma terceira sala'}, em outro bairro, com gente atendendo lá. Custou ${fmt(custo)}.`
        : `${n.nome} montou ${n.unidades === 2 ? 'uma segunda equipe' : 'uma terceira equipe'} de obra, com encarregado próprio. Custou ${fmt(custo)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true, tom: 'bom' });
  marcar(v, 'promocao', texto, 3, { ocupacaoId: n.ocupacaoId });
}

/** Tirar do caixa o que sobra (deixa uma reserva de uns três meses de conta fixa e folha). */
export function reservaDoCaixa(v: Vida, n: Negocio): number {
  const c = contaDoAno(v, n);
  return Math.round((c.fixo + c.folha) / 4 / 100) * 100;
}

export function retirarDoCaixa(v: Vida): number {
  const n = negocioAberto(v)!;
  const valor = Math.max(0, Math.round(((n.caixa ?? 0) - reservaDoCaixa(v, n)) / 100) * 100);
  n.caixa = (n.caixa ?? 0) - valor;
  v.financas.conta += valor;
  if (valor >= 5000) escrever(v, { texto: `Tirou ${fmt(valor)} do caixa de ${n.nome} para a sua conta.`, relevancia: 'tecnico', tema: 'dinheiro', escolha: true });
  return valor;
}

export function mudarEstrategia(v: Vida, e: EstrategiaNegocio): void {
  const n = negocioAberto(v)!;
  n.estrategia = e;
  v.fatos['negocio_estrategia'] = v.t;
}

/** Vender: o negócio vira dinheiro — e, se era o trabalho de todo dia, o trabalho acaba. */
export function venderNegocio(v: Vida, valor: number): void {
  const n = negocioAberto(v)!;
  const caixa = n.caixa ?? 0;
  for (const f of n.equipe ?? []) { const vin = v.vinculos[f.pessoaId]; if (vin) { vin.ambiente = undefined; vin.convivio = vin.convivio.filter(c => c !== 'trabalho'); } }
  n.equipe = [];
  n.caixa = 0;
  v.financas.conta += valor + caixa;
  n.estado = 'fechado';
  n.tFim = v.t;
  const anos = Math.max(1, Math.round((v.t - n.tInicio) / 12));
  const socio = n.socioId && v.pessoas[n.socioId] ? ` ${v.pessoas[n.socioId].nome} vendeu a parte dele junto.`.replace(' dele ', v.pessoas[n.socioId].genero === 'feminino' ? ' dela ' : ' dele ') : '';
  const texto = `Vendeu ${n.nome} depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}, por ${fmt(valor)}.${socio}${tamanhoDaEquipe(n) ? '' : ''} A equipe ficou com o novo dono.`;
  if (v.trabalho.atual?.ocupacaoId === n.ocupacaoId) encerrarEmprego(v, 'vendeu o negócio');
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'negocio_fechado', texto, 3, { ocupacaoId: n.ocupacaoId });
}

export function fecharNegocio(v: Vida, motivo: string): void {
  const n = v.caminhos.negocio;
  if (!n || n.estado === 'fechado') return;
  n.estado = 'fechado';
  n.tFim = v.t;
  const anos = Math.max(1, Math.round((v.t - n.tInicio) / 12));
  // O que se recupera: equipamento e estoque vendidos a preço de ocasião, mais o que havia no caixa.
  const recupera = Math.round(n.capital * 0.25 * (1 - parteDoSocio(n)) / 100) * 100;
  const caixa = Math.max(0, n.caixa ?? 0);
  n.caixa = 0;
  v.financas.conta += recupera + caixa;
  for (const f of n.equipe ?? []) desligar(v, f, 'fechou');
  const demitidos = (n.equipe ?? []).map(f => v.pessoas[f.pessoaId]?.nome).filter(Boolean);
  n.equipe = [];
  const perdeu = (n.acumulado ?? 0) < -n.capital * 0.3;
  const p = presencaDe(n);
  const oque = p === 'online' ? 'saiu do ar' : p === 'obra' ? 'encerrou as atividades' : 'fechou as portas';
  const texto = `${n.nome} ${oque} depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}: ${motivo}.${recupera > 0 ? ` A venda ${p === 'online' ? 'do estoque' : 'dos equipamentos'} rendeu ${fmt(recupera)}.` : ''}${demitidos.length ? ` ${demitidos.length === 1 ? `${demitidos[0]} ficou` : `${demitidos.length} pessoas ficaram`} sem o emprego.` : ''}`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'negocio_fechado', texto, 3, { ocupacaoId: n.ocupacaoId });
  if (n.socioId && v.vinculos[n.socioId]) { const vin = v.vinculos[n.socioId]; vin.ambiente = undefined; vin.convivio = vin.convivio.filter(c => c !== 'trabalho'); lembrarCom(v, n.socioId, `O fim de ${n.nome}, que era dos dois.`, 'trabalho', 2); }
  // O fracasso ensina: quem tenta de novo começa sabendo mais.
  if (!/você foi seguir outro caminho/.test(motivo)) v.fatos['negocio_aprendizado'] = (v.fatos['negocio_aprendizado'] ?? 0) + 1;
  if (perdeu) {
    const par = parceiro(v);
    if (par) { par.vin.tensao = clamp(par.vin.tensao + 10); lembrarCom(v, par.p.id, `O dinheiro que se foi com ${n.nome}.`, 'conflito', 2); }
    abalar(v, `o fim de ${n.nome}`, -8, 8);
  }
}

/* ------------------------------------------------------------ Sócio */

/** Comprar a parte do sócio: o negócio fica todo seu. */
export function comprarParteDoSocio(v: Vida): number {
  const n = negocioAberto(v)!;
  const s = n.socioId ? v.pessoas[n.socioId] : undefined;
  const preco = Math.round(valorInteiro(v, n) * parteDoSocio(n) / 1000) * 1000;
  pagar(v, preco);
  const nome = s?.nome ?? 'o sócio';
  n.socioId = undefined;
  n.parteSocio = undefined;
  escrever(v, { texto: `Comprou a parte de ${nome} em ${n.nome} por ${fmt(preco)}: o negócio passou a ser todo seu.`, relevancia: 'marco', tema: 'trabalho', escolha: true, pessoas: s ? [s.id] : undefined });
  if (s && v.vinculos[s.id]) { lembrarCom(v, s.id, `Vendeu para você a parte em ${n.nome}.`, 'trabalho', 2); v.vinculos[s.id].ambiente = undefined; v.vinculos[s.id].convivio = v.vinculos[s.id].convivio.filter(c => c !== 'trabalho'); }
  marcar(v, 'promocao', `${n.nome} ficou todo seu.`, 2, { ocupacaoId: n.ocupacaoId });
  return preco;
}

/** Preço da parte do sócio hoje. */
export const precoDaParteDoSocio = (v: Vida, n: Negocio) => Math.round(valorInteiro(v, n) * parteDoSocio(n) / 1000) * 1000;

/* ---------------------------------------------------------- Leitura */

/** Tipos de negócio ao alcance agora (para a interface e as estratégias). */
export function negociosPossiveis(v: Vida): { t: TipoNegocio; veredito: Veredito; custo: number }[] {
  return NEGOCIOS.map(t => ({ t, veredito: podeAbrirNegocio(v, t.id), custo: custoLocal(v, t) }));
}

/** O negócio em palavras (movimento, caixa, gente, nome), no idioma do ofício. */
export function leituraDoNegocio(v: Vida, n: Negocio): { movimento: string; caixa: string; gente: string; reputacao: string; medidor: string; palavra: string; dedicacao: string } {
  const pal = PALAVRAS[presencaDe(n)];
  const c = n.clientela;
  const teto = tetoDoMovimento(n);
  const k = faixa(c);
  const limite = c >= teto - 2 && teto < 100 ? ` ${pal.limite[tamanhoDaEquipe(n) === 0 ? 0 : 1]}` : '';
  const r = n.resultadoAno;
  const paralela = dedicacaoDe(n) === 'paralela';
  const caixa = r === undefined ? 'Ainda sem um ano fechado.' : r < 0 ? `O último ano fechou no vermelho (${fmt(-r)}).` : r < 3000 ? 'O último ano empatou, mais ou menos.' : paralela ? `O último ano sobrou ${fmt(r)} no caixa.` : `O último ano sobrou ${fmt(r)} depois da sua retirada.`;
  const eq = tamanhoDaEquipe(n);
  const gente = eq === 0 ? (paralela ? (n.socioId && v.pessoas[n.socioId] ? `${v.pessoas[n.socioId].nome} toca o dia a dia; você, as horas vagas.` : 'Só você, nas horas vagas.') : 'Só você toca tudo.') : eq === 1 ? `Você e ${v.pessoas[n.equipe![0].pessoaId]?.nome ?? 'mais uma pessoa'}.` : `Você e mais ${eq} pessoas.`;
  const rep = n.reputacao ?? 40;
  const reputacao = pal.reputacao[rep < 30 ? 0 : rep < 55 ? 1 : rep < 75 ? 2 : 3];
  const dedicacao = n.passivo ? 'nas mãos da equipe (você está afastado)' : paralela ? 'nas horas vagas' : 'o trabalho de todo dia';
  return { movimento: pal.frases[k] + limite, caixa, gente, reputacao, medidor: pal.medidor, palavra: pal.niveis[k], dedicacao };
}

export { nomeOcupacao, type Ocupacao };
