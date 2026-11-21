/**
 * VIDA 33 · A IDENTIDADE DE UM TIME FUNDADO — o escudo (a forma, o padrão, as cores, o símbolo, a estrela), a sigla, o
 * apelido da torcida e o nome da casa (estádio, ginásio ou gaming house). Vale para o clube de futebol, os times de quadra e
 * a organização de e-sports. Folha: só dados e validação (o desenho mora na tela, `ui/v30/escudos/Escudo30`).
 *
 * Um save antigo não tem identidade: a tela desenha o escudo estável pelo nome, como sempre fez.
 */

export type Forma33 = 'classico' | 'redondo' | 'pontudo' | 'reto' | 'hexagono' | 'losango';
export type Padrao33 = 'liso' | 'listras' | 'faixa' | 'metade' | 'horizontal' | 'tres' | 'cruz' | 'aro';
export type Simbolo33 = 'sigla' | 'estrela' | 'raio' | 'coroa' | 'chama' | 'bola' | 'asa' | 'escudo' | 'mira' | 'garra';

export interface Identidade33 {
  forma: Forma33;
  padrao: Padrao33;
  /** Cores em hexadecimal (#rrggbb): a principal, a secundária e a do detalhe (contorno, letras, símbolo). */
  cor1: string; cor2: string; cor3: string;
  /** O que vai no centro: a sigla (letras) ou um símbolo desenhado. */
  simbolo: Simbolo33;
  /** 2 a 4 letras (sem sigla, as iniciais do nome). */
  sigla?: string;
  /** Uma estrela em cima do escudo (os clubes costumam pôr uma por título grande — aqui, escolha do dono). */
  estrela?: boolean;
  /** Como a torcida chama o time ("o Leão da Serra", "a Fúria"). */
  apelido?: string;
  /** O nome da casa: o estádio, o ginásio ou a gaming house. */
  casa?: string;
}

export const FORMAS33: { id: Forma33; nome: string }[] = [
  { id: 'classico', nome: 'Clássico' }, { id: 'redondo', nome: 'Redondo' }, { id: 'pontudo', nome: 'Pontudo' },
  { id: 'reto', nome: 'Reto' }, { id: 'hexagono', nome: 'Hexágono' }, { id: 'losango', nome: 'Losango' }
];
export const PADROES33: { id: Padrao33; nome: string }[] = [
  { id: 'liso', nome: 'Liso' }, { id: 'listras', nome: 'Listras' }, { id: 'horizontal', nome: 'Faixas horizontais' },
  { id: 'faixa', nome: 'Faixa diagonal' }, { id: 'metade', nome: 'Meio a meio' }, { id: 'tres', nome: 'Três faixas' },
  { id: 'cruz', nome: 'Cruz' }, { id: 'aro', nome: 'Aro' }
];
export const SIMBOLOS33: { id: Simbolo33; nome: string }[] = [
  { id: 'sigla', nome: 'Sigla' }, { id: 'estrela', nome: 'Estrela' }, { id: 'raio', nome: 'Raio' }, { id: 'coroa', nome: 'Coroa' },
  { id: 'chama', nome: 'Chama' }, { id: 'bola', nome: 'Bola' }, { id: 'asa', nome: 'Asa' }, { id: 'escudo', nome: 'Escudo' },
  { id: 'mira', nome: 'Mira' }, { id: 'garra', nome: 'Garra' }
];
/** A paleta de partida (o seletor também aceita qualquer cor). */
export const PALETA33 = ['#c8102e', '#8b1d2c', '#f26b21', '#ffd200', '#00813d', '#1e7a3c', '#0b6e8a', '#5aa9e6', '#0b3d91', '#132257', '#5b2a86', '#e05aa0', '#111111', '#5c5f66', '#d4af37', '#ffffff'];

const HEX = /^#[0-9a-f]{6}$/i;
const FORMA_OK = new Set(FORMAS33.map(f => f.id));
const PADRAO_OK = new Set(PADROES33.map(f => f.id));
const SIMBOLO_OK = new Set(SIMBOLOS33.map(f => f.id));
const limpo = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** O que vem da tela ou do save, validado: o que vier quebrado volta ao padrão; texto vazio sai. */
export function normalizarIdentidade33(x: unknown): Identidade33 | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Partial<Identidade33>;
  const cor = (c: unknown, padrao: string) => (typeof c === 'string' && HEX.test(c) ? c.toLowerCase() : padrao);
  const sigla = limpo(o.sigla, 4).toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
  const apelido = limpo(o.apelido, 32);
  const casa = limpo(o.casa, 40);
  return {
    forma: FORMA_OK.has(o.forma as Forma33) ? o.forma as Forma33 : 'classico',
    padrao: PADRAO_OK.has(o.padrao as Padrao33) ? o.padrao as Padrao33 : 'liso',
    cor1: cor(o.cor1, '#0b3d91'), cor2: cor(o.cor2, '#ffffff'), cor3: cor(o.cor3, '#111111'),
    simbolo: SIMBOLO_OK.has(o.simbolo as Simbolo33) ? o.simbolo as Simbolo33 : 'sigla',
    ...(sigla.length >= 1 ? { sigla } : {}),
    ...(o.estrela ? { estrela: true } : {}),
    ...(apelido ? { apelido } : {}),
    ...(casa ? { casa } : {})
  };
}

/** As iniciais de um nome (2–3 letras), sem as preposições. */
export function siglaDoNome33(nome: string): string {
  const ps = nome.replace(/-[A-Z]{2}$/, '').split(/[\s-]+/).filter(w => w.length > 2 && !/^(de|do|da|dos|das|del|la|el|the)$/i.test(w));
  return (ps.length >= 2 ? ps.slice(0, 3).map(w => w[0]).join('') : (ps[0] ?? nome).slice(0, 3)).toUpperCase();
}
