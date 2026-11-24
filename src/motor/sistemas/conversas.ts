/**
 * REWORK 7.5 — conversar, passar um tempo, demonstrar carinho, agradecer: com CONTEXTO, MEMÓRIA e VARIEDADE.
 *
 * Antes, cada uma dessas ações escolhia a próxima frase de uma lista em rodízio (`variar`), a mesma para qualquer
 * pessoa daquele papel — e "agradecer" ao pai afirmava uma ajuda que nunca tinha acontecido. Agora cada ação é uma
 * FAMÍLIA DE SITUAÇÕES, e cada situação diz quando pode acontecer (a condição de elegibilidade é explícita) e de onde
 * tira o que diz:
 *
 *   · do HISTÓRICO REAL da relação (um marco de vocês: "lembraram de 2009, quando…") — nunca inventado;
 *   · da VIDA DA PESSOA (a trajetória dela, o aperto que ela atravessa, o que ainda não se sabe dela);
 *   · da SUA VIDA (o marco do seu último ano: o trabalho novo, a casa, a perda);
 *   · do ESTADO DO LAÇO (atrito, afeto, envolvimento, a idade de cada um, o temperamento dela).
 *
 * O que muda é a ESTRUTURA da cena (uma conversa importante, um silêncio confortável, uma farpa, uma lembrança, um
 * encontro no caminho, um passeio comum), não sinônimos. A mesma cena não se repete em seguida com a mesma pessoa
 * (as últimas quatro ficam em `vin.cenas`, com o prefixo da ação), e a de uma vez atrás pesa menos. Muitas vezes o
 * resultado é discreto — um passeio comum é um passeio comum —, e só o que importa entra na história de vocês (um
 * conselho recebido, uma preocupação confiada, um mal-entendido); nada de cada passeio virar marco.
 *
 * A variação vem de um sorteio PRÓPRIO (a vida, a pessoa, o ano, a vez): nenhuma frase gasta o sorteio principal.
 */

import { clamp, rngDe, type Rng } from '../rng';
import type { Entrada, Marco, Pessoa, Vida } from '../tipos';
import { lembrarCom, marcarCena } from '../nucleo';
import { flex } from '../texto';
import { anoDe } from '../tempo';
import { compatibilidade } from './social';
import { cenaDaDescoberta, fraseDoSaber, pendentes, revelar } from './conhecimento';
import { assuntoDaConversa29, esclarecer29 } from './boatos29';
import type { CtxI } from './interacoes';

/* ------------------------------------------------------------- Efeitos */

const afeto = (c: CtxI, n: number) => { c.vin.proximidade = clamp(Math.round(c.vin.proximidade + n)); };
const confiar = (c: CtxI, n: number) => { c.vin.confianca = clamp(Math.round(c.vin.confianca + n)); };
const atrito = (c: CtxI, n: number) => { c.vin.tensao = clamp(Math.round(c.vin.tensao + n)); };
const envolver = (c: CtxI, n: number) => { if (c.vin.romance) c.vin.romance.envolvimento = clamp(Math.round(c.vin.romance.envolvimento + n)); };

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const Ele = (p: Pessoa) => flex(p.genero, 'Ele', 'Ela', 'Elu');
const dele = (p: Pessoa) => flex(p.genero, 'dele', 'dela', 'delu');
const _o = (p: Pessoa, m: string, f: string, n: string) => flex(p.genero, m, f, n);
const g = (c: CtxI, m: string, f: string, n?: string) => flex(c.v.eu.tratamento ?? c.v.eu.genero, m, f, n ?? f);
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const semPonto = (s: string) => s.replace(/[.!]+$/, '');
/** "de" + artigo: "da separação", "dos exames", "de uma fase difícil". */
const contrair = (s: string) => s.replace(/^(a|o|as|os) /, (_m, art: string) => `d${art} `).replace(/^(?!d[aos]{1,2} )/, 'de ');

/* ------------------------------------------------- O que a relação tem de real */

/** Um marco de vocês que vale lembrar: importante, de pelo menos dois anos atrás, que não seja briga nem perda. */
export function lembrancaDeVoces(c: CtxI): Marco | undefined {
  const bons = c.vin.historia.filter(h => (h.peso ?? 1) >= 2 && c.v.t - h.t >= 24 && h.tipo !== 'conflito' && h.tipo !== 'perda' && h.tipo !== 'traicao' && h.tipo !== 'distancia' && h.tipo !== 'descoberta' && !/^Morreu/.test(h.texto));
  if (!bons.length) return undefined;
  // A mesma lembrança não volta na conversa seguinte (a última lembrada fica na marca da cena).
  const ultima = (c.vin.cenas ?? []).map(x => x.split('@')[1]).filter(Boolean).pop();
  const pool = bons.filter(h => String(h.t) !== ultima);
  return (pool.length ? pool : bons)[(c.vin.habitos?.lembrar ?? 0) % (pool.length || bons.length)];
}

/** A novidade da vida da pessoa (o que a trajetória dela registrou no último ano e meio). */
function novidadeDela(c: CtxI): { t: number; texto: string } | undefined {
  const t = c.p.vida?.trajetoria ?? [];
  return [...t].reverse().find(x => c.v.t - x.t <= 18 && x.tipo !== 'perda');
}

/** A sua novidade (um marco do último ano, que não seja técnico). */
function suaNovidade(c: CtxI): Entrada | undefined {
  for (let k = c.v.biografia.length - 1; k >= 0; k--) {
    const e = c.v.biografia[k];
    if (c.v.t - e.t > 12) break;
    if (e.relevancia === 'marco' && e.tema !== 'nascimento' && !(e.pessoas ?? []).includes(c.p.id)) return e;
  }
  return undefined;
}

const SOBRE_O_TEMA: Partial<Record<Entrada['tema'], string>> = {
  trabalho: 'do trabalho', estudo: 'dos estudos', escola: 'da escola', casa: 'da casa', lugar: 'da mudança',
  amor: 'de quem anda na sua vida', filhos: 'das crianças', dinheiro: 'das contas', saude: 'da saúde', perda: 'da perda', familia: 'da família'
};

