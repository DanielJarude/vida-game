/**
 * VIDA 20 — COMPRAR E ADMINISTRAR UM CLUBE.
 *
 * Todo clube em que a vida pode jogar (o catálogo de cada país carregado: `dados/clubes` e os perfis do mundo) está à
 * venda. O preço sai do que o clube é NESTA vida: a divisão em que está na liga do país (`sistemas/ligas`), o porte
 * (a torcida, as receitas), a forma recente e as dívidas — o comprador assume as dívidas; paga pelo resto.
 *
 * Uma simulação só: o clube comprado disputa a MESMA temporada da liga do país, jogada partida a partida
 * (`jogosDaLiga`); a diferença é que a força dele deixa de ser a do porte e passa a ser a do ELENCO que o dono montou
 * (registrada em `ligas.FORCA_DO_DONO`, por temporada — a temporada jogada não muda depois). Acesso, rebaixamento,
 * título e tabela são os da liga. Os outros clubes não têm elenco nominal: os jogadores do mercado são deste mundo e,
 * comprados, passam a existir num lugar só (o seu clube); vendidos, saem dele. Nenhum atleta em dois clubes.
 *
 * Abstrações de jogo (não são dados reais de nenhum clube): receitas por divisão e porte (ordem de grandeza do futebol
 * brasileiro de 2025–26: a elite fatura de ~R$ 150 mi a mais de R$ 1 bi; a Série B, dezenas de milhões; as de acesso e
 * os estaduais, poucos milhões), folha, valores de jogador e de obra. Ligas de outros países escalam pelo mercado
 * (as grandes ligas europeias faturam várias vezes mais).
 *
 * Conflito de interesses: quem joga ou treina um clube do mesmo país não compra outro (e, se a carreira o levar a um
 * rival do mesmo país, a federação exige a venda). Dono do clube em que joga: o contrato de atleta segue as regras de
 * sempre (nenhuma vaga de titular comprada, nenhum salário escolhido pelo dono).
 */
import { clamp, rngDe, type Rng } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { pagar } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import { clubePorNome, clubesDoPais, oClube, type Clube } from '../../dados/clubes';
import { paisDaCidade } from '../../dados/lugares';
import { paisesVivenciaveis } from '../../mundo/registro';
import { divisaoDoClube, FORCA_DO_DONO, formaNaLiga, ligaDe, temporadaCorrente, ultimaTemporadaDoPais } from '../../sistemas/ligas';
import { registrarMotivoDoNome } from '../../sistemas/notoriedade';
import { sortearNome, sortearSobrenome } from '../../dados/nomes';
import type { Clube20, Jogador20, Setor20 } from '../../dados20/tipos20';

export type { Clube20, Jogador20 };

/* ------------------------------------------------------------------ a régua */

/** A força na liga (a mesma régua de `ligas.forcaNaLiga`: regional 2,2 · tradicional 3,4 · grande 4,5) ↔ a média do elenco. */
// Acima de um elenco de elite grande (média 76), cada ponto pesa menos: o melhor elenco do país ganha mais, não sempre.
export const forcaDaMedia = (media: number) => (media <= 76 ? 1.5 + (media - 55) / 7 : 4.5 + (media - 76) / 18);
export const mediaDaForca = (f: number) => (f <= 4.5 ? 55 + (f - 1.5) * 7 : 76 + (f - 4.5) * 18);
const FORCA_PORTE: Record<Clube['porte'], number> = { grande: 4.5, tradicional: 3.4, regional: 2.2 };
/** O mercado do país (as ligas grandes faturam várias vezes mais; calibração de jogo). */
const MERCADO: Record<string, number> = { GB: 5, ES: 3.2, DE: 3.2, IT: 3, FR: 2.4, PT: 1.2, NL: 1.4, US: 2.2, MX: 1.2, AR: 0.6, JP: 1.3, SA: 2 };
const mercado = (pais: string) => MERCADO[pais] ?? 0.8;
const RECEITA_DIVISAO = [0, 3e6, 12e6, 50e6, 130e6];
const RECEITA_PORTE: Record<Clube['porte'], number> = { grande: 2.6, tradicional: 1.4, regional: 1 };
const TORCIDA_PORTE: Record<Clube['porte'], number> = { grande: 88, tradicional: 58, regional: 24 };

/** A receita de um ano: a divisão (cotas de TV), a torcida (bilheteria, sócio, camisa) com o estádio, a reputação. */
export function receitaDoAno(divisao: number, torcida: number, estadio: number, reputacao: number, pais: string): number {
  const base = RECEITA_DIVISAO[clamp(divisao, 1, 4)];
  return Math.round(base * (0.55 + torcida / 90) * (0.85 + estadio * 0.07) * (0.85 + reputacao / 300) * mercado(pais) / 1e5) * 1e5;
}

export const valorDoJogador = (j: Jogador20, ano: number): number => {
  const i = ano - anoDe(j.tNasc);
  const idadeF = i <= 21 ? 1.4 : i <= 25 ? 1.25 : i <= 29 ? 1 : i <= 32 ? 0.55 : 0.2;
  const pot = Math.max(0, j.potencial - j.forca) * (i <= 23 ? 0.06 : 0.01);
  return Math.round(Math.pow(1.13, j.forca - 50) * 400000 * idadeF * (1 + pot) / 10000) * 10000;
};

