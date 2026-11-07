/**
 * VIDA 12.9.1 — O COLÉGIO ELEITORAL DOS EUA (dados). Puro: só tipos.
 *
 * DELEGADOS por estado e pelo Distrito de Colúmbia — a distribuição do Censo de 2020, válida para as eleições de 2024 e
 * 2028 (3 U.S.C. §§ 3–4; National Archives, "Distribution of Electoral Votes", 2024–2028): 538 no total, 270 para vencer
 * (maioria absoluta; 23ª Emenda dá 3 ao DC). A redistribuição do Censo de 2030 (eleições de 2032 em diante) ainda não foi
 * publicada: o jogo mantém a de 2020 e diz isso.
 *
 * ATRIBUIÇÃO: em 48 estados e no DC, quem vence no estado leva todos os delegados. MAINE (2 pelo estado + 1 por cada um dos
 * 2 distritos) e NEBRASKA (2 pelo estado + 1 por cada um dos 3 distritos) dividem pelo método dos distritos congressionais
 * (Maine Rev. Stat. tít. 21-A §802; Neb. Rev. Stat. §32-1038).
 *
 * CONTINGÊNCIA (12ª Emenda): sem maioria no Colégio, a Câmara dos Representantes escolhe entre os três mais votados no
 * Colégio, UM voto por delegação estadual (o DC não vota), e vence quem tiver a maioria das delegações (26 de 50).
 *
 * A GEOGRAFIA ELEITORAL (`lean`, em pontos percentuais): o quanto o estado vota mais à esquerda (+) ou à direita (−) que o
 * país — a margem do estado na eleição de 2024 menos a margem nacional (D −1,5), arredondada. É o que o jogo aplica ao
 * espectro do partido de cada candidato (os EUA do jogo usam partidos genéricos, não Democratas e Republicanos).
 */
export interface EstadoNoColegio {
  uf: string;
  nome: string;
  delegados: number;
  /** Inclinação (pp): + vota mais à esquerda que o país, − mais à direita. */
  lean: number;
  /** Maine e Nebraska: os distritos (1 delegado cada) e a inclinação de cada um; os 2 restantes vão pelo estado. */
  distritos?: { id: string; lean: number }[];
}

export const TOTAL_DE_DELEGADOS = 538;
export const MAIORIA_NO_COLEGIO = 270;
export const DELEGACOES_NA_CAMARA = 50;
export const MAIORIA_NA_CAMARA = 26;

const e = (uf: string, nome: string, delegados: number, margem2024: number, distritos?: { id: string; margem: number }[]): EstadoNoColegio =>
  ({ uf, nome, delegados, lean: Math.round((margem2024 + 1.5) * 10) / 10, ...(distritos ? { distritos: distritos.map(d => ({ id: d.id, lean: Math.round((d.margem + 1.5) * 10) / 10 })) } : {}) });

/** Margem 2024 (D − R, pp, arredondada) por estado; distritos de ME e NE. */
export const ESTADOS_NO_COLEGIO: readonly EstadoNoColegio[] = [
  e('AL', 'Alabama', 9, -30.5), e('AK', 'Alasca', 3, -13.1), e('AZ', 'Arizona', 11, -5.5), e('AR', 'Arkansas', 6, -30.6),
  e('CA', 'Califórnia', 54, 20.1), e('CO', 'Colorado', 10, 11.0), e('CT', 'Connecticut', 7, 14.5), e('DE', 'Delaware', 3, 14.7),
  e('DC', 'Distrito de Colúmbia', 3, 83.8), e('FL', 'Flórida', 30, -13.1), e('GA', 'Geórgia', 16, -2.2), e('HI', 'Havaí', 4, 23.1),
  e('ID', 'Idaho', 4, -36.5), e('IL', 'Illinois', 19, 10.9), e('IN', 'Indiana', 11, -19.0), e('IA', 'Iowa', 6, -13.2),
  e('KS', 'Kansas', 6, -16.1), e('KY', 'Kentucky', 8, -30.5), e('LA', 'Luisiana', 8, -22.0),
  e('ME', 'Maine', 4, 7.0, [{ id: 'ME-1', margem: 24.0 }, { id: 'ME-2', margem: -9.1 }]),
  e('MD', 'Maryland', 10, 28.5), e('MA', 'Massachusetts', 11, 25.2), e('MI', 'Michigan', 15, -1.4), e('MN', 'Minnesota', 10, 4.2),
  e('MS', 'Mississippi', 6, -22.9), e('MO', 'Missouri', 10, -18.4), e('MT', 'Montana', 4, -19.9),
  e('NE', 'Nebraska', 5, -20.4, [{ id: 'NE-1', margem: -12.0 }, { id: 'NE-2', margem: 4.6 }, { id: 'NE-3', margem: -51.0 }]),
  e('NV', 'Nevada', 6, -3.1), e('NH', 'Nova Hampshire', 4, 2.8), e('NJ', 'Nova Jersey', 14, 5.9), e('NM', 'Novo México', 5, 6.0),
  e('NY', 'Nova York', 28, 12.6), e('NC', 'Carolina do Norte', 16, -3.2), e('ND', 'Dakota do Norte', 3, -36.5), e('OH', 'Ohio', 17, -11.2),
  e('OK', 'Oklahoma', 7, -34.3), e('OR', 'Oregon', 8, 14.3), e('PA', 'Pensilvânia', 19, -1.7), e('RI', 'Rhode Island', 4, 13.8),
  e('SC', 'Carolina do Sul', 9, -17.8), e('SD', 'Dakota do Sul', 3, -29.2), e('TN', 'Tennessee', 11, -29.7), e('TX', 'Texas', 40, -13.7),
  e('UT', 'Utah', 6, -21.6), e('VT', 'Vermont', 3, 31.5), e('VA', 'Virgínia', 13, 5.8), e('WA', 'Washington', 12, 18.2),
  e('WV', 'Virgínia Ocidental', 4, -41.9), e('WI', 'Wisconsin', 10, -0.9), e('WY', 'Wyoming', 3, -45.8)
];

/** O lado do partido no espectro (+1 esquerda, −1 direita, 0 centro/terceira via) e o quanto pesa a geografia nele. */
export const LADO_DO_PARTIDO: Record<string, number> = {
  '~esquerda': 0.9, '~centro_esquerda': 1, '~verde': 0.6, '~centro': 0, '~regional': 0, '~centro_direita': -1, '~direita': -0.9
};
