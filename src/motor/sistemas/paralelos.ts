/**
 * REWORK 12.2 — OS MERCADOS PARALELOS: onde se compra sem saber direito de onde veio.
 *
 * Há graus. A FEIRA DE ANTIGUIDADES é legal — e nela há de tudo: a peça boa e barata, a cópia, de vez em quando a
 * roubada. O ANTIQUÁRIO DOS PAPÉIS VAGOS também é legal, e pergunta pouco. A NEGOCIAÇÃO PRIVADA de origem incerta
 * aparece para quem tem dinheiro. O MERCADO POR FORA (bens de procedência duvidosa, o leilão sem catálogo) só existe
 * para quem já tem gente no Submundo.
 *
 * Barato não é sinônimo de crime, e caro não é garantia. Cada oferta tem uma verdade escondida (legítima,
 * falsificada, roubada, entrada sem nota) e sinais (o preço contra o de mercado, os papéis, o vendedor). O jogador
 * pode investigar (custa, e acerta quase sempre — não sempre), comprar, recusar ou denunciar. A conta, em média,
 * não fecha a favor de quem compra sem perguntar: a cópia vale nada, a roubada é apreendida, e quem comprou sabendo
 * responde por isso.
 *
 * Os ANIMAIS oferecidos por fora não viram produto: aparecem como situação — recusar, denunciar (o resgate) e, para
 * quem tem um zoológico com recinto, acolher o animal resgatado. Nada aqui ensina como se faz coisa alguma.
 */

import type { Colecionavel, Especie, Vida } from '../tipos';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import { escrever, idade, marcarFato } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { economiaLocal, municipio } from '../dados/lugares';
import { PECAS_DE_COLECAO, type PecaDeColecao } from '../dados/colecionaveis';
import { okDePagar, patrimonio } from './dinheiro';
import { ativo } from './ilicito';
import { contatosAtivos, lembrarOrg, orgPorId, anotar } from './submundo';
import { abrirProcesso } from './justica';
import { colecao, soltarUnica } from './colecao';
import { empresasAtivas } from './empresas';
import { podeReceberAnimal, receberAnimalDeEstimacao } from './setores';
import { especieDeZoo } from '../dados/setores';

export type MercadoParalelo = 'feira' | 'antiquario_vago' | 'privada_incerta' | 'por_fora';
export type Origem = 'legitima' | 'falsificada' | 'roubada' | 'sem_nota';

export const MERCADOS_PARALELOS: Record<MercadoParalelo, { nome: string; frase: string; legal: boolean; origens: [Origem, number][]; preco: [number, number] }> = {
  feira: { nome: 'Feira de antiguidades', frase: 'Domingo de manhã, lona no chão, de tudo um pouco. Às vezes um achado; às vezes, uma cópia; raramente, coisa que alguém procura.', legal: true, origens: [['legitima', 0.62], ['falsificada', 0.3], ['roubada', 0.08]], preco: [0.45, 0.8] },
  antiquario_vago: { nome: 'Antiquário dos papéis vagos', frase: 'Peças boas, perguntas poucas. "Veio de um espólio" é a resposta para quase tudo.', legal: true, origens: [['legitima', 0.55], ['falsificada', 0.22], ['roubada', 0.18], ['sem_nota', 0.05]], preco: [0.55, 0.85] },
  privada_incerta: { nome: 'Negociação privada', frase: 'Um intermediário bem vestido, um apartamento, uma peça que "não pode ir a leilão por questões de família".', legal: true, origens: [['legitima', 0.45], ['falsificada', 0.2], ['roubada', 0.2], ['sem_nota', 0.15]], preco: [0.6, 0.88] },
  por_fora: { nome: 'O mercado por fora', frase: 'Um salão nos fundos, um leilão sem catálogo, peças sem papel nenhum para quem não pergunta.', legal: false, origens: [['legitima', 0.1], ['falsificada', 0.22], ['roubada', 0.5], ['sem_nota', 0.18]], preco: [0.3, 0.55] }
};

export interface OfertaParalela {
  id: string;
  mercado: MercadoParalelo;
  pecaId: string;
  nome: string;
  /** O que a peça valeria se fosse o que dizem (o mercado legal). */
  valorDeMercado: number;
  preco: number;
  /** O que se vê: o vendedor, os papéis, o preço. */
  sinais: string[];
  /** A verdade (escondida da tela até alguém investigar). */
  origem: Origem;
}

