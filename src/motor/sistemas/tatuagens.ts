/**
 * HOTFIX 11.5.1 — TATUAR E TIRAR.
 *
 * VIDA 12.6 — O ESTÚDIO DE VERDADE. Cada tatuagem é um registro próprio: a região precisa do corpo (o bíceps esquerdo,
 * a costela direita, a nuca), a posição dentro dela, a escala, a rotação, o espelhamento, a cor (só preto, preto e cinza,
 * colorida — e o tom da tinta ou a paleta), a intensidade, o texto (no lettering) e o significado (por quem, por quê).
 *
 * - O QUE CABE é geometria: o desenho tem um retângulo (o tamanho, a proporção, a rotação) dentro da caixa da região
 *   (`dados/tatuagens.REGIOES`, nas unidades da figura) — a posição só anda até a borda (nunca fora do corpo); duas
 *   tatuagens na mesma região não podem se sobrepor; a superfície (o braço inteiro, as costas inteiras) ocupa as
 *   regiões de baixo. Várias no mesmo braço, cada uma no seu lugar, nenhuma apaga a outra.
 * - O TEMPO: a tinta desbota devagar com os anos (mais o colorido que o preto; a pele mais velha um pouco mais); o
 *   RETOQUE devolve a tinta. Nada de envelhecimento exagerado — é a leitura da `ui/avatar/Figura`.
 * - TIRAR: o laser (sessões ao longo de um ano, mais para a colorida e a grande), mais caro que fazer, dói e cansa — e a
 *   colorida grande pode deixar uma sombra leve. A COBERTURA: um desenho maior e mais escuro por cima da antiga.
 * - O HISTÓRICO: nada se apaga do registro — o que saiu no laser e o que foi coberto continuam na lista (fora da pele),
 *   com a data de cada coisa; a biografia guarda o que importa (a primeira, as grandes, as que têm significado).
 * - AS COMPOSIÇÕES: o estúdio monta a manga, a meia manga, o peito, as costas ou a perna com vários desenhos (um por
 *   região) e um fundo que os une; o que já está na região entra no conjunto (nada é refeito).
 */
