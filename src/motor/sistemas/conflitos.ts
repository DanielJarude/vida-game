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
import { tomDaPessoa, type TomDaPessoa } from './conversas';

/* VIDA 36 · Frente 1 (conflitos): a reação de quem discorda depende do tom dela (o temperamento real), não de uma frase só. */
const TOM_CONFLITO: Record<TomDaPessoa, { abre: string[]; corpo: string[] }> = {
  timido: { abre: ['{n} ficou em silêncio, com o rosto vermelho.', '{n} baixou os olhos e engoliu a resposta.'], corpo: ['e só disse que precisava pensar', 'e deixou o assunto morrer sem concordar'] },
  desconfiado: { abre: ['{n} cruzou os braços.', '{n} rebateu com ironia.'], corpo: ['e perguntou quem tinha dito isso a você', 'e lembrou de outra vez em que você tinha faltado'] },
  afetuoso: { abre: ['{n} segurou sua mão antes de responder.', '{n} sentiu de verdade.'], corpo: ['e disse que não queria perder a relação por causa disso', 'e pediu para conversarem sem pressa'] },
  expansivo: { abre: ['{n} levantou a voz, animad{o} com a discussão.', '{n} respondeu na hora, sem pensar duas vezes.'], corpo: ['e chamou a atenção de todo mundo', 'e foi direto ao ponto, sem rodeios'] },
  brincalhao: { abre: ['{n} tentou fazer piada para aliviar.', '{n} riu e devolveu a provocação.'], corpo: ['e disse que a briga não valia o tempo', 'e prometeu cobrar a conta depois'] },
  serio: { abre: ['{n} ouviu sem interromper.', '{n} ficou sério, medindo as palavras.'], corpo: ['e respondeu com argumentos, um por um', 'e disse que ia pensar no que você falou'] },
  neutro: { abre: ['{n} respondeu com calma.', '{n} não gostou, mas ouviu.'], corpo: ['e explicou o lado dele', 'e pediu um tempo para conversar depois'] }
};
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
export const PROVOCA: Record<TomDaPessoa, { devolve: string[]; ignora: string[] }> = {
  timido: { devolve: ['{n} respondeu baixinho, mas respondeu, e todo mundo ouviu.', '{n} devolveu com um riso sem graça.'], ignora: ['{n} fingiu não ouvir e foi embora da sala.', '{n} ficou vermelho e não olhou mais para você.'] },
  desconfiado: { devolve: ['{n} devolveu com ironia afiada, medindo a sua reação.', '"Vai ficar nisso mesmo?", respondeu {n}, seco.'], ignora: ['{n} não deu o gosto de responder, e anotou mentalmente.', '{n} ignorou, mas nunca mais esqueceu.'] },
  afetuoso: { devolve: ['{n} riu e devolveu leve, sem querer briga de verdade.', '{n} respondeu com uma provocação carinhosa.'], ignora: ['{n} não entrou na brincadeira e perguntou se estava tudo bem.', '{n} deixou passar, com um olhar que pedia trégua.'] },
  expansivo: { devolve: ['{n} devolveu na hora, em voz alta, e a sala inteira riu.', '{n} aumentou a provocação e pediu plateia.'], ignora: ['{n} fingiu desinteresse, mas não parou de olhar para você.', '{n} saiu do assunto e tentou animar outra roda.'] },
  brincalhao: { devolve: ['{n} devolveu com uma piada melhor que a sua.', '{n} respondeu rindo e desafiou você para a revanche.'], ignora: ['{n} sorriu e disse que aquela você não ganhava.', '{n} fingiu que não tinha ouvido, de propósito.'] },
  serio: { devolve: ['{n} respondeu com um argumento, sem nenhum sorriso.', '"Não vou entrar nessa", disse {n}, e voltou ao assunto.'], ignora: ['{n} não respondeu, e a provocação morreu sozinha.', '{n} ficou em silêncio e foi cuidar do que importava.'] },
  neutro: { devolve: ['{n} devolveu, sem muito entusiasmo.', '{n} respondeu, e a conversa seguiu.'], ignora: ['{n} não respondeu.', '{n} mudou de assunto.'] }
};
export const ENCERRA: Record<TomDaPessoa, { magoou: string[]; aceitou: string[] }> = {
  timido: { magoou: ['{n} não disse nada e foi embora sem olhar para trás.', '{n} ficou calad{o} por um bom tempo, e depois pediu desculpas por algo que não fez.'], aceitou: ['{n} disse "tudo bem" baixinho, sem discutir.', '{n} concordou em silêncio e se despediu.'] },
  desconfiado: { magoou: ['{n} perguntou o que você ganhava com aquilo.', '"Eu já esperava", disse {n}, com um sorriso amargo.'], aceitou: ['"Se é assim, tá bom", disse {n}, sem surpresa.', '{n} disse que já tinha percebido.'] },
  afetuoso: { magoou: ['{n} chorou e pediu para pensarem juntos antes de decidir.', '{n} disse que não entendia, e perguntou o que tinha feito de errado.'], aceitou: ['{n} disse que ia sentir falta, e te deixou ir.', '{n} aceitou com tristeza e um abraço longo.'] },
  expansivo: { magoou: ['{n} gritou que você estava sendo injusto e saiu batendo a porta.', '{n} contou para todo mundo, aos berros, o que tinha acontecido.'], aceitou: ['{n} deu de ombros e disse que outro amigo aparece.', '"Tudo bem, então", disse {n}, já procurando outra roda.'] },
  brincalhao: { magoou: ['{n} tentou rir, mas a piada não saiu.', '{n} disse que não acreditava, e esperou você desmentir.'], aceitou: ['{n} brincou que ia cobrar a amizade depois.', '"Ok, mas não me esquece", riu {n}.'] },
  serio: { magoou: ['{n} disse que lamentava, e que a decisão era sua.', '{n} ouviu tudo e anotou, em tom calmo, as razões que você deu.'], aceitou: ['{n} disse que respeitava a decisão, sem mais.', '"Entendo", disse {n}, e se despediu com educação.'] },
  neutro: { magoou: ['{n} ficou chateado e não quis mais conversar naquele dia.', '{n} disse que não esperava aquilo.'], aceitou: ['{n} disse "tudo bem", e seguiu.', '{n} aceitou sem muita reação.'] }
};
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
export const DESCULPAS: Record<TomDaPessoa, { aceitas: string[]; em_parte: string[]; nao: string[] }> = {
  timido: { aceitas: ['{n} disse "tá bom" baixinho e não falou mais no assunto.', '{n} assentiu, sem olhar para você.'], em_parte: ['{n} agradeceu quase sem voz, e disse que precisava de um tempo.', '{n} ficou pensativ{o} e disse que ainda não sabia.'], nao: ['{n} não respondeu, e se afastou.', '{n} disse que não era hora de falar disso.'] },
  desconfiado: { aceitas: ['"Vamos ver", disse {n}, e ficou esperando a próxima atitude.', '{n} aceitou, mas anotou mentalmente a data.'], em_parte: ['{n} aceitou em parte e quer ver se vai se repetir.', '"Desculpa aceita, por enquanto", disse {n}.'], nao: ['"Desculpa não apaga nada", respondeu {n}, seco.', '{n} disse que não ia esquecer tão cedo.'] },
  afetuoso: { aceitas: ['{n} te abraçou e disse que estava tudo bem.', '{n} sorriu, aliviad{o}, e pediu que não repetisse.'], em_parte: ['{n} agradeceu, com a voz embargada, e disse que precisava de um tempo.', '{n} disse que queria, mas que doeu.'], nao: ['{n} chorou e disse que não sabia se conseguiria perdoar.', '{n} pediu que você se afastasse um pouco.'] },
  expansivo: { aceitas: ['{n} gritou "tá perdoado!" e puxou você para a roda.', '{n} aceitou na hora, com um tapinha nas costas.'], em_parte: ['{n} disse "tá, mas você me deve uma", rindo.', '{n} aceitou pela metade e mudou de assunto em voz alta.'], nao: ['{n} disse, alto, que desculpa não resolvia.', '{n} saiu da sala batendo a porta.'] },
  brincalhao: { aceitas: ['"Tá perdoado, mas você paga o almoço", brincou {n}.', '{n} fez um gesto de quem aceita e disse "agora você me deve uma".'], em_parte: ['"Meio perdoado. A outra metade você paga em piada", riu {n}.', '{n} disse que vai pensar, e ainda fez uma careta.'], nao: ['{n} tentou rir, mas a piada não saiu.', '"Essa eu não engulo", disse {n}, sem graça.'] },
  serio: { aceitas: ['{n} disse que aceitava, e que a conversa estava encerrada.', '"Entendi. Obrigad{o} por reconhecer", disse {n}.'], em_parte: ['{n} disse que aceitava a parte que cabia a você.', '"Vou considerar, mas não é imediato", disse {n}.'], nao: ['{n} disse que pedir desculpas não resolvia o que aconteceu.', '"Não agora", respondeu {n}, sem alterar o tom.'] },
  neutro: { aceitas: ['{n} disse "tudo bem", e seguiu.', '{n} aceitou sem muita reação.'], em_parte: ['{n} agradeceu e disse que levaria um tempo.', '{n} disse que ia pensar.'], nao: ['{n} disse que não era bem assim.', '{n} não aceitou por enquanto.'] }
};
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
