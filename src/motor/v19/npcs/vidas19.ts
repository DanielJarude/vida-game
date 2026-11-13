/**
 * VIDA 19 · VIDAS PRÓPRIAS — quem importa vive mesmo quando você não está olhando.
 *
 * O que já existia e continua sendo a fonte (nada aqui o substitui):
 *   - filhos, netos e bisnetos: a trajetória inteira (`filhos.processarDescendentes`);
 *   - os pais e os avós: o trabalho, a aposentadoria, a separação, a saúde (`familia`, `corpo`);
 *   - os irmãos: a parceria e a separação (`familia.vidaDoIrmao`);
 *   - a parceria e os amigos próximos: a carreira (`social.envelhecerConhecidos` → `filhos.carreiraDeAdulto`);
 *   - o acontecimento autônomo de cada ano (`mundoVivo`), a morte e o luto (`familia`, `indiretos`, `rede`, `luto`).
 *
 * O que faltava, e mora aqui — sempre como ESTADO que muda e é lido depois (nunca só uma frase):
 *   1. O BOLSO de quem não é da casa nem da linha de sucessão (amigos, irmãos, tios, primos, ex, colegas, famosos
 *      conhecidos): renda menos o padrão de vida vira reserva ou dívida; a dívida tem juros, aperta (`Pessoa.aperto`
 *      'dinheiro' — o mesmo que abre "estar junto", o pedido de ajuda e as mensagens com motivo) e pede uma decisão
 *      conforme o jeito da pessoa: cortar, vender o carro, pegar um bico, voltar para perto da família, mudar para onde
 *      a vida custa menos. Quem guarda compra o carro, o apartamento; quem tem meta de negócio abre um — que pode dar
 *      certo ou fechar com dívida.
 *   2. A META de cada um (carreira, estabilidade, família, mudar, negócio, recomeçar, estudar, aposentar), do
 *      temperamento, da idade e do que aconteceu (a separação, o luto e a dívida pedem recomeço). Ela pesa nas escolhas.
 *   3. A UNIÃO com outra pessoa do MUNDO (com nome — antes, o amigo "casava" com `parceiroId: 'fora'`): namoro, morar
 *      junto, casar, separar, voltar; a gestação e o filho (pessoas de verdade, com pai e mãe); a viuvez já vinha de
 *      `indiretos`.
 *   4. A SAÚDE no trabalho: a condição grave sem controle afasta (a renda cai), o tratamento custa; quem melhora volta.
 *   5. OS LAÇOS ENTRE ELES: quem é do mesmo grupo (a escola, a faculdade, o trabalho de vocês) se conhece; amizades que
 *      esfriam, brigas, pazes — e a briga que nasce de ficar com o ex de alguém.
 *   6. OS FAMOSOS que você conhece trabalham: o disco, a novela, a temporada, a polêmica — e o nome sobe ou desce.
 *
 * Relevância (o custo é proporcional): `central` (próximos, irmãos, famosos conhecidos, ex que ainda pesa) e
 * `relevante` (o resto que importa, até 30). Quem não entra aqui segue a evolução simples de sempre.
 *
 * Sorteios derivados (`rngDe`): nada aqui mexe no acaso do resto da vida. As pessoas que o mundo cria (parcerias, filhos)
 * têm ids próprios (`q19…`, contador em `Vida.conectada19.seq`) e as linhas da Linha da Vida também — `Vida.seq` não
 * anda, e nenhum id do resto da vida muda por causa disto. A Linha da Vida recebe só o que é biografia de alguém
 * próximo (no máximo 3 por ano); o resto fica na trajetória da pessoa (a ficha e a rede mostram).
 */

import { clamp, rngDe, type Rng } from '../../rng';
import type { Pessoa, Vida, Vinculo, TipoTrajetoria, Entrada } from '../../tipos';
import type { Laco19, Meta19, Npc19, Posse19 } from '../../dados19/tipos';
import { escrever, idade, idadePessoa, vinculosVivos, emRecessao } from '../../nucleo';
import { criarPessoa, visualHerdado } from '../../pessoas';
import { garantirVida, empregarAdulto } from '../../sistemas/filhos';
import { importaParaCarreira } from '../../sistemas/social';
import { livreParaRomance } from '../../sistemas/estadoConjugal';
import { cidadesDoPais, economiaLocal, municipio, paisDaCidade } from '../../dados/lugares';
import { OCUPACOES, ocupacao, ocupacaoOuNula } from '../../dados/ocupacoes';
import { liquido, salarioLocal } from '../../sistemas/renda';
import { modeloCondicao } from '../../sistemas/corpo';
import { flex } from '../../texto';
import { anoDe, mesDe } from '../../tempo';
import { ancestralidadeDe, misturar } from '../../sistemas/identidade';

/* ================================================================== Quem entra */

export type Nivel19 = 'central' | 'relevante';

const FORA_DA_CASA = new Set(['mae', 'pai', 'madrasta', 'padrasto', 'filho', 'enteado', 'neto', 'bisneto', 'avo']);
const ROMANCE_ATIVO = new Set(['saindo', 'namoro', 'morando_junto', 'casamento']);
const PARENTES = new Set(['irmao', 'meio_irmao', 'tio', 'primo']);
const MAX_RELEVANTES = 30;

/**
 * Quem tem vida própria acompanhada aqui: adultos (16+) que não moram com você, não são seus pais, avós nem
 * descendentes, e não estão num romance com você. `central` primeiro; `relevante` até 30, os mais próximos antes.
 */
export function relevantes19(v: Vida): { p: Pessoa; vin: Vinculo; nivel: Nivel19 }[] {
  const out: { p: Pessoa; vin: Vinculo; nivel: Nivel19 }[] = [];
  const outros: { p: Pessoa; vin: Vinculo }[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie || !p.nome || !p.vivo) continue;
    if (idadePessoa(v, p) < 16) continue;
    if (vin.convivio.includes('casa')) continue;
    if (vin.parentesco && FORA_DA_CASA.has(vin.parentesco)) continue;
    if (vin.romance && ROMANCE_ATIVO.has(vin.romance.estagio)) continue;
    const exQuePesa = vin.romance?.estagio === 'ex' && vin.proximidade >= 40;
    if (vin.proximidade >= 60 || vin.parentesco === 'irmao' || vin.parentesco === 'meio_irmao' || !!p.celebridade15 || exQuePesa) out.push({ p, vin, nivel: 'central' });
    else if (vin.proximidade >= 25 || (vin.parentesco && PARENTES.has(vin.parentesco)) || vin.estagio === 'rival' || vin.romance?.estagio === 'ex') outros.push({ p, vin });
  }
  outros.sort((a, b) => b.vin.proximidade - a.vin.proximidade || (a.p.id < b.p.id ? -1 : 1));
  for (const x of outros.slice(0, MAX_RELEVANTES)) out.push({ ...x, nivel: 'relevante' });
  return out;
}

/* ================================================================== A ficha da vida própria */

const hash = (s: string) => { let h = 2166136261; for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };

/** O mínimo para viver sozinho no lugar (moeda do lugar). */
export function piso19(municipioId: string): number { return Math.round(1450 * economiaLocal(municipioId).salario / 10) * 10; }

