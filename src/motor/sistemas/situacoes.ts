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
import { clamp, rngDe } from '../rng';
import type { Posicao, RegistroDeSituacao, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { flex, ge } from '../texto';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { doClube, oClube, peloClube } from '../dados/clubes';
import { cursoOuNulo } from '../dados/cursos';
import { OCUPACOES } from '../dados/ocupacoes';
import { estatura, funcaoBasquete, vantagemDeEstatura } from './modalidades';
import { categoriaDeLuta, funcaoVolei, provaDe } from './provas';
import { NOME_MOD } from './esporte';
import { registrarNoMandato, NOME_PRIORIDADE } from './politica';
import { novaOportunidade } from './oportunidades';
import { lesionar } from './lesoes';
import { especialidadeMedica } from './medicina';
import { habilidade } from './frentes';
import { barraDaDivisao, nomePosicao, OCUPACOES_DE_ATLETA } from './esporte';
import { climaDe, mexerNoClima } from './profissao';
import { negocioAtivo } from './negocio';
import { empregoAcademico, publicarArtigo, registrarProducao, vidaAcademica } from './academia';
import { mercadoDoTrabalho } from './mercados';
import { marcar } from './marcas';
import { registrarConquista } from './palmares';
import { anoDe } from '../tempo';

export type Trajetoria = 'futebol' | 'basquete' | 'tenis' | 'atleta' | 'medicina' | 'academia' | 'cena' | 'negocio' | 'autonomo' | 'emprego' | 'militar' | 'politica' | 'rural' | 'universidade';
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
  /** Política (no mandato): a base de apoio e o desgaste (a aprovação do mandato é o `nome`). */
  apoio?: number;
  desgaste?: number;
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
  // Toda carreira esportiva produz momentos — cada modalidade os seus (o futebol não é exceção de arquitetura).
  if (es?.fase === 'profissional' && e && OCUPACOES_DE_ATLETA.includes(e.ocupacaoId)) return es.modalidade === 'futebol' ? 'futebol' : es.modalidade === 'basquete' ? 'basquete' : es.modalidade === 'tenis' ? 'tenis' : 'atleta';
  // A universidade como experiência: quem estuda (e, no máximo, estagia) vive situações do curso.
  const mat = v.educacao.matricula;
  if (mat && !mat.trancado && ['superior', 'tecnico'].includes(cursoOuNulo(mat.cursoId)?.nivel ?? '') && idade(v) <= 32 && (!e || e.contrato === 'estagio' || e.carga === 'parcial') && !negocioAtivo(v)) return 'universidade';
  if (!e) return negocioAtivo(v) ? 'negocio' : undefined;
  if (e.contrato === 'eletivo' && v.caminhos.politica?.mandato) return 'politica';
  if (e.contrato === 'militar' && v.caminhos.militar && !e.formacaoAte) return 'militar';
  if (e.ocupacaoId === 'produtor_rural' && v.caminhos.rural) return 'rural';
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
const FREQUENCIA: Record<Trajetoria, number> = { futebol: 0.45, basquete: 0.4, tenis: 0.4, atleta: 0.35, medicina: 0.32, academia: 0.3, cena: 0.32, negocio: 0.3, autonomo: 0.25, emprego: 0.22, militar: 0.25, politica: 0.38, rural: 0.28, universidade: 0.25 };

/** O ano: às vezes, uma situação (nunca a mesma de pouco tempo atrás). Fica aberta para a decisão `car_situacao`. */
export function processarSituacoes(v: Vida, r: Rng): void {
  v.caminhos.situacao = undefined;
  const tr = trajetoriaDeSituacao(v);
  if (!tr || idade(v) < 17 || v.justica?.prisao || !r.chance(FREQUENCIA[tr])) return;
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
    if (tr === 'futebol' || tr === 'basquete' || tr === 'tenis' || tr === 'atleta') { const es = v.caminhos.esporte; if (es) es.reputacao = clamp((es.reputacao ?? 30) + ef.nome); }
    else if (tr === 'politica') { const m = v.caminhos.politica?.mandato; if (m) m.aprovacao = clamp(m.aprovacao + ef.nome * 1.5); }
    else if (tr === 'universidade') { const m = v.educacao.matricula; if (m) m.desempenho = clamp(m.desempenho + ef.nome * 2); }
    else if (tr === 'rural' && e?.clientela !== undefined) e.clientela = clamp(e.clientela + ef.nome * 1.5);
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
  if (ef.apoio && v.caminhos.politica) v.caminhos.politica.apoio = clamp(v.caminhos.politica.apoio + ef.apoio);
  if (ef.desgaste && v.caminhos.politica) v.caminhos.politica.desgaste = clamp(v.caminhos.politica.desgaste + ef.desgaste);
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
      { id: 'refazer', texto: 'Refazer o que pedem', dica: 'Um ano a mais — e o artigo mais forte.', risco: 0.2, fatores: v => [disciplina(v), competencia(v)], desfechos: D('O artigo saiu, melhor, numa revista de peso.', 'Saiu, um ano depois.', 'O experimento novo não confirmou tudo.', 'Um ano depois, outro grupo publicou primeiro.', { otimo: { extra: v => { vidaAcademica(v).publicacoes += 1; publicarArtigo(v, 'depois da revisão'); } }, bom: { extra: v => { vidaAcademica(v).publicacoes += 1; publicarArtigo(v, 'depois da revisão'); } } }, { otimo: 'Publicou numa revista de peso depois de refazer o que os revisores pediram.' }) },
      { id: 'contestar', texto: 'Contestar os pareceres', dica: 'Às vezes o editor concorda.', risco: 0.55, fatores: v => [leitura(v), coragem(v), competencia(v)], desfechos: D('O editor concordou com você. Aceito.', 'Uma rodada a mais, e aceito.', 'Recusado.', 'Recusado — e o editor ficou com o seu nome.', { otimo: { extra: v => { vidaAcademica(v).publicacoes += 1; publicarArtigo(v, 'depois da revisão'); } }, bom: { extra: v => { vidaAcademica(v).publicacoes += 1; publicarArtigo(v, 'depois da revisão'); } } }) },
      { id: 'outra', texto: 'Mandar para outra revista', dica: 'Mais rápido; com menos alcance.', risco: 0.3, fatores: v => [competencia(v)], desfechos: D('Aceito de primeira na outra revista.', 'Aceito, numa revista menor.', 'Recusado de novo.', 'Recusado duas vezes. O artigo foi para a gaveta.', { otimo: { extra: v => { vidaAcademica(v).publicacoes += 1; publicarArtigo(v, 'depois da revisão'); } }, bom: { extra: v => { vidaAcademica(v).publicacoes += 1; publicarArtigo(v, 'depois da revisão'); } } }) }
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
      { id: 'ambicioso', texto: 'Mandar o ambicioso', dica: 'Muito dinheiro — e muita concorrência.', risco: 0.65, fatores: v => [competencia(v), F('produção', (vidaAcademica(v).publicacoes - 6) / 20)], desfechos: D('Aprovado. O laboratório ganhou equipamento e bolsas.', 'Aprovado com corte no orçamento.', 'Não aprovado — "mérito, mas sem recurso".', 'Não aprovado, e o seguro também não foi mandado. Um ano no aperto.', { otimo: { extra: v => { vidaAcademica(v).financiamentos += 1; registrarProducao(v, { tipo: 'financiamento', titulo: 'Um edital de pesquisa', detalhe: 'verba para o laboratório' }); } }, bom: { extra: v => { vidaAcademica(v).financiamentos += 1; registrarProducao(v, { tipo: 'financiamento', titulo: 'Um edital de pesquisa', detalhe: 'verba para o laboratório' }); } } }, { otimo: 'Ganhou um edital grande de pesquisa e montou o laboratório que queria.' }) },
      { id: 'seguro', texto: 'Mandar o seguro', dica: 'Mais chance, menos mudança.', risco: 0.15, fatores: v => [competencia(v)], desfechos: D('Aprovado e elogiado.', 'Aprovado.', 'Ficou na lista de espera.', 'Não aprovado.', { otimo: { extra: v => { vidaAcademica(v).financiamentos += 1; registrarProducao(v, { tipo: 'financiamento', titulo: 'Um edital de pesquisa', detalhe: 'verba para o laboratório' }); } }, bom: { extra: v => { vidaAcademica(v).financiamentos += 1; registrarProducao(v, { tipo: 'financiamento', titulo: 'Um edital de pesquisa', detalhe: 'verba para o laboratório' }); } } }) }
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

/* ============================================================ Outras trajetórias (generalização de carreiras) */

/*
 * Não é o mesmo popup com substantivos trocados: cada modelo consulta o que
 * é daquela trajetória (a função e a estatura no basquete; o saque, o fôlego e
 * o ranking no tênis; o conceito e o comando na farda; o capital político, a
 * base e o desgaste no mandato; a safra, a cooperativa e o caixa no campo; o
 * desempenho no curso na universidade). A escolha é a intenção; o motor
 * decide o resultado.
 */

const tecnicaEsp = (v: Vida) => { const es = v.caminhos.esporte!; return F('técnica', (habilidade(v, es.modalidade) - barraDaDivisao(es.modalidade, es.nivel)) / 12); };
const estaturaF = (v: Vida) => F('estatura', vantagemDeEstatura(v) * 2);
const nomeEsp = (v: Vida) => F('nome no esporte', ((v.caminhos.esporte?.reputacao ?? 30) - 50) / 120);
const esporteDe = (v: Vida, tr: Trajetoria) => trajetoriaDeSituacao(v) === tr;
const individualEsp = (v: Vida) => ['natacao', 'atletismo', 'lutas'].includes(v.caminhos.esporte?.modalidade ?? '');

const MODELOS_ESPORTES: ModeloSituacao[] = [
  {
    id: 'bas_ultimo_ataque', trajetoria: 'basquete', peso: () => 2,
    cabe: v => esporteDe(v, 'basquete'),
    contexto: (v, r) => { const t = v.caminhos.esporte?.temporadas?.slice(-1)[0]; return { segundos: r.int(5, 14), placar: r.pick(['perde por um', 'perde por dois', 'empate']), jogo: t && t.colocacao <= 2 ? 'final' : r.chance(0.4) ? 'playoff' : 'jogo de temporada', funcao: funcaoBasquete(v) }; },
    titulo: 'O último ataque',
    texto: (_v, d) => `${d.segundos} segundos no relógio, ${d.jogo === 'final' ? 'a final' : d.jogo === 'playoff' ? 'um jogo de playoff' : 'um jogo da temporada'}, o time ${d.placar}. O técnico pediu tempo e desenhou a jogada — ${d.funcao === 'pivo' ? 'a bola vai para você no garrafão' : d.funcao === 'armador' ? 'a bola está na sua mão' : 'você é a opção de arremesso'}.`,
    intencoes: (_v, d) => {
      const decisivo = (v: Vida) => d.jogo === 'final' ? `Fez a cesta da vitória nos últimos segundos de uma final, ${peloClube(v.caminhos.esporte!.clube)}.` : 'Decidiu um jogo no último ataque.';
      const ok = { nome: 3, confianca: 1, humor: 5, noto: 1 };
      if (d.funcao === 'pivo') return [
        { id: 'poste', texto: 'Jogar de costas, no poste', dica: 'O corpo decide — se o marcador deixar.', risco: 0.45, fatores: v => [tecnicaEsp(v), estaturaF(v), cabeca(v)],
          desfechos: { otimo: { texto: 'Girou em cima do marcador e cravou. Cesta e falta.', efeitos: ok, memoria: decisivo }, bom: { texto: 'Pontuou de gancho; o jogo seguiu para a prorrogação.', efeitos: { nome: 1 } }, ruim: { texto: 'A dobra chegou e a bola espirrou.', efeitos: {} }, pessimo: { texto: 'Andou com a bola. Posse deles, jogo perdido.', efeitos: { nome: -2, estresse: 5, confianca: -1 } } } },
        { id: 'devolver', texto: 'Atrair a marcação e devolver para fora', dica: 'O arremesso livre pode ser de outro.', risco: 0.25, fatores: v => [leitura(v), tecnicaEsp(v)],
          desfechos: { otimo: { texto: 'Duas marcações em você — e o ala livre fez de três.', efeitos: { nome: 2, confianca: 1 } }, bom: { texto: 'Passe certo, arremesso bom, aro.', efeitos: {} }, ruim: { texto: 'O passe saiu lento; a defesa fechou.', efeitos: {} }, pessimo: { texto: 'Interceptado no meio do caminho.', efeitos: { nome: -1, estresse: 3 } } } },
        { id: 'rebote', texto: 'Posicionar-se para o rebote ofensivo', dica: 'Se o arremesso errar, a segunda chance é sua.', risco: 0.5, fatores: v => [estaturaF(v), coragem(v), F('fôlego', (v.corpo.forma - 70) / 60)],
          desfechos: { otimo: { texto: 'O arremesso bateu no aro, e a sua mão chegou antes de todas. Tapinha, cesta, fim.', efeitos: ok, memoria: decisivo }, bom: { texto: 'Pegou o rebote e sofreu a falta: dois lances livres.', efeitos: { nome: 1 } }, ruim: { texto: 'O rebote foi deles.', efeitos: {} }, pessimo: { texto: 'Falta no garrafão disputando o rebote — a sexta. Fora do jogo.', efeitos: { nome: -2, confianca: -1, estresse: 4 } } } }
      ];
      if (d.funcao === 'armador') return [
        { id: 'infiltrar', texto: 'Chamar a jogada e infiltrar', dica: 'Pede perna e coragem no garrafão.', risco: 0.55, fatores: v => [tecnicaEsp(v), coragem(v), F('fôlego', (v.corpo.forma - 70) / 60)],
          desfechos: { otimo: { texto: 'Passou pelo marcador, bandeja de canhota no último segundo.', efeitos: ok, memoria: decisivo }, bom: { texto: 'Infiltrou e sofreu a falta: dois lances livres convertidos.', efeitos: { nome: 1 } }, ruim: { texto: 'O toco veio de trás.', efeitos: {} }, pessimo: { texto: 'Perdeu a bola no drible; o contra-ataque matou o jogo.', efeitos: { nome: -2, estresse: 5, confianca: -1 } } } },
        { id: 'pivo', texto: 'Achar o pivô no garrafão', dica: 'O passe certo exige ler a defesa antes dela.', risco: 0.3, fatores: v => [leitura(v), tecnicaEsp(v)],
          desfechos: { otimo: { texto: 'Passe por cima da defesa, e o pivô só empurrou. Assistência da vitória.', efeitos: { nome: 2, confianca: 1, humor: 3 } }, bom: { texto: 'O passe chegou; o pivô errou o gancho.', efeitos: {} }, ruim: { texto: 'A linha de passe fechou; você forçou um arremesso ruim.', efeitos: {} }, pessimo: { texto: 'O passe foi direto na mão do adversário.', efeitos: { nome: -2, estresse: 3 } } } },
        { id: 'tempo', texto: 'Segurar a bola e esperar a jogada desenhar', dica: 'Quase nunca dá errado. O relógio, às vezes, dá.', risco: 0.12, fatores: v => [leitura(v), cabeca(v)],
          desfechos: { otimo: { texto: 'Esperou o bloqueio, e a jogada saiu como o técnico desenhou.', efeitos: { nome: 1, confianca: 1 } }, bom: { texto: 'A jogada saiu, o arremesso não caiu.', efeitos: {} }, ruim: { texto: 'O relógio de posse quase estourou.', efeitos: {} }, pessimo: { texto: 'Estourou o tempo de posse.', efeitos: { nome: -1, estresse: 3 } } } }
      ];
      return [
        { id: 'tres', texto: 'Arremessar de três', dica: 'Se cair, decide. Se não cair, acabou.', risco: 0.7, fatores: v => [tecnicaEsp(v), cabeca(v)],
          desfechos: { otimo: { texto: 'Do canto, com a mão do marcador na cara. Caiu.', efeitos: ok, memoria: decisivo }, bom: { texto: 'Caiu de dois, com o pé na linha: prorrogação.', efeitos: { nome: 1 } }, ruim: { texto: 'Aro e fora.', efeitos: {} }, pessimo: { texto: 'Airball. O ginásio inteiro cantou.', efeitos: { nome: -2, estresse: 6, imagem: 'polemica' } } } },
        { id: 'atacar', texto: 'Atacar a cesta', dica: 'Pede perna depois de quarenta minutos.', risco: 0.45, fatores: v => [tecnicaEsp(v), F('fôlego', (v.corpo.forma - 70) / 60)],
          desfechos: { otimo: { texto: 'Bandeja com a falta. Cesta e um.', efeitos: ok, memoria: decisivo }, bom: { texto: 'Sofreu a falta; acertou um dos dois.', efeitos: { nome: 1 } }, ruim: { texto: 'A ajuda chegou; arremesso forçado.', efeitos: {} }, pessimo: { texto: 'Falta de ataque. Bola deles.', efeitos: { nome: -2, confianca: -1 } } } },
        { id: 'passar', texto: 'Passar para o companheiro livre', dica: 'O arremesso pode ser de outro; o jogo é do time.', risco: 0.25, fatores: v => [leitura(v), social(v)],
          desfechos: { otimo: { texto: 'O companheiro livre no canto — e caiu. O abraço foi seu.', efeitos: { nome: 2, confianca: 1 } }, bom: { texto: 'O passe chegou; o arremesso não.', efeitos: {} }, ruim: { texto: 'O passe saiu atrasado.', efeitos: {} }, pessimo: { texto: 'Passe interceptado.', efeitos: { nome: -1, estresse: 3 } } } }
      ];
    }
  },
  {
    id: 'bas_minutos', trajetoria: 'basquete', peso: () => 1,
    cabe: v => esporteDe(v, 'basquete') && v.caminhos.esporte?.espaco === 'reserva',
    titulo: 'Poucos minutos',
    texto: v => `Oito minutos por jogo, quase sempre no fim. ${estatura(v) >= 195 ? 'O técnico diz que falta força no garrafão.' : 'O técnico diz que falta defesa.'}`,
    intencoes: [
      { id: 'cobrar', texto: 'Cobrar o técnico por mais minutos', dica: 'Pode render minutos — ou banco.', risco: 0.6, fatores: v => [nomeEsp(v), social(v)], desfechos: D('Ele ouviu e deu dez jogos de chance. Você aproveitou.', 'Ganhou uns minutos a mais.', 'A conversa esfriou o clima.', '"Então treina melhor." E mais banco.', { otimo: { confianca: 1 }, pessimo: { confianca: -1 } }) },
      { id: 'treinar', texto: 'Ficar depois do treino arremessando', dica: 'Devagar, sem garantia.', risco: 0.2, fatores: v => [disciplina(v), tecnicaEsp(v)], desfechos: D('Trezentos arremessos por dia. Na rotação dos playoffs, você entrou.', 'O arremesso melhorou um pouco.', 'Nada mudou na rotação.', 'O ombro reclamou do excesso.', { otimo: { confianca: 1, extra: (v, _d) => { const f = v.caminhos.frentes.basquete; if (f) f.habilidade = clamp(f.habilidade + 1); } } }) },
      { id: 'papel', texto: 'Aceitar o papel de especialista em defesa', dica: 'Menos ponto, mais lugar na rotação.', risco: 0.25, fatores: v => [leitura(v), disciplina(v)], desfechos: D('Virou o defensor que o técnico chama nos fins de jogo.', 'Entrou na rotação como defensor.', 'O papel não pegou.', 'Fez faltas demais em pouco tempo.', { otimo: { confianca: 1 }, bom: { confianca: 1 } }, { otimo: 'Virou o especialista em defesa que o técnico chamava nos fins de jogo.' }) }
    ]
  },
  {
    id: 'bas_vestiario', trajetoria: 'basquete', peso: () => 0.7,
    cabe: v => esporteDe(v, 'basquete') && idade(v) >= 26 && v.caminhos.esporte?.espaco === 'titular',
    titulo: 'Briga no vestiário',
    texto: () => 'Dois jovens do elenco saíram no braço depois da derrota. O técnico olhou para você antes de dizer qualquer coisa.',
    intencoes: [
      { id: 'separar', texto: 'Separar e conversar com os dois', dica: 'Quem lidera, aparece.', risco: 0.3, fatores: v => [lideranca(v), social(v)], desfechos: D('No treino seguinte, os dois jogaram juntos como nunca. O técnico agradeceu em particular.', 'Os ânimos baixaram.', 'Um deles achou que você tomou partido.', 'A briga vazou para a imprensa com o seu nome no meio.', { otimo: { confianca: 1 }, pessimo: { imagem: 'polemica' } }, { otimo: 'Segurou um vestiário rachado no meio da temporada.' }) },
      { id: 'comissao', texto: 'Deixar a comissão técnica resolver', dica: 'Não é com você — até ser.', risco: 0.1, fatores: v => [clima(v)], desfechos: D('A comissão resolveu rápido.', 'Resolvido.', 'O clima ruim durou semanas.', 'O time desandou na reta final.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ]
  },
  {
    id: 'ten_tiebreak', trajetoria: 'tenis', peso: () => 2,
    cabe: v => esporteDe(v, 'tenis'),
    contexto: (_v, r) => ({ fase: r.pick(['quartas de final', 'semifinal', 'semifinal']), placar: r.pick(['5 a 5', '6 a 6']), quadra: r.pick(['saibro', 'quadra dura']) }),
    titulo: 'O tie-break',
    texto: (_v, d) => `${String(d.fase).charAt(0).toUpperCase()}${String(d.fase).slice(1)}, terceiro set, ${d.placar} no tie-break, ${d.quadra}. O saque é seu. O braço pesa.`,
    intencoes: [
      { id: 'forte', texto: 'Sacar forte e subir à rede', dica: 'Se entrar, acaba. Se não, a dupla falta mora ao lado.', risco: 0.6, fatores: (v, d) => [tecnicaEsp(v), coragem(v), cabeca(v, d)],
        desfechos: { otimo: { texto: 'Ace no T, voleio no ponto seguinte. A vitória veio com o punho fechado.', efeitos: { nome: 3, humor: 5 }, memoria: (_v, d) => `Fechou um tie-break de terceiro set nas ${d.fase} com dois saques que ninguém devolveu.` }, bom: { texto: 'Primeiro saque dentro, voleio difícil, ponto seu. Passou.', efeitos: { nome: 1 } }, ruim: { texto: 'O voleio ficou na rede.', efeitos: { estresse: 3 } }, pessimo: { texto: 'Dupla falta no match point. O silêncio da quadra.', efeitos: { nome: -2, estresse: 6, humor: -3 } } } },
      { id: 'fundo', texto: 'Jogar do fundo e esperar o erro', dica: 'Pede fôlego e paciência.', risco: 0.25, fatores: v => [F('fôlego', (v.corpo.forma - 70) / 60), disciplina(v), cabeca(v)],
        desfechos: { otimo: { texto: 'Trinta e duas trocas de bola. Ele errou primeiro.', efeitos: { nome: 2, humor: 3 } }, bom: { texto: 'Ganhou nos erros dele.', efeitos: { nome: 1 } }, ruim: { texto: 'A paciência dele foi maior.', efeitos: {} }, pessimo: { texto: 'As pernas acabaram antes do ponto.', efeitos: { nome: -1, estresse: 4 } } } },
      { id: 'variar', texto: 'Variar: slice e deixada', dica: 'Desmonta quem joga no ritmo — se a mão estiver boa.', risco: 0.45, fatores: v => [leitura(v), tecnicaEsp(v)],
        desfechos: { otimo: { texto: 'A deixada morreu na rede dele. A torcida veio abaixo.', efeitos: { nome: 3, humor: 4, noto: 1 } }, bom: { texto: 'O slice desmontou o ritmo dele.', efeitos: { nome: 1 } }, ruim: { texto: 'A deixada ficou curta demais — na rede.', efeitos: {} }, pessimo: { texto: 'Ele leu a deixada e matou na paralela.', efeitos: { nome: -1, estresse: 4 } } } }
    ]
  },
  {
    id: 'ten_preparador', trajetoria: 'tenis', peso: () => 0.8,
    cabe: v => esporteDe(v, 'tenis') && (v.caminhos.esporte?.nivel ?? 1) >= 2,
    titulo: 'A equipe',
    texto: () => 'O treinador diz que, para o próximo nível, falta um preparador físico de verdade — e isso custa uns R$ 18 mil por ano, do seu bolso.',
    intencoes: [
      { id: 'pagar', texto: 'Contratar o preparador', dica: 'Dinheiro agora; corpo melhor depois — talvez.', risco: 0.35, fatores: v => [disciplina(v), F('caixa', v.financas.conta >= 18000 ? 0.1 : -0.3)], desfechos: D('O corpo respondeu: a temporada seguinte foi a melhor fisicamente.', 'Mais fôlego no terceiro set.', 'Pouca diferença por enquanto.', 'O preparador e o treinador não se entenderam.', { otimo: { dinheiro: -18000, extra: v => { v.corpo.forma = clamp(v.corpo.forma + 6); } }, bom: { dinheiro: -18000, extra: v => { v.corpo.forma = clamp(v.corpo.forma + 3); } }, ruim: { dinheiro: -18000 }, pessimo: { dinheiro: -18000 } }) },
      { id: 'seguir', texto: 'Seguir como está', dica: 'A conta fecha; o salto, talvez não.', risco: 0.1, fatores: () => [], desfechos: D('Seguiu bem assim mesmo.', 'Nada mudou.', 'O cansaço apareceu nos torneios longos.', 'Perdeu jogos no terceiro set por falta de perna.', { otimo: { nome: 0 }, bom: { nome: 0 } }) },
      { id: 'trocar', texto: 'Trocar de treinador', dica: 'Um olhar novo — ou um ano perdido.', risco: 0.55, fatores: v => [leitura(v), social(v)], desfechos: D('O treinador novo mudou o seu saque. O ranking agradeceu.', 'A troca deu um gás.', 'A adaptação levou a temporada inteira.', 'Brigou com o novo em três meses.', { otimo: { extra: v => { const f = v.caminhos.frentes.tenis; if (f) f.habilidade = clamp(f.habilidade + 1.5); } } }, { otimo: 'Trocou de treinador no meio da carreira — e o jogo mudou de patamar.' }) }
    ]
  },
  {
    id: 'ten_dor', trajetoria: 'tenis', peso: () => 0.8,
    cabe: v => esporteDe(v, 'tenis') && idade(v) >= 22,
    titulo: 'A dor no ombro',
    texto: () => 'Na véspera de uma semifinal, o ombro do saque dói ao levantar o braço. O fisioterapeuta faz uma cara que você conhece.',
    intencoes: [
      { id: 'jogar', texto: 'Jogar assim mesmo', dica: 'Os pontos do ranking estão ali. O ombro também.', risco: 0.6, fatores: v => [F('corpo', (v.corpo.saude - 60) / 70), coragem(v)], desfechos: { otimo: { texto: 'Jogou no sacrifício e ganhou. O ombro aguentou.', efeitos: { nome: 2, estresse: 4 } }, bom: { texto: 'Perdeu, mas competiu. O ombro aguentou.', efeitos: { estresse: 3 } }, ruim: { texto: 'Abandonou no segundo set.', efeitos: { nome: -1, estresse: 4 } }, pessimo: { texto: 'O ombro não aguentou: lesão de verdade, meses fora.', efeitos: { nome: -2, estresse: 8, extra: v => { lesionar(v, rngParaLesao(v), 2, 'profissional'); } }, memoria: 'Jogou machucado uma semifinal e saiu com uma lesão que custou meses.' } } },
      { id: 'abandonar', texto: 'Não jogar e tratar', dica: 'Perde os pontos; ganha o ombro.', risco: 0.1, fatores: () => [], desfechos: D('O tratamento resolveu em duas semanas.', 'Voltou no torneio seguinte.', 'O ranking caiu um pouco.', 'Caiu no ranking e perdeu a vaga num torneio maior.', { otimo: { nome: 0, estresse: -2 }, bom: { nome: 0 }, ruim: { nome: -1 }, pessimo: { nome: -2 } }) },
      { id: 'adaptar', texto: 'Jogar mudando o saque', dica: 'Menos força, mais colocação.', risco: 0.4, fatores: v => [leitura(v), tecnicaEsp(v)], desfechos: D('O saque colocado funcionou: ganhou sem forçar o ombro.', 'Perdeu em três sets apertados, sem piorar o ombro.', 'O saque fraco virou alvo.', 'Forçou mesmo assim no fim e piorou a dor.') }
    ]
  },
  {
    id: 'atl_final', trajetoria: 'atleta', peso: () => 2,
    cabe: v => esporteDe(v, 'atleta') && individualEsp(v),
    titulo: v => (v.caminhos.esporte?.modalidade === 'lutas' ? 'A final' : 'A final'),
    // A final da SUA prova (ou da sua categoria): a natação tem raia, o salto tem tentativas, a luta tem chave.
    texto: v => {
      const d = v.caminhos.esporte!.modalidade;
      if (d === 'lutas') return `Final do campeonato nacional, categoria ${categoriaDeLuta(v)}. Do outro lado, alguém que já venceu você uma vez.`;
      const p = provaDe(v, d);
      const da = !p ? '' : /^\d/.test(p.nome) ? ` dos ${p.nome}` : p.nome === 'maratona' ? ' da maratona' : ` do ${p.nome}`;
      if (d === 'natacao') return `Final${da} do campeonato nacional, raia quatro. O adversário da raia cinco é o favorito.`;
      if (p?.unidade === 'm') return `Final${da} do campeonato nacional. Três tentativas para ficar entre os oito, mais três para a medalha — e a comissão da seleção na arquibancada.`;
      return `Final${da} do campeonato nacional. Oito atletas, uma pista, o estádio quase vazio — e a comissão da seleção na arquibancada.`;
    },
    intencoes: v => {
      const d = v.caminhos.esporte!.modalidade;
      const forte = d === 'lutas' ? 'Partir para cima desde o primeiro segundo' : 'Sair forte desde o começo';
      const guardar = d === 'lutas' ? 'Esperar o erro e contra-atacar' : 'Guardar para o fim';
      return [
        { id: 'forte', texto: forte, dica: 'Se o corpo aguentar, ninguém alcança.', risco: 0.6, fatores: v2 => [tecnicaEsp(v2), F('fôlego', (v2.corpo.forma - 70) / 50), coragem(v2)], desfechos: { otimo: { texto: 'Ninguém acompanhou. O ouro veio com folga.', efeitos: { nome: 3, humor: 5, noto: 1 }, memoria: `Venceu uma final nacional de ${NOME_MOD[d] ?? d} saindo na frente desde o começo.` }, bom: { texto: 'Liderou quase tudo; terminou no pódio.', efeitos: { nome: 1 } }, ruim: { texto: 'O corpo cobrou no fim: fora do pódio.', efeitos: { estresse: 3 } }, pessimo: { texto: 'Quebrou no meio. Último lugar.', efeitos: { nome: -2, estresse: 6 } } } },
        { id: 'guardar', texto: guardar, dica: 'Pede leitura da prova — e sangue frio.', risco: 0.4, fatores: v2 => [leitura(v2), cabeca(v2), tecnicaEsp(v2)], desfechos: { otimo: { texto: 'A arrancada do fim foi a mais bonita da prova. Ouro.', efeitos: { nome: 3, humor: 5 } }, bom: { texto: 'Recuperou posições no fim: pódio.', efeitos: { nome: 1 } }, ruim: { texto: 'Esperou demais.', efeitos: { estresse: 3 } }, pessimo: { texto: 'Quando foi, já não dava: o pior resultado do ano.', efeitos: { nome: -1, estresse: 5 } } } },
        { id: 'plano', texto: 'Seguir o plano do técnico à risca', dica: 'O plano é bom — se a prova for a que ele imaginou.', risco: 0.15, fatores: v2 => [disciplina(v2), tecnicaEsp(v2)], desfechos: D('O plano encaixou: medalha de prata, a melhor marca da vida.', 'Fez o que treinou: pódio.', 'A prova não foi a que o plano imaginava.', 'Errou a tática no meio e não se recuperou.') }
      ];
    }
  },
  {
    id: 'atl_indice', trajetoria: 'atleta', peso: () => 1,
    cabe: v => esporteDe(v, 'atleta') && individualEsp(v) && (v.caminhos.esporte?.nivel ?? 1) >= 3,
    titulo: 'O índice',
    texto: () => 'Uma competição extra no fim da temporada pode dar o índice para o campeonato mundial. O corpo pede descanso; o técnico diz que a decisão é sua.',
    intencoes: [
      { id: 'ir', texto: 'Ir atrás do índice', dica: 'O índice é o ano. O corpo também.', risco: 0.55, fatores: v => [tecnicaEsp(v), F('corpo', (v.corpo.saude - 60) / 70), cabeca(v)], desfechos: { otimo: { texto: 'Fez o índice na última tentativa. O nome entrou na lista.', efeitos: { nome: 4, humor: 5 }, memoria: 'Conseguiu o índice para o mundial na última competição do ano.' }, bom: { texto: 'Ficou a centésimos do índice — e com a melhor marca da carreira.', efeitos: { nome: 2 } }, ruim: { texto: 'Longe do índice; o cansaço pesou.', efeitos: { estresse: 4 } }, pessimo: { texto: 'Machucou na prova extra.', efeitos: { nome: -1, estresse: 6, extra: v => { lesionar(v, rngParaLesao(v), 1, 'profissional'); } } } } },
      { id: 'descansar', texto: 'Descansar e preparar o ano que vem', dica: 'Sem índice agora; com corpo depois.', risco: 0.1, fatores: () => [], desfechos: D('Voltou na temporada seguinte inteiro e mais rápido.', 'Descansou.', 'Viu o índice ficar com outro.', 'O ano que vem não começou melhor.', { otimo: { nome: 1, extra: v => { v.corpo.forma = clamp(v.corpo.forma + 3); } }, bom: { nome: 0 } }) }
    ]
  },
  {
    id: 'vol_saque', trajetoria: 'atleta', peso: () => 2,
    // O líbero não saca (é a regra): o tie-break dele é outro.
    cabe: v => esporteDe(v, 'atleta') && v.caminhos.esporte?.modalidade === 'volei' && funcaoVolei(v) !== 'libero',
    contexto: (_v, r) => ({ placar: r.pick(['13 a 14', '14 a 14', '12 a 14']) }),
    titulo: 'O saque do tie-break',
    texto: (_v, d) => `Quinto set, ${d.placar}. O técnico olha para o banco e para você. A bola é sua no saque.`,
    intencoes: [
      { id: 'viagem', texto: 'Saque viagem, forçado', dica: 'Ace — ou bola na rede.', risco: 0.65, fatores: (v, d) => [tecnicaEsp(v), cabeca(v, d), coragem(v)], desfechos: { otimo: { texto: 'Ace. E outro. O ginásio desabou.', efeitos: { nome: 3, humor: 5, confianca: 1 }, memoria: 'Virou um quinto set com dois aces seguidos.' }, bom: { texto: 'O passe deles saiu ruim; o bloqueio fez o ponto.', efeitos: { nome: 1 } }, ruim: { texto: 'Bola na rede.', efeitos: { estresse: 3 } }, pessimo: { texto: 'Na rede, no match point. Fim de jogo.', efeitos: { nome: -2, estresse: 6, confianca: -1 } } } },
      { id: 'tatico', texto: 'Saque flutuante no líbero deles', dica: 'Menos força, mais pontaria.', risco: 0.3, fatores: v => [leitura(v), tecnicaEsp(v)], desfechos: D('O líbero errou o passe; o contra-ataque foi seu.', 'O passe deles saiu fora da rede.', 'Passe perfeito deles.', 'Saque fácil, ponto deles.') },
      { id: 'seguro', texto: 'Só colocar a bola em jogo', dica: 'Não erra. Não pressiona.', risco: 0.1, fatores: v => [disciplina(v)], desfechos: D('Rali longo, e o seu bloqueio fechou o jogo.', 'O rali seguiu.', 'Eles atacaram de primeira.', 'Ponto deles no contra-ataque.', { otimo: { nome: 1 }, bom: { nome: 0 } }) }
    ]
  },
  {
    id: 'vol_passe', trajetoria: 'atleta', peso: () => 2,
    cabe: v => esporteDe(v, 'atleta') && v.caminhos.esporte?.modalidade === 'volei' && funcaoVolei(v) === 'libero',
    titulo: 'O passe',
    texto: () => 'O sacador deles mira você desde o primeiro set: saque viagem, o mais forte da liga. O técnico pede para você pegar a zona do ponteiro também.',
    intencoes: [
      { id: 'tudo', texto: 'Cobrir a quadra inteira', dica: 'Se der certo, o ataque de vocês joga solto.', risco: 0.55, fatores: v => [tecnicaEsp(v), F('fôlego', (v.corpo.forma - 70) / 50)], desfechos: D('Passe na mão do levantador a noite inteira. O sacador deles desistiu de você.', 'Segurou a recepção; dois aces passaram.', 'O saque achou o buraco entre você e o ponteiro.', 'Três aces seguidos em cima de você. O técnico pediu tempo.', { otimo: { nome: 2, humor: 3, confianca: 1 }, ruim: { nome: -1 }, pessimo: { nome: -2, estresse: 3 } }) },
      { id: 'zona', texto: 'Ficar na sua zona e falar com o ponteiro', dica: 'Menos heroísmo, mais combinação.', risco: 0.3, fatores: v => [leitura(v), social(v)], desfechos: D('A recepção combinada fechou a quadra: nenhum ace no jogo.', 'Funcionou quase sempre.', 'O ponteiro errou o que era dele.', 'Os dois ficaram parados na mesma bola.') },
      { id: 'defesa', texto: 'Ceder um pouco no passe e caprichar na defesa', dica: 'O passe fica meia-boca; o contra-ataque ganha.', risco: 0.35, fatores: v => [tecnicaEsp(v), coragem(v)], desfechos: D('Defendeu o impossível no ponto do set. A torcida levantou.', 'Duas defesas boas; o passe sofreu.', 'O passe ruim virou ponto deles.', 'Nem passe, nem defesa: noite ruim.') }
    ]
  },
  {
    id: 'vol_levantamento', trajetoria: 'atleta', peso: () => 2,
    cabe: v => esporteDe(v, 'atleta') && v.caminhos.esporte?.modalidade === 'volei' && funcaoVolei(v) === 'levantador',
    contexto: (_v, r) => ({ placar: r.pick(['23 a 24', '24 a 24', '13 a 14']) }),
    titulo: 'A bola da decisão',
    texto: (_v, d) => `${d.placar}, passe perfeito na sua mão. O oposto pede a bola; o central está sozinho no meio; o bloqueio deles já sabe para onde ela costuma ir.`,
    intencoes: [
      { id: 'oposto', texto: 'Dar para o oposto, que pediu', dica: 'A bola de segurança — que o bloqueio também espera.', risco: 0.4, fatores: v => [tecnicaEsp(v), cabeca(v)], desfechos: D('O oposto passou pelo triplo. Ponto.', 'Explorou o bloqueio; ponto.', 'Bloqueado.', 'Bloqueio simples, bola no chão do seu lado.') },
      { id: 'central', texto: 'Surpreender com a china pelo meio', dica: 'Se o bloqueio cair no oposto, o central entra sozinho.', risco: 0.55, fatores: v => [leitura(v), tecnicaEsp(v), coragem(v)], desfechos: D('O bloqueio foi no oposto; a china caiu no meio. Ninguém tocou.', 'Ponto pelo meio.', 'O central chegou atrasado.', 'Bola longe do central: erro seu.', { otimo: { nome: 3, humor: 4, confianca: 1 } }) },
      { id: 'segunda', texto: 'Largar de segunda', dica: 'Ninguém espera o levantador atacar — às vezes.', risco: 0.65, fatores: v => [leitura(v), coragem(v)], desfechos: D('A largada de segunda caiu no meio da quadra deles. O ginásio não acreditou.', 'Deu certo, por pouco.', 'O líbero deles leu.', 'Bloqueada na cara.', { otimo: { nome: 3, humor: 5 }, pessimo: { nome: -1, estresse: 2 } }) }
    ]
  }
];

/** Um sorteio estável para a lesão que um desfecho causa (o desfecho já foi sorteado; a gravidade é dele). */
const rngParaLesao = (v: Vida): Rng => rngDe(v.id, 'lesao_situacao', v.t);

/* ------------------------------------------------------------ Farda */

const conceito = (v: Vida) => F('conceito', ((v.trabalho.atual?.desempenho ?? 50) - 55) / 80);
const naFarda = (v: Vida) => trajetoriaDeSituacao(v) === 'militar';

const MODELOS_MILITAR: ModeloSituacao[] = [
  { id: 'mil_apoio', trajetoria: 'militar', peso: () => 1.2, cabe: v => naFarda(v),
    contexto: (_v, r) => ({ ocorrencia: r.pick(['uma enchente', 'um deslizamento de encosta', 'uma seca que deixou cidades sem água']) }),
    titulo: 'A operação de apoio', texto: (_v, d) => `Uma operação de apoio a uma região atingida por ${d.ocorrencia}: você responde por uma equipe pequena, numa área que ninguém mapeou direito.`,
    intencoes: [
      { id: 'plano', texto: 'Seguir à risca o plano da operação', dica: 'Seguro e previsível — se o plano couber no terreno.', risco: 0.15, fatores: v => [disciplina(v), competencia(v), conceito(v)], desfechos: D('O plano coube no terreno. A equipe trabalhou sem um acidente.', 'Cumpriu a missão no prazo.', 'O plano não previa a ponte caída: um dia perdido.', 'A equipe ficou parada esperando ordem enquanto a água subia.', { otimo: { clima: 4 }, pessimo: { clima: -4 } }) },
      { id: 'adaptar', texto: 'Adaptar o plano ao que está vendo', dica: 'Pode salvar o dia — e você responde pela decisão.', risco: 0.5, fatores: v => [leitura(v), coragem(v), lideranca(v)], desfechos: D('A rota que você escolheu chegou antes a uma comunidade isolada. Saiu um elogio em boletim.', 'A adaptação funcionou.', 'Deu mais trabalho que o plano.', 'A decisão foi contestada pelo comando: o relatório ficou com o seu nome.', { otimo: { clima: 6, extra: v => { v.fatos['mil_elogios'] = (v.fatos['mil_elogios'] ?? 0) + 1; marcar(v, 'conquista', 'Elogio em boletim por uma operação de apoio a uma região atingida.', 2, { trilha: 'militar' }); } }, pessimo: { clima: -8 } }, { otimo: 'Recebeu um elogio em boletim pela atuação numa operação de apoio a uma região atingida.' }) },
      { id: 'reforco', texto: 'Pedir reforço e esperar', dica: 'Ninguém se arrisca. O tempo, sim.', risco: 0.2, fatores: v => [clima(v), disciplina(v)], desfechos: D('O reforço chegou rápido e a operação andou.', 'O reforço veio.', 'O reforço demorou.', 'Esperar custou caro para quem esperava ajuda.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] },
  { id: 'mil_subordinado', trajetoria: 'militar', peso: () => 1, cabe: v => naFarda(v) && v.caminhos.militar?.quadro !== 'temporario' && idade(v) >= 24,
    titulo: 'Um soldado da equipe', texto: () => 'Um soldado da sua equipe chegou atrasado pela terceira vez no mês. Em particular, conta que a mãe está doente e sozinha.',
    intencoes: [
      { id: 'regulamento', texto: 'Aplicar o regulamento', dica: 'Correto. Frio.', risco: 0.2, fatores: v => [disciplina(v), conceito(v)], desfechos: D('Ele cumpriu a punição e passou a chegar na hora. Depois agradeceu a clareza.', 'O caso seguiu o regulamento.', 'Ele cumpriu, ressentido.', 'Ele pediu baixa; o resto da equipe ficou mais calado.') },
      { id: 'encaminhar', texto: 'Conversar e encaminhar à assistência social da unidade', dica: 'Leva tempo. Pode resolver de verdade.', risco: 0.3, fatores: v => [social(v), lideranca(v)], desfechos: D('A assistência ajustou a escala dele e ajudou com a mãe. Ele virou o mais leal da equipe.', 'A escala dele mudou.', 'A papelada demorou.', 'O comando achou que você estava passando a mão.', { otimo: { clima: 4 }, pessimo: { clima: -5 } }, { otimo: 'Ajudou um soldado em crise familiar sem largar o regulamento — e ganhou a equipe.' }) },
      { id: 'acobertar', texto: 'Acobertar a falta', dica: 'Resolve hoje. Pode aparecer na inspeção.', risco: 0.6, fatores: v => [coragem(v), F('sorte', 0)], desfechos: D('Ninguém soube; ele resolveu a vida em casa.', 'Passou.', 'O sargento desconfiou.', 'A falta apareceu na inspeção — e o seu nome junto.', { pessimo: { clima: -10 } }) }
    ] },
  { id: 'mil_curso', trajetoria: 'militar', peso: () => 0.8, cabe: v => naFarda(v) && idade(v) <= 46,
    titulo: 'Um curso longe', texto: v => `Abriu uma vaga num curso de especialização ${v.caminhos.militar?.forca === 'marinha' ? 'numa base no litoral' : 'noutra cidade'}: seis meses fora de casa. Conta para a carreira.`,
    intencoes: [
      { id: 'ir', texto: 'Ir', dica: 'Seis meses longe; o currículo agradece.', risco: 0.35, fatores: v => [disciplina(v), F('cabeça', -(v.mente.estresse - 45) / 110)], desfechos: D('Terminou entre os primeiros da turma. O conceito subiu.', 'Concluiu o curso.', 'Concluiu, cansado e com saudade.', 'Não acompanhou a turma e saiu no meio.', { otimo: { clima: 4, extra: v => { const p = v.vinculos[Object.keys(v.vinculos).find(k => v.vinculos[k].romance && ['namoro', 'morando_junto', 'casamento'].includes(v.vinculos[k].romance!.estagio)) ?? '']; if (p) p.tensao = clamp(p.tensao + 5); } } }, { otimo: 'Terminou um curso de especialização militar entre os primeiros da turma.' }) },
      { id: 'recusar', texto: 'Recusar por causa da família', dica: 'A família fica perto; a vaga vai para outro.', risco: 0.1, fatores: () => [], desfechos: D('Ficou, e ninguém cobrou nada.', 'Outro foi.', 'O comando anotou.', 'Na promoção seguinte, quem foi ao curso passou na frente.', { otimo: { nome: 0, humor: 3 }, bom: { nome: 0, humor: 2 } }) }
    ] }
];

/* ------------------------------------------------------------ Mandato */

const pol = (v: Vida) => v.caminhos.politica!;
const experienciaPolitica = (v: Vida) => { const anos = (pol(v).historico.filter(h => h.resultado === 'concluiu').length * 4) + ((v.t - (pol(v).mandato?.tInicio ?? v.t)) / 12); return F('experiência política', Math.min(12, anos) / 12 - 0.35); };
const capital = (v: Vida) => F('capital político', (pol(v).reputacao - 40) / 120);
const base = (v: Vida) => F('base de apoio', (pol(v).apoio - 40) / 120);
const desgasteF = (v: Vida) => F('desgaste', -pol(v).desgaste / 150);
const noMandato = (v: Vida) => trajetoriaDeSituacao(v) === 'politica';

const MODELOS_POLITICA: ModeloSituacao[] = [
  { id: 'pol_audiencia', trajetoria: 'politica', peso: () => 1.2, cabe: v => noMandato(v),
    titulo: 'A audiência pública', texto: v => `Audiência pública sobre ${pol(v).prioridade ? NOME_PRIORIDADE[pol(v).prioridade!].toLowerCase() : 'o orçamento do ano'}: auditório cheio, e um grupo organizado chegou para vaiar.`,
    intencoes: [
      { id: 'ouvir', texto: 'Ouvir tudo e responder ponto a ponto', dica: 'Longo. Quem fica até o fim lembra.', risco: 0.3, fatores: v => [social(v), cabeca(v), experienciaPolitica(v)], desfechos: D('Ficou até a última pergunta. Na saída, até quem vaiou apertou a sua mão.', 'A audiência terminou sem incidente.', 'A vaia abafou as respostas.', 'Uma frase sua, fora de contexto, virou vídeo.', { otimo: { apoio: 4 }, pessimo: { imagem: 'polemica', desgaste: 4 } }, { otimo: 'Numa audiência pública tensa, ouviu até a última pergunta — e saiu maior do que entrou.' }) },
      { id: 'numeros', texto: 'Apresentar os números da gestão', dica: 'Convence quem quer ser convencido.', risco: 0.2, fatores: v => [disciplina(v), leitura(v), capital(v)], desfechos: D('Os números falaram: a imprensa reproduziu os gráficos.', 'Apresentação correta, plateia fria.', 'Ninguém quis saber de gráfico.', 'Um número errado na apresentação virou manchete.', { pessimo: { desgaste: 5 } }) },
      { id: 'ceder', texto: 'Ceder a uma reivindicação no microfone', dica: 'Aplauso hoje; conta depois.', risco: 0.6, fatores: v => [base(v), leitura(v), desgasteF(v)], desfechos: D('A promessa era possível — e foi cumprida no mesmo ano.', 'Aplausos; a conta ficou para depois.', 'A promessa não cabia no orçamento.', 'A promessa não cumprida voltou na campanha seguinte.', { otimo: { apoio: 6, extra: v => { const m = pol(v).mandato; if (m) m.feito += 1; } }, ruim: { desgaste: 4 }, pessimo: { desgaste: 8 } }) }
    ] },
  { id: 'pol_projeto', trajetoria: 'politica', peso: () => 1, cabe: v => noMandato(v) && !!pol(v).prioridade,
    titulo: 'O projeto travado', texto: v => `O seu projeto de ${NOME_PRIORIDADE[pol(v).prioridade!].toLowerCase()} está parado na comissão há meses. Dá para negociar, levar a voto como está ou recolher e esperar.`,
    intencoes: [
      { id: 'negociar', texto: 'Negociar uma emenda com a oposição', dica: 'O projeto muda; a chance de passar sobe.', risco: 0.35, fatores: v => [social(v), base(v), experienciaPolitica(v)], desfechos: D('Aprovado com votos da oposição. O projeto saiu menor — e saiu.', 'Andou na comissão.', 'A oposição pediu demais.', 'O seu próprio grupo achou que você cedeu demais.', { otimo: { apoio: 2, extra: v => { const m = pol(v).mandato; if (m) m.feito += 2; registrarNoMandato(v, `${anoDe(v.t)} · aprovou o projeto de ${NOME_PRIORIDADE[pol(v).prioridade!].toLowerCase()} negociando com a oposição`); } }, pessimo: { apoio: -5 } }, { otimo: 'Aprovou o seu projeto prioritário negociando com a oposição.' }) },
      { id: 'votar', texto: 'Levar a voto como está', dica: 'Ou passa inteiro, ou cai.', risco: 0.65, fatores: v => [base(v), capital(v), desgasteF(v)], desfechos: D('Passou inteiro, por dois votos.', 'Passou com mudanças de última hora.', 'Derrotado no plenário.', 'Derrotado — e a oposição comemorou na tribuna.', { otimo: { extra: v => { const m = pol(v).mandato; if (m) m.feito += 3; registrarNoMandato(v, `${anoDe(v.t)} · aprovou o projeto de ${NOME_PRIORIDADE[pol(v).prioridade!].toLowerCase()} como queria`); } }, pessimo: { desgaste: 6 } }) },
      { id: 'recolher', texto: 'Recolher e reapresentar depois', dica: 'Nada se perde. Nada se ganha.', risco: 0.1, fatores: () => [], desfechos: D('O tempo jogou a favor: no ano seguinte, havia votos.', 'O projeto voltou para a gaveta.', 'A imprensa chamou de recuo.', 'O tema saiu da pauta de vez.', { otimo: { nome: 1 }, bom: { nome: 0 } }) }
    ] },
  { id: 'pol_entrevista', trajetoria: 'politica', peso: () => 1, cabe: v => noMandato(v),
    titulo: 'Ao vivo', texto: () => 'Numa entrevista ao vivo, a jornalista pergunta um número que você não sabe de cabeça.',
    intencoes: v => {
      // A fama não é vitória: amplia. Quem é muito conhecido tem mais gente assistindo — para o bem e para o mal.
      const amplia = clamp((v.notoriedade?.valor ?? 0) / 250, 0, 0.3);
      return [
        { id: 'admitir', texto: 'Admitir que não sabe e prometer o dado', dica: 'Honesto. Pode parecer despreparo.', risco: 0.15 + amplia / 2, fatores: v2 => [social(v2), capital(v2)], desfechos: D('A resposta honesta virou elogio nos comentários.', 'Passou.', 'Chamaram de despreparo.', 'O corte do "não sei" rodou o dia inteiro.', { pessimo: { desgaste: 4 } }) },
        { id: 'arriscar', texto: 'Arriscar um número', dica: 'Se acertar, ninguém lembra. Se errar...', risco: 0.55 + amplia, fatores: v2 => [leitura(v2), F('cabeça', (v2.mente.cognicao - 55) / 90)], desfechos: D('O número estava certo — e você ainda explicou o contexto.', 'Chegou perto.', 'O número estava errado; a correção saiu no dia seguinte.', 'O número errado virou checagem de fatos e meme.', { pessimo: { imagem: 'polemica', desgaste: 6 } }) },
        { id: 'mudar', texto: 'Mudar de assunto', dica: 'Funciona com quem não presta atenção.', risco: 0.4 + amplia / 2, fatores: v2 => [social(v2), experienciaPolitica(v2)], desfechos: D('A transição foi natural; a entrevista seguiu nas suas propostas.', 'Ninguém reparou.', 'A jornalista repetiu a pergunta.', '"O político que fugiu da pergunta."', { pessimo: { desgaste: 4 } }) }
      ];
    } }
];

/* ------------------------------------------------------------ Campo */

const ru = (v: Vida) => v.caminhos.rural!;
const noCampo = (v: Vida) => trajetoriaDeSituacao(v) === 'rural';
const anosNoCampo = (v: Vida) => F('anos de lida', Math.min(15, (v.t - ru(v).tInicio) / 12) / 20 - 0.2);
const caixa = (v: Vida, quanto: number) => F('caixa', v.financas.conta >= quanto ? 0.15 : -0.3);

const MODELOS_RURAL: ModeloSituacao[] = [
  { id: 'rur_venda', trajetoria: 'rural', peso: () => 1.2, cabe: v => noCampo(v),
    titulo: 'A hora de vender', texto: v => `A ${ru(v).cultura === 'leite' ? 'produção do mês' : 'safra'} está pronta. O atravessador oferece pagamento à vista, abaixo do preço. Esperar pode render mais — ou o preço cair.`,
    intencoes: v => [
      { id: 'vista', texto: 'Vender agora ao atravessador', dica: 'Dinheiro certo, menor.', risco: 0.1, fatores: () => [], desfechos: D('O preço caiu na semana seguinte: vender cedo foi o certo.', 'Vendeu, sem surpresa.', 'O preço subiu depois.', 'O preço subiu muito depois; o atravessador ganhou a sua margem.', { otimo: { dinheiro: 3000 }, bom: { dinheiro: 1500, nome: 0 } }) },
      { id: 'esperar', texto: 'Guardar e esperar o preço', dica: 'Pede caixa para aguentar e um pouco de sorte.', risco: 0.6, fatores: v2 => [leitura(v2), caixa(v2, 8000), anosNoCampo(v2)], desfechos: D('O preço subiu bem: o ano fechou no azul.', 'Vendeu um pouco melhor.', 'O preço não se mexeu, e o produto perdeu qualidade.', 'O preço desabou: vendeu abaixo do que o atravessador ofereceu.', { otimo: { dinheiro: 9000 }, bom: { dinheiro: 3000 }, ruim: { dinheiro: -1500 }, pessimo: { dinheiro: -6000 } }, { otimo: 'Segurou a safra esperando o preço — e o ano pagou os anteriores.' }) },
      ...(ru(v).cooperativa ? [{ id: 'coop', texto: 'Vender pela cooperativa', dica: 'Preço médio, sem susto.', risco: 0.2, fatores: (v2: Vida) => [anosNoCampo(v2)], desfechos: D('A cooperativa fechou contrato com um laticínio grande: preço bom.', 'Preço justo, pago em dia.', 'O pagamento atrasou um mês.', 'A cooperativa passou por uma crise e pagou parcelado.', { otimo: { dinheiro: 5000 }, bom: { dinheiro: 2500 } }) }] : [])
    ] },
  { id: 'rur_maquina', trajetoria: 'rural', peso: () => 0.8, cabe: v => noCampo(v) && v.t - ru(v).tInicio >= 24,
    titulo: 'A máquina', texto: () => 'Um vendedor oferece financiar uma máquina nova: dobra o que se planta e tira um peso das costas — parcela por cinco anos.',
    intencoes: [
      { id: 'financiar', texto: 'Financiar a máquina nova', dica: 'Produz mais. A parcela não espera a chuva.', risco: 0.55, fatores: v => [anosNoCampo(v), F('safras', ru(v).anosRuins ? -0.2 : 0.1), leitura(v)], desfechos: D('A máquina pagou a si mesma em três safras.', 'Rendeu; a parcela pesa, mas fecha.', 'Um ano ruim, e a parcela apertou tudo.', 'Duas safras ruins e a parcela atrasada: o banco ligou.', { otimo: { nome: 4, dinheiro: -8000 }, bom: { nome: 2, dinheiro: -8000 }, ruim: { dinheiro: -12000 }, pessimo: { dinheiro: -20000, estresse: 8 } }, { otimo: 'Comprou a primeira máquina nova do sítio — e ela se pagou.' }) },
      { id: 'usado', texto: 'Comprar uma usada, à vista', dica: 'Menos dívida, mais oficina.', risco: 0.3, fatores: v => [caixa(v, 12000), leitura(v)], desfechos: D('A usada era boa: anos de serviço.', 'Funciona, com remendo.', 'Quebrou na colheita.', 'Comprou um problema.', { otimo: { nome: 2, dinheiro: -12000 }, bom: { nome: 1, dinheiro: -12000 }, ruim: { dinheiro: -15000 }, pessimo: { dinheiro: -16000 } }) },
      { id: 'seguir', texto: 'Seguir com o que tem', dica: 'Sem dívida, sem salto.', risco: 0.1, fatores: () => [], desfechos: D('O vizinho que financiou quebrou; você não.', 'Seguiu.', 'O vizinho com máquina nova colheu o dobro.', 'A máquina velha parou de vez.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] },
  { id: 'rur_estiagem', trajetoria: 'rural', peso: () => 1.5, cabe: v => noCampo(v) && ru(v).ultimaSafra === 'ruim',
    titulo: 'A estiagem', texto: v => (ru(v).cultura === 'leite' ? 'A estiagem continua. O pasto secou, o gado emagrece, o poço baixou.' : 'A estiagem continua. A lavoura murcha, e a previsão não traz chuva para as próximas semanas.'),
    intencoes: [
      { id: 'vender', texto: 'Vender parte agora, antes de perder', dica: 'Perde menos. Recomeça menor.', risco: 0.2, fatores: v => [leitura(v), anosNoCampo(v)], desfechos: D('Vendeu na hora certa: o preço desabou na semana seguinte.', 'Perdeu menos do que os vizinhos.', 'Vendeu barato.', 'Vendeu barato — e a chuva veio no mês seguinte.', { otimo: { dinheiro: 3000 }, ruim: { dinheiro: -2000 }, pessimo: { dinheiro: -5000 } }) },
      { id: 'poco', texto: 'Furar um poço mais fundo', dica: 'Caro. Se achar água, salva este ano e os próximos.', risco: 0.5, fatores: v => [caixa(v, 15000), F('sorte', 0)], desfechos: D('Água boa a sessenta metros. O sítio nunca mais secou igual.', 'Achou água, pouca.', 'O poço deu pouca água pelo preço.', 'Poço seco. O dinheiro foi junto.', { otimo: { dinheiro: -15000, nome: 4 }, bom: { dinheiro: -15000, nome: 2 }, ruim: { dinheiro: -15000 }, pessimo: { dinheiro: -15000, estresse: 8 } }, { otimo: 'Furou o poço que acabou com as estiagens no sítio.' }) },
      { id: 'esperar', texto: 'Esperar a chuva', dica: 'Às vezes ela vem.', risco: 0.6, fatores: () => [F('sorte', 0)], desfechos: D('Choveu na semana seguinte. Salvou a maior parte.', 'Choveu tarde, mas choveu.', 'A chuva não veio a tempo.', 'Perdeu quase tudo.', { otimo: { nome: 1 }, ruim: { dinheiro: -4000 }, pessimo: { dinheiro: -9000, estresse: 8 } }) }
    ] }
];

/* ------------------------------------------------------------ Universidade */

const naUni = (v: Vida) => trajetoriaDeSituacao(v) === 'universidade';
const desempenhoCurso = (v: Vida) => F('desempenho no curso', ((v.educacao.matricula?.desempenho ?? 55) - 55) / 70);
const colegaDaFaculdade = (v: Vida) => Object.values(v.vinculos).find(x => x.convivio.includes('faculdade') && v.pessoas[x.pessoaId]?.vivo && !x.romance);

const MODELOS_UNIVERSIDADE: ModeloSituacao[] = [
  { id: 'uni_grupo', trajetoria: 'universidade', peso: () => 1, cabe: v => naUni(v),
    titulo: 'O trabalho em grupo', texto: () => 'O trabalho em grupo vale metade da nota do semestre, e dois colegas não fizeram nada até a véspera.',
    intencoes: [
      { id: 'sozinho', texto: 'Fazer a parte deles', dica: 'A nota sai. A noite, não.', risco: 0.2, fatores: v => [disciplina(v), desempenhoCurso(v)], desfechos: D('Nota máxima — e o professor percebeu de quem era o trabalho.', 'Entregue, nota boa.', 'Entregue, nota mediana e uma madrugada perdida.', 'Entregou mal feito e ficou com a nota que todos tiveram.', { ruim: { estresse: 5 }, pessimo: { estresse: 7 } }) },
      { id: 'conversar', texto: 'Chamar o grupo para conversar', dica: 'Pode reorganizar tudo — ou virar briga.', risco: 0.35, fatores: v => [social(v), lideranca(v)], desfechos: D('A conversa reorganizou o grupo; um deles virou amigo.', 'Cada um fez um pedaço.', 'Ninguém mudou nada.', 'Virou briga no grupo da turma.', { otimo: { extra: v => { const c = colegaDaFaculdade(v); if (c) c.proximidade = clamp(c.proximidade + 8); } }, pessimo: { extra: v => { const c = colegaDaFaculdade(v); if (c) c.proximidade = clamp(c.proximidade - 8); } } }) },
      { id: 'professor', texto: 'Falar com o professor', dica: 'Justo. Nem todo mundo vê assim.', risco: 0.45, fatores: v => [coragem(v), desempenhoCurso(v)], desfechos: D('O professor dividiu as notas pelo que cada um fez.', 'O professor deu mais um prazo.', 'O professor disse que grupo é grupo.', 'A turma soube, e o clima azedou.') }
    ] },
  { id: 'uni_semana', trajetoria: 'universidade', peso: () => 1, cabe: v => naUni(v) && idade(v) >= 19,
    titulo: 'A mesma semana', texto: () => 'Na mesma semana: a prova mais difícil do curso e o processo seletivo de um estágio disputado.',
    intencoes: [
      { id: 'prova', texto: 'Priorizar a prova', dica: 'O curso primeiro.', risco: 0.2, fatores: v => [disciplina(v), desempenhoCurso(v)], desfechos: D('A melhor nota da turma.', 'Passou bem.', 'Passou, raspando — e o estágio foi para outro.', 'Mesmo estudando, não passou.') },
      { id: 'estagio', texto: 'Priorizar o estágio', dica: 'Uma porta real — se abrir.', risco: 0.5, fatores: v => [social(v), F('cabeça', -(v.mente.estresse - 45) / 110), desempenhoCurso(v)], desfechos: D('A empresa chamou: a vaga é sua, se quiser.', 'Foi bem na entrevista; ficou na lista.', 'Não passou no estágio, e a prova foi mal.', 'Ficou sem os dois.', { otimo: { extra: v => abrirEstagio(v) }, ruim: { nome: -1 }, pessimo: { nome: -2 } }, { otimo: 'Escolheu o processo seletivo em vez da prova — e ganhou a vaga de estágio.' }) },
      { id: 'ambos', texto: 'Tentar dar conta dos dois', dica: 'Pede cabeça fria e noites curtas.', risco: 0.6, fatores: v => [F('cabeça', -(v.mente.estresse - 45) / 110), disciplina(v), F('fôlego', (v.corpo.forma - 60) / 80)], desfechos: D('Deu conta dos dois. Ninguém entendeu como.', 'Foi razoável nos dois.', 'Foi mal nos dois.', 'Adoeceu na quarta-feira.', { otimo: { extra: v => abrirEstagio(v) }, ruim: { estresse: 6 }, pessimo: { estresse: 9 } }) }
    ] },
  { id: 'uni_professora', trajetoria: 'universidade', peso: () => 0.8, cabe: v => naUni(v) && (v.educacao.matricula?.desempenho ?? 0) >= 58 && !v.rotinas.some(r => r.id === 'iniciacao'),
    titulo: 'O convite da professora', texto: () => 'Depois da aula, uma professora pergunta se você toparia ajudar num projeto dela — sem bolsa por enquanto, no semestre mais cheio.',
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar', dica: 'Mais horas. Uma porta para a pesquisa.', risco: 0.3, fatores: v => [desempenhoCurso(v), F('cabeça', (v.mente.cognicao - 55) / 90)], desfechos: D('O projeto rendeu: ela ofereceu uma vaga de iniciação científica, com bolsa.', 'Aprendeu muito; o semestre apertou.', 'O projeto não andou.', 'O semestre desandou junto.', { otimo: { extra: v => abrirIniciacao(v) }, ruim: { estresse: 4 }, pessimo: { nome: -2, estresse: 6 } }) },
      { id: 'recusar', texto: 'Agradecer e recusar por agora', dica: 'O semestre fica inteiro.', risco: 0.1, fatores: () => [], desfechos: D('Ela entendeu e disse para procurar depois.', 'Seguiu o semestre.', 'Outro aluno ficou com a vaga.', 'O projeto virou o artigo de outro aluno.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] }
];

/** O estágio que o desfecho abriu: uma porta real, na área do curso (aceitar continua sendo escolha). */
function abrirEstagio(v: Vida): void {
  const area = v.educacao.matricula?.area;
  const oc = OCUPACOES.find(o => o.contrato === 'estagio' && area && (o.area as readonly string[] | undefined ?? []).includes(area)) ?? OCUPACOES.find(o => o.id === 'estagio_adm');
  if (!oc) return;
  novaOportunidade(v, { tipo: 'estagio', ocupacaoId: oc.id, meses: 6, chave: 'uni_estagio', titulo: 'O estágio da semana difícil', texto: `A empresa do processo seletivo chamou: a vaga de ${oc.nome[0]} é sua, se quiser.`, bonus: 0.4, municipioId: v.moradia.municipioId });
}
/** A iniciação científica que o projeto da professora abriu. */
function abrirIniciacao(v: Vida): void {
  novaOportunidade(v, { tipo: 'iniciacao', atividade: 'iniciacao', meses: 12, chave: 'uni_iniciacao', titulo: 'Uma iniciação científica', texto: 'A professora do projeto conseguiu uma bolsa de iniciação científica e pensou em você.' });
}

/* ------------------------------------------------------------ Medicina (preceptoria) */

const MODELOS_MEDICINA_MAIS: ModeloSituacao[] = [
  { id: 'med_preceptoria', trajetoria: 'medicina', cabe: v => !!especialidadeMedica(v) && idade(v) >= 34,
    titulo: 'O residente', texto: () => 'Um residente sob a sua supervisão errou uma conduta simples no plantão. Ninguém mais viu; o paciente está bem.',
    intencoes: [
      { id: 'ensinar', texto: 'Corrigir em particular e ensinar', dica: 'Forma alguém. Toma tempo.', risco: 0.2, fatores: v => [social(v), competencia(v)], desfechos: D('Anos depois, ele contou numa homenagem que aprendeu ali a ser médico.', 'Ele entendeu e não repetiu.', 'Ele ficou na defensiva.', 'Ele repetiu o erro no mês seguinte.', { otimo: { humor: 4 } }, { otimo: 'Formou residentes — um deles lembrou disso numa homenagem anos depois.' }) },
      { id: 'registrar', texto: 'Registrar formalmente', dica: 'Correto. Ele vai lembrar.', risco: 0.3, fatores: v => [disciplina(v), clima(v)], desfechos: D('O registro virou caso de ensino no programa, sem expor ninguém.', 'Registrado.', 'Ele passou a evitar você.', 'O programa abriu sindicância; o clima azedou.', { pessimo: { clima: -5 } }) },
      { id: 'deixar', texto: 'Deixar passar', dica: 'Paz agora.', risco: 0.5, fatores: () => [F('sorte', 0)], desfechos: D('Ele mesmo percebeu e veio contar.', 'Ninguém soube.', 'O erro se repetiu.', 'O erro se repetiu, e alguém perguntou quem supervisionava.', { otimo: { nome: 0 }, bom: { nome: 0 }, pessimo: { clima: -6 } }) }
    ] }
];

export const MODELOS: ModeloSituacao[] = [...MODELOS_FUTEBOL, ...MODELOS_PROFISSOES, ...MODELOS_ESPORTES, ...MODELOS_MILITAR, ...MODELOS_POLITICA, ...MODELOS_RURAL, ...MODELOS_UNIVERSIDADE, ...MODELOS_MEDICINA_MAIS];

/** As situações vividas, para a tela (as mais recentes primeiro). */
export function momentosDaCarreira(v: Vida, n = 8): { ano: number; texto: string; desfecho: Desfecho; intencao: string }[] {
  return (v.caminhos.situacoes ?? []).slice(-n).reverse().map(x => ({ ano: anoDe(x.t), texto: x.texto, desfecho: x.desfecho, intencao: x.intencao }));
}

/** Escreve a memória de um desfecho marcante na Linha da Vida (o resto fica só no registro da carreira). */
export function memoriaDaSituacao(v: Vida, memoria: string | undefined, desfecho: Desfecho): void {
  if (!memoria) return;
  escrever(v, { texto: memoria, relevancia: desfecho === 'otimo' ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: desfecho === 'otimo' || desfecho === 'bom' ? 'bom' : 'ruim', escolha: true });
}
