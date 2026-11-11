/**
 * VIDA 16 · O APLICATIVO DE NAMORO COM ALGUÉM EM CASA.
 *
 * O aplicativo funciona igual para quem está num relacionamento: ver perfis, curtir, dar match, conversar, marcar o
 * encontro. Nada é bloqueado pelo estado civil — o aviso diz o que está em jogo, e a escolha é do jogador.
 *
 * O que muda é o RASTRO (`Celular15.rastro16`): o aplicativo instalado, os matches, as conversas, o encontro. Cada coisa
 * feita pode — ou não — ser achada pela parceria. A chance é dela, não um número fixo:
 *
 *   o QUE foi feito       instalar pesa pouco; conversar mais; um encontro, mais ainda (alguém viu, a fatura, a foto);
 *   o JEITO dela          quem é ciumento repara; quem anda desconfiado também;
 *   a CASA                morar junto é o celular na mesa, a notificação na hora do jantar;
 *   a EXPOSIÇÃO           com fama, um encontro num restaurante pode virar foto;
 *   o DESCUIDO            quem é impulsivo deixa mais pistas; o rastro acumulado também.
 *
 * Descoberto, a reação também é dela (`reagir`): do ciúme calado à crise, ao afastamento ou ao fim — pesando o que foi
 * achado, a força da relação (envolvimento, confiança, tensão), o temperamento, se é a primeira vez e se veio a público.
 * Nem toda descoberta termina: a maioria é uma conversa difícil (o chamado `conversa_casal`, que pede resposta).
 *
 * Sorteios derivados (`rngDe`) — o acaso das vidas que não usam o aplicativo não muda.
 */
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { Pessoa, Vida, Vinculo } from '../../tipos';
import { escrever, lembrarCom, parceiro } from '../../nucleo';
import { acordoConsentido, terminar } from '../../sistemas/romance';
import { tem } from '../../sistemas/jeito';
import { flex } from '../../texto';
import type { Desfecho16, ProvaDoApp16, RastroDoApp16 } from '../../dados16/romance/tipos';

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');

/** A parceria exclusiva de agora (num acordo aberto ou poliamor, não há o que esconder). */
export function parceriaExclusiva16(v: Vida): { p: Pessoa; vin: Vinculo } | undefined {
  const par = parceiro(v);
  return par && !acordoConsentido(par.vin.romance) ? par : undefined;
}

/** O aviso honesto do aplicativo para quem está com alguém (nunca bloqueia). */
export function avisoDoApp16(v: Vida): string | undefined {
  const par = parceriaExclusiva16(v);
  if (!par) return undefined;
  return `Você está com ${par.p.nome}, num relacionamento exclusivo. Dá para usar o aplicativo — mas o que você fizer nele pode ser descoberto.`;
}

const PESO: Record<ProvaDoApp16, number> = { perfil: 1, match: 1.5, mensagens: 2.5, encontro: 4 };
const BASE: Record<ProvaDoApp16, number> = { perfil: 0.05, match: 0.05, mensagens: 0.08, encontro: 0.14 };
const GRAVIDADE: Record<ProvaDoApp16, number> = { perfil: 1, match: 1, mensagens: 2, encontro: 3 };

/** O rastro desta parceria (o de outra parceria não vale: a pessoa nova não tem como achar). */
function rastroDe(v: Vida, parId: string): RastroDoApp16 {
  const c = (v.celular15 ??= { ano: Math.floor(v.t / 12), msgs: [] });
  if (!c.rastro16 || c.rastro16.parId !== parId) c.rastro16 = { parId, provas: [] };
  return c.rastro16;
}

/** A chance de a parceria achar ESTA coisa agora (0..0,55). Exportada para o teste e para a leitura. */
export function chanceDeDescobrir16(v: Vida, par: { p: Pessoa; vin: Vinculo }, tipo: ProvaDoApp16, rastro?: RastroDoApp16): number {
  const acumulado = (rastro?.provas ?? []).filter(x => v.t - x.t <= 24).reduce((s, x) => s + PESO[x.tipo], 0);
  let x = BASE[tipo] * (1 + Math.min(1.5, acumulado * 0.08));
  x *= par.vin.convivio.includes('casa') ? 1.5 : 0.8;
  if (tem(par.p, 'ciumento')) x *= 1.6;
  if (par.vin.confianca < 45) x *= 1.3;
  if (v.personalidade.tracos.impulsividade > 30) x *= 1.2;
  // Já achou uma vez: agora olha.
  if ((rastro?.descobertas ?? []).length) x *= 1.4;
  // A fama põe olhos no encontro (a mesa do restaurante, o celular de alguém).
  const fama = v.notoriedade?.valor ?? 0;
  if (tipo === 'encontro' && fama >= 30) x += 0.08 + Math.min(0.12, (fama - 30) / 400);
  return clamp(x, 0, 0.55);
}

