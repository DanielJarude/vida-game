/**
 * ERAS HISTÓRICAS · OS PARTIDOS NO TEMPO (Brasil) — quem existia em cada mês, e no que cada um se transformou.
 *
 * O jogo guarda o partido pela chave (`id`); a lista de 2026 (`dados/partidos.PARTIDOS_REAIS`) usa a sigla como chave.
 * Aqui entram os partidos que existiram de 1966 a 2025 e a linhagem de cada um: a mudança de nome e a fusão ou a
 * incorporação (`vira`). Quem está filiado quando o partido muda passa a constar no sucessor (a filiação é transferida,
 * como na fusão e na incorporação de verdade — Lei 9.096/1995, art. 29) e a Linha da Vida conta.
 *
 * NEUTRALIDADE: como na lista de 2026, só nome e sigla — nenhuma ideologia, programa ou bônus.
 *
 * DATAS: `de` = o mês a partir do qual era possível se filiar (fundação com registro provisório, nos anos 1980; registro
 * no TSE, depois da Lei 9.096/1995); `ate` = o mês da mudança (deferimento da fusão/incorporação/mudança de nome pelo TSE).
 * Fontes: TSE (partidos registrados, históricos de fusões, incorporações e mudanças de nome); Lei 6.767/1979 (fim do
 * bipartidarismo); EC 25/1985 (legalização dos partidos comunistas); CPDOC/FGV (verbetes dos partidos). `certeza`:
 * 'documentado' quando o mês está nos registros do TSE/CPDOC; 'aproximado' quando só o ano é seguro (o mês é estimativa).
 * LISTA NÃO EXAUSTIVA: entram os partidos com registro duradouro ou representação no Congresso; legendas de vida curta e
 * sem representação ficaram de fora (ver docs/eras/FONTES.md).
 */

export interface PartidoNoTempo {
  /** A chave guardada na vida (a sigla de 2026 quando o partido ainda existe com ela). */
  id: string;
  sigla: string;
  nome: string;
  chamado: string;
  artigo: 'o' | 'a';
  /** [ano, mês 1–12] a partir do qual existe. */
  de: [number, number];
  /** [ano, mês 1–12] em que deixa de existir com este nome (ausente: segue até hoje). */
  ate?: [number, number];
  /** No que se transformou (mudança de nome, fusão ou incorporação). */
  vira?: string;
  como?: 'nome' | 'fusao' | 'incorporacao' | 'extincao';
  certeza: 'documentado' | 'aproximado';
  /** Nomes anteriores do mesmo id (o PP foi "Partido Progressista" até 2017). */
  nomes?: { ate: number; nome: string; chamado?: string }[];
}

const P = (id: string, sigla: string, nome: string, de: [number, number], extra: Partial<PartidoNoTempo> = {}): PartidoNoTempo =>
  ({ id, sigla, nome, chamado: extra.chamado ?? sigla, artigo: extra.artigo ?? 'o', de, certeza: extra.certeza ?? 'documentado', ...extra });

