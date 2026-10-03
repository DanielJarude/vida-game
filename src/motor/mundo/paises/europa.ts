/**
 * EUROPA OCIDENTAL — Portugal, Espanha, França, Alemanha, Itália e Reino Unido.
 *
 * Cada perfil é o país de verdade (fontes em `fontes` e em
 * docs/notas/FONTES-PAISES-EUROPA.md). Onde a realidade é mais fina do que o
 * jogo (impostos progressivos, regras por estado/região, eleições indiretas),
 * a abstração está declarada no comentário acima do campo.
 *
 * CONVENÇÕES COMUNS AOS SEIS
 *  - Dinheiro em MOEDA LOCAL POR MÊS (o motor converte pelo `fator` do catálogo).
 *  - `impostoRenda`: a isenção é o rendimento BRUTO mensal até o qual um
 *    trabalhador solteiro, sem filhos, praticamente não paga imposto; a
 *    alíquota é a marginal da faixa em que cai um salário típico (não a
 *    máxima). Nenhum desses países tem imposto de alíquota única.
 *  - `informalidade`: a série harmonizada da OIT (ILOSTAT, emprego informal
 *    no trabalho principal) dá 2–7% para estes países; somamos uma margem
 *    pelo trabalho não declarado medido pelos institutos nacionais (ISTAT
 *    estima ~11% de unidades de trabalho irregulares na Itália). Valores
 *    modestos e arredondados.
 *  - `economia.classes`: a partir da taxa de risco de pobreza (Eurostat
 *    EU-SILC / ONS HBAI), do Gini e do peso do topo; a pobreza aqui é
 *    RELATIVA (60% da mediana), por isso a classe 'vulneravel' é menor que
 *    a taxa — boa parte desse grupo vive como 'trabalhadora' no sentido do jogo.
 *  - `moradia`: relação aluguel/preço geral comparada com a brasileira
 *    (OCDE, Affordable Housing Database; sobrecarga de custo de habitação do
 *    Eurostat). Escolhas modestas, comentadas em cada país.
 *  - `cargos.prefeito`: só onde a chefia do município sai da eleição
 *    municipal. Em Portugal, na Espanha e na França o prefeito é o cabeça da
 *    lista (ou eleito pelo conselho saído dela) — ver o comentário de cada país.
 *  - Os grupos de nomes com `divisoes` competem, dentro dessas divisões, com
 *    os grupos sem `divisoes`, na proporção do `peso`.
 */

import type { PerfilDePais } from '../tipos';

/* ================================================================ PORTUGAL */

/*
 * PORTUGAL — divisões: os 18 distritos do continente e as 2 regiões
 * autónomas (ISO 3166-2:PT usa estes 20 códigos). O distrito é hoje sobretudo
 * uma circunscrição (eleitoral, administrativa); não tem órgão eleito.
 *
 * POLÍTICA: o eleitor vota em listas para a Câmara Municipal e para a
 * Assembleia Municipal; o primeiro da lista mais votada para a Câmara é o
 * presidente da câmara (Lei Orgânica 1/2001, art. 57.º) — por isso o nível
 * 'prefeito' existe. 'deputado_estadual' foi OMITIDO: só os Açores e a
 * Madeira têm assembleia legislativa regional (CRP art. 231.º), ~5% da
 * população; o continente não tem nível legislativo intermédio. Não há
 * senado nem governador eleito.
 *
 * SUCESSÃO (Código Civil, DL 47344/1966):
 *  - herdeiros legitimários: cônjuge, descendentes e ascendentes (art. 2157.º);
 *  - legítima: cônjuge + filhos = 2/3 da herança (art. 2159.º); só filhos:
 *    1/2 (um) ou 2/3 (dois ou mais) (art. 2159.º, 2); cônjuge + ascendentes
 *    2/3 (art. 2161.º) — usamos 2/3, o caso mais comum;
 *  - cônjuge e filhos partilham por cabeça, o cônjuge nunca menos de 1/4
 *    (art. 2139.º); com ascendentes, cônjuge 2/3 e ascendentes 1/3 (art. 2142.º);
 *  - direito de representação (art. 2042.º); irmãos na 4.ª classe (art. 2133.º);
 *  - sem herdeiros, o Estado (art. 2152.º);
 *  - regime supletivo: comunhão de adquiridos (art. 1717.º) → meação.
 *  - Custo: o imposto sucessório acabou em 2004; o Imposto do Selo (10%,
 *    verba 1.2 da TGIS) isenta cônjuge, descendentes e ascendentes (CIS
 *    art. 6.º, e)). Fica uma taxa média baixa de selo e escrituras.
 *  SIMPLIFICAÇÃO: a quota mínima de 1/4 do cônjuge não é aplicada.
 */
const PORTUGAL: PerfilDePais = {
  id: 'PT',
  gentilico: ['português', 'portuguesa'],
  idiomas: ['português'],
  divisao: {
    tipo: ['distrito', 'distritos'],
    // custo/salário: INE, Inquérito às Despesas das Famílias e Quadros de
    // Pessoal — o distrito de Lisboa paga e custa ~15% acima da média; o
    // interior norte e o Alentejo abaixo; o Algarve tem habitação cara e
    // salários abaixo da média.
    lista: [
      { codigo: '01', nome: 'Aveiro' },
      { codigo: '02', nome: 'Beja', custo: 0.88, salario: 0.9 },
      { codigo: '03', nome: 'Braga', custo: 0.93, salario: 0.92 },
      { codigo: '04', nome: 'Bragança', custo: 0.85, salario: 0.86 },
      { codigo: '05', nome: 'Castelo Branco', custo: 0.88, salario: 0.88 },
      { codigo: '06', nome: 'Coimbra' },
      { codigo: '07', nome: 'Évora', custo: 0.92, salario: 0.92 },
      { codigo: '08', nome: 'Faro', custo: 1.1, salario: 0.95 },
      { codigo: '09', nome: 'Guarda', custo: 0.85, salario: 0.86 },
      { codigo: '10', nome: 'Leiria' },
      { codigo: '11', nome: 'Lisboa', custo: 1.18, salario: 1.15 },
      { codigo: '12', nome: 'Portalegre', custo: 0.85, salario: 0.87 },
      { codigo: '13', nome: 'Porto', custo: 1.05, salario: 1 },
      { codigo: '14', nome: 'Santarém', custo: 0.92, salario: 0.93 },
      { codigo: '15', nome: 'Setúbal', custo: 1.05, salario: 1 },
      { codigo: '16', nome: 'Viana do Castelo', custo: 0.9, salario: 0.9 },
      { codigo: '17', nome: 'Vila Real', custo: 0.86, salario: 0.88 },
      { codigo: '18', nome: 'Viseu', custo: 0.88, salario: 0.89 },
      { codigo: '20', nome: 'Região Autónoma dos Açores', custo: 0.95, salario: 0.92 },
      { codigo: '30', nome: 'Região Autónoma da Madeira', custo: 1, salario: 0.93 }
    ]
  },
  cidades: [
    ['Lisboa', '11', 'metropole', 'capital|sede|litoral'],
    ['Cascais', '11', 'metropolitana', 'metro:Lisboa|litoral'],
    ['Porto', '13', 'metropole', 'sede|litoral'],
    ['Braga', '03', 'capital', 'sede'],
    ['Guimarães', '03', 'polo'],
    ['Coimbra', '06', 'capital', 'sede'],
    ['Viseu', '18', 'capital', 'sede'],
    ['Évora', '07', 'capital', 'sede'],
    ['Faro', '08', 'capital', 'sede|litoral'],
    ['Portimão', '08', 'polo', 'litoral'],
    ['Funchal', '30', 'capital', 'sede|litoral'],
    ['Ponta Delgada', '20', 'capital', 'sede|litoral'],
    ['Bragança', '04', 'pequena', 'sede'],
    ['Peniche', '10', 'pequena', 'litoral']
  ],
  economia: {
    // Risco de pobreza 16,6% (INE, ICOR 2024), Gini ~32: menos pobreza
    // extrema que o Brasil, classe média mais larga e topo estreito.
    classes: { vulneravel: 12, trabalhadora: 33, media_baixa: 27, media: 20, alta: 8 },
    // Rendas subiram muito acima dos salários desde 2015 (INE, estatísticas
    // de rendas; Lisboa e Porto entre as menos acessíveis da OCDE).
    moradia: 1.4,
    salarioMinimo: 920, // RMMG 2026, DL 139/2025 (14 pagamentos/ano)
    informalidade: 0.06,
    inflacao: 0.022,
    volatilidade: 0.6
  },
  trabalho: {
    mesesPagos: 14, // subsídios de férias e de Natal (Código do Trabalho, arts. 263.º e 264.º)
    contribuicao: { aliquota: [0.11, 0.11] }, // TSU do trabalhador: 11%, sem teto
    // IRS: o mínimo de existência (CIRS art. 70.º) deixa isento ~o salário
    // mínimo anual (920 × 14 / 12 ≈ 1.073 €/mês); um salário típico cai nos
    // escalões intermédios (~26% marginal em 2026).
    impostoRenda: { isencao: 1073, aliquota: 0.26 },
    // Compensação por despedimento: 14 dias de retribuição base por ano
    // (Código do Trabalho art. 366.º, redação da Lei 13/2023) ≈ 0,47 mês/ano.
    rescisao: { nome: 'compensação por despedimento', mesesPorAno: 0.47 },
    // Subsídio de desemprego: 65% da remuneração de referência; 150 a 540
    // dias conforme idade e carreira (DL 220/2006) — ~12 meses típicos.
    seguroDesemprego: { meses: 12, reposicao: 0.65 },
    // Idade normal de acesso 66 anos e 9 meses em 2026 (Portaria 358/2024),
    // ligada à esperança de vida — arredondada para 67. Prazo de garantia de
    // 15 anos. Taxa de substituição bruta ~74% (OCDE, Pensions at a Glance).
    previdencia: { idade: [67, 67], anos: [15, 15], reposicao: 0.7, nome: 'Segurança Social' },
    concurso: true, // concurso público (Lei Geral do Trabalho em Funções Públicas)
    contratoFormal: 'contrato de trabalho com descontos'
  },
  educacao: {
    etapas: {
      fundamental: 'ensino básico', medio: 'ensino secundário', serieMedio: 'ano',
      publica: { creche: 'a creche do bairro', fundamental: 'a escola básica do agrupamento', medio: 'a escola secundária' }
    },
    // Concurso Nacional de Acesso: média do secundário + exames nacionais.
    ingresso: 'exame_nacional',
    exame: { nome: 'Concurso Nacional de Acesso', artigo: 'o' },
    // Propina máxima de licenciatura 697 €/ano vs. ~3.500–5.000 € no privado.
    publicaCobra: 0.15,
    // Bolsa da DGES: rendimento per capita ≤ 23 × IAS/ano (12.017,5 € em
    // 2025/26) ≈ 1.000 €/mês ≈ 1,1 salário mínimo.
    bolsa: { nome: 'bolsa de estudo da DGES', teto: 1.1 },
    // Contingente prioritário (2% das vagas) para beneficiários do escalão A
    // da ação social escolar (DGES, desde 2023).
    cotas: true,
    privadaComum: false // ~17% dos inscritos no superior estão no privado (DGEEC)
  },
  politica: {
    sistema: 'república semipresidencialista unitária, com regiões autónomas nos Açores e na Madeira',
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'a Câmara Municipal' },
      prefeito: { titulo: ['presidente da câmara', 'presidente da câmara'], anos: 4, idade: 18, casa: 'a Câmara Municipal' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 4, idade: 18, casa: 'a Assembleia da República' }
    },
    eleicoes: { local: [2025, 4], geral: [2029, 4] }, // autárquicas out/2025; legislativas mai/2025 → 2029
    mes: 9,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // SMO extinto em 2004 (Lei 174/99); só o Dia da Defesa Nacional é obrigatório
    idade: 18,
    forcas: { exercito: 'o Exército Português', marinha: 'a Marinha Portuguesa', aeronautica: 'a Força Aérea Portuguesa' },
    policia: 'a PSP'
  },
  esporte: {
    popularidade: { futebol: 1.4, volei: 0.8, basquete: 0.75, natacao: 0.85, atletismo: 0.95, lutas: 0.75, tenis: 0.75 },
    divisoes: ['Campeonato de Portugal', 'Liga 3', 'Liga Portugal 2', 'Primeira Liga'],
    clubes: [
      { nome: 'Benfica', artigo: 'o', porte: 'grande', cidade: 'Lisboa' },
      { nome: 'Sporting', artigo: 'o', porte: 'grande', cidade: 'Lisboa' },
      { nome: 'FC Porto', artigo: 'o', porte: 'grande', cidade: 'Porto' },
      { nome: 'Sporting de Braga', artigo: 'o', porte: 'tradicional', cidade: 'Braga' },
      { nome: 'Vitória de Guimarães', artigo: 'o', porte: 'tradicional', cidade: 'Guimarães' },
      { nome: 'Estoril Praia', artigo: 'o', porte: 'tradicional', cidade: 'Cascais' },
      { nome: 'Marítimo', artigo: 'o', porte: 'tradicional', cidade: 'Funchal' },
      { nome: 'Santa Clara', artigo: 'o', porte: 'tradicional', cidade: 'Ponta Delgada' },
      { nome: 'Académica', artigo: 'a', porte: 'regional', cidade: 'Coimbra' },
      { nome: 'Farense', artigo: 'o', porte: 'regional', cidade: 'Faro' },
      { nome: 'Portimonense', artigo: 'o', porte: 'regional', cidade: 'Portimão' },
      { nome: 'Académico de Viseu', artigo: 'o', porte: 'regional', cidade: 'Viseu' },
      { nome: 'Lusitano de Évora', artigo: 'o', porte: 'regional', cidade: 'Évora' },
      { nome: 'GD Bragança', artigo: 'o', porte: 'regional', cidade: 'Bragança' }
    ]
  },
  // Seguros privados são comuns como complemento e baratos face ao Brasil.
  saude: { sistema: 'universal', redePublica: 'o SNS', custoPlano: 0.9 },
  // UE; a autorização de residência CPLP (Lei 18/2022, Acordo de Mobilidade
  // da CPLP de 2021) facilita a entrada de cidadãos lusófonos. Desde 2024–25
  // a lei de estrangeiros ficou mais exigente (fim da manifestação de interesse).
  migracao: { blocos: ['ue', 'cplp'], abertura: 'seletiva' },
  sucessao: {
    pais: 'PT',
    nome: 'Portugal',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [2 / 3, 2 / 3],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.015,
    rotuloCusto: 'imposto do selo e custos da habilitação de herdeiros',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2000],
    neutros: ['Alex', 'Sam', 'Cris', 'Dani', 'Noa', 'Kim', 'Ariel', 'Sasha', 'Jo', 'Luz'],
    grupos: [{
      // Fontes: INE / IRN, nomes mais registados (2000–2024); para as gerações
      // antigas, Censos e listas históricas de registos civis.
      id: 'pt',
      peso: 1,
      sobrenome: 'luso',
      masc: {
        antiga: ['José', 'António', 'Manuel', 'João', 'Joaquim', 'Francisco', 'Carlos', 'Fernando', 'Jorge', 'Luís', 'Mário', 'Armando', 'Augusto', 'Alberto', 'Abílio', 'Albino',
          'Américo', 'Arnaldo', 'Domingos', 'Henrique', 'Horácio', 'Jaime', 'Júlio', 'Vítor', 'Adelino', 'Agostinho', 'Álvaro', 'Artur', 'Custódio', 'Eduardo', 'Rogério', 'Fausto'],
        meio: ['Nuno', 'Pedro', 'Ricardo', 'Miguel', 'Bruno', 'Tiago', 'Hugo', 'Paulo', 'Rui', 'Filipe', 'Sérgio', 'André', 'Diogo', 'João', 'Marco', 'Vasco', 'Gonçalo', 'Daniel',
          'Fábio', 'Hélder', 'Nélson', 'Rafael', 'Ivo', 'Joel', 'Márcio', 'Duarte', 'Gustavo', 'Rúben', 'Telmo', 'Valter', 'Leonel', 'Luís', 'Carlos'],
        nova: ['Francisco', 'João', 'Santiago', 'Afonso', 'Tomás', 'Rodrigo', 'Martim', 'Duarte', 'Lourenço', 'Miguel', 'Gabriel', 'Salvador', 'Guilherme', 'Diogo', 'Gonçalo', 'Vicente',
          'Rafael', 'Gustavo', 'Simão', 'Tiago', 'Lucas', 'Pedro', 'Henrique', 'Dinis', 'Benjamim', 'Vasco', 'Leonardo', 'Mateus', 'Manuel', 'António', 'Isaac', 'Noah', 'Enzo']
      },
      fem: {
        antiga: ['Maria', 'Ana', 'Rosa', 'Fernanda', 'Isabel', 'Teresa', 'Manuela', 'Fátima', 'Lurdes', 'Conceição', 'Graça', 'Helena', 'Alice', 'Amélia', 'Albertina', 'Ermelinda',
          'Glória', 'Irene', 'Laura', 'Lúcia', 'Margarida', 'Olinda', 'Palmira', 'Rosário', 'Natália', 'Celeste', 'Dulce', 'Emília', 'Gracinda', 'Judite'],
        meio: ['Ana', 'Sofia', 'Joana', 'Sara', 'Catarina', 'Marta', 'Inês', 'Patrícia', 'Andreia', 'Vânia', 'Sandra', 'Susana', 'Cláudia', 'Carla', 'Rita', 'Mónica', 'Filipa',
          'Diana', 'Tânia', 'Raquel', 'Liliana', 'Daniela', 'Cátia', 'Sónia', 'Vera', 'Mariana', 'Bárbara', 'Débora', 'Ana Rita', 'Sílvia', 'Helena'],
        nova: ['Maria', 'Leonor', 'Matilde', 'Beatriz', 'Carolina', 'Mariana', 'Ana', 'Inês', 'Margarida', 'Alice', 'Francisca', 'Benedita', 'Sofia', 'Lara', 'Constança', 'Laura',
          'Clara', 'Luana', 'Madalena', 'Camila', 'Carlota', 'Mafalda', 'Diana', 'Íris', 'Helena', 'Pilar', 'Teresa', 'Aurora', 'Vitória', 'Yara', 'Maria Leonor']
      },
      sobrenomes: [
        'Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques',
        'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha',
        'Raposo', 'Neves', 'Coelho', 'Cruz', 'Cunha', 'Pires', 'Ramos', 'Reis', 'Simões', 'Antunes', 'Matos', 'Fonseca', 'Machado', 'Araújo', 'Barbosa', 'Tavares',
        'Lourenço', 'Castro', 'Figueiredo', 'Azevedo', 'Freitas', 'Henriques', 'Magalhães', 'Batista'
      ]
    }]
  },
  fontes: [
    'Retribuição mínima mensal garantida 2026: DL 139/2025, de 29/12 (920 €).',
    'Idade de reforma 2026: Portaria 358/2024; prazo de garantia: DL 187/2007.',
    'Código do Trabalho (Lei 7/2009), arts. 263.º, 264.º, 366.º (Lei 13/2023); subsídio de desemprego: DL 220/2006.',
    'Código Civil, arts. 1717.º, 2042.º, 2133.º, 2139.º, 2142.º, 2152.º, 2157.º–2161.º; Código do Imposto do Selo, art. 6.º.',
    'Constituição da República Portuguesa (arts. 231.º, 239.º); Lei Orgânica 1/2001 (eleições autárquicas).',
    'DGES: Concurso Nacional de Acesso, contingente prioritário ASE e regulamento de bolsas 2025/26 (https://www.dges.gov.pt).',
    'INE: ICOR 2024 (risco de pobreza), estatísticas de rendas; OCDE, Pensions at a Glance 2023.',
    'OIT/ILOSTAT: taxa de emprego informal (2024).',
    'Liga Portugal / FPF: estrutura das competições 2025/26.'
  ]
};

