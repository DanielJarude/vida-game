/**
 * Redes sociais 1.0 (REWORK 4): o Mural.
 *
 * Não é um contador de seguidores ao lado da vida. A rede conversa com:
 *   - as PESSOAS: quem segue você reage ao que você publica; o amigo que mudou
 *     de país comenta a foto da viagem e a conversa recomeça (`digital.mensagem`);
 *     curtir mantém o contato, não a intimidade (`social.desgaste`); bloquear
 *     o ex põe distância de verdade; bloquear um amigo é uma briga;
 *   - a VIDA: o que dá para publicar sai do que aconteceu (a viagem, o trabalho,
 *     a conquista, o bicho, a arte que você pratica, a câmera que você tem);
 *   - o NOME: quem é famoso ganha seguidores; muitos seguidores dão nome
 *     (`notoriedade`, fonte 'rede');
 *   - o DINHEIRO: monetizar (com seguidores e credibilidade), promover
 *     publicação (custa), comprar seguidores (barato — e, se descobrirem, a
 *     credibilidade vai junto com eles);
 *   - a LINHA DA VIDA: criar a conta, viralizar, os patamares, o escândalo.
 *
 * É simulação interna: nada sai do aparelho. Sorteios derivados (`rngDe`).
 */

import type { ContaSocial, Pessoa, Publicacao, TemaPublicacao, Vida } from '../tipos';
import { PERMITIDO, bloqueio, type Veredito } from '../plausibilidade';
import { clamp, rngDe } from '../rng';
import { escrever, idade, idadePessoa, novoId } from '../nucleo';
import { flex } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { pagar, vereditoDePagar } from './dinheiro';
import { habilidade } from './frentes';
import { temCoisa } from './coisas';
import { petsDaCasa } from './pets';
import { contaAtiva, PLATAFORMA_PADRAO, PLATAFORMAS, seguidoresEmPalavras } from './redesBase';
import { estadoDaRelacao } from './lacos';

export type OpRede =
  | { oque: 'criar' }
  | { oque: 'publicar'; tema: TemaPublicacao; promover?: boolean }
  | { oque: 'seguir' | 'deixar' | 'bloquear' | 'desbloquear'; pessoaId: string }
  | { oque: 'apagar_publicacao'; id: string }
  | { oque: 'apagar_conta' }
  | { oque: 'monetizar' }
  | { oque: 'comprar'; pacote: 0 | 1 | 2 };

export const PACOTES = [{ n: 1000, custo: 150, perde: 12 }, { n: 10000, custo: 1200, perde: 22 }, { n: 50000, custo: 5000, perde: 32 }] as const;
const custoLocal = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 10) * 10;
export const custoDoPacote = (v: Vida, k: 0 | 1 | 2) => custoLocal(v, PACOTES[k].custo);
export const custoDePromover = (v: Vida) => custoLocal(v, 300);
const PUBLICACOES_POR_ANO = 6;
const doAno = (v: Vida, c: ContaSocial) => c.publicacoes.filter(p => Math.floor(p.t / 12) === Math.floor(v.t / 12));

/* --------------------------------------------------------------- Temas */

