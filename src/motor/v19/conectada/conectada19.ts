/**
 * VIDA 19 · VIDA CONECTADA — o que VOCÊ faz na rede dos outros, e o que a rede faz com as relações.
 *
 *   CURTIR        aproxima pouco (a primeira do ano com cada pessoa; a mesma marca de antes, `cel15c_…`). Curtir a foto
 *                 de um ex com a parceria olhando pode pesar (o ciúme é do jeito dela, uma vez por ano).
 *   COMENTAR      o tom é seu e o efeito é da relação: o apoio numa hora difícil fica na história de vocês; a brincadeira
 *                 com quem não tem intimidade pode não pegar bem; a provocação a um rival vira briga pública (e, para
 *                 quem tem nome, polêmica). Famosos às vezes respondem — mais a quem também é conhecido.
 *   COMPARTILHAR  espalha a notícia de quem você gosta.
 *   MENSAGEM      a conversa que começa da publicação entra no histórico de Mensagens (a mesma conversa com a pessoa),
 *                 com o assunto; é você quem escreve, então não consome a cota de mensagens recebidas do ano.
 *   SEGUIR        acompanhar alguém de perto (o famoso que você conhece; quem mora com você).
 *
 * Nenhuma curtida ou comentário vira mensagem recebida, nem chamado em "Pede atenção": a rede é a vida pública.
 * A Linha da Vida só recebe o que é marcante (a briga pública, o famoso que respondeu). Sorteios: `rngDe` da publicação.
 */
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { Pessoa, Vida, Vinculo } from '../../tipos';
import type { Conectada19, TomComentario19 } from '../../dados19/tipos';
import type { Msg15 } from '../../dados15/celular/tipos';
import { escrever, idade, lembrarCom, parceiro, vinculosVivos } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { somarAoNome } from '../../sistemas/notoriedade';
import { anoDe } from '../../tempo';
import { flex } from '../../texto';
import { ajustarLaco, laco } from '../npcs/vidas19';
import { publicacao19, type Post19 } from './feed19';

export type OqueConectada19 =
  | { op: 'curtir'; chave: string }
  | { op: 'comentar'; chave: string; tom: TomComentario19 }
  | { op: 'compartilhar'; chave: string }
  | { op: 'mensagem'; chave: string }
  | { op: 'seguir'; pid: string }
  | { op: 'deixar_de_seguir'; pid: string };

export const ROTULO_TOM19: Record<TomComentario19, string> = {
  apoio: 'Deixar apoio', parabens: 'Dar parabéns', brincadeira: 'Brincar', discordar: 'Discordar', provocar: 'Provocar', ciume: 'Cobrar'
};

const LIMITE_REACOES = 240;
const DMS_POR_ANO = 8;

function estado(v: Vida): Conectada19 { return (v.conectada19 ??= { reacoes: {} }); }

/** A publicação de uma chave (`pid:t:tipo`), lida de novo da trajetória (nunca guardada). */
export function postDaChave19(v: Vida, chave: string): Post19 | undefined {
  const [pid, tS, tipo] = chave.split(':');
  const p = v.pessoas[pid];
  if (!p?.vida?.trajetoria) return undefined;
  const x = p.vida.trajetoria.find(e => e.t === Number(tS) && e.tipo === tipo);
  return x ? publicacao19(v, p, v.vinculos[pid], x) : undefined;
}

/** Os tons que cabem num comentário (pelo acontecimento e pela relação). */
export function tonsPara19(v: Vida, post: Post19): TomComentario19[] {
  const vin = v.vinculos[post.pid];
  if (post.dificil) return ['apoio'];
  const out: TomComentario19[] = ['parabens', 'brincadeira'];
  if (post.famoso || post.titulo === 'Polêmica') out.push('discordar');
  if (vin && (vin.estagio === 'rival' || vin.tensao >= 35 || vin.romance?.estagio === 'ex' || vin.estagio === 'ex_amigo')) out.push('provocar');
  return out;
}

const humano = (p: Pessoa | undefined): p is Pessoa => !!p && !p.especie && p.vivo && !!p.nome;

