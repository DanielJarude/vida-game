/**
 * Redes sociais — a base. O que outros sistemas leem: as contas, o público
 * real, o que as redes pagam e quanto nome elas dão. As ações e o ano das
 * redes moram em `sistemas/redes` (só as ações, o ano e as telas os chamam).
 *
 * FIX pós-REWORK 4: sete plataformas (`dados/redes`), cada uma com o seu
 * funcionamento. O "Mural" do REWORK 4 virou Instagram (saves antigos:
 * `normalizarRedes`, na leitura do save).
 *
 * As redes são SIMULAÇÃO interna (funcionam offline; nenhuma rede de verdade é tocada).
 */

import type { ContaSocial, PlataformaId, Vida } from '../tipos';
import { ORDEM_PLATAFORMAS, PLATAFORMAS, ehPlataforma } from '../dados/redes';

export { PLATAFORMAS, ORDEM_PLATAFORMAS };
/** A plataforma de quem não diz qual (comandos e saves do REWORK 4). */
export const PLATAFORMA_PADRAO: PlataformaId = 'instagram';

/** A conta ativa (não apagada) numa plataforma. */
export function contaAtiva(v: Vida, plataforma: PlataformaId = PLATAFORMA_PADRAO): ContaSocial | undefined {
  const c = v.redes?.contas[plataforma];
  return c && c.apagada === undefined ? c : undefined;
}

/** Todas as contas ativas, na ordem das plataformas. */
export function contasAtivas(v: Vida): ContaSocial[] {
  const contas = v.redes?.contas;
  if (!contas) return [];
  return ORDEM_PLATAFORMAS.map(p => contas[p]).filter((c): c is ContaSocial => !!c && c.apagada === undefined);
}

/** O público de verdade (sem o comprado). */
export const publicoReal = (c: ContaSocial) => Math.max(0, c.seguidores - (c.comprados ?? 0));

const suspensa = (v: Vida, c: ContaSocial) => c.suspensaAte !== undefined && v.t < c.suspensaAte;

/** Quantas publicações a conta fez nos últimos 12 meses. */
export const publicacoesDoAno = (v: Vida, c: ContaSocial) => c.publicacoes.filter(p => !p.apagada && v.t - p.t <= 12).length;

/**
 * O que UMA conta monetizada paga por mês (unidade do motor, antes do custo local): o público real, a confiança, o
 * engajamento e a constância. O YouTube tem cauda (o catálogo continua rendendo sem vídeo novo); o OnlyFans paga por
 * assinante; o resto paga por quem publica.
 */
export function rendaDaConta(v: Vida, c: ContaSocial): number {
  if (c.monetizada === undefined || c.apagada !== undefined || suspensa(v, c) || !ehPlataforma(c.plataforma)) return 0;
  const pl = PLATAFORMAS[c.plataforma];
  const ano = publicacoesDoAno(v, c);
  const cauda = pl.id === 'youtube' ? 0.55 : pl.id === 'onlyfans' ? 0 : 0.25;
  const constancia = Math.min(1, cauda + (1 - cauda) * Math.min(1, ano / 4));
  const real = publicoReal(c);
  // O tamanho não cresce em linha reta: o milhão não paga mil vezes o mil.
  const escala = pl.id === 'onlyfans' ? real : Math.pow(real, 0.92);
  const confianca = Math.max(0.2, c.credibilidade / 70);
  const engaja = 0.6 + (c.engajamento ?? 50) / 125;
  return Math.round(escala / 1000 * pl.monetiza.porMil * confianca * engaja * constancia / 10) * 10;
}

/** O que as redes pagam por mês, somadas (o que entra no orçamento: `dinheiro.orcamento`). */
export function rendaDaRede(v: Vida): number {
  return contasAtivas(v).reduce((s, c) => s + rendaDaConta(v, c), 0);
}

/** Quanto nome as redes dão (0..100): a maior conta real (assinante do OnlyFans não faz nome público). */
export function nomeDaRede(v: Vida): number {
  let melhor = 0;
  for (const c of contasAtivas(v)) {
    if (c.plataforma === 'onlyfans') continue;
    const real = publicoReal(c);
    if (real < 5000) continue;
    melhor = Math.max(melhor, 18 * (Math.log10(real) - 3.6) * (0.6 + c.credibilidade / 250));
  }
  return Math.max(0, Math.min(80, melhor));
}

/** "1,2 mil", "34 mil", "1,1 milhão". */
export function seguidoresEmPalavras(n: number): string {
  if (n < 1000) return String(Math.round(n));
  if (n < 1_000_000) { const k = n / 1000; return `${k < 10 ? k.toFixed(1).replace('.', ',').replace(',0', '') : Math.round(k)} mil`; }
  const m = n / 1_000_000;
  return `${m < 10 ? m.toFixed(1).replace('.', ',').replace(',0', '') : Math.round(m)} ${m < 2 ? 'milhão' : 'milhões'}`;
}

/**
 * Saves do REWORK 4: a conta do "Mural" vira a do Instagram (era uma rede de fotos e do que a vida mostra). Sem perda:
 * os mesmos seguidores, publicações e histórico. Roda na leitura do save (idempotente).
 */
export function normalizarRedes(v: Vida): void {
  const contas = v.redes?.contas;
  if (!contas || !contas['mural']) return;
  const m = contas['mural'];
  delete contas['mural'];
  if (!contas.instagram) contas.instagram = { ...m, plataforma: 'instagram' };
}