const ultimaViagem = (v: Vida) => [...v.biografia].reverse().find(e => v.t - e.t <= 12 && /^Viajou para /.test(e.texto))?.texto.match(/^Viajou para ([^(,.]+)/)?.[1]?.trim();
const ARTES = [['fotografia', 'uma série de fotos'], ['musica', 'um vídeo tocando'], ['desenho', 'um desenho novo'], ['escrita', 'um texto'], ['danca', 'um vídeo dançando']] as const;

/** O que dá para publicar agora — sai do que a vida tem. */
export function temasPossiveis(v: Vida): { tema: TemaPublicacao; rotulo: string }[] {
  const out: { tema: TemaPublicacao; rotulo: string }[] = [{ tema: 'cotidiano', rotulo: 'Uma foto do dia' }];
  const viagem = ultimaViagem(v);
  if (viagem) out.push({ tema: 'viagem', rotulo: `As fotos de ${viagem}` });
  if (v.trabalho.atual) out.push({ tema: 'trabalho', rotulo: 'Algo do trabalho' });
  const conq = v.caminhos.marcas.filter(m => v.t - m.t <= 12 && m.peso >= 2).pop();
  if (conq) out.push({ tema: 'conquista', rotulo: 'Contar uma conquista' });
  const arte = ARTES.find(([d]) => habilidade(v, d) >= 25);
  if (arte) out.push({ tema: 'arte', rotulo: `Mostrar ${arte[1]}` });
  if (petsDaCasa(v).length) out.push({ tema: 'pet', rotulo: `Uma foto de ${petsDaCasa(v)[0].nome}` });
  if (Object.values(v.vinculos).some(x => x.convivio.includes('casa') && (x.parentesco === 'filho' || x.romance))) out.push({ tema: 'familia', rotulo: 'Um momento em família' });
  if (idade(v) >= 16) out.push({ tema: 'opiniao', rotulo: 'Dar uma opinião forte' });
  return out;
}

function textoDaPublicacao(v: Vida, tema: TemaPublicacao, n: number): string {
  const r = rngDe(v.id, 'texto_post', v.t, tema, n);
  switch (tema) {
    case 'viagem': return `As fotos de ${ultimaViagem(v) ?? 'uma viagem'}.`;
    case 'trabalho': return r.pick(['Um dia comum no trabalho — com legenda engraçada.', 'A mesa de trabalho, às sete da noite.', 'O projeto que finalmente saiu.']);
    case 'conquista': return v.caminhos.marcas.filter(m => v.t - m.t <= 12 && m.peso >= 2).pop()?.texto ?? 'Uma conquista.';
    case 'arte': { const a = ARTES.find(([d]) => habilidade(v, d) >= 25); return a ? `${a[1].charAt(0).toUpperCase()}${a[1].slice(1)}.` : 'Algo feito à mão.'; }
    case 'pet': return `${petsDaCasa(v)[0]?.nome ?? 'O bicho'} dormindo no lugar errado, de novo.`;
    case 'familia': return r.pick(['O almoço de domingo, todo mundo junto.', 'Uma foto de casa, sem pose.', 'Aniversário em família.']);
    case 'opiniao': return r.pick(['Uma opinião forte sobre o trânsito da cidade.', 'Uma opinião forte sobre política.', 'Uma opinião forte sobre o jogo de domingo.', 'Uma opinião forte sobre trabalho e descanso.']);
    default: return r.pick(['O café da manhã.', 'O céu no fim da tarde.', 'A rua de sempre, numa luz diferente.', 'Uma selfie sem motivo.']);
  }
}

/* ------------------------------------------------------- Quem segue quem */

const conhecidosParaRede = (v: Vida) => Object.values(v.vinculos)
  .map(vin => ({ vin, p: v.pessoas[vin.pessoaId] }))
  .filter(({ p }) => p && p.vivo && !p.especie && p.nome && idadePessoa(v, p) >= 13 && idadePessoa(v, p) <= 80);

/** Quem da sua vida segue você. */
export const seguidoresConhecidos = (v: Vida): Pessoa[] => conhecidosParaRede(v).filter(x => x.vin.digital?.seguidor && x.vin.digital.bloqueado === undefined).map(x => x.p);

/* -------------------------------------------------------- Disponibilidade */

export function disponibilidadeRede(v: Vida, op: OpRede): Veredito {
  const i = idade(v);
  const pl = PLATAFORMAS[PLATAFORMA_PADRAO];
  const c = contaAtiva(v);
  if (v.justica?.prisao?.regime === 'fechado') return bloqueio('impossivel', 'Na prisão, sem rede.');
  if (op.oque === 'criar') {
    if (i < pl.idadeMin) return bloqueio('ilegal', `${pl.nome} é a partir dos ${pl.idadeMin} anos.`);
    if (c) return bloqueio('incompativel', 'Você já tem uma conta.');
    return PERMITIDO;
  }
  if (!c) return bloqueio('impossivel', `Você não tem conta no ${pl.nome}.`);
  switch (op.oque) {
    case 'publicar': {
      if (!temasPossiveis(v).some(t => t.tema === op.tema)) return bloqueio('impossivel', 'Não há o que mostrar disso agora.');
      const ano = doAno(v, c);
      if (ano.length >= PUBLICACOES_POR_ANO) return bloqueio('incompativel', 'Você já publicou bastante neste ano.');
      if (ano.some(p => p.tema === op.tema)) return bloqueio('incompativel', 'Você já publicou sobre isso neste ano.');
      if (op.promover) return vereditoDePagar(v, custoDePromover(v), 'Promover custa');
      return PERMITIDO;
    }
    case 'seguir': case 'deixar': case 'bloquear': case 'desbloquear': {
      const vin = v.vinculos[op.pessoaId];
      const p = v.pessoas[op.pessoaId];
      if (!vin || !p || !p.vivo) return bloqueio('impossivel', 'Essa pessoa não está na sua vida.');
      if (op.oque === 'seguir' && (vin.digital?.segue || vin.digital?.bloqueado !== undefined)) return bloqueio('incompativel', vin.digital?.segue ? 'Você já segue.' : 'Você bloqueou essa pessoa.');
      if (op.oque === 'deixar' && !vin.digital?.segue) return bloqueio('incompativel', 'Você não segue essa pessoa.');
      if (op.oque === 'bloquear' && vin.digital?.bloqueado !== undefined) return bloqueio('incompativel', 'Já está bloqueada.');
      if (op.oque === 'desbloquear' && vin.digital?.bloqueado === undefined) return bloqueio('incompativel', 'Não está bloqueada.');
      return PERMITIDO;
    }
    case 'apagar_publicacao': return c.publicacoes.some(p => p.id === op.id && !p.apagada) ? PERMITIDO : bloqueio('impossivel', 'Essa publicação não existe mais.');
    case 'apagar_conta': return PERMITIDO;
    case 'monetizar':
      if (c.monetizada !== undefined) return bloqueio('incompativel', 'A conta já é monetizada.');
      if (i < 16) return bloqueio('ilegal', 'A partir dos 16 anos.');
      if (c.seguidores < 10000) return bloqueio('requisito', `Pede pelo menos 10 mil seguidores (você tem ${seguidoresEmPalavras(c.seguidores)}).`);
      if (c.credibilidade < 40) return bloqueio('requisito', 'As marcas não confiam na conta: credibilidade baixa demais.');
      return PERMITIDO;
    case 'comprar':
      if (i < 16) return bloqueio('ilegal', 'A partir dos 16 anos.');
      return vereditoDePagar(v, custoDoPacote(v, op.pacote));
  }
}

/* -------------------------------------------------------------- Executar */

const arrobaDe = (v: Vida) => `${v.eu.nome}${v.eu.sobrenome.split(' ').pop() ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) + String(Math.floor(rngDe(v.id, 'arroba').next() * 90 + 10));

export function executarRede(v: Vida, op: OpRede): string {
  const pl = PLATAFORMAS[PLATAFORMA_PADRAO];
  if (op.oque === 'criar') {
    const r = rngDe(v.id, 'conta', v.t);
    const c: ContaSocial = { plataforma: pl.id, arroba: arrobaDe(v), tCriada: v.t, seguidores: 0, credibilidade: 60, publicacoes: [] };
    (v.redes ??= { contas: {} }).contas[pl.id] = c;
    // Quem é próximo segue de volta (quem ainda não tem idade, nem gosta de rede, não).
    let n = 0;
    for (const { p, vin } of conhecidosParaRede(v)) {
      if (vin.digital?.bloqueado !== undefined || estadoDaRelacao(v, vin) === 'rompido') continue;
      const chance = vin.proximidade >= 60 ? 0.85 : vin.proximidade >= 35 ? 0.5 : 0.15;
      if (r.chance(chance * (idadePessoa(v, p) >= 65 ? 0.4 : 1))) { (vin.digital ??= {}).seguidor = true; vin.digital.segue = true; n++; }
    }
    c.seguidores = n + r.int(4, 40);
    escrever(v, { texto: `Criou uma conta no ${pl.nome}.`, relevancia: 'cotidiano', tema: 'amizade', escolha: true });
    return `@${c.arroba} existe agora. ${n ? `${n} ${n === 1 ? 'pessoa da sua vida seguiu' : 'pessoas da sua vida seguiram'} na mesma semana.` : 'Ninguém conhecido ainda.'}`;
  }
  const c = contaAtiva(v)!;
  switch (op.oque) {
    case 'publicar': return publicar(v, c, op.tema, !!op.promover);
    case 'seguir': {
      const vin = v.vinculos[op.pessoaId]; const p = v.pessoas[op.pessoaId];
      (vin.digital ??= {}).segue = true;
      const volta = rngDe(v.id, 'segue', op.pessoaId, v.t).chance(vin.proximidade >= 40 ? 0.8 : 0.35);
      if (volta && !vin.digital.seguidor) { vin.digital.seguidor = true; c.seguidores += 1; }
      vin.digital.reacao = v.t;
      return volta ? `Você passou a seguir ${p.nome}. ${p.nome} seguiu de volta.` : `Você passou a seguir ${p.nome}.`;
    }
    case 'deixar': {
      const vin = v.vinculos[op.pessoaId]; const p = v.pessoas[op.pessoaId];
      vin.digital!.segue = false;
      const notou = vin.digital!.seguidor && vin.proximidade >= 45 && rngDe(v.id, 'deixou', op.pessoaId, v.t).chance(0.5);
      if (notou) { vin.tensao = clamp(vin.tensao + 6); vin.proximidade = clamp(vin.proximidade - 3); return `Você deixou de seguir ${p.nome}. ${p.nome} percebeu — e não disse nada.`; }
      return `Você deixou de seguir ${p.nome}.`;
    }
    case 'bloquear': return bloquear(v, c, op.pessoaId);
    case 'desbloquear': {
      const vin = v.vinculos[op.pessoaId]; const p = v.pessoas[op.pessoaId];
      vin.digital!.bloqueado = undefined;
      vin.tensao = clamp(vin.tensao - 5);
      return `Você desbloqueou ${p.nome}. Ainda não se falaram.`;
    }
    case 'apagar_publicacao': {
      const x = c.publicacoes.find(p => p.id === op.id)!;
      x.apagada = true;
      if (x.polemica) c.credibilidade = clamp(c.credibilidade + 3);
      return x.polemica ? 'A publicação sumiu. O print, não — mas a poeira baixou um pouco.' : 'A publicação sumiu do seu perfil.';
    }
    case 'apagar_conta': {
      c.apagada = v.t;
      escrever(v, { texto: `Apagou a conta no ${pl.nome}${c.seguidores >= 10000 ? `, com ${seguidoresEmPalavras(c.seguidores)} seguidores` : ''}.`, relevancia: c.seguidores >= 10000 ? 'biografia' : 'cotidiano', tema: 'amizade', escolha: true });
      return 'A conta foi apagada. O silêncio é estranho nos primeiros dias.';
    }
    case 'monetizar': {
      c.monetizada = v.t;
      escrever(v, { texto: `A conta no ${pl.nome} passou a pagar: publicidade, parcerias, ${seguidoresEmPalavras(c.seguidores)} seguidores.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
      return 'A primeira marca mandou proposta na mesma semana. A rede virou também trabalho.';
    }
    case 'comprar': {
      const pk = PACOTES[op.pacote];
      pagar(v, custoDoPacote(v, op.pacote));
      c.seguidores += pk.n; c.comprados = (c.comprados ?? 0) + pk.n;
      c.credibilidade = clamp(c.credibilidade - pk.perde);
      return `${seguidoresEmPalavras(pk.n)} seguidores novos em dois dias. Nenhum deles comenta nada.`;
    }
  }
}

