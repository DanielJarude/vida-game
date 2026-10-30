/**
 * REWORK 10 · CRI-01 — O PROCESSO COMO CAMINHO: suspeita → investigação → acusação → defesa → (acordo) → julgamento →
 * absolvição ou condenação (multa, pena alternativa, prisão) → recurso → cumprimento → saída → reabilitação.
 *
 * O que entrava na sentença de antes (`justica.sentenca`) era a categoria, a defesa paga ou pública e a reincidência. O
 * que entra agora é o que um processo tem de verdade — e o que o jogador decide nele:
 *
 *   as PROVAS     o quanto o que se fez está à vista (a exposição do caminho; na agressão, a lesão e as testemunhas);
 *   a DEFESA      a pública (`perfilPenal.defensoria`) ou um advogado — escolha, com o preço dito (`jus_defesa`);
 *   o ACORDO      onde a lei do país tem a porta (`perfilPenal.acordo`): uma pena certa e menor agora, contra o risco do
 *                 julgamento (`jus_acordo`); o acordo "limitado" não vira condenação na ficha;
 *   ASSUMIR       confessar: menos chance de absolvição, pena menor, a família ouve de você;
 *   COOPERAR      onde a colaboração existe: a pena cai muito — e quem foi entregue não esquece (a pressão do grupo);
 *   a FIANÇA      onde a lei tem (`perfilPenal.fianca`): esperar o julgamento solto, pagando;
 *   o PAÍS        a severidade das penas e a multa como resposta ao que é leve (`perfilPenal`);
 *   o RECURSO     depois da condenação: um ano de espera, às vezes a pena cai (`jus_recurso`);
 *   a REABILITAÇÃO os anos que a lei do país pede depois do fim da pena, sem nada novo: o registro sai de circulação.
 *
 * Nada aqui descreve como se comete, se esconde ou se foge de coisa alguma: é o que acontece com a vida de quem responde.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Vida } from '../tipos';
import { escrever, idade, lembrarCom, marcarFato, pais, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { marcar } from './marcas';
import { abalar } from './abalo';
import { disponivel, vereditoDePagar } from './dinheiro';
import { dinheiro, flex, ge } from '../texto';
import { anoDe } from '../tempo';
import { garantirJustica, NOME_CATEGORIA, prender, registrarTribunal, reincidente, soltar } from './justica';
import { perfilPenal, type PerfilPenal } from '../mundo/justicaPorPais';
import { paisDaVida } from '../mundo/vida';
import { economiaLocal } from '../dados/lugares';
import { salarioMinimoDoPais } from '../mundo/economia';
import { pagarJustica, pagarPorFora } from './porFora';
import { ajusteDoJuiz, ator, designar, lembrarAtor, quemE } from './atoresJudiciais';

export const perfilDaVida = (v: Vida): PerfilPenal => perfilPenal(paisDaVida(v));
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 100) * 100;
/** O que um advogado particular cobra por um processo (o que se tem pesa: quem tem mais, paga mais). */
export const honorarios = (v: Vida) => Math.round(clamp(disponivel(v) * 0.2, preco(v, 9000), preco(v, 45000)) / 100) * 100;

/** A pena-base em anos (antes do país, da reincidência e do que se decidiu no processo). */
const PENA_BASE = { pequenos: 1, patrimonial: 2, fraude: 3, mercado: 3, grupo: 7, violencia: 1, corrupcao: 4 } as const;
/** O que é leve (cabe multa ou pena alternativa a quem é primário). */
const LEVE = new Set(['pequenos', 'patrimonial', 'violencia']);
/**
 * REWORK 12.2 · ajuste do Submundo: o crime sem violência (fraude, contrabando, corrupção) de quem é primário, com pena
 * de até quatro anos, cabe pena restritiva de direitos (serviço, multa, a perda do que entrou) em vez de prisão — o
 * organizado e a reincidência, não.
 */
const SEM_VIOLENCIA = new Set(['fraude', 'mercado', 'corrupcao']);

/* ---------------------------------------------------------------- A abertura */

/**
 * Ao abrir o processo: as provas (o que existe contra a pessoa), e as perguntas que o processo faz — a defesa, e a
 * fiança de quem ficou preso esperando, onde a lei a admite.
 */
