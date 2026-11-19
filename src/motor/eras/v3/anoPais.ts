/**
 * ERAS v3 · O ANO HISTÓRICO FORA DO BRASIL (e o que vale para todos os países) — a continuação de `eras/ano`.
 *
 * O Brasil segue pelo caminho da v1/v2 (`eras/ano.processarEra`), que chama daqui só as partes comuns (as regras sociais e
 * as guerras). Um país com pacote (`eras/base/pacote`) passa por aqui inteiro, na mesma ordem do Brasil:
 *   1. a economia segue a série (a fase pelo PIB per capita; a inflação pelo nível de preços; o desemprego da época pesa
 *      nas contratações e nas demissões quando passa de 7%);
 *   2. as trocas de moeda (só a tela muda; o texto conta quanto o saldo virou);
 *   3. os acontecimentos (na linha do tempo do mundo e, para quem tem idade e está no lugar, na vida), com os efeitos
 *      especiais que mexem no dinheiro (congelamento de depósitos, reforma que corta as economias, hiperinflação) ou no
 *      corpo (a gripe de 1918);
 *   4. as regras sociais e de direitos (uma vez, na idade em que pesam) e as guerras (a convocação, a frente, a volta);
 *   5. as chegadas de tecnologia em casa e uma lembrança cultural do ano (do país, da região, da cidade ou do campo).
 * Nada aqui gasta o acaso da vida: todo sorteio é derivado (`rngDe`).
 */
import type { Vida, Tema } from '../../tipos';
import type { AnoEconomico } from '../../sistemas/economia';
import { rngDe } from '../../rng';
import { anoDe, tDe, MESES, mesDe } from '../../tempo';
import { escrever, idade } from '../../nucleo';
import { municipio } from '../../dados/lugares';
import { mundoDe } from '../../v14/mundo/mundo14';
import { lancar } from '../../sistemas/extrato';
import { pacoteDaEra, moedaNoMes, naSerie, type AcontecimentoDaEpoca, type PacoteDeEra, type RegraSocial, type LadoDaDivisao } from '../base/pacote';
import { nivelEconomico, temAcesso, tecnologia } from '../base/contexto';
import { guerrasDoPais, regrasDoPais, regraValeEm, taxaDoSuperior } from '../base/sociedade';
import { ladoHistoricoCorrente } from '../base/moedas';
import { fatorNominalNoPais, escritaAntiga } from '../../mundo/moeda';
import { sociedadeDoAno, notaDaHistoriaAlternativa } from '../v4/sociedadeAno';
import type { EventoMundial14, TipoEventoMundial } from '../../dados14/mundo/tipos';
import type { FaseEconomica } from '../../tipos';

const visto = (v: Vida, id: string) => (v.era!.vistos ??= []).includes(id);
const marcar = (v: Vida, id: string) => { (v.era!.vistos ??= []).push(id); };

/** Um valor do motor na moeda do mês, no país ("ℳ 1.234", "£3 4s 6d"). */
export function nominalNoPais(valor: number, pais: string, t: number, lado: LadoDaDivisao = 'oeste'): string {
  const p = pacoteDaEra(pais);
  if (!p) return String(Math.round(valor));
  const n = valor * fatorNominalNoPais(pais, t);
  const m = moedaNoMes(p, t, lado);
  const antiga = escritaAntiga(n, pais);
  if (antiga && m.formato) return antiga;
  return `${m.simbolo} ${Math.round(n).toLocaleString('pt-BR')}`;
}

/* ------------------------------------------------------------------ 1. A economia */

function faseDaRenda(pib: number, anterior: FaseEconomica | undefined): FaseEconomica {
  if (pib < 0) return 'crise';
  if (anterior === 'crise') return 'recuperacao';
  if (pib >= 3.5) return 'expansao';
  if (pib < 1) return 'desaceleracao';
  return 'normal';
}
const efetiva = (x: number) => (x <= 0.25 ? x : Math.min(0.4, 0.25 + 0.05 * Math.log(x / 0.25)));

