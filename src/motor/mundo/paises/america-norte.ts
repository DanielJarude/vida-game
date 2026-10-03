/**
 * AMÉRICA DO NORTE — Estados Unidos, Canadá e México.
 *
 * Três federações em que boa parte das regras é estadual/provincial (salário
 * mínimo, imposto, herança, eleição local). Onde a regra muda de estado para
 * estado, o perfil traz a forma NACIONAL ou a TÍPICA, e o comentário diz qual.
 * Fontes e abstrações: `docs/notas/FONTES-PAISES-AMERICA-NORTE-OCEANIA.md`.
 */

import type { PerfilDePais } from '../tipos';

/* ================================================================ EUA */

/*
 * SUCESSÃO — ESTADOS UNIDOS (direito estadual; referência: Uniform Probate
 * Code, adotado no todo ou em parte por cerca de 20 estados):
 *  - liberdade de testar quanto aos filhos: não há legítima dos descendentes
 *    (só a Louisiana tem "forced heirship", e limitada);
 *  - o cônjuge, porém, tem a "elective share" na maioria dos estados de
 *    common law (UPC §2-202: até 50% do patrimônio aumentado, conforme a
 *    duração do casamento; em muitos estados, um terço) — é a legítima do
 *    jogo: um terço, só para o cônjuge;
 *  - sem testamento (UPC §2-102/2-103): o cônjuge herda tudo se os filhos
 *    forem todos do casal; senão concorre com eles; sem filhos e com pais
 *    vivos, fica com os primeiros US$ 300 mil e três quartos do resto;
 *  - representação por estirpe (UPC §2-106); irmãos herdam na falta de
 *    descendentes, cônjuge e pais (UPC §2-103);
 *  - sem herdeiros, os bens vão para o estado ("escheat", UPC §2-105).
 * SIMPLIFICAÇÕES DECLARADAS: os 9 estados de "community property" (Califórnia,
 * Texas, Arizona...) dariam meação; a maioria não dá, e o perfil fica com a
 * maioria (meacao: false). O imposto federal sobre heranças (estate tax) só
 * atinge patrimônios acima de US$ 15 milhões (2026, One Big Beautiful Bill
 * Act); poucos estados cobram imposto próprio. O custo médio é o do
 * inventário judicial (probate) e dos advogados, ~3%.
 */

