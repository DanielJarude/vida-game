/**
 * VIDA 18 · AS APOSTAS NOVAS — o que se faz (loterias da Caixa, bolões, apostas esportivas, turfe, bingo), o que a lei
 * permite onde a vida está, e o que o dinheiro faz depois. Toda aposta passa por `sistemas/apostas.podeApostar` (idade,
 * lei, autoexclusão, limite do ano, só o que há na conta) e por `registrar` (a conta, o ano, a vida, o humor, os anos
 * pesados que a dependência lê): a moeda entra e sai UMA vez.
 */
import type { Vida } from '../../tipos';
import { rngDe, type Rng } from '../../rng';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { idade, escrever } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { paisDaVida } from '../../mundo/vida';
import { rendaPropriaMensal } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import { debitar, podeApostar, proibido, registrar } from '../../sistemas/apostas';
import { ligaDe } from '../../sistemas/ligas';
import { LOTERIAS18, INSCRICAO_TURFE, PREMIOS_TURFE, type LoteriaId } from '../../dados18/apostas/loterias18';
import { anotar18, estadoApostas18, type ApostaEsportiva18, type Bilhete18, type MercadoEsportivo } from './estado18';
import { apurarConcurso, bolaoDaLoterica, precoDaAposta, precoDaLoteca, proximoConcurso, concursosDoAnoAcabaram, surpresinha, validarJogo, validarLoteca, primeiroDoAno } from './loterias18';
import { impedidoNoFutebol, liquidarTemporada, mercadoDaTemporada, odd, paisDoFutebol, probabilidades, gradeDePlacares, resultadoDoJogo, rodada } from './esportivas18';
import { chancesDoPareo, chegada, hipodromosDaVida, oddTurfe, pareo } from './turfe18';
import { bingoBeneficente, jogarBingo } from './bingo18';
import { todasAsPropriedades, type CavaloDeCorrida18 } from '../rural/fazenda18';

/* ================================================================== A lei, por modalidade */

export type Modalidade18 = 'loterias' | 'esportivas' | 'turfe' | 'bingo';
export function leiDa(v: Vida, m: Modalidade18): { permitido: boolean; texto: string } {
  if (proibido(v)) return { permitido: false, texto: 'Aqui, o jogo de azar é proibido por lei — inclusive loteria e aposta esportiva.' };
  const br = paisDaVida(v) === 'BR';
  switch (m) {
    case 'loterias': return br ? { permitido: true, texto: 'Loterias federais, operadas pela Caixa (Decreto-Lei 204/1967). Maiores de 18.' } : { permitido: false, texto: 'As loterias da Caixa são do Brasil. Aqui, a loteria é a local (a "Seis de Quarenta", no Cassino).' };
    case 'esportivas': return { permitido: true, texto: br ? 'Aposta de quota fixa em operadora autorizada pelo Ministério da Fazenda (Lei 14.790/2023). Maiores de 18; atletas, técnicos e árbitros não apostam no próprio esporte.' : 'Aposta esportiva em casa licenciada, para maiores de 18.' };
    case 'turfe': return { permitido: true, texto: br ? 'Aposta no turfe, em bolsa, nos hipódromos e agências dos Jockey Clubs (Lei 7.291/1984).' : 'Aposta em corridas de cavalos no hipódromo, para maiores de 18.' };
    case 'bingo': return { permitido: true, texto: br ? 'Bingo comercial é proibido no Brasil; o que há é o bingo beneficente da paróquia e da festa junina (sorteio filantrópico autorizado), com prendas, não dinheiro.' : 'Salão de bingo licenciado, com prêmio em dinheiro.' };
  }
}

/* ================================================================== As operações */

export type OqueAposta18 =
  | { jogo: 'loteria'; oque: 'comprar'; loteria: LoteriaId; jogos?: number[][]; palpites?: ('1' | 'X' | '2')[][]; surpresinhas?: number; dezenas?: number }
  | { jogo: 'loteria'; oque: 'bolao'; loteria: LoteriaId; cotas: number }
  | { jogo: 'loteria'; oque: 'bolao_conhecidos'; loteria: LoteriaId; pessoas: string[]; jogos: number }
  | { jogo: 'loteria'; oque: 'sorteio'; loteria: LoteriaId }
  | { jogo: 'esportiva'; oque: 'jogo'; jogoK: number; mercado: '1x2' | 'placar' | 'gols'; palpite: string; valor: number }
  | { jogo: 'esportiva'; oque: 'rodada' }
  | { jogo: 'esportiva'; oque: 'abrir_mercado' }
  | { jogo: 'esportiva'; oque: 'temporada'; mercado: 'campeao' | 'g4' | 'queda' | 'copa'; clube: string; valor: number }
  | { jogo: 'turfe'; oque: 'apostar'; hipodromo: string; tipo: 'vencedor' | 'place' | 'exata'; cavalos: string[]; valor: number }
  | { jogo: 'turfe'; oque: 'inscrever'; hipodromo: string; cavalo: string }
  | { jogo: 'turfe'; oque: 'correr'; hipodromo: string }
  | { jogo: 'bingo'; oque: 'jogar'; cartelas: number };

