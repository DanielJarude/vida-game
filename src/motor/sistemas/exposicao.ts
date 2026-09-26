/**
 * O que é privado — e o caminho até virar público.
 *
 *   causa → quem sabe → vira público? → quem reage → o que muda
 *
 * Uma traição escondida não tira voto de ninguém: ninguém sabe. Quando a
 * parceria descobre, é assunto da casa (o casamento, os filhos). Só vira
 * assunto da cidade se alguém fala — e a chance de alguém falar cresce com
 * quantos sabem, com o ressentimento de quem sabe e com o quanto a pessoa é
 * pública. Um processo na Justiça é registro público: para quem tem nome,
 * vira notícia logo. Só depois disso a política sente (desgaste, base,
 * aprovação) — e a resposta é do jogador (`pol_escandalo`).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Segredo, Vida } from '../tipos';
import { escrever, idadePessoa, lembrarCom, novoId, vinculosVivos } from '../nucleo';
import { naPolitica } from './politica';
import { filhosEmComum } from './vinculos';

/** O quanto a vida da pessoa é pública (0..100): a política, antes de tudo; um negócio conhecido, um pouco. */
export function publicidade(v: Vida): number {
  const p = v.caminhos.politica;
  let x = 0;
  if (p && naPolitica(v)) x = Math.max(x, 20 + p.reputacao * 0.8 + (p.mandato ? 20 : 0));
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado') x = Math.max(x, (n.reputacao ?? 30) * 0.3);
  if (v.caminhos.arte?.ativo) x = Math.max(x, v.caminhos.arte.publico * 0.5);
  return clamp(Math.round(x));
}

export function registrarSegredo(v: Vida, tipo: Segredo['tipo'], quemSabe: string[], pessoaId?: string): Segredo {
  v.segredos ??= [];
  const s: Segredo = { id: novoId(v, 's'), tipo, t: v.t, quemSabe: [...new Set(quemSabe)], pessoaId };
  v.segredos.push(s);
  return s;
}

/** Alguém ficou sabendo (a parceria descobriu o caso). */
export function ficouSabendo(v: Vida, tipo: Segredo['tipo'], pessoaId: string, sobre?: string): void {
  const s = [...(v.segredos ?? [])].reverse().find(x => x.tipo === tipo && !x.publico && (!sobre || x.pessoaId === sobre));
  if (s && !s.quemSabe.includes(pessoaId)) s.quemSabe.push(pessoaId);
}

/** Quanto quem sabe tem motivo para falar (um ex magoado fala mais que um amigo leal). */
function vontadeDeFalar(v: Vida, s: Segredo): number {
  let x = 0;
  for (const id of s.quemSabe) {
    const vin = v.vinculos[id];
    const p = v.pessoas[id];
    if (!vin || !p?.vivo) continue;
    const ressentido = vin.confianca < 25 && vin.tensao >= 45;
    const ex = vin.romance?.estagio === 'ex';
    x += ressentido ? (ex ? 0.18 : 0.1) : 0.025;
  }
  return x;
}

/**
 * O ano de cada segredo: pode vazar. Quanto mais pública a vida, mais um
 * vazamento vira notícia; numa vida sem nome, fica entre conhecidos (a
 * família ainda sente).
 */
export function processarExposicao(v: Vida, r: Rng): void {
  const lista = v.segredos ?? [];
  const pub = publicidade(v);
  for (const s of lista) {
    if (s.publico) continue;
    // O caso já acabou há muito e ninguém guardou mágoa: esquece-se.
    if (v.t - s.t > 180) { s.publico = -1; continue; }
    const falar = vontadeDeFalar(v, s);
    if (falar <= 0) continue;
    // Entre conhecidos: os filhos adultos acabam sabendo de um caso que a parceria descobriu.
    if (s.tipo === 'caso' && s.quemSabe.length >= 2) espalharEntreOsFilhos(v, r, s);
    const chance = Math.min(0.5, falar * (0.3 + pub / 70));
    if (pub >= 25 && r.chance(chance)) tornarPublico(v, s);
  }
  // Os que já passaram: saem da lista.
  v.segredos = lista.filter(s => !s.publico || s.publico > 0 && v.t - s.publico < 120);
}