export const ESTADOS_UNIDOS: PerfilDePais = {
  id: 'US',
  gentilico: ['americano', 'americana'],
  idiomas: ['inglês', 'espanhol'],
  divisao: {
    tipo: ['estado', 'estados'],
    // custo/salário: Regional Price Parities do BEA (2023) e renda média por estado;
    // Califórnia, Nova York, Nova Jersey e o Distrito de Columbia ~10–13% acima da
    // média de preços, Kentucky e Ohio ~10% abaixo. Mantido modesto.
    lista: [
      { codigo: 'NY', nome: 'Nova York', custo: 1.25, salario: 1.2 },
      { codigo: 'CA', nome: 'Califórnia', custo: 1.25, salario: 1.2 },
      { codigo: 'IL', nome: 'Illinois', custo: 1.0, salario: 1.05 },
      { codigo: 'TX', nome: 'Texas', custo: 0.95, salario: 1.0 },
      { codigo: 'DC', nome: 'Distrito de Columbia', custo: 1.3, salario: 1.3 },
      { codigo: 'FL', nome: 'Flórida', custo: 1.0, salario: 0.95 },
      { codigo: 'GA', nome: 'Geórgia', custo: 0.95, salario: 0.95 },
      { codigo: 'WA', nome: 'Washington', custo: 1.15, salario: 1.15 },
      { codigo: 'OH', nome: 'Ohio', custo: 0.9, salario: 0.9 },
      { codigo: 'OR', nome: 'Oregon', custo: 1.05, salario: 1.0 },
      { codigo: 'KY', nome: 'Kentucky', custo: 0.85, salario: 0.85 },
      { codigo: 'NJ', nome: 'Nova Jersey', custo: 1.15, salario: 1.15 },
      { codigo: 'MT', nome: 'Montana', custo: 0.95, salario: 0.85 }
    ]
  },
  cidades: [
    ['Nova York', 'NY', 'metropole', 'litoral'],
    ['Los Angeles', 'CA', 'metropole', 'litoral'],
    ['Chicago', 'IL', 'metropole', 'litoral'],
    ['Houston', 'TX', 'metropole'],
    ['Washington', 'DC', 'metropole', 'capital'],
    ['Miami', 'FL', 'metropole', 'litoral'],
    ['Atlanta', 'GA', 'metropole', 'sede'],
    ['Seattle', 'WA', 'metropole', 'litoral'],
    ['Columbus', 'OH', 'capital', 'sede'],
    ['Sacramento', 'CA', 'capital', 'sede'],
    ['Portland', 'OR', 'polo'],
    ['Louisville', 'KY', 'polo'],
    ['Jersey City', 'NJ', 'metropolitana', 'metro:Nova York|litoral'],
    ['Bozeman', 'MT', 'pequena']
  ],
  economia: {
    // Pobreza oficial ~11% (Census Bureau, 2023), Gini ~0,41 (Banco Mundial):
    // a base é menor que a brasileira, a classe média é a maior fatia e o topo
    // é largo. Pesos: 12/25/25/26/12.
    classes: { vulneravel: 12, trabalhadora: 25, media_baixa: 25, media: 26, alta: 12 },
    // Aluguel alto em relação ao resto dos preços nas metrópoles (OCDE, preços de
    // moradia/renda; "shelter" é o maior item do CPI do BLS).
    moradia: 1.5,
    // Mínimo FEDERAL: US$ 7,25/h (Fair Labor Standards Act, inalterado desde 2009)
    // × 40 h × 52 / 12 = US$ 1.256,67/mês. Cerca de 30 estados e o DC têm mínimo
    // maior (até ~US$ 17–18/h); o federal é o único nacional.
    salarioMinimo: 1256.67,
    // ILO (2018): ~18% de emprego informal na América do Norte, quase todo
    // autônomo sem registro — conservador.
    informalidade: 0.18,
    inflacao: 0.03,
    volatilidade: 0.6
  },
  trabalho: {
    mesesPagos: 12,
    // FICA do empregado: 6,2% (Social Security) + 1,45% (Medicare) = 7,65%; a parte
    // da Social Security tem teto de US$ 184.500/ano em 2026 (US$ 15.375/mês).
    contribuicao: { aliquota: [0.0765, 0.0765], teto: 15375 },
    // Dedução-padrão federal de 2026 (solteiro): US$ 16.100/ano ≈ US$ 1.340/mês.
    // Alíquota típica: 12% federal (faixa da maioria) + ~5% de imposto estadual médio.
    impostoRenda: { isencao: 1340, aliquota: 0.17 },
    // "Employment at will" na regra geral de quase todos os estados (Montana é a
    // exceção): não há indenização legal por demissão; só o que o contrato der.
    rescisao: { nome: 'nada além do último salário (emprego "at will")', mesesPorAno: 0 },
    // Seguro estadual: em geral até 26 semanas, repondo ~40–50% até um teto (DOL).
    seguroDesemprego: { meses: 6, reposicao: 0.45 },
    // Social Security: idade plena 67 para nascidos de 1960 em diante; 40 créditos
    // (~10 anos de trabalho); reposição ~40% para o trabalhador médio (SSA).
    previdencia: { idade: [67, 67], anos: [10, 10], reposicao: 0.4, nome: 'Social Security' },
    // O serviço público federal contrata por candidatura com avaliação (USAJOBS);
    // não há o concurso como porta única.
    concurso: false,
    contratoFormal: 'emprego registrado na folha de pagamento (W-2)'
  },
  educacao: {
    etapas: {
      fundamental: 'ensino fundamental', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o Head Start do bairro', fundamental: 'a escola pública do distrito', medio: 'a high school pública' }
    },
    // Admissão por candidatura (notas, cartas, redação, SAT/ACT opcional em muitas).
    ingresso: 'candidatura',
    exame: { nome: 'SAT', artigo: 'o' },
    // College Board, Trends in College Pricing 2025: pública estadual ~US$ 12 mil/ano
    // (residentes) contra ~US$ 45 mil na privada sem fins lucrativos (~0,27); contra
    // a média das privadas (incluindo as com fins lucrativos), ~0,4.
    publicaCobra: 0.4,
    // Pell Grant: concentrado em famílias até ~US$ 60 mil/ano (≈ 1 mínimo federal por pessoa numa família de 4).
    bolsa: { nome: 'Pell Grant', teto: 1 },
    credito: { nome: 'empréstimo estudantil federal (Direct Loan)' },
    // Ação afirmativa por raça vedada (SFFA v. Harvard, 2023); não há cotas legais por renda/escola.
    cotas: false,
    privadaComum: true
  },
  politica: {
    sistema: 'república presidencialista federal',
    // Idades e mandatos municipais e estaduais variam por estado: aqui, os típicos.
    // Constituição: art. I §2 (deputado, 25 anos, mandato de 2), art. I §3 (senador, 30, 6).
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'o Conselho Municipal' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 18, casa: 'a Prefeitura' },
      deputado_estadual: { titulo: ['deputado estadual', 'deputada estadual'], anos: 2, idade: 21, casa: 'a Assembleia Legislativa do estado' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 2, idade: 25, casa: 'a Câmara dos Representantes' },
      senador: { titulo: ['senador', 'senadora'], anos: 6, idade: 30, casa: 'o Senado' },
      governador: { titulo: ['governador', 'governadora'], anos: 4, idade: 30, casa: 'o governo do estado' }
    },
    // Eleições gerais: novembro dos anos pares (meio de mandato em 2026). Locais:
    // muitas cidades votam em novembro dos anos ímpares (Nova York: 2025, 2029).
    eleicoes: { local: [2025, 4], geral: [2026, 2] },
    mes: 10,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Sem conscrição desde 1973, mas homens de 18 a 25 anos se registram no Selective Service.
    servico: 'seletivo',
    idade: 18,
    forcas: { exercito: 'o Exército dos Estados Unidos', marinha: 'a Marinha dos Estados Unidos', aeronautica: 'a Força Aérea dos Estados Unidos' },
    policia: 'a polícia municipal'
  },
  esporte: {
    // Basquete, natação, atletismo, tênis e luta (wrestling escolar, MMA, boxe) com
    // enorme estrutura escolar e universitária (NCAA); vôlei forte no feminino
    // universitário; futebol em crescimento, abaixo dos esportes nacionais.
    popularidade: { futebol: 0.8, volei: 1.05, basquete: 1.5, natacao: 1.35, atletismo: 1.25, lutas: 1.2, tenis: 1.3 },
    // Pirâmide sancionada pela US Soccer, sem acesso e descenso.
    divisoes: ['USL League Two', 'USL League One', 'USL Championship', 'MLS'],
    clubes: [
      { nome: 'LA Galaxy', artigo: 'o', porte: 'grande', cidade: 'Los Angeles' },
      { nome: 'LAFC', artigo: 'o', porte: 'grande', cidade: 'Los Angeles' },
      { nome: 'Seattle Sounders', artigo: 'o', porte: 'grande', cidade: 'Seattle' },
      { nome: 'Inter Miami', artigo: 'o', porte: 'grande', cidade: 'Miami' },
      { nome: 'Atlanta United', artigo: 'o', porte: 'grande', cidade: 'Atlanta' },
      { nome: 'New York Red Bulls', artigo: 'o', porte: 'tradicional', cidade: 'Nova York' },
      { nome: 'New York City FC', artigo: 'o', porte: 'tradicional', cidade: 'Nova York' },
      { nome: 'Columbus Crew', artigo: 'o', porte: 'tradicional', cidade: 'Columbus' },
      { nome: 'Portland Timbers', artigo: 'o', porte: 'tradicional', cidade: 'Portland' },
      { nome: 'Chicago Fire', artigo: 'o', porte: 'tradicional', cidade: 'Chicago' },
      { nome: 'Houston Dynamo', artigo: 'o', porte: 'tradicional', cidade: 'Houston' },
      { nome: 'D.C. United', artigo: 'o', porte: 'tradicional', cidade: 'Washington' },
      { nome: 'Louisville City', artigo: 'o', porte: 'regional', cidade: 'Louisville' },
      { nome: 'Sacramento Republic', artigo: 'o', porte: 'regional', cidade: 'Sacramento' }
    ]
  },
  // Cobertura por seguro (do empregador, ACA); Medicaid para baixa renda e Medicare aos 65.
  // Prêmio médio de um plano familiar do empregador ~US$ 26–27 mil/ano (KFF 2025).
  saude: { sistema: 'seguro', redePublica: 'o Medicaid', custoPlano: 3.5 },
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'US',
    nome: 'Estados Unidos',
    legitima: 1 / 3,
    necessarios: ['conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [0.75, 0.75],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.03,
    rotuloCusto: 'custas do inventário (probate) e advogados',
    vacancia: 'o estado'
  },
  nomes: {
    cortes: [1975, 2005],
    neutros: ['Taylor', 'Jordan', 'Riley', 'Avery', 'Quinn', 'Casey', 'Morgan', 'Jamie', 'Alex', 'Rowan', 'Skyler', 'Parker', 'Emerson', 'River', 'Sage'],
    grupos: [
      {
        // Nomes: Social Security Administration, "Popular Baby Names" por década.
        // Sobrenomes: Census Bureau, sobrenomes mais frequentes (2010).
        id: 'us',
        peso: 0.81,
        sobrenome: 'um',
        masc: {
          antiga: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Gary', 'Larry', 'Ronald', 'Donald', 'Kenneth', 'Steven', 'Dennis', 'Paul', 'Mark', 'George',
            'Edward', 'Jerry', 'Frank', 'Raymond', 'Gregory', 'Douglas', 'Roger', 'Walter', 'Harold', 'Wayne', 'Carl', 'Willie', 'Jimmy', 'Ralph', 'Bruce', 'Terry', 'Danny', 'Eugene', 'Henry', 'Arthur'],
          meio: ['Michael', 'Christopher', 'Matthew', 'Joshua', 'Jason', 'David', 'Daniel', 'Andrew', 'James', 'Justin', 'Robert', 'Ryan', 'John', 'Brandon', 'Joseph', 'Nicholas', 'Anthony', 'William', 'Jonathan', 'Tyler',
            'Kevin', 'Eric', 'Brian', 'Jacob', 'Kyle', 'Zachary', 'Aaron', 'Adam', 'Jeremy', 'Steven', 'Timothy', 'Sean', 'Travis', 'Cody', 'Dustin', 'Derrick', 'Marcus', 'Jamal', 'Terrell', 'Corey', 'Brett', 'Chad'],
          nova: ['Liam', 'Noah', 'Oliver', 'James', 'Elijah', 'William', 'Henry', 'Lucas', 'Benjamin', 'Theodore', 'Levi', 'Jack', 'Michael', 'Ethan', 'Mason', 'Logan', 'Jackson', 'Aiden', 'Grayson', 'Wyatt',
            'Hudson', 'Carter', 'Josiah', 'Jayden', 'Caleb', 'Isaiah', 'Owen', 'Asher', 'Leo', 'Ezra', 'Daniel', 'Samuel', 'Elias', 'Lincoln', 'Jaxon', 'Cameron', 'Malachi', 'Xavier', 'Nathan', 'Ryan']
        },
        fem: {
          antiga: ['Mary', 'Patricia', 'Linda', 'Barbara', 'Susan', 'Deborah', 'Karen', 'Nancy', 'Donna', 'Sandra', 'Carol', 'Sharon', 'Debra', 'Cynthia', 'Betty', 'Shirley', 'Dorothy', 'Margaret', 'Brenda', 'Pamela',
            'Judith', 'Joyce', 'Janet', 'Diane', 'Kathleen', 'Carolyn', 'Judy', 'Gloria', 'Joan', 'Martha', 'Cheryl', 'Teresa', 'Beverly', 'Evelyn', 'Frances', 'Helen', 'Ruth', 'Virginia', 'Jean', 'Peggy'],
          meio: ['Jennifer', 'Jessica', 'Amanda', 'Ashley', 'Sarah', 'Stephanie', 'Melissa', 'Nicole', 'Elizabeth', 'Heather', 'Emily', 'Lauren', 'Megan', 'Amber', 'Rachel', 'Brittany', 'Samantha', 'Danielle', 'Kimberly', 'Michelle',
            'Tiffany', 'Christina', 'Rebecca', 'Kayla', 'Hannah', 'Courtney', 'Crystal', 'Erin', 'Lisa', 'Angela', 'Latoya', 'Keisha', 'Alexis', 'Kelly', 'Andrea', 'Monique', 'Erica', 'April', 'Holly', 'Natalie'],
          nova: ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia', 'Mia', 'Isabella', 'Ava', 'Evelyn', 'Luna', 'Harper', 'Eliana', 'Ella', 'Elizabeth', 'Mila', 'Aria', 'Scarlett', 'Abigail', 'Madison', 'Chloe',
            'Avery', 'Nova', 'Layla', 'Emily', 'Hazel', 'Nora', 'Zoey', 'Aaliyah', 'Riley', 'Willow', 'Penelope', 'Brooklyn', 'Grace', 'Violet', 'Stella', 'Naomi', 'Aurora', 'Lily', 'Savannah', 'Paisley']
        },
        sobrenomes: [
          'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor',
          'Thomas', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson',
          'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill', 'Green', 'Adams', 'Baker',
          'Nelson', 'Mitchell', 'Campbell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner', 'Parker', 'Collins',
          'Edwards', 'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Cooper', 'Peterson', 'Reed',
          'Bailey', 'Bell', 'Kelly', 'Howard', 'Ward', 'Brooks', 'Washington', 'Jefferson', 'Lee', 'Nguyen',
          'Kim', 'Patel', 'Chen', 'Wang', 'Schmidt', 'Kowalski', 'Russo', 'O\'Brien', 'Sullivan', 'Larson'
        ]
      },
      {
        // ~19% da população é hispânica (Census 2020), concentrada no Sudoeste,
        // Flórida, Illinois e Nova York. Nomes: SSA e registros estaduais (ex.: Califórnia).
        id: 'us_hispanico',
        peso: 0.19,
        divisoes: ['CA', 'TX', 'FL', 'IL', 'NY', 'NJ'],
        sobrenome: 'um',
        masc: {
          antiga: ['José', 'Juan', 'Jesús', 'Manuel', 'Carlos', 'Luis', 'Jorge', 'Antonio', 'Francisco', 'Pedro', 'Ramón', 'Raúl', 'Roberto', 'Rafael', 'Ricardo', 'Miguel', 'Fernando', 'Ernesto', 'Arturo', 'Alfredo',
            'Rubén', 'Armando', 'Héctor', 'Ángel', 'Javier', 'Gilberto', 'Joe', 'Frank', 'Richard', 'Robert'],
          meio: ['Jose', 'Luis', 'Carlos', 'Juan', 'Jesus', 'Daniel', 'Christopher', 'Anthony', 'Jonathan', 'David', 'Miguel', 'Alejandro', 'Eduardo', 'Ricardo', 'Oscar', 'Adrian', 'Fernando', 'Javier', 'Mario', 'Victor',
            'Andres', 'Sergio', 'Alexander', 'Hector', 'Brian', 'Kevin', 'Erick', 'Cesar', 'Michael', 'Angel'],
          nova: ['Mateo', 'Santiago', 'Liam', 'Sebastian', 'Noah', 'Leonardo', 'Gael', 'Julian', 'Adrian', 'Daniel', 'Jayden', 'Angel', 'Matias', 'Thiago', 'Lucas', 'Diego', 'Emiliano', 'Ezequiel', 'Isaac', 'Josue',
            'Luca', 'Ian', 'Dylan', 'Christopher', 'Elias', 'Kevin', 'Gabriel', 'Nicolas', 'Benjamin', 'Ethan']
        },
        fem: {
          antiga: ['María', 'Guadalupe', 'Rosa', 'Carmen', 'Juana', 'Margarita', 'Gloria', 'Teresa', 'Josefina', 'Socorro', 'Elena', 'Dolores', 'Esperanza', 'Alicia', 'Irma', 'Yolanda', 'Silvia', 'Martha', 'Graciela', 'Leticia',
            'Patricia', 'Norma', 'Raquel', 'Ana', 'Lourdes', 'Rosario', 'Mary', 'Linda', 'Olga', 'Isabel'],
          meio: ['Jessica', 'Maria', 'Stephanie', 'Jennifer', 'Vanessa', 'Ashley', 'Daisy', 'Karina', 'Veronica', 'Claudia', 'Adriana', 'Alejandra', 'Gabriela', 'Marisol', 'Elizabeth', 'Diana', 'Yesenia', 'Leslie', 'Monica', 'Erika',
            'Brenda', 'Andrea', 'Michelle', 'Nancy', 'Cynthia', 'Jasmine', 'Melissa', 'Priscilla', 'Cristina', 'Lucia'],
          nova: ['Sofia', 'Isabella', 'Camila', 'Valentina', 'Mia', 'Emma', 'Victoria', 'Luna', 'Mila', 'Ximena', 'Valeria', 'Gianna', 'Aaliyah', 'Natalia', 'Emily', 'Genesis', 'Ariana', 'Daniela', 'Abigail', 'Lucia',
            'Catalina', 'Elena', 'Olivia', 'Amelia', 'Renata', 'Mariana', 'Allison', 'Sophia', 'Alexa', 'Emilia']
        },
        sobrenomes: [
          'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres',
          'Flores', 'Rivera', 'Gomez', 'Diaz', 'Reyes', 'Cruz', 'Morales', 'Ortiz', 'Gutierrez', 'Chavez',
          'Ramos', 'Ruiz', 'Alvarez', 'Mendoza', 'Castillo', 'Jimenez', 'Vasquez', 'Moreno', 'Herrera', 'Medina',
          'Aguilar', 'Vargas', 'Castro', 'Guzman', 'Fernandez', 'Romero', 'Soto', 'Contreras', 'Mendez', 'Delgado'
        ]
      }
    ]
  },
  fontes: [
    'US Department of Labor: Fair Labor Standards Act, salário mínimo federal (US$ 7,25/h) e "State Minimum Wage Laws" (2026).',
    'Social Security Administration: teto de contribuição de 2026 (US$ 184.500), idade plena de aposentadoria, 40 créditos; "Popular Baby Names" (ssa.gov/oact/babynames).',
    'IRS: dedução-padrão e faixas de 2026 (Rev. Proc. 2025-32, após o One Big Beautiful Bill Act); isenção do estate tax de US$ 15 milhões (2026).',
    'US Department of Labor, Unemployment Insurance (duração e reposição típicas por estado).',
    'Constituição dos EUA, art. I §§2–3 (idade e mandato de deputados e senadores); 17ª Emenda (eleição direta de senadores).',
    'Uniform Probate Code (Uniform Law Commission), §§2-102, 2-103, 2-105, 2-106, 2-202.',
    'US Census Bureau: Poverty in the United States 2023; Census 2020 (origem hispânica); sobrenomes frequentes (2010).',
    'BEA, Regional Price Parities by State (2023).',
    'College Board, Trends in College Pricing (2025); Federal Student Aid (Pell Grant, Direct Loans).',
    'Students for Fair Admissions v. Harvard, 600 U.S. 181 (2023).',
    'Selective Service System (sss.gov): registro obrigatório, sem convocação desde 1973.',
    'US Soccer Federation, Professional League Standards (MLS, USL Championship, USL League One); USL League Two.',
    'KFF, Employer Health Benefits Survey (2025).',
    'ILO, Women and Men in the Informal Economy (3ª ed., 2018).'
  ]
};

