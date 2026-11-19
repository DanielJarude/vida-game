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
import { tecnologia, paisDaEpoca, datasNoPais } from './contexto';

interface Regra { quando: (v: Vida, ano: number) => boolean; trocas: [RegExp, string][] }

const sem = (id: string) => (v: Vida) => tecnologia(v, id) === 'indisponivel';
const antes = (ano: number) => (_v: Vida, a: number) => a < ano;
/** ERAS v3: as trocas que falam de instituições brasileiras (o SUS, o Enem, o FIES) só valem numa vida no Brasil. */
const antesNoBrasil = (ano: number) => (v: Vida, a: number) => a < ano && paisDaEpoca(v) === 'BR';

const REGRAS: Regra[] = [
  { quando: sem('celular'), trocas: [
    [/pelo celular/g, 'por telefone'], [/Pelo celular/g, 'Por telefone'], [/no celular/g, 'no telefone'], [/No celular/g, 'No telefone'],
    [/do celular/g, 'do telefone'], [/o celular/g, 'o telefone'], [/O celular/g, 'O telefone'], [/um celular/g, 'um telefone'], [/celular/g, 'telefone']
  ] },
  { quando: sem('mensageiro_app'), trocas: [
    [/grupo da família/g, 'almoço de domingo da família'], [/Grupo da família/g, 'Almoço de domingo da família'], [/um áudio/g, 'um recado'], [/áudios/g, 'recados'], [/aplicativo de mensagens/g, 'telefone'],
    [/chamada de vídeo/g, 'ligação'], [/Mandou mensagem/g, 'Ligou'], [/mandou mensagem/g, 'ligou']
  ] },
  { quando: sem('internet'), trocas: [
    [/pela internet/g, 'pelo correio'], [/na internet/g, 'nos jornais'], [/um e-mail/g, 'uma carta'], [/Um e-mail/g, 'Uma carta'], [/e-mails/g, 'cartas'], [/e-mail/g, 'carta'],
    [/nas redes sociais/g, 'nas conversas do bairro'], [/redes sociais/g, 'conversas de bairro'], [/\bonline\b/g, 'por telefone'], [/[Vv]endas on-line/g, 'Vendas por catálogo'], [/\bon-line\b/g, 'por telefone']
  ] },
  { quando: sem('pix'), trocas: [[/um Pix/g, 'um depósito'], [/o Pix/g, 'o depósito'], [/via Pix/g, 'por depósito'], [/por Pix/g, 'por depósito'], [/\bPix\b/g, 'depósito']] },
  { quando: sem('streaming'), trocas: [[/de streaming/g, 'da locadora'], [/streaming/g, 'locadora']] },
  { quando: antes(1996), trocas: [[/a TV a cabo/g, 'a assinatura do jornal'], [/TV a cabo/g, 'assinatura do jornal']] },
  { quando: antesNoBrasil(2009), trocas: [[/o Enem/g, 'o vestibular'], [/O Enem/g, 'O vestibular'], [/do Enem/g, 'do vestibular'], [/no Enem/g, 'no vestibular'], [/\bEnem\b/g, 'vestibular'], [/pelo Sisu/g, 'pelo vestibular'], [/no Sisu/g, 'no vestibular'], [/\bSisu\b/g, 'vestibular']] },
  { quando: antes(2014), trocas: [[/motorista de aplicativo/g, 'taxista'], [/[Dd]elivery/g, 'entrega'], [/táxi ou aplicativo/g, 'táxi ou ônibus'], [/carro de aplicativo/g, 'táxi'], [/um aplicativo de transporte/g, 'um táxi']] },
  { quando: antesNoBrasil(1999), trocas: [[/do FIES/g, 'do Crédito Educativo'], [/o FIES/g, 'o Crédito Educativo'], [/pelo FIES/g, 'pelo Crédito Educativo'], [/\bFIES\b/g, 'Crédito Educativo']] },
  { quando: antes(2005), trocas: [[/ \(e o podcast dele\)/g, ''], [/um podcast/g, 'um programa de rádio'], [/o podcast/g, 'o programa de rádio'], [/\bpodcasts?\b/g, 'programa de rádio']] },
  { quando: antes(2014), trocas: [[/entregas por aplicativo/g, 'entregas de bicicleta'], [/entrega por aplicativo/g, 'entrega de bicicleta']] },
  // ERAS v2 · saúde e dinheiro: o INAMPS antes do SUS (1990), a ambulância antes do SAMU (2003), o cartão sem aproximação.
  // ERAS v3: antes do INAMPS (1977), o INPS (1966); antes dele, os institutos de aposentadoria de cada categoria.
  { quando: antesNoBrasil(1966), trocas: [[/pelo SUS/g, 'pelo instituto da categoria'], [/do SUS/g, 'do instituto da categoria'], [/no SUS/g, 'na Santa Casa'], [/o SUS/g, 'o instituto da categoria'], [/\bSUS\b/g, 'instituto da categoria']] },
  { quando: antesNoBrasil(1977), trocas: [[/pelo SUS/g, 'pelo INPS'], [/do SUS/g, 'do INPS'], [/no SUS/g, 'no INPS'], [/o SUS/g, 'o INPS'], [/\bSUS\b/g, 'INPS']] },
  { quando: antesNoBrasil(1990), trocas: [[/pelo SUS/g, 'pelo INAMPS'], [/do SUS/g, 'do INAMPS'], [/no SUS/g, 'no INAMPS'], [/o SUS/g, 'o INAMPS'], [/\bSUS\b/g, 'INAMPS']] },
  { quando: antesNoBrasil(2003), trocas: [[/chamou o SAMU/g, 'chamou a ambulância'], [/o SAMU/g, 'a ambulância'], [/do SAMU/g, 'da ambulância'], [/\bSAMU\b/g, 'ambulância']] },
  { quando: antes(2016), trocas: [[/ por aproximação/g, ''], [/cartão por aproximação/g, 'cartão']] },
  // ERAS v2 (auditoria textual): a UPA (2008), o meme (anos 2000), o print de tela (smartphone).
  { quando: antesNoBrasil(2008), trocas: [[/para a UPA/g, 'para o pronto-socorro'], [/na UPA/g, 'no pronto-socorro'], [/da UPA/g, 'do pronto-socorro'], [/a UPA/g, 'o pronto-socorro'], [/\bUPA\b/g, 'pronto-socorro']] },
  { quando: antes(2006), trocas: [[/esse meme/g, 'essa piada'], [/um meme/g, 'uma piada'], [/Um meme/g, 'Uma piada'], [/o meme/g, 'a piada'], [/memes/g, 'piadas'], [/\bmeme\b/g, 'piada']] },
  // ERAS v3 · antes de 1970: antes da TV em casa, o rádio (e antes do rádio, o jornal); antes do telefone em casa, a carta;
  // antes do shopping e do supermercado, o centro e o armazém; antes do cartão, o dinheiro e o fiado.
  { quando: sem('tv'), trocas: [
    [/assistindo TV/g, 'ouvindo rádio'], [/assistir TV/g, 'ouvir rádio'], [/assistir à TV/g, 'ouvir o rádio'], [/na televisão/g, 'no rádio'], [/Na televisão/g, 'No rádio'], [/pela televisão/g, 'pelo rádio'],
    [/\bna TV\b/g, 'no rádio'], [/\bNa TV\b/g, 'No rádio'], [/\bpela TV\b/g, 'pelo rádio'], [/\bda TV\b/g, 'do rádio'], [/\ba TV\b/g, 'o rádio'], [/\bA TV\b/g, 'O rádio'], [/\ba televisão\b/g, 'o rádio'], [/televisão até tarde/g, 'conversa até tarde'], [/\bTV\b/g, 'rádio'], [/\btelevisão\b/g, 'rádio']
  ] },
  { quando: sem('radio'), trocas: [[/\bno rádio\b/g, 'no jornal'], [/\bNo rádio\b/g, 'No jornal'], [/\bpelo rádio\b/g, 'pelo jornal'], [/\bo rádio\b/g, 'o jornal'], [/\bO rádio\b/g, 'O jornal']] },
  { quando: (v: Vida) => sem('telefone_fixo')(v) && sem('orelhao')(v), trocas: [
    [/por telefone/g, 'por carta'], [/Por telefone/g, 'Por carta'], [/uma ligação/g, 'uma carta'], [/Uma ligação/g, 'Uma carta'], [/ligou para/g, 'escreveu para'], [/Ligou para/g, 'Escreveu para'],
    [/\btelefonou\b/g, 'escreveu'], [/\bTelefonou\b/g, 'Escreveu'], [/\bno telefone\b/g, 'na carta'], [/\bo telefone\b/g, 'o correio']
  ] },
  { quando: (v: Vida, a: number) => a < (paisDaEpoca(v) === 'US' ? 1956 : paisDaEpoca(v) === 'BR' ? 1966 : 1970), trocas: [[/Na praça de alimentação de um shopping/g, 'Na rua do comércio'], [/Num shopping lotado/g, 'Numa loja lotada'], [/\bde um shopping\b/g, 'de uma loja de departamentos'], [/\bnum shopping\b/g, 'numa loja de departamentos'], [/\bno shopping\b/g, 'no centro'], [/\bao shopping\b/g, 'ao centro'], [/\bdo shopping\b/g, 'do centro'], [/\bo shopping\b/g, 'o centro'], [/shopping center/g, 'centro da cidade']] },
  { quando: (v: Vida, a: number) => a < (paisDaEpoca(v) === 'US' ? 1930 : paisDaEpoca(v) === 'BR' ? 1953 : 1955), trocas: [[/\bno supermercado\b/g, 'no armazém'], [/\bao supermercado\b/g, 'ao armazém'], [/\bdo supermercado\b/g, 'do armazém'], [/\bo supermercado\b/g, 'o armazém'], [/\bsupermercados?\b/g, 'armazém']] },
  { quando: sem('geladeira'), trocas: [[/O sofá e a geladeira/g, 'O sofá e o guarda-comida'], [/a geladeira tinha só água e um pote de margarina/g, 'o armário tinha só pão e um pote de banha'], [/na geladeira/g, 'no guarda-comida'], [/da geladeira/g, 'do guarda-comida'], [/\ba geladeira\b/g, 'o guarda-comida']] },
  { quando: antes(1966), trocas: [[/comendo miojo na panela/g, 'comendo pão com o que havia'], [/\bmiojo\b/g, 'sopa']] },
  { quando: (v: Vida, a: number) => a < (paisDaEpoca(v) === 'US' ? 1950 : paisDaEpoca(v) === 'BR' ? 1956 : 1966), trocas: [[/no cartão de crédito/g, 'fiado'], [/cartão de crédito/g, 'caderneta de fiado'], [/no cartão/g, 'em dinheiro'], [/pagou no débito/g, 'pagou em dinheiro']] },
  { quando: antes(2008), trocas: [[/\baplicativos\b/g, 'programas'], [/\baplicativo\b/g, 'programa']] },
  { quando: sem('radio'), trocas: [[/rádio à noite/g, 'histórias à noite'], [/\brádio\b/g, 'jornal']] },
  { quando: antes(1925), trocas: [[/de ônibus/g, 'de bonde'], [/o ônibus/g, 'o bonde'], [/no ônibus/g, 'no bonde']] },
  { quando: sem('smartphone'), trocas: [
    // ERAS MODERNAS: as brincadeiras de amigo que pressupõem vídeo, meme e foto de perfil no bolso (recados do aparelho).
    [/OLHA ESSE VÍDEO E ME DIZ QUE NÃO É VOCÊ/g, 'VI ALGUÉM NA RUA HOJE IGUALZINHO A VOCÊ'], [/Achei a sua foto de perfil ideal: um gato caindo do sofá\./g, 'Vi um gato caindo do sofá e lembrei de você.'],
    [/Mandei esse meme pra você/g, 'Guardei essa piada pra você'], [/Segue anexo\./g, 'Te mostro quando a gente se encontrar.'],
    [/pelo aplicativo/g, 'por telefone'], [/no aplicativo/g, 'por telefone'], [/um aplicativo/g, 'um serviço'], [/\s?\p{Extended_Pictographic}\uFE0F?/gu, '']] }
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
export const TERMOS_DATADOS: readonly { re: RegExp; desde: number; nome: string; tec?: string; soBR?: boolean; porPais?: Record<string, number>; outros?: number }[] = [
  // ERAS v3 · antes de 1970 (a data é a do Brasil; nos outros países, a chegada da tecnologia lá, quando há `tec`).
  { re: /\btelevisão\b|\bTV\b/, desde: 1950, nome: 'televisão', tec: 'tv' },
  { re: /\brádio\b/i, desde: 1922, nome: 'rádio', tec: 'radio' },
  { re: /\bgeladeira\b/i, desde: 1947, nome: 'geladeira', tec: 'geladeira' },
  { re: /\bshopping\b/i, desde: 1966, nome: 'shopping', porPais: { US: 1956, BR: 1966 }, outros: 1970 },
  { re: /\bsupermercado/i, desde: 1953, nome: 'supermercado', porPais: { US: 1930, BR: 1953 }, outros: 1955 },
  { re: /\bcartão de crédito\b/i, desde: 1956, nome: 'cartão de crédito', porPais: { US: 1950, BR: 1956 }, outros: 1966 },
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
  { re: /\biFood\b/i, desde: 2011, nome: 'iFood', soBR: true },
  { re: /\bPix\b/, desde: 2020, nome: 'Pix', soBR: true },
  { re: /\bselfies?\b/i, desde: 2013, nome: 'selfie' },
  { re: /\bsmartphones?\b/i, desde: 2008, nome: 'smartphone', tec: 'smartphone' },
  { re: /\baplicativos?\b|\bapps?\b/i, desde: 2008, nome: 'aplicativo' },
  { re: /\binfluenciador|\binfluencer/i, desde: 2014, nome: 'influenciador' },
  { re: /\bstories\b/i, desde: 2016, nome: 'stories' },
  { re: /\bstreaming\b/i, desde: 2011, nome: 'streaming', tec: 'streaming' },
  { re: /\bpodcasts?\b/i, desde: 2005, nome: 'podcast' },
  { re: /\bWi-?Fi\b/i, desde: 2003, nome: 'Wi-Fi' },
  { re: /\be-?mails?\b/i, desde: 1995, nome: 'e-mail', tec: 'email' },
  { re: /\binternet\b/i, desde: 1995, nome: 'internet', tec: 'internet' },
  { re: /\bon-?line\b/i, desde: 1995, nome: 'on-line', tec: 'internet' },
  { re: /\bcelular(es)?\b/i, desde: 1990, nome: 'celular', tec: 'celular' },
  { re: /\btorpedos?\b|\bSMS\b/, desde: 1999, nome: 'torpedo', tec: 'sms' },
  { re: /\bEnem\b/, desde: 1998, nome: 'Enem', soBR: true },
  { re: /\bSisu\b/, desde: 2010, nome: 'Sisu', soBR: true },
  { re: /\bProUni\b/i, desde: 2005, nome: 'ProUni', soBR: true },
  { re: /\bFIES\b/, desde: 1999, nome: 'FIES', soBR: true },
  { re: /\bBolsa Família\b/, desde: 2003, nome: 'Bolsa Família', soBR: true },
  { re: /\bMaria da Penha\b/, desde: 2006, nome: 'Lei Maria da Penha', soBR: true },
  { re: /\bDVDs?\b/, desde: 1998, nome: 'DVD', tec: 'dvd' },
  { re: /\bMP3\b/i, desde: 1998, nome: 'MP3', tec: 'mp3' },
  { re: /\bGPS\b/, desde: 2000, nome: 'GPS' },
  { re: /\bQR\b/, desde: 2012, nome: 'QR code' },
  { re: /\bdrones?\b/i, desde: 2014, nome: 'drone' },
  { re: /\bhome office\b/i, desde: 2000, nome: 'home office' },
  { re: /\bcrush\b/i, desde: 2012, nome: 'crush' },
  { re: /\bchamadas? de vídeo\b|\bvideochamadas?\b/i, desde: 2010, nome: 'chamada de vídeo' },
  { re: /\bgrupo da família\b/i, desde: 2011, nome: 'grupo da família' },
  { re: /\bmatch\b/i, desde: 2013, nome: 'match' },
  { re: /\bpostou\b|\bpostar\b|\bpostagem|\bposts?\b/i, desde: 2004, nome: 'postar' },
  { re: /\bseguidores\b/i, desde: 2009, nome: 'seguidores' },
  { re: /\bviraliz/i, desde: 2008, nome: 'viralizar' },
  { re: /\bmemes?\b/i, desde: 2005, nome: 'meme' },
  { re: /\bUPA\b/, desde: 2008, nome: 'UPA', soBR: true },
  { re: /\bSAMU\b/, desde: 2003, nome: 'SAMU', soBR: true },
  { re: /\bSUS\b/, desde: 1990, nome: 'SUS', soBR: true },
  { re: /por aproximação/, desde: 2016, nome: 'pagamento por aproximação' },
  { re: /\bAirbnb\b/i, desde: 2012, nome: 'Airbnb' },
  { re: /\bcoworking\b/i, desde: 2010, nome: 'coworking' },
  { re: /\bstartups?\b/i, desde: 2008, nome: 'startup' },
  { re: /\bLinkedIn\b/i, desde: 2010, nome: 'LinkedIn' },
  { re: /\bbanco digital\b|\bNubank\b/i, desde: 2014, nome: 'banco digital' },
  { re: /\bmaquininha\b/i, desde: 2013, nome: 'maquininha', soBR: true },
  { re: /\b4G\b/, desde: 2013, nome: '4G' },
  { re: /\b5G\b/, desde: 2022, nome: '5G' },
  { re: /\bLei Seca\b/, desde: 2008, nome: 'Lei Seca', soBR: true },
  { re: /\bFicha Limpa\b/, desde: 2010, nome: 'Ficha Limpa', soBR: true },
  { re: /\bemojis?\b/i, desde: 2011, nome: 'emoji' },
  { re: /\bnotebooks?\b/i, desde: 1992, nome: 'notebook', tec: 'notebook' },
  { re: /\bPlayStation\b/i, desde: 1995, nome: 'PlayStation' },
  { re: /\bfoto do perfil\b|\bperfil\b (?:dele|dela|seu|na rede)/i, desde: 2004, nome: 'perfil' }
];

/** Os termos de um texto que ainda não fazem sentido no ano (vazio quando está tudo bem). */
export function anacronismosNoTexto(texto: string, ano: number, pais = 'BR'): string[] {
  const out: string[] = [];
  for (const t of TERMOS_DATADOS) {
    if (t.soBR && pais !== 'BR') continue;
    const desde = t.porPais ? t.porPais[pais] ?? t.outros ?? t.desde : pais !== 'BR' && t.tec ? datasNoPais(pais, t.tec)?.chega ?? t.desde : t.desde;
    if (ano < desde && t.re.test(texto)) out.push(t.nome);
  }
  return out;
}

/** ERAS v2: a cena de decisão inteira (título, texto, opções) do jeito da época. Vida contemporânea: igual. */
export function momentoDaEpoca(v: Vida, m: { titulo: string; texto: string; opcoes: { texto: string; detalhe?: string; bloqueio?: string }[] }): void {
  if (!v.era) return;
  m.titulo = textoDaEpoca(v, m.titulo); m.texto = textoDaEpoca(v, m.texto);
  for (const o of m.opcoes) {
    o.texto = textoDaEpoca(v, o.texto);
    if (o.detalhe) o.detalhe = textoDaEpoca(v, o.detalhe);
    if (o.bloqueio) o.bloqueio = textoDaEpoca(v, o.bloqueio);
  }
}
