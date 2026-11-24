/**
 * A GRAMÁTICA DO CONFLITO (Relações 2.0): discordar, cobrar, pedir desculpas,
 * fazer as pazes, encerrar uma amizade, provocar um rival.
 *
 * Não é um menu de botões para encher ou esvaziar barras:
 *   - cada ação só aparece quando faz sentido (não há "fazer as pazes" sem
 *     ruptura, nem "encerrar amizade" com quem nunca foi amigo);
 *   - tem intervalo (uma discussão por ano com a mesma pessoa; um pedido de
 *     desculpas recusado espera; uma reconciliação recusada espera mais);
 *   - o resultado é da relação, não do clique (`lacos.discutir`,
 *     `lacos.desculpar`, `lacos.reconciliar`): temperamento, confiança,
 *     história, gravidade, o que já aconteceu antes;
 *   - e fica na história (o que importa vira marco; a conversa banal, não).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import { escrever, lembrarCom } from '../nucleo';
import { bloqueio, PERMITIDO } from '../plausibilidade';
import { flex, comPreposicao } from '../texto';
import type { CtxI, Interacao, Saida } from './interacoes';
import { assuntoDaDiscussao, desculpar, discutir, ehAmizade, estadoDaRelacao, reconciliar, romper, type DesfechoDaDiscussao } from './lacos';
import { tomDaPessoa } from './conversas';
import { DESCULPAS, ENCERRA, PROVOCA, TOM_CONFLITO } from '../dados/tons36';
export { DESCULPAS, ENCERRA, PROVOCA };

/* VIDA 36 · Frente 1 (conflitos): a reação de quem discorda depende do tom dela (o temperamento real), não de uma frase só. */
export const reagiuConflito = (c: CtxI, r: Rng): string => {
  const t = TOM_CONFLITO[tomDaPessoa(c.p)];
  const sub2 = (x: string) => x.replace(/\{n\}/g, c.p.nome).replace(/\{o\}/g, c.p.genero === 'feminino' ? 'a' : 'o');
  return `${sub2(t.abre[Math.floor(r.next() * t.abre.length)])} ${sub2(t.corpo[Math.floor(r.next() * t.corpo.length)])}.`;
};

const ele = (c: CtxI) => flex(c.p.genero, 'ele', 'ela', 'elu');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const humano = (c: CtxI) => !c.p.especie;
const distante = (c: CtxI) => c.vin.distancia !== undefined && c.v.t - c.vin.distancia < 60;
const alcance = (c: CtxI) => c.casa || !c.longe || c.vin.convivio.length > 0 || c.v.t - c.vin.tUltimoContato < 24;
/** Com quem dá para discutir de verdade: quem tem lugar na sua vida (não um conhecido de passagem, nem uma criança pequena). */
const temLugar = (c: CtxI) => ['amigo', 'amigo_proximo', 'colega', 'parceiro', 'saindo', 'genitor', 'irmao', 'avo', 'parente', 'sogro', 'genro', 'filho', 'ex'].includes(c.papel) || c.vin.estagio === 'rival';
const intervalo = (c: CtxI, chave: string, meses: number, motivo: string) => {
  const t = c.v.fatos[`${chave}_${c.p.id}`];
  return t !== undefined && c.v.t - t < meses ? bloqueio('incompativel', motivo) : PERMITIDO;
};
const marcar = (c: CtxI, chave: string) => { c.v.fatos[`${chave}_${c.p.id}`] = c.v.t; };

/** O desfecho de uma discussão, em palavras de gente (e, quando marca, na Linha da Vida). */
function contar(c: CtxI, d: DesfechoDaDiscussao, assunto: string, cobrou: boolean, r: Rng): Saida {
  const tema = c.vin.parentesco ? 'familia' : c.vin.romance ? 'amor' : 'amizade';
  if (d === 'ruptura' || d === 'briga') {
    escrever(c.v, { texto: d === 'ruptura' ? `Brigou feio com ${c.p.nome} por causa ${comPreposicao('de', assunto)}. A amizade acabou ali.` : `Brigou com ${c.p.nome} por causa ${comPreposicao('de', assunto)}.`, relevancia: d === 'ruptura' ? 'biografia' : 'cotidiano', tema, tom: 'ruim', escolha: true, pessoas: [c.p.id] });
  }
  const resultado = d === 'resolveu'
    ? (cobrou ? `Você disse o que incomodava. ${c.p.nome} ouviu, explicou o lado ${flex(c.p.genero, 'dele', 'dela', 'delu')} — e no fim os dois sabiam onde estavam.` : `Vocês discordaram de verdade, e ninguém saiu menor da conversa. ${cap(ele(c))} respeitou você mais por ter dito.`)
    : d === 'desconforto'
      ? `Ficou um desconforto no ar. Mas foi dito — e às vezes é isso que importa.`
      : d === 'briga'
        ? `A conversa virou briga. ${c.p.nome} levantou a voz, você também. Cada um saiu com a sua razão.`
        : `A briga foi longe demais. ${c.p.nome} disse que não dá mais — e foi embora.`;
  // VIDA 36: a reação de quem ouviu vem antes do desfecho (o tom dela, não um texto só).
  return { resultado: `${reagiuConflito(c, r)} ${resultado}`, aviso: { texto: d === 'resolveu' ? 'Resolveram' : d === 'desconforto' ? 'Ficou dito' : d === 'briga' ? 'Brigaram' : 'Romperam', tom: d === 'resolveu' ? 'bom' : d === 'desconforto' ? 'neutro' : 'ruim' } };
}


