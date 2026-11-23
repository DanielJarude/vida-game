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
  /** VIDA 35.2 · o modelo do PC (marca e configuração reais de referência, dentro do degrau). */
  modeloPc?: string;
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

/** VIDA 35.2 · os PCs que a organização pode montar: marcas e linhas reais (de referência de mercado), cada uma em um
 *  degrau. O degrau é o que pesa na força e no preço; o modelo é a escolha da marca e do visual (mesmo preço no degrau).
 *  `carcaca`: a cor de fábrica do gabinete (o desenho da estação usa). */
export interface ModeloPc35 { id: string; marca: string; nome: string; degrau: 0 | 1 | 2 | 3; specs: string; carcaca: 'preta' | 'branca'; nota: string }
export const MODELOS_PC35: ModeloPc35[] = [
  { id: 'dell_optiplex', marca: 'Dell', nome: 'OptiPlex', degrau: 0, specs: 'Intel Core i5 · gráfico integrado', carcaca: 'preta', nota: 'Escritório de confiança: serve para o dia a dia, não para o jogo competitivo.' },
  { id: 'hp_prodesk', marca: 'HP', nome: 'ProDesk', degrau: 0, specs: 'Intel Core i3 · gráfico integrado', carcaca: 'preta', nota: 'O computador da recepção: nada de brilho, nada de LED.' },
  { id: 'acer_nitro', marca: 'Acer', nome: 'Nitro N50', degrau: 1, specs: 'AMD Ryzen 5 · GeForce RTX 4060', carcaca: 'preta', nota: 'A entrada gamer de sempre: roda os jogos de torneio em qualidade média.' },
  { id: 'lenovo_legion', marca: 'Lenovo', nome: 'Legion Tower 5', degrau: 1, specs: 'AMD Ryzen 5 · Radeon RX 7600', carcaca: 'branca', nota: 'Gabinete branco e silencioso, bom para a sala da line sem barulho de ventoinha.' },
  { id: 'hp_omen', marca: 'HP', nome: 'Omen 25L', degrau: 1, specs: 'Intel Core i5 · GeForce RTX 4060', carcaca: 'preta', nota: 'Compacto e com boa refrigeração: cabe no canto do cômodo.' },
  { id: 'corsair_vengeance', marca: 'Corsair', nome: 'Vengeance i7400', degrau: 2, specs: 'Intel Core i7 · GeForce RTX 4070', carcaca: 'preta', nota: 'Competitivo de verdade: a Corsair veste a line de vermelho e preto.' },
  { id: 'asus_rog', marca: 'ASUS ROG', nome: 'Strix GT', degrau: 2, specs: 'AMD Ryzen 7 · GeForce RTX 4070 Ti', carcaca: 'preta', nota: 'A linha Republic of Gamers: iluminação Aura Sync e vermelho na carcaça.' },
  { id: 'msi_mag', marca: 'MSI', nome: 'MAG Codex', degrau: 2, specs: 'Intel Core i7 · GeForce RTX 4070 Super', carcaca: 'branca', nota: 'Gabinete branco com a ventilação frontal: o visual limpo do competitivo.' },
  { id: 'alienware_aurora', marca: 'Alienware', nome: 'Aurora R16', degrau: 3, specs: 'Intel Core i9 · GeForce RTX 4090', carcaca: 'preta', nota: 'O padrão das arenas: a marca do alienígena no painel e a luz da casa inteira.' },
  { id: 'razer_tomahawk', marca: 'Razer', nome: 'Tomahawk', degrau: 3, specs: 'Intel Core i9 · GeForce RTX 4080 Super', carcaca: 'preta', nota: 'Razer Chroma em toda a estação: o topo do visual, da iluminação ao gabinete.' },
  { id: 'msi_aegis', marca: 'MSI', nome: 'Aegis RS', degrau: 3, specs: 'AMD Ryzen 9 · GeForce RTX 4090', carcaca: 'preta', nota: 'Refrigeração líquida e o vermelho de guerra: para quem não aceita o segundo lugar.' }
];
export const modeloPc35 = (id: string | undefined) => MODELOS_PC35.find(m => m.id === id);
/** As cores de RGB que a tela oferece (com nome; o padrão é a cor da organização). */
export const RGB35: { hex: string; nome: string }[] = [
  { hex: '#ffffff', nome: 'Branco frio' }, { hex: '#ef4444', nome: 'Vermelho' }, { hex: '#3b82f6', nome: 'Azul' },
  { hex: '#22c55e', nome: 'Verde' }, { hex: '#a855f7', nome: 'Roxo' }, { hex: '#f59e0b', nome: 'Âmbar' }
];

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
  if (typeof o.modeloPc === 'string' && modeloPc35(o.modeloPc)) s.modeloPc = o.modeloPc;
  return s;
}

