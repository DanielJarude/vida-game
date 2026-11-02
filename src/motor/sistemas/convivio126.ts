/**
 * VIDA 12.6 — O JEITO NA CONVIVÊNCIA: o que a personalidade, os interesses e a memória das pessoas FAZEM.
 *
 * - Cada interação passa pelo jeito de quem a recebe (`jeito.fatorDoJeito`): o tímido rende menos no meio de muita gente
 *   e mais a dois; o carinhoso valoriza o carinho; o de pavio curto sente mais a briga; o paciente, menos. E pela
 *   memória (`jeito.climaDaMemoria`): com quem guarda uma mágoa, a aproximação rende menos (e a pessoa às vezes diz por
 *   quê); com quem guarda gratidão, rende mais. O presente e a ajuda viram lembrança.
 * - Quem foi traído não aceita convite enquanto a traição não passou (sem reparar antes) — `recusaPelaMemoria`.
 * - PROMESSAS: prometer estar mais presente fica guardado; um ano depois a pessoa confere (cumpriu ou não).
 * - CONHECER A FAMÍLIA: deixa de ser um texto fixo — lê os pais de verdade (vivos, mortos, longe, o jeito deles), o tempo
 *   de namoro, a idade, a distância e as tatuagens à vista, e dá em coisas diferentes.
 * - O CASO: o encontro escondido, o presente que deixa rastro, a viagem com desculpa, a conversa sobre o futuro, o tempo.
 *
 * Sorteios derivados (`rngDe`): nada aqui mexe na sequência do gerador principal.
 */
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Pessoa, Vida } from '../tipos';
import type { CtxI, Interacao, Saida } from './interacoes';
import { escrever, lembrarCom, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { compatibilidade } from './social';
import { flex } from '../texto';
import { pagar, vereditoDePagar } from './dinheiro';
import { economiaLocal } from '../dados/lugares';
import { mesmaCidade } from './vinculos';
import { temTatuagemVisivel } from './tatuagens';
import { anoDe } from '../tempo';
import {
  climaDaMemoria, emComum, fatorDoJeito, feridaAberta, generoDaInteracao, gratidao, lembrancaDaInteracao, nomeDoTraco, tem, tracosDe, traicaoQueNaoPassou, valorDe, NOME_VALOR,
  type Lembranca
} from './jeito';

const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const Ele = (p: Pessoa) => flex(p.genero, 'Ele', 'Ela', 'Elu');
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 10) * 10;
const um = <T,>(r: Rng, xs: T[]): T => xs[Math.floor(r.next() * xs.length) % xs.length];
/**
 * VIDA 12.7 — uma frase da lista que não repete a da vez anterior com a mesma pessoa: o ponto de partida é sorteado (de
 * cada relação, estável), e cada vez anda uma casa. Duas vezes seguidas, duas frases diferentes.
 */
export function semRepetir<T>(c: CtxI, chave: string, r: Rng, xs: T[]): T {
  const h = c.vin.habitos ?? (c.vin.habitos = {});
  const n = (h[`frase:${chave}`] = (h[`frase:${chave}`] ?? 0) + 1);
  const base = Math.floor(rngDe(c.v.id, 'frase', chave, c.p.id).next() * xs.length);
  void r;
  return xs[(base + n) % xs.length];
}

/**
 * VIDA 12.7 — o fim de um caso não é sempre "não insistiu": depende de quanto durou, do jeito de quem fica, de se era
 * combinado (o paralelo consentido) e de quanto a coisa já estava por um fio.
 */
