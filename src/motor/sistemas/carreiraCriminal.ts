/**
 * REWORK 12.25 — O SUBMUNDO COMO CARREIRA. O envolvimento (`ilicito`), a margem (`margem`) e os ramos (`submundo`)
 * continuam sendo a espinha; este módulo dá a eles o que uma carreira tem:
 *
 *   ESTADOS      onde a pessoa está (nunca envolvida, primeiro contato, ocasional, profissional, de dentro de uma
 *                organização, liderança, saindo, ex) e o que se soma a isso (investigada, processada, procurada,
 *                foragida, presa, cumprindo pena alternativa) — não exclusivos, lidos de um lugar só pela tela
 *   PATAMARES    começo → experiente → influente → liderança → grande escala: cada um muda o tamanho das oportunidades
 *                (a escala econômica), sem teto artificial e sem enriquecimento garantido
 *   MARCOS       a primeira encomenda, o primeiro posto, quando o crime virou a ocupação principal — a vida reconhece
 *   CONTAS       todo dinheiro do caminho entra e sai por aqui, com linha própria no extrato ('por_fora'): o recorrente,
 *                o pontual, os negócios, as encomendas, os custos e as perdas — uma vez só, sem virar salário
 *   RUMO         a pergunta "o que está virando isso" só volta com motivo (o primeiro ano, a investigação, a promoção, a
 *                perda grande, a família) e com intervalo — e o rumo também se escolhe na tela, a qualquer hora
 *   FAMÍLIA      quem desconfia, quem sabe, quem apoia, quem rejeita, quem pede para sair — pela personalidade e a relação
 *   TEMPO        o caminho ocupa a semana (os encontros, a organização, os negócios); o que se encomenda corre em segundo
 *   LEGADO       o passado não some; o herdeiro não herda cargo — a organização pode procurá-lo, e a escolha é dele
 *
 * Nada aqui descreve como se faz coisa alguma: são gente, dinheiro, risco e consequência. Sorteios derivados (`rngDe`).
 */
import { clamp, rngDe } from '../rng';
import type { CarreiraCriminal, Envolvimento, Pessoa, ReacaoDaFamilia, Vida } from '../tipos';
import { escrever, filhos, idade, idadePessoa, irmaos, lembrarCom, pais, parceiro } from '../nucleo';
import { balanco } from './dinheiro';
import { contasPorFora, pedirRumo, registrarRumo } from './porFora';
import { ativo } from './ilicito';
import { preso } from './justica';
import { anotar } from './submundo';
import { ramosAtivos } from './ramos';
import { abalar } from './abalo';

const env = (v: Vida) => v.caminhos.envolvimento;

export { nivelNaOrganizacao, temOrganizacaoPropria, tempoDoCaminho } from './tempoDoCrime';
import { nivelNaOrganizacao, temOrganizacaoPropria } from './tempoDoCrime';
export { contasPorFora, movimentoPorFora, pagarPorFora, pedirRumo, registrarRumo, ultimoRumo, ROTULO_POR_FORA, MOTIVO_DO_RUMO, type FonteDoCrime, type MotivoDoRumo } from './porFora';

/* ================================================================ carreira */

/** A carreira (save antigo: a prática geral sai da prática dos ramos e do que já entrou). */
export const garantirCarreira = (e: Envolvimento): CarreiraCriminal => (e.carreira ??= { xp: Math.round(Math.min(60, (e.ganhos > 0 ? 6 : 0) + Object.values(e.especializacoes ?? {}).reduce((s, x) => s + (x?.experiencia ?? 0) * 0.4, 0))), patamar: 0, marcos: [] });

/** A prática geral sobe (a operação que deu certo ensina; a que deu errado, também — um pouco menos). */
export function ganharPratica(v: Vida, x: number): void {
  const e = env(v);
  if (!e) return;
  const c = garantirCarreira(e);
  c.xp = Math.round(c.xp + x);
}

export function marco(v: Vida, texto: string, bio = true): void {
  const e = env(v);
  if (!e) return;
  const c = garantirCarreira(e);
  if (c.marcos.some(m => m.texto === texto)) return;
  c.marcos.push({ t: v.t, texto });
  if (c.marcos.length > 30) c.marcos.splice(0, c.marcos.length - 30);
  anotar(v, texto, 'bom');
  if (bio) escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho' });
}

export const NOME_DO_PATAMAR = ['começo', 'experiente', 'influente', 'liderança', 'grande escala'] as const;
/** O tamanho das oportunidades em cada patamar (o valor de referência de uma encomenda, de uma parte, de um negócio). */
export const ESCALA_DO_PATAMAR = [1, 2.2, 4.5, 9, 20] as const;

