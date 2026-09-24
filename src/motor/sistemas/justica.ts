/**
 * Justiça, na medida mínima que uma vida precisa.
 *
 *   descoberta → processo (defesa pública ou particular; às vezes preso
 *   enquanto espera) → sentença: absolvição, pena alternativa (prestação de
 *   serviços) ou prisão → o regime fecha e depois abre (semiaberto) →
 *   remição (estudar e trabalhar encurtam a pena) → saída → antecedentes.
 *
 * Adolescente não tem "pena": o ECA (Lei 8.069/1990) prevê medidas
 * socioeducativas, e ato infracional NÃO gera antecedente criminal na vida
 * adulta. Não é um simulador jurídico: a sentença é abstrata e nada aqui
 * descreve como se comete, se esconde ou se foge de coisa alguma.
 *
 * O que a prisão MUDA é o que importa: o tempo (anos que não voltam), o
 * trabalho (o emprego acaba; o registro fica), as pessoas (quem espera,
 * quem vai embora), o dinheiro (nenhuma renda, as dívidas seguem), a saúde e
 * a cabeça, e as portas depois — algumas fecham de vez (segurança pública,
 * Forças Armadas), outras pesam por anos (a carteira assinada) e outras
 * continuam abertas (trabalhar por conta, estudar, um programa de egressos).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CategoriaIlicita, Justica, Vida } from '../tipos';
import { escrever, filhos, idade, lembrarCom, marcarFato, pais, parceiro, vinculosVivos } from '../nucleo';
import { marcar } from './marcas';
import { abalar } from './abalo';
import { disponivel, pagar } from './dinheiro';
import { encerrarEmprego } from './trabalho';
import { flex, ge } from '../texto';
import { anoDe } from '../tempo';
import { terminar } from './romance';
import { novaOportunidade } from './oportunidades';

export const garantirJustica = (v: Vida): Justica => (v.justica ??= { antecedentes: [] });

/** Condenação na vida adulta (o que a investigação social de um concurso encontra). */
export const antecedenteAdulto = (v: Vida) => !!v.justica?.antecedentes.some(a => a.desfecho === 'prisao' || a.desfecho === 'alternativa');
export const reincidente = (v: Vida) => (v.justica?.antecedentes.filter(a => a.desfecho === 'prisao' || a.desfecho === 'alternativa').length ?? 0) >= 1;
export const preso = (v: Vida) => !!v.justica?.prisao;
export const presoFechado = (v: Vida) => v.justica?.prisao?.regime === 'fechado';

/**
 * O quanto a ficha pesa numa contratação com carteira. Pesa muito logo
 * depois da saída e vai pesando menos: quem contrata olha o tempo que passou
 * e o que a pessoa fez desde então.
 */
export function penaDeAntecedentes(v: Vida): number {
  const j = v.justica;
  if (!j) return 0;
  const conden = j.antecedentes.filter(a => a.desfecho === 'prisao' || a.desfecho === 'alternativa');
  if (!conden.length) return 0;
  const ultima = Math.max(...conden.map(a => a.t), j.tSaida ?? 0);
  const anos = (v.t - ultima) / 12;
  const base = conden.some(a => a.desfecho === 'prisao') ? 0.2 : 0.1;
  const tempo = anos < 3 ? 1 : anos < 8 ? 0.55 : 0.2;
  // Estudo e trabalho depois da saída contam a favor.
  const reconstruiu = v.educacao.concluidos.some(c => c.tFim > ultima) || v.trabalho.historico.some(h => h.tInicio > ultima && h.tFim - h.tInicio >= 24) ? 0.6 : 1;
  return base * tempo * reconstruiu * (conden.length > 1 ? 1.4 : 1);
}

const NOME_CATEGORIA: Record<CategoriaIlicita, string> = {
  pequenos: 'coisas erradas com a turma', patrimonial: 'receptação de mercadoria de origem ilegal', fraude: 'fraude', mercado: 'comércio ilegal', grupo: 'envolvimento com um grupo criminoso'
};

/* ------------------------------------------------------------- Descoberta */

/**
 * A descoberta abre o processo. Adolescente: medida socioeducativa. Adulto:
 * processo, com a defesa que der para pagar; nos casos mais graves, a
 * espera pode ser presa.
 */
