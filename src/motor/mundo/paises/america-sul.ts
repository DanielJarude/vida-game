/**
 * AMÉRICA DO SUL (hispânica) — Argentina, Chile, Uruguai, Colômbia e Peru.
 *
 * Cada perfil é um país real, com as instituições dele. As fontes de cada
 * número estão em `fontes`; onde a realidade é complexa demais para o nível
 * do jogo (imposto de renda progressivo, sucessão, leis provinciais), há uma
 * ABSTRAÇÃO DECLARADA no comentário acima do perfil. Notas de proveniência:
 * `docs/notas/FONTES-PAISES-AMERICAS-LATINA.md`.
 *
 * Convenções comuns:
 *  - dinheiro em MOEDA LOCAL POR MÊS (o motor converte pelo `fator` do catálogo);
 *  - `contribuicao.aliquota`: tudo o que a lei desconta do salário do
 *    empregado para a seguridade (aposentadoria + saúde + seguro-desemprego),
 *    porque é isso que separa o bruto do líquido;
 *  - `impostoRenda`: isenção mensal (bruto aproximado) e UMA alíquota marginal
 *    que reproduz, grosso modo, o imposto de quem ganha entre 1,5 e 3 vezes a
 *    isenção — não é a primeira faixa nem a última;
 *  - `classes`: pesos ao nascer, calibrados pela pobreza monetária oficial
 *    (vulneravel ≈ pobreza menos uma margem, trabalhadora ≈ o quase-pobre),
 *    pelo Gini e pelo tamanho da classe média de cada país.
 */

import type { PerfilDePais } from '../tipos';

/* ================================================================ ARGENTINA
 *
 * ECONOMIA: pobreza de 28,2% das pessoas e indigência de 6,3% (INDEC, EPH,
 * 2º semestre de 2025); Gini ~0,43. Informalidade: 43% dos ocupados sem
 * registro (INDEC, 4º tri 2025). Inflação: 2025 fechou perto de 31%, e 2026
 * corre a 2–2,5% ao mês — 0,30 é o nível "recente realista"; volatilidade no
 * máximo da escala (o país de maior instabilidade de preços da região).
 * Salário mínimo: SMVM de ARS 383.800 desde 1/9/2026 (Res. 4/2026 do Consejo
 * del Salario), subindo mês a mês até 437.000 em abril de 2027.
 *
 * DIFERENÇAS REGIONAIS (modestas): a Cidade de Buenos Aires e a Patagônia
 * (Neuquén; salários com "zona desfavorável") pagam e custam mais; o Noroeste
 * (Jujuy, Salta, Tucumán) tem a renda média mais baixa do país (INDEC, EPH,
 * renda por aglomerado).
 *
 * TRABALHO: SAC (aguinaldo, Lei 23.041) = 13 salários. Descontos do empregado:
 * 11% aposentadoria (SIPA) + 3% PAMI (Lei 19.032) + 3% obra social (Lei 23.660)
 * = 17%, até a base imponível máxima (ARS 4.594.798 em ago/2026, ANSES,
 * atualizada mensalmente pelo IPC). Ganancias: um solteiro sem filhos começa a
 * pagar a partir de ~ARS 3.000.000 brutos/mês (1º semestre de 2026, ARCA);
 * escala de 5% a 35% sobre o líquido — 15% sobre o bruto excedente é a média
 * da faixa de quem passa do piso. Indenização por antiguidade: 1 salário por
 * ano (LCT, art. 245). Seguro-desemprego (Lei 24.013): 2 a 12 meses conforme o
 * tempo de contribuição, com teto baixo — 6 meses a ~50% é a abstração.
 * Aposentadoria: 65 (homens) e 60 (mulheres), 30 anos de contribuição
 * (Lei 24.241). Concurso: previsto em leis de carreira, mas não é a porta de
 * entrada típica do serviço público argentino (nomeações e contratos) — false.
 *
 * POLÍTICA: as idades e casas municipais/provinciais variam por província; a
 * referência é a Província de Buenos Aires (Lei Orgânica das Municipalidades,
 * DL 6769/58: concejal e intendente, 25 anos; Constituição da PBA: deputado
 * 22 anos, governador 30). Nacional: deputado 25 anos, mandato de 4 (art. 48
 * e 50 da Constituição), senador 30 anos, mandato de 6 (art. 55 e 56).
 * A Câmara se renova pela metade a cada 2 anos; o jogo usa o ciclo
 * presidencial de 4 (outubro de 2027). Voto obrigatório (Lei 19.945, art. 12).
 *
 * SUCESSÃO — Código Civil e Comercial da Nação (Lei 26.994/2014):
 *  - legitimários: descendentes, ascendentes e cônjuge (art. 2444); legítima de
 *    2/3 para descendentes, 1/2 para ascendentes e 1/2 para o cônjuge
 *    (art. 2445) — o jogo usa 2/3, o caso típico (com filhos);
 *  - o cônjuge concorre com os descendentes como mais um filho sobre os bens
 *    próprios, e não herda a parte do falecido nos bens ganhos em comum —
 *    porque já tem a metade deles (art. 2433); com ascendentes, fica com a
 *    metade (art. 2434), haja um ou dois pais;
 *  - representação (art. 2427); colaterais até o 4º grau (art. 2438);
 *  - regime supletivo: comunidade de ganhos (art. 463) — meação;
 *  - sem herdeiros, os bens vão ao Estado nacional, provincial ou à Cidade de
 *    Buenos Aires, conforme onde estejam (art. 2441 e 2424).
 *  SIMPLIFICAÇÕES: a distinção bens próprios/ganhos é reduzida a "o cônjuge
 *  concorre por cabeça" (a meação já cobre os ganhos); não há imposto nacional
 *  sobre herança — só a Província de Buenos Aires cobra o Imposto à
 *  Transmissão Gratuita de Bens (Lei 14.044); custas judiciais (taxa de
 *  justiça) e honorários regulados entram como uma taxa média de 6%.
 */
const AR_NOMES = {
  masc: {
    antiga: ['Juan Carlos', 'Jorge', 'Carlos', 'Roberto', 'Héctor', 'Osvaldo', 'Rubén', 'Miguel Ángel', 'Hugo', 'Raúl', 'Alberto', 'Ricardo', 'Daniel',
      'Oscar', 'Mario', 'Luis', 'José', 'Juan', 'Domingo', 'Néstor', 'Norberto', 'Horacio', 'Eduardo', 'Ángel', 'Rodolfo', 'Alfredo', 'Ramón', 'Julio'],
    meio: ['Juan Pablo', 'Martín', 'Pablo', 'Sebastián', 'Diego', 'Matías', 'Leandro', 'Federico', 'Gonzalo', 'Nicolás', 'Mariano', 'Lucas', 'Facundo',
      'Ezequiel', 'Maximiliano', 'Damián', 'Hernán', 'Cristian', 'Gastón', 'Emiliano', 'Agustín', 'Lautaro', 'Franco', 'Germán', 'Marcos', 'Ramiro', 'Javier', 'Alejandro'],
    nova: ['Benjamín', 'Gael', 'Mateo', 'Bautista', 'Thiago', 'Felipe', 'Lorenzo', 'Liam', 'Valentino', 'Joaquín', 'Santino', 'Benicio', 'Francisco',
      'León', 'Tomás', 'Lautaro', 'Ciro', 'Enzo', 'Noah', 'Simón', 'Santiago', 'Máximo', 'Augusto', 'Emiliano', 'Juan Cruz', 'Bruno', 'Dante', 'Ignacio']
  },
  fem: {
    antiga: ['María', 'Ana María', 'Graciela', 'Susana', 'Norma', 'Marta', 'Silvia', 'Beatriz', 'Mirta', 'Liliana', 'Stella Maris', 'Alicia', 'Elsa',
      'Rosa', 'Teresa', 'Nélida', 'Olga', 'Haydée', 'Elena', 'Isabel', 'Delia', 'Blanca', 'Raquel', 'Cristina', 'Mónica', 'Margarita', 'Irma', 'Nilda'],
    meio: ['Carolina', 'Paula', 'Natalia', 'Florencia', 'Romina', 'Vanesa', 'Soledad', 'Gabriela', 'Lorena', 'Valeria', 'Agustina', 'Micaela', 'Daiana',
      'Melina', 'Luciana', 'Celeste', 'Noelia', 'Cecilia', 'Verónica', 'Andrea', 'Jesica', 'Camila', 'Milagros', 'Belén', 'Rocío', 'Antonela', 'Mariela', 'Julieta'],
    nova: ['Olivia', 'Emilia', 'Isabella', 'Catalina', 'Emma', 'Martina', 'Mía', 'Delfina', 'Alma', 'Sofía', 'Julieta', 'Victoria', 'Valentina',
      'Renata', 'Amparo', 'Morena', 'Zoe', 'Pilar', 'Lucía', 'Guadalupe', 'Josefina', 'Aurora', 'Ámbar', 'Malena', 'Felicitas', 'Juana', 'Francesca', 'Lola']
  }
};

