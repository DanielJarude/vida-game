/**
 * REWORK 12.35 · O MERCADO DO CRIME E A REPUTAÇÃO POR LUGAR — o clandestino deixa de ser uma lista fixa.
 *
 *   A PROCURA     cada cidade e cada ramo têm a sua (−2..2), que anda com o mundo: a operação que fecha pontos derruba a
 *                 procura (e o risco sobe); a organização que some deixa um vazio; a crise econômica empurra os furtos e o
 *                 contrabando; a comunidade que se organiza esfria tudo. Os trabalhos pagam (e expõem) conforme ela.
 *   OPORTUNIDADES aparecem e somem em um ano: a rival enfraquecida, a procura em alta, a parceria com uma organização de
 *                 fora, o espaço que alguém deixou, o cliente fixo de quem trabalha por conta. Cada uma com o que paga, a
 *                 chance e o risco DITOS ANTES — e a escolha de aceitar ou deixar passar.
 *   REPUTAÇÃO     o nome que se tem é de um lugar: na cidade onde se fez a carreira, alto; numa cidade nova, começa baixo
 *                 e se constrói de novo (as propostas e as portas das organizações leem o nome DAQUI).
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { OportunidadeCriminal, Ramo, Vida } from '../tipos';
import { escrever, emRecessao, novoId } from '../nucleo';
import { paisDaCidade } from '../dados/lugares';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { contrair, dinheiro } from '../texto';
import { ativo } from './ilicito';
import { preso } from './justica';
import { anotar, criarContato, lembrarOrg } from './submundo';
import { RAMOS, ramoPrincipal, ramosAtivos } from './ramos';
import { ganharPratica, movimentoPorFora } from './carreiraCriminal';
import { chanceDoTrabalho, valorDoTrabalho } from './encomendas';
import { definirEstado, estadoEntre, jeitoDe, nomeDaRegiao, orgViva, orgsDaCidade, regiaoDaPessoa, relacaoCom } from './faccoes';
import { marcarFalhaGrave, minhaOrg } from './conflitosCriminais';

const env = (v: Vida) => v.caminhos.envolvimento;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ================================================================ a procura */

export const demandaDe = (v: Vida, municipioId: string, ramo: Ramo): number => v.mundoCriminal?.mercados?.[`${municipioId}:${ramo}`]?.demanda ?? 0;
export const NOME_DA_DEMANDA = (d: number) => (d >= 1.2 ? 'em alta' : d >= 0.4 ? 'aquecida' : d > -0.4 ? 'normal' : d > -1.2 ? 'fraca' : 'parada');

function anoDosMercados(v: Vida, r: Rng): void {
  const m = v.mundoCriminal;
  if (!m) return;
  const ms = (m.mercados ??= {});
  const cidades = new Set([...Object.values(m.orgs).map(o => o.municipioId), v.moradia.municipioId]);
  const crise = emRecessao(v);
  for (const c of cidades) for (const ramo of RAMOS) {
    const k = `${c}:${ramo}`;
    const antes = ms[k]?.demanda ?? 0;
    const orgs = Object.values(m.orgs).filter(o => o.municipioId === c && o.ramo === ramo);
    const operacao = orgs.some(o => o.operacao?.t === v.t && (o.operacao.tipo === 'busca' || o.operacao.tipo === 'desmantelamento'));
    const vazio = orgs.some(o => o.estado === 'extinta' && o.historia.some(h => h.t === v.t));
    const voz = Object.entries(m.comunidade ?? {}).filter(([kk]) => kk.startsWith(`${c}:`)).reduce((s, [, x]) => Math.max(s, x), 0);
    const d = antes * 0.7 + (r.next() - 0.5) * 0.9 + (operacao ? -0.8 : 0) + (vazio ? 0.7 : 0) + (crise && (ramo === 'furtos' || ramo === 'contrabando') ? 0.35 : 0) - (voz >= 65 ? 0.2 : 0);
    ms[k] = { demanda: Math.round(clamp(d, -2, 2) * 100) / 100, t: v.t };
  }
}

/* ================================================================ a reputação por lugar */

