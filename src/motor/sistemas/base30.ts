/**
 * VIDA 30 · §7 — o mercado da base: transferências de jovens atletas entre clubes e as formas de apoio financeiro.
 *
 * O que já existia (VIDA 25/26/28) e fica: o ano de formação jogado (categoria, nota, números), a promoção antecipada,
 * a integração ao elenco profissional, a dispensa e a peneira noutro clube, o contrato profissional e a bolsa da base
 * (`esporte.bolsaDaBase`, a mesma conta). O que faltava:
 *
 *   - a REMUNERAÇÃO em partes: a bolsa (de aprendizagem, a partir dos 14), a ajuda de custo (transporte, a ida para
 *     casa de quem treina longe), os benefícios que não são dinheiro (alojamento, alimentação, escola, saúde) e o
 *     VÍNCULO — nenhum antes dos 14, bolsa de formação, contrato de formação (o bom jogador de 16 num clube estruturado).
 *     Nada disso é salário de profissional: é dito como apoio a quem está em formação.
 *   - o MERCADO: outro clube observa quem vai bem e faz um convite (direto) ou chama para uma avaliação (uma semana de
 *     treinos). A proposta diz o clube, a cidade, a categoria e o que ele oferece; aceitar transfere o REGISTRO — o clube,
 *     a cidade, a categoria e o histórico da formação passam a ser do clube novo (o ano seguinte é jogado lá); recusar
 *     fica dito. Antes dos 14, só clube da própria cidade (ninguém sai de casa criança).
 *
 * As contas usam sorteios derivados (`rngDe`): a sequência principal da vida não muda.
 */

