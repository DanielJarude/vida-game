/**
 * OCEANIA — Austrália e Nova Zelândia.
 *
 * Duas monarquias parlamentaristas de common law ligadas pelo Trans-Tasman
 * Travel Arrangement (cidadãos de um vivem e trabalham no outro). A Austrália
 * é federal e bicameral (Senado eleito); a Nova Zelândia é unitária e
 * unicameral. Fontes e abstrações: `docs/notas/FONTES-PAISES-AMERICA-NORTE-OCEANIA.md`.
 */

import type { PerfilDePais } from '../tipos';

/* =========================================================== AUSTRÁLIA */

/*
 * SUCESSÃO — AUSTRÁLIA (direito estadual; referência: Nova Gales do Sul,
 * Succession Act 2006 (NSW), base do modelo nacional de uniformização):
 *  - liberdade de testar: não há legítima; cônjuge, filhos e dependentes
 *    podem pedir "family provision" ao tribunal (Cap. 3) — fica fora do jogo;
 *  - sem testamento: o cônjuge herda TUDO se todos os filhos do falecido
 *    forem também seus (s. 112); se houver filhos de outra relação, recebe os
 *    bens pessoais, um legado legal e metade do resto (s. 113); sem filhos,
 *    herda tudo, mesmo com pais vivos (s. 111);
 *  - representação dos netos (s. 127) e irmãos na falta de pais (s. 129);
 *  - sem herdeiros, "bona vacantia" para a Coroa (o estado) (s. 136);
 *  - não há regime de comunhão: cada um é dono do que está em seu nome; a
 *    divisão de bens do Family Law Act 1975 vale na separação, não na morte.
 * SIMPLIFICAÇÕES DECLARADAS: o legado legal e a regra dos filhos de outra
 * relação viram "o cônjuge concorre com os descendentes"; a ação de family
 * provision não é modelada. Não há imposto sobre herança desde 1979; o custo
 * é o da homologação (probate) e advogados, ~2%.
 */

