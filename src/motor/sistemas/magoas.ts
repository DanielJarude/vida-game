/**
 * REWORK 10.5 · REL-07 — O QUE FICA DEPOIS DA BRIGA.
 *
 * O conflito (`Vinculo.conflito`) é o assunto aberto; a tensão (`Vinculo.tensao`) é o clima do dia a dia, que esfria
 * rápido (×0,65 ao ano). Faltava o que dura: a MÁGOA — o motivo, a gravidade, quem causou, o ressentimento que esfria
 * devagar e as tentativas de reparar (de quem, quando, como terminou). Sem ela, dois anos depois de uma briga séria a
 * pessoa mandava "sumiu, hein?" como se nada tivesse acontecido.
 *
 * Nada aqui é uma barra que substitui as outras: dá para se amar e estar magoado (o afeto fica onde está), e o
 * ressentimento não apaga a confiança — é outra coisa. O que muda é o que a pessoa FAZ: quem está magoado não aparece
 * com mensagem genérica; pede desculpas, cobra explicação, tenta resolver — ou fica em silêncio.
 *
 * Só importa tipos e o `clamp`: é da camada de base (o ano, as interações, as iniciativas e as telas a leem).
 */

import { clamp } from '../rng';
import type { Magoa, Pessoa, Vida, Vinculo } from '../tipos';

/** Quanto ressentimento cada gravidade deixa (e o que pesa mais: traição, agressão, mentira). */
function ressentimentoInicial(gravidade: 1 | 2 | 3, motivo: string): number {
  const extra = /briga física|agress|trai|caso/.test(motivo) ? 20 : /mentira|segredo|boato/.test(motivo) ? 10 : 0;
  return clamp([0, 22, 45, 70][gravidade] + extra);
}

/**
 * A mágoa acompanha o conflito: um conflito novo (ou mais grave) vira mágoa; o mesmo conflito não soma de novo. Chamado
 * depois de cada interação e uma vez por ano, ANTES de a tensão e o conflito esfriarem — o que esfria é o clima, não a
 * memória.
 */
export function sincronizarMagoa(vin: Vinculo): void {
  const c = vin.conflito;
  if (!c) return;
  const m = vin.magoa;
  if (m && m.t >= c.t && m.gravidade >= c.gravidade) return;
  if (m && c.t - m.t < 24 && m.motivo === c.assunto) { m.gravidade = Math.max(m.gravidade, c.gravidade) as 1 | 2 | 3; m.ressentimento = Math.max(m.ressentimento, ressentimentoInicial(c.gravidade, c.assunto)); m.t = c.t; return; }
  vin.magoa = { t: c.t, motivo: c.assunto, gravidade: c.gravidade, quem: c.quem, ressentimento: Math.max(m?.ressentimento ?? 0, ressentimentoInicial(c.gravidade, c.assunto)), ...(m?.tentativas?.length ? { tentativas: m.tentativas.slice(-3) } : {}) };
}

/** Uma tentativa de reparar (pedir desculpas, reconciliar, reparar o dano) — de quem foi e como terminou. */
export function registrarTentativa(vin: Vinculo, t: number, quem: 'eu' | 'outro', resultado: 'aceita' | 'recusada' | 'sem_resposta'): void {
  const m = vin.magoa;
  if (!m) return;
  (m.tentativas ??= []).push({ t, quem, resultado });
  if (m.tentativas.length > 6) m.tentativas.splice(0, m.tentativas.length - 6);
  // Reparar de verdade alivia muito; a tentativa recusada alivia um pouco (o gesto foi visto); ignorar não alivia.
  m.ressentimento = clamp(m.ressentimento - (resultado === 'aceita' ? 30 : resultado === 'recusada' ? 6 : 0));
}

/**
 * O ano da mágoa: esfria devagar (mais devagar quando foi grave e ninguém tentou nada; mais depressa com a reconciliação
 * e com o convívio bom). Some quando não sobra quase nada e o conflito já fechou.
 */
export function processarMagoas(v: Vida): void {
  for (const vin of Object.values(v.vinculos)) {
    sincronizarMagoa(vin);
    const m = vin.magoa;
    if (!m) continue;
    const reconciliou = vin.reconciliacao !== undefined && vin.reconciliacao >= m.t;
    const tentou = (m.tentativas ?? []).some(x => x.resultado === 'aceita');
    const queda = (m.gravidade === 3 ? 3 : m.gravidade === 2 ? 5 : 8) + (reconciliou ? 10 : 0) + (tentou ? 6 : 0) + (vin.tensao < 15 && vin.proximidade >= 55 ? 3 : 0);
    m.ressentimento = clamp(m.ressentimento - queda);
    if (m.ressentimento <= 4 && !vin.conflito) delete vin.magoa;
  }
}