function aoAbrir(v: Vida, r: Rng): void {
  const j = v.justica!;
  const p = j.processo;
  if (!p) return;
  const env = v.caminhos.envolvimento;
  const base = p.categoria === 'violencia'
    ? 40 + (v.fatos['denuncia_agressao'] === v.t ? 15 : 0)
    : (env ? Math.max(env.exposicao, 25) : 45) + (p.categoria === 'grupo' ? 10 : 0);
  p.provas = clamp(Math.round(base + (r.next() - 0.5) * 20), 10, 95);
  // A defesa é escolha: a pergunta abre (o jogo não paga o advogado sozinho).
  v.fatos['jus_defesa'] = v.t;
  const perfil = perfilDaVida(v);
  if (j.prisao && perfil.fianca && p.categoria !== 'grupo' && !reincidente(v)) {
    p.fianca = Math.max(preco(v, 3000), Math.round(salarioMinimoDoPais(paisDaVida(v)) * (p.categoria === 'mercado' || p.categoria === 'corrupcao' ? 20 : 8) / 100) * 100);
    v.fatos['jus_fianca'] = v.t;
  }
}

/* ---------------------------------------------------------------- O ano do processo */

/** O acordo aparece onde a lei o tem, quando as provas são fortes o bastante para a acusação querer encerrar. */
export function processarTribunal(v: Vida, r: Rng): void {
  const j = v.justica;
  if (!j) return;
  const p = j.processo;
  if (p && !p.acordo && (p.provas ?? 0) >= 35 && v.t - p.tInicio >= 6 && v.t < p.tJulgamento) {
    const perfil = perfilDaVida(v);
    if (perfil.acordo !== 'nao' && (perfil.acordo === 'amplo' || LEVE.has(p.categoria) || p.categoria === 'fraude' || p.cooperou)) {
      p.acordo = { t: v.t };
      v.fatos['jus_acordo'] = v.t;
    }
  }
  // O recurso: a resposta chega.
  const rec = j.recurso;
  if (rec && v.t >= rec.tFim) {
    j.recurso = undefined;
    const ult = j.antecedentes[j.antecedentes.length - 1];
    const x = r.next();
    if (x < 0.1 && j.prisao) {
      if (ult) ult.desfecho = 'absolvicao';
      escrever(v, { texto: 'O recurso foi aceito: a condenação caiu. Saiu pela porta da frente.', relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
      soltar(v, 'absolvição');
    } else if (x < 0.32 && j.prisao) {
      const corte = Math.round((j.prisao.tFim - v.t) * 0.3);
      j.prisao.tFim = Math.max(v.t, j.prisao.tFim - corte);
      escrever(v, { texto: `O recurso reduziu a pena: a saída passou para ${anoDe(j.prisao.tFim)}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    } else escrever(v, { texto: 'O recurso foi negado. A pena ficou como estava.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
}

/* ---------------------------------------------------------------- A sentença */

/** A chance de absolvição: a defesa, as provas, o que se assumiu, a reincidência. */
export function chanceDeAbsolvicao(v: Vida): number {
  const p = v.justica!.processo!;
  const provas = p.provas ?? 50;
  // REWORK 12.25: prova fraca (abaixo de 40) pesa de verdade a favor de quem responde — antes, com provas "fracas", a
  // condenação ainda passava da metade. Continua com teto: dinheiro não compra absolvição.
  // REWORK 12.3 · C3: o rigor de quem julga mexe pouco (±5 pontos). C1: a influência comprada soma por fora do teto dos
  // autos, com o seu próprio teto (85%): nem a corrupção garante absolvição — o processo tem provas, e o juiz, limites.
  const autos = clamp((p.defesa === 'particular' ? 0.3 : 0.18) + (55 - provas) / 160 + Math.max(0, 40 - provas) / 80 - (p.assumiu ? 0.2 : 0) - (p.cooperou ? 0.25 : 0) + ajusteDoJuiz(ator(v, p.juizId)), 0.02, 0.7) * (reincidente(v) ? 0.5 : 1);
  return p.influencia ? Math.min(0.85, autos + p.influencia) : autos;
}

/** A multa penal: dias-multa pela renda (um dia de renda por dia, metade a dois terços), com piso. */
export function multaPenal(v: Vida, dias: number): number {
  const rendaDia = Math.max(salarioMinimoDoPais(paisDaVida(v)), v.trabalho.atual?.salario ?? 0) / 30;
  return Math.max(preco(v, 400), Math.round(rendaDia * dias * 0.6 / 10) * 10);
}

/**
 * O que entrou por fora não fica (a perda do produto do crime; na fraude e na corrupção, a reparação do dano): a Justiça
 * manda devolver uma parte do que se ganhou — do que há na conta e nas aplicações; o que faltar vira dívida, em
 * parcelas. É o que impede o caminho de ser, no fim, a melhor maneira de enriquecer. A agressão não tem "ganho".
 */
export function confiscar(v: Vida, fracao: number, oque: string): number {
  const env = v.caminhos.envolvimento;
  if (!env) return 0;
  const jaDevolvido = v.fatos['confiscado_total'] ?? 0;
  const devido = Math.round(Math.max(0, env.ganhos - jaDevolvido) * fracao / 100) * 100;
  if (devido <= 0) return 0;
  const tem = Math.max(0, disponivel(v));
  const paga = Math.min(tem, devido);
  if (paga > 0) pagarPorFora(v, 'perdas', paga);
  const falta = devido - paga;
  if (falta > 0) {
    const prazo = 60;
    v.financas.dividas.push({ id: `confisco${v.seq++}`, tipo: 'acordo', saldo: falta, jurosMes: 0.004, parcela: Math.ceil(falta / prazo), descricao: oque, tInicio: v.t, prazo });
  }
  v.fatos['confiscado_total'] = jaDevolvido + devido;
  escrever(v, { texto: `${oque}: ${dinheiro(devido)}${falta > 0 ? ` — ${dinheiro(paga)} na hora e o resto em parcelas` : ''}.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
  return devido;
}
const NOME_DO_CONFISCO = (cat: string) => (cat === 'fraude' || cat === 'corrupcao' ? 'A Justiça mandou reparar o dano (devolver o que foi desviado)' : 'A Justiça confiscou o que entrou por fora');

function sentenciar(v: Vida, r: Rng): void {
  const j = v.justica!;
  const p = j.processo!;
  j.processo = undefined;
  const perfil = perfilDaVida(v);
  const rein = reincidente(v);
  const cat = p.categoria;
  const presoAntes = j.prisao;
  const g = ge(v);
  if (r.chance(chanceDeAbsolvicao({ ...v, justica: { ...j, processo: p } }))) {
    j.antecedentes.push({ t: v.t, categoria: cat, desfecho: 'absolvicao' });
    if (presoAntes) soltar(v, 'absolvição');
    const juiz = ator(v, p.juizId), def = ator(v, p.defensorId);
    const comQuem = p.defesa === 'particular' ? (p.pagaPor === 'organizacao' ? `, com ${def?.nome ?? 'o advogado'} que a organização pôs no caso` : `, com a defesa de ${def?.nome ?? 'um advogado particular'}`) : def ? `, com ${def.nome} na defesa pública` : '';
    lembrarAtor(v, p.juizId, `absolveu você num processo por ${NOME_CATEGORIA[cat]}`);
    escrever(v, { texto: `Absolvi${flex(g, 'do', 'da', 'de')} no processo${juiz ? ` (${quemE(juiz)})` : ''}${comQuem}. O alívio veio junto com o cansaço de ter esperado.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    abalar(v, 'a absolvição', 8, -8);
    return;
  }
  lembrarAtor(v, p.juizId, `condenou você num processo por ${NOME_CATEGORIA[cat]}`);
  // A pena: a base da categoria, o país, a reincidência, e o que se decidiu (assumir, cooperar).
  const reduz = (p.cooperou ? 0.45 : 0) + (p.assumiu ? 0.25 : 0);
  const anosBrutos = (PENA_BASE[cat] + r.int(0, 2)) * (rein ? 1.5 : 1) * perfil.severidade * (1 - Math.min(0.6, reduz));
  // O leve, para quem é primário e não estava preso: a multa (onde ela é a resposta) ou a pena alternativa.
  if ((LEVE.has(cat) && !rein && !presoAntes && anosBrutos <= 2.5) || (SEM_VIOLENCIA.has(cat) && !rein && !presoAntes && anosBrutos <= 4)) {
    if (perfil.multa || cat === 'violencia') {
      const multa = multaPenal(v, r.int(30, 120));
      pagarPorFora(v, 'perdas', Math.min(multa, Math.max(0, disponivel(v))));
      j.antecedentes.push({ t: v.t, categoria: cat, desfecho: 'alternativa', multa });
      if (!perfil.multa) j.alternativa = { tFim: v.t + r.int(6, 12) };
      if (cat !== 'violencia') confiscar(v, 0.8, NOME_DO_CONFISCO(cat));
      escrever(v, { texto: `Condenad${flex(g, 'o', 'a', 'e')}: uma multa de ${dinheiro(multa)}${perfil.multa ? '' : ' e alguns meses de serviço à comunidade'}. A ficha, agora, existe.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
      marcar(v, 'fracasso', 'Condenação a multa.', 2);
      abalar(v, 'a condenação', -6, 8);
      return;
    }
    const meses = r.int(10, 24);
    j.alternativa = { tFim: v.t + meses };
    j.antecedentes.push({ t: v.t, categoria: cat, desfecho: 'alternativa' });
    if ((cat as string) !== 'violencia') confiscar(v, 0.8, NOME_DO_CONFISCO(cat));
    escrever(v, { texto: `Condenad${flex(g, 'o', 'a', 'e')} a pena alternativa: prestação de serviços à comunidade por ${Math.round(meses / 12) || 1} ano${meses >= 18 ? 's' : ''}, em liberdade. A ficha, agora, existe.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'fracasso', 'Condenação a pena alternativa.', 3);
    abalar(v, 'a condenação', -8, 10);
    return;
  }
  const anos = Math.max(1, Math.round(anosBrutos));
  j.antecedentes.push({ t: v.t, categoria: cat, desfecho: 'prisao', anos });
  if (cat !== 'violencia') confiscar(v, 0.9, NOME_DO_CONFISCO(cat));
  const fechado = Math.round(anos * 12 * (rein ? 0.45 : 0.3));
  const inicio = presoAntes ? presoAntes.tInicio : v.t;
  const fim = Math.max(v.t + 6, inicio + fechado);
  const regime = anos >= 8 || presoAntes ? 'fechado' : 'semiaberto';
  prender(v, fim, regime, 'pena');
  j.prisao!.penaMeses = anos * 12;
  if (presoAntes) j.prisao!.regime = 'fechado';
  const pelo = p.cooperou ? ' (a colaboração derrubou boa parte da pena)' : p.assumiu ? ' (ter assumido pesou a favor)' : '';
  escrever(v, { texto: `Condenad${flex(g, 'o', 'a', 'e')} a ${anos} ${anos === 1 ? 'ano' : 'anos'} de prisão${pelo}${presoAntes ? `, depois de esperar o julgamento pres${flex(g, 'o', 'a', 'e')}` : ''}. ${regime === 'fechado' ? 'A pena começa fechada; o regime abre com o tempo e o comportamento.' : 'A pena começa no semiaberto: trabalho de dia, a unidade à noite.'}`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'prisao', `Condenação: ${anos} anos de prisão.`, 3);
  // A pergunta do recurso.
  v.fatos['jus_recurso'] = v.t;
}

registrarTribunal({ aoAbrir, sentenciar });

/* ---------------------------------------------------------------- As decisões do processo (as opções chamam aqui) */

/** Contratar um advogado particular (se ainda é a defesa pública). REWORK 12.3 · C3/C5: com nome, e pago por você. */
export function contratarAdvogado(v: Vida): string {
  const p = v.justica?.processo;
  if (!p) return 'Não há processo em andamento.';
  const preco = honorarios(v);
  pagarJustica(v, preco);
  const a = designar(v, 'advogado', v.moradia.municipioId, 'contratado');
  lembrarAtor(v, a.id, `foi contratado por você para um processo por ${NOME_CATEGORIA[p.categoria]}`);
  const volta = a.processos > 1 ? ` Já tinha defendido você antes: conhece a sua história.` : '';
  Object.assign(p, { defesa: 'particular', pagaPor: 'voce', defensorId: a.id, defesaEscolhida: true });
  return `${a.nome} assumiu a defesa por ${dinheiro(preco)}: leu o processo inteiro na primeira semana e mudou a estratégia.${volta}`;
}
/** Dispensar o advogado que veio de outro lugar (a organização, o de antes) e ficar com a defesa pública. */
export function ficarComDefesaPublica(v: Vida): string {
  const p = v.justica?.processo;
  if (!p) return 'Não há processo em andamento.';
  const tinha = p.defesa === 'particular' ? ator(v, p.defensorId) : undefined;
  const d = designar(v, 'defensor', v.moradia.municipioId, 'publica');
  lembrarAtor(v, d.id, `defendeu você num processo por ${NOME_CATEGORIA[p.categoria]}`);
  const orgPagava = p.pagaPor === 'organizacao';
  Object.assign(p, { defesa: 'publica', defensorId: d.id, defesaEscolhida: true });
  delete p.pagaPor;
  if (orgPagava) for (const o of v.caminhos.envolvimento?.organizacoes ?? []) if (o.relacao === 'membro' && o.saiu === undefined) o.lealdade = clamp(o.lealdade - 4);
  return tinha
    ? `Você dispensou ${tinha.nome}${orgPagava ? ' — e, com ele, o favor da organização (quem manda reparou)' : ''}. ${d.nome}, ${quemE(d).split(' ')[1] === 'defensora' ? 'a defensora' : 'o defensor'} designado, tem uma pilha de processos e cinco minutos para o seu.`
    : `${d.nome} ficou com o seu caso: ${perfilDaVida(v).defensoria}, com uma pilha de processos na mesa e pouco tempo para cada um. Fez o que pôde.`;
}
export const vereditoDoAdvogado = (v: Vida): Veredito => {
  const p = v.justica?.processo;
  if (!p) return bloqueio('impossivel', 'Não há processo.');
  if (p.defesa === 'particular') return bloqueio('incompativel', p.pagaPor === 'organizacao' ? 'A organização já pôs um advogado particular no seu caso.' : 'A defesa já é de um advogado particular.');
  return vereditoDePagar(v, honorarios(v), 'Um advogado particular cobra uns');
};

/** Assumir o que se fez: menos chance de absolvição, pena menor; a família ouve de você. */
export function assumir(v: Vida): string {
  const p = v.justica?.processo;
  if (!p) return 'Não há processo.';
  p.assumiu = true;
  for (const x of pais(v)) { const vin = v.vinculos[x.id]; if (vin) { vin.confianca = clamp(vin.confianca + 6); lembrarCom(v, x.id, 'Você contou a verdade sobre o processo.', 'reconciliacao', 2); } }
  const par = parceiro(v);
  if (par) par.vin.confianca = clamp(par.vin.confianca + 4);
  marcarFato(v, 'assumiu_no_processo');
  abalar(v, 'assumir', -2, -6);
  return 'Você assumiu o que fez. A absolvição ficou mais longe; a pena, se vier, menor — e a cabeça, mais leve.';
}

/** Cooperar com a investigação: a pena cai muito; quem foi entregue não esquece. */
export function cooperar(v: Vida): string {
  const p = v.justica?.processo;
  if (!p) return 'Não há processo.';
  p.cooperou = true;
  const env = v.caminhos.envolvimento;
  if (env?.contatoId && v.vinculos[env.contatoId]) { const vin = v.vinculos[env.contatoId]; vin.tensao = 100; vin.confianca = 0; vin.estagio = 'rival'; }
  if (env && env.nivel >= 2) v.fatos['pressao_grupo'] = v.t;
  marcarFato(v, 'cooperou_com_a_justica');
  abalar(v, 'a colaboração', -4, 12);
  return 'Você contou o que sabia. A acusação mudou de tom com você — e, do lado de fora, o recado chegou: há quem não perdoe.';
}
export const vereditoDeCooperar = (v: Vida): Veredito => {
  if (!v.justica?.processo) return bloqueio('impossivel', 'Não há processo.');
  if (!perfilDaVida(v).colaboracao) return bloqueio('ilegal', 'A lei daqui não prevê redução de pena por colaboração.');
  if (!v.caminhos.envolvimento) return bloqueio('impossivel', 'Não há o que contar sobre outras pessoas.');
  return PERMITIDO;
};

/** O acordo: a pena certa, menor, agora. No acordo "limitado", não vira condenação na ficha. */
export function aceitarAcordo(v: Vida, r: Rng): string {
  const j = v.justica!;
  const p = j.processo!;
  const perfil = perfilDaVida(v);
  j.processo = undefined;
  const g = ge(v);
  const leve = LEVE.has(p.categoria) || p.categoria === 'fraude';
  // Todo acordo começa por reparar o dano (devolver parte do que entrou por fora).
  if ((p.categoria as string) !== 'violencia') confiscar(v, 0.6, 'O acordo pediu a reparação do dano');
  if (perfil.acordo === 'limitado' && leve && !reincidente(v)) {
    const multa = multaPenal(v, r.int(20, 60));
    pagarPorFora(v, 'perdas', Math.min(multa, Math.max(0, disponivel(v))));
    j.antecedentes.push({ t: v.t, categoria: p.categoria, desfecho: 'acordo', multa });
    if (j.prisao) soltar(v, 'acordo');
    escrever(v, { texto: `Fechou um acordo com a acusação: reparar o que dava, pagar e cumprir condições por um tempo. O processo se encerra sem condenação.`, relevancia: 'marco', tema: 'trabalho', tom: 'neutro' });
    return 'O acordo foi homologado. Sem julgamento, sem condenação — com a obrigação cumprida e a lição dada.';
  }
  // O acordo amplo (ou o grave): a condenação vem, menor.
  const anos = Math.max(1, Math.round((PENA_BASE[p.categoria] + 1) * (reincidente(v) ? 1.5 : 1) * perfil.severidade * 0.55));
  if (leve && anos <= 2 && !j.prisao) {
    j.alternativa = { tFim: v.t + 12 };
    j.antecedentes.push({ t: v.t, categoria: p.categoria, desfecho: 'alternativa' });
    escrever(v, { texto: `Aceitou o acordo: culpad${flex(g, 'o', 'a', 'e')}, pena alternativa de um ano. A ficha registra a condenação.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    return 'Você se declarou culpad' + flex(g, 'o', 'a', 'e') + '. Um ano de serviço à comunidade, sem prisão — e a condenação na ficha.';
  }
  j.antecedentes.push({ t: v.t, categoria: p.categoria, desfecho: 'prisao', anos });
  prender(v, (j.prisao?.tInicio ?? v.t) + Math.round(anos * 12 * 0.3), 'semiaberto', 'pena');
  j.prisao!.penaMeses = anos * 12;
  escrever(v, { texto: `Aceitou o acordo: ${anos} ${anos === 1 ? 'ano' : 'anos'} de prisão, menos do que um julgamento daria.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  return `Você trocou o risco do julgamento por uma pena certa: ${anos} ${anos === 1 ? 'ano' : 'anos'}.`;
}

/** Pagar a fiança: esperar o julgamento em liberdade. */
export function pagarFianca(v: Vida): string {
  const j = v.justica!;
  const p = j.processo!;
  pagarJustica(v, p.fianca!);
  p.fianca = undefined;
  if (j.prisao) { j.prisao = undefined; j.tSaida = v.t; }
  escrever(v, { texto: 'Pagou a fiança e foi esperar o julgamento em liberdade.', relevancia: 'biografia', tema: 'trabalho' });
  return 'A fiança foi paga. A porta abriu — e o processo continua.';
}

/** Recorrer da condenação (a resposta leva um ano). */
export function recorrer(v: Vida): string {
  const j = garantirJustica(v);
  j.recurso = { t: v.t, tFim: v.t + 12 };
  return 'O recurso foi protocolado. A resposta deve sair em um ano.';
}

/* ---------------------------------------------------------------- A reabilitação */

/** O fim da última pena (a saída, o fim da alternativa ou a data da condenação a multa). */
function fimDaUltimaPena(v: Vida): number | undefined {
  const j = v.justica;
  if (!j) return undefined;
  const conden = j.antecedentes.filter(a => (a.desfecho === 'prisao' || a.desfecho === 'alternativa') && a.reabilitado === undefined);
  if (!conden.length) return undefined;
  return Math.max(...conden.map(a => a.t), j.tSaida ?? 0);
}

export function vereditoDaReabilitacao(v: Vida): Veredito {
  const j = v.justica;
  if (!j || j.prisao || j.processo || j.alternativa) return bloqueio('impossivel', 'Primeiro, a pena tem de ter terminado.');
  const fim = fimDaUltimaPena(v);
  if (fim === undefined) return bloqueio('impossivel', 'Não há condenação a reabilitar.');
  const anos = perfilDaVida(v).reabilitacaoAnos;
  if (v.t - fim < anos * 12) return bloqueio('requisito', `A reabilitação pede ${anos} anos sem nada novo depois do fim da pena (faltam uns ${Math.ceil((anos * 12 - (v.t - fim)) / 12)}).`);
  if (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined) return bloqueio('incompativel', 'Quem continua envolvido não se reabilita.');
  if (v.fatos['reabilitacao_negada'] !== undefined && v.t - v.fatos['reabilitacao_negada'] < 24) return bloqueio('incompativel', 'O pedido foi negado há pouco: dá para pedir de novo depois de dois anos.');
  return PERMITIDO;
}

/** Pedir a reabilitação: o juiz olha o tempo, o trabalho, o estudo, o que se fez desde a saída. */
export function pedirReabilitacao(v: Vida, r: Rng): string {
  const j = v.justica!;
  const reconstruiu = v.trabalho.atual !== undefined || v.educacao.concluidos.some(c => c.tFim > (j.tSaida ?? 0));
  if (!r.chance(reconstruiu ? 0.85 : 0.5)) {
    v.fatos['reabilitacao_negada'] = v.t;
    return 'O pedido foi negado: o juiz quis ver mais tempo de vida nova. Dá para pedir de novo em dois anos.';
  }
  for (const a of j.antecedentes) if ((a.desfecho === 'prisao' || a.desfecho === 'alternativa') && a.reabilitado === undefined) a.reabilitado = v.t;
  escrever(v, { texto: 'A reabilitação criminal saiu: o registro deixou de circular. Não se apaga o que foi; deixa-se de carregar.', relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  marcar(v, 'recomeco', 'Reabilitação criminal.', 3);
  abalar(v, 'a reabilitação', 10, -8);
  return 'A reabilitação foi concedida. Numa entrevista de emprego, o passado deixa de ser a primeira coisa que aparece.';
}

/** O processo em palavras (para a tela): a fase, as provas, a defesa, o acordo, a fiança. */
export function leituraDoProcesso(v: Vida): { linhas: string[] } | undefined {
  const p = v.justica?.processo;
  if (!p) return undefined;
  const perfil = perfilDaVida(v);
  const provas = (p.provas ?? 50) >= 70 ? 'fortes' : (p.provas ?? 50) >= 40 ? 'consideráveis' : 'fracas';
  return { linhas: [
    `O julgamento deve sair em ${anoDe(p.tJulgamento)}. As provas contra você são ${provas}.`,
    p.defesa === 'particular' ? 'A defesa é de um advogado particular.' : `A defesa é de ${perfil.defensoria}.`,
    ...(p.assumiu ? ['Você assumiu o que fez.'] : []), ...(p.cooperou ? ['Você colaborou com a investigação.'] : []),
    ...(p.acordo && !p.acordo.aceito && !p.acordo.recusado ? ['A acusação ofereceu um acordo.'] : []),
    ...(p.fianca ? [`A fiança foi arbitrada: dá para esperar o julgamento solt${flex(ge(v), 'o', 'a', 'e')}, pagando.`] : []),
    ...(idade(v) < 18 ? ['Como menor de idade, a resposta é uma medida socioeducativa, não uma pena.'] : [])
  ] };
}
