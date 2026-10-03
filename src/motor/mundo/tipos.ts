/**
 * O MUNDO — os tipos.
 *
 *   MUNDO → PAÍS → DIVISÃO (estado, província, região...) → CIDADE
 *         → instituições, economia, regras → PESSOA → oportunidades
 *
 * Duas camadas de dado:
 *   - o CATÁLOGO (`catalogo.ts`, gerado das fontes): os 193 países, com nome,
 *     região, moeda e a economia relativa (Banco Mundial). Todo país existe
 *     no mundo — para uma viagem, para a origem de alguém, para a lista.
 *   - o PERFIL (`paises/*.ts`): o que faz um país poder ser VIVIDO — cidades,
 *     nomes, escola, trabalho, política, farda, esporte, herança. Um país novo
 *     é um perfil novo; o motor só lê perfis.
 *
 * O motor não tem `switch (país)`: as diferenças são dados destes perfis, e
 * a exceção real (o FGTS brasileiro, o acesso aberto à universidade
 * argentina) é um valor de um campo que outros países também podem ter.
 */

import type { Classe, Dominio } from '../tipos';
import type { RegrasDeSucessao } from '../dados/sucessao';
import type { RegrasDoPais } from './regras';

export type RegiaoMundial = 'america_sul' | 'america_norte' | 'america_central_caribe' | 'europa' | 'africa' | 'asia' | 'oceania';

/** Economia relativa ao Brasil (o motor conta em reais de poder de compra brasileiro). */
export interface EconomiaDoCatalogo {
  /** PIB per capita (PPC) ÷ o do Brasil. */
  renda: number;
  /** Nível de preços (PPC ÷ câmbio) ÷ o do Brasil. É o que converte riqueza numa mudança de país. */
  precos: number;
  /** Moeda local por unidade do motor. */
  fator: number;
  /** Ano do dado. */
  ano: number;
}

/** [id ISO 3166-1, nome, artigo, região, sub-região, moeda ISO 4217, economia, população em milhares]. */
export type LinhaDoCatalogo = [string, string, '' | 'o' | 'a' | 'os' | 'as', RegiaoMundial, string, string, EconomiaDoCatalogo | undefined, number];

export interface PaisDoCatalogo {
  id: string;
  nome: string;
  artigo: '' | 'o' | 'a' | 'os' | 'as';
  regiao: RegiaoMundial;
  sub: string;
  moeda: string;
  economia?: EconomiaDoCatalogo;
  populacao: number;
}

/* ------------------------------------------------------------- Lugares */

export type PerfilUrbano = 'metropole' | 'metropolitana' | 'capital' | 'polo' | 'pequena';

/** Uma divisão administrativa de primeiro nível (estado, província, região, condado...). */
export interface Divisao {
  codigo: string;
  nome: string;
  /** Diferença regional real dentro do país (custo e salário), quando existe. 1 = a média. */
  custo?: number;
  salario?: number;
}

/**
 * Uma cidade de um perfil: [nome, código da divisão, porte, marcas].
 * Marcas: 'capital' (do país), 'sede' (da divisão), 'litoral', 'metro:<nome da metrópole>'.
 */
export type LinhaDeCidade = [string, string, PerfilUrbano, string?];

/* ---------------------------------------------------------------- Nomes */

export type Geracao = 'antiga' | 'meio' | 'nova';

/**
 * Um grupo de nomes: um país raramente é um só (a Índia do norte e a do sul,
 * o iorubá e o hauçá na Nigéria, o zulu e o africâner na África do Sul). O
 * grupo pode pertencer a algumas divisões; o peso diz quantos nascem nele.
 */
export interface GrupoDeNomes {
  id: string;
  peso: number;
  /** Divisões onde o grupo é comum (ausente: o país todo). */
  divisoes?: string[];
  masc: Record<Geracao, string[]>;
  fem: Record<Geracao, string[]>;
  sobrenomes: string[];
  /**
   * Como o sobrenome se forma e passa:
   *  - 'um': um sobrenome, o do pai (ou o que a família usa);
   *  - 'dois': o paterno e o materno ("García López"); o filho recebe o 1º de cada um;
   *  - 'luso': o materno e o paterno ("Souza Lima"), comum no Brasil e em Portugal — o filho fica com o último do pai.
   */
  sobrenome: 'um' | 'dois' | 'luso';
}

