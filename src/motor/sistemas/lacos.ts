/**
 * RELAÇÕES 2.0 — quem a pessoa é na sua vida, como a relação está, e por quê.
 *
 *   "PRÓXIMO" NÃO RESPONDE À PERGUNTA "QUEM É ESSA PESSOA NA MINHA VIDA?"
 *
 * Três coisas diferentes, que o motor guarda separadas e a tela sintetiza:
 *
 *   TIPO      quem é: família (o parentesco), romance (interesse, saindo,
 *             namoro, casamento, ex) ou social (conhecido, colega, amigo,
 *             amigo próximo, melhor amigo, amigo de antes, ex-amigo, rival).
 *             A irmã é irmã com proximidade 20; o ex é ex com afeto 80.
 *   ESTADO    como está agora: se aproximando, estável, esfriando, em
 *             tensão, em conflito, afastados, rompidos, em reconciliação.
 *   QUALIDADE proximidade, confiança, tensão, a história (os marcos).
 *
 * Duas pessoas com a mesma proximidade podem ser relações completamente
 * diferentes — e a tela diz isso: "amiga · brigadas", "irmã · afastados",
 * "ex · com carinho".
 *
 * Conflito não é "−vínculo": uma discussão pode resolver um problema,
 * aumentar o respeito, deixar desconforto, virar briga ou romper. O
 * resultado consulta o temperamento da outra pessoa, a confiança, a
 * história, a gravidade e o que já aconteceu antes (`discutir`, `desculpar`).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { lembrarCom, vinculosVivos } from '../nucleo';
import { registrarFase } from './relacoes';

export type EstadoDaRelacao = 'aproximando' | 'estavel' | 'esfriando' | 'tensao' | 'conflito' | 'afastado' | 'rompido' | 'reconciliacao';

/** A relação é de amizade (de verdade, hoje)? */
export const ehAmizade = (vin: Vinculo) => !vin.parentesco && (vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo');

/**
 * O melhor amigo: no máximo um — o amigo próximo com mais história, confiança
 * e proximidade, e que não está em conflito. Ninguém é "melhor amigo" por
 * proximidade alta sozinha.
 */
export function melhorAmigoId(v: Vida): string | undefined {
  let melhor: { id: string; nota: number } | undefined;
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || vin.parentesco || vin.estagio !== 'amigo_proximo' || vin.ruptura || (vin.conflito && v.t - vin.conflito.t < 24)) continue;
    const nota = vin.proximidade + vin.confianca * 0.8 + Math.min(10, vin.historia.length) * 3 + (v.t - vin.tInicio) / 24;
    if (!melhor || nota > melhor.nota) melhor = { id: p.id, nota };
  }
  return melhor && melhor.nota >= 160 ? melhor.id : undefined;
}

/**
 * O estado da relação agora — derivado do que existe (nunca uma máquina de
 * estados rígida): a ruptura que não foi desfeita, o conflito aberto, a
 * tensão, a reconciliação recente, a distância, a tendência do ano.
 */
export function estadoDaRelacao(v: Vida, vin: Vinculo): EstadoDaRelacao {
  if (vin.ruptura && (vin.reconciliacao === undefined || vin.reconciliacao < vin.ruptura.t)) return 'rompido';
  if (vin.conflito && v.t - vin.conflito.t < 24) return 'conflito';
  if (vin.tensao >= 55) return 'conflito';
  if (vin.reconciliacao !== undefined && v.t - vin.reconciliacao <= 24) return 'reconciliacao';
  if (vin.tensao >= 30) return 'tensao';
  if (vin.estagio === 'afastado' || vin.estagio === 'ex_amigo') return 'afastado';
  if (vin.distancia !== undefined && v.t - vin.distancia < 60) return 'afastado';
  if (!vin.parentesco && !vin.convivio.length && v.t - vin.tUltimoContato >= 36) return 'afastado';
  if (vin.proxAno !== undefined) {
    const d = vin.proximidade - vin.proxAno;
    if (d >= 6) return 'aproximando';
    if (d <= -6) return 'esfriando';
  }
  return 'estavel';
}

/**
 * A FORÇA da relação, 0..100, para a leitura rápida (a barra da tela — REWORK 4). Não substitui o tipo, o estado nem a
 * história: resume o afeto (proximidade), a confiança e o atrito num número só. Uma ruptura derruba; uma briga aberta pesa.
 */
export function forcaDaRelacao(v: Vida, vin: Vinculo): number {
  const e = estadoDaRelacao(v, vin);
  const base = vin.proximidade * 0.62 + vin.confianca * 0.28 + (100 - vin.tensao) * 0.1;
  const corte = e === 'rompido' ? 35 : e === 'conflito' ? 12 : e === 'tensao' ? 5 : 0;
  return Math.max(0, Math.min(100, Math.round(base - corte)));
}