import type { ComposicaoDeTatuagens, Tatuagem, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { economiaLocal } from '../dados/lugares';
import {
  desenhoDeTatuagem, medidaDoDesenho, modeloDeComposicao, NOME_COMPOSICAO, NOME_SIGNIFICADO, PRECO_POR_TAMANHO, REGIAO_DA_PARTE, REGIOES, REGIOES_DA_COMPOSICAO, regioesCobertas, regioesDoDesenho,
  COMPOSICAO_TEM_LADO, corPadraoDe, type CorDaTatuagem, type DesenhoDeTatuagem, type FundoDeComposicao, type Lado, type LocalDeTatuagem, type RegiaoDeTatuagem, type SignificadoDaTatuagem,
  type TamanhoDeTatuagem
} from '../dados/tatuagens';
import { pagar, vereditoDePagar } from './dinheiro';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export const IDADE_PARA_TATUAR = 18;
/** O laser leva um ano de sessões (a colorida e a grande, mais). */
export const MESES_DE_LASER = 12;
/** Antes disso a tinta ainda está viva: o tatuador não retoca. */
export const ANOS_PARA_RETOQUE = 4;
/** Os estilos que cobrem bem uma tatuagem antiga (preto carregado, desenho fechado). */
const COBREM = new Set(['realista', 'tradicional', 'blackwork', 'tribal', 'oriental', 'ornamental', 'floral', 'geometrica', 'abstrata', 'composicao']);

export type AjusteDaTatuagem = { x: number; y: number; escala: number; rot: number; espelhar?: boolean };

export interface PedidoDeTatuagem {
  desenho: string;
  regiao?: RegiaoDeTatuagem;
  /** Chamadas antigas: só a parte grande (vira a região mais natural dela que tiver espaço). */
  local?: LocalDeTatuagem;
  lado?: Lado;
  tamanho?: TamanhoDeTatuagem;
  ajuste?: AjusteDaTatuagem;
  cor?: CorDaTatuagem;
  tom?: string;
  intensidade?: number;
  texto?: string;
  significado?: { tipo: SignificadoDaTatuagem; pessoaId?: string };
  /** Cobrir esta tatuagem (o id). */
  cobre?: string;
  conjunto?: string;
  /** O tatuador acha o lugar livre (a escala, a rotação e o espelhamento do `ajuste` valem; a posição, não). */
  posicaoLivre?: boolean;
}

/* ------------------------------------------------------------------ leitura do registro */

export const regiaoDe = (x: Pick<Tatuagem, 'regiao' | 'local' | 'desenho'>): RegiaoDeTatuagem =>
  x.regiao ?? (desenhoDeTatuagem(x.desenho)?.tamanho === 4 ? desenhoDeTatuagem(x.desenho)!.regioes![0] : REGIAO_DA_PARTE[x.local]?.[0] ?? 'biceps');
export const tamanhoDe = (x: Pick<Tatuagem, 'tamanho' | 'desenho'>): TamanhoDeTatuagem => x.tamanho ?? desenhoDeTatuagem(x.desenho)?.tamanho ?? 1;
export const corDe = (x: Pick<Tatuagem, 'cor' | 'desenho'>): CorDaTatuagem => { const d = desenhoDeTatuagem(x.desenho); return x.cor ?? (d ? corPadraoDe(d) : 'preta'); };
const ajusteDe = (x: Pick<Tatuagem, 'ajuste'>): AjusteDaTatuagem => x.ajuste ?? { x: 0, y: 0, escala: 1, rot: 0 };

/** Quantos meses o laser leva para essa. */
export function mesesDeLaser(x: Pick<Tatuagem, 'cor' | 'desenho' | 'tamanho'>): number {
  return MESES_DE_LASER + (corDe(x) === 'colorida' ? 6 : 0) + (tamanhoDe(x) >= 3 ? 6 : 0);
}
/** O laser já terminou (a pele voltou — ou ficou a sombra). */
const laserTerminou = (v: Vida, x: Tatuagem) => x.removida !== undefined && v.t - x.removida >= mesesDeLaser(x);
/** Uma colorida grande deixa uma sombra leve depois do laser. */
export const deixaSombra = (x: Tatuagem) => corDe(x) === 'colorida' && tamanhoDe(x) >= 3;

/** As tatuagens que existem na pele agora (inclusive as que o laser está tirando). */
export const tatuagensDe = (v: Vida): Tatuagem[] => (v.eu.tatuagens ?? []).filter(x => !x.coberta && !laserTerminou(v, x));
/** Todo o registro (o que saiu e o que foi coberto também), do mais antigo ao mais novo. */
export const historicoDeTatuagens = (v: Vida): Tatuagem[] => [...(v.eu.tatuagens ?? [])].sort((a, b) => a.t - b.t);
/** Desde quando a tinta está como está (o último retoque). */
export const ultimaTinta = (x: Tatuagem) => Math.max(x.t, ...(x.retoques ?? []));
/** Estado do registro, em palavras curtas. */
export function estadoDaTatuagem(v: Vida, x: Tatuagem): 'na_pele' | 'saindo' | 'removida' | 'coberta' {
  if (x.coberta) return 'coberta';
  if (x.removida !== undefined) return laserTerminou(v, x) ? 'removida' : 'saindo';
  return 'na_pele';
}

/* ------------------------------------------------------------------ geometria */

export interface Retangulo { cx: number; cy: number; w: number; h: number }

/** Onde o desenho fica dentro da região: a posição (-1..1) só anda até a borda — nunca fora do corpo. */
export { medidaDoDesenho };
export function retanguloNaRegiao(d: DesenhoDeTatuagem, regiao: RegiaoDeTatuagem, tamanho: TamanhoDeTatuagem, aj: AjusteDaTatuagem = { x: 0, y: 0, escala: 1, rot: 0 }): Retangulo | null {
  const R = REGIOES[regiao];
  const { w, h } = medidaDoDesenho(d, regiao, tamanho, aj.escala, aj.rot);
  if (w > R.w + 0.01 || h > R.h + 0.01) return null;
  const lim = (n: number) => Math.max(-1, Math.min(1, n));
  return { cx: lim(aj.x) * (R.w - w) / 2, cy: lim(aj.y) * (R.h - h) / 2, w, h };
}

export const retanguloDe = (x: Tatuagem): Retangulo | null => {
  const d = desenhoDeTatuagem(x.desenho);
  return d ? retanguloNaRegiao(d, regiaoDe(x), tamanhoDe(x), ajusteDe(x)) : null;
};

/** Se dois retângulos se sobrepõem de verdade (mais que um encostar de bordas). */
export function sobrepoe(a: Retangulo, b: Retangulo): boolean {
  const ix = Math.min(a.cx + a.w / 2, b.cx + b.w / 2) - Math.max(a.cx - a.w / 2, b.cx - b.w / 2);
  const iy = Math.min(a.cy + a.h / 2, b.cy + b.h / 2) - Math.max(a.cy - a.h / 2, b.cy - b.h / 2);
  if (ix <= 0 || iy <= 0) return false;
  return ix * iy > 0.1 * Math.min(a.w * a.h, b.w * b.h);
}

const mesmoLado = (r: RegiaoDeTatuagem, a?: Lado, b?: Lado) => !REGIOES[r].lados || a === b;

/** As tatuagens na pele que disputam o lugar com um pedido nessa região e lado (a superfície disputa com as de baixo). */
function vizinhas(v: Vida, regiao: RegiaoDeTatuagem, lado: Lado | undefined, ignorar?: string): { x: Tatuagem; total: boolean }[] {
  const out: { x: Tatuagem; total: boolean }[] = [];
  for (const x of tatuagensDe(v)) {
    if (x.id === ignorar) continue;
    const rx = regiaoDe(x);
    if (rx === regiao) { if (mesmoLado(regiao, x.lado, lado)) out.push({ x, total: false }); continue; }
    const ladosBatem = !REGIOES[rx].lados || !REGIOES[regiao].lados || x.lado === lado;
    // Superfície × regiões de baixo (nos dois sentidos): disputa o lugar inteiro.
    if (REGIOES[regiao].cobre?.includes(rx) && ladosBatem) out.push({ x, total: true });
    else if (REGIOES[rx].cobre?.includes(regiao) && ladosBatem) out.push({ x, total: true });
  }
  return out;
}

/** O primeiro lugar livre da região para o desenho (o centro primeiro; depois ao longo da região). */
export function lugarLivre(v: Vida, d: DesenhoDeTatuagem, regiao: RegiaoDeTatuagem, lado: Lado | undefined, tamanho: TamanhoDeTatuagem, escala = 1, rot = 0, ignorar?: string): { x: number; y: number } | null {
  const viz = vizinhas(v, regiao, lado, ignorar);
  if (viz.some(z => z.total)) return null;
  const outros = viz.map(z => retanguloDe(z.x)).filter((r): r is Retangulo => !!r);
  const ys = [0, -1, 1, -0.5, 0.5, -0.75, 0.75, -0.25, 0.25];
  const xs = [0, -1, 1, -0.5, 0.5];
  for (const y of ys) for (const x of xs) {
    const r = retanguloNaRegiao(d, regiao, tamanho, { x, y, escala, rot });
    if (r && !outros.some(o => sobrepoe(o, r))) return { x, y };
  }
  return null;
}

/* ------------------------------------------------------------------ preço */

const custoLocal = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const arred = (n: number) => Math.round(n / 10) * 10;

export function precoDoPedido(v: Vida, p: Pick<PedidoDeTatuagem, 'desenho' | 'tamanho' | 'ajuste' | 'cor' | 'regiao' | 'texto' | 'cobre'>): number {
  const d = desenhoDeTatuagem(p.desenho);
  if (!d) return 0;
  const tam = p.tamanho ?? d.tamanho;
  const esc = p.ajuste?.escala ?? 1;
  const cor = p.cor ?? corPadraoDe(d);
  const k = (cor === 'colorida' ? 1.3 : cor === 'cinza' ? 1.12 : 1) * (p.regiao && REGIOES[p.regiao].sensivel ? 1.15 : 1) * (p.texto ? 1.08 : 1) * (p.cobre ? 1.35 : 1);
  return arred(PRECO_POR_TAMANHO[tam] * (tam === 4 ? 1 : esc * esc) * k * custoLocal(v));
}
/** Compatível com o 11.5.1: o preço do desenho no tamanho e na cor dele. */
export const precoDaTatuagem = (v: Vida, desenho: string) => precoDoPedido(v, { desenho });
const precoDoRegistro = (v: Vida, t: Tatuagem) => precoDoPedido(v, { desenho: t.desenho, tamanho: tamanhoDe(t), cor: corDe(t), ajuste: t.ajuste });
export const precoDaRemocao = (v: Vida, t: Tatuagem) => arred(precoDoRegistro(v, t) * (corDe(t) === 'colorida' ? 2 : 1.6));
export const precoDoRetoque = (v: Vida, t: Tatuagem) => Math.max(arred(150 * custoLocal(v)), arred(precoDoRegistro(v, t) * 0.3));

/* ------------------------------------------------------------------ o que pode */

function bloqueiosComuns(v: Vida): Veredito | null {
  if (idade(v) < IDADE_PARA_TATUAR) return bloqueio('impossivel', `A partir dos ${IDADE_PARA_TATUAR} anos: estúdio sério não tatua menor de idade.`);
  if (v.justica?.prisao) return bloqueio('incompativel', 'Não da prisão.');
  if (v.corpo.saude < 40) return bloqueio('incompativel', 'Com a saúde assim, o tatuador pede para voltar depois.');
  return null;
}

type PedidoResolvido = PedidoDeTatuagem & { regiao: RegiaoDeTatuagem; tamanho: TamanhoDeTatuagem; ajuste: AjusteDaTatuagem };

/** O pedido com a região resolvida (a parte antiga vira a região mais natural com espaço) e a posição achada. */
export function resolverPedido(v: Vida, p: PedidoDeTatuagem): PedidoResolvido | { erro: string; grau: 'impossivel' | 'incompativel' } {
  const d = desenhoDeTatuagem(p.desenho);
  if (!d) return { erro: 'Esse desenho não existe.', grau: 'impossivel' };
  const tamanho = p.tamanho ?? d.tamanho;
  if (!d.tamanhos.includes(tamanho)) return { erro: `${d.nome} não fica bom nesse tamanho.`, grau: 'impossivel' };
  const escala = Math.max(0.8, Math.min(1.25, p.ajuste?.escala ?? 1));
  const rot = Math.max(-180, Math.min(180, p.ajuste?.rot ?? 0));
  let regiao = p.regiao;
  const local = p.local;
  if (!regiao && local) {
    const possiveis = regioesDoDesenho(d, tamanho).filter(r => tamanho === 4 ? REGIOES[r].parte === local || (local === 'braco' && r === 'manga') : REGIAO_DA_PARTE[local].includes(r));
    regiao = possiveis.find(r => lugarLivre(v, d, r, REGIOES[r].lados ? p.lado : undefined, tamanho, escala, rot)) ?? possiveis[0];
    if (!regiao) return { erro: `${d.nome} não cabe ${ondeEsta(local, p.lado)}.`, grau: 'impossivel' };
  }
  if (!regiao || !REGIOES[regiao]) return { erro: 'Escolha onde.', grau: 'impossivel' };
  if (!regioesDoDesenho(d, tamanho).includes(regiao)) return { erro: `${d.nome} ${tamanho === 4 ? 'é uma peça inteira: não cabe' : 'não cabe'} ${ondeEsta(regiao, p.lado)}.`, grau: 'impossivel' };
  if (REGIOES[regiao].lados && !p.lado) return { erro: 'Escolha o lado.', grau: 'impossivel' };
  const lado = REGIOES[regiao].lados ? p.lado : undefined;
  let ajuste: AjusteDaTatuagem;
  if (p.ajuste && !p.posicaoLivre) ajuste = { x: p.ajuste.x, y: p.ajuste.y, escala, rot, ...(p.ajuste.espelhar ? { espelhar: true } : {}) };
  else {
    const alvo = p.cobre ? (v.eu.tatuagens ?? []).find(x => x.id === p.cobre) : undefined;
    const l = alvo ? ajusteDe(alvo) : lugarLivre(v, d, regiao, lado, tamanho, escala, rot);
    ajuste = { x: l?.x ?? 0, y: l?.y ?? 0, escala, rot, ...(p.ajuste?.espelhar ? { espelhar: true } : {}) };
  }
  return { ...p, regiao, lado, tamanho, ajuste };
}

export function disponibilidadePedido(v: Vida, p0: PedidoDeTatuagem): Veredito {
  const c = bloqueiosComuns(v);
  if (c) return c;
  const p = resolverPedido(v, p0);
  if ('erro' in p) return bloqueio(p.grau, p.erro);
  const d = desenhoDeTatuagem(p.desenho)!;
  const r = retanguloNaRegiao(d, p.regiao, p.tamanho, p.ajuste);
  if (!r) return bloqueio('impossivel', `Grande demais para ${artigo(p.regiao)} ${REGIOES[p.regiao].nome}: diminua o tamanho ou escolha outro lugar.`);
  if (p.cor === 'colorida' && !d.colorida) return bloqueio('impossivel', `${d.nome} é traço: escolha o tom da tinta, não a paleta.`);
  if (d.texto && p.texto !== undefined && !p.texto.trim()) return bloqueio('impossivel', 'Escreva o texto.');
  if (p.texto && p.texto.length > 28) return bloqueio('impossivel', 'Texto longo demais para o desenho (até 28 letras).');
  let alvo: Tatuagem | undefined;
  if (p.cobre) {
    alvo = tatuagensDe(v).find(x => x.id === p.cobre);
    if (!alvo) return bloqueio('impossivel', 'Essa tatuagem não existe mais.');
    if (alvo.removida !== undefined) return bloqueio('incompativel', 'Essa está saindo no laser: espere a pele voltar.');
    if (regiaoDe(alvo) !== p.regiao || !mesmoLado(p.regiao, alvo.lado, p.lado)) return bloqueio('impossivel', 'A cobertura vai no mesmo lugar da antiga.');
    const fraca = !COBREM.has(d.estilo) || (p.cor ?? corDe({ desenho: d.id })) === 'preta' && !['blackwork', 'tribal', 'realista', 'tradicional', 'oriental'].includes(d.estilo);
    if (fraca) return bloqueio('incompativel', 'Para cobrir, o tatuador pede um desenho fechado e escuro (blackwork, tribal, realista, oriental, floral, old school...).');
    const ra = retanguloDe(alvo);
    if (ra && (r.w * r.h < ra.w * ra.h * 1.2 || Math.abs(r.cx - ra.cx) + ra.w / 2 > r.w / 2 + 0.8 || Math.abs(r.cy - ra.cy) + ra.h / 2 > r.h / 2 + 0.8)) return bloqueio('incompativel', 'A cobertura precisa ser maior que a antiga e ficar por cima dela inteira.');
  }
  const viz = vizinhas(v, p.regiao, p.lado, alvo?.id);
  if (viz.some(z => z.total)) return bloqueio('incompativel', `${REGIOES[p.regiao].cobre ? 'A peça inteira pede a parte livre' : 'Essa parte já tem uma peça inteira'}: ${ondeEsta(p.regiao, p.lado)} já tem tatuagem.`);
  const choca = viz.find(z => { const o = retanguloDe(z.x); return o && sobrepoe(o, r); });
  if (choca) return bloqueio('incompativel', `Ficaria por cima da ${nomeDaTatuagem(choca.x).toLowerCase()} ${ondeEsta(p.regiao, p.lado)}: mude a posição ou o tamanho, ou escolha outro lugar.`);
  return vereditoDePagar(v, precoDoPedido(v, p), 'Custa') ?? PERMITIDO;
}

/** Compatível com o 11.5.1 (desenho, parte, lado). */
export const disponibilidadeTatuar = (v: Vida, desenho: string, local: LocalDeTatuagem, lado?: Lado) => disponibilidadePedido(v, { desenho, local, lado });

/* ------------------------------------------------------------------ textos */

const artigo = (r: RegiaoDeTatuagem) => (REGIOES[r].plural ? (REGIOES[r].fem ? 'as' : 'os') : REGIOES[r].fem ? 'a' : 'o');
function ladoEm(r: RegiaoDeTatuagem, lado?: Lado): string {
  if (!REGIOES[r].lados || !lado) return '';
  const f = REGIOES[r].fem, pl = REGIOES[r].plural;
  return ' ' + (lado === 'e' ? (f ? 'esquerda' : 'esquerdo') : f ? 'direita' : 'direito') + (pl ? 's' : '');
}
/** "no antebraço esquerdo", "na costela direita", "nas costas inteiras", "nos dedos da mão direita". */
export function ondeEsta(r: RegiaoDeTatuagem | LocalDeTatuagem, lado?: Lado): string {
  const reg: RegiaoDeTatuagem = r in REGIOES ? (r as RegiaoDeTatuagem) : r === 'braco' ? 'biceps' : r === 'peito' ? 'peitoral' : r === 'costas' ? 'costas_inteiras' : REGIAO_DA_PARTE[r as LocalDeTatuagem][0];
  if (r === 'braco') return `no braço${ladoEm('biceps', lado)}`;
  if (r === 'peito') return 'no peito';
  if (r === 'costas') return 'nas costas';
  const R = REGIOES[reg];
  if (reg === 'dedos') return `nos dedos da mão${lado === 'e' ? ' esquerda' : lado === 'd' ? ' direita' : ''}`;
  if (reg === 'antebraco_externo') return `por fora do antebraço${ladoEm('antebraco', lado)}`;
  if (reg === 'manga') return `no braço${ladoEm('biceps', lado)} inteiro`;
  if (reg === 'perna_inteira') return `na perna${lado === 'e' ? ' esquerda' : lado === 'd' ? ' direita' : ''} inteira`;
  const em = R.plural ? (R.fem ? 'nas' : 'nos') : R.fem ? 'na' : 'no';
  return `${em} ${R.nome}${ladoEm(reg, lado)}`;
}
export const nomeDaTatuagem = (x: Pick<Tatuagem, 'desenho' | 'texto'>) => {
  const n = desenhoDeTatuagem(x.desenho)?.nome ?? 'Tatuagem';
  return x.texto ? `${n} “${x.texto}”` : n;
};

const nomeDaPessoa = (v: Vida, id?: string): string | undefined => (id ? v.pessoas[id]?.nome : undefined);

/** A frase do significado ("pela filha Ana"; "em homenagem a Antônio"). */
export function fraseDoSignificado(v: Vida, s?: Tatuagem['significado']): string {
  if (!s || s.tipo === 'estetica') return '';
  const nome = s.nome ?? nomeDaPessoa(v, s.pessoaId);
  const p = s.pessoaId ? v.pessoas[s.pessoaId] : undefined;
  switch (s.tipo) {
    case 'filho': return nome ? `por ${p?.genero === 'feminino' ? 'a filha' : 'o filho'}, ${nome}`.replace('por a ', 'pela ').replace('por o ', 'pelo ') : 'por um filho';
    case 'amor': return nome ? `por ${nome}` : 'por um amor';
    case 'familia': return nome ? `pela família — por ${nome}` : 'pela família';
    case 'homenagem': return nome ? `em homenagem a ${nome}` : 'uma homenagem';
    default: return NOME_SIGNIFICADO[s.tipo].toLowerCase();
  }
}

/* ------------------------------------------------------------------ tatuar */

function novoId(v: Vida): string {
  const lista = v.eu.tatuagens ?? [];
  let n = lista.length;
  while (lista.some(x => x.id === `tat-${v.t}-${n}`)) n++;
  return `tat-${v.t}-${n}`;
}

/** Faz a tatuagem (o pedido já conferido pela disponibilidade). Devolve o texto. */
export function tatuarPedido(v: Vida, p0: PedidoDeTatuagem, opcoes: { silencioso?: boolean; preco?: number } = {}): string {
  const p = resolverPedido(v, p0);
  if ('erro' in p) return p.erro;
  const d = desenhoDeTatuagem(p.desenho)!;
  pagar(v, opcoes.preco ?? precoDoPedido(v, p));
  const lista = (v.eu.tatuagens ??= []);
  const primeira = !lista.length;
  const id = novoId(v);
  const corPadrao: CorDaTatuagem = corPadraoDe(d);
  const cor = p.cor ?? corPadrao;
  const nomeSig = nomeDaPessoa(v, p.significado?.pessoaId);
  const sig = p.significado && p.significado.tipo !== 'estetica' ? { tipo: p.significado.tipo, ...(p.significado.pessoaId ? { pessoaId: p.significado.pessoaId } : {}), ...(nomeSig ? { nome: nomeSig } : {}) } : undefined;
  const aj = p.ajuste;
  const nova: Tatuagem = {
    id, desenho: p.desenho, local: REGIOES[p.regiao].parte, ...(p.lado ? { lado: p.lado } : {}), t: v.t, regiao: p.regiao,
    ...(p.tamanho !== d.tamanho ? { tamanho: p.tamanho } : {}),
    ...(aj.x || aj.y || aj.escala !== 1 || aj.rot || aj.espelhar ? { ajuste: aj } : {}),
    ...(cor !== corPadrao ? { cor } : {}),
    ...(p.tom && p.tom !== 'preto' && p.tom !== 'original' ? { tom: p.tom } : {}),
    ...(p.intensidade !== undefined && p.intensidade < 0.99 ? { intensidade: Math.max(0.6, Math.min(1, p.intensidade)) } : {}),
    ...(p.texto?.trim() ? { texto: p.texto.trim().slice(0, 28) } : {}),
    ...(sig ? { significado: sig } : {}),
    ...(p.cobre ? { cobre: p.cobre } : {}),
    ...(p.conjunto ? { conjunto: p.conjunto } : {})
  };
  const alvo = p.cobre ? lista.find(x => x.id === p.cobre) : undefined;
  if (alvo) alvo.coberta = { t: v.t, por: id };
  lista.push(nova);
  if (opcoes.silencioso) return '';
  const signif = fraseDoSignificado(v, nova.significado);
  const nome = nomeDaTatuagem(nova).replace(/^./, c => c.toLowerCase());
  const sessoes = tamanhoDe(nova) >= 3 ? ' — algumas sessões e muitas horas de cadeira' : '';
  const texto = alvo
    ? `Cobriu a ${nomeDaTatuagem(alvo).toLowerCase()} ${ondeEsta(p.regiao, p.lado)} com ${nome}${signif ? `, ${signif}` : ''}${sessoes}: da antiga, ninguém mais vê nada.`
    : `${primeira ? 'A primeira tatuagem' : 'Mais uma tatuagem'}: ${nome}, ${ondeEsta(p.regiao, p.lado)}${signif ? `, ${signif}` : ''}${sessoes}.`;
  const marcante = primeira || tamanhoDe(nova) >= 3 || !!nova.significado || !!alvo;
  escrever(v, {
    texto, relevancia: marcante ? 'biografia' : 'cotidiano', tema: 'escolha', tom: 'bom',
    ...(nova.significado?.pessoaId ? { pessoas: [nova.significado.pessoaId] } : {}),
    fato: { tipo: 'm_tatuagem', dados: { primeira: primeira ? 1 : 0, desenho: p.desenho, ...(nova.significado ? { significado: nova.significado.tipo } : {}), ...(alvo ? { cobertura: 1 } : {}) } }
  });
  return texto;
}

/** Compatível com o 11.5.1. */
export const tatuar = (v: Vida, desenho: string, local: LocalDeTatuagem, lado?: Lado) => tatuarPedido(v, { desenho, local, lado });

/* ------------------------------------------------------------------ retocar, tirar */

export function disponibilidadeRetocar(v: Vida, id: string): Veredito {
  const c = bloqueiosComuns(v);
  if (c) return c;
  const x = tatuagensDe(v).find(y => y.id === id);
  if (!x) return bloqueio('impossivel', 'Essa tatuagem não existe.');
  if (x.removida !== undefined) return bloqueio('incompativel', 'Essa está saindo no laser.');
  const anos = (v.t - ultimaTinta(x)) / 12;
  if (anos < ANOS_PARA_RETOQUE) return bloqueio('incompativel', `A tinta ainda está viva (${anos < 1 ? 'feita há menos de um ano' : `há ${Math.floor(anos)} ano${anos >= 2 ? 's' : ''}`}): o tatuador diz para voltar daqui a uns anos.`);
  return vereditoDePagar(v, precoDoRetoque(v, x), 'Custa') ?? PERMITIDO;
}

export function retocarTatuagem(v: Vida, id: string): string {
  const x = tatuagensDe(v).find(y => y.id === id)!;
  pagar(v, precoDoRetoque(v, x));
  const anos = Math.floor((v.t - ultimaTinta(x)) / 12);
  (x.retoques ??= []).push(v.t);
  const texto = `Retocou a ${nomeDaTatuagem(x).toLowerCase()} ${ondeEsta(regiaoDe(x), x.lado)}: ${anos} anos depois, o contorno firme e a cor de volta.`;
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'escolha', tom: 'bom' });
  return texto;
}

