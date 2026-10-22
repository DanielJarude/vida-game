/**
 * REWORK 10.5 · CAR-06 / CAR-09 / CAR-11 — AS PRODUÇÕES TÊM IDENTIDADE.
 *
 * Antes, uma proposta de atuação era título + tipo de papel + duração + cachê; o título saía de uma lista de dez por
 * tipo, sem lembrar dos que já tinham passado ("O Contador de Histórias" várias vezes na mesma carreira; "Laços de
 * Maré" oferecida de novo como inédita); o prêmio era "o prêmio da crítica de televisão", igual para série e novela.
 *
 * Agora cada produção nasce com uma FICHA (fictícia, do universo desta vida): um identificador estável, o título (que
 * não se repete numa carreira — a não ser como continuação dita: a segunda temporada, a sequência, a remontagem), o
 * gênero, uma sinopse curta, a personagem, a importância do papel e o canal. O prêmio tem nome, categoria, edição
 * (o ano) e a obra — e a categoria é a da obra e do papel (ninguém ganha prêmio de cinema por uma série, nem de música
 * por atuar). Nenhuma premiação real é usada: os nomes são inventados, com o alcance dito (da cidade, nacional,
 * internacional).
 *
 * Só importa dados, o gerador derivado e tipos: o sorteio de cada ficha não mexe na sequência da vida.
 */

import { clamp, rngDe, type Rng } from '../rng';
import type { ContratoAV, ItemCurriculo, Vida } from '../tipos';
import { anoDe } from '../tempo';

type Tipo = ItemCurriculo['tipo'];

/* ------------------------------------------------------------ Títulos */

const TITULOS_PECA = ['O Quarto de Cima', 'Vento Norte', 'A Última Festa', 'Rua das Palmeiras', 'Os Dias Contados', 'Casa de Farinha', 'Travessia Noturna', 'O Peso das Coisas', 'Mar de Dentro', 'Retrato de Família'];
const TITULOS_TELA = ['Horizonte Partido', 'Os Herdeiros da Serra', 'Pelas Margens', 'Rota 116', 'A Cidade Acorda', 'Fronteira Sul', 'Laços de Maré', 'O Contador de Histórias', 'Sol de Inverno', 'Terra Vermelha'];
/** As peças que compõem títulos novos (combinações: mais de mil por tipo, nenhuma repetida numa carreira). */
const NUCLEOS = ['Casa', 'Rua', 'Noite', 'Ilha', 'Ponte', 'Fronteira', 'Estação', 'Herança', 'Varanda', 'Cidade', 'Serra', 'Margem', 'Promessa', 'Memória', 'Travessia', 'Fábrica', 'Colheita', 'Janela', 'Viagem', 'Sombra'];
const COMPLEMENTOS = ['do Sul', 'Vazia', 'de Vidro', 'das Águas', 'sem Nome', 'de Outubro', 'dos Ventos', 'Partida', 'de Sal', 'do Meio-Dia', 'Esquecida', 'dos Outros', 'de Fogo', 'Distante', 'do Avesso', 'Calada'];
const ARTIGO: Record<string, string> = { Casa: 'A', Rua: 'A', Noite: 'A', Ilha: 'A', Ponte: 'A', Fronteira: 'A', Estação: 'A', Herança: 'A', Varanda: 'A', Cidade: 'A', Serra: 'A', Margem: 'A', Promessa: 'A', Memória: 'A', Travessia: 'A', Fábrica: 'A', Colheita: 'A', Janela: 'A', Viagem: 'A', Sombra: 'A' };
const PRODUTOS = ['uma rede de farmácias', 'um banco digital', 'uma marca de refrigerante', 'um supermercado da região', 'uma loja de eletrodomésticos', 'uma operadora de celular', 'uma montadora', 'uma marca de cosméticos'];

/** Os títulos que esta carreira já viveu ou recebeu (o currículo e as propostas). */
export function titulosJaVistos(v: Vida): Set<string> {
  return new Set([...(v.caminhos.curriculo ?? []).map(x => x.titulo), ...(v.caminhos.audiovisual?.contratos ?? []).map(x => x.titulo)]);
}

