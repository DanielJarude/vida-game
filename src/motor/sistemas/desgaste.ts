/**
 * O desgaste natural das relações (REWORK 4): não "todo mundo perde 5 por ano".
 *
 * Sem convivência, o quanto uma relação esfria depende de:
 *   - CONTATO: a mensagem trocada segura boa parte da relação à distância; só
 *     curtir e reagir mantém o contato, não a intimidade (`Vinculo.digital`);
 *   - DISTÂNCIA: outra cidade esfria mais do que o mesmo bairro sem se ver;
 *   - HISTÓRIA: amizade recente esfria depressa; a de anos (ou com muita
 *     história) aguenta silêncio longo;
 *   - CONFIANÇA e o TIPO do laço (o melhor amigo resiste mais);
 *   - PERSONALIDADE: quem é de gente puxa assunto, e a relação esfria menos.
 * A família tem a regra dela (`social.processarSocial`): o vínculo fica; a
 * proximidade anda devagar, com o contato — digital incluído.
 */

import type { Pessoa, Vida, Vinculo } from '../tipos';

const recente = (t: number | undefined, v: Vida, meses: number) => t !== undefined && v.t - t < meses;

/** Houve contato de verdade (presencial, ligação, mensagem) nos últimos `meses`. */
export const contatoReal = (v: Vida, vin: Vinculo, meses: number) => v.t - vin.tUltimoContato < meses || recente(vin.digital?.mensagem, v, meses);

/** O quanto a proximidade muda num ano sem convivência (negativo: esfria). */
export function desgasteSemConvivio(v: Vida, p: Pessoa, vin: Vinculo): number {
  const outraCidade = p.municipioId !== v.moradia.municipioId;
  const semContato = v.t - vin.tUltimoContato;
  let d = semContato < 12 ? -2 : outraCidade ? -11 : -6;
  if (recente(vin.digital?.mensagem, v, 12)) d = Math.max(d, outraCidade ? -3 : -2);
  else if (recente(vin.digital?.reacao, v, 12)) d = Math.max(d, outraCidade ? -7 : -4);
  const anos = (v.t - vin.tInicio) / 12;
  const historia = vin.historia.reduce((s, h) => s + (h.peso ?? 1), 0);
  let f = anos < 3 ? 1.3 : anos >= 10 || historia >= 12 ? 0.55 : anos >= 5 ? 0.8 : 1;
  if (vin.estagio === 'amigo_proximo') f *= 0.75;
  if (vin.confianca >= 70) f *= 0.85;
  f *= 1 - Math.max(0, p.temperamento.extroversao) * 0.2;
  return d * f;
}

/** Só reagir, sem conversar: o contato existe, mas a intimidade (a confiança) diminui um pouco. */
export function soReacao(v: Vida, vin: Vinculo): boolean {
  return recente(vin.digital?.reacao, v, 12) && !recente(vin.digital?.mensagem, v, 12) && v.t - vin.tUltimoContato >= 12;
}
