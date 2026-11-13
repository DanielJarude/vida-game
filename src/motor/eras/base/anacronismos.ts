/**
 * ERAS HISTÓRICAS · O TEXTO DA ÉPOCA — a última peneira contra o anacronismo nas frases.
 *
 * Os portões de verdade estão nos sistemas (o Celular, as redes, as lojas, as profissões: `eras/base/contexto`). Mas o
 * texto do jogo foi escrito para 2026 e cita, de passagem, o celular, o aplicativo, o Pix, o Enem. Numa vida histórica,
 * antes de cada coisa existir para a pessoa, a frase troca a palavra pelo equivalente da época (o telefone, a carta, o
 * depósito, o vestibular). Vida contemporânea: nada muda. Só troca expressões inteiras e conhecidas — nunca reescreve
 * uma frase.
 */

import type { Vida } from '../../tipos';
import { anoDe } from '../../tempo';
import { tecnologia } from './contexto';

interface Regra { quando: (v: Vida, ano: number) => boolean; trocas: [RegExp, string][] }

const sem = (id: string) => (v: Vida) => tecnologia(v, id) === 'indisponivel';
const antes = (ano: number) => (_v: Vida, a: number) => a < ano;

const REGRAS: Regra[] = [
  { quando: sem('celular'), trocas: [
    [/pelo celular/g, 'por telefone'], [/Pelo celular/g, 'Por telefone'], [/no celular/g, 'no telefone'], [/No celular/g, 'No telefone'],
    [/do celular/g, 'do telefone'], [/o celular/g, 'o telefone'], [/O celular/g, 'O telefone'], [/um celular/g, 'um telefone'], [/celular/g, 'telefone']
  ] },
  { quando: sem('mensageiro_app'), trocas: [
    [/grupo da família/g, 'almoço de domingo da família'], [/um áudio/g, 'um recado'], [/áudios/g, 'recados'], [/aplicativo de mensagens/g, 'telefone'],
    [/chamada de vídeo/g, 'ligação'], [/Mandou mensagem/g, 'Ligou'], [/mandou mensagem/g, 'ligou']
  ] },
  { quando: sem('internet'), trocas: [
    [/pela internet/g, 'pelo correio'], [/na internet/g, 'nos jornais'], [/um e-mail/g, 'uma carta'], [/Um e-mail/g, 'Uma carta'], [/e-mails/g, 'cartas'], [/e-mail/g, 'carta'],
    [/nas redes sociais/g, 'nas conversas do bairro'], [/redes sociais/g, 'conversas de bairro'], [/\bonline\b/g, 'por telefone']
  ] },
  { quando: sem('pix'), trocas: [[/um Pix/g, 'um depósito'], [/o Pix/g, 'o depósito'], [/via Pix/g, 'por depósito'], [/por Pix/g, 'por depósito'], [/\bPix\b/g, 'depósito']] },
  { quando: sem('streaming'), trocas: [[/de streaming/g, 'da locadora'], [/streaming/g, 'locadora']] },
  { quando: antes(1996), trocas: [[/a TV a cabo/g, 'a assinatura do jornal'], [/TV a cabo/g, 'assinatura do jornal']] },
  { quando: antes(2009), trocas: [[/o Enem/g, 'o vestibular'], [/O Enem/g, 'O vestibular'], [/do Enem/g, 'do vestibular'], [/no Enem/g, 'no vestibular'], [/\bEnem\b/g, 'vestibular'], [/pelo Sisu/g, 'pelo vestibular'], [/no Sisu/g, 'no vestibular'], [/\bSisu\b/g, 'vestibular']] },
  { quando: antes(2014), trocas: [[/motorista de aplicativo/g, 'taxista'], [/[Dd]elivery/g, 'entrega']] },
  { quando: sem('smartphone'), trocas: [[/pelo aplicativo/g, 'por telefone'], [/no aplicativo/g, 'por telefone'], [/um aplicativo/g, 'um serviço']] }
];

/** A frase como ela seria dita no ano corrente da vida (vida contemporânea: a mesma frase). */
export function textoDaEpoca(v: Vida, texto: string): string {
  if (!v.era || !texto) return texto;
  const ano = anoDe(v.t);
  if (ano >= 2026) return texto;
  let s = texto;
  for (const r of REGRAS) {
    if (!r.quando(v, ano)) continue;
    for (const [de, para] of r.trocas) s = s.replace(de, para);
  }
  return s;
}
