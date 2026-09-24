/**
 * Mortes e luto.
 *
 * O peso de uma perda vem do que a pessoa era na vida do jogador (papel,
 * afeto, morar junto, anos de relação, história vivida) — `importancia`.
 * Com ele, a morte ganha um lugar proporcional:
 *
 *   interrompe — a vida para: abre a despedida (decisão do jogador) e o
 *                texto conta quem a pessoa foi (anos juntos, filhos em comum);
 *   destaque   — marco na Linha da Vida;
 *   discreto   — uma linha; várias no mesmo ano viram uma só;
 *   registro   — fica em "Quem se foi", fora da biografia.
 *
 * O jogo diz que a pessoa morreu e o que isso muda na casa e na rotina. NÃO
 * decide como o jogador reagiu: o luto pesa no humor conforme o vínculo e a
 * rede de apoio, e a despedida — homenagem, reunir a família, guardar uma
 * lembrança, cuidar de quem ficou, voltar à rotina — é escolha dele.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, vinculosVivos } from '../nucleo';
import { flex, ge, listaNatural, rotuloParentesco } from '../texto';
import { MESES, anoDe, mesDe } from '../tempo';
import { descricaoOrigem } from './social';
import { filhosEmComum, importancia, papelDe } from './vinculos';

export type NivelPerda = 'interrompe' | 'destaque' | 'discreto' | 'registro';

export function nivelDaPerda(peso: number): NivelPerda {
  if (peso >= 62) return 'interrompe';
  if (peso >= 38) return 'destaque';
  if (peso >= 16) return 'discreto';
  return 'registro';
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const seuSua = (p: Pessoa) => flex(p.genero, 'seu', 'sua', 'sue');

/** Rótulo de quem morreu, do ponto de vista do jogador ("sua mãe", "seu amigo de escola"). */
function quem(_v: Vida, p: Pessoa, vin: Vinculo): string {
  if (vin.parentesco) return `${seuSua(p)} ${rotuloParentesco(p, vin.parentesco)}`;
  const papel = papelDe(p, vin);
  if (papel === 'amigo_proximo' || papel === 'amigo') return `${seuSua(p)} ${flex(p.genero, 'amigo', 'amiga', 'amigue')}`;
  return '';
}

/** Anos de casamento (pelo marco na história do casal), se houve. */
function anosDeCasamento(v: Vida, vin: Vinculo): number | null {
  const m = vin.historia.find(h => h.tipo === 'casamento' || h.texto === 'Casaram-se.');
  return m ? Math.max(1, Math.round((v.t - m.t) / 12)) : null;
}

interface Morte { p: Pessoa; vin: Vinculo; causa: string; peso: number }

/**
 * Registra as mortes do ano: estado, casa, herança, luto e narrativa com
 * hierarquia. Deve ser chamada com o vínculo ainda como era em vida.
 */
