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
 *   O ANO — o movimento (freguesia, 0..100) cresce com o ofício, a estrada,
 *   a reputação, a equipe e o jeito de vender; míngua na crise. A margem do
 *   ano cresce MAIS depressa que a retirada do dono: com a casa vazia, o
 *   negócio não paga nem quem o toca; com a casa cheia, sobra. O que sobra
 *   fica no CAIXA do negócio (não é o seu dinheiro: retirar é decisão); o que
 *   falta sai do caixa e, quando ele acaba, do seu bolso.
 *
 *   CRESCER — contratar (gente de verdade, que entra na sua vida), ampliar o
 *   ponto, abrir outra unidade, trazer um sócio, mudar o jeito de vender.
 *   Cada passo aumenta o que o negócio pode render E o que ele custa: crescer
 *   com a casa meio vazia afunda mais rápido. Vender, fechar, demitir — tudo
 *   tem gente e história do outro lado.
 *
 * Não é simulador contábil: margem, custo fixo e folha são três números, e a
 * tela fala em palavras.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Funcionario, Negocio, Vida } from '../tipos';
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

export interface TipoNegocio {
  id: string;
  nome: string;
  ocupacaoId: string;
  capital: number;
  /** Estrada que conta (meses) na trilha — ou o ofício equivalente. */
  trilhas: string[];
  meses: number;
  dominio?: Dominio;
  habilidade?: number;
  /** Registro profissional exigido (consultório, escritório de profissão regulamentada). */
  licenca?: string;
  /** O que faz quem trabalha nele [masculino, feminino]. */
  funcoes: [string, string][];
  /** Salário de quem trabalha nele, em salários mínimos. */
  folha: number;
  /** Dá para começar pequeno, em casa. */
  emCasa?: boolean;
}

export const NEGOCIOS: readonly TipoNegocio[] = [
  { id: 'salao', nome: 'um salão', ocupacaoId: 'dono_salao', capital: 12000, trilhas: ['beleza'], meses: 24, dominio: 'beleza', habilidade: 55, funcoes: [['cabeleireiro', 'cabeleireira'], ['manicure', 'manicure'], ['auxiliar de salão', 'auxiliar de salão']], folha: 1.3, emCasa: true },
  { id: 'oficina', nome: 'uma oficina', ocupacaoId: 'dono_oficina', capital: 25000, trilhas: ['mecanica', 'manutencao'], meses: 36, dominio: 'manual', habilidade: 62, funcoes: [['mecânico', 'mecânica'], ['ajudante de oficina', 'ajudante de oficina']], folha: 1.5 },
  { id: 'lanchonete', nome: 'uma lanchonete', ocupacaoId: 'dono_lanchonete', capital: 20000, trilhas: ['alimentacao', 'confeitaria'], meses: 12, dominio: 'cozinha', habilidade: 52, funcoes: [['atendente', 'atendente'], ['ajudante de cozinha', 'ajudante de cozinha'], ['chapeiro', 'chapeira']], folha: 1.15, emCasa: true },
  { id: 'comercio', nome: 'um comércio', ocupacaoId: 'dono_comercio', capital: 30000, trilhas: ['comercio', 'vendas'], meses: 24, dominio: 'vendas', habilidade: 52, funcoes: [['atendente', 'atendente'], ['caixa', 'caixa'], ['repositor', 'repositora']], folha: 1.15 },
  { id: 'loja_online', nome: 'uma loja on-line', ocupacaoId: 'dono_loja_online', capital: 9000, trilhas: ['comercio', 'vendas', 'informal', 'conteudo'], meses: 12, dominio: 'vendas', habilidade: 48, funcoes: [['ajudante de expedição', 'ajudante de expedição'], ['atendente on-line', 'atendente on-line']], folha: 1.2, emCasa: true },
  { id: 'empreiteira', nome: 'uma empreiteira', ocupacaoId: 'empreiteiro', capital: 22000, trilhas: ['construcao'], meses: 72, funcoes: [['pedreiro', 'pedreira'], ['servente', 'servente'], ['eletricista', 'eletricista']], folha: 1.6 },
  { id: 'marcenaria', nome: 'uma marcenaria', ocupacaoId: 'dono_marcenaria', capital: 28000, trilhas: ['marcenaria'], meses: 48, dominio: 'manual', habilidade: 66, funcoes: [['marceneiro', 'marceneira'], ['ajudante de marcenaria', 'ajudante de marcenaria']], folha: 1.6 },
  { id: 'estudio', nome: 'um estúdio de foto e vídeo', ocupacaoId: 'dono_estudio', capital: 26000, trilhas: ['imagem', 'conteudo'], meses: 36, dominio: 'fotografia', habilidade: 66, funcoes: [['assistente de estúdio', 'assistente de estúdio'], ['editor de vídeo', 'editora de vídeo']], folha: 1.8, emCasa: true },
  { id: 'consultoria_ti', nome: 'uma consultoria de tecnologia', ocupacaoId: 'consultor_ti', capital: 12000, trilhas: ['ti', 'dados'], meses: 60, funcoes: [['desenvolvedor', 'desenvolvedora'], ['analista de sistemas', 'analista de sistemas']], folha: 3.2, emCasa: true },
  { id: 'escritorio_contabil', nome: 'um escritório de contabilidade', ocupacaoId: 'contador_socio', capital: 15000, trilhas: ['contabil'], meses: 60, licenca: 'crc', funcoes: [['assistente contábil', 'assistente contábil'], ['auxiliar de escritório', 'auxiliar de escritório']], folha: 1.7 },
  { id: 'consultorio_psicologia', nome: 'um consultório de psicologia', ocupacaoId: 'psicologo_clinico', capital: 14000, trilhas: ['psicologia'], meses: 36, licenca: 'crp', funcoes: [['secretário', 'secretária']], folha: 1.3 },
  { id: 'clinica_fisio', nome: 'uma clínica de fisioterapia', ocupacaoId: 'fisio_clinica', capital: 45000, trilhas: ['fisioterapia'], meses: 48, licenca: 'crefito', funcoes: [['fisioterapeuta', 'fisioterapeuta'], ['recepcionista', 'recepcionista']], folha: 2.2 },
  { id: 'clinica_vet', nome: 'uma clínica veterinária', ocupacaoId: 'veterinario_clinica', capital: 60000, trilhas: ['veterinaria'], meses: 48, licenca: 'crmv', funcoes: [['auxiliar veterinário', 'auxiliar veterinária'], ['recepcionista', 'recepcionista'], ['veterinário', 'veterinária']], folha: 1.9 }
];

