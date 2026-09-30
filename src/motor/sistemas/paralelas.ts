/**
 * Trajetórias paralelas e pausadas: a vida profissional não é um slot único.
 *
 *   PRINCIPAL — `trabalho.atual`: o trabalho de todo dia (a tela, a semana e o
 *   dinheiro partem dele).
 *   PARALELA — `trabalho.paralela`: uma segunda trajetória ativa, quando
 *   conciliar é plausível (uma das duas é por conta, por projeto, de meio
 *   período). Rende menos, pede parte da semana, conta experiência e tem as
 *   próprias ações. A professora que atua; o ator que segue fazendo alguns
 *   trabalhos durante a bolsa.
 *   PAUSADA — `trabalho.pausadas`: a carreira que ficou em espera. PAUSAR NÃO
 *   É APAGAR: o currículo (obras, experiência, freguesia, contatos) e o nome
 *   continuam; voltar é RETORNO (a freguesia volta menor, mas não do zero).
 *   ENCERRADA — `trabalho.historico`: o que passou (e continua biografia).
 *
 *   Nenhuma dessas mudanças acontece sem escolha: quem decide é o plano da
 *   pergunta de conflito (`compromissos`) ou uma ação do jogador (Trabalho).
 */

import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Emprego, TrajetoriaPausada, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { ocupacao, ocupacaoOuNula, ROTULO_TRILHA, type Ocupacao } from '../dados/ocupacoes';
import { habilidade, praticar } from './frentes';
import { marcar } from './marcas';
import { encerrarEmprego, nomeOcupacao, rendaDeClientela } from './trabalho';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { anoDe } from '../tempo';

/** Trilhas artísticas (a obra, o público, a agenda por projeto). */
export const TRILHAS_ARTISTICAS = new Set(['cena', 'musica', 'danca', 'literatura', 'conteudo', 'ilustracao', 'imagem', 'orquestra']);
/** Trilhas acadêmicas (a pesquisa, a docência superior). */
export const TRILHAS_ACADEMICAS = new Set(['academia', 'pesquisa', 'docencia_superior']);

/** Quanto do trabalho uma trajetória paralela rende (ela recebe parte da semana, não a semana inteira). */
export const FATOR_PARALELA = 0.45;
/** A licença sem remuneração de um servidor espera por um tempo limitado (simplificado: três anos). */
export const MESES_LICENCA = 36;

/** Trabalha por projeto, agenda, freguesia (não por expediente fixo)? */
export function flexivel(e: Pick<Emprego, 'contrato' | 'carga' | 'clientela'> | undefined, oc?: Ocupacao): boolean {
  if (!e) return false;
  if (e.carga === 'parcial') return true;
  if (e.clientela !== undefined) return true;
  if (oc && TRILHAS_ARTISTICAS.has(oc.trilha) && (e.contrato === 'autonomo' || e.contrato === 'informal')) return true;
  return false;
}

const eFlexivelOc = (oc: Ocupacao) => oc.carga === 'parcial' || oc.promocao === 'clientela' || (TRILHAS_ARTISTICAS.has(oc.trilha) && (oc.contrato === 'autonomo' || oc.contrato === 'informal'));

/**
 * Dá para CONCILIAR o trabalho de agora com o novo? Só quando um dos dois é
 * flexível (por conta, por projeto, meio período) e nenhum é de regra fechada
 * (farda, mandato, formação em internato, estágio/aprendiz), sem já existir
 * uma paralela.
 */
export function podeConciliar(v: Vida, novo: Ocupacao): boolean {
  const e = v.trabalho.atual;
  if (!e || v.trabalho.paralela) return false;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc || oc.id === novo.id) return false;
  const fechado = (x: Ocupacao, c: string) => ['militar', 'eletivo', 'estagio', 'aprendiz'].includes(c) || !!x.formacaoInicial || x.jornada === 'fora' || x.trilha === 'atleta';
  if (fechado(oc, e.contrato) || fechado(novo, novo.contrato)) return false;
  if (e.formacaoAte) return false;
  return flexivel(e, oc) || eFlexivelOc(novo);
}

/**
 * Dá para PAUSAR o trabalho de agora (em vez de encerrar)? Quem trabalha por
 * conta ou por projeto pausa a agenda; o servidor pede licença sem salário.
 * O emprego de carteira comum não "pausa": ou se fica, ou se sai.
 */
export function podePausar(v: Vida): boolean {
  const e = v.trabalho.atual;
  if (!e || e.formacaoAte || e.contrato === 'eletivo' || e.contrato === 'militar' || e.contrato === 'estagio' || e.contrato === 'aprendiz') return false;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc || oc.trilha === 'atleta') return false;
  if (e.contrato === 'servidor') return !(v.trabalho.pausadas ?? []).some(p => p.licenca);
  return flexivel(e, oc);
}

