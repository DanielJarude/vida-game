/**
 * Estado pessoal: Humor, Cabeça e Saúde — e POR QUÊ.
 *
 * Este módulo é a FONTE ÚNICA das causas. O equilíbrio anual da mente
 * (`equilibrarMente`) e a deriva da saúde (`processarCorpo`) são somas dos
 * fatores daqui; a tela "Você" lê os mesmos fatores para dizer "tem ajudado"
 * e "tem pesado". Não existe uma conta para o jogo e outra para a interface.
 *
 *   causa (a semana, o trabalho, as pessoas, o corpo)
 *     → fator (um peso com nome)
 *     → estado (o equilíbrio para onde a pessoa tende, ano a ano)
 *     → manifestação (palavra, rosto, tendência)
 *     → cuidado (o que dá para fazer — e que só age com o tempo)
 *
 * Acontecimentos pontuais (uma demissão, um nascimento, uma perda) entram
 * como ABALOS: um empurrão com nome, que o equilíbrio vai absorvendo ano a
 * ano. Nenhum cuidado é instantâneo: descansar, conversar, tratar e mudar a
 * rotina mudam o fator ou dão um empurrão; o equilíbrio faz o resto devagar.
 *
 * Nada aqui diagnostica: depressão e ansiedade só existem como condição
 * quando o corpo (`corpo.ts`) as registra. O texto descreve o que pesa; não
 * diz o que a pessoa sente nem como reagiu.
 */

import type { Pessoa, Vida, Vinculo } from '../tipos';
import { abalar, type Abalo } from './abalo';
import { filhos, idade, idadePessoa, moraCom, parceiro, vinculosVivos } from '../nucleo';
import { listaNatural } from '../texto';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { modeloCondicao } from './corpo';
import { modeloRotina, nivelDa } from './rotinas';
import { semana } from './semana';
import { papelDe } from './vinculos';
import { moraComFamiliaDeOrigem, rendaPerCapita } from './domicilio';
import { pesoDoLuto } from './luto';
import { obrigacoesAtrasadas, seguranca } from './dinheiro';
import { casaApertada } from './imoveis';

export { abalar, type Abalo };

export type Dimensao = 'humor' | 'cabeca' | 'saude';

/**
 * Um fator: o que empurra um estado, com nome. `efeito` está na unidade do
 * estado (pontos do equilíbrio de humor/cabeça; pontos de saúde por ano).
 * Positivo em humor e saúde = ajuda; positivo em cabeça = pesa.
 */
export interface Fator {
  id: string;
  texto: string;
  efeito: number;
  /** Quem está ligado ao fator (abre a ficha da pessoa). */
  pessoaId?: string;
  /** Veio de um acontecimento (abalo), não de algo que continua. */
  pontual?: boolean;
}

export interface Registro { t: number; humor: number; cabeca: number; saude: number }

const LIMITE_REGISTROS = 8;

/* ----------------------------------------------------------------- Abalos */

/** O quanto um abalo ainda pesa: o equilíbrio absorve ~35% (humor) e ~30% (cabeça) por ano. */
function restoDoAbalo(v: Vida, a: Abalo, d: 'humor' | 'cabeca'): number {
  const anos = Math.max(0, Math.round((v.t - a.t) / 12));
  return d === 'humor' ? a.humor * Math.pow(0.65, anos) : a.cabeca * Math.pow(0.7, anos);
}

function abalosAtivos(v: Vida, d: 'humor' | 'cabeca'): Fator[] {
  return (v.mente.abalos ?? [])
    .map(a => ({ a, resto: restoDoAbalo(v, a, d) }))
    .filter(x => Math.abs(x.resto) >= 2.5 && v.t - x.a.t <= 36)
    .map(x => ({ id: `abalo:${x.a.t}:${x.a.texto}`, texto: x.a.texto, efeito: Math.round(x.resto), pontual: true }));
}

/* -------------------------------------------------------------- Registro */