/* ============================================================== CANADÁ */

/*
 * SUCESSÃO — CANADÁ (direito provincial; referência: Ontário, a maior
 * província, Succession Law Reform Act, R.S.O. 1990, c. S.26, e Family Law
 * Act, R.S.O. 1990, c. F.3; o Quebec segue o Code civil du Québec):
 *  - liberdade de testar: não há legítima; dependentes desamparados podem
 *    pedir sustento ao juiz (SLRA, Parte V) — fica fora do jogo;
 *  - sem testamento (SLRA ss. 44–47): o cônjuge recebe uma parte
 *    preferencial (CA$ 350 mil) e divide o resto com os filhos (metade com um
 *    filho, um terço com mais); sem filhos, herda TUDO, mesmo com pais vivos;
 *  - representação (s. 47) e irmãos na falta de pais (s. 47(4));
 *  - o cônjuge pode optar pela "equalização" do patrimônio familiar (FLA
 *    ss. 5–6) — metade do que o casal acumulou no casamento —; no Quebec, o
 *    "patrimoine familial" (C.c.Q., arts. 414 ss.) é dividido igualmente.
 *    Por isso meacao: true;
 *  - sem herdeiros, os bens vão para a Coroa provincial (Escheats Act).
 * SIMPLIFICAÇÕES DECLARADAS: o Quebec dá ao cônjuge 1/3 com descendentes e
 * 2/3 com os pais (C.c.Q. arts. 666, 672); o perfil segue Ontário. Não há
 * imposto sobre herança; o custo é o imposto sobre o ganho de capital
 * realizado na morte ("deemed disposition", Income Tax Act s. 70) e a taxa de
 * homologação provincial (Ontário: 1,5% acima de CA$ 50 mil) — média ~4%.
 */