export function abrirProcesso(v: Vida, r: Rng, categoria: CategoriaIlicita): void {
  const j = garantirJustica(v);
  const i = idade(v);
  const env = v.caminhos.envolvimento;
  if (env) { env.parou = env.parou ?? v.t; env.exposicao = 0; }
  if (i < 18) { medidaSocioeducativa(v, r, categoria); return; }
  if (j.processo || j.prisao) return;
  const particular = disponivel(v) >= 18000;
  if (particular) pagar(v, Math.round(clamp(disponivel(v) * 0.25, 12000, 45000) / 100) * 100);
  j.processo = { tInicio: v.t, tJulgamento: v.t + r.int(10, 24), categoria, defesa: particular ? 'particular' : 'publica' };
  const e = v.trabalho.atual;
  // Fraude descoberta no emprego: justa causa, sem multa nem seguro.
  if (categoria === 'fraude' && e) {
    encerrarEmprego(v, 'justa causa');
    escrever(v, { texto: `Descobriram o esquema em ${e.empregador}. Saiu por justa causa, sem acerto — e com um processo pela frente.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'demissao', 'Demitido por justa causa: a fraude foi descoberta.'.replace('Demitido', flex(ge(v), 'Demitido', 'Demitida', 'Demitide')), 3);
  } else {
    escrever(v, { texto: `Foi ${flex(ge(v), 'detido', 'detida', 'detide')} e passou a responder a um processo por ${NOME_CATEGORIA[categoria]}.${particular ? ' A família juntou dinheiro para um advogado.' : ' A defesa ficou com a Defensoria Pública.'}`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  }
  marcarFato(v, 'respondeu_processo');
  abalar(v, 'o processo na Justiça', -10, 14);
  for (const p of pais(v)) { const vin = v.vinculos[p.id]; if (vin) { vin.tensao = clamp(vin.tensao + 20); lembrarCom(v, p.id, 'O dia em que souberam do processo.', 'conflito', 2); } }
  const par = parceiro(v);
  if (par) par.vin.tensao = clamp(par.vin.tensao + 25);
  // Espera presa: só nos casos graves, e nunca garantida.
  const graves = categoria === 'grupo' ? 0.55 : categoria === 'mercado' ? 0.35 : categoria === 'patrimonial' && reincidente(v) ? 0.25 : 0;
  if (r.chance(graves * (particular ? 0.6 : 1))) {
    prender(v, j.processo.tJulgamento, 'fechado', 'preventiva');
  }
}

function medidaSocioeducativa(v: Vida, r: Rng, categoria: CategoriaIlicita): void {
  const j = garantirJustica(v);
  const internacao = categoria === 'grupo' && r.chance(0.4);
  j.antecedentes.push({ t: v.t, categoria, desfecho: 'socioeducativa' });
  marcarFato(v, 'medida_socioeducativa');
  const texto = internacao
    ? 'Apreendido com gente do grupo, cumpriu internação numa unidade socioeducativa. A escola ficou para dentro dos muros.'.replace('Apreendido', flex(ge(v), 'Apreendido', 'Apreendida', 'Apreendide'))
    : 'Pego com a turma, recebeu uma medida socioeducativa: prestação de serviços à comunidade e acompanhamento por um tempo. Pelo ECA, não vira ficha de adulto.'.replace('Pego', flex(ge(v), 'Pego', 'Pega', 'Pegue'));
  escrever(v, { texto, relevancia: 'marco', tema: 'familia', tom: 'ruim' });
  marcar(v, 'fracasso', internacao ? 'Internação numa unidade socioeducativa.' : 'Medida socioeducativa.', internacao ? 3 : 2);
  abalar(v, 'a medida socioeducativa', -8, 10);
  if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - (internacao ? 12 : 5));
  for (const p of pais(v)) { const vin = v.vinculos[p.id]; if (vin) vin.tensao = clamp(vin.tensao + 18); }
  if (internacao) prender(v, v.t + r.int(8, 24), 'fechado', 'internacao');
}

/* --------------------------------------------------------------- Sentença */

function sentenca(v: Vida, r: Rng): void {
  const j = v.justica!;
  const p = j.processo!;
  j.processo = undefined;
  const rein = reincidente(v);
  const cat = p.categoria;
  const absolvicao = (p.defesa === 'particular' ? 0.28 : 0.16) * (rein ? 0.5 : 1);
  const grave = cat === 'grupo' || cat === 'mercado' || (cat === 'fraude' && r.chance(0.5)) || rein;
  const presoAntes = j.prisao;
  if (r.chance(absolvicao)) {
    j.antecedentes.push({ t: v.t, categoria: cat, desfecho: 'absolvicao' });
    if (presoAntes) soltar(v, 'absolvição');
    escrever(v, { texto: `Absolvi${flex(ge(v), 'do', 'da', 'de')} no processo. O alívio veio junto com o cansaço de ter esperado.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    abalar(v, 'a absolvição', 8, -8);
    return;
  }
  if (!grave && !presoAntes) {
    // Primário, sem violência: pena alternativa (Código Penal, art. 44), em liberdade.
    const meses = r.int(10, 24);
    j.alternativa = { tFim: v.t + meses };
    j.antecedentes.push({ t: v.t, categoria: cat, desfecho: 'alternativa' });
    escrever(v, { texto: `Condenad${flex(ge(v), 'o', 'a', 'e')} a pena alternativa: prestação de serviços à comunidade por ${Math.round(meses / 12) || 1} ano${meses >= 18 ? 's' : ''}, em liberdade. A ficha, agora, existe.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'fracasso', 'Condenação a pena alternativa.', 3);
    abalar(v, 'a condenação', -8, 10);
    return;
  }
  const anos = Math.round(({ pequenos: 1, patrimonial: 2, fraude: 3, mercado: 5, grupo: 7 }[cat] + r.int(0, 2)) * (rein ? 1.5 : 1));
  j.antecedentes.push({ t: v.t, categoria: cat, desfecho: 'prisao', anos });
  // O regime fecha por uma parte da pena e depois abre (Lei de Execução Penal: progressão).
  const fechado = Math.round(anos * 12 * (rein ? 0.45 : 0.3));
  const inicio = presoAntes ? presoAntes.tInicio : v.t;
  const fim = Math.max(v.t + 6, inicio + fechado);
  prender(v, fim, anos >= 8 || presoAntes ? 'fechado' : 'semiaberto', 'pena');
  escrever(v, { texto: `Condenad${flex(ge(v), 'o', 'a', 'e')} a ${anos} anos de prisão${presoAntes ? ', depois de esperar o julgamento preso' : ''}. A pena começa fechada; o regime abre com o tempo e o comportamento.`.replace('preso', flex(ge(v), 'preso', 'presa', 'prese')), relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'prisao', `Condenação: ${anos} anos de prisão.`, 3);
}

/* ---------------------------------------------------------------- Prisão */

function prender(v: Vida, tFim: number, regime: 'fechado' | 'semiaberto', motivo: 'preventiva' | 'pena' | 'internacao'): void {
  const j = garantirJustica(v);
  const ja = !!j.prisao;
  j.prisao = { tInicio: j.prisao?.tInicio ?? v.t, tFim, regime };
  if (ja) return;
  if (v.trabalho.atual) encerrarEmprego(v, 'prisão');
  v.trabalho.desempregadoDesde = undefined;
  v.trabalho.horasExtras = false;
  // Fora da semana tudo o que não cabe numa unidade.
  const cabem = new Set(['leitura', 'escrever', 'desenho', 'xadrez', 'igreja']);
  v.rotinas = v.rotinas.filter(x => cabem.has(x.id)).map(x => ({ ...x, nivel: 1 }));
  if (v.educacao.matricula && !v.educacao.matricula.trancado) { v.educacao.matricula.trancado = true; v.educacao.matricula.tTrancou = v.t; }
  // A casa: quem morava sozinho de aluguel perde o contrato; as coisas ficam com a família.
  const junto = vinculosVivos(v).filter(x => x.vin.convivio.includes('casa') && !x.p.especie);
  if ((v.moradia.tipo === 'aluguel' || v.moradia.tipo === 'republica') && junto.length === 0) {
    v.moradia = { tipo: 'cedida', municipioId: v.moradia.municipioId, aluguel: 0, padrao: 1, tInicio: v.t };
  }
  for (const x of junto) x.vin.convivio = x.vin.convivio.filter(c => c !== 'casa');
  marcarFato(v, motivo === 'internacao' ? 'internado' : 'esteve_preso');
  if (motivo === 'preventiva') {
    escrever(v, { texto: 'O juiz mandou esperar o julgamento preso. A porta de ferro fechou atrás.'.replace('preso', flex(ge(v), 'preso', 'presa', 'prese')), relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'prisao', 'Prisão preventiva.', 3);
  }
  abalar(v, motivo === 'internacao' ? 'a internação' : 'a prisão', -16, 20);
}

function soltar(v: Vida, motivo: string): void {
  const j = v.justica!;
  const anos = Math.max(1, Math.round((v.t - (j.prisao?.tInicio ?? v.t)) / 12));
  const internacao = idade(v) < 19 && v.fatos['internado'] !== undefined && !v.fatos['esteve_preso'];
  j.prisao = undefined;
  j.tSaida = v.t;
  // Onde morar ao sair: quem ainda está lá. Senão, a família de origem; senão, um lugar cedido.
  const par = parceiro(v);
  if (par && par.p.municipioId === v.moradia.municipioId && v.moradia.tipo !== 'cedida') {
    if (!par.vin.convivio.includes('casa')) par.vin.convivio.push('casa');
  } else {
    const genitor = pais(v).find(p => p.municipioId === v.moradia.municipioId);
    if (genitor) {
      v.moradia = { tipo: 'pais', municipioId: v.moradia.municipioId, aluguel: 0, padrao: Math.max(1, v.moradia.padrao), tInicio: v.t, aceitaPet: true };
      for (const x of vinculosVivos(v)) if (x.p.municipioId === v.moradia.municipioId && ['mae', 'pai', 'padrasto', 'madrasta'].includes(x.vin.parentesco ?? '') && !x.vin.convivio.includes('casa')) x.vin.convivio.push('casa');
    } else {
      v.moradia = { tipo: 'cedida', municipioId: v.moradia.municipioId, aluguel: 0, padrao: 1, tInicio: v.t };
    }
  }
  if (par?.vin.convivio.includes('casa')) for (const f of filhos(v)) if (f.municipioId === v.moradia.municipioId && idade(v) - 0 >= 0 && (v.t - f.tNasc) / 12 < 18 && !v.vinculos[f.id]?.convivio.includes('casa')) v.vinculos[f.id]?.convivio.push('casa');
  v.trabalho.desempregadoDesde = v.t;
  const texto = internacao ? 'Saiu da unidade socioeducativa. A rua era a mesma; ele, nem tanto.'.replace('ele', flex(ge(v), 'ele', 'ela', 'elu'))
    : motivo === 'absolvição' ? 'Saiu da prisão com a absolvição na mão.'
      : `Saiu da prisão depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}, com o resto da pena em liberdade.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'neutro' });
  marcar(v, 'saida_prisao', texto, 3);
  abalar(v, 'a saída', 10, -6);
  // Programas de egressos existem — nem sempre, nem em todo lugar.
  if (!internacao && r0(v) < 0.6) {
    novaOportunidade(v, { tipo: 'reinsercao', ocupacaoId: ['aux_limpeza', 'estoquista', 'ajudante_obras', 'cooperado_reciclagem', 'aux_cozinha'][Math.floor(r0(v) * 5)], meses: 24, chave: 'reinsercao', bonus: 0.3, titulo: 'Um programa para quem saiu',
      texto: 'Um programa de apoio a egressos tem empresas parceiras que contratam quem cumpriu pena. Carteira assinada, salário de começo e ninguém perguntando duas vezes.' });
  }
}

/** Um número estável por vida e instante (para decisões sem sorteio da transação). */
function r0(v: Vida): number {
  let h = 2166136261;
  const s = `${v.id}:${v.t}:saida`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/* ---------------------------------------------------------------- O ano */

export function processarJustica(v: Vida, r: Rng): void {
  const j = v.justica;
  if (!j) return;
  if (j.processo && v.t >= j.processo.tJulgamento) sentenca(v, r);
  if (j.alternativa && v.t >= j.alternativa.tFim) {
    j.alternativa = undefined;
    escrever(v, { texto: 'Terminou de cumprir a pena alternativa. A última assinatura no fórum foi numa quinta-feira.', relevancia: 'biografia', tema: 'trabalho' });
  }
  const p = j.prisao;
  if (!p) return;
  const anos = (v.t - p.tInicio) / 12;
  // A prisão cobra do corpo e afasta as pessoas.
  v.corpo.saude = clamp(v.corpo.saude - (p.regime === 'fechado' ? 3 : 1));
  v.corpo.forma = clamp(v.corpo.forma - 4);
  const par = parceiro(v);
  if (par?.vin.romance) {
    par.vin.romance.envolvimento = clamp(par.vin.romance.envolvimento - (p.regime === 'fechado' ? 14 : 6));
    if (par.vin.romance.envolvimento < 22 && r.chance(0.5)) {
      escrever(v, { texto: `${par.p.nome} parou de vir nas visitas. Depois, mandou dizer que tinha acabado.`, relevancia: 'marco', tema: 'amor', tom: 'ruim', pessoas: [par.p.id] });
      terminar(v, par.p, par.vin, 'ela');
    }
  }
  for (const x of vinculosVivos(v)) {
    if (x.p.especie) continue;
    const perto = x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai' || x.vin.parentesco === 'filho';
    x.vin.proximidade = clamp(x.vin.proximidade - (perto ? 3 : 8));
    if (!perto && !x.vin.parentesco) x.vin.tUltimoContato = Math.min(x.vin.tUltimoContato, v.t - 12);
  }
  // Remição: estudar e trabalhar dentro encurtam a pena (Lei de Execução Penal, art. 126).
  if (v.fatos['remicao_estudo'] !== undefined || v.fatos['remicao_trabalho'] !== undefined) {
    const meses = (v.fatos['remicao_estudo'] !== undefined ? 3 : 0) + (v.fatos['remicao_trabalho'] !== undefined ? 3 : 0);
    p.tFim = Math.max(v.t, p.tFim - meses);
    if (v.fatos['remicao_trabalho'] !== undefined) v.financas.conta += 3200; // o pecúlio de quem trabalhou dentro
    if (v.fatos['remicao_estudo'] !== undefined) v.mente.cognicao = clamp(v.mente.cognicao + 1);
  }
  if (p.regime === 'fechado' && anos >= 1 && j.antecedentes.some(a => a.desfecho === 'prisao') && v.t >= p.tInicio + Math.round((p.tFim - p.tInicio) * 0.6)) {
    p.regime = 'semiaberto';
    escrever(v, { texto: 'A pena progrediu para o semiaberto: trabalho de dia, a unidade à noite.', relevancia: 'biografia', tema: 'trabalho' });
  }
  if (v.t >= p.tFim && !j.processo) soltar(v, 'pena');
}

/** Em palavras, para a tela (Trabalho e Você). */
export function situacaoNaJustica(v: Vida): string | undefined {
  const j = v.justica;
  if (!j) return undefined;
  if (j.prisao) {
    const regime = j.prisao.regime === 'fechado' ? 'regime fechado' : 'semiaberto';
    const dentro = [v.fatos['remicao_estudo'] !== undefined ? 'estuda' : '', v.fatos['remicao_trabalho'] !== undefined ? 'trabalha' : ''].filter(Boolean).join(' e ');
    return idade(v) < 18 ? `Internação socioeducativa, até ${anoDe(j.prisao.tFim)}.` : `Regime ${regime === 'regime fechado' ? 'fechado' : 'semiaberto'}; a saída prevista é por volta de ${anoDe(j.prisao.tFim)}. ${dentro ? `Você ${dentro} na unidade — cada ano assim desconta meses da pena.` : 'Estudar e trabalhar dentro encurtam o tempo.'}`;
  }
  if (j.processo) return `Respondendo a processo; o julgamento deve sair em ${anoDe(j.processo.tJulgamento)}.`;
  if (j.alternativa) return `Cumprindo pena alternativa até ${anoDe(j.alternativa.tFim)}: algumas horas por semana de serviço à comunidade.`;
  if (j.tSaida !== undefined && v.t - j.tSaida < 60) return 'A ficha ainda pesa em entrevista de emprego com carteira. Trabalhar por conta, estudar e o tempo pesam a favor.';
  return undefined;
}