/** A meta que a vida pede agora (o temperamento puxa; a idade e o que aconteceu mandam). */
export function metaDe19(v: Vida, p: Pessoa, n: Npc19 | undefined): Meta19 {
  const i = idadePessoa(v, p);
  const t = p.temperamento;
  const ap = p.aperto;
  if (i >= 60) return 'aposentar';
  if (ap && !ap.resolvido && v.t - ap.t <= 24 && (ap.tipo === 'separacao' || ap.tipo === 'luto' || ap.tipo === 'dinheiro')) return 'recomecar';
  if ((n?.divida ?? 0) > 0 && n!.divida > 3 * n!.gasto) return 'recomecar';
  if (i < 24 && p.ocupacao === 'estudante') return 'estudar';
  const h = hash(p.id + 'meta19');
  const pesos: [Meta19, number][] = [
    ['carreira', 1 + Math.max(0, t.responsabilidade) * 1.5 + Math.max(0, t.abertura) * 0.5],
    ['estabilidade', 1 + Math.max(0, -t.abertura) * 1.5 + Math.max(0, t.responsabilidade) * 0.5],
    ['familia', (i >= 24 && i <= 42 ? 1.4 : 0.5) + Math.max(0, t.afabilidade) * 1.2 + (p.querFilhos === 'sim' ? 0.8 : p.querFilhos === 'nao' ? -0.4 : 0)],
    ['mudar', (i <= 40 ? 0.6 : 0.15) + Math.max(0, t.abertura) * 1.4],
    ['negocio', (i >= 26 && i <= 55 ? 0.5 : 0.1) + Math.max(0, t.abertura) * 0.7 + Math.max(0, t.extroversao) * 0.5],
    ['estudar', i < 35 && (p.vida?.escolaridade ?? 'medio') !== 'superior' ? 0.4 + Math.max(0, t.abertura) * 0.5 : 0.05]
  ];
  const tot = pesos.reduce((s, x) => s + Math.max(0.05, x[1]), 0);
  let u = h * tot;
  for (const [m, w] of pesos) { u -= Math.max(0.05, w); if (u <= 0) return m; }
  return 'estabilidade';
}

/** A exposição na rede (0 reservada … 3 conta tudo): do temperamento, estável. */
export function exposicaoDe19(p: Pessoa): 0 | 1 | 2 | 3 {
  const x = p.temperamento.extroversao * 0.6 + p.temperamento.abertura * 0.3 + (hash(p.id + 'expo19') - 0.5) * 0.5;
  return x < -0.35 ? 0 : x < 0.05 ? 1 : x < 0.45 ? 2 : 3;
}

/** A ficha da vida própria: na primeira leitura, do que a pessoa já tem (renda, idade) — sem inventar passado. */
export function garantirNpc19(v: Vida, p: Pessoa): Npc19 {
  if (p.npc19) return p.npc19;
  const i = idadePessoa(v, p);
  const piso = piso19(p.municipioId);
  const gasto = Math.max(piso, Math.round(p.renda * 0.88 / 10) * 10);
  // A reserva inicial é a que a trajetória registrada permite estimar (a mesma conta de `economiasNpc`), ou nada.
  const meses = Math.min(p.vida?.experiencia ?? Math.max(0, (i - 20) * 12), Math.max(0, (i - 18) * 12));
  const reserva = p.renda > 0 ? Math.round(Math.max(0, p.renda - gasto) * meses * 0.5 / 100) * 100 : 0;
  const n: Npc19 = { meta: 'estabilidade', tMeta: v.t, gasto, reserva, divida: 0, exposicao: exposicaoDe19(p) };
  n.meta = metaDe19(v, p, n);
  p.npc19 = n;
  return n;
}

/* ================================================================== Pessoas que o mundo cria */

function conectada(v: Vida) { return (v.conectada19 ??= { reacoes: {} }); }

/** Cria uma pessoa do mundo sem mexer em `Vida.seq` (id próprio `q19…`). */
export function criarPessoa19(v: Vida, r: Rng, n: Parameters<typeof criarPessoa>[2]): Pessoa {
  const s = v.seq;
  const p = criarPessoa(v, r, n);
  v.seq = s;
  delete v.pessoas[p.id];
  const c = conectada(v);
  c.seq = (c.seq ?? 0) + 1;
  p.id = `q19${c.seq.toString(36)}`;
  v.pessoas[p.id] = p;
  return p;
}

/** Uma linha na Linha da Vida sem mexer em `Vida.seq` (id próprio). */
function escrever19(v: Vida, e: Parameters<typeof escrever>[1]): Entrada {
  const s = v.seq;
  const x = escrever(v, e);
  v.seq = s;
  const c = conectada(v);
  c.seq = (c.seq ?? 0) + 1;
  x.id = `e19${c.seq.toString(36)}`;
  return x;
}

/* ================================================================== O ano */

interface Cota19 { bio: number; linhas: number }
const MAX_LINHAS = 3;

/** Na trajetória da pessoa (a ficha, a rede); e, se for de alguém próximo e importante, na Linha da Vida. */
function viver(v: Vida, p: Pessoa, cota: Cota19, o: { texto: string; tipo: TipoTrajetoria; noticia?: string; peso?: 'grande' | 'pequeno'; tom?: Entrada['tom'] }): void {
  const vida = garantirVida(p);
  vida.trajetoria.push({ t: v.t, texto: o.texto, tipo: o.tipo });
  if (vida.trajetoria.length > 24) vida.trajetoria.splice(0, vida.trajetoria.length - 24);
  const vin = v.vinculos[p.id];
  if (!vin || !o.noticia || cota.linhas >= MAX_LINHAS) return;
  if (vin.proximidade < 45 && !(o.peso === 'grande' && vin.proximidade >= 30)) return;
  const grande = o.peso === 'grande' && vin.proximidade >= 55 && cota.bio < 2;
  if (grande) cota.bio++;
  cota.linhas++;
  escrever19(v, { texto: o.noticia, relevancia: grande ? 'biografia' : 'cotidiano', tema: vin.parentesco ? 'familia' : 'amizade', tom: o.tom, pessoas: [p.id], fato: { tipo: 'mundo', dados: { categoria: vin.parentesco ? 'familia' : 'pessoas', fonte: 'vida19' } } });
}

const marcou = (n: Npc19, k: string, v: Vida, anos: number) => n.marcas?.[k] !== undefined && v.t - n.marcas[k] < anos * 12;
function marcar(n: Npc19, k: string, v: Vida): void {
  const m = (n.marcas ??= {});
  m[k] = v.t;
  const ks = Object.keys(m);
  if (ks.length > 12) { ks.sort((a, b) => m[a] - m[b]); for (const x of ks.slice(0, ks.length - 12)) delete m[x]; }
}

export function processarVidas19(v: Vida): void {
  if (v.morte) return;
  const gente = relevantes19(v);
  const cota: Cota19 = { bio: 0, linhas: 0 };
  for (const { p, vin, nivel } of gente) {
    const r = rngDe(v.id, 'npc19', p.id, v.t);
    const n = garantirNpc19(v, p);
    anoDaPessoa(v, r, p, vin, n, nivel, cota);
  }
  lacosDoAno(v, gente.map(x => x.p), cota);
  limparMundo19(v);
}

function anoDaPessoa(v: Vida, r: Rng, p: Pessoa, vin: Vinculo, n: Npc19, nivel: Nivel19, cota: Cota19): void {
  const i = idadePessoa(v, p);
  // A meta muda com a vida (a cada três anos, ou logo depois de um golpe).
  const nova = metaDe19(v, p, n);
  if (nova !== n.meta && (v.t - n.tMeta >= 36 || nova === 'recomecar' || nova === 'aposentar')) { n.meta = nova; n.tMeta = v.t; }
  saudeNoTrabalho(v, r, p, n, cota);
  if (!importaParaCarreira(vin) || vin.parentesco) carreira(v, r, p, vin, n, cota);
  if (p.celebridade15) anoDoFamoso(v, r, p, n, cota);
  negocio(v, r, p, n, cota);
  bolso(v, r, p, n, cota);
  if (i >= 18) uniao(v, r, p, vin, n, nivel, cota);
  nascimentos(v, r, p, n, cota);
  mudanca(v, r, p, vin, n, cota);
}

/* ------------------------------------------------------------------ O bolso */

