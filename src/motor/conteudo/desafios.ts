/**
 * Desafios de vida: processos em que o desempenho importa.
 *
 * A entrevista de emprego não é um sorteio silencioso: o jogador escolhe
 * como se apresentar, e o resultado depende dessa escolha, da vaga e de
 * quem o personagem vem sendo (traços construídos, cognição, aparência).
 */

import type { Conteudo, Ctx } from './base';
import { OCUPACOES, type Ocupacao } from '../dados/ocupacoes';
import { contratar, elegibilidade, nomeOcupacao, textoDeContratacao } from '../sistemas/trabalho';
import { escrever } from '../nucleo';
import { clamp } from '../rng';

/** Como a pessoa chegou à entrevista (guardado como índice num fato). */
export const VIAS = ['curriculo', 'indicacao', 'estagio', 'aprendiz', 'proposta', 'vaga'];

export const vagaDaEntrevista = (c: Ctx): Ocupacao | undefined => OCUPACOES[c.v.fatos['entrevista_oc'] ?? -1];

function resolverEntrevista(c: Ctx, bonus: number): { texto: string; memoria: string | null; tom: 'bom' | 'ruim' } {
  const oc = vagaDaEntrevista(c);
  const porta = (c.v.fatos['entrevista_bonus'] ?? 0) / 100;
  const via = VIAS[c.v.fatos['entrevista_via'] ?? 0] ?? 'curriculo';
  delete c.v.fatos['entrevista_oc'];
  delete c.v.fatos['entrevista_bonus'];
  delete c.v.fatos['entrevista_via'];
  if (!oc) return { texto: 'A vaga já tinha sido preenchida.', memoria: null, tom: 'ruim' };
  const base = elegibilidade(c.v, oc).chance ?? 0.4;
  const chance = clamp(base + bonus + porta, 0.03, 0.95);
  if (c.r.chance(chance)) {
    const e = contratar(c.v, c.r, oc, via);
    return { texto: `Ligaram dois dias depois: a vaga é sua. ${nomeOcupacao(c.v, oc)} em ${e.empregador}, R$ ${e.salario.toLocaleString('pt-BR')} por mês.`, memoria: textoDeContratacao(c.v, oc, e), tom: 'bom' };
  }
  return { texto: 'O e-mail veio educado: "decidimos seguir com outro candidato".', memoria: null, tom: 'ruim' };
}

function resolverNegociacao(c: Ctx, bonus: number, arriscado: boolean): { texto: string; memoria: string | null; tom: 'bom' | 'ruim' } {
  const e = c.v.trabalho.atual;
  if (!e) return { texto: 'Não havia mais o que negociar.', memoria: null, tom: 'ruim' };
  const chance = clamp((e.desempenho - 40) / 60 + bonus, 0.05, 0.9);
  if (c.r.chance(chance)) {
    const pct = arriscado ? 0.15 : 0.08;
    e.salario = Math.round(e.salario * (1 + pct) / 10) * 10;
    const n = (c.v.fatos['aumentos'] ?? 0) + 1;
    c.v.fatos['aumentos'] = n;
    return { texto: `A chefia pensou dois dias e aprovou: o salário foi para R$ ${e.salario.toLocaleString('pt-BR')}.`, memoria: n === 1 ? `Negociou um aumento e conseguiu: R$ ${e.salario.toLocaleString('pt-BR')}.` : null, tom: 'bom' };
  }
  if (arriscado && c.r.chance(0.35)) {
    e.desempenho = clamp(e.desempenho - 10);
    return { texto: 'A resposta veio seca: "se tem proposta melhor, fique à vontade". O clima azedou.', memoria: null, tom: 'ruim' };
  }
  e.desempenho = clamp(e.desempenho - 2);
  return { texto: 'Disseram que não havia orçamento este ano. Talvez no próximo.', memoria: null, tom: 'ruim' };
}

export const DESAFIOS: Conteudo[] = [
  {
    id: 'trab_negociacao', tipo: 'decisao', idade: [16, 80], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'A conversa do aumento',
    texto: c => `Você marcou quinze minutos com a chefia${c.v.trabalho.atual ? ` em ${c.v.trabalho.atual.empregador}` : ''}. Sala fechada, café frio. É a sua vez de falar.`,
    opcoes: [
      { id: 'resultados', texto: 'Mostrar números: o que você entregou este ano', comportamento: { disciplina: 1 },
        resolver: c => ({ ...resolverNegociacao(c, 0.05 + Math.max(0, c.v.personalidade.tracos.disciplina) / 300, false), relevancia: 'biografia' }) },
      { id: 'proposta', texto: 'Dizer que tem uma proposta de fora', comportamento: { coragem: 1, impulsividade: 1 },
        resolver: c => ({ ...resolverNegociacao(c, c.v.personalidade.tracos.coragem / 250, true), relevancia: 'biografia' }) },
      { id: 'jeito', texto: 'Pedir com jeito, lembrando o tempo de casa', comportamento: { sociabilidade: 1 },
        resolver: c => ({ ...resolverNegociacao(c, c.v.personalidade.tracos.sociabilidade / 300 + Math.min(0.1, (c.v.t - (c.v.trabalho.atual?.tInicio ?? c.v.t)) / 600), false), relevancia: 'biografia' }) }
    ]
  },
  {
    id: 'trab_entrevista', tipo: 'decisao', idade: [14, 80], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => `Entrevista: ${vagaDaEntrevista(c) ? nomeOcupacao(c.v, vagaDaEntrevista(c)!) : 'vaga'}`,
    texto: c => {
      const oc = vagaDaEntrevista(c);
      const inicio = c.v.trabalho.historico.length === 0 && !c.v.trabalho.atual;
      return `Sala pequena, ar-condicionado forte. ${c.r.chance(0.5) ? 'A entrevistadora' : 'O entrevistador'} folheia seu currículo${inicio ? ' — quase em branco —' : ''} e pergunta por que deveriam escolher você${oc && oc.nivel >= 4 ? ' para liderar' : ''}.`;
    },
    opcoes: [
      {
        id: 'preparo', texto: 'Mostrar que estudou a empresa e a vaga', comportamento: { disciplina: 1 },
        resolver: c => {
          const b = 0.05 + Math.max(0, c.v.personalidade.tracos.disciplina) / 300 + (c.v.mente.cognicao - 50) / 400;
          const r = resolverEntrevista(c, b);
          return { ...r, relevancia: r.tom === 'bom' ? 'marco' : 'cotidiano', memoria: r.memoria ?? null };
        }
      },
      {
        id: 'confianca', texto: 'Vender seu peixe com confiança', comportamento: { coragem: 1 },
        resolver: c => {
          const b = 0.02 + c.v.personalidade.tracos.sociabilidade / 250 + (c.v.corpo.aparencia - 50) / 300 + c.v.personalidade.tracos.coragem / 400;
          const r = resolverEntrevista(c, b);
          return { ...r, relevancia: r.tom === 'bom' ? 'marco' : 'cotidiano', memoria: r.memoria ?? null };
        }
      },
      {
        id: 'sinceridade', texto: 'Ser sincero sobre o que ainda não sabe',
        resolver: c => {
          const oc = vagaDaEntrevista(c);
          const b = oc && oc.nivel <= 2 ? 0.08 : -0.06;
          const r = resolverEntrevista(c, b);
          return { ...r, relevancia: r.tom === 'bom' ? 'marco' : 'cotidiano', memoria: r.memoria ?? null };
        }
      }
    ]
  }
];

void escrever;