export const CANADA: PerfilDePais = {
  id: 'CA',
  gentilico: ['canadense', 'canadense'],
  idiomas: ['inglês', 'francês'],
  divisao: {
    tipo: ['província', 'províncias'],
    // Custo de moradia muito mais alto na Colúmbia Britânica e em Ontário (CMHC);
    // salários mais altos em Alberta (Statistics Canada, salário médio semanal por província).
    lista: [
      { codigo: 'ON', nome: 'Ontário', custo: 1.1, salario: 1.05 },
      { codigo: 'QC', nome: 'Quebec', custo: 0.95, salario: 0.95 },
      { codigo: 'BC', nome: 'Colúmbia Britânica', custo: 1.15, salario: 1.05 },
      { codigo: 'AB', nome: 'Alberta', custo: 1.0, salario: 1.1 },
      { codigo: 'MB', nome: 'Manitoba', custo: 0.9, salario: 0.9 },
      { codigo: 'SK', nome: 'Saskatchewan', custo: 0.9, salario: 0.95 },
      { codigo: 'NS', nome: 'Nova Escócia', custo: 0.9, salario: 0.85 }
    ]
  },
  cidades: [
    ['Toronto', 'ON', 'metropole', 'sede|litoral'],
    ['Montreal', 'QC', 'metropole', 'litoral'],
    ['Vancouver', 'BC', 'metropole', 'litoral'],
    ['Ottawa', 'ON', 'polo', 'capital'],
    ['Calgary', 'AB', 'polo'],
    ['Edmonton', 'AB', 'capital', 'sede'],
    ['Quebec', 'QC', 'capital', 'sede|litoral'],
    ['Winnipeg', 'MB', 'capital', 'sede'],
    ['Halifax', 'NS', 'capital', 'sede|litoral'],
    ['Mississauga', 'ON', 'metropolitana', 'metro:Toronto|litoral'],
    ['Hamilton', 'ON', 'polo', 'litoral'],
    ['Saskatoon', 'SK', 'polo'],
    ['Rimouski', 'QC', 'pequena', 'litoral']
  ],
  economia: {
    // Pobreza pela Market Basket Measure ~10% (Statistics Canada, 2023), Gini ~0,31:
    // distribuição mais comprimida que a americana. Pesos: 10/24/26/28/12.
    classes: { vulneravel: 10, trabalhadora: 24, media_baixa: 26, media: 28, alta: 12 },
    // Moradia entre as mais caras da OCDE em relação à renda (Toronto, Vancouver).
    moradia: 1.55,
    // Sem mínimo nacional: cada província fixa o seu (CA$ 15–18/h em 2026); o
    // federal (CA$ 18,15/h desde 1º/4/2026) vale só para setores sob jurisdição
    // federal (bancos, telecom, transporte interprovincial). Omitido.
    // informalidade: sem série da OIT; estimativa conservadora (autônomos sem registro).
    informalidade: 0.12,
    inflacao: 0.024,
    volatilidade: 0.6
  },
  trabalho: {
    // O "vacation pay" (4%) é pago dentro do salário; não há 13º.
    mesesPagos: 12,
    // CPP 5,95% até o YMPE (CA$ 74.600/ano em 2026) + seguro-emprego 1,63%; acima
    // do YMPE, o CPP2 (4%) até CA$ 85 mil. Teto ≈ CA$ 6.215/mês. (Quebec: RRQ e RQAP.)
    contribuicao: { aliquota: [0.0758, 0.0758], teto: 6215 },
    // Basic personal amount federal 2026 ≈ CA$ 16.450/ano (≈ CA$ 1.370/mês);
    // primeira faixa federal 14% + provincial ~5–10%: típica ~22%.
    impostoRenda: { isencao: 1370, aliquota: 0.22 },
    // Ontário (Employment Standards Act): aviso/indenização de 1 semana por ano
    // (até 8) e, em empregadores grandes, "severance pay" de 1 semana por ano.
    // O direito comum ("reasonable notice") costuma dar mais — o perfil fica no piso legal.
    rescisao: { nome: 'aviso prévio e indenização por tempo de casa (termination/severance pay)', mesesPorAno: 0.3 },
    // Employment Insurance: 55% do salário segurável, de 14 a 45 semanas.
    seguroDesemprego: { meses: 6, reposicao: 0.55 },
    // CPP aos 65 (de 60 a 70) + Old Age Security aos 65 (10 anos de residência
    // após os 18); juntos repõem ~40% do salário médio.
    previdencia: { idade: [65, 65], anos: [10, 10], reposicao: 0.4, nome: 'CPP e Old Age Security' },
    // Seleção por mérito com candidatura e testes (Public Service Commission), sem o concurso como porta única.
    concurso: false,
    contratoFormal: 'emprego registrado na folha (com T4)'
  },
  educacao: {
    etapas: {
      fundamental: 'escola primária', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'a creche subsidiada', fundamental: 'a escola pública do bairro', medio: 'a escola secundária pública' }
    },
    // Não há exame nacional: as universidades admitem pelas notas do último ano
    // do secundário (no Quebec, a "cote R" do CEGEP). O "exame" do jogo é o boletim.
    ingresso: 'candidatura',
    exame: { nome: 'boletim do último ano', artigo: 'o' },
    // Quase todas as universidades são públicas; anuidade média de graduação
    // ~CA$ 7,4 mil (Statistics Canada, 2024/25).
    publicaCobra: 0.35,
    bolsa: { nome: 'Canada Student Grant', teto: 1.5 },
    credito: { nome: 'Canada Student Loan' },
    cotas: false,
    privadaComum: false
  },
  politica: {
    sistema: 'monarquia constitucional parlamentarista federal',
    // Senado nomeado (não eleito) e premiês provinciais escolhidos pelo parlamento:
    // senador e governador não existem como degraus eleitos.
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'o conselho municipal' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 18, casa: 'a prefeitura' },
      deputado_estadual: { titulo: ['deputado provincial', 'deputada provincial'], anos: 4, idade: 18, casa: 'a Assembleia Legislativa da província' },
      deputado_federal: { titulo: ['deputado federal', 'deputada federal'], anos: 4, idade: 18, casa: 'a Câmara dos Comuns' }
    },
    // Federal: última em 28/4/2025; data fixa seguinte em outubro de 2029 (Canada
    // Elections Act, s. 56.1). Municipais de Ontário e Colúmbia Britânica: outubro de 2026.
    eleicoes: { local: [2026, 4], geral: [2029, 4] },
    mes: 9,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 17,
    forcas: { exercito: 'o Exército Canadense', marinha: 'a Marinha Real Canadense', aeronautica: 'a Força Aérea Real Canadense' },
    policia: 'a polícia municipal'
  },
  esporte: {
    // Hóquei (fora do jogo) domina; futebol é o esporte mais praticado na juventude;
    // natação e basquete fortes; vôlei escolar e universitário (U Sports).
    popularidade: { futebol: 0.95, volei: 0.95, basquete: 1.05, natacao: 1.15, atletismo: 1.0, lutas: 0.9, tenis: 1.05 },
    // A Canadian Premier League é a 1ª divisão nacional; os três clubes canadenses
    // da MLS (liga binacional) são a elite de fato. League1 Canada: pró-amadora.
    divisoes: ['ligas provinciais', 'League1 Canada', 'Canadian Premier League', 'MLS'],
    clubes: [
      { nome: 'Toronto FC', artigo: 'o', porte: 'grande', cidade: 'Toronto' },
      { nome: 'CF Montréal', artigo: 'o', porte: 'grande', cidade: 'Montreal' },
      { nome: 'Vancouver Whitecaps', artigo: 'o', porte: 'grande', cidade: 'Vancouver' },
      { nome: 'Forge FC', artigo: 'o', porte: 'tradicional', cidade: 'Hamilton' },
      { nome: 'Cavalry FC', artigo: 'o', porte: 'tradicional', cidade: 'Calgary' },
      { nome: 'Atlético Ottawa', artigo: 'o', porte: 'tradicional', cidade: 'Ottawa' },
      { nome: 'HFX Wanderers', artigo: 'o', porte: 'tradicional', cidade: 'Halifax' },
      { nome: 'York United', artigo: 'o', porte: 'tradicional', cidade: 'Toronto' },
      { nome: 'Valour FC', artigo: 'o', porte: 'tradicional', cidade: 'Winnipeg' },
      { nome: 'Sigma FC', artigo: 'o', porte: 'regional', cidade: 'Mississauga' },
      { nome: 'CS Mont-Royal Outremont', artigo: 'o', porte: 'regional', cidade: 'Montreal' }
    ]
  },
  // Canada Health Act: cobertura pública universal provincial; o plano privado cobre
  // remédios, dentista e óculos (complementar).
  saude: { sistema: 'universal', redePublica: 'o sistema público provincial (Medicare)', custoPlano: 1.3 },
  // Imigração por pontos (Express Entry) e programas provinciais.
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'CA',
    nome: 'Canadá',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1, 1],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.04,
    rotuloCusto: 'imposto sobre o ganho de capital na morte e taxa de homologação (probate)',
    vacancia: 'a Coroa (o governo provincial)'
  },
  nomes: {
    cortes: [1975, 2005],
    neutros: ['Alex', 'Jordan', 'Taylor', 'Riley', 'Morgan', 'Charlie', 'Sam', 'Quinn', 'Rowan', 'Dominique', 'Camille', 'Claude'],
    grupos: [
      {
        // Nomes: estatísticas de nascimentos de Ontário, Colúmbia Britânica e Alberta
        // (Service Ontario, BC Vital Statistics, Alberta Top Baby Names).
        id: 'ca_anglo',
        peso: 0.78,
        divisoes: ['ON', 'BC', 'AB', 'MB', 'SK', 'NS'],
        sobrenome: 'um',
        masc: {
          antiga: ['John', 'Robert', 'David', 'William', 'James', 'Michael', 'Richard', 'Donald', 'Ronald', 'Douglas', 'Kenneth', 'Gordon', 'Brian', 'Gary', 'Wayne', 'Bruce', 'Peter', 'Paul', 'George', 'Stephen',
            'Ian', 'Allan', 'Murray', 'Gerald', 'Keith', 'Larry', 'Dennis', 'Terry', 'Glen', 'Ross'],
          meio: ['Michael', 'Matthew', 'Christopher', 'Ryan', 'Jason', 'Andrew', 'Kevin', 'Tyler', 'Justin', 'Brandon', 'Daniel', 'Jordan', 'Adam', 'Mark', 'Scott', 'Jeffrey', 'Kyle', 'Cody', 'Shawn', 'Derek',
            'Graham', 'Trevor', 'Curtis', 'Brent', 'Darren', 'Colin', 'Jesse', 'Dustin', 'Nathan', 'Sean'],
          nova: ['Noah', 'Liam', 'Oliver', 'Lucas', 'Benjamin', 'Theodore', 'Leo', 'William', 'Jack', 'Ethan', 'Henry', 'James', 'Hudson', 'Logan', 'Owen', 'Jacob', 'Levi', 'Lincoln', 'Arjun', 'Muhammad',
            'Ryan', 'Jaxon', 'Hunter', 'Wyatt', 'Elijah', 'Aiden', 'Mason', 'Ezra', 'Daniel', 'Samuel']
        },
        fem: {
          antiga: ['Mary', 'Linda', 'Susan', 'Patricia', 'Barbara', 'Margaret', 'Elizabeth', 'Joan', 'Judith', 'Carol', 'Donna', 'Sandra', 'Brenda', 'Debbie', 'Wendy', 'Lorraine', 'Shirley', 'Heather', 'Janet', 'Kathleen',
            'Diane', 'Karen', 'Sharon', 'Doris', 'Joyce', 'Marilyn', 'Gail', 'Bonnie', 'Cheryl', 'Darlene'],
          meio: ['Jennifer', 'Jessica', 'Sarah', 'Amanda', 'Melissa', 'Stephanie', 'Ashley', 'Nicole', 'Lisa', 'Michelle', 'Kimberly', 'Emily', 'Lauren', 'Megan', 'Rebecca', 'Laura', 'Tara', 'Erin', 'Kristen', 'Kelly',
            'Courtney', 'Brittany', 'Samantha', 'Chelsea', 'Danielle', 'Natalie', 'Kaitlyn', 'Amy', 'Andrea', 'Crystal'],
          nova: ['Olivia', 'Charlotte', 'Amelia', 'Emma', 'Sophia', 'Ava', 'Chloe', 'Evelyn', 'Mia', 'Hazel', 'Isla', 'Ellie', 'Lily', 'Nora', 'Abigail', 'Avery', 'Harper', 'Maya', 'Scarlett', 'Aria',
            'Sophie', 'Eleanor', 'Violet', 'Willow', 'Emily', 'Zoe', 'Hannah', 'Sienna', 'Grace', 'Aurora']
        },
        sobrenomes: [
          'Smith', 'Brown', 'Wilson', 'Taylor', 'Campbell', 'Anderson', 'Johnson', 'Thompson', 'MacDonald', 'Martin',
          'Lee', 'Williams', 'Jones', 'Miller', 'White', 'Clark', 'Young', 'Scott', 'Stewart', 'Wright',
          'Robinson', 'Walker', 'Reid', 'Ross', 'Murray', 'Fraser', 'Mitchell', 'Graham', 'Morrison', 'MacLeod',
          'Kelly', 'Ryan', 'Murphy', 'Hall', 'Allen', 'King', 'Bell', 'Wong', 'Chen', 'Li',
          'Singh', 'Gill', 'Sandhu', 'Patel', 'Nguyen', 'Kim', 'Kowalczyk', 'Friesen', 'Rossi', 'Santos'
        ]
      },
      {
        // Quebec: Retraite Québec, "Banque de noms de bébés"; sobrenomes mais
        // frequentes do Quebec (Institut de la statistique du Québec).
        id: 'ca_franco',
        peso: 0.22,
        divisoes: ['QC'],
        sobrenome: 'um',
        masc: {
          antiga: ['Jean', 'Pierre', 'Michel', 'André', 'Claude', 'Jacques', 'Gilles', 'Réjean', 'Gaétan', 'Denis', 'Normand', 'Roger', 'Marcel', 'Guy', 'Robert', 'Yvon', 'Serge', 'Gilbert', 'Raymond', 'Daniel',
            'Alain', 'Luc', 'Richard', 'Mario', 'Réal', 'Gérard', 'Lucien', 'Fernand', 'Jean-Guy', 'Maurice'],
          meio: ['Mathieu', 'Maxime', 'David', 'Simon', 'Jonathan', 'Alexandre', 'Martin', 'Sébastien', 'Patrick', 'Éric', 'Stéphane', 'Frédéric', 'Marc-André', 'Jean-François', 'Philippe', 'Vincent', 'Guillaume', 'Nicolas', 'Samuel', 'Olivier',
            'Kevin', 'Jérémie', 'Francis', 'Michaël', 'Pascal', 'Dominic', 'Sylvain', 'Steve', 'Yannick', 'Charles'],
          nova: ['Liam', 'William', 'Noah', 'Thomas', 'Jacob', 'Léo', 'Nathan', 'Édouard', 'Logan', 'Arthur', 'Félix', 'Raphaël', 'Charles', 'Émile', 'Olivier', 'Benjamin', 'Zack', 'Louis', 'Samuel', 'Théo',
            'Jules', 'Antoine', 'Henri', 'Hubert', 'Victor', 'Lucas', 'Alexis', 'Adam', 'Elliot', 'Gabriel']
        },
        fem: {
          antiga: ['Marie', 'Lise', 'Diane', 'Nicole', 'Louise', 'Francine', 'Ginette', 'Johanne', 'Suzanne', 'Monique', 'Carole', 'Danielle', 'Lucie', 'Sylvie', 'Jocelyne', 'Pierrette', 'Thérèse', 'Huguette', 'Denise', 'Micheline',
            'Claudette', 'Colette', 'Gisèle', 'Rita', 'Jeannine', 'Lorraine', 'Hélène', 'Céline', 'Manon', 'Line'],
          meio: ['Mélanie', 'Isabelle', 'Julie', 'Stéphanie', 'Marie-Ève', 'Valérie', 'Catherine', 'Annie', 'Karine', 'Geneviève', 'Véronique', 'Émilie', 'Audrey', 'Caroline', 'Vanessa', 'Jessica', 'Mélissa', 'Sarah', 'Joanie', 'Andréanne',
            'Marie-Pier', 'Josée', 'Nathalie', 'Sophie', 'Amélie', 'Kim', 'Myriam', 'Chantal', 'Marie-Claude', 'Maude'],
          nova: ['Emma', 'Charlie', 'Florence', 'Olivia', 'Alice', 'Léa', 'Charlotte', 'Livia', 'Rosalie', 'Juliette', 'Béatrice', 'Zoé', 'Mia', 'Chloé', 'Romy', 'Lily', 'Victoria', 'Clara', 'Élodie', 'Laurence',
            'Camille', 'Jade', 'Anaïs', 'Maëlie', 'Mila', 'Laurie', 'Éva', 'Margot', 'Adèle', 'Billie']
        },
        sobrenomes: [
          'Tremblay', 'Gagnon', 'Roy', 'Côté', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie', 'Fortin', 'Gagné',
          'Ouellet', 'Pelletier', 'Bélanger', 'Lévesque', 'Bergeron', 'Leblanc', 'Paquette', 'Girard', 'Simard', 'Boucher',
          'Caron', 'Beaulieu', 'Cloutier', 'Dubé', 'Poirier', 'Fournier', 'Lapointe', 'Leclerc', 'Lefebvre', 'Poulin',
          'Thibault', 'St-Pierre', 'Nadeau', 'Martin', 'Landry', 'Martel', 'Bédard', 'Grenier', 'Lessard', 'Bernier',
          'Richard', 'Michaud', 'Hébert', 'Desjardins', 'Nguyen', 'Joseph', 'Haddad', 'Pierre'
        ]
      }
    ]
  },
  fontes: [
    'Employment and Social Development Canada: salário mínimo federal (CA$ 18,15/h a partir de 1º/4/2026) e mínimos provinciais.',
    'Canada Revenue Agency: CPP 2026 (5,95%, YMPE CA$ 74.600, YAMPE CA$ 85.000), EI 2026 (1,63%), basic personal amount e faixas federais de 2026.',
    'Employment Standards Act, 2000 (Ontário), Parte XV (termination and severance); Employment Insurance Act.',
    'Service Canada: Canada Pension Plan e Old Age Security (idade, residência mínima).',
    'Constitution Act, 1867, ss. 24 e 37 (Senado nomeado; Câmara dos Comuns); Canada Elections Act, s. 56.1 (data fixa).',
    'Succession Law Reform Act (Ontário), ss. 44–47; Family Law Act (Ontário), ss. 5–6; Code civil du Québec, arts. 414 ss., 666 ss.; Income Tax Act, s. 70(5).',
    'Statistics Canada: Market Basket Measure (pobreza, 2023); anuidades universitárias (2024/25); salário médio por província.',
    'Canada Health Act (1985).',
    'Retraite Québec, Banque de noms de bébés; Institut de la statistique du Québec; Service Ontario e BC Vital Statistics (nomes populares).',
    'Canada Soccer: Canadian Premier League (1ª divisão sancionada) e League1 Canada.'
  ]
};

