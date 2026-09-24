/**
 * As três Forças Armadas: a mesma arquitetura (formação, antiguidade, cursos,
 * transferências, reserva), com nomes, escolas e lugares próprios.
 *
 * Fontes (regra real → abstração do jogo):
 *   - Lei 4.375/1964 (Serviço Militar): alistamento no ano dos 18; serviço
 *     inicial de 12 meses; engajamento e reengajamento como temporário.
 *   - Decreto 12.154/2024: serviço militar inicial feminino VOLUNTÁRIO, com
 *     alistamento desde 2025 e incorporação a partir de 2026 (Exército,
 *     Marinha e Aeronáutica).
 *   - Lei 13.954/2019: temporários ficam no máximo 8 anos; reserva
 *     remunerada a pedido com 35 anos de serviço.
 *   - Escolas: praças de carreira por concurso (EsSA no Exército, EEAR na
 *     Aeronáutica, formação de praças na Marinha — no jogo, a mesma escada:
 *     escola → sargento → subtenente/suboficial); oficiais pela academia
 *     (EsPCEx/AMAN, Escola Naval, AFA) ou, para graduados, pelos quadros
 *     técnico e de saúde.
 *
 * Postos, patentes e graduações são muitos; o jogo usa uma escada curta por
 * quadro. Idades-limite e interstícios são abstraídos (ver `militar.ts`).
 */

import type { Forca } from '../tipos';

export const NOME_FORCA: Record<Forca, string> = { exercito: 'o Exército', marinha: 'a Marinha', aeronautica: 'a Aeronáutica' };
export const SIGLA_DA: Record<Forca, string> = { exercito: 'do Exército', marinha: 'da Marinha', aeronautica: 'da Aeronáutica' };

/** Nomes de posto por Força (a ocupação do catálogo é a mesma; o nome muda). */
const POSTOS: Record<string, Partial<Record<Forca, [string, string]>>> = {
  soldado_ep: { marinha: ['marinheiro-recruta', 'marinheira-recruta'], aeronautica: ['soldado da Aeronáutica', 'soldado da Aeronáutica'] },
  cabo_ep: { marinha: ['cabo da Marinha', 'cabo da Marinha'], aeronautica: ['cabo da Aeronáutica', 'cabo da Aeronáutica'] },
  aluno_sargento: { marinha: ['aluno do curso de formação de praças da Marinha', 'aluna do curso de formação de praças da Marinha'], aeronautica: ['aluno da escola de especialistas da Aeronáutica', 'aluna da escola de especialistas da Aeronáutica'] },
  sargento: { marinha: ['sargento da Marinha', 'sargento da Marinha'], aeronautica: ['sargento da Aeronáutica', 'sargento da Aeronáutica'] },
  subtenente: { marinha: ['suboficial da Marinha', 'suboficial da Marinha'], aeronautica: ['suboficial da Aeronáutica', 'suboficial da Aeronáutica'] },
  cadete: { marinha: ['aspirante da Escola Naval', 'aspirante da Escola Naval'], aeronautica: ['cadete da Academia da Força Aérea', 'cadete da Academia da Força Aérea'] },
  aluno_oficial_tecnico: {},
  tenente: { marinha: ['primeiro-tenente da Marinha', 'primeira-tenente da Marinha'], aeronautica: ['tenente da Aeronáutica', 'tenente da Aeronáutica'] },
  capitao: { marinha: ['capitão-tenente', 'capitã-tenente'], aeronautica: ['capitão da Aeronáutica', 'capitã da Aeronáutica'] },
  major: { marinha: ['capitão de corveta', 'capitã de corveta'], aeronautica: ['major da Aeronáutica', 'major da Aeronáutica'] },
  tenente_coronel: { marinha: ['capitão de fragata', 'capitã de fragata'], aeronautica: ['tenente-coronel da Aeronáutica', 'tenente-coronel da Aeronáutica'] },
  coronel: { marinha: ['capitão de mar e guerra', 'capitã de mar e guerra'], aeronautica: ['coronel da Aeronáutica', 'coronel da Aeronáutica'] }
};

