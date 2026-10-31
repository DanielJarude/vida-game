/**
 * REWORK 12.25 — AS ENCOMENDAS: o trabalho que chega e o que se encomenda.
 *
 *   RECEBIDAS   contatos e organizações propõem trabalhos (pelo ramo, pela prática, pelo nome no meio, pela confiança,
 *               pelo histórico com quem propõe). Cada proposta tem gravidade, pagamento, chance e risco ditos antes, e um
 *               prazo. Aceitar ocupa tempo (o ano é finito: `carreiraCriminal.capacidadeDoAno`); recusar é possível;
 *               negociar, uma vez — a pessoa aceita, recusa ou volta com outra proposta.
 *   DELEGADAS   o jogador encomenda a alguém de confiança: paga adiantado, espera o prazo (corre em segundo plano), e o
 *               resultado chega — deu certo, deu errado, ou a pessoa sumiu com o dinheiro e falou demais. Quantas ao mesmo
 *               tempo depende do patamar e do posto.
 *   FRACASSOS   dar errado não é sempre prejuízo e exposição: pode ensinar, render um contato, uma dívida, um conflito,
 *               uma oportunidade, uma perda parcial — depende do contexto. E depois de dois erros seguidos, o meio
 *               oferece o que cabe (o trabalho menor, o parceiro mais velho): a sequência infinita de fracassos não existe.
 *
 * Os trabalhos são nomes abstratos ("uma remessa de outro", "um acerto numa concorrência"): nada descreve como se faz.
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { EncomendaCriminal, Ramo, Vida } from '../tipos';
import { escrever, idade, novoId } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { balanco, vereditoDePagar } from './dinheiro';
import { ativo } from './ilicito';
import { preso } from './justica';
import { alcanceDoContato, anotar, contatosAtivos, criarContato, lembrarOrg, orgPorId, rivalDoRamo, valorDaOperacao } from './submundo';
import { NOME_DO_RAMO, PERFIL, ramoPrincipal, ramosAtivos } from './ramos';
import { escalaDe, ganharPratica, garantirCarreira, marco, movimentoPorFora, nivelNaOrganizacao, pagarPorFora, patamarAtual, temOrganizacaoPropria, temTempo, usarTempo } from './carreiraCriminal';
import { dinheiroCurto, flex } from '../texto';
import { abalar } from './abalo';
import { historiaDoContato, mudarConfianca } from './redeCriminal';
import { marcarFalhaGrave } from './conflitosCriminais';
import { demandaDe, reputacaoAqui } from './mercadoCriminal';
import { jeitoDe } from './faccoes';
import { contextoDaEncomenda, reacaoAoFracasso, reacaoAoSucesso, reacaoDaOrg, seuLugar, variante, vozDe } from './relatoDoCrime';

const env = (v: Vida) => v.caminhos.envolvimento;

/**
 * Os trabalhos de cada ramo — nomes, não métodos. REWORK 12.35 · 18.1: mais de um por gravidade, e diferentes na conta (o
 * quanto paga, a chance, o rastro) e no posto (o coordenar e o acerto com outra organização são de quem tem posto). Os ids
 * antigos continuam (saves).
 */
