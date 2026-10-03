/**
 * AMÉRICA CENTRAL E CARIBE — Costa Rica e República Dominicana.
 *
 * Mesmas convenções de `america-sul.ts`: dinheiro em moeda local por mês;
 * `contribuicao` = tudo o que a lei desconta do empregado para a seguridade;
 * `impostoRenda` = isenção mensal e uma alíquota marginal representativa de
 * quem passa do piso; as abstrações estão declaradas acima de cada perfil.
 * Notas de proveniência: `docs/notas/FONTES-PAISES-AMERICAS-LATINA.md`.
 */

import type { PerfilDePais } from '../tipos';

/* =============================================================== COSTA RICA
 *
 * ECONOMIA: 15,2% dos domicílios abaixo da linha de pobreza e 3,8% em pobreza
 * extrema (INEC, ENAHO 2025), o menor nível desde 2010; Gini ~0,50 (alto).
 * Informalidade 37,8% (INEC, ECE, 4º tri 2025). Inflação: 2025 fechou em
 * −0,38%; a meta do BCCR é 3% — 0,02 é o nível típico recente, com pouca
 * volatilidade. Preços altos para a região (catálogo: 1,30 × Brasil).
 * Salário mínimo: há uma tabela por ocupação; o piso de referência é o do
 * "trabajador en ocupación no calificada genérico", CRC 373.092,30/mês em 2026
 * (Decreto 45303-MTSS). Regional: a Grande Área Metropolitana (San José,
 * Alajuela, Heredia, Cartago) concentra renda; as regiões Huetar Caribe
 * (Limón) e Brunca/Pacífico Central têm a maior pobreza (INEC, por região de
 * planejamento — aqui aproximadas pelas províncias).
 *
 * TRABALHO: aguinaldo (Lei 2412) = 13 salários. Descontos do trabalhador à
 * CCSS: 5,5% saúde (SEM) + 4,33% pensão (IVM, desde jan/2026) + 1% Banco
 * Popular = 10,83%, sem teto. Imposto sobre o salário (Decreto 45333-H,
 * 2026): isento até CRC 918.000; 10% até 1.347.000, 15% até 2.364.000 —
 * 12% sobre o excedente é a média de quem passa do piso. Auxílio de
 * cesantia (Código de Trabalho, art. 29): de 19,5 a 22 dias por ano, até 8
 * anos ≈ 0,7 salário por ano. Não há seguro-desemprego público (o Fundo de
 * Capitalização Laboral, Lei 7983, é uma poupança) — omitido. Aposentadoria
 * do IVM: 65 anos e 300 cotas (25 anos); reposição ~50%. Concurso: o Regime
 * do Serviço Civil e a Lei Marco de Emprego Público (Lei 10159/2022) exigem
 * seleção por mérito — true.
 *
 * POLÍTICA: república presidencialista unitária. As 7 províncias NÃO têm
 * governo nem assembleia eleitos — por isso não há deputado_estadual nem
 * governador. O cantão elege alcalde e regidores (4 anos; cidadão em
 * exercício, 18). A Assembleia Legislativa é unicameral: 57 deputados,
 * 4 anos, 21 anos de idade (Constituição, art. 107–108); não há Senado.
 * Nacionais: fevereiro de 2026 e 2030; municipais: fevereiro de 2028.
 * O voto é "obrigatório" no texto (art. 93), mas não há sanção — false.
 *
 * FORÇAS: o Exército foi abolido em 1948/1949 (Constituição, art. 12). Os
 * três "braços" do jogo são preenchidos pelas forças reais de segurança do
 * Ministério de Segurança Pública: a Força Pública (terra), o Serviço Nacional
 * de Guarda-Costas (mar) e o Serviço de Vigilância Aérea (ar). Ingresso
 * voluntário.
 *
 * SUCESSÃO — Código Civil:
 *  - LIBERDADE DE TESTAR: não há legítima (art. 595); o testador só deve
 *    garantir alimentos a quem dependia dele (filhos menores, cônjuge, pais) —
 *    a obrigação alimentar não é modelada: legitima 0, sem necessários;
 *  - sem testamento (art. 572): 1ª ordem, filhos, pais e cônjuge, por partes
 *    iguais — no jogo, o cônjuge concorre por cabeça com os descendentes e,
 *    sem descendentes, fica com 1/3 (dois pais vivos) ou 1/2 (um);
 *    SIMPLIFICAÇÃO: os pais vivos concorrem também com os filhos na lei real,
 *    o que o motor não faz (com descendentes, os ascendentes ficam de fora);
 *  - representação; irmãos na ordem seguinte;
 *  - bens ganhos no casamento ("gananciales") se dividem pela metade na
 *    dissolução (Código de Família, art. 41) — meação;
 *  - sem herdeiros: as Juntas de Educação dos lugares onde estão os bens
 *    (art. 572, último inciso).
 *  Não há imposto sobre herança; o processo sucessório (judicial ou notarial)
 *  custa ~3%.
 */
