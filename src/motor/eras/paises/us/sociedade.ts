/**
 * ERAS v4 · A SOCIEDADE DOS ESTADOS UNIDOS (1900–2025): barreiras, reformas, movimentos e partidos.
 * [F] fato documentado · [A] aproximação de jogo (o tamanho de um costume, a força de uma oposição).
 * Os estados do Sul no jogo: Texas, Flórida, Geórgia, Kentucky e o Distrito de Columbia (escola segregada até 1954).
 */
import type { SociedadeDaEra } from '../../base/sociedade4';

const SUL = ['TX', 'FL', 'GA', 'KY', 'DC'];

export const SOCIEDADE_US: SociedadeDaEra = {
  barreiras: [
    {
      id: 'us_jim_crow_trabalho', quem: 'negro', natureza: 'lei', dominio: 'trabalho', divisoes: SUL, de: 1900, ate: 1965, fator: 0.55,
      alvo: { setores: ['comercio', 'administrativo', 'financas', 'juridico', 'comunicacao', 'publico', 'seguranca', 'engenharia', 'tecnologia'] },
      residuo: { fator: 0.8, anos: 25 }, reforma: 'us_dessegregacao_estadual',
      texto: 'Pelas leis de segregação do estado, o balcão, o escritório e a repartição eram de brancos: a vaga não era para você.',
      alternativa: 'Os negócios, as escolas, as igrejas e os jornais da própria comunidade negra contratavam — e eram muitos.',
      fonte: 'Leis estaduais "Jim Crow" (1890–1965); Civil Rights Act de 1964, Título VII (em vigor em 02/07/1965). Fator: aproximação [A].', certeza: 'aproximado'
    },
    {
      id: 'us_discriminacao_emprego', quem: 'negro', natureza: 'costume', dominio: 'trabalho', de: 1900, ate: 1965, fator: 0.65,
      alvo: { nivelMin: 2 }, residuo: { fator: 0.8, anos: 30 }, reforma: 'us_direitos_civis',
      texto: 'Recusar alguém pela cor era legal em quase todo o país: a vaga "já tinha sido preenchida" quando você chegou.',
      alternativa: 'As vagas do governo federal (proibição de discriminar na defesa desde 1941) e os sindicatos que aceitavam negros.',
      fonte: 'Executive Order 8802 (1941, indústria de defesa); Civil Rights Act de 1964, Título VII. Fator: aproximação [A] (estudos de auditoria de contratação).', certeza: 'aproximado'
    },
    {
      id: 'us_salario_mulher', quem: 'mulher', natureza: 'costume', dominio: 'salario', de: 1900, ate: 1964, fator: 0.65,
      residuo: { fator: 0.8, anos: 40 }, reforma: 'us_salario_igual',
      texto: 'Pagar menos à mulher pelo mesmo trabalho era legal: o salário de entrada veio menor que o dos colegas homens.',
      fonte: 'Equal Pay Act de 10/06/1963 (em vigor em 1964). Em 1963, a mulher em tempo integral ganhava cerca de 59% do salário do homem (U.S. Census Bureau). Fator: aproximação [A].', certeza: 'documentado'
    },
    {
      id: 'us_barreira_casamento', quem: 'mulher_casada', natureza: 'instituicao', dominio: 'trabalho', de: 1900, ate: 1951, fator: 0.3,
      alvo: { setores: ['educacao', 'administrativo', 'financas', 'publico'] }, residuo: { fator: 0.75, anos: 15 }, reforma: 'us_direitos_civis',
      texto: 'Escolas, bancos e repartições não contratavam mulher casada — e demitiam quem se casava ("marriage bar").',
      alternativa: 'O comércio, as fábricas e o trabalho por conta própria não tinham a regra.',
      fonte: 'C. Goldin, "Marriage Bars: Discrimination against Married Women Workers, 1920s to 1950s" (NBER, 1988): as barreiras somem no começo dos anos 1950; Civil Rights Act de 1964 (Título VII, sexo).', certeza: 'documentado'
    },
    {
      id: 'us_credito_mulher', quem: 'mulher', natureza: 'instituicao', dominio: 'credito', de: 1900, ate: 1975, bloqueia: true, reforma: 'us_credito_igual',
      texto: 'O banco pedia um homem para assinar junto — o marido, o pai — antes de dar crédito ou cartão a uma mulher.',
      alternativa: 'Com a assinatura de um homem da família, o crédito saía.',
      fonte: 'Equal Credit Opportunity Act de 28/10/1974 (em vigor em 28/10/1975).', certeza: 'documentado'
    },
    {
      id: 'us_redlining', quem: 'negro', natureza: 'instituicao', dominio: 'credito', de: 1934, ate: 1968, bloqueia: true, reforma: 'us_moradia_justa',
      texto: 'O bairro estava pintado de vermelho nos mapas do crédito: o financiamento foi negado.',
      alternativa: 'Comprar em contrato direto com o vendedor ("contract buying"), mais caro e sem proteção.',
      fonte: 'Home Owners\' Loan Corporation (mapas de 1935–1940) e a Federal Housing Administration (1934); Fair Housing Act, 11/04/1968.', certeza: 'documentado'
    },
    {
      id: 'us_voto_negado', quem: 'negro', natureza: 'instituicao', dominio: 'politica', divisoes: ['TX', 'FL', 'GA'], de: 1900, ate: 1965, fator: 0.15,
      residuo: { fator: 0.6, anos: 20 }, reforma: 'us_direito_de_voto',
      texto: 'Taxa de voto, teste de alfabetização, primária só de brancos: no estado, quase nenhum negro conseguia votar — e uma candidatura negra não tinha eleitores.',
      fonte: 'Smith v. Allwright (1944, primária branca); 24ª Emenda (1964); Voting Rights Act de 06/08/1965. Fator: aproximação [A].', certeza: 'aproximado'
    },
    {
      id: 'us_universidade_segregada', quem: 'negro', natureza: 'lei', dominio: 'estudo', divisoes: SUL, de: 1900, ate: 1954, fator: 0.5,
      residuo: { fator: 0.6, anos: 12 }, reforma: 'us_dessegregacao_estadual',
      texto: 'A universidade do estado não aceitava estudantes negros: as vagas eram as das faculdades negras (Howard, Fisk, Morehouse, Spelman) — poucas e longe.',
      alternativa: 'As faculdades historicamente negras formavam professores, médicos e advogados.',
      fonte: 'Sweatt v. Painter (1950); Brown v. Board of Education (17/05/1954); a integração de fato veio aos poucos (Universidade da Geórgia, 1961). Fator: aproximação [A].', certeza: 'aproximado'
    },
    {
      id: 'us_faculdade_mulher', quem: 'mulher', natureza: 'instituicao', dominio: 'estudo', de: 1900, ate: 1972, fator: 0.75,
      residuo: { fator: 0.9, anos: 15 }, reforma: 'us_title_ix',
      texto: 'Muitas universidades e escolas de medicina e direito limitavam as vagas de mulheres (Yale e Princeton só as aceitaram em 1969).',
      fonte: 'Title IX das Education Amendments, 23/06/1972. Fator: aproximação [A].', certeza: 'aproximado'
    },
    {
      id: 'us_servico_federal_gay', quem: 'mesmo_genero', natureza: 'instituicao', dominio: 'trabalho', de: 1953, ate: 1975, bloqueia: true,
      alvo: { concurso: true }, residuo: { fator: 0.7, anos: 20 }, reforma: 'us_fim_veto_federal',
      texto: 'Pela ordem executiva de 1953, quem tinha uma relação com alguém do mesmo sexo era excluído do serviço público federal.',
      fonte: 'Executive Order 10450 (27/04/1953); a Civil Service Commission suspendeu a exclusão em 03/07/1975.', certeza: 'documentado'
    }
  ],
  reformas: [
    { id: 'us_voto_feminino', nome: 'O voto das mulheres', texto: 'as mulheres passaram a votar em todo o país', derruba: ['us_voto_mulher'], real: [1920, 8], desde: 1900, alcance: 'nacional', resistencia: 0.5, oposicao: 'os estados do Sul e a indústria das bebidas', acontecimentos: ['voto_feminino'], fonte: '19ª Emenda, ratificada em 18/08/1920.' },
    { id: 'us_voto_feminino_estadual', nome: 'O voto das mulheres no estado', texto: 'as mulheres passaram a votar nas eleições do estado', derruba: ['us_voto_mulher'], desde: 1900, alcance: 'estadual', resistencia: 0.45, oposicao: 'a maioria da legislatura estadual', fonte: 'Antes da 19ª Emenda, vários estados já davam o voto às mulheres (Wyoming, 1869; Washington, 1910; Califórnia, 1911; Nova York, 1917).' },
    { id: 'us_trabalho_infantil', nome: 'O fim do trabalho infantil', texto: 'trabalho de criança nas fábricas e nas minas ficou proibido', derruba: ['us_trabalho_infantil'], real: [1938, 10], desde: 1900, alcance: 'nacional', resistencia: 0.55, oposicao: 'os donos de tecelagens e minas, e a Suprema Corte (que derrubou a lei de 1916 em 1918)', acontecimentos: ['flsa'], fonte: 'Fair Labor Standards Act (25/06/1938, em vigor em 24/10/1938); Hammer v. Dagenhart (1918).' },
    { id: 'us_direitos_civis', nome: 'A Lei dos Direitos Civis', texto: 'discriminar pela cor, pela religião ou pelo sexo no emprego e nos lugares públicos passou a ser proibido', derruba: ['us_jim_crow_trabalho', 'us_discriminacao_emprego', 'us_barreira_casamento', 'us_jim_crow'], real: [1964, 7], desde: 1940, alcance: 'nacional', resistencia: 0.8, oposicao: 'os senadores do Sul, com a maior obstrução da história do Senado', acontecimentos: ['direitos_civis'], fonte: 'Civil Rights Act de 02/07/1964.' },
    { id: 'us_dessegregacao_estadual', nome: 'O fim da segregação no estado', texto: 'o estado revogou as próprias leis de segregação: escolas, universidades, transporte e repartições abertos a todos', derruba: ['us_jim_crow_trabalho', 'us_universidade_segregada', 'us_jim_crow', 'us_escola_segregada'], desde: 1900, alcance: 'estadual', divisoes: SUL, resistencia: 0.9, oposicao: 'a maioria branca da legislatura, os conselhos de cidadãos brancos e a Klan', fonte: 'Nenhum estado do Sul revogou a segregação por conta própria antes das decisões federais (Brown, 1954; Civil Rights Act, 1964): esta é uma reforma que a história não teve.' },
    { id: 'us_direito_de_voto', nome: 'A Lei do Direito de Voto', texto: 'os testes de alfabetização e as manobras para impedir o voto negro foram proibidos, com fiscalização federal', derruba: ['us_voto_negado'], real: [1965, 8], desde: 1945, alcance: 'nacional', resistencia: 0.75, oposicao: 'os políticos do Sul que viviam do eleitorado só branco', acontecimentos: ['voto_1965'], fonte: 'Voting Rights Act de 06/08/1965.' },
    { id: 'us_moradia_justa', nome: 'A Lei da Moradia Justa', texto: 'negar casa ou financiamento pela cor passou a ser proibido', derruba: ['us_redlining', 'us_moradia'], real: [1968, 4], desde: 1945, alcance: 'nacional', resistencia: 0.65, oposicao: 'os corretores, os bancos e boa parte dos bairros brancos', fonte: 'Fair Housing Act (Título VIII do Civil Rights Act de 11/04/1968).' },
    { id: 'us_salario_igual', nome: 'Salário igual para trabalho igual', texto: 'pagar menos à mulher pelo mesmo trabalho passou a ser proibido', derruba: ['us_salario_mulher'], real: [1963, 6], desde: 1920, alcance: 'nacional', resistencia: 0.5, oposicao: 'as associações patronais', fonte: 'Equal Pay Act de 10/06/1963.' },
    { id: 'us_title_ix', nome: 'Title IX', texto: 'escolas e universidades com dinheiro federal ficaram proibidas de discriminar pelo sexo', derruba: ['us_faculdade_mulher'], real: [1972, 6], desde: 1945, alcance: 'nacional', resistencia: 0.4, oposicao: 'as universidades só de homens e os departamentos de esporte', fonte: 'Education Amendments de 23/06/1972, Title IX.' },
    { id: 'us_credito_igual', nome: 'Crédito igual', texto: 'negar crédito pelo sexo ou pelo estado civil passou a ser proibido', derruba: ['us_credito_mulher'], real: [1975, 10], desde: 1950, alcance: 'nacional', resistencia: 0.35, oposicao: 'parte dos bancos', fonte: 'Equal Credit Opportunity Act (1974; em vigor em 28/10/1975).' },
    { id: 'us_fim_veto_federal', nome: 'O fim do veto no serviço federal', texto: 'a relação com alguém do mesmo sexo deixou de excluir do serviço público federal', derruba: ['us_servico_federal_gay'], real: [1975, 7], desde: 1960, alcance: 'nacional', resistencia: 0.7, oposicao: 'o Congresso conservador e as agências de segurança', fonte: 'Civil Service Commission, 03/07/1975 (revisão da aplicação da EO 10450).' },
    { id: 'us_escola_municipal', nome: 'Escola pública ampliada na cidade', texto: 'a cidade abriu escolas e o ensino médio gratuito chegou aos bairros pobres', derruba: ['us_trabalho_infantil'], institui: 'escola', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'os contribuintes que não queriam o imposto da escola', fonte: 'O "high school movement" (1910–1940; C. Goldin e L. Katz); o efeito local é aproximação de jogo [A].' },
    { id: 'us_saude_municipal', nome: 'Saúde pública na cidade', texto: 'a cidade tratou a água, pasteurizou o leite e abriu postos de vacinação', derruba: [], institui: 'saude', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'as companhias de água e os leiteiros', fonte: 'Cutler & Miller (2005), "The Role of Public Health Improvements in Health Advances" (a água tratada e a mortalidade, 1900–1936); o efeito é aproximação [A].' }
  ],
  movimentos: [
    { id: 'us_sufragistas', nome: 'O movimento sufragista', causa: 'o voto das mulheres', reformas: ['us_voto_feminino', 'us_voto_feminino_estadual'], de: 1900, ate: 1920, risco: [[1900, 1917, 1], [1917, 1920, 2]], fonte: 'National American Woman Suffrage Association; National Woman\'s Party (as "Silent Sentinels" presas em 1917).' },
    { id: 'us_trabalhista', nome: 'O movimento operário', causa: 'jornada, salário e o fim do trabalho infantil', reformas: ['us_trabalho_infantil'], de: 1900, ate: 1940, risco: [[1900, 1935, 2], [1935, 1940, 1]], fonte: 'National Child Labor Committee (1904); as greves de 1912–1937; National Labor Relations Act (1935).' },
    { id: 'us_direitos_civis_sul', nome: 'O movimento pelos direitos civis', causa: 'o fim da segregação e o direito de voto', reformas: ['us_dessegregacao_estadual', 'us_direitos_civis', 'us_direito_de_voto', 'us_moradia_justa'], divisoes: SUL, de: 1909, ate: 1968, risco: [[1909, 1968, 2]], fonte: 'NAACP (1909); o boicote de Montgomery (1955); SNCC (1960); Freedom Summer (1964).' },
    { id: 'us_direitos_civis', nome: 'O movimento pelos direitos civis', causa: 'o fim da discriminação no emprego e na moradia', reformas: ['us_direitos_civis', 'us_direito_de_voto', 'us_moradia_justa'], de: 1909, ate: 1968, risco: [[1909, 1968, 1]], fonte: 'NAACP (1909); Marcha sobre Washington (28/08/1963).' },
    { id: 'us_feminista', nome: 'O movimento das mulheres', causa: 'salário igual, crédito e universidade', reformas: ['us_salario_igual', 'us_title_ix', 'us_credito_igual'], de: 1960, ate: 1976, risco: [[1960, 1976, 0]], fonte: 'National Organization for Women (1966).' },
    { id: 'us_gay', nome: 'O movimento homófilo e gay', causa: 'o fim das demissões e das batidas policiais', reformas: ['us_fim_veto_federal'], de: 1950, ate: 1976, risco: [[1950, 1969, 1], [1969, 1976, 1]], fonte: 'Mattachine Society (1950); Stonewall (28/06/1969).' }
  ],
  partidos: [
    { id: 'US_DEM', sigla: 'D', nome: 'Partido Democrata', chamado: 'Partido Democrata', artigo: 'o', de: [1828, 1], certeza: 'documentado', linha: 'o mais antigo dos dois grandes; até os anos 1960, dominante no Sul segregacionista e, desde o New Deal, a coalizão dos sindicatos e das cidades' },
    { id: 'US_REP', sigla: 'R', nome: 'Partido Republicano', chamado: 'Partido Republicano', artigo: 'o', de: [1854, 7], certeza: 'documentado', linha: 'o partido de Lincoln e da indústria do Norte; depois dos anos 1960, cada vez mais forte no Sul e conservador' },
    { id: 'US_SOC', sigla: 'SP', nome: 'Partido Socialista da América', chamado: 'Partido Socialista', artigo: 'o', de: [1901, 7], ate: [1973, 1], como: 'extincao', certeza: 'documentado', linha: 'socialista democrático, de Eugene Debs e Norman Thomas' },
    { id: 'US_PROG', sigla: 'PROG', nome: 'Partido Progressista', chamado: 'Partido Progressista', artigo: 'o', de: [1912, 8], ate: [1917, 1], como: 'extincao', certeza: 'aproximado', linha: 'o "Bull Moose" de Theodore Roosevelt: reforma, regulação das grandes empresas, voto feminino' },
    { id: 'US_LIB', sigla: 'LP', nome: 'Partido Libertário', chamado: 'Partido Libertário', artigo: 'o', de: [1971, 12], certeza: 'documentado', linha: 'libertário: menos Estado na economia e na vida privada' },
    { id: 'US_REFORM', sigla: 'RP', nome: 'Partido da Reforma', chamado: 'Partido da Reforma', artigo: 'o', de: [1995, 9], certeza: 'aproximado', linha: 'o partido de Ross Perot: contas públicas e reforma política' },
    { id: 'US_GREEN', sigla: 'GP', nome: 'Partido Verde', chamado: 'Partido Verde', artigo: 'o', de: [2001, 7], certeza: 'aproximado', linha: 'ecologista e de esquerda' }
  ]
};
