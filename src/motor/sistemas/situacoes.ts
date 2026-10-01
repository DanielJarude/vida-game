/**
 * Situações de carreira (pacote pós-playtest): o trabalho não é só "passou
 * um ano, os números foram calculados". De vez em quando — nunca todo ano —
 * a carreira produz um MOMENTO:
 *
 *   contexto profissional → situação significativa → o jogador escolhe a
 *   INTENÇÃO → o motor consulta o estado real → desfecho → consequência →
 *   memória (quando marca)
 *
 * ESCOLHA NÃO É RESULTADO. Cada intenção tem um RISCO (o quanto espalha os
 * desfechos para os extremos) e FATORES vindos do estado (técnica contra a
 * divisão, leitura de jogo, fôlego, cabeça, competência, clima, coragem…).
 * A soma vira a chance de dar certo; o risco decide se o certo é brilhante
 * e o errado é desastre:
 *
 *   s = logística(fatores)      ótimo = s·risco   bom = s·(1−risco)
 *                               ruim = (1−s)·(1−risco)   péssimo = (1−s)·risco
 *
 * "Tentar o passe arriscado" não é "dar a assistência": pode dar, pode a
 * jogada morrer no atacante, pode virar contra-ataque.
 *
 * A arquitetura é de MODELOS com dados (contexto sorteado e guardado,
 * intenções, desfechos com efeitos sobre o estado) — servindo ao futebol,
 * à medicina, à academia, à atuação, ao negócio e ao emprego comum. A
 * profundidade varia por carreira; o trabalho comum também é biografia.
 *
 * O contexto sorteado (o minuto, o placar, o caso) fica em
 * `caminhos.situacao` e a decisão `car_situacao` o mostra; o que aconteceu
 * fica em `caminhos.situacoes` (a tela de Trabalho lê) e, quando marca, na
 * Linha da Vida.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Posicao, RegistroDeSituacao, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { flex, ge } from '../texto';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { doClube, oClube, peloClube } from '../dados/clubes';
import { habilidade } from './frentes';
import { barraDaDivisao, nomePosicao, OCUPACOES_DE_ATLETA } from './esporte';
import { climaDe, mexerNoClima } from './profissao';
import { negocioAtivo } from './negocio';
import { empregoAcademico, vidaAcademica } from './academia';
import { mercadoDoTrabalho } from './mercados';
import { marcar } from './marcas';
import { registrarConquista } from './palmares';
import { anoDe } from '../tempo';

export type Trajetoria = 'futebol' | 'medicina' | 'academia' | 'cena' | 'negocio' | 'autonomo' | 'emprego';
export type Desfecho = RegistroDeSituacao['desfecho'];
type Dados = Record<string, string | number>;
export interface Fator { id: string; valor: number }

/** O que um desfecho muda no estado (primitivas comuns, aplicadas pela trajetória). */
export interface Efeitos {
  /** O nome dentro da área: reputação no mercado (futebol), desempenho (emprego, medicina, academia), freguesia/público (cena, autônomo), reputação (negócio). */
  nome?: number;
  /** O clima com a chefia / o treinador / a direção. */
  clima?: number;
  estresse?: number;
  humor?: number;
  /** A notoriedade pública (pequena, e só para quem já tem nome). */
  noto?: number;
  /** A imagem pública (`imagemPublica`): o que se disse e fez ficou bem ou pegou mal. */
  imagem?: 'boa' | 'polemica';
  /** Futebol: a confiança do treinador (pesa em quem começa jogando) e o que entra na estatística da temporada. */
  confianca?: number;
  gols?: number;
  assistencias?: number;
  defesa?: number;
  /** Dinheiro: no caixa do negócio, ou na conta. */
  dinheiro?: number;
  /** Algo próprio do momento (a posição nova, a braçadeira, o orientando). */
  extra?: (v: Vida, d: Dados) => void;
}

export interface DesfechoModelo { texto: string | ((v: Vida, d: Dados) => string); efeitos?: Efeitos; memoria?: string | ((v: Vida, d: Dados) => string) }
export interface Intencao {
  id: string;
  texto: string | ((v: Vida, d: Dados) => string);
  /** O que a escolha arrisca — dito antes, em palavras (nunca números). */
  dica?: string;
  /** Quanto espalha os desfechos para os extremos (0 = conservador, 1 = tudo ou nada). */
  risco: number;
  fatores: (v: Vida, d: Dados) => Fator[];
  desfechos: Record<Desfecho, DesfechoModelo>;
}
export interface ModeloSituacao {
  id: string;
  trajetoria: Trajetoria;
  /** O estado permite (a posição, a idade, a fase, a última temporada). */
  cabe: (v: Vida) => boolean;
  peso?: (v: Vida) => number;
  /** O contexto sorteado (fica guardado). */
  contexto?: (v: Vida, r: Rng) => Dados;
  titulo: string | ((v: Vida, d: Dados) => string);
  texto: (v: Vida, d: Dados) => string;
  intencoes: Intencao[] | ((v: Vida, d: Dados) => Intencao[]);
}

/* ------------------------------------------------------------ O motor */

const logistica = (x: number) => 1 / (1 + Math.exp(-x * 2.5));
const txt = (x: string | ((v: Vida, d: Dados) => string), v: Vida, d: Dados) => (typeof x === 'string' ? x : x(v, d));

/** A distribuição dos desfechos de uma intenção, para esta vida, agora (a mesma conta que o sorteio usa). */
export function distribuicao(v: Vida, it: Intencao, d: Dados): Record<Desfecho, number> & { fatores: Fator[]; sucesso: number } {
  const fatores = it.fatores(v, d);
  const s = logistica(fatores.reduce((a, f) => a + f.valor, 0));
  const k = clamp(it.risco, 0, 1);
  return { otimo: s * k, bom: s * (1 - k), ruim: (1 - s) * (1 - k), pessimo: (1 - s) * k, fatores, sucesso: s };
}

export function sortearDesfecho(v: Vida, r: Rng, it: Intencao, d: Dados): Desfecho {
  const p = distribuicao(v, it, d);
  let x = r.next();
  for (const k of ['otimo', 'bom', 'ruim', 'pessimo'] as Desfecho[]) { x -= p[k]; if (x <= 0) return k; }
  return 'pessimo';
}

export const intencoesDe = (m: ModeloSituacao, v: Vida, d: Dados) => (typeof m.intencoes === 'function' ? m.intencoes(v, d) : m.intencoes);
export const modeloDaSituacao = (id: string) => MODELOS.find(m => m.id === id);

/** A situação aberta deste ano (se ainda cabe). */
export function situacaoAberta(v: Vida): { m: ModeloSituacao; d: Dados } | undefined {
  const s = v.caminhos.situacao;
  if (!s || s.t !== v.t) return undefined;
  const m = modeloDaSituacao(s.id);
  return m && m.cabe(v) ? { m, d: s.dados } : undefined;
}

/** A trajetória que produz situações agora (a principal; a especial primeiro). */
export function trajetoriaDeSituacao(v: Vida): Trajetoria | undefined {
  const e = v.trabalho.atual;
  const es = v.caminhos.esporte;
  if (es?.fase === 'profissional' && es.modalidade === 'futebol' && e && OCUPACOES_DE_ATLETA.includes(e.ocupacaoId)) return 'futebol';
  if (!e) return negocioAtivo(v) ? 'negocio' : undefined;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc) return undefined;
  if (oc.trilha === 'medicina') return 'medicina';
  if (empregoAcademico(v) === e) return 'academia';
  const m = mercadoDoTrabalho(v, e);
  if (m === 'arte') return 'cena';
  if (m === 'negocio') return 'negocio';
  if (m === 'autonomo') return 'autonomo';
  if (m === 'emprego' || m === 'servico_publico') return 'emprego';
  return undefined;
}

/** Quantas situações por ano, em média, cada trajetória produz (algumas temporadas são silenciosas). */
const FREQUENCIA: Record<Trajetoria, number> = { futebol: 0.45, medicina: 0.32, academia: 0.3, cena: 0.32, negocio: 0.3, autonomo: 0.25, emprego: 0.22 };