export interface PerfilDeNomes {
  grupos: GrupoDeNomes[];
  /** Nomes neutros (pessoas não binárias), quando o perfil os traz. */
  neutros?: string[];
  /** Anos que separam as gerações de nomes (antes do 1º: antiga; antes do 2º: meio). */
  cortes?: [number, number];
}

/* --------------------------------------------------------------- Perfis */

export interface PerfilEconomico {
  /** Como as famílias se distribuem ao nascer (pesos). */
  classes: Record<Classe, number>;
  /** A moradia em relação ao resto dos preços (1 = a relação brasileira). */
  moradia: number;
  /** Salário mínimo mensal, em MOEDA LOCAL (ausente: o país não tem um nacional; o piso vira o de mercado). */
  salarioMinimo?: number;
  /** Fatia do trabalho que é informal (0..1): pesa na chance de um emprego formal. */
  informalidade: number;
  /** Inflação típica ao ano (o dinheiro parado perde isto) e quanto ela varia. */
  inflacao: number;
  volatilidade: number;
}

export interface PerfilTrabalhista {
  /** Salários pagos por ano a quem tem contrato (12; 13,33 com 13º e férias; 14...). */
  mesesPagos: number;
  /**
   * Contribuição à previdência descontada do salário: a alíquota efetiva vai
   * de [mínima, máxima] até o teto (em moeda local por mês; ausente = sem teto).
   */
  contribuicao: { aliquota: [number, number]; teto?: number };
  /** Imposto de renda mensal, simplificado: isento até `isencao` (moeda local por mês) e uma alíquota marginal sobre o que passa. */
  impostoRenda: { isencao: number; aliquota: number };
  /** Na demissão sem justa causa: o que se recebe (`mesesPorAno` salários por ano de casa; 0 = nada além do aviso). */
  rescisao: { nome: string; mesesPorAno: number };
  /** Seguro-desemprego: meses e quanto do salário repõe (ausente: não há). */
  seguroDesemprego?: { meses: number; reposicao: number };
  /** Aposentadoria pública: idade [homens, mulheres], anos mínimos [homens, mulheres] e reposição na saída. */
  previdencia: { idade: [number, number]; anos: [number, number]; reposicao: number; nome: string;
    /** O artigo com que o nome anda sozinho numa frase ("o INSS"). Ausente: o texto diz "a previdência (nome)". */
    artigo?: 'o' | 'a' };
  /** Há concurso público como porta de entrada do serviço público. */
  concurso: boolean;
  /** A assistência ao idoso que não contribuiu: o nome (com artigo, na frase "passou a receber ..."), curto, e quanto do mínimo paga. */
  assistencia?: { nome: string; curto: string; fracao: number };
  /** Regime simplificado de quem trabalha por conta (no Brasil, o MEI): nome e teto de faturamento anual em moeda local. */
  microempreendedor?: { nome: string; tetoAnual: number };
  /** Como se diz o vínculo formal ("carteira assinada", "contrato com registro"). */
  contratoFormal: string;
}