/* ============================================================== MÉXICO */

/*
 * SUCESSÃO — MÉXICO (direito estadual; referência: Código Civil Federal e o
 * Código Civil para el Distrito Federal, hoje da Cidade do México, que os
 * estados seguem de perto):
 *  - liberdade de testar (CCF art. 1295 e ss.), com o dever de deixar
 *    alimentos a filhos menores, cônjuge e dependentes (art. 1368) — sem
 *    legítima em sentido estrito;
 *  - sem testamento: os filhos herdam por partes iguais (art. 1607); o
 *    cônjuge concorre com eles com a parte de um filho, se não tiver bens
 *    próprios (art. 1624); com os ascendentes, metade para o cônjuge e metade
 *    para eles (art. 1626);
 *  - representação: netos herdam por estirpe (art. 1609);
 *  - colaterais até o quarto grau (art. 1634); na falta de todos, a
 *    Beneficência Pública (art. 1636);
 *  - regime de bens: o casal escolhe ao casar; a "sociedad conyugal" é o mais
 *    comum e o supletivo em vários estados — a meação existe.
 * SIMPLIFICAÇÕES DECLARADAS: o dever de alimentos não vira legítima no jogo; a
 * condição "se não tiver bens próprios" do art. 1624 não é testada. Não há
 * imposto sobre herança (heranças são isentas de ISR, LISR art. 93, XXII);
 * o custo médio é o do notário, do juicio sucesorio e do imposto local de
 * aquisição de imóveis onde se cobra (~3%).
 */