export function fimDoCaso(c: CtxI): string {
  const rom = c.vin.romance;
  const meses = c.v.t - (rom?.tInicio ?? c.v.t);
  const r = rngDe(c.v.id, 'fim_caso', c.p.id, c.v.t);
  const n = c.p.nome, E = ele(c.p).replace(/^./, x => x.toUpperCase()), o = flex(c.p.genero, 'o', 'a', 'e');
  if (rom?.paralelo) return um(r, [`Terminaram com o cuidado que tinham combinado no começo: uma conversa franca, um abraço, e ${n} desejou sorte.`, `${n} já sentia que vinha. "Foi bom porque foi honesto", disse — e foi embora leve.`]);
  if (tem(c.p, 'temperamental') || tem(c.p, 'ciumento')) return um(r, [`${n} não aceitou: mensagens de madrugada por uma semana, uma ligação que você não atendeu, depois silêncio.`, `"Você vai se arrepender", ${n} disse, batendo a porta do carro. Você passou dias olhando o celular.`, `${n} chorou, gritou e, no fim, pediu só para você não sumir de vez. Você sumiu.`]);
  if (meses < 6) return um(r, [`Foi rápido e terminou rápido: uma mensagem, um "entendo" de ${n}, e nenhum dos dois tocou mais no assunto.`, `Você disse a ${n} que não dava mais. ${E} deu de ombros: "era para ser leve mesmo".`, `${n} respondeu com um emoji e, uma hora depois, com um "se cuida".`]);
  if (meses >= 24) return um(r, [`Anos de encontros escondidos terminaram numa conversa de dez minutos num carro parado. ${n} chorou — e você também.`, `${n} já sabia antes de você abrir a boca. "Eu esperei você escolher. Você escolheu."`, `${E} devolveu a chave do apartamento emprestado sem dizer nada. Foi o que mais doeu.`]);
  if (tem(c.p, 'carinhoso') || tem(c.p, 'paciente')) return um(r, [`${n} segurou sua mão e disse que foi bom enquanto durou. Saiu primeiro, sem olhar para trás.`, `"Eu sabia onde estava me metendo", ${n} disse, calm${o}. Desejou que você ficasse bem.`]);
  return um(r, [`Você disse a ${n} que acabou. ${E} não insistiu.`, `${n} ouviu tudo em silêncio, pagou a conta e foi embora antes de você.`, `Uma última conversa num lugar onde ninguém conhecia vocês. ${n} disse que ia apagar seu número — e apagou.`]);
}

/* ------------------------------------------------------------------ o jeito em cada interação */

const LEMBRA: Partial<Record<string, string>> = {
  traicao: 'a traição', conflito: 'a última briga', promessa_quebrada: 'a promessa que você não cumpriu', abandono: 'o tempo em que você sumiu', distancia: 'a distância daqueles anos',
  apoio: 'a ajuda que você deu', presente: 'o presente', promessa: 'a promessa cumprida', reconciliacao: 'a reconciliação'
};
const deQuando = (l: Lembranca) => `${LEMBRA[l.tipo] ?? 'aquilo'} de ${anoDe(l.t)}`;

/**
 * Depois de cada interação: o jeito e a memória mexem no que ela rendeu de proximidade, a lembrança fica, e às vezes a
 * pessoa diz alguma coisa que só ela diria. Chamado por `interacoes.executarInteracao`.
 */
export function jeitoNaInteracao(c: CtxI, interacao: string, proxAntes: number, out: Saida): void {
  const { v, p, vin } = c;
  if (p.especie || !vin) return;
  const g = generoDaInteracao(interacao);
  const delta = vin.proximidade - proxAntes;
  const f = fatorDoJeito(p, interacao);
  const clima = climaDaMemoria(v, vin, p);
  if (delta > 0) vin.proximidade = clamp(Math.round(proxAntes + delta * f.ganho * (1 + clima * 0.4)));
  else if (delta < 0) vin.proximidade = clamp(Math.round(proxAntes + delta * f.perda * (clima < 0 ? 1 + Math.abs(clima) * 0.3 : 1)));
  const lembra = lembrancaDaInteracao(interacao, delta > 0);
  if (lembra) lembrarCom(v, p.id, lembra.tipo === 'presente' ? `O presente que você deu a ${p.nome}.` : `Você esteve com ${p.nome} quando ${ele(p)} precisou.`, lembra.tipo, lembra.peso);
  // A fala de quem tem jeito (nem sempre; nunca a mesma duas vezes seguidas).
  if (!out.resultado || c.eu < 8) return;
  const r = rngDe(v.id, 'jeito', p.id, v.t, interacao);
  if (r.next() > 0.45) return;
  const frase = falaDoJeito(c, g, clima, r);
  if (!frase) return;
  const chave = `jeito:${frase.slice(0, 18)}`;
  if (vin.cenas?.includes(chave)) return;
  vin.cenas = [...(vin.cenas ?? []).filter(x => x.startsWith('jeito:')).slice(-2), ...(vin.cenas ?? []).filter(x => !x.startsWith('jeito:')), chave].slice(-8);
  out.resultado = `${out.resultado} ${frase}`;
}

