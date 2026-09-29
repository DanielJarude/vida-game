/**
 * Autonomia por idade — as regras num lugar só.
 *
 * Uma criança pequena quase não decide: a família e o contexto decidem por
 * ela. Uma criança maior tem preferências (pede para entrar no futebol, para
 * cortar o cabelo). O adolescente vai ganhando voz: escolhe atividades,
 * representa a turma, trabalha como aprendiz. O adulto responde por si. As
 * telas não inventam limites próprios: perguntam aqui.
 *
 * Nada disso é "idade = liberdade total": o dinheiro, a casa e a lei continuam
 * valendo — este módulo só diz o que a IDADE permite decidir.
 */

import type { Vida } from '../tipos';
import { idade } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export type Esfera =
  /** Pedir um corte, prender o cabelo, escolher a roupa do dia. */
  | 'aparencia_basica'
  /** Mudar de verdade: raspar, pintar, deixar crescer, estilo próprio. */
  | 'aparencia'
  /** Barba e bigode (o corpo precisa ter chegado lá). */
  | 'barba'
  /** Entrar numa atividade da escola (time, grêmio, olimpíada, projeto). */
  | 'atividade_escolar'
  /** Representar a turma (grêmio, centro acadêmico). */
  | 'representacao'
  /** Pedir ajuda em dinheiro à família (e responder por ela). */
  | 'pedir_ajuda'
  /** Pôr dinheiro nas contas de casa. */
  | 'contribuir'
  /** Comprar coisas pessoais com o próprio dinheiro (óculos, roupa, bicicleta). */
  | 'compra_pessoal'
  /** Decidir os gastos da casa, o padrão de vida. */
  | 'gastos_da_casa'
  /** Sair de casa, alugar, mudar de cidade, comprar imóvel. */
  | 'moradia';

/** A idade a partir da qual a pessoa decide isso (e o que diz a quem é mais novo). */
export const AUTONOMIA: Record<Esfera, { idade: number; antes: string }> = {
  aparencia_basica: { idade: 7, antes: 'Com essa idade, quem decide o corte e a roupa é a família.' },
  aparencia: { idade: 13, antes: 'Mudar o visual de verdade ainda passa pela família.' },
  barba: { idade: 16, antes: 'O rosto ainda não chegou lá.' },
  atividade_escolar: { idade: 7, antes: 'Na educação infantil, a escola é brincar — atividade é coisa do fundamental.' },
  representacao: { idade: 12, antes: 'Grêmio é a partir do fundamental II.' },
  pedir_ajuda: { idade: 16, antes: 'Criança não pede dinheiro emprestado à família: é a família que decide o que dá.' },
  contribuir: { idade: 16, antes: 'Não se aplica ainda.' },
  compra_pessoal: { idade: 12, antes: 'Com essa idade, as compras são dos adultos da casa.' },
  gastos_da_casa: { idade: 18, antes: 'Quem decide os gastos da casa são os adultos.' },
  moradia: { idade: 18, antes: 'Menor de idade não decide onde mora.' }
};

/** Em que fase de autonomia a pessoa está (para textos: "a família decide", "você pede", "você decide"). */
export type FaseDeAutonomia = 'familia_decide' | 'pede' | 'ganhando_voz' | 'decide';

export function faseDeAutonomia(i: number): FaseDeAutonomia {
  if (i < 7) return 'familia_decide';
  if (i < 12) return 'pede';
  if (i < 18) return 'ganhando_voz';
  return 'decide';
}

/** A idade permite decidir isso? (Só a idade: dinheiro, casa e lei são de quem pergunta.) */
export function autonomia(v: Vida, esfera: Esfera): Veredito {
  const a = AUTONOMIA[esfera];
  return idade(v) >= a.idade ? PERMITIDO : bloqueio('impossivel', a.antes);
}

export const pode = (v: Vida, esfera: Esfera) => idade(v) >= AUTONOMIA[esfera].idade;
