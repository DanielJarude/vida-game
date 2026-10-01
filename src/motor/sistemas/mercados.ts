/**
 * Mercados profissionais: a que MUNDO uma trajetória pertence (pacote
 * pós-REWORK 3, P0 de vazamento entre carreiras).
 *
 * Ter "um trabalho" não faz de toda trajetória um emprego comum. O jogador
 * profissional de futebol não recebe proposta de "concorrente para a mesma
 * função" com entrevista; recebe proposta de CLUBE (`esporte`). A atriz
 * recebe teste e produção (`cena`, `audiovisual`); a pesquisadora, bolsa e
 * projeto (`academia`); o dono de negócio, cliente e contrato (`negocio`).
 *
 *   emprego          vagas, entrevistas, promoções, concorrentes, troca de emprego
 *   servico_publico  concurso, remoção, licença (portas próprias)
 *   esporte          clube, contrato, renovação, transferência, dispensa
 *   arte             teste, produção, proposta, agente, palco
 *   academia         bolsa, projeto, orientação, concurso de docente
 *   negocio          clientes, caixa, sócio, venda
 *   autonomo         freguesia, clientes, preço
 *   militar          posto, curso, transferência
 *   politica         mandato, partido, eleição
 *   rural            terra, safra, cooperativa
 *
 * FONTE ÚNICA de quem recebe as PORTAS DO EMPREGO COMUM (`oportunidadeCoerente`):
 * o gerador consulta antes de criar; a virada do ano tira as que deixaram de
 * caber (inclusive as de saves antigos); a ação de aceitar recusa com o motivo.
 * Exceção: quem não tem trabalho principal (ou o tem no mercado de emprego)
 * recebe as portas comuns normalmente.
 */

import type { Emprego, Oportunidade, TipoOportunidade, Vida } from '../tipos';
import { ocupacaoOuNula, type Ocupacao } from '../dados/ocupacoes';

export type Mercado = 'emprego' | 'servico_publico' | 'esporte' | 'arte' | 'academia' | 'negocio' | 'autonomo' | 'militar' | 'politica' | 'rural';

const ACADEMIA = new Set(['academia', 'pesquisa', 'docencia_superior']);
const MILITARES = /^(exercito|marinha|aeronautica)/;

export function mercadoDe(oc: Ocupacao): Mercado {
  if (oc.trilha === 'atleta') return 'esporte';
  if (oc.entrada === 'eleicao' || oc.trilha === 'politica') return 'politica';
  if (oc.setor === 'criativo' && oc.entrada === 'oportunidade') return 'arte';
  if (ACADEMIA.has(oc.trilha)) return 'academia';
  if (oc.contrato === 'militar' || MILITARES.test(oc.trilha)) return 'militar';
  if (oc.entrada === 'negocio') return 'negocio';
  if (oc.id === 'produtor_rural') return 'rural';
  if (oc.contrato === 'servidor') return 'servico_publico';
  if (oc.contrato === 'autonomo' || (oc.contrato === 'informal' && !!oc.entrada)) return 'autonomo';
  return 'emprego';
}

/** O mercado de um trabalho (o principal, por padrão). */
export function mercadoDoTrabalho(v: Vida, e: Emprego | undefined = v.trabalho.atual): Mercado | undefined {
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  return oc ? mercadoDe(oc) : undefined;
}

/** As carreiras com mercado próprio: não recebem as portas do emprego comum. */
export const MERCADOS_PROPRIOS: Mercado[] = ['esporte', 'arte', 'academia', 'militar', 'politica'];

/** Portas do emprego comum (vaga, indicação, proposta de concorrente, aprendiz, estágio, temporário, reinserção). */
export const PORTAS_DO_EMPREGO: TipoOportunidade[] = ['proposta', 'indicacao', 'vaga', 'reinsercao', 'aprendiz', 'estagio', 'temporario'];

/**
 * A porta cabe na trajetória de agora? As portas próprias de cada mundo
 * (clube, teste, bolsa, convite) sempre cabem — quem as gera já olhou o
 * estado. As do emprego comum só cabem para quem não está numa carreira de
 * mercado próprio; a "proposta de um concorrente" só para quem está num
 * emprego comum (é uma troca de emprego).
 */
export function oportunidadeCoerente(v: Vida, o: Pick<Oportunidade, 'tipo'>): true | string {
  if (!PORTAS_DO_EMPREGO.includes(o.tipo)) return true;
  const m = mercadoDoTrabalho(v);
  if (o.tipo === 'proposta') return m === 'emprego' ? true : motivoDoMercado(m);
  if (m && MERCADOS_PROPRIOS.includes(m)) return motivoDoMercado(m);
  return true;
}

function motivoDoMercado(m: Mercado | undefined): string {
  switch (m) {
    case 'esporte': return 'No futebol profissional, quem procura você é clube: proposta, contrato, transferência — não entrevista de emprego.';
    case 'arte': return 'Na carreira artística, o trabalho chega por teste, produção e convite — não por vaga de emprego.';
    case 'academia': return 'Na vida acadêmica, as portas são bolsa, projeto e concurso de docente.';
    case 'militar': return 'Na carreira militar, o que muda é posto, curso e transferência.';
    case 'politica': return 'No mandato, a vida é outra: a porta de emprego espera o fim dele.';
    default: return 'Proposta de concorrente é troca de emprego: não se aplica a quem trabalha por conta, no serviço público ou no próprio negócio.';
  }
}

/** As portas abertas que valem agora: a MESMA lista para a tela e para o motor. */
export const oportunidadesAbertas = (v: Vida): Oportunidade[] => v.caminhos.oportunidades.filter(o => o.tFim > v.t && oportunidadeCoerente(v, o) === true);