/** Nomes próprios mexicanos: a mesma lista para o país todo. */
const MX_MASC = {
  antiga: ['José', 'Juan', 'Jesús', 'Francisco', 'Antonio', 'Manuel', 'Pedro', 'Miguel', 'Javier', 'Jorge', 'Rafael', 'Ramón', 'Roberto', 'Salvador', 'Alfredo', 'Fernando', 'Arturo', 'Raúl', 'Enrique', 'Guillermo',
    'Sergio', 'Gerardo', 'Rubén', 'Felipe', 'Ignacio', 'Alberto', 'Ricardo', 'Carlos', 'Luis', 'Mario', 'Héctor', 'Armando', 'Joaquín', 'Agustín', 'Pablo'],
  meio: ['José Luis', 'Juan Carlos', 'Luis', 'Carlos', 'Jorge', 'Alejandro', 'Miguel Ángel', 'Eduardo', 'Ricardo', 'Daniel', 'Fernando', 'Óscar', 'Víctor', 'David', 'Francisco Javier', 'Sergio', 'Jesús', 'Arturo', 'Iván', 'Omar',
    'Alberto', 'Christian', 'Édgar', 'Erick', 'Ulises', 'Gustavo', 'Pablo', 'Rodrigo', 'Israel', 'Adrián', 'Hugo', 'Juan Manuel', 'Marco Antonio', 'Raúl', 'Enrique'],
  nova: ['Santiago', 'Mateo', 'Sebastián', 'Leonardo', 'Matías', 'Emiliano', 'Diego', 'Miguel Ángel', 'Daniel', 'Alexander', 'Iker', 'Gael', 'Ángel', 'Dylan', 'Liam', 'Alejandro', 'Maximiliano', 'Rodrigo', 'Thiago', 'Luis Ángel',
    'Jesús', 'Valentín', 'Eduardo', 'Leonel', 'Kevin', 'Aarón', 'Isaac', 'Joshua', 'Emmanuel', 'Axel', 'Julián', 'Tadeo', 'Bruno', 'Ian', 'Nicolás']
};
const MX_FEM = {
  antiga: ['María', 'Guadalupe', 'Juana', 'Margarita', 'Josefina', 'Rosa', 'Teresa', 'Carmen', 'Ana', 'Leticia', 'Patricia', 'Elena', 'Silvia', 'Martha', 'Gloria', 'Alicia', 'Rosario', 'Socorro', 'Dolores', 'Irma',
    'Yolanda', 'Graciela', 'Lucía', 'Esperanza', 'Consuelo', 'Catalina', 'Francisca', 'Concepción', 'Ofelia', 'Beatriz', 'Elvira', 'Rocío', 'Amparo', 'Virginia', 'Estela'],
  meio: ['María Guadalupe', 'Verónica', 'Claudia', 'Adriana', 'Gabriela', 'Alejandra', 'Mónica', 'Karla', 'Elizabeth', 'Laura', 'Diana', 'Leticia', 'Erika', 'Araceli', 'Sandra', 'Lorena', 'Norma', 'Liliana', 'Brenda', 'Fabiola',
    'Karina', 'Paola', 'Rocío', 'Mariana', 'Daniela', 'Andrea', 'Itzel', 'Yesenia', 'Jazmín', 'Nayeli', 'Angélica', 'Maribel', 'Susana', 'Cecilia', 'Ana Laura'],
  nova: ['Sofía', 'Valentina', 'Regina', 'Ximena', 'Camila', 'María José', 'Valeria', 'Renata', 'Victoria', 'Isabella', 'Natalia', 'Fernanda', 'Romina', 'Daniela', 'Mía', 'Andrea', 'Paula', 'Danna', 'Alexa', 'Abril',
    'Emilia', 'Luciana', 'Mariana', 'Guadalupe', 'Zoe', 'Aitana', 'Montserrat', 'Itzel', 'Ivanna', 'Luna', 'Julieta', 'Elena', 'Fátima', 'Allison', 'Ana Sofía']
};
const MX_SOBRENOMES = [
  'Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz',
  'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Gutiérrez', 'Ruiz',
  'Mendoza', 'Aguilar', 'Ortiz', 'Moreno', 'Castillo', 'Romero', 'Álvarez', 'Méndez', 'Chávez', 'Rivera',
  'Juárez', 'Ramos', 'Domínguez', 'Herrera', 'Medina', 'Castro', 'Vargas', 'Guzmán', 'Velázquez', 'Muñoz',
  'Rojas', 'Contreras', 'Salazar', 'Luna', 'Ortega', 'Santiago', 'Guerrero', 'Estrada', 'Bautista', 'Cortés'
];

