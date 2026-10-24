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
/**
 * REWORK 11 · ESP-11.1: o acaso de uma temporada, em posições (o mesmo para todos os clubes e para o da vida). Era 4:
 * com o ruído maior que a diferença entre um grande e um tradicional (4,4 posições), a tabela era quase sorteio.
 */
const RUIDO_DA_TEMPORADA = 3;
/** As vagas que o catálogo não ocupa: clubes sem nome no jogo, um pouco abaixo da média da divisão (o catálogo lista os conhecidos). */
const FORCA_SEM_NOME = 0.7;

/** A força do elenco pelo porte (4 grande · 3 tradicional · 2 regional ou fora do catálogo): a mesma régua de sempre. */
export const forcaDoClube = (nome: string, pais?: string): number => {
  const c = clubePorNome(nome, pais);
  return !c ? 2 : c.porte === 'grande' ? 4 : c.porte === 'tradicional' ? 3 : 2;
};

/**
 * A força com que um clube do catálogo disputa a temporada do MUNDO (frações: um grande é melhor que a média da elite;
 * um tradicional fica entre a elite e a segunda; um regional, pouco acima das de acesso). Com os inteiros, um
 * tradicional era exatamente a média da segunda divisão e quase nunca voltava — numa liga de catálogo pequeno (a
 * Espanha), os clubes conhecidos iam se acumulando embaixo.
 * REWORK 11 · ESP-11.1: a temporada do clube DA VIDA usa esta MESMA régua (antes, `forcaDoClube` inteira e um ruído
 * próprio: o Cruzeiro da vida terminava em 11º na média enquanto o Cruzeiro do mundo brigava pelo título). Fora do
 * catálogo, `neutro` (a força média da divisão em que o clube joga), não a de um clube de acesso.
 */
export const forcaNaLiga = (nome: string, pais: string, neutro = 2): number => { const c = clubePorNome(nome, pais); return !c ? neutro : c.porte === 'grande' ? 4.5 : c.porte === 'tradicional' ? 3.4 : 2.2; };

/**
 * REWORK 11 · ESP-11.3 — quantos clubes da elite do país vão à copa continental de clubes do ano seguinte (calibração
 * do jogo, na ordem de grandeza das ligas: o Brasil manda seis à Libertadores; as grandes ligas europeias, quatro).
 */
const VAGAS_CONTINENTAIS: Record<string, number> = { BR: 6, AR: 5, ES: 4, IT: 4, GB: 4, DE: 4, FR: 3, PT: 2, MX: 4, US: 3, CO: 4, CL: 4, UY: 4, PE: 3, JP: 3, KR: 3, CN: 3 };
export const vagasContinentais = (pais: string) => VAGAS_CONTINENTAIS[pais] ?? 2;

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

/**
 * O clube da vida na temporada: ou já com a colocação jogada (`colocacao`), ou — REWORK 11 · ESP-11.1 — com a força
 * dele naquele ano (`x`, na mesma escala dos outros: a régua do mundo + a contribuição de quem joga) para disputar a
 * MESMA tabela com os outros clubes (`colocacaoNaTabela`).
 */
interface Fixo { clube: string; colocacao?: number; x?: number }

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
  const regras = regrasDeAcesso(pais);
  const nomes = Object.keys(liga.div).sort();
  const { pos, campeoes } = sortearPosicoes(v, pais, liga.div, ano, fixo, liga);
  aplicarTrocas(v, pais, liga, ano, nomes, pos, campeoes, regras, fixo);
}

/**
 * As colocações de uma temporada do país (sem mexer na tabela): a mesma régua para todos os clubes. O gerador é o do
 * país e do ano (`rngDe`), e os sorteios dos outros clubes não dependem de como o clube da vida entra — por isso a
 * colocação que `colocacaoNaTabela` lê antes é a mesma que a temporada fechada grava depois.
 */
