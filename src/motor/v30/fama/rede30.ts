/**
 * VIDA 30 · §3 — O MEIO: AS PESSOAS FAMOSAS COMO GENTE, E A FAMA VIVIDA EM PESSOA.
 *
 * Antes, a pessoa famosa do celular nascia na hora (um "molde": nome sorteado, área sorteada, "adorei o seu trabalho") e
 * só existia depois de responder; o reconhecimento na rua era uma linha em "Na imprensa e nas ruas". Aqui:
 *
 *   A REDE     quando o seu nome começa a circular, o mundo já tem o seu meio: uma dúzia de figuras públicas da sua época e
 *              do seu país, com ofício (a cantora de MPB, o atacante, a pivô, o jogador de CS, a apresentadora, a chef), a
 *              cidade, o tamanho do nome, um jeito (simpática, reservado, vaidoso, generosa, polêmico) e uma trajetória que
 *              anda sozinha: lançam, estreiam, se transferem, ganham, caem, voltam. Elas se conhecem: amizades,
 *              rivalidades, romances, casamentos, separações, parcerias — e isso vira notícia. Você não é o centro.
 *   CONHECER   numa festa, numa premiação, num jogo beneficente, num lançamento (o convite do celular ou da agenda, ou o
 *              acaso de quem já circula), você encontra UMA dessas figuras, com o que ela é e o que viveu. Conversar,
 *              trocar contato ou flertar faz dela uma Pessoa da sua vida (o MESMO sistema de vínculos, memória,
 *              iniciativas, romance) — e ela continua a vida própria, agora com você dentro.
 *   A RUA      ser reconhecido acontece em pessoa, no lugar de quem você é: o caixa da padaria (o nome local), o grupo
 *              que pede foto no shopping, a fila no aeroporto, o fotógrafo na porta do restaurante (o nome enorme). Às
 *              vezes alguém lembra do que acabou de acontecer (o título, a obra, a polêmica); às vezes chega alguém com
 *              uma proposta. Responder tem preço: a imagem, o cansaço, a privacidade.
 *   O CUSTO    a privacidade (0–100) cai com o tamanho do nome e com cada aparição; baixa, ela pesa no estresse e no
 *              casal que não escolheu a exposição. Ninguém é alvo permanente: o fotógrafo é do nome enorme, e raro.
 *
 * Sorteios derivados (`rngDe`): o acaso principal da vida não muda. Só funções declaradas (sem chamada no carregamento:
 * este pacote vive num ciclo de chunks com o motor — a lição da VIDA 28).
 */
import type { Pessoa, Vida, Vinculo } from '../../tipos';
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import { idade, idadePessoa, lembrarCom, parceiro } from '../../nucleo';
import { anoDe } from '../../tempo';
import { municipio, paisDaCidade, grandesCentros } from '../../dados/lugares';
import { sortearNome, sortearSobrenome } from '../../dados/nomes';
import { criarPessoa, vincular } from '../../pessoas';
import { atraiGenero, interesseInicial, podeTerRomance } from '../../sistemas/romance';
import { novoContexto, registrarFase } from '../../sistemas/relacoes';
import { origensDaFama13, marcosDaFama13 } from '../../sistemas/reconhecimento13';
import { somarAoNome, origemDoNome } from '../../sistemas/notoriedade';
import { reconhecimentoLocal21 } from '../../v21/fama/fama21';
import type { AreaCelebridade15, Molde15 } from '../../dados15/celular/tipos';

export type Area30 = 'musica' | 'atuacao' | 'tv' | 'futebol' | 'esporte' | 'esports' | 'negocios' | 'internet' | 'moda';
export type Traco30 = 'simpatico' | 'reservado' | 'vaidoso' | 'generoso' | 'polemico';
export type LacoTipo30 = 'amizade' | 'rivalidade' | 'romance' | 'casados' | 'parceria' | 'separados';

export interface Figura30 {
  id: string;
  nome: string;
  sobrenome: string;
  genero: Pessoa['genero'];
  /** Ano de nascimento. */
  nasc: number;
  area: Area30;
  /** "cantora de MPB", "atacante do Bahia", "pivô de basquete". */
  oficio: string;
  /** 1 conhecido no país (no meio), 2 nacional, 3 internacional. */
  nivel: 1 | 2 | 3;
  municipioId: string;
  traco: Traco30;
  /** Os laços com outras figuras (simétricos). */
  lacos: { com: string; tipo: LacoTipo30; desde: number }[];
  /** O que viveu (os últimos), em frase. */
  fatos: { ano: number; texto: string; tom?: 'bom' | 'ruim' }[];
  /** Quando você a conheceu, a Pessoa dela na sua vida. */
  pessoaId?: string;
  /** Saiu de cena (aposentou, sumiu do meio). */
  fora?: number;
}

