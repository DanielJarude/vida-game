/**
 * Empregabilidade: o que o currículo diz de você PARA ESTA VAGA.
 *
 * A chance de uma contratação já vinha de `elegibilidade` (formação,
 * estrada, mercado, cidade). O que faltava era a pessoa ENTENDER: uma
 * rejeição dizia "seguiram com alguém de mais experiência" para a nutricionista
 * com doutorado e para o garoto do primeiro emprego. Aqui a vida acumulada é
 * lida em partes — formação (e se está acima do pedido), estrada na área,
 * estrada que se transfere, histórico, cidade — e vira:
 *
 *   - uma palavra de compatibilidade (muito compatível … distante), nunca um número;
 *   - a CAMADA da vaga para esta vida: a sua trajetória, relacionadas, outros caminhos;
 *   - o motivo compreensível quando não dá ("atende à formação, mas havia
 *     candidatos com mais experiência").
 *
 * A chance é a de `elegibilidade` (inclusive o desconto de quem tem
 * formação muito acima da vaga): aqui só se diz, em palavras, o que pesou.
 */

import type { Vida } from '../tipos';
import { AFINS, OCUPACOES, ROTULO_TRILHA, ocupacao, type Ocupacao } from '../dados/ocupacoes';
import { ORDEM_NIVEL, ROTULO_AREA } from '../dados/cursos';
import { familiaDaTrilha } from '../dados/carreiras';
import { nivelDeOferta } from '../dados/lugares';
import { habilidade } from './frentes';
import { anosTxt, degrausAcima, experienciaNaTrilha, porContaPropria, titulacaoNaTrilha } from './trabalho';

export type Camada = 'trajetoria' | 'relacionada' | 'outra';

export const PALAVRA_COMPATIBILIDADE = ['distante', 'possível', 'compatível', 'muito compatível'] as const;
export const PALAVRA_ESTRADA = ['nenhuma', 'começando', 'alguma', 'sólida', 'muito sólida'] as const;

export interface PerfilVaga {
  camada: Camada;
  /** 0 distante … 3 muito compatível. */
  compatibilidade: number;
  palavra: string;
  /** Por que esta vaga está nesta camada (uma frase). */
  porque: string;
  fortes: string[];
  fracos: string[];
  /** Tem mais formação do que a vaga pede, sem que ela seja da área (o "superqualificado"). */
  acimaDaVaga: boolean;
}

const estradaPalavra = (meses: number) => (meses <= 0 ? 0 : meses < 24 ? 1 : meses < 60 ? 2 : meses < 144 ? 3 : 4);

/** O maior nível de formação concluído (0 nenhum … 5 doutorado). */
function nivelFormal(v: Vida): number {
  return Math.max(0, ...v.educacao.concluidos.filter(c => c.nivel !== 'livre').map(c => ORDEM_NIVEL[c.nivel]));
}

/** Formação que casa com a área da vaga (a melhor delas). */
function formacaoDaArea(v: Vida, oc: Ocupacao) {
  if (!oc.area) return undefined;
  const qualquer = oc.area.includes('qualquer');
  return [...v.educacao.concluidos].filter(c => qualquer ? c.nivel !== 'livre' : oc.area!.includes(c.area as never)).sort((a, b) => ORDEM_NIVEL[b.nivel] - ORDEM_NIVEL[a.nivel])[0];
}

/** As trilhas da sua vida: onde há estrada de verdade (dois anos ou mais), a de hoje primeiro. */
export function trilhasDaVida(v: Vida): string[] {
  const hoje = v.trabalho.atual ? ocupacao(v.trabalho.atual.ocupacaoId).trilha : undefined;
  const com = Object.entries(v.trabalho.experiencia).filter(([, m]) => m >= 24).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  return [...new Set([...(hoje ? [hoje] : []), ...com])];
}

/** As áreas da sua formação (graduação ou mais; técnico conta; qualificação curta, não). */
function areasDaFormacao(v: Vida): Set<string> {
  return new Set(v.educacao.concluidos.filter(c => c.nivel !== 'livre').map(c => c.area));
}

