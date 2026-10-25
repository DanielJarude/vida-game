/**
 * REWORK 12.2 — O QUE É PRÓPRIO DE CADA RAMO: o cardápio e o fornecedor do restaurante, as estrelas e os serviços do
 * hotel, as especialidades da clínica, as modalidades da academia, os serviços do estúdio, o segmento da loja, os temas
 * do museu, as espécies e os recintos do zoológico.
 *
 * Não são enfeites com nomes diferentes: cada número aqui entra numa conta de `sistemas/negocios` (a procura, o tíquete,
 * o custo do insumo, a capacidade, a nota que o público dá, o bem-estar de um animal). Os valores estão na unidade do
 * motor (reais de uma capital brasileira); a cidade e o país ajustam.
 */

import type { ConceitoRestaurante, Nivel3 } from '../tipos';

/* ------------------------------------------------------------------ restaurante */

export interface Conceito {
  nome: string;
  descricao: string;
  /** O tíquete médio em relação ao do restaurante de preço médio. */
  ticket: number;
  /** A procura em relação à de um restaurante comum (o popular enche; a alta gastronomia tem poucas mesas certas). */
  procura: number;
  /** O que o público espera receber (0..100): pagar caro e receber pouco é a pior nota. */
  exige: number;
  /** Até onde o prestígio pode ir (o "por quilo" não ganha estrela de guia). */
  teto: number;
  /** A equipe (cozinha e salão) em relação à base. */
  equipe: number;
}

export const CONCEITOS: Record<ConceitoRestaurante, Conceito> = {
  popular: { nome: 'Popular', descricao: 'Prato feito, giro rápido, preço que cabe todo dia.', ticket: 0.6, procura: 1.38, exige: 36, teto: 45, equipe: 0.9 },
  familiar: { nome: 'Familiar', descricao: 'O almoço de domingo: porção generosa, mesa grande, criança junto.', ticket: 1, procura: 1, exige: 46, teto: 60, equipe: 1 },
  especializado: { nome: 'Especializado', descricao: 'Uma cozinha só, bem feita: quem procura, volta.', ticket: 1.3, procura: 0.8, exige: 56, teto: 78, equipe: 1.05 },
  alta_gastronomia: { nome: 'Alta gastronomia', descricao: 'Menu-degustação, chef com nome, crítica na porta. Poucas mesas, conta alta, margem apertada.', ticket: 2.7, procura: 0.36, exige: 74, teto: 100, equipe: 1.3 },
  luxo: { nome: 'Restaurante de luxo', descricao: 'O salão é parte do prato: serviço impecável, carta de vinhos, endereço nobre.', ticket: 3.5, procura: 0.25, exige: 82, teto: 92, equipe: 1.45 }
};

/** As cozinhas: o custo do insumo e o quanto a cidade já tem igual (a concorrência pesa na procura). */
export const CULINARIAS: { id: string; nome: string; insumo: number; concorrencia: number }[] = [
  { id: 'brasileira', nome: 'brasileira', insumo: 1, concorrencia: 1.1 },
  { id: 'italiana', nome: 'italiana', insumo: 0.95, concorrencia: 1.08 },
  { id: 'japonesa', nome: 'japonesa', insumo: 1.18, concorrencia: 1 },
  { id: 'francesa', nome: 'francesa', insumo: 1.15, concorrencia: 0.85 },
  { id: 'arabe', nome: 'árabe', insumo: 0.9, concorrencia: 0.9 },
  { id: 'mexicana', nome: 'mexicana', insumo: 0.92, concorrencia: 0.88 },
  { id: 'vegetariana', nome: 'vegetariana', insumo: 0.85, concorrencia: 0.86 },
  { id: 'frutos_do_mar', nome: 'de frutos do mar', insumo: 1.28, concorrencia: 0.92 },
  { id: 'churrascaria', nome: 'de carnes na brasa', insumo: 1.25, concorrencia: 1 },
  { id: 'contemporanea', nome: 'contemporânea', insumo: 1.1, concorrencia: 0.9 }
];
export const culinaria = (id: string) => CULINARIAS.find(c => c.id === id) ?? CULINARIAS[0];

