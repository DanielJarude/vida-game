/**
 * VIDA 15 · A INTERRUPÇÃO DA GRAVIDEZ PELA LEI DE CADA PAÍS (catálogo puro). A situação jurídica de cada país do jogo,
 * resumida no que muda a vida de quem decide: se é possível a pedido (e até quando), sob que permissivos, ou se é crime.
 * Fontes (situação até 2025): BR — Código Penal arts. 124–128 e STF ADPF 54 (anencefalia); PT — Lei 16/2007 (10 semanas);
 * ES — LO 2/2010, reforma LO 1/2023 (14 semanas); FR — Lei de 2022 (14 semanas), Constituição desde 2024; DE — StGB §218a
 * (12 semanas, com aconselhamento obrigatório e espera de 3 dias); IT — Legge 194/1978 (90 dias); GB — Abortion Act 1967
 * (24 semanas, dois médicos); AR — Ley 27.610/2020 (14 semanas); UY — Ley 18.987/2012 (12 semanas); CO — Corte
 * Constitucional C-055/2022 (24 semanas); MX — SCJN 2021/2023 (descriminalizado; 12 semanas na maior parte); CL — Ley
 * 21.030/2017 (três causais); PE — aborto terapêutico (CP art. 119); CR — aborto terapêutico (CP art. 121, norma técnica
 * 2019); DO — proibição total (CP); US — Dobbs v. Jackson (2022): depende do estado; CA — sem crime desde R v. Morgentaler
 * (1988); JP — Lei de Proteção da Saúde Materna (22 semanas); CN — a pedido; IN — MTP Act, emenda 2021 (20/24 semanas);
 * KR — descriminalizado desde 2021 (TC 2019); AU e NZ — descriminalizado (NZ: Abortion Legislation Act 2020, 20 semanas);
 * ZA — Choice on Termination of Pregnancy Act 1996 (12 semanas); NG — só para salvar a vida (CP/CC); KE — Constituição 2010
 * art. 26 (risco à vida ou à saúde); AO — Código Penal 2019 (violação, risco, malformação); MA — Código Penal art. 453
 * (saúde da mulher).
 */

export type Regime15 = 'pedido' | 'aconselhamento' | 'permissivos' | 'proibido';
export type Permissivo15 = 'estupro' | 'risco_vida' | 'risco_saude' | 'anomalia';

export interface LeiDoAborto15 {
  regime: Regime15;
  /** Até quantas semanas a pedido (regime 'pedido'/'aconselhamento'). */
  semanas?: number;
  /** Os casos em que a lei permite (regime 'permissivos'; nos outros, além do prazo). */
  permissivos?: Permissivo15[];
  /** Pelo sistema público, sem custo (onde é legal). */
  publico?: boolean;
  /** Como a lei é dita no jogo (curto). */
  lei: string;
  /** O que acontece com quem interrompe fora da lei (quando é crime). */
  pena?: string;
}

const P = (lei: string, semanas: number, publico = true): LeiDoAborto15 => ({ regime: 'pedido', semanas, publico, lei, permissivos: ['risco_vida', 'risco_saude', 'anomalia', 'estupro'] });
const R = (lei: string, permissivos: Permissivo15[], pena: string): LeiDoAborto15 => ({ regime: 'permissivos', permissivos, publico: true, lei, pena });

export const LEIS_DO_ABORTO15: Record<string, LeiDoAborto15> = {
  BR: R('No Brasil, só é legal em caso de estupro, de risco à vida da gestante ou de anencefalia', ['estupro', 'risco_vida', 'anomalia'], 'é crime (Código Penal, art. 124): pena de 1 a 3 anos'),
  PT: P('Em Portugal, é legal a pedido até as 10 semanas, pelo SNS', 10),
  ES: P('Na Espanha, é legal a pedido até as 14 semanas, pela rede pública', 14),
  FR: P('Na França, é legal a pedido até as 14 semanas — e é direito previsto na Constituição', 14),
  DE: { regime: 'aconselhamento', semanas: 12, publico: false, lei: 'Na Alemanha, até as 12 semanas não é punido, depois de um aconselhamento obrigatório e de três dias de espera', permissivos: ['risco_vida', 'risco_saude', 'estupro'] },
  IT: P('Na Itália, é legal até os 90 dias pela rede pública — muitos médicos se declaram objetores', 12),
  GB: P('No Reino Unido, é legal até as 24 semanas, com a assinatura de dois médicos, pelo NHS', 24),
  AR: P('Na Argentina, é legal a pedido até as 14 semanas, pela rede pública', 14),
  UY: P('No Uruguai, é legal a pedido até as 12 semanas, depois de uma consulta e de cinco dias de reflexão', 12),
  CO: P('Na Colômbia, é legal a pedido até as 24 semanas', 24),
  MX: P('No México, foi descriminalizado; na maior parte do país, é legal a pedido até as 12 semanas', 12),
  CL: R('No Chile, só é legal em três casos: risco à vida, inviabilidade do feto ou estupro', ['risco_vida', 'anomalia', 'estupro'], 'é crime fora das três causais'),
  PE: R('No Peru, só é legal para proteger a vida ou a saúde da gestante', ['risco_vida', 'risco_saude'], 'é crime fora do aborto terapêutico'),
  CR: R('Na Costa Rica, só é legal quando a vida ou a saúde da gestante corre risco', ['risco_vida', 'risco_saude'], 'é crime fora do aborto terapêutico'),
  DO: { regime: 'proibido', lei: 'Na República Dominicana, é proibido em qualquer circunstância', pena: 'é crime, sem exceção' },
  CA: P('No Canadá, não é crime: é um procedimento de saúde como outro, coberto pelo sistema público', 24),
  JP: P('No Japão, é legal até as 22 semanas — em geral, com o consentimento do parceiro', 22, false),
  CN: P('Na China, é legal a pedido', 24, false),
  IN: P('Na Índia, é legal até as 20 semanas (24 em casos especiais), com o parecer de um médico', 20),
  KR: P('Na Coreia do Sul, deixou de ser crime em 2021', 14, false),
  AU: P('Na Austrália, é legal em todos os estados (os prazos variam)', 16),
  NZ: P('Na Nova Zelândia, é legal a pedido até as 20 semanas', 20),
  ZA: P('Na África do Sul, é legal a pedido até as 12 semanas', 12),
  NG: { regime: 'proibido', lei: 'Na Nigéria, só é permitido para salvar a vida da gestante', permissivos: ['risco_vida'], pena: 'é crime, com pena de prisão' },
  KE: R('No Quênia, só é legal quando há risco à vida ou à saúde da gestante', ['risco_vida', 'risco_saude'], 'é crime fora dos casos de risco'),
  AO: R('Em Angola, só é legal em caso de violação, de risco à saúde ou de malformação grave', ['estupro', 'risco_vida', 'risco_saude', 'anomalia'], 'é crime fora desses casos'),
  MA: R('No Marrocos, só é permitido para preservar a saúde da gestante', ['risco_vida', 'risco_saude'], 'é crime fora desse caso')
};

/** Os estados dos EUA com proibição (quase) total e os com limite de ~6 semanas (situação de 2025). */
export const EUA_PROIBIDO15 = new Set(['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'WV', 'ID', 'SD', 'IN']);
export const EUA_SEIS_SEMANAS15 = new Set(['FL', 'GA', 'SC', 'IA']);
