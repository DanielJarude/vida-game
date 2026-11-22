/**
 * VIDA 34 · AS INSTALAÇÕES DO TIME, PERSONALIZADAS. O estádio, o CT e a base do clube; o ginásio do time de quadra; a
 * gaming house da organização — cada uma desenhada no tamanho que tem (o nível vem do time) e com as escolhas do dono:
 * o nome, a cor das cadeiras, a cobertura, o gramado, o piso, a fachada, a luz. É estética: não muda força nem receita,
 * e por isso não custa nada (as obras de verdade — ampliar o estádio, o CT, o ginásio — seguem nas ações do time).
 * Folha: só tipos e normalização.
 */

export type CorCadeira34 = 'time' | 'cor1' | 'cor2' | 'mosaico' | 'cinza';
export type Gramado34 = 'listras' | 'xadrez' | 'circulos' | 'liso';
export type Cobertura34 = 'nenhuma' | 'parcial' | 'total';
export type Piso34 = 'madeira' | 'escura' | 'azul' | 'cores';
export type Fachada34 = 'time' | 'concreto' | 'vidro' | 'tijolo';
export type EstiloHouse34 = 'loft' | 'casa' | 'escritorio';
export type Parede34 = 'time' | 'grafite' | 'branca' | 'tijolo';
export type Layout34 = 'fileiras' | 'ilha' | 'arena';

export interface Instalacoes34 {
  /** Nome do estádio / ginásio / gaming house (o "nome da casa"). */
  nomeCasa?: string;
  nomeCT?: string;
  nomeBase?: string;
  cadeiras?: CorCadeira34;
  gramado?: Gramado34;
  cobertura?: Cobertura34;
  telao?: boolean;
  /** O nome (ou a sigla) escrito nas cadeiras da arquibancada principal. */
  letreiro?: boolean;
  piso?: Piso34;
  fachada?: Fachada34;
  estilo?: EstiloHouse34;
  /** A cor da luz da gaming house (hex). */
  luz?: string;
  mural?: boolean;
  /** VIDA 35 · a gaming house: a parede, o arranjo das mesas, o letreiro em neon, as plantas, o sofá. */
  parede?: Parede34;
  layout?: Layout34;
  neon?: boolean;
  plantas?: boolean;
  sofa?: boolean;
  /** VIDA 35.1 · cada cômodo da gaming house: os acabamentos (os mesmos da casa: parede, piso, luz) e a decoração escolhida. */
  salas35?: Record<string, SalaPersonalizada35>;
}
export interface SalaPersonalizada35 { parede?: string; piso?: string; luz?: string; extras?: string[] }
/** O que dá para pôr de decoração num cômodo da gaming house (móveis do catálogo da casa). */
export const DECORACAO35 = ['plantas', 'vasos_grandes', 'tapete', 'luminaria', 'estante_trofeus', 'poltrona', 'tv_oled', 'videogame', 'cafeteira', 'estante_escritorio', 'sofa'] as const;
const valido = (x: unknown) => typeof x === 'string' && /^[a-z_]{2,30}$/.test(x) ? x : undefined;

const ESCOLHAS = {
  cadeiras: ['time', 'cor1', 'cor2', 'mosaico', 'cinza'],
  gramado: ['listras', 'xadrez', 'circulos', 'liso'],
  cobertura: ['nenhuma', 'parcial', 'total'],
  piso: ['madeira', 'escura', 'azul', 'cores'],
  fachada: ['time', 'concreto', 'vidro', 'tijolo'],
  estilo: ['loft', 'casa', 'escritorio'],
  parede: ['time', 'grafite', 'branca', 'tijolo'],
  layout: ['fileiras', 'ilha', 'arena']
} as const;

export const NOMES34: Record<string, string> = {
  time: 'Cores do time', cor1: 'Cor principal', cor2: 'Cor secundária', mosaico: 'Mosaico', cinza: 'Cinza neutro',
  listras: 'Listras', xadrez: 'Xadrez', circulos: 'Círculos', liso: 'Liso',
  nenhuma: 'Sem cobertura', parcial: 'Só a principal', total: 'Toda coberta',
  madeira: 'Madeira clara', escura: 'Madeira escura', azul: 'Sintético azul', cores: 'Nas cores do time',
  concreto: 'Concreto', vidro: 'Vidro', tijolo: 'Tijolo aparente',
  loft: 'Loft', casa: 'Casarão', escritorio: 'Andar corporativo',
  grafite: 'Grafite', branca: 'Brancas', fileiras: 'Fileiras', ilha: 'Ilhas frente a frente', arena: 'Arena (em U, com telão)'
};
export const opcoes34 = <K extends keyof typeof ESCOLHAS>(k: K): readonly string[] => ESCOLHAS[k];

const nome = (s: unknown) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, 40) || undefined : undefined);
const de = <K extends keyof typeof ESCOLHAS>(k: K, x: unknown) => ((ESCOLHAS[k] as readonly string[]).includes(x as string) ? x : undefined);

/** Normaliza o que veio da tela (ou de um save): só os campos e valores conhecidos. */
export function normalizarInstalacoes34(x: unknown): Instalacoes34 | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>;
  const r: Instalacoes34 = {
    nomeCasa: nome(o.nomeCasa), nomeCT: nome(o.nomeCT), nomeBase: nome(o.nomeBase),
    cadeiras: de('cadeiras', o.cadeiras) as CorCadeira34 | undefined, gramado: de('gramado', o.gramado) as Gramado34 | undefined,
    cobertura: de('cobertura', o.cobertura) as Cobertura34 | undefined, piso: de('piso', o.piso) as Piso34 | undefined,
    fachada: de('fachada', o.fachada) as Fachada34 | undefined, estilo: de('estilo', o.estilo) as EstiloHouse34 | undefined,
    telao: typeof o.telao === 'boolean' ? o.telao : undefined, letreiro: typeof o.letreiro === 'boolean' ? o.letreiro : undefined,
    mural: typeof o.mural === 'boolean' ? o.mural : undefined,
    parede: de('parede', o.parede) as Parede34 | undefined, layout: de('layout', o.layout) as Layout34 | undefined,
    neon: typeof o.neon === 'boolean' ? o.neon : undefined, plantas: typeof o.plantas === 'boolean' ? o.plantas : undefined, sofa: typeof o.sofa === 'boolean' ? o.sofa : undefined,
    luz: typeof o.luz === 'string' && /^#[0-9a-f]{6}$/i.test(o.luz) ? o.luz : undefined
  };
  if (o.salas35 && typeof o.salas35 === 'object') {
    const salas: Record<string, SalaPersonalizada35> = {};
    for (const [k, v] of Object.entries(o.salas35 as Record<string, unknown>).slice(0, 30)) {
      if (!/^[a-z0-9_:]{2,30}$/.test(k) || !v || typeof v !== 'object') continue;
      const x = v as Record<string, unknown>;
      const sala: SalaPersonalizada35 = { parede: valido(x.parede), piso: valido(x.piso), luz: valido(x.luz), extras: Array.isArray(x.extras) ? [...new Set(x.extras.filter(e => (DECORACAO35 as readonly string[]).includes(e as string)) as string[])] : undefined };
      for (const q of Object.keys(sala) as (keyof SalaPersonalizada35)[]) if (sala[q] === undefined) delete sala[q];
      if (Object.keys(sala).length) salas[k] = sala;
    }
    if (Object.keys(salas).length) r.salas35 = salas;
  }
  for (const k of Object.keys(r) as (keyof Instalacoes34)[]) if (r[k] === undefined) delete r[k];
  return r;
}
