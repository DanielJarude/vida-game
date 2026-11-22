/**
 * VIDA 35 · A ORGANIZAÇÃO QUE O DONO MONTA — o equipamento de cada line (o PC, o monitor, os periféricos e a cadeira de
 * cada jogador, peça por peça ou num pacote pronto, com nome da época), os cômodos que a gaming house pode ganhar (academia,
 * chef, psicólogo, análise, fisioterapia, estúdio, quartos) e os eventos que a organização promove. Folha: catálogos,
 * preços e efeitos — quem executa é `org31.ts`.
 */

export type Peca35 = 'pc' | 'monitor' | 'perifericos' | 'cadeira';
export const PECAS35: Peca35[] = ['pc', 'monitor', 'perifericos', 'cadeira'];
export type Gabinete35 = 'torre' | 'aquario' | 'compacto';
export interface Setup35 {
  pc: number; monitor: number; perifericos: number; cadeira: number;
  /** O ano em que cada peça foi comprada (envelhece: com 3 anos rende metade; com 5, nada). */
  anos: Partial<Record<Peca35, number>>;
  gabinete?: Gabinete35;
  rgb?: string;
}
export const NOME_PECA35: Record<Peca35, string> = { pc: 'Computador', monitor: 'Monitor', perifericos: 'Mouse, teclado e headset', cadeira: 'Cadeira' };
export const NOME_GABINETE35: Record<Gabinete35, string> = { torre: 'Torre', aquario: 'Aquário (vidro)', compacto: 'Compacto' };

/** O preço de uma peça por jogador, por degrau (0 é o que a casa já tem: grátis). */
const PRECO: Record<Peca35, number[]> = { pc: [0, 5000, 11000, 22000], monitor: [0, 1500, 3500, 7500], perifericos: [0, 900, 2000, 4000], cadeira: [0, 800, 2000, 4500] };
/** O quanto cada degrau soma na força da line (as quatro peças no topo, novas: +1,8). */
const FORCA: Record<Peca35, number> = { pc: 0.25, monitor: 0.2, perifericos: 0.15, cadeira: 0 };

export function nomeDoDegrau35(p: Peca35, d: number, ano: number): string {
  if (p === 'monitor') {
    const hz = ano < 2008 ? ['CRT de 60 Hz', 'CRT de 85 Hz', 'CRT de 100 Hz', 'CRT de 120 Hz'] : ano < 2013 ? ['60 Hz', '75 Hz', '120 Hz', '144 Hz'] : ano < 2019 ? ['60 Hz', '144 Hz', '165 Hz', '240 Hz'] : ano < 2023 ? ['75 Hz', '144 Hz', '240 Hz', '360 Hz'] : ['144 Hz', '240 Hz', '360 Hz', '540 Hz'];
    return `Monitor ${hz[d]}`;
  }
  if (p === 'pc') return ['PC de escritório', 'PC gamer de entrada', 'PC competitivo', 'PC topo de linha'][d];
  if (p === 'perifericos') return ['Periféricos de loja', 'Periféricos gamer', 'Periféricos pro', 'Periféricos sob medida'][d];
  return ['Cadeira de escritório', 'Cadeira gamer', 'Cadeira ergonômica', 'Ergonômica de topo'][d];
}
export const DESCRICAO35: Record<Peca35, string> = {
  pc: 'Processador e placa de vídeo: o jogo roda liso, sem queda de quadros na hora decisiva.',
  monitor: 'A taxa de atualização: ver o adversário um instante antes.',
  perifericos: 'Mouse, teclado e headset: precisão e o som dos passos.',
  cadeira: 'Ergonomia: menos dor e mais horas de treino (o clima melhora, a força não muda).'
};