/**
 * A pessoa pode aparecer "como se nada tivesse acontecido" (o convite, o "sumiu, hein?", o "lembrei de você")? Não
 * enquanto há conflito aberto, ruptura não desfeita, bloqueio, ou mágoa que ainda pesa. Ela pode procurar — mas para
 * pedir desculpas, cobrar uma explicação ou tentar resolver (`iniciativas`), não para conversa de sempre.
 */
export function procuraComoSeNada(v: Vida, vin: Vinculo): boolean {
  if (vin.conflito) return false;
  if (vin.ruptura && (vin.reconciliacao === undefined || vin.reconciliacao < vin.ruptura.t)) return false;
  if (vin.digital?.bloqueado !== undefined) return false;
  if (vin.magoa && vin.magoa.ressentimento >= 25) return false;
  void v;
  return true;
}

/** Os estados de agora, em palavras (mais de um ao mesmo tempo: brigados E magoados; afastados E com a confiança abalada). */
export type EstadoContextual = 'brigados' | 'magoada' | 'deve_desculpas' | 'confianca_abalada' | 'medo' | 'afastados' | 'rompidos' | 'bloqueado' | 'reconciliando';
export function estadosContextuais(v: Vida, vin: Vinculo): EstadoContextual[] {
  const out: EstadoContextual[] = [];
  const m = vin.magoa;
  if (vin.ruptura && (vin.reconciliacao === undefined || vin.reconciliacao < vin.ruptura.t)) out.push('rompidos');
  if (vin.digital?.bloqueado !== undefined) out.push('bloqueado');
  if (vin.conflito) out.push('brigados');
  if (m && m.ressentimento >= 25) out.push(m.quem === 'eu' ? 'magoada' : 'deve_desculpas');
  // REWORK 10.5 · REL-10: quem já partiu para cima de você (e há pouco tempo) dá medo.
  const medo = v.fatos[`medo_${vin.pessoaId}`];
  if (medo !== undefined && v.t - medo <= 60) out.push('medo');
  if (vin.confianca < 30 && vin.historia.some(h => (h.tipo === 'traicao' || /mentira|traiu|traição/.test(h.texto)) && v.t - h.t <= 120)) out.push('confianca_abalada');
  if (!out.includes('rompidos') && (vin.estagio === 'afastado' || (vin.distancia !== undefined && v.t - vin.distancia < 60))) out.push('afastados');
  if (vin.reconciliacao !== undefined && v.t - vin.reconciliacao <= 24 && !vin.conflito) out.push('reconciliando');
  return out;
}

/** A mágoa numa frase (a ficha da pessoa): o motivo, há quanto tempo, quem tentou o quê. */
export function fraseDaMagoa(v: Vida, vin: Vinculo, p: Pessoa): string | undefined {
  const nome = p.nome;
  const o = p.genero === 'feminino' ? 'a' : p.genero === 'masculino' ? 'o' : 'e';
  const m: Magoa | undefined = vin.magoa;
  if (!m || m.ressentimento < 10) return undefined;
  const anos = Math.round((v.t - m.t) / 12);
  const quando = anos <= 0 ? 'há pouco' : anos === 1 ? 'há um ano' : `há ${anos} anos`;
  const peso = m.ressentimento >= 60 ? 'ainda dói muito' : m.ressentimento >= 30 ? 'ainda pesa' : 'pesa pouco, mas não sumiu';
  const ult = m.tentativas?.[m.tentativas.length - 1];
  const tentativa = ult ? ` ${ult.quem === 'eu' ? 'Você tentou reparar' : `${nome} tentou reparar`} ${ult.resultado === 'aceita' ? 'e foi aceito' : ult.resultado === 'recusada' ? 'e não foi aceito' : 'e ficou sem resposta'}.` : m.quem === 'eu' ? ' Ninguém tentou consertar ainda.' : '';
  return `${m.quem === 'eu' ? `${nome} ficou magoad${o} com você` : `Você ficou com ${nome} atravessad${o} na garganta`} por ${m.motivo} (${quando}): ${peso}.${tentativa}`;
}
