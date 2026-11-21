/**
 * VIDA 33 · A CAMISA E A LOJA DO TIME — o dono desenha o uniforme (o modelo, a gola, o padrão, as cores, as mangas; o
 * escudo e o patrocinador master vão nele sozinhos) e cuida da loja oficial: as linhas de produto (a camisa, a edição
 * especial, o agasalho, o boné, o cachecol; no e-sports a jersey, o moletom e o mousepad em parceria), a faixa de preço e
 * os canais de venda (só a loja online, a loja na casa do time, o licenciamento no varejo). As vendas fecham com a
 * temporada e andam com a torcida (ou os fãs), com o resultado e com a camisa nova do ano.
 *
 * Com fornecedor de material esportivo contratado (a cota "material" dos patrocínios), o fornecedor fabrica e paga
 * royalties: margem menor e nenhum encalhe. Sem fornecedor, o time fabrica: margem maior — e, num ano ruim, encalhe.
 *
 * Folha: só o rng e os tipos (o desenho da camisa mora na tela, `ui/v33/dono/Camisa33`).
 */
import { clamp, type Rng } from '../../rng';
import type { Contexto33, Resultado33 } from './patrocinio33';

export type ModeloCamisa33 = 'redonda' | 'v' | 'polo' | 'raglan' | 'jersey';
export type PadraoCamisa33 = 'liso' | 'listras' | 'horizontal' | 'faixa' | 'metade' | 'ombros' | 'gradiente' | 'risca';
export type Mangas33 = 'cor1' | 'cor2' | 'cor3';
export interface Camisa33 { modelo: ModeloCamisa33; padrao: PadraoCamisa33; cor1: string; cor2: string; cor3: string; mangas: Mangas33; /** O ano da camisa (a do ano vende mais). */ ano: number }
export type Produto33 = 'camisa' | 'especial' | 'agasalho' | 'bone' | 'cachecol' | 'mousepad';
export interface Loja33 {
  camisa?: Camisa33;
  produtos: Produto33[];
  /** 0 popular · 1 normal · 2 premium. */
  preco: 0 | 1 | 2;
  /** 0 só a loja online · 1 loja na casa do time · 2 licenciamento no varejo. */
  canal: 0 | 1 | 2;
  hist: { ano: number; bruto: number; liquido: number; encalhe?: boolean }[];
}

export const MODELOS33: { id: ModeloCamisa33; nome: string }[] = [
  { id: 'redonda', nome: 'Gola redonda' }, { id: 'v', nome: 'Gola V' }, { id: 'polo', nome: 'Gola polo' }, { id: 'raglan', nome: 'Raglan' }, { id: 'jersey', nome: 'Jersey (e-sports)' }
];
export const PADROES_CAMISA33: { id: PadraoCamisa33; nome: string }[] = [
  { id: 'liso', nome: 'Lisa' }, { id: 'listras', nome: 'Listras verticais' }, { id: 'horizontal', nome: 'Listras horizontais' }, { id: 'faixa', nome: 'Faixa diagonal' },
  { id: 'metade', nome: 'Meio a meio' }, { id: 'ombros', nome: 'Ombros' }, { id: 'gradiente', nome: 'Degradê' }, { id: 'risca', nome: 'Risca de giz' }
];

interface DefProduto { id: Produto33; nome: string; peso: number; tipos: Contexto33['tipo'][]; nomeEsports?: string }
const PRODUTOS: DefProduto[] = [
  { id: 'camisa', nome: 'Camisa oficial', nomeEsports: 'Jersey oficial', peso: 1, tipos: ['futebol', 'quadra', 'esports'] },
  { id: 'especial', nome: 'Edição especial (retrô, comemorativa)', nomeEsports: 'Jersey edição especial', peso: 0.35, tipos: ['futebol', 'quadra', 'esports'] },
  { id: 'agasalho', nome: 'Agasalho e jaqueta', nomeEsports: 'Moletom', peso: 0.3, tipos: ['futebol', 'quadra', 'esports'] },
  { id: 'bone', nome: 'Boné e acessórios', peso: 0.15, tipos: ['futebol', 'quadra', 'esports'] },
  { id: 'cachecol', nome: 'Cachecol e bandeira', peso: 0.12, tipos: ['futebol'] },
  { id: 'mousepad', nome: 'Mousepad e periférico em parceria', peso: 0.25, tipos: ['esports'] }
];
export const produtosDe33 = (t: Contexto33['tipo']) => PRODUTOS.filter(p => p.tipos.includes(t));
export const nomeDoProduto33 = (t: Contexto33['tipo'], id: Produto33) => { const p = PRODUTOS.find(x => x.id === id); return (t === 'esports' && p?.nomeEsports) || p?.nome || id; };
export const PRECOS33 = ['Popular', 'Normal', 'Premium'] as const;
export const CANAIS33 = ['Só a loja online', 'Loja na casa do time', 'Licenciamento no varejo'] as const;

