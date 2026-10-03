/**
 * ÁSIA — Japão, China, Índia e Coreia do Sul.
 *
 * Quatro países que mudam a vida por instituições muito diferentes: o Japão
 * do emprego efetivo e da pensão em dois andares; a China dos congressos
 * populares, do gaokao e do registro de domicílio; a Índia federal, das
 * leis pessoais de herança, das reservas de vagas e do trabalho informal; a
 * Coreia do Suneung, do serviço militar obrigatório e do "toejikgeum".
 * Fontes e abstrações: `docs/notas/FONTES-PAISES-ASIA.md`.
 *
 * NOMES — convenções de escrita: pinyin sem tons (China), Hepburn sem
 * mácrons como nos passaportes e na imprensa (Japão: "Yuto", "Shohei"),
 * Romanização Revista com hífen entre as sílabas do prenome (Coreia:
 * "Min-jun"); os SOBRENOMES coreanos seguem a grafia consagrada (Kim, Lee,
 * Park), que é a dos passaportes, e não a RR estrita (Gim, I, Bak). Nos três
 * países do Leste Asiático a família vem antes no uso local; aqui o motor
 * compõe nome + sobrenome como em qualquer perfil.
 *
 * PESOS DE SOBRENOME — o motor sorteia da lista de modo uniforme; onde a
 * concentração real é enorme (Kim/Lee/Park na Coreia; Wang/Li/Zhang na
 * China), os mais comuns aparecem repetidos (`rep`) para chegar perto da
 * frequência de recenseamento sem fingir precisão.
 */

import type { PerfilDePais } from '../tipos';

/** Repete um sobrenome n vezes (peso no sorteio uniforme). */
const rep = (nome: string, n: number): string[] => Array.from({ length: n }, () => nome);

/* =============================================================== JAPÃO */

/*
 * SUCESSÃO — JAPÃO (Código Civil, Livro V, Lei 89/1896, reformado em 2018):
 *  - ordem: o cônjuge é sempre herdeiro (art. 890) e concorre com os filhos
 *    (1ª ordem, art. 887), na falta deles com os ascendentes (2ª, art. 889
 *    §1 I) e, na falta destes, com os irmãos (3ª, art. 889 §1 II);
 *  - quotas legais (art. 900): cônjuge 1/2 com filhos; 2/3 com ascendentes;
 *    3/4 com irmãos;
 *  - "iryubun" (reserva, arts. 1042 e ss.): metade do patrimônio fica
 *    reservada a cônjuge, descendentes e ascendentes (um terço se só houver
 *    ascendentes); irmãos não têm reserva;
 *  - representação dos netos (art. 887 §2);
 *  - sem herdeiros, depois de eventual partilha a pessoas de "relação
 *    especial" (art. 958-2), o resto vai ao Tesouro nacional (art. 959);
 *  - regime de bens: separação (art. 762) — não há meação na morte.
 * SIMPLIFICAÇÕES DECLARADAS: a quota fixa de 1/2 do cônjuge com os filhos
 * vira "concorre com os descendentes"; com os ascendentes o cônjuge leva 2/3
 * qualquer que seja o número de pais vivos; a reserva de 1/3 só de
 * ascendentes não é aplicada. Imposto sobre herança (sozokuzei, 10% a 55%)
 * com isenção básica de 30 milhões de ienes + 6 milhões por herdeiro: só
 * ~10% dos óbitos pagam; custo médio de 3%.
 */

const JP_MASC_ANTIGA = ['Hiroshi', 'Takashi', 'Makoto', 'Minoru', 'Shigeru', 'Isamu', 'Osamu', 'Kiyoshi', 'Susumu', 'Tadashi', 'Yoshio', 'Akira', 'Kazuo', 'Satoshi', 'Toshio', 'Hideo', 'Masao', 'Shoji', 'Yutaka', 'Mamoru',
  'Tsutomu', 'Noboru', 'Hiroyuki', 'Kenji', 'Koji', 'Takeshi', 'Masaru', 'Katsumi', 'Tetsuya', 'Nobuo', 'Yasuo', 'Haruo', 'Shinichi', 'Kenichi', 'Masahiro', 'Kazuhiko', 'Toshiyuki', 'Yoshihiro', 'Mitsuru', 'Tamotsu',
  'Teruo', 'Ichiro', 'Saburo', 'Jiro', 'Hajime', 'Fumio', 'Kunio', 'Tatsuo'];
const JP_FEM_ANTIGA = ['Kazuko', 'Yoko', 'Keiko', 'Sachiko', 'Michiko', 'Hiroko', 'Kyoko', 'Akiko', 'Yoshiko', 'Fumiko', 'Etsuko', 'Masako', 'Noriko', 'Junko', 'Mayumi', 'Emiko', 'Tomoko', 'Naoko', 'Reiko', 'Hisako',
  'Setsuko', 'Toshiko', 'Chieko', 'Yumiko', 'Kumiko', 'Nobuko', 'Mieko', 'Teruko', 'Fusako', 'Takako', 'Haruko', 'Eiko', 'Kimiko', 'Mitsuko', 'Yasuko', 'Sumiko', 'Masae', 'Hideko', 'Shizuko', 'Ritsuko',
  'Miyoko', 'Kiyoko', 'Hatsue', 'Fujiko'];
const JP_MASC_MEIO = ['Daisuke', 'Takuya', 'Naoki', 'Kenta', 'Tsubasa', 'Shota', 'Sho', 'Tomoya', 'Yusuke', 'Kazuya', 'Tatsuya', 'Takumi', 'Kosuke', 'Ryota', 'Yuta', 'Daiki', 'Shun', 'Takahiro', 'Masaki', 'Hiroki',
  'Yuki', 'Shinya', 'Kohei', 'Ryosuke', 'Keisuke', 'Shunsuke', 'Naoya', 'Yuya', 'Tomohiro', 'Hayato', 'Jun', 'Yohei', 'Shohei', 'Atsushi', 'Akihiro', 'Masato', 'Shingo', 'Toru', 'Yoshiki', 'Ryo',
  'Yuji', 'Kenichiro', 'Takuma', 'Shogo', 'Kazuki', 'Yudai'];
const JP_FEM_MEIO = ['Yuko', 'Tomomi', 'Megumi', 'Ai', 'Mai', 'Yuka', 'Kaori', 'Sayaka', 'Erika', 'Naomi', 'Asuka', 'Misaki', 'Haruka', 'Ayaka', 'Nanami', 'Yui', 'Aya', 'Saki', 'Mika', 'Emi',
  'Kana', 'Miho', 'Rie', 'Yumi', 'Natsumi', 'Shiori', 'Eri', 'Chihiro', 'Risa', 'Kumi', 'Yukari', 'Akane', 'Nozomi', 'Mami', 'Asami', 'Midori', 'Satomi', 'Moe', 'Hitomi', 'Ayumi',
  'Manami', 'Mizuki', 'Yuri', 'Momoko'];
const JP_MASC_NOVA = ['Haruto', 'Ren', 'Minato', 'Sota', 'Yuto', 'Riku', 'Aoi', 'Itsuki', 'Hinata', 'Yamato', 'Asahi', 'Hiroto', 'Sora', 'Kaito', 'Haruki', 'Yuma', 'Kosei', 'Haru', 'Ritsu', 'Arata',
  'Rui', 'Taiga', 'Kanata', 'Ryusei', 'Akito', 'Kota', 'Yuito', 'Nagi', 'Toma', 'Soma', 'Hayate', 'Rento', 'Tomoki', 'Yusei', 'Koki', 'Haruma', 'Takeru', 'Shion', 'Mio', 'Eita',
  'Shota', 'Daiki', 'Kenta', 'Hayato', 'Sosuke', 'Ao'];
const JP_FEM_NOVA = ['Himari', 'Tsumugi', 'Mei', 'Mio', 'Yui', 'Sakura', 'Rin', 'Hina', 'Akari', 'Yuna', 'Ema', 'Aoi', 'Hana', 'Riko', 'Sara', 'Mitsuki', 'Koharu', 'Saki', 'Nanami', 'Misaki',
  'Yuina', 'Ichika', 'Kanna', 'Miyu', 'Honoka', 'Ayane', 'Rio', 'Mana', 'Haruka', 'Shiori', 'Kaede', 'Mahiro', 'Ayaka', 'Yuzuki', 'Hiyori', 'Kokona', 'Momoka', 'Natsuki', 'Nao', 'Kokoro',
  'Suzu', 'Uta', 'Mina', 'Hinata', 'Mai', 'Yua'];

export const JAPAO: PerfilDePais = {
  id: 'JP',
  gentilico: ['japonês', 'japonesa'],
  idiomas: ['japonês'],
  divisao: {
    tipo: ['província', 'províncias'],
    // As 47 "todofuken" (ISO 3166-2:JP, códigos numéricos). Salário: MHLW,
    // Basic Survey on Wage Structure 2024 (Tóquio ~1,22× a média; Okinawa ~0,82×;
    // Hokkaido ~0,89×); custo: aluguel muito acima em Tóquio (Statistics Bureau,
    // Retail Price Survey). Teto modesto, como pede o motor.
    lista: [
      { codigo: '13', nome: 'Tóquio', custo: 1.25, salario: 1.22 },
      { codigo: '14', nome: 'Kanagawa', custo: 1.1, salario: 1.07 },
      { codigo: '11', nome: 'Saitama', custo: 1.03, salario: 0.98 },
      { codigo: '27', nome: 'Osaka', custo: 1.05, salario: 1.07 },
      { codigo: '28', nome: 'Hyogo', custo: 1.0, salario: 1.0 },
      { codigo: '26', nome: 'Kyoto', custo: 1.02, salario: 1.0 },
      { codigo: '23', nome: 'Aichi', custo: 1.0, salario: 1.03 },
      { codigo: '22', nome: 'Shizuoka', custo: 0.95, salario: 0.95 },
      { codigo: '08', nome: 'Ibaraki', custo: 0.93, salario: 0.96 },
      { codigo: '01', nome: 'Hokkaido', custo: 0.93, salario: 0.89 },
      { codigo: '34', nome: 'Hiroshima', custo: 0.95, salario: 0.95 },
      { codigo: '40', nome: 'Fukuoka', custo: 0.93, salario: 0.92 },
      { codigo: '47', nome: 'Okinawa', custo: 0.9, salario: 0.82 }
    ]
  },
  cidades: [
    ['Tóquio', '13', 'metropole', 'capital|sede|litoral'],
    ['Yokohama', '14', 'metropolitana', 'sede|litoral|metro:Tóquio'],
    ['Saitama', '11', 'metropolitana', 'sede|metro:Tóquio'],
    ['Osaka', '27', 'metropole', 'sede|litoral'],
    ['Kobe', '28', 'metropolitana', 'sede|litoral|metro:Osaka'],
    ['Kyoto', '26', 'capital', 'sede'],
    ['Nagoya', '23', 'metropole', 'sede|litoral'],
    ['Sapporo', '01', 'capital', 'sede'],
    ['Hiroshima', '34', 'capital', 'sede|litoral'],
    ['Fukuoka', '40', 'capital', 'sede|litoral'],
    ['Kitakyushu', '40', 'polo', 'litoral'],
    ['Iwata', '22', 'polo', 'litoral'],
    ['Naha', '47', 'capital', 'sede|litoral'],
    ['Kashima', '08', 'pequena', 'litoral']
  ],
  economia: {
    // Pobreza relativa de 15,4% (MHLW, Comprehensive Survey of Living Conditions
    // 2022, renda de 2021) e Gini ~0,33 (OCDE): uma base vulnerável menor que a
    // brasileira e um miolo de classe média largo.
    classes: { vulneravel: 10, trabalhadora: 26, media_baixa: 29, media: 25, alta: 10 },
    // Moradia: aluguel caro em Tóquio, mas oferta abundante e preço estável no
    // resto do país — pouco acima da relação brasileira.
    moradia: 1.1,
    // Média nacional ponderada do salário mínimo por hora, ano fiscal 2025:
    // ¥1.121 (MHLW). Mensal: ×173,3 h (40 h × 52 semanas ÷ 12) ≈ ¥194.300.
    // O mínimo é fixado por província (¥1.023 a ¥1.226).
    salarioMinimo: 194300,
    // ILO, Women and Men in the Informal Economy (2018): 18,7%.
    informalidade: 0.187,
    inflacao: 0.025,
    volatilidade: 0.6
  },
  trabalho: {
    // O bônus semestral é costume das empresas, não obrigação legal: 12.
    mesesPagos: 12,
    // Empregado: pensão Kosei Nenkin 9,15% + saúde ~5% (Kyokai Kenpo, média de
    // 10% dividida) + seguro-emprego ~0,55%; +0,8% de seguro de cuidados aos 40+.
    // Teto: remuneração-padrão máxima da pensão, ¥650.000 (o da saúde é maior).
    contribuicao: { aliquota: [0.147, 0.155], teto: 650000 },
    // Abstração: imposto nacional (5%–45%) + imposto de residente (10%) sobre a
    // renda depois das deduções do salário e básica (a "parede" de ¥1,6 milhão/
    // ano desde 2025). Ajustado à carga efetiva: ~7% em ¥300 mil/mês, ~11% em ¥600 mil.
    impostoRenda: { isencao: 140000, aliquota: 0.16 },
    // Não há indenização legal por demissão: aviso de 30 dias ou o salário
    // equivalente (Lei de Normas Trabalhistas, art. 20). A demissão é muito
    // limitada pela jurisprudência (Lei de Contratos de Trabalho, art. 16). O
    // "taishokukin" (prêmio de saída) é costume de empresa, não lei.
    rescisao: { nome: 'aviso prévio de 30 dias', mesesPorAno: 0 },
    // Seguro-emprego (koyo hoken): 90 a 330 dias, 50%–80% do salário (mais para
    // os salários baixos); típico de ~120 dias.
    seguroDesemprego: { meses: 4, reposicao: 0.6 },
    // Pensão básica + Kosei Nenkin aos 65; mínimo de 10 anos desde 2017.
    // Reposição bruta de ~32%–40% (OCDE, Pensions at a Glance 2023).
    previdencia: { idade: [65, 65], anos: [10, 10], reposicao: 0.4, nome: 'Kosei Nenkin' },
    concurso: true,
    contratoFormal: 'contrato de funcionário efetivo (seishain)'
  },
  educacao: {
    etapas: {
      fundamental: 'ensino fundamental', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'a creche municipal (hoikuen)', fundamental: 'a escola pública do bairro', medio: 'o colégio público da província' }
    },
    // Universidades nacionais e públicas: o Exame Comum (Daigaku Nyugaku
    // Kyotsu Test) e depois a prova de cada universidade. As privadas
    // (~75% dos alunos) selecionam também por candidatura e recomendação.
    ingresso: 'exame_nacional',
    exame: { nome: 'Exame Comum de Ingresso Universitário', artigo: 'o' },
    // Nacional: ¥535.800/ano (padrão MEXT); privada: média de ~¥960 mil (MEXT 2023).
    publicaCobra: 0.56,
    // Novo sistema de apoio (JASSO, bolsa não reembolsável + isenção de
    // mensalidade, 2020): famílias isentas ou de renda baixa (~¥3,8 milhões/ano
    // para 4 pessoas) ≈ 0,4 salário mínimo por pessoa.
    bolsa: { nome: 'a bolsa da JASSO', teto: 0.4 },
    credito: { nome: 'o empréstimo estudantil da JASSO' },
    cotas: false,
    privadaComum: true
  },
  politica: {
    sistema: 'monarquia constitucional parlamentarista unitária',
    // Lei de Eleições para Cargos Públicos (1950), art. 10: 25 anos para a
    // Câmara dos Representantes, assembleias e prefeitos; 30 para a Câmara dos
    // Conselheiros e governadores.
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 25, casa: 'a Assembleia Municipal' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 25, casa: 'a Prefeitura' },
      deputado_estadual: { titulo: ['deputado provincial', 'deputada provincial'], anos: 4, idade: 25, casa: 'a Assembleia Provincial' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 4, idade: 25, casa: 'a Câmara dos Representantes' },
      senador: { titulo: ['conselheiro', 'conselheira'], anos: 6, idade: 30, casa: 'a Câmara dos Conselheiros' },
      governador: { titulo: ['governador', 'governadora'], anos: 4, idade: 30, casa: 'o Governo da Província' }
    },
    // Eleições locais unificadas em abril (2023, 2027...); a Câmara pode ser
    // dissolvida antes dos 4 anos (última: 8 de fevereiro de 2026).
    eleicoes: { local: [2027, 4], geral: [2026, 4] },
    mes: 3,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 18,
    forcas: { exercito: 'a Força Terrestre de Autodefesa', marinha: 'a Força Marítima de Autodefesa', aeronautica: 'a Força Aérea de Autodefesa' },
    policia: 'a polícia da província'
  },
  esporte: {
    // Vôlei, natação, atletismo (ekiden) e lutas (judô, luta olímpica,
    // caratê) têm estrutura escolar e empresarial forte; o beisebol, o maior,
    // não é um domínio do jogo. Futebol com a J.League (60 clubes) e o
    // basquete em alta com a B.League.
    popularidade: { futebol: 1.1, volei: 1.25, basquete: 1.0, natacao: 1.2, atletismo: 1.15, lutas: 1.25, tenis: 1.0 },
    divisoes: ['Japan Football League', 'J3 League', 'J2 League', 'J1 League'],
    clubes: [
      { nome: 'Kashima Antlers', artigo: 'o', porte: 'grande', cidade: 'Kashima' },
      { nome: 'Urawa Red Diamonds', artigo: 'o', porte: 'grande', cidade: 'Saitama' },
      { nome: 'Yokohama F. Marinos', artigo: 'o', porte: 'grande', cidade: 'Yokohama' },
      { nome: 'Gamba Osaka', artigo: 'o', porte: 'grande', cidade: 'Osaka' },
      { nome: 'Vissel Kobe', artigo: 'o', porte: 'grande', cidade: 'Kobe' },
      { nome: 'Sanfrecce Hiroshima', artigo: 'o', porte: 'grande', cidade: 'Hiroshima' },
      { nome: 'Nagoya Grampus', artigo: 'o', porte: 'tradicional', cidade: 'Nagoya' },
      { nome: 'FC Tokyo', artigo: 'o', porte: 'tradicional', cidade: 'Tóquio' },
      { nome: 'Tokyo Verdy', artigo: 'o', porte: 'tradicional', cidade: 'Tóquio' },
      { nome: 'Cerezo Osaka', artigo: 'o', porte: 'tradicional', cidade: 'Osaka' },
      { nome: 'Kyoto Sanga', artigo: 'o', porte: 'tradicional', cidade: 'Kyoto' },
      { nome: 'Avispa Fukuoka', artigo: 'o', porte: 'tradicional', cidade: 'Fukuoka' },
      { nome: 'Hokkaido Consadole Sapporo', artigo: 'o', porte: 'tradicional', cidade: 'Sapporo' },
      { nome: 'Júbilo Iwata', artigo: 'o', porte: 'tradicional', cidade: 'Iwata' },
      { nome: 'Giravanz Kitakyushu', artigo: 'o', porte: 'regional', cidade: 'Kitakyushu' }
    ]
  },
  // Seguro público obrigatório para todos (empregados ou kokumin kenko hoken),
  // copagamento de 30% (menos para crianças e idosos).
  saude: { sistema: 'universal', redePublica: 'o seguro de saúde público', custoPlano: 1.3 },
  // Vistos de trabalho por categoria (inclui o "trabalhador especificado", 2019);
  // residência permanente exige em regra 10 anos.
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'JP',
    nome: 'Japão',
    legitima: 0.5,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [2 / 3, 2 / 3],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.03,
    rotuloCusto: 'imposto sobre herança (sozokuzei) e custas',
    vacancia: 'o Estado'
  },
  nomes: {
    // Ranking Meiji Yasuda (desde 1912) e Benesse "Tamahiyo" para as gerações recentes.
    cortes: [1970, 2000],
    neutros: ['Hikaru', 'Kaoru', 'Aoi', 'Hinata', 'Yuki', 'Nao', 'Rin', 'Sora', 'Akira', 'Tsubasa', 'Chihiro', 'Mizuki', 'Jun', 'Itsuki', 'Natsuki', 'Haru'],
    grupos: [
      {
        id: 'japao',
        peso: 0.988,
        // Todas as províncias do perfil menos Okinawa.
        divisoes: ['13', '14', '11', '27', '28', '26', '23', '22', '08', '01', '34', '40'],
        sobrenome: 'um',
        masc: { antiga: JP_MASC_ANTIGA, meio: JP_MASC_MEIO, nova: JP_MASC_NOVA },
        fem: { antiga: JP_FEM_ANTIGA, meio: JP_FEM_MEIO, nova: JP_FEM_NOVA },
        // Os mais frequentes do país (Meiji Yasuda / levantamentos de sobrenomes).
        sobrenomes: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
          'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki',
          'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishikawa', 'Nakajima', 'Maeda', 'Fujita', 'Ogawa',
          'Goto', 'Okada', 'Hasegawa', 'Murakami', 'Kondo', 'Ishii', 'Saito', 'Sakamoto', 'Endo', 'Aoki',
          'Fujii', 'Nishimura', 'Fukuda', 'Ota', 'Miura', 'Fujiwara', 'Okamoto', 'Matsuda', 'Nakagawa', 'Nakano',
          'Harada', 'Ono', 'Tamura', 'Takeuchi', 'Kaneko', 'Wada', 'Nakayama', 'Ishida', 'Ueda', 'Morita']
      },
      {
        // Okinawa: os prenomes são os do país; os sobrenomes são os da tradição
        // ryukyuana (Higa, Kinjo, Oshiro...), os mais comuns da província.
        id: 'okinawa',
        peso: 0.012,
        divisoes: ['47'],
        sobrenome: 'um',
        masc: { antiga: JP_MASC_ANTIGA, meio: JP_MASC_MEIO, nova: JP_MASC_NOVA },
        fem: { antiga: JP_FEM_ANTIGA, meio: JP_FEM_MEIO, nova: JP_FEM_NOVA },
        sobrenomes: ['Higa', 'Kinjo', 'Oshiro', 'Miyagi', 'Shimabukuro', 'Tamaki', 'Uehara', 'Arakaki', 'Chinen', 'Teruya',
          'Yamashiro', 'Toguchi', 'Ganaha', 'Nakandakari', 'Kakazu', 'Yonamine', 'Iha', 'Taira', 'Tokashiki', 'Ishimine',
          'Gushiken', 'Nakasone', 'Kuniyoshi', 'Asato', 'Aragaki', 'Zukeran', 'Kyan', 'Agena', 'Miyazato', 'Tomoyose',
          'Chibana', 'Nakama', 'Yogi', 'Kochi', 'Matayoshi', 'Shinzato', 'Tobaru', 'Sunagawa', 'Kohagura', 'Uchima',
          'Nagamine', 'Ikehara']
      }
    ]
  },
  fontes: [
    'MHLW — salários mínimos regionais do ano fiscal 2025 (média ponderada ¥1.121/h), https://www.mhlw.go.jp/',
    'MHLW — Comprehensive Survey of Living Conditions 2022 (pobreza relativa 15,4%); Basic Survey on Wage Structure 2024 (salários por província).',
    'Japan Pension Service — alíquotas do Kosei Nenkin (18,3%) e remuneração-padrão máxima; Kyokai Kenpo (saúde, 2025).',
    'Código Civil do Japão (Lei 89/1896), arts. 762, 887–890, 900, 958-2, 959, 1042; Lei do Imposto sobre Herança.',
    'Lei de Normas Trabalhistas (art. 20) e Lei de Contratos de Trabalho (art. 16); Lei do Seguro-Emprego.',
    'Lei de Eleições para Cargos Públicos (1950), art. 10; Constituição do Japão, arts. 45–46.',
    'MEXT — mensalidades das universidades nacionais e privadas (2023); JASSO — sistema de apoio ao estudo superior (2020).',
    'ILO, Women and Men in the Informal Economy: A Statistical Picture, 3ª ed. (2018).',
    'J.League — clubes e divisões (temporada 2025; Kashima campeão).',
    'Meiji Yasuda Life — rankings históricos de prenomes (1912–2024).'
  ]
};