const grande = (id: string) => ['metropole', 'capital'].includes(municipio(id).perfil);

/** Os mercados que esta vida enxerga hoje (o por fora, só com gente no caminho). */
export function mercadosVisiveis(v: Vida): MercadoParalelo[] {
  if (idade(v) < 18) return [];
  const onde = v.moradia.municipioId;
  const out: MercadoParalelo[] = ['feira'];
  if (grande(onde)) out.push('antiquario_vago');
  if (grande(onde) && patrimonio(v) >= 2_000_000) out.push('privada_incerta');
  if (ativo(v) && contatosAtivos(v).length > 0) out.push('por_fora');
  return out;
}

function pecasDoMercado(m: MercadoParalelo): PecaDeColecao[] {
  const faixa = m === 'privada_incerta' ? [2, 3, 4] : m === 'por_fora' ? [1, 2, 3] : [1, 2];
  return PECAS_DE_COLECAO.filter(p => !p.canal && !p.unica && !p.modelo && faixa.includes(p.faixa ?? 1) && p.categoria !== 'memorabilia');
}

const SINAIS: Record<Origem, string[]> = {
  legitima: ['o vendedor conta a história da peça sem tropeçar', 'há uma nota antiga, amarelada, mas legível', 'o preço é baixo porque o vendedor tem pressa'],
  falsificada: ['o acabamento parece novo demais para a idade', 'o vendedor jura, mas não mostra papel', 'o preço é bom demais'],
  roubada: ['o vendedor não sabe dizer de onde veio', 'a peça está sem a caixa e sem os papéis', 'o preço é bom demais', 'pedem pagamento em dinheiro, sem nota'],
  sem_nota: ['a peça veio "de fora", sem nota de importação', 'o vendedor pede discrição']
};

/** As ofertas do ano num mercado (determinísticas: voltar ao mercado mostra as mesmas). */
export function ofertasParalelas(v: Vida, m: MercadoParalelo): OfertaParalela[] {
  if (!mercadosVisiveis(v).includes(m)) return [];
  const onde = v.moradia.municipioId;
  const ano = anoDe(v.t);
  const r = rngDe(v.economia?.semente ?? 1, 'paralelo', m, ano, onde);
  const cfg = MERCADOS_PARALELOS[m];
  const k = economiaLocal(onde).custo;
  const pool = pecasDoMercado(m);
  const out: OfertaParalela[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const p = r.pick(pool);
    const origem = r.weighted(cfg.origens, x => x[1])![0];
    const valorDeMercado = Math.round(p.preco * p.retencao * k / 100) * 100;
    const fator = cfg.preco[0] + r.next() * (cfg.preco[1] - cfg.preco[0]);
    // O sinal que se vê: quase sempre um da verdade; às vezes, um que engana (a peça boa que parece duvidosa e vice-versa).
    const verdade = r.chance(0.7) ? origem : r.pick(['legitima', 'falsificada', 'roubada'] as Origem[]);
    const sinais = [r.pick(SINAIS[verdade]), fator < 0.5 ? 'o preço é bem abaixo do que se vê nas lojas' : 'o preço é um pouco abaixo do de mercado'];
    out.push({ id: `pp-${m}-${ano}-${i}`, mercado: m, pecaId: p.id, nome: p.nome, valorDeMercado, preco: Math.round(Math.max(100, p.preco * k * fator) / 100) * 100, sinais, origem });
  }
  return out;
}

export const ofertaParalela = (v: Vida, id: string) => (mercadosVisiveis(v).flatMap(m => ofertasParalelas(v, m))).find(o => o.id === id);
const investigada = (v: Vida, id: string) => v.fatos[`pp_inv_${id}`];
/** O que a investigação disse (0 nada a apontar, 1 cópia, 2 roubada, 3 sem nota) — com erro possível. */
export function resultadoDaInvestigacao(v: Vida, o: OfertaParalela): Origem | undefined {
  if (investigada(v, o.id) === undefined) return undefined;
  const r = rngDe(v.id, 'investiga', o.id);
  return r.chance(0.82) ? o.origem : r.pick(['legitima', 'falsificada', 'roubada'] as Origem[]);
}
export const custoDeInvestigar = (v: Vida, o: OfertaParalela) => Math.round(Math.max(600 * economiaLocal(v.moradia.municipioId).custo, o.valorDeMercado * 0.03) / 100) * 100;

