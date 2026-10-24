/**
 * REWORK 11.5 · SUB-11 — os RAMOS do Submundo (as especializações), em dados e contas puras.
 *
 * O envolvimento (`ilicito`) continua sendo a trajetória inteira: a exposição, a confiança geral do meio, a
 * investigação, a saída. Dentro dele, a pessoa atua em um ou mais ramos — cada um com a sua prática, o seu nome, o seu
 * risco e a sua gente:
 *
 *   furtos       do pequeno ao grande: o risco sobe com a escala; o parceiro pesa muito
 *   contrabando  compra e venda clandestina: fornecedores, compradores, o mercado que oscila, a apreensão
 *   organizado   uma organização com hierarquia: lealdade, posto, disputas internas, a saída difícil
 *   digital      operações simuladas: pouca exposição por ano, mas a exposição que vem, vem de uma vez
 *   fraudes      redes de influência e o cargo: conflito de interesse, risco reputacional e patrimonial
 *
 * A prática de um ramo vale EM PARTE nos vizinhos (`VIZINHANCA`) — nunca os torna equivalentes. Nada aqui descreve
 * como se faz coisa alguma: são números de risco, gente e consequência.
 */
import { clamp } from '../rng';
import type { CategoriaIlicita, Envolvimento, Especializacao, Ramo, Vida } from '../tipos';

export const RAMOS: Ramo[] = ['furtos', 'contrabando', 'organizado', 'digital', 'fraudes'];

export const NOME_DO_RAMO: Record<Ramo, string> = {
  furtos: 'Furtos e roubos',
  contrabando: 'Contrabando e comércio clandestino',
  organizado: 'Crime organizado',
  digital: 'Crimes digitais',
  fraudes: 'Fraudes e corrupção'
};

/** A categoria antiga (a que a Justiça lê) → o ramo. */
export const RAMO_DA_CATEGORIA: Record<CategoriaIlicita, Ramo> = { pequenos: 'furtos', patrimonial: 'furtos', mercado: 'contrabando', grupo: 'organizado', fraude: 'fraudes', corrupcao: 'fraudes' };

/** O quanto a prática de um ramo vale no outro (parcial — nunca equivalente). */
export const VIZINHANCA: Record<Ramo, Partial<Record<Ramo, number>>> = {
  furtos: { contrabando: 0.2, organizado: 0.3 },
  contrabando: { organizado: 0.3, furtos: 0.15, fraudes: 0.15 },
  organizado: { contrabando: 0.3, furtos: 0.25 },
  digital: { fraudes: 0.35 },
  fraudes: { digital: 0.2, contrabando: 0.1 }
};

/**
 * O perfil de cada ramo: a renda relativa (sobre a tabela do envolvimento), a exposição de um ano de prática, a chance
 * de uma operação dar errado para quem não tem prática, e o quanto o ganho oscila.
 */
export const PERFIL: Record<Ramo, { renda: number; exposicao: number; falha: number; volatil: number }> = {
  furtos: { renda: 1, exposicao: 14, falha: 0.3, volatil: 0.5 },
  contrabando: { renda: 1.05, exposicao: 15, falha: 0.2, volatil: 0.9 },
  organizado: { renda: 1.1, exposicao: 20, falha: 0.16, volatil: 0.45 },
  digital: { renda: 1, exposicao: 9, falha: 0.26, volatil: 1 },
  fraudes: { renda: 1.05, exposicao: 12, falha: 0.16, volatil: 0.6 }
};

/** Os ramos em que se atua hoje (sem os largados). */
export function ramosAtivos(env: Envolvimento | undefined): Ramo[] {
  if (!env) return [];
  return RAMOS.filter(r => { const e = env.especializacoes?.[r]; return !!e && e.largou === undefined; });
}

/** O ramo principal: o de mais prática entre os ativos (ou o da categoria). */
export function ramoPrincipal(env: Envolvimento): Ramo {
  const ativos = ramosAtivos(env);
  if (!ativos.length) return RAMO_DA_CATEGORIA[env.categoria];
  const daCategoria = RAMO_DA_CATEGORIA[env.categoria];
  return [...ativos].sort((a, b) => (env.especializacoes![b]!.experiencia - env.especializacoes![a]!.experiencia) || (Number(b === daCategoria) - Number(a === daCategoria)))[0];
}

/** A prática que se leva para um ramo novo (o que os vizinhos ensinaram). */
export function experienciaHerdada(env: Envolvimento, alvo: Ramo): number {
  let x = 0;
  for (const r of RAMOS) {
    const e = env.especializacoes?.[r];
    if (!e || r === alvo) continue;
    x = Math.max(x, e.experiencia * (VIZINHANCA[r][alvo] ?? 0));
  }
  return Math.round(x);
}

export function novaEspecializacao(v: Vida, env: Envolvimento, ramo: Ramo): Especializacao {
  return { tInicio: v.t, experiencia: Math.max(4, experienciaHerdada(env, ramo)), nome: 5, operacoes: 0, falhas: 0, ganhos: 0, ...(ramo === 'organizado' ? { posto: 1 as const } : {}), ...(ramo === 'contrabando' ? { mercado: 0, estoque: 0 } : {}) };
}

