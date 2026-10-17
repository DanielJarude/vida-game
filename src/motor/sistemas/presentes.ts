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
  return reacaoAoPresente(v, p, vin, c, cor.nome, gosto, gesto, tensa);
}

/* ------------------------------------------------------------------ A reação */

type Tipo = 'instrumento' | 'tela' | 'casa' | 'esporte' | 'leitura' | 'jogo' | 'arte';
const TIPO_DA_COISA = (c: Coisa): Tipo =>
  c.loja === 'instrumentos' ? 'instrumento' : c.loja === 'eletronicos' ? 'tela' : c.loja === 'esportes' ? 'esporte'
    : c.id === 'material_arte' ? 'arte' : c.id === 'livros' || c.id === 'livros_estudo' ? 'leitura' : c.loja === 'livraria' ? 'jogo' : 'casa';

/**
 * REWORK 8 (Fase B) — a reação ao presente sai do CONTEXTO, não de três frases fixas: o tipo da coisa (um instrumento
 * se experimenta, uma tela se configura, um jogo se joga), a idade de quem ganha (a criança não larga; o adolescente
 * disfarça; quem tem mais idade pede ajuda com o aparelho), o jeito (quem é expansivo mostra para todo mundo; quem é
 * reservado agradece baixo), a relação (o par, o pai ou a mãe, o filho, o amigo) e o tamanho do gesto. Um presente
 * simples pode ser o mais certeiro. A reação fala só do que acontece AGORA — nunca inventa uma lembrança que vocês não
 * viveram (nada de "lembrou daquela viagem"). As variações são estáveis por presente (a mesma semente dá a mesma frase;
 * dois presentes diferentes não dão a mesma frase).
 */