/* VIDA 36 · Frente 1: provocar e encerrar a amizade têm a reação do tom da pessoa (não duas frases para todos). */
const pick = (r: Rng, xs: string[], c: CtxI) => xs[Math.floor(r.next() * xs.length)].replace(/\{n\}/g, c.p.nome).replace(/\{o\}/g, c.p.genero === 'feminino' ? 'a' : 'o');

export const INTERACOES_DE_CONFLITO: Interacao[] = [
  {
    // Discordar é parte de qualquer relação de verdade: pode aproximar, incomodar ou virar briga.
    id: 'discordar', variante: 'discreto',
    quando: c => humano(c) && c.eu >= 10 && c.ip >= 10 && temLugar(c) && !distante(c) && alcance(c) && !c.vin.ruptura && c.papel !== 'ex',
    disponivel: c => intervalo(c, 'discutiu', 12, 'Vocês já discutiram este ano.'),
    rotulo: c => `Discordar de ${c.p.nome}, e dizer isso`,
    executar: (c, r) => {
      const assunto = assuntoDaDiscussao(c.v, c.vin, r);
      marcar(c, 'discutiu');
      return contar(c, discutir(c.v, r, c.p, c.vin, 1, assunto), assunto, false, r);
    }
  },
  {
    // Cobrar pede um motivo (o atrito, a briga que ficou, a distância cobrada): confrontar por uma razão legítima.
    id: 'cobrar', variante: 'secundario',
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 12 && temLugar(c) && !distante(c) && alcance(c) && !c.vin.ruptura && (c.vin.tensao >= 25 || !!c.vin.conflito || c.vin.chamado?.tipo === 'reclamacao'),
    prioridade: c => (c.vin.conflito ? 1.8 : 1),
    disponivel: c => intervalo(c, 'discutiu', 12, 'Vocês já tiveram essa conversa este ano.'),
    rotulo: c => (c.vin.conflito ? `Voltar a falar com ${c.p.nome} sobre ${c.vin.conflito.assunto}` : `Dizer a ${c.p.nome} o que anda incomodando`),
    executar: (c, r) => {
      const assunto = c.vin.conflito?.assunto ?? assuntoDaDiscussao(c.v, c.vin, r);
      marcar(c, 'discutiu');
      return contar(c, discutir(c.v, r, c.p, c.vin, 2, assunto), assunto, true, r);
    }
  },
  {
    // Fazer as pazes depois de uma ruptura (a ex-amizade, o rompimento): pode ser aceito — ou não, ainda.
    id: 'reconciliar', variante: 'principal', destaque: true,
    quando: c => humano(c) && c.eu >= 12 && c.ip >= 10 && estadoDaRelacao(c.v, c.vin) === 'rompido',
    prioridade: () => 2,
    disponivel: c => intervalo(c, 'reconciliar_nao', 24, `${c.p.nome} não quis da última vez. É cedo para tentar de novo.`),
    rotulo: c => `Tentar fazer as pazes com ${c.p.nome}`,
    executar: (c, r) => {
      if (!reconciliar(c.v, r, c.p, c.vin)) {
        return { resultado: `${c.p.nome} respondeu, educad${flex(c.p.genero, 'o', 'a', 'e')}, que ainda não está pront${flex(c.p.genero, 'o', 'a', 'e')}. A porta não fechou — só não abriu.`, aviso: { texto: 'Ainda não', tom: 'neutro' } };
      }
      escrever(c.v, { texto: `Fez as pazes com ${c.p.nome}.`, relevancia: 'biografia', tema: c.vin.parentesco ? 'familia' : 'amizade', tom: 'bom', escolha: true, pessoas: [c.p.id], evento: { tipo: 'reconciliacao', pessoaId: c.p.id, peso: 30 } });
      return { resultado: `${reagiuConflito(c, r)} Nas primeiras frases, um cuidado de vidro; depois, a risada antiga voltou. Não é como antes — é outra coisa, com o antes dentro.`, aviso: { texto: 'Fizeram as pazes', tom: 'bom' } };
    }
  },
  {
    // Encerrar uma amizade é escolha, e tem custo: a pessoa sente, a história fica.
    id: 'encerrar_amizade', variante: 'perigo',
    quando: c => humano(c) && c.eu >= 12 && ehAmizade(c.vin) && !c.vin.romance,
    rotulo: c => `Encerrar a amizade com ${c.p.nome}`,
    executar: (c, r: Rng) => {
      const porque = c.vin.conflito ? `Você encerrou a amizade depois da briga sobre ${c.vin.conflito.assunto}.` : c.vin.tensao >= 35 ? 'Você encerrou a amizade: o atrito tinha ficado maior do que ela.' : 'Você encerrou a amizade, sem uma briga que explicasse.';
      romper(c.v, c.p, c.vin, porque, 'eu');
      c.vin.proximidade = clamp(c.vin.proximidade - 25);
      c.vin.chamado = undefined;
      const magoou = c.vin.confianca >= 50 || c.p.temperamento.estabilidade < 0;
      if (magoou) c.vin.tensao = clamp(c.vin.tensao + 15);
      escrever(c.v, { texto: `Encerrou a amizade com ${c.p.nome}.`, relevancia: 'biografia', tema: 'amizade', tom: 'ruim', escolha: true, pessoas: [c.p.id], evento: { tipo: 'amizade_fim', pessoaId: c.p.id, peso: 25 } });
      void r;
      const tomE = ENCERRA[tomDaPessoa(c.p)];
      return { resultado: magoou ? `${pick(r, tomE.magoou, c)} A resposta não coube numa mensagem.` : `${pick(r, tomE.aceitou, c)} Talvez já soubesse.`, aviso: { texto: 'Amizade encerrada', tom: 'ruim' } };
    }
  },
  {
    // A rivalidade: provocar alimenta (e às vezes empurra os dois a render mais — na quadra, na sala, no escritório).
    id: 'provocar', variante: 'discreto',
    quando: c => humano(c) && c.eu >= 10 && c.vin.estagio === 'rival' && c.vin.convivio.length > 0,
    disponivel: c => intervalo(c, 'provocou', 12, 'Já houve provocação de sobra este ano.'),
    rotulo: c => `Provocar ${c.p.nome}`,
    executar: (c, r) => {
      marcar(c, 'provocou');
      c.vin.tensao = clamp(c.vin.tensao + 14);
      const respondeu = r.chance(0.5 + Math.max(0, c.p.temperamento.extroversao) * 0.3);
      if (respondeu) lembrarCom(c.v, c.p.id, `A rivalidade com ${c.p.nome} rendeu mais um capítulo.`, 'conflito', 1);
      const tom = PROVOCA[tomDaPessoa(c.p)];
      return { resultado: respondeu ? `${pick(r, tom.devolve, c)} Ninguém ganhou; os dois vão lembrar.` : `${pick(r, tom.ignora, c)} O silêncio, de certa forma, foi pior.` };
    }
  }
];