/** O aperto que a pessoa atravessa, em palavras (o que ela conta quando confia). */
function apertoEmPalavras(c: CtxI): string | undefined {
  const a = c.p.aperto;
  if (!a || a.resolvido || c.v.t - a.t > 24) return undefined;
  switch (a.tipo) {
    case 'desemprego': return 'a procura de trabalho, que não anda';
    case 'separacao': return 'a separação';
    case 'doenca': return 'os exames, a saúde';
    case 'dinheiro': return 'as contas que não fecham';
    case 'luto': { const x = a.pessoaId ? c.v.pessoas[a.pessoaId] : undefined; return x ? `a falta de ${x.nome}` : 'a perda'; }
    default: return 'uma fase difícil';
  }
}

/* ----------------------------------------------------------- O motor de cenas */

interface Cena {
  id: string;
  /** Quando esta situação é possível com esta pessoa, agora. */
  quando: (c: CtxI) => boolean;
  peso: (c: CtxI) => number;
  /** Vive a cena: aplica o que ela muda e devolve o texto (e a marca extra, para não repetir a mesma lembrança). */
  viver: (c: CtxI, r: Rng, ultima?: string) => { texto: string; marca?: string };
}

/** Escolhe uma variante que não seja a da última vez desta cena com esta pessoa (a marca guarda o índice). */
function variante(r: Rng, opcoes: string[], ultima?: string): { texto: string; marca: string } {
  const livres = opcoes.map((_, k) => k).filter(k => String(k) !== ultima);
  const k = r.pick(livres.length ? livres : [0]);
  return { texto: opcoes[k], marca: String(k) };
}

/** As marcas das últimas cenas desta ação com esta pessoa ("conv:lembranca@1234"). */
const ultimasDa = (c: CtxI, acao: string) => (c.vin.cenas ?? []).filter(x => x.startsWith(`${acao}:`)).map(x => x.slice(acao.length + 1).split('@')[0]);

/**
 * Escolhe e vive UMA situação da família: só as elegíveis; a última vivida com esta pessoa não se repete; as outras
 * recentes pesam um terço. Devolve o texto; a marca fica em `vin.cenas` (as quatro últimas, de todas as cenas).
 */
export function viverSituacao(c: CtxI, acao: string, cenas: Cena[], vez: number): { id: string; texto: string } {
  const r = rngDe(c.v.id, 'conversa', c.p.id, c.v.t, acao, vez, (c.vin.cenas ?? []).join(','));
  const recentes = ultimasDa(c, acao);
  const ultima = recentes[recentes.length - 1];
  const elegiveis = cenas.filter(x => x.quando(c));
  const pesadas = elegiveis.map(x => ({ x, p: x.id === ultima && elegiveis.length > 1 ? 0 : x.peso(c) * (recentes.includes(x.id) ? 0.33 : 1) }));
  const escolhida = (pesadas.some(x => x.p > 0) ? r.weighted(pesadas.filter(x => x.p > 0), x => x.p) : pesadas[0])!.x;
  const ultimaDela = (c.vin.cenas ?? []).filter(x => x.startsWith(`${acao}:${escolhida.id}@`)).pop()?.split('@')[1];
  const out = escolhida.viver(c, r, ultimaDela);
  marcarCena(c.vin, `${acao}:${escolhida.id}${out.marca ? `@${out.marca}` : ''}`);
  return { id: escolhida.id, texto: out.texto };
}

/* ------------------------------------------------------------------- CONVERSAR */

const criancaNaConversa = (c: CtxI) => c.ip < 13 || c.eu < 13;


/* ------------------------------------------------------------------ O TOM DE CADA PESSOA (VIDA 36) */

/**
 * VIDA 36 · Frente 1: a mesma situação sai com falas diferentes conforme a PESSOA. O tom vem do temperamento real
 * (`temperamento`), na ordem: tímido, desconfiado, afetuoso, expansivo, brincalhão, sério; quem não cai em nenhum é neutro.
 */
export type TomDaPessoa = 'timido' | 'desconfiado' | 'afetuoso' | 'expansivo' | 'brincalhao' | 'serio' | 'neutro';
export function tomDaPessoa(p: Pessoa): TomDaPessoa {
  const t = p.temperamento;
  if (t.extroversao < -0.3) return 'timido';
  if (t.afabilidade < -0.25) return 'desconfiado';
  if (t.afabilidade > 0.35) return 'afetuoso';
  if (t.extroversao > 0.4) return 'expansivo';
  if (t.extroversao > 0.1 && t.abertura > 0.3) return 'brincalhao';
  if (t.abertura < -0.3) return 'serio';
  return 'neutro';
}

/**
 * Falas por tom, em três pedaços (abertura, corpo, fecho): cada situação monta a frase com um pedaço de cada, sorteado.
 * Assim, o mesmo tom gera muitas combinações (não só três frases). `{n}` é o nome da pessoa.
 */
