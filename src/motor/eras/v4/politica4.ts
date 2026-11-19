/**
 * ERAS v4 · MUDAR A HISTÓRIA PELO CARGO — as reformas que um mandato pode propor numa vida histórica.
 *
 * Cada cargo propõe só o que é da competência dele: o vereador e o prefeito, o que é da cidade (escola, água, posto de
 * saúde); o deputado estadual e o governador, o que é do estado (a matrícula de mulheres nas universidades alemãs do
 * Império, o fim da segregação num estado do Sul dos EUA); o deputado federal, o senador e o presidente, as leis do país
 * (o voto das mulheres, a Lei dos Direitos Civis, o Estatuto da Mulher Casada). Ninguém muda sozinho a Constituição: a
 * proposta passa (ou não) pela casa, pelo governo, pela oposição.
 *
 * A chance vem do estado da vida política (a aprovação, a base, a liderança, o desgaste), da pressão dos movimentos que
 * lutam pela mesma causa (`movimentos4`), da força da oposição da época e da MATURIDADE histórica: propor o voto feminino
 * cinco anos antes de ele acontecer é difícil; trinta anos antes, quase impossível. O que passa entra na história desta
 * continuidade (`v.era.historia`), no alcance do cargo, e fica — para os filhos e os netos. O que passa muito à frente do
 * tempo cobra: a aprovação cai entre os que eram contra, o desgaste sobe, e a reforma pode ser derrubada depois
 * (`sociedadeAno.contestar`).
 *
 * Registra os ganchos em `sistemas/politica` ao carregar (o pacote do motor da época está acima dele: sem ciclo).
 */
import type { Rng } from '../../rng';
import { clamp } from '../../rng';
import type { CargoEletivo, Vida } from '../../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { escrever } from '../../nucleo';
import { anoDe } from '../../tempo';
import { municipio } from '../../dados/lugares';
import { REFORMAS_DA_EPOCA, nomeCargo, registrarNoMandato, type SaidaPolitica } from '../../sistemas/politica';
import { desgastar } from '../../sistemas/desgastePolitico';
import { habilidade } from '../../sistemas/frentes';
import { marcar } from '../../sistemas/marcas';
import type { AcaoProfissional } from '../../sistemas/profissao';
import { mundoDe } from '../../v14/mundo/mundo14';
import { paisHistoricoCorrente, mesHistoricoCorrente, ladoHistoricoCorrente } from '../base/moedas';
import { regrasDoPais, regraValeEm } from '../base/sociedade';
import {
  barreirasQuePesam, garantirHistoria, reformasPendentes, sociedadeDoPais, divisaoCorrente,
  type AlcanceDaReforma, type ReformaDaEpoca
} from '../base/sociedade4';

/** O alcance do que o cargo pode mudar. */
export function alcanceDoCargo(c: CargoEletivo): AlcanceDaReforma {
  return c === 'vereador' || c === 'prefeito' ? 'municipal' : c === 'deputado_estadual' || c === 'governador' ? 'estadual' : 'nacional';
}

/** A força do cargo para fazer uma proposta virar lei (o Executivo manda o projeto e tem a máquina; o legislador, um voto). [A] */
const FORCA_DO_CARGO: Record<CargoEletivo, number> = {
  vereador: 0.32, prefeito: 0.55, deputado_estadual: 0.28, governador: 0.48, deputado_federal: 0.2, senador: 0.26, presidente: 0.5
};

/** As reformas que ESTE mandato pode propor agora (vida histórica, até 2025), as mais urgentes primeiro. */
export function reformasDoMandato(v: Vida): ReformaDaEpoca[] {
  const m = v.caminhos.politica?.mandato;
  if (!m || !v.era || mesHistoricoCorrente() === null || anoDe(v.t) > 2025) return [];
  const pais = paisHistoricoCorrente();
  const alcance = alcanceDoCargo(m.cargo);
  const ano = anoDe(v.t);
  const pesam = new Set([...barreirasQuePesam(v, 'trabalho'), ...barreirasQuePesam(v, 'estudo'), ...barreirasQuePesam(v, 'credito'), ...barreirasQuePesam(v, 'politica'), ...barreirasQuePesam(v, 'salario')].map(p => p.barreira.id));
  const lista = reformasPendentes(pais, v.t).filter(r => r.alcance === alcance);
  const urgencia = (r: ReformaDaEpoca) => (r.derruba.some(id => pesam.has(id)) ? 100 : 0) + (r.real ? Math.max(0, 40 - (r.real[0] - ano)) : 10);
  return lista.sort((a, b) => urgencia(b) - urgencia(a)).slice(0, 3);
}