const CR_NOMES = {
  masc: {
    antiga: ['José', 'Juan', 'Carlos', 'Rafael', 'Manuel', 'Luis', 'Jorge', 'Francisco', 'Miguel', 'Óscar', 'Alfonso', 'Gerardo', 'Rodrigo',
      'Mario', 'Guillermo', 'Fernando', 'Víctor', 'Ricardo', 'Rolando', 'Álvaro', 'Édgar', 'Hernán', 'Ronald', 'Marvin', 'Johnny', 'Minor', 'William', 'Juan Rafael'],
    meio: ['Andrés', 'Daniel', 'Luis Diego', 'José Pablo', 'Esteban', 'Alejandro', 'Pablo', 'Mauricio', 'Randall', 'Erick', 'Kevin', 'Christopher',
      'Bryan', 'Josué', 'David', 'Jonathan', 'Felipe', 'Sergio', 'Diego', 'Juan Carlos', 'Fabián', 'Johan', 'Allan', 'Steven', 'Gabriel', 'Álvaro', 'Jason', 'Adrián'],
    nova: ['Julián', 'Santiago', 'Matías', 'Thiago', 'Liam', 'Mateo', 'Gael', 'Sebastián', 'Dylan', 'Ian', 'Samuel', 'Emiliano', 'Lucas',
      'Joaquín', 'Benjamín', 'Daniel', 'Isaac', 'Maximiliano', 'Jacob', 'Gabriel', 'Ethan', 'Noah', 'Tomás', 'Leonardo', 'Elías', 'Josué', 'Martín', 'Iker']
  },
  fem: {
    antiga: ['María', 'Ana', 'Rosa', 'Carmen', 'Marta', 'Lidia', 'Elizabeth', 'Flor', 'Ligia', 'Olga', 'Isabel', 'Teresa', 'Mayra', 'Ana Lucía',
      'Xinia', 'Virginia', 'Hilda', 'Damaris', 'Sonia', 'Rocío', 'Lorena', 'Marjorie', 'Patricia', 'Cecilia', 'Grace', 'Zaida', 'Vilma', 'Ileana'],
    meio: ['María Fernanda', 'Natalia', 'Daniela', 'Andrea', 'Raquel', 'Melissa', 'Karla', 'Paola', 'Tatiana', 'Fabiola', 'Adriana', 'Mónica',
      'Silvia', 'Ivannia', 'Katherine', 'Wendy', 'Jennifer', 'Stephanie', 'Valeria', 'Mariela', 'Alejandra', 'Hazel', 'Pamela', 'Jimena', 'Priscilla', 'Laura', 'Carolina', 'Gabriela'],
    nova: ['Luciana', 'Isabella', 'Valentina', 'Sofía', 'Emma', 'Mía', 'Camila', 'Victoria', 'Alana', 'Zoe', 'Antonella', 'Ariana', 'Emilia',
      'Abigail', 'Aitana', 'Julieta', 'Salomé', 'Amelia', 'Regina', 'María José', 'Olivia', 'Martina', 'Danna', 'Catalina', 'Sara', 'Allison', 'Ashley', 'Fiorella']
  }
};