export interface Cena30 {
  t: number;
  tipo: 'rua' | 'evento' | 'paparazzi' | 'proposta';
  /** Onde: "a padaria do bairro", "o saguão do aeroporto", "a premiação do ano". */
  onde: string;
  nivel: number;
  figuraId?: string;
  /** O que alguém lembrou (o marco recente), quando lembrou. */
  lembrou?: string;
  /** O evento (do convite), quando veio de um. */
  evento?: string;
}

export interface Fama30 {
  figuras: Figura30[];
  /** O último ano em que a rede viveu. */
  ano: number;
  /** 0–100: o quanto ainda dá para viver sem ser visto. */
  privacidade: number;
  cena?: Cena30;
  /** As cenas que aconteceram (as últimas), para a tela e para não repetir lugar. */
  vividas: { t: number; tipo: Cena30['tipo']; onde: string; resposta?: string }[];
}

/* ------------------------------------------------------------------ Leitura */

/** O tamanho do nome para a fama vivida: 0 ninguém, 1 local/conhecido, 2 nacional, 3 muito famoso, 4 internacional. */
export function nivelDoNome30(v: Vida): number {
  const x = v.notoriedade?.valor ?? 0;
  const n = x >= 78 ? 4 : x >= 55 ? 3 : x >= 30 ? 2 : x >= 10 ? 1 : 0;
  if (n === 0 && reconhecimentoLocal21(v).valor >= 45) return 1;
  return n;
}

export function fama30(v: Vida): Fama30 | undefined { return v.fama30; }
export function figura30(v: Vida, id: string | undefined): Figura30 | undefined { return id ? v.fama30?.figuras.find(f => f.id === id) : undefined; }
export const nomeDaFigura30 = (f: Figura30) => `${f.nome} ${f.sobrenome}`;
export function idadeDaFigura30(v: Vida, f: Figura30): number { return anoDe(v.t) - f.nasc; }
const fem = (f: { genero: Pessoa['genero'] }) => f.genero === 'feminino';
const a = (f: { genero: Pessoa['genero'] }) => (fem(f) ? 'a' : 'o');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ Criar o meio */

const OFICIOS: Record<Area30, [string, string][]> = {
  musica: [['cantor de sertanejo', 'cantora de sertanejo'], ['cantor de MPB', 'cantora de MPB'], ['rapper', 'rapper'], ['cantor de pagode', 'cantora de pagode'], ['cantor pop', 'cantora pop'], ['vocalista de rock', 'vocalista de rock']],
  atuacao: [['ator de novela', 'atriz de novela'], ['ator de cinema', 'atriz de cinema'], ['humorista', 'humorista']],
  tv: [['apresentador de TV', 'apresentadora de TV'], ['jornalista de TV', 'jornalista de TV']],
  futebol: [['atacante', 'atacante'], ['goleiro', 'goleira'], ['meio-campista', 'meio-campista'], ['zagueiro', 'zagueira']],
  esporte: [['pivô de basquete', 'pivô de basquete'], ['jogador de vôlei', 'levantadora de vôlei'], ['tenista', 'tenista'], ['nadador', 'nadadora'], ['lutador de MMA', 'lutadora de MMA'], ['velocista', 'velocista']],
  esports: [['jogador de CS', 'jogadora de CS'], ['jogador de LoL', 'jogadora de LoL']],
  negocios: [['empresário do varejo', 'empresária do varejo'], ['fundador de startup', 'fundadora de startup'], ['chef de cozinha', 'chef de cozinha']],
  internet: [['youtuber de humor', 'youtuber de humor'], ['influenciador de viagens', 'influenciadora de moda'], ['streamer', 'streamer']],
  moda: [['modelo', 'modelo'], ['estilista', 'estilista']]
};
const AREA15: Record<Area30, AreaCelebridade15> = { musica: 'musica', atuacao: 'cinema', tv: 'tv', futebol: 'esporte', esporte: 'esporte', esports: 'esporte', negocios: 'negocios', internet: 'internet', moda: 'moda' };
const TRACOS: Traco30[] = ['simpatico', 'reservado', 'vaidoso', 'generoso', 'polemico'];

