/**
 * VIDA 19 · VIDA CONECTADA — o feed lido das vidas de verdade.
 *
 * Nada aqui é guardado nem sorteado com o gerador da vida: cada publicação é um acontecimento que ESTÁ na trajetória de
 * alguém (`Pessoa.vida.trajetoria`: o emprego novo, a mudança, o casamento, o filho, a perda, o disco lançado), contado
 * por essa pessoa do jeito dela, na rede que ela usa, no formato que cabe (texto, foto, álbum, vídeo curto, story).
 * A mesma publicação aparece igual toda vez (as escolhas saem de `rngDe` da chave da publicação).
 *
 *   QUEM POSTA E O QUÊ   a exposição de cada um (`npc19.exposicao`, do temperamento): quem é reservado posta pouco e só
 *                        para os amigos; doença, desemprego e separação só vão para a rede de quem expõe a vida; dívida e
 *                        aperto de dinheiro nunca. Um caso escondido nunca vira publicação.
 *   QUEM VÊ              o que é "só para amigos" você só vê se for amigo, família ou próximo; quem bloqueou ou rompeu
 *                        sai do feed.
 *   ALCANCE              seguidores pela idade, pelo jeito e pela fama (o famoso alcança milhões; a tia, os parentes);
 *                        curtidas e comentários pelo tipo do acontecimento e pelo formato.
 *   COMENTÁRIOS          de quem tem laço com a pessoa (a parceria, a família, os amigos em comum, o rival, o ex) — o tom
 *                        sai da relação entre os dois e do jeito de quem comenta (`comentaristas19`). O mesmo cálculo é o
 *                        que o ano usa para mexer nos laços entre eles: o que se lê é o que aconteceu.
 */
import type { Pessoa, PlataformaId, Vida, Vinculo } from '../../tipos';
import type { Reacao19 } from '../../dados19/tipos';
import { rngDe } from '../../rng';
import { idadePessoa, vinculosVivos } from '../../nucleo';
import { flex } from '../../texto';
import { exposicaoDe19 } from '../npcs/vidas19';
import { municipio } from '../../dados/lugares';

export type Formato19 = 'texto' | 'foto' | 'album' | 'video' | 'story';
export type TomNpc19 = 'apoio' | 'parabens' | 'carinho' | 'brincadeira' | 'saudade' | 'ironia' | 'ciume';

export interface Comentario19 { pid: string; tom: TomNpc19; texto: string }

export interface Post19 {
  chave: string;
  pid: string;
  t: number;
  /** O tipo do acontecimento (o da trajetória). */
  tipo: string;
  /** O fato, nas palavras da trajetória (a origem verdadeira da publicação). */
  origem: string;
  titulo: string;
  legenda: string;
  formato: Formato19;
  plataforma: PlataformaId;
  publico: 'publico' | 'amigos';
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  destaque: Comentario19[];
  famoso: boolean;
  /** Acontecimento difícil: não se "curte", deixa-se um abraço. */
  dificil: boolean;
  reacao?: Reacao19;
}

const hash = (s: string) => { let h = 2166136261; for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };

/* ------------------------------------------------------------------ O que vira publicação */

/** O que nunca se posta (o aperto de dinheiro, as decisões de quem está devendo). */
const PRIVADO = /dívida|Cortou gastos|Dividiu a casa|Trocou de casa por uma menor|trabalho extra para pagar|apertaram|Perdeu o bebê|custa menos|se reerguer|segue como|esperando uma vaga|não abre|Começou a gostar de|não entrou|não quis/i;

/** A exposição mínima que cada tipo de acontecimento pede para virar publicação. */
function exposicaoPedida(tipo: string, texto: string): number {
  if (tipo === 'saude') return /Voltou ao trabalho/.test(texto) ? 2 : 3;
  if (tipo === 'desemprego') return /Fechou/.test(texto) ? 2 : 3;
  if (tipo === 'amor' && /Separou|Terminou|separaram|terminaram/i.test(texto)) return 2;
  if (tipo === 'perda') return 1;
  if (tipo === 'escola') return 2;
  if (tipo === 'filho' || (tipo === 'amor' && /Casou|casou|morar/.test(texto))) return 0;
  return 1;
}

export const DIFICEIS19 = new Set(['perda', 'saude', 'desemprego']);