/** A pressão dos movimentos pela reforma (0..1): a da vida (você e quem você trouxe) e a da época (o movimento existir). */
export function pressaoPelaReforma(v: Vida, r: ReformaDaEpoca): number {
  const h = v.era?.historia;
  const pais = paisHistoricoCorrente();
  const ano = anoDe(v.t);
  let p = 0;
  for (const m of sociedadeDoPais(pais)?.movimentos ?? []) {
    if (!m.reformas.includes(r.id)) continue;
    if (ano >= m.de && ano < m.ate) p = Math.max(p, 0.08); // o movimento existe na rua
    p = Math.max(p, Math.min(1, (h?.pressao[m.id] ?? 0) / 100));
  }
  return p;
}

/** Quantos anos antes da data real (0 na hora ou depois; undefined: não aconteceu na história). */
export const anosAntes = (r: ReformaDaEpoca, ano: number) => (r.real ? Math.max(0, r.real[0] - ano) : undefined);

/** A chance de a proposta passar, com as partes (para a tela dizer por quê). */
/** O regime da época fecha a política (sem eleições livres, perseguição, censura do Estado)? */
export function regimeFechado(v: Vida): boolean {
  const ano = anoDe(v.t), lado = ladoHistoricoCorrente(), div = divisaoCorrente();
  return regrasDoPais(paisHistoricoCorrente()).some(g => ((g.tema === 'sem_eleicoes' && !g.cargos) || g.tema === 'perseguicao' || g.id === 'br_ai5' || g.id === 'jp_ordem_publica') && regraValeEm(g, ano, div, lado));
}

export function chanceDaReforma(v: Vida, r: ReformaDaEpoca): { chance: number; maturidade: number; pressao: number; apoio: number; regime: boolean } {
  const p = v.caminhos.politica!;
  const m = p.mandato!;
  const antes = anosAntes(r, anoDe(v.t));
  // A maturidade: a dez anos da data real, ~37%; a vinte, ~14%; uma reforma que a história não teve, um meio-termo. [A]
  const maturidade = antes === undefined ? 0.55 : antes === 0 ? 1 : Math.exp(-antes / 10);
  const pressao = pressaoPelaReforma(v, r);
  const apoio = clamp(0.5 + (m.aprovacao - 50) / 100 + p.apoio / 300 + habilidade(v, 'lideranca') / 400 - p.desgaste / 300, 0.15, 1.2);
  const base = FORCA_DO_CARGO[m.cargo] * apoio * (1 - r.resistencia * 0.6);
  // Sob um regime que fecha o Congresso, persegue ou censura, a casa vota o que o regime manda: quase nada passa. [A]
  const regime = regimeFechado(v) ? 0.15 : 1;
  const chance = clamp((base * (0.35 + 0.65 * maturidade) + pressao * 0.25 * maturidade) * regime, 0.02, 0.85);
  return { chance, maturidade, pressao, apoio, regime: regime < 1 };
}

const feitaNoAno = (v: Vida) => v.anoAtual.acoes.some(x => x.startsWith('reforma4:'));

export function disponibilidadeReforma(v: Vida, id?: string): Veredito {
  const m = v.caminhos.politica?.mandato;
  if (!m) return bloqueio('impossivel', 'Propor uma reforma é do exercício de um mandato.');
  const r = id ? reformasDoMandato(v).find(x => x.id === id) : undefined;
  if (!r) return bloqueio('impossivel', `Não é da competência de ${nomeCargo(v, m.cargo)} — ou já vale aqui.`);
  if (feitaNoAno(v)) return bloqueio('incompativel', 'Uma reforma por ano: a agenda do mandato não comporta duas.');
  return PERMITIDO;
}