/** Por que a relação está como está (o marco que explica), em palavras — ou nada, se não há um porquê registrado. */
export function porqueDaRelacao(v: Vida, vin: Vinculo): string | undefined {
  const e = estadoDaRelacao(v, vin);
  if (e === 'rompido' && vin.ruptura) return vin.ruptura.porque;
  if (e === 'conflito' && vin.conflito) return `Discutiram por causa de ${vin.conflito.assunto}.`;
  const h = [...vin.historia].reverse();
  if (e === 'reconciliacao') return h.find(x => x.tipo === 'reconciliacao')?.texto;
  if (e === 'afastado' || e === 'esfriando') return h.find(x => x.tipo === 'distancia' || x.tipo === 'conflito')?.texto;
  if (ehAmizade(vin)) return h.find(x => x.tipo === 'amizade' || x.tipo === 'apoio' || x.tipo === 'descoberta')?.texto;
  return undefined;
}

/* ------------------------------------------------------------- Conflito */

/** Os assuntos de uma discussão, pelo tipo da relação (o que de fato vira briga entre amigos, na família, no casal). */
export function assuntoDaDiscussao(v: Vida, vin: Vinculo, r: Rng): string {
  if (vin.conflito) return vin.conflito.assunto;
  const ch = vin.chamado;
  if (ch?.tipo === 'reclamacao' || ch?.tipo === 'cobranca') return ch.assunto ?? 'a distância dos últimos tempos';
  if (vin.romance && vin.romance.estagio !== 'ex') return r.pick(['a divisão das tarefas', 'dinheiro', 'ciúme', 'a família de um dos dois', 'o tempo que sobra para vocês']);
  if (vin.parentesco) return r.pick(['dinheiro', 'as escolhas da sua vida', 'como cuidar de quem envelhece', 'uma coisa dita num almoço de família', 'política']);
  if (vin.convivio.includes('trabalho')) return r.pick(['o crédito por um trabalho', 'a divisão das tarefas', 'um comentário na frente dos outros']);
  if (v.t - vin.tUltimoContato >= 24) return 'o sumiço dos últimos tempos';
  return r.pick(['um dinheiro emprestado que não voltou', 'um comentário que machucou', 'uma ausência num momento difícil', 'um segredo que vazou', 'um plano desmarcado de novo', 'política']);
}

export type DesfechoDaDiscussao = 'resolveu' | 'desconforto' | 'briga' | 'ruptura';

/**
 * Uma discussão (você discorda, cobra, confronta). Quem resolve é a relação:
 * o temperamento da pessoa (afabilidade e estabilidade), a confiança, a
 * proximidade, a tensão acumulada, a gravidade do assunto, as brigas de antes
 * — e o seu jeito (empatia). Confrontar por um motivo legítimo pode
 * incomodar na hora sem destruir nada; às vezes resolve.
 */
export function discutir(v: Vida, r: Rng, p: Pessoa, vin: Vinculo, gravidade: 1 | 2 | 3, assunto: string): DesfechoDaDiscussao {
  const t = p.temperamento;
  const brigasAntes = vin.historia.filter(h => h.tipo === 'conflito').length;
  const legitimo = vin.tensao >= 25 || !!vin.conflito || vin.chamado?.tipo === 'cobranca';
  const bom = clamp(0.42 + t.afabilidade * 0.22 + t.estabilidade * 0.14 + (vin.confianca - 50) / 160 + (vin.proximidade - 50) / 220
    - vin.tensao / 260 - (gravidade - 1) * 0.1 - brigasAntes * 0.04 + (legitimo ? 0.06 : 0) + v.personalidade.tracos.empatia / 500, 0.05, 0.9);
  const x = r.next();
  const ruim = clamp(0.12 + (gravidade - 1) * 0.1 - t.estabilidade * 0.08 + brigasAntes * 0.04 + vin.tensao / 300, 0.03, 0.6);
  let d: DesfechoDaDiscussao = x < bom ? 'resolveu' : x < bom + (1 - bom) * 0.5 ? 'desconforto' : 'briga';
  // Rompe quem já não tinha muito a perder (pouca proximidade, muita tensão) — ou uma briga grave entre amigos.
  if (d === 'briga' && !vin.parentesco && !vin.romance && (vin.proximidade < 35 || gravidade === 3) && vin.tensao + 25 >= 60 && r.chance(ruim)) d = 'ruptura';
  if (d === 'resolveu') {
    vin.tensao = clamp(vin.tensao - 22 - gravidade * 4);
    vin.confianca = clamp(vin.confianca + 4 + gravidade);
    vin.proximidade = clamp(vin.proximidade + 2);
    if (vin.conflito) { vin.conflito = undefined; vin.reconciliacao = v.t; }
    lembrarCom(v, p.id, `Falaram francamente sobre ${assunto} — e ficou resolvido.`, 'reconciliacao', gravidade >= 2 ? 2 : 1);
  } else if (d === 'desconforto') {
    vin.tensao = clamp(vin.tensao + 6);
    vin.confianca = clamp(vin.confianca + 2);
  } else {
    vin.tensao = clamp(vin.tensao + 22 + gravidade * 5);
    vin.proximidade = clamp(vin.proximidade - 4 - gravidade * 2);
    vin.conflito = { t: v.t, assunto, gravidade, quem: 'eu' };
    lembrarCom(v, p.id, `Brigaram por causa de ${assunto}.`, 'conflito', gravidade >= 2 ? 2 : 1);
    if (d === 'ruptura') romper(v, p, vin, `A amizade acabou numa briga por causa de ${assunto}.`, 'ambos');
  }
  return d;
}