export function disponibilidadeRemover(v: Vida, id: string): Veredito {
  const x = tatuagensDe(v).find(y => y.id === id);
  if (!x) return bloqueio('impossivel', 'Essa tatuagem não existe.');
  if (x.removida !== undefined) return bloqueio('incompativel', 'O laser já está tirando essa.');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Não da prisão.');
  return vereditoDePagar(v, precoDaRemocao(v, x), 'Custa') ?? PERMITIDO;
}

export function removerTatuagem(v: Vida, id: string): string {
  const x = tatuagensDe(v).find(y => y.id === id)!;
  pagar(v, precoDaRemocao(v, x));
  x.removida = v.t;
  v.mente.estresse = Math.min(100, v.mente.estresse + (tamanhoDe(x) >= 3 ? 5 : 2));
  const meses = mesesDeLaser(x);
  const sig = x.significado ? ` (${fraseDoSignificado(v, x.significado)})` : '';
  const texto = `Começou a tirar a ${nomeDaTatuagem(x).toLowerCase()}${sig} ${ondeEsta(regiaoDe(x), x.lado)} no laser: ${meses >= 24 ? 'dois anos' : meses >= 18 ? 'um ano e meio' : 'um ano'} de sessões que ardem, e a tinta vai clareando${deixaSombra(x) ? ' — com tanta cor, pode ficar uma sombra leve' : ''}.`;
  escrever(v, { texto, relevancia: x.significado || tamanhoDe(x) >= 3 ? 'biografia' : 'cotidiano', tema: 'escolha', ...(x.significado?.pessoaId ? { pessoas: [x.significado.pessoaId] } : {}) });
  return texto;
}

