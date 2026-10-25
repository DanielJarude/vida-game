/**
 * REWORK 12 — AS EMPRESAS QUE ALGUÉM PODE TER (além do trabalho): o restaurante do atleta, a clínica do médico,
 * o estúdio do músico, o hotel, o museu, o zoológico.
 *
 * Não são o mesmo negócio com nomes diferentes. Cada um vende uma coisa diferente e quebra de um jeito diferente:
 *   - o RESTAURANTE vive de mesa cheia, margem fina e concorrência (abre muito, fecha muito);
 *   - a CLÍNICA vive de agenda e de responsável técnico (sem médico, não abre); margem boa, capital alto;
 *   - a ACADEMIA vive de carteira: aluno entra, aluno some (a evasão é o inimigo);
 *   - o ESTÚDIO vive de horas vendidas e do nome de quem grava ali;
 *   - o HOTEL vive de ocupação: o turismo da cidade, a estação, a crise que esvazia os quartos;
 *   - a LOJA vive de giro e de margem bruta (o custo da mercadoria leva mais da metade);
 *   - o MUSEU quase nunca se paga com ingresso: vive de acervo, conservação, exposição e de quem patrocina;
 *   - o ZOOLÓGICO custa muito e responde por vidas: bem-estar animal, equipe especializada, fiscalização.
 *
 * Os números são de uma unidade numa capital brasileira (unidade do motor); a cidade e o país ajustam.
 */

import type { PrecoEmpresa, TipoEmpresa } from '../tipos';

export interface TipoDeEmpresa {
  id: TipoEmpresa;
  /** "um restaurante", "uma clínica". */
  nome: string;
  rotulo: string;
  artigo: 'o' | 'a';
  descricao: string;
  /** O que custa abrir uma unidade (obra, equipamento, capital de giro). */
  capital: number;
  /** Quanto do capital vira instalações (o que sobra é capital de giro, no caixa). */
  ativos: number;
  /** Público por ano de uma unidade madura, de reputação média, numa capital. */
  publico: number;
  /** O teto de público de uma unidade (a cozinha, os quartos, as cadeiras). */
  capacidade: number;
  /** A receita por pessoa (o prato, a diária, a consulta, a mensalidade do ano, a hora de estúdio, o ingresso). */
  ticket: Record<PrecoEmpresa, number>;
  /** O quanto o preço mexe na procura (o popular atrai mais gente; o alto, menos — e mais exigente). */
  procura: Record<PrecoEmpresa, number>;
  /** Fração da receita que vai embora com ela (insumo, mercadoria, repasse aos profissionais). */
  variavel: number;
  /** Outros custos que andam com a receita (energia, cartão, marketing, contador). */
  outros: number;
  /** O ponto (aluguel) por unidade, por ano. */
  ponto: number;
  /** Quem trabalha por unidade e o salário médio com encargos (por mês). */
  equipe: number;
  salario: number;
  /** Manutenção das instalações por ano (fração dos ativos). */
  manutencao: number;
  /** O quanto o ciclo da economia mexe na procura (0 = nada; 1,5 = a primeira coisa que se corta). */
  ciclo: number;
  /** Depende de turista (hotel, museu, zoológico): a cidade grande e a que recebe visitantes rendem mais. */
  turismo?: boolean;
  /** Patrocínio, convênio e incentivo que cobrem parte do custo (museu, zoológico), conforme a reputação. */
  apoio?: number;
  /** Exige um responsável técnico habilitado (a clínica): sem ser você, é um salário a mais. */
  responsavel?: { rotulo: string; salario: number; ocupacao: RegExp };
  /** O ofício que conhece o ramo (quem é do ramo administra melhor e é reconhecido pelo público). */
  doRamo: RegExp;
  /** A palavra do público: [um, vários]. */
  publicoNome: [string, string];
  /** Abrir leva um ano de obra (museu, zoológico, hotel): sem receita, com custo. */
  obra?: boolean;
  /** Só em cidade grande (a escala pede). */
  cidadeGrande?: boolean;
}

