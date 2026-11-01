/**
 * HOTFIX 11.5.1 — OS PRÊMIOS INDIVIDUAIS DO FUTEBOL: Bola de Ouro, The Best FIFA, Chuteira de Ouro e Golden Boy.
 *
 * Um prêmio do mundo precisa de um mundo para disputar: a vida não concorre sozinha. Aqui mora o FUTEBOL DO MUNDO — um
 * elenco de estrelas fictícias (nome, nacionalidade, posição, clube de elite, idade, qualidade de pico) que envelhece
 * com a vida: a curva de cada um sobe até os 25, fica no auge até os 30 e cai depois; aos 33–36, para; quem para dá
 * lugar a uma revelação de 17 a 19 anos. Cada temporada de cada estrela é JOGADA pela qualidade daquele ano (a nota, os
 * gols e as assistências pela posição), e os títulos saem do mesmo mundo da vida: a liga do país da vida é a da tabela
 * (`ligas`), a copa continental é a que o clube da vida disputou (quem ganhou a final), a Copa do Mundo é a da seleção
 * da vida quando ela jogou.
 *
 * Os critérios (verificáveis, os mesmos para a vida e para as estrelas):
 *   Bola de Ouro    a temporada inteira: a nota, os gols e as assistências pela posição, os títulos (a continental e a
 *                   Copa do Mundo pesam mais), o peso da liga, a importância no time (titular o ano todo); só a elite.
 *   The Best        o mesmo júri amplo, mais preso ao desempenho individual (nota e produção pesam mais; títulos menos).
 *   Chuteira        os gols da liga × o peso da liga (2 nas cinco grandes da Europa, 1,5 nas outras ligas europeias) —
 *   de Ouro         como a de verdade, só ligas da Europa.
 *   Golden Boy      até 20 anos, numa primeira divisão europeia: a nota, os minutos, os gols — e o quanto já joga.
 *
 * O júri tem opinião (um pouco de acaso em cada voto), mas ninguém ganha sem temporada para isso: a nota e a produção
 * mandam, e a mesma estrela só repete se repetir o ano. O acaso é todo de `rngDe` (o gerador principal não muda).
 */
