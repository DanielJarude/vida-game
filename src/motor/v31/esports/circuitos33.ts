/**
 * VIDA 33 · OS CIRCUITOS DE VERDADE DE CADA JOGO — as regiões, as ligas de cada degrau com o nome que tinham em cada época,
 * as ligas fechadas (franquia/parceria, sem queda nem acesso), os torneios de acesso que existiram nelas e os torneios
 * internacionais com as vagas de cada região. Uma organização disputa a liga da sua região e, se terminar nas vagas, vai
 * ao internacional — como no cenário real. Dados puros (só tipos).
 *
 * FATO × ABSTRAÇÃO (pesquisa de nov/2026, notas no relatório da VIDA 33): os nomes das ligas e torneios e os anos em que
 * existiram são fatos; as vagas de cada região são as aproximadas das edições recentes (variam de um ano para o outro e
 * foram fixadas por época); a força de cada região é estimativa de jogo. Exemplos do que se respeitou:
 *  - League of Legends: CBLOL (2012–; LTA Sul em 2025, volta como CBLOL em 2026, com 2 vagas no Mundial), LCS/NA LCS (LTA
 *    Norte em 2025), LEC/EU LCS, LCK, LPL, LLA (2019–2024), LMS → PCS → LCP; MSI (2015–), Mundial (2011–), First Stand (2025–).
 *    Ligas fechadas: LPL 2017, LCS 2018, LEC 2019, CBLOL e LCK 2021.
 *  - VALORANT: até 2022, os Challengers de cada região (circuito aberto); de 2023 em diante, as ligas internacionais com
 *    parceiros (Americas — Brasil, América do Norte e América Latina disputam a mesma —, EMEA, Pacific; China em 2024) e os
 *    Challengers por baixo, com a Ascension promovendo de 2023 a 2025; em 2026 a Ascension acabou e o campeão do Challengers
 *    disputa a vaga no Champions contra os parceiros. Masters (duas etapas) e Champions desde 2021.
 *  - Counter-Strike: a elite é internacional (ESL Pro League e os torneios por convite); por baixo, a segunda divisão de cada
 *    região. Majors desde 2013 (sem Major em 2020), dois por ano na maior parte dos anos.
 *  - Rainbow Six: Pro League por região (2016–2020); depois as ligas regionais — Brasileirão (2021–2023), South America
 *    League (2024–), North America League, Europe League/Europe MENA League, Asia Pacific League, China League (2026).
 *    Six Invitational (2017–), Majors (2019–), Esports World Cup (2024–).
 *  - Fortnite: FNCS por região (2019–; divisões desde 2023), Copa do Mundo (2019), FNCS Invitational (2022), Global
 *    Championship (2023–).
 *  - Rocket League: RLCS por região (2016–; América do Sul a partir de 2019; Oriente Médio, Ásia-Pacífico e África
 *    Subsaariana a partir de 2021), Majors (2021–; a América do Sul com 2 vagas) e o Mundial (2016–).
 */
import type { JogoId } from '../../v25/esports/jogos25';

export interface RegiaoEsports33 {
  id: string; nome: string;
  /** O país de onde vêm os nomes dos jogadores (o mais comum na região). */
  pais: string;
  desde: number; ate?: number;
  /** Quem herda as equipes quando a região deixa de existir. */
  sucessora?: string;
  /** O tamanho do mercado (salários, receitas, patrocínios): Brasil = 1. */
  mult: number;
  /** A força da liga principal da região perto da média do degrau (pontos) e a da segunda divisão. */
  forca: number; forca3?: number;
}
export interface Internacional33 {
  id: string; nome: string;
  /** Quantas edições por ano (os Majors do CS, as duas etapas do Masters). */
  vezes: number;
  equipes: number;
  /** A fatia do prêmio do degrau mundial (o maior evento do ano = 1). */
  peso: number;
  /** Vagas pela colocação na liga principal (posição ≤ vagas). */
  vagas: Partial<Record<string, number>>;
  /** O campeão da segunda divisão disputa uma vaga (classificatória contra quem está acima). */
  div3?: Partial<Record<string, number>>;
}

