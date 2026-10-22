/**
 * REWORK 10 · CRI-01 — A VIDA À MARGEM COMO TRAJETÓRIA. O envolvimento (`ilicito`) era uma renda com exposição e uma
 * pergunta a cada dois anos. Agora é um caminho com as suas próprias coisas, como as outras carreiras — sem nunca
 * descrever como se faz nada:
 *
 *   a CONFIANÇA DO MEIO  (`reputacao`) cresce com o tempo, com o nível e com os trabalhos maiores; cai na moita, na
 *                        recusa, no atrito. É ela que traz os trabalhos maiores (não uma barra que libera tudo);
 *   os CONTATOS          as pessoas do caminho — quem abriu a porta e quem chegou depois;
 *   os TRABALHOS MAIORES uma decisão (`ilic_trabalho`): participar, negociar a parte, recusar ou sair — o dinheiro
 *                        grande e o risco grande (a exposição, o susto, a lesão);
 *   os ATRITOS           o grupo também briga (`ilic_atrito`): ceder, enfrentar ou sair de vez;
 *   o CERCO              a investigação chegou perto (`ilic_cerco`): sumir, procurar um advogado, assumir — ou cooperar;
 *   a SAÍDA              parar (sempre possível), procurar ajuda (a família, um programa: a pressão pesa menos) ou
 *                        negociar a saída (pagar para sair sem pendência).
 *
 * As decisões moram em `conteudo/margem`; as ações da tela (`Acao` 'margem'), aqui. Sorteios próprios (`rngDe`).
 */

import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { Vida } from '../tipos';
import { idade, lembrarCom, marcarFato, pais, vinculosVivos } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { abrirAPorta, ativo, parar } from './ilicito';
import { abalar } from './abalo';
import { disponivel, pagar, vereditoDePagar } from './dinheiro';
import { economiaLocal } from '../dados/lugares';
import { assumir, contratarAdvogado, cooperar, pedirReabilitacao, vereditoDaReabilitacao, vereditoDeCooperar, vereditoDoAdvogado } from './tribunal';
import { novaOportunidade } from './oportunidades';

const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

/** Uma vez por ano, depois do envolvimento (`ilicito.processarIlicito`): a confiança do meio, os contatos, as perguntas. */
export function processarMargem(v: Vida): void {
  const env = v.caminhos.envolvimento;
  if (!env) return;
  const r = rngDe(v.id, 'margem', v.t);
  if (env.parou !== undefined) {
    env.reputacao = Math.max(0, Math.round((env.reputacao ?? 0) * 0.7));
    return;
  }
  // A confiança do meio: o tempo, o nível, os trabalhos maiores; a moita esfria.
  env.reputacao = clamp(Math.round((env.reputacao ?? 10) + (env.cautela ? -4 : 3 + env.nivel * 2) + (env.trabalhos ?? 0) * 0.5));
  const cs = (env.contatos ??= []);
  if (env.contatoId && !cs.includes(env.contatoId)) cs.push(env.contatoId);
  // A cada tanto, uma das três perguntas do caminho (só uma por ano; o rumo de `ilicito` tem prioridade).
  if (v.fatos['ilic_rumo'] === v.t || v.fatos['ilic_cerco'] === v.t) return;
  if (env.investigado === v.t) { v.fatos['ilic_cerco'] = v.t; return; }
  const ultimo = v.fatos['ilic_trabalho'] ?? env.tInicio;
  if ((env.reputacao ?? 0) >= 25 && v.t - ultimo >= 18 && !env.cautela && r.chance(0.55)) { v.fatos['ilic_trabalho'] = v.t; return; }
  if (env.nivel >= 2 && (env.categoria === 'mercado' || env.categoria === 'grupo') && r.chance(0.2 + (env.atritos ?? 0) * 0.05)) v.fatos['ilic_atrito'] = v.t;
}

/* ---------------------------------------------------------------- As ações da tela */

export type OqueMargem = 'procurar_ajuda' | 'negociar_saida' | 'assumir' | 'cooperar' | 'advogado' | 'reabilitacao' | 'procurar_contato';

/** O preço de sair sem pendência: o que o grupo diz que você deve (o que ganhou pesa). */
export const precoDaSaida = (v: Vida) => Math.round(clamp((v.caminhos.envolvimento?.ganhos ?? 0) * 0.15, preco(v, 4000), preco(v, 60000)) / 100) * 100;

export function disponibilidadeMargem(v: Vida, oque: OqueMargem): Veredito {
  const env = v.caminhos.envolvimento;
  switch (oque) {
    case 'procurar_ajuda':
      if (!env) return bloqueio('impossivel', 'Não há de que sair.');
      if (env.ajuda !== undefined && v.t - env.ajuda < 24) return bloqueio('incompativel', 'Você já procurou ajuda há pouco: o apoio está em andamento.');
      return idade(v) < 14 ? bloqueio('impossivel', 'Cedo demais.') : PERMITIDO;
    case 'negociar_saida':
      if (!env || env.nivel < 2) return bloqueio('impossivel', 'Não há com quem negociar uma saída.');
      if (env.saidaNegociada !== undefined) return bloqueio('incompativel', 'A saída já foi negociada.');
      return vereditoDePagar(v, precoDaSaida(v), 'Sair sem pendência custa uns');
    case 'assumir': return v.justica?.processo && !v.justica.processo.assumiu ? PERMITIDO : bloqueio('impossivel', 'Não há processo em que assumir.');
    case 'cooperar': return v.justica?.processo?.cooperou ? bloqueio('incompativel', 'Você já colaborou.') : vereditoDeCooperar(v);
    case 'advogado': return vereditoDoAdvogado(v);
    case 'reabilitacao': return vereditoDaReabilitacao(v);
    case 'procurar_contato':
      if (idade(v) < 16) return bloqueio('impossivel', 'Cedo demais para isso.');
      if (v.justica?.prisao) return bloqueio('impossivel', 'Na prisão, o que se procura é a saída.');
      if (ativo(v)) return bloqueio('incompativel', 'Você já está nisso.');
      if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
      if (v.fatos['procurou_contato'] !== undefined && v.t - v.fatos['procurou_contato'] < 12) return bloqueio('incompativel', 'Você já procurou este ano.');
      return { grau: 'irregular', motivo: 'É crime. Alguém vai aparecer com uma proposta — aceitar ou não continua sendo escolha sua, e a conta chega.' };
  }
}

