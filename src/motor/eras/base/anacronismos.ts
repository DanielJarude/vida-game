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
/** O ano civil de um instante (sem importar `tempo`: a base histórica não depende de nenhum pacote de cima). */
const anoDe = (t: number) => Math.floor(t / 12);
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
  { quando: antes(2014), trocas: [[/motorista de aplicativo/g, 'taxista'], [/[Dd]elivery/g, 'entrega'], [/táxi ou aplicativo/g, 'táxi ou ônibus'], [/carro de aplicativo/g, 'táxi'], [/um aplicativo de transporte/g, 'um táxi']] },
  // ERAS v2 (auditoria textual): a UPA (2008), o meme (anos 2000), o print de tela (smartphone).
  { quando: antes(2008), trocas: [[/para a UPA/g, 'para o pronto-socorro'], [/na UPA/g, 'no pronto-socorro'], [/da UPA/g, 'do pronto-socorro'], [/a UPA/g, 'o pronto-socorro'], [/\bUPA\b/g, 'pronto-socorro']] },
  { quando: antes(2006), trocas: [[/esse meme/g, 'essa piada'], [/um meme/g, 'uma piada'], [/Um meme/g, 'Uma piada'], [/o meme/g, 'a piada'], [/memes/g, 'piadas'], [/\bmeme\b/g, 'piada']] },
  { quando: sem('smartphone'), trocas: [[/pelo aplicativo/g, 'por telefone'], [/no aplicativo/g, 'por telefone'], [/um aplicativo/g, 'um serviço'], [/\s?\p{Extended_Pictographic}\uFE0F?/gu, '']] }
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

/**
 * ERAS v2 · O DETECTOR — termos com o ano a partir do qual fazem sentido no Brasil (o lançamento ou a chegada; o uso
 * corrente vem depois). Serve à auditoria (`scripts/sim/textosEras2.ts`) e aos testes: um texto de uma vida histórica que
 * cita um destes antes do ano é anacronismo. Fontes: as mesmas de `tecnologias` (datas de chegada) e as leis citadas.
 */
