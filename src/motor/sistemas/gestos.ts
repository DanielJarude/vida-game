/**
 * Mais formas concretas de viver uma relação (REWORK 4).
 *
 * O playtest comparou: no VIDA, as ações com as pessoas eram poucas e
 * abstratas ("Fazer alguma coisa com X", "Ter uma conversa de verdade").
 * Aqui entram gestos com cara de gesto — perguntar da vida de alguém (e
 * descobrir o FATO), dizer o que admira, pedir conselho, pedir ajuda com as
 * crianças —, cada um só para quem faz sentido: o menu da mãe, do colega, do
 * melhor amigo, do interesse romântico, do ex e do rival não são o mesmo.
 *
 * Nada aqui é fazenda de afeto: as regras de sempre valem (uma vez por ano com
 * a mesma pessoa; o ganho encolhe com a repetição no ano — `interacoes`), e
 * cada gesto tem memória própria (elogiar demais soa vazio; perguntar a quem
 * é fechado nem sempre abre a conversa).
 */

import type { CtxI, Interacao } from './interacoes';
import { clamp } from '../rng';
import { lembrarCom } from '../nucleo';
import { flex } from '../texto';
import { estadoDaRelacao } from './lacos';
import { cenaDaDescoberta, fraseDoSaber, pendentes, revelar, type ChaveSaber } from './conhecimento';
import { filhos as filhosDe, idadePessoa } from '../nucleo';

const humano = (c: CtxI) => !c.p.especie;
const ele = (c: CtxI) => flex(c.p.genero, 'ele', 'ela', 'elu');
const dele = (c: CtxI) => flex(c.p.genero, 'dele', 'dela', 'delu');
const afeto = (c: CtxI, n: number) => { c.vin.proximidade = clamp(Math.round(c.vin.proximidade + n)); };
const confiar = (c: CtxI, n: number) => { c.vin.confianca = clamp(Math.round(c.vin.confianca + n)); };
const distante = (c: CtxI) => c.vin.distancia !== undefined && c.v.t - c.vin.distancia < 60;
const alcance = (c: CtxI) => c.casa || !c.longe || c.v.t - c.vin.tUltimoContato < 12 || (c.vin.digital?.mensagem !== undefined && c.v.t - c.vin.digital.mensagem < 12);
const bloqueado = (c: CtxI) => c.vin.digital?.bloqueado !== undefined;
const emRomance = (c: CtxI) => c.papel === 'parceiro' || c.papel === 'saindo' || c.papel === 'caso' || c.papel === 'interesse';
const ex = (c: CtxI) => c.papel === 'ex';
const conta = (c: CtxI, k: string) => { const h = (c.vin.habitos ??= {}); h[k] = (h[k] ?? 0) + 1; return h[k]; };

/** A pergunta tem a cara do que falta saber. */
function rotuloPergunta(c: CtxI, k: ChaveSaber): string {
  const n = c.p.nome;
  if (k === 'origem') return `Perguntar a ${n} de onde ${ele(c)} é`;
  if (k === 'trabalho') return c.vin.convivio.includes('trabalho') ? `Perguntar a ${n} como foi parar nesse trabalho` : `Perguntar a ${n} o que ${ele(c)} faz da vida`;
  if (k === 'formacao') return `Perguntar a ${n} o que ${ele(c)} estudou`;
  if (k === 'familia') return `Perguntar a ${n} da família ${dele(c)}`;
  return `Perguntar a ${n} da vida ${dele(c)}`;
}

/** O assunto do conselho: o que está pesando na sua vida agora. */
function assuntoDoConselho(c: CtxI): string {
  const v = c.v;
  if (v.educacao.matricula && !v.educacao.matricula.trancado && v.educacao.matricula.desempenho < 50) return 'a faculdade, que anda pesada';
  if (!v.trabalho.atual && c.eu >= 18 && c.eu < 65) return 'o trabalho que não aparece';
  if (v.trabalho.atual && v.mente.estresse >= 60) return 'o trabalho, que anda tomando tudo';
  if (Object.values(v.vinculos).some(x => x.romance && x.romance.estagio !== 'ex' && x.romance.estagio !== 'interesse' && x.tensao >= 40)) return 'a relação, que anda difícil';
  if (c.eu >= 15 && c.eu <= 19) return 'o que fazer depois da escola';
  return 'uma decisão que você anda adiando';
}

