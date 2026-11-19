/**
 * ERAS v4 · A SOCIEDADE DO JAPÃO (1900–2025): barreiras, reformas, movimentos e partidos.
 * [F] fato documentado · [A] aproximação de jogo. Pendente (não representado): a discriminação contra os burakumin e
 * contra os coreanos residentes — exigem pesquisa e um desenho próprio, não um modificador.
 */
import type { SociedadeDaEra } from '../../base/sociedade4';

export const SOCIEDADE_JP: SociedadeDaEra = {
  barreiras: [
    {
      id: 'jp_esposa_incapaz', quem: 'mulher_casada', natureza: 'lei', dominio: 'credito', de: 1900, ate: 1948, bloqueia: true, reforma: 'jp_codigo_civil',
      texto: 'Pelo Código Civil, a esposa não fazia contrato nem tomava empréstimo sem a permissão do marido: a lei a tratava como incapaz.',
      alternativa: 'O empréstimo podia sair no nome do marido ou do chefe da casa (o koshu).',
      fonte: 'Código Civil Meiji (1898), art. 14; revogado na reforma de 1947 (em vigor em 01/01/1948).', certeza: 'documentado'
    },
    {
      id: 'jp_universidade_mulher', quem: 'mulher', natureza: 'instituicao', dominio: 'estudo', de: 1900, ate: 1946, fator: 0.25,
      residuo: { fator: 0.7, anos: 30 }, reforma: 'jp_igualdade_constitucional',
      texto: 'As universidades imperiais quase não aceitavam mulheres; o caminho era uma escola profissional feminina (Tsuda, Universidade Feminina do Japão), sem o título de universidade.',
      alternativa: 'As escolas superiores femininas formavam professoras, médicas (a Escola de Medicina Feminina de Tóquio, 1900) e farmacêuticas.',
      fonte: 'A Universidade Imperial de Tōhoku admitiu três mulheres em 1913, uma exceção; a reforma de 1946–1947 abriu as universidades. Fator: aproximação [A].', certeza: 'documentado'
    },
    {
      id: 'jp_advocacia_mulher', quem: 'mulher', natureza: 'lei', dominio: 'trabalho', de: 1900, ate: 1936, bloqueia: true,
      alvo: { trilhas: ['direito'] }, reforma: 'jp_lei_advogados',
      texto: 'A lei dos advogados exigia ser "súdito do sexo masculino": a advocacia era fechada às mulheres.',
      fonte: 'Lei dos Advogados de 1893; reforma de 1933 (em vigor em 1936); as primeiras advogadas em 1940.', certeza: 'documentado'
    },
    {
      id: 'jp_judiciario_mulher', quem: 'mulher', natureza: 'lei', dominio: 'trabalho', de: 1900, ate: 1949, bloqueia: true,
      alvo: { trilhas: ['judiciario'] }, reforma: 'jp_igualdade_constitucional',
      texto: 'A magistratura não admitia mulheres.',
      fonte: 'A Constituição de 1947 (art. 14) abriu os cargos; a primeira juíza, Ishiwatari Matsuko, em 1949.', certeza: 'documentado'
    },
    {
      id: 'jp_carreira_mulher', quem: 'mulher', natureza: 'costume', dominio: 'trabalho', de: 1946, ate: 1986, fator: 0.45,
      alvo: { nivelMin: 3 }, residuo: { fator: 0.7, anos: 30 }, reforma: 'jp_igualdade_emprego',
      texto: 'As empresas contratavam mulheres para o escritório esperando que saíssem ao casar ("kotobuki taisha"): o posto de carreira ia para um homem.',
      alternativa: 'O serviço público e o magistério promoviam mulheres mais cedo do que as empresas.',
      fonte: 'Caso Sumitomo Cement (Tribunal Distrital de Tóquio, 1966: a demissão por casamento é ilegal); Lei de Igualdade de Oportunidades no Emprego (em vigor em 01/04/1986). Fator: aproximação [A].', certeza: 'aproximado'
    },
    {
      id: 'jp_salario_mulher', quem: 'mulher', natureza: 'costume', dominio: 'salario', de: 1900, ate: 1986, fator: 0.6,
      residuo: { fator: 0.75, anos: 40 }, reforma: 'jp_igualdade_emprego',
      texto: 'O salário de entrada da mulher era menor que o dos colegas homens — e a escala era outra.',
      fonte: 'Lei de Normas Trabalhistas de 1947, art. 4º (salário igual, pouco aplicada); Lei de Igualdade de Oportunidades no Emprego (1986). Fator: aproximação [A].', certeza: 'aproximado'
    }
  ],
  reformas: [
    { id: 'jp_sufragio_universal', nome: 'O voto para todos os homens', texto: 'todo homem de 25 anos passou a votar, sem exigência de imposto pago', derruba: ['jp_voto_censitario'], real: [1925, 5], desde: 1900, alcance: 'nacional', resistencia: 0.5, oposicao: 'a Câmara dos Pares e os burocratas do Ministério do Interior', acontecimentos: ['sufragio_homens'], fonte: 'Lei Eleitoral Geral de 05/05/1925.' },
    { id: 'jp_voto_feminino', nome: 'O voto das mulheres', texto: 'as mulheres passaram a votar e a ser votadas', derruba: ['jp_voto_mulher'], real: [1945, 12], desde: 1920, alcance: 'nacional', resistencia: 0.65, oposicao: 'a Câmara dos Pares, que derrubou o projeto de 1931', acontecimentos: ['voto_mulher'], fonte: 'Reforma da Lei Eleitoral, 17/12/1945; o projeto de voto feminino municipal aprovado pela Câmara Baixa em 1931 e derrubado pela Câmara dos Pares.' },
    { id: 'jp_lei_advogados', nome: 'A advocacia aberta às mulheres', texto: 'mulheres passaram a poder ser advogadas', derruba: ['jp_advocacia_mulher'], real: [1936, 4], desde: 1920, alcance: 'nacional', resistencia: 0.5, oposicao: 'as ordens de advogados', fonte: 'Reforma da Lei dos Advogados (1933, em vigor em 1936).' },
    { id: 'jp_codigo_civil', nome: 'O fim do sistema da casa (ie)', texto: 'a esposa deixou de precisar da permissão do marido, e o chefe da casa perdeu o poder sobre o casamento dos filhos', derruba: ['jp_esposa_incapaz', 'jp_ie'], real: [1948, 1], desde: 1920, alcance: 'nacional', resistencia: 0.7, oposicao: 'os juristas e políticos que viam a casa como base do Estado', fonte: 'Reforma do Código Civil (Lei 222/1947, em vigor em 01/01/1948).' },
    { id: 'jp_igualdade_constitucional', nome: 'A igualdade na lei', texto: 'a lei passou a proibir a discriminação pelo sexo nos cargos públicos e na educação', derruba: ['jp_judiciario_mulher', 'jp_universidade_mulher'], real: [1947, 5], desde: 1920, alcance: 'nacional', resistencia: 0.75, oposicao: 'a burocracia imperial e as forças armadas', fonte: 'Constituição do Japão (em vigor em 03/05/1947), arts. 14 e 24; Lei Fundamental da Educação (1947).' },
    { id: 'jp_igualdade_emprego', nome: 'A lei de igualdade no emprego', texto: 'as empresas passaram a ter de tratar homens e mulheres igualmente no recrutamento e na promoção', derruba: ['jp_carreira_mulher', 'jp_salario_mulher'], real: [1986, 4], desde: 1966, alcance: 'nacional', resistencia: 0.55, oposicao: 'a Keidanren e as grandes empresas', acontecimentos: ['igualdade_86'], fonte: 'Lei de Igualdade de Oportunidades no Emprego (1985, em vigor em 01/04/1986).' },
    { id: 'jp_escola_municipal', nome: 'Escola e merenda para todas as crianças da cidade', texto: 'a cidade abriu escolas e deu merenda, e as crianças pobres deixaram as fábricas', derruba: ['jp_trabalho_infantil'], institui: 'escola', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'os donos das tecelagens', fonte: 'Lei das Fábricas de 1911 (em vigor em 1916); o efeito local é aproximação [A].' },
    { id: 'jp_saude_municipal', nome: 'Água tratada e posto de saúde', texto: 'a cidade tratou a água e abriu postos de saúde com vacinação contra a tuberculose', derruba: [], institui: 'saude', desde: 1900, alcance: 'municipal', resistencia: 0.3, oposicao: 'a conta das obras', fonte: 'Lei dos Centros de Saúde (1937); o efeito é aproximação [A].' }
  ],
  movimentos: [
    { id: 'jp_sufragistas', nome: 'O movimento pelo voto das mulheres', causa: 'o voto e os direitos políticos das mulheres', reformas: ['jp_voto_feminino', 'jp_lei_advogados'], de: 1920, ate: 1945, risco: [[1920, 1925, 1], [1925, 1945, 2]], fonte: 'Shin Fujin Kyōkai (Associação da Nova Mulher, 1920); Liga pelo Sufrágio Feminino (Ichikawa Fusae, 1924). O art. 5º da Lei de Polícia (1900) proibia mulheres em reuniões políticas até 1922.' },
    { id: 'jp_operario', nome: 'O movimento operário e o sufrágio universal', causa: 'o voto para todos e o direito de organizar sindicatos', reformas: ['jp_sufragio_universal'], de: 1912, ate: 1940, risco: [[1912, 1925, 1], [1925, 1940, 2]], fonte: 'Yūaikai (1912); Sōdōmei (1921); a Lei de Preservação da Paz (1925).' },
    { id: 'jp_mulheres_trabalho', nome: 'O movimento pela igualdade no emprego', causa: 'o fim da demissão por casamento e da carreira só para homens', reformas: ['jp_igualdade_emprego'], de: 1966, ate: 1986, risco: [[1966, 1986, 0]], fonte: 'Os processos contra a aposentadoria por casamento (Sumitomo Cement, 1966); o movimento pela lei de igualdade (anos 1970–1980).' }
  ],
  partidos: [
    { id: 'JP_SEIYUKAI', sigla: 'Seiyūkai', nome: 'Rikken Seiyūkai', chamado: 'Seiyūkai', artigo: 'o', de: [1900, 9], ate: [1940, 7], como: 'extincao', certeza: 'documentado', linha: 'o grande partido conservador de Itō Hirobumi: os proprietários rurais e as obras' },
    { id: 'JP_MINSEITO', sigla: 'Minseitō', nome: 'Rikken Minseitō', chamado: 'Minseitō', artigo: 'o', de: [1916, 10], ate: [1940, 8], como: 'extincao', certeza: 'documentado', nomes: [{ ate: 1926, nome: 'Kenseikai', chamado: 'Kenseikai' }], linha: 'o rival liberal do Seiyūkai: as cidades, o comércio, o sufrágio universal masculino' },
    { id: 'JP_SHAKAI', sigla: 'Shakai Taishūtō', nome: 'Shakai Taishūtō', chamado: 'Partido Socialista das Massas', artigo: 'o', de: [1932, 7], ate: [1940, 7], como: 'extincao', certeza: 'documentado', linha: 'social-democrata, ligado aos sindicatos' },
    { id: 'JP_JCP', sigla: 'JCP', nome: 'Partido Comunista do Japão', chamado: 'Partido Comunista', artigo: 'o', de: [1922, 7], certeza: 'documentado', proscrito: [[1922, 1946]], linha: 'comunista; clandestino e perseguido até 1945' },
    { id: 'JP_LIBERAL', sigla: 'Jiyūtō', nome: 'Partido Liberal', chamado: 'Partido Liberal', artigo: 'o', de: [1945, 11], ate: [1955, 11], vira: 'JP_LDP', como: 'fusao', certeza: 'aproximado', linha: 'conservador, de Yoshida Shigeru: aliança com os EUA e reconstrução' },
    { id: 'JP_DEMOCRATA', sigla: 'Minshutō', nome: 'Partido Democrata do Japão (1954)', chamado: 'Partido Democrata', artigo: 'o', de: [1945, 11], ate: [1955, 11], vira: 'JP_LDP', como: 'fusao', certeza: 'aproximado', nomes: [{ ate: 1953, nome: 'Partido Progressista', chamado: 'Partido Progressista' }], linha: 'conservador, rival dos liberais (Hatoyama Ichirō)' },
    { id: 'JP_LDP', sigla: 'PLD', nome: 'Partido Liberal Democrata', chamado: 'PLD', artigo: 'o', de: [1955, 11], certeza: 'documentado', linha: 'conservador, no governo quase sem interrupção desde 1955' },
    { id: 'JP_JSP', sigla: 'PSJ', nome: 'Partido Socialista do Japão', chamado: 'Partido Socialista', artigo: 'o', de: [1945, 11], ate: [1996, 1], vira: 'JP_SDP', como: 'nome', certeza: 'documentado', linha: 'socialista, a grande oposição, contra o rearmamento' },
    { id: 'JP_SDP', sigla: 'PSD', nome: 'Partido Social-Democrata', chamado: 'Partido Social-Democrata', artigo: 'o', de: [1996, 1], certeza: 'documentado', linha: 'social-democrata, herdeiro do Partido Socialista' },
    { id: 'JP_DSP', sigla: 'PDS', nome: 'Partido Socialista Democrático', chamado: 'Partido Socialista Democrático', artigo: 'o', de: [1960, 1], ate: [1994, 12], como: 'fusao', certeza: 'documentado', linha: 'social-democrata moderado, ligado aos sindicatos do setor privado' },
    { id: 'JP_KOMEITO', sigla: 'Kōmeitō', nome: 'Kōmeitō', chamado: 'Kōmeitō', artigo: 'o', de: [1964, 11], certeza: 'aproximado', linha: 'de centro, ligado à Sōka Gakkai' },
    { id: 'JP_DPJ', sigla: 'PDJ', nome: 'Partido Democrático do Japão', chamado: 'Partido Democrático', artigo: 'o', de: [1998, 4], ate: [2016, 3], como: 'fusao', certeza: 'documentado', linha: 'de centro, a alternativa de governo ao PLD (2009–2012)' },
    { id: 'JP_CDP', sigla: 'PCD', nome: 'Partido Constitucional Democrático', chamado: 'Partido Constitucional Democrático', artigo: 'o', de: [2017, 10], certeza: 'documentado', linha: 'de centro-esquerda, a maior oposição' }
  ]
};
