/**
 * Sobrecarga: a vida maior do que a semana.
 *
 * NÃO é uma moeda de energia. Não há pontos para gastar: o que existe é a
 * semana CONCRETA (`sistemas/semana` — trabalho, estudo, treino, filhos,
 * deslocamento, quem precisa de cuidado, as atividades escolhidas), a cabeça,
 * a doença ou lesão em curso, o dinheiro que não fecha. Quando isso passa do
 * que cabe, a pessoa fica sobrecarregada; quando passa ANOS seguidos, cobra:
 *
 *   saúde (devagar, só se persiste) · recuperação de lesões · risco de se
 *   machucar · desempenho no trabalho · motivação nas atividades · a casa e
 *   os amigos (menos presença) · e, a certa altura, a vida pergunta
 *   (`sob_semana`): o que sai, o que diminui — ou seguir assim.
 *
 * O que reduz: descanso (menos compromissos), férias, rotina sustentável,
 * gente por perto. A tela "Sua semana" lê exatamente esta conta.
 */

import { clamp } from '../rng';
import type { Vida } from '../tipos';
import { idade, parceiro, vinculosVivos } from '../nucleo';
import { sobrecargaDaSemana } from './estado';
import { faixaDaSemana, PALAVRA_DA_FAIXA } from './semana';
import { seguranca } from './dinheiro';
import { ritmoDe } from './ritmo';
import { lesaoAtiva } from './lesoes';
import { listaNatural } from '../texto';

export type NivelSobrecarga = 0 | 1 | 2 | 3;

export interface LeituraSobrecarga {
  nivel: NivelSobrecarga;
  /** A palavra do TEMPO da semana (folgada · ocupada · cheia · sobrecarregada · no teto) — a mesma de
   *  `semana.folegoDaSemana` (FIX pós-playtest humano: o painel não pode dizer "cabe" com a lista dizendo que não). */
  palavra: string;
  /** O que mais pesa (em palavras). */
  causas: string[];
  /** Anos seguidos assim. */
  anos: number;
  /** A frase para a tela (a mesma que o motor usa para decidir). */
  texto: string;
}


/** A conta da sobrecarga agora (fonte única: motor e tela). */
export function leituraDaSobrecarga(v: Vida): LeituraSobrecarga {
  const i = idade(v);
  const s = sobrecargaDaSemana(v);
  const causas: string[] = [...s.rotulos.slice(0, 3)];
  let pontos = s.fixos * 2 + s.atividades * 1.4 + (s.apertada ? 0.7 : 0);
  if (v.mente.estresse >= 75) { pontos += 0.5; }
  const les = lesaoAtiva(v);
  if (les && les.lesao.gravidade >= 2) { pontos += 0.3; causas.push(les.lesao.cuidado === 'sacrificio' ? 'jogar machucado' : 'a recuperação da lesão'); }
  if (v.corpo.condicoes.some(c => !c.lesao && c.gravidade >= 2 && c.diagnosticada !== false)) { pontos += 0.3; causas.push('a doença'); }
  if (i >= 18 && seguranca(v).nivel === 'no_vermelho') { pontos += 0.35; causas.push('as contas'); }
  const e = v.trabalho.atual;
  if (e && ritmoDe(e) === 'puxado') pontos += 0.3;
  if (i < 10) pontos *= 0.5;
  const nivel: NivelSobrecarga = pontos < 0.3 ? 0 : pontos < 0.95 ? 1 : pontos < 1.9 ? 2 : 3;
  const anos = v.mente.sobrecarga?.anos ?? 0;
  const lista = listaNatural([...new Set(causas)].slice(0, 3));
  const texto = nivel === 0 ? 'A semana cabe na vida: sobra tempo para descansar.'
    : nivel === 1 ? `A semana está cheia${lista ? `: ${lista}` : ''}. Ainda cabe — por pouco.`
      : `${nivel === 3 ? 'No limite' : 'Sobrecarregada'}${lista ? `: ${lista}` : ''}.${anos >= 2 ? ` Há ${anos} anos assim — o corpo, o trabalho e quem está perto já sentem.` : anos === 1 ? ' Foi assim o ano passado inteiro.' : ''}`;
  return { nivel, palavra: PALAVRA_DA_FAIXA[faixaDaSemana(v)], causas: [...new Set(causas)], anos, texto };
}

/** Anos de sobrecarga que ainda pesam (0 = nada). */
export const anosDeSobrecarga = (v: Vida) => v.mente.sobrecarga?.anos ?? 0;

/** O peso na saúde: só quando persiste, e devagar. */
export function pesoDaSobrecargaNaSaude(v: Vida): { texto: string; efeito: number } | undefined {
  const anos = anosDeSobrecarga(v);
  if (anos < 2) return undefined;
  return { texto: 'anos de semana maior do que a vida', efeito: -0.35 * Math.min(4, anos - 1) };
}

/** O risco extra de se machucar (atleta, trabalho braçal) quando o corpo não descansa. */
export const fatorDeRiscoFisico = (v: Vida) => 1 + 0.12 * Math.min(4, anosDeSobrecarga(v));

/** O peso no desempenho do trabalho (0 a −4): cansaço erra. */
export function pesoNoDesempenho(v: Vida): number {
  const l = leituraDaSobrecarga(v);
  return l.nivel >= 2 ? -(l.nivel - 1) * 1.5 - Math.min(1, anosDeSobrecarga(v) * 0.3) : 0;
}

/**
 * O ano da sobrecarga: conta os anos seguidos e aplica o que a persistência
 * cobra. Roda depois de a semana do ano ter acontecido.
 */
export function processarSobrecarga(v: Vida): void {
  const l = leituraDaSobrecarga(v);
  const antes = v.mente.sobrecarga?.anos ?? 0;
  const anos = l.nivel >= 2 ? antes + 1 : l.nivel === 1 ? Math.max(0, antes - 1) : Math.max(0, antes - 2);
  v.mente.sobrecarga = anos > 0 ? { anos, t: v.t } : undefined;
  if (anos < 2) return;
  // Motivação: o que era prazer vira mais uma obrigação.
  for (const r of v.rotinas) { const f = v.caminhos.frentes[r.id as keyof typeof v.caminhos.frentes]; if (f) f.interesse = clamp(f.interesse - 3); }
  // A casa sente: menos presença, mais atrito com quem divide a vida.
  const par = parceiro(v);
  if (par?.vin.convivio.includes('casa')) par.vin.tensao = clamp(par.vin.tensao + 3);
  // Os amigos de fora do dia a dia: menos encontros.
  for (const { vin } of vinculosVivos(v)) {
    if (vin.parentesco || vin.romance || vin.convivio.length) continue;
    if (vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo') vin.proximidade = clamp(vin.proximidade - 2);
  }
  // A vida pergunta (no máximo de três em três anos): o que sai, o que diminui.
  const ultima = v.fatos['sob_perguntou'];
  if (l.nivel >= 2 && (ultima === undefined || v.t - ultima >= 36)) {
    v.fatos['sob_decidir'] = v.t;
    v.fatos['sob_perguntou'] = v.t;
  }
}