/** O nome que se tem nesta cidade (o geral é a história inteira; o daqui é o que abre portas aqui). */
export function reputacaoAqui(v: Vida): number {
  const e = env(v);
  if (!e) return 0;
  return e.reputacaoLocal?.[v.moradia.municipioId] ?? e.reputacao ?? 0;
}

function anoDaReputacao(v: Vida): void {
  const e = env(v)!;
  const geral = e.reputacao ?? 0;
  const aqui = v.moradia.municipioId;
  const rl = (e.reputacaoLocal ??= {});
  // A primeira vez (save antigo, ou o começo): o nome geral é o da cidade de agora.
  if (!Object.keys(rl).length) { rl[aqui] = geral; v.fatos['rep_geral_antes'] = geral; return; }
  const antes = v.fatos['rep_geral_antes'] ?? geral;
  const ganho = geral - antes;
  v.fatos['rep_geral_antes'] = geral;
  if (rl[aqui] === undefined) {
    // Uma cidade nova: o nome chega pela metade (no mesmo país, contam histórias); de fora, quase nada.
    const de = Object.keys(rl).sort((a, b) => (rl[b] ?? 0) - (rl[a] ?? 0))[0];
    let mesmoPais = false;
    try { mesmoPais = !!de && paisDaCidade(v.moradia.municipioId) === paisDaCidade(de); } catch { mesmoPais = false; }
    rl[aqui] = Math.round(geral * (mesmoPais ? 0.45 : 0.15));
  }
  for (const k of Object.keys(rl)) {
    if (k === aqui) rl[k] = clamp(Math.round(rl[k] + Math.max(0, ganho) + (ativo(v) && rl[k] < geral * 0.8 ? 3 : 0)));
    else rl[k] = clamp(Math.round(rl[k] - 1));
  }
}

/* ================================================================ as oportunidades */

export const oportunidades = (v: Vida) => (v.mundoCriminal?.oportunidades ?? []).filter(o => o.estado === 'aberta' && o.tFim > v.t);

function anoDasOportunidades(v: Vida, r: Rng): void {
  const m = v.mundoCriminal!;
  const os = (m.oportunidades ??= []);
  for (const o of os) if (o.estado === 'aberta' && o.tFim <= v.t) o.estado = 'expirou';
  if (os.length > 16) m.oportunidades = os.filter(o => o.estado === 'aberta').concat(os.filter(o => o.estado !== 'aberta').slice(-10));
  const e = env(v)!;
  if (!ativo(v) || preso(v) || v.justica?.foragido || oportunidades(v).length >= 2) return;
  if (!r.chance(0.45)) return;
  const aqui = v.moradia.municipioId;
  const ramo = ramoPrincipal(e);
  const mo = minhaOrg(v);
  const cands: Omit<OportunidadeCriminal, 'id' | 't' | 'tFim' | 'estado'>[] = [];
  if (mo) {
    const fraca = orgsDaCidade(v).find(b => b.id !== mo.o.id && b.forca < 22 && ['rivalidade', 'concorrencia', 'conflito'].includes(estadoEntre(mo.o, b)));
    if (fraca) cands.push({ tipo: 'rival_fraco', municipioId: aqui, ramo: mo.o.ramo, orgId: fraca.id, valor: Math.round(valorDoTrabalho(v, mo.o.ramo, 2) * 1.5 / 100) * 100, chance: Math.round(clamp(0.6 + (mo.o.forca - fraca.forca) / 150, 0.3, 0.9) * 100) / 100, risco: 10 });
  }
  const d = demandaDe(v, aqui, ramo);
  if (d >= 1.1) cands.push({ tipo: 'demanda', municipioId: aqui, ramo, valor: Math.round(valorDoTrabalho(v, ramo, 2) * 1.6 / 100) * 100, chance: Math.round(clamp(chanceDoTrabalho(v, ramo, 2) - 0.05, 0.3, 0.9) * 100) / 100, risco: 12 });
  const parceira = orgsDaCidade(v).find(b => (!mo || (b.id !== mo.o.id && !['rivalidade', 'conflito', 'ruptura'].includes(estadoEntre(mo.o, b)))) && b.forca >= 30 && b.estado === 'ativa' && !(e.organizacoes ?? []).some(x => x.id === b.id && (x.relacao === 'rival' || x.expulso !== undefined)));
  if (parceira && (e.reputacao ?? 0) >= 25) cands.push({ tipo: 'parceria', municipioId: aqui, ramo: parceira.ramo, orgId: parceira.id, valor: Math.round(valorDoTrabalho(v, parceira.ramo, 2) * 1.3 / 100) * 100, chance: Math.round(clamp(0.62 + jeitoDe(parceira).negocia, 0.4, 0.85) * 100) / 100, risco: 8 });
  const sumiu = Object.values(m.orgs).find(o => o.municipioId === aqui && o.estado === 'extinta' && o.historia.some(h => v.t - h.t <= 12));
  if (sumiu) cands.push({ tipo: 'vazio', municipioId: aqui, ramo: sumiu.ramo, orgId: sumiu.id, valor: Math.round(valorDoTrabalho(v, sumiu.ramo, 2) * 1.2 / 100) * 100, chance: 0.7, risco: 8 });
  if (!mo && ramosAtivos(e).length) cands.push({ tipo: 'cliente', municipioId: aqui, ramo, valor: Math.round(valorDoTrabalho(v, ramo, 1) * 1.4 / 100) * 100, chance: 0.8, risco: 5 });
  if (!cands.length) return;
  const c = r.pick(cands);
  os.push({ ...c, id: novoId(v, 'opo'), t: v.t, tFim: v.t + 12, estado: 'aberta' });
}