/* ================================================================ ESPANHA */

/*
 * ESPANHA — divisões: as 17 comunidades autônomas (ISO 3166-2:ES; Ceuta e
 * Melilla fora da lista porque nenhuma cidade do perfil está nelas).
 *
 * POLÍTICA: o 'prefeito' (alcalde) é eleito pelos vereadores entre os
 * cabeças de lista; sem maioria absoluta, é proclamado o cabeça da lista mais
 * votada (LOREG art. 196). Ou seja, ele sai diretamente da eleição municipal
 * — mapeado como cargo da eleição local. 208 dos 266 senadores são eleitos
 * diretamente (CE art. 69); os demais são designados pelos parlamentos
 * autonômicos — o senado entra. O presidente autonômico é investido pelo
 * parlamento regional: 'governador' OMITIDO. As eleições autonômicas de
 * Andaluzia, Catalunha, Galiza, País Basco e Castela e Leão têm calendário
 * próprio; o jogo usa o das demais (maio, junto com as municipais).
 *
 * SUCESSÃO (Código Civil, direito comum; Catalunha, Aragão, Navarra, País
 * Basco, Galiza e Baleares têm direito foral próprio — não modelado):
 *  - legitimários: descendentes; na falta, ascendentes; o cônjuge viúvo em
 *    usufruto (art. 807);
 *  - legítima dos descendentes: 2/3 (1/3 estrito + 1/3 de melhora, art. 808);
 *    ascendentes 1/2 ou 1/3 (art. 809);
 *  - na sucessão sem testamento, descendentes excluem o cônjuge, que fica
 *    com o usufruto de 1/3 (art. 834); com ascendentes, usufruto de 1/2
 *    (art. 837); sem uns e outros, o cônjuge herda tudo antes dos irmãos
 *    (arts. 943–944);
 *  - representação (arts. 924–925); sem herdeiros, o Estado (art. 956);
 *  - regime supletivo: sociedade de ganhos (gananciales, art. 1316) → meação
 *    (em Catalunha, Baleares e Valência o supletivo é a separação de bens).
 *  SIMPLIFICAÇÕES: o usufruto do cônjuge NÃO é modelado (ele não recebe
 *  propriedade em concorrência — fica com a meação); o imposto de sucessões
 *  é autonômico e muitas comunidades bonificam ~99% para cônjuge e filhos:
 *  entra uma taxa média baixa.
 */
const ESPANHA: PerfilDePais = {
  id: 'ES',
  gentilico: ['espanhol', 'espanhola'],
  idiomas: ['espanhol', 'catalão', 'galego', 'basco'],
  divisao: {
    tipo: ['comunidade autônoma', 'comunidades autônomas'],
    // INE, Encuesta de Estructura Salarial e Índice de Precios de Vivienda:
    // Madrid, País Basco, Navarra e Catalunha acima; Extremadura, Canárias,
    // Andaluzia e Múrcia abaixo.
    lista: [
      { codigo: 'AN', nome: 'Andaluzia', custo: 0.9, salario: 0.9 },
      { codigo: 'AR', nome: 'Aragão' },
      { codigo: 'AS', nome: 'Astúrias', custo: 0.95, salario: 0.97 },
      { codigo: 'IB', nome: 'Ilhas Baleares', custo: 1.15, salario: 0.98 },
      { codigo: 'CN', nome: 'Canárias', custo: 0.92, salario: 0.86 },
      { codigo: 'CB', nome: 'Cantábria', custo: 0.95, salario: 0.95 },
      { codigo: 'CL', nome: 'Castela e Leão', custo: 0.9, salario: 0.93 },
      { codigo: 'CM', nome: 'Castela-La Mancha', custo: 0.87, salario: 0.9 },
      { codigo: 'CT', nome: 'Catalunha', custo: 1.15, salario: 1.08 },
      { codigo: 'EX', nome: 'Extremadura', custo: 0.82, salario: 0.85 },
      { codigo: 'GA', nome: 'Galiza', custo: 0.9, salario: 0.92 },
      { codigo: 'MD', nome: 'Comunidade de Madrid', custo: 1.25, salario: 1.18 },
      { codigo: 'MC', nome: 'Região de Múrcia', custo: 0.88, salario: 0.88 },
      { codigo: 'NC', nome: 'Navarra', custo: 1.03, salario: 1.1 },
      { codigo: 'PV', nome: 'País Basco', custo: 1.12, salario: 1.15 },
      { codigo: 'RI', nome: 'La Rioja', custo: 0.93, salario: 0.96 },
      { codigo: 'VC', nome: 'Comunidade Valenciana', custo: 0.97, salario: 0.92 }
    ]
  },
  cidades: [
    ['Madri', 'MD', 'metropole', 'capital|sede'],
    ['Getafe', 'MD', 'metropolitana', 'metro:Madri'],
    ['Barcelona', 'CT', 'metropole', 'sede|litoral'],
    ['Valência', 'VC', 'metropole', 'sede|litoral'],
    ['Sevilha', 'AN', 'capital', 'sede'],
    ['Saragoça', 'AR', 'capital', 'sede'],
    ['Bilbao', 'PV', 'polo', 'litoral'],
    ['Málaga', 'AN', 'polo', 'litoral'],
    ['Vigo', 'GA', 'polo', 'litoral'],
    ['Gijón', 'AS', 'polo', 'litoral'],
    ['Las Palmas de Gran Canaria', 'CN', 'capital', 'sede|litoral'],
    ['Pamplona', 'NC', 'capital', 'sede'],
    ['Mérida', 'EX', 'capital', 'sede'],
    ['Vila-real', 'VC', 'pequena']
  ],
  economia: {
    // Risco de pobreza ~19,7% (INE, ECV 2024), Gini ~31,5; desemprego
    // estrutural alto (~10–11%) pesa na base.
    classes: { vulneravel: 15, trabalhadora: 31, media_baixa: 26, media: 20, alta: 8 },
    // Esforço de aluguel alto nas grandes cidades (Banco de España, INE IPV).
    moradia: 1.3,
    // SMI 2026: 1.221 €/mês em 14 pagas (RD 126/2026) = 1.424,50 € em 12.
    // Guardamos o valor de cada paga (o motor multiplica por mesesPagos).
    salarioMinimo: 1221,
    informalidade: 0.06,
    inflacao: 0.027,
    volatilidade: 0.6
  },
  trabalho: {
    mesesPagos: 14, // duas pagas extraordinárias (Estatuto de los Trabajadores, art. 31)
    // Trabalhador: 4,70% contingências comuns + 1,55% desemprego + 0,10% FP
    // + 0,15% MEI = 6,50%; base máxima 2026: 5.101,20 €/mês.
    contribuicao: { aliquota: [0.065, 0.065], teto: 5101.2 },
    // IRPF: salários até ~15.876 €/ano ficam isentos pela redução por
    // rendimentos do trabalho (≈1.323 €/mês); um salário típico paga 30%
    // marginal (escala estatal + autonômica, 20.200–35.200 €).
    impostoRenda: { isencao: 1323, aliquota: 0.3 },
    // Despedimento improcedente: 33 dias por ano (máx. 24 mensalidades),
    // ET art. 56 (Lei 3/2012) ≈ 1,1 mês por ano.
    rescisao: { nome: 'indenização por despedimento improcedente (33 dias por ano)', mesesPorAno: 1.1 },
    // Prestação contributiva: 70% da base nos 6 primeiros meses, 60% depois;
    // 120 dias a 2 anos conforme cotização (LGSS arts. 269–270).
    seguroDesemprego: { meses: 12, reposicao: 0.65 },
    // Idade ordinária 66 anos e 10 meses em 2026, 67 a partir de 2027 (Lei
    // 27/2011); 15 anos de cotização mínima; reposição ~80% (OCDE).
    previdencia: { idade: [67, 67], anos: [15, 15], reposicao: 0.8, nome: 'Seguridade Social' },
    concurso: true, // oposiciones (EBEP, RDL 5/2015, art. 61)
    contratoFormal: 'contrato com alta na Seguridade Social'
  },
  educacao: {
    etapas: {
      fundamental: 'ESO', medio: 'bacharelato', serieMedio: 'ano',
      publica: { creche: 'a escola infantil pública', fundamental: 'o colégio público do bairro', medio: 'o instituto público' }
    },
    // Acesso: nota do bacharelato (60%) + PAU, a prova de acesso (antes
    // EBAU/EvAU), organizada por cada comunidade.
    ingresso: 'exame_nacional',
    exame: { nome: 'PAU', artigo: 'a' },
    // Matrícula pública ~800–1.600 €/ano (preço público autonômico) vs.
    // ~8.000–12.000 € numa universidade privada.
    publicaCobra: 0.12,
    // Bolsa geral do Ministério: limiar 2 para família de 4 ≈ 38.242 €/ano
    // (2025/26) ≈ 800 €/pessoa/mês ≈ 0,56 SMI mensal (base 12 meses).
    bolsa: { nome: 'bolsa do Ministério da Educação (beca general)', teto: 0.56 },
    cotas: false, // reservas legais só por deficiência, desporto de alto nível e maiores de 25/45
    privadaComum: false // ~22% dos estudantes de grau (SIIU, Ministério de Universidades)
  },
  politica: {
    sistema: 'monarquia parlamentar com comunidades autônomas',
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'o Ayuntamiento' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 18, casa: 'a Prefeitura (Alcaldía)' },
      deputado_estadual: { titulo: ['deputado autonômico', 'deputada autonômica'], anos: 4, idade: 18, casa: 'o parlamento da comunidade' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 4, idade: 18, casa: 'o Congresso dos Deputados' },
      senador: { titulo: ['senador', 'senadora'], anos: 4, idade: 18, casa: 'o Senado' }
    },
    eleicoes: { local: [2027, 4], geral: [2027, 4] }, // municipais mai/2027; gerais jul/2023 → até 2027
    mes: 4,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // serviço militar obrigatório suspenso desde 2002 (Lei 17/1999, RD 247/2001)
    idade: 18,
    forcas: { exercito: 'o Exército de Terra', marinha: 'a Armada', aeronautica: 'o Exército do Ar e do Espaço' },
    policia: 'a Polícia Nacional'
  },
  esporte: {
    popularidade: { futebol: 1.4, basquete: 1.3, tenis: 1.3, volei: 0.75, natacao: 0.95, atletismo: 0.9, lutas: 0.75 },
    divisoes: ['Segunda Federación', 'Primera Federación', 'Segunda División', 'Primera División'],
    clubes: [
      { nome: 'Real Madrid', artigo: 'o', porte: 'grande', cidade: 'Madri' },
      { nome: 'Atlético de Madrid', artigo: 'o', porte: 'grande', cidade: 'Madri' },
      { nome: 'Getafe', artigo: 'o', porte: 'tradicional', cidade: 'Getafe' },
      { nome: 'Barcelona', artigo: 'o', porte: 'grande', cidade: 'Barcelona' },
      { nome: 'Valencia', artigo: 'o', porte: 'tradicional', cidade: 'Valência' },
      { nome: 'Sevilla', artigo: 'o', porte: 'tradicional', cidade: 'Sevilha' },
      { nome: 'Real Betis', artigo: 'o', porte: 'tradicional', cidade: 'Sevilha' },
      { nome: 'Athletic Club', artigo: 'o', porte: 'tradicional', cidade: 'Bilbao' },
      { nome: 'Real Zaragoza', artigo: 'o', porte: 'tradicional', cidade: 'Saragoça' },
      { nome: 'Málaga', artigo: 'o', porte: 'tradicional', cidade: 'Málaga' },
      { nome: 'Celta de Vigo', artigo: 'o', porte: 'tradicional', cidade: 'Vigo' },
      { nome: 'Sporting de Gijón', artigo: 'o', porte: 'regional', cidade: 'Gijón' },
      { nome: 'Las Palmas', artigo: 'o', porte: 'tradicional', cidade: 'Las Palmas de Gran Canaria' },
      { nome: 'Osasuna', artigo: 'o', porte: 'tradicional', cidade: 'Pamplona' },
      { nome: 'Villarreal', artigo: 'o', porte: 'tradicional', cidade: 'Vila-real' },
      { nome: 'Mérida', artigo: 'o', porte: 'regional', cidade: 'Mérida' }
    ]
  },
  saude: { sistema: 'universal', redePublica: 'o Sistema Nacional de Saúde', custoPlano: 1 },
  migracao: { blocos: ['ue'], abertura: 'seletiva' },
  sucessao: {
    pais: 'ES',
    nome: 'Espanha',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: false,
    conjugeComAscendentes: [0, 0],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.03,
    rotuloCusto: 'imposto de sucessões (autonômico) e custos de cartório',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2000],
    neutros: ['Alex', 'Ariel', 'Noa', 'Dani', 'Cris', 'Sasha', 'Andy', 'Eli', 'Mar', 'Sol'],
    grupos: [
      {
        // INE, "Nombres y apellidos más frecuentes" (por década de nascimento e recém-nascidos 2023).
        id: 'es',
        peso: 1,
        sobrenome: 'dois',
        masc: {
          antiga: ['Antonio', 'José', 'Manuel', 'Francisco', 'Juan', 'Pedro', 'Jesús', 'Ángel', 'Miguel', 'Rafael', 'José Luis', 'José Antonio', 'Fernando', 'Luis', 'Julián',
            'Ramón', 'Vicente', 'Joaquín', 'Enrique', 'Andrés', 'Emilio', 'Santiago', 'Tomás', 'Salvador', 'Agustín', 'Alfonso', 'Eduardo', 'Pascual', 'Gregorio', 'Mariano'],
          meio: ['David', 'Javier', 'Daniel', 'Carlos', 'Alejandro', 'Sergio', 'Pablo', 'Jorge', 'Rubén', 'Raúl', 'Iván', 'Óscar', 'Alberto', 'Adrián', 'Diego', 'Álvaro',
            'Mario', 'Víctor', 'Roberto', 'Juan Carlos', 'Francisco Javier', 'Jesús', 'Miguel Ángel', 'Ismael', 'Héctor', 'Marcos', 'Rafael', 'Fernando', 'Ignacio', 'Gonzalo'],
          nova: ['Hugo', 'Martín', 'Lucas', 'Mateo', 'Leo', 'Daniel', 'Alejandro', 'Pablo', 'Manuel', 'Álvaro', 'Adrián', 'Enzo', 'Mario', 'Diego', 'David', 'Oliver',
            'Marcos', 'Thiago', 'Marco', 'Izan', 'Javier', 'Bruno', 'Miguel', 'Antonio', 'Gonzalo', 'Liam', 'Gael', 'Carlos', 'Juan', 'Ángel', 'Nicolás', 'Iker', 'Dylan']
        },
        fem: {
          antiga: ['María', 'Carmen', 'Josefa', 'Isabel', 'Dolores', 'Pilar', 'Teresa', 'Ana', 'Francisca', 'Antonia', 'Mercedes', 'Rosario', 'Concepción', 'Manuela', 'Encarnación',
            'Juana', 'Ángeles', 'Amparo', 'Remedios', 'Rosa', 'Julia', 'Margarita', 'Luisa', 'Esperanza', 'Asunción', 'Milagros', 'Consuelo', 'Inmaculada', 'Soledad', 'María José'],
          meio: ['Laura', 'Cristina', 'Marta', 'Sara', 'Ana', 'Elena', 'Lucía', 'Raquel', 'Silvia', 'Patricia', 'Beatriz', 'Paula', 'Andrea', 'Rocío', 'Natalia', 'Sonia',
            'Eva', 'Nuria', 'Mónica', 'Irene', 'Susana', 'Verónica', 'Lorena', 'Alba', 'Noelia', 'Marina', 'Sandra', 'Yolanda', 'Rebeca', 'Miriam', 'Vanesa'],
          nova: ['Lucía', 'Sofía', 'Martina', 'María', 'Julia', 'Paula', 'Valeria', 'Emma', 'Daniela', 'Carla', 'Alba', 'Noa', 'Alma', 'Sara', 'Carmen', 'Vega', 'Lara',
            'Mía', 'Valentina', 'Olivia', 'Claudia', 'Jimena', 'Lola', 'Chloe', 'Aitana', 'Abril', 'Ana', 'Triana', 'Elena', 'Candela', 'Alejandra', 'Vera', 'Manuela', 'Adriana']
        },
        sobrenomes: [
          'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Hernández', 'Ruiz', 'Díaz', 'Moreno',
          'Muñoz', 'Álvarez', 'Romero', 'Gutiérrez', 'Alonso', 'Navarro', 'Torres', 'Domínguez', 'Ramos', 'Vázquez', 'Ramírez', 'Gil', 'Serrano', 'Morales', 'Molina',
          'Blanco', 'Suárez', 'Castro', 'Ortega', 'Delgado', 'Ortiz', 'Marín', 'Rubio', 'Núñez', 'Medina', 'Sanz', 'Castillo', 'Iglesias', 'Cortés', 'Garrido',
          'Santos', 'Guerrero', 'Lozano', 'Cano', 'Prieto'
        ]
      },
      {
        // Idescat (nomes de recém-nascidos na Catalunha) e IBESTAT. Gerações
        // antigas mistas: sob o franquismo o registo civil impunha a forma castelhana.
        id: 'catalao',
        peso: 1.1,
        divisoes: ['CT', 'IB', 'VC'],
        sobrenome: 'dois',
        masc: {
          antiga: ['Josep', 'Joan', 'Antoni', 'Francesc', 'Joaquim', 'Ramon', 'Pere', 'Jaume', 'Miquel', 'Lluís', 'Enric', 'Manuel', 'José', 'Antonio', 'Josep Maria',
            'Salvador', 'Narcís', 'Agustí', 'Esteve', 'Ferran', 'Isidre', 'Ricard', 'Albert', 'Martí', 'Vicenç', 'Bartomeu'],
          meio: ['Jordi', 'Marc', 'David', 'Xavier', 'Sergi', 'Albert', 'Oriol', 'Pau', 'Daniel', 'Carles', 'Òscar', 'Àlex', 'Joan', 'Josep', 'Francesc', 'Ignasi', 'Gerard',
            'Roger', 'Raül', 'Jaume', 'Toni', 'Eduard', 'Arnau', 'Guillem', 'Víctor', 'Ivan', 'Ricard'],
          nova: ['Marc', 'Pol', 'Jan', 'Nil', 'Pau', 'Biel', 'Martí', 'Leo', 'Hugo', 'Lucas', 'Arnau', 'Àlex', 'Joan', 'Aleix', 'Gerard', 'Bruno', 'Oriol', 'Max', 'Liam',
            'Adrià', 'Eric', 'Guillem', 'Mateo', 'Iker', 'Roc', 'Bernat', 'Teo']
        },
        fem: {
          antiga: ['Maria', 'Montserrat', 'Rosa', 'Carme', 'Núria', 'Mercè', 'Teresa', 'Dolors', 'Josefa', 'Anna', 'Pilar', 'Isabel', 'Assumpció', 'Concepció', 'Francesca',
            'Antònia', 'Margarida', 'Rosalia', 'Joana', 'Roser', 'Glòria', 'Neus', 'Lourdes', 'Remei', 'Eulàlia', 'Catalina'],
          meio: ['Laura', 'Marta', 'Anna', 'Núria', 'Cristina', 'Sílvia', 'Mireia', 'Gemma', 'Elisabet', 'Judit', 'Sara', 'Laia', 'Míriam', 'Meritxell', 'Montse', 'Ester',
            'Raquel', 'Berta', 'Clara', 'Mònica', 'Neus', 'Paula', 'Natàlia', 'Àngels', 'Alba', 'Irene', 'Rut'],
          nova: ['Júlia', 'Martina', 'Emma', 'Laia', 'Ona', 'Jana', 'Lucía', 'Paula', 'Mia', 'Aina', 'Carla', 'Abril', 'Clàudia', 'Sara', 'Arlet', 'Berta', 'Noa', 'Lia',
            'Mar', 'Queralt', 'Bruna', 'Valèria', 'Èlia', 'Aitana', 'Nora', 'Olivia', 'Gal·la']
        },
        sobrenomes: [
          'Puig', 'Vila', 'Soler', 'Ferrer', 'Serra', 'Font', 'Roca', 'Pujol', 'Vidal', 'Sala', 'Mas', 'Riera', 'Prat', 'Bosch', 'Casas', 'Coll', 'Valls', 'Martí', 'Rovira',
          'Costa', 'Pons', 'Mir', 'Bonet', 'Planas', 'Sabaté', 'Batlle', 'Camps', 'Ribas', 'Esteve', 'Gil', 'Garcia', 'Martínez', 'López', 'Fernández', 'Sánchez',
          'Rodríguez', 'Pérez', 'Navarro', 'Moreno', 'Romero', 'Molina', 'Torres'
        ]
      },
      {
        // Eustat (nomes mais frequentes na CA de Euskadi) e Instituto de Estadística de Navarra.
        // Gerações antigas sobretudo com nomes em castelhano (registo civil pré-1977).
        id: 'basco',
        peso: 0.9,
        divisoes: ['PV', 'NC'],
        sobrenome: 'dois',
        masc: {
          antiga: ['José', 'Juan', 'José María', 'Jesús', 'Francisco', 'Manuel', 'Antonio', 'Luis', 'Ignacio', 'Javier', 'Pedro', 'Fernando', 'Miguel', 'Ángel', 'Ramón',
            'Joaquín', 'Julián', 'Santiago', 'José Luis', 'Félix', 'Juan José', 'Ricardo', 'Andrés', 'Pablo', 'Esteban', 'Martín'],
          meio: ['Iñaki', 'Jon', 'Mikel', 'Asier', 'Unai', 'Gorka', 'Aitor', 'Ander', 'Iker', 'Xabier', 'Koldo', 'Igor', 'Eneko', 'Josu', 'Ibon', 'Oier', 'Ekaitz', 'Iñigo',
            'Julen', 'Imanol', 'Andoni', 'Gaizka', 'Urko', 'Beñat', 'Haritz', 'David', 'Javier'],
          nova: ['Markel', 'Aimar', 'Unai', 'Julen', 'Oier', 'Ander', 'Mikel', 'Peio', 'Eneko', 'Iker', 'Aratz', 'Hodei', 'Beñat', 'Xabier', 'Martin', 'Ibai', 'Danel',
            'Telmo', 'Lucas', 'Hugo', 'Leo', 'Mateo', 'Oihan', 'Urko', 'Manex', 'Unax', 'Jon']
        },
        fem: {
          antiga: ['María', 'Begoña', 'Arantza', 'Itziar', 'Miren', 'Carmen', 'María Jesús', 'Mari Carmen', 'Pilar', 'Ana', 'Teresa', 'Mercedes', 'Edurne', 'Garbiñe',
            'Nekane', 'Maite', 'Izaskun', 'Josune', 'Concepción', 'Dolores', 'Isabel', 'Juana', 'Rosario', 'Amaya', 'Rosa', 'Inmaculada'],
          meio: ['Ainhoa', 'Amaia', 'Leire', 'Nerea', 'Maialen', 'Irati', 'Uxue', 'Garazi', 'Itziar', 'Idoia', 'Iratxe', 'Nagore', 'Ane', 'Oihane', 'Eider', 'Arrate',
            'Naiara', 'Haizea', 'Miren', 'Edurne', 'Lorea', 'Saioa', 'Zuriñe', 'Ainara', 'Olatz', 'Laura', 'Marta'],
          nova: ['Ane', 'June', 'Nahia', 'Irati', 'Maddi', 'Laia', 'Lucía', 'Haizea', 'Garazi', 'Ainhoa', 'Uxue', 'Nora', 'Malen', 'Izaro', 'Naroa', 'Olaia', 'Libe',
            'Enara', 'Elaia', 'Lur', 'Alaia', 'Martina', 'Sara', 'Paula', 'Leire', 'Aiora', 'Udane']
        },
        sobrenomes: [
          'Etxeberria', 'Agirre', 'Goikoetxea', 'Bilbao', 'Zubizarreta', 'Garmendia', 'Arrieta', 'Iturbe', 'Larrañaga', 'Urrutia', 'Mendizabal', 'Olaizola', 'Arana',
          'Elorza', 'Zabala', 'Uriarte', 'Ibarra', 'Echeverría', 'Aguirre', 'Gorostiza', 'Lasa', 'Ugarte', 'Arregi', 'Iriarte', 'Goñi', 'Elizondo', 'Larraza',
          'García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'Sánchez', 'Gómez', 'Ruiz', 'Díaz', 'Hernández', 'Álvarez', 'Moreno', 'Jiménez'
        ]
      },
      {
        // IGE (Instituto Galego de Estatística), nomes de recém-nascidos.
        id: 'galego',
        peso: 0.8,
        divisoes: ['GA'],
        sobrenome: 'dois',
        masc: {
          antiga: ['José', 'Manuel', 'Jesús', 'Antonio', 'Juan', 'Francisco', 'José Manuel', 'Ramón', 'Andrés', 'Benito', 'Celso', 'Ricardo', 'Severino', 'Domingo',
            'Avelino', 'Maximino', 'Camilo', 'Luis', 'Ángel', 'Alfonso', 'Eduardo', 'Gumersindo', 'Pedro', 'Daniel', 'Emilio', 'Xosé'],
          meio: ['David', 'Iago', 'Pablo', 'Diego', 'Javier', 'Brais', 'Óscar', 'Rubén', 'Adrián', 'Daniel', 'Alberto', 'Roberto', 'Marcos', 'Iván', 'Alejandro', 'Sergio',
            'Xoán', 'Antón', 'Carlos', 'Jorge', 'Manuel', 'Raúl', 'Xabier', 'Martín', 'Hugo', 'Anxo', 'Fernando'],
          nova: ['Hugo', 'Martín', 'Lucas', 'Mateo', 'Brais', 'Xoán', 'Iago', 'Antón', 'Uxío', 'Breogán', 'Pablo', 'Leo', 'Daniel', 'Thiago', 'Oliver', 'Darío', 'Simón',
            'Xián', 'Roi', 'Anxo', 'Adrián', 'Manuel', 'Marcos', 'Álvaro', 'Nicolás', 'Gael', 'Bruno']
        },
        fem: {
          antiga: ['María', 'Carmen', 'Josefa', 'Dolores', 'Manuela', 'Rosa', 'Pilar', 'Teresa', 'Ana', 'Isabel', 'Concepción', 'Mercedes', 'Remedios', 'Pura', 'Generosa',
            'Esperanza', 'Elvira', 'Lucía', 'Rosario', 'Consuelo', 'Hortensia', 'Felisa', 'Celia', 'Elena', 'Benita', 'Ramona'],
          meio: ['Laura', 'María', 'Lucía', 'Sara', 'Cristina', 'Marta', 'Raquel', 'Paula', 'Andrea', 'Iria', 'Uxía', 'Noelia', 'Patricia', 'Beatriz', 'Sabela', 'Tamara',
            'Eva', 'Silvia', 'Sonia', 'Alba', 'Nerea', 'Antía', 'Rocío', 'Natalia', 'Vanesa', 'Lorena', 'Ana'],
          nova: ['Uxía', 'Antía', 'Noa', 'Sabela', 'Iria', 'Lucía', 'Martina', 'Sofía', 'Carla', 'Valeria', 'Alba', 'Vera', 'Xiana', 'Aldara', 'Lía', 'Olivia', 'Emma', 'Sara',
            'Julia', 'Mía', 'Candela', 'Nerea', 'Daniela', 'Paula', 'Claudia', 'Laura', 'Ainhoa']
        },
        sobrenomes: [
          'Fernández', 'González', 'Rodríguez', 'López', 'Vázquez', 'Pérez', 'García', 'Martínez', 'Sánchez', 'Gómez', 'Díaz', 'Castro', 'Otero', 'Rey', 'Pazos',
          'Lorenzo', 'Iglesias', 'Varela', 'Fraga', 'Carballo', 'Souto', 'Seoane', 'Rivas', 'Barreiro', 'Méndez', 'Losada', 'Pena', 'Cid', 'Novoa', 'Blanco',
          'Álvarez', 'Domínguez', 'Rial', 'Vilas', 'Calvo', 'Mosquera', 'Couceiro', 'Bouzas', 'Ferreiro', 'Prieto', 'Graña'
        ]
      }
    ]
  },
  fontes: [
    'SMI 2026: Real Decreto 126/2026 (1.221 €/mês × 14).',
    'Orden de cotización 2026: base máxima 5.101,20 €; tipos do trabalhador (Seguridad Social).',
    'Estatuto de los Trabajadores (RDL 2/2015), arts. 31 e 56; LGSS (RDL 8/2015), arts. 269–270; Lei 27/2011 (idade de reforma).',
    'Código Civil, arts. 806–809, 834–837, 924–925, 943–944, 956, 1316; LOREG (LO 5/1985), art. 196; Constitución Española, art. 69.',
    'Ministerio de Educación: becas generales 2025/26, umbrales de renta; Ministerio de Universidades, SIIU.',
    'INE: Encuesta de Condiciones de Vida 2024; Encuesta de Estructura Salarial; "Nombres y apellidos más frecuentes".',
    'Idescat, Eustat, IGE: nomes de recém-nascidos por comunidade.',
    'RFEF / LaLiga: estrutura das competições 2025/26.'
  ]
};