function falaDoJeito(c: CtxI, g: ReturnType<typeof generoDaInteracao>, clima: number, r: Rng): string | null {
  const { v, p, vin } = c;
  const ferida = clima < -0.15 ? feridaAberta(v, vin, p) : undefined;
  if (ferida && (g === 'a_dois' || g === 'carinho' || g === 'conversa' || g === 'programa_social')) {
    return um(r, [
      `Mas ${p.nome} ainda não esqueceu ${deQuando(ferida)}: estava ali, nas entrelinhas.`,
      `${p.nome} foi gentil, mas guardad${o(p)} — ${deQuando(ferida)} ainda pesa.`,
      `Num momento, ${p.nome} tocou n${ferida.tipo === 'traicao' ? 'a ferida' : 'o assunto'}: ${deQuando(ferida)}. Ainda não passou.`
    ]);
  }
  const grato = clima > 0.2 ? gratidao(v, vin, p) : undefined;
  if (grato && (g === 'conversa' || g === 'a_dois') && r.next() < 0.5) return `${p.nome} lembrou, sem você perguntar, de ${deQuando(grato)}. Não esquece.`;
  const comum = emComum(v, p);
  if (comum.length && (g === 'a_dois' || g === 'conversa' || g === 'programa_social')) {
    const x = um(r, comum);
    return um(r, [`Vocês dois gostam de ${x}: assunto não faltou.`, `O papo foi parar em ${x}, como sempre — é o que vocês têm em comum.`, `${p.nome} mandou depois uma coisa sobre ${x}: "lembrei de você".`]);
  }
  const tr = tracosDe(p);
  if (tr.includes('timido') && g === 'programa_social') return `${p.nome}, ${nomeDoTraco(p, 'timido')}, ficou mais quiet${o(p)} no meio de tanta gente — a dois teria rendido mais.`;
  if (tr.includes('extrovertido') && g === 'programa_social') return `${p.nome} conhecia metade do lugar antes do fim da noite.`;
  if (tr.includes('carinhoso') && g === 'carinho') return `${p.nome}, ${nomeDoTraco(p, 'carinhoso')} como é, devolveu em dobro.`;
  if (tr.includes('ambicioso') && g === 'conversa') return `${p.nome} falou dos planos — ${ele(p)} sempre tem um próximo passo.`;
  if (tr.includes('reservado') && g === 'conversa') return `${p.nome} falou pouco de si, como sempre. Mas ficou.`;
  if (tr.includes('temperamental') && g === 'conflito') return `${p.nome} tem pavio curto: a voz subiu rápido.`;
  if (tr.includes('paciente') && g === 'conflito') return `${p.nome} ouviu até o fim antes de responder.`;
  if (g === 'conversa' && r.next() < 0.3) return `Deu para ver o que ${p.nome} preza: ${NOME_VALOR[valorDe(p)]}.`;
  return null;
}

const CONVITES = new Set(['a_dois', 'programa_social', 'carinho']);
/** Quem foi traído e não perdoou não aceita convite (as reparadoras continuam abertas). */
export function recusaPelaMemoria(c: CtxI, interacao: string): Veredito | null {
  if (c.p.especie || !CONVITES.has(generoDaInteracao(interacao))) return null;
  const t = traicaoQueNaoPassou(c.v, c.vin, tem(c.p, 'rancoroso') ? 5 : 3);
  if (!t) return null;
  return bloqueio('incompativel', `${c.p.nome} ainda não quer programa com você depois do que aconteceu em ${anoDe(t.t)}. Antes, só conversando — pedir desculpas, reconstruir a confiança.`);
}