/** O patamar de agora (pelo que se é hoje: o posto, os negócios, o nome no meio, o patrimônio). */
export function patamarAtual(v: Vida): 0 | 1 | 2 | 3 | 4 {
  const e = env(v);
  if (!e) return 0;
  const c = garantirCarreira(e);
  const nivel = nivelNaOrganizacao(v);
  const propria = temOrganizacaoPropria(v);
  const negocios = (e.negocios ?? []).filter(n => n.estado === 'ativo').length;
  const pat = balanco(v).liquido;
  const xpRamo = Math.max(0, ...Object.values(e.especializacoes ?? {}).map(s => s?.experiencia ?? 0));
  if (nivel >= 6 || ((propria || nivel >= 4) && pat >= 5_000_000) || (pat >= 25_000_000 && (negocios > 0 || nivel >= 2))) return 4;
  if (nivel >= 4 || propria) return 3;
  if (nivel >= 2 || negocios > 0 || (e.reputacao ?? 0) >= 60) return 2;
  if (c.xp >= 22 || xpRamo >= 40 || nivel >= 0) return 1;
  return 0;
}

/** O valor de referência de um trabalho neste patamar (no custo do lugar e na renda do envolvimento). */
export const escalaDe = (v: Vida) => ESCALA_DO_PATAMAR[patamarAtual(v)];

/* ================================================================ estados */

export type EstadoNoSubmundo = 'nunca' | 'contato_inicial' | 'ocasional' | 'profissional' | 'integrante' | 'lideranca' | 'saindo' | 'ex';
export type CondicaoNoSubmundo = 'investigado' | 'processado' | 'procurado' | 'foragido' | 'preso' | 'pena_alternativa' | 'antecedentes';

export const NOME_DO_ESTADO: Record<EstadoNoSubmundo, string> = {
  nunca: 'Nunca se envolveu', contato_inicial: 'Primeiro contato', ocasional: 'Por fora, de vez em quando', profissional: 'Do meio, por profissão',
  integrante: 'De dentro de uma organização', lideranca: 'Na liderança', saindo: 'Tentando sair', ex: 'Fora disso'
};
export const NOME_DA_CONDICAO: Record<CondicaoNoSubmundo, string> = {
  investigado: 'investigação em andamento', processado: 'respondendo a processo', procurado: 'procurado pela Justiça', foragido: 'foragido',
  preso: 'cumprindo pena', pena_alternativa: 'cumprindo pena alternativa', antecedentes: 'com antecedentes'
};

/** O crime virou a ocupação principal? (Sem emprego com carteira, e o que entra por fora é o que paga a vida.) */
export function crimeEhPrincipal(v: Vida): boolean {
  const e = env(v);
  if (!e || !ativo(v)) return false;
  const emprego = v.trabalho.atual;
  const formal = emprego && emprego.carga === 'integral' && ['clt', 'servidor', 'militar'].includes(emprego.contrato);
  if (formal) return false;
  const porFora = contasPorFora(v).totalAno;
  const salario = (emprego?.salario ?? 0) * 12;
  return nivelNaOrganizacao(v) >= 1 || temOrganizacaoPropria(v) || (porFora > 0 && porFora >= salario * 1.2) || (!emprego && (e.nivel >= 2 || ramosAtivos(e).length >= 2));
}

/** Onde a pessoa está no Submundo — um estado e as condições que se somam (a tela lê daqui, e só daqui). */
export function estadoNoSubmundo(v: Vida): { estado: EstadoNoSubmundo; condicoes: CondicaoNoSubmundo[]; titulo: string } {
  const e = env(v);
  const j = v.justica;
  const condicoes: CondicaoNoSubmundo[] = [];
  if (j?.prisao) condicoes.push('preso');
  if (j?.foragido) condicoes.push(j.foragido.motivo === 'mandado' || j.foragido.motivo === 'descumprimento' ? 'procurado' : 'foragido');
  if (j?.processo) condicoes.push('processado');
  if (e?.investigado !== undefined) condicoes.push('investigado');
  if (j?.alternativa) condicoes.push('pena_alternativa');
  if ((j?.antecedentes ?? []).some(a => a.desfecho === 'prisao' || a.desfecho === 'alternativa') && !condicoes.includes('preso')) condicoes.push('antecedentes');
  let estado: EstadoNoSubmundo;
  const proposta = v.fatos['proposta_ilicita'] !== undefined && v.fatos['proposta_ilicita'] === v.t;
  if (!e) estado = proposta || (v.fatos['procurou_contato'] !== undefined && v.t - v.fatos['procurou_contato'] < 24) ? 'contato_inicial' : 'nunca';
  else if (e.parou !== undefined) estado = 'ex';
  else if (e.saindo !== undefined) estado = 'saindo';
  else {
    const nivel = nivelNaOrganizacao(v);
    if (nivel >= 4 || temOrganizacaoPropria(v)) estado = 'lideranca';
    else if (nivel >= 0) estado = 'integrante';
    else if (crimeEhPrincipal(v) || garantirCarreira(e).xp >= 30 || e.nivel >= 2) estado = 'profissional';
    else estado = v.t - e.tInicio < 12 && (garantirCarreira(e).xp < 8) ? 'contato_inicial' : 'ocasional';
  }
  const titulo = [NOME_DO_ESTADO[estado], ...condicoes.filter(c => c !== 'antecedentes' || estado === 'ex' || estado === 'nunca').map(c => NOME_DA_CONDICAO[c])].join(' · ');
  return { estado, condicoes, titulo };
}

