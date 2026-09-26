/**
 * A rede: o que uma pessoa é para OUTRA pessoa — não só para o jogador.
 *
 * O vínculo guarda o que alguém é para você (sua filha, sua esposa). Mas
 * quando sua filha morre, a mãe dela perdeu uma filha; o marido dela ficou
 * viúvo; os filhos dela ficaram sem mãe; seus pais perderam uma neta. Este
 * módulo deriva esses laços da árvore da família (`genitores`, `parceiroId`,
 * os parentescos do jogador) e diz, para um acontecimento com alguém, QUEM
 * mais é atingido e com que peso.
 *
 * O peso sai do laço real (perder um filho não é perder um sogro) e é o que
 * decide a manifestação: luto de quem ficou (visível em Pessoas), a vida
 * própria de quem tem uma, a saúde de quem é velho, o marco que o jogador
 * passa a dividir com cada um e as situações que nascem depois (o luto do
 * casal, os netos que ficaram sem mãe). Nada disso decide como o JOGADOR
 * reagiu: diz o que aconteceu com as outras pessoas.
 */

import type { Genero, Pessoa, Vida } from '../tipos';
import { clamp } from '../rng';
import { idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { flex, listaNatural } from '../texto';
import { importancia, papelDe } from './vinculos';

/** O que X é para Y. */
export type Laco = 'filho' | 'genitor' | 'conjuge' | 'irmao' | 'neto' | 'avo' | 'genro' | 'sogro';

/** Pai e mãe de alguém ('eu' é o jogador). Só o que a árvore sabe. */
export function paisDe(v: Vida, id: string): string[] {
  if (id === 'eu') return Object.values(v.vinculos).filter(x => x.parentesco === 'mae' || x.parentesco === 'pai').map(x => x.pessoaId);
  const p = v.pessoas[id];
  if (!p) return [];
  if (p.genitores?.length) return p.genitores;
  // Irmãos (inteiros) do jogador são filhos dos mesmos pais.
  if (v.vinculos[id]?.parentesco === 'irmao') return paisDe(v, 'eu');
  return [];
}

/** A parceria de alguém (viva ou não), do ponto de vista da árvore. */
export function conjugeDe(v: Vida, id: string): string | undefined {
  if (id === 'eu') {
    const par = Object.values(v.vinculos).find(x => x.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.romance.estagio) && !x.romance.secreto && (v.pessoas[x.pessoaId]?.vivo || x.romance.fim === 'morte'));
    return par?.pessoaId;
  }
  const p = v.pessoas[id];
  if (!p) return undefined;
  if (p.parceiroId) return p.parceiroId;
  const rom = v.vinculos[id]?.romance;
  if (rom && ['namoro', 'morando_junto', 'casamento'].includes(rom.estagio) && !rom.secreto) return 'eu';
  return undefined;
}

/** O que X é para Y, pela árvore. `undefined` quando não há laço de família conhecido. */
export function lacoCom(v: Vida, yId: string, xId: string): Laco | undefined {
  if (yId === xId) return undefined;
  const px = paisDe(v, xId);
  const py = paisDe(v, yId);
  if (px.includes(yId)) return 'filho';
  if (py.includes(xId)) return 'genitor';
  if (conjugeDe(v, xId) === yId || conjugeDe(v, yId) === xId) return 'conjuge';
  if (px.some(g => py.includes(g))) return 'irmao';
  if (px.some(g => paisDe(v, g).includes(yId))) return 'neto';
  if (py.some(g => paisDe(v, g).includes(xId))) return 'avo';
  const cx = conjugeDe(v, xId);
  if (cx && paisDe(v, cx).includes(yId)) return 'genro';
  const cy = conjugeDe(v, yId);
  if (cy && paisDe(v, cy).includes(xId)) return 'sogro';
  return undefined;
}

/** "filha", "mãe", "marido": o nome do laço, concordando com quem X é. */
export function nomeDoLaco(laco: Laco, g: Genero, casados = true): string {
  switch (laco) {
    case 'filho': return flex(g, 'filho', 'filha', 'filhe');
    case 'genitor': return flex(g, 'pai', 'mãe', 'mãe');
    case 'conjuge': return casados ? flex(g, 'marido', 'esposa', 'cônjuge') : flex(g, 'companheiro', 'companheira', 'companheire');
    case 'irmao': return flex(g, 'irmão', 'irmã', 'irmane');
    case 'neto': return flex(g, 'neto', 'neta', 'nete');
    case 'avo': return flex(g, 'avô', 'avó', 'avó');
    case 'genro': return flex(g, 'genro', 'nora', 'genre');
    case 'sogro': return flex(g, 'sogro', 'sogra', 'sogre');
  }
}

