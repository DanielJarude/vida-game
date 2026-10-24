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
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { animal, palavraDoBicho } from '../dados/animais';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, vinculosVivos, foraDaParceria } from '../nucleo';
import { flex, ge, listaNatural, rotuloParentesco } from '../texto';
import { MESES, anoDe, mesDe } from '../tempo';
import { descricaoOrigem } from './social';
import { filhosEmComum, importancia, papelDe } from './vinculos';
import { redeDeApoio } from './estado';
import { abalar } from './abalo';
import { lacoCom, nomeDoLaco, quemFicouTexto, repercutirMorte, type Atingido } from './rede';

const juntar = (...partes: string[]) => partes.filter(Boolean).join(' ');

/**
 * Quem mais perdeu, dito na linha da morte: a parceria que perdeu o filho
 * junto com você, o marido e os filhos que ela deixou, o pai que ficou
 * viúvo. Só o que a árvore sustenta; nunca como alguém "reagiu".
 */
function quemFicouNaMorte(v: Vida, p: Pessoa, vin: Vinculo, ficaram: Atingido[]): string {
  if (p.especie) return '';
  const papel = papelDe(p, vin);
  const partes: string[] = [];
  // O outro genitor de um filho seu (a parceria de hoje ou de antes).
  if (papel === 'filho') {
    const outro = ficaram.find(a => a.laco === 'filho');
    if (outro) {
      const vo = v.vinculos[outro.p.id];
      const atual = vo?.romance && ['namoro', 'morando_junto', 'casamento'].includes(vo.romance.estagio) && !foraDaParceria(vo.romance);
      partes.push(atual ? `Você e ${outro.p.nome} perderam ${flex(p.genero, 'o filho', 'a filha', 'e filhe')}.` : `${outro.p.nome}, ${flex(outro.p.genero, 'o pai', 'a mãe', 'a mãe')} ${flex(p.genero, 'dele', 'dela', 'delu')}, também ficou de luto.`);
    }
  }
  // Seus pais: quem ficou viúvo.
  if (papel === 'genitor') {
    const viuvo = ficaram.find(a => a.laco === 'conjuge');
    if (viuvo) partes.push(`${viuvo.p.nome} ficou ${flex(viuvo.p.genero, 'viúvo', 'viúva', 'viúve')}.`);
  }
  // Quem a pessoa deixou (um filho seu que deixa marido e filhos; um irmão que deixa família).
  if (papel !== 'parceiro' && papel !== 'genitor') partes.push(quemFicouTexto(v, p, ficaram.filter(a => a.laco === 'conjuge' || (a.laco === 'genitor' && lacoCom(v, a.p.id, p.id) === 'genitor'))));
  return juntar(...partes);
}
export { nomeDoLaco };

/** "aos 3 anos", mas "com 1 ano" e "com poucos meses". */
const aosAnos = (n: number) => (n < 1 ? 'com poucos meses' : n === 1 ? 'com 1 ano' : `aos ${n} anos`);

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