/** As áreas que existem na época (sem streamer em 1970, sem TV em 1940). */
function areasDaEpoca(ano: number): Area30[] {
  return (['musica', 'atuacao', 'tv', 'futebol', 'esporte', 'esports', 'negocios', 'internet', 'moda'] as Area30[])
    .filter(x => !(x === 'tv' && ano < 1955) && !(x === 'internet' && ano < 2008) && !(x === 'esports' && ano < 2010));
}

/** A área de onde vem o seu nome (o meio que você frequenta mais). */
function suaArea30(v: Vida): Area30 | undefined {
  const o = origensDaFama13(v)[0]?.origem;
  if (o === 'esportiva') return v.esports25 && v.trabalho.atual?.ocupacaoId === 'jogador_esports' ? 'esports' : (v.caminhos.esporte?.modalidade ?? 'futebol') === 'futebol' ? 'futebol' : 'esporte';
  if (o === 'musical') return 'musica';
  if (o === 'artistica') return 'atuacao';
  if (o === 'empresarial') return 'negocios';
  if (o === 'digital') return 'internet';
  return undefined;
}

/** Cria o meio (uma vez, quando o nome começa a circular). Metade dele é da sua área; o resto, do mundo. */
export function garantirRede30(v: Vida): Fama30 {
  if (v.fama30) return v.fama30;
  const r = rngDe(v.id, 'rede30', 'criar');
  const ano = anoDe(v.t);
  const pais = paisDaCidade(v.moradia.municipioId);
  const cidades = [...new Set([v.moradia.municipioId, ...grandesCentros(pais)])];
  const areas = areasDaEpoca(ano);
  const minha = suaArea30(v);
  const eu = idade(v);
  const figuras: Figura30[] = [];
  const usados = new Set<string>();
  for (let k = 0; k < 14; k++) {
    const area = minha && k < 6 && areas.includes(minha) ? minha : areas[Math.floor(r.next() * areas.length)];
    const genero: Pessoa['genero'] = r.chance(0.5) ? 'feminino' : 'masculino';
    const idadeF = clamp(eu + r.int(-10, 12), area === 'esports' ? 18 : 20, area === 'futebol' || area === 'esporte' || area === 'esports' ? 36 : 70);
    const nasc = ano - idadeF;
    let nome = sortearNome(r, genero, nasc, pais);
    let sobrenome = sortearSobrenome(r, pais);
    for (let j = 0; j < 4 && usados.has(`${nome} ${sobrenome}`); j++) { nome = sortearNome(r, genero, nasc, pais); sobrenome = sortearSobrenome(r, pais); }
    usados.add(`${nome} ${sobrenome}`);
    const [m, f] = OFICIOS[area][Math.floor(r.next() * OFICIOS[area].length)];
    figuras.push({ id: `fg${k}`, nome, sobrenome, genero, nasc, area, oficio: genero === 'feminino' ? f : m, nivel: (r.chance(0.2) ? 3 : r.chance(0.5) ? 2 : 1) as 1 | 2 | 3, municipioId: cidades[Math.floor(r.next() * cidades.length)], traco: TRACOS[Math.floor(r.next() * TRACOS.length)], lacos: [], fatos: [] });
  }
  // Os laços que já existiam antes de você chegar: amizades e uma rivalidade na mesma área.
  for (let k = 0; k < 4; k++) { const x = figuras[r.int(0, figuras.length - 1)], y = figuras[r.int(0, figuras.length - 1)]; if (x !== y && !laco(x, y.id)) ligar(x, y, x.area === y.area && r.chance(0.4) ? 'rivalidade' : 'amizade', v.t - r.int(12, 60)); }
  v.fama30 = { figuras, ano, privacidade: 90, vividas: [] };
  return v.fama30;
}

function laco(x: Figura30, outro: string) { return x.lacos.find(l => l.com === outro); }
function ligar(x: Figura30, y: Figura30, tipo: LacoTipo30, t: number): void {
  for (const [p, q] of [[x, y], [y, x]] as const) { const l = laco(p, q.id); if (l) { l.tipo = tipo; l.desde = t; } else p.lacos.push({ com: q.id, tipo, desde: t }); }
}
function fato(f: Figura30, ano: number, texto: string, tom?: 'bom' | 'ruim'): void {
  f.fatos.push({ ano, texto, ...(tom ? { tom } : {}) });
  if (f.fatos.length > 8) f.fatos.splice(0, f.fatos.length - 8);
}

