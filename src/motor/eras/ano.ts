/**
 * ERAS HISTÓRICAS · O ANO HISTÓRICO — o que a época faz com uma vida, ano a ano.
 *
 * Chamado pelo ano (`ano.viverAno`) logo depois de a economia andar e ANTES do mundo (`v14/mundo`), só para vidas com
 * `v.era`. O ano da vida vai do aniversário anterior ao de agora: tudo o que tem data (troca de moeda, plano econômico,
 * acontecimento) cai na janela (t-12, t] e é escrito no MÊS em que aconteceu.
 *
 *   1. A economia segue a série real (até dez/2025): a fase sai do PIB do IBGE e a inflação do IPCA. Na hiperinflação,
 *      a perda do dinheiro parado é limitada (APROXIMAÇÃO: as famílias guardavam na poupança e no overnight, com
 *      correção monetária; a perda real do jogo fica entre 25% e 40% ao ano, não os 95% do IPCA de 1989).
 *   2. As trocas de moeda: só a tela muda (`eras/base/moedas`); a biografia conta quanto o saldo virou.
 *   3. O Plano Collor: o que passava de NCz$ 50 mil fica retido e volta em doze parcelas a partir de setembro de 1991
 *      (APROXIMAÇÃO: devolvido com o mesmo poder de compra; a correção oficial da época perdeu para a inflação).
 *   4. Os acontecimentos brasileiros (`eras/dados/acontecimentosBR`): entram na linha do tempo do mundo (os efeitos no
 *      trabalho e nas vendas são os de `v14/mundo`) e, para quem tem idade e está no lugar, viram lembrança.
 *   5. As chegadas de tecnologia em casa e uma lembrança cultural do ano (sorteio derivado: nada gasta o acaso da vida).
 */

import type { Vida } from '../tipos';
import type { AnoEconomico } from '../sistemas/economia';
import { rngDe } from '../rng';
import { anoDe, mesDe, tDe, MESES } from '../tempo';
import { escrever, idade } from '../nucleo';
import { municipio } from '../dados/lugares';
import { mundoDe } from '../v14/mundo/mundo14';
import { lancar } from '../sistemas/extrato';
import { fatorNominal, FIM_DA_SERIE, ipcaDoAno, padraoEm, PADROES_MONETARIOS_BR, nivelDePrecos } from './base/moedas';
import { nivelEconomico, temAcesso, tecnologia, paisDaEpoca } from './base/contexto';
import { processarEraNoPais, regrasDoAno, guerrasDoAno } from './v3/anoPais';
import { ACONTECIMENTOS_BR, ESPORTE_MUNDIAL_BR, PIB_BR, type AcontecimentoBR } from './dados/acontecimentosBR';

const TODOS = [...ACONTECIMENTOS_BR, ...ESPORTE_MUNDIAL_BR].sort((a, b) => a.data[0] * 12 + a.data[1] - (b.data[0] * 12 + b.data[1]));
import { CHEGADAS, LEMBRANCAS_CULTURAIS } from './dados/culturaBR';
import { FERRAMENTAS } from './base/profissoes';
import { PARTIDO_NO_TEMPO, sucessorNoMes, mesDaMudanca } from './base/partidos';
import type { EventoMundial14, TipoEventoMundial } from '../dados14/mundo/tipos';
import type { FaseEconomica } from '../tipos';

const visto = (v: Vida, id: string) => (v.era!.vistos ??= []).includes(id);
const marcar = (v: Vida, id: string) => { (v.era!.vistos ??= []).push(id); };

/** O nominal de um valor do motor no mês `t`, na moeda de então ("Cz$ 1.234"). */
export function nominalEm(valor: number, t: number): string {
  const p = padraoEm(t);
  const n = Math.round(valor * fatorNominal(t));
  return `${p.simbolo} ${n.toLocaleString('pt-BR')}`;
}

/* ------------------------------------------------------------------ 1. A economia */