export interface PerfilEducacional {
  /**
   * Os nomes da escola, em português: a etapa obrigatória e a que leva à
   * universidade ("o fundamental", "a primária"), como se conta a série, e
   * as escolas públicas da etapa (com artigo).
   */
  etapas: {
    fundamental: string; medio: string;
    serieMedio: 'série' | 'ano';
    publica: { creche: string; fundamental: string; medio: string };
  };
  /** Como se entra na universidade pública. */
  ingresso: 'exame_nacional' | 'acesso_aberto' | 'candidatura';
  /**
   * O exame que abre a universidade (ENEM, a EBAU, o SAT, o gaokao...).
   * `prova: false` quando não é uma prova que se faz, mas o boletim do
   * último ano (o Canadá); `acao` é o rótulo do botão quando "Fazer o X
   * deste ano" não serve.
   */
  exame: { nome: string; artigo: 'o' | 'a'; prova?: boolean; acao?: string };
  /** Quanto a universidade pública cobra, como fração da mensalidade privada (0 = gratuita). */
  publicaCobra: number;
  /**
   * A contribuição da pública é DIFERIDA por lei: o crédito público paga agora e quem se forma devolve depois (o
   * HECS-HELP australiano, o Student Finance inglês, o Student Loan neozelandês). Quem estuda não paga mensalidade.
   */
  publicaDiferida?: boolean;
  /** Bolsa pública para quem tem pouca renda (ProUni, beca...): nome e teto de renda por pessoa em salários mínimos. */
  bolsa?: { nome: string; teto: number };
  /** Crédito estudantil público (FIES, student loan, HECS...): nome e teto de renda por pessoa em salários mínimos (ausente: sem teto). */
  credito?: { nome: string; teto?: number };
  /**
   * Os nomes das instituições públicas, com artigo, quando o país tem os
   * seus (no Brasil: a universidade federal, o instituto federal, o Sistema
   * S, a escola estadual). Ausente: os nomes pelo que são ("a universidade
   * pública", "a escola técnica pública").
   */
  instituicoes?: { universidade: string; tecnico: string; livre: string; escolaFundamental: string; escolaMedio: string; nomeEscolaFundamental: string; nomeEscolaMedio: string };
  /** O sistema que distribui as vagas públicas pela nota, quando tem nome próprio (no Brasil, o SISU). */
  sistemaDeVagas?: string;
  /** Reserva de vagas por renda/escola pública. */
  cotas: boolean;
  /** Faculdade privada é um caminho comum. */
  privadaComum: boolean;
}

/** Os cargos eletivos do jogo, na estrutura de cada país. */
export type NivelPolitico = 'vereador' | 'prefeito' | 'deputado_estadual' | 'deputado_federal' | 'senador' | 'governador';

export interface CargoDoPais {
  /** Título real do cargo, em português ou na forma local quando não há tradução corrente: [masc, fem]. */
  titulo: [string, string];
  anos: number;
  idade: number;
  /** A casa ou o órgão ("a Câmara Municipal", "o Concejo Deliberante"). */
  casa: string;
}

export interface PerfilPolitico {
  /** Uma frase sobre a estrutura (sem juízo): "república presidencialista federal". */
  sistema: string;
  /** Os níveis que existem neste país (um nível ausente é um degrau que não há). */
  cargos: Partial<Record<NivelPolitico, CargoDoPais>>;
  /** Eleições locais e gerais: ano de referência e intervalo. */
  eleicoes: { local: [number, number]; geral: [number, number] };
  /** Mês da eleição (0 = janeiro). */
  mes: number;
  /** Voto obrigatório. */
  obrigatorio: boolean;
  /** Partidos: no Brasil, os reais (TSE); fora, a correlação é descrita sem nome (nunca se inventa um partido real). */
  partidosReais: boolean;
}

export interface PerfilMilitar {
  servico: 'obrigatorio' | 'seletivo' | 'voluntario';
  /** Idade do alistamento ou do ingresso. */
  idade: number;
  forcas: { exercito: string; marinha: string; aeronautica: string };
  /** A polícia de rua (no Brasil, a Polícia Militar). */
  policia: string;
  /**
   * Como o alistamento se conta, quando o perfil o descreve (a junta militar,
   * o alistamento feminino voluntário, a dispensa por excesso de contingente).
   * Ausente: uma descrição genérica do serviço do país.
   */
  alistamento?: { masculino: string; feminino: string; dispensa: [texto: string, memoria: string] };
}

export interface ClubeDoPais {
  nome: string;
  artigo: 'o' | 'a' | 'os' | 'as';
  porte: 'grande' | 'tradicional' | 'regional';
  /** Nome da cidade (de `cidades` do mesmo perfil). */
  cidade: string;
}

export interface PerfilEsportivo {
  /** O peso de cada esporte no país: multiplica a chance de uma porta (peneira, clube, circuito) se abrir. 1 = o normal. */
  popularidade: Partial<Record<Dominio, number>>;
  /** As divisões do futebol, do nível 1 (o mais baixo) ao 4 (a elite). */
  divisoes: [string, string, string, string];
  clubes: ClubeDoPais[];
}