interface Circuito33 {
  regioes: RegiaoEsports33[];
  liga: (r: string, div: 2 | 3 | 4, ano: number) => string;
  franquia?: (r: string, ano: number) => boolean;
  /** Numa liga fechada, o torneio que ainda promove o campeão da segunda divisão (quando existiu). */
  acesso?: (r: string, ano: number) => string | undefined;
  /** Quantas equipes disputam a liga principal. */
  equipes?: (r: string, ano: number) => number;
  internacionais: (ano: number) => Internacional33[];
}

const R = (id: string, nome: string, pais: string, desde: number, mult: number, forca: number, forca3?: number, ate?: number, sucessora?: string): RegiaoEsports33 =>
  ({ id, nome, pais, desde, mult, forca, ...(forca3 !== undefined ? { forca3 } : {}), ...(ate ? { ate } : {}), ...(sucessora ? { sucessora } : {}) });
const todas = (ids: string[], n: number) => Object.fromEntries(ids.map(i => [i, n]));

/* ------------------------------------------------------------------ League of Legends */
const LOL: Circuito33 = {
  regioes: [
    R('br', 'Brasil', 'BR', 2012, 1, -3, -2), R('na', 'América do Norte', 'US', 2013, 2.2, -1, 0), R('eu', 'Europa', 'DE', 2013, 1.8, 1, 1),
    R('kr', 'Coreia do Sul', 'KR', 2012, 1.6, 4, 3), R('cn', 'China', 'CN', 2013, 1.8, 3, 2), R('latam', 'América Latina', 'MX', 2019, 0.8, -5, -4, 2024, 'br'),
    R('ap', 'Ásia-Pacífico', 'JP', 2015, 1, -2, -2)
  ],
  liga: (r, div, a) => {
    if (div === 2) return r === 'kr' ? 'torneios amadores e ranqueada de elite' : 'torneios abertos e ligas semiprofissionais';
    if (div === 3) {
      switch (r) {
        case 'br': return a >= 2017 && a <= 2024 ? 'Circuito Desafiante' : 'segunda divisão brasileira';
        case 'na': return a >= 2022 && a <= 2024 ? 'NACL (North American Challengers League)' : 'liga de acesso norte-americana';
        case 'eu': return a >= 2023 ? 'ligas nacionais e EMEA Masters' : a >= 2018 ? 'ligas nacionais e European Masters' : 'Challenger Series europeia';
        case 'kr': return a >= 2021 ? 'LCK Challengers League' : 'Challengers Korea';
        case 'cn': return a >= 2018 ? 'LDL' : 'LSPL';
        case 'latam': return 'ligas nacionais latino-americanas';
        default: return 'liga de acesso da Ásia-Pacífico';
      }
    }
    switch (r) {
      case 'br': return a === 2025 ? 'LTA Sul' : 'CBLOL';
      case 'na': return a === 2025 ? 'LTA Norte' : a >= 2018 ? 'LCS' : 'NA LCS';
      case 'eu': return a >= 2019 ? 'LEC' : 'EU LCS';
      case 'kr': return a >= 2015 ? 'LCK' : 'OGN Champions';
      case 'cn': return 'LPL';
      case 'latam': return 'LLA';
      default: return a >= 2025 ? 'LCP' : a >= 2020 ? 'PCS' : 'LMS';
    }
  },
  franquia: (r, a) => (r === 'cn' && a >= 2017) || (r === 'na' && a >= 2018) || (r === 'eu' && a >= 2019) || ((r === 'br' || r === 'kr') && a >= 2021),
  equipes: (r) => (r === 'kr' || r === 'eu' ? 10 : r === 'cn' ? 16 : 8),
  internacionais: a => [
    ...(a >= 2025 ? [{ id: 'firststand', nome: 'First Stand', vezes: 1, equipes: 8, peso: 0.25, vagas: todas(['br', 'na', 'eu', 'kr', 'cn', 'ap'], 1) }] : []),
    ...(a >= 2015 && a !== 2020 ? [{ id: 'msi', nome: 'Mid-Season Invitational', vezes: 1, equipes: a >= 2023 ? 11 : 10, peso: 0.45, vagas: a >= 2023 ? { kr: 2, cn: 2, eu: 2, na: 2, br: 1, latam: 1, ap: 1 } : todas(['br', 'na', 'eu', 'kr', 'cn', 'latam', 'ap'], 1) }] : []),
    ...(a >= 2011 ? [{ id: 'worlds', nome: 'Mundial de League of Legends', vezes: 1, equipes: a >= 2026 ? 19 : a >= 2017 ? 22 : 16, peso: 1, vagas: { kr: 4, cn: 4, eu: a >= 2025 ? 3 : 4, na: 3, br: a >= 2026 ? 2 : 1, latam: 1, ap: 2 } }] : [])
  ]
};

