/**
 * VIDA 12.9 — OS RAMOS GRANDES E AS ALAVANCAS DE GESTÃO (catálogo puro: só tipos).
 *
 * As empresas do REWORK 12 (restaurante, clínica, hotel...) vivem de público × ticket. Os ramos daqui vivem de outra
 * coisa: CAPACIDADE (fábricas, aeronaves, plataformas, equipes de obra) e PROJETOS (um modelo de carro, um foguete, uma
 * usina, um empreendimento, uma carteira de crédito) que consomem capital por meses ou anos antes de vender — e, prontos,
 * vendem conforme a aceitação, o preço, o marketing, o ciclo da economia e o acaso do ramo. Cada ramo é diferente no que
 * importa: o capital para entrar, o tempo até o primeiro real, a margem, o risco, o quanto o ciclo pesa, o múltiplo que o
 * mercado paga — e as alavancas próprias (a política de crédito do banco, o rigor de testes do foguete, a venda na planta).
 *
 * Valores em reais de uma economia brasileira (a unidade do motor); o sistema converte para a moeda da vida.
 */

import type { CargoExecutivo, PerfilExecutivo, TipoEmpresa } from '../tipos';

export type PorteDoSetor = 'pequeno' | 'medio' | 'grande' | 'gigante';

/**
 * O que uma opção de alavanca muda (multiplicadores: 1 = nada; somas: 0 = nada). Ficam explícitos para a tela poder
 * DIZER o efeito antes da escolha, e para o painel explicar o ano depois.
 */
export interface EfeitoDeAlavanca {
  /** Procura / volume vendido. */
  demanda?: number;
  /** Receita por unidade vendida (o preço). */
  preco?: number;
  /** Custo que anda com a venda (insumo, combustível, comissão). */
  variavel?: number;
  /** Custos fixos (estrutura, folha, aluguel). */
  fixo?: number;
  /** Fração da receita gasta por ano (marketing, P&D, tecnologia). */
  gasto?: number;
  /** Chance dos maus acontecimentos do ramo (e dos tropeços nos projetos). */
  risco?: number;
  /** A oscilação do ano (o quanto o acaso mexe). */
  volatilidade?: number;
  /** Velocidade dos projetos. */
  velocidade?: number;
  /** Pontos de aceitação dos lançamentos. */
  aceitacao?: number;
  /** Pontos por ano na reputação (e na qualidade da empresa pequena). */
  reputacao?: number;
  /** O teto da capacidade (turnos extras, folga). */
  teto?: number;
  /** Banco: a inadimplência da carteira. */
  inadimplencia?: number;
  /** Juros da dívida da empresa. */
  juros?: number;
}

export interface OpcaoDeAlavanca { id: string; rotulo: string; descricao: string; efeito: EfeitoDeAlavanca; /** Custo único de mudar para ela (fração do capital de base do ramo). */ custo?: number }
export interface Alavanca { id: string; rotulo: string; grupo: string; padrao: string; opcoes: OpcaoDeAlavanca[]; /** Só para empresas grandes (não para o restaurante). */ grande?: boolean; /** Só nos ramos que a declaram. */ ramo?: boolean }

/** As alavancas de toda empresa (a pequena decide de perto; a grande, pela diretoria). O padrão não muda nada. */
export const ALAVANCAS_COMUNS: Alavanca[] = [
  {
    id: 'marketing', rotulo: 'Marketing e divulgação', grupo: 'Mercado', padrao: 'padrao', opcoes: [
      { id: 'minimo', rotulo: 'Só o essencial', descricao: 'Corta a divulgação: economiza, e a procura cai um pouco.', efeito: { demanda: 0.92, gasto: -0.01, reputacao: -1 } },
      { id: 'padrao', rotulo: 'O de sempre', descricao: 'O que o ramo costuma gastar.', efeito: {} },
      { id: 'forte', rotulo: 'Campanha forte', descricao: 'Mais 3% da receita em divulgação: mais procura e mais gente falando.', efeito: { demanda: 1.08, gasto: 0.03, reputacao: 1 } },
      { id: 'agressivo', rotulo: 'Ofensiva de marketing', descricao: 'Mais 7% da receita: a procura sobe mais — o retorno de cada real é menor.', efeito: { demanda: 1.14, gasto: 0.07, reputacao: 2 } }
    ]
  },
  {
    id: 'eficiencia', rotulo: 'Custos e eficiência', grupo: 'Operação', padrao: 'padrao', opcoes: [
      { id: 'padrao', rotulo: 'Como está', descricao: 'Sem programa de corte.', efeito: {} },
      { id: 'enxuta', rotulo: 'Operação enxuta', descricao: 'Renegocia fornecedores e desperdício: −4% no custo variável; a qualidade sente um pouco.', efeito: { variavel: 0.96, reputacao: -1 } },
      { id: 'corte', rotulo: 'Corte duro', descricao: '−8% no variável e −7% no fixo. O atendimento e a qualidade pioram ano a ano.', efeito: { variavel: 0.92, fixo: 0.93, reputacao: -3, risco: 1.15 } }
    ]
  },
  {
    id: 'qualidade', rotulo: 'Padrão do produto', grupo: 'Produto', padrao: 'padrao', opcoes: [
      { id: 'basico', rotulo: 'Básico', descricao: 'Insumo e acabamento mais simples: custa 6% menos; os lançamentos são recebidos pior.', efeito: { variavel: 0.94, aceitacao: -6, reputacao: -1 } },
      { id: 'padrao', rotulo: 'Padrão', descricao: 'O que o mercado espera.', efeito: {} },
      { id: 'superior', rotulo: 'Superior', descricao: 'Custa 6% mais; o público percebe, a reputação sobe e os lançamentos são mais bem recebidos.', efeito: { variavel: 1.06, aceitacao: 6, reputacao: 1.5, demanda: 1.02 } }
    ]
  },
  {
    id: 'pd', rotulo: 'Tecnologia e P&D', grupo: 'Produto', padrao: 'padrao', opcoes: [
      { id: 'nenhum', rotulo: 'Nada além do básico', descricao: 'Economiza; os projetos andam devagar e o que se vende envelhece.', efeito: { gasto: -0.005, velocidade: 0.75, aceitacao: -5, demanda: 0.98 } },
      { id: 'padrao', rotulo: 'O de sempre', descricao: 'O investimento normal do ramo.', efeito: {} },
      { id: 'forte', rotulo: 'Investir forte', descricao: 'Mais 3% da receita: projetos mais rápidos e lançamentos melhores.', efeito: { gasto: 0.03, velocidade: 1.25, aceitacao: 5, demanda: 1.02 } },
      { id: 'lider', rotulo: 'Liderar a tecnologia', descricao: 'Mais 7% da receita: o que há de mais novo. Caro — e só compensa se o mercado acompanhar.', efeito: { gasto: 0.07, velocidade: 1.5, aceitacao: 10, demanda: 1.04, risco: 1.05 } }
    ]
  },
  {
    id: 'capacidade', rotulo: 'Ritmo de produção', grupo: 'Operação', padrao: 'normal', grande: true, opcoes: [
      { id: 'folga', rotulo: 'Com folga', descricao: 'Produz abaixo do máximo: menos hora extra, menos falha.', efeito: { teto: 0.85, variavel: 0.98, risco: 0.85 } },
      { id: 'normal', rotulo: 'Normal', descricao: 'O ritmo previsto.', efeito: {} },
      { id: 'limite', rotulo: 'No limite (turnos extras)', descricao: '+15% do que dá para vender, a custo de hora extra (+4% no variável) e mais falhas.', efeito: { teto: 1.15, variavel: 1.04, risco: 1.25 } }
    ]
  },
  {
    id: 'preco', rotulo: 'Posicionamento de preço', grupo: 'Mercado', padrao: 'intermediario', grande: true, opcoes: [
      { id: 'economico', rotulo: 'Econômico', descricao: 'Preço 15% abaixo: vende mais, ganha menos em cada um.', efeito: { preco: 0.85, demanda: 1.22 } },
      { id: 'intermediario', rotulo: 'Intermediário', descricao: 'O preço do mercado.', efeito: {} },
      { id: 'premium', rotulo: 'Premium', descricao: 'Preço 30% acima: vende menos e só se sustenta com produto superior e marca forte.', efeito: { preco: 1.3, demanda: 0.72, reputacao: 0.5 } }
    ]
  },
  {
    id: 'alcance', rotulo: 'Onde vende', grupo: 'Expansão', padrao: 'nacional', grande: true, opcoes: [
      { id: 'local', rotulo: 'Só no próprio estado', descricao: 'Menos mercado, menos estrutura.', efeito: { demanda: 0.7, fixo: 0.88 } },
      { id: 'nacional', rotulo: 'O país inteiro', descricao: 'O mercado nacional.', efeito: {} },
      { id: 'internacional', rotulo: 'Outros países', descricao: 'Um terço a mais de mercado — com escritórios lá fora (+12% no fixo), câmbio e concorrência global.', efeito: { demanda: 1.32, fixo: 1.12, risco: 1.15, volatilidade: 1.2 }, custo: 0.08 }
    ]
  },
  {
    id: 'divida', rotulo: 'Dívida da empresa', grupo: 'Finanças', padrao: 'moderada', grande: true, opcoes: [
      { id: 'evitar', rotulo: 'Evitar dívida', descricao: 'Amortiza o que der todo ano e só toma crédito em último caso: mais lento, mais seguro.', efeito: { juros: 0.95 } },
      { id: 'moderada', rotulo: 'Moderada', descricao: 'Toma crédito quando o caixa pede.', efeito: {} },
      { id: 'alavancada', rotulo: 'Alavancada', descricao: 'Usa crédito para crescer: o limite sobe, e os juros também.', efeito: { juros: 1.1 } }
    ]
  }
];