/** O insumo: o que custa (em relação ao padrão) e o que entrega no prato. */
export const INGREDIENTES: Record<Nivel3, { nome: string; custo: number; qualidade: number }> = {
  1: { nome: 'básicos', custo: 0.88, qualidade: -14 },
  2: { nome: 'bons', custo: 1, qualidade: 0 },
  3: { nome: 'excelentes', custo: 1.12, qualidade: 14 }
};

/** De quem se compra: o preço, a regularidade (falta de insumo é cardápio pela metade) e o que acrescenta. */
export const FORNECEDORES: Record<'atacado' | 'local' | 'importador', { nome: string; descricao: string; custo: number; qualidade: number; falta: number }> = {
  atacado: { nome: 'Atacadista', descricao: 'Mais barato e em volume; às vezes falta, e o padrão varia.', custo: 0.95, qualidade: -4, falta: 0.08 },
  local: { nome: 'Produtores locais', descricao: 'Fresco, da estação, um pouco mais caro; o cardápio muda com a safra.', custo: 1.03, qualidade: 4, falta: 0.04 },
  importador: { nome: 'Importador', descricao: 'O ingrediente que não se acha aqui — caro, e no humor do câmbio.', custo: 1.12, qualidade: 6, falta: 0.05 }
};

/** Pratos que a casa pode criar (o chef dá o nome; a culinária dá o rumo). */
export const PRATOS: Record<string, string[]> = {
  brasileira: ['moqueca da casa', 'arroz de pato com tucupi', 'feijoada de domingo', 'baião de dois com queijo coalho na brasa'],
  italiana: ['risoto de cogumelos da estação', 'ravióli de abóbora com sálvia', 'ossobuco com polenta mole'],
  japonesa: ['omakase do balcão', 'robata de peixe do dia', 'lámen de caldo longo'],
  francesa: ['pato confitado', 'sopa de cebola gratinada', 'tarte tatin de banana'],
  arabe: ['cordeiro de forno lento', 'quibe cru da avó', 'arroz com lentilha e cebola caramelizada'],
  mexicana: ['tacos de carne de panela', 'mole de chocolate amargo', 'ceviche de manga'],
  vegetariana: ['bolinho de jaca', 'nhoque de mandioquinha', 'lasanha de berinjela defumada'],
  frutos_do_mar: ['polvo na brasa com batata ao murro', 'arroz de lagosta', 'peixe inteiro no sal grosso'],
  churrascaria: ['costela de doze horas', 'picanha maturada da casa', 'cupim no bafo'],
  contemporanea: ['tartar de beterraba com raiz-forte', 'peixe curado com cítricos', 'cordeiro em três texturas']
};

/* ------------------------------------------------------------------------ hotel */

export const ESTRELAS: Record<2 | 3 | 4 | 5, { diaria: number; exige: number; procura: number; equipe: number; obra: number }> = {
  2: { diaria: 0.5, exige: 38, procura: 1.3, equipe: 0.7, obra: 0.6 },
  3: { diaria: 1, exige: 54, procura: 1, equipe: 1, obra: 1 },
  4: { diaria: 1.75, exige: 68, procura: 0.72, equipe: 1.3, obra: 1.45 },
  5: { diaria: 3.3, exige: 82, procura: 0.4, equipe: 1.75, obra: 2.2 }
};

export type PublicoHotel = 'negocios' | 'lazer' | 'familias' | 'luxo' | 'eventos';
export const PUBLICOS_HOTEL: Record<PublicoHotel, { nome: string; descricao: string; sazonal: number; turismo: number }> = {
  negocios: { nome: 'Viagem de negócios', descricao: 'Segunda a quinta cheio, fim de semana vazio; pede café cedo, sala e translado.', sazonal: 0.12, turismo: 0.3 },
  lazer: { nome: 'Turismo de lazer', descricao: 'Feriado lotado, março vazio; pede piscina, restaurante, lugar para ver.', sazonal: 0.38, turismo: 1 },
  familias: { nome: 'Famílias', descricao: 'Férias escolares, quarto grande, recreação para as crianças.', sazonal: 0.32, turismo: 0.9 },
  luxo: { nome: 'Alto luxo', descricao: 'Pouca gente, muito exigente: spa, concierge, restaurante com nome.', sazonal: 0.22, turismo: 0.8 },
  eventos: { nome: 'Eventos e congressos', descricao: 'Casamentos, convenções: salões ocupados, quartos em bloco.', sazonal: 0.18, turismo: 0.5 }
};