/* ================================================================ FRANÇA */

/*
 * FRANÇA — divisões: as 13 regiões metropolitanas (ISO 3166-2:FR). Os
 * departamentos (2.º nível) e os territórios ultramarinos não são modelados.
 *
 * POLÍTICA: nos municípios com 1.000+ habitantes vota-se em listas; a lista
 * vencedora recebe metade das cadeiras de bônus (Code électoral, art. L262)
 * e o conselho municipal elege o maire (CGCT art. L2122-7) — na prática o
 * cabeça dessa lista. Mapeamos 'prefeito' como cargo da eleição municipal,
 * com essa ressalva. 'deputado_estadual' = conselheiro regional, eleito
 * diretamente por listas (Code électoral, art. L338). O presidente do
 * conselho regional é eleito pelo conselho: 'governador' OMITIDO. O Senado é
 * eleito indiretamente por grandes eleitores (Constituição, art. 24):
 * 'senador' OMITIDO.
 *
 * SUCESSÃO (Code civil):
 *  - reserva hereditária dos filhos: 1/2 (um filho), 2/3 (dois), 3/4 (três
 *    ou mais) (art. 913) — usamos 2/3; sem descendentes, o cônjuge é
 *    herdeiro reservatário de 1/4 (art. 914-1); os ascendentes deixaram de
 *    ser reservatários em 2006;
 *  - cônjuge com filhos comuns: escolhe o usufruto do todo ou 1/4 em
 *    propriedade (art. 757) — aproximado pela concorrência por cabeça;
 *  - com os pais do falecido: cônjuge 1/2 (os dois vivos) ou 3/4 (um só)
 *    (art. 757-1); sem descendentes nem pais, o cônjuge exclui os irmãos
 *    (art. 757-2);
 *  - representação (art. 751); sem herdeiros, o Estado (art. 768);
 *  - regime legal: comunhão reduzida aos adquiridos (art. 1400) → meação.
 *  - Custo: direitos de sucessão (CGI art. 777): cônjuge isento; filhos com
 *    abatimento de 100.000 € e escala de 5–45% — média modesta + notário.
 */
