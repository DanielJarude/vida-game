/**
 * REWORK 11 · Fase B (CAR-11.2) — AS INDICAÇÕES: o que uma porta de trabalho É para a carreira de agora.
 *
 * Antes, a indicação de um conhecido escolhia a vaga pela trilha DE QUEM INDICA (a amiga manicure indicava manicure)
 * e chamava tudo de "vaga compatível": o futebolista consolidado, sem clube por uns meses, recebia "manicure, por
 * conta própria", aceitava, e a carreira de atleta acabava em silêncio. Aqui:
 *
 *   distanciaDaCarreira   quão longe a ocupação fica do que a pessoa É (a carreira, a área, o nível, a renda)
 *   pontuarIndicacao      a vaga que faz sentido para quem RECEBE (estrada, formação, interesse, renda — e a distância)
 *   naturezaDaOportunidade emprego · mudança de carreira · por conta · ocasional (sociedade e investimento chegam como
 *                         acontecimentos próprios: `din10_sociedade`, `neg_comprar_parte` — não como porta)
 *   leituraDaOportunidade o que a tela diz antes de aceitar: o rótulo, se há entrevista, e o que acontece com a carreira
 *
 * Pura (sem RNG nem estado novo); o gerador (`oportunidades`) guarda a natureza na porta (`Oportunidade.natureza`).
 */

import type { NaturezaDaOportunidade, Oportunidade, Vida } from '../tipos';
import { ocupacaoOuNula, type Ocupacao } from '../dados/ocupacoes';
import { familiaDaTrilha } from '../dados/carreiras';
import { experienciaNaTrilha, nomeOcupacao, porContaPropria } from './trabalho';
import { carreiraEspecialAtiva, situacaoProfissional } from './situacaoProfissional';

/** Acima disto, a porta é outra carreira (dita como mudança, nunca como "vaga compatível"). */
export const LIMIAR_MUDANCA = 0.8;

/** As portas que levam à entrevista (quando não são por conta própria). */
const COM_ENTREVISTA: Oportunidade['tipo'][] = ['aprendiz', 'estagio', 'indicacao', 'vaga', 'proposta', 'reinsercao'];
const PORTAS_DE_TRABALHO: Oportunidade['tipo'][] = [...COM_ENTREVISTA, 'temporario'];

/** A renda de referência (o trabalho de agora, ou o último). */
function rendaDeReferencia(v: Vida): number {
  const e = v.trabalho.atual ?? v.trabalho.historico[v.trabalho.historico.length - 1];
  return e?.salario ?? 0;
}

/**
 * Quão longe `oc` fica da carreira de agora: 0 é a mesma trilha; ~0,25 a mesma família de ofício; ~0,6 outra área;
 * 1 é outra vida (a carreira especial — esporte, técnico, arte, farda, mandato — trocada por um ofício de outro setor).
 * A queda grande de nível e de renda afasta mais.
 */
export function distanciaDaCarreira(v: Vida, oc: Ocupacao): number {
  const sp = situacaoProfissional(v);
  const atual = sp.ocupacaoId ? ocupacaoOuNula(sp.ocupacaoId) : undefined;
  let d: number;
  if (!atual) d = experienciaNaTrilha(v, oc.trilha) >= 12 ? 0.2 : 0.4;
  else if (atual.trilha === oc.trilha) d = 0;
  else {
    d = familiaDaTrilha(atual.trilha).id === familiaDaTrilha(oc.trilha).id ? 0.25 : 0.6;
    // A carreira especial viva (com ou sem contrato): fora do próprio setor, é outra vida.
    if (carreiraEspecialAtiva(sp)) d = oc.setor === atual.setor ? Math.min(d, 0.45) : 1;
    const queda = atual.nivel - oc.nivel;
    if (queda >= 2) d += 0.1 * (queda - 1);
  }
  const ref = rendaDeReferencia(v);
  if (ref > 0 && oc.salario < ref * 0.4) d += 0.15;
  return Math.max(0, Math.min(1, d));
}