/** A inflação que o motor aplica ao dinheiro parado, a partir do IPCA real (ver o cabeçalho). */
export function inflacaoEfetiva(ipca: number): number {
  if (ipca <= 0.25) return ipca;
  return Math.min(0.4, 0.25 + 0.05 * Math.log(ipca / 0.25));
}

export function faseDoPib(pib: number, anterior: FaseEconomica | undefined): FaseEconomica {
  if (pib < 0) return 'crise';
  if (anterior === 'crise') return 'recuperacao';
  if (pib >= 4) return 'expansao';
  if (pib < 1.5) return 'desaceleracao';
  return 'normal';
}

function economiaHistorica(v: Vida, ec: AnoEconomico): void {
  const ano = anoDe(v.t);
  const ipca = ipcaDoAno(ano), pib = PIB_BR[ano];
  if (ipca === undefined || pib === undefined || !v.economia) return;
  const e = v.economia;
  const h = e.historico[e.historico.length - 1];
  const anteriorFase = e.historico.length > 1 ? e.historico[e.historico.length - 2].fase : undefined;
  const fase = faseDoPib(pib, anteriorFase);
  const efetiva = inflacaoEfetiva(ipca);
  // Desfaz a inflação sorteada e põe a da série.
  e.precos = e.precos / (1 + e.inflacao) * (1 + efetiva);
  e.inflacao = efetiva;
  if (fase !== e.fase) { e.fase = fase; e.tFase = v.t; ec.virou = true; }
  ec.fase = fase;
  ec.inflacao = efetiva;
  if (h && h.ano === ano) { h.fase = fase; h.inflacao = Math.round(efetiva * 10000) / 10000; }
}

/* ------------------------------------------------------------------ 2. As trocas de moeda */

function trocasDeMoeda(v: Vida, tIni: number, tFim: number): void {
  for (const p of PADROES_MONETARIOS_BR) {
    if (!(p.desde > tIni && p.desde <= tFim) || visto(v, `moeda:${p.id}`)) continue;
    marcar(v, `moeda:${p.id}`);
    const anterior = padraoEm(p.desde - 1);
    const saldo = Math.max(0, v.financas.conta);
    const antes = Math.round(saldo * nivelDePrecos(p.desde) * anterior.porReal);
    const depois = Math.round(saldo * nivelDePrecos(p.desde) * p.porReal);
    const i = idade(v);
    const fala = i < 10
      ? `Os adultos passaram semanas falando do dinheiro novo: em ${p.dataOficial}, o ${anterior.nome} virou ${p.nome} (${p.troca}).`
      : `Em ${p.dataOficial}, o ${anterior.nome} deu lugar ao ${p.nome} (${p.troca}). As notas antigas ainda circularam um tempo, carimbadas ou não, e os preços passaram a vir nas duas moedas.`;
    const conta = i >= 14 && saldo > 0 ? ` O que você tinha guardado, ${anterior.simbolo} ${antes.toLocaleString('pt-BR')}, virou ${p.simbolo} ${depois.toLocaleString('pt-BR')} — o mesmo dinheiro, com outros zeros.` : '';
    escrever(v, { t: p.desde, texto: fala + conta, relevancia: p.id === 'real' || p.id === 'cruzado' ? 'biografia' : 'cotidiano', tema: 'dinheiro', fato: { tipo: 'era', dados: { categoria: 'moeda', evento: p.id } } });
  }
}

/* ------------------------------------------------------------------ 3. O Plano Collor */

/** O limite de saque (NCz$ 50.000) em unidades do motor, em março de 1990. */
export const LIMITE_COLLOR = () => 50_000 / fatorNominal(tDe(1990, 2));
const VOLTA_COLLOR = tDe(1991, 8);

function aplicarCollor(v: Vida, t: number): string {
  const conta = v.financas.conta;
  const limite = LIMITE_COLLOR();
  if (conta <= limite) return idade(v) >= 18 ? ' O seu dinheiro cabia no limite: ficou tudo na conta.' : '';
  const retido = Math.round(conta - limite);
  v.financas.conta -= retido;
  v.era!.retido = { valor: retido, tVolta: VOLTA_COLLOR, parcelas: 12 };
  lancar(v, 'Retido pelo Plano Collor', 'acontecimento', -retido);
  return ` Da sua conta, ${nominalEm(retido, t)} ficaram presos no Banco Central; sobraram ${nominalEm(limite, t)} para o dia a dia.`;
}