export function perfilParaVaga(v: Vida, oc: Ocupacao): PerfilVaga {
  const fortes: string[] = [];
  const fracos: string[] = [];
  const estrada = experienciaNaTrilha(v, oc.trilha);
  const propria = v.trabalho.experiencia[oc.trilha] ?? 0;
  const tit = titulacaoNaTrilha(v, oc);
  const pede = oc.experiencia ?? 0;
  const form = formacaoDaArea(v, oc);
  const nivelF = nivelFormal(v);
  const atual = v.trabalho.atual ? ocupacao(v.trabalho.atual.ocupacaoId) : undefined;
  const trilhas = trilhasDaVida(v);
  const areas = areasDaFormacao(v);
  const acima = !!atual && degrausAcima(atual).some(x => x.id === oc.id);

  // Formação.
  if (form) {
    if (tit.meses) fortes.push(`${tit.nome} na área: pesa como estrada.`);
    else if (oc.area && !oc.area.includes('qualquer')) fortes.push(`A formação (${form.nome}) é a que a vaga pede.`);
    else if (oc.nivelCurso && ORDEM_NIVEL[form.nivel] >= ORDEM_NIVEL[oc.nivelCurso]) fortes.push(`A titulação (${form.nome}) atende ao que a vaga pede.`);
  } else if (oc.area && !oc.habilidade?.ouFormacao) {
    fracos.push(`Pede formação em ${oc.area.map(a => ROTULO_AREA[a]).join(' ou ')}.`);
  }
  // Estrada.
  const total = estrada + tit.meses;
  if (propria >= 12) fortes.push(`${anosTxt(propria)} de estrada em ${ROTULO_TRILHA[oc.trilha] ?? 'na área'}: ${PALAVRA_ESTRADA[estradaPalavra(propria)]}.`);
  else if (estrada > propria && estrada >= 12) fortes.push(`Experiência que se transfere: ${anosTxt(estrada - propria)} em áreas vizinhas contam aqui pela metade.`);
  if (pede > 0 && total < pede) fracos.push(`Pedem ${anosTxt(pede)} de experiência na área; você tem ${anosTxt(total)}.`);
  // Ofício.
  if (oc.habilidade && habilidade(v, oc.habilidade.dominio) >= oc.habilidade.minimo + 10) fortes.push('Você sabe fazer isso bem, com trabalho para mostrar.');
  // Histórico.
  const recentes = v.trabalho.historico.filter(h => h.tFim > v.t - 60 && h.tFim - h.tInicio < 12 && !['fim do contrato', 'fim do estágio', 'fim do contrato de aprendiz', 'trocou de emprego'].includes(h.motivo));
  if (recentes.length >= 3) fracos.push('Muitas passagens curtas nos últimos anos: quem contrata repara.');
  if (v.trabalho.desempregadoDesde !== undefined && v.t - v.trabalho.desempregadoDesde > 24) fracos.push(`Mais de dois anos sem trabalho: a entrevista vai perguntar.`);
  const longo = v.trabalho.historico.find(h => h.tFim - h.tInicio >= 96 && h.motivo !== 'demissão');
  if (longo || (v.trabalho.atual && v.t - v.trabalho.atual.tInicio >= 96)) fortes.push('Um histórico estável: anos seguidos no mesmo lugar.');
  // Mais formação do que a vaga (sem ser da área): o "vai sair logo".
  const acimaDaVaga = nivelF >= 2 && oc.nivel <= 2 && !form && !oc.habilidade && !porContaPropria(oc);
  if (acimaDaVaga) fracos.push('O currículo é maior que a vaga: há quem ache que você vai sair logo.');
  // Cidade.
  if (nivelDeOferta(v.moradia.municipioId) === 0 && oc.nivel >= 4) fracos.push('Numa cidade pequena, vagas assim são raras e muito disputadas.');

  // Camada: a sua trajetória (a estrada, a formação, o próximo degrau), o que se relaciona, o resto.
  const naTrilha = trilhas.includes(oc.trilha);
  const naFormacao = !!oc.area && (oc.area.includes('qualquer') ? nivelF >= 4 && oc.nivel >= 4 : oc.area.some(a => areas.has(a)));
  const familia = familiaDaTrilha(oc.trilha).id;
  const vizinha = trilhas.some(t => (AFINS[t] ?? []).includes(oc.trilha) || familiaDaTrilha(t).id === familia) || (!!oc.habilidade && habilidade(v, oc.habilidade.dominio) >= oc.habilidade.minimo);
  // Um passo atrás (bem abaixo do que se faz ou da formação que se tem) não é trajetória.
  const passoAtras = (atual && naTrilha && oc.nivel < atual.nivel) || (nivelF >= 2 && oc.nivel <= 2 && !naFormacao);
  let camada: Camada = 'outra';
  let porque = 'Outro caminho: nada na sua estrada ou formação aponta para cá — o que não impede.';
  if (acima) { camada = 'trajetoria'; porque = 'O próximo passo da sua estrada.'; }
  else if ((naTrilha || naFormacao) && !passoAtras) { camada = 'trajetoria'; porque = naTrilha ? `Na sua estrada: ${ROTULO_TRILHA[oc.trilha] ?? 'a sua área'}.` : tit.meses ? `A sua formação avançada aponta para cá.` : `Na área da sua formação.`; }
  else if (vizinha && !passoAtras) { camada = 'relacionada'; porque = 'Perto do que você já fez: parte da estrada se transfere.'; }
  else if (naTrilha || naFormacao) { camada = 'relacionada'; porque = 'Da sua área, mas abaixo do ponto em que você está.'; }

  // Compatibilidade: requisitos cumpridos, estrada diante do pedido, formação da área.
  let pontos = 0;
  if (form || !oc.area || oc.habilidade?.ouFormacao) pontos += 1;
  if (pede === 0 ? total >= 12 || oc.nivel <= 1 : total >= pede) pontos += 1;
  if (total >= Math.max(24, pede * 1.5) || tit.meses || acima) pontos += 1;
  if (camada === 'trajetoria') pontos += 0.5;
  pontos -= fracos.length * 0.6;
  const compatibilidade = Math.max(0, Math.min(3, Math.round(pontos)));
  return { camada, compatibilidade, palavra: PALAVRA_COMPATIBILIDADE[compatibilidade], porque, fortes, fracos, acimaDaVaga };
}

