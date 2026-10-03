/**
 * Estresse prolongado (REWORK 4): a vida que cobra.
 *
 * "Você pode tentar. A questão é quanto essa vida vai cobrar de você." A semana
 * maior do que cabe (faculdade + trabalho, dois empregos, filhos e plantão) já
 * sobe o estresse do ano (`estado.fatoresCabeca`) e a sobrecarga
 * (`sobrecarga`). Aqui, o que acontece quando a cabeça fica NO LIMITE ano após
 * ano: conta os anos, e a conta passa para o corpo — causal, nunca automática:
 *
 *   - hábitos: quem já bebe socialmente pode passar a beber demais;
 *   - condição existente: a pressão alta sem tratamento piora;
 *   - risco de morte: só com o corpo vulnerável (`corpo.fatorDoEstresseProlongado`);
 *   - a Linha da Vida registra quando vira um modo de viver.
 * Descansar (menos compromissos, férias, uma viagem longa) desfaz devagar.
 */

import type { Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { escrever, idade } from '../nucleo';

export const LIMITE_DO_ESTRESSE = 70;

export function processarEstresseProlongado(v: Vida): void {
  if (idade(v) < 14) return;
  const alto = v.mente.estresse >= LIMITE_DO_ESTRESSE;
  const antes = v.mente.estresseAlto?.anos ?? 0;
  const anos = alto ? antes + 1 : Math.max(0, antes - 2);
  v.mente.estresseAlto = anos > 0 ? { anos, t: v.t } : undefined;
  if (!alto) return;
  const r = rngDe(v.id, 'estresse_prolongado', v.t);
  if (anos === 3 && v.fatos['estresse_3anos'] === undefined) {
    v.fatos['estresse_3anos'] = v.t;
    escrever(v, { texto: 'Três anos seguidos com a cabeça no limite. Dormir mal virou costume; o corpo começou a mandar a conta.', relevancia: 'biografia', tema: 'saude', tom: 'ruim' });
  }
  if (anos >= 2 && v.corpo.habitos.bebe === 'social' && r.chance(0.08)) {
    v.corpo.habitos.bebe = 'muito';
    escrever(v, { texto: 'A cerveja do fim do dia virou a de todo dia — e depois mais de uma.', relevancia: 'biografia', tema: 'saude', tom: 'ruim' });
  }
  if (anos >= 3) {
    const pressao = v.corpo.condicoes.find(c => c.id === 'hipertensao' && !c.tratando && c.gravidade < 3);
    if (pressao && r.chance(0.18)) {
      pressao.gravidade += 1;
      v.corpo.saude = clamp(v.corpo.saude - 3);
      escrever(v, { texto: 'A pressão subiu de novo — e desta vez o médico falou sério.', relevancia: 'cotidiano', tema: 'saude', tom: 'ruim' });
    }
  }
}
