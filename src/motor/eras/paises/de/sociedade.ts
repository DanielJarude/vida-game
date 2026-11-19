/**
 * ERAS v4 · A SOCIEDADE DA ALEMANHA (1900–2025, com a RDA): barreiras, reformas, movimentos e partidos.
 * [F] fato documentado · [A] aproximação de jogo.
 *
 * Decisão de desenho: o jogo não oferece filiação ao partido nazista (nem a nenhum partido fascista ou neonazista): a
 * história dele aparece como fato documentado (`pacote.acontecimentos`, regras), não como caminho de carreira. Entre
 * julho de 1933 e 1945 não havia partido em que se filiar livremente. A perseguição aos judeus (as leis de 1933–1941)
 * exige que a época dê às famílias a religião daquele tempo — pendente (ver o relatório).
 */
import type { SociedadeDaEra } from '../../base/sociedade4';

const PROIBIDOS_33: [number, number] = [1933, 1946];

export const SOCIEDADE_DE: SociedadeDaEra = {
  barreiras: [
    {
      id: 'de_universidade_mulher', quem: 'mulher', natureza: 'lei', dominio: 'estudo', de: 1900, ate: 1909, fator: 0.2,
      residuo: { fator: 0.7, anos: 25 }, reforma: 'de_matricula_feminina',
      texto: 'Na maior parte dos estados alemães, a mulher só podia assistir às aulas como ouvinte, com licença do professor: não se matriculava.',
      fonte: 'Baden matriculou mulheres em 1900, a Baviera em 1903, a Prússia em agosto de 1908; Mecklemburgo por último, em 1909.', certeza: 'documentado'
    },
    {
      id: 'de_1358', quem: 'mulher_casada', natureza: 'lei', dominio: 'trabalho', lado: 'oeste', de: 1900, ate: 1958, fator: 0.6,
      residuo: { fator: 0.85, anos: 20 }, reforma: 'de_igualdade_58',
      texto: 'Pelo Código Civil, o marido podia rescindir o contrato de trabalho da esposa: muito patrão não contratava mulher casada sem o "de acordo" dele.',
      fonte: 'BGB de 1900, § 1358 (revogado pela Lei da Igualdade de Direitos, em vigor em 01/07/1958). Fator: aproximação [A].', certeza: 'documentado'
    },
    {
      id: 'de_1356', quem: 'mulher_casada', natureza: 'lei', dominio: 'trabalho', lado: 'oeste', de: 1958, ate: 1977, fator: 0.85, reforma: 'de_reforma_casamento',
      texto: 'Pela lei, a esposa podia trabalhar "desde que isso fosse compatível com os deveres no casamento e na família" — e o patrão ainda perguntava pelo marido.',
      fonte: 'BGB § 1356 na redação de 1958; Primeira Lei de Reforma do Casamento (em vigor em 01/07/1977). Fator: aproximação [A].', certeza: 'documentado'
    },
    {
      id: 'de_credito_casada', quem: 'mulher_casada', natureza: 'lei', dominio: 'credito', lado: 'oeste', de: 1900, ate: 1962, bloqueia: true, reforma: 'de_igualdade_58',
      texto: 'O banco não abria conta nem fazia empréstimo à mulher casada sem a assinatura do marido.',
      alternativa: 'O crédito podia sair no nome do marido.',
      fonte: 'Prática bancária sob o regime de bens do BGB; a mulher casada pôde abrir conta sozinha a partir de 1962.', certeza: 'aproximado'
    },
    {
      id: 'de_duplo_salario', quem: 'mulher_casada', natureza: 'lei', dominio: 'trabalho', de: 1933, ate: 1945, bloqueia: true, alvo: { concurso: true },
      texto: 'Pela lei de 1933 contra o "duplo salário", a servidora casada era demitida quando o marido tinha renda: o serviço público não era para ela.',
      fonte: 'Lei sobre a Situação Jurídica das Servidoras, 30/06/1933.', certeza: 'documentado'
    },
    {
      id: 'de_justica_mulher', quem: 'mulher', natureza: 'lei', dominio: 'trabalho', de: 1936, ate: 1945, bloqueia: true, alvo: { trilhas: ['direito', 'judiciario'] },
      texto: 'O regime tirou as mulheres da magistratura, do Ministério Público e da advocacia.',
      fonte: 'Decisão de 1936 do regime (comunicada pelo Ministério da Justiça do Reich) que excluiu as mulheres dos cargos jurídicos.', certeza: 'aproximado'
    },
    {
      id: 'de_175_servico', quem: 'mesmo_genero', natureza: 'lei', dominio: 'trabalho', lado: 'oeste', de: 1900, ate: 1969, bloqueia: true, alvo: { concurso: true },
      residuo: { fator: 0.7, anos: 25 }, reforma: 'de_reforma_175',
      texto: 'Pelo § 175, a relação entre homens era crime: descoberta, custava o cargo público e podia dar prisão.',
      fonte: '§ 175 do Código Penal (endurecido em 1935 e mantido na República Federal até a reforma de 01/09/1969; revogado em 1994).', certeza: 'documentado'
    },
    {
      id: 'de_rda_igreja', quem: 'religioso', natureza: 'instituicao', dominio: 'estudo', lado: 'leste', de: 1950, ate: 1990, fator: 0.5,
      texto: 'Quem frequentava a igreja e não entrava na juventude do partido (FDJ) nem fazia a Jugendweihe raramente conseguia vaga no curso preparatório e na universidade.',
      alternativa: 'A formação técnica e as escolas da própria igreja (teologia) seguiam abertas.',
      fonte: 'Bundesstiftung zur Aufarbeitung der SED-Diktatur; a seleção para a Erweiterte Oberschule e a universidade pelo "engajamento social". Fator: aproximação [A].', certeza: 'aproximado'
    },
    {
      id: 'de_rda_opositor', quem: 'fichado', natureza: 'instituicao', dominio: 'estudo', lado: 'leste', de: 1950, ate: 1990, bloqueia: true,
      texto: 'Com o nome nos arquivos da Stasi, a universidade estava fechada.',
      fonte: 'BStU (arquivos da Stasi): "Zersetzung" e o bloqueio de estudos e carreiras de opositores.', certeza: 'documentado'
    }
  ],
  reformas: [
    { id: 'de_voto_feminino', nome: 'O voto das mulheres', texto: 'as mulheres passaram a votar e a ser votadas', derruba: ['de_voto_mulher'], real: [1918, 11], desde: 1900, alcance: 'nacional', resistencia: 0.6, oposicao: 'os conservadores e o Zentrum no Reichstag do Império', fonte: 'Proclamação do Conselho dos Comissários do Povo, 12/11/1918; eleição de 19/01/1919.' },
    { id: 'de_matricula_feminina', nome: 'A matrícula das mulheres na universidade', texto: 'as universidades do estado passaram a matricular mulheres', derruba: ['de_universidade_mulher'], real: [1908, 8], desde: 1900, alcance: 'estadual', resistencia: 0.4, oposicao: 'os professores e as corporações estudantis', fonte: 'As universidades eram dos estados: Baden (1900), Baviera (1903), Württemberg (1904), Saxônia (1906), Prússia (18/08/1908).' },
    { id: 'de_igualdade_58', nome: 'A Lei da Igualdade de Direitos', texto: 'o marido perdeu o poder de rescindir o trabalho da esposa e a última palavra nas decisões do casal', derruba: ['de_1358', 'de_credito_casada', 'de_mulher_1958'], real: [1958, 7], desde: 1949, alcance: 'nacional', lado: 'oeste', resistencia: 0.55, oposicao: 'a CDU/CSU e as igrejas, que defendiam o "casamento da dona de casa"', fonte: 'Lei Fundamental de 1949, art. 3º(2); Gleichberechtigungsgesetz de 18/06/1957 (em vigor em 01/07/1958).' },
    { id: 'de_reforma_casamento', nome: 'A reforma do casamento', texto: 'a esposa deixou de precisar do acordo do marido para trabalhar: o casal decide junto', derruba: ['de_1356', 'de_mulher_1977'], real: [1977, 7], desde: 1960, alcance: 'nacional', lado: 'oeste', resistencia: 0.5, oposicao: 'a CDU/CSU', acontecimentos: ['reforma_77'], fonte: 'Primeira Lei de Reforma do Casamento e da Família (em vigor em 01/07/1977).' },
    { id: 'de_reforma_175', nome: 'A reforma do § 175', texto: 'a relação entre homens adultos deixou de ser crime', derruba: ['de_175_servico', 'de_175'], real: [1969, 9], desde: 1949, alcance: 'nacional', lado: 'oeste', resistencia: 0.65, oposicao: 'a CDU/CSU e o Tribunal Constitucional (que manteve o § 175 em 1957)', fonte: 'Primeira Lei de Reforma Penal, em vigor em 01/09/1969.' },
    { id: 'de_escola_municipal', nome: 'Escola e jardim de infância na cidade', texto: 'a cidade abriu jardins de infância e ginásios gratuitos, com bolsas para os filhos de operários', derruba: [], institui: 'escola', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'a conta do orçamento da cidade', fonte: 'A expansão do ensino secundário nos anos 1960 ("Bildungsexpansion"); o efeito local é aproximação [A].' },
    { id: 'de_saude_municipal', nome: 'Saúde pública na cidade', texto: 'a cidade abriu postos de mães e bebês e tratou a água e o esgoto', derruba: [], institui: 'saude', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'a conta das obras', fonte: 'Os postos municipais de aconselhamento às mães (Säuglingsfürsorge, desde 1905); o efeito é aproximação [A].' }
  ],
  movimentos: [
    { id: 'de_mulheres_imperio', nome: 'O movimento das mulheres', causa: 'a universidade e o voto das mulheres', reformas: ['de_matricula_feminina', 'de_voto_feminino'], de: 1900, ate: 1919, risco: [[1900, 1908, 1], [1908, 1919, 0]], fonte: 'Bund Deutscher Frauenvereine (1894); até a Lei das Associações de 1908, mulheres não podiam entrar em partidos na Prússia.' },
    { id: 'de_mulheres_oeste', nome: 'O novo movimento das mulheres', causa: 'a igualdade no casamento e no trabalho', reformas: ['de_igualdade_58', 'de_reforma_casamento'], lado: 'oeste', de: 1949, ate: 1977, risco: [[1949, 1977, 0]], fonte: 'Elisabeth Selbert e o art. 3º(2) (1949); o movimento de 1968 em diante.' },
    { id: 'de_homossexuais', nome: 'O movimento homossexual', causa: 'o fim do § 175', reformas: ['de_reforma_175'], lado: 'oeste', de: 1949, ate: 1994, risco: [[1949, 1969, 2], [1969, 1994, 1]], fonte: 'Os processos pelo § 175 na República Federal (cerca de 50 mil condenações de 1949 a 1969); Homosexuelle Aktion Westberlin (1971).' }
  ],
  partidos: [
    // ------------------------------------------------------------ o Império e Weimar (todos proibidos ou dissolvidos em 1933)
    { id: 'DE_SPD', sigla: 'SPD', nome: 'Partido Social-Democrata', chamado: 'SPD', artigo: 'o', de: [1890, 10], certeza: 'documentado', proscrito: [PROIBIDOS_33], lado: 'oeste', linha: 'social-democrata, o partido dos sindicatos; proibido em 1933 e refundado em 1945' },
    { id: 'DE_ZENTRUM', sigla: 'Zentrum', nome: 'Partido do Centro', chamado: 'Zentrum', artigo: 'o', de: [1870, 12], ate: [1933, 7], como: 'extincao', certeza: 'documentado', linha: 'o partido dos católicos' },
    { id: 'DE_DKP_1876', sigla: 'DKP', nome: 'Partido Conservador Alemão', chamado: 'Conservadores', artigo: 'o', de: [1876, 6], ate: [1918, 11], vira: 'DE_DNVP', como: 'fusao', certeza: 'documentado', linha: 'conservador, dos proprietários rurais da Prússia' },
    { id: 'DE_NL', sigla: 'NL', nome: 'Partido Nacional-Liberal', chamado: 'Nacional-Liberais', artigo: 'o', de: [1867, 6], ate: [1918, 12], vira: 'DE_DVP', como: 'fusao', certeza: 'documentado', linha: 'liberal e nacionalista, da indústria' },
    { id: 'DE_FVP', sigla: 'FVP', nome: 'Partido Popular Progressista', chamado: 'Progressistas', artigo: 'o', de: [1910, 3], ate: [1918, 11], vira: 'DE_DDP', como: 'fusao', certeza: 'documentado', linha: 'liberal de esquerda' },
    { id: 'DE_DDP', sigla: 'DDP', nome: 'Partido Democrático Alemão', chamado: 'DDP', artigo: 'o', de: [1918, 11], ate: [1933, 6], como: 'extincao', certeza: 'documentado', linha: 'liberal e republicano, um dos pais da Constituição de Weimar' },
    { id: 'DE_DVP', sigla: 'DVP', nome: 'Partido Popular Alemão', chamado: 'DVP', artigo: 'o', de: [1918, 12], ate: [1933, 7], como: 'extincao', certeza: 'documentado', linha: 'liberal de direita, de Gustav Stresemann' },
    { id: 'DE_DNVP', sigla: 'DNVP', nome: 'Partido Nacional do Povo Alemão', chamado: 'DNVP', artigo: 'o', de: [1918, 11], ate: [1933, 7], como: 'extincao', certeza: 'documentado', linha: 'nacionalista e monarquista, contra a república' },
    { id: 'DE_USPD', sigla: 'USPD', nome: 'Partido Social-Democrata Independente', chamado: 'USPD', artigo: 'o', de: [1917, 4], ate: [1922, 9], vira: 'DE_SPD', como: 'fusao', certeza: 'documentado', linha: 'socialista, contra a guerra' },
    { id: 'DE_KPD', sigla: 'KPD', nome: 'Partido Comunista da Alemanha', chamado: 'KPD', artigo: 'o', de: [1919, 1], ate: [1956, 8], como: 'extincao', certeza: 'documentado', proscrito: [PROIBIDOS_33], lado: 'oeste', linha: 'comunista; proibido em 1933 e de novo, na República Federal, em 1956' },
    // ------------------------------------------------------------ a República Federal
    { id: 'DE_CDU', sigla: 'CDU', nome: 'União Democrata-Cristã', chamado: 'CDU', artigo: 'a', de: [1945, 6], certeza: 'documentado', lado: 'oeste', linha: 'democrata-cristã, de Adenauer: economia social de mercado e laço com o Ocidente' },
    { id: 'DE_CSU', sigla: 'CSU', nome: 'União Social-Cristã', chamado: 'CSU', artigo: 'a', de: [1945, 10], certeza: 'documentado', divisoes: ['BY'], linha: 'democrata-cristã e conservadora, só na Baviera' },
    { id: 'DE_FDP', sigla: 'FDP', nome: 'Partido Democrático Liberal', chamado: 'FDP', artigo: 'o', de: [1948, 12], certeza: 'documentado', lado: 'oeste', linha: 'liberal: o fiel da balança dos governos' },
    { id: 'DE_GRUENE', sigla: 'Grünen', nome: 'Os Verdes', chamado: 'Verdes', artigo: 'o', de: [1980, 1], certeza: 'documentado', lado: 'oeste', linha: 'ecologista e pacifista, nascido dos movimentos dos anos 1970' },
    { id: 'DE_LINKE', sigla: 'Linke', nome: 'A Esquerda', chamado: 'A Esquerda', artigo: 'a', de: [1990, 2], certeza: 'documentado', nomes: [{ ate: 2006, nome: 'Partido do Socialismo Democrático', chamado: 'PDS' }], linha: 'socialista democrático, herdeiro do partido do regime do leste' },
    { id: 'DE_AFD', sigla: 'AfD', nome: 'Alternativa para a Alemanha', chamado: 'AfD', artigo: 'a', de: [2013, 2], certeza: 'documentado', linha: 'nacionalista de direita, contra o euro e a imigração' },
    { id: 'DE_BSW', sigla: 'BSW', nome: 'Aliança Sahra Wagenknecht', chamado: 'BSW', artigo: 'a', de: [2024, 1], certeza: 'documentado', linha: 'de esquerda na economia e restritiva na imigração' },
    // ------------------------------------------------------------ a RDA (a Frente Nacional: lista única, sem disputa)
    { id: 'DE_SED', sigla: 'SED', nome: 'Partido Socialista Unificado', chamado: 'SED', artigo: 'o', de: [1946, 4], ate: [1990, 2], vira: 'DE_LINKE', como: 'nome', certeza: 'documentado', lado: 'leste', unico: [[1949, 1990]], linha: 'o partido do regime: a carreira dependia dele' },
    { id: 'DE_CDU_OST', sigla: 'CDU', nome: 'União Democrata-Cristã (RDA)', chamado: 'CDU do leste', artigo: 'a', de: [1945, 6], ate: [1990, 10], vira: 'DE_CDU', como: 'fusao', certeza: 'documentado', lado: 'leste', unico: [[1949, 1990]], linha: 'partido de bloco, aliado do SED na Frente Nacional' },
    { id: 'DE_LDPD', sigla: 'LDPD', nome: 'Partido Liberal-Democrático', chamado: 'LDPD', artigo: 'o', de: [1945, 7], ate: [1990, 8], vira: 'DE_FDP', como: 'fusao', certeza: 'documentado', lado: 'leste', unico: [[1949, 1990]], linha: 'partido de bloco, liberal no nome' },
    { id: 'DE_NDPD', sigla: 'NDPD', nome: 'Partido Nacional-Democrático', chamado: 'NDPD', artigo: 'o', de: [1948, 5], ate: [1990, 8], vira: 'DE_FDP', como: 'fusao', certeza: 'documentado', lado: 'leste', unico: [[1949, 1990]], linha: 'partido de bloco, para ex-militares e ex-membros do partido nazista' },
    { id: 'DE_DBD', sigla: 'DBD', nome: 'Partido Democrático Camponês', chamado: 'DBD', artigo: 'o', de: [1948, 4], ate: [1990, 9], vira: 'DE_CDU', como: 'fusao', certeza: 'documentado', lado: 'leste', unico: [[1949, 1990]], linha: 'partido de bloco do campo e das cooperativas' }
  ]
};
