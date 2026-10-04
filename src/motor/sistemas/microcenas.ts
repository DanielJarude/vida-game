/**
 * MICROCENAS (FIX pós-playtest humano): "ir ao cinema com a Yua" não é uma barra que sobe — é uma noite que aconteceu.
 *
 *   AÇÃO → CONTEXTO → TIPO DE EXPERIÊNCIA → REAÇÃO DA PESSOA/DO MUNDO → CONSEQUÊNCIA → TEXTO → MEMÓRIA (quando importa)
 *
 * O que varia é o ACONTECIMENTO, não o sinônimo: gostaram muito; discordaram do filme; a conversa séria na volta; a
 * pessoa contou algo de si (o fato entra no que você sabe — `conhecimento`); o que você já sabia dela voltou à conversa
 * (a cidade onde nasceu); encontraram um conhecido; um mico; o dinheiro curto na hora de pagar; a pessoa distante;
 * a piada que vira de vocês; a briga; a noite em que a amizade subiu de nível; a faísca (um sinal de interesse que
 * abre o caminho do romance — `interacoes.demonstrar_interesse`). E a noite comum e boa, que é a maioria das noites.
 *
 * O que decide: como foi (afinidade, jeito, tensão, sorte — `juntos.comoFoi`), a idade, o tipo de relação, o que você
 * sabe dela e o que falta saber, o dinheiro, quem mais mora na cidade, o histórico de vocês naquele programa.
 *
 * ANTIRREPETIÇÃO, compacta: cada vínculo guarda os TIPOS das últimas 4 cenas (`Vinculo.cenas`, ids curtos — nunca o
 * texto). O tipo da última cena com a mesma pessoa não se repete; os das 4 últimas pesam pouco. A biografia (Linha da
 * Vida) recebe só o que é biografia: uma revelação, a amizade que mudou de nível, a briga que marcou. O resto vive na
 * história de vocês (`lembrarCom`) só quando vale lembrar — a noite comum não vira registro.
 *
 * O sorteio da cena é derivado (`rngDe`): não consome o acaso do resto da vida.
 */