import type { CarreiraEsportiva, Dominio, Oportunidade, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import { escrever, idade, lembrarCom, pais, temFato, marcarFato } from '../nucleo';
import { clubePorNome, clubesDaCidade, clubesDoPais, doClube, noClube, oClube, type Clube } from '../dados/clubes';
import { municipio, paisDaCidade, grandesCentros } from '../dados/lugares';
import { salarioMinimoDoPais } from '../mundo/economia';
import { dinheiro, listaNatural } from '../texto';
import { lancar } from './extrato';
import { aEquipe, bolsaDaBase, categoriaDaBase, nomeDeClube, ocupacaoDaModalidade } from './esporte';
import { capitalDoEstado } from './escola';
import { novaOportunidade } from './oportunidades';
import { ocupacaoAindaNaoExiste } from '../eras/base/profissoes';

export type VinculoDaBase30 = 'nenhum' | 'bolsa' | 'formacao';

export interface RemuneracaoDaBase30 {
  /** A bolsa de aprendizagem/formação, por mês (a mesma conta da VIDA 28; no contrato de formação, maior). */
  bolsa: number;
  /** A ajuda de custo, por mês (transporte, a viagem para casa de quem treina longe). */
  ajuda: number;
  /** O que o clube dá que não é dinheiro. */
  beneficios: string[];
  vinculo: VinculoDaBase30;
  /** "Contrato de formação", "Bolsa de formação", "Sem vínculo (antes dos 14)". */
  rotulo: string;
  /** Por que é assim (a lei, a idade, o clube) — uma frase. */
  porque: string;
}

export interface TransferenciaDaBase30 {
  t: number;
  idade: number;
  de: string;
  para: string;
  deMunicipio: string;
  paraMunicipio: string;
  categoria: string;
  via: 'convite' | 'avaliacao';
}

export interface PropostaDaBase30 {
  /** O id da porta (`Oportunidade.id`). */
  op: string;
  t: number;
  de: string;
  para: string;
  municipioId: string;
  porte: Clube['porte'] | 'equipe';
  categoria: string;
  via: 'convite' | 'avaliacao';
  remuneracao: RemuneracaoDaBase30;
  motivo: string;
  /** O que aconteceu (para a ficha): aceitou, recusou, reprovado na avaliação, expirou. */
  desfecho?: 'aceitou' | 'recusou' | 'reprovado' | 'expirou';
}

export interface Base30 {
  transferencias: TransferenciaDaBase30[];
  propostas: PropostaDaBase30[];
  /** O clube em que o atleta está registrado na federação (e desde quando). */
  registro?: { clube: string; desde: number };
}

const PORTE: Record<string, number> = { regional: 0, tradicional: 1, grande: 2, equipe: 0 };

function porteDe(e: { modalidade: Dominio; clube: string; municipioId: string }): Clube['porte'] | 'equipe' {
  if (e.modalidade !== 'futebol') return 'equipe';
  return clubePorNome(e.clube, paisDaCidade(e.municipioId))?.porte ?? 'regional';
}

export function base30(e: CarreiraEsportiva): Base30 {
  return (e.base30 ??= { transferencias: [], propostas: [] });
}

/** A última nota da formação (a do ano que fechou), ou a técnica traduzida. */
function notaRecente(e: CarreiraEsportiva): number {
  const f = e.formacao ?? [];
  return f.length ? f[f.length - 1].nota : 6;
}

/**
 * O que o clube paga e dá a quem está na base, NESTE clube (ou noutro, para a proposta): fonte única para a tela, o
 * extrato e a proposta. `outro` simula o mesmo atleta noutro clube/cidade (a proposta compara com o de hoje).
 */
export function remuneracaoDaBase30(v: Vida, e: CarreiraEsportiva, outro?: { clube: string; municipioId: string }): RemuneracaoDaBase30 {
  const i = idade(v);
  const alvo = outro ? { ...e, clube: outro.clube, municipioId: outro.municipioId } : e;
  const pais = paisDaCidade(alvo.municipioId);
  const br = pais === 'BR';
  const porte = porteDe(alvo);
  const longe = alvo.municipioId !== v.moradia.municipioId;
  const minimo = salarioMinimoDoPais(pais);
  const amador = ocupacaoAindaNaoExiste(v, ocupacaoDaModalidade(e.modalidade)) !== undefined;
  const beneficios: string[] = [];
  if (longe && i >= 14) beneficios.push('alojamento no clube');
  if (porte === 'grande') beneficios.push('alimentação no clube', 'escola paga pelo clube', 'plano de saúde', 'psicólogo e nutricionista');
  else if (porte === 'tradicional') beneficios.push('alimentação nos dias de treino', 'escola parceira', 'departamento médico do clube');
  else beneficios.push('lanche depois do treino', 'atendimento do departamento médico');
  if (e.fase !== 'base' || e.modalidade === 'tenis' || e.origem === 'amador' || amador) {
    return { bolsa: 0, ajuda: 0, beneficios: e.modalidade === 'tenis' ? [] : beneficios.slice(0, 1), vinculo: 'nenhum', rotulo: e.modalidade === 'tenis' ? 'Sem clube pagando' : 'Sem bolsa', porque: e.modalidade === 'tenis' ? 'No tênis juvenil, não há clube que pague: a família banca o circuito (ou o patrocínio, quando vem).' : amador ? 'O esporte ainda é amador no país: ninguém recebe para jogar.' : 'Sem bolsa nesta trajetória.' };
  }
  if (i < 14) {
    return { bolsa: 0, ajuda: 0, beneficios: beneficios.filter(b => !b.startsWith('alojamento')).slice(0, 2), vinculo: 'nenhum', rotulo: 'Sem vínculo (antes dos 14)', porque: br ? 'Antes dos 14, a lei não permite vínculo nem bolsa de aprendizagem: o clube forma, a família sustenta.' : 'Antes dos 14, a academia não paga: o clube forma, a família sustenta.' };
  }
  // A bolsa: a mesma conta da VIDA 28 para o clube de hoje; para outro clube, a mesma regra com o porte dele.
  const bolsaBase = outro ? Math.round(minimo * ((porte === 'grande' ? 0.6 : porte === 'tradicional' ? 0.35 : 0.15) * (i >= 16 ? 1 : 0.5)) / 10) * 10 : bolsaDaBase(v, e);
  // O contrato de formação: aos 16+, num clube estruturado, para quem vai bem (nota ≥ 7) — a bolsa sobe (ainda não é salário).
  const formacao = i >= 16 && porte !== 'regional' && porte !== 'equipe' && notaRecente(e) >= 7;
  const bolsa = formacao ? Math.round(Math.max(bolsaBase * 1.6, minimo * (porte === 'grande' ? 1 : 0.7)) / 10) * 10 : bolsaBase;
  const ajuda = Math.round(minimo * (longe ? (porte === 'grande' ? 0.25 : 0.15) : porte === 'grande' ? 0.1 : porte === 'tradicional' ? 0.05 : 0) / 10) * 10;
  const lei = br ? (formacao ? 'contrato de formação, com bolsa de aprendizagem (Lei 9.615/98, art. 29, e Lei Geral do Esporte)' : 'bolsa de aprendizagem, sem vínculo de emprego (Lei 9.615/98, art. 29, §4º)') : (formacao ? 'contrato de formação da academia (scholarship)' : 'bolsa da academia, sem contrato de trabalho');
  return {
    bolsa, ajuda, beneficios, vinculo: formacao ? 'formacao' : bolsa > 0 ? 'bolsa' : 'nenhum',
    rotulo: formacao ? 'Contrato de formação' : bolsa > 0 ? 'Bolsa de formação' : 'Sem bolsa',
    porque: `${cap(lei)}. Não é salário de atleta profissional: é apoio a quem ainda se forma${longe ? ', com a ajuda de custo de quem treina longe de casa' : ''}.`
  };
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/**
 * Paga o ano de base (no fim do ano, como a bolsa da VIDA 28): bolsa e ajuda no extrato, o contrato de formação dito
 * uma vez. Devolve a remuneração (para a ficha do ano).
 */
export function pagarAnoDeBase30(v: Vida, e: CarreiraEsportiva): RemuneracaoDaBase30 {
  const rem = remuneracaoDaBase30(v, e);
  if (rem.bolsa > 0) {
    v.financas.conta += rem.bolsa * 12;
    lancar(v, `${rem.vinculo === 'formacao' ? 'Contrato de formação' : 'Bolsa da base'} (${e.clube})`, 'renda', rem.bolsa * 12);
    if (!temFato(v, `bolsa_base_${e.clube}`)) { marcarFato(v, `bolsa_base_${e.clube}`); escrever(v, { fio: 'esporte', texto: `${cap(oClube(e.clube))} passou a pagar uma bolsa de ${dinheiro(rem.bolsa)} por mês: não é salário de jogador, é ajuda para quem ainda está em formação.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom' }); }
  }
  if (rem.ajuda > 0) {
    v.financas.conta += rem.ajuda * 12;
    lancar(v, `Ajuda de custo da base (${e.clube})`, 'renda', rem.ajuda * 12);
  }
  if (rem.vinculo === 'formacao' && !temFato(v, `formacao30_${e.clube}`)) {
    marcarFato(v, `formacao30_${e.clube}`);
    escrever(v, { fio: 'esporte', texto: `Assinou contrato de formação com ${oClube(e.clube)}: a bolsa subiu para ${dinheiro(rem.bolsa)} por mês, e o clube passou a ter preferência no primeiro contrato profissional.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }
  const b = base30(e);
  if (!b.registro || b.registro.clube !== e.clube) b.registro = { clube: e.clube, desde: e.base30?.transferencias.length ? b.transferencias[b.transferencias.length - 1].t : e.tInicio };
  return rem;
}

/** Os clubes que podem querer este atleta (outro clube, porte igual ou maior; antes dos 14, só na própria cidade). */
function destinos(v: Vida, e: CarreiraEsportiva): { clube: string; municipioId: string; porte: Clube['porte'] | 'equipe' }[] {
  const i = idade(v);
  const pais = paisDaCidade(e.municipioId);
  const meu = PORTE[porteDe(e)];
  const ja = new Set([e.clube, ...base30(e).propostas.filter(p => v.t - p.t < 36).map(p => p.para)]);
  if (e.modalidade === 'futebol') {
    const aqui = clubesDaCidade(v.moradia.municipioId);
    const uf = municipio(e.municipioId).uf;
    const lista = i < 14 ? aqui : [...aqui, ...clubesDoPais(pais).filter(c => municipio(c.cidade).uf === uf), ...clubesDoPais(pais).filter(c => c.porte === 'grande')];
    const vistos = new Set<string>();
    return lista.filter(c => !ja.has(c.nome) && PORTE[c.porte] >= meu && !vistos.has(c.nome) && vistos.add(c.nome)).map(c => ({ clube: c.nome, municipioId: c.cidade, porte: c.porte }));
  }
  if (e.modalidade === 'tenis') return [];
  // As outras modalidades: a equipe de base de uma cidade com mais estrutura (a capital, os grandes centros).
  const cidades = i < 14 ? [v.moradia.municipioId] : [...new Set([capitalDoEstado(e.municipioId), ...grandesCentros(pais)])].filter(c => c !== e.municipioId);
  return cidades.map(c => ({ clube: nomeDeClube(c, `${v.id}:base30`, e.modalidade), municipioId: c, porte: 'equipe' as const })).filter(x => !ja.has(x.clube));
}

/**
 * O mercado do ano para quem está na base e foi bem (chamado no fim do ano de formação, depois da dispensa e do
 * contrato — quem foi dispensado ou recebeu contrato não recebe proposta de base). Abre UMA porta, com motivo.
 */
export function mercadoDaBase30(v: Vida, e: CarreiraEsportiva): Oportunidade | undefined {
  const i = idade(v);
  if (e.fase !== 'base' || e.modalidade === 'tenis' || e.origem === 'amador' || i < 12 || i > 18) return undefined;
  if (v.caminhos.oportunidades.some(o => o.tipo === 'base_transferencia')) return undefined;
  const b = base30(e);
  if (b.propostas.some(p => v.t - p.t < 18)) return undefined;
  const f = e.formacao ?? [];
  const ultimo = f[f.length - 1];
  if (!ultimo || ultimo.clube !== e.clube) return undefined;
  const r = rngDe(v.id, 'base30', v.t);
  // Quem chama atenção: a nota do ano, a titularidade, um título, a seleção de base, a promoção antecipada.
  const destaque = (ultimo.nota - 6.6) * 0.16 + (ultimo.titulo ? 0.08 : 0) + (e.adiantado26 !== undefined ? 0.06 : 0) + (ultimo.jogos > 0 ? ultimo.titular / ultimo.jogos - 0.6 : -0.3) * 0.15;
  if (!r.chance(clamp(destaque, 0, 0.35))) return undefined;
  const ds = destinos(v, e);
  if (!ds.length) return undefined;
  // O maior clube é o mais raro (e o que olha quem vai melhor).
  const pesos = ds.map(d => (d.porte === 'grande' ? (ultimo.nota >= 7.8 ? 1.4 : 0.4) : d.porte === 'tradicional' ? 1 : 0.8) * (d.municipioId === v.moradia.municipioId ? 1.3 : 1));
  let x = r.next() * pesos.reduce((s, p) => s + p, 0);
  let d = ds[0];
  for (let k = 0; k < ds.length; k++) { x -= pesos[k]; if (x <= 0) { d = ds[k]; break; } }
  const via: 'convite' | 'avaliacao' = ultimo.nota >= 8 || (PORTE[d.porte] <= PORTE[porteDe(e)] && ultimo.nota >= 7.3) ? 'convite' : 'avaliacao';
  const categoria = categoriaDaBase(v, e);
  const rem = remuneracaoDaBase30(v, e, d);
  const hoje = remuneracaoDaBase30(v, e);
  const longe = d.municipioId !== v.moradia.municipioId;
  const quem = e.modalidade === 'futebol' ? `${cap(oClube(d.clube))}` : cap(oClube(d.clube));
  const motivo = ultimo.titulo ? `o título do ${ultimo.competicao}` : e.adiantado26 !== undefined ? 'você jogar acima da idade' : `a temporada no ${categoria} (nota ${ultimo.nota.toLocaleString('pt-BR')})`;
  const oferta = rem.bolsa > 0 ? `${rem.rotulo.toLowerCase()} de ${dinheiro(rem.bolsa)} por mês${rem.ajuda ? ` e ajuda de custo de ${dinheiro(rem.ajuda)}` : ''}` : 'vaga na categoria, sem bolsa (a idade não permite)';
  const comparado = hoje.bolsa + hoje.ajuda > 0 ? ` Hoje, ${oClube(e.clube)} paga ${dinheiro(hoje.bolsa + hoje.ajuda)} por mês.` : '';
  const texto = via === 'convite'
    ? `${quem} viu ${motivo} e quer você no ${categoria}${longe ? `, em ${municipio(d.municipioId).nome} (alojamento do clube durante a semana)` : ''}: ${oferta}, ${listaNatural(rem.beneficios.slice(0, 3))}.${comparado} Aceitar transfere o registro ${doClube(e.clube)} para o novo clube.`
    : `${quem} chamou para uma semana de avaliação no ${categoria}${longe ? `, em ${municipio(d.municipioId).nome}` : ''}: se aprovar, ${oferta}. Não é garantia — é a chance de mostrar. Reprovar não tira você ${doClube(e.clube)}.`;
  const op = novaOportunidade(v, { tipo: 'base_transferencia', dominio: e.modalidade, meses: 6, chave: 'base30', clube: d.clube, municipioId: d.municipioId, salario: rem.bolsa || undefined,
    titulo: via === 'convite' ? `${quem} quer você na base` : `Avaliação ${doClube(d.clube)}`, texto });
  if (!op) return undefined;
  b.propostas.push({ op: op.id, t: v.t, de: e.clube, para: d.clube, municipioId: d.municipioId, porte: d.porte, categoria, via, remuneracao: rem, motivo });
  if (b.propostas.length > 8) b.propostas.shift();
  return op;
}

/** A proposta guardada desta porta. */
export function propostaDaPorta30(v: Vida, opId: string): PropostaDaBase30 | undefined {
  const e = v.caminhos.esporte;
  return e?.base30?.propostas.find(p => p.op === opId);
}

/** Pode aceitar? Só quem ainda está na base, no clube de onde a proposta partiu. */
export function podeAceitarBase30(v: Vida, opId: string): true | string {
  const e = v.caminhos.esporte;
  const p = propostaDaPorta30(v, opId);
  if (!e || !p) return 'A proposta já não vale.';
  if (e.fase !== 'base') return 'A proposta era para a base — e você já não está nela.';
  if (e.clube !== p.de) return `A proposta foi feita a quem estava ${doClube(p.de)}.`;
  return true;
}

/** Aceitar: o convite transfere; a avaliação é uma semana de treinos (passa ou não — e quem não passa continua onde estava). */
export function aceitarBase30(v: Vida, r: Rng, opId: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const e = v.caminhos.esporte!;
  const p = propostaDaPorta30(v, opId)!;
  if (p.via === 'avaliacao') {
    const f = e.formacao ?? [];
    const nota = f.length ? f[f.length - 1].nota : 6.5;
    const passa = r.chance(clamp(0.3 + (nota - 7) * 0.3 + (PORTE[porteDe(e)] - PORTE[p.porte]) * 0.1 + (v.corpo.forma - 65) / 200, 0.1, 0.85));
    if (!passa) {
      p.desfecho = 'reprovado';
      escrever(v, { fio: 'esporte', texto: `Fez a semana de avaliação ${doClube(p.para)} e não ficou: "falta um pouco ainda". Voltou para ${aEquipe(e.modalidade, e.clube)}, que não fechou a porta.`, relevancia: 'biografia', tema: 'lazer', tom: 'ruim', escolha: true });
      return { texto: 'Uma semana de treinos com gente melhor. Não deu desta vez — mas você viu de perto o que falta.', tom: 'neutro' };
    }
  }
  transferirNaBase30(v, e, p);
  return { texto: p.via === 'avaliacao' ? 'Aprovado na avaliação: o registro muda de clube.' : 'O registro muda de clube: a próxima temporada é lá.', tom: 'bom' };
}

/** A transferência em si: o registro, o clube, a cidade, a categoria — e a História. */
export function transferirNaBase30(v: Vida, e: CarreiraEsportiva, p: PropostaDaBase30): void {
  const b = base30(e);
  const de = e.clube;
  const deMunicipio = e.municipioId;
  b.transferencias.push({ t: v.t, idade: idade(v), de, para: p.para, deMunicipio, paraMunicipio: p.municipioId, categoria: p.categoria, via: p.via });
  p.desfecho = 'aceitou';
  e.clube = p.para;
  e.municipioId = p.municipioId;
  // A integração ao elenco profissional era do clube antigo; a promoção antecipada (jogar acima da idade) vai junto.
  e.integracao26 = undefined;
  b.registro = { clube: p.para, desde: v.t };
  const longe = p.municipioId !== v.moradia.municipioId;
  const texto = `Saiu ${doClube(de)} para ${aEquipe(e.modalidade, p.para)}, no ${p.categoria}${longe ? `, em ${municipio(p.municipioId).nome}: alojamento durante a semana, casa nos fins de semana` : ''}. O registro na federação foi junto.`;
  escrever(v, { fio: 'esporte', texto, relevancia: 'marco', tema: 'lazer', tom: 'bom', escolha: true });
  for (const x of pais(v)) lembrarCom(v, x.id, longe ? `A mudança para a base ${doClube(p.para)}, longe de casa.` : `A troca para a base ${doClube(p.para)}.`, 'escola', 2);
}

/** Recusar: fica dito (e, se o clube de agora souber, ele valoriza quem ficou). */
export function recusarBase30(v: Vida, opId: string): void {
  const p = propostaDaPorta30(v, opId);
  if (!p) return;
  p.desfecho = 'recusou';
  escrever(v, { fio: 'esporte', texto: `Recusou ${p.via === 'convite' ? 'o convite' : 'a avaliação'} ${doClube(p.para)}: ficou ${noClube(p.de)}.`, relevancia: 'cotidiano', tema: 'lazer', escolha: true });
}

/** A porta passou sem resposta: o desfecho fica na ficha. */
export function expirarPropostasBase30(v: Vida): void {
  const e = v.caminhos.esporte;
  if (!e?.base30) return;
  for (const p of e.base30.propostas) if (!p.desfecho && !v.caminhos.oportunidades.some(o => o.id === p.op)) p.desfecho = 'expirou';
}