export function disponibilidadeConectada19(v: Vida, q: OqueConectada19): Veredito {
  if (idade(v) < 13) return bloqueio('requisito', 'Rede social é a partir dos 13.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Na prisão, sem celular nem rede.');
  if (v.morte) return bloqueio('impossivel', 'A história terminou.');
  if (q.op === 'seguir' || q.op === 'deixar_de_seguir') {
    if (!v.vinculos[q.pid] || !humano(v.pessoas[q.pid])) return bloqueio('impossivel', 'Essa pessoa não está na sua rede.');
    const segue = (v.conectada19?.seguindo ?? []).includes(q.pid);
    return q.op === 'seguir' ? (segue ? bloqueio('incompativel', 'Você já segue.') : PERMITIDO) : (segue ? PERMITIDO : bloqueio('incompativel', 'Você não segue.'));
  }
  const post = postDaChave19(v, q.chave);
  if (!post || !v.vinculos[post.pid] || !humano(v.pessoas[post.pid])) return bloqueio('impossivel', 'Essa publicação não está mais no seu feed.');
  const r = v.conectada19?.reacoes[q.chave];
  switch (q.op) {
    case 'curtir': return r?.curtiu || v.celular15?.curtidas?.includes(q.chave) ? bloqueio('incompativel', 'Já curtiu.') : PERMITIDO;
    case 'comentar':
      if (r?.comentou) return bloqueio('incompativel', 'Você já comentou aqui.');
      return tonsPara19(v, post).includes(q.tom) ? PERMITIDO : bloqueio('incompativel', 'Esse tom não cabe nessa publicação.');
    case 'compartilhar': return r?.compartilhou ? bloqueio('incompativel', 'Já compartilhou.') : post.dificil && post.tipo !== 'perda' ? bloqueio('incompativel', 'Não é algo para espalhar.') : PERMITIDO;
    case 'mensagem': {
      if (r?.dm) return bloqueio('incompativel', 'Vocês já conversaram sobre isso: a conversa está em Mensagens.');
      const d = v.conectada19?.dmsNoAno;
      if (d && d.ano === anoDe(v.t) && d.n >= DMS_POR_ANO) return bloqueio('incompativel', 'Você já puxou muitas conversas pela rede este ano.');
      const vin = v.vinculos[post.pid];
      if (vin.digital?.bloqueado !== undefined) return bloqueio('impossivel', 'Você está bloqueado.');
      return PERMITIDO;
    }
  }
}

export interface SaidaConectada19 { texto: string; pessoaId?: string; tom?: 'bom' | 'ruim' | 'neutro' }

function reagir(v: Vida, chave: string) {
  const c = estado(v);
  const r = (c.reacoes[chave] ??= { t: v.t });
  const ks = Object.keys(c.reacoes);
  if (ks.length > LIMITE_REACOES) { ks.sort((a, b) => c.reacoes[a].t - c.reacoes[b].t); for (const k of ks.slice(0, ks.length - LIMITE_REACOES)) delete c.reacoes[k]; }
  return r;
}

const perto = (vin: Vinculo, n: number) => { vin.proximidade = clamp(vin.proximidade + n); };

export function executarConectada19(v: Vida, _r: Rng, q: OqueConectada19): SaidaConectada19 {
  const c = estado(v);
  if (q.op === 'seguir') { (c.seguindo ??= []).push(q.pid); return { texto: `Você passou a seguir ${v.pessoas[q.pid].nome}.` }; }
  if (q.op === 'deixar_de_seguir') { c.seguindo = (c.seguindo ?? []).filter(x => x !== q.pid); return { texto: `Você deixou de seguir ${v.pessoas[q.pid].nome}.` }; }
  const post = postDaChave19(v, q.chave)!;
  const p = v.pessoas[post.pid];
  const vin = v.vinculos[post.pid];
  const rr = rngDe(v.id, 'reacao19', q.chave, q.op);
  const re = reagir(v, q.chave);
  const primeiraDoAno = () => { const k = `cel15c_${p.id}_${anoDe(v.t)}`; if (v.fatos[k] !== undefined) return false; v.fatos[k] = v.t; return true; };
  switch (q.op) {
    case 'curtir': {
      re.curtiu = true;
      const l = ((v.celular15 ??= { ano: anoDe(v.t), msgs: [] }).curtidas ??= []);
      if (!l.includes(q.chave)) { l.push(q.chave); if (l.length > 160) l.splice(0, l.length - 160); }
      if (primeiraDoAno()) perto(vin, 1);
      const ciume = ciumeDaParceria(v, p, vin, q.chave, 'curtiu a publicação');
      return ciume ?? { texto: '' };
    }
    case 'comentar': {
      re.comentou = q.tom;
      return comentar(v, rr, post, p, vin, q.tom, primeiraDoAno());
    }
    case 'compartilhar': {
      re.compartilhou = true;
      perto(vin, 1);
      return { texto: `Você compartilhou a publicação de ${p.nome}.` };
    }
    case 'mensagem': {
      re.dm = true;
      const d = c.dmsNoAno && c.dmsNoAno.ano === anoDe(v.t) ? c.dmsNoAno : (c.dmsNoAno = { ano: anoDe(v.t), n: 0 });
      d.n++;
      return mensagemDoPost(v, rr, post, p, vin);
    }
  }
}

