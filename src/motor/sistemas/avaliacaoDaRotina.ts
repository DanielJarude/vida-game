/**
 * REWORK 9.5 · ROT-01 — A ROTINA, LIDA EM TRÊS DIMENSÕES (fonte única de Minha Semana, da agenda, das atividades, da
 * escola, do trabalho, de Você e do fim do ano).
 *
 * O playtest viu, na mesma tela: estresse de 11% com "a cabeça está tranquila, sobra espaço para descansar", "semana
 * cheia", "mais atividades do que cabem" e "sobrecarga forte" — e a agenda cheia de horários livres. Eram três contas
 * que falavam da mesma coisa com palavras diferentes. Agora cada dimensão tem a sua conta, e as três não se misturam:
 *
 *   HORÁRIOS  — o que a agenda tem livre (`agenda.agendaDaSemana`): conflito é horário, não cansaço.
 *   EXIGÊNCIA — o que a rotina cobra do corpo e do tempo de descanso (`semana.encaixe`: duração × intensidade).
 *   CABEÇA    — o estresse (`mente.estresse`) e o que o move (`leituraDoEstresse`): a exigência MENTAL que passa do que
 *               cabe entra aqui, o prazer das atividades alivia, a vida de fora (dinheiro, luto, casa) também pesa.
 *
 * Uma semana movimentada com a cabeça tranquila é possível; uma semana vazia com a cabeça no limite também. A frase de
 * cima junta as três sem repetir nenhuma — e só diz o que o motor tem.
 */

import type { Vida } from '../tipos';
import { idade } from '../nucleo';
import { listaNatural } from '../texto';
import { encaixe, PALAVRA_DA_FAIXA, semana, type FaixaDaSemana } from './semana';
import { agendaDaSemana, type Agenda } from './agenda';
import { leituraDoEstresse, type NivelDeEstresse } from './leituraDoEstresse';
import { anosDeSobrecarga } from './sobrecarga';

export type PesoDaRotina = 'leve' | 'movimentada' | 'pesada';
export const PESO_DA_FAIXA: Record<FaixaDaSemana, PesoDaRotina> = { folgada: 'leve', ocupada: 'movimentada', cheia: 'movimentada', sobrecarregada: 'pesada', alem: 'pesada' };

export interface AvaliacaoDaRotina {
  horarios: {
    /** Horas livres na semana na janela em que essa pessoa faz atividade (criança: até 19h30). */
    livres: number;
    /** Os dias com um bloco livre de uma hora ou mais. */
    diasComFolga: number;
    conflitos: number;
    /** A janela dita (para a criança, "das 8h às 19h30"). */
    janela: string;
    texto: string;
  };
  exigencia: {
    faixa: FaixaDaSemana;
    palavra: string;
    peso: PesoDaRotina;
    /** O que mais exige (os maiores compromissos, pelo peso de verdade). */
    exige: string[];
    anos: number;
    texto: string;
  };
  cabeca: {
    valor: number;
    nivel: NivelDeEstresse;
    tendencia: 'subindo' | 'estável' | 'baixando';
    /** A causa que mais pesa (quando há). */
    pesa?: string;
    texto: string;
  };
  /** A leitura de cima: as três dimensões numa frase, sem repetir. */
  resumo: string;
}

const h = (hora: number, min = 0) => hora * 60 + min;
const janelaDa = (i: number): [number, number] => (i < 12 ? [h(8), h(19, 30)] : i < 16 ? [h(7), h(21, 30)] : [h(7), h(23)]);
const horaEmPalavras = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

/** As horas livres na janela da idade e quantos dias têm uma hora seguida livre. */
export function folgaNosHorarios(v: Vida, a: Agenda = agendaDaSemana(v)): { livres: number; diasComFolga: number; janela: string; porDia: number[] } {
  const [ini, fim] = janelaDa(idade(v));
  let minutos = 0;
  let dias = 0;
  const porDia: number[] = [];
  for (let d = 0; d < 7; d++) {
    let seguido = 0, maior = 0, doDia = 0;
    for (let t = ini; t < fim; t += 15) {
      const livre = !a.blocos.some(b => b.dias.includes(d as never) && t < b.fim && b.inicio < t + 15);
      if (livre) { minutos += 15; doDia += 15; seguido += 15; maior = Math.max(maior, seguido); } else seguido = 0;
    }
    porDia.push(doDia);
    if (maior >= 60) dias += 1;
  }
  return { livres: Math.round(minutos / 60), diasComFolga: dias, janela: `das ${horaEmPalavras(ini)} às ${horaEmPalavras(fim)}`, porDia };
}