/** O páreo aberto de um hipódromo (o próximo número) e o cavalo da casa inscrito nele. */
export function pareoAberto(v: Vida, hip: string): { numero: number; daCasa?: CavaloDeCorrida18 } {
  const e = v.apostas18;
  const base = (anoDe(v.t) - 2000) * 400 + 1;
  const numero = Math.max(base, e?.pareo?.[hip] ?? base);
  const insc = e?.inscritos?.[`${hip}:${numero}`];
  const daCasa = insc ? cavalosDaCasa(v).find(c => c.id === insc) : undefined;
  return { numero, daCasa };
}
export const cavalosDaCasa = (v: Vida) => todasAsPropriedades(v).flatMap(x => x.p.cavalos ?? []).filter(c => !c.aposentado && anoDe(v.t) - c.nasc >= 2);
export const pareoDe = (v: Vida, hip: string) => { const a = pareoAberto(v, hip); return pareo(v, hip, a.numero, a.daCasa); };

/** A rodada aberta do futebol (a próxima numeração; uma por semana). */
export function rodadaAberta(v: Vida): number { const base = (anoDe(v.t) - 2000) * 52 + 1; return Math.max(base, v.apostas18?.rodada ?? base); }

/** As apostas no jogo da rodada aberta ainda sem resultado (e as de temporada abertas). */
export const pendentesEsportivas = (v: Vida) => (v.apostas18?.esportivas ?? []).filter(a => !a.liquidada);
/** As apostas do turfe já feitas no páreo aberto. */
export const apostasNoPareo = (v: Vida, hip: string) => { const n = pareoAberto(v, hip).numero; return (v.fatos[`turfe18_ap_${hip}_${n}`] !== undefined ? v.apostas18?.corridas.find(c => c.hipodromo === hip && c.numero === n && !c.ordem.length)?.apostas : undefined) ?? []; };

export function custoDaOperacao(v: Vida, q: OqueAposta18): number {
  if (q.jogo === 'loteria') {
    if (q.oque === 'comprar') {
      if (q.loteria === 'loteca') return precoDaLoteca(q.palpites ?? []);
      const jogos = q.jogos?.length ? q.jogos.map(j => j.length) : Array(q.surpresinhas ?? 1).fill(q.dezenas ?? LOTERIAS18[q.loteria].min);
      return Math.round(jogos.reduce((s, n) => s + precoDaAposta(q.loteria, n), 0) * 100) / 100;
    }
    if (q.oque === 'bolao') return Math.round(bolaoDaLoterica(v, q.loteria).valorCota * q.cotas * 100) / 100;
    if (q.oque === 'bolao_conhecidos') return Math.round(precoDaAposta(q.loteria, LOTERIAS18[q.loteria].min + (q.loteria === 'lotomania' ? 0 : 1)) * q.jogos / (q.pessoas.length + 1) * 100) / 100;
    return 0;
  }
  if (q.jogo === 'esportiva') return q.oque === 'jogo' || q.oque === 'temporada' ? q.valor : 0;
  if (q.jogo === 'turfe') return q.oque === 'apostar' ? q.valor : q.oque === 'inscrever' ? INSCRICAO_TURFE : 0;
  if (q.jogo === 'bingo') return precoDaCartela(v) * q.cartelas;
  return 0;
}
export const precoDaCartela = (v: Vida) => (bingoBeneficente(v) ? 10 : 25);