export const PACOTES35: { id: string; nome: string; nota: string; s: Pick<Setup35, Peca35> }[] = [
  { id: 'basico', nome: 'Básico', nota: 'O que dá para jogar.', s: { pc: 1, monitor: 1, perifericos: 1, cadeira: 1 } },
  { id: 'competitivo', nome: 'Competitivo', nota: 'O mínimo de uma line séria.', s: { pc: 2, monitor: 2, perifericos: 1, cadeira: 1 } },
  { id: 'lan', nome: 'Padrão de LAN', nota: 'O que os torneios oficiais usam.', s: { pc: 2, monitor: 3, perifericos: 2, cadeira: 2 } },
  { id: 'topo', nome: 'Topo de linha', nota: 'Nada melhor no mercado.', s: { pc: 3, monitor: 3, perifericos: 3, cadeira: 3 } }
];

export const setupVazio35 = (): Setup35 => ({ pc: 0, monitor: 0, perifericos: 0, cadeira: 0, anos: {} });
const efetivo = (s: Setup35, p: Peca35, ano: number) => { const idade = ano - (s.anos[p] ?? ano); return s[p] * (idade >= 5 ? 0 : idade >= 3 ? 0.5 : 1); };
/** Quantos anos a peça tem e se está defasada. */
export const estadoDaPeca35 = (s: Setup35, p: Peca35, ano: number): 'nova' | 'defasada' | 'obsoleta' => { const i = ano - (s.anos[p] ?? ano); return i >= 5 ? 'obsoleta' : i >= 3 ? 'defasada' : 'nova'; };

export const bonusDoSetup35 = (s: Setup35 | undefined, ano: number) => (s ? Math.round(PECAS35.reduce((t, p) => t + efetivo(s, p, ano) * FORCA[p], 0) * 10) / 10 : 0);
/** A cadeira (e o PC que não trava) melhora o clima da line a cada virada. */
export const climaDoSetup35 = (s: Setup35 | undefined, ano: number) => (s ? (efetivo(s, 'cadeira', ano) * 0.1 + (efetivo(s, 'pc', ano) >= 2 ? 0.1 : 0)) : 0);

/** O custo de trocar o setup: cada peça que muda de degrau (ou é renovada) é comprada para todos os jogadores e o técnico. */
export function custoDoSetup35(atual: Setup35 | undefined, novo: Pick<Setup35, Peca35>, renovar: Peca35[], pessoas: number, mult: number): number {
  const a = atual ?? setupVazio35();
  let t = 0;
  for (const p of PECAS35) if (novo[p] !== a[p] || renovar.includes(p)) t += PRECO[p][novo[p]] * pessoas;
  return Math.round((t * mult) / 1000) * 1000;
}
export const precoDaPeca35 = (p: Peca35, d: number, pessoas: number, mult: number) => Math.round((PRECO[p][d] * pessoas * mult) / 1000) * 1000;

/* ------------------------------------------------------------------ os cômodos da gaming house */

export type Comodo35 = 'academia' | 'chef' | 'psicologo' | 'analise' | 'fisio' | 'estudio' | 'quartos';
export interface DadosComodo35 { id: Comodo35; nome: string; obra: number; ano: number; forca: number; nota: string }
export const COMODOS35: DadosComodo35[] = [
  { id: 'analise', nome: 'Sala de análise e VOD', obra: 120e3, ano: 40e3, forca: 0.4, nota: 'Rever as partidas com o técnico: +0,4 de força (+0,2 sem técnico).' },
  { id: 'academia', nome: 'Academia', obra: 150e3, ano: 30e3, forca: 0.2, nota: 'Corpo em dia aguenta a maratona de treino: +0,2 de força e o clima melhora.' },
  { id: 'chef', nome: 'Cozinha com chef e nutricionista', obra: 80e3, ano: 90e3, forca: 0.2, nota: 'Comer bem na rotina pesada: +0,2 de força.' },
  { id: 'psicologo', nome: 'Psicólogo esportivo', obra: 20e3, ano: 120e3, forca: 0.2, nota: 'Cabeça no lugar: +0,2 e o clima ruim pesa metade.' },
  { id: 'fisio', nome: 'Fisioterapia', obra: 100e3, ano: 80e3, forca: 0, nota: 'Punho e coluna cuidados: os veteranos caem mais devagar.' },
  { id: 'quartos', nome: 'Quartos individuais', obra: 300e3, ano: 60e3, forca: 0.2, nota: 'Cada um com o seu canto: +0,2 e menos briga na casa.' },
  { id: 'estudio', nome: 'Estúdio profissional', obra: 250e3, ano: 50e3, forca: 0, nota: 'Conteúdo com cara de TV: mais fãs e mais receita de conteúdo todo ano.' }
];
export const comodo35 = (id: Comodo35) => COMODOS35.find(c => c.id === id)!;
/** O que os cômodos somam na força de uma line (teto +1,2). */
export function bonusDaCasa35(comodos: Comodo35[] | undefined, temTecnico: boolean): number {
  if (!comodos?.length) return 0;
  const t = comodos.reduce((s, c) => s + (c === 'analise' && !temTecnico ? 0.2 : comodo35(c).forca), 0);
  return Math.round(Math.min(1.2, t) * 10) / 10;
}
export const manutencaoDaCasa35 = (comodos: Comodo35[] | undefined, mult: number) => Math.round(((comodos ?? []).reduce((s, c) => s + comodo35(c).ano, 0) * mult) / 1e4) * 1e4;