type Pedacos = { abre: string[]; corpo: string[]; fecha: string[] };
const JEITO_ELOGIO: Record<TomDaPessoa, Pedacos> = {
  timido: { abre: ['{n} ficou vermelho.', '{n} desviou o olhar, sem jeito.', '{n} sorriu para o chão.'], corpo: ['murmurou um obrigado', 'mudou de assunto em seguida', 'não sabia onde pôr as mãos'], fecha: ['Mas guardou.', 'Gostou, mesmo sem dizer.'] },
  desconfiado: { abre: ['{n} franziu a testa.', '"Sei", respondeu {n}, sem baixar a guarda.', '{n} olhou de lado.'], corpo: ['perguntou por que estava dizendo isso agora', 'ficou esperando o outro lado da frase', 'agradeceu seco, procurando a pegadinha'], fecha: ['A confiança ainda vai ter que ser conquistada.', 'Nada além disso.'] },
  afetuoso: { abre: ['{n} segurou sua mão.', '{n} te abraçou.', '{n} sorriu de um jeito que você já conhecia.'], corpo: ['e disse que aquilo significava muito', 'e ficou mais tempo do que o normal', 'e falou que você sempre sabe o que dizer'], fecha: ['Vocês ficaram perto um tempo.', 'Foi um dos melhores momentos da semana.'] },
  expansivo: { abre: ['{n} soltou uma risada alta.', '"Sério? Repete!", pediu {n}.', '{n} animou-se na hora.'], corpo: ['e contou a todo mundo o que você tinha dito', 'e respondeu com um elogio bem maior que o seu', 'e pediu mais detalhes, empolgad{o}'], fecha: ['A mesa inteira riu junto.', 'Ninguém mais falou de outra coisa por um tempo.'] },
  brincalhao: { abre: ['"Ué, só agora você percebeu?", brincou {n}.', '{n} fez uma careta engraçada.', '{n} fingiu que anotava num guardanapo.'], corpo: ['e disse que ia cobrar depois', 'e transformou o elogio numa piada interna', 'e pediu que repetisse na frente dos outros'], fecha: ['Riram os dois.', 'O elogio virou piada de casa.'] },
  serio: { abre: ['{n} assentiu, pensativ{o}.', '{n} não respondeu de imediato.', '"Fico feliz que tenha reparado", disse {n}.'], corpo: ['e disse que levaria aquilo a sério', 'e comentou que era um bom critério para julgar as coisas', 'e voltou ao assunto com mais atenção'], fecha: ['Sem sorriso, mas com interesse.', 'Foi uma conversa curta e boa.'] },
  neutro: { abre: ['{n} ficou sem graça.', '{n} respondeu, um pouco atrapalhado.', '"Sério?", perguntou {n}.'], corpo: ['e depois ficou muito contente', 'e devolveu um elogio de volta', 'e a conversa seguiu mais leve'], fecha: ['Um dia comum, bom.', 'Ficou registrado.'] }
};
const JEITO_CONVERSA: Record<TomDaPessoa, Pedacos> = {
  timido: { abre: ['{n} falou pouco.', 'A conversa demorou a engrenar.', '{n} ficou calad{o} um bom tempo.'], corpo: ['respondia em frases curtas, mas ouvia tudo', 'só se soltou quando o assunto mudou', 'contou uma coisa que não contava a ninguém'], fecha: ['Vocês se entenderam melhor no fim.', 'Foi um começo de confiança.'] },
  desconfiado: { abre: ['{n} ouviu medindo cada palavra.', 'Falaram de tudo sem chegar a lugar nenhum.', '"E o que você ganha com isso?", perguntou {n}.'], corpo: ['e você sentiu que precisava provar alguma coisa', 'e guardou as respostas para depois', 'meio brincando, meio não'], fecha: ['A desconfiança ficou de pé.', 'Nada resolvido.'] },
  afetuoso: { abre: ['A conversa virou um fim de tarde inteiro.', '{n} não largava o assunto.', '{n} lembrou de um detalhe seu.'], corpo: ['e fazia perguntas com carinho', 'e você esqueceu do tempo', 'e disse que sentia falta disso'], fecha: ['Ficaram mais perto.', 'Um encontro que fez bem aos dois.'] },
  expansivo: { abre: ['{n} falou sem parar.', 'Uma hora virou debate, outra virou piada.', '{n} te interrompeu três vezes.'], corpo: ['com histórias, gestos e opiniões sobre tudo', 'e parecia não ter pressa nenhuma', 'para completar a história, rindo de cada uma'], fecha: ['Você saiu com a cabeça cheia.', 'Ficou gostoso de ouvir.'] },
  brincalhao: { abre: ['A conversa começou séria.', '{n} transformou tudo em piada.', '"Vamos fazer um trato", disse {n}.'], corpo: ['e terminou imitando alguém da família', 'mas no meio soltou uma verdade bem pensada', 'e a conversa virou uma lista de bobagens combinadas'], fecha: ['Ninguém lembrava como tinha começado.', 'Riram até doer.'] },
  serio: { abre: ['{n} foi direto ao ponto.', 'Falaram de coisas práticas, sem rodeio.', '{n} pareceu satisfeit{o} com a clareza.'], corpo: ['e só depois de um tempo voltou ao assunto leve', 'e a conversa foi longa e objetiva', 'anotando mentalmente duas ou três coisas'], fecha: ['Saíram com um plano.', 'Sem enfeite, mas útil.'] },
  neutro: { abre: ['Vocês conversaram sobre a semana.', '{n} contou uma novidade pequena.', 'Papo de sempre.'], corpo: ['e a conversa foi se alongando sem pressa', 'e você contou outra; ficaram nisso um tempo', 'sem grande coisa, mas gostoso'], fecha: ['Foi bom.', 'Ninguém quis ir embora.'] }
};
const montarJeito = (tabela: Record<TomDaPessoa, Pedacos>, c: CtxI, r: Rng, ultima?: string): { texto: string; marca: string } => {
  const p = tabela[tomDaPessoa(c.p)];
  const k = [0, 1, 2].map(() => Math.floor(r.next() * 3));
  const marca = k.join('');
  if (marca === ultima) k[2] = (k[2] + 1) % 3;
  const txt = (x: string) => x.replace(/\{n\}/g, c.p.nome).replace(/\{o\}/g, c.p.genero === 'feminino' ? 'a' : 'o');
  const meio = p.corpo[k[1] % p.corpo.length];
  const fim = p.fecha[k[2] % p.fecha.length];
  const ini = txt(p.abre[k[0] % p.abre.length]);
  return { texto: `${ini} ${txt(meio)}. ${txt(fim)}`, marca: [k[0], k[1], k[2]].join('') };
};
const falaDoJeito = (familia: 'elogio' | 'conversa' | 'carinho'): Cena => ({
  id: 'do_jeito', quando: () => true, peso: () => 5,
  viver: (c, r, ultima) => montarJeito(familia === 'elogio' ? JEITO_ELOGIO : JEITO_CONVERSA, c, r, ultima),
});