export interface ServicoHotel { id: string; nome: string; capital: number; anual: number; atrai: Partial<Record<PublicoHotel, number>>; /** O quanto a diária sobe com ele. */ ticket: number; minEstrelas?: number }
/** Os serviços: o que custa montar, o que custa manter (por unidade, por ano) e quanto atrai cada público. */
export const SERVICOS_HOTEL: ServicoHotel[] = [
  { id: 'cafe', nome: 'Café da manhã incluído', capital: 60000, anual: 260000, ticket: 0.05, atrai: { negocios: 0.08, lazer: 0.06, familias: 0.08, eventos: 0.04 } },
  { id: 'restaurante', nome: 'Restaurante próprio', capital: 450000, anual: 380000, ticket: 0.04, atrai: { lazer: 0.06, luxo: 0.1, eventos: 0.06 } },
  { id: 'piscina', nome: 'Piscina', capital: 600000, anual: 120000, ticket: 0.03, atrai: { lazer: 0.07, familias: 0.1, luxo: 0.04 } },
  { id: 'spa', nome: 'Spa', capital: 900000, anual: 300000, ticket: 0.06, atrai: { luxo: 0.14, lazer: 0.05 }, minEstrelas: 4 },
  { id: 'eventos', nome: 'Salões de eventos', capital: 800000, anual: 200000, ticket: 0, atrai: { eventos: 0.2, negocios: 0.06 } },
  { id: 'translado', nome: 'Translado do aeroporto', capital: 180000, anual: 140000, ticket: 0.02, atrai: { negocios: 0.07, luxo: 0.05 } },
  { id: 'recreacao', nome: 'Recreação infantil', capital: 150000, anual: 160000, ticket: 0.02, atrai: { familias: 0.14 } },
  { id: 'concierge', nome: 'Concierge e mordomia', capital: 50000, anual: 240000, ticket: 0.05, atrai: { luxo: 0.12 }, minEstrelas: 4 }
];
export const servicoHotel = (id: string) => SERVICOS_HOTEL.find(s => s.id === id);

/* ---------------------------------------------------------------------- clínica */

export interface Especialidade { id: string; nome: string; equipamento: number; profissional: number; procura: number; ticket: number; particular?: boolean }
/** Cada especialidade pede o seu equipamento (uma vez) e o seu profissional (todo mês) — e traz o seu público. */
export const ESPECIALIDADES: Especialidade[] = [
  { id: 'clinica_geral', nome: 'Clínica geral', equipamento: 0, profissional: 0, procura: 1, ticket: 1 },
  { id: 'pediatria', nome: 'Pediatria', equipamento: 60000, profissional: 22000, procura: 0.32, ticket: 0.85 },
  { id: 'cardiologia', nome: 'Cardiologia', equipamento: 380000, profissional: 36000, procura: 0.24, ticket: 1.4 },
  { id: 'ortopedia', nome: 'Ortopedia', equipamento: 280000, profissional: 28000, procura: 0.26, ticket: 1.2 },
  { id: 'dermatologia', nome: 'Dermatologia', equipamento: 160000, profissional: 26000, procura: 0.22, ticket: 1.35, particular: true },
  { id: 'imagem', nome: 'Diagnóstico por imagem', equipamento: 1400000, profissional: 34000, procura: 0.4, ticket: 1.7 },
  { id: 'odontologia', nome: 'Odontologia', equipamento: 240000, profissional: 18000, procura: 0.3, ticket: 1, particular: true },
  { id: 'fisioterapia', nome: 'Fisioterapia', equipamento: 120000, profissional: 12000, procura: 0.34, ticket: 0.55 }
];
export const especialidade = (id: string) => ESPECIALIDADES.find(x => x.id === id);