export function registrarMortes(v: Vida, r: Rng, mortes: { p: Pessoa; vin: Vinculo; causa: string }[], heranca: (p: Pessoa) => void): void {
  if (mortes.length === 0) return;
  const lista: Morte[] = mortes.map(m => ({ ...m, peso: importancia(v, m.p, m.vin) }));
  const discretos: Morte[] = [];
  for (const m of lista.sort((a, b) => b.peso - a.peso)) {
    const { p, vin, causa, peso } = m;
    const papel = papelDe(p, vin);
    const eraParceria = papel === 'parceiro';
    p.vivo = false;
    p.tMorte = v.t - r.int(0, 11);
    p.causaMorte = causa;
    const nivel = nivelDaPerda(peso);

    // A casa e o estado civil mudam.
    if (vin.romance && vin.romance.estagio !== 'ex') {
      vin.romance.fim = 'morte';
      vin.romance.secreto = undefined;
    }
    vin.convivio = [];
    lembrarCom(v, p.id, `Morreu, aos ${idadePessoa(v, p)} anos.`, 'perda', 3, p.tMorte);
    if (eraParceria) {
      marcarFato(v, 'viuvez');
      v.fatos['viuvez'] = v.t;
      for (const f of filhosEmComum(v, p.id)) if (f.vivo) f.aperto = { tipo: 'luto', t: v.t, pessoaId: p.id };
    }
    // Quem era casado com a pessoa fica viúvo (os pais do jogador entre si, um filho e o cônjuge).
    if (p.parceiroId && v.pessoas[p.parceiroId]) {
      const viuvo = v.pessoas[p.parceiroId];
      viuvo.parceiroId = undefined;
      if (viuvo.vivo && v.vinculos[viuvo.id]) {
        viuvo.aperto = { tipo: 'luto', t: v.t, pessoaId: p.id };
        if (['mae', 'pai'].includes(v.vinculos[viuvo.id].parentesco ?? '')) lembrarCom(v, viuvo.id, `Ficou ${flex(viuvo.genero, 'viúvo', 'viúva', 'viúve')} de ${p.nome}.`, 'perda', 2);
      }
    }
    if (papel === 'filho') for (const x of Object.values(v.pessoas)) if (x.genitores?.includes(p.id) && x.vivo) x.aperto = { tipo: 'luto', t: v.t, pessoaId: p.id };
    if (vin.parentesco === 'mae' || vin.parentesco === 'pai') {
      heranca(p);
      // Irmãos perdem juntos.
      for (const x of vinculosVivos(v)) if (x.vin.parentesco === 'irmao' || (x.vin.parentesco === 'meio_irmao' && x.p.genitores?.includes(p.id))) lembrarCom(v, x.p.id, `Perderam ${vin.parentesco === 'mae' ? 'a mãe' : 'o pai'} juntos.`, 'perda', 2);
    }

    // O humor sente, na medida do vínculo. Não é uma reação decidida pelo jogo.
    if (peso >= 16) {
      v.luto.push({ pessoaId: p.id, t: v.t, peso });
      v.mente.felicidade = clamp(Math.round(v.mente.felicidade - peso * 0.15));
      v.mente.estresse = clamp(Math.round(v.mente.estresse + peso * 0.1));
    }

    if (nivel === 'interrompe') v.fatos[`despedida:${p.id}`] = v.t;
    if (nivel === 'interrompe' || nivel === 'destaque') {
      escrever(v, {
        t: p.tMorte, texto: textoDaMorte(v, p, vin, causa, nivel), relevancia: 'marco', tema: 'perda', tom: 'ruim', pessoas: [p.id],
        evento: { tipo: eraParceria ? 'viuvez' : 'morte', pessoaId: p.id, peso }
      });
    } else if (nivel === 'discreto') {
      discretos.push(m);
    } else {
      escrever(v, { texto: `Morreu ${p.nome}${quem(v, p, vin) ? `, ${quem(v, p, vin)}` : ''}.`, relevancia: 'tecnico', tema: 'perda', pessoas: [p.id], evento: { tipo: 'morte', pessoaId: p.id, peso } });
    }
  }
  // Várias perdas menores no mesmo ano viram uma linha só (a velhice não é uma lista de óbitos).
  if (discretos.length === 1) {
    const { p, vin, causa, peso } = discretos[0];
    escrever(v, { t: p.tMorte, texto: textoDaMorte(v, p, vin, causa, 'discreto'), relevancia: peso >= 28 ? 'biografia' : 'cotidiano', tema: 'perda', tom: 'ruim', pessoas: [p.id], evento: { tipo: 'morte', pessoaId: p.id, peso } });
  } else if (discretos.length > 1) {
    const nomes = discretos.map(({ p, vin }) => `${quem(v, p, vin) || 'o conhecido'} ${p.nome}`.trim());
    const havia = lista.some(x => nivelDaPerda(x.peso) === 'interrompe' || nivelDaPerda(x.peso) === 'destaque');
    escrever(v, { texto: `${havia ? 'Também se foram, naquele ano' : 'Se foram, naquele ano'}: ${listaNatural(nomes)}.`, relevancia: havia || Math.max(...discretos.map(d => d.peso)) < 28 ? 'cotidiano' : 'biografia', tema: 'perda', tom: 'ruim', pessoas: discretos.map(d => d.p.id), evento: { tipo: 'morte', peso: Math.max(...discretos.map(d => d.peso)) } });
  }
}