/* ================================================================ sair aos poucos */

/**
 * Sair aos poucos: no primeiro ano, o que se faz por fora diminui (a moita), os negócios param de crescer, os contatos
 * ficam sabendo; no fim do prazo, o caminho termina — sem a ruptura de largar de uma vez (a organização aceita melhor).
 */
export function comecarASair(v: Vida): string {
  const e = env(v)!;
  e.saindo = v.t;
  e.cautela = true;
  registrarRumo(v, 'sair_aos_poucos');
  for (const n of e.negocios ?? []) if (n.estado === 'ativo') n.ritmo = 0;
  anotar(v, 'Começou a sair aos poucos: menos encomendas, os negócios no freio, os contatos avisados.');
  escrever(v, { texto: 'Decidiu sair do que fazia por fora — aos poucos, desfazendo o que tinha.', relevancia: 'biografia', tema: 'trabalho', escolha: true });
  return 'Você avisou quem precisava saber: vai diminuir até parar. Em um ano, se nada mudar, o caminho fica para trás — sem porta batida.';
}

/* ================================================================ família (FAM-12.25) */

const PARENTES_QUE_REAGEM = (v: Vida): Pessoa[] => {
  const out = [...pais(v), ...irmaos(v), ...filhos(v).filter(f => idadePessoa(v, f) >= 12)];
  const par = parceiro(v);
  if (par) out.push(par.p);
  return out.filter(p => p.vivo && !p.especie && v.vinculos[p.id]);
};

/** Como cada um reage: a personalidade (o quanto preza as regras, o quanto acolhe), a relação e o que aconteceu. */
export function posturaDe(v: Vida, p: Pessoa, gravidade: number): ReacaoDaFamilia['postura'] {
  const vin = v.vinculos[p.id];
  const t = p.temperamento;
  const r = rngDe(v.id, 'postura', p.id, Math.floor(v.t / 60));
  const acolhe = (t.afabilidade ?? 0) * 40 + (vin?.proximidade ?? 40) * 0.4 + (vin?.confianca ?? 40) * 0.2 - (vin?.tensao ?? 0) * 0.3;
  const regras = (t.responsabilidade ?? 0) * 50 + gravidade * 8;
  const x = acolhe - regras + (r.next() - 0.5) * 30;
  if (t.responsabilidade < -0.35 && acolhe > 20) return 'apoia';
  if (x > 25) return 'preocupada';
  if (x > -5) return 'pede_para_sair';
  return 'rejeita';
}