export function disponibilidadeAposta18(v: Vida, q: OqueAposta18): Veredito {
  if (idade(v) < 18) return bloqueio('ilegal', 'Aposta é coisa de maior de idade.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não daqui de dentro.');
  const m: Modalidade18 = q.jogo === 'loteria' ? 'loterias' : q.jogo === 'esportiva' ? 'esportivas' : q.jogo;
  const lei = leiDa(v, m);
  if (!lei.permitido) return bloqueio('ilegal', lei.texto);
  const custo = custoDaOperacao(v, q);
  switch (q.jogo) {
    case 'loteria': {
      if (q.oque === 'sorteio') return PERMITIDO;
      if (concursosDoAnoAcabaram(v, q.loteria)) return bloqueio('incompativel', 'Os concursos deste ano já correram: o próximo é no ano que vem.');
      if (q.oque === 'comprar') {
        if (q.loteria === 'loteca') { const e = validarLoteca(q.palpites ?? []); if (e) return bloqueio('impossivel', e); }
        else for (const j of q.jogos ?? []) { const e = validarJogo(q.loteria, j); if (e) return bloqueio('impossivel', e); }
        if (!q.jogos?.length && q.loteria !== 'loteca' && !(q.surpresinhas! >= 1 && q.surpresinhas! <= 20)) return bloqueio('impossivel', 'Escolha quantos jogos.');
        if (q.dezenas !== undefined && (q.dezenas < LOTERIAS18[q.loteria].min || q.dezenas > LOTERIAS18[q.loteria].max)) return bloqueio('impossivel', 'Quantidade de dezenas fora da regra.');
      }
      if (q.oque === 'bolao') {
        const b = bolaoDaLoterica(v, q.loteria);
        const ja = (v.apostas18?.bilhetes ?? []).filter(x => x.loteria === q.loteria && x.concurso === b.concurso && x.bolao?.organizador === 'loterica').reduce((s, x) => s + x.bolao!.minhas, 0);
        if (!(q.cotas >= 1) || ja + q.cotas > b.cotas) return bloqueio('incompativel', `O bolão tem ${b.cotas} cotas${ja ? ` (você já tem ${ja})` : ''}.`);
      }
      if (q.oque === 'bolao_conhecidos') {
        if (!q.pessoas.length) return bloqueio('impossivel', 'Bolão é com mais gente: chame alguém.');
        if (q.pessoas.some(id => !v.pessoas[id]?.vivo)) return bloqueio('impossivel', 'Alguém da lista não está mais por perto.');
        if (!(q.jogos >= 1 && q.jogos <= 30)) return bloqueio('impossivel', 'De 1 a 30 jogos.');
      }
      return podeApostar(v, custo);
    }
    case 'esportiva': {
      if (impedidoNoFutebol(v)) return bloqueio('ilegal', 'Quem trabalha no futebol (atleta, técnico, árbitro) não aposta em futebol: a lei proíbe, e o clube demite.');
      if (q.oque === 'rodada' || q.oque === 'abrir_mercado') return PERMITIDO;
      if (!(q.valor > 0)) return bloqueio('impossivel', 'Escolha o valor.');
      if (q.oque === 'temporada') {
        if (!v.caminhos.ligas?.[paisDoFutebol(v)]) return bloqueio('requisito', 'Abra o mercado do campeonato primeiro.');
        const mt = mercadoDaTemporada(v);
        if (!mt?.opcoes.some(o => o.clube === q.clube)) return bloqueio('impossivel', 'Esse clube não está na elite nesta temporada.');
        if (pendentesEsportivas(v).some(a => a.mercado === q.mercado && a.evento === `${mt.pais}:${mt.ano}` && a.palpite === q.clube)) return bloqueio('incompativel', 'Você já tem essa aposta na temporada.');
      }
      if (q.oque === 'jogo') {
        const rd = rodada(v, rodadaAberta(v));
        if (!rd.jogos[q.jogoK]) return bloqueio('impossivel', 'Esse jogo não está na rodada.');
      }
      return podeApostar(v, custo);
    }
    case 'turfe': {
      const h = hipodromosDaVida(v).find(x => x.id === q.hipodromo);
      if (!h) return bloqueio('impossivel', 'Esse hipódromo não é daqui.');
      if (q.oque === 'correr') return PERMITIDO;
      if (q.oque === 'inscrever') {
        const c = cavalosDaCasa(v).find(x => x.id === q.cavalo);
        if (!c) return bloqueio('impossivel', 'Esse cavalo não pode correr (idade, ou não é seu).');
        if (pareoAberto(v, q.hipodromo).daCasa) return bloqueio('incompativel', 'Já há um cavalo da casa inscrito neste páreo.');
        if (apostasNoPareo(v, q.hipodromo).length) return bloqueio('incompativel', 'As apostas do páreo já começaram: inscreva no próximo.');
        return v.financas.conta >= INSCRICAO_TURFE ? PERMITIDO : bloqueio('incompativel', `A inscrição custa ${fmt(INSCRICAO_TURFE)}.`);
      }
      if (!(q.valor > 0)) return bloqueio('impossivel', 'Escolha o valor.');
      const p = pareoDe(v, q.hipodromo);
      const nomes = new Set(p.corredores.map(c => c.nome));
      if (q.cavalos.some(c => !nomes.has(c)) || q.cavalos.length !== (q.tipo === 'exata' ? 2 : 1) || (q.tipo === 'exata' && q.cavalos[0] === q.cavalos[1])) return bloqueio('impossivel', q.tipo === 'exata' ? 'A exata pede dois cavalos diferentes, na ordem.' : 'Escolha um cavalo do páreo.');
      return podeApostar(v, custo);
    }
    case 'bingo': {
      if (!(q.cartelas >= 1 && q.cartelas <= 6)) return bloqueio('impossivel', 'De 1 a 6 cartelas.');
      return podeApostar(v, custo);
    }
  }
}