const TITULO: Record<string, string> = {
  trabalho: 'Trabalho novo', promocao: 'Conquista', desemprego: 'Recomeço', casa: 'Casa nova', amor: 'Juntos', filho: 'Bem-vindo, bebê',
  lugar: 'Mudança', saude: 'Cuidando da saúde', perda: 'Luto', estudo: 'Conquista', escola: 'Escola'
};

function titulo(tipo: string, texto: string): string {
  if (tipo === 'amor' && /Separou|Terminou|separaram|terminaram/i.test(texto)) return 'Fim de um ciclo';
  if (tipo === 'amor' && /namorar|Voltou com|novo relacionamento/i.test(texto)) return 'Namorando';
  if (tipo === 'filho' && /grávida|Vai ser/.test(texto)) return 'Vem aí';
  if (tipo === 'casa' && /carro|moto/.test(texto)) return 'Conquista';
  if (/Lançou|Estreou|turnê|campanha|Desfilou|filmar|programa|vídeos|recorde/.test(texto)) return 'Lançamento';
  if (/polêmica/.test(texto)) return 'Polêmica';
  return TITULO[tipo] ?? 'Novidade';
}

/** As legendas, no jeito de quem posta (a animada exclama; a reservada diz pouco). */
const LEGENDAS: Record<string, [string[], string[]]> = {
  trabalho: [['Primeiro dia no trabalho novo! Bora!', 'Começando um capítulo novo. Obrigado a quem torceu.', 'Crachá novo, frio na barriga, vontade de fazer dar certo.'], ['Começo novo.', 'Trabalho novo.']],
  promocao: [['Não acredito que chegou! Obrigado a todo mundo que caminhou junto.', 'Muito trabalho, muita noite sem dormir — e valeu cada minuto!', 'Subi mais um degrau. Hoje é dia de comemorar!'], ['Uma conquista importante.', 'Grato pelo reconhecimento.']],
  desemprego: [['Fecha-se uma porta. Agora é respirar e recomeçar — aceito indicações!', 'Fase de recomeço. Quem souber de vaga, me chama.'], ['Recomeçando.']],
  casa: [['Chave na mão! Anos juntando e finalmente!', 'Casa nova, vida nova. Aceito visitas (e ajuda pra montar os móveis)!', 'Primeiro carro na garagem. Quem quer carona?'], ['Lar.', 'Conquista.']],
  amor: [['Com você tudo faz sentido.', 'Oficialmente! Que venham muitos anos.', 'Meu lugar favorito é do seu lado.'], ['Nós.', 'Juntos.']],
  amor_fim: [['Às vezes amar também é deixar ir. Seguimos com carinho.', 'Fim de um ciclo. Obrigado pelos anos bons.'], ['Um ciclo se fecha.']],
  filho: [['Chegou! O amor mais bonito do mundo tem nome agora.', 'Nossa família cresceu. Cansaço e felicidade em doses iguais.', 'Bem-vindo ao mundo, pequeno!'], ['Chegou.', 'Família.']],
  gravidez: [['Vem aí o nosso maior presente!', 'Contagem regressiva para a melhor notícia da nossa vida.'], ['Vem aí.']],
  lugar: [['Cidade nova, vida nova! Saudade de quem ficou.', 'Malas desfeitas. Me visitem!', 'Mudança feita: agora é desbravar a cidade.'], ['Nova cidade.', 'Mudança.']],
  saude: [['Fase de cuidar de mim. Obrigado pelas mensagens.', 'Cada dia um passo. Um dia de cada vez.'], ['Cuidando da saúde.']],
  perda: [['Saudade que não cabe em palavras. Obrigado por todo o carinho.', 'Parte de mim foi junto. Descanse em paz.'], ['Saudade.', 'Descanse em paz.']],
  estudo: [['Formatura! Valeu cada madrugada.', 'Diploma na mão! Obrigado a quem segurou a barra.'], ['Formado.', 'Conquista.']],
  escola: [['Primeiro dia de aula!', 'De volta às aulas.'], ['Escola.']],
  lancamento: [['Saiu! Espero que vocês sintam o que eu senti fazendo.', 'Está no ar! Corre lá e me conta o que achou.', 'Muito trabalho por trás disso. Obrigado, equipe!'], ['Disponível.', 'No ar.']],
  polemica: [['Errei e peço desculpas. Estou aprendendo.', 'Não vou responder a tudo. Quem me conhece sabe quem eu sou.'], ['Nota oficial.']]
};