/** O ano da família diante do caminho: alguém desconfia, alguém descobre; a reação depende de quem é. */
function anoDaFamilia(v: Vida): void {
  const e = env(v)!;
  const r = rngDe(v.id, 'familia_sub', v.t);
  const fam = (e.familia ??= {});
  const gravidade = e.nivel + (nivelNaOrganizacao(v) >= 0 ? 1 : 0) + (v.justica?.processo || v.justica?.prisao ? 2 : 0);
  const ativoAgora = e.parou === undefined;
  for (const p of PARENTES_QUE_REAGEM(v)) {
    const ja = fam[p.id];
    const mora = v.vinculos[p.id]?.convivio.includes('casa');
    if (!ja) {
      if (!ativoAgora && !v.justica?.processo) continue;
      const chance = (mora ? 0.22 : 0.08) + e.exposicao / 400 + (e.nivel - 1) * 0.05 + (v.justica?.processo ? 0.5 : 0);
      if (r.chance(chance)) fam[p.id] = { sabe: v.justica?.processo || r.chance(0.35) ? 2 : 1, postura: posturaDe(v, p, gravidade), t: v.t };
      continue;
    }
    if (ja.sabe === 1 && r.chance(0.3 + e.exposicao / 300)) { ja.sabe = 2; ja.postura = posturaDe(v, p, gravidade); ja.t = v.t; }
    // Quem saiu do caminho: a família que rejeitou pode voltar (o tempo e o que se fez desde então).
    if (!ativoAgora && (ja.postura === 'rejeita' || ja.postura === 'pede_para_sair') && v.t - (e.parou ?? v.t) >= 12 && r.chance(0.3)) {
      ja.postura = 'reconciliada';
      ja.t = v.t;
      const vin = v.vinculos[p.id];
      if (vin) { vin.tensao = clamp(vin.tensao - 15); vin.confianca = clamp(vin.confianca + 8); }
      lembrarCom(v, p.id, 'Voltaram a se falar depois que você saiu daquilo.', 'reconciliacao', 2);
    }
  }
  // As consequências do ano, para quem sabe (não punição automática: cada postura pesa de um jeito).
  for (const [id, f] of Object.entries(fam)) {
    const vin = v.vinculos[id];
    if (!vin || !v.pessoas[id]?.vivo || f.sabe < 2 || !ativoAgora) continue;
    if (f.postura === 'rejeita') { vin.tensao = clamp(vin.tensao + 4); vin.proximidade = clamp(vin.proximidade - 3); }
    else if (f.postura === 'pede_para_sair') vin.tensao = clamp(vin.tensao + 2);
    else if (f.postura === 'apoia') vin.confianca = clamp(vin.confianca + 1);
  }
  // A cena do ano (uma só, e não todo ano): alguém descobriu agora, ou alguém pede para você sair.
  if (v.fatos['sub125_familia'] !== undefined && v.t - v.fatos['sub125_familia'] < 24) return;
  const recente = Object.entries(fam).find(([id, f]) => f.t === v.t && f.sabe === 2 && v.pessoas[id]?.vivo);
  const pede = Object.entries(fam).find(([id, f]) => f.sabe === 2 && f.postura === 'pede_para_sair' && (f.tConversa === undefined || v.t - f.tConversa >= 36) && v.pessoas[id]?.vivo);
  const alvo = recente ?? (ativoAgora && pede && r.chance(0.5) ? pede : undefined);
  if (alvo) {
    (e.cenas125 ??= {})['sub125_familia'] = alvo[0];
    v.fatos['sub125_familia'] = v.t;
  }
}

/** O que a família sabe, para a tela (só quem sabe ou desconfia). */
export function leituraDaFamilia(v: Vida): { id: string; nome: string; sabe: 'desconfia' | 'sabe'; postura: string }[] {
  const fam = env(v)?.familia ?? {};
  const POSTURA: Record<ReacaoDaFamilia['postura'], string> = { apoia: 'fica do seu lado', preocupada: 'se preocupa, sem cortar relação', rejeita: 'não aceita', pede_para_sair: 'pede que você saia', reconciliada: 'voltou a se aproximar' };
  return Object.entries(fam).filter(([id]) => v.pessoas[id]).map(([id, f]) => ({ id, nome: v.pessoas[id].nome, sabe: f.sabe === 2 ? 'sabe' : 'desconfia', postura: f.sabe === 2 ? POSTURA[f.postura] : 'desconfia, mas não pergunta' }));
}

/* ================================================================ tempo (a semana) */

/** Quantos trabalhos por fora cabem no ano (o tempo é finito: o emprego, a escola e a família também estão na semana). */
export function capacidadeDoAno(v: Vida): number {
  if (v.justica?.prisao) return 0;
  const e = v.trabalho.atual;
  const estuda = !!v.educacao.basica && !v.educacao.evadiu || (!!v.educacao.matricula && !v.educacao.matricula.trancado);
  let x = !e ? 4 : e.carga === 'integral' ? 2 : 3;
  if (estuda) x -= 1;
  if (nivelNaOrganizacao(v) >= 3 || temOrganizacaoPropria(v)) x += 1;
  return Math.max(1, x);
}
/** Quantos trabalhos (encomendas aceitas e operações) já se fez neste ano. */
export const feitosNoAno = (v: Vida) => (v.anoAtual.acoes ?? []).filter(a => a.startsWith('crime:trabalho')).length;
export const temTempo = (v: Vida) => feitosNoAno(v) < capacidadeDoAno(v);
export function usarTempo(v: Vida, oque: string): void { v.anoAtual.acoes.push(`crime:trabalho:${oque}`); }

