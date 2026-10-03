/**
 * ÁFRICA — África do Sul, Nigéria, Angola, Quênia e Marrocos.
 *
 * Cinco países que não se parecem entre si: uma república parlamentarista
 * com voto proporcional e onze línguas oficiais (África do Sul); uma
 * federação presidencialista de 36 estados e centenas de povos (Nigéria);
 * uma república presidencialista lusófona sem eleições autárquicas até hoje
 * (Angola); uma república presidencialista com 47 condados autônomos desde a
 * Constituição de 2010 (Quênia); uma monarquia constitucional com o código
 * de família de base islâmica (Marrocos).
 *
 * NOMES: nenhum destes países publica estatística oficial completa de nomes
 * de batismo por geração (a África do Sul publica, desde 2016, os nomes mais
 * registrados no Home Affairs — usados aqui na geração nova). Os grupos são
 * comunidades linguísticas reais, com pesos tirados dos censos (língua do
 * domicílio ou etnia declarada) e listas compostas de nomes de uso corrente
 * em registros, imprensa e esporte; o peso de cada grupo e as fontes estão
 * no comentário de cada perfil. Em todos eles há nomes cristãos e/ou
 * muçulmanos ao lado dos nomes nas línguas locais, como na vida real.
 *
 * Fontes e abstrações: `docs/notas/FONTES-PAISES-AFRICA.md`.
 */

import type { PerfilDePais } from '../tipos';

/* ======================================================= ÁFRICA DO SUL */

/*
 * SUCESSÃO — ÁFRICA DO SUL (Wills Act 7/1953; Intestate Succession Act
 * 81/1987; Maintenance of Surviving Spouses Act 27/1990; Reform of Customary
 * Law of Succession Act 11/2009; Estate Duty Act 45/1955):
 *  - liberdade de testar: não há legítima; o cônjuge pode pedir alimentos
 *    ao espólio (Act 27/1990) e os filhos menores, sustento — fora do jogo;
 *  - sem testamento: com descendentes, o cônjuge recebe a parte de um filho
 *    ou um valor mínimo fixado pelo ministro (o que for maior) (s. 1(1)(c));
 *    sem descendentes, o cônjuge herda TUDO, mesmo com os pais vivos
 *    (s. 1(1)(b)); depois pais, irmãos e seus descendentes (s. 1(1)(d)–(f));
 *  - representação dos descendentes (s. 1(1)(c) e (d));
 *  - o casamento civil sem pacto antenupcial é em comunhão de bens ("in
 *    community of property") — a metade do cônjuge não é herança;
 *  - casamentos e heranças pelo direito costumeiro seguem a mesma lei de
 *    sucessão desde 2009 (Act 11/2009, após Bhe v Magistrate, 2004);
 *  - sem herdeiros, os bens vão para o Estado (Guardian's Fund / Estado).
 * SIMPLIFICAÇÕES DECLARADAS: o "valor mínimo" do cônjuge vira a regra da
 * parte por cabeça; a comunhão universal sul-africana entra como a meação
 * do que o casal construiu; o estate duty (20% acima de R 3,5 milhões de
 * abatimento, 25% acima de R 30 milhões) e os honorários do executor (até
 * 3,5%) viram uma taxa média de 5% — para a maioria das famílias, o custo é
 * só o do executor e do Master of the High Court.
 */

/*
 * NOMES — ÁFRICA DO SUL. Pesos: Censo 2022 (Stats SA), língua mais falada no
 * domicílio: isiZulu 24,4%; isiXhosa 16,3%; africâner 10,6%; sepedi 10,0%;
 * inglês 8,7%; setswana 8,3%; sesotho 7,8%; xitsonga 4,7%; siSwati 2,8%;
 * tshivenda 2,5%; isiNdebele 1,7%. Grupos: nguni (zulu, swati, ndebele) 28,9;
 * xhosa 16,3; soto-tswana (sepedi, setswana, sesotho) 26,1; africâner 10,6
 * (inclui a comunidade "coloured" do Cabo, majoritariamente de língua
 * africâner); inglês 8,7 (inclui a comunidade de origem indiana de KwaZulu-
 * Natal, quase toda anglófona); tsonga-venda 7,2. Gauteng fica sem grupo
 * próprio (é a província mais misturada): ali os grupos saem na proporção
 * nacional. Geração nova: nomes mais registrados no Home Affairs em
 * 2022–2024 (Onalerona, Lethabo, Melokuhle, Lisakhanya, Lubanzi,
 * Nkazimulo, Langelihle, Junior...). Sobrenomes: Dlamini, Nkosi, Ndlovu,
 * Khumalo e Mokoena entre os mais registrados (Stats SA).
 */