const FRANCA: PerfilDePais = {
  id: 'FR',
  gentilico: ['francês', 'francesa'],
  idiomas: ['francês'],
  divisao: {
    tipo: ['região', 'regiões'],
    // INSEE: Île-de-France com salário médio ~30% acima e habitação muito
    // mais cara; Hauts-de-France e Occitânia com rendimento abaixo da média.
    lista: [
      { codigo: 'ARA', nome: 'Auvérnia-Ródano-Alpes' },
      { codigo: 'BFC', nome: 'Borgonha-Franco-Condado', custo: 0.9, salario: 0.92 },
      { codigo: 'BRE', nome: 'Bretanha', custo: 0.92, salario: 0.93 },
      { codigo: 'CVL', nome: 'Centro-Vale do Loire', custo: 0.9, salario: 0.92 },
      { codigo: 'COR', nome: 'Córsega', custo: 1, salario: 0.9 },
      { codigo: 'GES', nome: 'Grande Leste', custo: 0.92, salario: 0.94 },
      { codigo: 'HDF', nome: 'Altos da França', custo: 0.88, salario: 0.92 },
      { codigo: 'IDF', nome: 'Île-de-France', custo: 1.3, salario: 1.3 },
      { codigo: 'NOR', nome: 'Normandia', custo: 0.9, salario: 0.92 },
      { codigo: 'NAQ', nome: 'Nova Aquitânia', custo: 0.93, salario: 0.92 },
      { codigo: 'OCC', nome: 'Occitânia', custo: 0.95, salario: 0.92 },
      { codigo: 'PDL', nome: 'País do Loire', custo: 0.93, salario: 0.93 },
      { codigo: 'PAC', nome: 'Provença-Alpes-Costa Azul', custo: 1.05, salario: 0.97 }
    ]
  },
  cidades: [
    ['Paris', 'IDF', 'metropole', 'capital|sede'],
    ['Saint-Ouen-sur-Seine', 'IDF', 'metropolitana', 'metro:Paris'],
    ['Lyon', 'ARA', 'metropole', 'sede'],
    ['Marselha', 'PAC', 'metropole', 'sede|litoral'],
    ['Toulouse', 'OCC', 'capital', 'sede'],
    ['Lille', 'HDF', 'capital', 'sede'],
    ['Bordéus', 'NAQ', 'capital', 'sede'],
    ['Nantes', 'PDL', 'capital', 'sede'],
    ['Estrasburgo', 'GES', 'capital', 'sede'],
    ['Rennes', 'BRE', 'capital', 'sede'],
    ['Nice', 'PAC', 'polo', 'litoral'],
    ['Saint-Étienne', 'ARA', 'polo'],
    ['Lens', 'HDF', 'pequena'],
    ['Auxerre', 'BFC', 'pequena']
  ],
  economia: {
    // Risco de pobreza ~15% (INSEE/Eurostat 2023), Gini ~30 depois das
    // transferências: base vulnerável menor, classe média larga.
    classes: { vulneravel: 11, trabalhadora: 28, media_baixa: 28, media: 24, alta: 9 },
    // Habitação cara em Paris e nas metrópoles, mas com habitação social
    // ampla (HLM, ~17% dos domicílios).
    moradia: 1.25,
    salarioMinimo: 1823, // SMIC bruto mensal, 35 h/semana, 1/1/2026 (12,02 €/h)
    informalidade: 0.04,
    inflacao: 0.015,
    volatilidade: 0.5
  },
  trabalho: {
    mesesPagos: 12, // 13.º mês só por convenção coletiva, não pela lei
    // Contribuições do assalariado (velhice, complementar Agirc-Arrco,
    // desemprego via CSG) + CSG/CRDS ≈ 21–23% do bruto. A CSG não tem teto;
    // o teto da Segurança Social (PASS 2026, 4.005 €/mês) só reduz algumas
    // linhas — sem teto no jogo.
    contribuicao: { aliquota: [0.21, 0.23] },
    // Imposto de renda: 0% até ~11.600 € de renda tributável por parte
    // (≈1.100 € brutos/mês para um solteiro após o abatimento de 10%); 11%
    // é a faixa em que cai a maior parte dos assalariados.
    impostoRenda: { isencao: 1100, aliquota: 0.11 },
    // Indemnité légale de licenciement: 1/4 de mês por ano até 10 anos,
    // 1/3 depois (Code du travail, R1234-2), com 8 meses de casa.
    rescisao: { nome: 'indenização legal de demissão (indemnité de licenciement)', mesesPorAno: 0.25 },
    // ARE (France Travail): ~57–75% do salário de referência; até 18 meses
    // abaixo dos 55 anos (regras de 2023–2025).
    seguroDesemprego: { meses: 18, reposicao: 0.6 },
    // Idade legal: a reforma de 2023 (64 anos) foi SUSPENSA pela LFSS 2026
    // até janeiro de 2028 — 62 anos e 9 meses para a geração 1964 →
    // arredondado para 63. Não há tempo mínimo de contribuição para uma
    // pensão (reduzida); a taxa cheia exige 170 trimestres ou 67 anos —
    // o jogo usa 1 ano como piso. Reposição bruta ~57% (OCDE).
    previdencia: { idade: [63, 63], anos: [1, 1], reposicao: 0.57, nome: 'Assurance retraite' },
    concurso: true, // concours da função pública (Code général de la fonction publique, L320-1)
    contratoFormal: 'contrato de trabalho (CDI)'
  },
  educacao: {
    etapas: {
      fundamental: 'collège', medio: 'liceu', serieMedio: 'ano',
      publica: { creche: 'a creche municipal', fundamental: 'o collège público do bairro', medio: 'o liceu público' }
    },
    // O baccalauréat dá direito à universidade, mas a vaga se disputa por
    // candidatura com notas e dossiê na plataforma Parcoursup (Lei ORE 2018).
    ingresso: 'candidatura',
    exame: { nome: 'bac', artigo: 'o' },
    // Matrícula de licence: 178 €/ano (2025/26) vs. ~8.000–15.000 € numa
    // escola privada de comércio ou engenharia.
    publicaCobra: 0.02,
    // Bourse sur critères sociaux (CROUS): teto do escalão 0 bis ~35–39 mil €
    // de renda bruta global (conforme pontos de encargo), ≈ 0,45 SMIC por pessoa
    // numa família de quatro.
    bolsa: { nome: 'bolsa sobre critérios sociais (CROUS)', teto: 0.45 },
    // Lei ORE (2018): taxa mínima de bolsistas do liceu em cada formação no Parcoursup.
    cotas: true,
    privadaComum: false // ~26% dos estudantes do superior no privado (MESR, 2024), sobretudo escolas de comércio
  },
  politica: {
    sistema: 'república semipresidencialista unitária',
    cargos: {
      vereador: { titulo: ['conselheiro municipal', 'conselheira municipal'], anos: 6, idade: 18, casa: 'o conselho municipal' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 6, idade: 18, casa: 'a Mairie' },
      deputado_estadual: { titulo: ['conselheiro regional', 'conselheira regional'], anos: 6, idade: 18, casa: 'o conselho regional' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 5, idade: 18, casa: 'a Assembleia Nacional' }
    },
    // Municipais mar/2026 (6 anos); legislativas jun/2024 após dissolução →
    // fim normal da legislatura em 2029.
    eleicoes: { local: [2026, 6], geral: [2029, 5] },
    mes: 5,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Serviço suspenso desde 1997 (Lei 97-1019); restam o recenseamento aos
    // 16 anos e a Journée défense et citoyenneté, sem incorporação.
    servico: 'voluntario',
    idade: 18,
    forcas: { exercito: 'o Exército de Terra', marinha: 'a Marinha Nacional', aeronautica: 'a Força Aérea e Espacial' },
    policia: 'a Polícia Nacional'
  },
  esporte: {
    // Judô: a França tem a maior federação de judô da Europa (FFJDA); tênis:
    // FFT entre as maiores federações do país.
    popularidade: { futebol: 1.3, basquete: 1.1, tenis: 1.2, lutas: 1.2, natacao: 1, atletismo: 1, volei: 0.9 },
    divisoes: ['National 2', 'National', 'Ligue 2', 'Ligue 1'],
    clubes: [
      { nome: 'Paris Saint-Germain', artigo: 'o', porte: 'grande', cidade: 'Paris' },
      { nome: 'Red Star', artigo: 'o', porte: 'regional', cidade: 'Saint-Ouen-sur-Seine' },
      { nome: 'Olympique de Marseille', artigo: 'o', porte: 'grande', cidade: 'Marselha' },
      { nome: 'Olympique Lyonnais', artigo: 'o', porte: 'grande', cidade: 'Lyon' },
      { nome: 'Saint-Étienne', artigo: 'o', porte: 'tradicional', cidade: 'Saint-Étienne' },
      { nome: 'Girondins de Bordeaux', artigo: 'o', porte: 'tradicional', cidade: 'Bordéus' },
      { nome: 'Lille', artigo: 'o', porte: 'tradicional', cidade: 'Lille' },
      { nome: 'Nantes', artigo: 'o', porte: 'tradicional', cidade: 'Nantes' },
      { nome: 'Strasbourg', artigo: 'o', porte: 'tradicional', cidade: 'Estrasburgo' },
      { nome: 'Stade Rennais', artigo: 'o', porte: 'tradicional', cidade: 'Rennes' },
      { nome: 'Nice', artigo: 'o', porte: 'tradicional', cidade: 'Nice' },
      { nome: 'Toulouse', artigo: 'o', porte: 'tradicional', cidade: 'Toulouse' },
      { nome: 'Lens', artigo: 'o', porte: 'tradicional', cidade: 'Lens' },
      { nome: 'Auxerre', artigo: 'o', porte: 'regional', cidade: 'Auxerre' }
    ]
  },
  // Assurance Maladie para todos (PUMa) + complementar (mutuelle) quase universal.
  saude: { sistema: 'universal', redePublica: 'a Assurance Maladie', custoPlano: 1.2 },
  migracao: { blocos: ['ue'], abertura: 'seletiva' },
  sucessao: {
    pais: 'FR',
    nome: 'França',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 2, 3 / 4],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.05,
    rotuloCusto: 'direitos de sucessão e honorários do notário',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1970, 1995],
    neutros: ['Camille', 'Dominique', 'Claude', 'Sacha', 'Alix', 'Charlie', 'Eden', 'Noa', 'Lou', 'Morgan', 'Andréa', 'Maxime'],
    grupos: [
      {
        // INSEE, Fichier des prénoms (1900–2024).
        id: 'fr',
        peso: 1,
        sobrenome: 'um',
        masc: {
          antiga: ['Jean', 'Pierre', 'Michel', 'André', 'Philippe', 'Alain', 'Bernard', 'Jacques', 'Daniel', 'Claude', 'Gérard', 'René', 'Patrick', 'Christian', 'Robert',
            'Louis', 'Marcel', 'Henri', 'Georges', 'Roger', 'Jean-Claude', 'Jean-Pierre', 'Serge', 'Guy', 'Gilbert', 'Maurice', 'Paul', 'Yves', 'Joël', 'Dominique'],
          meio: ['Nicolas', 'Sébastien', 'Julien', 'Christophe', 'Stéphane', 'David', 'Frédéric', 'Laurent', 'Olivier', 'Jérôme', 'Cédric', 'Guillaume', 'Mathieu', 'Thomas',
            'Romain', 'Anthony', 'Vincent', 'Kevin', 'Maxime', 'Alexandre', 'Benjamin', 'Arnaud', 'Fabien', 'Damien', 'Ludovic', 'Jérémy', 'Florian', 'Grégory', 'Mickaël', 'Yann'],
          nova: ['Gabriel', 'Léo', 'Raphaël', 'Louis', 'Arthur', 'Jules', 'Adam', 'Maël', 'Lucas', 'Hugo', 'Noah', 'Liam', 'Sacha', 'Gabin', 'Nathan', 'Théo', 'Tom',
            'Paul', 'Mathis', 'Enzo', 'Ethan', 'Aaron', 'Nolan', 'Timéo', 'Victor', 'Martin', 'Axel', 'Léon', 'Antoine', 'Clément', 'Baptiste', 'Valentin', 'Eden']
        },
        fem: {
          antiga: ['Marie', 'Jeanne', 'Françoise', 'Monique', 'Catherine', 'Nathalie', 'Isabelle', 'Sylvie', 'Martine', 'Christine', 'Nicole', 'Jacqueline', 'Michèle',
            'Danielle', 'Brigitte', 'Chantal', 'Annie', 'Simone', 'Yvette', 'Suzanne', 'Madeleine', 'Denise', 'Colette', 'Josiane', 'Joëlle', 'Évelyne', 'Marie-Claude', 'Anne', 'Odette'],
          meio: ['Céline', 'Aurélie', 'Stéphanie', 'Sandrine', 'Émilie', 'Julie', 'Sophie', 'Virginie', 'Élodie', 'Nathalie', 'Audrey', 'Laetitia', 'Karine', 'Vanessa',
            'Mélanie', 'Caroline', 'Delphine', 'Valérie', 'Séverine', 'Laure', 'Anaïs', 'Marion', 'Camille', 'Pauline', 'Amandine', 'Jessica', 'Élise', 'Claire', 'Charlotte', 'Sarah'],
          nova: ['Jade', 'Louise', 'Emma', 'Ambre', 'Alice', 'Rose', 'Anna', 'Alba', 'Romy', 'Lina', 'Léa', 'Chloé', 'Inès', 'Mia', 'Mila', 'Lou', 'Julia', 'Manon',
            'Camille', 'Zoé', 'Léna', 'Juliette', 'Agathe', 'Margaux', 'Clara', 'Iris', 'Lucie', 'Sarah', 'Lola', 'Eva', 'Victoire', 'Romane', 'Mathilde']
        },
        sobrenomes: [
          'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David',
          'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefèvre', 'Faure', 'André', 'Mercier',
          'Blanc', 'Guérin', 'Boyer', 'Garnier', 'Chevalier', 'François', 'Legrand', 'Gauthier', 'Garcia', 'Perrin', 'Robin', 'Clément', 'Morin', 'Nicolas', 'Henry',
          'Roussel', 'Mathieu', 'Masson', 'Le Gall', 'Le Goff', 'Da Silva', 'Martinez', 'Lopez'
        ]
      },
      {
        // Franceses de família de origem magrebina (Argélia, Marrocos,
        // Tunísia): ~10% dos nascimentos têm prenome de origem árabe-berbere
        // (INSEE, Fichier des prénoms; INSEE/INED, Trajectoires et Origines 2).
        id: 'fr_magrebino',
        peso: 0.1,
        sobrenome: 'um',
        masc: {
          antiga: ['Mohamed', 'Ahmed', 'Ali', 'Rachid', 'Abdelkader', 'Mustapha', 'Saïd', 'Omar', 'Brahim', 'Lahcen', 'Abdallah', 'Hocine', 'Belkacem', 'Mohand', 'Kamel',
            'Djamel', 'Larbi', 'Messaoud', 'Tahar', 'Salah', 'Youcef', 'Hassan', 'Driss', 'Boualem', 'Amar', 'Mokhtar'],
          meio: ['Karim', 'Mehdi', 'Nabil', 'Samir', 'Farid', 'Rachid', 'Mourad', 'Sofiane', 'Nordine', 'Yacine', 'Hakim', 'Bilal', 'Malik', 'Khaled', 'Fouad', 'Hicham',
            'Yassine', 'Walid', 'Salim', 'Redouane', 'Mounir', 'Amine', 'Riad', 'Nassim', 'Kader', 'Mohamed', 'Abdel'],
          nova: ['Adam', 'Mohamed', 'Ayoub', 'Yanis', 'Ilyes', 'Imran', 'Rayan', 'Amir', 'Ismaël', 'Ibrahim', 'Youssef', 'Nassim', 'Sofiane', 'Bilal', 'Ayman', 'Zakaria',
            'Anas', 'Mehdi', 'Hamza', 'Ilyan', 'Idriss', 'Younes', 'Aylan', 'Naïm', 'Malik', 'Issa', 'Kaïs']
        },
        fem: {
          antiga: ['Fatima', 'Khadija', 'Aïcha', 'Zohra', 'Fatiha', 'Malika', 'Yamina', 'Zineb', 'Rachida', 'Saïda', 'Naïma', 'Nadia', 'Houria', 'Djamila', 'Ouardia',
            'Zahia', 'Hafida', 'Fadila', 'Leïla', 'Messaouda', 'Halima', 'Zoubida', 'Keltoum', 'Louisa', 'Taous', 'Rabia'],
          meio: ['Samira', 'Nadia', 'Karima', 'Leïla', 'Souad', 'Sabrina', 'Farida', 'Nora', 'Myriam', 'Amel', 'Hayat', 'Siham', 'Sonia', 'Linda', 'Kahina', 'Soraya',
            'Sarah', 'Yasmina', 'Nawel', 'Hanane', 'Wafa', 'Assia', 'Dounia', 'Imane', 'Meriem', 'Houda', 'Rym'],
          nova: ['Inaya', 'Lina', 'Assia', 'Aya', 'Nour', 'Maryam', 'Sofia', 'Inès', 'Yasmine', 'Kenza', 'Amira', 'Lyna', 'Imane', 'Sarah', 'Aïcha', 'Malak', 'Hiba',
            'Ilyana', 'Shaïna', 'Aliya', 'Myriam', 'Selma', 'Rania', 'Salma', 'Meryem', 'Hana', 'Nahia']
        },
        sobrenomes: [
          'Benali', 'Haddad', 'Mansouri', 'Belkacem', 'Bouzid', 'Amrani', 'Benamar', 'Brahimi', 'Cherif', 'Saidi', 'Hamidi', 'Khelifi', 'Mebarki', 'Bensaïd', 'Ouali',
          'Aït Ali', 'Bouaziz', 'Rahmani', 'Zerrouki', 'Boudjema', 'Meziane', 'Lounis', 'Belaïd', 'Djebbar', 'Hadjadj', 'Taleb', 'Benyahia', 'Ziani', 'Chaoui', 'Kaci',
          'Belhadj', 'Benmoussa', 'El Amrani', 'El Idrissi', 'Bennani', 'Alaoui', 'Tahiri', 'Berrada', 'Ouazzani', 'Trabelsi', 'Ben Salah', 'Jebali'
        ]
      }
    ]
  },
  fontes: [
    'SMIC 1/1/2026: 12,02 €/h, 1.823,03 € brutos/mês (info.gouv.fr).',
    'LFSS 2026: suspensão da reforma das aposentadorias de 2023 (idade legal 62 anos e 9 meses para a geração 1964).',
    'Code du travail, L1234-9 e R1234-2; Code électoral, L262 e L338; CGCT, L2122-7; Constituição de 1958, art. 24.',
    'Code civil, arts. 751, 757, 757-1, 757-2, 768, 913, 914-1, 1400; CGI, art. 777.',
    'Parcoursup / Lei ORE (2018); CROUS, barème des bourses 2025/26; MESR, estatísticas do ensino superior privado.',
    'INSEE: Fichier des prénoms; taxa de pobreza 2023; Trajectoires et Origines 2 (INED/INSEE).',
    'FFF / LFP: estrutura das competições 2025/26; FFJDA e FFT (licenças).'
  ]
};

/* ================================================================ ALEMANHA */

/*
 * ALEMANHA — divisões: os 16 Länder (ISO 3166-2:DE). Berlim, Hamburgo e
 * Bremen são cidades-estado (o "Landtag" delas é a Abgeordnetenhaus ou a
 * Bürgerschaft).
 *
 * POLÍTICA: o Bürgermeister é eleito diretamente em todos os Länder
 * (mandatos de 5 a 8 anos e idade mínima de 18 a 25 anos conforme a lei
 * municipal de cada Land — o jogo usa 6 anos e 21). Landtag: 5 anos (Bremen
 * 4). Bundestag: até 4 anos, idade 18 (GG art. 38–39). O Bundesrat é formado
 * por membros dos governos estaduais (GG art. 51): 'senador' OMITIDO. O
 * Ministerpräsident é eleito pelo Landtag: 'governador' OMITIDO. As
 * eleições municipais seguem o calendário de cada Land (referência: a
 * Renânia do Norte-Vestfália, set/2025, 5 anos).
 *
 * SUCESSÃO (BGB):
 *  - Pflichtteil: metade da quota legal, para descendentes, pais (só sem
 *    descendentes) e cônjuge (§ 2303) → legítima 1/2;
 *  - cônjuge com descendentes: 1/4 (§ 1931) + 1/4 de compensação dos
 *    aquestos no regime legal de Zugewinngemeinschaft (§ 1371) = 1/2;
 *    com pais: 1/2 + 1/4 = 3/4;
 *  - representação (§ 1924 III); irmãos na 2.ª ordem (§ 1925);
 *  - sem herdeiros, o Land (Fiskus, § 1936).
 *  SIMPLIFICAÇÕES: o regime legal é de bens separados com compensação no
 *  fim — sem meação ('meacao' false); o quarto extra do § 1371 entra na
 *  quota do cônjuge com os pais (3/4); com descendentes o jogo reparte por
 *  cabeça (exato com um filho, abaixo da lei com mais filhos). Imposto de
 *  herança (ErbStG): isenções de 500 mil € (cônjuge) e 400 mil € (filho)
 *  deixam a maioria das heranças sem imposto → taxa média baixa.
 */