export interface TipoDeTrabalho { id: string; nome: string; g: 1 | 2 | 3; /** posto mínimo na organização (só os da organização) */ nivel?: number; valor?: number; chance?: number; risco?: number }
export const TIPOS: Record<Ramo, TipoDeTrabalho[]> = {
  furtos: [
    { id: 'furtos_pequeno', nome: 'um serviço pequeno para um conhecido', g: 1 },
    { id: 'furtos_vigiar', nome: 'ficar de olho num lugar, para outro', g: 1, valor: 0.7, chance: 0.06, risco: 0.6 },
    { id: 'furtos_guardar', nome: 'guardar e passar adiante uma mercadoria de origem ruim', g: 2 },
    { id: 'furtos_desmonte', nome: 'passar adiante peças de origem ruim', g: 2, valor: 1.1, risco: 1.1 },
    { id: 'furtos_grande', nome: 'um serviço grande, com gente de fora', g: 3 },
    { id: 'furtos_carga', nome: 'uma carga desviada, com gente de fora', g: 3, valor: 1.3, chance: -0.06, risco: 1.3 }
  ],
  contrabando: [
    { id: 'contra_cuidar', nome: 'cuidar de uma remessa que é de outro', g: 1 },
    { id: 'contra_viagem', nome: 'levar uma encomenda de uma cidade a outra', g: 1, valor: 0.9, risco: 0.9 },
    { id: 'contra_intermediar', nome: 'intermediar uma venda grande', g: 2 },
    { id: 'contra_deposito', nome: 'guardar o estoque de outro por uns meses', g: 2, valor: 0.8, chance: 0.05, risco: 1.2 },
    { id: 'contra_financiar', nome: 'financiar o lote de uma rede', g: 3 },
    { id: 'contra_rota', nome: 'abrir um caminho novo para uma rede', g: 3, valor: 1.4, chance: -0.08, risco: 1.2 }
  ],
  organizado: [
    { id: 'org_recado', nome: 'um recado da organização', g: 1 },
    { id: 'org_vigiar', nome: 'ficar de olho num ponto do grupo', g: 1, valor: 0.8, chance: 0.05 },
    { id: 'org_pendencia', nome: 'resolver uma pendência do grupo, sem barulho', g: 2 },
    { id: 'org_cobrar', nome: 'cobrar de alguém o que deve ao grupo, sem violência', g: 2, valor: 1.1, risco: 1.1 },
    { id: 'org_acompanhar', nome: 'acompanhar uma entrega do grupo', g: 2, nivel: 1, valor: 1.15, chance: -0.03 },
    { id: 'org_ponto', nome: 'tomar conta de um negócio do grupo por uns meses', g: 3 },
    { id: 'org_coordenar', nome: 'coordenar uma equipe num trabalho grande do grupo', g: 3, nivel: 3, valor: 1.4, chance: 0.04, risco: 0.8 },
    { id: 'org_acerto', nome: 'fechar um acerto com outra organização', g: 3, nivel: 4, valor: 1.6, risco: 0.7 }
  ],
  digital: [
    { id: 'dig_pequeno', nome: 'um trabalho técnico sob encomenda', g: 1 },
    { id: 'dig_dados', nome: 'organizar dados que alguém não devia ter', g: 1, valor: 0.9 },
    { id: 'dig_cliente', nome: 'um trabalho para um cliente de fora, que paga bem e pergunta pouco', g: 2 },
    { id: 'dig_manutencao', nome: 'manter funcionando o sistema de um esquema', g: 2, valor: 0.9, chance: 0.06, risco: 1.2 },
    { id: 'dig_estrutura', nome: 'montar a estrutura de um esquema grande de outro', g: 3 },
    { id: 'dig_golpe', nome: 'montar um golpe grande pela internet, para outro', g: 3, valor: 1.3, chance: -0.06, risco: 1.3 }
  ],
  fraudes: [
    { id: 'frau_assinatura', nome: 'uma assinatura onde não devia', g: 1 },
    { id: 'frau_documento', nome: 'um documento que diz o que não é', g: 1, valor: 0.9 },
    { id: 'frau_concorrencia', nome: 'um acerto numa concorrência', g: 2 },
    { id: 'frau_nota', nome: 'notas que esquentam uma venda que não houve', g: 2, valor: 1.1 },
    { id: 'frau_esquentar', nome: 'fazer o dinheiro de alguém parecer limpo', g: 3 },
    { id: 'frau_obra', nome: 'um contrato inflado de obra, com gente de cargo', g: 3, valor: 1.5, chance: -0.08, risco: 1.3 }
  ]
};
export const tipoDeEncomenda = (id: string) => Object.values(TIPOS).flat().find(t => t.id === id);

/** Meses da renda de referência que cada gravidade vale (REWORK 12.25: o trabalho tem de valer a pena — e o risco). */
const MESES_DA_GRAVIDADE = [0, 2.5, 6, 14] as const;
const BASE_DA_CHANCE = [0, 0.84, 0.72, 0.6] as const;
const EXPOSICAO_DO_ERRO = [0, 6, 10, 16] as const;
/**
 * O quanto o ramo expõe, RELATIVO aos furtos (a exposição de `PERFIL` é em pontos por ano, não um fator: usá-la direto fazia
 * uma encomenda grande "arriscar" ~190 pontos — uma só levava a exposição ao teto).
 */
const fatorDeExposicao = (ramo: Ramo) => PERFIL[ramo].exposicao / PERFIL.furtos.exposicao;

/** O valor de um trabalho (a régua do ramo, o patamar, e — para quem já é muito rico — a escala do patrimônio). */
export function valorDoTrabalho(v: Vida, ramo: Ramo, g: 1 | 2 | 3): number {
  const base = valorDaOperacao(v, ramo, MESES_DA_GRAVIDADE[g]) * escalaDe(v);
  const p = patamarAtual(v);
  // REWORK 12.35 · balanço: a parte que crescia com o patrimônio (a espiral de quem já é rico) ficou bem menor, e com teto.
  const grande = p >= 3 ? Math.min(base * 2, Math.max(0, balanco(v).liquido) * [0, 0.0005, 0.0015, 0.004][g]) : 0;
  return Math.round((base + grande) / 100) * 100;
}

/** A chance de dar certo (a prática no ramo, a confiança em quem está junto, a exposição, a sequência de erros). */
export function chanceDoTrabalho(v: Vida, ramo: Ramo, g: 1 | 2 | 3, confianca = 40): number {
  const e = env(v)!;
  const s = e.especializacoes?.[ramo];
  const seguidas = garantirCarreira(e).falhasSeguidas ?? 0;
  // O favor de um contato (`redeCriminal`: alguém do seu lado neste ano) ajuda no próximo trabalho.
  const apoio = v.fatos['sub125_apoio'] === v.t ? 0.08 : 0;
  return clamp(BASE_DA_CHANCE[g] + (s?.experiencia ?? 0) / 250 + (confianca - 40) / 400 - e.exposicao / 600 - (PERFIL[ramo].falha - 0.2) * 0.5 + (seguidas >= 2 ? 0.12 : 0) + (e.cautela ? 0.05 : 0) + apoio, 0.3, 0.94);
}

export const encomendas = (v: Vida) => env(v)?.encomendas ?? [];
export const abertas = (v: Vida) => encomendas(v).filter(x => x.direcao === 'recebida' && x.estado === 'aberta' && x.tPrazo > v.t);
export const delegadas = (v: Vida) => encomendas(v).filter(x => x.direcao === 'delegada' && x.estado === 'em_andamento');
/** Quantas encomendas a alguém podem correr ao mesmo tempo (o patamar e o posto dão gente para isso). */
export const limiteDeDelegadas = (v: Vida) => 1 + Math.floor(patamarAtual(v) / 2) + (nivelNaOrganizacao(v) >= 3 || temOrganizacaoPropria(v) ? 1 : 0);

