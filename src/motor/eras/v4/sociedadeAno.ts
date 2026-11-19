/**
 * ERAS v4 · O ANO DA SOCIEDADE — o que a época faz com esta vida, e o que esta vida faz com a época.
 *
 * Uma vez por ano, numa vida histórica (Brasil e países com pacote), na ordem:
 *   1. o ENCONTRO com a barreira, quando ela pesa na vida de verdade (o emprego que a pessoa tem, a faculdade na idade
 *      de entrar, a política em que está, o salário do primeiro emprego) — uma vez cada, com a saída que existia;
 *   2. a BARREIRA DO CASAMENTO: a mulher que se casa e trabalha onde a regra mandava sair perde o posto;
 *   3. o PARTIDO PROIBIDO: quem estava filiado a um partido posto na ilegalidade perde a filiação;
 *   4. os MOVIMENTOS: a pressão que não é renovada esfria; perto da data real e muito alta, a pressão antecipa a reforma
 *      (pouco: uma pessoa comum não muda o país sozinha); a organização local pode conquistar a escola ou a água da cidade;
 *   5. a CONTESTAÇÃO: a reforma aprovada muito à frente do tempo pode ser derrubada nos anos seguintes (a Suprema Corte,
 *      a legislatura seguinte, o golpe) — tanto mais quanto maior a oposição e a antecipação;
 *   6. a HERANÇA: quem continua a vida (o filho, a neta) cresce no mundo que a família mudou, e a vida conta isso uma vez.
 * Todo sorteio é derivado (`rngDe`): nada gasta o acaso da vida.
 */
import type { Vida } from '../../tipos';
import { rngDe } from '../../rng';
import { anoDe } from '../../tempo';
import { escrever, idade } from '../../nucleo';
import { municipio } from '../../dados/lugares';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { encerrarEmprego } from '../../sistemas/trabalho';
import { mundoDe } from '../../v14/mundo/mundo14';
import type { LadoDaDivisao } from '../base/pacote';
import { paisHistoricoCorrente } from '../base/moedas';
import {
  barreirasQuePesam, garantirHistoria, noAlvo, sociedadeDoPais, reformaPorId, movimentosAtivos, partidoDaEpoca,
  proscritoNoAno, quandoValeAReforma, divisaoCorrente, fimDaBarreira, type PesoDaBarreira, type ReformaDaEpoca
} from '../base/sociedade4';
import './politica4';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** A primeira letra minúscula, sem mexer em sigla nem em nome próprio do começo ("O anúncio" → "o anúncio"; "Oxford" fica). */
const minuscula = (s: string) => (/^(O|A|Os|As|Um|Uma|Pela|Pelo|Pelas|Pelos|Na|No|Nas|Nos|Recusar|Escolas|Muitas|Muito|Banco|Quem|Com|Sem|Taxa|Depois|Antes|Até|Para|Pagar|Comprar|Com)\b/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const NATUREZA = { lei: 'Era a lei.', instituicao: 'Não era lei: era a regra da instituição.', costume: 'Não era proibido: era o costume — e ninguém precisava explicar.' } as const;

/* ------------------------------------------------------------------ 1–2. O encontro com a barreira e a barreira do casamento */

function encontrar(v: Vida, p: PesoDaBarreira, contexto: string): void {
  const h = garantirHistoria(v);
  const b = p.barreira;
  if (h.encontros.includes(b.id)) return;
  h.encontros.push(b.id);
  // O que já caiu (a lei, a regra) fica no passado; o que sobra é o costume — a frase diz isso, sem fingir que a regra vale.
  const fim = fimDaBarreira(b, paisHistoricoCorrente(), h, divisaoCorrente(), v.moradia.municipioId, v.t);
  const corpo = p.residual
    ? `Até ${fim !== undefined ? anoDe(fim) : b.ate}, ${minuscula(b.texto)} A regra caiu; o costume, ainda não — e ele pesou na sua vez.`
    : `${contexto ? minuscula(b.texto) : b.texto} ${NATUREZA[b.natureza]}${b.alternativa ? ` ${b.alternativa}` : ''}`;
  const texto = `${p.residual ? (contexto ? cap(contexto.replace(/: $/, '. ')) : '') : contexto}${corpo}`;
  escrever(v, { texto, relevancia: 'biografia', tema: b.dominio === 'estudo' ? 'estudo' : b.dominio === 'credito' || b.dominio === 'salario' ? 'dinheiro' : 'trabalho', tom: 'ruim', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: `barreira:${b.id}` } } });
}