/* ------------------------------------------------------------------ VALORANT */
const AMERICAS = new Set(['br', 'na', 'latam']);
const VAL: Circuito33 = {
  regioes: [
    R('br', 'Brasil', 'BR', 2021, 1, 0, 0), R('na', 'América do Norte', 'US', 2021, 2.2, 0, 1), R('latam', 'América Latina', 'MX', 2021, 0.8, 0, -2),
    R('eu', 'Europa, Oriente Médio e África', 'DE', 2021, 1.6, 0.5, 1), R('ap', 'Pacífico', 'KR', 2021, 1.3, -0.5, -1), R('cn', 'China', 'CN', 2024, 1.6, -0.5, -1)
  ],
  liga: (r, div, a) => {
    if (div === 2) return a >= 2023 ? 'Premier e campeonatos abertos' : 'campeonatos abertos';
    if (a < 2023) {
      const nome: Record<string, string> = { br: 'Brasil', na: 'América do Norte', latam: 'América Latina', eu: 'EMEA', ap: 'Ásia-Pacífico', cn: 'China' };
      return div === 4 ? `VCT ${nome[r] ?? ''} · Challengers` : 'qualificatórias abertas do VCT';
    }
    if (div === 4) return AMERICAS.has(r) ? 'VCT Americas' : r === 'eu' ? 'VCT EMEA' : r === 'cn' ? 'VCT China' : 'VCT Pacific';
    return ({ br: 'Challengers Brazil', na: 'Challengers North America', latam: 'Challengers LATAM (Norte e Sul)', eu: 'Challengers EMEA (ligas regionais)', ap: 'Challengers Pacific (ligas nacionais)', cn: 'Challengers China' } as Record<string, string>)[r];
  },
  franquia: (r, a) => a >= (r === 'cn' ? 2024 : 2023),
  acesso: (r, a) => (a >= 2023 && a <= 2025 ? `Ascension ${AMERICAS.has(r) ? 'Americas' : r === 'eu' ? 'EMEA' : r === 'cn' ? 'China' : 'Pacific'}` : undefined),
  equipes: (r, a) => (a >= 2023 ? (AMERICAS.has(r) ? 12 : 12) : 10),
  internacionais: a => a < 2021 ? [] : [
    { id: 'masters', nome: 'VALORANT Masters', vezes: 2, equipes: 12, peso: 0.45, vagas: a >= 2023 ? { br: 3, na: 3, latam: 3, eu: 3, ap: 3, cn: a >= 2024 ? 3 : 0 } : { br: 2, na: 2, latam: 1, eu: 3, ap: 2 } },
    { id: 'champions', nome: 'VALORANT Champions', vezes: 1, equipes: 16, peso: 1, vagas: a >= 2023 ? { br: 4, na: 4, latam: 4, eu: 4, ap: 4, cn: a >= 2024 ? 4 : 0 } : { br: 2, na: 3, latam: 1, eu: 4, ap: 3 },
      ...(a >= 2026 ? { div3: todas(['br', 'na', 'latam', 'eu', 'ap', 'cn'], 1) } : {}) }
  ]
};