/** O ano: às vezes, uma situação (nunca a mesma de pouco tempo atrás). Fica aberta para a decisão `car_situacao`. */
export function processarSituacoes(v: Vida, r: Rng): void {
  v.caminhos.situacao = undefined;
  const tr = trajetoriaDeSituacao(v);
  if (!tr || idade(v) < 16 || v.justica?.prisao || !r.chance(FREQUENCIA[tr])) return;
  const recentes = new Set((v.caminhos.situacoes ?? []).filter(x => v.t - x.t <= 36).map(x => x.id));
  const cands = MODELOS.filter(m => m.trajetoria === tr && !recentes.has(m.id) && m.cabe(v));
  const m = r.weighted(cands, x => x.peso?.(v) ?? 1);
  if (!m) return;
  v.caminhos.situacao = { id: m.id, t: v.t, dados: m.contexto?.(v, r) ?? {} };
}

/** Resolve a intenção escolhida: sorteia o desfecho pela distribuição, aplica, guarda. */
export function resolverSituacao(v: Vida, r: Rng, intencaoId: string): { texto: string; desfecho: Desfecho; memoria?: string } | undefined {
  const a = situacaoAberta(v);
  if (!a) return undefined;
  const it = intencoesDe(a.m, v, a.d).find(x => x.id === intencaoId);
  if (!it) return undefined;
  const desfecho = sortearDesfecho(v, r, it, a.d);
  const dm = it.desfechos[desfecho];
  aplicar(v, a.m.trajetoria, dm.efeitos ?? {}, a.d);
  const texto = txt(dm.texto, v, a.d);
  const memoria = dm.memoria ? txt(dm.memoria, v, a.d) : undefined;
  (v.caminhos.situacoes ??= []).push({ id: a.m.id, t: v.t, trajetoria: a.m.trajetoria, intencao: typeof it.texto === 'string' ? it.texto : it.texto(v, a.d), desfecho, texto: memoria ?? texto });
  if (v.caminhos.situacoes.length > 40) v.caminhos.situacoes.splice(0, v.caminhos.situacoes.length - 40);
  v.caminhos.situacao = undefined;
  return { texto, desfecho, memoria };
}

function aplicar(v: Vida, tr: Trajetoria, ef: Efeitos, d: Dados): void {
  const e = v.trabalho.atual;
  if (ef.nome) {
    if (tr === 'futebol') { const es = v.caminhos.esporte; if (es) es.reputacao = clamp((es.reputacao ?? 30) + ef.nome); }
    else if (tr === 'negocio') { const n = negocioAtivo(v); if (n) n.reputacao = clamp((n.reputacao ?? 30) + ef.nome * 1.5); }
    else if ((tr === 'cena' || tr === 'autonomo') && e?.clientela !== undefined) e.clientela = clamp(e.clientela + ef.nome * 1.5);
    else if (tr === 'cena' && v.caminhos.arte?.ativo) v.caminhos.arte.publico = clamp(v.caminhos.arte.publico + ef.nome);
    else if (e) e.desempenho = clamp(e.desempenho + ef.nome * 2);
  }
  if (ef.clima) mexerNoClima(v, ef.clima);
  if (ef.estresse) v.mente.estresse = clamp(v.mente.estresse + ef.estresse);
  if (ef.humor) v.mente.felicidade = clamp(v.mente.felicidade + ef.humor);
  if (ef.noto && v.notoriedade && v.notoriedade.valor >= 10) { v.notoriedade.valor = clamp(v.notoriedade.valor + ef.noto); v.notoriedade.pico = Math.max(v.notoriedade.pico, v.notoriedade.valor); }
  if (ef.imagem) v.fatos[ef.imagem === 'boa' ? 'vis_boa' : 'vis_polemica'] = v.t;
  if (ef.confianca) v.fatos['esp_treinador_ok'] = ef.confianca > 0 ? v.t : v.t - 24;
  const t = v.caminhos.esporte?.temporadas?.slice(-1)[0];
  if (t && tr === 'futebol') { if (ef.gols) t.gols += ef.gols; if (ef.assistencias) t.assistencias += ef.assistencias; if (ef.defesa && t.defesa !== undefined) t.defesa += ef.defesa; }
  if (ef.dinheiro) { const n = tr === 'negocio' ? negocioAtivo(v) : undefined; if (n) n.caixa = (n.caixa ?? 0) + ef.dinheiro; else v.financas.conta += ef.dinheiro; }
  ef.extra?.(v, d);
}

/* ------------------------------------------------------------ Fatores */

const F = (id: string, valor: number): Fator => ({ id, valor: Math.round(valor * 100) / 100 });
const tecnicaFut = (v: Vida) => { const es = v.caminhos.esporte!; return F('técnica', (habilidade(v, 'futebol') - barraDaDivisao('futebol', es.nivel)) / 12); };
const leitura = (v: Vida) => F('leitura', (v.mente.cognicao - 50) / 90);
const folego = (v: Vida, d: Dados) => F('fôlego', (v.corpo.forma - 70) / 60 - (Number(d.minuto ?? 0) >= 80 ? 0.08 : 0));
const cabeca = (v: Vida, d: Dados = {}) => F('cabeça', -(v.mente.estresse - 45) / 110 - (d.jogo === 'decisão' ? 0.1 : 0));
const coragem = (v: Vida) => F('coragem', v.personalidade.tracos.coragem / 300);
const social = (v: Vida) => F('jeito com gente', v.personalidade.tracos.sociabilidade / 250);
const disciplina = (v: Vida) => F('disciplina', v.personalidade.tracos.disciplina / 300);
const lideranca = (v: Vida) => F('liderança', (habilidade(v, 'lideranca') - 30) / 120);
const competencia = (v: Vida) => { const e = v.trabalho.atual; const anos = e ? Math.min(20, (v.t - e.tInicio) / 12) : 0; return F('competência', ((e?.desempenho ?? 50) - 55) / 90 + anos / 60); };
const clima = (v: Vida) => { const e = v.trabalho.atual; return F('clima', e ? (climaDe(e) - 50) / 140 : 0); };
const nomeFut = (v: Vida) => F('nome no elenco', ((v.caminhos.esporte?.reputacao ?? 30) - 50) / 120);

/* ------------------------------------------------------------ Futebol */

const fut = (v: Vida) => trajetoriaDeSituacao(v) === 'futebol';
const posDe = (v: Vida): Posicao => v.caminhos.esporte?.posicao ?? 'meia';
const CONSTRUCAO: Posicao[] = ['volante', 'meia', 'lateral', 'zagueiro'];
const ATAQUE: Posicao[] = ['atacante', 'ponta'];
const contextoDeJogo = (v: Vida, r: Rng): Dados => {
  const es = v.caminhos.esporte!;
  const t = es.temporadas?.slice(-1)[0];
  const jogo = t && t.colocacao <= 2 ? 'decisão' : r.chance(0.35) ? 'clássico' : 'jogo de meio de tabela';
  return { minuto: r.int(72, 88), placar: r.pick(['perde por 1 a 0', 'perde por 1 a 0', 'está empatado', 'vence por 1 a 0']), jogo, clube: es.clube };
};
const abertura = (_v: Vida, d: Dados) => `${d.minuto} minutos de ${d.jogo === 'decisão' ? 'uma decisão' : d.jogo === 'clássico' ? 'um clássico' : 'um jogo de meio de tabela'}. ${cap(oClube(String(d.clube)))} ${d.placar}.`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const memoravel = (d: Dados) => d.jogo === 'decisão' || d.jogo === 'clássico';
const placarDepois = (d: Dados, gol: boolean) => (!gol ? '' : d.placar === 'perde por 1 a 0' ? ' 1 a 1.' : d.placar === 'está empatado' ? ' A virada no placar.' : ' 2 a 0, jogo resolvido.');