function publicar(v: Vida, c: ContaSocial, tema: TemaPublicacao, promover: boolean): string {
  const n = c.publicacoes.length;
  const r = rngDe(v.id, 'post', v.t, tema, n);
  if (promover) pagar(v, custoDePromover(v));
  const camera = temCoisa(v, 'camera') ? 0.3 : 0;
  const celular = temCoisa(v, 'celular_topo') ? 0.2 : temCoisa(v, 'celular_bom') ? 0.1 : 0;
  const arte = tema === 'arte' ? Math.max(...ARTES.map(([d]) => habilidade(v, d))) / 100 : 0;
  const peso = ({ viagem: 0.3, conquista: 0.4, pet: 0.3, opiniao: 0.25, familia: 0.1, arte: 0.2, trabalho: 0, cotidiano: 0 } as Record<TemaPublicacao, number>)[tema];
  const qualidade = 1 + camera + celular + arte + peso;
  const fama = 1 + (v.notoriedade?.valor ?? 0) / 30;
  let alcance = Math.max(30, c.seguidores) * (0.3 + 0.7 * c.credibilidade / 100) * qualidade * fama * (0.5 + r.next()) * (promover ? 4 : 1);
  const viral = r.chance(0.012 * qualidade * (promover ? 2 : 1));
  if (viral) alcance *= 12;
  const novos = Math.round(alcance * (0.02 + 0.04 * r.next()) * qualidade);
  c.seguidores += novos;
  if (!c.comprados) c.credibilidade = clamp(c.credibilidade + 1);
  const pub: Publicacao = { id: novoId(v, 'pb'), t: v.t, tema, texto: textoDaPublicacao(v, tema, n), alcance: Math.round(alcance), novos, ...(promover ? { promovida: true } : {}), ...(viral ? { viral: true } : {}) };
  // Quem da sua vida segue reage; quem está longe e calado às vezes comenta — e a conversa recomeça.
  const reagiram: Pessoa[] = [];
  const comentou: Pessoa[] = [];
  for (const p of seguidoresConhecidos(v)) {
    const vin = v.vinculos[p.id];
    if (!r.chance(0.25 + vin.proximidade / 160)) continue;
    reagiram.push(p);
    (vin.digital ??= {}).reacao = v.t;
    const longe = p.municipioId !== v.moradia.municipioId && v.t - vin.tUltimoContato >= 18;
    if (longe && vin.proximidade >= 35 && r.chance(tema === 'viagem' || tema === 'familia' || tema === 'conquista' ? 0.35 : 0.18)) {
      comentou.push(p);
      vin.digital.mensagem = v.t; vin.tUltimoContato = v.t;
      vin.proximidade = clamp(vin.proximidade + 3);
      if (!vin.parentesco) vin.aproximacao = v.t;
    }
  }
  pub.pessoas = reagiram.slice(0, 6).map(p => p.id);
  let extra = '';
  if (tema === 'opiniao' && r.chance(0.3)) {
    pub.polemica = true;
    c.credibilidade = clamp(c.credibilidade - 10);
    const alvo = reagiram.concat(seguidoresConhecidos(v)).sort((a, b) => a.temperamento.afabilidade - b.temperamento.afabilidade)[0];
    if (alvo) { const vin = v.vinculos[alvo.id]; vin.tensao = clamp(vin.tensao + 15); extra = ` ${alvo.nome} discordou em público — e a discussão foi longe nos comentários.`; }
    else extra = ' Estranhos discordaram em peso nos comentários.';
  }
  if (tema === 'trabalho' && v.trabalho.atual && r.chance(0.1)) { v.trabalho.atual.clima = clamp((v.trabalho.atual.clima ?? 50) - 4); extra += ' Alguém da chefia viu — e não gostou.'; }
  c.publicacoes = [...c.publicacoes, pub].slice(-24);
  if (viral && v.fatos['rede_viral'] === undefined) {
    v.fatos['rede_viral'] = v.t;
    escrever(v, { texto: `Uma publicação no ${PLATAFORMAS[c.plataforma].nome} viralizou: ${pub.texto.replace(/\.$/, '').toLowerCase()}.`, relevancia: 'biografia', tema: 'amizade', tom: 'bom' });
  }
  marcosDeSeguidores(v, c);
  const quem = comentou.length ? ` ${comentou.map(p => p.nome).join(' e ')} comentou${comentou.length > 1 ? 'aram' : ''} — fazia tempo que vocês não se falavam.` : reagiram.length ? ` Reagiram: ${reagiram.slice(0, 3).map(p => p.nome).join(', ')}${reagiram.length > 3 ? ` e mais ${reagiram.length - 3}` : ''}.` : '';
  return `${viral ? 'Viralizou. ' : ''}${seguidoresEmPalavras(Math.round(alcance))} pessoas viram${novos ? `; ${seguidoresEmPalavras(novos)} começaram a seguir` : ''}.${quem}${extra}`;
}