/* ------------------------------------------------------------------ comprar */

export interface ClubeAVenda { nome: string; pais: string; cidade: string; porte: Clube['porte']; divisao: number; receita: number; divida: number; valor: number; preco: number }

const porteDe = (nome: string, pais: string): Clube['porte'] => clubePorNome(nome, pais)?.porte ?? 'regional';
/** O tamanho da torcida de cada clube (estável, pelo nome — abstração de jogo, não pesquisa de torcida): o porte ± um pouco. */
const torcidaDe = (nome: string, porte: Clube['porte']) => { let h = 0; for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return clamp(Math.round(TORCIDA_PORTE[porte] * (0.8 + (h % 1000) / 2500))); };

/** O que um clube vale e custa agora (a divisão, a forma e a dívida desta vida). */
export function avaliarClube(v: Vida, nome: string, pais: string): ClubeAVenda | undefined {
  const c = clubePorNome(nome, pais);
  if (!c) return undefined;
  const div = divisaoDoClube(v, nome, pais);
  const porte = c.porte;
  const receita = receitaDoAno(div, torcidaDe(nome, porte), porte === 'grande' ? 4 : porte === 'tradicional' ? 3 : 2, 50 + formaNaLiga(v, pais, nome) * 30, pais) * RECEITA_PORTE[porte];
  const r = rngDe(v.id, 'clube20_divida', pais, nome);
  const divida = Math.round(receita * (0.25 + r.next() * 0.9) / 1e5) * 1e5;
  const valor = Math.round(receita * 1.6 / 1e5) * 1e5;
  const preco = Math.max(Math.round(valor * 0.3 / 1e5) * 1e5, Math.round((valor - divida) / 1e5) * 1e5);
  return { nome, pais, cidade: c.cidade, porte, divisao: div, receita, divida, valor, preco };
}

/** Todos os clubes à venda: os de cada país do mundo carregado (os mesmos em que se pode jogar). */
export function clubesAVenda(v: Vida, pais?: string): ClubeAVenda[] {
  const paises = pais ? [pais] : paisesVivenciaveis().map(p => p.id);
  return paises.flatMap(p => clubesDoPais(p).map(c => avaliarClube(v, c.nome, p)).filter((x): x is ClubeAVenda => !!x));
}

/** O conflito de interesses de comprar este clube (a carreira de atleta ou de técnico noutro clube do mesmo país). */
export function conflitoDeInteresses(v: Vida, nome: string, pais: string): string | undefined {
  const e = v.caminhos.esporte;
  if (e && e.fase === 'profissional' && e.modalidade === 'futebol' && paisDaCidade(e.municipioId) === pais && e.clube !== nome)
    return `Você joga ${e.clube.startsWith('Seleção') ? 'por outra equipe' : `no ${e.clube}`}: o regulamento proíbe ser dono de outro clube da mesma liga.`;
  const ps = v.caminhos.tecnico?.passagens ?? [];
  const p = ps[ps.length - 1];
  if (p && p.ate === undefined && !p.selecao && paisDaCidade(p.municipioId) === pais && p.clube !== nome) return `Você comanda o ${p.clube}: treinar um clube e ser dono de outro da mesma liga é conflito de interesses.`;
  return undefined;
}

export type OqueClube20 =
  | { op: 'comprar'; nome: string; pais: string; financiar?: boolean }
  | { op: 'vender_clube' }
  | { op: 'aportar'; valor: number }
  | { op: 'dividendos' }
  | { op: 'contratar'; id: string }
  | { op: 'vender'; id: string }
  | { op: 'renovar'; id: string }
  | { op: 'promover'; id: string }
  | { op: 'dispensar'; id: string }
  | { op: 'obra'; qual: 'estadio' | 'ct' | 'base' }
  | { op: 'base'; nivel: 0 | 1 | 2 }
  | { op: 'objetivo'; qual: NonNullable<Clube20['objetivo']> };

export const custoDaObra = (c: Clube20, qual: 'estadio' | 'ct' | 'base') => Math.round((qual === 'estadio' ? 40e6 : qual === 'ct' ? 15e6 : 6e6) * Math.pow(1.9, c[qual] - 1) * mercado(c.pais) / 1e5) * 1e5;