const arred = (x: number) => (Math.abs(x) >= 1e6 ? Math.round(x / 1e5) * 1e5 : Math.round(x / 1e3) * 1e3);
const DEMANDA_PRECO = [1.3, 1, 0.7];
const MARGEM_PRECO = [0.25, 0.35, 0.5];
const DEMANDA_CANAL = [1, 1.35, 1.9];

export function novaLoja33(): Loja33 { return { produtos: ['camisa'], preco: 1, canal: 0, hist: [] }; }
/** Lançar uma linha de produto (moldes, amostras, a primeira fornada). */
export const custoDoProduto33 = (ctx: Contexto33) => arred(Math.max(15000, ctx.receitaBase * 0.006));
/** Desenhar a camisa do ano (o designer, as provas). */
export const custoDaCamisa33 = (ctx: Contexto33) => arred(Math.max(8000, ctx.receitaBase * 0.003));
/** O canal por ano (o aluguel da loja, a equipe; o licenciamento, o gerente de contas). */
export const custoDoCanal33 = (ctx: Contexto33, canal: number) => (canal <= 0 ? 0 : arred(ctx.receitaBase * [0, 0.012, 0.02][canal] + [0, 30e3, 60e3][canal]));

/** A estimativa do ano (a tela mostra antes de fechar). `fornecedor`: há contrato de material esportivo. */
export function previsaoDaLoja33(ctx: Contexto33, l: Loja33, fornecedor: boolean): { bruto: number; liquido: number; margem: number } {
  const peso = produtosDe33(ctx.tipo).filter(p => l.produtos.includes(p.id)).reduce((s, p) => s + p.peso, 0);
  const fama = clamp(ctx.fama, 0, 100);
  const nova = l.camisa && l.camisa.ano === ctx.ano ? 1.25 : 1;
  const escala = ctx.tipo === 'esports' ? 0.35 : ctx.tipo === 'quadra' ? 0.2 : 0.25;
  const bruto = ctx.receitaBase * escala * Math.pow(Math.max(1, fama) / 50, 1.3) * peso * DEMANDA_PRECO[l.preco] * DEMANDA_CANAL[l.canal] * nova * (l.camisa ? 1 : 0.8);
  const margem = fornecedor ? MARGEM_PRECO[l.preco] * 0.45 : MARGEM_PRECO[l.preco] * (l.canal === 2 ? 0.75 : 1);
  return { bruto: arred(bruto), liquido: arred(bruto * margem), margem };
}

export type OpLoja33 =
  | { acao: 'camisa'; camisa: Omit<Camisa33, 'ano'> }
  | { acao: 'produto'; produto: Produto33; ligar: boolean }
  | { acao: 'preco'; nivel: 0 | 1 | 2 }
  | { acao: 'canal'; nivel: 0 | 1 | 2 };

const HEX = /^#[0-9a-f]{6}$/i;
export function normalizarCamisa33(x: unknown, ano: number): Camisa33 | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const c = x as Partial<Camisa33>;
  const cor = (v: unknown, p: string) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : p);
  return {
    modelo: MODELOS33.some(m => m.id === c.modelo) ? c.modelo as ModeloCamisa33 : 'redonda',
    padrao: PADROES_CAMISA33.some(m => m.id === c.padrao) ? c.padrao as PadraoCamisa33 : 'liso',
    cor1: cor(c.cor1, '#0b3d91'), cor2: cor(c.cor2, '#ffffff'), cor3: cor(c.cor3, '#111111'),
    mangas: c.mangas === 'cor2' || c.mangas === 'cor3' ? c.mangas : 'cor1',
    ano: typeof c.ano === 'number' ? c.ano : ano
  };
}