function bloquear(v: Vida, c: ContaSocial, pessoaId: string): string {
  const vin = v.vinculos[pessoaId]; const p = v.pessoas[pessoaId];
  const d = (vin.digital ??= {});
  d.bloqueado = v.t; d.segue = false;
  if (d.seguidor) { d.seguidor = false; c.seguidores = Math.max(0, c.seguidores - 1); }
  // Bloquear é um gesto com consequência: o ex fica longe de verdade; o amigo ou a família, ofendidos.
  if (vin.romance?.estagio === 'ex') { vin.distancia = v.t; vin.tensao = clamp(vin.tensao + 10); return `Você bloqueou ${p.nome}. Um silêncio que, desta vez, foi escolhido.`; }
  if (vin.proximidade >= 40 || vin.parentesco) {
    vin.tensao = clamp(vin.tensao + 25); vin.proximidade = clamp(vin.proximidade - 10);
    vin.conflito = { t: v.t, assunto: 'o bloqueio na rede', gravidade: 2, quem: 'eu' };
    return `Você bloqueou ${p.nome}. ${flex(p.genero, 'Ele', 'Ela', 'Elu')} descobriu em dois dias — e entendeu como uma briga.`;
  }
  vin.distancia = v.t;
  return `Você bloqueou ${p.nome}.`;
}