/**
 * Um título NOVO para esta carreira: primeiro os da lista de sempre (os que ainda não passaram por ela), depois
 * combinações — nunca um que já esteja no currículo ou numa proposta. A publicidade é do produto (pode repetir a marca).
 */
export function tituloNovo(v: Vida, tipo: Tipo, salt: string): string {
  const r = rngDe(v.id, 'titulo', tipo, v.t, salt, v.caminhos.curriculo?.length ?? 0);
  if (tipo === 'publicidade') return `Comercial de ${r.pick(PRODUTOS)}`;
  const vistos = titulosJaVistos(v);
  const lista = (tipo === 'serie' || tipo === 'novela' || tipo === 'filme' || tipo === 'curta') ? TITULOS_TELA : TITULOS_PECA;
  const livres = lista.filter(t => !vistos.has(t));
  if (livres.length && r.chance(0.6)) return r.pick(livres);
  for (let k = 0; k < 40; k++) {
    const n = r.pick(NUCLEOS);
    const t = `${ARTIGO[n] ?? 'O'} ${n} ${r.pick(COMPLEMENTOS)}`;
    if (!vistos.has(t)) return t;
  }
  return `${r.pick(NUCLEOS)} ${anoDe(v.t)}`;
}

/* ------------------------------------------------------------ A ficha */

const GENEROS: Partial<Record<Tipo, string[]>> = {
  novela: ['drama', 'comédia romântica', 'drama de época', 'suspense'],
  serie: ['drama policial', 'comédia', 'suspense', 'drama médico', 'ficção científica', 'drama juvenil'],
  filme: ['drama', 'comédia', 'suspense', 'aventura', 'romance', 'biografia'],
  teatro: ['drama', 'comédia', 'musical', 'tragédia'],
  curta: ['drama', 'experimental', 'comédia']
};
const SINOPSES: Record<string, string[]> = {
  drama: ['Uma família se reencontra depois de uma perda e descobre o que cada um escondia.', 'Dois irmãos disputam a herança de um pai que nunca disse o que queria.', 'Uma professora tenta salvar a escola do bairro do fechamento.'],
  'comédia romântica': ['Dois vizinhos que se detestam precisam dividir a mesma reforma.', 'Uma noiva foge do próprio casamento e acaba presa numa cidade pequena.'],
  'drama de época': ['Numa fazenda do começo do século, uma herdeira enfrenta a família para mandar no que é seu.', 'Uma companhia de teatro atravessa o país num tempo em que a arte era censurada.'],
  suspense: ['Um desaparecimento numa cidade pequena expõe o que todos sabiam e calavam.', 'Uma testemunha passa a ser seguida depois de um depoimento.'],
  'drama policial': ['Uma delegada investiga um caso que envolve a própria família.', 'Uma equipe de investigação persegue uma rede de fraudes dentro da prefeitura.'],
  comédia: ['Uma família de golpistas atrapalhados tenta dar o último golpe.', 'Um restaurante à beira da falência contrata o pior chef da cidade.'],
  'drama médico': ['Os residentes de um hospital público vivem um ano de plantões, perdas e escolhas.'],
  'ficção científica': ['Numa cidade onde a memória pode ser vendida, uma mulher descobre que a sua foi.'],
  'drama juvenil': ['O último ano de uma turma de escola, entre o vestibular, a primeira paixão e o que não se diz em casa.'],
  aventura: ['Uma expedição pelo interior atrás de um mapa deixado por um avô desaparecido.'],
  romance: ['Dois desconhecidos dividem um trem por uma noite inteira e uma vida depois.'],
  biografia: ['A vida de uma cantora do rádio que o país esqueceu.'],
  musical: ['Uma escola de samba prepara o desfile que pode tirá-la da segunda divisão.'],
  tragédia: ['Uma rainha descobre que o próprio filho conspira contra ela.'],
  experimental: ['Um dia inteiro numa fila, contado por quem espera.']
};
const PERSONAGENS_F = ['Helena', 'Marta', 'Celina', 'Joana', 'Íris', 'Lúcia', 'Dora', 'Vera', 'Rita', 'Glória', 'Sônia', 'Clara'];
const PERSONAGENS_M = ['Augusto', 'Raul', 'Tomás', 'Otávio', 'Caetano', 'Bento', 'Joel', 'Vicente', 'Davi', 'Hélio', 'Severino', 'Leonel'];