export function reacaoAoPresente(v: Vida, p: Pessoa, vin: { tensao: number; proximidade: number; parentesco?: string; romance?: unknown }, c: Coisa, corNome: string, gosto: Gosto, gesto: number, tensa: boolean): string {
  const r = rngDe(v.id, p.id, c.id, v.t, 'reacao');
  const um = <T,>(xs: T[]): T => xs[Math.floor(r.next() * xs.length)];
  const ip = idadePessoa(v, p);
  const fase = ip < 13 ? 'crianca' : ip < 18 ? 'adolescente' : ip < 65 ? 'adulto' : 'idoso';
  const t = p.temperamento;
  const tipo = TIPO_DA_COISA(c);
  const g = (m: string, f: string, n?: string) => flex(p.genero, m, f, n);
  const ele = g('ele', 'ela', 'elu');
  const o = `${c.artigo} ${c.nome}`;
  const doObjeto = `${c.artigo === 'a' ? 'da' : c.artigo === 'as' ? 'das' : c.artigo === 'os' ? 'dos' : 'do'} ${c.nome}`;
  const par = !!vin.romance;
  const paiOuMae = vin.parentesco === 'mae' || vin.parentesco === 'pai';
  const filho = vin.parentesco === 'filho' || vin.parentesco === 'neto';

  if (tensa) return um([
    `${p.nome} agradeceu, meio sem jeito. O presente não resolveu o que está entre vocês — mas abriu uma porta.`,
    `${p.nome} recebeu ${o} com um "obrigad${g('o', 'a', 'e')}" curto. Ainda há coisa por dizer entre vocês; o gesto, pelo menos, foi visto.`,
    `${p.nome} não esperava. Guardou ${o} sem muita conversa — mas a conversa seguinte foi menos dura.`
  ]);

  // A abertura: o jeito de quem ganha e a idade.
  const abertura = fase === 'crianca'
    ? um([`${p.nome} rasgou o papel antes de você terminar de entregar`, `${p.nome} deu um grito quando viu o que era`, `${p.nome} abraçou a caixa antes de abrir`])
    : fase === 'adolescente'
      ? (t.extroversao > 0.2 ? um([`${p.nome} tirou foto ${doObjeto} na hora`, `${p.nome} abriu e já mandou mensagem para alguém contando`]) : um([`${p.nome} disse "valeu" do jeito de quem gostou mais do que mostra`, `${p.nome} tentou parecer indiferente e não conseguiu`]))
      : t.extroversao > 0.3 ? um([`${p.nome} mostrou ${o} para quem estava por perto`, `${p.nome} riu alto quando abriu`])
        : t.afabilidade > 0.3 ? um([`${p.nome} agradeceu duas vezes`, `${p.nome} segurou ${o} com cuidado e agradeceu baixinho`])
          : um([`${p.nome} abriu devagar`, `${p.nome} olhou ${o} ${corNome} por um tempo`]);

  // O uso: o que se faz com ESTA coisa, nesta idade (o que acontece agora, nada de lembrança inventada).
  const uso: Record<Tipo, string[]> = {
    instrumento: fase === 'crianca' ? ['e quis tirar uma música antes do jantar', 'e não deixou ninguém mais encostar'] : fase === 'idoso' ? ['e pediu um tempo para se acostumar com o instrumento', 'e tocou umas notas, devagar'] : ['e tocou umas notas ali mesmo', 'e passou a noite tentando a primeira música'],
    tela: fase === 'idoso' ? ['e pediu ajuda para configurar', 'e quis que você mostrasse como liga'] : fase === 'crianca' ? ['e já estava mexendo antes de você ir embora', 'e não largou mais'] : ['e passou a tarde configurando', 'e começou a usar no mesmo dia'],
    esporte: fase === 'idoso' ? ['e disse que vai usar com calma', 'e marcou de estrear na semana'] : ['e quis estrear no fim de semana', 'e já combinou de usar no próximo jogo'],
    leitura: t.abertura > 0.2 ? ['e começou a ler ali mesmo', 'e leu a primeira página em voz alta'] : ['e deixou na cabeceira', 'e folheou com curiosidade'],
    jogo: ['e quis jogar uma partida com você na hora', 'e leu as regras em voz alta'],
    arte: fase === 'crianca' ? ['e fez um desenho na mesma tarde', 'e espalhou tudo na mesa'] : ['e testou as cores no papel', 'e separou um canto para usar'],
    casa: ['e já pensou onde vai ficar', 'e arrumou um lugar para o presente na casa']
  };

  // A nota: o gosto, o gesto e a relação (o presente simples também pode ser o certeiro).
  const interesse = interesseDe(p);
  const nota = gosto === 'certeiro'
    ? (gesto <= 1
      ? um([`Não era caro — e não precisava ser: ${interesse} é a coisa d${g('ele', 'ela', 'elu')}.`, `Um presente simples, e acertou em cheio: é de ${interesse} que ${ele} gosta.`])
      : um([`Você acertou: ${interesse} é a coisa d${g('ele', 'ela', 'elu')}.`, `Era exatamente o que ${ele} queria.`]))
    : gosto === 'bom'
      ? um([`Gostou de verdade.`, `Combinou com ${ele}.`, `Foi bem escolhido.`])
      : um([`Talvez não seja bem o que ${ele} usaria — mas o gesto ficou.`, `Não é bem o estilo d${g('ele', 'ela', 'elu')}, e ${ele} agradeceu assim mesmo.`, `Não era o que ${ele} esperava; agradeceu com sinceridade.`]);
  const relacao = par ? um([' Ganhou um beijo de agradecimento.', ' E segurou sua mão por um tempo.'])
    : paiOuMae && gesto >= 2 ? ` Disse que você não precisava gastar com isso — e ficou ${g('orgulhoso', 'orgulhosa', 'orgulhose')}.`
      : filho && fase === 'crianca' ? ' Dormiu com o presente do lado.'
        : gesto >= 3 && vin.proximidade < 50 ? ' Percebeu o tamanho do gesto.'
          : '';

  return `${abertura} ${um(uso[tipo])}. ${nota}${relacao}`;
}

/** O que a pessoa tem que ganhou de você (para a ficha). */
export function presentesDados(p: Pessoa): string[] {
  return (p.ganhou ?? []).map(x => { const c = coisa(x.coisaId); return c ? `${c.nome}${x.acabamento ? ` (${x.acabamento})` : ''}` : x.coisaId; });
}