/* VIDA 36 · Frente 1 (desculpas): a resposta às desculpas sai do tom da pessoa, em cada resultado (aceitas, em parte, não). */
const desculpaTom = (c: CtxI, r: Rng, d: 'aceitas' | 'em_parte' | 'nao'): string => {
  const xs = DESCULPAS[tomDaPessoa(c.p)][d];
  return xs[Math.floor(r.next() * xs.length)].replace(/\{n\}/g, c.p.nome).replace(/\{o\}/g, c.p.genero === 'feminino' ? 'a' : 'o');
};

/** Pedir desculpas (substitui o antigo: o resultado é da relação — aceitas, em parte ou recusadas). */
export function executarDesculpas(c: CtxI, r: Rng): Saida {
  const d = desculpar(c.v, r, c.p, c.vin);
  if (d === 'aceitas') {
    if (c.vin.romance) c.vin.romance.envolvimento = clamp(c.vin.romance.envolvimento + 4);
    return { resultado: desculpaTom(c, r, 'aceitas'), aviso: { texto: 'Desculpas aceitas', tom: 'bom' } };
  }
  if (d === 'em_parte') return { resultado: desculpaTom(c, r, 'em_parte'), aviso: { texto: 'Aceitas em parte', tom: 'neutro' } };
  return { resultado: desculpaTom(c, r, 'nao'), aviso: { texto: 'Ainda não', tom: 'ruim' } };
}
