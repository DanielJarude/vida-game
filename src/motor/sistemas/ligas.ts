/**
 * AS LIGAS DO MUNDO DA VIDA (REWORK 9 · FUT-01).
 *
 * Antes, a divisão morava só no contrato do atleta (`e.nivel`) e o clube não
 * tinha divisão própria: um teto pelo porte impedia o acesso (o "tradicional"
 * campeão da Série B ficava na Série B, ano após ano). Agora cada país em que
 * a vida joga tem uma TABELA persistente — em que divisão cada clube do
 * catálogo está nesta temporada — e as mesmas regras valem para todos:
 *
 *   temporada → colocação → acesso/rebaixamento → divisão seguinte →
 *   adversários e propostas (os clubes que estão de fato naquela divisão) →
 *   histórico (a temporada guarda a divisão disputada).
 *
 * O porte do clube continua dizendo a FORÇA do elenco (quem costuma brigar em
 * cima), nunca um teto: um clube tradicional que sobe joga a elite — e, mais
 * fraco que os grandes, tende a brigar contra a queda.
 *
 * Divisões 2–4 têm 20 vagas; os clubes do catálogo ocupam vagas e o resto é de
 * clubes sem nome no jogo. A divisão 1 é o conjunto dos campeonatos regionais
 * (sem limite). Quantos sobem e caem é do país (`PerfilEsportivo.acesso`); ligas
 * fechadas (franquias: MLS, A-League) não têm acesso nem rebaixamento.
 *
 * Os clubes do mundo sorteiam a temporada por `rngDe` (nunca o gerador
 * principal); o clube da vida usa o resultado que a temporada dele produziu.
 */