/** A parceria vê você reagindo à publicação de um ex (ou de quem você está de olho): o ciúme é do jeito dela, uma vez por ano. */
function ciumeDaParceria(v: Vida, p: Pessoa, vin: Vinculo, chave: string, oque: string): SaidaConectada19 | undefined {
  const par = parceiro(v);
  if (!par || par.p.id === p.id) return undefined;
  const romantico = vin.romance?.estagio === 'ex' || vin.romance?.estagio === 'interesse';
  if (!romantico) return undefined;
  const k = `ciume19_${anoDe(v.t)}`;
  if (v.fatos[k] !== undefined) return undefined;
  const chance = 0.25 + Math.max(0, -par.p.temperamento.estabilidade) * 0.4 + (vin.romance?.estagio === 'ex' ? 0.15 : 0);
  if (!rngDe(v.id, 'ciume19', chave).chance(chance)) return undefined;
  v.fatos[k] = v.t;
  par.vin.tensao = clamp(par.vin.tensao + 7);
  lembrarCom(v, par.p.id, `Viu você ${oque === 'curtiu a publicação' ? 'curtindo a foto' : 'comentando a publicação'} de ${p.nome}.`, 'conflito', 1);
  return { texto: `${par.p.nome} viu que você ${oque} de ${p.nome}. O clima pesou em casa.`, pessoaId: par.p.id, tom: 'ruim' };
}

function comentar(v: Vida, r: Rng, post: Post19, p: Pessoa, vin: Vinculo, tom: TomComentario19, primeira: boolean): SaidaConectada19 {
  const ela = flex(p.genero, 'ele', 'ela', 'elu');
  switch (tom) {
    case 'apoio':
      perto(vin, 4);
      vin.confianca = clamp(vin.confianca + 3);
      lembrarCom(v, p.id, `Você deixou apoio quando ${ela} contou: "${post.origem.replace(/\.$/, '')}".`, 'apoio', 1);
      return { texto: `${p.nome} respondeu com um coração. O apoio em público conta.`, pessoaId: p.id, tom: 'bom' };
    case 'parabens':
      perto(vin, primeira ? 2 : 1);
      return famosoResponde(v, r, p, vin) ?? { texto: '' };
    case 'brincadeira': {
      const intimo = vin.proximidade >= 45 || p.temperamento.extroversao > 0.2;
      if (intimo || !r.chance(0.35 + Math.max(0, -p.temperamento.afabilidade) * 0.3)) {
        perto(vin, 3);
        return famosoResponde(v, r, p, vin) ?? { texto: `${p.nome} riu da brincadeira.`, tom: 'bom' };
      }
      vin.tensao = clamp(vin.tensao + 5);
      return { texto: `A brincadeira não pegou bem: ${p.nome} apagou o comentário.`, pessoaId: p.id, tom: 'ruim' };
    }
    case 'discordar': {
      vin.tensao = clamp(vin.tensao + 4);
      const conhecido = (v.notoriedade?.valor ?? 0) >= 30;
      if (conhecido) { somarAoNome(v, 'rede', 1); v.fatos['vis_polemica'] = v.t; }
      return { texto: conhecido ? `Seu comentário discordando de ${p.nome} rodou: gente dos dois lados entrou na discussão.` : `Você discordou de ${p.nome} nos comentários.`, pessoaId: p.id, tom: 'neutro' };
    }
    case 'provocar': {
      vin.tensao = clamp(vin.tensao + 12);
      perto(vin, -4);
      if (vin.tensao >= 60 && !vin.parentesco && !vin.romance && vin.estagio !== 'rival') vin.estagio = 'rival';
      lembrarCom(v, p.id, 'A provocação nos comentários virou briga pública.', 'conflito', 2);
      const conhecido = (v.notoriedade?.valor ?? 0) >= 30;
      if (conhecido) { somarAoNome(v, 'rede', 2); v.fatos['vis_polemica'] = v.t; }
      escrever(v, { texto: `Você provocou ${p.nome} nos comentários. A discussão ficou pública${conhecido ? ' e saiu nos sites de fofoca' : ''}.`, relevancia: 'cotidiano', tema: 'amizade', tom: 'ruim', pessoas: [p.id] });
      return { texto: `${p.nome} respondeu à altura. Todo mundo viu.`, pessoaId: p.id, tom: 'ruim' };
    }
    case 'ciume':
      vin.tensao = clamp(vin.tensao + 6);
      return { texto: `${p.nome} não gostou da cobrança em público.`, pessoaId: p.id, tom: 'ruim' };
  }
}