export const AFRICA_DO_SUL: PerfilDePais = {
  id: 'ZA',
  // Regras legais: learner's licence aos 17, carteira aos 18 (National Road Traffic Act).
  regras: { direcao: { aprendiz: { idade: 17, nome: 'licença de aprendiz (learner’s licence)' }, plena: 18 } },
  gentilico: ['sul-africano', 'sul-africana'],
  idiomas: ['inglês', 'zulu', 'xhosa', 'africâner', 'sepedi', 'tswana', 'soto', 'tsonga', 'suázi', 'venda', 'ndebele'],
  divisao: {
    tipo: ['província', 'províncias'],
    // Custo e salário: Gauteng e Cabo Ocidental acima da média; Limpopo e Cabo
    // Oriental abaixo (Stats SA, QLES/QLFS — rendimentos por província).
    lista: [
      { codigo: 'GP', nome: 'Gauteng', custo: 1.1, salario: 1.2 },
      { codigo: 'WC', nome: 'Cabo Ocidental', custo: 1.12, salario: 1.1 },
      { codigo: 'KZN', nome: 'KwaZulu-Natal', custo: 1.0, salario: 0.95 },
      { codigo: 'EC', nome: 'Cabo Oriental', custo: 0.9, salario: 0.85 },
      { codigo: 'FS', nome: 'Estado Livre', custo: 0.92, salario: 0.9 },
      { codigo: 'LP', nome: 'Limpopo', custo: 0.88, salario: 0.82 },
      { codigo: 'MP', nome: 'Mpumalanga', custo: 0.92, salario: 0.9 },
      { codigo: 'NW', nome: 'Noroeste', custo: 0.92, salario: 0.9 },
      { codigo: 'NC', nome: 'Cabo Setentrional', custo: 0.92, salario: 0.9 }
    ]
  },
  cidades: [
    ['Joanesburgo', 'GP', 'metropole', 'sede'],
    ['Soweto', 'GP', 'metropolitana', 'metro:Joanesburgo'],
    ['Pretória', 'GP', 'metropole', 'capital'], // sede do Executivo (Tshwane); o Parlamento fica na Cidade do Cabo
    ['Cidade do Cabo', 'WC', 'metropole', 'sede|litoral'],
    ['Durban', 'KZN', 'metropole', 'litoral'],
    ['Pietermaritzburg', 'KZN', 'capital', 'sede'],
    ['Gqeberha', 'EC', 'polo', 'litoral'], // antiga Port Elizabeth (Nelson Mandela Bay)
    ['East London', 'EC', 'polo', 'litoral'],
    ['Bloemfontein', 'FS', 'capital', 'sede'], // sede do Judiciário (Supremo Tribunal de Apelação)
    ['Polokwane', 'LP', 'capital', 'sede'],
    ['Mbombela', 'MP', 'capital', 'sede'],
    ['Rustenburg', 'NW', 'polo'],
    ['Richards Bay', 'KZN', 'polo', 'litoral'],
    ['Stellenbosch', 'WC', 'pequena']
  ],
  economia: {
    // Gini ~0,63 (Banco Mundial), o mais alto medido; ~55% abaixo da linha
    // superior de pobreza (Stats SA, 2015) e desemprego oficial acima de 30%
    // (QLFS): a base é larga e a classe média, estreita. Alta pequena mas real.
    classes: { vulneravel: 38, trabalhadora: 27, media_baixa: 16, media: 13, alta: 6 },
    // Aluguel urbano não é caro em relação aos outros preços (fora de bairros
    // nobres do Cabo); muita moradia é própria (RDP) ou informal.
    moradia: 0.95,
    // Salário mínimo nacional: R 30,23/hora desde 1/3/2026 (National Minimum
    // Wage Act 9/2018; Dept. of Employment and Labour). Mensal = 30,23 × 45 h
    // semanais (jornada ordinária máxima, BCEA) × 52/12 ≈ R 5.895.
    salarioMinimo: 5895,
    // Emprego informal ~1/3 do total, incluindo agricultura e domésticos (ILOSTAT; Stats SA QLFS).
    informalidade: 0.34,
    // CPI 2024 4,4%, 2025 ~3%; meta do SARB passou a 3% em 2025.
    inflacao: 0.035,
    volatilidade: 0.8
  },
  trabalho: {
    mesesPagos: 12, // o "13th cheque" é comum, mas é contratual, não legal
    // UIF: 1% do empregado (e 1% do empregador) até o teto de R 17.712/mês.
    // Não há previdência pública contributiva: aposentadoria é fundo privado/ocupacional.
    contribuicao: { aliquota: [0.01, 0.01], teto: 17712 },
    // PAYE 2026/27: limiar de isenção (abaixo de 65 anos) R 99.000/ano ≈ R 8.250/mês;
    // as faixas são 18%, 26%, 31%... — 0,22 representa a faixa típica do empregado formal.
    impostoRenda: { isencao: 8250, aliquota: 0.22 },
    // BCEA s. 41: na demissão por motivos operacionais, no mínimo uma semana de
    // salário por ano completo de casa (≈ 0,23 mês/ano).
    rescisao: { nome: 'severance pay (uma semana de salário por ano de casa)', mesesPorAno: 0.23 },
    // UIF: até 365 dias de benefício em 4 anos, taxa decrescente de 60% a 38%
    // do salário (Unemployment Insurance Act 63/2001, emendas de 2016). Abstração: 8 meses a ~45%.
    seguroDesemprego: { meses: 8, reposicao: 0.45 },
    // Pensão de velhice do SASSA (Social Assistance Act 13/2004): 60 anos, sem
    // contribuição, sujeita a teste de renda; valor baixo frente ao salário.
    previdencia: { idade: [60, 60], anos: [0, 0], reposicao: 0.3, nome: 'a pensão de velhice do SASSA' },
    concurso: false, // serviço público contrata por vaga anunciada e entrevista (Public Service Act)
    contratoFormal: 'emprego registrado no UIF'
  },
  educacao: {
    etapas: {
      // Ensino obrigatório: Grade R/1 a 9 (SA Schools Act 84/1996); FET: Grades 10–12 → o "matric".
      fundamental: 'ensino básico', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'a creche comunitária (ECD)', fundamental: 'a escola pública do bairro', medio: 'a high school pública' }
    },
    // As universidades públicas selecionam por candidatura, com a pontuação do
    // National Senior Certificate (APS) e testes próprios (NBT).
    ingresso: 'candidatura',
    exame: { nome: 'matric (National Senior Certificate)', artigo: 'o' },
    // Universidades públicas cobram anuidade (~R 50–70 mil) próxima das privadas.
    publicaCobra: 0.6,
    // NSFAS: bolsa integral para renda familiar até R 350 mil/ano (≈ 1,2 salário
    // mínimo por pessoa numa família de quatro).
    bolsa: { nome: 'NSFAS', teto: 1.2 },
    cotas: false, // há políticas de equidade nas universidades, mas não cota legal por renda/escola
    privadaComum: false // ensino superior privado ~15% das matrículas (DHET)
  },
  politica: {
    sistema: 'república parlamentarista com presidente eleito pela Assembleia Nacional; voto proporcional em listas',
    cargos: {
      // Conselheiros municipais: metade por distrito ("ward"), metade por lista
      // (Municipal Structures Act 117/1998); o prefeito ("executive mayor") é eleito pelo conselho.
      vereador: { titulo: ['conselheiro municipal', 'conselheira municipal'], anos: 5, idade: 18, casa: 'o Conselho Municipal' },
      deputado_estadual: { titulo: ['deputado provincial', 'deputada provincial'], anos: 5, idade: 18, casa: 'a Legislatura Provincial' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 5, idade: 18, casa: 'a Assembleia Nacional' }
      // O Conselho Nacional das Províncias é indireto e o premiê provincial é eleito pela legislatura: fora.
    },
    // Locais: 4/11/2026 (IEC); gerais: maio de 2024 → 2029.
    eleicoes: { local: [2026, 5], geral: [2029, 5] },
    mes: 4,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // conscrição branca extinta em 1994
    idade: 18,
    forcas: { exercito: 'o Exército Sul-Africano', marinha: 'a Marinha Sul-Africana', aeronautica: 'a Força Aérea Sul-Africana' },
    policia: 'o Serviço de Polícia Sul-Africano (SAPS)'
  },
  esporte: {
    // Futebol é o esporte de massa; rúgbi e críquete (fora do jogo) dividem a
    // atenção. Natação e atletismo fortes (medalhas olímpicas), boxe tradicional.
    popularidade: { futebol: 1.3, volei: 0.55, basquete: 0.65, natacao: 1.15, atletismo: 1.2, lutas: 0.95, tenis: 0.9 },
    divisoes: ['SAFA Regional League', 'ABC Motsepe League', 'Motsepe Foundation Championship', 'Betway Premiership'],
    clubes: [
      { nome: 'Kaizer Chiefs', artigo: 'o', porte: 'grande', cidade: 'Joanesburgo' },
      { nome: 'Orlando Pirates', artigo: 'o', porte: 'grande', cidade: 'Joanesburgo' },
      { nome: 'Mamelodi Sundowns', artigo: 'o', porte: 'grande', cidade: 'Pretória' },
      { nome: 'AmaZulu', artigo: 'o', porte: 'tradicional', cidade: 'Durban' },
      { nome: 'Golden Arrows', artigo: 'o', porte: 'tradicional', cidade: 'Durban' },
      { nome: 'Stellenbosch FC', artigo: 'o', porte: 'tradicional', cidade: 'Stellenbosch' },
      { nome: 'Polokwane City', artigo: 'o', porte: 'tradicional', cidade: 'Polokwane' },
      { nome: 'Sekhukhune United', artigo: 'o', porte: 'tradicional', cidade: 'Polokwane' },
      { nome: 'TS Galaxy', artigo: 'o', porte: 'tradicional', cidade: 'Mbombela' },
      { nome: 'Chippa United', artigo: 'o', porte: 'tradicional', cidade: 'East London' },
      { nome: 'Richards Bay FC', artigo: 'o', porte: 'tradicional', cidade: 'Richards Bay' },
      { nome: 'Marumo Gallants', artigo: 'o', porte: 'tradicional', cidade: 'Bloemfontein' },
      { nome: 'Orbit College', artigo: 'o', porte: 'regional', cidade: 'Rustenburg' },
      { nome: 'Cape Town City', artigo: 'o', porte: 'regional', cidade: 'Cidade do Cabo' }
    ]
  },
  // ~84% depende da rede pública; ~16% tem plano ("medical scheme"), caro. A NHI
  // (Lei 20/2023) foi sancionada, mas não está implantada.
  saude: { sistema: 'misto', redePublica: 'a rede pública de saúde', custoPlano: 1.3 },
  // SADC não tem livre residência; vistos de trabalho por lista de habilidades críticas.
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'ZA',
    nome: 'África do Sul',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1, 1],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.05,
    rotuloCusto: 'estate duty e honorários do executor',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2000],
    grupos: [
      {
        id: 'nguni', peso: 28.9, divisoes: ['KZN', 'MP'], sobrenome: 'um',
        masc: {
          antiga: ['Sipho', 'Themba', 'Bongani', 'Mandla', 'Musa', 'Vusi', 'Jabulani', 'Bheki', 'Dumisani', 'Mbongeni', 'Thulani', 'Muzi', 'Sibusiso', 'Elias', 'Joseph', 'Petrus', 'Johannes', 'Solomon', 'Moses', 'Simon', 'Phineas', 'Mfanafuthi', 'Zwelithini', 'Sandile', 'Jabu', 'Enoch', 'Alfred', 'Mzokhona'],
          meio: ['Sibusiso', 'Thulani', 'Siyabonga', 'Mxolisi', 'Lungelo', 'Sanele', 'Nkosinathi', 'Mlungisi', 'Mpumelelo', 'Sifiso', 'Mduduzi', 'Thabani', 'Wandile', 'Nhlanhla', 'Njabulo', 'Thamsanqa', 'Sizwe', 'Mfundo', 'Mthokozisi', 'Bongani', 'Ayanda', 'Lindani', 'Sbusiso', 'Zwelakhe', 'Lucky', 'Blessing', 'Prince', 'Sandile'],
          nova: ['Nkazimulo', 'Langelihle', 'Lethokuhle', 'Siphosethu', 'Junior', 'Melokuhle', 'Nkanyezi', 'Bandile', 'Lwazi', 'Mpilo', 'Okuhle', 'Siphesihle', 'Banele', 'Kwanele', 'Andile', 'Lindokuhle', 'Ntando', 'Sbonelo', 'Owethu', 'Olwethu', 'Kwanda', 'Sihle', 'Ayabonga', 'Blessing', 'Gift', 'Zanokuhle', 'Mihlali', 'Ndumiso']
        },
        fem: {
          antiga: ['Nomvula', 'Thandi', 'Zanele', 'Nokuthula', 'Busisiwe', 'Ntombi', 'Sibongile', 'Thembi', 'Zodwa', 'Lindiwe', 'Nonhlanhla', 'Gugu', 'Phindile', 'Duduzile', 'Zandile', 'Nomsa', 'Thoko', 'Ntombifuthi', 'Beauty', 'Gladys', 'Elizabeth', 'Maria', 'Martha', 'Christina', 'Agnes', 'Lettie', 'Nelisiwe'],
          meio: ['Nompumelelo', 'Thandeka', 'Zinhle', 'Nosipho', 'Hlengiwe', 'Ntokozo', 'Philisiwe', 'Thandiwe', 'Nondumiso', 'Zama', 'Mbali', 'Nonkululeko', 'Nomfundo', 'Precious', 'Nombuso', 'Khanyisile', 'Londiwe', 'Silindile', 'Thembeka', 'Ayanda', 'Sinenhlanhla', 'Nokwanda', 'Zanele', 'Lungile', 'Nothando', 'Snenhlanhla', 'Thobile'],
          nova: ['Zanokuhle', 'Melokuhle', 'Nkanyezi', 'Amahle', 'Minenhle', 'Lethokuhle', 'Okuhle', 'Siphosethu', 'Nontobeko', 'Zekhethelo', 'Nothando', 'Snothando', 'Sbahle', 'Mbalenhle', 'Langelihle', 'Esihle', 'Nkazimulo', 'Andiswa', 'Uyanda', 'Thandolwethu', 'Kuhle', 'Sinothando', 'Ayanda', 'Wandile', 'Nokwanda', 'Lwandle']
        },
        sobrenomes: ['Dlamini', 'Nkosi', 'Ndlovu', 'Khumalo', 'Mkhize', 'Zulu', 'Ngcobo', 'Mthembu', 'Buthelezi', 'Sithole', 'Mahlangu', 'Shabalala', 'Zungu', 'Cele', 'Mhlongo', 'Ngubane', 'Magagula', 'Gumede', 'Mabaso', 'Msimang', 'Hadebe', 'Mnguni', 'Xulu', 'Zondi', 'Ntuli', 'Nxumalo', 'Msomi', 'Shezi', 'Majola', 'Masilela', 'Skhosana', 'Mtshali', 'Dube', 'Mazibuko', 'Zwane', 'Simelane', 'Shongwe', 'Mdluli', 'Mavuso', 'Nhlapo', 'Kubheka', 'Maseko', 'Hlongwane', 'Ngema', 'Mbatha', 'Mthethwa']
      },
      {
        id: 'xhosa', peso: 16.3, divisoes: ['EC', 'WC'], sobrenome: 'um',
        masc: {
          antiga: ['Mzwandile', 'Mncedisi', 'Vuyani', 'Zola', 'Xolani', 'Luvuyo', 'Monde', 'Mthetheleli', 'Sizwe', 'Thembekile', 'Mlungisi', 'Mzukisi', 'Siphiwo', 'Zwelinzima', 'Nceba', 'Mxolisi', 'Mandisi', 'Fikile', 'Wellington', 'Welile', 'Zolile', 'Vuyisile', 'Andile', 'Bonisile', 'Lulamile', 'Tamsanqa', 'Simphiwe'],
          meio: ['Siyabonga', 'Lwando', 'Luyolo', 'Lukhanyo', 'Unathi', 'Xolisa', 'Athenkosi', 'Lwazi', 'Bulelani', 'Siviwe', 'Lindile', 'Luvo', 'Sinethemba', 'Lubabalo', 'Masixole', 'Akhona', 'Lonwabo', 'Ayanda', 'Thando', 'Mihlali', 'Anele', 'Sibabalo', 'Khaya', 'Lusanda', 'Yonela', 'Babalo', 'Sakhumzi'],
          nova: ['Lubanzi', 'Iminathi', 'Kamva', 'Inathi', 'Lwandile', 'Athule', 'Avile', 'Esona', 'Liyema', 'Lisakhanya', 'Alunamda', 'Lithemba', 'Luthando', 'Asemahle', 'Aphiwe', 'Lukhona', 'Lindokuhle', 'Okuhle', 'Olwethu', 'Ovayo', 'Anothando', 'Imitha', 'Inga', 'Bukho', 'Hlumelo', 'Siphosethu', 'Junior']
        },
        fem: {
          antiga: ['Nomsa', 'Nontsikelelo', 'Nomvuyo', 'Nomonde', 'Nosipho', 'Thandeka', 'Nombulelo', 'Nolitha', 'Nomalizo', 'Noluthando', 'Nomhle', 'Nobuhle', 'Nomathemba', 'Nozuko', 'Lulama', 'Zukiswa', 'Nomzamo', 'Nokuzola', 'Nontombi', 'Nozipho', 'Thembeka', 'Nombeko', 'Nomakhosazana', 'Victoria', 'Nofezile', 'Nolusindiso', 'Novuyo'],
          meio: ['Zintle', 'Sinazo', 'Siphokazi', 'Yonela', 'Nwabisa', 'Thembisa', 'Ziyanda', 'Lindelwa', 'Asanda', 'Bongiwe', 'Khanyisa', 'Babalwa', 'Lumka', 'Sisipho', 'Anathi', 'Yolanda', 'Nandipha', 'Unathi', 'Ntombekhaya', 'Pumla', 'Sinovuyo', 'Ayabulela', 'Akhona', 'Thandiswa', 'Noxolo', 'Zoleka', 'Siphesihle'],
          nova: ['Lisakhanya', 'Olwemihla', 'Iminathi', 'Amahle', 'Alunamda', 'Esihle', 'Kuhle', 'Inam', 'Ovayo', 'Yamkela', 'Hlumelo', 'Imitha', 'Inga', 'Lithemba', 'Luthando', 'Anovuyo', 'Asemahle', 'Aphiwe', 'Buhle', 'Lunathi', 'Owethu', 'Uyanda', 'Siphosethu', 'Linamandla', 'Melokuhle', 'Akhanya']
        },
        sobrenomes: ['Dlamini', 'Nkosi', 'Mbeki', 'Mlambo', 'Ntshona', 'Mgijima', 'Mabandla', 'Jonas', 'Mdingi', 'Matiwane', 'Gcaba', 'Ngxola', 'Dyantyi', 'Madiba', 'Dlomo', 'Radebe', 'Tshawe', 'Jola', 'Gcaleka', 'Mqadi', 'Nqakula', 'Mbulawa', 'Ngcukaitobi', 'Sigcau', 'Mtirara', 'Mxenge', 'Makana', 'Gqirana', 'Jacobs', 'Ndamase', 'Mayekiso', 'Godongwana', 'Ntsebeza', 'Mbete', 'Kota', 'Bokwe', 'Soga', 'Fanti', 'Mapisa', 'Makwetu', 'Goniwe', 'Sisulu']
      },
      {
        id: 'soto_tswana', peso: 26.1, divisoes: ['LP', 'NW', 'FS', 'NC'], sobrenome: 'um',
        masc: {
          antiga: ['Petrus', 'Johannes', 'Daniel', 'Abel', 'Jacob', 'Simon', 'Elias', 'Lucas', 'Isaac', 'Andries', 'Moses', 'Samuel', 'Paulus', 'Phillemon', 'Ephraim', 'Jeremiah', 'Lefa', 'Tau', 'Pule', 'Thabo', 'Mpho', 'Kgosi', 'Molefi', 'Tebogo', 'Teboho', 'Mojalefa', 'Lebohang', 'Jonas'],
          meio: ['Thabo', 'Tshepo', 'Kagiso', 'Karabo', 'Mpho', 'Lesego', 'Neo', 'Tumelo', 'Katlego', 'Kabelo', 'Teboho', 'Lehlohonolo', 'Thato', 'Tebogo', 'Itumeleng', 'Bokang', 'Mosa', 'Kgomotso', 'Tshegofatso', 'Bonolo', 'Thabang', 'Lerato', 'Tlotlo', 'Kamohelo', 'Reitumetse', 'Onkarabile', 'Sello'],
          nova: ['Lethabo', 'Lesedi', 'Leano', 'Omphile', 'Onalerona', 'Reabetswe', 'Oratile', 'Rorisang', 'Rethabile', 'Kamogelo', 'Amogelang', 'Tumisang', 'Atlegang', 'Bohlale', 'Katlego', 'Karabo', 'Thato', 'Kutlwano', 'Resego', 'Ofentse', 'Paballo', 'Tshiamo', 'Tlotlisang', 'Junior', 'Neo', 'Onthatile', 'Boitshepo']
        },
        fem: {
          antiga: ['Maria', 'Martha', 'Elizabeth', 'Johanna', 'Selina', 'Rebecca', 'Sarah', 'Emily', 'Paulina', 'Dorcas', 'Anna', 'Elisa', 'Dikeledi', 'Mmapula', 'Matlakala', 'Puleng', 'Mpho', 'Nthabiseng', 'Dimakatso', 'Mamello', 'Matshidiso', 'Kelebogile', 'Mapula', 'Tselane', 'Keneilwe', 'Salome', 'Esther'],
          meio: ['Lerato', 'Palesa', 'Karabo', 'Lesego', 'Refilwe', 'Dineo', 'Boitumelo', 'Nthabiseng', 'Keamogetse', 'Dimpho', 'Mamello', 'Masego', 'Kgomotso', 'Tebogo', 'Itumeleng', 'Lebogang', 'Mpho', 'Rethabile', 'Kelebogile', 'Pontsho', 'Tshegofatso', 'Bontle', 'Naledi', 'Reneilwe', 'Thandeka', 'Mmathapelo', 'Lineo'],
          nova: ['Onalerona', 'Lethabo', 'Onthatile', 'Lesedi', 'Omphile', 'Reabetswe', 'Oratile', 'Rorisang', 'Rethabile', 'Kamogelo', 'Amogelang', 'Bonolo', 'Naledi', 'Boikanyo', 'Tumisang', 'Atlegang', 'Bohlale', 'Kutlwano', 'Resego', 'Paballo', 'Tshiamo', 'Bokamoso', 'Realeboga', 'Nthabeleng', 'Leano', 'Botshelo', 'Karabo']
        },
        sobrenomes: ['Mokoena', 'Mofokeng', 'Molefe', 'Motaung', 'Tau', 'Mokwena', 'Modise', 'Masilo', 'Phiri', 'Letsoalo', 'Maponya', 'Moloi', 'Ramokgopa', 'Sebola', 'Mphahlele', 'Makgoba', 'Ledwaba', 'Mogale', 'Matlala', 'Kekana', 'Moagi', 'Setshedi', 'Molapo', 'Sekgobela', 'Kgosana', 'Mosia', 'Mokgethi', 'Seleka', 'Pheko', 'Tladi', 'Moabi', 'Mosala', 'Mohapi', 'Mohlala', 'Nkoana', 'Lekgetho', 'Motsoeneng', 'Ramafoko', 'Sekhukhune', 'Mothapo', 'Moshoeshoe', 'Mabe', 'Seokane', 'Kgatle']
      },
      {
        id: 'africaner', peso: 10.6, divisoes: ['WC', 'NC'], sobrenome: 'um',
        masc: {
          antiga: ['Johannes', 'Pieter', 'Jacobus', 'Hendrik', 'Willem', 'Gert', 'Andries', 'Petrus', 'Cornelius', 'Daniël', 'Gerrit', 'Frederik', 'Stefanus', 'Abraham', 'Martinus', 'Nicolaas', 'Christiaan', 'Barend', 'Jan', 'Koos', 'Hennie', 'Piet', 'Dawid', 'Isak', 'Gideon', 'Abdul', 'Achmat'],
          meio: ['Johan', 'Riaan', 'Francois', 'Werner', 'Gerhard', 'Jaco', 'Wynand', 'Christo', 'Charl', 'Danie', 'Marius', 'André', 'Ruan', 'Deon', 'Jacques', 'Stefan', 'Morné', 'Theuns', 'Schalk', 'Eben', 'Llewellyn', 'Clinton', 'Ashley', 'Randall', 'Brendon', 'Ricardo', 'Shaun', 'Faiek'],
          nova: ['Ruben', 'Wian', 'Ruan', 'Divan', 'Jandré', 'Christiaan', 'Daniel', 'Liam', 'Ethan', 'Joshua', 'Caleb', 'Aiden', 'Zander', 'Wihan', 'Dewald', 'Jaden', 'Keagan', 'Tristan', 'Juan', 'Reece', 'Lucas', 'Duan', 'Jayden', 'Tyrone', 'Zaid', 'Mogamat', 'Neo']
        },
        fem: {
          antiga: ['Maria', 'Anna', 'Susanna', 'Johanna', 'Elizabeth', 'Magdalena', 'Catharina', 'Hester', 'Aletta', 'Martha', 'Petronella', 'Sarie', 'Christina', 'Elsie', 'Hendrina', 'Cornelia', 'Jacoba', 'Gertruida', 'Wilhelmina', 'Rachel', 'Sophia', 'Engela', 'Dorothea', 'Francina', 'Louisa', 'Gadija', 'Fatima'],
          meio: ['Elmarie', 'Anneke', 'Liezel', 'Marelize', 'Annelie', 'Riana', 'Charlene', 'Lizelle', 'Marike', 'Yolandi', 'Chantal', 'Natasha', 'Ilse', 'Sonja', 'Carina', 'Michelle', 'Bernadette', 'Charmaine', 'Lorraine', 'Shireen', 'Nadine', 'Mariska', 'Elzette', 'Heidi', 'Desiree', 'Melanie', 'Esmé', 'Waseema'],
          nova: ['Mia', 'Lia', 'Anri', 'Carli', 'Marli', 'Lané', 'Elzaan', 'Simoné', 'Chané', 'Bianca', 'Jana', 'Zoë', 'Mieke', 'Chloe', 'Kayla', 'Tayla', 'Jamie-Lee', 'Megan', 'Nicole', 'Leandri', 'Inge', 'Danielle', 'Amber', 'Aaliyah', 'Imaan', 'Zara', 'Leah']
        },
        sobrenomes: ['Botha', 'Van der Merwe', 'Smit', 'Nel', 'Pretorius', 'Du Plessis', 'Van Wyk', 'Fourie', 'Coetzee', 'Steyn', 'Venter', 'Kruger', 'Le Roux', 'Joubert', 'Van Zyl', 'Swanepoel', 'Engelbrecht', 'Visser', 'Du Toit', 'Snyman', 'Erasmus', 'Marais', 'Louw', 'Potgieter', 'Bezuidenhout', 'Van Niekerk', 'Viljoen', 'Theron', 'Olivier', 'Barnard', 'Jacobs', 'Hendricks', 'Adams', 'Williams', 'Petersen', 'Isaacs', 'Abrahams', 'Arendse', 'Fortuin', 'Booysen', 'Davids', 'Cupido', 'Daniels', 'Jansen', 'Willemse', 'Solomons']
      },
      {
        id: 'ingles', peso: 8.7, divisoes: ['WC', 'KZN'], sobrenome: 'um',
        masc: {
          antiga: ['John', 'Peter', 'David', 'Michael', 'Robert', 'William', 'James', 'Richard', 'Anthony', 'Brian', 'Graham', 'Trevor', 'Colin', 'Neville', 'Keith', 'Rajan', 'Suresh', 'Pravin', 'Dhanraj', 'Krishna', 'Ismail', 'Yusuf', 'Ahmed', 'Logan', 'Ronald', 'Desmond', 'Dennis'],
          meio: ['Craig', 'Gareth', 'Warren', 'Grant', 'Brett', 'Wayne', 'Darren', 'Kevin', 'Mark', 'Jason', 'Dean', 'Shane', 'Ryan', 'Nicholas', 'Sashin', 'Pravesh', 'Ashwin', 'Rajen', 'Kumaran', 'Imraan', 'Kreesan', 'Nirvan', 'Desigan', 'Ebrahim', 'Justin', 'Gavin', 'Bradley'],
          nova: ['Liam', 'Ethan', 'Noah', 'Daniel', 'Joshua', 'Jayden', 'Aiden', 'Luke', 'Matthew', 'Caleb', 'Oliver', 'Jack', 'Nathan', 'Aaron', 'Adam', 'Zayd', 'Muhammad', 'Yusuf', 'Aarav', 'Arjun', 'Kian', 'Reyansh', 'Dhruv', 'Rohan', 'Ayaan', 'Mikhail', 'Kyle']
        },
        fem: {
          antiga: ['Mary', 'Margaret', 'Patricia', 'Elizabeth', 'Susan', 'Barbara', 'Jean', 'Joan', 'Shirley', 'Valerie', 'Pamela', 'Brenda', 'Kamala', 'Saroja', 'Pushpa', 'Savitri', 'Fatima', 'Amina', 'Dorothy', 'Gillian', 'Heather', 'Lynette', 'Sandra', 'Moira', 'Rookmoney', 'Jenny', 'Wendy'],
          meio: ['Nicole', 'Michelle', 'Kerry', 'Lisa', 'Tracey', 'Candice', 'Lauren', 'Kim', 'Natalie', 'Bronwyn', 'Shannon', 'Megan', 'Jessica', 'Kirsty', 'Priya', 'Nirasha', 'Kavitha', 'Shalini', 'Nadia', 'Zaheera', 'Prenisha', 'Kerusha', 'Ashika', 'Tasneem', 'Samantha', 'Claire', 'Debbie'],
          nova: ['Emma', 'Olivia', 'Mia', 'Ava', 'Isabella', 'Chloe', 'Hannah', 'Leah', 'Jessica', 'Amelia', 'Sophia', 'Zara', 'Aisha', 'Ayesha', 'Anaya', 'Diya', 'Kiara', 'Tanisha', 'Riya', 'Saanvi', 'Zoe', 'Lily', 'Grace', 'Ella', 'Abigail', 'Inaaya', 'Hana']
        },
        sobrenomes: ['Naidoo', 'Pillay', 'Govender', 'Reddy', 'Moodley', 'Singh', 'Chetty', 'Maharaj', 'Padayachee', 'Naicker', 'Perumal', 'Moosa', 'Patel', 'Khan', 'Ebrahim', 'Smith', 'Jones', 'Brown', 'Taylor', 'Wilson', 'Johnson', 'Walker', 'Robinson', 'Thompson', 'Clarke', 'Harris', 'Green', 'Hall', 'Turner', 'Wright', 'Edwards', 'Baker', 'Mitchell', 'Parker', 'Stewart', 'Murray', 'Campbell', 'Kelly', 'Bennett', 'Ramsamy', 'Sewpersad', 'Rampersad', 'Essop', 'Cassim']
      },
      {
        id: 'tsonga_venda', peso: 7.2, divisoes: ['LP', 'MP'], sobrenome: 'um',
        masc: {
          antiga: ['Tsakani', 'Hlulani', 'Ntsako', 'Nyiko', 'Tiyani', 'Rhulani', 'Kulani', 'Tinyiko', 'Nhlamulo', 'Vutomi', 'Hlayisani', 'Tshilidzi', 'Rudzani', 'Ndivhuwo', 'Takalani', 'Lufuno', 'Mashudu', 'Khathutshelo', 'Livhuwani', 'Azwinndini', 'Fulufhelo', 'Murendeni', 'Phathutshedzo', 'Samuel', 'Jameson', 'Elias', 'Joseph'],
          meio: ['Tiyani', 'Ntsako', 'Rhulani', 'Nhlamulo', 'Vutomi', 'Hlulani', 'Kulani', 'Tsundzuka', 'Tshilidzi', 'Rudzani', 'Ndivhuwo', 'Takalani', 'Lufuno', 'Mashudu', 'Pfano', 'Ronewa', 'Rotondwa', 'Mulalo', 'Vhutshilo', 'Murendeni', 'Rofhiwa', 'Thendo', 'Gift', 'Prince', 'Lucky', 'Mpho', 'Tumelo'],
          nova: ['Ntsako', 'Ripfumelo', 'Nhlanhla', 'Vutlhari', 'Rirhandzu', 'Tsalwa', 'Hlayiseka', 'Musa', 'Thendo', 'Pfano', 'Ronewa', 'Rofhiwa', 'Wanga', 'Mulalo', 'Vhutshilo', 'Ndamulelo', 'Unarine', 'Lethabo', 'Lesedi', 'Junior', 'Langelihle', 'Lubanzi', 'Mukondi', 'Tshimangadzo', 'Khodani', 'Phindulo', 'Ompha']
        },
        fem: {
          antiga: ['Khensani', 'Tsakani', 'Nyiko', 'Tinyiko', 'Hlengiwe', 'Tintswalo', 'Ntsakisi', 'Rhandzu', 'Mihloti', 'Nkhensani', 'Masingita', 'Rudzani', 'Takalani', 'Mashudu', 'Ndivhuwo', 'Livhuwani', 'Khathutshelo', 'Mpho', 'Tshilidzi', 'Azwindini', 'Fulufhelo', 'Maria', 'Annah', 'Selina', 'Grace', 'Martha', 'Dorah'],
          meio: ['Khensani', 'Ntsakisi', 'Tintswalo', 'Mihloti', 'Nkhensani', 'Masingita', 'Hlamalani', 'Rhulani', 'Tsundzuka', 'Vongani', 'Ntsako', 'Rudzani', 'Takalani', 'Mashudu', 'Ronewa', 'Rotondwa', 'Mulalo', 'Lufuno', 'Pfarelo', 'Thendo', 'Rofhiwa', 'Phathutshedzo', 'Precious', 'Patience', 'Lerato', 'Dineo', 'Tshinakaho'],
          nova: ['Rirhandzu', 'Ripfumelo', 'Vutlhari', 'Hlayiseka', 'Ntsakisi', 'Masingita', 'Tsalwa', 'Nkateko', 'Hlulani', 'Wanga', 'Unarine', 'Thendo', 'Mulalo', 'Ndamulelo', 'Rofhiwa', 'Ronewa', 'Mukondi', 'Khodani', 'Lethabo', 'Lesedi', 'Onalerona', 'Melokuhle', 'Amahle', 'Ompha', 'Tshimangadzo', 'Phindulo', 'Ritshidze']
        },
        sobrenomes: ['Baloyi', 'Mathebula', 'Maluleke', 'Chauke', 'Ngobeni', 'Mabunda', 'Hlungwani', 'Rikhotso', 'Khoza', 'Mashaba', 'Mkhabela', 'Nkuna', 'Mhlanga', 'Valoyi', 'Makhubele', 'Mnisi', 'Shikwambana', 'Mahlaule', 'Novela', 'Shivambu', 'Maswanganyi', 'Sibuyi', 'Mabasa', 'Mudau', 'Netshitenzhe', 'Ravele', 'Mulaudzi', 'Tshivhase', 'Ramabulana', 'Nemavhola', 'Mphephu', 'Munyai', 'Nethengwe', 'Mukwevho', 'Sikhwari', 'Rambau', 'Mudzanani', 'Nemakonde', 'Ramaphosa', 'Netshidzivhani', 'Ndou', 'Muthambi', 'Tshikalange', 'Makhado']
      }
    ]
  },
  fontes: [
    'Stats SA, Census 2022 — língua mais falada no domicílio (statssa.gov.za).',
    'Stats SA / Department of Home Affairs — nomes de bebê mais registrados, 2022–2024 (statssa.gov.za/?p=19000; EWN 21/10/2024).',
    'National Minimum Wage Act 9/2018 e reajuste de 1/3/2026 (R 30,23/h) — Department of Employment and Labour; EWN 5/2/2026.',
    'SARS / National Treasury, Budget 2026 Tax Guide — limiar de isenção 2026/27 (R 99.000).',
    'Unemployment Insurance Act 63/2001 e UIC Act 4/2002 (UIF: 1% + 1%, teto R 17.712).',
    'Basic Conditions of Employment Act 75/1997, s. 41 (severance pay).',
    'Social Assistance Act 13/2004 (Older Person\'s Grant, SASSA).',
    'Constituição de 1996, arts. 46–47, 105–106, 157; Municipal Structures Act 117/1998.',
    'IEC — eleições locais de 4/11/2026; eleições gerais de 29/5/2024.',
    'Intestate Succession Act 81/1987; Wills Act 7/1953; Maintenance of Surviving Spouses Act 27/1990; Reform of Customary Law of Succession Act 11/2009; Estate Duty Act 45/1955.',
    'NSFAS — critério de renda familiar de R 350.000/ano; DHET, estatísticas do ensino superior.',
    'PSL — clubes da Betway Premiership 2025/26; ILOSTAT (emprego informal); Banco Mundial (Gini).'
  ]
};

