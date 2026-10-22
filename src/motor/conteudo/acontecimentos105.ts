/**
 * REWORK 10.5 — os acontecimentos novos do pacote de coerência: o que a vida pergunta quando um sistema novo muda o
 * estado (a parceria que traiu, descoberta). Regras da casa do REWORK 10: papéis `fixo` (não gastam o gerador do ano),
 * `quando` sem sorteio, nenhuma resposta cosmética.
 */

import type { Conteudo } from './base';
import { fixo } from './papeis';
import { lembrarCom, parceiro } from '../nucleo';
import { clamp } from '../rng';
import { terminar } from '../sistemas/romance';
import { registrarTentativa, sincronizarMagoa } from '../sistemas/magoas';

const ela = (g: string) => (g === 'feminino' ? 'ela' : g === 'masculino' ? 'ele' : 'elu');

export const ACONTECIMENTOS_105: Conteudo[] = [
  {
    // REL-06: a parceria teve alguém fora do combinado — e você descobriu (`afetos.processarAfetos`).
    id: 'rom105_infiel', tipo: 'decisao', idade: [18, 100], tema: 'amor', prioritario: true, prioridade: 8, repetir: 0,
    papeis: { par: fixo(v => { const x = parceiro(v); return x ? [x.p] : []; }) },
    // Fica esperando até ser respondida (um ano ocupado por outra decisão não apaga o que você descobriu).
    quando: c => { const inf = c.v.vinculos[c.p.par.id]?.romance?.infiel; return !!inf?.descoberto && inf.respondido === undefined; },
    titulo: 'O que você descobriu',
    texto: c => `Uma mensagem que não era para você ver, um nome repetido demais, uma desculpa que não fechava: ${c.p.par.nome} tem outra pessoa. ${ela(c.p.par.genero).charAt(0).toUpperCase() + ela(c.p.par.genero).slice(1)} ainda não sabe que você sabe.`,
    opcoes: [
      {
        id: 'conversar', texto: 'Falar tudo e ouvir o que tem a dizer', comportamento: { coragem: 1 },
        resolver: c => {
          const vin = c.v.vinculos[c.p.par.id];
          const rom = vin.romance;
          const fica = clamp(((rom?.envolvimento ?? 50) - 30) / 100 + c.p.par.temperamento.afabilidade * 0.15, 0.1, 0.75);
          if (rom?.infiel) rom.infiel.respondido = c.v.t;
          sincronizarMagoa(vin);
          if (c.r.chance(fica)) {
            if (rom) { delete rom.infiel; rom.envolvimento = clamp(rom.envolvimento + 4); }
            registrarTentativa(vin, c.v.t, 'outro', 'aceita');
            return { texto: `${c.p.par.nome} chorou, admitiu, disse que acabou. Vocês ficaram — com a confiança no chão e muita conversa pela frente.`, memoria: `Descobriu que ${c.p.par.nome} tinha outra pessoa. Conversaram, e ficaram juntos.`, relevancia: 'marco', tom: 'ruim', evento: { tipo: 'traicao_descoberta', pessoaId: c.p.par.id, peso: 60 } };
          }
          terminar(c.v, c.p.par, vin, 'ela', 'traicao');
          return { texto: `A conversa não chegou a lugar nenhum. ${c.p.par.nome} escolheu a outra pessoa.`, memoria: `Descobriu que ${c.p.par.nome} tinha outra pessoa — e foi deixad${c.v.eu.genero === 'feminino' ? 'a' : 'o'} por isso.`, relevancia: 'marco', tom: 'ruim', evento: { tipo: 'ruptura', pessoaId: c.p.par.id, peso: 70 } };
        }
      },
      {
        id: 'ultimato', texto: c => `Exigir que ${c.p.par.nome} termine com a outra pessoa`, comportamento: { independencia: 1 },
        resolver: c => {
          const vin = c.v.vinculos[c.p.par.id];
          const rom = vin.romance;
          const aceita = clamp(((rom?.envolvimento ?? 50) - 25) / 90 + c.p.par.temperamento.responsabilidade * 0.1, 0.1, 0.8);
          sincronizarMagoa(vin);
          if (rom?.infiel) rom.infiel.respondido = c.v.t;
          if (c.r.chance(aceita)) {
            if (rom) delete rom.infiel;
            vin.tensao = clamp(vin.tensao + 5);
            lembrarCom(c.v, c.p.par.id, 'Terminou com a outra pessoa depois do seu ultimato.', 'conflito', 2);
            return { texto: `${c.p.par.nome} terminou com a outra pessoa na sua frente, por telefone. O "nunca mais" ficou dito; o resto, o tempo diz.`, memoria: `Deu um ultimato a ${c.p.par.nome} depois da traição — e ficaram.`, relevancia: 'marco', tom: 'ruim' };
          }
          terminar(c.v, c.p.par, vin, 'ela', 'traicao');
          return { texto: `${c.p.par.nome} não aceitou o ultimato. Foi embora.`, memoria: `Deu um ultimato a ${c.p.par.nome} depois da traição — e acabou.`, relevancia: 'marco', tom: 'ruim', evento: { tipo: 'ruptura', pessoaId: c.p.par.id, peso: 70 } };
        }
      },
      {
        id: 'terminar', texto: 'Terminar', comportamento: { independencia: 1 },
        resolver: c => {
          const vin = c.v.vinculos[c.p.par.id];
          terminar(c.v, c.p.par, vin, 'jogador', 'traicao');
          return { texto: `Você não quis ouvir explicação. Acabou ali.`, memoria: `Terminou com ${c.p.par.nome} ao descobrir a traição.`, relevancia: 'marco', tom: 'ruim', evento: { tipo: 'ruptura', pessoaId: c.p.par.id, peso: 70 } };
        }
      },
      {
        id: 'calar', texto: 'Não dizer nada, por enquanto',
        resolver: c => {
          const vin = c.v.vinculos[c.p.par.id];
          if (vin.romance?.infiel) vin.romance.infiel.respondido = c.v.t;
          c.v.mente.estresse = clamp(c.v.mente.estresse + 10);
          c.v.mente.felicidade = clamp(c.v.mente.felicidade - 6);
          sincronizarMagoa(vin);
          return { texto: `Você guardou o que sabe. Em casa, tudo igual — menos você.`, memoria: `Descobriu que ${c.p.par.nome} tinha outra pessoa, e não disse nada.`, relevancia: 'biografia', tom: 'ruim' };
        }
      }
    ]
  }
];