/* ------------------------------------------------------------------ Counter-Strike */
const CS: Circuito33 = {
  regioes: [R('sa', 'América do Sul', 'BR', 2000, 1, 0, 0), R('na', 'América do Norte', 'US', 2000, 2, 0, -1), R('eu', 'Europa', 'DE', 2000, 1.6, 0, 2), R('as', 'Ásia e Oceania', 'AU', 2000, 1.1, 0, -2)],
  liga: (r, div, a) => {
    if (div === 4) return a >= 2016 ? 'ESL Pro League' : 'circuito internacional de ligas';
    if (div === 3) {
      if (a >= 2023) return ({ sa: 'CCT América do Sul', na: 'CCT América do Norte', eu: 'CCT Europa', as: 'segunda divisão da Ásia e Oceania' } as Record<string, string>)[r];
      return ({ sa: 'segunda divisão sul-americana', na: 'segunda divisão norte-americana', eu: 'segunda divisão europeia', as: 'segunda divisão da Ásia e Oceania' } as Record<string, string>)[r];
    }
    return 'qualificatórias abertas e campeonatos de LAN';
  },
  equipes: () => 24,
  internacionais: a => [
    ...(a >= 2007 ? [{ id: 'iem', nome: 'Intel Extreme Masters', vezes: 1, equipes: 16, peso: 0.3, vagas: todas(['sa', 'na', 'eu', 'as'], 8) }] : []),
    ...(a >= 2013 && a !== 2020 ? [{ id: 'major', nome: 'Major de Counter-Strike', vezes: a === 2013 || a === 2021 || a === 2023 ? 1 : 2, equipes: a >= 2022 ? 24 : 16, peso: 0.8, vagas: todas(['sa', 'na', 'eu', 'as'], a >= 2022 ? 16 : 12), div3: { sa: 1, na: 1, eu: 2, as: 1 } }] : [])
  ]
};

/* ------------------------------------------------------------------ Rainbow Six Siege */
const R6: Circuito33 = {
  regioes: [
    R('br', 'Brasil e América do Sul', 'BR', 2016, 1, 1, 0), R('na', 'América do Norte', 'US', 2016, 2, 0, 0), R('eu', 'Europa', 'DE', 2016, 1.6, 1, 1),
    R('ap', 'Ásia-Pacífico', 'JP', 2016, 1.2, -2, -2), R('latam', 'América Latina', 'MX', 2021, 0.8, -3, -3, 2023, 'br'), R('cn', 'China', 'CN', 2026, 1.6, -2, -2)
  ],
  liga: (r, div, a) => {
    if (div === 2) return 'campeonatos abertos e qualificatórias';
    if (div === 3) return r === 'br' ? 'liga de acesso sul-americana' : 'segunda divisão regional';
    switch (r) {
      case 'br': return a >= 2024 ? 'South America League' : a >= 2021 ? 'Brasileirão de Rainbow Six' : 'Pro League · América Latina';
      case 'na': return a >= 2021 ? 'North America League' : 'Pro League · América do Norte';
      case 'eu': return a >= 2025 ? 'Europe MENA League' : a >= 2021 ? 'Europe League' : 'Pro League · Europa';
      case 'latam': return 'LATAM League';
      case 'cn': return 'China League';
      default: return a >= 2021 ? 'Asia Pacific League' : 'Pro League · Ásia-Pacífico';
    }
  },
  equipes: (r) => (r === 'ap' ? 8 : 10),
  internacionais: a => [
    ...(a >= 2019 && a !== 2020 ? [{ id: 'major', nome: 'Major de Rainbow Six', vezes: 2, equipes: 16, peso: 0.4, vagas: a >= 2024 ? todas(['br', 'na', 'eu', 'ap', 'cn'], 4) : { br: 3, na: 3, eu: 4, ap: 2, latam: 1 } }] : []),
    ...(a >= 2024 ? [{ id: 'ewc', nome: 'Esports World Cup', vezes: 1, equipes: 20, peso: 0.4, vagas: todas(['br', 'na', 'eu', 'ap', 'cn'], 4) }] : []),
    ...(a >= 2017 ? [{ id: 'si', nome: 'Six Invitational', vezes: 1, equipes: 20, peso: 1, vagas: { br: 4, na: 3, eu: 4, ap: 2, latam: 1, cn: 1 } }] : [])
  ]
};