/* ------------------------------------------------------------------ O ano do meio */

const OBRA: Record<Area30, string[]> = {
  musica: ['lançou um disco novo', 'fez uma turnê com ingressos esgotados', 'gravou um dueto que tocou o ano inteiro', 'fez um show de graça na praia'],
  atuacao: ['estreou na novela das nove', 'estrelou um filme que foi a festivais', 'protagonizou uma série de streaming', 'voltou ao teatro'],
  tv: ['ganhou um programa próprio', 'apresentou a cobertura do ano', 'trocou de emissora'],
  futebol: ['foi artilheiro do campeonato', 'trocou de clube numa transferência milionária', 'foi convocado para a seleção', 'levantou a taça do estadual'],
  esporte: ['ganhou o título nacional', 'foi a uma final internacional', 'bateu o recorde da prova', 'voltou de uma lesão'],
  esports: ['foi campeão do major', 'trocou de organização', 'foi eleito melhor jogador do campeonato'],
  negocios: ['abriu uma nova rede', 'vendeu parte da empresa a um fundo', 'abriu um restaurante disputado', 'virou capa de revista de negócios'],
  internet: ['bateu um recorde de visualizações', 'lançou uma marca própria', 'fez uma série de vídeos que viralizou'],
  moda: ['estrelou uma campanha internacional', 'desfilou em Paris', 'lançou uma coleção']
};

/**
 * O ano do meio (sem você no centro): cada figura vive o seu ano; os laços entre elas mudam; as notícias saem. Sorteio
 * derivado. Devolve as manchetes do ano (para o jornal e a tela).
 */
export function anoDaRede30(v: Vida): string[] {
  const m = v.fama30;
  const ano = anoDe(v.t) - 1;
  if (!m || m.ano >= ano + 1) return [];
  m.ano = ano + 1;
  const r = rngDe(v.id, 'rede30', ano);
  const vivas = m.figuras.filter(f => f.fora === undefined);
  const manchetes: string[] = [];
  for (const f of vivas) {
    const i = ano - f.nasc;
    // Os atletas param cedo; quem envelhece no meio às vezes sai de cena.
    if (((f.area === 'futebol' || f.area === 'esporte') && i >= 36) || (f.area === 'esports' && i >= 31) || (i >= 75 && r.chance(0.2))) {
      f.fora = ano;
      fato(f, ano, f.area === 'futebol' || f.area === 'esporte' || f.area === 'esports' ? 'encerrou a carreira, com festa e despedida' : 'saiu de cena, longe dos holofotes');
      continue;
    }
    const x = r.next();
    if (f.traco === 'polemico' && x < 0.12) { fato(f, ano, 'virou alvo de polêmica por uma declaração', 'ruim'); if (f.nivel > 1 && r.chance(0.4)) f.nivel = (f.nivel - 1) as 1 | 2; manchetes.push(`${nomeDaFigura30(f)} no meio de uma polêmica`); continue; }
    const obra = OBRA[f.area][Math.floor(r.next() * OBRA[f.area].length)];
    const deu = r.next() + (f.nivel - 2) * 0.08;
    fato(f, ano, obra, deu > 0.7 ? 'bom' : undefined);
    if (deu > 0.93 && f.nivel < 3) { f.nivel = (f.nivel + 1) as 2 | 3; manchetes.push(`${nomeDaFigura30(f)} é um dos nomes do ano`); }
    else if (deu > 0.75) manchetes.push(`${nomeDaFigura30(f)} ${obra}`);
  }
  // Os laços entre elas: um ou dois por ano (a amizade, a rivalidade, o romance, o casamento, a separação, a parceria).
  for (let k = 0; k < 2; k++) {
    if (!r.chance(0.55) || vivas.length < 2) continue;
    const x = vivas[Math.floor(r.next() * vivas.length)];
    const y = vivas[Math.floor(r.next() * vivas.length)];
    if (x === y) continue;
    const l = laco(x, y.id);
    const par = (z: Figura30) => z.lacos.some(q => q.tipo === 'romance' || q.tipo === 'casados');
    if (l?.tipo === 'romance' && r.chance(0.45)) { ligar(x, y, r.chance(0.6) ? 'casados' : 'separados', v.t); const casou = laco(x, y.id)!.tipo === 'casados'; fato(x, ano, casou ? `casou com ${nomeDaFigura30(y)}` : `terminou com ${nomeDaFigura30(y)}`, casou ? 'bom' : 'ruim'); fato(y, ano, casou ? `casou com ${nomeDaFigura30(x)}` : `terminou com ${nomeDaFigura30(x)}`, casou ? 'bom' : 'ruim'); manchetes.push(casou ? `${x.nome} e ${y.nome} se casam` : `${x.nome} e ${y.nome} terminam`); continue; }
    if (l?.tipo === 'casados' && r.chance(0.12)) { ligar(x, y, 'separados', v.t); fato(x, ano, `separou-se de ${nomeDaFigura30(y)}`, 'ruim'); fato(y, ano, `separou-se de ${nomeDaFigura30(x)}`, 'ruim'); manchetes.push(`Fim do casamento de ${x.nome} e ${y.nome}`); continue; }
    if (l) continue;
    const idadeOk = Math.abs(x.nasc - y.nasc) <= 12;
    if (!par(x) && !par(y) && idadeOk && x.genero !== y.genero && r.chance(0.35)) { ligar(x, y, 'romance', v.t); fato(x, ano, `assumiu o namoro com ${nomeDaFigura30(y)}`); fato(y, ano, `assumiu o namoro com ${nomeDaFigura30(x)}`); manchetes.push(`${x.nome} e ${y.nome}: o casal do ano`); }
    else if (x.area === y.area && r.chance(0.4)) { ligar(x, y, 'rivalidade', v.t); manchetes.push(`A rivalidade entre ${x.nome} e ${y.nome} esquenta`); }
    else if (x.area !== y.area && r.chance(0.5)) { ligar(x, y, 'parceria', v.t); fato(x, ano, `fez uma parceria com ${nomeDaFigura30(y)}`); fato(y, ano, `fez uma parceria com ${nomeDaFigura30(x)}`); manchetes.push(`${x.nome} e ${y.nome} anunciam parceria`); }
    else ligar(x, y, 'amizade', v.t);
  }
  // O meio se renova: quem saiu de cena abre lugar para um nome novo (devagar).
  if (vivas.length < 11) { const novo = novaFigura30(v, r, m.figuras.length); m.figuras.push(novo); fato(novo, ano, 'apareceu para o grande público'); manchetes.push(`${nomeDaFigura30(novo)}, o nome novo do ano`); }
  if (m.figuras.length > 24) m.figuras = m.figuras.filter(f => f.fora === undefined || f.pessoaId || ano - f.fora < 6);
  return manchetes.slice(0, 4);
}