/** O que a reforma diz na lista do mandato. */
export function acoesDeReforma(v: Vida): AcaoProfissional[] {
  return reformasDoMandato(v).map(r => {
    const c = chanceDaReforma(v, r);
    const antes = anosAntes(r, anoDe(v.t));
    const palavra = c.chance >= 0.5 ? 'com boa chance' : c.chance >= 0.25 ? 'numa disputa aberta' : c.chance >= 0.1 ? 'difícil' : 'quase sem chance';
    return {
      id: `pol_reforma4_${r.id}`,
      rotulo: `Propor: ${r.nome}`,
      porque: `Contra: ${r.oposicao}. ${cap(palavra)}${c.regime ? ' — sob o regime, a casa vota o que o governo manda' : antes && antes >= 8 ? ' — muito à frente do seu tempo' : ''}.`,
      aviso: antes && antes >= 8 ? 'Aprovada tão cedo, a reforma pode custar apoio e ser derrubada depois.' : undefined,
      acao: { tipo: 'politica', oque: 'reforma4', valor: r.id } as unknown as AcaoProfissional['acao'],
      peso: 6
    };
  });
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Propor a reforma: a votação (ou a sanção), o que muda na história, o que custa. */
export function executarReforma(v: Vida, r0: Rng, id?: string): SaidaPolitica {
  const r = reformasDoMandato(v).find(x => x.id === id);
  const p = v.caminhos.politica;
  if (!r || !p?.mandato) return { texto: 'Não se aplica.', tom: 'neutro' };
  v.anoAtual.acoes.push(`reforma4:${r.id}`);
  const m = p.mandato;
  const ano = anoDe(v.t);
  const c = chanceDaReforma(v, r);
  const antes = anosAntes(r, ano);
  const onde = r.alcance === 'municipal' ? `na cidade` : r.alcance === 'estadual' ? `no estado` : `no país`;
  if (!r0.chance(c.chance)) {
    desgastar(p, 4 + Math.round(r.resistencia * 4), 'mandato');
    const texto = c.maturidade < 0.3
      ? `A proposta (${r.nome.toLowerCase()}) foi derrotada: ${r.oposicao} — e a maioria achou que o país não estava pronto.`
      : `A proposta (${r.nome.toLowerCase()}) parou: faltaram votos. ${cap(r.oposicao)} se organizou contra.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true, fato: { tipo: 'era', dados: { categoria: 'politica', evento: `reforma_falhou:${r.id}` } } });
    registrarNoMandato(v, `Tentou aprovar: ${r.nome.toLowerCase()} (derrotada)`);
    return { texto, tom: 'ruim' };
  }
  // Passou: a história desta continuidade muda, no alcance do cargo.
  const h = garantirHistoria(v);
  const mu = municipio(v.moradia.municipioId);
  h.alteracoes.push({
    reforma: r.id, pais: paisHistoricoCorrente(), t: v.t, alcance: r.alcance,
    ...(r.alcance === 'estadual' ? { divisao: divisaoCorrente() ?? mu.uf } : r.alcance === 'municipal' ? { municipioId: v.moradia.municipioId } : {}),
    por: 'voce', autor: v.eu.nome, autorNasc: v.eu.tNasc, ...(antes !== undefined ? { antes } : {})
  });
  m.feito += 1;
  // O custo da antecipação: quem era contra não esquece; quem era a favor agradece. [A]
  const custo = Math.round(r.resistencia * 10 * (antes ? Math.min(2, 0.5 + antes / 10) : 0.6));
  m.aprovacao = clamp(m.aprovacao + 5 - custo, 5, 95);
  desgastar(p, Math.round(custo * 0.8), 'mandato');
  p.reputacao = clamp((p.reputacao ?? 0) + 6);
  const quando = antes ? ` — ${antes} ${antes === 1 ? 'ano' : 'anos'} antes do que a história registrou` : r.real ? '' : ' — algo que a história não registrou';
  const texto = `Aprovada ${onde}: ${r.texto}${quando}. ${cap(r.oposicao)} prometeu reagir.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true, fato: { tipo: 'era', dados: { categoria: 'direitos', evento: `reforma:${r.id}`, escopo: r.alcance } } });
  registrarNoMandato(v, `Aprovou: ${r.nome.toLowerCase()}`);
  marcar(v, 'conquista', `Aprovou ${r.nome.toLowerCase()} ${onde}, como ${nomeCargo(v, m.cargo)}.`, antes && antes >= 5 ? 3 : 2);
  // A linha do tempo do mundo: a história alternativa fica marcada como tal (não é a real).
  mundoDe(v).eventos.push({ id: `${ano}:v4_${r.id}_${v.t}`, ano, tipo: 'sociedade', escopo: r.alcance === 'nacional' ? 'pais' : 'regiao', titulo: r.nome, texto: `${cap(r.texto)}${quando}.`, real: false, ...(r.alcance !== 'nacional' ? { lugar: mu.uf } : {}) });
  return { texto, tom: 'bom' };
}

// Os ganchos (a política os chama só se este pacote carregou — numa vida histórica, sempre, pelo ano histórico).
REFORMAS_DA_EPOCA.acoes = acoesDeReforma;
REFORMAS_DA_EPOCA.disp = disponibilidadeReforma;
REFORMAS_DA_EPOCA.exec = executarReforma;