/* ------------------------------------------------------------------ promessas */

const PROMETE = (c: CtxI) => !c.p.especie && c.eu >= 14 && c.p.vivo && ((c.papel === 'filho' && c.ip >= 5) || c.papel === 'parceiro' || c.papel === 'amigo_proximo' || ((c.papel === 'genitor' || c.papel === 'avo') && c.ip >= 55));

/** Uma vez por ano: as promessas de mais de um ano são conferidas pela pessoa. Sem sorteio. */
export function conferirPromessas(v: Vida): void {
  for (const k of Object.keys(v.fatos)) {
    if (!k.startsWith('promessa:')) continue;
    const id = k.slice(9), t = v.fatos[k];
    if (v.t - t < 12) continue;
    delete v.fatos[k];
    const p = v.pessoas[id], vin = v.vinculos[id];
    if (!p?.vivo || !vin) continue;
    // Cumpriu: esteve com a pessoa de verdade (contato no último ano e algumas vezes ao longo dele).
    const vezes = vin.habitos ? Object.entries(vin.habitos).reduce((s, [k, n]) => s + (k.startsWith('frase:') ? 0 : n), 0) : 0;
    const cumpriu = vin.tUltimoContato >= t + 6 && vezes >= 2;
    if (cumpriu) {
      vin.confianca = clamp(vin.confianca + 6);
      lembrarCom(v, id, `Você prometeu estar mais presente e cumpriu.`, 'promessa', 2);
      escrever(v, { texto: `Cumpriu o que prometeu a ${p.nome}: esteve mais presente. ${Ele(p)} reparou.`, relevancia: 'cotidiano', tema: 'familia', tom: 'bom', pessoas: [id] });
    } else {
      vin.confianca = clamp(vin.confianca - 8);
      vin.tensao = clamp(vin.tensao + 6);
      lembrarCom(v, id, `Você prometeu estar mais presente e não cumpriu.`, 'promessa_quebrada', 2);
      escrever(v, { texto: `A promessa feita a ${p.nome} ficou na promessa. ${Ele(p)} não cobrou — mas lembra.`, relevancia: 'cotidiano', tema: 'familia', tom: 'ruim', pessoas: [id] });
    }
  }
}

/* ------------------------------------------------------------------ conhecer a família */

/** Os pais de alguém que o jogo conhece (vivos ou não). */
const paisDe = (v: Vida, p: Pessoa) => (p.genitores ?? []).map(id => v.pessoas[id]).filter((x): x is Pessoa => !!x);

/**
 * VIDA 12.6 — conhecer a família de quem se namora: o resultado sai do que existe (os pais, o jeito deles, a distância,
 * o tempo de namoro, a idade, a diferença de idade, a tatuagem no pescoço) e não de um texto só.
 */