function sortearPosicoes(v: Vida, pais: string, div: Record<string, Nivel>, ano: number, fixo?: Fixo, liga0?: LigaDoPais): { pos: Map<string, number>; campeoes: Partial<Record<Nivel, string>> } {
  const r = rngDe(v.id, 'liga', pais, ano);
  const nomes = Object.keys(div).sort();
  const pos = new Map<string, number>();
  const campeoes: Partial<Record<Nivel, string>> = {};
  for (const n of [2, 3, 4] as const) {
    const ocupadas = new Set<number>();
    if (fixo && fixo.colocacao !== undefined && div[fixo.clube] === n) { const p = clamp(Math.round(fixo.colocacao), 1, VAGAS_POR_DIVISAO); pos.set(fixo.clube, p); ocupadas.add(p); }
    const xs = nomes.filter(c => div[c] === n && c !== fixo?.clube)
      // A força do elenco diante da divisão: um grande na segunda divisão briga pelo acesso (e costuma voltar logo); um
      // tradicional que subiu briga contra a queda. (4 posições por degrau: com 3, os grandes ficavam anos embaixo.)
      .map(c => ({ c, x: 11 - (forcaNaLiga(c, pais) + formaDe(liga0, c) - n) * 4 + r.normal() * RUIDO_DA_TEMPORADA }));
    if (fixo && fixo.colocacao === undefined && fixo.x !== undefined && div[fixo.clube] === n) xs.push({ c: fixo.clube, x: fixo.x });
    // REWORK 11 · ESP-11.1: as vagas que o catálogo não ocupa são de clubes sem nome no jogo, com a força média da
    // divisão — e a tabela é a ORDEM das forças dos 20 (antes, cada clube pegava a vaga mais perto do seu número, e
    // numa divisão cheia os dois mais fracos sobravam para o 1º e o 2º lugares: o campeão era o pior time).
    const semNome = Math.max(0, VAGAS_POR_DIVISAO - xs.length - ocupadas.size);
    for (let k = 0; k < semNome; k++) xs.push({ c: '', x: 11 + FORCA_SEM_NOME * 4 + r.normal() * RUIDO_DA_TEMPORADA });
    xs.sort((a, b) => a.x - b.x);
    let p = 1;
    for (const { c } of xs) {
      while (ocupadas.has(p)) p++;
      if (p > VAGAS_POR_DIVISAO) break;
      ocupadas.add(p);
      if (c) pos.set(c, p);
    }
    // (Um catálogo maior que a divisão — não acontece com as vagas respeitadas — fica no fim da tabela.)
    for (const { c } of xs) if (c && !pos.has(c)) pos.set(c, VAGAS_POR_DIVISAO);
    const campeao = [...pos].find(([c, p]) => p === 1 && div[c] === n);
    if (campeao) campeoes[n] = campeao[0];
  }
  // A divisão 1 são os campeonatos regionais: cada clube tem a sua colocação no seu (1..12); sobe quem chega em cima.
  // (O clube da vida com força `x`: a colocação no regional dele já vem na escala 1..12 — `colocacaoNaTabela`.)
  for (const c of nomes.filter(c => div[c] === 1)) pos.set(c, c === fixo?.clube ? clamp(Math.round(fixo.colocacao ?? fixo.x ?? 6), 1, 12) : clamp(Math.round(6.5 - (forcaNaLiga(c, pais) - 1) * 2 + r.normal() * 3), 1, 12));
  return { pos, campeoes };
}

/**
 * REWORK 11.5 · ESP-01 — a forma: a força de um clube não é só o porte. Com quinze grandes para vinte vagas (Brasil), a
 * régua fixa fazia de cada temporada um sorteio entre iguais (7,6 campeões diferentes por década; nenhuma fase boa
 * durava). Agora a temporada deixa uma marca que dura alguns anos (cai 35% ao ano): quem termina em cima entra melhor
 * na seguinte, quem termina embaixo, pior. Nasce dos resultados — o mesmo para qualquer clube, nunca pelo nome. Quem
 * muda de divisão recomeça perto do zero (é outro campeonato).
 */