/* ------------------------------------------------------------------ VIDA 35.1 · o dia a dia da line e da organização */

export type Foco35 = 'equilibrado' | 'mecanica' | 'estrategia' | 'leve';
export const FOCOS35: { id: Foco35; nome: string; nota: string; forca: number; clima: number; evolucao: number }[] = [
  { id: 'equilibrado', nome: 'Equilibrado', nota: 'A rotina de sempre.', forca: 0, clima: 0, evolucao: 0 },
  { id: 'mecanica', nome: 'Mecânica pesada', nota: 'Horas de mira e execução: +0,5 de força e os jovens evoluem mais — o desgaste pesa no clima.', forca: 0.5, clima: -0.2, evolucao: 0.03 },
  { id: 'estrategia', nome: 'Estratégia e VOD', nota: 'Mais leitura de jogo que horas de servidor: +0,3 de força, sem desgaste.', forca: 0.3, clima: 0, evolucao: 0 },
  { id: 'leve', nome: 'Rotina leve', nota: 'Menos horas, mais descanso: −0,5 de força, o clima melhora e os veteranos cansam menos.', forca: -0.5, clima: 0.4, evolucao: 0 }
];
export const foco35 = (id: Foco35 | undefined) => FOCOS35.find(f => f.id === (id ?? 'equilibrado'))!;

export const SCRIMS35 = [
  { nivel: 1 as const, nome: 'Scrims com as melhores do país', custo: 40e3, forca: 0.6 },
  { nivel: 2 as const, nome: 'Scrims internacionais (fuso trocado, viagem)', custo: 160e3, forca: 1.2 }
];
export const STAFF35 = [
  { nivel: 0 as const, nome: 'Só o técnico', salario: 0, forca: 0 },
  { nivel: 1 as const, nome: 'Assistente e analista', salario: 90e3, forca: 0.3 },
  { nivel: 2 as const, nome: 'Comissão completa (analista de dados, preparador mental, gerente)', salario: 250e3, forca: 0.6 }
];
export const CUSTO_RETIRO35 = 80e3;
export const CUSTO_PENEIRA35 = 50e3;