export function executarMargem(v: Vida, r: Rng, oque: OqueMargem): string {
  const env = v.caminhos.envolvimento;
  switch (oque) {
    case 'procurar_ajuda': {
      env!.ajuda = v.t;
      // A família (quem está perto) e um programa de apoio: a pressão do grupo pesa menos, a porta de um trabalho abre.
      const quem = pais(v).find(p => v.vinculos[p.id] && v.vinculos[p.id].proximidade >= 30) ?? vinculosVivos(v).find(x => x.vin.estagio === 'amigo_proximo')?.p;
      if (quem) { const vin = v.vinculos[quem.id]; vin.confianca = clamp(vin.confianca + 5); vin.proximidade = clamp(vin.proximidade + 4); lembrarCom(v, quem.id, 'Você pediu ajuda para sair do que estava envolvido.', 'apoio', 3); }
      if (v.fatos['pressao_grupo'] !== undefined) v.fatos['pressao_grupo'] = v.t - 18;
      if (ativo(v)) parar(v, 'pediu ajuda para sair');
      novaOportunidade(v, { tipo: 'reinsercao', ocupacaoId: 'aux_limpeza', meses: 18, chave: 'ajuda_para_sair', bonus: 0.3, titulo: 'Um programa de apoio', texto: 'Um programa de apoio a quem quer sair do que estava envolvido tem empresas parceiras: um começo com carteira assinada.' });
      abalar(v, 'pedir ajuda', 3, -6);
      return `${quem ? `${quem.nome} ouviu tudo sem julgar. ` : ''}Pedir ajuda foi a parte mais difícil. Agora há gente ao lado — e uma porta de trabalho aberta.`;
    }
    case 'negociar_saida': {
      const valor = precoDaSaida(v);
      pagar(v, Math.min(valor, Math.max(0, disponivel(v))));
      env!.saidaNegociada = v.t;
      delete v.fatos['pressao_grupo'];
      if (ativo(v)) parar(v, 'negociou a saída');
      marcarFato(v, 'saida_negociada');
      return 'Você pagou o que diziam que devia e saiu. Sem pendência: ninguém vai bater à porta por isso.';
    }
    case 'assumir': return assumir(v);
    case 'cooperar': { const t = cooperar(v); if (ativo(v)) parar(v, 'colaborou com a investigação'); return t; }
    case 'advogado': return contratarAdvogado(v);
    case 'reabilitacao': return pedirReabilitacao(v, r);
    case 'procurar_contato':
      v.fatos['procurou_contato'] = v.t;
      abrirAPorta(v, r);
      return 'Você deu a entender, para as pessoas certas, que estava disposto. Não demorou para alguém aparecer.';
  }
}

/** A trajetória em palavras (para a tela "À margem"): o tempo, a confiança do meio, os contatos, o risco, o que entrou. */
export function leituraDaMargem(v: Vida): { titulo: string; linhas: string[] } | undefined {
  const env = v.caminhos.envolvimento;
  if (!env) return undefined;
  const anos = Math.max(0, Math.round(((env.parou ?? v.t) - env.tInicio) / 12));
  const rep = env.reputacao ?? 0;
  const linhas = [
    `${anos <= 0 ? 'Menos de um ano' : `${anos} ${anos === 1 ? 'ano' : 'anos'}`} no caminho${env.parou !== undefined ? `, até ${Math.floor(env.parou / 12)}` : ''}; os trabalhos maiores: ${env.trabalhos ?? 0}.`,
    `No meio, ${rep >= 60 ? 'você é de confiança: os trabalhos grandes chegam até você' : rep >= 30 ? 'já confiam em você para mais do que o básico' : 'você ainda é gente de fora'}.`,
    `${(env.contatos?.length ?? 0) > 1 ? `${env.contatos!.length} pessoas do caminho sabem o seu nome` : 'Uma pessoa do caminho sabe o seu nome'}.`,
    env.investigado !== undefined ? 'Há uma investigação em andamento.' : env.exposicao < 25 ? 'Por enquanto, pouca gente sabe.' : env.exposicao < 55 ? 'Gente demais já sabe.' : 'É questão de tempo até alguém chegar.',
    ...(env.saidaNegociada !== undefined ? ['A saída foi negociada: não há pendência com o grupo.'] : v.fatos['pressao_grupo'] !== undefined ? ['O grupo não aceitou bem a sua saída.'] : [])
  ];
  return { titulo: env.parou !== undefined ? 'O que ficou para trás' : 'O que você faz por fora', linhas };
}
