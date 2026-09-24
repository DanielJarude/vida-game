/**
 * Famílias de carreira: a IDENTIDADE de um caminho, além do nome e do salário.
 *
 * Duzentas ocupações não são duzentas maneiras de viver. O que faz um ofício
 * parecer um ofício e uma carreira militar parecer uma carreira militar é o
 * que se compartilha por FAMÍLIA:
 *
 *   - como se entra (entrevista, concurso, prova, peneira, audição, clientes,
 *     aprendizagem, terra, convite);
 *   - como se cresce (escada de empresa, mão que melhora e freguesia que
 *     cresce, antiguidade e cursos, titulação, reconhecimento que vem e vai);
 *   - como a renda se comporta (estável, variável, sazonal, por projeto);
 *   - o que desgasta (corpo, cabeça, noite, estrada) — e o que dá SENTIDO;
 *   - o que custa trabalhar (ferramenta, conselho, veículo);
 *   - o quanto a época mexe nela (automação, ondas de atualização, expansão);
 *   - para onde se sai (transições naturais quando o caminho acaba).
 *
 * É daqui que o motor tira o peso contextual do trabalho na cabeça, o custo
 * profissional no orçamento, as palavras da estrada na tela, as ondas de
 * transformação e as saídas de uma segunda carreira. A classificação interna
 * da auditoria (A..E) fica no relatório; o jogador nunca vê letra nenhuma.
 */

import type { Dominio } from '../tipos';

export type ModeloProgressao =
  | 'empresa'      // entrada → experiência → especialização/liderança
  | 'oficio'       // aprendiz → profissional → experiente → por conta / pequena empresa
  | 'clientela'    // primeiros clientes → carteira → reputação
  | 'publica'      // concurso → estágio probatório → progressão por tempo, função, remoção
  | 'seguranca'    // concurso → academia/curso → antiguidade → risco e desgaste
  | 'militar'      // formação → antiguidade e cursos → transferências → reserva
  | 'docente'      // formação → sala de aula → titulação e tempo (não "gerente")
  | 'academica'    // graduação → pós com bolsa → pesquisa instável → concurso docente
  | 'liberal'      // formação → registro → emprego ↔ autônomo ↔ escritório
  | 'saude'        // formação → registro → plantões → especialização ou consultório
  | 'arte'         // prática → pequenos trabalhos → reconhecimento que vem e vai
  | 'esporte'      // base → profissional → auge curto → transição
  | 'plataforma'   // sem chefe e sem piso: horas, veículo e o algoritmo
  | 'informal'     // bons e maus meses → ponto, freguesia → formalizar
  | 'rural'        // terra → safra → cooperativa → patrimônio
  | 'cuidado';     // confiança de famílias → indicação → estabilidade modesta

export interface FamiliaCarreira {
  id: string;
  nome: string;
  trilhas: string[];
  progressao: ModeloProgressao;
  /** Como se costuma entrar (palavras para a tela e para o relatório). */
  entrada: string;
  /** Os degraus em palavras (sem júnior/pleno/sênior quando não é assim que se cresce). */
  degraus: string[];
  renda: 'estavel' | 'variavel' | 'sazonal' | 'projeto';
  /** O que desgasta (0..1 cada): corpo, cabeça (gente, metas, responsabilidade), noite e fim de semana, longe de casa. */
  desgaste: { corpo?: number; cabeca?: number; noite?: number; longe?: number };
  /** Frentes que dão SENTIDO ao trabalho para quem gosta delas (o trabalho alimenta, não só cobra). */
  sentido?: Dominio[];
  /** Custo de trabalhar, por mês, para quem trabalha por conta (ferramenta, material, conselho, manutenção). */
  custoAutonomo?: { valor: number; rotulo: string };
  /** Anuidade de conselho ou registro, para qualquer vínculo. */
  anuidade?: number;
  /** Exposição à automação: começa a pesar em `desde`, chega ao máximo em `ate`. */
  automacao?: { desde: number; ate: number; intensidade: number };
  /** Cresce com a época (envelhecimento, energia, cuidado). */
  expansao?: { desde: number; intensidade: number };
  /** Trilhas para onde é natural ir quando este caminho acaba (segunda carreira). */
  saidas: string[];
}