function economiaDoPais(v: Vida, p: PacoteDeEra, ec: AnoEconomico): void {
  const ano = anoDe(v.t);
  if (ano > 2025 || !v.economia) return;
  const pib = naSerie(p.serie, p.serie.PIB, ano);
  const a = naSerie(p.serie, p.serie.PRECOS, ano), b = naSerie(p.serie, p.serie.PRECOS, ano - 1);
  if (pib === null || a === null || b === null) return;
  const e = v.economia;
  const h = e.historico[e.historico.length - 1];
  const anterior = e.historico.length > 1 ? e.historico[e.historico.length - 2].fase : undefined;
  const fase = faseDaRenda(pib, anterior);
  // Deflação (os anos 1920–1930) é inflação negativa: o dinheiro parado GANHA poder de compra (limitado a 10% ao ano).
  const inf = Math.max(-0.1, efetiva(a / b - 1));
  e.precos = e.precos / (1 + e.inflacao) * (1 + inf);
  e.inflacao = inf;
  if (fase !== e.fase) { e.fase = fase; e.tFase = v.t; ec.virou = true; }
  ec.fase = fase;
  ec.inflacao = inf;
  if (h && h.ano === ano) { h.fase = fase; h.inflacao = Math.round(inf * 10000) / 10000; }
  // O desemprego da época (série): acima de 7%, menos vagas e mais cortes; o mundo registra o ano.
  const u = naSerie(p.serie, p.serie.DESEMPREGO, ano);
  if (u !== null && u >= 7) {
    const m = mundoDe(v);
    const id = `${ano}:desemprego_${p.pais}`;
    if (!m.eventos.some(x => x.id === id)) {
      const k = Math.min(1, (u - 5) / 20);
      m.eventos.push({ id, ano, tipo: 'economia', escopo: 'pais', titulo: `Desemprego de ${Math.round(u)}%`, texto: `Em ${ano}, cerca de ${Math.round(u)} em cada cem pessoas que procuravam trabalho não encontravam.`, real: true, mods: { contratacao: -0.12 * k, demissao: 1 + 0.6 * k, clientela: -6 * k }, ate: ano });
    }
  }
}

/* ------------------------------------------------------------------ 2. As trocas de moeda */

function trocasDeMoeda(v: Vida, p: PacoteDeEra, tIni: number, tFim: number, lado: LadoDaDivisao): void {
  for (const m of p.moedas) {
    if (!(m.desde > tIni && m.desde <= tFim) || visto(v, `moeda:${p.pais}:${m.id}`)) continue;
    if (m.lado && m.lado !== lado) continue;
    const anterior = moedaNoMes(p, m.desde - 1, lado);
    if (anterior.id === m.id) continue;
    marcar(v, `moeda:${p.pais}:${m.id}`);
    const i = idade(v);
    const fala = i < 10
      ? `Os adultos passaram semanas falando do dinheiro novo: em ${m.dataOficial}, ${artigo(anterior.nome)} deu lugar ${aoA(m.nome)}${m.troca ? ` (${m.troca})` : ''}.`
      : `Em ${m.dataOficial}, ${artigo(anterior.nome)} deu lugar ${aoA(m.nome)}${m.troca ? ` (${m.troca})` : ''}. Por um tempo, os preços vieram nas duas moedas.`;
    escrever(v, { t: m.desde, texto: fala, relevancia: 'cotidiano', tema: 'dinheiro', fato: { tipo: 'era', dados: { categoria: 'moeda', evento: m.id } } });
  }
}
const FEMININAS = /^(libra|lira|peseta|coroa|rupia|marca)/;
const artigo = (nome: string) => (FEMININAS.test(nome) ? `a ${nome}` : `o ${nome}`);
const aoA = (nome: string) => (FEMININAS.test(nome) ? `à ${nome}` : `ao ${nome}`);

/* ------------------------------------------------------------------ 3. Os acontecimentos e os efeitos especiais */