export const TIPOS_DE_EMPRESA: readonly TipoDeEmpresa[] = [
  {
    id: 'restaurante', nome: 'um restaurante', rotulo: 'Restaurante', artigo: 'o', descricao: 'Mesa cheia, margem fina, concorrência na esquina. Abre muito, fecha muito.',
    capital: 450000, ativos: 0.65, publico: 24000, capacidade: 40000, ticket: { popular: 48, medio: 88, alto: 210 }, procura: { popular: 1.3, medio: 1, alto: 0.5 },
    variavel: 0.42, outros: 0.14, ponto: 150000, equipe: 16, salario: 3400, manutencao: 0.06, ciclo: 1.2,
    doRamo: /cozinh|chef|garcom|lanchonete|confeit|padeir|gastronom/, publicoNome: ['cliente', 'refeições servidas']
  },
  {
    id: 'clinica', nome: 'uma clínica', rotulo: 'Clínica', artigo: 'a', descricao: 'Agenda, equipamento caro e um responsável técnico habilitado. Margem boa, capital alto.',
    capital: 1500000, ativos: 0.75, publico: 9000, capacidade: 15000, ticket: { popular: 190, medio: 360, alto: 720 }, procura: { popular: 1.35, medio: 1, alto: 0.55 },
    variavel: 0.48, outros: 0.09, ponto: 160000, equipe: 12, salario: 4300, manutencao: 0.07, ciclo: 0.5,
    responsavel: { rotulo: 'responsável técnico (médico)', salario: 26000, ocupacao: /medic/ },
    doRamo: /medic|enferm|odont|fisio|psicolog|nutric|farmac/, publicoNome: ['paciente', 'atendimentos']
  },
  {
    id: 'academia', nome: 'uma academia', rotulo: 'Academia', artigo: 'a', descricao: 'Vive de carteira: aluno entra em janeiro, some em março. A evasão é o inimigo.',
    capital: 700000, ativos: 0.7, publico: 900, capacidade: 1500, ticket: { popular: 1000, medio: 1700, alto: 4200 }, procura: { popular: 1.5, medio: 1, alto: 0.4 },
    variavel: 0.12, outros: 0.26, ponto: 180000, equipe: 18, salario: 3000, manutencao: 0.08, ciclo: 1,
    doRamo: /educador_fisico|personal|atleta|jogador|treinador|lutador|nadador|fisio/, publicoNome: ['aluno', 'alunos']
  },
  {
    id: 'estudio', nome: 'um estúdio de gravação', rotulo: 'Estúdio', artigo: 'o', descricao: 'Horas vendidas, equipamento que envelhece, o nome de quem já gravou ali.',
    capital: 380000, ativos: 0.8, publico: 1400, capacidade: 2600, ticket: { popular: 125, medio: 230, alto: 520 }, procura: { popular: 1.4, medio: 1, alto: 0.45 },
    variavel: 0.08, outros: 0.14, ponto: 60000, equipe: 2, salario: 4200, manutencao: 0.1, ciclo: 0.9, cidadeGrande: true,
    doRamo: /music|cantor|produtor|instrument|banda|dj|compositor/, publicoNome: ['cliente', 'horas de estúdio']
  },
  {
    id: 'hotel', nome: 'um hotel', rotulo: 'Hotel', artigo: 'o', descricao: 'Vive de ocupação: o turismo da cidade, a estação, a crise que esvazia os quartos.',
    capital: 9000000, ativos: 0.85, publico: 14000, capacidade: 22000, ticket: { popular: 260, medio: 480, alto: 1300 }, procura: { popular: 1.3, medio: 1, alto: 0.45 },
    variavel: 0.33, outros: 0.16, ponto: 0, equipe: 55, salario: 3200, manutencao: 0.04, ciclo: 1.4, turismo: true, obra: true,
    doRamo: /hotel|turism|recepcion|camareir|gerente_hotel/, publicoNome: ['hóspede', 'diárias vendidas']
  },
  {
    id: 'loja', nome: 'uma loja', rotulo: 'Loja', artigo: 'a', descricao: 'Giro de estoque e margem bruta: a mercadoria leva mais da metade de cada venda.',
    capital: 300000, ativos: 0.4, publico: 9000, capacidade: 16000, ticket: { popular: 120, medio: 260, alto: 900 }, procura: { popular: 1.3, medio: 1, alto: 0.45 },
    variavel: 0.66, outros: 0.15, ponto: 110000, equipe: 6, salario: 2900, manutencao: 0.05, ciclo: 1.1,
    doRamo: /vendedor|comerci|lojista|gerente_loja/, publicoNome: ['cliente', 'vendas']
  },
  {
    id: 'museu', nome: 'um museu', rotulo: 'Museu', artigo: 'o', descricao: 'Quase nunca se paga com ingresso: vive de acervo, conservação, exposição — e de quem patrocina.',
    capital: 6000000, ativos: 0.5, publico: 60000, capacidade: 180000, ticket: { popular: 15, medio: 30, alto: 60 }, procura: { popular: 1.4, medio: 1, alto: 0.6 },
    variavel: 0.05, outros: 0.1, ponto: 0, equipe: 35, salario: 4500, manutencao: 0.04, ciclo: 0.7, turismo: true, apoio: 0.5, obra: true, cidadeGrande: true,
    doRamo: /curador|historiador|museolog|artista|pintor|escultor|restaurador|arquite/, publicoNome: ['visitante', 'visitantes']
  },
  {
    id: 'zoologico', nome: 'um zoológico', rotulo: 'Zoológico', artigo: 'o', descricao: 'Custa muito e responde por vidas: bem-estar animal, veterinários, biólogos, fiscalização.',
    capital: 22000000, ativos: 0.7, publico: 320000, capacidade: 700000, ticket: { popular: 20, medio: 35, alto: 70 }, procura: { popular: 1.35, medio: 1, alto: 0.55 },
    variavel: 0.06, outros: 0.08, ponto: 0, equipe: 110, salario: 4200, manutencao: 0.05, ciclo: 0.8, turismo: true, apoio: 0.12, obra: true, cidadeGrande: true,
    doRamo: /veterin|biolog|zootec|tratador/, publicoNome: ['visitante', 'visitantes']
  }
];

