/**
 * O que cada modalidade mede numa temporada, além da nota (FIX final da
 * generalização). Antes, o vôlei só tinha jogos e titularidade, e natação,
 * atletismo e luta eram "competições e pódios" — o mesmo registro para o
 * nadador e para o judoca. Agora:
 *
 *   VÔLEI     — a função em quadra (pela estatura: líbero, levantador,
 *               ponteiro, oposto, central) decide o que se produz por set:
 *               pontos, bloqueios, aces, levantamentos, defesas, recepção.
 *   NATAÇÃO   — uma prova (100 m livre, 200 m costas...), a melhor marca do
 *   ATLETISMO   ano (tempo ou distância, na unidade da prova), o recorde
 *               pessoal, e as competições do ano: finais, pódios, vitórias.
 *   LUTA      — a categoria de peso, o cartel do ano (lutas, vitórias,
 *               derrotas, vitórias antes do tempo), os eventos, os pódios e
 *               os títulos, chave a chave. Não há empate (a chave decide).
 *
 * A prova, a função e a categoria saem do corpo e da semente da pessoa
 * (determinísticas, sem estado novo); a temporada guarda os números.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraEsportiva, Dominio, Temporada, Vida } from '../tipos';
import { ge } from '../texto';
import { estaturaAdulta } from './modalidades';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}
const virgula = (x: number, casas = 1) => x.toFixed(casas).replace('.', ',');

/* ------------------------------------------------------------ Vôlei */

export type FuncaoVolei = 'libero' | 'levantador' | 'ponteiro' | 'oposto' | 'central';
export const NOME_FUNCAO_VOLEI: Record<FuncaoVolei, string> = { libero: 'líbero', levantador: 'levantador', ponteiro: 'ponteiro', oposto: 'oposto', central: 'central' };

/**
 * A função em quadra que o corpo pede: o central é o mais alto do elenco; o
 * líbero, o mais baixo. A régua é a da estatura adulta da população do jogo
 * (os quantis medidos de `estaturaAdulta`, por gênero): uns 15% de líberos,
 * um quarto de levantadores, um terço de ponteiros, e os mais altos no oposto
 * e no meio de rede.
 */
const REGUA_VOLEI: Record<'m' | 'f', [number, number, number, number]> = { m: [159, 171, 185, 193], f: [148, 159, 171, 178] };
export function funcaoVolei(v: Vida): FuncaoVolei {
  const [lib, lev, pon, opo] = REGUA_VOLEI[ge(v) === 'feminino' ? 'f' : 'm'];
  const a = estaturaAdulta(v) + (hash(`${v.id}:volei`) - 0.5) * 3;
  return a >= opo ? 'central' : a >= pon ? 'oposto' : a >= lev ? 'ponteiro' : a >= lib ? 'levantador' : 'libero';
}

/** O que cada função produz por set, numa temporada média (a nota da temporada escala em volta disso). */
export const POR_SET: Record<FuncaoVolei, { pontos: number; bloqueios: number; aces: number; levantamentos: number; defesas: number }> = {
  ponteiro: { pontos: 3.4, bloqueios: 0.3, aces: 0.25, levantamentos: 0, defesas: 1.4 },
  oposto: { pontos: 4.3, bloqueios: 0.5, aces: 0.3, levantamentos: 0, defesas: 0.8 },
  central: { pontos: 2.6, bloqueios: 0.9, aces: 0.15, levantamentos: 0, defesas: 0.4 },
  levantador: { pontos: 0.9, bloqueios: 0.35, aces: 0.3, levantamentos: 8.5, defesas: 1.1 },
  libero: { pontos: 0, bloqueios: 0, aces: 0, levantamentos: 0, defesas: 3.1 }
};