export const PARTIDOS_BR_NO_TEMPO: readonly PartidoNoTempo[] = [
  // ------------------------------------------------------------ o bipartidarismo (AI-2, 1965; extinto pela Lei 6.767/1979)
  P('ARENA', 'ARENA', 'Aliança Renovadora Nacional', [1966, 4], { chamado: 'Arena', artigo: 'a', ate: [1979, 11], vira: 'PDS', como: 'extincao' }),
  P('MDB_1966', 'MDB', 'Movimento Democrático Brasileiro', [1966, 3], { ate: [1979, 11], vira: 'PMDB', como: 'extincao' }),
  // ------------------------------------------------------------ a reforma de 1979–1980
  P('PDS', 'PDS', 'Partido Democrático Social', [1980, 1], { ate: [1993, 4], vira: 'PPR', como: 'fusao' }),
  P('PMDB', 'PMDB', 'Partido do Movimento Democrático Brasileiro', [1980, 1], { ate: [2017, 12], vira: 'MDB', como: 'nome' }),
  P('PT', 'PT', 'Partido dos Trabalhadores', [1980, 2]),
  P('PDT', 'PDT', 'Partido Democrático Trabalhista', [1980, 6], { certeza: 'aproximado' }),
  P('PTB', 'PTB', 'Partido Trabalhista Brasileiro', [1980, 5], { ate: [2023, 11], vira: 'PRD', como: 'fusao' }),
  P('PP_1980', 'PP', 'Partido Popular', [1980, 4], { ate: [1982, 2], vira: 'PMDB', como: 'incorporacao', certeza: 'aproximado' }),
  // ------------------------------------------------------------ a Nova República
  P('PFL', 'PFL', 'Partido da Frente Liberal', [1985, 1], { ate: [2007, 3], vira: 'DEM', como: 'nome' }),
  P('DEM', 'DEM', 'Democratas', [2007, 3], { ate: [2022, 2], vira: 'UNIÃO', como: 'fusao' }),
  P('PCB_1985', 'PCB', 'Partido Comunista Brasileiro', [1985, 5], { ate: [1992, 1], vira: 'PPS', como: 'nome' }),
  P('PPS', 'PPS', 'Partido Popular Socialista', [1992, 1], { ate: [2019, 3], vira: 'CIDADANIA', como: 'nome' }),
  P('PCdoB', 'PCdoB', 'Partido Comunista do Brasil', [1985, 5]),
  P('PSB', 'PSB', 'Partido Socialista Brasileiro', [1985, 7], { certeza: 'aproximado' }),
  P('PL_1985', 'PL', 'Partido Liberal', [1985, 6], { ate: [2006, 12], vira: 'PR', como: 'fusao', certeza: 'aproximado' }),
  P('PDC', 'PDC', 'Partido Democrata Cristão', [1985, 6], { ate: [1993, 4], vira: 'PPR', como: 'fusao', certeza: 'aproximado' }),
  P('PSC', 'PSC', 'Partido Social Cristão', [1985, 6], { ate: [2023, 6], vira: 'PODE', como: 'incorporacao', certeza: 'aproximado' }),
  P('PMN', 'PMN', 'Partido da Mobilização Nacional', [1986, 1], { ate: [2023, 11], vira: 'MOBILIZA', como: 'nome', certeza: 'aproximado' }),
  P('PV', 'PV', 'Partido Verde', [1986, 1], { certeza: 'aproximado' }),
  P('PSD_1987', 'PSD', 'Partido Social Democrático', [1987, 3], { ate: [2003, 3], vira: 'PTB', como: 'incorporacao', certeza: 'aproximado' }),
  P('PSDB', 'PSDB', 'Partido da Social Democracia Brasileira', [1988, 6]),
  P('PRN', 'PRN', 'Partido da Reconstrução Nacional', [1989, 2], { ate: [2000, 6], vira: 'PTC', como: 'nome', certeza: 'aproximado' }),
  P('PTC', 'PTC', 'Partido Trabalhista Cristão', [2000, 6], { ate: [2022, 5], vira: 'AGIR', como: 'nome', certeza: 'aproximado' }),
  P('PTdoB', 'PTdoB', 'Partido Trabalhista do Brasil', [1989, 10], { ate: [2017, 9], vira: 'AVANTE', como: 'nome', certeza: 'aproximado' }),
  P('PRONA', 'PRONA', 'Partido de Reedificação da Ordem Nacional', [1989, 10], { ate: [2006, 12], vira: 'PR', como: 'fusao', certeza: 'aproximado' }),
  P('PPR', 'PPR', 'Partido Progressista Reformador', [1993, 4], { ate: [1995, 9], vira: 'PPB', como: 'fusao', certeza: 'aproximado' }),
  P('PPB', 'PPB', 'Partido Progressista Brasileiro', [1995, 9], { ate: [2003, 5], vira: 'PP', como: 'nome', certeza: 'aproximado' }),
  P('PSTU', 'PSTU', 'Partido Socialista dos Trabalhadores Unificado', [1995, 12], { certeza: 'aproximado' }),
  P('PCO', 'PCO', 'Partido da Causa Operária', [1997, 9], { certeza: 'aproximado' }),
  P('PSDC', 'PSDC', 'Partido Social Democrata Cristão', [1997, 8], { ate: [2017, 12], vira: 'DC', como: 'nome', certeza: 'aproximado' }),
  P('PRTB', 'PRTB', 'Partido Renovador Trabalhista Brasileiro', [1997, 3], { certeza: 'aproximado' }),
  P('PTN', 'PTN', 'Partido Trabalhista Nacional', [1997, 10], { ate: [2017, 5], vira: 'PODE', como: 'nome', certeza: 'aproximado' }),
  P('PHS', 'PHS', 'Partido Humanista da Solidariedade', [1997, 3], { ate: [2019, 5], vira: 'PODE', como: 'incorporacao', certeza: 'aproximado' }),
  P('PSL', 'PSL', 'Partido Social Liberal', [1998, 6], { ate: [2022, 2], vira: 'UNIÃO', como: 'fusao' }),
  P('PCB', 'PCB', 'Partido Comunista Brasileiro', [1996, 5], { certeza: 'aproximado' }),
  // ------------------------------------------------------------ os anos 2000 e 2010
  P('PRB', 'PRB', 'Partido Republicano Brasileiro', [2005, 8], { ate: [2019, 8], vira: 'REPUBLICANOS', como: 'nome', certeza: 'aproximado' }),
  P('PSOL', 'PSOL', 'Partido Socialismo e Liberdade', [2005, 9]),
  P('PR', 'PR', 'Partido da República', [2006, 12], { ate: [2019, 5], vira: 'PL', como: 'nome', certeza: 'aproximado' }),
  P('PSD', 'PSD', 'Partido Social Democrático', [2011, 9]),
  P('PPL', 'PPL', 'Partido Pátria Livre', [2011, 10], { ate: [2019, 5], vira: 'PCdoB', como: 'incorporacao', certeza: 'aproximado' }),
  P('PEN', 'PEN', 'Partido Ecológico Nacional', [2012, 6], { ate: [2018, 4], vira: 'PATRIOTA', como: 'nome', certeza: 'aproximado' }),
  P('PATRIOTA', 'PATRIOTA', 'Patriota', [2018, 4], { ate: [2023, 11], vira: 'PRD', como: 'fusao', certeza: 'aproximado' }),
  P('PROS', 'PROS', 'Partido Republicano da Ordem Social', [2013, 9], { ate: [2023, 2], vira: 'SOLIDARIEDADE', como: 'incorporacao', certeza: 'aproximado' }),
  P('SOLIDARIEDADE', 'SOLIDARIEDADE', 'Solidariedade', [2013, 9], { chamado: 'Solidariedade' }),
  P('NOVO', 'NOVO', 'Partido Novo', [2015, 9], { chamado: 'Novo' }),
  P('REDE', 'REDE', 'Rede Sustentabilidade', [2015, 9], { chamado: 'Rede', artigo: 'a' }),
  P('PMB', 'PMB', 'Partido da Mulher Brasileira', [2015, 9], { ate: [2025, 12], vira: 'DEMOCRATA', como: 'nome' }),
  P('UP', 'UP', 'Unidade Popular', [2019, 12], { artigo: 'a' }),
  // ------------------------------------------------------------ os de nome atual (a lista de 2026 continua a deles)
  P('MDB', 'MDB', 'Movimento Democrático Brasileiro', [2017, 12]),
  P('CIDADANIA', 'CIDADANIA', 'Cidadania', [2019, 3], { chamado: 'Cidadania' }),
  P('PODE', 'PODE', 'Podemos', [2017, 5], { chamado: 'Podemos' }),
  P('AVANTE', 'AVANTE', 'Avante', [2017, 9], { chamado: 'Avante' }),
  P('DC', 'DC', 'Democracia Cristã', [2017, 12], { artigo: 'a' }),
  P('PP', 'PP', 'Progressistas', [2003, 5], { certeza: 'aproximado', nomes: [{ ate: 2017, nome: 'Partido Progressista' }] }),
  P('REPUBLICANOS', 'REPUBLICANOS', 'Republicanos', [2019, 8], { chamado: 'Republicanos' }),
  P('PL', 'PL', 'Partido Liberal', [2019, 5]),
  P('UNIÃO', 'UNIÃO', 'União Brasil', [2022, 2], { chamado: 'União Brasil' }),
  P('AGIR', 'AGIR', 'Agir', [2022, 5], { chamado: 'Agir', certeza: 'aproximado' }),
  P('PRD', 'PRD', 'Partido Renovação Democrática', [2023, 11]),
  P('MOBILIZA', 'MOBILIZA', 'Mobilização Nacional', [2023, 11], { chamado: 'Mobiliza', certeza: 'aproximado' }),
  P('MISSÃO', 'MISSÃO', 'Partido Missão', [2025, 11], { chamado: 'Missão' }),
  P('DEMOCRATA', 'DEMOCRATA', 'Democrata', [2025, 12], { chamado: 'Democrata' })
];