/** Uma proposta nova (de um contato ou de uma organização). */
export function proporEncomenda(v: Vida, r: Rng, ramo: Ramo, de: { pessoaId?: string; orgId?: string }, g?: 1 | 2 | 3): EncomendaCriminal | undefined {
  const e = env(v);
  if (!e) return undefined;
  const xp = e.especializacoes?.[ramo]?.experiencia ?? 0;
  const p = patamarAtual(v);
  const grav: 1 | 2 | 3 = g ?? (r.chance(clamp(0.15 + xp / 200 + p * 0.1, 0, 0.75)) ? (r.chance(0.25 + p * 0.12) ? 3 : 2) : 1);
  // REWORK 12.35: os trabalhos de posto só chegam a quem tem o posto (e, para quem tem, chegam mais).
  const posto = de.orgId ? nivelNaOrganizacao(v) : -1;
  const cabem = TIPOS[ramo].filter(t => t.g === grav && (t.nivel === undefined || (de.orgId && posto >= t.nivel)));
  const deposto = cabem.filter(t => t.nivel !== undefined);
  const opcoes = deposto.length && r.chance(0.6) ? deposto : cabem;
  const tipo = (opcoes.length ? r.pick(opcoes) : TIPOS[ramo][0]);
  const conf = de.pessoaId ? e.fichas?.[de.pessoaId]?.confianca ?? 40 : 45;
  // REWORK 12.35 · o mercado da cidade (a procura) e o jeito da organização (a discreta paga menos e expõe menos).
  const d = demandaDe(v, v.moradia.municipioId, ramo);
  const org = de.orgId ? v.mundoCriminal?.orgs[de.orgId] : undefined;
  const jeito = org ? jeitoDe(org) : undefined;
  const valor = Math.round(valorDoTrabalho(v, ramo, tipo.g) * (tipo.valor ?? 1) * (1 + d * 0.1) * (jeito ? Math.sqrt(jeito.paga) : 1) * (0.85 + r.next() * 0.35) / 100) * 100;
  const x: EncomendaCriminal = {
    id: novoId(v, 'enc'), direcao: 'recebida', ramo, tipo: tipo.id, gravidade: tipo.g, ...de,
    valor, chance: Math.round(clamp(chanceDoTrabalho(v, ramo, tipo.g, conf) + (tipo.chance ?? 0), 0.25, 0.95) * 100) / 100,
    risco: Math.round(EXPOSICAO_DO_ERRO[tipo.g] * fatorDeExposicao(ramo) * (tipo.risco ?? 1) * (jeito ? Math.sqrt(jeito.policia) : 1) * (1 + Math.max(0, d) * 0.05)),
    t: v.t, tPrazo: v.t + 12, estado: 'aberta'
  };
  (e.encomendas ??= []).push(x);
  podar(v);
  return x;
}

/** A lista não cresce sem fim: só as últimas 24 (as abertas e as em andamento ficam sempre). */
function podar(v: Vida): void {
  const e = env(v)!;
  const xs = e.encomendas ?? [];
  const vivas = xs.filter(x => x.estado === 'aberta' || x.estado === 'em_andamento');
  const passadas = xs.filter(x => x.estado !== 'aberta' && x.estado !== 'em_andamento').slice(-24);
  e.encomendas = [...passadas, ...vivas].sort((a, b) => a.t - b.t);
}

/* ---------------------------------------------------------------- o ano */

/** As propostas do ano (dos contatos de confiança e da organização) e os resultados das encomendas que venceram. */
export function processarEncomendas(v: Vida): void {
  const e = env(v);
  if (!e) return;
  const r = rngDe(v.id, 'encomendas', v.t);
  // As que venceram sem resposta.
  for (const x of e.encomendas ?? []) if (x.direcao === 'recebida' && x.estado === 'aberta' && x.tPrazo <= v.t) { x.estado = 'expirou'; x.tFim = v.t; }
  // As delegadas que chegaram ao prazo (correm mesmo para quem foi preso: o resultado chega igual).
  for (const x of delegadas(v)) if (x.tPrazo <= v.t) resolverDelegada(v, x);
  if (!ativo(v) || preso(v) || v.justica?.foragido) return;
  // As propostas: dos contatos de confiança (um por contato, no ramo dele) e da organização de que se é de dentro ou aliado.
  const jaAbertas = abertas(v).length;
  let novas = 0;
  for (const c of contatosAtivos(v)) {
    if (jaAbertas + novas >= 3) break;
    if (c.f.confianca < 32 || c.f.papel === 'informante') continue;
    if (!ramosAtivos(e).includes(c.f.especialidade) && c.f.especialidade !== ramoPrincipal(e)) continue;
    // REWORK 12.35 · D8: de longe, menos propostas; de outro país, nenhuma (a não ser o que se faz à distância).
    const alc = alcanceDoContato(v, c.id);
    if (alc === 'fora') continue;
    if (r.chance((0.25 + c.f.confianca / 250 + (c.f.favores ?? 0) * 0.04 + (e.cautela ? -0.12 : 0)) * (alc === 'longe' ? 0.4 : 1))) { proporEncomenda(v, r, c.f.especialidade, { pessoaId: c.id }); novas++; }
  }
  // O meio também procura quem tem nome (ou prática): alguém novo chega com uma proposta — e vira contato.
  if (jaAbertas + novas < 2 && r.chance(0.35 + reputacaoAqui(v) / 250 + garantirCarreira(e).xp / 400 - (e.cautela ? 0.2 : 0))) {
    const ramo = ramoPrincipal(e);
    const id = criarContato(v, ramo, ramo === 'contrabando' ? 'comprador' : 'intermediario', 23);
    proporEncomenda(v, r, ramo, { pessoaId: id });
    novas++;
  }
  const org = (e.organizacoes ?? []).find(o => (o.relacao === 'membro' || o.relacao === 'aliada') && o.saiu === undefined && o.expulso === undefined && !o.propria && o.distancia !== 'fora');
  if (org && jaAbertas + novas < 4 && r.chance(0.35 + org.lealdade / 250 + (org.relacao === 'membro' ? 0.15 : 0))) proporEncomenda(v, r, org.especialidade, { orgId: org.id });
}