/** A importância do papel, pelo nome que ele tem na proposta. */
export function importanciaDoPapel(papel: string): 'protagonista' | 'destaque' | 'coadjuvante' | 'participacao' | 'elenco' | 'figuracao' {
  return /protagonista/.test(papel) ? 'protagonista' : /destaque/.test(papel) ? 'destaque' : /participação/.test(papel) ? 'participacao' : /coadjuvante/.test(papel) ? 'coadjuvante' : /figura/.test(papel) ? 'figuracao' : 'elenco';
}
export const ROTULO_IMPORTANCIA = { protagonista: 'protagonista', destaque: 'papel de destaque', coadjuvante: 'coadjuvante', participacao: 'participação especial', elenco: 'elenco de apoio', figuracao: 'figuração' } as const;

/** A ficha de uma produção (estável: o mesmo id dá a mesma ficha). */
export interface FichaDaProducao { producaoId: string; genero?: string; sinopse?: string; personagem?: string }
export function fichaDaProducao(v: Vida, tipo: Tipo, titulo: string, id: string): FichaDaProducao {
  const r = rngDe(v.id, 'ficha', id, titulo);
  const genero = GENEROS[tipo] ? r.pick(GENEROS[tipo]!) : undefined;
  const sinopse = genero ? r.pick(SINOPSES[genero] ?? SINOPSES.drama) : undefined;
  const personagem = tipo === 'publicidade' ? undefined : r.pick(v.eu.genero === 'feminino' ? PERSONAGENS_F : v.eu.genero === 'masculino' ? PERSONAGENS_M : [...PERSONAGENS_F, ...PERSONAGENS_M]);
  return { producaoId: id, ...(genero ? { genero } : {}), ...(sinopse ? { sinopse } : {}), ...(personagem ? { personagem } : {}) };
}

/* ------------------------------------------------------------ Continuações */

/**
 * A continuação legítima: a segunda temporada da série que repercutiu, a sequência do filme, a remontagem da peça —
 * só de um trabalho que esta carreira FEZ, que repercutiu, há poucos anos, e que ainda não teve continuação. O título
 * diz o que é ("— 2ª temporada"), e a ficha aponta para a original.
 */
export function continuacaoPossivel(v: Vida, tipos: Tipo[], r: Rng): { titulo: string; de: ItemCurriculo; numero: number } | undefined {
  const cv = v.caminhos.curriculo ?? [];
  const cands = cv.filter(x => tipos.includes(x.tipo) && x.repercussao >= 2 && v.t - x.t <= 72 && ['serie', 'novela', 'filme', 'teatro'].includes(x.tipo) && x.tipo !== 'novela'
    && !cv.some(y => y.continuacaoDe !== undefined && y.continuacaoDe === (x.producaoId ?? x.titulo)) && !(v.caminhos.audiovisual?.contratos ?? []).some(c => c.continuacaoDe === (x.producaoId ?? x.titulo)));
  if (!cands.length || !r.chance(0.35)) return undefined;
  const de = r.pick(cands);
  const anteriores = cv.filter(y => y.titulo.startsWith(de.titulo.replace(/ — .*$/, ''))).length;
  const numero = anteriores + 1;
  const base = de.titulo.replace(/ — .*$/, '').replace(/ \d+$/, '');
  const titulo = de.tipo === 'serie' ? `${base} — ${numero}ª temporada` : de.tipo === 'filme' ? `${base} ${numero}` : `${base} — remontagem`;
  return { titulo, de, numero };
}

/* ------------------------------------------------------------ Prêmios */

export interface PremioIdentificado { nome: string; venceu: boolean; categoria?: string; edicao?: number; obra?: string; alcance?: 'local' | 'nacional' | 'internacional' }

