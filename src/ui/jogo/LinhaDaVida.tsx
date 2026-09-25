/**
 * A Linha da Vida: a biografia, não um log.
 *
 * O ano mais recente fica no alto (é o que o jogador acabou de viver); um
 * botão inverte para ler do começo, como um livro. Marcos têm peso visual;
 * o cotidiano aparece discreto; o técnico (rotina de dinheiro) nem aparece.
 * Anos sem nada não viram linhas vazias: viram silêncio.
 */

import { useMemo, useState } from 'react';
import type { Entrada, Vida } from '../../motor/tipos';
import { anosDaBiografia, faseDaVida } from '../apresentar';

export function LinhaDaVida({ vida, marca }: { vida: Vida; marca: number }) {
  const [doComeco, setDoComeco] = useState(false);
  const [discreto, setDiscreto] = useState(true);
  const anos = useMemo(() => anosDaBiografia(vida, discreto), [vida, discreto]);
  const idNovas = useMemo(() => new Set(vida.biografia.slice(marca).map(e => e.id)), [vida, marca]);
  const ordem = doComeco ? anos : [...anos].reverse();

  return (
    <div className="linha-da-vida">
      <div className="linha-da-vida__controles">
        <button type="button" className="botao botao--discreto" onClick={() => setDoComeco(d => !d)}>
          {doComeco ? 'Mais recente primeiro' : 'Ler do começo'}
        </button>
        <button type="button" className="botao botao--discreto" aria-pressed={!discreto} onClick={() => setDiscreto(d => !d)}>
          {discreto ? 'Só o que marcou' : 'Mostrar tudo'}
        </button>
      </div>
      <ol className="anos">
        {ordem.map((a, k) => {
          const anterior = ordem[k - 1];
          const salto = anterior ? Math.abs(anterior.idade - a.idade) : 1;
          const fase = faseDaVida(a.idade);
          const novoCapitulo = !anterior || faseDaVida(anterior.idade) !== fase;
          return (
            <li key={a.idade} className="ano">
              {novoCapitulo && <p className="ano__capitulo">{fase}</p>}
              {!novoCapitulo && salto > 2 && <p className="ano__silencio" aria-hidden>· · ·</p>}
              <h3 className="ano__cabeca">
                <span className="ano__idade">{a.idade === 0 ? 'Nascimento' : `${a.idade} ${a.idade === 1 ? 'ano' : 'anos'}`}</span>
                <span className="ano__calendario">{a.ano}</span>
              </h3>
              <ul className="entradas">
                {a.entradas.map(e => <ItemBiografia key={e.id} e={e} nova={idNovas.has(e.id)} />)}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ItemBiografia({ e, nova }: { e: Entrada; nova: boolean }) {
  return (
    <li className={`entrada entrada--${e.relevancia} entrada--tema-${e.tema}${nova ? ' entrada--nova' : ''}${e.tom ? ` entrada--${e.tom}` : ''}${e.escolha ? ' entrada--escolha' : ''}`}>
      <span className="entrada__marca" aria-hidden />
      <p className="entrada__texto">
        {e.texto}
        {e.escolha && <span className="entrada__escolha" title="Uma escolha sua"> sua escolha</span>}
      </p>
    </li>
  );
}