const CONVERSAR: Cena[] = [
  falaDoJeito('conversa'),
  {
    // Há atrito: a conversa é para acertar as coisas (a de antes do REWORK 7.5, agora uma situação entre outras).
    id: 'acertar', quando: c => c.vin.tensao >= 40, peso: () => 100,
    viver: c => {
      // (O que acalma e o marco "acertaram as coisas" já vêm da interação; aqui, só a cena.)
      return { texto: compatibilidade(c.v, c.p) > 0 ? `Vocês sentaram para conversar. Não foi fácil, mas ${c.p.nome} terminou rindo de uma bobagem.` : `A conversa com ${c.p.nome} foi dura. Pelo menos, foi.` };
    }
  },
  {
    // VIDA 29: o que a pessoa ouviu de você por outros (`boatos29`) vira o assunto — e a conversa desfaz a versão aumentada.
    id: 'soube29', quando: c => c.eu >= 14 && c.ip >= 14 && !!assuntoDaConversa29(c.v, c.p.id) && (c.vin.habitos?.boato29 ?? -999) < c.v.t - 24, peso: () => 3,
    viver: c => {
      const fala = assuntoDaConversa29(c.v, c.p.id)!;
      (c.vin.habitos ??= {}).boato29 = c.v.t;
      const corrigiu = esclarecer29(c.v, c.p.id);
      if (corrigiu) { confiar(c, 3); lembrarCom(c.v, c.p.id, 'Você desfez a versão aumentada que tinha chegado a ela.', undefined, 1); }
      else afeto(c, 1);
      return { texto: `${fala} ${corrigiu ? 'Você contou como foi de verdade; a versão que tinha corrido era bem pior.' : 'Você contou do seu jeito.'}` };
    }
  },
  {
    // Ela conta o que anda pesando (o aperto real dela) — e isso abre o "Cuidar e ajudar" da ficha.
    id: 'preocupacao', quando: c => !!apertoEmPalavras(c) && c.ip >= 14 && c.vin.confianca >= 30, peso: c => (c.vin.confianca >= 55 ? 6 : 3),
    viver: c => {
      const a = apertoEmPalavras(c)!;
      confiar(c, 4); afeto(c, 2);
      lembrarCom(c.v, c.p.id, `Contou o que andava pesando: ${a}.`, undefined, 1);
      return { texto: `No meio da conversa, ${c.p.nome} acabou falando ${contrair(a)}. Você ouviu sem pressa de responder.` };
    }
  },
  {
    // A novidade dela: o que a trajetória dela registrou há pouco.
    id: 'novidade_dela', quando: c => c.ip >= 14 && !!novidadeDela(c), peso: () => 5,
    viver: (c, r) => {
      const n = novidadeDela(c)!;
      afeto(c, 2);
      const reacao = r.pick(['Você quis saber os detalhes.', 'Você fez as perguntas certas.', `Deu para ver que ${ele(c.p)} queria contar para alguém.`]);
      return { texto: `${c.p.nome} contou as novidades: ${minuscula(semPonto(n.texto))}. ${reacao}` };
    }
  },
  {
    // A sua novidade: o marco do seu último ano. A reação é do jeito dela.
    id: 'sua_novidade', quando: c => !!suaNovidade(c) && !!SOBRE_O_TEMA[suaNovidade(c)!.tema], peso: () => 4,
    viver: c => {
      const e = suaNovidade(c)!;
      const calorosa = c.p.temperamento.afabilidade > 0.2;
      const distraida = c.p.temperamento.extroversao < -0.3 && c.vin.proximidade < 50;
      afeto(c, calorosa ? 3 : 1);
      const reacao = e.tema === 'perda' ? `${c.p.nome} não tentou consertar nada. Só ficou.`
        : calorosa ? `${c.p.nome} quis saber tudo.` : distraida ? `${c.p.nome} ouviu, meio long${_o(c.p, 'e', 'e', 'e')}, e mudou de assunto.` : `${c.p.nome} ouviu e deu a opinião ${dele(c.p)}, do jeito de sempre.`;
      return { texto: `Você contou ${SOBRE_O_TEMA[e.tema]}. ${reacao}` };
    }
  },
  {
    // Uma lembrança de vocês — um marco real da história dos dois.
    id: 'lembranca', quando: c => !!lembrancaDeVoces(c), peso: c => (c.vin.proximidade >= 55 ? 4 : 2),
    viver: (c, r) => {
      const m = lembrancaDeVoces(c)!;
      const h = c.vin.habitos ?? (c.vin.habitos = {});
      h.lembrar = (h.lembrar ?? 0) + 1;
      afeto(c, 3);
      const fecho = r.pick(['Riram como se fosse ontem.', `${c.p.nome} lembrava de um detalhe que você tinha esquecido.`, 'Ficaram um tempo calados depois.']);
      return { texto: `Do nada, a conversa voltou a ${anoDe(m.t)}: ${minuscula(semPonto(m.texto))}. ${fecho}`, marca: String(m.t) };
    }
  },
  {
    // Ela descobre que você anda cansado e dá um conselho: uma AJUDA real, que fica (e que dá para agradecer depois).
    id: 'conselho', quando: c => c.eu >= 12 && c.ip >= c.eu + 12 && c.v.mente.estresse >= 55 && c.vin.proximidade >= 35, peso: () => 4,
    viver: c => {
      confiar(c, 3); afeto(c, 2);
      c.v.mente.estresse = clamp(c.v.mente.estresse - 2);
      lembrarCom(c.v, c.p.id, `Deu um conselho quando você andava sobrecarregad${g(c, 'o', 'a', 'e')}.`, 'apoio', 1, c.v.t, 'ela');
      return { texto: `${c.p.nome} percebeu que você andava cansad${g(c, 'o', 'a', 'e')} antes de você dizer. O conselho foi simples: ${c.p.temperamento.responsabilidade > 0.1 ? 'uma coisa de cada vez' : 'largar o que não é seu'}.` };
    }
  },
  {
    // Ainda há o que saber dela: a conversa revela (o mesmo fato de "perguntar sobre a vida", por outro caminho).
    id: 'revelacao', quando: c => c.eu >= 10 && c.ip >= 10 && c.vin.proximidade >= 25 && pendentes(c.v, c.p, c.vin).length > 0, peso: () => 2,
    viver: c => {
      const s = revelar(c.v, c.p, c.vin, pendentes(c.v, c.p, c.vin)[0])!;
      lembrarCom(c.v, c.p.id, fraseDoSaber(c.v, c.p, s), 'descoberta', 1);
      afeto(c, 2);
      return { texto: cenaDaDescoberta(c.v, c.p, s) };
    }
  },
  {
    // Nem toda conversa engrena: pouca afinidade, o dia errado.
    id: 'desencontro', quando: c => c.vin.proximidade < 60 && compatibilidade(c.v, c.p) < 0.15, peso: c => (compatibilidade(c.v, c.p) < -0.1 ? 3 : 1.2),
    viver: (c, r) => {
      afeto(c, 1);
      return { texto: r.pick([`A conversa com ${c.p.nome} não engrenou: cada um falava de uma coisa.`, `${c.p.nome} estava com a cabeça em outro lugar. Ficou para outro dia.`]) };
    }
  },
  {
    // O de sempre: falar de nada — e tudo bem.
    id: 'comum', quando: () => true, peso: () => 3,
    viver: (c, r, ultima) => {
      if (criancaNaConversa(c)) {
        return variante(r, c.ip < c.eu ? [`${c.p.nome} contou, com detalhes, uma briga no recreio.`, `${c.p.nome} quis saber por que o céu é azul. Você tentou.`, `${c.p.nome} mostrou um desenho e explicou cada parte.`] : [`${c.p.nome} perguntou da escola. Você contou a parte boa.`, `Você contou para ${c.p.nome} uma coisa que aconteceu na aula.`, `${c.p.nome} quis saber quem era seu melhor amigo agora.`], ultima);
      }
      return variante(r, [`Falaram de tudo e de nada: o tempo, a comida, o preço das coisas.`, `Uma conversa curta com ${c.p.nome}, daquelas que não precisam de assunto.`, `${c.p.nome} contou uma fofoca. Você contou outra.`, `${c.p.nome} reclamou da semana; você reclamou da sua. Riram das duas.`], ultima);
    }
  }
];