const TIPO: Record<AcontecimentoDaEpoca['categoria'], TipoEventoMundial> = {
  politica: 'politica', economia: 'economia', sociedade: 'sociedade', direitos: 'sociedade', esporte: 'esporte', cultura: 'cultura', desastre: 'desastre', saude: 'pandemia', tecnologia: 'tecnologia', guerra: 'politica'
};

/** O acontecimento é do lugar de quem vive (nacional, a divisão de casa, o lado do país). */
export function ehDoLugarNoPais(v: Vida, a: { divisoes?: string[]; lado?: LadoDaDivisao }, lado: LadoDaDivisao): boolean {
  if (a.lado && a.lado !== lado) return false;
  if (!a.divisoes) return true;
  const m = municipio(v.moradia.municipioId);
  return !!m.uf && a.divisoes.includes(m.uf);
}

/** Uma das formas (escolhida pelo acontecimento, sem gastar o acaso da vida): o texto não repete a mesma moldura. */
const uma = (id: string, xs: string[]) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return xs[h % xs.length]; };

function comoChegou(v: Vida, a: AcontecimentoDaEpoca, ano: number): string {
  const i = idade(v);
  if (i < 12) {
    if (a.categoria === 'desastre' || a.categoria === 'guerra') return 'Você era criança, mas lembra do medo nos rostos dos adultos. ';
    if (a.categoria === 'esporte') return 'Você era criança e lembra da festa dos adultos. ';
    return uma(a.id, ['Você era criança, mas lembra dos adultos falando disso. ', 'Você era pequeno demais para entender, mas guardou a conversa da cozinha. ', '']);
  }
  // Os de todo dia, sem moldura: o fato basta. A moldura fica para o que marcou.
  if (a.divisoes || a.peso !== 'biografia') return '';
  if (temAcesso(v, 'smartphone', ano)) return uma(a.id, ['A notícia chegou primeiro pelo celular. ', 'O celular não parou de tocar com a notícia. ']);
  if (tecnologia(v, 'tv', ano) === 'comum') return uma(a.id, ['Na televisão e no rádio, só se falava nisso. ', 'A família parou diante da televisão. ', 'O telejornal da noite não falou de outra coisa. ']);
  if (temAcesso(v, 'radio', ano)) return uma(a.id, ['O rádio deu a notícia, e o jornal do dia seguinte contou o resto. ', 'A notícia veio pelo rádio da sala, e ninguém falou durante o boletim. ', 'Os jornais esgotaram nas bancas. ']);
  return uma(a.id, ['A notícia correu pelos jornais e de boca em boca. ', 'Os jornais esgotaram; quem não sabia ler ouvia a notícia lida em voz alta na praça. ']);
}