function chaveLegenda(tipo: string, texto: string): string {
  if (tipo === 'amor' && /Separou|Terminou/i.test(texto)) return 'amor_fim';
  if (tipo === 'filho' && /grávida|Vai ser/.test(texto)) return 'gravidez';
  if (/polêmica/.test(texto)) return 'polemica';
  if (/Lançou|Estreou|turnê|campanha|Desfilou|filmar|programa|vídeos|recorde/.test(texto)) return 'lancamento';
  return tipo;
}

/* ------------------------------------------------------------------ Rede, formato, alcance */

function plataformaDe(_p: Pessoa, i: number, tipo: string, famoso: boolean, u: number): PlataformaId {
  if (famoso) return u < 0.45 ? 'instagram' : u < 0.75 ? 'tiktok' : 'x';
  if (i >= 58) return 'facebook';
  if (i < 28) return tipo === 'escola' || u < 0.45 ? 'tiktok' : 'instagram';
  if (tipo === 'promocao' || tipo === 'trabalho') return u < 0.6 ? 'instagram' : 'facebook';
  return i >= 45 && u < 0.5 ? 'facebook' : 'instagram';
}

function formatoDe(pl: PlataformaId, tipo: string, origem: string, i: number, u: number): Formato19 {
  if (pl === 'tiktok') return 'video';
  if (/Lançou|turnê|vídeos|recorde/.test(origem)) return u < 0.6 ? 'video' : 'foto';
  if (pl === 'x') return 'texto';
  if (tipo === 'amor' && /Casou|morar/.test(origem)) return 'album';
  if (tipo === 'lugar' || tipo === 'casa') return u < 0.5 ? 'album' : 'foto';
  if (tipo === 'filho') return 'foto';
  if (tipo === 'perda' || tipo === 'saude' || tipo === 'desemprego') return u < 0.7 ? 'texto' : 'foto';
  if (i < 30 && u < 0.35) return 'story';
  return u < 0.75 ? 'foto' : 'texto';
}

/** Os seguidores de alguém na rede (a fama manda; sem fama, o jeito e a idade). */
export function seguidores19(p: Pessoa, i: number): number {
  const c = p.celebridade15;
  if (c) return Math.round([0, 60000, 900000, 7000000][c.nivel] * (0.7 + hash(p.id + 'seg') * 0.6));
  const base = (i < 30 ? 520 : i < 50 ? 380 : 220) * (1 + p.temperamento.extroversao * 0.6);
  return Math.max(40, Math.round(base * (0.6 + hash(p.id + 'seg') * 0.8)));
}

const ENGAJAMENTO: Record<string, number> = { filho: 0.32, amor: 0.26, estudo: 0.2, promocao: 0.14, casa: 0.16, lugar: 0.12, trabalho: 0.1, perda: 0.18, saude: 0.15, desemprego: 0.08, escola: 0.1 };

/* ------------------------------------------------------------------ Quem comenta */

const FRASES: Record<TomNpc19, string[]> = {
  apoio: ['Força! Tô aqui pro que precisar.', 'Pensando em você. Conta comigo.', 'Um abraço apertado.'],
  parabens: ['Parabéns! Merecido demais.', 'Que orgulho! Vai longe.', 'Arrasou! Bora comemorar.'],
  carinho: ['Te amo! Que alegria dividir isso com você.', 'Meu orgulho. ❤', 'Melhor notícia do ano.'],
  brincadeira: ['E o churrasco de comemoração, sai quando?', 'Agora vai ter que pagar a rodada!', 'Quem diria, hein? Haha'],
  saudade: ['Que saudade! Precisamos marcar.', 'Saudade de você por aqui.'],
  ironia: ['Hm. Cada um com seus méritos.', 'Interessante. Vamos ver quanto dura.'],
  ciume: ['Quem é essa pessoa?', 'Rápido, hein.']
};

/**
 * Quem comenta o acontecimento de alguém (no máximo 3), e em que tom — de quem tem laço com a pessoa: a parceria, a
 * família de vocês, os amigos em comum, o rival, o ex. Lido pelo feed (o que aparece) e pelo ano (o que mexe nos laços).
 */