/* ---------------------------------------------------------------- as ações */

export type OqueEncomenda = 'aceitar' | 'recusar' | 'negociar' | 'delegar';

export function disponibilidadeEncomenda(v: Vida, oque: OqueEncomenda, id?: string, pessoaId?: string, tipo?: string): Veredito {
  const e = env(v);
  if (!e || !ativo(v)) return bloqueio('impossivel', 'Você não está nisso agora.');
  if (preso(v)) return bloqueio('impossivel', 'Na prisão, não.');
  if (v.justica?.foragido) return bloqueio('impossivel', 'Foragido, ninguém confia trabalho a você — nem você deveria aparecer.');
  if (oque === 'delegar') {
    const f = pessoaId ? e.fichas?.[pessoaId] : undefined;
    const t = tipo ? tipoDeEncomenda(tipo) : undefined;
    if (!f || !t || !contatosAtivos(v).some(c => c.id === pessoaId)) return bloqueio('impossivel', 'Encomendar a quem?');
    if (delegadas(v).length >= limiteDeDelegadas(v)) return bloqueio('incompativel', `Você já tem ${delegadas(v).length === 1 ? 'uma encomenda correndo' : `${delegadas(v).length} encomendas correndo`}: mais que isso, ninguém acompanha.`);
    if (f.confianca < 30) return bloqueio('requisito', `${v.pessoas[pessoaId!].nome} não confia em você o bastante para isso (nem você nele).`);
    if (t.g === 3 && patamarAtual(v) < 2) return bloqueio('requisito', 'Encomendar algo desse tamanho pede um nome que você ainda não tem.');
    if (delegadas(v).some(x => x.pessoaId === pessoaId)) return bloqueio('incompativel', 'Essa pessoa já está cuidando de uma encomenda sua.');
    const custo = custoDeDelegar(v, t.id);
    const d = vereditoDePagar(v, custo, 'Adiantar custa uns');
    if (d.grau !== 'permitido') return d;
    return { grau: 'irregular', motivo: `É crime. Corre em segundo plano: o resultado chega em um ano — e quem faz pode errar, ou sumir com o dinheiro.` };
  }
  const x = encomendas(v).find(y => y.id === id);
  if (!x || x.direcao !== 'recebida' || x.estado !== 'aberta' || x.tPrazo <= v.t) return bloqueio('impossivel', 'Essa proposta não está mais de pé.');
  if (oque === 'negociar' && x.negociada) return bloqueio('incompativel', 'Já se negociou essa: agora é aceitar ou recusar.');
  if (oque === 'aceitar') {
    if (!temTempo(v)) return bloqueio('incompativel', 'O ano não tem mais tempo para isso: o emprego, a casa e o que você já aceitou ocupam a semana.');
    if (x.gravidade === 3 && idade(v) < 18) return bloqueio('impossivel', 'Cedo demais para algo desse tamanho.');
    return { grau: 'irregular', motivo: `É crime. ${Math.round(x.chance * 100)}% de dar certo; se der errado, mais gente fica sabendo.` };
  }
  return PERMITIDO;
}

/** O adiantamento para encomendar um trabalho a alguém (o valor do trabalho, em parte). */
export function custoDeDelegar(v: Vida, tipo: string): number {
  const t = tipoDeEncomenda(tipo)!;
  const ramo = (Object.keys(TIPOS) as Ramo[]).find(r => TIPOS[r].some(x => x.id === tipo))!;
  return Math.round(valorDoTrabalho(v, ramo, t.g) * 0.4 / 100) * 100;
}