/** O efeito especial no dinheiro ou no corpo; devolve a frase pessoal. */
function especial(v: Vida, p: PacoteDeEra, a: AcontecimentoDaEpoca, t: number, lado: LadoDaDivisao): string {
  const e = a.especial;
  if (!e) return '';
  const i = idade(v);
  const conta = Math.max(0, v.financas.conta);
  if (e.tipo === 'hiperinflacao') {
    if (i < 16 || conta <= 0) return i < 16 ? '' : ` ${e.texto}`;
    const perde = Math.round(conta * (1 - e.fica));
    v.financas.conta -= perde;
    lancar(v, 'Economias apagadas pela inflação', 'acontecimento', -perde);
    return ` ${e.texto}`;
  }
  if (e.tipo === 'corte_das_economias') {
    if (i < 16) return '';
    const protegido = Math.min(conta, e.protegido);
    const perde = Math.round((conta - protegido) * (1 - e.fica));
    if (perde > 0) { v.financas.conta -= perde; lancar(v, 'Reforma monetária', 'acontecimento', -perde); }
    return ` ${e.texto}${perde > 0 ? ` Do que você tinha guardado, sobrou ${nominalNoPais(v.financas.conta, p.pais, t, lado)}.` : ''}`;
  }
  if (e.tipo === 'congelamento') {
    if (i < 18 || conta <= e.limite) return i >= 18 ? ` ${e.texto} O seu dinheiro cabia no limite.` : '';
    const preso = Math.round(conta - e.limite);
    v.financas.conta -= preso;
    v.era!.congelado = { valor: preso, tVolta: e.voltaEm, parcelas: e.parcelas, perda: e.perda };
    lancar(v, 'Depósitos congelados', 'acontecimento', -preso);
    return ` ${e.texto} Da sua conta, ${nominalNoPais(preso, p.pais, t, lado)} ficaram presos.`;
  }
  if (e.tipo === 'pandemia') {
    // O risco é do corpo: uma perda de saúde para quem adoece (o motor do corpo decide o resto no fim do ano).
    if (rngDe(v.id, 'era-pandemia', a.id).chance(e.risco)) { v.corpo.saude = Math.max(5, v.corpo.saude - 25); return ` ${e.texto} Você adoeceu e passou semanas de cama.`; }
    return ` ${e.texto}`;
  }
  if (e.tipo === 'racionamento') return ` ${e.texto}`;
  if (e.tipo === 'catastrofe') {
    if (rngDe(v.id, 'era-catastrofe', a.id).chance(e.risco)) { v.era!.morte = { t, causa: `${a.titulo.toLowerCase()}` }; return ` ${e.texto}`; }
    v.mente.estresse = Math.min(100, (v.mente.estresse ?? 0) + 20);
    return ` ${e.texto} ${e.sobreviveu}`;
  }
  return '';
}

/** A devolução do que ficou congelado (o mesmo desenho do Plano Collor): parcelas mensais, com a perda da época. */
function devolverCongelado(v: Vida, p: PacoteDeEra, tFim: number, lado: LadoDaDivisao): void {
  const r = v.era?.congelado;
  if (!r || r.parcelas <= 0) return;
  const total = r.parcelas;
  const devidas = Math.max(0, Math.min(total, tFim - r.tVolta + 1));
  if (devidas <= 0) return;
  const valor = Math.round(r.valor * (1 - r.perda));
  v.financas.conta += valor;
  lancar(v, 'Devolução dos depósitos congelados', 'acontecimento', valor);
  escrever(v, { texto: `O dinheiro que estava congelado voltou à conta: ${nominalNoPais(valor, p.pais, tFim, lado)}${r.perda > 0 ? ' — menos do que valia quando foi preso' : ''}.`, relevancia: 'cotidiano', tema: 'dinheiro', fato: { tipo: 'era', dados: { categoria: 'economia', evento: 'congelado_volta' } } });
  delete v.era!.congelado;
}

function frasePessoal(v: Vida, a: AcontecimentoDaEpoca): string {
  const pp = a.pessoal;
  if (!pp) return '';
  const i = idade(v);
  if (i < 14 && pp.crianca) return ` ${pp.crianca}`;
  if (v.eu.genero === 'feminino' && i >= 16 && pp.mulher) return ` ${pp.mulher}`;
  if (i >= 16 && v.trabalho.atual && pp.trabalho) return ` ${pp.trabalho}`;
  if (i >= 16 && !v.trabalho.atual && pp.semTrabalho) return ` ${pp.semTrabalho}`;
  return '';
}