export function disponibilidadeClube20(v: Vida, o: OqueClube20): Veredito {
  if (idade(v) < 18) return bloqueio('requisito', 'Só quem é maior de idade compra um clube.');
  const c = v.clube20;
  if (o.op === 'comprar') {
    if (c) return bloqueio('incompativel', `Você já é dono ${oClube(c.nome).replace(/^o /, 'do ').replace(/^a /, 'da ')}: venda antes de comprar outro.`);
    const x = avaliarClube(v, o.nome, o.pais);
    if (!x) return bloqueio('impossivel', 'Clube não encontrado.');
    const conf = conflitoDeInteresses(v, o.nome, o.pais);
    if (conf) return bloqueio('incompativel', conf);
    const entrada = o.financiar ? Math.round(x.preco * 0.4) : x.preco;
    if (v.financas.conta < entrada) return bloqueio('requisito', `${o.financiar ? 'A entrada' : 'A compra'} custa ${fmt(entrada)} em dinheiro (patrimônio não é liquidez).`);
    if (o.financiar && x.preco * 0.6 > Math.max(0, v.financas.conta) * 3 + 1) return bloqueio('requisito', 'O banco não financia uma compra tão maior do que o que você tem.');
    return PERMITIDO;
  }
  if (!c) return bloqueio('impossivel', 'Você não é dono de clube.');
  if (c.conflito && o.op !== 'vender_clube') return bloqueio('incompativel', c.conflito);
  const ano = anoDe(v.t);
  switch (o.op) {
    case 'vender_clube': return PERMITIDO;
    case 'aportar': return o.valor > 0 && v.financas.conta >= o.valor ? PERMITIDO : bloqueio('requisito', 'Não há esse dinheiro na conta.');
    case 'dividendos': return dividendosPossiveis(c) > 0 ? PERMITIDO : bloqueio('requisito', 'O caixa do clube não tem sobra (com dívida ou abaixo da reserva de um terço da receita).');
    case 'contratar': {
      const m = mercadoDoAno(v).find(j => j.id === o.id);
      if (!m) return bloqueio('impossivel', 'Esse jogador já não está no mercado.');
      if (c.elenco.length >= 30) return bloqueio('incompativel', 'O elenco está cheio (30).');
      // Fair play financeiro (como nas ligas que o adotam): a folha não passa de 70% da receita do último ano.
      const rec = c.historico.slice(-1)[0]?.receita ?? receitaDoAno(ligaDe(v, c.pais).div[c.nome] ?? 1, c.torcida, c.estadio, c.reputacao, c.pais);
      if (c.elenco.reduce((s, j) => s + j.salario, 0) + m.salario > rec * 0.7) return bloqueio('incompativel', 'A folha passaria de 70% da receita do clube (fair play financeiro).');
      return c.caixa >= m.preco ? PERMITIDO : bloqueio('requisito', `O clube não tem ${fmt(m.preco)} em caixa (aporte ou venda alguém).`);
    }
    case 'vender': case 'dispensar': return c.elenco.some(j => j.id === o.id) ? (c.elenco.length <= 16 ? bloqueio('incompativel', 'O elenco ficaria curto demais (mínimo 16).') : PERMITIDO) : bloqueio('impossivel', '');
    case 'renovar': { const j = c.elenco.find(x => x.id === o.id); return j ? (j.contratoAte > ano + 1 ? bloqueio('incompativel', 'O contrato ainda vai longe.') : PERMITIDO) : bloqueio('impossivel', ''); }
    case 'promover': return c.juniores.some(j => j.id === o.id) ? PERMITIDO : bloqueio('impossivel', '');
    case 'obra': {
      if (c.obra) return bloqueio('incompativel', 'Já há uma obra em andamento.');
      if (c[o.qual] >= 5) return bloqueio('incompativel', 'Já é de ponta.');
      const custo = custoDaObra(c, o.qual);
      return c.caixa >= custo ? PERMITIDO : bloqueio('requisito', `A obra custa ${fmt(custo)}; o caixa do clube não tem.`);
    }
    case 'base': case 'objetivo': return PERMITIDO;
  }
}