/** Guarda como a pessoa estava neste aniversário (para a tendência). */
export function registrarEstado(v: Vida): void {
  const h = v.mente.historico ?? (v.mente.historico = []);
  h.push({ t: v.t, humor: v.mente.felicidade, cabeca: v.mente.estresse, saude: v.corpo.saude });
  if (h.length > LIMITE_REGISTROS) h.splice(0, h.length - LIMITE_REGISTROS);
}

export type Tendencia = 'melhorando' | 'piorando' | 'estavel' | 'sem_dado';

/** Melhorando ou piorando nos últimos dois anos (cabeça: cair é melhorar). */
export function tendencia(v: Vida, d: Dimensao): Tendencia {
  const h = v.mente.historico ?? [];
  const antes = h.filter(x => x.t <= v.t - 24).pop() ?? h.filter(x => x.t < v.t).shift();
  if (!antes) return 'sem_dado';
  const agora = d === 'humor' ? v.mente.felicidade : d === 'cabeca' ? v.mente.estresse : v.corpo.saude;
  const era = d === 'humor' ? antes.humor : d === 'cabeca' ? antes.cabeca : antes.saude;
  const dif = (agora - era) * (d === 'cabeca' ? -1 : 1);
  const limiar = d === 'saude' ? 4 : 6;
  return dif >= limiar ? 'melhorando' : dif <= -limiar ? 'piorando' : 'estavel';
}

/* ----------------------------------------------------------- Quem apoia */

export interface Apoio { p: Pessoa; vin: Vinculo; peso: number }

/** Quem está perto de verdade (a rede de apoio, com nomes). */
export function apoios(v: Vida): Apoio[] {
  const out: Apoio[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie) continue;
    const recente = v.t - vin.tUltimoContato < 24 || vin.convivio.length > 0;
    if (!recente) continue;
    const papel = papelDe(p, vin);
    let peso = 0;
    if (papel === 'parceiro') peso = 1.5;
    else if (papel === 'amigo_proximo') peso = 1;
    else if ((papel === 'filho' || papel === 'irmao' || papel === 'genitor' || papel === 'neto') && vin.proximidade >= 55 && idadePessoa(v, p) >= 12) peso = 0.8;
    else if (papel === 'amigo' && vin.proximidade >= 50) peso = 0.4;
    if (peso > 0) out.push({ p, vin, peso });
  }
  return out.sort((a, b) => b.peso - a.peso || b.vin.proximidade - a.vin.proximidade);
}

export const redeDeApoio = (v: Vida) => apoios(v).reduce((s, a) => s + a.peso, 0);

/* ---------------------------------------------------------- Bem-estar das atividades */

/**
 * O que cada atividade faz pela cabeça e pelo humor (na unidade do
 * equilíbrio). Hobby anima; exercício, leitura, fé e terapia aliviam;
 * cursinho, bico e estudo para concurso pesam. Há um teto: três atividades
 * relaxantes não apagam uma semana impossível.
 */
export const BEM_ESTAR: Record<string, { humor?: number; cabeca?: number | ((nivel: number) => number) }> = {
  futebol: { humor: 4, cabeca: -6 }, volei: { humor: 4, cabeca: -3 }, natacao: { cabeca: -6 }, atletismo: { cabeca: -3 }, lutas: { cabeca: -6 },
  academia: { cabeca: -8 }, corrida: { cabeca: -7 }, musica: { humor: 4 }, danca: { humor: 4, cabeca: -2 }, teatro: { humor: 4 },
  desenho: { cabeca: -4 }, escrever: { cabeca: -3 }, fotografia: { humor: 2 }, leitura: { cabeca: -4 }, igreja: { humor: 4, cabeca: -6 },
  voluntariado: { humor: 5 }, sair_noite: { humor: 6 }, videogame: { humor: 4 }, terapia: { humor: 5, cabeca: -15 }, tempo_familia: { humor: 4, cabeca: -2 },
  cozinhar: { humor: 2 }, xadrez: { humor: 2 },
  cursinho: { cabeca: 11 }, estudar_concurso: { cabeca: n => 5 + n * 4 }, bico: { cabeca: 11 }, vender_doces: { cabeca: 9 }
};
const TETO_ALIVIO = -18;
const TETO_ANIMO = 10;