export type OqueParalelo = 'investigar' | 'comprar' | 'denunciar';

export function disponibilidadeParalelo(v: Vida, id: string, oque: OqueParalelo): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] }; ilegal?: boolean } {
  const o = ofertaParalela(v, id);
  if (!o) return { ok: false, motivo: 'A peça não está mais lá.' };
  if (v.fatos[`pp_feito_${id}`] !== undefined) return { ok: false, motivo: 'Já resolvido.' };
  if (oque === 'investigar') return investigada(v, id) !== undefined ? { ok: false, motivo: 'Já investigou.' } : okDePagar(v, custoDeInvestigar(v, o), 'Um especialista cobra');
  if (oque === 'denunciar') return { ok: true };
  return { ...okDePagar(v, o.preco, 'Custa'), ...(o.mercado === 'por_fora' ? { ilegal: true } : {}) };
}

export function executarParalelo(v: Vida, id: string, oque: OqueParalelo): { texto: string; tom?: 'bom' | 'ruim' } {
  const o = ofertaParalela(v, id)!;
  const cap = o.nome.charAt(0).toUpperCase() + o.nome.slice(1);
  if (oque === 'investigar') {
    v.financas.conta -= custoDeInvestigar(v, o);
    v.fatos[`pp_inv_${id}`] = v.t;
    const res = resultadoDaInvestigacao(v, o)!;
    return { texto: res === 'legitima' ? `O especialista não achou nada de errado: ${o.nome} parece ser o que dizem.` : res === 'falsificada' ? `O especialista balançou a cabeça: ${o.nome} é cópia — boa, mas cópia.` : res === 'roubada' ? `O especialista achou ${o.nome} numa lista de peças procuradas. Comprar agora é comprar sabendo.` : `${cap} entrou no país sem nota: comprar é ficar com o problema.`, tom: res === 'legitima' ? 'bom' : 'ruim' };
  }
  v.fatos[`pp_feito_${id}`] = v.t;
  if (oque === 'denunciar') {
    const tinha = o.origem === 'roubada' || o.origem === 'sem_nota' || o.origem === 'falsificada';
    // Quem tem gente no caminho e denuncia o mercado por fora: o caminho fica sabendo.
    if (o.mercado === 'por_fora') {
      const e = v.caminhos.envolvimento;
      const c = contatosAtivos(v)[0];
      if (e && c) { const f = e.fichas![c.id]; f.confianca = clamp(f.confianca - 25); const org = f.organizacao ? orgPorId(v, f.organizacao) : undefined; if (org) lembrarOrg(org, v.t, 'traicao', -15); anotar(v, `Denunciou o mercado por fora: ${v.pessoas[c.id].nome} desconfia.`, 'ruim'); }
    }
    marcarFato(v, 'denunciou_mercado');
    return { texto: tinha ? `A denúncia foi adiante: dias depois, a polícia apreendeu ${o.nome} e outras peças. Você não ganhou nada — a não ser saber.` : 'A polícia foi ver e não achou nada de errado: a peça era o que dizia ser. Fica o registro.', tom: tinha ? 'bom' : undefined };
  }
  // Comprar.
  v.financas.conta -= o.preco;
  const res = resultadoDaInvestigacao(v, o);
  const sabendo = res === 'roubada' || res === 'sem_nota' || o.mercado === 'por_fora';
  const p = PECAS_DE_COLECAO.find(x => x.id === o.pecaId)!;
  const peca: Colecionavel = {
    id: `cl${v.seq++}`, pecaId: p.id, nome: o.nome, categoria: p.categoria, raridade: p.raridade, procedencia: 'paralelo', certificado: false, estado: rngDe(v.id, 'pp-estado', id).int(55, 88),
    valor: o.origem === 'falsificada' ? Math.max(100, Math.round(o.preco * 0.08 / 100) * 100) : Math.round(o.valorDeMercado * 0.85 / 100) * 100,
    precoPago: o.preco, tCompra: v.t, autenticidade: res === 'legitima' ? 'presumida' : 'duvidosa',
    ...(o.origem === 'falsificada' ? { falsa: true } : {}), ...(o.origem === 'roubada' ? { roubada: true } : {}),
    historia: [{ t: v.t, texto: `Comprad${p.artigo.startsWith('a') ? 'a' : 'o'} ${MERCADOS_PARALELOS[o.mercado].nome.toLowerCase().replace(/^o /, 'n')} por ${fmt(o.preco)}, sem papel.` }]
  };
  // A falsificada, a tela ainda não sabe: mostra o valor do que dizem que é (até alguém autenticar ou vender).
  if (o.origem === 'falsificada') { peca.valor = Math.round(o.valorDeMercado * 0.85 / 100) * 100; }
  (v.financas.colecao ??= []).push(peca);
  if (sabendo) {
    const e = v.caminhos.envolvimento;
    if (e) { e.receptacao = (e.receptacao ?? 0) + o.preco; e.exposicao = clamp(e.exposicao + 3); }
    else v.fatos['receptacao_consciente'] = v.t;
  }
  return { texto: `${cap} é seu, por ${fmt(o.preco)}. Sem papel — o que ela é de verdade, o tempo (ou um especialista) vai dizer.`, tom: undefined };
}