/** Conversar: a situação e o texto (os efeitos de base — acalmar, aproximar, confiar — ficam na interação). */
export function conversar(c: CtxI, vez: number): string {
  return viverSituacao(c, 'conv', CONVERSAR, vez).texto;
}

/* ------------------------------------------------------------ PASSAR UM TEMPO */

/** As cenas comuns de cada papel (as de antes), agora uma situação entre outras. */
function tempoComum(frases: string[]) {
  return { id: 'comum', quando: () => true, peso: () => 4, viver: (_c: CtxI, r: Rng, ultima?: string) => variante(r, frases, ultima) } satisfies Cena;
}

/** Um amigo seu da mesma cidade, para o encontro inesperado no caminho. */
function alguemNoCaminho(c: CtxI): Pessoa | undefined {
  const ids = Object.values(c.v.vinculos).filter(x => x.pessoaId !== c.p.id && (x.estagio === 'amigo' || x.estagio === 'amigo_proximo') && !x.ruptura).map(x => c.v.pessoas[x.pessoaId]).filter(x => x?.vivo && !x.especie && x.municipioId === c.v.moradia.municipioId);
  return ids[0];
}

/** VIDA 36 · passar um tempo, do jeito de cada pessoa (mesma montagem: abertura, corpo, fecho). */
const JEITO_TEMPO: Record<TomDaPessoa, Pedacos> = {
  timido: { abre: ['{n} ficou quieto no começo.', 'O tempo passou devagar, com pouca fala.', '{n} aceitou o convite sem pressa.'], corpo: ['e foi se soltando aos poucos', 'mas gostou de ficar por perto', 'e deixou você escolher o que fazer'], fecha: ['No fim, pareceu mais à vontade.', 'Sem grande história, mas bom.'] },
  desconfiado: { abre: ['{n} aceitou, mas olhou o relógio.', 'O programa foi correto, sem entusiasmo.', '{n} quis saber o que você queria com aquilo.'], corpo: ['e ficou de lado por um tempo', 'e só relaxou quando o assunto saiu de você', 'e observou tudo com atenção'], fecha: ['A confiança ainda está em construção.', 'Ficou no ar uma pergunta.'] },
  afetuoso: { abre: ['O tempo passou sem ninguém perceber.', '{n} fez questão de estar ali.', '{n} trouxe um lanche sem avisar.'], corpo: ['e cada um contou um pouco da semana', 'e riram das bobagens de sempre', 'e prometeram repetir logo'], fecha: ['Foi um daqueles dias que fazem falta.', 'Saíram com vontade de voltar.'] },
  expansivo: { abre: ['{n} chegou animad{o} e já tinha um plano.', 'Foi um programa cheio de ideias.', '{n} não parou de falar.'], corpo: ['e arrastou você para dois lugares diferentes', 'e chamou mais gente no caminho', 'e fez da tarde uma aventura'], fecha: ['Cansaço gostoso no fim.', 'A cidade inteira parecia pequena.'] },
  brincalhao: { abre: ['{n} inventou um jogo no meio do programa.', 'A tarde virou uma sequência de piadas.', '{n} trouxe uma brincadeira pronta.'], corpo: ['e perdeu de propósito só para ouvir reclamar', 'e ninguém lembrava quem começou', 'e o plano mudou três vezes'], fecha: ['Riram até cansar.', 'Foi a melhor bobagem da semana.'] },
  serio: { abre: ['{n} propôs algo útil para fazer juntos.', 'O tempo foi organizado, sem perda.', '{n} foi direto ao que queria fazer.'], corpo: ['e cumpriram o combinado sem pressa', 'e conversaram sobre o que importava', 'e voltaram para casa com uma tarefa cumprida'], fecha: ['Um bom dia, sem exagero.', 'Satisfeit{o}, {n} foi embora cedo.'] },
  neutro: { abre: ['Vocês passaram a tarde juntos.', 'O programa foi simples.', '{n} sugeriu o lugar.'], corpo: ['e a conversa foi se alongando', 'e a tarde passou rápido', 'e ninguém quis encerrar cedo'], fecha: ['Foi bom.', 'Um dia comum, bem aproveitado.'] }
};

