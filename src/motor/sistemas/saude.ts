/**
 * Saúde jogável: sinal → percepção → cuidado (ou não) → diagnóstico →
 * tratamento → evolução → recuperação, controle ou consequência.
 *
 * Uma condição crônica nasce SEM NOME (`diagnosticada: false`): ela já age
 * sobre o corpo (a mesma perda de saúde de uma condição sem tratamento), mas
 * a pessoa só percebe os sinais — e a tela "Você" os mostra, com o cuidado
 * possível (ir ao médico). Quem vai ao médico descobre cedo; quem ignora
 * pode descobrir tarde, num susto, e o tratamento rende menos. Quem tem
 * plano de saúde faz check-up com mais frequência (e descobre cedo mais vezes).
 *
 * Não é simulador médico: poucas condições, poucos estados, consequências
 * plausíveis em quem já lê o corpo (saúde, condicionamento, trabalho, escola,
 * treino, risco de morte, bem-estar) e uma linha na Linha da Vida quando algo
 * muda a vida (o diagnóstico, o susto, a remissão, o controle).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Condicao, Vida } from '../tipos';
import { escrever, idade, marcarFato, temFato } from '../nucleo';

/** Os sinais que o corpo dá antes de a condição ter nome (o que a pessoa percebe). */
export const SINAIS: Record<string, string> = {
  hipertensao: 'dores de cabeça que voltam e um cansaço sem explicação',
  diabetes: 'muita sede, cansaço e a vista embaçando de vez em quando',
  depressao: 'um desânimo que não passa e o sono bagunçado',
  ansiedade: 'aperto no peito e o coração disparando sem motivo',
  coluna: 'uma dor nas costas que não vai embora',
  cancer: 'um cansaço diferente e peso perdido sem querer'
};

export const semNome = (c: Condicao) => c.diagnosticada === false;

/** Condições de saúde mental (o cuidado é acompanhamento: psicólogo, UBS, CAPS). */
export const MENTAIS = new Set(['depressao', 'ansiedade']);

/**
 * Encaminhamento público para acompanhamento psicológico: quem tem uma
 * condição de saúde mental com nome é atendido pelo SUS (UBS, e CAPS/CAPSi nos
 * casos que pedem mais) — o dinheiro da casa não impede o cuidado.
 */
export const encaminhado = (v: Vida) => v.corpo.condicoes.some(c => MENTAIS.has(c.id) && diagnosticada(c));
export const diagnosticada = (c: Condicao) => c.diagnosticada !== false;

/** Os sinais percebidos agora (condições que ainda não têm nome). */
export function sinaisDoCorpo(v: Vida): { id: string; texto: string; desde: number }[] {
  return v.corpo.condicoes.filter(semNome).map(c => ({ id: c.id, texto: SINAIS[c.id] ?? 'um incômodo que não passa', desde: c.tInicio }));
}

/** Quanto uma condição séria pesa no desempenho do trabalho (sem tratamento pesa mais). */
export function pesoDaSaudeNoTrabalho(v: Vida): number {
  let p = 0;
  for (const c of v.corpo.condicoes) {
    if (!c.cronica) continue;
    if (c.gravidade >= 3) p += c.tratando ? 3 : 6;
    else if (c.gravidade >= 2) p += c.tratando ? 0.5 : 3;
    else if (c.id === 'coluna' && !c.tratando) p += 1.5;
  }
  return Math.min(8, p);
}

/** Dá nome à condição (no consultório ou no susto). Tarde: depois de anos de sinais (câncer: um ano). */
export function diagnosticar(v: Vida, c: Condicao, _como: 'consulta' | 'susto' | 'checkup'): boolean {
  if (diagnosticada(c)) return false;
  const anos = (v.t - c.tInicio) / 12;
  c.diagnosticada = true;
  c.tDiagnostico = v.t;
  c.tarde = c.id === 'cancer' ? anos >= 1 : anos >= 3;
  v.fatos[`diagnostico_${c.id}`] = v.t;
  return true;
}

