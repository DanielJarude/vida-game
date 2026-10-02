/**
 * Regras de sucessão por país (o que a lei de cada lugar diz sobre quem
 * herda e quanto se pode decidir em vida).
 *
 * O VIDA não é um simulador jurídico: cada regra aqui é uma ABSTRAÇÃO de um
 * princípio real, citado, e nada além dele. A partilha (`sistemas/sucessao`)
 * só lê esta tabela — um país novo é uma entrada nova, não um `if` novo.
 *
 * BRASIL (Código Civil, Lei 10.406/2002):
 *  - herdeiros necessários: descendentes, ascendentes e cônjuge (art. 1.845);
 *    havendo algum, só METADE do patrimônio pode ser decidida em testamento
 *    (arts. 1.789 e 1.846) — a outra metade, a legítima, é deles;
 *  - ordem: descendentes em concorrência com o cônjuge; sem descendentes,
 *    ascendentes em concorrência com o cônjuge; depois o cônjuge sozinho;
 *    depois os colaterais (art. 1.829) — aqui, os irmãos;
 *  - com os ascendentes, o cônjuge fica com um terço (os dois pais vivos) ou
 *    metade (um só) (art. 1.837);
 *  - netos herdam no lugar do filho que já morreu (representação, art. 1.851);
 *  - ninguém herda dívida além do que o patrimônio cobre (art. 1.792);
 *  - sem herdeiro algum, o patrimônio vai para o município (art. 1.844);
 *  - regime supletivo: comunhão parcial (art. 1.640) — a meação do que o
 *    casal construiu junto não é herança, é do cônjuge.
 *
 * SIMPLIFICAÇÕES DECLARADAS (Brasil): o cônjuge concorre com os descendentes
 * por cabeça, sem distinguir bens particulares e comuns (art. 1.829, I, na
 * leitura completa, depende do regime); a quota mínima de um quarto
 * (art. 1.832) não é aplicada; o ITCMD (alíquota estadual, teto de 8% pela
 * Resolução do Senado 9/1992) e as custas do inventário entram como uma taxa
 * única média; o direito real de habitação (art. 1.831) aparece como o
 * padrão de deixar a casa da família com o cônjuge, quando cabe na parte dele.
 */

export interface RegrasDeSucessao {
  /** Código do país (o que a expansão internacional vai usar). */
  pais: string;
  nome: string;
  /** Fração do que se transmite que é dos herdeiros necessários, quando existem (o resto é a parte disponível). */
  legitima: number;
  /** Quem é herdeiro necessário. */
  necessarios: ('descendentes' | 'ascendentes' | 'conjuge')[];
  /** O cônjuge concorre com os descendentes (por cabeça). */
  conjugeComDescendentes: boolean;
  /** Fração do cônjuge em concorrência com os ascendentes: [os dois pais vivos, um só]. */
  conjugeComAscendentes: [number, number];
  /** Netos no lugar do filho que já morreu. */
  representacao: boolean;
  /** Irmãos herdam na falta dos outros (sem serem necessários). */
  colaterais: boolean;
  /** O cônjuge tem a meação do que o casal construiu junto (regime de comunhão parcial). */
  meacao: boolean;
  /** Custo da transmissão (imposto e custas), como fração do que se transmite. */
  custoTransmissao: number;
  /** Rótulo do custo, para a tela. */
  rotuloCusto: string;
  /** Sem herdeiros: para quem vai. */
  vacancia: string;
}

export const REGRAS_SUCESSAO: Record<string, RegrasDeSucessao> = {
  BR: {
    pais: 'BR',
    nome: 'Brasil',
    legitima: 0.5,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 3, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.04,
    rotuloCusto: 'imposto de transmissão (ITCMD) e custas do inventário',
    vacancia: 'o município'
  }
};

export const regrasDoPais = (pais = 'BR'): RegrasDeSucessao => REGRAS_SUCESSAO[pais] ?? REGRAS_SUCESSAO.BR;

/** Para onde pode ir uma doação feita por testamento (causas, nunca uma instituição real com nome). */
export const DESTINOS_DE_DOACAO: { id: string; nome: string }[] = [
  { id: 'pesquisa', nome: 'pesquisa em saúde' },
  { id: 'educacao', nome: 'bolsas de estudo' },
  { id: 'assistencia', nome: 'assistência social' },
  { id: 'cultura', nome: 'cultura e memória' },
  { id: 'esporte', nome: 'esporte de base' },
  { id: 'ambiente', nome: 'meio ambiente' }
];

export const nomeDoDestino = (id: string) => DESTINOS_DE_DOACAO.find(d => d.id === id)?.nome ?? id;