function encontrosDoAno(v: Vida): void {
  const i = idade(v);
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  // O trabalho que a pessoa TEM: a regra do casamento (sair do posto) e o costume (a promoção que não vem).
  for (const p of barreirasQuePesam(v, 'trabalho')) {
    const b = p.barreira;
    if (oc && noAlvo(b.alvo, oc)) {
      if (b.quem === 'mulher_casada' && (p.bloqueia || p.fator <= 0.35) && rngDe(v.id, 'v4-casamento', b.id, anoDe(v.t)).chance(p.bloqueia ? 1 : 1 - p.fator)) {
        encontrar(v, p, 'Depois do casamento, veio o aviso: ');
        encerrarEmprego(v, 'a regra do casamento');
        escrever(v, { texto: `Deixou o posto de ${oc.nome[v.eu.genero === 'feminino' ? 1 : 0]}: a mulher casada não ficava.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: `demissao_casamento:${b.id}` } } });
        return;
      }
      if (b.quem === 'fichado' && p.bloqueia && oc.concurso) {
        encontrar(v, p, 'O órgão de informação chegou à repartição: ');
        encerrarEmprego(v, 'afastado pelo regime');
        return;
      }
      if (!p.bloqueia && p.fator < 0.8 && i >= 18) encontrar(v, p, '');
    }
  }
  // A faculdade na idade de entrar (ou a vontade de entrar): a porta e a chance da época.
  if (i >= 17 && i <= 20 && !v.educacao.concluidos.some(c => c.nivel === 'superior')) {
    const p = barreirasQuePesam(v, 'estudo').find(x => x.bloqueia || x.fator < 0.8);
    if (p) encontrar(v, p, i === 17 ? 'Na hora de pensar na faculdade: ' : '');
  }
  // O salário do primeiro emprego deste ano.
  if (e && e.tInicio > v.t - 12 && oc) {
    const p = barreirasQuePesam(v, 'salario').find(x => noAlvo(x.barreira.alvo, oc));
    if (p) encontrar(v, p, '');
  }
  // A política em que a pessoa está.
  if (v.caminhos.politica && v.caminhos.politica.fase !== 'encerrada') {
    const p = barreirasQuePesam(v, 'politica')[0];
    if (p) encontrar(v, p, '');
  }
}

/* ------------------------------------------------------------------ 3. O partido proibido */

function partidoProibido(v: Vida): void {
  const pol = v.caminhos.politica;
  if (!pol?.partido) return;
  const p = partidoDaEpoca(pol.partido);
  if (!p || !proscritoNoAno(p, anoDe(v.t))) return;
  const antes = pol.partido;
  pol.partido = undefined;
  const h = garantirHistoria(v);
  if (!h.encontros.includes(`proscrito:${antes}:${anoDe(v.t)}`)) h.encontros.push(`proscrito:${antes}:${anoDe(v.t)}`);
  escrever(v, { texto: `${cap(p.artigo)} ${p.chamado} foi posto na ilegalidade: a filiação acabou por decreto. Quem continuasse, continuaria na clandestinidade.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', fato: { tipo: 'era', dados: { categoria: 'politica', evento: `proscricao:${antes}` } } });
}

/* ------------------------------------------------------------------ 4. Os movimentos */

function movimentosDoAno(v: Vida, pais: string): void {
  const h = v.era?.historia;
  if (!h) return;
  const ano = anoDe(v.t);
  const ativos = new Set(movimentosAtivos(pais, ano).map(m => m.id));
  for (const [id, x] of Object.entries(h.movimentos)) {
    x.anos += 1;
    // O movimento que acabou (a vitória, a derrota, o regime que o fechou): a vida guarda.
    if (!ativos.has(id)) {
      const m = sociedadeDoPais(pais)?.movimentos.find(y => y.id === id);
      delete h.movimentos[id];
      if (m) escrever(v, { texto: `${m.nome} chegou ao fim de um ciclo. Você esteve lá ${x.anos >= 2 ? `por ${x.anos} anos` : 'quando importava'}.`, relevancia: 'cotidiano', tema: 'escolha', fato: { tipo: 'era', dados: { categoria: 'sociedade', evento: `mov_fim:${id}` } } });
    }
  }
  for (const id of Object.keys(h.pressao)) {
    const agiu = v.anoAtual.acoes.includes(`mov4:${id}`) || (h.movimentos[id]?.ultimo ?? -1) > v.t - 12;
    if (!agiu) h.pressao[id] = Math.round(h.pressao[id] * 0.85 * 10) / 10;
    if (h.pressao[id] < 1) delete h.pressao[id];
  }
  // A pressão antecipa a reforma — pouco, e só perto da hora (nacional) ou no lugar (a cidade).
  for (const m of sociedadeDoPais(pais)?.movimentos ?? []) {
    const pr = h.pressao[m.id] ?? 0;
    if (pr < 60 || !ativos.has(m.id)) continue;
    for (const rid of m.reformas) {
      const r = reformaPorId(pais, rid);
      if (!r) continue;
      const q = quandoValeAReforma(r, pais);
      if (q !== undefined && v.t >= q) continue;
      const rng = rngDe(v.id, 'v4-pressao', r.id, ano);
      if (r.alcance === 'nacional' && r.real) {
        const faltam = r.real[0] - ano;
        if (faltam < 1 || faltam > 3 || !rng.chance(0.12 * (pr / 100))) continue;
        registrar(v, r, 'movimento', faltam, m.nome);
      } else if (r.alcance === 'municipal' && h.movimentos[m.id]?.papel === 'organizacao' && rng.chance(0.1 * (pr / 100))) {
        registrar(v, r, 'movimento', undefined, m.nome);
      }
    }
  }
}

function registrar(v: Vida, r: ReformaDaEpoca, por: 'voce' | 'movimento', antes: number | undefined, quem: string): void {
  const h = garantirHistoria(v);
  const mu = municipio(v.moradia.municipioId);
  h.alteracoes.push({ reforma: r.id, pais: paisHistoricoCorrente(), t: v.t, alcance: r.alcance, ...(r.alcance === 'estadual' ? { divisao: divisaoCorrente() ?? mu.uf } : r.alcance === 'municipal' ? { municipioId: v.moradia.municipioId } : {}), por, autor: quem, ...(antes !== undefined ? { antes } : {}) });
  const quando = antes ? ` — ${antes} ${antes === 1 ? 'ano' : 'anos'} antes do que a história registrou` : '';
  escrever(v, { texto: `A pressão de ${quem.toLowerCase()} venceu: ${r.texto}${quando}. Você estava entre os que fizeram isso acontecer.`, relevancia: 'marco', tema: 'escolha', tom: 'bom', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: `conquista:${r.id}` } } });
  const ano = anoDe(v.t);
  mundoDe(v).eventos.push({ id: `${ano}:v4_${r.id}_${v.t}`, ano, tipo: 'sociedade', escopo: r.alcance === 'nacional' ? 'pais' : 'regiao', titulo: r.nome, texto: `${cap(r.texto)}${quando}.`, real: false, ...(r.alcance !== 'nacional' ? { lugar: mu.uf } : {}) });
}

/* ------------------------------------------------------------------ 5. A contestação */

function contestar(v: Vida, pais: string): void {
  const h = v.era?.historia;
  if (!h) return;
  for (const a of h.alteracoes) {
    if (a.revogadaEm !== undefined || a.pais !== pais || !a.antes || a.antes < 5) continue;
    const anos = (v.t - a.t) / 12;
    if (anos <= 0 || anos > 6) continue;
    const r = reformaPorId(pais, a.reforma);
    if (!r) continue;
    const chance = 0.05 * r.resistencia * Math.min(2.5, a.antes / 8);
    if (!rngDe(v.id, 'v4-contesta', a.reforma, a.t, Math.floor(anos)).chance(chance)) continue;
    a.revogadaEm = v.t;
    a.porQue = a.alcance === 'nacional' ? 'a Corte Suprema e a maioria seguinte' : a.alcance === 'estadual' ? 'a legislatura seguinte' : 'a câmara seguinte';
    const quem = a.por === 'voce' && a.autor === v.eu.nome ? 'a sua reforma' : `a reforma de ${anoDe(a.t)}`;
    escrever(v, { texto: `${cap(quem)} (${r.nome.toLowerCase()}) foi derrubada por ${a.porQue}: ${r.oposicao} não tinha desistido. Até a data em que a história a trouxe de volta, valeu a regra antiga.`, relevancia: 'biografia', tema: 'lugar', tom: 'ruim', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: `revogada:${r.id}` } } });
    const ano = anoDe(v.t);
    mundoDe(v).eventos.push({ id: `${ano}:v4_rev_${r.id}_${v.t}`, ano, tipo: 'sociedade', escopo: a.alcance === 'nacional' ? 'pais' : 'regiao', titulo: `Derrubada: ${r.nome}`, texto: `Derrubada por ${a.porQue}.`, real: false });
  }
}

/* ------------------------------------------------------------------ 6. A herança: o mundo que a família mudou */

function heranca(v: Vida): void {
  const h = v.era?.historia;
  if (!h?.alteracoes.length || idade(v) !== 16) return;
  const minhas = h.alteracoes.filter(a => a.revogadaEm === undefined && a.por === 'voce' && a.autor && a.autor !== v.eu.nome);
  if (!minhas.length || h.encontros.includes(`heranca:${v.eu.nome}`)) return;
  h.encontros.push(`heranca:${v.eu.nome}`);
  const a = minhas[0];
  const r = reformaPorId(a.pais, a.reforma);
  if (!r) return;
  escrever(v, { texto: `Na escola, contaram a história de ${r.nome.toLowerCase()} (${anoDe(a.t)}) — e o nome que apareceu foi o de ${a.autor}. A vida que você tem passa por ali.`, relevancia: 'biografia', tema: 'familia', tom: 'bom', fato: { tipo: 'era', dados: { categoria: 'direitos', evento: `heranca:${r.id}` } } });
}

/* ------------------------------------------------------------------ O ano */

export function sociedadeDoAno(v: Vida, pais: string, _lado: LadoDaDivisao): void {
  if (!v.era || anoDe(v.t) > 2026) return;
  if (!sociedadeDoPais(pais)) return;
  encontrosDoAno(v);
  partidoProibido(v);
  movimentosDoAno(v, pais);
  contestar(v, pais);
  heranca(v);
}

/**
 * A notícia real de uma reforma que, nesta continuidade, já tinha vindo antes (no lugar): a frase que a acompanha na vida.
 * "No seu estado, a lei já valia desde 1958." Vida sem história alterada: ''.
 */
export function notaDaHistoriaAlternativa(v: Vida, pais: string, acontecimentoId: string): string {
  const h = v.era?.historia;
  if (!h?.alteracoes.length) return '';
  for (const r of sociedadeDoPais(pais)?.reformas ?? []) {
    if (!r.acontecimentos?.includes(acontecimentoId)) continue;
    const a = h.alteracoes.filter(x => x.reforma === r.id && x.revogadaEm === undefined && x.t < v.t).sort((x, y) => x.t - y.t)[0];
    if (!a) continue;
    const onde = a.alcance === 'nacional' ? 'No país' : a.alcance === 'estadual' ? 'No seu estado' : 'Na sua cidade';
    return ` ${onde}, isso já valia desde ${anoDe(a.t)}${a.autor ? ` — pela mão de ${a.autor === v.eu.nome ? 'você' : a.autor}` : ''}.`;
  }
  return '';
}