export const AUSTRALIA: PerfilDePais = {
  id: 'AU',
  // Regras legais: a carteira é ESTADUAL (L, P1/P2, plena — `REGRAS_DAS_DIVISOES`); escola até os 17 (abstração nacional).
  regras: { escolaObrigatoriaAte: 17, direcao: { aprendiz: { idade: 16, nome: 'licença de aprendiz (L)' }, provisoria: { idade: 17, nome: 'licença provisória (P)' }, plena: 20 } },
  gentilico: ['australiano', 'australiana'],
  idiomas: ['inglês'],
  divisao: {
    tipo: ['estado', 'estados'],
    // Estados e territórios (ACT e NT são territórios). Custo: aluguel muito acima
    // em Sydney (NSW) e alto em Camberra; renda alta no ACT e na Austrália Ocidental
    // (mineração) — ABS, Average Weekly Earnings e índices de aluguel.
    lista: [
      { codigo: 'NSW', nome: 'Nova Gales do Sul', custo: 1.15, salario: 1.0 },
      { codigo: 'VIC', nome: 'Vitória', custo: 1.0, salario: 0.97 },
      { codigo: 'QLD', nome: 'Queensland', custo: 0.97, salario: 0.95 },
      { codigo: 'WA', nome: 'Austrália Ocidental', custo: 1.0, salario: 1.1 },
      { codigo: 'SA', nome: 'Austrália Meridional', custo: 0.92, salario: 0.92 },
      { codigo: 'TAS', nome: 'Tasmânia', custo: 0.9, salario: 0.88 },
      { codigo: 'ACT', nome: 'Território da Capital Australiana', custo: 1.1, salario: 1.15 },
      { codigo: 'NT', nome: 'Território do Norte', custo: 1.0, salario: 1.05 }
    ]
  },
  cidades: [
    ['Sydney', 'NSW', 'metropole', 'sede|litoral'],
    ['Melbourne', 'VIC', 'metropole', 'sede|litoral'],
    ['Brisbane', 'QLD', 'metropole', 'sede|litoral'],
    ['Perth', 'WA', 'metropole', 'sede|litoral'],
    ['Adelaide', 'SA', 'capital', 'sede|litoral'],
    ['Camberra', 'ACT', 'capital', 'capital|sede'],
    ['Hobart', 'TAS', 'capital', 'sede|litoral'],
    ['Darwin', 'NT', 'capital', 'sede|litoral'],
    ['Parramatta', 'NSW', 'metropolitana', 'metro:Sydney'],
    ['Gold Coast', 'QLD', 'polo', 'litoral'],
    ['Newcastle', 'NSW', 'polo', 'litoral'],
    ['Geelong', 'VIC', 'polo', 'litoral'],
    ['Wollongong', 'NSW', 'polo', 'litoral'],
    ['Broken Hill', 'NSW', 'pequena']
  ],
  economia: {
    // Pobreza relativa ~13% (ACOSS/UNSW, 50% da mediana), Gini ~0,32–0,33 (ABS):
    // classe média larga, base pequena. Pesos: 10/24/27/28/11.
    classes: { vulneravel: 10, trabalhadora: 24, media_baixa: 27, media: 28, alta: 11 },
    // Moradia entre as mais caras do mundo em relação à renda (OCDE; Sydney e Melbourne).
    moradia: 1.6,
    // Fair Work Commission, Annual Wage Review 2025–26: A$ 1.004,90/semana (A$ 26,44/h)
    // a partir de 1º/7/2026 → × 52 / 12 = A$ 4.354,57/mês.
    salarioMinimo: 4354.57,
    // Sem série da OIT; estimativa conservadora (trabalho não declarado).
    informalidade: 0.1,
    inflacao: 0.03,
    volatilidade: 0.7
  },
  trabalho: {
    // O "leave loading" de 17,5% existe em muitos awards, mas não é universal.
    mesesPagos: 12,
    // Não há contribuição previdenciária descontada do empregado: a superannuation
    // (12% desde 1º/7/2025) é paga pelo EMPREGADOR, além do salário; a Medicare
    // levy (2%) entra no imposto de renda.
    contribuicao: { aliquota: [0, 0] },
    // Tax-free threshold A$ 18.200/ano (≈ A$ 1.517/mês); 16% até A$ 45 mil e 30% até
    // A$ 135 mil, + 2% de Medicare levy. Alíquota típica sobre o que passa: ~25%.
    impostoRenda: { isencao: 1517, aliquota: 0.25 },
    // Fair Work Act 2009, s. 119 (NES): redundancy pay de 4 semanas (1 ano de casa)
    // a 16 semanas (9 anos) — ~0,4 salário por ano; empresas com menos de 15 empregados estão isentas.
    rescisao: { nome: 'redundancy pay (NES)', mesesPorAno: 0.4 },
    // JobSeeker Payment: valor fixo e por renda familiar, sem prazo; abstraído como
    // ~25% do salário por até um ano.
    seguroDesemprego: { meses: 12, reposicao: 0.25 },
    // Age Pension aos 67 (10 anos de residência) + superannuation; reposição típica ~50%.
    previdencia: { idade: [67, 67], anos: [10, 10], reposicao: 0.5, nome: 'Age Pension e superannuation' },
    // Australian Public Service: seleção por mérito com candidatura (Public Service Act 1999, s. 10A).
    concurso: false,
    contratoFormal: 'emprego registrado (com TFN e superannuation)'
  },
  educacao: {
    etapas: {
      fundamental: 'escola primária', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'a creche subsidiada (childcare)', fundamental: 'a escola primária pública', medio: 'a escola secundária pública' }
    },
    // O ATAR é uma classificação nacional calculada a partir dos exames estaduais do
    // Year 12 (HSC, VCE, QCE...), e ordena o acesso às vagas.
    ingresso: 'exame_nacional',
    exame: { nome: 'ATAR', artigo: 'o' },
    // Universidades públicas com "Commonwealth supported places": contribuição do
    // estudante de ~A$ 4,6–17 mil/ano, financiável pelo HECS-HELP; privadas são raras.
    publicaCobra: 0.4,
    bolsa: { nome: 'Youth Allowance', teto: 1.5 },
    credito: { nome: 'HECS-HELP' },
    cotas: false,
    privadaComum: false
  },
  politica: {
    sistema: 'monarquia constitucional parlamentarista federal',
    // Premiês estaduais saem do parlamento: governador não é eleito (o "Governor" é
    // nomeado pela Coroa). O Senado é eleito (Constituição, s. 7). Idade: 18 (eleitor adulto).
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'o conselho municipal' },
      // Prefeito eleito diretamente em Queensland, Austrália Meridional, Tasmânia e parte
      // de Nova Gales do Sul e Vitória; nos demais, escolhido pelos vereadores.
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 18, casa: 'a prefeitura (o council)' },
      deputado_estadual: { titulo: ['deputado estadual', 'deputada estadual'], anos: 4, idade: 18, casa: 'o Parlamento do estado' },
      deputado_federal: { titulo: ['deputado federal', 'deputada federal'], anos: 3, idade: 18, casa: 'a Câmara dos Representantes' },
      senador: { titulo: ['senador', 'senadora'], anos: 6, idade: 18, casa: 'o Senado' }
    },
    // Federal: 3/5/2025, a próxima até 2028. Locais de NSW e Vitória: 2024 → 2028.
    eleicoes: { local: [2028, 4], geral: [2028, 3] },
    mes: 4,
    // Voto obrigatório (Commonwealth Electoral Act 1918, s. 245).
    obrigatorio: true,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 17,
    forcas: { exercito: 'o Exército Australiano', marinha: 'a Marinha Real Australiana', aeronautica: 'a Força Aérea Real Australiana' },
    policia: 'a polícia estadual'
  },
  esporte: {
    // Natação e tênis com estrutura de elite (Australian Institute of Sport, Australian
    // Open); futebol é o esporte coletivo mais praticado (AusPlay), mas o profissional
    // disputa espaço com o futebol australiano e o rúgbi (fora do jogo).
    popularidade: { futebol: 0.95, volei: 0.7, basquete: 1.0, natacao: 1.5, atletismo: 1.05, lutas: 0.85, tenis: 1.3 },
    // Sem acesso e descenso entre a A-League e as divisões abaixo. O Australian
    // Championship (2025) é a 2ª divisão nacional, com clubes das NPL estaduais.
    divisoes: ['State League', 'National Premier Leagues', 'Australian Championship', 'A-League Men'],
    clubes: [
      { nome: 'Sydney FC', artigo: 'o', porte: 'grande', cidade: 'Sydney' },
      { nome: 'Melbourne Victory', artigo: 'o', porte: 'grande', cidade: 'Melbourne' },
      { nome: 'Western Sydney Wanderers', artigo: 'o', porte: 'grande', cidade: 'Parramatta' },
      { nome: 'Melbourne City', artigo: 'o', porte: 'grande', cidade: 'Melbourne' },
      { nome: 'Adelaide United', artigo: 'o', porte: 'tradicional', cidade: 'Adelaide' },
      { nome: 'Brisbane Roar', artigo: 'o', porte: 'tradicional', cidade: 'Brisbane' },
      { nome: 'Perth Glory', artigo: 'o', porte: 'tradicional', cidade: 'Perth' },
      { nome: 'Newcastle Jets', artigo: 'o', porte: 'tradicional', cidade: 'Newcastle' },
      { nome: 'South Melbourne', artigo: 'o', porte: 'regional', cidade: 'Melbourne' },
      { nome: 'Sydney Olympic', artigo: 'o', porte: 'regional', cidade: 'Sydney' },
      { nome: 'Marconi Stallions', artigo: 'o', porte: 'regional', cidade: 'Sydney' },
      { nome: 'Wollongong Wolves', artigo: 'o', porte: 'regional', cidade: 'Wollongong' },
      { nome: 'Gold Coast Knights', artigo: 'o', porte: 'regional', cidade: 'Gold Coast' }
    ]
  },
  // Medicare universal + seguro privado comum (incentivado pela Medicare levy surcharge).
  saude: { sistema: 'universal', redePublica: 'o Medicare', custoPlano: 1.4 },
  // Trans-Tasman com a Nova Zelândia; para os demais, vistos por pontos e patrocínio.
  migracao: { blocos: ['nz_au'], abertura: 'seletiva' },
  sucessao: {
    pais: 'AU',
    nome: 'Austrália',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1, 1],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.02,
    rotuloCusto: 'custas da homologação (probate) e advogados',
    vacancia: 'a Coroa (o governo estadual)'
  },
  nomes: {
    cortes: [1975, 2005],
    neutros: ['Charlie', 'Frankie', 'Alex', 'Billie', 'Jordan', 'Riley', 'Sam', 'Jamie', 'Quinn', 'Harley', 'Ashley', 'Kai'],
    grupos: [{
      // Nomes: NSW Registry of Births, Deaths and Marriages e Births, Deaths and
      // Marriages Victoria (listas anuais e históricas). Sobrenomes: frequências da
      // lista eleitoral/registros; reflete a imigração britânica, irlandesa,
      // italiana, grega, vietnamita, chinesa e indiana.
      id: 'au',
      peso: 1,
      sobrenome: 'um',
      masc: {
        antiga: ['John', 'Peter', 'David', 'Robert', 'Michael', 'Paul', 'Stephen', 'Ian', 'Graham', 'Kevin', 'Geoffrey', 'Brian', 'Ronald', 'Garry', 'Kenneth', 'William', 'Barry', 'Allan', 'Gregory', 'Raymond',
          'Neil', 'Colin', 'Terence', 'Wayne', 'Keith', 'Bruce', 'Ross', 'Trevor', 'Leslie', 'Phillip', 'Giuseppe', 'George', 'Anthony', 'Rodney', 'Warren'],
        meio: ['Matthew', 'Daniel', 'Andrew', 'Joshua', 'Benjamin', 'Christopher', 'Michael', 'James', 'Luke', 'Thomas', 'Nathan', 'Jason', 'Scott', 'Adam', 'Ryan', 'Jack', 'Samuel', 'Jake', 'Lachlan', 'Mitchell',
          'Bradley', 'Shane', 'Dean', 'Brendan', 'Corey', 'Kane', 'Liam', 'Hayden', 'Jarrod', 'Troy', 'Blake', 'Nicholas', 'Aaron', 'Damien', 'Tim'],
        nova: ['Oliver', 'Noah', 'Leo', 'Henry', 'Theodore', 'Jack', 'William', 'Charlie', 'Lucas', 'Thomas', 'Hudson', 'Luca', 'Archie', 'Harrison', 'Isaac', 'Levi', 'Hunter', 'Ethan', 'Harvey', 'James',
          'Arlo', 'Max', 'Mason', 'Lachlan', 'Elijah', 'Hugo', 'Muhammad', 'Oscar', 'Felix', 'Louis', 'Archer', 'Sebastian', 'Xavier', 'Patrick', 'Ezra']
      },
      fem: {
        antiga: ['Margaret', 'Patricia', 'Susan', 'Christine', 'Helen', 'Elizabeth', 'Jennifer', 'Barbara', 'Judith', 'Lynette', 'Kathleen', 'Robyn', 'Gail', 'Joan', 'Carol', 'Wendy', 'Janet', 'Denise', 'Dianne', 'Pamela',
          'Valerie', 'Lorraine', 'Beverley', 'Shirley', 'Cheryl', 'Jillian', 'Glenda', 'Maureen', 'Julie', 'Kerry', 'Maria', 'Anne', 'Sandra', 'Deborah', 'Jan'],
        meio: ['Jessica', 'Sarah', 'Emma', 'Rebecca', 'Emily', 'Michelle', 'Amanda', 'Lisa', 'Nicole', 'Melissa', 'Kylie', 'Rachel', 'Stephanie', 'Kate', 'Laura', 'Samantha', 'Hayley', 'Chloe', 'Danielle', 'Jacqueline',
          'Natalie', 'Tegan', 'Renee', 'Kristy', 'Bianca', 'Kirsten', 'Amy', 'Megan', 'Belinda', 'Leah', 'Kelly', 'Melanie', 'Alana', 'Brooke', 'Jodie'],
        nova: ['Charlotte', 'Isla', 'Olivia', 'Amelia', 'Mia', 'Matilda', 'Ava', 'Grace', 'Ella', 'Hazel', 'Willow', 'Sophie', 'Evie', 'Zoe', 'Lily', 'Harper', 'Ivy', 'Chloe', 'Sienna', 'Isabella',
          'Aria', 'Frankie', 'Florence', 'Mila', 'Ruby', 'Georgia', 'Billie', 'Audrey', 'Sadie', 'Mackenzie', 'Layla', 'Eleanor', 'Ellie', 'Harriet', 'Indie']
      },
      sobrenomes: [
        'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson',
        'Thompson', 'Nguyen', 'Thomas', 'Walker', 'Harris', 'Lee', 'Ryan', 'Robinson', 'Kelly', 'King',
        'Davis', 'Wright', 'Evans', 'Roberts', 'Green', 'Hall', 'Wood', 'Jackson', 'Clarke', 'Patel',
        'Lewis', 'James', 'Phillips', 'Mitchell', 'Turner', 'Wang', 'Chen', 'Singh', 'Murphy', 'Campbell',
        "O'Brien", 'Russo', 'Papadopoulos', 'Tran', 'Khan', 'Kaur', 'Morgan', 'Cooper', 'Edwards', 'Walsh',
        'Stewart', 'Hughes', 'Zhang', 'Bianchi', 'Nikolaidis'
      ]
    }]
  },
  fontes: [
    'Fair Work Commission, Annual Wage Review 2025–26 (decisão de junho/2026): salário mínimo nacional de A$ 1.004,90/semana desde 1º/7/2026.',
    'Fair Work Act 2009 (Cth), National Employment Standards, s. 119 (redundancy pay).',
    'Australian Taxation Office: faixas de 2025–26 (tax-free threshold A$ 18.200), Medicare levy, superannuation guarantee de 12% (2025).',
    'Services Australia: Age Pension (67 anos, 10 anos de residência), JobSeeker Payment, Youth Allowance; Study Assist (HECS-HELP).',
    'Constituição da Austrália, ss. 7, 13, 24, 28; Commonwealth Electoral Act 1918, s. 245 (voto obrigatório).',
    'Succession Act 2006 (NSW), ss. 111–113, 127, 129, 136 e Cap. 3 (family provision).',
    'ABS: Household Income and Wealth (Gini); Average Weekly Earnings por estado; ACOSS/UNSW, Poverty in Australia.',
    'Public Service Act 1999 (Cth), s. 10A (mérito).',
    'Football Australia: A-League Men, Australian Championship (2025), National Premier Leagues; Clearinghouse for Sport/AusPlay (participação).',
    'NSW Registry of Births, Deaths and Marriages e BDM Victoria (nomes populares).'
  ]
};