const ARGENTINA: PerfilDePais = {
  id: 'AR',
  // Regras legais: licença de conduzir aos 17 (Lei 24.449, art. 11).
  regras: { direcao: { nome: 'licença de conduzir', plena: 17 } },
  gentilico: ['argentino', 'argentina'],
  idiomas: ['espanhol'],
  divisao: {
    tipo: ['província', 'províncias'],
    lista: [
      { codigo: 'C', nome: 'Cidade Autônoma de Buenos Aires', custo: 1.2, salario: 1.25 },
      { codigo: 'B', nome: 'Buenos Aires' },
      { codigo: 'X', nome: 'Córdoba' },
      { codigo: 'S', nome: 'Santa Fe' },
      { codigo: 'M', nome: 'Mendoza' },
      { codigo: 'T', nome: 'Tucumán', custo: 0.9, salario: 0.82 },
      { codigo: 'A', nome: 'Salta', custo: 0.9, salario: 0.82 },
      { codigo: 'Y', nome: 'Jujuy', custo: 0.88, salario: 0.8 },
      { codigo: 'Q', nome: 'Neuquén', custo: 1.15, salario: 1.25 }
    ]
  },
  cidades: [
    ['Buenos Aires', 'C', 'metropole', 'capital|sede|litoral'],
    ['Avellaneda', 'B', 'metropolitana', 'metro:Buenos Aires'],
    ['Lanús', 'B', 'metropolitana', 'metro:Buenos Aires'],
    ['La Plata', 'B', 'capital', 'sede'],
    ['Mar del Plata', 'B', 'polo', 'litoral'],
    ['Bahía Blanca', 'B', 'polo', 'litoral'],
    ['Córdoba', 'X', 'metropole', 'sede'],
    ['Rosario', 'S', 'metropole', 'litoral'],
    ['Santa Fe', 'S', 'capital', 'sede|litoral'],
    ['Mendoza', 'M', 'metropole', 'sede'],
    ['San Miguel de Tucumán', 'T', 'capital', 'sede'],
    ['Salta', 'A', 'capital', 'sede'],
    ['Neuquén', 'Q', 'capital', 'sede'],
    ['Humahuaca', 'Y', 'pequena']
  ],
  economia: {
    classes: { vulneravel: 20, trabalhadora: 32, media_baixa: 24, media: 18, alta: 6 },
    moradia: 1,
    salarioMinimo: 383800,
    informalidade: 0.43,
    inflacao: 0.3,
    volatilidade: 2.5
  },
  trabalho: {
    mesesPagos: 13,
    contribuicao: { aliquota: [0.17, 0.17], teto: 4594798 },
    impostoRenda: { isencao: 3000000, aliquota: 0.15 },
    rescisao: { nome: 'indenização por antiguidade', mesesPorAno: 1 },
    seguroDesemprego: { meses: 6, reposicao: 0.5 },
    previdencia: { idade: [65, 60], anos: [30, 30], reposicao: 0.55, nome: 'ANSES (SIPA)' },
    concurso: false,
    contratoFormal: 'trabalho registrado ("en blanco")'
  },
  educacao: {
    etapas: {
      fundamental: 'primário', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o jardim maternal municipal', fundamental: 'a escola pública do bairro', medio: 'a escola secundária pública' }
    },
    ingresso: 'acesso_aberto',
    // Lei de Educação Superior (24.521, mod. Lei 27.204/2015): ingresso livre e gratuito
    // nas universidades nacionais; cada uma tem seu curso de ingresso (na UBA, o CBC), sem ranking nacional.
    exame: { nome: 'curso de ingresso', artigo: 'o' },
    publicaCobra: 0,
    // Becas Progresar: renda familiar de até 3 SMVM (≈ 1 SMVM por pessoa numa família de três).
    bolsa: { nome: 'Becas Progresar', teto: 1 },
    cotas: false,
    privadaComum: false // ~1 em cada 5 universitários está numa privada (SIU/SPU)
  },
  politica: {
    sistema: 'república presidencialista federal',
    cargos: {
      vereador: { titulo: ['concejal', 'concejala'], anos: 4, idade: 25, casa: 'o Concejo Deliberante' },
      prefeito: { titulo: ['intendente', 'intendenta'], anos: 4, idade: 25, casa: 'a Municipalidade' },
      deputado_estadual: { titulo: ['deputado provincial', 'deputada provincial'], anos: 4, idade: 22, casa: 'a Legislatura provincial' },
      deputado_federal: { titulo: ['deputado nacional', 'deputada nacional'], anos: 4, idade: 25, casa: 'a Câmara de Deputados da Nação' },
      senador: { titulo: ['senador nacional', 'senadora nacional'], anos: 6, idade: 30, casa: 'o Senado da Nação' },
      governador: { titulo: ['governador', 'governadora'], anos: 4, idade: 30, casa: 'o governo da província' }
    },
    eleicoes: { local: [2027, 4], geral: [2027, 4] },
    mes: 9,
    obrigatorio: true,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // serviço militar voluntário desde a Lei 24.429 (1995)
    idade: 18,
    forcas: { exercito: 'o Exército Argentino', marinha: 'a Armada Argentina', aeronautica: 'a Força Aérea Argentina' },
    policia: 'a polícia da província' // cada província tem a sua; na capital, a Polícia da Cidade
  },
  esporte: {
    popularidade: { futebol: 1.5, basquete: 1.15, tenis: 1.3, volei: 1, lutas: 0.9, natacao: 0.8, atletismo: 0.7 },
    divisoes: ['Primera C', 'Primera B Metropolitana', 'Primera Nacional', 'Liga Profesional'],
    clubes: [
      { nome: 'Boca Juniors', artigo: 'o', porte: 'grande', cidade: 'Buenos Aires' },
      { nome: 'River Plate', artigo: 'o', porte: 'grande', cidade: 'Buenos Aires' },
      { nome: 'Racing Club', artigo: 'o', porte: 'grande', cidade: 'Avellaneda' },
      { nome: 'Independiente', artigo: 'o', porte: 'grande', cidade: 'Avellaneda' },
      { nome: 'San Lorenzo', artigo: 'o', porte: 'grande', cidade: 'Buenos Aires' },
      { nome: 'Vélez Sarsfield', artigo: 'o', porte: 'tradicional', cidade: 'Buenos Aires' },
      { nome: 'Lanús', artigo: 'o', porte: 'tradicional', cidade: 'Lanús' },
      { nome: 'Estudiantes de La Plata', artigo: 'o', porte: 'tradicional', cidade: 'La Plata' },
      { nome: 'Rosario Central', artigo: 'o', porte: 'tradicional', cidade: 'Rosario' },
      { nome: "Newell's Old Boys", artigo: 'o', porte: 'tradicional', cidade: 'Rosario' },
      { nome: 'Talleres', artigo: 'o', porte: 'tradicional', cidade: 'Córdoba' },
      { nome: 'Belgrano', artigo: 'o', porte: 'tradicional', cidade: 'Córdoba' },
      { nome: 'Godoy Cruz', artigo: 'o', porte: 'tradicional', cidade: 'Mendoza' }, // Godoy Cruz é município da Grande Mendoza
      { nome: 'Atlético Tucumán', artigo: 'o', porte: 'tradicional', cidade: 'San Miguel de Tucumán' },
      { nome: 'Olimpo', artigo: 'o', porte: 'regional', cidade: 'Bahía Blanca' },
      { nome: 'Gimnasia y Tiro', artigo: 'o', porte: 'regional', cidade: 'Salta' }
    ]
  },
  // Hospitais públicos atendem todos (gratuitos); os assalariados têm obra social; quem pode paga uma "prepaga".
  saude: { sistema: 'misto', redePublica: 'o hospital público', custoPlano: 1 },
  // Lei de Migrações 25.871: residência MERCOSUL por nacionalidade; de fora, por categorias (trabalho, estudo...).
  migracao: { blocos: ['mercosul'], abertura: 'seletiva' },
  sucessao: {
    pais: 'AR',
    nome: 'Argentina',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 2, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.06,
    rotuloCusto: 'taxa de justiça e honorários do juízo sucessório',
    vacancia: 'o Estado (a província, a Cidade ou a Nação)'
  },
  nomes: {
    cortes: [1975, 2005],
    grupos: [
      {
        id: 'ar',
        peso: 0.92,
        sobrenome: 'um', // registra-se o paterno; o materno é opcional e pouco usado no dia a dia
        ...AR_NOMES,
        sobrenomes: [
          'González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez',
          'Romero', 'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina',
          'Suárez', 'Herrera', 'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez', 'Molina', 'Silva', 'Castro', 'Rojas',
          'Ortiz', 'Núñez', 'Luna', 'Juárez', 'Cabrera', 'Ríos', 'Ferreyra', 'Godoy', 'Morales', 'Domínguez',
          'Moreno', 'Peralta', 'Vega', 'Carrizo', 'Quiroga', 'Castillo', 'Ledesma', 'Muñoz', 'Ojeda', 'Ponce',
          'Vera', 'Vázquez', 'Villalba', 'Cardozo', 'Navarro', 'Coronel', 'Russo', 'Romano', 'Ferrari', 'Bianchi',
          'Costa', 'Rossi', 'Fontana', 'Gallo', 'Lombardi'
        ]
      },
      {
        // Noroeste: os sobrenomes quéchuas e aimarás (Mamani é o mais comum de Jujuy) convivem com os hispânicos.
        id: 'ar_noroeste',
        peso: 0.08,
        divisoes: ['Y', 'A', 'T'],
        sobrenome: 'um',
        ...AR_NOMES,
        sobrenomes: [
          'Mamani', 'Cruz', 'Flores', 'Vilte', 'Quispe', 'Choque', 'Tolaba', 'Guaymás', 'Condori', 'Colque',
          'Vilca', 'Zerpa', 'Aramayo', 'Tejerina', 'Farfán', 'Gareca', 'Apaza', 'Chauque', 'Ríos', 'Mendoza',
          'Gutiérrez', 'Rodríguez', 'López', 'Vargas', 'Ramos', 'Tapia', 'Cardozo', 'Díaz', 'Ruiz', 'Soria',
          'Juárez', 'Gómez', 'Romero', 'Medina', 'Castillo', 'Martínez', 'Fernández', 'Sánchez', 'Pérez', 'Alancay'
        ]
      }
    ]
  },
  fontes: [
    'INDEC, EPH — Incidencia de la pobreza y la indigencia, 2º semestre 2025 (pobreza 28,2%, indigência 6,3%): indec.gob.ar',
    'INDEC, Mercado de trabajo — informalidade de 43,0% dos ocupados (4º tri 2025)',
    'Consejo Nacional del Empleo, la Productividad y el SMVM, Resolución 4/2026 (Boletín Oficial, 02/09/2026): SMVM ARS 383.800 desde 1/9/2026',
    'ANSES — bases imponíveis mínima e máxima, agosto de 2026 (máx. ARS 4.594.798,23)',
    'ARCA — Ganancias, deduções pessoais 2026 (piso de ~ARS 3,0 milhões brutos para solteiro sem filhos, 1º semestre)',
    'Ley de Contrato de Trabajo 20.744, art. 245 (indenização); Ley 23.041 (SAC); Ley 24.013 (seguro-desemprego); Ley 24.241 (SIPA)',
    'Constitución de la Nación Argentina, arts. 48, 50, 55, 56; Constitución de la Provincia de Buenos Aires; Decreto-Ley 6769/58 (Ley Orgánica de las Municipalidades)',
    'Código Electoral Nacional (Ley 19.945), art. 12 (voto obrigatório); Ley 24.429 (serviço militar voluntário)',
    'Código Civil y Comercial de la Nación (Ley 26.994): arts. 463, 2424, 2427, 2433, 2434, 2438, 2444, 2445',
    'Ley de Educación Superior 24.521 e Ley 27.204 (gratuidade e ingresso irrestrito); Programa Becas Progresar (argentina.gob.ar)',
    'Ley de Migraciones 25.871; Acordo de Residência do MERCOSUL (2002)',
    'RENAPER — nomes mais registrados (2024–2025: Benjamín, Gael, Mateo; Olivia, Emilia, Isabella)',
    'AFA — estrutura das divisões (Liga Profesional, Primera Nacional, Primera B Metropolitana, Primera C)'
  ]
};

/* ==================================================================== CHILE
 *
 * ECONOMIA: pobreza por renda de 17,3% (CASEN 2024, nova metodologia,
 * Ministerio de Desarrollo Social); Gini ~0,46. Informalidade 26,8% (INE,
 * out–dez 2025). Inflação na meta do Banco Central (3%), com 2025 perto de
 * 3,5–4%. Moradia: o preço da casa em Santiago é dos mais altos da região em
 * anos de renda (relatórios da CChC e do Banco Central) — 1,25.
 * Salário mínimo: IMM de CLP 553.553 desde 1/5/2026 (18 a 65 anos).
 * Regional: a Região Metropolitana e a mineira Antofagasta pagam mais; a
 * Araucanía tem a renda mais baixa (CASEN).
 *
 * TRABALHO: 12 salários (a "gratificación legal" do art. 47/50 do Código do
 * Trabalho costuma vir diluída no salário mensal; não há 13º obrigatório).
 * Descontos: AFP 10% + comissão da AFP (0,46%–1,45%) + saúde 7% + seguro de
 * cesantia 0,6% ≈ 18–19%, até 90 UF (≈ CLP 3,67 milhões). Imposto Único de
 * Segunda Categoria: isento até 13,5 UTM (≈ CLP 965 mil); 4% até 30 UTM e 8%
 * até 50 UTM — 6% sobre o excedente é a média de quem passa do piso.
 * Indenização por anos de serviço: 1 salário por ano, com teto de 11 anos
 * (art. 163). Seguro de Cesantia (Lei 19.728): até 5 meses pelo Fundo
 * Solidário, decrescentes de 70% a 35% (~50% médio). Aposentadoria: 65/60;
 * a AFP não exige anos mínimos (paga o que foi acumulado) e a Pensão
 * Garantizada Universal exige residência, não contribuição — anos [0, 0].
 * Concurso: o ingresso na "planta" é por concurso, mas a maioria do pessoal
 * do governo central entra "a contrata", sem concurso (DIPRES) — false.
 *
 * POLÍTICA: república presidencialista unitária com regiões. Concejal e
 * alcalde (4 anos, Lei 18.695), conselheiro regional e governador regional
 * eleitos diretamente (4 anos; governadores desde 2021, Lei 21.073), deputado
 * (4 anos, 21 anos de idade, art. 48 da Constituição), senador (8 anos, 35 de
 * idade, art. 50). Idades municipais e regionais: basta ser cidadão com
 * direito a voto (18). Municipais/regionais: outubro de 2028; parlamentares e
 * presidencial: novembro de 2029. Voto obrigatório restabelecido pela Lei
 * 21.524 (2022). Serviço militar: obrigatório na lei (DL 2.306), mas as vagas
 * são preenchidas por voluntários e o sorteio só cobre a falta — 'seletivo'.
 *
 * SUCESSÃO — Código Civil (DFL 1/2000):
 *  - legitimários: filhos (e descendentes por representação), ascendentes e
 *    cônjuge (art. 1182); metade da herança é a "metade legitimaria"; um
 *    quarto é a "quarta de melhoras", que só pode ir a descendentes, cônjuge
 *    ou ascendentes (art. 1184 e 1195); só o último quarto é livre — por isso
 *    o jogo usa 3/4 como parte reservada à família;
 *  - o cônjuge concorre com os filhos recebendo o dobro da legítima de cada
 *    filho, ou o mesmo que um, se há um só (art. 988) — no jogo, por cabeça;
 *  - sem descendentes, o cônjuge leva 2/3 e os ascendentes 1/3 (art. 989);
 *  - depois, irmãos (art. 990); representação (art. 984);
 *  - regime supletivo: sociedade conjugal (art. 135) — meação;
 *  - sem herdeiros, o Fisco (art. 995).
 *  Imposto: Lei 16.271 (herança e doações), progressivo de 1% a 25% com
 *  isenção alta para cônjuge e filhos; com a posse efetiva (tramitada no
 *  Registro Civil quando intestada), o custo médio fica em ~5%.
 */