export const tipoNegocio = (id: string) => NEGOCIOS.find(n => n.id === id);
export const tipoDoNegocio = (n: Negocio) => tipoNegocio(n.tipo);

export const custoLocal = (v: Vida, t: TipoNegocio) => Math.round(t.capital * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

/** O negócio aberto (e o emprego de dono dele), quando há. */
export function negocioAtivo(v: Vida): Negocio | undefined {
  const n = v.caminhos.negocio;
  if (!n || n.estado === 'fechado') return undefined;
  return v.trabalho.atual?.ocupacaoId === n.ocupacaoId ? n : undefined;
}

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
  const custo = custoLocal(v, t);
  const tem = disponivel(v);
  const cabe = tem >= custo || (t.emCasa && tem >= custo * 0.4) || emprestimoPossivel(v, custo - Math.min(tem, custo * 0.3));
  if (!cabe) return bloqueio('requisito', `Para começar, uns ${fmt(custo)} (ponto, equipamento, primeiro estoque)${t.emCasa ? ` — ou uns ${fmt(Math.round(custo * 0.4 / 100) * 100)} começando pequeno, em casa` : ''}.`);
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

export interface OpcoesAbertura { modo?: ModoAbertura; socioId?: string }

export function abrirNegocio(v: Vida, r: Rng, id: string, opcoes: OpcoesAbertura | string = {}): Negocio {
  const op: OpcoesAbertura = typeof opcoes === 'string' ? { socioId: opcoes, modo: 'socio' } : opcoes;
  const t = tipoNegocio(id)!;
  const cheio = custoLocal(v, t);
  const pequeno = op.modo === 'pequeno' && !!t.emCasa;
  const custo = pequeno ? Math.round(cheio * 0.4 / 100) * 100 : cheio;
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
  const e = contratar(v, r, oc, 'negocio');
  const aprendeu = Math.min(2, v.fatos['negocio_aprendizado'] ?? 0);
  let clientela = 10 + estrada / 10 + (t.dominio ? oficio / 6 : 0) + aprendeu * 5;
  if (semEstrada) clientela *= 0.6;
  e.clientela = Math.round(clamp(clientela, 5, 40));
  const n: Negocio = {
    tipo: t.id, nome: nomeDoNegocio(v, t), ocupacaoId: oc.id, tInicio: v.t, capital: custo, clientela: e.clientela, estado: 'comecando', anosNoVermelho: 0,
    socioId: op.socioId, caixa: 0, porte: 1, unidades: 1, equipe: [], reputacao: Math.round(30 + aprendeu * 5), semEstrada: semEstrada || undefined, dividaId, emCasa: pequeno || undefined, historico: []
  };
  v.caminhos.negocio = n;
  e.empregador = n.nome;
  e.salario = rendaDeClientela(v, oc, e.clientela);
  const como = pequeno ? ', começando pequeno, em casa' : op.modo === 'emprestimo' ? ', com um empréstimo do banco' : '';
  const texto = `Abriu ${t.nome}${op.socioId && v.pessoas[op.socioId] ? ` com ${v.pessoas[op.socioId].nome}` : ''}${como}: ${n.nome}, em ${municipio(v.moradia.municipioId).nome}. ${op.modo === 'emprestimo' ? `A dívida: ${fmt(v.financas.dividas.find(d => d.id === dividaId)!.saldo)}.` : `Pôs ${fmt(custo)} do próprio bolso.`}`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true, pessoas: op.socioId ? [op.socioId] : undefined });
  marcar(v, 'negocio_aberto', texto, 3, { ocupacaoId: oc.id, pessoaId: op.socioId });
  return n;
}

