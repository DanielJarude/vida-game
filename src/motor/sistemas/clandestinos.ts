/**
 * REWORK 12.2 — OS NEGÓCIOS POR FORA: o que a pessoa abre, compra ou divide no Submundo — e o que isso custa.
 *
 * Um negócio clandestino tem nome, ramo, capital, sócios (gente do caminho, com ficha), reputação no meio, caixa,
 * exposição, rival — e uma história que fica quando ele acaba. O dinheiro é alto e incerto; a conta chega:
 *
 *   APREENSÃO     o que estava empatado vai embora (o capital não volta)
 *   SÓCIO         quem divide pode cobrar a parte, sair com o caixa ou falar — a ficha dele lembra
 *   RIVAL         a organização que disputa o mesmo espaço cobra o espaço
 *   EXPOSIÇÃO     soma à exposição da pessoa: a investigação (`ilicito`) e o processo (`justica`) vêm por ela
 *   PROCESSO      quando a Justiça chega, os negócios são desmantelados — e a empresa de fachada, investigada
 *
 * A EMPRESA DE FACHADA é uma empresa legal da pessoa ligada ao negócio por fora: a desconfiança dos funcionários e do
 * sócio cresce, a investigação pode chegar à empresa (multa, interdição, perda), a família sente. Dá para desligar —
 * o passado ainda pesa uns anos.
 *
 * A ORGANIZAÇÃO PRÓPRIA nasce de um negócio forte e de gente de confiança: tenentes (com ficha), coesão, alianças,
 * disputas internas, traições — a memória da organização não esquece o que é grave.
 *
 * Nada aqui descreve como se faz coisa alguma: são escolhas, gente, números e consequência. Sorteios derivados.
 */