function acontecimentos(v: Vida, p: PacoteDeEra, tIni: number, tFim: number, lado: LadoDaDivisao): void {
  const m = mundoDe(v);
  for (const a of p.acontecimentos) {
    const t = tDe(a.data[0], a.data[1] - 1);
    if (!(t > tIni && t <= tFim) || visto(v, `ac:${p.pais}:${a.id}`)) continue;
    marcar(v, `ac:${p.pais}:${a.id}`);
    const ano = a.data[0];
    const local = ehDoLugarNoPais(v, a, lado);
    if (!local) continue;
    const ev: EventoMundial14 = { id: `${ano}:${p.pais.toLowerCase()}_${a.id}`, ano, tipo: TIPO[a.categoria], escopo: a.divisoes ? 'regiao' : 'pais', titulo: a.titulo, texto: a.fato, real: true, ...(a.mods ? { mods: a.mods, ate: ano + (a.dura ?? 0) } : {}), ...(a.efeito && a.mods ? { efeito: a.efeito } : {}) };
    if (a.divisoes) ev.lugar = municipio(v.moradia.municipioId).uf;
    m.eventos.push(ev);
    const i = Math.floor((t - v.eu.tNasc) / 12);
    if (i < (a.idadeMin ?? 7)) { if (a.especial && i >= 0 && a.especial.tipo !== 'pandemia' && a.especial.tipo !== 'congelamento') especial(v, p, a, t, lado); continue; }
    const pessoal = especial(v, p, a, t, lado);
    const efeito = a.efeito && a.mods ? ` ${a.efeito}` : '';
    const tema: Tema = a.categoria === 'economia' ? 'dinheiro' : a.categoria === 'saude' ? 'saude' : a.categoria === 'esporte' || a.categoria === 'cultura' ? 'lazer' : 'lugar';
    escrever(v, { t, texto: `${comoChegou(v, a, ano)}${a.fato}${notaDaHistoriaAlternativa(v, p.pais, a.id)}${efeito}${pessoal}${frasePessoal(v, a)}`, relevancia: a.peso === 'biografia' ? 'biografia' : 'cotidiano', tema, tom: a.categoria === 'desastre' || a.categoria === 'guerra' ? 'ruim' : 'neutro', fato: { tipo: 'era', dados: { categoria: a.categoria, evento: `${p.pais}:${a.id}`, ...(a.divisoes ? { escopo: 'regional' } : { escopo: 'nacional' }) } } });
  }
}

/* ------------------------------------------------------------------ 4. As regras sociais e as guerras (todos os países) */

/** A idade em que cada tema pesa na vida (o padrão; `valor` da regra sobrepõe nos temas de idade). */
const IDADE_DO_TEMA: Record<RegraSocial['tema'], number> = {
  voto_feminino: 21, mulher_casada: 22, divorcio: 30, casamento_igualitario: 25, homossexualidade_crime: 18, segregacao: 7,
  servico_militar: 18, escola_obrigatoria: 7, trabalho_infantil: 10, maioridade: 18, previdencia: 60, saude_publica: 20,
  censura: 18, perseguicao: 16, sem_eleicoes: 18
};
const TEMA_DO_TEMA: Partial<Record<RegraSocial['tema'], Tema>> = { escola_obrigatoria: 'escola', trabalho_infantil: 'trabalho', previdencia: 'dinheiro', saude_publica: 'saude', servico_militar: 'escolha', mulher_casada: 'familia', segregacao: 'lugar' };

/** A pessoa é a quem a regra pesa? */
function ehDeQuem(v: Vida, r: RegraSocial): boolean {
  switch (r.quem) {
    case undefined: return true;
    case 'mulher': return v.eu.genero === 'feminino';
    case 'homem': return v.eu.genero === 'masculino';
    case 'pobre': return nivelEconomico(v) <= 1;
    case 'negro': return (v.eu.ancestralidade?.af ?? 0) >= 0.25;
    case 'mesmo_genero': return Object.entries(v.vinculos).some(([id, vin]) => !!vin.romance && v.pessoas[id]?.genero === v.eu.genero && v.pessoas[id]?.vivo);
  }
}