const F = (x: FamiliaCarreira) => x;

export const FAMILIAS: readonly FamiliaCarreira[] = [
  F({ id: 'varejo', nome: 'comércio e vendas', trilhas: ['comercio', 'vendas', 'posto'], progressao: 'empresa', entrada: 'entrevista, indicação ou temporário de fim de ano',
    degraus: ['balcão', 'vendas', 'supervisão', 'gerência'], renda: 'estavel', desgaste: { cabeca: 0.35, noite: 0.2 }, sentido: ['vendas'],
    automacao: { desde: 2035, ate: 2070, intensidade: 0.35 }, saidas: ['administrativo', 'logistica', 'informal', 'vendas'] }),
  F({ id: 'escritorio', nome: 'escritório e finanças', trilhas: ['administrativo', 'contabil', 'financas', 'atendimento'], progressao: 'empresa', entrada: 'entrevista, estágio ou aprendizagem',
    degraus: ['entrada', 'assistência', 'análise', 'coordenação', 'gerência'], renda: 'estavel', desgaste: { cabeca: 0.35 }, sentido: ['exatas'],
    automacao: { desde: 2032, ate: 2065, intensidade: 0.45 }, saidas: ['publico', 'logistica', 'comercio', 'educacao'] }),
  F({ id: 'transporte', nome: 'transporte e logística', trilhas: ['logistica', 'estrada', 'transporte'], progressao: 'plataforma', entrada: 'carteira de motorista, veículo e, às vezes, só um aplicativo',
    degraus: ['entregas', 'rota fixa', 'estrada', 'coordenação'], renda: 'variavel', desgaste: { corpo: 0.4, longe: 0.4, cabeca: 0.3 },
    custoAutonomo: { valor: 420, rotulo: 'Combustível e desgaste do veículo de trabalho' }, automacao: { desde: 2058, ate: 2090, intensidade: 0.5 }, saidas: ['logistica', 'comercio', 'vigilancia'] }),
  F({ id: 'cozinha', nome: 'cozinha', trilhas: ['alimentacao', 'confeitaria'], progressao: 'oficio', entrada: 'começar ajudando, curso de cozinha ou encomendas para conhecidos',
    degraus: ['ajudante', 'cozinheiro de linha', 'chefia de cozinha', 'o próprio negócio'], renda: 'estavel', desgaste: { corpo: 0.45, noite: 0.4 }, sentido: ['cozinha'],
    custoAutonomo: { valor: 180, rotulo: 'Ingredientes e gás das encomendas' }, saidas: ['comercio', 'educacao'] }),
  F({ id: 'beleza', nome: 'beleza', trilhas: ['beleza'], progressao: 'clientela', entrada: 'curso curto ou mão boa, e os primeiros clientes',
    degraus: ['cadeira alugada', 'clientela fiel', 'o próprio salão'], renda: 'variavel', desgaste: { corpo: 0.3 }, sentido: ['beleza'],
    custoAutonomo: { valor: 220, rotulo: 'Material e cadeira no salão' }, saidas: ['comercio', 'educacao'] }),
  F({ id: 'oficio', nome: 'ofícios de obra e conserto', trilhas: ['construcao', 'manutencao', 'eletrica', 'mecanica', 'hidraulica', 'marcenaria', 'reparos', 'costura', 'artesanato'], progressao: 'oficio',
    entrada: 'aprender olhando, curso de qualificação, ajudante de alguém que sabe', degraus: ['ajudante', 'profissional', 'mão de confiança', 'por conta, com equipe'],
    renda: 'variavel', desgaste: { corpo: 0.5 }, sentido: ['manual'], custoAutonomo: { valor: 160, rotulo: 'Ferramentas e material de trabalho' }, saidas: ['ensino_tecnico', 'predial', 'tecnico_industrial', 'comercio'] }),
  F({ id: 'industria', nome: 'indústria', trilhas: ['industria', 'tecnico_industrial', 'seguranca_trabalho', 'eng_industrial'], progressao: 'empresa', entrada: 'técnico, fábrica da região, indicação',
    degraus: ['linha', 'operação', 'técnica', 'supervisão', 'gerência'], renda: 'estavel', desgaste: { corpo: 0.35, noite: 0.3 }, sentido: ['manual', 'exatas'],
    automacao: { desde: 2030, ate: 2065, intensidade: 0.5 }, saidas: ['manutencao', 'eletrica', 'mecanica', 'ensino_tecnico'] }),
  F({ id: 'tecnologia', nome: 'tecnologia', trilhas: ['ti', 'dados'], progressao: 'empresa', entrada: 'portfólio, curso técnico ou faculdade — o código conta mais que o diploma',
    degraus: ['suporte ou estágio', 'primeiros projetos', 'autonomia técnica', 'referência técnica', 'liderança técnica'], renda: 'estavel', desgaste: { cabeca: 0.4 }, sentido: ['programacao', 'exatas'],
    automacao: { desde: 2036, ate: 2080, intensidade: 0.25 }, saidas: ['educacao', 'dados', 'financas'] }),
  F({ id: 'saude', nome: 'saúde', trilhas: ['enfermagem', 'medicina', 'radiologia', 'psicologia', 'nutricao', 'fisioterapia', 'odontologia', 'farmacia', 'saude_publica', 'veterinaria'], progressao: 'saude',
    entrada: 'formação longa, estágio obrigatório e registro no conselho', degraus: ['formação e estágio', 'registro', 'plantões ou atendimento', 'especialização ou consultório próprio'],
    renda: 'estavel', desgaste: { cabeca: 0.5, noite: 0.45 }, sentido: ['ciencias', 'comunidade'], anuidade: 70, custoAutonomo: { valor: 380, rotulo: 'Sala, material e conselho do consultório' },
    expansao: { desde: 2035, intensidade: 0.2 }, saidas: ['educacao', 'publico', 'cuidado'] }),
  F({ id: 'cuidado', nome: 'cuidado e trabalho doméstico', trilhas: ['cuidado', 'domestico', 'limpeza'], progressao: 'cuidado', entrada: 'indicação de família para família, confiança',
    degraus: ['primeiras casas', 'famílias que indicam', 'carteira assinada ou agenda cheia'], renda: 'estavel', desgaste: { corpo: 0.45, cabeca: 0.35 }, sentido: ['comunidade'],
    expansao: { desde: 2034, intensidade: 0.3 }, saidas: ['enfermagem', 'alimentacao', 'predial'] }),
  F({ id: 'predial', nome: 'portaria, zeladoria e vigilância', trilhas: ['predial', 'vigilancia'], progressao: 'empresa', entrada: 'curso de vigilante, indicação, currículo',
    degraus: ['posto', 'turno fixo', 'supervisão'], renda: 'estavel', desgaste: { noite: 0.5 }, automacao: { desde: 2045, ate: 2075, intensidade: 0.3 }, saidas: ['limpeza', 'manutencao', 'guarda'] }),
  F({ id: 'docencia', nome: 'ensino', trilhas: ['educacao', 'idiomas', 'ensino_tecnico', 'ensino_musica', 'ensino_danca'], progressao: 'docente',
    entrada: 'licenciatura, concurso ou processo seletivo; no ensino livre, saber e ter alunos', degraus: ['primeiras turmas', 'sala de aula por anos', 'titulação (pós, mestrado)', 'coordenação ou direção, se quiser'],
    renda: 'estavel', desgaste: { cabeca: 0.45 }, sentido: ['lideranca', 'comunidade', 'linguagens'], expansao: { desde: 2030, intensidade: 0.05 }, saidas: ['publico', 'academia', 'comunicacao'] }),
  F({ id: 'academia', nome: 'ciência e universidade', trilhas: ['academia', 'pesquisa'], progressao: 'academica', entrada: 'iniciação, mestrado e doutorado com bolsa, concurso docente',
    degraus: ['iniciação científica', 'pós-graduação com bolsa', 'pós-doutorado (contrato com prazo)', 'concurso: docência ou instituto'], renda: 'projeto', desgaste: { cabeca: 0.4 }, sentido: ['ciencias', 'exatas', 'humanas', 'linguagens'],
    saidas: ['educacao', 'dados', 'publico'] }),
  F({ id: 'direito', nome: 'direito', trilhas: ['direito'], progressao: 'liberal', entrada: 'faculdade, estágio e o Exame da OAB',
    degraus: ['estágio', 'advocacia empregada', 'carteira própria de clientes', 'sociedade num escritório'], renda: 'variavel', desgaste: { cabeca: 0.45 }, sentido: ['linguagens', 'humanas'], anuidade: 90,
    custoAutonomo: { valor: 300, rotulo: 'Escritório, sistemas e OAB' }, saidas: ['publico', 'judiciario', 'educacao'] }),
  F({ id: 'engenharia', nome: 'engenharia e arquitetura', trilhas: ['engenharia', 'arquitetura'], progressao: 'liberal', entrada: 'faculdade, estágio e registro (CREA, CAU)',
    degraus: ['estágio', 'projeto e obra', 'responsabilidade técnica', 'gerência ou escritório próprio'], renda: 'estavel', desgaste: { cabeca: 0.4 }, sentido: ['exatas', 'desenho'], anuidade: 60,
    custoAutonomo: { valor: 280, rotulo: 'Softwares, registro e deslocamento' }, saidas: ['publico', 'educacao', 'construcao'] }),
  F({ id: 'publico', nome: 'serviço público', trilhas: ['publico', 'judiciario', 'fiscal'], progressao: 'publica', entrada: 'edital, anos de estudo, prova e nomeação',
    degraus: ['estágio probatório', 'estabilidade', 'progressões por tempo', 'função de chefia ou outro concurso'], renda: 'estavel', desgaste: { cabeca: 0.2 }, sentido: ['comunidade'],
    automacao: { desde: 2040, ate: 2080, intensidade: 0.15 }, saidas: ['educacao', 'direito', 'administrativo'] }),
  F({ id: 'seguranca', nome: 'segurança pública', trilhas: ['pm', 'pm_oficial', 'bombeiro', 'guarda', 'policia_civil', 'penal', 'pericia', 'federal'], progressao: 'seguranca',
    entrada: 'concurso, teste físico, investigação social e curso de formação', degraus: ['curso de formação', 'rua e plantões', 'antiguidade e cursos', 'comando ou especialização'],
    renda: 'estavel', desgaste: { cabeca: 0.6, noite: 0.5, corpo: 0.3 }, sentido: ['comunidade', 'lideranca'], saidas: ['vigilancia', 'publico', 'educacao', 'direito'] }),
  F({ id: 'militar', nome: 'Forças Armadas', trilhas: ['exercito_praca', 'exercito_sargento', 'exercito_oficial'], progressao: 'militar',
    entrada: 'alistamento aos 18, concurso para escola de sargentos ou academia de oficiais', degraus: ['formação', 'antiguidade e cursos', 'transferências pelo país', 'reserva com a remuneração do posto'],
    renda: 'estavel', desgaste: { longe: 0.4, corpo: 0.3 }, sentido: ['lideranca', 'atletismo'], saidas: ['vigilancia', 'publico', 'logistica', 'ensino_tecnico', 'guarda'] }),
  F({ id: 'rural', nome: 'campo e água', trilhas: ['agro', 'campo', 'pesca'], progressao: 'rural', entrada: 'a terra da família, arrendamento, safra, técnico agrícola ou agronomia',
    degraus: ['ajudar na roça ou na safra', 'operar máquinas ou produzir', 'técnica e gestão', 'terra própria ou fazenda para gerir'], renda: 'sazonal', desgaste: { corpo: 0.5 }, sentido: ['campo'],
    custoAutonomo: { valor: 240, rotulo: 'Insumos, ração e combustível' }, saidas: ['comercio', 'mecanica', 'ensino_tecnico'] }),
  F({ id: 'criacao', nome: 'imagem, texto e internet', trilhas: ['design', 'ilustracao', 'imagem', 'conteudo', 'literatura', 'comunicacao'], progressao: 'arte',
    entrada: 'portfólio, freelas, público — o diploma ajuda em agência', degraus: ['freelas e trabalhos pequenos', 'clientes que voltam', 'nome conhecido na área'], renda: 'projeto', desgaste: { cabeca: 0.4 },
    sentido: ['desenho', 'fotografia', 'escrita'], custoAutonomo: { valor: 150, rotulo: 'Equipamento e programas' }, automacao: { desde: 2034, ate: 2070, intensidade: 0.3 }, saidas: ['educacao', 'comercio', 'administrativo'] }),
  F({ id: 'palco', nome: 'música, cena e dança', trilhas: ['musica', 'orquestra', 'cena', 'danca'], progressao: 'arte',
    entrada: 'anos de prática, grupo, audição, convite — quase nunca currículo', degraus: ['tocar e atuar por gosto', 'cachês pequenos', 'temporadas e agenda', 'reconhecimento (que vem e vai)'], renda: 'projeto',
    desgaste: { noite: 0.5, cabeca: 0.3 }, sentido: ['musica', 'teatro', 'danca'], saidas: ['ensino_musica', 'ensino_danca', 'educacao', 'comercio'] }),
  F({ id: 'esporte', nome: 'esporte', trilhas: ['atleta', 'treino', 'arbitragem', 'educacao_fisica'], progressao: 'esporte',
    entrada: 'peneira ou seletiva, na idade certa', degraus: ['base', 'primeiro contrato', 'auge curto', 'transição: treinar, preparar, ensinar'], renda: 'projeto', desgaste: { corpo: 0.6, longe: 0.3 },
    sentido: ['futebol', 'volei', 'natacao', 'atletismo', 'lutas'], saidas: ['treino', 'educacao_fisica', 'comercio', 'vigilancia'] }),
  F({ id: 'informal', nome: 'rua, feira e bicos', trilhas: ['informal', 'reciclagem'], progressao: 'informal', entrada: 'começar amanhã: mercadoria, ponto, gente conhecida',
    degraus: ['ponto incerto', 'freguesia', 'banca fixa', 'formalizar (MEI) ou abrir um comércio'], renda: 'variavel', desgaste: { corpo: 0.45, cabeca: 0.35 }, sentido: ['vendas'],
    custoAutonomo: { valor: 90, rotulo: 'Mercadoria que encalha e transporte' }, saidas: ['comercio', 'limpeza', 'alimentacao'] })
];

const POR_TRILHA = new Map<string, FamiliaCarreira>();
for (const f of FAMILIAS) for (const t of f.trilhas) POR_TRILHA.set(t, f);

const OUTRA: FamiliaCarreira = { id: 'outra', nome: 'trabalho', trilhas: [], progressao: 'empresa', entrada: 'currículo', degraus: [], renda: 'estavel', desgaste: {}, saidas: [] };

export const familiaDaTrilha = (trilha: string): FamiliaCarreira => POR_TRILHA.get(trilha) ?? OUTRA;
export const familiaPorId = (id: string) => FAMILIAS.find(f => f.id === id);

/** Quanto a automação pesa numa família neste ano (0..intensidade). */
export function pesoDaAutomacao(f: FamiliaCarreira, ano: number): number {
  const a = f.automacao;
  if (!a || ano < a.desde) return 0;
  return a.intensidade * Math.min(1, (ano - a.desde) / Math.max(1, a.ate - a.desde));
}

/** Quanto a época puxa a família para cima (0..intensidade). */
export function pesoDaExpansao(f: FamiliaCarreira, ano: number): number {
  const e = f.expansao;
  if (!e || ano < e.desde) return 0;
  return e.intensidade * Math.min(1, (ano - e.desde) / 25);
}