export interface SaidaRastro16 { texto?: string; desfecho?: Desfecho16 }

/**
 * Registra o que foi feito no aplicativo estando com alguém — e, às vezes, a parceria acha. Sem parceria exclusiva,
 * nada a registrar. `r` opcional: sem ele, o sorteio é derivado (o mesmo resultado ao recarregar).
 */
export function deixarRastro16(v: Vida, tipo: ProvaDoApp16, com?: string, r?: Rng): SaidaRastro16 {
  const par = parceriaExclusiva16(v);
  if (!par) return {};
  const rastro = rastroDe(v, par.p.id);
  // O perfil instalado conta uma vez por ano (abrir o aplicativo de novo não é pista nova).
  if (tipo === 'perfil' && rastro.provas.some(x => x.tipo === 'perfil' && Math.floor(x.t / 12) === Math.floor(v.t / 12))) return {};
  const chance = chanceDeDescobrir16(v, par, tipo, rastro);
  rastro.provas.push({ tipo, t: v.t, ...(com ? { com } : {}) });
  if (rastro.provas.length > 24) rastro.provas.splice(0, rastro.provas.length - 24);
  const rr = r ?? rngDe(v.id, 'rastro16', v.t, rastro.provas.length);
  if (!rr.chance(chance)) return {};
  return reagir(v, rr, par, rastro, tipo, com);
}

/** O que foi achado, em palavras (quem achou é a parceria). */
function oQueAchou(v: Vida, tipo: ProvaDoApp16, com: string | undefined, rr: Rng): string {
  const nome = com ? v.pessoas[com]?.nome : undefined;
  switch (tipo) {
    case 'perfil': return rr.pick(['viu o aplicativo de encontros instalado no seu celular', 'viu uma notificação do aplicativo de encontros na tela do seu celular']);
    case 'match': return rr.pick([`viu a notificação: "Vocês deram match!"${nome ? ` — com ${nome}` : ''}`, 'viu, por cima do seu ombro, a tela do aplicativo de encontros']);
    case 'mensagens': return nome ? rr.pick([`leu a conversa com ${nome} no aplicativo`, `viu as mensagens trocadas com ${nome}`]) : 'leu as conversas do aplicativo';
    case 'encontro': return nome ? rr.pick([`soube do encontro com ${nome} — alguém viu vocês juntos`, `achou a conta do restaurante do encontro com ${nome}`, `viu uma foto sua com ${nome}, numa noite em que você disse estar em outro lugar`]) : 'soube do encontro';
  }
}

/**
 * A reação. A gravidade nasce do que foi achado; o resto é da relação e da pessoa. Devolve o texto e o desfecho.
 */