export function nomeDoPosto(ocupacaoId: string, forca: Forca | undefined, feminino: boolean): string | undefined {
  if (!forca || forca === 'exercito') return undefined;
  const n = POSTOS[ocupacaoId]?.[forca];
  return n ? (feminino ? n[1] : n[0]) : undefined;
}

export const OCUPACOES_DAS_FORCAS = new Set(Object.keys(POSTOS));

/** Onde cada Força costuma ter unidades (para servir e para transferir). */
export const GUARNICOES: Record<Forca, string[]> = {
  exercito: ['rio-branco-ac', 'manaus-am', 'tefe-am', 'belem-pa', 'maraba-pa', 'porto-velho-ro', 'boa-vista-rr', 'recife-pe', 'fortaleza-ce', 'natal-rn', 'salvador-ba', 'teresina-pi', 'sao-luis-ma',
    'brasilia-df', 'goiania-go', 'campo-grande-ms', 'corumba-ms', 'cuiaba-mt', 'belo-horizonte-mg', 'juiz-de-fora-mg', 'rio-de-janeiro-rj', 'sao-paulo-sp', 'campinas-sp', 'curitiba-pr', 'foz-do-iguacu-pr',
    'porto-alegre-rs', 'santa-maria-rs', 'santo-angelo-rs', 'pelotas-rs', 'florianopolis-sc', 'chapeco-sc', 'palmas-to', 'macapa-ap'],
  marinha: ['rio-de-janeiro-rj', 'niteroi-rj', 'salvador-ba', 'natal-rn', 'recife-pe', 'belem-pa', 'manaus-am', 'santos-sp', 'florianopolis-sc', 'pelotas-rs', 'vitoria-es', 'sao-luis-ma', 'corumba-ms', 'brasilia-df', 'fortaleza-ce'],
  aeronautica: ['brasilia-df', 'rio-de-janeiro-rj', 'sao-jose-dos-campos-sp', 'guarulhos-sp', 'canoas-rs', 'santa-maria-rs', 'natal-rn', 'recife-pe', 'fortaleza-ce', 'belem-pa', 'manaus-am', 'porto-velho-ro', 'boa-vista-rr', 'campo-grande-ms', 'anapolis-go', 'curitiba-pr', 'florianopolis-sc', 'salvador-ba']
};

/** Onde fica a escola de formação (o curso é longe de casa para quase todo mundo). */
export const ESCOLA: Record<Forca, { pracas: [string, string]; oficiais: [string, string] }> = {
  exercito: { pracas: ['escola de sargentos', 'rio-de-janeiro-rj'], oficiais: ['academia militar', 'rio-de-janeiro-rj'] },
  marinha: { pracas: ['escola de formação de praças', 'rio-de-janeiro-rj'], oficiais: ['Escola Naval', 'rio-de-janeiro-rj'] },
  aeronautica: { pracas: ['escola de especialistas', 'sao-jose-dos-campos-sp'], oficiais: ['Academia da Força Aérea', 'sao-paulo-sp'] }
};

/** Especialidades: o que a formação ensina e o que ela abre na vida civil. */
export const ESPECIALIDADES: Record<string, { nome: string; trilhaCivil?: string; pratica?: string }> = {
  combatente: { nome: 'combatente', trilhaCivil: 'vigilancia', pratica: 'atletismo' },
  saude: { nome: 'saúde', trilhaCivil: 'enfermagem', pratica: 'ciencias' },
  manutencao: { nome: 'manutenção de viaturas e equipamentos', trilhaCivil: 'mecanica', pratica: 'manual' },
  comunicacoes: { nome: 'comunicações e sistemas', trilhaCivil: 'ti', pratica: 'programacao' },
  administracao: { nome: 'administração e intendência', trilhaCivil: 'administrativo', pratica: 'exatas' },
  musica: { nome: 'música', trilhaCivil: 'musica', pratica: 'musica' }
};
