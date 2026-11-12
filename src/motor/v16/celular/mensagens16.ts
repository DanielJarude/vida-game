/**
 * VIDA 16 · MENSAGENS — a central de comunicação: quem conversou com você e o que foi dito.
 *
 * O que a VIDA 15 tinha: as mensagens do ano (que saíam do aparelho depois) e os chamados das pessoas (que sumiam ao
 * serem respondidos). Agora:
 *
 *   o HISTÓRICO     o que sai do ano vai para o arquivo (`Celular15.arquivo16`, até 400), com a resposta que foi dada —
 *                   ou "ficou sem resposta"; o chamado respondido (ou esquecido) também fica, com o que aconteceu;
 *   ESCREVER        você também puxa a conversa: saber como a pessoa está, dizer que sente falta, chamar para um café,
 *                   pedir desculpas, oferecer apoio. A resposta é da pessoa (a proximidade, a tensão, o jeito dela), e
 *                   pode continuar (o "bora!" vira um convite com dia, que você confirma);
 *   a HORA          cada mensagem tem dia e hora (a hora sai do id: recarregar mostra a mesma).
 *
 * "Pede atenção" (em Pessoas) NÃO repete as mensagens: diz a SITUAÇÃO da relação (`sinaisSociais`).
 */
import type { Rng } from '../../rng';
import { clamp } from '../../rng';
import type { Chamado, Pessoa, Vida, Vinculo } from '../../tipos';
import { idade, idadePessoa, lembrarCom, vinculosVivos } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { papelDe } from '../../sistemas/vinculos';
import { flex } from '../../texto';
import { anoDe } from '../../tempo';
import type { Msg15 } from '../../dados15/celular/tipos';
import { receber17 } from '../../sistemas/cotaDeMensagens';

const LIMITE_ARQUIVO = 400;
const humano = (p: Pessoa) => !p.especie && p.vivo && !!p.nome;
const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');