export const TERMOS_DATADOS: readonly { re: RegExp; desde: number; nome: string }[] = [
  { re: /\bWhats ?App\b|\bzap\b|\bzapzap\b/i, desde: 2010, nome: 'aplicativo de mensagens' },
  { re: /\bInstagram\b|\binsta\b/i, desde: 2010, nome: 'Instagram' },
  { re: /\bFacebook\b/i, desde: 2008, nome: 'Facebook' },
  { re: /\bOrkut\b/i, desde: 2004, nome: 'Orkut' },
  { re: /\bTwitter\b|\btuíte|\btuitou/i, desde: 2007, nome: 'Twitter' },
  { re: /\bTikTok\b/i, desde: 2018, nome: 'TikTok' },
  { re: /\bYouTube\b/i, desde: 2006, nome: 'YouTube' },
  { re: /\bNetflix\b/i, desde: 2011, nome: 'Netflix' },
  { re: /\bSpotify\b/i, desde: 2014, nome: 'Spotify' },
  { re: /\bUber\b/i, desde: 2014, nome: 'Uber' },
  { re: /\biFood\b/i, desde: 2011, nome: 'iFood' },
  { re: /\bPix\b/, desde: 2020, nome: 'Pix' },
  { re: /\bselfies?\b/i, desde: 2013, nome: 'selfie' },
  { re: /\bsmartphones?\b/i, desde: 2008, nome: 'smartphone' },
  { re: /\baplicativos?\b|\bapps?\b/i, desde: 2008, nome: 'aplicativo' },
  { re: /\binfluenciador|\binfluencer/i, desde: 2014, nome: 'influenciador' },
  { re: /\bstories\b/i, desde: 2016, nome: 'stories' },
  { re: /\bstreaming\b/i, desde: 2011, nome: 'streaming' },
  { re: /\bpodcasts?\b/i, desde: 2005, nome: 'podcast' },
  { re: /\bWi-?Fi\b/i, desde: 2003, nome: 'Wi-Fi' },
  { re: /\be-?mails?\b/i, desde: 1995, nome: 'e-mail' },
  { re: /\binternet\b/i, desde: 1995, nome: 'internet' },
  { re: /\bon-?line\b/i, desde: 1995, nome: 'on-line' },
  { re: /\bcelular(es)?\b/i, desde: 1990, nome: 'celular' },
  { re: /\btorpedos?\b|\bSMS\b/, desde: 1999, nome: 'torpedo' },
  { re: /\bEnem\b/, desde: 1998, nome: 'Enem' },
  { re: /\bSisu\b/, desde: 2010, nome: 'Sisu' },
  { re: /\bProUni\b/i, desde: 2005, nome: 'ProUni' },
  { re: /\bBolsa Família\b/, desde: 2003, nome: 'Bolsa Família' },
  { re: /\bMaria da Penha\b/, desde: 2006, nome: 'Lei Maria da Penha' },
  { re: /\bDVDs?\b/, desde: 1998, nome: 'DVD' },
  { re: /\bMP3\b/i, desde: 1998, nome: 'MP3' },
  { re: /\bGPS\b/, desde: 2000, nome: 'GPS' },
  { re: /\bQR\b/, desde: 2012, nome: 'QR code' },
  { re: /\bdrones?\b/i, desde: 2014, nome: 'drone' },
  { re: /\bhome office\b/i, desde: 2000, nome: 'home office' },
  { re: /\bcrush\b/i, desde: 2012, nome: 'crush' },
  { re: /\bchamadas? de vídeo\b|\bvideochamadas?\b/i, desde: 2010, nome: 'chamada de vídeo' },
  { re: /\bgrupo da família\b/i, desde: 2014, nome: 'grupo da família' },
  { re: /\bmatch\b/i, desde: 2013, nome: 'match' },
  { re: /\bpostou\b|\bpostar\b|\bpostagem|\bposts?\b/i, desde: 2004, nome: 'postar' },
  { re: /\bseguidores\b/i, desde: 2009, nome: 'seguidores' },
  { re: /\bviraliz/i, desde: 2008, nome: 'viralizar' },
  { re: /\bmemes?\b/i, desde: 2005, nome: 'meme' },
  { re: /\bUPA\b/, desde: 2008, nome: 'UPA' },
  { re: /\bSAMU\b/, desde: 2003, nome: 'SAMU' },
  { re: /\bSUS\b/, desde: 1990, nome: 'SUS' },
  { re: /\bAirbnb\b/i, desde: 2012, nome: 'Airbnb' },
  { re: /\bcoworking\b/i, desde: 2010, nome: 'coworking' },
  { re: /\bstartups?\b/i, desde: 2008, nome: 'startup' },
  { re: /\bLinkedIn\b/i, desde: 2010, nome: 'LinkedIn' },
  { re: /\bbanco digital\b|\bNubank\b/i, desde: 2014, nome: 'banco digital' },
  { re: /\bmaquininha\b/i, desde: 2013, nome: 'maquininha' },
  { re: /\b4G\b/, desde: 2013, nome: '4G' },
  { re: /\b5G\b/, desde: 2022, nome: '5G' },
  { re: /\bLei Seca\b/, desde: 2008, nome: 'Lei Seca' },
  { re: /\bFicha Limpa\b/, desde: 2010, nome: 'Ficha Limpa' },
  { re: /\bemojis?\b/i, desde: 2011, nome: 'emoji' },
  { re: /\bnotebooks?\b/i, desde: 1992, nome: 'notebook' },
  { re: /\bPlayStation\b/i, desde: 1995, nome: 'PlayStation' },
  { re: /\bfoto do perfil\b|\bperfil\b (?:dele|dela|seu|na rede)/i, desde: 2004, nome: 'perfil' }
];

/** Os termos de um texto que ainda não fazem sentido no ano (vazio quando está tudo bem). */
export function anacronismosNoTexto(texto: string, ano: number): string[] {
  const out: string[] = [];
  for (const t of TERMOS_DATADOS) if (ano < t.desde && t.re.test(texto)) out.push(t.nome);
  return out;
}