export function executarEncomenda(v: Vida, oque: OqueEncomenda, id?: string, pessoaId?: string, tipo?: string): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const r = rngDe(v.id, 'encomenda', oque, id ?? tipo ?? '', v.t);
  if (oque === 'delegar') return delegar(v, r, pessoaId!, tipo!);
  const x = encomendas(v).find(y => y.id === id)!;
  const quem = x.pessoaId ? v.pessoas[x.pessoaId]?.nome : x.orgId ? orgPorId(v, x.orgId)?.nome : undefined;
  const nome = tipoDeEncomenda(x.tipo)?.nome ?? 'um trabalho';
  if (oque === 'recusar') {
    x.estado = 'recusada'; x.tFim = v.t;
    if (x.pessoaId) { mudarConfianca(v, x.pessoaId, -2); historiaDoContato(v, x.pessoaId, `Você recusou um trabalho ${flex(v.pessoas[x.pessoaId]?.genero ?? 'masculino', 'dele', 'dela', 'delu')}.`); }
    if (x.orgId) { const o = orgPorId(v, x.orgId); if (o) o.lealdade = clamp(o.lealdade - (o.relacao === 'membro' ? 4 : 1)); }
    const reac = x.pessoaId ? ({ leal: 'entendeu, e disse que a porta continua aberta', desconfiado: 'anotou a recusa — e vai lembrar', pragmatico: 'levou a proposta para outra pessoa no mesmo dia', esquentado: 'não gostou e deixou isso claro', caloroso: 'disse que não tem problema, e pareceu sincero' } as const)[vozDe(v, x.pessoaId)] : x.orgId ? (orgPorId(v, x.orgId)?.relacao === 'membro' ? 'anotou: de quem é de dentro, recusa pesa' : 'seguiu em frente sem você') : undefined;
    return { texto: `Você recusou ${nome}.${quem && reac ? ` ${cap(quem)} ${reac}.` : ''}` };
  }
  if (oque === 'negociar') {
    x.negociada = true;
    const f = x.pessoaId ? e.fichas?.[x.pessoaId] : undefined;
    const o = x.orgId ? orgPorId(v, x.orgId) : undefined;
    const disposicao = (f ? f.confianca / 200 + (f.favores ?? 0) * 0.05 + (f.amizade ?? 0) / 400 : (o?.lealdade ?? 40) / 200) + patamarAtual(v) * 0.05;
    const y = r.next();
    if (y < 0.25 + disposicao) {
      x.valor = Math.round(x.valor * 1.25 / 100) * 100;
      return { texto: `${quem ? cap(quem) : 'Quem propôs'} topou: ${dinheiroCurto(x.valor)} agora. A proposta continua de pé.`, tom: 'bom' };
    }
    if (y < 0.6 + disposicao / 2) {
      x.valor = Math.round(x.valor * 1.12 / 100) * 100;
      x.risco = Math.round(x.risco * 1.25);
      x.chance = Math.round(Math.max(0.3, x.chance - 0.05) * 100) / 100;
      return { texto: `Voltaram com outra proposta: ${dinheiroCurto(x.valor)}, mas com mais coisa no meio (um pouco mais de risco).` };
    }
    x.estado = 'recusada'; x.tFim = v.t;
    if (x.pessoaId) mudarConfianca(v, x.pessoaId, -3);
    return { texto: `${quem ? cap(quem) : 'Quem propôs'} não gostou da conversa e levou a proposta para outra pessoa.`, tom: 'ruim' };
  }
  // Aceitar: o trabalho acontece no ano (abstrato) e ocupa tempo.
  usarTempo(v, x.tipo);
  return realizar(v, r, x);
}

/**
 * Um trabalho feito pela própria pessoa (a encomenda aceita): dá certo (inteiro, pela metade, ou melhor que o combinado) — ou
 * dá errado de um jeito que conta história. REWORK 12.3 · D: o texto sai do estado (quem propôs e o que há entre vocês, o
 * seu lugar no trabalho, a reação de quem estava junto) — `relatoDoCrime`.
 */
