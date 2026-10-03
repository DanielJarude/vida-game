/**
 * BRASIL — o perfil do país em que o VIDA nasceu.
 *
 * Os números são os que o motor sempre usou, agora como dado de um perfil
 * igual aos dos outros países: o motor não sabe que o Brasil é o Brasil.
 * As cidades e os clubes brasileiros continuam nos catálogos de antes
 * (`dados/lugares`, `dados/clubes`), porque os ids deles estão nos saves.
 */

import type { PerfilDePais } from '../tipos';

export const BRASIL: PerfilDePais = {
  id: 'BR',
  gentilico: ['brasileiro', 'brasileira'],
  idiomas: ['português'],
  divisao: { tipo: ['estado', 'estados'], lista: [] }, // as UFs vivem em `dados/lugares` (com as regiões)
  cidades: [],
  economia: {
    classes: { vulneravel: 22, trabalhadora: 31, media_baixa: 22, media: 17, alta: 8 },
    moradia: 1,
    salarioMinimo: 1620,
    informalidade: 0.38,
    inflacao: 0.045,
    volatilidade: 1
  },
  trabalho: {
    mesesPagos: 13.33,
    contribuicao: { aliquota: [0.075, 0.117], teto: 8160 },
    impostoRenda: { isencao: 5000, aliquota: 0.24 },
    rescisao: { nome: 'FGTS, multa', mesesPorAno: 1.344 }, // saldo do FGTS (8% ao mês) + multa de 40%
    seguroDesemprego: { meses: 4, reposicao: 0.8 },
    previdencia: { idade: [65, 62], anos: [20, 15], reposicao: 0.6, nome: 'INSS', artigo: 'o' },
    concurso: true,
    assistencia: { nome: 'o BPC: um salário mínimo por mês', curto: 'o BPC', fracao: 1 },
    microempreendedor: { nome: 'MEI', tetoAnual: 81000 },
    contratoFormal: 'carteira assinada'
  },
  educacao: {
    etapas: {
      fundamental: 'fundamental', medio: 'ensino médio', serieMedio: 'série',
      publica: { creche: 'a creche municipal', fundamental: 'a escola municipal', medio: 'a escola estadual' }
    },
    ingresso: 'exame_nacional',
    exame: { nome: 'ENEM', artigo: 'o' },
    sistemaDeVagas: 'o SISU',
    instituicoes: {
      universidade: 'a universidade federal', tecnico: 'o instituto federal', livre: 'um curso gratuito do Sistema S',
      escolaFundamental: 'escola municipal', escolaMedio: 'escola estadual', nomeEscolaFundamental: 'Escola Municipal', nomeEscolaMedio: 'Escola Estadual'
    },
    publicaCobra: 0,
    bolsa: { nome: 'ProUni', teto: 1.5 },
    credito: { nome: 'FIES', teto: 3 },
    cotas: true,
    privadaComum: true
  },
  politica: {
    sistema: 'república presidencialista federal',
    cargos: {
      vereador: { titulo: ['vereador', 'vereadora'], anos: 4, idade: 18, casa: 'a Câmara Municipal' },
      prefeito: { titulo: ['prefeito', 'prefeita'], anos: 4, idade: 21, casa: 'a Prefeitura' },
      deputado_estadual: { titulo: ['deputado estadual', 'deputada estadual'], anos: 4, idade: 21, casa: 'a Assembleia Legislativa' },
      deputado_federal: { titulo: ['deputado federal', 'deputada federal'], anos: 4, idade: 21, casa: 'a Câmara dos Deputados' },
      senador: { titulo: ['senador', 'senadora'], anos: 8, idade: 35, casa: 'o Senado Federal' },
      governador: { titulo: ['governador', 'governadora'], anos: 4, idade: 30, casa: 'o Governo do Estado' }
    },
    eleicoes: { local: [2028, 4], geral: [2030, 4] },
    mes: 9,
    obrigatorio: true,
    partidosReais: true
  },
  militar: {
    servico: 'obrigatorio',
    idade: 18,
    forcas: { exercito: 'o Exército', marinha: 'a Marinha', aeronautica: 'a Aeronáutica' },
    policia: 'a Polícia Militar',
    alistamento: {
      masculino: 'Fila na junta militar, formulário, exame. Na ficha, uma pergunta: você deseja servir?',
      feminino: 'Desde 2025, mulheres podem se alistar voluntariamente no ano em que fazem 18. O site abre em janeiro; as vagas são poucas e há seleção.',
      dispensa: ['Dispensado por excesso de contingente. O certificado veio pelo correio.', 'Fez o alistamento militar e foi dispensado por excesso de contingente.']
    }
  },
  esporte: {
    popularidade: { futebol: 1.25, volei: 1.15, basquete: 0.85, lutas: 1.05, natacao: 0.9, atletismo: 0.9, tenis: 0.8 },
    divisoes: ['campeonato estadual', 'divisões de acesso', 'Série B', 'Série A'],
    clubes: [] // `dados/clubes`
  },
  // Misto: o SUS atende todos, e a classe média costuma pagar um plano.
  saude: { sistema: 'misto', redePublica: 'o SUS', custoPlano: 1 },
  // CPLP: o acordo de mobilidade (2021) e a autorização de residência CPLP de Portugal (Lei 18/2022).
  migracao: { blocos: ['mercosul', 'cplp'], abertura: 'seletiva' },
  cotidiano: {
    transferencia: 'um Pix',
    transito: 'o Detran',
    policiaFederal: 'a Polícia Federal',
    festas: ['junina', 'carnaval', 'reveillon'],
    tvDaNoite: 'novela',
    prontoAtendimento: 'a UPA',
    saudeMentalJovem: 'UBS ou CAPSi',
    impostoImovel: 'IPTU',
    registroCivil: 'o cartório',
    nomeSujo: true,
    timeAmador: 'time de várzea',
    aprendiz: 'A escola tem vagas de jovem aprendiz: meio período, carteira assinada, escola garantida.'
  },
  sucessao: {
    pais: 'BR',
    nome: 'Brasil',
    legitima: 0.5,
    necessarios: ['descendentes', 'ascendentes', 'conjuge'],
    conjugeComDescendentes: true,
    conjugeComAscendentes: [1 / 3, 1 / 2],
    representacao: true,
    colaterais: true,
    meacao: true,
    custoTransmissao: 0.04,
    rotuloCusto: 'imposto de transmissão (ITCMD) e custas do inventário',
    vacancia: 'o município'
  },
  nomes: {
    cortes: [1972, 2004],
    neutros: ['Alex', 'Sam', 'Cris', 'Dani', 'Ariel', 'Kim', 'Mika', 'Sasha', 'Jules', 'Luz', 'Sol', 'Manu', 'Duda', 'Noah', 'Gabi', 'Eli', 'Rudá', 'Ávila'],
    grupos: [{
      id: 'br',
      peso: 1,
      sobrenome: 'luso',
      masc: {
        antiga: ['José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Sebastião', 'Luiz', 'Raimundo', 'Manoel', 'Geraldo', 'Jorge', 'Roberto', 'Osvaldo', 'Benedito', 'Valdir', 'Edson', 'Nelson', 'Aparecido', 'Waldemar',
          'Pedro', 'Joaquim', 'Severino', 'Amaro', 'Lourival', 'Milton', 'Wilson', 'Ademir', 'Gilberto', 'Mário', 'Rubens', 'Hélio', 'Otávio', 'Ivo', 'Arlindo', 'Nilton', 'Cícero', 'Expedito', 'Genésio', 'Walter'],
        meio: ['Marcelo', 'Rodrigo', 'Fábio', 'Anderson', 'Leandro', 'Alexandre', 'Rafael', 'Fernando', 'Márcio', 'Daniel', 'Diego', 'Bruno', 'Thiago', 'Eduardo', 'Renato', 'Leonardo', 'Gustavo', 'André', 'Vinícius', 'Wellington', 'Juliano', 'Cristiano', 'Everton', 'Cleber',
          'Rogério', 'Sérgio', 'Ricardo', 'Luciano', 'Adriano', 'Flávio', 'Robson', 'Júlio', 'Maurício', 'Alessandro', 'Emerson', 'Wagner', 'Jefferson', 'Ronaldo', 'Felipe', 'Rafael', 'Tiago', 'Douglas', 'Igor', 'Caio', 'Danilo', 'Henrique', 'Guilherme', 'Rodolfo'],
        nova: ['Miguel', 'Arthur', 'Gael', 'Heitor', 'Theo', 'Davi', 'Bernardo', 'Gabriel', 'Ravi', 'Samuel', 'Noah', 'Pedro', 'Lorenzo', 'Benício', 'Matheus', 'Lucas', 'Isaac', 'Joaquim', 'Enzo', 'Murilo', 'Bento', 'Caio', 'Vicente', 'Anthony',
          'Otávio', 'Levi', 'Nicolas', 'Lucca', 'Emanuel', 'Henry', 'Rafael', 'Guilherme', 'Felipe', 'Benjamin', 'João Miguel', 'Pietro', 'Antônio', 'Francisco', 'Leonardo', 'Yuri', 'Kauã', 'Ryan', 'Luan', 'Cauã', 'Davi Lucca', 'Martin', 'Augusto', 'Raul']
      },
      fem: {
        antiga: ['Maria', 'Francisca', 'Antônia', 'Ana', 'Rosa', 'Terezinha', 'Aparecida', 'Sebastiana', 'Luzia', 'Raimunda', 'Marlene', 'Neusa', 'Conceição', 'Zilda', 'Iracema', 'Dalva', 'Cleusa', 'Benedita', 'Irene', 'Lourdes',
          'Joana', 'Tereza', 'Célia', 'Marta', 'Vera', 'Sônia', 'Nair', 'Helena', 'Rita', 'Glória', 'Odete', 'Jandira', 'Ivone', 'Elza', 'Nilza', 'Hilda', 'Lúcia', 'Regina', 'Fátima', 'Graça'],
        meio: ['Juliana', 'Patrícia', 'Fernanda', 'Aline', 'Renata', 'Vanessa', 'Camila', 'Priscila', 'Adriana', 'Daniela', 'Cristiane', 'Luciana', 'Tatiane', 'Simone', 'Carla', 'Débora', 'Kelly', 'Viviane', 'Michele', 'Letícia', 'Andreia', 'Sabrina',
          'Elaine', 'Cláudia', 'Rosana', 'Márcia', 'Silvana', 'Jaqueline', 'Gisele', 'Tânia', 'Sandra', 'Eliane', 'Karina', 'Larissa', 'Bruna', 'Mariana', 'Amanda', 'Natália', 'Raquel', 'Paula', 'Carolina', 'Bianca', 'Roberta', 'Thaís', 'Jéssica', 'Monique'],
        nova: ['Helena', 'Alice', 'Laura', 'Maria Clara', 'Cecília', 'Valentina', 'Heloísa', 'Manuela', 'Sophia', 'Liz', 'Aurora', 'Isabella', 'Lívia', 'Maitê', 'Antonella', 'Beatriz', 'Lorena', 'Mariana', 'Eloá', 'Júlia', 'Ayla', 'Luna', 'Clara', 'Esther',
          'Maria Alice', 'Isis', 'Lara', 'Melissa', 'Yasmin', 'Rebeca', 'Agatha', 'Olívia', 'Maria Luiza', 'Mirella', 'Nicole', 'Emanuelly', 'Ana Clara', 'Catarina', 'Rafaela', 'Elisa', 'Stella', 'Gabriela', 'Vitória', 'Marina', 'Pietra', 'Maya', 'Zoe', 'Bianca']
      },
      sobrenomes: [
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
        'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
        'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
        'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira', 'Pinto', 'Castro', 'Moura', 'Cavalcanti', 'Dantas',
        'Araújo', 'Monteiro', 'Batista', 'Correia', 'Farias', 'Miranda', 'Tavares', 'Brito', 'Sales', 'Xavier'
      ]
    }]
  },
  fontes: [
    'Salário mínimo de 2026 (R$ 1.620), tabela do INSS e isenção do IR até R$ 5.000: os parâmetros que o motor já usava (`sistemas/renda`).',
    'Código Civil (Lei 10.406/2002): sucessão — ver `dados/sucessao`.',
    'Constituição Federal, art. 14 §3º (idades mínimas para os cargos) e art. 46 (mandato de senador).',
    'Lei 4.375/1964 (serviço militar); Lei 12.711/2012 (cotas); ProUni (Lei 11.096/2005); FIES (Lei 10.260/2001).',
    'Informalidade: IBGE, PNAD Contínua (~38% dos ocupados).'
  ]
};