function filhosPequenos(v: Vida, p: Pessoa): number {
  let k = 0, todos = 0;
  for (const x of Object.values(v.pessoas)) if (!x.especie && x.genitores?.includes(p.id)) { todos++; if (x.vivo && idadePessoa(v, x) < 18) k++; }
  // Filhos que só eram contados (`nFilhos`, antes da VIDA 19), de quem ainda está na idade de tê-los pequenos.
  if (!todos && (p.nFilhos ?? 0) > 0 && idadePessoa(v, p) < 48) k = Math.min(2, p.nFilhos!);
  return k;
}

/** O padrão de vida que a renda, os filhos e o jeito pedem (por mês). */
export function alvoDeGasto19(v: Vida, p: Pessoa, n: Npc19): number {
  const piso = piso19(p.municipioId);
  const t = p.temperamento;
  const prop = clamp(0.86 - t.responsabilidade * 0.1 + (t.extroversao > 0.4 ? 0.03 : 0), 0.7, 0.97);
  const filhos = filhosPequenos(v, p);
  const casal = n.uniao && n.uniao.tipo !== 'namoro' ? 0.8 : 1;
  const parcela = (n.posses ?? []).reduce((s, x) => s + (x.financiado ? x.valor * 0.7 / 300 : 0), 0);
  const desejado = Math.max(piso * (1 + filhos * 0.35) * casal, p.renda * prop + filhos * piso * 0.15);
  // Quem ganha pouco vive com o que ganha (o aperto de todo mês não vira dívida sem fim): o teto é a renda, um pouco acima
  // com filhos pequenos. Sem renda, o mínimo do lugar.
  const teto = p.renda > 0 ? p.renda * (filhos ? 1.04 : 0.99) : desejado;
  return Math.round((Math.min(desejado, teto) + parcela) / 10) * 10;
}

function bolso(v: Vida, r: Rng, p: Pessoa, n: Npc19, cota: Cota19): void {
  const alvo = alvoDeGasto19(v, p, n);
  // O padrão anda devagar atrás do que a renda permite; sem renda, a casa corta mais depressa.
  n.gasto = Math.round((n.gasto + (alvo - n.gasto) * (p.renda <= 0 ? 0.5 : 0.3)) / 10) * 10;
  const tratamento = (p.condicoes ?? []).filter(c => c.diagnosticada && c.tratando && c.gravidade >= 2).length * 150;
  // Quem não tem renda própria e vive com alguém que sustenta a casa (o estudante, a parceria que cuida da casa, o mais
  // velho que mora com os filhos) não se endivida sozinho: o padrão de vida é o da casa. Quem perdeu o emprego, sim —
  // vivendo com o mínimo.
  const desempregado = p.renda <= 0 && /desempregad/.test(p.ocupacao ?? '');
  const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
  const sustentado = p.renda <= 0 && !desempregado && !n.negocio;
  if (sustentado) { n.gasto = 0; return; }
  if (desempregado) n.gasto = Math.round(Math.min(n.gasto, piso19(p.municipioId) * (par?.vivo && par.renda > 0 ? 0.4 : 0.8)) / 10) * 10;
  let saldo = (p.renda - n.gasto - tratamento) * 12;
  // A dívida tem juros (o crédito pessoal e o cartão parcelado de quem está apertado).
  if (n.divida > 0) n.divida = Math.round(n.divida * 1.18);
  if (saldo >= 0) {
    const paga = Math.min(n.divida, saldo);
    n.divida -= paga; saldo -= paga;
    n.reserva += saldo;
  } else {
    const usa = Math.min(n.reserva, -saldo);
    n.reserva -= usa; saldo += usa;
    n.divida += -saldo;
  }
  // Financiamentos: o que foi pago no ano sai do saldo devedor (a parcela já está no padrão de vida).
  for (const x of n.posses ?? []) if (x.financiado) { x.financiado = Math.max(0, x.financiado - Math.round(x.valor * 0.7 / 25)); if (!x.financiado) delete x.financiado; }
  n.reserva = Math.round(n.reserva / 10) * 10;
  n.divida = Math.round(n.divida / 10) * 10;
  const mensal = Math.max(n.gasto, piso19(p.municipioId));
  // Apertou: a dívida passou de quatro meses de vida.
  if (n.divida > 4 * mensal) {
    if (!p.aperto || p.aperto.resolvido || v.t - p.aperto.t > 24) p.aperto = { tipo: 'dinheiro', t: v.t };
    if (!marcou(n, 'aperto', v, 2)) { marcar(n, 'aperto', v); decidirNoAperto(v, r, p, n, cota); }
  } else if (n.divida === 0 && p.aperto?.tipo === 'dinheiro' && !p.aperto.resolvido) {
    p.aperto.resolvido = v.t;
    viver(v, p, cota, { texto: 'Quitou as dívidas.', tipo: 'casa', noticia: `${p.nome} contou que quitou as dívidas. Respirou.`, tom: 'bom' });
  }
  // Sobrou: o que a pessoa faz com o que guardou depende da meta e do jeito.
  if (n.divida === 0) comprar(v, r, p, n, mensal, cota);
}

function decidirNoAperto(v: Vida, r: Rng, p: Pessoa, n: Npc19, cota: Cota19): void {
  const t = p.temperamento;
  const carro = (n.posses ?? []).find(x => x.tipo === 'carro' || x.tipo === 'moto');
  const i = idadePessoa(v, p);
  const opcoes: [string, number][] = [
    ['cortar', 1 + Math.max(0, t.responsabilidade) * 2],
    ['vender', carro ? 1.2 + Math.max(0, t.estabilidade) : 0],
    ['bico', p.renda > 0 && i < 60 ? 0.8 + Math.max(0, t.extroversao) : 0],
    ['familia', i < 40 && v.vinculos[p.id]?.parentesco && PARENTES.has(v.vinculos[p.id].parentesco!) ? 0.6 + Math.max(0, t.afabilidade) : 0],
    ['barata', 0.4 + Math.max(0, t.abertura) * 0.6]
  ];
  const escolha = r.weighted(opcoes.filter(x => x[1] > 0), x => x[1])![0];
  const mensal = Math.max(n.gasto, piso19(p.municipioId));
  if (escolha === 'cortar') {
    n.gasto = Math.round(n.gasto * 0.82 / 10) * 10;
    viver(v, p, cota, { texto: 'Cortou gastos: as contas apertaram.', tipo: 'casa' });
  } else if (escolha === 'vender' && carro) {
    const recebe = Math.round(carro.valor * 0.8 / 100) * 100 - (carro.financiado ?? 0);
    n.posses = (n.posses ?? []).filter(x => x !== carro);
    const usa = Math.min(n.divida, Math.max(0, recebe));
    n.divida -= usa; n.reserva += Math.max(0, recebe) - usa;
    viver(v, p, cota, { texto: `Vendeu ${carro.tipo === 'moto' ? 'a moto' : 'o carro'} para pagar as dívidas.`, tipo: 'casa', noticia: `${p.nome} vendeu ${carro.tipo === 'moto' ? 'a moto' : 'o carro'} para fechar as contas.`, tom: 'ruim' });
  } else if (escolha === 'bico') {
    p.renda = Math.round(p.renda * 1.18 / 10) * 10;
    viver(v, p, cota, { texto: 'Pegou um trabalho extra para pagar as contas.', tipo: 'trabalho' });
  } else if (escolha === 'familia') {
    const pais = Object.values(v.pessoas).filter(x => x.vivo && v.vinculos[x.id] && ['mae', 'pai'].includes(v.vinculos[x.id].parentesco ?? ''));
    const destino = pais.find(x => x.municipioId !== p.municipioId)?.municipioId;
    if (destino) {
      p.municipioId = destino;
      n.gasto = Math.round(Math.max(piso19(destino) * 0.6, n.gasto * 0.6) / 10) * 10;
      viver(v, p, cota, { texto: `Voltou a morar perto dos pais, em ${municipio(destino).nome}, para se reerguer.`, tipo: 'lugar', noticia: `${p.nome} voltou para ${municipio(destino).nome}, perto dos pais: a dívida apertou.`, tom: 'ruim' });
    } else {
      n.gasto = Math.round(n.gasto * 0.85 / 10) * 10;
      viver(v, p, cota, { texto: 'Dividiu a casa com a família para economizar.', tipo: 'casa' });
    }
  } else {
    const pais = paisDaCidade(p.municipioId);
    const uf = municipio(p.municipioId).uf;
    const custoAqui = economiaLocal(p.municipioId).custo;
    const baratas = cidadesDoPais(pais).filter(m => m.id !== p.municipioId && m.uf === uf && economiaLocal(m.id).custo < custoAqui * 0.9);
    if (baratas.length) {
      const d = baratas[Math.floor(r.next() * baratas.length)];
      p.municipioId = d.id;
      viver(v, p, cota, { texto: `Mudou-se para ${d.nome}, onde a vida custa menos.`, tipo: 'lugar', noticia: `${p.nome} se mudou para ${d.nome}: a cidade grande ficou cara demais.`, tom: 'neutro' });
    } else {
      n.gasto = Math.round(n.gasto * 0.85 / 10) * 10;
      viver(v, p, cota, { texto: 'Trocou de casa por uma menor.', tipo: 'casa' });
    }
  }
  void mensal;
}

