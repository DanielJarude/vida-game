/**
 * VIDA 30 · AS REDES COM MAIS VIDA (pedido no meio da atualização: "ver o que realmente publicou, o feed com mais coisas,
 * a Twitch com prévia do vídeo; filtros no aplicativo de namoro, o filtro de famosos; o casamento entre famosos virando
 * notícia").
 *
 *   O COTIDIANO   além dos grandes acontecimentos (VIDA 19: o emprego, a mudança, o filho), quem expõe a vida posta o dia
 *                 a dia — o prato, o treino, o pôr do sol, o bicho, o show, o meme —, no jeito dela e na rede da idade
 *                 dela. Lido de novo da chave (nada guardado), como os da VIDA 19; curtir e comentar funcionam igual.
 *   O SEU POST    a publicação sua vira post de verdade: a legenda que você escreveu (em primeira pessoa, lida do que a
 *                 vida tem — o nome do bicho, a viagem, a conquista, a obra), as curtidas e os comentários de quem reagiu,
 *                 cada um no tom da relação.
 *   A PRÉVIA      vídeo e live têm miniatura: o título, a categoria, a duração ou o "ao vivo" com espectadores.
 *   O MEIO        o que acontece entre as figuras públicas (`v30/fama/rede30`) — o casamento, o namoro assumido, a
 *                 separação, a parceria — vira matéria no jornal e assunto em alta.
 *
 * Sorteios derivados da chave (a mesma publicação aparece igual sempre). Só funções declaradas.
 */
import type { Pessoa, PlataformaId, Publicacao, Vida, Vinculo } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { idadePessoa } from '../../nucleo';
import { anoDe } from '../../tempo';
import type { Post19 } from '../../v19/conectada/feed19';
import { nomeDaFigura30, noticiasDoMeio30 } from '../fama/rede30';

/* ------------------------------------------------------------------ O cotidiano */

type Sub = 'prato' | 'treino' | 'por_do_sol' | 'bicho' | 'show' | 'meme' | 'livro' | 'cafe' | 'praia' | 'jogo' | 'selfie' | 'festa';
const LEG: Record<Sub, [string[], string[]]> = {
  prato: [['Domingo é dia de fazer a receita da vó! 😋', 'Testei aquele restaurante novo: aprovadíssimo!', 'Cozinhei pra galera e ninguém passou mal. Vitória!'], ['Almoço.', 'Jantar de hoje.']],
  treino: [['Treino pago, alma lavada! 💪', 'Primeira corrida de 10 km sem parar!', 'Segunda-feira e o foco tá aqui.'], ['Treino feito.', 'Mais um.']],
  por_do_sol: [['Esse céu não precisa de filtro!', 'Fim de tarde que vale o dia inteiro.'], ['Fim de tarde.', '🌅']],
  bicho: [['Olha a cara de culpado de quem comeu o meu chinelo 🙄', 'O verdadeiro dono da casa.', 'Nossa, que preguiça… dele, não minha.'], ['Ele.', 'Companhia.']],
  show: [['Que show! Ainda tô sem voz!', 'Fila de três horas e valeu cada minuto!'], ['Show.', 'Noite boa.']],
  meme: [['Eu às segundas-feiras, sem tirar nem pôr 😂', 'Marca aquele amigo que faz isso!'], ['Rindo sozinho aqui.', 'Verdade.']],
  livro: [['Terminei em dois dias e já quero recomeçar!', 'Livro do mês: recomendo demais.'], ['Lendo.', 'Recomendo.']],
  cafe: [['Café, a única relação estável da minha vida ☕', 'Bom dia só depois do segundo café!'], ['Café.', 'Bom dia.']],
  praia: [['Pé na areia e cabeça desligada 🌊', 'Fim de semana merecido!'], ['Mar.', 'Folga.']],
  jogo: [['Que jogo! O coração não aguenta!', 'Arquibancada lotada e a gente cantando junto!'], ['Jogo.', 'Estádio.']],
  selfie: [['Cabelo novo, quem aprova? 💇', 'Só passando pra dizer que hoje acordei bonit{o}.'], ['Eu.', 'Hoje.']],
  festa: [['A melhor festa do ano, e eu nem lembro o fim 😅', 'Aniversário de quem eu amo!'], ['Festa.', 'Noite boa.']]
};
const SUBS = Object.keys(LEG) as Sub[];