/** Um projeto possível de um ramo (o modelo, o foguete, a usina, o empreendimento, a carteira). */
export interface ItemDeProjeto {
  id: string;
  nome: string;
  descricao: string;
  /** O que custa desenvolver ou construir (reais). */
  capex: number;
  /** Meses até vender. */
  meses: number;
  /** O que vende por ano, maduro, com aceitação média (reais). */
  receita: number;
  /** O que sobra de cada real vendido depois do custo direto (0..1). */
  margem: number;
  /** Quanto da capacidade ocupa. */
  usa: number;
  /** Chance por ano de um tropeço no desenvolvimento (atraso e estouro). */
  risco: number;
  /** Chance por ano de o projeto fracassar de vez (o investido vira perda). */
  fatal?: number;
  /** Anos que vende (o empreendimento esgota); ausente = enquanto houver mercado. */
  vida?: number;
  /** Só depois de outro projeto ativo (a cápsula precisa do foguete). */
  requer?: string;
  segmento?: string;
}

/** Um acaso do ramo: a chance por ano, o que faz e qual alavanca o atenua. */
export interface RiscoDoSetor {
  id: string;
  chance: number;
  /** 'receita' tira (ou soma, se negativo) uma fração da receita; 'custo' soma uma fração da receita ao custo; 'projeto' atrasa e encarece um projeto em obra; 'reputacao' derruba a reputação. */
  efeito: 'receita' | 'custo' | 'projeto' | 'reputacao';
  intensidade: [number, number];
  /** Pontos de reputação perdidos junto. */
  reputacao?: number;
  texto: string;
  /** Só na crise econômica (ou só fora dela). */
  crise?: boolean;
  bom?: boolean;
  /** A inadimplência do banco: multiplica pela política de crédito. */
  credito?: boolean;
}

export interface SetorGrande {
  id: TipoEmpresa;
  rotulo: string;
  nome: string;
  artigo: 'o' | 'a';
  porte: Exclude<PorteDoSetor, 'pequeno'>;
  descricao: string;
  /** O que é uma unidade de capacidade ("fábrica", "aeronave"...). */
  unidade: [string, string];
  capacidadeInicial: number;
  /** O que custa uma unidade de capacidade e quanto tempo leva para ficar pronta. */
  custoCapacidade: number;
  mesesCapacidade: number;
  /** O que cada unidade de capacidade custa por ano (folha, manutenção, aluguel, leasing). */
  fixoPorCapacidade: number;
  /** A estrutura da empresa por ano (diretoria, sede, jurídico, contabilidade). */
  estrutura: number;
  /** O capital de giro com que se começa (o caixa do primeiro ano). */
  giro: number;
  /** P&D e marketing "de sempre" já estão aqui: fração da receita. */
  gastoBase: number;
  /** O mercado paga por ela: anos de lucro (e, no ramo que cresce, um tanto da receita). */
  multiplo: number;
  multReceita: number;
  /** O quanto o ciclo da economia mexe (0 = nada; 1,8 = a aérea). */
  ciclo: number;
  /** A oscilação do ano (o acaso do ramo). */
  volatilidade: number;
  /** O tamanho do mercado (para a fatia). */
  mercado: number;
  /** Quanto de dívida o banco empresta (vezes a receita do ano, ou da capacidade em obra). */
  alavancagem: number;
  itens: ItemDeProjeto[];
  alavancas: Alavanca[];
  riscos: RiscoDoSetor[];
  /** O ofício que conhece o ramo (a pessoa que é do ramo toca melhor). */
  doRamo: RegExp;
  nomes: string[];
  /** O que se diz quando um projeto tropeça e quando lança. */
  tropeco: string[];
  lancamento: string;
}

const op = (id: string, rotulo: string, descricao: string, efeito: EfeitoDeAlavanca, custo?: number): OpcaoDeAlavanca => ({ id, rotulo, descricao, efeito, ...(custo ? { custo } : {}) });