/* ------------------------------------------------------------------ Fortnite */
const FN: Circuito33 = {
  regioes: [
    R('na', 'América do Norte (Central)', 'US', 2018, 2, 1, 1), R('naw', 'América do Norte (Oeste)', 'US', 2018, 2, -1, -1), R('eu', 'Europa', 'DE', 2018, 1.6, 2, 2),
    R('br', 'Brasil', 'BR', 2018, 1, 0, 0), R('as', 'Ásia', 'JP', 2018, 1.2, -2, -2), R('oce', 'Oceania', 'AU', 2018, 1.3, -2, -2), R('me', 'Oriente Médio', 'AE', 2020, 1.5, -2, -2)
  ],
  liga: (_r, div, a) => (div === 4 ? (a >= 2023 ? 'FNCS · Divisão 1' : a >= 2019 ? 'FNCS' : 'grandes torneios abertos')
    : div === 3 ? (a >= 2023 ? 'FNCS · Divisões 2 e 3' : 'qualificatórias do FNCS') : (a >= 2023 ? 'FNCS · Divisões 4 e 5 e copas abertas' : 'Arena e copas abertas')),
  equipes: () => 50,
  internacionais: a => [
    ...(a === 2019 ? [{ id: 'copa', nome: 'Copa do Mundo de Fortnite', vezes: 1, equipes: 50, peso: 1.5, vagas: { eu: 20, na: 12, naw: 4, br: 6, as: 3, oce: 3 } }] : []),
    ...(a === 2022 ? [{ id: 'inv', nome: 'FNCS Invitational', vezes: 1, equipes: 50, peso: 0.5, vagas: { eu: 16, na: 11, naw: 4, br: 7, as: 4, oce: 3, me: 3 } }] : []),
    ...(a >= 2023 ? [{ id: 'global', nome: 'FNCS Global Championship', vezes: 1, equipes: 50, peso: 1, vagas: { eu: 16, na: 11, naw: 4, br: 7, as: 4, oce: 3, me: 3 } }] : [])
  ]
};

/* ------------------------------------------------------------------ Rocket League */
const RL: Circuito33 = {
  regioes: [
    R('na', 'América do Norte', 'US', 2016, 2, 2, 2), R('eu', 'Europa', 'DE', 2016, 1.6, 2, 2), R('oce', 'Oceania', 'AU', 2016, 1.2, -2, -2), R('sa', 'América do Sul', 'BR', 2019, 1, -1, -1),
    R('mena', 'Oriente Médio e Norte da África', 'SA', 2021, 1.5, 0, 0), R('apac', 'Ásia-Pacífico', 'JP', 2021, 1.1, -3, -3), R('ssa', 'África Subsaariana', 'ZA', 2021, 0.6, -4, -4)
  ],
  liga: (r, div, a) => (div === 4 ? 'RLCS · regional' : div === 3 ? (a <= 2020 && (r === 'na' || r === 'eu') ? 'Rival Series' : 'fase final dos Opens') : 'Opens e copas abertas'),
  equipes: () => 16,
  internacionais: a => [
    ...(a >= 2021 ? [{ id: 'major', nome: 'Major do RLCS', vezes: a >= 2024 ? 2 : 3, equipes: 16, peso: 0.4, vagas: { eu: 4, na: 4, sa: 2, mena: 2, oce: 1, apac: 1, ssa: 1 } }] : []),
    ...(a >= 2016 ? [{ id: 'worlds', nome: 'Mundial do RLCS', vezes: 1, equipes: a >= 2026 ? 20 : a >= 2022 ? 24 : 10, peso: 1, vagas: a >= 2021 ? { eu: 5, na: 5, sa: 3, mena: 3, oce: 2, apac: 1, ssa: 1 } : { eu: 4, na: 4, oce: 2, sa: a >= 2019 ? 1 : 0 } }] : [])
  ]
};

const CIRCUITOS: Record<JogoId, Circuito33> = { lol: LOL, valorant: VAL, cs: CS, r6: R6, fortnite: FN, rocket: RL };

/* ------------------------------------------------------------------ a leitura */

