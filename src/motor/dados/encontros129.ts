/**
 * VIDA 12.9 — OS ENCONTROS: receber gente em casa (o jantar, a festa, o churrasco, a festa na piscina, a sessão de
 * cinema, a noite de jogos) e sair em grupo (o bar, o restaurante, o cinema). Puro (só tipos): as regras estão em
 * `sistemas/encontros129`.
 *
 * Cada encontro diz ONDE acontece (o que a casa precisa ter: o cômodo ou a coisa), QUANTOS cabem (pela área da casa),
 * QUANTO custa por pessoa (na cidade de custo 1,0, no jeito "do dia a dia"; o caprichado e o com buffet custam mais), o
 * que rende (a proximidade de cada convidado, a felicidade, o cansaço de quem recebe) e com que uso de cômodo da 12.8
 * divide a vez no ano (a festa na piscina daqui é a mesma da piscina: uma por ano, pelos dois caminhos).
 */
export type TipoDeEncontro = 'jantar' | 'festa' | 'churrasco' | 'piscina' | 'cinema_casa' | 'jogos' | 'saida' | 'cinema';
export type JeitoDoEncontro = 'simples' | 'caprichado' | 'buffet';

export interface ModeloDeEncontro {
  id: TipoDeEncontro;
  nome: string;
  /** O verbo na tela ("Chamar para jantar"). */
  rotulo: string;
  /** Em casa (pede casa própria, alugada ou dividida — não a dos pais) ou fora. */
  emCasa: boolean;
  /** O que a casa precisa: um destes cômodos OU uma destas coisas (vazio: qualquer casa). */
  comodos?: string[];
  coisas?: string[];
  /** Quantos convidados (mín, máx absoluto); o máximo real sai da área da casa. */
  convidados: [number, number];
  /** m² por convidado (a festa precisa de mais espaço que o jantar). */
  m2PorPessoa: number;
  /** Gasto por pessoa (inclui quem recebe), cidade de custo 1,0, jeito simples. */
  porPessoa: number;
  idadeMin: number;
  prox: number;
  feliz: number;
  /** O cansaço de quem organiza (estresse do dia). */
  cansaco: number;
  /** Faz barulho (prédio: o vizinho e o síndico). */
  barulho?: boolean;
  /** Divide a vez no ano com este uso de cômodo da 12.8 (`ucomodo:<tipo>:<uso>`). */
  usoDoComodo?: [string, string];
  textos: string[];
}

export const MULT_DO_JEITO: Record<JeitoDoEncontro, { custo: number; qualidade: number; nome: string }> = {
  simples: { custo: 1, qualidade: 1, nome: 'do jeito de sempre' },
  caprichado: { custo: 2.2, qualidade: 1.2, nome: 'caprichado' },
  buffet: { custo: 9, qualidade: 1.35, nome: 'com buffet e serviço' }
};

export const ENCONTROS: ModeloDeEncontro[] = [
  { id: 'jantar', nome: 'jantar em casa', rotulo: 'Chamar para jantar em casa', emCasa: true, convidados: [1, 10], m2PorPessoa: 2.5, porPessoa: 55, idadeMin: 16, prox: 5, feliz: 3, cansaco: 2,
    textos: ['A mesa posta, a comida que você sabe fazer, a conversa que esticou até a louça ficar para amanhã.', 'Um jantar em casa: ninguém olhou o celular depois da sobremesa.', 'Você cozinhou, {nome} trouxe o vinho, a noite fez o resto.'] },
  { id: 'festa', nome: 'festa em casa', rotulo: 'Dar uma festa em casa', emCasa: true, convidados: [5, 60], m2PorPessoa: 1.6, porPessoa: 95, idadeMin: 16, prox: 3, feliz: 4, cansaco: 5, barulho: true,
    textos: ['A casa cheia, a música alta, gente que você nem sabia que vinha — e que voltaria.', 'Uma festa que começou às nove e terminou com café da manhã.', 'Alguém trouxe um amigo que trouxe outro: a festa ficou maior do que a casa.'] },
  { id: 'churrasco', nome: 'churrasco', rotulo: 'Fazer um churrasco', emCasa: true, comodos: ['lazer', 'varanda'], coisas: ['churrasqueira', 'espaco_gourmet'], convidados: [3, 40], m2PorPessoa: 2, porPessoa: 75, idadeMin: 16, prox: 4, feliz: 3, cansaco: 3, usoDoComodo: ['lazer', 'churrasco'],
    textos: ['A churrasqueira acesa às onze, a última conversa às nove da noite.', 'Um domingo de portas abertas: quem passou, ficou.', 'Você na churrasqueira, {nome} dando palpite no ponto da carne.'] },
  { id: 'piscina', nome: 'festa na piscina', rotulo: 'Dar uma festa na piscina', emCasa: true, comodos: ['piscina'], convidados: [4, 40], m2PorPessoa: 2, porPessoa: 105, idadeMin: 16, prox: 4, feliz: 4, cansaco: 4, barulho: true, usoDoComodo: ['piscina', 'festa'],
    textos: ['Música, boia, gente na água até escurecer.', 'Alguém caiu de roupa na piscina — e virou a história do ano.'] },
  { id: 'cinema_casa', nome: 'sessão de cinema em casa', rotulo: 'Organizar uma sessão de cinema em casa', emCasa: true, comodos: ['cinema'], coisas: ['tv', 'tv_oled', 'projetor'], convidados: [1, 14], m2PorPessoa: 1.8, porPessoa: 22, idadeMin: 8, prox: 3, feliz: 3, cansaco: 1, usoDoComodo: ['cinema', 'sessao_familia'],
    textos: ['Luz apagada, pipoca em balde, um filme escolhido por votação.', 'Um clássico que metade da sala nunca tinha visto. Agora viu.'] },
  { id: 'jogos', nome: 'noite de jogos', rotulo: 'Fazer uma noite de jogos', emCasa: true, comodos: ['jogos'], coisas: ['jogos_tabuleiro', 'videogame', 'tabuleiro', 'mesa_jogos', 'mesa_sinuca'], convidados: [1, 12], m2PorPessoa: 2, porPessoa: 30, idadeMin: 10, prox: 4, feliz: 3, cansaco: 1, usoDoComodo: ['jogos', 'noite_de_jogos'],
    textos: ['Campeonato com chave, placar e taça de papel.', 'A mesa cheia, alguém roubando no jogo, todo mundo rindo.'] },
  { id: 'saida', nome: 'saída em grupo', rotulo: 'Sair em grupo (bar, restaurante)', emCasa: false, convidados: [2, 14], m2PorPessoa: 0, porPessoa: 120, idadeMin: 16, prox: 3, feliz: 3, cansaco: 2,
    textos: ['Uma mesa comprida no bar de sempre, a conta dividida no fim (ou não).', 'O restaurante novo da cidade: a comida era boa; a companhia, melhor.'] },
  { id: 'cinema', nome: 'cinema', rotulo: 'Chamar para o cinema', emCasa: false, convidados: [1, 6], m2PorPessoa: 0, porPessoa: 45, idadeMin: 8, prox: 3, feliz: 2, cansaco: 0,
    textos: ['A estreia da semana, a pipoca dividida, a discussão sobre o final na saída.', 'Um filme que ninguém tinha escolhido — e que todo mundo gostou.'] }
];
export const encontro = (id: string) => ENCONTROS.find(e => e.id === id);