/* ============================================================= NIGÉRIA */

/*
 * SUCESSÃO — NIGÉRIA (três sistemas convivem: o legislado, o costumeiro e o
 * islâmico; Constituição de 1999, s. 262 e 277, para os tribunais da xaria):
 *  - lei legislada (Wills Act 1837 aplicado como lei recebida; Wills Law de
 *    cada estado, p. ex. Wills Law of Lagos State, Cap. W2, 2015): liberdade
 *    de testar, com pedido de "provisão razoável" para cônjuge e filhos e
 *    ressalva de que o testamento não pode dispor contra o direito
 *    costumeiro sobre certos bens (s. 1 da Wills Law de Lagos);
 *  - sem testamento, para casamento civil (Marriage Act), a Administration of
 *    Estates Law dos estados (modelo inglês): o cônjuge recebe os bens
 *    pessoais e parte do resto, concorrendo com os filhos; sem filhos, divide
 *    com os pais;
 *  - pelo direito costumeiro, as regras variam por povo (p. ex. iorubá:
 *    partilha por ramos de esposas — "idi-igi"; igbo: primogenitura do filho
 *    homem, "okpala"). A Suprema Corte (Ukeje v. Ukeje, 2014) declarou
 *    inconstitucional excluir filhas da herança;
 *  - muçulmanos (a maioria no Norte): quotas fixas do direito islâmico
 *    (malikita), legado limitado a um terço.
 * ABSTRAÇÃO DECLARADA: o jogo usa a lei legislada (liberdade de testar,
 * cônjuge em concorrência com os filhos e metade com os pais, representação,
 * irmãos depois). Não há regime de comunhão de bens no casamento. Não há
 * imposto sobre herança federal; custas de "probate" estaduais e honorários
 * entram como ~6%. Sem herdeiros, os bens vão para o Estado (governo estadual).
 */

/*
 * NOMES — NIGÉRIA. O censo (2006) não perguntou etnia nem língua; os pesos
 * vêm das estimativas de composição étnica mais citadas (CIA World Factbook,
 * 2018: hauçá 30%, iorubá 15,5%, igbo 15,2%, fulani 6%, tiv 2,4%, kanuri
 * 2,4%, ibibio 1,8%, ijaw 1,8%, outros 24,7%). Grupos: hauçá-fulani-kanuri
 * (estados do Norte) 36; iorubá (Sudoeste e Kwara) 16; igbo (Sudeste) 15;
 * sul-sul (Edo, urhobo, ijaw, efik-ibibio e outros do Delta e da costa) 15;
 * cinturão médio (tiv, idoma, igala, berom, nupe e outros) 14. O Território da
 * Capital (Abuja) não tem grupo próprio: ali os nomes saem na proporção
 * nacional. Há cristãos e muçulmanos entre os iorubás (nomes dos dois), e
 * nomes cristãos ingleses em todo o Sul. No Norte o sobrenome costuma ser o
 * nome do pai (Muhammad, Bello, Sani). Sem estatística oficial de nomes:
 * listas de uso corrente (registros escolares, esporte, imprensa).
 */