/* ---------------------------------------------------------------------- academia */

export interface Modalidade { id: string; nome: string; capital: number; anual: number; procura: number; ticket: number; evasao: number }
/** A modalidade traz gente (e um jeito de ficar): a natação pede piscina; o pilates cobra mais; o funcional prende. */
export const MODALIDADES: Modalidade[] = [
  { id: 'musculacao', nome: 'Musculação', capital: 0, anual: 0, procura: 1, ticket: 0, evasao: 0 },
  { id: 'funcional', nome: 'Treino funcional', capital: 60000, anual: 70000, procura: 0.12, ticket: 0.03, evasao: -0.02 },
  { id: 'natacao', nome: 'Natação', capital: 950000, anual: 260000, procura: 0.3, ticket: 0.12, evasao: -0.03 },
  { id: 'lutas', nome: 'Lutas', capital: 45000, anual: 60000, procura: 0.1, ticket: 0, evasao: -0.02 },
  { id: 'danca', nome: 'Dança', capital: 35000, anual: 55000, procura: 0.1, ticket: 0, evasao: -0.01 },
  { id: 'pilates', nome: 'Pilates', capital: 130000, anual: 90000, procura: 0.08, ticket: 0.1, evasao: -0.03 },
  { id: 'crossfit', nome: 'Cross training', capital: 95000, anual: 80000, procura: 0.11, ticket: 0.05, evasao: -0.04 },
  { id: 'spinning', nome: 'Ciclismo indoor', capital: 75000, anual: 50000, procura: 0.08, ticket: 0, evasao: -0.01 }
];
export const modalidade = (id: string) => MODALIDADES.find(x => x.id === id);

/** O que segura o aluno: custa por ano (por unidade) e tira da evasão. */
export const RETENCAO: { id: string; nome: string; anual: number; evasao: number }[] = [
  { id: 'acompanhamento', nome: 'Acompanhamento individual', anual: 90000, evasao: -0.05 },
  { id: 'aplicativo', nome: 'Aplicativo com treinos e metas', anual: 35000, evasao: -0.025 },
  { id: 'eventos', nome: 'Desafios e eventos da turma', anual: 30000, evasao: -0.025 }
];

/* ----------------------------------------------------------------------- estúdio */

export interface ServicoEstudio { id: string; nome: string; capital: number; procura: number; ticket: number; exige?: number }
export const SERVICOS_ESTUDIO: ServicoEstudio[] = [
  { id: 'gravacao', nome: 'Gravação', capital: 0, procura: 1, ticket: 0 },
  { id: 'mixagem', nome: 'Mixagem', capital: 40000, procura: 0.2, ticket: 0.25 },
  { id: 'masterizacao', nome: 'Masterização', capital: 90000, procura: 0.12, ticket: 0.2, exige: 55 },
  { id: 'ensaio', nome: 'Sala de ensaio', capital: 30000, procura: 0.45, ticket: -0.3 },
  { id: 'podcast', nome: 'Podcast e voz', capital: 35000, procura: 0.3, ticket: -0.1 },
  { id: 'trilhas', nome: 'Trilhas para publicidade', capital: 60000, procura: 0.14, ticket: 0.5, exige: 62 }
];
export const servicoEstudio = (id: string) => SERVICOS_ESTUDIO.find(x => x.id === id);

/* -------------------------------------------------------------------------- loja */