/* ======================================================= NOVA ZELÂNDIA */

/*
 * SUCESSÃO — NOVA ZELÂNDIA (Administration Act 1969; Property (Relationships)
 * Act 1976; Family Protection Act 1955):
 *  - liberdade de testar; cônjuge e filhos podem pedir "family protection"
 *    ao tribunal (FPA 1955) — fica fora do jogo;
 *  - sem testamento (Administration Act, s. 77): com filhos, o cônjuge
 *    recebe os bens pessoais, um legado legal (NZ$ 155 mil) e um terço do
 *    resto; os filhos, dois terços; sem filhos e com pais vivos, o cônjuge
 *    fica com os bens pessoais, o legado e dois terços do resto (≈ 3/4 do total);
 *  - representação por estirpe e irmãos na falta de pais (s. 77);
 *  - na morte, o parceiro pode optar pela divisão IGUAL dos bens da relação
 *    (PRA 1976, Parte 8, "opção A") — por isso meacao: true;
 *  - sem herdeiros, os bens vão para a Coroa ("bona vacantia", s. 77).
 * SIMPLIFICAÇÕES DECLARADAS: o legado legal e as frações viram "o cônjuge
 * concorre com os descendentes" e ~3/4 com os pais. Não há imposto sobre
 * herança (estate duty abolido em 1992); o custo é o da homologação e
 * advogados, ~2%.
 */