export const NIGERIA: PerfilDePais = {
  id: 'NG',
  gentilico: ['nigeriano', 'nigeriana'],
  idiomas: ['inglês', 'hauçá', 'iorubá', 'igbo', 'pidgin nigeriano'],
  divisao: {
    tipo: ['estado', 'estados'],
    // Custo e salário: Lagos e o Território da Capital muito acima (aluguel e
    // salários, NBS — Salary/Wage surveys; o Norte rural bem abaixo (NBS, pobreza por estado).
    lista: [
      { codigo: 'LA', nome: 'Lagos', custo: 1.3, salario: 1.3 },
      { codigo: 'FC', nome: 'Território da Capital Federal', custo: 1.25, salario: 1.25 },
      { codigo: 'OG', nome: 'Ogun' },
      { codigo: 'OY', nome: 'Oyo' },
      { codigo: 'OS', nome: 'Osun' },
      { codigo: 'EK', nome: 'Ekiti' },
      { codigo: 'ON', nome: 'Ondo' },
      { codigo: 'KW', nome: 'Kwara' },
      { codigo: 'AN', nome: 'Anambra' },
      { codigo: 'EN', nome: 'Enugu' },
      { codigo: 'EB', nome: 'Ebonyi', custo: 0.9, salario: 0.85 },
      { codigo: 'IM', nome: 'Imo' },
      { codigo: 'AB', nome: 'Abia' },
      { codigo: 'ED', nome: 'Edo' },
      { codigo: 'DE', nome: 'Delta' },
      { codigo: 'RI', nome: 'Rivers', custo: 1.1, salario: 1.1 },
      { codigo: 'BY', nome: 'Bayelsa' },
      { codigo: 'AK', nome: 'Akwa Ibom' },
      { codigo: 'CR', nome: 'Cross River' },
      { codigo: 'BE', nome: 'Benue', custo: 0.9, salario: 0.85 },
      { codigo: 'PL', nome: 'Plateau', custo: 0.9, salario: 0.9 },
      { codigo: 'NA', nome: 'Nasarawa', custo: 0.9, salario: 0.85 },
      { codigo: 'KO', nome: 'Kogi', custo: 0.9, salario: 0.85 },
      { codigo: 'TA', nome: 'Taraba', custo: 0.85, salario: 0.8 },
      { codigo: 'NI', nome: 'Níger', custo: 0.85, salario: 0.8 },
      { codigo: 'KN', nome: 'Kano', custo: 0.9, salario: 0.85 },
      { codigo: 'KD', nome: 'Kaduna', custo: 0.9, salario: 0.9 },
      { codigo: 'KT', nome: 'Katsina', custo: 0.85, salario: 0.8 },
      { codigo: 'SO', nome: 'Sokoto', custo: 0.85, salario: 0.78 },
      { codigo: 'ZA', nome: 'Zamfara', custo: 0.85, salario: 0.78 },
      { codigo: 'KE', nome: 'Kebbi', custo: 0.85, salario: 0.78 },
      { codigo: 'JI', nome: 'Jigawa', custo: 0.85, salario: 0.78 },
      { codigo: 'BA', nome: 'Bauchi', custo: 0.85, salario: 0.8 },
      { codigo: 'GO', nome: 'Gombe', custo: 0.85, salario: 0.8 },
      { codigo: 'AD', nome: 'Adamawa', custo: 0.85, salario: 0.8 },
      { codigo: 'YO', nome: 'Yobe', custo: 0.85, salario: 0.78 },
      { codigo: 'BO', nome: 'Borno', custo: 0.85, salario: 0.78 }
    ]
  },
  cidades: [
    ['Lagos', 'LA', 'metropole', 'litoral'], // a sede do estado é Ikeja, dentro da metrópole
    ['Abuja', 'FC', 'metropole', 'capital|sede'],
    ['Kano', 'KN', 'metropole', 'sede'],
    ['Ibadan', 'OY', 'metropole', 'sede'],
    ['Port Harcourt', 'RI', 'capital', 'sede|litoral'],
    ['Benin City', 'ED', 'capital', 'sede'],
    ['Enugu', 'EN', 'capital', 'sede'],
    ['Kaduna', 'KD', 'capital', 'sede'],
    ['Maiduguri', 'BO', 'capital', 'sede'],
    ['Jos', 'PL', 'capital', 'sede'],
    ['Makurdi', 'BE', 'capital', 'sede|litoral'], // às margens do rio Benue
    ['Aba', 'AB', 'polo'],
    ['Onitsha', 'AN', 'polo', 'litoral'], // às margens do rio Níger
    ['Ikenne', 'OG', 'pequena']
  ],
  economia: {
    // Pobreza: 40% pela linha nacional (NBS, 2019) e ~56% nas estimativas do
    // Banco Mundial após a inflação de 2023–24; Gini ~0,35 no consumo. Classe
    // média urbana real mas estreita; topo muito pequeno.
    classes: { vulneravel: 45, trabalhadora: 30, media_baixa: 13, media: 9, alta: 3 },
    // Aluguel urbano (Lagos, Abuja) caro e pago adiantado por um ou dois anos,
    // enquanto o resto dos preços é baixo em dólar.
    moradia: 1.15,
    // National Minimum Wage (Amendment) Act 2024: ₦ 70.000/mês.
    salarioMinimo: 70000,
    // Emprego informal ~93% (NBS, NLFS; ILOSTAT).
    informalidade: 0.92,
    // CPI: ~33% em 2024 (base antiga); após o rebase de 2025, ~15–20% ao ano.
    inflacao: 0.2,
    volatilidade: 2.2
  },
  trabalho: {
    mesesPagos: 12,
    // Contributory Pension Scheme (Pension Reform Act 2014): 8% do empregado
    // (10% do empregador), sem teto.
    contribuicao: { aliquota: [0.08, 0.08] },
    // Nigeria Tax Act 2025 (vigente desde 1/1/2026): os primeiros ₦ 800.000/ano
    // isentos (≈ ₦ 66.667/mês); depois 15%, 18%, 21%... — 0,15 representa a faixa típica.
    impostoRenda: { isencao: 66667, aliquota: 0.15 },
    // Labour Act (Cap. L1): só aviso prévio; indenização por redundância apenas
    // por negociação ou acordo coletivo (s. 20).
    rescisao: { nome: 'aviso prévio (sem indenização legal)', mesesPorAno: 0 },
    // Sem seguro-desemprego público.
    // Aposentadoria: conta individual (RSA) do CPS; saque/pensão a partir dos
    // 50 anos ou na aposentadoria (60 no serviço público). Sem tempo mínimo legal.
    previdencia: { idade: [60, 60], anos: [0, 0], reposicao: 0.35, nome: 'o Regime de Pensões Contributivo (PenCom)' },
    concurso: false, // a Federal Civil Service Commission recruta por vaga e entrevista, com "federal character"
    contratoFormal: 'emprego formal com pensão (PenCom)'
  },
  educacao: {
    etapas: {
      // Universal Basic Education Act 2004: 9 anos obrigatórios (primário + Junior Secondary);
      // depois Senior Secondary (SS1–SS3) e os exames WAEC/NECO.
      fundamental: 'ensino básico', medio: 'ensino médio (senior secondary)', serieMedio: 'ano',
      publica: { creche: 'a pré-escola pública', fundamental: 'a escola primária pública', medio: 'a escola secundária pública' }
    },
    // O JAMB aplica o UTME; a universidade faz a triagem pós-UTME com as notas do WAEC/NECO.
    ingresso: 'exame_nacional',
    exame: { nome: 'UTME (JAMB)', artigo: 'o' },
    // Federais cobram taxas baixas; privadas cobram de 5 a 20 vezes mais.
    publicaCobra: 0.12,
    // NELFUND: crédito estudantil federal (Student Loans (Access to Higher Education) Act 2024),
    // sem teto de renda desde a revisão de 2024.
    credito: { nome: 'NELFUND (empréstimo estudantil)' },
    // As diretrizes de admissão reservam vagas por estado de origem ("catchment" e
    // estados educacionalmente menos desenvolvidos), não por renda ou escola pública.
    cotas: false,
    privadaComum: false
  },
  politica: {
    sistema: 'república presidencialista federal de 36 estados e o Território da Capital',
    cargos: {
      // Conselhos e presidentes dos 774 governos locais (LGAs): leis estaduais e
      // comissões eleitorais estaduais; mandato de 3 a 4 anos conforme o estado (Lagos: 4).
      vereador: { titulo: ['conselheiro do governo local', 'conselheira do governo local'], anos: 4, idade: 25, casa: 'o Conselho do Governo Local' },
      prefeito: { titulo: ['presidente do governo local', 'presidente do governo local'], anos: 4, idade: 30, casa: 'o Secretariado do Governo Local' },
      // Constituição de 1999, ss. 65, 106, 131, 177 (Not Too Young To Run, 4.ª emenda de 2018).
      deputado_estadual: { titulo: ['deputado estadual', 'deputada estadual'], anos: 4, idade: 25, casa: 'a Câmara da Assembleia Estadual' },
      deputado_federal: { titulo: ['deputado federal', 'deputada federal'], anos: 4, idade: 25, casa: 'a Câmara dos Representantes' },
      senador: { titulo: ['senador', 'senadora'], anos: 4, idade: 35, casa: 'o Senado' },
      governador: { titulo: ['governador', 'governadora'], anos: 4, idade: 35, casa: 'o Governo do Estado' }
    },
    // Gerais: INEC, presidente e Assembleia Nacional em 16/1/2027 (Electoral Act 2026).
    // Locais: calendários estaduais (Lagos, julho de 2025).
    eleicoes: { local: [2025, 4], geral: [2027, 4] },
    mes: 0,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // o NYSC (um ano de serviço civil obrigatório para graduados) não é militar
    idade: 18,
    forcas: { exercito: 'o Exército da Nigéria', marinha: 'a Marinha da Nigéria', aeronautica: 'a Força Aérea da Nigéria' },
    policia: 'a Força Policial da Nigéria'
  },
  esporte: {
    // Futebol domina; atletismo e basquete (D'Tigress) fortes; luta e boxe tradicionais.
    popularidade: { futebol: 1.45, volei: 0.6, basquete: 1.0, natacao: 0.5, atletismo: 1.2, lutas: 1.05, tenis: 0.55 },
    divisoes: ['ligas estaduais', 'Nationwide League One', 'Nigeria National League', 'NPFL'],
    clubes: [
      { nome: 'Enyimba', artigo: 'o', porte: 'grande', cidade: 'Aba' },
      { nome: 'Kano Pillars', artigo: 'o', porte: 'grande', cidade: 'Kano' },
      { nome: 'Rangers International', artigo: 'o', porte: 'grande', cidade: 'Enugu' },
      { nome: 'Shooting Stars', artigo: 'o', porte: 'tradicional', cidade: 'Ibadan' },
      { nome: 'Rivers United', artigo: 'o', porte: 'tradicional', cidade: 'Port Harcourt' },
      { nome: 'Remo Stars', artigo: 'o', porte: 'tradicional', cidade: 'Ikenne' },
      { nome: 'Plateau United', artigo: 'o', porte: 'tradicional', cidade: 'Jos' },
      { nome: 'Bendel Insurance', artigo: 'o', porte: 'tradicional', cidade: 'Benin City' },
      { nome: 'El-Kanemi Warriors', artigo: 'o', porte: 'tradicional', cidade: 'Maiduguri' },
      { nome: 'Ikorodu City', artigo: 'o', porte: 'tradicional', cidade: 'Lagos' },
      { nome: 'Lobi Stars', artigo: 'o', porte: 'regional', cidade: 'Makurdi' },
      { nome: 'Kaduna United', artigo: 'o', porte: 'regional', cidade: 'Kaduna' }
    ]
  },
  // Hospitais públicos cobram; seguro (NHIA, National Health Insurance Authority Act 2022)
  // cobre pouco mais de 10%; a maior parte é paga do bolso.
  saude: { sistema: 'misto', redePublica: 'os hospitais públicos (com cobrança) e o NHIA', custoPlano: 0.5 },
  // CEDEAO: livre entrada e residência de cidadãos da comunidade; de fora, cota de expatriados.
  migracao: { blocos: ['cedeao'], abertura: 'restrita' },
  sucessao: {
    pais: 'NG',
    nome: 'Nigéria',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 2, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.06,
    rotuloCusto: 'custas de probate e honorários',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2000],
    grupos: [
      {
        id: 'hausa_fulani_kanuri', peso: 36, divisoes: ['KN', 'KD', 'KT', 'SO', 'ZA', 'KE', 'JI', 'BA', 'GO', 'AD', 'YO', 'BO', 'NI'], sobrenome: 'um',
        masc: {
          antiga: ['Muhammadu', 'Abubakar', 'Usman', 'Bello', 'Sani', 'Musa', 'Ibrahim', 'Aliyu', 'Garba', 'Haruna', 'Lawal', 'Yakubu', 'Idris', 'Umaru', 'Abdullahi', 'Adamu', 'Shehu', 'Tanko', 'Danjuma', 'Audu', 'Isa', 'Mamman', 'Dauda', 'Yusufu', 'Sule', 'Ahmadu', 'Inuwa', 'Bala', 'Modu', 'Bukar', 'Kyari', 'Goni', 'Zanna'],
          meio: ['Abdulrahman', 'Aminu', 'Nasiru', 'Kabiru', 'Bashir', 'Mustapha', 'Jamilu', 'Mansur', 'Abdulkadir', 'Sadiq', 'Nura', 'Auwal', 'Salisu', 'Ismail', 'Umar', 'Yahaya', 'Murtala', 'Shamsuddeen', 'Hamisu', 'Bilyaminu', 'Zubairu', 'Faruk', 'Rabiu', 'Hamza', 'Sanusi', 'Ahmad', 'Babagana', 'Mala', 'Lawan'],
          nova: ['Muhammad', 'Abdullahi', 'Abubakar', 'Umar', 'Usman', 'Aliyu', 'Ahmad', 'Ibrahim', 'Yusuf', 'Abdulrahman', 'Abdulmalik', 'Mubarak', 'Khalid', 'Sulaiman', 'Zakariyya', 'Hamza', 'Bilal', 'Isma\'il', 'Anas', 'Habibu', 'Fahad', 'Faisal', 'Abdulaziz', 'Mustapha', 'Al-Amin', 'Sadiq', 'Yahaya', 'Haruna', 'Nasir', 'Abba']
        },
        fem: {
          antiga: ['Hauwa', 'Aisha', 'Fatima', 'Zainab', 'Hadiza', 'Amina', 'Halima', 'Maryam', 'Hajara', 'Binta', 'Ladi', 'Rakiya', 'Asabe', 'Talatu', 'Lami', 'Saratu', 'Habiba', 'Hafsat', 'Larai', 'Jummai', 'Kulu', 'Rabi', 'Uwani', 'Balaraba', 'Khadija', 'Inna', 'Falmata', 'Kaltume', 'Yagana'],
          meio: ['Zainab', 'Hadiza', 'Fatima', 'Rukayya', 'Maryam', 'Hafsat', 'Aisha', 'Bilkisu', 'Hauwa', 'Ummi', 'Sadiya', 'Hajara', 'Safiya', 'Rahama', 'Nafisa', 'Firdausi', 'Asma\'u', 'Jamila', 'Zulaihat', 'Khadija', 'Halima', 'Murja', 'Rashida', 'Samira', 'Mariya', 'Amina', 'Habiba', 'Falmata'],
          nova: ['Fatima', 'Aisha', 'Khadija', 'Maryam', 'Zainab', 'Hafsat', 'Hauwa', 'Amina', 'Asma\'u', 'Rukayya', 'Safiya', 'Nana Aisha', 'Khadijat', 'Ummulkhairi', 'Fiddausi', 'Sumayya', 'Hanifa', 'Jamila', 'Nusaiba', 'Hafsa', 'Halima', 'Zahra\'u', 'Aminatu', 'Hassana', 'Husseina', 'Juwairiyya', 'Hadiza', 'Bilkisu', 'Fadila']
        },
        sobrenomes: ['Muhammad', 'Abubakar', 'Bello', 'Sani', 'Usman', 'Ibrahim', 'Musa', 'Aliyu', 'Yusuf', 'Garba', 'Lawal', 'Abdullahi', 'Umar', 'Haruna', 'Yakubu', 'Idris', 'Adamu', 'Shehu', 'Dahiru', 'Danjuma', 'Suleiman', 'Isa', 'Mustapha', 'Abdulkadir', 'Ahmed', 'Bala', 'Kabir', 'Ismail', 'Hassan', 'Tanko', 'Gambo', 'Jibril', 'Mahmud', 'Danladi', 'Wada', 'Gwarzo', 'Tukur', 'Sambo', 'Jega', 'Dikko', 'Maigari', 'Bukar', 'Modu', 'Kyari', 'Goni', 'Zanna', 'Bulama']
      },
      {
        id: 'ioruba', peso: 16, divisoes: ['LA', 'OY', 'OG', 'OS', 'EK', 'ON', 'KW'], sobrenome: 'um',
        masc: {
          antiga: ['Adebayo', 'Olusegun', 'Oluwole', 'Babatunde', 'Adewale', 'Akinwale', 'Adeyemi', 'Olufemi', 'Kayode', 'Oladipo', 'Ayodele', 'Gbenga', 'Kehinde', 'Taiwo', 'Abiodun', 'Adekunle', 'Bolaji', 'Kolawole', 'Sunday', 'Samuel', 'Joseph', 'Rasheed', 'Lateef', 'Ganiyu', 'Tajudeen', 'Yekini', 'Kazeem', 'Emmanuel'],
          meio: ['Tunde', 'Seun', 'Tolu', 'Dayo', 'Segun', 'Kunle', 'Wale', 'Gbolahan', 'Ayo', 'Damilare', 'Olumide', 'Tobi', 'Bayo', 'Kola', 'Rotimi', 'Ademola', 'Femi', 'Babajide', 'Lekan', 'Tope', 'Yinka', 'Abiola', 'Waheed', 'Akeem', 'Kabiru', 'Oluwaseun', 'Opeyemi', 'Damola'],
          nova: ['Ayomide', 'Toluwani', 'Damilola', 'Oluwatobi', 'Mayowa', 'Inioluwa', 'Ifeoluwa', 'Oreoluwa', 'Ayobami', 'Fiyinfoluwa', 'Boluwatife', 'Temiloluwa', 'Pelumi', 'Tobiloba', 'Ayomikun', 'Feranmi', 'Daniel', 'David', 'Samuel', 'Joshua', 'Emmanuel', 'Abdulrahman', 'Mubarak', 'Ridwan', 'Faruq', 'Abdulmalik', 'Taiwo', 'Kehinde']
        },
        fem: {
          antiga: ['Folake', 'Funmilayo', 'Bolanle', 'Yetunde', 'Olufunke', 'Abosede', 'Adunni', 'Kehinde', 'Taiwo', 'Bukola', 'Iyabo', 'Adebisi', 'Modupe', 'Omolara', 'Foluke', 'Titilayo', 'Morenike', 'Olabisi', 'Adenike', 'Comfort', 'Grace', 'Alice', 'Sidikat', 'Kudirat', 'Mulikat', 'Ramota', 'Silifat'],
          meio: ['Funke', 'Bisola', 'Yewande', 'Titilope', 'Ronke', 'Toyin', 'Bimpe', 'Omotola', 'Yemisi', 'Bukola', 'Shade', 'Tolulope', 'Bunmi', 'Kemi', 'Moji', 'Temitope', 'Tola', 'Folasade', 'Adeola', 'Aisha', 'Bisi', 'Fisayo', 'Opeyemi', 'Nike', 'Abimbola', 'Busola', 'Kafayat', 'Wuraola'],
          nova: ['Ayomide', 'Darasimi', 'Eniola', 'Ireoluwa', 'Morenike', 'Oyindamola', 'Tiwalade', 'Anjola', 'Ifeoluwa', 'Toluwalase', 'Fiyinfoluwa', 'Temiloluwa', 'Oreoluwa', 'Simisola', 'Precious', 'Favour', 'Esther', 'Deborah', 'Mariam', 'Aishat', 'Rofiat', 'Fathia', 'Halimah', 'Barakat', 'Mosunmola', 'Ewaoluwa', 'Jesutofunmi', 'Inioluwa']
        },
        sobrenomes: ['Adeyemi', 'Adebayo', 'Ogunleye', 'Ogundipe', 'Adewale', 'Olawale', 'Bakare', 'Balogun', 'Olaniyan', 'Afolabi', 'Akinola', 'Ogunbiyi', 'Adeleke', 'Akande', 'Ajayi', 'Oladipo', 'Babalola', 'Adesina', 'Akinyemi', 'Olatunji', 'Oyewole', 'Adeniyi', 'Oyebanji', 'Ojo', 'Alabi', 'Lawal', 'Salami', 'Bello', 'Ayodele', 'Oni', 'Ogundele', 'Adegoke', 'Ilori', 'Fadipe', 'Akinwumi', 'Ogunbanjo', 'Oyeyemi', 'Odutola', 'Oke', 'Olanrewaju', 'Fakoya', 'Adeoye', 'Adegbite', 'Okunola', 'Aderemi']
      },
      {
        id: 'igbo', peso: 15, divisoes: ['AN', 'EN', 'EB', 'IM', 'AB'], sobrenome: 'um',
        masc: {
          antiga: ['Chukwuemeka', 'Nnamdi', 'Okechukwu', 'Obinna', 'Ikechukwu', 'Emeka', 'Chinedu', 'Uchenna', 'Ifeanyi', 'Nwabueze', 'Obiora', 'Chibuzo', 'Ejike', 'Nnaemeka', 'Azubuike', 'Ndubuisi', 'Chidi', 'Augustine', 'Cyprian', 'Christopher', 'Boniface', 'Patrick', 'Anthony', 'Celestine', 'Sylvester', 'Innocent', 'Benedict', 'Ignatius'],
          meio: ['Chinonso', 'Chukwudi', 'Kelechi', 'Chidiebere', 'Ebuka', 'Ikenna', 'Tochukwu', 'Chiedozie', 'Uzoma', 'Arinze', 'Kenechukwu', 'Onyeka', 'Nonso', 'Chijioke', 'Uchechukwu', 'Kingsley', 'Emmanuel', 'Ugochukwu', 'Chuka', 'Chiemeka', 'Obinna', 'Chinedu', 'Ifeanyichukwu', 'Somadina', 'Okwudili', 'Chibuike', 'Ekene'],
          nova: ['Chukwuebuka', 'Kosisochukwu', 'Somtochukwu', 'Chibueze', 'Kamsiyochukwu', 'Munachimso', 'Ebubechukwu', 'Chidubem', 'Kamsi', 'Chimezie', 'Tobechukwu', 'Ifechukwu', 'Chisom', 'Chiemerie', 'Ugonna', 'Chinedum', 'Kenenna', 'Chimdindu', 'Daniel', 'David', 'Emmanuel', 'Samuel', 'Michael', 'Joshua', 'Victor', 'Chidera', 'Somkenechukwu']
        },
        fem: {
          antiga: ['Ngozi', 'Nkechi', 'Chinwe', 'Adaeze', 'Ifeoma', 'Uche', 'Nneka', 'Chioma', 'Obiageli', 'Nkiru', 'Ebele', 'Adaobi', 'Amaka', 'Ugochi', 'Uzoamaka', 'Philomena', 'Theresa', 'Veronica', 'Bernadette', 'Agatha', 'Monica', 'Comfort', 'Josephine', 'Felicia', 'Christiana', 'Patience', 'Ijeoma'],
          meio: ['Chiamaka', 'Chidinma', 'Nneoma', 'Ogechi', 'Chinyere', 'Ijeoma', 'Amarachi', 'Adaku', 'Chinenye', 'Nkem', 'Ifeoma', 'Chinelo', 'Obioma', 'Ebere', 'Onyinye', 'Oluchi', 'Ujunwa', 'Ebelechukwu', 'Blessing', 'Joy', 'Precious', 'Gift', 'Chika', 'Nnenna', 'Ngozi', 'Uchechi', 'Chinasa'],
          nova: ['Chiamaka', 'Adaeze', 'Chimamaka', 'Kosisochukwu', 'Zikora', 'Munachi', 'Ifunanya', 'Chisom', 'Amarachi', 'Somtochukwu', 'Chidera', 'Ezinne', 'Oluebube', 'Mmesoma', 'Precious', 'Favour', 'Peace', 'Chinaza', 'Adaugo', 'Nnenna', 'Ugomma', 'Chinemerem', 'Onyinyechi', 'Ozioma', 'Daberechi', 'Amara', 'Kamsiyochukwu']
        },
        sobrenomes: ['Okafor', 'Okonkwo', 'Eze', 'Nwosu', 'Okeke', 'Nwachukwu', 'Okoro', 'Obi', 'Chukwu', 'Okoye', 'Nwankwo', 'Igwe', 'Ezeh', 'Onuoha', 'Nnadi', 'Uzor', 'Agu', 'Ani', 'Nwafor', 'Ugwu', 'Odo', 'Onyeama', 'Mbah', 'Ezeani', 'Udeh', 'Anyanwu', 'Iwu', 'Ibe', 'Ezenwa', 'Onwuka', 'Okolie', 'Ogbonna', 'Nweke', 'Ndukwe', 'Ikeh', 'Emenike', 'Nwagbara', 'Okpara', 'Obiakor', 'Ekwueme', 'Onyeka', 'Nnaji', 'Nwokolo', 'Okoli', 'Ezeugwu']
      },
      {
        id: 'sul_sul', peso: 15, divisoes: ['ED', 'DE', 'RI', 'BY', 'AK', 'CR'], sobrenome: 'um',
        masc: {
          antiga: ['Osagie', 'Osaro', 'Efosa', 'Eghosa', 'Ovie', 'Efe', 'Tonye', 'Tari', 'Boma', 'Ebi', 'Ubong', 'Aniekan', 'Nsikan', 'Etim', 'Okon', 'Effiong', 'Bassey', 'Edet', 'Sunday', 'Monday', 'Godwin', 'Friday', 'Felix', 'Lucky', 'Samuel', 'Peter', 'Matthew', 'Emmanuel'],
          meio: ['Osas', 'Ehis', 'Osayande', 'Efosa', 'Oghenekaro', 'Ejiro', 'Tega', 'Oghenetega', 'Onome', 'Preye', 'Timi', 'Diepreye', 'Ibim', 'Tamuno', 'Ubong', 'Aniekan', 'Iniobong', 'Utibe', 'Mfon', 'Edidiong', 'Kingsley', 'Godspower', 'Prince', 'Victor', 'Henry', 'Wisdom', 'Ebiye'],
          nova: ['Osariemen', 'Eseosa', 'Osamudiamen', 'Ehimen', 'Oghenefejiro', 'Oghenerukevwe', 'Ovie', 'Tega', 'Ebikabowei', 'Preye', 'Tamunotonye', 'Ibinabo', 'Ubong', 'Uwem', 'Ime', 'Idorenyin', 'Mfon', 'Daniel', 'David', 'Joshua', 'Emmanuel', 'Divine', 'Goodluck', 'Testimony', 'Miracle', 'Praise', 'Godsfavour']
        },
        fem: {
          antiga: ['Osayuki', 'Osasu', 'Ivie', 'Efe', 'Onome', 'Ejiro', 'Ebiere', 'Ibiere', 'Ekaette', 'Imaobong', 'Idara', 'Uduak', 'Emem', 'Ini', 'Arit', 'Affiong', 'Nkoyo', 'Grace', 'Comfort', 'Patience', 'Mercy', 'Florence', 'Elizabeth', 'Christiana', 'Esther', 'Rose', 'Ebi'],
          meio: ['Osas', 'Ivie', 'Eseosa', 'Ehis', 'Ejiro', 'Onome', 'Oghenekome', 'Tega', 'Ebiere', 'Preye', 'Tamara', 'Ibiso', 'Boma', 'Ekaette', 'Imaobong', 'Idara', 'Uduak', 'Emem', 'Itoro', 'Edidiong', 'Blessing', 'Gift', 'Mercy', 'Favour', 'Joy', 'Peace', 'Ofonmbuk'],
          nova: ['Osariemen', 'Eseosa', 'Osaretin', 'Oghenefejiro', 'Oghenerukevwe', 'Ejiro', 'Tamaraebi', 'Ebiere', 'Preye', 'Ibinabo', 'Tamunosaki', 'Idara', 'Imaobong', 'Uduak', 'Edidiong', 'Ini', 'Precious', 'Favour', 'Divine', 'Miracle', 'Praise', 'Blessing', 'Esther', 'Deborah', 'Testimony', 'Goodness', 'Peace']
        },
        sobrenomes: ['Osagie', 'Omoregie', 'Igbinedion', 'Aigbe', 'Ogbeide', 'Osayande', 'Iyamu', 'Edosomwan', 'Erhabor', 'Ighodaro', 'Omonigho', 'Ovwigho', 'Oghenekaro', 'Okpako', 'Akpobome', 'Amachree', 'Dappa', 'Briggs', 'Jumbo', 'Horsfall', 'George', 'Ebiowei', 'Ebiye', 'Udo', 'Essien', 'Akpan', 'Etim', 'Bassey', 'Okon', 'Effiong', 'Ekpo', 'Umoh', 'Inyang', 'Ekanem', 'Asuquo', 'Edet', 'Etuk', 'Udoh', 'Archibong', 'Henshaw', 'Duke', 'Eyo', 'Ita', 'Okoh', 'Ikpeba']
      },
      {
        id: 'cinturao_medio', peso: 14, divisoes: ['BE', 'PL', 'NA', 'KO', 'TA'], sobrenome: 'um',
        masc: {
          antiga: ['Terver', 'Terkula', 'Tersoo', 'Aondona', 'Iorwuese', 'Ochai', 'Ocheja', 'Agada', 'Onuh', 'Gyang', 'Dung', 'Pam', 'Davou', 'Choji', 'Bitrus', 'Danladi', 'Yakubu', 'Musa', 'Joseph', 'John', 'Peter', 'Samuel', 'Daniel', 'Moses', 'Simon', 'Paul', 'James', 'Andrew'],
          meio: ['Msughter', 'Sesugh', 'Tersoo', 'Terhemba', 'Aondofa', 'Iorliam', 'Ojonugwa', 'Ojochide', 'Ochai', 'Ene', 'Gyang', 'Dalyop', 'Davou', 'Nanmwa', 'Bitrus', 'Ishaya', 'Emmanuel', 'Godwin', 'Solomon', 'Stephen', 'Jonathan', 'Blessing', 'Friday', 'Victor', 'Abdullahi', 'Ibrahim', 'Yusuf'],
          nova: ['Msughter', 'Sesugh', 'Terungwa', 'Aondover', 'Mlumun', 'Ojonugwa', 'Ojonimi', 'Ojomideju', 'Ene', 'Gyang', 'Nanmwa', 'Daniel', 'David', 'Joshua', 'Emmanuel', 'Samuel', 'Elijah', 'Gideon', 'Caleb', 'Favour', 'Precious', 'Muhammad', 'Abubakar', 'Ibrahim', 'Yusuf', 'Isaac', 'Ezekiel']
        },
        fem: {
          antiga: ['Doosuur', 'Mwuese', 'Mnena', 'Dooshima', 'Ngodoo', 'Seember', 'Hembadoon', 'Ene', 'Ojoma', 'Ladi', 'Kaneng', 'Rifkatu', 'Asabe', 'Talatu', 'Mary', 'Grace', 'Comfort', 'Esther', 'Sarah', 'Rebecca', 'Ruth', 'Hannah', 'Dorcas', 'Rhoda', 'Martha', 'Hauwa', 'Fatima'],
          meio: ['Doosuur', 'Mwuese', 'Mnena', 'Dooshima', 'Seember', 'Member', 'Erdoo', 'Ojochenemi', 'Ojoma', 'Ene', 'Kaneng', 'Nanret', 'Kangyang', 'Rifkatu', 'Blessing', 'Patience', 'Mercy', 'Joy', 'Gloria', 'Deborah', 'Esther', 'Victoria', 'Juliana', 'Hauwa', 'Zainab', 'Aisha', 'Ladi'],
          nova: ['Doosuur', 'Mwuese', 'Seember', 'Msurshima', 'Erdoo', 'Mimidoo', 'Ojochenemi', 'Ojonoka', 'Ene', 'Nanret', 'Kaneng', 'Favour', 'Precious', 'Blessing', 'Miracle', 'Esther', 'Deborah', 'Abigail', 'Elizabeth', 'Rebecca', 'Joy', 'Grace', 'Divine', 'Fatima', 'Aisha', 'Maryam', 'Hadiza']
        },
        sobrenomes: ['Akaa', 'Aondoakaa', 'Iorliam', 'Iorkyaa', 'Tarka', 'Akume', 'Iyorchia', 'Ugbah', 'Ode', 'Adoga', 'Ogbu', 'Agbo', 'Onoja', 'Ocheja', 'Idoko', 'Attah', 'Ameh', 'Achimugu', 'Gyang', 'Dalyop', 'Pam', 'Davou', 'Jang', 'Bot', 'Choji', 'Dung', 'Nuhu', 'Ndagi', 'Kolo', 'Gana', 'Saba', 'Jiya', 'Tsado', 'Bawa', 'Yakubu', 'Danjuma', 'Agbese', 'Ochai', 'Akpa', 'Abu', 'Haruna', 'Usman']
      }
    ]
  },
  fontes: [
    'Constituição da República Federal da Nigéria, 1999 (ss. 65, 106, 131, 177; 4.ª emenda de 2018, "Not Too Young To Run").',
    'INEC — calendário revisto das eleições gerais de 2027 (presidente e Assembleia Nacional em 16/1/2027; Electoral Act 2026).',
    'National Minimum Wage (Amendment) Act 2024 (₦ 70.000).',
    'Nigeria Tax Act 2025 (faixas de imposto de renda pessoal vigentes desde 1/1/2026).',
    'Pension Reform Act 2014 (PenCom: 8% + 10%); Labour Act, Cap. L1 LFN 2004.',
    'Universal Basic Education Act 2004; JAMB (UTME); Student Loans (Access to Higher Education) Act 2024 (NELFUND).',
    'Wills Act 1837 (lei recebida); Wills Law of Lagos State; Administration of Estates Laws estaduais; Ukeje v. Ukeje (Suprema Corte, 2014).',
    'NBS — Nigeria Labour Force Survey (informalidade); NBS 2019 Poverty and Inequality; Banco Mundial, Nigeria Poverty Assessment.',
    'National Health Insurance Authority Act 2022; Protocolo da CEDEAO sobre livre circulação (1979).',
    'CIA World Factbook (composição étnica, estimativa de 2018) — o censo nigeriano não coleta etnia.',
    'NPFL — clubes da temporada 2025/26.'
  ]
};

/* ============================================================== ANGOLA */

/*
 * SUCESSÃO — ANGOLA (Código Civil de 1966, mantido em vigor na independência
 * pela Lei Constitucional e pela Constituição de 2010, art. 239.º, SEM a
 * reforma portuguesa de 1977; Código da Família, Lei 1/88):
 *  - classes de sucessíveis (art. 2133.º do CC angolano): descendentes;
 *    ascendentes; irmãos e seus descendentes; o CÔNJUGE só em quarto lugar;
 *    depois os outros colaterais e o Estado — a doutrina angolana registra
 *    que "não se prevê o cônjuge sobrevivo como um herdeiro prioritário"
 *    (Bartolomeu, Revista Angolana de Ciências, 2019);
 *  - herdeiros legitimários: descendentes e ascendentes (art. 2157.º, texto
 *    de 1966); a legítima dos filhos é metade (um filho) ou dois terços (dois
 *    ou mais) do patrimônio; a dos pais, metade (arts. 2158.º–2161.º);
 *  - o cônjuge fica protegido pela MEAÇÃO: o regime supletivo é a comunhão
 *    de adquiridos (Código da Família; art. 75.º, n.º 2, para a partilha), e
 *    a união de facto reconhecida produz efeitos patrimoniais;
 *  - representação dos descendentes (art. 2140.º); sem herdeiros, o Estado.
 * SIMPLIFICAÇÕES DECLARADAS: a legítima dos filhos vira dois terços (o caso
 * mais comum, dois ou mais filhos); o cônjuge não concorre com descendentes
 * nem com ascendentes (fração 0) e herda só na falta deles e dos irmãos —
 * o motor coloca o cônjuge antes dos irmãos nesse último degrau, o que é
 * uma aproximação; a apropriação de bens pela família alargada por costume
 * (comum, e documentada) não é modelada. Custos da habilitação de herdeiros,
 * registos e impostos sobre transmissões gratuitas entram como ~3%.
 */