function novaFigura30(v: Vida, r: Rng, k: number): Figura30 {
  const ano = anoDe(v.t);
  const pais = paisDaCidade(v.moradia.municipioId);
  const areas = areasDaEpoca(ano);
  const area = areas[Math.floor(r.next() * areas.length)];
  const genero: Pessoa['genero'] = r.chance(0.5) ? 'feminino' : 'masculino';
  const nasc = ano - r.int(19, 30);
  const [m, f] = OFICIOS[area][Math.floor(r.next() * OFICIOS[area].length)];
  return { id: `fg${k}_${ano}`, nome: sortearNome(r, genero, nasc, pais), sobrenome: sortearSobrenome(r, pais), genero, nasc, area, oficio: genero === 'feminino' ? f : m, nivel: 1, municipioId: grandesCentros(pais)[0], traco: TRACOS[Math.floor(r.next() * TRACOS.length)], lacos: [], fatos: [] };
}

/* ------------------------------------------------------------------ A privacidade e as cenas do ano */

const LUGARES_RUA: Record<number, string[]> = {
  1: ['a padaria do bairro', 'a fila do mercado', 'a farmácia da esquina', 'o ponto de ônibus'],
  2: ['o shopping', 'um restaurante do centro', 'a saída do cinema', 'a feira de domingo'],
  3: ['o saguão do aeroporto', 'um restaurante cheio', 'o corredor do shopping', 'a arquibancada de um jogo'],
  4: ['o saguão do aeroporto', 'a porta do hotel', 'a saída de um restaurante', 'o calçadão da praia']
};
const EVENTOS30: { id: string; onde: string; areas: Area30[]; nivel: number }[] = [
  { id: 'festa', onde: 'uma festa fechada numa cobertura', areas: ['musica', 'atuacao', 'internet', 'moda', 'futebol'], nivel: 2 },
  { id: 'premiacao', onde: 'a noite de premiação do ano', areas: ['musica', 'atuacao', 'tv', 'futebol', 'esporte', 'esports'], nivel: 2 },
  { id: 'beneficente', onde: 'um jogo beneficente no estádio', areas: ['futebol', 'esporte', 'musica', 'tv'], nivel: 2 },
  { id: 'lancamento', onde: 'o lançamento de uma marca', areas: ['moda', 'internet', 'negocios', 'esports'], nivel: 2 },
  { id: 'estreia', onde: 'a pré-estreia de um filme', areas: ['atuacao', 'tv', 'musica', 'internet'], nivel: 3 },
  { id: 'gala', onde: 'um jantar de gala beneficente', areas: ['negocios', 'tv', 'atuacao', 'futebol'], nivel: 3 }
];