function cenasDeTempo(frases: string[]): Cena[] {
  return [
    tempoComum(frases),
    { id: 'do_jeito', quando: () => true, peso: () => 5, viver: (c, r, ultima) => montarJeito(JEITO_TEMPO, c, r, ultima) },
    {
      id: 'silencio', quando: c => c.vin.proximidade >= 68 && c.eu >= 12 && c.ip >= 12, peso: () => 3,
      viver: (c, r) => { afeto(c, 2); return { texto: r.pick([`Ficaram um bom tempo sem dizer nada — e estava tudo bem.`, `Nenhum dos dois precisou puxar assunto. Com ${c.p.nome}, o silêncio não pesa.`]) }; }
    },
    {
      id: 'lembranca', quando: c => !!lembrancaDeVoces(c), peso: () => 2.5,
      viver: (c, r) => {
        const m = lembrancaDeVoces(c)!;
        const h = c.vin.habitos ?? (c.vin.habitos = {});
        h.lembrar = (h.lembrar ?? 0) + 1;
        afeto(c, 2);
        return { texto: `${r.pick(['No meio da tarde', 'Na volta', 'Já no fim'])}, alguém lembrou de ${anoDe(m.t)} — ${minuscula(semPonto(m.texto))}. ${r.pick(['Viraram a tarde nisso.', 'E riram de novo.'])}`, marca: String(m.t) };
      }
    },
    {
      id: 'farpa', quando: c => c.vin.tensao >= 18 && c.vin.tensao < 40, peso: c => c.vin.tensao / 10,
      viver: (c, r) => {
        atrito(c, 3);
        return { texto: r.pick([`Foi bom, até uma farpa sobre um assunto antigo. Ninguém levantou a voz; ficou no ar.`, `${c.p.nome} soltou um comentário atravessado. Você deixou passar — por enquanto.`]) };
      }
    },
    {
      id: 'encontro', quando: c => !c.longe && c.eu >= 12 && c.ip >= 12 && !!alguemNoCaminho(c), peso: () => 1.5,
      viver: c => {
        const x = alguemNoCaminho(c)!;
        const vx = c.v.vinculos[x.id];
        vx.proximidade = clamp(vx.proximidade + 2); vx.tUltimoContato = c.v.t;
        return { texto: `No caminho, deram de cara com ${x.nome}. Virou programa a três — ${c.p.nome} e ${x.nome} se deram bem.` };
      }
    },
    {
      id: 'novidade_dela', quando: c => c.ip >= 14 && !!novidadeDela(c), peso: () => 3,
      viver: c => { const n = novidadeDela(c)!; afeto(c, 1); return { texto: `A tarde foi de ${c.p.nome} contando: ${minuscula(semPonto(n.texto))}. Você ouviu mais do que falou.` }; }
    }
  ];
}

/** Passar um tempo: a situação e o texto (os efeitos de base ficam na interação, como antes). */
export function passarTempo(c: CtxI, frases: string[], vez: number): string {
  return viverSituacao(c, 'tempo', cenasDeTempo(frases), vez).texto;
}

/* ------------------------------------------------------------------- CARINHO */

const relacaoFria = (c: CtxI) => (c.vin.romance?.envolvimento ?? 50) < 40 || c.vin.tensao >= 35;

const CARINHO: Cena[] = [
  {
    // O carinho de quem está bem: não numa relação fria (aí é o "morno").
    id: 'simples', quando: c => !relacaoFria(c), peso: () => 3,
    viver: (c, r) => ({ texto: r.pick([`Um bilhete no espelho do banheiro. ${c.p.nome} guardou.`, `Você levou café na cama, num dia qualquer. ${c.p.nome} desconfiou e depois riu.`, `Um abraço demorado na cozinha, sem motivo.`]) })
  },
  {
    // Lembrar de uma coisa de vocês (um marco real do casal).
    id: 'lembrou', quando: c => !!lembrancaDeVoces(c), peso: () => 3,
    viver: c => {
      const m = lembrancaDeVoces(c)!;
      const h = c.vin.habitos ?? (c.vin.habitos = {});
      h.lembrar = (h.lembrar ?? 0) + 1;
      envolver(c, 2);
      return { texto: `Você lembrou ${c.p.nome} de ${anoDe(m.t)} — ${minuscula(semPonto(m.texto))}. ${Ele(c.p)} riu, e depois ficou quiet${_o(c.p, 'o', 'a', 'e')}.`, marca: String(m.t) };
    }
  },
  {
    // Semana puxada (a sua cabeça cheia, o aperto dela, criança pequena): o carinho é presença.
    id: 'semana_puxada', quando: c => c.v.mente.estresse >= 62 || !!apertoEmPalavras(c), peso: () => 4,
    viver: c => { atrito(c, -3); confiar(c, 1); return { texto: `No meio da semana puxada, um abraço no corredor. Ninguém disse nada — não precisava.` }; }
  },
  {
    // Quando a relação anda morna ou com atrito, o gesto chega pela metade.
    id: 'morno', quando: c => relacaoFria(c), peso: () => 5,
    viver: c => { envolver(c, -2); return { texto: `${c.p.nome} agradeceu, mas parecia long${_o(c.p, 'e', 'e', 'e')}. O carinho chegou pela metade.` }; }
  },
  {
    // Envolvimento alto: o gesto volta.
    id: 'retribuiu', quando: c => (c.vin.romance?.envolvimento ?? 0) >= 70 && c.vin.tensao < 25, peso: () => 2,
    viver: c => { envolver(c, 2); return { texto: `No dia seguinte, ${c.p.nome} respondeu com outro carinho — um recado, uma comida preferida, um "lembrei de você".` }; }
  }
];

export function demonstrarCarinho(c: CtxI, vez: number): string {
  return viverSituacao(c, 'carinho', CARINHO, vez).texto;
}

/* ------------------------------------------------------------------- ELOGIAR */

