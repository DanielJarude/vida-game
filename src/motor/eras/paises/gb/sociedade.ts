/**
 * ERAS v4 · A SOCIEDADE DO REINO UNIDO (1900–2025): barreiras, reformas, movimentos e partidos.
 * [F] fato documentado · [A] aproximação de jogo. Divisões: ENG, SCT, WLS, NIR.
 */
import type { SociedadeDaEra } from '../../base/sociedade4';

export const SOCIEDADE_GB: SociedadeDaEra = {
  barreiras: [
    {
      id: 'gb_profissoes_mulher', quem: 'mulher', natureza: 'lei', dominio: 'trabalho', de: 1900, ate: 1920, bloqueia: true,
      alvo: { trilhas: ['direito', 'judiciario', 'contabil'] }, reforma: 'gb_desqualificacao_sexo',
      texto: 'A advocacia, a magistratura e as associações de contadores não admitiam mulheres: a lei as tratava como "não pessoas" para essas profissões.',
      alternativa: 'O magistério, a enfermagem e o trabalho de escritório estavam abertos.',
      fonte: 'Bebb v. Law Society (1913); Sex Disqualification (Removal) Act, 23/12/1919 (as primeiras solicitors em 1922).', certeza: 'documentado'
    },
    {
      id: 'gb_marriage_bar_servico', quem: 'mulher_casada', natureza: 'instituicao', dominio: 'trabalho', de: 1900, ate: 1946, bloqueia: true,
      alvo: { concurso: true }, residuo: { fator: 0.75, anos: 20 }, reforma: 'gb_fim_marriage_bar',
      texto: 'No serviço público, a mulher que se casava tinha de pedir demissão — e a casada não era admitida.',
      fonte: 'A "marriage bar" do Home Civil Service, abolida em outubro de 1946 (no serviço diplomático, só em 1973).', certeza: 'documentado'
    },
    {
      id: 'gb_marriage_bar_ensino', quem: 'mulher_casada', natureza: 'instituicao', dominio: 'trabalho', de: 1900, ate: 1945, fator: 0.3,
      alvo: { setores: ['educacao'] }, reforma: 'gb_fim_marriage_bar',
      texto: 'A maioria das autoridades de educação não contratava professora casada (Londres a exigiu de 1923 a 1935).',
      fonte: 'Education Act 1944, seção 24(3): nenhuma mulher seria desqualificada por casar.', certeza: 'documentado'
    },
    {
      id: 'gb_salario_mulher', quem: 'mulher', natureza: 'costume', dominio: 'salario', de: 1900, ate: 1976, fator: 0.65,
      residuo: { fator: 0.85, anos: 35 }, reforma: 'gb_salario_igual',
      texto: 'Os acordos salariais tinham uma "taxa feminina": pelo mesmo trabalho, o salário da mulher era menor.',
      fonte: 'Equal Pay Act 1970 (em vigor em 29/12/1975); a greve das costureiras da Ford em Dagenham (1968). Fator: aproximação [A].', certeza: 'documentado'
    },
    {
      id: 'gb_cor_trabalho', quem: 'negro', natureza: 'costume', dominio: 'trabalho', de: 1948, ate: 1969, fator: 0.5,
      residuo: { fator: 0.75, anos: 30 }, reforma: 'gb_relacoes_raciais',
      texto: 'Recusar alguém pela cor era legal: a empresa de ônibus de Bristol não contratava motoristas negros, e não era a única.',
      fonte: 'O boicote aos ônibus de Bristol (1963); Race Relations Act 1965 (lugares públicos) e 1968 (emprego e moradia, em vigor em 26/11/1968). Fator: aproximação [A].', certeza: 'documentado'
    },
    {
      id: 'gb_universidade_mulher', quem: 'mulher', natureza: 'instituicao', dominio: 'estudo', de: 1900, ate: 1920, fator: 0.8,
      residuo: { fator: 0.9, anos: 28 }, reforma: 'gb_graus_mulheres',
      texto: 'Oxford e Cambridge deixavam a mulher estudar, mas não lhe davam o diploma nem a condição de membro da universidade.',
      fonte: 'Oxford concedeu graus às mulheres em 07/10/1920; Cambridge, só em 1948. Londres dava graus desde 1878.', certeza: 'documentado'
    },
    {
      id: 'gb_credito_mulher', quem: 'mulher', natureza: 'instituicao', dominio: 'credito', de: 1900, ate: 1976, bloqueia: true, reforma: 'gb_discriminacao_sexo',
      texto: 'Banco e financeira pediam um homem como fiador — o marido ou o pai — para dar crédito a uma mulher.',
      alternativa: 'Com a assinatura de um homem da família, o crédito saía.',
      fonte: 'Sex Discrimination Act 1975 (em vigor em 29/12/1975), que proibiu a discriminação no crédito.', certeza: 'documentado'
    },
    {
      id: 'gb_servico_gay', quem: 'mesmo_genero', natureza: 'lei', dominio: 'trabalho', de: 1900, ate: 1968, bloqueia: true, divisoes: ['ENG', 'WLS'],
      alvo: { concurso: true }, residuo: { fator: 0.7, anos: 30 }, reforma: 'gb_descriminalizacao',
      texto: 'A relação entre homens era crime: descoberta, custava o cargo público — e podia levar à prisão.',
      fonte: 'Criminal Law Amendment Act 1885; Sexual Offences Act 1967 (Inglaterra e País de Gales, 27/07/1967). Escócia: 1981; Irlanda do Norte: 1982.', certeza: 'documentado'
    },
    {
      id: 'gb_servico_gay_sct', quem: 'mesmo_genero', natureza: 'lei', dominio: 'trabalho', de: 1900, ate: 1981, bloqueia: true, divisoes: ['SCT', 'NIR'],
      alvo: { concurso: true }, residuo: { fator: 0.7, anos: 25 }, reforma: 'gb_descriminalizacao',
      texto: 'A relação entre homens continuava crime aqui, depois de 1967: descoberta, custava o cargo público.',
      fonte: 'Criminal Justice (Scotland) Act 1980 (em vigor em 01/02/1981); Homosexual Offences (Northern Ireland) Order 1982.', certeza: 'documentado'
    }
  ],
  reformas: [
    { id: 'gb_voto_mulheres', nome: 'O voto igual das mulheres', texto: 'as mulheres passaram a votar nas mesmas condições dos homens', derruba: ['gb_sem_voto', 'gb_voto_30'], real: [1928, 7], desde: 1900, alcance: 'nacional', resistencia: 0.55, oposicao: 'a maioria conservadora e a Liga Nacional contra o Sufrágio Feminino', acontecimentos: ['voto_1918', 'voto_igual'], fonte: 'Representation of the People Act 1918 (mais de 30 anos, com propriedade); Equal Franchise Act, 02/07/1928.' },
    { id: 'gb_desqualificacao_sexo', nome: 'A abertura das profissões às mulheres', texto: 'nenhuma mulher podia mais ser impedida de uma profissão ou de um cargo público por ser mulher', derruba: ['gb_profissoes_mulher'], real: [1919, 12], desde: 1900, alcance: 'nacional', resistencia: 0.45, oposicao: 'as ordens profissionais', fonte: 'Sex Disqualification (Removal) Act, 23/12/1919.' },
    { id: 'gb_graus_mulheres', nome: 'Os diplomas das mulheres', texto: 'as universidades passaram a dar às mulheres os mesmos graus dos homens', derruba: ['gb_universidade_mulher'], real: [1920, 10], desde: 1900, alcance: 'nacional', resistencia: 0.4, oposicao: 'os colegiados das universidades antigas', fonte: 'Oxford, 07/10/1920; Cambridge, 1948.' },
    { id: 'gb_fim_marriage_bar', nome: 'O fim da barreira do casamento', texto: 'a mulher casada deixou de ser demitida ou recusada no serviço público e nas escolas', derruba: ['gb_marriage_bar_servico', 'gb_marriage_bar_ensino', 'gb_marriage_bar'], real: [1946, 10], desde: 1920, alcance: 'nacional', resistencia: 0.5, oposicao: 'os sindicatos de servidores homens e o Tesouro', fonte: 'Education Act 1944; Home Civil Service, outubro de 1946.' },
    { id: 'gb_salario_igual', nome: 'Salário igual', texto: 'a "taxa feminina" foi proibida: mesmo trabalho, mesmo salário', derruba: ['gb_salario_mulher'], real: [1975, 12], desde: 1945, alcance: 'nacional', resistencia: 0.5, oposicao: 'as associações patronais', acontecimentos: ['igualdade_75'], fonte: 'Equal Pay Act 1970, em vigor em 29/12/1975.' },
    { id: 'gb_discriminacao_sexo', nome: 'A lei contra a discriminação por sexo', texto: 'discriminar pelo sexo no emprego, na educação e no crédito passou a ser proibido', derruba: ['gb_credito_mulher'], real: [1975, 12], desde: 1960, alcance: 'nacional', resistencia: 0.4, oposicao: 'parte dos bancos e das empresas', acontecimentos: ['igualdade_75'], fonte: 'Sex Discrimination Act 1975.' },
    { id: 'gb_relacoes_raciais', nome: 'A lei de relações raciais', texto: 'recusar emprego ou moradia pela cor passou a ser proibido', derruba: ['gb_cor_trabalho', 'gb_barreira_cor'], real: [1968, 11], desde: 1950, alcance: 'nacional', resistencia: 0.6, oposicao: 'boa parte do eleitorado e dos deputados (o discurso dos "rios de sangue", abril de 1968)', fonte: 'Race Relations Act 1965 e 1968.' },
    { id: 'gb_descriminalizacao', nome: 'A descriminalização entre homens', texto: 'a relação entre homens adultos deixou de ser crime', derruba: ['gb_servico_gay', 'gb_servico_gay_sct', 'gb_crime_eng'], real: [1967, 7], desde: 1957, alcance: 'nacional', resistencia: 0.65, oposicao: 'a maioria dos deputados e das igrejas, até o Relatório Wolfenden (1957)', acontecimentos: ['lei_1967'], fonte: 'Sexual Offences Act 1967.' },
    { id: 'gb_escola_municipal', nome: 'Escola secundária gratuita na cidade', texto: 'a autoridade local abriu escolas secundárias gratuitas e bolsas para quem não podia pagar', derruba: ['gb_trabalho_infantil'], institui: 'escola', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'os contribuintes do imposto local', fonte: 'Education Act 1902 (escolas secundárias das autoridades locais) e Education Act 1944 (secundário gratuito para todos); o efeito local é aproximação [A].' },
    { id: 'gb_saude_municipal', nome: 'Saúde pública na cidade', texto: 'a cidade abriu clínicas de mães e bebês, tratou a água e demoliu os cortiços', derruba: [], institui: 'saude', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'os donos dos cortiços e os contribuintes', fonte: 'As clínicas de bem-estar infantil das autoridades locais (Maternity and Child Welfare Act 1918); o efeito é aproximação [A].' }
  ],
  movimentos: [
    { id: 'gb_sufragistas', nome: 'O movimento sufragista', causa: 'o voto das mulheres', reformas: ['gb_voto_mulheres', 'gb_desqualificacao_sexo', 'gb_graus_mulheres'], de: 1900, ate: 1928, risco: [[1900, 1903, 1], [1903, 1914, 2], [1914, 1928, 1]], fonte: 'NUWSS (1897); WSPU (1903): prisões e alimentação forçada (1909–1914).' },
    { id: 'gb_mulheres', nome: 'O movimento das mulheres', causa: 'salário igual e o fim da discriminação', reformas: ['gb_fim_marriage_bar', 'gb_salario_igual', 'gb_discriminacao_sexo'], de: 1940, ate: 1976, risco: [[1940, 1976, 0]], fonte: 'Equal Pay Campaign Committee (1944); as costureiras de Dagenham (1968); Women\'s Liberation Movement (1970).' },
    { id: 'gb_antirracismo', nome: 'O movimento antirracista', causa: 'o fim da barreira de cor no emprego e na moradia', reformas: ['gb_relacoes_raciais'], de: 1948, ate: 1976, risco: [[1948, 1976, 1]], fonte: 'Bristol Bus Boycott (1963); Campaign Against Racial Discrimination (1964).' },
    { id: 'gb_reforma_homossexual', nome: 'A campanha pela reforma da lei', causa: 'que a relação entre homens deixasse de ser crime', reformas: ['gb_descriminalizacao'], de: 1957, ate: 1981, risco: [[1957, 1967, 2], [1967, 1981, 1]], fonte: 'Homosexual Law Reform Society (1958); Scottish Minorities Group (1969).' }
  ],
  partidos: [
    { id: 'GB_CON', sigla: 'Con', nome: 'Partido Conservador', chamado: 'Partido Conservador', artigo: 'o', de: [1834, 1], certeza: 'documentado', linha: 'conservador e unionista: a Coroa, o Império, a propriedade e, desde os anos 1980, o mercado' },
    { id: 'GB_LIB', sigla: 'Lib', nome: 'Partido Liberal', chamado: 'Partido Liberal', artigo: 'o', de: [1859, 6], ate: [1988, 3], vira: 'GB_LD', como: 'fusao', certeza: 'documentado', linha: 'liberal: livre comércio, reforma social de 1906–1914; depois de 1920, um partido menor' },
    { id: 'GB_LAB', sigla: 'Lab', nome: 'Partido Trabalhista', chamado: 'Partido Trabalhista', artigo: 'o', de: [1900, 2], certeza: 'documentado', nomes: [{ ate: 1905, nome: 'Comitê de Representação Trabalhista', chamado: 'Comitê Trabalhista' }], linha: 'trabalhista, nascido dos sindicatos: o NHS e as nacionalizações de 1945' },
    { id: 'GB_CPGB', sigla: 'CPGB', nome: 'Partido Comunista da Grã-Bretanha', chamado: 'Partido Comunista', artigo: 'o', de: [1920, 7], ate: [1991, 11], como: 'extincao', certeza: 'documentado', linha: 'comunista, forte em alguns sindicatos e quase sem votos' },
    { id: 'GB_SDP', sigla: 'SDP', nome: 'Partido Social-Democrata', chamado: 'SDP', artigo: 'o', de: [1981, 3], ate: [1988, 3], vira: 'GB_LD', como: 'fusao', certeza: 'documentado', linha: 'social-democrata, de trabalhistas que deixaram o partido' },
    { id: 'GB_LD', sigla: 'LD', nome: 'Liberal Democratas', chamado: 'Liberal Democratas', artigo: 'o', de: [1988, 3], certeza: 'documentado', linha: 'liberal e social-democrata, pró-europeu' },
    { id: 'GB_SNP', sigla: 'SNP', nome: 'Partido Nacional Escocês', chamado: 'SNP', artigo: 'o', de: [1934, 4], certeza: 'documentado', divisoes: ['SCT'], linha: 'nacionalista escocês: a independência da Escócia' },
    { id: 'GB_PC', sigla: 'PC', nome: 'Plaid Cymru', chamado: 'Plaid Cymru', artigo: 'o', de: [1925, 8], certeza: 'documentado', divisoes: ['WLS'], linha: 'nacionalista galês: a língua e a autonomia do País de Gales' },
    { id: 'GB_UUP', sigla: 'UUP', nome: 'Partido Unionista do Ulster', chamado: 'UUP', artigo: 'o', de: [1905, 3], certeza: 'aproximado', divisoes: ['NIR'], linha: 'unionista: a Irlanda do Norte no Reino Unido' },
    { id: 'GB_SF', sigla: 'SF', nome: 'Sinn Féin', chamado: 'Sinn Féin', artigo: 'o', de: [1905, 11], certeza: 'aproximado', divisoes: ['NIR'], linha: 'republicano irlandês: a reunificação da Irlanda' },
    { id: 'GB_SDLP', sigla: 'SDLP', nome: 'Partido Social-Democrata e Trabalhista', chamado: 'SDLP', artigo: 'o', de: [1970, 8], certeza: 'documentado', divisoes: ['NIR'], linha: 'nacionalista irlandês moderado, pelos direitos civis' },
    { id: 'GB_DUP', sigla: 'DUP', nome: 'Partido Unionista Democrático', chamado: 'DUP', artigo: 'o', de: [1971, 9], certeza: 'documentado', divisoes: ['NIR'], linha: 'unionista e protestante conservador' },
    { id: 'GB_GREEN', sigla: 'Green', nome: 'Partido Verde', chamado: 'Partido Verde', artigo: 'o', de: [1985, 9], certeza: 'aproximado', linha: 'ecologista (nascido do PEOPLE, de 1973)' },
    { id: 'GB_UKIP', sigla: 'UKIP', nome: 'Partido da Independência do Reino Unido', chamado: 'UKIP', artigo: 'o', de: [1993, 9], certeza: 'documentado', linha: 'pela saída da União Europeia' },
    { id: 'GB_REFORM', sigla: 'Reform', nome: 'Reform UK', chamado: 'Reform UK', artigo: 'o', de: [2019, 1], certeza: 'aproximado', nomes: [{ ate: 2020, nome: 'Partido do Brexit', chamado: 'Partido do Brexit' }], linha: 'pela saída da União Europeia e contra a imigração' }
  ]
};