const COSTA_RICA: PerfilDePais = {
  id: 'CR',
  gentilico: ['costa-riquenho', 'costa-riquenha'],
  idiomas: ['espanhol'],
  divisao: {
    tipo: ['província', 'províncias'],
    lista: [
      { codigo: 'SJ', nome: 'San José', custo: 1.1, salario: 1.1 },
      { codigo: 'A', nome: 'Alajuela' },
      { codigo: 'H', nome: 'Heredia', custo: 1.05, salario: 1.08 },
      { codigo: 'C', nome: 'Cartago' },
      { codigo: 'P', nome: 'Puntarenas', custo: 0.92, salario: 0.88 },
      { codigo: 'G', nome: 'Guanacaste', salario: 0.92 },
      { codigo: 'L', nome: 'Limón', custo: 0.9, salario: 0.85 }
    ]
  },
  cidades: [
    ['San José', 'SJ', 'metropole', 'capital|sede'],
    ['Desamparados', 'SJ', 'metropolitana', 'metro:San José'],
    ['Tibás', 'SJ', 'metropolitana', 'metro:San José'],
    ['Alajuela', 'A', 'metropolitana', 'metro:San José|sede'],
    ['Heredia', 'H', 'metropolitana', 'metro:San José|sede'],
    ['Cartago', 'C', 'metropolitana', 'metro:San José|sede'],
    ['Puntarenas', 'P', 'capital', 'sede|litoral'],
    ['Limón', 'L', 'capital', 'sede|litoral'],
    ['Liberia', 'G', 'capital', 'sede'],
    ['San Isidro de El General', 'SJ', 'polo'],
    ['Ciudad Quesada', 'A', 'polo'],
    ['Guápiles', 'L', 'polo'],
    ['Nicoya', 'G', 'pequena']
  ],
  economia: {
    classes: { vulneravel: 13, trabalhadora: 30, media_baixa: 25, media: 23, alta: 9 },
    moradia: 1,
    salarioMinimo: 373092,
    informalidade: 0.38,
    inflacao: 0.02,
    volatilidade: 0.7
  },
  trabalho: {
    mesesPagos: 13,
    contribuicao: { aliquota: [0.1083, 0.1083] },
    impostoRenda: { isencao: 918000, aliquota: 0.12 },
    rescisao: { nome: 'auxílio de cesantia (até 8 anos)', mesesPorAno: 0.7 },
    previdencia: { idade: [65, 65], anos: [25, 25], reposicao: 0.5, nome: 'IVM da CCSS' },
    concurso: true,
    contratoFormal: 'emprego com garantias sociais'
  },
  educacao: {
    etapas: {
      fundamental: 'primária', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o CEN-CINAI do bairro', fundamental: 'a escola pública do bairro', medio: 'o colégio público' }
    },
    // UCR, TEC, UNA e UNED: admissão por candidatura, com a prova de aptidão acadêmica (UCR–UNA) ou a do TEC.
    ingresso: 'candidatura',
    exame: { nome: 'Prova de Aptidão Acadêmica', artigo: 'a' },
    publicaCobra: 0.25, // matrícula por crédito, com bolsa socioeconômica que isenta boa parte dos alunos
    bolsa: { nome: 'bolsa socioeconômica das universidades públicas', teto: 1 },
    credito: { nome: 'CONAPE' },
    cotas: false,
    privadaComum: true
  },
  politica: {
    sistema: 'república presidencialista unitária, com Assembleia Legislativa unicameral',
    cargos: {
      vereador: { titulo: ['regidor', 'regidora'], anos: 4, idade: 18, casa: 'o Concejo Municipal' },
      prefeito: { titulo: ['alcalde', 'alcaldesa'], anos: 4, idade: 18, casa: 'a Municipalidade' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 4, idade: 21, casa: 'a Assembleia Legislativa' }
    },
    eleicoes: { local: [2028, 4], geral: [2030, 4] },
    mes: 1,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 18,
    forcas: { exercito: 'a Força Pública', marinha: 'o Serviço Nacional de Guarda-Costas', aeronautica: 'o Serviço de Vigilância Aérea' },
    policia: 'a Força Pública'
  },
  esporte: {
    popularidade: { futebol: 1.4, natacao: 0.9, volei: 0.8, atletismo: 0.8, basquete: 0.7, lutas: 0.7, tenis: 0.7 },
    divisoes: ['Tercera División de LINAFA', 'Segunda División B de LINAFA', 'Liga de Ascenso', 'Primera División'],
    clubes: [
      { nome: 'Saprissa', artigo: 'o', porte: 'grande', cidade: 'Tibás' },
      { nome: 'Alajuelense', artigo: 'a', porte: 'grande', cidade: 'Alajuela' },
      { nome: 'Herediano', artigo: 'o', porte: 'grande', cidade: 'Heredia' },
      { nome: 'Cartaginés', artigo: 'o', porte: 'tradicional', cidade: 'Cartago' },
      { nome: 'Pérez Zeledón', artigo: 'o', porte: 'tradicional', cidade: 'San Isidro de El General' },
      { nome: 'Puntarenas FC', artigo: 'o', porte: 'tradicional', cidade: 'Puntarenas' },
      { nome: 'San Carlos', artigo: 'o', porte: 'tradicional', cidade: 'Ciudad Quesada' },
      { nome: 'Municipal Liberia', artigo: 'o', porte: 'tradicional', cidade: 'Liberia' },
      { nome: 'Sporting FC', artigo: 'o', porte: 'regional', cidade: 'San José' },
      { nome: 'Guanacasteca', artigo: 'a', porte: 'regional', cidade: 'Nicoya' },
      { nome: 'Santos de Guápiles', artigo: 'o', porte: 'regional', cidade: 'Guápiles' }
    ]
  },
  // A CCSS ("a Caixa") cobre toda a população desde a universalização dos seguros (1961/1975).
  saude: { sistema: 'universal', redePublica: 'a CCSS', custoPlano: 1.1 },
  // Não integra nenhum bloco de livre residência da lista; residência pela Lei 8764 (Lei Geral de Migração).
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'CR',
    nome: 'Costa Rica',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 3, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.03,
    rotuloCusto: 'custas do processo sucessório (não há imposto sobre herança)',
    vacancia: 'as Juntas de Educação dos lugares onde estão os bens'
  },
  nomes: {
    cortes: [1975, 2005],
    grupos: [
      {
        id: 'cr',
        peso: 0.96,
        sobrenome: 'dois',
        ...CR_NOMES,
        sobrenomes: [
          'Rodríguez', 'Vargas', 'Jiménez', 'Mora', 'Rojas', 'González', 'Sánchez', 'Hernández', 'Solís', 'Castro',
          'Ramírez', 'Araya', 'Alvarado', 'Chaves', 'Quesada', 'Salas', 'Campos', 'Fernández', 'Arias', 'Brenes',
          'Chacón', 'Zúñiga', 'Calderón', 'Cordero', 'Arce', 'Villalobos', 'Núñez', 'Ugalde', 'Monge', 'Herrera',
          'Murillo', 'Vega', 'Méndez', 'Soto', 'Marín', 'Badilla', 'Morales', 'Segura', 'Venegas', 'Céspedes',
          'Esquivel', 'Barrantes', 'Valverde', 'Madrigal', 'Gutiérrez', 'Pérez', 'Cruz', 'Granados', 'Umaña', 'Bolaños'
        ]
      },
      {
        // Limón: a comunidade afro-caribenha, de origem jamaicana, com sobrenomes ingleses; os nomes próprios são os do país.
        id: 'cr_caribe',
        peso: 0.04,
        divisoes: ['L'],
        sobrenome: 'dois',
        ...CR_NOMES,
        sobrenomes: [
          'Brown', 'Williams', 'Smith', 'Johnson', 'Thomas', 'Campbell', 'Thompson', 'Wilson', 'Forbes', 'Bennett',
          'Grant', 'Gordon', 'Duncan', 'Mitchell', 'Robinson', 'Taylor', 'Walters', 'Wright', 'Clarke', 'Reid',
          'Simpson', 'Richards', 'Spence', 'Jackson', 'Morris', 'Myrie', 'McLean', 'Henry', 'Davis', 'Lewis',
          'Rodríguez', 'Vargas', 'Jiménez', 'Mora', 'Rojas', 'González', 'Sánchez', 'Hernández', 'Castro', 'Solís'
        ]
      }
    ]
  },
  fontes: [
    'INEC — Encuesta Nacional de Hogares (ENAHO) 2025: 15,2% dos domicílios em pobreza, 3,8% em pobreza extrema',
    'INEC — Encuesta Continua de Empleo, 4º tri 2025 (emprego informal 37,8%)',
    'Decreto Ejecutivo 45303-MTSS: salários mínimos 2026 (trabajador no calificado genérico CRC 373.092,30)',
    'Decreto Ejecutivo 45333-H: tramos do imposto sobre a renda (salários) 2026 — isento até CRC 918.000',
    'CCSS — cuotas obrero-patronales 2026 (trabalhador 10,83%: SEM 5,5%, IVM 4,33%, Banco Popular 1%)',
    'Código de Trabajo, art. 29 (cesantía); Lei 2412 (aguinaldo); Lei 7983 (Proteção ao Trabalhador); Regulamento do IVM (300 cotas, 65 anos); Lei 10159 (emprego público)',
    'Constitución Política, arts. 12, 93, 106–108; Código Municipal (Lei 7794); Código Electoral (Lei 8765)',
    'Código Civil, arts. 572 e 595; Código de Familia, art. 41',
    'Lei 8764 (Lei Geral de Migração e Estrangeiros)',
    'CONAPE; UCR/UNA — Prueba de Aptitud Académica; CEN-CINAI (Ministério da Saúde)',
    'TSE — nomes mais inscritos (2025: Luciana, Isabella; Julián, Santiago)',
    'FEDEFÚTBOL/UNAFUT — Primera División, Liga de Ascenso; LINAFA — Segunda División B e Tercera División'
  ]
};