/** O preço de referência das coisas, pelo lugar (a moradia pelo aluguel; o carro pelo nível de salários). */
function precoDe(tipo: Posse19['tipo'], municipioId: string): number {
  const e = economiaLocal(municipioId);
  if (tipo === 'apartamento' || tipo === 'casa') return Math.round(e.aluguel * 175 / 1000) * 1000;
  if (tipo === 'carro') return Math.round(72000 * e.salario / 1000) * 1000;
  return Math.round(17000 * e.salario / 100) * 100;
}

function comprar(v: Vida, r: Rng, p: Pessoa, n: Npc19, mensal: number, cota: Cota19): void {
  const i = idadePessoa(v, p);
  const tem = (t: Posse19['tipo']) => (n.posses ?? []).some(x => x.tipo === t);
  const prudente = p.temperamento.responsabilidade > 0;
  // O primeiro carro (ou a moto): quem tem renda e guardou meio ano de vida.
  if (i >= 20 && p.renda > piso19(p.municipioId) * 1.4 && !tem('carro') && !tem('moto') && n.reserva > 6 * mensal && r.chance(0.35)) {
    const tipo: Posse19['tipo'] = p.renda < piso19(p.municipioId) * 2.2 ? 'moto' : 'carro';
    const valor = precoDe(tipo, p.municipioId);
    const aVista = n.reserva > valor * (prudente ? 1.5 : 1.15);
    const entrada = aVista ? valor : Math.round(valor * 0.4);
    if (n.reserva < entrada) return;
    n.reserva -= entrada;
    (n.posses ??= []).push({ tipo, nome: tipo === 'carro' ? 'um carro' : 'uma moto', valor, t: v.t, ...(aVista ? {} : { financiado: valor - entrada }) });
    viver(v, p, cota, { texto: tipo === 'carro' ? (aVista ? 'Comprou um carro à vista.' : 'Comprou um carro financiado.') : 'Comprou uma moto.', tipo: 'casa' });
    return;
  }
  // A casa própria: quem quer estabilidade ou família e juntou a entrada.
  if (i >= 26 && !tem('apartamento') && !tem('casa') && (n.meta === 'estabilidade' || n.meta === 'familia' || n.uniao?.tipo === 'casados')) {
    const tipo: Posse19['tipo'] = municipio(p.municipioId).perfil === 'metropole' || municipio(p.municipioId).perfil === 'capital' ? 'apartamento' : 'casa';
    const valor = precoDe(tipo, p.municipioId);
    const entrada = Math.round(valor * 0.3);
    if (n.reserva < entrada + 3 * mensal || !r.chance(0.3)) return;
    n.reserva -= entrada;
    (n.posses ??= []).push({ tipo, nome: tipo === 'apartamento' ? 'um apartamento' : 'uma casa', valor, t: v.t, financiado: valor - entrada });
    viver(v, p, cota, { texto: `Comprou ${tipo === 'apartamento' ? 'um apartamento' : 'uma casa'} em ${municipio(p.municipioId).nome} (financiado).`, tipo: 'casa', noticia: `${p.nome} comprou ${tipo === 'apartamento' ? 'um apartamento' : 'uma casa'}. Chamou todo mundo para conhecer.`, tom: 'bom' });
  }
}

/* ------------------------------------------------------------------ O negócio */

const RAMOS = ['uma lanchonete', 'uma oficina', 'um salão', 'uma loja de roupas', 'uma padaria', 'um estúdio de tatuagem', 'uma pequena empresa de software', 'uma academia de bairro', 'uma cafeteria', 'um pet shop'];

function negocio(v: Vida, r: Rng, p: Pessoa, n: Npc19, cota: Cota19): void {
  const i = idadePessoa(v, p);
  // Quem já tinha aberto um negócio pelo `mundoVivo` (só o cargo): o negócio passa a ter ano bom e ruim.
  if (!n.negocio && p.ocupacaoId === 'dono_comercio') {
    const ramo = /don[oa] de (.+)$/.exec(p.ocupacao ?? '')?.[1] ?? 'um pequeno negócio';
    n.negocio = { ramo, t: v.t, investido: 0, saude: 50 };
  }
  if (!n.negocio) {
    const mensal = Math.max(n.gasto, piso19(p.municipioId));
    if (n.meta !== 'negocio' || i < 25 || i > 58 || n.divida > 0 || n.reserva < 12 * mensal || p.ocupacao === 'estudante' || !r.chance(0.18)) return;
    const ramo = r.pick(RAMOS);
    const investido = Math.round(n.reserva * 0.7 / 100) * 100;
    n.reserva -= investido;
    n.negocio = { ramo, t: v.t, investido, saude: 45 + Math.round(p.temperamento.responsabilidade * 15) };
    p.ocupacao = flex(p.genero, `dono de ${ramo}`, `dona de ${ramo}`, `dona de ${ramo}`);
    p.ocupacaoId = 'dono_comercio';
    p.renda = Math.round(liquido(salarioLocal(ocupacao('dono_comercio'), p.municipioId, 0.6), 'autonomo', paisDaCidade(p.municipioId)) / 10) * 10;
    n.afastado = undefined;
    viver(v, p, cota, { texto: `Largou o emprego e abriu ${ramo} com o que tinha guardado.`, tipo: 'trabalho', noticia: `${p.nome} abriu ${ramo} com as economias de anos${p.municipioId === v.moradia.municipioId ? ' — você foi à inauguração' : ''}.`, peso: 'grande', tom: 'bom' });
    return;
  }
  const g = n.negocio;
  if (v.t - g.t < 12) return;
  // O ano do negócio: o jeito de quem toca, a economia da cidade e o acaso.
  const t = p.temperamento;
  g.saude = clamp(Math.round(g.saude + r.normal() * 14 + t.responsabilidade * 5 + t.extroversao * 2 - (emRecessao(v) ? 9 : 0) + (g.saude > 70 ? -3 : 2)));
  const base = liquido(salarioLocal(ocupacao('dono_comercio'), p.municipioId, 1), 'autonomo', paisDaCidade(p.municipioId));
  p.renda = Math.round(base * (0.35 + g.saude / 85) / 10) * 10;
  if (g.saude >= 82 && !marcou(n, 'negocio_bom', v, 4)) {
    marcar(n, 'negocio_bom', v);
    viver(v, p, cota, { texto: `${g.ramo.replace(/^uma? /, (x) => x.trim() === 'uma' ? 'A ' : 'O ')} deu certo: abriu uma segunda unidade.`, tipo: 'promocao', noticia: `O negócio de ${p.nome} deu certo: já tem uma segunda unidade.`, tom: 'bom' });
    g.saude -= 10;
  }
  if (g.saude <= 12) {
    // Fechou: o que sobrou de dívida do negócio vai para a pessoa; volta a procurar emprego.
    n.divida += Math.round(Math.max(g.investido * 0.25, 4 * piso19(p.municipioId)) / 100) * 100;
    viver(v, p, cota, { texto: `Fechou ${g.ramo}. Saiu com dívidas.`, tipo: 'desemprego', noticia: `${p.nome} fechou ${g.ramo}. Foram anos de trabalho, e as dívidas ficaram.`, peso: 'grande', tom: 'ruim' });
    n.negocio = undefined;
    p.renda = 0;
    p.ocupacaoId = undefined;
    p.ocupacao = flex(p.genero, 'desempregado', 'desempregada', 'desempregade');
    p.aperto = { tipo: 'desemprego', t: v.t };
    n.meta = 'recomecar'; n.tMeta = v.t;
  }
}

