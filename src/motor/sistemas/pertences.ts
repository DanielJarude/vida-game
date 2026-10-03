/**
 * Pertences 2.0 (REWORK 4): usar o que é seu.
 *
 * Comprar → possuir → USAR → (gastar, vender). O uso vai para os sistemas que
 * já existem — não há bônus solto:
 *
 *   violão → a prática da música (`frentes.praticar`) → e, tocando para
 *   alguém, a relação (proximidade, costume, a história de vocês);
 *   câmera → fotografia; notebook → programação, escrita, o estudo de agora;
 *   kit de academia, esteira → o corpo; camping, jogos → a cabeça e a relação.
 *
 * Contra a repetição sem sentido: cada uso de cada coisa, uma vez por ano (o
 * ano do jogo é longo; "tocar" é a prática do ano, não um clique); com a mesma
 * pessoa, o ganho encolhe como em qualquer interação (`interacoes.rendeComEla`).
 * Os sorteios são derivados: usar o violão não muda o acaso do resto da vida.
 */

import type { CoisaTida, Pessoa, Vida } from '../tipos';
import { PERMITIDO, bloqueio, type Veredito } from '../plausibilidade';
import { clamp, rngDe } from '../rng';
import { escrever, idade, idadePessoa, lembrarCom } from '../nucleo';
import { coisa } from '../dados/coisas';
import { usosDaCoisa, variantesDaCoisa, type UsoDeCoisa, type Variante } from '../dados/pertences';
import { praticar } from './frentes';
import { pertoDaAgua } from '../dados/lugares';
import { coisasDaVida } from './coisas';
import { mesmaCidade, moraJunto } from './vinculos';
import { estadoDaRelacao } from './lacos';
import { rendeComEla, vezesComEla } from './interacoes';

const ano = (v: Vida) => Math.floor(v.t / 12);

/** A variante (acabamento e cor) de uma coisa sua. Nasce na compra; saves anteriores a recebem do próprio id, sempre a mesma. */
export function varianteDe(t: CoisaTida): Variante {
  const lista = variantesDaCoisa(t.coisaId);
  if (t.cor) return lista.find(x => x.cor === t.cor) ?? { nome: t.acabamento ?? '', cor: t.cor };
  return lista[Math.floor(rngDe(t.id, 'cor').next() * lista.length)];
}

/** Sorteia a variante de uma coisa recém-comprada (a loja tem o que tem; o que veio é seu). */
export function darVariante(t: CoisaTida): void {
  const x = varianteDe(t);
  t.cor = x.cor;
  t.acabamento = x.nome;
}

/** "violão (madeira escura)". */
export function nomeDaCoisa(t: CoisaTida): string {
  const c = coisa(t.coisaId);
  const x = varianteDe(t);
  return `${c?.nome ?? t.coisaId}${x.nome ? ` (${x.nome})` : ''}`;
}

/** Com quem dá para usar (quem mora junto, ou quem está perto), do mais próximo ao menos (a tela mostra os primeiros). */
export function companhiasPara(v: Vida, u: UsoDeCoisa, todas = false): Pessoa[] {
  if (!u.com) return [];
  return Object.values(v.vinculos)
    .map(vin => ({ vin, p: v.pessoas[vin.pessoaId] }))
    .filter(({ vin, p }) => p && p.vivo && !p.especie && p.nome && idadePessoa(v, p) >= 5
      && (u.com === 'casa' ? moraJunto(vin) : moraJunto(vin) || mesmaCidade(v, p))
      && estadoDaRelacao(v, vin) !== 'rompido' && vin.digital?.bloqueado === undefined
      && (vin.parentesco || vin.romance || vin.convivio.length > 0 || vin.proximidade >= 35))
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)
    .slice(0, todas ? undefined : 6)
    .map(x => x.p);
}

const chaveDoUso = (t: CoisaTida, usoId: string) => `uso:${t.id}:${usoId}`;

export function disponibilidadeUsarCoisa(v: Vida, coisaTidaId: string, usoId: string, pessoaId?: string): Veredito {
  const t = coisasDaVida(v).find(x => x.id === coisaTidaId);
  if (!t) return bloqueio('impossivel', 'Isso não é mais seu.');
  const u = usosDaCoisa(t.coisaId).find(x => x.id === usoId);
  if (!u) return bloqueio('impossivel', 'Isso não se faz com isso.');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if (t.estado < 8) return bloqueio('impossivel', 'Está no fim: não funciona mais direito.');
  if (u.idadeMin && idade(v) < u.idadeMin) return bloqueio('impossivel', `A partir dos ${u.idadeMin} anos.`);
  if (u.mar && !pertoDaAgua(v.moradia.municipioId)) return bloqueio('impossivel', 'Longe do mar.');
  const f = v.fatos[chaveDoUso(t, usoId)];
  if (f !== undefined && Math.floor(f / 12) === ano(v)) return bloqueio('incompativel', 'Você já fez isso neste ano.');
  if (u.com) {
    if (!pessoaId) return companhiasPara(v, u).length ? PERMITIDO : bloqueio('incompativel', u.com === 'casa' ? 'Ninguém mora com você para isso.' : 'Ninguém perto para isso agora.');
    if (!companhiasPara(v, u, true).some(p => p.id === pessoaId)) return bloqueio('incompativel', 'Essa pessoa não está por perto para isso.');
  }
  return PERMITIDO;
}