export const SETORES_GRANDES: SetorGrande[] = [
  {
    id: 'tecnologia', rotulo: 'Tecnologia', nome: 'uma empresa de tecnologia', artigo: 'a', porte: 'medio',
    descricao: 'Começa pequena: um time e um produto. Margem altíssima quando pega; queima caixa até pegar. A IA e a nuvem pedem bilhões.',
    unidade: ['time de produto', 'times de produto'], capacidadeInicial: 1, custoCapacidade: 3_000_000, mesesCapacidade: 6, fixoPorCapacidade: 2_600_000, estrutura: 700_000, giro: 3_000_000,
    gastoBase: 0.08, multiplo: 14, multReceita: 2, ciclo: 0.7, volatilidade: 0.32, mercado: 400e9, alavancagem: 0.4,
    itens: [
      { id: 'app', nome: 'Um aplicativo de consumo', descricao: 'Para o público: barato de fazer, difícil de fazer pegar.', capex: 2_500_000, meses: 12, receita: 7_500_000, margem: 0.8, usa: 1, risco: 0.15, fatal: 0.06 },
      { id: 'saas', nome: 'Um software para empresas', descricao: 'Assinatura mensal: cresce devagar e fica.', capex: 4_000_000, meses: 18, receita: 11_000_000, margem: 0.78, usa: 1, risco: 0.12, fatal: 0.03 },
      { id: 'ia', nome: 'Uma plataforma de inteligência artificial', descricao: 'Computação cara, gente rara, mercado disputado no mundo todo.', capex: 300_000_000, meses: 30, receita: 420_000_000, margem: 0.58, usa: 6, risco: 0.25, fatal: 0.05 },
      { id: 'nuvem', nome: 'Uma infraestrutura de nuvem', descricao: 'Data centers próprios: bilhões em concreto e chips, margem estável depois.', capex: 2_500_000_000, meses: 36, receita: 2_100_000_000, margem: 0.36, usa: 20, risco: 0.15 }
    ],
    alavancas: [
      { id: 'talentos', rotulo: 'Talentos', grupo: 'Gente', padrao: 'mercado', ramo: true, opcoes: [
        op('enxuto', 'Time enxuto', 'Salários abaixo do mercado: −15% no fixo; os melhores saem e os projetos atrasam.', { fixo: 0.85, velocidade: 0.8, aceitacao: -4 }),
        op('mercado', 'Salário de mercado', 'Paga o que o mercado paga.', {}),
        op('disputar', 'Disputar os melhores', '+20% no fixo: projetos mais rápidos e melhores.', { fixo: 1.2, velocidade: 1.25, aceitacao: 5 })
      ] },
      { id: 'mercado_alvo', rotulo: 'Para quem vende', grupo: 'Mercado', padrao: 'b2b', ramo: true, opcoes: [
        op('b2c', 'Consumidor final', 'Mercado enorme e volátil: um sucesso viraliza, um fracasso some.', { demanda: 1.1, preco: 0.9, volatilidade: 1.5 }),
        op('b2b', 'Empresas', 'Contratos, renovação, crescimento mais previsível.', {}),
        op('governo', 'Governo', 'Licitação: estável e lenta, com preço apertado.', { demanda: 0.9, preco: 0.95, volatilidade: 0.6, risco: 1.1 })
      ] },
      { id: 'infra', rotulo: 'Infraestrutura', grupo: 'Operação', padrao: 'alugada', ramo: true, opcoes: [
        op('alugada', 'Nuvem alugada', 'Paga por uso: simples, caro em escala.', {}),
        op('propria', 'Servidores próprios', 'Investimento agora (6% do capital de base): −10% no custo variável, +10% no fixo.', { variavel: 0.9, fixo: 1.1 }, 0.06)
      ] }
    ],
    riscos: [
      { id: 'vazamento', chance: 0.05, efeito: 'reputacao', intensidade: [0.03, 0.08], reputacao: 12, texto: 'Um vazamento de dados virou notícia: multa, clientes saindo e semanas de crise.' },
      { id: 'gigante', chance: 0.07, efeito: 'receita', intensidade: [0.08, 0.2], texto: 'Uma gigante estrangeira lançou um produto parecido de graça: parte dos clientes migrou.' },
      { id: 'viralizou', chance: 0.05, efeito: 'receita', intensidade: [-0.35, -0.15], bom: true, texto: 'O produto pegou do nada: um vídeo, uma indicação — a procura disparou.' }
    ],
    doRamo: /program|desenvolv|engenheir|ti_|analista_sist|cientista_dados|dados|software|tecnolog/,
    nomes: ['{sobrenome} Tech', 'Nuvem Clara', 'Lógica Viva', 'Ponto Zero Labs', 'Órbita Digital'],
    tropeco: ['O código precisou ser reescrito: meses perdidos.', 'O time-chave pediu demissão no meio do projeto.', 'O primeiro teste com clientes mostrou que o produto não resolvia o problema: volta à prancheta.'],
    lancamento: 'Lançamento feito.'
  },
  {
    id: 'construtora', rotulo: 'Construtora', nome: 'uma construtora', artigo: 'a', porte: 'medio',
    descricao: 'Vive de empreendimentos: anos de obra com capital empatado; vende, entrega e precisa do próximo. O crédito e a crise mandam.',
    unidade: ['equipe de obra', 'equipes de obra'], capacidadeInicial: 1, custoCapacidade: 4_000_000, mesesCapacidade: 6, fixoPorCapacidade: 3_200_000, estrutura: 1_200_000, giro: 3_000_000,
    gastoBase: 0.03, multiplo: 7, multReceita: 0.4, ciclo: 1.6, volatilidade: 0.2, mercado: 300e9, alavancagem: 0.6,
    itens: [
      { id: 'popular', nome: 'Um condomínio popular', descricao: 'Financiamento habitacional, margem curta, procura firme.', capex: 40_000_000, meses: 24, receita: 30_000_000, margem: 0.82, usa: 1, risco: 0.15, vida: 3, segmento: 'economico' },
      { id: 'medio', nome: 'Um residencial de médio padrão', descricao: 'A classe média que financia: sensível aos juros.', capex: 120_000_000, meses: 30, receita: 90_000_000, margem: 0.84, usa: 2, risco: 0.18, vida: 3 },
      { id: 'alto', nome: 'Uma torre de alto padrão', descricao: 'Poucas unidades, preço alto, comprador exigente — e o primeiro a sumir na crise.', capex: 300_000_000, meses: 36, receita: 200_000_000, margem: 0.85, usa: 3, risco: 0.2, vida: 3, segmento: 'premium' },
      { id: 'comercial', nome: 'Um centro empresarial (para alugar)', descricao: 'Não vende: aluga. Renda por décadas, se houver inquilino.', capex: 500_000_000, meses: 36, receita: 68_000_000, margem: 0.72, usa: 3, risco: 0.15 }
    ],
    alavancas: [
      { id: 'vendas', rotulo: 'Como vende', grupo: 'Mercado', padrao: 'na_planta', ramo: true, opcoes: [
        op('na_planta', 'Na planta', 'O comprador financia a obra: menos capital empatado, desconto no preço e risco de distrato.', { preco: 0.95, risco: 1.2 }),
        op('pronto', 'Só pronto', 'Preço cheio (+10%), mais capital empatado (a obra fica mais cara de carregar).', { preco: 1.1, fixo: 1.08, risco: 0.85 })
      ] }
    ],
    riscos: [
      { id: 'distrato', chance: 0.08, efeito: 'receita', intensidade: [0.08, 0.2], texto: 'Uma onda de distratos: compradores desistiram e as unidades voltaram para venda.' },
      { id: 'embargo', chance: 0.06, efeito: 'projeto', intensidade: [6, 12], texto: 'A prefeitura embargou a obra por uma licença: meses parados.' },
      { id: 'juros', chance: 0.5, efeito: 'receita', intensidade: [0.1, 0.22], crise: true, texto: 'Juros altos e crédito travado: os compradores sumiram dos estandes.' }
    ],
    doRamo: /engenheir|arquitet|construc|pedreir|mestre_obras|empreiteir|corretor/,
    nomes: ['Construtora {sobrenome}', '{sobrenome} Engenharia', 'Alicerce Empreendimentos', 'Prumo Construções', 'Horizonte Incorporadora'],
    tropeco: ['Chuva de meses e um fornecedor de concreto que quebrou: a obra atrasou.', 'A sondagem achou um terreno pior que o previsto: fundação mais funda, mais cara.', 'Faltou mão de obra qualificada na cidade: o cronograma escorregou.'],
    lancamento: 'Estande aberto: as unidades começaram a vender.'
  },
  {
    id: 'industria', rotulo: 'Indústria', nome: 'uma indústria', artigo: 'a', porte: 'medio',
    descricao: 'Linhas de produção: margem de fábrica, volume, eficiência. Cresce em degraus (uma fábrica de cada vez).',
    unidade: ['linha de produção', 'linhas de produção'], capacidadeInicial: 1, custoCapacidade: 20_000_000, mesesCapacidade: 18, fixoPorCapacidade: 4_500_000, estrutura: 2_000_000, giro: 5_000_000,
    gastoBase: 0.02, multiplo: 8, multReceita: 0.6, ciclo: 1.1, volatilidade: 0.14, mercado: 1.2e12, alavancagem: 0.6,
    itens: [
      { id: 'alimentos', nome: 'Uma linha de alimentos', descricao: 'Giro alto, margem fina, marca que leva tempo.', capex: 8_000_000, meses: 12, receita: 45_000_000, margem: 0.27, usa: 1, risco: 0.1 },
      { id: 'higiene', nome: 'Bens de consumo (higiene e limpeza)', descricao: 'Disputa de prateleira com as multinacionais.', capex: 12_000_000, meses: 12, receita: 50_000_000, margem: 0.31, usa: 1, risco: 0.1 },
      { id: 'embalagens', nome: 'Embalagens', descricao: 'Vende para outras indústrias: contrato e volume.', capex: 15_000_000, meses: 12, receita: 40_000_000, margem: 0.25, usa: 1, risco: 0.08 },
      { id: 'quimica', nome: 'Química industrial', descricao: 'Capital alto, licença ambiental, margem melhor.', capex: 60_000_000, meses: 24, receita: 120_000_000, margem: 0.3, usa: 2, risco: 0.15 }
    ],
    alavancas: [
      { id: 'automacao', rotulo: 'Automação', grupo: 'Operação', padrao: 'parcial', ramo: true, opcoes: [
        op('manual', 'Pouca', 'Mais gente, menos máquina: −8% no fixo, +6% no variável.', { fixo: 0.92, variavel: 1.06 }),
        op('parcial', 'Parcial', 'O usual.', {}),
        op('alta', 'Alta', 'Robôs e sistemas (10% do capital de base agora): −10% no variável, +10% no fixo.', { variavel: 0.9, fixo: 1.1, risco: 0.9 }, 0.1)
      ] }
    ],
    riscos: [
      { id: 'insumo', chance: 0.1, efeito: 'custo', intensidade: [0.03, 0.07], texto: 'O preço da matéria-prima disparou no mercado internacional.' },
      { id: 'contrato', chance: 0.07, efeito: 'receita', intensidade: [-0.18, -0.08], bom: true, texto: 'Um contrato grande com uma rede nacional: as linhas trabalharam cheias.' },
      { id: 'acidente', chance: 0.04, efeito: 'custo', intensidade: [0.02, 0.05], reputacao: 6, texto: 'Um acidente na fábrica parou a linha e trouxe fiscalização e multa.' }
    ],
    doRamo: /engenheir|quimic|operador|industri|tecnico_|metalurg|produc/,
    nomes: ['Indústrias {sobrenome}', '{sobrenome} & Filhos', 'Fortaleza Industrial', 'Vale Verde Alimentos', 'Polo Indústria'],
    tropeco: ['A máquina importada chegou com defeito: meses até trocar.', 'A licença ambiental demorou mais que o previsto.', 'O teste de produção reprovou o primeiro lote.'],
    lancamento: 'A linha entrou em produção.'
  },
  {
    id: 'montadora', rotulo: 'Montadora', nome: 'uma montadora de veículos', artigo: 'a', porte: 'grande',
    descricao: 'Fábrica, modelos que levam anos para ficar prontos e uma estratégia comercial. Margem baixa no popular, alta no premium; o elétrico é aposta.',
    unidade: ['fábrica', 'fábricas'], capacidadeInicial: 1, custoCapacidade: 2_500_000_000, mesesCapacidade: 36, fixoPorCapacidade: 300_000_000, estrutura: 150_000_000, giro: 1_000_000_000,
    gastoBase: 0.02, multiplo: 7, multReceita: 0.35, ciclo: 1.4, volatilidade: 0.16, mercado: 350e9, alavancagem: 0.5,
    itens: [
      { id: 'popular', nome: 'Um compacto popular', descricao: 'Volume, preço curto, margem de poucos por cento.', capex: 900_000_000, meses: 36, receita: 5_000_000_000, margem: 0.15, usa: 0.5, risco: 0.15, segmento: 'economico' },
      { id: 'sedan', nome: 'Um sedã médio', descricao: 'Família e frota: mercado estável, encolhendo.', capex: 1_100_000_000, meses: 36, receita: 4_000_000_000, margem: 0.16, usa: 0.5, risco: 0.15 },
      { id: 'suv_premium', nome: 'Um SUV premium', descricao: 'O segmento que mais cresce e mais paga — se a marca convencer.', capex: 1_600_000_000, meses: 40, receita: 4_500_000_000, margem: 0.24, usa: 0.5, risco: 0.18, segmento: 'premium' },
      { id: 'esportivo', nome: 'Um esportivo', descricao: 'Pouco volume, muita margem, muita imagem.', capex: 1_200_000_000, meses: 40, receita: 1_200_000_000, margem: 0.34, usa: 0.25, risco: 0.2, segmento: 'esportivo' },
      { id: 'eletrico', nome: 'Uma linha elétrica de entrada', descricao: 'Bateria cara, margem apertada no começo; melhora com P&D e escala.', capex: 2_000_000_000, meses: 48, receita: 4_000_000_000, margem: 0.1, usa: 0.5, risco: 0.22, fatal: 0.02, segmento: 'eletrico' },
      { id: 'eletrico_premium', nome: 'Um elétrico premium', descricao: 'Tecnologia de ponta e preço alto: o público existe, a concorrência global também.', capex: 2_400_000_000, meses: 48, receita: 4_500_000_000, margem: 0.2, usa: 0.5, risco: 0.24, fatal: 0.02, segmento: 'premium' }
    ],
    alavancas: [
      { id: 'comercial', rotulo: 'Estratégia comercial', grupo: 'Mercado', padrao: 'concessionarias', ramo: true, opcoes: [
        op('concessionarias', 'Rede de concessionárias', 'O caminho de sempre: alcance e margem dividida.', {}),
        op('direta', 'Venda direta', 'Sem intermediário: −5% no variável; o alcance cai até a marca firmar.', { variavel: 0.95, demanda: 0.93 }),
        op('frotas', 'Frotas e locadoras', 'Volume garantido e preço espremido.', { demanda: 1.15, preco: 0.9, volatilidade: 0.8 }),
        op('exportacao', 'Exportação', 'Mais mercado, câmbio e logística.', { demanda: 1.12, fixo: 1.05, risco: 1.15, volatilidade: 1.2 }, 0.03)
      ] }
    ],
    riscos: [
      { id: 'recall', chance: 0.07, efeito: 'custo', intensidade: [0.02, 0.05], reputacao: 8, texto: 'Recall: um defeito na suspensão chamou milhares de carros de volta à oficina.' },
      { id: 'chips', chance: 0.06, efeito: 'receita', intensidade: [0.08, 0.16], texto: 'Faltaram componentes eletrônicos no mundo: as linhas pararam por semanas.' },
      { id: 'greve', chance: 0.05, efeito: 'receita', intensidade: [0.04, 0.09], texto: 'Greve na fábrica: um mês sem carro saindo.' }
    ],
    doRamo: /engenheir|mecanic|automot|designer/,
    nomes: ['{sobrenome} Motores', 'Veloz Automóveis', 'Atlântica Motors', 'Cruzeiro Veículos', 'Aurora Automotiva'],
    tropeco: ['O protótipo reprovou no teste de colisão: volta para a engenharia.', 'O fornecedor da bateria atrasou a entrega das células.', 'O ferramental da linha precisou ser refeito.'],
    lancamento: 'O modelo chegou às lojas.'
  },
  {
    id: 'banco', rotulo: 'Banco', nome: 'um banco', artigo: 'o', porte: 'grande',
    descricao: 'Ganha no spread e perde na inadimplência. O capital próprio limita o quanto se empresta; a crise cobra a conta do crédito fácil.',
    unidade: ['agência e plataforma', 'agências e plataformas'], capacidadeInicial: 2, custoCapacidade: 150_000_000, mesesCapacidade: 12, fixoPorCapacidade: 30_000_000, estrutura: 60_000_000, giro: 900_000_000,
    gastoBase: 0.04, multiplo: 9, multReceita: 0.8, ciclo: 1.2, volatilidade: 0.12, mercado: 900e9, alavancagem: 0.3,
    itens: [
      { id: 'pessoal', nome: 'Crédito pessoal', descricao: 'Juro alto, inadimplência alta.', capex: 400_000_000, meses: 12, receita: 320_000_000, margem: 0.55, usa: 1, risco: 0.05 },
      { id: 'imobiliario', nome: 'Crédito imobiliário', descricao: 'Garantia do imóvel, prazo longo, spread curto.', capex: 1_500_000_000, meses: 12, receita: 375_000_000, margem: 0.6, usa: 1, risco: 0.05 },
      { id: 'empresas', nome: 'Crédito para empresas', descricao: 'Capital de giro e investimento: anda com a economia.', capex: 1_000_000_000, meses: 12, receita: 400_000_000, margem: 0.52, usa: 1, risco: 0.05 },
      { id: 'cartoes', nome: 'Cartões', descricao: 'Tarifa, rotativo e uma inadimplência que não perdoa.', capex: 600_000_000, meses: 18, receita: 650_000_000, margem: 0.45, usa: 1, risco: 0.08 },
      { id: 'investimentos', nome: 'Gestão de investimentos', descricao: 'Taxas sobre o que os clientes aplicam: pouco capital, muita confiança.', capex: 150_000_000, meses: 18, receita: 160_000_000, margem: 0.6, usa: 1, risco: 0.06 }
    ],
    alavancas: [
      { id: 'credito', rotulo: 'Política de crédito', grupo: 'Risco', padrao: 'moderada', ramo: true, opcoes: [
        op('conservadora', 'Conservadora', 'Empresta a quem quase certamente paga: −15% no volume, inadimplência bem menor.', { demanda: 0.85, inadimplencia: 0.55 }),
        op('moderada', 'Moderada', 'O padrão do mercado.', {}),
        op('agressiva', 'Agressiva', '+25% no volume; a inadimplência quase dobra — e explode na crise.', { demanda: 1.25, inadimplencia: 1.85, risco: 1.3 })
      ] },
      { id: 'canais', rotulo: 'Canais', grupo: 'Operação', padrao: 'misto', ramo: true, opcoes: [
        op('agencias', 'Agências', 'Presença física: +15% no fixo, clientes mais fiéis.', { fixo: 1.15, reputacao: 1, volatilidade: 0.85 }),
        op('misto', 'Misto', 'O usual.', {}),
        op('digital', 'Digital', 'Sem agência (8% do capital de base em tecnologia): −15% no fixo; o cliente troca de banco com dois toques.', { fixo: 0.85, demanda: 1.05, volatilidade: 1.15 }, 0.08)
      ] }
    ],
    riscos: [
      { id: 'inadimplencia', chance: 0.35, efeito: 'custo', intensidade: [0.08, 0.18], credito: true, texto: 'A inadimplência subiu: mais calote na carteira do que o previsto.' },
      { id: 'calote_crise', chance: 0.6, efeito: 'custo', intensidade: [0.15, 0.35], credito: true, crise: true, texto: 'A crise virou calote em massa: a provisão para perdas comeu o lucro.' },
      { id: 'fraude', chance: 0.03, efeito: 'custo', intensidade: [0.02, 0.06], reputacao: 10, texto: 'Uma fraude interna descoberta pela auditoria: multa do regulador e manchete.' }
    ],
    doRamo: /banc|economist|financ|gerente_banco|contador|atuari/,
    nomes: ['Banco {sobrenome}', '{sobrenome} Investimentos', 'Banco Meridiano', 'Banco Austral', 'Confiança Banco'],
    tropeco: ['O regulador pediu mais capital antes de liberar a carteira.', 'O sistema de crédito novo falhou na homologação.'],
    lancamento: 'A carteira começou a operar.'
  },
  {
    id: 'aerea', rotulo: 'Companhia aérea', nome: 'uma companhia aérea', artigo: 'a', porte: 'grande',
    descricao: 'Avião é caro parado e voando. Margem fina, combustível no dólar, crise que esvazia os voos: a primeira a sofrer.',
    unidade: ['aeronave', 'aeronaves'], capacidadeInicial: 8, custoCapacidade: 35_000_000, mesesCapacidade: 12, fixoPorCapacidade: 45_000_000, estrutura: 80_000_000, giro: 600_000_000,
    gastoBase: 0.02, multiplo: 6, multReceita: 0.3, ciclo: 1.8, volatilidade: 0.2, mercado: 60e9, alavancagem: 0.5,
    itens: [
      { id: 'regional', nome: 'Rotas regionais', descricao: 'Cidades médias: pouca concorrência, avião pequeno.', capex: 60_000_000, meses: 9, receita: 640_000_000, margem: 0.5, usa: 4, risco: 0.08 },
      { id: 'tronco', nome: 'Rotas entre capitais', descricao: 'Muito passageiro, muita concorrência.', capex: 120_000_000, meses: 9, receita: 1_500_000_000, margem: 0.48, usa: 8, risco: 0.08 },
      { id: 'internacional', nome: 'Rotas internacionais', descricao: 'Avião grande, câmbio, tarifa alta.', capex: 300_000_000, meses: 18, receita: 1_800_000_000, margem: 0.46, usa: 6, risco: 0.12 },
      { id: 'carga', nome: 'Carga aérea', descricao: 'Sem passageiro: e-commerce e encomenda urgente.', capex: 80_000_000, meses: 12, receita: 450_000_000, margem: 0.5, usa: 3, risco: 0.08 }
    ],
    alavancas: [
      { id: 'modelo', rotulo: 'Modelo de negócio', grupo: 'Mercado', padrao: 'tradicional', ramo: true, opcoes: [
        op('low_cost', 'Baixo custo', 'Passagem barata, tudo cobrado à parte: −20% no preço, +30% de passageiros, −10% no variável.', { preco: 0.8, demanda: 1.3, variavel: 0.9, reputacao: -0.5 }),
        op('tradicional', 'Tradicional', 'O de sempre.', {}),
        op('premium', 'Serviço premium', '+25% no preço, −20% de passageiros: vive do executivo.', { preco: 1.25, demanda: 0.8, variavel: 1.05, reputacao: 1 })
      ] },
      { id: 'hedge', rotulo: 'Proteção do combustível', grupo: 'Finanças', padrao: 'parcial', ramo: true, opcoes: [
        op('sem', 'Sem proteção', 'Ganha quando o petróleo cai, quebra quando sobe.', { volatilidade: 1.5, risco: 1.3 }),
        op('parcial', 'Parcial', 'O usual.', {}),
        op('total', 'Total', 'Trava o preço (1% da receita por ano): o ano fica previsível.', { volatilidade: 0.6, risco: 0.6, gasto: 0.01 })
      ] }
    ],
    riscos: [
      { id: 'combustivel', chance: 0.18, efeito: 'custo', intensidade: [0.05, 0.12], texto: 'O querosene de aviação subiu com o petróleo e o dólar.' },
      { id: 'guerra_tarifas', chance: 0.1, efeito: 'receita', intensidade: [0.06, 0.14], texto: 'Guerra de tarifas com a concorrente: avião cheio e passagem a preço de ônibus.' },
      { id: 'incidente', chance: 0.02, efeito: 'reputacao', intensidade: [0.03, 0.06], reputacao: 18, texto: 'Um incidente grave com uma aeronave: investigação, frota parada e passageiros com medo.' }
    ],
    doRamo: /piloto|aeronaut|comissari|aviac/,
    nomes: ['{sobrenome} Linhas Aéreas', 'Azimute Linhas Aéreas', 'Céu Aberto', 'Rota Sul', 'Alçar Linhas Aéreas'],
    tropeco: ['A agência reguladora atrasou a liberação das rotas.', 'A entrega das aeronaves atrasou na fábrica.'],
    lancamento: 'Os primeiros voos decolaram.'
  },
  {
    id: 'aeroespacial', rotulo: 'Aeroespacial', nome: 'uma empresa aeroespacial', artigo: 'a', porte: 'gigante',
    descricao: 'Foguetes e satélites. Consome bilhões por anos antes de faturar um real; um teste explode, o cronograma escorrega. Quando dá certo, ninguém alcança.',
    unidade: ['base de lançamento', 'bases de lançamento'], capacidadeInicial: 1, custoCapacidade: 1_500_000_000, mesesCapacidade: 30, fixoPorCapacidade: 200_000_000, estrutura: 150_000_000, giro: 1_500_000_000,
    gastoBase: 0.06, multiplo: 18, multReceita: 4, ciclo: 0.4, volatilidade: 0.3, mercado: 2.5e12, alavancagem: 0.25,
    itens: [
      { id: 'satelites_governo', nome: 'Satélites sob encomenda (governos)', descricao: 'O começo de quase todas: contrato público, prazo e margem curta.', capex: 600_000_000, meses: 24, receita: 900_000_000, margem: 0.3, usa: 0.5, risco: 0.12, fatal: 0.01 },
      { id: 'lancador_leve', nome: 'Um lançador leve', descricao: 'Põe satélites pequenos em órbita. Anos de teste antes do primeiro voo pago.', capex: 3_000_000_000, meses: 54, receita: 1_600_000_000, margem: 0.4, usa: 1, risco: 0.3, fatal: 0.05 },
      { id: 'reutilizavel', nome: 'Um foguete reutilizável pesado', descricao: 'O primeiro estágio volta e pousa. Uma década e uma fortuna; muda o preço de ir ao espaço.', capex: 18_000_000_000, meses: 96, receita: 9_000_000_000, margem: 0.45, usa: 1, risco: 0.35, fatal: 0.04 },
      { id: 'constelacao', nome: 'Uma constelação de satélites de internet', descricao: 'Milhares de satélites e milhões de assinantes — se o foguete existir.', capex: 14_000_000_000, meses: 60, receita: 7_500_000_000, margem: 0.5, usa: 1, risco: 0.2, fatal: 0.03, requer: 'lancador_leve|reutilizavel' },
      { id: 'capsula', nome: 'Uma cápsula tripulada', descricao: 'Levar gente ao espaço: o mais caro, o mais arriscado, o mais visto.', capex: 12_000_000_000, meses: 84, receita: 3_200_000_000, margem: 0.3, usa: 1, risco: 0.35, fatal: 0.05, requer: 'reutilizavel' }
    ],
    alavancas: [
      { id: 'testes', rotulo: 'Rigor de testes', grupo: 'Projetos', padrao: 'padrao', ramo: true, opcoes: [
        op('rapido', 'Testar rápido, errar rápido', 'Projetos 35% mais rápidos; explosões e tropeços quase o dobro.', { velocidade: 1.35, risco: 1.8 }),
        op('padrao', 'Padrão', 'O cronograma de sempre.', {}),
        op('rigoroso', 'Rigoroso', 'Mais lento (−20%) e 10% mais caro no fixo; metade dos tropeços.', { velocidade: 0.8, risco: 0.5, fixo: 1.1 })
      ] },
      { id: 'contratos', rotulo: 'Contratos', grupo: 'Mercado', padrao: 'misto', ramo: true, opcoes: [
        op('governo', 'Governos e agências espaciais', 'Estável e lento, preço negociado.', { demanda: 0.9, preco: 1.05, volatilidade: 0.6 }),
        op('misto', 'Misto', 'O usual.', {}),
        op('comercial', 'Mercado comercial', '+15% de demanda; anos bons e ruins mais extremos.', { demanda: 1.15, volatilidade: 1.4 })
      ] },
      { id: 'reuso', rotulo: 'Tecnologia de reuso', grupo: 'Projetos', padrao: 'descartavel', ramo: true, opcoes: [
        op('descartavel', 'Foguete descartável', 'Cada voo, um foguete novo.', {}),
        op('reuso', 'Pousar e reutilizar', 'Investimento agora (15% do capital de base): −20% no custo de cada lançamento, mais risco nos primeiros anos.', { variavel: 0.8, risco: 1.15 }, 0.15)
      ] }
    ],
    riscos: [
      { id: 'explosao', chance: 0.18, efeito: 'projeto', intensidade: [8, 18], reputacao: 4, texto: 'O protótipo explodiu na plataforma de testes. Ninguém se feriu; o cronograma, sim.' },
      { id: 'falha_voo', chance: 0.05, efeito: 'receita', intensidade: [0.15, 0.3], reputacao: 10, texto: 'Um lançamento falhou e perdeu a carga de um cliente: voos suspensos até a investigação acabar.' },
      { id: 'contrato_grande', chance: 0.06, efeito: 'receita', intensidade: [-0.4, -0.15], bom: true, texto: 'Uma agência espacial fechou um contrato de vários lançamentos.' }
    ],
    doRamo: /engenheir|aeroespac|fisic|astron|aeronaut/,
    nomes: ['{sobrenome} Aeroespacial', 'Órbita Austral', 'Cruzeiro do Sul Espacial', 'Vetor Espacial', 'Zênite Aeroespacial'],
    tropeco: ['Uma válvula do motor falhou no teste estático: redesenho.', 'O tanque não aguentou a pressão no ensaio: meses de engenharia de volta.', 'O software de voo reprovou na simulação.'],
    lancamento: 'O primeiro voo comercial deu certo.'
  },
  {
    id: 'semicondutores', rotulo: 'Semicondutores', nome: 'uma fabricante de chips', artigo: 'a', porte: 'gigante',
    descricao: 'Uma fábrica de chips custa dezenas de bilhões e quatro anos. O ciclo dos chips é brutal: falta num ano, sobra no outro.',
    unidade: ['fábrica de chips', 'fábricas de chips'], capacidadeInicial: 1, custoCapacidade: 25_000_000_000, mesesCapacidade: 48, fixoPorCapacidade: 2_000_000_000, estrutura: 600_000_000, giro: 3_000_000_000,
    gastoBase: 0.06, multiplo: 13, multReceita: 1.5, ciclo: 1.2, volatilidade: 0.35, mercado: 3e12, alavancagem: 0.35,
    itens: [
      { id: 'maduros', nome: 'Chips de tecnologia madura', descricao: 'Para carros, máquinas, eletrodomésticos: volume e margem razoável.', capex: 2_000_000_000, meses: 24, receita: 14_000_000_000, margem: 0.45, usa: 1, risco: 0.12 },
      { id: 'memorias', nome: 'Memórias', descricao: 'Commodity: margem enorme no ano bom, prejuízo no ruim.', capex: 4_000_000_000, meses: 30, receita: 18_000_000_000, margem: 0.42, usa: 1, risco: 0.15 },
      { id: 'avancados', nome: 'Chips avançados', descricao: 'O processo mais fino que existe: poucos no mundo conseguem.', capex: 15_000_000_000, meses: 48, receita: 30_000_000_000, margem: 0.55, usa: 1, risco: 0.3, fatal: 0.06 },
      { id: 'encapsulamento', nome: 'Encapsulamento e testes', descricao: 'A etapa final, mais simples: entra antes de a fábrica ficar pronta.', capex: 1_500_000_000, meses: 18, receita: 5_000_000_000, margem: 0.24, usa: 0.5, risco: 0.1 }
    ],
    alavancas: [
      { id: 'clientes', rotulo: 'Clientes', grupo: 'Mercado', padrao: 'misto', ramo: true, opcoes: [
        op('longos', 'Contratos longos', 'Preço 8% menor, ano previsível.', { preco: 0.92, volatilidade: 0.55 }),
        op('misto', 'Misto', 'O usual.', {}),
        op('spot', 'Mercado à vista', 'Preço do dia: +10% no ano bom, tombo no ruim.', { preco: 1.1, volatilidade: 1.5 })
      ] }
    ],
    riscos: [
      { id: 'baixa', chance: 0.14, efeito: 'receita', intensidade: [0.15, 0.32], texto: 'O ciclo virou: sobra chip no mundo e o preço desabou.' },
      { id: 'alta', chance: 0.12, efeito: 'receita', intensidade: [-0.3, -0.12], bom: true, texto: 'Falta chip no mundo: tudo o que se fabricou vendeu, a preço alto.' },
      { id: 'contaminacao', chance: 0.05, efeito: 'custo', intensidade: [0.04, 0.1], texto: 'Uma contaminação na sala limpa estragou semanas de produção.' }
    ],
    doRamo: /engenheir|fisic|eletron|quimic/,
    nomes: ['{sobrenome} Semicondutores', 'Silício Austral', 'Núcleo Chips', 'Litografia Brasil', 'Quartzo Semicondutores'],
    tropeco: ['O rendimento da primeira produção ficou abaixo do esperado: metade dos chips com defeito.', 'A máquina de litografia atrasou na entrega.'],
    lancamento: 'A produção começou a sair da fábrica.'
  },
  {
    id: 'energia', rotulo: 'Energia', nome: 'uma geradora de energia', artigo: 'a', porte: 'grande',
    descricao: 'Usinas que levam anos para ficar prontas e depois rendem por décadas, com contrato. O risco é a obra, a licença e a regra.',
    unidade: ['frente de engenharia', 'frentes de engenharia'], capacidadeInicial: 2, custoCapacidade: 80_000_000, mesesCapacidade: 9, fixoPorCapacidade: 10_000_000, estrutura: 40_000_000, giro: 200_000_000,
    gastoBase: 0.01, multiplo: 11, multReceita: 1.2, ciclo: 0.4, volatilidade: 0.08, mercado: 400e9, alavancagem: 0.7,
    itens: [
      { id: 'solar', nome: 'Um parque solar', descricao: 'Rápido de construir, sem combustível.', capex: 600_000_000, meses: 24, receita: 130_000_000, margem: 0.82, usa: 1, risco: 0.1 },
      { id: 'eolica', nome: 'Um parque eólico', descricao: 'Vento do Nordeste: fator de capacidade alto.', capex: 1_200_000_000, meses: 30, receita: 250_000_000, margem: 0.8, usa: 1, risco: 0.12 },
      { id: 'hidreletrica', nome: 'Uma hidrelétrica', descricao: 'Seis anos de obra, licença ambiental difícil, energia por meio século.', capex: 8_000_000_000, meses: 72, receita: 1_350_000_000, margem: 0.83, usa: 2, risco: 0.25, fatal: 0.03 },
      { id: 'termica', nome: 'Uma termelétrica', descricao: 'Liga quando falta chuva: paga bem, queima combustível.', capex: 1_000_000_000, meses: 24, receita: 420_000_000, margem: 0.42, usa: 1, risco: 0.1 },
      { id: 'transmissao', nome: 'Uma linha de transmissão', descricao: 'Receita fixa por contrato, risco baixo.', capex: 2_000_000_000, meses: 36, receita: 300_000_000, margem: 0.85, usa: 1, risco: 0.12 }
    ],
    alavancas: [
      { id: 'contrato_energia', rotulo: 'Como vende a energia', grupo: 'Mercado', padrao: 'regulado', ramo: true, opcoes: [
        op('regulado', 'Leilão regulado', 'Contrato de vinte anos: previsível, preço menor.', { preco: 0.96, volatilidade: 0.5 }),
        op('livre', 'Mercado livre', '+10% no preço, e um ano que depende da chuva e da indústria.', { preco: 1.1, volatilidade: 1.6 })
      ] }
    ],
    riscos: [
      { id: 'seca', chance: 0.1, efeito: 'receita', intensidade: [0.06, 0.15], texto: 'Seca nos reservatórios: produziu menos do que vendeu e comprou a diferença caro.' },
      { id: 'licenca', chance: 0.08, efeito: 'projeto', intensidade: [6, 18], texto: 'O licenciamento ambiental travou a obra.' },
      { id: 'regra', chance: 0.05, efeito: 'receita', intensidade: [0.04, 0.09], texto: 'O governo mudou uma regra do setor: a tarifa encolheu.' }
    ],
    doRamo: /engenheir|eletric|ambient|geolog/,
    nomes: ['{sobrenome} Energia', 'Ventania Energia', 'Sol do Sertão', 'Correnteza Geração', 'Matriz Energia'],
    tropeco: ['As turbinas chegaram com atraso do fornecedor.', 'A comunidade da região entrou na Justiça contra a obra.', 'A conexão com a rede atrasou: usina pronta sem poder vender.'],
    lancamento: 'A usina entrou em operação comercial.'
  },
  {
    id: 'infraestrutura', rotulo: 'Infraestrutura', nome: 'uma empresa de infraestrutura', artigo: 'a', porte: 'grande',
    descricao: 'Concessões de rodovia, porto, aeroporto, saneamento: obra enorme no começo, receita estável por décadas, e a regra do governo no meio.',
    unidade: ['frente de obra', 'frentes de obra'], capacidadeInicial: 2, custoCapacidade: 100_000_000, mesesCapacidade: 9, fixoPorCapacidade: 30_000_000, estrutura: 110_000_000, giro: 300_000_000,
    gastoBase: 0.01, multiplo: 10, multReceita: 1, ciclo: 0.6, volatilidade: 0.1, mercado: 250e9, alavancagem: 0.7,
    itens: [
      { id: 'rodovia', nome: 'A concessão de uma rodovia', descricao: 'Pedágio por trinta anos; duplicar a pista primeiro.', capex: 3_000_000_000, meses: 36, receita: 700_000_000, margem: 0.6, usa: 1, risco: 0.15 },
      { id: 'porto', nome: 'Um terminal portuário', descricao: 'Anda com a exportação de grãos e minério.', capex: 5_000_000_000, meses: 48, receita: 1_100_000_000, margem: 0.55, usa: 1, risco: 0.15 },
      { id: 'aeroporto', nome: 'A concessão de um aeroporto', descricao: 'Tarifa, lojas e estacionamento; a pandemia e a crise esvaziam.', capex: 6_000_000_000, meses: 48, receita: 1_250_000_000, margem: 0.5, usa: 1, risco: 0.15 },
      { id: 'saneamento', nome: 'Uma concessão de saneamento', descricao: 'Água e esgoto de uma região: obra pesada, tarifa regulada, demanda certa.', capex: 2_500_000_000, meses: 36, receita: 600_000_000, margem: 0.55, usa: 1, risco: 0.15 }
    ],
    alavancas: [
      { id: 'tarifa', rotulo: 'Tarifa', grupo: 'Mercado', padrao: 'contratual', ramo: true, opcoes: [
        op('moderada', 'Abaixo do teto', '−5% no preço: a população e o governo agradecem.', { preco: 0.95, reputacao: 1.5, risco: 0.7 }),
        op('contratual', 'A do contrato', 'O que o contrato permite.', {}),
        op('maxima', 'Reajuste máximo e cobranças extras', '+6% no preço; a revisão tarifária e a briga com o regulador ficam mais prováveis.', { preco: 1.06, reputacao: -1.5, risco: 1.6 })
      ] }
    ],
    riscos: [
      { id: 'revisao', chance: 0.07, efeito: 'receita', intensidade: [0.05, 0.12], texto: 'A agência reguladora revisou a tarifa para baixo.' },
      { id: 'temporal', chance: 0.06, efeito: 'custo', intensidade: [0.03, 0.08], texto: 'Chuvas fortes destruíram trechos: obra emergencial.' },
      { id: 'politica', chance: 0.04, efeito: 'reputacao', intensidade: [0.02, 0.05], reputacao: 10, texto: 'O contrato virou assunto de CPI: investigação e desgaste.' }
    ],
    doRamo: /engenheir|arquitet|urban|logistic/,
    nomes: ['{sobrenome} Infraestrutura', 'Via Austral', 'Concessões Atlântico', 'Ponte Firme', 'Trilho Norte'],
    tropeco: ['A desapropriação dos terrenos travou na Justiça.', 'O projeto executivo precisou ser refeito.', 'O financiamento do banco público atrasou.'],
    lancamento: 'A concessão começou a operar.'
  }
];