/*
 * NOMES — ANGOLA. Censo 2014 (INE): o português é a língua falada em casa
 * por ~71% (88% em Luanda); umbundo ~23%, kikongo 8,2%, kimbundo 7,8%,
 * cokwe 6,5%, nhaneca 3,4%, nganguela 3,1%. Os nomes próprios são em sua
 * grande maioria portugueses/cristãos em todo o país (a Lei do Registo Civil
 * admite também nomes nacionais, como Nzinga ou Kiluanji); os apelidos
 * misturam portugueses (muitos derivados de nomes próprios: António,
 * Domingos, Francisco) e de origem banta. Grupos: 'comum' (urbano/lusófono,
 * sem região) 32; 'centro_sul' (planalto umbundo e Sul: Huambo, Benguela,
 * Bié, Cuanza Sul, Huíla, Namibe, Cunene) 38; 'norte' (kimbundo e kikongo:
 * Bengo, Cuanza Norte, Malanje, Uíge, Zaire, Cabinda) 30. O Leste (Lunda-
 * cokwe) não tem grupo próprio por falta de fonte confiável de apelidos
 * cokwe/lunda: ali saem os nomes comuns. Sem estatística oficial de nomes.
 */

const AO_MASC = {
  antiga: ['José', 'Manuel', 'António', 'João', 'Francisco', 'Domingos', 'Pedro', 'Paulo', 'Afonso', 'Sebastião', 'Joaquim', 'Bernardo', 'Mateus', 'Agostinho', 'Alberto', 'Augusto', 'Fernando', 'Lourenço', 'Simão', 'Miguel', 'André', 'Garcia', 'Gaspar', 'Tomás', 'Cristóvão', 'Daniel', 'Isaías', 'Jeremias', 'Abel', 'Lucas'],
  meio: ['Nelson', 'Wilson', 'Adilson', 'Edvaldo', 'Hélder', 'Mauro', 'Yuri', 'Celso', 'Ednilson', 'Eduardo', 'Valter', 'Hélio', 'Edson', 'Jorge', 'Carlos', 'Manuel', 'Mário', 'Rui', 'Pedro', 'Fernando', 'Domingos', 'Anselmo', 'Arlindo', 'Délcio', 'Osvaldo', 'Edgar', 'Joel', 'Ivo', 'Ildo', 'Sílvio'],
  nova: ['Yuri', 'Kelson', 'Gelson', 'Wesley', 'Kevin', 'Elisandro', 'Isaac', 'Eliseu', 'Josué', 'Emanuel', 'Daniel', 'David', 'Gabriel', 'Miguel', 'Samuel', 'Rafael', 'Gerson', 'Nilton', 'Aldair', 'Kiluanji', 'Ngola', 'Hernâni', 'Délcio', 'Cleyton', 'Leonel', 'Jefferson', 'Dário', 'Ricardo', 'Mauro', 'Edmilson']
};
const AO_FEM = {
  antiga: ['Maria', 'Ana', 'Teresa', 'Isabel', 'Joana', 'Madalena', 'Rosa', 'Luzia', 'Domingas', 'Esperança', 'Albertina', 'Laurinda', 'Feliciana', 'Engrácia', 'Ermelinda', 'Filomena', 'Josefa', 'Celeste', 'Graciete', 'Conceição', 'Helena', 'Rita', 'Margarida', 'Antónia', 'Francisca', 'Catarina', 'Joaquina', 'Fernanda', 'Benvinda', 'Adelaide'],
  meio: ['Ana Paula', 'Edna', 'Elsa', 'Sandra', 'Yolanda', 'Nádia', 'Djamila', 'Suzana', 'Ivone', 'Mirian', 'Telma', 'Marisa', 'Délcia', 'Neusa', 'Rosária', 'Cleide', 'Edmira', 'Graciana', 'Ednalva', 'Luísa', 'Paula', 'Esperança', 'Domingas', 'Teresa', 'Cristina', 'Vanda', 'Wanda', 'Isabel', 'Josefina', 'Elisa'],
  nova: ['Yara', 'Kiara', 'Anaísa', 'Nzinga', 'Kianda', 'Yolanda', 'Esperança', 'Daniela', 'Gabriela', 'Rebeca', 'Ester', 'Débora', 'Sara', 'Raquel', 'Mariana', 'Beatriz', 'Leonor', 'Eunice', 'Jéssica', 'Stefany', 'Kátia', 'Yasmin', 'Ariana', 'Edna', 'Iracema', 'Naiara', 'Ruth', 'Adriana', 'Vitória', 'Helena']
};
const AO_APELIDOS_PT = ['dos Santos', 'da Silva', 'António', 'João', 'Francisco', 'Manuel', 'Domingos', 'Pedro', 'José', 'Paulo', 'Miguel', 'Afonso', 'Gaspar', 'Sebastião', 'Bernardo', 'Mateus', 'Lucas', 'Simão', 'André', 'Garcia', 'Joaquim', 'Fernandes', 'Augusto', 'Cristóvão', 'Tomás', 'Lourenço', 'Neto', 'Gonçalves', 'Lopes', 'Baptista', 'Bento', 'Tavares', 'Cardoso', 'Costa', 'Sousa', 'Pereira', 'Vieira', 'Mendes', 'Correia', 'Ferreira', 'Rodrigues', 'Carvalho', 'Pinto', 'Teixeira', 'Matias', 'Cassule'];

export const ANGOLA: PerfilDePais = {
  id: 'AO',
  gentilico: ['angolano', 'angolana'],
  idiomas: ['português', 'umbundo', 'kimbundo', 'kikongo', 'cokwe'],
  divisao: {
    tipo: ['província', 'províncias'],
    // As 18 províncias com código ISO 3166-2. A Lei 14/24 (Divisão
    // Político-Administrativa) criou 21 a partir de 2025 (Icolo e Bengo,
    // Cuando, Cubango, Moxico Leste); as cidades usadas aqui não mudaram de província.
    // Custo e salário: Luanda concentra emprego formal e preços (INE, IDREA/IEA).
    lista: [
      { codigo: 'LUA', nome: 'Luanda', custo: 1.25, salario: 1.25 },
      { codigo: 'BGO', nome: 'Bengo' },
      { codigo: 'BGU', nome: 'Benguela' },
      { codigo: 'BIE', nome: 'Bié', custo: 0.9, salario: 0.85 },
      { codigo: 'CAB', nome: 'Cabinda', custo: 1.05, salario: 1.05 },
      { codigo: 'CCU', nome: 'Cuando Cubango', custo: 0.9, salario: 0.85 },
      { codigo: 'CNO', nome: 'Cuanza Norte', custo: 0.9, salario: 0.85 },
      { codigo: 'CUS', nome: 'Cuanza Sul', custo: 0.9, salario: 0.85 },
      { codigo: 'CNN', nome: 'Cunene', custo: 0.9, salario: 0.85 },
      { codigo: 'HUA', nome: 'Huambo', custo: 0.92, salario: 0.88 },
      { codigo: 'HUI', nome: 'Huíla', custo: 0.92, salario: 0.88 },
      { codigo: 'LNO', nome: 'Lunda Norte', custo: 0.95, salario: 0.9 },
      { codigo: 'LSU', nome: 'Lunda Sul', custo: 0.95, salario: 0.9 },
      { codigo: 'MAL', nome: 'Malanje', custo: 0.9, salario: 0.85 },
      { codigo: 'MOX', nome: 'Moxico', custo: 0.9, salario: 0.85 },
      { codigo: 'NAM', nome: 'Namibe' },
      { codigo: 'UIG', nome: 'Uíge', custo: 0.9, salario: 0.85 },
      { codigo: 'ZAI', nome: 'Zaire' }
    ]
  },
  cidades: [
    ['Luanda', 'LUA', 'metropole', 'capital|sede|litoral'],
    ['Viana', 'LUA', 'metropolitana', 'metro:Luanda'],
    ['Huambo', 'HUA', 'capital', 'sede'],
    ['Benguela', 'BGU', 'capital', 'sede|litoral'],
    ['Lobito', 'BGU', 'polo', 'litoral'],
    ['Lubango', 'HUI', 'capital', 'sede'],
    ['Cabinda', 'CAB', 'capital', 'sede|litoral'],
    ['Malanje', 'MAL', 'capital', 'sede'],
    ['Saurimo', 'LSU', 'capital', 'sede'],
    ['Uíge', 'UIG', 'capital', 'sede'],
    ['Moçâmedes', 'NAM', 'capital', 'sede|litoral'],
    ['Dundo', 'LNO', 'capital', 'sede'],
    ['Soyo', 'ZAI', 'polo', 'litoral'],
    ['Porto Amboim', 'CUS', 'pequena', 'litoral']
  ],
  economia: {
    // Pobreza: 32,3% abaixo da linha nacional (INE, IDREA 2018–19); Gini ~0,51;
    // forte concentração de renda em Luanda e no setor petrolífero.
    classes: { vulneravel: 38, trabalhadora: 30, media_baixa: 16, media: 11, alta: 5 },
    // Habitação formal em Luanda é cara (oferta curta, preços em centralidades e
    // condomínios); musseques informais são a alternativa da maioria.
    moradia: 1.15,
    // Decreto Presidencial 152/24: salário mínimo nacional de Kz 100.000 desde
    // setembro de 2025 (Kz 50.000 para micro-empresas e startups).
    salarioMinimo: 100000,
    // Emprego informal ~80% (INE, Inquérito ao Emprego).
    informalidade: 0.8,
    // Inflação: ~28% em 2024, ~20% em 2025 (INE/BNA), com desvalorização do kwanza.
    inflacao: 0.2,
    volatilidade: 2.0
  },
  trabalho: {
    // Lei Geral do Trabalho (Lei 12/23), art. 238.º: no mínimo 50% do salário-base
    // de gratificação de férias e 50% de subsídio de Natal → 13 salários.
    mesesPagos: 13,
    // INSS (Lei 7/04, de Bases da Protecção Social): 3% do trabalhador (8% do empregador), sem teto.
    contribuicao: { aliquota: [0.03, 0.03] },
    // IRT, Grupo A (OGE 2026): isento até Kz 150.000/mês; faixas de 16% a 25%.
    // 0,18 representa a faixa típica do assalariado formal.
    impostoRenda: { isencao: 150000, aliquota: 0.18 },
    // LGT, art. 308.º: um salário-base por ano de antiguidade até cinco anos, e
    // metade disso por ano além de cinco (despedimento por causas objectivas).
    rescisao: { nome: 'compensação por despedimento', mesesPorAno: 1 },
    // Sem seguro-desemprego regulamentado em funcionamento.
    // Reforma por velhice: 60 anos com 180 meses de contribuição (Decreto
    // Presidencial que regula a protecção na velhice; mães: um ano a menos por filho, até cinco).
    previdencia: { idade: [60, 60], anos: [15, 15], reposicao: 0.5, nome: 'o INSS' },
    concurso: true, // ingresso na função pública por concurso público (Decreto Presidencial 102/11)
    contratoFormal: 'contrato de trabalho com inscrição no INSS'
  },
  educacao: {
    etapas: {
      // Lei de Bases do Sistema de Educação e Ensino (Lei 17/16, alterada pela Lei 32/20):
      // primário (1.ª–6.ª classe) obrigatório; I ciclo (7.ª–9.ª) e II ciclo (10.ª–12.ª/13.ª) do secundário.
      // Em Angola diz-se "classe"; o jogo usa "série".
      fundamental: 'ensino primário', medio: 'II ciclo do ensino secundário', serieMedio: 'série',
      publica: { creche: 'a creche comunitária', fundamental: 'a escola primária pública', medio: 'o liceu público' }
    },
    // Cada instituição faz o seu exame de acesso; as vagas públicas são poucas.
    ingresso: 'candidatura',
    exame: { nome: 'exame de acesso', artigo: 'o' },
    // O ensino superior público regular não cobra propina (há emolumentos); o privado cobra.
    publicaCobra: 0.05,
    // Bolsas internas do INAGBE (Instituto Nacional de Gestão de Bolsas de Estudo):
    // mérito e condição social; o teto de renda é uma abstração.
    bolsa: { nome: 'bolsa interna do INAGBE', teto: 2 },
    cotas: false,
    privadaComum: true // instituições privadas respondem por cerca de metade das matrículas
  },
  politica: {
    sistema: 'república presidencialista unitária; o cabeça da lista mais votada às legislativas é eleito Presidente',
    cargos: {
      // Não houve até hoje eleições autárquicas (a lei das autarquias existe, a
      // implantação não); governadores e administradores municipais são nomeados.
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 5, idade: 18, casa: 'a Assembleia Nacional' }
    },
    // Gerais: agosto de 2022 → 2027. Sem eleições locais: a referência local repete a geral.
    eleicoes: { local: [2027, 5], geral: [2027, 5] },
    mes: 7,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Lei Geral do Serviço Militar: serviço militar obrigatório com
    // recenseamento aos 18 anos; a incorporação efetiva é seletiva.
    servico: 'obrigatorio',
    idade: 18,
    forcas: { exercito: 'o Exército (FAA)', marinha: 'a Marinha de Guerra Angolana', aeronautica: 'a Força Aérea Nacional' },
    policia: 'a Polícia Nacional'
  },
  esporte: {
    // Basquete é a grande escola (11 títulos africanos masculinos); futebol de massa;
    // andebol (fora do jogo) forte no feminino.
    popularidade: { futebol: 1.2, volei: 0.7, basquete: 1.45, natacao: 0.6, atletismo: 0.75, lutas: 0.8, tenis: 0.5 },
    // Abaixo da Segundona, os campeonatos provinciais (para onde descem os
    // rebaixados); o nível 1 abstrai os torneios municipais e de bairro.
    divisoes: ['torneios municipais', 'campeonatos provinciais', 'Segundona', 'Girabola'],
    clubes: [
      { nome: 'Petro de Luanda', artigo: 'o', porte: 'grande', cidade: 'Luanda' },
      { nome: '1.º de Agosto', artigo: 'o', porte: 'grande', cidade: 'Luanda' },
      { nome: 'Interclube', artigo: 'o', porte: 'tradicional', cidade: 'Luanda' },
      { nome: 'Kabuscorp', artigo: 'o', porte: 'tradicional', cidade: 'Luanda' },
      { nome: 'Sagrada Esperança', artigo: 'o', porte: 'tradicional', cidade: 'Dundo' },
      { nome: 'Desportivo da Huíla', artigo: 'o', porte: 'tradicional', cidade: 'Lubango' },
      { nome: 'Wiliete', artigo: 'o', porte: 'tradicional', cidade: 'Benguela' },
      { nome: '1.º de Maio', artigo: 'o', porte: 'tradicional', cidade: 'Benguela' },
      { nome: 'Académica do Lobito', artigo: 'a', porte: 'tradicional', cidade: 'Lobito' },
      { nome: 'Lunda Sul', artigo: 'o', porte: 'regional', cidade: 'Saurimo' },
      { nome: 'Ferroviário do Huambo', artigo: 'o', porte: 'regional', cidade: 'Huambo' },
      { nome: 'Sporting de Cabinda', artigo: 'o', porte: 'regional', cidade: 'Cabinda' }
    ]
  },
  // Serviço Nacional de Saúde gratuito no ponto de atendimento (Lei de Bases do
  // SNS, Lei 21-B/92), com carências; clínicas privadas para quem pode pagar.
  saude: { sistema: 'universal', redePublica: 'o Serviço Nacional de Saúde', custoPlano: 0.8 },
  // SADC sem livre residência; o acordo de mobilidade da CPLP (2021) não
  // dispensa visto de trabalho em Angola — fica de fora.
  migracao: { blocos: [], abertura: 'restrita' },
  sucessao: {
    pais: 'AO',
    nome: 'Angola',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes'],
    conjugeComDescendentes: false,
    conjugeComAscendentes: [0, 0],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.03,
    rotuloCusto: 'habilitação de herdeiros, registos e impostos',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2002], // independência; fim da guerra civil
    grupos: [
      {
        id: 'comum', peso: 32, sobrenome: 'um',
        masc: AO_MASC,
        fem: AO_FEM,
        sobrenomes: AO_APELIDOS_PT
      },
      {
        id: 'centro_sul', peso: 38, divisoes: ['HUA', 'BGU', 'BIE', 'CUS', 'HUI', 'NAM', 'CNN'], sobrenome: 'um',
        masc: { antiga: [...AO_MASC.antiga], meio: [...AO_MASC.meio], nova: [...AO_MASC.nova] },
        fem: { antiga: [...AO_FEM.antiga], meio: [...AO_FEM.meio], nova: [...AO_FEM.nova, 'Tchissola', 'Ndapandula'] },
        sobrenomes: ['Sapalo', 'Chipenda', 'Cassoma', 'Chivukuvuku', 'Epalanga', 'Muekalia', 'Kamalata', 'Sakaita', 'Chingunji', 'Lukamba', 'Dala', 'Chitunda', 'Chicoty', 'Kangamba', 'Samakuva', 'Sachipengo', 'Paihama', 'Kalunga',
          'António', 'João', 'Francisco', 'Manuel', 'Domingos', 'Pedro', 'José', 'Paulo', 'Afonso', 'Gaspar', 'Sebastião', 'Bernardo', 'Mateus', 'Lucas', 'Simão', 'dos Santos', 'da Silva', 'Fernandes', 'Augusto', 'Tomás', 'Joaquim', 'Abel', 'Jamba', 'Daniel']
      },
      {
        id: 'norte', peso: 30, divisoes: ['BGO', 'CNO', 'MAL', 'UIG', 'ZAI', 'CAB'], sobrenome: 'um',
        masc: { antiga: [...AO_MASC.antiga, 'Kiluanji'], meio: [...AO_MASC.meio, 'Mavungo'], nova: [...AO_MASC.nova, 'Nzuzi', 'Kiese'] },
        fem: { antiga: [...AO_FEM.antiga, 'Nzinga'], meio: [...AO_FEM.meio, 'Kiesse'], nova: [...AO_FEM.nova, 'Ginga', 'Nsimba'] },
        sobrenomes: ['Nzola', 'Luvumbo', 'Kialonda', 'Nsimba', 'Banza', 'Mabiala', 'Kiala', 'Nzau', 'Mavungo', 'Puna', 'Tati', 'Buatu', 'Mayembe', 'Menga', 'Ngola', 'Kassule', 'Mbinda', 'Lukoki', 'Nkanga', 'Ngonda', 'Makiese', 'Mbumba', 'Mabululu', 'Cafumana',
          'António', 'João', 'Francisco', 'Manuel', 'Domingos', 'Pedro', 'José', 'Paulo', 'Afonso', 'Garcia', 'Miguel', 'André', 'dos Santos', 'da Silva', 'Neto', 'Lourenço', 'Cristóvão', 'Bento']
      }
    ]
  },
  fontes: [
    'Constituição da República de Angola, 2010 (art. 239.º, direito anterior; arts. 109.º e 147.º, eleição e Assembleia Nacional).',
    'Código Civil (1966, na versão vigente em Angola), arts. 2131.º–2161.º; Código da Família (Lei 1/88); Bartolomeu, F. V., "A turbulência na vocação sucessória na comuna da Chipipa à luz do artigo 2133.º do Código Civil angolano", Revista Angolana de Ciências, 2019 (zenodo.org/records/3837149).',
    'Lei Geral do Trabalho, Lei 12/23 de 27 de dezembro (arts. 238.º e 308.º) — Diário da República, I Série n.º 245.',
    'Decreto Presidencial 152/24 (salário mínimo; Kz 100.000 a partir de setembro de 2025) — Ver Angola, 08/2025.',
    'OGE 2026 / Código do IRT: isenção até Kz 150.000 (PwC Angola, 2026).',
    'Lei 7/04 (Bases da Protecção Social) e regulamento da protecção na velhice (60 anos, 180 meses).',
    'Lei 17/16, alterada pela Lei 32/20 (sistema de educação e ensino); Lei 14/24 (divisão político-administrativa).',
    'INE Angola — Censo 2014 (línguas), IDREA 2018–19 (pobreza), Inquérito ao Emprego (informalidade).',
    'FAF — Girabola 2025/26 (clubes e rebaixamento aos provinciais).'
  ]
};

/* ============================================================== QUÊNIA */

