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

export const vagaDaEntrevista = (c: Ctx): Ocupacao | undefined => OCUPACOES[c.v.fatos['entrevista_oc'] ?? -1];

function resolverEntrevista(c: Ctx, bonus: number): { texto: string; memoria: string | null; tom: 'bom' | 'ruim' } {
  const oc = vagaDaEntrevista(c);
  delete c.v.fatos['entrevista_oc'];
  if (!oc) return { texto: 'A vaga já tinha sido preenchida.', memoria: null, tom: 'ruim' };
  const base = elegibilidade(c.v, oc).chance ?? 0.4;
  const chance = clamp(base + bonus, 0.03, 0.95);
  if (c.r.chance(chance)) {
    const e = contratar(c.v, c.r, oc);
    return { texto: `Ligaram dois dias depois: a vaga é sua. ${nomeOcupacao(c.v, oc)} em ${e.empregador}, R$ ${e.salario.toLocaleString('pt-BR')} por mês.`, memoria: textoDeContratacao(c.v, oc, e), tom: 'bom' };
  }
  return { texto: 'O e-mail veio educado: "decidimos seguir com outro candidato".', memoria: null, tom: 'ruim' };
}

export const DESAFIOS: Conteudo[] = [
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