export interface PerfilDeSaude {
  /** universal: a rede pública atende todos; misto: pública e planos; seguro: depende de seguro. */
  sistema: 'universal' | 'misto' | 'seguro';
  /** Como se chama a rede pública ("o SUS", "o NHS", "a rede pública"). */
  redePublica: string;
  /** Custo de um plano privado em relação ao brasileiro. */
  custoPlano: number;
}

export interface PerfilMigratorio {
  /** Blocos de livre residência/circulação de que o país faz parte (MERCOSUL, UE...). */
  blocos: string[];
  /** Para quem vem de fora de um bloco comum: quão aberta é a porta. */
  abertura: 'aberta' | 'seletiva' | 'restrita';
}

/**
 * Nomes e costumes do dia a dia que viram TEXTO (o Pix, o Detran, a festa
 * junina, a novela). Tudo opcional: o perfil que não traz um campo ganha a
 * forma genérica em português — nunca se inventa uma instituição.
 */
export interface PerfilCotidiano {
  /** Como se manda dinheiro a alguém, com artigo ("um Pix"). Genérico: "uma transferência". */
  transferencia?: string;
  /** Quem aplica a prova de direção, com artigo ("o Detran"). Genérico: a prova de direção, sem nome. */
  transito?: string;
  /** A polícia que investiga crime financeiro e lavagem ("a Polícia Federal"). Genérico: "a polícia". */
  policiaFederal?: string;
  /** Festas do calendário que viram cena: a festa junina da escola, o carnaval de rua, o réveillon de branco na praia. */
  festas?: ('junina' | 'carnaval' | 'reveillon')[];
  /** O que passa na TV da casa dos avós, à noite ("novela"). Genérico: "televisão". */
  tvDaNoite?: string;
  /** O pronto-atendimento público de madrugada, com artigo ("a UPA"). Genérico: "o pronto-socorro". */
  prontoAtendimento?: string;
  /** Onde a rede pública acompanha a saúde mental de quem é menor ("UBS ou CAPSi"), dito entre parênteses. Genérico: nada. */
  saudeMentalJovem?: string;
  /** A frase do programa de aprendiz para quem ainda estuda (no Brasil, o jovem aprendiz com carteira assinada). Genérico: aprendiz com contrato. */
  aprendiz?: string;
  /** O imposto anual sobre o imóvel, no rótulo das contas ("IPTU"). Genérico: "Imposto do imóvel". */
  impostoImovel?: string;
  /** Onde se casa no civil, com artigo ("o cartório"). Genérico: "o registro civil" (e o almoço sem o churrasco). */
  registroCivil?: string;
  /** Diz-se "nome sujo" de quem está no cadastro de devedores. Ausente: só "o cadastro de devedores". */
  nomeSujo?: boolean;
  /** O time de futebol amador de bairro ("time de várzea"). Genérico: "time amador do bairro". */
  timeAmador?: string;
}

/** Um país que pode ser vivido. */
export interface PerfilDePais {
  id: string;
  gentilico: [string, string];
  /** Línguas correntes, em português ("espanhol", "inglês"). A primeira é a do dia a dia. */
  idiomas: string[];
  divisao: { tipo: [string, string]; lista: Divisao[] };
  cidades: LinhaDeCidade[];
  economia: PerfilEconomico;
  trabalho: PerfilTrabalhista;
  educacao: PerfilEducacional;
  politica: PerfilPolitico;
  militar: PerfilMilitar;
  esporte: PerfilEsportivo;
  saude: PerfilDeSaude;
  migracao: PerfilMigratorio;
  /** Nomes e costumes do dia a dia (ausente: tudo genérico). */
  cotidiano?: PerfilCotidiano;
  sucessao: RegrasDeSucessao;
  /** As regras legais que o país muda em relação às universais (idades, carteira de motorista) — `mundo/regras`. */
  regras?: RegrasDoPais;
  nomes: PerfilDeNomes;
  /** De onde vêm os dados factuais do perfil. */
  fontes: string[];
}