export const INTERACOES_VIVIDAS: Interacao[] = [
  {
    // Conhecer uma pessoa é descobrir FATOS sobre ela (de onde é, o que faz, o que estudou, a família) — e guardá-los.
    id: 'perguntar_vida',
    quando: c => humano(c) && c.eu >= 10 && c.ip >= 10 && !emRomance(c) && !ex(c) && c.vin.estagio !== 'rival' && !distante(c) && !bloqueado(c) && alcance(c) && c.vin.proximidade >= 15 && pendentes(c.v, c.p, c.vin).length > 0,
    rotulo: c => rotuloPergunta(c, pendentes(c.v, c.p, c.vin)[0]),
    destaque: true,
    executar: (c, r) => {
      const k = pendentes(c.v, c.p, c.vin)[0];
      // Quem é fechado e ainda não tem intimidade nem sempre abre a conversa.
      const fechada = c.p.temperamento.extroversao < -0.3 && c.vin.proximidade < 45;
      if (fechada && r.chance(0.45)) { afeto(c, 1); return { resultado: `${c.p.nome} respondeu com uma piada e mudou de assunto. Ainda não é hora.` }; }
      const s = revelar(c.v, c.p, c.vin, k)!;
      afeto(c, 2 + Math.max(0, c.p.temperamento.extroversao) * 3); confiar(c, 2);
      lembrarCom(c.v, c.p.id, fraseDoSaber(c.v, c.p, s), 'descoberta', 1);
      return { resultado: cenaDaDescoberta(c.v, c.p, s) };
    }
  },
  {
    // Dizer o que admira: aproxima — mas elogio repetido soa vazio, e no meio de um atrito soa estranho.
    id: 'elogiar',
    quando: c => humano(c) && c.eu >= 8 && c.ip >= 6 && !ex(c) && c.vin.estagio !== 'rival' && c.papel !== 'conhecido' && c.papel !== 'parceiro' && c.papel !== 'caso' && !distante(c) && !bloqueado(c) && alcance(c) && estadoDaRelacao(c.v, c.vin) !== 'conflito',
    rotulo: c => {
      const n = c.p.nome;
      if (c.papel === 'filho' || c.papel === 'neto') return `Dizer a ${n} que tem orgulho ${dele(c)}`;
      if (c.papel === 'genitor' || c.papel === 'avo') return `Agradecer a ${n} por algo que nunca agradeceu`;
      if (c.papel === 'colega' && c.vin.convivio.includes('trabalho')) return `Reconhecer o trabalho de ${n} na frente dos outros`;
      if (c.papel === 'colega') return `Dizer a ${n} que o trabalho ${dele(c)} ficou bom`;
      return `Dizer a ${n} o que admira ${c.papel === 'amigo_proximo' ? 'nessa amizade' : `n${flex(c.p.genero, 'ele', 'ela', 'elu')}`}`;
    },
    executar: c => {
      const n = conta(c, 'elogiar');
      const tensa = c.vin.tensao >= 35;
      // Quem é inseguro sente mais; elogio pela quarta vez, menos.
      const sente = (n >= 4 ? 0.3 : 1) * (1 + Math.max(0, -c.p.temperamento.estabilidade) * 0.8);
      afeto(c, Math.round((tensa ? 1 : 4) * sente)); confiar(c, tensa ? 0 : 2);
      if (c.papel === 'filho' && c.ip < 18) c.vin.presenca = clamp((c.vin.presenca ?? 30) + 3);
      if (c.papel === 'colega' && c.vin.convivio.includes('trabalho') && c.v.trabalho.atual) c.v.trabalho.atual.clima = clamp((c.v.trabalho.atual.clima ?? 50) + 2);
      if (tensa) return { resultado: `${c.p.nome} ouviu, desconfiad${flex(c.p.genero, 'o', 'a', 'e')}. No meio do que anda entre vocês, soou estranho.` };
      if (n >= 4) return { resultado: `${c.p.nome} sorriu — mas já ouviu isso de você antes.` };
      if (n === 1 && (c.papel === 'genitor' || c.papel === 'avo')) lembrarCom(c.v, c.p.id, 'Você agradeceu, com todas as letras.', 'apoio', 2);
      return { resultado: c.papel === 'filho' && c.ip < 18 ? `${c.p.nome} fingiu que não ligou. Mais tarde, contou para alguém.` : c.papel === 'genitor' || c.papel === 'avo' ? `${c.p.nome} ficou com os olhos cheios. "Não precisava", disse — e precisava.` : `${c.p.nome} ficou sem graça, e depois muito contente.` };
    }
  },
  {
    // Pedir conselho a quem tem mais estrada (ou a quem conhece você de verdade): quem é perguntado se sente importante.
    id: 'pedir_conselho',
    quando: c => humano(c) && c.eu >= 12 && !emRomance(c) && !ex(c) && c.vin.estagio !== 'rival' && !distante(c) && !bloqueado(c) && alcance(c) && c.vin.proximidade >= 35
      && (c.papel === 'genitor' || c.papel === 'avo' || c.papel === 'amigo_proximo' || (c.ip >= c.eu + 8 && (c.papel === 'parente' || c.papel === 'amigo' || c.papel === 'colega' || c.papel === 'sogro')))
      && !(c.vin.formacao && c.vin.formacao.papel !== 'colega' && c.vin.formacao.tFim === undefined),
    rotulo: c => `Pedir conselho a ${c.p.nome} sobre ${assuntoDoConselho(c)}`,
    executar: c => {
      const sensata = c.p.temperamento.responsabilidade > 0.1 || c.ip >= 50;
      afeto(c, 3); confiar(c, 4);
      c.v.mente.estresse = clamp(c.v.mente.estresse - (sensata ? 4 : 1));
      if (conta(c, 'conselho') === 1) lembrarCom(c.v, c.p.id, `Pediu conselho sobre ${assuntoDoConselho(c)}.`, 'apoio', 1);
      return { resultado: sensata ? `${c.p.nome} ouviu tudo antes de falar. O conselho não resolveu nada sozinho — mas a decisão ficou mais clara.` : `${c.p.nome} deu um conselho que você não vai seguir. Mas falar ajudou.` };
    }
  },
  {
    // Os avós por perto: pedir para ficarem com as crianças. Alivia — e aproxima os netos dos avós.
    id: 'pedir_ajuda_criancas',
    quando: c => humano(c) && c.eu >= 18 && (c.papel === 'genitor' || c.papel === 'sogro') && !c.longe && !bloqueado(c) && estadoDaRelacao(c.v, c.vin) !== 'conflito'
      && filhosDe(c.v).some(f => f.vivo && idadePessoa(c.v, f) < 11 && c.v.vinculos[f.id]?.convivio.includes('casa')),
    rotulo: c => `Pedir a ${c.p.nome} para ficar com as crianças um fim de semana`,
    executar: c => {
      const pode = c.ip < 78 && c.p.saude >= 40;
      if (!pode) return { resultado: `${c.p.nome} quis muito, mas já não dá conta de criança pequena um fim de semana inteiro.` };
      c.v.mente.estresse = clamp(c.v.mente.estresse - 6);
      afeto(c, 2);
      return { resultado: `Um fim de semana inteiro de silêncio em casa. As crianças voltaram com doce, histórias e uma bronca que ${c.p.nome} jura que não deu.` };
    }
  }
];