/** As premiações (fictícias) de cada tipo de obra, pelo porte da produção (o alcance cresce com ele). */
function premiacaoDe(tipo: Tipo, porte: number): { nome: string; alcance: 'local' | 'nacional' | 'internacional' } | undefined {
  if (tipo === 'teatro') return porte >= 2 ? { nome: 'o Prêmio Ribalta de teatro', alcance: 'nacional' } : { nome: 'o prêmio de teatro da cidade', alcance: 'local' };
  if (tipo === 'filme') return porte >= 3 ? { nome: 'o Festival Internacional do Atlântico', alcance: 'internacional' } : { nome: 'a Mostra Nacional de Cinema', alcance: 'nacional' };
  if (tipo === 'curta') return { nome: 'o Festival de Curtas da capital', alcance: 'local' };
  if (tipo === 'serie' || tipo === 'novela') return { nome: 'o Troféu Antena (televisão e streaming)', alcance: 'nacional' };
  return undefined;
}

/** A categoria certa para a obra e o papel (série tem categoria de série; novela, de novela; o começo de carreira, revelação). */
export function categoriaDoPremio(tipo: Tipo, papel: string, genero: string, revelacao: boolean): string {
  const a = genero === 'feminino' ? 'atriz' : genero === 'masculino' ? 'ator' : 'atuação';
  const imp = importanciaDoPapel(papel);
  if (revelacao) return genero === 'feminino' ? 'Atriz revelação' : genero === 'masculino' ? 'Ator revelação' : 'Revelação';
  const coad = imp !== 'protagonista' && imp !== 'destaque';
  const em = tipo === 'serie' ? ' em série' : tipo === 'novela' ? ' de novela' : tipo === 'curta' ? ' em curta-metragem' : '';
  return `${a === 'atuação' ? 'Melhor atuação' : `Melhor ${a}`}${coad ? ' coadjuvante' : ''}${em}`;
}

/** A indicação (e, mais raro, o prêmio): nasce da repercussão, do papel, do porte e do ano — com nome, categoria e edição. */
export function premioDoTrabalho(v: Vida, c: Pick<ContratoAV, 'tipo' | 'papel' | 'porte' | 'titulo'>, repercussao: number, habilidade: number, r: Rng | undefined): PremioIdentificado | undefined {
  const p = premiacaoDe(c.tipo, c.porte);
  if (!p || repercussao < 2 || !r) return undefined;
  const imp = importanciaDoPapel(c.papel);
  const peso = imp === 'protagonista' ? 1 : imp === 'destaque' || imp === 'coadjuvante' ? 0.6 : 0.25;
  if (!r.chance(clamp((repercussao - 1) * 0.22 * peso + c.porte * 0.03, 0, 0.6))) return undefined;
  const venceu = r.chance(clamp(0.18 + (habilidade - 70) / 100 + (repercussao === 3 ? 0.12 : 0), 0.05, 0.5));
  const revelacao = (v.caminhos.curriculo ?? []).filter(x => ['serie', 'novela', 'filme', 'curta', 'teatro'].includes(x.tipo)).length <= 2;
  return { nome: p.nome, venceu, categoria: categoriaDoPremio(c.tipo, c.papel, v.eu.genero, revelacao), edicao: anoDe(v.t), obra: c.titulo, alcance: p.alcance };
}

/** O prêmio em palavras: "Melhor atriz coadjuvante em série — Troféu Antena 2071, por 'X'". */
export function textoDoPremio(p: PremioIdentificado): string {
  const nome = p.nome.replace(/^o |^a /, '');
  return p.categoria ? `${p.categoria} — ${nome.charAt(0).toUpperCase() + nome.slice(1)}${p.edicao ? ` ${p.edicao}` : ''}${p.obra ? `, por "${p.obra}"` : ''}` : `${nome}${p.obra ? `, por "${p.obra}"` : ''}`;
}

/** O quanto um prêmio põe o nome na frente do público (o da cidade não é o internacional). */
export const PESO_DO_PREMIO = { local: 1, nacional: 3, internacional: 6 } as const;