export interface SaidaAposta18 { texto: string; tom?: 'bom' | 'ruim' | 'neutro' }

export function executarAposta18(v: Vida, rr: Rng, q: OqueAposta18): SaidaAposta18 {
  const e = estadoApostas18(v);
  switch (q.jogo) {
    case 'loteria': return loteria(v, rr, q);
    case 'esportiva': {
      if (q.oque === 'abrir_mercado') { ligaDe(v, paisDoFutebol(v)); return { texto: 'O mercado do campeonato está aberto.' }; }
      if (q.oque === 'rodada') return jogarRodada(v);
      const id = `ae${v.seq++}`;
      if (q.oque === 'temporada') {
        const mt = mercadoDaTemporada(v)!;
        const o = mt.opcoes.find(x => x.clube === q.clube)!;
        const p = q.mercado === 'campeao' ? o.campeao : q.mercado === 'g4' ? o.g4 : q.mercado === 'queda' ? o.queda : o.copa;
        const a: ApostaEsportiva18 = { id, t: v.t, mercado: q.mercado, evento: `${mt.pais}:${mt.ano}`, descricao: `${q.mercado === 'campeao' ? 'Campeão' : q.mercado === 'g4' ? 'Termina no G4' : q.mercado === 'queda' ? 'É rebaixado' : 'Campeão da copa'}: ${q.clube} (${mt.ano})`, palpite: q.clube, odd: odd(p), valor: q.valor };
        debitar(v, q.valor);
        registrar(v, { jogo: 'esportiva', t: v.t, apostado: q.valor, recebido: 0, texto: a.descricao });
        e.esportivas.push(a);
        return { texto: `Aposta feita: ${a.descricao}, a ${a.odd.toFixed(2).replace('.', ',')}. Liquida quando a temporada fechar.` };
      }
      const n = rodadaAberta(v);
      const rd = rodada(v, n);
      const j = rd.jogos[q.jogoK];
      const pr = probabilidades(j);
      let p = 0, desc = '';
      if (q.mercado === '1x2') { p = pr[q.palpite as '1' | 'X' | '2']; desc = q.palpite === '1' ? `${j.casa} vence` : q.palpite === '2' ? `${j.fora} vence` : 'Empate'; }
      else if (q.mercado === 'gols') { p = q.palpite === 'mais' ? pr.mais : pr.menos; desc = q.palpite === 'mais' ? 'Mais de 2,5 gols' : 'Menos de 2,5 gols'; }
      else { const [x, y] = q.palpite.split('-').map(Number); const g = gradeDePlacares(j); const t = g.flat().reduce((s, z) => s + z, 0); p = (g[x]?.[y] ?? 0) / t; desc = `Placar exato ${x} × ${y}`; }
      const a: ApostaEsportiva18 = { id, t: v.t, mercado: q.mercado, evento: `${rd.pais}:r${n}:${q.jogoK}`, descricao: `${j.casa} × ${j.fora} — ${desc}`, palpite: q.palpite, odd: odd(p), valor: q.valor };
      debitar(v, q.valor);
      registrar(v, { jogo: 'esportiva', t: v.t, apostado: q.valor, recebido: 0, texto: a.descricao });
      e.esportivas.push(a);
      return { texto: `Aposta feita: ${a.descricao}, a ${a.odd.toFixed(2).replace('.', ',')}.` };
    }
    case 'turfe': return turfe(v, q);
    case 'bingo': {
      const preco = precoDaCartela(v);
      const n = (e.bingo?.numero ?? (anoDe(v.t) - 2000) * 1000) + 1;
      e.bingo = { numero: n };
      const res = jogarBingo(v, n, q.cartelas, preco);
      const custo = preco * q.cartelas;
      debitar(v, custo);
      const beneficente = bingoBeneficente(v);
      // No bingo beneficente o prêmio é uma prenda (não volta dinheiro): a cesta, o liquidificador, a bicicleta.
      const recebido = beneficente ? 0 : res.recebido;
      const ganhouLinha = res.linha.minhas > 0, ganhouCheia = res.cheia.minhas > 0;
      const prenda = ganhouCheia ? 'a bicicleta da paróquia' : ganhouLinha ? 'uma cesta de café da manhã' : '';
      const texto = `${beneficente ? 'Bingo da paróquia' : 'Bingo'}: ${res.bolas.length} bolas até a cartela cheia (${res.cheia.total > 1 ? `${res.cheia.total} cartelas empataram` : 'uma cartela só'}). ${ganhouCheia ? `Bingo! ${beneficente ? `Você levou ${prenda}.` : `A cartela cheia pagou ${fmt(res.cheia.minhas / res.cheia.total * res.premioCheia)}.`}` : ganhouLinha ? `A sua linha saiu primeiro: ${beneficente ? `${prenda}.` : `${fmt(res.linha.minhas / res.linha.total * res.premioLinha)}.`}` : 'Não foi desta vez.'}`;
      registrar(v, { jogo: 'bingo', t: v.t, apostado: custo, recebido, texto });
      anotar18(v, { jogo: 'bingo', texto, apostado: custo, recebido });
      return { texto, tom: ganhouLinha || ganhouCheia ? 'bom' : 'neutro' };
    }
  }
}