export function comentaristas19(v: Vida, autor: Pessoa, tipo: string, origem: string, chave: string): Comentario19[] {
  const r = rngDe(v.id, 'coment19', chave);
  const dificil = DIFICEIS19.has(tipo) || /Separou|Terminou/i.test(origem);
  const candidatos: { p: Pessoa; peso: number; tom: TomNpc19 }[] = [];
  const add = (p: Pessoa | undefined, peso: number, tom: TomNpc19) => { if (p?.vivo && !p.especie && p.id !== autor.id && v.vinculos[p.id] && !candidatos.some(x => x.p.id === p.id)) candidatos.push({ p, peso, tom }); };
  const par = autor.parceiroId ? v.pessoas[autor.parceiroId] : undefined;
  if (par) add(par, 3, dificil ? 'apoio' : 'carinho');
  for (const l of autor.npc19?.lacos ?? []) {
    const q = v.pessoas[l.id];
    if (!q) continue;
    if (l.tipo === 'rivalidade') { if (!dificil && (tipo === 'promocao' || tipo === 'trabalho' || /Lançou|Estreou/.test(origem))) add(q, 1.2, 'ironia'); continue; }
    if (l.tipo === 'ex') { if (tipo === 'amor' && /namorar|Casou|morar/.test(origem) && l.forca > 15 && q.temperamento.estabilidade < 0) add(q, 1, 'ciume'); continue; }
    add(q, 1 + Math.max(0, l.forca) / 50, dificil ? 'apoio' : q.temperamento.extroversao > 0.3 ? 'brincadeira' : 'parabens');
  }
  // A família de quem posta que também é sua (irmãos, primos): os parentes comentam tudo.
  for (const g of autor.genitores ?? []) add(v.pessoas[g], 1.5, dificil ? 'apoio' : 'carinho');
  for (const { p } of vinculosVivos(v)) if (p.genitores?.length && autor.genitores?.length && p.genitores.some(x => autor.genitores!.includes(x))) add(p, 1.2, dificil ? 'apoio' : p.temperamento.extroversao > 0.2 ? 'brincadeira' : 'parabens');
  const out: Comentario19[] = [];
  const pool = [...candidatos];
  while (pool.length && out.length < 3) {
    const tot = pool.reduce((s, x) => s + x.peso, 0);
    let u = r.next() * tot, k = 0;
    for (; k < pool.length - 1; k++) { u -= pool[k].peso; if (u <= 0) break; }
    const c = pool.splice(k, 1)[0];
    // Nem todo mundo comenta (a reservada só curte).
    if (c.tom !== 'ironia' && c.tom !== 'ciume' && c.p.temperamento.extroversao < -0.4 && r.chance(0.6)) continue;
    const frases = FRASES[c.tom];
    out.push({ pid: c.p.id, tom: c.tom, texto: frases[Math.floor(r.next() * frases.length)] });
  }
  return out;
}

/* ------------------------------------------------------------------ O feed */

/** Pode ver as publicações "só para amigos" desta pessoa? */
function amigoDe(vin: Vinculo): boolean {
  return !!vin.parentesco || vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo' || vin.proximidade >= 40 || (!!vin.romance && vin.romance.estagio !== 'ex');
}