/** Qual das duas fica como principal ao conciliar: a de expediente fixo; entre duas flexíveis, a nova. */
export function novaViraPrincipal(v: Vida, novo: Ocupacao): boolean {
  const e = v.trabalho.atual!;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  const atualFlex = flexivel(e, oc);
  const novoFlex = eFlexivelOc(novo);
  if (atualFlex && !novoFlex) return true;
  if (!atualFlex && novoFlex) return false;
  return true;
}

/** Pausa o trabalho de agora (guarda tudo: é para voltar). */
export function pausarAtual(v: Vida, motivo: string): TrajetoriaPausada | undefined {
  const t = v.trabalho;
  const e = t.atual;
  if (!e) return undefined;
  const oc = ocupacao(e.ocupacaoId);
  const nome = nomeOcupacao(v, oc);
  const licenca = e.contrato === 'servidor' ? { tAte: v.t + MESES_LICENCA } : undefined;
  const p: TrajetoriaPausada = { emprego: { ...e }, t: v.t, motivo, ...(licenca ? { licenca } : {}) };
  t.pausadas = [...(t.pausadas ?? []).filter(x => x.emprego.ocupacaoId !== e.ocupacaoId), p].slice(-4);
  t.atual = undefined;
  t.horasExtras = false;
  const texto = licenca
    ? `Pediu licença sem salário do cargo de ${nome} ${motivo}: o cargo espera até ${anoDe(licenca.tAte)}.`
    : `Pôs a carreira de ${nome} em pausa ${motivo} — o que construiu (trabalhos, contatos, nome) continua.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true });
  marcar(v, 'pausa', texto, 2, { trilha: oc.trilha, ocupacaoId: oc.id });
  return p;
}

/** O trabalho de agora passa a ser paralelo (o novo entra como principal). */
export function moverParaParalela(v: Vida, motivo: string): void {
  const t = v.trabalho;
  const e = t.atual;
  if (!e) return;
  const oc = ocupacao(e.ocupacaoId);
  t.paralela = { ...e, carga: 'parcial', salario: Math.round(e.salario * FATOR_PARALELA / 10) * 10 };
  t.atual = undefined;
  t.horasExtras = false;
  const texto = `Manteve ${nomeOcupacao(v, oc)} em paralelo ${motivo}: menos trabalhos, a trajetória segue viva.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true });
}

/** O NOVO trabalho entra como paralelo (o de agora continua sendo o principal). Devolve o emprego criado. */
export function entrarComoParalela(v: Vida, e: Emprego): Emprego {
  const p: Emprego = { ...e, carga: 'parcial', salario: Math.round(e.salario * FATOR_PARALELA / 10) * 10 };
  v.trabalho.paralela = p;
  return p;
}

/** Desfaz a paralela (fica no histórico, com o motivo). */
export function encerrarParalela(v: Vida, motivo: string, escolha = true): void {
  const t = v.trabalho;
  const e = t.paralela;
  if (!e) return;
  t.historico.push({ ...e, tFim: v.t, motivo });
  t.paralela = undefined;
  const nome = nomeOcupacao(v, ocupacao(e.ocupacaoId));
  escrever(v, { texto: escolha ? `Deixou a trajetória paralela de ${nome}.` : `A trajetória paralela de ${nome} acabou: ${motivo}.`, relevancia: 'biografia', tema: 'trabalho', escolha });
}

/** Troca: a paralela vira a principal e a principal vira a paralela. */
export function trocarPrincipal(v: Vida): void {
  const t = v.trabalho;
  if (!t.atual || !t.paralela) return;
  const antes = t.atual;
  const par = t.paralela;
  const cheia = (e: Emprego) => ({ ...e, carga: ocupacao(e.ocupacaoId).carga, salario: Math.round(e.salario / FATOR_PARALELA / 10) * 10 });
  t.atual = cheia(par);
  t.paralela = { ...antes, carga: 'parcial', salario: Math.round(antes.salario * FATOR_PARALELA / 10) * 10 };
  escrever(v, { texto: `${cap(nomeOcupacao(v, ocupacao(par.ocupacaoId)))} passou a ser o trabalho principal; ${nomeOcupacao(v, ocupacao(antes.ocupacaoId))} ficou em paralelo.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
}

/** Desiste de uma trajetória pausada (vira histórico). */
export function encerrarPausada(v: Vida, k: number, motivo = 'encerrou a carreira pausada', escolha = true): void {
  const lista = v.trabalho.pausadas ?? [];
  const p = lista[k];
  if (!p) return;
  v.trabalho.pausadas = lista.filter((_, j) => j !== k);
  v.trabalho.historico.push({ ...p.emprego, tFim: v.t, motivo });
  const oc = ocupacao(p.emprego.ocupacaoId);
  const nome = nomeOcupacao(v, oc);
  const texto = p.licenca ? `Deixou de vez o cargo de ${nome} (a licença acabou sem volta).` : `Encerrou de vez a carreira de ${nome}.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha });
  marcar(v, 'fim_carreira', texto, 2, { trilha: oc.trilha, ocupacaoId: oc.id });
}