export interface SegmentoLoja { id: string; nome: string; variavel: number; ticket: number; procura: number; ciclo: number; perecivel?: boolean; obsoleto?: boolean }
/** O segmento muda a margem (a eletrônica deixa pouco por venda), o tíquete e o risco do estoque parado. */
export const SEGMENTOS_LOJA: SegmentoLoja[] = [
  { id: 'moda', nome: 'Moda e acessórios', variavel: 0.64, ticket: 1, procura: 1, ciclo: 1.2 },
  { id: 'eletronicos', nome: 'Eletrônicos', variavel: 0.75, ticket: 2.6, procura: 0.9, ciclo: 1.2, obsoleto: true },
  { id: 'casa', nome: 'Casa e decoração', variavel: 0.68, ticket: 1.4, procura: 0.9, ciclo: 1.1 },
  { id: 'emporio', nome: 'Empório e alimentos finos', variavel: 0.7, ticket: 0.6, procura: 2.4, ciclo: 0.6, perecivel: true },
  { id: 'esportes', nome: 'Artigos esportivos', variavel: 0.67, ticket: 1.2, procura: 1, ciclo: 1 },
  { id: 'livros', nome: 'Livros e papelaria', variavel: 0.67, ticket: 0.5, procura: 2.4, ciclo: 0.7 },
  { id: 'beleza', nome: 'Beleza e perfumaria', variavel: 0.64, ticket: 0.7, procura: 1.4, ciclo: 0.9 }
];
export const segmentoLoja = (id: string) => SEGMENTOS_LOJA.find(x => x.id === id) ?? SEGMENTOS_LOJA[0];

/* ------------------------------------------------------------------------ museu */

export const TEMAS_MUSEU: { id: string; nome: string; periodos: string[]; obras: string[] }[] = [
  { id: 'arte_moderna', nome: 'Arte moderna', periodos: ['anos 1920', 'anos 1930', 'anos 1950', 'anos 1960'], obras: ['retrato de mulher em azul', 'paisagem com fábricas', 'composição geométrica', 'natureza-morta com frutas tropicais', 'autorretrato de ateliê'] },
  { id: 'arte_antiga', nome: 'Arte antiga e barroca', periodos: ['século XVII', 'século XVIII', 'início do século XIX'], obras: ['anjo de madeira policromada', 'retábulo de altar lateral', 'retrato de um comerciante', 'oratório de viagem', 'paisagem com ruínas'] },
  { id: 'arqueologia', nome: 'Arqueologia', periodos: ['período pré-colonial', 'cerca de 1000 d.C.', 'cerca de 500 a.C.'], obras: ['urna funerária de cerâmica', 'conjunto de pontas de flecha', 'vaso cerimonial pintado', 'adorno de concha', 'machado polido'] },
  { id: 'historia', nome: 'História da cidade', periodos: ['século XIX', 'início do século XX', 'anos 1940'], obras: ['planta original do porto', 'uniforme da guarda municipal', 'primeira máquina impressora do jornal', 'mobiliário da antiga câmara', 'carta de fundação de uma vila'] },
  { id: 'ciencia', nome: 'Ciência e natureza', periodos: ['século XIX', 'início do século XX'], obras: ['esqueleto de preguiça-gigante', 'coleção de meteoritos', 'herbário de uma expedição', 'telescópio de latão', 'gabinete de minerais'] },
  { id: 'fotografia', nome: 'Fotografia', periodos: ['anos 1900', 'anos 1950', 'anos 1970'], obras: ['série de retratos de estúdio', 'reportagem da grande enchente', 'negativos de vidro da cidade', 'ensaio sobre o carnaval', 'álbum de uma família imigrante'] }
];
export const temaMuseu = (id: string) => TEMAS_MUSEU.find(x => x.id === id) ?? TEMAS_MUSEU[0];

export const LINHAS_MUSEU: Record<'cultural' | 'equilibrada' | 'comercial', { nome: string; descricao: string; ticket: number; procura: number; apoio: number; reputacao: number }> = {
  cultural: { nome: 'Prestígio cultural', descricao: 'Pesquisa, conservação, curadoria séria: ingresso barato, apoio de quem respeita — e pouco caixa.', ticket: 0.7, procura: 0.95, apoio: 1.3, reputacao: 6 },
  equilibrada: { nome: 'Equilíbrio', descricao: 'Exposições sérias e uma loja; o patrocínio e o ingresso dividindo a conta.', ticket: 1, procura: 1, apoio: 1, reputacao: 0 },
  comercial: { nome: 'Rentabilidade', descricao: 'Exposições de apelo, aluguel do salão, loja grande: mais ingresso e menos respeito dos pares.', ticket: 1.3, procura: 1.15, apoio: 0.6, reputacao: -8 }
};