/** Uma publicação a partir de um acontecimento da trajetória de alguém (ou nada, se a pessoa não postaria ou você não vê). */
export function publicacao19(v: Vida, p: Pessoa, vin: Vinculo | undefined, x: { t: number; texto: string; tipo: string }): Post19 | undefined {
  if (PRIVADO.test(x.texto)) return undefined;
  const i = idadePessoa(v, p);
  if (i < 13) return undefined;
  const famoso = !!p.celebridade15;
  const expo = famoso ? 3 : p.npc19?.exposicao ?? exposicaoDe19(p);
  if (expo < exposicaoPedida(x.tipo, x.texto)) return undefined;
  // Um romance escondido nunca vira publicação (nem o seu com ela, nem o dela).
  if (vin?.romance?.secreto && x.tipo === 'amor') return undefined;
  const publico: Post19['publico'] = famoso || expo >= 2 ? 'publico' : 'amigos';
  if (publico === 'amigos' && (!vin || !amigoDe(vin))) return undefined;
  const chave = `${p.id}:${x.t}:${x.tipo}`;
  const r = rngDe(v.id, 'post19', chave);
  const pl = plataformaDe(p, i, x.tipo, famoso, r.next());
  const formato = formatoDe(pl, x.tipo, x.texto, i, r.next());
  const kl = chaveLegenda(x.tipo, x.texto);
  const [animadas, contidas] = LEGENDAS[kl] ?? LEGENDAS.trabalho;
  const lista = p.temperamento.extroversao > -0.15 ? animadas : contidas;
  let legenda = lista[Math.floor(r.next() * lista.length)];
  if (x.tipo === 'lugar') { const m = /para ([^,.]+)/.exec(x.texto); if (m) legenda = `${legenda} ${m[1]}${p.temperamento.extroversao > 0.3 ? '! 📦' : '.'}`; }
  const seg = seguidores19(p, i);
  const eng = (ENGAJAMENTO[x.tipo] ?? 0.1) * (formato === 'video' ? 1.4 : formato === 'album' ? 1.2 : formato === 'texto' ? 0.7 : 1) * (famoso ? 0.25 : 1);
  const curtidas = Math.max(1, Math.round(seg * eng * (0.6 + r.next() * 0.8)));
  const destaque = comentaristas19(v, p, x.tipo, x.texto, chave);
  const comentarios = Math.max(destaque.length, Math.round(curtidas * (DIFICEIS19.has(x.tipo) ? 0.18 : 0.06)));
  const compartilhamentos = Math.round(curtidas * (famoso ? 0.08 : x.tipo === 'perda' ? 0.03 : 0.015));
  return {
    chave, pid: p.id, t: x.t, tipo: x.tipo, origem: x.texto, titulo: titulo(x.tipo, x.texto), legenda, formato, plataforma: pl, publico,
    curtidas, comentarios, compartilhamentos, destaque, famoso, dificil: DIFICEIS19.has(x.tipo) || /Separou|Terminou/i.test(x.texto),
    reacao: v.conectada19?.reacoes[chave] ?? (v.celular15?.curtidas?.includes(chave) ? { t: x.t, curtiu: true } : undefined)
  };
}

/**
 * O feed: as publicações dos últimos 24 meses de quem está na sua vida (e dos famosos que você segue), da mais nova
 * para a mais antiga. `pid`: só as de uma pessoa (o perfil). A mesma perda contada por dois irmãos aparece uma vez.
 */
export function feed19(v: Vida, o: { pid?: string; limite?: number } = {}): Post19[] {
  const out: Post19[] = [];
  const seguindo = new Set(v.conectada19?.seguindo ?? []);
  for (const { p, vin } of vinculosVivos(v)) {
    if (o.pid && p.id !== o.pid) continue;
    if (p.especie || !p.vivo || !p.nome || !p.vida?.trajetoria?.length) continue;
    if (vin.digital?.bloqueado !== undefined || (vin.ruptura && vin.estagio !== 'ex_amigo')) continue;
    if (vin.convivio.includes('casa') && !o.pid) {
      // Quem mora com você: você já sabe — só o que é grande (o filho, a formatura) aparece.
      if (!seguindo.has(p.id)) continue;
    }
    const janela = o.pid ? 60 : 24;
    for (const x of p.vida.trajetoria) {
      if (x.t < v.t - janela || x.t > v.t) continue;
      const post = publicacao19(v, p, vin, x);
      if (post) out.push(post);
    }
  }
  const vistos = new Set<string>();
  return out.sort((a, b) => b.t - a.t || (v.vinculos[b.pid]?.proximidade ?? 0) - (v.vinculos[a.pid]?.proximidade ?? 0) || (a.chave < b.chave ? -1 : 1))
    .filter(x => { const k = `${x.tipo}|${x.t}|${x.origem}`; if (x.tipo === 'perda' && vistos.has(k)) return false; vistos.add(k); return true; })
    .slice(0, o.limite ?? 40);
}

/* ------------------------------------------------------------------ Em alta (com origem) */

export interface Tendencia19 { id: string; texto: string; origem: string; pid?: string }

