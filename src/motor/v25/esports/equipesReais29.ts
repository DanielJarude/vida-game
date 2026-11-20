/**
 * VIDA 29.2 · AS EQUIPES DE VERDADE DO CENÁRIO — as organizações reais de cada jogo, por degrau e região, com o ano em que
 * cada uma entrou no jogo (e saiu, quando saiu). O cenário de uma vida é montado daqui: a elite mundial com as
 * internacionais (Natus Vincere, T1, Sentinels...), a liga principal e a segunda divisão do Brasil com as brasileiras
 * (FURIA, LOUD, paiN, MIBR...) — ou, fora do Brasil, com as internacionais de cada divisão — e o cenário aberto com as
 * academias. Só aparecem as que existiam no ano (não há FURIA em 2010 nem LOUD antes de 2019).
 *
 * As datas são as da entrada da organização na modalidade (aproximadas ao ano). As equipes são as organizações, não os
 * elencos: os jogadores do elenco no jogo são fictícios. Folha (só tipos).
 */
import type { JogoId } from './jogos25';

/** "Nome|desde" ou "Nome|desde|até". */
type Lista = string[];
interface PorJogo { int: Partial<Record<3 | 4 | 5, Lista>>; br: Partial<Record<2 | 3 | 4, Lista>> }

export const EQUIPES_REAIS29: Record<JogoId, PorJogo> = {
  cs: {
    int: {
      5: ['Natus Vincere|2009', 'Fnatic|2004', 'Team Vitality|2018', 'FaZe Clan|2016', 'Astralis|2016', 'G2 Esports|2014', 'Team Liquid|2015', 'MOUZ|2002', 'Ninjas in Pyjamas|2000|2005', 'Ninjas in Pyjamas|2012', 'Heroic|2016', 'Team Spirit|2015', 'Virtus.pro|2003', 'SK Gaming|2000|2019', 'Cloud9|2014', 'Team 3D|2002|2008', 'mTw|2000|2010', 'Evil Geniuses|2000|2009', 'Gambit Esports|2013|2022', 'Complexity Gaming|2003'],
      4: ['BIG|2017', 'ENCE|2013', 'Eternal Fire|2015', 'OG|2020', 'Apeks|2022', 'Team Falcons|2023', 'Monte|2021', 'SAW|2019', 'Aurora Gaming|2023', '3DMAX|2023', 'GamerLegion|2021', 'Wildcard|2023', 'Endpoint|2015|2023', 'Copenhagen Flames|2017|2023', 'Movistar Riders|2016|2023', 'Sprout|2018|2023', 'x6tence|2003|2010', 'Team Dignitas|2006|2019', 'Lunatik eSports|2005|2009', 'Team NoA|2002|2009'],
      3: ['ECSTATIC|2021', 'Nexus Gaming|2018', 'GUN5 Esports|2022', 'Sashi Esport|2019', 'Rare Atom|2020', 'Preasy|2022', 'Passion UA|2022', 'Kubix Esports|2021', 'Nemiga Gaming|2018', 'BLINK|2023', 'Enterprise Esports|2020', 'Leisure Club|2006|2012', 'Team Alternate|2001|2015', 'Begrip|2002|2012']
    },
    br: {
      4: ['FURIA|2017', 'MIBR|2003|2012', 'MIBR|2018', 'paiN Gaming|2010', 'Imperial|2018', 'Fluxo|2021', 'Sharks Esports|2016', 'Team oNe|2015', 'Red Canids|2015', 'Legacy|2021', '00 Nation|2021|2023', 'Keyd Stars|2011|2018', 'Luminosity Gaming|2015|2016', 'g3x|2005|2011', 'Fire Gamers|2004|2010'],
      3: ['ODDIK|2020', 'Case Esports|2019', 'Bestia|2021', 'W7M|2014', 'Black Dragons|2015', 'INTZ|2014', 'Los Grandes|2020', 'KaBuM! e-Sports|2010', 'Vivo Keyd Stars|2018|2022', 'Flamengo Esports|2017|2021', 'Galorys|2021', 'Liberty|2020', 'Playzone|2005|2012', 'Quantic Gaming|2010|2013'],
      2: ['Corinthians e-Sports|2019', 'Santos e-Sports|2016', 'Gaimin Gladiators|2023', 'Rensga Esports|2020', 'Furious Gaming|2017', 'Vorax|2018', 'Ego|2019', 'Stellae Gaming|2020', 'Atlético-MG e-Sports|2021', 'Dreamers|2022', 'Isurus Gaming|2015', 'Brave e-Sports|2008|2014', 'Gamepro|2004|2012']
    }
  },
  valorant: {
    int: {
      5: ['Sentinels|2020', 'Fnatic|2020', 'Paper Rex|2020', 'DRX|2020', 'EDward Gaming|2020', 'Team Heretics|2020', 'G2 Esports|2020', '100 Thieves|2020', 'NRG|2020', 'Team Liquid|2020', 'Gen.G|2020', 'Leviatán|2020', 'KRÜ Esports|2020', 'Evil Geniuses|2020|2023', 'OpTic Gaming|2022|2022', 'Acend|2021|2022'],
      4: ['Cloud9|2020', 'FUT Esports|2022', 'Karmine Corp|2022', 'BBL Esports|2020', 'Team Vitality|2020', 'GIANTX|2023', 'Natus Vincere|2021', 'T1|2020', 'ZETA DIVISION|2021', 'Bilibili Gaming|2023', 'Trace Esports|2023', 'Rex Regum Qeon|2021', 'Team Secret|2020', 'DetonatioN FocusMe|2020'],
      3: ['M80|2022', 'Shopify Rebellion|2023', 'Apeks|2023', 'Gentle Mates|2023', 'Movistar KOI|2023', 'TSM|2020|2023', 'Version1|2020|2022', 'Guard|2021|2023', 'Oxygen Esports|2022', 'Bleed Esports|2022', 'Talon Esports|2022', 'Global Esports|2020']
    },
    br: {
      4: ['LOUD|2020', 'FURIA|2020', 'MIBR|2021', 'Keyd Stars|2020|2022', 'Ninjas in Pyjamas|2021|2023', 'paiN Gaming|2020'],
      3: ['Fluxo|2021', 'Los Grandes|2021', 'Vivo Keyd Stars|2020', 'TBK Esports|2021', 'Gamelanders|2021', 'Liberty|2021', '2Game Esports|2022', 'Elevate|2022', 'Stellae Gaming|2020', 'Team Solid|2022', 'RED Canids|2021', 'Black Dragons|2020'],
      2: ['Corinthians e-Sports|2021', 'Furious Gaming|2020', 'W7M|2021', 'Rise Gaming|2022', 'Ego|2021', 'ODDIK|2021', 'Bestia|2021', 'Case Esports|2021', 'Dreamers|2022', 'Rensga Esports|2021', 'Vorax|2021', 'Gaimin Gladiators|2023']
    }
  },
  lol: {
    int: {
      5: ['T1|2013', 'Gen.G|2014', 'G2 Esports|2015', 'Fnatic|2011', 'JD Gaming|2017', 'Bilibili Gaming|2017', 'Top Esports|2017', 'Cloud9|2013', 'Team Liquid|2015', 'DRX|2019', 'Hanwha Life Esports|2018', 'KT Rolster|2012', 'Weibo Gaming|2019', 'Samsung Galaxy|2013|2017', 'Royal Never Give Up|2012|2023', 'Invictus Gaming|2011', 'Moscow Five|2011|2013', 'Counter Logic Gaming|2010|2022', 'Team SoloMid|2010|2022', 'Taipei Assassins|2011|2016'],
      4: ['MAD Lions KOI|2019', 'FlyQuest|2017', 'Team BDS|2021', 'Karmine Corp|2021', 'Dplus KIA|2017', 'Kwangdong Freecs|2016', 'Nongshim RedForce|2020', 'EDward Gaming|2014', 'LNG Esports|2016', 'Team WE|2012', 'Vitality|2016', 'Rogue|2019|2023', 'Excel Esports|2019', 'SK Gaming|2011', 'Team Dignitas|2012', '100 Thieves|2017', 'PSG Talon|2020', 'GAM Esports|2017', 'Evil Geniuses|2011|2013'],
      3: ['Movistar R7|2017', 'Team Heretics|2022', 'Shopify Rebellion|2023', 'Ultra Prime|2016', 'BNK FearX|2016', 'DetonatioN FocusMe|2014', 'Pentanet.GG|2021', 'CTBC Flying Oyster|2018', 'Isurus|2015', 'Estral Esports|2021', 'Leviatán|2022', 'Team Aze|2019']
    },
    br: {
      4: ['LOUD|2019', 'paiN Gaming|2011', 'RED Canids|2015', 'FURIA|2019', 'Fluxo|2021', 'Vivo Keyd Stars|2012', 'Liberty|2020', 'KaBuM! Esports|2013', 'INTZ|2014', 'Los Grandes|2020', 'Netshoes Miners|2019|2020', 'Flamengo Esports|2017|2021', 'CNB e-Sports Club|2012|2019', 'Kaos Latin Gamers|2013|2015', 'Big Gods Jaguars|2015|2016', 'ProGaming Esports|2016|2018', 'Rensga Esports|2021|2022'],
      3: ['Ego|2016', 'Santos e-Sports|2016', 'Vorax|2018', 'Uppercut|2015', 'Remo Brave|2017', 'Corinthians e-Sports|2019', 'Rise Gaming|2022', 'Cruzeiro e-Sports|2019', 'Black Dragons|2015', 'Team oNe|2015', 'Operation Kino|2016', 'Falkol|2015'],
      2: ['paiN Academy|2018', 'LOUD Academy|2020', 'RED Academy|2018', 'FURIA Academy|2020', 'Fluxo Academy|2022', 'INTZ Academy|2017', 'KaBuM! Academy|2018', 'Liberty Academy|2021', 'Vivo Keyd Academy|2018', 'Los Grandes Academy|2021', 'Stellae Gaming|2020', 'Dreamers|2022']
    }
  },
  r6: {
    int: {
      5: ['w7m esports|2016', 'FaZe Clan|2018', 'Team BDS|2021', 'G2 Esports|2016', 'Team Liquid|2017', 'Ninjas in Pyjamas|2019', 'Wolves Esports|2021', 'Spacestation Gaming|2019', 'DarkZero Esports|2019', 'Oxygen Esports|2021', 'Rogue|2017|2023', 'Evil Geniuses|2016|2018', 'Team Empire|2016|2023', 'PENTA Sports|2016|2018', 'Natus Vincere|2018|2023'],
      4: ['Team Secret|2020', 'Heroic|2023', 'MNM Gaming|2020', 'Virtus.pro|2021', 'SANDBOX Gaming|2021', 'CAG Osaka|2018', 'Elevate|2022', 'M80|2023', 'Shopify Rebellion|2023', 'Fnatic|2017', 'Soniqs|2021|2023', 'Mirage|2018|2020'],
      3: ['Into the Breach|2021', 'Astralis|2022', 'Geekay Esports|2020', 'Rebels Gaming|2021', 'Totem Esports|2023', 'Cyclops athlete gaming|2018', 'Chiefs Esports Club|2017', 'Dire Wolves|2019']
    },
    br: {
      4: ['w7m esports|2016', 'FaZe Clan|2018', 'Team Liquid|2017', 'Ninjas in Pyjamas|2019', 'FURIA|2019', 'Black Dragons|2016', 'MIBR|2019', 'Fluxo|2021', 'Team oNe|2016', 'Los Grandes|2021', 'Elevate|2022', 'Vivo Keyd Stars|2018', 'Santos e-Sports|2017|2019', 'Immortals|2017|2019'],
      3: ['Ruby Esports|2021', 'INTZ|2017', 'Liberty|2020', 'Case Esports|2020', 'Furious Gaming|2018', 'ODDIK|2021', 'TeamOne Academy|2019', 'Bestia|2022', 'Mythic|2021', 'Nort Gaming|2020', 'RED Canids|2018', 'Team Solid|2022'],
      2: ['Corinthians e-Sports|2020', 'Vorax|2019', 'Ego|2020', 'Dreamers|2022', 'Rise Gaming|2022', 'Gaimin Gladiators|2023', 'Stellae Gaming|2020', 'W7M Academy|2020', 'Liberty Academy|2021', 'Atlético-MG e-Sports|2021']
    }
  },
  rocket: {
    int: {
      5: ['Team Vitality|2017', 'Team BDS|2021', 'G2 Esports|2018', 'NRG|2016', 'Karmine Corp|2021', 'Team Falcons|2023', 'Moist Esports|2022', 'Spacestation Gaming|2020', 'Complexity Gaming|2019', 'Gen.G Mobil1 Racing|2022', 'Dignitas|2017', 'FaZe Clan|2021', 'Renault Sport Team Vitality|2018|2020', 'Cloud9|2018|2020', 'Mock-It Esports|2016|2018', 'Flipsid3 Tactics|2016|2018'],
      4: ['Gentle Mates|2023', 'Team Liquid|2018', 'OG|2023', 'Oxygen Esports|2022', 'Ninjas in Pyjamas|2022', 'Version1|2021|2022', 'Endpoint|2019|2023', 'Rule One|2022', 'Pioneers|2021', 'Rebellion|2021', 'Ghost Gaming|2018|2020', 'Rogue|2018|2020'],
      3: ['Gaimin Gladiators|2023', 'Shopify Rebellion|2023', 'Elevate|2022', 'Twisted Minds|2023', 'Quadrant|2022', 'Guild Esports|2021', 'Team Queso|2021', 'Wildcard|2023']
    },
    br: {
      4: ['FURIA|2019', 'Team Secret|2021', 'MIBR|2021', 'Ninjas in Pyjamas|2022', 'Elevate|2022', 'Black Dragons|2019', 'Kabum! e-Sports|2018', 'Vivo Keyd Stars|2019'],
      3: ['Corinthians e-Sports|2020', 'Los Grandes|2021', 'Liberty|2021', 'Ego|2020', 'Santos e-Sports|2019', 'Team oNe|2019', 'W7M|2020', 'Stellae Gaming|2020'],
      2: ['Rise Gaming|2022', 'Dreamers|2022', 'Vorax|2019', 'Furious Gaming|2019', 'Case Esports|2020', 'Bestia|2022', 'Gaimin Gladiators|2023', 'ODDIK|2021']
    }
  },
  fortnite: {
    int: {
      5: ['FaZe Clan|2018', 'Team Liquid|2018', 'NRG|2018', '100 Thieves|2018', 'Sentinels|2019', 'Guild Esports|2020', 'Gen.G|2019', 'XSET|2020', 'Team Falcons|2023', 'Team Vitality|2018', 'Karmine Corp|2022', 'Gentle Mates|2023', 'Ghost Gaming|2018|2021', 'TSM|2018|2023'],
      4: ['Atlantis|2019', 'BIG|2020', 'Team Secret|2019', 'Dignitas|2018', 'Wave Esports|2020', 'Solary|2018', 'Team Heretics|2018', 'G2 Esports|2018|2020', 'Fnatic|2018|2020', 'Team Queso|2019', 'Built By Gamers|2019', 'Oxygen Esports|2021'],
      3: ['Gaimin Gladiators|2022', 'Shopify Rebellion|2022', 'Moist Esports|2022', 'Elevate|2022', 'Endpoint|2019|2022', 'Rebellion|2021', 'Twisted Minds|2023', 'Quadrant|2021']
    },
    br: {
      4: ['LOUD|2019', 'FURIA|2019', 'MIBR|2019', 'Fluxo|2021', '9z Team|2019', 'paiN Gaming|2018', 'Team Liquid|2019', 'Vivo Keyd Stars|2018', 'Los Grandes|2020', 'Black Dragons|2018'],
      3: ['Corinthians e-Sports|2019', 'Santos e-Sports|2019', 'Liberty|2020', 'Ego|2020', 'INTZ|2018', 'Team oNe|2019', 'Stellae Gaming|2020', 'Rise Gaming|2022', 'Bestia|2022'],
      2: ['Dreamers|2022', 'Vorax|2019', 'Furious Gaming|2019', 'Case Esports|2020', 'ODDIK|2021', 'Gaimin Gladiators|2023', 'W7M|2020', 'Atlético-MG e-Sports|2021']
    }
  }
};