/** A temporada de vôlei em números: os sets jogados e o que a função produziu neles; a recepção, para quem passa. */
export function jogarTemporadaVolei(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada, nota: number): void {
  const fn = funcaoVolei(v);
  const titular = e.espaco === 'titular';
  // O titular joga os sets inteiros; o reserva entra para sacar, para o fundo, para o fim de set.
  const sets = Math.round(t.titular * (3.4 + r.next() * 0.5) + (t.partidas - t.titular) * (titular ? 1 : 0.8));
  const q = clamp((nota - 3.5) / 5, 0.1, 1.4);
  const base = POR_SET[fn];
  const conta = (porSet: number) => Math.round(porSet * q * sets * (0.85 + r.next() * 0.3));
  const passa = fn === 'libero' || fn === 'ponteiro';
  t.funcao = fn;
  t.volei = {
    sets, pontos: conta(base.pontos), bloqueios: conta(base.bloqueios), aces: conta(base.aces),
    levantamentos: conta(base.levantamentos), defesas: conta(base.defesas),
    ...(passa ? { recepcao: Math.round(clamp((fn === 'libero' ? 48 : 38) + (nota - 6) * 4 + r.normal() * 3, 15, 72)) } : {})
  };
  t.gols = 0;
}

/** A produção da temporada contra o que a função costuma dar (1 = o normal): o vôlei se mede pela função. */
export function producaoVolei(t: Temporada): number {
  const x = t.volei;
  if (!x || !x.sets) return 1;
  const fn = (t.funcao as FuncaoVolei) in POR_SET ? (t.funcao as FuncaoVolei) : 'ponteiro';
  const b = POR_SET[fn];
  const por = (n: number) => n / x.sets;
  if (fn === 'libero') return clamp(por(x.defesas) / b.defesas * 0.6 + (x.recepcao ?? 48) / 48 * 0.4, 0, 2);
  if (fn === 'levantador') return clamp(por(x.levantamentos) / b.levantamentos, 0, 2);
  return clamp((por(x.pontos) + por(x.bloqueios)) / (b.pontos + b.bloqueios), 0, 2);
}

/** O número que define a função, por set ("4,1 pontos por set", "3,2 defesas por set"). */
export function numeroDaFuncao(t: Temporada): string {
  const x = t.volei;
  if (!x) return '';
  const s = x.sets || 1;
  switch (t.funcao as FuncaoVolei) {
    case 'libero': return `${virgula(x.defesas / s)} defesas por set${x.recepcao !== undefined ? `, ${x.recepcao}% de recepção` : ''}`;
    case 'levantador': return `${virgula(x.levantamentos / s)} levantamentos por set`;
    case 'central': return `${virgula(x.pontos / s)} pontos e ${virgula(x.bloqueios / s, 2)} bloqueios por set`;
    default: return `${virgula(x.pontos / s)} pontos por set, ${x.aces} aces`;
  }
}

/* ------------------------------------------------------------ Natação e atletismo: a prova e a marca */

export interface Prova {
  nome: string;
  /** Tempo (segundos) ou distância (metros). */
  unidade: 's' | 'm';
  /** A marca de quem compete no regional e a de quem disputa final de mundial — por gênero [masc, fem]. */
  piso: [number, number];
  elite: [number, number];
}
const P = (nome: string, unidade: 's' | 'm', piso: [number, number], elite: [number, number]): Prova => ({ nome, unidade, piso, elite });
export const PROVAS: Partial<Record<Dominio, Prova[]>> = {
  natacao: [
    P('50 m livre', 's', [26.5, 30], [21.6, 24.1]), P('100 m livre', 's', [57, 64], [47.6, 53.0]), P('200 m livre', 's', [125, 140], [105, 116]),
    P('100 m costas', 's', [64, 71], [52.6, 58.6]), P('100 m peito', 's', [71, 80], [58.6, 65.6]), P('100 m borboleta', 's', [61, 69], [50.6, 56.6]),
    P('400 m medley', 's', [300, 332], [248, 276]), P('1.500 m livre', 's', [1080, 1150], [886, 950])
  ],
  atletismo: [
    P('100 m', 's', [11.5, 13.0], [9.95, 10.95]), P('400 m', 's', [51.5, 60], [44.8, 50.5]), P('1.500 m', 's', [252, 292], [213, 240]),
    P('10.000 m', 's', [1960, 2260], [1650, 1830]), P('maratona', 's', [9400, 10900], [7620, 8460]),
    P('salto em distância', 'm', [6.6, 5.3], [8.3, 6.95]), P('salto em altura', 'm', [1.9, 1.6], [2.33, 1.98]),
    P('arremesso de peso', 'm', [15, 12.5], [21.6, 19.6]), P('lançamento de dardo', 'm', [62, 45], [87, 65])
  ]
};