/* =============================================================== CHINA */

/*
 * SUCESSÃO — CHINA (Código Civil da RPC, 2020, Livro VI):
 *  - 1ª ordem: cônjuge, filhos e pais, em partes em regra iguais (arts. 1127
 *    e 1130); 2ª ordem: irmãos e avós (art. 1127);
 *  - representação: netos pelo filho pré-morto e, desde 2021, sobrinhos pelo
 *    irmão pré-morto (art. 1128);
 *  - NÃO há legítima geral: o testamento deve só reservar a parte necessária
 *    ao herdeiro sem capacidade de trabalho e sem renda (art. 1141) — aqui,
 *    liberdade de testar (legitima 0);
 *  - regime legal de comunhão dos bens adquiridos (art. 1062): antes da
 *    partilha, metade dos bens comuns é do cônjuge (art. 1153);
 *  - sem herdeiros, os bens vão ao Estado (ou à coletividade rural de que o
 *    falecido era membro) (art. 1160).
 * SIMPLIFICAÇÕES DECLARADAS: os pais concorrem também com os filhos na
 * 1ª ordem — o jogo só modela a concorrência do cônjuge; a regra do
 * herdeiro incapaz não é aplicada. Não há imposto sobre herança; custo de
 * cartório (notarização) e registro ~1%.
 */

/** Uigur: as listas não distinguem gerações (sem estatística pública por coorte). */
const UIGUR_M = ['Abdulla', 'Abdurehim', 'Ahmetjan', 'Alim', 'Arslan', 'Ekber', 'Erkin', 'Ibrahim', 'Ilham', 'Ilyas', 'Ismayil', 'Kerim', 'Memet', 'Mehmud', 'Musa', 'Nurmemet', 'Obul', 'Osman', 'Qurban', 'Rozi',
    'Tursun', 'Yasin', 'Yusup', 'Adil', 'Dilshat', 'Mirzat', 'Nijat', 'Perhat', 'Ekrem', 'Eziz', 'Ablet', 'Abliz', 'Tahir', 'Hesen', 'Yaqup', 'Ömer', 'Polat', 'Murat', 'Abduqadir', 'Rustem',
    'Batur', 'Mutellip', 'Kamil'];
const UIGUR_F = ['Aygül', 'Gulnar', 'Gülzar', 'Dilnur', 'Dilber', 'Mehriban', 'Nurgül', 'Patigül', 'Zulpiye', 'Ayshem', 'Mahire', 'Mihrigül', 'Rena', 'Reyhan', 'Saniye', 'Shahide', 'Zeyneb', 'Zöhre', 'Ayjamal', 'Adile',
    'Gülbahar', 'Gülnisa', 'Meryem', 'Ayshe', 'Nazugum', 'Nurbiye', 'Rabiye', 'Roshengül', 'Subinur', 'Tunsagül', 'Dilraba', 'Dilnaz', 'Mukeddes', 'Gulshen', 'Hebibe', 'Peride', 'Rizwangül', 'Sajide', 'Tajigül', 'Gülmire',
    'Amine'];