const ALEMANHA: PerfilDePais = {
  id: 'DE',
  gentilico: ['alemão', 'alemã'],
  idiomas: ['alemão'],
  divisao: {
    tipo: ['estado', 'estados'],
    // Destatis (Verdiensterhebung) e Bundesbank: salários no leste ~15%
    // abaixo; Hamburgo, Hesse, Baviera e Baden-Württemberg acima; aluguel
    // alto em Munique, Frankfurt, Hamburgo, Berlim.
    lista: [
      { codigo: 'BW', nome: 'Baden-Württemberg', custo: 1.08, salario: 1.08 },
      { codigo: 'BY', nome: 'Baviera', custo: 1.1, salario: 1.07 },
      { codigo: 'BE', nome: 'Berlim', custo: 1.08, salario: 1 },
      { codigo: 'BB', nome: 'Brandemburgo', custo: 0.9, salario: 0.87 },
      { codigo: 'HB', nome: 'Bremen', salario: 1.02 },
      { codigo: 'HH', nome: 'Hamburgo', custo: 1.12, salario: 1.12 },
      { codigo: 'HE', nome: 'Hesse', custo: 1.06, salario: 1.08 },
      { codigo: 'MV', nome: 'Mecklemburgo-Pomerânia Ocidental', custo: 0.87, salario: 0.84 },
      { codigo: 'NI', nome: 'Baixa Saxônia', custo: 0.95, salario: 0.96 },
      { codigo: 'NW', nome: 'Renânia do Norte-Vestfália' },
      { codigo: 'RP', nome: 'Renânia-Palatinado', custo: 0.96, salario: 0.98 },
      { codigo: 'SL', nome: 'Sarre', custo: 0.92, salario: 0.96 },
      { codigo: 'SN', nome: 'Saxônia', custo: 0.88, salario: 0.86 },
      { codigo: 'ST', nome: 'Saxônia-Anhalt', custo: 0.86, salario: 0.85 },
      { codigo: 'SH', nome: 'Schleswig-Holstein', custo: 0.98, salario: 0.95 },
      { codigo: 'TH', nome: 'Turíngia', custo: 0.86, salario: 0.85 }
    ]
  },
  cidades: [
    ['Berlim', 'BE', 'metropole', 'capital|sede'],
    ['Hamburgo', 'HH', 'metropole', 'sede|litoral'],
    ['Munique', 'BY', 'metropole', 'sede'],
    ['Colônia', 'NW', 'metropole'],
    ['Frankfurt', 'HE', 'metropole'],
    ['Stuttgart', 'BW', 'capital', 'sede'],
    ['Düsseldorf', 'NW', 'capital', 'sede'],
    ['Dortmund', 'NW', 'polo'],
    ['Leipzig', 'SN', 'polo'],
    ['Dresden', 'SN', 'capital', 'sede'],
    ['Bremen', 'HB', 'capital', 'sede|litoral'],
    ['Hanôver', 'NI', 'capital', 'sede'],
    ['Freiburg im Breisgau', 'BW', 'polo'],
    ['Heidenheim an der Brenz', 'BW', 'pequena']
  ],
  economia: {
    // Risco de pobreza ~15,5% (Destatis, Mikrozensus/EU-SILC 2024), Gini ~29.
    classes: { vulneravel: 10, trabalhadora: 28, media_baixa: 28, media: 25, alta: 9 },
    // A maioria aluga (~53% de inquilinos); aluguel subiu forte nas grandes
    // cidades, mas o país tem regulação (Mietpreisbremse) e oferta fora delas.
    moradia: 1.15,
    // Mindestlohn 2026: 13,90 €/h (Mindestlohnkommission, 2025;
    // MiLoAnpV 5) × 40 h × 52 / 12 ≈ 2.409 €/mês.
    salarioMinimo: 2409,
    informalidade: 0.04,
    inflacao: 0.022,
    volatilidade: 0.5
  },
  trabalho: {
    mesesPagos: 12, // Weihnachtsgeld/Urlaubsgeld só por contrato ou convenção
    // Parte do empregado: aposentadoria 9,3% + saúde 7,3% + adicional médio
    // ~1,45% + cuidados 1,8% (2,4% sem filhos) + desemprego 1,3% ≈ 20–21,5%.
    // Teto da aposentadoria 2026: 8.450 €/mês (saúde/cuidados: 5.812,50 €).
    contribuicao: { aliquota: [0.2, 0.215], teto: 8450 },
    // Grundfreibetrag 2026: 12.348 €/ano; com os abatimentos-padrão um
    // empregado solteiro não paga imposto até ~1.400 € brutos/mês. Marginal
    // de um salário típico ~30% (escala contínua de 14% a 42%).
    impostoRenda: { isencao: 1400, aliquota: 0.3 },
    // Sem indenização legal geral: a proteção é contra a demissão (KSchG).
    // Na demissão por motivos operacionais o empregador pode oferecer meio
    // salário por ano (§ 1a KSchG) — o valor de referência dos acordos.
    rescisao: { nome: 'Abfindung (meio salário por ano de casa)', mesesPorAno: 0.5 },
    // Arbeitslosengeld I: 60% (67% com filhos) do salário LÍQUIDO ≈ 40% do
    // bruto; 12 meses abaixo dos 50 anos (SGB III, §§ 147, 149).
    seguroDesemprego: { meses: 12, reposicao: 0.4 },
    // Regelaltersgrenze sobe para 67 (nascidos a partir de 1964; SGB VI
    // § 235); carência mínima de 5 anos (§ 50). Reposição bruta ~43% (OCDE).
    previdencia: { idade: [67, 67], anos: [5, 5], reposicao: 0.43, nome: 'Deutsche Rentenversicherung' },
    // O serviço público recruta por candidatura e estágio preparatório
    // (Vorbereitungsdienst), não por concurso público de provas no sentido brasileiro.
    concurso: false,
    contratoFormal: 'emprego com seguro social (sozialversicherungspflichtig)'
  },
  educacao: {
    etapas: {
      fundamental: 'Grundschule', medio: 'Gymnasium', serieMedio: 'ano',
      publica: { creche: 'a Kita do bairro', fundamental: 'a Grundschule do bairro', medio: 'o Gymnasium público' }
    },
    // Com o Abitur, candidata-se curso a curso; nos cursos com numerus
    // clausus a nota do Abitur decide (Hochschulstart para medicina).
    ingresso: 'candidatura',
    exame: { nome: 'Abitur', artigo: 'o' },
    publicaCobra: 0, // sem mensalidade (só a taxa semestral de ~150–350 €)
    // BAföG: metade bolsa, metade empréstimo sem juros; depende da renda dos
    // pais — abstraído como ~0,6 salário mínimo por pessoa.
    bolsa: { nome: 'BAföG', teto: 0.6 },
    credito: { nome: 'KfW-Studienkredit' },
    cotas: false,
    privadaComum: false // ~13% dos estudantes em instituições privadas (Destatis 2024)
  },
  politica: {
    sistema: 'república parlamentar federal',
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 5, idade: 18, casa: 'o conselho municipal (Gemeinderat)' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 6, idade: 21, casa: 'a prefeitura (Rathaus)' },
      deputado_estadual: { titulo: ['deputado estadual', 'deputada estadual'], anos: 5, idade: 18, casa: 'o Landtag' },
      deputado_federal: { titulo: ['deputado federal', 'deputada federal'], anos: 4, idade: 18, casa: 'o Bundestag' }
    },
    eleicoes: { local: [2025, 5], geral: [2029, 4] }, // Bundestag fev/2025 (antecipada) → 2029
    mes: 8,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    // Wehrpflicht suspensa desde 2011; a Lei de Modernização do Serviço
    // Militar (WDModG, em vigor em 1/1/2026) obriga os homens a responder um
    // questionário aos 18 anos e, a partir de 1/7/2027, a exame de aptidão;
    // o serviço segue voluntário, com conscrição só por nova lei → 'seletivo'.
    servico: 'seletivo',
    idade: 18,
    forcas: { exercito: 'o Exército (Heer)', marinha: 'a Marinha (Deutsche Marine)', aeronautica: 'a Força Aérea (Luftwaffe)' },
    policia: 'a polícia estadual (Landespolizei)'
  },
  esporte: {
    popularidade: { futebol: 1.4, tenis: 1.05, natacao: 1, atletismo: 1, basquete: 0.9, volei: 0.95, lutas: 0.8 },
    divisoes: ['Regionalliga', '3. Liga', '2. Bundesliga', 'Bundesliga'],
    clubes: [
      { nome: 'Bayern de Munique', artigo: 'o', porte: 'grande', cidade: 'Munique' },
      { nome: 'Borussia Dortmund', artigo: 'o', porte: 'grande', cidade: 'Dortmund' },
      { nome: 'Hamburger SV', artigo: 'o', porte: 'tradicional', cidade: 'Hamburgo' },
      { nome: 'Werder Bremen', artigo: 'o', porte: 'tradicional', cidade: 'Bremen' },
      { nome: '1. FC Köln', artigo: 'o', porte: 'tradicional', cidade: 'Colônia' },
      { nome: 'Eintracht Frankfurt', artigo: 'o', porte: 'tradicional', cidade: 'Frankfurt' },
      { nome: 'VfB Stuttgart', artigo: 'o', porte: 'tradicional', cidade: 'Stuttgart' },
      { nome: 'Hertha BSC', artigo: 'o', porte: 'tradicional', cidade: 'Berlim' },
      { nome: 'Union Berlin', artigo: 'o', porte: 'tradicional', cidade: 'Berlim' },
      { nome: 'RB Leipzig', artigo: 'o', porte: 'tradicional', cidade: 'Leipzig' },
      { nome: 'Dynamo Dresden', artigo: 'o', porte: 'regional', cidade: 'Dresden' },
      { nome: 'Fortuna Düsseldorf', artigo: 'o', porte: 'tradicional', cidade: 'Düsseldorf' },
      { nome: 'Hannover 96', artigo: 'o', porte: 'tradicional', cidade: 'Hanôver' },
      { nome: 'SC Freiburg', artigo: 'o', porte: 'tradicional', cidade: 'Freiburg im Breisgau' },
      { nome: '1. FC Heidenheim', artigo: 'o', porte: 'regional', cidade: 'Heidenheim an der Brenz' }
    ]
  },
  // Seguro de saúde obrigatório para todos (GKV, ~88%; o resto em seguro
  // privado substitutivo, PKV): cobertura universal por seguro.
  saude: { sistema: 'universal', redePublica: 'o seguro público de saúde (GKV)', custoPlano: 1.6 },
  migracao: { blocos: ['ue'], abertura: 'seletiva' }, // Chancenkarte e Blue Card (Lei de Imigração de Mão de Obra Qualificada, 2023)
  sucessao: {
    pais: 'DE',
    nome: 'Alemanha',
    legitima: 0.5,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [3 / 4, 3 / 4],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.015,
    rotuloCusto: 'imposto sobre herança (Erbschaftsteuer) e certificado de herdeiro',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1970, 1995],
    neutros: ['Kim', 'Alex', 'Robin', 'Charlie', 'Luca', 'Noa', 'Sascha', 'Kai', 'Toni', 'Jona'],
    grupos: [
      {
        // GfdS (Gesellschaft für deutsche Sprache), nomes mais dados 1977–2024;
        // gerações antigas: listas históricas por ano de nascimento (Bielefeld/GfdS).
        id: 'de',
        peso: 1,
        sobrenome: 'um',
        masc: {
          antiga: ['Hans', 'Peter', 'Klaus', 'Wolfgang', 'Jürgen', 'Dieter', 'Manfred', 'Uwe', 'Günter', 'Horst', 'Werner', 'Heinz', 'Gerhard', 'Helmut', 'Bernd', 'Michael',
            'Thomas', 'Rainer', 'Karl', 'Walter', 'Rolf', 'Herbert', 'Friedrich', 'Joachim', 'Hartmut', 'Ulrich', 'Norbert', 'Siegfried', 'Gerd', 'Volker', 'Detlef'],
          meio: ['Michael', 'Thomas', 'Andreas', 'Stefan', 'Christian', 'Daniel', 'Markus', 'Sebastian', 'Alexander', 'Tobias', 'Florian', 'Jan', 'Matthias', 'Martin',
            'Dennis', 'Patrick', 'Tim', 'Philipp', 'Marcel', 'Kevin', 'Sven', 'Torsten', 'Dirk', 'Oliver', 'Frank', 'Jens', 'Björn', 'Benjamin', 'Dominik', 'René', 'Marco'],
          nova: ['Noah', 'Matteo', 'Leon', 'Elias', 'Paul', 'Ben', 'Luca', 'Finn', 'Felix', 'Henry', 'Emil', 'Theo', 'Jonas', 'Louis', 'Liam', 'Anton', 'Maximilian',
            'Lukas', 'Jakob', 'Mats', 'Leo', 'Moritz', 'Niklas', 'Julian', 'Jonathan', 'Oskar', 'Milan', 'Luis', 'Tim', 'David', 'Samuel', 'Fabian', 'Hannes']
        },
        fem: {
          antiga: ['Ursula', 'Monika', 'Petra', 'Gisela', 'Renate', 'Helga', 'Brigitte', 'Karin', 'Ingrid', 'Elke', 'Sabine', 'Christa', 'Gabriele', 'Erika', 'Hildegard',
            'Elisabeth', 'Marianne', 'Barbara', 'Angelika', 'Inge', 'Heike', 'Birgit', 'Doris', 'Waltraud', 'Gertrud', 'Christel', 'Bärbel', 'Edith', 'Ilse', 'Gudrun'],
          meio: ['Julia', 'Sandra', 'Nicole', 'Stefanie', 'Katrin', 'Anja', 'Melanie', 'Christina', 'Sarah', 'Nadine', 'Tanja', 'Claudia', 'Jennifer', 'Jessica', 'Katharina',
            'Kathrin', 'Susanne', 'Daniela', 'Lisa', 'Anna', 'Laura', 'Janina', 'Vanessa', 'Simone', 'Yvonne', 'Andrea', 'Silke', 'Jana', 'Franziska', 'Annika', 'Mandy'],
          nova: ['Emilia', 'Sophia', 'Emma', 'Hannah', 'Mia', 'Lina', 'Ella', 'Mila', 'Clara', 'Lea', 'Leni', 'Marie', 'Lena', 'Anna', 'Luisa', 'Frieda', 'Mathilda',
            'Ida', 'Lia', 'Johanna', 'Leonie', 'Laura', 'Lara', 'Amelie', 'Charlotte', 'Paula', 'Greta', 'Lilly', 'Nora', 'Maja', 'Theresa', 'Helena']
        },
        sobrenomes: [
          'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein',
          'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier',
          'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter', 'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Möller',
          'Weiß', 'Jung', 'Hahn', 'Vogel', 'Nowak', 'Kowalski'
        ]
      },
      {
        // Alemães de família de origem turca (~3,5% da população; Destatis,
        // Mikrozensus 2023 — pessoas com história migratória da Turquia).
        // Nomes: TÜİK (estatística turca) por geração; concentrados no oeste.
        id: 'de_turco',
        peso: 0.05,
        sobrenome: 'um',
        masc: {
          antiga: ['Mehmet', 'Mustafa', 'Ahmet', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'İsmail', 'Osman', 'Yusuf', 'Ramazan', 'Halil', 'Süleyman', 'Abdullah', 'Mahmut',
            'Recep', 'Salih', 'Kemal', 'Musa', 'Bekir', 'Cemal', 'Erol', 'Nihat', 'Orhan', 'Ömer', 'Rıza'],
          meio: ['Murat', 'Mehmet', 'Mustafa', 'Ahmet', 'Ali', 'Hakan', 'Serkan', 'Emre', 'Tolga', 'Volkan', 'Cem', 'Erkan', 'Kaan', 'Burak', 'Deniz', 'Özkan', 'Tayfun',
            'Sinan', 'Fatih', 'Gökhan', 'Okan', 'Onur', 'Yusuf', 'Selim', 'Levent', 'Orhan', 'Kerem'],
          nova: ['Yusuf', 'Emir', 'Ömer', 'Mehmet', 'Eymen', 'Kerem', 'Mustafa', 'Ali', 'Ayaz', 'Aras', 'Efe', 'Deniz', 'Can', 'Arda', 'Kaan', 'Emre', 'Yiğit', 'Berat',
            'Enes', 'Hamza', 'Furkan', 'Mert', 'Umut', 'Baran', 'Ege', 'Doruk', 'Elias']
        },
        fem: {
          antiga: ['Fatma', 'Ayşe', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Meryem', 'Şerife', 'Zehra', 'Hanife', 'Sultan', 'Hacer', 'Fadime', 'Havva', 'Leyla', 'Gülsüm',
            'Nuray', 'Halime', 'Cemile', 'Saadet', 'Songül', 'Nermin', 'Sevim', 'Gül', 'Necla', 'Aynur'],
          meio: ['Esra', 'Elif', 'Merve', 'Ayşe', 'Fatma', 'Zeynep', 'Derya', 'Özlem', 'Sibel', 'Serpil', 'Tuba', 'Hülya', 'Gülay', 'Dilek', 'Selin', 'Nurcan', 'Aylin',
            'Meltem', 'Emine', 'Sevgi', 'Burcu', 'Canan', 'Seda', 'Yasemin', 'Gamze', 'Ebru', 'Melek'],
          nova: ['Elif', 'Zeynep', 'Defne', 'Ecrin', 'Eylül', 'Azra', 'Nehir', 'Asel', 'Meryem', 'Hira', 'Ela', 'Masal', 'Lina', 'Lara', 'Yaren', 'Ada', 'Esila', 'Aleyna',
            'Beren', 'Ayşe', 'Amira', 'Sena', 'Duru', 'Irmak', 'Nisa', 'Mira', 'Leyla']
        },
        sobrenomes: [
          'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç',
          'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Karaca', 'Güneş', 'Aksoy', 'Tekin', 'Ateş', 'Bulut', 'Keskin', 'Ünal', 'Acar', 'Turan', 'Kaplan', 'Uçar',
          'Toprak', 'Avcı', 'Tan', 'Taş', 'Güler', 'Coşkun', 'Erdem', 'Akın'
        ]
      }
    ]
  },
  fontes: [
    'Mindestlohn 2026: 13,90 €/h (Fünfte Mindestlohnanpassungsverordnung, 2025).',
    'Beitragsbemessungsgrenzen 2026 (Sozialversicherungs-Rechengrößenverordnung 2026); taxas de contribuição GKV/RV/AV/PV.',
    'EStG § 32a (Grundfreibetrag 2026); KSchG § 1a; SGB III §§ 147, 149; SGB VI §§ 50, 235.',
    'BGB §§ 1924, 1925, 1931, 1371, 1936, 2303; ErbStG § 16.',
    'Grundgesetz, arts. 38, 39, 51; leis municipais dos Länder (Gemeindeordnungen).',
    'Wehrdienst-Modernisierungsgesetz (WDModG), em vigor em 1/1/2026 (bundesregierung.de).',
    'Destatis: Mikrozensus 2023/2024, EU-SILC, Verdiensterhebung, estudantes por tipo de instituição.',
    'GfdS: nomes mais dados; DFB/DFL: estrutura das ligas 2025/26.'
  ]
};