function nomeAtividade(id: string): string {
  const m = modeloRotina(id);
  return m ? m.nome.charAt(0).toLowerCase() + m.nome.slice(1) : id;
}

function fatoresDeAtividades(v: Vida, d: 'humor' | 'cabeca'): Fator[] {
  const out: Fator[] = [];
  for (const r of v.rotinas) {
    const b = BEM_ESTAR[r.id];
    if (!b) continue;
    const x = d === 'humor' ? b.humor : typeof b.cabeca === 'function' ? b.cabeca(nivelDa(r)) : b.cabeca;
    if (x) out.push({ id: `rotina:${r.id}`, texto: nomeAtividade(r.id), efeito: x });
  }
  // Teto: o que alivia (ou anima) soma até um limite; os mais fortes ficam.
  const bons = out.filter(f => (d === 'cabeca' ? f.efeito < 0 : f.efeito > 0)).sort((a, b) => Math.abs(b.efeito) - Math.abs(a.efeito));
  let soma = 0;
  const teto = d === 'cabeca' ? TETO_ALIVIO : TETO_ANIMO;
  for (const f of bons) {
    const cabe = d === 'cabeca' ? Math.max(teto - soma, f.efeito) : Math.min(teto - soma, f.efeito);
    f.efeito = cabe;
    soma += cabe;
  }
  return out.filter(f => f.efeito !== 0);
}

/* ------------------------------------------------------------ Semana */

/** O quanto os compromissos fixos passam do que a semana comporta. */
export function sobrecargaDaSemana(v: Vida): { fixos: number; atividades: number; rotulos: string[]; apertada: boolean } {
  const s = semana(v);
  const somaFixos = s.fixos.reduce((t, f) => t + f.peso, 0) - s.ganhos.reduce((t, f) => t + f.peso, 0);
  const fixos = Math.max(0, somaFixos - (s.base - 0.5));
  // Sobra só uma fresta da semana depois dos compromissos (e eles são muitos).
  const apertada = fixos <= 0.01 && s.base - somaFixos <= 0.75 && somaFixos >= 2.5;
  const atividades = Math.max(0, s.ocupado - s.capacidade);
  const rotulos = [...s.fixos.filter(f => f.peso >= 0.5).map(f => f.rotulo.replace(/ \(.*\)$/, '').toLowerCase()), ...s.rotinas.filter(r => r.peso >= 1).map(r => r.rotulo.replace(/ — .*/, '').toLowerCase())];
  return { fixos, atividades, rotulos, apertada };
}

/* ------------------------------------------------------------- Humor */

export const BASE_HUMOR = 52;

