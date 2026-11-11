/**
 * VIDA 15 · O CELULAR — os tipos guardados no save (`Vida.celular15`, opcional; ausente: o aparelho ainda não tocou).
 *
 * O celular não é um sistema paralelo: é a PORTA para o que já existe (os vínculos, os chamados, as redes, o dinheiro,
 * as oportunidades, a fama). O que ele guarda é só o que nasce nele: as mensagens do ano (quem tomou a iniciativa, o que
 * disse, o que você respondeu), os perfis do aplicativo de namoro do ano e as curtidas na rede dos amigos.
 */
import type { Pessoa } from '../../tipos';

/** Quem tomou a iniciativa, e por quê. */
export type TipoMsg15 =
  /** Um amigo chama para um programa (jantar, cinema, festa, show, viagem curta). */
  | 'convite'
  /** "E aí, como você está?" — alguém que gosta de você e anda sem notícia. */
  | 'saudade'
  /** A família (ou um amigo) conta o que aconteceu na vida dela (lido da trajetória da pessoa). */
  | 'noticia'
  /** A parceria sugere um programa a dois. */
  | 'parceiro'
  /** Um colega antigo (da escola, da faculdade, do trabalho) reaparece depois de anos. */
  | 'reencontro'
  /** Alguém de um romance que acabou manda mensagem. */
  | 'ex'
  /** Um contato do trabalho propõe algo (um trabalho extra, uma indicação). */
  | 'proposta'
  /** Fama: um fã pede foto, autógrafo, um vídeo. */
  | 'fa'
  /** Fama: o convite para um evento grande, uma festa fechada, uma estreia. */
  | 'evento'
  /** Fama: uma pessoa famosa puxa conversa. */
  | 'celebridade'
  /** Fama: a imprensa liga (um rumor, uma foto, uma pergunta). */
  | 'imprensa'
  /** Um encontro por acaso num lugar (o restaurante, o aeroporto, a praia). */
  | 'encontro'
  /** VIDA 16: uma mensagem que VOCÊ escreveu (o texto é seu; a resposta é da pessoa). */
  | 'escrita'
  /** VIDA 16: um chamado da pessoa que já saiu da tela (respondido, ou sem resposta) — fica no histórico. */
  | 'chamado';

export type Lugar15 = 'restaurante' | 'festa' | 'aeroporto' | 'praia' | 'evento' | 'shopping' | 'cinema' | 'show' | 'bar' | 'parque' | 'academia' | 'mercado' | 'rua';

/** A pessoa famosa que ainda não está na vida (nasce como Pessoa só quando você responde). */
export interface Molde15 { nome: string; sobrenome: string; genero: Pessoa['genero']; idade: number; area: AreaCelebridade15; nivel: 1 | 2 | 3 }

export type AreaCelebridade15 = 'musica' | 'tv' | 'cinema' | 'esporte' | 'internet' | 'moda' | 'negocios';

export interface Msg15 {
  id: string;
  /** Instante (mês absoluto) em que chegou. */
  t: number;
  tipo: TipoMsg15;
  /** Quem mandou (pessoaId de alguém da vida). Ausente: um fã, uma produção, a imprensa, alguém que ainda não está na vida. */
  de?: string;
  /** O nome de quem mandou, quando não é alguém da vida (o fã, a produtora, o jornal). */
  remetente?: string;
  /** A mensagem, como chegou (gravada: recarregar mostra a mesma). */
  texto: string;
  /** O programa, o assunto. */
  assunto?: string;
  /** O que a pessoa compartilhou junto (a novidade, nas palavras da trajetória dela). */
  cartao?: string;
  onde?: Lugar15;
  /** O que custa aceitar (na moeda da vida). */
  custo?: number;
  /** A pessoa famosa do convite (nasce na vida se você for). */
  molde?: Molde15;
  /** A resposta dada (uma só). */
  resposta?: { op: string; t: number; texto: string };
  lida?: boolean;
  /** 0: chegou na virada do ano; 1+: chegou durante o ano (depois do que você fez). */
  onda?: number;
}

export interface PerfilApp15 {
  pessoa: Pessoa;
  /** O que o perfil diz (curto, na primeira pessoa). */
  bio: string;
  busca: 'relacionamento' | 'casual' | 'incerto';
  km: number;
  /** Os interesses que aparecem no perfil. */
  interesses: string[];
  decisao?: 'curtiu' | 'passou' | 'match';
}

export interface Celular15 {
  /** O ano (calendário) das mensagens novas. */
  ano: number;
  /** As mensagens deste ano e do anterior (as respondidas antigas ficam até 60; as sem resposta antigas saem). */
  msgs: Msg15[];
  /** Ondas entregues durante o ano (a vida que segue enquanto você faz as coisas). */
  ondas?: number;
  /** Ações do ano contadas (para as ondas). */
  acoesNoAno?: number;
  /** Os encontros por acaso do ano. */
  encontrosNoAno?: number;
  /** O aplicativo de namoro: os perfis do ano. */
  deck?: { ano: number; perfis: PerfilApp15[]; extras?: number; instalado?: boolean };
  /** As publicações dos amigos já curtidas (chaves; no máximo 160). */
  curtidas?: string[];
  /** VIDA 16: o rastro do aplicativo de namoro usado com uma parceria exclusiva (`motor/v16/romance`). */
  rastro16?: import('../../dados16/romance/tipos').RastroDoApp16;
  /** VIDA 16: as conversas antigas (as mensagens que saíram do ano continuam no histórico; no máximo 400). */
  arquivo16?: Msg15[];
}