const CL_NOMES = {
  masc: {
    antiga: ['José', 'Juan', 'Luis', 'Carlos', 'Jorge', 'Manuel', 'Pedro', 'Sergio', 'Hernán', 'Héctor', 'Raúl', 'Mario', 'Óscar', 'Patricio',
      'Eduardo', 'Ricardo', 'Fernando', 'Víctor', 'Ramón', 'Hugo', 'Alfredo', 'Guillermo', 'René', 'Nelson', 'Osvaldo', 'Arturo', 'Humberto', 'Luis Alberto'],
    meio: ['Cristián', 'Rodrigo', 'Felipe', 'Sebastián', 'Francisco', 'Matías', 'Nicolás', 'Diego', 'Gonzalo', 'Claudio', 'Mauricio', 'Marcelo',
      'Alejandro', 'Javier', 'Andrés', 'Pablo', 'Daniel', 'Juan Pablo', 'Jaime', 'Camilo', 'Ignacio', 'Bastián', 'Fabián', 'Cristóbal', 'Esteban', 'Álvaro', 'Rodolfo', 'Iván'],
    nova: ['Mateo', 'Agustín', 'Gaspar', 'Benjamín', 'Lucas', 'Liam', 'Tomás', 'Vicente', 'Joaquín', 'Santiago', 'León', 'Simón', 'Facundo',
      'Maximiliano', 'Martín', 'Emiliano', 'Bastián', 'Lautaro', 'Julián', 'Luciano', 'Alonso', 'Cristóbal', 'Thiago', 'Damián', 'Gabriel', 'Josué', 'Ian', 'Jacob']
  },
  fem: {
    antiga: ['María', 'Ana', 'Rosa', 'Margarita', 'Juana', 'Gloria', 'Luisa', 'Elena', 'Carmen', 'Teresa', 'Ximena', 'Patricia', 'Silvia', 'Olga',
      'Sonia', 'Inés', 'Mercedes', 'Isabel', 'Eliana', 'Gladys', 'Nancy', 'Marta', 'Raquel', 'Hilda', 'Graciela', 'Lidia', 'Norma', 'Cecilia'],
    meio: ['Carolina', 'Daniela', 'Francisca', 'Javiera', 'Camila', 'Constanza', 'Valentina', 'Catalina', 'Macarena', 'Paula', 'Fernanda', 'Karina',
      'Claudia', 'Marcela', 'Paola', 'Andrea', 'Pamela', 'Alejandra', 'Lorena', 'Verónica', 'Natalia', 'Katherine', 'Nicole', 'Bárbara', 'Tamara', 'Romina', 'Valeska', 'Consuelo'],
    nova: ['Emma', 'Emilia', 'Sofía', 'Isabella', 'Agustina', 'Josefa', 'Florencia', 'Trinidad', 'Catalina', 'Amanda', 'Julieta', 'Mía', 'Antonella',
      'Martina', 'Isidora', 'Maite', 'Olivia', 'Renata', 'Laura', 'Colomba', 'Aurora', 'Amparo', 'Rafaela', 'Fernanda', 'Leonor', 'Pascal', 'Ignacia', 'Eloísa']
  }
};

const CHILE: PerfilDePais = {
  id: 'CL',
  gentilico: ['chileno', 'chilena'],
  idiomas: ['espanhol'],
  divisao: {
    tipo: ['região', 'regiões'],
    lista: [
      { codigo: 'RM', nome: 'Região Metropolitana de Santiago', custo: 1.1, salario: 1.15 },
      { codigo: 'VS', nome: 'Valparaíso' },
      { codigo: 'BI', nome: 'Biobío', salario: 0.92 },
      { codigo: 'AN', nome: 'Antofagasta', custo: 1.15, salario: 1.25 },
      { codigo: 'CO', nome: 'Coquimbo', salario: 0.92 },
      { codigo: 'AR', nome: 'Araucanía', custo: 0.9, salario: 0.8 },
      { codigo: 'LI', nome: "O'Higgins", salario: 0.92 },
      { codigo: 'LL', nome: 'Los Lagos', salario: 0.9 }
    ]
  },
  cidades: [
    ['Santiago', 'RM', 'metropole', 'capital|sede'],
    ['Puente Alto', 'RM', 'metropolitana', 'metro:Santiago'],
    ['Valparaíso', 'VS', 'metropole', 'sede|litoral'],
    ['Viña del Mar', 'VS', 'metropolitana', 'metro:Valparaíso|litoral'],
    ['Concepción', 'BI', 'metropole', 'sede'],
    ['Talcahuano', 'BI', 'metropolitana', 'metro:Concepción|litoral'],
    ['Los Ángeles', 'BI', 'polo'],
    ['Antofagasta', 'AN', 'capital', 'sede|litoral'],
    ['Calama', 'AN', 'polo'],
    ['La Serena', 'CO', 'capital', 'sede|litoral'],
    ['Rancagua', 'LI', 'capital', 'sede'],
    ['Temuco', 'AR', 'capital', 'sede'],
    ['Puerto Montt', 'LL', 'capital', 'sede|litoral'],
    ['Castro', 'LL', 'pequena', 'litoral']
  ],
  economia: {
    classes: { vulneravel: 13, trabalhadora: 29, media_baixa: 26, media: 22, alta: 10 },
    moradia: 1.25,
    salarioMinimo: 553553,
    informalidade: 0.27,
    inflacao: 0.04,
    volatilidade: 0.7
  },
  trabalho: {
    mesesPagos: 12,
    contribuicao: { aliquota: [0.18, 0.19], teto: 3670000 },
    impostoRenda: { isencao: 965000, aliquota: 0.06 },
    rescisao: { nome: 'indenização por anos de serviço', mesesPorAno: 1 },
    seguroDesemprego: { meses: 5, reposicao: 0.5 },
    previdencia: { idade: [65, 60], anos: [0, 0], reposicao: 0.4, nome: 'AFP e Pensão Garantizada Universal' },
    concurso: false,
    contratoFormal: 'contrato com cotizações'
  },
  educacao: {
    etapas: {
      fundamental: 'ensino básico', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o jardim infantil da JUNJI', fundamental: 'a escola pública do bairro', medio: 'o liceu público' }
    },
    ingresso: 'exame_nacional', // Sistema de Acesso (Lei 21.091): a PAES, aplicada pelo DEMRE, ordena a admissão
    exame: { nome: 'PAES', artigo: 'a' },
    publicaCobra: 0.8, // as universidades estatais cobram mensalidades próximas das privadas; quem tem Gratuidade não paga
    bolsa: { nome: 'Gratuidade', teto: 0.8 }, // famílias dos 60% de menor renda (≈ 0,8 IMM por pessoa)
    credito: { nome: 'CAE (Crédito com Aval do Estado)' }, // o projeto do FES, que o substituiria, não virou lei até 2026
    cotas: true, // PACE e vagas de equidade obrigatórias para as instituições com gratuidade (Lei 21.091)
    privadaComum: true
  },
  politica: {
    sistema: 'república presidencialista unitária, com governos regionais eleitos',
    cargos: {
      vereador: { titulo: ['concejal', 'concejala'], anos: 4, idade: 18, casa: 'o Concejo Municipal' },
      prefeito: { titulo: ['alcalde', 'alcaldesa'], anos: 4, idade: 18, casa: 'a Municipalidade' },
      deputado_estadual: { titulo: ['conselheiro regional', 'conselheira regional'], anos: 4, idade: 18, casa: 'o Conselho Regional' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 4, idade: 21, casa: 'a Câmara de Deputados' },
      senador: { titulo: ['senador', 'senadora'], anos: 8, idade: 35, casa: 'o Senado' },
      governador: { titulo: ['governador regional', 'governadora regional'], anos: 4, idade: 18, casa: 'o Governo Regional' }
    },
    eleicoes: { local: [2028, 4], geral: [2029, 4] },
    mes: 10,
    obrigatorio: true,
    partidosReais: false
  },
  militar: {
    servico: 'seletivo',
    idade: 18,
    forcas: { exercito: 'o Exército do Chile', marinha: 'a Armada do Chile', aeronautica: 'a Força Aérea do Chile' },
    policia: 'os Carabineros'
  },
  esporte: {
    popularidade: { futebol: 1.35, tenis: 1.15, basquete: 0.8, atletismo: 0.8, natacao: 0.75, volei: 0.7, lutas: 0.7 },
    divisoes: ['Tercera División A', 'Segunda División Profesional', 'Primera B', 'Primera División'],
    clubes: [
      { nome: 'Colo-Colo', artigo: 'o', porte: 'grande', cidade: 'Santiago' },
      { nome: 'Universidad de Chile', artigo: 'a', porte: 'grande', cidade: 'Santiago' },
      { nome: 'Universidad Católica', artigo: 'a', porte: 'grande', cidade: 'Santiago' },
      { nome: 'Cobreloa', artigo: 'o', porte: 'tradicional', cidade: 'Calama' },
      { nome: 'Everton', artigo: 'o', porte: 'tradicional', cidade: 'Viña del Mar' },
      { nome: 'Santiago Wanderers', artigo: 'o', porte: 'tradicional', cidade: 'Valparaíso' },
      { nome: "O'Higgins", artigo: 'o', porte: 'tradicional', cidade: 'Rancagua' },
      { nome: 'Huachipato', artigo: 'o', porte: 'tradicional', cidade: 'Talcahuano' },
      { nome: 'Universidad de Concepción', artigo: 'a', porte: 'tradicional', cidade: 'Concepción' },
      { nome: 'Unión Española', artigo: 'a', porte: 'tradicional', cidade: 'Santiago' },
      { nome: 'Palestino', artigo: 'o', porte: 'tradicional', cidade: 'Santiago' },
      { nome: 'Audax Italiano', artigo: 'o', porte: 'tradicional', cidade: 'Santiago' },
      { nome: 'Deportes Concepción', artigo: 'o', porte: 'regional', cidade: 'Concepción' },
      { nome: 'Deportes Antofagasta', artigo: 'o', porte: 'regional', cidade: 'Antofagasta' },
      { nome: 'Deportes Temuco', artigo: 'o', porte: 'regional', cidade: 'Temuco' },
      { nome: 'Deportes La Serena', artigo: 'o', porte: 'regional', cidade: 'La Serena' }
    ]
  },
  // FONASA (público, cerca de 4/5 da população) ou ISAPRE (privado), com os 7% obrigatórios.
  saude: { sistema: 'misto', redePublica: 'o FONASA', custoPlano: 1.3 },
  // Lei 21.325 (2021): vistos por categorias; Chile aplica o Acordo de Residência do MERCOSUL como associado.
  migracao: { blocos: ['mercosul'], abertura: 'seletiva' },
  sucessao: {
    pais: 'CL',
    nome: 'Chile',
    legitima: 3 / 4,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [2 / 3, 2 / 3],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.05,
    rotuloCusto: 'imposto de herança (Lei 16.271) e custos da posse efetiva',
    vacancia: 'o Fisco'
  },
  nomes: {
    cortes: [1975, 2005],
    grupos: [
      {
        id: 'cl',
        peso: 0.9,
        sobrenome: 'dois',
        ...CL_NOMES,
        sobrenomes: [
          'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda',
          'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela',
          'Castillo', 'Tapia', 'Reyes', 'Gutiérrez', 'Castro', 'Pizarro', 'Álvarez', 'Vásquez', 'Sánchez', 'Fernández',
          'Ramírez', 'Carrasco', 'Gómez', 'Cortés', 'Herrera', 'Núñez', 'Jara', 'Vergara', 'Rivera', 'Figueroa',
          'Riquelme', 'García', 'Miranda', 'Bravo', 'Vera', 'Molina', 'Vega', 'Campos', 'Sandoval', 'Orellana'
        ]
      },
      {
        // Sul: ~10% dos chilenos se declaram mapuche (Censo 2017); os sobrenomes em mapudungun convivem com os hispânicos.
        id: 'cl_sul',
        peso: 0.1,
        divisoes: ['AR', 'LL', 'BI'],
        sobrenome: 'dois',
        masc: { ...CL_NOMES.masc, nova: [...CL_NOMES.masc.nova, 'Caupolicán', 'Nahuel'] },
        fem: { ...CL_NOMES.fem, nova: [...CL_NOMES.fem.nova, 'Ayelén', 'Rayén', 'Millaray'] },
        sobrenomes: [
          'Millapán', 'Huenchumilla', 'Painemal', 'Quilapán', 'Nahuelpán', 'Catrileo', 'Lefián', 'Ancalao', 'Huaiquimilla', 'Marileo',
          'Cayupán', 'Llancaleo', 'Antilef', 'Curipán', 'Calfuqueo', 'Paillalef', 'Huircán', 'Collío', 'Quintriqueo', 'Lienlaf',
          'Muñoz', 'González', 'Soto', 'Sepúlveda', 'Fuentes', 'Contreras', 'Vásquez', 'Rojas', 'Díaz', 'Pérez',
          'Jara', 'Valenzuela', 'Riquelme', 'Sandoval', 'Torres', 'Navarro', 'Gallardo', 'Cárcamo', 'Barrientos', 'Oyarzún'
        ]
      }
    ]
  },
  fontes: [
    'Ministerio de Desarrollo Social y Familia — Encuesta CASEN 2024 (pobreza por renda 17,3%, nova metodologia)',
    'INE Chile — Boletín de informalidad laboral, out–dez 2025 (26,8%)',
    'Lei 21.751 e reajuste de maio/2026 (Diário Oficial): IMM CLP 553.553',
    'Superintendencia de Pensiones — tope imponible 90 UF (2026); SII — Impuesto Único de Segunda Categoría, tabela 2026 (isenção 13,5 UTM)',
    'Código del Trabajo, arts. 47–50 (gratificación) e 163 (indemnización por años de servicio); Lei 19.728 (Seguro de Cesantía)',
    'DL 3.500 (AFP); Lei 21.419 (PGU) e Lei 21.735 (reforma previsional 2025)',
    'Constitución Política de la República, arts. 48–51 (deputados e senadores); Lei 18.695 (municipalidades); Lei 19.175 e Lei 21.073 (governos regionais); Lei 21.524 (voto obrigatório)',
    'DL 2.306 (serviço militar); Lei 21.325 (Migración y Extranjería)',
    'Código Civil, arts. 135, 984, 988–990, 995, 1182, 1184, 1195; Lei 16.271 (impuesto a las herencias)',
    'Lei 21.091 (educação superior, Gratuidade e Sistema de Acceso); DEMRE — PAES; Mineduc — CAE e projeto FES (não aprovado até 2026)',
    'Registro Civil — nomes mais inscritos 2023–2025 (Mateo, Agustín; Emma, Emilia, Sofía); INE — Censo 2017 (povos originários)',
    'ANFP — Liga de Primera, Primera B; Segunda División Profesional; Tercera División A'
  ]
};