export const CHINA: PerfilDePais = {
  id: 'CN',
  gentilico: ['chinês', 'chinesa'],
  idiomas: ['mandarim'],
  divisao: {
    tipo: ['província', 'províncias'],
    // Divisões de nível provincial (ISO 3166-2:CN): províncias, municipalidades
    // (Pequim, Xangai, Tianjin, Chongqing) e regiões autônomas (Xinjiang,
    // Guangxi). Hong Kong, Macau e Taiwan ficam fora deste perfil (sistemas
    // próprios). Salário: NBS, salário médio urbano 2023 por província
    // (Pequim e Xangai ~1,9× a média — limitado a 1,35 pelo motor).
    lista: [
      { codigo: 'BJ', nome: 'Pequim', custo: 1.3, salario: 1.35 },
      { codigo: 'SH', nome: 'Xangai', custo: 1.35, salario: 1.35 },
      { codigo: 'TJ', nome: 'Tianjin', custo: 1.05, salario: 1.1 },
      { codigo: 'CQ', nome: 'Chongqing', custo: 0.9, salario: 0.93 },
      { codigo: 'GD', nome: 'Guangdong', custo: 1.1, salario: 1.1 },
      { codigo: 'ZJ', nome: 'Zhejiang', custo: 1.1, salario: 1.12 },
      { codigo: 'SC', nome: 'Sichuan', custo: 0.9, salario: 0.95 },
      { codigo: 'HB', nome: 'Hubei', custo: 0.92, salario: 0.92 },
      { codigo: 'SD', nome: 'Shandong', custo: 0.92, salario: 0.9 },
      { codigo: 'LN', nome: 'Liaoning', custo: 0.88, salario: 0.85 },
      { codigo: 'XJ', nome: 'Xinjiang', custo: 0.85, salario: 0.92 },
      { codigo: 'GX', nome: 'Guangxi', custo: 0.8, salario: 0.82 }
    ]
  },
  cidades: [
    ['Pequim', 'BJ', 'metropole', 'capital|sede'],
    ['Xangai', 'SH', 'metropole', 'sede|litoral'],
    ['Cantão', 'GD', 'metropole', 'sede|litoral'],
    ['Shenzhen', 'GD', 'metropole', 'litoral'],
    ['Tianjin', 'TJ', 'metropole', 'sede|litoral'],
    ['Chongqing', 'CQ', 'metropole', 'sede|litoral'],
    ['Chengdu', 'SC', 'capital', 'sede'],
    ['Wuhan', 'HB', 'capital', 'sede|litoral'],
    ['Hangzhou', 'ZJ', 'capital', 'sede'],
    ['Jinan', 'SD', 'capital', 'sede'],
    ['Qingdao', 'SD', 'polo', 'litoral'],
    ['Dalian', 'LN', 'polo', 'litoral'],
    ['Urumqi', 'XJ', 'capital', 'sede'],
    ['Yangshuo', 'GX', 'pequena', 'litoral']
  ],
  economia: {
    // Gini de ~0,36 (Banco Mundial, 2021; o NBS publica ~0,47), forte
    // desigualdade campo-cidade: base trabalhadora larga, classe média urbana
    // crescente, pobreza extrema oficialmente erradicada em 2020.
    classes: { vulneravel: 14, trabalhadora: 34, media_baixa: 26, media: 19, alta: 7 },
    // Preço de imóvel muito alto em relação à renda nas cidades de primeira
    // linha; aluguel relativamente moderado.
    moradia: 1.2,
    // Sem salário mínimo nacional: cada província fixa o seu (Xangai ¥2.740;
    // Pequim ¥2.540; as faixas mais baixas ~¥1.700–1.900). Omitido.
    informalidade: 0.54, // ILO (2018): ~54% do emprego
    inflacao: 0.01,
    volatilidade: 0.6
  },
  trabalho: {
    mesesPagos: 12,
    // "Cinco seguros e um fundo": pensão 8% + saúde 2% + desemprego 0,5% do
    // empregado (=10,5%), mais o fundo de habitação de 5% a 12% (poupança
    // compulsória). Teto: 300% do salário médio local — varia por cidade, omitido.
    contribuicao: { aliquota: [0.105, 0.225] },
    // Lei do IRPF (2018): ¥5.000/mês de dedução-padrão; 3% até ¥3.000
    // tributáveis e 10% até ¥12.000 — as deduções especiais (filhos, aluguel,
    // pais idosos) e as contribuições levam a maioria a pagar pouco ou nada.
    impostoRenda: { isencao: 5000, aliquota: 0.1 },
    // Lei do Contrato de Trabalho, art. 47: compensação econômica de um mês de
    // salário por ano de serviço (teto de 12 anos para os salários altos).
    rescisao: { nome: 'compensação econômica', mesesPorAno: 1 },
    // Seguro-desemprego: até 12 meses com 1–5 anos de contribuição (até 24
    // com 10+); benefício abaixo do mínimo local — repõe pouco.
    seguroDesemprego: { meses: 12, reposicao: 0.35 },
    // Reforma de 2024 (em vigor a partir de 2025, gradual em 15 anos): homens
    // 60→63; mulheres operárias 50→55, de colarinho-branco 55→58; mínimo de
    // contribuição 15→20 anos a partir de 2030. Usa-se 55 para as mulheres.
    previdencia: { idade: [63, 55], anos: [20, 20], reposicao: 0.45, nome: 'previdência básica dos empregados urbanos' },
    concurso: true, // o "guokao" e os exames provinciais de servidor
    contratoFormal: 'contrato com os cinco seguros e um fundo'
  },
  educacao: {
    etapas: {
      fundamental: 'ensino fundamental', medio: 'ensino médio', serieMedio: 'ano',
      // Os 9 anos obrigatórios (primário + ginásio); o ensino médio geral exige
      // o exame zhongkao, e perto de metade segue a via técnica.
      publica: { creche: 'o jardim de infância público', fundamental: 'a escola pública do bairro', medio: 'a escola de ensino médio pública' }
    },
    ingresso: 'exame_nacional',
    exame: { nome: 'gaokao', artigo: 'o' },
    // Pública: ~¥5–6 mil/ano; privada (minban): ~¥15–40 mil.
    publicaCobra: 0.25,
    // Bolsa nacional de auxílio (guojia zhuxuejin): para estudantes
    // reconhecidos como de família em dificuldade (sem teto único nacional);
    // aproximado em meio salário mínimo provincial por pessoa.
    bolsa: { nome: 'a bolsa nacional de auxílio estudantil', teto: 0.5 },
    credito: { nome: 'o empréstimo estudantil nacional' },
    // Planos especiais de vagas para alunos de condados rurais pobres
    // ("guojia zhuanxiang jihua") e bônus de pontuação para minorias.
    cotas: true,
    privadaComum: true
  },
  politica: {
    // Constituição da RPC (1982), arts. 1–3 e 97: só os deputados aos
    // congressos populares de condado/distrito e de município rural são eleitos
    // diretamente (Lei Eleitoral, art. 2); os congressos provinciais e o
    // Congresso Nacional são eleitos pelos congressos do nível abaixo; prefeitos
    // e governadores são escolhidos pelos congressos. Não há senado. Só o nível
    // diretamente eleito entra no jogo.
    sistema: 'república popular unitária com sistema de congressos populares, sob a direção constitucional do Partido Comunista',
    cargos: {
      vereador: { titulo: ['deputado ao congresso popular local', 'deputada ao congresso popular local'], anos: 5, idade: 18, casa: 'o Congresso Popular do condado' }
    },
    // Eleições diretas de condado/município: rodada nacional de 2021–2022, mandato
    // de 5 anos. "Geral": o ciclo (indireto) do Congresso Nacional, 2028.
    eleicoes: { local: [2026, 5], geral: [2028, 5] },
    mes: 10,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Lei do Serviço Militar (2021): alistamento obrigatório de homens aos 18,
    // "sistema que combina voluntários e conscritos" — na prática, as vagas são
    // preenchidas por voluntários. Registro obrigatório, ingresso seletivo.
    servico: 'seletivo',
    idade: 18,
    forcas: { exercito: 'o Exército de Libertação Popular', marinha: 'a Marinha do Exército de Libertação Popular', aeronautica: 'a Força Aérea do Exército de Libertação Popular' },
    policia: 'a polícia de segurança pública'
  },
  esporte: {
    // Basquete (CBA) e as escolas esportivas estatais de natação, saltos,
    // vôlei e atletismo; futebol de massa, mas liga profissional recuada
    // depois de 2020 (clubes dissolvidos, teto salarial).
    popularidade: { futebol: 0.8, volei: 1.2, basquete: 1.4, natacao: 1.3, atletismo: 1.0, lutas: 1.1, tenis: 1.0 },
    divisoes: ['Chinese Champions League', 'China League Two', 'China League One', 'Chinese Super League'],
    clubes: [
      { nome: 'Shanghai Port', artigo: 'o', porte: 'grande', cidade: 'Xangai' },
      { nome: 'Shanghai Shenhua', artigo: 'o', porte: 'grande', cidade: 'Xangai' },
      { nome: 'Beijing Guoan', artigo: 'o', porte: 'grande', cidade: 'Pequim' },
      { nome: 'Shandong Taishan', artigo: 'o', porte: 'grande', cidade: 'Jinan' },
      { nome: 'Chengdu Rongcheng', artigo: 'o', porte: 'tradicional', cidade: 'Chengdu' },
      { nome: 'Zhejiang FC', artigo: 'o', porte: 'tradicional', cidade: 'Hangzhou' },
      { nome: 'Tianjin Jinmen Tiger', artigo: 'o', porte: 'tradicional', cidade: 'Tianjin' },
      { nome: 'Wuhan Three Towns', artigo: 'o', porte: 'tradicional', cidade: 'Wuhan' },
      { nome: 'Qingdao Hainiu', artigo: 'o', porte: 'tradicional', cidade: 'Qingdao' },
      { nome: 'Dalian Yingbo', artigo: 'o', porte: 'tradicional', cidade: 'Dalian' },
      { nome: 'Qingdao West Coast', artigo: 'o', porte: 'regional', cidade: 'Qingdao' },
      { nome: 'Shenzhen Peng City', artigo: 'o', porte: 'regional', cidade: 'Shenzhen' },
      { nome: 'Chongqing Tonglianglong', artigo: 'o', porte: 'regional', cidade: 'Chongqing' }
    ]
  },
  // Seguro médico básico (empregados urbanos e residentes) cobre ~95% da
  // população, mas o gasto do próprio bolso ainda é ~27% (NHC).
  saude: { sistema: 'misto', redePublica: 'o seguro médico básico', custoPlano: 0.8 },
  // Residência permanente raríssima; vistos de trabalho por pontos (A/B/C).
  migracao: { blocos: [], abertura: 'restrita' },
  sucessao: {
    pais: 'CN',
    nome: 'China',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 3, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.01,
    rotuloCusto: 'custas de cartório e registro (não há imposto sobre herança)',
    vacancia: 'o Estado'
  },
  nomes: {
    // Ministério da Segurança Pública, relatórios anuais de nomes e
    // sobrenomes registrados (2019–2023) e o levantamento de 2020 dos prenomes
    // por década de nascimento.
    cortes: [1975, 2000],
    neutros: ['Zixuan', 'Yichen', 'Chenxi', 'Xinyu', 'Ziyu', 'Yu', 'Xin', 'Rui', 'Yiran', 'Jiahui', 'Wen', 'Qing'],
    grupos: [
      {
        id: 'han',
        peso: 0.99,
        divisoes: ['BJ', 'SH', 'TJ', 'CQ', 'GD', 'ZJ', 'SC', 'HB', 'SD', 'LN', 'GX'],
        sobrenome: 'um',
        masc: {
          antiga: ['Jianguo', 'Jianhua', 'Guoqiang', 'Jianjun', 'Zhiqiang', 'Jianping', 'Weidong', 'Weiguo', 'Guohua', 'Zhenhua', 'Deming', 'Wenhua', 'Guoqing', 'Jianxin', 'Guoping', 'Guoliang', 'Zhenguo', 'Xinmin', 'Yongqing', 'Fuqiang',
            'Baoguo', 'Changjiang', 'Yongsheng', 'Jinsheng', 'Jinhai', 'Fusheng', 'Shiming', 'Xuemin', 'Chunsheng', 'Dongsheng', 'Hongjun', 'Zhonghua', 'Aiguo', 'Wenming', 'Lixin', 'Ming', 'Jun', 'Yong', 'Gang', 'Qiang',
            'Hua', 'Ping', 'Jian', 'Lin', 'Zhiming', 'Yuming'],
          meio: ['Wei', 'Lei', 'Jun', 'Yong', 'Tao', 'Bin', 'Qiang', 'Peng', 'Jie', 'Chao', 'Hao', 'Gang', 'Ming', 'Hui', 'Jian', 'Liang', 'Fei', 'Bo', 'Xin', 'Lin',
            'Haitao', 'Haibo', 'Hongtao', 'Jianfeng', 'Xiaodong', 'Xiaoming', 'Xiaojun', 'Zhiwei', 'Wenjie', 'Junjie', 'Haiyang', 'Yang', 'Dong', 'Kai', 'Long', 'Xiaolong', 'Zhiyong', 'Pengfei', 'Yunfei', 'Chunlei',
            'Jiajun', 'Shuai', 'Xiaofeng', 'Zhigang', 'Kun', 'Feng'],
          nova: ['Haoyu', 'Yuxuan', 'Zihao', 'Haoran', 'Yuhang', 'Yichen', 'Yuchen', 'Zimo', 'Muchen', 'Mingze', 'Yuze', 'Yize', 'Muyang', 'Junhao', 'Jiahao', 'Yifan', 'Zirui', 'Ruize', 'Mingxuan', 'Haoyang',
            'Yihang', 'Junyi', 'Tianyu', 'Bowen', 'Junjie', 'Yiming', 'Zixuan', 'Siyuan', 'Zeyu', 'Jingyu', 'Haochen', 'Boyu', 'Jiarui', 'Ziyu', 'Zhiyuan', 'Jiale', 'Yunze', 'Kaiwen', 'Zhenyu', 'Shuo',
            'Rui', 'Hao', 'Chenxi', 'Xinyu', 'Weijie']
        },
        fem: {
          antiga: ['Xiuying', 'Guiying', 'Xiulan', 'Yulan', 'Guilan', 'Shulan', 'Yuying', 'Fengying', 'Yuzhen', 'Xiuzhen', 'Shuzhen', 'Guizhen', 'Xiufang', 'Guifang', 'Lanying', 'Yuhua', 'Shuying', 'Guirong', 'Xiurong', 'Yumei',
            'Guizhi', 'Shufen', 'Yufen', 'Xiuhua', 'Cuiying', 'Fenglan', 'Suzhen', 'Huilan', 'Lihua', 'Hongmei', 'Chunmei', 'Aihua', 'Meiying', 'Shuqin', 'Guiqin', 'Xiuqin', 'Yuqin', 'Hongying', 'Suhua', 'Ping',
            'Hong', 'Ying', 'Min', 'Hua', 'Yan', 'Li'],
          meio: ['Li', 'Jing', 'Min', 'Yan', 'Fang', 'Juan', 'Na', 'Ying', 'Hong', 'Hui', 'Ling', 'Qian', 'Ting', 'Xue', 'Mei', 'Dan', 'Xia', 'Lili', 'Jingjing', 'Tingting',
            'Yanyan', 'Xiaoyan', 'Xiaohong', 'Xiaomei', 'Hongmei', 'Haiyan', 'Chunyan', 'Lina', 'Lijuan', 'Yanhong', 'Xiaoli', 'Hongyan', 'Xiaojing', 'Rui', 'Wen', 'Qin', 'Shan', 'Yun', 'Pingping', 'Shanshan',
            'Dandan', 'Xiaoxia', 'Lihong', 'Mengmeng', 'Qing'],
          nova: ['Ruoxi', 'Yinuo', 'Yihan', 'Zihan', 'Yimo', 'Yutong', 'Xinyi', 'Yuxi', 'Xinyan', 'Kexin', 'Zixuan', 'Shihan', 'Yuhan', 'Jiayi', 'Mengqi', 'Sihan', 'Yuxin', 'Shiqi', 'Yuxuan', 'Jiaqi',
            'Mengyao', 'Yiran', 'Siqi', 'Wanting', 'Xinran', 'Yuqi', 'Jiaxin', 'Ziyi', 'Anran', 'Yuting', 'Yunxi', 'Xiaoyu', 'Shuyi', 'Ruotong', 'Jingyi', 'Chenxi', 'Mengyuan', 'Han', 'Xin', 'Yue',
            'Muxi', 'Zhiruo', 'Qingyi', 'Keke']
        },
        // Ranking de 2020 do Ministério da Segurança Pública (Wang, Li e Zhang
        // são ~20% da população): os mais comuns repetidos como peso.
        sobrenomes: [...rep('Wang', 5), ...rep('Li', 5), ...rep('Zhang', 5), ...rep('Liu', 4), ...rep('Chen', 3), ...rep('Yang', 2), ...rep('Huang', 2), ...rep('Zhao', 2), ...rep('Wu', 2), ...rep('Zhou', 2),
          'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Lin', 'Gao', 'Luo', 'Zheng', 'Liang', 'Xie', 'Song', 'Tang', 'Han', 'Feng', 'Deng', 'Cao', 'Peng',
          'Zeng', 'Xiao', 'Tian', 'Dong', 'Pan', 'Yuan', 'Cai', 'Jiang', 'Yu', 'Du', 'Ye', 'Cheng', 'Wei', 'Su', 'Lü', 'Ding', 'Ren', 'Lu', 'Yao', 'Shen',
          'Zhong', 'Cui', 'Tan', 'Fan', 'Liao', 'Shi', 'Jin', 'Jia', 'Xia', 'Fu', 'Fang', 'Zou', 'Xiong', 'Bai', 'Meng', 'Qin', 'Qiu', 'Hou', 'Yin', 'Xue',
          'Yan', 'Duan', 'Lei', 'Long', 'Tao', 'Mao', 'Hao', 'Gu', 'Gong', 'Shao', 'Wan', 'Qian', 'Dai', 'Mo', 'Kong', 'Xiang', 'Chang', 'Tong', 'Niu', 'Ge']
      },
      {
        // Uigures (Xinjiang): sem sobrenome de família tradicional — o prenome do
        // pai faz as vezes de sobrenome. O jogo herda um nome fixo pela linha
        // paterna (simplificação). Grafia latina corrente (ULY); as listas não
        // distinguem gerações (não há estatística pública por coorte).
        id: 'uigur',
        peso: 0.008,
        divisoes: ['XJ'],
        sobrenome: 'um',
        masc: { antiga: UIGUR_M, meio: UIGUR_M, nova: UIGUR_M },
        fem: { antiga: UIGUR_F, meio: UIGUR_F, nova: UIGUR_F },
        sobrenomes: ['Abdulla', 'Ahmet', 'Alim', 'Ekber', 'Erkin', 'Ibrahim', 'Ismayil', 'Kerim', 'Memet', 'Mehmud',
          'Musa', 'Nurmemet', 'Osman', 'Qurban', 'Rozi', 'Tursun', 'Yasin', 'Yusup', 'Adil', 'Tahir',
          'Hesen', 'Yaqup', 'Ömer', 'Polat', 'Abdukerim', 'Abdurehim', 'Abliz', 'Ablet', 'Eziz', 'Hoshur',
          'Imin', 'Jume', 'Mamut', 'Niyaz', 'Qadir', 'Sabit', 'Sidiq', 'Tohti', 'Turdi', 'Yunus', 'Zunun', 'Barat']
      }
    ]
  },
  fontes: [
    'Constituição da RPC (1982, emendada em 2018), arts. 1–3, 97–98; Lei Eleitoral dos Congressos Populares (rev. 2020), art. 2.',
    'Código Civil da RPC (2020), arts. 1062, 1127–1130, 1141, 1153, 1160.',
    'Lei do Contrato de Trabalho (2007), art. 47; Lei do Seguro Social (2010); Lei do Imposto de Renda Individual (rev. 2018).',
    'Decisão do Comitê Permanente da APN sobre o aumento gradual da idade de aposentadoria (13/09/2024, em vigor em 2025).',
    'Lei do Serviço Militar (rev. 2021).',
    'NBS — China Statistical Yearbook 2024 (salário médio urbano por província); Banco Mundial (Gini, 2021).',
    'ILO, Women and Men in the Informal Economy (2018) — estimativa para a China.',
    'Ministério da Segurança Pública — relatórios de nomes do registro de domicílio (2019–2023).',
    'Chinese Football Association — Chinese Super League 2026 (Shanghai Port campeão de 2025).'
  ]
};

/* =============================================================== ÍNDIA */

/*
 * SUCESSÃO — ÍNDIA: não há um código único; vale a LEI PESSOAL de cada
 * religião. O perfil segue a Hindu Succession Act, 1956 (hindus, sikhs,
 * jainistas e budistas — ~80% da população):
 *  - herdeiros de Classe I (s. 8 e Anexo): filhos, filhas, viúva e mãe, em
 *    partes iguais por cabeça (s. 10); filhos de filho/filha pré-morto
 *    herdam a parte dele (representação); filhas iguais aos filhos desde 2005;
 *  - o pai e os irmãos são Classe II: só herdam sem nenhum da Classe I;
 *  - liberdade de testar (s. 30): não há legítima;
 *  - sem herdeiros, os bens vão ao governo (s. 29);
 *  - não há comunhão de bens no casamento.
 * MUÇULMANOS (Shariat Application Act, 1937): quotas fixas do Corão
 * (cônjuge 1/8 ou 1/4, filho o dobro da filha...) e testamento limitado a 1/3
 * do patrimônio — o perfil não modela; seria legítima ~2/3. CRISTÃOS e
 * PARSIS (Indian Succession Act, 1925): cônjuge 1/3 com descendentes,
 * liberdade de testar.
 * SIMPLIFICAÇÕES DECLARADAS: aplica-se a regra hindu a todos; a mãe concorre
 * com a viúva sem filhos (o pai não) → o cônjuge fica com metade, com um ou
 * dois pais vivos; a herança de mulher hindu (s. 15) segue a mesma regra.
 * Não há imposto sobre herança desde 1985 (Estate Duty abolida); custas de
 * homologação (probate) e selos onde exigidas: ~2%.
 */