const MODELOS_FUTEBOL: ModeloSituacao[] = [
  {
    id: 'fut_lance_construcao', trajetoria: 'futebol', peso: () => 2,
    cabe: v => fut(v) && CONSTRUCAO.includes(posDe(v)),
    contexto: contextoDeJogo,
    titulo: 'Um lance',
    texto: (v, d) => `${abertura(v, d)} A bola chega no seu pé, de frente para o jogo. Lá na frente, um passe difícil — entre dois zagueiros — está aberto por um segundo.`,
    intencoes: [
      { id: 'arriscar', texto: 'Tentar o passe arriscado', dica: 'Pode decidir o jogo — ou virar contra-ataque.', risco: 0.6, fatores: (v, d) => [tecnicaFut(v), leitura(v), cabeca(v, d)],
        desfechos: {
          otimo: { texto: (_v, d) => `O passe atravessou a defesa e o atacante só empurrou.${placarDepois(d, true)}`, efeitos: { nome: 3, confianca: 1, assistencias: 1, noto: 1, humor: 4 }, memoria: (_v, d) => (memoravel(d) ? `Deu a assistência decisiva aos ${d.minuto} minutos de ${d.jogo === 'decisão' ? 'uma decisão' : 'um clássico'}, ${peloClube(String(d.clube))}.` : `Deu uma assistência que mudou um jogo aos ${d.minuto} minutos.`) },
          bom: { texto: 'O passe chegou — e o atacante mandou por cima. Mas a jogada ficou: o treinador bateu palmas na beira do campo.', efeitos: { nome: 1, confianca: 1 } },
          ruim: { texto: 'A bola bateu no zagueiro. Ninguém aproveitou, mas a jogada morreu ali.', efeitos: { nome: -1 } },
          pessimo: { texto: (_v, d) => `Interceptado — e o contra-ataque terminou no gol deles${d.placar === 'vence por 1 a 0' ? ': empate' : ''}. Na saída, ninguém falou com você.`, efeitos: { nome: -2, confianca: -1, estresse: 5, humor: -3 } }
        } },
      { id: 'simples', texto: 'Jogar simples e manter a posse', dica: 'Quase nunca dá errado. Quase nunca decide.', risco: 0.12, fatores: (v, d) => [leitura(v), disciplina(v), cabeca(v, d)],
        desfechos: {
          otimo: { texto: 'Tocou de lado, o time girou a bola, e três passes depois saiu o gol. Ninguém lembrou do seu toque; o treinador lembrou.', efeitos: { nome: 1, confianca: 1 } },
          bom: { texto: 'Segurou a bola, o time respirou. O jogo seguiu como estava.', efeitos: {} },
          ruim: { texto: 'A posse se perdeu no meio-campo logo depois. A chance passou.', efeitos: { nome: -1 } },
          pessimo: { texto: 'O recuo saiu fraco e quase deu o gol deles. O goleiro salvou — e olhou para você.', efeitos: { nome: -1, estresse: 3 } }
        } },
      { id: 'carregar', texto: 'Carregar a bola até a área', dica: 'Pede perna e técnica — e o fim de jogo cobra o fôlego.', risco: 0.45, fatores: (v, d) => [tecnicaFut(v), folego(v, d), coragem(v)],
        desfechos: {
          otimo: { texto: (_v, d) => `Passou por um, por dois — e bateu cruzado.${placarDepois(d, true)} O estádio veio abaixo.`, efeitos: { nome: 3, confianca: 1, gols: 1, noto: 1, humor: 5 }, memoria: (_v, d) => `Fez um gol de arrancada aos ${d.minuto} minutos${memoravel(d) ? ` de ${d.jogo === 'decisão' ? 'uma decisão' : 'um clássico'}` : ''}.` },
          bom: { texto: 'Arrancou e sofreu a falta na entrada da área. A cobrança passou perto.', efeitos: { nome: 1 } },
          ruim: { texto: 'As pernas não acompanharam: perdeu a bola na intermediária.', efeitos: { nome: -1, estresse: 2 } },
          pessimo: { texto: 'Perdeu a bola sozinho, o contra-ataque pegou o time aberto. Gol deles.', efeitos: { nome: -2, confianca: -1, estresse: 4 } }
        } },
      { id: 'procurar', texto: 'Procurar outro companheiro', dica: 'Depende de ler o jogo antes da bola chegar.', risco: 0.3, fatores: v => [leitura(v), tecnicaFut(v)],
        desfechos: {
          otimo: { texto: (_v, d) => `Viu o lateral livre do outro lado. O cruzamento veio na medida — gol.${placarDepois(d, true)}`, efeitos: { nome: 2, assistencias: 1, confianca: 1 } },
          bom: { texto: 'Abriu o jogo do outro lado; a jogada rendeu um escanteio.', efeitos: {} },
          ruim: { texto: 'Quando levantou a cabeça, a marcação já tinha fechado. Tocou para trás.', efeitos: {} },
          pessimo: { texto: 'O passe para o lado saiu nas costas do companheiro. Lateral para eles.', efeitos: { nome: -1 } }
        } }
    ]
  },
  {
    id: 'fut_lance_ataque', trajetoria: 'futebol', peso: () => 2,
    cabe: v => fut(v) && ATAQUE.includes(posDe(v)),
    contexto: contextoDeJogo,
    titulo: 'Um lance',
    texto: (v, d) => `${abertura(v, d)} A bola sobra na entrada da área. Um zagueiro vem fechando; um companheiro entra livre pela esquerda.`,
    intencoes: [
      { id: 'chutar', texto: 'Chutar de primeira', dica: 'Se entrar, é gol de placa. Se não entrar, é bola perdida.', risco: 0.6, fatores: (v, d) => [tecnicaFut(v), cabeca(v, d), coragem(v)],
        desfechos: {
          otimo: { texto: (_v, d) => `Pegou de primeira, no ângulo.${placarDepois(d, true)}`, efeitos: { nome: 3, gols: 1, noto: 1, confianca: 1, humor: 5 }, memoria: (_v, d) => `Fez um gol de primeira, no ângulo, aos ${d.minuto} minutos${memoravel(d) ? ` de ${d.jogo === 'decisão' ? 'uma decisão' : 'um clássico'}` : ''}.` },
          bom: { texto: 'Pegou bem. O goleiro buscou no canto — escanteio.', efeitos: { nome: 1 } },
          ruim: { texto: 'A bola subiu demais. Arquibancada.', efeitos: {} },
          pessimo: { texto: 'Furou. A bola sobrou para eles, e o contra-ataque quase custou caro. O apelido do dia não foi bom.', efeitos: { nome: -2, estresse: 4, imagem: 'polemica' } }
        } },
      { id: 'driblar', texto: 'Driblar o zagueiro', dica: 'Pede perna no fim do jogo.', risco: 0.45, fatores: (v, d) => [tecnicaFut(v), folego(v, d)],
        desfechos: {
          otimo: { texto: (_v, d) => `Cortou para dentro, deixou o zagueiro no chão e bateu na saída do goleiro.${placarDepois(d, true)}`, efeitos: { nome: 3, gols: 1, confianca: 1 } },
          bom: { texto: 'Passou do zagueiro e sofreu o pênalti. Outro bateu — e fez.', efeitos: { nome: 2, confianca: 1 } },
          ruim: { texto: 'O zagueiro chegou antes.', efeitos: {} },
          pessimo: { texto: 'Perdeu a bola tentando o drible a mais, e o treinador gesticulou para o banco.', efeitos: { nome: -2, confianca: -1 } }
        } },
      { id: 'tocar', texto: 'Tocar para o companheiro livre', dica: 'O gol pode ser dele — o jogo, do time.', risco: 0.25, fatores: v => [leitura(v), tecnicaFut(v)],
        desfechos: {
          otimo: { texto: (_v, d) => `Rolou na medida, e o companheiro só empurrou.${placarDepois(d, true)}`, efeitos: { nome: 2, assistencias: 1, confianca: 1 } },
          bom: { texto: 'O passe chegou; o goleiro defendeu o chute dele.', efeitos: { nome: 1 } },
          ruim: { texto: 'O passe saiu um pouco atrás. A chance esfriou.', efeitos: {} },
          pessimo: { texto: 'Interceptado. Da arquibancada, gritaram que era para chutar.', efeitos: { nome: -1, estresse: 2 } }
        } }
    ]
  },
  {
    id: 'fut_lance_goleiro', trajetoria: 'futebol', peso: () => 2,
    cabe: v => fut(v) && posDe(v) === 'goleiro',
    contexto: contextoDeJogo,
    titulo: 'Um lance',
    texto: (v, d) => `${abertura(v, d)} Um cruzamento alto vem fechando na sua área; o centroavante deles sobe junto.`,
    intencoes: [
      { id: 'sair', texto: 'Sair do gol e socar a bola', dica: 'Se chegar antes, resolve. Se não chegar, o gol fica vazio.', risco: 0.55, fatores: (v, d) => [tecnicaFut(v), coragem(v), cabeca(v, d)],
        desfechos: {
          otimo: { texto: 'Chegou antes de todo mundo e mandou a bola para o meio-campo. O estádio aplaudiu.', efeitos: { nome: 2, confianca: 1, defesa: 0 } },
          bom: { texto: 'Socou para a lateral. Respiro.', efeitos: { nome: 1 } },
          ruim: { texto: 'Tocou de leve; a defesa afastou o rebote.', efeitos: {} },
          pessimo: { texto: 'Não alcançou. Gol de cabeça, gol vazio, e a imprensa repetiu o lance a semana inteira.', efeitos: { nome: -3, confianca: -1, estresse: 6, imagem: 'polemica' } }
        } },
      { id: 'linha', texto: 'Ficar na linha e esperar a cabeçada', dica: 'Mais seguro — depende do reflexo.', risco: 0.25, fatores: (v, d) => [tecnicaFut(v), cabeca(v, d)],
        desfechos: {
          otimo: { texto: 'Cabeçada no canto — e a sua mão estava lá. Defesa de jogo inteiro.', efeitos: { nome: 3, confianca: 1, noto: 1 }, memoria: 'Fez uma defesa que segurou um resultado no fim do jogo.' },
          bom: { texto: 'A cabeçada saiu fraca, encaixou fácil.', efeitos: {} },
          ruim: { texto: 'Espalmou para o lado; escanteio, sufoco.', efeitos: {} },
          pessimo: { texto: 'A bola passou entre as mãos. Gol.', efeitos: { nome: -2, estresse: 4 } }
        } }
    ]
  },
  {
    id: 'fut_posicao', trajetoria: 'futebol', peso: () => 0.6,
    cabe: v => fut(v) && ['meia', 'volante', 'lateral', 'ponta', 'atacante', 'zagueiro'].includes(posDe(v)) && idade(v) >= 21,
    contexto: (v, r) => { const p = posDe(v); const viz: Partial<Record<Posicao, Posicao[]>> = { meia: ['volante', 'ponta'], volante: ['zagueiro', 'meia'], lateral: ['ponta', 'zagueiro'], ponta: ['lateral', 'atacante'], atacante: ['ponta'], zagueiro: ['volante', 'lateral'] }; return { nova: r.pick(viz[p] ?? ['meia']) }; },
    titulo: 'Outra posição',
    texto: (v, d) => `O treinador chamou você no canto do treino: quer testar você como ${nomePosicao(v, d.nova as Posicao)}. "O time precisa disso."`,
    intencoes: [
      { id: 'aceitar', texto: _v => `Aceitar e se dedicar à posição nova`, dica: 'A posição muda: o que a temporada mede e o corpo pede também.', risco: 0.35, fatores: v => [leitura(v), tecnicaFut(v), disciplina(v)],
        desfechos: {
          otimo: { texto: (v, d) => `Em um mês, parecia que você sempre tinha jogado ali. ${cap(nomePosicao(v, d.nova as Posicao))}, agora.`, efeitos: { nome: 2, confianca: 1, extra: (v, d) => { v.caminhos.esporte!.posicao = d.nova as Posicao; } }, memoria: (v, d) => `Virou ${nomePosicao(v, d.nova as Posicao)} a pedido do treinador — e deu certo.` },
          bom: { texto: 'Levou um tempo, mas encaixou.', efeitos: { confianca: 1, extra: (v, d) => { v.caminhos.esporte!.posicao = d.nova as Posicao; } } },
          ruim: { texto: 'Não encaixou. Depois de umas semanas, voltou para a sua posição — sem ressentimento, mas sem ganhar nada.', efeitos: {} },
          pessimo: { texto: 'Foi mal na posição nova e perdeu a vaga para quem já jogava ali.', efeitos: { nome: -2, confianca: -1, estresse: 4 } }
        } },
      { id: 'recusar', texto: 'Dizer que rende mais onde está', dica: 'O treinador pode respeitar — ou não.', risco: 0.4, fatores: v => [nomeFut(v), social(v), tecnicaFut(v)],
        desfechos: {
          otimo: { texto: 'Ele ouviu, e no domingo você jogou onde queria — e jogou bem.', efeitos: { nome: 1, confianca: 1 } },
          bom: { texto: 'Ele aceitou. Pediu outro para testar.', efeitos: {} },
          ruim: { texto: 'Ele aceitou, mas a conversa esfriou.', efeitos: { confianca: -1 } },
          pessimo: { texto: '"Então fica no banco." E ficou.', efeitos: { confianca: -1, nome: -1, estresse: 4 } }
        } }
    ]
  },
  {
    id: 'fut_jornalista', trajetoria: 'futebol', peso: v => ((v.notoriedade?.valor ?? 0) >= 20 ? 1 : 0.4),
    cabe: v => fut(v) && (v.caminhos.esporte?.nivel ?? 1) >= 3,
    titulo: 'A pergunta difícil',
    texto: v => `Depois de uma derrota feia, na zona mista, um repórter pergunta se ${v.caminhos.esporte?.espaco === 'reserva' ? 'você acha justo ficar no banco' : 'o elenco ainda acredita no treinador'}. As câmeras estão ligadas.`,
    intencoes: [
      { id: 'franqueza', texto: 'Responder com franqueza', dica: 'Pode ganhar o público — e perder o vestiário.', risco: 0.55, fatores: v => [social(v), leitura(v), cabeca(v)],
        desfechos: {
          otimo: { texto: 'A resposta foi honesta e serena; o vídeo circulou como exemplo de maturidade.', efeitos: { imagem: 'boa', noto: 1, nome: 1 } },
          bom: { texto: 'Disse o que pensava, com cuidado. Passou.', efeitos: {} },
          ruim: { texto: 'A frase saiu mais dura do que você queria. O treinador não gostou.', efeitos: { confianca: -1 } },
          pessimo: { texto: 'A manchete do dia seguinte foi a sua frase. O clube mandou nota; o vestiário ficou estranho.', efeitos: { imagem: 'polemica', confianca: -1, estresse: 6, nome: -1 } }
        } },
      { id: 'diplomacia', texto: 'Responder com diplomacia', dica: 'Não rende manchete. Nem para o bem.', risco: 0.1, fatores: v => [social(v), leitura(v)],
        desfechos: {
          otimo: { texto: '"Vamos trabalhar." Ninguém lembrou, que era a ideia.', efeitos: {} },
          bom: { texto: 'Resposta pronta, sem notícia.', efeitos: {} },
          ruim: { texto: 'Chamaram de resposta ensaiada — sem maldade.', efeitos: {} },
          pessimo: { texto: 'A torcida achou que você estava se escondendo.', efeitos: { estresse: 2 } }
        } },
      { id: 'criticar', texto: 'Criticar o clube', dica: 'Tudo ou nada.', risco: 0.8, fatores: v => [nomeFut(v), coragem(v)],
        desfechos: {
          otimo: { texto: 'A torcida concordou com você, e o clube mexeu no que você apontou.', efeitos: { imagem: 'boa', noto: 2, nome: 1 } },
          bom: { texto: 'A crítica foi ouvida — em silêncio.', efeitos: {} },
          ruim: { texto: 'Multa interna e um sermão da diretoria.', efeitos: { confianca: -1, dinheiro: -3000 } },
          pessimo: { texto: 'Afastado por uma semana. O empresário teve de pedir desculpas por você.', efeitos: { confianca: -1, nome: -3, imagem: 'polemica', estresse: 8 } }
        } }
    ]
  },
  {
    id: 'fut_torcida', trajetoria: 'futebol', peso: () => 0.8,
    cabe: v => { const t = v.caminhos.esporte?.temporadas?.slice(-1)[0]; return fut(v) && !!t && t.nota < 6; },
    titulo: 'A torcida',
    texto: () => 'A temporada não vai bem, e o seu nome virou alvo: vaia na entrada, xingamento nas redes, uma faixa no portão do treino.',
    intencoes: [
      { id: 'responder', texto: 'Responder nas redes', dica: 'O público decide se foi coragem ou provocação.', risco: 0.65, fatores: v => [social(v), cabeca(v)],
        desfechos: {
          otimo: { texto: 'A resposta, com humor, virou o jogo: a torcida riu junto.', efeitos: { imagem: 'boa', estresse: -2 } },
          bom: { texto: 'Parte entendeu, parte não. Esfriou.', efeitos: {} },
          ruim: { texto: 'Virou briga de comentários. Cansativo.', efeitos: { estresse: 4 } },
          pessimo: { texto: 'A resposta foi lida como deboche. A vaia dobrou.', efeitos: { imagem: 'polemica', estresse: 8, confianca: -1 } }
        } },
      { id: 'silencio', texto: 'Ficar em silêncio e treinar', dica: 'A resposta é o jogo — se o jogo vier.', risco: 0.2, fatores: v => [disciplina(v), tecnicaFut(v), cabeca(v)],
        desfechos: {
          otimo: { texto: 'Duas boas partidas depois, a vaia virou aplauso.', efeitos: { nome: 2, estresse: -3 } },
          bom: { texto: 'Aos poucos, o assunto passou.', efeitos: {} },
          ruim: { texto: 'A cobrança continuou por semanas.', efeitos: { estresse: 4 } },
          pessimo: { texto: 'O silêncio não segurou nada: o treinador tirou você do time "para preservar".', efeitos: { confianca: -1, estresse: 5 } }
        } },
      { id: 'conversar', texto: 'Ir conversar com a organizada', dica: 'Pode acalmar — ou ficar feio.', risco: 0.5, fatores: v => [social(v), coragem(v), lideranca(v)],
        desfechos: {
          otimo: { texto: 'Uma conversa franca no portão. Na rodada seguinte, cantaram o seu nome.', efeitos: { imagem: 'boa', estresse: -3, nome: 1 } },
          bom: { texto: 'Ouviram, sem prometer nada.', efeitos: {} },
          ruim: { texto: 'A conversa não andou.', efeitos: { estresse: 2 } },
          pessimo: { texto: 'A conversa virou empurra-empurra, e o vídeo correu.', efeitos: { imagem: 'polemica', estresse: 8 } }
        } }
    ]
  },
  {
    id: 'fut_jovem', trajetoria: 'futebol', peso: () => 0.8,
    cabe: v => fut(v) && idade(v) >= 29 && v.caminhos.esporte?.espaco === 'titular',
    titulo: 'Um garoto na sua vaga',
    texto: v => `Subiu da base um garoto de dezoito anos que joga na sua posição — e o treinador gosta dele. ${idade(v) >= 32 ? 'A imprensa já pergunta quando ele vai assumir.' : ''}`.trim(),
    intencoes: [
      { id: 'mentor', texto: 'Ajudar o garoto', dica: 'O vestiário repara em quem ensina — o banco também pode vir.', risco: 0.25, fatores: v => [social(v), lideranca(v)],
        desfechos: {
          otimo: { texto: 'Virou referência para ele e para o elenco. O treinador passou a ouvir você nas preleções.', efeitos: { nome: 2, confianca: 1, humor: 3 }, memoria: 'Ajudou a formar um garoto que chegou para disputar a sua vaga.' },
          bom: { texto: 'Uma amizade de vestiário. O garoto agradece em entrevista.', efeitos: { humor: 2 } },
          ruim: { texto: 'Ele aprendeu rápido — e ficou com a vaga.', efeitos: { confianca: -1 } },
          pessimo: { texto: 'Ele assumiu a posição, e você ficou sem lugar e sem papel claro.', efeitos: { confianca: -1, nome: -2, estresse: 5 } }
        } },
      { id: 'competir', texto: 'Competir pela vaga a cada treino', dica: 'Pede técnica e fôlego que a idade cobra.', risco: 0.45, fatores: (v, d) => [tecnicaFut(v), folego(v, d), F('idade', -(idade(v) - 28) / 25)],
        desfechos: {
          otimo: { texto: 'Treinou como aos vinte e mostrou por que é titular.', efeitos: { nome: 2, confianca: 1 } },
          bom: { texto: 'Segurou a vaga, por enquanto.', efeitos: { confianca: 1 } },
          ruim: { texto: 'O revezamento começou: um jogo cada.', efeitos: { estresse: 3 } },
          pessimo: { texto: 'Forçou demais e o corpo reclamou. O garoto entrou e não saiu mais.', efeitos: { confianca: -1, estresse: 6 } }
        } }
    ]
  },
  {
    id: 'fut_capitania', trajetoria: 'futebol', peso: () => 1,
    cabe: v => { const es = v.caminhos.esporte; const anos = (es?.temporadas ?? []).filter(t => t.clube === es?.clube).length; return fut(v) && !!es && es.espaco === 'titular' && idade(v) >= 25 && (es.reputacao ?? 0) >= 55 && anos >= 2 && !(v.caminhos.palmares ?? []).some(x => x.tipo === 'marco' && x.clube === es.clube && /braçadeira/.test(x.texto)); },
    titulo: 'A braçadeira',
    texto: v => `O capitão ${doClube(v.caminhos.esporte!.clube)} saiu, e o treinador quer saber se você topa usar a braçadeira.`,
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar a braçadeira', dica: 'Liderar é também responder pelo time quando ele vai mal.', risco: 0.3, fatores: v => [lideranca(v), social(v), nomeFut(v)],
        desfechos: {
          otimo: { texto: 'O vestiário abraçou a escolha. Você virou a voz do time.', efeitos: { nome: 3, confianca: 1, humor: 4, extra: v => capitania(v) }, memoria: v => `Virou ${flex(ge(v), 'o capitão', 'a capitã', 'o capitão')} ${doClube(v.caminhos.esporte!.clube)}.` },
          bom: { texto: 'Assumiu a braçadeira. O peso veio junto.', efeitos: { nome: 1, estresse: 3, extra: v => capitania(v) } },
          ruim: { texto: 'Usou a braçadeira, mas uma parte do elenco não engoliu.', efeitos: { estresse: 5, extra: v => capitania(v) } },
          pessimo: { texto: 'A escolha rachou o vestiário; um mês depois, a braçadeira voltou para o antigo vice.', efeitos: { nome: -1, estresse: 7 } }
        } },
      { id: 'recusar', texto: 'Recusar: prefere liderar sem braçadeira', dica: 'Nada muda — nem o peso.', risco: 0.1, fatores: v => [social(v)],
        desfechos: {
          otimo: { texto: 'Ninguém entendeu como desfeita.', efeitos: {} },
          bom: { texto: 'Outro assumiu. Você seguiu sendo quem era.', efeitos: {} },
          ruim: { texto: 'O treinador achou estranho.', efeitos: {} },
          pessimo: { texto: 'Leram como falta de compromisso.', efeitos: { confianca: -1 } }
        } }
    ]
  },
  {
    id: 'fut_rebaixamento', trajetoria: 'futebol', peso: () => 1.2,
    cabe: v => { const es = v.caminhos.esporte; const t = es?.temporadas?.slice(-1)[0]; return fut(v) && !!t && t.colocacao >= 14 && t.colocacao <= 16 && (es?.nivel ?? 1) >= 2; },
    titulo: 'A reta final',
    texto: () => 'Faltam quatro rodadas, e o time está a um ponto da zona de rebaixamento. No vestiário, ninguém fala alto.',
    intencoes: [
      { id: 'assumir', texto: 'Chamar a responsabilidade', dica: 'Se der certo, é lembrado por anos. Se der errado, também.', risco: 0.6, fatores: v => [lideranca(v), tecnicaFut(v), cabeca(v)],
        desfechos: {
          otimo: { texto: 'Duas vitórias seguidas com você no centro de tudo. O time escapou, e a torcida cantou o seu nome.', efeitos: { nome: 3, noto: 1, humor: 6 }, memoria: 'Chamou a responsabilidade na reta final e ajudou o time a escapar do rebaixamento.' },
          bom: { texto: 'Jogou o que sabia e o time respirou.', efeitos: { nome: 1 } },
          ruim: { texto: 'Lutou, mas o time seguiu tropeçando.', efeitos: { estresse: 4 } },
          pessimo: { texto: 'Errou o lance que decidiu a rodada, e a culpa caiu em você.', efeitos: { nome: -2, estresse: 8, imagem: 'polemica' } }
        } },
      { id: 'seu_jogo', texto: 'Fazer o seu jogo, sem inventar', dica: 'Menos holofote, menos risco.', risco: 0.15, fatores: v => [disciplina(v), tecnicaFut(v)],
        desfechos: {
          otimo: { texto: 'Partidas sóbrias, sem erro. O time ficou.', efeitos: { nome: 1 } },
          bom: { texto: 'Cumpriu o papel.', efeitos: {} },
          ruim: { texto: 'O time afundou um pouco mais.', efeitos: { estresse: 3 } },
          pessimo: { texto: 'Cobrado por "não aparecer" na hora difícil.', efeitos: { nome: -1, estresse: 3 } }
        } }
    ]
  }
];