/* ==================================================== REPÚBLICA DOMINICANA
 *
 * ECONOMIA: pobreza monetária de 17,3% em 2025 e extrema de 2,2% (Ministério
 * da Fazenda e Economia, antes MEPyD); Gini ~0,38. Informalidade 54,1%
 * (Banco Central, ENCFT, média de 2025). Inflação na meta de 4% ± 1.
 * Salário mínimo: varia pelo porte da empresa (Resolução CNS-01-2025):
 * grandes DOP 29.988, médias 27.489,60, pequenas 18.421,20, micro 16.993,20
 * desde 1/2/2026 — o jogo usa o das grandes, que é o do emprego formal típico
 * (zonas francas e hotelaria têm tabelas próprias). Regional: o Distrito
 * Nacional e a província de Santo Domingo concentram renda; o Sul
 * (Barahona) e a fronteira têm a maior pobreza; La Altagracia (Punta Cana)
 * tem custo turístico.
 *
 * TRABALHO: salário de Natal (Código de Trabalho, art. 219) = 13 salários
 * (a participação nos lucros, art. 223, só existe onde há lucro — omitida).
 * Descontos (TSS, Lei 87-01): AFP 2,87% + SFS 3,04% = 5,91%; teto de 20
 * salários mínimos cotizáveis para a pensão (DOP 464.460) e de 10 para a
 * saúde (232.230) — o jogo usa o da pensão. ISR: isento até DOP 416.220/ano
 * (34.685/mês, escala congelada; a Lei 30-26 a reforma a partir de 2027);
 * 15% e 20% nas faixas seguintes — 17% sobre o excedente é a média de quem
 * passa do piso. Auxílio de cesantia (art. 80): 21 dias de salário por ano
 * (23 depois de 5 anos) ≈ 0,9 salário por ano. Não há seguro-desemprego.
 * Aposentadoria (Lei 87-01, capitalização individual): 60 anos e 360 cotas
 * (30 anos); reposição baixa (~35%). Concurso: a Lei 41-08 de Função Pública
 * prevê concurso para a carreira administrativa, mas a maioria dos cargos
 * ainda é de livre nomeação — false.
 *
 * POLÍTICA: república presidencialista unitária. As províncias têm
 * governador NOMEADO pelo presidente e não têm assembleia — sem
 * deputado_estadual e sem governador. Município: regidor (Conselho de
 * Regidores) e alcalde, 4 anos, maior de idade (Lei 176-07, art. 37).
 * Congresso: deputado (4 anos, 25 de idade, art. 82 da Constituição) e
 * senador, um por província (4 anos, 25, art. 79). Municipais em fevereiro e
 * gerais em maio, ambas em 2028. Voto é "direito e dever" (art. 208), sem
 * sanção — false. Serviço militar voluntário.
 *
 * SUCESSÃO — Código Civil (de matriz francesa):
 *  - reserva hereditária dos filhos: 1/2 com um filho, 2/3 com dois, 3/4 com
 *    três ou mais (art. 913) — o jogo usa 2/3; na falta de filhos, os
 *    ascendentes têm reserva (art. 914–915);
 *  - CÔNJUGE: até 2023 era sucessor "irregular", só herdava na falta de
 *    parentes até o 12º grau (art. 767). A sentença TC/0267/23 do Tribunal
 *    Constitucional declarou o artigo inconstitucional e mandou o Congresso
 *    legislar; até 2026 a nova ordem não foi aprovada. ABSTRAÇÃO
 *    CONSERVADORA: o cônjuge não concorre com descendentes nem ascendentes
 *    (0) — a proteção dele no jogo é a meação;
 *  - representação; colaterais (irmãos);
 *  - regime supletivo: comunidade legal de bens — meação;
 *  - sem herdeiros, o Estado.
 *  Imposto sobre sucessões: 3% da massa líquida (Lei 2569 de 1950, DGII);
 *  com as custas notariais, ~5%.
 */
