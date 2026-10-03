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
 *
 * MUNDO: a Força é a do país onde a pessoa mora. O nome vem do perfil
 * (`perfil.militar.forcas` — no Brasil, "o Exército", "a Marinha", "a
 * Aeronáutica"); as guarnições e as escolas escolhidas à mão são as
 * brasileiras (por país, em GUARNICOES_DO_PAIS e ESCOLAS_DO_PAIS); outro país
 * usa as próprias cidades (a capital, as sedes, o litoral) e escolas com nome
 * genérico — nunca o nome de uma academia de verdade que o perfil não traz.
 */

import type { Forca } from '../tipos';
import { paisCorrente } from '../mundo/moeda';
import { perfilDoPais, temPerfil } from '../mundo/registro';
import { capitalDoPais, cidadesDoPais } from './lugares';

const PADRAO: Record<Forca, string> = { exercito: 'o Exército', marinha: 'a Marinha', aeronautica: 'a Aeronáutica' };
/** O nome da Força no país (com artigo): "o Exército", "a Armada da Colômbia". O país padrão é o da vida em processamento. */
export function nomeDaForca(f: Forca, pais = paisCorrente()): string {
  return (temPerfil(pais) ? perfilDoPais(pais).militar.forcas[f] : undefined) ?? PADRAO[f];
}
/** "do Exército", "da Armada da Colômbia". */
export const daForca = (f: Forca, pais = paisCorrente()) => nomeDaForca(f, pais).replace(/^o /, 'do ').replace(/^a /, 'da ').replace(/^os /, 'dos ').replace(/^as /, 'das ');

/** O nome da Força (lido do país da vida em processamento — quem lê `NOME_FORCA[f]` fala do país certo). */
export const NOME_FORCA: Readonly<Record<Forca, string>> = {
  get exercito() { return nomeDaForca('exercito'); }, get marinha() { return nomeDaForca('marinha'); }, get aeronautica() { return nomeDaForca('aeronautica'); }
};
export const SIGLA_DA: Readonly<Record<Forca, string>> = {
  get exercito() { return daForca('exercito'); }, get marinha() { return daForca('marinha'); }, get aeronautica() { return daForca('aeronautica'); }
};

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

export function nomeDoPosto(ocupacaoId: string, forca: Forca | undefined, feminino: boolean, pais = paisCorrente()): string | undefined {
  if (!forca || forca === 'exercito') return undefined;
  const n = POSTOS[ocupacaoId]?.[forca];
  if (!n) return undefined;
  const nome = feminino ? n[1] : n[0];
  // Fora do país das escolas escolhidas à mão, a Força leva o nome do país, e a escola, um nome genérico.
  if (ESCOLAS_DO_PAIS[pais]) return nome;
  return nome.replace(/ da (Marinha|Aeronáutica)\b/, ` ${daForca(forca, pais)}`).replace('Escola Naval', 'escola naval').replace('Academia da Força Aérea', 'academia da força aérea');
}

export const OCUPACOES_DAS_FORCAS = new Set(Object.keys(POSTOS));

/** Onde cada Força costuma ter unidades no Brasil (para servir e para transferir). */
const GUARNICOES_BR: Record<Forca, string[]> = {
  exercito: ['rio-branco-ac', 'manaus-am', 'tefe-am', 'belem-pa', 'maraba-pa', 'porto-velho-ro', 'boa-vista-rr', 'recife-pe', 'fortaleza-ce', 'natal-rn', 'salvador-ba', 'teresina-pi', 'sao-luis-ma',
    'brasilia-df', 'goiania-go', 'campo-grande-ms', 'corumba-ms', 'cuiaba-mt', 'belo-horizonte-mg', 'juiz-de-fora-mg', 'rio-de-janeiro-rj', 'sao-paulo-sp', 'campinas-sp', 'curitiba-pr', 'foz-do-iguacu-pr',
    'porto-alegre-rs', 'santa-maria-rs', 'santo-angelo-rs', 'pelotas-rs', 'florianopolis-sc', 'chapeco-sc', 'palmas-to', 'macapa-ap'],
  marinha: ['rio-de-janeiro-rj', 'niteroi-rj', 'salvador-ba', 'natal-rn', 'recife-pe', 'belem-pa', 'manaus-am', 'santos-sp', 'florianopolis-sc', 'pelotas-rs', 'vitoria-es', 'sao-luis-ma', 'corumba-ms', 'brasilia-df', 'fortaleza-ce'],
  aeronautica: ['brasilia-df', 'rio-de-janeiro-rj', 'sao-jose-dos-campos-sp', 'guarulhos-sp', 'canoas-rs', 'santa-maria-rs', 'natal-rn', 'recife-pe', 'fortaleza-ce', 'belem-pa', 'manaus-am', 'porto-velho-ro', 'boa-vista-rr', 'campo-grande-ms', 'anapolis-go', 'curitiba-pr', 'florianopolis-sc', 'salvador-ba']
};

/** Onde fica a escola de formação no Brasil (o curso é longe de casa para quase todo mundo). */
const ESCOLA_BR: Record<Forca, { pracas: [string, string]; oficiais: [string, string] }> = {
  exercito: { pracas: ['escola de sargentos', 'rio-de-janeiro-rj'], oficiais: ['academia militar', 'rio-de-janeiro-rj'] },
  marinha: { pracas: ['escola de formação de praças', 'rio-de-janeiro-rj'], oficiais: ['Escola Naval', 'rio-de-janeiro-rj'] },
  aeronautica: { pracas: ['escola de especialistas', 'sao-jose-dos-campos-sp'], oficiais: ['Academia da Força Aérea', 'sao-paulo-sp'] }
};

/** Guarnições e escolas escolhidas à mão, por país (os ids de cidade estão nos saves). */
const GUARNICOES_DO_PAIS: Record<string, Record<Forca, string[]>> = { BR: GUARNICOES_BR };
const ESCOLAS_DO_PAIS: Record<string, Record<Forca, { pracas: [string, string]; oficiais: [string, string] }>> = { BR: ESCOLA_BR };

/** O país tem escolas e guarnições escolhidas à mão (e as siglas delas podem aparecer no texto). */
export const temEscolasProprias = (pais = paisCorrente()) => !!ESCOLAS_DO_PAIS[pais];

const cacheGuarnicoes = new Map<string, Record<Forca, string[]>>();
/**
 * Onde cada Força tem unidades no país: as escolhidas à mão, ou — num país
 * sem lista — a capital, as sedes das divisões e as metrópoles (o Exército),
 * as cidades do litoral (a Marinha; sem litoral, a capital), a capital e as
 * metrópoles (a Força Aérea).
 */
export function guarnicoesDoPais(pais = paisCorrente()): Record<Forca, string[]> {
  const curada = GUARNICOES_DO_PAIS[pais];
  if (curada) return curada;
  let g = cacheGuarnicoes.get(pais);
  if (!g) {
    const cs = cidadesDoPais(pais);
    const capital = capitalDoPais(pais)?.id;
    const unicos = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];
    const exercito = unicos([capital, ...cs.filter(m => m.capital || m.perfil === 'metropole').map(m => m.id)]).slice(0, 14);
    const litoral = cs.filter(m => m.litoral && (m.capital || m.perfil === 'metropole' || m.perfil === 'polo')).map(m => m.id);
    const marinha = unicos(litoral.length ? litoral : [capital]).slice(0, 8);
    const aeronautica = unicos([capital, ...cs.filter(m => m.perfil === 'metropole').map(m => m.id)]).slice(0, 8);
    g = { exercito: exercito.length ? exercito : unicos([capital]), marinha, aeronautica };
    if (cs.length) cacheGuarnicoes.set(pais, g);
  }
  return g;
}
/** As guarnições do país da vida em processamento (no Brasil, a lista de sempre). */
export const GUARNICOES: Readonly<Record<Forca, string[]>> = {
  get exercito() { return guarnicoesDoPais().exercito; }, get marinha() { return guarnicoesDoPais().marinha; }, get aeronautica() { return guarnicoesDoPais().aeronautica; }
};

/** A escola de formação da Força no país: [nome, cidade]. Sem escola escolhida à mão, um nome genérico na capital (ou no litoral, a naval). */
export function escolaDoPais(f: Forca, pais = paisCorrente()): { pracas: [string, string]; oficiais: [string, string] } {
  const curada = ESCOLAS_DO_PAIS[pais];
  if (curada) return curada[f];
  const capital = capitalDoPais(pais)?.id ?? '';
  const onde = f === 'marinha' ? guarnicoesDoPais(pais).marinha[0] ?? capital : capital;
  const nomes: Record<Forca, [string, string]> = {
    exercito: ['escola de sargentos', 'academia militar'], marinha: ['escola de formação de praças', 'escola naval'], aeronautica: ['escola de especialistas', 'academia da força aérea']
  };
  return { pracas: [nomes[f][0], onde], oficiais: [nomes[f][1], onde] };
}
export const ESCOLA: Readonly<Record<Forca, { pracas: [string, string]; oficiais: [string, string] }>> = {
  get exercito() { return escolaDoPais('exercito'); }, get marinha() { return escolaDoPais('marinha'); }, get aeronautica() { return escolaDoPais('aeronautica'); }
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