export function executarClube20(v: Vida, o: OqueClube20): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  const ano = anoDe(v.t);
  if (o.op === 'comprar') return comprar(v, o.nome, o.pais, !!o.financiar);
  const c = v.clube20!;
  switch (o.op) {
    case 'vender_clube': {
      const valor = Math.max(0, Math.round((c.valor - c.divida) / 1e5) * 1e5);
      v.financas.conta += valor;
      lancar(v, `Venda do clube (${c.nome})`, 'renda', valor);
      escrever(v, { texto: `Vendeu ${oClube(c.nome)} depois de ${Math.max(1, ano - anoDe(c.desde))} ano(s) como dono: ${fmt(valor)} pela sua parte, com as dívidas do clube passando ao comprador.`, relevancia: 'marco', tema: 'dinheiro', escolha: true });
      v.clube20 = undefined;
      return { texto: `Clube vendido por ${fmt(valor)}.`, tom: 'neutro' };
    }
    case 'dividendos': {
      const valor = dividendosPossiveis(c);
      c.caixa -= valor; v.financas.conta += valor; lancar(v, `Dividendos do clube (${c.nome})`, 'renda', valor);
      c.reputacao = clamp(c.reputacao - 2);
      escrever(v, { texto: `Tirou ${fmt(valor)} do caixa ${oClube(c.nome).replace(/^o /, 'do ').replace(/^a /, 'da ')} em dividendos. A torcida não gostou.`, relevancia: 'biografia', tema: 'dinheiro', escolha: true });
      return { texto: `${fmt(valor)} em dividendos.`, tom: 'neutro' };
    }
    case 'aportar': {
      pagar(v, o.valor); lancar(v, `Aporte no clube (${c.nome})`, 'despesa', -o.valor);
      c.caixa += o.valor; c.valor += Math.round(o.valor * 0.5);
      return { texto: `Aportou ${fmt(o.valor)} no caixa do clube.`, tom: 'neutro' };
    }
    case 'contratar': {
      const m = mercadoDoAno(v).find(j => j.id === o.id)!;
      c.caixa -= m.preco;
      c.comprados.push(m.id);
      if (c.comprados.length > 200) c.comprados.splice(0, c.comprados.length - 200);
      const { preco: _p, clube: de, ...j } = m; void _p;
      c.elenco.push(j);
      escrever(v, { texto: `${oClube(c.nome).replace(/^./, x => x.toUpperCase())} contratou ${j.nome} (${j.pos}, ${ano - anoDe(j.tNasc)} anos), que estava no ${de}, por ${fmt(m.preco)}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${j.nome} contratado.`, tom: 'bom' };
    }
    case 'vender': {
      const i = c.elenco.findIndex(j => j.id === o.id);
      const j = c.elenco[i];
      const r = rngDe(v.id, 'clube20_venda', j.id, ano);
      const valor = Math.round(valorDoJogador(j, ano) * (0.85 + r.next() * 0.35) / 10000) * 10000;
      const para = compradorDe(c, r);
      c.elenco.splice(i, 1);
      c.caixa += valor;
      c.vendas.unshift({ nome: j.nome, para, valor, ano });
      if (c.vendas.length > 20) c.vendas.length = 20;
      escrever(v, { texto: `Vendeu ${j.nome} para ${para.startsWith('um ') ? para : `o ${para}`} por ${fmt(valor)}${j.daBase ? ' — formado na base do clube' : ''}.`, relevancia: j.daBase && valor > 20e6 ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${j.nome} vendido por ${fmt(valor)}.`, tom: 'neutro' };
    }
    case 'dispensar': { const i = c.elenco.findIndex(j => j.id === o.id); const j = c.elenco.splice(i, 1)[0]; const multa = Math.round(j.salario * Math.max(0, j.contratoAte - ano) * 0.5); c.caixa -= multa; return { texto: `${j.nome} foi dispensado${multa ? ` (rescisão de ${fmt(multa)})` : ''}.`, tom: 'neutro' }; }
    case 'renovar': {
      const j = c.elenco.find(x => x.id === o.id)!;
      const i = ano - anoDe(j.tNasc);
      j.contratoAte = ano + (i >= 31 ? 1 : 3);
      j.salario = salarioDe(j.forca, c.pais);
      return { texto: `${j.nome} renovou até ${j.contratoAte} (${fmt(j.salario)} por ano).`, tom: 'bom' };
    }
    case 'promover': {
      const i = c.juniores.findIndex(j => j.id === o.id);
      const j = c.juniores.splice(i, 1)[0];
      j.salario = salarioDe(j.forca, c.pais) * 0.6; j.contratoAte = ano + 3;
      c.elenco.push(j);
      return { texto: `${j.nome} subiu da base para o elenco principal.`, tom: 'bom' };
    }
    case 'obra': {
      const custo = custoDaObra(c, o.qual);
      c.caixa -= custo;
      c.obra = { qual: o.qual, ate: ano + (o.qual === 'estadio' ? 2 : 1) };
      escrever(v, { texto: `Começou a obra ${o.qual === 'estadio' ? 'do estádio' : o.qual === 'ct' ? 'do centro de treinamento' : 'das categorias de base'} ${oClube(c.nome).replace(/^o /, 'do ').replace(/^a /, 'da ')}: ${fmt(custo)}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return { texto: 'Obra contratada.', tom: 'bom' };
    }
    case 'base': c.investimentoBase = o.nivel; return { texto: o.nivel === 2 ? 'A base recebe investimento forte: mais olheiros, mais estrutura.' : o.nivel === 1 ? 'A base recebe o investimento de sempre.' : 'A base ficou com o mínimo.', tom: 'neutro' };
    case 'objetivo': c.objetivo = o.qual; return { texto: 'Objetivo da temporada definido.', tom: 'neutro' };
  }
}

function comprar(v: Vida, nome: string, pais: string, financiar: boolean): { texto: string; tom: 'bom' } {
  const x = avaliarClube(v, nome, pais)!;
  const ano = anoDe(v.t);
  const entrada = financiar ? Math.round(x.preco * 0.4) : x.preco;
  pagar(v, entrada);
  lancar(v, `Compra do clube (${nome})`, 'despesa', -entrada);
  if (financiar) {
    const saldo = x.preco - entrada, prazo = 120, j = 0.011;
    const parcela = Math.round(saldo * j / (1 - Math.pow(1 + j, -prazo)));
    v.financas.dividas.push({ id: `clube20_${v.t}`, tipo: 'emprestimo', saldo, jurosMes: j, parcela, descricao: `Financiamento da compra ${oClube(nome).replace(/^o /, 'do ').replace(/^a /, 'da ')}`, tInicio: v.t, prazo });
  }
  const r = rngDe(v.id, 'clube20_compra', pais, nome);
  const porte = x.porte;
  const media = mediaDaForca(FORCA_PORTE[porte] + formaNaLiga(v, pais, nome));
  const c: Clube20 = {
    nome, pais, cidade: x.cidade, desde: v.t, preco: x.preco, caixa: Math.round(x.receita * 0.05 / 1e5) * 1e5, divida: x.divida,
    torcida: torcidaDe(nome, porte), reputacao: porte === 'grande' ? 75 : porte === 'tradicional' ? 55 : 30,
    estadio: porte === 'grande' ? 4 : porte === 'tradicional' ? 3 : 2, ct: porte === 'grande' ? 4 : porte === 'tradicional' ? 2 : 1, base: porte === 'grande' ? 3 : 2,
    investimentoBase: 1, elenco: [], juniores: [], historico: [], forcaPorAno: {}, seq: 0, comprados: [], vendas: [], valor: x.valor
  };
  const pos: Setor20[] = ['GOL', 'GOL', 'GOL', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA', 'ATA', 'ATA', 'ATA'];
  for (const p of pos) c.elenco.push(novoJogador(v, c, r, p, media + r.normal() * 5, 18 + Math.floor(r.next() * 15)));
  for (let k = 0; k < 6; k++) c.juniores.push(novoJovem(v, c, r));
  c.forcaPorAno[temporadaCorrente(v)] = forcaDaMedia(media);
  v.clube20 = c;
  escrever(v, { texto: `Comprou ${oClube(nome)} (${x.divisao === 4 ? 'elite' : `${x.divisao}ª força`} do país) por ${fmt(x.preco)}${financiar ? `, ${fmt(entrada)} de entrada e o resto financiado` : ''}. As dívidas do clube (${fmt(x.divida)}) vieram junto.`, relevancia: 'marco', tema: 'dinheiro', tom: 'bom', escolha: true });
  void ano;
  return { texto: `Agora você é dono ${oClube(nome).replace(/^o /, 'do ').replace(/^a /, 'da ')}.`, tom: 'bom' };
}

/** O que dá para tirar do clube: só sem dívida e acima de uma reserva de um terço da receita do último ano. */
export function dividendosPossiveis(c: Clube20): number {
  if (c.divida > 0) return 0;
  const rec = c.historico.slice(-1)[0]?.receita ?? 0;
  return Math.max(0, Math.round((c.caixa - rec / 3) / 1e5) * 1e5);
}

/* ------------------------------------------------------------------ jogadores */

const salarioDe = (forca: number, pais: string) => Math.round(Math.pow(1.17, forca - 50) * 30000 * mercado(pais) / 1000) * 1000;

function novoJogador(v: Vida, c: Clube20, r: Rng, pos: Setor20, forca: number, idadeJ: number): Jogador20 {
  const ano = anoDe(v.t);
  const tNasc = (ano - idadeJ) * 12 + Math.floor(r.next() * 12);
  const f = clamp(Math.round(forca), 35, 94);
  const pot = clamp(Math.round(f + Math.max(0, 27 - idadeJ) * (0.5 + r.next())), f, Math.max(f, r.chance(0.05) ? 93 : 89));
  c.seq += 1;
  return { id: `c${c.seq}`, nome: `${sortearNome(r, 'masculino', ano - idadeJ, c.pais)} ${sortearSobrenome(r, c.pais)}`, tNasc, pos, forca: f, potencial: pot, salario: salarioDe(f, c.pais), contratoAte: ano + 1 + Math.floor(r.next() * 3) };
}

function novoJovem(v: Vida, c: Clube20, r: Rng): Jogador20 {
  const media = mediaDoElenco(c);
  const j = novoJogador(v, c, r, r.pick(['GOL', 'DEF', 'DEF', 'MEI', 'MEI', 'ATA'] as Setor20[]), media - 16 + r.normal() * 5, 15 + Math.floor(r.next() * 3));
  // A base boa revela mais: o potencial sobe com a estrutura e o investimento (a joia rara existe em qualquer base).
  j.potencial = clamp(Math.round(j.forca + 8 + c.base * 2 + c.investimentoBase * 2 + Math.max(0, r.normal()) * 8), j.forca, r.chance(0.04) ? 94 : 88);
  j.daBase = true; j.salario = Math.round(j.salario * 0.2);
  return j;
}

/** A média dos 18 melhores (onze titulares e o banco que joga): o que entra em campo. */
export function mediaDoElenco(c: Clube20): number {
  const xs = c.elenco.map(j => j.forca).sort((a, b) => b - a).slice(0, 18);
  if (!xs.length) return 40;
  // Um elenco sem goleiro ou sem ataque não joga como a média diz.
  const falta = (['GOL', 'DEF', 'MEI', 'ATA'] as Setor20[]).filter(p => !c.elenco.some(j => j.pos === p)).length;
  return xs.reduce((s, x) => s + x, 0) / xs.length - falta * 4;
}

/** O mercado do ano: jogadores de outros clubes do país, à venda (estáveis no ano; quem foi comprado sai). */
export function mercadoDoAno(v: Vida): (Jogador20 & { preco: number; clube: string })[] {
  const c = v.clube20;
  if (!c) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'clube20_mercado', c.pais, ano);
  const outros = clubesDoPais(c.pais).filter(x => x.nome !== c.nome);
  const media = mediaDoElenco(c);
  // Quem aceita vir depende do clube: a divisão e o nome dele limitam o nível de quem está disponível.
  const div = ligaDe(v, c.pais).div[c.nome] ?? 1;
  // (os melhores do país saem cedo para as ligas mais ricas: a elite brasileira compra até ~80; as ligas grandes, mais)
  const teto = 50 + div * 5 + c.reputacao / 12 + Math.min(8, (mercado(c.pais) - 1) * 3);
  const lista: (Jogador20 & { preco: number; clube: string })[] = [];
  const fake: Clube20 = { ...c, seq: 0 };
  for (let k = 0; k < 14; k++) {
    const idadeJ = 18 + Math.floor(r.next() * 15);
    const j = novoJogador(v, fake, r, r.pick(['GOL', 'DEF', 'DEF', 'MEI', 'MEI', 'ATA', 'ATA'] as Setor20[]), Math.min(teto + r.normal() * 2, media + (k - 8) * 1.5 + r.normal() * 3), idadeJ);
    j.id = `m${ano}_${k}`;
    j.contratoAte = ano + 2 + Math.floor(r.next() * 3);
    const de = outros.length ? outros[Math.floor(r.next() * outros.length)].nome : 'um clube do exterior';
    if (c.comprados.includes(j.id)) continue;
    lista.push({ ...j, preco: Math.round(valorDoJogador(j, ano) * 1.15 / 10000) * 10000, clube: de });
  }
  return lista;
}

function compradorDe(c: Clube20, r: Rng): string {
  const outros = clubesDoPais(c.pais).filter(x => x.nome !== c.nome && x.porte !== 'regional');
  return r.chance(0.3) || !outros.length ? r.pick(['um clube da Europa', 'um clube da Arábia Saudita', 'um clube do Japão', 'um clube dos Estados Unidos']) : outros[Math.floor(r.next() * outros.length)].nome;
}

/* ------------------------------------------------------------------ o ano do clube */

FORCA_DO_DONO.f = (v, pais, ano, clube) => {
  const c = v.clube20;
  if (!c || c.nome !== clube || c.pais !== pais) return undefined;
  const anos = Object.keys(c.forcaPorAno).map(Number).filter(a => a <= ano).sort((a, b) => b - a);
  return anos.length ? c.forcaPorAno[anos[0]] : undefined;
};

export function processarClube20(v: Vida): void {
  const c = v.clube20;
  if (!c || v.morte) return;
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'clube20_ano', ano);
  c.conflito = conflitoDeInteresses(v, c.nome, c.pais);
  if (c.conflito) escrever(v, { texto: `A federação notificou: ${c.conflito} O clube precisa ser vendido.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  // 1. A temporada que fechou: a liga do país joga (a mesma simulação de todos), e o clube lê onde terminou.
  const liga = ligaDe(v, c.pais);
  const u = ultimaTemporadaDoPais(v, c.pais);
  const jaContada = c.historico.some(h => h.ano === u?.ano);
  let posicao: number | undefined, divJogada = liga.div[c.nome] ?? 1;
  if (u && !jaContada && anoDe(c.desde) <= u.ano) {
    for (const n of [4, 3, 2] as const) { const k = u.tabelas?.[n]?.findIndex(l => l[0] === c.nome) ?? -1; if (k >= 0) { posicao = k + 1; divJogada = n; } }
    if (posicao === undefined && u.subiram.includes(c.nome)) divJogada = (liga.div[c.nome] ?? 2) - 1;
    const titulo = posicao === 1 && u.campeoes[divJogada as 1 | 2 | 3 | 4] === c.nome;
    const acesso = u.subiram.includes(c.nome), queda = u.cairam.includes(c.nome);
    // 2. O dinheiro do ano.
    const receitaBase = receitaDoAno(divJogada, c.torcida, c.estadio, c.reputacao, c.pais) * RECEITA_PORTE[porteDe(c.nome, c.pais)];
    const premio = posicao ? Math.round(receitaBase * Math.max(0, (21 - posicao) / 20) * 0.15) : 0;
    const receita = Math.round((receitaBase + premio) / 1e5) * 1e5;
    const folha = c.elenco.reduce((s, j) => s + j.salario, 0) + c.juniores.reduce((s, j) => s + j.salario, 0);
    // Além da folha: a operação (comissão, viagens, impostos, o futebol feminino e o social), ~40% da receita.
    const despesa = Math.round(folha + receita * 0.5 + (c.estadio + c.ct) * receita * 0.02 + receita * [0.01, 0.03, 0.06][c.investimentoBase] + c.divida * 0.11);
    c.caixa += receita - despesa;
    if (c.caixa < 0) { c.divida += -c.caixa; c.caixa = 0; }
    else if (c.divida > 0 && c.caixa > receita * 0.2) { const amort = Math.min(c.divida, Math.round((c.caixa - receita * 0.2) * 0.5)); c.divida -= amort; c.caixa -= amort; }
    // 3. A torcida e o nome andam com o resultado.
    const alvoTorcida = TORCIDA_PORTE[porteDe(c.nome, c.pais)] + (divJogada - 3) * 6 + (titulo ? 8 : 0);
    c.torcida = clamp(Math.round(c.torcida * 0.85 + alvoTorcida * 0.15 + (acesso ? 3 : 0) - (queda ? 4 : 0)));
    c.reputacao = clamp(Math.round(c.reputacao + (titulo ? 8 : 0) + (acesso ? 5 : 0) - (queda ? 7 : 0) + (posicao ? (10 - posicao) * 0.4 : 0)));
    c.historico.push({ ano: u.ano, divisao: divJogada, posicao, receita, despesa, caixa: c.caixa, forca: Math.round(forcaDaMedia(mediaDoElenco(c)) * 10) / 10, ...(titulo ? { titulo } : {}), ...(acesso ? { acesso } : {}), ...(queda ? { queda } : {}) });
    if (c.historico.length > 40) c.historico.splice(0, c.historico.length - 40);
    const nomeDiv = ['', 'o estadual', 'as divisões de acesso', 'a segunda divisão', 'a elite'][divJogada];
    const frase = titulo ? `Campeão! ${oClube(c.nome).replace(/^./, x => x.toUpperCase())}, o seu clube, venceu ${nomeDiv} de ${u.ano}.` : acesso ? `${oClube(c.nome).replace(/^./, x => x.toUpperCase())} subiu de divisão em ${u.ano}.` : queda ? `${oClube(c.nome).replace(/^./, x => x.toUpperCase())} foi rebaixado em ${u.ano}. A torcida protestou na porta do clube.` : `${oClube(c.nome).replace(/^./, x => x.toUpperCase())} terminou ${posicao ? `em ${posicao}º` : 'a temporada'} n${nomeDiv.slice(0, 1) === 'a' ? 'a' : 'o'} ${nomeDiv.replace(/^(o|a|as) /, '')} de ${u.ano}. Receita de ${fmt(receita)}, despesa de ${fmt(despesa)}.`;
    escrever(v, { texto: frase, relevancia: titulo || acesso || queda ? 'marco' : 'cotidiano', tema: 'trabalho', tom: titulo || acesso ? 'bom' : queda ? 'ruim' : undefined });
    // O objetivo da temporada cobrado: a torcida sabe o que foi prometido.
    if (c.objetivo === 'titulo' && !titulo || c.objetivo === 'acesso' && !acesso && !titulo || c.objetivo === 'permanencia' && queda) c.reputacao = clamp(c.reputacao - 3);
  }
  // A diretoria: a folha que não cabe na receita encolhe (sai quem ganha mais); a sobra grande de caixa vira reforço.
  const recAno = c.historico.slice(-1)[0]?.receita ?? 0;
  if (recAno > 0) {
    const ordem = [...c.elenco].sort((a, b) => b.salario - a.salario);
    let folhaAgora = c.elenco.reduce((x, j) => x + j.salario, 0);
    for (const j of ordem) { if (folhaAgora <= recAno * 0.55 || c.elenco.length <= 18) break; c.elenco.splice(c.elenco.indexOf(j), 1); folhaAgora -= j.salario; }
    if (c.caixa > recAno * 1.2 && !c.conflito) {
      for (const m of mercadoDoAno(v).sort((a, b) => b.forca - a.forca).slice(0, 2)) {
        if (c.caixa - m.preco < recAno * 0.6 || c.elenco.length >= 28) break;
        c.caixa -= m.preco; c.comprados.push(m.id);
        const { preco: _p, clube: _c, ...j } = m; void _p; void _c;
        c.elenco.push(j);
      }
    }
  }
  // O assédio de fora: quem passa muito do nível que o clube consegue segurar recebe proposta de uma liga mais rica — e,
  // na maioria das vezes, vai (é o que equilibra as contas de quase todo clube). A venda entra no caixa.
  {
    const div = liga.div[c.nome] ?? 1;
    const segura = 50 + div * 5 + c.reputacao / 12 + Math.min(8, (mercado(c.pais) - 1) * 3) + 2;
    for (const j of [...c.elenco].filter(x => x.forca > segura).sort((a, b) => b.forca - a.forca).slice(0, 3)) {
      if (!r.chance(0.55) || c.elenco.length <= 18) continue;
      const valor = Math.round(valorDoJogador(j, ano) * (1 + r.next() * 0.3) / 10000) * 10000;
      const para = compradorDe(c, r);
      c.elenco.splice(c.elenco.indexOf(j), 1); c.caixa += valor;
      c.vendas.unshift({ nome: j.nome, para, valor, ano }); if (c.vendas.length > 20) c.vendas.length = 20;
      escrever(v, { texto: `${j.nome} foi vendido para ${para.startsWith('um ') ? para : `o ${para}`} por ${fmt(valor)}: a proposta de fora foi grande demais para recusar.`, relevancia: valor > 30e6 ? 'biografia' : 'cotidiano', tema: 'trabalho' });
    }
  }
  // 4. Os jogadores: um ano mais velhos, evoluem (o CT ajuda os jovens), caem com a idade, saem no fim do contrato.
  const evoluir = (j: Jogador20) => {
    const i = ano - anoDe(j.tNasc);
    if (i <= 23) j.forca = clamp(Math.round(j.forca + Math.max(0, (j.potencial - j.forca) * (0.12 + c.ct * 0.03)) + r.normal() * 1.5), 30, j.potencial);
    else if (i <= 29) j.forca = clamp(Math.round(j.forca + Math.max(0, (j.potencial - j.forca) * 0.08) + r.normal()), 30, 97);
    else j.forca = clamp(Math.round(j.forca - (i - 29) * 0.9 + r.normal()), 30, 97);
    // o que a carreira mostrou vira o novo teto (ninguém fica acima do próprio potencial)
    if (j.forca > j.potencial) j.potencial = j.forca;
  };
  c.elenco.forEach(evoluir); c.juniores.forEach(evoluir);
  // A diretoria renova quem é útil e ainda tem lenha (o dono decide o resto); quem sobra sai no fim do contrato.
  const mediaAntes = mediaDoElenco(c);
  for (const j of c.elenco) if (j.contratoAte < ano && ano - anoDe(j.tNasc) <= 31 && j.forca >= mediaAntes - 5 && r.chance(0.75)) { j.contratoAte = ano + 2; j.salario = salarioDe(j.forca, c.pais); }
  // Os juniores prontos sobem sozinhos quando o elenco precisa (a comissão técnica os chama).
  for (const j of [...c.juniores]) if (ano - anoDe(j.tNasc) >= 18 && j.forca >= mediaAntes - 6 && c.elenco.length < 26) { c.juniores.splice(c.juniores.indexOf(j), 1); j.salario = salarioDe(j.forca, c.pais) * 0.6; j.contratoAte = ano + 3; c.elenco.push(j); }
  // A folha que não cabe na receita: a diretoria não renova os mais caros (o clube não quebra por conta própria).
  const ultRec = c.historico.slice(-1)[0]?.receita ?? 0;
  if (ultRec > 0 && c.elenco.reduce((x, j) => x + j.salario, 0) > ultRec * 0.6) for (const j of [...c.elenco].sort((a, b) => b.salario - a.salario).slice(0, 3)) if (j.contratoAte <= ano + 1 && c.elenco.length > 20) j.contratoAte = ano - 1;
  const saem = c.elenco.filter(j => j.contratoAte < ano || ano - anoDe(j.tNasc) >= 37);
  if (saem.length) {
    c.elenco = c.elenco.filter(j => !saem.includes(j));
    escrever(v, { texto: `Deixaram o clube no fim do contrato: ${saem.slice(0, 4).map(j => j.nome).join(', ')}${saem.length > 4 ? ` e mais ${saem.length - 4}` : ''}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // O elenco curto se completa com jogadores livres (mais fracos) — nunca um time sem gente.
  // (com o nível que a divisão e o caixa do clube conseguem trazer de graça: um pouco abaixo do que saiu)
  while (c.elenco.length < 22) { const pos = (['GOL', 'DEF', 'MEI', 'ATA'] as Setor20[]).find(p => c.elenco.filter(j => j.pos === p).length < (p === 'GOL' ? 2 : 6)) ?? 'MEI'; c.elenco.push(novoJogador(v, c, r, pos, Math.min(mediaAntes - 3, 56 + (liga.div[c.nome] ?? 1) * 5) + r.normal() * 3, 23 + Math.floor(r.next() * 8))); }
  // 5. A base revela: novos juniores (a estrutura e o investimento dizem quantos e quão bons); os de 20 sobem ou saem.
  const novos = 2 + c.base + c.investimentoBase - 1;
  for (let k = 0; k < novos; k++) c.juniores.push(novoJovem(v, c, r));
  const craque = c.juniores.find(j => j.potencial >= 85 && !c.historico.some(h => h.ano === ano * 1000));
  if (craque && r.chance(0.5)) escrever(v, { texto: `Na base, ${craque.nome}, ${ano - anoDe(craque.tNasc)} anos, chama a atenção dos olheiros: potencial de seleção.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
  c.juniores = c.juniores.filter(j => ano - anoDe(j.tNasc) <= 19).sort((a, b) => b.potencial - a.potencial).slice(0, 12);
  // 6. As obras ficam prontas.
  if (c.obra && c.obra.ate <= ano) { c[c.obra.qual] = Math.min(5, c[c.obra.qual] + 1); escrever(v, { texto: `Ficou pronta a obra ${c.obra.qual === 'estadio' ? 'do estádio' : c.obra.qual === 'ct' ? 'do centro de treinamento' : 'da base'}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' }); c.obra = undefined; }
  // 7. A força para a temporada que começa (a liga lê daqui) e o valor do clube (o patrimônio lê daqui).
  c.forcaPorAno[temporadaCorrente(v)] = Math.round(forcaDaMedia(mediaDoElenco(c)) * 100) / 100;
  const chaves = Object.keys(c.forcaPorAno).map(Number).sort((a, b) => a - b);
  for (const k of chaves.slice(0, Math.max(0, chaves.length - 6))) delete c.forcaPorAno[k];
  const div = liga.div[c.nome] ?? 1;
  const receitaAgora = receitaDoAno(div, c.torcida, c.estadio, c.reputacao, c.pais) * RECEITA_PORTE[porteDe(c.nome, c.pais)];
  const elenco = c.elenco.reduce((s, j) => s + valorDoJogador(j, ano), 0);
  c.valor = Math.round((receitaAgora * 1.2 + elenco * 0.6 + (c.estadio + c.ct + c.base) * 4e6 * mercado(c.pais)) / 1e5) * 1e5;
}

/* ------------------------------------------------------------------ fama */
registrarMotivoDoNome(v => {
  const c = v.clube20;
  if (!c) return undefined;
  const titulos = c.historico.filter(h => h.titulo && h.divisao === 4).length;
  return { valor: Math.min(70, c.torcida / 4 + c.reputacao / 6 + titulos * 6), fonte: 'negocio' };
});

/** Saves: o estado é opcional; o que vier quebrado sai. */
export function normalizarVida20Clube(v: Vida): void {
  const c = v.clube20;
  if (!c) return;
  if (typeof c !== 'object' || !Array.isArray(c.elenco) || typeof c.nome !== 'string') { delete v.clube20; return; }
  c.juniores ??= []; c.historico ??= []; c.forcaPorAno ??= {}; c.comprados ??= []; c.vendas ??= [];
}