/* ------------------------------------------------------------------ O trabalho (quem nenhum outro sistema acompanha) */

function carreira(v: Vida, r: Rng, p: Pessoa, vin: Vinculo, n: Npc19, cota: Cota19): void {
  const i = idadePessoa(v, p);
  if (i < 18 || i >= 65 || p.ocupacao?.startsWith('aposentad') || n.negocio || n.afastado || p.celebridade15) return;
  const parente = !!vin.parentesco;
  // Os parentes (irmãos, tios, primos) só tinham o primeiro emprego e a aposentadoria: o emprego também acaba e volta.
  if (parente && p.renda > 0 && r.chance(0.04 * (emRecessao(v) ? 2 : 1))) {
    p.renda = 0;
    p.aperto = { tipo: 'desemprego', t: v.t };
    const antes = p.ocupacao;
    p.ocupacao = flex(p.genero, 'desempregado', 'desempregada', 'desempregade'); p.ocupacaoId = undefined;
    viver(v, p, cota, { texto: `Perdeu o emprego${antes ? ` de ${antes}` : ''}.`, tipo: 'desemprego', noticia: `${p.nome} perdeu o emprego${antes ? ` de ${antes}` : ''}.`, tom: 'ruim' });
    return;
  }
  if (parente && p.renda === 0 && p.ocupacao !== 'estudante' && r.chance(0.5)) {
    if (empregarAdulto(v, p, i)) {
      if (p.aperto?.tipo === 'desemprego') p.aperto.resolvido ??= v.t;
      viver(v, p, cota, { texto: `Arrumou trabalho como ${p.ocupacao}.`, tipo: 'trabalho' });
    }
    return;
  }
  // Quem quer crescer: o degrau de cima da mesma trilha (cargo e salário juntos), ou a troca de empresa.
  if (n.meta !== 'carreira' || p.renda <= 0 || marcou(n, 'subiu', v, 3)) return;
  const amb = 0.06 + Math.max(0, p.temperamento.responsabilidade) * 0.08 + Math.max(0, p.temperamento.abertura) * 0.04;
  if (!r.chance(amb)) return;
  const oc = p.ocupacaoId ? ocupacaoOuNula(p.ocupacaoId) : undefined;
  const esc = p.vida?.escolaridade ?? 'medio';
  const acima = oc ? OCUPACOES.filter(o => o.trilha === oc.trilha && o.nivel === oc.nivel + 1 && o.idadeMin <= i && !o.concurso && o.contrato !== 'eletivo' && o.contrato !== 'militar' && (!o.escolaridade || esc === 'superior' || (o.escolaridade !== 'superior'))) : [];
  marcar(n, 'subiu', v);
  if (acima.length) {
    const nova = acima[Math.floor(r.next() * acima.length)];
    p.ocupacaoId = nova.id;
    p.ocupacao = p.genero === 'feminino' ? nova.nome[1] : nova.nome[0];
    p.renda = Math.max(p.renda, liquido(salarioLocal(nova, p.municipioId), nova.contrato, paisDaCidade(p.municipioId)));
    garantirVida(p).tCargo = v.t;
    viver(v, p, cota, { texto: `Foi promovid${flex(p.genero, 'o', 'a', 'e')}: agora é ${p.ocupacao}.`, tipo: 'promocao', noticia: `${p.nome} foi promovid${flex(p.genero, 'o', 'a', 'e')} a ${p.ocupacao}.`, tom: 'bom' });
  } else {
    p.renda = Math.round(p.renda * (1.12 + r.next() * 0.15) / 10) * 10;
    viver(v, p, cota, { texto: 'Trocou de empresa por um salário melhor.', tipo: 'trabalho' });
  }
}

/* ------------------------------------------------------------------ A saúde no trabalho */

function saudeNoTrabalho(v: Vida, r: Rng, p: Pessoa, n: Npc19, cota: Cota19): void {
  if (n.afastado) {
    if (p.saude >= 55 && v.t - n.afastado.t >= 12) {
      p.renda = Math.max(p.renda, n.afastado.renda);
      n.afastado = undefined;
      viver(v, p, cota, { texto: 'Voltou ao trabalho depois do tratamento.', tipo: 'trabalho', noticia: `${p.nome} voltou ao trabalho, recuperad${flex(p.genero, 'o', 'a', 'e')}.`, tom: 'bom' });
    }
    return;
  }
  if (p.renda <= 0 || idadePessoa(v, p) >= 65) return;
  const grave = (p.condicoes ?? []).find(c => c.diagnosticada && c.gravidade >= 2 && !c.tratando);
  if (!(grave || p.saude < 30) || !r.chance(0.35)) return;
  n.afastado = { t: v.t, renda: p.renda };
  // O afastamento pela saúde paga menos que o salário (o benefício tem teto): a casa sente.
  p.renda = Math.round(p.renda * 0.7 / 10) * 10;
  const nome = grave ? modeloCondicao(grave.id)?.nome : undefined;
  if (!p.aperto || p.aperto.resolvido) p.aperto = { tipo: 'doenca', t: v.t };
  viver(v, p, cota, { texto: `Afastou-se do trabalho para cuidar da saúde${nome ? ` (${nome})` : ''}.`, tipo: 'saude', noticia: `${p.nome} se afastou do trabalho para tratar a saúde.`, tom: 'ruim' });
}

/* ------------------------------------------------------------------ Os famosos que você conhece */

const OBRAS: Record<string, [string, string[]][]> = {
  musica: [['Lançou o single', ['"Madrugada"', '"Volta Pra Cá"', '"Rua Sem Saída"', '"Céu de Agosto"', '"Mil Vezes"']], ['Lançou o álbum', ['"Casa Aberta"', '"Ventania"', '"Estrada Velha"', '"Ao Vivo no Centro"']], ['Saiu em turnê', ['pelo país', 'pela América do Sul', 'pelos festivais de verão']]],
  tv: [['Estreou na novela', ['"Laços de Sal"', '"Terra Prometida"', '"O Avesso"']], ['Ganhou um programa', ['nas noites de sábado', 'nas manhãs de domingo']]],
  cinema: [['Estreou o filme', ['"Últimos Dias de Verão"', '"A Ponte"', '"Cidade Baixa"']], ['Começou a filmar', ['um longa no Nordeste', 'uma série de streaming']]],
  esporte: [['Fechou a temporada', ['entre os melhores', 'com título', 'machucado na reta final']], ['Assinou com', ['um clube grande', 'um time do exterior']]],
  internet: [['Lançou uma série de vídeos', ['sobre viagens', 'de humor', 'sobre cozinha']], ['Bateu um recorde de visualizações', ['com um vídeo de bastidores']]],
  moda: [['Estrelou a campanha', ['de uma grife internacional', 'de verão de uma marca nacional']], ['Desfilou', ['na semana de moda de São Paulo', 'em Paris']]],
  negocios: [['Abriu', ['uma nova rede de lojas', 'um restaurante disputado']], ['Vendeu', ['parte da empresa a um fundo']]]
};