/**
 * A volta: o emprego guardado retorna (não é contratação nova). A freguesia
 * esfria com os anos parados, mas não volta ao zero; a licença devolve o cargo.
 */
export function retomarPausada(v: Vida, k: number): Emprego | undefined {
  const lista = v.trabalho.pausadas ?? [];
  const p = lista[k];
  if (!p) return undefined;
  const anos = Math.max(0, (v.t - p.t) / 12);
  const e: Emprego = { ...p.emprego, municipioId: v.moradia.municipioId, tPosto: p.emprego.tPosto ?? p.emprego.tInicio, via: 'retorno' };
  const oc = ocupacao(e.ocupacaoId);
  if (e.clientela !== undefined) {
    // O nome e os contatos continuam: esfria, mas fica pelo menos um terço do que havia.
    e.clientela = Math.round(Math.max(e.clientela / 3, e.clientela * Math.pow(0.85, anos)));
    e.salario = rendaDeClientela(v, oc, e.clientela, e);
  }
  v.trabalho.pausadas = lista.filter((_, j) => j !== k);
  v.trabalho.atual = e;
  v.trabalho.desempregadoDesde = undefined;
  const nome = nomeOcupacao(v, oc);
  const quanto = anos >= 1 ? ` depois de ${Math.round(anos)} ${Math.round(anos) === 1 ? 'ano' : 'anos'}` : '';
  const texto = p.licenca ? `Voltou ao cargo de ${nome}${quanto} de licença.` : `Voltou a trabalhar como ${nome}${quanto}: o currículo estava lá, e alguns contatos também.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, 'retorno', texto, 2, { trilha: oc.trilha, ocupacaoId: oc.id });
  return e;
}

/** Índice de uma trajetória pausada da mesma ocupação (ou da mesma trilha), quando existe. */
export function pausadaDe(v: Vida, ocupacaoId: string): number {
  const lista = v.trabalho.pausadas ?? [];
  const k = lista.findIndex(p => p.emprego.ocupacaoId === ocupacaoId);
  if (k >= 0) return k;
  const tr = ocupacaoOuNula(ocupacaoId)?.trilha;
  return lista.findIndex(p => ocupacaoOuNula(p.emprego.ocupacaoId)?.trilha === tr);
}

/* ---------------------------------------------------------- Ano da paralela */

/**
 * O ano de uma trajetória paralela: conta experiência (meio tempo), a
 * freguesia anda (devagar: é parte da semana), o contrato com prazo acaba.
 * Licenças que vencem viram pergunta (`conteudo`: `par_licenca`), nunca
 * decisão silenciosa.
 */
export function processarParalelas(v: Vida, _r?: Rng): void {
  const t = v.trabalho;
  const r = rngDe(v.id, 'paralela', v.t);
  const e = t.paralela;
  if (e) {
    const oc = ocupacao(e.ocupacaoId);
    t.experiencia[oc.trilha] = (t.experiencia[oc.trilha] ?? 0) + 6;
    if (oc.duracao && v.t - e.tInicio >= oc.duracao) {
      encerrarParalela(v, 'fim do contrato', false);
    } else if (e.clientela !== undefined) {
      const hab = oc.habilidade ? habilidade(v, oc.habilidade.dominio) : 55;
      e.clientela = Math.round(clamp(e.clientela + (hab - 55) / 14 - 1.5 + r.normal() * 4, 0, 100));
      e.salario = Math.round(rendaDeClientela(v, oc, e.clientela, e) * FATOR_PARALELA / 10) * 10;
      if (e.clientela <= 4) encerrarParalela(v, 'os trabalhos foram rareando até parar', false);
    }
  }
  // A licença que venceu sem volta: o cargo acaba (a pergunta foi feita um ano antes — `par_licenca`).
  const lista = t.pausadas ?? [];
  for (let k = lista.length - 1; k >= 0; k--) if (lista[k].licenca && lista[k].licenca!.tAte <= v.t) encerrarPausada(v, k, 'a licença acabou sem volta', false);
  // Uma paralela não sobrevive sem principal: vira o trabalho de todo dia.
  if (!t.atual && t.paralela) {
    const p = t.paralela;
    t.atual = { ...p, carga: ocupacao(p.ocupacaoId).carga, salario: Math.round(p.salario / FATOR_PARALELA / 10) * 10 };
    t.paralela = undefined;
    t.desempregadoDesde = undefined;
    escrever(v, { texto: `${cap(nomeOcupacao(v, ocupacao(p.ocupacaoId)))}, que corria em paralelo, virou o trabalho de todo dia.`, relevancia: 'biografia', tema: 'trabalho' });
  }
}

/** Ritmo leve de quem vive da arte: a semana que sobra vira prática (derivado; gerador próprio). */
export function tempoParaAObra(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e || e.ritmo !== 'leve' || e.clientela === undefined) return;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc || !TRILHAS_ARTISTICAS.has(oc.trilha) || !oc.habilidade) return;
  praticar(v, rngDe(v.id, 'obra', v.t), oc.habilidade.dominio, 0.4, 1.1);
}

/** Uma licença perto de acabar (a pergunta abre um ano antes do fim). */
export function licencaVencendo(v: Vida): number {
  return (v.trabalho.pausadas ?? []).findIndex(p => p.licenca && p.licenca.tAte - v.t <= 12);
}

/* ------------------------------------------------------------- Disponibilidade */

export function disponibilidadeParalela(v: Vida, oque: 'deixar' | 'principal' | 'retomar' | 'encerrar_pausada', k?: number): Veredito {
  const t = v.trabalho;
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre a pena.');
  switch (oque) {
    case 'deixar': return t.paralela ? PERMITIDO : bloqueio('incompativel', 'Não há trajetória paralela.');
    case 'principal': return t.paralela && t.atual ? PERMITIDO : bloqueio('incompativel', 'Não há o que trocar.');
    case 'retomar': case 'encerrar_pausada': {
      const p = (t.pausadas ?? [])[k ?? -1];
      if (!p) return bloqueio('incompativel', 'Essa trajetória não está pausada.');
      if (oque === 'retomar' && idade(v) >= 75 && !p.licenca) return bloqueio('improvavel', 'Voltar agora seria improvável.');
      return PERMITIDO;
    }
  }
}

/* --------------------------------------------------------------- Leitura */

/** A trajetória profissional inteira, em linhas (principal, paralela, pausadas, o que passou). */
export function leituraDasTrajetorias(v: Vida): { rotulo: string; texto: string; estado: 'principal' | 'paralela' | 'pausada' | 'encerrada' }[] {
  const out: { rotulo: string; texto: string; estado: 'principal' | 'paralela' | 'pausada' | 'encerrada' }[] = [];
  const t = v.trabalho;
  const nome = (e: Emprego) => nomeOcupacao(v, ocupacao(e.ocupacaoId));
  if (t.atual) out.push({ rotulo: cap(nome(t.atual)), texto: `principal, desde ${anoDe(t.atual.tInicio)}`, estado: 'principal' });
  if (t.paralela) out.push({ rotulo: cap(nome(t.paralela)), texto: `em paralelo, desde ${anoDe(t.paralela.tInicio)}`, estado: 'paralela' });
  for (const p of t.pausadas ?? []) out.push({ rotulo: cap(nome(p.emprego)), texto: p.licenca ? `de licença até ${anoDe(p.licenca.tAte)}` : `em pausa desde ${anoDe(p.t)}`, estado: 'pausada' });
  // O que passou, por área (a experiência não some).
  const porTrilha = new Map<string, { meses: number; ultimo: number }>();
  for (const h of t.historico) {
    const oc = ocupacaoOuNula(h.ocupacaoId);
    if (!oc || ['estagio', 'aprendiz'].includes(h.contrato)) continue;
    const x = porTrilha.get(oc.trilha) ?? { meses: 0, ultimo: 0 };
    x.meses += Math.max(0, h.tFim - h.tInicio);
    x.ultimo = Math.max(x.ultimo, h.tFim);
    porTrilha.set(oc.trilha, x);
  }
  const ativas = new Set([t.atual, t.paralela, ...(t.pausadas ?? []).map(p => p.emprego)].filter(Boolean).map(e => ocupacaoOuNula(e!.ocupacaoId)?.trilha));
  for (const [tr, x] of porTrilha) {
    if (ativas.has(tr) || x.meses < 12) continue;
    const anos = Math.round(x.meses / 12);
    out.push({ rotulo: cap(ROTULO_TRILHA[tr] ?? tr), texto: `${anos} ${anos === 1 ? 'ano' : 'anos'}, até ${anoDe(x.ultimo)}`, estado: 'encerrada' });
  }
  return out;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export { encerrarEmprego };
