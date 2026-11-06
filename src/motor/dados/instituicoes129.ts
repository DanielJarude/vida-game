/**
 * VIDA 12.9 · Estudos — instituições de ensino superior REAIS (Brasil primeiro).
 *
 * Catálogo puro (só tipos), gerado a partir da pesquisa em fontes oficiais (`a129/universidades.json` e
 * `universidades-fontes.md`): nome, sigla, tipo, cidade/UF, formas de ingresso, os campi com os cursos (ids do jogo)
 * oferecidos em CADA campus e, nas particulares, a mensalidade de referência com fonte e ano. Nada aqui é inventado: o
 * campo que a pesquisa não verificou fica ausente — e o motor, sem ele, usa o valor genérico do curso (sem atribuí-lo à
 * instituição). Um curso só aparece num campus quando a fonte diz que ele é oferecido ali.
 *
 * Outros países entram no futuro como mais entradas com o seu `pais` (o motor já filtra por país; sem catálogo para o
 * país, o ingresso continua o genérico de sempre).
 */

/** Os processos seletivos que o motor sabe conduzir (cada um com fases, escala e nota próprias: `sistemas/estudos129`). */
export type Processo129 =
  | 'sisu'            // nota do ENEM, pelo SISU (federais e muitas estaduais)
  | 'fuvest'          // USP: 1ª fase objetiva, 2ª fase discursiva
  | 'comvest'         // Unicamp: 1ª fase objetiva, 2ª fase discursiva
  | 'vunesp'          // Unesp: 1ª fase objetiva, 2ª fase discursiva
  | 'pas_unb'         // UnB: Programa de Avaliação Seriada (três etapas no ensino médio)
  | 'vestibular_unb'  // UnB: vestibular próprio
  | 'uerj'            // UERJ: Exame de Qualificação + Exame Discursivo
  | 'vestibular'      // vestibular próprio de uma pública (uma prova objetiva + redação)
  | 'vestibular_privada' // vestibular próprio de uma particular (prova + redação, várias datas)
  | 'enem_privada'    // a particular que aceita a nota do ENEM no lugar da prova
  | 'enem_publica'    // a pública com seleção própria pela nota do ENEM (ENEM-USP, ENEM-Unicamp, Acesso Enem da UnB)
  | 'provao_paulista'; // Provão Paulista Seriado (rede pública de SP: provas ao longo do médio)

export type TipoInstituicao129 = 'federal' | 'estadual' | 'municipal' | 'privada' | 'comunitaria' | 'confessional';

export interface Mensalidade129 {
  /** Valor mensal de referência, em reais (nominal do ano da fonte). */
  valor: number;
  ano: number;
  fonte: string;
  /** Lida de fonte mais fraca (o resumo de um buscador, não a página oficial aberta). */
  fraca?: boolean;
}

export interface Campus129 {
  id: string;
  nome: string;
  /** O município do jogo (`dados/lugares`). */
  municipioId: string;
  /** Os cursos (ids do jogo) oferecidos NESTE campus, segundo a fonte. */
  cursos: string[];
  /** Particulares: a mensalidade de referência de cada curso NESTE campus, quando a fonte a publica e diz o campus. */
  mensalidades?: Partial<Record<string, Mensalidade129>>;
}

export interface Instituicao129 {
  id: string;
  nome: string;
  sigla: string;
  tipo: TipoInstituicao129;
  pais: string;
  uf: string;
  /** Como se entra (na ordem em que a instituição os usa). */
  ingresso: Processo129[];
  campi: Campus129[];
  /** Os turnos que a instituição oferece (em algum curso; o turno de cada curso não foi verificado). Ausente: não verificado. */
  turnos?: ('manha' | 'tarde' | 'noite' | 'integral')[];
  /** A duração de cada curso nesta instituição (meses), quando a fonte dá um valor único (sem "8 a 10", sem "/ noturno"). */
  duracoes?: Partial<Record<string, number>>;
  /** Fonte principal (o site da instituição, o e-MEC). */
  fonte?: string;
}

/** O que a matrícula guarda da instituição real (ausente nas matrículas genéricas e nos saves antigos). */
export interface MatriculaInstituicao129 {
  id: string;
  campus: string;
  processo?: Processo129 | 'prouni' | 'fies';
  turno?: 'manha' | 'tarde' | 'noite' | 'integral';
  /** A duração do curso nesta instituição (meses), quando o catálogo a dá. */
  meses?: number;
}

/** Uma fase de um processo seletivo, como foi (a nota, a escala, o corte). */
export interface FaseDoProcesso129 { nome: string; nota: number; max: number; corte?: number; passou: boolean }