/** Um filho adulto fica sabendo da traição (pela mãe ou pelo pai que descobriu): a relação com você sente. */
function espalharEntreOsFilhos(v: Vida, r: Rng, s: Segredo): void {
  const traido = s.quemSabe.map(id => v.pessoas[id]).find(p => p && v.vinculos[p.id]?.historia.some(h => h.tipo === 'traicao'));
  if (!traido) return;
  for (const f of filhosEmComum(v, traido.id)) {
    if (!f.vivo || idadePessoa(v, f) < 16 || s.quemSabe.includes(f.id) || !r.chance(0.35)) continue;
    s.quemSabe.push(f.id);
    const vin = v.vinculos[f.id];
    if (!vin) continue;
    vin.tensao = clamp(vin.tensao + 15);
    vin.confianca = clamp(vin.confianca - 12);
    lembrarCom(v, f.id, `Soube da traição a ${traido.nome}.`, 'conflito', 2);
    escrever(v, { texto: `${f.nome} ficou sabendo do caso — por ${traido.nome}. Com você, a conversa ficou curta.`, relevancia: 'biografia', tema: 'familia', tom: 'ruim', pessoas: [f.id, traido.id] });
  }
}

/**
 * Virou público. A repercussão vem de quem está em volta: na política,
 * desgaste, base e aprovação, e a pergunta do que fazer; no negócio, o nome;
 * sempre, a Linha da Vida diz o que aconteceu.
 */
export function tornarPublico(v: Vida, s: Segredo): void {
  s.publico = v.t;
  const p = v.caminhos.politica;
  const quem = s.pessoaId ? v.pessoas[s.pessoaId] : undefined;
  const oque = s.tipo === 'caso' ? `O caso${quem ? ` com ${quem.nome}` : ''}` : s.tipo === 'prisao' ? 'A prisão' : 'O processo';
  if (p && naPolitica(v)) {
    const peso = s.tipo === 'caso' ? 1 : 1.6;
    p.escandalo = { t: v.t, tipo: s.tipo };
    p.desgaste = clamp(p.desgaste + Math.round(14 * peso));
    p.apoio = clamp(p.apoio - Math.round(7 * peso));
    if (p.mandato) p.mandato.aprovacao = clamp(p.mandato.aprovacao - Math.round(9 * peso));
    v.fatos['pol_escandalo'] = v.t;
    escrever(v, { texto: `${oque} virou notícia: ${s.tipo === 'caso' ? 'um portal da cidade publicou, e o assunto chegou às reuniões do partido' : 'saiu nos jornais da cidade, com o seu nome no título'}.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim', pessoas: quem ? [quem.id] : undefined });
  } else {
    escrever(v, { texto: `${oque} virou assunto na cidade.`, relevancia: 'biografia', tema: 'lugar', tom: 'ruim', pessoas: quem ? [quem.id] : undefined });
  }
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado' && s.tipo !== 'caso') n.reputacao = clamp((n.reputacao ?? 40) - 8);
  // Quem é próximo e ainda não sabia fica sabendo pelo noticiário.
  for (const { p: x, vin } of vinculosVivos(v)) {
    if (x.especie || s.quemSabe.includes(x.id) || idadePessoa(v, x) < 14) continue;
    if (vin.parentesco === 'mae' || vin.parentesco === 'pai' || (vin.parentesco === 'filho' && idadePessoa(v, x) >= 16)) {
      vin.tensao = clamp(vin.tensao + (s.tipo === 'caso' ? 6 : 10));
      s.quemSabe.push(x.id);
    }
  }
}

/** Um processo ou uma prisão: registro público — para quem tem nome, vira notícia no mesmo ano. */
export function registrarAssuntoDaJustica(v: Vida, tipo: 'processo' | 'prisao'): void {
  const s = registrarSegredo(v, tipo, []);
  if (publicidade(v) >= 25) tornarPublico(v, s);
  else s.publico = -1;
}