const NOME_DA_OPORTUNIDADE: Record<OportunidadeCriminal['tipo'], (v: Vida, o: OportunidadeCriminal) => string> = {
  rival_fraco: (v, o) => `${cap(orgViva(v, o.orgId!)?.nome ?? 'uma rival')} está fraca: dá para tomar um ponto deles em ${nomeRegiao(v)}`,
  demanda: () => 'A procura está em alta: alguém paga bem por um trabalho grande, agora',
  parceria: (v, o) => `${cap(orgViva(v, o.orgId!)?.nome ?? 'uma organização')} propõe um negócio só deste ano, sem compromisso`,
  vazio: (v, o) => `${cap(orgViva(v, o.orgId!)?.nome ?? 'uma organização')} acabou, e o espaço dela ficou vazio`,
  cliente: () => 'Um cliente quer trabalhar só com você, por um bom tempo'
};
const nomeRegiao = (v: Vida) => nomeDaRegiao(v.moradia.municipioId, regiaoDaPessoa(v));
export const descricaoDaOportunidade = (v: Vida, o: OportunidadeCriminal) => NOME_DA_OPORTUNIDADE[o.tipo](v, o);

export function disponibilidadeOportunidade(v: Vida, id: string, oque: 'aceitar' | 'recusar'): Veredito {
  const o = oportunidades(v).find(x => x.id === id);
  if (!o) return bloqueio('impossivel', 'Essa oportunidade já passou.');
  if (preso(v)) return bloqueio('impossivel', 'Da prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  if (!ativo(v)) return bloqueio('incompativel', 'Você não está mais nisso.');
  if (o.municipioId !== v.moradia.municipioId) return bloqueio('incompativel', 'Ela era de outra cidade.');
  return oque === 'aceitar' ? { grau: 'irregular', motivo: `É crime. Paga uns ${dinheiro(o.valor)}; chance ${Math.round(o.chance * 100)}%; se der errado, exposição +${o.risco}.` } : PERMITIDO;
}

export function agirNaOportunidade(v: Vida, id: string, oque: 'aceitar' | 'recusar'): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const o = oportunidades(v).find(x => x.id === id)!;
  if (oque === 'recusar') { o.estado = 'recusada'; return { texto: 'Você deixou passar. Outra pessoa vai pegar — ou ninguém.' }; }
  o.estado = 'aceita';
  const r = rngDe(v.id, 'oportunidade', o.id);
  const deu = r.chance(o.chance);
  ganharPratica(v, 3);
  const mo = minhaOrg(v);
  if (!deu) {
    e.exposicao = clamp(e.exposicao + o.risco);
    marcarFalhaGrave(v, 2);
    o.resultado = 'deu errado';
    if (o.tipo === 'rival_fraco' && mo) lembrarOrg(mo.rel, v.t, 'conflito', -3);
    anotar(v, `Uma oportunidade que deu errado: ${descricaoDaOportunidade(v, o).toLowerCase()}.`, 'ruim');
    return { texto: `Não deu certo. Ficou o rastro (exposição +${o.risco}) — e nada no bolso.`, tom: 'ruim' };
  }
  const liq = Math.round(o.valor * 0.7 / 100) * 100;
  movimentoPorFora(v, 'ocasional', liq);
  e.ganhos += o.valor;
  e.exposicao = clamp(e.exposicao + Math.round(o.risco / 2));
  o.resultado = `deu certo: ${dinheiro(liq)}`;
  const rl = (e.reputacaoLocal ??= {});
  rl[v.moradia.municipioId] = clamp((rl[v.moradia.municipioId] ?? 0) + 4);
  let extra = '';
  switch (o.tipo) {
    case 'rival_fraco': {
      const b = orgViva(v, o.orgId!);
      if (b && mo) {
        const reg = regiaoDaPessoa(v);
        const tira = Math.min(b.influencia[reg] ?? 0, 10);
        b.influencia[reg] = clamp((b.influencia[reg] ?? 0) - tira); mo.o.influencia[reg] = clamp((mo.o.influencia[reg] ?? 0) + tira);
        b.forca = clamp(b.forca - 6);
        lembrarOrg(mo.rel, v.t, 'favor', 6);
        if (r.chance(0.3)) { definirEstado(mo.o, b, 'conflito'); extra = ` ${cap(b.nome)} não engoliu: agora é guerra.`; }
        else extra = ` ${cap(mo.o.nome)} ganhou espaço.`;
      }
      break;
    }
    case 'parceria': {
      const b = orgViva(v, o.orgId!);
      if (b) { const rel = relacaoCom(v, b); rel.lealdade = clamp(rel.lealdade + 8); lembrarOrg(rel, v.t, 'favor', 0); extra = ` ${cap(b.nome)} lembra de quem cumpriu.`; }
      if (b && mo && estadoEntre(mo.o, b) === 'concorrencia') { lembrarOrg(mo.rel, v.t, 'conflito', -4); extra += ` Em ${mo.o.nome}, não gostaram de ver você trabalhando para a concorrência.`; }
      break;
    }
    case 'vazio': rl[v.moradia.municipioId] = clamp((rl[v.moradia.municipioId] ?? 0) + 6); extra = ' O seu nome passou a ocupar parte do espaço que ficou.'; break;
    case 'cliente': {
      const id = criarContato(v, o.ramo, 'comprador', 41);
      const f = e.fichas?.[id];
      if (f) f.confianca = Math.max(f.confianca, 55);
      extra = ` ${v.pessoas[id]?.nome ?? 'O cliente'} passou a ser um contato seu, de confiança.`;
      break;
    }
    case 'demanda': break;
  }
  escrever(v, { texto: contrair(`Aproveitou uma oportunidade por fora: ${descricaoDaOportunidade(v, o).toLowerCase()}.`), relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  return { texto: contrair(`Deu certo: ${dinheiro(liq)} para você.${extra}`), tom: 'bom' };
}

/* ================================================================ o ano */

export function processarMercadoCriminal(v: Vida): void {
  if (!v.mundoCriminal) return;
  const r = rngDe(v.id, 'mercado_crime', v.t);
  anoDosMercados(v, r);
  if (!env(v)) return;
  anoDaReputacao(v);
  anoDasOportunidades(v, r);
}

/** A leitura do mercado para a tela (a procura de cada ramo em que se atua, aqui). */
export function leituraDoMercado(v: Vida) {
  const e = env(v);
  if (!e) return [];
  const aqui = v.moradia.municipioId;
  const ramos = ramosAtivos(e).length ? ramosAtivos(e) : [ramoPrincipal(e)];
  return ramos.map(ramo => ({ ramo, demanda: demandaDe(v, aqui, ramo), nome: NOME_DA_DEMANDA(demandaDe(v, aqui, ramo)) }));
}

/** As oportunidades para a tela (o que paga, a chance, o risco — antes de aceitar). */
export const leituraDasOportunidades = (v: Vida) => oportunidades(v).map(o => ({ id: o.id, texto: descricaoDaOportunidade(v, o), valor: o.valor, chance: o.chance, risco: o.risco, prazo: o.tFim }));
