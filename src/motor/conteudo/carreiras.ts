/**
 * As perguntas das trajetórias profissionais que não são o trabalho de
 * agora: a licença que está acabando (voltar ao cargo ou deixá-lo). O jogo
 * pergunta ANTES de a porta fechar — nunca decide sozinho.
 */

import type { Conteudo, Ctx } from './base';
import { ocupacao } from '../dados/ocupacoes';
import { nomeOcupacao } from '../sistemas/trabalho';
import { encerrarPausada, licencaVencendo } from '../sistemas/paralelas';
import { propor } from '../sistemas/compromissos';
import { anoDe } from '../tempo';

const licenca = (c: Ctx) => { const k = licencaVencendo(c.v); return k >= 0 ? { k, p: c.v.trabalho.pausadas![k] } : undefined; };

export const CARREIRAS: Conteudo[] = [
  {
    id: 'par_licenca', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', prioritario: true, prioridade: 4, repetir: 0,
    quando: c => { const x = licenca(c); return !!x && c.v.fatos[`licenca_perguntada_${x.p.t}`] === undefined; },
    titulo: 'A licença está acabando',
    texto: c => {
      const x = licenca(c)!;
      c.v.fatos[`licenca_perguntada_${x.p.t}`] = c.v.t;
      const nome = nomeOcupacao(c.v, ocupacao(x.p.emprego.ocupacaoId));
      return `A licença sem salário do cargo de ${nome} termina em ${anoDe(x.p.licenca!.tAte)}. Voltar é retomar o cargo (com o que você faz hoje, a vida pergunta o que fazer); não voltar é deixar o cargo de vez.`;
    },
    opcoes: [
      { id: 'voltar', texto: 'Voltar ao cargo', consequencia: () => 'O cargo volta — com a estabilidade de antes.',
        resolver: c => { const x = licenca(c)!; const res = propor(c.v, c.r, { tipo: 'emprego', ocupacaoId: x.p.emprego.ocupacaoId, via: 'retorno', retoma: x.k }); return { texto: res === 'feito' ? 'De volta ao cargo.' : 'Voltar ao cargo não cabe junto com o que você faz hoje: a vida pergunta o que fazer.', memoria: null }; } },
      { id: 'deixar', texto: 'Deixar o cargo de vez', consequencia: () => 'O cargo fica para trás; a experiência, no currículo.',
        resolver: c => { const x = licenca(c)!; encerrarPausada(c.v, x.k, 'pediu exoneração ao fim da licença'); return { texto: 'Pediu exoneração. Uma porta fechada por escolha.', memoria: null }; } },
      { id: 'depois', texto: 'Decidir mais perto do fim', consequencia: c => `Se não voltar até ${anoDe(licenca(c)!.p.licenca!.tAte)}, o cargo acaba.`,
        resolver: () => ({ texto: 'A decisão ficou para depois — com prazo.', memoria: null }) }
    ]
  }
];