/* ================================================================ ITÁLIA */

/*
 * ITÁLIA — divisões: as 20 regiões (ISO 3166-2:IT, códigos numéricos).
 *
 * POLÍTICA: o sindaco é eleito diretamente (Lei 81/1993; TUEL art. 46),
 * mandato de 5 anos. O presidente da região é eleito diretamente junto com
 * o conselho regional nas regiões de estatuto ordinário e em Sicília,
 * Sardenha e Friul-Veneza Júlia (Constituição art. 122, Lei constitucional
 * 1/1999) — no Vale de Aosta e em Trentino-Alto Ádige é eleito pelo
 * conselho. Por isso 'governador' ENTRA, com essa ressalva. O Senado é
 * eleito diretamente (art. 57–58): idade mínima de 40 anos; a Câmara, 25
 * (art. 56). As eleições municipais e regionais são escalonadas; o jogo usa
 * o ciclo das grandes cidades (Roma, Milão, Nápoles, Turim: 2021 → 2026).
 *
 * SUCESSÃO (Codice civile):
 *  - legitimários: cônjuge, filhos, ascendentes (art. 536);
 *  - reserva: cônjuge + um filho = 2/3 (1/3 cada, art. 542); cônjuge + dois
 *    ou mais = 3/4; só filhos 1/2 ou 2/3 (art. 537) — usamos 2/3;
 *  - sem testamento: cônjuge com um filho 1/2, com mais 1/3 (art. 581) —
 *    aproximado por cabeça; com ascendentes, cônjuge 2/3 (art. 582);
 *  - representação (art. 467); irmãos (art. 570); sem herdeiros, o Estado
 *    (art. 586); comunhão legal dos bens (art. 159, 177) → meação.
 *  - Custo: imposta di successione 4% para cônjuge e linha reta acima de
 *    1 milhão € por herdeiro (D.Lgs. 346/1990, art. 7) + impostos
 *    hipotecário/cadastral sobre imóveis e notário → média baixa.
 */
const ITALIA: PerfilDePais = {
  id: 'IT',
  gentilico: ['italiano', 'italiana'],
  idiomas: ['italiano'],
  divisao: {
    tipo: ['região', 'regiões'],
    // ISTAT (Conti territoriali; Retribuzioni) e Banca d'Italia: o Centro-
    // Norte paga e custa mais; o Mezzogiorno tem renda ~25–30% abaixo.
    lista: [
      { codigo: '21', nome: 'Piemonte', custo: 1, salario: 1.03 },
      { codigo: '23', nome: 'Vale de Aosta', custo: 1.05, salario: 1.05 },
      { codigo: '25', nome: 'Lombardia', custo: 1.15, salario: 1.15 },
      { codigo: '32', nome: 'Trentino-Alto Ádige', custo: 1.08, salario: 1.1 },
      { codigo: '34', nome: 'Vêneto', custo: 1.03, salario: 1.05 },
      { codigo: '36', nome: 'Friul-Veneza Júlia', custo: 1, salario: 1.04 },
      { codigo: '42', nome: 'Ligúria', custo: 1.03, salario: 1.02 },
      { codigo: '45', nome: 'Emília-Romanha', custo: 1.07, salario: 1.08 },
      { codigo: '52', nome: 'Toscana', custo: 1.05, salario: 1.02 },
      { codigo: '55', nome: 'Úmbria', custo: 0.95, salario: 0.95 },
      { codigo: '57', nome: 'Marcas', custo: 0.95, salario: 0.96 },
      { codigo: '62', nome: 'Lácio', custo: 1.1, salario: 1.06 },
      { codigo: '65', nome: 'Abruzzo', custo: 0.9, salario: 0.9 },
      { codigo: '67', nome: 'Molise', custo: 0.85, salario: 0.84 },
      { codigo: '72', nome: 'Campânia', custo: 0.88, salario: 0.82 },
      { codigo: '75', nome: 'Apúlia', custo: 0.86, salario: 0.82 },
      { codigo: '77', nome: 'Basilicata', custo: 0.84, salario: 0.83 },
      { codigo: '78', nome: 'Calábria', custo: 0.82, salario: 0.78 },
      { codigo: '82', nome: 'Sicília', custo: 0.84, salario: 0.8 },
      { codigo: '88', nome: 'Sardenha', custo: 0.9, salario: 0.86 }
    ]
  },
  cidades: [
    ['Roma', '62', 'metropole', 'capital|sede|litoral'],
    ['Milão', '25', 'metropole', 'sede'],
    ['Monza', '25', 'metropolitana', 'metro:Milão'],
    ['Nápoles', '72', 'metropole', 'sede|litoral'],
    ['Turim', '21', 'capital', 'sede'],
    ['Gênova', '42', 'capital', 'sede|litoral'],
    ['Bolonha', '45', 'capital', 'sede'],
    ['Florença', '52', 'capital', 'sede'],
    ['Bari', '75', 'capital', 'sede|litoral'],
    ['Palermo', '82', 'capital', 'sede|litoral'],
    ['Cagliari', '88', 'capital', 'sede|litoral'],
    ['Verona', '34', 'polo'],
    ['Bérgamo', '25', 'polo'],
    ['Sassuolo', '45', 'pequena']
  ],
  economia: {
    // Risco de pobreza ~18,9% (ISTAT, Reddito e condizioni di vita 2024),
    // pobreza absoluta ~9,8% dos indivíduos; Gini ~32; grande desigualdade
    // Norte–Sul (refletida nas divisões).
    classes: { vulneravel: 14, trabalhadora: 31, media_baixa: 26, media: 21, alta: 8 },
    // ~75% dos domicílios são proprietários; aluguel pesa menos que no
    // resto da Europa Ocidental, salvo Milão e Roma.
    moradia: 1.05,
    // Não há salário mínimo legal: os pisos vêm dos contratos coletivos
    // nacionais (CCNL), que cobrem a grande maioria dos empregados.
    informalidade: 0.1, // ISTAT: ~11% das unidades de trabalho irregulares (Economia non osservata)
    inflacao: 0.018,
    volatilidade: 0.6
  },
  trabalho: {
    // 13.ª (tredicesima) em todos os CCNL; 14.ª (quattordicesima) em parte
    // deles (comércio, turismo) — média ~13,3.
    mesesPagos: 13.3,
    // INPS, parte do empregado: 9,19% (+1% acima de ~56 mil €/ano); teto
    // (massimale) só para quem começou após 1996, ~10.000 €/mês.
    contribuicao: { aliquota: [0.0919, 0.1019], teto: 10000 },
    // IRPEF: no-tax area de 8.500 €/ano para empregados (≈ 708 €/mês);
    // primeira faixa 23% até 28 mil €, + adicionais regional e municipal
    // (~2%) → 25% típica.
    impostoRenda: { isencao: 708, aliquota: 0.25 },
    // TFR: em QUALQUER saída do emprego, a remuneração anual ÷ 13,5 por ano
    // (art. 2120 c.c.) ≈ 0,89 mês/ano — parecido com o FGTS.
    rescisao: { nome: 'TFR (trattamento di fine rapporto)', mesesPorAno: 0.89 },
    // NASpI: 75% do salário médio (com teto), −3%/mês a partir do 6.º mês;
    // dura metade das semanas contribuídas nos últimos 4 anos (D.Lgs. 22/2015).
    seguroDesemprego: { meses: 12, reposicao: 0.6 },
    // Pensione di vecchiaia: 67 anos e 20 de contribuição (Lei 214/2011);
    // reposição bruta ~76% (OCDE).
    previdencia: { idade: [67, 67], anos: [20, 20], reposicao: 0.76, nome: 'INPS' },
    concurso: true, // concorso pubblico (Constituição, art. 97)
    contratoFormal: 'contrato regular (com INPS)'
  },
  educacao: {
    etapas: {
      fundamental: 'escola média', medio: 'escola superior', serieMedio: 'ano',
      publica: { creche: 'o asilo nido municipal', fundamental: 'a escola média do bairro', medio: 'o liceu estadual' }
    },
    // A maioria dos cursos é de acesso livre com o diploma de maturità (com
    // teste de orientação não eliminatório); numero chiuso nacional em
    // medicina, odontologia, arquitetura etc. (Lei 264/1999).
    ingresso: 'acesso_aberto',
    exame: { nome: 'maturità', artigo: 'a' },
    // Taxas públicas por ISEE (isentas abaixo de 22 mil € de ISEE; média
    // ~1.500 €) vs. ~6.000–15.000 € nas privadas.
    publicaCobra: 0.2,
    // Borsa di studio DSU: ISEE até ~27 mil € (2025/26). Sem salário mínimo
    // legal, o teto fica em ~1 piso salarial por pessoa (abstração).
    bolsa: { nome: 'bolsa de estudo DSU', teto: 1 },
    cotas: false,
    privadaComum: false // ~11% dos inscritos em universidades não estatais (MUR/USTAT), sem contar as telemáticas
  },
  politica: {
    sistema: 'república parlamentar unitária com regiões',
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 5, idade: 18, casa: 'o conselho comunal' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 5, idade: 18, casa: 'a Comuna' },
      deputado_estadual: { titulo: ['conselheiro regional', 'conselheira regional'], anos: 5, idade: 18, casa: 'o conselho regional' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 5, idade: 25, casa: 'a Câmara dos Deputados' },
      senador: { titulo: ['senador', 'senadora'], anos: 5, idade: 40, casa: 'o Senado da República' },
      governador: { titulo: ['presidente da região', 'presidente da região'], anos: 5, idade: 18, casa: 'a Junta Regional' }
    },
    eleicoes: { local: [2026, 5], geral: [2027, 5] }, // gerais set/2022 → 2027
    mes: 5,
    obrigatorio: false, // o voto é "dever cívico" (art. 48), sem sanção
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // leva suspensa desde 1/1/2005 (Lei 226/2004)
    idade: 18,
    forcas: { exercito: 'o Exército Italiano', marinha: 'a Marinha Militar', aeronautica: 'a Aeronáutica Militar' },
    policia: 'a Polícia de Estado'
  },
  esporte: {
    // Vôlei: Superlega/Serie A1 entre as ligas mais fortes do mundo; tênis em
    // forte expansão (FITP, recorde de filiados).
    popularidade: { futebol: 1.45, volei: 1.3, basquete: 1, natacao: 1.1, atletismo: 0.95, lutas: 0.8, tenis: 1.2 },
    divisoes: ['Serie D', 'Serie C', 'Serie B', 'Serie A'],
    clubes: [
      { nome: 'Juventus', artigo: 'a', porte: 'grande', cidade: 'Turim' },
      { nome: 'Torino', artigo: 'o', porte: 'tradicional', cidade: 'Turim' },
      { nome: 'Inter de Milão', artigo: 'a', porte: 'grande', cidade: 'Milão' },
      { nome: 'Milan', artigo: 'o', porte: 'grande', cidade: 'Milão' },
      { nome: 'Roma', artigo: 'a', porte: 'grande', cidade: 'Roma' },
      { nome: 'Lazio', artigo: 'a', porte: 'tradicional', cidade: 'Roma' },
      { nome: 'Napoli', artigo: 'o', porte: 'grande', cidade: 'Nápoles' },
      { nome: 'Fiorentina', artigo: 'a', porte: 'tradicional', cidade: 'Florença' },
      { nome: 'Bologna', artigo: 'o', porte: 'tradicional', cidade: 'Bolonha' },
      { nome: 'Atalanta', artigo: 'a', porte: 'tradicional', cidade: 'Bérgamo' },
      { nome: 'Genoa', artigo: 'o', porte: 'tradicional', cidade: 'Gênova' },
      { nome: 'Hellas Verona', artigo: 'o', porte: 'tradicional', cidade: 'Verona' },
      { nome: 'Cagliari', artigo: 'o', porte: 'tradicional', cidade: 'Cagliari' },
      { nome: 'Bari', artigo: 'o', porte: 'regional', cidade: 'Bari' },
      { nome: 'Palermo', artigo: 'o', porte: 'regional', cidade: 'Palermo' },
      { nome: 'Sassuolo', artigo: 'o', porte: 'regional', cidade: 'Sassuolo' }
    ]
  },
  saude: { sistema: 'universal', redePublica: 'o Serviço Sanitário Nacional', custoPlano: 1.2 },
  migracao: { blocos: ['ue'], abertura: 'seletiva' }, // cotas anuais do Decreto Flussi
  sucessao: {
    pais: 'IT',
    nome: 'Itália',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [2 / 3, 2 / 3],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.02,
    rotuloCusto: 'imposto de sucessão, impostos hipotecário e cadastral e notário',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2000],
    neutros: ['Andrea', 'Alex', 'Sasha', 'Noa', 'Celeste', 'Gioia', 'Ariel', 'Dani', 'Kim', 'Luce'],
    grupos: [
      {
        // ISTAT, "Nomi dei nati" (1999–2023) e Censimento (nomes por ano de nascimento).
        id: 'it',
        peso: 1,
        sobrenome: 'um',
        masc: {
          antiga: ['Giuseppe', 'Giovanni', 'Antonio', 'Mario', 'Luigi', 'Francesco', 'Angelo', 'Vincenzo', 'Pietro', 'Salvatore', 'Carlo', 'Franco', 'Domenico', 'Bruno',
            'Paolo', 'Michele', 'Giorgio', 'Aldo', 'Sergio', 'Luciano', 'Roberto', 'Renato', 'Giuliano', 'Enzo', 'Umberto', 'Gianni', 'Ferdinando', 'Raffaele', 'Alberto', 'Gino'],
          meio: ['Marco', 'Andrea', 'Alessandro', 'Luca', 'Francesco', 'Matteo', 'Davide', 'Simone', 'Stefano', 'Roberto', 'Daniele', 'Fabio', 'Federico', 'Massimo',
            'Paolo', 'Giuseppe', 'Antonio', 'Giovanni', 'Riccardo', 'Nicola', 'Emanuele', 'Michele', 'Gianluca', 'Alessio', 'Lorenzo', 'Mattia', 'Christian', 'Valerio', 'Claudio', 'Diego'],
          nova: ['Leonardo', 'Francesco', 'Tommaso', 'Edoardo', 'Alessandro', 'Lorenzo', 'Mattia', 'Gabriele', 'Riccardo', 'Andrea', 'Diego', 'Nicolò', 'Matteo', 'Giuseppe',
            'Federico', 'Antonio', 'Enea', 'Samuele', 'Giovanni', 'Pietro', 'Filippo', 'Davide', 'Giulio', 'Gioele', 'Elia', 'Achille', 'Ettore', 'Cesare', 'Thomas', 'Luca', 'Marco']
        },
        fem: {
          antiga: ['Maria', 'Anna', 'Giuseppina', 'Rosa', 'Angela', 'Giovanna', 'Teresa', 'Lucia', 'Carmela', 'Caterina', 'Francesca', 'Antonietta', 'Carla', 'Elena',
            'Rita', 'Franca', 'Luisa', 'Bruna', 'Graziella', 'Adriana', 'Giuliana', 'Gabriella', 'Paola', 'Silvana', 'Mirella', 'Laura', 'Marisa', 'Rosaria', 'Concetta', 'Nicoletta'],
          meio: ['Francesca', 'Chiara', 'Sara', 'Valentina', 'Giulia', 'Federica', 'Silvia', 'Elisa', 'Martina', 'Alessandra', 'Laura', 'Roberta', 'Elena', 'Paola', 'Simona',
            'Monica', 'Barbara', 'Claudia', 'Serena', 'Ilaria', 'Michela', 'Veronica', 'Cristina', 'Daniela', 'Stefania', 'Eleonora', 'Marta', 'Alice', 'Erika', 'Debora'],
          nova: ['Sofia', 'Aurora', 'Giulia', 'Ginevra', 'Vittoria', 'Beatrice', 'Alice', 'Ludovica', 'Emma', 'Matilde', 'Anna', 'Camilla', 'Chiara', 'Giorgia', 'Bianca',
            'Nicole', 'Gaia', 'Martina', 'Greta', 'Azzurra', 'Arianna', 'Sara', 'Noemi', 'Isabel', 'Rebecca', 'Adele', 'Viola', 'Elena', 'Mia', 'Cecilia', 'Carlotta']
        },
        sobrenomes: [
          'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa',
          'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo',
          'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', "D'Angelo", 'Marchetti', 'Parisi', 'Villa', 'Conte', 'Ferraro', 'Ferri',
          'Fabbri', 'Bianco', 'Marini', 'Grasso', 'Valentini'
        ]
      },
      {
        // Sul (Campânia, Apúlia, Calábria, Sicília, Basilicata): os nomes de
        // tradição familiar e de santos patronos seguem mais frequentes nas
        // estatísticas regionais do ISTAT ("Nomi dei nati" por região), e os
        // sobrenomes têm distribuição própria. Convive com o grupo nacional.
        id: 'it_sul',
        peso: 0.7,
        divisoes: ['72', '75', '77', '78', '82'],
        sobrenome: 'um',
        masc: {
          antiga: ['Salvatore', 'Giuseppe', 'Antonio', 'Vincenzo', 'Francesco', 'Gaetano', 'Domenico', 'Pasquale', 'Raffaele', 'Gennaro', 'Ciro', 'Carmine', 'Rosario',
            'Calogero', 'Sebastiano', 'Gaspare', 'Nicola', 'Michele', 'Luigi', 'Saverio', 'Giovanni', 'Angelo', 'Filippo', 'Cosimo', 'Vito', 'Orazio', 'Pietro'],
          meio: ['Antonio', 'Giuseppe', 'Salvatore', 'Francesco', 'Vincenzo', 'Gianluca', 'Gennaro', 'Raffaele', 'Domenico', 'Ciro', 'Pasquale', 'Alessandro', 'Marco',
            'Luca', 'Davide', 'Carmine', 'Fabio', 'Daniele', 'Nicola', 'Michele', 'Andrea', 'Emanuele', 'Massimo', 'Gaetano', 'Giovanni', 'Simone', 'Mario'],
          nova: ['Francesco', 'Giuseppe', 'Antonio', 'Leonardo', 'Salvatore', 'Alessandro', 'Vincenzo', 'Gabriele', 'Christian', 'Mattia', 'Lorenzo', 'Domenico', 'Mario',
            'Raffaele', 'Gennaro', 'Ciro', 'Pietro', 'Andrea', 'Giovanni', 'Samuele', 'Tommaso', 'Michele', 'Emanuele', 'Diego', 'Luigi', 'Gioele', 'Nicola']
        },
        fem: {
          antiga: ['Maria', 'Anna', 'Rosa', 'Giuseppina', 'Carmela', 'Concetta', 'Antonietta', 'Teresa', 'Assunta', 'Lucia', 'Immacolata', 'Rosaria', 'Filomena', 'Angela',
            'Caterina', 'Giovanna', 'Grazia', 'Annunziata', 'Vincenza', 'Carmen', 'Pasqualina', 'Nunzia', 'Raffaella', 'Salvatrice', 'Rita', 'Francesca', 'Agata'],
          meio: ['Maria', 'Anna', 'Francesca', 'Rosa', 'Valentina', 'Federica', 'Roberta', 'Rossella', 'Carmela', 'Teresa', 'Concetta', 'Antonella', 'Angela', 'Sabrina',
            'Ilenia', 'Alessandra', 'Simona', 'Daniela', 'Mariarosaria', 'Stefania', 'Tiziana', 'Raffaella', 'Fabiana', 'Ilaria', 'Giuseppina', 'Martina', 'Chiara'],
          nova: ['Sofia', 'Giulia', 'Aurora', 'Ginevra', 'Vittoria', 'Alice', 'Beatrice', 'Martina', 'Chiara', 'Anna', 'Giorgia', 'Noemi', 'Maria', 'Rebecca', 'Emma',
            'Francesca', 'Ludovica', 'Gaia', 'Matilde', 'Miriam', 'Arianna', 'Sara', 'Greta', 'Carmen', 'Rachele', 'Benedetta', 'Camilla']
        },
        sobrenomes: [
          'Esposito', 'Russo', 'Romano', 'Greco', 'De Luca', 'Rizzo', 'Caruso', 'Lombardo', 'Marino', 'Ferrara', 'Coppola', 'Santoro', 'Gallo', 'Costa', 'Messina',
          'Amato', 'Giordano', 'Vitale', 'Leone', 'Parisi', 'Mancuso', "D'Amico", 'Cirillo', 'Palumbo', 'Grasso', 'Sorrentino', 'Napolitano', 'Pellegrino', 'De Rosa',
          'Bruno', 'Ruggiero', 'Fiore', 'Barone', 'Gentile', 'Longo', 'Ricci', 'Morelli', 'Aiello', 'La Rosa', 'Testa', 'Marchese', 'Ferraro'
        ]
      }
    ]
  },
  fontes: [
    'Codice civile, arts. 159, 177, 467, 536–542, 570, 581–582, 586, 2120; D.Lgs. 346/1990 (imposta di successione).',
    'Constituição, arts. 48, 56–58, 97, 122; Lei constitucional 1/1999; Lei 81/1993 e TUEL (D.Lgs. 267/2000).',
    'INPS: alíquotas e massimale 2026; NASpI (D.Lgs. 22/2015); Lei 214/2011 (pensione di vecchiaia).',
    'TUIR, art. 13 (no-tax area) e escala IRPEF 2026; Lei 226/2004 (suspensão da leva).',
    'ISTAT: Reddito e condizioni di vita 2024; Povertà 2024; Economia non osservata; "Nomi dei nati".',
    'MUR/USTAT: estudantes por tipo de universidade; Lei 264/1999 (acesso programado).',
    'FIGC / Lega Serie A: estrutura das competições 2025/26.'
  ]
};