function anoDoFamoso(v: Vida, r: Rng, p: Pessoa, n: Npc19, cota: Cota19): void {
  const c = p.celebridade15!;
  const lista = OBRAS[c.area] ?? OBRAS.internet;
  const [verbo, objs] = lista[Math.floor(r.next() * lista.length)];
  const obra = objs[Math.floor(r.next() * objs.length)];
  const sucesso = r.next() + (c.nivel - 2) * 0.08;
  const texto = `${verbo} ${obra}.`;
  if (r.chance(0.06) && !marcou(n, 'polemica', v, 4)) {
    marcar(n, 'polemica', v);
    viver(v, p, cota, { texto: 'Virou alvo de uma polêmica: uma fala antiga voltou a circular.', tipo: 'trabalho', noticia: `${p.nome} está no meio de uma polêmica: uma fala antiga voltou a circular.`, tom: 'ruim' });
    if (c.nivel > 1 && r.chance(0.4)) c.nivel = (c.nivel - 1) as 1 | 2;
    return;
  }
  viver(v, p, cota, { texto, tipo: sucesso > 0.75 ? 'promocao' : 'trabalho' });
  if (sucesso > 0.92 && c.nivel < 3 && !marcou(n, 'subiu_fama', v, 5)) {
    marcar(n, 'subiu_fama', v);
    c.nivel = (c.nivel + 1) as 2 | 3;
    p.renda = Math.round(p.renda * 1.4 / 10) * 10;
    viver(v, p, cota, { texto: 'Virou um dos nomes mais falados do ano.', tipo: 'promocao', noticia: `${p.nome} virou um dos nomes do ano.`, tom: 'bom' });
  }
}

/* ------------------------------------------------------------------ A união (com gente do mundo) */

/** A parceria de alguém que só existia como 'fora' ganha nome (o casamento já tinha acontecido: só falta a pessoa). */
function materializarParceria(v: Vida, r: Rng, p: Pessoa, n: Npc19): Pessoa | undefined {
  const i = idadePessoa(v, p);
  const g = generoDoPar(p, r);
  const q = criarPessoa19(v, r, { genero: g, idade: clamp(i + r.int(-4, 4), 18, 90), municipioId: p.municipioId });
  q.parceiroId = p.id;
  p.parceiroId = q.id;
  const desde = v.fatos[`mv_casou_${p.id}`] ?? v.t;
  n.uniao = { com: q.id, tipo: 'casados', t: desde };
  return q;
}

function generoDoPar(p: Pessoa, r: Rng): Pessoa['genero'] {
  const a = p.atracao ?? (p.genero === 'masculino' ? 'mulheres' : 'homens');
  return a === 'mulheres' ? 'feminino' : a === 'homens' ? 'masculino' : r.chance(0.5) ? 'masculino' : 'feminino';
}

function compat(a: Pessoa, b: Pessoa): number {
  const t = a.temperamento, u = b.temperamento;
  return 1 - (Math.abs(t.estabilidade - u.estabilidade) + Math.abs(t.afabilidade - u.afabilidade) + Math.abs(t.abertura - u.abertura)) / 3;
}

function uniao(v: Vida, r: Rng, p: Pessoa, vin: Vinculo, n: Npc19, nivel: Nivel19, cota: Cota19): void {
  // Os irmãos já têm a vida amorosa deles em `familia` (com parceria de verdade): não duplicar.
  if (vin.parentesco === 'irmao' || vin.parentesco === 'meio_irmao') {
    const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
    if (par?.vivo && (!n.uniao || n.uniao.com !== par.id)) n.uniao = { com: par.id, tipo: 'casados', t: v.fatos[`irmao_uniao_${p.id}`] ?? v.t };
    if (!par && n.uniao) n.uniao = undefined;
    return;
  }
  const i = idadePessoa(v, p);
  if (p.parceiroId === 'fora') { if (nivel === 'central' || vin.proximidade >= 40) materializarParceria(v, r, p, n); return; }
  const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
  if (p.parceiroId && !par) p.parceiroId = undefined;
  // A viuvez (`indiretos`) já desfez a parceria: a união fica na história.
  if (n.uniao && (!par || !par.vivo || par.id !== n.uniao.com)) {
    if (!par || !par.vivo) { n.uniao = undefined; if (par && !par.vivo) { n.meta = 'recomecar'; n.tMeta = v.t; } }
  }
  if (!par) {
    if (i > 68 || !livreParaRomance(v, p)) return;
    // Voltar com quem terminou há pouco (os dois sozinhos, e ainda se gostando).
    const ex = (n.lacos ?? []).find(l => l.tipo === 'ex' && l.forca > 20 && v.t - l.desde <= 30);
    const q0 = ex ? v.pessoas[ex.id] : undefined;
    if (q0?.vivo && !q0.parceiroId && r.chance(0.1)) {
      unir(v, p, q0, n, 'namoro');
      ex!.tipo = 'amizade'; ex!.ultimo = 'Voltaram.'; ex!.tUltimo = v.t;
      viver(v, p, cota, { texto: `Voltou com ${q0.nome}.`, tipo: 'amor', noticia: `${p.nome} e ${q0.nome} voltaram.`, tom: 'neutro' });
      return;
    }
    const base = i < 25 ? 0.14 : i < 35 ? 0.18 : i < 50 ? 0.1 : 0.05;
    const chance = base * (n.meta === 'familia' ? 1.6 : n.meta === 'recomecar' ? 0.6 : 1) * (1 + p.temperamento.extroversao * 0.4);
    if (!r.chance(chance)) return;
    const g = generoDoPar(p, r);
    const q = criarPessoa19(v, r, { genero: g, idade: clamp(i + r.int(-5, 5), 18, 90), municipioId: p.municipioId });
    unir(v, p, q, n, 'namoro');
    viver(v, p, cota, { texto: `Começou a namorar ${q.nome}.`, tipo: 'amor' });
    // Ficar com o ex de alguém do mesmo grupo: a amizade sente.
    ciumeDoGrupo(v, p, q);
    return;
  }
  if (!n.uniao) n.uniao = { com: par.id, tipo: 'namoro', t: v.t };
  const u = n.uniao;
  const nPar = par.npc19;
  const pressao = 1 + ((n.divida > 0 ? 0.4 : 0) + (p.aperto?.tipo === 'luto' && !p.aperto.resolvido ? 0.3 : 0) + (n.afastado ? 0.2 : 0));
  const c = compat(p, par);
  const separa = (u.tipo === 'namoro' ? 0.12 : u.tipo === 'juntos' ? 0.06 : 0.03) * pressao * (1.5 - c);
  if (r.chance(separa)) {
    p.parceiroId = undefined; par.parceiroId = undefined;
    n.uniao = undefined; if (nPar) nPar.uniao = undefined;
    if (u.tipo !== 'namoro') p.aperto = { tipo: 'separacao', t: v.t };
    ligar(p, par, 'ex', 25, v, 'Terminaram.');
    n.meta = u.tipo === 'namoro' ? n.meta : 'recomecar'; n.tMeta = v.t;
    const casados = u.tipo === 'casados';
    viver(v, p, cota, { texto: casados ? `Separou-se de ${par.nome}.` : `Terminou com ${par.nome}.`, tipo: 'amor', noticia: casados ? `${p.nome} e ${par.nome} se separaram.` : undefined, peso: casados ? 'grande' : 'pequeno', tom: 'ruim' });
    return;
  }
  if (u.tipo === 'namoro' && v.t - u.t >= 12 && r.chance(0.22 * (n.meta === 'familia' ? 1.5 : 1) * (0.6 + c * 0.6))) {
    const casa = r.chance(0.5);
    u.tipo = casa ? 'casados' : 'juntos'; u.t = v.t;
    if (nPar?.uniao) { nPar.uniao.tipo = u.tipo; nPar.uniao.t = v.t; }
    par.municipioId = p.municipioId;
    if (casa) v.fatos[`mv_casou_${p.id}`] = v.t;
    viver(v, p, cota, { texto: casa ? `Casou com ${par.nome}.` : `Foi morar com ${par.nome}.`, tipo: 'amor', noticia: casa ? `${p.nome} casou com ${par.nome}${vin.proximidade >= 60 ? ', e você estava na festa' : ''}.` : `${p.nome} foi morar com ${par.nome}.`, peso: 'grande', tom: 'bom' });
    return;
  }
  // Filhos: com a união firme, e quando os dois querem.
  if ((u.tipo === 'casados' || u.tipo === 'juntos') && !n.gestacao && !nPar?.gestacao) {
    const gestante = p.genero === 'feminino' ? p : par.genero === 'feminino' ? par : undefined;
    if (!gestante || idadePessoa(v, gestante) < 20 || idadePessoa(v, gestante) > 43) return;
    const ja = Object.values(v.pessoas).filter(x => x.genitores?.includes(p.id)).length + (p.nFilhos && !Object.values(v.pessoas).some(x => x.genitores?.includes(p.id)) ? p.nFilhos : 0);
    const quer = p.querFilhos === 'nao' || par.querFilhos === 'nao' ? 0 : hash(p.id + 'filhos19') < 0.5 ? 2 : 1 + (n.meta === 'familia' ? 1 : 0);
    if (ja >= quer || !r.chance(ja === 0 ? 0.3 : 0.18)) return;
    const tParto = v.t + r.int(3, 11);
    const g = garantirNpc19(v, gestante);
    g.gestacao = { tParto, outroId: gestante === p ? par.id : p.id };
    const quando = `${['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][mesDe(tParto)]} de ${anoDe(tParto)}`;
    viver(v, p, cota, { texto: gestante === p ? `Está grávida. O bebê deve nascer em ${quando}.` : `Vai ser ${flex(p.genero, 'pai', 'mãe', 'mãe')}: ${par.nome} está grávida.`, tipo: 'filho', tom: 'bom' });
  }
}