export const PATROCINADORES = ['um banco de investimentos', 'uma mineradora', 'uma fundação familiar', 'uma montadora', 'uma rede de farmácias', 'uma seguradora', 'uma empresa de energia'];
export const MUSEUS_DE_FORA = ['um museu de Lisboa', 'um museu de Madri', 'uma fundação de Buenos Aires', 'um museu de Nova York', 'uma pinacoteca de Roma', 'um museu de Tóquio', 'uma bienal itinerante'];

/* --------------------------------------------------------------------- zoológico */

export interface Habitat { id: string; nome: string; /** O que custa construir uma vaga (o espaço de um animal médio). */ vaga: number; /** Manutenção por vaga, por ano. */ manutencao: number }
export const HABITATS: Habitat[] = [
  { id: 'savana', nome: 'Savana', vaga: 140000, manutencao: 9000 },
  { id: 'floresta', nome: 'Floresta tropical', vaga: 150000, manutencao: 10000 },
  { id: 'campo', nome: 'Campo e cerrado', vaga: 90000, manutencao: 6000 },
  { id: 'aquatico', nome: 'Lagos e rios', vaga: 170000, manutencao: 12000 },
  { id: 'aviario', nome: 'Viveiro de aves', vaga: 60000, manutencao: 4000 },
  { id: 'polar', nome: 'Recinto polar (refrigerado)', vaga: 420000, manutencao: 45000 },
  { id: 'reptilario', nome: 'Reptilário', vaga: 80000, manutencao: 7000 }
];
export const habitat = (id: string) => HABITATS.find(x => x.id === id) ?? HABITATS[0];

export interface EspecieDeZoo {
  id: string;
  nome: string;
  habitat: string;
  /** Quantas vagas um indivíduo ocupa. */
  vagas: number;
  /** Vive em grupo: abaixo disso, sofre (e a instituição não recebe um só). */
  grupo: number;
  /** Alimentação, enriquecimento e cuidados por indivíduo, por ano. */
  custo: number;
  /** O quanto atrai visitantes (0..10). */
  atracao: number;
  vida: number;
  /** Ameaçada: só chega por programa de conservação (ou resgate). */
  ameacada?: boolean;
  /** Precisa de veterinário especializado. */
  especialista?: boolean;
  /** Perigo para tratadores e visitantes (0..3): o acidente pesa. */
  perigo: number;
  /** O que a transferência custa (transporte, quarentena, papéis). */
  transferencia: number;
  nomes: string[];
}