const TEXTO_DIAGNOSTICO: Record<string, (tarde: boolean) => string> = {
  hipertensao: t => `A medição no consultório deu alta: pressão alta${t ? ', e pelo jeito há anos' : ''}. O médico falou em remédio para o resto da vida.`,
  diabetes: t => `O exame de sangue apontou diabetes${t ? ' — os sinais já vinham de tempos' : ''}. A comida da casa precisou mudar.`,
  depressao: () => 'Os meses pesados ganharam um nome no consultório: depressão.',
  ansiedade: () => 'As crises de falta de ar sem motivo tinham diagnóstico: ansiedade.',
  coluna: () => 'A dor nas costas virou hérnia de disco na ressonância.',
  cancer: t => (t ? 'Uma biópsia, uma palavra que ninguém quer ouvir: câncer. E já não era tão no começo.' : 'Um nódulo, uma biópsia, uma palavra que ninguém quer ouvir: câncer. Pego cedo, disse o médico.')
};

export function textoDoDiagnostico(c: Condicao): string {
  return (TEXTO_DIAGNOSTICO[c.id] ?? (() => `O médico deu nome ao que o corpo sentia: ${c.nome}.`))(!!c.tarde);
}

/** O diagnóstico entra na Linha da Vida (uma vez por condição). */
export function registrarDiagnostico(v: Vida, c: Condicao, como: 'consulta' | 'susto' | 'checkup'): string {
  const texto = como === 'susto' ? textoSusto(c) : textoDoDiagnostico(c);
  escrever(v, { texto, relevancia: c.gravidade >= 2 || c.tarde ? 'marco' : 'biografia', tema: 'saude', tom: 'ruim', escolha: como === 'consulta' });
  return texto;
}

function textoSusto(c: Condicao): string {
  return c.id === 'hipertensao' ? 'Passou mal de repente e foi parar no pronto-socorro: a pressão nas alturas. Os sinais vinham de anos.'
    : c.id === 'diabetes' ? 'Um mal-estar forte levou ao pronto-socorro: diabetes, descoberta tarde.'
      : c.id === 'cancer' ? 'Os sinais não passaram e vieram os exames: câncer — descoberto quando já não era tão no começo.'
        : c.id === 'coluna' ? 'Travou de dor e não levantou da cama: hérnia de disco.'
          : `O corpo obrigou a parar: ${c.nome}.`;
}

/**
 * Um ano de condições: o que não tem nome pode se revelar num susto (e o
 * corpo cobra); o que é tratado há tempo pode entrar em remissão ou em
 * controle. Chamado pelo corpo, antes da deriva da saúde do ano seguinte.
 */
