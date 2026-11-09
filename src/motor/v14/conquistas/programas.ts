/**
 * VIDA 14 · PROGRAMAS DA CIDADE — gastronomia e eventos exclusivos, LOCAIS (as viagens são de outra frente). O restaurante
 * de que todo mundo fala, a cozinha de outro país, a degustação, a aula com um chef, o festival, a gala, o desfile, o
 * leilão, a premiação, o evento beneficente — e, para quem trabalha, a feira e o congresso da própria área.
 *
 * Cada programa tem TRÊS versões, do bolso apertado ao exclusivo (a feira de rua e a área reservada do festival; o baile
 * do clube e a gala só para convidados): ninguém fica de fora por ser pobre, e o exclusivo pede convite (o nome, o
 * prestígio no meio ou o patrimônio abrem a porta) ou cidade grande. O que fica:
 *
 *   custo        o preço por pessoa no custo de vida de onde se mora (×2 com quem se ama)
 *   cabeça       a felicidade sobe, o estresse desce (mais no que é raro)
 *   memória      a primeira vez de cada programa vai para a Linha da Vida; com a parceria, vira lembrança dos dois
 *   gente        às vezes alguém novo entra na vida (com o contexto de onde se conheceram)
 *   prática      a aula de cozinha anda a cozinha
 *   o meio       a feira e o congresso da área: desempenho, prestígio no meio, contatos (`reconhecimento.ts`)
 *
 * Não duplica nada: o evento beneficente é IR ao evento (o convite é a doação); bancar uma causa continua sendo
 * "Bancar um projeto" (`experiencias`). O leilão é a noite; os lances de verdade são os lotes da casa de leilões
 * (Compras · Coleção, `colecao`). Shows e exposições continuam em Gostos e cultura.
 */

import type { Pessoa, Vida } from '../../tipos';
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import { escrever, idade, lembrarCom, parceiro } from '../../nucleo';
import { dinheiro as fmt } from '../../texto';
import { economiaLocal, municipio } from '../../dados/lugares';
import { condicaoEconomica, pagar, vereditoDePagar } from '../../sistemas/dinheiro';
import { prestigioProfissional } from '../../sistemas/fama';
import { praticar } from '../../sistemas/frentes';
import { apresentarAlguem } from '../../sistemas/social';
import { novoContexto } from '../../sistemas/relacoes';
import { lojaDeColecaoNaCidade } from '../../sistemas/colecao';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { PROGRAMAS14, type ModeloPrograma14, type NivelPrograma14, type VersaoDoPrograma14 } from '../../dados14/conquistas/catalogo';
import { estadoConquistas14 } from './objetivos';
import { perfilDoMeio14, registrarReconhecimento14, somarPrestigio14 } from './reconhecimento';

export interface OquePrograma14 { op: 'programa'; id: string; nivel: NivelPrograma14; comPar?: boolean }

export const modeloPrograma14 = (id: string): ModeloPrograma14 | undefined => PROGRAMAS14.find(p => p.id === id);
const IDADE_MINIMA = 16;

/** Quem recebe convite para o exclusivo: o nome, o prestígio no meio ou o patrimônio. */
export function temConvite14(v: Vida): { ok: boolean; porque?: string } {
  if ((v.notoriedade?.valor ?? 0) >= 30) return { ok: true, porque: 'pelo seu nome' };
  if (prestigioProfissional(v).valor >= 40) return { ok: true, porque: 'pelo seu prestígio no meio' };
  const f = condicaoEconomica(v).faixa;
  if (f === 'rica' || f === 'milionaria' || f === 'bilionaria') return { ok: true, porque: 'pelo seu patrimônio' };
  return { ok: false };
}

export const cidadeGrande14 = (v: Vida) => ['metropole', 'capital'].includes(municipio(v.moradia.municipioId).perfil);

/** O preço de uma versão (por pessoa, no custo da cidade; ×2 com a parceria). */
export function custoDoPrograma14(v: Vida, versao: VersaoDoPrograma14, comPar = false): number {
  return Math.max(10, Math.round(versao.custo * economiaLocal(v.moradia.municipioId).custo / 10) * 10) * (comPar ? 2 : 1);
}

/** Quando dá para repetir (o mesmo programa, qualquer versão). */
export function proximaVez14(v: Vida, m: ModeloPrograma14): number | undefined {
  const x = v.conquistas14?.programas?.[m.id];
  return x && v.t - x.t < m.intervalo ? x.t + m.intervalo : undefined;
}

/** A parceria que iria junto (mora na mesma cidade, viva, fora da prisão dela). */
function quemVaiJunto(v: Vida): Pessoa | undefined {
  const par = parceiro(v);
  return par && par.p.vivo ? par.p : undefined;
}