const ELOGIO: Cena[] = [
  falaDoJeito('elogio'),
  {
    id: 'estranho', quando: c => c.vin.tensao >= 35, peso: () => 100,
    viver: (c, r, ultima) => (variante(r, [`${c.p.nome} ouviu, desconfiad${_o(c.p, 'o', 'a', 'e')}. No meio do que anda entre vocês, soou estranho.`, `"Agora?", perguntou ${c.p.nome}. O elogio caiu no meio da briga e não achou lugar.`], ultima))
  },
  {
    // O mesmo elogio, de novo: a pessoa nota (a reação anterior conta).
    id: 'de_novo', quando: c => (c.vin.habitos?.elogiar ?? 0) >= 4, peso: () => 6,
    viver: (c, r, ultima) => (variante(r, [`${c.p.nome} sorriu — mas já ouviu isso de você antes.`, `"Você sempre diz isso", riu ${c.p.nome}. Disse como quem gosta de ouvir de novo.`, `${c.p.nome} agradeceu meio no automático. Elogio repetido perde a pressa de chegar.`], ultima))
  },
  {
    // O elogio que lembra uma coisa de vocês (um marco real).
    id: 'lembrado', quando: c => !!lembrancaDeVoces(c), peso: () => 3,
    viver: c => { const m = lembrancaDeVoces(c)!; return { texto: `Você disse a ${c.p.nome} o que admira — e citou ${anoDe(m.t)}, ${minuscula(semPonto(m.texto))}. ${Ele(c.p)} não esperava que você lembrasse.`, marca: String(m.t) }; }
  },
  {
    id: 'crianca', quando: c => (c.papel === 'filho' || c.papel === 'neto') && c.ip < 18, peso: () => 4,
    viver: (c, r, ultima) => (variante(r, [`${c.p.nome} fingiu que não ligou. Mais tarde, contou para alguém.`, `${c.p.nome} revirou os olhos e saiu da sala sorrindo.`, `${c.p.nome} perguntou se era verdade. Você disse que era.`], ultima))
  },
  {
    id: 'mais_velho', quando: c => c.papel === 'genitor' || c.papel === 'avo', peso: () => 4,
    viver: (c, r, ultima) => (variante(r, [`${c.p.nome} ficou com os olhos cheios. "Não precisava", disse — e precisava.`, `${c.p.nome} desconversou, falou do almoço. À noite, ligou só para dizer boa-noite.`, `${c.p.nome} contou para a vizinhança inteira o que você tinha dito.`], ultima))
  },
  {
    id: 'comum', quando: () => true, peso: () => 2,
    viver: (c, r, ultima) => (c.p.temperamento.extroversao < -0.3 ? variante(r, [`${c.p.nome} ficou vermelh${_o(c.p, 'o', 'a', 'e')} e mudou de assunto. Mas guardou.`, `${c.p.nome} não disse nada. Dias depois, repetiu a sua frase para alguém.`], ultima) : variante(r, [`${c.p.nome} ficou sem graça, e depois muito contente.`, `${c.p.nome} respondeu com um elogio de volta — um pouco atrapalhado.`, `"Sério?", perguntou ${c.p.nome}. Sério.`], ultima))
  }
];

export function elogiar(c: CtxI, vez: number): string {
  return viverSituacao(c, 'elogio', ELOGIO, vez).texto;
}

/* ------------------------------------------------------------------ AGRADECER */

export interface AjudaRecebida {
  /** Identifica a ajuda (para não agradecer duas vezes pela mesma). */
  chave: string;
  t: number;
  /** "pelo conselho sobre a faculdade" — o que vem depois de "Agradecer a X". */
  pelo: string;
}

/**
 * As ajudas que a pessoa DEU ao jogador, segundo o motor (nunca por semelhança): os marcos de apoio com `de: 'ela'`
 * (ou 'juntos'); nos saves de antes do campo, as duas frases que sempre foram dela; o dinheiro que ela guardou para
 * você (`origem.reservaDe`); e ter criado você (quem a origem diz que criou).
 */
export function ajudasRecebidas(v: Vida, p: Pessoa): AjudaRecebida[] {
  const vin = v.vinculos[p.id];
  if (!vin) return [];
  const out: AjudaRecebida[] = [];
  for (const h of vin.historia) {
    const dela = h.de === 'ela' || h.de === 'juntos' || (h.de === undefined && (h.texto === 'Esteve do seu lado quando a vida pesou.' || /^Pediu conselho sobre /.test(h.texto)));
    if (!dela) continue;
    const pelo = /^Pediu conselho sobre (.+)\.$/.exec(h.texto)?.[1];
    const frase = pelo ? `pelo conselho sobre ${pelo}`
      : h.texto === 'Esteve do seu lado quando a vida pesou.' ? 'por ter estado do seu lado quando a vida pesou'
        : /^Ficou com as crianças/.test(h.texto) ? 'pelo fim de semana com as crianças'
          : /^Deu um conselho quando/.test(h.texto) ? 'pelo conselho quando você andava sobrecarregad' + (v.eu.genero === 'masculino' ? 'o' : 'a')
            : /^Deu um conselho sobre o futuro/.test(h.texto) ? 'pelo conselho sobre o futuro'
              : /^Enfrentaram juntos um aperto/.test(h.texto) ? 'por ter atravessado o aperto de dinheiro junto'
                : `pelo que fez por você em ${anoDe(h.t)}`;
    out.push({ chave: `h${h.t}`, t: h.t, pelo: frase });
  }
  if (v.origem?.reservaDe === p.id || v.fatos[`reserva_de_${p.id}`] !== undefined) out.push({ chave: 'reserva', t: v.eu.tNasc, pelo: 'pelo dinheiro que guardou para você' });
  const criou = (vin.parentesco === 'mae' && ['pais_juntos', 'mae_solo'].includes(v.origem?.arranjo ?? '')) || (vin.parentesco === 'pai' && ['pais_juntos', 'pai_solo'].includes(v.origem?.arranjo ?? ''))
    || (vin.parentesco === 'avo' && v.origem?.arranjo === 'avos' && (vin.convivio.includes('casa') || vin.historia.some(h => h.t <= v.eu.tNasc + 60)))
    || v.origem?.responsavelId === p.id;
  if (criou && idadeDoJogador(v) >= 14) out.push({ chave: 'criou', t: v.eu.tNasc, pelo: 'por ter criado você' });
  return out;
}

const idadeDoJogador = (v: Vida) => Math.floor((v.t - v.eu.tNasc) / 12);

/** As ajudas ainda não agradecidas (a mais recente primeiro). */
export function aAgradecer(v: Vida, p: Pessoa): AjudaRecebida[] {
  return ajudasRecebidas(v, p).filter(a => v.fatos[`agradeceu:${p.id}:${a.chave}`] === undefined).sort((a, b) => b.t - a.t);
}