export function conhecerAFamilia(c: CtxI): Saida {
  const { v, p, vin } = c;
  v.fatos[`conheceu_familia_${p.id}`] = v.t;
  const r = rngDe(v.id, 'familia126', p.id, v.t);
  const pais = paisDe(v, p);
  const vivos = pais.filter(x => x.vivo);
  const mortos = pais.filter(x => !x.vivo);
  const meses = v.t - (vin.romance?.tInicio ?? vin.tInicio);
  const longe = !mesmaCidade(v, p);
  const difIdade = Math.abs(c.eu - c.ip);
  const quente = vivos.find(x => x.temperamento.afabilidade > 0.35);
  const dura = vivos.find(x => x.temperamento.afabilidade < -0.2 || x.temperamento.abertura < -0.4);
  const brava = vivos.find(x => x.temperamento.estabilidade < -0.45);
  const cedo = meses < 6, tarde = meses > 36;
  let pontos = compatibilidade(v, p) * 0.35 + (quente ? 0.25 : 0) - (dura ? 0.2 : 0) - (brava ? 0.1 : 0) - (cedo ? 0.1 : 0) + (tarde ? 0.08 : 0) - (difIdade > 12 ? 0.15 : 0) + (r.next() - 0.5) * 0.5;
  const tatu = temTatuagemVisivel(v) && !!dura;
  if (tatu) pontos -= 0.1;
  const frases: string[] = [];
  // A cena: onde, quem.
  if (!pais.length || !vivos.length) {
    frases.push(mortos.length
      ? `${p.nome} não tem mais ${mortos.length > 1 ? 'os pais' : mortos[0].genero === 'feminino' ? 'a mãe' : 'o pai'}: a família, hoje, são os tios e os primos de um almoço de domingo${longe ? ' — numa viagem até a cidade dele' : ''}.`.replace('cidade dele', `cidade ${flex(p.genero, 'dele', 'dela', 'delu')}`)
      : `A família de ${p.nome} é pequena: um almoço com quem sobrou por perto${longe ? ', depois de horas de estrada' : ''}.`);
    if (mortos.length) frases.push(um(r, [`No corredor, a foto ${mortos.length > 1 ? 'dos pais' : mortos[0].genero === 'feminino' ? 'da mãe' : 'do pai'}. ${p.nome} contou a história sem você pedir.`, `Alguém disse que você ia ter gostado de conhecer ${mortos[0].nome}. ${p.nome} apertou a sua mão.`]));
  } else {
    const nomes = vivos.map(x => x.nome).join(' e ');
    frases.push(longe ? `Uma viagem para conhecer ${nomes} — a família de ${p.nome} mora longe.` : `Almoço na casa de ${nomes}.`);
    if (cedo) frases.push(`Com ${meses <= 2 ? 'poucas semanas' : 'poucos meses'} de namoro, foi cedo: todo mundo olhava muito.`);
    if (tarde) frases.push(`Depois de ${Math.floor(meses / 12)} anos juntos, já era hora — alguém disse isso em voz alta.`);
    if (c.eu < 20) frases.push(`Na sua idade, o interrogatório foi sobre escola, planos e "o que seus pais fazem".`);
    if (difIdade > 12) frases.push(`A diferença de idade entre vocês foi o assunto que ninguém tocou e todo mundo pensou.`);
    if (tatu) frases.push(`${dura!.nome} olhou demais para a tatuagem à vista.`);
  }
  const deu = pontos > -0.05;
  if (deu) {
    vin.confianca = clamp(vin.confianca + (quente ? 7 : 4));
    if (vin.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento + (quente ? 6 : 3));
    lembrarCom(v, p.id, `Você conheceu a família de ${p.nome}${quente ? ` e ${quente.nome} gostou de você` : ''}.`, 'romance', 2);
    frases.push(quente ? um(r, [`${quente.nome} mandou comida para você levar — sinal de aprovação naquela família.`, `No fim, ${quente.nome} te puxou de canto: "cuida bem del${o(p) === 'o' ? 'e' : 'a'}".`, `${quente.nome} já tinha um apelido para você antes da sobremesa.`])
      : um(r, ['Ninguém fez festa, mas ninguém fez cara feia. Na família deles, isso é aprovação.', `${p.nome} disse no carro que tinha ido melhor do que esperava.`, 'Houve risada na mesa — e um convite para voltar no próximo aniversário.']));
  } else {
    vin.tensao = clamp(vin.tensao + (brava ? 9 : 5));
    lembrarCom(v, p.id, `O encontro com a família de ${p.nome}, que não foi bem.`, 'conflito', 1);
    frases.push(brava ? `${brava.nome} levantou a voz por causa de política no meio do almoço, e você não soube onde pôr as mãos. ${p.nome} pediu desculpas depois, envergonhad${o(p)}.`
      : dura ? `${dura.nome} foi educad${o(dura)} e fri${o(dura)} o tempo todo. Na volta, ${p.nome} disse que a família "é assim mesmo". Ficou um incômodo.`
      : um(r, ['Ficou faltando assunto, sobrando silêncio. Ninguém foi grosso; ninguém foi caloroso.', `Você ouviu, sem querer, alguém perguntar a ${p.nome} se era sério mesmo.`]));
  }
  escrever(v, { texto: `Conheceu a família de ${p.nome}${deu ? '' : ' — e não foi fácil'}.`, relevancia: 'cotidiano', tema: 'amor', tom: deu ? 'bom' : 'ruim', pessoas: [p.id] });
  return { resultado: frases.join(' ') };
}