export const INDIA: PerfilDePais = {
  id: 'IN',
  gentilico: ['indiano', 'indiana'],
  // Censo de 2011: hindi ~44% como língua materna; o inglês é língua oficial
  // associada e a da universidade e da Justiça. As línguas regionais vivem
  // nos grupos de nomes.
  idiomas: ['hindi', 'inglês', 'bengali', 'marati', 'télugo', 'tâmil'],
  divisao: {
    tipo: ['estado', 'estados'],
    // Estados e o Território da Capital Nacional (ISO 3166-2:IN; Telangana é
    // IN-TS desde 2023). Custo e salário: MoSPI, renda per capita estadual
    // (NSDP 2023-24) — Délhi, Goa, Karnataka e Telangana no alto; Bihar e Uttar
    // Pradesh embaixo (a distância real é de 3–4×; o motor limita a ±35%).
    lista: [
      { codigo: 'DL', nome: 'Délhi', custo: 1.25, salario: 1.3 },
      { codigo: 'MH', nome: 'Maharashtra', custo: 1.15, salario: 1.15 },
      { codigo: 'KA', nome: 'Karnataka', custo: 1.1, salario: 1.2 },
      { codigo: 'TS', nome: 'Telangana', custo: 1.05, salario: 1.15 },
      { codigo: 'TN', nome: 'Tâmil Nadu', custo: 1.0, salario: 1.1 },
      { codigo: 'GJ', nome: 'Gujarat', custo: 1.0, salario: 1.1 },
      { codigo: 'KL', nome: 'Kerala', custo: 1.0, salario: 1.05 },
      { codigo: 'GA', nome: 'Goa', custo: 1.1, salario: 1.25 },
      { codigo: 'PB', nome: 'Punjab', custo: 0.95, salario: 0.98 },
      { codigo: 'WB', nome: 'Bengala Ocidental', custo: 0.9, salario: 0.88 },
      { codigo: 'JH', nome: 'Jharkhand', custo: 0.85, salario: 0.8 },
      { codigo: 'UP', nome: 'Uttar Pradesh', custo: 0.82, salario: 0.75 },
      { codigo: 'BR', nome: 'Bihar', custo: 0.78, salario: 0.7 }
    ]
  },
  cidades: [
    ['Nova Délhi', 'DL', 'metropole', 'capital|sede'],
    ['Mumbai', 'MH', 'metropole', 'sede|litoral'],
    ['Calcutá', 'WB', 'metropole', 'sede|litoral'],
    ['Chennai', 'TN', 'metropole', 'sede|litoral'],
    ['Bangalore', 'KA', 'metropole', 'sede'],
    ['Hyderabad', 'TS', 'metropole', 'sede'],
    ['Ahmedabad', 'GJ', 'metropole'],
    ['Lucknow', 'UP', 'capital', 'sede'],
    ['Patna', 'BR', 'capital', 'sede|litoral'],
    ['Kochi', 'KL', 'polo', 'litoral'],
    ['Malappuram', 'KL', 'pequena'],
    ['Amritsar', 'PB', 'polo'],
    ['Margão', 'GA', 'polo', 'litoral'],
    ['Jamshedpur', 'JH', 'polo']
  ],
  economia: {
    // Banco Mundial (Poverty & Equity Brief 2025): pobreza extrema de ~5% em
    // 2022-23, mas ~24% abaixo da linha de renda média-baixa; renda per capita
    // em PPC de metade da brasileira; topo estreito. Base larga.
    classes: { vulneravel: 30, trabalhadora: 36, media_baixa: 18, media: 12, alta: 4 },
    moradia: 1.0,
    // Sem salário mínimo nacional vigente: o piso nacional do Code on Wages
    // (2019, em vigor desde 21/11/2025) ainda não foi fixado; cada estado
    // fixa os seus, por qualificação e zona. Omitido.
    informalidade: 0.88, // ILOSTAT / PLFS: ~88% do emprego
    inflacao: 0.045,
    volatilidade: 1.0
  },
  trabalho: {
    // O bônus estatutário (Payment of Bonus Act, mín. 8,33%) só vale para
    // salários até ₹21.000 em empresas com 20+ empregados — não modelado: 12.
    mesesPagos: 12,
    // EPF: 12% do salário-base do empregado (obrigatório até ₹15.000; acima,
    // muitas empresas contribuem só sobre ₹15.000) + ESIC 0,75% para salários
    // até ₹21.000.
    contribuicao: { aliquota: [0.12, 0.1275], teto: 15000 },
    // Regime novo (Orçamento 2025-26): sem imposto até ₹12 lakh/ano (+₹75 mil de
    // dedução-padrão para assalariados) = ₹1.06.250/mês; acima, faixas de 15%–30%.
    impostoRenda: { isencao: 106250, aliquota: 0.15 },
    // Industrial Relations Code (2020): indenização de 15 dias de salário por ano
    // (≈0,5); gratuity (Code on Social Security): 15/26 de um mês por ano após 5
    // anos (1 ano para contratos por prazo) — somadas, ~1 mês por ano de casa.
    rescisao: { nome: 'indenização por dispensa e gratuity', mesesPorAno: 1 },
    // Sem seguro-desemprego geral (o auxílio do ESIC é estreito). Omitido.
    // EPS (pensão do EPFO): a partir dos 58, com 10 anos de serviço; o
    // benefício é limitado pelo teto de ₹15.000 — reposição baixa.
    previdencia: { idade: [58, 58], anos: [10, 10], reposicao: 0.2, nome: 'EPFO' },
    concurso: true, // UPSC, SSC, comissões estaduais, bancos públicos, ferrovias
    contratoFormal: 'emprego formal com PF'
  },
  educacao: {
    etapas: {
      // RTE Act (2009): ensino gratuito e obrigatório dos 6 aos 14 anos.
      fundamental: 'ensino fundamental', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'a anganwadi do bairro', fundamental: 'a escola do governo', medio: 'a escola do governo' }
    },
    // CUET-UG (NTA) para as universidades centrais e muitas estaduais; JEE para
    // engenharia e NEET para medicina; parte das estaduais usa a nota do 12º ano.
    ingresso: 'exame_nacional',
    exame: { nome: 'CUET', artigo: 'o' },
    publicaCobra: 0.15,
    // Central Sector Scheme of Scholarship: mérito (top 20% do 12º ano) e renda
    // familiar até ₹4,5 lakh/ano. Sem mínimo nacional, o teto foi calculado
    // sobre um piso estadual típico de ~₹12 mil/mês: ≈0,6 por pessoa.
    bolsa: { nome: 'a bolsa central para universitários', teto: 0.6 },
    // PM-Vidyalaxmi (2024): empréstimo sem garantia, subsídio de juros até ₹8 lakh.
    credito: { nome: 'o empréstimo PM-Vidyalaxmi' },
    // Reservas constitucionais: SC 15%, ST 7,5%, OBC 27%, EWS 10% (renda).
    cotas: true,
    privadaComum: true
  },
  politica: {
    sistema: 'república parlamentarista federal',
    // Constituição, art. 84 (25 anos para a Lok Sabha), art. 173 (25 para as
    // Assembleias), art. 243V (21 para os municípios). Rajya Sabha e
    // governadores: indiretos/nomeados — omitidos. Prefeitos: eleição direta só
    // em alguns estados (UP, MP...) e indireta nas grandes metrópoles — omitido.
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 5, idade: 21, casa: 'a corporação municipal' },
      deputado_estadual: { titulo: ['deputado estadual (MLA)', 'deputada estadual (MLA)'], anos: 5, idade: 25, casa: 'a Assembleia Legislativa (Vidhan Sabha)' },
      deputado_federal: { titulo: ['deputado (MP)', 'deputada (MP)'], anos: 5, idade: 25, casa: 'a Lok Sabha' }
    },
    // Lok Sabha: 2024 → 2029, em abril–maio. Locais e estaduais são escalonadas
    // por estado; usa-se um ciclo de 5 anos.
    eleicoes: { local: [2027, 5], geral: [2029, 5] },
    mes: 3,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Voluntário; o Agnipath recruta dos 17,5 aos 21 anos (arredondado a 18).
    servico: 'voluntario',
    idade: 18,
    forcas: { exercito: 'o Exército Indiano', marinha: 'a Marinha Indiana', aeronautica: 'a Força Aérea Indiana' },
    policia: 'a polícia estadual'
  },
  esporte: {
    // O críquete, dominante, não é um domínio do jogo. Luta olímpica e boxe têm
    // tradição (akharas); futebol forte em Bengala, Kerala, Goa e no Nordeste;
    // estrutura profissional pequena para os demais.
    popularidade: { futebol: 0.75, volei: 0.85, basquete: 0.6, natacao: 0.6, atletismo: 0.9, lutas: 1.1, tenis: 0.6 },
    divisoes: ['I-League 3', 'I-League 2', 'I-League', 'Indian Super League'],
    clubes: [
      { nome: 'Mohun Bagan Super Giant', artigo: 'o', porte: 'grande', cidade: 'Calcutá' },
      { nome: 'East Bengal', artigo: 'o', porte: 'grande', cidade: 'Calcutá' },
      { nome: 'Kerala Blasters', artigo: 'o', porte: 'grande', cidade: 'Kochi' },
      { nome: 'Bengaluru FC', artigo: 'o', porte: 'grande', cidade: 'Bangalore' },
      { nome: 'Mumbai City', artigo: 'o', porte: 'grande', cidade: 'Mumbai' },
      { nome: 'FC Goa', artigo: 'o', porte: 'grande', cidade: 'Margão' },
      { nome: 'Mohammedan', artigo: 'o', porte: 'tradicional', cidade: 'Calcutá' },
      { nome: 'Chennaiyin', artigo: 'o', porte: 'tradicional', cidade: 'Chennai' },
      { nome: 'Jamshedpur FC', artigo: 'o', porte: 'tradicional', cidade: 'Jamshedpur' },
      { nome: 'Churchill Brothers', artigo: 'o', porte: 'tradicional', cidade: 'Margão' },
      { nome: 'SC Delhi', artigo: 'o', porte: 'regional', cidade: 'Nova Délhi' },
      { nome: 'Sreenidi Deccan', artigo: 'o', porte: 'regional', cidade: 'Hyderabad' }
    ]
  },
  // Rede pública gratuita mas sobrecarregada; Ayushman Bharat (PM-JAY) cobre
  // internações dos mais pobres; ~40% do gasto em saúde é do próprio bolso.
  saude: { sistema: 'misto', redePublica: 'os hospitais do governo', custoPlano: 0.5 },
  // Vistos de emprego restritos a qualificados; cidadania por naturalização
  // após 12 anos. (A fronteira aberta com Nepal e Butão, pelo tratado de 1950,
  // não é um bloco do jogo.)
  migracao: { blocos: [], abertura: 'restrita' },
  sucessao: {
    pais: 'IN',
    nome: 'Índia',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 2, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.02,
    rotuloCusto: 'custas de homologação (não há imposto sobre herança)',
    vacancia: 'o Estado'
  },
  nomes: {
    // Não há estatística oficial nacional de prenomes. As listas vêm de uso
    // corrente documentado (registros de nascimento municipais publicados pela
    // imprensa, listas eleitorais, rankings de sites de registro civil); os pesos
    // seguem o Censo de 2011 (língua materna e religião).
    cortes: [1975, 2000],
    neutros: ['Kiran', 'Jyoti', 'Gurpreet', 'Harpreet', 'Navjot', 'Amandeep', 'Arya', 'Sai', 'Noor', 'Shashi'],
    grupos: [
      {
        // Hindus do cinturão do hindi (UP, Bihar, Délhi, Jharkhand...).
        id: 'hindi',
        peso: 0.40,
        divisoes: ['DL', 'UP', 'BR', 'JH'],
        sobrenome: 'um',
        masc: {
          antiga: ['Ram Prasad', 'Shyam Lal', 'Om Prakash', 'Ramesh', 'Suresh', 'Rajendra', 'Mahesh', 'Dinesh', 'Naresh', 'Satish', 'Ashok', 'Vinod', 'Rakesh', 'Mukesh', 'Krishna', 'Shiv Kumar', 'Hari', 'Gopal', 'Jagdish', 'Mahendra',
            'Surendra', 'Virendra', 'Narendra', 'Prem', 'Kailash', 'Rajesh', 'Subhash', 'Anil', 'Sunil', 'Vijay', 'Ajay', 'Ravi', 'Arun', 'Ram Niwas', 'Shankar', 'Bhagwan Das', 'Brij Mohan', 'Raghunath', 'Ishwar', 'Laxman',
            'Devendra', 'Yogendra'],
          meio: ['Rahul', 'Amit', 'Sanjay', 'Vikas', 'Rohit', 'Ankit', 'Manoj', 'Deepak', 'Sandeep', 'Pankaj', 'Vivek', 'Abhishek', 'Gaurav', 'Saurabh', 'Nitin', 'Sachin', 'Ashish', 'Rajeev', 'Alok', 'Vikram',
            'Arvind', 'Pradeep', 'Sumit', 'Anuj', 'Mohit', 'Ankur', 'Varun', 'Vishal', 'Nikhil', 'Praveen', 'Prashant', 'Neeraj', 'Kapil', 'Tarun', 'Harsh', 'Yogesh', 'Shailendra', 'Dheeraj', 'Lokesh', 'Hemant'],
          nova: ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advait', 'Dhruv', 'Kabir', 'Ritvik', 'Aarush', 'Kiaan', 'Darsh',
            'Veer', 'Yash', 'Rudra', 'Shivansh', 'Lakshya', 'Ansh', 'Arnav', 'Divyansh', 'Kartik', 'Aryan', 'Utkarsh', 'Devansh', 'Rishabh', 'Aniket', 'Prince', 'Krish', 'Tanmay', 'Ojas', 'Ayush', 'Sumit']
        },
        fem: {
          antiga: ['Kamla', 'Shanti', 'Savitri', 'Sita', 'Geeta', 'Sushila', 'Pushpa', 'Kaushalya', 'Urmila', 'Sarla', 'Saroj', 'Asha', 'Usha', 'Nirmala', 'Krishna Devi', 'Kusum', 'Shakuntala', 'Vimla', 'Lakshmi', 'Radha',
            'Parvati', 'Santosh', 'Prem Lata', 'Sudha', 'Shobha', 'Manju', 'Kanta', 'Pramila', 'Meena', 'Rekha', 'Kiran', 'Sunita', 'Anita', 'Suman', 'Indu', 'Malti', 'Ganga', 'Bimla', 'Durga', 'Rampyari'],
          meio: ['Priya', 'Pooja', 'Neha', 'Anjali', 'Sonia', 'Ritu', 'Kavita', 'Shweta', 'Preeti', 'Nisha', 'Rashmi', 'Swati', 'Deepika', 'Shalini', 'Pallavi', 'Jyoti', 'Archana', 'Seema', 'Neelam', 'Poonam',
            'Mamta', 'Ruchi', 'Sapna', 'Garima', 'Monika', 'Divya', 'Shilpa', 'Vandana', 'Aarti', 'Sangeeta', 'Richa', 'Anamika', 'Nidhi', 'Ankita', 'Megha', 'Priyanka', 'Sakshi', 'Komal', 'Payal', 'Rinki'],
          nova: ['Aadhya', 'Ananya', 'Saanvi', 'Myra', 'Aaradhya', 'Pari', 'Anika', 'Navya', 'Diya', 'Kiara', 'Siya', 'Riya', 'Ishita', 'Avni', 'Prisha', 'Shanaya', 'Kavya', 'Tanvi', 'Anvi', 'Aditi',
            'Khushi', 'Shreya', 'Muskan', 'Nandini', 'Sneha', 'Tanya', 'Radhika', 'Simran', 'Vanshika', 'Palak', 'Isha', 'Mahi', 'Kritika', 'Sanya', 'Mansi', 'Prachi', 'Akanksha', 'Shivani', 'Srishti', 'Jiya']
        },
        sobrenomes: ['Sharma', 'Verma', 'Gupta', 'Singh', 'Yadav', 'Kumar', 'Mishra', 'Tiwari', 'Pandey', 'Shukla',
          'Dubey', 'Chauhan', 'Rajput', 'Prasad', 'Jha', 'Srivastava', 'Agarwal', 'Saxena', 'Tripathi', 'Upadhyay',
          'Chaudhary', 'Maurya', 'Kushwaha', 'Paswan', 'Ram', 'Jatav', 'Rawat', 'Rathore', 'Thakur', 'Sinha',
          'Pathak', 'Dwivedi', 'Awasthi', 'Bansal', 'Goel', 'Mittal', 'Nishad', 'Kashyap', 'Prajapati', 'Lal',
          'Raj', 'Bharti', 'Gautam', 'Valmiki', 'Baghel', 'Meena', 'Mahto', 'Rai', 'Ojha', 'Chaurasia']
      },
      {
        // Muçulmanos do norte e do Decão (UP, Bihar, Délhi, Hyderabad, Mumbai...): nomes urdus.
        id: 'muculmano_norte',
        peso: 0.09,
        divisoes: ['UP', 'BR', 'DL', 'TS', 'MH', 'GJ', 'JH', 'KA'],
        sobrenome: 'um',
        masc: {
          antiga: ['Mohammad', 'Abdul', 'Ahmad', 'Mohammad Ali', 'Abdul Rashid', 'Abdul Hamid', 'Abdul Aziz', 'Mohammad Yusuf', 'Ishaq', 'Ibrahim', 'Ismail', 'Rafiq', 'Shafiq', 'Iqbal', 'Anwar', 'Jamil', 'Nasir', 'Zafar', 'Basheer', 'Hanif',
            'Mushtaq', 'Nazir', 'Rashid', 'Saleem', 'Majid', 'Zahid', 'Abdul Ghani', 'Usman', 'Yaqub', 'Sharafat'],
          meio: ['Imran', 'Salman', 'Irfan', 'Wasim', 'Javed', 'Sajid', 'Shahid', 'Faisal', 'Arif', 'Asif', 'Tariq', 'Aamir', 'Shoaib', 'Danish', 'Nadeem', 'Sameer', 'Zubair', 'Rizwan', 'Naved', 'Kamran',
            'Fahad', 'Junaid', 'Sohail', 'Shakeel', 'Mohsin', 'Altaf', 'Azhar', 'Feroz', 'Yasir', 'Adil'],
          nova: ['Ayaan', 'Arhaan', 'Rehan', 'Zayan', 'Ahil', 'Huzaifa', 'Zaid', 'Arham', 'Rayyan', 'Faiz', 'Saad', 'Hamza', 'Abdullah', 'Umar', 'Ali', 'Ibrahim', 'Yusuf', 'Anas', 'Arsalan', 'Shayan',
            'Taha', 'Ahad', 'Azaan', 'Faizan', 'Saif', 'Alfaz', 'Arish']
        },
        fem: {
          antiga: ['Fatima', 'Khatoon', 'Zubaida', 'Hajra', 'Ameena', 'Akhtari', 'Mehrunnisa', 'Naseem', 'Zainab', 'Rabia', 'Sakina', 'Saira', 'Shamim', 'Hamida', 'Kulsum', 'Bilquis', 'Razia', 'Sughra', 'Kaneez', 'Nafisa',
            'Zohra', 'Jamila', 'Shahida', 'Mumtaz', 'Ruqaiya', 'Asghari'],
          meio: ['Shabana', 'Nazia', 'Rukhsana', 'Farzana', 'Shaheen', 'Nasreen', 'Rubina', 'Sadaf', 'Shabnam', 'Uzma', 'Saba', 'Farheen', 'Asma', 'Huma', 'Nikhat', 'Tabassum', 'Yasmin', 'Rehana', 'Shazia', 'Nusrat',
            'Afreen', 'Sana', 'Heena', 'Bushra', 'Gulnaz', 'Zeba', 'Ishrat', 'Naaz'],
          nova: ['Aliya', 'Inaya', 'Zoya', 'Alina', 'Ayat', 'Hiba', 'Mahira', 'Anaya', 'Sara', 'Zara', 'Aiza', 'Hania', 'Mehak', 'Rida', 'Iqra', 'Areeba', 'Fiza', 'Alisha', 'Afiya', 'Insha',
            'Maryam', 'Ayesha', 'Khadija', 'Zainab', 'Sidra', 'Amna', 'Arshi']
        },
        sobrenomes: ['Khan', 'Ansari', 'Qureshi', 'Siddiqui', 'Syed', 'Mirza', 'Pathan', 'Hussain', 'Rizvi', 'Naqvi',
          'Zaidi', 'Abbasi', 'Farooqui', 'Usmani', 'Alvi', 'Hashmi', 'Malik', 'Beg', 'Jafri', 'Kazmi',
          'Saifi', 'Salmani', 'Mansuri', 'Qadri', 'Chishti', 'Idrisi', 'Raza', 'Iqbal', 'Rahmani', 'Mulla',
          'Bukhari', 'Gilani', 'Lodhi', 'Chaudhry', 'Momin', 'Tamboli', 'Inamdar', 'Sayyad', 'Pasha', 'Hakim',
          'Warsi', 'Nizami']
      },
      {
        id: 'bengali',
        peso: 0.06,
        divisoes: ['WB'],
        sobrenome: 'um',
        masc: {
          antiga: ['Subhas', 'Nirmal', 'Amal', 'Bimal', 'Kamal', 'Gopal', 'Haridas', 'Sukumar', 'Tapan', 'Swapan', 'Prabir', 'Pranab', 'Dilip', 'Ashok', 'Asit', 'Sunil', 'Ajit', 'Shyamal', 'Nemai', 'Gour',
            'Ranjit', 'Prafulla', 'Bijoy', 'Sudhir', 'Manik', 'Satyen', 'Biren', 'Rabindra', 'Nitai', 'Debabrata', 'Hiranmoy'],
          meio: ['Arindam', 'Sourav', 'Subhajit', 'Debashis', 'Partha', 'Abhijit', 'Indranil', 'Arnab', 'Sayan', 'Anirban', 'Sandip', 'Biswajit', 'Tanmoy', 'Somnath', 'Rajib', 'Subrata', 'Prasenjit', 'Kaushik', 'Suman', 'Amitava',
            'Joydeep', 'Pritam', 'Supriyo', 'Sudipta', 'Avijit', 'Dipankar', 'Saikat', 'Sujoy', 'Debojyoti', 'Rana'],
          nova: ['Aritra', 'Ayan', 'Rishi', 'Ishaan', 'Aniruddha', 'Swarnava', 'Rohan', 'Arka', 'Shubham', 'Sayantan', 'Arijit', 'Ritwik', 'Soham', 'Anik', 'Debarghya', 'Rudranil', 'Shreyan', 'Ahan', 'Neel', 'Ayush',
            'Sounak', 'Pratyush', 'Agnibha', 'Satyaki', 'Rajdeep', 'Tathagata', 'Abir', 'Anurag']
        },
        fem: {
          antiga: ['Kalyani', 'Manju', 'Gita', 'Anjali', 'Sabita', 'Kalpana', 'Basanti', 'Lakshmi', 'Sandhya', 'Aparna', 'Bina', 'Chhaya', 'Gouri', 'Jharna', 'Kabita', 'Maya', 'Minati', 'Namita', 'Nilima', 'Pratima',
            'Purnima', 'Rina', 'Sabitri', 'Shefali', 'Shila', 'Tapati', 'Uma', 'Arati', 'Bela', 'Dipali', 'Malati', 'Swapna'],
          meio: ['Moumita', 'Sushmita', 'Rupa', 'Mitali', 'Sharmistha', 'Priyanka', 'Debjani', 'Sanchita', 'Tanushree', 'Payel', 'Sudeshna', 'Mousumi', 'Paromita', 'Rituparna', 'Swati', 'Soma', 'Jayeeta', 'Piyali', 'Madhumita', 'Sreeparna',
            'Nabanita', 'Sutapa', 'Rimpa', 'Tumpa', 'Dipanwita', 'Arpita', 'Keya', 'Barnali'],
          nova: ['Srijita', 'Ishani', 'Aishani', 'Riya', 'Trisha', 'Adrija', 'Anushka', 'Shreyashi', 'Sohini', 'Debolina', 'Rimjhim', 'Oindrila', 'Meghna', 'Ahana', 'Raima', 'Sanjana', 'Puja', 'Snigdha', 'Titir', 'Rupsa',
            'Sreejita', 'Tiyasha', 'Mohona', 'Antara', 'Arundhati', 'Brishti', 'Kheya', 'Ankita']
        },
        sobrenomes: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Bhattacharya', 'Ganguly', 'Chakraborty', 'Ghosh', 'Bose', 'Sen', 'Dutta',
          'Das', 'Mondal', 'Saha', 'Paul', 'Roy', 'Sarkar', 'Biswas', 'Majumdar', 'Guha', 'Pal',
          'Nandi', 'Kar', 'Dey', 'Halder', 'Naskar', 'Bag', 'Barman', 'Mitra', 'Basu', 'Sengupta',
          'Dasgupta', 'Bhowmik', 'Maity', 'Jana', 'Pramanik', 'Samanta', 'Chowdhury', 'Adhikari', 'Debnath', 'Kundu']
      },
      {
        // Muçulmanos de Bengala (e de Assam, fora do mapa do perfil).
        id: 'muculmano_bengala',
        peso: 0.03,
        divisoes: ['WB'],
        sobrenome: 'um',
        masc: {
          antiga: ['Abdul', 'Mohammad', 'Abdur Rahman', 'Aminul', 'Nurul', 'Rafiqul', 'Sirajul', 'Jalal', 'Kamal Uddin', 'Abul', 'Fazlul', 'Jahangir', 'Habibur', 'Mujibur', 'Anwar', 'Shamsul', 'Abdul Karim', 'Abdul Majid', 'Nazrul', 'Mozammel',
            'Golam', 'Moslem', 'Idris', 'Lutfar', 'Azizul', 'Mofizul'],
          meio: ['Rafikul', 'Saiful', 'Monirul', 'Mizanur', 'Shahidul', 'Ashraful', 'Rezaul', 'Jahirul', 'Kamrul', 'Masud', 'Faruk', 'Raju', 'Sohel', 'Mamun', 'Mostafa', 'Nasir', 'Imran', 'Habib', 'Salim', 'Arif',
            'Babul', 'Jakir', 'Tariqul', 'Hasan', 'Manirul', 'Sahidul'],
          nova: ['Ayaan', 'Arham', 'Rehan', 'Ariyan', 'Tanvir', 'Sakib', 'Rakib', 'Arafat', 'Irfan', 'Ahnaf', 'Fahim', 'Rayhan', 'Zaid', 'Nayeem', 'Sabbir', 'Ashik', 'Riyaz', 'Sahil', 'Mehedi', 'Tamim',
            'Junaid', 'Faizan', 'Sohan', 'Abrar', 'Rihan', 'Ishan']
        },
        fem: {
          antiga: ['Rahima', 'Fatema', 'Jahanara', 'Rokeya', 'Amena', 'Hasina', 'Majeda', 'Saleha', 'Khadija', 'Sufia', 'Nurjahan', 'Rabeya', 'Hamida', 'Asma', 'Monowara', 'Feroza', 'Shahida', 'Zubeda', 'Halima', 'Anowara',
            'Jamila', 'Sakina', 'Rashida', 'Marium', 'Taslima', 'Ayesha'],
          meio: ['Nasrin', 'Shahnaz', 'Salma', 'Rubina', 'Shirin', 'Parvin', 'Sabina', 'Rehana', 'Nazma', 'Rumana', 'Reshma', 'Ferdousi', 'Momtaz', 'Sultana', 'Sahana', 'Rojina', 'Hasnara', 'Jesmin', 'Nilufar', 'Shabnam',
            'Farida', 'Laila', 'Mahfuza', 'Nasima', 'Tahmina', 'Mousumi'],
          nova: ['Tasnim', 'Nusrat', 'Sumaiya', 'Jannat', 'Mahi', 'Afrin', 'Sadia', 'Fatima', 'Mariya', 'Raisa', 'Sana', 'Muskan', 'Tamanna', 'Nafisa', 'Sabiha', 'Anika', 'Zara', 'Samira', 'Lamia', 'Mehjabin',
            'Ruksana', 'Sharmin', 'Hafsa', 'Rimi', 'Tahsin', 'Ayesha']
        },
        sobrenomes: ['Sheikh', 'Shaikh', 'Mollah', 'Molla', 'Rahman', 'Rahaman', 'Hossain', 'Hossen', 'Ali', 'Islam',
          'Ahmed', 'Laskar', 'Gazi', 'Mia', 'Miah', 'Haque', 'Haq', 'Uddin', 'Sardar', 'Mallick',
          'Barbhuiya', 'Mazumder', 'Talukdar', 'Akhtar', 'Kabir', 'Karim', 'Siddique', 'Mahmud', 'Alam', 'Jamadar',
          'Kazi', 'Munshi', 'Mridha', 'Bhuiyan', 'Fakir', 'Dewan', 'Amin', 'Bari', 'Khandakar', 'Joarder', 'Paik']
      },
      {
        id: 'marati',
        peso: 0.065,
        divisoes: ['MH'],
        sobrenome: 'um',
        masc: {
          antiga: ['Vasant', 'Prabhakar', 'Madhukar', 'Sudhakar', 'Dattatray', 'Vitthal', 'Pandurang', 'Shankar', 'Narayan', 'Ganpat', 'Balasaheb', 'Sakharam', 'Yashwant', 'Shivaji', 'Bhaskar', 'Dinkar', 'Sadashiv', 'Anant', 'Vishwas', 'Ramchandra',
            'Hanmant', 'Baburao', 'Maruti', 'Dnyaneshwar', 'Vinayak', 'Shrikant', 'Arvind', 'Ashok', 'Suresh'],
          meio: ['Sachin', 'Rahul', 'Amol', 'Sandeep', 'Nilesh', 'Sagar', 'Prashant', 'Mahesh', 'Santosh', 'Swapnil', 'Yogesh', 'Nitin', 'Tushar', 'Ganesh', 'Vishal', 'Abhijit', 'Kedar', 'Rohan', 'Mangesh', 'Sameer',
            'Ajinkya', 'Shailesh', 'Hemant', 'Sunil', 'Prasad', 'Aniket', 'Pravin', 'Dhananjay', 'Umesh', 'Akshay'],
          nova: ['Arnav', 'Aarav', 'Vedant', 'Shlok', 'Soham', 'Atharva', 'Om', 'Arjun', 'Advait', 'Shreyas', 'Aditya', 'Parth', 'Rudra', 'Yash', 'Viraj', 'Tanmay', 'Shaurya', 'Vihaan', 'Ishaan', 'Aryan',
            'Kunal', 'Pranav', 'Siddharth', 'Manas', 'Rishikesh', 'Chinmay']
        },
        fem: {
          antiga: ['Sulochana', 'Sumati', 'Shalini', 'Shobha', 'Kusum', 'Indira', 'Mangala', 'Sindhu', 'Shantabai', 'Anusaya', 'Radhabai', 'Sarita', 'Vimal', 'Kamal', 'Nanda', 'Leela', 'Usha', 'Sunanda', 'Mandakini', 'Prabha',
            'Sushma', 'Lata', 'Jyotsna', 'Malati', 'Suman', 'Nalini', 'Shakuntala', 'Vatsala', 'Parvati'],
          meio: ['Vaishali', 'Snehal', 'Pooja', 'Supriya', 'Manisha', 'Shital', 'Swati', 'Prajakta', 'Ashwini', 'Rupali', 'Sayali', 'Madhuri', 'Priyanka', 'Shraddha', 'Anagha', 'Archana', 'Deepali', 'Jyoti', 'Kavita', 'Mrunal',
            'Neha', 'Pallavi', 'Rasika', 'Sonali', 'Tejaswini', 'Varsha', 'Ketaki', 'Gauri', 'Amruta', 'Smita'],
          nova: ['Saee', 'Anvi', 'Gargi', 'Ira', 'Mrunmayee', 'Rutuja', 'Sanika', 'Shravani', 'Isha', 'Swara', 'Tanvi', 'Mitali', 'Siddhi', 'Sakshi', 'Aditi', 'Ovi', 'Spruha', 'Kimaya', 'Vedika', 'Manasi',
            'Shruti', 'Prachi', 'Riddhi', 'Anushka', 'Janhavi', 'Ishwari']
        },
        sobrenomes: ['Patil', 'Pawar', 'Jadhav', 'Shinde', 'Deshmukh', 'Kulkarni', 'Deshpande', 'Joshi', 'Gaikwad', 'Kale',
          'More', 'Chavan', 'Salunkhe', 'Kadam', 'Bhosale', 'Mane', 'Sawant', 'Gokhale', 'Apte', 'Gadgil',
          'Phadke', 'Ranade', 'Bhide', 'Karve', 'Mahajan', 'Wagh', 'Shelke', 'Kamble', 'Gawande', 'Nikam',
          'Ghorpade', 'Mohite', 'Lokhande', 'Waghmare', 'Sonawane', 'Kshirsagar', 'Dhumal', 'Gore', 'Thorat', 'Raut',
          'Shirke', 'Kharat', 'Nalawade', 'Bhandari']
      },
      {
        id: 'guzerate',
        peso: 0.045,
        divisoes: ['GJ'],
        sobrenome: 'um',
        masc: {
          antiga: ['Ramanlal', 'Chimanlal', 'Mohanlal', 'Natvarlal', 'Kantilal', 'Jayantilal', 'Dhirubhai', 'Manubhai', 'Jashvant', 'Pravin', 'Kanaiyalal', 'Harilal', 'Bhagwandas', 'Kishor', 'Mahendra', 'Navin', 'Bharat', 'Dinesh', 'Vasant', 'Arvind',
            'Chandrakant', 'Govind', 'Hasmukh', 'Jitendra', 'Prabhudas', 'Shantilal', 'Ishwarlal'],
          meio: ['Hitesh', 'Jignesh', 'Ketan', 'Mehul', 'Nilesh', 'Paresh', 'Bhavesh', 'Chirag', 'Darshan', 'Hardik', 'Kalpesh', 'Mitesh', 'Nirav', 'Piyush', 'Rakesh', 'Sanjay', 'Tejas', 'Viral', 'Chetan', 'Dhaval',
            'Jayesh', 'Kunal', 'Manish', 'Pratik', 'Rupesh', 'Sagar', 'Umang', 'Vipul', 'Alpesh', 'Bhavin'],
          nova: ['Dev', 'Het', 'Jash', 'Krish', 'Vivaan', 'Aarav', 'Aayush', 'Dhruv', 'Harsh', 'Jeet', 'Meet', 'Neel', 'Om', 'Parth', 'Rudra', 'Shlok', 'Tirth', 'Vedant', 'Yug', 'Jainil',
            'Dhyey', 'Hriday', 'Kathan', 'Manan', 'Nihar', 'Prem', 'Smit', 'Vraj']
        },
        fem: {
          antiga: ['Kokila', 'Hansa', 'Manjula', 'Sharda', 'Jayshree', 'Pushpa', 'Kanchan', 'Indira', 'Savita', 'Sarla', 'Taraben', 'Lilaben', 'Kantaben', 'Ramila', 'Bhanumati', 'Champa', 'Shanta', 'Vimla', 'Nirmala', 'Jasumati',
            'Pramila', 'Hemlata', 'Kamla', 'Sushila', 'Madhu', 'Usha', 'Daxa', 'Induben'],
          meio: ['Hetal', 'Bhavna', 'Falguni', 'Komal', 'Krupa', 'Mittal', 'Nehal', 'Payal', 'Riddhi', 'Shital', 'Trupti', 'Urvashi', 'Disha', 'Dimple', 'Ekta', 'Foram', 'Hiral', 'Jagruti', 'Khyati', 'Mansi',
            'Nidhi', 'Pinal', 'Rinkal', 'Sejal', 'Vaishali', 'Zalak', 'Hemali', 'Kinjal'],
          nova: ['Dhruvi', 'Diya', 'Hetvi', 'Jinal', 'Kavya', 'Khushi', 'Krisha', 'Mahi', 'Nisha', 'Prisha', 'Riya', 'Saloni', 'Shreya', 'Vrunda', 'Yashvi', 'Dhwani', 'Heer', 'Isha', 'Janvi', 'Kriti',
            'Mira', 'Nirali', 'Palak', 'Rutvi', 'Tanvi', 'Vidhi', 'Aanya', 'Bansari']
        },
        sobrenomes: ['Patel', 'Shah', 'Mehta', 'Desai', 'Parikh', 'Trivedi', 'Vyas', 'Bhatt', 'Pandya', 'Dave',
          'Thakkar', 'Modi', 'Solanki', 'Parmar', 'Rathod', 'Vaghela', 'Jadeja', 'Makwana', 'Chaudhari', 'Gandhi',
          'Contractor', 'Dalal', 'Kapadia', 'Sheth', 'Doshi', 'Gohil', 'Zala', 'Raval', 'Panchal', 'Mistry',
          'Soni', 'Darji', 'Bhavsar', 'Oza', 'Acharya', 'Jani', 'Vora', 'Majmudar', 'Barot', 'Chokshi', 'Kotecha', 'Thaker']
      },
      {
        // Tâmeis: boa parte não usa sobrenome de família — usa a inicial do
        // pai antes do nome ("R. Karthik") ou o prenome do pai depois. O jogo
        // abstrai num nome fixo pela linha paterna, tirado dos prenomes
        // masculinos que servem de patronímico (e de alguns títulos de família
        // ainda usados, como Iyer ou Nadar).
        id: 'tamil',
        peso: 0.058,
        divisoes: ['TN'],
        sobrenome: 'um',
        masc: {
          antiga: ['Murugan', 'Subramanian', 'Ramasamy', 'Krishnan', 'Palani', 'Velu', 'Muthu', 'Selvam', 'Arumugam', 'Kandasamy', 'Perumal', 'Rajendran', 'Natarajan', 'Shanmugam', 'Govindasamy', 'Chinnasamy', 'Mani', 'Duraisamy', 'Ponnusamy', 'Sundaram',
            'Raman', 'Kannan', 'Ganesan', 'Pandian', 'Annamalai', 'Sivaraman', 'Thangavel', 'Balakrishnan', 'Venkatesan', 'Karuppasamy'],
          meio: ['Karthik', 'Senthil', 'Saravanan', 'Prakash', 'Vijay', 'Arun', 'Suresh', 'Ramesh', 'Dinesh', 'Manikandan', 'Sathish', 'Senthil Kumar', 'Rajesh', 'Balaji', 'Gopi', 'Siva', 'Vignesh', 'Prabhu', 'Ashok', 'Anand',
            'Bharath', 'Gowtham', 'Hari', 'Kumaran', 'Madhan', 'Naveen', 'Raja', 'Sridhar', 'Vinoth', 'Ezhil'],
          nova: ['Aadhav', 'Kavin', 'Mithran', 'Adhithya', 'Akilan', 'Arjun', 'Ashwin', 'Dhanush', 'Harish', 'Kishore', 'Mugilan', 'Nithin', 'Pranav', 'Rithvik', 'Sanjay', 'Shravan', 'Surya', 'Tharun', 'Vetri', 'Yuvan',
            'Iniyan', 'Kaviyan', 'Elango', 'Nilavan', 'Sai', 'Vishal', 'Dharshan', 'Rohith']
        },
        fem: {
          antiga: ['Lakshmi', 'Saraswathi', 'Meenakshi', 'Kamala', 'Valli', 'Muthulakshmi', 'Parvathi', 'Pushpa', 'Rajeswari', 'Vasantha', 'Sarojini', 'Thilagavathi', 'Chellammal', 'Rukmani', 'Kannagi', 'Saroja', 'Janaki', 'Ponni', 'Selvi', 'Amudha',
            'Mallika', 'Indira', 'Padmavathi', 'Vijaya', 'Jayalakshmi', 'Sakunthala', 'Mariammal', 'Kaliammal', 'Annapoorani', 'Bhagyalakshmi'],
          meio: ['Priya', 'Divya', 'Kavitha', 'Sangeetha', 'Deepa', 'Revathi', 'Lavanya', 'Gayathri', 'Anitha', 'Sumathi', 'Vidhya', 'Nithya', 'Shanthi', 'Uma', 'Malathi', 'Bhuvana', 'Jayanthi', 'Kalaivani', 'Mahalakshmi', 'Nandhini',
            'Preethi', 'Radhika', 'Saranya', 'Sowmya', 'Suganya', 'Tamilselvi', 'Vanitha', 'Yamuna', 'Ramya', 'Sindhu'],
          nova: ['Yazhini', 'Iniya', 'Nila', 'Kaviya', 'Thanya', 'Aishwarya', 'Akshaya', 'Dharshini', 'Harini', 'Janani', 'Keerthana', 'Madhumitha', 'Monisha', 'Nivetha', 'Pavithra', 'Sandhiya', 'Shalini', 'Shruthi', 'Swetha', 'Varsha',
            'Yuvashree', 'Kayal', 'Mathi', 'Ilakkiya', 'Oviya', 'Sahana', 'Tharani', 'Abinaya']
        },
        sobrenomes: ['Murugan', 'Subramanian', 'Ramasamy', 'Krishnamoorthy', 'Rajendran', 'Kannan', 'Selvaraj', 'Natarajan', 'Shanmugam', 'Arumugam',
          'Raman', 'Venkatesan', 'Balasubramanian', 'Srinivasan', 'Ganesan', 'Palanisamy', 'Govindan', 'Perumal', 'Sundaram', 'Pandian',
          'Chandrasekaran', 'Elangovan', 'Rajasekaran', 'Muthusamy', 'Velusamy', 'Anbalagan', 'Sivakumar', 'Jayaraman', 'Thangaraj', 'Duraisamy',
          'Sekar', 'Kumaravel', 'Saravanan', 'Kandasamy', 'Annamalai', 'Ponnusamy', 'Karuppiah', 'Ramalingam', 'Mariappan', 'Nagarajan',
          'Paramasivam', 'Kathiresan', 'Iyer', 'Nadar', 'Chettiar']
      },
      {
        // Télugos: o "intiperu" (nome da casa) costuma vir antes do prenome; aqui, como sobrenome.
        id: 'telugo',
        peso: 0.065,
        divisoes: ['TS'],
        sobrenome: 'um',
        masc: {
          antiga: ['Venkateswara Rao', 'Satyanarayana', 'Subba Rao', 'Rama Rao', 'Narasimha', 'Venkata Ramana', 'Srinivasa Rao', 'Koteswara Rao', 'Nageswara Rao', 'Raghavendra', 'Sambasiva Rao', 'Hanumantha Rao', 'Krishna Murthy', 'Ramaiah', 'Venkaiah', 'Chandra Sekhar', 'Appa Rao', 'Sriramulu', 'Mallikarjuna', 'Ramakrishna',
            'Gopala Krishna', 'Veeraiah', 'Lakshmana', 'Bhaskara Rao', 'Seetharamaiah', 'Narayana', 'Purushotham'],
          meio: ['Srinivas', 'Ravi Kumar', 'Ramesh', 'Suresh', 'Naresh', 'Venkatesh', 'Kiran', 'Praveen', 'Mahesh', 'Nagaraju', 'Ravi Teja', 'Srikanth', 'Sudheer', 'Prasanth', 'Raju', 'Vamsi', 'Pavan', 'Chaitanya', 'Anil', 'Sandeep',
            'Kishore', 'Murali', 'Satish', 'Sai Kumar', 'Rajesh', 'Phani', 'Harish', 'Krishna Chaitanya', 'Sunil'],
          nova: ['Sai Charan', 'Akhil', 'Rohith', 'Charan', 'Karthikeya', 'Abhiram', 'Sathvik', 'Varun', 'Nikhil', 'Arjun', 'Teja', 'Manish', 'Vishnu', 'Aakash', 'Harsha', 'Sai Teja', 'Lohith', 'Revanth', 'Rishi', 'Vihaan',
            'Advik', 'Hrithik', 'Jashwanth', 'Yashwanth', 'Dheeraj', 'Pranav', 'Shanmukh']
        },
        fem: {
          antiga: ['Lakshmi', 'Saraswathi', 'Venkata Lakshmi', 'Annapurna', 'Satyavathi', 'Kamala', 'Padmavathi', 'Sita', 'Durga', 'Rajyalakshmi', 'Nagamani', 'Varalakshmi', 'Subbalakshmi', 'Anasuya', 'Sarojini', 'Bhagya', 'Kanaka', 'Sujatha', 'Vijayalakshmi', 'Krishnaveni',
            'Ratnam', 'Suseela', 'Sarada', 'Seshamma', 'Ramanamma', 'Mangamma', 'Jayamma', 'Pushpavathi'],
          meio: ['Swapna', 'Lavanya', 'Sravani', 'Anusha', 'Madhavi', 'Sirisha', 'Haritha', 'Sowjanya', 'Bhavani', 'Divya', 'Radhika', 'Sailaja', 'Sunitha', 'Padmaja', 'Rajitha', 'Jyothi', 'Prasanna', 'Sandhya', 'Hemalatha', 'Deepthi',
            'Mounika', 'Swathi', 'Sravanthi', 'Kalyani', 'Naga Lakshmi', 'Aruna', 'Usha Rani', 'Vani', 'Spandana'],
          nova: ['Sahithi', 'Harshitha', 'Lasya', 'Sri Vidya', 'Akshara', 'Bhavya', 'Deeksha', 'Geethika', 'Hasini', 'Keerthi', 'Manasa', 'Nandini', 'Pranathi', 'Rishika', 'Sanjana', 'Sathvika', 'Sreeja', 'Tejaswi', 'Varshini', 'Vyshnavi',
            'Navya', 'Aadhya', 'Ishitha', 'Likhitha', 'Meghana', 'Niharika', 'Pooja', 'Sindhu']
        },
        sobrenomes: ['Reddy', 'Rao', 'Naidu', 'Chowdary', 'Raju', 'Varma', 'Sastry', 'Goud', 'Murthy', 'Achari',
          'Setty', 'Babu', 'Kondapalli', 'Gaddam', 'Bandi', 'Vemula', 'Kotha', 'Peddi', 'Boddu', 'Mallela',
          'Chinta', 'Nallapati', 'Yarlagadda', 'Gorantla', 'Kambhampati', 'Talluri', 'Ponnam', 'Akula', 'Mekala', 'Thota',
          'Madala', 'Kakarla', 'Uppala', 'Gudla', 'Kasturi', 'Bollam', 'Desu', 'Gajula', 'Nayani', 'Allu', 'Dasari', 'Pulla']
      },
      {
        id: 'canarim',
        peso: 0.037,
        divisoes: ['KA'],
        sobrenome: 'um',
        masc: {
          antiga: ['Basavaraj', 'Mallikarjun', 'Shivappa', 'Nagaraj', 'Ramappa', 'Hanumanthappa', 'Puttaswamy', 'Siddappa', 'Channabasappa', 'Rangaswamy', 'Krishnappa', 'Venkatesh', 'Shankarappa', 'Rudrappa', 'Gangadhar', 'Chandrashekar', 'Narasimha Murthy', 'Shivakumar', 'Lingaraj', 'Nanjundaiah',
            'Thimmaiah', 'Govindaraju', 'Ramaiah', 'Mahadevappa', 'Eranna', 'Bhimappa', 'Nagesh'],
          meio: ['Manjunath', 'Raghavendra', 'Prashanth', 'Santosh', 'Girish', 'Mahesh', 'Naveen', 'Pradeep', 'Shashidhar', 'Ravi', 'Harish', 'Sunil', 'Kiran', 'Vinay', 'Shivaraj', 'Chethan', 'Darshan', 'Lokesh', 'Mohan', 'Praveen',
            'Raghu', 'Sachin', 'Sandesh', 'Shrinivas', 'Umesh', 'Vijay', 'Yogesh', 'Anand', 'Guru', 'Nagendra'],
          nova: ['Advik', 'Chirag', 'Dhruva', 'Gagan', 'Hemanth', 'Karthik', 'Nihal', 'Pranav', 'Rakshith', 'Rohan', 'Samarth', 'Shreyas', 'Skanda', 'Tejas', 'Varun', 'Vishwas', 'Yashas', 'Aarav', 'Abhay', 'Aditya',
            'Chinmay', 'Kushal', 'Manvith', 'Pruthvi', 'Sharath', 'Tanish', 'Vihaan']
        },
        fem: {
          antiga: ['Lakshmamma', 'Gowramma', 'Sarojamma', 'Parvathamma', 'Puttamma', 'Jayamma', 'Nagamma', 'Shantamma', 'Kamalamma', 'Saraswati', 'Sharadamma', 'Gangamma', 'Rathnamma', 'Leelavathi', 'Susheelamma', 'Kempamma', 'Yashodha', 'Shivamma', 'Venkatamma', 'Sulochana',
            'Savitramma', 'Akkamma', 'Neelamma', 'Chennamma', 'Rukmini', 'Gowri', 'Hemavathi', 'Mahadevamma'],
          meio: ['Shilpa', 'Pavithra', 'Rashmi', 'Shwetha', 'Deepa', 'Kavya', 'Sowmya', 'Vidya', 'Asha', 'Bhavya', 'Chaitra', 'Divya', 'Geetha', 'Harini', 'Jyothi', 'Lakshmi', 'Manjula', 'Nandini', 'Pallavi', 'Ramya',
            'Roopa', 'Sahana', 'Shruthi', 'Sneha', 'Sudha', 'Supriya', 'Usha', 'Veena', 'Vinutha', 'Yashaswini'],
          nova: ['Aditi', 'Akshatha', 'Anika', 'Bhoomika', 'Chandana', 'Disha', 'Hamsini', 'Inchara', 'Ishika', 'Keerthana', 'Khushi', 'Lekhana', 'Meghana', 'Nidhi', 'Prakruthi', 'Rakshitha', 'Samhitha', 'Sinchana', 'Spoorthi', 'Shreya',
            'Tanvi', 'Vaishnavi', 'Varsha', 'Yukta', 'Navya', 'Ananya', 'Kavana', 'Thanvi']
        },
        sobrenomes: ['Gowda', 'Shetty', 'Hegde', 'Bhat', 'Kamath', 'Pai', 'Aithal', 'Adiga', 'Karanth', 'Kini',
          'Upadhya', 'Holla', 'Tantri', 'Poojary', 'Bangera', 'Salian', 'Suvarna', 'Kotian', 'Kunder', 'Shettigar',
          'Devadiga', 'Hiremath', 'Kalburgi', 'Angadi', 'Hosamani', 'Badiger', 'Kambar', 'Kattimani', 'Hugar', 'Doddamani',
          'Biradar', 'Chalavadi', 'Ballal', 'Alva', 'Ramaiah', 'Siddaiah', 'Lingaiah', 'Thimmaiah', 'Nanjappa', 'Basappa', 'Byrappa', 'Gowdar']
      },
      {
        // Malaialas hindus e cristãos (sírio-malabares e latinos): muitos usam o
        // nome da casa ou o do pai; aqui, os sobrenomes de família correntes.
        id: 'malaiala',
        peso: 0.022,
        divisoes: ['KL'],
        sobrenome: 'um',
        masc: {
          antiga: ['Gopalan', 'Raghavan', 'Narayanan', 'Kunjiraman', 'Madhavan', 'Sankaran', 'Velayudhan', 'Balan', 'Bhaskaran', 'Chandran', 'Damodaran', 'Gangadharan', 'Kesavan', 'Kuttan', 'Padmanabhan', 'Sreedharan', 'Vasudevan', 'Varghese', 'Thomas', 'Joseph',
            'Mathai', 'Ouseph', 'Kurian', 'Chacko', 'Itty', 'Devassy', 'Pappachan', 'Kunjumon', 'Mathew', 'Raman Kutty'],
          meio: ['Anil Kumar', 'Sunil', 'Biju', 'Shaji', 'Sajeev', 'Rajeev', 'Santhosh', 'Pradeep', 'Manoj', 'Vinod', 'Ajith', 'Sreejith', 'Sanjay', 'Sujith', 'Jijo', 'Jinu', 'Tomy', 'Jobin', 'Shibu', 'Bijoy',
            'Sabu', 'Renjith', 'Unnikrishnan', 'Praveen', 'Arun', 'Vipin', 'Rahul', 'Sreekumar', 'Jose', 'Binu'],
          nova: ['Aadhi', 'Abhinav', 'Adarsh', 'Advaith', 'Akash', 'Alan', 'Alwin', 'Amal', 'Arjun', 'Aswin', 'Athul', 'Christo', 'Devanand', 'Ebin', 'Gokul', 'Hrithik', 'Jithin', 'Joel', 'Karthik', 'Midhun',
            'Navaneeth', 'Nikhil', 'Rohan', 'Sachin', 'Sidharth', 'Vaishnav', 'Vishnu', 'Ethan', 'Aaron', 'Abel']
        },
        fem: {
          antiga: ['Kalyani', 'Kamalakshi', 'Janaki', 'Lakshmikutty', 'Devaki', 'Bhargavi', 'Kausalya', 'Ammini', 'Parukutty', 'Sarada', 'Sathi', 'Thankamma', 'Mariamma', 'Annamma', 'Aleyamma', 'Thresiamma', 'Rosamma', 'Saramma', 'Kunjamma', 'Achamma',
            'Eliyamma', 'Chinnamma', 'Omana', 'Leela', 'Sulochana', 'Radha', 'Sreedevi', 'Meenakshi'],
          meio: ['Bindu', 'Sindhu', 'Lekha', 'Smitha', 'Sreeja', 'Divya', 'Remya', 'Deepa', 'Asha', 'Jincy', 'Soumya', 'Reshma', 'Anju', 'Sheeba', 'Beena', 'Mini', 'Jaya', 'Sajitha', 'Sruthi', 'Neethu',
            'Liji', 'Shiny', 'Tintu', 'Ambily', 'Rekha', 'Saritha', 'Preetha', 'Sheeja', 'Bincy', 'Jisha'],
          nova: ['Aathira', 'Anagha', 'Anjana', 'Ann Maria', 'Anusree', 'Aparna', 'Archana', 'Athira', 'Ameya', 'Devika', 'Diya', 'Gayathri', 'Gopika', 'Krishnapriya', 'Lakshmi', 'Malavika', 'Meenakshi', 'Nandana', 'Neha', 'Riya',
            'Sneha', 'Sreelakshmi', 'Theertha', 'Vaiga', 'Varsha', 'Anaswara', 'Aleena', 'Christeena', 'Evana', 'Ann Mary']
        },
        sobrenomes: ['Nair', 'Menon', 'Pillai', 'Kurup', 'Panicker', 'Nambiar', 'Warrier', 'Unnithan', 'Kaimal', 'Namboothiri',
          'Varghese', 'Kurian', 'Chacko', 'Jacob', 'Philip', 'Abraham', 'Mathew', 'George', 'Thomas', 'Joseph',
          'Varkey', 'Cherian', 'Eapen', 'Mammen', 'Koshy', 'Thampi', 'Antony', 'Gopinath', 'Sasidharan', 'Ravindran',
          'Sukumaran', 'Vijayan', 'Mohanan', 'Prabhakaran', 'Sudhakaran', 'Krishnan', 'Raghavan', 'Narayanan', 'Divakaran', 'Purushothaman',
          'Ayyappan', 'Velayudhan', 'Sreedharan']
      },
      {
        // Mappilas (muçulmanos de Kerala, maioria em Malappuram): o nome do pai ou da casa como sobrenome.
        id: 'muculmano_kerala',
        peso: 0.007,
        divisoes: ['KL'],
        sobrenome: 'um',
        masc: {
          antiga: ['Muhammed', 'Abdul Rahiman', 'Kunhi Muhammed', 'Moideen', 'Kunhalavi', 'Abdulla', 'Hamza', 'Ahmed Kutty', 'Aboobacker', 'Ali', 'Bava', 'Hassan Koya', 'Ibrahim Kutty', 'Kunhammed', 'Mammu', 'Moosa', 'Pocker', 'Saidalavi', 'Usman', 'Yousuf',
            'Koya', 'Kunhimoideen', 'Bappu', 'Kunhahammed', 'Ismail', 'Kutty Hassan'],
          meio: ['Shihab', 'Faisal', 'Riyas', 'Nizar', 'Shameer', 'Ashraf', 'Anas', 'Shafeeq', 'Basheer', 'Jabir', 'Nishad', 'Rafeeq', 'Sakeer', 'Sameer', 'Shafi', 'Siraj', 'Muneer', 'Noushad', 'Sidheeq', 'Jaleel',
            'Rasheed', 'Haris', 'Shanavas', 'Navas', 'Ansar', 'Fasil'],
          nova: ['Adil', 'Ameen', 'Fahad', 'Fazil', 'Hadi', 'Hisham', 'Irfan', 'Ishan', 'Jasim', 'Mishal', 'Muhammed Shaan', 'Nihal', 'Rayan', 'Rizwan', 'Sahal', 'Shaheen', 'Shamil', 'Sinan', 'Thanveer', 'Yaseen',
            'Zayan', 'Afsal', 'Ameer', 'Hafiz', 'Junaid', 'Rameez']
        },
        fem: {
          antiga: ['Fathima', 'Ayisha', 'Kunhipathumma', 'Pathumma', 'Kunhayisha', 'Mariyumma', 'Khadeeja', 'Zainaba', 'Aminakutty', 'Beevi', 'Ummukulsu', 'Safiya', 'Nabeesa', 'Haleema', 'Pathu', 'Ayishabi', 'Rukhiya', 'Sainaba', 'Asiya', 'Kadeesa',
            'Mariyam', 'Nafeesa', 'Ummachi', 'Jameela', 'Kunhimol', 'Suhara'],
          meio: ['Shahana', 'Sumayya', 'Rasiya', 'Shamna', 'Jasna', 'Shabna', 'Nasreena', 'Raseena', 'Sajna', 'Fousiya', 'Hasna', 'Jaseela', 'Muhsina', 'Nisha', 'Rahmath', 'Sabitha', 'Shameema', 'Shereena', 'Shifana', 'Thasneem',
            'Haseena', 'Jumaila', 'Mubeena', 'Naseema', 'Sajida', 'Rubeena'],
          nova: ['Hiba', 'Fathima Nourin', 'Ayisha Hanna', 'Nida', 'Hanna', 'Minha', 'Nashwa', 'Ameena', 'Diya Fathima', 'Farha', 'Hadiya', 'Inaya', 'Lamiya', 'Liya', 'Misriya', 'Nafla', 'Naja', 'Nihala', 'Rinsha', 'Safa',
            'Shifa', 'Thanha', 'Zahra', 'Fidha', 'Haya', 'Rana']
        },
        sobrenomes: ['Muhammed', 'Abdulla', 'Ibrahim', 'Hamza', 'Moideen', 'Aboobacker', 'Yousuf', 'Usman', 'Basheer', 'Ismail',
          'Hassan', 'Kunhi', 'Koya', 'Thangal', 'Haji', 'Musliyar', 'Kutty', 'Moosa', 'Ahamed', 'Kader',
          'Jaleel', 'Rasheed', 'Salam', 'Majeed', 'Latheef', 'Sidheeq', 'Ashraf', 'Rafeeq', 'Shareef', 'Hameed',
          'Kareem', 'Aziz', 'Nazar', 'Beeran', 'Mammali', 'Ummer', 'Alavi', 'Saidalavi', 'Pocker', 'Mammu', 'Kunhalan', 'Bava', 'Nizar']
      },
      {
        // Punjabis sikhs e hindus. Singh/Kaur são títulos religiosos por gênero —
        // o sobrenome do jogo é herdado e sem gênero, então usa-se o nome de clã
        // (got) ou de família, como muitos sikhs fazem no registro civil.
        id: 'punjabi',
        peso: 0.025,
        divisoes: ['PB', 'DL'],
        sobrenome: 'um',
        masc: {
          antiga: ['Gurdev', 'Kartar', 'Gurbachan', 'Harbans', 'Joginder', 'Mohinder', 'Surjit', 'Baldev', 'Gurcharan', 'Jaswant', 'Kuldip', 'Ajit', 'Darshan', 'Balwant', 'Avtar', 'Hardev', 'Inderjit', 'Jagjit', 'Karnail', 'Mukhtiar',
            'Nachhattar', 'Piara', 'Tarlochan', 'Bhupinder', 'Harnam', 'Swaran', 'Yash Pal', 'Krishan Lal'],
          meio: ['Gurpreet', 'Harpreet', 'Manpreet', 'Jaspreet', 'Sukhwinder', 'Amandeep', 'Navdeep', 'Gagandeep', 'Hardeep', 'Jasvir', 'Kulvir', 'Lakhwinder', 'Manjinder', 'Parminder', 'Rajvir', 'Ravinder', 'Sandeep', 'Sarabjit', 'Taranjit', 'Varinder',
            'Davinder', 'Harjit', 'Jagdeep', 'Kanwaljit', 'Mandeep', 'Navjot', 'Rupinder', 'Satnam', 'Simranjit', 'Yadwinder'],
          nova: ['Gurnoor', 'Harjot', 'Ekam', 'Fateh', 'Arjan', 'Gurshan', 'Jashan', 'Sahib', 'Agam', 'Armaan', 'Gurkirat', 'Harnoor', 'Jaskaran', 'Karanveer', 'Manraj', 'Navraj', 'Prabhjot', 'Ranveer', 'Sehaj', 'Tegbir',
            'Udham', 'Veer', 'Ajeet', 'Daksh', 'Jagjot', 'Ishmeet', 'Sukhman', 'Abhijot']
        },
        fem: {
          antiga: ['Amarjit', 'Balbir', 'Charanjit', 'Gurbax', 'Harjinder', 'Jasbir', 'Kulwant', 'Manjit', 'Paramjit', 'Rajinder', 'Satwant', 'Sukhwinder', 'Surinder', 'Swaran', 'Tejinder', 'Gurmeet', 'Daljit', 'Kamaljit', 'Narinder', 'Parkash',
            'Raminder', 'Santosh', 'Shanti', 'Kamla', 'Pritam', 'Bachan', 'Gian', 'Nirmal'],
          meio: ['Gurpreet', 'Harpreet', 'Manpreet', 'Jaspreet', 'Amandeep', 'Navneet', 'Rajwinder', 'Kirandeep', 'Paramjeet', 'Ramandeep', 'Harleen', 'Simran', 'Kamaljeet', 'Jasleen', 'Gurleen', 'Mandeep', 'Navdeep', 'Sandeep', 'Sukhpreet', 'Rupinder',
            'Harmeet', 'Inderpreet', 'Jasmeet', 'Manjeet', 'Parveen', 'Ravneet', 'Sarbjit', 'Taranpreet', 'Veerpal'],
          nova: ['Gurnoor', 'Harnoor', 'Jasnoor', 'Manreet', 'Prabhleen', 'Sehaj', 'Simrat', 'Avneet', 'Ekamjot', 'Gurkiran', 'Harsimran', 'Jasmeen', 'Kirat', 'Mehtab', 'Navleen', 'Noor', 'Rabab', 'Sukhleen', 'Tavleen', 'Amrit',
            'Arshpreet', 'Baani', 'Gunjot', 'Ishpreet', 'Japji', 'Komalpreet', 'Reet']
        },
        sobrenomes: ['Gill', 'Sandhu', 'Sidhu', 'Dhillon', 'Grewal', 'Brar', 'Sekhon', 'Bajwa', 'Virk', 'Cheema',
          'Randhawa', 'Aulakh', 'Bains', 'Johal', 'Kang', 'Mann', 'Sangha', 'Chahal', 'Dhaliwal', 'Hundal',
          'Toor', 'Bhullar', 'Deol', 'Garcha', 'Khaira', 'Pannu', 'Saini', 'Bhatia', 'Kapoor', 'Malhotra',
          'Khanna', 'Arora', 'Ahuja', 'Chopra', 'Kohli', 'Sethi', 'Anand', 'Bedi', 'Walia', 'Sodhi',
          'Chawla', 'Mehra', 'Ahluwalia', 'Sahni', 'Dhawan', 'Sachdeva', 'Narula', 'Kalra', 'Talwar']
      },
      {
        // Goa (concani): católicos de nomes e sobrenomes portugueses — Goa foi
        // portuguesa até 1961 — e hindus. Grafia goesa.
        id: 'goa',
        peso: 0.0012,
        divisoes: ['GA'],
        sobrenome: 'um',
        masc: {
          antiga: ['Francisco', 'José', 'António', 'Agnelo', 'Caetano', 'Rosário', 'Inácio', 'Joaquim', 'Lourenço', 'Sebastião', 'Vicente', 'Domingos', 'Pedro', 'Salvador', 'Anselmo', 'Bernardo', 'Constâncio', 'Filipe', 'Xavier', 'Purxotam',
            'Narayan', 'Vishnu', 'Shripad', 'Madhav', 'Ganesh', 'Raghunath', 'Govind', 'Pandurang'],
          meio: ['Savio', 'Agnelo', 'Anthony', 'Joseph', 'Francis', 'Peter', 'Xavier', 'Rui', 'Roque', 'Ivo', 'Mario', 'Cajetan', 'Valentine', 'Clinton', 'Brian', 'Allan', 'Melvin', 'Rajesh', 'Prashant', 'Sanjay',
            'Rohit', 'Sachin', 'Dattaprasad', 'Ramesh', 'Sudesh', 'Dilip', 'Ulhas', 'Vinayak', 'Sunil', 'Ajit'],
          nova: ['Ryan', 'Aaron', 'Joshua', 'Jayden', 'Ethan', 'Shaun', 'Glenn', 'Keith', 'Royston', 'Darryl', 'Leon', 'Sean', 'Jason', 'Nathan', 'Gavin', 'Omkar', 'Pranav', 'Shubham', 'Sairaj', 'Yash',
            'Aditya', 'Siddhesh', 'Tanmay', 'Atharva', 'Dhiraj', 'Saish', 'Vedant', 'Rudra']
        },
        fem: {
          antiga: ['Maria', 'Ana', 'Rosa', 'Filomena', 'Conceição', 'Esperança', 'Natividade', 'Piedade', 'Luísa', 'Inês', 'Rita', 'Joana', 'Teresa', 'Bernardina', 'Carmelina', 'Albertina', 'Ermelinda', 'Clementina', 'Amélia', 'Laxmi',
            'Sita', 'Kamala', 'Shalini', 'Sushila', 'Indira', 'Prabha', 'Sharada', 'Vimala'],
          meio: ['Sharon', 'Maria', 'Precilla', 'Anita', 'Sonia', 'Blanche', 'Lavina', 'Fatima', 'Liza', 'Shirley', 'Natasha', 'Melanie', 'Joyce', 'Agnes', 'Cynthia', 'Nisha', 'Sneha', 'Pooja', 'Priya', 'Shilpa',
            'Varsha', 'Sangeeta', 'Deepa', 'Meghana', 'Prajakta', 'Amruta', 'Sujata', 'Vaishali', 'Ashwini', 'Manisha'],
          nova: ['Alisha', 'Anisha', 'Chelsea', 'Clarissa', 'Crystal', 'Elvira', 'Gabriella', 'Jessica', 'Kimberly', 'Leanne', 'Megan', 'Rhea', 'Sherlyn', 'Tiara', 'Valencia', 'Aditi', 'Gauri', 'Ishita', 'Kavya', 'Neha',
            'Purva', 'Riya', 'Saloni', 'Sanika', 'Shravani', 'Tanvi', 'Vedika', 'Prachi']
        },
        sobrenomes: ['Fernandes', "D'Souza", 'Rodrigues', 'Pereira', 'Gomes', 'Dias', 'Colaço', 'Costa', "D'Costa", 'Furtado',
          'Cardozo', 'Pinto', 'Rebello', 'Menezes', 'Mascarenhas', 'Noronha', 'Vaz', 'Lobo', 'Coutinho', 'Barreto',
          'Carvalho', 'Almeida', 'Monteiro', 'Sequeira', "D'Mello", 'Gonsalves', 'Naik', 'Kamat', 'Prabhu', 'Gaonkar',
          'Shetye', 'Dessai', 'Parab', 'Kerkar', 'Velip', 'Gawde', 'Shirodkar', 'Borkar', 'Lotlikar', 'Naique',
          'Kakodkar', 'Salgaonkar', 'Usgaonkar', 'Sardesai']
      }
    ]
  },
  fontes: [
    'Constituição da Índia, arts. 84, 173, 243V (idades), 15(4)–16(4) (reservas); RTE Act 2009.',
    'Hindu Succession Act 1956 (ss. 8–10, 15, 29, 30; emenda de 2005); Muslim Personal Law (Shariat) Application Act 1937; Indian Succession Act 1925.',
    'Code on Wages 2019, Industrial Relations Code 2020 e Code on Social Security 2020 (em vigor desde 21/11/2025); Payment of Bonus Act.',
    'EPFO — EPF (12%) e EPS (pensão aos 58, 10 anos de serviço, teto salarial de ₹15.000); ESIC.',
    'Union Budget 2025-26 — regime novo do imposto de renda (sem imposto até ₹12 lakh, rebate da s. 87A).',
    'Census of India 2011 — línguas maternas (C-16) e religião (C-01); MoSPI — renda per capita estadual (NSDP).',
    'World Bank, Poverty & Equity Brief — India (2025); ILOSTAT — emprego informal (~88%).',
    'NTA — CUET-UG; Ministério da Educação — Central Sector Scheme of Scholarship, PM-Vidyalaxmi (2024).',
    'ISO 3166-2:IN (Telangana IN-TS, 2023).',
    'AIFF / Indian Super League 2025-26 (14 clubes; Hyderabad FC realocado como SC Delhi em out/2025).'
  ]
};