function exposicao(p: Pessoa): number { return p.celebridade15 ? 3 : p.npc19?.exposicao ?? (p.temperamento.extroversao > 0.3 ? 2 : p.temperamento.extroversao > -0.2 ? 1 : 0); }
function plataformaDoDia(i: number, u: number, famoso: boolean): PlataformaId { if (famoso) return u < 0.5 ? 'instagram' : u < 0.8 ? 'tiktok' : 'x'; if (i >= 58) return 'facebook'; if (i < 28) return u < 0.5 ? 'tiktok' : 'instagram'; return u < 0.7 ? 'instagram' : u < 0.85 ? 'x' : 'facebook'; }

/** Um post do dia a dia (pid, mês, número): sempre o mesmo para a mesma chave. */
export function postDoCotidiano30(v: Vida, p: Pessoa, t: number, k: number): Post19 | undefined {
  const i = idadePessoa(v, p);
  if (i < 13 || !p.vivo || p.especie) return undefined;
  const chave = `${p.id}:${t}:cotidiano:${k}`;
  const r = rngDe(v.id, 'cot30', chave);
  let sub = SUBS[Math.floor(r.next() * SUBS.length)];
  if (sub === 'jogo' && i > 70) sub = 'cafe';
  const famoso = !!p.celebridade15;
  const pl = plataformaDoDia(i, r.next(), famoso);
  const [animadas, contidas] = LEG[sub];
  const lista = p.temperamento.extroversao > -0.15 ? animadas : contidas;
  const legenda = lista[Math.floor(r.next() * lista.length)].replace(/\{o\}/g, p.genero === 'feminino' ? 'a' : 'o');
  const formato: Post19['formato'] = pl === 'tiktok' ? 'video' : pl === 'x' ? 'texto' : r.chance(0.2) ? 'story' : r.chance(0.2) ? 'album' : 'foto';
  const seg = famoso ? 200000 * p.celebridade15!.nivel : Math.round(80 + (p.temperamento.extroversao + 1) * 300 + (i < 30 ? 400 : 0));
  const curtidas = Math.max(1, Math.round(seg * (famoso ? 0.04 : 0.08) * (0.5 + r.next())));
  return { chave, pid: p.id, t, tipo: 'cotidiano', origem: '', titulo: '', legenda, formato, plataforma: pl, publico: exposicao(p) >= 2 || famoso ? 'publico' : 'amigos', curtidas, comentarios: Math.round(curtidas * 0.05), compartilhamentos: famoso ? Math.round(curtidas * 0.02) : 0, destaque: [], famoso, dificil: false,
    reacao: v.conectada19?.reacoes[chave] ?? (v.celular15?.curtidas?.includes(chave) ? { t, curtiu: true } : undefined) };
}