interface EquipeReal { nome: string; desde: number; ate?: number }
const ler = (x: string): EquipeReal => { const [nome, d, a] = x.split('|'); return { nome, desde: Number(d), ...(a ? { ate: Number(a) } : {}) }; };
const ativa = (e: EquipeReal, ano: number) => e.desde <= ano && (e.ate === undefined || e.ate >= ano);

/** As equipes reais de um degrau no ano (sem repetir nome): a elite (5) é sempre internacional; 2–4, do país ou de fora. */
export function equipesReaisDoDegrau29(jogo: JogoId, nivel: number, ano: number, br: boolean): string[] {
  const t = EQUIPES_REAIS29[jogo];
  let lista: Lista | undefined;
  if (nivel >= 5) lista = t.int[5];
  else if (br) lista = t.br[Math.max(2, nivel) as 2 | 3 | 4];
  else lista = nivel >= 4 ? t.int[4] : t.int[3];
  const nomes = (lista ?? []).map(ler).filter(e => ativa(e, ano)).map(e => e.nome);
  // Fora do Brasil, o cenário aberto são as academias das equipes de cima (o caminho de quem começa).
  if (!br && nivel <= 2) return [...new Set((t.int[4] ?? []).map(ler).filter(e => ativa(e, ano)).map(e => `${e.nome} Academy`))];
  return [...new Set(nomes)];
}