interface Morte { p: Pessoa; vin: Vinculo; causa: string; peso: number; ficaram?: Atingido[] }

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
    }
    // A morte chega a quem mais perdeu alguém: o luto de cada um vem do laço real com quem morreu (`sistemas/rede`).
    const ficaram = repercutirMorte(v, p);
    // Quem era casado com a pessoa fica viúvo (os pais do jogador entre si, um filho e o cônjuge).
    if (p.parceiroId && v.pessoas[p.parceiroId]) v.pessoas[p.parceiroId].parceiroId = undefined;
    if (vin.parentesco === 'mae' || vin.parentesco === 'pai') heranca(p);

    // O humor sente, na medida do vínculo. Não é uma reação decidida pelo jogo.
    if (peso >= 16) {
      // REWORK 7.5: uma perda grande reaviva as que ainda doem (não as já atravessadas: essas ficam na memória).
      if (peso >= 38) reavivar(v, p.id, peso);
      v.luto.push({ pessoaId: p.id, t: v.t, peso, inicial: peso });
      abalar(v, `a morte de ${p.nome}`, -peso * 0.15, peso * 0.1);
    }

    if (nivel === 'interrompe') v.fatos[`despedida:${p.id}`] = v.t;
    if (nivel === 'interrompe' || nivel === 'destaque') {
      escrever(v, {
        t: p.tMorte, texto: juntar(textoDaMorte(v, p, vin, causa, nivel), quemFicouNaMorte(v, p, vin, ficaram)), relevancia: 'marco', tema: 'perda', tom: 'ruim', pessoas: [p.id],
        evento: { tipo: eraParceria ? 'viuvez' : 'morte', pessoaId: p.id, peso }
      });
    } else if (nivel === 'discreto') {
      discretos.push({ ...m, ficaram });
    } else {
      escrever(v, { texto: `Morreu ${p.nome}${quem(v, p, vin) ? `, ${quem(v, p, vin)}` : ''}.`, relevancia: 'tecnico', tema: 'perda', pessoas: [p.id], evento: { tipo: 'morte', pessoaId: p.id, peso } });
    }
  }
  // Várias perdas menores no mesmo ano viram uma linha só (a velhice não é uma lista de óbitos).
  if (discretos.length === 1) {
    const { p, vin, causa, peso, ficaram } = discretos[0];
    escrever(v, { t: p.tMorte, texto: juntar(textoDaMorte(v, p, vin, causa, 'discreto'), quemFicouNaMorte(v, p, vin, ficaram ?? [])), relevancia: peso >= 28 ? 'biografia' : 'cotidiano', tema: 'perda', tom: 'ruim', pessoas: [p.id], evento: { tipo: 'morte', pessoaId: p.id, peso } });
  } else if (discretos.length > 1) {
    const nomes = discretos.map(({ p, vin }) => `${quem(v, p, vin) || flex(p.genero, 'o conhecido', 'a conhecida', 'e conhecide')} ${p.nome}`.trim());
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
    const partes = [`${anos === 1 ? 'Foi um ano' : `Foram ${anos} anos`} juntos`];
    if (casados && casados < anos) partes.push(`${casados} de casamento`);
    const junto = partes.join(', ') + (filhosJuntos ? `, ${filhosJuntos === 1 ? 'um filho' : `${filhosJuntos} filhos`}` : '');
    const casa = vinculosVivos(v).some(x => x.vin.convivio.includes('casa') && !x.p.especie) ? 'A casa ficou com um lugar vazio na mesa.' : 'A casa ficou em silêncio.';
    return `Em ${mes}, ${p.nome} morreu, ${aosAnos(ip)} (${causa}). ${junto}. ${casa} ${flex(g, 'Viúvo', 'Viúva', 'Viúve')} aos ${idade(v)}.`;
  }
  if (papel === 'filho') {
    return `${capital(quem(v, p, vin))} ${p.nome} morreu em ${mes}, ${aosAnos(ip)} (${causa}). Não existe palavra para quem perde ${flex(p.genero, 'um filho', 'uma filha', 'um filho')}.`;
  }
  if (p.especie) {
    const anos = Math.max(1, Math.round((v.t - (p.pet?.tChegada ?? vin.tInicio)) / 12));
    const bicho = palavraDoBicho(p.especie, p.genero);
    const paliativo = v.fatos[`paliativo_${p.id}`] !== undefined;
    const grupo = animal(p.especie).grupo;
    const vazio = grupo === 'gato' ? 'A almofada da janela ficou vazia.' : grupo === 'cao' ? 'A casa ficou estranha sem o barulho das patas no corredor.' : grupo === 'ave' ? 'A casa ficou silenciosa de manhã.' : grupo === 'peixe' ? 'O aquário ficou parado na sala.' : grupo === 'reptil' ? 'O cantinho de sol ficou vazio.' : 'A gaiola ficou vazia no canto da sala.';
    const velhice = causa === 'velhice';
    return `${capital(bicho)} ${p.nome} morreu em ${mes}, ${aosAnos(ip)}${velhice ? ', de velhice' : ` (${causa})`}${paliativo ? ', sem sofrer, perto de quem cuidava' : ''}. ${anos === 1 ? 'Foi um ano' : `Foram ${anos} anos`} juntos. ${vazio}`;
  }
  const rotulo = quem(v, p, vin);
  if (vin.parentesco === 'mae' || vin.parentesco === 'pai') {
    const perto = vin.proximidade >= 55 ? ` ${idade(v)} anos com ${flex(p.genero, 'ele', 'ela', 'elu')} na sua vida.` : '';
    return `${capital(rotulo)}, ${p.nome}, morreu em ${mes}, ${aosAnos(ip)} (${causa}).${nivel === 'interrompe' ? perto : ''}`;
  }
  if (rotulo && vin.parentesco) return `${capital(rotulo)} ${p.nome} morreu, ${aosAnos(ip)} (${causa}).`;
  if (rotulo) return `${capital(rotulo)} ${p.nome} morreu ${aosAnos(ip)} (${causa}). Eram amigos desde ${anoDe(vin.tInicio)}, quando se conheceram ${descricaoOrigem(v, vin)}.`;
  return `${p.nome}, que você conheceu ${descricaoOrigem(v, vin)}, morreu ${aosAnos(ip)} (${causa}).`;
}