export const setorGrande = (id: string): SetorGrande | undefined => SETORES_GRANDES.find(s => s.id === id);
export const itemDoSetor = (s: SetorGrande, id: string) => s.itens.find(i => i.id === id);

/* ------------------------------------------- As empresas pequenas: projetos de produto */

/** Os projetos da empresa pequena (o restaurante, a loja): um produto novo, um canal novo. Em frações do capital de uma unidade. */
export interface ProjetoPequeno { id: string; nome: Partial<Record<TipoEmpresa, string>> & { padrao: string }; descricao: string; capex: number; meses: number; /** Ganho de procura com aceitação boa. */ ganho: number; variavel?: number }

export const PROJETOS_PEQUENOS: ProjetoPequeno[] = [
  { id: 'produto', nome: { padrao: 'Um produto novo', restaurante: 'Um cardápio-assinatura novo', loja: 'Uma linha de marca própria', clinica: 'Um serviço novo (check-up completo)', academia: 'Um programa de treino novo', estudio: 'Gravação de podcasts e vídeos', hotel: 'Pacotes de eventos e casamentos' }, descricao: 'Pode pegar ou não: a aceitação decide se a procura sobe ou se foi dinheiro perdido.', capex: 0.06, meses: 6, ganho: 0.16 },
  { id: 'online', nome: { padrao: 'Um canal on-line', restaurante: 'Delivery próprio', loja: 'Uma loja on-line', clinica: 'Agendamento e teleconsulta', academia: 'Aulas on-line', estudio: 'Mixagem a distância', hotel: 'Reserva direta pelo site' }, descricao: 'Mais alcance, com as taxas de plataforma e entrega.', capex: 0.04, meses: 6, ganho: 0.1, variavel: 1.02 }
];