/**
 * O motivo de uma rejeição, em palavras que a pessoa reconhece — a partir do
 * que pesou de verdade (a falta vem de `avaliar`) e do perfil.
 */
export function motivoDaRejeicao(v: Vida, oc: Ocupacao, falta: string, mediaEntrevista: number): string {
  const p = perfilParaVaga(v, oc);
  const pede = oc.experiencia ?? 0;
  const tem = experienciaNaTrilha(v, oc.trilha) + titulacaoNaTrilha(v, oc).meses;
  const formado = !oc.area || p.fortes.some(f => /formação|titulação/.test(f));
  if (falta === 'experiencia') {
    if (mediaEntrevista >= 0.3) return `você foi bem na entrevista, mas a sua experiência na área ainda é pequena para a vaga (pediam ${anosTxt(pede)}; você tem ${anosTxt(tem)})`;
    return formado ? `seu currículo atende à formação, mas havia candidatos com mais experiência na área` : 'seguiram com alguém de mais experiência';
  }
  if (falta === 'formacao') return `buscavam alguém formado em ${(oc.area ?? []).filter(a => a !== 'qualquer').map(a => ROTULO_AREA[a]).join(' ou ') || 'na área'}`;
  if (p.acimaDaVaga && falta === 'concorrencia') return 'acharam que o seu currículo é maior que a vaga — e que você não ficaria';
  if (falta === 'concorrencia' && p.compatibilidade >= 2) return 'seu histórico combina bastante com a vaga; foi a disputa: escolheram outra pessoa';
  if (falta === 'concorrencia') return 'a vaga era disputada e escolheram alguém com o perfil mais próximo do que buscavam';
  return 'a entrevista não ajudou';
}

/** As vagas de uma camada (as que dão para tentar), ordenadas pela compatibilidade — para simuladores e testes. */
export function vagasDaCamada(v: Vida, camada: Camada, pode: (oc: Ocupacao) => boolean): Ocupacao[] {
  return OCUPACOES.filter(oc => pode(oc)).map(oc => ({ oc, p: perfilParaVaga(v, oc) })).filter(x => x.p.camada === camada).sort((a, b) => b.p.compatibilidade - a.p.compatibilidade || b.oc.nivel - a.oc.nivel).map(x => x.oc);
}