/** Usa a coisa: o efeito vai para a prática, o corpo, a cabeça, o estudo e a relação. Devolve o que aconteceu. */
export function usarCoisa(v: Vida, coisaTidaId: string, usoId: string, pessoaId?: string): string {
  const t = coisasDaVida(v).find(x => x.id === coisaTidaId)!;
  const u = usosDaCoisa(t.coisaId).find(x => x.id === usoId)!;
  const c = coisa(t.coisaId)!;
  const r = rngDe(v.id, 'uso', usoId, v.t);
  v.fatos[chaveDoUso(t, usoId)] = v.t;
  const vezes = (v.fatos[`usos_de:${t.coisaId}`] = (v.fatos[`usos_de:${t.coisaId}`] ?? 0) + 1);
  if (u.pratica) praticar(v, r, u.pratica[0], u.pratica[1], 1.1);
  if (u.feliz) v.mente.felicidade = clamp(v.mente.felicidade + u.feliz);
  if (u.estresse) v.mente.estresse = clamp(v.mente.estresse + u.estresse);
  if (u.forma) v.corpo.forma = clamp(v.corpo.forma + u.forma);
  if (u.estudo) {
    const m = v.educacao.matricula;
    if (m && !m.trancado) m.desempenho = clamp(m.desempenho + u.estudo);
    else if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho + u.estudo);
  }
  const p = pessoaId ? v.pessoas[pessoaId] : undefined;
  const nome = nomeDaCoisa(t);
  if (p) {
    const vin = v.vinculos[p.id];
    const f = rendeComEla(vezesComEla(v, p.id));
    v.anoAtual.acoes.push(`pessoa:usar_${usoId}:${p.id}`);
    vin.tUltimoContato = v.t;
    vin.proximidade = clamp(Math.round(vin.proximidade + (u.prox ?? 2) * f));
    const h = (vin.habitos ??= {});
    const n = (h[`coisa:${t.coisaId}`] = (h[`coisa:${t.coisaId}`] ?? 0) + 1);
    if (n === 1) lembrarCom(v, p.id, `${u.rotuloCom?.replace('{nome}', p.nome) ?? u.rotulo} pela primeira vez.`.replace(/^(.)/, x => x.toUpperCase()), 'ritual', 1);
    if (n === 3) lembrarCom(v, p.id, `${(u.rotuloCom ?? u.rotulo).replace(/ \{nome\}| com \{nome\}| para \{nome\}/, '').replace(/^(.)/, x => x.toUpperCase())} com ${p.nome} virou costume de vocês.`, 'ritual', 2);
  }
  // A primeira vez que o instrumento (ou a câmera) sai da caixa para alguém fica na Linha da Vida.
  if (p && (c.loja === 'instrumentos' || t.coisaId === 'camera') && v.fatos[`primeiro_uso_com:${t.coisaId}`] === undefined) {
    v.fatos[`primeiro_uso_com:${t.coisaId}`] = v.t;
    escrever(v, { texto: `${(u.rotuloCom ?? u.rotulo).replace('{nome}', p.nome).replace(/^(.)/, x => x.toUpperCase())} pela primeira vez, com ${c.artigo} ${nome}.`, relevancia: 'cotidiano', tema: 'lazer', escolha: true, pessoas: [p.id] });
  }
  const texto = u.textos[(vezes - 1 + Math.floor(r.next() * u.textos.length)) % u.textos.length];
  return texto.replace(/\{nome\}/g, p?.nome ?? '').replace(/\{coisa\}/g, `${c.artigo} ${nome}`).replace(/^(.)/, x => x.toUpperCase());
}

/** Os usos de uma coisa, para a tela (com o veredito de cada um). */
export function usosPara(v: Vida, t: CoisaTida): { uso: UsoDeCoisa; veredito: Veredito; companhias: Pessoa[] }[] {
  return usosDaCoisa(t.coisaId).map(uso => ({ uso, veredito: disponibilidadeUsarCoisa(v, t.id, uso.id), companhias: companhiasPara(v, uso) }));
}
