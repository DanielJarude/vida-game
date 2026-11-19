/**
 * ERAS v4 · A SOCIEDADE DA ARGENTINA (1945–2025): barreiras, reformas, movimentos e partidos.
 * [F] fato documentado · [A] aproximação de jogo. Nas ditaduras de 1966–1973 e 1976–1983, a atividade partidária foi
 * suspensa (todos os partidos "proscritos" no jogo); o peronismo foi proscrito de 1955 a 1972.
 */
import type { SociedadeDaEra } from '../../base/sociedade4';

const DITADURAS: [number, number][] = [[1966, 1973], [1976, 1983]];

export const SOCIEDADE_AR: SociedadeDaEra = {
  barreiras: [
    {
      id: 'ar_casada_credito', quem: 'mulher_casada', natureza: 'lei', dominio: 'credito', de: 1945, ate: 1968, bloqueia: true, reforma: 'ar_capacidade_civil',
      texto: 'Pelo Código Civil, o marido administrava os bens do casal: o banco pedia a assinatura dele para o empréstimo.',
      alternativa: 'O crédito podia sair no nome do marido.',
      fonte: 'Código Civil (Vélez Sarsfield) e Lei 11.357/1926 (capacidade parcial da mulher casada); Lei 17.711/1968 (plena capacidade).', certeza: 'aproximado'
    },
    {
      id: 'ar_prescindibilidade', quem: 'fichado', natureza: 'lei', dominio: 'trabalho', de: 1976, ate: 1984, bloqueia: true, alvo: { concurso: true },
      texto: 'Com a lei de "prescindibilidade", o Estado demitia quem fosse visto como "risco à segurança": com o nome fichado, não havia emprego público.',
      fonte: 'Lei 21.274 (29/03/1976); CONADEP, "Nunca Más" (1984).', certeza: 'documentado'
    },
    {
      id: 'ar_salario_mulher', quem: 'mulher', natureza: 'costume', dominio: 'salario', de: 1945, ate: 1975, fator: 0.75, residuo: { fator: 0.85, anos: 40 },
      texto: 'Os convênios coletivos pagavam menos às categorias "femininas": o salário de entrada veio menor.',
      fonte: 'Convenção 100 da OIT (ratificada em 1956); Lei de Contrato de Trabalho 20.744 (1974), arts. 172 e 81. Fator: aproximação [A].', certeza: 'aproximado'
    }
  ],
  reformas: [
    { id: 'ar_voto_feminino', nome: 'O voto das mulheres', texto: 'as mulheres passaram a votar e a ser votadas', derruba: ['ar_voto_mulher'], real: [1947, 9], desde: 1945, alcance: 'nacional', resistencia: 0.45, oposicao: 'parte do Senado e dos partidos conservadores', acontecimentos: ['voto_mulher_ar'], fonte: 'Lei 13.010, de 23/09/1947 (o primeiro voto em 1951). Em San Juan, as mulheres votavam desde 1927.' },
    { id: 'ar_capacidade_civil', nome: 'A plena capacidade da mulher casada', texto: 'a mulher casada passou a administrar os próprios bens e a contratar sem o marido', derruba: ['ar_casada_credito'], real: [1968, 4], desde: 1945, alcance: 'nacional', resistencia: 0.45, oposicao: 'os juristas conservadores', fonte: 'Lei 17.711, de 22/04/1968.' },
    { id: 'ar_divorcio', nome: 'O divórcio', texto: 'o casamento passou a poder ser desfeito, com direito a casar de novo', derruba: ['ar_sem_divorcio'], real: [1987, 6], desde: 1945, alcance: 'nacional', resistencia: 0.7, oposicao: 'a Igreja Católica e os partidos conservadores', acontecimentos: ['divorcio_87'], fonte: 'Lei 23.515, de 08/06/1987. Uma lei de 1954 (14.394, art. 31) chegou a permitir o divórcio, suspensa em 1956.' },
    { id: 'ar_casamento_igualitario', nome: 'O casamento igualitário', texto: 'pessoas do mesmo sexo passaram a poder se casar', derruba: ['ar_casamento_igual'], real: [2010, 7], desde: 1990, alcance: 'nacional', resistencia: 0.6, oposicao: 'a Igreja e a maioria do Senado até a véspera', acontecimentos: ['casamento_10'], fonte: 'Lei 26.618, de 15/07/2010.' },
    { id: 'ar_escola_municipal', nome: 'Escola e merenda nos bairros', texto: 'a cidade abriu escolas e jardins de infância nos bairros pobres e no campo', derruba: [], institui: 'escola', desde: 1945, alcance: 'municipal', resistencia: 0.3, oposicao: 'a conta do orçamento da cidade', fonte: 'O efeito local é aproximação de jogo [A].' },
    { id: 'ar_saude_municipal', nome: 'Água e postos de saúde', texto: 'a cidade levou água e esgoto aos bairros e abriu postos de saúde', derruba: [], institui: 'saude', desde: 1945, alcance: 'municipal', resistencia: 0.3, oposicao: 'a conta das obras', fonte: 'As campanhas de saúde pública de Ramón Carrillo (1946–1954); o efeito é aproximação [A].' }
  ],
  movimentos: [
    { id: 'ar_voto_mulheres', nome: 'A campanha pelo voto feminino', causa: 'o voto das mulheres', reformas: ['ar_voto_feminino'], de: 1945, ate: 1947, risco: [[1945, 1947, 0]], fonte: 'Eva Perón e as associações sufragistas (Alicia Moreau de Justo, desde 1919).' },
    { id: 'ar_mulheres', nome: 'O movimento das mulheres', causa: 'a plena capacidade civil e o divórcio', reformas: ['ar_capacidade_civil', 'ar_divorcio'], de: 1955, ate: 1987, risco: [[1955, 1966, 0], [1966, 1973, 1], [1973, 1976, 0], [1976, 1983, 3], [1983, 1987, 0]], fonte: 'União Feminista Argentina (1970); Multisectorial de la Mujer (1984).' },
    { id: 'ar_lgbt', nome: 'O movimento LGBT', causa: 'o fim dos editais policiais e o casamento igualitário', reformas: ['ar_casamento_igualitario'], de: 1971, ate: 2010, risco: [[1971, 1976, 1], [1976, 1983, 3], [1983, 2010, 1]], fonte: 'Frente de Liberación Homosexual (1971); Comunidad Homosexual Argentina (1984); Federación Argentina LGBT (2006).' }
  ],
  partidos: [
    { id: 'AR_UCR', sigla: 'UCR', nome: 'União Cívica Radical', chamado: 'UCR', artigo: 'a', de: [1891, 6], certeza: 'documentado', proscrito: DITADURAS, linha: 'radical: o voto secreto, as classes médias e a reforma universitária' },
    { id: 'AR_PJ', sigla: 'PJ', nome: 'Partido Justicialista', chamado: 'peronismo', artigo: 'o', de: [1946, 1], certeza: 'documentado', proscrito: [[1955, 1973], [1976, 1983]], nomes: [{ ate: 1946, nome: 'Partido Laborista', chamado: 'Partido Laborista' }, { ate: 1971, nome: 'Partido Peronista', chamado: 'peronismo' }], linha: 'peronista: os sindicatos, os direitos trabalhistas e a "justiça social"; proscrito de 1955 a 1972' },
    { id: 'AR_PS', sigla: 'PS', nome: 'Partido Socialista', chamado: 'Partido Socialista', artigo: 'o', de: [1896, 6], certeza: 'aproximado', proscrito: DITADURAS, linha: 'socialista democrático, de Juan B. Justo e Alfredo Palacios' },
    { id: 'AR_PDP', sigla: 'PDP', nome: 'Partido Democrata Progressista', chamado: 'PDP', artigo: 'o', de: [1914, 12], certeza: 'documentado', proscrito: DITADURAS, divisoes: ['S', 'C', 'B'], linha: 'liberal e reformista, de Lisandro de la Torre, forte em Santa Fe' },
    { id: 'AR_PCA', sigla: 'PCA', nome: 'Partido Comunista', chamado: 'Partido Comunista', artigo: 'o', de: [1918, 1], certeza: 'documentado', proscrito: DITADURAS, linha: 'comunista' },
    { id: 'AR_UCEDE', sigla: 'UCeDé', nome: 'União do Centro Democrático', chamado: 'UCeDé', artigo: 'a', de: [1982, 6], certeza: 'documentado', linha: 'liberal na economia, de Álvaro Alsogaray' },
    { id: 'AR_CC', sigla: 'CC-ARI', nome: 'Coalizão Cívica ARI', chamado: 'Coalizão Cívica', artigo: 'a', de: [2002, 3], certeza: 'aproximado', linha: 'republicana, contra a corrupção, de Elisa Carrió' },
    { id: 'AR_PRO', sigla: 'PRO', nome: 'Proposta Republicana', chamado: 'PRO', artigo: 'o', de: [2005, 1], certeza: 'aproximado', linha: 'de centro-direita, nascido em Buenos Aires (Mauricio Macri)' },
    { id: 'AR_LLA', sigla: 'LLA', nome: 'A Liberdade Avança', chamado: 'A Liberdade Avança', artigo: 'a', de: [2021, 7], certeza: 'aproximado', linha: 'libertário (Javier Milei)' }
  ]
};