/* ======================================================= COREIA DO SUL */

/*
 * SUCESSÃO — COREIA DO SUL (Código Civil, Livro V):
 *  - ordem: descendentes; ascendentes; irmãos; colaterais até o 4º grau
 *    (art. 1000). O cônjuge concorre com descendentes ou, na falta deles, com
 *    ascendentes, e herda só sem nenhum dos dois (art. 1003);
 *  - a parte do cônjuge é 1,5 vez a de cada filho ou de cada pai (art. 1009 §2);
 *  - representação (art. 1001);
 *  - reserva legal ("yuryubun", art. 1112): metade da quota legal para
 *    descendentes e cônjuge; um terço para ascendentes. A reserva dos irmãos
 *    foi declarada inconstitucional (Tribunal Constitucional, 25/04/2024);
 *  - sem herdeiros, os bens vão ao Estado (art. 1058);
 *  - regime de bens: separação (arts. 830–831) — a divisão de bens só existe
 *    no divórcio, não na morte.
 * SIMPLIFICAÇÕES DECLARADAS: a parte de 1,5 do cônjuge vira "concorre com os
 * descendentes por cabeça"; com os ascendentes, 1,5/3,5 = 3/7 (dois pais) e
 * 1,5/2,5 = 3/5 (um); a reserva de 1/3 dos ascendentes vira a legítima geral
 * de 1/2. Imposto sobre herança (sangsokse, 10% a 50%) com deduções amplas
 * (5 bilhões de wons de dedução global, mais a do cônjuge): poucos óbitos
 * pagam; custo médio de 4%.
 */