export const ESPECIES_ZOO: EspecieDeZoo[] = [
  { id: 'leao', nome: 'leão', habitat: 'savana', vagas: 3, grupo: 2, custo: 60000, atracao: 9, vida: 18, perigo: 3, transferencia: 90000, nomes: ['Simba', 'Nala', 'Kito', 'Zuri', 'Tafari', 'Amara'] },
  { id: 'girafa', nome: 'girafa', habitat: 'savana', vagas: 4, grupo: 2, custo: 48000, atracao: 8, vida: 25, perigo: 1, transferencia: 140000, nomes: ['Gigi', 'Kibo', 'Twiga', 'Malaika', 'Jabari'] },
  { id: 'zebra', nome: 'zebra', habitat: 'savana', vagas: 2, grupo: 3, custo: 15000, atracao: 4, vida: 25, perigo: 1, transferencia: 40000, nomes: ['Listrada', 'Marley', 'Duma', 'Pundamilia', 'Zola'] },
  { id: 'elefante', nome: 'elefante', habitat: 'savana', vagas: 9, grupo: 2, custo: 230000, atracao: 10, vida: 60, ameacada: true, especialista: true, perigo: 3, transferencia: 380000, nomes: ['Tembo', 'Kala', 'Shanti', 'Bambi', 'Ramba'] },
  { id: 'suricato', nome: 'suricato', habitat: 'savana', vagas: 1, grupo: 5, custo: 3000, atracao: 6, vida: 12, perigo: 0, transferencia: 6000, nomes: ['Timão', 'Sentinela', 'Pipoca', 'Sol', 'Areia', 'Duna', 'Vigia'] },
  { id: 'onca', nome: 'onça-pintada', habitat: 'floresta', vagas: 3, grupo: 1, custo: 55000, atracao: 9, vida: 20, ameacada: true, perigo: 3, transferencia: 80000, nomes: ['Juma', 'Iara', 'Tupã', 'Jaci', 'Guaraci'] },
  { id: 'chimpanze', nome: 'chimpanzé', habitat: 'floresta', vagas: 2, grupo: 4, custo: 45000, atracao: 8, vida: 45, ameacada: true, especialista: true, perigo: 2, transferencia: 70000, nomes: ['Cecília', 'Nico', 'Bóris', 'Lili', 'Tobias', 'Sara'] },
  { id: 'lemure', nome: 'lêmure', habitat: 'floresta', vagas: 1, grupo: 4, custo: 8000, atracao: 7, vida: 20, ameacada: true, perigo: 0, transferencia: 15000, nomes: ['Rei', 'Mort', 'Kira', 'Tana', 'Vavy'] },
  { id: 'panda_vermelho', nome: 'panda-vermelho', habitat: 'floresta', vagas: 2, grupo: 2, custo: 28000, atracao: 8, vida: 14, ameacada: true, especialista: true, perigo: 0, transferencia: 60000, nomes: ['Ruivo', 'Momo', 'Tenzin', 'Mei'] },
  { id: 'tamandua', nome: 'tamanduá-bandeira', habitat: 'campo', vagas: 2, grupo: 1, custo: 12000, atracao: 5, vida: 15, ameacada: true, perigo: 1, transferencia: 15000, nomes: ['Bandeira', 'Formiga', 'Cerrado', 'Tuim'] },
  { id: 'lobo_guara', nome: 'lobo-guará', habitat: 'campo', vagas: 2, grupo: 1, custo: 14000, atracao: 6, vida: 15, ameacada: true, perigo: 1, transferencia: 15000, nomes: ['Guará', 'Ruiva', 'Lobeira', 'Ipê'] },
  { id: 'capivara', nome: 'capivara', habitat: 'campo', vagas: 1, grupo: 3, custo: 4000, atracao: 3, vida: 10, perigo: 0, transferencia: 3000, nomes: ['Filó', 'Tonha', 'Bento', 'Capi', 'Lagoa'] },
  { id: 'ariranha', nome: 'ariranha', habitat: 'aquatico', vagas: 2, grupo: 3, custo: 30000, atracao: 7, vida: 12, ameacada: true, especialista: true, perigo: 1, transferencia: 45000, nomes: ['Lontra', 'Rio', 'Correnteza', 'Jacira'] },
  { id: 'hipopotamo', nome: 'hipopótamo', habitat: 'aquatico', vagas: 6, grupo: 2, custo: 95000, atracao: 8, vida: 40, perigo: 2, transferencia: 160000, nomes: ['Gordo', 'Kiboko', 'Nilo', 'Hipo'] },
  { id: 'pinguim', nome: 'pinguim', habitat: 'polar', vagas: 1, grupo: 6, custo: 12000, atracao: 7, vida: 20, especialista: true, perigo: 0, transferencia: 25000, nomes: ['Fraque', 'Gelo', 'Pingo', 'Patagônia', 'Neve', 'Iceberg', 'Antártida'] },
  { id: 'urso_polar', nome: 'urso-polar', habitat: 'polar', vagas: 8, grupo: 1, custo: 260000, atracao: 10, vida: 25, ameacada: true, especialista: true, perigo: 3, transferencia: 420000, nomes: ['Nanuk', 'Aurora', 'Tundra'] },
  { id: 'arara_azul', nome: 'arara-azul', habitat: 'aviario', vagas: 1, grupo: 2, custo: 5000, atracao: 6, vida: 50, ameacada: true, perigo: 0, transferencia: 8000, nomes: ['Blu', 'Jade', 'Anil', 'Celeste'] },
  { id: 'flamingo', nome: 'flamingo', habitat: 'aviario', vagas: 1, grupo: 6, custo: 3000, atracao: 5, vida: 30, perigo: 0, transferencia: 4000, nomes: ['Rosa', 'Coral', 'Salmão', 'Pernalta', 'Aurora', 'Lago'] },
  { id: 'tucano', nome: 'tucano', habitat: 'aviario', vagas: 1, grupo: 2, custo: 4000, atracao: 5, vida: 20, perigo: 0, transferencia: 5000, nomes: ['Bico', 'Tuca', 'Laranja', 'Toco'] },
  { id: 'jacare', nome: 'jacaré-de-papo-amarelo', habitat: 'reptilario', vagas: 2, grupo: 2, custo: 6000, atracao: 4, vida: 50, perigo: 2, transferencia: 6000, nomes: ['Papo', 'Lamaçal', 'Brejo', 'Dentinho'] },
  { id: 'sucuri', nome: 'sucuri', habitat: 'reptilario', vagas: 2, grupo: 1, custo: 5000, atracao: 6, vida: 25, perigo: 2, transferencia: 6000, nomes: ['Boiúna', 'Anaconda', 'Cobra-Grande'] },
  // REWORK 12.2: espécies que também se têm em casa (o animal que era de alguém pode ir para o zoológico).
  { id: 'arara_caninde', nome: 'arara-canindé', habitat: 'aviario', vagas: 1, grupo: 2, custo: 4500, atracao: 6, vida: 50, perigo: 0, transferencia: 6000, nomes: ['Azulão', 'Ipê', 'Jandaia', 'Céu'] },
  { id: 'papagaio', nome: 'papagaio-verdadeiro', habitat: 'aviario', vagas: 1, grupo: 2, custo: 2500, atracao: 4, vida: 50, perigo: 0, transferencia: 3000, nomes: ['Louro', 'Lora', 'Zeca', 'Cida'] },
  { id: 'jabuti', nome: 'jabuti', habitat: 'reptilario', vagas: 1, grupo: 2, custo: 1500, atracao: 3, vida: 70, perigo: 0, transferencia: 1500, nomes: ['Tonico', 'Dona Lenta', 'Jorge', 'Rosa'] },
  { id: 'piton_real', nome: 'píton-real', habitat: 'reptilario', vagas: 1, grupo: 1, custo: 2000, atracao: 4, vida: 30, perigo: 1, transferencia: 2000, nomes: ['Kaa', 'Novelo', 'Medusa'] },
  { id: 'tartaruga_gigante', nome: 'tartaruga-gigante', habitat: 'reptilario', vagas: 3, grupo: 2, custo: 9000, atracao: 6, vida: 100, ameacada: true, perigo: 0, transferencia: 30000, nomes: ['Matusalém', 'Dona Lenta', 'Galápagos', 'Centenário'] }
];
export const especieDeZoo = (id: string) => ESPECIES_ZOO.find(x => x.id === id);

/** O acervo inicial de um zoológico novo (o que vem das instituições parceiras na abertura): espécies e quantos. */
export const ACERVO_INICIAL_ZOO: [string, number][] = [
  ['zebra', 3], ['girafa', 2], ['suricato', 6], ['lemure', 4], ['capivara', 4], ['tamandua', 1], ['lobo_guara', 1], ['flamingo', 6], ['tucano', 2], ['arara_azul', 2], ['jacare', 2], ['sucuri', 1], ['hipopotamo', 2], ['onca', 1]
];
export const RECINTOS_INICIAIS_ZOO: [string, number][] = [['savana', 26], ['floresta', 10], ['campo', 11], ['aquatico', 15], ['aviario', 14], ['reptilario', 8]];
