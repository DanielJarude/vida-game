/**
 * ERAS HISTÓRICAS · AS LEIS NO TEMPO (Brasil) — o que a lei permitia em cada ano, nos pontos em que o jogo tem uma regra.
 * A vida contemporânea segue a lei de hoje. O texto diz o fato jurídico, sem julgamento.
 *
 *   - Casamento entre pessoas do mesmo gênero: a união estável foi reconhecida pelo STF em 05/05/2011 (ADI 4277 e
 *     ADPF 132); o casamento civil, pela Resolução 175 do CNJ, de 14/05/2013, que proibiu os cartórios de recusá-lo.
 *   - Divórcio: instituído pela Lei 6.515/1977 (antes, só o desquite, que não permitia casar de novo); até a Emenda
 *     Constitucional 66/2010 (13/07/2010), exigia separação judicial prévia de um ano ou separação de fato de dois.
 *   - Maioridade civil: 21 anos até o Código Civil de 2002 (em vigor em 11/01/2003); 18 depois. O jogo trata os 18 como
 *     a idade adulta em todas as épocas (simplificação de jogo, documentada): só o texto menciona a regra antiga.
 */
import type { Vida } from '../../tipos';

const anoDe = (t: number) => Math.floor(t / 12);
const tDe = (a: number, m: number) => a * 12 + m - 1;

export const UNIAO_ESTAVEL_MESMO_GENERO = tDe(2011, 5);
export const CASAMENTO_MESMO_GENERO = tDe(2013, 5);
export const DIVORCIO_INSTITUIDO = tDe(1977, 12);
export const DIVORCIO_DIRETO = tDe(2010, 7);

/** Numa vida histórica no Brasil, o casamento civil entre pessoas do mesmo gênero ainda não era possível? (o motivo) */
export function casamentoImpedidoPelaLei(v: Vida, generoA: string, generoB: string): string | undefined {
  if (!v.era || generoA !== generoB || (generoA !== 'masculino' && generoA !== 'feminino')) return undefined;
  if (v.t >= CASAMENTO_MESMO_GENERO) return undefined;
  return v.t >= UNIAO_ESTAVEL_MESMO_GENERO
    ? 'Em ' + anoDe(v.t) + ', a lei ainda não garantia o casamento civil entre pessoas do mesmo gênero: o STF tinha reconhecido a união estável (maio de 2011); o casamento só viria com a Resolução 175 do CNJ, em maio de 2013.'
    : 'Em ' + anoDe(v.t) + ', a lei brasileira não reconhecia o casamento nem a união estável entre pessoas do mesmo gênero (a união estável seria reconhecida pelo STF em maio de 2011; o casamento, em maio de 2013).';
}

/** O que a lei da época pedia para desfazer um casamento (texto; o efeito no jogo é o mesmo). */
export function divorcioNaEpoca(v: Vida): string | undefined {
  if (!v.era) return undefined;
  if (v.t < DIVORCIO_INSTITUIDO) return 'Ainda não havia divórcio no Brasil: só o desquite, que separava os bens e a casa, mas não permitia casar de novo.';
  if (v.t < DIVORCIO_DIRETO) return 'Pela lei da época, o divórcio só saía depois de um ano de separação judicial (ou dois de separação de fato): começou pela separação, e o divórcio veio depois.';
  return undefined;
}