/* ------------------------------------------------------------------ Loterias */

function loteria(v: Vida, rr: Rng, q: Extract<OqueAposta18, { jogo: 'loteria' }>): SaidaAposta18 {
  const e = estadoApostas18(v);
  const l = q.loteria;
  const L = LOTERIAS18[l];
  const n = proximoConcurso(v, l);
  if (q.oque === 'sorteio') {
    const a = apurarConcurso(v, l, n);
    e.proximo[l] = n + 1;
    const sorteado = l === 'loteca' ? `os 14 jogos da rodada` : `${a.sorteio.a.map(x => String(x).padStart(2, '0')).join(' ')}${a.sorteio.b ? ` · 2º sorteio: ${a.sorteio.b.map(x => String(x).padStart(2, '0')).join(' ')}` : ''}`;
    if (!a.bilhetes.length) return { texto: `${L.nome}, concurso ${n}: ${sorteado}. Você não tinha jogo neste.` };
    const custo = a.bilhetes.reduce((s, b) => s + b.custo, 0);
    if (a.premio > 0) registrar(v, { jogo: 'loteria18', t: v.t, apostado: 0, recebido: a.premio, texto: `${L.nome} ${n}` });
    anotar18(v, { jogo: 'loteria', texto: `${L.nome} ${n}: ${a.premio > 0 ? `prêmio de ${fmt(a.premio)}` : 'nenhuma faixa'}`, apostado: custo, recebido: a.premio });
    grandePremio(v, a.premio, L.nome, a.bilhetes.find(b => b.bolao)?.bolao);
    const faixas = a.bilhetes.flatMap(b => b.resultado!.faixas.map(f => `${f.combinacoes > 1 ? `${f.combinacoes}× ` : ''}${f.nome}`));
    return { texto: `${L.nome}, concurso ${n}: ${sorteado}. ${a.premio > 0 ? `${faixas.join(', ')} — ${fmt(a.premio)}${a.bilhetes.some(b => b.bolao) ? ' (a sua parte do bolão)' : ''}.` : 'Nenhuma faixa premiada.'}`, tom: a.premio > custo ? 'bom' : 'neutro' };
  }
  let b: Bilhete18;
  const custo = custoDaOperacao(v, q);
  if (q.oque === 'comprar') {
    const jogos = l === 'loteca' ? [[]] : q.jogos?.length ? q.jogos.map(j => [...j].sort((x, y) => x - y)) : Array.from({ length: q.surpresinhas ?? 1 }, () => surpresinha(rr, l, q.dezenas ?? L.min));
    b = { id: `bl${v.seq++}`, loteria: l, concurso: n, t: v.t, jogos, ...(l === 'loteca' ? { palpites: q.palpites } : {}), custo, ...(!q.jogos?.length && l !== 'loteca' ? { surpresinha: true } : {}) };
  } else if (q.oque === 'bolao') {
    const bo = bolaoDaLoterica(v, l);
    b = { id: `bl${v.seq++}`, loteria: l, concurso: n, t: v.t, jogos: bo.jogos, ...(bo.palpites ? { palpites: bo.palpites } : {}), custo, bolao: { minhas: q.cotas, cotas: bo.cotas, organizador: 'loterica' } };
  } else {
    const d = L.min + (l === 'lotomania' ? 0 : 1);
    const jogos = Array.from({ length: q.jogos }, () => surpresinha(rr, l, d));
    b = { id: `bl${v.seq++}`, loteria: l, concurso: n, t: v.t, jogos, custo, bolao: { minhas: 1, cotas: q.pessoas.length + 1, pessoas: q.pessoas, organizador: 'voce' } };
  }
  debitar(v, custo);
  registrar(v, { jogo: 'loteria18', t: v.t, apostado: custo, recebido: 0, texto: `${L.nome} ${n}` });
  e.bilhetes.push(b);
  if (e.bilhetes.length > 120) e.bilhetes.splice(0, e.bilhetes.length - 120);
  return { texto: `${q.oque === 'comprar' ? 'Aposta registrada' : 'Cotas do bolão registradas'} no concurso ${n} da ${L.nome} (${fmt(custo)}). O sorteio é ${L.dias}.` };
}