/* ================================================================== URUGUAI
 *
 * ECONOMIA: pobreza de 16,6% das pessoas (INE, 2025, nova metodologia);
 * Gini ~0,40, o mais baixo da América do Sul. Informalidade 22,8% (INE, 2025),
 * a menor da região. Inflação de 2025 a mais baixa em décadas (~4–5%).
 * Preços: o nível de preços mais alto da região (catálogo: 1,44 × Brasil);
 * moradia cara em Montevidéu e Maldonado — 1,2. Salário mínimo nacional:
 * UYU 25.383 desde 1/7/2026 (Decreto 319/025).
 * Regional: Montevidéu paga mais; o norte (Rivera, Artigas, Tacuarembó) tem as
 * rendas mais baixas (INE, ECH); Maldonado (Punta del Este) tem custo alto.
 *
 * TRABALHO: aguinaldo (Lei 12.840) + "salário vacacional" (Lei 16.101, o
 * líquido dos dias de férias) ≈ 13,5 salários. Descontos: 15% aposentadoria
 * (BPS/AFAP), 3% a 8% FONASA (conforme renda, filhos e cônjuge), 0,1% FRL
 * → [0,181; 0,231]; teto aproximado de UYU 260 mil para a parte
 * previdenciária. IRPF: mínimo não imponível de 7 BPC (UYU 48.048 em 2026);
 * 10% até 10 BPC, 15% até 15 BPC — 12% sobre o excedente é a média de quem
 * passa do piso. Despedida comum: 1 salário por ano, até 6 (Lei 10.489).
 * Seguro de desemprego (BPS, DL 15.180): 6 meses, de 66% a 40% (~50%).
 * Aposentadoria: Lei 20.130 (2023) leva a idade a 65 para os nascidos a
 * partir de 1973; 30 anos de serviço. Concurso: regra de ingresso na função
 * pública (Lei 19.121 e Estatuto do Funcionário) — true.
 *
 * POLÍTICA: república presidencialista unitária com 19 departamentos. O
 * departamento é o 1º nível: intendente (governador, 5 anos, 30 anos de idade,
 * art. 266–267 da Constituição) e edil da Junta Departamental (5 anos, 23 de
 * idade, art. 264). Abaixo, os municípios (Lei 19.272): alcalde e concejales
 * (5 anos; mesmos requisitos dos ediles, segundo a lei). Representante
 * (5 anos, 25 de idade, art. 90) e senador (5 anos, 30, art. 98; eleição em
 * circunscrição nacional, direta). Nacionais em outubro de 2029;
 * departamentais e municipais em maio de 2030. Voto obrigatório (art. 77).
 *
 * SUCESSÃO — Código Civil:
 *  - herdeiros forçosos: filhos (e netos por representação) e, na falta deles,
 *    os pais (art. 884–885); a legítima dos filhos é 1/2 com um filho, 2/3 com
 *    dois e 3/4 com três ou mais (art. 888) — o jogo usa 2/3;
 *  - havendo descendentes, eles excluem os demais; o cônjuge não concorre — só
 *    tem a "porção conjugal" se não tiver meios (art. 874) e o direito real de
 *    habitação da casa (Lei 16.081);
 *  - sem descendentes: metade para os ascendentes, metade para o cônjuge
 *    (art. 1026); depois cônjuge e irmãos; representação (art. 1015);
 *  - regime supletivo: sociedade conjugal — meação;
 *  - sem herdeiros, o Estado.
 *  Não há imposto sobre herança; o Imposto às Transmissões Patrimoniais (ITP)
 *  incide sobre imóveis herdados — com as custas, ~3%.
 */
const UY_NOMES = {
  masc: {
    antiga: ['Juan', 'José', 'Carlos', 'Jorge', 'Luis', 'Héctor', 'Walter', 'Julio', 'Raúl', 'Daniel', 'Washington', 'Nelson', 'Hugo', 'Rubén',
      'Óscar', 'Alberto', 'Ricardo', 'Roberto', 'Eduardo', 'Mario', 'Juan Carlos', 'Ramón', 'Pedro', 'Miguel', 'Alfredo', 'Omar', 'Wilson', 'Juan José'],
    meio: ['Martín', 'Diego', 'Gonzalo', 'Pablo', 'Federico', 'Marcelo', 'Andrés', 'Sebastián', 'Leonardo', 'Fernando', 'Gustavo', 'Rodrigo', 'Nicolás',
      'Juan Pablo', 'Matías', 'Alejandro', 'Santiago', 'Gastón', 'Maximiliano', 'Ignacio', 'Agustín', 'Germán', 'Mauricio', 'Fabián', 'Álvaro', 'Bruno', 'Emiliano', 'Facundo'],
    nova: ['Benjamín', 'Mateo', 'Bautista', 'Joaquín', 'Lorenzo', 'Felipe', 'Santino', 'Valentino', 'Thiago', 'Gael', 'Liam', 'Juan', 'Benicio',
      'Francisco', 'Lucas', 'Facundo', 'Martín', 'Tomás', 'Santiago', 'Emiliano', 'Bruno', 'Simón', 'Dante', 'León', 'Salvador', 'Máximo', 'Pedro', 'Ignacio']
  },
  fem: {
    antiga: ['María', 'Ana', 'Mirta', 'Graciela', 'Gladys', 'Elena', 'Teresa', 'Beatriz', 'Susana', 'Mary', 'Nelly', 'Rosa', 'Marta', 'Olga',
      'Silvia', 'Norma', 'Margarita', 'Blanca', 'Gloria', 'Ana María', 'Elsa', 'Isabel', 'Carmen', 'Alicia', 'Raquel', 'Nilda', 'Sonia', 'Mabel'],
    meio: ['Carolina', 'Natalia', 'Lucía', 'Valeria', 'Andrea', 'Paula', 'Florencia', 'Mariana', 'Verónica', 'Gabriela', 'Lorena', 'Soledad', 'Fernanda',
      'Victoria', 'Cecilia', 'Silvana', 'Analía', 'Daniela', 'Leticia', 'Jimena', 'Sabrina', 'Romina', 'Paola', 'Virginia', 'Camila', 'Agustina', 'Lucía Belén', 'Noelia'],
    nova: ['Isabella', 'Emma', 'Martina', 'Catalina', 'Sofía', 'Olivia', 'Emilia', 'Julieta', 'Valentina', 'Mía', 'Victoria', 'Josefina', 'Delfina',
      'Alfonsina', 'Alma', 'Pilar', 'Renata', 'Zoe', 'Agustina', 'Lucía', 'Amanda', 'Malena', 'Juana', 'Clara', 'Paulina', 'Guadalupe', 'Francesca', 'Aurora']
  }
};