function unir(v: Vida, p: Pessoa, q: Pessoa, n: Npc19, tipo: 'namoro' | 'juntos' | 'casados'): void {
  p.parceiroId = q.id; q.parceiroId = p.id;
  n.uniao = { com: q.id, tipo, t: v.t };
  if (q.npc19) q.npc19.uniao = { com: p.id, tipo, t: v.t };
  if (p.aperto?.tipo === 'separacao') p.aperto.resolvido ??= v.t;
}

/** Ficar com o ex de alguém do mesmo grupo: a amizade entre os dois esfria (ou vira briga). */
function ciumeDoGrupo(v: Vida, p: Pessoa, q: Pessoa): void {
  for (const l of q.npc19?.lacos ?? []) {
    if (l.tipo !== 'ex') continue;
    const f = v.pessoas[l.id];
    if (!f?.vivo || f.id === p.id) continue;
    const lpf = laco(p, f.id);
    if (!lpf) continue;
    ajustarLaco(v, p, f, -40, `Ficou com ${q.nome}, ex de ${f.nome}.`);
  }
}

function nascimentos(v: Vida, r: Rng, p: Pessoa, n: Npc19, cota: Cota19): void {
  const gest = n.gestacao;
  if (!gest || gest.tParto > v.t) return;
  n.gestacao = undefined;
  if (!p.vivo) return;
  const outro = gest.outroId ? v.pessoas[gest.outroId] : undefined;
  if (r.chance(0.08)) {
    viver(v, p, cota, { texto: 'Perdeu o bebê no começo da gravidez.', tipo: 'perda', tom: 'ruim' });
    p.aperto = { tipo: 'luto', t: v.t };
    return;
  }
  const genero = r.chance(0.5) ? 'masculino' : 'feminino';
  const anc = misturar(ancestralidadeDe(p), outro ? ancestralidadeDe(outro) : undefined);
  const bebe = criarPessoa19(v, r, { genero, idade: 0, municipioId: p.municipioId, sobrenome: outro && p.genero === 'feminino' && r.chance(0.5) ? outro.sobrenome : p.sobrenome, visual: visualHerdado(r, genero, p.visual, outro?.visual, anc), familia: { ancestralidade: anc, tradicao: p.tradicao ?? outro?.tradicao } });
  bebe.tNasc = gest.tParto;
  bebe.genitores = [p.id, ...(outro ? [outro.id] : [])];
  bebe.municipioNatal = p.municipioId;
  for (const x of [p, outro]) if (x) x.nFilhos = (x.nFilhos ?? 0) + 1;
  const texto = `Nasceu ${bebe.nome}, ${flex(genero, 'filho', 'filha', 'filhe')} de ${p.nome}${outro ? ` e ${outro.nome}` : ''}.`;
  viver(v, p, cota, { texto: `Nasceu ${bebe.nome}.`, tipo: 'filho', noticia: texto, peso: 'grande', tom: 'bom' });
  if (outro?.npc19) { const vi = garantirVida(outro); vi.trajetoria.push({ t: v.t, texto: `Nasceu ${bebe.nome}.`, tipo: 'filho' }); if (vi.trajetoria.length > 24) vi.trajetoria.splice(0, vi.trajetoria.length - 24); }
}

/* ------------------------------------------------------------------ Mudar de cidade (com motivo) */

function mudanca(v: Vida, r: Rng, p: Pessoa, vin: Vinculo, n: Npc19, cota: Cota19): void {
  const i = idadePessoa(v, p);
  if (n.negocio || i < 20 || i > 62 || marcou(n, 'mudou', v, 4)) return;
  const pais = paisDaCidade(p.municipioId);
  // Perto da família: o irmão que vive longe dos pais volta (quem tem meta de família).
  if (n.meta === 'familia' && (vin.parentesco === 'irmao' || vin.parentesco === 'meio_irmao')) {
    const genitor = Object.values(v.pessoas).find(x => x.vivo && ['mae', 'pai'].includes(v.vinculos[x.id]?.parentesco ?? ''));
    if (genitor && genitor.municipioId !== p.municipioId && r.chance(0.06)) {
      p.municipioId = genitor.municipioId;
      moverParceria(v, p);
      marcar(n, 'mudou', v);
      viver(v, p, cota, { texto: `Voltou para ${municipio(genitor.municipioId).nome}, para ficar perto dos pais.`, tipo: 'lugar', noticia: `${p.nome} voltou a morar em ${municipio(genitor.municipioId).nome}, perto dos pais.`, tom: 'bom' });
    }
    return;
  }
  // A vontade de mudar (ou a carreira que chama): a cidade grande do país — às vezes, outro país.
  if ((n.meta === 'mudar' && r.chance(0.09)) || (n.meta === 'carreira' && n.marcas?.subiu === v.t && r.chance(0.25))) {
    const fora = n.meta === 'mudar' && p.temperamento.abertura > 0.55 && r.chance(0.25);
    const destinos = fora
      ? ['PT', 'US', 'ES', 'IE', 'CA', 'DE', 'GB'].filter(x => x !== pais).flatMap(x => cidadesDoPais(x).filter(m => m.perfil === 'metropole' || m.perfil === 'capital'))
      : cidadesDoPais(pais).filter(m => m.id !== p.municipioId && (m.perfil === 'metropole' || m.perfil === 'capital'));
    if (!destinos.length) return;
    const d = destinos[Math.floor(r.next() * destinos.length)];
    p.municipioId = d.id;
    moverParceria(v, p);
    marcar(n, 'mudou', v);
    const porque = n.meta === 'carreira' ? ' por causa do trabalho' : fora ? ' para tentar a vida lá fora' : '';
    viver(v, p, cota, { texto: `Mudou-se para ${d.nome}${porque}.`, tipo: 'lugar', noticia: `${p.nome} se mudou para ${d.nome}${porque}.${vin.proximidade >= 55 && p.municipioId !== v.moradia.municipioId ? ' A amizade passou a caber no celular.' : ''}`, tom: 'neutro' });
  }
}