/* ================================================================ REINO UNIDO */

/*
 * REINO UNIDO — divisões: as 4 nações (ISO 3166-2:GB: ENG, SCT, WLS, NIR).
 * As cidades e os clubes são sobretudo ingleses; condados e autoridades
 * locais não são modelados.
 *
 * POLÍTICA: 'vereador' = councillor (4 anos, 18). 'prefeito': há prefeitos
 * eleitos diretamente em Londres, nas combined authorities (Grande
 * Manchester, West Midlands, Liverpool City Region etc.) e em ~13 conselhos;
 * nos demais o conselho é chefiado por um leader indireto. O nível entra,
 * com essa ressalva. 'deputado_estadual' OMITIDO: só Escócia (Holyrood),
 * País de Gales (Senedd) e Irlanda do Norte (Assembleia) têm parlamentos
 * devolvidos — a Inglaterra (~84% da população) não; o first minister é
 * escolhido pelo parlamento (sem 'governador'). A Câmara dos Lordes não é
 * eleita: 'senador' OMITIDO. Câmara dos Comuns: até 5 anos (Dissolution and
 * Calling of Parliament Act 2022), idade 18.
 *
 * SUCESSÃO (Inglaterra e País de Gales):
 *  - liberdade de testar: não há legítima ('legitima' 0, sem necessários);
 *    o Inheritance (Provision for Family and Dependants) Act 1975 permite ao
 *    cônjuge e aos filhos pedir em juízo uma "provisão razoável" — não modelado;
 *  - sem testamento (Administration of Estates Act 1925, alterado pelo
 *    Inheritance and Trustees' Powers Act 2014): o cônjuge recebe os bens
 *    pessoais, um legado fixo (322.000 £ desde 2023) e metade do resto; os
 *    filhos a outra metade (aproximado por cabeça); sem descendentes, o
 *    cônjuge recebe TUDO, mesmo com os pais vivos (→ [1, 1]); depois pais,
 *    irmãos (statutory trusts com representação);
 *  - sem herdeiros: bona vacantia, a Coroa;
 *  - sem comunhão de bens (separação; a partilha na separação é judicial).
 *  - Custo: Inheritance Tax 40% acima de 325.000 £ (+175.000 £ pela casa
 *    para descendentes); cônjuge isento; ~4–5% dos espólios pagam → média
 *    modesta + probate.
 *  SIMPLIFICAÇÃO: a Escócia tem "legal rights" (1/3 ou 1/2 dos bens móveis
 *  para cônjuge e filhos — Succession (Scotland) Act 1964) e a Irlanda do
 *  Norte regras próprias; o perfil usa a regra inglesa.
 */