const DOMINICANA: PerfilDePais = {
  id: 'DO',
  gentilico: ['dominicano', 'dominicana'],
  idiomas: ['espanhol'],
  divisao: {
    tipo: ['província', 'províncias'],
    lista: [
      { codigo: '01', nome: 'Distrito Nacional', custo: 1.15, salario: 1.2 },
      { codigo: '32', nome: 'Santo Domingo', salario: 1.05 },
      { codigo: '25', nome: 'Santiago', salario: 1.05 },
      { codigo: '13', nome: 'La Vega' },
      { codigo: '09', nome: 'Espaillat' },
      { codigo: '06', nome: 'Duarte' },
      { codigo: '19', nome: 'Hermanas Mirabal', salario: 0.92 },
      { codigo: '18', nome: 'Puerto Plata' },
      { codigo: '12', nome: 'La Romana' },
      { codigo: '23', nome: 'San Pedro de Macorís' },
      { codigo: '11', nome: 'La Altagracia', custo: 1.1 },
      { codigo: '21', nome: 'San Cristóbal', salario: 0.95 },
      { codigo: '04', nome: 'Barahona', custo: 0.88, salario: 0.8 }
    ]
  },
  cidades: [
    ['Santo Domingo', '01', 'metropole', 'capital|sede|litoral'],
    ['Santo Domingo Este', '32', 'metropolitana', 'metro:Santo Domingo|sede|litoral'],
    ['Santiago de los Caballeros', '25', 'metropole', 'sede'],
    ['La Vega', '13', 'capital', 'sede'],
    ['Jarabacoa', '13', 'pequena'],
    ['Moca', '09', 'capital', 'sede'],
    ['San Francisco de Macorís', '06', 'polo', 'sede'],
    ['Salcedo', '19', 'pequena', 'sede'],
    ['Puerto Plata', '18', 'capital', 'sede|litoral'],
    ['La Romana', '12', 'capital', 'sede|litoral'],
    ['San Pedro de Macorís', '23', 'capital', 'sede|litoral'],
    ['Punta Cana', '11', 'polo', 'litoral'],
    ['San Cristóbal', '21', 'capital', 'sede'],
    ['Barahona', '04', 'capital', 'sede|litoral']
  ],
  economia: {
    classes: { vulneravel: 15, trabalhadora: 35, media_baixa: 26, media: 18, alta: 6 },
    moradia: 0.9,
    salarioMinimo: 29988,
    informalidade: 0.54,
    inflacao: 0.04,
    volatilidade: 0.8
  },
  trabalho: {
    mesesPagos: 13,
    contribuicao: { aliquota: [0.0591, 0.0591], teto: 464460 },
    impostoRenda: { isencao: 34685, aliquota: 0.17 },
    rescisao: { nome: 'auxílio de cesantia', mesesPorAno: 0.9 },
    previdencia: { idade: [60, 60], anos: [30, 30], reposicao: 0.35, nome: 'AFP (Sistema Dominicano de Seguridade Social)' },
    concurso: false,
    contratoFormal: 'emprego registrado na TSS'
  },
  educacao: {
    etapas: {
      fundamental: 'primário', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o centro do INAIPI', fundamental: 'a escola pública do bairro', medio: 'o liceu público' }
    },
    // A UASD (pública) e as privadas exigem a POMA, prova de orientação do MESCYT; não há ranking nacional.
    ingresso: 'candidatura',
    exame: { nome: 'POMA', artigo: 'a' },
    publicaCobra: 0.1, // a UASD cobra taxas baixas por crédito
    bolsa: { nome: 'Becas Nacionales do MESCYT', teto: 2 }, // seleção socioeconômica sem teto legal fixo — aproximação
    cotas: false,
    privadaComum: true
  },
  politica: {
    sistema: 'república presidencialista unitária',
    cargos: {
      vereador: { titulo: ['regidor', 'regidora'], anos: 4, idade: 18, casa: 'o Conselho de Regidores' },
      prefeito: { titulo: ['alcalde', 'alcaldesa'], anos: 4, idade: 18, casa: 'a Prefeitura (ayuntamiento)' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 4, idade: 25, casa: 'a Câmara de Deputados' },
      senador: { titulo: ['senador', 'senadora'], anos: 4, idade: 25, casa: 'o Senado da República' }
    },
    eleicoes: { local: [2028, 4], geral: [2028, 4] },
    mes: 4,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 18,
    forcas: { exercito: 'o Exército da República Dominicana', marinha: 'a Armada da República Dominicana', aeronautica: 'a Força Aérea da República Dominicana' },
    policia: 'a Polícia Nacional'
  },
  esporte: {
    // O beisebol, esporte nacional, está fora dos domínios do jogo; basquete, vôlei feminino e atletismo são fortes.
    popularidade: { basquete: 1.4, volei: 1.25, atletismo: 1.1, lutas: 1, futebol: 0.6, natacao: 0.6, tenis: 0.6 },
    // A LDF (desde 2015) é a única liga profissional; abaixo dela, o futebol amador da FEDOFÚTBOL.
    divisoes: ['ligas municipais amadoras', 'ligas provinciais (FEDOFÚTBOL)', 'torneio de ascenso (Segunda División)', 'Liga Dominicana de Fútbol'],
    clubes: [
      { nome: 'Cibao FC', artigo: 'o', porte: 'grande', cidade: 'Santiago de los Caballeros' },
      { nome: 'Atlético Pantoja', artigo: 'o', porte: 'grande', cidade: 'Santo Domingo' },
      { nome: 'O&M FC', artigo: 'o', porte: 'tradicional', cidade: 'Santo Domingo' },
      { nome: 'Moca FC', artigo: 'o', porte: 'tradicional', cidade: 'Moca' },
      { nome: 'Atlético Vega Real', artigo: 'o', porte: 'tradicional', cidade: 'La Vega' },
      { nome: 'Delfines del Este', artigo: 'o', porte: 'tradicional', cidade: 'La Romana' },
      { nome: 'Jarabacoa FC', artigo: 'o', porte: 'regional', cidade: 'Jarabacoa' },
      { nome: 'Atlántico FC', artigo: 'o', porte: 'regional', cidade: 'Puerto Plata' },
      { nome: 'Salcedo FC', artigo: 'o', porte: 'regional', cidade: 'Salcedo' },
      { nome: 'Atlético San Cristóbal', artigo: 'o', porte: 'regional', cidade: 'San Cristóbal' }
    ]
  },
  // SFS (Lei 87-01): o SENASA (público) cobre o regime subsidiado; os formais escolhem uma ARS.
  saude: { sistema: 'misto', redePublica: 'o SENASA', custoPlano: 0.7 },
  // Nenhum bloco da lista; residência pela Lei 285-04 (Lei Geral de Migração), por categorias.
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'DO',
    nome: 'República Dominicana',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes'],
    conjugeComDescendentes: false,
    conjugeComAscendentes: [0, 0],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.05,
    rotuloCusto: 'imposto sobre sucessões (3%) e custas notariais',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2005],
    grupos: [{
      id: 'do',
      peso: 1,
      sobrenome: 'dois',
      masc: {
        antiga: ['Juan', 'José', 'Ramón', 'Rafael', 'Pedro', 'Manuel', 'Luis', 'Francisco', 'Miguel', 'Julio', 'Antonio', 'Domingo', 'Andrés',
          'Félix', 'Pablo', 'Ángel', 'Bienvenido', 'Teodoro', 'Radhamés', 'Héctor', 'Rubén', 'Nelson', 'Fernando', 'Juan Bautista', 'Víctor', 'Darío', 'Santiago', 'Mario'],
        meio: ['Wilkin', 'Yunior', 'Franklin', 'Jonathan', 'Wilson', 'Elvis', 'Freddy', 'Robinson', 'Anderson', 'Edwin', 'Carlos', 'José Luis',
          'Ramón Antonio', 'Luis Alberto', 'Ángel', 'Alexander', 'Joel', 'Wander', 'Kelvin', 'Edward', 'Starlin', 'Manuel', 'Danny', 'Héctor', 'Rafael', 'Leonel', 'Eddy', 'Richard'],
        nova: ['Adriel', 'Noah', 'Thiago', 'Sebastián', 'Gael', 'Eithan', 'Liam', 'Mateo', 'Dylan', 'Santiago', 'Jayden', 'Lucas', 'Isaac',
          'Matías', 'Ian', 'Elian', 'Jeremy', 'Samuel', 'Daniel', 'Ángel', 'Josué', 'Caleb', 'Emmanuel', 'Iker', 'Aarón', 'Joan', 'Ezequiel', 'Jesús']
      },
      fem: {
        antiga: ['María', 'Ana', 'Altagracia', 'Mercedes', 'Juana', 'Carmen', 'Rosa', 'Josefina', 'Francisca', 'Teresa', 'Milagros', 'Luz',
          'Ramona', 'Dominga', 'Petronila', 'Margarita', 'Nidia', 'Gladys', 'Ana Julia', 'Fior', 'Bélgica', 'Dulce', 'Esperanza', 'Isabel', 'Martha', 'Rafaela', 'Ana Mercedes', 'Clara'],
        meio: ['Yokasta', 'Yudelka', 'Yahaira', 'Arelis', 'Johanna', 'Carolina', 'Patricia', 'Rosanna', 'Massiel', 'Yanet', 'Wendy', 'Paola',
          'Katherine', 'Mariela', 'Yesenia', 'Daniela', 'Lisbeth', 'Ruth', 'Esther', 'Jennifer', 'Nathaly', 'Laura', 'Elizabeth', 'Indhira', 'Wanda', 'Sandra', 'Miguelina', 'Gisselle'],
        nova: ['Adhara', 'Aitana', 'Isabella', 'Mía', 'Valentina', 'Emma', 'Alaia', 'Sofía', 'Abigail', 'Gianna', 'Ainhoa', 'Camila', 'Luna',
          'Arlette', 'Amelia', 'Aylin', 'Zoe', 'Ariana', 'Emily', 'Génesis', 'Hanna', 'Danna', 'Julieta', 'Ashley', 'Victoria', 'Alexa', 'Liah', 'Elena']
      },
      sobrenomes: [
        'Rodríguez', 'Pérez', 'Martínez', 'Santos', 'García', 'Reyes', 'Ramírez', 'Peña', 'Díaz', 'Hernández',
        'Jiménez', 'Rosario', 'De la Cruz', 'Castillo', 'Mejía', 'Sánchez', 'Batista', 'Núñez', 'Polanco', 'Encarnación',
        'Féliz', 'Guzmán', 'Medina', 'Vásquez', 'Gómez', 'Tavárez', 'Almonte', 'Then', 'Cabrera', 'Báez',
        'Paulino', 'Marte', 'Mateo', 'Disla', 'Ureña', 'Valdez', 'Taveras', 'Brito', 'Cruz', 'Matos',
        'Abreu', 'Santana', 'Ventura', 'Mercedes', 'Frías', 'De los Santos', 'Florentino', 'Liriano', 'Rivera', 'Ortiz'
      ]
    }]
  },
  fontes: [
    'Ministerio de Hacienda y Economía — Boletín de Pobreza Monetaria 2025 (17,3%; extrema 2,2%)',
    'Banco Central de la República Dominicana — ENCFT, informalidade média de 2025 (54,1%)',
    'Comité Nacional de Salarios, Resolución CNS-01-2025: salário mínimo do setor privado não sectorizado a partir de 1/2/2026',
    'TSS — topes de cotização desde fev/2026 (salário mínimo cotizável DOP 23.223; SFS 232.230; pensões 464.460); Lei 87-01 (SDSS)',
    'DGII — escala do ISR para assalariados 2026 (isenção DOP 416.220/ano); Código Tributário, art. 296; Lei 30-26 (reforma a partir de 2027)',
    'Código de Trabajo (Lei 16-92), arts. 80 (cesantía), 219 (salário de Navidad), 223 (participação nos lucros); Lei 41-08 (Função Pública)',
    'Constitución de la República (2015), arts. 79, 82, 208; Lei 176-07 (Distrito Nacional e municípios), art. 37',
    'Código Civil, arts. 767, 913–915; Tribunal Constitucional, Sentencia TC/0267/23; Lei 2569 de 1950 (impuesto sobre sucesiones, 3%, DGII)',
    'Lei 285-04 (Migração); MESCYT — POMA e Becas Nacionales; INAIPI',
    'JCE — nomes mais registrados em 2025 (Adhara, Adriel, Noah, Thiago)',
    'Liga Dominicana de Fútbol — clubes da temporada 2026–27'
  ]
};

export const PAISES: PerfilDePais[] = [COSTA_RICA, DOMINICANA];