function moverParceria(v: Vida, p: Pessoa): void {
  const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
  if (par?.vivo && p.npc19?.uniao && p.npc19.uniao.tipo !== 'namoro') par.municipioId = p.municipioId;
  for (const x of Object.values(v.pessoas)) if (x.vivo && x.genitores?.includes(p.id) && !v.vinculos[x.id] && idadePessoa(v, x) < 18) x.municipioId = p.municipioId;
}

/* ================================================================== Os laços entre as pessoas do mundo */

export const laco = (p: Pessoa, id: string): Laco19 | undefined => p.npc19?.lacos?.find(l => l.id === id);

function ligar(a: Pessoa, b: Pessoa, tipo: Laco19['tipo'], forca: number, v: Vida, ultimo?: string): void {
  for (const [x, y] of [[a, b], [b, a]] as const) {
    const n = x.npc19 ?? (x.npc19 = { meta: 'estabilidade', tMeta: v.t, gasto: piso19(x.municipioId), reserva: 0, divida: 0, exposicao: exposicaoDe19(x) });
    const ls = (n.lacos ??= []);
    const ja = ls.find(l => l.id === y.id);
    if (ja) { ja.tipo = tipo; ja.forca = forca; ja.ultimo = ultimo; ja.tUltimo = v.t; continue; }
    ls.push({ id: y.id, tipo, forca, desde: v.t, ...(ultimo ? { ultimo, tUltimo: v.t } : {}) });
    if (ls.length > 8) { ls.sort((p, q) => Math.abs(q.forca) - Math.abs(p.forca)); ls.length = 8; }
  }
}

export function ajustarLaco(v: Vida, a: Pessoa, b: Pessoa, delta: number, ultimo?: string): void {
  for (const [x, y] of [[a, b], [b, a]] as const) {
    const l = laco(x, y.id);
    if (!l) continue;
    l.forca = clamp(l.forca + delta, -100, 100);
    if (l.tipo === 'amizade' && l.forca < -20) { l.tipo = 'rivalidade'; l.ultimo = ultimo ?? 'Brigaram e pararam de se falar.'; l.tUltimo = v.t; }
    else if (l.tipo === 'rivalidade' && l.forca > 10) { l.tipo = 'amizade'; l.ultimo = ultimo ?? 'Fizeram as pazes.'; l.tUltimo = v.t; }
    else if (ultimo) { l.ultimo = ultimo; l.tUltimo = v.t; }
  }
}

/** Os grupos de onde vocês vêm (a escola, a faculdade, um emprego): quem é do mesmo grupo se conhece. */
function grupoDe(vin: Vinculo): string | undefined {
  if (vin.parentesco) return 'familia';
  const c = vin.convivio.find(x => x === 'escola' || x === 'faculdade' || x === 'trabalho') ?? (['escola', 'faculdade', 'trabalho'].includes(vin.origem as string) ? vin.origem as string : undefined);
  return c ? `${c}:${anoDe(vin.tInicio)}` : undefined;
}

function lacosDoAno(v: Vida, gente: Pessoa[], cota: Cota19): void {
  const r = rngDe(v.id, 'lacos19', v.t);
  let novos = 0;
  // Os laços que existem andam: a convivência (a mesma cidade), o jeito dos dois e o acaso.
  const vistos = new Set<string>();
  for (const a of gente) {
    for (const l of a.npc19?.lacos ?? []) {
      const k = a.id < l.id ? `${a.id}|${l.id}` : `${l.id}|${a.id}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      const b = v.pessoas[l.id];
      if (!b?.vivo || l.tipo === 'ex') continue;
      const perto = a.municipioId === b.municipioId;
      const delta = Math.round((compat(a, b) - 0.6) * 6 + (perto ? 1 : -2) + r.normal() * 4);
      ajustarLaco(v, a, b, delta);
    }
  }
  // Gente nova se conhece: do mesmo grupo de vocês, na mesma cidade (no máximo quatro laços novos por ano).
  for (let x = 0; x < gente.length && novos < 4; x++) {
    const a = gente[x];
    const ga = grupoDe(v.vinculos[a.id]);
    for (let y = x + 1; y < gente.length && novos < 4; y++) {
      const b = gente[y];
      if (laco(a, b.id) || a.municipioId !== b.municipioId) continue;
      if (a.parceiroId === b.id) continue;
      const gb = grupoDe(v.vinculos[b.id]);
      const mesmoGrupo = !!ga && ga === gb && ga !== 'familia';
      // A família e os amigos mais próximos de você se conhecem nas festas (os aniversários, o casamento).
      const festa = (ga === 'familia') !== (gb === 'familia') && Math.min(v.vinculos[a.id].proximidade, v.vinculos[b.id].proximidade) >= 55;
      if (!mesmoGrupo && !festa) continue;
      if (!r.chance(mesmoGrupo ? 0.35 : 0.15)) continue;
      ligar(a, b, mesmoGrupo && ga!.startsWith('trabalho') ? 'colega' : 'amizade', Math.round(20 + compat(a, b) * 30 + r.normal() * 8), v, mesmoGrupo ? undefined : 'Conheceram-se numa festa sua.');
      novos++;
    }
  }
  void cota;
}

/* ================================================================== O mundo não acumula gente esquecida */

/**
 * As pessoas que o mundo criou aqui (`q19…`) ficam enquanto alguém da sua vida as liga (a parceria de um amigo, o filho
 * dele, o laço com outra pessoa que importa). Sem ninguém, saem — com os laços que apontavam para elas.
 */
export function limparMundo19(v: Vida): void {
  const ancoras = new Set<string>();
  for (const id of Object.keys(v.vinculos)) {
    const p = v.pessoas[id];
    if (!p) continue;
    if (p.parceiroId) ancoras.add(p.parceiroId);
    for (const l of p.npc19?.lacos ?? []) ancoras.add(l.id);
    if (p.npc19?.uniao) ancoras.add(p.npc19.uniao.com);
  }
  // Ninguém sai enquanto alguém (que fica) aponta para ele: a árvore da família nunca fica com um galho solto.
  for (let mudou = true; mudou;) {
    mudou = false;
    const citados = new Set<string>();
    for (const x of Object.values(v.pessoas)) {
      for (const g of x.genitores ?? []) citados.add(g);
      if (x.parceiroId) citados.add(x.parceiroId);
      if (x.reconhecidoPor) citados.add(x.reconhecidoPor);
      if (x.npc19?.uniao) citados.add(x.npc19.uniao.com);
      if (x.npc19?.gestacao?.outroId) citados.add(x.npc19.gestacao.outroId);
    }
    for (const x of Object.values(v.pessoas)) {
      if (!x.id.startsWith('q19') || v.vinculos[x.id] || ancoras.has(x.id) || citados.has(x.id)) continue;
      if ((x.genitores ?? []).some(g => v.vinculos[g] || ancoras.has(g))) continue;
      delete v.pessoas[x.id];
      mudou = true;
    }
  }
  for (const p of Object.values(v.pessoas)) {
    const n = p.npc19;
    if (!n) continue;
    if (n.lacos) n.lacos = n.lacos.filter(l => v.pessoas[l.id]);
    // A união só existe enquanto a parceria existe (a morte, a separação contada por outro sistema a desfazem).
    if (n.uniao && (!p.vivo || p.parceiroId !== n.uniao.com || !v.pessoas[n.uniao.com]?.vivo)) n.uniao = undefined;
    if (!p.vivo) { n.gestacao = undefined; n.afastado = undefined; }
  }
  void idade;
}