import type { LigaDoPais, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { clubePorNome, clubesDoPais, type Clube } from '../dados/clubes';
import { paisDaCidade } from '../dados/lugares';
import { PAIS_PADRAO, perfilDoPais, temPerfil } from '../mundo/registro';
import { anoDe } from '../tempo';

export type Nivel = 1 | 2 | 3 | 4;
export const VAGAS_POR_DIVISAO = 20;

/** A força do elenco pelo porte (4 grande · 3 tradicional · 2 regional ou fora do catálogo): a mesma régua de sempre. */
export const forcaDoClube = (nome: string, pais?: string): number => {
  const c = clubePorNome(nome, pais);
  return !c ? 2 : c.porte === 'grande' ? 4 : c.porte === 'tradicional' ? 3 : 2;
};

/**
 * A força com que um clube do catálogo disputa a temporada do MUNDO (frações: um grande é melhor que a média da elite;
 * um tradicional fica entre a elite e a segunda; um regional, pouco acima das de acesso). Com os inteiros, um
 * tradicional era exatamente a média da segunda divisão e quase nunca voltava — numa liga de catálogo pequeno (a
 * Espanha), os clubes conhecidos iam se acumulando embaixo. A temporada do clube DA VIDA usa `forcaDoClube`.
 */
const forcaNaLiga = (nome: string, pais: string): number => { const c = clubePorNome(nome, pais); return !c ? 2 : c.porte === 'grande' ? 4.5 : c.porte === 'tradicional' ? 3.4 : 2.2; };

/** As regras de acesso do país: quantos trocam de lugar entre cada par de divisões (1↔2, 2↔3, 3↔4) — ou liga fechada. */
export function regrasDeAcesso(pais: string): { fechada: boolean; troca: [number, number, number] } {
  const a = perfilDoPais(temPerfil(pais) ? pais : PAIS_PADRAO).esporte.acesso;
  if (a === 'fechada') return { fechada: true, troca: [0, 0, 0] };
  return { fechada: false, troca: a?.troca ?? [3, 3, 3] };
}

/** A temporada que está sendo jogada agora (o mesmo rótulo de `Temporada.ano`). */
export const temporadaCorrente = (v: Vida) => anoDe(v.t - 6);

/* ------------------------------------------------------------ A tabela inicial */

/**
 * Onde cada clube começa, no universo desta vida: pelo porte (grande na
 * elite, tradicional na segunda, regional nas de acesso ou no regional),
 * com as vagas de 20 respeitadas — o excedente mais forte sobe enquanto
 * houver lugar em cima; o resto desce.
 */
function distribuicaoInicial(v: Vida, pais: string): Record<string, Nivel> {
  const r = rngDe(v.id, 'liga-inicio', pais);
  const clubes = [...clubesDoPais(pais)].sort((a, b) => a.nome.localeCompare(b.nome));
  const jitter = new Map<string, number>(clubes.map(c => [c.nome, r.next()]));
  const forca = (c: Clube) => forcaDoClube(c.nome, pais) + (jitter.get(c.nome) ?? 0);
  const div: Record<string, Nivel> = {};
  for (const c of clubes) div[c.nome] = c.porte === 'grande' ? 4 : c.porte === 'tradicional' ? 3 : (jitter.get(c.nome)! < 0.5 ? 2 : 1);
  const em = (n: number) => clubes.filter(c => div[c.nome] === n).sort((a, b) => forca(b) - forca(a));
  // A elite do catálogo vem cheia: o catálogo de um país lista os clubes conhecidos, e os tradicionais mais fortes
  // completam a primeira divisão até as vagas dela (na Espanha, quase todos; no Brasil, os sete mais fortes).
  for (const c of em(3)) { if (em(4).length >= VAGAS_POR_DIVISAO) break; div[c.nome] = 4; }
  // A elite cheia demais: os mais fracos descem.
  for (const n of [4, 3, 2] as const) {
    const lista = em(n);
    if (lista.length <= VAGAS_POR_DIVISAO) continue;
    let excedente = lista.length - VAGAS_POR_DIVISAO;
    // Primeiro, os mais fortes sobem enquanto houver vaga em cima (a elite de um país com poucos grandes se completa).
    if (n < 4) {
      const cima = VAGAS_POR_DIVISAO - em(n + 1).length;
      for (const c of lista.slice(0, Math.max(0, Math.min(excedente, cima)))) { div[c.nome] = (n + 1) as Nivel; excedente--; }
    }
    for (const c of em(n).slice(VAGAS_POR_DIVISAO)) div[c.nome] = (n - 1) as Nivel;
  }
  return div;
}

/** Os clubes que a vida conhece numa divisão (o contrato do atleta, a passagem do técnico): a tabela começa concordando com eles. */
function fixarOsDaVida(v: Vida, pais: string, liga: LigaDoPais): void {
  const atletas = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].filter(e => e && e.modalidade === 'futebol' && e.fase === 'profissional');
  for (const e of atletas) {
    if (e!.emprestimo && paisDaCidade(e!.emprestimo.municipioId) === pais) fixar(liga, e!.emprestimo.clube, e!.emprestimo.nivel, pais);
    if (paisDaCidade(e!.municipioId) === pais) fixar(liga, e!.clube, e!.nivel, pais);
  }
  const ps = v.caminhos.tecnico?.passagens ?? [];
  const p = ps[ps.length - 1];
  if (p && p.ate === undefined && !p.selecao && paisDaCidade(p.municipioId) === pais) fixar(liga, p.clube, p.nivel, pais);
}

/**
 * Põe o clube NESTA divisão (o que a vida já viveu é verdade). Se a divisão
 * estiver cheia, o clube mais fraco de lá troca de lugar com ele — a contagem
 * de vagas nunca estoura.
 */
export function fixar(liga: LigaDoPais, clube: string, nivel: number, pais: string): void {
  const n = clamp(Math.round(nivel), 1, 4) as Nivel;
  const de = liga.div[clube];
  if (de === n) return;
  liga.div[clube] = n;
  if (n === 1) return;
  const la = Object.keys(liga.div).filter(c => c !== clube && liga.div[c] === n);
  if (la.length < VAGAS_POR_DIVISAO) return;
  const fraco = la.sort((a, b) => forcaDoClube(a, pais) - forcaDoClube(b, pais) || a.localeCompare(b))[0];
  liga.div[fraco] = (de ?? (n > 1 ? n - 1 : 1)) as Nivel;
}

/* ------------------------------------------------------------ Leitura */