import { clamp, rngDe, type Rng } from '../rng';
import type { CarreiraEsportiva, EstrelaDoFutebol, FutebolDoMundo, PremioDoFutebol, PremioDoFutebolId, Temporada, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { flex, ge } from '../texto';
import { marcar } from './marcas';
import { palmaresDe, registrarConquista, tDaTemporada } from './palmares';
import { confederacaoDe, forcaDaLigaDoPais, forcaDaSelecao } from './competicoes';
import { paisDaCidade } from '../dados/lugares';
import { GRUPO_DA_POSICAO } from './atributosEsportivos';
import { SEM_CATALOGO } from './tabelaDaLiga';
import { peloClube } from '../dados/clubes';

export const NOME_PREMIO: Record<PremioDoFutebolId, [string, string]> = {
  bola_de_ouro: ['Bola de Ouro', 'Bola de Ouro'],
  the_best: ['The Best FIFA', 'The Best FIFA'],
  chuteira_de_ouro: ['Chuteira de Ouro', 'Chuteira de Ouro'],
  golden_boy: ['Golden Boy', 'Golden Girl']
};
export const nomeDoPremio = (p: PremioDoFutebolId, feminino = false) => NOME_PREMIO[p][feminino ? 1 : 0];
export const PREMIOS: PremioDoFutebolId[] = ['bola_de_ouro', 'the_best', 'chuteira_de_ouro', 'golden_boy'];

/* ------------------------------------------------------------ O mundo (fixo: não depende de pacote carregado) */

/** Os clubes onde as estrelas jogam: [nome (o mesmo dos catálogos), país da liga, peso (o tamanho do clube)]. */
const CLUBES_DE_ELITE: [string, string, number][] = [
  ['Real Madrid', 'ES', 10], ['Barcelona', 'ES', 9], ['Atlético de Madrid', 'ES', 5],
  ['Manchester City', 'GB', 10], ['Liverpool', 'GB', 8], ['Arsenal', 'GB', 7], ['Chelsea', 'GB', 6], ['Manchester United', 'GB', 6], ['Tottenham Hotspur', 'GB', 4],
  ['Bayern de Munique', 'DE', 9], ['Borussia Dortmund', 'DE', 5],
  ['Paris Saint-Germain', 'FR', 8], ['Olympique de Marseille', 'FR', 2],
  ['Inter de Milão', 'IT', 7], ['Juventus', 'IT', 6], ['Milan', 'IT', 5], ['Napoli', 'IT', 4], ['Roma', 'IT', 3],
  ['Benfica', 'PT', 3], ['FC Porto', 'PT', 3], ['Sporting', 'PT', 2],
  ['Flamengo', 'BR', 2], ['Palmeiras', 'BR', 2], ['River Plate', 'AR', 1], ['Boca Juniors', 'AR', 1]
];
const CINCO_GRANDES = new Set(['GB', 'ES', 'DE', 'IT', 'FR']);

/** As nacionalidades das estrelas (peso: quantos craques o país costuma ter) e a força da seleção no sorteio dos torneios. */
const NACOES: [string, number, number][] = [
  ['BR', 12, 5], ['AR', 8, 5], ['FR', 10, 5], ['ES', 8, 4.6], ['GB', 8, 4.3], ['DE', 7, 4.3], ['PT', 6, 4], ['IT', 5, 4],
  ['NL', 5, 3.8], ['BE', 4, 3.4], ['UY', 3, 3], ['CO', 3, 2.9], ['MA', 2, 2.8], ['SN', 2, 2.6], ['NG', 2, 2.4], ['JP', 1, 2.4]
];

type Lingua = 'pt' | 'es' | 'fr' | 'en' | 'de' | 'it' | 'nl' | 'ja';
const LINGUA: Record<string, Lingua> = { BR: 'pt', PT: 'pt', AR: 'es', ES: 'es', UY: 'es', CO: 'es', FR: 'fr', BE: 'fr', MA: 'fr', SN: 'fr', GB: 'en', NG: 'en', DE: 'de', IT: 'it', NL: 'nl', JP: 'ja' };
const NOMES: Record<Lingua, { m: string[]; f: string[]; s: string[] }> = {
  pt: { m: ['Rafael', 'Gabriel', 'Vinícius', 'Lucas', 'Matheus', 'Rodrigo', 'Bruno', 'João Pedro', 'Diogo', 'Endrick', 'Thiago', 'Caio'], f: ['Marta', 'Debinha', 'Kerolin', 'Bia', 'Ludmila', 'Adriana', 'Gabi', 'Ana Clara', 'Jéssica', 'Tamires', 'Duda', 'Rafaelle'], s: ['Silva', 'Santos', 'Oliveira', 'Costa', 'Ferreira', 'Rocha', 'Moura', 'Carvalho', 'Neves', 'Mendes', 'Teixeira', 'Barbosa'] },
  es: { m: ['Lautaro', 'Julián', 'Enzo', 'Pedro', 'Pablo', 'Álvaro', 'Nicolás', 'Facundo', 'Mateo', 'Darwin', 'Luis', 'Sergio'], f: ['Alexia', 'Aitana', 'Jennifer', 'Salma', 'Laia', 'Estefanía', 'Yamila', 'Catalina', 'Linda', 'Mariana', 'Olga', 'Irene'], s: ['González', 'Fernández', 'Martínez', 'Rodríguez', 'Gómez', 'Pérez', 'Álvarez', 'Torres', 'Romero', 'Herrera', 'Navarro', 'Castro'] },
  fr: { m: ['Kylian', 'Antoine', 'Aurélien', 'Ousmane', 'Théo', 'William', 'Youssef', 'Sadio', 'Achraf', 'Hakim', 'Jules', 'Rayan'], f: ['Wendie', 'Kadidiatou', 'Delphine', 'Sakina', 'Grace', 'Marie', 'Selma', 'Eugénie', 'Amandine', 'Ghizlane', 'Clara', 'Inès'], s: ['Dubois', 'Martin', 'Bernard', 'Diallo', 'Traoré', 'Camara', 'Mendy', 'Lefèvre', 'Moreau', 'Benali', 'Fofana', 'Laurent'] },
  en: { m: ['Harry', 'Jude', 'Bukayo', 'Phil', 'Declan', 'Cole', 'Marcus', 'Victor', 'Ademola', 'Jack', 'Mason', 'Kieran'], f: ['Lauren', 'Alessia', 'Lucy', 'Millie', 'Beth', 'Chloe', 'Asisat', 'Ella', 'Georgia', 'Leah', 'Mary', 'Rachel'], s: ['Walker', 'Smith', 'Taylor', 'Hughes', 'Clarke', 'Okafor', 'Adeyemi', 'Wright', 'Bennett', 'Palmer', 'Hall', 'Evans'] },
  de: { m: ['Jamal', 'Florian', 'Leon', 'Kai', 'Joshua', 'Niklas', 'Leroy', 'Thomas', 'Jonas', 'Felix', 'Maximilian', 'Lukas'], f: ['Alexandra', 'Lena', 'Giulia', 'Klara', 'Lea', 'Sjoeke', 'Svenja', 'Marina', 'Jule', 'Sara', 'Anna', 'Laura'], s: ['Müller', 'Schmidt', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Krüger', 'Neumann', 'Richter', 'Wolf', 'Braun', 'Keller'] },
  it: { m: ['Federico', 'Nicolò', 'Sandro', 'Gianluigi', 'Alessandro', 'Lorenzo', 'Giacomo', 'Davide', 'Matteo', 'Riccardo', 'Andrea', 'Marco'], f: ['Cristiana', 'Barbara', 'Sara', 'Valentina', 'Martina', 'Arianna', 'Manuela', 'Giulia', 'Elisa', 'Chiara', 'Lisa', 'Sofia'], s: ['Rossi', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Moretti'] },
  nl: { m: ['Virgil', 'Frenkie', 'Cody', 'Xavi', 'Matthijs', 'Denzel', 'Ryan', 'Tijjani', 'Jurriën', 'Daan', 'Bart', 'Joey'], f: ['Vivianne', 'Lieke', 'Jill', 'Daniëlle', 'Esmee', 'Victoria', 'Lineth', 'Jackie', 'Damaris', 'Romée', 'Sherida', 'Kerstin'], s: ['de Jong', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'de Vries', 'Mulder', 'Janssen', 'Dekker', 'Bos', 'Vos', 'Peters'] },
  ja: { m: ['Takefusa', 'Kaoru', 'Takumi', 'Wataru', 'Daichi', 'Ritsu', 'Kaishu', 'Hiroki', 'Junya', 'Ao', 'Ayase', 'Yuito'], f: ['Saki', 'Hinata', 'Yui', 'Mina', 'Riko', 'Aoba', 'Fuka', 'Hana', 'Moeka', 'Miyabi', 'Kiko', 'Honoka'], s: ['Tanaka', 'Suzuki', 'Takahashi', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Mitoma', 'Endo', 'Kubo'] }
};

const GRUPOS: EstrelaDoFutebol['grupo'][] = ['goleiro', 'defensor', 'defensor', 'meio', 'meio', 'meio', 'atacante', 'atacante', 'atacante', 'atacante'];
const ELENCO = 40;

function pesado<T>(r: Rng, xs: T[], peso: (x: T) => number): T {
  const ps = xs.map(peso);
  let u = r.next() * ps.reduce((s, p) => s + p, 0);
  for (let i = 0; i < xs.length; i++) { u -= ps[i]; if (u <= 0) return xs[i]; }
  return xs[xs.length - 1];
}

function novaEstrela(r: Rng, ano: number, idadeNoAno: number, feminino: boolean, k: number, usados: Set<string>): EstrelaDoFutebol {
  const [nac] = pesado(r, NACOES, x => x[1]);
  const n = NOMES[LINGUA[nac] ?? 'pt'];
  // O nome é único no mundo da vida (a tela e a história leem pelo nome).
  let nome = `${r.pick(feminino ? n.f : n.m)} ${r.pick(n.s)}`;
  for (let t = 0; t < 20 && usados.has(nome); t++) nome = `${r.pick(feminino ? n.f : n.m)} ${r.pick(n.s)}`;
  if (usados.has(nome)) nome = `${nome} ${['Júnior', 'Filho', 'II'][k % 3]}`;
  usados.add(nome);
  const grupo = r.pick(GRUPOS);
  // A qualidade de pico: poucos fora de série, muitos muito bons.
  const base = Math.round(clamp(83 + r.normal() * 3, 76, 92));
  // Os melhores vão para os maiores clubes (o peso do clube × o quanto a estrela é boa).
  const [clube, liga] = pesado(r, CLUBES_DE_ELITE, x => x[2] * Math.exp((base - 84) * 0.12 * (x[2] >= 6 ? 1 : -0.5)));
  return { id: `est${ano}-${k}`, nome, nac, clube, liga, grupo, nasc: ano - idadeNoAno, base };
}

/** A qualidade de uma estrela num ano: sobe até os 25, auge até os 30, cai depois (o goleiro cai mais devagar). */
export function qualidadeNoAno(x: EstrelaDoFutebol, ano: number): number {
  const i = ano - x.nasc;
  const queda = x.grupo === 'goleiro' ? 1.8 : 3;
  return x.base - Math.max(0, 25 - i) * 2.4 - Math.max(0, i - (x.grupo === 'goleiro' ? 31 : 29)) * queda;
}

/** O mundo da vida (criado na primeira temporada de quem joga; envelhecido ano a ano até `ano`). */
function mundoDe(v: Vida, ano: number): FutebolDoMundo {
  const feminino = v.eu.genero === 'feminino';
  let m = v.caminhos.futebolMundo;
  if (!m || m.feminino !== feminino) {
    const r = rngDe(v.id, 'futebol-mundo', feminino ? 'f' : 'm');
    const usados = new Set<string>((m?.feminino === feminino ? m.premios : []).map(p => p.vencedor.nome));
    const estrelas = Array.from({ length: ELENCO }, (_, k) => novaEstrela(r, ano - 1, 17 + Math.floor(r.next() * 17), feminino, k, usados));
    m = { ano, feminino, estrelas, premios: m?.feminino === feminino ? m.premios : [] };
    v.caminhos.futebolMundo = m;
  }
  if (ano - m.ano > 30) m.ano = ano - 30;
  while (m.ano < ano) envelhecer(v, m, m.ano + 1);
  return m;
}

/** Um ano do mundo: quem para (a idade, o corpo), quem chega (a revelação), quem troca de clube. */
function envelhecer(v: Vida, m: FutebolDoMundo, ano: number): void {
  const r = rngDe(v.id, 'futebol-mundo-ano', ano);
  m.estrelas = m.estrelas.filter(x => {
    const i = ano - x.nasc;
    return !(i >= 36 || (i >= 33 && r.chance(0.35)) || (i >= 30 && qualidadeNoAno(x, ano) < 76 && r.chance(0.4)));
  });
  let k = 0;
  // Quem já esteve no mundo (as estrelas de agora e os vencedores de antes) não volta com o mesmo nome.
  const usados = new Set<string>([...m.estrelas.map(x => x.nome), ...m.premios.map(p => p.vencedor.nome)]);
  while (m.estrelas.length < ELENCO) m.estrelas.push(novaEstrela(r, ano, 17 + Math.floor(r.next() * 3), m.feminino, k++, usados));
  for (const x of m.estrelas) {
    if (!r.chance(0.12)) continue;
    const q = qualidadeNoAno(x, ano);
    const [clube, liga] = pesado(r, CLUBES_DE_ELITE.filter(c => c[0] !== x.clube), c => c[2] * Math.exp((q - 84) * 0.12 * (c[2] >= 6 ? 1 : -0.5)));
    x.clube = clube; x.liga = liga;
  }
  m.ano = ano;
}

/* ------------------------------------------------------------ A temporada de cada um */

interface Candidato {
  nome: string; clube: string; nac: string; liga: string; grupo: EstrelaDoFutebol['grupo'];
  idade: number; nota: number; gols: number; golsLiga: number; assist: number; titularidade: number;
  titulos: { liga: boolean; cont: boolean; copa: boolean; mundial: boolean; continentalSel: boolean };
  /** A vida (não uma estrela). */
  voce?: boolean;
  /** A liga é de elite (só a primeira divisão entra na Bola de Ouro, no The Best e no Golden Boy). */
  elite: boolean;
}

/** Os campeões do ano no mundo das estrelas, coerentes com o que a vida viveu (a liga dela, a final que ela jogou). */
interface CampeoesDoAno { liga: Map<string, string | undefined>; cont: Map<string, string | undefined>; mundial?: string; continentalSel: Map<string, string | undefined> }

function campeoesDoAno(v: Vida, ano: number, e: CarreiraEsportiva, t: Temporada): CampeoesDoAno {
  const paisT = t.pais ?? paisDaCidade(e.municipioId);
  const liga = new Map<string, string | undefined>();
  for (const L of new Set(CLUBES_DE_ELITE.map(c => c[1]))) {
    const h = v.caminhos.ligas?.[L]?.historico?.find(x => x.ano === ano);
    if (h?.liga) { liga.set(L, h.liga); continue; }
    const r = rngDe(v.id, 'mundo-liga', L, ano);
    // Um clube de fora da lista às vezes ganha a liga (o Leicester acontece).
    liga.set(L, r.chance(0.18) ? undefined : pesado(r, CLUBES_DE_ELITE.filter(c => c[1] === L), c => c[2] * c[2])[0]);
  }
  const cont = new Map<string, string | undefined>();
  for (const conf of ['UEFA', 'CONMEBOL']) {
    const minha = confederacaoDe(paisT) === conf ? t.copas?.find(c => c.id === `cont:${conf}`) : undefined;
    if (minha?.fase === 'campeão') { cont.set(conf, t.clube); continue; }
    if (minha?.campeao) { cont.set(conf, minha.campeao); continue; }
    const r = rngDe(v.id, 'mundo-cont', conf, ano);
    const lista = CLUBES_DE_ELITE.filter(c => confederacaoDe(c[1]) === conf && c[0] !== (minha ? t.clube : ''));
    cont.set(conf, lista.length && !r.chance(0.12) ? pesado(r, lista, c => c[2] * c[2])[0] : undefined);
  }
  // As seleções: o torneio do ano da vida, quando ela jogou (campeã: a dela; senão, sem a dela); o resto, o sorteio pela força.
  const sels = palmaresDe(v).filter(x => x.tipo === 'selecao' && x.ano === ano && x.modalidade === 'futebol' && x.competicaoId?.startsWith('sel:'));
  const nacao = e.selecao?.pais;
  const sorteio = (chave: string, nacoes: [string, number, number][], id: string): string | undefined => {
    const minha = sels.find(x => x.competicaoId === id);
    if (minha && nacao && /^Campe/.test(minha.texto)) return nacao;
    const r = rngDe(v.id, 'mundo-sel', chave, ano);
    const lista = nacoes.filter(n => !(minha && n[0] === nacao));
    return lista.length ? pesado(r, lista, n => Math.exp(n[2] * 1.3))[0] : undefined;
  };
  const continentalSel = new Map<string, string | undefined>();
  let mundial: string | undefined;
  if (ano % 4 === 2) mundial = sorteio('mundial', [...NACOES, ...(nacao && !NACOES.some(n => n[0] === nacao) ? [[nacao, 0, forcaDaSelecao(nacao)] as [string, number, number]] : [])], 'sel:mundial');
  if (ano % 4 === 0) for (const conf of ['UEFA', 'CONMEBOL', 'CAF', 'AFC'] as const) continentalSel.set(conf, sorteio(conf, NACOES.filter(n => confederacaoDe(n[0]) === conf), `sel:${conf}`));
  return { liga, cont, mundial, continentalSel };
}

function temporadaDaEstrela(v: Vida, x: EstrelaDoFutebol, ano: number, c: CampeoesDoAno): Candidato {
  const r = rngDe(v.id, 'estrela', x.id, ano);
  const q = qualidadeNoAno(x, ano) + r.normal() * 4.2;
  const i = ano - x.nasc;
  // Quem ainda é muito novo joga menos (a titularidade vem com o nível).
  const titularidade = clamp(0.35 + (q - 74) * 0.045 + r.normal() * 0.08, 0.2, 1);
  const nota = Math.round(clamp(6.1 + (q - 80) / 6.5 + r.normal() * 0.25, 5.2, 9.6) * 10) / 10;
  const ataque = x.grupo === 'atacante' ? 0.95 : x.grupo === 'meio' ? 0.38 : x.grupo === 'defensor' ? 0.1 : 0;
  const golsLiga = Math.max(0, Math.round(((q - 62) * ataque + r.normal() * 3.5 * ataque) * titularidade));
  const gols = golsLiga + Math.max(0, Math.round(golsLiga * (0.25 + r.next() * 0.2)));
  const assist = Math.max(0, Math.round((q - 64) * (x.grupo === 'meio' ? 0.5 : x.grupo === 'atacante' ? 0.32 : x.grupo === 'defensor' ? 0.12 : 0.01) * titularidade + r.normal() * 2));
  const conf = confederacaoDe(x.liga);
  return {
    nome: x.nome, clube: x.clube, nac: x.nac, liga: x.liga, grupo: x.grupo, idade: i, nota, gols, golsLiga, assist, titularidade, elite: true,
    titulos: { liga: c.liga.get(x.liga) === x.clube, cont: c.cont.get(conf) === x.clube, copa: r.chance(0.08 * (CLUBES_DE_ELITE.find(k => k[0] === x.clube)?.[2] ?? 3) / 5), mundial: c.mundial === x.nac && titularidade > 0.5, continentalSel: c.continentalSel.get(confederacaoDe(x.nac)) === x.nac && titularidade > 0.5 }
  };
}

function temporadaDaVida(v: Vida, e: CarreiraEsportiva, t: Temporada): Candidato {
  const pais = t.pais ?? paisDaCidade(e.municipioId);
  const pal = palmaresDe(v).filter(x => x.ano === t.ano && x.modalidade === 'futebol');
  const titulo = (pre: string) => pal.some(x => x.tipo === 'titulo' && (x.competicaoId ?? '').startsWith(pre));
  const max = Math.max(1, t.campanha?.[0] ?? 38);
  return {
    nome: `${v.eu.nome} ${v.eu.sobrenome}`.trim(), clube: t.clube, nac: e.selecao?.pais ?? pais, liga: pais, grupo: t.posicao ? GRUPO_DA_POSICAO[t.posicao] : 'meio',
    idade: idade(v), nota: t.nota, gols: t.gols, golsLiga: Math.round(t.gols * 0.82), assist: Math.round(t.assistencias), titularidade: clamp(t.titular / max, 0, 1), voce: true, elite: t.nivel === 4,
    titulos: { liga: t.nivel === 4 && t.colocacao === 1, cont: titulo('cont:'), copa: titulo('copa:'), mundial: pal.some(x => x.tipo === 'selecao' && x.competicaoId === 'sel:mundial' && /^Campe/.test(x.texto) && x.papel === 'protagonista'), continentalSel: pal.some(x => x.tipo === 'selecao' && x.competicaoId !== 'sel:mundial' && x.competicaoId?.startsWith('sel:') && /^Campe/.test(x.texto) && x.papel === 'protagonista') }
  };
}

/* ------------------------------------------------------------ Os critérios */

const pesoDaLiga = (pais: string) => clamp(forcaDaLigaDoPais(pais), -0.5, 0.6);

/** A produção pela posição (o goleiro e o zagueiro não ganham por gol; a nota diz o ano deles). */
const producao = (x: Candidato) => (x.grupo === 'atacante' ? x.gols * 0.9 + x.assist * 0.5 : x.grupo === 'meio' ? x.gols * 0.9 + x.assist * 0.75 : x.grupo === 'defensor' ? x.gols * 0.8 + x.assist * 0.6 + 6 : 8);
const titulos = (x: Candidato, peso = 1) => (x.titulos.liga ? 7 : 0) + (x.titulos.cont ? 13 : 0) + (x.titulos.copa ? 2 : 0) + (x.titulos.mundial ? 15 : 0) + (x.titulos.continentalSel ? 8 : 0) * peso;

/** A pontuação de um candidato em cada prêmio (`undefined`: não concorre). Pública para os testes e a auditoria. */
export function pontuacao(p: PremioDoFutebolId, x: Candidato): number | undefined {
  const europa = confederacaoDe(x.liga) === 'UEFA';
  switch (p) {
    case 'bola_de_ouro':
      if (!x.elite || x.titularidade < 0.5) return undefined;
      return (x.nota - 6) * 15 + producao(x) + titulos(x) + pesoDaLiga(x.liga) * 14 + x.titularidade * 6;
    case 'the_best':
      if (!x.elite || x.titularidade < 0.5) return undefined;
      return (x.nota - 6) * 19 + producao(x) * 1.1 + titulos(x) * 0.7 + pesoDaLiga(x.liga) * 10 + x.titularidade * 6;
    case 'chuteira_de_ouro':
      if (!x.elite || !europa) return undefined;
      return x.golsLiga * (CINCO_GRANDES.has(x.liga) ? 2 : 1.5);
    case 'golden_boy':
      if (!x.elite || !europa || x.idade > 20) return undefined;
      return (x.nota - 6) * 16 + x.gols * 0.7 + x.assist * 0.5 + x.titularidade * 14 + titulos(x, 0.5) * 0.4;
  }
}

/** O voto do júri: a pontuação com um pouco de opinião (a Chuteira é a contagem, sem júri). */
function votar(p: PremioDoFutebolId, cs: Candidato[], r: Rng): { c: Candidato; pts: number }[] {
  return cs.map(c => ({ c, base: pontuacao(p, c) }))
    .filter((x): x is { c: Candidato; base: number } => x.base !== undefined)
    .map(x => ({ c: x.c, pts: p === 'chuteira_de_ouro' ? x.base + r.next() * 0.01 : x.base + r.normal() * 4.5 }))
    .sort((a, b) => b.pts - a.pts);
}

/* ------------------------------------------------------------ O ano dos prêmios */

/**
 * Os prêmios da temporada `t` (o ano do futebol da vida): o mundo joga o ano dele, a vida entra com o que jogou, e cada
 * prêmio sai pela votação. A vida ganha → conquista, galeria, biografia, nome; fica no pódio ou entre os dez → biografia.
 */
export function premiosDoMundo(v: Vida, e: CarreiraEsportiva, t: Temporada): void {
  if (e.modalidade !== 'futebol' || e.fase !== 'profissional') return;
  const ano = t.ano;
  const m = mundoDe(v, ano);
  if (m.premios.some(x => x.ano === ano)) return;
  const c = campeoesDoAno(v, ano, e, t);
  const estrelas = m.estrelas.map(x => temporadaDaEstrela(v, x, ano, c));
  const eu = temporadaDaVida(v, e, t);
  const todos = t.partidas > 0 ? [...estrelas, eu] : estrelas;
  const g = ge(v);
  const fem = m.feminino;
  for (const p of PREMIOS) {
    const ranking = votar(p, todos, rngDe(v.id, 'juri', p, ano));
    if (!ranking.length) continue;
    const w = ranking[0].c;
    const pos = ranking.findIndex(x => x.c.voce) + 1;
    const res: PremioDoFutebol = { ano, premio: p, vencedor: { nome: w.nome, clube: w.clube, nac: w.nac, gols: p === 'chuteira_de_ouro' ? w.golsLiga : w.gols, ...(w.voce ? { voce: true } : {}) }, podio: ranking.slice(0, 3).map(x => x.c.nome), ...(pos > 0 && pos <= 30 ? { voce: pos } : {}) };
    m.premios.push(res);
    const nome = nomeDoPremio(p, fem);
    if (pos === 1) {
      const texto = p === 'chuteira_de_ouro' ? `${nome} ${ano}, com ${eu.golsLiga} gols na liga` : `${nome} ${ano}`;
      registrarConquista(v, { tipo: 'premio', modalidade: 'futebol', ano, competicao: nome, competicaoId: `premio:${p}`, clube: t.clube, texto });
      const frase = p === 'bola_de_ouro' ? `${flex(g, 'Eleito', 'Eleita', 'Eleito')} ${flex(g, 'o melhor jogador', 'a melhor jogadora', 'quem melhor jogou')} do mundo: a ${nome} de ${ano}, jogando ${peloClube(t.clube.replace(SEM_CATALOGO, ''))} — ${t.gols} gols e ${Math.round(t.assistencias)} assistências na temporada.`
        : p === 'the_best' ? `O ${nome} de ${ano}: o prêmio da FIFA para quem fez o melhor ano do futebol.`
          : p === 'chuteira_de_ouro' ? `${cap(nome)} de ${ano}: ${eu.golsLiga} gols na liga, ${flex(g, 'o artilheiro', 'a artilheira', 'quem mais marcou')} da Europa no ano.`
            : `${nome} de ${ano}: ${flex(g, 'o melhor jovem', 'a melhor jovem', 'o melhor jovem')} da Europa, aos ${eu.idade} anos.`;
      escrever(v, { t: tDaTemporada(v, ano), texto: frase, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
      marcar(v, 'conquista', `${nome} (${ano}).`, 3, { dominio: 'futebol', t: tDaTemporada(v, ano) });
      e.reputacao = clamp((e.reputacao ?? 30) + (p === 'bola_de_ouro' || p === 'the_best' ? 8 : 4));
    } else if (pos >= 2 && pos <= 3 && p !== 'chuteira_de_ouro') {
      escrever(v, { t: tDaTemporada(v, ano), texto: `${pos}º lugar na ${nome} de ${ano} — ${p === 'golden_boy' ? 'entre os jovens da Europa' : 'entre os melhores do mundo'}; quem levou foi ${w.nome}, ${w.clube}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
      registrarConquista(v, { tipo: 'marco', modalidade: 'futebol', ano, competicao: nome, competicaoId: `premio:${p}`, clube: t.clube, texto: `${pos}º lugar na ${nome}` });
      e.reputacao = clamp((e.reputacao ?? 30) + 2);
    } else if (pos >= 4 && pos <= 10 && (p === 'bola_de_ouro' || p === 'golden_boy')) {
      escrever(v, { t: tDaTemporada(v, ano), texto: `Entre os indicados ${p === 'golden_boy' ? 'ao' : 'à'} ${nome} de ${ano}: terminou em ${pos}º na votação.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
    }
  }
  // Até 25 anos de história (quatro prêmios por ano).
  const anos = [...new Set(m.premios.map(x => x.ano))].sort((a, b) => a - b);
  if (anos.length > 25) m.premios = m.premios.filter(x => x.ano > anos[anos.length - 26]);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Os vencedores de cada prêmio, do ano mais recente ao mais antigo (a tela da carreira). */
export function historicoDosPremios(v: Vida): { ano: number; premios: PremioDoFutebol[] }[] {
  const xs = v.caminhos.futebolMundo?.premios ?? [];
  const anos = [...new Set(xs.map(x => x.ano))].sort((a, b) => b - a);
  return anos.map(ano => ({ ano, premios: PREMIOS.map(p => xs.find(x => x.ano === ano && x.premio === p)).filter((x): x is PremioDoFutebol => !!x) }));
}