/** "a filha", "o pai": com artigo. */
export const oLaco = (laco: Laco, g: Genero, casados = true) => `${flex(g, 'o', 'a', 'e')} ${nomeDoLaco(laco, g, casados)}`;

/** O peso de perder X para quem tem com X este laço (0..100). Um filho pesa mais que um sogro. */
const PESO_PERDA: Record<Laco, number> = { filho: 92, conjuge: 84, genitor: 66, irmao: 54, avo: 44, neto: 46, genro: 30, sogro: 26 };

export interface Atingido { p: Pessoa; laco: Laco; peso: number }

/**
 * Quem, na vida do jogador, perde alguém com a morte de X — e quanto. Só
 * gente que o jogador conhece (tem vínculo) e que tem idade para entender.
 */
export function quemPerde(v: Vida, x: Pessoa): Atingido[] {
  const out: Atingido[] = [];
  for (const { p } of vinculosVivos(v)) {
    if (p.especie || p.id === x.id) continue;
    const laco = lacoCom(v, p.id, x.id);
    if (!laco) continue;
    const ip = idadePessoa(v, p);
    if (ip < 4) continue;
    let peso = PESO_PERDA[laco];
    // Criança que perde pai ou mãe: é o chão inteiro.
    if (laco === 'genitor' && ip < 18) peso = 86;
    // Um neto que mal conviveu sente menos; quem morava junto, mais.
    const mesmaCasa = x.municipioId === p.municipioId;
    if ((laco === 'neto' || laco === 'avo' || laco === 'irmao') && !mesmaCasa) peso -= 8;
    out.push({ p, laco, peso: clamp(peso) });
  }
  return out.sort((a, b) => b.peso - a.peso);
}

/** Uma perda entra na vida de quem tem vida própria contada (filhos, netos). */
function naTrajetoria(v: Vida, p: Pessoa, texto: string): void {
  if (!p.vida) return;
  p.vida.trajetoria.push({ t: v.t, texto, tipo: 'perda' });
  if (p.vida.trajetoria.length > 24) p.vida.trajetoria.splice(0, p.vida.trajetoria.length - 24);
}

/**
 * A morte de X repercute em quem ficou: o luto de cada um (com o peso do
 * laço), a vida própria de quem tem uma, o corpo de quem é velho, e o marco
 * que o jogador passa a dividir com quem perdeu junto. Devolve os atingidos
 * (para a narrativa da morte dizer quem ficou).
 */
export function repercutirMorte(v: Vida, x: Pessoa): Atingido[] {
  const atingidos = quemPerde(v, x);
  const vinX = v.vinculos[x.id];
  const jogadorSente = vinX ? importancia(v, x, vinX) >= 16 : false;
  for (const a of atingidos) {
    const { p, laco, peso } = a;
    const rotulo = oLaco(laco, x.genero, casadosCom(v, p.id, x.id));
    // O luto de quem ficou: não sobrescreve outro luto mais pesado.
    if (peso >= 40 && !(p.aperto?.tipo === 'luto' && (p.aperto.peso ?? 0) > peso && v.t - p.aperto.t <= 24)) {
      p.aperto = { tipo: 'luto', t: v.t, pessoaId: x.id, peso };
    }
    naTrajetoria(v, p, laco === 'conjuge' ? `Ficou ${flex(p.genero, 'viúvo', 'viúva', 'viúve')} de ${x.nome}.` : `Perdeu ${rotulo}, ${x.nome}.`);
    // Quem é velho e perde um filho ou a parceria de uma vida sente no corpo.
    if (idadePessoa(v, p) >= 65 && peso >= 80) p.saude = clamp(p.saude - 6);
    // O que o jogador passa a dividir com cada um.
    const vinP = v.vinculos[p.id];
    if (!vinP || !jogadorSente) continue;
    const texto = marcoCompartilhado(v, p, x, laco);
    if (texto) lembrarCom(v, p.id, texto, 'perda', peso >= 80 ? 3 : 2);
    if (peso >= 40) {
      vinP.tUltimoContato = v.t;
      // Luto dividido com a parceria: vira uma situação no ano seguinte (o jogo não decide como o casal atravessa).
      if (papelDe(p, vinP) === 'parceiro' && peso >= 60) v.fatos[`luto_casal:${x.id}`] = v.t;
    }
  }
  // Filhos pequenos que ficaram sem pai ou mãe: a pergunta de quem cuida deles.
  const orfaos = atingidos.filter(a => a.laco === 'genitor' && idadePessoa(v, a.p) < 18 && v.vinculos[a.p.id]?.parentesco === 'neto');
  if (orfaos.length && papelDe(x, vinX ?? v.vinculos[x.id]) === 'filho') v.fatos[`netos_orfaos:${x.id}`] = v.t;
  return atingidos;
}