/** Os posts do dia a dia de alguém nos últimos 24 meses (quem expõe posta mais; o reservado, quase nada). */
export function cotidianoDe30(v: Vida, p: Pessoa, vin: Vinculo | undefined, janela = 24): Post19[] {
  const expo = exposicao(p);
  if (expo === 0 || (!p.celebridade15 && (!vin || vin.proximidade < 20))) return [];
  const out: Post19[] = [];
  const porAno = expo >= 3 ? 4 : expo === 2 ? 3 : 1;
  for (let ano = anoDe(v.t) - 1; ano <= anoDe(v.t); ano++) for (let k = 0; k < porAno; k++) {
    const r = rngDe(v.id, 'cot30_t', p.id, ano, k);
    const t = ano * 12 + Math.floor(r.next() * 12);
    if (t > v.t || t < v.t - janela) continue;
    const post = postDoCotidiano30(v, p, t, k);
    if (post && (post.publico === 'publico' || (vin && (vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo' || !!vin.parentesco || !!vin.romance)))) out.push(post);
  }
  return out;
}

/* ------------------------------------------------------------------ O seu post */

const LEGENDA_PROPRIA: Partial<Record<string, string[]>> = {
  viagem: ['Lugar novo, cabeça nova. Já quero voltar!', 'Fotos não fazem justiça, mas tentei 🌍'],
  trabalho: ['Mais um dia de luta. Bora!', 'Ninguém vê o que tem por trás — hoje eu mostro.'],
  bastidores: ['O que ninguém vê do meu dia 👀', 'Bastidores, sem filtro.'],
  conquista: ['Não foi sorte. Foi muito trabalho. Obrigad{o} a quem esteve junto!', 'Chegou o dia. Que orgulho!'],
  musica: ['Gravei de primeira, deixa os erros aí 🎶', 'Uma música que eu precisava cantar.'],
  pet: ['O verdadeiro dono da casa.', 'Ninguém me avisou que ele ia roubar a cena de novo.'],
  familia: ['O melhor de mim mora aqui.', 'Domingo é sagrado.'],
  opiniao: ['Vou falar mesmo, e quem quiser que discorde.', 'Opinião impopular, mas é a minha.'],
  humor: ['Eu juro que não ensaiei isso 😂', 'A minha vida é uma piada — pelo menos é engraçada.'],
  esporte: ['Foco no próximo jogo. ⚽', 'Treino pago. Amanhã tem mais.'],
  receita: ['Receita de família, agora é de vocês também.', 'Deu errado na primeira vez. Na segunda, ficou assim 😋'],
  estilo: ['Look do dia. Aprovam?', 'Me arrumei só pra tirar foto, confesso.'],
  jogo: ['Live até tarde de novo. Quem tava lá sabe 🎮', 'Partida insana hoje!'],
  divulgar: ['Saiu! Corre lá e me conta o que achou.', 'Muito trabalho por trás disso. Está no ar!'],
  estudo: ['Café, livro e foco. Vamos!', 'A prova que lute.'],
  conversa: ['Obrigad{o} a quem ficou até o fim da live! Vocês são demais.', 'Quem perdeu a live de ontem perdeu as melhores histórias.', 'Chat mais engraçado da internet, sem discussão 😂'],
  arte: ['Feito à mão, do jeito que eu gosto.', 'Horas nisso. Valeu cada uma.'],
  tutorial: ['Aprendi errando — agora vocês não precisam.', 'Salva aí pra não esquecer!'],
  comunidade: ['Bora ajudar? Compartilhem!', 'O bairro é de todo mundo.'],
  musica_live: ['Vocês pediram, eu toquei 🎸']
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A legenda que você escreveu (em primeira pessoa) — com o detalhe que a sua vida tem (o que a publicação mostrou). */
export function legendaPropria30(v: Vida, pub: Publicacao, n = 0): string {
  const r = rngDe(v.id, 'leg30', pub.id);
  const lista = LEGENDA_PROPRIA[pub.tema] ?? ['Só passando pra deixar isso aqui.', 'Um pedaço do meu dia.', 'Hoje foi assim.', 'Sem legenda, só sentimento.'];
  const base = lista[(Math.floor(r.next() * lista.length) + n) % lista.length].replace(/\{o\}/g, v.eu.genero === 'feminino' ? 'a' : 'o');
  return base;
}

/** Os comentários de quem reagiu (pessoas da sua vida), no tom da relação. */
export function comentariosProprios30(v: Vida, pub: Publicacao): { pid: string; nome: string; texto: string }[] {
  const out: { pid: string; nome: string; texto: string }[] = [];
  for (const pid of (pub.pessoas ?? []).slice(0, 3)) {
    const p = v.pessoas[pid];
    const vin = v.vinculos[pid];
    if (!p) continue;
    const r = rngDe(v.id, 'com30', pub.id, pid);
    const tom = pub.polemica ? (vin && vin.tensao >= 30 ? 'contra' : 'cuidado') : vin?.romance ? 'amor' : vin?.parentesco === 'mae' || vin?.parentesco === 'pai' || vin?.parentesco === 'avo' ? 'familia' : vin && vin.tensao >= 35 ? 'farpa' : 'amigo';
    const FRASES: Record<string, string[]> = {
      contra: ['Apaga isso enquanto dá tempo.', 'Discordo totalmente.', 'Que vergonha.'],
      cuidado: ['Cuidado com o que você posta, viu?', 'Me liga depois.'],
      amor: ['Te amo ❤️', 'Que orgulho de você!', 'Meu lugar favorito é do seu lado.'],
      familia: ['Que lindo, meu amor! Saudade!', 'Deus abençoe 🙏', 'Liga pra sua mãe!'],
      farpa: ['Hum. Tá bom, então.', 'Já vi melhores 😏'],
      amigo: ['Kkkkkk demais!', 'Você é muito você 😂', 'Arrasou!', 'Quando é a próxima?']
    };
    const l = FRASES[tom];
    out.push({ pid, nome: p.nome, texto: l[Math.floor(r.next() * l.length)] });
  }
  return out;
}

/** As curtidas de uma publicação sua (pelo alcance e pela reação). */
export function curtidasProprias30(pub: Publicacao): number {
  return Math.max(pub.pessoas?.length ?? 0, Math.round(pub.alcance * (pub.viral ? 0.09 : pub.polemica ? 0.03 : 0.06)));
}

/* ------------------------------------------------------------------ A prévia de vídeo e de live */

export interface Previa30 { titulo: string; categoria: string; aoVivo: boolean; espectadores?: number; duracao?: string; visualizacoes?: number }

const CATEGORIA: Partial<Record<string, string>> = { jogo: 'Games', musica: 'Música', conversa: 'Só na conversa', receita: 'Comida', esporte: 'Esportes', tutorial: 'Aula', humor: 'Humor', viagem: 'Viagens', arte: 'Arte', estudo: 'Estudo' };
const TITULO_LIVE: Partial<Record<string, string[]>> = {
  jogo: ['RANQUEADA ATÉ SUBIR (ou até cair) | !discord', 'Zerando hoje, sem desistir | chat decide', 'Campeonato com os inscritos 🏆'],
  musica: ['Pedidos do chat ao vivo 🎸', 'Voz e violão até a meia-noite'],
  conversa: ['Bate-papo: perguntem qualquer coisa', 'Reagindo aos vídeos de vocês', 'Contando a história que eu nunca contei', 'Respondendo o chat até o sono vencer', 'Vida real: como foi a minha semana'],
  arte: ['Desenhando ao vivo: o chat escolhe o tema', 'Do rascunho ao final, sem cortes'],
  tutorial: ['Aula aberta: do zero ao avançado', 'Tirando as dúvidas de vocês'],
  receita: ['Cozinhando ao vivo (vai dar errado?)'],
  esporte: ['Treino ao vivo + perguntas'],
  humor: ['Lendo os piores comentários do mês 😂']
};

/** A miniatura de uma publicação sua em vídeo (YouTube, TikTok) ou live (Twitch). */
export function previaPropria30(v: Vida, pl: PlataformaId, pub: Publicacao, n = 0): Previa30 | undefined {
  if (pl !== 'twitch' && pl !== 'youtube' && pl !== 'tiktok') return undefined;
  const r = rngDe(v.id, 'prev30', pub.id);
  const categoria = CATEGORIA[pub.tema] ?? 'Vlog';
  if (pl === 'twitch') {
    const ts = TITULO_LIVE[pub.tema] ?? ['Ao vivo com vocês'];
    // (A posição do post na conta gira o título: duas lives seguidas não têm o mesmo nome.)
    return { titulo: ts[(Math.floor(r.next() * ts.length) + n) % ts.length], categoria, aoVivo: true, espectadores: Math.max(1, Math.round(pub.alcance * (0.02 + r.next() * 0.04))) };
  }
  const min = pl === 'tiktok' ? 0 : 4 + Math.floor(r.next() * 16);
  const seg = Math.floor(r.next() * 60);
  return { titulo: cap(pub.texto.replace(/\.$/, '')), categoria, aoVivo: false, duracao: `${min}:${String(seg).padStart(2, '0')}`, visualizacoes: pub.alcance };
}
/** A prévia de um vídeo de alguém (feed). */
export function previaDoPost30(post: Post19): Previa30 | undefined {
  if (post.formato !== 'video') return undefined;
  const r = rngDe('prev30p', post.chave);
  return { titulo: post.legenda.replace(/^"|"$/g, ''), categoria: post.tipo === 'cotidiano' ? 'Vlog' : 'Novidade', aoVivo: false, duracao: `0:${String(12 + Math.floor(r.next() * 47)).padStart(2, '0')}`, visualizacoes: post.curtidas * 12 };
}

/* ------------------------------------------------------------------ O meio vira notícia */

export interface MateriaDoMeio30 { id: string; titulo: string; linha: string; ano: number; tom?: 'bom' | 'ruim'; destaque: boolean }

/** As matérias do meio no último ano: os casamentos, os namoros assumidos e as separações primeiro (sem repetir o par). */
export function materiasDoMeio30(v: Vida): MateriaDoMeio30[] {
  const out: MateriaDoMeio30[] = [];
  const pares = new Set<string>();
  for (const n of noticiasDoMeio30(v, 1)) {
    const f = n.figura;
    const m = /^(casou com|assumiu o namoro com|terminou com|separou-se de|fez uma parceria com) (.+)$/.exec(n.texto);
    if (m) {
      const outro = m[2];
      const chave = [nomeDaFigura30(f), outro].sort().join('|') + m[1].slice(0, 4);
      if (pares.has(chave)) continue;
      pares.add(chave);
      const verbo = m[1];
      const titulo = verbo === 'casou com' ? `${nomeDaFigura30(f)} e ${outro} se casam` : verbo === 'assumiu o namoro com' ? `${nomeDaFigura30(f)} e ${outro} assumem o namoro` : verbo === 'fez uma parceria com' ? `${nomeDaFigura30(f)} e ${outro} anunciam parceria` : `${nomeDaFigura30(f)} e ${outro}: fim da relação`;
      out.push({ id: `meio:${f.id}:${n.ano}:${verbo}`, titulo, linha: verbo === 'casou com' ? `Cerimônia para convidados, fotos disputadas e ${f.oficio} emocionad${f.genero === 'feminino' ? 'a' : 'o'} no altar.` : verbo === 'assumiu o namoro com' ? 'A foto juntos nas redes confirmou o que todo mundo comentava.' : verbo === 'fez uma parceria com' ? 'Os dois prometem novidade ainda este ano.' : 'A assessoria pede respeito ao momento.', ano: n.ano, tom: verbo.startsWith('casou') || verbo.startsWith('assumiu') ? 'bom' : verbo.startsWith('fez') ? undefined : 'ruim', destaque: verbo === 'casou com' });
    } else if (n.tom || /polêmica|encerrou|nomes do ano/.test(n.texto)) {
      out.push({ id: `meio:${f.id}:${n.ano}:${n.texto.slice(0, 12)}`, titulo: `${nomeDaFigura30(f)}, ${f.oficio}, ${n.texto}`, linha: 'No meio, só se fala nisso.', ano: n.ano, tom: n.tom, destaque: false });
    }
  }
  return out.sort((a, b) => Number(b.destaque) - Number(a.destaque) || b.ano - a.ano).slice(0, 6);
}

/** Limites de segurança para os números da prévia (para a tela). */
export const limitarEspectadores30 = (x: number) => clamp(x, 1, 5_000_000);