import type { Empresa, NegocioClandestino, Ramo, RelacaoComOrganizacao, TipoClandestino, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import { escrever, idade, lembrarCom, parceiro } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { okDePagar } from './dinheiro';
import { ativo } from './ilicito';
import { abrirProcesso, preso } from './justica';
import { abalar } from './abalo';
import { ramosAtivos, NOME_DO_RAMO } from './ramos';
import { anotar, contatosAtivos, lembrarOrg, nomeDeOrganizacao, organizacaoDoRamo, orgPorId, rivalDoRamo } from './submundo';
import { empresasAtivas } from './empresas';


const env = (v: Vida) => v.caminhos.envolvimento;
const custo = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- os tipos */

export interface ModeloClandestino {
  tipo: TipoClandestino;
  nome: string;
  ramos: Ramo[];
  descricao: string;
  /** O capital para começar (na cidade de custo 1). */
  capital: number;
  /** Quanto o capital gira por ano num ano normal (antes das despesas e dos sócios). */
  giro: number;
  /** Quanto chama atenção por ano no ritmo normal. */
  exposicao: number;
  /** A chance-base de apreensão do ano. */
  apreensao: number;
  nomes: string[];
}

export const MODELOS_CLANDESTINOS: ModeloClandestino[] = [
  { tipo: 'mercadorias', nome: 'Comércio clandestino de mercadorias', ramos: ['contrabando'], descricao: 'Um depósito, compradores fixos, mercadoria que entra sem nota.', capital: 120000, giro: 0.55, exposicao: 7, apreensao: 0.08, nomes: ['o depósito da rua de trás', 'o galpão do porto', 'a loja dos fundos'] },
  { tipo: 'rede_contrabando', nome: 'Rede de contrabando', ramos: ['contrabando'], descricao: 'Fornecedores de fora, gente na fronteira, uma rota que é sua.', capital: 450000, giro: 0.6, exposicao: 10, apreensao: 0.1, nomes: ['a rota do sul', 'a linha do porto', 'a rede da fronteira'] },
  { tipo: 'intermediacao', nome: 'Intermediação de bens de procedência duvidosa', ramos: ['furtos'], descricao: 'Quem tem algo para passar adiante procura você; você conhece quem compra.', capital: 80000, giro: 0.5, exposicao: 8, apreensao: 0.09, nomes: ['o balcão do centro', 'a oficina de fachada nenhuma', 'o ponto da feira'] },
  { tipo: 'colecionaveis', nome: 'Mercado clandestino de colecionáveis', ramos: ['furtos', 'contrabando'], descricao: 'Peças sem papel para quem não pergunta: relógios, arte, antiguidades.', capital: 300000, giro: 0.45, exposicao: 6, apreensao: 0.07, nomes: ['o salão dos fundos', 'o leilão das quintas', 'o antiquário que não abre'] },
  { tipo: 'fraudes', nome: 'Operação de fraudes', ramos: ['fraudes', 'digital'], descricao: 'Um esquema com gente de dentro e uma ponta que ninguém vê.', capital: 150000, giro: 0.6, exposicao: 9, apreensao: 0.06, nomes: ['o escritório da avenida', 'a central', 'o esquema dos contratos'] },
  { tipo: 'organizacao', nome: 'Organização criminosa', ramos: ['organizado'], descricao: 'Território, gente sob o seu comando, acordos com outros grupos.', capital: 600000, giro: 0.5, exposicao: 12, apreensao: 0.08, nomes: ['o grupo', 'a firma', 'a família'] }
];
export const modeloClandestino = (t: TipoClandestino) => MODELOS_CLANDESTINOS.find(x => x.tipo === t)!;

export const negocios = (v: Vida): NegocioClandestino[] => env(v)?.negocios ?? [];
export const negociosAtivos = (v: Vida) => negocios(v).filter(n => n.estado === 'ativo');
export const capitalDoModelo = (v: Vida, t: TipoClandestino) => Math.round(modeloClandestino(t).capital * custo(v) / 1000) * 1000;

/* ---------------------------------------------------------------- os estágios */

export type EstagioDoSubmundo = 'sem_envolvimento' | 'primeiro_contato' | 'ocasional' | 'especializado' | 'dono_de_negocio' | 'organizacao' | 'saida';

/** Onde a pessoa está no Submundo (não é uma escada: pode-se ficar, voltar, sair). */
export function estagioDoSubmundo(v: Vida): EstagioDoSubmundo {
  const e = env(v);
  if (!e) return v.fatos['proposta_ilicita'] !== undefined ? 'primeiro_contato' : 'sem_envolvimento';
  if (e.parou !== undefined) return 'saida';
  if ((e.organizacoes ?? []).some(o => o.propria && o.saiu === undefined)) return 'organizacao';
  if (negociosAtivos(v).length) return 'dono_de_negocio';
  if ((e.organizacoes ?? []).some(o => o.relacao === 'membro' && o.saiu === undefined) && (e.especializacoes?.organizado?.posto ?? 1) >= 2) return 'organizacao';
  const xp = Math.max(0, ...Object.values(e.especializacoes ?? {}).map(s => s?.experiencia ?? 0));
  if (xp >= 30) return 'especializado';
  return (e.trabalhos ?? 0) + Object.values(e.especializacoes ?? {}).reduce((s, x) => s + (x?.operacoes ?? 0), 0) > 0 ? 'ocasional' : 'primeiro_contato';
}

export const NOME_DO_ESTAGIO: Record<EstagioDoSubmundo, string> = {
  sem_envolvimento: 'Fora disso', primeiro_contato: 'Primeiro contato', ocasional: 'De vez em quando', especializado: 'Gente do ramo',
  dono_de_negocio: 'Dono de um negócio por fora', organizacao: 'Dentro de uma organização', saida: 'Tentando sair'
};

/* ---------------------------------------------------------------- abrir */

export function disponibilidadeAbrirClandestino(v: Vida, tipo: TipoClandestino): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] }; ilegal?: true } {
  const e = env(v);
  if (!e || !ativo(v)) return { ok: false, motivo: 'Você não está nisso agora.' };
  if (preso(v)) return { ok: false, motivo: 'Na prisão, não.' };
  if (idade(v) < 18) return { ok: false, motivo: 'Cedo demais para isso.' };
  const m = modeloClandestino(tipo);
  const ramo = m.ramos.find(r => ramosAtivos(e).includes(r));
  if (!ramo) return { ok: false, motivo: `Isso é coisa de quem atua em ${m.ramos.map(r => NOME_DO_RAMO[r].toLowerCase()).join(' ou ')}.` };
  const xp = e.especializacoes?.[ramo]?.experiencia ?? 0;
  if (xp < 25) return { ok: false, motivo: 'Falta prática no ramo: ninguém confia o próprio dinheiro a quem começou ontem.' };
  if (tipo === 'organizacao' && (e.especializacoes?.organizado?.posto ?? 1) < 3 && (e.reputacao ?? 0) < 60) return { ok: false, motivo: 'Comandar um grupo pede gente que obedeça: ainda não é o seu lugar.' };
  if (negociosAtivos(v).length >= 2) return { ok: false, motivo: 'Dois negócios por fora já é mais gente sabendo do que se controla.' };
  if (negociosAtivos(v).some(n => n.tipo === tipo)) return { ok: false, motivo: 'Já existe um desses.' };
  if (v.anoAtual.acoes.includes('clandestino:abrir')) return { ok: false, motivo: 'Um por ano.' };
  if (!contatosAtivos(v, ramo).length) return { ok: false, motivo: 'Sem ninguém do ramo para dividir, não começa.' };
  return okDePagar(v, capitalDoModelo(v, tipo), 'Para começar, é preciso pôr');
}