/** A prova da pessoa: a semente escolhe, o corpo inclina (o alto vai para o salto em altura e para o nado longo de braçada). */
export function provaDe(v: Vida, d: Dominio): Prova | undefined {
  const lista = PROVAS[d];
  if (!lista) return undefined;
  const alto = (estaturaAdulta(v) - (ge(v) === 'feminino' ? 163 : 176)) / 10;
  const pesos = lista.map(p => 1 + (/altura|200 m|costas|dardo|peso/.test(p.nome) ? Math.max(0, alto) : /maratona|10\.000|1\.500/.test(p.nome) ? Math.max(0, -alto) : 0));
  let x = hash(`${v.id}:prova:${d}`) * pesos.reduce((a, b) => a + b, 0);
  for (let k = 0; k < lista.length; k++) { x -= pesos[k]; if (x <= 0) return lista[k]; }
  return lista[lista.length - 1];
}

/** A marca que a técnica sustenta (técnica 60 → a do regional; 100 → a de final de mundial), mais a forma do ano. */
export function marcaDaTemporada(p: Prova, feminino: boolean, tecnica: number, nota: number, r?: Rng): number {
  const k = feminino ? 1 : 0;
  const q = clamp((tecnica - 60) / 40, -0.3, 1.04) + (nota - 6) * 0.025 + (r ? r.normal() * 0.012 : 0);
  const marca = p.piso[k] + (p.elite[k] - p.piso[k]) * q;
  return Math.round(marca * 100) / 100;
}

/** A melhor de duas marcas (o tempo menor; a distância maior). */
export const melhorMarca = (p: Pick<Prova, 'unidade'>, a: number, b: number) => (p.unidade === 's' ? Math.min(a, b) : Math.max(a, b));

/** "nos 100 m", "na maratona", "no salto em altura": a prova com a contração certa. */
export const naProva = (nome: string) => (/^\d/.test(nome) ? `nos ${nome}` : nome === 'maratona' ? 'na maratona' : `no ${nome}`);

/** A marca escrita como se escreve na modalidade: "21s84", "1min47s20", "2h08min15", "8,12 m". */
export function formatarMarca(unidade: 's' | 'm', x: number): string {
  if (unidade === 'm') return `${virgula(x, 2)} m`;
  if (x >= 3600) { const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = Math.round(x % 60); return `${h}h${String(m).padStart(2, '0')}min${String(s).padStart(2, '0')}`; }
  if (x >= 60) { const m = Math.floor(x / 60), s = x - m * 60; return `${m}min${s.toFixed(2).padStart(5, '0').replace('.', 's')}`; }
  return x.toFixed(2).replace('.', 's');
}

/**
 * O ano de provas: a melhor marca do ano, o recorde pessoal (melhor que todas
 * as temporadas anteriores na mesma prova) e, competição a competição, a
 * colocação — final (entre os oito), pódio, vitória. A colocação da
 * competição principal (a primeira do calendário) é a que vale título.
 */