function realizar(v: Vida, r: Rng, x: EncomendaCriminal): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const c = garantirCarreira(e);
  const s = e.especializacoes?.[x.ramo];
  const nome = tipoDeEncomenda(x.tipo)?.nome ?? 'o trabalho';
  const ctx = contextoDaEncomenda(v, x, nome);
  const lugar = seuLugar(v, x.gravidade, x.id);
  const y = r.next();
  const deu = y < x.chance;
  // REWORK 12.3 · D4: o sucesso tem graus — o inesperado (o comprador pagou mais, sobrou mercadoria) e o parcial (pagaram
  // menos, parte ficou para trás) — e cada um mexe no dinheiro, na confiança e no nome de um jeito.
  const desfecho: 'inesperado' | 'completo' | 'parcial' = !deu ? 'completo' : y < x.chance * 0.1 ? 'inesperado' : y > x.chance * 0.86 ? 'parcial' : 'completo';
  if (s) { s.operacoes++; s.ultima = v.t; s.experiencia = clamp(s.experiencia + (deu ? 4 : 2) + x.gravidade); }
  x.tFim = v.t;
  if (deu) {
    x.estado = 'concluida';
    c.falhasSeguidas = 0;
    const fator = desfecho === 'inesperado' ? 1.3 + r.next() * 0.2 : desfecho === 'parcial' ? 0.55 + r.next() * 0.2 : 1;
    const liq = Math.round(x.valor * 0.8 * fator / 100) * 100;
    movimentoPorFora(v, 'encomendas', liq);
    e.ganhos += Math.round(x.valor * fator);
    if (s) s.ganhos += Math.round(x.valor * fator);
    e.exposicao = clamp(e.exposicao + Math.round(x.risco * (desfecho === 'parcial' ? 0.5 : 0.3)));
    e.reputacao = clamp((e.reputacao ?? 0) + x.gravidade * (desfecho === 'parcial' ? 1 : 2) + (desfecho === 'inesperado' ? 2 : 0));
    ganharPratica(v, 3 + x.gravidade * 2);
    if (x.pessoaId) { mudarConfianca(v, x.pessoaId, (desfecho === 'parcial' ? 1 : 3) + x.gravidade); historiaDoContato(v, x.pessoaId, desfecho === 'parcial' ? `${cap(nome)}: saiu pela metade.` : `${cap(nome)}: deu certo.`, 'bom'); }
    if (x.orgId) { const o = orgPorId(v, x.orgId); if (o) lembrarOrg(o, v.t, 'favor', desfecho === 'parcial' ? 2 : 3 + x.gravidade * 2); }
    const primeira = !c.marcos.some(m => m.texto.startsWith('A primeira encomenda'));
    if (primeira) marco(v, 'A primeira encomenda cumprida: o nome passou a circular de outro jeito.', false);
    if (x.gravidade === 3) marco(v, `Cumpriu um trabalho grande: ${nome}.`, false);
    anotar(v, `${cap(nome)} (${ctx.de}): ${desfecho === 'parcial' ? 'pela metade, ' : desfecho === 'inesperado' ? 'melhor que o combinado, ' : ''}${dinheiroCurto(liq)}.`, 'bom');
    x.resultado = desfecho === 'parcial' ? `Saiu pela metade: ${dinheiroCurto(liq)}.` : desfecho === 'inesperado' ? `Melhor que o combinado: ${dinheiroCurto(liq)}.` : `Deu certo: ${dinheiroCurto(liq)} no bolso.`;
    const resultado = desfecho === 'inesperado'
      ? variante(v, 'enc_inesperado', [`Saiu melhor que o combinado: ${dinheiroCurto(liq)} para você, depois das partes.`, `Sobrou mais do que se esperava, e a sua parte ficou em ${dinheiroCurto(liq)}.`], x.id)
      : desfecho === 'parcial'
        ? variante(v, 'enc_parcial', [`Deu certo pela metade: pagaram menos que o combinado, e a sua parte ficou em ${dinheiroCurto(liq)}.`, `Uma parte se perdeu no caminho. Sobraram ${dinheiroCurto(liq)} para você — e mais gente do que devia viu.`], x.id)
        : variante(v, `enc_ok_${x.gravidade}`, [`Saiu como combinado: ${dinheiroCurto(liq)} para você depois das partes.`, `Ninguém viu, ninguém perguntou: ${dinheiroCurto(liq)} no seu bolso.`, `Foi limpo. A sua parte: ${dinheiroCurto(liq)}.`], x.id);
    const reacao = ctx.pessoa ? reacaoAoSucesso(v, ctx.pessoa.id, liq) : ctx.org ? reacaoDaOrg(v, ctx.org, true) : '';
    const fecho = primeira ? ' Foi a primeira encomenda cumprida: o seu nome passou a circular.' : '';
    return { texto: `${ctx.frase} ${lugar}. ${resultado} ${reacao}${fecho}`.replace(/\s+/g, ' ').trim(), tom: 'bom' };
  }
  x.estado = 'falhou';
  c.falhasSeguidas = (c.falhasSeguidas ?? 0) + 1;
  // REWORK 12.35: o trabalho grande que dá errado pode terminar numa perseguição (no fim do ano: `conflitosCriminais`).
  marcarFalhaGrave(v, x.gravidade);
  const out = falhaInteressante(v, r, x);
  x.resultado = out.texto;
  const reacao = ctx.pessoa ? reacaoAoFracasso(v, ctx.pessoa.id) : ctx.org ? reacaoDaOrg(v, ctx.org, false) : '';
  return { texto: `${ctx.frase} ${lugar}. ${out.texto} ${reacao}`.replace(/\s+/g, ' ').trim(), tom: out.tom };
}

/**
 * Dar errado, com contexto: o que se perde (às vezes nada), o que se aprende, quem aparece, o que se deve, quem se irrita,
 * a porta que fica aberta. A exposição sobe em parte dos casos — não em todos.
 */
