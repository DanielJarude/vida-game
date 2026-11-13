/**
 * VIDA 19 — os tipos guardados no save (só tipos: este módulo não importa nada do motor).
 *
 *   `Pessoa.npc19`      a vida própria de quem importa e não é da casa nem da linha de sucessão (amigos, irmãos, ex,
 *                       colegas, tios, primos, famosos conhecidos): a meta, o bolso (reserva, dívida, padrão de vida),
 *                       o que tem, a união com outra pessoa do mundo, o negócio, os laços com outras pessoas.
 *   `Vida.conectada19`  o que VOCÊ fez na rede dos outros (curtidas, comentários, compartilhamentos, mensagens a partir de
 *                       uma publicação, famosos seguidos). O feed em si não é guardado: é lido da vida das pessoas.
 */

/** O que a pessoa está buscando agora (muda com a vida: idade, separação, dívida, luto, filhos). */
export type Meta19 = 'carreira' | 'estabilidade' | 'familia' | 'mudar' | 'negocio' | 'recomecar' | 'estudar' | 'aposentar';

/** Um laço entre duas pessoas do mundo (nenhuma delas é você). */
export interface Laco19 {
  /** A outra pessoa. */
  id: string;
  tipo: 'amizade' | 'rivalidade' | 'colega' | 'ex';
  /** −100..100: o quanto se gostam agora. */
  forca: number;
  desde: number;
  /** O último acontecimento entre as duas (curto, para o perfil): "brigaram no casamento", "voltaram a se falar". */
  ultimo?: string;
  tUltimo?: number;
}

/** Algo que a pessoa tem (sem o detalhe de um bem do protagonista: o que importa é o valor e a história). */
export interface Posse19 { tipo: 'carro' | 'moto' | 'casa' | 'apartamento'; nome: string; valor: number; t: number; financiado?: number }

export interface Negocio19 { ramo: string; t: number; investido: number; saude: number }

export interface Npc19 {
  /** A meta de agora e desde quando. */
  meta: Meta19;
  tMeta: number;
  /** O padrão de vida: o gasto mensal de referência (moeda do lugar onde mora). Anda devagar atrás da renda. */
  gasto: number;
  /** O que tem guardado (moeda do lugar). Nunca é do jogador. */
  reserva: number;
  /** O que deve (cartão, cheque especial, empréstimo). Cresce com juros; aperta a vida. */
  divida: number;
  posses?: Posse19[];
  negocio?: Negocio19;
  /** A união com outra pessoa do mundo (a parceria em `Pessoa.parceiroId`): namoro, morando junto, casados. */
  uniao?: { com: string; tipo: 'namoro' | 'juntos' | 'casados'; t: number };
  /** A gestação de quem não é da família (a sua família tem `Pessoa.gestacao`, processada em `filhos`). */
  gestacao?: { tParto: number; outroId?: string };
  /** Afastado do trabalho pela saúde (desde quando; a renda de antes, para voltar). */
  afastado?: { t: number; renda: number };
  /** Os laços com outras pessoas do mundo (no máximo 8). */
  lacos?: Laco19[];
  /** Marcas do que já aconteceu (tipo → instante): a vida não repete a mesma notícia todo ano. No máximo 12. */
  marcas?: Record<string, number>;
  /** Até onde a pessoa expõe a vida na rede: 0 (reservada) a 3 (conta tudo). Estável, do temperamento. */
  exposicao: 0 | 1 | 2 | 3;
}

/** Como você comentou. */
export type TomComentario19 = 'apoio' | 'parabens' | 'brincadeira' | 'discordar' | 'provocar' | 'ciume';

export interface Reacao19 {
  t: number;
  curtiu?: true;
  comentou?: TomComentario19;
  compartilhou?: true;
  /** Mandou mensagem a partir da publicação. */
  dm?: true;
}

export interface Conectada19 {
  /** O que você fez em cada publicação (chave da publicação → reação). No máximo 240 (as mais antigas saem). */
  reacoes: Record<string, Reacao19>;
  /** Os famosos que você segue (pessoaId). */
  seguindo?: string[];
  /** Quantas mensagens você mandou a partir de publicações neste ano (o ano e o número). */
  dmsNoAno?: { ano: number; n: number };
  /** O contador dos ids das pessoas que o mundo criou (parcerias e filhos de quem não é da família): não usa `Vida.seq`. */
  seq?: number;
}