export const MEXICO: PerfilDePais = {
  id: 'MX',
  gentilico: ['mexicano', 'mexicana'],
  idiomas: ['espanhol'],
  divisao: {
    tipo: ['estado', 'estados'],
    // Renda média por entidade (INEGI, ENOE/ENIGH 2024): Cidade do México, Nuevo
    // León e Baja California no alto; Michoacán, Veracruz e Hidalgo abaixo da média.
    lista: [
      { codigo: 'CMX', nome: 'Cidade do México', custo: 1.2, salario: 1.25 },
      { codigo: 'JAL', nome: 'Jalisco', custo: 1.05, salario: 1.05 },
      { codigo: 'NLE', nome: 'Nuevo León', custo: 1.15, salario: 1.25 },
      { codigo: 'MEX', nome: 'Estado de México', custo: 1.0, salario: 0.95 },
      { codigo: 'PUE', nome: 'Puebla', custo: 0.95, salario: 0.85 },
      { codigo: 'YUC', nome: 'Yucatán', custo: 0.95, salario: 0.9 },
      { codigo: 'BCN', nome: 'Baja California', custo: 1.1, salario: 1.15 },
      { codigo: 'GUA', nome: 'Guanajuato', custo: 0.95, salario: 0.95 },
      { codigo: 'COA', nome: 'Coahuila', custo: 1.0, salario: 1.05 },
      { codigo: 'HID', nome: 'Hidalgo', custo: 0.9, salario: 0.85 },
      { codigo: 'VER', nome: 'Veracruz', custo: 0.9, salario: 0.8 },
      { codigo: 'MIC', nome: 'Michoacán', custo: 0.85, salario: 0.8 }
    ]
  },
  cidades: [
    ['Cidade do México', 'CMX', 'metropole', 'capital|sede'],
    ['Guadalajara', 'JAL', 'metropole', 'sede'],
    ['Monterrey', 'NLE', 'metropole', 'sede'],
    ['Zapopan', 'JAL', 'metropolitana', 'metro:Guadalajara'],
    ['Toluca', 'MEX', 'capital', 'sede'],
    ['Puebla', 'PUE', 'capital', 'sede'],
    ['Mérida', 'YUC', 'capital', 'sede'],
    ['Pachuca', 'HID', 'capital', 'sede'],
    ['Tijuana', 'BCN', 'polo', 'litoral'],
    ['León', 'GUA', 'polo'],
    ['Torreón', 'COA', 'polo'],
    ['Veracruz', 'VER', 'polo', 'litoral'],
    ['Pátzcuaro', 'MIC', 'pequena', 'litoral']
  ],
  economia: {
    // CONEVAL/INEGI (2024): pobreza multidimensional ~29,6%, extrema ~5,3%; Gini
    // ~0,40–0,43. Base parecida com a brasileira, topo um pouco menor. Pesos: 24/33/22/15/6.
    classes: { vulneravel: 24, trabalhadora: 33, media_baixa: 22, media: 15, alta: 6 },
    // Aluguel um pouco mais barato que no Brasil em relação ao resto (fora das zonas
    // centrais da Cidade do México).
    moradia: 0.9,
    // CONASAMI 2026: MX$ 315,04/dia (zona geral) × 30,4 = MX$ 9.582,47/mês. Na Zona
    // Libre de la Frontera Norte, MX$ 440,87/dia — não modelado.
    salarioMinimo: 9582.47,
    // INEGI, ENOE (2025): ~55% dos ocupados na informalidade.
    informalidade: 0.55,
    inflacao: 0.04,
    volatilidade: 0.9
  },
  trabalho: {
    // Aguinaldo de 15 dias (LFT art. 87) + prima vacacional de 25% sobre 12 dias de
    // férias (arts. 76 e 80, reforma de 2023): ~12,6 salários por ano.
    mesesPagos: 12.6,
    // Cota obreira do IMSS (doença, invalidez, cesantía e velhice) ~2,5–3% do salário
    // de contribuição, com teto de 25 UMA (UMA 2026: MX$ 117,31/dia → ~MX$ 89 mil/mês).
    contribuicao: { aliquota: [0.025, 0.03], teto: 89150 },
    // ISR: o subsídio para o emprego zera o imposto perto do mínimo; a faixa típica
    // do assalariado formal é 16–18%.
    impostoRenda: { isencao: 10000, aliquota: 0.18 },
    // Demissão injustificada: 3 meses de salário (Constituição art. 123, XXII; LFT
    // art. 50) + prima de antigüedad de 12 dias por ano (art. 162). Abstraído como
    // ~0,9 salário por ano de casa numa permanência média.
    rescisao: { nome: 'liquidação (três meses e prima de antigüedad)', mesesPorAno: 0.9 },
    // Não há seguro-desemprego federal (só o da Cidade do México); omitido.
    // Ley del Seguro Social de 1997 (Afore): 65 anos; semanas mínimas subindo de 750
    // (2021) a 1.000 (2031) — ~875 em 2026 (~17 anos). Fondo de Pensiones para el
    // Bienestar (2024) complementa as menores; reposição típica ~50%.
    previdencia: { idade: [65, 65], anos: [17, 17], reposicao: 0.5, nome: 'IMSS (Afore)' },
    // Ley del Servicio Profesional de Carrera (2003): ingresso por concurso público na
    // administração federal; professores pelo processo de admissão da USICAMM.
    concurso: true,
    contratoFormal: 'emprego com registro no IMSS'
  },
  educacao: {
    etapas: {
      fundamental: 'primária e secundária', medio: 'preparatória', serieMedio: 'ano',
      publica: { creche: 'a guardería do IMSS', fundamental: 'a escola pública', medio: 'a preparatória pública' }
    },
    // Cada universidade aplica seu exame (UNAM, IPN; muitas usam o EXANI-II do CENEVAL);
    // não há exame nacional único que classifique para todas.
    ingresso: 'candidatura',
    exame: { nome: 'EXANI-II', artigo: 'o' },
    // UNAM e IPN: anuidade simbólica; estaduais com taxas baixas.
    publicaCobra: 0.05,
    bolsa: { nome: 'Jóvenes Escribiendo el Futuro', teto: 1 },
    cotas: false,
    // ~35% da matrícula superior é privada (SEP, Formato 911).
    privadaComum: true
  },
  politica: {
    sistema: 'república presidencialista federal',
    // Constituição: arts. 55 (deputado, 21 anos, mandato de 3), 56 e 58 (senador, 25, 6),
    // 115 (ayuntamientos de 3 anos), 116 (governador, 6 anos, idade mínima de 30 na maioria
    // dos estados). Reeleição consecutiva de legisladores e presidentes municipais desde 2014.
    cargos: {
      vereador: { titulo: ['regidor', 'regidora'], anos: 3, idade: 18, casa: 'o ayuntamiento' },
      prefeito: { titulo: ['presidente municipal', 'presidenta municipal'], anos: 3, idade: 21, casa: 'a presidência municipal' },
      deputado_estadual: { titulo: ['deputado local', 'deputada local'], anos: 3, idade: 21, casa: 'o Congresso do estado' },
      deputado_federal: { titulo: ['deputado federal', 'deputada federal'], anos: 3, idade: 21, casa: 'a Câmara dos Deputados' },
      senador: { titulo: ['senador', 'senadora'], anos: 6, idade: 25, casa: 'o Senado da República' },
      governador: { titulo: ['governador', 'governadora'], anos: 6, idade: 30, casa: 'o governo do estado' }
    },
    // Eleições concorrentes (federais intermediárias e locais) em junho de 2027;
    // presidenciais a cada 6 anos (2024, 2030).
    eleicoes: { local: [2027, 3], geral: [2027, 3] },
    mes: 5,
    // O voto é "obrigação" do cidadão (art. 36), mas sem sanção: tratado como facultativo.
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Serviço Militar Nacional obrigatório para homens aos 18 (cartilla), com sorteio
    // que define quem faz instrução (Ley del Servicio Militar).
    servico: 'seletivo',
    idade: 18,
    forcas: { exercito: 'o Exército Mexicano', marinha: 'a Armada do México', aeronautica: 'a Força Aérea Mexicana' },
    policia: 'a polícia municipal'
  },
  esporte: {
    // Futebol dominante; boxe com tradição mundial (e lucha libre); marcha atlética
    // com história olímpica; beisebol (fora do jogo) forte no norte.
    popularidade: { futebol: 1.4, volei: 0.8, basquete: 0.85, natacao: 0.75, atletismo: 0.85, lutas: 1.3, tenis: 0.7 },
    divisoes: ['Liga TDP', 'Liga Premier', 'Liga de Expansión MX', 'Liga MX'],
    clubes: [
      { nome: 'América', artigo: 'o', porte: 'grande', cidade: 'Cidade do México' },
      { nome: 'Cruz Azul', artigo: 'o', porte: 'grande', cidade: 'Cidade do México' },
      { nome: 'Pumas UNAM', artigo: 'os', porte: 'grande', cidade: 'Cidade do México' },
      { nome: 'Guadalajara (Chivas)', artigo: 'o', porte: 'grande', cidade: 'Zapopan' },
      { nome: 'Monterrey', artigo: 'o', porte: 'grande', cidade: 'Monterrey' },
      { nome: 'Tigres UANL', artigo: 'os', porte: 'grande', cidade: 'Monterrey' },
      { nome: 'Atlas', artigo: 'o', porte: 'tradicional', cidade: 'Guadalajara' },
      { nome: 'Toluca', artigo: 'o', porte: 'tradicional', cidade: 'Toluca' },
      { nome: 'Santos Laguna', artigo: 'o', porte: 'tradicional', cidade: 'Torreón' },
      { nome: 'Pachuca', artigo: 'o', porte: 'tradicional', cidade: 'Pachuca' },
      { nome: 'León', artigo: 'o', porte: 'tradicional', cidade: 'León' },
      { nome: 'Puebla', artigo: 'o', porte: 'tradicional', cidade: 'Puebla' },
      { nome: 'Tijuana', artigo: 'o', porte: 'tradicional', cidade: 'Tijuana' },
      { nome: 'Atlante', artigo: 'o', porte: 'regional', cidade: 'Cidade do México' },
      { nome: 'Venados', artigo: 'o', porte: 'regional', cidade: 'Mérida' }
    ]
  },
  // IMSS (formais), ISSSTE (servidores) e IMSS-Bienestar (sem seguridade social);
  // seguro privado de gastos médicos é minoritário.
  saude: { sistema: 'misto', redePublica: 'o IMSS', custoPlano: 0.9 },
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'MX',
    nome: 'México',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [0.5, 0.5],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.03,
    rotuloCusto: 'honorários do notário e custas do juicio sucesorio',
    vacancia: 'a Beneficência Pública'
  },
  nomes: {
    cortes: [1975, 2005],
    neutros: ['Guadalupe', 'Cruz', 'Alex', 'Ariel', 'Dana', 'Andy', 'Sol', 'Paris', 'Noa'],
    grupos: [
      {
        // Nomes: INEGI/RENAPO (registros de nascimento e nomes mais frequentes por
        // geração). Sobrenomes: RENAPO/INEGI, sobrenomes mais comuns.
        id: 'mx',
        peso: 0.97,
        sobrenome: 'dois',
        masc: MX_MASC,
        fem: MX_FEM,
        sobrenomes: MX_SOBRENOMES
      },
      {
        // Península de Yucatán: os mesmos nomes próprios, com a presença real de
        // sobrenomes de origem maia ao lado dos hispânicos (INEGI, Censo 2020: ~23%
        // da população de Yucatán fala maia).
        id: 'mx_yucatan',
        peso: 0.03,
        divisoes: ['YUC'],
        sobrenome: 'dois',
        masc: MX_MASC,
        fem: MX_FEM,
        sobrenomes: [
          'Pech', 'Chan', 'May', 'Canul', 'Uc', 'Poot', 'Tun', 'Dzul', 'Cauich', 'Euán',
          'Ku', 'Chi', 'Cen', 'Balam', 'Cocom', 'Puc', 'Can', 'Noh', 'Couoh', 'Kú',
          'Pérez', 'González', 'Hernández', 'López', 'Martínez', 'García', 'Sánchez', 'Gómez', 'Cervera', 'Peniche',
          'Cetina', 'Escalante', 'Rodríguez', 'Castillo', 'Medina', 'Novelo', 'Herrera', 'Díaz', 'Pacheco', 'Sosa'
        ]
      }
    ]
  },
  fontes: [
    'CONASAMI: salários mínimos de 2026 (DOF, dez/2025): MX$ 315,04/dia geral, MX$ 440,87/dia na ZLFN.',
    'INEGI: UMA 2026 (DOF 9/1/2026, MX$ 117,31/dia); ENOE (informalidade); Censo 2020 (línguas indígenas).',
    'Ley Federal del Trabajo, arts. 50, 76, 80, 87, 162; Constituição, art. 123.',
    'Ley del Seguro Social (1997) e reforma de 2020 (semanas de cotização); decreto do Fondo de Pensiones para el Bienestar (DOF 1/5/2024).',
    'Constitución Política de los Estados Unidos Mexicanos, arts. 36, 51–58, 115, 116.',
    'Código Civil Federal, arts. 1295, 1368, 1602–1636; Ley del ISR, art. 93.',
    'CONEVAL/INEGI: Medición de la pobreza 2024.',
    'Ley del Servicio Profesional de Carrera en la Administración Pública Federal (2003).',
    'Ley del Servicio Militar Nacional (sorteio).',
    'Federación Mexicana de Fútbol: Liga MX, Liga de Expansión MX, Liga Premier e Liga TDP.',
    'SEP, Principales cifras del sistema educativo (matrícula privada); CENEVAL (EXANI-II).'
  ]
};

export const PAISES: PerfilDePais[] = [ESTADOS_UNIDOS, CANADA, MEXICO];