export function falhaInteressante(v: Vida, r: Rng, x: EncomendaCriminal): { texto: string; tom: 'ruim' | undefined } {
  const e = env(v)!;
  const s = e.especializacoes?.[x.ramo];
  const nome = tipoDeEncomenda(x.tipo)?.nome ?? 'o trabalho';
  const temOrg = !!x.orgId;
  const opcoes: { id: string; peso: number }[] = [
    { id: 'aprendeu', peso: 3 + (s && s.experiencia < 40 ? 2 : 0) },
    { id: 'contato', peso: 2 },
    { id: 'divida', peso: x.gravidade >= 2 ? 2 : 0.5 },
    { id: 'conflito', peso: temOrg || x.ramo === 'contrabando' || x.ramo === 'organizado' ? 2 : 0.5 },
    { id: 'oportunidade', peso: 1.5 },
    { id: 'perda', peso: 2.5 },
    { id: 'exposto', peso: 1 + x.gravidade }
  ];
  const k = r.weighted(opcoes, o => o.peso)!.id;
  ganharPratica(v, 2);
  if (x.pessoaId) historiaDoContato(v, x.pessoaId, 'Um trabalho juntos deu errado.', 'ruim');
  abalar(v, 'o trabalho que deu errado', -3, 6);
  switch (k) {
    case 'aprendeu':
      if (s) s.experiencia = clamp(s.experiencia + 5);
      anotar(v, `${cap(nome)} deu errado — e ensinou.`);
      return { texto: variante(v, 'falha_aprendeu', ['Deu errado, e saiu barato: nada entrou, ninguém viu. Você aprendeu o que não repetir.', 'Não deu. Ninguém se feriu, nada se perdeu — só o tempo, e uma lição que fica.', 'Voltou de mãos vazias, mas sabendo exatamente onde errou.'], x.id), tom: undefined };
    case 'contato': {
      const id = criarContato(v, x.ramo, undefined, 7);
      anotar(v, `${cap(nome)} deu errado; ${v.pessoas[id].nome} viu como você se virou.`);
      return { texto: variante(v, 'falha_contato', [`Deu errado — mas ${v.pessoas[id].nome}, que estava por perto, gostou de como você segurou a situação. Um contato novo.`, `Não saiu nada. Saiu, porém, um conhecido: ${v.pessoas[id].nome} viu você manter a calma e pediu o seu número.`], x.id), tom: undefined };
    }
    case 'divida': {
      const valor = Math.round(x.valor * 0.3 / 100) * 100;
      e.divida = (e.divida ?? 0) + valor;
      if (x.pessoaId) { const f = e.fichas?.[x.pessoaId]; if (f) f.favores = (f.favores ?? 0) - 1; }
      anotar(v, `${cap(nome)} deu errado e deixou uma dívida de ${dinheiroCurto(valor)}.`, 'ruim');
      const credor = x.pessoaId ? v.pessoas[x.pessoaId]?.nome : x.orgId ? orgPorId(v, x.orgId)?.nome : undefined;
      return { texto: variante(v, 'falha_divida', [`Deu errado, e o prejuízo ${credor ? `de ${credor}` : 'de quem estava junto'} virou dívida sua: ${dinheiroCurto(valor)}.`, `Não deu, e alguém tinha de cobrir a perda. Ficou com você: ${dinheiroCurto(valor)} devidos${credor ? ` a ${credor}` : ''}.`], x.id), tom: 'ruim' };
    }
    case 'conflito': {
      const o = x.orgId ? orgPorId(v, x.orgId) : rivalDoRamo(v, x.ramo);
      if (o) lembrarOrg(o, v.t, 'conflito', -6);
      e.atritos = (e.atritos ?? 0) + 1;
      anotar(v, `${cap(nome)} deu errado e virou assunto com ${o?.nome ?? 'gente do meio'}.`, 'ruim');
      return { texto: variante(v, 'falha_conflito', [`Deu errado, e ${o ? o.nome : 'gente do meio'} pôs a culpa em você. Vai ter conversa.`, `Não deu certo — e, para ${o ? o.nome : 'quem estava em volta'}, o culpado tem nome: o seu.`], x.id), tom: 'ruim' };
    }
    case 'oportunidade': {
      const outra = proporEncomenda(v, r, x.ramo, { ...(x.pessoaId ? { pessoaId: x.pessoaId } : {}), ...(x.orgId ? { orgId: x.orgId } : {}) }, 1);
      if (outra) { outra.chance = Math.min(0.95, outra.chance + 0.08); outra.tPrazo = v.t + 18; }
      return { texto: variante(v, 'falha_oportunidade', ['Deu errado, mas quem propôs não desistiu de você: já tem outra coisa, menor e mais segura, esperando em Encomendas.', 'Não deu. Mesmo assim, voltaram a chamar: um trabalho menor, com mais chance, está em Encomendas.'], x.id), tom: undefined };
    }
    case 'perda': {
      const custo = Math.round(x.valor * 0.15 / 100) * 100;
      pagarPorFora(v, 'perdas', custo);
      return { texto: variante(v, 'falha_perda', [`Deu errado. Nada entrou, e ainda foi preciso cobrir ${dinheiroCurto(custo)} do que se perdeu.`, `Não só não rendeu: custou ${dinheiroCurto(custo)} do seu bolso para fechar o buraco.`], x.id), tom: 'ruim' };
    }
    default: {
      e.exposicao = clamp(e.exposicao + x.risco);
      e.reputacao = clamp((e.reputacao ?? 0) - 3);
      anotar(v, `${cap(nome)} deu errado e deixou rastro.`, 'ruim');
      return { texto: variante(v, 'falha_exposto', ['Deu errado — e deixou rastro. Mais gente sabe do seu nome agora.', 'Não deu, e pior: alguém viu, alguém comentou. O seu nome começou a circular onde não devia.'], x.id), tom: 'ruim' };
    }
  }
}

/* ---------------------------------------------------------------- delegar */

function delegar(v: Vida, r: Rng, pessoaId: string, tipo: string): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const t = tipoDeEncomenda(tipo)!;
  const ramo = (Object.keys(TIPOS) as Ramo[]).find(k => TIPOS[k].some(x => x.id === tipo))!;
  const f = e.fichas![pessoaId];
  const custo = custoDeDelegar(v, tipo);
  pagarPorFora(v, 'custos', custo);
  const valor = valorDoTrabalho(v, ramo, t.g);
  const chance = clamp(chanceDoTrabalho(v, ramo, t.g, f.confianca) - 0.04 + ((f.favores ?? 0) > 0 ? 0.05 : 0) + (f.especialidade === ramo ? 0.06 : -0.08), 0.25, 0.92);
  const x: EncomendaCriminal = {
    id: novoId(v, 'enc'), direcao: 'delegada', ramo, tipo, gravidade: t.g, pessoaId, valor: custo,
    retorno: Math.round(valor * (0.95 + r.next() * 0.3) / 100) * 100, chance: Math.round(chance * 100) / 100,
    risco: Math.round(EXPOSICAO_DO_ERRO[t.g] * fatorDeExposicao(ramo) * 0.6), t: v.t, tPrazo: v.t + 12, estado: 'em_andamento'
  };
  (e.encomendas ??= []).push(x);
  e.exposicao = clamp(e.exposicao + 2);
  historiaDoContato(v, pessoaId, `Você encomendou a ${flex(v.pessoas[pessoaId].genero, 'ele', 'ela', 'elu')} ${t.nome}.`);
  anotar(v, `Encomendou a ${v.pessoas[pessoaId].nome}: ${t.nome} (${dinheiroCurto(custo)} adiantados).`);
  if (!garantirCarreira(e).marcos.some(m => m.texto.startsWith('A primeira vez que encomendou'))) marco(v, 'A primeira vez que encomendou um trabalho a outra pessoa: o caminho deixou de depender só das suas mãos.', false);
  return { texto: `${v.pessoas[pessoaId].nome} ficou com ${t.nome}. ${dinheiroCurto(custo)} adiantados; o resultado chega em um ano. Você não precisa estar lá — e não controla o que acontece.` };
}