/** A nota de uma vaga para QUEM RECEBE a indicação: a estrada, a formação, o interesse, a renda — menos a distância. */
export function pontuarIndicacao(v: Vida, oc: Ocupacao): number {
  let p = Math.min(1, experienciaNaTrilha(v, oc.trilha) / 60) * 2;
  if (oc.area && v.educacao.concluidos.some(c => c.nivel !== 'livre' && oc.area!.includes(c.area as never))) p += 1.5;
  const dom = oc.habilidade?.dominio;
  if (dom) p += (v.caminhos.frentes[dom]?.interesse ?? 0) / 100;
  const ref = rendaDeReferencia(v);
  if (ref > 0) p += oc.salario >= ref * 0.9 ? 0.5 : oc.salario < ref * 0.5 ? -1 : 0;
  return p - distanciaDaCarreira(v, oc) * 2;
}

/** O que a porta é para a carreira de agora (o campo guardado, se houver; senão, deduzido — saves antigos). */
export function naturezaDaOportunidade(v: Vida, o: Pick<Oportunidade, 'tipo' | 'ocupacaoId' | 'natureza'>): NaturezaDaOportunidade {
  if (o.natureza) return o.natureza;
  if (!PORTAS_DE_TRABALHO.includes(o.tipo)) return 'propria';
  if (o.tipo === 'temporario') return 'ocasional';
  const oc = o.ocupacaoId ? ocupacaoOuNula(o.ocupacaoId) : undefined;
  if (!oc) return 'propria';
  if (distanciaDaCarreira(v, oc) >= LIMIAR_MUDANCA) return 'mudanca_carreira';
  return porContaPropria(oc) ? 'por_conta' : 'emprego';
}

export const ROTULO_NATUREZA: Record<NaturezaDaOportunidade, string> = {
  emprego: 'Indicação de emprego', mudanca_carreira: 'Mudança de carreira', por_conta: 'Atividade por conta própria', ocasional: 'Trabalho ocasional',
  sociedade: 'Proposta de sociedade', investimento: 'Investimento num negócio', propria: 'Uma porta'
};

export interface LeituraDaOportunidade {
  natureza: NaturezaDaOportunidade;
  rotulo: string;
  /** Aceitar leva à entrevista (vaga com patrão): falso para quem começa por conta. */
  entrevista: boolean;
  porConta: boolean;
  /** A via com que o motor trata o sim (a mesma que `aceitarOportunidade` usa). */
  via: string;
  /** Uma frase sobre a carreira de agora, dita antes do sim (só na mudança de carreira). */
  mudanca?: string;
}

export function leituraDaOportunidade(v: Vida, o: Oportunidade): LeituraDaOportunidade {
  const natureza = naturezaDaOportunidade(v, o);
  const oc = o.ocupacaoId ? ocupacaoOuNula(o.ocupacaoId) : undefined;
  const porConta = !!oc && porContaPropria(oc);
  const entrevista = !!oc && !porConta && COM_ENTREVISTA.includes(o.tipo);
  let mudanca: string | undefined;
  if (natureza === 'mudanca_carreira' && oc) {
    const sp = situacaoProfissional(v);
    mudanca = carreiraEspecialAtiva(sp) && sp.profissao
      ? `É outra carreira: ${nomeOcupacao(v, oc)} fica longe da de ${sp.profissao}${sp.semVinculo ? `, que continua sua mesmo ${sp.situacao === 'sem_clube' ? 'sem clube' : 'sem contrato'} agora` : ''}.`
      : `É outra carreira: ${nomeOcupacao(v, oc)} fica longe do que você faz hoje.`;
  }
  return { natureza, rotulo: ROTULO_NATUREZA[natureza], entrevista, porConta, via: o.tipo === 'indicacao' ? 'indicacao' : o.tipo, mudanca };
}