/** Sem ajuda registrada, ainda dá para agradecer pela companhia — quando a relação sustenta (perto, de anos, sem atrito). */
export function companhiaAgradecivel(c: CtxI): boolean {
  const anos = (c.v.t - c.vin.tInicio) / 12;
  const ultima = c.v.fatos[`agradeceu:${c.p.id}:companhia`];
  return c.vin.proximidade >= 60 && anos >= 3 && c.vin.tensao < 30 && (ultima === undefined || c.v.t - ultima >= 60);
}

/** O rótulo do agradecimento — sempre pelo que aconteceu. */
export function rotuloAgradecer(c: CtxI): string {
  const a = aAgradecer(c.v, c.p)[0];
  return a ? `Agradecer a ${c.p.nome} ${a.pelo}` : `Agradecer a ${c.p.nome} pela companhia de todos esses anos`;
}

/** Agradece: pela ajuda mais recente ainda não agradecida, ou pela companhia. A reação é da pessoa e do momento. */
/* VIDA 36 · Frente 1 (agradecer): o agradecimento sai do tom de quem recebe (abertura + corpo). A evidência continua
 * decidindo a ramificação (ajuda registrada ou companhia); o tom só muda a frase. */
const AGRADECER_TOM: Record<TomDaPessoa, { abre: string[]; corpo: string[] }> = {
  timido: { abre: ['{n} ficou vermelho.', '{n} baixou os olhos.', '{n} sorriu para o chão.'], corpo: ['e murmurou que não era nada', 'e mudou de assunto', 'e guardou o agradecimento para si'] },
  desconfiado: { abre: ['{n} olhou de lado.', '"Por quê?", perguntou {n}.'], corpo: ['e esperou para ver o motivo', 'e disse que ainda ia cobrar o favor', 'e agradeceu seco'] },
  afetuoso: { abre: ['{n} te abraçou.', '{n} segurou sua mão.'], corpo: ['e disse que você nem precisava agradecer', 'e ficou com os olhos cheios', 'e prometeu estar lá do mesmo jeito'] },
  expansivo: { abre: ['{n} riu alto.', '{n} contou para a roda o que você fez.'], corpo: ['e fez questão que todo mundo ouvisse', 'e devolveu com um elogio ainda maior', 'e puxou outra história para continuar'] },
  brincalhao: { abre: ['"Ué, agora sou seu credor?", brincou {n}.', '{n} fez uma careta.'], corpo: ['e disse que a conta chega depois', 'e fingiu que estava anotando a dívida', 'e devolveu o agradecimento com uma piada'] },
  serio: { abre: ['{n} assentiu.', '{n} disse com calma:'], corpo: ['"Fico feliz de ter ajudado"', 'e disse que ia retribuir quando fosse preciso', 'e voltou ao assunto com atenção'] },
  neutro: { abre: ['{n} respondeu com um sorriso.', '{n} ficou sem graça.'], corpo: ['e disse que faria de novo', 'e depois ficou contente', 'e lembrou de uma vez em que foi você'] }
};
const agradeceTom = (c: CtxI, r: Rng, id: string): string => {
  const t = AGRADECER_TOM[tomDaPessoa(c.p)];
  const combos: string[] = [];
  for (const a of t.abre) for (const b of t.corpo) combos.push(`${a} ${b}.`.replace(/\{n\}/g, c.p.nome).replace(/\{o\}/g, c.p.genero === 'feminino' ? 'a' : 'o'));
  const chaveUltima = `agr:${c.p.id}:${id}`;
  const livres = combos.map((_, k) => k).filter(k => k !== c.v.fatos[chaveUltima]);
  const k = r.pick(livres.length ? livres : [0]);
  c.v.fatos[chaveUltima] = k;
  return combos[k];
};

export function agradecer(c: CtxI): string {
  const a = aAgradecer(c.v, c.p)[0];
  const chave = a?.chave ?? 'companhia';
  c.v.fatos[`agradeceu:${c.p.id}:${chave}`] = c.v.t;
  const r = rngDe(c.v.id, 'agradecer', c.p.id, c.v.t, chave);
  const tensa = c.vin.tensao >= 35;
  const fechada = c.p.temperamento.extroversao < -0.3;
  const antiga = a && c.v.t - a.t >= 60;
  afeto(c, tensa ? 1 : a ? 5 : 3); confiar(c, tensa ? 0 : 2);
  if (a) lembrarCom(c.v, c.p.id, `Você agradeceu ${a.pelo.replace(/ você /, ' ').replace('por ter criado você', 'por tudo — por ter criado você')}.`, undefined, antiga || a.chave === 'criou' ? 2 : 1);
  const coisa = a ? a.pelo : 'pela companhia';
  // A reação não repete a última com esta pessoa (agradecer é raro: a última reação fica num fato compacto,
  // `agr:<pessoa>:<família de reação>` = o índice dela, em vez de disputar as marcas de cena com as conversas).
  const escolher = (id: string, opcoes: string[]) => {
    const chaveUltima = `agr:${c.p.id}:${id}`;
    const livres = opcoes.map((_, k) => k).filter(k => k !== c.v.fatos[chaveUltima]);
    const k = r.pick(livres.length ? livres : [0]);
    c.v.fatos[chaveUltima] = k;
    return opcoes[k];
  };
  const pre = a ? `Você agradeceu ${coisa}. ` : '';
  if (tensa) return `Você agradeceu ${coisa}. ${c.p.nome} ouviu, mas o que anda entre vocês fez a frase soar estranha.`;
  if (a?.chave === 'criou') return pre + (c.p.temperamento.afabilidade > 0 ? `${c.p.nome} ficou com os olhos cheios. "Não precisava", disse — e precisava.` : `${c.p.nome} desconversou, falou do almoço. Mais tarde, ligou só para perguntar se você tinha chegado bem.`);
  if (antiga) return pre + `"Você ainda lembra disso?" ${c.p.nome} lembrava também — de detalhes que você não sabia.`;
  if (fechada) return pre + escolher('fechada', [`"Imagina", disse ${c.p.nome}, e mudou de assunto. Mas ficou contente; deu para ver.`, `${c.p.nome} só fez que sim com a cabeça. Para ${ele(c.p)}, é muito.`]);
  if (!a) return `Você disse a ${c.p.nome}, sem motivo especial, que era bom ter ${ele(c.p)} por perto. ` + agradeceTom(c, r, 'companhia');
  return pre + agradeceTom(c, r, 'ajuda');
}