export function evoluirCondicoes(v: Vida, r: Rng): void {
  const c = v.corpo;
  for (const cond of [...c.condicoes]) {
    if (!cond.cronica) continue;
    const anos = (v.t - cond.tInicio) / 12;
    if (semNome(cond)) {
      // Saúde mental de criança e adolescente: a família ou a escola pode perceber e levar à UBS — o que
      // dá nome e encaminha (acompanhamento pelo SUS, de graça), mas o acompanhamento em si ainda é escolha.
      if (idade(v) < 18 && MENTAIS.has(cond.id)) {
        if (r.chance(0.2)) {
          diagnosticar(v, cond, 'consulta');
          escrever(v, { texto: `${idade(v) < 12 ? 'A família percebeu' : 'Na escola, perceberam'} que algo não ia bem, e a família levou ao posto de saúde: ${cond.nome}. Veio o encaminhamento para acompanhamento pelo SUS.`, relevancia: 'biografia', tema: 'saude', tom: 'ruim' });
        }
        continue;
      }
      // Criança e adolescente: quem percebe e leva ao médico são os adultos da casa — e o tratamento vem com eles.
      if (idade(v) < 18 && r.chance(0.6)) {
        diagnosticar(v, cond, 'consulta');
        cond.tratando = true;
        escrever(v, { texto: `${textoDoDiagnostico(cond)} A família levou ao médico e o tratamento começou.`, relevancia: cond.gravidade >= 2 ? 'marco' : 'biografia', tema: 'saude', tom: 'ruim' });
        continue;
      }
      // Quem ignora os sinais: um dia o corpo obriga.
      const susto = cond.id === 'cancer' ? (anos >= 1 ? 0.45 : 0.15)
        : cond.id === 'hipertensao' || cond.id === 'diabetes' ? (anos >= 3 ? 0.14 : 0.03)
          : cond.id === 'coluna' ? (anos >= 2 ? 0.12 : 0.03) : 0;
      if (susto && r.chance(susto)) {
        diagnosticar(v, cond, 'susto');
        c.saude = clamp(c.saude - (cond.id === 'cancer' ? 6 : 8));
        v.fatos[`susto_${cond.id}`] = v.t;
        registrarDiagnostico(v, cond, 'susto');
        if (v.financas.planoDeSaude) cond.tratando = true;
      }
      continue;
    }
    if (!cond.tratando) continue;
    const tratandoHa = cond.tDiagnostico !== undefined ? (v.t - cond.tDiagnostico) / 12 : anos;
    // Câncer tratado: remissão possível depois de um ano de tratamento (descoberto tarde, menos).
    if (cond.id === 'cancer' && tratandoHa >= 1 && r.chance(cond.tarde ? 0.14 : 0.32)) {
      c.condicoes = c.condicoes.filter(x => x !== cond);
      marcarFato(v, 'remissao_cancer');
      escrever(v, { texto: `Terminou o tratamento do câncer: remissão.${cond.tarde ? ' Depois de tudo, quase ninguém acreditava.' : ' Ter descoberto cedo fez diferença.'}`, relevancia: 'marco', tema: 'saude', tom: 'bom' });
      continue;
    }
    if (cond.id === 'coluna' && tratandoHa >= 1 && r.chance(0.2)) {
      c.condicoes = c.condicoes.filter(x => x !== cond);
      escrever(v, { texto: 'Com a fisioterapia, a dor nas costas foi embora. Levou tempo.', relevancia: 'biografia', tema: 'saude', tom: 'bom' });
      continue;
    }
    // Crônica tratada há anos: controle — uma linha, uma vez.
    if ((cond.id === 'hipertensao' || cond.id === 'diabetes') && tratandoHa >= 2 && !temFato(v, `controle_${cond.id}`)) {
      marcarFato(v, `controle_${cond.id}`);
      escrever(v, { texto: cond.id === 'hipertensao' ? 'A pressão ficou controlada com o remédio de todo dia.' : 'O diabetes ficou sob controle: remédio, dieta, exame a cada seis meses.', relevancia: 'biografia', tema: 'saude', tom: 'bom' });
    }
  }
}

/** Plano de saúde: o check-up anual pega cedo parte do que ainda não tem nome. */
export function checkupDoPlano(v: Vida, r: Rng): void {
  if (!v.financas.planoDeSaude || idade(v) < 18) return;
  for (const cond of v.corpo.condicoes) {
    if (!semNome(cond) || !r.chance(0.35)) continue;
    diagnosticar(v, cond, 'checkup');
    cond.tratando = true;
    escrever(v, { texto: `O check-up do plano pegou: ${cond.nome}. O tratamento começou logo.`, relevancia: 'biografia', tema: 'saude', tom: 'neutro' });
  }
}

/** Perda de saúde de uma condição (descoberta tarde, o tratamento rende menos). */
export function perdaDaCondicao(cond: Condicao, perda: [number, number]): number {
  if (!cond.tratando) return perda[0];
  return cond.tarde ? perda[1] * 1.6 : perda[1];
}