function devolverCollor(v: Vida, tFim: number): void {
  const r = v.era?.retido;
  if (!r || r.parcelas <= 0) return;
  // Parcelas mensais a partir de setembro de 1991: quantas couberam até o mês de agora.
  const pagas = 12 - r.parcelas;
  const devidas = Math.min(12, Math.max(0, tFim - r.tVolta + 1));
  const agora = devidas - pagas;
  if (agora <= 0) return;
  const porParcela = r.valor / 12;
  const valor = Math.round(porParcela * agora);
  v.financas.conta += valor;
  r.parcelas -= agora;
  lancar(v, 'Devolução do dinheiro retido (Plano Collor)', 'acontecimento', valor);
  escrever(v, { texto: r.parcelas <= 0
    ? `Caiu na conta a última parcela do dinheiro retido em 1990. Tudo somado, ${nominalEm(r.valor, tFim)} em valores de hoje voltaram — mas o ano e meio sem ele não volta.`
    : `Começou a devolução do dinheiro retido pelo Plano Collor, em parcelas: ${nominalEm(valor, tFim)} até agora.`, relevancia: r.parcelas <= 0 ? 'cotidiano' : 'biografia', tema: 'dinheiro', fato: { tipo: 'era', dados: { categoria: 'economia', evento: 'collor_volta' } } });
  if (r.parcelas <= 0) delete v.era!.retido;
}

/* ------------------------------------------------------------------ 4. Os acontecimentos */

const TIPO: Record<AcontecimentoBR['categoria'], TipoEventoMundial> = {
  politica: 'politica', economia: 'economia', sociedade: 'sociedade', direitos: 'sociedade', esporte: 'esporte', cultura: 'cultura', desastre: 'desastre', saude: 'pandemia', tecnologia: 'tecnologia'
};

/** O acontecimento é do lugar de quem vive (nacional, ou o estado de casa). */
export function ehDoLugar(v: Vida, a: AcontecimentoBR): boolean {
  if (!a.ufs) return true;
  const m = municipio(v.moradia.municipioId);
  return m.pais === 'BR' && !!m.uf && a.ufs.includes(m.uf);
}

/** Como a notícia chega, pela época, pela idade e pelo aparelho que a pessoa tem (a moldura da lembrança). */
function comoChegou(v: Vida, a: AcontecimentoBR, ano: number): string {
  const i = idade(v);
  if (i < 12) {
    if (a.id === 'tetra' || a.id === 'penta' || a.id === 'copa_1970') return 'Você era criança e lembra da rua inteira em festa, buzina e bandeira na janela. ';
    if (a.id === 'senna' || a.categoria === 'desastre') return 'Você era criança, mas lembra do silêncio dos adultos diante da televisão. ';
    if (a.categoria === 'esporte') return 'Você era criança e lembra da televisão ligada o dia inteiro. ';
    return 'Você era criança, mas lembra dos adultos falando disso na sala. ';
  }
  if (a.ufs) return '';
  // ERAS v3: antes da televisão em casa, o rádio; antes do rádio, o jornal e a conversa.
  if (ano < 1995 && !temAcesso(v, 'tv', ano)) return temAcesso(v, 'radio', ano) ? 'O rádio deu a notícia, e o jornal do dia seguinte contou o resto. ' : 'A notícia correu pelos jornais e de boca em boca. ';
  if (ano < 1995) return 'Na televisão e no rádio, só se falava nisso. ';
  if (temAcesso(v, 'smartphone', ano)) return 'A notícia chegou primeiro pelo celular. ';
  return 'Saiu em todos os jornais e telejornais. ';
}