export function disponibilidadePrograma14(v: Vida, a: OquePrograma14): Veredito {
  const m = modeloPrograma14(a.id);
  const versao = m?.versoes.find(x => x.nivel === a.nivel);
  if (!m || !versao) return bloqueio('impossivel', 'Esse programa não existe.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  if (idade(v) < Math.max(IDADE_MINIMA, m.idade)) return bloqueio('requisito', `A partir dos ${Math.max(IDADE_MINIMA, m.idade)} anos (antes disso, com a família, quando ela decide ir).`);
  if (m.doMeio && !perfilDoMeio14(v) && !v.trabalho.atual) return bloqueio('requisito', 'Os eventos do meio são para quem trabalha na área (ou tem negócio).');
  if (versao.cidadeGrande && !cidadeGrande14(v)) return bloqueio('requisito', 'Isso só acontece em cidade grande (capital ou metrópole).');
  if (versao.convite && !temConvite14(v).ok) return bloqueio('requisito', 'Só com convite: o nome, o prestígio no meio ou o patrimônio abrem essa porta.');
  if (a.comPar && !quemVaiJunto(v)) return bloqueio('incompativel', 'Não há com quem ir a dois.');
  const prox = proximaVez14(v, m);
  if (prox !== undefined) return bloqueio('incompativel', `Foi há pouco. Dá para repetir daqui a ${prox - v.t} ${prox - v.t === 1 ? 'mês' : 'meses'}.`);
  return vereditoDePagar(v, custoDoPrograma14(v, versao, !!a.comPar));
}

const CABECA: Record<NivelPrograma14, { feliz: number; estresse: number; gente: number }> = {
  simples: { feliz: 3, estresse: 2, gente: 0.1 }, medio: { feliz: 4, estresse: 3, gente: 0.16 }, exclusivo: { feliz: 6, estresse: 4, gente: 0.26 }
};

const ONDE: Record<string, string> = {
  restaurante: 'num restaurante', cozinha_de_fora: 'num restaurante de comida de outro país', degustacao: 'numa degustação', aula_de_cozinha: 'numa aula de cozinha',
  festival: 'num festival', gala: 'numa festa de gala', moda: 'num evento de moda', leilao: 'num leilão', premiacao: 'numa premiação', beneficente: 'num evento beneficente', feira_do_setor: 'num evento do meio'
};

/** O que se conta na volta (por programa; o nível escolhe o tom). */
const NA_VOLTA: Record<string, string[]> = {
  restaurante: ['O prato do dia valeu a fila. Você já sabe o que vai pedir da próxima vez.', 'A sobremesa foi a melhor parte — e ninguém quis dividir.', 'Um jantar sem pressa, que terminou com o garçom empilhando as cadeiras.'],
  cozinha_de_fora: ['Um tempero que você nunca tinha provado. Você perguntou o nome duas vezes.', 'O dono contou de onde veio a receita — e de onde ele veio.', 'Comeu com a mão, como manda a casa. Valeu.'],
  degustacao: ['Você descobriu que gosta do que achava que não gostava.', 'No terceiro copo, todo mundo virou especialista.', 'Saiu sabendo explicar por que um é melhor que o outro. Mais ou menos.'],
  aula_de_cozinha: ['Você errou o ponto da primeira vez e acertou na segunda. A receita foi para casa.', 'O chef corrigiu o seu jeito de segurar a faca. Faz diferença.', 'O que você cozinhou, você comeu. E repetiu.'],
  festival: ['De barraca em barraca, a tarde passou sem ninguém olhar o relógio.', 'A fila mais longa era a melhor. Sempre é.', 'Música, fumaça de churrasqueira e gente de todo canto.'],
  gala: ['Roupa de festa, salão iluminado, uma valsa que você quase dançou direito.', 'Muita gente bonita, muita conversa educada — e uma boa de verdade.', 'Você ficou até o fim e voltou de sapato na mão.'],
  moda: ['Você viu de perto o que daqui a um ano estará nas vitrines.', 'Os criadores contaram de onde vem cada peça. Você olhou o próprio armário de outro jeito.', 'A passarela durou vinte minutos; a festa, quatro horas.'],
  leilao: ['O martelo bateu mais rápido do que você esperava. Lances que somavam o preço de uma casa.', 'Você levantou a plaquinha uma vez — só para ver como é — e baixou rápido.', 'O leiloeiro fazia piada entre os lotes. A sala ria nervosa.'],
  premiacao: ['Aplaudiu gente que você só conhecia de nome.', 'Um discurso de agradecimento fez a plateia inteira chorar.', 'Ganhou quem você torcia. Quase.'],
  beneficente: ['O dinheiro do convite foi para a causa. No fim, mostraram o que ele vai pagar.', 'Você ganhou uma rifa — um pano de prato bordado — e guardou com carinho.', 'Uma noite boa, por um motivo bom.'],
  feira_do_setor: ['Você voltou com catálogos, ideias e o contato de quem resolve o que vinha travando.', 'Três dias de palestras e cafezinho; duas ideias para testar na segunda-feira.', 'O setor inteiro num pavilhão só. Você soube o que vem por aí antes dos outros.']
};

export function viverPrograma14(v: Vida, r: Rng, a: OquePrograma14): string {
  const m = modeloPrograma14(a.id)!;
  const versao = m.versoes.find(x => x.nivel === a.nivel)!;
  const par = a.comPar ? quemVaiJunto(v) : undefined;
  const custo = custoDoPrograma14(v, versao, !!par);
  pagar(v, custo);
  const st = estadoConquistas14(v);
  const reg = ((st.programas ??= {})[m.id] ??= { t: v.t, vezes: 0 });
  const primeira = reg.vezes === 0;
  reg.t = v.t; reg.vezes += 1;
  const k = CABECA[a.nivel];
  v.mente.felicidade = clamp(v.mente.felicidade + k.feliz + (primeira && a.nivel === 'exclusivo' ? 2 : 0));
  v.mente.estresse = clamp(v.mente.estresse - k.estresse);
  const extra: string[] = [];
  const rr = rngDe(v.id, 'c14_programa', m.id, v.t);
  if (par) {
    const vin = v.vinculos[par.id];
    if (vin) vin.proximidade = clamp(vin.proximidade + 3);
    lembrarCom(v, par.id, `${m.memoria}: ${versao.nome.charAt(0).toLowerCase()}${versao.nome.slice(1)}.`, 'ritual', 2);
  }
  if (m.pratica) praticar(v, r, m.pratica, a.nivel === 'simples' ? 0.3 : a.nivel === 'medio' ? 0.5 : 0.7);
  if (m.doMeio) {
    const e = v.trabalho.atual;
    if (e) e.desempenho = clamp(e.desempenho + (a.nivel === 'simples' ? 2 : a.nivel === 'medio' ? 3 : 4));
    if (a.nivel !== 'simples') somarPrestigio14(v, 1);
    registrarReconhecimento14(v, a.nivel === 'medio' ? 'congresso' : 'feira', a.nivel === 'medio' ? 'Foi ao congresso da área, por conta própria' : a.nivel === 'exclusivo' ? 'Foi a uma feira internacional do setor' : 'Visitou a feira do setor');
    extra.push('o que viu lá volta para o trabalho');
  }
  if (rr.chance(Math.min(0.6, k.gente * m.gente))) {
    const p = apresentarAlguem(v, rr, { idade: [Math.max(18, idade(v) - 15), Math.min(80, idade(v) + 15)], origem: m.doMeio ? 'trabalho' : 'apresentado' });
    const vin = v.vinculos[p.id];
    if (vin) vin.contexto = novoContexto('evento');
    lembrarCom(v, p.id, `Se conheceram ${ONDE[m.id] ?? 'num evento'}.`, 'inicio', 2);
    extra.push(`${p.nome} puxou conversa — e vocês trocaram contato`);
  }
  if (m.id === 'leilao' && a.nivel !== 'simples' && lojaDeColecaoNaCidade(v.moradia.municipioId, 'leilao')) extra.push('quem quiser dar lances de verdade encontra os lotes do ano na casa de leilões (Compras · Coleção)');
  if (m.id === 'beneficente') v.fatos['c14_beneficente'] = v.t;
  const frase = `${m.memoria}: ${versao.nome.charAt(0).toLowerCase()}${versao.nome.slice(1)}${par ? `, com ${par.nome}` : ''}.`;
  escrever(v, { texto: frase, relevancia: primeira ? 'biografia' : 'cotidiano', tema: m.doMeio ? 'trabalho' : 'lazer', tom: 'bom', escolha: true, ...(par ? { pessoas: [par.id] } : {}), fato: { tipo: 'c14_programa', dados: { programa: m.id, nivel: a.nivel } } });
  const volta = NA_VOLTA[m.id] ?? ['Valeu a noite.'];
  const texto = volta[Math.floor(rr.next() * volta.length) % volta.length];
  return `${fmt(custo)}${par ? ' para os dois' : ''}. ${texto}${extra.length ? ` ${extra.map((x, i) => (i === 0 ? x.charAt(0).toUpperCase() + x.slice(1) : x)).join('; ')}.` : ''}`;
}

/** A lista para a tela: cada programa com as suas versões, o preço e o que falta (dito, nunca escondido). */
export interface VersaoNaTela14 { nivel: NivelPrograma14; nome: string; custo: number; convite?: boolean; cidadeGrande?: boolean }
export interface ProgramaNaTela14 { id: string; nome: string; grupo: ModeloPrograma14['grupo']; versoes: VersaoNaTela14[]; proxima?: number; vezes: number }

export function programasNaTela14(v: Vida): ProgramaNaTela14[] {
  const comMeio = !!perfilDoMeio14(v) || !!v.trabalho.atual;
  return PROGRAMAS14.filter(m => !m.doMeio || comMeio).map(m => ({
    id: m.id, nome: m.nome, grupo: m.grupo, vezes: v.conquistas14?.programas?.[m.id]?.vezes ?? 0, proxima: proximaVez14(v, m),
    versoes: m.versoes.map(x => ({ nivel: x.nivel, nome: x.nome, custo: custoDoPrograma14(v, x), ...(x.convite ? { convite: true } : {}), ...(x.cidadeGrande ? { cidadeGrande: true } : {}) }))
  }));
}

export const temParaIrJunto14 = (v: Vida) => quemVaiJunto(v);