/* ------------------------------------------------------------------ o caso */

const caso = (c: CtxI) => !c.p.especie && !!c.vin.romance?.secreto && c.vin.romance.estagio !== 'ex';
const rastro = (v: Vida, id: string, peso: number) => { v.fatos[`caso_rastro:${id}`] = Math.max(v.t, v.fatos[`caso_rastro:${id}`] ?? 0); v.fatos[`caso_rastro_peso:${id}`] = Math.min(3, (v.fatos[`caso_rastro_peso:${id}`] ?? 0) + peso); };
const quemEspera = (c: CtxI) => parceiro(c.v)?.p.nome ?? 'quem espera em casa';

/* ------------------------------------------------------------------ as interações novas */

export const INTERACOES_126: Interacao[] = [
  {
    id: 'prometer',
    quando: c => PROMETE(c) && c.v.fatos[`promessa:${c.p.id}`] === undefined,
    rotulo: c => `Prometer a ${c.p.nome} estar mais presente`,
    executar: c => {
      c.v.fatos[`promessa:${c.p.id}`] = c.v.t;
      c.vin.confianca = clamp(c.vin.confianca + 2);
      lembrarCom(c.v, c.p.id, 'Você prometeu estar mais presente.', 'ritual', 1);
      const fala = tem(c.p, 'rancoroso') || climaDaMemoria(c.v, c.vin, c.p) < -0.2 ? `${c.p.nome} ouviu e disse "vamos ver".` : tem(c.p, 'carinhoso') ? `${c.p.nome} te abraçou demorado.` : `${c.p.nome} sorriu, meio sem acreditar.`;
      return { resultado: `${fala} Daqui a um ano, ${ele(c.p)} vai saber se era verdade.` };
    }
  },
  {
    id: 'caso_encontro',
    quando: caso,
    disponivel: c => vereditoDePagar(c.v, preco(c.v, 280), 'Um encontro escondido custa uns'),
    rotulo: c => `Encontrar ${c.p.nome} escondido`,
    executar: c => {
      pagar(c.v, preco(c.v, 280));
      const r = rngDe(c.v.id, 'caso', c.p.id, c.v.t, 'encontro');
      const rom = c.vin.romance!;
      rom.envolvimento = clamp(rom.envolvimento + 5);
      c.vin.tUltimoContato = c.v.t;
      const lugar = um(r, ['um hotel no centro, pago em dinheiro', `o apartamento de um amigo de ${c.p.nome}`, 'o carro, numa rua sem saída', 'um restaurante do outro lado da cidade']);
      const quase = r.next() < 0.18;
      if (quase) rastro(c.v, c.p.id, 1);
      c.v.mente.estresse = clamp(c.v.mente.estresse + (quase ? 6 : 2));
      return { resultado: `${lugar.replace(/^./, x => x.toUpperCase())}. Duas horas que pareceram dez minutos.${quase ? ` Na saída, alguém conhecido passou do outro lado da rua — você não sabe se viu.` : ''}${tem(c.p, 'ciumento') ? ` ${c.p.nome} perguntou de novo de ${quemEspera(c)}.` : ''}` };
    }
  },
  {
    id: 'caso_presente',
    quando: caso,
    disponivel: c => vereditoDePagar(c.v, preco(c.v, 450), 'Custa'),
    rotulo: c => `Dar um presente a ${c.p.nome}`,
    executar: c => {
      pagar(c.v, preco(c.v, 450));
      const r = rngDe(c.v.id, 'caso', c.p.id, c.v.t, 'presente');
      c.vin.romance!.envolvimento = clamp(c.vin.romance!.envolvimento + 4);
      lembrarCom(c.v, c.p.id, 'O presente escondido.', 'presente', 1);
      const cartao = r.next() < 0.35;
      if (cartao) rastro(c.v, c.p.id, 2);
      return { resultado: `${um(r, ['Um perfume', 'Um relógio discreto', 'Um livro com dedicatória', 'Um colar fino'])} para ${c.p.nome}.${cartao ? ` Pago no cartão — a fatura chega em casa no mês que vem.` : ' Pago em dinheiro, sem rastro.'}${tem(c.p, 'egoista') ? ` ${c.p.nome} já disse o que quer da próxima vez.` : ''}` };
    }
  },
  {
    id: 'caso_viagem',
    quando: c => caso(c) && c.eu >= 20,
    disponivel: c => { if (c.v.fatos[`caso_viagem_${c.p.id}`] !== undefined && c.v.t - c.v.fatos[`caso_viagem_${c.p.id}`] < 12) return bloqueio('incompativel', 'Uma viagem dessas por ano já é arriscado demais.'); return vereditoDePagar(c.v, preco(c.v, 2200), 'A viagem custa uns'); },
    rotulo: c => `Viajar com ${c.p.nome} inventando um compromisso`,
    executar: c => {
      pagar(c.v, preco(c.v, 2200));
      c.v.fatos[`caso_viagem_${c.p.id}`] = c.v.t;
      const r = rngDe(c.v.id, 'caso', c.p.id, c.v.t, 'viagem');
      c.vin.romance!.envolvimento = clamp(c.vin.romance!.envolvimento + 8);
      rastro(c.v, c.p.id, 2);
      lembrarCom(c.v, c.p.id, 'A viagem escondida.', 'romance', 2);
      const desculpa = um(r, ['um congresso', 'um curso de fim de semana', 'uma visita a um parente doente', 'trabalho fora da cidade']);
      const furo = r.next() < 0.25;
      return { resultado: `Três dias fora, com a desculpa de ${desculpa}. ${furo ? `${quemEspera(c)} ligou na hora errada e você inventou mais do que devia. A história tem um furo.` : 'Ninguém desconfiou — por enquanto.'}${tem(c.p, 'carinhoso') ? ` ${c.p.nome} chorou na volta: queria que fosse sempre assim.` : ''}` };
    }
  },
  {
    // VIDA 12.7: a demonstração de afeto do dia a dia de um caso — a mensagem, a foto, o áudio. De graça, e com rastro.
    id: 'caso_carinho',
    quando: caso,
    disponivel: c => (c.v.fatos[`caso_carinho_${c.p.id}`] !== undefined && c.v.t - c.v.fatos[`caso_carinho_${c.p.id}`] < 2 ? bloqueio('incompativel', 'Você mandou faz pouco: mensagem demais deixa rastro demais.') : PERMITIDO),
    rotulo: c => `Mandar um carinho para ${c.p.nome}`,
    executar: c => {
      c.v.fatos[`caso_carinho_${c.p.id}`] = c.v.t;
      const r = rngDe(c.v.id, 'caso', c.p.id, c.v.t, 'carinho');
      const rom = c.vin.romance!;
      rom.envolvimento = clamp(rom.envolvimento + 3);
      c.vin.tUltimoContato = c.v.t;
      const apagou = r.next() < 0.8;
      if (!apagou) rastro(c.v, c.p.id, 1);
      const msg = semRepetir(c, 'caso_carinho', r, [
        `Um áudio de vinte segundos para ${c.p.nome}, gravado no carro.`,
        `Uma foto do pôr do sol com "lembrei de você" para ${c.p.nome}.`,
        `Uma mensagem às duas da manhã: "não consigo parar de pensar".`,
        `Um bilhete escondido no bolso do casaco de ${c.p.nome}.`
      ]);
      const volta = tem(c.p, 'carinhoso') ? ` ${c.p.nome} respondeu na hora, com três corações.` : tem(c.p, 'ciumento') ? ` ${c.p.nome} respondeu perguntando onde você estava.` : ` ${c.p.nome} respondeu horas depois, curto e quente.`;
      return { resultado: `${msg}${volta}${apagou ? ' Você apagou a conversa.' : ' Você esqueceu de apagar a conversa.'}` };
    }
  },
  {
    id: 'caso_futuro',
    quando: c => caso(c) && c.v.t - (c.vin.romance?.tInicio ?? c.v.t) >= 6,
    rotulo: c => `Conversar com ${c.p.nome} sobre o que vocês são`,
    executar: c => {
      const rom = c.vin.romance!;
      const quer = rom.envolvimento >= 60 || tem(c.p, 'ciumento');
      const r = rngDe(c.v.id, 'caso', c.p.id, c.v.t, 'futuro');
      const eu = flex(c.v.eu.genero, 'o', 'a', 'e');
      if (quer) {
        c.v.fatos[`caso_ultimato_${c.p.id}`] ??= c.v.t;
        c.vin.tensao = clamp(c.vin.tensao + 6);
        // VIDA 12.7: a mesma decisão, dita de jeitos diferentes (e nunca a mesma frase duas vezes seguidas).
        return { resultado: semRepetir(c, 'caso_futuro_quer', r, [
          `${c.p.nome} foi direto ao ponto: não quer mais ser segredo. "Ou você conta, ou a gente para." A decisão vai ter que vir.`,
          `${c.p.nome} chorou no meio da frase: está cansad${flex(c.p.genero, 'o', 'a', 'e')} de ser a pessoa do horário vago. Quer um nome, um endereço, um domingo.`,
          `"Eu não vou passar mais um Natal sozinh${flex(c.p.genero, 'o', 'a', 'e')} esperando mensagem." ${c.p.nome} quer uma resposta até o fim do mês.`,
          `${c.p.nome} falou em ir embora com você — outra cidade, começar do zero. Disse que não pergunta de novo.`
        ]) };
      }
      rom.envolvimento = clamp(rom.envolvimento - 4);
      return { resultado: semRepetir(c, 'caso_futuro_leve', r, [
        `${c.p.nome} disse que está bem assim, sem planos — e você não soube se ficou aliviad${eu} ou decepcionad${eu}.`,
        `${c.p.nome} riu: "a gente não é nada, e é ótimo". Mudou de assunto antes que você respondesse.`,
        `${c.p.nome} disse que tem a vida dele${c.p.genero === 'feminino' ? 'a' : ''} e não quer trocar. Vocês combinaram não combinar nada.`
      ]) };
    }
  },
  {
    id: 'caso_tempo',
    quando: caso,
    rotulo: c => `Pedir um tempo a ${c.p.nome}`,
    executar: c => {
      const rom = c.vin.romance!;
      const r = rngDe(c.v.id, 'caso', c.p.id, c.v.t, 'tempo');
      rom.envolvimento = clamp(rom.envolvimento - 15);
      c.vin.tensao = clamp(c.vin.tensao + (tem(c.p, 'temperamental') ? 14 : 6));
      if (tem(c.p, 'temperamental') && r.next() < 0.4) { rastro(c.v, c.p.id, 2); return { resultado: `${c.p.nome} não aceitou bem. Ameaçou contar tudo — depois mandou mensagem pedindo desculpas. O risco ficou no ar.` }; }
      return { resultado: tem(c.p, 'paciente') ? `${c.p.nome} entendeu. "Quando quiser, eu tô aqui."` : `${c.p.nome} ficou em silêncio e foi embora sem se despedir.` };
    }
  }
];

export const GRUPOS_126 = { prometer: 'planos', caso_carinho: 'romance', caso_encontro: 'romance', caso_presente: 'romance', caso_viagem: 'romance', caso_futuro: 'romance', caso_tempo: 'romance' } as const;

/** Para quem vem do ano: as promessas. (Os demais efeitos do jeito acontecem na hora de cada interação.) */
export function processarJeito(v: Vida): void {
  conferirPromessas(v);
}