/*
 * SUCESSÃO — QUÊNIA (Law of Succession Act, Cap. 160; Matrimonial Property
 * Act 2013):
 *  - liberdade de testar, sujeita a "provisão razoável" aos dependentes que
 *    o tribunal pode impor (ss. 5 e 26) — fora do jogo;
 *  - sem testamento, com filhos: o cônjuge recebe os bens pessoais e da casa
 *    e o USUFRUTO VITALÍCIO ("life interest") de todo o resto; a propriedade
 *    passa aos filhos em partes iguais (ss. 35 e 38); sem filhos: bens
 *    pessoais, 20% do resto (ou KSh 10.000) e usufruto vitalício do restante
 *    (s. 36); depois pais, irmãos e outros parentes (s. 39); sem herdeiros,
 *    o Estado (s. 39(2)); netos no lugar do filho morto (s. 41);
 *  - muçulmanos: a lei não se aplica; vale o direito islâmico (s. 2(3)), com
 *    os tribunais Kadhi (Constituição, art. 170);
 *  - a lei de 2013 trata a divisão de bens no divórcio; na morte não há
 *    meação automática.
 * SIMPLIFICAÇÕES DECLARADAS: o jogo não tem usufruto; o usufruto vitalício
 * do cônjuge sobre tudo vira "o cônjuge concorre por cabeça com os filhos"
 * e "metade com os pais" — é o que mantém a casa com quem ficou, como a lei
 * pretende. A regra da viúva que perde o usufruto ao casar de novo foi
 * declarada inconstitucional (High Court, 2022) e não entra. Não há imposto
 * sobre herança (Estate Duty Act revogado em 1982); custas judiciais e de
 * advogado entram como ~4%.
 */

/*
 * NOMES — QUÊNIA. Pesos do Censo 2019 (KNBS, Volume IV, filiação étnica):
 * kikuyu 17,1%, luhya 14,3%, kalenjin 13,4%, luo 10,7%, kamba 9,8%, somali
 * 5,8%, kisii 5,7%, mijikenda 5,2%, meru 4,2%, maasai 2,5%, turkana 2,2%...
 * Grupos: monte Quênia (kikuyu, meru, embu) 22,5; luhya 14,4; kalenjin 13,4;
 * luo 10,7; kamba 9,8; kisii 5,7; costa (mijikenda, suaíli, taita) 6,2;
 * somali 5,6; pastores do Norte e do Rift (maasai, turkana, samburu, borana) 6.
 * Nairóbi e Nakuru (muito misturadas) ficam sem grupo próprio. O padrão do
 * país é um nome cristão (inglês) ou muçulmano seguido de um nome na língua
 * da família, que funciona como sobrenome (John Kamau, Faith Chebet, Mercy
 * Achieng); por isso os nomes cristãos são comuns a vários grupos e cada um
 * acrescenta os seus. Sem estatística oficial de nomes de batismo.
 */

const KE_MASC = {
  antiga: ['John', 'Peter', 'James', 'Joseph', 'Samuel', 'David', 'Paul', 'Stephen', 'Francis', 'Charles', 'George', 'Daniel', 'Joshua', 'Moses', 'Simon', 'Patrick', 'Michael', 'Wilson', 'Julius', 'Jackson', 'Geoffrey', 'Richard', 'Henry', 'William', 'Benson', 'Wycliffe', 'Philip', 'Jacob', 'Thomas', 'Fredrick'],
  meio: ['Brian', 'Kevin', 'Dennis', 'Collins', 'Victor', 'Ian', 'Felix', 'Emmanuel', 'Elvis', 'Kennedy', 'Edwin', 'Eric', 'Duncan', 'Martin', 'Allan', 'Evans', 'Hillary', 'Nicholas', 'Josphat', 'Vincent', 'Kelvin', 'Gideon', 'Bernard', 'Amos', 'Timothy', 'Alex', 'Samuel', 'Cyrus', 'Dancan', 'Benard'],
  nova: ['Ethan', 'Jayden', 'Ryan', 'Liam', 'Daniel', 'David', 'Brian', 'Ian', 'Austin', 'Adrian', 'Joshua', 'Samuel', 'Emmanuel', 'Elijah', 'Gabriel', 'Michael', 'Nathan', 'Prince', 'Lewis', 'Travis', 'Trevor', 'Darren', 'Caleb', 'Jeremy', 'Nathaniel', 'Baraka', 'Amani', 'Shawn', 'Abel', 'Jabari']
};
const KE_FEM = {
  antiga: ['Mary', 'Jane', 'Grace', 'Esther', 'Lucy', 'Margaret', 'Anne', 'Elizabeth', 'Catherine', 'Rose', 'Alice', 'Agnes', 'Joyce', 'Ruth', 'Sarah', 'Rebecca', 'Leah', 'Priscilla', 'Beatrice', 'Dorcas', 'Teresia', 'Hellen', 'Florence', 'Eunice', 'Rachel', 'Josephine', 'Phyllis', 'Susan', 'Gladys', 'Janet'],
  meio: ['Faith', 'Mercy', 'Sharon', 'Purity', 'Caroline', 'Diana', 'Joy', 'Cynthia', 'Ivy', 'Valentine', 'Brenda', 'Winnie', 'Lilian', 'Nancy', 'Irene', 'Judith', 'Stella', 'Emily', 'Christine', 'Doreen', 'Lydia', 'Naomi', 'Pauline', 'Beryl', 'Maureen', 'Everlyne', 'Vivian', 'Sheila', 'Linet', 'Edith'],
  nova: ['Abigail', 'Natalie', 'Precious', 'Michelle', 'Ashley', 'Angel', 'Stacy', 'Shantel', 'Joy', 'Victoria', 'Nicole', 'Hope', 'Imani', 'Zawadi', 'Neema', 'Amani', 'Nia', 'Tamara', 'Faith', 'Hadassah', 'Tiffany', 'Melody', 'Grace', 'Ruth', 'Esther', 'Brianna', 'Shirleen', 'Wendy', 'Gloria', 'Rehema']
};
const KE_MUC_MASC = {
  antiga: ['Mohamed', 'Abdi', 'Ahmed', 'Hassan', 'Ali', 'Abdullahi', 'Ibrahim', 'Hussein', 'Omar', 'Yusuf', 'Abdirahman', 'Adan', 'Farah', 'Osman', 'Ismail', 'Noor', 'Mohamud', 'Hirsi', 'Gedi', 'Dahir', 'Elmi', 'Jama', 'Bashir', 'Abdille', 'Issack', 'Muktar', 'Salat'],
  meio: ['Abdikadir', 'Abdirashid', 'Abdinasir', 'Abdiaziz', 'Abdiweli', 'Abdinoor', 'Mohamed', 'Ahmed', 'Hassan', 'Abdirahman', 'Ibrahim', 'Yusuf', 'Hussein', 'Ismail', 'Abdullahi', 'Omar', 'Ali', 'Bashir', 'Adan', 'Farah', 'Mahat', 'Billow', 'Siyad', 'Guled', 'Liban', 'Sharif', 'Abdiwahab'],
  nova: ['Abdirahman', 'Mohamed', 'Ayub', 'Zakariye', 'Abdullahi', 'Ilyas', 'Yasin', 'Hamza', 'Khalid', 'Mustafa', 'Abdikarim', 'Abdirizak', 'Ibrahim', 'Yusuf', 'Ahmed', 'Bilal', 'Anas', 'Hassan', 'Omar', 'Ismail', 'Liban', 'Salman', 'Suleiman', 'Faisal', 'Mukhtar', 'Idris']
};
const KE_MUC_FEM = {
  antiga: ['Fatuma', 'Halima', 'Amina', 'Hawa', 'Khadija', 'Asha', 'Habiba', 'Maryan', 'Sahra', 'Faduma', 'Nimo', 'Hodan', 'Sadia', 'Ubah', 'Shukri', 'Zeinab', 'Ruqiya', 'Mumina', 'Safiya', 'Kaltuma', 'Aisha', 'Mariam', 'Hindiya', 'Dahabo', 'Zamzam', 'Batula'],
  meio: ['Ifrah', 'Sagal', 'Deqa', 'Hibo', 'Ayan', 'Fardowsa', 'Hamdi', 'Najma', 'Sumaya', 'Ikram', 'Muna', 'Leyla', 'Nasra', 'Hodan', 'Sahra', 'Shamsa', 'Rahma', 'Fatuma', 'Halima', 'Amina', 'Hawa', 'Khadija', 'Asha', 'Habiba', 'Nimo', 'Ruqiya'],
  nova: ['Iftin', 'Sumaya', 'Ikram', 'Najma', 'Hafsa', 'Ayaan', 'Hanan', 'Nasteho', 'Ilhan', 'Ruweyda', 'Samira', 'Ifrah', 'Sagal', 'Deqa', 'Hibo', 'Fardowsa', 'Maryan', 'Aisha', 'Fatuma', 'Amina', 'Khadija', 'Zainab', 'Hamdi', 'Nusayba', 'Rahma', 'Bushra', 'Salma']
};
const comKE = (base: { antiga: string[]; meio: string[]; nova: string[] }, extra: { antiga: string[]; meio: string[]; nova: string[] }) =>
  ({ antiga: [...base.antiga, ...extra.antiga], meio: [...base.meio, ...extra.meio], nova: [...base.nova, ...extra.nova] });