export function abrirClandestino(v: Vida, tipo: TipoClandestino): string {
  const e = env(v)!;
  const m = modeloClandestino(tipo);
  const ramo = m.ramos.find(r => ramosAtivos(e).includes(r))!;
  const capital = capitalDoModelo(v, tipo);
  const r = rngDe(v.id, 'clandestino', tipo, v.t);
  const socio = contatosAtivos(v, ramo)[0];
  v.financas.conta -= capital;
  v.anoAtual.acoes.push('clandestino:abrir');
  const n: NegocioClandestino = {
    id: `nc${v.seq++}`, nome: r.pick(m.nomes), tipo, ramo, tInicio: v.t, capital, caixa: Math.round(capital * 0.25), reputacao: 25 + Math.round((e.especializacoes?.[ramo]?.nome ?? 0) * 0.3), exposicao: 10, ritmo: 1,
    socios: socio ? [{ pessoaId: socio.id, parte: 0.3 }] : [], rival: rivalDoRamo(v, ramo).id, estado: 'ativo',
    historia: [{ t: v.t, texto: `Começou com ${fmt(capital)}${socio ? `, dividindo com ${v.pessoas[socio.id].nome}` : ''}.` }]
  };
  (e.negocios ??= []).push(n);
  e.exposicao = clamp(e.exposicao + 6);
  anotar(v, `Abriu ${n.nome} (${m.nome.toLowerCase()}).`);
  escrever(v, { texto: `Abriu um negócio por fora: ${n.nome}. Mais dinheiro possível — e mais gente sabendo.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
  return `${cap(n.nome)} começou. ${socio ? `${v.pessoas[socio.id].nome} fica com 30% e com uma parte do risco.` : ''} O rival do ramo já sabe.`;
}

/* ---------------------------------------------------------------- o ano */

/** O ano dos negócios por fora (depois do Submundo): receita, despesa, sócios, rival, apreensão, exposição. */
export function processarClandestinos(v: Vida, rAno: Rng): void {
  const e = env(v);
  if (!e?.negocios?.length) return;
  // A Justiça chegou (processo aberto ou prisão): o que estava de pé é desmantelado; a fachada vira caso.
  if (v.justica?.processo || preso(v)) {
    for (const n of negociosAtivos(v)) desmantelar(v, n, 'A investigação chegou: o negócio foi desmantelado e o que havia nele, apreendido.');
    return;
  }
  // Quem saiu do caminho não toca mais nada por fora: o negócio fica com o sócio (ou com quem disputava o espaço).
  if (e.parou !== undefined) {
    for (const n of negociosAtivos(v)) {
      const quem = n.socios[0] ? v.pessoas[n.socios[0].pessoaId]?.nome : n.rival ? orgPorId(v, n.rival)?.nome : undefined;
      n.estado = 'tomado';
      n.tFim = v.t;
      n.historia.push({ t: v.t, texto: `Quando você saiu, ficou com ${quem ?? 'quem estava por perto'} — sem acerto.` });
      if (n.fachadaId) { const em = empresasAtivas(v).find(z => z.id === n.fachadaId); if (em?.fachada) em.fachada.tFim = v.t; n.fachadaId = undefined; }
    }
    for (const em of empresasAtivas(v).filter(x => x.fachada)) anoDaFachada(v, em);
    return;
  }
  for (const n of negociosAtivos(v)) anoDoNegocio(v, e, n, rngDe(v.id, 'nc-ano', n.id, v.t), rAno);
  for (const o of (e.organizacoes ?? []).filter(x => x.propria && x.saiu === undefined)) anoDaOrganizacaoPropria(v, o);
  for (const em of empresasAtivas(v).filter(x => x.fachada && x.fachada.tFim === undefined || x.fachada && (x.fachada.suspeita ?? 0) > 0)) anoDaFachada(v, em);
}

function anoDoNegocio(v: Vida, e: NonNullable<Vida['caminhos']['envolvimento']>, n: NegocioClandestino, r: Rng, rAno: Rng): void {
  const m = modeloClandestino(n.tipo);
  const s = e.especializacoes?.[n.ramo];
  const mercado = n.ramo === 'contrabando' ? 1 + (s?.mercado ?? 0) * 0.12 : 1;
  const rival = n.rival ? orgPorId(v, n.rival) : undefined;
  const pressao = rival && rival.relacao === 'rival' ? 1 - Math.min(0.25, (n.reputacao / 400)) : 1;
  const ritmo = [0.55, 1, 1.4][n.ritmo];
  const fachada = n.fachadaId ? empresasAtivas(v).find(x => x.id === n.fachadaId) : undefined;
  // O ano: o giro do capital, com a reputação no meio, o mercado, o rival — e o acaso (anos secos existem).
  const sorte = Math.max(0.15, 1 + r.normal() * 0.35);
  const receita = Math.round(n.capital * m.giro * (0.6 + n.reputacao / 125) * mercado * pressao * ritmo * sorte / 100) * 100;
  // As despesas: gente, transporte, quem fecha os olhos, o que se perde — e a parte dos sócios.
  const despesa = Math.round((n.capital * 0.22 + receita * 0.3) / 100) * 100;
  const lucro = receita - despesa;
  const dosSocios = lucro > 0 ? Math.round(lucro * n.socios.reduce((x, y) => x + y.parte, 0)) : 0;
  n.caixa += lucro - dosSocios;
  let nota: string | undefined;
  n.reputacao = clamp(n.reputacao + (lucro > 0 ? 3 : -2) + (n.ritmo === 2 ? 2 : 0));
  // REWORK 12.2 · ajuste: o negócio chama atenção pelo que faz no ano (o ritmo, a escala) e o rastro antigo esfria — o nível
  // se estabiliza; e só a parte que passa da prática que o ano do caminho já conta soma à exposição da pessoa (sem contar
  // duas vezes a mesma atividade).
  n.exposicao = clamp(Math.round(n.exposicao * 0.7 + m.exposicao * ritmo * (fachada ? 0.6 : 1)));
  e.exposicao = clamp(e.exposicao + Math.max(0, Math.round((n.exposicao - 20) / 8)));
  // A apreensão: o que estava empatado vai embora.
  if (r.chance(m.apreensao * ritmo + n.exposicao / 500)) {
    const perda = Math.round(n.capital * (0.35 + r.next() * 0.35));
    n.capital = Math.max(0, n.capital - perda);
    n.caixa = Math.min(n.caixa, 0);
    n.exposicao = clamp(n.exposicao + 12);
    e.exposicao = clamp(e.exposicao + 6);
    nota = `Uma apreensão levou ${fmt(perda)} do que estava empatado.`;
    escrever(v, { texto: `Uma operação levou parte do que estava em ${n.nome}: ${fmt(perda)} que não voltam.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    abalar(v, 'a apreensão', -4, 8);
  }
  // O rival: a reputação que cresce incomoda; às vezes cobra.
  if (rival?.relacao === 'rival' && n.reputacao >= 45 && r.chance(0.18)) {
    const perda = Math.round(n.caixa > 0 ? n.caixa * 0.4 : n.capital * 0.1);
    n.caixa -= perda;
    lembrarOrg(rival, v.t, 'conflito', -8);
    nota = nota ?? `${cap(rival.nome)} disputou o espaço: ${fmt(perda)} perdidos e um aviso.`;
    anotar(v, `${cap(rival.nome)} cobrou o espaço de ${n.nome}.`, 'ruim');
  }
  // O sócio: a confiança dele anda com o que ele recebe; quem desconfia cobra — ou sai com o caixa e fala.
  for (const sc of [...n.socios]) {
    const f = e.fichas?.[sc.pessoaId];
    if (!f || !v.pessoas[sc.pessoaId]?.vivo || f.afastado !== undefined || f.traiu !== undefined) { n.socios = n.socios.filter(x => x !== sc); continue; }
    f.confianca = clamp(f.confianca + (dosSocios > 0 ? 3 : -6) - (n.ritmo === 2 ? 2 : 0));
    if (f.confianca < 22 && r.chance(0.35)) {
      const levou = Math.max(0, Math.round(n.caixa * 0.6));
      n.caixa -= levou;
      f.traiu = v.t;
      e.traicoes = (e.traicoes ?? 0) + 1;
      e.exposicao = clamp(e.exposicao + 12);
      n.socios = n.socios.filter(x => x !== sc);
      const org = f.organizacao ? orgPorId(v, f.organizacao) : undefined;
      if (org) lembrarOrg(org, v.t, 'traicao', -10);
      nota = `${v.pessoas[sc.pessoaId].nome} saiu levando ${fmt(levou)} — e falou mais do que devia.`;
      escrever(v, { texto: `${v.pessoas[sc.pessoaId].nome}, sócio em ${n.nome}, sumiu com o caixa e falou o seu nome. A conta e o medo ficaram.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      lembrarCom(v, sc.pessoaId, 'Traiu você no negócio por fora.', 'conflito', 3);
    }
  }
  void rAno;
  n.ultimo = { t: v.t, receita, despesa, retirado: 0, nota };
  if (nota) n.historia.push({ t: v.t, texto: nota, tom: 'ruim' });
  if (n.historia.length > 24) n.historia.splice(1, n.historia.length - 24);
  // Sem capital nem caixa, acaba sozinho.
  if (n.capital <= 0 && n.caixa <= 0) encerrar(v, n, 'Não sobrou nada para girar: acabou.');
}

function anoDaOrganizacaoPropria(v: Vida, o: RelacaoComOrganizacao): void {
  const e = env(v)!;
  const p = o.propria!;
  const r = rngDe(v.id, 'org-propria', o.id, v.t);
  p.tenentes = p.tenentes.filter(id => v.pessoas[id]?.vivo && e.fichas?.[id] && e.fichas[id].traiu === undefined && e.fichas[id].afastado === undefined);
  p.coesao = clamp(Math.round(p.coesao + (p.tenentes.length >= 2 ? 2 : -4) - (e.cautela ? 0 : 1) + r.normal() * 3));
  e.exposicao = clamp(e.exposicao + 4);
  // A disputa interna: com a coesão baixa, um tenente desafia o comando.
  if (p.coesao < 45 && p.tenentes.length && r.chance(0.3)) {
    const id = r.pick(p.tenentes);
    const f = e.fichas![id];
    if (f.confianca < 35) {
      f.traiu = v.t;
      e.traicoes = (e.traicoes ?? 0) + 1;
      e.exposicao = clamp(e.exposicao + 15);
      lembrarOrg(o, v.t, 'traicao', -6);
      p.tenentes = p.tenentes.filter(x => x !== id);
      anotar(v, `${v.pessoas[id].nome} desafiou o comando, levou gente junto e falou com quem não devia.`, 'ruim');
      escrever(v, { texto: `${v.pessoas[id].nome}, de dentro do seu grupo, rompeu e falou com quem não devia.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    } else {
      lembrarOrg(o, v.t, 'conflito', -3);
      p.coesao = clamp(p.coesao + 6);
      anotar(v, `${v.pessoas[id].nome} questionou o comando; a conversa foi dura, mas ficou dentro.`);
    }
  }
}

/** A empresa legal ligada a um negócio por fora: desconfiança, investigação, interdição, perda — e a família. */
function anoDaFachada(v: Vida, em: Empresa): void {
  const fa = em.fachada!;
  const r = rngDe(v.id, 'fachada', em.id, v.t);
  const ligada = fa.tFim === undefined;
  const n = negocios(v).find(x => x.id === fa.negocioId);
  fa.suspeita = clamp(Math.round(ligada ? fa.suspeita + 9 + (n?.ritmo ?? 1) * 4 : fa.suspeita * 0.6 - 4));
  if (!ligada && fa.suspeita <= 0) { delete em.fachada; return; }
  // Os de dentro percebem: um funcionário que sai, o sócio que pede as contas.
  if (ligada && fa.suspeita >= 35 && r.chance(0.4)) {
    em.reputacao = clamp(em.reputacao - 3);
    em.equipe = Math.max(1, em.equipe - 1);
    const texto = em.socio && em.papel === 'socio' ? `${em.socio}, seu sócio em ${em.nome}, pediu para ver as contas — e não gostou do que viu.` : `Um funcionário de ${em.nome} pediu demissão: "aqui tem coisa que eu não quero assinar".`;
    (em.historia ??= []).push({ t: v.t, texto });
    escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  }
  // A investigação chega à empresa: multa, interdição, às vezes a perda; a família fica sabendo.
  const exp = env(v)?.exposicao ?? 0;
  if (r.chance(fa.suspeita / 260 + exp / 600)) {
    fa.descoberta = v.t;
    const c = custo(v);
    em.caixa -= Math.round(250000 * c * em.unidades);
    em.reputacao = clamp(em.reputacao - 30);
    const perde = r.chance(0.45);
    if (perde) {
      em.estado = 'encerrada';
      em.tFim = v.t;
      em.avaliacao = 0;
      (em.historia ??= []).push({ t: v.t, texto: 'A Justiça tomou a empresa: era fachada de um negócio por fora.' });
      v.financas.empresas = (v.financas.empresas ?? []).filter(x => x.id !== em.id);
    } else {
      em.estado = 'interditada';
      (em.historia ??= []).push({ t: v.t, texto: 'Interditada: investigação por ligação com negócio ilícito.' });
    }
    if (n && n.estado === 'ativo') desmantelar(v, n, 'A investigação da empresa chegou ao negócio por fora.');
    const env0 = env(v);
    if (env0) env0.exposicao = clamp(env0.exposicao + 20);
    const par = parceiro(v);
    if (par) { par.vin.tensao = clamp(par.vin.tensao + 25); lembrarCom(v, par.p.id, `O dia em que ${em.nome} apareceu no noticiário.`, 'conflito', 3); }
    abalar(v, 'a investigação na empresa', -10, 14);
    escrever(v, { texto: `${em.nome} foi investigada por servir de fachada a um negócio por fora: multa, manchete${perde ? ' e a empresa tomada pela Justiça' : ' e portas fechadas'}. Em casa, ninguém dormiu.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    delete em.fachada;
  }
}

/* ---------------------------------------------------------------- decisões */

export type OqueClandestino = 'abrir' | 'aportar' | 'retirar' | 'ritmo_0' | 'ritmo_1' | 'ritmo_2' | 'socio' | 'romper_socio' | 'fachada' | 'desligar_fachada' | 'encerrar' | 'passar_adiante' | 'fundar_organizacao' | 'tenente' | 'alianca' | 'romper_alianca' | 'dissolver';

export const ROTULO_CLANDESTINO: Record<OqueClandestino, string> = {
  abrir: 'Abrir', aportar: 'Pôr mais dinheiro', retirar: 'Tirar dinheiro do caixa', ritmo_0: 'Tocar com cautela', ritmo_1: 'Tocar no ritmo de sempre', ritmo_2: 'Acelerar',
  socio: 'Chamar alguém do caminho para sócio', romper_socio: 'Romper com o sócio', fachada: 'Usar uma empresa sua como fachada', desligar_fachada: 'Desligar a empresa do negócio',
  encerrar: 'Encerrar o negócio', passar_adiante: 'Passar o negócio adiante', fundar_organizacao: 'Fundar a própria organização', tenente: 'Dar comando a alguém de confiança',
  alianca: 'Propor uma aliança', romper_alianca: 'Romper a aliança', dissolver: 'Dissolver a organização e sair do comando'
};

export function disponibilidadeClandestino(v: Vida, oque: OqueClandestino, negocioId?: string, alvo?: string): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  const e = env(v);
  if (oque === 'abrir') return disponibilidadeAbrirClandestino(v, alvo as TipoClandestino);
  if (!e || !ativo(v) || preso(v)) return { ok: false, motivo: 'Você não está nisso agora.' };
  if (v.anoAtual.acoes.includes(`clandestino:${negocioId ?? ''}:${oque}:${alvo ?? ''}`)) return { ok: false, motivo: 'Já decidido este ano.' };
  const org = (e.organizacoes ?? []).find(o => o.propria && o.saiu === undefined);
  if (oque === 'tenente' || oque === 'alianca' || oque === 'romper_alianca' || oque === 'dissolver') {
    if (!org) return { ok: false, motivo: 'Você não comanda uma organização.' };
    if (oque === 'tenente') { const c = alvo ? e.fichas?.[alvo] : undefined; if (!c || org.propria!.tenentes.includes(alvo!)) return { ok: false, motivo: 'Essa pessoa não está disponível.' }; if (c.confianca < 50) return { ok: false, motivo: 'Comando se dá a quem confia em você — e essa pessoa ainda não confia.' }; return { ok: true }; }
    if (oque === 'alianca') { const o = alvo ? orgPorId(v, alvo) : undefined; if (!o || o.propria || o.relacao === 'aliada' || o.relacao === 'membro') return { ok: false, motivo: 'Não há com quem.' }; if (o.memoria.some(m => m.fato === 'traicao' || m.fato === 'conflito') && o.lealdade < 45) return { ok: false, motivo: `${cap(o.nome)} lembra do que houve: não há conversa.` }; return { ok: true }; }
    if (oque === 'romper_alianca') { const o = alvo ? orgPorId(v, alvo) : undefined; return o?.relacao === 'aliada' ? { ok: true } : { ok: false, motivo: 'Não há aliança.' }; }
    return { ok: true };
  }
  if (oque === 'fundar_organizacao') {
    if (org) return { ok: false, motivo: 'Você já comanda uma.' };
    const forte = negociosAtivos(v).find(n => n.reputacao >= 50);
    if (!forte) return { ok: false, motivo: 'Uma organização nasce de um negócio forte: ainda não há um.' };
    if (contatosAtivos(v).filter(c => c.f.confianca >= 50).length < 2) return { ok: false, motivo: 'Faltam duas pessoas de confiança para dividir o comando.' };
    return okDePagar(v, Math.round(300000 * custo(v) / 1000) * 1000, 'Montar a estrutura custa');
  }
  const n = negocios(v).find(x => x.id === negocioId && x.estado === 'ativo');
  if (!n) return { ok: false, motivo: 'Esse negócio não existe mais.' };
  switch (oque) {
    case 'aportar': return okDePagar(v, Math.round(n.capital * 0.3 / 1000) * 1000, 'O aporte é de');
    case 'retirar': return n.caixa > 1000 ? { ok: true } : { ok: false, motivo: 'Não há caixa para tirar.' };
    case 'ritmo_0': case 'ritmo_1': case 'ritmo_2': return n.ritmo === Number(oque.slice(-1)) ? { ok: false, motivo: 'Já é esse o ritmo.' } : { ok: true };
    case 'socio': { const c = alvo ? e.fichas?.[alvo] : undefined; if (!c || n.socios.some(s => s.pessoaId === alvo)) return { ok: false, motivo: 'Essa pessoa não está disponível.' }; if (n.socios.length >= 2) return { ok: false, motivo: 'Dois sócios já é gente demais dividindo o segredo.' }; return { ok: true }; }
    case 'romper_socio': return n.socios.some(s => s.pessoaId === alvo) ? { ok: true } : { ok: false, motivo: 'Não é sócio.' };
    case 'fachada': {
      if (n.fachadaId) return { ok: false, motivo: 'Já há uma empresa ligada.' };
      const em = empresasAtivas(v).find(x => x.id === alvo);
      if (!em || em.papel === 'investidor') return { ok: false, motivo: 'Precisa ser uma empresa em que você manda.' };
      if (em.fachada) return { ok: false, motivo: 'Essa empresa ainda carrega a história de antes.' };
      return { ok: true };
    }
    case 'desligar_fachada': return n.fachadaId ? { ok: true } : { ok: false, motivo: 'Não há empresa ligada.' };
    case 'encerrar': case 'passar_adiante': return { ok: true };
  }
  return { ok: false, motivo: 'Não se aplica.' };
}

export function decidirClandestino(v: Vida, oque: OqueClandestino, negocioId?: string, alvo?: string): string {
  if (oque === 'abrir') return abrirClandestino(v, alvo as TipoClandestino);
  const e = env(v)!;
  v.anoAtual.acoes.push(`clandestino:${negocioId ?? ''}:${oque}:${alvo ?? ''}`);
  const org = (e.organizacoes ?? []).find(o => o.propria && o.saiu === undefined);
  const n = negocios(v).find(x => x.id === negocioId);
  const hist = (texto: string, tom?: 'bom' | 'ruim') => n?.historia.push({ t: v.t, texto, ...(tom ? { tom } : {}) });
  switch (oque) {
    case 'aportar': { const x = Math.round(n!.capital * 0.3 / 1000) * 1000; v.financas.conta -= x; n!.capital += x; hist(`Mais ${fmt(x)} no negócio.`); return `${fmt(x)} a mais empatados em ${n!.nome}: mais giro, mais a perder.`; }
    case 'retirar': {
      const x = Math.round(n!.caixa * 0.9 / 100) * 100;
      n!.caixa -= x;
      v.financas.conta += x;
      e.ganhos += x;
      // Dinheiro que aparece sem explicação chama atenção — com uma empresa por trás, chama menos (e o risco vai para ela).
      const chama = Math.round(Math.min(10, x / Math.max(1, 40000 * custo(v))) * (n!.fachadaId ? 0.4 : 1));
      e.exposicao = clamp(e.exposicao + chama);
      const em = n!.fachadaId ? empresasAtivas(v).find(z => z.id === n!.fachadaId) : undefined;
      if (em?.fachada) em.fachada.suspeita = clamp(em.fachada.suspeita + Math.round(chama * 1.5));
      if (n!.ultimo) n!.ultimo.retirado += x;
      hist(`Retirou ${fmt(x)}.`);
      return `${fmt(x)} saíram do caixa para você. Dinheiro que aparece sem explicação ${chama >= 8 ? 'chama muita atenção' : 'chama alguma atenção'}.`;
    }
    case 'ritmo_0': case 'ritmo_1': case 'ritmo_2': n!.ritmo = Number(oque.slice(-1)) as 0 | 1 | 2; return ['Cautela: gira menos, aparece menos.', 'O ritmo de sempre.', 'Acelerado: gira mais — e todo mundo vê.'][n!.ritmo];
    case 'socio': { n!.socios.push({ pessoaId: alvo!, parte: 0.25 }); const f = e.fichas![alvo!]; f.confianca = clamp(f.confianca + 8); hist(`${v.pessoas[alvo!].nome} entrou como sócio.`); return `${v.pessoas[alvo!].nome} entra com 25%: divide o risco, o caixa e o segredo.`; }
    case 'romper_socio': {
      n!.socios = n!.socios.filter(s => s.pessoaId !== alvo);
      const f = e.fichas?.[alvo!];
      if (f) { f.confianca = clamp(f.confianca - 30); f.quebradas++; const o = f.organizacao ? orgPorId(v, f.organizacao) : undefined; if (o) lembrarOrg(o, v.t, 'conflito', -8); }
      lembrarCom(v, alvo!, 'Você rompeu a sociedade.', 'conflito', 2);
      hist(`Rompeu com ${v.pessoas[alvo!].nome}.`, 'ruim');
      return `Sociedade desfeita com ${v.pessoas[alvo!].nome}. Ele não vai esquecer — nem quem está com ele.`;
    }
    case 'fachada': {
      const em = empresasAtivas(v).find(z => z.id === alvo)!;
      n!.fachadaId = em.id;
      em.fachada = { negocioId: n!.id, tInicio: v.t, suspeita: 10 };
      hist(`Passou a usar ${em.nome} como fachada.`);
      escrever(v, { texto: `${em.nome} passou a servir a ${n!.nome}. Quem trabalha lá não sabe — por enquanto.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return `${em.nome} agora carrega parte do risco: o negócio aparece menos; a empresa, mais.`;
    }
    case 'desligar_fachada': {
      const em = empresasAtivas(v).find(z => z.id === n!.fachadaId);
      n!.fachadaId = undefined;
      if (em?.fachada) em.fachada.tFim = v.t;
      hist('Desligou a empresa do negócio.');
      return `${em?.nome ?? 'A empresa'} foi desligada do negócio. O que já foi feito ainda pode aparecer por uns anos.`;
    }
    case 'encerrar': encerrar(v, n!, 'Encerrado por decisão sua.'); return `${cap(n!.nome)} acabou. A história fica, e a exposição demora a esfriar.`;
    case 'passar_adiante': {
      const o = rivalDoRamo(v, n!.ramo).relacao === 'rival' ? organizacaoDoRamo(v, n!.ramo) : rivalDoRamo(v, n!.ramo);
      const valor = Math.round(n!.capital * 0.45 / 1000) * 1000;
      v.financas.conta += valor;
      lembrarOrg(o, v.t, 'favor', 6);
      n!.estado = 'tomado';
      n!.tFim = v.t;
      hist(`Passou adiante para ${o.nome} por ${fmt(valor)}.`);
      anotar(v, `Passou ${n!.nome} para ${o.nome}.`);
      return `${cap(n!.nome)} agora é de ${o.nome}: ${fmt(valor)} na mão, e um favor que eles lembram.`;
    }
    case 'fundar_organizacao': {
      const forte = negociosAtivos(v).find(z => z.reputacao >= 50)!;
      const x = Math.round(300000 * custo(v) / 1000) * 1000;
      v.financas.conta -= x;
      const tenentes = contatosAtivos(v).filter(c => c.f.confianca >= 50).slice(0, 2).map(c => c.id);
      const k = (e.organizacoes ?? []).length;
      const o: RelacaoComOrganizacao = { id: `org_propria_${v.t}`, nome: nomeDeOrganizacao(v.moradia.municipioId, forte.ramo === 'organizado' ? 'organizado' : forte.ramo, 10 + k), especialidade: forte.ramo, relacao: 'membro', lealdade: 70, memoria: [], desde: v.t, propria: { negocioId: forte.id, tenentes, coesao: 60 } };
      (e.organizacoes ??= []).push(o);
      e.exposicao = clamp(e.exposicao + 10);
      anotar(v, `Fundou ${o.nome}.`);
      escrever(v, { texto: `Deixou de trabalhar para os outros: ${o.nome} é seu. Gente sob o seu comando — e o seu nome no centro de tudo.`, relevancia: 'marco', tema: 'trabalho', escolha: true });
      return `${cap(o.nome)} existe. ${tenentes.map(id => v.pessoas[id].nome).join(' e ')} dividem o comando com você.`;
    }
    case 'tenente': { org!.propria!.tenentes.push(alvo!); org!.propria!.coesao = clamp(org!.propria!.coesao + 6); return `${v.pessoas[alvo!].nome} passa a comandar uma parte. Menos peso nas suas costas; mais alguém que sabe tudo.`; }
    case 'alianca': {
      const o = orgPorId(v, alvo!)!;
      o.relacao = 'aliada';
      lembrarOrg(o, v.t, 'alianca', 12);
      lembrarOrg(org!, v.t, 'alianca', 0);
      for (const n2 of negociosAtivos(v)) if (n2.rival === o.id) n2.rival = undefined;
      return `Aliança com ${o.nome}: o espaço se divide em vez de se disputar. Eles vão cobrar a palavra.`;
    }
    case 'romper_alianca': { const o = orgPorId(v, alvo!)!; o.relacao = 'rival'; lembrarOrg(o, v.t, 'traicao', -20); return `Aliança rompida. ${cap(o.nome)} não esquece — e a rua sabe.`; }
    case 'dissolver': {
      org!.saiu = v.t;
      lembrarOrg(org!, v.t, 'saida', -10);
      const herdeiro = org!.propria!.tenentes[0];
      for (const n2 of negociosAtivos(v).filter(z => z.id === org!.propria!.negocioId)) { n2.estado = 'tomado'; n2.tFim = v.t; n2.historia.push({ t: v.t, texto: `Ficou com ${herdeiro ? v.pessoas[herdeiro].nome : 'quem sobrou'}.` }); }
      anotar(v, `Saiu do comando de ${org!.nome}.`);
      return `Você saiu do comando de ${org!.nome}${herdeiro ? `; ${v.pessoas[herdeiro].nome} ficou no lugar` : ''}. Sair do comando não é sair do passado.`;
    }
  }
  return 'Feito.';
}

function encerrar(v: Vida, n: NegocioClandestino, porque: string): void {
  n.estado = 'encerrado';
  n.tFim = v.t;
  const devolve = Math.max(0, Math.round(n.caixa * 0.8));
  v.financas.conta += devolve;
  n.caixa = 0;
  n.historia.push({ t: v.t, texto: porque });
  if (n.fachadaId) { const em = empresasAtivas(v).find(z => z.id === n.fachadaId); if (em?.fachada) em.fachada.tFim = v.t; n.fachadaId = undefined; }
  anotar(v, `${cap(n.nome)} encerrado.`);
}

function desmantelar(v: Vida, n: NegocioClandestino, porque: string): void {
  n.estado = 'desmantelado';
  n.tFim = v.t;
  n.caixa = 0;
  n.historia.push({ t: v.t, texto: porque, tom: 'ruim' });
  const em = n.fachadaId ? empresasAtivas(v).find(z => z.id === n.fachadaId) : undefined;
  if (em?.fachada) { em.fachada.suspeita = 100; em.fachada.tFim = v.t; }
  n.fachadaId = undefined;
  anotar(v, `${cap(n.nome)} desmantelado.`, 'ruim');
  escrever(v, { texto: `${cap(n.nome)} acabou desmantelado: o que estava empatado foi apreendido.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
}

/** Leitura para a tela: os negócios (ativos primeiro), o estágio e a organização própria. */
export function leituraDosNegocios(v: Vida) {
  const e = env(v);
  return {
    estagio: estagioDoSubmundo(v),
    negocios: [...negocios(v)].sort((a, b) => (a.estado === 'ativo' ? 0 : 1) - (b.estado === 'ativo' ? 0 : 1)).map(n => ({ n, modelo: modeloClandestino(n.tipo), desde: anoDe(n.tInicio), socios: n.socios.map(s => ({ id: s.pessoaId, nome: v.pessoas[s.pessoaId]?.nome ?? '—', parte: s.parte, confianca: e?.fichas?.[s.pessoaId]?.confianca ?? 0 })), fachada: n.fachadaId ? empresasAtivas(v).find(z => z.id === n.fachadaId)?.nome : undefined })),
    organizacao: (e?.organizacoes ?? []).find(o => o.propria && o.saiu === undefined),
    podeAbrir: MODELOS_CLANDESTINOS.map(m => m.tipo)
  };
}

/** Para a Justiça e a vida: o processo que vem dos negócios por fora é por organização ou mercado. */
export const categoriaDoNegocio = (n: NegocioClandestino) => (n.tipo === 'organizacao' ? 'grupo' : n.tipo === 'fraudes' ? 'fraude' : n.tipo === 'intermediacao' || n.tipo === 'colecionaveis' ? 'patrimonial' : 'mercado') as 'grupo' | 'fraude' | 'patrimonial' | 'mercado';
export { abrirProcesso };