function capitania(v: Vida): void {
  const es = v.caminhos.esporte!;
  registrarConquista(v, { tipo: 'marco', modalidade: 'futebol', ano: anoDe(v.t - 6), competicao: 'clube', clube: es.clube, texto: `Recebeu a braçadeira de ${flex(ge(v), 'capitão', 'capitã', 'capitão')} ${doClube(es.clube)}` });
  marcar(v, 'lideranca', `${flex(ge(v), 'Capitão', 'Capitã', 'Capitão')} ${doClube(es.clube)}.`, 2, { dominio: 'futebol' });
}

/* ------------------------------------------------------------ Medicina, academia, cena, negócio, emprego */

/** Desfechos padronizados quando o texto muda e a consequência segue o mesmo desenho. */
const D = (otimo: string, bom: string, ruim: string, pessimo: string, ef: Partial<Record<Desfecho, Efeitos>> = {}, mem: Partial<Record<Desfecho, string>> = {}): Record<Desfecho, DesfechoModelo> => ({
  otimo: { texto: otimo, efeitos: { nome: 2, humor: 3, ...ef.otimo }, memoria: mem.otimo },
  bom: { texto: bom, efeitos: { nome: 1, ...ef.bom }, memoria: mem.bom },
  ruim: { texto: ruim, efeitos: { estresse: 3, ...ef.ruim }, memoria: mem.ruim },
  pessimo: { texto: pessimo, efeitos: { nome: -2, estresse: 6, ...ef.pessimo }, memoria: mem.pessimo }
});

