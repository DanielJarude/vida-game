/**
 * Redes sociais — a base (REWORK 4). O que outros sistemas leem: a conta,
 * os seguidores, o que a rede paga e quanto nome ela dá. As ações e o ano da
 * rede moram em `sistemas/redes` (acima: só as ações e o ano as chamam).
 *
 * A rede é uma SIMULAÇÃO interna do jogo (funciona offline; nenhuma rede de
 * verdade é tocada) e tem identidade própria: o "Mural". A arquitetura aceita
 * outras plataformas (`PLATAFORMAS`); por ora há uma.
 */

import type { ContaSocial, Vida } from '../tipos';

export interface Plataforma { id: string; nome: string; descricao: string; idadeMin: number }
export const PLATAFORMAS: Record<string, Plataforma> = {
  mural: { id: 'mural', nome: 'Mural', descricao: 'Fotos, textos e o que a vida mostra — para quem segue você.', idadeMin: 13 }
};
export const PLATAFORMA_PADRAO = 'mural';

/** A conta ativa (não apagada) numa plataforma. */
export function contaAtiva(v: Vida, plataforma = PLATAFORMA_PADRAO): ContaSocial | undefined {
  const c = v.redes?.contas[plataforma];
  return c && c.apagada === undefined ? c : undefined;
}

/** O que a conta monetizada paga por mês (unidade do motor): cresce com os seguidores e encolhe sem credibilidade nem constância. */
export function rendaDaRede(v: Vida): number {
  const c = contaAtiva(v);
  if (!c || c.monetizada === undefined) return 0;
  const ultimoAno = c.publicacoes.filter(p => !p.apagada && v.t - p.t < 12).length;
  const constancia = ultimoAno >= 4 ? 1 : ultimoAno >= 2 ? 0.6 : 0.3;
  return Math.round(Math.pow(Math.max(0, c.seguidores), 0.9) * 0.06 * (c.credibilidade / 70) * constancia / 10) * 10;
}

/** Quanto nome a rede dá (0..100) — o que entra na notoriedade como mais um motivo. */
export function nomeDaRede(v: Vida): number {
  const c = contaAtiva(v);
  if (!c || c.seguidores < 5000) return 0;
  return Math.max(0, Math.min(80, 18 * (Math.log10(c.seguidores) - 3.6) * (0.6 + c.credibilidade / 250)));
}

/** "1,2 mil", "34 mil", "1,1 milhão". */
export function seguidoresEmPalavras(n: number): string {
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) { const k = n / 1000; return `${k < 10 ? k.toFixed(1).replace('.', ',').replace(',0', '') : Math.round(k)} mil`; }
  const m = n / 1_000_000;
  return `${m < 10 ? m.toFixed(1).replace('.', ',').replace(',0', '') : Math.round(m)} ${m < 2 ? 'milhão' : 'milhões'}`;
}