export function regrasDoAno(v: Vida, pais: string, lado: LadoDaDivisao): void {
  const i = idade(v), ano = anoDe(v.t);
  if (ano > 2025) return;
  const div = municipio(v.moradia.municipioId).uf;
  for (const r of regrasDoPais(pais)) {
    if (!r.texto || visto(v, `rg:${r.id}`)) continue;
    const quando = r.tema === 'casamento_igualitario' || r.tema === 'divorcio' ? Infinity : r.valor !== undefined && r.tema !== 'escola_obrigatoria' ? r.valor : IDADE_DO_TEMA[r.tema];
    // A regra pesa na idade dela (ou, para quem já passou dela, no ano em que a regra começa a valer — nunca antes de nascer).
    const naIdade = i === quando || (i > quando && ano === r.de) || (r.quem === 'mesmo_genero' && i >= 16);
    if (!naIdade || !regraValeEm(r, ano, div, lado) || !ehDeQuem(v, r)) continue;
    marcar(v, `rg:${r.id}`);
    escrever(v, { texto: r.texto, relevancia: r.tema === 'segregacao' || r.tema === 'perseguicao' || r.tema === 'mulher_casada' ? 'biografia' : 'cotidiano', tema: TEMA_DO_TEMA[r.tema] ?? 'lugar', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: r.id, escopo: r.divisoes ? 'regional' : 'nacional' } } });
  }
}

/**
 * As guerras: a convocação (uma vez por guerra, pela fração histórica dos homens da idade que serviram; mulheres onde
 * houve convocação), a frente em casa (os bombardeios, o racionamento) e a volta. O risco de morrer de quem serve é de
 * `sistemas/corpo` (metade da letalidade histórica: regra de jogo, `eras/base/sociedade`).
 */
export function guerrasDoAno(v: Vida, pais: string, lado: LadoDaDivisao): void {
  const i = idade(v);
  for (const g of guerrasDoPais(pais)) {
    if (g.lado && g.lado !== lado) continue;
    const ini = tDe(g.de[0], g.de[1] - 1), fim = tDe(g.ate[0], g.ate[1] - 1);
    if (v.t < ini || v.t - 12 > fim) continue;
    const servidas = (v.era!.guerras ??= []);
    const frente = g.frenteDesde ? tDe(g.frenteDesde[0], g.frenteDesde[1] - 1) : ini;
    if (g.frente && !visto(v, `gf:${g.id}`) && i >= 4 && v.t >= frente) {
      marcar(v, `gf:${g.id}`);
      escrever(v, { texto: g.frente, relevancia: 'biografia', tema: 'lugar', tom: 'ruim', fato: { tipo: 'era', dados: { categoria: 'guerra', evento: `frente:${g.id}` } } });
    }
    const naIdade = i >= g.idades[0] && i <= g.idades[1] && (v.eu.genero === 'masculino' || !!g.mulheres);
    if (naIdade && !servidas.includes(g.id) && !visto(v, `gc:${g.id}`) && v.t <= fim) {
      marcar(v, `gc:${g.id}`);
      // O alcance histórico da guerra inteira, sorteado uma vez por vida (quem fica fora da idade no começo pode entrar depois).
      if (rngDe(v.id, 'era-guerra', g.id).chance(Math.min(0.95, g.alcance))) {
        servidas.push(g.id);
        escrever(v, { texto: `Veio a convocação: ${g.nome}. Você ${flexG(v, 'foi chamado', 'foi chamada')} e partiu, como tantos da sua idade — sem saber quando, nem se, voltaria.`, relevancia: 'marco', tema: 'escolha', tom: 'ruim', fato: { tipo: 'era', dados: { categoria: 'guerra', evento: `servico:${g.id}` } } });
      }
    }
    if (servidas.includes(g.id) && v.t > fim && !visto(v, `gv:${g.id}`)) {
      marcar(v, `gv:${g.id}`);
      escrever(v, { texto: `A guerra acabou e você voltou para casa. Voltou outra pessoa: o que se viu lá não se conta à mesa, e muitos da sua idade não voltaram.`, relevancia: 'marco', tema: 'escolha', tom: 'neutro', fato: { tipo: 'era', dados: { categoria: 'guerra', evento: `volta:${g.id}` } } });
      v.mente.estresse = Math.min(100, (v.mente.estresse ?? 0) + 15);
    }
  }
}
const flexG = (v: Vida, m: string, f: string) => (v.eu.genero === 'feminino' ? f : m);