/* ------------------------------------------------------------------ composições */

export interface PlanoDaComposicao {
  modelo: string;
  lado?: Lado;
  /** As peças novas (o que falta); as regiões ocupadas por tatuagens que já existem entram no conjunto. */
  novas: (PedidoDeTatuagem & { regiao: RegiaoDeTatuagem })[];
  existentes: Tatuagem[];
  preco: number;
  fundo: FundoDeComposicao;
}

/** O que o estúdio faria para a composição (o que falta, o que já está lá, o preço — o pacote sai com desconto). */
export function planoDaComposicao(v: Vida, modelo: string, lado?: Lado): PlanoDaComposicao | string {
  const m = modeloDeComposicao(modelo);
  if (!m) return 'Esse projeto não existe.';
  const comLado = COMPOSICAO_TEM_LADO[m.tipo];
  if (comLado && !lado) return 'Escolha o lado.';
  const regioes = REGIOES_DA_COMPOSICAO[m.tipo];
  const naPele = tatuagensDe(v);
  const doLado = (x: Tatuagem) => !comLado || !REGIOES[regiaoDe(x)].lados || x.lado === lado;
  for (const x of naPele) if (REGIOES[regiaoDe(x)].cobre && regioesCobertas(regiaoDe(x)).some(r => regioes.includes(r)) && doLado(x)) return 'Essa parte já tem uma peça inteira.';
  const existentes = naPele.filter(x => regioes.includes(regiaoDe(x)) && doLado(x) && x.removida === undefined && !x.conjunto);
  const novas: PlanoDaComposicao['novas'] = [];
  for (const pc of m.pecas) {
    const ladoDa = REGIOES[pc.regiao].lados ? pc.lado ?? lado : undefined;
    if (existentes.some(x => regiaoDe(x) === pc.regiao && (!REGIOES[pc.regiao].lados || x.lado === ladoDa))) continue;
    const d = desenhoDeTatuagem(pc.desenho)!;
    const l = lugarLivre(v, d, pc.regiao, ladoDa, pc.tamanho);
    if (!l) continue;
    const cor: CorDaTatuagem = d.colorida ? m.cor : m.cor === 'colorida' ? corPadraoDe(d) : m.cor;
    novas.push({ desenho: pc.desenho, regiao: pc.regiao, ...(ladoDa ? { lado: ladoDa } : {}), tamanho: pc.tamanho, ajuste: { x: l.x, y: l.y, escala: 1, rot: 0 }, cor });
  }
  if (!novas.length && existentes.length < 2) return 'Não sobra lugar livre para esse projeto.';
  const pecas = novas.reduce((s, p) => s + precoDoPedido(v, p), 0);
  const fundo = m.fundo === 'nenhum' ? 0 : arred(600 * regioes.length * custoLocal(v));
  return { modelo, ...(comLado ? { lado } : {}), novas, existentes, preco: arred(pecas * 0.85 + fundo), fundo: m.fundo };
}