/** A tabela do país nesta vida (criada na primeira vez, já concordando com o contrato e o banco de agora). */
export function ligaDe(v: Vida, pais: string): LigaDoPais {
  const todas = (v.caminhos.ligas ??= {});
  let liga = todas[pais];
  if (!liga) {
    liga = { ano: temporadaCorrente(v) - 1, div: distribuicaoInicial(v, pais) };
    todas[pais] = liga;
    fixarOsDaVida(v, pais, liga);
  }
  // Anos sem ninguém olhando (a vida estava longe do futebol): o mundo jogou as temporadas do mesmo jeito.
  const ate = temporadaCorrente(v) - 1;
  if (liga.ano < ate) avancar(v, pais, liga, ate);
  return liga;
}

/** Em que divisão o clube está nesta temporada (na tabela da vida; fora do catálogo, o que a vida fixou ou o porte). */
export function divisaoDoClube(v: Vida, clube: string, pais: string): Nivel {
  const liga = ligaDe(v, pais);
  return liga.div[clube] ?? (Math.min(2, forcaDoClube(clube, pais)) as Nivel);
}

/**
 * Os clubes do catálogo que estão nesta divisão agora. Num país de poucos
 * clubes, a divisão pode estar vazia: aí vêm os da divisão mais próxima — e
 * quem usa a lista deve ler a divisão do clube escolhido (`divisaoDoClube`).
 */
export function clubesNaDivisao(v: Vida, nivel: number, excluir: string | undefined, pais: string): Clube[] {
  const liga = ligaDe(v, pais);
  const todos = clubesDoPais(pais).filter(c => c.nome !== excluir);
  for (const d of [0, -1, 1, -2, 2, -3, 3]) {
    const lista = todos.filter(c => liga.div[c.nome] === nivel + d);
    if (lista.length) return lista;
  }
  return todos;
}

/* ------------------------------------------------------------ A temporada do mundo */

interface Fixo { clube: string; colocacao: number }

/** Joga as temporadas que faltam até `ate` (a última, com o resultado do clube da vida, se houver). */
function avancar(v: Vida, pais: string, liga: LigaDoPais, ate: number, fixo?: Fixo): void {
  // Uma vida que passou décadas longe: as temporadas antigas não mudam nada que alguém vá ler — basta o fim do caminho.
  if (ate - liga.ano > 40) liga.ano = ate - 40;
  while (liga.ano < ate) {
    const ano = liga.ano + 1;
    jogarTemporada(v, pais, liga, ano, ano === ate ? fixo : undefined);
    liga.ano = ano;
  }
}

/**
 * Uma temporada inteira do país: a colocação de cada clube do catálogo em
 * cada divisão (posições únicas: um campeão só), e as trocas de divisão pelas
 * regras do país. O clube fixo (o da vida) fica na colocação que jogou.
 */