export function avaliarRotina(v: Vida, a: Agenda = agendaDaSemana(v)): AvaliacaoDaRotina {
  const i = idade(v);
  const folga = folgaNosHorarios(v, a);
  const conflitos = a.conflitos.filter(c => c.perda >= 0.05).length;
  const textoHorario = conflitos ? `${conflitos === 1 ? 'Há um conflito de horário' : `Há ${conflitos} conflitos de horário`} na agenda.`
    : folga.diasComFolga >= 3 ? `Ainda há horários disponíveis: uns ${folga.livres} h livres na semana (${folga.janela}).`
      : folga.diasComFolga >= 1 ? `Sobram poucos horários livres (uns ${folga.livres} h, ${folga.janela}).`
        : 'Não sobra horário livre na semana: algo novo teria de tirar outra coisa do lugar.';

  const enc = encaixe(v, 0);
  const peso = PESO_DA_FAIXA[enc.faixa];
  const s = semana(v);
  const exige = [...s.fixos.filter(f => f.peso >= 0.4), ...s.rotinas.filter(r => r.peso >= 0.4)]
    .sort((x, y) => y.peso - x.peso).slice(0, 3)
    .map(x => { const t = x.rotulo.replace(/ \(.*\)$/, '').replace(/ — .*/, ''); return t.charAt(0).toLowerCase() + t.slice(1); });
  const anos = anosDeSobrecarga(v);
  const textoExigencia = enc.faixa === 'folgada' ? 'Rotina leve: sobra descanso.'
    : enc.faixa === 'ocupada' ? 'Rotina movimentada, dentro do que se aguenta.'
      : enc.faixa === 'cheia' ? 'Rotina exigente: já tira um pouco do descanso e do lazer.'
        : enc.faixa === 'sobrecarregada' ? `Rotina pesada: passa do que se aguenta descansando${anos >= 2 ? ` — há ${anos} anos assim` : ''}.`
          : 'Rotina além do que se aguenta: falta descanso.';
  // A sobrecarga dos anos anteriores ainda cobra (a saúde: `sobrecarga`), mesmo que a semana de agora seja mais leve.
  const herdada = anos >= 1 && enc.faixa !== 'sobrecarregada' ? ` ${anos === 1 ? 'O ano passado foi de sobrecarga' : `Vem de ${anos} anos de sobrecarga`}: o corpo ainda sente.` : '';

  const l = leituraDoEstresse(v);
  const pesa = l.pesando[0]?.texto;
  const bem = (l.nivel === 'baixo' || l.nivel === 'moderado') && l.tendencia !== 'subindo';
  const textoCabeca = l.nivel === 'baixo' ? (l.tendencia === 'subindo' ? 'A cabeça está tranquila, mas o que pesa vai fazer subir.' : 'A cabeça está tranquila.')
    : l.nivel === 'moderado' ? 'A cabeça dá conta.' : l.nivel === 'alto' ? 'A cabeça está carregada.' : 'A cabeça está no limite.';

  // A frase de cima: a exigência e a cabeça juntas; depois os horários; depois o que pesar, só quando muda alguma coisa.
  const causa = pesa ? `: ${pesa.charAt(0).toLowerCase()}${pesa.slice(1)}` : '';
  const primeira = peso === 'leve'
    ? (bem ? 'Sua rotina é leve, e a cabeça está tranquila.' : `A rotina é leve — o que pesa na cabeça vem de outro lugar${causa}.`)
    : peso === 'movimentada'
      ? (bem ? 'Sua rotina está movimentada, mas você está lidando bem com ela.' : `A rotina está movimentada, e a cabeça já sente${causa}.`)
      : (bem ? 'A rotina passa do que se aguenta descansando — por enquanto a cabeça segura, mas o cansaço cobra.' : 'A rotina passou do que se aguenta, e a cabeça está cobrando.');
  const segunda = conflitos ? textoHorario.replace(' na agenda.', ': a agenda mostra as saídas.') : folga.diasComFolga >= 3 ? 'Ainda há horários disponíveis.' : folga.diasComFolga >= 1 ? 'Sobram poucos horários livres.' : 'Não sobra horário livre.';
  const terceira = peso === 'movimentada' && folga.diasComFolga >= 1 ? (enc.faixa === 'cheia' ? 'Outra atividade intensa vai sair do descanso.' : 'Outra atividade intensa pode exigir mais descanso.')
    : peso === 'pesada' ? `Diminuir ou largar algo${exige.length ? ` (${listaNatural(exige.slice(0, 2))} são o que mais exige)` : ''} devolve o fôlego.` : '';
  const resumo = [primeira, segunda, terceira].filter(Boolean).join(' ');

  return {
    horarios: { livres: folga.livres, diasComFolga: folga.diasComFolga, conflitos, janela: folga.janela, texto: textoHorario },
    exigencia: { faixa: enc.faixa, palavra: PALAVRA_DA_FAIXA[enc.faixa], peso, exige, anos, texto: textoExigencia + herdada },
    cabeca: { valor: l.valor, nivel: l.nivel, tendencia: l.tendencia, pesa: i >= 6 ? pesa : undefined, texto: textoCabeca },
    resumo
  };
}
