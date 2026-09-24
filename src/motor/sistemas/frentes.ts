/**
 * Frentes: aptidão não é destino.
 *
 *   APTIDÃO     facilidade de nascença. Derivada da semente da vida (estável,
 *               nunca guardada, nunca mostrada como número).
 *   INTERESSE   vontade de continuar. Sobe quando a prática dá frutos e quando
 *               alguém incentiva; esfria quando a prática para.
 *   EXPERIÊNCIA meses de prática de verdade, ponderados pela intensidade.
 *   HABILIDADE  o resultado: cresce com prática × facilidade × idade certa ×
 *               contexto (aula paga, projeto social, treino sério) e rende
 *               cada vez menos perto do topo; cai quando a prática para.
 *
 * Consequências:
 *   - sem facilidade, anos de prática ainda levam alguém a jogar bem (a
 *     facilidade muda a velocidade, não o teto);
 *   - com facilidade e sem prática, a habilidade não sai do lugar;
 *   - um clique não faz ninguém craque: o ganho de um ano é limitado.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Frente, Vida } from '../tipos';
import { FRENTES, MATERIAS, estagioDe, modeloFrente } from '../dados/frentes';
import { idade } from '../nucleo';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/**
 * Facilidade de nascença numa frente, −1..1 (quase normal: soma de dois
 * sorteios estáveis). Não depende de nada que o jogador faça.
 */
export function aptidao(v: Vida, d: Dominio): number {
  const a = hash(`${v.id}:apt:${d}`);
  const b = hash(`${v.id}:apt2:${d}`);
  return Math.round((a + b - 1) * 100) / 100;
}

export function frente(v: Vida, d: Dominio): Frente | undefined {
  return v.caminhos.frentes[d];
}

export const habilidade = (v: Vida, d: Dominio) => v.caminhos.frentes[d]?.habilidade ?? 0;
export const interesse = (v: Vida, d: Dominio) => v.caminhos.frentes[d]?.interesse ?? 0;
export const mesesDePratica = (v: Vida, d: Dominio) => v.caminhos.frentes[d]?.meses ?? 0;

export function garantirFrente(v: Vida, d: Dominio): Frente {
  let f = v.caminhos.frentes[d];
  if (!f) {
    f = { interesse: 35 + Math.round(Math.max(0, aptidao(v, d)) * 20), meses: 0, habilidade: Math.max(0, Math.round(4 + aptidao(v, d) * 6)), tInicio: v.t, tUltimo: v.t, retomadas: 0, auge: 0 };
    v.caminhos.frentes[d] = f;
  }
  return f;
}

/** Fator da idade no aprendizado: dentro da janela rende mais; fora dela, menos. */
function fatorIdade(d: Dominio, i: number): number {
  const m = modeloFrente(d);
  const [a, b] = m.janela;
  if (i < a) return i < a - 3 ? 0.35 : 0.7;
  if (i <= b) return 1.15;
  const passou = i - b;
  return Math.max(0.35, 1 - passou * (m.categoria === 'esporte' ? 0.05 : 0.018));
}

/**
 * Um ano de prática numa frente.
 *
 * `peso` é a intensidade efetiva (0.5 leve · 1 regular · 1.6 a sério) e
 * `qualidade` o contexto (1 normal; >1 com professor, clube ou curso; <1
 * sozinho, sem estrutura).
 */
export function praticar(v: Vida, r: Rng, d: Dominio, peso: number, qualidade = 1): number {
  const f = garantirFrente(v, d);
  const i = idade(v);
  const m = modeloFrente(d);
  if (v.t - f.tUltimo > 24 && f.meses > 0) f.retomadas += 1;
  const apt = aptidao(v, d);
  // A facilidade muda a velocidade (±45%), não o teto.
  const velocidade = 1 + apt * 0.45;
  const vontade = 0.75 + f.interesse / 200;
  let corpo = 1;
  if (m.categoria === 'esporte') corpo = 0.7 + v.corpo.forma / 170 - Math.max(0, 55 - v.corpo.saude) / 120;
  // Rende menos perto do topo: 90 é raríssimo mesmo com anos de prática.
  const teto = Math.max(0.05, 1 - f.habilidade / 104);
  const ganho = 7.2 * peso * velocidade * vontade * fatorIdade(d, i) * qualidade * corpo * teto * (0.8 + r.next() * 0.4);
  f.habilidade = clamp(Math.round((f.habilidade + ganho) * 10) / 10);
  f.meses += Math.round(12 * peso);
  f.tUltimo = v.t;
  f.auge = Math.max(f.auge, f.habilidade);
  // Interesse: a prática que rende alimenta; a que não rende cansa. Pressão também cansa.
  const rendeu = ganho >= 3 ? 3 : ganho >= 1.5 ? 1 : -2;
  const cansaco = v.mente.estresse > 70 ? -3 : 0;
  f.interesse = clamp(Math.round(f.interesse + rendeu + cansaco + apt * 2 + (r.next() - 0.5) * 4));
  // O corpo cobra depois de certa idade, mesmo praticando.
  if (m.declinio && i > m.declinio) f.habilidade = clamp(Math.round((f.habilidade - (i - m.declinio) * 0.5) * 10) / 10);
  return ganho;
}