/** O que puxa o humor para cima ou para baixo agora (soma = alvo − 52). */
export function fatoresHumor(v: Vida): Fator[] {
  const i = idade(v);
  const out: Fator[] = [];
  const rede = apoios(v);
  const somaRede = rede.reduce((s, a) => s + a.peso, 0);
  if (somaRede > 0) out.push({ id: 'rede', texto: `gente por perto: ${listaNatural(rede.slice(0, 2).map(a => a.p.nome))}`, efeito: Math.min(12, somaRede * 3), pessoaId: rede[0].p.id });
  const saude = (v.corpo.saude - 60) / 5;
  if (Math.abs(saude) >= 1) out.push({ id: 'saude', texto: saude > 0 ? 'o corpo em dia' : 'a saúde, que tem cobrado', efeito: saude });
  const par = parceiro(v);
  if (par?.vin.romance) {
    const e = (par.vin.romance.envolvimento - 50) / 6 + 2;
    out.push({ id: 'parceria', texto: e >= 0 ? `a vida com ${par.p.nome}` : `a distância de ${par.p.nome}`, efeito: e, pessoaId: par.p.id });
  }
  const seg = seguranca(v);
  if (seg.nivel === 'no_vermelho') out.push({ id: 'dividas', texto: obrigacoesAtrasadas(v) > 0 ? 'as contas atrasadas' : v.financas.negativado ? 'o nome sujo e as contas atrasadas' : 'a dívida do cartão', efeito: obrigacoesAtrasadas(v) >= 3 || v.financas.negativado ? -12 : -7 });
  else if (seg.nivel === 'apertado' && v.fatos['sem_sobra_desde'] !== undefined && v.t - v.fatos['sem_sobra_desde'] >= 24) out.push({ id: 'aperto', texto: 'anos de dinheiro contado', efeito: -4 });
  else if (!moraComFamiliaDeOrigem(v) && (v.financas.estilo === 'folgado' || seg.nivel === 'folgado')) out.push({ id: 'folga', texto: 'dinheiro sobrando para o que gosta', efeito: 3 });
  const apertada = casaApertada(v);
  if (apertada) out.push({ id: 'casa_pequena', texto: apertada, efeito: -2 });
  // A companhia de um bicho: pesa mais para quem mora sozinho.
  const bicho = vinculosVivos(v).filter(x => x.p.especie && x.vin.convivio.includes('casa')).sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0];
  if (bicho && i >= 6) out.push({ id: 'pet', texto: `a companhia de ${bicho.p.nome}`, efeito: moraCom(v).length === 0 ? 4 : 2, pessoaId: bicho.p.id });
  if (i >= 18 && !v.trabalho.atual && !v.trabalho.aposentadoria && !v.educacao.matricula) out.push({ id: 'sem_trabalho', texto: 'estar sem trabalho', efeito: -6 });
  if (i >= 18 && somaRede < 1 && moraCom(v).length === 0) out.push({ id: 'solidao', texto: 'ninguém por perto no dia a dia', efeito: -6 });
  const luto = pesoDoLuto(v);
  if (luto > 0) {
    const maior = [...v.luto].sort((a, b) => b.peso - a.peso)[0];
    const p = maior && v.pessoas[maior.pessoaId];
    out.push({ id: 'luto', texto: p ? `a falta de ${p.nome}` : 'uma perda recente', efeito: -Math.min(20, luto * 0.22), pessoaId: p?.id });
  }
  const atrito = atritoEmCasa(v);
  if (atrito.soma > 0) out.push({ id: 'atrito', texto: `o clima em casa com ${atrito.nome}`, efeito: -Math.min(10, atrito.soma / 8), pessoaId: atrito.pessoaId });
  if (v.mente.estresse > 50) out.push({ id: 'cabeca', texto: 'a cabeça cheia', efeito: -(v.mente.estresse - 50) / 4 });
  out.push(...fatoresDeAtividades(v, 'humor'));
  return out.filter(f => Math.abs(f.efeito) >= 0.5);
}

export function alvoHumor(v: Vida): number {
  return BASE_HUMOR + fatoresHumor(v).reduce((s, f) => s + f.efeito, 0);
}

/* ------------------------------------------------------------ Cabeça */

export const baseCabeca = (v: Vida) => (idade(v) < 12 ? 10 : 18);