function textoDaMorte(v: Vida, p: Pessoa, vin: Vinculo, causa: string, nivel: NivelPerda): string {
  const papel = papelDe(p, vin);
  const ip = idadePessoa(v, p);
  const mes = MESES[mesDe(p.tMorte ?? v.t)];
  const g = ge(v);
  if (papel === 'parceiro') {
    const rom = vin.romance!;
    const anos = Math.max(1, Math.round((v.t - (rom.tInicio ?? vin.tInicio)) / 12));
    const casados = anosDeCasamento(v, vin);
    const filhosJuntos = filhosEmComum(v, p.id).length;
    const partes = [`Foram ${anos} ${anos === 1 ? 'ano' : 'anos'} juntos`];
    if (casados && casados < anos) partes.push(`${casados} de casamento`);
    const junto = partes.join(', ') + (filhosJuntos ? `, ${filhosJuntos === 1 ? 'um filho' : `${filhosJuntos} filhos`}` : '');
    const casa = vinculosVivos(v).some(x => x.vin.convivio.includes('casa') && !x.p.especie) ? 'A casa ficou com um lugar vazio na mesa.' : 'A casa ficou em silêncio.';
    return `Em ${mes}, ${p.nome} morreu, aos ${ip} anos (${causa}). ${junto}. ${casa} ${flex(g, 'Viúvo', 'Viúva', 'Viúve')} aos ${idade(v)}.`;
  }
  if (papel === 'filho') {
    return `${capital(quem(v, p, vin))} ${p.nome} morreu em ${mes}, aos ${ip} anos (${causa}). Não existe palavra para quem perde ${flex(p.genero, 'um filho', 'uma filha', 'um filho')}.`;
  }
  const rotulo = quem(v, p, vin);
  if (vin.parentesco === 'mae' || vin.parentesco === 'pai') {
    const perto = vin.proximidade >= 55 ? ` ${idade(v)} anos com ${flex(p.genero, 'ele', 'ela', 'elu')} na sua vida.` : '';
    return `${capital(rotulo)}, ${p.nome}, morreu em ${mes}, aos ${ip} anos (${causa}).${nivel === 'interrompe' ? perto : ''}`;
  }
  if (rotulo && vin.parentesco) return `${capital(rotulo)} ${p.nome} morreu, aos ${ip} anos (${causa}).`;
  if (rotulo) return `${capital(rotulo)} ${p.nome} morreu aos ${ip} anos (${causa}). Eram amigos desde ${anoDe(vin.tInicio)}, quando se conheceram ${descricaoOrigem(v, vin)}.`;
  return `${p.nome}, que você conheceu ${descricaoOrigem(v, vin)}, morreu aos ${ip} anos (${causa}).`;
}

/**
 * O luto anda com os anos, mais depressa com gente por perto. Não há
 * número de anos "certo": depende do vínculo, da rede e de como o jogador
 * escolheu atravessar a despedida.
 */
export function processarLuto(v: Vida): void {
  if (!v.luto?.length) return;
  const suporte = redeDeApoio(v);
  for (const l of v.luto) {
    const como = l.como === 'reunir' || l.como === 'homenagem' || l.como === 'apoiar' ? 0.05 : l.como === 'sozinho' ? -0.02 : 0;
    const decaimento = 0.72 - Math.min(0.18, suporte * 0.045) - como;
    l.peso = Math.round(l.peso * decaimento);
  }
  v.luto = v.luto.filter(l => l.peso >= 6);
}

/** Quantas pessoas próximas estão, de fato, presentes (parceria, amigos, filhos, irmãos). */
export function redeDeApoio(v: Vida): number {
  let n = 0;
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie) continue;
    const recente = v.t - vin.tUltimoContato < 24 || vin.convivio.length > 0;
    if (!recente) continue;
    const papel = papelDe(p, vin);
    if (papel === 'parceiro') n += 1.5;
    else if (papel === 'amigo_proximo') n += 1;
    else if ((papel === 'filho' || papel === 'irmao' || papel === 'genitor' || papel === 'neto') && vin.proximidade >= 55 && idadePessoa(v, p) >= 12) n += 0.8;
    else if (papel === 'amigo' && vin.proximidade >= 50) n += 0.4;
  }
  return n;
}

/** Peso do luto ainda sendo atravessado (0..~100). */
export const pesoDoLuto = (v: Vida) => (v.luto ?? []).reduce((s, l) => s + l.peso, 0);

/** Parentes vivos de quem morreu que sofrem mais (para "cuidar de quem ficou"). */
export function quemFicou(v: Vida, falecidoId: string): Pessoa[] {
  const out: Pessoa[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || idadePessoa(v, p) < 5) continue;
    if (p.aperto?.tipo === 'luto' && p.aperto.pessoaId === falecidoId) out.push(p);
    else if (p.genitores?.includes(falecidoId) && vin.proximidade >= 30) out.push(p);
  }
  return out;
}