export const tipoDeEmpresa = (id: string) => TIPOS_DE_EMPRESA.find(t => t.id === id) ?? TIPOS_DE_EMPRESA[0];

export const NOME_PRECO_EMPRESA: Record<PrecoEmpresa, string> = { popular: 'popular', medio: 'médio', alto: 'alto padrão' };

/** Nomes que a casa sugere (o jogador pode trocar): o tipo e um nome de lugar ou de família. */
export const NOMES_DE_EMPRESA: Record<TipoEmpresa, string[]> = {
  restaurante: ['Casa {sobrenome}', 'Cozinha da Esquina', 'Bistrô do Largo', 'Mesa Posta', 'Brasa & Sal'],
  clinica: ['Clínica {sobrenome}', 'Centro Médico Vida Plena', 'Clínica Bem Cuidar', 'Instituto {sobrenome}'],
  academia: ['Academia {sobrenome}', 'Corpo em Movimento', 'Arena Fitness', 'Força Total'],
  estudio: ['Estúdio {sobrenome}', 'Estúdio Porão', 'Casa do Som', 'Fita Crua'],
  hotel: ['Hotel {sobrenome}', 'Grande Hotel do Centro', 'Hotel Mirante', 'Pousada do Porto'],
  loja: ['Loja {sobrenome}', 'Empório da Rua', 'Casa & Cia', 'Vitrine'],
  museu: ['Museu {sobrenome}', 'Instituto {sobrenome} de Arte', 'Museu da Cidade', 'Casa da Memória'],
  zoologico: ['Parque Zoológico {sobrenome}', 'Zoológico da Serra', 'Parque da Fauna', 'Bioparque']
};

/** Os nomes dos gestores contratados (texto; não viram pessoas da vida). */
export const GESTORES: [string, string][] = [
  ['Ricardo Menezes', 'Ana Paula Siqueira'], ['Fernando Lacerda', 'Juliana Prado'], ['Marcelo Tavares', 'Cláudia Vieira'],
  ['Eduardo Brandão', 'Patrícia Moura'], ['Sérgio Fontes', 'Renata Cardoso'], ['Paulo Rezende', 'Beatriz Arantes']
];