export function disponibilidadeCompor(v: Vida, modelo: string, lado?: Lado): Veredito {
  const c = bloqueiosComuns(v);
  if (c) return c;
  const p = planoDaComposicao(v, modelo, lado);
  if (typeof p === 'string') return bloqueio(/lado|existe/.test(p) ? 'impossivel' : 'incompativel', p);
  return vereditoDePagar(v, p.preco, 'Custa') ?? PERMITIDO;
}

export function comporTatuagens(v: Vida, modelo: string, lado?: Lado): string {
  const p = planoDaComposicao(v, modelo, lado) as PlanoDaComposicao;
  const m = modeloDeComposicao(modelo)!;
  const comLado = COMPOSICAO_TEM_LADO[m.tipo];
  pagar(v, p.preco);
  const primeira = !(v.eu.tatuagens ?? []).length;
  const comp: ComposicaoDeTatuagens = { id: `comp-${v.t}-${(v.eu.composicoes ?? []).length}`, tipo: m.tipo, ...(comLado ? { lado } : {}), fundo: m.fundo, nome: m.nome, t: v.t };
  (v.eu.composicoes ??= []).push(comp);
  for (const x of p.existentes) x.conjunto = comp.id;
  for (const n of p.novas) tatuarPedido(v, { ...n, conjunto: comp.id }, { silencioso: true, preco: 0 });
  const sessoes = Math.max(2, p.novas.length * 2 + (m.fundo !== 'nenhum' ? 2 : 0));
  const onde = comLado ? ` ${m.tipo === 'perna' ? (lado === 'e' ? 'na perna esquerda' : 'na perna direita') : lado === 'e' ? 'no braço esquerdo' : 'no braço direito'}` : '';
  const n = p.novas.length, e = p.existentes.length;
  const texto = `${primeira ? 'A primeira tatuagem já foi um projeto' : 'Um projeto inteiro'}: ${NOME_COMPOSICAO[m.tipo].toLowerCase()} (${m.nome.toLowerCase()})${onde} — ${n ? `${n} desenho${n > 1 ? 's' : ''} novo${n > 1 ? 's' : ''}` : 'os desenhos que já tinha'}${e && n ? `, juntando ${e === 1 ? 'a que já estava lá' : `as ${e} que já estavam lá`}` : ''}${m.fundo !== 'nenhum' ? ', e o fundo ligando tudo' : ''}. ${sessoes} sessões ao longo de meses.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'escolha', tom: 'bom', fato: { tipo: 'm_tatuagem', dados: { primeira: primeira ? 1 : 0, desenho: modelo, composicao: 1 } } });
  return texto;
}

/* ------------------------------------------------------------------ a figura */

export interface TatuagemParaFigura {
  id: string; desenho: string; regiao: RegiaoDeTatuagem; lado?: Lado; tamanho: TamanhoDeTatuagem;
  ajuste: AjusteDaTatuagem;
  cor: CorDaTatuagem; tom?: string; intensidade: number; texto?: string;
  /** Anos desde a última tinta (o desbotar); a idade de quem carrega (a pele). */
  anos: number; idade: number;
  /** O quanto o laser já clareou (0..1); a sombra que ficou. */
  clareou: number; sombra?: boolean;
  conjunto?: string;
  /** Compatível: a parte grande. */
  local: LocalDeTatuagem;
}

/** Como a figura recebe as tatuagens: tudo o que a pele mostra agora (e as sombras do laser). */
export function tatuagensNaFigura(v: Vida): TatuagemParaFigura[] {
  const i = idade(v);
  const out: TatuagemParaFigura[] = [];
  for (const x of v.eu.tatuagens ?? []) {
    if (x.coberta) continue;
    const fim = laserTerminou(v, x);
    if (fim && !deixaSombra(x)) continue;
    const r = regiaoDe(x);
    out.push({
      id: x.id, desenho: x.desenho, regiao: r, local: REGIOES[r].parte, ...(x.lado ? { lado: x.lado } : {}), tamanho: tamanhoDe(x), ajuste: ajusteDe(x), cor: corDe(x),
      ...(x.tom ? { tom: x.tom } : {}), intensidade: x.intensidade ?? 1, ...(x.texto ? { texto: x.texto } : {}),
      anos: Math.max(0, (v.t - ultimaTinta(x)) / 12), idade: i,
      clareou: x.removida === undefined ? 0 : Math.min(1, (v.t - x.removida) / mesesDeLaser(x)), ...(fim ? { sombra: true } : {}),
      ...(x.conjunto ? { conjunto: x.conjunto } : {})
    });
  }
  return out;
}
/** As composições com tatuagem na pele (o fundo só aparece enquanto houver desenho do conjunto na pele). */
export const composicoesNaFigura = (v: Vida): ComposicaoDeTatuagens[] => (v.eu.composicoes ?? []).filter(c => c.fundo !== 'nenhum' && tatuagensDe(v).some(x => x.conjunto === c.id && x.removida === undefined));

/** O quanto a tinta já desbotou (0 nova .. 0.5 bem gasta) — a mesma conta da figura, para dizer "pede retoque". */
export function desgasteDaTinta(v: Vida, x: Tatuagem): number {
  const anos = (v.t - ultimaTinta(x)) / 12;
  return Math.min(0.5, anos * (corDe(x) === 'colorida' ? 0.016 : 0.011) + Math.max(0, idade(v) - 55) * 0.003);
}

/* ------------------------------------------------------------------ consequências */

/** As tatuagens com o nome ou a marca de um amor que acabou (a pessoa virou ex). */
export function tatuagensDeAmorPerdido(v: Vida): Tatuagem[] {
  return tatuagensDe(v).filter(x => {
    if (x.removida !== undefined || !x.significado?.pessoaId || x.significado.tipo !== 'amor') return false;
    const vin = v.vinculos[x.significado.pessoaId];
    return vin?.romance?.estagio === 'ex';
  });
}
/** Uma tatuagem sempre à vista (mãos, dedos, pescoço). */
export const temTatuagemVisivel = (v: Vida) => tatuagensDe(v).some(x => REGIOES[regiaoDe(x)].visivel && x.removida === undefined);

/* ------------------------------------------------------------------ saves antigos */

/**
 * VIDA 12.6 — os registros antigos (só a parte grande, sem posição) ganham a região e o lugar, na ordem em que foram
 * feitos: a primeira do braço vai para o bíceps, a segunda para o tríceps; as do antebraço se empilham ao longo dele;
 * o fechamento vira a peça do braço inteiro; o dragão e a águia, as costas e o peito inteiros. Nada é apagado. Idempotente.
 */
export function normalizarTatuagens(v: Vida): void {
  const lista = v.eu.tatuagens;
  if (!lista?.length || lista.every(x => x.regiao)) return;
  for (const x of [...lista].sort((a, b) => a.t - b.t)) {
    if (x.regiao) continue;
    const d = desenhoDeTatuagem(x.desenho);
    if (!d) { x.regiao = REGIAO_DA_PARTE[x.local]?.[0] ?? 'biceps'; continue; }
    if (d.tamanho === 4) { x.regiao = d.regioes![0]; continue; }
    const candidatas = REGIAO_DA_PARTE[x.local] ?? ['biceps'];
    let posto = false;
    for (const tam of [d.tamanho, ...[...d.tamanhos].filter(t => t < d.tamanho).reverse()] as TamanhoDeTatuagem[]) {
      for (const r of candidatas) {
        if (!regioesDoDesenho(d, tam).includes(r)) continue;
        const lado = REGIOES[r].lados ? (x.lado ?? 'd') : undefined;
        const l = lugarLivre(v, d, r, lado, tam);
        if (!l) continue;
        x.regiao = r;
        if (lado && !x.lado) x.lado = lado;
        if (tam !== d.tamanho) x.tamanho = tam;
        if (l.x || l.y) x.ajuste = { x: l.x, y: l.y, escala: 1, rot: 0 };
        posto = true;
        break;
      }
      if (posto) break;
    }
    // Não coube sem encostar (um save antigo muito cheio): fica na primeira região, no menor tamanho.
    if (!posto) { x.regiao = candidatas[0]; x.tamanho = d.tamanhos[0]; if (REGIOES[candidatas[0]].lados && !x.lado) x.lado = 'd'; }
    x.local = REGIOES[x.regiao ?? candidatas[0]].parte;
  }
}

/* ------------------------------------------------------------------ prévias (o estúdio) */

/** A prévia de um pedido como a figura desenha (nova, tinta fresca). Sem registro: nada muda na vida. */
export function previaDoPedido(v: Vida, p: PedidoDeTatuagem, id = 'previa'): TatuagemParaFigura | null {
  const r = resolverPedido(v, p);
  if ('erro' in r) return null;
  const d = desenhoDeTatuagem(r.desenho)!;
  return {
    id, desenho: r.desenho, regiao: r.regiao, local: REGIOES[r.regiao].parte, ...(r.lado ? { lado: r.lado } : {}), tamanho: r.tamanho, ajuste: r.ajuste,
    cor: r.cor ?? corPadraoDe(d), ...(r.tom ? { tom: r.tom } : {}), intensidade: r.intensidade ?? 1, ...(r.texto ? { texto: r.texto } : {}),
    anos: 0, idade: idade(v), clareou: 0, ...(r.conjunto ? { conjunto: r.conjunto } : {})
  };
}

/** A prévia de uma composição: os desenhos novos (com o conjunto) e o fundo. */
export function previaDaComposicao(v: Vida, modelo: string, lado?: Lado): { tatuagens: TatuagemParaFigura[]; composicao: ComposicaoDeTatuagens; plano: PlanoDaComposicao } | null {
  const plano = planoDaComposicao(v, modelo, lado);
  const m = modeloDeComposicao(modelo);
  if (typeof plano === 'string' || !m) return null;
  const composicao: ComposicaoDeTatuagens = { id: 'previa-comp', tipo: m.tipo, ...(COMPOSICAO_TEM_LADO[m.tipo] ? { lado } : {}), fundo: m.fundo, nome: m.nome, t: v.t };
  const tatuagens = plano.novas.map((n, k) => previaDoPedido(v, { ...n, conjunto: composicao.id }, `previa-${k}`)).filter((x): x is TatuagemParaFigura => !!x);
  const existentes = new Set(plano.existentes.map(x => x.id));
  const atuais = tatuagensNaFigura(v).map(t => (existentes.has(t.id) ? { ...t, conjunto: composicao.id } : t));
  return { tatuagens: [...atuais, ...tatuagens], composicao, plano };
}
