/**
 * NACIONALIDADE: quem nasce de quê, e como alguém de fora vira daqui.
 *
 * Abstração declarada (o VIDA não é um simulador jurídico):
 *  - por SANGUE: todo filho recebe a nacionalidade dos pais. Na prática há
 *    registro consular, prazos e opções; aqui ela vem — todos os países
 *    vivíveis transmitem a nacionalidade aos filhos nascidos fora, de algum
 *    modo;
 *  - por SOLO: 'sim' (quem nasce no território é do país), 'condicional'
 *    (só se um dos pais mora legalmente lá há algum tempo — `anosDosPais`),
 *    'nao';
 *  - NATURALIZAÇÃO: depois de `anos` morando no país (menos para quem vem de
 *    certos países ou blocos — `preferencia`), a pessoa pode pedir; o pedido
 *    leva um ano. Onde a dupla nacionalidade não é aceita (`dupla: false`),
 *    naturalizar-se custa a nacionalidade anterior — o jogo avisa antes.
 *
 * Fontes (lei de nacionalidade de cada país, consultadas em 2026-10):
 *  BR Constituição art. 12; Lei 13.445/2017 art. 65 (4 anos) · AR Ley 346 (2 anos) · CL Constituição art. 10 (5 anos) ·
 *  UY Constituição arts. 74-75 (cidadania legal, 3 a 5 anos) · CO Constituição art. 96; Ley 43/1993 (5 anos) ·
 *  PE Ley 26.574 (2 anos) · US 14ª Emenda; INA §316 (5 anos) · CA Citizenship Act (3 de 5 anos) ·
 *  MX Constituição art. 30; Ley de Nacionalidad art. 20 (5 anos; 2 para latino-americanos e ibéricos) ·
 *  CR Constituição art. 14 (7 anos; 5 para latino-americanos e espanhóis) · DO Constituição de 2010 art. 18 (solo só com pais residentes) ·
 *  PT Lei da Nacionalidade, revisão de 2026 (10 anos; 7 para CPLP e UE; solo com pais residentes) ·
 *  ES Código Civil art. 22 (10 anos; 2 para ibero-americanos e portugueses) · FR Code civil art. 21-17 (5 anos) ·
 *  DE StAG reformada em 2024 (5 anos; dupla aceita; solo se um dos pais tem 5 anos de residência) ·
 *  IT Lei 91/1992 (10 anos; 4 para UE) · GB British Nationality Act 1981 (solo se um dos pais é assentado; 6 anos) ·
 *  ZA Citizenship Act 88/1995 (5 anos de residência permanente) · NG Constituição 1999 s.27 (15 anos) ·
 *  AO Lei 2/16 (10 anos; dupla na Constituição art. 9) · KE Constituição 2010 art. 15 (7 anos; dupla aceita) ·
 *  MA Código da Nacionalidade (5 anos) · JP Lei da Nacionalidade art. 5 (5 anos; escolha de uma só) ·
 *  CN Lei da Nacionalidade de 1980 (naturalização rara; sem dupla) · IN Citizenship Act 1955 (11 de 14 anos; sem dupla) ·
 *  KR Lei da Nacionalidade (5 anos; dupla restrita) · AU Citizenship Act 2007 (4 anos; solo se um dos pais é cidadão ou residente) ·
 *  NZ Citizenship Act 1977 (5 anos; solo se um dos pais é cidadão ou residente).
 */

export interface RegraDeCidadania {
  solo: 'sim' | 'condicional' | 'nao';
  /** Para o solo condicional: anos de residência de um dos pais. */
  anosDosPais?: number;
  /** Anos morando no país para pedir a naturalização (ausente: na prática não acontece). */
  anos?: number;
  /** Menos anos para quem é de certos países ou blocos. */
  preferencia?: { paises?: string[]; blocos?: string[]; anos: number };
  /** O país aceita que o naturalizado mantenha a nacionalidade anterior. */
  dupla: boolean;
}