function nomeDoNegocio(v: Vida, t: TipoNegocio): string {
  const nome = v.eu.nome;
  const sob = v.eu.sobrenome;
  return ({ salao: `Salão ${nome}`, oficina: `Auto Mecânica ${nome}`, lanchonete: `Lanchonete da ${v.eu.genero === 'feminino' ? nome : 'Esquina'}`, comercio: `Empório ${nome}`, loja_online: `Loja ${nome} (on-line)`, empreiteira: `${sob} Construções`, marcenaria: `Marcenaria ${nome}`, estudio: `Estúdio ${nome}`, consultoria_ti: `${sob} Tecnologia`, escritorio_contabil: `${sob} Contabilidade`, consultorio_psicologia: `Consultório de ${nome} ${sob}`, clinica_fisio: `Clínica ${sob} de Fisioterapia`, clinica_vet: `Clínica Veterinária ${nome}` } as Record<string, string>)[t.id] ?? `${t.nome} de ${nome}`;
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
  if (n.emCasa) return 55;
  if (porte === 1) return eq >= 1 ? 100 : 72;
  if (porte === 2) return clamp(38 + eq * 18, 0, 100);
  return clamp(26 + eq * 12, 0, 100);
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

const FATOR_ESTRATEGIA: Record<NonNullable<Negocio['estrategia']>, { margem: number; custo: number; movimento: number; reputacao: number }> = {
  bairro: { margem: 1, custo: 1, movimento: 0, reputacao: 0 },
  qualidade: { margem: 1.12, custo: 1.1, movimento: -1, reputacao: 3 },
  preco: { margem: 0.85, custo: 1, movimento: 3, reputacao: -1 },
  online: { margem: 1, custo: 0.85, movimento: 1.5, reputacao: 0 }
};

export const salarioDaFuncao = (v: Vida, t: TipoNegocio) => Math.round(SALARIO_MINIMO * t.folha * economiaLocal(v.moradia.municipioId).salario / 10) * 10;

/** A conta do ano (em reais por ano): o que o movimento deixa, o que o ponto custa, a folha, a sua retirada. */
export function contaDoAno(v: Vida, n: Negocio): { margem: number; fixo: number; folha: number; retirada: number; resultado: number } {
  const e = v.trabalho.atual!;
  const oc = ocupacao(n.ocupacaoId);
  const ref = salarioLocal(oc, e.municipioId);
  const est = FATOR_ESTRATEGIA[n.estrategia ?? 'bairro'];
  const casa = n.emCasa ? { margem: 0.62, custo: 0.3 } : { margem: 1, custo: 1 };
  const c = n.clientela;
  const margem = ref * (3.7 + 0.176 * c) * escala(n, ESCALA_MARGEM) * est.margem * casa.margem;
  const fixo = n.capital / (n.emCasa ? 0.4 : 1) * 0.2 * escala(n, ESCALA_CUSTO) * est.custo * casa.custo;
  const folha = (n.equipe ?? []).reduce((s, f) => s + f.salario * 13.33 * 1.3, 0);
  const retirada = e.salario * 12;
  const bruto = margem - fixo - folha - retirada;
  const resultado = Math.round(bruto * (n.socioId ? 0.5 : 1) / 100) * 100;
  return { margem: Math.round(margem), fixo: Math.round(fixo), folha: Math.round(folha), retirada: Math.round(retirada), resultado };
}

/** Quanto alguém pagaria pelo negócio hoje. */
export function valorDoNegocio(v: Vida, n: Negocio): number {
  const hist = n.historico ?? [];
  const medio = hist.length ? hist.reduce((s, x) => s + x, 0) / hist.length : (n.resultadoAno ?? 0);
  const estrutura = n.capital * 0.35 * escala(n, ESCALA_CUSTO);
  const rep = 0.6 + (n.reputacao ?? 40) / 100 * 0.8;
  // Na crise, quem compra paga menos.
  const base = Math.max(estrutura, estrutura + Math.max(0, medio) * 2.5) * rep * (emCrise(v) ? 0.75 : 1);
  return Math.round(base * (n.socioId ? 0.5 : 1) / 1000) * 1000;
}

/* ------------------------------------------------------------ O ano */

/** Depois do ano de trabalho: o negócio acompanha a freguesia. Devolve true se abriu a hora de decidir. */
export function processarNegocio(v: Vida, r?: Rng): boolean {
  const n = v.caminhos.negocio;
  if (!n || n.estado === 'fechado') return false;
  const e = v.trabalho.atual;
  if (!e || e.ocupacaoId !== n.ocupacaoId) {
    const ultimo = v.trabalho.historico[v.trabalho.historico.length - 1];
    const motivo = ultimo?.ocupacaoId === n.ocupacaoId && ultimo.motivo === 'falta de clientela' ? 'o movimento não pagou as contas'
      : ultimo?.ocupacaoId === n.ocupacaoId && ultimo.motivo === 'mudança de cidade' ? 'a mudança de cidade levou você para longe do ponto'
        : 'você foi seguir outro caminho';
    fecharNegocio(v, motivo);
    return false;
  }
  n.caixa ??= 0; n.porte ??= 1; n.unidades ??= 1; n.equipe ??= []; n.reputacao ??= 40; n.historico ??= [];
  const anos = (v.t - n.tInicio) / 12;
  const est = FATOR_ESTRATEGIA[n.estrategia ?? 'bairro'];
  const equipe = tamanhoDaEquipe(n);
  const tamanho = (n.porte - 1) + (n.unidades - 1);
  // O que o motor do trabalho já moveu (ofício, estrada, economia) ganha o que é só do negócio.
  let extra = (n.reputacao - 50) / 15 + est.movimento + Math.min(3, equipe) * 0.6 - tamanho * 1.5 + Math.min(2, v.fatos['negocio_aprendizado'] ?? 0);
  if (n.semEstrada && anos < 3) extra -= 3;
  if (emCrise(v)) extra -= 2 + tamanho * 2;
  if (e.ritmo === 'puxado') extra += 2.5;
  if (e.ritmo === 'leve') extra -= equipe >= 2 ? 0.5 : 2;
  e.clientela = Math.round(clamp((e.clientela ?? n.clientela) + extra + (r ? r.normal() * 2 : 0), 0, tetoDoMovimento(n)));
  n.clientela = e.clientela;
  e.salario = rendaDeClientela(v, ocupacao(n.ocupacaoId), e.clientela);
  if (v.fatos['corte_proprio'] !== undefined && v.t - v.fatos['corte_proprio'] <= 12) e.salario = Math.round(e.salario * 0.7 / 10) * 10;

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
      escrever(v, { texto: `O movimento de ${n.nome} não pagou as contas do ano: o caixa acabou e saíram ${fmt(falta)} do seu bolso.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    }
    const par = parceiro(v);
    if (par && falta > n.capital * 0.4) par.vin.tensao = Math.min(100, par.vin.tensao + 6);
  }

  // Reputação: o que se fala dele.
  n.reputacao = Math.round(clamp(n.reputacao + (n.clientela >= 45 ? 2 : n.clientela < 20 ? -2 : 0) + est.reputacao + (resultado < 0 && emCrise(v) ? -2 : 0) - (n.reputacao - 50) / 25, 0, 100));

  if (n.clientela < 20 || resultado < -n.capital * 0.15) { n.anosNoVermelho += 1; n.estado = 'apertado'; }
  else { n.anosNoVermelho = 0; n.estado = n.clientela >= 45 && resultado >= 0 ? 'firme' : 'comecando'; }

  if (n.estado === 'firme' && !v.caminhos.marcas.some(m => m.tipo === 'conquista' && m.ocupacaoId === n.ocupacaoId)) {
    const texto = `${n.nome} firmou: freguesia certa, contas em dia.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 2, { ocupacaoId: n.ocupacaoId });
  }
  if (r) { anoDaEquipe(v, r, n); tombo(v, r, n); }
  return n.anosNoVermelho >= 2;
}

const emCrise = (v: Vida) => v.economia?.fase === 'crise';

/**
 * O que derruba negócio de verdade (e derruba mais o que é maior): um
 * concorrente grande na mesma rua, dinheiro que some na mão de quem cuidava
 * de um dos pontos, um assalto, uma obra que fecha a rua. Acontece — não é
 * escolha; a reação (insistir, enxugar, vender) é.
 */
function tombo(v: Vida, r: Rng, n: Negocio): void {
  const tamanho = (n.porte ?? 1) - 1 + (n.unidades ?? 1) - 1;
  const chance = 0.04 + tamanho * 0.05 + (emCrise(v) ? 0.06 : 0);
  if (!r.chance(chance)) return;
  const tipo = r.pick([...(tamanho > 0 ? ['desvio'] : []), 'concorrente', 'assalto', 'obra']);
  const perda = Math.round(n.capital * (tipo === 'desvio' ? 0.25 : tipo === 'assalto' ? 0.08 : 0.05) / 100) * 100;
  const queda = tipo === 'concorrente' ? 14 + tamanho * 4 : tipo === 'obra' ? 8 : tipo === 'desvio' ? 6 : 3;
  n.clientela = Math.max(0, n.clientela - queda);
  if (v.trabalho.atual) v.trabalho.atual.clientela = n.clientela;
  pagarPeloCaixa(v, n, perda);
  n.reputacao = clamp((n.reputacao ?? 40) - (tipo === 'desvio' ? 4 : 2));
  const texto = { desvio: `Quem cuidava de um dos pontos de ${n.nome} desviou dinheiro durante meses. Quando você descobriu, faltavam ${fmt(perda)}.`, concorrente: `Uma rede grande abriu a duas quadras de ${n.nome}, com preço que você não consegue cobrir.`, assalto: `${n.nome} foi assaltado num sábado à noite. Levaram o caixa e parte do equipamento.`, obra: `Uma obra fechou a rua de ${n.nome} por meses. A freguesia foi para outro lugar.` }[tipo]!;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  abalar(v, tipo === 'desvio' ? 'o dinheiro desviado do negócio' : 'o golpe no negócio', -4, 6);
}

/** Quem trabalha para você também vive: pede para sair, cresce junto, conta que vai ter filho. */
function anoDaEquipe(v: Vida, r: Rng, n: Negocio): void {
  for (const f of [...(n.equipe ?? [])]) {
    const p = v.pessoas[f.pessoaId];
    if (!p || !p.vivo) { n.equipe = n.equipe!.filter(x => x !== f); continue; }
    const anos = (v.t - f.tInicio) / 12;
    const sai = (n.estado === 'apertado' ? 0.14 : 0.06) + (anos >= 5 ? 0.04 : 0);
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

const em = (nome: string) => `n${/^(Lanchonete|Loja|Marcenaria|Clínica|Auto)/.test(nome) ? 'a' : 'o'} ${nome}`;

/* ------------------------------------------------------ Gente e porte */

/** Uma pessoa nova entra para trabalhar no negócio (e na sua vida). */
export function contratarFuncionario(v: Vida, r: Rng, perfil: 'indicacao' | 'experiente' | 'jovem', indicadoPor?: string): Funcionario | undefined {
  const n = negocioAtivo(v);
  const t = n && tipoDoNegocio(n);
  if (!n || !t) return undefined;
  const i = idade(v);
  const idadeP = perfil === 'jovem' ? r.int(18, 22) : perfil === 'experiente' ? r.int(30, 52) : r.int(20, 45);
  const p = criarPessoa(v, r, { idade: idadeP, municipioId: v.moradia.municipioId });
  const [m, fem] = r.pick(t.funcoes);
  const funcao = p.genero === 'feminino' ? fem : m;
  const salario = Math.round(salarioDaFuncao(v, t) * (perfil === 'experiente' ? 1.35 : perfil === 'jovem' ? 0.85 : 1) / 10) * 10;
  p.ocupacao = funcao;
  p.renda = Math.round(salario * 0.9);
  const vin = vincular(v, p, { origem: 'trabalho', proximidade: perfil === 'indicacao' ? 22 : 12, convivio: ['trabalho'], estagio: 'colega' });
  vin.ambiente = `trabalho:${v.trabalho.atual!.empregador}:${v.trabalho.atual!.tInicio}`;
  const f: Funcionario = { pessoaId: p.id, tInicio: v.t, funcao, salario };
  (n.equipe ??= []).push(f);
  const quem = indicadoPor && v.pessoas[indicadoPor] ? `, por indicação de ${v.pessoas[indicadoPor].nome}` : '';
  const texto = `${p.nome} começou a trabalhar ${em(n.nome)}, como ${funcao}${quem}.${perfil === 'jovem' ? ` Primeiro emprego ${p.genero === 'feminino' ? 'dela' : 'dele'}.` : ''}`;
  escrever(v, { texto, relevancia: tamanhoDaEquipe(n) === 1 ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, pessoas: [p.id] });
  if (tamanhoDaEquipe(n) === 1) marcar(v, 'lideranca', `Contratou a primeira pessoa ${em(n.nome)}: ${p.nome}.`, 2, { ocupacaoId: n.ocupacaoId, pessoaId: p.id });
  // Quem entra ainda aprende: no primeiro ano, rende menos.
  if (perfil === 'jovem') n.clientela = Math.max(0, n.clientela - 2);
  void i;
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
  const n = negocioAtivo(v);
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
const cabeNoCaixaEBolso = (v: Vida, n: Negocio, valor: number) => (n.caixa ?? 0) + disponivel(v) >= valor;

export function podeAmpliar(v: Vida): Veredito {
  const n = negocioAtivo(v);
  if (!n) return bloqueio('impossivel', 'Não há negócio.');
  if (n.emCasa) return (n.clientela >= 45 ? { grau: 'permitido' } : bloqueio('requisito', 'Primeiro, a freguesia de casa precisa pedir mais espaço.')) as Veredito;
  if ((n.porte ?? 1) >= 3) return bloqueio('impossivel', 'Já é do maior tamanho que um negócio assim costuma ter.');
  if (n.clientela < 60) return bloqueio('requisito', 'Com a casa ainda meio vazia, crescer só aumenta a conta.');
  const custo = custoDeAmpliar(v, n);
  if (!cabeNoCaixaEBolso(v, n, custo)) return bloqueio('requisito', `Ampliar custa uns ${fmt(custo)} (entre o caixa e o seu bolso, não há).`);
  return { grau: 'permitido' };
}

export function ampliar(v: Vida): void {
  const n = negocioAtivo(v)!;
  if (n.emCasa) {
    // Sair de casa para um ponto: o custo de um ponto pequeno.
    const custo = Math.round(custoLocal(v, tipoDoNegocio(n)!) * 0.6 / 100) * 100;
    pagarPeloCaixa(v, n, custo);
    n.capital += custo;
    n.emCasa = undefined;
    n.clientela = Math.round(n.clientela * 0.8);
    v.trabalho.atual!.clientela = n.clientela;
    escrever(v, { texto: `${n.nome} saiu de casa: um ponto de verdade, com porta para a rua. Custou ${fmt(custo)}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
    marcar(v, 'promocao', `${n.nome} ganhou um ponto próprio.`, 2, { ocupacaoId: n.ocupacaoId });
    return;
  }
  const custo = custoDeAmpliar(v, n);
  pagarPeloCaixa(v, n, custo);
  n.capital += custo;
  n.porte = ((n.porte ?? 1) + 1) as 2 | 3;
  // O lugar maior começa com cadeira vazia.
  n.clientela = Math.round(n.clientela * 0.6);
  v.trabalho.atual!.clientela = n.clientela;
  const texto = n.porte === 2 ? `Ampliou ${n.nome}: o ponto ao lado, mais espaço, mais conta. Custou ${fmt(custo)}.` : `${n.nome} virou um negócio grande: outro andar, outro tamanho. Custou ${fmt(custo)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'promocao', texto, 3, { ocupacaoId: n.ocupacaoId });
}

export function podeAbrirUnidade(v: Vida): Veredito {
  const n = negocioAtivo(v);
  if (!n) return bloqueio('impossivel', 'Não há negócio.');
  if (n.emCasa) return bloqueio('impossivel', 'Primeiro, um ponto de verdade.');
  if ((n.unidades ?? 1) >= 3) return bloqueio('impossivel', 'Três pontos já é o que uma pessoa consegue acompanhar.');
  if (n.estado !== 'firme' || n.clientela < 65 || (n.reputacao ?? 0) < 55) return bloqueio('requisito', 'Outra unidade pede o primeiro ponto firme, cheio e com nome na cidade.');
  if (tamanhoDaEquipe(n) < 1) return bloqueio('requisito', 'Sem ninguém de confiança para tocar um dos pontos, não dá para estar nos dois.');
  const custo = custoDeUnidade(v, n);
  if (!cabeNoCaixaEBolso(v, n, custo)) return bloqueio('requisito', `Outra unidade custa uns ${fmt(custo)}.`);
  return { grau: 'improvavel', chance: 0.5, motivo: 'Duas casas dobram o que pode dar certo — e o que pode dar errado.' };
}

export function abrirUnidade(v: Vida): void {
  const n = negocioAtivo(v)!;
  const custo = custoDeUnidade(v, n);
  pagarPeloCaixa(v, n, custo);
  n.capital += custo;
  n.unidades = (n.unidades ?? 1) + 1;
  n.clientela = Math.round(n.clientela * 0.75);
  v.trabalho.atual!.clientela = n.clientela;
  const texto = `${n.nome} abriu a ${n.unidades === 2 ? 'segunda' : 'terceira'} unidade, em outro bairro de ${municipio(v.moradia.municipioId).nome}. Custou ${fmt(custo)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true, tom: 'bom' });
  marcar(v, 'promocao', texto, 3, { ocupacaoId: n.ocupacaoId });
}

/** Tirar do caixa o que sobra (deixa uma reserva de uns três meses de conta fixa e folha). */
export function reservaDoCaixa(v: Vida, n: Negocio): number {
  const c = contaDoAno(v, n);
  return Math.round((c.fixo + c.folha) / 4 / 100) * 100;
}

export function retirarDoCaixa(v: Vida): number {
  const n = negocioAtivo(v)!;
  const valor = Math.max(0, Math.round(((n.caixa ?? 0) - reservaDoCaixa(v, n)) / 100) * 100);
  n.caixa = (n.caixa ?? 0) - valor;
  v.financas.conta += valor;
  if (valor >= 5000) escrever(v, { texto: `Tirou ${fmt(valor)} do caixa de ${n.nome} para a sua conta.`, relevancia: 'tecnico', tema: 'dinheiro', escolha: true });
  return valor;
}

export function mudarEstrategia(v: Vida, e: NonNullable<Negocio['estrategia']>): void {
  const n = negocioAtivo(v)!;
  n.estrategia = e;
  v.fatos['negocio_estrategia'] = v.t;
}

/** Vender: o negócio vira dinheiro — e o trabalho acaba. */
export function venderNegocio(v: Vida, valor: number): void {
  const n = negocioAtivo(v)!;
  const caixa = n.caixa ?? 0;
  for (const f of n.equipe ?? []) { const vin = v.vinculos[f.pessoaId]; if (vin) { vin.ambiente = undefined; vin.convivio = vin.convivio.filter(c => c !== 'trabalho'); } }
  n.equipe = [];
  n.caixa = 0;
  v.financas.conta += valor + caixa;
  n.estado = 'fechado';
  n.tFim = v.t;
  const anos = Math.max(1, Math.round((v.t - n.tInicio) / 12));
  const texto = `Vendeu ${n.nome} depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}, por ${fmt(valor)}. A equipe ficou com o novo dono.`;
  encerrarEmprego(v, 'vendeu o negócio');
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
  const recupera = Math.round(n.capital * 0.25 * (n.socioId ? 0.5 : 1) / 100) * 100;
  const caixa = Math.max(0, n.caixa ?? 0);
  n.caixa = 0;
  v.financas.conta += recupera + caixa;
  for (const f of n.equipe ?? []) desligar(v, f, 'fechou');
  const demitidos = (n.equipe ?? []).map(f => v.pessoas[f.pessoaId]?.nome).filter(Boolean);
  n.equipe = [];
  const perdeu = (n.acumulado ?? 0) < -n.capital * 0.3;
  const texto = `${n.nome} fechou as portas depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}: ${motivo}.${recupera > 0 ? ` A venda dos equipamentos rendeu ${fmt(recupera)}.` : ''}${demitidos.length ? ` ${demitidos.length === 1 ? `${demitidos[0]} ficou` : `${demitidos.length} pessoas ficaram`} sem o emprego.` : ''}`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'negocio_fechado', texto, 3, { ocupacaoId: n.ocupacaoId });
  // O fracasso ensina: quem tenta de novo começa sabendo mais.
  if (motivo !== 'você foi seguir outro caminho') v.fatos['negocio_aprendizado'] = (v.fatos['negocio_aprendizado'] ?? 0) + 1;
  if (perdeu) {
    const par = parceiro(v);
    if (par) { par.vin.tensao = clamp(par.vin.tensao + 10); lembrarCom(v, par.p.id, `O dinheiro que se foi com ${n.nome}.`, 'conflito', 2); }
    abalar(v, `o fim de ${n.nome}`, -8, 8);
  }
}

/** Tipos de negócio ao alcance agora (para a interface e as estratégias). */
export function negociosPossiveis(v: Vida): { t: TipoNegocio; veredito: Veredito; custo: number }[] {
  return NEGOCIOS.map(t => ({ t, veredito: podeAbrirNegocio(v, t.id), custo: custoLocal(v, t) }));
}

/** O negócio em palavras (movimento, caixa, gente). */
export function leituraDoNegocio(v: Vida, n: Negocio): { movimento: string; caixa: string; gente: string; reputacao: string } {
  const c = n.clientela;
  const teto = tetoDoMovimento(n);
  const movimento = c < 20 ? 'Pouco movimento: tem dia em que quase ninguém entra.' : c < 45 ? 'O movimento vem crescendo, mas ainda oscila.' : c < 70 ? 'Freguesia certa: a casa enche nos dias bons.' : 'Casa cheia: tem fila, tem cliente esperando.';
  const limite = c >= teto - 2 && teto < 100 ? (tamanhoDaEquipe(n) === 0 ? ' Sozinho, não dá para atender mais.' : ' Com a equipe que há, não dá para atender mais.') : '';
  const r = n.resultadoAno;
  const caixa = r === undefined ? 'Ainda sem um ano fechado.' : r < 0 ? `O último ano fechou no vermelho (${fmt(-r)}).` : r < 3000 ? 'O último ano empatou, mais ou menos.' : `O último ano sobrou ${fmt(r)} depois da sua retirada.`;
  const eq = tamanhoDaEquipe(n);
  const gente = eq === 0 ? 'Só você toca tudo.' : eq === 1 ? `Você e ${v.pessoas[n.equipe![0].pessoaId]?.nome ?? 'mais uma pessoa'}.` : `Você e mais ${eq} pessoas.`;
  const rep = n.reputacao ?? 40;
  const reputacao = rep < 30 ? 'Pouca gente conhece.' : rep < 55 ? 'Conhecido no bairro.' : rep < 75 ? 'Tem nome na cidade.' : 'Referência: gente vem de longe.';
  return { movimento: movimento + limite, caixa, gente, reputacao };
}

export { nomeOcupacao, type Ocupacao };