/**
 * O luto anda com os anos, mais depressa com gente por perto. Não há
 * número de anos "certo": depende do vínculo, da rede e de como o jogador
 * escolheu atravessar a despedida.
 *
 * REWORK 7.5 — o playtest viu a morte de um avô pesando igual no ano seguinte. Agora o ritmo é PROPORCIONAL ao tamanho
 * da perda (`inicial`): a de alguém central (≥ 62: o cônjuge, um filho, quem criou você) atravessa anos, devagar; a
 * de alguém importante mas não central (o avô, um amigo) se acalma em dois ou três; uma perda menor, em um ou dois.
 * Ajudam a rede de apoio, a despedida vivida (homenagem, reunir, cuidar de quem ficou, as homenagens depois) e o
 * jeito de quem procura gente para falar; pesa enfrentar sozinho. A memória não sai: a perda continua na Linha da Vida e na ficha —
 * só o impacto de agora diminui. Nenhum prazo é igual para todos.
 */
export function processarLuto(v: Vida): void {
  if (!v.luto?.length) return;
  const suporte = redeDeApoio(v);
  // Quem procura gente para falar atravessa um pouco mais depressa; quem se fecha, um pouco mais devagar.
  const abre = (v.personalidade?.tracos?.sociabilidade ?? 0) / 100;
  for (const l of v.luto) {
    const inicial = l.inicial ?? l.peso;
    const como = l.como === 'reunir' || l.como === 'homenagem' || l.como === 'apoiar' ? 0.05 : l.como === 'sozinho' ? -0.02 : 0;
    // O ritmo pelo tamanho da perda: a central anda devagar; a menor, depressa.
    const ritmo = inicial >= 62 ? 0.74 : inicial >= 38 ? 0.6 : 0.46;
    const reavivado = l.reativado !== undefined && v.t - l.reativado <= 12 ? 0.08 : 0;
    const decaimento = Math.max(0.3, ritmo - Math.min(0.18, suporte * 0.045) - como - Math.max(-0.03, Math.min(0.03, abre * 0.06)) - homenagensDoAno(v, l.pessoaId) + reavivado);
    l.peso = Math.round(l.peso * decaimento);
  }
  v.luto = v.luto.filter(l => l.peso >= 6);
}

/** As homenagens feitas a alguém no último ano (cada uma ajuda um pouco a atravessar: −0,03 no ritmo, até −0,06). */
function homenagensDoAno(v: Vida, pessoaId: string): number {
  let n = 0;
  for (const [k, t] of Object.entries(v.fatos)) if (k.startsWith('hom:') && k.endsWith(`:${pessoaId}`) && v.t - t <= 12) n++;
  return Math.min(0.06, n * 0.03);
}

/** Outra perda grande reaviva o luto que ainda não passou (um pouco, nunca acima do que ele já foi). */
function reavivar(v: Vida, exceto: string, pesoNovo: number): void {
  for (const l of v.luto) {
    if (l.pessoaId === exceto) continue;
    const inicial = l.inicial ?? l.peso;
    l.peso = Math.min(inicial, Math.round(l.peso + Math.min(10, pesoNovo * 0.12)));
    l.reativado = v.t;
  }
}

export type FaseDoLuto = 'ativo' | 'recuperando';

/** Em que ponto está um luto: ATIVO (o impacto ainda é mais da metade do que foi) ou se RECUPERANDO. */
export function faseDoLuto(l: { peso: number; inicial?: number }): FaseDoLuto {
  return l.peso >= (l.inicial ?? l.peso) * 0.55 ? 'ativo' : 'recuperando';
}

/** Quantas pessoas próximas estão, de fato, presentes (parceria, amigos, filhos, irmãos). */
export { redeDeApoio };

/** Peso do luto ainda sendo atravessado (0..~100). */
export const pesoDoLuto = (v: Vida) => (v.luto ?? []).reduce((s, l) => s + l.peso, 0);

/** Parentes vivos de quem morreu que sofrem mais (para "cuidar de quem ficou"). */
export function quemFicou(v: Vida, falecidoId: string): Pessoa[] {
  const out: { p: Pessoa; peso: number }[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || idadePessoa(v, p) < 5) continue;
    if (p.aperto?.tipo === 'luto' && p.aperto.pessoaId === falecidoId) out.push({ p, peso: p.aperto.peso ?? 50 });
    else if (p.genitores?.includes(falecidoId) && vin.proximidade >= 30) out.push({ p, peso: 60 });
  }
  // Quem perdeu mais vem primeiro (a mãe que perdeu a filha antes do primo).
  return out.sort((a, b) => b.peso - a.peso).map(x => x.p);
}