/* ------------------------------------------------------------------ A rodada do futebol */

function liquidarAposta(v: Vida, a: ApostaEsportiva18, ganhou: boolean, resultado: string, devolver = false): number {
  const recebido = devolver ? a.valor : ganhou ? Math.round(a.valor * a.odd * 100) / 100 : 0;
  a.liquidada = { t: v.t, ganhou, recebido, resultado };
  if (recebido > 0) registrar(v, { jogo: 'esportiva', t: v.t, apostado: 0, recebido, texto: a.descricao });
  anotar18(v, { jogo: 'esportiva', texto: `${a.descricao} — ${resultado}`, apostado: a.valor, recebido });
  return recebido;
}

function jogarRodada(v: Vida): SaidaAposta18 {
  const e = estadoApostas18(v);
  const n = rodadaAberta(v);
  const pais = paisDoFutebol(v);
  const rd = rodada(v, n, pais);
  let total = 0, apostado = 0;
  for (const a of pendentesEsportivas(v).filter(x => x.evento.startsWith(`${pais}:r${n}:`))) {
    const k = Number(a.evento.split(':')[2]);
    const res = resultadoDoJogo(v, n, k, pais);
    const placar = `${res.gols[0]} × ${res.gols[1]}`;
    const ganhou = a.mercado === '1x2' ? res.res === a.palpite : a.mercado === 'gols' ? (res.gols[0] + res.gols[1] >= 3) === (a.palpite === 'mais') : `${res.gols[0]}-${res.gols[1]}` === a.palpite;
    total += liquidarAposta(v, a, ganhou, `terminou ${placar}`);
    apostado += a.valor;
  }
  e.rodada = n + 1;
  const placares = rd.jogos.slice(0, 4).map((j, k) => { const r = resultadoDoJogo(v, n, k, pais); return `${j.casa} ${r.gols[0]} × ${r.gols[1]} ${j.fora}`; }).join('; ');
  if (total >= 0) grandePremio(v, total - apostado, 'apostas esportivas');
  return { texto: `Rodada ${n}: ${placares}…${apostado ? ` As suas apostas: ${total > 0 ? `voltaram ${fmt(total)}` : 'nenhuma acertou'}.` : ''}`, tom: total > apostado ? 'bom' : 'neutro' };
}

/* ------------------------------------------------------------------ O turfe */