/**
 * O ano das peças compradas por fora: a roubada é procurada (às vezes acham); quem comprou sabendo responde. A peça
 * apreendida volta a quem era; o dinheiro pago não volta.
 */
export function processarParalelos(v: Vida, r: Rng): void {
  for (const c of colecao(v).filter(x => x.roubada)) {
    const rr = rngDe(v.id, 'apreensao-peca', c.id, v.t);
    if (!rr.chance(0.1 + (v.caminhos.envolvimento?.exposicao ?? 0) / 500)) continue;
    v.financas.colecao = colecao(v).filter(x => x.id !== c.id);
    soltarUnica(v, c);
    const sabia = (v.caminhos.envolvimento?.receptacao ?? 0) > 0 || v.fatos['receptacao_consciente'] !== undefined;
    escrever(v, { texto: `A polícia bateu à porta por causa de ${c.nome}: era roubada. A peça foi apreendida e devolvida a quem era; os ${fmt(c.precoPago)} pagos, perdidos.${sabia ? ' E a pergunta veio: você sabia?' : ''}`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    if (sabia && rr.chance(0.35) && !v.justica?.processo && !v.justica?.prisao) abrirProcesso(v, r, 'patrimonial');
    else if (sabia && v.caminhos.envolvimento) v.caminhos.envolvimento.exposicao = clamp(v.caminhos.envolvimento.exposicao + 10);
  }
}

/* ------------------------------------------------------------------ animais oferecidos por fora */

export interface OfertaDeAnimal { id: string; bicho: string; especie: Especie | 'outro'; zoo?: string; texto: string }

const ANIMAIS_POR_FORA: Omit<OfertaDeAnimal, 'id'>[] = [
  { bicho: 'um filhote de papagaio', especie: 'papagaio', zoo: 'papagaio', texto: 'tirado do ninho, sem anilha, numa caixa de sapato' },
  { bicho: 'um filhote de arara-azul', especie: 'outro', zoo: 'arara_azul', texto: 'de uma espécie ameaçada — "é raríssimo, por isso o preço"' },
  { bicho: 'dois jabutis pequenos', especie: 'jabuti', zoo: 'jabuti', texto: 'pegos no mato, "mais baratos que em loja"' },
  { bicho: 'um sagui', especie: 'outro', texto: 'que "já vem mansinho" — nenhum criadouro vende primata' },
  { bicho: 'uma serpente exótica', especie: 'outro', zoo: 'piton_real', texto: 'que entrou no país escondida, "sem papel, mas saudável"' }
];

/** A situação do ano (uma, às vezes): quem tem gente no Submundo ou frequenta a feira ouve uma oferta. Nunca é produto. */
export function ofertaDeAnimalPorFora(v: Vida): OfertaDeAnimal | undefined {
  if (idade(v) < 18 || !mercadosVisiveis(v).length) return undefined;
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'animal-por-fora', ano);
  if (!r.chance(ativo(v) ? 0.5 : 0.2)) return undefined;
  return { ...r.pick(ANIMAIS_POR_FORA), id: `apf-${ano}` };
}

/** Os seus zoológicos que podem acolher o animal resgatado (recinto, vaga). */
export function zoologicosParaResgate(v: Vida, o: OfertaDeAnimal) {
  if (!o.zoo || !especieDeZoo(o.zoo)) return [];
  return empresasAtivas(v).filter(e => e.tipo === 'zoologico' && e.papel !== 'investidor' && e.setor?.zoo).filter(e => !podeReceberAnimal(e, o.zoo!, true));
}

export type OqueAnimalPorFora = 'recusar' | 'denunciar' | 'acolher';

export function disponibilidadeAnimalPorFora(v: Vida, oque: OqueAnimalPorFora, empresaId?: string): { ok: boolean; motivo?: string } {
  const o = ofertaDeAnimalPorFora(v);
  if (!o) return { ok: false, motivo: 'Não há oferta este ano.' };
  if (v.fatos[`apf_${o.id}`] !== undefined) return { ok: false, motivo: 'Já resolvido.' };
  if (oque === 'acolher') {
    if (v.fatos[`apf_den_${o.id}`] === undefined) return { ok: false, motivo: 'Primeiro, a denúncia (o resgate é do órgão ambiental).' };
    if (!zoologicosParaResgate(v, o).some(e => e.id === empresaId)) return { ok: false, motivo: 'O seu zoológico não tem recinto adequado com vaga.' };
    return { ok: true };
  }
  if (oque === 'denunciar' && v.fatos[`apf_den_${o.id}`] !== undefined) return { ok: false, motivo: 'Já denunciou.' };
  return { ok: true };
}

export function executarAnimalPorFora(v: Vida, oque: OqueAnimalPorFora, empresaId?: string): { texto: string; tom?: 'bom' | 'ruim' } {
  const o = ofertaDeAnimalPorFora(v)!;
  if (oque === 'recusar') { v.fatos[`apf_${o.id}`] = v.t; return { texto: `Você recusou. ${o.bicho.charAt(0).toUpperCase() + o.bicho.slice(1)} ficou na caixa — e com o vendedor.` }; }
  if (oque === 'denunciar') {
    v.fatos[`apf_den_${o.id}`] = v.t;
    marcarFato(v, 'denunciou_trafico');
    const e = v.caminhos.envolvimento;
    const c = contatosAtivos(v)[0];
    if (e && c) { e.fichas![c.id].confianca = clamp(e.fichas![c.id].confianca - 15); anotar(v, 'Denunciou uma oferta de animal: o caminho desconfia.', 'ruim'); }
    escrever(v, { texto: `Você denunciou a oferta de ${o.bicho}. A polícia ambiental apreendeu o animal e o levou para triagem.`, relevancia: 'cotidiano', tema: 'casa', tom: 'bom' });
    const zoos = zoologicosParaResgate(v, o);
    return { texto: `A polícia ambiental apreendeu ${o.bicho} e o levou para triagem.${zoos.length ? ' O órgão pergunta se o seu zoológico pode acolher o resgatado.' : ''}`, tom: 'bom' };
  }
  // Acolher no zoológico: o animal resgatado entra como indivíduo, com a história de onde veio.
  v.fatos[`apf_${o.id}`] = v.t;
  const em = empresasAtivas(v).find(x => x.id === empresaId)!;
  const x = especieDeZoo(o.zoo!)!;
  const r = rngDe(v.id, 'resgate', o.id);
  const a = receberAnimalDeEstimacao(v, em, x.id, r.pick(x.nomes), r.chance(0.5) ? 'masculino' : 'feminino', v.t - 12, 55, `resgate-${o.id}`, `Resgatado do tráfico em ${anoDe(v.t)}, depois de uma denúncia.`);
  if (a) a.origem = 'resgate';
  em.reputacao = clamp(em.reputacao + 3);
  return { texto: `${a?.nome ?? 'O animal'} chegou ao ${em.nome} depois da triagem: magro, assustado, vivo. Recinto, veterinário, tempo.`, tom: 'bom' };
}