export function jogarProvas(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada, nota: number, tecnica: number): void {
  const p = provaDe(v, e.modalidade);
  if (!p) return;
  const fem = ge(v) === 'feminino';
  const marca = marcaDaTemporada(p, fem, tecnica, nota, r);
  const antes = (e.temporadas ?? []).map(x => x.prova).filter((x): x is NonNullable<Temporada['prova']> => !!x && x.nome === p.nome);
  const recordeAnterior = antes.reduce<number | undefined>((a, x) => (a === undefined ? x.marca : melhorMarca(p, a, x.marca)), undefined);
  const recorde = recordeAnterior === undefined || melhorMarca(p, marca, recordeAnterior) === marca && marca !== recordeAnterior;
  let finais = 0, podios = 0, vitorias = 0, principal = 12;
  for (let k = 0; k < t.partidas; k++) {
    // A colocação na competição: a nota do ano contra o campo da prova (a final é dos oito; o pódio, de poucos).
    const col = Math.round(clamp(10 - (nota - 5) * 1.8 + r.normal() * 2.8, 1, 16));
    if (k === 0) principal = col;
    if (col <= 8) finais++;
    if (col <= 3) podios++;
    if (col === 1) vitorias++;
  }
  t.prova = { nome: p.nome, unidade: p.unidade, marca, ...(recorde ? { recorde: true } : {}), finais, podios, vitorias };
  t.colocacao = t.partidas ? principal : 12;
  t.gols = 0;
}

/* ------------------------------------------------------------ Luta */

const CATEGORIAS: [number[], number[]] = [[60, 66, 73, 81, 90, 100], [48, 52, 57, 63, 70, 78]];
/** A categoria de peso (o peso adulto estimado pela estatura e pela semente): "até 73 kg", "acima de 100 kg". */
export function categoriaDeLuta(v: Vida): string {
  const f = ge(v) === 'feminino';
  const peso = (estaturaAdulta(v) - 100) * (f ? 0.9 : 0.98) + (hash(`${v.id}:peso`) - 0.5) * 12;
  const cs = CATEGORIAS[f ? 1 : 0];
  const c = cs.find(x => peso <= x);
  return c ? `até ${c} kg` : `acima de ${cs[cs.length - 1]} kg`;
}

/**
 * O ano de lutas, evento a evento: cada chave tem quatro rodadas (oitavas,
 * quartas, semifinal, final). Perder a semifinal é pódio (o bronze); vencer a
 * final é título. O cartel conta cada luta; as vitórias antes do tempo
 * (ippon, finalização, nocaute — conforme a arte) crescem com a superioridade.
 */
export function jogarLutas(v: Vida, r: Rng, t: Temporada, nota: number): void {
  const aproveitamento = clamp(0.36 + (nota - 5.5) * 0.11, 0.1, 0.9);
  let vit = 0, der = 0, antesDoTempo = 0, titulos = 0, podios = 0, seq = 0, melhorSeq = 0, principal = 9;
  for (let k = 0; k < t.partidas; k++) {
    let rd = 0;
    while (rd < 4) {
      // Cada rodada é um adversário melhor: o título pede quatro vitórias seguidas contra gente cada vez mais forte.
      const p = clamp(aproveitamento + 0.04 - rd * 0.08 + r.normal() * 0.05, 0.05, 0.95);
      if (r.chance(p)) { vit++; rd++; seq++; melhorSeq = Math.max(melhorSeq, seq); if (r.chance(clamp(0.3 + (p - 0.5) * 0.6, 0.1, 0.65))) antesDoTempo++; }
      else { der++; seq = 0; break; }
    }
    if (rd === 4) titulos++;
    if (rd >= 2) podios++;
    if (k === 0) principal = rd === 4 ? 1 : rd === 3 ? 2 : rd === 2 ? 3 : rd === 1 ? 5 : 9;
  }
  t.luta = { categoria: categoriaDeLuta(v), lutas: vit + der, vitorias: vit, derrotas: der, antesDoTempo, titulos, podios, sequencia: melhorSeq };
  t.colocacao = t.partidas ? principal : 9;
  t.gols = 0;
}

/* ------------------------------------------------------------ Leitura comum */

/** Os pódios da temporada (natação, atletismo, luta) — das temporadas antigas, o número que elas guardavam. */
export const podiosDe = (t: Temporada) => t.prova?.podios ?? t.luta?.podios ?? t.gols;