export const regioesDoJogo33 = (j: JogoId, ano: number) => CIRCUITOS[j].regioes.filter(r => r.desde <= ano && (r.ate === undefined || r.ate >= ano));
export const regiaoDoJogo33 = (j: JogoId, id: string) => CIRCUITOS[j].regioes.find(r => r.id === id);
/** A região onde está agora quem estava numa região que acabou (a LLA virou parte do CBLOL/LTA Sul...). */
export function regiaoVigente33(j: JogoId, id: string, ano: number): string {
  let r = regiaoDoJogo33(j, id);
  for (let k = 0; r && k < 4 && r.ate !== undefined && r.ate < ano && r.sucessora; k++) r = regiaoDoJogo33(j, r.sucessora);
  return r && r.desde <= ano && (r.ate === undefined || r.ate >= ano) ? r.id : (regioesDoJogo33(j, ano)[0]?.id ?? id);
}
/** A região padrão para quem é do Brasil (o Brasil, ou a América do Sul no CS e no Rocket). */
export const regiaoBrasil33 = (j: JogoId) => (j === 'cs' || j === 'rocket' ? 'sa' : 'br');
export const nomeDaRegiao33 = (j: JogoId, id: string) => regiaoDoJogo33(j, id)?.nome ?? id;
export const multDaRegiao33 = (j: JogoId, id: string) => regiaoDoJogo33(j, id)?.mult ?? 1;
export const ligaDoCircuito33 = (j: JogoId, r: string, div: 2 | 3 | 4, ano: number) => CIRCUITOS[j].liga(r, div, ano);
export const ligaFechada33 = (j: JogoId, r: string, ano: number) => !!CIRCUITOS[j].franquia?.(r, ano);
export const torneioDeAcesso33 = (j: JogoId, r: string, ano: number) => CIRCUITOS[j].acesso?.(r, ano);
export const internacionais33 = (j: JogoId, ano: number) => CIRCUITOS[j].internacionais(ano);
export const equipesDaLigaPrincipal33 = (j: JogoId, r: string, ano: number) => CIRCUITOS[j].equipes?.(r, ano) ?? 10;
/** O ajuste de força do campo da região no degrau (a liga principal e a segunda divisão; o cenário aberto pela metade). */
export function ajusteDaRegiao33(j: JogoId, r: string, div: number): number {
  const g = regiaoDoJogo33(j, r);
  if (!g) return 0;
  return div >= 4 ? g.forca : div === 3 ? (g.forca3 ?? g.forca) : (g.forca3 ?? g.forca) / 2;
}
/** As regras da divisão: quantos sobem e caem, e o torneio de acesso de uma liga fechada. */
export function regrasDaDivisao33(j: JogoId, r: string, div: 2 | 3 | 4, ano: number): { sobem: number; caem: number; acesso?: string } {
  const fechada = ligaFechada33(j, r, ano);
  if (div === 2) return { sobem: 2, caem: 0 };
  if (div === 3) return fechada ? { sobem: 0, caem: 2, acesso: torneioDeAcesso33(j, r, ano) } : { sobem: 1, caem: 2 };
  return { sobem: 0, caem: fechada ? 0 : 2 };
}
/** As vagas internacionais da região que a liga principal dá no ano (para a tela). */
export function vagasDaRegiao33(j: JogoId, r: string, ano: number): { nome: string; vagas: number; vezes: number; div3?: number }[] {
  return internacionais33(j, ano).map(e => ({ nome: e.nome, vagas: e.vagas[r] ?? 0, vezes: e.vezes, ...(e.div3?.[r] ? { div3: e.div3[r] } : {}) })).filter(e => e.vagas > 0 || !!e.div3);
}

/* ------------------------------------------------------------------ as organizações reais fora do Brasil: a região de cada uma */