/** O que enche (ou alivia) a cabeça agora (soma = alvo − base). */
export function fatoresCabeca(v: Vida): Fator[] {
  const i = idade(v);
  const out: Fator[] = [];
  const e = v.trabalho.atual;
  if (e) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    const peso = oc ? (oc.estresse - 2) * 4 : 0;
    if (Math.abs(peso) >= 1) out.push({ id: 'trabalho', texto: peso > 0 ? 'um trabalho que exige muito' : 'um trabalho sem grandes sustos', efeito: peso });
    if (v.trabalho.horasExtras) out.push({ id: 'horas_extras', texto: 'as horas extras', efeito: 16 });
  }
  const s = sobrecargaDaSemana(v);
  if (s.fixos > 0.01) out.push({ id: 'semana_fixa', texto: `compromissos que não cabem na semana: ${listaNatural(s.rotulos.slice(0, 3))}`, efeito: Math.round(s.fixos * 36) });
  else if (s.apertada) out.push({ id: 'semana_apertada', texto: 'quase nada da semana sobra para você', efeito: 6 });
  if (s.atividades > 0.01) out.push({ id: 'semana', texto: 'a semana com mais atividades do que cabe', efeito: Math.round(s.atividades * 23) });
  const pequenos = vinculosVivos(v).filter(x => x.vin.parentesco === 'filho' && x.vin.convivio.includes('casa') && idadePessoa(v, x.p) < 4).length;
  if (pequenos) out.push({ id: 'bebe', texto: pequenos === 1 ? 'as noites curtas com uma criança pequena' : 'as noites curtas com crianças pequenas', efeito: Math.min(10, pequenos * 6) });
  const cuidar = semana(v).fixos.find(f => f.id === 'cuidar');
  if (cuidar) out.push({ id: 'cuidar', texto: cuidar.rotulo.charAt(0).toLowerCase() + cuidar.rotulo.slice(1), efeito: 6 });
  const seg = seguranca(v);
  if (seg.nivel === 'no_vermelho') out.push({ id: 'dividas', texto: obrigacoesAtrasadas(v) > 0 ? 'as parcelas e contas atrasadas' : 'as contas que não fecham', efeito: obrigacoesAtrasadas(v) >= 3 || v.financas.negativado ? 16 : 10 });
  else if (seg.nivel === 'apertado') out.push({ id: 'aperto', texto: 'o mês que não fecha', efeito: 6 });
  else if (i >= 25 && (seg.nivel === 'seguro' || seg.nivel === 'folgado') && !moraComFamiliaDeOrigem(v)) out.push({ id: 'reserva', texto: 'saber que há uma reserva', efeito: -3 });
  const apertada = casaApertada(v);
  if (apertada) out.push({ id: 'casa_pequena', texto: apertada, efeito: 4 });
  const quebrado = v.financas.bens.find(b => b.tipo === 'veiculo' && (b.problema?.gravidade ?? 0) >= 3 && !b.parado);
  if (quebrado && (v.trabalho.atual || filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa')))) out.push({ id: 'carro_parado', texto: 'o carro parado na oficina', efeito: 3 });
  if (moraComFamiliaDeOrigem(v) && i < 18 && rendaPerCapita(v) < 500) out.push({ id: 'aperto_casa', texto: 'o dinheiro curto em casa', efeito: 7 });
  const desde = v.trabalho.desempregadoDesde;
  if (!e && desde !== undefined && i >= 18 && !v.trabalho.aposentadoria && v.t - desde >= 12) out.push({ id: 'procura', texto: 'procurar trabalho há tanto tempo', efeito: 6 });
  const par = parceiro(v);
  if (par?.vin.romance?.segredo) out.push({ id: 'segredo', texto: `guardar um segredo de ${par.p.nome}`, efeito: 7, pessoaId: par.p.id });
  const luto = pesoDoLuto(v);
  if (luto * 0.08 >= 1) out.push({ id: 'luto', texto: 'o luto', efeito: luto * 0.08 });
  const atrito = atritoEmCasa(v);
  if (atrito.soma > 0) out.push({ id: 'atrito', texto: `as brigas em casa com ${atrito.nome}`, efeito: Math.min(12, atrito.soma / 10), pessoaId: atrito.pessoaId });
  out.push(...fatoresDeAtividades(v, 'cabeca'));
  return out.filter(f => Math.abs(f.efeito) >= 0.5);
}

export function alvoCabeca(v: Vida): number {
  return baseCabeca(v) + fatoresCabeca(v).reduce((s, f) => s + f.efeito, 0);
}

/* ------------------------------------------------------------- Saúde */

/**
 * A deriva anual da saúde, em partes. A soma é o quanto a saúde tende a
 * mudar num ano (antes do acaso). Idade é mais forte que tudo depois dos 65;
 * antes disso, hábito e movimento pesam de verdade.
 */
export function fatoresSaude(v: Vida): Fator[] {
  const i = idade(v);
  const c = v.corpo;
  const out: Fator[] = [];
  const idadeDelta = i < 18 ? (90 - c.saude) * 0.25
    : i < 35 ? (84 - c.saude) * 0.12
    : i < 50 ? (80 - c.saude) * 0.07 - 0.3
    : i < 65 ? (76 - c.saude) * 0.05 - 0.3
    : i < 80 ? -0.75 : -1.4;
  out.push({ id: 'idade', texto: idadeDelta >= 0 ? (i < 35 ? 'um corpo jovem, que se recupera' : 'o corpo, que ainda se recupera') : i >= 65 ? 'a idade' : 'os anos, que começam a cobrar', efeito: idadeDelta });
  const forma = (c.forma - 45) / 70;
  out.push({ id: 'forma', texto: forma >= 0 ? 'se mexer com frequência' : 'o corpo parado', efeito: forma });
  if (c.habitos.fuma) out.push({ id: 'fuma', texto: 'o cigarro', efeito: -1.6 });
  if (c.habitos.bebe === 'muito') out.push({ id: 'bebe', texto: 'a bebida', efeito: -1.4 });
  if (v.mente.estresse > 75) out.push({ id: 'estresse', texto: 'a cabeça no limite', efeito: -0.8 });
  if (v.mente.felicidade < 25) out.push({ id: 'tristeza', texto: 'um tempo muito para baixo', efeito: -0.5 });
  for (const cond of c.condicoes) {
    const m = modeloCondicao(cond.id);
    if (!m) continue;
    const perda = (cond.tratando ? m.perda[1] : m.perda[0]) * (i < 45 ? 0.5 : 1);
    out.push({ id: `condicao:${cond.id}`, texto: `${cond.nome}${cond.tratando ? ', em tratamento' : ', sem tratamento'}`, efeito: -perda });
  }
  return out;
}

export const derivaDaSaude = (v: Vida) => fatoresSaude(v).reduce((s, f) => s + f.efeito, 0);

/* -------------------------------------------------------------- Leitura */

export interface LeituraEstado {
  ajudando: Fator[];
  pesando: Fator[];
}

/**
 * O que ajuda e o que pesa, do mais forte para o mais fraco, com os
 * acontecimentos do ano misturados às causas que continuam. Para a tela.
 */
export function leituraDoEstado(v: Vida, d: Dimensao, limite = 3): LeituraEstado {
  const sinal = d === 'cabeca' ? -1 : 1;
  const base = d === 'humor' ? fatoresHumor(v) : d === 'cabeca' ? fatoresCabeca(v) : fatoresSaude(v);
  // Uma perda já aparece como luto (que continua); o abalo da notícia não se repete ao lado.
  const pontuais = d === 'saude' ? [] : abalosAtivos(v, d).filter(a => !(base.some(f => f.id === 'luto') && /^a morte de /.test(a.texto)));
  // Na saúde, a idade antes dos 35 só "ajuda" em silêncio; não vale citar.
  const todos = [...base, ...pontuais].filter(f => !(d === 'saude' && f.id === 'idade' && f.efeito >= 0 && idade(v) < 35 && v.corpo.saude >= 80));
  const minimo = d === 'saude' ? 0.35 : 2;
  const ajudando = todos.filter(f => f.efeito * sinal >= minimo).sort((a, b) => b.efeito * sinal - a.efeito * sinal).slice(0, limite);
  const pesando = todos.filter(f => f.efeito * sinal <= -minimo).sort((a, b) => a.efeito * sinal - b.efeito * sinal).slice(0, limite);
  return { ajudando, pesando };
}

/* --------------------------------------------------------- Auxiliares */


function atritoEmCasa(v: Vida): { soma: number; nome: string; pessoaId?: string } {
  const casa = vinculosVivos(v).filter(x => x.vin.convivio.includes('casa') && !x.p.especie && x.vin.tensao > 40);
  const soma = casa.reduce((s, x) => s + (x.vin.tensao - 40), 0);
  const maior = casa.sort((a, b) => b.vin.tensao - a.vin.tensao)[0];
  return { soma, nome: maior?.p.nome ?? '', pessoaId: maior?.p.id };
}