/** A privacidade do ano: o nome grande e as aparições a tiram; a vida discreta a devolve. */
function privacidadeDoAno30(v: Vida, m: Fama30, n: number): void {
  const aparicoes = m.vividas.filter(x => v.t - x.t <= 12).length;
  m.privacidade = clamp(Math.round(m.privacidade + 8 - n * 5 - aparicoes * 3), 5, 100);
  if (m.privacidade <= 30) {
    v.mente.estresse = clamp(Math.round(v.mente.estresse + (35 - m.privacidade) / 6));
    // O casal que não escolheu a exposição sente (só quem não é do meio).
    const par = parceiro(v);
    if (par && !par.p.celebridade15 && rngDe(v.id, 'priv30', v.t).chance(0.35)) {
      par.vin.tensao = clamp(par.vin.tensao + 5);
      lembrarCom(v, par.p.id, 'Reclamou da falta de privacidade: fotos, gente, o endereço descoberto.', 'conflito');
    }
  }
}

/**
 * O ano da fama vivida (chamado no fim do ano, depois dos outros fluxos): o meio vive, a privacidade anda e, às vezes,
 * uma cena em pessoa — a rua, o evento, o fotógrafo. Só abre cena num ano sem decisão nenhuma. Devolve o id do conteúdo
 * a abrir (ou undefined).
 */
export function fama30DoAno(v: Vida, semDecisao: boolean): string | undefined {
  if (v.morte || idade(v) < 12) return undefined;
  const n = idade(v) < 14 ? 0 : nivelDoNome30(v);
  // VIDA 30: o meio existe para todo mundo (a gente famosa vive e vira notícia mesmo para quem não é famoso).
  const m = garantirRede30(v);
  anoDaRede30(v);
  privacidadeDoAno30(v, m, n);
  if (!semDecisao || n === 0) return undefined;
  const r = rngDe(v.id, 'cena30', v.t);
  const ultima = m.vividas[m.vividas.length - 1];
  if (ultima && v.t - ultima.t < 12) return undefined;
  // O fotógrafo é do nome enorme — e raro (de dois em dois anos, no máximo).
  const papa = n >= 3 && !m.vividas.some(x => x.tipo === 'paparazzi' && v.t - x.t < 24) && r.chance(n === 4 ? 0.3 : 0.15);
  if (papa) { m.cena = { t: v.t, tipo: 'paparazzi', onde: r.pick(LUGARES_RUA[4]), nivel: n }; return 'fama30_paparazzi'; }
  const evento = n >= 2 && r.chance(0.18 + (n - 2) * 0.08);
  if (evento) { const c = cenaDeEvento30(v, r, n); if (c) { m.cena = c; return 'fama30_evento'; } }
  if (r.chance(0.2 + n * 0.1)) {
    const lugares = LUGARES_RUA[Math.min(4, n)].filter(l => !m.vividas.some(x => x.onde === l && v.t - x.t < 36));
    const marco = marcosDaFama13(v).filter(x => v.t - x.t <= 18).slice(-1)[0];
    const proposta = n >= 2 && r.chance(0.25);
    m.cena = { t: v.t, tipo: proposta ? 'proposta' : 'rua', onde: r.pick(lugares.length ? lugares : LUGARES_RUA[Math.min(4, n)]), nivel: n, ...(marco ? { lembrou: marco.texto } : {}) };
    return proposta ? 'fama30_proposta' : 'fama30_rua';
  }
  return undefined;
}