const REINO_UNIDO: PerfilDePais = {
  id: 'GB',
  gentilico: ['britânico', 'britânica'],
  idiomas: ['inglês', 'galês', 'gaélico escocês'],
  divisao: {
    tipo: ['nação', 'nações'],
    // ONS (ASHE 2024; preços regionais): Londres puxa a Inglaterra para
    // cima (o prêmio de Londres, ~30%, não cabe no nível de nação); País de
    // Gales e Irlanda do Norte com salários e custos ~10–15% abaixo.
    lista: [
      { codigo: 'ENG', nome: 'Inglaterra', custo: 1.03, salario: 1.03 },
      { codigo: 'SCT', nome: 'Escócia', custo: 0.95, salario: 0.97 },
      { codigo: 'WLS', nome: 'País de Gales', custo: 0.88, salario: 0.88 },
      { codigo: 'NIR', nome: 'Irlanda do Norte', custo: 0.85, salario: 0.86 }
    ]
  },
  cidades: [
    ['Londres', 'ENG', 'metropole', 'capital|sede'],
    ['Croydon', 'ENG', 'metropolitana', 'metro:Londres'],
    ['Manchester', 'ENG', 'metropole'],
    ['Birmingham', 'ENG', 'metropole'],
    ['Liverpool', 'ENG', 'metropole', 'litoral'],
    ['Leeds', 'ENG', 'polo'],
    ['Newcastle upon Tyne', 'ENG', 'polo', 'litoral'],
    ['Sunderland', 'ENG', 'polo', 'litoral'],
    ['Burnley', 'ENG', 'pequena'],
    ['Wrexham', 'WLS', 'pequena'],
    ['Cardiff', 'WLS', 'capital', 'sede|litoral'],
    ['Edimburgo', 'SCT', 'capital', 'sede|litoral'],
    ['Glasgow', 'SCT', 'metropole', 'litoral'],
    ['Belfast', 'NIR', 'capital', 'sede|litoral']
  ],
  economia: {
    // Pobreza relativa ~17% antes do custo de moradia e ~21% depois (DWP,
    // HBAI 2023/24); Gini ~33–35, topo mais concentrado que na Europa continental.
    classes: { vulneravel: 13, trabalhadora: 29, media_baixa: 26, media: 22, alta: 10 },
    // Aluguel e compra entre os mais caros da OCDE em relação à renda
    // (sobretudo Londres e o sudeste).
    moradia: 1.6,
    // National Living Wage (21+): 12,71 £/h desde abr/2026 × 37,5 h × 52 / 12 ≈ 2.065 £/mês.
    salarioMinimo: 2065,
    informalidade: 0.07,
    inflacao: 0.03,
    volatilidade: 0.7
  },
  trabalho: {
    mesesPagos: 12,
    // National Insurance (Class 1, empregado): 8% entre 1.048 £ e 4.189 £/mês
    // e 2% acima; a alíquota efetiva vai de ~3% a ~6% até o teto (UEL).
    contribuicao: { aliquota: [0.03, 0.06], teto: 4189 },
    // Personal allowance 12.570 £/ano (≈ 1.047,50 £/mês); basic rate 20%
    // (a Escócia tem faixas próprias).
    impostoRenda: { isencao: 1047.5, aliquota: 0.2 },
    // Statutory redundancy pay: 1 semana de salário por ano (½ antes dos 22,
    // 1½ depois dos 41), semana limitada a ~719 £, só após 2 anos de casa
    // → ~0,23 mês por ano (Employment Rights Act 1996, s. 162).
    rescisao: { nome: 'statutory redundancy pay', mesesPorAno: 0.23 },
    // New Style JSA: valor fixo (~92 £/semana) por até 6 meses → ~15% de um salário típico.
    seguroDesemprego: { meses: 6, reposicao: 0.15 },
    // State Pension: 66, subindo para 67 entre 2026 e 2028 (Pensions Act
    // 2014); mínimo de 10 anos de contribuição (35 para o valor cheio);
    // valor cheio ~30% do salário médio (previdência complementar por
    // auto-enrolment não modelada).
    previdencia: { idade: [67, 67], anos: [10, 10], reposicao: 0.3, nome: 'State Pension' },
    concurso: false, // Civil Service: seleção por mérito via candidatura (Civil Service Commission), não concurso de provas
    contratoFormal: 'emprego registrado no PAYE'
  },
  educacao: {
    etapas: {
      fundamental: 'escola secundária', medio: 'sixth form', serieMedio: 'ano',
      publica: { creche: 'a nursery do bairro', fundamental: 'a escola estadual do bairro', medio: 'o sixth form college' }
    },
    // Candidatura pela UCAS com notas dos A-levels (previstas e finais).
    ingresso: 'candidatura',
    exame: { nome: 'A-level', artigo: 'o' },
    // Inglaterra: 9.535 £/ano (2025/26) em quase todas as universidades —
    // públicas e privadas cobram parecido. Escoceses estudam sem mensalidade
    // na Escócia (não modelado).
    publicaCobra: 0.8,
    // Student Finance: empréstimo de mensalidade e manutenção, pago só acima
    // de um limiar de renda (Plan 5) — sem teto de renda para tomar.
    credito: { nome: 'empréstimo estudantil (Student Finance)' },
    cotas: false,
    privadaComum: false
  },
  politica: {
    sistema: 'monarquia constitucional parlamentar, com parlamentos devolvidos na Escócia, no País de Gales e na Irlanda do Norte',
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'o conselho local (council)' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 18, casa: 'a prefeitura (mayoralty)' },
      deputado_federal: { titulo: ['deputado (MP)', 'deputada (MP)'], anos: 5, idade: 18, casa: 'a Câmara dos Comuns' }
    },
    eleicoes: { local: [2026, 4], geral: [2029, 5] }, // locais mai/2026; geral jul/2024 → até 2029
    mes: 4,
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // National Service extinto em 1960
    idade: 16, // as Forças Armadas aceitam candidatos a partir de 16 anos, com consentimento dos pais
    forcas: { exercito: 'o Exército Britânico', marinha: 'a Marinha Real', aeronautica: 'a Real Força Aérea' },
    policia: 'a polícia territorial'
  },
  esporte: {
    // Basquete e vôlei com pouca estrutura profissional; boxe forte nas lutas.
    popularidade: { futebol: 1.45, tenis: 1, atletismo: 1.1, natacao: 1, basquete: 0.65, volei: 0.5, lutas: 0.9 },
    // Pirâmide inglesa (os clubes galeses grandes jogam nela). Os clubes
    // escoceses jogam a SPFL, liga separada — não incluídos.
    divisoes: ['League Two', 'League One', 'Championship', 'Premier League'],
    clubes: [
      { nome: 'Arsenal', artigo: 'o', porte: 'grande', cidade: 'Londres' },
      { nome: 'Chelsea', artigo: 'o', porte: 'grande', cidade: 'Londres' },
      { nome: 'Tottenham Hotspur', artigo: 'o', porte: 'grande', cidade: 'Londres' },
      { nome: 'Crystal Palace', artigo: 'o', porte: 'tradicional', cidade: 'Croydon' },
      { nome: 'Manchester United', artigo: 'o', porte: 'grande', cidade: 'Manchester' },
      { nome: 'Manchester City', artigo: 'o', porte: 'grande', cidade: 'Manchester' },
      { nome: 'Liverpool', artigo: 'o', porte: 'grande', cidade: 'Liverpool' },
      { nome: 'Everton', artigo: 'o', porte: 'tradicional', cidade: 'Liverpool' },
      { nome: 'Aston Villa', artigo: 'o', porte: 'tradicional', cidade: 'Birmingham' },
      { nome: 'Birmingham City', artigo: 'o', porte: 'regional', cidade: 'Birmingham' },
      { nome: 'Newcastle United', artigo: 'o', porte: 'tradicional', cidade: 'Newcastle upon Tyne' },
      { nome: 'Leeds United', artigo: 'o', porte: 'tradicional', cidade: 'Leeds' },
      { nome: 'Sunderland', artigo: 'o', porte: 'tradicional', cidade: 'Sunderland' },
      { nome: 'Burnley', artigo: 'o', porte: 'tradicional', cidade: 'Burnley' },
      { nome: 'Wrexham', artigo: 'o', porte: 'regional', cidade: 'Wrexham' },
      { nome: 'Cardiff City', artigo: 'o', porte: 'regional', cidade: 'Cardiff' }
    ]
  },
  saude: { sistema: 'universal', redePublica: 'o NHS', custoPlano: 1.5 },
  // Fora da UE desde 2020; sistema de pontos (Skilled Worker), com exigências elevadas em 2025.
  migracao: { blocos: [], abertura: 'seletiva' },
  sucessao: {
    pais: 'GB',
    nome: 'Reino Unido',
    legitima: 0,
    necessarios: [],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1, 1],
    representacao: true,
    colaterais: true,
    meacao: false,
    custoTransmissao: 0.03,
    rotuloCusto: 'Inheritance Tax e custos do probate',
    vacancia: 'a Coroa (bona vacantia)'
  },
  nomes: {
    cortes: [1970, 1995],
    neutros: ['Alex', 'Charlie', 'Sam', 'Jordan', 'Jamie', 'Robin', 'Riley', 'Morgan', 'Frankie', 'Taylor', 'Ashley', 'Rowan'],
    grupos: [
      {
        // ONS, "Baby names in England and Wales" (1996–2024) e listas
        // históricas da ONS por década (1904–1994).
        id: 'ingles',
        peso: 1,
        sobrenome: 'um',
        masc: {
          antiga: ['John', 'David', 'Michael', 'Peter', 'Robert', 'Paul', 'Stephen', 'Richard', 'Anthony', 'Christopher', 'William', 'James', 'Brian', 'Alan', 'Kenneth',
            'Geoffrey', 'George', 'Derek', 'Keith', 'Colin', 'Graham', 'Raymond', 'Roger', 'Trevor', 'Barry', 'Malcolm', 'Terence', 'Dennis', 'Ronald', 'Frank'],
          meio: ['David', 'Paul', 'Mark', 'Andrew', 'Daniel', 'James', 'Matthew', 'Christopher', 'Richard', 'Michael', 'Jonathan', 'Stuart', 'Lee', 'Craig', 'Darren',
            'Wayne', 'Carl', 'Neil', 'Simon', 'Ian', 'Thomas', 'Adam', 'Ben', 'Ryan', 'Luke', 'Jamie', 'Scott', 'Liam', 'Kevin', 'Steven'],
          nova: ['Oliver', 'George', 'Noah', 'Arthur', 'Leo', 'Oscar', 'Harry', 'Archie', 'Jack', 'Henry', 'Charlie', 'Freddie', 'Theodore', 'Thomas', 'Alfie', 'Jacob',
            'William', 'Lucas', 'Isaac', 'Finley', 'Joshua', 'Edward', 'Teddy', 'Albie', 'Ethan', 'Max', 'Harrison', 'Reuben', 'Samuel', 'Logan', 'Mason', 'Joseph', 'Elijah']
        },
        fem: {
          antiga: ['Margaret', 'Susan', 'Patricia', 'Christine', 'Elizabeth', 'Mary', 'Linda', 'Janet', 'Carol', 'Barbara', 'Jean', 'Ann', 'Sandra', 'Pamela', 'Jacqueline',
            'Valerie', 'Joan', 'Maureen', 'Brenda', 'Sheila', 'Gillian', 'Pauline', 'Kathleen', 'Doreen', 'Dorothy', 'Shirley', 'Irene', 'Joyce', 'Hilary', 'Wendy'],
          meio: ['Sarah', 'Claire', 'Emma', 'Laura', 'Rebecca', 'Gemma', 'Nicola', 'Kelly', 'Lisa', 'Louise', 'Rachel', 'Hannah', 'Amy', 'Victoria', 'Joanne', 'Helen',
            'Katie', 'Jennifer', 'Lucy', 'Charlotte', 'Samantha', 'Natalie', 'Stacey', 'Kirsty', 'Michelle', 'Donna', 'Leanne', 'Zoe', 'Jessica', 'Lauren', 'Sophie', 'Emily'],
          nova: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Lily', 'Freya', 'Ivy', 'Florence', 'Isabella', 'Mia', 'Willow', 'Sophia', 'Grace', 'Evie', 'Poppy', 'Emily', 'Ella',
            'Elsie', 'Rosie', 'Daisy', 'Sienna', 'Phoebe', 'Harper', 'Matilda', 'Ruby', 'Isabelle', 'Evelyn', 'Charlotte', 'Millie', 'Alice', 'Sofia', 'Esme']
        },
        sobrenomes: [
          'Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Johnson', 'Roberts', 'Robinson', 'Thompson', 'Wright', 'Walker',
          'White', 'Edwards', 'Hughes', 'Green', 'Hall', 'Lewis', 'Harris', 'Clarke', 'Jackson', 'Wood', 'Turner', 'Martin', 'Cooper', 'Hill', 'Ward', 'Morris',
          'Moore', 'Clark', 'Lee', 'King', 'Baker', 'Harrison', 'Morgan', 'Allen', 'James', 'Scott', 'Phillips', 'Watson', 'Davis', 'Parker', 'Price', 'Bennett',
          'Young', 'Griffiths', 'Mitchell', 'Kelly', 'Cook', 'Carter'
        ]
      },
      {
        // NRS (National Records of Scotland), Babies' first names (1974–2024).
        id: 'escoces',
        peso: 1.5,
        divisoes: ['SCT'],
        sobrenome: 'um',
        masc: {
          antiga: ['John', 'James', 'William', 'David', 'Robert', 'Alexander', 'George', 'Thomas', 'Andrew', 'Ian', 'Alan', 'Kenneth', 'Hugh', 'Archibald', 'Angus',
            'Duncan', 'Donald', 'Gordon', 'Hector', 'Malcolm', 'Neil', 'Douglas', 'Alistair', 'Hamish', 'Iain', 'Colin', 'Graham'],
          meio: ['David', 'Scott', 'Craig', 'Stuart', 'Andrew', 'Paul', 'Steven', 'Mark', 'Gary', 'Michael', 'Ross', 'Jamie', 'Christopher', 'Kevin', 'Graeme', 'Grant',
            'Martin', 'Ryan', 'Darren', 'Euan', 'Fraser', 'Calum', 'Kieran', 'Callum', 'Lewis', 'Barry', 'Iain'],
          nova: ['Jack', 'Noah', 'Leo', 'Oliver', 'Harris', 'Rory', 'Finlay', 'Alexander', 'Lewis', 'Luca', 'Theo', 'Arthur', 'Hunter', 'Archie', 'Thomas', 'Max', 'Brodie',
            'Lachlan', 'Callum', 'James', 'Euan', 'Fraser', 'Cameron', 'Logan', 'Charlie', 'Mason', 'Jacob']
        },
        fem: {
          antiga: ['Margaret', 'Mary', 'Elizabeth', 'Agnes', 'Helen', 'Catherine', 'Isabella', 'Janet', 'Jean', 'Annie', 'Christina', 'Elspeth', 'Morag', 'Moira', 'Fiona',
            'Sheena', 'Isobel', 'Marion', 'Irene', 'Sandra', 'Anne', 'Rosemary', 'Kathleen', 'Joan', 'Linda', 'Christine', 'Patricia'],
          meio: ['Nicola', 'Claire', 'Lisa', 'Laura', 'Gillian', 'Kirsty', 'Lynsey', 'Fiona', 'Emma', 'Louise', 'Sarah', 'Lindsay', 'Gemma', 'Lauren', 'Jennifer', 'Amy',
            'Rachel', 'Hannah', 'Leanne', 'Stephanie', 'Shona', 'Ashley', 'Rebecca', 'Victoria', 'Catriona', 'Heather', 'Michelle'],
          nova: ['Isla', 'Olivia', 'Freya', 'Ava', 'Emily', 'Millie', 'Sophie', 'Grace', 'Amelia', 'Ella', 'Lily', 'Rosie', 'Eilidh', 'Harper', 'Orla', 'Ivy', 'Mia', 'Evie',
            'Charlotte', 'Willow', 'Isabella', 'Aria', 'Skye', 'Ellie', 'Hannah', 'Erin', 'Lucy']
        },
        sobrenomes: [
          'Smith', 'Brown', 'Wilson', 'Campbell', 'Stewart', 'Thomson', 'Robertson', 'Anderson', 'Macdonald', 'Scott', 'Reid', 'Murray', 'Taylor', 'Clark', 'Ross',
          'Watson', 'Morrison', 'Paterson', 'Young', 'Mitchell', 'Walker', 'Fraser', 'Miller', 'McDonald', 'Gray', 'Henderson', 'Hamilton', 'Johnston', 'Duncan',
          'Graham', 'Ferguson', 'Kerr', 'Davidson', 'Bell', 'Cameron', 'Kelly', 'Martin', 'MacLeod', 'Grant', 'Allan', 'Mackenzie', 'Black'
        ]
      },
      {
        // ONS (nomes no País de Gales) e Welsh Government — nomes galeses
        // convivem com os da lista inglesa.
        id: 'gales',
        peso: 1,
        divisoes: ['WLS'],
        sobrenome: 'um',
        masc: {
          antiga: ['John', 'David', 'William', 'Thomas', 'Gwilym', 'Dafydd', 'Emlyn', 'Glyn', 'Huw', 'Ieuan', 'Idris', 'Ivor', 'Rhys', 'Gwyn', 'Alun', 'Elwyn', 'Dilwyn',
            'Islwyn', 'Hywel', 'Eifion', 'Meirion', 'Robert', 'Peter', 'Michael', 'Brian', 'Kenneth'],
          meio: ['Gareth', 'Rhys', 'Dafydd', 'Owain', 'Ceri', 'Gethin', 'Iwan', 'Aled', 'Rhodri', 'Huw', 'Geraint', 'Steffan', 'Dylan', 'Matthew', 'Daniel', 'David',
            'Christopher', 'Andrew', 'Mark', 'James', 'Lee', 'Carl', 'Paul', 'Jason', 'Craig', 'Richard', 'Thomas'],
          nova: ['Noah', 'Oliver', 'Charlie', 'Arthur', 'Theo', 'Leo', 'Oscar', 'Alfie', 'George', 'Jacob', 'Teddy', 'Freddie', 'Harri', 'Osian', 'Gruffydd', 'Macsen',
            'Elis', 'Tomos', 'Cai', 'Ifan', 'Dylan', 'Jac', 'Ioan', 'Llewelyn', 'Rhys', 'Ianto', 'Finley']
        },
        fem: {
          antiga: ['Margaret', 'Mary', 'Gwyneth', 'Megan', 'Glenys', 'Eirlys', 'Mair', 'Myfanwy', 'Gwen', 'Olwen', 'Eluned', 'Beryl', 'Ceinwen', 'Bronwen', 'Nesta',
            'Elizabeth', 'Ann', 'Susan', 'Patricia', 'Jean', 'Christine', 'Valerie', 'Gwenda', 'Menna', 'Rhiannon', 'Delyth'],
          meio: ['Sian', 'Rhian', 'Catrin', 'Nia', 'Cerys', 'Bethan', 'Ffion', 'Lowri', 'Angharad', 'Elin', 'Sioned', 'Sarah', 'Emma', 'Claire', 'Rebecca', 'Laura',
            'Hannah', 'Kelly', 'Gemma', 'Rachel', 'Amy', 'Lisa', 'Nicola', 'Carys', 'Llinos', 'Rhiannon', 'Manon'],
          nova: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Lily', 'Ivy', 'Freya', 'Willow', 'Mia', 'Poppy', 'Evie', 'Ffion', 'Seren', 'Alys', 'Mali', 'Nansi', 'Efa', 'Lili',
            'Elsi', 'Megan', 'Cadi', 'Erin', 'Eira', 'Ela', 'Martha', 'Grace', 'Florence']
        },
        sobrenomes: [
          'Jones', 'Williams', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Lewis', 'Hughes', 'Morgan', 'Griffiths', 'Edwards', 'Owen', 'Price', 'Rees', 'Jenkins', 'Lloyd',
          'Powell', 'James', 'Phillips', 'Morris', 'Parry', 'Pritchard', 'Rowlands', 'Howells', 'Bowen', 'Pugh', 'Vaughan', 'Watkins', 'Prosser', 'Harris', 'Richards',
          'Smith', 'Johnson', 'Brown', 'Taylor', 'Wilson', 'Walker', 'Wood', 'Cooper', 'Robinson'
        ]
      },
      {
        // NISRA, Baby names in Northern Ireland (1997–2024).
        id: 'irlanda_norte',
        peso: 1.5,
        divisoes: ['NIR'],
        sobrenome: 'um',
        masc: {
          antiga: ['John', 'William', 'James', 'Robert', 'Samuel', 'Thomas', 'Patrick', 'Joseph', 'Hugh', 'Francis', 'Gerard', 'Brian', 'Desmond', 'Seamus', 'Eamon',
            'Kevin', 'Michael', 'Peter', 'David', 'George', 'Alan', 'Ernest', 'Raymond', 'Bernard', 'Cecil', 'Noel', 'Malachy'],
          meio: ['Ciarán', 'Seán', 'Conor', 'Patrick', 'Gareth', 'Mark', 'Paul', 'Michael', 'David', 'Stephen', 'Christopher', 'Darren', 'Declan', 'Niall', 'Kieran',
            'Ryan', 'Jonathan', 'Andrew', 'Damien', 'Barry', 'Colm', 'Gary', 'Martin', 'Neil', 'Shane', 'Brendan', 'Liam'],
          nova: ['James', 'Jack', 'Noah', 'Charlie', 'Oisín', 'Cillian', 'Tadhg', 'Fionn', 'Rían', 'Darragh', 'Theo', 'Leo', 'Harry', 'Thomas', 'Oliver', 'Jacob', 'Max',
            'Daniel', 'Cian', 'Patrick', 'Conor', 'Rory', 'Finn', 'Luca', 'Ethan', 'Aodhán', 'Peter']
        },
        fem: {
          antiga: ['Mary', 'Margaret', 'Elizabeth', 'Catherine', 'Anne', 'Bridget', 'Kathleen', 'Patricia', 'Eileen', 'Rosaleen', 'Teresa', 'Sheila', 'Maureen', 'Bernadette',
            'Joan', 'Jean', 'Isobel', 'Agnes', 'Martha', 'Sarah', 'Helen', 'Florence', 'Evelyn', 'Marion', 'Jane', 'Doreen', 'Irene'],
          meio: ['Ciara', 'Aoife', 'Niamh', 'Sinéad', 'Clare', 'Emma', 'Laura', 'Sarah', 'Louise', 'Lisa', 'Nicola', 'Claire', 'Gemma', 'Catherine', 'Joanne', 'Siobhán',
            'Orla', 'Gráinne', 'Áine', 'Róisín', 'Rachel', 'Amy', 'Jennifer', 'Lauren', 'Rebecca', 'Kerry', 'Shauna'],
          nova: ['Grace', 'Fiadh', 'Éabha', 'Aoife', 'Olivia', 'Emily', 'Sophie', 'Ella', 'Isla', 'Lily', 'Anna', 'Evie', 'Ava', 'Saoirse', 'Caoimhe', 'Erin', 'Sienna',
            'Amelia', 'Harper', 'Ellie', 'Freya', 'Lucy', 'Isabella', 'Róisín', 'Niamh', 'Hannah', 'Sadie']
        },
        sobrenomes: [
          'Wilson', 'Campbell', 'Kelly', 'Johnston', 'Moore', 'Thompson', 'Smith', 'Brown', "O'Neill", 'Doherty', 'Stewart', 'Quinn', 'Robinson', 'Murphy', 'Graham',
          'McLaughlin', 'Hamilton', 'Murray', 'Hughes', 'Patterson', 'Boyd', 'Martin', 'Gallagher', 'McKenna', 'Devlin', 'McCann', 'Burns', 'Donnelly', 'Reid', 'Bell',
          'Scott', 'McGrath', 'Walsh', "O'Hara", 'Magee', 'Kerr', 'Ferguson', 'Mullan', 'Hagan', 'Clarke'
        ]
      },
      {
        // Britânicos de família sul-asiática (paquistanesa, indiana,
        // bangladeshiana): ~7% da população da Inglaterra e do País de Gales
        // (ONS, Censo 2021); Muhammad é o nome masculino mais dado desde 2022 (ONS).
        id: 'sul_asiatico',
        peso: 0.08,
        divisoes: ['ENG', 'WLS', 'SCT'],
        sobrenome: 'um',
        masc: {
          antiga: ['Mohammed', 'Muhammad', 'Abdul', 'Mohammad', 'Ahmed', 'Ali', 'Rashid', 'Iqbal', 'Mahmood', 'Ghulam', 'Bashir', 'Nazir', 'Sadiq', 'Rafiq', 'Tariq',
            'Javed', 'Khalid', 'Anwar', 'Harjit', 'Gurdev', 'Balwinder', 'Amarjit', 'Rajesh', 'Ramesh', 'Suresh', 'Dinesh', 'Mahesh', 'Pradeep', 'Vijay', 'Ashok'],
          meio: ['Mohammed', 'Imran', 'Adnan', 'Asif', 'Kamran', 'Zahid', 'Wasim', 'Nadeem', 'Shahid', 'Faisal', 'Sajid', 'Amir', 'Hassan', 'Usman', 'Bilal', 'Kashif',
            'Rizwan', 'Sunil', 'Sanjay', 'Rakesh', 'Amit', 'Vikram', 'Rajan', 'Gurpreet', 'Manjit', 'Sandeep', 'Nikhil'],
          nova: ['Muhammad', 'Mohammed', 'Yusuf', 'Ibrahim', 'Ayaan', 'Zayn', 'Musa', 'Hamza', 'Adam', 'Rayyan', 'Aryan', 'Arjun', 'Dev', 'Rohan', 'Krish', 'Zain',
            'Ismail', 'Ali', 'Haris', 'Idris', 'Eesa', 'Aarav', 'Veer', 'Kabir', 'Rehan', 'Omar', 'Yahya']
        },
        fem: {
          antiga: ['Fatima', 'Nasreen', 'Parveen', 'Shamim', 'Rukhsana', 'Zubaida', 'Bilqis', 'Razia', 'Shahida', 'Kulwant', 'Surinder', 'Paramjit', 'Gurmit', 'Kamaljit',
            'Sukhwinder', 'Manjit', 'Pushpa', 'Saroj', 'Kamla', 'Usha', 'Asha', 'Sita', 'Lakshmi', 'Meena', 'Sharda', 'Jaswant'],
          meio: ['Ayesha', 'Sadia', 'Nadia', 'Saima', 'Shabana', 'Farah', 'Sana', 'Uzma', 'Sobia', 'Rabia', 'Asma', 'Amna', 'Rubina', 'Samina', 'Fozia', 'Tasneem',
            'Priya', 'Anjali', 'Pooja', 'Neha', 'Sunita', 'Reena', 'Rupinder', 'Harpreet', 'Jasvir', 'Kiran', 'Nisha'],
          nova: ['Maryam', 'Aisha', 'Fatima', 'Zainab', 'Hafsa', 'Khadija', 'Inaaya', 'Aleena', 'Eshal', 'Hanna', 'Amira', 'Anaya', 'Myra', 'Aaliyah', 'Laiba', 'Zara',
            'Sara', 'Mariam', 'Safa', 'Inaya', 'Aria', 'Diya', 'Saanvi', 'Riya', 'Simran', 'Amara', 'Hira']
        },
        sobrenomes: [
          'Khan', 'Patel', 'Ali', 'Ahmed', 'Hussain', 'Begum', 'Shah', 'Iqbal', 'Akhtar', 'Mahmood', 'Rahman', 'Islam', 'Uddin', 'Chowdhury', 'Miah', 'Malik', 'Butt',
          'Hassan', 'Rashid', 'Qureshi', 'Raza', 'Siddiqui', 'Sheikh', 'Mirza', 'Anwar', 'Singh', 'Kaur', 'Sandhu', 'Gill', 'Dhillon', 'Sidhu', 'Bains', 'Sharma',
          'Kumar', 'Mistry', 'Parmar', 'Chauhan', 'Joshi', 'Mehta', 'Desai', 'Gupta', 'Chopra'
        ]
      }
    ]
  },
  fontes: [
    'National Minimum Wage and National Living Wage rates, abr/2026 (12,71 £/h; gov.uk / Low Pay Commission).',
    'HMRC: personal allowance, NICs thresholds 2025/26–2026/27; Inheritance Tax nil-rate bands.',
    'Employment Rights Act 1996, s. 162; Pensions Act 2014; Jobseeker\'s Allowance (New Style), gov.uk.',
    'Administration of Estates Act 1925 (alterado pelo Inheritance and Trustees\' Powers Act 2014; legado fixo 322.000 £, SI 2023/758); Inheritance (Provision for Family and Dependants) Act 1975; Succession (Scotland) Act 1964.',
    'Dissolution and Calling of Parliament Act 2022; Local Government Act 2000 e Cities and Local Government Devolution Act 2016 (prefeitos eleitos).',
    'DWP, Households Below Average Income 2023/24; ONS ASHE 2024; ONS Census 2021 (grupos étnicos).',
    'ONS Baby names (England and Wales); NRS Babies\' first names; NISRA Baby names.',
    'Premier League / EFL: estrutura das competições 2025/26.'
  ]
};

export const PAISES: PerfilDePais[] = [PORTUGAL, ESPANHA, FRANCA, ALEMANHA, ITALIA, REINO_UNIDO];