export const COREIA_DO_SUL: PerfilDePais = {
  id: 'KR',
  gentilico: ['sul-coreano', 'sul-coreana'],
  idiomas: ['coreano'],
  divisao: {
    tipo: ['província', 'províncias'],
    // Províncias e cidades metropolitanas (ISO 3166-2:KR; Gangwon e Jeonbuk
    // agora "províncias especiais autônomas", códigos mantidos). Salário e custo:
    // KOSTAT, renda regional (GRDP e salários) — Seul e Gyeonggi caros; Ulsan,
    // capital industrial (Hyundai), com os maiores salários.
    lista: [
      { codigo: '11', nome: 'Seul', custo: 1.3, salario: 1.15 },
      { codigo: '26', nome: 'Busan', custo: 1.0, salario: 0.95 },
      { codigo: '27', nome: 'Daegu', custo: 0.95, salario: 0.9 },
      { codigo: '28', nome: 'Incheon', custo: 1.05, salario: 0.98 },
      { codigo: '29', nome: 'Gwangju', custo: 0.92, salario: 0.92 },
      { codigo: '30', nome: 'Daejeon', custo: 0.95, salario: 0.97 },
      { codigo: '31', nome: 'Ulsan', custo: 1.0, salario: 1.15 },
      { codigo: '41', nome: 'Gyeonggi', custo: 1.12, salario: 1.05 },
      { codigo: '42', nome: 'Gangwon', custo: 0.9, salario: 0.88 },
      { codigo: '45', nome: 'Jeonbuk', custo: 0.88, salario: 0.88 },
      { codigo: '47', nome: 'Gyeongsang do Norte', custo: 0.88, salario: 0.95 },
      { codigo: '49', nome: 'Jeju', custo: 1.0, salario: 0.88 }
    ]
  },
  cidades: [
    ['Seul', '11', 'metropole', 'capital|sede'],
    ['Incheon', '28', 'metropolitana', 'sede|litoral|metro:Seul'],
    ['Suwon', '41', 'metropolitana', 'sede|metro:Seul'],
    ['Bucheon', '41', 'metropolitana', 'metro:Seul'],
    ['Busan', '26', 'metropole', 'sede|litoral'],
    ['Daegu', '27', 'capital', 'sede'],
    ['Gwangju', '29', 'capital', 'sede'],
    ['Daejeon', '30', 'capital', 'sede'],
    ['Ulsan', '31', 'polo', 'sede|litoral'],
    ['Pohang', '47', 'polo', 'litoral'],
    ['Jeonju', '45', 'capital', 'sede'],
    ['Chuncheon', '42', 'capital', 'sede'],
    ['Jeju', '49', 'capital', 'sede|litoral'],
    ['Gimcheon', '47', 'pequena']
  ],
  economia: {
    // Pobreza relativa de ~15% (KOSTAT, Survey of Household Finances and Living
    // Conditions 2024 — concentrada nos idosos, ~38%); Gini 0,32.
    classes: { vulneravel: 10, trabalhadora: 25, media_baixa: 29, media: 26, alta: 10 },
    // Apartamentos muito caros na Grande Seul (preço/renda > 20) e o "jeonse"
    // (depósito-caução de aluguel de 50%–80% do valor do imóvel).
    moradia: 1.3,
    // Lei do Salário Mínimo — 2026: ₩10.320/h; mensal oficial de 209 h
    // (40 h + descanso semanal remunerado) = ₩2.156.880.
    salarioMinimo: 2156880,
    informalidade: 0.27, // ILOSTAT, 2019: 26,6%
    inflacao: 0.022,
    volatilidade: 0.7
  },
  trabalho: {
    mesesPagos: 12,
    // "Quatro seguros" do empregado em 2026: Pensão Nacional 4,75% (9,5% ÷ 2)
    // + saúde 3,595% + cuidados de longo prazo ~0,47% + seguro-emprego 0,9% ≈ 9,7%.
    // Teto: renda-base máxima da Pensão Nacional, ₩6.590.000 (jul/2026).
    contribuicao: { aliquota: [0.094, 0.097], teto: 6590000 },
    // Abstração: 6%–45% nacional + 10% de imposto local sobre o imposto, depois
    // da dedução de renda do trabalho e das pessoais; ajustado à carga efetiva
    // (~4% num salário de ₩3,5 milhões, ~12% em ₩7 milhões).
    impostoRenda: { isencao: 2500000, aliquota: 0.18 },
    // Lei de Garantia dos Benefícios de Aposentadoria do Empregado: 30 dias de
    // salário médio por ano de serviço, devido em qualquer saída após 1 ano.
    rescisao: { nome: 'toejikgeum (indenização legal de saída)', mesesPorAno: 1 },
    // Seguro-emprego: 120 a 270 dias, 60% do salário médio (com teto diário).
    seguroDesemprego: { meses: 5, reposicao: 0.6 },
    // Pensão Nacional: idade de 65 para os nascidos a partir de 1969; 10 anos
    // mínimos. Reforma de 2025: reposição-alvo de 43% para 40 anos — a real,
    // com carreiras mais curtas, fica abaixo.
    previdencia: { idade: [65, 65], anos: [10, 10], reposicao: 0.35, nome: 'Pensão Nacional (NPS)' },
    concurso: true,
    contratoFormal: 'contrato com os quatro seguros sociais'
  },
  educacao: {
    etapas: {
      fundamental: 'ensino fundamental', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'a creche pública do bairro', fundamental: 'a escola pública do bairro', medio: 'a escola de ensino médio do distrito' }
    },
    // A maioria das vagas é preenchida pela via "susi" (histórico escolar e
    // entrevistas), mas o CSAT ("Suneung") define a via regular e os mínimos.
    ingresso: 'exame_nacional',
    exame: { nome: 'Suneung', artigo: 'o' },
    // Nacionais: ~₩4,2 milhões/ano; privadas: ~₩7,6–8 milhões (KCUE, 2024).
    publicaCobra: 0.5,
    // Bolsa Nacional (KOSAF): até o 9º decil de renda familiar (~200% da renda
    // mediana) ≈ 1,4 salário mínimo por pessoa.
    bolsa: { nome: 'a Bolsa Nacional', teto: 1.4 },
    credito: { nome: 'o crédito estudantil da KOSAF' },
    // "Seleção de equilíbrio de oportunidades": vagas obrigatórias para alunos de
    // baixa renda e de regiões (Lei do Ensino Superior; diretrizes do MOE).
    cotas: true,
    privadaComum: true
  },
  politica: {
    sistema: 'república presidencialista unitária',
    // Lei Eleitoral de Cargos Públicos: candidatura aos 18 para a Assembleia
    // Nacional e cargos locais desde 2022. Não há senado (unicameral).
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'o Conselho Local' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 18, casa: 'a Prefeitura' },
      deputado_estadual: { titulo: ['conselheiro provincial', 'conselheira provincial'], anos: 4, idade: 18, casa: 'o Conselho Provincial' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 4, idade: 18, casa: 'a Assembleia Nacional' },
      governador: { titulo: ['governador', 'governadora'], anos: 4, idade: 18, casa: 'o Governo Provincial' }
    },
    // Locais simultâneas em junho (3/6/2026); legislativas em abril (2024 → 2028).
    eleicoes: { local: [2026, 4], geral: [2028, 4] },
    mes: 5,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Lei do Serviço Militar: todo homem é alistável aos 18 e passa pelo exame
    // aos 19; serviço ativo de 18 meses no Exército (20 na Marinha, 21 na Força
    // Aérea), com serviço alternativo para objetores desde 2020. Atletas só são
    // dispensados com medalha olímpica ou ouro nos Jogos Asiáticos — e o
    // Gimcheon Sangmu é o clube do Exército onde os futebolistas cumprem o serviço.
    servico: 'obrigatorio',
    idade: 18,
    forcas: { exercito: 'o Exército da República da Coreia', marinha: 'a Marinha da República da Coreia', aeronautica: 'a Força Aérea da República da Coreia' },
    policia: 'a Polícia Nacional'
  },
  esporte: {
    // Lutas (taekwondo, judô, luta, esgrima à parte) e vôlei (V-League) fortes;
    // beisebol (KBO), o maior, não é domínio do jogo; atletismo e tênis pequenos.
    popularidade: { futebol: 1.1, volei: 1.1, basquete: 0.9, natacao: 0.9, atletismo: 0.7, lutas: 1.25, tenis: 0.7 },
    divisoes: ['K4 League', 'K3 League', 'K League 2', 'K League 1'],
    clubes: [
      { nome: 'Jeonbuk Hyundai Motors', artigo: 'o', porte: 'grande', cidade: 'Jeonju' },
      { nome: 'Ulsan HD', artigo: 'o', porte: 'grande', cidade: 'Ulsan' },
      { nome: 'Pohang Steelers', artigo: 'o', porte: 'grande', cidade: 'Pohang' },
      { nome: 'FC Seoul', artigo: 'o', porte: 'grande', cidade: 'Seul' },
      { nome: 'Suwon Samsung Bluewings', artigo: 'o', porte: 'tradicional', cidade: 'Suwon' },
      { nome: 'Incheon United', artigo: 'o', porte: 'tradicional', cidade: 'Incheon' },
      { nome: 'Daejeon Hana Citizen', artigo: 'o', porte: 'tradicional', cidade: 'Daejeon' },
      { nome: 'Gwangju FC', artigo: 'o', porte: 'tradicional', cidade: 'Gwangju' },
      { nome: 'Jeju SK', artigo: 'o', porte: 'tradicional', cidade: 'Jeju' },
      { nome: 'Gangwon FC', artigo: 'o', porte: 'tradicional', cidade: 'Chuncheon' },
      { nome: 'Daegu FC', artigo: 'o', porte: 'tradicional', cidade: 'Daegu' },
      { nome: 'Busan IPark', artigo: 'o', porte: 'tradicional', cidade: 'Busan' },
      { nome: 'Gimcheon Sangmu', artigo: 'o', porte: 'regional', cidade: 'Gimcheon' },
      { nome: 'Bucheon FC 1995', artigo: 'o', porte: 'regional', cidade: 'Bucheon' },
      { nome: 'Suwon FC', artigo: 'o', porte: 'regional', cidade: 'Suwon' }
    ]
  },
  // Seguro Nacional de Saúde (NHIS), pagador único, com copagamentos altos;
  // seguro privado complementar ("silson") muito comum.
  saude: { sistema: 'universal', redePublica: 'o Seguro Nacional de Saúde', custoPlano: 1.1 },
  // Vistos por categoria e por pontos (E-9, E-7, F-2); residência permanente seletiva.
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'KR',
    nome: 'Coreia do Sul',
    legitima: 0.5,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [3 / 7, 3 / 5],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.04,
    rotuloCusto: 'imposto sobre herança (sangsokse) e custas',
    vacancia: 'o Estado'
  },
  nomes: {
    // Prenomes: Tribunal Supremo, estatísticas do registro de família (desde
    // 2008) e levantamentos históricos por década; sobrenomes: Censo de 2015
    // (KOSTAT) — Kim 21,5%, Lee 14,7%, Park 8,4%, Choi 4,7%, Jung 4,3%.
    cortes: [1975, 2000],
    neutros: ['Ha-ram', 'Ji-won', 'Seo-jin', 'Ji-an', 'Yu-jin', 'Ha-neul', 'Ga-on', 'Ha-on', 'I-seul', 'Da-on', 'Ye-seul', 'Seung-hui'],
    grupos: [{
      id: 'coreia',
      peso: 1,
      sobrenome: 'um',
      masc: {
        antiga: ['Yeong-su', 'Yeong-ho', 'Yeong-sik', 'Yeong-cheol', 'Jeong-su', 'Seong-su', 'Sang-cheol', 'Seong-ho', 'Jong-su', 'Jeong-ho', 'Gwang-su', 'Byeong-cheol', 'Yong-su', 'Myeong-su', 'Jae-ho', 'Sang-hun', 'Seong-jin', 'Chang-ho', 'Sang-ho', 'Gyeong-su',
          'Seung-ho', 'Myeong-ho', 'Byeong-ho', 'Jae-seong', 'Dong-su', 'Chang-su', 'Jong-ho', 'Sang-uk', 'Jeong-hun', 'Gyeong-ho', 'Jae-sik', 'Yong-ho', 'Jin-ho', 'Seong-cheol', 'Jae-cheol', 'Gwang-ho', 'Tae-ho', 'Chang-sik', 'Man-su', 'Sun-cheol',
          'Gi-ho', 'Hyeon-cheol'],
        meio: ['Ji-hun', 'Seong-min', 'Hyeon-u', 'Jun-ho', 'Min-su', 'Dong-hyeon', 'Jeong-hun', 'Seong-hun', 'Min-ho', 'Jun-yeong', 'Seung-hyeon', 'Hyeon-jun', 'Jae-hyeon', 'Ji-hwan', 'Seung-min', 'Min-jae', 'Jin-u', 'Dong-hun', 'Jun-hyeok', 'Jae-min',
          'Tae-hun', 'Jae-hun', 'Seung-u', 'Min-hyeok', 'Yong-jun', 'Ji-seong', 'Hyeon-su', 'Sang-u', 'Jong-hyeon', 'Seong-hyeon', 'Jin-hyeok', 'Min-cheol', 'Tae-hyeon', 'Jae-won', 'U-jin', 'Dae-hyeon', 'Hyeok', 'Sang-min', 'Jeong-min', 'Dong-uk',
          'Seung-hun', 'Hyeon-seok'],
        nova: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ye-jun', 'Si-u', 'Ha-jun', 'Ju-won', 'Ji-ho', 'Ji-hu', 'Jun-u', 'Jun-seo', 'Geon-u', 'Hyeon-u', 'U-jin', 'Seon-u', 'Seo-jin', 'Min-jae', 'Hyeon-jun', 'Yeon-u', 'Jeong-u',
          'Seung-u', 'Yu-jun', 'Seung-hyeon', 'I-jun', 'Ji-hun', 'Si-yun', 'Eun-u', 'Ji-hwan', 'Seung-min', 'Yu-chan', 'Su-ho', 'Eun-chan', 'Ro-un', 'I-an', 'Yun-u', 'Do-hyeon', 'Min-seong', 'Jae-yun', 'Han-gyeol', 'Ji-seong',
          'Tae-yun', 'Do-ha', 'Ha-on', 'Seo-u']
      },
      fem: {
        antiga: ['Yeong-ja', 'Jeong-suk', 'Sun-ja', 'Yeong-suk', 'Jeong-hui', 'Mi-suk', 'Gyeong-ja', 'Myeong-suk', 'Ok-sun', 'Gyeong-suk', 'Mi-gyeong', 'Jeong-ja', 'Yeong-hui', 'Suk-ja', 'Hye-suk', 'Jeong-sun', 'Mi-ja', 'Gyeong-hui', 'Eun-suk', 'Yeong-sun',
          'Mal-sun', 'Ok-ja', 'Sun-hui', 'Bok-sun', 'Geum-sun', 'Chun-ja', 'Yeong-ok', 'Mi-yeong', 'Hyeon-suk', 'Jeong-ae', 'Myeong-ja', 'Eun-hui', 'In-suk', 'Ok-hui', 'Sun-yeong', 'Mi-sun', 'Jeong-ok', 'Gyeong-ok', 'Hwa-ja', 'Bok-ja'],
        meio: ['Ji-eun', 'Ji-hye', 'Eun-jeong', 'Hye-jin', 'Eun-ji', 'Su-jin', 'Ji-yeon', 'Min-jeong', 'Seon-yeong', 'Eun-yeong', 'Ji-yeong', 'Yu-jin', 'Ji-hyeon', 'Su-yeon', 'Hye-jeong', 'Eun-ju', 'Mi-jin', 'Jeong-eun', 'Ye-jin', 'Seul-gi',
          'Ji-min', 'Min-ji', 'Hyo-jin', 'Ye-eun', 'Da-eun', 'Su-bin', 'Bo-ram', 'Eun-hye', 'Seon-hui', 'Na-yeon', 'Hye-yeong', 'So-yeong', 'Ha-na', 'A-reum', 'Da-hye', 'Jin-hui', 'Mi-ra', 'Hyeon-jeong', 'Ji-su', 'Hye-won',
          'So-ra', 'Eun-bi'],
        nova: ['Seo-yeon', 'Seo-yun', 'Ji-u', 'Seo-hyeon', 'Min-seo', 'Ha-eun', 'Ha-yun', 'Yun-seo', 'Ji-yu', 'Chae-won', 'Ji-min', 'Su-a', 'Ji-a', 'Ji-yun', 'Da-eun', 'Eun-seo', 'Ye-eun', 'Su-bin', 'So-yul', 'Ye-rin',
          'Ye-jin', 'Ji-won', 'Si-a', 'Ha-rin', 'A-rin', 'Yu-na', 'Ga-eun', 'Si-eun', 'Ye-seo', 'Ji-an', 'Seo-a', 'A-yun', 'I-seo', 'Yu-jin', 'Chae-eun', 'Na-eun', 'Ha-neul', 'Da-in', 'Su-min', 'Ro-a',
          'Seol-a', 'Si-yeon', 'Ye-na']
      },
      sobrenomes: [...rep('Kim', 12), ...rep('Lee', 8), ...rep('Park', 5), ...rep('Choi', 3), ...rep('Jung', 3), ...rep('Kang', 2), ...rep('Cho', 2), ...rep('Yoon', 2), ...rep('Jang', 2), ...rep('Lim', 2),
        'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Jeon', 'Hong',
        'Yoo', 'Ko', 'Moon', 'Yang', 'Son', 'Bae', 'Baek', 'Heo', 'Nam', 'Shim',
        'Noh', 'Ha', 'Kwak', 'Sung', 'Cha', 'Joo', 'Woo', 'Koo', 'Min', 'Ryu',
        'Na', 'Jin', 'Ji', 'Uhm', 'Chae', 'Won', 'Cheon', 'Bang', 'Gong', 'Hyun',
        'Ham', 'Byun', 'Yeom', 'Yeo', 'Choo', 'Do', 'So', 'Seok', 'Seon', 'Seol',
        'Ma', 'Gil', 'Pyo', 'Myung', 'Ki', 'Ban', 'Wang', 'Geum', 'Ok', 'Yook']
    }]
  },
  fontes: [
    'Código Civil da Coreia (Lei 471/1958), arts. 830–831, 1000–1003, 1009, 1058, 1112; Tribunal Constitucional, decisão de 25/04/2024 (reserva dos irmãos).',
    'Lei do Salário Mínimo — Comissão do Salário Mínimo, decisão para 2026 (₩10.320/h; ₩2.156.880 em 209 h).',
    'NPS — alíquota de 9,5% (2026) e teto de renda-base (₩6.370.000 → ₩6.590.000 em jul/2026); NHIS (3,595%, 2026).',
    'Lei de Garantia dos Benefícios de Aposentadoria do Empregado (toejikgeum); Lei do Seguro-Emprego.',
    'Lei do Serviço Militar; Ministério da Defesa (18/20/21 meses de serviço ativo).',
    'Lei Eleitoral de Cargos Públicos (idade de candidatura de 18 anos, 2022); NEC — 9ª eleições locais (03/06/2026).',
    'KOSTAT — Survey of Household Finances and Living Conditions 2024; Censo de 2015 (sobrenomes); ILOSTAT (informalidade 26,6%, 2019).',
    'KOSAF — Bolsa Nacional e crédito estudantil; KCUE — mensalidades universitárias.',
    'K League — K League 1 2026 (Jeonbuk campeão de 2025; Incheon e Bucheon promovidos; Daegu e Suwon FC rebaixados).',
    'Tribunal Supremo da Coreia — estatísticas de prenomes registrados; ISO 3166-2:KR.'
  ]
};

export const PAISES: PerfilDePais[] = [JAPAO, CHINA, INDIA, COREIA_DO_SUL];