const REGIAO_REAL: Record<JogoId, { padrao: string; m: Record<string, string> }> = {
  cs: { padrao: 'eu', m: { 'Team Liquid': 'na', Cloud9: 'na', 'Complexity Gaming': 'na', 'Evil Geniuses': 'na', Wildcard: 'na', NRG: 'na', 'Rare Atom': 'as', TYLOO: 'as', 'Lynn Vision': 'as', 'The MongolZ': 'as', FlyQuest: 'as', Grayhound: 'as', Renegades: 'as' } },
  valorant: { padrao: 'eu', m: { Sentinels: 'na', 'Paper Rex': 'ap', DRX: 'ap', 'EDward Gaming': 'cn', 'G2 Esports': 'na', '100 Thieves': 'na', NRG: 'na', 'Gen.G': 'ap', 'Leviatán': 'latam', 'KRÜ Esports': 'latam', 'Evil Geniuses': 'na', 'OpTic Gaming': 'na', Cloud9: 'na', T1: 'ap', 'ZETA DIVISION': 'ap', 'Bilibili Gaming': 'cn', 'Trace Esports': 'cn', 'Rex Regum Qeon': 'ap', 'Team Secret': 'ap', 'DetonatioN FocusMe': 'ap', M80: 'na', 'Shopify Rebellion': 'na', TSM: 'na', Version1: 'na', Guard: 'na', 'Oxygen Esports': 'na', 'Bleed Esports': 'ap', 'Talon Esports': 'ap', 'Global Esports': 'ap' } },
  lol: { padrao: 'eu', m: { T1: 'kr', 'Gen.G': 'kr', 'JD Gaming': 'cn', 'Bilibili Gaming': 'cn', 'Top Esports': 'cn', Cloud9: 'na', 'Team Liquid': 'na', DRX: 'kr', 'Hanwha Life Esports': 'kr', 'KT Rolster': 'kr', 'Weibo Gaming': 'cn', 'Samsung Galaxy': 'kr', 'Royal Never Give Up': 'cn', 'Invictus Gaming': 'cn', 'Counter Logic Gaming': 'na', 'Team SoloMid': 'na', 'Taipei Assassins': 'ap', FlyQuest: 'na', 'Dplus KIA': 'kr', 'Kwangdong Freecs': 'kr', 'Nongshim RedForce': 'kr', 'EDward Gaming': 'cn', 'LNG Esports': 'cn', 'Team WE': 'cn', 'Team Dignitas': 'na', '100 Thieves': 'na', 'PSG Talon': 'ap', 'GAM Esports': 'ap', 'Evil Geniuses': 'na', 'Movistar R7': 'latam', 'Shopify Rebellion': 'na', 'Ultra Prime': 'cn', 'BNK FearX': 'kr', 'DetonatioN FocusMe': 'ap', 'Pentanet.GG': 'ap', 'CTBC Flying Oyster': 'ap', Isurus: 'latam', 'Estral Esports': 'latam', 'Leviatán': 'latam', 'Team Aze': 'latam' } },
  r6: { padrao: 'eu', m: { 'w7m esports': 'br', 'FaZe Clan': 'br', 'Team Liquid': 'br', 'Ninjas in Pyjamas': 'br', 'Spacestation Gaming': 'na', 'DarkZero Esports': 'na', 'Oxygen Esports': 'na', 'Evil Geniuses': 'na', 'SANDBOX Gaming': 'ap', 'CAG Osaka': 'ap', Elevate: 'br', M80: 'na', 'Shopify Rebellion': 'na', Fnatic: 'ap', Soniqs: 'na', 'Cyclops athlete gaming': 'ap', 'Chiefs Esports Club': 'ap', 'Dire Wolves': 'ap' } },
  rocket: { padrao: 'eu', m: { 'G2 Esports': 'na', NRG: 'na', 'Team Falcons': 'mena', 'Spacestation Gaming': 'na', 'Complexity Gaming': 'na', 'Gen.G Mobil1 Racing': 'na', 'FaZe Clan': 'na', Cloud9: 'na', 'Team Liquid': 'na', OG: 'na', 'Ninjas in Pyjamas': 'sa', Version1: 'na', 'Rule One': 'mena', Rebellion: 'na', 'Ghost Gaming': 'na', Rogue: 'na', 'Shopify Rebellion': 'na', Elevate: 'sa', 'Twisted Minds': 'mena', Wildcard: 'na', 'Team Secret': 'sa' } },
  fortnite: { padrao: 'eu', m: { 'FaZe Clan': 'na', 'Team Liquid': 'na', NRG: 'na', '100 Thieves': 'na', Sentinels: 'na', 'Gen.G': 'na', XSET: 'na', 'Team Falcons': 'me', 'Ghost Gaming': 'na', TSM: 'na', Dignitas: 'na', 'Oxygen Esports': 'na', 'Shopify Rebellion': 'na', 'Moist Esports': 'na', Rebellion: 'na', 'Twisted Minds': 'me', Elevate: 'as' } }
};
/** A região de uma organização real do catálogo internacional (a mais conhecida; o resto, a região mais comum do jogo). */
export const regiaoDaOrgReal33 = (j: JogoId, nome: string) => REGIAO_REAL[j].m[nome] ?? REGIAO_REAL[j].padrao;