export function problemaLoja33(ctx: Contexto33, l: Loja33 | undefined, op: OpLoja33, caixa: number): string | undefined {
  switch (op.acao) {
    case 'camisa': {
      if (l?.camisa?.ano === ctx.ano) return undefined; // ajustar a camisa do ano não cobra de novo
      const c = custoDaCamisa33(ctx);
      return caixa >= c ? undefined : `Desenhar a camisa custa ${c.toLocaleString('pt-BR')}; o caixa não tem.`;
    }
    case 'produto': {
      if (!produtosDe33(ctx.tipo).some(p => p.id === op.produto)) return 'Esse produto não é desta modalidade.';
      if (op.produto === 'camisa' && !op.ligar) return 'A camisa oficial não sai da loja.';
      if (op.ligar && l?.produtos.includes(op.produto)) return 'Já está na loja.';
      if (!op.ligar && !l?.produtos.includes(op.produto)) return 'Não está na loja.';
      const c = custoDoProduto33(ctx);
      return !op.ligar || caixa >= c ? undefined : `Lançar a linha custa ${c.toLocaleString('pt-BR')}; o caixa não tem.`;
    }
    case 'preco': return (l?.preco ?? 1) === op.nivel ? 'Já é assim.' : undefined;
    case 'canal': return (l?.canal ?? 0) === op.nivel ? 'Já é assim.' : undefined;
  }
}

export function executarLoja33(ctx: Contexto33, l: Loja33, op: OpLoja33): { texto: string; custo: number } {
  switch (op.acao) {
    case 'camisa': {
      const custo = l.camisa?.ano === ctx.ano ? 0 : custoDaCamisa33(ctx);
      l.camisa = normalizarCamisa33({ ...op.camisa, ano: ctx.ano }, ctx.ano);
      return { texto: custo ? `A camisa de ${ctx.ano} foi lançada: a do ano vende mais.` : 'A camisa do ano foi ajustada.', custo };
    }
    case 'produto':
      if (op.ligar) { l.produtos.push(op.produto); return { texto: `${nomeDoProduto33(ctx.tipo, op.produto)}: a linha chegou à loja.`, custo: custoDoProduto33(ctx) }; }
      l.produtos = l.produtos.filter(p => p !== op.produto);
      return { texto: `${nomeDoProduto33(ctx.tipo, op.produto)} saiu da loja.`, custo: 0 };
    case 'preco': l.preco = op.nivel; return { texto: `Preços: ${PRECOS33[op.nivel].toLowerCase()}.`, custo: 0 };
    case 'canal': l.canal = op.nivel; return { texto: `${CANAIS33[op.nivel]}${op.nivel ? ` (${custoDoCanal33(ctx, op.nivel).toLocaleString('pt-BR')} por ano)` : ''}.`, custo: 0 };
  }
}

/** A temporada da loja (`ctx` do ano que fechou): o que vendeu, o que sobrou, o canal pago. */
export function fecharAnoLoja33(ctx: Contexto33, l: Loja33, res: Resultado33, fornecedor: boolean, r: Rng): { receita: number; despesa: number; texto?: string } {
  const p = previsaoDaLoja33(ctx, l, fornecedor);
  const humor = res.titulo ? 1.35 : res.subiu ? 1.2 : res.caiu ? 0.75 : res.internacional ? 1.15 : 1;
  const bruto = arred(p.bruto * humor * (0.9 + r.next() * 0.2));
  let liquido = arred(bruto * p.margem);
  // Sem fornecedor, quem fabrica corre o risco: um ano ruim deixa encalhe (a fornada foi feita pela previsão).
  const encalhe = !fornecedor && humor < 1 && bruto > 0;
  if (encalhe) liquido = arred(liquido - p.bruto * (1 - humor) * 0.5);
  const despesa = custoDoCanal33(ctx, l.canal);
  l.hist.push({ ano: ctx.ano, bruto, liquido, ...(encalhe ? { encalhe } : {}) });
  if (l.hist.length > 20) l.hist.splice(0, l.hist.length - 20);
  return { receita: liquido, despesa, texto: bruto > 0 ? `A loja vendeu ${bruto.toLocaleString('pt-BR')} em produtos em ${ctx.ano}${encalhe ? ' — e sobrou encalhe' : ''}.` : undefined };
}

export function normalizarLoja33(x: unknown, ano: number): Loja33 | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const l = x as Partial<Loja33>;
  const produtos = Array.isArray(l.produtos) ? l.produtos.filter(p => PRODUTOS.some(d => d.id === p)) : [];
  if (!produtos.includes('camisa')) produtos.unshift('camisa');
  return {
    ...(l.camisa ? { camisa: normalizarCamisa33(l.camisa, ano) } : {}),
    produtos, preco: l.preco === 0 || l.preco === 2 ? l.preco : 1, canal: l.canal === 1 || l.canal === 2 ? l.canal : 0,
    hist: Array.isArray(l.hist) ? l.hist.slice(-20) : []
  };
}