/** O que está em alta: tem de ter nascido de alguém do mundo simulado (o famoso que você conhece, você mesmo, o futebol). */
export function emAlta19(v: Vida): Tendencia19[] {
  const out: Tendencia19[] = [];
  for (const { p } of vinculosVivos(v)) {
    if (!p.celebridade15 || !p.vivo) continue;
    const x = [...(p.vida?.trajetoria ?? [])].reverse().find(t => v.t - t.t <= 12);
    if (x) out.push({ id: `fam:${p.id}:${x.t}`, texto: /polêmica/.test(x.texto) ? `${p.nome} na berlinda` : `${p.nome}: ${x.texto.replace(/\.$/, '')}`, origem: x.texto, pid: p.id });
  }
  const minhas = Object.values(v.redes?.contas ?? {}).flatMap(c => (c?.publicacoes ?? []).filter(pub => pub.viral && v.t - pub.t <= 12));
  if (minhas.length) out.push({ id: 'eu:viral', texto: 'Sua publicação está circulando', origem: 'Uma publicação sua viralizou neste ano.' });
  const liga = v.caminhos.ligas?.BR?.historico?.slice(-1)[0];
  if (liga?.liga) out.push({ id: `fut:${liga.ano}`, texto: `${liga.liga.replace(/^~/, '')}, campeão de ${liga.ano}`, origem: 'O campeonato nacional da temporada.' });
  return out.slice(0, 6);
}

/* ------------------------------------------------------------------ O perfil de alguém */

export interface Conexao19 { pid: string; nome: string; rotulo: string }

export interface Perfil19 {
  pid: string;
  idade: number;
  cidade: string;
  ocupacao?: string;
  seguidores: number;
  publico: 'publico' | 'amigos';
  /** O que é público da trajetória (o resto fica na ficha de quem é próximo). */
  marcos: string[];
  conexoes: Conexao19[];
  posts: Post19[];
}

/** O perfil de alguém na rede: só o que essa pessoa mostra, e só o que você pode ver. */
export function perfil19(v: Vida, pid: string): Perfil19 | undefined {
  const p = v.pessoas[pid];
  const vin = v.vinculos[pid];
  if (!p || !vin || p.especie) return undefined;
  const i = idadePessoa(v, p);
  const expo = p.celebridade15 ? 3 : p.npc19?.exposicao ?? exposicaoDe19(p);
  const ve = expo >= 2 || amigoDe(vin);
  const conexoes: Conexao19[] = [];
  const nome = (q: Pessoa) => q.nome;
  if (ve) {
    const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
    // A parceria aparece se a relação é pública (nunca o caso escondido — nem o seu com a pessoa).
    if (par?.vivo && !vin.romance?.secreto && par.id !== 'eu') conexoes.push({ pid: par.id, nome: nome(par), rotulo: p.npc19?.uniao?.tipo === 'casados' ? flex(par.genero, 'marido', 'esposa', 'cônjuge') : p.npc19?.uniao?.tipo === 'juntos' ? 'mora junto' : flex(par.genero, 'namorado', 'namorada', 'namorade') });
    for (const x of Object.values(v.pessoas)) if (x.vivo && !x.especie && x.genitores?.includes(p.id) && expo >= 1) conexoes.push({ pid: x.id, nome: nome(x), rotulo: flex(x.genero, 'filho', 'filha', 'filhe') });
    for (const l of p.npc19?.lacos ?? []) {
      const q = v.pessoas[l.id];
      if (!q?.vivo) continue;
      // A briga e o ex só aparecem para quem conta tudo; a amizade e o colega, para todos que veem o perfil.
      if ((l.tipo === 'rivalidade' || l.tipo === 'ex') && expo < 3) continue;
      conexoes.push({ pid: q.id, nome: nome(q), rotulo: l.tipo === 'amizade' ? (v.vinculos[q.id] ? 'amizade em comum' : 'amizade') : l.tipo === 'colega' ? 'colega' : l.tipo === 'ex' ? 'ex' : 'rivalidade' });
    }
  }
  const marcos = ve ? (p.vida?.trajetoria ?? []).filter(x => !PRIVADO.test(x.texto) && expo >= exposicaoPedida(x.tipo, x.texto)).slice(-5).reverse().map(x => x.texto) : [];
  return {
    pid, idade: i, cidade: municipio(p.municipioId).nome, ocupacao: ve ? p.ocupacao : undefined, seguidores: seguidores19(p, i),
    publico: expo >= 2 || p.celebridade15 ? 'publico' : 'amigos', marcos, conexoes: conexoes.slice(0, 10), posts: feed19(v, { pid, limite: 12 })
  };
}