/** VIDA 35.3 · os torneios fora da liga, do barato (online, na semana) ao major. Cada line joga cada um uma vez por ano. */
export type Torneio35 = 'online' | 'universitario' | 'aberto' | 'regional' | 'convite' | 'lan' | 'major';
export const TORNEIOS35: Record<Torneio35, { nome: string; artigo: 'o' | 'a'; nota: string; inscricao: number; premio: number; minDiv: number; equipes: number; campo: number }> = {
  online: { nome: 'Copa online semanal', artigo: 'a', nota: 'Inscrição pelo servidor, sem viagem: campo aberto e prêmio de cartão de jogo.', inscricao: 4e3, premio: 25e3, minDiv: 2, equipes: 64, campo: 0 },
  universitario: { nome: 'Liga universitária', artigo: 'a', nota: 'Times de faculdade e de cidade: campo fraco, vitrine para os jogadores jovens.', inscricao: 8e3, premio: 50e3, minDiv: 2, equipes: 24, campo: 0 },
  aberto: { nome: 'Copa aberta', artigo: 'a', nota: 'Qualquer equipe se inscreve: campo do seu nível, prêmio pequeno.', inscricao: 15e3, premio: 120e3, minDiv: 2, equipes: 32, campo: 0 },
  regional: { nome: 'Copa regional', artigo: 'a', nota: 'As equipes da região num fim de semana de LAN curta: campo médio e prêmio que paga a viagem.', inscricao: 20e3, premio: 150e3, minDiv: 2, equipes: 16, campo: 1 },
  convite: { nome: 'Torneio de convidados', artigo: 'o', nota: 'Só para quem tem nome: as melhores da região, prêmio e audiência grandes.', inscricao: 60e3, premio: 900e3, minDiv: 3, equipes: 8, campo: 2 },
  lan: { nome: 'LAN de estádio', artigo: 'a', nota: 'Três dias no ginásio, plateia de verdade e transmissão ao vivo: campo forte.', inscricao: 150e3, premio: 700e3, minDiv: 3, equipes: 16, campo: 3 },
  major: { nome: 'Major internacional', artigo: 'o', nota: 'O torneio das regiões: campo de elite e um prêmio que muda a temporada.', inscricao: 400e3, premio: 3.5e6, minDiv: 4, equipes: 16, campo: 4 }
};

/** VIDA 35.3 · a arena própria: a casa de jogo da org (grande obra, manutenção todo ano, público e receita de ingresso). */
export const ARENA36 = { obra: 12e6, manutencao: 700e3, receita: 1.5e6, fas: 6, minDiv: 3 };

/** VIDA 35.3 · a sociedade: um fundo entra com uma fatia da org. Ele leva essa fatia do lucro de cada ano e de cada venda. */
export const PARTES_SOCIO36 = [0.2, 0.35, 0.5] as const;
export type ParteSocio36 = (typeof PARTES_SOCIO36)[number];
const FUNDOS36 = ['Fundo Pixel Capital', 'Grupo Neblina Investimentos', 'Aporte Cometa Ventures', 'Holding Arena Partners', 'Sociedade Vértice'];
export const nomeDoFundo36 = (semente: number) => FUNDOS36[Math.abs(semente) % FUNDOS36.length];
/** Quanto o fundo paga para entrar: a fatia do valor da org, com desconto (ele também corre o risco). */
export const entradaDoSocio36 = (valorOrg: number, parte: number) => Math.round((valorOrg * parte * 0.8) / 1e4) * 1e4;
/** Quanto custa o fundo sair: a fatia com ágio. */
export const saidaDoSocio36 = (valorOrg: number, parte: number) => Math.round((valorOrg * parte * 1.1) / 1e4) * 1e4;

export interface Criador35 { id: string; nome: string; fas: number; salario: number }
/** Os criadores de conteúdo que aceitam assinar neste ano (nomes de jogo, sem pessoas reais). */
export function criadoresDoAno35(semente: number, ano: number, mult: number): Criador35[] {
  const raizes = ['Vovô', 'Tio', 'Mestre', 'Sombra', 'Pimenta', 'Turbo', 'Caju', 'Neblina', 'Bigode', 'Faísca', 'Pipoca', 'Coruja'];
  const sufixos = ['Gamer', 'Plays', 'TV', 'Live', 'Zera', 'Clutch', 'GG', 'Ao Vivo'];
  const out: Criador35[] = [];
  let h = (semente ^ (ano * 2654435761)) >>> 0;
  const rnd = () => { h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return h / 4294967296; };
  for (let k = 0; k < 3; k++) {
    const fas = Math.round(4 + rnd() * 20 + k * 6);
    out.push({ id: `cr${ano}_${k}`, nome: `${raizes[Math.floor(rnd() * raizes.length)]} ${sufixos[Math.floor(rnd() * sufixos.length)]}`, fas, salario: Math.round((40e3 + fas * fas * 900) * mult / 1e4) * 1e4 });
  }
  return out;
}