export const PARTIDO_NO_TEMPO = new Map(PARTIDOS_BR_NO_TEMPO.map(p => [p.id, p]));

const tDe = (x: [number, number]) => x[0] * 12 + x[1] - 1;

/** O partido existe no mês `t` (t = ano*12 + mês 0..11)? */
export const existeNoMes = (p: PartidoNoTempo, t: number) => t >= tDe(p.de) && (!p.ate || t < tDe(p.ate));

/** As chaves dos partidos em que se podia filiar no mês. */
export function partidosNoMes(t: number): string[] {
  return PARTIDOS_BR_NO_TEMPO.filter(p => existeNoMes(p, t)).map(p => p.id);
}

/** O destino de um partido no mês: ele mesmo, se existe; senão, o fim da linhagem até `t` (ou undefined, se extinto sem sucessor). */
export function sucessorNoMes(id: string, t: number): { id: string; passos: PartidoNoTempo[] } | undefined {
  let p = PARTIDO_NO_TEMPO.get(id);
  const passos: PartidoNoTempo[] = [];
  for (let k = 0; p && k < 10; k++) {
    if (existeNoMes(p, t)) return { id: p.id, passos };
    if (!p.vira || !p.ate || t < tDe(p.ate)) return undefined;
    passos.push(p);
    p = PARTIDO_NO_TEMPO.get(p.vira);
  }
  return undefined;
}

/** O mês (t) em que o partido mudou (para a biografia). */
export const mesDaMudanca = (p: PartidoNoTempo) => (p.ate ? tDe(p.ate) : undefined);

/** O nome do partido no ano (o PP foi "Partido Progressista" até 2017). */
export function nomeNoAno(p: PartidoNoTempo, ano: number): { nome: string; chamado: string } {
  const n = p.nomes?.find(x => ano <= x.ate);
  return { nome: n?.nome ?? p.nome, chamado: n?.chamado ?? p.chamado };
}