/** Um processo seletivo feito (o que a tela mostra de resultado; os últimos ficam guardados). */
export interface ProcessoFeito129 {
  t: number;
  instId?: string;
  campus?: string;
  cursoId: string;
  processo: string;
  /** "Fuvest", "SISU (ENEM)", "Vestibular da PUC-SP". */
  nome: string;
  instituicao: string;
  fases: FaseDoProcesso129[];
  aprovado: boolean;
  /** "lista de espera", "classificado em 2ª chamada". */
  nota?: string;
}

export const INSTITUICOES_129: readonly Instituicao129[] = [
 {
  "id": "usp",
  "nome": "Universidade de São Paulo",
  "sigla": "USP",
  "tipo": "estadual",
  "pais": "BR",
  "uf": "SP",
  "ingresso": [
   "fuvest",
   "enem_publica",
   "provao_paulista"
  ],
  "campi": [
   {
    "id": "sao-paulo",
    "nome": "São Paulo (Butantã / Quadrilátero Saúde / USP Leste)",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "veterinaria",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "estatistica"
    ]
   },
   {
    "id": "ribeirao-preto",
    "nome": "Ribeirão Preto",
    "municipioId": "ribeirao-preto-sp",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "psicologia",
     "direito",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "musica_grad",
     "ed_fisica",
     "nutricao"
    ]
   },
   {
    "id": "sao-carlos",
    "nome": "São Carlos",
    "municipioId": "sao-carlos-sp",
    "cursos": [
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "estatistica",
     "licenciatura"
    ]
   },
   {
    "id": "bauru",
    "nome": "Bauru",
    "municipioId": "bauru-sp",
    "cursos": [
     "medicina",
     "odontologia"
    ]
   },
   {
    "id": "piracicaba",
    "nome": "Piracicaba (ESALQ)",
    "municipioId": "piracicaba-sp",
    "cursos": [
     "agronomia",
     "administracao",
     "economia",
     "licenciatura"
    ]
   },
   {
    "id": "pirassununga",
    "nome": "Pirassununga (FZEA)",
    "municipioId": "pirassununga-sp",
    "cursos": [
     "veterinaria"
    ]
   },
   {
    "id": "lorena",
    "nome": "Lorena (EEL)",
    "municipioId": "lorena-sp",
    "cursos": [
     "eng_producao"
    ]
   }
  ],
  "turnos": [
   "integral",
   "manha",
   "tarde",
   "noite"
  ],
  "duracoes": {
   "medicina": 72,
   "direito": 60,
   "eng_civil": 60,
   "computacao": 48,
   "arquitetura": 60,
   "veterinaria": 60
  },
  "fonte": "https://www.fuvest.br/wp-content/uploads/fuvest2027-guia-carreiras.pdf"
 },
 {
  "id": "unicamp",
  "nome": "Universidade Estadual de Campinas",
  "sigla": "Unicamp",
  "tipo": "estadual",
  "pais": "BR",
  "uf": "SP",
  "ingresso": [
   "comvest",
   "enem_publica",
   "provao_paulista"
  ],
  "campi": [
   {
    "id": "campinas",
    "nome": "Campinas (Barão Geraldo)",
    "municipioId": "campinas-sp",
    "cursos": [
     "medicina",
     "enfermagem",
     "farmacia",
     "eng_civil",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "estatistica"
    ]
   },
   {
    "id": "limeira",
    "nome": "Limeira (FCA/FT)",
    "municipioId": "limeira-sp",
    "cursos": [
     "eng_producao",
     "computacao",
     "administracao",
     "nutricao"
    ]
   },
   {
    "id": "piracicaba",
    "nome": "Piracicaba (FOP)",
    "municipioId": "piracicaba-sp",
    "cursos": [
     "odontologia"
    ]
   }
  ],
  "turnos": [
   "integral",
   "noite"
  ],
  "duracoes": {
   "medicina": 72
  },
  "fonte": "https://www.comvest.unicamp.br/cursos/"
 },
 {
  "id": "unesp",
  "nome": "Universidade Estadual Paulista \"Júlio de Mesquita Filho\"",
  "sigla": "Unesp",
  "tipo": "estadual",
  "pais": "BR",
  "uf": "SP",
  "ingresso": [
   "vunesp",
   "provao_paulista",
   "enem_publica"
  ],
  "campi": [
   {
    "id": "botucatu",
    "nome": "Botucatu",
    "municipioId": "botucatu-sp",
    "cursos": [
     "medicina",
     "enfermagem",
     "veterinaria",
     "agronomia",
     "nutricao"
    ]
   },
   {
    "id": "bauru",
    "nome": "Bauru",
    "municipioId": "bauru-sp",
    "cursos": [
     "arquitetura",
     "jornalismo",
     "design",
     "computacao",
     "ed_fisica",
     "licenciatura",
     "pedagogia",
     "psicologia",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "estatistica"
    ]
   },
   {
    "id": "araraquara",
    "nome": "Araraquara",
    "municipioId": "araraquara-sp",
    "cursos": [
     "farmacia",
     "odontologia",
     "economia",
     "letras",
     "pedagogia"
    ]
   },
   {
    "id": "franca",
    "nome": "Franca",
    "municipioId": "franca-sp",
    "cursos": [
     "direito",
     "licenciatura"
    ]
   },
   {
    "id": "sao-paulo",
    "nome": "São Paulo (Instituto de Artes)",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "musica_grad",
     "artes_cenicas",
     "licenciatura"
    ]
   }
  ],
  "fonte": "https://www.ourinhos.unesp.br/Home/guia-unesp-de-profissoes-2024bx-compactado.pdf"
 },
 {
  "id": "ufrj",
  "nome": "Universidade Federal do Rio de Janeiro",
  "sigla": "UFRJ",
  "tipo": "federal",
  "pais": "BR",
  "uf": "RJ",
  "ingresso": [
   "sisu"
  ],
  "campi": [
   {
    "id": "rio-de-janeiro",
    "nome": "Rio de Janeiro (Cidade Universitária, Praia Vermelha e centro)",
    "municipioId": "rio-de-janeiro-rj",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "estatistica"
    ]
   },
   {
    "id": "macae",
    "nome": "Macaé",
    "municipioId": "macae-rj",
    "cursos": [
     "medicina",
     "enfermagem",
     "farmacia",
     "nutricao",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "licenciatura"
    ]
   }
  ],
  "fonte": "https://siga.ufrj.br/sira/repositorio-curriculo/80167CF7-3880-478C-8293-8E7D80CEDEBE.html"
 },
 {
  "id": "ufmg",
  "nome": "Universidade Federal de Minas Gerais",
  "sigla": "UFMG",
  "tipo": "federal",
  "pais": "BR",
  "uf": "MG",
  "ingresso": [
   "sisu"
  ],
  "campi": [
   {
    "id": "belo-horizonte",
    "nome": "Belo Horizonte (Pampulha / Saúde)",
    "municipioId": "belo-horizonte-mg",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "veterinaria",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "estatistica"
    ]
   },
   {
    "id": "montes-claros",
    "nome": "Montes Claros (ICA)",
    "municipioId": "montes-claros-mg",
    "cursos": [
     "agronomia",
     "administracao"
    ]
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "integral",
   "noite"
  ],
  "fonte": "https://www.ufmg.br/sisu/wp-content/uploads/2026/01/SISU-2026-SEI_UFMG-4871178-Edital.pdf"
 },
 {
  "id": "unb",
  "nome": "Universidade de Brasília",
  "sigla": "UnB",
  "tipo": "federal",
  "pais": "BR",
  "uf": "DF",
  "ingresso": [
   "pas_unb",
   "vestibular_unb",
   "enem_publica",
   "sisu"
  ],
  "campi": [
   {
    "id": "darcy-ribeiro",
    "nome": "Darcy Ribeiro (Asa Norte)",
    "municipioId": "brasilia-df",
    "cursos": [
     "medicina",
     "enfermagem",
     "odontologia",
     "farmacia",
     "veterinaria",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "agronomia",
     "estatistica"
    ]
   },
   {
    "id": "unb-ceilandia",
    "nome": "UnB Ceilândia (FCTS)",
    "municipioId": "brasilia-df",
    "cursos": [
     "enfermagem",
     "farmacia",
     "fisioterapia"
    ]
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite"
  ],
  "fonte": "https://cdn.cebraspe.org.br/vestibulares/UNB_26_ACESSOENEM/arquivos/7EE434DB526CE4532D041724565669FAC3A15D9EBB9FE3554E2AB41E166BDA49.pdf"
 },
 {
  "id": "ufrgs",
  "nome": "Universidade Federal do Rio Grande do Sul",
  "sigla": "UFRGS",
  "tipo": "federal",
  "pais": "BR",
  "uf": "RS",
  "ingresso": [
   "vestibular",
   "sisu"
  ],
  "campi": [
   {
    "id": "porto-alegre",
    "nome": "Porto Alegre (Centro, Saúde, Vale, Olímpico)",
    "municipioId": "porto-alegre-rs",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "veterinaria",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "agronomia",
     "estatistica"
    ]
   },
   {
    "id": "litoral-norte",
    "nome": "Litoral Norte (Tramandaí)",
    "municipioId": "tramandai-rs",
    "cursos": [
     "pedagogia",
     "licenciatura"
    ]
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite"
  ],
  "fonte": "https://www.ufrgs.br/coperse/wp-content/uploads/2026/08/Edital-COPERSE-n.-16-2026-Vestibular-UFRGS-2027.pdf"
 },
 {
  "id": "ufsc",
  "nome": "Universidade Federal de Santa Catarina",
  "sigla": "UFSC",
  "tipo": "federal",
  "pais": "BR",
  "uf": "SC",
  "ingresso": [
   "vestibular",
   "sisu"
  ],
  "campi": [
   {
    "id": "florianopolis",
    "nome": "Florianópolis (Trindade)",
    "municipioId": "florianopolis-sc",
    "cursos": [
     "medicina",
     "enfermagem",
     "odontologia",
     "farmacia",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "design",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "agronomia",
     "estatistica"
    ]
   },
   {
    "id": "ararangua",
    "nome": "Araranguá",
    "municipioId": "ararangua-sc",
    "cursos": [
     "medicina",
     "fisioterapia",
     "computacao"
    ]
   },
   {
    "id": "curitibanos",
    "nome": "Curitibanos",
    "municipioId": "curitibanos-sc",
    "cursos": [
     "medicina",
     "veterinaria",
     "agronomia"
    ]
   },
   {
    "id": "blumenau",
    "nome": "Blumenau",
    "municipioId": "blumenau-sc",
    "cursos": [
     "licenciatura"
    ]
   }
  ],
  "turnos": [
   "integral",
   "manha",
   "tarde",
   "noite"
  ],
  "fonte": "https://vestibularunificado2027.ufsc.br/files/2026/08/ANEXO-A1-e-A2-UFSC-2027.pdf"
 },
 {
  "id": "ufpr",
  "nome": "Universidade Federal do Paraná",
  "sigla": "UFPR",
  "tipo": "federal",
  "pais": "BR",
  "uf": "PR",
  "ingresso": [
   "vestibular",
   "sisu"
  ],
  "campi": [
   {
    "id": "curitiba",
    "nome": "Curitiba",
    "municipioId": "curitiba-pr",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "veterinaria",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "ed_fisica",
     "nutricao",
     "agronomia",
     "estatistica"
    ]
   },
   {
    "id": "toledo",
    "nome": "Toledo",
    "municipioId": "toledo-pr",
    "cursos": [
     "medicina"
    ]
   },
   {
    "id": "palotina",
    "nome": "Palotina",
    "municipioId": "palotina-pr",
    "cursos": [
     "veterinaria",
     "agronomia",
     "licenciatura"
    ]
   },
   {
    "id": "jandaia-do-sul",
    "nome": "Jandaia do Sul",
    "municipioId": "jandaia-do-sul-pr",
    "cursos": [
     "agronomia",
     "eng_producao",
     "licenciatura"
    ]
   }
  ],
  "turnos": [
   "integral",
   "manha",
   "tarde",
   "noite"
  ],
  "fonte": "https://servicos.nc.ufpr.br/PortalNC/obterDocumento?pub=9363"
 },
 {
  "id": "ufpe",
  "nome": "Universidade Federal de Pernambuco",
  "sigla": "UFPE",
  "tipo": "federal",
  "pais": "BR",
  "uf": "PE",
  "ingresso": [
   "sisu"
  ],
  "campi": [
   {
    "id": "recife",
    "nome": "Recife",
    "municipioId": "recife-pe",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "estatistica"
    ]
   },
   {
    "id": "caruaru",
    "nome": "Caruaru (Centro Acadêmico do Agreste)",
    "municipioId": "caruaru-pe",
    "cursos": [
     "medicina",
     "administracao",
     "economia",
     "design",
     "eng_civil",
     "eng_producao",
     "pedagogia",
     "licenciatura"
    ]
   },
   {
    "id": "vitoria-de-santo-antao",
    "nome": "Vitória de Santo Antão (CAV)",
    "municipioId": "vitoria-de-santo-antao-pe",
    "cursos": [
     "enfermagem",
     "nutricao",
     "ed_fisica",
     "licenciatura"
    ]
   }
  ],
  "fonte": "https://www.ufpe.br/cursos/graduacao"
 },
 {
  "id": "ufba",
  "nome": "Universidade Federal da Bahia",
  "sigla": "UFBA",
  "tipo": "federal",
  "pais": "BR",
  "uf": "BA",
  "ingresso": [
   "sisu"
  ],
  "campi": [
   {
    "id": "salvador",
    "nome": "Salvador (Ondina, Canela, Federação, Piedade)",
    "municipioId": "salvador-ba",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "veterinaria",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "estatistica"
    ]
   },
   {
    "id": "vitoria-da-conquista",
    "nome": "Vitória da Conquista (IMS – Anísio Teixeira)",
    "municipioId": "vitoria-da-conquista-ba",
    "cursos": [
     "medicina",
     "enfermagem",
     "farmacia",
     "nutricao",
     "psicologia"
    ]
   },
   {
    "id": "camacari",
    "nome": "Camaçari (Carlos Marighella)",
    "municipioId": "camacari-ba",
    "cursos": [
     "eng_producao"
    ]
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite"
  ],
  "fonte": "https://web.archive.org/web/20260607225643/https://prograd.ufba.br/catalogo-de-cursos"
 },
 {
  "id": "ufc",
  "nome": "Universidade Federal do Ceará",
  "sigla": "UFC",
  "tipo": "federal",
  "pais": "BR",
  "uf": "CE",
  "ingresso": [
   "sisu"
  ],
  "campi": [
   {
    "id": "fortaleza",
    "nome": "Fortaleza (Benfica, Pici, Porangabuçu)",
    "municipioId": "fortaleza-ce",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "agronomia",
     "estatistica"
    ]
   },
   {
    "id": "sobral",
    "nome": "Sobral",
    "municipioId": "sobral-ce",
    "cursos": [
     "medicina",
     "odontologia",
     "psicologia",
     "economia",
     "computacao",
     "musica_grad"
    ]
   },
   {
    "id": "quixada",
    "nome": "Quixadá",
    "municipioId": "quixada-ce",
    "cursos": [
     "computacao",
     "design"
    ]
   },
   {
    "id": "russas",
    "nome": "Russas",
    "municipioId": "russas-ce",
    "cursos": [
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "computacao"
    ]
   }
  ],
  "turnos": [
   "integral",
   "noite"
  ],
  "duracoes": {
   "medicina": 72,
   "direito": 60,
   "eng_civil": 60,
   "computacao": 48,
   "psicologia": 60,
   "odontologia": 60,
   "enfermagem": 54
  },
  "fonte": "https://sisu.ufc.br/wp-content/uploads/2025/12/termo-de-adesao-ufc-sisu-2026.pdf"
 },
 {
  "id": "pucsp",
  "nome": "Pontifícia Universidade Católica de São Paulo",
  "sigla": "PUC-SP",
  "tipo": "comunitaria",
  "pais": "BR",
  "uf": "SP",
  "ingresso": [
   "vestibular_privada"
  ],
  "campi": [
   {
    "id": "monte-alegre",
    "nome": "Monte Alegre (Perdizes)",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "direito",
     "psicologia",
     "administracao",
     "jornalismo",
     "fisioterapia",
     "contabeis",
     "economia",
     "pedagogia",
     "letras",
     "publicidade"
    ],
    "mensalidades": {
     "direito": {
      "valor": 5372.0,
      "ano": 2026,
      "fonte": "https://www.pucsp.br/graduacao/direito"
     },
     "psicologia": {
      "valor": 6151.0,
      "ano": 2026,
      "fonte": "https://www.pucsp.br/graduacao/psicologia"
     },
     "administracao": {
      "valor": 3450.0,
      "ano": 2026,
      "fonte": "https://www.pucsp.br/graduacao/administracao"
     }
    }
   },
   {
    "id": "consolacao",
    "nome": "Consolação (inclui Marquês de Paranaguá)",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "computacao",
     "eng_civil",
     "eng_producao",
     "design"
    ],
    "mensalidades": {
     "eng_civil": {
      "valor": 2950.0,
      "ano": 2026,
      "fonte": "https://www.pucsp.br/graduacao/engenharia-civil"
     }
    }
   },
   {
    "id": "sorocaba",
    "nome": "Sorocaba",
    "municipioId": "sorocaba-sp",
    "cursos": [
     "medicina",
     "enfermagem"
    ],
    "mensalidades": {
     "medicina": {
      "valor": 12749.0,
      "ano": 2026,
      "fonte": "https://www.pucsp.br/graduacao/medicina"
     },
     "enfermagem": {
      "valor": 2150.0,
      "ano": 2027,
      "fonte": "https://www.pucsp.br/graduacao/enfermagem"
     }
    }
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite",
   "integral"
  ],
  "duracoes": {
   "medicina": 72,
   "direito": 60,
   "psicologia": 60,
   "administracao": 48,
   "enfermagem": 60,
   "jornalismo": 48
  },
  "fonte": "https://www.pucsp.br/graduacao/medicina"
 },
 {
  "id": "pucrio",
  "nome": "Pontifícia Universidade Católica do Rio de Janeiro",
  "sigla": "PUC-Rio",
  "tipo": "comunitaria",
  "pais": "BR",
  "uf": "RJ",
  "ingresso": [
   "vestibular_privada",
   "enem_privada"
  ],
  "campi": [
   {
    "id": "gavea",
    "nome": "Gávea",
    "municipioId": "rio-de-janeiro-rj",
    "cursos": [
     "medicina",
     "farmacia",
     "nutricao",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "economia",
     "pedagogia",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "artes_cenicas",
     "estatistica"
    ]
   }
  ],
  "fonte": "https://www.puc-rio.br/ensinopesq/ccg/cursos.html"
 },
 {
  "id": "pucrs",
  "nome": "Pontifícia Universidade Católica do Rio Grande do Sul",
  "sigla": "PUCRS",
  "tipo": "comunitaria",
  "pais": "BR",
  "uf": "RS",
  "ingresso": [
   "vestibular_privada",
   "enem_privada"
  ],
  "campi": [
   {
    "id": "campus-central",
    "nome": "Campus Central (Av. Ipiranga)",
    "municipioId": "porto-alegre-rs",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design",
     "ed_fisica",
     "nutricao"
    ],
    "mensalidades": {
     "medicina": {
      "valor": 10878.68,
      "ano": 2026,
      "fonte": "https://portal.pucrs.br/ensino/cursos/graduacao/medicina/"
     },
     "psicologia": {
      "valor": 3910.85,
      "ano": 2026,
      "fonte": "https://portal.pucrs.br/ensino/cursos/graduacao/psicologia/"
     },
     "direito": {
      "valor": 3214.76,
      "ano": 2026,
      "fonte": "https://portal.pucrs.br/ensino/cursos/graduacao/direito/"
     },
     "odontologia": {
      "valor": 5189.46,
      "ano": 2026,
      "fonte": "https://portal.pucrs.br/ensino/cursos/graduacao/odontologia/"
     },
     "eng_civil": {
      "valor": 3306.56,
      "ano": 2026,
      "fonte": "https://portal.pucrs.br/ensino/cursos/graduacao/engenharia-civil/"
     },
     "computacao": {
      "valor": 3709.42,
      "ano": 2026,
      "fonte": "https://portal.pucrs.br/ensino/cursos/graduacao/ciencia-da-computacao/"
     }
    }
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite"
  ],
  "duracoes": {
   "medicina": 72,
   "psicologia": 60,
   "direito": 60,
   "eng_civil": 60,
   "computacao": 48,
   "odontologia": 60,
   "enfermagem": 60
  },
  "fonte": "https://portal.pucrs.br/ensino/cursos/graduacao/medicina/"
 },
 {
  "id": "pucminas",
  "nome": "Pontifícia Universidade Católica de Minas Gerais",
  "sigla": "PUC Minas",
  "tipo": "comunitaria",
  "pais": "BR",
  "uf": "MG",
  "ingresso": [
   "vestibular_privada",
   "enem_privada"
  ],
  "campi": [
   {
    "id": "coracao-eucaristico",
    "nome": "Coração Eucarístico",
    "municipioId": "belo-horizonte-mg",
    "cursos": [
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "arquitetura",
     "computacao",
     "administracao",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "ed_fisica",
     "nutricao"
    ]
   },
   {
    "id": "sao-gabriel",
    "nome": "São Gabriel",
    "municipioId": "belo-horizonte-mg",
    "cursos": [
     "eng_mecanica",
     "direito",
     "psicologia",
     "computacao"
    ]
   },
   {
    "id": "betim",
    "nome": "Betim",
    "municipioId": "betim-mg",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "veterinaria",
     "psicologia",
     "direito",
     "administracao",
     "computacao"
    ]
   },
   {
    "id": "contagem",
    "nome": "Contagem",
    "municipioId": "contagem-mg",
    "cursos": [
     "medicina",
     "administracao",
     "contabeis",
     "direito",
     "computacao"
    ]
   },
   {
    "id": "pocos-de-caldas",
    "nome": "Poços de Caldas",
    "municipioId": "pocos-de-caldas-mg",
    "cursos": [
     "medicina",
     "veterinaria",
     "odontologia",
     "enfermagem",
     "fisioterapia",
     "psicologia",
     "direito",
     "eng_civil",
     "arquitetura",
     "computacao"
    ]
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite",
   "integral"
  ],
  "fonte": "https://www.pucminas.br/sala-imprensa/noticias/Documents/Edital%20078.2025%20-%20Processo%20Seletivo%20-%2012-09-2025%20assinado.pdf"
 },
 {
  "id": "pucpr",
  "nome": "Pontifícia Universidade Católica do Paraná",
  "sigla": "PUCPR",
  "tipo": "comunitaria",
  "pais": "BR",
  "uf": "PR",
  "ingresso": [
   "vestibular_privada",
   "enem_privada"
  ],
  "campi": [
   {
    "id": "curitiba",
    "nome": "Curitiba (Prado Velho)",
    "municipioId": "curitiba-pr",
    "cursos": [
     "medicina",
     "enfermagem",
     "fisioterapia",
     "odontologia",
     "farmacia",
     "veterinaria",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "pedagogia",
     "licenciatura",
     "jornalismo",
     "publicidade",
     "design",
     "musica_grad",
     "artes_cenicas",
     "ed_fisica",
     "nutricao",
     "agronomia"
    ],
    "mensalidades": {
     "medicina": {
      "valor": 14718.13,
      "ano": 2027,
      "fonte": "https://www.pucpr.br/cursos-graduacao/medicina/"
     },
     "direito": {
      "valor": 3150.94,
      "ano": 2027,
      "fonte": "https://www.pucpr.br/cursos-graduacao/direito/"
     },
     "psicologia": {
      "valor": 3762.29,
      "ano": 2027,
      "fonte": "https://www.pucpr.br/cursos-graduacao/psicologia/"
     },
     "eng_civil": {
      "valor": 4158.81,
      "ano": 2027,
      "fonte": "https://www.pucpr.br/cursos-graduacao/engenharia-civil/"
     },
     "computacao": {
      "valor": 3539.97,
      "ano": 2027,
      "fonte": "https://www.pucpr.br/cursos-graduacao/ciencia-da-computacao/"
     },
     "veterinaria": {
      "valor": 6337.85,
      "ano": 2027,
      "fonte": "https://www.pucpr.br/cursos-graduacao/medicina-veterinaria/"
     }
    }
   },
   {
    "id": "londrina",
    "nome": "Londrina",
    "municipioId": "londrina-pr",
    "cursos": [
     "medicina",
     "direito",
     "psicologia"
    ]
   },
   {
    "id": "toledo",
    "nome": "Toledo",
    "municipioId": "toledo-pr",
    "cursos": [
     "medicina",
     "agronomia",
     "veterinaria",
     "direito"
    ]
   }
  ],
  "turnos": [
   "manha",
   "noite",
   "integral"
  ],
  "duracoes": {
   "medicina": 72,
   "direito": 60,
   "psicologia": 60,
   "eng_civil": 60,
   "odontologia": 60,
   "computacao": 48,
   "veterinaria": 60,
   "agronomia": 60,
   "enfermagem": 60,
   "fisioterapia": 48,
   "farmacia": 60,
   "arquitetura": 60,
   "administracao": 48,
   "jornalismo": 48,
   "design": 48,
   "ed_fisica": 48,
   "nutricao": 60,
   "pedagogia": 48,
   "musica_grad": 48,
   "artes_cenicas": 36
  },
  "fonte": "https://www.pucpr.br/cursos-graduacao/medicina/"
 },
 {
  "id": "fgv",
  "nome": "Fundação Getulio Vargas",
  "sigla": "FGV",
  "tipo": "privada",
  "pais": "BR",
  "uf": "RJ",
  "ingresso": [
   "vestibular_privada"
  ],
  "campi": [
   {
    "id": "sao-paulo",
    "nome": "São Paulo (EAESP, EESP, Direito SP)",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "administracao",
     "economia",
     "direito"
    ],
    "mensalidades": {
     "administracao": {
      "valor": 7850.0,
      "ano": 2026,
      "fonte": "https://vestibular.fgv.br/en/courses/sao-paulo/business-administration"
     },
     "direito": {
      "valor": 8335.7,
      "ano": 2026,
      "fonte": "https://vestibular.fgv.br/en/courses/sao-paulo/law-school"
     },
     "economia": {
      "valor": 9885.0,
      "ano": 2026,
      "fonte": "https://vestibular.fgv.br/en/courses/sao-paulo/economics"
     }
    }
   },
   {
    "id": "rio-de-janeiro",
    "nome": "Rio de Janeiro (EBAPE, EPGE, Direito Rio)",
    "municipioId": "rio-de-janeiro-rj",
    "cursos": [
     "administracao",
     "economia",
     "direito"
    ],
    "mensalidades": {
     "direito": {
      "valor": 6880.0,
      "ano": 2026,
      "fonte": "https://vestibular.fgv.br/en/courses/rio-de-janeiro/law-school"
     },
     "administracao": {
      "valor": 7834.33,
      "ano": 2026,
      "fonte": "https://vestibular.fgv.br/en/courses/rio-de-janeiro/management"
     },
     "economia": {
      "valor": 7186.0,
      "ano": 2026,
      "fonte": "https://vestibular.fgv.br/en/courses/rio-de-janeiro/economics"
     }
    }
   }
  ],
  "turnos": [
   "integral"
  ],
  "duracoes": {
   "administracao": 48,
   "direito": 60,
   "economia": 48
  },
  "fonte": "https://vestibular.fgv.br/en/courses/sao-paulo/business-administration"
 },
 {
  "id": "mackenzie",
  "nome": "Universidade Presbiteriana Mackenzie",
  "sigla": "UPM",
  "tipo": "comunitaria",
  "pais": "BR",
  "uf": "SP",
  "ingresso": [
   "vestibular_privada"
  ],
  "campi": [
   {
    "id": "higienopolis",
    "nome": "Higienópolis",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "farmacia",
     "fisioterapia",
     "nutricao",
     "psicologia",
     "direito",
     "eng_civil",
     "eng_producao",
     "eng_mecanica",
     "arquitetura",
     "computacao",
     "administracao",
     "contabeis",
     "economia",
     "pedagogia",
     "licenciatura",
     "letras",
     "jornalismo",
     "publicidade",
     "design"
    ]
   },
   {
    "id": "alphaville",
    "nome": "Alphaville",
    "municipioId": "barueri-sp",
    "cursos": [
     "administracao",
     "computacao",
     "direito"
    ]
   },
   {
    "id": "campinas",
    "nome": "Campinas",
    "municipioId": "campinas-sp",
    "cursos": [
     "administracao",
     "direito",
     "eng_civil",
     "eng_producao"
    ]
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite",
   "integral"
  ],
  "duracoes": {
   "direito": 60,
   "administracao": 48,
   "eng_civil": 60,
   "arquitetura": 60,
   "computacao": 48,
   "psicologia": 60,
   "farmacia": 48,
   "fisioterapia": 60
  },
  "fonte": "https://www.mackenzie.br/fileadmin/ARQUIVOS/Public/2-processos-seletivos/upm/VESTIBULAR_REGULAR/2026/IN_RE_046_2026_Edital_Processo_Seletivo_Notas_Internacionais_2026_2_sem_SCA_Assinada.pdf"
 },
 {
  "id": "insper",
  "nome": "Insper Instituto de Ensino e Pesquisa",
  "sigla": "Insper",
  "tipo": "privada",
  "pais": "BR",
  "uf": "SP",
  "ingresso": [
   "vestibular_privada"
  ],
  "campi": [
   {
    "id": "vila-olimpia",
    "nome": "Vila Olímpia",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "administracao",
     "economia",
     "direito",
     "computacao",
     "eng_mecanica",
     "eng_producao"
    ],
    "mensalidades": {
     "eng_producao": {
      "valor": 8300.0,
      "ano": 2026,
      "fonte": "https://www.insper.edu.br/pt/cursos/graduacao/engenharia/engenharia-de-producao",
      "fraca": true
     }
    }
   }
  ],
  "fonte": "https://www.insper.edu.br/content/dam/insper-portal/documentos/vestibular/vestibular-26-2/Edital_Vestibular_26_2_V4.pdf"
 },
 {
  "id": "espm",
  "nome": "Escola Superior de Propaganda e Marketing",
  "sigla": "ESPM",
  "tipo": "privada",
  "pais": "BR",
  "uf": "SP",
  "ingresso": [
   "vestibular_privada",
   "enem_privada"
  ],
  "campi": [
   {
    "id": "sao-paulo",
    "nome": "São Paulo (Vila Mariana)",
    "municipioId": "sao-paulo-sp",
    "cursos": [
     "administracao",
     "publicidade",
     "design",
     "direito",
     "jornalismo",
     "computacao"
    ],
    "mensalidades": {
     "administracao": {
      "valor": 8061.0,
      "ano": 2027,
      "fonte": "https://www.espm.br/cursos-de-graduacao/administracao/"
     }
    }
   },
   {
    "id": "rio-de-janeiro",
    "nome": "Rio de Janeiro",
    "municipioId": "rio-de-janeiro-rj",
    "cursos": [
     "administracao",
     "publicidade",
     "jornalismo"
    ]
   }
  ],
  "turnos": [
   "manha",
   "tarde",
   "noite",
   "integral"
  ],
  "duracoes": {
   "direito": 60,
   "jornalismo": 48,
   "design": 48
  },
  "fonte": "https://www.espm.br/wp-content/uploads/Edital-2026-1-VEST-ENEM-INT-Sao.pdf"
 }
];