function turfe(v: Vida, q: Extract<OqueAposta18, { jogo: 'turfe' }>): SaidaAposta18 {
  const e = estadoApostas18(v);
  const a = pareoAberto(v, q.hipodromo);
  const p = pareo(v, q.hipodromo, a.numero, a.daCasa);
  let c = e.corridas.find(x => x.hipodromo === q.hipodromo && x.numero === a.numero);
  if (q.oque === 'inscrever') {
    (e.inscritos ??= {})[`${q.hipodromo}:${a.numero}`] = q.cavalo;
    v.financas.conta -= INSCRICAO_TURFE;
    lancar(v, 'Inscrição no turfe', 'despesa', -INSCRICAO_TURFE);
    const cav = cavalosDaCasa(v).find(x => x.id === q.cavalo)!;
    return { texto: `${cav.nome} inscrito no ${a.numero % 25 === 0 ? 'Grande Prêmio' : `páreo ${a.numero}`} (${fmt(INSCRICAO_TURFE)}).` };
  }
  if (q.oque === 'apostar') {
    const ch = chancesDoPareo(p);
    const pr = q.tipo === 'vencedor' ? ch.vencer[q.cavalos[0]] ?? 0 : q.tipo === 'place' ? ch.place[q.cavalos[0]] ?? 0 : ch.exata[`${q.cavalos[0]}>${q.cavalos[1]}`] ?? 0;
    const o = oddTurfe(pr);
    if (!c) { c = { id: `co${v.seq++}`, hipodromo: q.hipodromo, numero: a.numero, t: v.t, ordem: [], apostas: [] }; e.corridas.push(c); }
    c.apostas.push({ tipo: q.tipo, cavalos: q.cavalos, valor: q.valor, odd: o, recebido: 0 });
    v.fatos[`turfe18_ap_${q.hipodromo}_${a.numero}`] = v.t;
    debitar(v, q.valor);
    registrar(v, { jogo: 'turfe', t: v.t, apostado: q.valor, recebido: 0, texto: `Turfe: ${q.cavalos.join(' > ')}` });
    return { texto: `Aposta no ${q.tipo === 'vencedor' ? 'vencedor' : q.tipo === 'place' ? 'placê' : 'exata'}: ${q.cavalos.join(' e ')} (rateio estimado ${o.toFixed(1).replace('.', ',')}).` };
  }
  // Correr o páreo.
  const ordem = chegada(v, p);
  if (!c) { c = { id: `co${v.seq++}`, hipodromo: q.hipodromo, numero: a.numero, t: v.t, ordem: [], apostas: [] }; e.corridas.push(c); }
  c.ordem = ordem;
  let total = 0, apostado = 0;
  for (const ap of c.apostas) {
    const ganhou = ap.tipo === 'vencedor' ? ordem[0] === ap.cavalos[0] : ap.tipo === 'place' ? ordem.slice(0, 2).includes(ap.cavalos[0]) : ordem[0] === ap.cavalos[0] && ordem[1] === ap.cavalos[1];
    ap.recebido = ganhou ? Math.round(ap.valor * ap.odd * 100) / 100 : 0;
    total += ap.recebido; apostado += ap.valor;
  }
  if (total > 0) registrar(v, { jogo: 'turfe', t: v.t, apostado: 0, recebido: total, texto: `Turfe, páreo ${a.numero}` });
  let extra = '';
  if (a.daCasa) {
    const lugar = ordem.indexOf(a.daCasa.nome) + 1;
    const premio = lugar >= 1 && lugar <= 5 ? Math.round(PREMIOS_TURFE[lugar - 1] * (p.grandePremio ? 10 : 1)) : 0;
    a.daCasa.corridas++;
    if (lugar === 1) a.daCasa.vitorias++;
    a.daCasa.premios += premio;
    a.daCasa.forma = Math.max(30, Math.min(90, a.daCasa.forma + (lugar <= 3 ? 4 : -3)));
    if (premio > 0) { v.financas.conta += premio; lancar(v, `Prêmio de corrida: ${a.daCasa.nome}`, 'renda', premio); }
    c.daCasa = { nome: a.daCasa.nome, lugar, premio };
    extra = ` ${a.daCasa.nome}, da casa, chegou em ${lugar}º${premio ? ` (prêmio de ${fmt(premio)} ao proprietário)` : ''}.`;
    if (lugar === 1 && p.grandePremio) escrever(v, { texto: `${a.daCasa.nome}, criado no seu haras, venceu o Grande Prêmio no ${p.hipodromo.nome}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  }
  if (c.apostas.length || a.daCasa) anotar18(v, { jogo: 'turfe', texto: `${p.hipodromo.nome}, páreo ${a.numero}: venceu ${ordem[0]}.${extra}`, apostado, recebido: total });
  (e.pareo ??= {})[q.hipodromo] = a.numero + 1;
  if (e.corridas.length > 40) e.corridas.splice(0, e.corridas.length - 40);
  return { texto: `${p.grandePremio ? 'Grande Prêmio' : `Páreo ${a.numero}`} (${p.distancia} m, ${p.pista}): ${ordem.slice(0, 3).map((x, k) => `${k + 1}º ${x}`).join(', ')}.${apostado ? ` As suas apostas: ${total > 0 ? `voltaram ${fmt(total)}` : 'nenhuma acertou'}.` : ''}${extra}`, tom: total > apostado || (c.daCasa?.lugar === 1) ? 'bom' : 'neutro' };
}

/* ================================================================== O grande prêmio */

/** Um prêmio que muda a vida (o que os acontecimentos `premio18_*` leem). Entra na conta UMA vez (por `registrar`). */
export function grandePremio(v: Vida, liquido: number, jogo: string, bolao?: Bilhete18['bolao']): void {
  const renda = Math.max(rendaPropriaMensal(v), 2000);
  if (liquido < Math.max(400_000, renda * 100)) return;
  const e = estadoApostas18(v);
  e.premio = { t: v.t, valor: Math.round(liquido), jogo, ...(bolao ? { bolao: true, pessoas: bolao.pessoas } : {}) };
  v.fatos['premio18'] = v.t;
  escrever(v, { texto: `O bilhete premiado: ${fmt(liquido)} ${jogo === 'apostas esportivas' ? 'em apostas esportivas' : `na ${jogo}`}${bolao ? ' (a sua parte do bolão)' : ''}. Depois da conferência, o dinheiro caiu na conta.`, relevancia: 'marco', tema: 'dinheiro', tom: 'bom' });
}

/* ================================================================== O ano */

/**
 * O fechamento do ano: confere os bilhetes que ficaram sem sorteio visto (a conferência automática), liquida as apostas
 * de temporada que fecharam e as de jogo que ficaram para trás, e acende os acontecimentos do prêmio grande.
 */
export function processarApostas18(v: Vida): void {
  const e = v.apostas18;
  if (!e) return;
  const anoPassado = anoDe(v.t) - 1;
  // Bilhetes de concursos que correram e ninguém olhou: confere (o sorteio é o do concurso, sempre o mesmo).
  const porConcurso = new Map<string, { l: LoteriaId; n: number }>();
  for (const b of e.bilhetes) if (!b.resultado) porConcurso.set(`${b.loteria}:${b.concurso}`, { l: b.loteria, n: b.concurso });
  for (const { l, n } of porConcurso.values()) {
    if (n >= primeiroDoAno(l, anoDe(v.t))) continue;
    const a = apurarConcurso(v, l, n);
    if (a.premio > 0) { registrar(v, { jogo: 'loteria18', t: v.t, apostado: 0, recebido: a.premio, texto: `${LOTERIAS18[l].nome} ${n}` }); escrever(v, { texto: `Conferindo bilhetes velhos: o concurso ${n} da ${LOTERIAS18[l].nome} tinha pago ${fmt(a.premio)}. O prêmio foi resgatado a tempo.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom' }); grandePremio(v, a.premio, LOTERIAS18[l].nome, a.bilhetes.find(b => b.bolao)?.bolao); }
    anotar18(v, { jogo: 'loteria', texto: `${LOTERIAS18[l].nome} ${n} (conferido no fim do ano): ${a.premio > 0 ? fmt(a.premio) : 'nenhuma faixa'}`, apostado: a.bilhetes.reduce((s, b) => s + b.custo, 0), recebido: a.premio });
  }
  // Os jogos da rodada que ficaram abertos: a rodada aconteceu (o placar é o do mundo).
  const n = rodadaAberta(v);
  for (const a of pendentesEsportivas(v)) {
    const m = /^([A-Z]{2}):r(\d+):(\d+)$/.exec(a.evento);
    if (m) {
      const rd = Number(m[2]);
      if (rd >= n && anoDe(a.t) > anoPassado) continue;
      const res = resultadoDoJogo(v, rd, Number(m[3]), m[1]);
      const ganhou = a.mercado === '1x2' ? res.res === a.palpite : a.mercado === 'gols' ? (res.gols[0] + res.gols[1] >= 3) === (a.palpite === 'mais') : `${res.gols[0]}-${res.gols[1]}` === a.palpite;
      liquidarAposta(v, a, ganhou, `terminou ${res.gols[0]} × ${res.gols[1]}`);
      continue;
    }
    const r = liquidarTemporada(v, a.mercado as MercadoEsportivo, a.evento, a.palpite);
    if (!r) continue;
    const devolver = /devolvida/.test(r.resultado);
    const rec = liquidarAposta(v, a, r.ganhou, r.resultado, devolver);
    if (rec > 0 && !devolver) grandePremio(v, rec - a.valor, 'apostas esportivas');
  }
  // As rodadas do ano passado acabaram: a próxima é a primeira do ano.
  if (e.rodada !== undefined && e.rodada < (anoDe(v.t) - 2000) * 52 + 1) e.rodada = undefined;
  // O prêmio grande: os anos seguintes trazem os pedidos, as aproximações, os convites (e, num bolão entre conhecidos, a cota disputada).
  const p = e.premio;
  if (p) {
    const anos = Math.floor((v.t - p.t) / 12);
    const r = rngDe(v.id, 'premio18', v.t);
    if (anos >= 1 && anos <= 6) {
      if (r.chance(anos <= 2 ? 0.7 : 0.35)) v.fatos['premio18_pedido'] = v.t;
      else if (r.chance(0.5)) v.fatos['premio18_convite'] = v.t;
    }
    if (anos === 1 && p.bolao && p.pessoas?.length && r.chance(0.5)) v.fatos['premio18_bolao'] = v.t;
    // O dinheiro que acabou: quem gastou tudo em poucos anos sente.
    if (anos >= 2 && anos <= 8 && p.destino === 'gastar' && v.financas.conta + v.financas.investimentos.reduce((s, x) => s + x.valor, 0) < p.valor * 0.1 && !v.fatos['premio18_acabou']) v.fatos['premio18_acabou'] = v.t;
  }
}

export { rngDe };