export const QUENIA: PerfilDePais = {
  id: 'KE',
  gentilico: ['queniano', 'queniana'],
  idiomas: ['suaíli', 'inglês'],
  divisao: {
    tipo: ['condado', 'condados'],
    // Os 47 condados (Constituição de 2010, 1.º anexo; ISO 3166-2:KE). Custo e
    // salário: Nairóbi, Mombaça e Kiambu acima (salários mínimos por cidade na
    // Regulation of Wages Order; aluguel); o Nordeste árido bem abaixo (KNBS).
    lista: [
      { codigo: '01', nome: 'Baringo' }, { codigo: '02', nome: 'Bomet' }, { codigo: '03', nome: 'Bungoma' },
      { codigo: '04', nome: 'Busia' }, { codigo: '05', nome: 'Elgeyo-Marakwet' }, { codigo: '06', nome: 'Embu' },
      { codigo: '07', nome: 'Garissa', custo: 0.9, salario: 0.8 }, { codigo: '08', nome: 'Homa Bay' }, { codigo: '09', nome: 'Isiolo' },
      { codigo: '10', nome: 'Kajiado' }, { codigo: '11', nome: 'Kakamega' }, { codigo: '12', nome: 'Kericho' },
      { codigo: '13', nome: 'Kiambu', custo: 1.1, salario: 1.1 }, { codigo: '14', nome: 'Kilifi' }, { codigo: '15', nome: 'Kirinyaga' },
      { codigo: '16', nome: 'Kisii' }, { codigo: '17', nome: 'Kisumu', custo: 1.0, salario: 1.05 }, { codigo: '18', nome: 'Kitui' },
      { codigo: '19', nome: 'Kwale' }, { codigo: '20', nome: 'Laikipia' }, { codigo: '21', nome: 'Lamu' },
      { codigo: '22', nome: 'Machakos' }, { codigo: '23', nome: 'Makueni' }, { codigo: '24', nome: 'Mandera', custo: 0.9, salario: 0.75 },
      { codigo: '25', nome: 'Marsabit', custo: 0.9, salario: 0.75 }, { codigo: '26', nome: 'Meru' }, { codigo: '27', nome: 'Migori' },
      { codigo: '28', nome: 'Mombaça', custo: 1.1, salario: 1.1 }, { codigo: '29', nome: 'Murang\'a' }, { codigo: '30', nome: 'Nairóbi', custo: 1.25, salario: 1.3 },
      { codigo: '31', nome: 'Nakuru', custo: 1.0, salario: 1.05 }, { codigo: '32', nome: 'Nandi' }, { codigo: '33', nome: 'Narok' },
      { codigo: '34', nome: 'Nyamira' }, { codigo: '35', nome: 'Nyandarua' }, { codigo: '36', nome: 'Nyeri' },
      { codigo: '37', nome: 'Samburu' }, { codigo: '38', nome: 'Siaya' }, { codigo: '39', nome: 'Taita-Taveta' },
      { codigo: '40', nome: 'Tana River' }, { codigo: '41', nome: 'Tharaka-Nithi' }, { codigo: '42', nome: 'Trans-Nzoia' },
      { codigo: '43', nome: 'Turkana', custo: 0.9, salario: 0.75 }, { codigo: '44', nome: 'Uasin Gishu', custo: 1.0, salario: 1.0 }, { codigo: '45', nome: 'Vihiga' },
      { codigo: '46', nome: 'Wajir', custo: 0.9, salario: 0.75 }, { codigo: '47', nome: 'West Pokot' }
    ]
  },
  cidades: [
    ['Nairóbi', '30', 'metropole', 'capital|sede'],
    ['Thika', '13', 'metropolitana', 'metro:Nairóbi'],
    ['Mombaça', '28', 'metropole', 'sede|litoral'],
    ['Kisumu', '17', 'capital', 'sede|litoral'], // às margens do lago Vitória
    ['Nakuru', '31', 'capital', 'sede'],
    ['Eldoret', '44', 'capital', 'sede'],
    ['Kakamega', '11', 'capital', 'sede'],
    ['Meru', '26', 'capital', 'sede'],
    ['Machakos', '22', 'capital', 'sede'],
    ['Kisii', '16', 'capital', 'sede'],
    ['Garissa', '07', 'capital', 'sede'],
    ['Kitale', '42', 'polo'],
    ['Malindi', '14', 'polo', 'litoral'],
    ['Iten', '05', 'pequena', 'sede'] // sede de Elgeyo-Marakwet e centro de treino de fundistas em altitude
  ],
  economia: {
    // Pobreza: 38,6% (KNBS, Kenya Continuous Household Survey 2021); Gini
    // ~0,39 (Banco Mundial ~0,39). Classe média urbana crescente (Nairóbi), base larga.
    classes: { vulneravel: 36, trabalhadora: 32, media_baixa: 16, media: 12, alta: 4 },
    // Aluguéis em Nairóbi pesam, mas fora das cidades a moradia é própria/barata.
    moradia: 1.0,
    // Não há um mínimo único: a Regulation of Wages (General) (Amendment) Order
    // 2026 (LN 108/2026, +12% desde 1/5/2026) fixa KSh 18.047,40/mês para o
    // trabalhador geral em Nairóbi, Mombaça, Kisumu, Nakuru e Eldoret (KSh 9.628 nas
    // demais áreas). Usa-se o das cidades, onde está o emprego formal.
    salarioMinimo: 18047,
    // Emprego informal ~83% (KNBS, Economic Survey).
    informalidade: 0.83,
    inflacao: 0.05, // CBK: meta de 5% ± 2,5; 2024–25 entre 3% e 5%
    volatilidade: 1.0
  },
  trabalho: {
    mesesPagos: 12,
    // NSSF Act 2013, ano 4 (fev/2026): 6% do empregado (e 6% do empregador) até o
    // teto de KSh 108.000. SHIF (2,75%) e Housing Levy (1,5%) não são previdência.
    contribuicao: { aliquota: [0.06, 0.06], teto: 108000 },
    // PAYE: 10% até KSh 24.000, 25% até 32.333, 30% acima, com relief de 2.400 —
    // na prática isento até ~KSh 24.000; 0,28 representa a faixa típica.
    impostoRenda: { isencao: 24000, aliquota: 0.28 },
    // Employment Act 2007, s. 40: na redundância, 15 dias de salário por ano de casa.
    rescisao: { nome: 'severance pay (15 dias por ano de casa)', mesesPorAno: 0.5 },
    // Sem seguro-desemprego público.
    // NSSF: pensão aos 60; com menos de 15 anos de contribuição o benefício é pago de uma vez.
    previdencia: { idade: [60, 60], anos: [15, 15], reposicao: 0.2, nome: 'o NSSF' },
    concurso: false, // a Public Service Commission recruta por vaga anunciada e entrevista
    contratoFormal: 'emprego formal com NSSF e SHA'
  },
  educacao: {
    etapas: {
      // Competency-Based Curriculum (2-6-3-3): primário (graus 1–6), junior school
      // (7–9) e senior school (10–12, iniciada em 2026). A transição do 8-4-4 termina em 2027.
      fundamental: 'ensino básico', medio: 'senior school', serieMedio: 'ano',
      publica: { creche: 'a pré-escola do condado (ECDE)', fundamental: 'a escola primária pública', medio: 'a escola secundária pública' }
    },
    // KUCCPS coloca os estudantes nas universidades públicas pela nota do exame nacional do KNEC.
    ingresso: 'exame_nacional',
    exame: { nome: 'KCSE', artigo: 'o' },
    // Estudantes "government-sponsored" pagam anuidade parcial; privadas cobram várias vezes mais.
    publicaCobra: 0.25,
    // Novo modelo de financiamento (2023): bolsa do Universities Fund e empréstimo do
    // HELB por faixa de necessidade; o teto em salários mínimos é uma abstração.
    bolsa: { nome: 'bolsa do Universities Fund', teto: 1.5 },
    credito: { nome: 'empréstimo do HELB' },
    cotas: false,
    privadaComum: false // privadas ~15–20% das matrículas universitárias (Commission for University Education)
  },
  politica: {
    sistema: 'república presidencialista com governos de condado eleitos (devolução, Constituição de 2010)',
    cargos: {
      // Constituição de 2010: MCAs (art. 177), deputados (art. 97), senadores
      // (art. 98), governadores (art. 180); mandato de 5 anos, elegível com 18.
      deputado_estadual: { titulo: ['membro da Assembleia do Condado (MCA)', 'membro da Assembleia do Condado (MCA)'], anos: 5, idade: 18, casa: 'a Assembleia do Condado' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 5, idade: 18, casa: 'a Assembleia Nacional' },
      senador: { titulo: ['senador', 'senadora'], anos: 5, idade: 18, casa: 'o Senado' },
      governador: { titulo: ['governador', 'governadora'], anos: 5, idade: 18, casa: 'o Governo do Condado' }
      // Não há conselhos municipais eleitos: cidades são geridas por conselhos nomeados pelo condado.
    },
    // Eleição geral única ("six-piece"), na 2.ª terça-feira de agosto do 5.º ano (art. 101): 2022 → 2027.
    eleicoes: { local: [2027, 5], geral: [2027, 5] },
    mes: 7,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 18,
    forcas: { exercito: 'o Exército do Quênia', marinha: 'a Marinha do Quênia', aeronautica: 'a Força Aérea do Quênia' },
    policia: 'o Serviço de Polícia do Quênia'
  },
  esporte: {
    // Corrida de fundo é a grande porta (Rift Valley, Iten); vôlei feminino forte
    // (Malkia Strikers); futebol popular; rúgbi de sete (fora do jogo) relevante.
    popularidade: { futebol: 1.15, volei: 1.05, basquete: 0.7, natacao: 0.5, atletismo: 1.6, lutas: 0.8, tenis: 0.5 },
    divisoes: ['FKF Division Two', 'FKF Division One', 'National Super League', 'FKF Premier League'],
    clubes: [
      { nome: 'Gor Mahia', artigo: 'o', porte: 'grande', cidade: 'Nairóbi' },
      { nome: 'AFC Leopards', artigo: 'o', porte: 'grande', cidade: 'Nairóbi' },
      { nome: 'Tusker', artigo: 'o', porte: 'tradicional', cidade: 'Nairóbi' },
      { nome: 'KCB', artigo: 'o', porte: 'tradicional', cidade: 'Nairóbi' },
      { nome: 'Kenya Police', artigo: 'o', porte: 'tradicional', cidade: 'Nairóbi' },
      { nome: 'Mathare United', artigo: 'o', porte: 'tradicional', cidade: 'Nairóbi' },
      { nome: 'Bandari', artigo: 'o', porte: 'tradicional', cidade: 'Mombaça' },
      { nome: 'Kakamega Homeboyz', artigo: 'o', porte: 'tradicional', cidade: 'Kakamega' },
      { nome: 'Shabana', artigo: 'o', porte: 'tradicional', cidade: 'Kisii' },
      { nome: 'Ulinzi Stars', artigo: 'o', porte: 'tradicional', cidade: 'Nakuru' },
      { nome: 'Bidco United', artigo: 'o', porte: 'tradicional', cidade: 'Thika' },
      { nome: 'Kisumu All Stars', artigo: 'o', porte: 'regional', cidade: 'Kisumu' }
    ]
  },
  // SHA (Social Health Insurance Act 2023) substituiu o NHIF em 2024; hospitais
  // públicos e privados coexistem, com muito gasto do bolso.
  saude: { sistema: 'misto', redePublica: 'o SHA e os hospitais públicos', custoPlano: 0.6 },
  // EAC: protocolo do mercado comum (2010) com livre circulação de trabalhadores
  // (implementação parcial); de fora, permissões de trabalho por categoria.
  migracao: { blocos: ['eac'], abertura: 'seletiva' },
  sucessao: {
    pais: 'KE',
    nome: 'Quênia',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 2, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.04,
    rotuloCusto: 'custas do inventário e honorários',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2000],
    grupos: [
      {
        id: 'monte_quenia', peso: 22.5, divisoes: ['13', '36', '29', '15', '35', '20', '26', '06', '41'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Kamau', 'Mwangi', 'Njoroge', 'Kariuki', 'Kirimi'], meio: ['Kamau', 'Mwangi', 'Gitonga', 'Muriuki'], nova: ['Kamau', 'Mwangi', 'Njoroge'] }),
        fem: comKE(KE_FEM, { antiga: ['Wanjiru', 'Wambui', 'Njeri', 'Wanjiku', 'Nyambura', 'Wairimu', 'Wangari', 'Kawira'], meio: ['Wanjiru', 'Wambui', 'Njeri', 'Muthoni', 'Nkatha', 'Gakii'], nova: ['Wanjiru', 'Makena', 'Wambui', 'Njeri', 'Waithera'] }),
        sobrenomes: ['Kamau', 'Njoroge', 'Mwangi', 'Kariuki', 'Kimani', 'Maina', 'Ngugi', 'Waweru', 'Githinji', 'Mwaura', 'Gitau', 'Macharia', 'Njenga', 'Kinyanjui', 'Wainaina', 'Muriuki', 'Mugo', 'Ndungu', 'Karanja', 'Nyaga', 'Kibe', 'Wambugu', 'Irungu', 'Kiarie', 'Mbugua', 'Gachanja', 'Kihara', 'Kirimi', 'Murithi', 'Mutuma', 'Gitonga', 'Mwiti', 'Kinoti', 'Mugambi', 'Kaberia', 'Muthomi', 'Mwenda', 'Njeru', 'Ireri', 'Mbogo', 'Wachira', 'Ndirangu', 'Gichuki', 'Muchiri']
      },
      {
        id: 'luhya', peso: 14.4, divisoes: ['11', '03', '45', '04', '42'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Wafula', 'Wanjala', 'Barasa', 'Wekesa', 'Simiyu'], meio: ['Wafula', 'Wekesa', 'Barasa'], nova: ['Wafula', 'Barasa'] }),
        fem: comKE(KE_FEM, { antiga: ['Nafula', 'Nanjala', 'Nekesa', 'Nasimiyu', 'Naliaka'], meio: ['Nafula', 'Nekesa', 'Naliaka', 'Khavere'], nova: ['Nafula', 'Nekesa', 'Naliaka'] }),
        sobrenomes: ['Wafula', 'Wanjala', 'Barasa', 'Wekesa', 'Simiyu', 'Wanyama', 'Masinde', 'Wamalwa', 'Makokha', 'Khaemba', 'Mukhwana', 'Shikuku', 'Okwemba', 'Andala', 'Lusweti', 'Namwamba', 'Wangila', 'Mulama', 'Shiundu', 'Kweyu', 'Musungu', 'Asava', 'Wasike', 'Wanyonyi', 'Nyongesa', 'Sifuna', 'Kituyi', 'Juma', 'Khisa', 'Wakhungu', 'Mabonga', 'Wesonga', 'Echesa', 'Shitanda', 'Lukorito', 'Otsieno', 'Mulongo', 'Wangusi', 'Nabwera', 'Opati']
      },
      {
        id: 'kalenjin', peso: 13.4, divisoes: ['44', '05', '32', '12', '02', '01', '47', '42'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Kiprono', 'Kipchoge', 'Kiprotich', 'Kibet', 'Kipruto'], meio: ['Kipkemboi', 'Kiplagat', 'Kipngetich', 'Kipkorir', 'Kimutai'], nova: ['Kipkoech', 'Kiprop', 'Kipyegon', 'Kibet'] }),
        fem: comKE(KE_FEM, { antiga: ['Chebet', 'Chepkoech', 'Jepkosgei', 'Jeptoo', 'Cherono'], meio: ['Chelimo', 'Chepngetich', 'Jepchirchir', 'Chepkirui', 'Chemutai'], nova: ['Chebet', 'Jepkemboi', 'Chepkemoi', 'Jerono'] }),
        sobrenomes: ['Kiprono', 'Kipchoge', 'Kiprotich', 'Kipkemboi', 'Kibet', 'Cheruiyot', 'Kipruto', 'Kiplagat', 'Kiptoo', 'Kimutai', 'Kipkorir', 'Kipngetich', 'Kipkoech', 'Kipsang', 'Rotich', 'Koech', 'Langat', 'Bett', 'Kirui', 'Rono', 'Tanui', 'Sang', 'Ngetich', 'Korir', 'Chirchir', 'Kemboi', 'Ruto', 'Tuwei', 'Kiptum', 'Kosgei', 'Kipketer', 'Biwott', 'Keter', 'Kogo', 'Limo', 'Kiprop', 'Chepkwony', 'Too', 'Mutai', 'Kiplimo', 'Yego', 'Kibor', 'Chebet', 'Jepkosgei', 'Chepngetich']
      },
      {
        id: 'luo', peso: 10.7, divisoes: ['17', '38', '08', '27'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Otieno', 'Odhiambo', 'Ochieng', 'Omondi', 'Onyango', 'Owino'], meio: ['Otieno', 'Ochieng', 'Omondi', 'Okoth'], nova: ['Otieno', 'Omondi', 'Ochieng'] }),
        fem: comKE(KE_FEM, { antiga: ['Achieng', 'Atieno', 'Akinyi', 'Adhiambo', 'Awino', 'Anyango', 'Auma'], meio: ['Achieng', 'Atieno', 'Akinyi', 'Adhiambo', 'Apiyo', 'Akoth'], nova: ['Achieng', 'Atieno', 'Akinyi', 'Awuor'] }),
        sobrenomes: ['Otieno', 'Odhiambo', 'Ochieng', 'Omondi', 'Onyango', 'Owino', 'Okoth', 'Ouma', 'Oduor', 'Okello', 'Ogola', 'Opiyo', 'Obiero', 'Oloo', 'Okumu', 'Owuor', 'Ogutu', 'Obura', 'Ojwang', 'Oketch', 'Ochola', 'Odera', 'Oyugi', 'Okeyo', 'Agola', 'Okinyi', 'Ogada', 'Obonyo', 'Odongo', 'Ongaro', 'Otiende', 'Opondo', 'Olang', 'Abong\'o', 'Ndege', 'Oluoch', 'Owiti', 'Achola', 'Atieno', 'Akinyi', 'Achieng']
      },
      {
        id: 'kamba', peso: 9.8, divisoes: ['22', '23', '18'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Mutua', 'Musyoka', 'Kioko', 'Mutinda', 'Kyalo'], meio: ['Mutua', 'Mwendwa', 'Kioko', 'Nzioka'], nova: ['Mutua', 'Kyalo', 'Mumo'] }),
        fem: comKE(KE_FEM, { antiga: ['Mwikali', 'Mbithe', 'Ndinda', 'Mwende', 'Kanini', 'Mueni', 'Ndunge', 'Syokau'], meio: ['Mwikali', 'Mbithe', 'Ndinda', 'Mwende', 'Kalekye', 'Nduku', 'Mumbua'], nova: ['Mwende', 'Ndinda', 'Kavata', 'Wayua', 'Katunge'] }),
        sobrenomes: ['Mutua', 'Musyoka', 'Kioko', 'Mutinda', 'Muthama', 'Munyao', 'Kyalo', 'Nzioka', 'Kilonzo', 'Mumo', 'Mutiso', 'Mulwa', 'Makau', 'Ndambuki', 'Muli', 'Nzomo', 'Musau', 'Kimeu', 'Mwanzia', 'Wambua', 'Nthenge', 'Mbuvi', 'Mwangangi', 'Kitonga', 'Ndolo', 'Ngila', 'Kivuva', 'Masila', 'Muema', 'Nzuki', 'Mbithi', 'Kisilu', 'Kituku', 'Mulei', 'Muteti', 'Munyoki', 'Kimanzi', 'Muasya', 'Katuku', 'Mwikya', 'Mwendwa']
      },
      {
        id: 'kisii', peso: 5.7, divisoes: ['16', '34'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Nyakundi', 'Mogaka', 'Ombati', 'Momanyi', 'Makori'], meio: ['Nyakundi', 'Mogaka', 'Ombati', 'Onyancha'], nova: ['Mogaka', 'Nyakundi', 'Ondieki'] }),
        fem: comKE(KE_FEM, { antiga: ['Kerubo', 'Moraa', 'Kemunto', 'Nyaboke', 'Bosibori', 'Kwamboka', 'Nyanchama'], meio: ['Kerubo', 'Moraa', 'Kemunto', 'Nyaboke', 'Bosibori', 'Kwamboka'], nova: ['Kerubo', 'Moraa', 'Kemunto', 'Nyaboke'] }),
        sobrenomes: ['Ombati', 'Nyakundi', 'Mogaka', 'Momanyi', 'Ogeto', 'Mokaya', 'Nyabuto', 'Omwenga', 'Arasa', 'Onyancha', 'Ongeri', 'Nyamweya', 'Ondari', 'Osoro', 'Bosire', 'Monda', 'Orina', 'Mose', 'Obure', 'Nyangau', 'Ogari', 'Onsongo', 'Makori', 'Masese', 'Machogu', 'Omanga', 'Atandi', 'Okemwa', 'Mochama', 'Nyachae', 'Matara', 'Nyaanga', 'Oirere', 'Nyandieka', 'Obwocha', 'Maangi', 'Ochoki', 'Ratemo', 'Nyarangi', 'Mainye', 'Morara']
      },
      {
        id: 'costa', peso: 6.2, divisoes: ['28', '14', '19', '21', '39', '40'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Kazungu', 'Karisa', 'Katana', 'Baya', 'Kahindi', 'Chengo', 'Charo', 'Mohamed', 'Omar', 'Swaleh', 'Athman', 'Bakari', 'Juma', 'Salim'], meio: ['Kazungu', 'Karisa', 'Katana', 'Kenga', 'Tsuma', 'Kalume', 'Hamisi', 'Rashid', 'Abdalla', 'Said', 'Mbarak'], nova: ['Baraka', 'Kazungu', 'Karisa', 'Faraji', 'Mohamed', 'Omar', 'Swaleh', 'Ali', 'Hassan'] }),
        fem: comKE(KE_FEM, { antiga: ['Kadzo', 'Dama', 'Sidi', 'Kache', 'Mwanajuma', 'Mwanaisha', 'Zuhura', 'Fatuma', 'Saumu', 'Mishi', 'Riziki'], meio: ['Kadzo', 'Dama', 'Sidi', 'Mwanaisha', 'Zuhura', 'Fatuma', 'Rehema', 'Halima', 'Aisha', 'Mwanamisi'], nova: ['Kadzo', 'Zawadi', 'Riziki', 'Fatma', 'Aisha', 'Amina', 'Khadija', 'Salma', 'Mwanaisha'] }),
        sobrenomes: ['Kazungu', 'Karisa', 'Katana', 'Baya', 'Kahindi', 'Chengo', 'Charo', 'Kenga', 'Ngala', 'Tsuma', 'Kalume', 'Kombe', 'Mramba', 'Masha', 'Nyale', 'Jefwa', 'Ziro', 'Kitsao', 'Dzombo', 'Mwachiro', 'Mwadime', 'Mwakio', 'Mghanga', 'Mwamburi', 'Mwakwere', 'Mohamed', 'Omar', 'Swaleh', 'Said', 'Athman', 'Bakari', 'Juma', 'Salim', 'Abdalla', 'Hamisi', 'Rashid', 'Mbarak', 'Mwinyi', 'Shee', 'Hamadi', 'Mwalimu']
      },
      {
        id: 'somali', peso: 5.6, divisoes: ['07', '46', '24'], sobrenome: 'um',
        masc: KE_MUC_MASC,
        fem: KE_MUC_FEM,
        sobrenomes: ['Mohamed', 'Abdi', 'Hassan', 'Ali', 'Farah', 'Hussein', 'Ahmed', 'Adan', 'Ibrahim', 'Osman', 'Warsame', 'Abdullahi', 'Omar', 'Yusuf', 'Gedi', 'Noor', 'Jama', 'Mohamud', 'Elmi', 'Dahir', 'Abdille', 'Hirsi', 'Kassim', 'Sheikh', 'Haji', 'Bashir', 'Issack', 'Muktar', 'Shire', 'Guled', 'Maalim', 'Abdirahman', 'Ismail', 'Salat', 'Duale', 'Abdinoor', 'Billow', 'Dekow', 'Unshur', 'Aden', 'Mahat', 'Abdikadir']
      },
      {
        id: 'pastores', peso: 6, divisoes: ['10', '33', '43', '37', '25', '09'], sobrenome: 'um',
        masc: comKE(KE_MASC, { antiga: ['Saitoti', 'Lemayian', 'Sankale', 'Ekai', 'Lokol', 'Ewoi', 'Guyo', 'Godana', 'Wario', 'Dida'], meio: ['Lemayian', 'Parsitau', 'Ekiru', 'Lokwang', 'Jattani', 'Galgalo', 'Boru', 'Halake'], nova: ['Lemayian', 'Sankale', 'Ekai', 'Guyo', 'Boru'] }),
        fem: comKE(KE_FEM, { antiga: ['Naserian', 'Nashipai', 'Nalangu', 'Nasieku', 'Naisula'], meio: ['Naserian', 'Nashipai', 'Resiato', 'Nasieku', 'Naisula'], nova: ['Naserian', 'Resiato', 'Nashipai', 'Naisula'] }),
        sobrenomes: ['Saitoti', 'Sankale', 'Tobiko', 'Kipury', 'Lemayian', 'Parsitau', 'Kisemei', 'Kamuaro', 'Ntimama', 'Konchella', 'Sayialel', 'Lenku', 'Tunai', 'Ekai', 'Ekiru', 'Lokol', 'Lomuria', 'Ewoi', 'Nanok', 'Ekeno', 'Lokwang', 'Emuria', 'Akai', 'Lokorio', 'Etabo', 'Lomulen', 'Ebei', 'Lekuton', 'Lesuuda', 'Lenolkulal', 'Leparmorijo', 'Lelenguyah', 'Guyo', 'Godana', 'Wario', 'Jattani', 'Dida', 'Huka', 'Galgalo', 'Boru', 'Roba', 'Dabaso', 'Halake', 'Tadicha']
      }
    ]
  },
  fontes: [
    'KNBS — 2019 Kenya Population and Housing Census, Volume IV (filiação étnica).',
    'KNBS — Kenya Continuous Household Survey 2021 (pobreza); Economic Survey (emprego informal).',
    'Regulation of Wages (General) (Amendment) Order 2026, Legal Notice 108/2026 (KSh 18.047,40 nas cidades).',
    'NSSF Act 2013, ano 4 (fev/2026): teto de KSh 108.000; KRA — tabela do PAYE.',
    'Employment Act 2007, s. 40 (redundância); Social Health Insurance Act 2023.',
    'Constituição do Quênia, 2010 (arts. 97, 98, 99, 101, 177, 180, 193; 1.º anexo, condados).',
    'Law of Succession Act, Cap. 160 (ss. 2(3), 26, 35–41); High Court, 2022, sobre a perda do usufruto pela viúva.',
    'Universities Act; KUCCPS; HELB / Universities Fund (novo modelo de financiamento, 2023).',
    'Protocolo do Mercado Comum da EAC (2010).',
    'FKF Premier League 2025/26 — clubes.'
  ]
};

/* ============================================================ MARROCOS */

/*
 * SUCESSÃO — MARROCOS (Código da Família, "Moudawana", Lei 70-03 de 2004:
 * Livro V, testamento; Livro VI, sucessões, arts. 321–395; base no direito
 * islâmico malikita):
 *  - QUOTAS FIXAS ("fard"): a viúva recebe 1/8 havendo filhos e 1/4 sem
 *    eles; o viúvo, 1/4 e 1/2; o pai e a mãe, 1/6 cada havendo filhos; a
 *    filha única, 1/2, duas ou mais, 2/3 — e, havendo filhos homens, os
 *    filhos herdam como "residuários" ("ta'sib"), o homem com o dobro da
 *    mulher; irmãos e outros agnatas herdam o resíduo na falta de filhos homens;
 *  - testamento ("wasiyya") só até UM TERÇO do patrimônio e não a favor de
 *    um herdeiro, salvo se os demais consentirem — os outros dois terços
 *    seguem obrigatoriamente as quotas;
 *  - "legado obrigatório" ("wasiyya wajiba", arts. 369–372): os netos pelo
 *    filho (e, desde 2004, também pela filha) que morreu antes recebem a
 *    parte do pai/mãe, até um terço;
 *  - regime de bens: separação; o casal pode pactuar a gestão dos bens
 *    adquiridos (art. 49), e o trabalho de cada um na formação do patrimônio
 *    é considerado na partilha — mas não há meação automática;
 *  - sem herdeiros, o Tesouro Público (art. 349, Bayt al-Mal).
 *  - Marroquinos judeus seguem o direito hebraico (art. 2).
 * ABSTRAÇÃO DECLARADA (o jogo não tem quotas por sexo nem resíduo
 * agnático): legítima = 2/3 (a parte que o testamento não alcança),
 * herdeiros necessários = descendentes, ascendentes e cônjuge; cônjuge
 * concorre "por cabeça" com os filhos (a lei dá 1/8 ou 1/4 — o jogo tende a
 * dar mais ao cônjuge quando há poucos filhos) e fica com 1/4 diante dos pais
 * (o caso da viúva; o viúvo teria 1/2); a diferença de quota entre filho e
 * filha NÃO é modelada (o jogo reparte por cabeça); a representação vale
 * pelo legado obrigatório. A revisão da Moudawana anunciada em 2024 não é
 * modelada. Não há imposto sobre herança entre herdeiros diretos; custos de
 * adouls, registro e conservação fundiária entram como ~2%.
 */

/*
 * NOMES — MARROCOS. RGPH 2024 (HCP): 91,9% usam o dárija; 24,8% usam uma
 * língua amazigue (tachelhit 14,2%, tamazight 7,4%, tarifit 3,2%; 33,3% no
 * meio rural). Grupos: árabe-dárija 75 (o país todo); amazigue do Sous e do
 * Anti-Atlas (tachelhit) 14,2; do Médio e Alto Atlas e do Drâa-Tafilalet
 * (tamazight) 7,4; do Rife (tarifit) 3,2. Os amazigues usam sobretudo os
 * mesmos nomes árabe-islâmicos; nomes amazigues (Idir, Anir, Tilelli,
 * Tafsut...) eram recusados pelo registro civil até a circular de 2010 do
 * Ministério do Interior e a Constituição de 2011 (amazigue língua oficial),
 * e aparecem mais na geração nova. Sobrenomes: o estado civil é obrigatório
 * desde 1950 (Lei 37-99 hoje); os amazigues têm muitos em "Ait" (os de) e
 * "Ou" (filho de). Sem estatística oficial pública de nomes de batismo.
 */

const MA_MASC = {
  antiga: ['Mohammed', 'Ahmed', 'Abdelkader', 'Abdellah', 'Mustapha', 'Driss', 'Hassan', 'Larbi', 'Lahcen', 'Brahim', 'Allal', 'Bouchaib', 'Abderrahmane', 'Abdeslam', 'Omar', 'Ali', 'Miloud', 'Mbarek', 'Jilali', 'Hamid', 'Abdelaziz', 'Mohamed', 'Kaddour', 'Thami', 'Lhoussaine', 'Said', 'Bouazza', 'Mekki', 'Abdelhak', 'Hmad'],
  meio: ['Youssef', 'Karim', 'Hicham', 'Rachid', 'Nabil', 'Khalid', 'Abdelilah', 'Mourad', 'Adil', 'Jamal', 'Samir', 'Noureddine', 'Yassine', 'Tarik', 'Anas', 'Soufiane', 'Mehdi', 'Amine', 'Hamza', 'Ayoub', 'Redouane', 'Aziz', 'Othmane', 'Zakaria', 'Ilyas', 'Badr', 'Mohcine', 'Reda', 'Abdelali', 'Mohamed'],
  nova: ['Mohammed', 'Adam', 'Youssef', 'Ilyas', 'Amir', 'Ayoub', 'Anas', 'Yassine', 'Hamza', 'Omar', 'Othmane', 'Aymane', 'Rayane', 'Mehdi', 'Idriss', 'Nizar', 'Ali', 'Ismail', 'Zakaria', 'Taha', 'Yahya', 'Souhail', 'Wassim', 'Saad', 'Bilal', 'Haytam', 'Ziyad', 'Jad', 'Sami', 'Rayan']
};
const MA_FEM = {
  antiga: ['Fatima', 'Khadija', 'Aicha', 'Zohra', 'Rkia', 'Zineb', 'Malika', 'Rahma', 'Halima', 'Mina', 'Fatna', 'Hadda', 'Mbarka', 'Yamna', 'Zahra', 'Saadia', 'Hajiba', 'Touria', 'Naima', 'Habiba', 'Hafida', 'Latifa', 'Rachida', 'Khaddouj', 'Fadma', 'Kenza', 'Jamila', 'Batoul', 'Zoubida', 'Aziza'],
  meio: ['Fatima Zahra', 'Sanaa', 'Nadia', 'Samira', 'Hanane', 'Naima', 'Karima', 'Asmae', 'Hajar', 'Meryem', 'Salma', 'Imane', 'Siham', 'Khadija', 'Laila', 'Loubna', 'Bouchra', 'Ghizlane', 'Houda', 'Kenza', 'Nawal', 'Najat', 'Samia', 'Soukaina', 'Ikram', 'Sara', 'Ilham', 'Wafae', 'Zineb', 'Hind'],
  nova: ['Malak', 'Hiba', 'Douae', 'Aya', 'Salma', 'Rim', 'Nour', 'Inès', 'Ghita', 'Yasmine', 'Kawtar', 'Lina', 'Hajar', 'Assia', 'Chaimae', 'Oumaima', 'Meryem', 'Imane', 'Jana', 'Sofia', 'Rania', 'Wiam', 'Basma', 'Nada', 'Hafsa', 'Israe', 'Maryam', 'Khaoula', 'Manal', 'Doha']
};
const MA_SOBRENOMES_AR = ['Alaoui', 'Bennani', 'El Idrissi', 'Benjelloun', 'Tazi', 'El Amrani', 'Berrada', 'Chraibi', 'Bennis', 'Lahlou', 'Fassi Fihri', 'Benkirane', 'Naciri', 'Saidi', 'El Fassi', 'Belhaj', 'Mansouri', 'Ouazzani', 'Kettani', 'Sqalli', 'Lamrani', 'Bouzidi', 'Hajji', 'El Khatib', 'Rachidi', 'Bakkali', 'Benali', 'Cherkaoui', 'Ziani', 'Moussaoui', 'El Hachimi', 'Rifai', 'Bennouna', 'Slaoui', 'Guessous', 'Laraki', 'Benchekroun', 'Sebti', 'Filali', 'Kabbaj', 'Chaoui', 'Haddad', 'Mernissi', 'Zaki', 'El Mokhtari', 'Jebbari', 'Talbi', 'Ennaji'];
const comMA = (base: { antiga: string[]; meio: string[]; nova: string[] }, extra: { antiga: string[]; meio: string[]; nova: string[] }) =>
  ({ antiga: [...base.antiga, ...extra.antiga], meio: [...base.meio, ...extra.meio], nova: [...base.nova, ...extra.nova] });

export const MARROCOS: PerfilDePais = {
  id: 'MA',
  gentilico: ['marroquino', 'marroquina'],
  idiomas: ['árabe (dárija)', 'amazigue', 'francês'],
  divisao: {
    tipo: ['região', 'regiões'],
    // Regiões de 2015 (Decreto 2-15-40; ISO 3166-2:MA). Só as usadas pelas
    // cidades e pelos nomes. Custo e salário: o eixo Casablanca–Rabat concentra
    // emprego formal e preços; Drâa-Tafilalet e Béni Mellal abaixo (HCP, contas regionais).
    lista: [
      { codigo: '01', nome: 'Tânger-Tetuão-Al Hoceima' },
      { codigo: '02', nome: 'Oriental', custo: 0.92, salario: 0.88 },
      { codigo: '03', nome: 'Fez-Meknès', custo: 0.95, salario: 0.92 },
      { codigo: '04', nome: 'Rabat-Salé-Kenitra', custo: 1.12, salario: 1.12 },
      { codigo: '05', nome: 'Béni Mellal-Khénifra', custo: 0.9, salario: 0.85 },
      { codigo: '06', nome: 'Casablanca-Settat', custo: 1.18, salario: 1.2 },
      { codigo: '07', nome: 'Marrakech-Safi' },
      { codigo: '08', nome: 'Drâa-Tafilalet', custo: 0.88, salario: 0.82 },
      { codigo: '09', nome: 'Sous-Massa' },
      { codigo: '10', nome: 'Guelmim-Oued Noun', custo: 0.92, salario: 0.88 }
    ]
  },
  cidades: [
    ['Casablanca', '06', 'metropole', 'sede|litoral'],
    ['Rabat', '04', 'metropole', 'capital|sede|litoral'],
    ['Fez', '03', 'metropole', 'sede'],
    ['Marrakech', '07', 'metropole', 'sede'],
    ['Tânger', '01', 'metropole', 'sede|litoral'],
    ['Meknès', '03', 'polo'],
    ['Agadir', '09', 'capital', 'sede|litoral'],
    ['Oujda', '02', 'capital', 'sede'],
    ['Kenitra', '04', 'polo', 'litoral'],
    ['Tétouan', '01', 'polo'],
    ['Béni Mellal', '05', 'capital', 'sede'],
    ['Errachidia', '08', 'capital', 'sede'],
    ['Berkane', '02', 'polo'],
    ['Al Hoceima', '01', 'pequena', 'litoral']
  ],
  economia: {
    // Pobreza absoluta 3,9% e vulnerabilidade ~12% (HCP, 2022); Gini ~0,40;
    // grande massa de trabalhadores e camada média urbana; topo pequeno.
    classes: { vulneravel: 18, trabalhadora: 34, media_baixa: 24, media: 18, alta: 6 },
    // Aluguel moderado em relação aos outros preços (alto só em bairros de Casablanca/Rabat).
    moradia: 0.95,
    // SMIG (setor privado não agrícola): 17,92 DH/hora desde 1/1/2026 (Decreto
    // 2.25.983; acordo social de 29/4/2024) × 191 h = 3.422,72 DH/mês.
    salarioMinimo: 3423,
    // Emprego informal ~77% do total, incluindo a agricultura (HCP; ILOSTAT).
    informalidade: 0.75,
    // IPC: 6,1% em 2023, ~1% em 2024–25 (HCP; Bank Al-Maghrib).
    inflacao: 0.02,
    volatilidade: 0.6
  },
  trabalho: {
    mesesPagos: 12, // 13.º salário não é legal (é comum só por convenção)
    // CNSS: prestações de longo prazo 3,96% + curto prazo 0,33% do salário até o teto
    // de 6.000 DH/mês; a AMO (2,26%) é saúde, sem teto, e fica de fora.
    contribuicao: { aliquota: [0.0429, 0.0429], teto: 6000 },
    // IR (Lei de Finanças 2025): isento até 40.000 DH/ano (3.333/mês); 10%, 20%, 30%,
    // 34%, 37% acima — 0,2 representa a faixa típica do assalariado.
    impostoRenda: { isencao: 3333, aliquota: 0.2 },
    // Código do Trabalho (Lei 65-99), arts. 52–53: 96 horas de salário por ano até
    // 5 anos, 144 de 6 a 10, 192 de 11 a 15, 240 acima (≈ 0,5 a 1,25 mês/ano).
    rescisao: { nome: 'indenização de despedimento', mesesPorAno: 0.6 },
    // IPE (Lei 03-14): até 6 meses, 70% do salário médio, limitado ao SMIG.
    seguroDesemprego: { meses: 6, reposicao: 0.7 },
    // CNSS: pensão aos 60 anos; desde o Decreto 2.25.265 (maio de 2025) bastam
    // 1.320 dias declarados (~4–5 anos) para uma pensão proporcional; 50% do
    // salário de referência com 3.240 dias, até 70%.
    previdencia: { idade: [60, 60], anos: [5, 5], reposicao: 0.5, nome: 'a CNSS' },
    concurso: true, // ingresso na função pública por concurso (Estatuto Geral, Dahir 1-58-008, art. 22)
    contratoFormal: 'emprego declarado na CNSS'
  },
  educacao: {
    etapas: {
      // Lei-quadro 51-17: ensino obrigatório dos 4 aos 16 anos (pré-escolar,
      // primário de 6 anos, colégio de 3); depois o liceu qualificante (tronco comum + 2 anos do bac).
      fundamental: 'ensino primário e colégio', medio: 'liceu (secundário qualificante)', serieMedio: 'ano',
      publica: { creche: 'o pré-escolar público', fundamental: 'a escola pública', medio: 'o liceu público' }
    },
    // Com o bac, as faculdades de "acesso aberto" (direito, letras, ciências) admitem
    // sem seleção; escolas de engenharia, comércio e medicina selecionam por nota e concurso.
    ingresso: 'acesso_aberto',
    exame: { nome: 'bac', artigo: 'o' },
    publicaCobra: 0,
    // Bolsa "Minhaty" (ONOUSC), concedida pelo índice socioeconômico do RSU; o teto em
    // salários mínimos é uma abstração.
    bolsa: { nome: 'bolsa Minhaty', teto: 1.5 },
    cotas: false,
    privadaComum: false // privado ~5–6% das matrículas no superior (Ministério do Ensino Superior)
  },
  politica: {
    sistema: 'monarquia constitucional parlamentarista; o rei nomeia o chefe de governo do partido mais votado',
    cargos: {
      // Lei Orgânica 59-11 (conselhos das coletividades territoriais) e 113-14 (comunas):
      // os presidentes de comuna e de região são eleitos pelos conselhos; os walis e governadores, nomeados.
      vereador: { titulo: ['conselheiro comunal', 'conselheira comunal'], anos: 6, idade: 18, casa: 'o Conselho Comunal' },
      deputado_estadual: { titulo: ['conselheiro regional', 'conselheira regional'], anos: 6, idade: 18, casa: 'o Conselho Regional' },
      // Lei Orgânica 27-11 (Câmara dos Representantes): mandato de 5 anos.
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 5, idade: 18, casa: 'a Câmara dos Representantes' }
      // A Câmara dos Conselheiros é eleita indiretamente: fora.
    },
    // Legislativas: 23/9/2026; comunais e regionais: 2027 (mandato de 6 anos desde 2021).
    eleicoes: { local: [2027, 6], geral: [2026, 5] },
    mes: 8,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Lei 44-18: serviço militar de 12 meses restabelecido em 2019, dos 19 aos 25
    // anos, por convocação seletiva (sorteio entre os recenseados).
    servico: 'seletivo',
    idade: 19,
    forcas: { exercito: 'as Forças Terrestres Reais', marinha: 'a Marinha Real', aeronautica: 'as Forças Reais do Ar' },
    policia: 'a Sûreté Nationale (DGSN)'
  },
  esporte: {
    // Futebol absoluto (seleção semifinalista da Copa de 2022; CAN 2025 em casa);
    // atletismo de meio-fundo histórico; boxe e taekwondo com medalhas; tênis com tradição.
    popularidade: { futebol: 1.5, volei: 0.6, basquete: 0.65, natacao: 0.55, atletismo: 1.2, lutas: 1.05, tenis: 0.8 },
    divisoes: ['ligas regionais', 'Championnat National Amateur', 'Botola Pro 2', 'Botola Pro'],
    clubes: [
      { nome: 'Wydad', artigo: 'o', porte: 'grande', cidade: 'Casablanca' },
      { nome: 'Raja', artigo: 'o', porte: 'grande', cidade: 'Casablanca' },
      { nome: 'AS FAR', artigo: 'o', porte: 'grande', cidade: 'Rabat' },
      { nome: 'RS Berkane', artigo: 'o', porte: 'tradicional', cidade: 'Berkane' },
      { nome: 'MAS Fès', artigo: 'o', porte: 'tradicional', cidade: 'Fez' },
      { nome: 'FUS Rabat', artigo: 'o', porte: 'tradicional', cidade: 'Rabat' },
      { nome: 'Hassania Agadir', artigo: 'o', porte: 'tradicional', cidade: 'Agadir' },
      { nome: 'Ittihad Tanger', artigo: 'o', porte: 'tradicional', cidade: 'Tânger' },
      { nome: 'CODM Meknès', artigo: 'o', porte: 'tradicional', cidade: 'Meknès' },
      { nome: 'Kawkab Marrakech', artigo: 'o', porte: 'tradicional', cidade: 'Marrakech' },
      { nome: 'Moghreb Tétouan', artigo: 'o', porte: 'regional', cidade: 'Tétouan' },
      { nome: 'MC Oujda', artigo: 'o', porte: 'regional', cidade: 'Oujda' },
      { nome: 'KAC Kenitra', artigo: 'o', porte: 'regional', cidade: 'Kenitra' },
      { nome: 'Chabab Rif Al Hoceima', artigo: 'o', porte: 'regional', cidade: 'Al Hoceima' },
      { nome: 'Raja Béni Mellal', artigo: 'o', porte: 'regional', cidade: 'Béni Mellal' }
    ]
  },
  // AMO generalizada desde 2022 (Lei-quadro 09-21; AMO-Tadamon para quem não pode
  // pagar); hospitais públicos e clínicas privadas coexistem.
  saude: { sistema: 'misto', redePublica: 'a AMO e os hospitais públicos', custoPlano: 0.6 },
  // Sem bloco de livre residência; contrato de trabalho de estrangeiro visado pelo
  // Ministério do Trabalho, com atestado da ANAPEC (preferência nacional).
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'MA',
    nome: 'Marrocos',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 4, 1 / 4],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.02,
    rotuloCusto: 'adouls, registro e conservação fundiária',
    vacancia: 'o Tesouro Público'
  },
  nomes: {
    cortes: [1975, 2000],
    grupos: [
      {
        id: 'arabe', peso: 75, sobrenome: 'um',
        masc: MA_MASC,
        fem: MA_FEM,
        sobrenomes: MA_SOBRENOMES_AR
      },
      {
        id: 'amazigue_sous', peso: 14.2, divisoes: ['09', '07', '10'], sobrenome: 'um',
        masc: comMA(MA_MASC, { antiga: ['Lahoucine', 'Mbark', 'Ahmad', 'Hmad'], meio: ['Lahcen', 'Brahim', 'Abdellah'], nova: ['Anir', 'Idir', 'Amazigh', 'Yuba'] }),
        fem: comMA(MA_FEM, { antiga: ['Fadma', 'Tamou', 'Itto', 'Kaltoum'], meio: ['Fadma', 'Rkia'], nova: ['Tilelli', 'Tafsut', 'Tanirt', 'Tifawt'] }),
        sobrenomes: ['Ait Ali', 'Ait Said', 'Ait Lahcen', 'Ait Hammou', 'Ait Brahim', 'Ait Moussa', 'Ait Taleb', 'Ait Idir', 'Ait Bennasser', 'Ait Nouri', 'Oumoussa', 'Ouhammou', 'Outaleb', 'Oulhaj', 'Oubaha', 'Ouali', 'Ouaziz', 'Amzil', 'Akhannouch', 'Aznag', 'Amghar', 'Ouchen', 'Ouaddou', 'Bouhou', 'Boutaleb', 'Lahbib',
          'Alaoui', 'El Idrissi', 'Saidi', 'Bouzidi', 'Hajji', 'Bakkali', 'Benali', 'Moussaoui', 'Ziani', 'Haddad', 'Talbi', 'El Amrani', 'Lamrani', 'Cherkaoui']
      },
      {
        id: 'amazigue_atlas', peso: 7.4, divisoes: ['05', '08', '03'], sobrenome: 'um',
        masc: comMA(MA_MASC, { antiga: ['Moha', 'Addi', 'Haddou', 'Hammou'], meio: ['Moha', 'Hammou', 'Lahcen'], nova: ['Amayas', 'Idir', 'Aksel', 'Anir'] }),
        fem: comMA(MA_FEM, { antiga: ['Itto', 'Touda', 'Ijja', 'Hennou', 'Tamimount'], meio: ['Itto', 'Touda'], nova: ['Tilelli', 'Tinhinane', 'Dihya', 'Tanirt'] }),
        sobrenomes: ['Ait Hammou', 'Ait Addi', 'Ait Ichou', 'Ait Lahcen', 'Ait Ali', 'Ait Moha', 'Ait Ouali', 'Oumoussa', 'Ouhaddou', 'Ouhammou', 'Oulhaj', 'Ouchen', 'Amghar', 'Bouhou', 'Moha', 'Haddou', 'Zayani', 'Ouazzani', 'El Khayati', 'Bouamama', 'Haddad', 'Chaoui', 'Lamrani', 'Cherkaoui', 'Bennani', 'Tazi',
          'Alaoui', 'El Idrissi', 'Saidi', 'Bouzidi', 'Hajji', 'Bakkali', 'Benali', 'Moussaoui', 'Ziani', 'Talbi', 'El Amrani', 'Mansouri', 'Rachidi', 'Filali']
      },
      {
        id: 'amazigue_rif', peso: 3.2, divisoes: ['01', '02'], sobrenome: 'um',
        masc: comMA(MA_MASC, { antiga: ['Mimoun', 'Amar', 'Hmidou'], meio: ['Mimoun', 'Nordin', 'Karim'], nova: ['Idir', 'Aksel', 'Amazigh'] }),
        fem: comMA(MA_FEM, { antiga: ['Mimouna', 'Thraya', 'Rahma'], meio: ['Mimouna', 'Fatiha'], nova: ['Thiziri', 'Tafsut', 'Tilelli'] }),
        sobrenomes: ['El Azzouzi', 'Aberkan', 'Bouhaddouz', 'Boussoufa', 'Amrabat', 'Ziyech', 'El Kaddouri', 'El Ouariachi', 'Azzouzi', 'Bouzian', 'El Hamdaoui', 'Afellay', 'Mimouni', 'Boutahar', 'El Morabit', 'Achahbar', 'El Khattabi', 'Amezian', 'Benhaddou', 'Bakkali', 'Bouhaddou', 'Ahmadi', 'Hamdaoui', 'Rachidi', 'Filali', 'Haddad', 'Chaoui', 'Lamrani', 'Cherkaoui',
          'Alaoui', 'El Idrissi', 'Saidi', 'Bouzidi', 'Hajji', 'Benali', 'Moussaoui', 'Ziani', 'Talbi', 'El Amrani', 'Mansouri']
      }
    ]
  },
  fontes: [
    'HCP — RGPH 2024 (línguas: dárija 91,9%, amazigue 24,8%: tachelhit 14,2%, tamazight 7,4%, tarifit 3,2%).',
    'Código da Família (Moudawana), Lei 70-03 de 2004, Livros V e VI (arts. 277–395).',
    'Decreto 2.25.983 (SMIG 2026: 17,92 DH/h); acordo de diálogo social de 29/4/2024.',
    'Lei de Finanças 2025 (barema do IR); CNSS (taxas e teto de 6.000 DH; Decreto 2.25.265 de 2025, 1.320 dias).',
    'Código do Trabalho, Lei 65-99 (arts. 52–53); Lei 03-14 (IPE, indenização por perda de emprego).',
    'Constituição de 2011 (arts. 5, 62, 135–146); Leis Orgânicas 27-11, 59-11, 111-14 e 113-14.',
    'Ministério do Interior — legislativas de 23/9/2026; comunais e regionais em 2027.',
    'Lei 44-18 (serviço militar, 2019); Lei-quadro 51-17 (sistema de educação); Lei-quadro 09-21 (proteção social).',
    'Lei 37-99 (estado civil) e circular do Ministério do Interior de 2010 sobre nomes amazigues.',
    'HCP — pobreza e vulnerabilidade (2022), emprego informal; Bank Al-Maghrib (inflação).',
    'FRMF — Botola Pro 2025/26 (clubes).'
  ]
};

export const PAISES: PerfilDePais[] = [AFRICA_DO_SUL, NIGERIA, ANGOLA, QUENIA, MARROCOS];