/* ------------------------------------------------------------- A diretoria */

export const NOME_PERFIL: Record<PerfilExecutivo, string> = { conservador: 'conservador', agressivo: 'agressivo', inovador: 'inovador', expansao: 'de expansão', eficiencia: 'de eficiência', financas: 'de finanças' };
export const DESCRICAO_PERFIL: Record<PerfilExecutivo, string> = {
  conservador: 'protege o caixa e evita riscos; cresce devagar',
  agressivo: 'gasta para crescer: mais marketing, mais aposta, mais risco',
  inovador: 'acelera projetos e lançamentos; gosta de P&D',
  expansao: 'quer mais unidades, mais mercados, mais capacidade',
  eficiencia: 'corta custo e desperdício; às vezes corta demais',
  financas: 'cuida da dívida, do custo de capital e da distribuição'
};
export const NOME_CARGO: Record<CargoExecutivo | 'ceo', string> = { ceo: 'Presidente (CEO)', cfo: 'Diretoria financeira', coo: 'Diretoria de operações', cto: 'Diretoria de tecnologia' };

/** O que cada perfil faz em cada cargo quando ENCAIXA (multiplicado pela competência); o que não encaixa desperdiça. */
export const PERFIL_NO_CARGO: Record<CargoExecutivo | 'ceo', Partial<Record<PerfilExecutivo, EfeitoDeAlavanca>>> = {
  ceo: {
    conservador: { risco: 0.85, demanda: 0.98, juros: 0.95 },
    agressivo: { demanda: 1.05, risco: 1.25, fixo: 1.02 },
    inovador: { velocidade: 1.15, aceitacao: 5, gasto: 0.005 },
    expansao: { demanda: 1.03, fixo: 1.03 },
    eficiencia: { variavel: 0.97, reputacao: -0.5 },
    financas: { juros: 0.85 }
  },
  cfo: { financas: { juros: 0.78 }, conservador: { juros: 0.85, risco: 0.92 }, eficiencia: { fixo: 0.98 }, agressivo: { juros: 1.05 } },
  coo: { eficiencia: { variavel: 0.95 }, conservador: { risco: 0.85 }, expansao: { teto: 1.08 }, agressivo: { teto: 1.06, risco: 1.1 } },
  cto: { inovador: { velocidade: 1.3, aceitacao: 6 }, conservador: { risco: 0.7, velocidade: 0.92 }, eficiencia: { gasto: -0.005, velocidade: 0.95 }, agressivo: { velocidade: 1.2, risco: 1.25 } }
};

/** Os nomes da diretoria (texto: não viram pessoas da vida). */
export const EXECUTIVOS_129: [string, string][] = [
  ['Rodrigo Valente', 'Mariana Teixeira'], ['Gustavo Arruda', 'Helena Barros'], ['André Coutinho', 'Luísa Pacheco'], ['Felipe Sampaio', 'Camila Rocha'],
  ['Henrique Novaes', 'Isabela Freitas'], ['Otávio Campos', 'Fernanda Leme'], ['Daniel Quintela', 'Tatiana Mello'], ['Vitor Amaral', 'Gabriela Nunes']
];

/** Os nomes que a casa sugere para os ramos novos (o resto mora em `dados/empresas.NOMES_DE_EMPRESA`). */
export const NOMES_129: Partial<Record<TipoEmpresa, string[]>> = Object.fromEntries(SETORES_GRANDES.map(s => [s.id, s.nomes]));
