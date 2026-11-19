/**
 * ERAS v4 · A SOCIEDADE DO BRASIL (1900–2025): as barreiras que pesavam na vida, as reformas que as derrubaram, os
 * movimentos que lutaram por elas e os partidos de antes de 1966 (os de 1966 em diante estão em `partidos`).
 *
 * Classes: [F] fato documentado (a lei, a data, a fonte) · [A] aproximação de jogo (o tamanho de um costume, a força de
 * uma oposição). Nada aqui descreve uma capacidade de quem nasce de um jeito: descreve quem fechava a porta.
 * Puro (só tipos): fica com a base histórica.
 */
import type { SociedadeDaEra } from './sociedade4';

export const SOCIEDADE_BR: SociedadeDaEra = {
  barreiras: [
    {
      id: 'br_casada_trabalho', quem: 'mulher_casada', natureza: 'lei', dominio: 'trabalho', de: 1917, ate: 1962, fator: 0.55,
      residuo: { fator: 0.8, anos: 25 }, reforma: 'br_estatuto_mulher_casada',
      texto: 'Pelo Código Civil, a mulher casada precisava da autorização do marido para exercer uma profissão — e muito patrão pedia o papel antes de contratar.',
      alternativa: 'Trabalhar por conta própria em casa (costura, doces, aulas particulares) dependia menos do papel.',
      fonte: 'Código Civil de 1916 (Lei 3.071/1916), art. 242, VII; revogado pelo Estatuto da Mulher Casada (Lei 4.121, de 27/08/1962). Fator e resíduo: aproximação [A].', certeza: 'documentado'
    },
    {
      id: 'br_casada_credito', quem: 'mulher_casada', natureza: 'lei', dominio: 'credito', de: 1917, ate: 1962, bloqueia: true, reforma: 'br_estatuto_mulher_casada',
      texto: 'Sem a assinatura do marido, o banco não fazia o contrato: pela lei, a mulher casada não podia contrair dívida sozinha.',
      alternativa: 'O crédito podia sair no nome do marido.',
      fonte: 'Código Civil de 1916, arts. 6º, II, e 242; Lei 4.121/1962 (Estatuto da Mulher Casada).', certeza: 'documentado'
    },
    {
      id: 'br_boa_aparencia', quem: 'negro', natureza: 'costume', dominio: 'trabalho', de: 1900, ate: 1989, fator: 0.7,
      alvo: { setores: ['comercio', 'beleza', 'comunicacao', 'financas', 'administrativo', 'alimentacao'] },
      residuo: { fator: 0.85, anos: 30 }, reforma: 'br_lei_cao',
      texto: 'O anúncio pedia "boa aparência" — um jeito conhecido, na época, de dizer quem não seria chamado para o balcão e para o escritório.',
      alternativa: 'A indicação de alguém de dentro, e as vagas por concurso, pesavam menos o rosto.',
      fonte: 'Lei 1.390/1951 (Lei Afonso Arinos: contravenção, pouco aplicada); Lei 7.716, de 05/01/1989 (Lei Caó: crime); C. Hasenbalg, "Discriminação e desigualdades raciais no Brasil" (1979). Fator: aproximação [A].', certeza: 'aproximado'
    },
    {
      id: 'br_atestado_ideologico', quem: 'fichado', natureza: 'instituicao', dominio: 'trabalho', de: 1964, ate: 1979, bloqueia: true,
      alvo: { concurso: true }, reforma: 'br_anistia',
      texto: 'O nome estava nos arquivos da polícia política: para o serviço público, o "atestado de antecedentes" não saía limpo.',
      alternativa: 'O emprego privado, sem passar pelos órgãos de informação — e mesmo ali, nem sempre.',
      fonte: 'Comissão Nacional da Verdade, Relatório (2014), vol. I (as Assessorias de Segurança e Informações nos órgãos públicos e o controle ideológico de servidores); Lei 6.683/1979 (Anistia).', certeza: 'documentado'
    },
    {
      id: 'br_tutela_indigena', quem: 'indigena', natureza: 'lei', dominio: 'credito', de: 1917, ate: 1988, bloqueia: true, reforma: 'br_tutela',
      texto: 'Pela lei, o indígena era "relativamente incapaz", sob a tutela do Estado: contratos e dívidas passavam pelo órgão tutor.',
      fonte: 'Código Civil de 1916, art. 6º, III; Lei 6.001/1973 (Estatuto do Índio), arts. 7º–8º; Constituição de 1988, arts. 231–232 (fim da tutela).', certeza: 'documentado'
    }
  ],
  reformas: [
    {
      id: 'br_voto_feminino', nome: 'O voto das mulheres', texto: 'as mulheres passaram a votar e a ser votadas', derruba: ['br_voto_feminino'],
      real: [1932, 2], desde: 1910, alcance: 'nacional', resistencia: 0.55, acontecimentos: ['voto_feminino_32'],
      oposicao: 'boa parte do Congresso e da imprensa, que via o voto feminino como ameaça à família',
      fonte: 'Decreto 21.076, de 24/02/1932 (Código Eleitoral). No Rio Grande do Norte, a lei estadual 660/1927 já permitia o alistamento de mulheres.'
    },
    {
      id: 'br_estatuto_mulher_casada', nome: 'O Estatuto da Mulher Casada', texto: 'a mulher casada deixou de precisar da autorização do marido para trabalhar, abrir conta e contratar',
      derruba: ['br_casada_trabalho', 'br_casada_credito', 'br_mulher_casada'], real: [1962, 8], desde: 1930, alcance: 'nacional', resistencia: 0.6, acontecimentos: ['mulher_casada_62'],
      oposicao: 'a bancada conservadora e parte do clero, que defendiam o marido como "chefe da sociedade conjugal"',
      fonte: 'Lei 4.121, de 27/08/1962; projeto da advogada Romy Medeiros da Fonseca e do Conselho Nacional de Mulheres (1951).'
    },
    {
      id: 'br_lei_cao', nome: 'A discriminação racial como crime', texto: 'discriminar alguém pela cor no emprego, no comércio e no acesso a lugares passou a ser crime',
      derruba: ['br_boa_aparencia'], real: [1989, 1], desde: 1946, alcance: 'nacional', resistencia: 0.45,
      oposicao: 'quem negava que houvesse racismo no Brasil e via a lei como desnecessária',
      fonte: 'Lei 7.716, de 05/01/1989 (Lei Caó), regulamentando o art. 5º, XLII, da Constituição de 1988; antes, a Lei 1.390/1951 (contravenção).'
    },
    {
      id: 'br_anistia', nome: 'A anistia', texto: 'os presos e perseguidos políticos foram anistiados e os arquivos deixaram de fechar portas', derruba: ['br_atestado_ideologico'],
      real: [1979, 8], desde: 1968, alcance: 'nacional', resistencia: 0.75, acontecimentos: ['anistia'],
      oposicao: 'a linha-dura militar e os órgãos de informação',
      fonte: 'Lei 6.683, de 28/08/1979; Comitê Brasileiro pela Anistia (1978) e Movimento Feminino pela Anistia (1975).'
    },
    {
      id: 'br_tutela', nome: 'O fim da tutela indígena', texto: 'os povos indígenas passaram a responder por si mesmos, sem a tutela do Estado', derruba: ['br_tutela_indigena'],
      real: [1988, 10], desde: 1960, alcance: 'nacional', resistencia: 0.6,
      oposicao: 'interesses ligados às terras indígenas e parte da administração do órgão tutor',
      fonte: 'Constituição de 05/10/1988, arts. 231–232.'
    },
    {
      id: 'br_escola_municipal', nome: 'Escola primária para todas as crianças da cidade', texto: 'a cidade abriu escolas primárias nos bairros e no campo, com merenda, e a criança passou a estudar em vez de trabalhar',
      derruba: ['br_trabalho_infantil'], institui: 'escola', desde: 1900, alcance: 'municipal', resistencia: 0.3,
      oposicao: 'quem pagaria a conta no orçamento da cidade, e os patrões que contavam com o trabalho das crianças',
      fonte: 'Constituição de 1934, art. 150 (primário obrigatório e gratuito, sem escola suficiente); o efeito local é aproximação de jogo [A].'
    },
    {
      id: 'br_escola_estadual', nome: 'Rede estadual de escolas e ginásios públicos', texto: 'o estado abriu escolas e ginásios públicos nas cidades do interior',
      derruba: ['br_trabalho_infantil'], institui: 'escola', desde: 1900, alcance: 'estadual', resistencia: 0.4,
      oposicao: 'os deputados que preferiam a verba em obras nas suas bases',
      fonte: 'A expansão da escola pública estadual (São Paulo, 1890–1930; Minas, Reforma Francisco Campos, 1927); o efeito é aproximação de jogo [A].'
    },
    {
      id: 'br_saude_municipal', nome: 'Água tratada, esgoto e posto de saúde', texto: 'a cidade levou água tratada e esgoto aos bairros e abriu postos de saúde com vacinação',
      derruba: [], institui: 'saude', desde: 1900, alcance: 'municipal', resistencia: 0.35,
      oposicao: 'quem resistia às campanhas sanitárias (a Revolta da Vacina, 1904) e à conta das obras',
      fonte: 'Oswaldo Cruz e as campanhas sanitárias (1903–1909); o efeito na mortalidade é aproximação de jogo [A].'
    }
  ],
  movimentos: [
    {
      id: 'br_sufragistas', nome: 'O movimento sufragista', causa: 'o direito das mulheres de votar e ser votadas', reformas: ['br_voto_feminino'],
      de: 1910, ate: 1932, risco: [[1910, 1932, 1]],
      fonte: 'Partido Republicano Feminino (Leolinda Daltro, 1910); Federação Brasileira pelo Progresso Feminino (Bertha Lutz, 1922).'
    },
    {
      id: 'br_direitos_mulher', nome: 'A luta pelos direitos da mulher casada', causa: 'o fim da chefia do marido no Código Civil', reformas: ['br_estatuto_mulher_casada'],
      de: 1945, ate: 1962, risco: [[1945, 1962, 0]],
      fonte: 'Conselho Nacional de Mulheres do Brasil; Romy Medeiros da Fonseca (projeto de 1951).'
    },
    {
      id: 'br_movimento_negro', nome: 'O movimento negro', causa: 'o fim da discriminação racial no trabalho, na escola e nos lugares públicos', reformas: ['br_lei_cao'],
      de: 1931, ate: 1989, risco: [[1931, 1937, 0], [1937, 1945, 2], [1945, 1964, 0], [1964, 1979, 2], [1979, 1989, 1]],
      fonte: 'Frente Negra Brasileira (1931, fechada pelo Estado Novo em 1937); Teatro Experimental do Negro (1944); Movimento Negro Unificado (1978).'
    },
    {
      id: 'br_anistia', nome: 'O movimento pela anistia', causa: 'a libertação dos presos políticos e a volta dos exilados', reformas: ['br_anistia'],
      de: 1975, ate: 1979, risco: [[1975, 1979, 2]],
      fonte: 'Movimento Feminino pela Anistia (Therezinha Zerbini, 1975); Comitê Brasileiro pela Anistia (1978).'
    },
    {
      id: 'br_indigena', nome: 'O movimento indígena', causa: 'a terra e a autonomia dos povos indígenas', reformas: ['br_tutela'],
      de: 1974, ate: 1988, risco: [[1974, 1979, 2], [1979, 1988, 1]],
      fonte: 'Assembleias indígenas (a partir de 1974); União das Nações Indígenas (1980); a Constituinte de 1987–1988.'
    },
    {
      id: 'br_educacao_publica', nome: 'A campanha pela escola pública', causa: 'escola primária gratuita para todas as crianças', reformas: ['br_escola_municipal', 'br_escola_estadual'],
      de: 1932, ate: 1964, risco: [[1932, 1937, 0], [1937, 1945, 1], [1945, 1964, 0]],
      fonte: 'Manifesto dos Pioneiros da Educação Nova (1932); Campanha em Defesa da Escola Pública (1959–1961).'
    }
  ],
  partidos: [
    // ------------------------------------------------------------ a Primeira República (os partidos republicanos dos estados)
    { id: 'PRP_1873', sigla: 'PRP', nome: 'Partido Republicano Paulista', chamado: 'PRP', artigo: 'o', de: [1873, 4], ate: [1937, 12], como: 'extincao', certeza: 'documentado', divisoes: ['SP'], linha: 'o partido dos fazendeiros de café paulistas, que governou São Paulo e dividiu a Presidência com Minas' },
    { id: 'PRM_1888', sigla: 'PRM', nome: 'Partido Republicano Mineiro', chamado: 'PRM', artigo: 'o', de: [1888, 1], ate: [1937, 12], como: 'extincao', certeza: 'aproximado', divisoes: ['MG'], linha: 'a máquina política de Minas Gerais, sócia de São Paulo na "política do café com leite"' },
    { id: 'PRR_1882', sigla: 'PRR', nome: 'Partido Republicano Rio-Grandense', chamado: 'PRR', artigo: 'o', de: [1882, 2], ate: [1937, 12], como: 'extincao', certeza: 'documentado', divisoes: ['RS'], linha: 'republicano e positivista, de Júlio de Castilhos e Borges de Medeiros' },
    { id: 'PRC_1910', sigla: 'PRC', nome: 'Partido Republicano Conservador', chamado: 'PRC', artigo: 'o', de: [1910, 11], ate: [1915, 12], como: 'extincao', certeza: 'aproximado', linha: 'a tentativa de partido nacional de Pinheiro Machado, que se desfez com a morte dele' },
    { id: 'PD_1926', sigla: 'PD', nome: 'Partido Democrático', chamado: 'PD', artigo: 'o', de: [1926, 2], ate: [1934, 2], como: 'extincao', certeza: 'aproximado', divisoes: ['SP'], linha: 'a oposição liberal ao PRP em São Paulo: voto secreto e eleições limpas' },
    { id: 'PL_1928', sigla: 'PL', nome: 'Partido Libertador', chamado: 'PL', artigo: 'o', de: [1928, 3], ate: [1965, 10], como: 'extincao', certeza: 'documentado', divisoes: ['RS'], proscrito: [[1938, 1945]], linha: 'parlamentarista e liberal, de Assis Brasil, no Rio Grande do Sul' },
    { id: 'PCB_1922', sigla: 'PCB', nome: 'Partido Comunista do Brasil', chamado: 'PCB', artigo: 'o', de: [1922, 3], ate: [1985, 5], vira: 'PCB_1985', como: 'nome', certeza: 'documentado', proscrito: [[1922, 1927], [1928, 1945], [1947, 1985]], linha: 'comunista, ligado à Internacional; legal só em 1927 e entre 1945 e 1947' },
    // ------------------------------------------------------------ 1945–1965 (extintos pelo AI-2, 27/10/1965)
    { id: 'PSD_1945', sigla: 'PSD', nome: 'Partido Social Democrático', chamado: 'PSD', artigo: 'o', de: [1945, 7], ate: [1965, 10], como: 'extincao', certeza: 'documentado', linha: 'nascido dos interventores de Vargas; forte no interior e nos governos estaduais' },
    { id: 'UDN', sigla: 'UDN', nome: 'União Democrática Nacional', chamado: 'UDN', artigo: 'a', de: [1945, 4], ate: [1965, 10], como: 'extincao', certeza: 'documentado', linha: 'a oposição liberal a Vargas, das classes médias urbanas e dos bacharéis' },
    { id: 'PTB_1945', sigla: 'PTB', nome: 'Partido Trabalhista Brasileiro', chamado: 'PTB', artigo: 'o', de: [1945, 5], ate: [1965, 10], como: 'extincao', certeza: 'documentado', linha: 'trabalhista, nascido dos sindicatos e do Ministério do Trabalho de Vargas' },
    { id: 'PSP_1946', sigla: 'PSP', nome: 'Partido Social Progressista', chamado: 'PSP', artigo: 'o', de: [1946, 6], ate: [1965, 10], como: 'extincao', certeza: 'aproximado', linha: 'o partido de Ademar de Barros, forte em São Paulo' },
    { id: 'PDC_1945', sigla: 'PDC', nome: 'Partido Democrata Cristão', chamado: 'PDC', artigo: 'o', de: [1945, 7], ate: [1965, 10], como: 'extincao', certeza: 'aproximado', linha: 'democrata-cristão, inspirado na doutrina social da Igreja' },
    { id: 'PSB_1947', sigla: 'PSB', nome: 'Partido Socialista Brasileiro', chamado: 'PSB', artigo: 'o', de: [1947, 8], ate: [1965, 10], como: 'extincao', certeza: 'aproximado', linha: 'socialista democrático, de intelectuais vindos da Esquerda Democrática' },
    { id: 'PR_1945', sigla: 'PR', nome: 'Partido Republicano', chamado: 'PR', artigo: 'o', de: [1945, 9], ate: [1965, 10], como: 'extincao', certeza: 'aproximado', linha: 'de antigos republicanos da Primeira República, forte em Minas' },
    { id: 'PTN_1945', sigla: 'PTN', nome: 'Partido Trabalhista Nacional', chamado: 'PTN', artigo: 'o', de: [1945, 10], ate: [1965, 10], como: 'extincao', certeza: 'aproximado', linha: 'trabalhista, uma das legendas menores do período' }
  ]
};