/**
 * Garante o ramo da trajetória antiga (o save de antes do REWORK 11.5, ou quem acabou de entrar): a categoria vira a
 * especialização, com a prática dos anos que já tinha. Idempotente.
 */
export function garantirRamos(v: Vida, env: Envolvimento): void {
  if (env.especializacoes && Object.keys(env.especializacoes).length) return;
  const ramo = RAMO_DA_CATEGORIA[env.categoria];
  const anos = Math.max(0, ((env.parou ?? v.t) - env.tInicio) / 12);
  env.especializacoes = {
    [ramo]: {
      tInicio: env.tInicio,
      experiencia: Math.round(clamp(6 + anos * 6 + env.nivel * 6 + (env.trabalhos ?? 0) * 4, 0, 85)),
      nome: Math.round(clamp((env.reputacao ?? 10) * 0.8, 0, 90)),
      operacoes: env.trabalhos ?? 0,
      falhas: 0,
      ganhos: env.ganhos,
      ...(env.parou !== undefined ? { largou: env.parou } : {}),
      ...(ramo === 'organizado' ? { posto: (env.nivel >= 3 ? 2 : 1) as 1 | 2 } : {}),
      ...(ramo === 'contrabando' ? { mercado: 0, estoque: 0 } : {})
    }
  };
}

/** O peso de cada ramo no ano (o principal inteiro; os outros, uma parte — ninguém dá conta de tudo igual). */
export function pesoDoRamo(env: Envolvimento, ramo: Ramo): number {
  return ramo === ramoPrincipal(env) ? 1 : 0.4;
}

/**
 * O fator da renda do ano sobre a tabela do envolvimento: cada ramo ativo conta pelo peso, pela prática e pelo nome, e
 * o contrabando pelo mercado. Um ramo só, com prática média, dá ~1 (a calibragem do REWORK 10/11 fica de pé).
 */
export function fatorDosRamos(env: Envolvimento): number {
  const ativos = ramosAtivos(env);
  if (!ativos.length) return 1;
  let f = 0;
  for (const r of ativos) {
    const e = env.especializacoes![r]!;
    const pratica = 0.8 + e.experiencia / 400 + e.nome / 1000;
    const mercado = r === 'contrabando' ? 1 + (e.mercado ?? 0) * 0.15 : 1;
    f += PERFIL[r].renda * pesoDoRamo(env, r) * pratica * mercado;
  }
  return clamp(f, 0.5, 2.2);
}

/** A exposição de um ano de prática, somada pelos ramos — e mais por atuar em várias frentes ao mesmo tempo. */
export function exposicaoDosRamos(env: Envolvimento, base: number): number {
  const ativos = ramosAtivos(env);
  if (!ativos.length) return base;
  const soma = ativos.reduce((s, r) => s + PERFIL[r].exposicao * pesoDoRamo(env, r), 0);
  return Math.round(soma + (base - PERFIL[RAMO_DA_CATEGORIA[env.categoria]].exposicao) + Math.max(0, ativos.length - 1) * 3);
}

/** A categoria com que a Justiça lê o ramo (o crime digital, para ela, é fraude; o furto do menor, "coisas da turma"). */
export function categoriaDoRamo(ramo: Ramo, menor: boolean, comCargo: boolean): CategoriaIlicita {
  switch (ramo) {
    case 'furtos': return menor ? 'pequenos' : 'patrimonial';
    case 'contrabando': return 'mercado';
    case 'organizado': return 'grupo';
    case 'digital': return 'fraude';
    case 'fraudes': return comCargo ? 'corrupcao' : 'fraude';
  }
}

/** A chance de uma operação dar errado: o perfil do ramo, menos a prática e o parceiro de confiança; mais a escala. */
export function chanceDeFalha(env: Envolvimento, ramo: Ramo, escala: 1 | 2 | 3, parceiroDeConfianca: boolean): number {
  const e = env.especializacoes?.[ramo];
  const pratica = e ? e.experiencia / 100 : 0;
  return clamp(PERFIL[ramo].falha * (0.6 + escala * 0.35) - pratica * 0.16 - (parceiroDeConfianca ? 0.05 : 0) + (env.cautela ? -0.03 : 0), 0.05, 0.7);
}

/** O ganho do ano do envolvimento, repartido pelos ramos ativos (pelo peso de cada um): o que cada frente rendeu. */
export function creditarRamos(env: Envolvimento, ganho: number): void {
  const ativos = ramosAtivos(env);
  if (!ativos.length || ganho <= 0) return;
  const pesos = ativos.map(r => pesoDoRamo(env, r));
  const soma = pesos.reduce((a, b) => a + b, 0);
  ativos.forEach((r, k) => { env.especializacoes![r]!.ganhos += Math.round(ganho * pesos[k] / soma / 100) * 100; });
}