/** Um evento com UMA figura do meio que combina com ele (de preferência alguém que você ainda não conhece). */
export function cenaDeEvento30(v: Vida, r: Rng, n: number, eventoId?: string): Cena30 | undefined {
  const m = garantirRede30(v);
  const evs = EVENTOS30.filter(e => n >= e.nivel && (!eventoId || e.id === eventoId));
  const ev = evs.length ? evs[Math.floor(r.next() * evs.length)] : EVENTOS30[0];
  const vivas = m.figuras.filter(f => f.fora === undefined);
  const novas = vivas.filter(f => !f.pessoaId && ev.areas.includes(f.area));
  const lista = novas.length ? novas : vivas.filter(f => ev.areas.includes(f.area));
  if (!lista.length) return undefined;
  const f = lista[Math.floor(r.next() * lista.length)];
  return { t: v.t, tipo: 'evento', onde: ev.onde, nivel: n, figuraId: f.id, evento: ev.id };
}

/** O convite do celular aceito vira o evento EM PESSOA (com uma figura do meio). Devolve o conteúdo a abrir. */
export function eventoDoConvite30(v: Vida, assunto: string | undefined): string | undefined {
  const n = Math.max(2, nivelDoNome30(v));
  const mapa: Record<string, string> = { estreia: 'estreia', premio: 'premiacao', festa_fechada: 'festa', desfile: 'lancamento', baile: 'gala', iate: 'festa' };
  const c = cenaDeEvento30(v, rngDe(v.id, 'convite30', v.t, assunto ?? ''), n, assunto ? mapa[assunto] : undefined);
  if (!c) return undefined;
  v.fama30!.cena = c;
  return 'fama30_evento';
}

/* ------------------------------------------------------------------ O que se diz na cena (os textos leem a figura) */

/** Quem a figura é, numa frase ("Lara Monteiro, cantora de MPB que lançou um disco novo no ano passado"). */
export function quemE30(v: Vida, f: Figura30): string {
  const ult = f.fatos[f.fatos.length - 1];
  return `${nomeDaFigura30(f)}, ${f.oficio}${ult ? ` que ${ult.texto}${ult.ano < anoDe(v.t) ? ` em ${ult.ano}` : ''}` : ''}`;
}
/** Como a figura se aproxima (pelo jeito dela). */
export function jeitoDaFigura30(f: Figura30): string {
  const ela = fem(f) ? 'ela' : 'ele';
  return {
    simpatico: `Foi ${ela} quem veio falar primeiro, com um sorriso de quem já conhecia o seu trabalho.`,
    reservado: `${cap(ela)} estava num canto, longe da roda — e respondeu ao seu cumprimento com um aceno curto e curioso.`,
    vaidoso: `${cap(ela)} posava para fotos sem parar; quando viu você, fez questão de uma foto juntos "para as redes".`,
    generoso: `${cap(ela)} estava contando de um projeto social e chamou você para perto, como se fossem velhos conhecidos.`,
    polemico: `${cap(ela)} falava alto, comentando a polêmica da semana — e puxou você para a conversa sem pedir licença.`
  }[f.traco];
}
/** O que ela pensa de você (pelo laço com quem você já conhece e pelo seu nome). */
export function oQueSabeDeVoce30(v: Vida, f: Figura30): string {
  const amigoEmComum = f.lacos.filter(l => l.tipo === 'amizade' || l.tipo === 'parceria').map(l => figura30(v, l.com)).find(x => x?.pessoaId && v.vinculos[x.pessoaId]);
  if (amigoEmComum) return `"${amigoEmComum.nome} fala muito de você", ${fem(f) ? 'disse ela' : 'disse ele'}.`;
  const marco = marcosDaFama13(v).slice(-1)[0];
  return marco ? `Sabia de você: "${marco.texto.replace(/\.$/, '')} — vi isso".` : `Sabia o seu nome — e pouco mais.`;
}

/* ------------------------------------------------------------------ Conhecer: a figura vira Pessoa da sua vida */

/** O molde (o que o celular usa) de uma figura do meio: a pessoa famosa do convite TEM identidade e vida própria. */
export function moldeDaRede30(v: Vida, r: Rng): (Molde15 & { figuraId: string }) | undefined {
  const m = v.fama30;
  if (!m) return undefined;
  const lista = m.figuras.filter(f => f.fora === undefined && !f.pessoaId);
  if (!lista.length) return undefined;
  const f = lista[Math.floor(r.next() * lista.length)];
  return { nome: f.nome, sobrenome: f.sobrenome, genero: f.genero, idade: idadeDaFigura30(v, f), area: AREA15[f.area], nivel: f.nivel, figuraId: f.id };
}