/* ------------------------------------------------------------------ os eventos da organização */

export type Evento35 = 'encontro' | 'watch' | 'torneio';
export const EVENTOS35: { id: Evento35; nome: string; custo: number; fas: number; rep: number; receita: number; nota: string }[] = [
  { id: 'encontro', nome: 'Encontro com os fãs', custo: 40e3, fas: 2, rep: 0, receita: 0, nota: 'Fotos, autógrafos, a line de perto. Barato e a comunidade adora.' },
  { id: 'watch', nome: 'Watch party', custo: 100e3, fas: 3, rep: 1, receita: 60e3, nota: 'Um telão, a torcida junta assistindo a final. Paga parte com ingresso e bar.' },
  { id: 'torneio', nome: 'Torneio próprio (convidados)', custo: 350e3, fas: 4, rep: 3, receita: 200e3, nota: 'Um campeonato com o nome da organização, com equipes convidadas e transmissão. Patrocínio e audiência pagam parte — mais quanto maior a sua base de fãs.' }
];

/* ------------------------------------------------------------------ a reformulação da line */

export type NivelReformulacao35 = 'barata' | 'nivel' | 'ambiciosa';
export const REFORMULACAO35: Record<NivelReformulacao35, { nome: string; nota: string; delta: number; jovem: boolean }> = {
  barata: { nome: 'Barata, com jovens', nota: 'Jogadores novos, abaixo do nível de hoje, com espaço para crescer.', delta: -3, jovem: true },
  nivel: { nome: 'No mesmo nível', nota: 'Troca as peças sem perder força: um grupo novo, sem os vícios do antigo.', delta: 0, jovem: false },
  ambiciosa: { nome: 'Ambiciosa', nota: 'Nomes acima do nível atual — caros, e quem vem cobra resultado.', delta: 5, jovem: false }
};

/** Normaliza o que vier de um save. */
export function normalizarSetup35(x: unknown): Setup35 | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>;
  const d = (k: Peca35) => (typeof o[k] === 'number' ? Math.max(0, Math.min(3, Math.round(o[k] as number))) : 0);
  const anos: Setup35['anos'] = {};
  if (o.anos && typeof o.anos === 'object') for (const p of PECAS35) { const a = (o.anos as Record<string, unknown>)[p]; if (typeof a === 'number') anos[p] = a; }
  const s: Setup35 = { pc: d('pc'), monitor: d('monitor'), perifericos: d('perifericos'), cadeira: d('cadeira'), anos };
  if (o.gabinete === 'torre' || o.gabinete === 'aquario' || o.gabinete === 'compacto') s.gabinete = o.gabinete;
  if (typeof o.rgb === 'string' && /^#[0-9a-f]{6}$/i.test(o.rgb)) s.rgb = o.rgb;
  return s;
}