/** A hora em que a mensagem chegou ("14:32"): sai do id, então é sempre a mesma. */
export function horaDaMsg16(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  const u = (h >>> 0);
  const hora = 7 + (u % 16);
  const min = (u >>> 8) % 60;
  return `${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function arquivo(v: Vida): Msg15[] {
  const c = (v.celular15 ??= { ano: anoDe(v.t), msgs: [] });
  return (c.arquivo16 ??= []);
}

function guardar(v: Vida, m: Msg15): void {
  const a = arquivo(v);
  if (a.some(x => x.id === m.id)) return;
  a.push(m);
  if (a.length > LIMITE_ARQUIVO) a.splice(0, a.length - LIMITE_ARQUIVO);
}

/** As mensagens que saem do ano vão para o histórico (chamado na virada, antes da limpeza). */
export function arquivarMsgs16(v: Vida, saindo: Msg15[]): void {
  for (const m of saindo) guardar(v, { ...m, lida: true });
}

/** O chamado de alguém, respondido ou não, fica na conversa com essa pessoa. */
export function arquivarChamado16(v: Vida, pid: string, ch: Chamado, resposta?: { sim: boolean; texto: string }): void {
  if (!v.celular15 && idade(v) < 10) return;
  guardar(v, {
    id: `ch16_${pid}_${ch.t}_${ch.tipo}`, t: ch.t, tipo: 'chamado', de: pid, texto: ch.texto, assunto: ch.tipo, lida: true,
    ...(resposta ? { resposta: { op: resposta.sim ? 'sim' : 'nao', t: v.t, texto: resposta.texto } } : {})
  });
}

/** Tudo o que já foi conversado (o do ano e o arquivo), sem repetição. */
export function historico16(v: Vida): { m: Msg15; arquivada: boolean }[] {
  const vivas = (v.celular15?.msgs ?? []).map(m => ({ m, arquivada: false }));
  const ids = new Set(vivas.map(x => x.m.id));
  return [...(v.celular15?.arquivo16 ?? []).filter(m => !ids.has(m.id)).map(m => ({ m, arquivada: true })), ...vivas];
}

/* ------------------------------------------------------------------ Escrever */

export type IntencaoMsg16 = 'saber' | 'saudade' | 'cafe' | 'desculpas' | 'apoio' | 'novidade';

export const ROTULO_INTENCAO16: Record<IntencaoMsg16, string> = {
  saber: 'Perguntar como está', saudade: 'Dizer que sente falta', cafe: 'Chamar para um café',
  desculpas: 'Pedir desculpas', apoio: 'Oferecer apoio', novidade: 'Contar uma novidade sua'
};

const FRASE: Record<IntencaoMsg16, string[]> = {
  saber: ['Oi! Como você tá? Faz tempo.', 'E aí, tudo bem por aí?', 'Passando pra saber de você. Como andam as coisas?'],
  saudade: ['Tô com saudade de você, sabia?', 'Lembrei de você hoje. Saudade.', 'Que falta você faz por aqui.'],
  cafe: ['Bora tomar um café essa semana?', 'Topa um café pra pôr a conversa em dia?', 'Tô com tempo no sábado. Um café?'],
  desculpas: ['Queria pedir desculpas por aquilo. Fui injust{o}.', 'Fiquei pensando no que aconteceu. Me desculpa.', 'Sei que errei. Desculpa, de verdade.'],
  apoio: ['Soube do que aconteceu. Tô aqui pro que precisar.', 'Se quiser conversar, é só chamar. Qualquer hora.', 'Pensei em você. Conta comigo.'],
  novidade: ['Tenho uma novidade e queria que você soubesse por mim.', 'Adivinha? Te conto tudo.', 'Você foi a primeira pessoa em quem pensei pra contar.']
};

const chaveDoAno = (v: Vida, pid: string) => `cel16e_${pid}_${anoDe(v.t)}`;

/** Para quem dá para escrever, com as intenções que fazem sentido para cada pessoa. */
export function contatos16(v: Vida): { p: Pessoa; vin: Vinculo; intencoes: IntencaoMsg16[]; escreveu: boolean }[] {
  if (idade(v) < 10) return [];
  return vinculosVivos(v)
    .filter(({ p, vin }) => humano(p) && idadePessoa(v, p) >= 8 && !vin.convivio.includes('casa') && vin.digital?.bloqueado === undefined && !(vin.ruptura && vin.estagio !== 'ex_amigo'))
    .map(({ p, vin }) => ({ p, vin, intencoes: intencoesPara(v, p, vin), escreveu: v.fatos[chaveDoAno(v, p.id)] !== undefined }))
    .filter(x => x.intencoes.length)
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade);
}

function intencoesPara(v: Vida, p: Pessoa, vin: Vinculo): IntencaoMsg16[] {
  const out: IntencaoMsg16[] = ['saber'];
  const papel = papelDe(p, vin);
  if (vin.proximidade >= 30 && papel !== 'conhecido') out.push('saudade');
  if (idade(v) >= 14 && idadePessoa(v, p) >= 14 && p.municipioId === v.moradia.municipioId) out.push('cafe');
  if (vin.tensao >= 35 || (vin.conflito && v.t - vin.conflito.t <= 36) || vin.estagio === 'ex_amigo') out.push('desculpas');
  if (p.aperto && !p.aperto.resolvido && v.t - p.aperto.t <= 18) out.push('apoio');
  if (vin.proximidade >= 45 && v.biografia.some(b => b.relevancia === 'biografia' && v.t - b.t <= 6)) out.push('novidade');
  return out;
}

export function disponibilidadeEscrever16(v: Vida, pid: string, intencao: IntencaoMsg16): Veredito {
  if (idade(v) < 10) return bloqueio('impossivel', 'Ainda sem celular.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não daqui.');
  const c = contatos16(v).find(x => x.p.id === pid);
  if (!c) return bloqueio('impossivel', 'Essa pessoa não está nos seus contatos.');
  if (c.escreveu) return bloqueio('incompativel', `Você já escreveu para ${c.p.nome} este ano — a conversa segue no ritmo de vocês.`);
  if (!c.intencoes.includes(intencao)) return bloqueio('incompativel', 'Não é o momento para essa mensagem.');
  return PERMITIDO;
}

/** Escrever: a mensagem vai, a resposta vem (ou não), a relação sente. Uma por pessoa por ano. */
export function escrever16(v: Vida, r: Rng, pid: string, intencao: IntencaoMsg16): { texto: string; pessoaId: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const p = v.pessoas[pid];
  const vin = v.vinculos[pid];
  v.fatos[chaveDoAno(v, pid)] = v.t;
  const c = (v.celular15 ??= { ano: anoDe(v.t), msgs: [] });
  const id = `e16_${pid}_${v.t}`;
  const minha = r.pick(FRASE[intencao]).replace('{o}', flex(v.eu.tratamento ?? v.eu.genero, 'o', 'a', 'e'));
  const semContato = (v.t - vin.tUltimoContato) / 12;
  // Quem responde, e como: a proximidade, a tensão, o jeito; o tempo sem se falar esfria o começo.
  const calor = vin.proximidade / 100 + p.temperamento.afabilidade * 0.2 + p.temperamento.extroversao * 0.1 - vin.tensao / 150 - Math.min(0.2, semContato * 0.03);
  const responde = r.chance(clamp(0.55 + calor * 0.5, 0.15, 0.97));
  let resposta = '';
  let tom: 'bom' | 'ruim' | 'neutro' = 'neutro';
  let segue: Msg15 | undefined;
  vin.tUltimoContato = v.t;
  (vin.digital ??= {}).mensagem = v.t;
  if (!responde) {
    resposta = r.pick(['Visualizou. Não respondeu.', `${p.nome} não respondeu.`, 'A mensagem ficou lá, com os dois risquinhos.']);
    if (intencao === 'desculpas') vin.tensao = clamp(vin.tensao - 4);
  } else {
    switch (intencao) {
      case 'saber':
        resposta = calor > 0.5 ? r.pick(['"Que bom que você escreveu! Tô bem, correria de sempre. E você, me conta tudo."', '"Oiii! Tava pensando em você esses dias. Tudo certo por aqui!"']) : r.pick(['"Tudo bem, e você?"', '"Tô bem. Corrido. E aí?"']);
        vin.proximidade = clamp(vin.proximidade + (calor > 0.5 ? 3 : 1));
        tom = 'bom';
        break;
      case 'saudade':
        resposta = calor > 0.45 ? r.pick(['"Eu também! Muita. A gente precisa se ver."', '"Ai, que coisa boa de ler. Saudade também."']) : r.pick(['"Haha, saudade também. Vida corrida, né?"', '"Que fofo. Também."']);
        vin.proximidade = clamp(vin.proximidade + (calor > 0.45 ? 4 : 2));
        tom = 'bom';
        break;
      case 'cafe':
        if (calor > 0.3 || r.chance(0.4)) {
          resposta = r.pick(['"Bora! Sábado de manhã?"', '"Topo! Me fala o dia."', '"Simmm. Tô precisando."']);
          // A conversa continua: o café vira convite com dia (o mesmo programa de sempre).
          segue = { id: `e16c_${pid}_${v.t}`, t: v.t, tipo: 'convite', de: pid, texto: '"Então tá marcado: café no sábado, às dez. Confirma?"', assunto: 'cafe', onde: 'restaurante', custo: 30, onda: 9 };
          tom = 'bom';
        } else {
          resposta = r.pick(['"Essa semana tá impossível… mais pra frente?"', '"Ah, agora não consigo. Mas fica o convite."']);
        }
        break;
      case 'desculpas':
        if (calor > 0.2 || r.chance(0.35)) {
          resposta = r.pick(['"Obrigad{o} por escrever. Também não fui fácil. Vamos deixar pra trás?"', '"Eu precisava ouvir isso. Tá desculpad{o}."']).replace(/\{o\}/g, o(p));
          vin.tensao = clamp(vin.tensao - 18);
          vin.confianca = clamp(vin.confianca + 4);
          if (vin.conflito && vin.conflito.gravidade <= 2) vin.conflito = undefined;
          lembrarCom(v, pid, 'Você pediu desculpas por mensagem.', 'reconciliacao', 1);
          tom = 'bom';
        } else {
          resposta = r.pick(['"Ainda não tô pronto pra falar disso."', '"Ok."']).replace('pronto', flex(p.genero, 'pronto', 'pronta', 'pronte'));
          vin.tensao = clamp(vin.tensao - 5);
        }
        break;
      case 'apoio':
        resposta = r.pick(['"Obrigad{o}. De verdade. Não tá fácil."', '"Você não sabe o quanto isso ajuda."']).replace('{o}', o(p));
        vin.proximidade = clamp(vin.proximidade + 5);
        vin.confianca = clamp(vin.confianca + 5);
        lembrarCom(v, pid, 'Você mandou apoio numa hora difícil.', 'apoio', 1);
        tom = 'bom';
        break;
      case 'novidade':
        resposta = r.pick(['"NÃO ACREDITO! Que notícia! Parabéns!"', '"Que demais! Fico muito feliz por você."']);
        vin.proximidade = clamp(vin.proximidade + 3);
        tom = 'bom';
        break;
    }
  }
  const m: Msg15 = { id, t: v.t, tipo: 'escrita', de: pid, texto: minha, assunto: intencao, lida: true, resposta: { op: responde ? 'respondeu' : 'silencio', t: v.t, texto: resposta } };
  c.msgs.push(m);
  // VIDA 17: a continuação é uma mensagem recebida — consome a cota do ano (prioridade alta: foi você quem puxou).
  if (segue) { const mes = receber17(v, 'alta'); if (mes !== undefined) c.msgs.push({ ...segue, mes17: mes }); }
  return { texto: responde ? `${p.nome} respondeu.` : `${p.nome} não respondeu.`, pessoaId: pid, tom };
}