/** Liga uma Pessoa nascida de um molde à figura do meio (pelo nome): a vida dela continua a mesma. */
export function ligarFigura30(v: Vida, nome: string, sobrenome: string, pessoaId: string): void {
  const f = v.fama30?.figuras.find(x => x.nome === nome && x.sobrenome === sobrenome && !x.pessoaId);
  if (!f) return;
  f.pessoaId = pessoaId;
  const p = v.pessoas[pessoaId];
  if (p) p.ocupacao = f.oficio;
}

/** A figura vira Pessoa na sua vida (o vínculo de sempre, com a memória do encontro). */
export function conhecerFigura30(v: Vida, r: Rng, f: Figura30, onde: string, proximidade: number): { p: Pessoa; vin: Vinculo } {
  const ja = f.pessoaId ? v.pessoas[f.pessoaId] : undefined;
  if (ja && v.vinculos[ja.id]) { const vin = v.vinculos[ja.id]; vin.proximidade = clamp(vin.proximidade + Math.round(proximidade / 3)); vin.tUltimoContato = v.t; return { p: ja, vin }; }
  const p = criarPessoa(v, r, { idade: idadeDaFigura30(v, f), genero: f.genero, municipioId: f.municipioId, nome: f.nome, sobrenome: f.sobrenome, ocupacao: f.oficio, renda: 30000 * f.nivel });
  p.celebridade15 = { area: AREA15[f.area], nivel: f.nivel, desde: v.t };
  const vin = vincular(v, p, { origem: 'apresentado', proximidade, estagio: 'conhecido' });
  vin.contexto = novoContexto('evento', {});
  registrarFase(v, vin, 'conhecido');
  lembrarCom(v, p.id, `Conheceram-se em ${onde}.`, 'inicio', 2);
  f.pessoaId = p.id;
  return { p, vin };
}

/** A faísca possível (quem é livre, compatível e tem interesse): só começa o interesse, o resto é do romance de sempre. */
export function faisca30(v: Vida, p: Pessoa, vin: Vinculo): boolean {
  if (parceiro(v) || !v.eu.atracao || !atraiGenero(v.eu.atracao, p.genero) || !atraiGenero(p.atracao, v.eu.genero) || !podeTerRomance(v, p, vin)) return false;
  const interesse = interesseInicial(v, p) + nivelDoNome30(v) * 3 + rngDe(v.id, 'faisca30', p.id).normal() * 8;
  if (interesse < 52) return false;
  vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: Math.round(clamp(interesse)) };
  return true;
}

/** Registra a cena vivida (a tela mostra; a próxima não repete o lugar) e soma ao nome quando é aparição. */
export function viverCena30(v: Vida, resposta: string, publica: boolean): void {
  const m = v.fama30;
  const c = m?.cena;
  if (!m || !c) return;
  m.vividas.push({ t: c.t, tipo: c.tipo, onde: c.onde, resposta });
  if (m.vividas.length > 16) m.vividas.splice(0, m.vividas.length - 16);
  // A aparição ajuda o nome pequeno a crescer; o nome enorme não cresce por uma foto na rua.
  if (publica && nivelDoNome30(v) <= 2) somarAoNome(v, origemDoNome(v) ?? 'arte', 1);
  delete m.cena;
}

/** As notícias do meio do último ano (para o jornal e o painel): os fatos com ano, de quem está em cena. */
export function noticiasDoMeio30(v: Vida, anos = 1): { figura: Figura30; ano: number; texto: string; tom?: 'bom' | 'ruim' }[] {
  const ano = anoDe(v.t);
  return (v.fama30?.figuras ?? []).flatMap(f => f.fatos.filter(x => ano - x.ano <= anos).map(x => ({ figura: f, ...x }))).sort((a2, b) => b.ano - a2.ano);
}

/** Quem do meio você conhece (com o vínculo) — para a tela. */
export function conhecidosDoMeio30(v: Vida): { f: Figura30; p: Pessoa; vin: Vinculo }[] {
  return (v.fama30?.figuras ?? []).filter(f => f.pessoaId && v.pessoas[f.pessoaId]?.vivo && v.vinculos[f.pessoaId]).map(f => ({ f, p: v.pessoas[f.pessoaId!], vin: v.vinculos[f.pessoaId!] }));
}

/** A idade da figura se ela já é uma Pessoa (a Pessoa manda). */
export function idadeAtual30(v: Vida, f: Figura30): number { const p = f.pessoaId ? v.pessoas[f.pessoaId] : undefined; return p ? idadePessoa(v, p) : idadeDaFigura30(v, f); }
export const cidadeDaFigura30 = (f: Figura30) => municipio(f.municipioId).nome;
export const aDaFigura30 = a;