/** O resultado de uma encomenda feita a alguém (no ano em que vence). */
export function resolverDelegada(v: Vida, x: EncomendaCriminal): void {
  const e = env(v)!;
  const r = rngDe(v.id, 'delegada', x.id, v.t);
  const f = x.pessoaId ? e.fichas?.[x.pessoaId] : undefined;
  const p = x.pessoaId ? v.pessoas[x.pessoaId] : undefined;
  const nome = tipoDeEncomenda(x.tipo)?.nome ?? 'o trabalho';
  x.tFim = v.t;
  // Quem some com o dinheiro: a confiança baixa, as promessas quebradas, nenhuma amizade.
  const trai = f && p?.vivo ? clamp(0.22 - f.confianca / 300 - (f.amizade ?? 0) / 400 + (f.quebradas - f.cumpridas) * 0.05 + ((f.favores ?? 0) < 0 ? 0.04 : 0), 0.01, 0.3) : 0;
  if (!p?.vivo) {
    x.estado = 'falhou';
    x.resultado = 'Quem ia fazer não está mais aqui. O adiantamento se perdeu.';
    anotar(v, `${nome}: perdida — quem ia fazer não está mais aqui.`, 'ruim');
    return;
  }
  if (r.chance(trai)) {
    x.estado = 'traida';
    f!.traiu = v.t;
    e.exposicao = clamp(e.exposicao + 12);
    e.traicoes = (e.traicoes ?? 0) + 1;
    x.resultado = `${p.nome} sumiu com o adiantamento — e falou o seu nome para se livrar.`;
    anotar(v, `${p.nome} sumiu com o adiantamento de ${nome} e falou demais.`, 'ruim');
    escrever(v, { texto: `${p.nome}, a quem você tinha encomendado um trabalho, sumiu com o dinheiro e falou o seu nome para quem não devia.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', pessoas: [p.id] });
    return;
  }
  if (r.chance(x.chance)) {
    x.estado = 'concluida';
    movimentoPorFora(v, 'encomendas', x.retorno ?? 0);
    e.ganhos += x.retorno ?? 0;
    ganharPratica(v, 2 + x.gravidade);
    if (f) { f.confianca = clamp(f.confianca + 5); f.cumpridas++; f.favores = (f.favores ?? 0) + 1; }
    historiaDoContato(v, p.id, 'Cumpriu o trabalho que você encomendou.', 'bom');
    x.resultado = `Feito: ${dinheiroCurto(x.retorno ?? 0)} chegaram.`;
    anotar(v, `${p.nome} cumpriu ${nome}: ${dinheiroCurto(x.retorno ?? 0)}.`, 'bom');
    return;
  }
  x.estado = 'falhou';
  e.exposicao = clamp(e.exposicao + Math.round(x.risco * (r.chance(0.5) ? 1 : 0.3)));
  if (f) f.confianca = clamp(f.confianca - 4);
  // Quem foi pego no seu trabalho pode responder por ele — e lembrar de quem mandou.
  if (f && r.chance(0.25 * x.gravidade)) { f.afastado = v.t; historiaDoContato(v, p.id, 'Foi pego num trabalho seu e se afastou.', 'ruim'); x.resultado = `Deu errado: ${p.nome} foi pego e não quer mais saber de você.`; }
  else x.resultado = `Deu errado: o adiantamento se perdeu, ${p.nome} voltou sem nada.`;
  anotar(v, `${nome}, encomendado a ${p.nome}, deu errado.`, 'ruim');
}

/** As encomendas para a tela: as propostas abertas, as que correm, as que terminaram (com o resultado). */
export function leituraDasEncomendas(v: Vida) {
  const e = env(v);
  const fmt = (x: EncomendaCriminal) => ({
    id: x.id, nome: tipoDeEncomenda(x.tipo)?.nome ?? 'um trabalho', ramo: NOME_DO_RAMO[x.ramo], gravidade: x.gravidade,
    de: x.pessoaId ? v.pessoas[x.pessoaId]?.nome : x.orgId ? orgPorId(v, x.orgId)?.nome : undefined,
    valor: x.valor, retorno: x.retorno, chance: x.chance, risco: x.risco, prazo: x.tPrazo, estado: x.estado, resultado: x.resultado, negociada: !!x.negociada
  });
  return {
    abertas: abertas(v).map(fmt),
    correndo: delegadas(v).map(fmt),
    passadas: (e?.encomendas ?? []).filter(x => x.estado !== 'aberta' && x.estado !== 'em_andamento' && x.estado !== 'expirou').slice(-8).reverse().map(fmt),
    limite: limiteDeDelegadas(v)
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
