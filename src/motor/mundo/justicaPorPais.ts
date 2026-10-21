/**
 * REWORK 10 · CRI-01 — O PERFIL PENAL DE UM PAÍS: o que muda no caminho de um processo de um lugar para outro.
 *
 * GENERALIZAÇÃO DECLARADA. Não há aqui um código penal de cada um dos países: há as FAMÍLIAS jurídicas e as poucas
 * instituições que mudam o que um jogador vive num processo — e só elas:
 *
 *   família     direito romano-germânico (civil law: o juiz conduz a prova) ou anglo-saxão (common law: júri,
 *               acusação e defesa disputam; acordos são o caminho comum);
 *   acordo      negociar a pena antes do julgamento: amplo nos EUA (plea bargaining, a imensa maioria dos casos
 *               federais termina assim); limitado onde a lei criou uma porta estreita (Brasil: acordo de não
 *               persecução penal, Lei 13.964/2019; Alemanha: Verständigung, StPO §257c; França: CRPC; Itália:
 *               patteggiamento; Espanha: conformidad; Reino Unido: guilty plea com redução); nenhum no resto;
 *   colaboração reduzir a pena por cooperar (a delação premiada brasileira, Lei 12.850/2013; o cooperating witness
 *               americano; os pentiti italianos);
 *   fiança      aguardar o julgamento solto pagando (comum no direito anglo-saxão; no Brasil, para os crimes que
 *               a admitem); na Europa continental, a liberdade provisória é com condições, não com dinheiro;
 *   severidade  o tamanho relativo das penas de prisão (os países nórdicos, as menores; os EUA, as maiores do
 *               mundo rico — World Prison Brief e as médias de pena por crime);
 *   multa       a multa como resposta principal ao que é leve (os dias-multa europeus e o Japão);
 *   reabilitação quantos anos depois do fim da pena o registro deixa de pesar (Brasil: dois anos, CP art. 94).
 *
 * Um país sem exceção declarada fica com a forma da sua família jurídica e da sua região.
 */

import { paisDoCatalogo } from './registro';

export interface PerfilPenal {
  familia: 'civil' | 'common';
  acordo: 'amplo' | 'limitado' | 'nao';
  colaboracao: boolean;
  fianca: boolean;
  severidade: number;
  multa: boolean;
  reabilitacaoAnos: number;
  /** A defesa pública, em palavras ("a Defensoria Pública", "um defensor público"). */
  defensoria: string;
}

/** Os países de direito anglo-saxão (common law) do catálogo (e os mistos em que o processo penal segue o modelo inglês). */
const COMMON = new Set(['US', 'GB', 'IE', 'CA', 'AU', 'NZ', 'IN', 'PK', 'BD', 'NG', 'GH', 'KE', 'UG', 'TZ', 'ZM', 'ZW', 'ZA', 'BW', 'NA', 'SG', 'MY', 'JM', 'TT', 'BS', 'BB', 'BZ', 'GY', 'MT', 'CY', 'LK', 'MW', 'SL', 'LR', 'GM']);
const ACORDO_LIMITADO = new Set(['BR', 'DE', 'FR', 'IT', 'ES', 'PT', 'GB', 'IE', 'CA', 'AU', 'NZ', 'AR', 'CL', 'CO', 'MX', 'PE', 'NL', 'BE', 'AT', 'CH', 'PL', 'JP', 'KR']);
const SEM_COLABORACAO = new Set(['NO', 'SE', 'FI', 'DK', 'IS']);
const NORDICOS = new Set(['NO', 'SE', 'FI', 'DK', 'IS']);
const EUROPA_OCIDENTAL = new Set(['PT', 'ES', 'FR', 'DE', 'NL', 'BE', 'LU', 'AT', 'CH', 'IT', 'IE', 'GB', 'MT', 'CY', 'GR', 'SI']);
const DIAS_MULTA = new Set(['DE', 'AT', 'CH', 'FR', 'PT', 'ES', 'NO', 'SE', 'FI', 'DK', 'IS', 'NL', 'BE', 'LU', 'JP', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'EE', 'LV', 'LT']);
const DEFENSORIA: Record<string, string> = {
  BR: 'a Defensoria Pública', US: 'um defensor público', PT: 'um defensor oficioso', AR: 'a Defensoría Oficial', CL: 'a Defensoría Penal Pública', MX: 'a Defensoría Pública', ES: 'um advogado de ofício', FR: 'um advogado de ofício'
};
const REABILITACAO: Record<string, number> = { BR: 2, PT: 5, ES: 3, FR: 5, DE: 5, IT: 5, GB: 4, US: 7, JP: 5, AR: 10, CL: 5 };

/** O perfil penal de um país (a família jurídica, as instituições que mudam o caminho de um processo). */
export function perfilPenal(pais: string): PerfilPenal {
  const regiao = (() => { try { return paisDoCatalogo(pais).regiao; } catch { return 'america_sul' as const; } })();
  const familia = COMMON.has(pais) ? 'common' : 'civil';
  const acordo = pais === 'US' ? 'amplo' : ACORDO_LIMITADO.has(pais) || familia === 'common' ? 'limitado' : 'nao';
  const severidade = pais === 'US' ? 1.4 : NORDICOS.has(pais) ? 0.55 : EUROPA_OCIDENTAL.has(pais) ? 0.75 : pais === 'JP' ? 0.9 : regiao === 'europa' ? 0.85 : regiao === 'oceania' || pais === 'CA' ? 0.8 : 1;
  return {
    familia,
    acordo,
    colaboracao: !SEM_COLABORACAO.has(pais),
    fianca: familia === 'common' || pais === 'BR' || regiao === 'america_sul' || regiao === 'america_central_caribe',
    severidade,
    multa: DIAS_MULTA.has(pais),
    reabilitacaoAnos: REABILITACAO[pais] ?? 5,
    defensoria: DEFENSORIA[pais] ?? (familia === 'common' ? 'um defensor público' : 'um defensor nomeado pelo tribunal')
  };
}