function jogarTemporada(v: Vida, pais: string, liga: LigaDoPais, ano: number, fixo?: Fixo): void {
  const r = rngDe(v.id, 'liga', pais, ano);
  const regras = regrasDeAcesso(pais);
  const nomes = Object.keys(liga.div).sort();
  const pos = new Map<string, number>();
  const campeoes: Partial<Record<Nivel, string>> = {};
  for (const n of [2, 3, 4] as const) {
    const ocupadas = new Set<number>();
    if (fixo && liga.div[fixo.clube] === n) { const p = clamp(Math.round(fixo.colocacao), 1, VAGAS_POR_DIVISAO); pos.set(fixo.clube, p); ocupadas.add(p); }
    const xs = nomes.filter(c => liga.div[c] === n && c !== fixo?.clube)
      // A força do elenco diante da divisão: um grande na segunda divisão briga pelo acesso (e costuma voltar logo); um
      // tradicional que subiu briga contra a queda. (4 posições por degrau: com 3, os grandes ficavam anos embaixo.)
      .map(c => ({ c, x: 11 - (forcaNaLiga(c, pais) - n) * 4 + r.normal() * 4 }))
      .sort((a, b) => a.x - b.x);
    for (const { c, x } of xs) {
      const quer = clamp(Math.round(x), 1, VAGAS_POR_DIVISAO);
      let p = quer;
      for (let d = 0; d < VAGAS_POR_DIVISAO; d++) {
        if (quer + d <= VAGAS_POR_DIVISAO && !ocupadas.has(quer + d)) { p = quer + d; break; }
        if (quer - d >= 1 && !ocupadas.has(quer - d)) { p = quer - d; break; }
      }
      ocupadas.add(p);
      pos.set(c, p);
    }
    const campeao = [...pos].find(([c, p]) => p === 1 && liga.div[c] === n);
    if (campeao) campeoes[n] = campeao[0];
  }
  // A divisão 1 são os campeonatos regionais: cada clube tem a sua colocação no seu (1..12); sobe quem chega em cima.
  const regionais = nomes.filter(c => liga.div[c] === 1).map(c => ({ c, x: c === fixo?.clube ? fixo.colocacao : clamp(Math.round(6.5 - (forcaNaLiga(c, pais) - 1) * 2 + r.normal() * 3), 1, 12) }));
  for (const { c, x } of regionais) pos.set(c, x);

  const subiram: string[] = [], cairam: string[] = [];
  if (!regras.fechada) {
    const novo: Record<string, Nivel> = { ...liga.div };
    for (const n of [2, 3, 4] as const) {
      const caem = regras.troca[n - 2];
      const sobem = n < 4 ? regras.troca[n - 1] : 0;
      for (const c of nomes.filter(x => liga.div[x] === n)) {
        const p = pos.get(c)!;
        if (n < 4 && p <= sobem) { novo[c] = (n + 1) as Nivel; subiram.push(c); }
        else if (p > VAGAS_POR_DIVISAO - caem) { novo[c] = (n - 1) as Nivel; cairam.push(c); }
      }
    }
    // Dos regionais, sobem até `troca[0]`: o clube da vida (se chegou entre os dois primeiros) e os melhores do resto.
    const vagas = regras.troca[0];
    const candidatos = regionais.filter(x => x.x <= 2).sort((a, b) => (a.c === fixo?.clube ? -1 : b.c === fixo?.clube ? 1 : a.x - b.x));
    for (const { c } of candidatos.slice(0, vagas)) { novo[c] = 2; subiram.push(c); }
    liga.div = novo;
  }
  liga.ultima = { ano, campeoes, subiram, cairam };
}

/**
 * Fecha a temporada do clube da vida: a tabela do país joga o ano com o
 * resultado dele, e devolve o que aconteceu com ele (+1 acesso, −1 queda, 0).
 * A divisão em que a temporada foi jogada é a que vale (o histórico guarda ela).
 */
export function fecharTemporadaDaLiga(v: Vida, pais: string, ano: number, clube: string, nivel: number, colocacao: number): -1 | 0 | 1 {
  const liga = ligaDe(v, pais);
  fixar(liga, clube, nivel, pais);
  const antes = liga.div[clube];
  if (ano > liga.ano) avancar(v, pais, liga, ano, { clube, colocacao });
  else {
    // A temporada do país já foi jogada (duas carreiras olhando o mesmo ano): só o clube da vida anda, pela mesma regra.
    const { fechada, troca } = regrasDeAcesso(pais);
    if (!fechada) {
      const n = antes;
      // REWORK 9.7 · FUT-01: o campeão registrado da divisão é o clube da vida quando ele terminou em primeiro (antes, a
      // tabela já jogada guardava outro campeão para a mesma divisão e o mesmo ano).
      if (n >= 2 && colocacao === 1 && liga.ultima?.ano === ano) liga.ultima.campeoes[n as Nivel] = clube;
      if (n === 1 ? colocacao <= 2 && troca[0] > 0 : n < 4 && colocacao <= troca[n - 1]) fixar(liga, clube, n + 1, pais);
      else if (n >= 2 && colocacao > VAGAS_POR_DIVISAO - troca[n - 2]) fixar(liga, clube, n - 1, pais);
    }
  }
  const depois = liga.div[clube];
  return depois > antes ? 1 : depois < antes ? -1 : 0;
}

/** O que a última temporada fechada do país deixou (o campeão de cada divisão, quem subiu e quem caiu). */
export const ultimaTemporadaDoPais = (v: Vida, pais: string) => v.caminhos.ligas?.[pais]?.ultima;