/**
 * A ruptura: a amizade vira ex-amizade (e o rival, rival declarado); na
 * família, o vínculo continua sendo de família — o que rompe é o estado.
 * O passado não se apaga: a história fica.
 */
export function romper(v: Vida, p: Pessoa, vin: Vinculo, porque: string, quem: 'eu' | 'outro' | 'ambos'): void {
  vin.ruptura = { t: v.t, porque, quem };
  vin.aproximacao = undefined;
  vin.tensao = clamp(Math.max(vin.tensao, 45));
  if (!vin.parentesco && !vin.romance && vin.estagio !== 'rival') { vin.estagio = 'ex_amigo'; registrarFase(v, vin, 'ex_amigo'); }
  lembrarCom(v, p.id, porque, 'conflito', 3);
}

export type DesfechoDasDesculpas = 'aceitas' | 'em_parte' | 'recusadas';

/**
 * Pedir desculpas pode ser aceito, aceito em parte ou recusado — pelo
 * temperamento da outra pessoa, pela gravidade, pela confiança e por
 * quantas vezes já foi preciso pedir.
 */
export function desculpar(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): DesfechoDasDesculpas {
  const t = p.temperamento;
  const g = vin.conflito?.gravidade ?? (vin.tensao >= 60 ? 2 : 1);
  const vezes = vin.historia.filter(h => h.tipo === 'reconciliacao' && /desculpas/.test(h.texto)).length;
  const chance = clamp(0.5 + t.afabilidade * 0.25 + (vin.confianca - 45) / 150 + (vin.proximidade - 45) / 200 - (g - 1) * 0.12 - vezes * 0.08 - (vin.ruptura ? 0.15 : 0), 0.08, 0.92);
  const x = r.next();
  if (x < chance) {
    vin.tensao = clamp(vin.tensao - 28);
    vin.confianca = clamp(vin.confianca + 5);
    vin.proximidade = clamp(vin.proximidade + 3);
    vin.conflito = undefined;
    vin.reconciliacao = v.t;
    lembrarCom(v, p.id, 'Você pediu desculpas, e as coisas voltaram a andar.', 'reconciliacao', 1);
    return 'aceitas';
  }
  if (x < chance + (1 - chance) * 0.55) {
    vin.tensao = clamp(vin.tensao - 12);
    vin.confianca = clamp(vin.confianca + 1);
    return 'em_parte';
  }
  vin.tensao = clamp(vin.tensao + 4);
  v.fatos[`desculpas_nao_${p.id}`] = v.t;
  return 'recusadas';
}

/**
 * Fazer as pazes depois de uma ruptura (a ex-amizade, o irmão com quem não se
 * fala). Aceito, a relação volta — com a história inteira, rupturas incluídas.
 */
export function reconciliar(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): boolean {
  const t = p.temperamento;
  const anos = vin.ruptura ? (v.t - vin.ruptura.t) / 12 : 3;
  const amizadeFunda = vin.historia.filter(h => h.tipo === 'amizade' || h.tipo === 'apoio' || h.tipo === 'ritual' || h.tipo === 'descoberta').length;
  const chance = clamp(0.25 + t.afabilidade * 0.2 + Math.min(0.25, anos * 0.05) + amizadeFunda * 0.04 + (vin.ruptura?.quem === 'outro' ? 0.1 : vin.ruptura?.quem === 'eu' ? -0.08 : 0), 0.05, 0.85);
  if (!r.chance(chance)) { v.fatos[`reconciliar_nao_${p.id}`] = v.t; return false; }
  vin.reconciliacao = v.t;
  vin.conflito = undefined;
  vin.tensao = clamp(vin.tensao - 30);
  vin.proximidade = clamp(Math.max(vin.proximidade, 38) + 6);
  vin.aproximacao = v.t;
  vin.distancia = undefined;
  if (vin.estagio === 'ex_amigo' || vin.estagio === 'afastado') { vin.estagio = 'amigo'; registrarFase(v, vin, 'reconciliacao'); }
  lembrarCom(v, p.id, anos >= 3 ? `Fizeram as pazes depois de ${Math.round(anos)} anos sem se falar.` : 'Fizeram as pazes.', 'reconciliacao', 3);
  return true;
}