const MODELOS_PROFISSOES: ModeloSituacao[] = [
  /* Medicina: decisões dentro da competência do personagem — nenhuma conduta clínica real é ensinada. */
  { id: 'med_caso', trajetoria: 'medicina', cabe: () => true,
    titulo: 'Um caso difícil', texto: () => 'Um paciente chega com um quadro que não fecha: os exames dizem uma coisa, o corpo dele outra. A fila do plantão não para.',
    intencoes: [
      { id: 'protocolo', texto: 'Seguir o protocolo à risca', dica: 'Protege você. Às vezes não basta.', risco: 0.15, fatores: v => [competencia(v), disciplina(v)], desfechos: D('O protocolo pegou o que precisava ser pego. O paciente saiu bem.', 'Conduta correta; o caso seguiu para a especialidade.', 'O quadro piorou antes de melhorar; você ficou com a dúvida.', 'O protocolo não cobriu o caso. Ninguém errou — e mesmo assim deu errado.') },
      { id: 'ajuda', texto: 'Chamar um colega mais experiente', dica: 'Aprende-se; e ninguém decide sozinho.', risco: 0.2, fatores: v => [social(v), competencia(v), clima(v)], desfechos: D('A conversa com o colega abriu o caso. Vocês acertaram juntos.', 'O colega confirmou o que você pensava.', 'O colega estava ocupado demais para ajudar.', 'O colega disse que era bobagem — e não era.', {}, { otimo: 'Resolveu um caso difícil no plantão junto com um colega mais experiente.' }) },
      { id: 'investigar', texto: 'Investigar além do óbvio', dica: 'Pode ser o diagnóstico da carreira — ou horas perdidas.', risco: 0.5, fatores: v => [competencia(v), leitura(v), cabeca(v)], desfechos: D('Você pegou o que ninguém tinha visto. O caso virou discussão na reunião clínica.', 'A investigação confirmou o diagnóstico mais simples.', 'Horas a mais no plantão para chegar ao mesmo lugar.', 'Enquanto você investigava, outro paciente esperou demais. A chefia cobrou.', { otimo: { nome: 3 }, pessimo: { clima: -6 } }, { otimo: 'Fechou um diagnóstico que ninguém tinha visto — e o caso virou aula na reunião clínica.' }) }
    ] },
  { id: 'med_familia', trajetoria: 'medicina', cabe: () => true,
    titulo: 'A família do paciente', texto: () => 'A família de um paciente grave quer outra conduta, aos gritos, no corredor. Um deles grava com o celular.',
    intencoes: [
      { id: 'explicar', texto: 'Parar e explicar com calma', dica: 'Leva tempo. Pode acalmar.', risco: 0.3, fatores: v => [social(v), cabeca(v)], desfechos: D('A família entendeu, e depois voltou para agradecer.', 'O tom baixou.', 'Explicou, mas ninguém ouviu.', 'O vídeo do corredor circulou — editado.', { pessimo: { imagem: 'polemica' } }) },
      { id: 'encaminhar', texto: 'Encaminhar para a ouvidoria e a assistente social', dica: 'Correto e frio.', risco: 0.1, fatores: v => [disciplina(v)], desfechos: D('O hospital mediou, e a conduta seguiu.', 'Encaminhado. Seguiu o plantão.', 'A família saiu com a sensação de ter sido despachada.', 'Fizeram uma reclamação formal.') },
      { id: 'ceder', texto: 'Ceder em parte ao pedido', dica: 'Pode não ser o certo.', risco: 0.55, fatores: v => [competencia(v), leitura(v)], desfechos: D('Encontrou uma conduta que atendia a família e o paciente.', 'Uma concessão sem prejuízo.', 'A conduta ficou pior do que você queria.', 'A concessão virou problema na auditoria.', { pessimo: { clima: -8 } }) }
    ] },
  { id: 'med_plantao', trajetoria: 'medicina', cabe: v => v.mente.estresse >= 40,
    titulo: 'O plantão que não acaba', texto: () => 'Trinta horas acordado. O colega que ia render você ligou dizendo que não vem.',
    intencoes: [
      { id: 'ficar', texto: 'Ficar e segurar o plantão', dica: 'O cansaço erra.', risco: 0.5, fatores: v => [F('corpo', (v.corpo.saude - 60) / 80), cabeca(v)], desfechos: D('Segurou. No dia seguinte, a chefia sabia o nome de quem ficou.', 'Segurou, no limite.', 'Saiu sem lembrar do caminho para casa.', 'Um erro de prescrição pego a tempo pela enfermagem — o susto não passa.', { otimo: { clima: 5, estresse: 6 }, bom: { estresse: 8 }, ruim: { estresse: 10 }, pessimo: { estresse: 12, clima: -4 } }) },
      { id: 'passar', texto: 'Avisar a coordenação e passar o plantão', dica: 'Seguro para os pacientes; a chefia pode não gostar.', risco: 0.15, fatores: v => [social(v), clima(v)], desfechos: D('A coordenação achou alguém e agradeceu o aviso.', 'Arrumaram um substituto.', 'Ficou mais duas horas esperando.', 'A coordenação anotou como "abandono". Não era.', { pessimo: { clima: -8 } }) }
    ] },
  { id: 'aca_revisao', trajetoria: 'academia', cabe: () => true,
    titulo: 'Os revisores', texto: () => 'O artigo voltou da revista com três pareceres. Um gostou. Dois pedem um experimento que levaria um ano.',
    intencoes: [
      { id: 'refazer', texto: 'Refazer o que pedem', dica: 'Um ano a mais — e o artigo mais forte.', risco: 0.2, fatores: v => [disciplina(v), competencia(v)], desfechos: D('O artigo saiu, melhor, numa revista de peso.', 'Saiu, um ano depois.', 'O experimento novo não confirmou tudo.', 'Um ano depois, outro grupo publicou primeiro.', { otimo: { extra: v => { vidaAcademica(v).publicacoes += 1; } }, bom: { extra: v => { vidaAcademica(v).publicacoes += 1; } } }, { otimo: 'Publicou numa revista de peso depois de refazer o que os revisores pediram.' }) },
      { id: 'contestar', texto: 'Contestar os pareceres', dica: 'Às vezes o editor concorda.', risco: 0.55, fatores: v => [leitura(v), coragem(v), competencia(v)], desfechos: D('O editor concordou com você. Aceito.', 'Uma rodada a mais, e aceito.', 'Recusado.', 'Recusado — e o editor ficou com o seu nome.', { otimo: { extra: v => { vidaAcademica(v).publicacoes += 1; } }, bom: { extra: v => { vidaAcademica(v).publicacoes += 1; } } }) },
      { id: 'outra', texto: 'Mandar para outra revista', dica: 'Mais rápido; com menos alcance.', risco: 0.3, fatores: v => [competencia(v)], desfechos: D('Aceito de primeira na outra revista.', 'Aceito, numa revista menor.', 'Recusado de novo.', 'Recusado duas vezes. O artigo foi para a gaveta.', { otimo: { extra: v => { vidaAcademica(v).publicacoes += 1; } }, bom: { extra: v => { vidaAcademica(v).publicacoes += 1; } } }) }
    ] },
  { id: 'aca_orientando', trajetoria: 'academia', cabe: v => vidaAcademica(v).orientandos.length > 0 || vidaAcademica(v).orientacoes > 0,
    titulo: 'Um orientando em crise', texto: () => 'Um orientando aparece na sua sala dizendo que vai desistir: a bolsa atrasou, o experimento não sai, a cabeça não aguenta.',
    intencoes: [
      { id: 'acolher', texto: 'Acolher e reorganizar o plano com ele', dica: 'Tempo seu. Pode salvar a pesquisa — e a pessoa.', risco: 0.25, fatores: v => [social(v), competencia(v)], desfechos: D('Ele terminou — e agradeceu você na dedicatória.', 'Ele seguiu, mais devagar.', 'Ele trancou por um semestre.', 'Ele desistiu mesmo assim.', { otimo: { humor: 5 } }, { otimo: 'Ajudou um orientando que ia desistir a chegar ao fim.' }) },
      { id: 'cobrar', texto: 'Cobrar prazo e resultado', dica: 'Alguns respondem bem à pressão.', risco: 0.5, fatores: v => [disciplina(v), clima(v)], desfechos: D('A cobrança deu norte; ele terminou antes do prazo.', 'Ele voltou a produzir.', 'Ele sumiu por semanas.', 'Ele foi à coordenação reclamar da orientação.', { pessimo: { clima: -6 } }) }
    ] },
  { id: 'aca_edital', trajetoria: 'academia', cabe: () => true,
    titulo: 'O edital', texto: () => 'Abriu um edital de pesquisa: dá para mandar um projeto ambicioso, que mudaria o laboratório, ou um seguro, que mantém o grupo andando.',
    intencoes: [
      { id: 'ambicioso', texto: 'Mandar o ambicioso', dica: 'Muito dinheiro — e muita concorrência.', risco: 0.65, fatores: v => [competencia(v), F('produção', (vidaAcademica(v).publicacoes - 6) / 20)], desfechos: D('Aprovado. O laboratório ganhou equipamento e bolsas.', 'Aprovado com corte no orçamento.', 'Não aprovado — "mérito, mas sem recurso".', 'Não aprovado, e o seguro também não foi mandado. Um ano no aperto.', { otimo: { extra: v => { vidaAcademica(v).financiamentos += 1; } }, bom: { extra: v => { vidaAcademica(v).financiamentos += 1; } } }, { otimo: 'Ganhou um edital grande de pesquisa e montou o laboratório que queria.' }) },
      { id: 'seguro', texto: 'Mandar o seguro', dica: 'Mais chance, menos mudança.', risco: 0.15, fatores: v => [competencia(v)], desfechos: D('Aprovado e elogiado.', 'Aprovado.', 'Ficou na lista de espera.', 'Não aprovado.', { otimo: { extra: v => { vidaAcademica(v).financiamentos += 1; } }, bom: { extra: v => { vidaAcademica(v).financiamentos += 1; } } }) }
    ] },
  { id: 'cena_dificil', trajetoria: 'cena', cabe: () => true,
    titulo: 'A cena difícil', texto: () => 'A cena mais difícil do trabalho: a décima tomada não saiu, e a equipe olha o relógio.',
    intencoes: [
      { id: 'repetir', texto: 'Pedir mais uma e repetir até sair', dica: 'Desgasta todo mundo; às vezes sai a melhor.', risco: 0.4, fatores: v => [disciplina(v), F('técnica', (habilidade(v, 'teatro') - 60) / 40)], desfechos: D('A décima primeira foi a que entrou no corte — e a que todo mundo comentou.', 'Saiu, na décima segunda.', 'Saiu, mas ninguém ficou contente.', 'A diretora encerrou o dia; a cena foi cortada do roteiro.') },
      { id: 'improvisar', texto: 'Improvisar', dica: 'Pode virar a melhor cena. Pode virar bronca.', risco: 0.65, fatores: v => [coragem(v), F('técnica', (habilidade(v, 'teatro') - 60) / 40), leitura(v)], desfechos: D('O improviso virou a cena que o público lembra.', 'A diretora gostou de uma parte.', 'Não usaram.', '"Não é o seu filme." O clima no set pesou.', { otimo: { noto: 1 }, pessimo: { clima: -6 } }, { otimo: 'Um improviso seu virou a cena mais lembrada de um trabalho.' }) },
      { id: 'direcao', texto: 'Pedir uma conversa com a direção', dica: 'Ajuda quem sabe ouvir.', risco: 0.2, fatores: v => [social(v), leitura(v)], desfechos: D('Cinco minutos de conversa destravaram tudo.', 'Uma indicação simples resolveu.', 'A conversa não ajudou.', 'A diretora achou que você estava discutindo o roteiro.') }
    ] },
  { id: 'cena_conflito', trajetoria: 'cena', cabe: () => true,
    titulo: 'Conflito no set', texto: () => 'Um colega de elenco vive atrasando, mudando falas, provocando. Hoje, a provocação foi com você.',
    intencoes: [
      { id: 'enfrentar', texto: 'Enfrentar ali mesmo', dica: 'Resolve rápido — ou vira história de bastidor.', risco: 0.6, fatores: v => [coragem(v), cabeca(v)], desfechos: D('O colega recuou, e o set agradeceu em silêncio.', 'A conversa foi dura, e funcionou.', 'Virou uma tarde inteira de clima ruim.', 'A briga vazou para a imprensa.', { pessimo: { imagem: 'polemica' } }) },
      { id: 'produtora', texto: 'Levar à produção', dica: 'O caminho formal.', risco: 0.2, fatores: v => [social(v), clima(v)], desfechos: D('A produção conversou com ele. Mudou.', 'Foi registrado.', 'Nada mudou.', 'A produção achou que o problema era você.') }
    ] },
  { id: 'neg_cliente', trajetoria: 'negocio', cabe: () => true,
    titulo: 'Um cliente grande', texto: () => 'Um cliente grande quer fechar um pedido que dobraria o mês — com desconto de trinta por cento e prazo de noventa dias.',
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar as condições', dica: 'Volume agora, caixa apertado depois.', risco: 0.4, fatores: () => [F('caixa', 0)], desfechos: D('O cliente pagou em dia e voltou com outro pedido.', 'Pagou, com atraso.', 'O caixa apertou nos meses seguintes.', 'O cliente atrasou seis meses. O caixa sangrou.', { otimo: { dinheiro: 15000 }, bom: { dinheiro: 6000 }, ruim: { dinheiro: -4000 }, pessimo: { dinheiro: -14000 } }) },
      { id: 'negociar', texto: 'Negociar desconto e prazo', dica: 'Pode perder o pedido.', risco: 0.45, fatores: v => [social(v), coragem(v)], desfechos: D('Fechou com metade do desconto e prazo de trinta dias.', 'Fechou no meio do caminho.', 'O cliente foi para outro fornecedor.', 'O cliente foi embora falando mal de você para os outros.', { otimo: { dinheiro: 18000 }, bom: { dinheiro: 9000 } }) },
      { id: 'recusar', texto: 'Recusar', dica: 'Nada entra; nada sai.', risco: 0.1, fatores: () => [], desfechos: D('Recusou — e o cliente voltou em condições melhores.', 'Recusou, sem drama.', 'Sentiu falta do pedido no fim do mês.', 'A concorrência pegou e cresceu.', { otimo: { dinheiro: 8000 } }) }
    ] },
  { id: 'neg_crise', trajetoria: 'negocio', cabe: () => true,
    titulo: 'O fornecedor falhou', texto: () => 'O principal fornecedor não entregou, e há encomenda para sexta.',
    intencoes: [
      { id: 'improvisar', texto: 'Improvisar com outro fornecedor, mais caro', dica: 'A margem some; o cliente fica.', risco: 0.35, fatores: v => [leitura(v), coragem(v)], desfechos: D('Entregou na sexta, e ganhou um fornecedor melhor de quebra.', 'Entregou, sem lucro.', 'Entregou atrasado.', 'Não entregou, e perdeu o cliente.', { otimo: { dinheiro: 2000 }, bom: { dinheiro: -1500 }, ruim: { dinheiro: -3000 }, pessimo: { dinheiro: -6000 } }) },
      { id: 'avisar', texto: 'Avisar o cliente e remarcar', dica: 'Honesto; nem todo cliente espera.', risco: 0.25, fatores: v => [social(v)], desfechos: D('O cliente agradeceu a franqueza e esperou.', 'Remarcado.', 'O cliente aceitou de cara feia.', 'O cliente cancelou.', { pessimo: { dinheiro: -4000 } }) }
    ] },
  { id: 'aut_cliente', trajetoria: 'autonomo', cabe: () => true,
    titulo: 'Um cliente difícil', texto: () => 'Um cliente não aprova o serviço, pede para refazer pela terceira vez e ameaça não pagar.',
    intencoes: [
      { id: 'refazer', texto: 'Refazer mais uma vez', dica: 'Tempo seu, sem garantia.', risco: 0.25, fatores: v => [disciplina(v), competencia(v)], desfechos: D('Desta vez ele aprovou — e indicou você para dois amigos.', 'Aprovado. Pagou.', 'Pagou metade.', 'Não pagou nada e ainda falou mal de você no bairro.', { otimo: { dinheiro: 1500 }, pessimo: { dinheiro: -800 } }) },
      { id: 'cobrar', texto: 'Cobrar o combinado e encerrar', dica: 'Firmeza; ele pode sumir.', risco: 0.5, fatores: v => [coragem(v), social(v)], desfechos: D('Ele pagou, pediu desculpas e voltou meses depois.', 'Pagou, a contragosto.', 'Sumiu sem pagar.', 'Foi para as redes reclamar de você.', { pessimo: { imagem: 'polemica' } }) }
    ] },
  { id: 'emp_problema', trajetoria: 'emprego', cabe: () => true,
    titulo: 'Um problema no trabalho', texto: v => `Um problema urgente estourou ${v.trabalho.atual?.empregador ? `no trabalho` : ''} — e a chefia está fora. Alguém precisa decidir.`.replace('  ', ' '),
    intencoes: [
      { id: 'assumir', texto: 'Assumir e resolver', dica: 'Se der certo, todo mundo vê. Se der errado, também.', risco: 0.5, fatores: v => [competencia(v), coragem(v), cabeca(v)], desfechos: D('Resolveu antes de a chefia voltar. Seu nome apareceu na reunião seguinte.', 'Resolveu; o problema não voltou.', 'Resolveu pela metade.', 'A solução piorou o problema, e foi seu nome que ficou nele.', { otimo: { clima: 6 }, pessimo: { clima: -8 } }, { otimo: 'Resolveu sozinho um problema grande no trabalho — e isso pesou na próxima promoção.' }) },
      { id: 'escalar', texto: 'Ligar para a chefia e esperar orientação', dica: 'Seguro. Demora.', risco: 0.15, fatores: v => [clima(v), disciplina(v)], desfechos: D('A chefia agradeceu o aviso e confiou a solução a você.', 'A chefia resolveu por telefone.', 'Demorou, e o problema cresceu.', 'Quando a orientação veio, já era tarde.', { otimo: { clima: 4 } }) },
      { id: 'esperar', texto: 'Esperar alguém resolver', dica: 'Não é com você — até ser.', risco: 0.35, fatores: v => [F('sorte', 0), clima(v)], desfechos: D('Outro resolveu, e ninguém cobrou nada de ninguém.', 'Resolveram.', 'Perguntaram por que ninguém fez nada.', 'Sobrou para você explicar por que não fez nada.', { otimo: { nome: 0 }, bom: { nome: 0 }, pessimo: { clima: -6 } }) }
    ] },
  { id: 'emp_credito', trajetoria: 'emprego', cabe: v => idade(v) >= 18,
    titulo: 'O crédito', texto: () => 'Na apresentação para a diretoria, um colega mostrou como dele o trabalho que você fez.',
    intencoes: [
      { id: 'confrontar', texto: 'Confrontar ali mesmo', dica: 'A verdade em público tem preço.', risco: 0.6, fatores: v => [coragem(v), social(v), competencia(v)], desfechos: D('Com dois detalhes que só quem fez sabia, a sala entendeu.', 'O constrangimento resolveu.', 'Pareceu ciúme.', 'A diretoria achou a cena feia — e lembrou de você por ela.', { otimo: { clima: 4 }, pessimo: { clima: -8 } }) },
      { id: 'chefia', texto: 'Falar com a chefia depois, com provas', dica: 'Mais lento; mais seguro.', risco: 0.3, fatores: v => [clima(v), disciplina(v)], desfechos: D('A chefia corrigiu na reunião seguinte, publicamente.', 'A chefia ouviu e passou a prestar atenção.', 'A chefia disse que "isso acontece".', 'A chefia ficou do lado do colega.', { otimo: { clima: 6 }, pessimo: { clima: -6 } }) },
      { id: 'deixar', texto: 'Deixar passar', dica: 'Paz agora; e depois?', risco: 0.15, fatores: () => [], desfechos: D('O colega, sem graça, passou a citar você.', 'Ficou por isso mesmo.', 'Aconteceu de novo.', 'Na promoção, foi ele.', { otimo: { nome: 1 }, bom: { nome: 0, estresse: 3 }, ruim: { estresse: 4 }, pessimo: { nome: -2, estresse: 6 } }) }
    ] },
  { id: 'emp_erro', trajetoria: 'emprego', cabe: () => true,
    titulo: 'Um erro seu', texto: () => 'Você percebe um erro seu num relatório que já foi para o cliente. Ninguém notou — ainda.',
    intencoes: [
      { id: 'admitir', texto: 'Avisar a chefia e corrigir', dica: 'Honesto. Pode custar um pouco.', risco: 0.2, fatores: v => [clima(v), competencia(v)], desfechos: D('A chefia elogiou a honestidade; o cliente nem se importou.', 'Corrigido, sem drama.', 'Uma bronca, e a correção.', 'O cliente cobrou caro, e a culpa ficou registrada.', { otimo: { clima: 5 }, pessimo: { clima: -5 } }) },
      { id: 'quieto', texto: 'Corrigir em silêncio', dica: 'Se ninguém notar, ótimo. Se notarem...', risco: 0.55, fatores: v => [leitura(v), F('sorte', 0)], desfechos: D('Corrigido sem ninguém saber.', 'Ninguém notou.', 'O cliente notou primeiro; deu trabalho explicar.', 'Descobriram — e o problema virou a omissão, não o erro.', { otimo: { nome: 0 }, bom: { nome: 0 }, pessimo: { clima: -10 } }) }
    ] },
  { id: 'emp_projeto', trajetoria: 'emprego', cabe: v => (v.trabalho.atual?.desempenho ?? 0) >= 55,
    titulo: 'Um projeto novo', texto: () => 'A chefia oferece um projeto novo e arriscado: mais visibilidade, mais horas, nenhuma garantia.',
    intencoes: [
      { id: 'pegar', texto: 'Pegar o projeto', dica: 'Mais horas na semana. Se der certo, abre portas.', risco: 0.5, fatores: v => [competencia(v), disciplina(v), cabeca(v)], desfechos: D('O projeto deu certo e virou referência. A promoção ficou mais perto.', 'Entregue, no prazo.', 'Entregue, com atraso e cansaço.', 'O projeto foi cancelado no meio — e as horas não voltam.', { otimo: { clima: 6, estresse: 4 }, bom: { estresse: 4 }, ruim: { estresse: 7 }, pessimo: { estresse: 8 } }, { otimo: 'Tocou um projeto arriscado no trabalho que virou referência.' }) },
      { id: 'recusar', texto: 'Recusar com educação', dica: 'Nada muda.', risco: 0.1, fatores: v => [clima(v)], desfechos: D('A chefia entendeu e lembrou de você no próximo.', 'Outro pegou.', 'A chefia anotou.', 'Leram como falta de ambição.', { otimo: { nome: 0 }, bom: { nome: 0 }, pessimo: { clima: -4 } }) }
    ] }
];

export const MODELOS: ModeloSituacao[] = [...MODELOS_FUTEBOL, ...MODELOS_PROFISSOES];

/** As situações vividas, para a tela (as mais recentes primeiro). */
export function momentosDaCarreira(v: Vida, n = 8): { ano: number; texto: string; desfecho: Desfecho; intencao: string }[] {
  return (v.caminhos.situacoes ?? []).slice(-n).reverse().map(x => ({ ano: anoDe(x.t), texto: x.texto, desfecho: x.desfecho, intencao: x.intencao }));
}

/** Escreve a memória de um desfecho marcante na Linha da Vida (o resto fica só no registro da carreira). */
export function memoriaDaSituacao(v: Vida, memoria: string | undefined, desfecho: Desfecho): void {
  if (!memoria) return;
  escrever(v, { texto: memoria, relevancia: desfecho === 'otimo' ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: desfecho === 'otimo' || desfecho === 'bom' ? 'bom' : 'ruim', escolha: true });
}
