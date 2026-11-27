/**
 * VIDA 38 · glossário: os nomes que o jogo usa, em uma frase cada. Só termos que existem no jogo (cada definição
 * corresponde à tela onde o termo aparece).
 */
import { Folha } from '../comum';

export const GLOSSARIO: { termo: string; definicao: string }[] = [
  { termo: 'Linha da Vida', definicao: 'A história da sua vida, ano a ano: o que aconteceu, o que você escolheu e o que foi decidido por você. Fica na área História.' },
  { termo: 'Minha Semana', definicao: 'Como você organiza o tempo: a agenda da semana, as práticas que você faz e o cansaço que isso dá.' },
  { termo: 'Caminhos', definicao: 'Estudos, trabalho e trajetória: o que está estudando, onde trabalha e para onde a carreira pode ir.' },
  { termo: 'Para gastar agora', definicao: 'O dinheiro que está disponível: a conta mais o que está aplicado. É o que você pode gastar hoje.' },
  { termo: 'Patrimônio', definicao: 'O que você tem, menos as dívidas: imóveis, veículos, coleção, empresas e aplicações. Objetos de uso do dia a dia não entram nesse total.' },
  { termo: 'Estresse', definicao: 'O cansaço e a pressão acumulados. Alto, afeta a saúde, o humor e as relações. Descanso, terapia e lazer ajudam a baixá-lo.' },
  { termo: 'Forma', definicao: 'O condicionamento físico. Treinos e esporte o aumentam, e ele pesa em situações que exigem o corpo: esporte, fugas e confrontos.' },
  { termo: 'Vínculo', definicao: 'A relação com uma pessoa: a proximidade, o convívio e a história em comum. Cresce com contato e cuidado; esfria com a distância.' },
  { termo: 'Conforto da casa', definicao: 'Quão boa é a casa onde você mora: o tamanho, os cômodos, o estado e o jardim. Afeta o descanso e o humor.' },
];

export function Glossario({ aoFechar }: { aoFechar: () => void }) {
  return (
    <Folha titulo="Glossário" rotulo="Glossário" aoFechar={aoFechar}>
      <dl className="glossario">
        {GLOSSARIO.map(g => (
          <div key={g.termo} className="glossario__item">
            <dt><strong>{g.termo}</strong></dt>
            <dd>{g.definicao}</dd>
          </div>
        ))}
      </dl>
    </Folha>
  );
}