function auxilio(v: Vida): string {
  if (idade(v) < 18) return '';
  const formal = v.trabalho.atual && ['clt', 'servidor', 'militar', 'eletivo'].includes(v.trabalho.atual.contrato);
  if (formal || nivelEconomico(v) > 1) return '';
  // Lei 13.982/2020: R$ 600 de abril a agosto (cinco parcelas); MP 1.000/2020: R$ 300 de setembro a dezembro.
  const mes = (m: number) => tDe(2020, m);
  let total = 0;
  for (let m = 3; m <= 7; m++) total += 600 / nivelDePrecos(mes(m));
  for (let m = 8; m <= 11; m++) total += 300 / nivelDePrecos(mes(m));
  const valor = Math.round(total);
  v.financas.conta += valor;
  lancar(v, 'Auxílio emergencial', 'renda', valor);
  return ' Sem carteira assinada, você recebeu o auxílio: cinco parcelas de R$ 600 e quatro de R$ 300.';
}

function acontecimentos(v: Vida, tIni: number, tFim: number): void {
  const m = mundoDe(v);
  for (const a of TODOS) {
    const t = tDe(a.data[0], a.data[1] - 1);
    if (!(t > tIni && t <= tFim) || visto(v, `ac:${a.id}`)) continue;
    marcar(v, `ac:${a.id}`);
    const ano = a.data[0];
    const local = ehDoLugar(v, a);
    // Na linha do tempo do mundo (Você → No mundo): todos os nacionais e os regionais de casa; os efeitos só valem onde é local.
    if (local) {
      const ev: EventoMundial14 = { id: `${ano}:br_${a.id}`, ano, tipo: TIPO[a.categoria], escopo: a.ufs ? 'regiao' : 'pais', titulo: a.titulo, texto: a.fato, real: true, ...(a.mods ? { mods: a.mods, ate: ano + (a.dura ?? 0) } : {}), ...(a.efeito && a.mods ? { efeito: a.efeito } : {}) };
      if (a.ufs) ev.lugar = municipio(v.moradia.municipioId).uf;
      m.eventos.push(ev);
    }
    if (!local) continue;
    // A lembrança: a idade decide se é da pessoa ou se ela só ouviu falar (e quem é muito pequeno não guarda).
    const i = Math.floor((t - v.eu.tNasc) / 12);
    // Abaixo da idade do acontecimento, ele fica só na linha do tempo do mundo: a criança pequena não guarda uma lei.
    if (i < (a.idadeMin ?? 7)) continue;
    let pessoal = '';
    if (a.especial === 'collor' && i >= 10) pessoal = aplicarCollor(v, t);
    if (a.especial === 'auxilio') pessoal = auxilio(v);
    if (a.especial === 'apagao') pessoal = ' Em casa, a conta de luz virou assunto toda semana.';
    if (a.especial === 'covid_br') pessoal = i < 18 ? ' A escola fechou; as aulas, quando houve, foram por uma tela.' : v.trabalho.atual ? ' O trabalho mudou de um dia para o outro.' : '';
    const efeito = a.efeito && a.mods ? ` ${a.efeito}` : '';
    const peso = a.peso === 'biografia' ? 'biografia' : 'cotidiano';
    escrever(v, { t, texto: `${comoChegou(v, a, ano)}${a.fato}${efeito}${pessoal}`, relevancia: peso, tema: a.categoria === 'economia' ? 'dinheiro' : a.categoria === 'saude' ? 'saude' : 'lugar', tom: a.categoria === 'desastre' ? 'ruim' : a.id === 'tetra' || a.id === 'penta' || a.id === 'copa_1970' || a.id.startsWith('jogos_') ? 'bom' : 'neutro', fato: { tipo: 'era', dados: { categoria: a.categoria, evento: a.id } } });
  }
}

/* ------------------------------------------------------------------ 5. Tecnologia e cultura */

