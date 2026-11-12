/**
 * VIDA 17 · O ESTADO CONJUGAL DAS PESSOAS — a fonte única para "essa pessoa pode começar um romance agora?".
 *
 * A contradição que motivou: a mãe do personagem "arranjou um namorado novo" sem que nada tivesse terminado o
 * casamento. Na origem, os geradores de romance das pessoas (o mundo vivo, as notícias do celular) só olhavam
 * `parceiroId` — e a parceria dos pais pode ter acabado no mesmo ano (separação), ter ficado viúva há poucos meses, ou
 * nunca ter sido registrada como fim. Aqui:
 *
 *   tem parceria        `parceiroId` (alguém da vida, ou 'fora') → não começa outro romance;
 *   pai e mãe juntos    os genitores do jogador criados juntos (`arranjo: 'pais_juntos'`), os dois vivos, sem separação
 *                       registrada → ainda são um casal, mesmo que o campo tenha se perdido;
 *   separação recente   menos de 12 meses → ainda não (o luto da relação);
 *   viuvez recente      menos de 24 meses do luto pela parceria → ainda não.
 *
 * Relacionamento aberto consentido não se aplica às pessoas da vida (o jogo não o registra para elas): só o jogador o
 * tem (`acordoConsentido`).
 */
import type { Pessoa, Vida } from '../tipos';

const GENITORES = new Set(['mae', 'pai']);

/** Os pais do jogador continuam um casal? (Criados juntos, os dois vivos, nenhuma separação registrada.) */
export function paisAindaJuntos(v: Vida): boolean {
  if (v.origem.arranjo !== 'pais_juntos') return false;
  // Os dois vivos (quem morreu deixou viúvo: não é mais casal).
  const gs = Object.values(v.vinculos).filter(x => GENITORES.has(x.parentesco ?? '')).map(x => v.pessoas[x.pessoaId]).filter(p => p?.vivo);
  if (gs.length !== 2) return false;
  if (gs.some(p => p.parceiroId && p.parceiroId !== gs[0].id && p.parceiroId !== gs[1].id)) return false;
  if (gs.some(p => p.aperto?.tipo === 'separacao')) return false;
  return !v.biografia.some(e => /pais se separaram/.test(e.texto)) && !gs.some(p => p.vida?.trajetoria?.some(x => /separa|divorci/i.test(x.texto)));
}

/** A pessoa está livre para começar um romance agora, sem contradizer o que se sabe dela? */
export function livreParaRomance(v: Vida, p: Pessoa): boolean {
  if (!p.vivo || p.parceiroId) return false;
  const ap = p.aperto;
  if (ap?.tipo === 'separacao' && v.t - ap.t < 12) return false;
  const par = v.vinculos[p.id]?.parentesco;
  if (ap?.tipo === 'luto' && v.t - ap.t < 24) {
    const q = ap.pessoaId ? v.pessoas[ap.pessoaId] : undefined;
    // O luto pela parceria (ou, entre os pais do jogador, pelo outro genitor) ainda não acabou.
    if (!q || q.parceiroId === p.id || (par && GENITORES.has(par) && GENITORES.has(v.vinculos[q.id]?.parentesco ?? ''))) return false;
  }
  if (par && GENITORES.has(par) && paisAindaJuntos(v)) return false;
  return true;
}

/** A pessoa ainda vive o romance que a trajetória dela anunciou? (Para quem conta "tô namorando" depois.) */
export function aindaEmRomance(p: Pessoa): boolean {
  return !!p.parceiroId;
}