const formaDe = (liga: LigaDoPais | undefined, c: string) => liga?.forma?.[c] ?? 0;
/** A forma de um clube agora (a tela do técnico e os rivais do banco leem). */
export const formaNaLiga = (v: Vida, pais: string, clube: string) => v.caminhos.ligas?.[pais]?.forma?.[clube] ?? 0;
function atualizarForma(liga: LigaDoPais, antes: Record<string, Nivel>, pos: Map<string, number>): void {
  const f = (liga.forma ??= {});
  for (const [c, n] of Object.entries(antes)) {
    if (n < 2) { delete f[c]; continue; }
    const p = pos.get(c);
    if (p === undefined) continue;
    const alvo = ((VAGAS_POR_DIVISAO + 1) / 2 - p) / ((VAGAS_POR_DIVISAO - 1) / 2) * 0.5;
    const nova = liga.div[c] !== n ? (f[c] ?? 0) * 0.3 : (f[c] ?? 0) * 0.65 + alvo * 0.45;
    const x = Math.round(clamp(nova, -0.8, 0.8) * 100) / 100;
    if (x === 0) delete f[c]; else f[c] = x;
  }
}

/** As trocas de divisão de uma temporada jogada (acesso e rebaixamento pelas regras do país). */
function aplicarTrocas(_v: Vida, _pais: string, liga: LigaDoPais, ano: number, nomes: string[], pos: Map<string, number>, campeoes: Partial<Record<Nivel, string>>, regras: ReturnType<typeof regrasDeAcesso>, fixo?: Fixo): void {
  const regionais = nomes.filter(c => liga.div[c] === 1).map(c => ({ c, x: pos.get(c)! }));
  const antes = liga.div;
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
  atualizarForma(liga, antes, pos);
  // REWORK 11 · ESP-11.3: as vagas da copa continental do ano seguinte saem desta tabela (a elite, pela colocação).
  const classificados = nomes.filter(c => antes[c] === 4 && (pos.get(c) ?? 99) <= vagasContinentais(_pais));
  liga.ultima = { ano, campeoes, subiram, cairam, classificados };
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
    const u = liga.ultima;
    if (u?.ano === ano && antes === 4 && colocacao <= vagasContinentais(pais) && !(u.classificados ??= []).includes(clube)) u.classificados.push(clube);
  }
  const depois = liga.div[clube];
  return depois > antes ? 1 : depois < antes ? -1 : 0;
}

/**
 * REWORK 11 · ESP-11.1 — onde o clube da vida termina a temporada: na MESMA tabela e com a MESMA régua dos outros
 * clubes do país (`forcaNaLiga`, 4 posições por degrau, o mesmo ruído), somada a `ajuste` — a contribuição de quem
 * joga (a nota, os minutos, as lesões: `esporte.contribuicaoNaTemporada`). `ruido` é o acaso do ano do clube (o
 * gerador da vida: a tabela dos outros é do país e não muda com ele). Nada é gravado aqui: a temporada fecha depois,
 * com esta colocação (`fecharTemporadaDaLiga`), e os outros clubes ficam onde a mesma conta os pôs.
 */
export function colocacaoNaTabela(v: Vida, pais: string, ano: number, clube: string, nivel: number, ajuste: number, ruido: number): number {
  const liga = ligaDe(v, pais);
  const copia: LigaDoPais = { ano: liga.ano, div: { ...liga.div } };
  fixar(copia, clube, nivel, pais);
  const n = copia.div[clube];
  const forca = forcaNaLiga(clube, pais, n) + formaDe(liga, clube) + ajuste;
  const x = n === 1 ? 6.5 - (forca - 1) * 2 + ruido * 3 : 11 - (forca - n) * 4 + ruido * RUIDO_DA_TEMPORADA;
  return sortearPosicoes(v, pais, copia.div, ano, { clube, x }, liga).pos.get(clube) ?? clamp(Math.round(x), 1, n === 1 ? 12 : VAGAS_POR_DIVISAO);
}

/** O que a última temporada fechada do país deixou (o campeão de cada divisão, quem subiu e quem caiu). */
export const ultimaTemporadaDoPais = (v: Vida, pais: string) => v.caminhos.ligas?.[pais]?.ultima;