/* ================================================================ o ano */

/** Depois dos ramos e dos negócios: a carreira (patamar, marcos, ocupação principal), a saída aos poucos, a família. */
export function processarCarreiraCriminal(v: Vida): void {
  const e = env(v);
  if (!e) return;
  const c = garantirCarreira(e);
  if (e.parou === undefined && !preso(v)) {
    c.xp = Math.round(c.xp + 2 + e.nivel + (e.cautela ? -1 : 0));
    const p = patamarAtual(v);
    if (p > c.patamar) {
      c.patamar = p;
      marco(v, ['', 'Ficou conhecid@ no meio: os trabalhos melhores começaram a chegar.', 'Passou a ter influência no meio: gente, negócios, o próprio nome.', 'Chegou à liderança: gente que responde a você.', 'O que fazia por fora virou dinheiro de grande escala.'][p].replace('@', v.eu.genero === 'feminino' ? 'a' : v.eu.genero === 'nao_binario' ? 'e' : 'o'));
      if (p >= 2) pedirRumo(v, 'promocao');
    }
    // A vida reconhece quando o crime virou a ocupação.
    if (crimeEhPrincipal(v)) {
      if (c.principal === undefined) {
        c.principal = v.t;
        marco(v, 'O que fazia por fora virou a ocupação principal: é disso que a vida vive agora.');
      }
    } else if (c.principal !== undefined && v.t - c.principal >= 12) c.principal = undefined;
    // O primeiro ano: a primeira pergunta do rumo (uma vez).
    if (v.t - e.tInicio >= 12 && v.t - e.tInicio < 24) pedirRumo(v, 'primeiro_ano');
    // Sair aos poucos: o prazo vence.
    if (e.saindo !== undefined && v.t - e.saindo >= 12) {
      for (const o of e.organizacoes ?? []) if (o.relacao === 'membro' && o.saiu === undefined) { o.saiu = v.t; o.memoria.push({ t: v.t, fato: 'saida' }); }
      for (const n of e.negocios ?? []) if (n.estado === 'ativo') { n.estado = 'encerrado'; n.tFim = v.t; n.historia.push({ t: v.t, texto: 'Encerrado na saída aos poucos.' }); }
      parar(v);
      abalar(v, 'a saída', 6, -8);
    }
  }
  anoDaFamilia(v);
}

/** Termina o caminho (a saída aos poucos que chegou ao fim) — o `parar` de `ilicito`, sem a pressão do grupo. */
function parar(v: Vida): void {
  const e = env(v)!;
  delete e.saindo;
  e.parou = v.t;
  e.saidaNegociada ??= v.t;
  for (const r of ramosAtivos(e)) e.especializacoes![r]!.largou = v.t;
  v.fatos['saiu_do_esquema'] = v.t;
  marco(v, 'Saiu do caminho aos poucos, como tinha decidido.', false);
  escrever(v, { texto: 'Terminou de sair do que fazia por fora. Ninguém ficou devendo explicação a ninguém.', relevancia: 'marco', tema: 'trabalho', escolha: true });
}

/* ================================================================ legado */

/**
 * O que fica para quem continua a história: o nome da família no meio (a organização lembra), nunca o cargo. O herdeiro
 * pode ser procurado por ela — e decide. Chamado por `sucessao` (pelo fato que ela grava) e lido aqui.
 */
export function legadoDoSubmundo(morto: Vida): { orgs: string[]; nome: number } | undefined {
  const e = morto.caminhos.envolvimento;
  if (!e) return undefined;
  const orgs = (e.organizacoes ?? []).filter(o => (o.relacao === 'membro' || o.relacao === 'aliada') && o.expulso === undefined && o.lealdade >= 40).map(o => o.id);
  const nome = Math.round(clamp((e.reputacao ?? 0) * 0.5 + (garantirCarreira(e).patamar * 12)));
  if (!orgs.length && nome < 20) return undefined;
  return { orgs, nome };
}

/** Cedo ou tarde, para quem cresceu com esse nome: a organização do pai (ou da mãe) aparece. A escolha é de quem herdou. */
export function processarLegado(v: Vida): void {
  const l = v.mundoCriminal?.legado;
  if (!l || v.fatos['legado_sub_visto'] !== undefined) return;
  const i = idade(v);
  if (i < 18 || i > 45 || ativo(v) || preso(v)) return;
  if (rngDe(v.id, 'legado_sub', v.t).chance(0.1 + l.nome / 400)) { v.fatos['sub125_legado'] = v.t; v.fatos['legado_sub_visto'] = v.t; }
}