const IBERO = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'UY', 'VE', 'ES', 'PT', 'GQ', 'PH', 'AD'];
const CPLP = ['AO', 'BR', 'CV', 'GW', 'GQ', 'MZ', 'PT', 'ST', 'TL'];

export const CIDADANIA: Record<string, RegraDeCidadania> = {
  BR: { solo: 'sim', anos: 4, preferencia: { paises: ['PT'], anos: 1 }, dupla: true },
  AR: { solo: 'sim', anos: 2, dupla: true },
  CL: { solo: 'sim', anos: 5, dupla: true },
  UY: { solo: 'sim', anos: 5, dupla: true },
  CO: { solo: 'condicional', anosDosPais: 1, anos: 5, preferencia: { paises: IBERO, anos: 2 }, dupla: true },
  PE: { solo: 'sim', anos: 2, dupla: true },
  US: { solo: 'sim', anos: 5, dupla: true },
  CA: { solo: 'sim', anos: 3, dupla: true },
  MX: { solo: 'sim', anos: 5, preferencia: { paises: IBERO, anos: 2 }, dupla: true },
  CR: { solo: 'sim', anos: 7, preferencia: { paises: IBERO, anos: 5 }, dupla: true },
  DO: { solo: 'condicional', anosDosPais: 1, anos: 2, dupla: true },
  PT: { solo: 'condicional', anosDosPais: 5, anos: 10, preferencia: { paises: CPLP, blocos: ['ue'], anos: 7 }, dupla: true },
  ES: { solo: 'nao', anos: 10, preferencia: { paises: IBERO, anos: 2 }, dupla: true },
  FR: { solo: 'nao', anos: 5, dupla: true },
  DE: { solo: 'condicional', anosDosPais: 5, anos: 5, dupla: true },
  IT: { solo: 'nao', anos: 10, preferencia: { blocos: ['ue'], anos: 4 }, dupla: true },
  GB: { solo: 'condicional', anosDosPais: 5, anos: 6, dupla: true },
  ZA: { solo: 'condicional', anosDosPais: 5, anos: 10, dupla: true },
  NG: { solo: 'nao', anos: 15, dupla: true },
  AO: { solo: 'nao', anos: 10, dupla: true },
  KE: { solo: 'nao', anos: 7, dupla: true },
  MA: { solo: 'nao', anos: 5, dupla: true },
  JP: { solo: 'nao', anos: 5, dupla: false },
  CN: { solo: 'nao', dupla: false },
  IN: { solo: 'nao', anos: 12, dupla: false },
  KR: { solo: 'nao', anos: 5, dupla: false },
  AU: { solo: 'condicional', anosDosPais: 1, anos: 4, dupla: true },
  NZ: { solo: 'condicional', anosDosPais: 1, anos: 5, dupla: true }
};

const PADRAO: RegraDeCidadania = { solo: 'nao', anos: 10, dupla: true };
export const regraDeCidadania = (pais: string): RegraDeCidadania => CIDADANIA[pais] ?? PADRAO;

/** As nacionalidades de quem nasce num país, filho de pais com estas nacionalidades (e há quantos anos os pais moram lá). */
export function nacionalidadesAoNascer(paisNatal: string, dosPais: string[], anosDosPaisNoPais = 99): string[] {
  const r = regraDeCidadania(paisNatal);
  const doSolo = r.solo === 'sim' || (r.solo === 'condicional' && anosDosPaisNoPais >= (r.anosDosPais ?? 99));
  const out = [...new Set(dosPais)];
  if (doSolo || out.length === 0) out.unshift(paisNatal);
  return [...new Set(out)];
}

/** Quantos anos de residência este país pede de alguém com estas nacionalidades (undefined: não naturaliza). */
export function anosParaNaturalizar(pais: string, nacionalidades: string[], blocosDe: (p: string) => string[]): number | undefined {
  const r = regraDeCidadania(pais);
  if (r.anos === undefined) return undefined;
  const pref = r.preferencia;
  if (pref && nacionalidades.some(n => pref.paises?.includes(n) || blocosDe(n).some(b => pref.blocos?.includes(b)))) return pref.anos;
  return r.anos;
}