/**
 * A escola e a universidade da época: aos 17, quando poucos seguiam estudando, a vida diz quantos (a taxa de matrícula
 * no ensino superior do país, `eras/base/sociedade`). Uma vez; só quando ela é baixa (menos de 20 em cada cem).
 */
export function estudoDaEpoca(v: Vida, pais: string): void {
  if (idade(v) !== 17 || visto(v, 'superior')) return;
  const ano = anoDe(v.t);
  const taxa = taxaDoSuperior(pais, ano);
  if (taxa === undefined || taxa >= 20 || ano > 2025) return;
  marcar(v, 'superior');
  const n = Math.max(1, Math.round(taxa));
  escrever(v, { texto: `Na sua turma, quase ninguém seguiria para a faculdade: em ${ano}, só ${n} em cada cem jovens ${n === 1 ? 'chegava' : 'chegavam'} ao ensino superior no país — quase todos de famílias com dinheiro. Para a maioria, os dezoito anos eram a idade de trabalhar.`, relevancia: 'cotidiano', tema: 'estudo', fato: { tipo: 'era', dados: { categoria: 'sociedade', evento: 'superior' } } });
}

/* ------------------------------------------------------------------ 5. A lembrança do ano (do país) */

function lembranca(v: Vida, p: PacoteDeEra, lado: LadoDaDivisao): void {
  const ano = anoDe(v.t), i = idade(v);
  if (ano > 2025) return;
  const r = rngDe(v.id, 'era-cultura', ano);
  if (!r.chance(0.55)) return;
  const mu = municipio(v.moradia.municipioId);
  const urbano = mu.perfil === 'metropole' || mu.perfil === 'metropolitana' || mu.perfil === 'capital';
  const possiveis = p.lembrancas.filter(l => ano >= l.de && ano <= l.ate && i >= l.idade[0] && i <= l.idade[1] && !visto(v, `cult:${p.pais}:${l.id}`)
    && (!l.exige || tecnologia(v, l.exige) !== 'indisponivel') && ehDoLugarNoPais(v, l, lado) && (!l.meio || (l.meio === 'urbano') === urbano));
  const l = r.pick(possiveis);
  if (!l) return;
  marcar(v, `cult:${p.pais}:${l.id}`);
  const lazer = ['musica', 'tv', 'radio', 'cinema', 'jogo', 'brincadeira', 'esporte', 'festa', 'leitura'].includes(l.tipo);
  escrever(v, { texto: l.texto, relevancia: 'cotidiano', tema: lazer ? 'lazer' : l.tipo === 'escola' ? 'escola' : l.tipo === 'trabalho' ? 'trabalho' : l.tipo === 'casa' || l.tipo === 'comida' ? 'casa' : 'lugar', tom: 'bom', fato: { tipo: 'era', dados: { categoria: 'cultura', evento: `${p.pais}:${l.id}` } } });
}

/* ------------------------------------------------------------------ O ano */

/** O ano histórico de uma vida num país com pacote (não o Brasil). Devolve false se o país não tem pacote. */
export function processarEraNoPais(v: Vida, pais: string, ec: AnoEconomico, comum: (v: Vida) => void): boolean {
  const p = pacoteDaEra(pais);
  if (!p || !v.era) return false;
  const lado = ladoHistoricoCorrente();
  const tFim = v.t, tIni = v.t - 12;
  if (anoDe(tIni) <= 2025) {
    economiaDoPais(v, p, ec);
    trocasDeMoeda(v, p, tIni, tFim, lado);
    acontecimentos(v, p, tIni, tFim, lado);
  }
  devolverCongelado(v, p, tFim, lado);
  regrasDoAno(v, pais, lado);
  sociedadeDoAno(v, pais, lado); // ERAS v4
  guerrasDoAno(v, pais, lado);
  estudoDaEpoca(v, pais);
  comum(v);
  lembranca(v, p, lado);
  return true;
}

/** Para a tela: o mês por extenso. */
export const mesExtenso = (t: number) => `${MESES[mesDe(t)]} de ${anoDe(t)}`;