function reagir(v: Vida, rr: Rng, par: { p: Pessoa; vin: Vinculo }, rastro: RastroDoApp16, tipo: ProvaDoApp16, com?: string): SaidaRastro16 {
  const { p, vin } = par;
  const rom = vin.romance!;
  // O mais grave que já existe para ser achado junto (quem acha o encontro acha a conversa).
  const pior = rastro.provas.filter(x => v.t - x.t <= 24).reduce((m, x) => Math.max(m, GRAVIDADE[x.tipo]), GRAVIDADE[tipo]);
  const vezes = (rastro.descobertas ?? []).length;
  const tol = p.temperamento.afabilidade * 0.3 + p.temperamento.estabilidade * 0.3 + (rom.envolvimento - 50) / 100 + (vin.confianca - 50) / 120 - (vin.tensao - 30) / 150 - (tem(p, 'ciumento') ? 0.45 : 0);
  const casado = rom.estagio === 'casamento' || rom.estagio === 'morando_junto';
  const score = pior + (-tol) * 1.5 + rr.normal() * 0.5 + vezes * 0.8 + (casado ? 0.2 : 0);
  let desfecho: Desfecho16 = score < 1.2 ? 'ciume' : score < 2.1 ? 'discussao' : score < 3 ? 'crise' : score < 3.8 ? 'afastamento' : 'termino';
  // Um aplicativo instalado, sozinho e pela primeira vez, não acaba uma relação.
  if (desfecho === 'termino' && pior < 2 && vezes === 0) desfecho = 'afastamento';
  (rastro.descobertas ??= []).push({ t: v.t, tipo, desfecho });
  v.fatos['app16_descobertas'] = (v.fatos['app16_descobertas'] ?? 0) + 1;
  const achou = oQueAchou(v, tipo, com, rr);
  const nome = p.nome;
  let texto = '';
  switch (desfecho) {
    case 'ciume':
      vin.tensao = clamp(vin.tensao + 10); vin.confianca = clamp(vin.confianca - 6);
      texto = `${nome} ${achou}. Não disse quase nada — mas passou a olhar o seu celular de outro jeito.`;
      lembrarCom(v, p.id, 'Ficou com ciúme do aplicativo no seu celular.', 'conflito', 1);
      break;
    case 'discussao':
      vin.tensao = clamp(vin.tensao + 20); vin.confianca = clamp(vin.confianca - 14);
      rom.envolvimento = clamp(rom.envolvimento - 6);
      if (!vin.conflito || vin.conflito.gravidade < 2) vin.conflito = { t: v.t, assunto: 'o aplicativo de encontros', gravidade: 2, quem: 'eu' };
      texto = `${nome} ${achou}. A discussão foi na cozinha, baixa no começo e alta no fim.`;
      lembrarCom(v, p.id, 'Brigaram por causa do aplicativo de encontros.', 'conflito', 2);
      if (!vin.chamado) vin.chamado = { tipo: 'conversa_casal', t: v.t, texto: `${nome} quer conversar sobre o que viu no seu celular.`, assunto: 'app16' };
      break;
    case 'crise':
      vin.tensao = clamp(vin.tensao + 32); vin.confianca = clamp(vin.confianca - 26);
      rom.envolvimento = clamp(rom.envolvimento - 14);
      vin.conflito = { t: v.t, assunto: 'o que você fazia no aplicativo de encontros', gravidade: 3, quem: 'eu' };
      texto = `${nome} ${achou}. Perguntou há quanto tempo, e com quantas pessoas. A relação entrou em crise.`;
      lembrarCom(v, p.id, 'Descobriu o aplicativo — e a confiança quebrou.', 'traicao', 2);
      if (!vin.chamado) vin.chamado = { tipo: 'conversa_casal', t: v.t, texto: `${nome} disse que precisa de uma conversa de verdade — sobre o aplicativo e sobre vocês.`, assunto: 'app16' };
      break;
    case 'afastamento':
      vin.tensao = clamp(vin.tensao + 28); vin.confianca = clamp(vin.confianca - 30);
      rom.envolvimento = clamp(rom.envolvimento - 24);
      vin.proximidade = clamp(vin.proximidade - 12);
      vin.conflito = { t: v.t, assunto: 'o aplicativo de encontros', gravidade: 3, quem: 'eu' };
      texto = `${nome} ${achou}. Não gritou. Foi pior: passou a dormir virad${flex(p.genero, 'o', 'a', 'e')} para a parede e a responder com uma palavra.`;
      lembrarCom(v, p.id, 'Depois do aplicativo, se fechou.', 'traicao', 2);
      break;
    case 'termino':
      texto = `${nome} ${achou}. Juntou as coisas naquela mesma noite: disse que não ia ser a última a saber de mais nada.`;
      lembrarCom(v, p.id, 'Terminou ao descobrir o aplicativo.', 'traicao', 3);
      terminar(v, p, vin, 'ela', 'traicao');
      break;
  }
  escrever(v, { texto, relevancia: desfecho === 'ciume' ? 'cotidiano' : 'biografia', tema: 'amor', pessoas: [p.id, ...(com ? [com] : [])] });
  // A repercussão pública: com fama, um encontro (ou a conversa vazada) pode virar nota de coluna.
  const fama = v.notoriedade?.valor ?? 0;
  if (fama >= 30 && pior >= 2 && rr.chance(0.3 + Math.min(0.3, (fama - 30) / 200))) {
    v.fatos['app16_publico'] = v.t;
    const c = v.celular15!;
    c.msgs.push({ id: `app16_${v.t}_${c.msgs.length}`, t: v.t, tipo: 'imprensa', remetente: rr.pick(['Coluna Bastidores', 'Portal Holofote', 'Revista Ribalta']), texto: `"Recebemos prints de um aplicativo de encontros com o seu perfil. ${nome} sabe? Vamos publicar. Quer comentar?"`, assunto: p.id, onda: 9 });
    texto += ' E a história chegou à imprensa.';
  }
  void ele;
  return { texto, desfecho };
}

/** O rastro some aos poucos (o aplicativo apagado, as conversas antigas): chamado na virada do ano. */
export function esquecerRastro16(v: Vida): void {
  const r = v.celular15?.rastro16;
  if (!r) return;
  const par = parceriaExclusiva16(v);
  if (!par || par.p.id !== r.parId) { if (!(r.descobertas ?? []).length) v.celular15!.rastro16 = undefined; return; }
  r.provas = r.provas.filter(x => v.t - x.t <= 24);
}