/** Frentes paradas: a habilidade cai devagar, o interesse esfria. */
export function esquecerFrentes(v: Vida, praticadas: Set<Dominio>): void {
  const i = idade(v);
  for (const [d, f] of Object.entries(v.caminhos.frentes) as [Dominio, Frente][]) {
    if (praticadas.has(d)) continue;
    const m = modeloFrente(d);
    if (!m) continue;
    const parado = (v.t - f.tUltimo) / 12;
    if (parado < 1) continue;
    // O que se aprendeu fundo não some: cai até metade do auge, não abaixo.
    const piso = f.auge * 0.45;
    const corpo = m.declinio && i > m.declinio ? 1.6 : 1;
    f.habilidade = Math.max(piso, Math.round((f.habilidade - m.esquece * corpo) * 10) / 10);
    f.interesse = clamp(Math.round(f.interesse - (parado < 4 ? 5 : 2)));
  }
}

/**
 * A escola exercita as matérias todo ano. A postura, a facilidade e o
 * interesse fazem cada matéria ir para um lado: ninguém é bom em tudo porque
 * é "inteligente".
 */
export function estudarMaterias(v: Vida, r: Rng, fator: number): void {
  const postura = v.educacao.postura === 'dedicada' ? 1.3 : v.educacao.postura === 'relaxada' ? 0.65 : 1;
  for (const d of MATERIAS) {
    const f = garantirFrente(v, d);
    // A matéria de que se gosta recebe mais atenção sem ninguém mandar.
    const gosto = 0.8 + f.interesse / 250;
    praticar(v, r, d, 0.75 * postura * gosto * fator, 1);
  }
}

/** Média das matérias (a "nota" geral). */
export function mediaEscolar(v: Vida): number {
  const hs = MATERIAS.map(d => habilidade(v, d));
  return hs.reduce((s, x) => s + x, 0) / hs.length;
}

/** A matéria mais forte e a mais fraca (para a escola dizer em palavras). */
export function materiasExtremas(v: Vida): { forte?: Dominio; fraca?: Dominio } {
  const lista = MATERIAS.map(d => ({ d, h: habilidade(v, d) })).filter(x => v.caminhos.frentes[x.d]).sort((a, b) => b.h - a.h);
  if (lista.length < 2) return {};
  const forte = lista[0].h - lista[lista.length - 1].h >= 6 ? lista[0].d : undefined;
  const fraca = forte ? lista[lista.length - 1].d : undefined;
  return { forte, fraca };
}

/* ------------------------------------------------------------- Palavras */

/** Uma frase humana sobre uma frente ("Tem ouvido para música, mas pratica pouco"). */
export function leituraDaFrente(v: Vida, d: Dominio): string {
  const f = v.caminhos.frentes[d];
  const m = modeloFrente(d);
  if (!f) return '';
  const e = estagioDe(f.habilidade);
  const anos = Math.floor(f.meses / 12);
  const parado = (v.t - f.tUltimo) / 12;
  const apt = aptidao(v, d);
  const base = m.estagios[e];
  if (parado >= 2) {
    const quando = parado >= 10 ? 'há muitos anos' : `há ${Math.floor(parado)} anos`;
    return f.auge >= 50 ? `Já foi bom nisso — parou ${quando}, mas não esqueceu de todo.` : `Parou ${quando}.`;
  }
  if (apt >= 0.35 && anos <= 1) return `${cap(m.facilidade)}, e está só no começo.`;
  if (apt >= 0.35 && f.habilidade < 40 && f.meses < 24) return `${cap(m.facilidade)}, mas pratica pouco.`;
  if (apt <= -0.3 && f.habilidade >= 45) return `${cap(base)} — foi na raça, não no dom.`;
  const tempo = anos >= 2 ? ` Há ${anos} anos.` : '';
  return `${cap(base)}.${tempo}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Frentes que contam na vida da pessoa agora (as praticadas e as que já foram fortes). */
export function frentesDaVida(v: Vida): { d: Dominio; nome: string; texto: string; ativa: boolean }[] {
  const praticando = new Set<Dominio>();
  for (const f of Object.entries(v.caminhos.frentes) as [Dominio, Frente][]) if (v.t - f[1].tUltimo <= 12) praticando.add(f[0]);
  return (Object.entries(v.caminhos.frentes) as [Dominio, Frente][])
    .filter(([d, f]) => !MATERIAS.includes(d) && (praticando.has(d) || f.auge >= 40))
    .sort((a, b) => Number(praticando.has(b[0])) - Number(praticando.has(a[0])) || b[1].habilidade - a[1].habilidade)
    .slice(0, 6)
    .map(([d]) => ({ d, nome: modeloFrente(d).nome, texto: leituraDaFrente(v, d), ativa: praticando.has(d) }));
}

export { FRENTES, MATERIAS };