export const NOVA_ZELANDIA: PerfilDePais = {
  id: 'NZ',
  // Regras legais: GDLS (aprendiz aos 16, restrita aos 16½ → 17, plena aos 18 — 17½ com curso).
  regras: { direcao: { aprendiz: { idade: 16, nome: 'licença de aprendiz' }, provisoria: { idade: 17, nome: 'licença restrita' }, plena: 18 } },
  gentilico: ['neozelandês', 'neozelandesa'],
  idiomas: ['inglês', 'maori'],
  divisao: {
    tipo: ['região', 'regiões'],
    // Aluguel e renda mais altos em Auckland e Wellington; abaixo em Northland,
    // Manawatū-Whanganui e Southland (Stats NZ, renda semanal mediana; MBIE, aluguéis).
    lista: [
      { codigo: 'AUK', nome: 'Auckland', custo: 1.15, salario: 1.08 },
      { codigo: 'WGN', nome: 'Wellington', custo: 1.05, salario: 1.1 },
      { codigo: 'CAN', nome: 'Canterbury', custo: 0.95, salario: 0.98 },
      { codigo: 'WKO', nome: 'Waikato', custo: 0.95, salario: 0.95 },
      { codigo: 'BOP', nome: 'Bay of Plenty', custo: 1.0, salario: 0.93 },
      { codigo: 'OTA', nome: 'Otago', custo: 1.0, salario: 0.95 },
      { codigo: 'MWT', nome: 'Manawatū-Whanganui', custo: 0.88, salario: 0.9 },
      { codigo: 'HKB', nome: "Hawke's Bay", custo: 0.92, salario: 0.9 },
      { codigo: 'NSN', nome: 'Nelson', custo: 0.95, salario: 0.9 },
      { codigo: 'STL', nome: 'Southland', custo: 0.85, salario: 0.92 },
      { codigo: 'NTL', nome: 'Northland', custo: 0.9, salario: 0.85 }
    ]
  },
  cidades: [
    ['Auckland', 'AUK', 'metropole', 'sede|litoral'],
    ['Wellington', 'WGN', 'capital', 'capital|sede|litoral'],
    ['Christchurch', 'CAN', 'capital', 'sede|litoral'],
    ['Hamilton', 'WKO', 'polo', 'sede'],
    ['Tauranga', 'BOP', 'polo', 'litoral'],
    ['Dunedin', 'OTA', 'polo', 'sede|litoral'],
    ['Palmerston North', 'MWT', 'polo', 'sede'],
    ['Napier', 'HKB', 'polo', 'sede|litoral'],
    ['Nelson', 'NSN', 'capital', 'sede|litoral'],
    ['Invercargill', 'STL', 'polo', 'sede|litoral'],
    ['Whangārei', 'NTL', 'capital', 'sede|litoral'],
    ['Queenstown', 'OTA', 'pequena']
  ],
  economia: {
    // Stats NZ (2024): ~12–13% das crianças em pobreza relativa de renda (antes dos
    // custos de moradia); Gini ~0,33. Pesos: 11/25/27/26/11.
    classes: { vulneravel: 11, trabalhadora: 25, media_baixa: 27, media: 26, alta: 11 },
    // Moradia entre as menos acessíveis da OCDE em relação à renda.
    moradia: 1.6,
    // Salário mínimo adulto de NZ$ 23,95/h desde 1º/4/2026 (Minimum Wage Order 2026)
    // × 40 h × 52 / 12 = NZ$ 4.151,33/mês.
    salarioMinimo: 4151.33,
    // Sem série da OIT; estimativa conservadora.
    informalidade: 0.1,
    inflacao: 0.03,
    volatilidade: 0.7
  },
  trabalho: {
    mesesPagos: 12,
    // ACC earners' levy (~1,75% em 2026/27, seguro de acidentes) e KiwiSaver (3,5% do
    // empregado desde 1º/4/2026, adesão automática com saída voluntária). Sem teto
    // modelado (o do ACC é alto). Faixa: só o ACC → ACC + KiwiSaver.
    contribuicao: { aliquota: [0.0175, 0.0525] },
    // Sem faixa isenta: 10,5% até NZ$ 15.600, 17,5% até NZ$ 53.500, 30% até NZ$ 78.100.
    // Abstração: isenção zero e ~19% (a média efetiva de quem ganha a renda mediana).
    impostoRenda: { isencao: 0, aliquota: 0.19 },
    // Não há indenização legal por redundância (Employment Relations Act 2000):
    // só o aviso e o que o contrato prever.
    rescisao: { nome: 'aviso prévio (sem indenização legal)', mesesPorAno: 0 },
    // Jobseeker Support: valor fixo por renda familiar; abstraído como ~25% por um ano.
    seguroDesemprego: { meses: 12, reposicao: 0.25 },
    // NZ Superannuation aos 65, universal por residência: a exigência sobe de 10 para
    // 20 anos de residência após os 20 anos (2024–2042); o jogo usa a regra final.
    previdencia: { idade: [65, 65], anos: [20, 20], reposicao: 0.45, nome: 'NZ Super e KiwiSaver' },
    // Public Service Act 2020: nomeação por mérito com candidatura.
    concurso: false,
    contratoFormal: 'contrato de trabalho por escrito (employment agreement)'
  },
  educacao: {
    etapas: {
      fundamental: 'escola primária', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o kindergarten', fundamental: 'a escola primária estatal', medio: 'a escola secundária estatal' }
    },
    // University Entrance pelo NCEA nível 3; cursos concorridos selecionam por notas.
    // (O NCEA deve ser substituído por um novo certificado a partir de 2028.)
    ingresso: 'candidatura',
    exame: { nome: 'NCEA', artigo: 'o' },
    // Oito universidades, todas públicas; anuidades de ~NZ$ 7–10 mil, com um ano
    // gratuito (Fees Free). Privadas são raras.
    publicaCobra: 0.4,
    bolsa: { nome: 'Student Allowance', teto: 1.5 },
    // Student Loan sem juros para residentes na Nova Zelândia.
    credito: { nome: 'Student Loan' },
    cotas: false,
    privadaComum: false
  },
  politica: {
    sistema: 'monarquia constitucional parlamentarista unitária e unicameral',
    // Unicameral e unitária: não há assembleia regional legislativa, Senado nem governador.
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 3, idade: 18, casa: 'o conselho municipal' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 3, idade: 18, casa: 'a prefeitura (o council)' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 3, idade: 18, casa: 'a Câmara dos Representantes' }
    },
    // Locais em outubro de 2025 (a cada 3 anos); gerais em 7/11/2026 (Constitution Act 1986, s. 17: mandato de 3).
    eleicoes: { local: [2025, 3], geral: [2026, 3] },
    mes: 9,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 17,
    forcas: { exercito: 'o Exército da Nova Zelândia', marinha: 'a Marinha Real da Nova Zelândia', aeronautica: 'a Força Aérea Real da Nova Zelândia' },
    policia: 'a Polícia da Nova Zelândia'
  },
  esporte: {
    // O rúgbi (fora do jogo) domina; netball também. Futebol com A-League (dois clubes)
    // e liga nacional amadora; natação, atletismo e basquete (NBL) com estrutura média.
    popularidade: { futebol: 0.85, volei: 0.7, basquete: 1.0, natacao: 1.2, atletismo: 1.05, lutas: 0.8, tenis: 0.95 },
    // Os clubes neozelandeses da A-League Men (liga australiana) são a elite de fato;
    // a National League é a 1ª divisão nacional, alimentada pelas ligas Northern,
    // Central e Southern.
    divisoes: ['ligas regionais das federações', 'Northern, Central e Southern League', 'National League', 'A-League Men'],
    clubes: [
      { nome: 'Auckland FC', artigo: 'o', porte: 'grande', cidade: 'Auckland' },
      { nome: 'Wellington Phoenix', artigo: 'o', porte: 'grande', cidade: 'Wellington' },
      { nome: 'Auckland City', artigo: 'o', porte: 'tradicional', cidade: 'Auckland' },
      { nome: 'Wellington Olympic', artigo: 'o', porte: 'tradicional', cidade: 'Wellington' },
      { nome: 'Christchurch United', artigo: 'o', porte: 'tradicional', cidade: 'Christchurch' },
      { nome: 'Cashmere Technical', artigo: 'o', porte: 'tradicional', cidade: 'Christchurch' },
      { nome: 'Eastern Suburbs', artigo: 'o', porte: 'tradicional', cidade: 'Auckland' },
      { nome: 'Birkenhead United', artigo: 'o', porte: 'regional', cidade: 'Auckland' },
      { nome: 'Western Springs', artigo: 'o', porte: 'regional', cidade: 'Auckland' },
      { nome: 'Melville United', artigo: 'o', porte: 'regional', cidade: 'Hamilton' },
      { nome: 'Napier City Rovers', artigo: 'o', porte: 'regional', cidade: 'Napier' },
      { nome: 'Nelson Suburbs', artigo: 'o', porte: 'regional', cidade: 'Nelson' }
    ]
  },
  // Rede pública universal (Health New Zealand – Te Whatu Ora); ~1/3 tem seguro privado.
  saude: { sistema: 'universal', redePublica: 'a rede pública (Te Whatu Ora)', custoPlano: 1.2 },
  migracao: { blocos: ['nz_au'], abertura: 'seletiva' },
  sucessao: {
    pais: 'NZ',
    nome: 'Nova Zelândia',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [0.75, 0.75],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.02,
    rotuloCusto: 'custas da homologação (probate) e advogados',
    vacancia: 'a Coroa'
  },
  nomes: {
    cortes: [1975, 2005],
    neutros: ['Charlie', 'Frankie', 'Alex', 'Riley', 'Jordan', 'Manaia', 'Kai', 'Quinn', 'Billie', 'Rangi', 'Sam'],
    grupos: [
      {
        // Department of Internal Affairs (Te Tari Taiwhenua): nomes de bebês mais
        // registrados (série desde 1954). Sobrenomes: frequências de registros;
        // incluem as comunidades asiática e do Pacífico.
        id: 'nz',
        peso: 0.83,
        sobrenome: 'um',
        masc: {
          antiga: ['John', 'Peter', 'David', 'Michael', 'Robert', 'Ian', 'Graham', 'Brian', 'Kevin', 'Murray', 'Bruce', 'Gary', 'Russell', 'Grant', 'Neil', 'Alan', 'Colin', 'Barry', 'Keith', 'Wayne',
            'Trevor', 'Ross', 'Kenneth', 'Raymond', 'Stuart', 'Richard', 'Gordon', 'Paul', 'Warren', 'Noel'],
          meio: ['Daniel', 'Michael', 'Matthew', 'James', 'Joshua', 'Benjamin', 'Samuel', 'Thomas', 'Jacob', 'Christopher', 'Nathan', 'Ryan', 'Andrew', 'Jason', 'Scott', 'Bradley', 'Hayden', 'Liam', 'Luke', 'Jordan',
            'Dylan', 'Blair', 'Shane', 'Craig', 'Aaron', 'Cameron', 'Jarrod', 'Callum', 'Nicholas', 'Mark'],
          nova: ['Oliver', 'Noah', 'Leo', 'Jack', 'George', 'Arlo', 'Theodore', 'Luca', 'William', 'Lucas', 'Charlie', 'Hunter', 'Mason', 'Hudson', 'Thomas', 'Henry', 'James', 'Isaac', 'Levi', 'Elijah',
            'Archie', 'Max', 'Finn', 'Harrison', 'Ari', 'Nikau', 'Oscar', 'Beau', 'Mateo', 'Ezra']
        },
        fem: {
          antiga: ['Margaret', 'Judith', 'Susan', 'Christine', 'Helen', 'Patricia', 'Jennifer', 'Elizabeth', 'Gillian', 'Robyn', 'Janet', 'Glenys', 'Lynette', 'Raewyn', 'Denise', 'Barbara', 'Joan', 'Carol', 'Jan', 'Kathleen',
            'Maureen', 'Valerie', 'Heather', 'Wendy', 'Sandra', 'Beverley', 'Diane', 'Lynley', 'Shirley', 'Anne'],
          meio: ['Sarah', 'Jessica', 'Emma', 'Rebecca', 'Hannah', 'Emily', 'Amy', 'Rachel', 'Nicole', 'Michelle', 'Kirsty', 'Melissa', 'Samantha', 'Natalie', 'Hayley', 'Stephanie', 'Laura', 'Georgia', 'Kate', 'Anna',
            'Lisa', 'Chloe', 'Danielle', 'Renee', 'Megan', 'Olivia', 'Amber', 'Courtney', 'Kelly', 'Sophie'],
          nova: ['Isla', 'Charlotte', 'Amelia', 'Olivia', 'Mia', 'Ava', 'Aria', 'Lily', 'Willow', 'Sophie', 'Harper', 'Grace', 'Ella', 'Evie', 'Hazel', 'Maia', 'Ruby', 'Zoe', 'Billie', 'Frankie',
            'Matilda', 'Isabella', 'Florence', 'Georgia', 'Mila', 'Ivy', 'Lucy', 'Sadie', 'Eden', 'Quinn']
        },
        sobrenomes: [
          'Smith', 'Wilson', 'Williams', 'Brown', 'Taylor', 'Jones', 'Anderson', 'Thompson', 'Walker', 'Campbell',
          'Martin', 'Clark', 'Robinson', 'Scott', 'Stewart', 'Murray', 'Harris', 'White', 'Young', 'Mitchell',
          'King', 'Turner', 'Kelly', 'Ryan', 'Bell', 'Wright', 'Morris', 'Hall', 'Ross', 'Cooper',
          'Davies', 'Edwards', 'Hughes', 'Johnson', 'Lee', 'Singh', 'Wang', 'Li', 'Patel', 'Chen',
          'Kumar', 'Leota', 'Taufa', 'Tuala', 'Fonua', 'Van der Merwe', 'Reid', 'McDonald'
        ]
      },
      {
        // Māori: ~18% da população (Censo 2023). Nomes próprios em inglês e em te reo
        // Māori lado a lado, como nos registros (DIA publica também os nomes maori mais
        // escolhidos); sobrenomes maori e de origem britânica, como de fato ocorre.
        id: 'nz_maori',
        peso: 0.17,
        sobrenome: 'um',
        masc: {
          antiga: ['John', 'Hēmi', 'Wiremu', 'Rāwiri', 'Tamati', 'Pita', 'Hone', 'Paora', 'Rōpata', 'Hēnare', 'William', 'George', 'Thomas', 'Peter', 'Joseph', 'Charles', 'James', 'Robert', 'David', 'Matiu',
            'Hohepa', 'Tipene', 'Rewi', 'Kingi', 'Moana'],
          meio: ['Wiremu', 'Tāne', 'Rangi', 'Hemi', 'Daniel', 'Michael', 'Joshua', 'Shane', 'Jason', 'Tama', 'Nathan', 'Aaron', 'Mikaere', 'Ihaia', 'Tamati', 'Ryan', 'Jordan', 'Te Rangi', 'Matiu', 'Hone',
            'Rāwiri', 'Isaiah', 'Brandon', 'Taine', 'Kahu'],
          nova: ['Nikau', 'Ari', 'Manaia', 'Kai', 'Mikaere', 'Tama', 'Ihaia', 'Kauri', 'Ihaka', 'Ariki', 'Rāwiri', 'Wiremu', 'Tāne', 'Mana', 'Noah', 'Oliver', 'Mason', 'Isaiah', 'Hunter', 'Elijah',
            'Tai', 'Kaha', 'Te Ariki', 'Hemi', 'Leo']
        },
        fem: {
          antiga: ['Mere', 'Hine', 'Huia', 'Kiri', 'Ani', 'Mary', 'Margaret', 'Elizabeth', 'Ruth', 'Te Aroha', 'Hana', 'Mereana', 'Marama', 'Aroha', 'Ngaire', 'Pare', 'Ripeka', 'Hera', 'Ngaio', 'Mihi',
            'Rose', 'Ellen', 'Lena', 'Rāhera', 'Kahurangi'],
          meio: ['Aroha', 'Marama', 'Hinemoa', 'Anahera', 'Kiri', 'Mereana', 'Sarah', 'Jessica', 'Hannah', 'Rachel', 'Tania', 'Awhina', 'Moana', 'Huia', 'Hine', 'Te Aroha', 'Ataahua', 'Michelle', 'Nicole', 'Courtney',
            'Amber', 'Danielle', 'Renee', 'Tui', 'Kahurangi'],
          nova: ['Aria', 'Maia', 'Kaia', 'Manaia', 'Anahera', 'Ataahua', 'Kahurangi', 'Aroha', 'Hana', 'Mere', 'Moana', 'Mihiata', 'Awhina', 'Isla', 'Ava', 'Mia', 'Amelia', 'Olivia', 'Te Aroha', 'Huia',
            'Tia', 'Kōwhai', 'Hinewai', 'Marama', 'Ruby']
        },
        sobrenomes: [
          'Ngata', 'Parata', 'Hēnare', 'Tamihana', 'Tipene', 'Pōmare', 'Harawira', 'Waititi', 'Mahuika', 'Tawhai',
          'Ruru', 'Kereama', 'Hohaia', 'Paewai', 'Rangi', 'Tamatea', 'Te Kani', 'Whaanga', 'Ratima', 'Poutama',
          'Tapsell', 'Kingi', 'Wihongi', 'Hape', 'Rewi', 'Paki', 'Potae', 'Turei', 'Hetaraka', 'Mita',
          'Smith', 'Williams', 'Brown', 'Walker', 'Wilson', 'Thompson', 'Edwards', 'Morgan', 'Phillips', 'Nathan',
          'Takerei', 'Te Whata', 'Tomoana', 'Reweti'
        ]
      }
    ]
  },
  fontes: [
    'Employment New Zealand / MBIE: salário mínimo adulto de NZ$ 23,95/h a partir de 1º/4/2026.',
    'Inland Revenue (IRD): faixas do imposto de renda (2025), KiwiSaver (3,5% a partir de 1º/4/2026); ACC, earners\' levy 2026/27.',
    'Employment Relations Act 2000 (sem indenização legal por redundância); Work and Income: Jobseeker Support, NZ Superannuation (regras de residência, 2024–2042).',
    'StudyLink: Student Allowance, Student Loan; Tertiary Education Commission (Fees Free); NZQA (NCEA, University Entrance).',
    'Constitution Act 1986, s. 17; Local Electoral Act 2001; Electoral Commission (eleição geral de 7/11/2026).',
    'Administration Act 1969, s. 77; Property (Relationships) Act 1976, Parte 8; Family Protection Act 1955.',
    'Stats NZ: Censo 2023 (população maori), Child poverty statistics (2024), renda por região.',
    'Department of Internal Affairs: nomes de bebês mais populares (série histórica e nomes maori).',
    'New Zealand Football: National League, Northern/Central/Southern League; A-League Men (Auckland FC, Wellington Phoenix).',
    'Public Service Act 2020 (mérito).'
  ]
};

export const PAISES: PerfilDePais[] = [AUSTRALIA, NOVA_ZELANDIA];