/** Os dois eram casados (e não só juntos)? Na parceria do jogador, pelo estágio. */
function casadosCom(v: Vida, yId: string, xId: string): boolean {
  const rom = v.vinculos[yId]?.romance ?? v.vinculos[xId]?.romance;
  if (rom && (conjugeDe(v, 'eu') === yId || conjugeDe(v, 'eu') === xId)) return rom.estagio === 'casamento';
  return true;
}

/** O marco que o jogador divide com quem perdeu junto, na voz do laço entre os dois e com X. */
function marcoCompartilhado(v: Vida, p: Pessoa, x: Pessoa, laco: Laco): string | undefined {
  const paraMim = v.vinculos[x.id] ? papelDe(x, v.vinculos[x.id]) : undefined;
  const papelP = papelDe(p, v.vinculos[p.id]);
  const ip = idadePessoa(v, p);
  const oX = oLaco(laco, x.genero);
  // A parceria que perdeu um filho com você.
  if (laco === 'filho' && paraMim === 'filho') return `Perderam ${x.nome}, ${flex(x.genero, 'o filho', 'a filha', 'e filhe')} de vocês.`;
  // Irmãos que perdem pai ou mãe juntos.
  if (laco === 'genitor' && papelP === 'irmao' && paraMim === 'genitor') return `Perderam ${x.genero === 'feminino' ? 'a mãe' : 'o pai'} juntos.`;
  // Um filho seu que perde a mãe/o pai (a sua parceria).
  if (laco === 'genitor' && papelP === 'filho') return ip < 18 ? `Perdeu ${oX}, ${x.nome}, aos ${ip} anos.` : `Perdeu ${oX}, ${x.nome}.`;
  if (laco === 'conjuge') return `Ficou ${flex(p.genero, 'viúvo', 'viúva', 'viúve')} de ${x.nome}.`;
  if (laco === 'avo' && (papelP === 'filho' || papelP === 'neto')) return `Perdeu ${oX}, ${x.nome}.`;
  if (laco === 'neto' && papelP === 'genitor') return `Perderam ${x.nome}, ${flex(x.genero, 'o neto', 'a neta', 'e nete')}.`;
  if (laco === 'irmao') return `Perderam ${x.nome}.`;
  if (laco === 'filho') return `Perdeu ${oX}, ${x.nome}.`;
  return undefined;
}

/**
 * Quem ficou, em uma frase curta para a Linha da Vida: "Deixou Pedro, o
 * marido, e dois filhos, Lia e Caio." Só gente que existe na árvore.
 */
export function quemFicouTexto(v: Vida, x: Pessoa, atingidos: Atingido[]): string {
  const conj = atingidos.find(a => a.laco === 'conjuge' && a.p.id !== undefined);
  const filhos = atingidos.filter(a => a.laco === 'genitor').map(a => a.p);
  const partes: string[] = [];
  if (conj) partes.push(`${conj.p.nome}, ${oLaco('conjuge', conj.p.genero, casadosCom(v, conj.p.id, x.id))}`);
  if (filhos.length === 1) partes.push(`${flex(filhos[0].genero, 'um filho', 'uma filha', 'um filho')}, ${filhos[0].nome}`);
  else if (filhos.length > 1) partes.push(`${filhos.length} filhos, ${listaNatural(filhos.map(f => f.nome))}`);
  if (!partes.length) return '';
  // Com aposto ("Pedro, o marido"), o "e" pede vírgula antes.
  return `Deixou ${partes.length === 2 && conj ? `${partes[0]}, e ${partes[1]}` : listaNatural(partes)}.`;
}

/** "de luto pela filha, Ana" — o luto de alguém dito pelo laço com quem se foi. */
export function lutoDe(v: Vida, p: Pessoa): string | undefined {
  if (p.aperto?.tipo !== 'luto' || !p.aperto.pessoaId) return undefined;
  const x = v.pessoas[p.aperto.pessoaId];
  if (!x) return undefined;
  const laco = lacoCom(v, p.id, x.id);
  if (!laco) return `de luto por ${x.nome}`;
  const par = conjugeDe(v, 'eu') === p.id;
  // A parceria do jogador de luto pelo filho dos dois.
  if (par && laco === 'filho' && paisDe(v, x.id).includes('eu')) return `de luto por ${x.nome}, ${flex(x.genero, 'o filho', 'a filha', 'e filhe')} de vocês`;
  const oX = oLaco(laco, x.genero, casadosCom(v, p.id, x.id));
  return `de luto ${oX.startsWith('a ') ? 'pela' : 'pelo'} ${oX.slice(2)}, ${x.nome}`;
}
