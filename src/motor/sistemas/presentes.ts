/**
 * Dar um presente (REWORK 4): uma pessoa + uma coisa do MESMO catálogo das
 * lojas (`dados/coisas`) — não um segundo catálogo. O violão que você dá à
 * sua sobrinha é o violão da loja de instrumentos da sua cidade, pelo preço
 * daqui, com a cor que veio; ela passa a tê-lo (`Pessoa.ganhou`), e a ficha
 * dela diz.
 *
 * O que pesa no efeito: acertar o gosto da pessoa (o interesse dela, o jeito,
 * a idade), o tamanho do gesto para quem dá (o preço diante da sua renda) e
 * a relação — presente não compra afeto de quem está brigado com você. Um por
 * pessoa por ano; a mesma coisa duas vezes, não.
 */

import type { Pessoa, Vida } from '../tipos';
import { PERMITIDO, bloqueio, type Veredito } from '../plausibilidade';
import { clamp, rngDe } from '../rng';
import { idade, idadePessoa, lembrarCom } from '../nucleo';
import { coisa, COISAS, type Coisa } from '../dados/coisas';
import { variantesDaCoisa } from '../dados/pertences';
import { pertoDaAgua } from '../dados/lugares';
import { pagar, rendaPropriaMensal, vereditoDePagar } from './dinheiro';
import { precoDaCoisa } from './coisas';
import { estadoDaRelacao } from './lacos';
import { interesseDe } from './interacoes';
import { flex } from '../texto';

/** O que combina com quem (pelo interesse da pessoa, que o motor já usa para os filhos). */
const DO_INTERESSE: Record<string, string[]> = {
  'desenho': ['material_arte', 'tablet'], 'futebol': ['chuteira_bola'], 'música': ['violao', 'teclado', 'guitarra', 'caixa_som'],
  'ciências': ['livros', 'notebook'], 'dança': ['caixa_som'], 'leitura': ['livros'], 'xadrez': ['tabuleiro'], 'natação': []
};

export type Gosto = 'certeiro' | 'bom' | 'neutro';

function gostoDe(v: Vida, p: Pessoa, c: Coisa): Gosto {
  const ip = idadePessoa(v, p);
  if ((DO_INTERESSE[interesseDe(p)] ?? []).includes(c.id)) return 'certeiro';
  const t = p.temperamento;
  if (t.abertura > 0.3 && (c.loja === 'livraria' || c.id === 'camera' || c.loja === 'instrumentos')) return 'bom';
  if (t.extroversao > 0.3 && (c.id === 'jogos_tabuleiro' || c.id === 'caixa_som' || c.id === 'videogame' || c.id === 'camping')) return 'bom';
  if (ip < 14 && (c.id === 'videogame' || c.id === 'jogos_tabuleiro' || c.id === 'chuteira_bola' || c.id === 'material_arte')) return 'bom';
  if (ip >= 13 && ip <= 22 && (c.id.startsWith('celular') || c.id === 'caixa_som')) return 'bom';
  if (ip >= 60 && (c.id === 'livros' || c.id === 'jogos_tabuleiro')) return 'bom';
  return 'neutro';
}

/** O que dá para dar a esta pessoa (o catálogo das lojas, filtrado pelo que faz sentido levar de presente). */
export function presentesPara(v: Vida, pessoaId: string): { coisa: Coisa; preco: number; gosto: Gosto; veredito: Veredito }[] {
  const p = v.pessoas[pessoaId];
  if (!p || !p.vivo || p.especie) return [];
  const ip = idadePessoa(v, p);
  return COISAS
    .filter(c => !c.daCasa && (c.idadeMin ?? 6) <= Math.max(ip, 6) && ip >= 3 && !(c.id === 'prancha' && !pertoDaAgua(p.municipioId)) && c.preco <= 9000)
    .map(c => {
      const preco = precoDaCoisa(v, c.id);
      return { coisa: c, preco, gosto: gostoDe(v, p, c), veredito: disponibilidadePresentear(v, pessoaId, c.id) };
    })
    .sort((a, b) => ['certeiro', 'bom', 'neutro'].indexOf(a.gosto) - ['certeiro', 'bom', 'neutro'].indexOf(b.gosto) || a.preco - b.preco);
}