function chegadas(v: Vida): void {
  const i = idade(v);
  for (const c of CHEGADAS) {
    if (i < c.idade || visto(v, `tec:${c.tec}`)) continue;
    if (tecnologia(v, c.tec) === 'indisponivel') continue;
    marcar(v, `tec:${c.tec}`);
    // Quem nasceu com a coisa já em casa não "ganhou" a coisa: só conta a chegada que a pessoa viu.
    if (anoDe(v.eu.tNasc) + c.idade > anoDe(v.t) - 1 && tecnologia(v, c.tec, anoDe(v.eu.tNasc) + 1) !== 'indisponivel') continue;
    // A internet que já chega rápida não foi discada: as duas chegadas viram uma só.
    if (c.tec === 'internet' && tecnologia(v, 'banda_larga') !== 'indisponivel') { marcar(v, 'tec:banda_larga'); escrever(v, { texto: 'A internet chegou em casa já rápida, ligada o tempo todo, sem ocupar o telefone. O computador da sala virou disputa.', relevancia: 'cotidiano', tema: 'casa', tom: 'bom', fato: { tipo: 'era', dados: { categoria: 'tecnologia', evento: 'internet' } } }); continue; }
    const depois = c.depois && anoDe(v.t) >= c.depois.ano ? c.depois.texto : undefined;
    escrever(v, { texto: depois ?? c.texto, relevancia: c.tec === 'smartphone' || c.tec === 'computador' || c.tec === 'celular' ? 'biografia' : 'cotidiano', tema: c.tema, tom: 'bom', fato: { tipo: 'era', dados: { categoria: 'tecnologia', evento: c.tec } } });
  }
}

function lembranca(v: Vida): void {
  const ano = anoDe(v.t), i = idade(v);
  const r = rngDe(v.id, 'era-cultura', ano);
  if (!r.chance(0.55)) return;
  const possiveis = LEMBRANCAS_CULTURAIS.filter(l => ano >= l.de && ano <= l.ate && i >= l.idade[0] && i <= l.idade[1] && !visto(v, `cult:${l.id}`) && (!l.exige || tecnologia(v, l.exige) !== 'indisponivel'));
  const l = r.pick(possiveis);
  if (!l) return;
  marcar(v, `cult:${l.id}`);
  escrever(v, { texto: l.texto, relevancia: 'cotidiano', tema: l.tipo === 'musica' || l.tipo === 'tv' || l.tipo === 'jogo' || l.tipo === 'cinema' || l.tipo === 'brincadeira' ? 'lazer' : 'lugar', tom: 'bom', fato: { tipo: 'era', dados: { categoria: 'cultura', evento: l.id } } });
}

/** O ofício na época: as ferramentas de trabalho de então (uma lembrança por fase da profissão). */
function oficio(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e) return;
  const ano = anoDe(v.t);
  const f = FERRAMENTAS.find(x => x.de.includes(e.ocupacaoId) && ano <= x.ate);
  if (!f) return;
  const k = `ofc:${f.de[0]}:${f.ate}`;
  if (visto(v, k)) return;
  marcar(v, k);
  escrever(v, { texto: f.texto, relevancia: 'cotidiano', tema: 'trabalho', fato: { tipo: 'era', dados: { categoria: 'trabalho', evento: k } } });
}

/* ------------------------------------------------------------------ 6. O partido muda (nome, fusão, incorporação) */

const COMO: Record<string, string> = { nome: 'mudou de nome', fusao: 'se fundiu com outro', incorporacao: 'foi incorporado por outro', extincao: 'foi extinto' };

/**
 * Quem está filiado a um partido que muda de nome, se funde ou é incorporado passa a constar no sucessor (Lei 9.096/1995,
 * art. 29: a filiação acompanha a fusão e a incorporação). A Linha da Vida conta, no mês da mudança.
 */