function marcosDeSeguidores(v: Vida, c: ContaSocial): void {
  for (const m of [1000, 10000, 100000, 1000000]) {
    if (c.seguidores >= m && (c.seguidores - (c.comprados ?? 0)) >= m * 0.7 && v.fatos[`rede_${m}`] === undefined) {
      v.fatos[`rede_${m}`] = v.t;
      if (m >= 10000) escrever(v, { texto: `Passou de ${seguidoresEmPalavras(m)} seguidores no ${PLATAFORMAS[c.plataforma].nome}.`, relevancia: m >= 100000 ? 'biografia' : 'cotidiano', tema: 'amizade', tom: 'bom' });
    }
  }
}

/* ---------------------------------------------------------------- O ano */

/** O ano da rede: quem some perde gente; quem é famoso ganha; seguidor comprado pode ser descoberto. */
export function processarRedes(v: Vida): void {
  const c = contaAtiva(v);
  if (!c) return;
  const r = rngDe(v.id, 'rede_ano', v.t);
  const noAno = c.publicacoes.filter(p => !p.apagada && v.t - p.t < 12).length;
  if (noAno === 0) { c.seguidores = Math.round(c.seguidores * 0.92); c.credibilidade = clamp(c.credibilidade - 2); }
  else c.seguidores = Math.round(c.seguidores * (1 + 0.01 * noAno));
  const fama = v.notoriedade?.valor ?? 0;
  if (fama >= 30) c.seguidores += Math.round((fama - 25) ** 2 * 40 * (0.6 + r.next() * 0.8));
  if (c.comprados) {
    const chance = 0.15 + (c.comprados / Math.max(1, c.seguidores)) * 0.5 + fama / 200;
    if (r.chance(chance)) {
      c.seguidores = Math.max(0, c.seguidores - Math.round(c.comprados * 0.9));
      c.comprados = 0;
      c.credibilidade = clamp(c.credibilidade - 20);
      if (c.monetizada !== undefined && c.credibilidade < 40) c.monetizada = undefined;
      escrever(v, { texto: 'Descobriram que parte dos seus seguidores era comprada. Os prints rodaram mais do que qualquer publicação sua.', relevancia: 'biografia', tema: 'amizade', tom: 'ruim' });
    }
  } else if (c.credibilidade < 70) c.credibilidade = clamp(c.credibilidade + 3);
  marcosDeSeguidores(v, c);
}

/** O que a tela mostra da conta. */
export function leituraDaConta(v: Vida): { conta: ContaSocial; plataforma: string; credibilidade: string; renda: boolean } | undefined {
  const c = contaAtiva(v);
  if (!c) return undefined;
  const cred = c.credibilidade >= 70 ? 'confiável' : c.credibilidade >= 45 ? 'normal' : c.credibilidade >= 25 ? 'desconfiada' : 'queimada';
  return { conta: c, plataforma: PLATAFORMAS[c.plataforma].nome, credibilidade: cred, renda: c.monetizada !== undefined };
}