export function disponibilidadePresentear(v: Vida, pessoaId: string, coisaId: string): Veredito {
  const p = v.pessoas[pessoaId];
  const vin = v.vinculos[pessoaId];
  const c = coisa(coisaId);
  if (!p || !vin || !p.vivo || !c) return bloqueio('impossivel', 'Não dá para dar isso.');
  if (idade(v) < 10) return bloqueio('impossivel', 'Com essa idade, o presente é um desenho — e vale mais.');
  if (estadoDaRelacao(v, vin) === 'rompido') return bloqueio('incompativel', 'Vocês não se falam: um presente agora não chegaria como presente.');
  if (vin.digital?.bloqueado !== undefined) return bloqueio('incompativel', 'Você bloqueou essa pessoa.');
  const f = v.fatos[`presente_coisa_${pessoaId}`];
  if (f !== undefined && Math.floor(f / 12) === Math.floor(v.t / 12)) return bloqueio('incompativel', `Você já deu um presente a ${p.nome} neste ano.`);
  if ((p.ganhou ?? []).some(x => x.coisaId === coisaId)) return bloqueio('incompativel', `${p.nome} já tem ${c.artigo} ${c.nome} que você deu.`);
  return vereditoDePagar(v, precoDaCoisa(v, coisaId)) ?? PERMITIDO;
}

/** Dá o presente: paga, a pessoa passa a ter a coisa, a relação sente — pelo gosto, pelo gesto e pela relação. */
export function presentear(v: Vida, pessoaId: string, coisaId: string): string {
  const p = v.pessoas[pessoaId];
  const vin = v.vinculos[pessoaId];
  const c = coisa(coisaId)!;
  const preco = precoDaCoisa(v, coisaId);
  pagar(v, preco);
  const vs = variantesDaCoisa(coisaId);
  const cor = vs[Math.floor(rngDe(v.id, pessoaId, coisaId, v.t).next() * vs.length)];
  (p.ganhou ??= []).push({ coisaId, t: v.t, cor: cor.cor, acabamento: cor.nome });
  v.fatos[`presente_coisa_${pessoaId}`] = v.t;
  const gosto = gostoDe(v, p, c);
  // O tamanho do gesto: o preço diante da renda de quem dá (um violão vale mais vindo de quem ganha pouco).
  const renda = Math.max(800, rendaPropriaMensal(v));
  const gesto = clamp(Math.round((preco / renda) * 2), 0, 4);
  const tensa = vin.tensao >= 40;
  const ganho = (gosto === 'certeiro' ? 8 : gosto === 'bom' ? 5 : 2) + gesto - (tensa ? 3 : 0);
  vin.proximidade = clamp(vin.proximidade + Math.max(1, ganho));
  vin.confianca = clamp(vin.confianca + (tensa ? 0 : 2));
  if (tensa) vin.tensao = clamp(vin.tensao - 6);
  vin.tUltimoContato = v.t;
  v.anoAtual.acoes.push(`pessoa:presente:${pessoaId}`);
  lembrarCom(v, pessoaId, `Ganhou de você ${c.artigo} ${c.nome} (${cor.nome}).`, gosto === 'certeiro' ? 'apoio' : 'ritual', gosto === 'certeiro' ? 2 : 1);
  const ele = flex(p.genero, 'ele', 'ela', 'elu');
  if (tensa) return `${p.nome} agradeceu, meio sem jeito. O presente não resolveu o que está entre vocês — mas abriu uma porta.`;
  if (gosto === 'certeiro') return `${p.nome} abriu ${c.artigo} ${c.nome} ${cor.nome} e ficou um tempo sem falar. Era exatamente o que ${ele} queria.`;
  if (gosto === 'bom') return `${p.nome} gostou de verdade d${c.artigo} ${c.nome} — e usou na mesma semana.`;
  return `${p.nome} agradeceu ${c.artigo === 'a' || c.artigo === 'as' ? 'a' : 'o'} ${c.nome}. Talvez não fosse bem o que ${ele} usaria, mas o gesto ficou.`;
}

/** O que a pessoa tem que ganhou de você (para a ficha). */
export function presentesDados(p: Pessoa): string[] {
  return (p.ganhou ?? []).map(x => { const c = coisa(x.coisaId); return c ? `${c.nome}${x.acabamento ? ` (${x.acabamento})` : ''}` : x.coisaId; });
}