const URUGUAI: PerfilDePais = {
  id: 'UY',
  gentilico: ['uruguaio', 'uruguaia'],
  idiomas: ['espanhol'],
  divisao: {
    tipo: ['departamento', 'departamentos'],
    lista: [
      { codigo: 'MO', nome: 'Montevidéu', custo: 1.1, salario: 1.15 },
      { codigo: 'CA', nome: 'Canelones' },
      { codigo: 'MA', nome: 'Maldonado', custo: 1.15, salario: 1.05 },
      { codigo: 'SA', nome: 'Salto', custo: 0.92, salario: 0.88 },
      { codigo: 'PA', nome: 'Paysandú', custo: 0.92, salario: 0.9 },
      { codigo: 'RV', nome: 'Rivera', custo: 0.88, salario: 0.82 },
      { codigo: 'TA', nome: 'Tacuarembó', custo: 0.9, salario: 0.85 },
      { codigo: 'CL', nome: 'Cerro Largo', custo: 0.9, salario: 0.85 },
      { codigo: 'AR', nome: 'Artigas', custo: 0.88, salario: 0.8 },
      { codigo: 'CO', nome: 'Colonia' },
      { codigo: 'RO', nome: 'Rocha', custo: 0.95, salario: 0.9 }
    ]
  },
  cidades: [
    ['Montevidéu', 'MO', 'metropole', 'capital|sede|litoral'],
    ['Ciudad de la Costa', 'CA', 'metropolitana', 'metro:Montevidéu|litoral'],
    ['Las Piedras', 'CA', 'metropolitana', 'metro:Montevidéu'],
    ['Maldonado', 'MA', 'capital', 'sede|litoral'],
    ['Salto', 'SA', 'polo', 'sede|litoral'],
    ['Paysandú', 'PA', 'polo', 'sede|litoral'],
    ['Rivera', 'RV', 'capital', 'sede'],
    ['Tacuarembó', 'TA', 'capital', 'sede'],
    ['Melo', 'CL', 'capital', 'sede'],
    ['Artigas', 'AR', 'capital', 'sede'],
    ['Colonia del Sacramento', 'CO', 'capital', 'sede|litoral'],
    ['Rocha', 'RO', 'capital', 'sede'],
    ['Chuy', 'RO', 'pequena']
  ],
  economia: {
    classes: { vulneravel: 11, trabalhadora: 28, media_baixa: 27, media: 25, alta: 9 },
    moradia: 1.2,
    salarioMinimo: 25383,
    informalidade: 0.23,
    inflacao: 0.05,
    volatilidade: 0.8
  },
  trabalho: {
    mesesPagos: 13.5,
    contribuicao: { aliquota: [0.181, 0.231], teto: 260000 },
    impostoRenda: { isencao: 48048, aliquota: 0.12 },
    rescisao: { nome: 'indenização por despedida (até 6 salários)', mesesPorAno: 1 },
    seguroDesemprego: { meses: 6, reposicao: 0.5 },
    previdencia: { idade: [65, 65], anos: [30, 30], reposicao: 0.5, nome: 'BPS e AFAP' },
    concurso: true,
    contratoFormal: 'trabalho registrado no BPS'
  },
  educacao: {
    etapas: {
      fundamental: 'primário', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o centro CAIF do bairro', fundamental: 'a escola pública do bairro', medio: 'o liceu público' }
    },
    ingresso: 'acesso_aberto', // a Udelar não tem exame de ingresso: basta o bacharelado completo
    exame: { nome: 'inscrição na Udelar', artigo: 'a' },
    publicaCobra: 0, // gratuita; quem se forma contribui depois ao Fundo de Solidariedade (Lei 16.524)
    bolsa: { nome: 'bolsa do Fundo de Solidariedade', teto: 0.9 }, // renda de até 4 BPC por pessoa (≈ 0,9 SMN), 2026
    cotas: false,
    privadaComum: false // a Udelar concentra a grande maioria das matrículas universitárias
  },
  politica: {
    sistema: 'república presidencialista unitária',
    cargos: {
      vereador: { titulo: ['concejal municipal', 'concejala municipal'], anos: 5, idade: 23, casa: 'o Concejo Municipal' },
      prefeito: { titulo: ['alcalde', 'alcaldesa'], anos: 5, idade: 23, casa: 'o Município' },
      deputado_estadual: { titulo: ['edil', 'edil'], anos: 5, idade: 23, casa: 'a Junta Departamental' },
      deputado_federal: { titulo: ['representante nacional', 'representante nacional'], anos: 5, idade: 25, casa: 'a Câmara de Representantes' },
      senador: { titulo: ['senador', 'senadora'], anos: 5, idade: 30, casa: 'a Câmara de Senadores' },
      governador: { titulo: ['intendente', 'intendenta'], anos: 5, idade: 30, casa: 'a Intendência' }
    },
    eleicoes: { local: [2030, 5], geral: [2029, 5] },
    mes: 9,
    obrigatorio: true,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario',
    idade: 18,
    forcas: { exercito: 'o Exército Nacional', marinha: 'a Armada Nacional', aeronautica: 'a Força Aérea Uruguaia' },
    policia: 'a Polícia Nacional'
  },
  esporte: {
    popularidade: { futebol: 1.6, basquete: 1.25, volei: 0.7, tenis: 0.7, natacao: 0.6, atletismo: 0.6, lutas: 0.6 },
    // A OFI (Organização do Futebol do Interior) é paralela à AUF; aqui ela é a base da pirâmide.
    divisoes: ['ligas do interior (OFI)', 'Primera División Amateur', 'Segunda División Profesional', 'Primera División'],
    clubes: [
      { nome: 'Peñarol', artigo: 'o', porte: 'grande', cidade: 'Montevidéu' },
      { nome: 'Nacional', artigo: 'o', porte: 'grande', cidade: 'Montevidéu' },
      { nome: 'Defensor Sporting', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'Danubio', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'Liverpool', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'Montevideo Wanderers', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'River Plate', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'Cerro', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'Racing', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'Fénix', artigo: 'o', porte: 'tradicional', cidade: 'Montevidéu' },
      { nome: 'Boston River', artigo: 'o', porte: 'regional', cidade: 'Montevidéu' },
      { nome: 'Progreso', artigo: 'o', porte: 'regional', cidade: 'Montevidéu' },
      { nome: 'Juventud', artigo: 'o', porte: 'regional', cidade: 'Las Piedras' },
      { nome: 'Plaza Colonia', artigo: 'o', porte: 'regional', cidade: 'Colonia del Sacramento' },
      { nome: 'Deportivo Maldonado', artigo: 'o', porte: 'regional', cidade: 'Maldonado' },
      { nome: 'Cerro Largo', artigo: 'o', porte: 'regional', cidade: 'Melo' }
    ]
  },
  // SNIS (Lei 18.211, 2007): o FONASA financia a cobertura de todos, na ASSE (pública) ou numa mutualista.
  saude: { sistema: 'universal', redePublica: 'a ASSE', custoPlano: 1.3 },
  // Lei 19.254 (residência facilitada a nacionais do MERCOSUL); de fora, residência pela Lei 18.250.
  migracao: { blocos: ['mercosul'], abertura: 'seletiva' },
  sucessao: {
    pais: 'UY',
    nome: 'Uruguai',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes'],
    conjugeComDescendentes: false,
    conjugeComAscendentes: [1 / 2, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.03,
    rotuloCusto: 'imposto às transmissões patrimoniais (ITP) e custas da sucessão',
    vacancia: 'o Estado'
  },
  nomes: {
    cortes: [1975, 2005],
    grupos: [
      {
        id: 'uy',
        peso: 0.93,
        sobrenome: 'dois',
        ...UY_NOMES,
        sobrenomes: [
          'González', 'Rodríguez', 'Martínez', 'Fernández', 'García', 'Pérez', 'López', 'Silva', 'Sosa', 'Díaz',
          'Pereira', 'Hernández', 'Gómez', 'Suárez', 'Álvarez', 'Ramírez', 'Acosta', 'Cabrera', 'Núñez', 'Méndez',
          'Ferreira', 'Castro', 'Olivera', 'Romero', 'Correa', 'Techera', 'Benítez', 'Cardozo', 'Machado', 'Viera',
          'De León', 'Morales', 'Bentancor', 'Vázquez', 'Delgado', 'Rivero', 'Medina', 'Torres', 'Píriz', 'Muniz',
          'Clavijo', 'Larrosa', 'Barreto', 'Cabral', 'Rossi', 'Ferrari'
        ]
      },
      {
        // Fronteira com o Brasil: sobrenomes de origem portuguesa e o "portunhol" do dia a dia.
        id: 'uy_fronteira',
        peso: 0.07,
        divisoes: ['RV', 'AR', 'CL'],
        sobrenome: 'dois',
        ...UY_NOMES,
        sobrenomes: [
          'Da Silva', 'Dos Santos', 'Pereira', 'Rodrigues', 'Ferreira', 'Da Rosa', 'De Souza', 'Gonçalves', 'Machado', 'Nunes',
          'Lima', 'Oliveira', 'Correa', 'Moraes', 'Batista', 'Fagúndez', 'Pintos', 'Silveira', 'Lemos', 'Teixeira',
          'Rodríguez', 'González', 'Sosa', 'Fernández', 'Martínez', 'Olivera', 'Suárez', 'Acosta', 'Cardozo', 'Píriz',
          'Rocha', 'Fontoura', 'Brum', 'Carvalho', 'Medeiros', 'Dutra', 'Alves', 'Viera', 'Muniz', 'Bitencourt'
        ]
      }
    ]
  },
  fontes: [
    'INE Uruguay — Estimación de la pobreza por el método del ingreso 2025 (16,6% das pessoas; nova metodologia)',
    'INE Uruguay — informalidade 2025 (22,8% dos ocupados)',
    'Decreto 319/025 (IMPO): SMN UYU 24.572 (jan–jun 2026) e 25.383 (jul–dez 2026)',
    'DGI — IRPF 2026 (BPC UYU 6.864; mínimo não imponível 7 BPC); BPS — aportes pessoais e FONASA',
    'Lei 10.489 (indenização por despedida); DL 15.180 (subsídio por desemprego); Lei 12.840 (aguinaldo); Lei 16.101 (salário vacacional)',
    'Lei 20.130 (2023, reforma da seguridade social); Lei 19.121 (estatuto do funcionário público)',
    'Constitución de la República, arts. 77, 90, 98, 264, 266–267; Lei 19.272 (descentralização e municípios)',
    'Código Civil, arts. 874, 884–888, 1015, 1025–1026; Lei 16.081 (direitos do cônjuge sobrevivente)',
    'Lei 18.211 (Sistema Nacional Integrado de Salud); Lei 18.250 e Lei 19.254 (migração)',
    'Fondo de Solidaridad — bolsas 2026 (teto de 4 BPC por pessoa); Lei 16.524',
    'INE Uruguay — nomes mais registrados (estatísticas vitais)',
    'AUF — Primera División, Segunda División Profesional, Primera División Amateur; OFI'
  ]
};

/* ================================================================= COLÔMBIA
 *
 * ECONOMIA: pobreza monetária de 28% e extrema de 9,6% (DANE, 2025); Gini
 * ~0,54, um dos mais altos do mundo — por isso a classe alta é pequena e a
 * base é larga. Informalidade 55% (DANE, GEIH, 2025). Inflação ~5% (2025),
 * acima da meta de 3%. Salário mínimo: COP 1.750.905 em 2026 (Decreto 1469 de
 * 2025, +23%), mais o auxílio-transporte. Moradia relativamente barata fora de
 * Bogotá (0,9). Regional: Bogotá paga e custa mais; Chocó e Nariño são os
 * departamentos mais pobres (DANE, pobreza departamental).
 *
 * TRABALHO: "prima de servicios" de 1 salário/ano (CST art. 306) = 13
 * salários. Descontos: 4% saúde + 4% pensão, +1% ao Fundo de Solidariedade
 * Pensional acima de 4 SMMLV; base máxima de 25 SMMLV. Imposto de renda
 * (retención en la fuente): a base depurada (bruto − aportes − 25% de renda
 * isenta) começa a ser tributada acima de 95 UVT (COP 4.976.000 em 2026),
 * o que corresponde a ~COP 7,2 milhões brutos; 19% sobre a base ≈ 15% sobre o
 * bruto excedente. Demissão sem justa causa: indenização de 30 dias no 1º ano
 * e 20 por ano seguinte (CST art. 64), mais as "cesantías" (1 salário por ano
 * depositado num fundo, Lei 50/1990) — ~1,67 salário por ano no total.
 * Seguro-desemprego: não há um com reposição de renda — o Mecanismo de
 * Proteção ao Cesante (Lei 1636/2013) paga saúde e pensão por alguns meses;
 * o colchão real são as cesantías — omitido. Aposentadoria: 62/57 anos e
 * 1.300 semanas (≈ 25 anos); a reforma da Lei 2381/2024, validada pela Corte
 * Constitucional (C-264/2026), entra em vigor em 1/4/2027 e reduz
 * gradualmente as semanas das mulheres. Concurso: carreira administrativa por
 * mérito (Constituição, art. 125; CNSC) — true.
 *
 * POLÍTICA: república presidencialista unitária com departamentos. Concejal e
 * alcalde (4 anos, cidadão em exercício: 18), deputado da Assembleia
 * Departamental (4 anos, 21 de idade, art. 299), representante à Câmara
 * (4 anos, 25, art. 177), senador (4 anos, 30, art. 172; circunscrição
 * nacional), governador (4 anos, 30 de idade). Locais: outubro de 2027;
 * Congresso: março de 2026 (presidencial em maio). Voto facultativo.
 * Serviço militar obrigatório para homens (Lei 1861/2017).
 *
 * SUCESSÃO — Código Civil, com a Lei 1934/2018:
 *  - legitimários: descendentes e ascendentes (art. 1240) — o cônjuge NÃO;
 *  - metade é a "legítima rigorosa"; a outra metade, desde 2018, é de livre
 *    disposição (a antiga "quarta de mejoras" ficou livre, art. 1242);
 *  - com descendentes, o cônjuge só recebe a "porção conjugal" se não tiver
 *    meios (art. 1230 e 1236) — no jogo, não concorre;
 *  - sem descendentes: metade para os ascendentes, metade para o cônjuge
 *    (art. 1046); depois irmãos e cônjuge; representação (art. 1041);
 *  - regime supletivo: sociedade conjugal (art. 180) — meação;
 *  - sem herdeiros, o Instituto Colombiano de Bem-Estar Familiar (art. 1051,
 *    mod. Lei 75/1968).
 *  Custo: herança paga imposto de "ganancia ocasional" (15% desde a Lei
 *  2277/2022) sobre o que passa das isenções (casa até 13.000 UVT etc.), mais
 *  a sucessão em cartório — média de 6%.
 */
const CO_NOMES = {
  masc: {
    antiga: ['José', 'Luis', 'Carlos', 'Jorge', 'Jesús', 'Pedro', 'Manuel', 'Antonio', 'Rafael', 'Alfonso', 'Gustavo', 'Álvaro', 'Hernando',
      'Hernán', 'Gilberto', 'Fabio', 'Orlando', 'Jaime', 'Guillermo', 'Ramiro', 'Libardo', 'Alberto', 'Rubén', 'Fernando', 'Héctor', 'Arturo', 'Luis Eduardo', 'Efraín'],
    meio: ['Juan Carlos', 'Andrés', 'Diego', 'Jhon', 'Carlos Andrés', 'Juan David', 'Juan Pablo', 'Cristian', 'Jorge Luis', 'Óscar', 'Fabián',
      'Wilson', 'Édgar', 'Mauricio', 'Julián', 'Felipe', 'Sebastián', 'Camilo', 'Alejandro', 'Jairo', 'Javier', 'Daniel', 'Miguel Ángel', 'Luis Fernando', 'Jhonatan', 'Edwin', 'Juan Sebastián', 'Santiago'],
    nova: ['David', 'José', 'Andrés', 'Liam', 'Santiago', 'Matías', 'Samuel', 'Thiago', 'Emiliano', 'Jerónimo', 'Juan José', 'Maximiliano',
      'Martín', 'Sebastián', 'Gabriel', 'Emmanuel', 'Dylan', 'Mateo', 'Jacobo', 'Tomás', 'Benjamín', 'Joaquín', 'Lucas', 'Isaac', 'Alejandro', 'Ian', 'Juan Martín', 'Salvador']
  },
  fem: {
    antiga: ['María', 'Ana', 'Luz Marina', 'Blanca', 'Rosa', 'Gloria', 'Martha', 'Carmen', 'Luz Mery', 'Myriam', 'Cecilia', 'Esperanza', 'Amparo',
      'Fanny', 'Teresa', 'Graciela', 'Stella', 'Nubia', 'Aura', 'Marleny', 'Inés', 'Beatriz', 'Lucía', 'Rocío', 'Olga', 'Elvia', 'Luz Dary', 'Mercedes'],
    meio: ['Diana', 'Paola', 'Sandra', 'Claudia', 'Paula Andrea', 'Natalia', 'Ángela', 'Carolina', 'Lina', 'Adriana', 'Liliana', 'Johana', 'Yuli',
      'Viviana', 'Marcela', 'Lorena', 'Catalina', 'Leidy', 'Jennifer', 'Andrea', 'Mónica', 'Alejandra', 'Daniela', 'Laura', 'Tatiana', 'Yenny', 'Juliana', 'Valentina'],
    nova: ['Sofía', 'María', 'Valentina', 'Isabella', 'Salomé', 'Mariana', 'Antonella', 'Luciana', 'Emily', 'Celeste', 'Violeta', 'Gabriela', 'Sara',
      'Manuela', 'Victoria', 'Emma', 'Mía', 'Ana Sofía', 'María José', 'Juanita', 'Martina', 'Abigail', 'Amelia', 'Allison', 'Samantha', 'Luna', 'Susana', 'Guadalupe']
  }
};

const COLOMBIA: PerfilDePais = {
  id: 'CO',
  gentilico: ['colombiano', 'colombiana'],
  idiomas: ['espanhol'],
  divisao: {
    tipo: ['departamento', 'departamentos'],
    lista: [
      { codigo: 'DC', nome: 'Bogotá, Distrito Capital', custo: 1.15, salario: 1.2 },
      { codigo: 'ANT', nome: 'Antioquia', salario: 1.05 },
      { codigo: 'VAC', nome: 'Valle del Cauca' },
      { codigo: 'ATL', nome: 'Atlántico' },
      { codigo: 'BOL', nome: 'Bolívar', salario: 0.92 },
      { codigo: 'SAN', nome: 'Santander', salario: 1.02 },
      { codigo: 'RIS', nome: 'Risaralda' },
      { codigo: 'CAL', nome: 'Caldas' },
      { codigo: 'TOL', nome: 'Tolima', salario: 0.92 },
      { codigo: 'NAR', nome: 'Nariño', custo: 0.9, salario: 0.82 },
      { codigo: 'CHO', nome: 'Chocó', custo: 0.88, salario: 0.75 }
    ]
  },
  cidades: [
    ['Bogotá', 'DC', 'metropole', 'capital|sede'],
    ['Medellín', 'ANT', 'metropole', 'sede'],
    ['Cali', 'VAC', 'metropole', 'sede'],
    ['Barranquilla', 'ATL', 'metropole', 'sede|litoral'],
    ['Cartagena', 'BOL', 'capital', 'sede|litoral'],
    ['Bucaramanga', 'SAN', 'capital', 'sede'],
    ['Pereira', 'RIS', 'capital', 'sede'],
    ['Manizales', 'CAL', 'capital', 'sede'],
    ['Ibagué', 'TOL', 'capital', 'sede'],
    ['Pasto', 'NAR', 'capital', 'sede'],
    ['Quibdó', 'CHO', 'capital', 'sede'],
    ['Buenaventura', 'VAC', 'polo', 'litoral'],
    ['Tuluá', 'VAC', 'polo'],
    ['Mompox', 'BOL', 'pequena', 'litoral'] // às margens do rio Magdalena
  ],
  economia: {
    classes: { vulneravel: 26, trabalhadora: 32, media_baixa: 21, media: 15, alta: 6 },
    moradia: 0.9,
    salarioMinimo: 1750905,
    informalidade: 0.55,
    inflacao: 0.055,
    volatilidade: 1
  },
  trabalho: {
    mesesPagos: 13,
    contribuicao: { aliquota: [0.08, 0.09], teto: 43772625 },
    impostoRenda: { isencao: 7200000, aliquota: 0.15 },
    rescisao: { nome: 'cesantías e indenização por demissão sem justa causa', mesesPorAno: 1.67 },
    previdencia: { idade: [62, 57], anos: [25, 25], reposicao: 0.65, nome: 'Colpensiones ou fundo privado' },
    concurso: true,
    contratoFormal: 'contrato com prestações sociais'
  },
  educacao: {
    etapas: {
      fundamental: 'primária', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o lar comunitário do ICBF', fundamental: 'o colégio público do bairro', medio: 'o colégio público' }
    },
    // Cada universidade pública define sua admissão: muitas pelo resultado do Saber 11 (ICFES),
    // outras (a Universidad Nacional, a de Antioquia) com exame próprio.
    ingresso: 'candidatura',
    exame: { nome: 'Saber 11', artigo: 'o' },
    publicaCobra: 0.05, // Política de Gratuidade (Lei 2307/2023): matrícula zero nos estratos 1 a 3
    bolsa: { nome: 'Política de Gratuidade', teto: 1.5 }, // definida por estrato/SISBÉN, não por renda — aproximação
    credito: { nome: 'ICETEX' },
    cotas: false,
    privadaComum: true // cerca de metade das matrículas de ensino superior é privada (SNIES)
  },
  politica: {
    sistema: 'república presidencialista unitária, com departamentos descentralizados',
    cargos: {
      vereador: { titulo: ['concejal', 'concejala'], anos: 4, idade: 18, casa: 'o Concejo Municipal' },
      prefeito: { titulo: ['alcalde', 'alcaldesa'], anos: 4, idade: 18, casa: 'a Alcaldía' },
      deputado_estadual: { titulo: ['deputado departamental', 'deputada departamental'], anos: 4, idade: 21, casa: 'a Assembleia Departamental' },
      deputado_federal: { titulo: ['representante à Câmara', 'representante à Câmara'], anos: 4, idade: 25, casa: 'a Câmara de Representantes' },
      senador: { titulo: ['senador', 'senadora'], anos: 4, idade: 30, casa: 'o Senado da República' },
      governador: { titulo: ['governador', 'governadora'], anos: 4, idade: 30, casa: 'a Governação' }
    },
    eleicoes: { local: [2027, 4], geral: [2030, 4] },
    mes: 2, // Congresso em março; locais em outubro
    obrigatorio: false,
    partidosReais: false
  },
  militar: {
    servico: 'obrigatorio',
    idade: 18,
    forcas: { exercito: 'o Exército Nacional', marinha: 'a Armada da Colômbia', aeronautica: 'a Força Aeroespacial Colombiana' },
    policia: 'a Polícia Nacional'
  },
  esporte: {
    popularidade: { futebol: 1.4, lutas: 1.1, atletismo: 1, volei: 0.8, natacao: 0.8, basquete: 0.7, tenis: 0.7 },
    // Só as duas primeiras são profissionais (DIMAYOR); abaixo, o futebol amador organizado pela DIFÚTBOL.
    divisoes: ['ligas municipais amadoras', 'ligas departamentais (DIFÚTBOL)', 'Primera B', 'Primera A'],
    clubes: [
      { nome: 'Atlético Nacional', artigo: 'o', porte: 'grande', cidade: 'Medellín' },
      { nome: 'Millonarios', artigo: 'o', porte: 'grande', cidade: 'Bogotá' },
      { nome: 'América de Cali', artigo: 'o', porte: 'grande', cidade: 'Cali' },
      { nome: 'Deportivo Cali', artigo: 'o', porte: 'grande', cidade: 'Cali' },
      { nome: 'Junior', artigo: 'o', porte: 'grande', cidade: 'Barranquilla' },
      { nome: 'Independiente Santa Fe', artigo: 'o', porte: 'grande', cidade: 'Bogotá' },
      { nome: 'Independiente Medellín', artigo: 'o', porte: 'tradicional', cidade: 'Medellín' },
      { nome: 'Once Caldas', artigo: 'o', porte: 'tradicional', cidade: 'Manizales' },
      { nome: 'Deportes Tolima', artigo: 'o', porte: 'tradicional', cidade: 'Ibagué' },
      { nome: 'Atlético Bucaramanga', artigo: 'o', porte: 'tradicional', cidade: 'Bucaramanga' },
      { nome: 'Deportivo Pereira', artigo: 'o', porte: 'tradicional', cidade: 'Pereira' },
      { nome: 'Deportivo Pasto', artigo: 'o', porte: 'tradicional', cidade: 'Pasto' },
      { nome: 'Real Cartagena', artigo: 'o', porte: 'regional', cidade: 'Cartagena' },
      { nome: 'Cortuluá', artigo: 'o', porte: 'regional', cidade: 'Tuluá' }
    ]
  },
  // SGSSS (Lei 100/1993): seguro obrigatório quase universal via EPS (regime contributivo ou subsidiado); medicina pré-paga para quem pode.
  saude: { sistema: 'misto', redePublica: 'a EPS', custoPlano: 0.7 },
  // Colômbia, Estado associado, aplica o Acordo de Residência do MERCOSUL; de fora, vistos por categoria (Resolução 5477/2022).
  migracao: { blocos: ['mercosul'], abertura: 'seletiva' },
  sucessao: {
    pais: 'CO',
    nome: 'Colômbia',
    legitima: 1 / 2,
    necessarios: ['descendentes', 'ascendentes'],
    conjugeComDescendentes: false,
    conjugeComAscendentes: [1 / 2, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.06,
    rotuloCusto: 'imposto de ganho ocasional e custas da sucessão em cartório',
    vacancia: 'o ICBF'
  },
  nomes: {
    cortes: [1975, 2005],
    grupos: [
      {
        id: 'co',
        peso: 0.9,
        sobrenome: 'dois',
        ...CO_NOMES,
        sobrenomes: [
          'Rodríguez', 'Gómez', 'González', 'Martínez', 'García', 'López', 'Hernández', 'Sánchez', 'Ramírez', 'Pérez',
          'Díaz', 'Muñoz', 'Rojas', 'Moreno', 'Jiménez', 'Vargas', 'Torres', 'Castro', 'Gutiérrez', 'Ruiz',
          'Ortiz', 'Suárez', 'Álvarez', 'Romero', 'Herrera', 'Valencia', 'Quintero', 'Restrepo', 'Giraldo', 'Ospina',
          'Cardona', 'Arias', 'Castaño', 'Rincón', 'Salazar', 'Montoya', 'Mejía', 'Zapata', 'Osorio', 'Cárdenas',
          'Ríos', 'Mendoza', 'Guerrero', 'Ramos', 'Medina', 'Rivera', 'Patiño', 'Agudelo', 'Londoño', 'Acosta'
        ]
      },
      {
        // Pacífico: a maior concentração afro-colombiana do país (DANE, Censo 2018). Os nomes próprios são os do país.
        id: 'co_pacifico',
        peso: 0.1,
        divisoes: ['CHO', 'VAC', 'NAR'],
        sobrenome: 'dois',
        ...CO_NOMES,
        sobrenomes: [
          'Mosquera', 'Palacios', 'Rentería', 'Córdoba', 'Murillo', 'Valencia', 'Asprilla', 'Perea', 'Hinestroza', 'Cuesta',
          'Moreno', 'Lozano', 'Caicedo', 'Angulo', 'Cortés', 'Riascos', 'Ibargüen', 'Banguera', 'Obregón', 'Mena',
          'Sinisterra', 'Quiñones', 'Hurtado', 'Arboleda', 'Micolta', 'Castillo', 'Rivas', 'Salas', 'Copete', 'Lemus',
          'Rodríguez', 'García', 'González', 'Martínez', 'Sánchez', 'Torres', 'Díaz', 'Ramírez', 'Gómez', 'Cuero'
        ]
      }
    ]
  },
  fontes: [
    'DANE — Pobreza monetaria 2025 (28,0%; extrema 9,6%); GEIH — informalidade 2025 (~55%)',
    'Decreto 1469 de 2025 e Decreto 0159 de 2026: SMMLV COP 1.750.905 (2026)',
    'DIAN, Resolución 000238 de 2025: UVT 2026 = COP 52.374; Estatuto Tributario art. 383 e 206 (retención e renda isenta de 25%)',
    'Código Sustantivo del Trabajo, arts. 64 (indenização) e 306 (prima de servicios); Lei 50/1990 (cesantías); Lei 1636/2013 (Mecanismo de Protección al Cesante)',
    'Lei 100/1993 (seguridade social); Lei 2381/2024 e Sentencia C-264/2026 da Corte Constitucional (vigência a partir de 1/4/2027)',
    'Constitución Política, arts. 125, 172, 177, 299, 303; Lei 136/1994 (municípios); Lei 1861/2017 (serviço militar)',
    'Código Civil, arts. 180, 1041, 1046, 1051, 1230, 1236, 1240, 1242 (mod. Lei 1934/2018); Lei 2277/2022 (ganancia ocasional)',
    'Lei 2307/2023 (Política de Gratuidad); ICFES — Saber 11; ICETEX; SNIES (matrícula por setor)',
    'Registraduría Nacional — nomes mais registrados em 2025 (David, Sofía, María, José, Andrés, Liam); DANE — Censo 2018 (autorreconhecimento étnico)',
    'DIMAYOR — Liga (Primera A) e Torneo (Primera B); DIFÚTBOL'
  ]
};

/* ===================================================================== PERU
 *
 * ECONOMIA: pobreza monetária de 25,7% (INEI, ENAHO 2025), 35,5% na zona
 * rural; Gini ~0,40. Informalidade 70,7% (INEI, 2025) — a mais alta dos
 * países deste arquivo: um emprego formal é exceção. Inflação na meta do BCRP
 * (1–3%), estável. Remuneração Mínima Vital: PEN 1.230 desde 1/10/2026
 * (DS 015-2026-TR), indo a 1.300 em 2027. Regional: Lima concentra renda e
 * custo; o sul andino (Puno, Apurímac) e Cajamarca têm as maiores taxas de
 * pobreza (INEI).
 *
 * TRABALHO: gratificações de julho e dezembro (Lei 27735) = 14 salários.
 * Descontos: ONP 13% ou AFP (~10% + seguro + comissão ≈ 11,4–13%); a saúde
 * (EsSalud, 9%) é paga pelo empregador. Imposto de 5ª categoria: dedução de
 * 7 UIT/ano (UIT 2026 = PEN 5.500 → PEN 38.500 ÷ 14 pagamentos ≈ 2.750 por
 * salário); 8% e depois 14% — 10% sobre o excedente é a média. Rescisão:
 * indenização por demissão arbitrária de 1,5 salário por ano, até 12
 * (DS 003-97-TR, art. 38), mais a CTS (~1 salário por ano depositado,
 * DS 001-97-TR) — ~2,5 por ano. Não há seguro-desemprego (a CTS faz esse
 * papel). Aposentadoria: 65 anos; na ONP, 20 anos de aporte; na AFP, o que se
 * acumulou — a pensão da ONP é baixa (reposição ~35%). Concurso: o Servir
 * (Lei 30057) e os contratos CAS exigem concurso público de méritos — true.
 *
 * POLÍTICA: república presidencialista unitária com governos regionais. O
 * Congresso voltou a ser bicameral nas eleições de abril de 2026 (Lei 31988):
 * 130 deputados (25 anos de idade) e 60 senadores (45 anos), mandatos de 5.
 * Regionais e municipais: 4 anos, sem reeleição imediata; regidor, alcalde e
 * conselheiro regional com 18 anos; governador regional com 25. Gerais:
 * abril (2031); regionais/municipais: outubro (2026, 2030). Voto obrigatório.
 *
 * SUCESSÃO — Código Civil de 1984:
 *  - herdeiros forçosos: filhos e descendentes, pais e ascendentes, e o
 *    cônjuge (art. 724); legítima de 2/3 com descendentes ou cônjuge
 *    (art. 725), 1/2 só com ascendentes (art. 726) — o jogo usa 2/3;
 *  - o cônjuge concorre com os filhos como mais um filho (art. 822) e com os
 *    pais recebendo o mesmo que um deles (art. 824) — com os dois pais vivos,
 *    1/3; com um, 1/2;
 *  - representação (art. 681); colaterais até o 4º grau (art. 828);
 *  - regime supletivo: sociedade de ganancias (art. 301) — meação;
 *  - sem herdeiros: a Sociedade de Beneficência do último domicílio
 *    (art. 830).
 *  Não há imposto sobre herança (a alcabala não incide sobre a transmissão
 *  por morte); notário e registro custam ~2%.
 */
const PE_NOMES = {
  masc: {
    antiga: ['Juan', 'José', 'Luis', 'Carlos', 'Jorge', 'Víctor', 'Manuel', 'César', 'Pedro', 'Julio', 'Alberto', 'Félix', 'Teodoro', 'Hilario',
      'Mario', 'Francisco', 'Segundo', 'Eduardo', 'Raúl', 'Óscar', 'Alejandro', 'Ricardo', 'Fernando', 'Augusto', 'Máximo', 'Valentín', 'Guillermo', 'Santos'],
    meio: ['Juan Carlos', 'José Luis', 'Luis Alberto', 'Christian', 'Jorge Luis', 'Miguel Ángel', 'Ricardo', 'Fernando', 'Óscar', 'Jhonny', 'Edwin',
      'Wilson', 'Richard', 'Giancarlo', 'Renzo', 'Diego', 'Gustavo', 'Alex', 'Raúl', 'Henry', 'Paolo', 'Rubén', 'Erick', 'Fredy', 'Hugo', 'Elvis', 'Wilmer', 'Kevin'],
    nova: ['Liam', 'Thiago', 'Mateo', 'Santiago', 'Gael', 'Dylan', 'Sebastián', 'Ian', 'Benjamín', 'Valentino', 'Matías', 'Adriano', 'Leonardo',
      'Ángel', 'Gabriel', 'Lucas', 'Fabricio', 'Alessandro', 'Joaquín', 'Samuel', 'Emiliano', 'Jhair', 'Aarón', 'Daniel', 'Isaac', 'Josué', 'Derek', 'Owen']
  },
  fem: {
    antiga: ['María', 'Rosa', 'Juana', 'Carmen', 'Julia', 'Elena', 'Victoria', 'Lucía', 'Teresa', 'Isabel', 'Gloria', 'Nelly', 'Martha', 'Gladys',
      'Haydée', 'Bertha', 'Norma', 'Hilda', 'Rosario', 'Flor', 'Celia', 'Beatriz', 'Delia', 'Esther', 'Felícita', 'Victoria Eugenia', 'Luzmila', 'Dora'],
    meio: ['Rosa María', 'Ana María', 'Milagros', 'Karina', 'Patricia', 'Carmen Rosa', 'Elizabeth', 'Jessica', 'Lizbeth', 'Yesenia', 'Maribel', 'Giovanna',
      'Katherine', 'Pamela', 'Lucía', 'Cinthia', 'Roxana', 'Mercedes', 'Diana', 'Erika', 'Vanessa', 'Fiorella', 'Melissa', 'Liliana', 'Sandra', 'Silvia', 'Mónica', 'Evelyn'],
    nova: ['Valentina', 'Camila', 'Luciana', 'Mía', 'Isabella', 'Alessia', 'Ariana', 'Antonella', 'Kiara', 'Danna', 'Zoe', 'Abigail', 'Fernanda',
      'Ximena', 'Sofía', 'Victoria', 'Valeria', 'Allison', 'Brianna', 'Mariana', 'Mayte', 'Nicole', 'Aitana', 'Briseida', 'Rafaela', 'Emma', 'Luana', 'Thaís']
  }
};

const PERU: PerfilDePais = {
  id: 'PE',
  gentilico: ['peruano', 'peruana'],
  idiomas: ['espanhol', 'quéchua', 'aimará'],
  divisao: {
    tipo: ['departamento', 'departamentos'],
    lista: [
      { codigo: 'LMA', nome: 'Lima Metropolitana', custo: 1.15, salario: 1.2 },
      { codigo: 'CAL', nome: 'Callao', custo: 1.1, salario: 1.1 },
      { codigo: 'ARE', nome: 'Arequipa', salario: 1.05 },
      { codigo: 'LAL', nome: 'La Libertad' },
      { codigo: 'LAM', nome: 'Lambayeque' },
      { codigo: 'PIU', nome: 'Piura', salario: 0.92 },
      { codigo: 'CUS', nome: 'Cusco', custo: 0.95, salario: 0.9 },
      { codigo: 'JUN', nome: 'Junín', salario: 0.92 },
      { codigo: 'LOR', nome: 'Loreto', salario: 0.9 },
      { codigo: 'PUN', nome: 'Puno', custo: 0.85, salario: 0.8 },
      { codigo: 'APU', nome: 'Apurímac', custo: 0.85, salario: 0.8 }
    ]
  },
  cidades: [
    ['Lima', 'LMA', 'metropole', 'capital|sede|litoral'],
    ['Callao', 'CAL', 'metropolitana', 'metro:Lima|sede|litoral'],
    ['Arequipa', 'ARE', 'metropole', 'sede'],
    ['Trujillo', 'LAL', 'capital', 'sede|litoral'],
    ['Chiclayo', 'LAM', 'capital', 'sede'],
    ['Piura', 'PIU', 'capital', 'sede'],
    ['Sullana', 'PIU', 'polo'],
    ['Cusco', 'CUS', 'capital', 'sede'],
    ['Huancayo', 'JUN', 'capital', 'sede'],
    ['Tarma', 'JUN', 'pequena'],
    ['Iquitos', 'LOR', 'capital', 'sede|litoral'],
    ['Puno', 'PUN', 'capital', 'sede|litoral'],
    ['Juliaca', 'PUN', 'polo'],
    ['Andahuaylas', 'APU', 'pequena']
  ],
  economia: {
    classes: { vulneravel: 24, trabalhadora: 35, media_baixa: 21, media: 15, alta: 5 },
    moradia: 0.9,
    salarioMinimo: 1230,
    informalidade: 0.7,
    inflacao: 0.025,
    volatilidade: 0.6
  },
  trabalho: {
    mesesPagos: 14,
    contribuicao: { aliquota: [0.114, 0.13] },
    impostoRenda: { isencao: 2750, aliquota: 0.1 },
    rescisao: { nome: 'CTS e indenização por demissão arbitrária', mesesPorAno: 2.5 },
    previdencia: { idade: [65, 65], anos: [20, 20], reposicao: 0.35, nome: 'ONP ou AFP' },
    concurso: true,
    contratoFormal: 'emprego em planilha'
  },
  educacao: {
    etapas: {
      fundamental: 'primária', medio: 'ensino médio', serieMedio: 'ano',
      publica: { creche: 'o centro Cuna Más do bairro', fundamental: 'a escola pública do bairro', medio: 'o colégio nacional do bairro' }
    },
    ingresso: 'candidatura', // cada universidade pública aplica o seu exame de admissão (Lei Universitária 30220)
    exame: { nome: 'exame de admissão', artigo: 'o' },
    publicaCobra: 0, // ensino gratuito nas universidades públicas (Constituição, art. 17; Lei 30220)
    bolsa: { nome: 'Beca 18', teto: 1 }, // PRONABEC: alunos em pobreza ou pobreza extrema (SISFOH) — aproximação
    cotas: false,
    privadaComum: true // a maioria dos universitários estuda em universidade privada (SUNEDU)
  },
  politica: {
    sistema: 'república presidencialista unitária, com governos regionais e Congresso bicameral desde 2026',
    cargos: {
      vereador: { titulo: ['regidor', 'regidora'], anos: 4, idade: 18, casa: 'o Concejo Municipal' },
      prefeito: { titulo: ['alcalde', 'alcaldesa'], anos: 4, idade: 18, casa: 'a Municipalidade' },
      deputado_estadual: { titulo: ['conselheiro regional', 'conselheira regional'], anos: 4, idade: 18, casa: 'o Conselho Regional' },
      deputado_federal: { titulo: ['deputado', 'deputada'], anos: 5, idade: 25, casa: 'a Câmara de Deputados' },
      senador: { titulo: ['senador', 'senadora'], anos: 5, idade: 45, casa: 'o Senado' },
      governador: { titulo: ['governador regional', 'governadora regional'], anos: 4, idade: 25, casa: 'o Governo Regional' }
    },
    eleicoes: { local: [2026, 4], geral: [2031, 5] },
    mes: 3,
    obrigatorio: true,
    partidosReais: false
  },
  militar: {
    servico: 'voluntario', // Lei 29248 (serviço militar voluntário; o obrigatório acabou em 1999)
    idade: 18,
    forcas: { exercito: 'o Exército do Peru', marinha: 'a Marinha de Guerra do Peru', aeronautica: 'a Força Aérea do Peru' },
    policia: 'a Polícia Nacional do Peru'
  },
  esporte: {
    popularidade: { futebol: 1.35, volei: 1.35, atletismo: 0.8, lutas: 0.8, natacao: 0.7, tenis: 0.7, basquete: 0.6 },
    divisoes: ['Copa Perú', 'Liga 3', 'Liga 2', 'Liga 1'],
    clubes: [
      { nome: 'Alianza Lima', artigo: 'o', porte: 'grande', cidade: 'Lima' },
      { nome: 'Universitario', artigo: 'o', porte: 'grande', cidade: 'Lima' },
      { nome: 'Sporting Cristal', artigo: 'o', porte: 'grande', cidade: 'Lima' },
      { nome: 'Melgar', artigo: 'o', porte: 'tradicional', cidade: 'Arequipa' },
      { nome: 'Cienciano', artigo: 'o', porte: 'tradicional', cidade: 'Cusco' },
      { nome: 'Cusco FC', artigo: 'o', porte: 'tradicional', cidade: 'Cusco' },
      { nome: 'Sport Huancayo', artigo: 'o', porte: 'tradicional', cidade: 'Huancayo' },
      { nome: 'Sport Boys', artigo: 'o', porte: 'tradicional', cidade: 'Callao' },
      { nome: 'Universidad César Vallejo', artigo: 'a', porte: 'tradicional', cidade: 'Trujillo' },
      { nome: 'Alianza Atlético', artigo: 'o', porte: 'tradicional', cidade: 'Sullana' },
      { nome: 'Atlético Grau', artigo: 'o', porte: 'tradicional', cidade: 'Piura' },
      { nome: 'Carlos A. Mannucci', artigo: 'o', porte: 'regional', cidade: 'Trujillo' },
      { nome: 'ADT', artigo: 'a', porte: 'regional', cidade: 'Tarma' },
      { nome: 'Los Chankas', artigo: 'o', porte: 'regional', cidade: 'Andahuaylas' },
      { nome: 'Binacional', artigo: 'o', porte: 'regional', cidade: 'Juliaca' },
      { nome: 'Juan Aurich', artigo: 'o', porte: 'regional', cidade: 'Chiclayo' }
    ]
  },
  // MINSA/SIS para quem não tem seguro, EsSalud para os assalariados formais, EPS e clínicas privadas para quem paga.
  saude: { sistema: 'misto', redePublica: 'o SIS', custoPlano: 0.7 },
  // Peru aplica o Acordo de Residência do MERCOSUL como associado; de fora, DL 1350 (Lei de Migrações).
  migracao: { blocos: ['mercosul'], abertura: 'seletiva' },
  sucessao: {
    pais: 'PE',
    nome: 'Peru',
    legitima: 2 / 3,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 3, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.02,
    rotuloCusto: 'custas de cartório e de registro (não há imposto sobre herança)',
    vacancia: 'a Sociedade de Beneficência do lugar'
  },
  nomes: {
    cortes: [1975, 2005],
    grupos: [
      {
        id: 'pe',
        peso: 0.7,
        sobrenome: 'dois',
        ...PE_NOMES,
        sobrenomes: [
          'Quispe', 'Flores', 'Sánchez', 'Rodríguez', 'García', 'Rojas', 'Gonzales', 'Chávez', 'Ramos', 'Díaz',
          'Mendoza', 'Torres', 'Vásquez', 'Ramírez', 'Castillo', 'López', 'Pérez', 'Espinoza', 'Gutiérrez', 'Fernández',
          'Cruz', 'Vargas', 'Ruiz', 'Romero', 'Reyes', 'Salazar', 'Huamán', 'Silva', 'Córdova', 'Castro',
          'Paredes', 'Aguilar', 'Jiménez', 'Medina', 'Herrera', 'Cárdenas', 'Ríos', 'Morales', 'Campos', 'Rivera',
          'Alvarado', 'Guerrero', 'Valdivia', 'Zapata', 'Peña', 'Saavedra', 'Rengifo', 'Távara', 'Arévalo', 'Fasabi'
        ]
      },
      {
        // Sul andino: sobrenomes quéchuas e aimarás (Quispe e Mamani estão entre os mais comuns do país, RENIEC).
        id: 'pe_sul_andino',
        peso: 0.3,
        divisoes: ['PUN', 'CUS', 'APU', 'ARE', 'JUN'],
        sobrenome: 'dois',
        ...PE_NOMES,
        sobrenomes: [
          'Quispe', 'Mamani', 'Huamán', 'Condori', 'Choque', 'Ticona', 'Apaza', 'Huanca', 'Cusi', 'Ccori',
          'Puma', 'Coaquira', 'Huarachi', 'Pari', 'Chambi', 'Cutipa', 'Yupanqui', 'Ccama', 'Huillca', 'Sullca',
          'Flores', 'Gutiérrez', 'Chávez', 'Ramos', 'Rojas', 'Vargas', 'Mendoza', 'Pacheco', 'Zúñiga', 'Ccahuana',
          'Torres', 'Paredes', 'Velásquez', 'Delgado', 'Salas', 'Cáceres', 'Medina', 'Llerena', 'Valencia', 'Machaca'
        ]
      }
    ]
  },
  fontes: [
    'INEI — Evolución de la pobreza monetaria 2015–2025 (25,7% em 2025; rural 35,5%)',
    'INEI — Comportamiento de los indicadores del mercado laboral (emprego informal 70,7% em 2025)',
    'Decreto Supremo 015-2026-TR (El Peruano, 28/09/2026): RMV PEN 1.230 desde 1/10/2026 e 1.300 em 2027',
    'Decreto Supremo 301-2025-EF: UIT 2026 = PEN 5.500; Lei do Imposto à Renda, art. 46 e 53 (7 UIT; 8%, 14%...)',
    'Lei 27735 (gratificações); DS 001-97-TR (CTS); DS 003-97-TR, art. 38 (indenização por demissão arbitrária); Lei 30057 (Servir)',
    'DL 19990 (ONP); TUO da Lei do SPP (AFP)',
    'Constitución Política (reforma bicameral, Lei 31988); Lei Orgânica de Eleições, modificada para o Congresso bicameral (requisitos: senador 45 anos, deputado 25); Lei de Eleições Regionais e Municipais',
    'Código Civil de 1984, arts. 301, 681, 724–726, 822, 824, 828, 830',
    'Lei Universitária 30220; PRONABEC — Beca 18; SUNEDU (matrícula por gestão)',
    'Lei 29248 (serviço militar); DL 1350 (migrações)',
    'RENIEC — sobrenomes mais frequentes e nomes registrados',
    'FPF — Liga 1, Liga 2, Liga 3 e Copa Perú'
  ]
};

export const PAISES: PerfilDePais[] = [ARGENTINA, CHILE, URUGUAI, COLOMBIA, PERU];