/** O famoso responde (às vezes; mais a quem também é conhecido). Uma vez por pessoa. */
function famosoResponde(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): SaidaConectada19 | undefined {
  if (!p.celebridade15) return undefined;
  const k = `fam19_resp_${p.id}`;
  if (v.fatos[k] !== undefined) return undefined;
  if (!r.chance(0.08 + (v.notoriedade?.valor ?? 0) / 200)) return undefined;
  v.fatos[k] = v.t;
  perto(vin, 6);
  lembrarCom(v, p.id, 'Respondeu a um comentário seu na rede.', 'amizade', 2);
  escrever(v, { texto: `${p.nome} respondeu ao seu comentário. Os amigos mandaram print.`, relevancia: 'biografia', tema: 'amizade', tom: 'bom', pessoas: [p.id] });
  return { texto: `${p.nome} respondeu ao seu comentário!`, pessoaId: p.id, tom: 'bom' };
}

/** A conversa que começa da publicação: entra em Mensagens (você escreveu; a resposta é da pessoa). */
function mensagemDoPost(v: Vida, r: Rng, post: Post19, p: Pessoa, vin: Vinculo): SaidaConectada19 {
  const cel = (v.celular15 ??= { ano: anoDe(v.t), msgs: [] });
  const minha = post.dificil
    ? r.pick(['Vi o que você postou. Tô aqui, viu? Pra qualquer coisa.', 'Li agora. Sinto muito. Quer conversar?'])
    : post.famoso ? r.pick(['Vi seu post! Que fase, hein. Parabéns de verdade.', 'Acompanhei pela rede. Muito feliz por você!'])
      : r.pick(['Vi seu post! Me conta tudo.', 'Que notícia boa! Quero saber os detalhes.', 'Vi aqui na rede. Que demais!']);
  const calor = vin.proximidade / 100 + p.temperamento.afabilidade * 0.2 + p.temperamento.extroversao * 0.1 - vin.tensao / 150 - (post.famoso && vin.proximidade < 40 ? 0.35 : 0);
  const responde = r.chance(clamp(0.5 + calor * 0.5, 0.1, 0.96));
  let resposta: string;
  let tom: SaidaConectada19['tom'] = 'neutro';
  vin.tUltimoContato = v.t;
  (vin.digital ??= {}).mensagem = v.t;
  if (!responde) resposta = r.pick(['Visualizou. Não respondeu.', `${p.nome} não respondeu.`]);
  else if (post.dificil) {
    resposta = r.pick(['"Obrigad{o}. Ajuda mais do que você imagina."', '"Valeu por lembrar de mim. Tá puxado, mas vai passar."']).replace('{o}', flex(p.genero, 'o', 'a', 'e'));
    perto(vin, 5); vin.confianca = clamp(vin.confianca + 4);
    lembrarCom(v, p.id, 'Você escreveu quando viu a notícia difícil na rede.', 'apoio', 1);
    tom = 'bom';
  } else {
    resposta = calor > 0.45 ? r.pick(['"Aiii, obrigad{o}! Vamos marcar pra eu te contar direito!"', '"Nem acredito ainda! Saudade, viu?"']).replace('{o}', flex(p.genero, 'o', 'a', 'e')) : r.pick(['"Valeu!"', '"Obrigad{o} :)"']).replace('{o}', flex(p.genero, 'o', 'a', 'e'));
    perto(vin, calor > 0.45 ? 3 : 1);
    tom = 'bom';
  }
  const m: Msg15 = { id: `d19_${p.id}_${v.t}_${post.t}`, t: v.t, tipo: 'escrita', de: p.id, texto: minha, assunto: 'post', cartao: `${post.titulo}: ${post.legenda}`, lida: true, resposta: { op: responde ? 'respondeu' : 'silencio', t: v.t, texto: resposta } };
  cel.msgs.push(m);
  return { texto: responde ? `${p.nome} respondeu. A conversa está em Mensagens.` : `${p.nome} não respondeu.`, pessoaId: p.id, tom };
}

/* ================================================================== O ano: o que se disse na rede mexe nos laços */

/**
 * As publicações do ano que passou e quem comentou (o mesmo cálculo que o feed mostra): o apoio e o parabéns aproximam
 * os dois; a indireta do rival e o ciúme do ex afastam. Só entre pessoas do mundo (você não entra aqui).
 */
export function processarConectada19(v: Vida): void {
  let n = 0;
  for (const { p, vin } of vinculosVivos(v)) {
    if (n >= 24 || !p.npc19 || !p.vida?.trajetoria) continue;
    for (const x of p.vida.trajetoria) {
      if (x.t <= v.t - 12 || x.t > v.t) continue;
      const post = publicacao19(v, p, vin, x);
      if (!post) continue;
      for (const c of post.destaque) {
        const q = v.pessoas[c.pid];
        if (!q || !laco(p, q.id)) continue;
        const delta = c.tom === 'ironia' ? -8 : c.tom === 'ciume' ? -10 : 3;
        ajustarLaco(v, p, q, delta, c.tom === 'ironia' ? 'Uma indireta nos comentários.' : c.tom === 'ciume' ? 'Ciúme nos comentários.' : undefined);
        n++;
      }
    }
  }
}