function partidoMuda(v: Vida, tFim: number): void {
  const p = v.caminhos.politica;
  if (!p?.partido || !PARTIDO_NO_TEMPO.has(p.partido)) return;
  const s = sucessorNoMes(p.partido, tFim);
  if (!s || s.id === p.partido) {
    if (!s && p.fase !== 'encerrada') {
      // Extinto sem sucessor (não há caso na lista atual): a filiação acaba.
      p.partido = undefined; p.tFiliacao = undefined;
    }
    return;
  }
  for (const passo of s.passos) {
    const novo = PARTIDO_NO_TEMPO.get(passo.vira!)!;
    const t = mesDaMudanca(passo) ?? tFim;
    const hist = p.partidos ??= [];
    const aberto = hist.find(h => h.sigla === passo.id && h.tFim === undefined);
    if (aberto) aberto.tFim = t;
    hist.push({ sigla: novo.id, tInicio: t });
    const verbo = COMO[passo.como ?? 'nome'];
    const texto = passo.como === 'nome'
      ? `O ${passo.sigla}, o seu partido, ${verbo}: passou a ser ${novo.artigo} ${novo.chamado} (${novo.nome}). A ficha de filiação seguiu a mesma.`
      : `O ${passo.sigla}, o seu partido, ${verbo}${passo.como === 'extincao' ? '' : ''}: a sua filiação passou para ${novo.artigo} ${novo.chamado} (${novo.nome}).`;
    escrever(v, { t: Math.min(t, tFim), texto, relevancia: 'cotidiano', tema: 'lugar', fato: { tipo: 'era', dados: { categoria: 'politica', evento: `partido:${passo.id}` } } });
  }
  p.partido = s.id;
}

/* ------------------------------------------------------------------ 7. A maioridade da época */

/**
 * Até o Código Civil de 2002 (em vigor em 11/01/2003), a maioridade civil era aos 21 (Código Civil de 1916, art. 9º); o
 * voto (16 facultativo desde 1988; 18 obrigatório), a habilitação e o trabalho já vinham antes. O jogo trata os 18 como a
 * idade adulta (simplificação documentada); a Linha da Vida conta a regra do tempo.
 */
function maioridade(v: Vida): void {
  const i = idade(v), ano = anoDe(v.t);
  if (i === 18 && ano < 2003 && !visto(v, 'lei:maioridade18')) {
    marcar(v, 'lei:maioridade18');
    escrever(v, { texto: 'Dezoito anos: já dava para votar, tirar carteira de motorista e responder pelos próprios atos. Mas, pela lei da época, a maioridade civil era aos 21 — assinar contrato ou casar sem a autorização dos pais, só depois.', relevancia: 'cotidiano', tema: 'escolha', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: 'maioridade18' } } });
  }
  if (i === 21 && ano <= 2003 && ano >= 1900 && !visto(v, 'lei:maioridade21')) {
    marcar(v, 'lei:maioridade21');
    escrever(v, { texto: ano < 2003 ? 'Vinte e um anos: a maioridade civil, pela lei da época. Dali em diante, a assinatura bastava sozinha.' : 'Vinte e um anos — e, com o Código Civil novo, a maioridade já tinha chegado aos 18.', relevancia: 'cotidiano', tema: 'escolha', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: 'maioridade21' } } });
  }
}

/* ------------------------------------------------------------------ O ano */

export function processarEra(v: Vida, ec: AnoEconomico): void {
  if (!v.era) return;
  // ERAS v3: um país com pacote de época tem o seu ano (`v3/anoPais`); as partes comuns (o ofício, as chegadas de
  // tecnologia em casa) são as mesmas. O Brasil segue abaixo, como na v1/v2, mais as regras sociais e as guerras.
  const pais = paisDaEpoca(v);
  if (pais !== 'BR' && processarEraNoPais(v, pais, ec, x => { chegadas(x); oficio(x); })) return;
  const tFim = v.t, tIni = v.t - 12;
  if (tIni <= FIM_DA_SERIE + 12) {
    economiaHistorica(v, ec);
    trocasDeMoeda(v, tIni, tFim);
    acontecimentos(v, tIni, tFim);
  }
  devolverCollor(v, tFim);
  partidoMuda(v, tFim);
  maioridade(v);
  regrasDoAno(v, 'BR', 'oeste');
  guerrasDoAno(v, 'BR', 'oeste');
  chegadas(v);
  oficio(v);
  if (anoDe(v.t) <= 2025) lembranca(v);
}

/** Para a tela: o mês por extenso ("março de 1986"). */
export const mesPorExtenso = (t: number) => `${MESES[mesDe(t)]} de ${anoDe(t)}`;