import { clamp, rngDe, type Rng } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import type { CtxI } from './interacoes';
import { escrever, idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { flex } from '../texto';
import { municipio, existeMunicipio } from '../dados/lugares';
import { fraseDoSaber, pendentes, revelar, saberes } from './conhecimento';
import { atraiGenero, interesseInicial, regraDeIdade } from './romance';
import { seguranca } from './dinheiro';

export type TipoDeCena =
  | 'comum' | 'adorou' | 'discordaram' | 'conversa_seria' | 'revelacao' | 'lembranca' | 'encontro' | 'mico'
  | 'dinheiro_curto' | 'distante' | 'piada' | 'briga' | 'aproximou' | 'faisca' | 'pergunta';
export type ComoFoi = 'otimo' | 'bom' | 'morno' | 'ruim';

/** O programa, como cena: o que é, onde, quando volta, o que se discute, os detalhes do lugar. */
export interface ProgramaDeCena {
  id: string;
  /** "o filme", "o show", "o jogo". */
  oque: string;
  /** "no cinema", "no estádio". */
  onde: string;
  /** "na saída do cinema", "na volta". */
  depois: string;
  /** Uma noite comum ali (variações do LUGAR, não do sentimento). */
  comum: string[];
  /** O ponto alto (ótimo) — o texto próprio do programa. */
  alto: (nome: string) => string;
  /** O ruim — o texto próprio do programa. */
  ruim: (nome: string) => string;
  /** O que dá para discordar: [o que a pessoa achou, o que você achou]. */
  discordia?: [string, string][];
  /** Os micos DESTE lugar (o garçom é do restaurante, não do cinema). */
  mico?: string[];
  /** Programas com criança pequena (ip ≤ 11) usam o repertório de criança. */
  infantil?: boolean;
  /** Pago: a cena do dinheiro curto pode acontecer. */
  pago?: boolean;
}

export interface CenaVivida { tipo: TipoDeCena; texto: string; titulo: string }

/** As marcas das últimas cenas ("comum.2" = a noite comum de variação 2): o tipo antes do ponto. */
const marcas = (vin: Vinculo) => vin.cenas ?? [];
const ultimas = (vin: Vinculo) => marcas(vin).map(x => x.split('.')[0]);
const lembrar = (vin: Vinculo, marca: string) => { vin.cenas = [...marcas(vin), marca].slice(-4); };
const afeto = (c: CtxI, n: number) => { c.vin.proximidade = clamp(Math.round(c.vin.proximidade + n)); };
const confiar = (c: CtxI, n: number) => { c.vin.confianca = clamp(Math.round(c.vin.confianca + n)); };
const tensao = (c: CtxI, n: number) => { c.vin.tensao = clamp(Math.round(c.vin.tensao + n)); };
const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const Ele = (p: Pessoa) => flex(p.genero, 'Ele', 'Ela', 'Elu');

/** A faísca: pode acontecer entre amigos (nunca família, nunca criança), quando os dois poderiam — e a outra pessoa
 *  REALMENTE tem algum interesse (o sinal é verdadeiro: o mundo não mente para o jogador). */
function faiscaPossivel(c: CtxI): boolean {
  if (c.p.especie || c.vin.parentesco || c.vin.romance || c.p.parceiroId) return false;
  if (!['amigo', 'amigo_proximo', 'colega', 'conhecido'].includes(c.papel)) return false;
  const g = regraDeIdade(c.eu, c.ip).grau;
  if (g !== 'permitido') return false;
  if (Object.values(c.v.vinculos).some(x => x.romance && x.pessoaId !== c.p.id && ['namoro', 'morando_junto', 'casamento'].includes(x.romance.estagio))) return false;
  if (c.v.eu.atracao && !atraiGenero(c.v.eu.atracao, c.p.genero)) return false;
  if (!atraiGenero(c.p.atracao, c.v.eu.genero)) return false;
  return interesseInicial(c.v, c.p) + c.vin.proximidade * 0.25 - 10 >= 42;
}

/** Um conhecido em comum que mora na cidade (para "encontraram alguém"). */
function conhecidoNaCidade(c: CtxI, r: Rng): Pessoa | undefined {
  const lista = vinculosVivos(c.v).filter(x => x.p.id !== c.p.id && !x.p.especie && x.p.municipioId === c.v.moradia.municipioId && !x.vin.convivio.includes('casa')
    && ['amigo', 'colega', 'conhecido', 'amigo_proximo'].includes(x.vin.estagio ?? '') && idadePessoa(c.v, x.p) >= 10);
  return lista.length ? r.pick(lista).p : undefined;
}

/** De que a pessoa pode falar a sério (o que está acontecendo na vida dela — do motor, não inventado). */
function assuntoSerio(c: CtxI): string {
  const p = c.p;
  if (p.aperto && c.v.t - p.aperto.t <= 24) return p.aperto.tipo === 'luto' ? 'a falta que alguém faz' : p.aperto.tipo === 'separacao' ? 'o fim do relacionamento' : p.aperto.tipo === 'desemprego' ? 'o emprego que perdeu' : 'uma fase difícil';
  if (c.ip < 18) return c.ip < 13 ? 'uma briga na escola que ninguém tinha percebido' : 'o que quer fazer depois da escola';
  if (p.ocupacao && p.ocupacao !== 'estudante') return `o trabalho — ${p.ocupacao} — e se é isso mesmo que quer`;
  if (p.estudo) return `o curso de ${p.estudo.curso} e o medo de ter escolhido errado`;
  return 'a família, e uma coisa que nunca tinha contado a ninguém';
}

/** A cidade onde a pessoa nasceu, se você SABE (o que volta à conversa com o tempo). */
function origemSabida(c: CtxI): string | undefined {
  const s = saberes(c.v, c.p, c.vin).find(x => x.k === 'origem');
  if (!s || !existeMunicipio(s.v) || s.v === c.v.moradia.municipioId) return undefined;
  return municipio(s.v).nome;
}

/**
 * Viver a cena: escolhe o tipo (pelo contexto, sem repetir o último com a mesma pessoa), aplica a consequência
 * (em cima do efeito-base do programa, que o chamador já aplicou), escreve o texto e decide o que vira memória.
 */
export function viverCena(c: CtxI, foi: ComoFoi, prog: ProgramaDeCena, n: number): CenaVivida {
  const r = rngDe(c.v.id, 'cena', c.p.id, c.v.t, prog.id, n, ultimas(c.vin).join(','));
  const nome = c.p.nome;
  const crianca = !!prog.infantil && c.ip <= 11;
  const falta = !c.p.especie && !crianca ? pendentes(c.v, c.p, c.vin) : [];
  const origem = !crianca ? origemSabida(c) : undefined;
  const conhecido = r.chance(0.6) ? conhecidoNaCidade(c, r) : undefined;
  const apertado = !!prog.pago && c.eu >= 18 && c.v.financas.conta < 2000 && ['apertado', 'no_vermelho'].includes(seguranca(c.v).nivel);
  const fechada = c.p.temperamento.afabilidade < -0.25 || c.p.temperamento.extroversao < -0.4;
  const jaFizeram = (c.vin.habitos?.[prog.id] ?? n) >= 2;
  const amizadeSubindo = ['colega', 'conhecido', 'amigo'].includes(c.papel) && c.vin.proximidade < 70;

  const pesos: Partial<Record<TipoDeCena, number>> = {};
  const p = (t: TipoDeCena, w: number) => { if (w > 0) pesos[t] = (pesos[t] ?? 0) + w; };
  if (crianca) {
    if (foi === 'otimo' || foi === 'bom') { p('adorou', foi === 'otimo' ? 3 : 1.2); p('comum', 2); p('pergunta', 1.4); }
    else { p('mico', 2); p('comum', 1); }
    if (conhecido) p('encontro', 0.6);
  } else if (foi === 'otimo') {
    p('adorou', 3); p('conversa_seria', 1.2);
    if (falta.length) p('revelacao', 2.2);
    if (origem) p('lembranca', 1.4);
    if (jaFizeram) p('piada', 1.8);
    if (amizadeSubindo) p('aproximou', 1.6);
    if (faiscaPossivel(c)) p('faisca', 1.4);
  } else if (foi === 'bom') {
    p('comum', 3); p('conversa_seria', 1.2); p('discordaram', prog.discordia ? 1.2 : 0); p('mico', 0.7);
    if (falta.length) p('revelacao', 1.8);
    if (origem) p('lembranca', 1.2);
    if (conhecido) p('encontro', 1);
    if (faiscaPossivel(c)) p('faisca', 0.6);
  } else if (foi === 'morno') {
    p('comum', 1.4); p('discordaram', prog.discordia ? 2 : 0); p('mico', 1); p('distante', fechada ? 2 : 0.8);
    if (apertado) p('dinheiro_curto', 2.2);
    if (conhecido) p('encontro', 0.8);
  } else {
    p('briga', 3); p('distante', 1.4);
    if (apertado) p('dinheiro_curto', 1.2);
  }
  // Antirrepetição: o tipo da última cena com esta pessoa não volta; os das últimas quatro, quase não.
  const recentes = ultimas(c.vin);
  for (const t of Object.keys(pesos) as TipoDeCena[]) {
    if (recentes[recentes.length - 1] === t) pesos[t] = 0;
    else if (recentes.includes(t)) pesos[t]! *= 0.3;
  }
  const tipos = (Object.keys(pesos) as TipoDeCena[]).filter(t => pesos[t]! > 0);
  const tipo: TipoDeCena = r.weighted(tipos, t => pesos[t]!) ?? (foi === 'ruim' ? 'distante' : 'comum');
  // A noite comum também não repete a mesma variação das últimas cenas (guardada na marca: "comum.1").
  const usadas = new Set(marcas(c.vin).filter(x => x.startsWith('comum.')).map(x => Number(x.split('.')[1])));
  const livres = prog.comum.map((_x, k) => k).filter(k => !usadas.has(k));
  const variacao = tipo === 'comum' ? (livres.length ? livres[(n + r.int(0, 2)) % livres.length] : n % prog.comum.length) : 0;
  lembrar(c.vin, tipo === 'comum' ? `comum.${variacao}` : tipo);
  const titulo = tituloDe(prog, nome);

  switch (tipo) {
    case 'adorou': {
      // O ponto alto do programa uma vez; depois, outros picos (acontecimentos diferentes, não o mesmo dito de outro jeito).
      if (!recentes.slice(0, -1).includes('adorou')) return { tipo, titulo, texto: prog.alto(nome) };
      const picos = crianca
        ? [`${nome} contou o dia inteiro para quem quisesse ouvir — e para quem não quisesse.`, `Na volta, ${nome} pediu para fazerem aquilo "todo dia, para sempre".`]
        : [`Ficaram até fecharem o lugar e ainda esticaram na calçada. ${nome} disse que fazia tempo que não ria assim.`, `Uma foto torta de vocês dois ${prog.onde} virou o fundo de tela de ${nome}.`, `Ali mesmo, ${prog.onde}, nasceu o plano da próxima — com data marcada, coisa rara.`];
      return { tipo, titulo, texto: picos[n % picos.length] };
    }
    case 'comum':
      return { tipo, titulo, texto: prog.comum[variacao].replace(/\{nome\}/g, nome) };
    case 'pergunta': {
      afeto(c, 2);
      const q = r.pick([`por que o céu fica laranja no fim da tarde`, `se os peixes dormem`, `quantos anos você tinha quando era criança`, `por que adulto não brinca mais`, `de onde vem o vento`]);
      return { tipo, titulo, texto: `${cap(prog.onde)}, do nada, ${nome} parou e perguntou ${q}. Vocês ficaram um tempão inventando a resposta.` };
    }
    case 'discordaram': {
      const [dela, sua] = r.pick(prog.discordia!);
      afeto(c, 1);
      if (c.p.temperamento.afabilidade < -0.2) tensao(c, 2);
      return { tipo, titulo, texto: `${cap(prog.depois)}, a discussão: ${nome} ${dela}; você ${sua}. Ninguém mudou de ideia — ${c.p.temperamento.afabilidade < -0.2 ? 'e o caminho de volta foi meio calado' : 'e foi o melhor da noite'}.` };
    }
    case 'conversa_seria': {
      confiar(c, 4); afeto(c, 2);
      const assunto = assuntoSerio(c);
      if (c.vin.historia.filter(h => h.tipo === 'apoio').length < 3) lembrarCom(c.v, c.p.id, `${cap(prog.depois)}, ${nome} falou de ${assunto}. Você ouviu.`, 'apoio', 1);
      return { tipo, titulo, texto: r.chance(0.5)
        ? `${cap(prog.depois)}, ${nome} ficou quiet${flex(c.p.genero, 'o', 'a', 'e')} um tempo — e acabou falando de ${assunto}. Você mais ouviu do que falou. ${Ele(c.p)} agradeceu na despedida.`
        : `O programa era o de menos: ${prog.depois}, a conversa foi parar em ${assunto}. ${nome} disse que não falava disso com quase ninguém.` };
    }
    case 'revelacao': {
      const k = falta[0];
      const s = revelar(c.v, c.p, c.vin, k);
      confiar(c, 3); afeto(c, 2);
      const frase = s ? fraseDoSaber(c.v, c.p, s) : '';
      if (s) lembrarCom(c.v, c.p.id, frase, 'descoberta', 1);
      const abre = r.pick([`${cap(prog.depois)}, entre uma coisa e outra, ${nome} contou de si o que você não sabia.`, `Foi ${prog.onde.replace(/^n(o|a)/, 'n$1')}, do nada: uma pergunta sua puxou uma história de ${nome} que você nunca tinha ouvido.`, `${nome} estava falante. ${cap(prog.depois)}, você ficou sabendo mais em uma hora do que em anos.`]);
      return { tipo, titulo, texto: `${abre} ${frase}` };
    }
    case 'lembranca': {
      afeto(c, 3);
      return { tipo, titulo, texto: `${cap(prog.onde)}, alguma coisa lembrou ${origem} — e ${nome} desandou a contar de lá: a rua onde cresceu, a comida que não acha por aqui, quem ficou. Você já sabia que ${ele(c.p)} era de ${origem}; agora sabe como era.` };
    }
    case 'encontro': {
      const o = conhecido!;
      const vo = c.v.vinculos[o.id];
      if (vo) { vo.tUltimoContato = c.v.t; vo.proximidade = clamp(vo.proximidade + 2); }
      const junta = r.chance(0.5);
      return { tipo, titulo, texto: junta ? `${cap(prog.onde)}, deram de cara com ${o.nome}. Acabou ${prog.oque === 'o jantar' ? 'puxando uma cadeira' : 'ficando junto'} — e ${nome} e ${o.nome} descobriram que tinham mais em comum do que imaginavam.` : `${cap(prog.onde)}, ${o.nome} acenou de longe. ${nome} quis saber de onde vocês se conhecem; a história rendeu a volta inteira.` };
    }
    case 'mico': {
      afeto(c, crianca ? 1 : 2);
      const txt = crianca
        ? r.pick([`${nome} fez birra na saída e só parou com a promessa de um sorvete. Você cedeu. Todo mundo cede.`, `${nome} derrubou o lanche inteiro no chão e chorou como se fosse o fim do mundo. Cinco minutos depois, já ria.`])
        : r.pick([...(prog.mico ?? []).map(x => x.replace(/\{nome\}/g, nome)), `Você tropeçou ${prog.onde.replace(/^n(o|a)/, (_m, a) => `n${a}`)} na frente de todo mundo. ${nome} riu até chorar — e prometeu não contar a ninguém (contou).`, `O celular de alguém tocou na hora errada. Era o seu.`]);
      return { tipo, titulo, texto: txt };
    }
    case 'dinheiro_curto': {
      tensao(c, 1); confiar(c, 1);
      return { tipo, titulo, texto: `Na hora de pagar, o cartão não passou. ${nome} cobriu a sua parte sem fazer cena — "a próxima é sua". Ficou um incômodo pequeno, seu, no caminho de volta.` };
    }
    case 'distante': {
      // A distância é notada: fica um incômodo (pequeno) — e a vontade de perguntar de novo.
      tensao(c, 2);
      return { tipo, titulo, texto: r.chance(0.5) ? `${nome} estava em outro lugar: o celular na mão, a cabeça longe. Você perguntou se estava tudo bem; ${ele(c.p)} disse que sim. Não parecia.` : `${nome} chegou atrasad${flex(c.p.genero, 'o', 'a', 'e')}, respondeu tudo com uma palavra e foi embora cedo. Alguma coisa está acontecendo — e não foi hoje que ${ele(c.p)} contou.` };
    }
    case 'piada': {
      afeto(c, 3);
      const ja = c.vin.historia.some(h => h.tipo === 'ritual' && h.texto.startsWith('A piada'));
      if (!ja) lembrarCom(c.v, c.p.id, `A piada de vocês, que nasceu ${prog.onde}: ninguém mais entende.`, 'ritual', 2);
      return { tipo, titulo, texto: `${cap(prog.onde)}, aconteceu de novo a coisa que sempre acontece com vocês dois — e agora é piada oficial. Basta um olhar para os dois rirem.` };
    }
    case 'briga': {
      tensao(c, 4);
      if (c.vin.tensao >= 60) {
        lembrarCom(c.v, c.p.id, `A briga ${prog.onde}: palavras que ficaram.`, 'conflito', 2);
        escrever(c.v, { texto: `Uma briga feia com ${nome}, ${prog.onde}. Ficou entre vocês por um tempo.`, relevancia: 'cotidiano', tema: 'amizade', tom: 'ruim', pessoas: [c.p.id] });
      }
      return { tipo, titulo, texto: r.chance(0.6) ? prog.ruim(nome) : `Uma bobagem — quem escolheu o lugar, quem se atrasou — virou discussão ${prog.onde}. ${nome} disse uma coisa que ficou.` };
    }
    case 'aproximou': {
      afeto(c, 5); confiar(c, 3);
      const de = c.papel === 'colega' ? `só ${flex(c.p.genero, 'o colega', 'a colega', 'colega')}` : c.papel === 'conhecido' ? 'um conhecido' : 'mais um amigo';
      lembrarCom(c.v, c.p.id, `A noite em que ${nome} deixou de ser ${de}.`, 'amizade', 2);
      if (c.papel !== 'amigo') escrever(c.v, { texto: `${cap(prog.oque.replace(/^(o|a) /, ''))} com ${nome}: a noite em que a amizade começou de verdade.`, relevancia: 'cotidiano', tema: 'amizade', tom: 'bom', pessoas: [c.p.id] });
      return { tipo, titulo, texto: `Foi a noite em que ${nome} deixou de ser ${de}: vocês combinaram a próxima antes de ir embora — e ${ele(c.p)} mandou mensagem quando chegou em casa.` };
    }
    case 'faisca': {
      c.v.fatos[`faisca:${c.p.id}`] = c.v.t;
      afeto(c, 2);
      return { tipo, titulo, texto: r.pick([
        `Na despedida, um abraço que durou um segundo a mais. ${nome} riu, sem graça, e foi embora olhando para trás. Você ficou pensando nisso o caminho todo.`,
        `${cap(prog.onde)}, ${nome} encostou o ombro no seu e não tirou. Nenhum dos dois comentou — e os dois perceberam.`,
        `${nome} mandou mensagem quando chegou em casa: "foi bom demais hoje". Você leu umas cinco vezes.`
      ]) };
    }
  }
  return { tipo: 'comum', titulo, texto: prog.comum[0].replace(/\{nome\}/g, nome) };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function tituloDe(prog: ProgramaDeCena, nome: string): string {
  return `${cap(prog.oque.replace(/^(o|a) /, ''))} com ${nome}`;
}
/** O fato da faísca ainda vale (dois anos)? */
export const faiscaRecente = (v: Vida, pessoaId: string) => { const t = v.fatos[`faisca:${pessoaId}`]; return t !== undefined && v.t - t <= 24; };
